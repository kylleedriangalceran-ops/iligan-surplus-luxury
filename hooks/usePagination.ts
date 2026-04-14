"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Generic search + pagination hook.
 * Accepts an array of items and a search predicate function.
 * Returns filtered items, paginated items, and pagination controls.
 */
export function usePagination<T>({
  items,
  itemsPerPage,
  searchQuery,
  filterFn,
}: {
  items: T[];
  itemsPerPage: number;
  searchQuery: string;
  filterFn: (item: T, query: string) => boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => filterFn(item, q));
  }, [items, searchQuery, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return {
    filteredItems,
    paginatedItems,
    currentPage,
    totalPages,
    startIndex,
    setCurrentPage,
    goToPrevPage: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goToNextPage: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    showingFrom: startIndex + 1,
    showingTo: Math.min(startIndex + itemsPerPage, filteredItems.length),
    totalFiltered: filteredItems.length,
  };
}
