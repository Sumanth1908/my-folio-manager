"""
Assistant router for AI-powered financial chat.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.database import get_session
from app.deps import get_current_user
from app.models.user import User
from app.services import ai_agent

router = APIRouter()


class Message(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    conversation_history: Optional[List[Message]] = []


class ToolCall(BaseModel):
    """Information about a tool that was called."""
    tool: str
    args: dict
    result_summary: str


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    response: str
    tool_calls: List[ToolCall] = []


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to the AI financial assistant.
    
    The assistant can query your accounts, transactions, and portfolio
    to provide personalized financial insights and suggestions.
    """
    # Convert history to the format expected by ai_agent
    history = [{"role": msg.role, "content": msg.content} for msg in (request.conversation_history or [])]
    
    result = await ai_agent.chat(
        message=request.message,
        conversation_history=history,
        session=session,
        user_id=current_user.user_id
    )
    
    return ChatResponse(
        response=result["response"],
        tool_calls=[ToolCall(**tc) for tc in result.get("tool_calls", [])]
    )
