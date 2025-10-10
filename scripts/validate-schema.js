#!/usr/bin/env node

/**
 * Schema Validation Script
 * 
 * This script compares the Prisma schema with the actual database schema
 * to detect schema drift and prevent production issues.
 * 
 * Usage:
 *   bun run validate-schema
 *   bun run validate-schema --env production
 *   bun run validate-schema --env staging
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const TEMP_DIR = 'tmp'
const SCHEMA_DIFF_FILE = `${TEMP_DIR}/schema_diff.sql`

// Parse command line arguments
const args = process.argv.slice(2)
const envFlag = args.find(arg => arg.startsWith('--env='))
const environment = envFlag ? envFlag.split('=')[1] : 'development'

console.log(`🔍 Validating schema for environment: ${environment}`)

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR)
}

try {
  // Generate schema diff using Prisma
  console.log('📊 Generating schema diff...')
  
  const command = `bunx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script`
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // Write result to file for analysis
    fs.writeFileSync(SCHEMA_DIFF_FILE, result)
    
    // Analyze the diff - check for empty migration or no changes
    const cleanResult = result.replace(/\[dotenv[^\]]*\][^\n]*\n/g, '').trim()
    const isEmptyMigration = cleanResult.includes('-- This is an empty migration.') || cleanResult === ''
    
    if (isEmptyMigration) {
      console.log('✅ Schema validation passed: No differences found')
      console.log('   Database schema matches Prisma schema perfectly')
    } else {
      console.log('⚠️  Schema drift detected!')
      console.log('   Differences found between Prisma schema and database')
      console.log(`   See ${SCHEMA_DIFF_FILE} for details`)
      
      // Show first few lines of diff (skip dotenv messages)
      const lines = cleanResult.split('\n').slice(0, 10)
      console.log('\nFirst few changes detected:')
      lines.forEach(line => {
        if (line.trim() && !line.includes('-- This is an empty migration.')) {
          console.log(`   ${line}`)
        }
      })
      
      if (cleanResult.split('\n').length > 10) {
        console.log(`   ... and ${cleanResult.split('\n').length - 10} more changes`)
      }
      
      console.log('\n🔧 Recommended actions:')
      console.log('   1. Review the schema diff file')
      console.log('   2. Create a Supabase migration if changes are needed')
      console.log('   3. Never run prisma migrate dev for this project')
      console.log('   4. Use: npx supabase migration new migration_name')
      
      process.exit(1)
    }
  } catch (error) {
    // Check if it's the "no differences" case
    if (error.stderr && error.stderr.includes('no differences')) {
      console.log('✅ Schema validation passed: No differences found')
      console.log('   Database schema matches Prisma schema perfectly')
    } else {
      throw error
    }
  }
  
} catch (error) {
  console.error('❌ Schema validation failed:')
  
  if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
    console.error('   Database connection failed')
    console.error('   Make sure your database is running and DATABASE_URL is correct')
  } else if (error.message.includes('does not exist')) {
    console.error('   Database or table does not exist')
    console.error('   Run migrations first: npx supabase db push')
  } else {
    console.error(`   ${error.message}`)
  }
  
  console.error('\n🔧 Troubleshooting:')
  console.error('   1. Check your DATABASE_URL environment variable')
  console.error('   2. Ensure database is running and accessible')
  console.error('   3. Verify migrations have been applied')
  console.error('   4. Check docs/GITHUB-INTEGRATION.md for migration workflow')
  
  process.exit(1)
}

console.log('\n📝 Schema validation complete')
console.log('   For regular validation, consider adding this to your CI/CD pipeline')
console.log('   Example: bun run validate-schema --env production')