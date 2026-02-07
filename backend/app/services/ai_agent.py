"""
AI Agent service that uses existing services as tools to provide financial insights.
Uses Google Gemini for natural language understanding and response generation.
"""
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types
from sqlmodel import Session

from app.core.config import settings
from app.services import (account_service, category_service, portfolio_service,
                          summary_service, transaction_service)

logger = logging.getLogger(__name__)

# Initialize Gemini Client
client = None
if settings.GOOGLE_API_KEY:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)


# Tool definitions for Gemini function calling
TOOLS = [
    {
        "name": "get_all_accounts",
        "description": "Get a list of all user's financial accounts with their current balances. Includes savings accounts, loan accounts, investment accounts, and fixed deposits.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_recent_transactions",
        "description": "Get recent transactions for the user. Can filter by account, category, date range, or search term.",
        "parameters": {
            "type": "object",
            "properties": {
                "account_id": {
                    "type": "string",
                    "description": "Optional account ID to filter transactions"
                },
                "category_id": {
                    "type": "integer", 
                    "description": "Optional category ID to filter transactions"
                },
                "days_back": {
                    "type": "integer",
                    "description": "Number of days to look back (default: 30)"
                },
                "search": {
                    "type": "string",
                    "description": "Optional search term for transaction descriptions"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of transactions to return (default: 20)"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_spending_summary",
        "description": "Get a summary of spending and income by category for specified account types and date range.",
        "parameters": {
            "type": "object",
            "properties": {
                "account_types": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Account types to include: SAVINGS, LOAN, INVESTMENT, FIXED_DEPOSIT"
                },
                "days_back": {
                    "type": "integer",
                    "description": "Number of days to look back (default: 30)"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_portfolio_summary",
        "description": "Get investment portfolio summary including total value, profit/loss, and individual holdings.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_categories",
        "description": "Get all transaction categories available for the user.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]


def _serialize_for_json(obj: Any) -> Any:
    """Convert objects to JSON-serializable format."""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, 'model_dump'):
        return _serialize_for_json(obj.model_dump())
    elif isinstance(obj, dict):
        return {k: _serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_serialize_for_json(item) for item in obj]
    return obj


def execute_tool(
    tool_name: str,
    args: Dict[str, Any],
    session: Session,
    user_id: str
) -> Dict[str, Any]:
    """Execute a tool and return the result."""
    try:
        if tool_name == "get_all_accounts":
            accounts, total = account_service.get_accounts(session, user_id, skip=0, limit=50)
            enriched = [account_service.enrich_account(session, acc) for acc in accounts]
            return {
                "success": True,
                "data": _serialize_for_json([e.model_dump() for e in enriched]),
                "total": total
            }
        
        elif tool_name == "get_recent_transactions":
            days_back = args.get("days_back", 30)
            limit = args.get("limit", 20)
            start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
            
            transactions, total = transaction_service.get_transactions(
                session=session,
                user_id=user_id,
                skip=0,
                limit=limit,
                account_id=args.get("account_id"),
                search=args.get("search"),
                category_id=args.get("category_id"),
                start_date=start_date
            )
            enriched = [transaction_service.enrich_transaction(session, tx) for tx in transactions]
            return {
                "success": True,
                "data": _serialize_for_json([e.model_dump() for e in enriched]),
                "total": total
            }
        
        elif tool_name == "get_spending_summary":
            days_back = args.get("days_back", 30)
            account_types = args.get("account_types")
            from_date = datetime.now() - timedelta(days=days_back)
            
            summary = summary_service.get_accounts_summary(
                session=session,
                user_id=user_id,
                account_types=account_types,
                from_date=from_date
            )
            return {
                "success": True,
                "data": _serialize_for_json(summary.model_dump())
            }
        
        elif tool_name == "get_portfolio_summary":
            portfolio = portfolio_service.get_portfolio_summary(session, user_id)
            return {
                "success": True,
                "data": _serialize_for_json(portfolio.model_dump())
            }
        
        elif tool_name == "get_categories":
            categories = category_service.get_categories(session, user_id)
            return {
                "success": True,
                "data": _serialize_for_json([c.model_dump() for c in categories])
            }
        
        else:
            return {"success": False, "error": f"Unknown tool: {tool_name}"}
            
    except Exception as e:
        logger.error(f"Tool execution error: {tool_name} - {e}")
        return {"success": False, "error": str(e)}


SYSTEM_PROMPT = """You are a helpful financial assistant for a personal finance management application called "My Folio Manager". 

Your role is to:
1. Answer questions about the user's accounts, transactions, and portfolio
2. Provide financial insights and suggestions based on their data
3. Help with budgeting advice and spending analysis
4. Explain financial concepts in simple terms

You have access to tools that query the user's actual financial data. Use these tools to provide accurate, data-driven responses.

Guidelines:
- Be concise but informative
- Format currency values nicely (e.g., $1,234.56)
- When showing lists, use bullet points or tables for clarity  
- If you don't have enough data to answer, say so
- Never make up numbers - only use data from the tools
- Provide actionable suggestions when appropriate
- Be encouraging about positive financial behaviors

The user's data is private and secure. You are only showing them their own information."""


async def chat(
    message: str,
    conversation_history: List[Dict[str, str]],
    session: Session,
    user_id: str
) -> Dict[str, Any]:
    """
    Process a chat message and return AI response.
    
    Args:
        message: User's message
        conversation_history: Previous messages in format [{"role": "user"|"assistant", "content": str}]
        session: Database session
        user_id: Current user's ID
        
    Returns:
        Dict with "response" text and optional "tool_calls" list
    """
    if not settings.GOOGLE_API_KEY:
        return {
            "response": "AI assistant is not configured. Please set the GOOGLE_API_KEY environment variable.",
            "tool_calls": []
        }
    
    if not client:
        return {
            "response": "AI assistant client could not be initialized. Please check your GOOGLE_API_KEY.",
            "tool_calls": []
        }

    try:
        # Build conversation history for Gemini
        gemini_history = []
        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
        
        # Create chat session
        chat_session = client.chats.create(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[types.Tool(function_declarations=TOOLS)]
            ),
            history=gemini_history
        )
        
        # Send message
        response = chat_session.send_message(message)
        tool_calls_made = []
        
        # Handle function calls iteratively
        # In the new SDK, we need to check response.candidates[0].content.parts for function calls
        while response.candidates and response.candidates[0].content.parts:
            parts = response.candidates[0].content.parts
            found_fc = False
            
            for part in parts:
                if part.function_call:
                    found_fc = True
                    fc = part.function_call
                    tool_name = fc.name
                    tool_args = fc.args
                    
                    logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
                    
                    # Execute the tool
                    result = execute_tool(tool_name, tool_args, session, user_id)
                    tool_calls_made.append({
                        "tool": tool_name,
                        "args": tool_args,
                        "result_summary": f"Retrieved {len(result.get('data', []))} items" if isinstance(result.get('data'), list) else "Data retrieved"
                    })
                    
                    # Send tool result back to Gemini
                    response = chat_session.send_message(
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": result}
                        )
                    )
                    break # Restart loop with new response
            
            if not found_fc:
                break
        
        # Extract final text response
        final_response = ""
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.text:
                    final_response += part.text
        
        return {
            "response": final_response or "I couldn't generate a response. Please try again.",
            "tool_calls": tool_calls_made
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {
            "response": f"I encountered an error processing your request. Please try again. Error: {str(e)}",
            "tool_calls": []
        }
