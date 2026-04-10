import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/shared/Navbar";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { AppLayoutWrapper } from "@/components/shared/AppLayoutWrapper";
import { AuthFeedback } from "@/components/shared/AuthFeedback";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RESERVE | Curated Surplus Iligan",
  description: "Exclusive access to end-of-day surplus inventory from Iligan City's top bakeries, cafes, and restaurants.",
};

import { SessionProvider } from "next-auth/react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  const navUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? "User",
        role: session.user.role,
      }
    : null;

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col noise-overlay">
        <NextTopLoader
          color="#1C1C1E"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #1C1C1E,0 0 5px #1C1C1E"
        />
        <SessionProvider session={session}>
          <ToastProvider>
            <Suspense fallback={null}>
              <AuthFeedback />
            </Suspense>
            <Navbar user={navUser} />
            <AppLayoutWrapper user={navUser}>
              <main className="flex-1 pt-20 w-full">{children}</main>
            </AppLayoutWrapper>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
