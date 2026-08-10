/* ============================================================
   GEMINI AI CHAT — CLIENT-SIDE LOGIC
   Manages conversation history, Gemini API calls, and UI state
   ============================================================ */

// ─── Configuration ──────────────────────────────────────────
// 🔧 DEPLOYMENT: Change this to your Render backend URL before deploying
//    e.g. "https://your-app-name.onrender.com"
const BACKEND_URL       = "https://trainee-chatbot.onrender.com/";
const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_MSGS  = MAX_HISTORY_TURNS * 2; // user + model per turn

// ─── State ──────────────────────────────────────────────────
let conversationHistory = []; // [{role:"user"|"model", content:string}, …]
let isLoading = false;

// ─── DOM references ─────────────────────────────────────────
const chatForm       = document.getElementById("chatForm");
const messageInput   = document.getElementById("messageInput");
const sendButton     = document.getElementById("sendButton");
const chatMessages   = document.getElementById("chatMessages");
const charCount      = document.getElementById("charCount");
const clearChatBtn   = document.getElementById("clearChat");
const welcomeMessage = document.getElementById("welcomeMessage");
const suggestionChips= document.getElementById("suggestionChips");

// ─── Event Listeners ────────────────────────────────────────
chatForm.addEventListener("submit", handleSubmit);
messageInput.addEventListener("input", updateCharCount);
clearChatBtn.addEventListener("click", handleClearChat);

// Suggestion chip clicks
if (suggestionChips) {
    suggestionChips.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const msg = chip.dataset.message;
        if (msg) {
            messageInput.value = msg;
            updateCharCount();
            chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
        }
    });
}

// Auto-focus
messageInput.focus();


// ═══════════════════════════════════════════════════════════
//  CORE HANDLERS
// ═══════════════════════════════════════════════════════════

async function handleSubmit(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    // Hide welcome screen
    hideWelcome();

    // Show user bubble immediately
    appendMessage("user", message);

    // Clear input
    messageInput.value = "";
    updateCharCount();

    // Loading state
    setLoading(true);
    const typingEl = showTypingIndicator();

    try {
        const res = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: conversationHistory,
            }),
        });

        removeElement(typingEl);

        if (!res.ok) {
            let errorMsg = "Something went wrong. Please try again.";
            try {
                const body = await res.json();
                errorMsg = body.error || body.detail || errorMsg;
            } catch { /* unparseable body */ }
            appendMessage("error", errorMsg);
            return;
        }

        const data = await res.json();
        appendMessage("ai", data.reply);

        // Persist the exchange into local history
        conversationHistory.push(
            { role: "user",  content: message },
            { role: "model", content: data.reply },
        );
        trimHistory();

    } catch (err) {
        removeElement(typingEl);
        appendMessage(
            "error",
            "Unable to reach the server. Please check your connection and try again."
        );
    } finally {
        setLoading(false);
        messageInput.focus();
    }
}

function handleClearChat() {
    conversationHistory = [];
    chatMessages.innerHTML = "";
    showWelcome();
    messageInput.focus();
}


// ═══════════════════════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Append a chat bubble (user | ai | error).
 */
function appendMessage(type, content) {
    const msg = document.createElement("div");
    msg.className = `message ${type}`;

    // Avatar
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = avatarSVG(type);

    // Bubble
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (type === "ai") {
        bubble.innerHTML = formatMarkdown(content);
    } else {
        bubble.textContent = content;
    }

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    scrollToBottom();
}

function avatarSVG(type) {
    const svgs = {
        user:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
        ai:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="#667eea"><path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"/></svg>',
        error: '<svg viewBox="0 0 24 24" width="16" height="16" fill="#f87171"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
    };
    return svgs[type] || svgs.error;
}

/**
 * Show the three-dot typing indicator inside an AI-style bubble.
 */
function showTypingIndicator() {
    const msg = document.createElement("div");
    msg.className = "message ai";
    msg.id = "typingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = avatarSVG("ai");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble typing-indicator";
    bubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    scrollToBottom();
    return msg;
}

function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
}

function setLoading(loading) {
    isLoading = loading;
    sendButton.disabled  = loading;
    messageInput.disabled = loading;
}

function updateCharCount() {
    const len = messageInput.value.length;
    charCount.textContent = `${len.toLocaleString()} / 2,000`;

    charCount.classList.remove("near-limit", "at-limit");
    if (len >= 2000)     charCount.classList.add("at-limit");
    else if (len > 1800) charCount.classList.add("near-limit");
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function trimHistory() {
    if (conversationHistory.length > MAX_HISTORY_MSGS) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY_MSGS);
    }
}

function hideWelcome() {
    if (welcomeMessage) welcomeMessage.style.display = "none";
}

function showWelcome() {
    // Re-create if removed, or just un-hide
    let el = document.getElementById("welcomeMessage");
    if (el) {
        el.style.display = "";
        return;
    }
    const section = document.createElement("div");
    section.className = "welcome-section";
    section.id = "welcomeMessage";
    section.innerHTML = `
        <div class="welcome-icon" aria-hidden="true">✨</div>
        <h2>Welcome to Gemini Chat</h2>
        <p>Ask me anything — I'm powered by Google's Gemini AI with multi-turn conversation memory.</p>
        <div class="suggestion-chips" id="suggestionChips">
            <button class="chip" data-message="Explain quantum computing in simple terms">Explain quantum computing</button>
            <button class="chip" data-message="Write a short poem about the night sky">Write a poem about the night sky</button>
            <button class="chip" data-message="What are 5 tips for better productivity?">Productivity tips</button>
        </div>
    `;
    chatMessages.appendChild(section);
}


// ═══════════════════════════════════════════════════════════
//  MARKDOWN FORMATTER  (lightweight, no external deps)
// ═══════════════════════════════════════════════════════════

function formatMarkdown(text) {
    if (!text) return "";

    // ── Pre-processing: fix common Gemini quirks before escaping ──
    // Fix "Examples:* item" → "Examples:\n* item"
    text = text.replace(/:\*\s+/g, ":\n* ");

    // 1 — Escape HTML entities
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 2 — Fenced code blocks  (```lang … ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trimEnd()}</code></pre>`;
    });

    // 3 — Inline code  (`…`)
    html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

    // 4 — Bold  (**…**)
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // 5 — Italic  (*…*)  — only mid-line, not at line start (to avoid clashing with * list items)
    html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");

    // 6 — Headings (explicit markdown #)
    html = html.replace(/^### (.+)$/gm, '<h4 class="md-heading">$1</h4>');
    html = html.replace(/^## (.+)$/gm,  '<h3 class="md-heading">$1</h3>');
    html = html.replace(/^# (.+)$/gm,   '<h2 class="md-heading">$1</h2>');

    // 6b — Bare section headers: lines that are short, end with ":", and stand alone
    //       e.g. "Types of AI:" or "Key Subfields & Techniques:"
    html = html.replace(/^([A-Z][^\n]{3,60}(?:\(.+?\))?):?\s*$/gm, (match, title) => {
        // Only promote if the line is JUST a title (no long sentences)
        const cleaned = title.replace(/:$/, "").trim();
        if (cleaned.split(" ").length <= 10) {
            return `<h3 class="md-heading">${cleaned}</h3>`;
        }
        return match;
    });

    // 7 — Horizontal rules (--- or ***)
    html = html.replace(/^[-*]{3,}\s*$/gm, '<hr class="md-hr">');

    // 8 — Unordered list items  (- item  or  * item  — with optional leading whitespace)
    html = html.replace(/^\s*[\-\*]\s+(.+)$/gm, "<li>$1</li>");

    // 9 — Ordered list items  (1. item, 2. item, …)
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>");

    // 10 — Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

    // 11 — Definition-style lines:  "Term: description…" → bold term
    //       Matches lines starting with a capitalized 1-4 word term followed by colon
    html = html.replace(/^(<br>)?([A-Z][A-Za-z\s&]{1,40}?):\s+(.+)$/gm,
        (_m, br, term, desc) => `${br || ""}<strong>${term}:</strong> ${desc}`
    );

    // 12 — Line breaks (skip inside <pre> blocks)
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/g);
    html = parts
        .map((part) => (part.startsWith("<pre") ? part : part.replace(/\n/g, "<br>")))
        .join("");

    return html;
}
