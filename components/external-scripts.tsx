"use client"

import { useEffect } from "react"

const GA_ID = "G-8NRBZ2NFT9"
const TAWK_SRC = "https://embed.tawk.to/69c5746cb188961c38ffebad/1jklktimr"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    Tawk_API?: Record<string, unknown>
    Tawk_LoadStart?: Date
  }
}

export function ExternalScripts() {
  useEffect(() => {
    if (!document.getElementById("ga-gtag-loader")) {
      const loader = document.createElement("script")
      loader.id = "ga-gtag-loader"
      loader.async = true
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      document.head.appendChild(loader)
    }

    if (!document.getElementById("ga-gtag-init")) {
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args)
      }

      const init = document.createElement("script")
      init.id = "ga-gtag-init"
      init.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `
      document.head.appendChild(init)
    }

    if (!document.getElementById("tawk-to-loader")) {
      window.Tawk_API = window.Tawk_API || {}
      window.Tawk_LoadStart = new Date()

      const tawk = document.createElement("script")
      tawk.id = "tawk-to-loader"
      tawk.async = true
      tawk.src = TAWK_SRC
      tawk.charset = "UTF-8"
      tawk.setAttribute("crossorigin", "*")
      document.head.appendChild(tawk)
    }
  }, [])

  return null
}
