"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconPlus,
  IconRoute,
  IconCreditCard,
  IconTicket,
  IconSpeakerphone,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const roleBasedNavigation = {
  ADMIN: {
    navMain: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Applications",
        url: "/admin/dashboard/applications",
        icon: IconFileDescription,
      },
      {
        title: "Users",
        url: "/admin/dashboard/users",
        icon: IconUsers,
      },
      {
        title: "Routes & Pickup Points",
        url: "/admin/dashboard/routes",
        icon: IconRoute,
      },
      {
        title: "Payments",
        url: "/admin/dashboard/payments",
        icon: IconCreditCard,
      },
      {
        title: "Active Passes",
        url: "/admin/dashboard/passes",
        icon: IconTicket,
      },
      {
        title: "Notices",
        url: "/admin/dashboard/notices",
        icon: IconSpeakerphone,
      },
      {
        title: "Reports",
        url: "/admin/dashboard/reports",
        icon: IconReport,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: IconDatabase,
      },
    ],
  },
  SUPERVISOR: {
    navMain: [
      {
        title: "Dashboard",
        url: "/supervisor/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Scan",
        url: "#",
        icon: IconCamera,
      },
      {
        title: "Reports",
        url: "#",
        icon: IconReport,
      },
    ],
    documents: [
      {
        name: "Instructions",
        url: "#",
        icon: IconFileDescription,
      },
    ],
  },
  USER: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Analytics",
        url: "#",
        icon: IconChartBar,
      },
      {
        title: "Projects",
        url: "#",
        icon: IconFolder,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: IconDatabase,
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: IconFileWord,
      },
    ],
  },
}

const navSecondary = [
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
  const role = (user?.role || "USER") as keyof typeof roleBasedNavigation
  const navigation = roleBasedNavigation[role]
  
  const dashboardUrl = role === "ADMIN" 
    ? "/admin/dashboard" 
    : role === "SUPERVISOR" 
    ? "/supervisor/dashboard" 
    : "/dashboard"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-12 hover:bg-transparent active:bg-transparent px-2"
            >
              <a href={dashboardUrl} className="flex items-center gap-2">
                <Logo className="h-8 w-auto" />
                <span className="text-sm font-bold leading-tight tracking-tight uppercase">Scholars Transit</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation.navMain} />
        <NavDocuments items={navigation.documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
