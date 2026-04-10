import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAdminStats,
  getAllUsers,
  getPendingApplications,
  getLiveDrops,
  getGlobalSettings,
} from "@/lib/repositories/adminRepository";
import { PendingApplicationsTable } from "@/components/admin/PendingApplicationsTable";
import { LiveDropsTable } from "@/components/admin/LiveDropsTable";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { GlobalSettingsPanel } from "@/components/admin/GlobalSettingsPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [stats, users, applications, drops, settings] = await Promise.all([
    getAdminStats(),
    getAllUsers(),
    getPendingApplications(),
    getLiveDrops(),
    getGlobalSettings(),
  ]);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "users" },
    { label: "Customers", value: stats.totalCustomers, icon: "customer" },
    { label: "Merchants", value: stats.totalMerchants, icon: "merchant" },
    { label: "Live Drops", value: stats.totalListings, icon: "listing" },
    { label: "Reservations", value: stats.totalReservations, icon: "reservation" },
    { label: "Pending Pickups", value: stats.pendingReservations, icon: "pending", accent: true },
  ];

  return (
    <div className="min-h-screen py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#1C1C1E] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-light tracking-[0.1em] uppercase">
                Admin Console
              </h1>
            </div>
          </div>
          <p className="text-sm text-[#1C1C1E]/60 uppercase tracking-widest ml-11">
            Platform Overview · Merchant Vetting · User Control
          </p>
        </div>

        {/* ─── Marketplace Pulse ─── */}
        <section className="mb-16">
          <SectionHeader
            title="Marketplace Pulse"
            subtitle="Live platform metrics"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`border bg-[#FAF9F6] p-5 flex flex-col items-center text-center transition-shadow hover:shadow-sm ${
                  stat.accent
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-[#1C1C1E]/10"
                }`}
              >
                <span className={`text-2xl font-light tracking-tight ${stat.accent ? "text-amber-600" : "text-[#1C1C1E]"}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold mt-2">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Merchant Vetting ─── */}
        <section className="mb-16">
          <SectionHeader
            title="Merchant Vetting"
            subtitle={`${applications.length} pending application${applications.length !== 1 ? "s" : ""}`}
            badge={applications.length > 0 ? applications.length : undefined}
          />
          <PendingApplicationsTable applications={applications} />
        </section>

        {/* ─── Live Drops ─── */}
        <section className="mb-16">
          <SectionHeader
            title="Live Drops"
            subtitle={`${drops.length} active surplus listing${drops.length !== 1 ? "s" : ""}`}
          />
          <LiveDropsTable drops={drops} />
        </section>

        {/* ─── User Management ─── */}
        <section className="mb-16">
          <SectionHeader
            title="User Management"
            subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
          />
          <AdminUserManagement users={users} sessionUserId={session.user.id} />
        </section>

        {/* ─── Global Settings ─── */}
        <section className="mb-16">
          <SectionHeader
            title="Global Settings"
            subtitle="Platform-wide configuration"
          />
          <GlobalSettingsPanel settings={settings} />
        </section>
      </div>
    </div>
  );
}

// ─── Reusable Section Header ─────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1C1E]">
            {title}
          </h2>
          {badge && badge > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-amber-500 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 mt-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
