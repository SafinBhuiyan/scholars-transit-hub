import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const applications = await prisma.transportApplication.findMany({
      where: {
        idCardUrl: {
          not: "",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        applicantType: true,
        studentId: true,
        department: true,
        idCardUrl: true,
        createdAt: true,
      },
    })

    const images = applications.map((application) => {
      const urlParts = application.idCardUrl.split("/")
      const fileName = urlParts[urlParts.length - 1] || application.id
      const format = fileName.includes(".") ? fileName.split(".").pop() || "image" : "image"

      return {
        id: application.id,
        publicId: `transport_application/${application.id}`,
        url: application.idCardUrl,
        format,
        width: null,
        height: null,
        bytes: 0,
        createdAt: application.createdAt.toISOString(),
        applicantName: application.fullName,
        applicantType: application.applicantType,
        studentId: application.studentId,
        department: application.department,
        fileName,
      }
    })

    return NextResponse.json({
      success: true,
      images,
      total: images.length,
    })
  } catch (error) {
    console.error("List Images Error:", error)
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    )
  }
}
