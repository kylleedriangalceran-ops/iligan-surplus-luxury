"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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

interface TopItem {
  name: string;
  sold: number;
  revenue: number;
}

interface TopItemsChartProps {
  items: TopItem[];
  title?: string;
  description?: string;
}

export function TopItemsChart({
  items,
  title = "Top Selling Items",
  description = "Best performing products this month",
}: TopItemsChartProps) {
  const pesoFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

  // Sort and take top 5
  const topItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((item) => ({
          ...item,
          // Truncate long names for mobile
          displayName: item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
        })),
    [items]
  );

  const chartConfig = {
    sold: {
      label: "Units Sold",
      color: "hsl(var(--foreground))",
    },
  };

  return (
    <Card className="border-[#1C1C1E]/10 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#1C1C1E]">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-[#1C1C1E]/50">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={topItems}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="transparent"
              horizontal={false}
              vertical={false}
            />
            <XAxis
              type="number"
              stroke="#1C1C1E"
              strokeOpacity={0.1}
              tick={{ fill: "#1C1C1E", opacity: 0.5, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              stroke="#1C1C1E"
              strokeOpacity={0.1}
              tick={{ fill: "#1C1C1E", fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(28, 28, 30, 0.05)" }}
              content={
                <ChartTooltipContent
                  className="bg-white/95 backdrop-blur-lg border-[#1C1C1E]/10"
                  formatter={(value, name, item) => {
                    const dataItem = topItems.find(
                      (d) => d.displayName === item.payload.displayName
                    );
                    if (!dataItem) return null;

                    return (
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#1C1C1E]/60 block mb-1">
                            Product
                          </span>
                          <span className="text-xs font-semibold text-[#1C1C1E]">
                            {dataItem.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1C1C1E]/10">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/60 block mb-1">
                              Units Sold
                            </span>
                            <span className="text-sm font-bold text-[#1C1C1E]">
                              {dataItem.sold}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/60 block mb-1">
                              Revenue
                            </span>
                            <span className="text-sm font-bold text-[#1C1C1E]">
                              {pesoFormatter.format(dataItem.revenue)}
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
            <Bar
              dataKey="sold"
              fill="hsl(var(--foreground))"
              radius={[0, 4, 4, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60 mb-1">
              Total Units
            </p>
            <p className="text-lg font-bold text-[#1C1C1E]">
              {topItems.reduce((sum, item) => sum + item.sold, 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60 mb-1">
              Total Revenue
            </p>
            <p className="text-lg font-bold text-[#1C1C1E]">
              {pesoFormatter.format(topItems.reduce((sum, item) => sum + item.revenue, 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
