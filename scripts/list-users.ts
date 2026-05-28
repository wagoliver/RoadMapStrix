import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://roadmap:roadmap@localhost:5432/roadmapstrix'
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    console.log(`Found ${users.length} user(s):`)
    for (const u of users) {
      console.log(`- ${u.email}  (name=${u.name ?? '—'}, id=${u.id}, created=${u.createdAt.toISOString()})`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
