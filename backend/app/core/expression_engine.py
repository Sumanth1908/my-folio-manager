import ast
import operator
import math
from typing import Dict, Any, Union

class SafeEquationEvaluator:
    """
    Safely evaluates mathematical expressions using Python's AST module.
    Avoids using eval() and restricts operations to a safe subset.
    """
    
    # Allowed operators
    OPERATORS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }
    
    def __init__(self, allowed_names: Dict[str, Any] = None):
        self.allowed_names = allowed_names or {}
        
    def evaluate(self, expression: str, context: Dict[str, Any] = None) -> float:
        """
        Evaluate a math expression with the given context.
        """
        if not expression:
            return 0.0
            
        # Merge global allowed names with request context
        names = {**self.allowed_names, **(context or {})}
        
        try:
            # Parse the expression into an AST
            tree = ast.parse(expression, mode='eval')
            return self._eval_node(tree.body, names)
        except Exception as e:
            raise ValueError(f"Invalid formula '{expression}': {str(e)}")

    def _eval_node(self, node: ast.AST, names: Dict[str, Any]) -> float:
        # 1. Number (Constant in Python 3.8+)
        if isinstance(node, ast.Constant): 
            if isinstance(node.value, (int, float)):
                return float(node.value)
            raise ValueError(f"Found non-numeric constant: {node.value}")
            
        # 2. Wrapper for older Python versions (Num) - active in some envs
        if isinstance(node, ast.Num):
            return float(node.n)

        # 3. Binary Operations (Left op Right)
        if isinstance(node, ast.BinOp):
            left = self._eval_node(node.left, names)
            right = self._eval_node(node.right, names)
            op_type = type(node.op)
            if op_type in self.OPERATORS:
                return self.OPERATORS[op_type](left, right)
            raise ValueError(f"Unsupported operator: {op_type}")

        # 4. Unary Operations (-Value)
        if isinstance(node, ast.UnaryOp):
            operand = self._eval_node(node.operand, names)
            op_type = type(node.op)
            if op_type in self.OPERATORS:
                return self.OPERATORS[op_type](operand)
            raise ValueError(f"Unsupported unary operator: {op_type}")

        # 5. Variables (Name)
        if isinstance(node, ast.Name):
            if node.id in names:
                return float(names[node.id])
            raise ValueError(f"Unknown variable: '{node.id}'")

        raise ValueError(f"Unsupported operation: {type(node).__name__}")
