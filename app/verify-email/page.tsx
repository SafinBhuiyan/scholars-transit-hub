import { Suspense } from "react"
import { OTPForm } from "@/components/otp-form"

export default function VerifyEmailPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[450px]">Loading...</div>}>
          <OTPForm />
        </Suspense>
      </div>
    </div>
  )
}
