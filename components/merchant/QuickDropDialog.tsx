"use client";

import { useMemo, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ActionButton } from "@/components/shared/ActionButton";
import { useToast } from "@/hooks/useToast";
import { quickPublishDrop } from "@/app/actions/inventory";

export function QuickDropDialog({
  productId,
  originalPrice,
  triggerLabel = "Create Drop",
}: {
  productId: string;
  originalPrice: number;
  triggerLabel?: string;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"price" | "percent">("percent");
  const [quantity, setQuantity] = useState(1);
  const [discountedPrice, setDiscountedPrice] = useState<number | "">("");
  const [percentOff, setPercentOff] = useState<number | "">(30);
  const [isPending, startTransition] = useTransition();

  const computed = useMemo(() => {
    if (mode === "price") return discountedPrice === "" ? null : Number(discountedPrice);
    if (percentOff === "") return null;
    const pct = Number(percentOff);
    return Math.round((originalPrice * (1 - pct / 100)) * 100) / 100;
  }, [mode, discountedPrice, percentOff, originalPrice]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ActionButton variant="outline" className="min-w-[170px]">
          {triggerLabel}
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Drop</DialogTitle>
          <DialogDescription>Quantity + discount. That’s it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("percent")}
              className={[
                "rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
                mode === "percent"
                  ? "border-[#1C1C1E]/25 bg-white text-[#1C1C1E] shadow-sm"
                  : "border-[#1C1C1E]/10 bg-[#FAF9F6] text-[#1C1C1E]/60 hover:text-[#1C1C1E]",
              ].join(" ")}
            >
              % Off
            </button>
            <button
              type="button"
              onClick={() => setMode("price")}
              className={[
                "rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
                mode === "price"
                  ? "border-[#1C1C1E]/25 bg-white text-[#1C1C1E] shadow-sm"
                  : "border-[#1C1C1E]/10 bg-[#FAF9F6] text-[#1C1C1E]/60 hover:text-[#1C1C1E]",
              ].join(" ")}
            >
              Price
            </button>
          </div>

          <div className="border-b border-[#1C1C1E]/15 pb-2">
            <label className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
              Quantity
            </label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
              inputMode="numeric"
              className="mt-2 w-full bg-transparent outline-none text-sm text-[#1C1C1E]"
            />
          </div>

          {mode === "percent" ? (
            <div className="border-b border-[#1C1C1E]/15 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Discount (%)
              </label>
              <input
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value === "" ? "" : Math.max(1, Math.min(99, Number(e.target.value))))}
                inputMode="numeric"
                className="mt-2 w-full bg-transparent outline-none text-sm text-[#1C1C1E]"
              />
            </div>
          ) : (
            <div className="border-b border-[#1C1C1E]/15 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Discounted Price (₱)
              </label>
              <input
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value === "" ? "" : Number(e.target.value))}
                inputMode="decimal"
                className="mt-2 w-full bg-transparent outline-none text-sm text-[#1C1C1E]"
              />
            </div>
          )}

          <div className="rounded-2xl border border-[#1C1C1E]/10 bg-white/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Base
              </span>
              <span className="text-sm font-medium text-[#1C1C1E]">₱{originalPrice.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Drop Price
              </span>
              <span className="text-sm font-semibold text-[#1C1C1E]">
                {computed == null ? "—" : `₱${computed.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <ActionButton
              variant="solid"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await quickPublishDrop({
                    productId,
                    quantity,
                    discountedPrice: mode === "price" ? (discountedPrice === "" ? undefined : Number(discountedPrice)) : undefined,
                    percentOff: mode === "percent" ? (percentOff === "" ? undefined : Number(percentOff)) : undefined,
                  });
                  if (res?.error) {
                    toast(res.error, "error");
                    return;
                  }
                  toast("Drop published", "success");
                  setIsOpen(false);
                });
              }}
            >
              {isPending ? "Publishing..." : "Publish Drop"}
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

