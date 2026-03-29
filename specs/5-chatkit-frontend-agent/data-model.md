# Data Model: ChatKit Frontend & Agent Integration (Spec-5)

**Date**: 2026-02-07
**Feature**: 5-chatkit-frontend-agent

This feature is frontend-only. The “data model” here describes **client-side state and payloads** only. Backend entities (Conversation, Message, Task) are defined in Spec-4 and Spec-1.

---

## Client-Side State (UI / Hook)

### Chat message (display)

| Field   | Type   | Description                          |
|---------|--------|--------------------------------------|
| role    | string | `"user"` \| `"assistant"`           |
| content | string | Message text to render               |

- **Source**: User input (user) or backend response `response` (assistant).
- **Order**: Strictly preserved; user message appended on send, assistant message appended on successful response.
- **Rule**: Tool calls and internal metadata are not rendered; only `content` is shown.

### Conversation identifier (persisted)

| Concept            | Type   | Description                                      |
|--------------------|--------|--------------------------------------------------|
| conversation_id    | number | Backend-returned id for the current thread       |
| storage key        | string | e.g. `chat_conversation_${user_id}` (per user)   |

- **Lifecycle**: null until first response; then set from response and persisted (e.g. localStorage); restored on load for same user.
- **Validation**: If backend returns 404 for a stored conversation_id, frontend can clear it and send null on next message (new conversation).

### Chat request payload (outbound)

| Field            | Type    | Required | Description                    |
|------------------|---------|----------|--------------------------------|
| message          | string  | Yes      | User’s natural language input  |
| conversation_id  | number \| null | No  | null for new thread; number to continue |

### Chat response payload (inbound)

| Field            | Type    | Description                    |
|------------------|---------|--------------------------------|
| conversation_id  | number  | New or existing conversation  |
| response         | string  | Assistant reply text           |
| tool_calls       | array   | Optional; not rendered in UI   |

---

## Relationships

- **User (auth)** → has one current conversation_id (stored per user).
- **Chat messages (UI)** → ordered list for one conversation; each has role and content only.
- **Backend** → source of truth for conversation and messages; frontend does not store message history beyond what is displayed in the current session (reload can start from stored conversation_id and backend returns history when needed for context; Spec-4 handles that).

---

## Validation Rules (Frontend)

- `message` non-empty before send.
- `conversation_id` from backend only; never from user input.
- On 401/403, do not render or retain sensitive data; redirect or show unauthorized.
- On success, append exactly one assistant message per request; no duplicate messages on retry.
