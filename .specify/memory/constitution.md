<!-- SYNC IMPACT REPORT
Version change: 1.0.0 -> 1.1.0
Modified principles:
  - User Isolation & Security First (expanded to include AI operations)
  - Added: Accuracy & Determinism, Statelessness & Scalability, Clarity & Traceability
Added sections: AI Operations Standards, Chat API Standards, MCP Tools Standards, AI Framework Standards
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
  - .specify/templates/commands/*.md ⚠ pending
  - README.md ⚠ pending
Follow-up TODOs: None
-->

# Full Stack Todo Web Application Constitution

## Core Principles

### Specification as Source of Truth
All system behavior must be defined in specs before implementation. Specs override assumptions, opinions, and ad-hoc decisions.

### Contract-Driven Full-Stack Development
Frontend, backend, and database interactions must follow explicit contracts. No implicit behavior is allowed across system boundaries.

### User Isolation & Security First
Each authenticated user may access and modify only their own tasks. Authorization is enforced on every request without exception. This includes AI operations, MCP tools, and chat interactions - all must be user-scoped with no cross-user access allowed.

### Predictability Over Complexity
Simple, explicit, and testable behavior is preferred over clever abstractions. Stability and correctness take priority over feature quantity.

### Hackathon Execution Discipline
The system must remain demo-ready throughout development. Core functionality must be complete and reliable.

### Behavior Specification Compliance
If behavior is not specified, it does not exist. All contributors, tools, and AI systems (including Claude Code) must comply with this constitution.

### Accuracy & Determinism
AI agents and MCP tools must behave predictably according to spec. Natural language commands must map deterministically to specific tool calls with consistent, predictable outcomes.

### Statelessness & Scalability
Chat API and MCP tools hold no internal session state; the system must be safe for horizontal scaling. Conversation state is reconstructed per request from persistent storage.

### Clarity & Traceability
Every AI action is logged and persisted to database for debugging and validation. All operations must be traceable and auditable.

## Key Standards
Includes Spec-Driven Standards, API Standards, Authentication & Authorization Standards, Data & Persistence Standards, AI Operations Standards, Chat API Standards, MCP Tools Standards

### Spec-Driven Standards
- All features must map to one of the defined specs (Spec-1 through Spec-5).
- No code may be written without an associated spec definition.
- Changes to behavior require spec updates before code changes.
- Phase III implementations must follow Spec-4 and Spec-5 requirements.

### API Standards
- RESTful design with explicit HTTP methods:
  - GET, POST, PUT, DELETE, PATCH
- Consistent request and response formats.
- Predictable error handling using standard HTTP status codes.
- Chat endpoint: POST `/api/{user_id}/chat` with `message` and optional `conversation_id`

### Authentication & Authorization Standards
- Authentication is handled on the frontend using Better Auth.
- Authorization is enforced on the backend using JWT verification.
- All protected API endpoints require a valid JWT token.
- User identity is extracted exclusively from verified JWTs.
- All AI operations and MCP tools must enforce user_id scoping.

### Data & Persistence Standards
- All task data and conversation data is stored in Neon Serverless PostgreSQL.
- SQLModel is used as the ORM layer with Conversation and Message models.
- All database queries must be filtered by authenticated user ID.
- Task ownership and conversation ownership are enforced at the data-access level.

### AI Operations Standards
- All natural language commands must map to MCP tool calls.
- AI operations must return friendly confirmations to users.
- AI agents must use OpenAI Agents SDK.
- All AI operations must be user-scoped with no cross-user access.

### Chat API Standards
- Chat API must be stateless, JWT-protected, with database-backed conversation persistence.
- Conversation state must be reconstructed per request.
- No in-memory session storage is allowed.
- API must support horizontal scaling without loss of state.

### MCP Tools Standards
- MCP tools must be stateless and enforce user_id scoping.
- Tools must perform operations securely and persistently.
- Error handling must be graceful with no stack traces exposed to users.
- All operations must be logged for traceability.

## Constraints
Technology Constraints, Security Constraints, Behavioral Constraints, AI Framework Constraints

### Technology Constraints
- **Frontend:** Next.js 16+ (App Router)
- **Backend:** Python FastAPI
- **ORM:** SQLModel
- **Database:** Neon Serverless PostgreSQL
- **Spec-Driven Tooling:** Claude Code + Spec-Kit Plus
- **Authentication:** Better Auth with JWT
- **Frontend:** OpenAI ChatKit UI
- **AI Framework:** OpenAI Agents SDK

No alternative frameworks or stacks are permitted during the hackathon.

### Security Constraints
- JWT tokens must be included in every API request using:
  - `Authorization: Bearer <token>`
- JWTs must be verified using a shared secret:
  - `BETTER_AUTH_SECRET`
- Requests without valid tokens must return `401 Unauthorized`.
- User ID in the request path must match the authenticated JWT user ID.
- Cross-user data access is strictly forbidden for all operations including AI and chat.
- All MCP tools must enforce user_id scoping without exception.

### Behavioral Constraints
- Undocumented behavior is not allowed.
- Backend must never trust client-provided user identity.
- All task operations must enforce ownership checks.
- All AI operations must be deterministic and traceable.
- Chat conversations must be stateless and reconstructed from database per request.

### AI Framework Constraints
- AI Framework: OpenAI Agents SDK
- MCP Tools: Must be stateless, enforce `user_id` scoping
- Conversation Storage: SQLModel with Conversation and Message models
- Chat Endpoint: POST `/api/{user_id}/chat` with `message` and optional `conversation_id`
- Stateless: No in-memory session storage; conversation state reconstructed per request

## Governance
Success Criteria and Non-Negotiable Rule

The project is considered successful if:
- All five basic Todo features are implemented as a web application.
- RESTful API endpoints function as defined and are fully secured.
- Users can sign up and sign in using Better Auth.
- JWT-based authorization is enforced on every API request.
- Each user can only see and manage their own tasks.
- AI agent correctly executes all natural language todo commands.
- MCP tools perform task operations securely and persistently.
- Chat API maintains conversation context and returns proper responses.
- Stateless architecture validated: server restart or scaling does not break behavior.
- ChatKit frontend can fully interact with backend via secure API.
- No cross-user data leaks; all actions enforce user_id scope.
- Error recovery and fallback responses work as expected.
- Data persists reliably in Neon Serverless PostgreSQL.
- Frontend and backend behavior strictly match the specs.
- No undocumented or unsafe behavior exists.
- The application is stable and demo-ready.

> **If behavior is not specified, it does not exist.**
All contributors, tools, and AI systems (including Claude Code) must comply with this constitution.

**Version**: 1.1.0 | **Ratified**: 2026-01-16 | **Last Amended**: 2026-02-04