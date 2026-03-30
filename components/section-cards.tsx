import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Stat {
  label: string
  value: string | number
  description: string
  trend?: string
  trendValue?: string
  trendDirection?: "up" | "down" | "neutral"
}

export function SectionCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="@container/card min-w-0">
          <CardHeader className="gap-2">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="min-w-0 wrap-break-word text-xl leading-tight font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
              {stat.value}
            </CardTitle>
            {stat.trendValue && (
              <CardAction>
                <Badge variant="outline">
                  {stat.trendDirection === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
                  {stat.trendValue}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              {stat.trend} {stat.trendDirection === "up" ? <IconTrendingUp className="size-4" /> : stat.trendDirection === "down" ? <IconTrendingDown className="size-4" /> : null}
            </div>
            <div className="text-muted-foreground wrap-break-word">
              {stat.description}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
