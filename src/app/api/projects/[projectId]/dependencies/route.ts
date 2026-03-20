import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-utils'
import { z } from 'zod'

type Params = { params: Promise<{ projectId: string }> }

const createDependencySchema = z.object({
  fromId: z.string().min(1),
  toId: z.string().min(1),
})

const deleteDependencySchema = z.object({
  id: z.string().min(1),
})

// GET /api/projects/:id/dependencies
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return notFound('Project not found')

  const isMember = project.ownerId === user.id ||
    project.members.some((m) => m.userId === user.id)
  if (!isMember) return forbidden()

  const dependencies = await prisma.activityDependency.findMany({
    where: {
      from: { projectId },
    },
  })

  return NextResponse.json(dependencies)
}

// POST /api/projects/:id/dependencies
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return notFound('Project not found')

  const isOwner = project.ownerId === user.id
  const member = project.members.find((m) => m.userId === user.id)
  if (!isOwner && (!member || member.role === 'VIEWER')) return forbidden()

  try {
    const body = await request.json()
    const parsed = createDependencySchema.safeParse(body)
    if (!parsed.success) return badRequest('fromId and toId are required')

    if (parsed.data.fromId === parsed.data.toId) {
      return badRequest('An activity cannot depend on itself')
    }

    // Verify both activities belong to this project
    const [from, to] = await Promise.all([
      prisma.activity.findUnique({ where: { id: parsed.data.fromId, projectId } }),
      prisma.activity.findUnique({ where: { id: parsed.data.toId, projectId } }),
    ])

    if (!from || !to) return badRequest('Both activities must belong to this project')

    // Check for existing dependency
    const existing = await prisma.activityDependency.findUnique({
      where: { fromId_toId: { fromId: parsed.data.fromId, toId: parsed.data.toId } },
    })
    if (existing) return badRequest('Dependency already exists')

    const dependency = await prisma.activityDependency.create({
      data: { fromId: parsed.data.fromId, toId: parsed.data.toId },
    })

    return NextResponse.json(dependency, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/:id/dependencies
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return notFound('Project not found')

  const isOwner = project.ownerId === user.id
  const member = project.members.find((m) => m.userId === user.id)
  if (!isOwner && (!member || member.role === 'VIEWER')) return forbidden()

  try {
    const body = await request.json()
    const parsed = deleteDependencySchema.safeParse(body)
    if (!parsed.success) return badRequest('Dependency ID is required')

    await prisma.activityDependency.delete({ where: { id: parsed.data.id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
