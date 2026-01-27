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

const pickupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    landmark: z.string().optional(),
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
        },
    })

    React.useEffect(() => {
        if (pickup) {
            form.reset({
                name: pickup.name,
                landmark: pickup.landmark || "",
            })
        } else {
            form.reset({
                name: "",
                landmark: "",
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
        } catch (error) {
            toast.error("Something went wrong")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <IconMapPin className="h-6 w-6 text-primary" />
                            </div>
                            {pickup ? "Edit Stop" : "Add Stop"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {pickup ? "Update the name or landmark for this stop." : "Add a new stop to this route."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="pickup-name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Pickup Name</Label>
                            <Input
                                id="pickup-name"
                                placeholder="e.g. Matuail"
                                className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-slate-50/50"
                                {...form.register("name")}
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive font-medium ml-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="landmark" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Landmark (Optional)</Label>
                            <Input
                                id="landmark"
                                placeholder="e.g. Near Overbridge"
                                className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-slate-50/50"
                                {...form.register("landmark")}
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
                            {pickup ? "Save Changes" : "Add Point"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
