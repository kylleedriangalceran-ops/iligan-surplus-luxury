"use client";

import React from "react";
import { CustomerImpactRings } from "./CustomerImpactRings";
import { TopItemsChart } from "./TopItemsChart";
import { PlatformGrowthArea } from "./PlatformGrowthArea";
import { motion } from "framer-motion";

const platformGrowthData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));

  // Keep demo data deterministic to avoid impure-render warnings.
  const users = 1000 + i * 42 + (i % 5) * 13;
  const merchants = 50 + i * 2 + (i % 4);
  const transactions = 200 + i * 14 + (i % 6) * 9;

  return {
    date: date.toISOString().split("T")[0],
    users,
    merchants,
    transactions,
  };
});

/**
 * Demo component showcasing all analytics charts
 * This can be used in admin, merchant, or customer dashboards
 */
export function AnalyticsDashboardDemo() {
  // Sample data for Customer Impact
  const customerImpactData = {
    moneySaved: 12450,
    wastePrevented: 87.5,
  };

  // Sample data for Top Items
  const topItemsData = [
    { name: "Artisan Bread Bundle", sold: 145, revenue: 21750 },
    { name: "Premium Coffee Beans", sold: 132, revenue: 39600 },
    { name: "Gourmet Pastry Box", sold: 98, revenue: 14700 },
    { name: "Fresh Vegetable Pack", sold: 87, revenue: 8700 },
    { name: "Organic Fruit Basket", sold: 76, revenue: 11400 },
    { name: "Specialty Cheese Selection", sold: 65, revenue: 19500 },
  ];

  return (
    <div className="w-full space-y-6 p-6 bg-[#FAF9F6]">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#1C1C1E] mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-[9px] uppercase tracking-[0.2em] font-light text-[#1C1C1E]/40">
          Advanced visualizations with shadcn/ui charts
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Impact - Takes 1 column */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-10%" }}
           transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
           className="lg:col-span-1 bg-white/40 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(28,28,30,0.06)] overflow-hidden"
        >
          <CustomerImpactRings
            moneySaved={customerImpactData.moneySaved}
            wastePrevented={customerImpactData.wastePrevented}
          />
        </motion.div>

        {/* Top Items - Takes 2 columns on large screens */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-10%" }}
           transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
           className="lg:col-span-2 bg-white/40 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(28,28,30,0.06)] overflow-hidden"
        >
          <TopItemsChart items={topItemsData} />
        </motion.div>
      </div>

      {/* Platform Growth - Full width */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full bg-white/40 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(28,28,30,0.06)] overflow-hidden"
      >
        <PlatformGrowthArea data={platformGrowthData} />
      </motion.div>

      {/* Additional Examples - Different metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-10%" }}
           transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
           className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(28,28,30,0.06)] overflow-hidden"
        >
          <PlatformGrowthArea
            data={platformGrowthData}
            title="Merchant Growth"
            description="New merchants joining the platform"
            metric="merchants"
          />
        </motion.div>
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-10%" }}
           transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
           className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(28,28,30,0.06)] overflow-hidden"
        >
          <PlatformGrowthArea
            data={platformGrowthData}
            title="Transaction Volume"
            description="Daily transaction count"
            metric="transactions"
          />
        </motion.div>
      </div>

      {/* Usage Instructions */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 rounded-[20px] border border-white/20 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(28,28,30,0.06)] p-6 md:p-8"
      >
        <h2 className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#1C1C1E] mb-6">
          Usage Instructions
        </h2>
        <div className="space-y-4 text-sm text-[#1C1C1E]/70">
          <div>
            <h3 className="font-semibold text-[#1C1C1E] mb-2">Customer Impact Rings</h3>
            <code className="block bg-[#1C1C1E]/5 p-3 rounded text-xs">
              {`<CustomerImpactRings
  moneySaved={12450}
  wastePrevented={87.5}
/>`}
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-[#1C1C1E] mb-2">Top Items Chart</h3>
            <code className="block bg-[#1C1C1E]/5 p-3 rounded text-xs">
              {`<TopItemsChart
  items={[
    { name: "Product", sold: 145, revenue: 21750 },
    // ... more items
  ]}
/>`}
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-[#1C1C1E] mb-2">Platform Growth Area</h3>
            <code className="block bg-[#1C1C1E]/5 p-3 rounded text-xs">
              {`<PlatformGrowthArea
  data={[
    { date: "2024-01-01", users: 1000, merchants: 50, transactions: 200 },
    // ... more data points
  ]}
  metric="users" // or "merchants" or "transactions"
/>`}
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
