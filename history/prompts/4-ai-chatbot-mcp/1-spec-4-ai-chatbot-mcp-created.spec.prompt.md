---
id: 1
title: Spec-4 AI Chatbot MCP Created
stage: spec
date: 2026-02-07
surface: agent
model: default
feature: 4-ai-chatbot-mcp
branch: 4-ai-chatbot-mcp
user: user
command: /sp.specify
labels: ["spec", "ai-chatbot", "mcp", "conversational-todo"]
links:
  spec: specs/4-ai-chatbot-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/4-ai-chatbot-mcp/spec.md
  - specs/4-ai-chatbot-mcp/checklists/requirements.md
tests:
  - N/A (spec phase)
---

## Prompt

/sp.specify # Spec-4: AI Chatbot & MCP Integration
## Conversational Todo Agent Backend

---

## Purpose

Spec-4 defines the AI-powered conversational backend of the Todo application. Its purpose is to allow authenticated users to manage todos through natural language, using an AI agent that reasons via MCP tools, while keeping the backend stateless, secure, and deterministic.

### This spec owns:
- AI reasoning and behavior
- MCP server and tool definitions
- Stateless chat request lifecycle
- Conversation persistence
- Secure, user-scoped execution

### This spec does NOT own:
- UI rendering
- Authentication flows
- Raw CRUD logic

---

## Scope

### In Scope
- Natural language todo management
- OpenAI Agents SDK integration
- MCP server built with Official MCP SDK
- Stateless FastAPI chat endpoint
- Conversation and message persistence
- Secure, user-scoped AI execution
- Chat API contract and behavior
- Error handling and recovery

### Out of Scope
- UI components and rendering (Spec-3)
- Signup / signin flows (Spec-2)
- Direct database CRUD ownership (Spec-1)
- Non-chat REST endpoints

---

## Architecture Overview
```
ChatKit UI
   │
   ▼
FastAPI Chat Endpoint (Stateless)
   │
   ▼
OpenAI Agents SDK (Agent + Runner)
   │
   ▼
MCP Server (Stateless Tools)
   │
   ▼
Database (Tasks, Conversations, Messages)
```

---

## Feature Set

### 1. Conversational Todo Management

The agent must support all basic todo operations via natural language:
- Create tasks
- List tasks (all / pending / completed)
- Complete tasks
- Delete tasks
- Update task title or description

Each successful operation must return a friendly confirmation message.

---

### 2. AI Agent System

- Uses OpenAI Agents SDK
- Agent executed via a dedicated runner
- Tool-based reasoning only
- No direct database access
- No in-memory memory or session state
- Language intent → MCP tool invocation mapping

---

### 3. MCP Server (Tool Layer)

#### General Rules
- Built using Official MCP SDK
- Tools are stateless
- All persistence handled via database
- `user_id` enforced in every tool

#### MCP Tools

| Tool | Purpose |
|------|---------|
| `add_task` | Create a new task |
| `list_tasks` | Retrieve tasks |
| `complete_task` | Mark task completed |
| `delete_task` | Remove a task |
| `update_task` | Modify task details |

Each tool:
- Accepts `user_id`
- Validates ownership
- Returns structured JSON responses

---

### 4. Stateless Chat Architecture

- FastAPI endpoint is fully stateless
- No in-memory sessions
- Conversation context reconstructed per request
- Safe across server restarts
- Horizontally scalable

---

### 5. Conversation Persistence

#### Models

**Conversation**
- `id`
- `user_id`
- `created_at`
- `updated_at`

**Message**
- `id`
- `user_id`
- `conversation_id`
- `role` (`user` / `assistant`)
- `content`
- `created_at`

All messages are stored in order and replayed on each request.

---

### 6. Secure, User-Scoped AI Actions

- Chat endpoint protected by JWT
- `user_id` enforced in:
  - Chat endpoint
  - MCP tools
  - Database queries
- Cross-user access is impossible by design

---

### 7. Chat API Contract

#### Endpoint
```
POST /api/{user_id}/chat
```

#### Request
```json
{
  "message": "string",
  "conversation_id": "integer (optional)"
}
```

#### Response
```json
{
  "conversation_id": 1,
  "response": "string",
  "tool_calls": []
}
```

---

### 8. Error Handling & Safety

- Task not found handled gracefully
- Invalid references detected
- Tool failures recovered cleanly
- AI fallback responses when actions fail
- No stack traces exposed

---

## Stateless Conversation Flow

1. Receive user message
2. Authenticate via JWT
3. Load conversation history
4. Append user message
5. Run agent with reconstructed context
6. Agent invokes MCP tools
7. Persist assistant response
8. Return response
9. Server holds no state

---

## Implementation Principles

- **Stateless by design**: No server-side sessions
- **Security first**: Every action is user-scoped
- **Deterministic**: Same input → same output
- **Recoverable**: Graceful degradation on errors
- **Testable**: Clear separation of concerns

---

## Success Criteria

Spec-4 is complete when:
- ✅ Users can manage todos via natural language
- ✅ All operations are user-scoped and secure
- ✅ Conversation history persists correctly
- ✅ System is stateless and horizontally scalable
- ✅ Error handling covers all edge cases
- ✅ MCP tools are properly isolated and tested

## Response snapshot

Created feature spec for **Spec-4: AI Chatbot & MCP Integration** (branch `4-ai-chatbot-mcp`). Short name: `ai-chatbot-mcp`. New spec at `specs/4-ai-chatbot-mcp/spec.md` with User Scenarios (4 stories), Functional Requirements (FR-001–FR-009), Key Entities, Success Criteria (SC-001–SC-006), Assumptions, and Out of Scope. Checklist at `specs/4-ai-chatbot-mcp/checklists/requirements.md` — all items validated. No [NEEDS CLARIFICATION] markers. Ready for `/sp.clarify` or `/sp.plan`. Git branch creation was skipped (repository not detected). PHR created.

## Outcome

- ✅ Impact: New feature spec and checklist added; ready for planning.
- 🧪 Tests: N/A (spec phase).
- 📁 Files: specs/4-ai-chatbot-mcp/spec.md, specs/4-ai-chatbot-mcp/checklists/requirements.md, history/prompts/4-ai-chatbot-mcp/1-spec-4-ai-chatbot-mcp-created.spec.prompt.md
- 🔁 Next prompts: /sp.plan or /sp.clarify for Spec-4.
- 🧠 Reflection: User input was detailed; spec structured to template with technology-agnostic success criteria where possible; MCP/agent concepts retained per user intent.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 positional parameter error in environment; feature dir and spec created manually.
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
