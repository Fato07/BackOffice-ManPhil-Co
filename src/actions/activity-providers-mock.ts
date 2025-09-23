'use server'

// Mock implementation for activity providers until database is properly set up
// This allows the Places feature to work with static data while we fix the DB connection

const mockProviders = [
  {
    id: '1',
    name: 'Maison Chazarin',
    type: 'BAKERY',
    address: '123 Rue de la Paix, Nice, France',
    phone: '+33 4 93 87 01 23',
    email: 'contact@maisonchazarin.fr',
    website: 'https://maisonchazarin.fr',
    latitude: 43.7102,
    longitude: 7.2620,
    comments: 'Traditional French bakery with excellent croissants',
    position: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { properties: 5 }
  },
  {
    id: '2',
    name: 'Pharmacie du Cours Mirabeau',
    type: 'PHARMACY',
    address: '45 Cours Mirabeau, Aix-en-Provence, France',
    phone: '+33 4 42 26 17 85',
    email: 'info@pharmacie-mirabeau.fr',
    website: null,
    latitude: 43.5263,
    longitude: 5.4454,
    comments: 'Full-service pharmacy with multilingual staff',
    position: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    _count: { properties: 3 }
  },
  {
    id: '3',
    name: 'Restaurant La Bartavelle',
    type: 'RESTAURANTS',
    address: '25 Rue du Refuge, Marseille, France',
    phone: '+33 4 91 33 50 64',
    email: 'reservation@bartavelle.com',
    website: 'https://bartavelle-marseille.com',
    latitude: 43.2965,
    longitude: 5.3698,
    comments: 'Award-winning Mediterranean cuisine',
    position: 2,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    _count: { properties: 8 }
  }
]

export async function getActivityProviders(params?: {
  page?: number
  pageSize?: number
  search?: string
  type?: string
}) {
  try {
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate database delay
    
    let filteredProviders = [...mockProviders]
    
    // Apply search filter
    if (params?.search) {
      const searchTerm = params.search.toLowerCase()
      filteredProviders = filteredProviders.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.address.toLowerCase().includes(searchTerm)
      )
    }
    
    // Apply type filter
    if (params?.type && params.type !== 'ALL') {
      filteredProviders = filteredProviders.filter(provider => provider.type === params.type)
    }
    
    // Apply pagination
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const skip = (page - 1) * pageSize
    const paginatedProviders = filteredProviders.slice(skip, skip + pageSize)
    
    return {
      success: true,
      data: paginatedProviders,
      totalCount: filteredProviders.length,
      pageCount: Math.ceil(filteredProviders.length / pageSize)
    }
  } catch (error) {
    console.error('Error fetching activity providers:', error)
    return {
      success: false,
      error: 'Failed to fetch activity providers'
    }
  }
}

export async function getActivityProvider(id: string) {
  try {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const provider = mockProviders.find(p => p.id === id)
    
    if (!provider) {
      return { success: false, error: 'Activity provider not found' }
    }

    return { 
      success: true, 
      data: {
        ...provider,
        properties: [] // Mock empty properties for now
      }
    }
  } catch (error) {
    console.error('Error fetching activity provider:', error)
    return { success: false, error: 'Failed to fetch activity provider' }
  }
}

export async function createActivityProvider(data: {
  name: string
  type: string
  address: string
  phone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  comments?: string
}) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newProvider = {
      id: String(mockProviders.length + 1),
      name: data.name,
      type: data.type,
      address: data.address,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      comments: data.comments || null,
      position: mockProviders.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { properties: 0 }
    }
    
    mockProviders.push(newProvider as any)
    
    return { success: true, data: newProvider }
  } catch (error) {
    console.error('Error creating activity provider:', error)
    return { success: false, error: 'Failed to create activity provider' }
  }
}

export async function updateActivityProvider(id: string, data: {
  name?: string
  type?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  comments?: string
}) {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const providerIndex = mockProviders.findIndex(p => p.id === id)
    
    if (providerIndex === -1) {
      return { success: false, error: 'Activity provider not found' }
    }
    
    mockProviders[providerIndex] = {
      ...mockProviders[providerIndex],
      ...data,
      updatedAt: new Date()
    } as any
    
    return { success: true, data: mockProviders[providerIndex] }
  } catch (error) {
    console.error('Error updating activity provider:', error)
    return { success: false, error: 'Failed to update activity provider' }
  }
}

export async function deleteActivityProvider(id: string) {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const providerIndex = mockProviders.findIndex(p => p.id === id)
    
    if (providerIndex === -1) {
      return { success: false, error: 'Activity provider not found' }
    }
    
    mockProviders.splice(providerIndex, 1)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting activity provider:', error)
    return { success: false, error: 'Failed to delete activity provider' }
  }
}

export async function linkProviderToProperty(data: {
  providerId: string
  propertyId: string
  distance?: number
  travelTime?: string
  notes?: string
}) {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Mock implementation - in real app this would create a link in PropertyActivityProvider table
    console.log('Mock: Linking provider', data.providerId, 'to property', data.propertyId)
    
    return { success: true, data: { id: 'mock-link-id', ...data } }
  } catch (error) {
    console.error('Error linking provider to property:', error)
    return { success: false, error: 'Failed to link provider to property' }
  }
}

export async function unlinkProviderFromProperty(providerId: string, propertyId: string) {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Mock implementation
    console.log('Mock: Unlinking provider', providerId, 'from property', propertyId)
    
    return { success: true }
  } catch (error) {
    console.error('Error unlinking provider from property:', error)
    return { success: false, error: 'Failed to unlink provider from property' }
  }
}