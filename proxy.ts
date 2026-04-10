import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isMerchantRoute = nextUrl.pathname.startsWith("/(merchant)") || nextUrl.pathname.startsWith("/dashboard");
  const isCustomerRoute = nextUrl.pathname.startsWith("/(customer)") || nextUrl.pathname.startsWith("/feed");

  // Protect paths requiring login
  if (isMerchantRoute || isCustomerRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (role === "CUSTOMER" && isMerchantRoute) {
      return NextResponse.redirect(new URL("/feed", nextUrl));
    }

    if (role === "MERCHANT" && isCustomerRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
