import { NextRequest, NextResponse } from "next/server"
import { getActivityProviders, createActivityProvider } from "@/actions/activity-providers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined

    const result = await getActivityProviders({
      page,
      pageSize,
      search,
      type
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: result.data,
      totalCount: result.totalCount,
      pageCount: result.pageCount
    })
  } catch (error) {
    console.error("Error in GET /api/activity-providers:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity providers" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await createActivityProvider(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/activity-providers:", error)
    return NextResponse.json(
      { error: "Failed to create activity provider" },
      { status: 500 }
    )
  }
}