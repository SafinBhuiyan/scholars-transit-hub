"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconLoader,
  IconRefresh,
  IconUser,
  IconX,
} from "@tabler/icons-react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type VerifyResult = {
  isValid: boolean
  passId?: string
  fullName?: string
  studentId?: string | null
  department?: string
  applicantType?: string
  phone?: string
  routeName?: string
  pickupPointName?: string
  avatarUrl?: string | null
  expiryDate?: string | null
  error?: string
  status?: string
}

function playBeep(success: boolean) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    if (success) {
      // Clean high-pitched success beep
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.15)
    } else {
      // Low-pitched error buzz
      oscillator.type = "sawtooth"
      oscillator.frequency.setValueAtTime(140, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.35)
    }
  } catch (e) {
    console.error("Audio beep failed:", e)
  }
}

export default function PassesScannerPage() {
  const router = useRouter()
  const [scannerActive, setScannerActive] = React.useState(false)
  const [cameraPermission, setCameraPermission] = React.useState<"pending" | "granted" | "denied">("pending")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [result, setResult] = React.useState<VerifyResult | null>(null)
  const [resetProgress, setResetProgress] = React.useState(100)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const scannerRef = React.useRef<Html5Qrcode | null>(null)
  const verifyingRef = React.useRef(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Start the scanner
  const startScanner = React.useCallback(async () => {
    if (scannerRef.current?.isScanning) return

    setErrorMessage(null)
    setResult(null)

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader")
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.75
            return { width: size, height: size }
          },
        },
        async (decodedText) => {
          // On Success
          if (verifyingRef.current) return
          verifyingRef.current = true
          setIsVerifying(true)

          try {
            let applicationId = decodedText

            // If QR contains JSON, parse out the application ID
            if (decodedText.startsWith("{")) {
              try {
                const parsed = JSON.parse(decodedText)
                if (parsed.applicationId) {
                  applicationId = parsed.applicationId
                }
              } catch {
                // Keep raw string if JSON parsing fails
              }
            }

            const res = await fetch("/api/admin/passes/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ applicationId }),
            })

            const data = await res.json()

            if (res.ok) {
              setResult(data)
              playBeep(data.isValid)
            } else {
              setResult({
                isValid: false,
                error: data.error || "Invalid Pass Record",
              })
              playBeep(false)
            }
          } catch {
            setResult({
              isValid: false,
              error: "Connection or network error.",
            })
            playBeep(false)
          } finally {
            setIsVerifying(false)

            // Start countdown to auto-reset scanning
            if (timerRef.current) clearInterval(timerRef.current)
            let timeLeft = 2800 // 2.8 seconds
            setResetProgress(100)

            timerRef.current = setInterval(() => {
              timeLeft -= 100
              setResetProgress((timeLeft / 2800) * 100)

              if (timeLeft <= 0) {
                if (timerRef.current) clearInterval(timerRef.current)
                setResult(null)
                verifyingRef.current = false
              }
            }, 100)
          }
        },
        () => {
          // Silent scan frame failure
        }
      )

      setCameraPermission("granted")
      setScannerActive(true)
    } catch (err: any) {
      console.error("Scanner start error:", err)
      setCameraPermission("denied")
      setErrorMessage("Could not access environment camera. Please verify permission settings.")
    }
  }, [])

  // Stop the scanner
  const stopScanner = React.useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    verifyingRef.current = false
    setResult(null)

    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
        setScannerActive(false)
      } catch (err) {
        console.error("Failed to stop scanner:", err)
      }
    } else {
      setScannerActive(false)
    }
  }, [])

  // Handle immediate manual reset
  const handleReset = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setResult(null)
    verifyingRef.current = false
  }, [])

  // Initialize and clean up
  React.useEffect(() => {
    // Start scanner automatically on load
    startScanner()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Cleanup stop failed:", err))
      }
    }
  }, [startScanner])

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4 py-4 md:py-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/passes" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="h-4 w-4" />
            Pass Lookup
          </Link>
        </Button>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Mobile Scanner App
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* Left Column: Camera Viewport */}
        <Card className="overflow-hidden bg-neutral-950 text-white border-neutral-900 flex flex-col justify-between min-h-[400px] shadow-2xl relative">
          <CardHeader className="bg-neutral-900/60 backdrop-blur border-b border-neutral-900 p-4 z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IconCamera className="h-4 w-4 text-primary animate-pulse" />
                Live Camera Feed
              </CardTitle>
              <Badge variant="outline" className={`${scannerActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                {scannerActive ? "Scanning" : "Idle"}
              </Badge>
            </div>
          </CardHeader>

          {/* Camera Box */}
          <div className="relative flex-1 flex items-center justify-center p-4 bg-neutral-950 aspect-square md:aspect-video w-full">
            <div id="qr-reader" className="w-full h-full max-w-[340px] aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 relative">
              {/* Custom scanning viewfinder indicators */}
              {scannerActive && !result && (
                <div className="absolute inset-0 pointer-events-none z-10 border-2 border-dashed border-primary/45 rounded-xl flex items-center justify-center">
                  {/* Blinking scanner line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-[bounce_2s_infinite]" />
                </div>
              )}
            </div>

            {/* Verifying Spinner Overlay */}
            {isVerifying && (
              <div className="absolute inset-0 bg-neutral-950/85 flex flex-col items-center justify-center gap-3 z-20">
                <IconLoader className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium tracking-wide text-neutral-300">Checking pass credentials...</p>
              </div>
            )}

            {/* Error Message Overlay */}
            {errorMessage && !scannerActive && (
              <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center text-center p-6 gap-4 z-20">
                <IconAlertTriangle className="h-10 w-10 text-amber-500" />
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-200">Camera Access Blocked</p>
                  <p className="text-xs text-neutral-400 max-w-xs">{errorMessage}</p>
                </div>
                <Button size="sm" onClick={startScanner} className="gap-2">
                  <IconRefresh className="h-4 w-4" />
                  Grant Permission
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 bg-neutral-900/60 backdrop-blur border-t border-neutral-900 flex justify-between gap-4 z-10">
            {scannerActive ? (
              <Button variant="destructive" className="w-full" onClick={stopScanner}>
                Stop Camera
              </Button>
            ) : (
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={startScanner}>
                Start Camera
              </Button>
            )}
          </div>
        </Card>

        {/* Right Column: Verification Results Overlay */}
        <div className="flex flex-col gap-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Scanner Panel</CardTitle>
              <CardDescription>Results show here immediately upon QR detection.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center py-8 min-h-[300px]">
              {result ? (
                result.isValid ? (
                  /* Dynamic Valid Pass Render */
                  <div className="w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-md">
                      <IconCheck className="h-10 w-10 stroke-[3]" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">VALID PASS</span>
                      <h3 className="text-xl font-bold text-neutral-900">{result.fullName}</h3>
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {result.passId}
                      </Badge>
                    </div>

                    <div className="w-full rounded-xl border bg-muted/20 p-4 text-left text-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={result.avatarUrl || undefined} alt={result.fullName} />
                          <AvatarFallback>
                            <IconUser className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-neutral-800">{result.department}</p>
                          <p className="text-xs text-muted-foreground">{result.studentId || "Staff"}</p>
                        </div>
                      </div>

                      <div className="border-t pt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Route:</span>
                          <span className="font-semibold text-neutral-800 block truncate">{result.routeName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Pickup point:</span>
                          <span className="font-semibold text-neutral-800 block truncate">{result.pickupPointName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Countdown Bar to next scan */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Auto-resetting...</span>
                        <Button variant="ghost" size="sm" onClick={handleReset} className="h-auto p-0 font-semibold hover:bg-transparent">
                          Reset Now
                        </Button>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
                          style={{ width: `${resetProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Dynamic Invalid Pass Render */
                  <div className="w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-md animate-bounce">
                      <IconX className="h-10 w-10 stroke-[3]" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-red-500 font-bold uppercase tracking-wider">VERIFICATION FAILED</span>
                      <h3 className="text-lg font-bold text-neutral-800 leading-snug">{result.error || "Expired or Invalid Credentials"}</h3>
                      {result.fullName && (
                        <p className="text-sm font-semibold text-muted-foreground mt-1">{result.fullName}</p>
                      )}
                    </div>

                    {result.passId && (
                      <div className="rounded-xl border bg-red-500/5 border-red-500/10 p-3 text-xs text-left space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pass Reference:</span>
                          <span className="font-mono font-medium">{result.passId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-semibold text-red-600 uppercase">{result.status || "REJECTED"}</span>
                        </div>
                      </div>
                    )}

                    {/* Progress Countdown Bar to next scan */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Auto-resetting...</span>
                        <Button variant="ghost" size="sm" onClick={handleReset} className="h-auto p-0 font-semibold hover:bg-transparent">
                          Reset Now
                        </Button>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-100 ease-linear"
                          style={{ width: `${resetProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* Scanner Viewport Placeholder Instructions */
                <div className="text-center space-y-3 max-w-[240px]">
                  <IconCamera className="h-10 w-10 mx-auto text-muted-foreground stroke-[1.5]" />
                  <div className="space-y-1">
                    <p className="font-medium text-neutral-700">Awaiting Pass Scan</p>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Point the active camera at a student's ticket QR code to auto-verify credentials.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
