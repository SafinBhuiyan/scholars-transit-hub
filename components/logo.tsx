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
  const [useFallback, setUseFallback] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("h-8 w-auto", className)} />
  }

  const cloudinaryLogoSrc = resolvedTheme === "dark" 
    ? "https://res.cloudinary.com/dweqw3mgx/image/upload/v1769302905/Scholars_Transit_Hub_Logo-Dark_pugyyq.svg" 
    : "https://res.cloudinary.com/dweqw3mgx/image/upload/v1769302905/Scholars_Transit_Hub_Logo-Light_ldnwlf.svg"
  
  const localLogoSrc = resolvedTheme === "dark" 
    ? "/logo-dark.svg" 
    : "/logo-light.svg"

  const logoSrc = useFallback ? localLogoSrc : cloudinaryLogoSrc

  return (
    <img
      src={logoSrc}
      alt="Scholars Transit Hub"
      className={cn("h-8 w-auto object-contain", className)}
      onError={() => setUseFallback(true)}
      {...props}
    />
  )
}
