"use client"

import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { UserRole, Permission } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ProtectedSectionProps {
  permission?: Permission | string;
  roles?: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
  section?: string;
}

export function ProtectedSection({ 
  permission, 
  roles, 
  children, 
  fallback = null,
  showUnauthorized = false,
  section
}: ProtectedSectionProps) {
  const { hasPermission, userRole, canViewSection } = usePermissions();
  
  let hasAccess = false;
  
  if (section) {
    hasAccess = canViewSection(section);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (roles) {
    hasAccess = roles.includes(userRole);
  }
  
  if (!hasAccess) {
    if (showUnauthorized) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have permission to view this content. This section is restricted to authorized personnel only.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}