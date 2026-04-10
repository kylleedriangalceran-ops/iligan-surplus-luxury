import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN")) {
    redirect("/feed");
  }

  return (
    <div className="flex-1 px-6 lg:px-16 py-12">
      <Breadcrumbs />
      {children}
    </div>
  );
}
