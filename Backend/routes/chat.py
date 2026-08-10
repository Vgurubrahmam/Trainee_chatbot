"""Chat endpoint — validates requests and delegates to the Gemini service."""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.schemas import ChatRequest, ChatResponse, ErrorResponse
from services.gemini_service import get_gemini_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post(
    "/api/chat",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        502: {"model": ErrorResponse, "description": "Upstream AI failure"},
    },
    summary="Send a chat message",
    description=(
        "Accepts a user message with optional conversation history "
        "and returns a Gemini AI response."
    ),
)
async def chat(request: ChatRequest) -> ChatResponse | JSONResponse:
    """Process a chat message and return the AI's reply."""
    try:
        # Convert Pydantic models → plain dicts for the service layer
        history = [msg.model_dump() for msg in request.history]
        reply = await get_gemini_response(request.message, history)
        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error("Unhandled error in /api/chat: %s", type(e).__name__)
        return JSONResponse(
            status_code=502,
            content={
                "error": "Failed to get a response from the AI. Please try again later."
            },
        )
