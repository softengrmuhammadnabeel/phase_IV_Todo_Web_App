# Research Findings: AI Chatbot & MCP Integration

**Date**: 2026-02-07
**Feature**: 004-ai-chatbot-mcp

## 1. OpenAI Agents SDK (Python)

### Decision
Use the OpenAI Agents SDK for Python to run the conversational agent with tool-calling support.

### Rationale
- Aligns with Spec-4 requirement for an AI agent that uses tool-based reasoning.
- Supports registration of tools and stateless execution (no built-in session storage).
- Compatible with OpenAI API (GPT-4o / gpt-4o-mini) for chat completions and tool use.
- Runner pattern allows: load messages → build messages array → run → return response; no server-side state.

### Alternatives Considered
- Raw OpenAI Chat Completions API: more manual tool wiring; SDK abstracts tool schema and execution.
- LangChain/LlamaIndex: heavier stack; constitution favors predictability and minimal complexity.
- Custom agent loop: possible but reinvents tool-calling and increases maintenance.

### Implementation Notes
- Agent instructions (system prompt) define task-management assistant behavior.
- Model: gpt-4o or gpt-4o-mini; temperature 0.7 for natural but consistent replies.
- Tools are invoked by the model; backend executes tool implementations (MCP layer) and returns results to the agent.

---

## 2. Official MCP SDK (Python)

### Decision
Use the Official MCP SDK for Python to define and expose stateless tools (add_task, list_tasks, complete_task, delete_task, update_task).

### Rationale
- Spec-4 explicitly requires "MCP server built with Official MCP SDK."
- MCP provides a standard tool schema (name, description, parameters); agent SDK can consume tools in a consistent way.
- Stateless tools: each invocation receives user_id and arguments; persistence is via existing TaskService and new Conversation/Message services.
- Clear separation: MCP layer = tool interface; backend services = data access.

### Alternatives Considered
- Custom tool layer (plain functions): works but diverges from Spec-4’s MCP requirement.
- In-process only: MCP can run in-process with FastAPI; no separate MCP server process required for single-app deployment.

### Implementation Notes
- Tools accept user_id (injected by backend from JWT, never from request body).
- Each tool calls TaskService (or conversation/message services where applicable) with user_id.
- Return structured JSON (e.g. `{"success": true, "task": {...}}`) for agent to interpret and turn into user-facing reply.

---

## 3. Stateless Conversation Context

### Decision
Reconstruct conversation context on every request from persisted messages; no in-memory session or cache.

### Rationale
- Spec-4 requires stateless chat endpoint and horizontal scalability.
- Load messages by conversation_id (and user_id) in order; build messages array for the agent; append new user message; run agent; persist assistant message; return.
- Same input + same DB state → same output (deterministic aside from model non-determinism).

### Alternatives Considered
- In-memory session store: violates stateless requirement and complicates scaling.
- Caching recent messages: adds state and invalidation; not required for MVP.

### Implementation Notes
- Optional context window limit (e.g. last N messages) to avoid token limits; document in implementation.
- Conversation and message tables owned by this spec; Task table remains Spec-1.

---

## 4. User Identity and Security

### Decision
Single source of identity: JWT verified in chat endpoint; extracted user_id passed to runner and injected into every MCP tool; path user_id must match JWT.

### Rationale
- Constitution: "User identity is extracted exclusively from verified JWTs" and "User ID in the request path must match the authenticated JWT user ID."
- MCP tools receive user_id from the backend only; never from agent or client input.
- Conversation and message services filter all queries by user_id.

### Alternatives Considered
- Trusting user_id from request body: rejected (constitution: backend must not trust client-provided user identity).

---

## 5. Error Handling and Safety

### Decision
Tool and agent errors map to user-friendly messages; no stack traces or internal errors in API responses; fallback responses when agent or tool fails.

### Rationale
- Spec-4 and plan require graceful degradation and no exposed internals.
- Task not found, invalid ID, DB errors → structured tool response or agent fallback (e.g. "I couldn't find that task").
- OpenAI/network errors → retry or generic "Something went wrong" and log server-side.

### Implementation Notes
- Consistent chat response shape (conversation_id, response, tool_calls) even on partial failure.
- Logging and metrics for debugging and operations without exposing details to client.

---

## 6. Package Names and Versions

### Decision
- **OpenAI**: Use `openai` official package; Agents SDK may be part of it or a separate package—verify current PyPI names (e.g. `openai`, `openai-agents-sdk` if available).
- **MCP**: Use Official MCP SDK for Python; package name as per upstream (e.g. `mcp` or `mcp-sdk`).

### Rationale
- Prefer official packages for support and compatibility.
- Pin versions in requirements.txt after verification.

### Implementation Notes
- Add exact package names and versions when implementing; document in quickstart and backend README.
