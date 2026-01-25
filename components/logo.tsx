"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

export function Logo({ className, ...props }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("h-8 w-auto", className)} />
  }

  const logoSrc = resolvedTheme === "dark" 
    ? "/logo-dark.svg" 
    : "/logo-light.svg"

  return (
    <img
      src={logoSrc}
      alt="Scholars Transit Hub"
      className={cn("h-8 w-auto object-contain", className)}
      {...props}
    />
  )
}
