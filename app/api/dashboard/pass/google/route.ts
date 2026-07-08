import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { getPassState, getPassQrPayload } from "@/lib/pass"
import crypto from "crypto"

export const dynamic = "force-dynamic"

// Helper to sign JWT using Node's built-in crypto (RS256)
function signGoogleWalletJwt(payload: any, privateKeyPem: string): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url")
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url")

  const signer = crypto.createSign("RSA-SHA256")
  signer.update(`${base64Header}.${base64Payload}`)

  // Standard private keys from service accounts might contain escaped newlines
  const formattedKey = privateKeyPem.replace(/\\n/g, "\n")
  const signature = signer.sign(formattedKey, "base64url")

  return `${base64Header}.${base64Payload}.${signature}`
}

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

    // Check if Google Wallet credentials are provided
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const issuerId = process.env.GOOGLE_ISSUER_ID

    if (!serviceAccountEmail || !privateKey || !issuerId) {
      // Redirect to the interactive demo wallet page
      return NextResponse.redirect(new URL("/dashboard/pass/demo-wallet?wallet=google", baseUrl))
    }

    // Google Wallet strictly requires HTTPS URLs for all asset images (logos, hero images).
    // When running locally on HTTP localhost, we must fall back to a public HTTPS image.
    let logoUri = baseUrl.startsWith("https")
      ? `${baseUrl}/logo/email-logo.png`
      : "https://raw.githubusercontent.com/google-wallet/rest-samples/main/images/logo.png"

    // Google Wallet's crawler doesn't follow redirects. If using divupstudio.online, ensure we use the www. subdomain directly.
    if (logoUri.includes("divupstudio.online") && !logoUri.includes("www.divupstudio.online")) {
      logoUri = logoUri.replace("divupstudio.online", "www.divupstudio.online")
    }

    const qrPayload = getPassQrPayload(application as any, session.user.id)

    // Construct the GenericObject representation for Google Wallet
    const genericObject = {
      id: `${issuerId}.${application.id}`,
      classId: `${issuerId}.scholars_transit_pass`,
      state: "ACTIVE",
      logo: {
        sourceUri: {
          uri: logoUri,
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "Scholars Transit Logo",
          },
        },
      },
      cardTitle: {
        defaultValue: {
          language: "en-US",
          value: "Scholars Transit Hub",
        },
      },
      subheader: {
        defaultValue: {
          language: "en-US",
          value: "PASS ID",
        },
      },
      header: {
        defaultValue: {
          language: "en-US",
          value: passId,
        },
      },
      barcode: {
        type: "QR_CODE",
        value: qrPayload,
        alternateText: passId,
      },
      textModulesData: [
        {
          id: "rider",
          header: "RIDER NAME",
          body: application.fullName,
        },
        {
          id: "route",
          header: "ROUTE",
          body: application.route.name,
        },
        {
          id: "pickup",
          header: "PICKUP POINT",
          body: application.pickupPoint.name,
        },
        {
          id: "validity",
          header: "VALID UNTIL",
          body: billingEnd
            ? new Date(billingEnd).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A",
        },
      ],
    }

    // Define the full save payload (origins omitted for local redirection testing)
    const jwtPayload = {
      iss: serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      payload: {
        genericObjects: [genericObject],
      },
    }

    // Sign the JWT
    const jwtToken = signGoogleWalletJwt(jwtPayload, privateKey)
    const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`

    return NextResponse.redirect(saveUrl)
  } catch (error) {
    console.error("Error generating Google Wallet Link:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
