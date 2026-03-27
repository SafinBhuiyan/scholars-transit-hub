'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Logo } from "@/components/logo"

export function OTPForm({ className, ...props }: React.ComponentProps<"div">) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(30)
  const [attempts, setAttempts] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  // Timer logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleDeleteUser = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/auth/delete-unverified-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        toast.error("Maximum attempts reached. Your progress has been cleared. Please sign up again.")
        router.push("/signup")
      }
    } catch {
    } finally {
      setIsDeleting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("User email not found. Please try signing up again.")
      return
    }
    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit code.")
      return
    }
    setLoading(true)
    try {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      })
      if (data) {
        toast.success("Hooray! Your account is ready. You can now start your journey.")
        router.push("/dashboard")
      } else {
        toast.error(error?.message || "Verification failed. Please check the code.")
      }
    } catch (err: any) {
      toast.error("An error occurred during verification.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (attempts >= 2) { // 0, 1, 2 = 3 tries total
       await handleDeleteUser()
       return
    }

    if (!email) {
      toast.error("User email not found. Please try signing up again.")
      return
    }
    
    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification"
      })

      if (error) {
        toast.error(error.message || "Failed to resend code.")
      } else {
        toast.success("A new verification code has been sent!")
        setTimer(30)
        setAttempts((prev) => prev + 1)
        setOtp("") // Clear previous OTP
      }
    } catch (err) {
      toast.error("Failed to resend code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn("flex flex-col gap-6 md:min-h-[450px]", className)}
      {...props}
    >
      <Card className="flex-1 overflow-hidden p-0">
        <CardContent className="grid flex-1 p-0 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center p-6 md:p-8">
            <form className="w-full max-w-[280px]" onSubmit={handleVerify}>
              <FieldGroup className="items-center text-center">
                <Field className="mb-2">
                  <Logo className="mx-auto mb-4 h-8" />
                  <h1 className="text-2xl font-bold tracking-tight text-center">Enter verification code</h1>
                  <p className="text-muted-foreground text-sm text-center">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </Field>
                
                <Field className="w-full items-center">
                  <FieldLabel htmlFor="otp" className="sr-only">
                    Verification code
                  </FieldLabel>
                  <div className="flex justify-center py-2">
                    <InputOTP
                      maxLength={6}
                      id="otp"
                      required
                      value={otp}
                      onChange={setOtp}
                      disabled={loading || isDeleting}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="size-10" />
                        <InputOTPSlot index={1} className="size-10" />
                        <InputOTPSlot index={2} className="size-10" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="size-10" />
                        <InputOTPSlot index={4} className="size-10" />
                        <InputOTPSlot index={5} className="size-10" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <FieldDescription className="text-center text-xs">
                    Enter the 6-digit code sent to your email.
                  </FieldDescription>
                </Field>

                <Field className="w-full">
                  <Button type="submit" className="w-full" disabled={loading || isDeleting || otp.length !== 6}>
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                  
                  <div className="mt-4 text-center text-sm">
                    {timer > 0 ? (
                       <p className="text-muted-foreground animate-pulse text-center">
                         Resend code in <span className="font-mono font-bold text-foreground">{timer}s</span>
                       </p>
                    ) : (
                      <p className="text-muted-foreground text-center">
                        Didn&apos;t receive the code?{" "}
                        <button 
                          type="button" 
                          className="font-medium text-primary underline underline-offset-4 hover:opacity-80 disabled:opacity-50"
                          onClick={handleResend}
                          disabled={loading || isDeleting}
                        >
                          Resend ({3 - attempts} left)
                        </button>
                      </p>
                    )}
                  </div>
                </Field>
              </FieldGroup>
            </form>
          </div>
          <div className="bg-muted relative hidden md:block border-l">
            <img
              src="https://res.cloudinary.com/dweqw3mgx/image/upload/v1769303805/Frame_6_2_lkyhpm.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover brightness-50"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="text-center text-xs opacity-70">
        By clicking continue, you agree to our <a href="#" className="underline">Terms of Service</a>{" "}
        and <a href="#" className="underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
