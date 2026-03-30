import crypto from "crypto"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { ensureDefaultFilesDocCategories } from "@/lib/files-doc-categories"
import prisma from "@/lib/prisma"

const FILES_FOLDER = "scholars-transit/files-and-docs"

const allowedTypes = [
  "application/pdf",
]

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return { cloudName, apiKey, apiSecret }
}

export async function GET() {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureDefaultFilesDocCategories()

    const files = await prisma.filesDoc.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        originalName: file.originalName,
        publicId: file.publicId,
        url: file.url,
        format: file.format,
        mimeType: file.mimeType,
        bytes: file.bytes,
        category: file.category,
        createdAt: file.createdAt.toISOString(),
        uploadedBy: file.uploadedBy?.name || "System",
      })),
      total: files.length,
    })
  } catch (error) {
    console.error("List Files Error:", error)
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const category = (formData.get("category") as string) || "General"

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    await ensureDefaultFilesDocCategories()

    const categoryExists = await prisma.filesDocCategory.findFirst({
      where: {
        name: {
          equals: category,
          mode: "insensitive",
        },
      },
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Please choose a valid document category" },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    const cloudinaryConfig = getCloudinaryConfig()
    if (!cloudinaryConfig) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      )
    }

    const { cloudName, apiKey, apiSecret } = cloudinaryConfig

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`
    const timestamp = Math.round(Date.now() / 1000)

    const params: Record<string, string> = {
      folder: FILES_FOLDER,
      timestamp: timestamp.toString(),
    }

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
    cloudinaryFormData.append("folder", FILES_FOLDER)

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
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

    const urlParts = String(result.secure_url || "").split("/")
    const uploadedFileName = urlParts[urlParts.length - 1] || file.name
    const derivedFormat = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "file"
      : String(result.format || "file").toLowerCase()

    const savedFile = await prisma.filesDoc.create({
      data: {
        fileName: uploadedFileName,
        originalName: file.name,
        publicId: result.public_id,
        url: result.secure_url,
        format: derivedFormat,
        mimeType: file.type,
        bytes: file.size,
        category: categoryExists.name,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        fileName: savedFile.fileName,
        originalName: savedFile.originalName,
        publicId: savedFile.publicId,
        url: savedFile.url,
        format: savedFile.format,
        mimeType: savedFile.mimeType,
        bytes: savedFile.bytes,
        category: savedFile.category,
        createdAt: savedFile.createdAt.toISOString(),
        uploadedBy: session.user.name || "Admin",
      },
    })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get("publicId")

    if (!publicId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      )
    }

    const cloudinaryConfig = getCloudinaryConfig()
    if (!cloudinaryConfig) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      )
    }

    const existingFile = await prisma.filesDoc.findUnique({
      where: {
        publicId,
      },
    })

    if (!existingFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    const { cloudName, apiKey, apiSecret } = cloudinaryConfig
    const timestamp = Math.round(Date.now() / 1000)
    const destroyParams: Record<string, string> = {
      public_id: publicId,
      timestamp: timestamp.toString(),
    }
    const signatureString = Object.entries(destroyParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&")
    const signature = crypto
      .createHash("sha1")
      .update(signatureString + apiSecret)
      .digest("hex")

    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("public_id", publicId)
    cloudinaryFormData.append("timestamp", timestamp.toString())
    cloudinaryFormData.append("api_key", apiKey)
    cloudinaryFormData.append("signature", signature)

    const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/destroy`
    const response = await fetch(destroyUrl, {
      method: "POST",
      body: cloudinaryFormData,
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Cloudinary delete error:", result)
      return NextResponse.json(
        { error: result.error?.message || "Failed to delete file" },
        { status: 500 }
      )
    }

    if (result.result && !["ok", "not found"].includes(result.result)) {
      console.error("Unexpected Cloudinary delete result:", result)
      return NextResponse.json(
        { error: "Failed to delete file from cloud storage" },
        { status: 500 }
      )
    }

    await prisma.filesDoc.delete({
      where: {
        publicId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Delete Error:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
}
