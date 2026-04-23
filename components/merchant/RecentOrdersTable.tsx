"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type RecentOrder = {
  id: string;
  customerName: string;
  listingTitle: string;
  createdAt: Date;
  reservedPrice: number;
  status: "PENDING" | "CLAIMED" | "CANCELLED";
};

function statusPill(status: RecentOrder["status"]) {
  if (status === "CLAIMED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "PENDING") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  return "bg-red-50 text-red-700 border-red-200";
}

function statusLabel(status: RecentOrder["status"]) {
  if (status === "CLAIMED") return "Delivered";
  if (status === "PENDING") return "Processing";
  return "Cancelled";
}

export function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
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
    <Card className="bg-white border-[#1C1C1E]/10">
      <CardHeader className="pb-2 px-4 md:px-6">
        <CardTitle className="text-lg font-semibold tracking-tight text-[#1C1C1E]">
          Recent Orders
        </CardTitle>
        <p className="text-sm text-[#1C1C1E]/50">Latest surplus deals</p>
      </CardHeader>
      <CardContent className="pt-2 px-4 md:px-6">
        {orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#1C1C1E]/50">
            No orders yet.
          </div>
        ) : (
          <>
            {/* ─── Mobile: Card Layout ─── */}
            <div className="md:hidden flex flex-col gap-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="border border-[#1C1C1E]/8 rounded-xl p-3.5 bg-[#FAF9F6]/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-[#1C1C1E] truncate">
                        {o.listingTitle}
                      </p>
                      <p className="text-[10px] text-[#1C1C1E]/50 mt-0.5">
                        {o.customerName} • {format(new Date(o.createdAt), "MMM d")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium shrink-0 ml-2",
                        statusPill(o.status)
                      )}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#1C1C1E]/40 font-mono uppercase">
                      #{o.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold text-[#1C1C1E]">
                      {peso.format(o.reservedPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Desktop: Table Layout ─── */}
            <div className="hidden md:block rounded-2xl border border-[#1C1C1E]/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FAF9F6]">
                    <TableHead className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60">
                      Order
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60">
                      Customer
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60">
                      Product
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60">
                      Date
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="border-[#1C1C1E]/5">
                      <TableCell className="font-medium text-[#1C1C1E]">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-[#1C1C1E]">{o.customerName}</TableCell>
                      <TableCell className="text-[#1C1C1E]/70">{o.listingTitle}</TableCell>
                      <TableCell className="text-[#1C1C1E]/60">
                        {format(new Date(o.createdAt), "MMM d")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1C1C1E]">
                        {peso.format(o.reservedPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            statusPill(o.status)
                          )}
                        >
                          {statusLabel(o.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
