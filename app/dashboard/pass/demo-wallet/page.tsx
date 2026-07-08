import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBrandApple,
  IconBrandGoogle,
  IconCheck,
  IconFileCode,
  IconId,
  IconInfoCircle,
  IconKey,
  IconSettings,
} from "@tabler/icons-react"

import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPassQrSvg, getPassState } from "@/lib/pass"
import prisma from "@/lib/prisma"

export default async function DemoWalletPage(props: {
  searchParams: Promise<{ wallet?: string }>
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const application = await prisma.transportApplication.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      route: true,
      pickupPoint: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  // Fallback mock details if no application exists
  const mockApplication = {
    fullName: session.user.name || "Demo Student",
    applicantType: "STUDENT",
    studentId: "202610192",
    department: "Computer Science",
    phone: "+8801700000000",
    route: { name: "Route A (Morning & Evening)" },
    pickupPoint: { name: "Main Campus Gate" },
  }

  const appData = application || mockApplication
  const { passId, isPassActive, billingEnd } = application
    ? getPassState(application as any)
    : { passId: "STH-2026-DEMOPASS", isPassActive: true, billingEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }

  const qrCodeSvg = application
    ? await getPassQrSvg(application as any, session.user.id, 180)
    : null

  const activeWallet = searchParams.wallet || "apple"

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 py-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/pass" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="h-4 w-4" />
            Back to Pass
          </Link>
        </Button>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          Developer Sandbox
        </Badge>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Digital Wallet Demonstration</h1>
        <p className="text-muted-foreground max-w-3xl">
          Because Apple Wallet and Google Wallet require verified corporate developer credentials and cryptographic certificates,
          this sandbox displays how your pass renders on a mobile device and provides full implementation details.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Left Column: Visual Mockup */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-2 border-b pb-4">
            <Button
              variant={activeWallet === "apple" ? "default" : "ghost"}
              className="flex-1 gap-2"
              asChild
            >
              <Link href="?wallet=apple">
                <IconBrandApple className="h-4 w-4" />
                Apple Wallet
              </Link>
            </Button>
            <Button
              variant={activeWallet === "google" ? "default" : "ghost"}
              className="flex-1 gap-2"
              asChild
            >
              <Link href="?wallet=google">
                <IconBrandGoogle className="h-4 w-4" />
                Google Wallet
              </Link>
            </Button>
          </div>

          {activeWallet === "apple" ? (
            /* Apple Wallet Mockup Card */
            <div className="relative mx-auto w-[320px] rounded-[38px] border-[8px] border-neutral-900 bg-black p-3 shadow-2xl overflow-hidden aspect-[9/18]">
              {/* iPhone Dynamic Island */}
              <div className="mx-auto mb-4 h-4 w-24 rounded-full bg-neutral-900" />

              <div className="flex flex-col h-[calc(100%-24px)] rounded-[24px] bg-[#1a1a1c] border border-neutral-800 text-white overflow-hidden shadow-inner">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">ST</div>
                    <span className="text-[11px] font-semibold tracking-wider text-neutral-400">SCHOLARS PASS</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] hover:bg-emerald-500/20 border-emerald-500/10">
                    ACTIVE
                  </Badge>
                </div>

                {/* Pass Details */}
                <div className="p-4 flex-1 space-y-4">
                  <div>
                    <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">Rider Name</span>
                    <span className="text-base font-semibold text-neutral-200">{appData.fullName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">Pass ID</span>
                      <span className="text-xs font-mono font-medium text-neutral-300">{passId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">Route</span>
                      <span className="text-xs font-semibold text-neutral-300 truncate block">{appData.route.name.split(" ")[0]} Route</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">Pickup Point</span>
                      <span className="text-xs font-medium text-neutral-300 truncate block">{appData.pickupPoint.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">Expires On</span>
                      <span className="text-xs font-medium text-neutral-300">
                        {billingEnd ? new Date(billingEnd).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-[#111112] p-4 flex flex-col items-center justify-center gap-3 border-t border-white/5 rounded-b-[24px]">
                  {qrCodeSvg ? (
                    <div
                      className="rounded-lg bg-white p-2.5 shadow-md flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-lg bg-white p-2.5 shadow-md flex items-center justify-center text-black font-semibold text-sm">
                      [ QR CODE ]
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-neutral-500 tracking-widest">{passId}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Google Wallet Mockup Card */
            <div className="relative mx-auto w-[320px] rounded-[38px] border-[8px] border-neutral-900 bg-zinc-950 p-3 shadow-2xl overflow-hidden aspect-[9/18]">
              {/* Camera Notch */}
              <div className="mx-auto mb-4 h-3.5 w-3.5 rounded-full bg-neutral-900" />

              <div className="flex flex-col h-[calc(100%-22px)] rounded-[24px] bg-[#f8fafc] text-neutral-900 overflow-hidden shadow-lg border border-neutral-200">
                {/* Brand Header */}
                <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">ST</div>
                  <div>
                    <span className="text-xs font-bold block text-neutral-800">Scholars Transit</span>
                    <span className="text-[8px] text-neutral-500 block">University Commuter Pass</span>
                  </div>
                </div>

                {/* Card Title & Info */}
                <div className="p-4 flex-1 space-y-4">
                  <div className="bg-indigo-600 text-white rounded-xl p-3 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider opacity-85 block">Rider</span>
                    <span className="text-sm font-bold block">{appData.fullName}</span>
                    <div className="mt-2 flex justify-between items-center text-[9px] opacity-75">
                      <span>{passId}</span>
                      <span>ACTIVE</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-[10px]">Assigned Route:</span>
                      <span className="font-semibold text-neutral-800 truncate max-w-[150px]">{appData.route.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-[10px]">Pickup Point:</span>
                      <span className="font-semibold text-neutral-800 truncate max-w-[150px]">{appData.pickupPoint.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-[10px]">Valid Until:</span>
                      <span className="font-semibold text-neutral-800">
                        {billingEnd ? new Date(billingEnd).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="p-4 bg-white border-t flex flex-col items-center justify-center gap-2 rounded-b-[24px]">
                  {qrCodeSvg ? (
                    <div
                      className="rounded-lg border p-2 bg-white flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-lg border p-2 flex items-center justify-center text-xs text-neutral-400 font-mono">
                      [ QR CODE ]
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-neutral-400">{passId}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Setup & Credentials Guide */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconInfoCircle className="h-5 w-5 text-indigo-500" />
                How the Integration Works
              </CardTitle>
              <CardDescription>
                Real-world pass synchronization is built directly into this system. Here is the path to make it live:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a student clicks <strong>"Add to Apple Wallet"</strong> or <strong>"Add to Google Wallet"</strong>, the backend verifies their
                active enrollment and payment status.
                If authenticated, the backend dynamically constructs a secure pass object, embeds the unique transit QR payload, signs the pass bundle cryptographically,
                and triggers a native download/registration onto the device.
              </p>

              <div className="rounded-lg border bg-muted/20 p-4">
                <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-2">
                  <IconSettings className="h-4 w-4 text-primary" />
                  Demonstration Assets
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  You can inspect the source files to see how the system compiles and signs these digital passes:
                </p>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 rounded border bg-background p-2">
                    <IconFileCode className="h-4 w-4 text-neutral-400" />
                    <a href="file:///Users/safin/Coding%20Projects/university-project/scholars-transit-hub/app/api/dashboard/pass/apple/route.ts" className="hover:underline font-mono">
                      apple/route.ts
                    </a>
                  </div>
                  <div className="flex items-center gap-2 rounded border bg-background p-2">
                    <IconFileCode className="h-4 w-4 text-neutral-400" />
                    <a href="file:///Users/safin/Coding%20Projects/university-project/scholars-transit-hub/app/api/dashboard/pass/google/route.ts" className="hover:underline font-mono">
                      google/route.ts
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide Cards depending on active tab */}
          {activeWallet === "apple" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconBrandApple className="h-5 w-5" />
                  Apple Wallet Certificates Config
                </CardTitle>
                <CardDescription>
                  To enable live Apple Wallet PKPass signing, configure these variables in your `.env` file:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm font-mono">
                <div className="space-y-3">
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-emerald-500 font-semibold uppercase block mb-1">APPLE_PASS_TYPE_IDENTIFIER</span>
                    <span className="text-xs text-neutral-400">pass.com.university.scholars-transit</span>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-emerald-500 font-semibold uppercase block mb-1">APPLE_TEAM_IDENTIFIER</span>
                    <span className="text-xs text-neutral-400">ABC123XYZ9</span>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-emerald-500 font-semibold uppercase block mb-1">APPLE_PASS_CERTIFICATE</span>
                    <span className="text-[11px] text-neutral-400 overflow-x-auto block">Base64 string of your exported Pass certificate (.pem)</span>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-emerald-500 font-semibold uppercase block mb-1">APPLE_PASS_PRIVATE_KEY</span>
                    <span className="text-[11px] text-neutral-400 overflow-x-auto block">Base64 string of your private key certificate (.pem)</span>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-emerald-500 font-semibold uppercase block mb-1">APPLE_PASS_WWDR_CA</span>
                    <span className="text-[11px] text-neutral-400 overflow-x-auto block">Base64 string of Apple WWDR certificate G3/G4</span>
                  </div>
                </div>
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 font-sans flex items-start gap-2">
                  <IconAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Tip:</strong> Base64 encoding lets you paste multiline certificate contents directly as single-line string variables in platforms like Vercel or local `.env` files.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconBrandGoogle className="h-5 w-5 text-indigo-500" />
                  Google Wallet API Config
                </CardTitle>
                <CardDescription>
                  To enable live Google Wallet "Save" links, configure these variables in your `.env` file:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm font-mono">
                <div className="space-y-3">
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-indigo-500 font-semibold uppercase block mb-1">GOOGLE_ISSUER_ID</span>
                    <span className="text-xs text-neutral-400">3388000000022883399</span>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-indigo-500 font-semibold uppercase block mb-1">GOOGLE_SERVICE_ACCOUNT_EMAIL</span>
                    <span className="text-xs text-neutral-400">wallet-service@project-id.iam.gserviceaccount.com</span>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border">
                    <span className="text-xs text-indigo-500 font-semibold uppercase block mb-1">GOOGLE_PRIVATE_KEY</span>
                    <span className="text-[11px] text-neutral-400 overflow-x-auto block">-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...</span>
                  </div>
                </div>
                <div className="rounded-md bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-600 font-sans flex items-start gap-2">
                  <IconKey className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Steps:</strong> Create a project on the Google Cloud Console, enable the <em>Google Wallet API</em>, create a Service Account, generate a JSON private key, and set these variables.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
