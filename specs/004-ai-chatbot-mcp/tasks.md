# Tasks: AI Chatbot & MCP Integration (Spec-4)

**Input**: Design documents from `specs/004-ai-chatbot-mcp/`
**Prerequisites**: plan.md, spec.md (user stories from 4-ai-chatbot-mcp), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Included per plan Phase 8 (unit, integration, security, functional).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 per spec user stories
- All paths relative to repo root; backend code under `backend/`

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`, `backend/alembic/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spec-4 dependencies and structure; no changes to existing auth or task CRUD.

- [x] T001 Add OpenAI and MCP SDK dependencies to backend/requirements.txt (openai, mcp or official package names per research.md)
- [x] T002 [P] Add OPENAI_API_KEY to backend/src/config.py and document in .env.example
- [x] T003 Create backend/src/ai/ package with __init__.py (placeholder for agent, runner, mcp_server)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Conversation and message persistence; all chat and agent work depends on this.

**Independent Test**: Create conversation, add messages, retrieve by conversation_id and user_id; no cross-user access.

- [x] T004 [P] [US2] Create Conversation SQLModel model in backend/src/models/conversation.py per data-model.md (id, user_id, created_at, updated_at)
- [x] T005 [P] [US2] Create Message SQLModel model in backend/src/models/message.py per data-model.md (id, user_id, conversation_id, role, content, created_at)
- [x] T006 [US2] Create Alembic migration for conversations and messages tables with indexes in backend/alembic/versions/
- [x] T007 [US2] Implement ConversationService (create_conversation, get_conversation, list_user_conversations) with user_id filtering in backend/src/services/conversation_service.py
- [x] T008 [US2] Implement MessageService (add_message, get_conversation_messages) with user_id and conversation_id filtering in backend/src/services/message_service.py
- [x] T009 [P] [US2] Create Pydantic schemas for Conversation and Message in backend/src/api/schemas/conversation.py and backend/src/api/schemas/message.py
- [x] T010 [US2] Register new models with existing database engine/session in backend/src/models/ (or db base) so migrations and ORM work

**Checkpoint**: Conversations and messages persist; services are user-scoped. Runner and chat can use them.

---

## Phase 3: User Story 1 - Manage Todos via Natural Language (Priority: P1) — MVP

**Goal**: User can send a chat message (e.g. "Add task: buy milk") and receive a friendly confirmation; task is created via MCP tool.

**Independent Test**: POST /api/{user_id}/chat with valid JWT and body {"message": "Add a task: buy milk"}; response has conversation_id, response text; task exists for that user.

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement MCP tools (add_task, list_tasks, complete_task, delete_task, update_task) calling existing TaskService with injected user_id in backend/src/ai/mcp_server.py; return structured JSON; handle task-not-found gracefully
- [x] T012 [US1] Create OpenAI agent configuration (model, temperature, system prompt for task assistant) and register MCP tools in backend/src/ai/agent.py
- [x] T013 [US1] Implement AgentRunner.run(user_id, conversation_id, user_message): load conversation messages, append user message, run agent, persist assistant message, return response in backend/src/ai/runner.py
- [x] T014 [P] [US1] Create chat request/response schemas (message, conversation_id optional; conversation_id, response, tool_calls) in backend/src/api/schemas/chat.py per contracts/chat-api.md
- [x] T015 [US1] Implement POST /api/{user_id}/chat: verify JWT and path user_id match, create or load conversation, persist user message, call runner, persist assistant message, return response in backend/src/api/routes/chat.py
- [x] T016 [US1] Register chat router in backend/src/main.py under prefix that yields POST /api/{user_id}/chat
- [x] T017 [US1] Add 401/403/404/400 handling in chat route per contracts/chat-api.md (no stack traces in response)

**Checkpoint**: User can manage todos via natural language; single-turn flow works.

---

## Phase 4: User Story 2 - Multi-Turn Conversation with History (Priority: P1)

**Goal**: User can send follow-up messages with same conversation_id; agent receives full history and responds in context.

**Independent Test**: Send first message (new conversation), then second message with returned conversation_id; verify second response uses context (e.g. "Mark it done" refers to earlier task).

- [x] T018 [US2] Ensure runner loads get_conversation_messages in created_at order and passes full history to agent in backend/src/ai/runner.py
- [x] T019 [US2] Ensure chat route creates new conversation when conversation_id is missing or null and returns new conversation_id in backend/src/api/routes/chat.py
- [x] T020 [P] [US2] Add integration test: multi-turn conversation (create conversation, two messages, verify context) in backend/tests/test_chat_endpoint.py or new test file

**Checkpoint**: Multi-turn conversations work; no in-memory session; history from DB only.

---

## Phase 5: User Story 3 - Secure, User-Scoped Execution (Priority: P1)

**Goal**: No cross-user access; JWT and path user_id enforced; MCP tools use only backend-injected user_id.

**Independent Test**: Two users; each sends chat requests; each sees only own tasks; request with wrong path user_id returns 403.

- [x] T021 [US3] Add unit tests: MCP tools called with user_id return only that user's data; no client-supplied user_id in tool input in backend/tests/test_mcp_tools.py
- [x] T022 [US3] Add integration tests: chat endpoint returns 401 without JWT, 403 when path user_id does not match JWT in backend/tests/test_chat_endpoint.py
- [x] T023 [US3] Verify chat route uses only JWT-derived user_id for conversation/message creation and runner call (no body user_id) in backend/src/api/routes/chat.py

**Checkpoint**: Security guarantees validated by tests.

---

## Phase 6: User Story 4 - Error Handling and Recovery (Priority: P2)

**Goal**: Task not found, tool failures, and agent errors return user-friendly messages; no stack traces exposed.

**Independent Test**: Send "Complete task 99999"; response is friendly message, no internal error. Send invalid/malformed body; get 400 with clear detail.

- [x] T024 [US4] In backend/src/ai/mcp_server.py return structured error messages for task not found, invalid task_id, and database errors (no stack traces)
- [x] T025 [US4] In backend/src/ai/runner.py catch agent/OpenAI errors and return fallback response or safe error message; never expose stack trace to caller
- [x] T026 [US4] In backend/src/api/routes/chat.py ensure 500 responses use generic user-friendly detail; log full error server-side only

**Checkpoint**: All error paths are safe and user-friendly.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Remaining tests, coverage, and validation.

- [x] T027 [P] Add unit tests for ConversationService and MessageService (user scoping, order) in backend/tests/test_conversation_service.py
- [x] T028 [P] Add unit or integration tests for AgentRunner (context reconstruction, stateless) in backend/tests/test_agent_runner.py
- [x] T029 Run full backend test suite and ensure no regressions; fix any failing tests
- [x] T030 Validate quickstart.md: run migrations, set OPENAI_API_KEY, start server, call POST /api/{user_id}/chat with valid JWT and verify response shape

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 — MVP; chat + agent + MCP + persistence.
- **Phase 4 (US2)**: Depends on Phase 3 — multi-turn behavior and tests.
- **Phase 5 (US3)**: Depends on Phase 3 — security tests and verification.
- **Phase 6 (US4)**: Depends on Phase 3 — error handling in existing code.
- **Phase 7 (Polish)**: Depends on Phases 3–6 — remaining tests and quickstart.

### User Story Dependencies

- **US1 (P1)**: After Foundational; delivers conversational todo (single-turn).
- **US2 (P1)**: After US1; multi-turn and history (implementation in runner/chat; tests in Phase 4).
- **US3 (P1)**: After US1; security validation and tests.
- **US4 (P2)**: After US1; error handling in tools, runner, route.

### Parallel Opportunities

- T002, T003 (Setup) can run in parallel.
- T004, T005 (Conversation and Message models) can run in parallel.
- T009 (schemas) can run in parallel with other Phase 2 work after T007/T008 if needed.
- T011, T014 (MCP server, chat schemas) can run in parallel.
- T020, T021, T022, T027, T028 (test tasks) can run in parallel where files differ.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: US1 (MCP, agent, runner, chat endpoint)  
4. **STOP and VALIDATE**: POST chat "Add task X", verify task created and response returned  
5. Then add US2 (multi-turn), US3 (security tests), US4 (error handling), Polish  

### Incremental Delivery

- After Phase 2: Conversation/message persistence ready.  
- After Phase 3: Single-turn conversational todo works (MVP).  
- After Phase 4: Multi-turn works.  
- After Phase 5–6: Security and error handling validated.  
- After Phase 7: Tests and quickstart verified.

---

## Notes

- [P] = different files, no dependencies; safe to run in parallel.
- [USn] = task belongs to that user story for traceability.
- Paths assume repo root = project root; backend at `backend/`.
- Mark tasks complete with `- [x]` when done during `/sp.implement`.
