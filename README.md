# KaamCrow — Task Management Application

A full-stack task management application built with **Go** (backend), **Next.js 15** (frontend), and **PostgreSQL**.

**Live demo:** [kaamcrow.vercel.app](https://kaamcrow.vercel.app)

---

## Features

- JWT authentication with bcrypt password hashing
- Full task CRUD with filtering, search, sorting, and pagination
- Role-based access control (user / admin)
- File attachments (upload, download, delete — ownership verified)
- Activity log with JSONB change history per task
- Real-time updates via Server-Sent Events
- Optimistic UI with automatic rollback on error
- Dark / light mode
- Docker Compose for one-command local setup
- CI via GitHub Actions (tests → type-check → build)

---

## Architecture

```
kaamcrow/
├── backend/              # Go REST API (chi, pgx v5, JWT)
│   ├── cmd/server/       # Entry point, router, graceful shutdown
│   ├── internal/
│   │   ├── auth/         # JWT generation/validation, bcrypt
│   │   ├── config/       # Env-based config loader
│   │   ├── db/           # pgx connection pool
│   │   ├── events/       # SSE broker
│   │   ├── handlers/     # HTTP handlers (interface-injected repos)
│   │   ├── middleware/   # JWT auth middleware, RBAC
│   │   ├── models/       # Structs and request/response types
│   │   └── repository/   # SQL queries (no ORM)
│   ├── db/migrations/    # Plain SQL, versioned up/down
│   └── tests/            # Handler + auth unit tests
└── frontend/             # Next.js 15 App Router (TypeScript, Tailwind)
    └── src/
        ├── app/          # Route groups: (auth), (dashboard)
        ├── components/   # UI primitives + task domain components
        ├── hooks/        # React Query mutations, SSE hook
        ├── store/        # Zustand auth + theme stores (persisted)
        └── types/        # Shared TypeScript interfaces
```

---

## Quick Start (Docker)

```bash
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8080 |
| Postgres | localhost:5432        |

---

## Manual Setup

### Prerequisites

- Go 1.22+
- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL and JWT_SECRET
make migrate-up               # run all migrations
make run                      # starts on :8080
```

### Frontend

```bash
cd frontend
cp .env.example .env.local    # edit NEXT_PUBLIC_API_URL if needed
npm install
npm run dev                   # starts on :3000
```

---

## API Reference

### Auth

| Method | Path        | Auth | Description                    |
|--------|-------------|------|--------------------------------|
| POST   | /api/signup | —    | Create account, returns JWT    |
| POST   | /api/login  | —    | Sign in, returns JWT (7 days)  |

### Tasks

| Method | Path                              | Auth | Description                      |
|--------|-----------------------------------|------|----------------------------------|
| GET    | /api/tasks                        | JWT  | List tasks (see params below)    |
| POST   | /api/tasks                        | JWT  | Create task                      |
| GET    | /api/tasks/:id                    | JWT  | Get task                         |
| PATCH  | /api/tasks/:id                    | JWT  | Update task (partial)            |
| DELETE | /api/tasks/:id                    | JWT  | Delete task                      |
| GET    | /api/tasks/:id/activity           | JWT  | Activity log for a task          |
| GET    | /api/tasks/:id/attachments        | JWT  | List attachments                 |
| POST   | /api/tasks/:id/attachments        | JWT  | Upload file (max 10 MB)          |
| DELETE | /api/tasks/:id/attachments/:attId | JWT  | Delete attachment                |
| GET    | /api/uploads/:filename            | JWT  | Download file (ownership checked)|
| GET    | /api/tasks/events                 | JWT  | SSE stream for real-time updates |

### GET /api/tasks — Query Parameters

| Param    | Values                                       | Default    |
|----------|----------------------------------------------|------------|
| status   | `todo` \| `in_progress` \| `done`            | all        |
| search   | string                                       | —          |
| sort_by  | `created_at` \| `due_date` \| `priority` \| `title` | `created_at` |
| sort_dir | `asc` \| `desc`                              | `desc`     |
| page     | integer                                      | `1`        |
| limit    | integer (max 100)                            | `20`       |

---

## Running Tests

```bash
# Backend (handler + auth unit tests)
cd backend && go test ./...

# Frontend (component tests)
cd frontend && npm test
```

CI runs both suites automatically on every push and pull request to `main`.

---

## Assumptions & Trade-offs

- **No refresh tokens** — JWT expires in 7 days. Production would add a refresh-token rotation flow.
- **Local file storage** — attachments are written to disk (Docker volume in Compose). Production should use S3 or another object store with presigned URLs.
- **Raw SQL over ORM** — keeps the dependency surface small and makes queries explicit; acceptable at this scale.
- **Admin role is granted manually** — `UPDATE users SET role = 'admin' WHERE email = 'you@example.com';` No admin UI is provided.
- **Auth state in localStorage** — JWT stored via Zustand persist. Acceptable for a task app; production could prefer HttpOnly cookies to reduce XSS exposure.
