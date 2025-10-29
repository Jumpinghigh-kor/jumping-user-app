import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
  isLoading?: boolean;
  resetDeps?: any[];
  nearEndPadding?: number; // px
  delayMs?: number; // show spinner briefly
}

export function useInfiniteScroll<T>({
  items,
  pageSize = 5,
  isLoading = false,
  resetDeps = [],
  nearEndPadding = 50,
  delayMs = 400,
}: UseInfiniteScrollOptions<T>) {
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const baseItems = Array.isArray(items) ? items : ([] as T[]);
  const displayedItems = useMemo(() => baseItems.slice(0, page * pageSize), [baseItems, page, pageSize]);

  useEffect(() => {
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseItems, ...resetDeps]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || loadingMore) return;
    if (displayedItems.length >= baseItems.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPage(prev => prev + 1);
      setLoadingMore(false);
    }, delayMs);
  }, [isLoading, loadingMore, displayedItems.length, baseItems.length, delayMs]);

  const handleScroll = useCallback((e: any) => {
    try {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent || {};
      if (layoutMeasurement && contentOffset && contentSize) {
        const isNearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - nearEndPadding;
        if (isNearEnd) handleLoadMore();
      }
    } catch {}
  }, [nearEndPadding, handleLoadMore]);

  return { page, loadingMore, displayedItems, handleLoadMore, handleScroll, setPage } as const;
}


