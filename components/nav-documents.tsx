"use client"

import {
  type Icon,
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function isSidebarItemActive(pathname: string, url: string) {
  if (pathname === url) return true
  if (url === "/dashboard" || url === "/admin/dashboard") return false
  return pathname.startsWith(`${url}/`)
}

export function NavDocuments({
  items,
  label = "Resources",
}: {
  items: {
    name: string
    url: string
    icon: Icon
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              isActive={isSidebarItemActive(pathname, item.url)}
              asChild
            >
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
