"use client"

import {
  Home,
  MapPin,
  Building2,
  Users,
  DollarSign,
  FileText,
  Scale,
  Activity,
  User,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"

const menuGroups = [
  {
    label: "Property Management",
    items: [
      {
        title: "Houses",
        icon: Home,
        href: "/houses",
        description: "Manage all properties",
      },
      {
        title: "Destinations",
        icon: MapPin,
        href: "/destinations",
        description: "Location management",
      },
      {
        title: "Places",
        icon: Building2,
        href: "/places",
        description: "Nearby attractions",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Contacts",
        icon: Users,
        href: "/contacts",
        description: "Owners & agencies",
      },
      {
        title: "Equipment Requests",
        icon: FileText,
        href: "/equipment-requests",
        description: "Maintenance requests",
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        title: "Finance",
        icon: DollarSign,
        href: "/finance",
        description: "Financial overview",
      },
      {
        title: "Legal Documents",
        icon: Scale,
        href: "/legals",
        description: "Contracts & documents",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Audit Trail",
        icon: Activity,
        href: "/audit-logs",
        description: "System activity logs",
      },
    ],
  },
]

const profileItems = [
  {
    title: "Profile",
    icon: User,
    href: "/profile",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar aria-label="Main navigation">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center justify-center">
          <Link 
            href="/" 
            className={cn("block transition-all duration-300")}
            aria-label="ManPhil&Co Home"
          >
            <Image
              src="/Logo Manphil&Co.svg"
              alt="ManPhil&Co"
              width={isCollapsed ? 32 : 120}
              height={isCollapsed ? 32 : 50}
              className="h-auto transition-all duration-300"
              priority
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60 mb-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "group relative transition-all duration-200 hover:bg-sidebar-accent/50",
                                isActive && 
                                  "bg-[#B5985A]/10 text-[#B5985A] hover:bg-[#B5985A]/20 font-semibold"
                              )}
                            >
                              <Link href={item.href}>
                                <div className="relative flex items-center">
                                  {isActive && (
                                    <div className="absolute -left-3 top-0 h-full w-1 rounded-r-full bg-[#B5985A] transition-all duration-300" />
                                  )}
                                  <item.icon className={cn(
                                    "h-4 w-4 transition-all duration-200 shrink-0",
                                    isActive && "text-[#B5985A]"
                                  )} />
                                </div>
                                {!isCollapsed && (
                                  <span className="ml-3">{item.title}</span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" align="center">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {groupIndex < menuGroups.length - 1 && <SidebarSeparator className="my-2" />}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50">
        <SidebarGroup>
          {!isCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-border">
                <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                <AvatarFallback className="bg-[#B5985A]/10 text-[#B5985A] font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center py-2 mb-2">
              {user && (
                <Avatar className="h-8 w-8 mb-2 ring-2 ring-sidebar-border">
                  <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                  <AvatarFallback className="bg-[#B5985A]/10 text-[#B5985A] text-xs font-semibold">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {profileItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "transition-all duration-200 hover:bg-sidebar-accent/50",
                              isActive && "bg-[#B5985A]/10 text-[#B5985A]"
                            )}
                          >
                            <Link href={item.href}>
                              <item.icon className="h-4 w-4 shrink-0" />
                              {!isCollapsed && <span className="ml-3">{item.title}</span>}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}