"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { IconLoader, IconCheck, IconPhone, IconRoute, IconUser, IconId, IconClock, IconCurrencyTaka, IconEdit } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn, formatDateShort } from "@/lib/utils"

const applicantTypes = [
  { value: "STUDENT", label: "Student" },
  { value: "ACADEMIC", label: "Academic Staff" },
  { value: "ADMINISTRATIVE", label: "Administrative Staff" },
]

// Phone verification component
function PhoneVerification({ 
  phone, 
  setPhone, 
  isVerified, 
  setIsVerified 
}: { 
  phone: string
  setPhone: (phone: string) => void
  isVerified: boolean
  setIsVerified: (verified: boolean) => void
}) {
  const [otp, setOtp] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [resendTimer, setResendTimer] = React.useState(0)

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [resendTimer])

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    
    setIsSending(true)
    
    try {
      const response = await fetch("/api/sms/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP")
      }

      toast.success("OTP sent to your phone")
      setResendTimer(60)
      setOtp("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast.error("Please enter the OTP")
      return
    }
    
    setIsVerifying(true)
    
    try {
      const response = await fetch("/api/sms/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify OTP")
      }

      setIsVerified(true)
      toast.success("Phone number verified!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconPhone className="h-4 w-4 text-muted-foreground" />
        <Label>Phone Number</Label>
        {isVerified && (
          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <IconCheck className="h-3 w-3" /> Verified
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        <Input
          type="tel"
          placeholder="+8801XXXXXXXXX"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setIsVerified(false)
          }}
          disabled={isVerified}
          className="flex-1"
        />
        {!isVerified && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSendOtp}
            disabled={isSending || resendTimer > 0}
          >
            {isSending ? (
              <IconLoader className="h-4 w-4 animate-spin" />
            ) : resendTimer > 0 ? (
              `${resendTimer}s`
            ) : (
              "Send OTP"
            )}
          </Button>
        )}
      </div>
      
      {!isVerified && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isVerifying || !otp}
          >
            {isVerifying ? (
              <IconLoader className="h-4 w-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Phone verification is required before submitting your application.
      </p>
    </div>
  )
}

// Route and pickup selection component
function RouteSelection({
  selectedRoute,
  setSelectedRoute,
  selectedPickup,
  setSelectedPickup,
  routes,
  loadingRoutes,
  setValue,
  applicantType,
}: {
  selectedRoute: string
  setSelectedRoute: (route: string) => void
  selectedPickup: string
  setSelectedPickup: (pickup: string) => void
  routes: any[]
  loadingRoutes: boolean
  setValue: (name: string, value: any, options?: Record<string, boolean>) => void
  applicantType: string
}) {
  const selectedRouteData = routes.find(r => r.id === selectedRoute)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconRoute className="h-4 w-4 text-muted-foreground" />
        <Label>Transport Selection</Label>
      </div>
      
      <Select
        value={selectedRoute}
        onValueChange={(value) => {
          setSelectedRoute(value)
          setSelectedPickup("")
          setValue("routeId", value, { shouldValidate: true })
        }}
        disabled={loadingRoutes}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loadingRoutes ? "Loading routes..." : "Select a route"} />
        </SelectTrigger>
        <SelectContent>
          {loadingRoutes ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : routes.filter(r => r.isActive).length > 0 ? (
            routes.filter(r => r.isActive).map((route) => (
              <SelectItem key={route.id} value={route.id}>
                {route.name}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-sm text-muted-foreground">
              No routes available
            </div>
          )}
        </SelectContent>
      </Select>
      
      {selectedRoute && selectedRouteData && selectedRouteData.pickupPoints.length > 0 && (
        <Select value={selectedPickup} onValueChange={(value) => {
          setSelectedPickup(value)
          setValue("pickupPointId", value, { shouldValidate: true })
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a pickup point" />
          </SelectTrigger>
          <SelectContent>
            {selectedRouteData.pickupPoints.map((point: any) => (
              <SelectItem key={point.id} value={point.id}>
                {point.name} {point.landmark && ` - ${point.landmark}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {applicantType === "STUDENT" && selectedRoute && selectedRouteData && selectedRouteData.fees > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Monthly Transport Fee</p>
          <p className="text-lg font-bold text-primary flex items-center gap-1">
            <IconCurrencyTaka className="h-5 w-5" />
            {selectedRouteData.fees.toLocaleString()} Tk
            <span className="text-xs font-normal text-muted-foreground">/ month</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Payment is required upfront via SSLCommerz to submit your application.
          </p>
        </div>
      )}
    </div>
  )
}

// Main form schema
const studentSchema = z.object({
  applicantType: z.enum(["STUDENT", "ACADEMIC", "ADMINISTRATIVE"]),
  fullName: z.string().min(2, "Full name is required"),
  department: z.string().min(1, "Department is required"),
  batch: z.string().min(1, "Batch is required"),
  studentId: z.string().min(1, "Student ID is required"),
  idCardUrl: z.string().min(1, "ID Card photo is required"),
  routeId: z.string().min(1, "Route is required"),
  pickupPointId: z.string().min(1, "Pickup point is required"),
})

const staffSchema = z.object({
  applicantType: z.enum(["STUDENT", "ACADEMIC", "ADMINISTRATIVE"]),
  fullName: z.string().min(2, "Full name is required"),
  department: z.string().min(1, "Department is required"),
  idCardUrl: z.string().min(1, "ID Card photo is required"),
  routeId: z.string().min(1, "Route is required"),
  pickupPointId: z.string().min(1, "Pickup point is required"),
})

type StudentFormData = z.infer<typeof studentSchema>
type StaffFormData = z.infer<typeof staffSchema>

export default function ApplyPage() {
  const router = useRouter()
  const [applicantType, setApplicantType] = React.useState<string>("STUDENT")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const [isPhoneVerified, setIsPhoneVerified] = React.useState(false)
  const [selectedRoute, setSelectedRoute] = React.useState("")
  const [selectedPickup, setSelectedPickup] = React.useState("")
  const [idCardUrl, setIdCardUrl] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [routes, setRoutes] = React.useState<any[]>([])
  const [loadingRoutes, setLoadingRoutes] = React.useState(true)
  const [existingApplication, setExistingApplication] = React.useState<any>(null)
  const [loadingApplication, setLoadingApplication] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)

  // Fetch routes from API on mount
  React.useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch("/api/routes/public")
        const data = await response.json()
        if (response.ok) {
          setRoutes(data.routes || [])
        }
      } catch {
      } finally {
        setLoadingRoutes(false)
      }
    }
    fetchRoutes()
  }, [])

  // Fetch existing application on mount
  React.useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch("/api/applications")
        const data = await response.json()
        if (response.ok && data.application) {
          setExistingApplication(data.application)
        }
      } catch {
      } finally {
        setLoadingApplication(false)
      }
    }
    fetchApplication()
  }, [])

  const schema = applicantType === "STUDENT" ? studentSchema : staffSchema

  const { register, handleSubmit, setValue, formState: { errors }, trigger } = useForm<any>({
    resolver: zodResolver(schema),
    mode: "onBlur"
  })

  const onError = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message as string);
    } else {
      toast.error("Please fill all required fields correctly");
    }
  }

  const onSubmit = async (data: any) => {
    if (!isPhoneVerified) {
      toast.error("Please verify your phone number")
      return
    }

    if (!selectedRoute) {
      toast.error("Please select a route")
      return
    }

    if (!selectedPickup) {
      toast.error("Please select a pickup point")
      return
    }

    if (!idCardUrl) {
      toast.error("Please upload your ID card photo")
      return
    }

    setIsSubmitting(true)
    const body = {
      ...data,
      phone,
      phoneVerified: isPhoneVerified,
    }
    if (applicantType !== "STUDENT") {
      delete body.batch
      delete body.studentId
    }
    try {
      if (isEditing) {
        const delRes = await fetch("/api/applications", { method: "DELETE" })
        if (!delRes.ok) {
          throw new Error("Failed to clear previous application for edit")
        }
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application")
      }

      // Redirect to SSLCommerz payment gateway
      if (result.paymentUrl) {
        toast.success("Redirecting to payment gateway...")
        window.location.href = result.paymentUrl
      } else {
        toast.success("Application submitted successfully!")
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function for 12-hour time format
  const formatTime12h = (time: string) => {
    if (!time) return "--:--"
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {!loadingApplication && (!existingApplication || isEditing) && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply for Transport Pass</h1>
          <p className="text-muted-foreground">Complete the form below to apply for your transport pass.</p>
        </div>
      )}

      {loadingApplication ? (
        <div className="flex items-center justify-center h-64">
          <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : existingApplication && !isEditing ? (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header Section */}
                <div className="bg-primary/5 p-6 border-b">
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={existingApplication.user?.image || ""} />
                      <AvatarFallback>
                        <IconUser className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold truncate">{existingApplication.fullName}</h2>
                      <p className="text-sm text-muted-foreground truncate">
                        {existingApplication.applicantType === "STUDENT" ? "Student" : existingApplication.applicantType === "ACADEMIC" ? "Academic Staff" : "Administrative Staff"}
                        {existingApplication.batch && ` • ${existingApplication.batch} Batch`}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{existingApplication.department}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`
                        ${existingApplication.status === "APPROVED" ? "bg-primary/15 text-primary border-primary/25" : ""}
                        ${existingApplication.status === "REJECTED" ? "bg-destructive/15 text-destructive border-destructive/25" : ""}
                        ${existingApplication.status === "WAITLIST" ? "bg-muted text-muted-foreground border-border" : ""}
                        ${existingApplication.status === "PENDING_PAYMENT" ? "bg-amber-500/15 text-amber-700 border-amber-500/25" : ""}
                      `}
                    >
                      {existingApplication.status}
                    </Badge>
                    {existingApplication.phoneVerified && (
                      <Badge variant="default" className="gap-1">
                        <IconCheck className="h-3 w-3" />
                        Phone Verified
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <IconClock className="h-3 w-3" />
                      {formatDateShort(existingApplication.createdAt)}
                    </Badge>
                    {existingApplication.status === "APPROVED" && existingApplication.passNumber && (
                      <Badge variant="outline" className="gap-1">
                        <IconId className="h-3 w-3" />
                        {existingApplication.passNumber}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-6">
                  {existingApplication.idCardUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">ID Card</Label>
                      <div className="border rounded-lg bg-muted/30 p-4">
                        <img
                          src={existingApplication.idCardUrl}
                          alt="ID Card"
                          className="max-w-full h-auto rounded-lg mx-auto"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {existingApplication.applicantType === "STUDENT" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Batch</Label>
                          <p className="text-sm font-medium">{existingApplication.batch || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Student ID</Label>
                          <p className="text-sm font-medium">{existingApplication.studentId || "—"}</p>
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm font-medium">{existingApplication.phone}</p>
                    </div>
                  </div>

                  {existingApplication.route && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Route</Label>
                        <p className="text-sm font-medium">{existingApplication.route.name}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Pickup Point</Label>
                        <p className="text-sm font-medium">{existingApplication.pickupPoint?.name || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Morning Trip</Label>
                        <p className="text-sm font-medium">{formatTime12h(existingApplication.route.startTime)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Return Trip</Label>
                        <p className="text-sm font-medium">{formatTime12h(existingApplication.route.returnTime)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="p-6 border-t bg-muted/20 flex flex-col gap-3">
                  {existingApplication.status === "PENDING_PAYMENT" && existingApplication.payments?.some((p: any) => p.status === "PENDING") && (
                    <Button 
                      className="w-full" 
                      onClick={async () => {
                        try {
                          const pendingPayment = existingApplication.payments.find((p: any) => p.status === "PENDING");
                          toast.loading("Initiating payment...", { id: "payment" });
                          const res = await fetch("/api/payments/initiate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ paymentId: pendingPayment.id })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
                          toast.success("Redirecting to payment gateway...", { id: "payment" });
                          window.location.href = data.paymentUrl;
                        } catch (error: any) {
                          toast.error(error.message, { id: "payment" });
                        }
                      }}
                    >
                      <IconCurrencyTaka className="mr-2 h-4 w-4" />
                      Complete Payment
                    </Button>
                  )}
                  {existingApplication.status === "PENDING_PAYMENT" && (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        setApplicantType(existingApplication.applicantType)
                        setPhone(existingApplication.phone)
                        setIsPhoneVerified(existingApplication.phoneVerified)
                        setSelectedRoute(existingApplication.routeId)
                        setSelectedPickup(existingApplication.pickupPointId)
                        setIdCardUrl(existingApplication.idCardUrl)
                        
                        const fields = ['fullName', 'department', 'batch', 'studentId', 'applicantType', 'idCardUrl', 'routeId', 'pickupPointId']
                        fields.forEach(field => {
                          if (existingApplication[field]) {
                            setValue(field, existingApplication[field])
                          }
                        })
                        
                        setIsEditing(true)
                      }}
                    >
                      <IconEdit className="mr-2 h-4 w-4" />
                      Edit Application
                    </Button>
                  )}
                  <Button className="w-full" variant={existingApplication.status === "PENDING_PAYMENT" ? "ghost" : "default"} onClick={() => router.push("/dashboard/pass")}>
                    <IconId className="mr-2 h-4 w-4" />
                    View My Pass
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        <input type="hidden" {...register("department")} />
        <input type="hidden" {...register("routeId")} />
        <input type="hidden" {...register("pickupPointId")} />
        {/* Section 1: Apply As */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Apply As
            </CardTitle>
            <CardDescription>Select your applicant type to see the required fields.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={applicantType}
              onValueChange={(value) => {
                setApplicantType(value)
                setIsPhoneVerified(false)
                setPhone("")
                setValue("applicantType", value)
              }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {applicantTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="cursor-pointer">{type.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <input type="hidden" {...register("applicantType")} value={applicantType} />
          </CardContent>
        </Card>

        {/* Section 2: Identity & Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconId className="h-5 w-5" />
              Identity Information
            </CardTitle>
            <CardDescription>
              {applicantType === "STUDENT" 
                ? "Enter your student details for verification."
                : "Enter your staff details for verification."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="As per official records"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message as string}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <input type="hidden" {...register("department")} />
                <Select onValueChange={(value) => setValue("department", value, { shouldValidate: true })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                    <SelectItem value="EEE">Electrical & Electronic Engineering</SelectItem>
                    <SelectItem value="BBA">Business Administration</SelectItem>
                    <SelectItem value="ENG">English</SelectItem>
                    <SelectItem value="ARC">Architecture</SelectItem>
                    <SelectItem value="IPE">Industrial & Production Engineering</SelectItem>
                    <SelectItem value="FT">Food Technology & Nutritional Science</SelectItem></SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-destructive">{errors.department.message as string}</p>
                )}
              </div>
            </div>

            {applicantType === "STUDENT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Input 
                    id="batch" 
                    placeholder="e.g., 10th"
                    {...register("batch")}
                  />
                  {errors.batch && (
                    <p className="text-sm text-destructive">{errors.batch.message as string}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="e.g., 212010158"
                    {...register("studentId")}
                  />
                  {errors.studentId && (
                    <p className="text-sm text-destructive">{errors.studentId.message as string}</p>
                  )}
                </div>
              </div>
            )}

            {/* Phone Verification */}
            <PhoneVerification 
              phone={phone}
              setPhone={setPhone}
              isVerified={isPhoneVerified}
              setIsVerified={setIsPhoneVerified}
            />

            <div className="space-y-2">
              <Label>ID Card Photo</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // Validate file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
                    if (!allowedTypes.includes(file.type)) {
                      toast.error('Only JPEG, PNG, and WebP images are allowed')
                      return
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('File size must be less than 5MB')
                      return
                    }

                    const formData = new FormData()
                    formData.append('file', file)

                    toast.loading('Uploading...')

                    try {
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      })

                      const result = await response.json()

                      if (!response.ok) {
                        throw new Error(result.error || 'Upload failed')
                      }

                      setIdCardUrl(result.url)
                      setValue("idCardUrl", result.url, { shouldValidate: true })
                      toast.dismiss()
                      toast.success('ID card uploaded successfully!')
                    } catch (error: any) {
                      toast.dismiss()
                      toast.error(error.message || 'Upload failed')
                    }
                  }}
                />
                {idCardUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={idCardUrl} 
                      alt="ID Card Preview" 
                      className="h-32 object-contain rounded-lg border bg-muted/30 p-2"
                    />
                    <p className="text-sm text-primary font-medium">Photo uploaded!</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <IconId className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Upload your ID card photo (front side)
                    </p>
                    <Button type="button" variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </div>
                )}
                <input 
                  type="hidden" 
                  {...register("idCardUrl")} 
                />
              </div>
              {errors.idCardUrl && (
                <p className="text-sm text-destructive">{errors.idCardUrl.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Transport Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Transport Selection
            </CardTitle>
            <CardDescription>Choose your preferred route and pickup point.</CardDescription>
          </CardHeader>
          <CardContent>
            <input type="hidden" {...register("routeId")} />
            <input type="hidden" {...register("pickupPointId")} />
            <RouteSelection
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              selectedPickup={selectedPickup}
              setSelectedPickup={setSelectedPickup}
              routes={routes}
              loadingRoutes={loadingRoutes}
              setValue={setValue}
              applicantType={applicantType}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isPhoneVerified}>
            {isSubmitting ? (
              <>
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {applicantType === "STUDENT" ? (
                  <>
                    <IconCurrencyTaka className="mr-1 h-4 w-4" />
                    {selectedRoute && routes.find(r => r.id === selectedRoute)?.fees
                      ? `Pay ৳${routes.find(r => r.id === selectedRoute)?.fees.toLocaleString()} & Apply`
                      : "Pay & Apply"
                    }
                  </>
                ) : (
                  "Submit Application"
                )}
              </>
            )}
          </Button>
        </div>
      </form>
      )}
    </div>
  )
}
