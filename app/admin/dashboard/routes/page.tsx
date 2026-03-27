"use client"

import * as React from "react"
import { IconPlus, IconLoader, IconRoute, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RouteDialog } from "@/components/admin/routes/route-dialog"
import { RouteCard } from "@/components/admin/routes/route-card"
import { PickupPointDialog } from "@/components/admin/routes/pickup-point-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function RoutesPage() {
    const [routes, setRoutes] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    
    // Route Dialog State
    const [isRouteDialogOpen, setIsRouteDialogOpen] = React.useState(false)
    const [selectedRoute, setSelectedRoute] = React.useState<any>(null)
    
    // Pickup Dialog State
    const [isPickupDialogOpen, setIsPickupDialogOpen] = React.useState(false)
    const [selectedPickup, setSelectedPickup] = React.useState<any>(null)
    const [activeRouteId, setActiveRouteId] = React.useState<string>("")
    
    // Delete Dialog State
    const [deleteConfig, setDeleteConfig] = React.useState<{ type: 'route' | 'pickup', data: any } | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const router = useRouter()

    const fetchRoutes = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/routes")
            if (response.ok) {
                const data = await response.json()
                setRoutes(data)
            }
        } catch {
            toast.error("Failed to load routes")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchRoutes()
    }, [])

    const handleDelete = async () => {
        if (!deleteConfig) return
        setIsDeleting(true)
        try {
            const url = deleteConfig.type === 'route' 
                ? `/api/admin/routes/${deleteConfig.data.id}` 
                : `/api/admin/pickups/${deleteConfig.data.id}`
            
            const response = await fetch(url, { method: "DELETE" })
            if (response.ok) {
                toast.success(`${deleteConfig.type === 'route' ? 'Route' : 'Pickup point'} deleted`)
                fetchRoutes()
                setDeleteConfig(null)
            } else {
                throw new Error()
            }
        } catch {
            toast.error("Failed to delete")
        } finally {
            setIsDeleting(false)
        }
    }

    const filteredRoutes = routes.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-1 flex-col gap-4">
            {/* Page Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Routes & Pickup Points</h1>
                    <p className="text-xs text-muted-foreground">Manage transportation routes and their stops.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-56">
                        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Search routes..." 
                            className="pl-8 h-9 text-xs border-border/50 bg-muted/40 focus:bg-background transition-all rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => {
                        setSelectedRoute(null)
                        setIsRouteDialogOpen(true)
                    }} size="sm" className="h-9 px-4 shadow-sm font-semibold rounded-lg text-xs gap-2">
                        <IconPlus className="h-3.5 w-3.5" /> Add Route
                    </Button>
                </div>
            </div>

            {/* Routes Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <IconLoader className="h-8 w-8 animate-spin text-primary opacity-50" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading routes...</p>
                </div>
            ) : filteredRoutes.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {filteredRoutes.map((route) => (
                        <RouteCard
                            key={route.id}
                            route={route}
                            onEdit={(r) => {
                                setSelectedRoute(r)
                                setIsRouteDialogOpen(true)
                            }}
                            onDelete={(r) => setDeleteConfig({ type: 'route', data: r })}
                            onAddPickup={(id) => {
                                setActiveRouteId(id)
                                setSelectedPickup(null)
                                setIsPickupDialogOpen(true)
                            }}
                            onEditPickup={(p) => {
                                setSelectedPickup(p)
                                setIsPickupDialogOpen(true)
                            }}
                            onDeletePickup={(p) => setDeleteConfig({ type: 'pickup', data: p })}
                            onReorder={() => fetchRoutes()}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-card border border-dashed rounded-3xl opacity-60">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                        <IconRoute className="h-8 w-8 opacity-20" />
                    </div>
                    <h3 className="text-lg font-semibold">No routes found</h3>
                    <p className="text-sm text-muted-foreground mt-2 text-center max-w-[300px]">
                        {searchQuery ? "No routes match your search criteria." : "Get started by creating your first transportation route."}
                    </p>
                    {searchQuery && (
                        <Button variant="link" className="mt-2" onClick={() => setSearchQuery("")}>
                            Clear search
                        </Button>
                    )}
                </div>
            )}

            {/* Dialogs */}
            <RouteDialog
                open={isRouteDialogOpen}
                onOpenChange={setIsRouteDialogOpen}
                onSuccess={fetchRoutes}
                route={selectedRoute}
            />

            <PickupPointDialog
                open={isPickupDialogOpen}
                onOpenChange={setIsPickupDialogOpen}
                onSuccess={fetchRoutes}
                routeId={activeRouteId}
                pickup={selectedPickup}
            />

            <AlertDialog open={!!deleteConfig} onOpenChange={(open) => !open && setDeleteConfig(null)}>
                <AlertDialogContent className="border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {deleteConfig?.type === 'route' ? 'route' : 'pickup point'} <span className="font-bold text-foreground">"{deleteConfig?.data?.name}"</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="border-none hover:bg-muted font-medium">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 border-none"
                        >
                            {isDeleting && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
