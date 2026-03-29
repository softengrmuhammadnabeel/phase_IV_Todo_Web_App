# Quickstart Guide: ChatKit Frontend & Agent Integration (Spec-5)

**Date**: 2026-02-07
**Feature**: 5-chatkit-frontend-agent

## Prerequisites

- Next.js frontend (Spec-3) running
- Backend (Spec-4) chat endpoint available at configured API URL
- User authenticated (Spec-2); JWT and user_id available in auth context

## Environment

Ensure frontend has the API base URL used for the chat client (e.g. `NEXT_PUBLIC_API_URL=http://localhost:8000` or same as existing task API).

## Setup Steps

### 1. Implement Artifacts (per plan and tasks)

- Add `src/types/chat.ts` (ChatMessage, ChatResponse types).
- Add `src/services/chat.service.ts` (POST /api/{user_id}/chat with JWT).
- Add `src/hooks/useChat.ts` (send message, loading/error/retry, conversation_id persistence).
- Add `src/components/common/chat/ChatWindow.tsx`, `ChatInput.tsx`, `ChatMessage.tsx`.
- Add `src/app/dashboard/chat/page.tsx` (protected chat page rendering ChatWindow).

### 2. Run Frontend

```bash
cd frontend
npm run dev
```

### 3. Open Chat

- Log in (if not already).
- Go to dashboard and navigate to the chat page (e.g. `/dashboard/chat`).
- You should see the chat window and input.

### 4. Verify Full CRUD via Chat

- **Create:** Send “Create a task called Test task” → expect confirmation; task appears in task list if you have one.
- **List:** Send “List my tasks” → expect assistant to return your tasks or summary.
- **Complete:** Create a task, then “Complete task Test task” (or by id) → expect confirmation.
- **Delete:** “Delete task Test task” (or by id) → expect confirmation.
- **Update:** “Update task Test task to Updated name” → expect confirmation.

### 5. Verify Persistence and Errors

- **Persistence (conversation_id):** Send a few messages, then reload the page; send another message → same conversation (no new thread). Request includes stored `conversation_id`; backend returns same conversation.
- If backend is stopped, send a message → see error and retry; after backend is back, retry → one request, no duplicate messages.
- Log out and open `/dashboard/chat` → redirect to login (or unauthorized).

## File Map (Reference)

| Artifact        | Path |
|-----------------|------|
| Chat page       | `frontend/src/app/dashboard/chat/page.tsx` |
| ChatWindow      | `frontend/src/components/common/chat/ChatWindow.tsx` |
| ChatInput       | `frontend/src/components/common/chat/ChatInput.tsx` |
| ChatMessage     | `frontend/src/components/common/chat/ChatMessage.tsx` |
| useChat         | `frontend/src/hooks/useChat.ts` |
| Chat service    | `frontend/src/services/chat.service.ts` |
| Chat types      | `frontend/src/types/chat.ts` |

## Next Steps

- Run `/sp.tasks` to generate tasks.md.
- Implement tasks; add tests for chat components and full CRUD verification where applicable.
