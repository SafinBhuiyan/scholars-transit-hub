"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
}

export function Logo({ className, ...props }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const src = mounted && resolvedTheme === "dark"
    ? "/logo/final-logo-dark.svg"
    : "/logo/final-logo-light.svg"

  return (
    <span
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Image
        src={src}
        alt="ScholarsPass"
        width={194}
        height={50}
        priority
        className="block h-full w-auto max-w-full object-contain object-center"
      />
    </span>
  )
}
