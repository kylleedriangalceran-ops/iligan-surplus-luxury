"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { MerchantAnalytics } from "@/lib/repositories/analyticsRepository";

interface MerchantAnalyticsProps {
  analytics: MerchantAnalytics;
}

export function MerchantAnalytics({ analytics }: MerchantAnalyticsProps) {
  const [range, setRange] = useState<"6" | "12">("12");
  const series = useMemo(() => {
    const data = analytics.revenueByMonth || [];
    return range === "6" ? data.slice(-6) : data.slice(-12);
  }, [analytics.revenueByMonth, range]);

  const peso = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }),
    []
  );

  return (
    <div className="space-y-8 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <Card className="lg:col-span-2 bg-white border-[#1C1C1E]/10">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight text-[#1C1C1E]">
                  Revenue Overview
                </CardTitle>
                <p className="text-sm text-[#1C1C1E]/50">Revenue vs surplus earnings</p>
              </div>
              <div className="flex items-center rounded-xl border border-[#1C1C1E]/10 bg-[#FAF9F6] p-1">
                <button
                  onClick={() => setRange("6")}
                  className={[
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    range === "6" ? "bg-white shadow-sm text-[#1C1C1E]" : "text-[#1C1C1E]/60 hover:text-[#1C1C1E]",
                  ].join(" ")}
                >
                  6 Months
                </button>
                <button
                  onClick={() => setRange("12")}
                  className={[
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    range === "12" ? "bg-white shadow-sm text-[#1C1C1E]" : "text-[#1C1C1E]/60 hover:text-[#1C1C1E]",
                  ].join(" ")}
                >
                  12 Months
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#1C1C1E" },
                surplusEarnings: { label: "Surplus Earnings", color: "#C9A24A" },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1C1C1E" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#1C1C1E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="surFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A24A" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#C9A24A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1E" strokeOpacity={0.05} vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#1C1C1E", opacity: 0.55, fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#1C1C1E", opacity: 0.45, fontSize: 11 }}
                    tickFormatter={(v) => {
                      const n = Number(v);
                      if (n >= 1000) return `${Math.round(n / 1000)}k`;
                      return String(n);
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="bg-white/95 backdrop-blur-lg border-[#1C1C1E]/10"
                        formatter={(value, name) => {
                          const label = name === "surplusEarnings" ? "Surplus Earnings" : "Revenue";
                          return (
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-xs text-[#1C1C1E]/60">{label}</span>
                              <span className="text-xs font-semibold text-[#1C1C1E]">
                                {peso.format(Number(value))}
                              </span>
                            </div>
                          );
                        }}
                        hideLabel
                      />
                    }
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1C1C1E" strokeWidth={2} fill="url(#revFill)" />
                  <Area type="monotone" dataKey="surplusEarnings" stroke="#C9A24A" strokeWidth={2} fill="url(#surFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Items (styled like Top Categories) */}
        <Card className="bg-white border-[#1C1C1E]/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold tracking-tight text-[#1C1C1E]">
              Top Items
            </CardTitle>
            <p className="text-sm text-[#1C1C1E]/50">Units sold this quarter</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                sold: { label: "Units Sold", color: "#2F6F5A" },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topItems} layout="vertical" margin={{ left: 10, right: 12, top: 6, bottom: 6 }}>
                  <CartesianGrid stroke="transparent" horizontal={false} vertical={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#1C1C1E", opacity: 0.45, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="item"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#1C1C1E", opacity: 0.6, fontSize: 11 }}
                    width={110}
                  />
                  <ChartTooltip content={<ChartTooltipContent className="bg-white/95 backdrop-blur-lg border-[#1C1C1E]/10" />} />
                  <Bar dataKey="sold" fill="#2F6F5A" radius={[8, 8, 8, 8]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
