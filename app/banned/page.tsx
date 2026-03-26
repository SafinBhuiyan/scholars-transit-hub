"use client"

import { useState } from "react"
import { IconCopy, IconLogout } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

export default function BannedPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const phoneNumber = "01776555580"

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopied(true)
      toast.success("Phone number copied")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy the phone number")
    }
  }

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
        },
      },
    })
  }

  return (
    <div className="flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col justify-center">
        <Card className="border-red-500/20 py-4 md:py-6">
          <CardHeader className="space-y-2 px-3 py-3 md:min-h-[520px] md:px-0 md:py-0">
            <div className="flex flex-col items-center justify-center gap-1 text-center md:min-h-[420px] md:gap-3">
              <Badge variant="outline" className="w-fit bg-red-500/10 text-red-700 border-red-500/25">
                Account Restricted
              </Badge>
              <CardTitle className="text-xl md:text-3xl">Access locked</CardTitle>
              <img
                src="/doodles/ban-notice.svg"
                alt="Ban notice illustration"
                className="h-40 w-auto max-w-full select-none object-contain md:h-[22rem]"
              />
              <CardDescription className="max-w-md text-sm md:text-base">
                This account is currently restricted by an administrator.
              </CardDescription>
              <Button
                variant="outline"
                className="w-fit border-red-500/25 bg-red-500/8 text-red-300 hover:bg-red-500/12 hover:text-red-200"
                onClick={handleLogout}
              >
                <IconLogout className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-3 pb-4 md:space-y-6 md:px-0 md:pb-0">
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <div className="overflow-hidden rounded-xl border">
                <div className="flex flex-col items-center justify-center p-3 text-center md:p-4">
                  <p className="text-sm font-medium text-muted-foreground">Appeal contact</p>
                  <p className="mt-2 text-base font-semibold md:text-lg">Mr. Zahidul Arif</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Officer, Brands &amp; Communication Department (Level: 03)
                  </p>
                  <div className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground/90">{phoneNumber}</span>
                      <span className="shrink-0 text-sm text-muted-foreground">(Mobile)</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="h-7 w-7 border-border bg-transparent text-muted-foreground hover:bg-background"
                      onClick={handleCopyPhone}
                      aria-label="Copy phone number"
                    >
                      <IconCopy className={`h-3.5 w-3.5 ${copied ? "text-green-600" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/8">
                <div className="flex flex-col items-center justify-center p-3 text-center md:p-4">
                  <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <p>
                      If you believe this restriction was applied in error, please contact the appeal person below with your name, email, and ID.
                    </p>
                    <p>
                      Keep the appeal brief and respectful. Include the reason for review and any details that may help.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
