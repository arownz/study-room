# Study-Room

AI study workspace monorepo (frontend + API) using `pnpm` workspaces.

## Quick start

```bash
pnpm install
```

Create `.env` in repo root if you do not have one yet:

```env
API_PORT=5000
API_ORIGIN=http://localhost:5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/study-room
BETTER_AUTH_SECRET=replace-with-32-char-secret-minimum
FRONTEND_ORIGIN=http://localhost:21654
VITE_DEV_PORT=21654
VITE_API_BASE_URL=http://localhost:5000
VITE_BASE_PATH=/
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
DISCORD_CLIENT_ID=replace-with-discord-client-id
DISCORD_CLIENT_SECRET=replace-with-discord-client-secret
```

## Run

Frontend (main app):

```bash
pnpm --filter @workspace/study-workspace dev # run the frontend
```

API server:

```bash
pnpm --filter @workspace/api-server dev # run the backend
```

Generate/apply DB migration:

```bash
pnpm --filter @workspace/db generate # generate the migration if reseted database
pnpm --filter @workspace/db migrate # apply the migration to the database
```

## Useful commands

```bash
pnpm run typecheck # check for type errors in the project
pnpm run build # build the project
```

```bash
pnpm --filter @workspace/study-workspace typecheck # check for type errors in the frontend
```

```bash
pnpm --filter @workspace/api-server typecheck # check for type errors in the backend
```

## Early Look of the app

![1778326517958](image/README/1778326517958.png)
![1778247850889](image/README/1778247850889.png)
![1778247976880](image/README/1778247976880.png)
![1778247999654](image/README/1778247999654.png)
![1778248034110](image/README/1778248034110.png)
![1778248107815](image/README/1778248107815.png)
![1778248163991](image/README/1778248163991.png)
![1778248184175](image/README/1778248184175.png)
![1778248201115](image/README/1778248201115.png)
![1778248218157](image/README/1778248218157.png)

## ERD Diagram

![1778317679270](image/README/1778317679270.png)
