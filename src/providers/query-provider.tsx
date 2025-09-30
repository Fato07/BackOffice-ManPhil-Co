"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { toast } from "sonner"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Increase stale time for better performance
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Garbage collect data after 10 minutes of inactivity
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        // Don't refetch on mount if data is fresh
        refetchOnMount: 'always',
      },
      mutations: {
        onError: (error) => {
          // Global error handling for mutations
          const message = error instanceof Error ? error.message : "An error occurred"
          toast.error(message)
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may suspend because
  // React will throw away the client on the initial render if it suspends and
  // there is no boundary
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}