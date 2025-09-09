export enum UserRole {
  ADMIN = 'admin',        // Full access including financial & owner data
  MANAGER = 'manager',    // Property management, contacts, no financial
  STAFF = 'staff',        // Basic property operations only  
  VIEWER = 'viewer'       // Read-only access to public info
}

export enum Permission {
  // Property permissions
  PROPERTY_VIEW = 'property:view',
  PROPERTY_EDIT = 'property:edit',
  PROPERTY_DELETE = 'property:delete',
  
  // Internal section permissions
  INTERNAL_VIEW = 'internal:view',
  INTERNAL_EDIT = 'internal:edit',
  
  // Financial permissions
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_EDIT = 'financial:edit',
  
  // Contact permissions
  CONTACTS_VIEW = 'contacts:view',
  CONTACTS_EDIT = 'contacts:edit',
  
  // Owner permissions
  OWNER_VIEW = 'owner:view',
  OWNER_EDIT = 'owner:edit',
  
  // Vendor permissions
  VENDOR_VIEW = 'vendor:view',
  VENDOR_EDIT = 'vendor:edit',
}

export interface RolePermissionMap {
  [UserRole.ADMIN]: Permission[];
  [UserRole.MANAGER]: Permission[];
  [UserRole.STAFF]: Permission[];
  [UserRole.VIEWER]: Permission[];
}

export const ROLE_PERMISSIONS: RolePermissionMap = {
  [UserRole.ADMIN]: [
    Permission.PROPERTY_VIEW,
    Permission.PROPERTY_EDIT,
    Permission.PROPERTY_DELETE,
    Permission.INTERNAL_VIEW,
    Permission.INTERNAL_EDIT,
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_EDIT,
    Permission.CONTACTS_VIEW,
    Permission.CONTACTS_EDIT,
    Permission.OWNER_VIEW,
    Permission.OWNER_EDIT,
    Permission.VENDOR_VIEW,
    Permission.VENDOR_EDIT,
  ],
  [UserRole.MANAGER]: [
    Permission.PROPERTY_VIEW,
    Permission.PROPERTY_EDIT,
    Permission.INTERNAL_VIEW,
    Permission.INTERNAL_EDIT,
    Permission.CONTACTS_VIEW,
    Permission.CONTACTS_EDIT,
    Permission.VENDOR_VIEW,
    Permission.VENDOR_EDIT,
  ],
  [UserRole.STAFF]: [
    Permission.PROPERTY_VIEW,
    Permission.PROPERTY_EDIT,
  ],
  [UserRole.VIEWER]: [
    Permission.PROPERTY_VIEW,
  ],
};

export interface UserWithRole {
  id: string;
  role: UserRole;
  permissions?: Permission[];
}