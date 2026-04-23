"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
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

interface CustomerImpactRingsProps {
  moneySaved: number;
  wastePrevented: number; // in kg
}

export function CustomerImpactRings({
  moneySaved,
  wastePrevented,
}: CustomerImpactRingsProps) {
  // Calculate percentages for visual representation (max values for scaling)
  const maxMoney = 50000; // ₱50,000 max for visualization
  const maxWaste = 500; // 500kg max for visualization

  const data = [
    {
      name: "Money Saved",
      value: Math.min((moneySaved / maxMoney) * 100, 100),
      fill: "hsl(var(--foreground))",
      actualValue: moneySaved,
      label: "Money Saved",
    },
    {
      name: "Waste Prevented",
      value: Math.min((wastePrevented / maxWaste) * 100, 100),
      fill: "rgba(28, 28, 30, 0.4)",
      actualValue: wastePrevented,
      label: "Waste Prevented",
    },
  ];

  const chartConfig = {
    moneySaved: {
      label: "Money Saved",
      color: "hsl(var(--foreground))",
    },
    wastePrevented: {
      label: "Waste Prevented",
      color: "rgba(28, 28, 30, 0.4)",
    },
  };

  return (
    <Card className="border-[#1C1C1E]/10 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#1C1C1E]">
          Customer Impact
        </CardTitle>
        <CardDescription className="text-xs text-[#1C1C1E]/50">
          Your contribution to sustainability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius={30}
            outerRadius={110}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={10}
              className="[&_.recharts-radial-bar-background-sector]:fill-[#1C1C1E]/5"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="bg-white/95 backdrop-blur-lg border-[#1C1C1E]/10"
                  formatter={(name) => {
                    const dataItem = data.find((d) => d.name === name);
                    if (!dataItem) return null;

                    return (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#1C1C1E]/60">
                          {dataItem.label}
                        </span>
                        <span className="text-sm font-bold text-[#1C1C1E]">
                          {dataItem.label === "Money Saved"
                            ? `₱${dataItem.actualValue.toLocaleString()}`
                            : `${dataItem.actualValue.toFixed(1)} kg`}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
          </RadialBarChart>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#1C1C1E]" />
              <span className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60">
                Money Saved
              </span>
            </div>
            <p className="text-xl font-bold text-[#1C1C1E]">
              ₱{moneySaved.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#1C1C1E]/10 bg-[#FAF9F6] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#1C1C1E]/40" />
              <span className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/60">
                Waste Prevented
              </span>
            </div>
            <p className="text-xl font-bold text-[#1C1C1E]">
              {wastePrevented.toFixed(1)} kg
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
