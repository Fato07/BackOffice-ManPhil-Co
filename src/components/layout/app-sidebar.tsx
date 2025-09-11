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
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

const menuItems = [
  {
    title: "Houses",
    icon: Home,
    href: "/houses",
  },
  {
    title: "Destinations",
    icon: MapPin,
    href: "/destinations",
  },
  {
    title: "Places",
    icon: Building2,
    href: "/places",
  },
  {
    title: "Contacts",
    icon: Users,
    href: "/contacts",
  },
  {
    title: "Finance",
    icon: DollarSign,
    href: "/finance",
  },
  {
    title: "Requests",
    icon: FileText,
    href: "/requests",
  },
  {
    title: "Legals",
    icon: Scale,
    href: "/legals",
  },
  {
    title: "Audit Trail",
    icon: Activity,
    href: "/audit-logs",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-4 px-2">
            <Image 
              src="/Logo Manphil&Co.svg"
              alt="ManPhil&Co Logo"
              width={180}
              height={100}
              className="w-full h-auto"
              priority
            />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={isActive ? "bg-[#B5985A] text-white hover:bg-[#B5985A]/90" : ""}
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}