import { prisma } from "../src/lib/db"

const destinations = [
  {
    name: "Saint-Tropez",
    country: "France",
    region: "Provence-Alpes-Côte d'Azur",
    latitude: 43.2677,
    longitude: 6.6407,
  },
  {
    name: "Ibiza",
    country: "Spain",
    region: "Balearic Islands",
    latitude: 39.0200,
    longitude: 1.4821,
  },
  {
    name: "Mykonos",
    country: "Greece",
    region: "South Aegean",
    latitude: 37.4467,
    longitude: 25.3289,
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    region: "Dubai",
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    name: "Maldives",
    country: "Maldives",
    region: "North Malé Atoll",
    latitude: 4.1755,
    longitude: 73.5093,
  },
  {
    name: "Bali",
    country: "Indonesia",
    region: "Bali Province",
    latitude: -8.3405,
    longitude: 115.0920,
  },
  {
    name: "Santorini",
    country: "Greece",
    region: "South Aegean",
    latitude: 36.3932,
    longitude: 25.4615,
  },
  {
    name: "Monaco",
    country: "Monaco",
    region: "Monaco",
    latitude: 43.7384,
    longitude: 7.4246,
  },
  {
    name: "Cannes",
    country: "France",
    region: "Provence-Alpes-Côte d'Azur",
    latitude: 43.5528,
    longitude: 7.0174,
  },
  {
    name: "Amalfi Coast",
    country: "Italy",
    region: "Campania",
    latitude: 40.6333,
    longitude: 14.6029,
  },
  {
    name: "Tuscany",
    country: "Italy",
    region: "Tuscany",
    latitude: 43.7711,
    longitude: 11.2486,
  },
  {
    name: "Paris",
    country: "France",
    region: "Île-de-France",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    name: "London",
    country: "United Kingdom",
    region: "England",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    name: "New York",
    country: "United States",
    region: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
  },
  {
    name: "Los Angeles",
    country: "United States",
    region: "California",
    latitude: 34.0522,
    longitude: -118.2437,
  }
]

async function seedDestinations() {
  console.log("🌍 Seeding destinations...")

  for (const destination of destinations) {
    try {
      // First check if destination exists
      const existing = await prisma.destination.findFirst({
        where: {
          name: destination.name,
          country: destination.country,
        }
      })

      if (existing) {
        const updated = await prisma.destination.update({
          where: { id: existing.id },
          data: destination,
        })
        console.log(`✅ Updated destination: ${updated.name}`)
      } else {
        const created = await prisma.destination.create({
          data: destination,
        })
        console.log(`✅ Created destination: ${created.name}`)
      }
    } catch (error) {
      console.error(`❌ Failed to create destination ${destination.name}:`, error)
    }
  }

  console.log("✨ Destinations seeding completed!")
}

seedDestinations()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })