"use client"

import * as React from "react"
import { 
    IconEdit, 
    IconTrash, 
    IconUsers, 
    IconClock, 
    IconDotsVertical, 
    IconPlus, 
    IconChevronUp, 
    IconChevronDown, 
    IconMapPin
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface RouteCardProps {
    route: any
    onEdit: (route: any) => void
    onDelete: (route: any) => void
    onAddPickup: (routeId: string) => void
    onEditPickup: (pickup: any) => void
    onDeletePickup: (pickup: any) => void
    onReorder: (routeId: string, pickupIds: string[]) => void
}

export function RouteCard({
    route,
    onEdit,
    onDelete,
    onAddPickup,
    onEditPickup,
    onDeletePickup,
    onReorder
}: RouteCardProps) {

    const movePickup = async (index: number, direction: 'up' | 'down') => {
        const newPickups = [...route.pickupPoints]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        
        if (targetIndex < 0 || targetIndex >= newPickups.length) return

        // Swap
        const temp = newPickups[index]
        newPickups[index] = newPickups[targetIndex]
        newPickups[targetIndex] = temp

        const pickupIds = newPickups.map(p => p.id)
        
        try {
            const response = await fetch("/api/admin/pickups/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ routeId: route.id, pickupIds }),
            })

            if (!response.ok) throw new Error("Failed to reorder")
            onReorder(route.id, pickupIds)
        } catch (error) {
            toast.error("Failed to reorder pickup points")
        }
    }

    const formatTime12h = (time: string) => {
        if (!time) return ""
        const [hours, minutes] = time.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const hours12 = hours % 12 || 12
        return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
    }

    return (
        <Card className="group relative flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
            {/* Header / Meta */}
            <div className="px-3.5 py-2.5 space-y-2 flex-1">
                <div className="flex items-start justify-between">
                    <div className="space-y-0">
                        <h3 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors leading-tight">
                            {route.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={route.isActive ? "default" : "secondary"} className="text-[9px] px-1.5 h-4 font-bold uppercase tracking-wider">
                                {route.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground">
                                <IconDotsVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(route)} className="text-xs">
                                <IconEdit className="mr-2 h-3.5 w-3.5" /> Edit Route
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive text-xs" onClick={() => onDelete(route)}>
                                <IconTrash className="mr-2 h-3.5 w-3.5" /> Delete Route
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Quick Meta Row */}
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="h-5 bg-muted/40 text-[10px] gap-1 px-1.5 border-transparent font-medium">
                        <IconUsers className="h-2.5 w-2.5 text-blue-500" /> {route.capacity}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-border/40 font-normal">
                        <IconClock className="h-2.5 w-2.5 text-orange-500" /> {formatTime12h(route.startTime)}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-border/40 font-normal">
                        <IconClock className="h-2.5 w-2.5 text-purple-500" /> {formatTime12h(route.returnTime)}
                    </Badge>
                </div>

                {/* Pickup Points Flow - Ultra Compact */}
                <div className="pt-1.5 relative">
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/60" />
                    
                    {route.pickupPoints?.length > 0 ? (
                        <div className="space-y-1.5">
                            {route.pickupPoints.map((pickup: any, index: number) => (
                                <div key={pickup.id} className="relative z-10 flex items-center gap-3 group/node">
                                    {/* Small Node */}
                                    <div className={cn(
                                        "h-[22px] w-[22px] min-w-[22px] rounded-full border bg-background flex items-center justify-center transition-all",
                                        index === 0 ? "border-primary shadow-sm" : "border-border"
                                    )}>
                                        {index === 0 ? (
                                            <IconMapPin className="h-2.5 w-2.5 text-primary fill-primary/10" />
                                        ) : (
                                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30 group-hover/node:bg-primary transition-colors" />
                                        )}
                                    </div>

                                    {/* Stop Name + Actions */}
                                    <div className="flex-1 flex items-center justify-between min-h-[28px] py-0 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="space-y-0 text-xs text-left">
                                            <p className="font-semibold text-foreground/90 tracking-tight">{pickup.name}</p>
                                            {pickup.landmark && (
                                                <p className="text-[10px] text-muted-foreground line-clamp-1 opacity-70 leading-none">{pickup.landmark}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-0 opacity-0 group-hover/node:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5" 
                                                disabled={index === 0}
                                                onClick={() => movePickup(index, 'up')}
                                            >
                                                <IconChevronUp className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5" 
                                                disabled={index === route.pickupPoints.length - 1}
                                                onClick={() => movePickup(index, 'down')}
                                            >
                                                <IconChevronDown className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEditPickup(pickup)}>
                                                <IconEdit className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/70 hover:text-destructive" onClick={() => onDeletePickup(pickup)}>
                                                <IconTrash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-3 text-muted-foreground/50 border border-dashed rounded-xl">
                            <p className="text-[10px] font-medium">No stops yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Action */}
            <div className="px-3.5 py-1.5 bg-muted/5 border-t border-border/30 group-hover:bg-muted/10 transition-colors">
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full h-7 text-[10px] border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all gap-1.5 font-bold"
                    onClick={() => onAddPickup(route.id)}
                >
                    <IconPlus className="h-3 w-3" /> Add Pickup Point
                </Button>
            </div>
        </Card>
    )
}
