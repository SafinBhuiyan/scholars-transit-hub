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
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Logo } from "@/components/logo"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      })

      if (error) {
        toast.error(error.message || "Failed to send reset code.")
      } else {
        toast.success("A reset code has been sent to your email.")
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      }
    } catch (err: any) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-4 text-center">
                <Logo className="h-10 w-auto" />
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email address and we&apos;ll send you a code to reset your password.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you.know.who@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Code"}
                </Button>
              </Field>
              <div className="text-center text-sm">
                Remember your password?{" "}
                <a href="/login" className="underline underline-offset-4 pointer-events-auto">
                  Login
                </a>
              </div>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block border-l">
            <img
              src="https://res.cloudinary.com/dweqw3mgx/image/upload/v1769303805/Frame_6_2_lkyhpm.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover brightness-50"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
