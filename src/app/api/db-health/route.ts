import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/db-health
 * Simple database health check
 */
export async function GET() {
  try {
    // Test basic connection with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}