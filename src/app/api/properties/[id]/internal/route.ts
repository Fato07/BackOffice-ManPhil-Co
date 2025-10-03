import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, getUserRole, getCurrentUserId } from '@/lib/auth';
import { Permission } from '@/types/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check permission to view internal data
    await requirePermission(Permission.INTERNAL_VIEW);
    
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        internalComment: true,
        warning: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Log access to sensitive data
    const userId = await getCurrentUserId();
    const userRole = await getUserRole();
    
    if (userId && userRole) {
      await prisma.sensitiveDataAccess.create({
        data: {
          userId,
          userRole,
          action: 'view',
          dataType: 'internal',
          propertyId: id,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Parse internal comment JSON if it exists
    let internalData = {};
    if (property.internalComment) {
      try {
        internalData = JSON.parse(property.internalComment);
      } catch (error) {
        
      }
    }

    return NextResponse.json({
      id: property.id,
      internalData,
      warning: property.warning,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check permission to edit internal data
    await requirePermission(Permission.INTERNAL_EDIT);
    
    const body = await req.json();
    const { internalData, warning } = body;

    // Update property
    const property = await prisma.property.update({
      where: { id },
      data: {
        internalComment: internalData ? JSON.stringify(internalData) : undefined,
        warning: warning,
      },
    });

    // Log access to sensitive data
    const userId = await getCurrentUserId();
    const userRole = await getUserRole();
    
    if (userId && userRole) {
      await prisma.sensitiveDataAccess.create({
        data: {
          userId,
          userRole,
          action: 'edit',
          dataType: 'internal',
          propertyId: id,
          metadata: {
            timestamp: new Date().toISOString(),
            changedFields: Object.keys(body),
          },
        },
      });
    }

    return NextResponse.json({ success: true, property });
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}