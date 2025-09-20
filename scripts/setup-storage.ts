import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage buckets...')

    // Define buckets configuration
    const bucketsConfig = [
      {
        name: 'property-photos',
        config: {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        }
      },
      {
        name: 'legal-documents',
        config: {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
          ]
        }
      },
      {
        name: 'resources',
        config: {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
          ]
        }
      }
    ]

    // Get existing buckets
    const { data: existingBuckets } = await supabase.storage.listBuckets()
    
    // Create each bucket if it doesn't exist
    for (const bucket of bucketsConfig) {
      const bucketExists = existingBuckets?.some(b => b.name === bucket.name)
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucket.name, bucket.config)

        if (error) {
          console.error(`Error creating ${bucket.name} bucket:`, error)
          continue
        }

        console.log(`✅ Created ${bucket.name} bucket`)
      } else {
        console.log(`✅ ${bucket.name} bucket already exists`)
      }
    }

    console.log('✅ Storage setup complete!')
  } catch (error) {
    console.error('Error setting up storage:', error)
    process.exit(1)
  }
}

setupStorage()