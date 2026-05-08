# Study-Room

AI study workspace monorepo (frontend + API) using `pnpm` workspaces.

## Quick start

```bash
pnpm install
```

Create `.env` in repo root if you do not have one yet:

```env
PORT=21654
BASE_PATH=/
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/study_room
```

## Run

Frontend (main app):

```bash
pnpm --filter @workspace/study-workspace dev
```

API server:

```bash
pnpm --filter @workspace/api-server dev
```

Optional mockup sandbox:

```bash
pnpm --filter @workspace/mockup-sandbox dev
```

## Useful commands

```bash
pnpm run typecheck
pnpm run build
```

