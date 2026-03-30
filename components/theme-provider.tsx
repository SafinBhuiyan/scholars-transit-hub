"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: "class"
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme, disableTransitionOnChange: boolean) {
  const resolved = theme === "system" ? getSystemTheme() : theme
  const root = document.documentElement

  if (disableTransitionOnChange) {
    const style = document.createElement("style")
    style.setAttribute("data-theme-transition", "true")
    style.textContent = `*,*::before,*::after{transition:none!important}`
    document.head.appendChild(style)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }

  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(
    defaultTheme === "system" ? "light" : defaultTheme
  )

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme") as Theme | null
    const initialTheme = storedTheme ?? defaultTheme
    const nextTheme = initialTheme === "system" && !enableSystem ? "light" : initialTheme

    setThemeState(nextTheme)
    setResolvedTheme(nextTheme === "system" ? getSystemTheme() : nextTheme)
    applyTheme(nextTheme, false)
  }, [defaultTheme, enableSystem])

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => setResolvedTheme(media.matches ? "dark" : "light")

    handleChange()
    media.addEventListener("change", handleChange)

    return () => media.removeEventListener("change", handleChange)
  }, [enableSystem, theme])

  React.useEffect(() => {
    if (!document.documentElement) return
    applyTheme(theme, disableTransitionOnChange)
    window.localStorage.setItem("theme", theme)
    setResolvedTheme(theme === "system" ? getSystemTheme() : theme)
  }, [disableTransitionOnChange, theme])

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme: Theme) => setThemeState(nextTheme),
    }),
    [resolvedTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    return {
      theme: "system" as Theme,
      resolvedTheme: "light" as ResolvedTheme,
      setTheme: () => {},
    }
  }

  return context
}
