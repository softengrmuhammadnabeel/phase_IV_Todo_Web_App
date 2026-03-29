# Chat API Contract: Spec-4 AI Chatbot & MCP Integration

**Date**: 2026-02-07
**Feature**: 004-ai-chatbot-mcp

## Endpoint

### POST /api/{user_id}/chat

Stateless chat endpoint. Authenticated user sends a message and optionally a conversation_id to continue a thread. Server runs the agent with reconstructed context and returns the assistant reply.

---

## Authentication

- **Header**: `Authorization: Bearer <jwt_token>`
- **Rule**: user_id in the path MUST match the JWT subject (authenticated user).
- **401 Unauthorized**: Missing or invalid JWT.
- **403 Forbidden**: JWT valid but path user_id does not match JWT subject.

---

## Request

### Path Parameters

| Name    | Type   | Required | Description                    |
|---------|--------|----------|--------------------------------|
| user_id | string | Yes      | Must equal authenticated user  |

### Body (JSON)

| Field           | Type    | Required | Description                                      |
|-----------------|---------|----------|--------------------------------------------------|
| message         | string  | Yes      | User’s natural language message                  |
| conversation_id | integer | No       | If present, append to this conversation; else create new |

### Example

```json
{
  "message": "Add a task: buy milk",
  "conversation_id": 1
}
```

New conversation:

```json
{
  "message": "What are my tasks?"
}
```

---

## Response

### Success (200 OK)

| Field           | Type    | Description                              |
|-----------------|---------|------------------------------------------|
| conversation_id | integer | Id of the conversation (new or existing) |
| response        | string  | Assistant’s reply text                    |
| tool_calls      | array   | Optional list of tool call metadata      |

### Example

```json
{
  "conversation_id": 1,
  "response": "I've added \"buy milk\" to your tasks.",
  "tool_calls": []
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400    | Invalid body (e.g. missing or empty message) |
| 401    | Missing or invalid JWT |
| 403    | Path user_id does not match JWT |
| 404    | conversation_id provided but not found or not owned by user |
| 500    | Agent or internal error (body must not expose stack traces) |

Error body shape (consistent with existing API): e.g. `{"detail": "user-friendly message"}`.

---

## Behavior Summary

1. Validate JWT and path user_id.
2. If conversation_id is provided, load conversation and messages (user-scoped); if not found or wrong user → 404.
3. If no conversation_id, create a new conversation for that user.
4. Persist user message (user_id, conversation_id, role=user, content).
5. Load full message history for that conversation (ordered); build context; append new user message.
6. Run agent (with MCP tools); agent may call tools; persist assistant message (role=assistant, content).
7. Return 200 with conversation_id, response text, and optional tool_calls.

All persistence and tool execution are scoped to the authenticated user_id. No client-supplied user_id is trusted in the body.
