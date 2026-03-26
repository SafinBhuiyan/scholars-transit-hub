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
