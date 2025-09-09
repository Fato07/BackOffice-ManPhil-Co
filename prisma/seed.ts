import { PrismaClient, PropertyStatus, LicenseType, ConciergeServiceOffer } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create sample destinations
  const destination1 = await prisma.destination.create({
    data: {
      name: 'French Riviera',
      country: 'France',
      region: 'Provence-Alpes-Côte d\'Azur',
    },
  })

  const destination2 = await prisma.destination.create({
    data: {
      name: 'Mallorca',
      country: 'Spain',
      region: 'Balearic Islands',
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
      categories: ['Beachfront', 'Luxury', 'Family-friendly'],
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
            type: 'INTERIOR',
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
            type: 'OUTDOOR',
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
      city: 'Palma',
      licenseType: LicenseType.TYPE_2,
      conciergeServiceOffer: ConciergeServiceOffer.PREMIUM,
      categories: ['Countryside', 'Pool', 'Family-friendly'],
      onlineReservation: true,
      setting: 'Countryside',
      golfCourse: true,
    },
  })

  console.log(`Created destinations: ${destination1.name}, ${destination2.name}`)
  console.log(`Created properties: ${property1.name}, ${property2.name}`)
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