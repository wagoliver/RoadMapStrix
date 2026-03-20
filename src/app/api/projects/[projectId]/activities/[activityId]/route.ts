import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-utils'

type Params = { params: Promise<{ projectId: string; activityId: string }> }

async function verifyAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return { error: 'not_found' as const }

  const isOwner = project.ownerId === userId
  const member = project.members.find((m) => m.userId === userId)

  if (!isOwner && !member) return { error: 'forbidden' as const }
  if (!isOwner && member?.role === 'VIEWER') return { error: 'forbidden' as const }

  return { project }
}

// PATCH /api/projects/:projectId/activities/:activityId
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId, activityId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const activity = await prisma.activity.findUnique({
    where: { id: activityId, projectId },
  })
  if (!activity) return notFound('Activity not found')

  try {
    const body = await request.json()

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        durationSprints: body.durationSprints,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        rowIndex: body.rowIndex !== undefined ? body.rowIndex : undefined,
        isDelivered: body.isDelivered,
        deliveryDate: body.deliveryDate !== undefined ? (body.deliveryDate ? new Date(body.deliveryDate) : null) : undefined,
        deliveryLabel: body.deliveryLabel !== undefined ? body.deliveryLabel : undefined,
        quarter: body.quarter !== undefined ? body.quarter : undefined,
        area: body.area !== undefined ? body.area : undefined,
        planStatus: body.planStatus,
        team: body.team !== undefined ? body.team : undefined,
        sizeLabel: body.sizeLabel !== undefined ? body.sizeLabel : undefined,
        origin: body.origin !== undefined ? body.origin : undefined,
        clients: body.clients !== undefined ? body.clients : undefined,
        jiraRef: body.jiraRef !== undefined ? body.jiraRef : undefined,
        planningNote: body.planningNote !== undefined ? body.planningNote : undefined,
      },
      include: { tags: true, dependsOn: true, blockedBy: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/:projectId/activities/:activityId
export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId, activityId } = await params
  const access = await verifyAccess(projectId, user.id)
  if (access.error === 'not_found') return notFound('Project not found')
  if (access.error === 'forbidden') return forbidden()

  const activity = await prisma.activity.findUnique({
    where: { id: activityId, projectId },
  })
  if (!activity) return notFound('Activity not found')

  await prisma.activity.delete({ where: { id: activityId } })

  return NextResponse.json({ success: true })
}
