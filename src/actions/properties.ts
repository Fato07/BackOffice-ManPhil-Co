import { prisma } from "@/lib/db"

export async function getPropertyById(id: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        destination: true,
        photos: {
          orderBy: { position: 'asc' }
        },
        rooms: {
          orderBy: { createdAt: 'asc' }
        },
        marketingContent: true,
        resources: true
      }
    })

    if (!property) {
      return null
    }

    return property
  } catch (error) {
    console.error("Error fetching property:", error)
    return null
  }
}

export async function getProperties() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        destination: true,
        photos: {
          orderBy: { position: 'asc' },
          take: 1
        },
        rooms: true,
        _count: {
          select: {
            rooms: true,
            photos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return properties
  } catch (error) {
    console.error("Error fetching properties:", error)
    return []
  }
}