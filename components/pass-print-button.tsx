"use client"

import { IconPrinter } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

export function PassPrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <IconPrinter className="mr-2 h-4 w-4" />
      Print Pass
    </Button>
  )
}
