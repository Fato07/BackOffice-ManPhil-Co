import { NextRequest, NextResponse } from "next/server"
import { 
  getActivityProvider, 
  updateActivityProvider, 
  deleteActivityProvider 
} from "@/actions/activity-providers"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const result = await getActivityProvider(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Activity provider not found' ? 404 : 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to fetch activity provider" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const result = await updateActivityProvider(id, body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Activity provider not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to update activity provider" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const result = await deleteActivityProvider(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Activity provider not found' ? 404 : 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to delete activity provider" },
      { status: 500 }
    )
  }
}