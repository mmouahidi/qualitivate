# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Qualitivate.io is a multi-tenant quality survey management platform with a Company → Sites → Departments → Users organizational hierarchy. It supports NPS and custom surveys with multi-language support and role-based access control (super_admin, company_admin, site_admin, department_admin, user).

## Repository & Deployment

- **GitHub**: https://github.com/mmouahidi/qualitivate
- **Production Server**: Contabo Cloud VPS 20 SSD (Ubuntu 24.04)
- **Production URL**: http://161.97.88.40/
- **Server IP**: 161.97.88.40 (IPv6: 2a02:c207:2307:9436::1)
- **Location**: Hub Europe

## Tech Stack

- **Backend**: Node.js + Express + TypeScript, PostgreSQL with Knex.js, JWT authentication
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form + Zod

## Commands

### Development
```bash
npm run dev              # Start both client (port 5173) and server (port 5000)
npm run dev:server       # Start only backend
npm run dev:client       # Start only frontend
```

### Build
```bash
npm run build            # Build database, client, and server
npm run build:db         # Compile database migrations/seeds only
npm run build:all        # Same as build (explicit)
```

### Database Migrations
```bash
cd server
npm run migrate                           # Run pending migrations
npm run migrate:rollback                  # Rollback last migration
npm run migrate:make <migration_name>     # Create new migration
```

Migrations are in `database/migrations/` as TypeScript files. They must be compiled with `npm run build:db` before running in production.

### Testing
```bash
cd server
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

Tests use Jest with ts-jest. Test files are in `server/src/__tests__/` following pattern `*.test.ts`. Test setup is in `server/src/__tests__/setup.ts` which provides `mockRequest`, `mockResponse`, and `mockNext` helpers.

### Linting (Client only)
```bash
cd client
npm run lint             # ESLint for React/TypeScript
```

## Architecture

### Monorepo Structure

Uses npm workspaces with three packages:
- `client/` - React frontend
- `server/` - Express API backend
- `database/` - Shared migrations and seeds (compiled separately)

### Backend Patterns

**Route → Controller → Service → Model**

- Routes (`server/src/routes/`) define endpoints and apply middleware
- Controllers handle HTTP request/response
- Services contain business logic
- Models interact with database via Knex

**Middleware chain**: `correlationId` → `helmet` → `cors` → `rateLimit` → `authenticate` → `authorize` → route handler

**Authentication**: JWT with access + refresh tokens. Use `authenticate` middleware for protected routes, `authorize(...roles)` for role checking, `optionalAuthenticate` for routes that work with or without auth.

**Multi-tenant access control**: Middlewares `checkCompanyAccess`, `checkSiteAccess`, `checkDepartmentAccess` enforce organizational hierarchy permissions.

**Validation**: Joi schemas in `server/src/validators/`. Use `validate(schema)` middleware from `validation.middleware.ts`. Schemas define `body`, `params`, and `query` validation.

**Environment**: All env vars validated at startup via `server/src/config/env.ts` using Joi. Import `env` object rather than accessing `process.env` directly.

**Case conversion**: API responses are automatically converted to camelCase via `camelCaseResponse()` middleware. Database uses snake_case.

### Frontend Patterns

**Provider hierarchy** (in `App.tsx`): `QueryClientProvider` → `ThemeProvider` → `ToastProvider` → `AuthProvider` → `ErrorBoundary` → `Router`

**API layer**: `client/src/services/api.ts` configures axios with auth token injection, automatic refresh on 401, rate limit retry with exponential backoff, and snake_case → camelCase response transformation.

**State management**: React Context for auth (`AuthContext`), toast notifications (`ToastContext`), theme (`ThemeContext`), sidebar (`SidebarContext`). TanStack Query for server state.

**Forms**: React Hook Form with Zod validation via `@hookform/resolvers`.

**Protected routes**: Wrap with `<ProtectedRoute>` component which checks `AuthContext`.

### Database

Knex configuration in `server/src/config/knexfile.ts`. Supports both `DATABASE_URL` (for Railway/PaaS) and individual `DB_*` env vars.

Key tables: `companies`, `sites`, `departments`, `users`, `surveys`, `questions`, `question_translations`, `survey_translations`, `survey_distributions`, `responses`, `answers`, `refresh_tokens`.

## Important Conventions

- Use UUIDs for all primary keys
- Backend uses snake_case for database columns; API transforms to camelCase for responses
- Frontend sends camelCase which backend accepts (Joi schemas use camelCase field names)
- Passwords hashed with bcrypt (10 rounds)
- JWT secrets must be at least 32 characters
- Error responses include `correlationId` for tracing
- Logger (`server/src/config/logger.ts`) uses Winston; always include `correlationId` in logs
