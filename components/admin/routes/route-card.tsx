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
    IconMapPin,
    IconRoute,
    IconGripVertical
} from "@tabler/icons-react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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

function SortablePickupItem({ 
    pickup, 
    index, 
    onEditPickup, 
    onDeletePickup, 
    isFirst 
}: { 
    pickup: any, 
    index: number, 
    onEditPickup: (pickup: any) => void, 
    onDeletePickup: (pickup: any) => void,
    isFirst: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: pickup.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: 'relative' as const,
    }

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={cn(
                "relative z-10 flex items-center gap-3 group/node transition-all duration-200",
                isDragging ? "opacity-50 scale-[0.98] shadow-sm" : ""
            )}
        >
            {/* Grab Handle */}
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted text-muted-foreground/30 hover:text-foreground transition-colors shrink-0 -ml-1.5"
            >
                <IconGripVertical className="h-3.5 w-3.5" />
            </div>

            {/* Small Node */}
            <div className={cn(
                "h-[22px] w-[22px] min-w-[22px] rounded-full border bg-background flex items-center justify-center transition-all shrink-0",
                isFirst ? "border-primary shadow-sm" : (pickup.isActive === false ? "border-destructive/30" : "border-border")
            )}>
                {isFirst ? (
                    <IconMapPin className="h-2.5 w-2.5 text-primary fill-primary/10" />
                ) : (
                    <div className={cn(
                        "h-1 w-1 rounded-full transition-colors",
                         pickup.isActive === false ? "bg-destructive/50" : "bg-muted-foreground/30 group-hover/node:bg-primary"
                    )} />
                )}
            </div>

            {/* Stop Name + Actions */}
            <div className={cn(
                "flex-1 flex items-center justify-between min-h-[28px] py-0 px-2 rounded-lg transition-colors overflow-hidden border border-transparent hover:border-border/30",
                pickup.isActive === false ? "opacity-60 bg-muted/20 hover:bg-muted/30" : "hover:bg-muted/50"
            )}>
                <div className="flex items-center gap-1.5 text-xs text-left overflow-hidden">
                    <p className={cn(
                        "font-semibold tracking-tight whitespace-nowrap",
                        pickup.isActive === false ? "text-muted-foreground line-through decoration-destructive/30" : "text-foreground/90"
                    )}>
                        {pickup.name}
                    </p>
                    {pickup.landmark && (
                        <p className="text-[10px] text-muted-foreground opacity-70 leading-none truncate flex-1 tracking-tight">
                            {pickup.landmark}
                        </p>
                    )}
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-md transition-all border border-border/40 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] bg-background/50" onClick={() => onEditPickup(pickup)}>
                        <IconEdit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all border border-border/40 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] bg-background/50" onClick={() => onDeletePickup(pickup)}>
                        <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = route.pickupPoints.findIndex((p: any) => p.id === active.id)
            const newIndex = route.pickupPoints.findIndex((p: any) => p.id === over.id)
            
            // Create a new array with the moved item
            const newPickups = arrayMove(route.pickupPoints, oldIndex, newIndex)
            const pickupIds = newPickups.map((p: any) => p.id)

            // Optimistically update parent - requires parent to accept new list
            // For now we'll trust the API call and final onReorder callback
            
            try {
                // Call reorder API immediately
                const response = await fetch("/api/admin/pickups/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ routeId: route.id, pickupIds }),
                })

                if (!response.ok) throw new Error("Failed to reorder")
                
                // Trigger parent update
                onReorder(route.id, pickupIds)
            } catch (error) {
                toast.error("Failed to reorder pickup points")
            }
        }
    }

    const formatTime12h = (time: string) => {
        if (!time) return ""
        const [hours, minutes] = time.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const hours12 = hours % 12 || 12
        return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
    }

    const toggleStatus = async () => {
        try {
            const response = await fetch(`/api/admin/routes/${route.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !route.isActive }),
            })

            if (!response.ok) throw new Error("Failed to update status")
            toast.success(`Route marked as ${!route.isActive ? 'active' : 'inactive'}`)
            onEdit(route) // Trigger a refresh in the parent
        } catch (error) {
            toast.error("Failed to update route status")
        }
    }

    return (
        <Card className="group relative flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 py-0 gap-0">
            {/* Upper Section */}
            <div className="p-4 space-y-4 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                            <IconRoute className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors leading-tight truncate">
                            {route.name}
                        </h3>
                    </div>
                    <Badge variant={route.isActive ? "default" : "secondary"} className="text-[10px] px-2 h-5 font-bold uppercase tracking-wider shrink-0">
                        {route.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
                    
                {/* Pickup Points Flow - Sortable */}
                <div className="pt-2 relative">
                    <div className="absolute left-[39px] top-4 bottom-1 w-px bg-border/60" />
                    
                    {route.pickupPoints?.length > 0 ? (
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext 
                                items={route.pickupPoints.map((p: any) => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-1.5 pl-0.5">
                                    {route.pickupPoints.map((pickup: any, index: number) => (
                                        <SortablePickupItem 
                                            key={pickup.id}
                                            pickup={pickup}
                                            index={index}
                                            onEditPickup={onEditPickup}
                                            onDeletePickup={onDeletePickup}
                                            isFirst={index === 0}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/40 border border-dashed rounded-xl bg-muted/5">
                            <p className="text-[10px] font-medium">No stops added yet</p>
                        </div>
                    )}
                </div>

                {/* Meta Attributes Row */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="secondary" className="h-5 bg-muted/40 text-[9px] gap-1 px-1.5 border-transparent font-medium text-muted-foreground">
                        <IconUsers className="h-2.5 w-2.5" /> {route.capacity} seats
                    </Badge>
                    <Badge variant="outline" className="h-5 text-[9px] gap-1.5 px-1.5 border-border/40 font-normal text-muted-foreground">
                        <IconClock className="h-2.5 w-2.5" /> {formatTime12h(route.startTime)}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-[9px] gap-1.5 px-1.5 border-border/40 font-normal text-muted-foreground">
                        <IconClock className="h-2.5 w-2.5" /> {formatTime12h(route.returnTime)}
                    </Badge>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="px-4 py-3 bg-muted/5 border-t border-border/30 flex items-center justify-between gap-2 opacity-100 group-hover:bg-muted/10 transition-colors">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] gap-1.5 px-2.5 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm bg-background/50 font-bold"
                    onClick={() => onAddPickup(route.id)}
                >
                    <IconPlus className="h-3 w-3" /> Add Stop
                </Button>
                
                <div className="flex items-center gap-1.5">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 rounded-md border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm bg-background/50 text-foreground/80"
                        onClick={() => onEdit(route)}
                    >
                        <IconEdit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 rounded-md border-border/40 text-destructive/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm bg-background/50"
                        onClick={() => onDelete(route)}
                    >
                        <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
