import { api } from '~/trpc/react';

export const useTokenStats = () => {
  const minutesToCache = 5;
  const {data, isLoading, isError, refetch} = api.user.getTokenStats.useQuery(undefined, {
    staleTime: 1000 * 60 * minutesToCache,
  });

  return {
    tokenCap: data?.tokenCap ?? 0,
    tokensUsed: data?.tokensUsed ?? 0,
    isLoading,
    isError,
    refetch,
  };
};
