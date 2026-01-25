import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let session = null;
  try {
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (sessionResponse.ok) {
      session = await sessionResponse.json();
    }
  } catch (error) {
    console.error("Middleware session fetch error:", error);
  }

  const { pathname } = request.nextUrl;
  const normalizedPathname = pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname;

  // Special case for verify-email: Only redirect to dashboard if ALREADY verified
  if (normalizedPathname === "/verify-email" && session) {
    if (session.user.emailVerified) {
      const role = session.user.role;
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "SUPERVISOR") {
        return NextResponse.redirect(new URL("/supervisor/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow access to login, signup, and password recovery pages for unauthenticated users
  const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  if (publicRoutes.includes(normalizedPathname)) {
    if (session) {
      // If authenticated, redirect to appropriate dashboard
      const role = session.user.role;
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "SUPERVISOR") {
        return NextResponse.redirect(new URL("/supervisor/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.user.role;

  // Role-based access control
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      // Redirect to appropriate dashboard
      if (role === "SUPERVISOR") {
        return NextResponse.redirect(new URL("/supervisor/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  } else if (pathname.startsWith("/supervisor")) {
    if (role !== "SUPERVISOR") {
      // Redirect to appropriate dashboard
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  } else if (pathname.startsWith("/dashboard")) {
    if (role !== "USER") {
      // Redirect to appropriate dashboard
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "SUPERVISOR") {
        return NextResponse.redirect(new URL("/supervisor/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
  ],
};