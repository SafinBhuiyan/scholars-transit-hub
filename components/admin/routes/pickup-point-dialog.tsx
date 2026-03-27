"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { IconLoader, IconMapPin } from "@tabler/icons-react"

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

const pickupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    landmark: z.string().optional(),
    isActive: z.boolean(),
})

type PickupFormValues = z.infer<typeof pickupSchema>

interface PickupPointDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    routeId?: string
    pickup?: any // Existing pickup for editing
}

export function PickupPointDialog({
    open,
    onOpenChange,
    onSuccess,
    routeId,
    pickup
}: PickupPointDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<PickupFormValues>({
        resolver: zodResolver(pickupSchema),
        defaultValues: {
            name: "",
            landmark: "",
            isActive: true,
        },
    })

    React.useEffect(() => {
        if (pickup) {
            form.reset({
                name: pickup.name,
                landmark: pickup.landmark || "",
                isActive: pickup.isActive ?? true,
            })
        } else {
            form.reset({
                name: "",
                landmark: "",
                isActive: true,
            })
        }
    }, [pickup, form, open])

    const onSubmit = async (values: PickupFormValues) => {
        setIsSubmitting(true)
        try {
            const url = pickup 
                ? `/api/admin/pickups/${pickup.id}` 
                : `/api/admin/routes/${routeId}/pickups`
            const method = pickup ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!response.ok) throw new Error("Failed to save pickup point")

            toast.success(pickup ? "Pickup point updated" : "Pickup point added")
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
                        <DialogTitle>{pickup ? "Edit Stop" : "Add New Stop"}</DialogTitle>
                        <DialogDescription>
                            Enter the name and landmark for this pickup point.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Main Info */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pickup-name">Pickup Name</Label>
                                <Input
                                    id="pickup-name"
                                    placeholder="e.g. Matuail"
                                    {...form.register("name")}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-destructive font-medium">{form.formState.errors.name.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Additional Info Box */}
                        <div className="grid gap-4 p-4 border rounded-md bg-muted/50">
                            <div className="grid gap-2">
                                <Label htmlFor="landmark">Landmark (Optional)</Label>
                                <Input
                                    id="landmark"
                                    placeholder="e.g. Near Overbridge"
                                    {...form.register("landmark")}
                                />
                                <p className="text-[10px] text-muted-foreground px-1">
                                    A specific point to help students identify the stop.
                                </p>
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
                            {pickup ? "Save Changes" : "Add Stop"}
                            <Kbd>↵</Kbd>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
