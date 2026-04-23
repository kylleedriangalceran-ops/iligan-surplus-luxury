import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { AddMasterItemDialog } from "@/components/merchant/AddMasterItemDialog";
import { getProductsByMerchantId } from "@/lib/repositories/productRepository";
import { MasterMenuGrid } from "@/components/merchant/MasterMenuGrid";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN") redirect("/feed");

  const products = await getProductsByMerchantId(session.user.id);

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory" }]} className="mb-6" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-light tracking-widest uppercase mb-2">
            Master Menu
          </h1>
          <p className="text-sm text-[#1C1C1E]/60 uppercase tracking-widest max-w-2xl">
            Build templates once. Publish surplus in one tap.
          </p>
        </div>
        <AddMasterItemDialog />
      </div>

      {products.length === 0 ? (
        <div className="border border-[#1C1C1E]/10 bg-white/50 rounded-2xl p-12 text-center">
          <p className="text-sm uppercase tracking-widest text-[#1C1C1E]/70 mb-2">
            No master items yet
          </p>
          <p className="text-xs text-[#1C1C1E]/50">
            Add your first product template to start publishing daily drops.
          </p>
        </div>
      ) : (
        <MasterMenuGrid products={products} />
      )}
    </div>
  );
}

