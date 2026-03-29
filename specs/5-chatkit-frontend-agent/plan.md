# Implementation Plan: ChatKit Frontend & Agent Integration (Spec-5)

**Branch**: `5-chatkit-frontend-agent` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/5-chatkit-frontend-agent/spec.md`

## Summary

Integrate the existing Next.js frontend (App Router) with the Spec-4 chat backend. Add a chat page under the dashboard, ChatKit-style UI components (ChatWindow, ChatInput, ChatMessage), a chat hook and service that call POST /api/{user_id}/chat with JWT, and conversation_id persistence (e.g. localStorage). Full backend API support for all five chatbot CRUD operations (create, list, complete, delete, update) via natural language; UI reflects backend state and handles loading, errors, and retry without duplicate messages. No new top-level folders; fit into existing frontend structure.

## Technical Context

**Language/Version**: TypeScript; Next.js 16+ (App Router)
**Primary Dependencies**: Next.js, React, Tailwind CSS; existing auth (Better Auth), api-client pattern
**Storage**: Client-only: conversation_id in localStorage (or equivalent); no new backend storage
**Testing**: Jest/React Testing Library for components; integration tests for chat flow and CRUD verification
**Target Platform**: Browser; same as existing frontend
**Project Type**: Web application (frontend/); this feature adds chat UI and integration only
**Performance Goals**: Chat response visible within 2–3 seconds of send; input disabled only while request in-flight
**Constraints**: Existing folder structure; JWT on every request; backend is source of truth; no tool-call rendering
**Scale/Scope**: Same as existing app; one chat page per user session; conversation_id scoped per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Specification Compliance**: ✅ Spec-5 behavior and FR-001–FR-010 defined; plan aligns with spec and clarification (full chatbot CRUD support).
- **Contract-Driven Development**: ✅ Frontend consumes Spec-4 chat API contract (POST /api/{user_id}/chat); contracts/ document client usage.
- **User Isolation & Security First**: ✅ Chat page protected; JWT attached to every request; backend enforces user_id; no client-side auth logic added.
- **Predictability Over Complexity**: ✅ Single chat endpoint; stateless UI; no new architecture.
- **Technology Constraints**: ✅ Next.js 16+ App Router, existing stack; no new frameworks.
- **Security Constraints**: ✅ JWT in Authorization header; 401/403 → redirect to login; no sensitive errors in UI.
- **Behavioral Constraints**: ✅ Backend is source of truth; UI reflects backend state only.
- **Data & Persistence Standards**: ✅ Conversation persistence is backend (Spec-4); frontend only persists conversation_id for continuity.

## Project Structure

### Documentation (this feature)

```text
specs/5-chatkit-frontend-agent/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md             # /sp.tasks
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── layout.tsx      # (EXISTING)
│   │       ├── page.tsx        # (EXISTING)
│   │       └── chat/
│   │           └── page.tsx    # (NEW) Chat page
│   ├── components/
│   │   ├── common/
│   │   │   ├── chat/           # (NEW)
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── ChatMessage.tsx
│   │   │   └── ...             # (EXISTING)
│   │   └── ...
│   ├── hooks/
│   │   ├── useChat.ts          # (NEW)
│   │   └── ...                 # (EXISTING)
│   ├── services/
│   │   ├── chat.service.ts     # (NEW)
│   │   └── ...                 # (EXISTING)
│   └── types/
│       ├── chat.ts             # (NEW)
│       └── ...
└── ...
```

**Structure Decision**: Web application; frontend only. All Spec-5 work under existing `frontend/src/` (app/dashboard/chat, components/common/chat, hooks, services, types). No new top-level folders.

## Phase Breakdown

### Phase 1: Types and Chat API Client
- **Goals**: TypeScript types for chat (ChatMessage, ChatResponse, role); chat service that calls POST /api/{user_id}/chat with JWT and body { message, conversation_id }, returns response or throws.
- **Touchpoints**: `frontend/src/types/chat.ts`, `frontend/src/services/chat.service.ts`
- **Dependency**: Existing api-client or fetch with auth header; existing auth context for token and user_id.

### Phase 2: useChat Hook
- **Goals**: Encapsulate chat flow: send message, call chat service, manage loading/error/retry, append user message then assistant message, update conversation_id; persist conversation_id to localStorage on response; load conversation_id from localStorage on init.
- **Touchpoints**: `frontend/src/hooks/useChat.ts`
- **Dependency**: chat.service, auth (user_id, token).

### Phase 3: Chat UI Components
- **Goals**: ChatMessage (role + content; no tool calls); ChatInput (controlled, disabled while loading); ChatWindow (message list, loading indicator, error + retry, uses useChat).
- **Touchpoints**: `frontend/src/components/common/chat/ChatWindow.tsx`, `ChatInput.tsx`, `ChatMessage.tsx`
- **Dependency**: useChat, existing common components (e.g. LoadingIndicator, ErrorDisplay) if applicable.

### Phase 4: Chat Page and Protection
- **Goals**: Dashboard chat page that renders ChatWindow; protected route (redirect unauthenticated to login); ensure 401/403 from chat service trigger redirect or unauthorized message.
- **Touchpoints**: `frontend/src/app/dashboard/chat/page.tsx`; existing ProtectedRoute or auth check in layout/page.
- **Dependency**: Existing auth, dashboard layout.

### Phase 5: Full CRUD Verification and Polish
- **Goals**: Acceptance tests or manual verification that all five operations (create, list, complete, delete, update) work via chat UI; conversation_id persistence across reload; no duplicate messages on retry; error and loading states correct.
- **Touchpoints**: Tests (e.g. component tests for ChatWindow/ChatInput; integration for chat flow); any UX tweaks.

## Backend Integration (Spec-4 Contract)

- **Endpoint**: POST /api/{user_id}/chat
- **Headers**: Authorization: Bearer &lt;JWT&gt;, Content-Type: application/json
- **Body**: { message: string, conversation_id: number | null }
- **Response**: { conversation_id: number, response: string, tool_calls?: array }
- **Errors**: 401, 403, 404, 500 → frontend handles with redirect (401/403) or friendly message + retry.

## Conversation Lifecycle (Frontend)

- First message: conversation_id = null; backend returns new conversation_id; frontend stores it (e.g. localStorage key per user).
- Subsequent messages: send stored conversation_id; backend appends to same thread.
- Page reload: read conversation_id from storage; use in next request so thread continues.

## Success Criteria (from Spec)

- Users can manage todos via natural language with full backend API support for create, list, complete, delete, update.
- Chat interface responsive; loading and errors handled; conversations persist across reloads; unauthorized blocked; UI reflects backend state.

## Constraints

- No new top-level folders; no restructure of existing app/components/hooks/services.
- JWT on every chat request; backend is source of truth; no tool-call or internal metadata rendered.
