import { useCallback, useState } from 'react';

export function usePullToRefresh(refreshFn: () => Promise<void> | void, deps: any[] = []) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.resolve(refreshFn());
    } finally {
      setRefreshing(false);
    }
  }, deps);

  return { refreshing, onRefresh } as const;
}


