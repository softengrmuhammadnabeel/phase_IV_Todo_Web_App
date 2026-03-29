# Frontend Chat API Contract: Spec-5 (Client Usage of Spec-4 Backend)

**Date**: 2026-02-07
**Feature**: 5-chatkit-frontend-agent

This document defines how the frontend uses the Spec-4 chat endpoint. The backend contract is in `specs/004-ai-chatbot-mcp/contracts/chat-api.md`.

---

## Endpoint Used by Frontend

**POST** `{API_BASE_URL}/api/{user_id}/chat`

- `API_BASE_URL`: From frontend env (e.g. `NEXT_PUBLIC_API_URL` or existing api-client base).
- `user_id`: Must be the authenticated user’s id (from auth context); same as JWT subject.

---

## Request (Frontend → Backend)

### Headers

| Header             | Value                        |
|--------------------|------------------------------|
| Authorization      | Bearer &lt;JWT&gt;           |
| Content-Type       | application/json             |

### Body (JSON)

| Field           | Type    | Required | Description                                  |
|-----------------|---------|----------|----------------------------------------------|
| message         | string  | Yes      | Non-empty user message                       |
| conversation_id | number \| null | No  | null for new thread; number to continue thread |

### Example

```json
{
  "message": "Create a task called buy milk",
  "conversation_id": null
}
```

Continue thread:

```json
{
  "message": "List my tasks",
  "conversation_id": 1
}
```

---

## Response (Backend → Frontend)

### Success (200)

| Field            | Type   | Description                    |
|------------------|--------|--------------------------------|
| conversation_id  | number | Use for next request in thread |
| response         | string | Assistant text to display      |
| tool_calls       | array  | Optional; do not render       |

Frontend MUST:

- Append one assistant message with `content = response`.
- Store `conversation_id` for subsequent requests (e.g. localStorage keyed by user_id).
- Ignore `tool_calls` for display.

### Error Responses

| Status | Frontend behavior                                      |
|--------|--------------------------------------------------------|
| 400    | Show validation error message; do not redirect         |
| 401    | Redirect to login or show “unauthorized”               |
| 403    | Redirect to login or show “access denied”               |
| 404    | Optional: clear stored conversation_id; show message  |
| 500    | Show generic error message and retry option            |

Never expose stack traces or internal error details.

---

## Full Backend API Support (CRUD via Chat)

The backend supports all five task operations via natural language. The frontend does not change the request shape per operation; it only sends the user’s message and optional conversation_id. Verification:

- **Create:** e.g. “Create a task called X” → backend creates task; response confirms; UI shows confirmation.
- **List:** e.g. “List my tasks” → backend returns list; response contains list/summary; UI shows it.
- **Complete:** e.g. “Complete task Y” → backend marks done; response confirms; UI shows confirmation.
- **Delete:** e.g. “Delete task Z” → backend deletes; response confirms; UI shows confirmation.
- **Update:** e.g. “Update task A to B” → backend updates; response confirms; UI shows confirmation.

Acceptance tests for Spec-5 MUST be able to verify that each of these operations can be triggered from the chat UI and that the UI reflects the backend outcome.
