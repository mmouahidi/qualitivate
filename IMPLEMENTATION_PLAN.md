# Qualitivate.io — Comprehensive Audit & Implementation Plan

**Date:** March 4, 2026
**Version:** 1.0
**Scope:** Full-stack application audit for a consulting company quality culture assessment platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Critical Bugs & Security Fixes (P0)](#3-critical-bugs--security-fixes-p0)
4. [High-Priority Improvements (P1)](#4-high-priority-improvements-p1)
5. [Medium-Priority Improvements (P2)](#5-medium-priority-improvements-p2)
6. [New Features for Quality Culture Auditing](#6-new-features-for-quality-culture-auditing)
7. [DevOps & Infrastructure](#7-devops--infrastructure)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Appendix: File-Level Issue Index](#9-appendix-file-level-issue-index)

---

## 1. Executive Summary

Qualitivate.io is a multi-tenant survey management platform built with a modern stack (React 19, Node.js/Express, PostgreSQL, TypeScript). It has a solid foundation with organizational hierarchy (Company → Sites → Departments → Users), role-based access control, multi-language support (EN/FR/AR), and NPS/custom survey capabilities.

However, the audit reveals **critical security gaps**, **broken features**, **missing model abstractions**, and significant opportunities to evolve the platform into a **purpose-built quality culture audit tool** for consulting engagements.

### Key Findings at a Glance

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 3 | 4 | 3 | 1 |
| Backend Bugs | 2 | 5 | 6 | 3 |
| Frontend Bugs | 2 | 4 | 7 | 5 |
| Database/Schema | 2 | 2 | 4 | 3 |
| DevOps/CI | 1 | 2 | 3 | 2 |
| **Total** | **10** | **17** | **23** | **14** |

---

## 2. Current State Assessment

### 2.1 Architecture

**Strengths:**
- Clean monorepo structure with npm workspaces (client, server, database)
- TypeScript across the full stack
- JWT authentication with refresh tokens
- Correlation ID tracing for request tracking
- Automatic camelCase/snake_case conversion between API and DB
- Multi-language support with i18next (EN, FR, AR with RTL)
- Survey builder with advanced question types
- Analytics with NPS calculation, exports (CSV, PDF)
- Template system for reusable surveys
- Distribution channels (link, QR code, embed, email)
- Taxonomy system (categories, dimensions) for question classification

**Weaknesses:**
- No model/repository layer — controllers query the database directly via Knex
- No service layer for most domains (only email and PDF services exist)
- No integration tests; all tests mock the database
- No CI test/lint step before deploy
- No server-side linting
- Limited input validation (many routes lack Joi schemas)
- Error handling inconsistencies (controllers catch errors locally instead of using the global error handler)

### 2.2 Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| User auth (login/register/refresh) | Working | Missing: forgot password, email verification |
| Organization hierarchy | Working | Companies, Sites, Departments, Users |
| RBAC (5 roles) | Working | Custom permissions table added |
| Survey CRUD | Working | Draft/active/closed lifecycle |
| Survey builder | Working | Drag-and-drop, multiple question types |
| Question translations | Working | Multi-language question content |
| Survey distribution | Partial | Link, QR, embed work; email sending needs SMTP |
| Public survey taking | Partial | Multiple-choice bug (renders as single-choice) |
| Analytics & NPS | Working | Dashboard, per-survey, per-question analytics |
| PDF/CSV export | Working | PDF report generation, CSV export |
| Templates | Partial | CRUD works; `/templates` route missing in frontend |
| Notifications | Broken | Routes defined but not mounted in Express |
| Book a Demo | Broken | Form is non-functional (mock only) |
| Forgot Password | Missing | UI disabled with "cursor-not-allowed" |
| Email Verification | Missing | No flow exists |
| Audit Trails | Missing | No tracking of who changed what |
| Soft Deletes | Missing | Hard deletes only; data loss risk |

---

## 3. Critical Bugs & Security Fixes (P0)

> These must be fixed before any further development. They represent security vulnerabilities, data integrity risks, or broken core functionality.

### 3.1 [SECURITY] Response Endpoints Are Unauthenticated

**Files:** `server/src/routes/response.routes.ts`

The following endpoints have **no authentication**:
- `POST /responses/:responseId/answer` — anyone with a responseId can submit answers
- `POST /responses/:responseId/submit` — anyone can submit a response
- `POST /responses/:responseId/complete` — anyone can complete a response
- `GET /responses/:responseId/progress` — anyone can read response progress

**Risk:** An attacker who guesses or enumerates response UUIDs can read and manipulate survey data.

**Fix:** Add either authentication or a cryptographic response token that binds the response to the session/browser. For anonymous surveys, use a signed token issued at `startResponse` and required on subsequent calls.

### 3.2 [SECURITY] No Validation That Questions Belong to the Response's Survey

**File:** `server/src/controllers/response.controller.ts`

`saveAnswer` and `submitAnswers` accept arbitrary `questionId` values without verifying they belong to the survey the response was started for.

**Risk:** Cross-survey answer injection.

**Fix:** Join `questions` on `survey_id` matching `responses.survey_id` before inserting answers.

### 3.3 [SECURITY] Distribution `sendToGroup` Lacks Access Control

**File:** `server/src/controllers/distribution.controller.ts`

`sendToGroup` does not verify the caller has access to the target department, site, or company.

**Risk:** Any authenticated user can send survey emails to any group in any company.

**Fix:** Apply `checkCompanyAccess`/`checkSiteAccess`/`checkDepartmentAccess` middleware or equivalent checks in the controller.

### 3.4 [BUG] Notification Routes Not Mounted

**File:** `server/src/index.ts`

Notification routes are defined in `notification.routes.ts` but never registered with `app.use()`.

**Fix:** Add `app.use('/api/notifications', notificationRoutes)` to `index.ts`.

### 3.5 [BUG] Rules of Hooks Violation in Permissions Page

**File:** `client/src/pages/admin/Permissions.tsx`

An early return before `useQuery`, `useEffect`, and `useMutation` calls violates React's Rules of Hooks, causing unpredictable crashes.

**Fix:** Move the role check after all hooks, or render a "not authorized" component conditionally.

### 3.6 [BUG] `answers.answered_at` Column Does Not Exist

**File:** `server/src/controllers/analytics.controller.ts`

The analytics controller selects `answers.answered_at`, but the `answers` table only has `created_at` and `updated_at`.

**Fix:** Either add an `answered_at` column via migration, or change the query to use `answers.created_at`.

### 3.7 [SECURITY] No Rate Limit on Email Distribution

**File:** `server/src/controllers/distribution.controller.ts`

`createEmailDistribution` has no limit on the number of email addresses. An attacker could use this as a spam relay.

**Fix:** Limit email list to a configurable maximum (e.g., 500) and add rate limiting to the route.

### 3.8 [SECURITY] No Unhandled Rejection/Exception Handlers

**File:** `server/src/index.ts`

No `process.on('unhandledRejection')` or `process.on('uncaughtException')` handlers. Unhandled errors will crash the process silently.

**Fix:** Add global handlers that log the error and gracefully shut down.

### 3.9 [BUG] Notifications Migration Rollback Drops Wrong Column

**File:** `database/migrations/20260201000002_create_notifications_table.ts`

The `down()` function drops `responses.respondent_id`, which was created in an earlier migration. Rolling back would break the schema.

**Fix:** Only drop columns/tables that this migration created.

### 3.10 [BUG] `multiple_choice` Renders as Single-Choice

**File:** `client/src/pages/public/TakeSurvey.tsx`

The `multiple_choice` question type uses the same single-select radio UI as `single_choice`.

**Fix:** Render checkboxes for `multiple_choice` and store an array of selected values.

---

## 4. High-Priority Improvements (P1)

### 4.1 Backend

#### 4.1.1 Introduce a Model/Repository Layer

Controllers currently contain raw Knex queries, leading to:
- Duplicated access-control logic
- No single source of truth for entity shapes
- Hard to unit test without mocking Knex

**Action:** Create `server/src/models/` with classes like `SurveyModel`, `UserModel`, `CompanyModel`, etc. Each model encapsulates:
- CRUD operations
- Scoped queries (by company, site, department)
- Pagination helpers
- Soft-delete logic (once added)

#### 4.1.2 Add Joi Validation to All Routes

Currently missing validation on:
- Company CRUD
- Site CRUD
- Department CRUD
- Question CRUD
- Response (saveAnswer, submitAnswers, startResponse)
- Distribution (createEmailDistribution, sendToGroup, createEmbedDistribution)
- Template CRUD
- Analytics query params (startDate, endDate, format)

**Action:** Create validator files for each domain and apply `validate()` middleware on all routes.

#### 4.1.3 Fix User List Count Query

**File:** `server/src/controllers/user.controller.ts`

The count query uses unescaped `search` while the main query uses `escapeIlike(search)`.

**Action:** Use `escapeIlike` in both queries.

#### 4.1.4 Implement Forgot Password Flow

**Action:**
1. `POST /api/auth/forgot-password` — sends a reset link via email
2. `POST /api/auth/reset-password` — validates token and updates password
3. Add `password_reset_tokens` table
4. Frontend pages for request and reset

#### 4.1.5 Implement Email Verification

**Action:**
1. `POST /api/auth/verify-email` — validates token
2. `POST /api/auth/resend-verification` — resends email
3. Add `email_verified_at` column to `users`
4. Optionally block login until verified

#### 4.1.6 Fix `duplicateSurvey` to Copy All Fields

**File:** `server/src/controllers/survey.controller.ts`

Missing fields: `starts_at`, `ends_at`, `notification_emails`, `schema`, `theme`, `quiz_settings`.

#### 4.1.7 Template `createSurveyFromTemplate` Missing Fields

**File:** `server/src/controllers/template.controller.ts`

Does not copy `extended_type`, `category_id`, `dimension_id` from template questions.

### 4.2 Frontend

#### 4.2.1 Add Missing `/templates` Route

**File:** `client/src/App.tsx`

The Templates page exists but has no route. Also missing from the sidebar navigation.

#### 4.2.2 Fix Login Page Non-Functional Features

- "Remember me" checkbox state is never used
- "Forgot password" is disabled with no implementation

**Action:** Wire "Remember me" to token persistence strategy. Implement forgot password flow (see 4.1.4).

#### 4.2.3 Add Role-Based Route Protection

Currently `ProtectedRoute` only checks authentication. Role checks happen inside page components after render.

**Action:** Create an `AuthorizedRoute` wrapper that accepts allowed roles and redirects unauthorized users before rendering the page.

#### 4.2.4 Fix BookDemo Form

**File:** `client/src/pages/public/BookDemo.tsx`

Form is non-functional — inputs are uncontrolled and submission is a mock.

**Action:** Wire to a real API endpoint or integrate with a third-party scheduling tool (Calendly, Cal.com).

#### 4.2.5 Add Sidebar Navigation for Missing Pages

Currently missing from sidebar: Users, Sites, Templates, Permissions.

#### 4.2.6 Replace `alert()`/`confirm()` with Proper UI

**Files:** `SurveyBuilder.tsx`, `SurveyEditor.tsx`

**Action:** Use `ConfirmModal` for destructive actions and `toast` for success messages.

#### 4.2.7 Use React Hook Form + Zod

`react-hook-form` and `@hookform/resolvers` are in `package.json` but unused. All forms use manual `useState`.

**Action:** Migrate forms to React Hook Form with Zod validation for consistent validation, error display, and reduced boilerplate.

---

## 5. Medium-Priority Improvements (P2)

### 5.1 Backend

| # | Improvement | Details |
|---|-------------|---------|
| 1 | Centralize error handling | Refactor controllers to use `next(err)` instead of local `res.status(500).json()`. Create `AppError` class with status codes. |
| 2 | Add `stripUnknown` to validation | Validation middleware allows unknown fields through; add `stripUnknown: true` to Joi options. |
| 3 | Add audit fields | Add `created_by`, `updated_by` to all major tables. |
| 4 | Add soft deletes | Add `deleted_at` column; filter queries to exclude soft-deleted records. |
| 5 | Optimize N+1 in analytics | `getQuestionAnalytics` runs one query per question; batch into a single query with `GROUP BY question_id`. |
| 6 | Add ESLint to server | No linting exists for server code. Add ESLint + Prettier. |
| 7 | Log rotation | Logger writes to `logs/` but no rotation config; add `winston-daily-rotate-file`. |
| 8 | Validate SMTP config at startup | Email service creates transporter at module load; validate env vars early. |
| 9 | Add pagination utility | Multiple controllers implement pagination differently; centralize. |
| 10 | Add response token for anonymous surveys | Issue a signed JWT when `startResponse` is called; require it on subsequent answer/submit calls. |

### 5.2 Frontend

| # | Improvement | Details |
|---|-------------|---------|
| 1 | Add code-splitting / lazy loading | Routes load eagerly; use `React.lazy()` for heavy pages (Analytics, SurveyBuilder). |
| 2 | Memoize context values | `AuthContext` creates new objects each render; wrap in `useMemo`. |
| 3 | Add `staleTime` to queries | TanStack Query has no `staleTime`; data refetches unnecessarily. |
| 4 | Complete i18n coverage | BookDemo, Companies, Permissions, many modals have hardcoded English strings. |
| 5 | Improve accessibility | Add skip-to-content link, `aria-invalid` on form fields, `scope="col"` on tables, `aria-pressed` on toggle buttons. |
| 6 | Fix `toggle-primary` and `badge-info` CSS | Classes referenced but not defined in `index.css`. |
| 7 | Profile notification toggles | `defaultChecked` toggles not wired to any backend endpoint. |
| 8 | Debounced search | List views (Users, Surveys) should debounce search input. |
| 9 | Preserve return URL on auth redirect | When 401 refresh fails, redirect loses the current URL; save it and redirect back after login. |
| 10 | Table responsiveness | Some tables overflow on mobile; add horizontal scroll or card view. |

### 5.3 Database

| # | Improvement | Details |
|---|-------------|---------|
| 1 | Add index on `responses.completed_at` | Analytics queries filter on this column frequently. |
| 2 | Add index on `answers.response_id` + `question_id` | Common join pattern in analytics. |
| 3 | Sync `companies.sites_count` | Denormalized count can drift; add a DB trigger or application-level sync. |
| 4 | Clarify `email` vs `email_list` in distributions | Document or consolidate the two fields. |
| 5 | Add `notifications.id` default | Missing `defaultTo(knex.raw('gen_random_uuid()'))`. |
| 6 | Use consistent UUID generation | `role_permissions` uses `knex.fn.uuid()`; all others use `knex.raw('gen_random_uuid()')`. |

---

## 6. New Features for Quality Culture Auditing

> These features transform Qualitivate from a generic survey tool into a purpose-built quality culture assessment platform for consulting engagements.

### 6.1 Audit Engagement Management

**Purpose:** Manage the lifecycle of consulting engagements (client onboarding → assessment → report → follow-up).

**Features:**
- **Engagements table:** client company, start/end dates, assigned consultants, status (planned/in-progress/completed/follow-up)
- **Engagement dashboard:** per-client view of all surveys, scores, reports
- **Timeline view:** track milestones and deliverables
- **Client portal:** read-only view for clients to see their results and action items

**Tables:**
```
engagements: id, company_id, title, description, status, lead_consultant_id, start_date, end_date, created_at, updated_at
engagement_members: id, engagement_id, user_id, role (lead/consultant/observer)
engagement_milestones: id, engagement_id, title, due_date, completed_at, status
```

### 6.2 Quality Culture Maturity Model

**Purpose:** Score organizations against a structured maturity model with dimensions and levels.

**Features:**
- **Maturity frameworks:** configurable models (e.g., 5-level maturity: Reactive → Managed → Defined → Quantitatively Managed → Optimizing)
- **Dimensions:** map survey questions to quality dimensions (Leadership, Process, People, Culture, Systems)
- **Auto-scoring:** calculate maturity level per dimension based on survey responses
- **Spider/Radar charts:** visualize maturity across dimensions
- **Gap analysis:** compare current vs. target maturity level
- **Historical tracking:** show maturity progression over time

**Tables:**
```
maturity_frameworks: id, name, description, levels (jsonb), created_by
maturity_dimensions: id, framework_id, name, description, weight, order_index
maturity_mappings: id, dimension_id, question_id, scoring_rule (jsonb)
maturity_assessments: id, engagement_id, framework_id, survey_id, assessed_at
maturity_scores: id, assessment_id, dimension_id, score, level, evidence (jsonb)
```

### 6.3 Benchmarking Engine

**Purpose:** Compare client results against industry benchmarks, peer companies, and historical data.

**Features:**
- **Industry benchmarks:** aggregate anonymized data by industry/sector
- **Peer comparison:** compare client scores against similar-sized companies
- **Internal benchmarking:** compare sites/departments within the same company
- **Benchmark reports:** percentile rankings, above/below average indicators
- **Trend lines:** show improvement or decline over multiple assessments

**Tables:**
```
benchmark_pools: id, name, industry, region, company_size_range, is_public
benchmark_data: id, pool_id, dimension, metric, period, percentile_25, median, percentile_75, sample_size
benchmark_subscriptions: id, company_id, pool_id, joined_at
```

### 6.4 Action Plan & Recommendation Tracker

**Purpose:** Convert audit findings into trackable action items with ownership and deadlines.

**Features:**
- **Auto-generated recommendations:** based on low-scoring dimensions
- **Action items:** assignee, due date, priority, status, linked dimension
- **Progress tracking:** percentage complete, status updates
- **Follow-up surveys:** schedule re-assessment surveys to measure improvement
- **Notification reminders:** email reminders for overdue items

**Tables:**
```
action_plans: id, engagement_id, title, created_by, status, created_at
action_items: id, plan_id, title, description, assignee_id, priority, status, due_date, dimension_id, completed_at
action_item_updates: id, item_id, user_id, content, status_change, created_at
```

### 6.5 Advanced Reporting & White-Labeling

**Purpose:** Generate professional audit reports branded for the consulting company and/or client.

**Features:**
- **Report templates:** customizable PDF/PowerPoint report layouts
- **Executive summary:** auto-generated narrative from scores and benchmarks
- **White-labeling:** per-client branding (logo, colors, fonts) on surveys and reports
- **Report sections:** methodology, findings, scores, benchmarks, recommendations, appendix
- **Scheduled reports:** auto-generate and email periodic reports
- **Export formats:** PDF, PowerPoint, Excel

**Tables:**
```
report_templates: id, name, layout (jsonb), branding (jsonb), created_by
generated_reports: id, engagement_id, template_id, format, file_url, generated_at
company_branding: id, company_id, logo_url, primary_color, secondary_color, font
```

### 6.6 Multi-Framework Support

**Purpose:** Support industry-standard quality frameworks alongside custom models.

**Frameworks to support:**
- **ISO 9001:2015** — Quality Management Systems
- **EFQM** — European Foundation for Quality Management
- **Baldrige Excellence Framework**
- **Six Sigma / DMAIC** alignment
- **Custom client frameworks**

**Features:**
- Pre-built survey templates mapped to each framework
- Clause/criterion-level scoring
- Compliance gap identification
- Framework-specific report formats

### 6.7 Consultant Collaboration Tools

**Purpose:** Enable consulting teams to work together on engagements.

**Features:**
- **Internal notes:** per-engagement, per-survey, per-response annotations
- **Tagging:** tag responses and answers for follow-up
- **Assignment:** assign specific surveys or sites to team members
- **Activity feed:** track all actions taken on an engagement
- **Comment threads:** discuss findings within the platform

**Tables:**
```
notes: id, entity_type, entity_id, user_id, content, is_internal, created_at
tags: id, name, color, company_id
entity_tags: id, tag_id, entity_type, entity_id, tagged_by, created_at
activity_log: id, engagement_id, user_id, action, entity_type, entity_id, metadata, created_at
```

### 6.8 Scheduled & Recurring Surveys

**Purpose:** Automate periodic quality assessments.

**Features:**
- **Recurrence rules:** weekly, monthly, quarterly, annually
- **Auto-distribution:** automatically send to configured groups
- **Comparison view:** compare results across periods
- **Trend alerts:** notify when scores drop below threshold

**Tables:**
```
survey_schedules: id, survey_id, recurrence_rule (jsonb), next_run_at, last_run_at, is_active
survey_schedule_runs: id, schedule_id, survey_id, distributed_at, response_count
```

### 6.9 Advanced Question Types

**Purpose:** Support richer data collection for quality audits.

**New question types:**
- **Photo/file upload** — capture evidence (e.g., workplace photos for 5S audits)
- **Signature capture** — sign off on audit forms
- **Geolocation** — tag responses with location data
- **Conditional sections** — show/hide entire sections based on previous answers (partially implemented via logic rules)
- **Weighted scoring** — assign different weights to options for maturity calculation
- **Likert scale with labels** — pre-defined agreement/frequency scales
- **Ranking** — drag-and-drop ranking of items

### 6.10 Client Self-Service Portal

**Purpose:** Give audit clients controlled access to view their results without full platform access.

**Features:**
- **Read-only dashboard** for clients
- **Downloadable reports**
- **Action item status tracking**
- **Survey completion status** by site/department
- **Secure, time-limited access links**

---

## 7. DevOps & Infrastructure

### 7.1 CI/CD Pipeline (Immediate)

**Current state:** GitHub Actions deploys on push to main with no tests or linting.

**Target state:**

```yaml
# Proposed CI/CD Pipeline
on: [push, pull_request]

jobs:
  lint:
    - ESLint (client + server)
    - Prettier check
    - TypeScript type checking

  test:
    - Unit tests (Jest)
    - Integration tests (test DB)
    - Coverage report (fail if < 80%)

  build:
    - Build client
    - Build server
    - Build database

  deploy (main only):
    - Run migrations
    - Deploy to VPS
    - Health check
    - Rollback on failure
```

### 7.2 Containerization

**Action:** Add Docker support for consistent development and deployment.

```
Dockerfile (multi-stage)
docker-compose.yml (app + postgres + redis)
docker-compose.dev.yml (with hot reload)
```

### 7.3 Environment Management

| Item | Action |
|------|--------|
| Root `.env.example` | Create with all required variables documented |
| Staging environment | Add a staging VPS or use Railway for pre-production |
| Secret management | Move from `.env` files to a secrets manager |
| Database backups | Add automated daily pg_dump with retention policy |

### 7.4 Monitoring & Observability

| Item | Action |
|------|--------|
| Sentry | Already configured; verify it captures all errors |
| Health checks | Expand `/health` to check DB, Redis, SMTP connectivity |
| Uptime monitoring | Add external ping monitoring (UptimeRobot, Better Stack) |
| Log aggregation | Ship logs to a central service (Loki, CloudWatch) |
| APM | Add request duration tracking; identify slow endpoints |

---

## 8. Implementation Roadmap

### Phase 0: Critical Fixes (Week 1-2)

> Zero tolerance for security vulnerabilities and broken core features.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | Add auth/token binding to response endpoints | 4h | P0 |
| 2 | Validate question belongs to response's survey | 2h | P0 |
| 3 | Add access control to `sendToGroup` | 2h | P0 |
| 4 | Mount notification routes | 0.5h | P0 |
| 5 | Fix Permissions page hooks violation | 1h | P0 |
| 6 | Fix `answers.answered_at` reference | 1h | P0 |
| 7 | Add rate limit to email distribution | 2h | P0 |
| 8 | Add unhandled rejection handlers | 1h | P0 |
| 9 | Fix notifications migration rollback | 1h | P0 |
| 10 | Fix multiple-choice rendering | 2h | P0 |

**Estimated total: 16.5 hours**

### Phase 1: Stability & Quality (Week 3-5)

> Establish a solid foundation before adding features.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | Add ESLint + Prettier to server | 4h | P1 |
| 2 | Add Joi validation to all unvalidated routes | 8h | P1 |
| 3 | Fix `escapeIlike` in user count query | 0.5h | P1 |
| 4 | Fix `duplicateSurvey` missing fields | 2h | P1 |
| 5 | Fix template `createSurveyFromTemplate` missing fields | 2h | P1 |
| 6 | Add `/templates` route and sidebar links | 2h | P1 |
| 7 | Wire Login "Remember me" and implement forgot password | 12h | P1 |
| 8 | Add role-based route protection (`AuthorizedRoute`) | 4h | P1 |
| 9 | Fix BookDemo form or replace with Calendly embed | 4h | P1 |
| 10 | Replace `alert()`/`confirm()` with ConfirmModal/Toast | 3h | P1 |
| 11 | Add CI test + lint step before deploy | 4h | P1 |
| 12 | Create root `.env.example` | 1h | P1 |

**Estimated total: 46.5 hours**

### Phase 2: Architecture & Polish (Week 6-9)

> Refactor for maintainability and improve UX.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | Introduce model/repository layer | 20h | P2 |
| 2 | Centralize error handling with AppError class | 8h | P2 |
| 3 | Add soft deletes to all major entities | 8h | P2 |
| 4 | Add audit fields (created_by, updated_by) | 6h | P2 |
| 5 | Migrate forms to React Hook Form + Zod | 12h | P2 |
| 6 | Add code-splitting / lazy routes | 4h | P2 |
| 7 | Complete i18n coverage | 8h | P2 |
| 8 | Improve accessibility (skip link, ARIA, focus) | 8h | P2 |
| 9 | Add database indexes for analytics queries | 2h | P2 |
| 10 | Add Docker + docker-compose | 8h | P2 |
| 11 | Add integration tests with test database | 16h | P2 |
| 12 | Memoize context values, add staleTime to queries | 4h | P2 |

**Estimated total: 104 hours**

### Phase 3: Audit Platform Features (Week 10-16)

> Transform from generic survey tool to quality culture audit platform.

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| 1 | Engagement Management (CRUD, dashboard, timeline) | 40h | P1 |
| 2 | Quality Culture Maturity Model (framework, dimensions, scoring) | 48h | P1 |
| 3 | Action Plan & Recommendation Tracker | 32h | P1 |
| 4 | Advanced Reporting & White-Labeling | 40h | P2 |
| 5 | Internal Benchmarking (cross-site/department) | 24h | P2 |
| 6 | Consultant Collaboration (notes, tags, activity log) | 24h | P2 |

**Estimated total: 208 hours**

### Phase 4: Advanced Features (Week 17-24)

> Scale the platform with advanced capabilities.

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| 1 | External Benchmarking Engine (industry/peer) | 40h | P2 |
| 2 | Scheduled & Recurring Surveys | 24h | P2 |
| 3 | Client Self-Service Portal | 32h | P2 |
| 4 | Multi-Framework Support (ISO 9001, EFQM, Baldrige) | 40h | P3 |
| 5 | Advanced Question Types (file upload, signature, geolocation) | 32h | P3 |
| 6 | PowerPoint Report Export | 24h | P3 |
| 7 | Email Verification Flow | 8h | P2 |
| 8 | Database Backup Automation | 4h | P2 |
| 9 | Staging Environment Setup | 8h | P2 |

**Estimated total: 212 hours**

### Summary Timeline

```
Week  1-2:   Phase 0 — Critical Fixes                    (~17h)
Week  3-5:   Phase 1 — Stability & Quality               (~47h)
Week  6-9:   Phase 2 — Architecture & Polish              (~104h)
Week 10-16:  Phase 3 — Audit Platform Features            (~208h)
Week 17-24:  Phase 4 — Advanced Features                  (~212h)
─────────────────────────────────────────────────────────────────
Total estimated effort:                                    ~588h
```

---

## 9. Appendix: File-Level Issue Index

### Backend Issues

| File | Line(s) | Issue | Severity |
|------|---------|-------|----------|
| `server/src/index.ts` | — | Notification routes not mounted | Critical |
| `server/src/index.ts` | — | No `process.on('unhandledRejection')` handler | Critical |
| `server/src/index.ts` | 192-213 | Global error handler assumes `err.status`; should also check `err.statusCode` | Medium |
| `server/src/routes/response.routes.ts` | — | `saveAnswer`, `submitAnswers`, `completeResponse`, `getResponseProgress` have no auth | Critical |
| `server/src/controllers/response.controller.ts` | 226-266 | No validation that `questionId` belongs to the response's survey | Critical |
| `server/src/controllers/response.controller.ts` | 316-331 | No validation that `answers` is a non-empty array | Medium |
| `server/src/controllers/response.controller.ts` | 11-48 | `triggerResponseNotification` is fire-and-forget; errors not handled | Medium |
| `server/src/controllers/user.controller.ts` | 76-79 | Count query uses unescaped search | High |
| `server/src/controllers/user.controller.ts` | 391 | `updateData: any` weak typing | Low |
| `server/src/controllers/survey.controller.ts` | 321-327 | `duplicateSurvey` omits `starts_at`, `ends_at`, `notification_emails` | High |
| `server/src/controllers/survey.controller.ts` | 105,223,328 | Empty logger error messages | Low |
| `server/src/controllers/distribution.controller.ts` | 159-194 | No email count limit | High |
| `server/src/controllers/distribution.controller.ts` | 218-254 | `sendToGroup` no access control | Critical |
| `server/src/controllers/analytics.controller.ts` | 447-451 | N+1 query in `getQuestionAnalytics` | Medium |
| `server/src/controllers/analytics.controller.ts` | 870-871 | References `answers.answered_at` which doesn't exist | Critical |
| `server/src/controllers/template.controller.ts` | 447-450 | `createSurveyFromTemplate` missing `extended_type`, `category_id`, `dimension_id` | High |
| `server/src/controllers/company.controller.ts` | 112-118 | `settings` passed without validation | Medium |
| `server/src/controllers/notification.controller.ts` | 11-12 | `limit`/`offset` not validated; DoS risk | Medium |
| `server/src/middlewares/validation.middleware.ts` | 23-27 | No `stripUnknown`; unknown fields pass through | Medium |
| `server/src/services/email.service.ts` | 13-21 | Transporter created at module load without checking SMTP vars | Medium |
| `server/src/config/logger.ts` | 44-55 | `logs/` directory may not exist | Low |

### Frontend Issues

| File | Issue | Severity |
|------|-------|----------|
| `client/src/pages/admin/Permissions.tsx` | Rules of Hooks violation (conditional early return before hooks) | Critical |
| `client/src/App.tsx` | Missing `/templates` route | Critical |
| `client/src/pages/public/TakeSurvey.tsx` | `multiple_choice` renders as single-choice | High |
| `client/src/pages/public/BookDemo.tsx` | Form non-functional (mock only, uncontrolled inputs) | High |
| `client/src/pages/Login.tsx` | "Remember me" unused; "Forgot password" disabled | High |
| `client/src/pages/Profile.tsx` | Notification toggles use `defaultChecked`, not wired to backend | Medium |
| `client/src/pages/Profile.tsx` | `toggle-primary` CSS class not defined | Medium |
| `client/src/pages/admin/Users.tsx` | `badge-info` CSS class not defined | Medium |
| `client/src/components/layout/DashboardLayout.tsx` | Sidebar missing Users, Sites, Templates, Permissions links | Medium |
| `client/src/pages/surveys/SurveyBuilder.tsx` | Uses `alert()`/`confirm()` instead of ConfirmModal/Toast | Medium |
| `client/src/pages/NotFound.tsx` | Typo: "Go back previous page" → "Go back to previous page" | Low |
| `client/src/pages/public/LandingPage.tsx` | Trust section uses hardcoded placeholder company names | Low |
| `client/src/services/api.ts` | Refresh failure redirects without preserving return URL | Medium |
| `client/src/contexts/AuthContext.tsx` | Context value not memoized; causes unnecessary re-renders | Medium |

### Database Issues

| File | Issue | Severity |
|------|-------|----------|
| `database/migrations/20260201000002` | `down()` drops `responses.respondent_id` from earlier migration | Critical |
| `database/migrations/20260303000001` | Uses `knex.fn.uuid()` instead of `knex.raw('gen_random_uuid()')` | Medium |
| `database/migrations/20260209000001` | `down()` sets `company_id` NOT NULL; fails if null rows exist | Medium |
| `database/seeds/001 + 002` | Duplicate 5Q food safety template seeding | Low |
| — | Missing index on `responses.completed_at` | Medium |
| — | Missing index on `answers(response_id, question_id)` | Medium |
| — | `notifications.id` missing default UUID generation | Low |
| — | `companies.sites_count` can drift from actual count | Low |

---

*This plan should be reviewed and prioritized based on team capacity and business timelines. Phase 0 items are non-negotiable and should be addressed before any production traffic. Phases 3-4 represent the strategic differentiator — transforming Qualitivate from a survey tool into a consulting-grade quality culture audit platform.*
