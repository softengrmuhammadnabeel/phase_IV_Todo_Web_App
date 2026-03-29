# Data Model: AI Chatbot & MCP Integration

**Date**: 2026-02-07
**Feature**: 004-ai-chatbot-mcp

## Entity: Conversation

### Attributes

| Field      | Type     | Constraints                    | Description                          |
|-----------|----------|---------------------------------|--------------------------------------|
| id        | Integer  | Primary Key, Auto-increment     | Unique identifier                    |
| user_id   | String   | Required, Indexed, FK to users   | Owner of the conversation            |
| created_at| DateTime | Auto-generated                  | When the conversation was created   |
| updated_at| DateTime | Auto-generated                  | Last update (e.g. last message time) |

### Relationships

- **Owner**: Each Conversation belongs to one User (user_id).
- **Messages**: One Conversation has many Messages (ordered by created_at).

### Validation Rules

1. user_id must match the authenticated user for all access.
2. created_at and updated_at set on insert; updated_at updated when a new message is added (optional).
3. All queries MUST filter by user_id.

### State Transitions

- **Creation**: New conversation when client sends first message without conversation_id (or with null).
- **Use**: Messages appended; updated_at may be updated on new message.
- **Deletion**: Not required for MVP; can be added later (e.g. delete conversation and its messages).

---

## Entity: Message

### Attributes

| Field           | Type     | Constraints                    | Description                    |
|----------------|----------|---------------------------------|--------------------------------|
| id             | Integer  | Primary Key, Auto-increment     | Unique identifier              |
| user_id        | String   | Required, Indexed               | Owner (must match conversation)|
| conversation_id| Integer  | Required, FK to conversations   | Conversation this message is in|
| role           | Enum     | Required: 'user' \| 'assistant' | Sender role                    |
| content        | Text     | Required                        | Message body                   |
| created_at     | DateTime | Auto-generated                  | When the message was created   |

### Relationships

- **Conversation**: Many Messages belong to one Conversation.
- **User**: Messages are scoped by user_id; conversation must belong to same user_id.

### Validation Rules

1. user_id must match the conversation’s user_id and the authenticated user.
2. role is either 'user' or 'assistant'.
3. content must be non-empty string.
4. Messages retrieved in created_at order for context reconstruction.
5. All queries MUST filter by user_id (and conversation_id where applicable).

### State Transitions

- **Creation**: New row on each user or assistant message.
- **No update/delete** for MVP (append-only).

---

## Entity: Task (Reference – Spec-1)

Existing entity. MCP tools perform create/read/update/delete via TaskService. No schema changes in this spec. All task operations remain user-scoped by user_id.

---

## Database Schema

### Table: conversations

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_conversations_user_id ON conversations(user_id);
```

### Table: messages

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_messages_user_id ON messages(user_id);
CREATE INDEX ix_messages_conversation_id ON messages(conversation_id);
```

### Referential Integrity

- messages.conversation_id → conversations.id (CASCADE delete if conversation is deleted).
- conversations.user_id and messages.user_id reference the same user store as tasks.user_id (logical FK; exact table name per Spec-1/Spec-2).

---

## ORM Mapping (SQLModel)

- **Conversation**: SQLModel model with id, user_id, created_at, updated_at; relationship to Message list.
- **Message**: SQLModel model with id, user_id, conversation_id, role, content, created_at; relationship to Conversation.
- Use existing engine/session pattern from Spec-1 (backend/src/db, backend/src/models/database.py).
