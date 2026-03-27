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
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="h-16 shrink-0 justify-center gap-0 border-b px-3 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-16 px-1 hover:bg-transparent active:bg-transparent"
            >
              <a href={dashboardUrl} className="flex items-center">
                <Logo className="h-7 w-auto" />
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
      <SidebarFooter className="border-t border-border/70 px-3 py-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
