"""Pydantic schemas for the chat API request / response contract."""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field, field_validator

from config import MAX_MESSAGE_LENGTH, MAX_HISTORY_MESSAGES


# ── Shared ───────────────────────────────────────────────────

class Message(BaseModel):
    """A single turn in the conversation history."""

    role: Literal["user", "model"]
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)


# ── Request ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat request — new message + prior conversation turns."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=MAX_MESSAGE_LENGTH,
        description="The user's latest message",
    )
    history: List[Message] = Field(
        default_factory=list,
        description="Prior conversation turns, oldest first",
    )

    # Strip leading/trailing whitespace before length validation kicks in
    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    # Silently cap history to the most recent turns so oversized payloads
    # don't blow past Gemini's token limit or get rejected with a 422.
    @field_validator("history")
    @classmethod
    def cap_history(cls, v: list[Message]) -> list[Message]:
        if len(v) > MAX_HISTORY_MESSAGES:
            return v[-MAX_HISTORY_MESSAGES:]
        return v


# ── Responses ────────────────────────────────────────────────

class ChatResponse(BaseModel):
    """Successful chat reply."""

    reply: str


class ErrorResponse(BaseModel):
    """Error body returned on failures."""

    error: str
