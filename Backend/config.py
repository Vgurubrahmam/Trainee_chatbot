"""Application configuration — loads environment variables and validates them at import time."""

import os
from pathlib import Path
from dotenv import load_dotenv

# ── Load .env from the Backend directory ─────────────────────
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

# ── Gemini settings ──────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = "gemini-2.5-flash"

# ── Validation limits ────────────────────────────────────────
MAX_MESSAGE_LENGTH: int = 2000
MAX_HISTORY_MESSAGES: int = 40  # 20 conversational turns × 2 (user + model)

# ── Fail-fast startup check ──────────────────────────────────
if not GEMINI_API_KEY or GEMINI_API_KEY == "your_key_here":
    raise RuntimeError(
        "\n\n❌  GEMINI_API_KEY is not configured.\n"
        "    → Create  Backend/.env  with:  GEMINI_API_KEY=<your-key>\n"
        "    → Or export it as an environment variable.\n"
    )
