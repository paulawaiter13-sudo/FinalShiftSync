# ShiftSync - Shift Handover Platform

Intelligent operational information system for managing shifts, handovers, incidents, alerts, tasks, and AI-generated shift summaries for 24/7 NOC teams.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Prisma ORM

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or Docker)
- npm or pnpm

## Quick Start

### Stage 1 – Backend

### 1. PostgreSQL

Create a database (default name: `shiftsync_app`):

```bash
createdb shiftsync_app
```

Or with Docker:

```bash
docker run --name shiftsync-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shiftsync_app -p 5432:5432 -d postgres:16
```

**macOS Homebrew PostgreSQL:** use your system username in `DATABASE_URL` (no password), e.g. `postgresql://YOUR_USERNAME@localhost:5432/shiftsync_app`

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

API runs at **http://localhost:3001**

- Health: `GET http://localhost:3001/api/health`
- API info: `GET http://localhost:3001/api`

### 3. Default seed users

| Email | Password | Role |
|-------|----------|------|
| paula.waiter@shiftsync.local | password123 | OPERATOR |
| ronny.binya@shiftsync.local | password123 | OPERATOR |
| olya.vygodina@shiftsync.local | password123 | OPERATOR |
| rachel.green@shiftsync.local | password123 | SHIFT_MANAGER |
| admin@shiftsync.local | password123 | ADMIN |

## Environment Variables

See `backend/.env.example` for required variables.

### Stage 2 – Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and sign in with `paula.waiter@shiftsync.local` / `password123`.

The Vite dev server proxies `/api` to the backend on port 3001.

### Stage 3 – Shifts, Incidents & Tasks

Implemented modules:

| Module | Routes | Features |
|--------|--------|----------|
| **Shifts** | `/shifts`, `/shifts/:id` | List, create, start/end, handover notes, detail view |
| **Incidents** | `/incidents`, `/incidents/:id` | Table + filters, create, assign, status, resolve, notes |
| **Tasks** | `/tasks` | Table + filters, create, mark done, delete |

API endpoints: `GET/POST/PATCH /api/shifts`, `POST .../start|end`, `GET/POST/PATCH /api/incidents`, `POST .../resolve|notes`, `GET/POST/PATCH/DELETE /api/tasks`, `GET /api/users`.

### Stage 4 – Monitoring Simulator

| Endpoint | Description |
|----------|-------------|
| `GET /api/alerts` | List alerts (filters: severity, status, service) |
| `POST /api/alerts/generate` | Generate 1–5 mock alerts from templates |
| `PATCH /api/alerts/:id/acknowledge` | Acknowledge alert |
| `PATCH /api/alerts/:id/dismiss` | Dismiss alert |
| `POST /api/alerts/:id/convert-to-incident` | Create incident and link alert |

Frontend: **Monitoring** page (`/monitoring`) with generate, triage, and convert workflow.

### Stage 5 – AI Shift Summaries

| Endpoint | Description |
|----------|-------------|
| `GET /api/summaries` | List all summaries |
| `GET /api/shifts/:id/summary` | Summaries for a shift |
| `POST /api/shifts/:id/generate-summary` | Generate via AI provider |
| `PATCH /api/summaries/:id` | Edit saved summary text |

Modular AI layer: `backend/src/ai/` with `MockLlamaProvider` (swap via `AI_PROVIDER=llama` later).

Frontend: **AI Summaries** page + **Generate AI Summary** on shift detail (edit, copy).

### Stage 6 – Announcements, Settings & Polish

| Feature | Details |
|---------|---------|
| **Announcements** | Master-detail UI, All/Unread/Urgent tabs, create/edit/delete (Manager/Admin) |
| **Settings** | Team members table with roles |
| **Polish** | Mobile sidebar, logout menu, `ErrorAlert` component, responsive layout |

Announcement API: `GET/POST/PATCH/DELETE /api/announcements`

## Project Structure

```
├── backend/          # Express API + Prisma
│   ├── prisma/
│   └── src/
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── pages/
        ├── components/
        ├── layouts/
        └── services/
```

## Development Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | backend | Start API with hot reload |
| `npm run dev` | frontend | Start React app (port 5173) |
| `npm run db:seed` | backend | Seed development data |
| `npx prisma studio` | backend | Open Prisma Studio |

## Complete Application

All 6 stages are implemented. After starting backend + frontend:

| Module | Route | Highlights |
|--------|-------|------------|
| Dashboard | `/` | KPIs, shift status, handover preview |
| Shifts | `/shifts` | Start/end, handover notes |
| Incidents | `/incidents` | Filters, resolve, notes |
| Monitoring | `/monitoring` | Mock alerts, convert to incident |
| Tasks | `/tasks` | Priority filters, mark done |
| AI Summaries | `/summaries` | Mock Llama provider |
| Announcements | `/announcements` | Manager updates (master-detail) |
| Settings | `/settings` | User directory |

**Manager login** (`rachel.green@shiftsync.local`) can create announcements. **Operators** can view and mark as read.

## License

Academic / workshop project.
