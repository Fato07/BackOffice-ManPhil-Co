import { NextRequest, NextResponse } from "next/server"
import { unlinkProviderFromProperty } from "@/actions/activity-providers"

interface RouteParams {
  params: Promise<{ id: string; propertyId: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, propertyId } = await params
    
    const result = await unlinkProviderFromProperty(id, propertyId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to unlink provider from property" },
      { status: 500 }
    )
  }
}