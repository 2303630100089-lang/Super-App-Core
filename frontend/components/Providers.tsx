'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes → no refetch on component mount
        staleTime: 1000 * 60 * 5,
        // Keep unused data in cache for 24 hours (helps offline)
        gcTime: 1000 * 60 * 60 * 24,
        // Don't refetch just because the user switches back to the tab
        refetchOnWindowFocus: false,
        // Retry failed requests up to 2 times (reduced from default 3 for speed)
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
        // Keep showing stale cached data while fetching in the background
        placeholderData: (prev: any) => prev,
      },
    },
  })
}

// Singleton on client, new instance on server (avoids shared state between requests)
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient)

  // localStorage persister is only available in the browser
  const persister =
    typeof window !== 'undefined'
      ? createSyncStoragePersister({ storage: window.localStorage, key: 'superapp-query-cache' })
      : null;

  if (!persister) {
    // SSR — use standard provider without persistence
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        buster: 'v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}

