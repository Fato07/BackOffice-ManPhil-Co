"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Home,
  Info,
  MapPin,
  FileText,
  Thermometer,
  Calendar,
  Wrench,
  AlertCircle,
  Shield,
  Megaphone,
  Camera,
  Link,
  DoorOpen,
  Search,
  Settings,
  LogOut,
} from "lucide-react"

interface CommandPaletteProps {
  propertyId: string
}

const navigationItems = [
  {
    group: "Navigation",
    items: [
      { id: "promote", label: "Promote", icon: Home, href: "promote" },
      { id: "info", label: "House Information", icon: Info, href: "info" },
      { id: "location", label: "Location", icon: MapPin, href: "location" },
      { id: "further-info", label: "Further Information", icon: FileText, href: "further-info" },
      { id: "heating", label: "Heating & AC", icon: Thermometer, href: "heating" },
      { id: "events", label: "Events", icon: Calendar, href: "events" },
      { id: "services", label: "Services", icon: Wrench, href: "services" },
      { id: "good-to-know", label: "Good to Know", icon: AlertCircle, href: "good-to-know" },
      { id: "internal", label: "Internal", icon: Shield, href: "internal" },
      { id: "marketing", label: "Automatic Offer", icon: Megaphone, href: "marketing" },
      { id: "photos", label: "Photos", icon: Camera, href: "photos" },
      { id: "links", label: "Links & Resources", icon: Link, href: "links" },
      { id: "rooms", label: "Rooms", icon: DoorOpen, href: "rooms" },
    ],
  },
  {
    group: "Actions",
    items: [
      { id: "search", label: "Search Properties", icon: Search, href: "/houses" },
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      { id: "logout", label: "Log Out", icon: LogOut, action: "logout" },
    ],
  },
]

export function CommandPalette({ propertyId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (item: any) => {
    setOpen(false)

    if (item.action === "logout") {
      // Handle logout
      console.log("Logout")
    } else if (item.href) {
      if (item.href.startsWith("/")) {
        router.push(item.href)
      } else {
        router.push(`/houses/${propertyId}/${item.href}`)
      }
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {navigationItems.map((group, index) => (
          <div key={group.group}>
            <CommandGroup heading={group.group}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {index < navigationItems.length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}