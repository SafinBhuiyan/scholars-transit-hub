import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateShort(date: string | number | Date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  return format(d, "MMM d, yyyy")
}

export function getOptimizedImageUrl(src?: string | null, size = 512) {
  if (!src) return undefined

  try {
    const url = new URL(src)

    // Google profile photos often default to 96px, which looks soft in larger avatars.
    if (url.hostname === "lh3.googleusercontent.com") {
      if (url.pathname.match(/=s\d+-c$/)) {
        url.pathname = url.pathname.replace(/=s\d+-c$/, `=s${size}-c`)
      } else if (url.pathname.match(/\/s\d+-c\//)) {
        url.pathname = url.pathname.replace(/\/s\d+-c\//, `/s${size}-c/`)
      } else if (!url.pathname.includes(`=s${size}-c`)) {
        url.pathname = `${url.pathname}=s${size}-c`
      }

      return url.toString()
    }

    return src
  } catch {
    return src
  }
}
