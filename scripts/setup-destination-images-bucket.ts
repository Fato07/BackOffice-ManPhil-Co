#!/usr/bin/env bun

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDestinationImagesBucket() {
  const bucketName = "destination-images"
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error("Error listing buckets:", listError)
      return
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (bucketExists) {
      console.log(`✓ Bucket "${bucketName}" already exists`)
    } else {
      // Create bucket
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      })
      
      if (error) {
        console.error("Error creating bucket:", error)
        return
      }
      
      console.log(`✓ Successfully created bucket "${bucketName}"`)
    }
    
    // Set up CORS policy to allow image access from your domain
    console.log("Bucket setup complete!")
    console.log("\nNote: You may need to configure CORS settings in your Supabase dashboard:")
    console.log("1. Go to Storage settings in Supabase dashboard")
    console.log("2. Select the 'destination-images' bucket")
    console.log("3. Configure CORS to allow your domain")
    
  } catch (error) {
    console.error("Unexpected error:", error)
  }
}

setupDestinationImagesBucket()