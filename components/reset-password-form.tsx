'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authClient } from "@/lib/auth-client"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Logo } from "@/components/logo"

function ResetFormContent() {
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else {
      setCanResend(true)
    }
    return () => clearInterval(timer)
  }, [countdown, canResend])

  const handleResend = async () => {
    if (!canResend || !email) return
    
    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      })

      if (error) {
        toast.error(error.message || "Something went wrong.")
      } else {
        toast.success("A fresh reset code has been sent!")
        setCountdown(30)
        setCanResend(false)
        setOtp("")
        setStep(1)
      }
    } catch (err) {
      toast.error("Failed to resend code.")
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.")
      return
    }
    setStep(2)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Email not found. Please try the forgot password page again.")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      // Better-Auth resetPassword requires all three: email, otp, password
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      })

      if (error) {
        toast.error(error.message || "Failed to reset password.")
        // If the error is about the OTP, move back to step 1
        if (error.message?.toLowerCase().includes("code") || error.message?.toLowerCase().includes("otp")) {
          setStep(1)
        }
      } else {
        toast.success("Hooray! Your password has been reset successfully.")
        router.push("/login")
      }
    } catch (err: any) {
      toast.error("An error occurred during password reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8">
      {step === 1 ? (
        <form className="w-full max-w-[280px]" onSubmit={handleNextStep}>
          <FieldGroup className="items-center text-center">
            <Field className="mb-2">
              <Logo className="mx-auto mb-4 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">Verify Code</h1>
              <p className="text-muted-foreground text-sm text-center">
                Enter the 6-digit reset code sent to <span className="font-medium text-foreground">{email}</span>
              </p>
            </Field>
            
            <Field className="w-full items-center">
              <FieldLabel htmlFor="otp" className="sr-only">
                Reset code
              </FieldLabel>
              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  id="otp"
                  required
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
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
              <div className="mt-2 text-center text-sm">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-primary hover:underline font-medium"
                    disabled={loading}
                  >
                    Resend code
                  </button>
                ) : (
                  <p className="text-muted-foreground">
                    Resend code in <span className="font-mono font-medium text-foreground">{countdown}s</span>
                  </p>
                )}
              </div>
            </Field>

            <Field className="w-full flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={otp.length !== 6}>
                Verify & Next
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push("/forgot-password")}
              >
                Back
              </Button>
            </Field>
          </FieldGroup>
        </form>
      ) : (
        <form className="w-full max-w-[280px]" onSubmit={handleReset}>
          <FieldGroup className="items-center text-center">
            <Field className="mb-2">
              <Logo className="mx-auto mb-4 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">Set Password</h1>
              <p className="text-muted-foreground text-sm text-center">
                Code verified! Now choose a new secure password for your account.
              </p>
            </Field>

            <Field className="w-full text-left">
              <FieldLabel htmlFor="password">New Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </Field>

            <Field className="w-full text-left">
              <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field className="w-full flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  )
}

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="flex-1 overflow-hidden p-0">
        <CardContent className="grid flex-1 p-0 md:grid-cols-2">
          <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
            <ResetFormContent />
          </Suspense>
          <div className="bg-muted relative hidden md:block border-l">
            <img
              src="https://res.cloudinary.com/dweqw3mgx/image/upload/v1769303805/Frame_6_2_lkyhpm.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover brightness-50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
