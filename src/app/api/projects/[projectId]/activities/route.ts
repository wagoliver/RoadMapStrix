import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-utils'
import { createActivitySchema } from '@/lib/validation'

type Params = { params: Promise<{ projectId: string }> }

async function verifyProjectAccess(projectId: string, userId: string, requireEditor = false) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return { error: 'not_found' as const }

  const member = project.members.find((m) => m.userId === userId)
  const isOwner = project.ownerId === userId

  if (!isOwner && !member) return { error: 'forbidden' as const }
  if (requireEditor && !isOwner && member?.role === 'VIEWER') {
    return { error: 'forbidden' as const }
  }

  return { project }
}

// GET /api/projects/:id/activities
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params
  const access = await verifyProjectAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const activities = await prisma.activity.findMany({
    where: { projectId },
    include: { tags: true, dependsOn: true, blockedBy: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(activities)
}

// POST /api/projects/:id/activities
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params
  const access = await verifyProjectAccess(projectId, user.id, true)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  try {
    const body = await request.json()
    const parsed = createActivitySchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const activity = await prisma.activity.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        durationSprints: parsed.data.durationSprints,
        projectId,
        quarter: parsed.data.quarter,
        area: parsed.data.area,
        planStatus: parsed.data.planStatus ?? 'Backlog',
        team: parsed.data.team,
        sizeLabel: parsed.data.sizeLabel,
        origin: parsed.data.origin,
        clients: parsed.data.clients ?? [],
        jiraRef: parsed.data.jiraRef,
        planningNote: parsed.data.planningNote,
        tags: {
          create: parsed.data.tags.map((t) => ({ name: t.name, color: t.color })),
        },
      },
      include: { tags: true, dependsOn: true, blockedBy: true },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
