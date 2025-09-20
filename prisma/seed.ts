import { PrismaClient, PropertyStatus, LicenseType, ConciergeServiceOffer, RoomType, AccessibilityType } from '../src/generated/prisma'
import { seedActivityProviders } from './seed-activity-providers'
import { seedContacts } from './seed-contacts'
import { seedEquipmentRequests } from './seed-equipment-requests'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create sample destinations
  const destination1 = await prisma.destination.create({
    data: {
      name: 'French Riviera',
      country: 'France',
      region: 'Provence-Alpes-Côte d\'Azur',
      latitude: 43.7102,
      longitude: 7.2620,
    },
  })

  const destination2 = await prisma.destination.create({
    data: {
      name: 'Mallorca',
      country: 'Spain',
      region: 'Balearic Islands',
      latitude: 39.5696,
      longitude: 2.6502,
    },
  })

  const destination3 = await prisma.destination.create({
    data: {
      name: 'Saint-Tropez',
      country: 'France',
      region: 'Provence-Alpes-Côte d\'Azur',
      latitude: 43.2677,
      longitude: 6.6407,
    },
  })

  const destination4 = await prisma.destination.create({
    data: {
      name: 'Ibiza',
      country: 'Spain',
      region: 'Balearic Islands',
      latitude: 38.9067,
      longitude: 1.4206,
    },
  })

  const destination5 = await prisma.destination.create({
    data: {
      name: 'Santorini',
      country: 'Greece',
      region: 'South Aegean',
      latitude: 36.3932,
      longitude: 25.4615,
    },
  })

  const destination6 = await prisma.destination.create({
    data: {
      name: 'Amalfi Coast',
      country: 'Italy',
      region: 'Campania',
      latitude: 40.6340,
      longitude: 14.6027,
    },
  })

  const destination7 = await prisma.destination.create({
    data: {
      name: 'Mykonos',
      country: 'Greece',
      region: 'South Aegean',
      latitude: 37.4467,
      longitude: 25.3289,
    },
  })

  const destination8 = await prisma.destination.create({
    data: {
      name: 'Monaco',
      country: 'Monaco',
      region: 'Monaco',
      latitude: 43.7384,
      longitude: 7.4246,
    },
  })

  const destination9 = await prisma.destination.create({
    data: {
      name: 'Cannes',
      country: 'France',
      region: 'Provence-Alpes-Côte d\'Azur',
      latitude: 43.5528,
      longitude: 7.0174,
    },
  })

  const destination10 = await prisma.destination.create({
    data: {
      name: 'Porto Cervo',
      country: 'Italy',
      region: 'Sardinia',
      latitude: 41.1349,
      longitude: 9.5213,
    },
  })

  // Create sample properties
  const property1 = await prisma.property.create({
    data: {
      name: 'Villa Azure',
      originalName: 'Villa Azure - Luxury Beachfront',
      status: PropertyStatus.PUBLISHED,
      destinationId: destination1.id,
      numberOfRooms: 5,
      numberOfBathrooms: 4,
      maxGuests: 10,
      propertySize: 350,
      address: '123 Promenade des Anglais',
      postcode: '06000',
      city: 'Nice',
      latitude: 43.6942,
      longitude: 7.2517,
      additionalDetails: 'Stunning beachfront villa with panoramic sea views',
      licenseType: LicenseType.TYPE_1,
      conciergeServiceOffer: ConciergeServiceOffer.LUXURY,
      categories: ['Sea', 'Luxury'],
      accessibilityOptions: [AccessibilityType.BY_CAR],
      exclusivity: true,
      iconicCollection: true,
      onlineReservation: true,
      flexibleCancellation: true,
      neighborhood: 'Promenade des Anglais',
      setting: 'Beachfront',
      beachAccess: true,
      beachAccessibility: 'Direct access',
      beachTravelTime: '0 minutes',
      privateBeachAccess: true,
      shops: true,
      restaurants: true,
      touristCenter: true,
      eventsAllowed: true,
      eventsCapacity: 50,
      eventsDetails: 'Perfect for weddings and private celebrations',
      goodToKnow: 'Check-in after 4 PM, Check-out before 11 AM',
      // Add rooms
      rooms: {
        create: [
          {
            name: 'Master Bedroom',
            type: RoomType.BEDROOM,
            groupName: '1 - Sleeping Area',
            position: 1,
            view: 'Sea view',
            generalInfo: {
              size: '45m²',
              bed: 'King size',
              ensuite: true,
            },
          },
          {
            name: 'Pool Deck',
            type: RoomType.POOL_AREA,
            groupName: '2 - Outdoor Area',
            position: 2,
            view: 'Sea view',
            generalInfo: {
              size: '100m²',
              poolSize: '12x6m',
              heated: true,
            },
          },
        ],
      },
      // Add sample price ranges
      prices: {
        create: [
          {
            name: 'Peak Season',
            startDate: new Date('2024-07-01'),
            endDate: new Date('2024-08-31'),
            nightlyRate: 1500,
            weeklyRate: 9000,
            minimumStay: 7,
          },
          {
            name: 'Regular Season',
            startDate: new Date('2024-05-01'),
            endDate: new Date('2024-06-30'),
            nightlyRate: 1000,
            weeklyRate: 6000,
            minimumStay: 5,
          },
        ],
      },
      // Add marketing content
      marketingContent: {
        create: [
          {
            language: 'en',
            title: 'Luxury Beachfront Villa Azure',
            description: 'Experience the epitome of French Riviera luxury in this stunning beachfront villa. With direct beach access and panoramic sea views, Villa Azure offers an unforgettable vacation experience.',
            amenities: ['Private Pool', 'Beach Access', 'Chef Kitchen', 'Cinema Room', 'Wine Cellar'],
            highlights: ['180° sea views', 'Private beach access', 'Concierge service', 'Walking distance to restaurants'],
            seoTitle: 'Luxury Beachfront Villa Rental French Riviera | Villa Azure',
            seoDescription: 'Book your dream vacation in this exclusive beachfront villa on the French Riviera. Private pool, direct beach access, and luxury amenities.',
          },
        ],
      },
    },
  })

  const property2 = await prisma.property.create({
    data: {
      name: 'Finca Serena',
      status: PropertyStatus.ONBOARDING,
      destinationId: destination2.id,
      numberOfRooms: 6,
      numberOfBathrooms: 5,
      maxGuests: 12,
      propertySize: 400,
      address: 'Carrer de la Serra',
      postcode: '07001',
      city: 'Palma',
      latitude: 39.5713,
      longitude: 2.6542,
      licenseType: LicenseType.TYPE_2,
      conciergeServiceOffer: ConciergeServiceOffer.PREMIUM,
      categories: ['Countryside'],
      accessibilityOptions: [AccessibilityType.BY_CAR],
      onlineReservation: true,
      setting: 'Countryside',
      golfCourse: true,
    },
  })

  // Add a few more properties to other destinations
  const property3 = await prisma.property.create({
    data: {
      name: 'Villa Santorini Sunset',
      status: PropertyStatus.PUBLISHED,
      destinationId: destination5.id,
      numberOfRooms: 4,
      numberOfBathrooms: 3,
      maxGuests: 8,
      propertySize: 280,
      address: '123 Caldera View',
      postcode: '84700',
      city: 'Oia',
      latitude: 36.4618,
      longitude: 25.3753,
      licenseType: LicenseType.TYPE_1,
      conciergeServiceOffer: ConciergeServiceOffer.LUXURY,
      categories: ['Sea'],
      accessibilityOptions: [AccessibilityType.BY_CAR, AccessibilityType.BY_FOOT],
      exclusivity: true,
      iconicCollection: true,
      onlineReservation: true,
      setting: 'Clifftop',
      beachAccess: false,
    },
  })

  const property4 = await prisma.property.create({
    data: {
      name: 'Monaco Penthouse',
      status: PropertyStatus.PUBLISHED,
      destinationId: destination8.id,
      numberOfRooms: 3,
      numberOfBathrooms: 3,
      maxGuests: 6,
      propertySize: 250,
      address: 'Avenue Princesse Grace',
      postcode: '98000',
      city: 'Monaco',
      latitude: 43.7396,
      longitude: 7.4277,
      licenseType: LicenseType.TYPE_1,
      conciergeServiceOffer: ConciergeServiceOffer.LUXURY,
      categories: ['City'],
      accessibilityOptions: [AccessibilityType.BY_CAR, AccessibilityType.BY_FOOT],
      exclusivity: true,
      iconicCollection: true,
      onlineReservation: true,
      setting: 'Urban',
      shops: true,
      restaurants: true,
      touristCenter: true,
    },
  })

  // Add a mountain property with ski access and diverse room types
  const property5 = await prisma.property.create({
    data: {
      name: 'Alpine Chalet Luxe',
      status: PropertyStatus.PUBLISHED,
      destinationId: destination3.id, // Saint-Tropez for demo
      numberOfRooms: 8,
      numberOfBathrooms: 6,
      maxGuests: 16,
      propertySize: 450,
      address: '1 Route des Alpines',
      postcode: '73120',
      city: 'Courchevel',
      licenseType: LicenseType.TYPE_1,
      conciergeServiceOffer: ConciergeServiceOffer.LUXURY,
      categories: ['Mountain'],
      accessibilityOptions: [AccessibilityType.SKI_IN_SKI_OUT, AccessibilityType.BY_CAR],
      exclusivity: true,
      iconicCollection: true,
      onlineReservation: true,
      setting: 'Mountain',
      skiSlopes: true,
      // Add diverse room types
      rooms: {
        create: [
          {
            name: 'Master Suite',
            type: RoomType.SUITE,
            groupName: '1 - Sleeping Area',
            position: 1,
            view: 'Mountain view',
          },
          {
            name: 'Children Bedroom',
            type: RoomType.BEDROOM_FOR_CHILDREN,
            groupName: '1 - Sleeping Area', 
            position: 2,
          },
          {
            name: 'Home Cinema',
            type: RoomType.MOVIE_ROOM,
            groupName: '2 - Entertainment',
            position: 3,
          },
          {
            name: 'Wine Cave',
            type: RoomType.WINE_CELLAR,
            groupName: '3 - Utility',
            position: 4,
          },
          {
            name: 'Spa Room',
            type: RoomType.SPA,
            groupName: '4 - Wellness',
            position: 5,
          },
          {
            name: 'Fitness Center',
            type: RoomType.FITNESS_ROOM,
            groupName: '4 - Wellness',
            position: 6,
          },
          {
            name: 'Ski Room',
            type: RoomType.SKIROOM,
            groupName: '3 - Utility',
            position: 7,
          },
        ],
      },
      // Add property contacts with new types
      contacts: {
        create: [
          {
            type: 'OWNER',
            name: 'Jean-Claude Dubois',
            email: 'jc.dubois@email.com',
            phone: '+33 6 12 34 56 78',
            notes: 'Property owner, speaks French and English',
            isApproved: true,
          },
          {
            type: 'MANAGER',
            name: 'Marie Blanc',
            email: 'marie.blanc@manphil.com',
            phone: '+33 6 87 65 43 21',
            notes: 'Property manager for day-to-day operations',
            isApproved: true,
          },
          {
            type: 'CHECK_IN_MANAGER',
            name: 'Pierre Martin',
            email: 'pierre.martin@manphil.com',
            phone: '+33 6 11 22 33 44',
            notes: 'Handles all guest check-ins and key handovers',
            isApproved: true,
          },
          {
            type: 'SECURITY_DEPOSIT_MANAGER',
            name: 'Sophie Laurent',
            email: 'sophie.laurent@manphil.com',
            phone: '+33 6 55 66 77 88',
            notes: 'Manages security deposits and damage assessments',
            isApproved: true,
          },
        ],
      },
    },
  })

  const destinations = [
    destination1, destination2, destination3, destination4, destination5,
    destination6, destination7, destination8, destination9, destination10
  ]
  
  console.log(`Created ${destinations.length} destinations: ${destinations.map(d => d.name).join(', ')}`)
  console.log(`Created properties: ${property1.name}, ${property2.name}, ${property3.name}, ${property4.name}, ${property5.name}`)
  
  // Seed activity providers
  await seedActivityProviders()
  
  // Seed contacts
  await seedContacts()
  
  // Seed equipment requests
  await seedEquipmentRequests()
  
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })