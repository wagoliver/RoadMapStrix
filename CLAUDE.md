# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RoadMapStrix is a product roadmap planning tool built with Next.js 14 (App Router). It features a custom Gantt chart with drag-and-drop scheduling, project management, and activity tracking. Uses PostgreSQL via Prisma for persistence and NextAuth v5 for authentication.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint
- `npm test` - Run all tests (Jest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `docker compose -f docker-compose.dev.yml up` - Dev environment with PostgreSQL
- `docker compose up -d` - Full production stack
- `npx prisma generate` - Generate Prisma client
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
- **Export:** html2canvas + jsPDF
- **Notifications:** Sonner (toast notifications)
- **Testing:** Jest 30 + ts-jest + React Testing Library

### Source Structure (src/)

- `app/` - Next.js App Router pages and API routes
  - `login/`, `register/` - Auth pages
  - `projects/` - Project listing, `projects/[projectId]` - Roadmap view
  - `api/auth/` - NextAuth handlers + registration endpoint
  - `api/projects/` - Projects CRUD, activities CRUD, dependencies CRUD
- `components/roadmap/` - Core feature components: `RoadmapView.tsx`, `RoadmapToolbar.tsx`, `GanttChart/` (8 components), `ActivitySidebar/` (4 components)
- `components/ui/` - shadcn/ui primitives
- `components/Providers.tsx` - SessionProvider + TooltipProvider + Toaster
- `store/roadmapStore.ts` - Zustand store for activities, views, filters, drag state
- `hooks/` - `useDragActivity`, `useGanttScroll`, `useTimeView`
- `lib/gantt/` - Gantt calculation engine (columns, positions, time)
- `lib/auth.ts` - NextAuth config with Credentials provider + Prisma adapter
- `lib/auth.config.ts` - Edge-compatible auth config for middleware
- `lib/prisma.ts` - Prisma client singleton with PG adapter
- `lib/api-client.ts` - Frontend API client for all CRUD operations
- `lib/api-utils.ts` - Server-side auth helpers + error responses
- `lib/validation.ts` - Zod schemas
- `lib/constants.ts` - Shared constants
- `types/index.ts` - Core interfaces
- `types/next-auth.d.ts` - NextAuth session type augmentation
- `middleware.ts` - Route protection via NextAuth

### Data Flow
1. User authenticates via NextAuth (Credentials provider + JWT)
2. Middleware protects `/projects/*` and `/api/projects/*` routes
3. Frontend pages fetch data via `api-client.ts` which calls Next.js API routes
4. API routes use Prisma to interact with PostgreSQL
5. Zustand store manages client-side state for the Gantt chart view
6. All CRUD operations (activities, dependencies) persist to the database via API calls

### Database Schema (prisma/schema.prisma)
Models: User, Account, Session, VerificationToken (auth), Project, ProjectMember (roles: OWNER/EDITOR/VIEWER), Activity, ActivityTag, ActivityDependency. Uses CUID primary keys.

### API Routes
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers (login, session, etc.)
- `GET/POST /api/projects` - List/create projects
- `GET/PATCH/DELETE /api/projects/[id]` - Project CRUD
- `GET/POST /api/projects/[id]/activities` - List/create activities
- `PATCH/DELETE /api/projects/[id]/activities/[activityId]` - Activity CRUD
- `GET/POST/DELETE /api/projects/[id]/dependencies` - Dependency management

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json).

## Docker
Multi-stage Dockerfile with standalone Next.js output. `docker-compose.yml` runs PostgreSQL + app with health checks. `docker-compose.dev.yml` for local development (PostgreSQL only).

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - App URL for NextAuth callbacks
