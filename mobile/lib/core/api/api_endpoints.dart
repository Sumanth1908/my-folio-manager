/// Centralized API endpoint constants.
/// Maps 1:1 to the FastAPI routers in backend/app/routers/.
class ApiEndpoints {
  ApiEndpoints._();

  // ── Auth (/auth/*) ────────────────────────────────────────────────────────
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const me = '/auth/me';
  static const changePassword = '/auth/change-password';

  // ── Accounts (/accounts/*) ────────────────────────────────────────────────
  static const accounts = '/accounts/';
  static String account(String id) => '/accounts/$id';

  // ── Transactions (/transactions/*) ────────────────────────────────────────
  static const transactions = '/transactions/';
  static String transaction(int id) => '/transactions/$id';

  // ── Holdings (/holdings/*) ────────────────────────────────────────────────
  static const holdings = '/holdings/';
  static String holding(int id) => '/holdings/$id';
  static String sellHolding(int id) => '/holdings/$id/sell';
  static const refreshPrices = '/holdings/refresh-prices';

  // ── Portfolio ─────────────────────────────────────────────────────────────
  static const portfolioSummary = '/portfolio/summary';

  // ── Summary ───────────────────────────────────────────────────────────────
  static const accountsSummary = '/summary/accounts';

  // ── Settings ──────────────────────────────────────────────────────────────
  static const settings = '/settings';

  // ── Currencies ────────────────────────────────────────────────────────────
  static const currencies = '/currencies/';

  // ── Categories ────────────────────────────────────────────────────────────
  static const categories = '/categories/';

  // ── Rules ─────────────────────────────────────────────────────────────────
  static const rules = '/rules/';
  static String rule(int id) => '/rules/$id';
  static String executeRule(int id) => '/rules/$id/execute';

  // ── Jobs ──────────────────────────────────────────────────────────────────
  static const runJobs = '/jobs/run';

  // ── Data ──────────────────────────────────────────────────────────────────
  static const exportData = '/data/export';
  static const importData = '/data/import';

  // ── Assistant ─────────────────────────────────────────────────────────────
  static const assistantChat = '/assistant/chat';
}
