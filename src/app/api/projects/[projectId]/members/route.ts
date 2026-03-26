import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-utils'
import { z } from 'zod'

type Params = { params: Promise<{ projectId: string }> }

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
})

// GET /api/projects/:id/members
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!project) return notFound('Project not found')

  const isMember = project.ownerId === user.id ||
    project.members.some((m) => m.userId === user.id)
  if (!isMember) return forbidden()

  return NextResponse.json(project.members)
}

// POST /api/projects/:id/members - Add member by email
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return notFound('Project not found')
  if (project.ownerId !== user.id) return forbidden()

  try {
    const body = await request.json()
    const parsed = addMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 })
    }

    if (targetUser.id === project.ownerId) {
      return badRequest('This user is already the project owner')
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 })
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: parsed.data.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/:id/members - Remove member
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return notFound('Project not found')
  if (project.ownerId !== user.id) return forbidden()

  try {
    const { memberId } = await request.json()
    if (!memberId) return badRequest('Member ID is required')

    await prisma.projectMember.delete({ where: { id: memberId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}

// PATCH /api/projects/:id/members - Update member role
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return notFound('Project not found')
  if (project.ownerId !== user.id) return forbidden()

  try {
    const { memberId, role } = await request.json()
    if (!memberId || !['EDITOR', 'VIEWER'].includes(role)) {
      return badRequest('Valid member ID and role (EDITOR or VIEWER) are required')
    }

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}
