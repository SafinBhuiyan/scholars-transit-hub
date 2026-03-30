"use client"

import * as React from "react"
import {
  IconCamera,
  IconCopy,
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
import { toast } from "sonner"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
        title: "Verify Pass",
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
      {
        title: "Complaint / Feedback",
        url: "/dashboard/complaint-feedback",
        icon: IconReport,
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
  const emergencyPhone = "01776555580"
  
  const dashboardUrl = role === "ADMIN" ? "/admin/dashboard" : "/dashboard"

  const navSecondary = [
    {
      title: "System Settings",
      url: role === "ADMIN" ? "/admin/dashboard/settings" : "#",
      icon: IconSettings,
    },
    {
      title: "Get Help from Builder",
      url: "https://safinbhuiyan.framer.website/",
      icon: IconHelp,
    },
  ]

  const handleCopyEmergencyPhone = async () => {
    try {
      await navigator.clipboard.writeText(emergencyPhone)
      toast.success("Emergency contact copied")
    } catch {
      toast.error("Couldn't copy the emergency number")
    }
  }

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
        {role === "USER" && (
          <div className="mt-auto px-3 pb-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Badge variant="outline" className="border-primary/20 bg-primary/8 text-primary">
                    Emergency Contact
                  </Badge>
                  <p className="text-sm font-semibold">Mr. Zahidul Arif</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Officer, Brands &amp; Communication Department (Level: 03)
                  </p>
                </div>

                <div className="rounded-lg border bg-background/70 px-2.5 py-2">
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="min-w-0 text-sm font-medium">{emergencyPhone}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-background"
                      onClick={handleCopyEmergencyPhone}
                      aria-label="Copy emergency contact number"
                    >
                      <IconCopy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-border/70 px-3 py-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
