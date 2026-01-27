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
        } catch (error) {
            toast.error("Something went wrong")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <IconRoute className="h-6 w-6 text-primary" />
                            </div>
                            {route ? "Edit Route" : "Add Route"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {route ? "Update route details and schedule." : "Create a new transport route."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Route Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Signboard Route"
                                className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-slate-50/50"
                                {...form.register("name")}
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive font-medium ml-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="capacity" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Capacity</Label>
                            <Input
                                id="capacity"
                                type="number"
                                className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-slate-50/50"
                                {...form.register("capacity", { valueAsNumber: true })}
                            />
                            {form.formState.errors.capacity && (
                                <p className="text-xs text-destructive font-medium ml-1">{form.formState.errors.capacity.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-slate-50/50"
                                    {...form.register("startTime")}
                                />
                                {form.formState.errors.startTime && (
                                    <p className="text-xs text-destructive font-medium ml-1">{form.formState.errors.startTime.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="returnTime" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Return Time</Label>
                                <Input
                                    id="returnTime"
                                    type="time"
                                    className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-slate-50/50"
                                    {...form.register("returnTime")}
                                />
                                {form.formState.errors.returnTime && (
                                    <p className="text-xs text-destructive font-medium ml-1">{form.formState.errors.returnTime.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Status</Label>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Enable or disable this route for students.
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={form.watch("isActive")}
                                onCheckedChange={(checked) => form.setValue("isActive", checked)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="rounded-xl h-12 font-bold text-slate-500"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                            {isSubmitting && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            {route ? "Save Changes" : "Create Route"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
