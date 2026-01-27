"use client"

import * as React from "react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

export function SplashScreen() {
  const [isVisible, setIsVisible] = React.useState(true)
  const [shouldRender, setShouldRender] = React.useState(true)

  React.useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash")
    if (hasSeenSplash) {
      setShouldRender(false)
      setIsVisible(false)
      return
    }

    const timer = setTimeout(() => {
      setIsVisible(false)
      sessionStorage.setItem("hasSeenSplash", "true")
      setTimeout(() => setShouldRender(false), 800)
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  if (!shouldRender) return null

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background transition-all duration-1000 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none translate-y-[-10px]"
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Subtle Background Radial Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        
        <div className="relative mb-12 animate-in fade-in zoom-in duration-1000 ease-out">
            <Logo className="h-16 w-auto relative z-10 brightness-110" />
            
            {/* Elegant Loading Ring around Logo */}
            <div className="absolute -inset-8">
                <div className="w-full h-full rounded-full border-[1.5px] border-primary/10 border-t-primary/40 animate-spin [animation-duration:3s]" />
                <div className="absolute inset-0 rounded-full border-[1.5px] border-primary/5 border-l-primary/30 animate-reverse-spin [animation-duration:5s]" />
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
            <div className="flex items-center gap-1.5 h-1">
                <div className="w-1 h-1 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" />
            </div>
            
            <p className="text-[10px] font-medium tracking-[0.5em] text-muted-foreground/60 uppercase">
                Synchronizing Hub
            </p>
        </div>
      </div>
    </div>
  )
}
