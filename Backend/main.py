"""FastAPI application entrypoint."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.chat import router as chat_router

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="AI Chatbot API",
    description="Multi-turn chatbot backend powered by Google Gemini 2.5 Flash",
    version="1.0.0",
)

# ── CORS — permissive for local dev, tighten before deploy ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "null",  # file:// protocol sends origin "null"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────
app.include_router(chat_router)


# ── Custom error handlers ───────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Convert Pydantic validation errors into our consistent {error} format."""
    errors = exc.errors()
    if errors:
        first = errors[0]
        field = first.get("loc", ["", "unknown"])[-1]
        msg = first.get("msg", "Invalid input")
        detail = f"Validation error on '{field}': {msg}"
    else:
        detail = "Invalid request. Please check your input."

    return JSONResponse(status_code=400, content={"error": detail})


# ── Health check ─────────────────────────────────────────────

@app.get("/", tags=["health"])
async def health_check():
    """Quick health-check / smoke-test endpoint."""
    return {"status": "ok", "message": "AI Chatbot API is running"}


# ── Direct execution ────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
