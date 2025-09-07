## LLM + MCP Chat (Go + FastMCP + React)

Simple, modular chat app that streams responses from an Ollama model via McpHost on the backend, and a React + Tailwind UI on the frontend. Python FastMCP registers MCP tools (e.g., a weather tool).

---

**What You Get**

- Go server that streams chunks from `PromptWithCallbacks` over SSE.
- Python FastMCP server exposing minimal tools (e.g., `current_weather`).
- React + Tailwind UI that streams and renders tokens live.

---

**Prerequisites**

- Go 1.21+
- Node.js 18+
- Python 3.9+
- Ollama installed and a model pulled (defaults to `llama3.1:8b`).

---

**1) Install Dependencies**

- Python FastMCP (for MCP tools):
  ```bash
  # optional but recommended
  python -m venv .venv
  # Windows PowerShell
  .venv\\Scripts\\Activate.ps1
  # macOS/Linux
  # source .venv/bin/activate

  pip install fastmcp
  ```

- Frontend:
  ```bash
  cd web
  npm install
  ```

---

**2) Configure McpHost**

Create a McpHost config in your home directory (Windows: `C:\Users\\<you>\\.mcphost.json`, macOS/Linux: `~/.mcphost.json`). Update the path to point at this repo’s `mcp-tools/server.py`.

```json
{
  "mcpServers": {
    "experimental-mcp-tools": {
      "type": "local",
      "command": "python",
      "args": [
        "-u",
        "C:\\Users\\<you>\\code\\llm-mcp-ui\\mcp-tools\\server.py"
      ]
    }
  }
}
```

macOS/Linux example:

```json
{
  "mcpServers": {
    "experimental-mcp-tools": {
      "type": "local",
      "command": "python3",
      "args": ["-u", "/home/<you>/code/llm-mcp-ui/mcp-tools/server.py"]
    }
  }
}
```

---

**3) Run Services**

In separate terminals:

- Start Ollama:
  ```bash
  ollama serve
  ```

- Start the Go backend (from repo root):
  ```bash
  go run server/main.go
  ```
  The server listens on `http://localhost:8080` and streams SSE from `/chat`.

- Start the React frontend:
  ```bash
  cd web
  npm run dev
  ```
  Open the shown `http://localhost:5173` URL.

---

**4) API (Streaming)**

Endpoint uses Server‑Sent Events (SSE) over POST.

```http
POST http://localhost:8080/chat
Content-Type: application/json

{ "message": "How is the weather in Stockholm?" }
```

Response is `text/event-stream`. Each chunk is an SSE frame:

```
data: Hello

data:  world

data: [DONE]
```

The frontend parses these frames and renders the assistant message incrementally.

---

**5) Change Model (Optional)**

- Edit `server/main.go: mustNewHost()` and replace:
  ```go
  &sdk.Options{ Model: "ollama:llama3.1:8b" }
  ```
  with your desired Ollama model (ensure it’s pulled via `ollama pull <model>`).

---

**Project Structure**

- `server/main.go` — HTTP server with `/chat` SSE endpoint.
- `mcp-tools/server.py` — FastMCP tool server (e.g., `current_weather`).
- `web/` — React app (Vite, Tailwind 3, TanStack Query).

---

**Troubleshooting**

- Vite plugin missing: install dev deps in `web/` (`npm install`).
- CORS: backend sets permissive CORS for POST/OPTIONS on `/chat`.
- McpHost not finding tools: verify the absolute path in `~/.mcphost.json` and Python availability (`python --version`).
- Windows path quoting: escape backslashes in JSON (e.g., `C:\\Users\\...`).

### Frontend

- A minimal React app lives in `web/` using Vite, Tailwind 3, and TanStack Query.
- It streams chunks from the `/chat` endpoint using fetch + SSE parsing.

Dev quickstart:

1. cd web
2. npm install
3. npm run dev
4. Open the shown localhost URL; ensure the Go server runs on :8080.


