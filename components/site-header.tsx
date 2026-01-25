import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4 my-auto" />
        <h1 className="text-sm font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
