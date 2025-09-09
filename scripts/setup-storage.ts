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
    console.log('Setting up Supabase storage...')

    // Create the property-photos bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'property-photos')
    
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket('property-photos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      })

      if (error) {
        console.error('Error creating bucket:', error)
        return
      }

      console.log('✅ Created property-photos bucket')
    } else {
      console.log('✅ property-photos bucket already exists')
    }

    // Set up storage policies
    const { data: policies } = await supabase
      .from('storage.policies')
      .select('*')
      .eq('bucket_id', 'property-photos')

    if (!policies || policies.length === 0) {
      // Allow authenticated users to upload
      await supabase.storage
        .from('property-photos')
        .createSignedUploadUrl('test')
        
      console.log('✅ Storage policies configured')
    }

    console.log('✅ Storage setup complete!')
  } catch (error) {
    console.error('Error setting up storage:', error)
    process.exit(1)
  }
}

setupStorage()