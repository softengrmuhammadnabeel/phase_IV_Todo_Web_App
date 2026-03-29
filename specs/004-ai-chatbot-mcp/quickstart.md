# Quickstart Guide: AI Chatbot & MCP Integration (Spec-4)

**Date**: 2026-02-07
**Feature**: 004-ai-chatbot-mcp

## Prerequisites

- Python 3.9+
- Existing backend setup (Spec-1, Spec-2): FastAPI, SQLModel, Neon PostgreSQL, JWT auth
- OpenAI API key (for agent)
- Dependencies: Add OpenAI SDK and MCP SDK per plan (see below)

## Environment Variables

Add to `.env` (or existing backend env):

```env
# Existing (Spec-1, Spec-2)
DATABASE_URL=postgresql+asyncpg://...
BETTER_AUTH_SECRET=...
CORS_ORIGINS=http://localhost:3000

# Spec-4
OPENAI_API_KEY=sk-...
```

## Setup Steps

### 1. Install New Dependencies

From repo root, in backend environment:

```bash
cd backend
pip install openai   # or openai-agents-sdk if separate
pip install mcp      # or official MCP SDK package name per research
# Or add to requirements.txt and: pip install -r requirements.txt
```

Pin exact versions in `requirements.txt` after verification.

### 2. Run Migrations

Create and run Alembic migration for `conversations` and `messages` tables (see data-model.md):

```bash
cd backend
alembic revision -m "add_conversations_and_messages"
# Edit the migration file to add the two tables and indexes
alembic upgrade head
```

### 3. Start Backend

```bash
cd backend
uvicorn src.main:app --reload
```

Ensure chat route is registered in `main.py` (e.g. include router for `POST /api/{user_id}/chat`).

### 4. Obtain a JWT

Use existing auth (Spec-2): sign in via Better Auth and obtain a JWT. Use it in the Authorization header for chat requests.

### 5. Call Chat Endpoint

```bash
curl -X POST "http://localhost:8000/api/YOUR_USER_ID/chat" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task: buy milk"}'
```

Replace `YOUR_USER_ID` with the JWT subject (user id) and `YOUR_JWT` with the token. Response should include `conversation_id`, `response`, and optionally `tool_calls`.

### 6. Continue a Conversation

Use the same JWT and pass the returned `conversation_id`:

```bash
curl -X POST "http://localhost:8000/api/YOUR_USER_ID/chat" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "List my tasks", "conversation_id": 1}'
```

## Verification

- **New conversation**: Omit `conversation_id`; response has a new `conversation_id`.
- **Existing conversation**: Use returned `conversation_id`; assistant has context from previous messages.
- **Security**: Use another user’s JWT or wrong user_id in path → expect 401 or 403.
- **Errors**: Invalid conversation_id (or not owned by user) → 404; server errors → 500 with safe message, no stack trace.

## Project Layout (Spec-4 Additions)

- `backend/src/api/routes/chat.py` – Chat endpoint
- `backend/src/api/schemas/chat.py`, `conversation.py`, `message.py` – Schemas
- `backend/src/ai/agent.py`, `runner.py`, `mcp_server.py` – Agent and MCP
- `backend/src/models/conversation.py`, `message.py` – Models
- `backend/src/services/conversation_service.py`, `message_service.py` – Services
- `backend/tests/test_chat_endpoint.py`, `test_mcp_tools.py`, etc. – Tests

See plan.md for full structure.

## Next Steps

- Run `/sp.tasks` to generate tasks.md.
- Implement phases 1–8 from plan.md.
- Add integration tests and security tests; ensure >80% coverage and no cross-user access.
