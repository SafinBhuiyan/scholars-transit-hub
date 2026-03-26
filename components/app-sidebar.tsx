"use client"

import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconHelp,
  IconPlus,
  IconReport,
  IconRoute,
  IconSearch,
  IconSettings,
  IconTicket,
  IconCreditCard,
  IconSpeakerphone,
  IconFiles,
  IconUsers,
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
        title: "Payments",
        url: "/admin/dashboard/payments",
        icon: IconCreditCard,
      },
      {
        title: "Scan Pass",
        url: "/admin/dashboard/passes",
        icon: IconCamera,
      },
    ],
    transportManagement: [
      {
        name: "Routes & Pickup Points",
        url: "/admin/dashboard/routes",
        icon: IconRoute,
      },
      {
        name: "Complaint / Feedback",
        url: "/admin/dashboard/complaint-feedback",
        icon: IconReport,
      },
    ],
    documents: [
      {
        name: "Files & Docs",
        url: "/admin/dashboard/files-docs",
        icon: IconFiles,
      },
      {
        name: "ID Cards",
        url: "/admin/dashboard/id-cards",
        icon: IconDatabase,
      },
      {
        name: "Users",
        url: "/admin/dashboard/users",
        icon: IconUsers,
      },
      {
        name: "Notices",
        url: "/admin/dashboard/notices",
        icon: IconSpeakerphone,
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
        title: "Apply for Transport",
        url: "/dashboard/apply",
        icon: IconPlus,
      },
      {
        title: "My Transport Pass",
        url: "/dashboard/pass",
        icon: IconTicket,
      },
      {
        title: "Payments",
        url: "/dashboard/payments",
        icon: IconCreditCard,
      },
      {
        title: "Notices",
        url: "/dashboard/notices",
        icon: IconSpeakerphone,
      },
    ],
    transportManagement: [],
    documents: [],
  },
}

type SidebarUser = React.ComponentProps<typeof NavUser>["user"]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  const role = user?.role === "ADMIN" ? "ADMIN" : "USER"
  const navigation = roleBasedNavigation[role]
  
  const dashboardUrl = role === "ADMIN" ? "/admin/dashboard" : "/dashboard"

  const navSecondary = [
    {
      title: "Settings",
      url: role === "ADMIN" ? "/admin/dashboard/settings" : "#",
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
        {role === "ADMIN" && (
          <>
            <NavDocuments items={navigation.transportManagement} label="Transport" />
            <NavDocuments items={navigation.documents} />
            <NavSecondary items={navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
