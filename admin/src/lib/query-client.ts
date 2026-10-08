import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min — dashboard data tolerates brief staleness
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
