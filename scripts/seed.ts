import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create destinations
  const destinations = await Promise.all([
    prisma.destination.create({
      data: {
        name: 'Chamonix',
        country: 'France',
        region: 'French Alps',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Porto-Vecchio',
        country: 'France',
        region: 'Corsica',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Ibiza',
        country: 'Spain',
        region: 'Balearic Islands',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Sankt Anton',
        country: 'Austria',
        region: 'Tyrol',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'The Landes',
        country: 'France',
        region: 'Nouvelle-Aquitaine',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Sainte-Maxime',
        country: 'France',
        region: 'French Riviera',
      },
    }),
  ])

  console.log(`Created ${destinations.length} destinations`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })