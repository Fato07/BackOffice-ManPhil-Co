"use client";

import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserButton } from "@clerk/nextjs";
import { User, Settings, LogOut, Mail, Calendar } from "lucide-react";

export function UserProfileDropdown() {
  const { user } = useUser();

  if (!user) return null;

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }) : 'Unknown';

  return (
    <div className="flex items-center gap-4">
      <div className="hidden md:block text-right">
        <p className="text-sm font-medium text-gray-900">
          {user.firstName || user.username || 'User'} {user.lastName || ''}
        </p>
        <p className="text-xs text-gray-500">{user.primaryEmailAddress?.emailAddress}</p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                }
              }}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.firstName || user.username || 'User'} {user.lastName || ''}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Member since {memberSince}</span>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => {
              // The UserButton handles sign out internally
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}