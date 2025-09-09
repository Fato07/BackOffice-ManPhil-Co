import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { createPropertySchema, propertySearchSchema } from "@/lib/validations/property"
import { PropertyStatus } from "@/generated/prisma"

// GET /api/properties - Get properties with search and pagination
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    
    // Convert string arrays back to arrays and parse numbers
    const processedParams: any = { ...searchParams }
    
    // Convert comma-separated strings to arrays
    if (searchParams.amenities) {
      processedParams.amenities = searchParams.amenities.split(',')
    }
    if (searchParams.services) {
      processedParams.services = searchParams.services.split(',')
    }
    if (searchParams.accessibility) {
      processedParams.accessibility = searchParams.accessibility.split(',')
    }
    
    // Convert string numbers to actual numbers
    const numberFields = ['page', 'pageSize', 'minRooms', 'maxRooms', 
      'minBathrooms', 'maxBathrooms', 'maxGuests', 'minPrice', 'maxPrice']
    numberFields.forEach(field => {
      if (searchParams[field]) {
        processedParams[field] = Number(searchParams[field])
      }
    })
    
    // Convert string booleans to actual booleans
    const booleanFields = ['petsAllowed', 'eventsAllowed', 'smokingAllowed', 
      'showOnWebsite', 'highlight']
    booleanFields.forEach(field => {
      if (searchParams[field]) {
        processedParams[field] = searchParams[field] === 'true'
      }
    })
    
    const params = propertySearchSchema.parse(processedParams)

    // Build where clause
    const where: any = {}
    
    // Text search
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
        { originalName: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (params.status && params.status !== "ALL") {
      where.status = params.status as PropertyStatus
    }
    
    // Destination filter
    if (params.destinationId) {
      where.destinationId = params.destinationId
    }
    
    // Room filters
    if (params.minRooms !== undefined || params.maxRooms !== undefined) {
      where.numberOfRooms = {}
      if (params.minRooms !== undefined) {
        where.numberOfRooms.gte = params.minRooms
      }
      if (params.maxRooms !== undefined) {
        where.numberOfRooms.lte = params.maxRooms
      }
    }
    
    // Bathroom filters
    if (params.minBathrooms !== undefined || params.maxBathrooms !== undefined) {
      where.numberOfBathrooms = {}
      if (params.minBathrooms !== undefined) {
        where.numberOfBathrooms.gte = params.minBathrooms
      }
      if (params.maxBathrooms !== undefined) {
        where.numberOfBathrooms.lte = params.maxBathrooms
      }
    }
    
    // Guest capacity filter
    if (params.maxGuests !== undefined) {
      where.maxGuests = { gte: params.maxGuests }
    }
    
    // Property type filter (assuming this maps to categories array)
    if (params.propertyType) {
      where.categories = { has: params.propertyType }
    }
    
    // Amenities filters - mapping to actual database fields
    if (params.amenities && params.amenities.length > 0) {
      const amenityConditions: any[] = []
      
      params.amenities.forEach(amenity => {
        switch (amenity) {
          case 'hasPool':
            // Assuming pool info is stored in heatingAC JSON field
            amenityConditions.push({ 
              heatingAC: { path: ['pool'], not: null } 
            })
            break
          case 'hasBeachAccess':
            amenityConditions.push({ 
              OR: [
                { beachAccess: true },
                { privateBeachAccess: true }
              ]
            })
            break
          case 'hasHotTub':
            // Assuming hot tub info is stored in heatingAC JSON field
            amenityConditions.push({ 
              heatingAC: { path: ['hotTub'], not: null } 
            })
            break
          case 'hasGym':
            // Assuming gym info is stored in a JSON field
            amenityConditions.push({ 
              services: { path: ['gym'], equals: true } 
            })
            break
          case 'hasParking':
            // Assuming parking info is stored in services JSON field
            amenityConditions.push({ 
              services: { path: ['parking'], equals: true } 
            })
            break
          case 'hasGarden':
            // Assuming garden info is stored in a JSON field
            amenityConditions.push({ 
              services: { path: ['garden'], equals: true } 
            })
            break
        }
      })
      
      if (amenityConditions.length > 0) {
        where.AND = where.AND || []
        where.AND.push(...amenityConditions)
      }
    }
    
    // Services filters - check in services JSON field
    if (params.services && params.services.length > 0) {
      const serviceConditions: any[] = []
      
      params.services.forEach(service => {
        switch (service) {
          case 'hasChef':
            serviceConditions.push({ 
              services: { path: ['meals', 'chef'], equals: true } 
            })
            break
          case 'hasHousekeeper':
            serviceConditions.push({ 
              services: { path: ['meals', 'housekeeping'], equals: true } 
            })
            break
          case 'hasDriver':
            serviceConditions.push({ 
              services: { path: ['transport', 'driver'], equals: true } 
            })
            break
          case 'hasConcierge':
            serviceConditions.push({ 
              conciergeServiceOffer: { not: 'NOT_OFFERED' } 
            })
            break
          case 'hasTransport':
            serviceConditions.push({ 
              services: { path: ['transport', 'included'], equals: true } 
            })
            break
        }
      })
      
      if (serviceConditions.length > 0) {
        where.AND = where.AND || []
        where.AND.push(...serviceConditions)
      }
    }
    
    // Accessibility filters - check in accessibility JSON field
    if (params.accessibility && params.accessibility.length > 0) {
      const accessibilityConditions: any[] = []
      
      params.accessibility.forEach(access => {
        accessibilityConditions.push({ 
          accessibility: { path: [access], equals: true } 
        })
      })
      
      if (accessibilityConditions.length > 0) {
        where.AND = where.AND || []
        where.AND.push(...accessibilityConditions)
      }
    }
    
    // Policy filters
    if (params.petsAllowed !== undefined) {
      where.policies = where.policies || {}
      where.policies.path = ['petsAllowed']
      where.policies.equals = params.petsAllowed
    }
    
    if (params.eventsAllowed !== undefined) {
      where.eventsAllowed = params.eventsAllowed
    }
    
    if (params.smokingAllowed !== undefined) {
      if (!where.policies) {
        where.policies = { path: ['smokingAllowed'], equals: params.smokingAllowed }
      } else {
        // If policies already has a condition, we need to use AND
        where.AND = where.AND || []
        where.AND.push({
          policies: { path: ['smokingAllowed'], equals: params.smokingAllowed }
        })
      }
    }
    
    // Price range filters - will need to check PriceRange relation
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.prices = {
        some: {}
      }
      
      if (params.minPrice !== undefined) {
        where.prices.some.nightlyRate = { gte: params.minPrice }
      }
      
      if (params.maxPrice !== undefined) {
        where.prices.some.nightlyRate = where.prices.some.nightlyRate || {}
        where.prices.some.nightlyRate.lte = params.maxPrice
      }
    }
    
    // Promotion filters
    if (params.showOnWebsite !== undefined) {
      where.onlineReservation = params.showOnWebsite
    }
    
    if (params.highlight !== undefined) {
      if (params.highlight) {
        where.OR = [
          { iconicCollection: true },
          { exclusivity: true }
        ]
      } else {
        where.AND = where.AND || []
        where.AND.push(
          { iconicCollection: false },
          { exclusivity: false }
        )
      }
    }

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              country: true,
            }
          },
          prices: {
            select: {
              id: true,
              name: true,
              nightlyRate: true,
              weeklyRate: true,
              monthlyRate: true,
              startDate: true,
              endDate: true,
            },
            orderBy: {
              nightlyRate: 'asc'
            }
          }
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: params.sortBy
          ? { [params.sortBy]: params.sortDirection || 'asc' }
          : { createdAt: 'desc' },
      }),
      prisma.property.count({ where }),
    ])

    return NextResponse.json({
      data: properties,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    )
  }
}

// POST /api/properties - Create a new property
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createPropertySchema.parse(body)

    // Create property in database
    const property = await prisma.property.create({
      data: {
        ...validatedData,
        status: PropertyStatus.ONBOARDING, // Default status
      },
      include: {
        destination: true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "create",
        entityType: "property",
        entityId: property.id,
        changes: validatedData,
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error("Error creating property:", error)
    
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    )
  }
}