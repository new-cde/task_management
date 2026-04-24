# TaskFlow — Multi-tenant Task Management

A modern, multi-tenant task manager with JWT auth, RBAC (Owner/Admin/Member), strict tenant isolation, and audit logging.

## Stack
- **Frontend**: React + Vite + Tailwind CSS (built in Lovable)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 16
- **Auth**: JWT (token contains `userId`, `organizationId`, `role`)

## Folder layout

```
.
├── docker-compose.yaml
├── Dockerfile.frontend
├── nginx.conf
├── taskflow-backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── sql/schema.sql
│   └── src/
│       ├── server.js
│       ├── db/pool.js
│       ├── middleware/auth.js
│       └── routes/{auth.js,tasks.js}
└── taskflow-frontend/         # copy your Lovable export here
```

## Quick start (Docker)

1. Place your Lovable React export into `taskflow-frontend/` (must contain `package.json`, `vite.config.ts`, `src/`, `index.html`).
2. From the project root:
   ```bash
   docker compose up --build
   ```
3. Open:
   - Frontend: http://localhost:8080
   - API: http://localhost:4000/api/health
   - Postgres: localhost:5432 (user/pass/db = `taskflow`)

The schema is auto-loaded from `taskflow-backend/sql/schema.sql` on first run.

## Local dev (no Docker)

**Backend**:
```bash
cd taskflow-backend
cp .env.example .env       # adjust DATABASE_URL & JWT_SECRET
npm install
npm run dev
```

**Frontend** (in your Lovable project):
```bash
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm install
npm run dev
```

## RBAC model

| Role   | Permissions                                                  |
|--------|--------------------------------------------------------------|
| owner  | Full access to all tasks in their organization (auto-assigned at registration). |
| admin  | Full access to all tasks in their organization.              |
| member | Can create tasks; can only view/edit/delete tasks they created. |

Tenant isolation is enforced on **every** query via `organization_id` derived from the JWT — never from the request body.

## API

All routes are prefixed with `/api`. Auth routes are public; everything else requires `Authorization: Bearer <token>`.

| Method | Path             | Description                          |
|--------|------------------|--------------------------------------|
| POST   | `/register`      | Create org + owner user, returns JWT |
| POST   | `/login`         | Returns JWT                          |
| GET    | `/tasks`         | List tasks (scoped by role)          |
| GET    | `/tasks/:id`     | Single task                          |
| POST   | `/tasks`         | Create task                          |
| PUT    | `/tasks/:id`     | Update task                          |
| DELETE | `/tasks/:id`     | Delete task                          |

Every create/update/delete writes a row to `task_logs` with `task_id`, `action`, `performed_by`, `timestamp`.

## Promoting users

To make an existing user an `admin`:
```sql
UPDATE users SET role='admin' WHERE email='someone@example.com';
```

## Security notes
- Passwords hashed with bcrypt (cost 10).
- JWT secret MUST be changed before deployment (`JWT_SECRET`).
- All queries are parameterized.
- CORS restricted via `CORS_ORIGIN`.
- Input validated with Zod on every mutation.
