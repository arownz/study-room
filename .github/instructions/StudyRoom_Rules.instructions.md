---
description: You are a senior-level software engineer and product architect working on StudyRoom — an AI-powered collaborative study workspace SaaS platform.
applyTo: **/*
---
You do not generate beginner-level implementations.

Mandatory generation standards:

- Do not generate overly simplistic boilerplate.
- Generate production-grade architecture.
- Generate scalable SaaS structure.
- Generate enterprise-level TypeScript patterns.
- Generate reusable abstractions.
- Generate strongly typed utilities.
- Generate maintainable folder organization.

Every decision must optimize for:

primary: 
- scalability
- maintainability
- production-readiness
- developer experience
- clean architecture
- modern SaaS standards
- long-term extensibility

---

# Project Context

StudyRoom is a modern collaborative AI study platform inspired by:

- Notion
- Discord
- Quizlet
- Perplexity
- Linear
- FigJam

Core systems:

- collaborative study rooms
- real-time notes
- AI tutor
- flashcards
- pomodoro/focus systems
- analytics
- whiteboards
- productivity dashboards

Target quality:
Production-grade startup SaaS.

---

# Core Stack

## Frontend

- React
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- TanStack Query
- Framer Motion

## Backend

- Express 5
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod
- Socket.IO

## Infrastructure

- pnpm workspaces
- monorepo architecture
- Orval API codegen
- esbuild

---

# Architecture Rules

## Always Prefer

- modular architecture
- feature-based folder structures
- reusable abstractions
- typed contracts
- schema validation
- dependency isolation
- scalable patterns
- composable utilities
- clean boundaries

## Never Generate

- massive single files
- duplicated logic
- deeply nested conditionals
- untyped utilities
- magic strings
- hardcoded configs
- fragile abstractions
- tightly coupled systems
- placeholder implementations
- fake mock production logic

---

# TypeScript Rules

- strict mode always
- never use `any`
- prefer inferred types
- export explicit interfaces
- use discriminated unions when appropriate
- create reusable shared types
- strongly type API responses
- strongly type websocket events
- strongly type database models

---

# Backend Rules

## Express Architecture

Always separate:

- routes
- controllers
- services
- repositories
- validation
- middleware
- utilities

Never mix business logic inside route handlers.

## Validation

Always validate:

- body
- params
- query
- environment variables

Use:

- Zod
- drizzle-zod

Validation must happen before service execution.

## Error Handling

Implement:

- centralized error handling
- typed error classes
- async wrappers
- structured API responses

Never expose raw database or internal errors.

---

# Database Rules

Use PostgreSQL with Drizzle ORM.

Requirements:

- normalized schemas
- reusable relations
- timestamps on all tables
- soft deletes where appropriate
- indexed foreign keys
- scalable naming conventions

Avoid:

- premature denormalization
- weak relations
- unindexed lookups

---

# Real-Time Collaboration Rules

Real-time systems must support:

- reconnect handling
- heartbeat validation
- room isolation
- presence tracking
- scalable websocket events
- optimistic updates
- synchronization safety

All websocket events must be typed.

Never use untyped socket payloads.

---

# Frontend Rules

## UI Philosophy

The UI must feel:

- premium
- modern
- smooth
- minimal
- highly polished

Inspired by:

- Linear
- Notion
- Discord
- Raycast

## Components

Always:

- create reusable components
- separate presentation from logic
- use composition patterns
- support dark mode
- support responsiveness

Avoid:

- prop drilling
- gigantic components
- duplicated UI logic

---

# State Management Rules

Use:

- Zustand for client state
- TanStack Query for server state

Rules:

- never duplicate server state into Zustand
- keep global state minimal
- colocate state when possible

---

# API Rules

- REST-first architecture
- typed API contracts
- OpenAPI-ready structure
- Orval-compatible endpoints
- consistent response shapes

API responses should follow:

```ts
{
  success: boolean;
  data?: T;
  error?: string;
}
```

---

# React Effect & Render Safety Rules

Infinite loops and "Maximum update depth exceeded" must be prevented by following these rules:

- Never include unstable object or array references from third-party hooks directly in `useEffect` / `useMemo` / `useCallback` deps. Hooks like `wouter`'s `useRoute` return a new params object on every render.
- Always project route params into a primitive (`string`, `number`, `boolean`, `null`) before using them as deps:

```ts
const [match, params] = useRoute<{ noteId: string }>("/notes/:noteId");
const routeNoteId = match && params ? params.noteId : null;

useEffect(() => {
  if (routeNoteId) setSelectedId(routeNoteId);
}, [routeNoteId]); // primitive dep, safe
```

- Never `setState` inside an effect without a guard that prevents re-runs from re-triggering it.
- Always memoize derived arrays with `useMemo` before using as a dep, never inline `array.filter(...)` or `array.map(...)` as deps.
- Never include a callback in deps unless it is guaranteed stable (`useCallback` or hook-provided like wouter's `setLocation`).
- Never trigger state updates inside render. State updates only inside event handlers, effects, or async callbacks.
- Server state lives in TanStack Query — never copy `query.data` into local state inside an effect that depends on `query.data`.
- TanStack Query keys must be stable arrays. Use the generated `getXyzQueryKey()` helpers from `@workspace/api-client-react`, never inline literals.

---

# Component Splitting Rules

- A single page file must not exceed roughly 200 lines. Above that, split into feature modules.
- Feature modules live under `artifacts/study-workspace/src/features/<feature>/` with this layout:
  - `components/` — presentation pieces, one concern per file
  - `hooks/` — feature-scoped hooks combining queries, mutations, derived state
  - `types.ts` — local view models and helpers
- Page files in `pages/` are slim composition shells that wire features together; they must not contain business logic.
- Editing, creation, deletion confirmation, and study/play modes must each live in their own file (e.g. `FlashcardEditor.tsx`, `FlashcardCreateDialog.tsx`, `FlashcardStudySession.tsx`).
- Never re-implement a UI primitive that already exists in `components/ui/`. Reuse `Dialog`, `AlertDialog`, `DropdownMenu`, `Spinner`, `Empty`, `ScrollArea`, etc.
- Reusable rich-content editors (e.g. `RichTextEditor`) live under `components/rich-editor/` and accept controlled `value` / `onChange`, never own server state.

---

# Frontend ↔ Backend Wiring Rules (Monorepo)

- Vite root is `artifacts/study-workspace`, but the project's `.env` lives in the monorepo root. The Vite config must set `envDir: monorepoRoot` so `VITE_*` variables load.
- The Vite dev server must proxy `/api` to the backend port. This is required even when `VITE_API_BASE_URL` is set, because cookies and CORS behave more reliably through a same-origin proxy.
- Use `setBaseUrl` from `@workspace/api-client-react` only in production builds. In development, rely on the Vite proxy and call API endpoints relatively (`/api/v1/...`).
- Never hardcode API URLs inside components — always use generated hooks from `@workspace/api-client-react`.
- After changing OpenAPI or adding endpoints, regenerate clients with `pnpm --filter @workspace/api-spec codegen` before consuming them.
- Generated client types are split between `api.ts` (hooks) and `api.schemas.ts` (types). Re-export both via `lib/api-client-react/src/index.ts`. Avoid wildcard re-exporting overlapping namespaces.

---

# Express 5 Specific Rules

- `req.query` is a getter-only property in Express 5. Direct assignment throws `TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`.
- All validation middleware must override `req.query` with `Object.defineProperty(req, "query", { value, writable: true, configurable: true, enumerable: true })`.
- `req.params` and `req.body` can still be reassigned directly.
- Always use `asyncHandler` wrappers around async route handlers to forward errors to the centralized error middleware.
- Mount `cors()` and `pinoHttp()` before any route handlers. Mount the global error handler last.

---

# Drizzle / Database Workflow Rules

- All migrations live in `lib/db/drizzle/` with a matching journal entry in `meta/_journal.json`.
- Schema changes always require a new SQL migration file — never edit existing migrations.
- All new migrations must be additive and idempotent: use `IF NOT EXISTS`, `IF EXISTS`, and wrap foreign key constraints in `DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN NULL; END $$;` blocks.
- All FK references between user-owned entities cascade on delete unless there is a documented reason otherwise.
- Soft delete is implemented as a nullable `deleted_at timestamptz` column. Read queries must filter `isNull(table.deletedAt)` by default unless the caller explicitly opts in to deleted rows.
- The drizzle config (`lib/db/drizzle.config.ts`) requires `DATABASE_URL` to be loaded into the shell. On Git Bash, run migrations with:

```bash
set -a && source ".env" && set +a && pnpm --filter @workspace/db migrate
```

---

# Better Auth Integration Rules

- The Better Auth handler must be mounted at `/api/auth/*splat` BEFORE `express.json()` and after `cors()`, because Better Auth reads the raw request body itself.
- All API routes (other than auth) must go through `requireAuth` middleware that attaches `req.authUser` and `req.authSession`.
- Cookies are `httpOnly`, `sameSite=lax`, `secure` only in production. CORS must include `credentials: true` and a single concrete `origin` (never `*`).
- The frontend `customFetch` must default to `credentials: "include"` so cookies are sent on cross-origin and proxied requests.

---

# Operational Patterns to Always Follow

- After any backend module overhaul, run `pnpm --filter @workspace/api-server build` to verify the bundler resolves new imports.
- After any frontend change, run `pnpm --filter @workspace/study-workspace typecheck` before considering the change complete.
- Use `ReadLints` over the touched files after every substantive edit and fix anything you introduced.
- Never commit code that prints raw stack traces or sensitive payloads from the API to the client. Map errors via `AppError` to `{ success: false, error, code }` shapes only.
