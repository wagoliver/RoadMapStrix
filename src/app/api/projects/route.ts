import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest } from '@/lib/api-utils'
import { createProjectSchema } from '@/lib/validation'

// GET /api/projects - List user's projects
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      _count: { select: { activities: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(projects)
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await request.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
      include: {
        activities: { include: { tags: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
