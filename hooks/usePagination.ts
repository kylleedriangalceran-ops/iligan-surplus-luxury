"use client";

import { useState, useMemo } from "react";

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
  const [prevQuery, setPrevQuery] = useState(searchQuery);

  // Reset to page 1 when search query changes (React-recommended state-during-render pattern)
  if (prevQuery !== searchQuery) {
    setPrevQuery(searchQuery);
    setCurrentPage(1);
  }

  const filteredItems = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return (items || []).filter((item) => filterFn(item, q));
  }, [items, searchQuery, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return {
    filteredItems,
    paginatedItems,
    currentPage: safeCurrentPage,
    totalPages,
    startIndex,
    setCurrentPage,
    goToPrevPage: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goToNextPage: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    showingFrom: filteredItems.length === 0 ? 0 : startIndex + 1,
    showingTo: Math.min(startIndex + itemsPerPage, filteredItems.length),
    totalFiltered: filteredItems.length,
  };
}
