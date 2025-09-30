"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { UserButton } from "@clerk/nextjs"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-background px-4 py-2 rounded-md shadow-lg">
        Skip to main content
      </a>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main id="main-content" className="flex-1 flex flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4 sticky top-0 z-40 bg-white">
            <SidebarTrigger />
            <UserButton 
              appearance={{
                baseTheme: undefined,
                variables: {
                  colorPrimary: "#B5985A",
                  colorText: "#0A0A0A",
                  colorTextSecondary: "#6B7280",
                  colorBackground: "#FFFFFF",
                  colorInputBackground: "#FAFAF8",
                  colorInputText: "#0A0A0A",
                  borderRadius: "0.5rem",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                },
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonTrigger: "focus:ring-2 focus:ring-[#B5985A] focus:ring-offset-2 transition-all duration-200",
                  userButtonPopoverCard: "shadow-xl border-gray-200",
                  userButtonPopoverActions: "space-y-1",
                  userButtonPopoverActionButton: "hover:bg-gray-50 transition-colors",
                  userButtonPopoverActionButtonText: "text-gray-700",
                  userButtonPopoverActionButtonIcon: "text-gray-500",
                  userButtonPopoverFooter: "border-t border-gray-200",
                  userButtonPopoverMain: "space-y-4",
                }
              }}
              afterSignOutUrl="/sign-in"
              userProfileMode="navigation"
              userProfileUrl="/profile"
            />
          </div>
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}