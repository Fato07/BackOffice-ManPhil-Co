import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

export async function seedActivityProviders() {
  console.log('Seeding activity providers...')

  // Get some existing properties to link providers to
  const properties = await prisma.property.findMany({
    take: 5,
    select: { id: true, city: true, destinationId: true }
  })

  const activityProviders = [
    // BAKERY
    {
      name: "Le Pain Quotidien",
      type: "BAKERY",
      description: "Artisanal bakery and organic restaurant serving fresh bread, pastries, and healthy meals",
      address: "15 Rue de la Paix",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 88 12 34",
      email: "nice@lepainquotidien.fr",
      website: "https://lepainquotidien.fr",
      openingHours: "Mon-Fri: 7am-8pm, Sat-Sun: 8am-9pm",
      priceRange: "€€",
      amenities: ["wifi", "outdoor-seating", "takeaway", "coffee"],
      tags: ["organic", "breakfast", "wifi", "family-friendly"],
      rating: 4.5,
      comments: "Great for breakfast, fresh bread daily",
      properties: properties.length > 0 ? { connect: properties.slice(0, 2).map(p => ({ id: p.id })) } : undefined
    },
    {
      name: "Boulangerie Patisserie Lac",
      type: "BAKERY",
      description: "Traditional French bakery with award-winning croissants and pastries",
      address: "8 Avenue Jean Médecin",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 16 55 77",
      email: "contact@boulangerie-lac.fr",
      openingHours: "Mon-Sat: 6:30am-7:30pm, Sun: 7am-1pm",
      priceRange: "€",
      amenities: ["takeaway", "coffee"],
      tags: ["traditional", "croissants", "local-favorite"],
      rating: 4.7,
      comments: "Best croissants in the neighborhood"
    },
    
    // PHARMACY
    {
      name: "Pharmacie Centrale",
      type: "PHARMACY",
      description: "24/7 pharmacy with English-speaking staff and international prescriptions",
      address: "50 Avenue Jean Médecin",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 16 77 88",
      email: "info@pharmaciecentrale-nice.fr",
      website: "https://pharmaciecentrale-nice.fr",
      openingHours: "24/7",
      priceRange: "€€",
      amenities: ["24-7", "english-speaking", "delivery", "prescriptions"],
      tags: ["24/7", "english", "delivery", "emergency"],
      rating: 4.2,
      comments: "Open 24/7, staff speaks English",
      internalNotes: "Has contract for property guest emergencies",
      properties: properties.length > 0 ? { connect: [{ id: properties[0].id }] } : undefined
    },
    {
      name: "Pharmacie du Port",
      type: "PHARMACY",
      description: "Waterfront pharmacy specializing in sun care and travel health",
      address: "1 Quai des États-Unis",
      city: "Nice",
      country: "France",
      postalCode: "06300",
      phone: "+33 4 93 55 80 77",
      openingHours: "Mon-Sat: 8:30am-7:30pm, Sun: 9am-12pm",
      priceRange: "€€",
      amenities: ["prescriptions", "cosmetics", "sun-care"],
      tags: ["beachfront", "sun-care", "cosmetics"],
      rating: 4.0
    },
    
    // RESTAURANTS
    {
      name: "La Petite Maison",
      type: "RESTAURANTS",
      description: "Michelin-starred Mediterranean cuisine in an elegant setting",
      address: "11 Rue Saint-François de Paule",
      city: "Nice",
      country: "France",
      postalCode: "06300",
      phone: "+33 4 93 92 59 59",
      email: "reservation@lapetitemaison.com",
      website: "https://lapetitemaison-nice.com",
      openingHours: "Mon-Sun: 12pm-2:30pm, 7pm-11pm",
      priceRange: "€€€€",
      amenities: ["fine-dining", "wine-list", "reservations", "valet-parking"],
      tags: ["michelin", "mediterranean", "fine-dining", "romantic"],
      rating: 4.8,
      comments: "Advance reservations required, dress code enforced",
      properties: properties.length > 0 ? { connect: properties.slice(0, 3).map(p => ({ id: p.id })) } : undefined
    },
    {
      name: "Chez Palmyre",
      type: "RESTAURANTS",
      description: "Traditional Niçois cuisine in a charming family-run bistro",
      address: "5 Rue Droite",
      city: "Nice",
      country: "France",
      postalCode: "06300",
      phone: "+33 4 93 85 72 32",
      openingHours: "Mon-Fri: 12pm-2pm, 7pm-9:30pm",
      priceRange: "€€",
      amenities: ["traditional", "local-cuisine", "cash-only"],
      tags: ["traditional", "local", "authentic", "cash-only"],
      rating: 4.6,
      comments: "Cash only, no reservations, arrive early"
    },
    {
      name: "Jan Restaurant",
      type: "RESTAURANTS",
      description: "Modern fusion cuisine with panoramic city views",
      address: "12 Rue Lascaris",
      city: "Nice",
      country: "France",
      postalCode: "06300",
      phone: "+33 4 97 19 32 23",
      email: "contact@restaurantjan.com",
      website: "https://restaurantjan.com",
      openingHours: "Tue-Sat: 12pm-2pm, 7:30pm-10pm",
      priceRange: "€€€",
      amenities: ["terrace", "wine-bar", "vegetarian-options", "reservations"],
      tags: ["modern", "fusion", "terrace", "michelin-guide"],
      rating: 4.7
    },
    
    // SUPERMARKET
    {
      name: "Monoprix Nice Étoile",
      type: "SUPERMARKET",
      description: "Large supermarket with fresh produce, deli, and household items",
      address: "30 Avenue Jean Médecin",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 16 95 95",
      website: "https://monoprix.fr",
      openingHours: "Mon-Sat: 8:30am-9pm, Sun: 9am-1pm",
      priceRange: "€€",
      amenities: ["deli", "bakery", "wine-selection", "pharmacy", "clothing"],
      tags: ["central", "one-stop-shop", "fresh-produce"],
      rating: 4.1,
      comments: "Central location, good wine selection"
    },
    {
      name: "Carrefour City",
      type: "SUPERMARKET",
      description: "Convenient neighborhood market for daily essentials",
      address: "42 Rue de France",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 88 66 77",
      openingHours: "Mon-Sun: 7am-11pm",
      priceRange: "€",
      amenities: ["late-hours", "basic-groceries", "snacks"],
      tags: ["convenient", "late-hours", "essentials"],
      rating: 3.8
    },
    
    // MEDICAL
    {
      name: "Centre Médical International",
      type: "MEDICAL",
      description: "Multi-specialty medical center with English-speaking doctors",
      address: "25 Boulevard Victor Hugo",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 82 30 30",
      email: "contact@cmi-nice.fr",
      website: "https://cmi-nice.fr",
      openingHours: "Mon-Fri: 8am-7pm, Sat: 9am-1pm",
      priceRange: "€€€",
      amenities: ["english-speaking", "multi-specialty", "x-ray", "laboratory"],
      tags: ["english", "international", "emergency", "specialists"],
      rating: 4.4,
      comments: "Appointment required, accepts international insurance",
      internalNotes: "Partner clinic for property guests"
    },
    {
      name: "Dr. Sarah Mitchell - General Practitioner",
      type: "MEDICAL",
      description: "English-speaking GP specializing in travel medicine",
      address: "18 Rue du Congrès",
      city: "Nice",
      country: "France",
      postalCode: "06000",
      phone: "+33 4 93 88 45 67",
      email: "dr.mitchell@medical-nice.fr",
      openingHours: "Mon-Thu: 9am-6pm, Fri: 9am-4pm",
      priceRange: "€€",
      amenities: ["english-speaking", "travel-medicine", "vaccinations"],
      tags: ["english", "gp", "travel-medicine"],
      rating: 4.8
    },
    
    // TRANSPORT
    {
      name: "Nice Taxi Riviera",
      type: "TRANSPORT",
      description: "Premium taxi and airport transfer service",
      address: "Aéroport Nice Côte d'Azur",
      city: "Nice",
      country: "France",
      phone: "+33 4 93 13 78 78",
      email: "booking@nicetaxiriviera.com",
      website: "https://nicetaxiriviera.com",
      openingHours: "24/7",
      priceRange: "€€€",
      amenities: ["airport-transfer", "24-7", "english-speaking", "app-booking"],
      tags: ["airport", "24/7", "reliable", "english"],
      rating: 4.3,
      comments: "Fixed rates to airport, book via app or phone"
    },
    {
      name: "Rent a Bike Nice",
      type: "TRANSPORT",
      description: "Bicycle rental with delivery to properties",
      address: "23 Rue de Belgique",
      city: "Nice",
      country: "France",
      phone: "+33 6 12 34 56 78",
      email: "info@rentabike-nice.fr",
      website: "https://rentabike-nice.fr",
      openingHours: "Daily: 9am-7pm",
      priceRange: "€€",
      amenities: ["delivery", "electric-bikes", "helmets", "locks"],
      tags: ["eco-friendly", "delivery", "electric", "tours"],
      rating: 4.6
    },
    
    // ENTERTAINMENT
    {
      name: "Opéra de Nice",
      type: "ENTERTAINMENT",
      description: "Historic opera house hosting world-class performances",
      address: "4-6 Rue Saint-François de Paule",
      city: "Nice",
      country: "France",
      phone: "+33 4 92 17 40 00",
      website: "https://opera-nice.org",
      openingHours: "Box office: Tue-Sat 11am-5:30pm",
      priceRange: "€€€",
      amenities: ["performances", "guided-tours", "bar", "dress-code"],
      tags: ["culture", "opera", "ballet", "concerts"],
      rating: 4.7,
      comments: "Book tickets online, dress code for evening performances"
    },
    {
      name: "Cinema Pathé Masséna",
      type: "ENTERTAINMENT",
      description: "Modern multiplex cinema showing latest releases",
      address: "31 Avenue Jean Médecin",
      city: "Nice",
      country: "France",
      phone: "+33 892 69 66 96",
      website: "https://pathe.fr",
      openingHours: "Daily: 10am-midnight",
      priceRange: "€€",
      amenities: ["imax", "vip-seats", "snacks", "parking"],
      tags: ["movies", "imax", "english-subtitles", "late-night"],
      rating: 4.2
    },
    
    // SPORTS
    {
      name: "Tennis Club de Nice",
      type: "SPORTS",
      description: "Private tennis club with clay courts and coaching",
      address: "5 Avenue Suzanne Lenglen",
      city: "Nice",
      country: "France",
      phone: "+33 4 93 86 14 49",
      email: "contact@tennisclubnice.com",
      website: "https://tennisclubnice.com",
      openingHours: "Daily: 7am-10pm",
      priceRange: "€€€",
      amenities: ["clay-courts", "coaching", "pro-shop", "restaurant"],
      tags: ["tennis", "lessons", "tournaments", "membership"],
      rating: 4.5,
      comments: "Guest passes available, advance booking required"
    },
    {
      name: "Nice Plongée - Diving Center",
      type: "SPORTS",
      description: "PADI diving center offering courses and excursions",
      address: "Port de Nice, Quai Amiral Infernet",
      city: "Nice",
      country: "France",
      phone: "+33 6 09 52 40 05",
      email: "info@nice-plongee.com",
      website: "https://nice-plongee.com",
      openingHours: "Daily: 8am-6pm (summer), 9am-5pm (winter)",
      priceRange: "€€€",
      amenities: ["padi-certified", "equipment-rental", "courses", "boat-trips"],
      tags: ["diving", "snorkeling", "padi", "beginners-welcome"],
      rating: 4.8
    },
    
    // OTHER
    {
      name: "Fleurs Riviera",
      type: "OTHER",
      description: "Premium florist specializing in event arrangements",
      address: "7 Rue de la Liberté",
      city: "Nice",
      country: "France",
      phone: "+33 4 93 87 88 89",
      email: "contact@fleursriviera.com",
      openingHours: "Mon-Sat: 9am-7pm, Sun: 9am-1pm",
      priceRange: "€€€",
      amenities: ["delivery", "events", "custom-arrangements"],
      tags: ["flowers", "events", "delivery", "luxury"],
      rating: 4.6,
      comments: "Same-day delivery available"
    },
    {
      name: "Nice Pet Care",
      type: "OTHER",
      description: "Veterinary clinic and pet supplies",
      address: "33 Boulevard Gambetta",
      city: "Nice",
      country: "France",
      phone: "+33 4 93 44 66 88",
      email: "info@nicepetcare.fr",
      openingHours: "Mon-Fri: 9am-7pm, Sat: 9am-5pm",
      priceRange: "€€",
      amenities: ["veterinary", "grooming", "pet-supplies", "emergency"],
      tags: ["pets", "veterinary", "grooming", "emergency"],
      rating: 4.4
    }
  ]

  // Create activity providers
  for (const providerData of activityProviders) {
    await prisma.activityProvider.create({
      data: providerData
    })
  }

  console.log(`Created ${activityProviders.length} activity providers`)
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedActivityProviders()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}