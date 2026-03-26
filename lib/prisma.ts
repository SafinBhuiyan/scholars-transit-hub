import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

// Force reset the global client if it exists to ensure new schema is picked up
if (process.env.NODE_ENV !== 'production') {
  (globalForPrisma as any).prisma = undefined
}

let prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

// Dynamic check for newly added models during development
if (process.env.NODE_ENV !== 'production') {
  const requiredModels = ["notice", "filesDoc", "filesDocCategory"] as const
  const missingModels = requiredModels.filter((model) => !(prisma as any)[model])

  if (missingModels.length > 0) {
    console.log(
      `Prisma models missing from current instance (${missingModels.join(", ")}). Re-instantiating client...`
    )
    prisma = new PrismaClient({ adapter })
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
