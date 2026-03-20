import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-utils'

type Params = { params: Promise<{ projectId: string; groupId: string }> }

async function verifyAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } })
  if (!project) return { error: 'not_found' as const }
  const isMember = project.ownerId === userId || project.members.some((m) => m.userId === userId)
  if (!isMember) return { error: 'forbidden' as const }
  return { project }
}

// PATCH /api/projects/:id/feature-groups/:groupId
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { projectId, groupId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (body.title       !== undefined) data.title       = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.color       !== undefined) data.color       = body.color
  if (body.x           !== undefined) data.x           = body.x
  if (body.y           !== undefined) data.y           = body.y
  if (body.width       !== undefined) data.width       = body.width
  if (body.height           !== undefined) data.height           = body.height
  if (body.backgroundImage  !== undefined) data.backgroundImage  = body.backgroundImage
  if (body.elements         !== undefined) data.elements         = body.elements
  if (body.locked           !== undefined) data.locked           = body.locked

  const group = await prisma.featureGroup.update({
    where: { id: groupId },
    data,
    include: { activities: { include: { activity: { select: { id: true, name: true, jiraRef: true, quarter: true, planStatus: true, area: true, sizeLabel: true, durationSprints: true, color: true } } } } },
  })
  return NextResponse.json(group)
}

// DELETE /api/projects/:id/feature-groups/:groupId
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { projectId, groupId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  await prisma.featureGroup.delete({ where: { id: groupId } })
  return NextResponse.json({ ok: true })
}
