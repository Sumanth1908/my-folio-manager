# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo with three independent apps sharing one backend API:

- `backend/` — FastAPI + SQLModel API, Celery workers for scheduled automation
- `frontend/` — React 19 + TypeScript web app (Vite, Redux Toolkit, Tailwind)
- `mobile/` — Flutter app (Riverpod, GoRouter, Dio)

Note: the root `README.md` says PostgreSQL, but the actual database is **MySQL** (`mysql+pymysql`, see `docker-compose.yml` and `backend/app/core/database.py`). Trust the code over the README on this point.

## Common commands

### Infrastructure
```bash
docker-compose up -d          # MySQL + Redis
```

### Backend (from `backend/`)
```bash
poetry install
poetry run dev                 # dev server w/ reload, http://localhost:8000 (docs at /docs)
poetry run worker               # Celery worker
poetry run beat                 # Celery beat (scheduled interest accrual / rule execution)
poetry run pytest                       # run all tests
poetry run pytest tests/test_main.py::test_read_root   # run a single test
alembic revision --autogenerate -m "message"   # create a migration
alembic upgrade head                            # apply migrations
```
`isort` is a declared dev dependency but there's no repo-wide config for it or for a linter/formatter (no ruff/black config present) — match existing style rather than assuming a formatter will run.

### Frontend (from `frontend/`)
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint .
```
No test runner is configured for the frontend.

### Mobile (from `mobile/`)
```bash
flutter pub get
flutter run
dart run build_runner build --delete-conflicting-outputs   # regenerate .g.dart / .freezed.dart after model/provider changes
flutter test
```

## Backend architecture

**Unified account model, not subclasses.** `Account` (`backend/app/models/account.py`) is a single table for all account types (`SAVINGS`, `INVESTMENT`, `LOAN`, `FIXED_DEPOSIT`, `RECURRING_DEPOSIT`), keyed off `account_type`. Type-specific fields (interest rate, loan amount, maturity date, min balance, etc.) live in the `metadata_` JSON column rather than as dedicated columns. When adding type-specific behavior, branch on `account_type` and read/write `metadata_` — don't add new columns or a subclass hierarchy.

**Balances are never stored, only derived.** There is no `balance` column on `Account` (it was dropped — see `migrations/versions/47a4d3c2bf6b_drop_balance.py`). Every balance is computed on the fly via `select(func.sum(Transaction.amount))` (see `account_service.py`, `rules_service.py`, `summary_service.py`). `Transaction.amount` is a signed `Decimal` — positive for credits/deposits, negative for debits/withdrawals. Any new balance-related feature should query and sum transactions, not introduce a cached/stored balance.

**Rules are JSON-configured, not schema-heavy.** `Rule` (`backend/app/models/rule.py`) has a `rule_type` (`CATEGORIZATION`, `TRANSACTION`, `CALCULATION`) and a single `configuration` JSON blob instead of many nullable columns per rule type. `backend/app/services/rule_strategy.py` implements a strategy pattern (`RuleProcessorFactory.get_strategy`) that dispatches on `rule_type`:
- `CalculationRuleStrategy` evaluates a user-supplied formula string against a context built from the account's `metadata_` (balance, days, interest_rate, principal_amount, loan_amount, etc.) using `SafeEquationEvaluator`.
- `TransactionRuleStrategy` posts a fixed/derived transaction amount, optionally scaled by frequency (e.g. `DAILY`).

Formulas are evaluated by `backend/app/core/expression_engine.py`'s `SafeEquationEvaluator`, which parses expressions with `ast` and only permits a whitelisted set of operators/nodes — **never replace this with `eval()`**; it exists specifically to safely sandbox user-authored formulas.

`app/tasks/automation.py` + Celery beat drive scheduled rule execution (e.g. monthly interest accrual), keyed by each `Rule.next_run_at`.

**Request flow:** routers (`app/routers/*.py`, thin) → services (`app/services/*.py`, business logic) → SQLModel models (`app/models/*.py`). Pydantic request/response schemas live separately under `app/schemas/*.py`. New endpoints should follow this router → service → model separation rather than putting query/business logic directly in routers.

**Errors:** global exception handlers are registered in `app/main.py` (`app/core/exceptions.py`) for generic exceptions, validation errors, and SQLAlchemy errors — don't add local try/except-and-500 boilerplate in routers when the global handler already covers it.

**AI assistant:** `app/services/ai_agent.py` + `app/routers/assistant.py` integrate Google Gemini (`google-genai`) via `GOOGLE_API_KEY` in settings.

## Frontend architecture

- **State:** Redux Toolkit, one slice per domain under `src/store/slices/` (accounts, transactions, rules, currencies, summary, settings, categories, holdings, portfolio, converter, ui), combined in `src/store/index.ts`.
- **Routing:** `react-router-dom` in `App.tsx`, all pages lazy-loaded. Public routes (`/login`, `/register`) sit outside `AppLayout`; everything else is nested under `AppLayout` (which presumably enforces auth via `AuthContext`/`ProtectedRoute`).
- **API client:** `src/api.ts` is a single shared axios instance (`VITE_API_URL` env var, default `http://127.0.0.1:8000`, base path `/api/v1`). It attaches the JWT from `localStorage` on every request and force-redirects to `/login` on a 401. Use this instance for new API calls rather than creating separate axios clients.
- **Components** are organized by domain under `src/components/` (`account/` further split by account type: `savings`, `loan`, `fixed-deposit`, `recurring-deposit`, `investment`), plus shared `common/` and generic `ui/` primitives (built on Radix + `class-variance-authority`, Tailwind).

## Mobile architecture

- Feature-first structure under `lib/features/<feature>/` (accounts, auth, dashboard, onboarding, portfolio, settings, transactions), with cross-cutting code in `lib/core/` (api client, config, models, providers, router).
- Riverpod with code generation: providers are written as `@riverpod` annotated classes/functions with a paired generated `*.g.dart` file. Data models use `freezed`/`json_serializable` with paired `*.freezed.dart`/`*.g.dart` files. **Any change to a provider or model requires re-running** `dart run build_runner build --delete-conflicting-outputs` — generated files are checked in and must stay in sync.
- Routing via `go_router`, configured in `lib/core/router/app_router.dart` (also code-generated).
- Backend URL is user-configurable at runtime (onboarding screen prompts for it and stores it), not hardcoded — see `lib/core/config/app_config.dart` and `lib/features/onboarding/`.
