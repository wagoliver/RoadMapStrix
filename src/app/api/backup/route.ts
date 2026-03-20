import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest } from '@/lib/api-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackupTag        { name: string; color: string }
interface BackupActivity   {
  _ref: string
  name: string; description: string | null; color: string
  durationSprints: number; startDate: string | null; rowIndex: number | null
  isDelivered: boolean; deliveryDate: string | null; deliveryLabel: string | null
  quarter: string | null; area: string | null; planStatus: string
  team: string | null; sizeLabel: string | null; origin: string | null
  clients: string[]; jiraRef: string | null; planningNote: string | null
  tags: BackupTag[]
}
interface BackupDependency { fromRef: string; toRef: string }
interface BackupFeatureGroup {
  title: string; description: string | null; color: string
  x: number; y: number; width: number; height: number
  backgroundImage: string | null; elements: unknown; locked: boolean
  activityRefs: string[]
}
interface BackupProject {
  name: string; description: string | null; color: string
  sprintDuration: number; startDate: string
  activities: BackupActivity[]
  dependencies: BackupDependency[]
  featureGroups: BackupFeatureGroup[]
}
export interface BackupFile {
  version: string
  exportedAt: string
  projects: BackupProject[]
}

// ─── GET /api/backup — Export ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const singleProjectId = searchParams.get('projectId')

  const whereClause = singleProjectId
    ? {
        id: singleProjectId,
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      }
    : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      activities: {
        include: {
          tags: true,
          dependsOn: true,   // ActivityDependency where fromId = this activity
        },
        orderBy: { createdAt: 'asc' },
      },
      featureGroups: {
        include: {
          activities: { select: { activityId: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const backup: BackupFile = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => {
      // Build activity set for dependency filtering
      const activityIds = new Set(p.activities.map((a) => a.id))

      const activities: BackupActivity[] = p.activities.map((a) => ({
        _ref: a.id,
        name: a.name,
        description: a.description,
        color: a.color,
        durationSprints: a.durationSprints,
        startDate: a.startDate?.toISOString() ?? null,
        rowIndex: a.rowIndex,
        isDelivered: a.isDelivered,
        deliveryDate: a.deliveryDate?.toISOString() ?? null,
        deliveryLabel: a.deliveryLabel,
        quarter: a.quarter,
        area: a.area,
        planStatus: a.planStatus,
        team: a.team,
        sizeLabel: a.sizeLabel,
        origin: a.origin,
        clients: a.clients,
        jiraRef: a.jiraRef,
        planningNote: a.planningNote,
        tags: a.tags.map((t) => ({ name: t.name, color: t.color })),
      }))

      // Only include dependencies where both sides belong to this project
      const dependencies: BackupDependency[] = p.activities.flatMap((a) =>
        a.dependsOn
          .filter((d) => activityIds.has(d.toId))
          .map((d) => ({ fromRef: d.fromId, toRef: d.toId }))
      )

      const featureGroups: BackupFeatureGroup[] = p.featureGroups.map((g) => ({
        title: g.title,
        description: g.description,
        color: g.color,
        x: g.x,
        y: g.y,
        width: g.width,
        height: g.height,
        backgroundImage: g.backgroundImage,
        elements: g.elements,
        locked: g.locked,
        activityRefs: g.activities.map((ga) => ga.activityId),
      }))

      return {
        name: p.name,
        description: p.description,
        color: p.color,
        sprintDuration: p.sprintDuration,
        startDate: p.startDate.toISOString(),
        activities,
        dependencies,
        featureGroups,
      }
    }),
  }

  return NextResponse.json(backup)
}

// ─── POST /api/backup — Import ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  let body: BackupFile
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  if (body.version !== '1.0' || !Array.isArray(body.projects)) {
    return badRequest('Invalid backup file format')
  }

  const results: { name: string; activities: number; groups: number }[] = []

  for (const bp of body.projects) {
    // Create the project
    const project = await prisma.project.create({
      data: {
        name: bp.name + ' (Importado)',
        description: bp.description ?? null,
        color: bp.color ?? '#6366f1',
        sprintDuration: bp.sprintDuration ?? 14,
        startDate: bp.startDate ? new Date(bp.startDate) : new Date(),
        ownerId: user.id,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    })

    // Map old _ref → new activity id
    const refToNewId = new Map<string, string>()

    // Create activities
    for (const ba of bp.activities ?? []) {
      const activity = await prisma.activity.create({
        data: {
          projectId: project.id,
          name: ba.name,
          description: ba.description ?? null,
          color: ba.color ?? '#6366f1',
          durationSprints: ba.durationSprints ?? 1,
          startDate: ba.startDate ? new Date(ba.startDate) : null,
          rowIndex: ba.rowIndex ?? null,
          isDelivered: ba.isDelivered ?? false,
          deliveryDate: ba.deliveryDate ? new Date(ba.deliveryDate) : null,
          deliveryLabel: ba.deliveryLabel ?? null,
          quarter: ba.quarter ?? null,
          area: ba.area ?? null,
          planStatus: ba.planStatus ?? 'Backlog',
          team: ba.team ?? null,
          sizeLabel: ba.sizeLabel ?? null,
          origin: ba.origin ?? null,
          clients: ba.clients ?? [],
          jiraRef: ba.jiraRef ?? null,
          planningNote: ba.planningNote ?? null,
          tags: {
            create: (ba.tags ?? []).map((t: BackupTag) => ({
              name: t.name,
              color: t.color ?? '#94a3b8',
            })),
          },
        },
      })
      refToNewId.set(ba._ref, activity.id)
    }

    // Create dependencies
    for (const dep of bp.dependencies ?? []) {
      const fromId = refToNewId.get(dep.fromRef)
      const toId   = refToNewId.get(dep.toRef)
      if (fromId && toId) {
        await prisma.activityDependency.create({ data: { fromId, toId } }).catch(() => {})
      }
    }

    // Create feature groups and link activities
    for (const bg of bp.featureGroups ?? []) {
      const group = await prisma.featureGroup.create({
        data: {
          projectId: project.id,
          title: bg.title ?? 'Grupo',
          description: bg.description ?? null,
          color: bg.color ?? '#6366f1',
          x: bg.x ?? 40,
          y: bg.y ?? 40,
          width: bg.width ?? 420,
          height: bg.height ?? 320,
          backgroundImage: bg.backgroundImage ?? null,
          elements: bg.elements ?? [],
          locked: bg.locked ?? false,
        },
      })

      for (const ref of bg.activityRefs ?? []) {
        const activityId = refToNewId.get(ref)
        if (activityId) {
          await prisma.featureGroupActivity.create({
            data: { featureGroupId: group.id, activityId },
          }).catch(() => {})
        }
      }
    }

    results.push({
      name: project.name,
      activities: refToNewId.size,
      groups: bp.featureGroups?.length ?? 0,
    })
  }

  return NextResponse.json({ imported: results }, { status: 201 })
}
