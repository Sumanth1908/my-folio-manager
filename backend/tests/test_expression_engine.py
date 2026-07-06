import pytest

from app.core.expression_engine import SafeEquationEvaluator


@pytest.fixture
def evaluator():
    return SafeEquationEvaluator()


def test_basic_arithmetic(evaluator):
    assert evaluator.evaluate("2 + 3 * 4") == 14.0
    assert evaluator.evaluate("(2 + 3) * 4") == 20.0
    assert evaluator.evaluate("2 ** 3") == 8.0
    assert evaluator.evaluate("-5 + 3") == -2.0


def test_interest_formula_with_context(evaluator):
    result = evaluator.evaluate(
        "balance * (interest_rate / 100) / 365 * days",
        {"balance": 36500.0, "interest_rate": 10.0, "days": 30},
    )
    assert result == pytest.approx(300.0)


def test_unknown_variable_raises(evaluator):
    with pytest.raises(ValueError, match="Unknown variable"):
        evaluator.evaluate("balance * bogus", {"balance": 1.0})


def test_function_calls_rejected(evaluator):
    with pytest.raises(ValueError):
        evaluator.evaluate("__import__('os').system('true')")
    with pytest.raises(ValueError):
        evaluator.evaluate("abs(-1)")


def test_division_by_zero_raises_value_error(evaluator):
    with pytest.raises(ValueError):
        evaluator.evaluate("1 / 0")


def test_empty_formula_returns_zero(evaluator):
    assert evaluator.evaluate("") == 0.0


def test_non_numeric_constant_rejected(evaluator):
    with pytest.raises(ValueError):
        evaluator.evaluate("'hello'")
