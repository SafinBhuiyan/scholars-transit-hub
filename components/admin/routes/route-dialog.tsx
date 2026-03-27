"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { IconLoader, IconRoute } from "@tabler/icons-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Kbd } from "@/components/ui/kbd"

const routeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    capacity: z.number().int().positive("Capacity must be positive"),
    startTime: z.string().min(1, "Start time is required"),
    returnTime: z.string().min(1, "Return time is required"),
    isActive: z.boolean(),
})

type RouteFormValues = z.infer<typeof routeSchema>

interface RouteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    route?: any // Existing route for editing
}

export function RouteDialog({
    open,
    onOpenChange,
    onSuccess,
    route
}: RouteDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<RouteFormValues>({
        resolver: zodResolver(routeSchema),
        defaultValues: {
            name: "",
            capacity: 50,
            startTime: "",
            returnTime: "",
            isActive: true,
        },
    })

    React.useEffect(() => {
        if (route) {
            form.reset({
                name: route.name,
                capacity: route.capacity,
                startTime: route.startTime,
                returnTime: route.returnTime,
                isActive: route.isActive,
            })
        } else {
            form.reset({
                name: "",
                capacity: 50,
                startTime: "",
                returnTime: "",
                isActive: true,
            })
        }
    }, [route, form, open])

    const onSubmit = async (values: RouteFormValues) => {
        setIsSubmitting(true)
        try {
            const url = route 
                ? `/api/admin/routes/${route.id}` 
                : "/api/admin/routes"
            const method = route ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!response.ok) throw new Error("Failed to save route")

            toast.success(route ? "Route updated successfully" : "Route created successfully")
            onSuccess()
            onOpenChange(false)
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{route ? "Edit Route" : "Create New Route"}</DialogTitle>
                        <DialogDescription>
                            Configure the details and schedule for this transportation route.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Main Info */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Route Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Signboard Route"
                                    {...form.register("name")}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-destructive font-medium">{form.formState.errors.name.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Configuration Box */}
                        <div className="grid gap-4 p-4 border rounded-md bg-muted/50">
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Capacity</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    placeholder="Max seats"
                                    {...form.register("capacity", { valueAsNumber: true })}
                                />
                                {form.formState.errors.capacity && (
                                    <p className="text-xs text-destructive font-medium">{form.formState.errors.capacity.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        {...form.register("startTime")}
                                    />
                                    {form.formState.errors.startTime && (
                                        <p className="text-xs text-destructive font-medium">{form.formState.errors.startTime.message}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="returnTime">Return Time</Label>
                                    <Input
                                        id="returnTime"
                                        type="time"
                                        {...form.register("returnTime")}
                                    />
                                    {form.formState.errors.returnTime && (
                                        <p className="text-xs text-destructive font-medium">{form.formState.errors.returnTime.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Switch */}
                        <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive" className="text-sm cursor-pointer">Active Status</Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Visible to students and open for tracking.
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={form.watch("isActive")}
                                onCheckedChange={(checked) => form.setValue("isActive", checked)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
                        <Button 
                            type="button"
                            variant="outline" 
                            onClick={() => onOpenChange(false)} 
                            className="gap-2 w-full sm:w-auto"
                        >
                            Cancel
                            <Kbd>Esc</Kbd>
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2 w-full sm:w-auto">
                            {isSubmitting && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            {route ? "Save Changes" : "Create Route"}
                            <Kbd>↵</Kbd>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
