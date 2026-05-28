import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/reset-password.ts <email> <password>')
    process.exit(1)
  }

  const connectionString = process.env.DATABASE_URL ?? 'postgresql://roadmap:roadmap@localhost:5432/roadmapstrix'
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (!existing) {
      console.error(`User not found: ${email}`)
      process.exit(2)
    }

    const hashed = await hash(password, 12)
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashed },
      select: { id: true, email: true, name: true, updatedAt: true },
    })

    console.log('Password updated successfully:')
    console.log(updated)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
