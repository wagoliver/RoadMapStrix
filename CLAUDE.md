# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RoadMapStrix is a product roadmap planning tool built with Next.js 14 (App Router). It features quarter-based planning (Planning, By Quarter, Storyboard and Table views), project management, and activity tracking. Uses PostgreSQL via Prisma for persistence and NextAuth v5 for authentication.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm test` - Run all tests (Jest)
- `npm test -- --testPathPattern=<file>` - Run a single test file (e.g. `-- --testPathPattern=roadmapStore`)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report (thresholds: 70% branches, 80% functions/lines/statements)
- `docker compose -f docker-compose.dev.yml up` - Dev environment with PostgreSQL only
- `docker compose up -d` - Full production stack
- `npx prisma generate` - Regenerate Prisma client after schema changes
- `npx prisma migrate dev` - Run database migrations

## Architecture

### Tech Stack
- **Framework:** Next.js 14.2.35, React 18, TypeScript 5
- **UI:** Tailwind CSS 4.2 + shadcn/ui (Base Nova style) + Lucide icons
- **State:** Zustand 5 with Immer middleware
- **Drag & Drop:** @dnd-kit
- **Database:** Prisma 7.5 + PostgreSQL 16 (via @prisma/adapter-pg)
- **Auth:** NextAuth v5 beta with Credentials provider + JWT sessions
- **Validation:** Zod 4
- **Dates:** date-fns 4
- **Rich Text:** Tiptap 3 (starter-kit + extensions: color, font-family, highlight, text-align, underline)
- **Export:** html2canvas + jsPDF + pdfjs-dist (lazy-loaded)
- **Theming:** next-themes (dark mode support)
- **IDs:** nanoid (client-side ID generation)
- **Notifications:** Sonner (toast notifications)
- **Testing:** Jest 30 + ts-jest + React Testing Library (jsdom environment)

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json).

### Source Structure (src/)

- `app/` - Next.js App Router pages and API routes
  - `login/`, `register/` - Auth pages
  - `projects/` - Project listing; `projects/[projectId]` - Project page with tabs (Planejamento, Por Quarter, Storyboard, Tabela)
  - `settings/` - Backup/import settings
  - `admin/users/` - User administration
  - `api/auth/` - NextAuth handlers + registration endpoint
  - `api/projects/` - Projects CRUD, activities CRUD, dependencies CRUD, members, feature groups
- `components/planning/` - Planning view (quarter columns, drag between quarters) + create/edit activity dialogs
- `components/quarter/` - "Por Quarter" view (cards grouped by `activity.quarter`)
- `components/storyboard/`, `components/table/` - Storyboard and table views
- `components/roadmap/MembersDialog.tsx` - Project member management (invite, role change, remove)
- `components/ui/` - shadcn/ui primitives
- `components/Providers.tsx` - SessionProvider + TooltipProvider + Toaster
- `store/roadmapStore.ts` - Zustand store: project, activities list, tag filter
- `hooks/useActivityFilters.ts` - Shared status/area/team/size filters
- `lib/quarter.ts` - `quarterToStartDate` (quarter key → first day of quarter)
- `lib/auth.ts` - Full NextAuth config (Node.js only; uses Prisma adapter)
- `lib/auth.config.ts` - Edge-compatible auth config (for middleware; no Prisma import)
- `lib/prisma.ts` - Prisma client singleton with PG adapter
- `lib/api-client.ts` - Frontend typed API client (`api.projects.*`, `api.activities.*`, `api.dependencies.*`)
- `lib/api-utils.ts` - Server-side helpers: `getAuthUser()`, `unauthorized()`, `badRequest()`, etc.
- `lib/validation.ts` - Zod schemas for create/update operations
- `lib/constants.ts` - Shared constants (colors, durations)
- `types/index.ts` - Core interfaces: `Activity`, `Project`, `ProjectMember`, `ActivityDependency`
- `middleware.ts` - Route protection via NextAuth (uses `auth.config.ts`, not `auth.ts`)

### Key Concepts

**Activity Planning Model**
Activities are organized by `quarter` (`Q1`–`Q4`, or `wishlist`; null is treated as wishlist). Moving a card to a quarter in the Planning view sets `quarter` and `startDate` (first day of the quarter via `quarterToStartDate`). `startDate`/`rowIndex` columns still exist in the schema (legacy from the removed Gantt view). Activities also carry planning metadata: `area`, `planStatus` (default "Backlog"), `team`, `sizeLabel`, `origin`, `clients[]`, `jiraRef`, `planningNote`.

**Dual Auth Config**
NextAuth requires splitting config: `auth.config.ts` (Edge-safe, used in `middleware.ts`) and `auth.ts` (Node.js full config with Prisma adapter + bcrypt). Never import `auth.ts` from middleware.

**Data Flow**
1. NextAuth JWT session → middleware protects `/projects/*` and `/api/projects/*`
2. The project page loads data via `api.projects.get` and maps it to `Project`/`Activity`
3. The project page initializes the Zustand store; subsequent mutations go through `api-client.ts` → API routes → Prisma
4. Optimistic updates: store updated immediately, API call in background; toast on error

**Feature Groups**
`FeatureGroup` is a visual grouping of activities on a canvas (position/size stored as `x`, `y`, `width`, `height`). Linked to activities via `FeatureGroupActivity` join table. Groups can have a `backgroundImage`, `elements` (JSON), and can be `locked`. Managed via dedicated API routes and feature-group components.

### API Routes
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET/POST /api/projects` - List/create projects
- `GET/PATCH/DELETE /api/projects/[id]` - Project CRUD
- `GET/POST /api/projects/[id]/activities` - List/create activities
- `PATCH/DELETE /api/projects/[id]/activities/[activityId]` - Activity CRUD
- `GET/POST/DELETE /api/projects/[id]/dependencies` - Dependency management
- `GET/POST/PATCH/DELETE /api/projects/[id]/members` - Member management
- `GET/POST /api/projects/[id]/feature-groups` - Feature group CRUD
- `GET/PATCH/DELETE /api/projects/[id]/feature-groups/[groupId]` - Single feature group
- `POST /api/projects/[id]/feature-groups/[groupId]/activities` - Link activities to group

### Database Schema
Models: `User`, `Account`, `Session`, `VerificationToken` (NextAuth standard), `Project`, `ProjectMember` (roles: OWNER/EDITOR/VIEWER), `Activity`, `ActivityTag`, `ActivityDependency`, `FeatureGroup`, `FeatureGroupActivity`. All PKs are CUIDs. `ActivityDependency` has unique constraint on `[fromId, toId]`; `ProjectMember` on `[projectId, userId]`; `FeatureGroupActivity` on `[featureGroupId, activityId]`.

## Docker
Multi-stage Dockerfile with standalone Next.js output. `docker-compose.yml` runs PostgreSQL + app with health checks. `docker-compose.dev.yml` for local development (PostgreSQL only).

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - App URL for NextAuth callbacks
