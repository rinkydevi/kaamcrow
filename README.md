# TaskFlow — Task Management Application

A full-stack task management app built with **Go** (backend), **Next.js 15** (frontend), and **PostgreSQL**.

## Architecture

```
task-management/
├── backend/          # Go REST API (chi router, pgx, JWT)
│   ├── cmd/server/   # Entry point
│   ├── internal/     # Auth, handlers, middleware, models, repository
│   ├── db/migrations/
│   └── tests/
├── frontend/         # Next.js 15 App Router (TypeScript, Tailwind, React Query)
│   └── src/
│       ├── app/      # Pages: (auth)/login, (auth)/signup, (dashboard)/tasks
│       ├── components/
│       ├── hooks/    # useTasks, useAuth
│       ├── store/    # Zustand auth store (persisted)
│       └── types/
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick Start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Postgres: localhost:5432

## Manual Setup

### Prerequisites
- Go 1.22+
- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET
make migrate-up        # run DB migrations
make run               # start on :8080
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev            # start on :3000
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/signup | — | Create account |
| POST | /api/login | — | Sign in, returns JWT |
| GET | /api/tasks | JWT | List tasks (filter, search, sort, paginate) |
| POST | /api/tasks | JWT | Create task |
| GET | /api/tasks/:id | JWT | Get single task |
| PATCH | /api/tasks/:id | JWT | Update task |
| DELETE | /api/tasks/:id | JWT | Delete task |

### Query Parameters for GET /api/tasks

| Param | Values | Description |
|-------|--------|-------------|
| status | todo \| in_progress \| done | Filter by status |
| search | string | Search title (ILIKE) |
| sort_by | created_at \| due_date \| priority \| title | Sort field |
| sort_dir | asc \| desc | Sort direction |
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20) |

## Running Tests

```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npm test
```

## Assumptions & Trade-offs

- **No refresh tokens** — JWT expires in 7 days. For production, add a refresh-token rotation flow.
- **Raw SQL over ORM** — keeps the dependency surface small and queries explicit; acceptable for this scope.
- **No file upload** — bonus feature; would add S3/presigned-URL pattern.
- **Migrations are plain SQL** — no migration runner dependency; `psql -f` is sufficient for the assessment scope.
- **Admin role seeded manually** — `UPDATE users SET role = 'admin' WHERE email = 'you@example.com';`
