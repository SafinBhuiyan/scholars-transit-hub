"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"
import Link from "next/link"

import { NotificationBell } from "@/components/notices/notification-bell"

export function SiteHeader() {
  const pathname = usePathname()
  const allSegments = pathname.split('/').filter(Boolean)
  
  // Find where 'dashboard' starts to make it the root of our breadcrumb
  const dashboardIndex = allSegments.findIndex(s => s.toLowerCase() === "dashboard")
  const segments = dashboardIndex !== -1 ? allSegments.slice(dashboardIndex) : allSegments

  const segmentMap: Record<string, string> = {
    "routes": "Routes & Pickup Points",
    "apply": "Apply for Transport",
    "pass": "My Transport Pass",
    "payments": "Payments",
    "notices": "Notices",
    "profile": "Profile",
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4 my-auto" />
        
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              // Reconstruct the actual href from the original allSegments
              const actualIndex = dashboardIndex !== -1 ? dashboardIndex + index : index
              const href = `/${allSegments.slice(0, actualIndex + 1).join('/')}`
              
              const isLast = index === segments.length - 1
              const title = segmentMap[segment.toLowerCase()] || (segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))

              return (
                <React.Fragment key={href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
