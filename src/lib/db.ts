import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma Client with better error handling and connection pooling
export const prisma = 
  globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    errorFormat: 'pretty',
  })

// Ensure we're not creating multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Improved cleanup for hot reload in development
if (process.env.NODE_ENV === 'development') {
  const cleanup = async () => {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect()
        .catch((e) => console.error('Failed to disconnect Prisma:', e))
    }
  }
  
  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
} else {
  // Production cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma