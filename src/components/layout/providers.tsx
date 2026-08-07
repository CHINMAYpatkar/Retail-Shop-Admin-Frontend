'use client';

import * as React from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { getErrorMessage } from '@/lib/utils';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        // Mutations already show their own targeted toasts (see each hook in
        // src/hooks/) via onError, so this only needs to cover queries -
        // otherwise a failed GET (e.g. the products list can't reach the API)
        // would fail completely silently behind a spinner forever.
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Skip toasting background refetch failures for data we already
            // have on screen - only surface errors on the *first* failed load,
            // so a flaky network blip doesn't spam the user with repeat toasts.
            if (query.state.data !== undefined) return;
            toast.error(getErrorMessage(error));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
