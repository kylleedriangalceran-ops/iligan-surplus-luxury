import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { Toaster } from "react-hot-toast";
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
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      style={{ scrollBehavior: 'smooth' }}
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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1C1C1E',
                  color: '#FAF9F6',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  borderRadius: '4px',
                  padding: '14px 18px',
                  boxShadow: '0 8px 32px rgba(28,28,30,0.25)',
                  border: '1px solid rgba(250,249,246,0.08)',
                  maxWidth: '380px',
                },
                success: {
                  iconTheme: { primary: '#D4AF37', secondary: '#1C1C1E' },
                },
                error: {
                  iconTheme: { primary: '#FAF9F6', secondary: '#1C1C1E' },
                },
              }}
            />
            <Suspense fallback={null}>
              <AuthFeedback />
            </Suspense>
            <AppLayoutWrapper user={navUser}>
              {children}
            </AppLayoutWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
