import type { NextAuthConfig } from "next-auth";
import { DefaultSession } from "next-auth";

// NextAuth v5 uses @auth/core/jwt for the JWT interface under the hood in some versions,
// or we can just extend via next-auth
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
    name: string;
    email: string;
  }
  interface Session {
    user: {
      id: string;
      role: "MERCHANT" | "CUSTOMER" | "ADMIN";
      name: string;
      email: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  }
}

// This file contains the NextAuth configuration that is Edge compatible.
// It is used in middleware.ts to avoid "crypto" module errors since Edge runtime
// does not support Node.js native modules like 'pg' or 'bcryptjs'.

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // the actual providers are added in auth.ts
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Protected routes that require authentication
      const protectedRoutes = ["/feed", "/merchant", "/reservations"];
      const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

      // Auth pages (login/register) — redirect away if already logged in
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/feed", nextUrl));
        }
        return true; // Allow unauthenticated users to see login/register
      }

      if (isProtected) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl));
        }

        // Role gate: only MERCHANT or ADMIN can access /merchant routes
        if (pathname.startsWith("/merchant")) {
          const role = auth?.user?.role;
          if (role !== "MERCHANT" && role !== "ADMIN") {
            return Response.redirect(new URL("/feed", nextUrl));
          }
        }

        return true;
      }

      return true; // Allow all other routes (home page, etc.)
    },
    async jwt({ token, user, trigger }) {
      // Upon signin, user object is available
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      
      // Refresh role from database on every request (for role changes)
      // This ensures merchants see their new role immediately after approval
      if (token.id && trigger !== "signIn") {
        try {
          // Dynamically import to avoid edge runtime issues
          const { findUserByEmailForAuth } = await import("./repositories/userRepository");
          const freshUser = await findUserByEmailForAuth(token.email as string);
          if (freshUser) {
            token.role = freshUser.role;
          }
        } catch (error) {
          console.error("[JWT Callback] Failed to refresh user role:", error);
          // Keep existing token role if refresh fails
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
