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
  
  // Equipment request permissions
  EQUIPMENT_REQUEST_VIEW = 'equipment_request:view',
  EQUIPMENT_REQUEST_VIEW_INTERNAL = 'equipment_request:view_internal',
  EQUIPMENT_REQUEST_CREATE = 'equipment_request:create',
  EQUIPMENT_REQUEST_EDIT = 'equipment_request:edit',
  EQUIPMENT_REQUEST_EDIT_INTERNAL = 'equipment_request:edit_internal',
  EQUIPMENT_REQUEST_APPROVE = 'equipment_request:approve',
  EQUIPMENT_REQUEST_DELETE = 'equipment_request:delete',
  
  // Legal document permissions
  LEGAL_DOCUMENT_VIEW = 'legal_document:view',
  LEGAL_DOCUMENT_CREATE = 'legal_document:create',
  LEGAL_DOCUMENT_EDIT = 'legal_document:edit',
  LEGAL_DOCUMENT_DELETE = 'legal_document:delete',
  
  // Activity provider permissions
  ACTIVITY_PROVIDER_VIEW = 'activity_provider:view',
  ACTIVITY_PROVIDER_EDIT = 'activity_provider:edit',
  ACTIVITY_PROVIDER_DELETE = 'activity_provider:delete',
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
    Permission.EQUIPMENT_REQUEST_VIEW,
    Permission.EQUIPMENT_REQUEST_VIEW_INTERNAL,
    Permission.EQUIPMENT_REQUEST_CREATE,
    Permission.EQUIPMENT_REQUEST_EDIT,
    Permission.EQUIPMENT_REQUEST_EDIT_INTERNAL,
    Permission.EQUIPMENT_REQUEST_APPROVE,
    Permission.EQUIPMENT_REQUEST_DELETE,
    Permission.LEGAL_DOCUMENT_VIEW,
    Permission.LEGAL_DOCUMENT_CREATE,
    Permission.LEGAL_DOCUMENT_EDIT,
    Permission.LEGAL_DOCUMENT_DELETE,
    Permission.ACTIVITY_PROVIDER_VIEW,
    Permission.ACTIVITY_PROVIDER_EDIT,
    Permission.ACTIVITY_PROVIDER_DELETE,
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
    Permission.EQUIPMENT_REQUEST_VIEW,
    Permission.EQUIPMENT_REQUEST_VIEW_INTERNAL,
    Permission.EQUIPMENT_REQUEST_CREATE,
    Permission.EQUIPMENT_REQUEST_EDIT,
    Permission.EQUIPMENT_REQUEST_EDIT_INTERNAL,
    Permission.EQUIPMENT_REQUEST_APPROVE,
    Permission.LEGAL_DOCUMENT_VIEW,
    Permission.LEGAL_DOCUMENT_CREATE,
    Permission.LEGAL_DOCUMENT_EDIT,
    Permission.LEGAL_DOCUMENT_DELETE,
    Permission.ACTIVITY_PROVIDER_VIEW,
    Permission.ACTIVITY_PROVIDER_EDIT,
    Permission.ACTIVITY_PROVIDER_DELETE,
  ],
  [UserRole.STAFF]: [
    Permission.PROPERTY_VIEW,
    Permission.PROPERTY_EDIT,
    Permission.EQUIPMENT_REQUEST_VIEW,
    Permission.EQUIPMENT_REQUEST_CREATE,
    Permission.LEGAL_DOCUMENT_VIEW,
    Permission.ACTIVITY_PROVIDER_VIEW,
  ],
  [UserRole.VIEWER]: [
    Permission.PROPERTY_VIEW,
    Permission.EQUIPMENT_REQUEST_VIEW,
    Permission.LEGAL_DOCUMENT_VIEW,
    Permission.ACTIVITY_PROVIDER_VIEW,
  ],
};

export interface UserWithRole {
  id: string;
  role: UserRole;
  permissions?: Permission[];
}