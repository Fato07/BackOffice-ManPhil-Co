import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
 * Check if the current user has a specific role
 * @param role - The role to check for
 * @returns True if the user has the role, false otherwise
 */
export async function hasRole(role: string): Promise<boolean> {
  try {
    const user = await currentUser();
    
    if (!user) return false;
    
    // Check if user has the role in their public metadata
    const userRole = user.publicMetadata?.role as string | undefined;
    return userRole === role;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
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