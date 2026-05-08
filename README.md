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

## Useful commands

```bash
pnpm run typecheck
pnpm run build
```

## Early Look of the app

![1778247850889](image/README/1778247850889.png)
![1778247976880](image/README/1778247976880.png)
![1778247999654](image/README/1778247999654.png)
![1778248034110](image/README/1778248034110.png)
![1778248107815](image/README/1778248107815.png)
![1778248163991](image/README/1778248163991.png)
![1778248184175](image/README/1778248184175.png)
![1778248201115](image/README/1778248201115.png)
![1778248218157](image/README/1778248218157.png)