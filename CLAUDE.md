# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RoadMapStrix is a product roadmap planning tool built with Next.js 14 (App Router). It features a custom Gantt chart with drag-and-drop scheduling, project management, and activity tracking. Uses PostgreSQL via Prisma for persistence and NextAuth v5 for authentication.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm test` - Run all tests (Jest)
- `npm test -- --testPathPattern=<file>` - Run a single test file (e.g. `-- --testPathPattern=timeEngine`)
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
  - `projects/` - Project listing; `projects/[projectId]` - Roadmap view
  - `settings/` - Backup/import settings
  - `admin/users/` - User administration
  - `api/auth/` - NextAuth handlers + registration endpoint
  - `api/projects/` - Projects CRUD, activities CRUD, dependencies CRUD, members, feature groups
- `components/roadmap/` - Core feature components
  - `RoadmapView.tsx` - Top-level client component; owns DndContext and all CRUD handlers
  - `RoadmapToolbar.tsx` - Time view switcher, today scroll, PDF export
  - `GanttChart/` - 8 components: chart grid, header, rows, activity blocks, dependency arrows, delivery/today markers
  - `ActivitySidebar/` - Unscheduled activity list + create/edit/mark-delivered dialogs
  - `MembersDialog.tsx` - Project member management (invite, role change, remove)
- `components/ui/` - shadcn/ui primitives
- `components/Providers.tsx` - SessionProvider + TooltipProvider + Toaster
- `store/roadmapStore.ts` - Zustand store: activities list, timeView, tag filter, drag preview
- `hooks/` - `useDragActivity`, `useGanttScroll`, `useTimeView`
- `lib/gantt/` - Pure Gantt calculation engine (no React)
  - `columnConfig.ts` - `TimeView` type + `COLUMN_CONFIG` pixel widths per view
  - `timeEngine.ts` - Generates time header columns; chart spans from 365 days ago to +3 years
  - `positionUtils.ts` - `dateToPixel`, `pixelToDate`, `activityWidthPx`, `snapDateToView`
- `lib/auth.ts` - Full NextAuth config (Node.js only; uses Prisma adapter)
- `lib/auth.config.ts` - Edge-compatible auth config (for middleware; no Prisma import)
- `lib/prisma.ts` - Prisma client singleton with PG adapter
- `lib/api-client.ts` - Frontend typed API client (`api.projects.*`, `api.activities.*`, `api.dependencies.*`)
- `lib/api-utils.ts` - Server-side helpers: `getAuthUser()`, `unauthorized()`, `badRequest()`, etc.
- `lib/validation.ts` - Zod schemas for create/update operations
- `lib/constants.ts` - Shared constants (colors, durations, chart span)
- `types/index.ts` - Core interfaces: `Activity`, `Project`, `ProjectMember`, `ActivityDependency`
- `middleware.ts` - Route protection via NextAuth (uses `auth.config.ts`, not `auth.ts`)

### Key Concepts

**Activity Scheduling Model**
Activities are either *unscheduled* (no `startDate`/`rowIndex` — shown in the sidebar) or *scheduled* (have both — shown as blocks in the Gantt grid). Drag-and-drop moves activities between these states. `DragData.source` distinguishes sidebar drags (absolute pointer position calculation) from chart-to-chart drags (delta-based repositioning). Activities also carry planning metadata: `quarter`, `area`, `planStatus` (default "Backlog"), `team`, `sizeLabel`, `origin`, `clients[]`, `jiraRef`, `planningNote`.

**Gantt Engine**
The chart always spans from `today - 365 days` to `today + (3*365) days` (`GANTT_CHART_SPAN_DAYS = 1095`). Pixel positions are derived from `differenceInCalendarDays * (columnWidthPx / unitDays)`. Activity width = `durationSprints * sprintDays * dayWidthPx(view)`. On drop, dates snap to period boundaries via `snapDateToView` (e.g. week → Monday, month → 1st, semester → Jan 1 or Jul 1).

**Dual Auth Config**
NextAuth requires splitting config: `auth.config.ts` (Edge-safe, used in `middleware.ts`) and `auth.ts` (Node.js full config with Prisma adapter + bcrypt). Never import `auth.ts` from middleware.

**Data Flow**
1. NextAuth JWT session → middleware protects `/projects/*` and `/api/projects/*`
2. Server pages fetch initial data directly via Prisma; pass to `RoadmapView` as props
3. `RoadmapView` initializes Zustand store; subsequent mutations go through `api-client.ts` → API routes → Prisma
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
