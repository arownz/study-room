import { useQuery } from "@tanstack/react-query";
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";
import type { DashboardSummaryResponse, ErrorResponse } from "./generated/api.schemas";

export type { DashboardNoteSnippet, DashboardSummary } from "./generated/api.schemas";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getUserDashboardSummary = async (
  options?: RequestInit,
): Promise<DashboardSummaryResponse> => {
  return customFetch<DashboardSummaryResponse>("/api/v1/users/me/dashboard-summary", {
    ...options,
    method: "GET",
  });
};

export const getGetUserDashboardSummaryQueryKey = () =>
  ["/api/v1/users/me/dashboard-summary"] as const;

export const getGetUserDashboardSummaryQueryOptions = <
  TData = Awaited<ReturnType<typeof getUserDashboardSummary>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getUserDashboardSummary>>,
    TError,
    TData
  >;
  request?: SP<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetUserDashboardSummaryQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserDashboardSummary>>> = ({
    signal,
  }) => getUserDashboardSummary({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getUserDashboardSummary>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useGetUserDashboardSummary<
  TData = Awaited<ReturnType<typeof getUserDashboardSummary>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getUserDashboardSummary>>,
    TError,
    TData
  >;
  request?: SP<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetUserDashboardSummaryQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
