import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { Toaster } from "react-hot-toast";
import { AppLayoutWrapper } from "@/components/shared/AppLayoutWrapper";
import { AuthFeedback } from "@/components/shared/AuthFeedback";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: {
    template: 'SurePlus | %s',
    default: 'SurePlus | Curated Surplus Iligan',
  },
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
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", inter.variable)}
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
              gutter={10}
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  maxWidth: '340px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backdropFilter: 'blur(8px)',
                },
                success: {
                  style: {
                    background: '#F0FDF4',
                    color: '#166534',
                    border: '1px solid #BBF7D0',
                  },
                  iconTheme: { primary: '#16a34a', secondary: '#F0FDF4' },
                },
                error: {
                  style: {
                    background: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  },
                  iconTheme: { primary: '#dc2626', secondary: '#FEF2F2' },
                },
                loading: {
                  style: {
                    background: '#FFFBEB',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                  },
                  iconTheme: { primary: '#d97706', secondary: '#FFFBEB' },
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
