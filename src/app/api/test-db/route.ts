import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * GET /api/test-db
 * Test database connection and fetch basic stats
 */
export async function GET() {
  try {
    // Test the connection by running a simple query
    const [destinationCount, propertyCount] = await Promise.all([
      prisma.destination.count(),
      prisma.property.count(),
    ]);

    // Get some sample data
    const destinations = await prisma.destination.findMany({
      take: 5,
      include: {
        _count: {
          select: { properties: true }
        }
      }
    });

    const properties = await prisma.property.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        destination: {
          select: {
            name: true,
            country: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      stats: {
        destinations: destinationCount,
        properties: propertyCount,
      },
      sampleData: {
        destinations,
        properties
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to connect to database",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}