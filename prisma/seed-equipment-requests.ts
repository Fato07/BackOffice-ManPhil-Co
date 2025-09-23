import { PrismaClient, EquipmentRequestStatus, EquipmentRequestPriority } from '../src/generated/prisma'

const prisma = new PrismaClient()

export async function seedEquipmentRequests() {
  console.log('Seeding equipment requests...')
  
  // Check if equipment requests already exist
  const existingRequests = await prisma.equipmentRequest.count()
  if (existingRequests > 0) {
    console.log(`Equipment requests already exist (${existingRequests} found), skipping seed`)
    return
  }

  // Get existing properties
  const properties = await prisma.property.findMany({
    include: {
      rooms: true,
    },
  })

  if (properties.length === 0) {
    console.log('No properties found, skipping equipment requests seed')
    return
  }

  const villaAzure = properties.find(p => p.name === 'Villa Azure')
  const fincaSerena = properties.find(p => p.name === 'Finca Serena')

  const equipmentRequests = []

  // Request 1: Urgent pool maintenance equipment for Villa Azure
  if (villaAzure) {
    const poolDeck = villaAzure.rooms.find(r => r.name === 'Pool Deck')
    
    equipmentRequests.push({
      propertyId: villaAzure.id,
      roomId: poolDeck?.id || null,
      requestedBy: 'John Smith',
      requestedByEmail: 'john.smith@example.com',
      status: EquipmentRequestStatus.PENDING,
      priority: EquipmentRequestPriority.URGENT,
      items: [
        {
          name: 'Pool vacuum cleaner',
          quantity: 1,
          description: 'Professional grade automatic pool cleaner',
          estimatedCost: 450,
          link: 'https://poolsupplies.example.com/vacuum-pro'
        },
        {
          name: 'Pool chemistry test kit',
          quantity: 2,
          description: 'Digital water testing kit with pH and chlorine sensors',
          estimatedCost: 89,
        },
        {
          name: 'Pool skimmer net',
          quantity: 3,
          description: 'Heavy duty leaf skimmer with telescopic pole',
          estimatedCost: 35,
        }
      ],
      reason: 'Current pool equipment is malfunctioning. Guests arriving this weekend.',
      notes: 'Please expedite - we have VIP guests checking in on Saturday',
    })
  }

  // Request 2: Kitchen supplies for Villa Azure - APPROVED
  if (villaAzure) {
    equipmentRequests.push({
      propertyId: villaAzure.id,
      roomId: null,
      requestedBy: 'Maria Garcia',
      requestedByEmail: 'maria.garcia@example.com',
      status: EquipmentRequestStatus.APPROVED,
      priority: EquipmentRequestPriority.HIGH,
      items: [
        {
          name: 'Professional cookware set',
          quantity: 1,
          description: '12-piece stainless steel cookware set',
          estimatedCost: 899,
          link: 'https://kitchensupplies.example.com/pro-cookware'
        },
        {
          name: 'Kitchen knife set',
          quantity: 1,
          description: 'Japanese steel 8-piece knife set with block',
          estimatedCost: 350,
        },
        {
          name: 'Espresso machine',
          quantity: 1,
          description: 'Commercial grade espresso machine with grinder',
          estimatedCost: 2500,
        }
      ],
      reason: 'Kitchen equipment upgrade needed for high-end clientele',
      notes: 'Approved by management for Q2 budget',
      approvedBy: 'admin@example.com',
      approvedByEmail: 'admin@example.com',
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    })
  }

  // Request 3: Guest room amenities for Finca Serena - DELIVERED
  if (fincaSerena) {
    equipmentRequests.push({
      propertyId: fincaSerena.id,
      roomId: null,
      requestedBy: 'Sophie Martin',
      requestedByEmail: 'sophie.martin@example.com',
      status: EquipmentRequestStatus.DELIVERED,
      priority: EquipmentRequestPriority.MEDIUM,
      items: [
        {
          name: 'Egyptian cotton bath towels',
          quantity: 24,
          description: '600 GSM luxury bath towels in white',
          estimatedCost: 35,
        },
        {
          name: 'Bed linen sets',
          quantity: 6,
          description: 'King size, 400 thread count, white',
          estimatedCost: 120,
        },
        {
          name: 'Bathrobes',
          quantity: 12,
          description: 'Terry cloth spa robes, one size fits all',
          estimatedCost: 45,
        }
      ],
      reason: 'Replenishing guest room inventory for the season',
      notes: 'Standard seasonal restock',
      approvedBy: 'manager@example.com',
      approvedByEmail: 'manager@example.com',
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    })
  }

  // Request 4: Garden tools for Finca Serena - ORDERED
  if (fincaSerena) {
    equipmentRequests.push({
      propertyId: fincaSerena.id,
      roomId: null,
      requestedBy: 'Carlos Rodriguez',
      requestedByEmail: 'carlos.rodriguez@example.com',
      status: EquipmentRequestStatus.ORDERED,
      priority: EquipmentRequestPriority.LOW,
      items: [
        {
          name: 'Electric lawn mower',
          quantity: 1,
          description: 'Cordless 40V lawn mower with mulching capability',
          estimatedCost: 450,
        },
        {
          name: 'Hedge trimmer',
          quantity: 1,
          description: 'Battery powered hedge trimmer',
          estimatedCost: 180,
        },
        {
          name: 'Garden tool set',
          quantity: 1,
          description: 'Complete set with rake, hoe, spade, and pruners',
          estimatedCost: 120,
        }
      ],
      reason: 'Garden maintenance equipment needed',
      notes: 'For in-house groundskeeping',
      approvedBy: 'manager@example.com',
      approvedByEmail: 'manager@example.com',
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      internalNotes: 'Ordered from supplier, expected delivery in 5 days',
    })
  }

  // Request 5: Safety equipment - REJECTED
  if (villaAzure) {
    equipmentRequests.push({
      propertyId: villaAzure.id,
      roomId: null,
      requestedBy: 'Emma Wilson',
      requestedByEmail: 'emma.wilson@example.com',
      status: EquipmentRequestStatus.REJECTED,
      priority: EquipmentRequestPriority.MEDIUM,
      items: [
        {
          name: 'Security camera system',
          quantity: 1,
          description: '8-camera wireless security system with DVR',
          estimatedCost: 2500,
        },
        {
          name: 'Motion sensors',
          quantity: 10,
          description: 'Smart motion sensors for perimeter',
          estimatedCost: 50,
        }
      ],
      reason: 'Enhance property security',
      notes: 'Recent incidents in the neighborhood',
      rejectedReason: 'Security upgrade already scheduled through corporate security vendor. This will be handled centrally.',
    })
  }

  // Request 6: Entertainment system - PENDING
  if (fincaSerena) {
    equipmentRequests.push({
      propertyId: fincaSerena.id,
      roomId: null,
      requestedBy: 'Alex Brown',
      requestedByEmail: 'alex.brown@example.com',
      status: EquipmentRequestStatus.PENDING,
      priority: EquipmentRequestPriority.MEDIUM,
      items: [
        {
          name: '65" Smart TV',
          quantity: 1,
          description: '4K OLED Smart TV for main living room',
          estimatedCost: 1500,
          link: 'https://electronics.example.com/tv-65-oled'
        },
        {
          name: 'Soundbar',
          quantity: 1,
          description: 'Premium soundbar with wireless subwoofer',
          estimatedCost: 400,
        },
        {
          name: 'Streaming device',
          quantity: 2,
          description: 'Latest streaming devices for guest use',
          estimatedCost: 50,
        }
      ],
      reason: 'Current TV is outdated and guests have complained',
      notes: 'Multiple guest reviews mention poor entertainment options',
    })
  }

  // Create all equipment requests
  for (const requestData of equipmentRequests) {
    const request = await prisma.equipmentRequest.create({
      data: requestData,
    })
    console.log(`Created equipment request: ${request.id} - ${requestData.items[0].name} (${requestData.status})`)
  }

  console.log(`Created ${equipmentRequests.length} equipment requests`)
}