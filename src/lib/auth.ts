import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserRole, Permission, ROLE_PERMISSIONS } from "@/types/auth";

/**
 * Get the current authenticated user
 * @returns The current user object or null
 */
export async function getCurrentUser() {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get the current user ID
 * @returns The current user ID or null
 */
export async function getCurrentUserId() {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

/**
 * Require authentication for a page or API route
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return userId;
}

/**
 * Get the current user's role
 * @returns The user's role or null
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const user = await currentUser();
    if (!user) return null;
    
    const role = user.publicMetadata?.role as UserRole | undefined;
    return role || UserRole.VIEWER; // Default to VIEWER if no role set
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 * @param role - The role to check for
 * @returns True if the user has the role, false otherwise
 */
export async function hasRole(role: string | UserRole): Promise<boolean> {
  try {
    const userRole = await getUserRole();
    return userRole === role;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check
 * @returns True if the user has the permission, false otherwise
 */
export async function hasPermission(permission: Permission | string): Promise<boolean> {
  try {
    const role = await getUserRole();
    if (!role) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions.includes(permission as Permission);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Require a specific permission for an operation
 * @param permission - The permission required
 * @throws Error if the user doesn't have the permission
 */
export async function requirePermission(permission: Permission | string) {
  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    throw new Error('Insufficient permissions');
  }
  return true;
}

/**
 * Check if user can access a specific section
 * @param section - The section to check access for
 * @returns True if the user can access the section, false otherwise
 */
export async function canAccessSection(section: string): Promise<boolean> {
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
}

/**
 * Get all permissions for the current user
 * @returns Array of permissions
 */
export async function getUserPermissions(): Promise<Permission[]> {
  try {
    const role = await getUserRole();
    if (!role) return [];
    
    return ROLE_PERMISSIONS[role];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Get user's email address
 * @returns The user's primary email address or null
 */
export async function getUserEmail() {
  try {
    const user = await currentUser();
    return user?.emailAddresses[0]?.emailAddress || null;
  } catch (error) {
    console.error("Error getting user email:", error);
    return null;
  }
}

/**
 * Get user's full name
 * @returns The user's full name or null
 */
export async function getUserFullName() {
  try {
    const user = await currentUser();
    if (!user) return null;
    
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    
    return `${firstName} ${lastName}`.trim() || user.username || "User";
  } catch (error) {
    console.error("Error getting user full name:", error);
    return null;
  }
}