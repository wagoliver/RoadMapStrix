# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RoadMapStrix is a product roadmap planning tool built with Next.js 14 (App Router). It features a custom Gantt chart with drag-and-drop scheduling, project management, and activity tracking. Currently operates in demo mode with localStorage persistence, with a Prisma/PostgreSQL backend schema defined but not yet integrated.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint
- `npm test` - Run all tests (Jest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `docker compose -f docker-compose.dev.yml up` - Dev environment with PostgreSQL
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations

## Architecture

### Tech Stack
- **Framework:** Next.js 14.2.35, React 18, TypeScript 5
- **UI:** Tailwind CSS 4.2 + shadcn/ui (Base Nova style) + Lucide icons
- **State:** Zustand 5 with Immer middleware (localStorage persistence)
- **Drag & Drop:** @dnd-kit
- **Database:** Prisma 7.5 + PostgreSQL (schema-only, not wired to frontend yet)
- **Auth:** NextAuth v5 beta (configured in schema, not active in app)
- **Validation:** Zod 4
- **Dates:** date-fns 4
- **Export:** html2canvas + jsPDF
- **Testing:** Jest 30 + ts-jest + React Testing Library

### Source Structure (src/)

- `app/` - Next.js App Router. Root page redirects to `/projects`. Dynamic route `projects/[projectId]` renders the roadmap view.
- `components/roadmap/` - Core feature components: `RoadmapView.tsx` (main view with DnD context), `RoadmapToolbar.tsx`, `GanttChart/` (7 components for timeline rendering), `ActivitySidebar/` (unscheduled activities panel).
- `components/ui/` - shadcn/ui primitives (button, dialog, card, calendar, etc.)
- `store/roadmapStore.ts` - Single Zustand store managing activities, projects, filters, and drag preview state. Uses Immer for immutable updates and persists to localStorage.
- `hooks/` - `useDragActivity` (DnD logic), `useGanttScroll` (scroll sync), `useTimeView` (month/quarter/year modes)
- `lib/gantt/` - Gantt calculation engine: `columnConfig.ts` (time view configs), `positionUtils.ts` (date-to-pixel math), `timeEngine.ts` (calendar date generation)
- `lib/constants.ts` - Shared constants (colors, durations, storage keys)
- `lib/generateId.ts` - ID generation using nanoid
- `lib/validation.ts` - Zod schemas for input validation
- `types/index.ts` - Core interfaces: Activity, Project, ProjectMember, ActivityTag, ActivityDependency
- `test/` - Test setup and mocks (nanoid mock for ESM compatibility)

### Data Flow
Most components are client-side (`'use client'`). The Zustand store (`roadmapStore.ts`) is the single source of truth. Activities are dragged from the sidebar onto the Gantt chart, which calculates dates from pixel positions via `lib/gantt/positionUtils.ts`. The store persists state to localStorage.

### Database Schema (prisma/schema.prisma)
Models: User, Account, Session, VerificationToken (auth), Project, ProjectMember (roles: OWNER/EDITOR/VIEWER), Activity, ActivityTag, ActivityDependency. Uses CUID primary keys.

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json).

## Docker
Multi-stage Dockerfile with standalone Next.js output. `docker-compose.yml` runs PostgreSQL + app with health checks. `docker-compose.dev.yml` for local development.
