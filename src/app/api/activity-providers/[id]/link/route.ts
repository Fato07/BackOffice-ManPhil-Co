import { NextRequest, NextResponse } from "next/server"
import { linkProviderToProperty } from "@/actions/activity-providers"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const result = await linkProviderToProperty(id, body.propertyId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to link provider to property" },
      { status: 500 }
    )
  }
}