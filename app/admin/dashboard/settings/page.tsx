import { SemesterSettings } from "@/components/semester-settings"
import { FilesDocCategorySettings } from "@/components/files-doc-category-settings"

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Manage system configuration for admin workflows</p>
      </div>
      <div className="grid w-full min-w-0 gap-6 xl:grid-cols-2 xl:items-start">
        <div className="min-w-0">
          <SemesterSettings />
        </div>
        <div className="min-w-0">
          <FilesDocCategorySettings />
        </div>
      </div>
    </div>
  )
}
