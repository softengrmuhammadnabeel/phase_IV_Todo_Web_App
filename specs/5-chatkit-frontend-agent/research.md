# Research Findings: ChatKit Frontend & Agent Integration (Spec-5)

**Date**: 2026-02-07
**Feature**: 5-chatkit-frontend-agent

## 1. Chat API Client and Auth Integration

### Decision
Use the existing frontend API client pattern (e.g. fetch or axios with base URL from env) and attach the JWT from the existing auth context (Better Auth / session) to every chat request. Obtain user_id from the same auth context for the request path.

### Rationale
- Spec-2 already provides auth and JWT; Spec-5 must not implement new auth logic.
- Consistency with existing task-service and api-client reduces bugs and keeps one place for token handling.
- Backend expects Authorization: Bearer &lt;token&gt; and path user_id; frontend must supply both from trusted auth state.

### Alternatives Considered
- Dedicated chat API module with its own token refresh: adds complexity; existing auth is sufficient.
- Sending user_id in body: rejected; backend contract and constitution require path user_id and no client-supplied identity in body.

---

## 2. Conversation ID Persistence (Client-Side)

### Decision
Persist conversation_id in localStorage (or equivalent), keyed by user identifier so that each user’s current conversation is restored after reload. On first message of a session, send null; store the returned conversation_id for subsequent messages.

### Rationale
- Spec requires conversations to survive page reloads without server-side session on the frontend.
- Backend is stateless and does not track “current” conversation; the client must send conversation_id to continue a thread.
- Keying by user_id avoids mixing conversations if multiple users use the same browser (e.g. shared device).

### Alternatives Considered
- Session storage: would lose conversation on tab close; spec implies “page reload” continuity, so localStorage is preferred.
- No persistence: would break “conversation persists across reloads” acceptance criterion.

---

## 3. Loading, Error, and Retry Without Duplicate Messages

### Decision
On send: append user message to UI immediately (optimistic). Disable input and show typing indicator. On success: append assistant message, update conversation_id, clear loading. On error: show friendly message and retry control; do not append a duplicate user message on retry—resend the same message once and append assistant reply when successful.

### Rationale
- Prevents duplicate user/assistant pairs and keeps message order consistent with backend.
- Retry resends last user message; backend is idempotent for chat (same request → same response); no need to track “pending” message separately if we only append assistant message when we get a 2xx response.

### Alternatives Considered
- Not showing user message until backend responds: degrades UX (user expects immediate echo).
- Appending assistant message on retry without re-requesting: wrong; backend must process the message.

---

## 4. Full Backend API Support for All Five CRUD Operations

### Decision
Frontend does not implement different “modes” per operation. It sends every user utterance as a single message to POST /api/{user_id}/chat. The backend (Spec-4) interprets intent and performs create/list/complete/delete/update via MCP tools. Frontend responsibility: correct request/response handling, display of assistant text, and verification (tests or manual) that all five operations can be triggered and outcomes reflected (e.g. “Create a task called X” → task created and confirmation shown).

### Rationale
- Spec clarification requires full backend API support for create, list, complete, delete, update via natural language.
- Single endpoint and single message format keep the frontend simple; no operation-specific UI branches beyond displaying the assistant’s reply and handling errors.

### Alternatives Considered
- Separate frontend flows per operation: unnecessary; backend already handles intent.
- Frontend calling task CRUD endpoints directly for “list”: would bypass chat and duplicate logic; spec says chat is the interface for natural-language todo management.

---

## 5. Protected Chat Page and 401/403 Handling

### Decision
Use existing protected route or auth check (e.g. dashboard layout or page-level) so unauthenticated users are redirected to login. If the chat service receives 401 or 403, trigger the same redirect or show an “unauthorized” message and do not render chat content.

### Rationale
- Spec-5 and constitution require that only authenticated users access the chat page and that JWT is sent on every request.
- Reusing existing auth flow keeps behavior consistent with rest of app (e.g. dashboard tasks).

### Alternatives Considered
- Chat-specific auth wrapper: acceptable if it delegates to existing auth; no new auth logic.
- Showing chat UI and then redirecting on first 401: worse UX; redirect at page level when no token is better.
