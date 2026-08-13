import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesFull } from "@/lib/categories";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesFull();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/companies" className="text-sm text-grove hover:underline">
        ← Companies
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-grove">
        Business categories
      </h1>
      <p className="mt-1 text-sm text-muted">
        The directory categories merchants choose from. Renaming or deleting one
        updates every business that uses it.
      </p>
      <CategoriesManager initial={categories} />
    </div>
  );
}
