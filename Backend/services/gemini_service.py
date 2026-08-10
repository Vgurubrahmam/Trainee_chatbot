"""Gemini API integration layer — isolated from route/controller logic."""

import asyncio
import logging

from google import genai

from config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

# ── Initialise the client ONCE at module level ───────────────
client = genai.Client(api_key=GEMINI_API_KEY)

SAFETY_FALLBACK = (
    "I'm sorry, I wasn't able to generate a response for that message. "
    "This might be due to content safety filters. Please try rephrasing."
)


# ── Helpers ──────────────────────────────────────────────────

def _build_contents(
    message: str,
    history: list[dict] | None = None,
) -> list[dict]:
    """Assemble a multi-turn ``contents`` array for Gemini's API.

    Each element is a dict with ``role`` ("user" | "model") and
    ``parts`` ([{"text": "..."}]).
    """
    contents: list[dict] = []

    if history:
        for turn in history:
            contents.append({
                "role": turn["role"],
                "parts": [{"text": turn["content"]}],
            })

    # Append the new user message
    contents.append({
        "role": "user",
        "parts": [{"text": message}],
    })
    return contents


def _call_gemini(contents: list[dict]) -> str:
    """Synchronous Gemini call (executed in a thread by the async wrapper)."""
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
    )

    if not response or not response.text:
        logger.warning("Gemini returned an empty or blocked response.")
        return SAFETY_FALLBACK

    return response.text


# ── Public async API ─────────────────────────────────────────

async def get_gemini_response(
    message: str,
    history: list[dict] | None = None,
) -> str:
    """Send a user message (with conversation history) to Gemini.

    Returns the model's text reply.
    Raises on SDK / network errors so the caller can map them to HTTP codes.
    """
    contents = _build_contents(message, history)

    try:
        return await asyncio.to_thread(_call_gemini, contents)

    except Exception as e:
        # Redact the API key if it appears in the error message
        error_msg = str(e)
        if GEMINI_API_KEY and GEMINI_API_KEY in error_msg:
            error_msg = error_msg.replace(GEMINI_API_KEY, "[REDACTED]")
        logger.error("Gemini API error (%s): %s", type(e).__name__, error_msg)
        raise
