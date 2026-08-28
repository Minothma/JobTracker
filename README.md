# Job Application Tracker

A full-stack web application for tracking job and internship applications through their entire lifecycle (Applied → Interview → Offer → Rejected → Withdrawn), featuring a Kanban-style board, resume versioning with AWS S3, interview scheduling, and notes timeline.

## Tech Stack

- **Frontend**: Next.js (TypeScript, App Router), Tailwind CSS, `@dnd-kit/core`
- **Backend**: NestJS (Node.js, TypeScript), JWT Authentication (Access + Refresh tokens)
- **Database**: PostgreSQL
- **Schema Migrations**: Flyway (SQL migrations in `db/migrations/`)
- **Query Layer**: Prisma (`@prisma/client`)
- **File Storage**: AWS S3 (Presigned direct upload)
- **Email Notifications**: AWS SES
- **Infra as Code**: AWS CDK (TypeScript)
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

---

## Project Structure

```
.
├── .github/workflows/       # CI/CD pipelines
├── backend/                 # NestJS REST API
│   ├── prisma/              # Prisma schema (generated from Flyway)
│   ├── src/                 # Controllers, services, modules
│   └── test/                # Unit & E2E tests
├── db/
│   ├── migrations/          # Flyway SQL migration files (V1__init.sql)
│   └── flyway.conf          # Flyway configuration
├── frontend/                # Next.js App Router frontend
├── infra/                   # AWS CDK Infrastructure as Code
└── docker-compose.yml       # Local multi-container development environment
```

---

## Database & Migration Workflow

- **Flyway** owns the single source of truth for the database schema via versioned SQL files in `db/migrations/`.
- **Prisma** is strictly a type-safe query client. After each migration:
  ```bash
  cd backend
  npm run prisma:pull
  npm run prisma:generate
  ```

---

## Author

Developed by [Minothma](https://github.com/Minothma).
