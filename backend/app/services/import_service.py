"""Bank-statement CSV import with duplicate detection."""
import csv
import io
import logging
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Optional

from sqlmodel import Session, select

from app.models import Account, Transaction
from app.models.rule import Rule

logger = logging.getLogger(__name__)

MAX_IMPORT_ROWS = 10000

# Common statement date formats tried in order when none is specified
DATE_FORMATS = [
    "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d %b %Y", "%d-%b-%Y", "%Y/%m/%d",
]


def _parse_row_date(raw: str, date_format: Optional[str]) -> Optional[datetime]:
    raw = raw.strip()
    if not raw:
        return None
    if date_format:
        try:
            return datetime.strptime(raw, date_format)
        except ValueError:
            return None
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        pass
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def _parse_amount(raw: str) -> Optional[Decimal]:
    raw = raw.strip().replace(",", "").replace("₹", "").replace("$", "").replace("€", "").replace("£", "")
    if not raw:
        return None
    # Parenthesized amounts are debits on many statements: (123.45) → -123.45
    if raw.startswith("(") and raw.endswith(")"):
        raw = "-" + raw[1:-1]
    try:
        return Decimal(raw).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None


def import_transactions_csv(
    session: Session,
    user_id: str,
    account_id: str,
    content: bytes,
    date_column: str = "date",
    description_column: str = "description",
    amount_column: str = "amount",
    date_format: Optional[str] = None,
) -> dict:
    account = session.get(Account, account_id)
    if not account or account.user_id != user_id:
        raise ValueError("Account not found or access denied")
    if account.status == "Closed":
        raise ValueError(f"Account '{account.account_name}' is closed and cannot accept transactions")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError("CSV file has no header row")

    # Case-insensitive column resolution
    field_map = {name.strip().lower(): name for name in reader.fieldnames}
    missing = [c for c in (date_column, description_column, amount_column) if c.strip().lower() not in field_map]
    if missing:
        raise ValueError(
            f"Column(s) {missing} not found in CSV. Available columns: {reader.fieldnames}"
        )
    date_col = field_map[date_column.strip().lower()]
    desc_col = field_map[description_column.strip().lower()]
    amount_col = field_map[amount_column.strip().lower()]

    # Existing (date, amount, description) triplets for duplicate detection
    existing = session.exec(
        select(Transaction.transaction_date, Transaction.amount, Transaction.description)
        .where(Transaction.account_id == account_id)
    ).all()
    seen = {
        (tx_date.date() if isinstance(tx_date, datetime) else tx_date, amount, (desc or "").strip())
        for tx_date, amount, desc in existing
    }

    # Active categorization rules for this account
    rules = session.exec(
        select(Rule).where(Rule.account_id == account_id, Rule.is_active == True)
    ).all()
    matchers = [
        (config.get("description_contains", "").lower(), config.get("category_id"))
        for config in (r.configuration or {} for r in rules)
        if config.get("description_contains") and config.get("category_id")
    ]

    imported = 0
    skipped_duplicates = 0
    errors: list[str] = []

    for i, row in enumerate(reader, start=2):  # start=2: header is line 1
        if imported >= MAX_IMPORT_ROWS:
            errors.append(f"Import capped at {MAX_IMPORT_ROWS} rows; remaining rows were not processed")
            break

        tx_date = _parse_row_date(row.get(date_col, ""), date_format)
        amount = _parse_amount(row.get(amount_col, ""))
        description = (row.get(desc_col) or "").strip()[:255]

        if tx_date is None or amount is None or amount == 0:
            errors.append(f"Line {i}: could not parse date/amount")
            continue

        key = (tx_date.date(), amount, description)
        if key in seen:
            skipped_duplicates += 1
            continue
        seen.add(key)

        category_id = None
        desc_lower = description.lower()
        for needle, cat_id in matchers:
            if needle in desc_lower:
                category_id = cat_id
                break

        session.add(Transaction(
            account_id=account_id,
            amount=amount,
            currency=account.currency,
            description=description or None,
            category_id=category_id,
            transaction_date=tx_date,
        ))
        imported += 1

    session.commit()

    return {
        "imported": imported,
        "skipped_duplicates": skipped_duplicates,
        "errors": errors[:50],
        "error_count": len(errors),
    }
