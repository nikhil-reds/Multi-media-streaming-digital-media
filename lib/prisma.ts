import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: InstanceType<typeof PrismaClient> }

if (globalForPrisma.prisma && !('playlist' in globalForPrisma.prisma)) {
  // If the cached global client is outdated and lacks the playlist model, delete it to force recreation
  delete (globalForPrisma as any).prisma
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
