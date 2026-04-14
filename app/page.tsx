import React, { Suspense } from "react";
import Link from "next/link";
import { AnimatedButton } from "@/components/shared/AnimatedButton";
import { LuxuryItemCard } from "@/components/shared/LuxuryItemCard";
import { SkeletonCard } from "@/components/shared/Skeletons";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/* Static showcase items for the landing page */
const SHOWCASE_ITEMS = [
  {
    title: "Artisan Sourdough Loaf",
    merchant: "The Larder",
    originalPrice: 250,
    surplusPrice: 125,
    availableCount: 3,
  },
  {
    title: "Assorted French Pastries",
    merchant: "Café De Iligan",
    originalPrice: 600,
    surplusPrice: 300,
    availableCount: 1,
  },
  {
    title: "Slow-Roasted Beef Sandwich",
    merchant: "Uptown Deli",
    originalPrice: 350,
    surplusPrice: 175,
    availableCount: 4,
  },
  {
    title: "Matcha Basque Cheesecake",
    merchant: "Pâtisserie Blanche",
    originalPrice: 1200,
    surplusPrice: 600,
    availableCount: 2,
  },
];

/* Skeleton grid shown while items lazy-load */
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}

/* The actual item grid — wrapped in Suspense */
function CardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {SHOWCASE_ITEMS.map((item, index) => {
        const redirectToLogin = async () => {
          "use server";
          redirect("/login");
        };

        return (
          <LuxuryItemCard
            key={item.title}
            title={item.title}
            merchant={item.merchant}
            storeId=""
            originalPrice={item.originalPrice}
            surplusPrice={item.surplusPrice}
            availableCount={item.availableCount}
            index={index}
            action={redirectToLogin}
          />
        );
      })}
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else if (session.user.role === "MERCHANT") {
      redirect("/dashboard");
    } else {
      redirect("/feed");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center justify-center min-h-[65vh] max-w-4xl mx-auto space-y-8 px-6 lg:px-12">
        <div className="space-y-4">
          <p className="uppercase tracking-[0.3em] text-xs font-semibold text-muted-foreground">
            Iligan City • Exclusive Access
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-foreground leading-[1.1]">
            Curated Surplus, <br /> Reserved for You.
          </h1>
        </div>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
          Gain exclusive access to end-of-day culinary surplus from Iligan City&apos;s finest bakeries and cafes. High-quality items, limited availability.
        </p>

        <div className="pt-8">
          <Link href="/register">
            <AnimatedButton variant="primary">
              Get Started
            </AnimatedButton>
          </Link>
        </div>
      </section>

      {/* Featured Drops Section */}
      <section className="w-full mt-24 lg:mt-32 px-6 lg:px-12 container mx-auto pb-16">
        <div className="flex items-end justify-between mb-10 border-b border-border/40 pb-4">
          <h2 className="text-2xl tracking-tight font-medium">Select Drops</h2>
          <Link href="/feed" className="text-xs uppercase tracking-widest font-semibold hover:text-muted-foreground transition-colors">
            View All
          </Link>
        </div>

        <Suspense fallback={<CardGridSkeleton />}>
          <CardGrid />
        </Suspense>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-24 lg:py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl tracking-tight font-medium text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Browse Drops",
                desc: "Discover curated surplus items from Iligan's top merchants at exclusive prices.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Reserve Instantly",
                desc: "Lock in your items with a single tap. Receive a unique pickup code instantly.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Pick Up & Enjoy",
                desc: "Visit the merchant during the pickup window. Show your code and claim your order.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4 12 14.01l-3-3" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1C1C1E]/[0.04] border border-[#1C1C1E]/10 flex items-center justify-center text-[#1C1C1E]/50">
                  {item.icon}
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                  Step {item.step}
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-widest">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-foreground text-background py-16 mt-20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="font-sans text-xl font-medium tracking-tight mb-4">RESERVE.</div>
            <p className="text-sm font-light text-background/60 max-w-xs">
              Redefining surplus rescue in Iligan City with curated excess from top-tier culinary artists.
            </p>
          </div>
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-4">
              <span className="uppercase tracking-widest text-xs font-semibold text-background/40">Explore</span>
              <Link href="/feed" className="hover:text-background/80 transition-colors">Drops</Link>
              <Link href="/register" className="hover:text-background/80 transition-colors">Join</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="uppercase tracking-widest text-xs font-semibold text-background/40">Legal</span>
              <a href="#" className="hover:text-background/80 transition-colors">Terms</a>
              <a href="#" className="hover:text-background/80 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
