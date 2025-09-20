#!/usr/bin/env bun

import { prisma } from "../src/lib/db"

async function fixMainPhotos() {
  console.log("Starting main photo fix...")
  
  try {
    // Find all properties that have photos
    const propertiesWithPhotos = await prisma.property.findMany({
      where: {
        photos: {
          some: {} // Has at least one photo
        }
      },
      include: {
        photos: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    })
    
    console.log(`Found ${propertiesWithPhotos.length} properties with photos`)
    
    let fixedCount = 0
    
    for (const property of propertiesWithPhotos) {
      // Check if property has a main photo
      const hasMainPhoto = property.photos.some(photo => photo.isMain)
      
      if (!hasMainPhoto && property.photos.length > 0) {
        // No main photo exists, set the first photo (by position) as main
        const firstPhoto = property.photos[0]
        
        await prisma.photo.update({
          where: { id: firstPhoto.id },
          data: { isMain: true }
        })
        
        console.log(`Fixed property "${property.name}" (${property.id}) - set photo ${firstPhoto.id} as main`)
        fixedCount++
      }
    }
    
    console.log(`\nFixed ${fixedCount} properties without main photos`)
    console.log("Main photo fix completed!")
    
  } catch (error) {
    console.error("Error fixing main photos:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixMainPhotos()