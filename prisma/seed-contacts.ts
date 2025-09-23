import { PrismaClient, GlobalContactCategory, ContactPropertyRelationship, Contact } from '../src/generated/prisma'

const prisma = new PrismaClient()

export async function seedContacts() {
  console.log('Seeding contacts...')

  // Get existing properties to link contacts to
  const properties = await prisma.property.findMany({
    select: { id: true, name: true },
    take: 10,
  })

  if (properties.length === 0) {
    console.log('No properties found. Please seed properties first.')
    return
  }

  // Create OWNER contacts
  const owners = [
    {
      firstName: 'Jean-Pierre',
      lastName: 'Dubois',
      email: 'jp.dubois@gmail.com',
      phone: '+33 6 12 34 56 78',
      language: 'French',
      category: GlobalContactCategory.OWNER,
      comments: 'Primary owner of Villa Azure. Prefers communication in French.',
    },
    {
      firstName: 'Maria',
      lastName: 'González',
      email: 'maria.gonzalez@outlook.com',
      phone: '+34 612 345 678',
      language: 'Spanish',
      category: GlobalContactCategory.OWNER,
      comments: 'Co-owner of multiple properties in Mallorca. Very responsive.',
    },
    {
      firstName: 'David',
      lastName: 'Thompson',
      email: 'david.thompson@propertyinvest.com',
      phone: '+44 7700 900123',
      language: 'English',
      category: GlobalContactCategory.OWNER,
      comments: 'Investment property owner. All communications through his assistant.',
    },
    {
      firstName: 'Isabella',
      lastName: 'Rossi',
      email: 'i.rossi@luxuryvillas.it',
      phone: '+39 333 123 4567',
      language: 'Italian',
      category: GlobalContactCategory.OWNER,
      comments: 'Owns several properties across the Mediterranean.',
    },
    {
      firstName: 'Hans',
      lastName: 'Mueller',
      email: 'hans.mueller@gmx.de',
      phone: '+49 151 12345678',
      language: 'German',
      category: GlobalContactCategory.OWNER,
      comments: 'Seasonal owner, property available for rent 6 months/year.',
    },
  ]

  // Create CLIENT contacts
  const clients = [
    {
      firstName: 'Emma',
      lastName: 'Johnson',
      email: 'emma.j@gmail.com',
      phone: '+1 555 123 4567',
      language: 'English',
      category: GlobalContactCategory.CLIENT,
      comments: 'Regular client, books every summer. VIP treatment.',
    },
    {
      firstName: 'François',
      lastName: 'Martin',
      email: 'f.martin@corporateretreat.fr',
      phone: '+33 1 42 86 82 00',
      language: 'French',
      category: GlobalContactCategory.CLIENT,
      comments: 'Corporate client, books for company retreats.',
    },
    {
      firstName: 'Yuki',
      lastName: 'Tanaka',
      email: 'yuki.tanaka@gmail.com',
      phone: '+81 90 1234 5678',
      language: 'English',
      category: GlobalContactCategory.CLIENT,
      comments: 'International client, requires English-speaking staff.',
    },
    {
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      email: 'a.alrashid@luxurytravel.ae',
      phone: '+971 50 123 4567',
      language: 'English',
      category: GlobalContactCategory.CLIENT,
      comments: 'High-value client, books multiple properties annually.',
    },
    {
      firstName: 'Sophie',
      lastName: 'Andersson',
      email: 'sophie.andersson@outlook.se',
      phone: '+46 70 123 45 67',
      language: 'English',
      category: GlobalContactCategory.CLIENT,
      comments: 'Family bookings, needs child-friendly properties.',
    },
    {
      firstName: 'Roberto',
      lastName: 'Silva',
      email: 'roberto.silva@gmail.com',
      phone: '+55 11 98765 4321',
      language: 'Portuguese',
      category: GlobalContactCategory.CLIENT,
      comments: 'Brazilian client, books during European summer.',
    },
    {
      firstName: 'Elena',
      lastName: 'Popov',
      email: 'elena.popov@yandex.ru',
      phone: '+7 916 123 45 67',
      language: 'Russian',
      category: GlobalContactCategory.CLIENT,
      comments: 'Requires Russian-speaking concierge service.',
    },
    {
      firstName: 'Michael',
      lastName: 'O\'Brien',
      email: 'mobrien@techcorp.com',
      phone: '+353 87 123 4567',
      language: 'English',
      category: GlobalContactCategory.CLIENT,
      comments: 'Tech executive, books for remote work stays.',
    },
  ]

  // Create PROVIDER contacts
  const providers = [
    {
      firstName: 'Marie',
      lastName: 'Lefebvre',
      email: 'marie@cleaningservices.fr',
      phone: '+33 6 98 76 54 32',
      language: 'French',
      category: GlobalContactCategory.PROVIDER,
      comments: 'Head of cleaning team for French Riviera properties.',
    },
    {
      firstName: 'Carlos',
      lastName: 'Mendez',
      email: 'carlos@poolmaintenance.es',
      phone: '+34 666 123 456',
      language: 'Spanish',
      category: GlobalContactCategory.PROVIDER,
      comments: 'Pool maintenance specialist for Mallorca properties.',
    },
    {
      firstName: 'Giuseppe',
      lastName: 'Bianchi',
      email: 'g.bianchi@villamaintenance.com',
      phone: '+39 348 876 5432',
      language: 'Italian',
      category: GlobalContactCategory.PROVIDER,
      comments: 'General maintenance and repairs. Available 24/7 for emergencies.',
    },
    {
      firstName: 'Anna',
      lastName: 'Kowalski',
      email: 'anna@gardenservices.eu',
      phone: '+48 601 234 567',
      language: 'English',
      category: GlobalContactCategory.PROVIDER,
      comments: 'Landscaping and garden maintenance services.',
    },
    {
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'chef.pierre@gourmetcatering.fr',
      phone: '+33 6 45 67 89 01',
      language: 'French',
      category: GlobalContactCategory.PROVIDER,
      comments: 'Private chef services for luxury properties. Michelin-trained.',
    },
    {
      firstName: 'Laura',
      lastName: 'Schneider',
      email: 'laura@conciergepro.com',
      phone: '+41 79 123 45 67',
      language: 'German',
      category: GlobalContactCategory.PROVIDER,
      comments: 'Premium concierge services. Multilingual team available.',
    },
  ]

  // Create ORGANIZATION contacts
  const organizations = [
    {
      firstName: 'Luxury Properties',
      lastName: 'Management',
      email: 'info@luxurypropertiesmgmt.com',
      phone: '+33 4 93 00 00 00',
      language: 'English',
      category: GlobalContactCategory.ORGANIZATION,
      comments: 'Property management company handling 50+ villas.',
    },
    {
      firstName: 'Riviera Real',
      lastName: 'Estate Agency',
      email: 'contact@riviera-realestate.com',
      phone: '+33 4 92 00 00 00',
      language: 'French',
      category: GlobalContactCategory.ORGANIZATION,
      comments: 'Partner agency for property acquisitions and sales.',
    },
    {
      firstName: 'Tourism Board',
      lastName: 'French Riviera',
      email: 'pro@cotedazur-tourism.com',
      phone: '+33 4 93 37 78 78',
      language: 'French',
      category: GlobalContactCategory.ORGANIZATION,
      comments: 'Official tourism board. Source for local events and regulations.',
    },
    {
      firstName: 'Legal Partners',
      lastName: 'International',
      email: 'info@legalpartners-intl.com',
      phone: '+33 1 40 00 00 00',
      language: 'English',
      category: GlobalContactCategory.ORGANIZATION,
      comments: 'Legal firm specializing in international property law.',
    },
    {
      firstName: 'Premium Insurance',
      lastName: 'Group',
      email: 'luxury@premiuminsurance.eu',
      phone: '+44 20 7123 4567',
      language: 'English',
      category: GlobalContactCategory.ORGANIZATION,
      comments: 'Specialized insurance for luxury vacation rentals.',
    },
  ]

  // Create OTHER contacts
  const others = [
    {
      firstName: 'Emergency',
      lastName: 'Services',
      email: 'emergency@localservices.fr',
      phone: '112',
      language: 'French',
      category: GlobalContactCategory.OTHER,
      comments: 'Emergency contact number for all EU properties.',
    },
    {
      firstName: 'Dr. Sarah',
      lastName: 'Mitchell',
      email: 'dr.mitchell@mediconcierge.com',
      phone: '+33 6 11 22 33 44',
      language: 'English',
      category: GlobalContactCategory.OTHER,
      comments: 'Medical concierge service for VIP guests.',
    },
    {
      firstName: 'Tech Support',
      lastName: 'Team',
      email: 'support@smarthomepro.com',
      phone: '+33 800 123 456',
      language: 'English',
      category: GlobalContactCategory.OTHER,
      comments: 'Smart home system support for equipped properties.',
    },
  ]

  // Combine all contacts
  const allContacts = [...owners, ...clients, ...providers, ...organizations, ...others]

  // Create contacts and link some to properties
  const createdContacts: Contact[] = []
  
  for (const contact of allContacts) {
    const created = await prisma.contact.create({
      data: contact,
    })
    createdContacts.push(created)
  }

  console.log(`Created ${createdContacts.length} contacts`)

  // Create property relationships
  const relationships = []

  // Link owners to properties
  if (properties.length > 0) {
    for (let i = 0; i < Math.min(5, createdContacts.filter(c => c.category === 'OWNER').length); i++) {
      const owner = createdContacts.filter(c => c.category === 'OWNER')[i]
      const property = properties[i % properties.length]
      
      relationships.push({
        contactId: owner.id,
        propertyId: property.id,
        relationship: ContactPropertyRelationship.OWNER,
      })
    }
  }

  // Link some clients to properties they've rented
  if (properties.length > 0) {
    const clientContacts = createdContacts.filter(c => c.category === 'CLIENT')
    for (let i = 0; i < Math.min(5, clientContacts.length); i++) {
      const client = clientContacts[i]
      const property = properties[Math.floor(Math.random() * properties.length)]
      
      relationships.push({
        contactId: client.id,
        propertyId: property.id,
        relationship: ContactPropertyRelationship.RENTER,
      })
    }
  }

  // Link providers to properties they service
  if (properties.length > 0) {
    const providerContacts = createdContacts.filter(c => c.category === 'PROVIDER')
    for (const provider of providerContacts) {
      // Each provider services 2-4 random properties
      const numProperties = Math.floor(Math.random() * 3) + 2
      const selectedProperties = properties
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(numProperties, properties.length))
      
      for (const property of selectedProperties) {
        relationships.push({
          contactId: provider.id,
          propertyId: property.id,
          relationship: provider.comments?.includes('maintenance') 
            ? ContactPropertyRelationship.MAINTENANCE 
            : ContactPropertyRelationship.STAFF,
        })
      }
    }
  }

  // Create all relationships
  for (const rel of relationships) {
    await prisma.contactProperty.create({
      data: rel,
    })
  }

  console.log(`Created ${relationships.length} contact-property relationships`)
  console.log('Contacts seeding completed!')
}