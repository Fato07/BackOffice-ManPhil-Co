"use client"

import { useUser } from '@clerk/nextjs';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/auth';

export function usePermissions() {
  const { user } = useUser();
  const userRole = (user?.publicMetadata?.role as UserRole) || UserRole.VIEWER;
  
  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };
  
  const hasPermission = (permission: Permission | string): boolean => {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions.includes(permission as Permission);
  };
  
  const canViewSection = (section: string): boolean => {
    const sectionPermissions: Record<string, Permission> = {
      'internal': Permission.INTERNAL_VIEW,
      'financial': Permission.FINANCIAL_VIEW,
      'owner': Permission.OWNER_VIEW,
      'contacts': Permission.CONTACTS_VIEW,
      'vendor': Permission.VENDOR_VIEW,
    };
    
    const permission = sectionPermissions[section];
    if (!permission) return true; // If no specific permission needed, allow access
    
    return hasPermission(permission);
  };
  
  const canEditSection = (section: string): boolean => {
    const sectionPermissions: Record<string, Permission> = {
      'internal': Permission.INTERNAL_EDIT,
      'financial': Permission.FINANCIAL_EDIT,
      'owner': Permission.OWNER_EDIT,
      'contacts': Permission.CONTACTS_EDIT,
      'vendor': Permission.VENDOR_EDIT,
    };
    
    const permission = sectionPermissions[section];
    if (!permission) return hasPermission(Permission.PROPERTY_EDIT);
    
    return hasPermission(permission);
  };
  
  const getUserPermissions = (): Permission[] => {
    return ROLE_PERMISSIONS[userRole];
  };
  
  return {
    userRole,
    hasRole,
    hasPermission,
    canViewSection,
    canEditSection,
    getUserPermissions,
    isAdmin: userRole === UserRole.ADMIN,
    isManager: userRole === UserRole.MANAGER,
    isStaff: userRole === UserRole.STAFF,
    isViewer: userRole === UserRole.VIEWER,
  };
}