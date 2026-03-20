import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-utils'

type Params = { params: Promise<{ projectId: string; groupId: string }> }

async function verifyAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } })
  if (!project) return { error: 'not_found' as const }
  const isMember = project.ownerId === userId || project.members.some((m) => m.userId === userId)
  if (!isMember) return { error: 'forbidden' as const }
  return { project }
}

// POST /api/projects/:id/feature-groups/:groupId/activities  { activityId }
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { projectId, groupId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const { activityId } = await req.json().catch(() => ({}))
  if (!activityId) return badRequest('activityId required')

  const link = await prisma.featureGroupActivity.upsert({
    where: { featureGroupId_activityId: { featureGroupId: groupId, activityId } },
    create: { id: crypto.randomUUID(), featureGroupId: groupId, activityId },
    update: {},
  })
  return NextResponse.json(link, { status: 201 })
}

// DELETE /api/projects/:id/feature-groups/:groupId/activities  { activityId }
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { projectId, groupId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const { activityId } = await req.json().catch(() => ({}))
  if (!activityId) return badRequest('activityId required')

  await prisma.featureGroupActivity.deleteMany({
    where: { featureGroupId: groupId, activityId },
  })
  return NextResponse.json({ ok: true })
}
