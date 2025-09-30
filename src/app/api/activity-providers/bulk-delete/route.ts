import { NextRequest } from 'next/server'
import { bulkDeleteActivityProviders } from '@/actions/activity-providers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await bulkDeleteActivityProviders(body)
    
    if (result.success) {
      return Response.json(result.data)
    } else {
      return Response.json({ error: result.error }, { status: 400 })
    }
  } catch {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}