import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    const timestamp = Math.round(Date.now() / 1000)

    // Build params for signature - must include all params sent to Cloudinary
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: "scholars-transit/id-cards",
    }

    // Create signature string (sorted alphabetically)
    const signatureString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&")

    const signature = crypto
      .createHash("sha1")
      .update(signatureString + apiSecret)
      .digest("hex")

    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("file", dataUri)
    cloudinaryFormData.append("api_key", apiKey)
    cloudinaryFormData.append("timestamp", timestamp.toString())
    cloudinaryFormData.append("signature", signature)
    cloudinaryFormData.append("folder", "scholars-transit/id-cards")

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Cloudinary upload error:", result)
      return NextResponse.json(
        { error: result.error?.message || "Failed to upload to Cloudinary" },
        { status: 500 }
      )
    }

    // Return the secure URL from Cloudinary
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
