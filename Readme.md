# Gemini AI Chatbot

A full-stack AI chatbot powered by **Google Gemini 2.5 Flash** with multi-turn conversation memory.

![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)

---

## Features

- **Multi-turn conversations** — the chatbot remembers context across messages (up to 20 turns)
- **Real-time streaming feel** — typing indicator while the AI generates a response
- **Markdown rendering** — AI responses render bold, italic, code blocks, lists, and headings
- **Dark glassmorphism UI** — premium dark theme with gradient accents, glass effects, and smooth animations
- **Suggestion chips** — quick-start prompts on the welcome screen
- **Input validation** — both client and server enforce message length limits (2,000 chars)
- **Error handling** — graceful fallbacks for network errors, empty responses, and safety filters
- **API key security** — key loaded from `.env`, never exposed in responses or logs

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Python · FastAPI · Pydantic       |
| AI       | Google Gemini 2.5 Flash (`google-genai` SDK) |
| Frontend | HTML5 · CSS3 · Vanilla JavaScript |
| Server   | Uvicorn (ASGI)                    |
| Font     | Inter (Google Fonts)              |

---

## Project Structure

```
Traniee_Assessment/
├── Backend/
│   ├── .env                  # GEMINI_API_KEY (not committed)
│   ├── requirements.txt
│   ├── config.py             # Env loading & validation
│   ├── main.py               # FastAPI app + CORS + error handlers
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response schemas
│   ├── routes/
│   │   └── chat.py           # POST /api/chat endpoint
│   └── services/
│       └── gemini_service.py # Gemini API wrapper
├── Frontend/
│   ├── index.html            # Chat UI markup
│   ├── style.css             # Dark glassmorphism design system
│   └── script.js             # Chat logic & markdown rendering
├── .gitignore
└── Readme.md
```

---

## Getting Started

### Prerequisites

- **Python 3.10+** installed
- A **Google Gemini API key** — get one at [aistudio.google.com](https://aistudio.google.com/)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Traniee_Assessment
```

### 2. Set up the backend

```bash
# Create and activate virtual environment
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure your API key

Edit `Backend/.env` and replace the placeholder:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

> ⚠️ **Never commit this file.** It is already in `.gitignore`.

### 4. Start the backend server

```bash
cd Backend
uvicorn main:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Verify: open [http://localhost:8000](http://localhost:8000) — you should see `{"status":"ok","message":"AI Chatbot API is running"}`.

### 5. Open the frontend

Open `Frontend/index.html` in your browser. If using VS Code, right-click → **Open with Live Server** (port 5500).

Alternatively, serve it with Python:

```bash
cd Frontend
python -m http.server 5500
```

Then open [http://localhost:5500](http://localhost:5500).

---

## API Reference

### `POST /api/chat`

Send a message with optional conversation history.

**Request body:**

```json
{
  "message": "Hello, what can you do?",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "model", "content": "Hello! How can I help?" }
  ]
}
```

| Field     | Type     | Required | Description                           |
|-----------|----------|----------|---------------------------------------|
| `message` | string   | ✅       | New user message (1–2000 chars)       |
| `history` | array    | ❌       | Prior turns, oldest first (max 40)    |

**Success response (200):**

```json
{
  "reply": "I'm Gemini, a large language model. I can help with..."
}
```

**Error response (400 / 502):**

```json
{
  "error": "Validation error on 'message': String should have at least 1 character"
}
```

---

## Interactive API Docs

With the backend running, visit:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## License

This project is for educational/assessment purposes.
