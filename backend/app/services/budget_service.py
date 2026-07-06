from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlmodel import Session, func, select

from app.models import Account, Budget, Category, Transaction


def _month_start(d: Optional[date] = None) -> date:
    d = d or datetime.now(timezone.utc).date()
    return date(d.year, d.month, 1)


def _next_month(d: date) -> date:
    return date(d.year + 1, 1, 1) if d.month == 12 else date(d.year, d.month + 1, 1)


def _spend_by_category(session: Session, user_id: str, category_ids: List[int], period_month: date) -> dict:
    """Per-category, per-currency spend within [period_month, next month).

    Spend = sum of debit (negative) transaction amounts, reported as a positive
    number. Accounts in a category can be in different currencies and we don't
    store historical FX rates, so this returns one figure per currency instead
    of blending them — the client converts using the live rate it already
    fetches elsewhere and compares the converted total against the
    (single-currency) budget amount.
    """
    if not category_ids:
        return {}

    rows = session.exec(
        select(Transaction.category_id, Transaction.currency, func.sum(Transaction.amount))
        .join(Account)
        .where(
            Account.user_id == user_id,
            Transaction.category_id.in_(category_ids),
            Transaction.amount < 0,
            Transaction.transaction_date >= period_month,
            Transaction.transaction_date < _next_month(period_month),
        )
        .group_by(Transaction.category_id, Transaction.currency)
    ).all()
    spend_by_category: dict[int, dict[str, Decimal]] = {}
    for category_id, currency, total in rows:
        spend_by_category.setdefault(category_id, {})[currency] = abs(total or Decimal("0.00"))
    return spend_by_category


def get_budgets_with_spend(session: Session, user_id: str, period_month: Optional[date] = None) -> List[dict]:
    """Budgets with the given month's spend per category, bucketed by currency."""
    period_month = _month_start(period_month)

    budgets = session.exec(
        select(Budget).where(Budget.user_id == user_id, Budget.period_month == period_month)
    ).all()
    if not budgets:
        return []

    category_ids = [b.category_id for b in budgets]
    spend_by_category = _spend_by_category(session, user_id, category_ids, period_month)

    categories = session.exec(select(Category).where(Category.category_id.in_(category_ids))).all()
    category_names = {c.category_id: c.name for c in categories}

    results = []
    for budget in budgets:
        spent_by_currency = spend_by_category.get(budget.category_id, {})
        results.append({
            "budget_id": budget.budget_id,
            "category_id": budget.category_id,
            "category_name": category_names.get(budget.category_id),
            "amount": float(budget.amount),
            "period_month": budget.period_month.strftime("%Y-%m"),
            "spent_by_currency": {c: float(v) for c, v in spent_by_currency.items()},
        })
    return results


def get_yearly_budgets(session: Session, user_id: str, year: int) -> List[dict]:
    """Per-category month-by-month budget/spend breakdown for a calendar year."""
    year_start = date(year, 1, 1)
    year_end = date(year + 1, 1, 1)

    budgets = session.exec(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.period_month >= year_start,
            Budget.period_month < year_end,
        )
    ).all()
    if not budgets:
        return []

    category_ids = sorted({b.category_id for b in budgets})
    categories = session.exec(select(Category).where(Category.category_id.in_(category_ids))).all()
    category_names = {c.category_id: c.name for c in categories}

    rows = session.exec(
        select(Transaction.category_id, Transaction.currency, Transaction.transaction_date, Transaction.amount)
        .join(Account)
        .where(
            Account.user_id == user_id,
            Transaction.category_id.in_(category_ids),
            Transaction.amount < 0,
            Transaction.transaction_date >= year_start,
            Transaction.transaction_date < year_end,
        )
    ).all()
    spend_by_category_month: dict[tuple[int, int], dict[str, Decimal]] = {}
    for category_id, currency, txn_date, amount in rows:
        key = (category_id, txn_date.month)
        spend_by_category_month.setdefault(key, {}).setdefault(currency, Decimal("0.00"))
        spend_by_category_month[key][currency] += abs(amount)

    budget_by_category_month: dict[tuple[int, int], Budget] = {
        (b.category_id, b.period_month.month): b for b in budgets
    }

    results = []
    for category_id in category_ids:
        months = []
        total_amount = Decimal("0.00")
        total_spent_by_currency: dict[str, Decimal] = {}
        for month in range(1, 13):
            budget = budget_by_category_month.get((category_id, month))
            spent_by_currency = spend_by_category_month.get((category_id, month), {})
            months.append({
                "period_month": f"{year}-{month:02d}",
                "amount": float(budget.amount) if budget else None,
                "spent_by_currency": {c: float(v) for c, v in spent_by_currency.items()},
            })
            if budget:
                total_amount += budget.amount
            for currency, amount in spent_by_currency.items():
                total_spent_by_currency[currency] = total_spent_by_currency.get(currency, Decimal("0.00")) + amount

        results.append({
            "category_id": category_id,
            "category_name": category_names.get(category_id),
            "months": months,
            "total_amount": float(total_amount),
            "total_spent_by_currency": {c: float(v) for c, v in total_spent_by_currency.items()},
        })
    return results


def upsert_budget(
    session: Session,
    user_id: str,
    category_id: int,
    amount: Decimal,
    period_month: date,
    apply_to_future_months: int = 0,
) -> Budget:
    category = session.get(Category, category_id)
    if not category or category.user_id != user_id:
        raise ValueError("Category not found")

    period_month = _month_start(period_month)
    target_months = [period_month]
    for _ in range(min(apply_to_future_months, 11)):
        period_month = _next_month(period_month)
        target_months.append(period_month)

    result_budget = None
    for month in target_months:
        budget = session.exec(
            select(Budget).where(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
                Budget.period_month == month,
            )
        ).first()
        if budget:
            budget.amount = amount
        else:
            budget = Budget(user_id=user_id, category_id=category_id, amount=amount, period_month=month)
        session.add(budget)
        if month == target_months[0]:
            result_budget = budget

    session.commit()
    session.refresh(result_budget)
    return result_budget


def delete_budget(session: Session, user_id: str, budget_id: int) -> bool:
    budget = session.exec(
        select(Budget).where(Budget.budget_id == budget_id, Budget.user_id == user_id)
    ).first()
    if not budget:
        return False
    session.delete(budget)
    session.commit()
    return True


def copy_forward_budgets(session: Session, target_month: Optional[date] = None) -> dict:
    """Carry last month's budget amount forward into target_month for any
    (user_id, category_id) that had a budget last month but none yet this month.
    """
    target_month = _month_start(target_month)
    previous_month = date(target_month.year - 1, 12, 1) if target_month.month == 1 \
        else date(target_month.year, target_month.month - 1, 1)

    previous_budgets = session.exec(
        select(Budget).where(Budget.period_month == previous_month)
    ).all()
    if not previous_budgets:
        return {"created": 0}

    existing_keys = {
        (b.user_id, b.category_id)
        for b in session.exec(select(Budget).where(Budget.period_month == target_month)).all()
    }

    created = 0
    for prev in previous_budgets:
        key = (prev.user_id, prev.category_id)
        if key in existing_keys:
            continue
        session.add(Budget(
            user_id=prev.user_id,
            category_id=prev.category_id,
            amount=prev.amount,
            period_month=target_month,
        ))
        existing_keys.add(key)
        created += 1

    session.commit()
    return {"created": created}
