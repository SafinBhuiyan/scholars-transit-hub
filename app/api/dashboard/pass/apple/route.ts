import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { getPassState, getPassQrPayload } from "@/lib/pass"
import { PKPass } from "passkit-generator"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

    if (!session) {
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    // Get active transport application
    const application = await prisma.transportApplication.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        route: true,
        pickupPoint: true,
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!application) {
      return NextResponse.redirect(new URL("/dashboard/pass", baseUrl))
    }

    const { isPassActive, passId, billingEnd } = getPassState(application as any)

    if (!isPassActive) {
      return NextResponse.redirect(new URL("/dashboard/pass", baseUrl))
    }

    // Check if Apple Wallet certificates are present in environment variables
    const hasCerts =
      process.env.APPLE_PASS_CERTIFICATE &&
      process.env.APPLE_PASS_PRIVATE_KEY &&
      process.env.APPLE_PASS_WWDR_CA &&
      process.env.APPLE_PASS_TYPE_IDENTIFIER &&
      process.env.APPLE_TEAM_IDENTIFIER

    if (!hasCerts) {
      // Direct redirect to the interactive demo wallet page
      return NextResponse.redirect(new URL("/dashboard/pass/demo-wallet?wallet=apple", baseUrl))
    }

    // Decrypt / parse certificate buffers from Base64 env variables
    const wwdr = Buffer.from(process.env.APPLE_PASS_WWDR_CA!, "base64")
    const signerCert = Buffer.from(process.env.APPLE_PASS_CERTIFICATE!, "base64")
    const signerKey = Buffer.from(process.env.APPLE_PASS_PRIVATE_KEY!, "base64")
    const keyPassphrase = process.env.APPLE_PASS_KEY_PASSPHRASE || ""

    // Create the PKPass instance with empty initial buffers, certificates, and metadata properties
    const pass = new PKPass(
      {},
      {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: keyPassphrase,
      },
      {
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER!,
        teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER!,
        organizationName: "Scholars Transit",
        sharingProhibited: true,
        logoText: "Scholars Transit Hub",
        foregroundColor: "rgb(17, 24, 39)", // Dark charcoal text
        backgroundColor: "rgb(243, 244, 246)", // Cool light grey background
        labelColor: "rgb(107, 114, 128)", // Muted labels
      }
    )

    // Set the pass type to generic
    pass.type = "generic"

    // Barcode containing the verification data
    const qrPayload = getPassQrPayload(application as any, session.user.id)
    pass.setBarcodes({
      message: qrPayload,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: passId,
    })

    // Header Field
    pass.headerFields.push({
      key: "status",
      label: "STATUS",
      value: "ACTIVE",
    })

    // Primary Field
    pass.primaryFields.push({
      key: "rider",
      label: "RIDER NAME",
      value: application.fullName,
    })

    // Secondary Fields
    pass.secondaryFields.push({
      key: "pass-id",
      label: "PASS ID",
      value: passId,
    })
    pass.secondaryFields.push({
      key: "id-number",
      label: application.applicantType === "STUDENT" ? "STUDENT ID" : "STAFF ID",
      value: application.studentId || "N/A",
    })

    // Auxiliary Fields
    pass.auxiliaryFields.push({
      key: "route",
      label: "ASSIGNED ROUTE",
      value: application.route.name,
    })
    pass.auxiliaryFields.push({
      key: "pickup",
      label: "PICKUP POINT",
      value: application.pickupPoint.name,
    })
    if (billingEnd) {
      pass.auxiliaryFields.push({
        key: "expiry",
        label: "EXPIRY DATE",
        value: new Date(billingEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })
    }

    // Back Fields
    pass.backFields.push({
      key: "rules",
      label: "Usage rules",
      value: "This transport pass is issued by the University Transport Office. It is non-transferable and must be verified by the conductor upon boarding.",
    })
    pass.backFields.push({
      key: "support",
      label: "Support",
      value: "For support, route changes, or billing queries, visit the Scholars Transit Hub support portal.",
    })

    // Load assets (images) dynamically from public folder
    const publicDir = path.join(process.cwd(), "public")
    const logoPath = path.join(publicDir, "logo", "email-logo.png")
    const iconPath = path.join(publicDir, "apple-icon.png")

    if (fs.existsSync(logoPath)) {
      pass.addBuffer("logo.png", fs.readFileSync(logoPath))
      pass.addBuffer("logo@2x.png", fs.readFileSync(logoPath))
    }
    if (fs.existsSync(iconPath)) {
      pass.addBuffer("icon.png", fs.readFileSync(iconPath))
      pass.addBuffer("icon@2x.png", fs.readFileSync(iconPath))
    }

    // Compile pass
    const passBuffer = await pass.getAsBuffer()

    return new Response(new Uint8Array(passBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="scholars_pass_${passId}.pkpass"`,
      },
    })
  } catch (error) {
    console.error("Error generating Apple Wallet Pass:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
