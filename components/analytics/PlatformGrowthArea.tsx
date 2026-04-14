"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface GrowthDataPoint {
  date: string;
  users: number;
  merchants: number;
  transactions: number;
}

interface PlatformGrowthAreaProps {
  data: GrowthDataPoint[];
  title?: string;
  description?: string;
  metric?: "users" | "merchants" | "transactions";
}

export function PlatformGrowthArea({
  data,
  title = "Platform Growth",
  description = "User and merchant growth over time",
  metric = "users",
}: PlatformGrowthAreaProps) {
  const chartConfig = {
    users: {
      label: "Users",
      color: "hsl(var(--foreground))",
    },
    merchants: {
      label: "Merchants",
      color: "rgba(28, 28, 30, 0.6)",
    },
    transactions: {
      label: "Transactions",
      color: "rgba(28, 28, 30, 0.8)",
    },
  };

  const metricLabels = {
    users: "Total Users",
    merchants: "Total Merchants",
    transactions: "Total Transactions",
  };

  // Calculate growth percentage
  const firstValue = data[0]?.[metric] || 0;
  const lastValue = data[data.length - 1]?.[metric] || 0;
  const growthPercentage =
    firstValue > 0 ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1) : 0;

  return (
    <Card className="border-[#1C1C1E]/10 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#1C1C1E]">
              {title}
            </CardTitle>
            <CardDescription className="text-xs text-[#1C1C1E]/50">
              {description}
            </CardDescription>
          </div>
          <div className="rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60">
              Growth
            </p>
            <p className="text-sm font-bold text-[#1C1C1E]">
              {Number(growthPercentage) >= 0 ? "+" : ""}
              {growthPercentage}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--foreground))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--foreground))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#1C1C1E"
              strokeOpacity={0.05}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#1C1C1E"
              strokeOpacity={0.1}
              tick={{ fill: "#1C1C1E", opacity: 0.5, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                // Format date to short form (e.g., "Jan 1")
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              stroke="#1C1C1E"
              strokeOpacity={0.1}
              tick={{ fill: "#1C1C1E", opacity: 0.5, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                // Format large numbers (e.g., 1000 -> 1k)
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}k`;
                }
                return value.toString();
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-white/95 backdrop-blur-lg border-[#1C1C1E]/10"
                  formatter={(value, name, item) => {
                    const date = new Date(item.payload.date);
                    const formattedDate = date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#1C1C1E]/60">
                          {formattedDate}
                        </span>
                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#1C1C1E]/10">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/60 block mb-1">
                              Users
                            </span>
                            <span className="text-sm font-bold text-[#1C1C1E]">
                              {item.payload.users.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/60 block mb-1">
                              Merchants
                            </span>
                            <span className="text-sm font-bold text-[#1C1C1E]">
                              {item.payload.merchants.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/60 block mb-1">
                              Orders
                            </span>
                            <span className="text-sm font-bold text-[#1C1C1E]">
                              {item.payload.transactions.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  hideLabel
                />
              }
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              fill="url(#colorGradient)"
              fillOpacity={1}
            />
          </AreaChart>
        </ChartContainer>

        {/* Current Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60 mb-1">
              Users
            </p>
            <p className="text-lg font-bold text-[#1C1C1E]">
              {(data[data.length - 1]?.users || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60 mb-1">
              Merchants
            </p>
            <p className="text-lg font-bold text-[#1C1C1E]">
              {(data[data.length - 1]?.merchants || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60 mb-1">
              Orders
            </p>
            <p className="text-lg font-bold text-[#1C1C1E]">
              {(data[data.length - 1]?.transactions || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
