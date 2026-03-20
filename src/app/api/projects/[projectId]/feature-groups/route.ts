import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-utils'

type Params = { params: Promise<{ projectId: string }> }

async function verifyAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return { error: 'not_found' as const }
  const isMember = project.ownerId === userId || project.members.some((m) => m.userId === userId)
  if (!isMember) return { error: 'forbidden' as const }
  return { project }
}

// GET /api/projects/:id/feature-groups
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { projectId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const groups = await prisma.featureGroup.findMany({
    where: { projectId },
    include: {
      activities: {
        include: {
          activity: { select: { id: true, name: true, jiraRef: true, quarter: true, planStatus: true, area: true, sizeLabel: true, durationSprints: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(groups)
}

// POST /api/projects/:id/feature-groups
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { projectId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const body = await req.json().catch(() => ({}))
  const group = await prisma.featureGroup.create({
    data: {
      projectId,
      title: body.title ?? 'Novo Grupo',
      description: body.description ?? null,
      color: body.color ?? '#6366f1',
      x: body.x ?? 40,
      y: body.y ?? 40,
      width: body.width ?? 420,
      height: body.height ?? 320,
    },
    include: { activities: { include: { activity: { select: { id: true, name: true, jiraRef: true, quarter: true, planStatus: true, area: true, sizeLabel: true, durationSprints: true, color: true } } } } },
  })
  return NextResponse.json(group, { status: 201 })
}
