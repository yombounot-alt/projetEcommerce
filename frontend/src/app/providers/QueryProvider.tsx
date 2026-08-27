import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/types/api.types";
import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from "@/constants/app.constants";

function isRetryableError(error: unknown): boolean {
  if (!ApiError.isApiError(error)) return true;
  // Ne jamais retenter sur des erreurs client (400-499) : elles ne se résoudront pas seules.
  return error.status === 0 || error.status >= 500;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
            gcTime: QUERY_GC_TIME_MS,
            retry: (failureCount, error) => failureCount < 2 && isRetryableError(error),
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
