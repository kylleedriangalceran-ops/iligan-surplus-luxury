"use client";

import React, { useMemo } from "react";
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
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight text-[#1C1C1E]">
          Recent Orders
        </CardTitle>
        <p className="text-sm text-[#1C1C1E]/50">Latest surplus deals</p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="rounded-2xl border border-[#1C1C1E]/10 overflow-hidden">
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
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-[#1C1C1E]/50">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
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
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                          statusPill(o.status),
                        ].join(" ")}
                      >
                        {o.status === "CLAIMED"
                          ? "Delivered"
                          : o.status === "PENDING"
                            ? "Processing"
                            : "Cancelled"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

