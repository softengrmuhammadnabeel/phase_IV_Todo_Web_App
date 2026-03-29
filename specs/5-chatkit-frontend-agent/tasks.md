# Tasks: ChatKit Frontend & Agent Integration (Spec-5)

**Input**: Design documents from `specs/5-chatkit-frontend-agent/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Spec requests acceptance tests for full CRUD verification; optional component/integration tests per plan.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 per spec user stories
- All paths relative to repo root; frontend code under `frontend/`

## Path Conventions

- Frontend: `frontend/src/` (app, components, hooks, services, types)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure frontend is ready for chat integration; no new top-level folders.

- [x] T001 Document or verify API base URL for chat (e.g. NEXT_PUBLIC_API_URL or existing api-client base) in frontend env or lib/constants
- [x] T002 [P] Create frontend/src/types/chat.ts with ChatMessage (role, content), ChatRequest (message, conversation_id), ChatResponse (conversation_id, response, tool_calls), and role type ('user' | 'assistant') per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Chat API client and types so all user stories can send/receive chat messages.

**Independent Test**: Call chat service with user_id, token, message, conversation_id null; receive response with conversation_id and response text.

- [x] T003 Implement chat service in frontend/src/services/chat.service.ts: POST {API_BASE}/api/{user_id}/chat with Authorization Bearer token and body { message, conversation_id }; return response or throw on non-OK; handle 401/403 for redirect in caller per contracts/frontend-chat-api.md
- [x] T004 Ensure existing auth context (or useAuth) exposes user id and JWT for use by chat service and useChat hook

**Checkpoint**: Chat client can send message and get response; auth provides user_id and token.

---

## Phase 3: User Story 1 - Chat with AI to Manage Todos (Priority: P1) — MVP

**Goal**: User can open chat page, type a message, see loading state, and see assistant reply; all five CRUD operations (create, list, complete, delete, update) are invokable via natural language and UI reflects backend outcome.

**Independent Test**: Log in, go to chat, send "Create a task called Test", then "List my tasks"; verify confirmations and list; repeat for complete, delete, update.

### Implementation for User Story 1

- [x] T005 [US1] Implement useChat hook in frontend/src/hooks/useChat.ts: accept user_id and token (from auth); maintain messages array and conversation_id; sendMessage(message) calls chat.service with message and current conversation_id, appends user message, sets loading, on success appends assistant message and updates conversation_id, on error sets error state; expose messages, loading, error, sendMessage, retry (resend last message without duplicating)
- [x] T006 [P] [US1] Create ChatMessage component in frontend/src/components/common/chat/ChatMessage.tsx to render single message by role (user | assistant) and content only; do not render tool_calls or internal metadata
- [x] T007 [P] [US1] Create ChatInput component in frontend/src/components/common/chat/ChatInput.tsx: controlled input, disabled when loading, onSubmit callback; prevent empty or duplicate submit while loading
- [x] T008 [US1] Create ChatWindow component in frontend/src/components/common/chat/ChatWindow.tsx: use useChat; render message list (ChatMessage), loading indicator (typing or spinner), ChatInput; display error message and retry button when error state set
- [x] T009 [US1] Create chat page at frontend/src/app/dashboard/chat/page.tsx that renders ChatWindow; ensure page is under dashboard layout
- [x] T010 [US1] Wire useChat to persist conversation_id to localStorage (key e.g. chat_conversation_${user_id}) on each successful response and read it on hook init so conversation continues across reloads (US2)

**Checkpoint**: User can chat and see responses; create/list/complete/delete/update via natural language work when backend is available; conversation_id persisted.

---

## Phase 4: User Story 2 - Conversation Persistence Across Reloads (Priority: P1)

**Goal**: After reload, same conversation continues; frontend sends stored conversation_id; no duplicate thread.

**Independent Test**: Send two messages, reload page, send another message; verify same thread (backend returns same conversation_id and context).

- [ ] T011 [US2] In frontend/src/hooks/useChat.ts load conversation_id from localStorage on init (keyed by user_id); use it for first request after load; if backend returns 404 for stored conversation_id clear stored id and send null on next message
- [ ] T012 [US2] Add acceptance test or manual step: reload chat page and send message; verify request includes stored conversation_id and thread continues (document in quickstart or test plan)

**Checkpoint**: Conversation survives reload; stored conversation_id used correctly.

---

## Phase 5: User Story 3 - Secure and Unauthorized Access Handling (Priority: P1)

**Goal**: Only authenticated users see chat; 401/403 redirect to login or show unauthorized; JWT on every request.

**Independent Test**: Open chat without token → redirect to login; with valid token send message → request includes JWT.

- [x] T013 [US3] Protect chat page: ensure frontend/src/app/dashboard/chat/page.tsx (or dashboard layout) redirects unauthenticated users to login using existing auth (ProtectedRoute or session check)
- [x] T014 [US3] In frontend/src/services/chat.service.ts or useChat: on 401/403 response redirect to login route or set unauthorized state so UI shows redirect/message; never expose stack traces
- [x] T015 [US3] Verify chat service is called only with JWT from auth context and user_id from auth context (no client-supplied user_id in body)

**Checkpoint**: Unauthorized access blocked; 401/403 handled; JWT on every request.

---

## Phase 6: User Story 4 - Loading, Errors, and Retry (Priority: P2)

**Goal**: Loading state and disabled input during request; friendly error message and retry; retry does not duplicate messages.

**Independent Test**: Simulate network error, see error and retry; retry succeeds with one user and one assistant message.

- [x] T016 [US4] In frontend/src/components/common/chat/ChatWindow.tsx show typing/loading indicator while loading and disable ChatInput; clear on response or error
- [x] T017 [US4] In ChatWindow display friendly error message and retry button when error state is set; retry calls useChat retry (resend last message once) and does not append duplicate user or assistant messages
- [x] T018 [US4] Ensure non-2xx backend responses (e.g. 500) show safe user-facing message only; no stack traces or internal details in UI

**Checkpoint**: Loading and error UX complete; retry works without duplicates.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Full CRUD verification and final validation.

- [x] T019 Verify all five chatbot operations from chat UI: create task ("Create a task called X"), list tasks ("List my tasks"), complete task ("Complete task Y"), delete task ("Delete task Z"), update task ("Update task A to B"); document or add test that each operation triggers backend and UI shows confirmation per spec FR-010
- [x] T020 Run quickstart.md validation: login, open chat, send messages, reload, verify persistence; verify 401/403 and error handling
- [x] T021 Optional: Add component tests for ChatMessage, ChatInput, ChatWindow (e.g. render, loading state, error state) in frontend/src/components/common/chat/__tests__/ if test tooling exists

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP chat UI and full CRUD support.
- **Phase 4 (US2)**: Depends on Phase 3; persistence already started in T010; T011–T012 complete it.
- **Phase 5 (US3)**: Depends on Phase 3; protection and 401/403 handling.
- **Phase 6 (US4)**: Depends on Phase 3; loading/error/retry in ChatWindow.
- **Phase 7 (Polish)**: Depends on Phases 3–6; CRUD verification and quickstart.

### User Story Dependencies

- **US1 (P1)**: After Foundational; delivers chat UI and integration; conversation_id persistence started.
- **US2 (P1)**: After US1; complete persistence and reload behavior.
- **US3 (P1)**: After US1; protect page and handle 401/403.
- **US4 (P2)**: After US1; loading, error, retry UX.

### Parallel Opportunities

- T002 (types) can run in parallel with T001.
- T006, T007 (ChatMessage, ChatInput) can run in parallel.
- T013, T014, T015 (US3) can be done in sequence with same files.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational (types + chat service)  
3. Complete Phase 3: US1 (useChat, ChatMessage, ChatInput, ChatWindow, chat page, conversation_id persist)  
4. **STOP and VALIDATE**: Send "Create a task called X" and "List my tasks"; verify responses.  
5. Then Phase 4–7 (persistence verification, protection, errors, CRUD verification).

### Incremental Delivery

- After Phase 2: Chat client ready.  
- After Phase 3: User can chat and use all five CRUD operations (MVP).  
- After Phase 4: Reload preserves conversation.  
- After Phase 5–6: Security and error handling complete.  
- After Phase 7: Full CRUD verified and quickstart validated.

---

## Notes

- [P] = different files, no dependencies.
- [USn] = task belongs to that user story.
- Paths: frontend at `frontend/`; all new code under `frontend/src/` per plan.
- Mark tasks complete with `- [x]` when done during `/sp.implement`.
