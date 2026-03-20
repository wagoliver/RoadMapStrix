import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-utils'

type Params = { params: Promise<{ projectId: string }> }

// GET /api/projects/:id - Get project with activities
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      activities: {
        include: {
          tags: true,
          dependsOn: true,
          blockedBy: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  })

  if (!project) return notFound('Project not found')

  const isMember = project.ownerId === user.id ||
    project.members.some((m) => m.userId === user.id)
  if (!isMember) return forbidden()

  return NextResponse.json(project)
}

// PATCH /api/projects/:id - Update project
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return notFound('Project not found')
  if (project.ownerId !== user.id) return forbidden()

  try {
    const body = await request.json()
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        sprintDuration: body.sprintDuration,
      },
      include: {
        activities: { include: { tags: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return notFound('Project not found')
  if (project.ownerId !== user.id) return forbidden()

  await prisma.project.delete({ where: { id: projectId } })

  return NextResponse.json({ success: true })
}
