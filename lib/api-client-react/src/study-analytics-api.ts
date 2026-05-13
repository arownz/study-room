import { useQuery } from "@tanstack/react-query";
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";
import type {
  ErrorResponse,
  GetUserStudyAnalyticsParams,
  StudyAnalyticsResponse,
} from "./generated/api.schemas";

export type {
  GetUserStudyAnalyticsParams,
  StudyAnalytics,
  StudyAnalyticsDailyPoint,
  StudyAnalyticsDeckRow,
  StudyAnalyticsHeatmapDay,
  StudyAnalyticsSubjectSlice,
} from "./generated/api.schemas";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

const getUserStudyAnalyticsUrl = (params?: GetUserStudyAnalyticsParams) => {
  const normalizedParams = new URLSearchParams();
  if (params?.chartDays !== undefined) {
    normalizedParams.append("chartDays", String(params.chartDays));
  }
  if (params?.heatmapDays !== undefined) {
    normalizedParams.append("heatmapDays", String(params.heatmapDays));
  }
  const qs = normalizedParams.toString();
  return qs.length > 0 ? `/api/v1/users/me/study-analytics?${qs}` : `/api/v1/users/me/study-analytics`;
};

export const getUserStudyAnalytics = async (
  params?: GetUserStudyAnalyticsParams,
  options?: RequestInit,
): Promise<StudyAnalyticsResponse> => {
  return customFetch<StudyAnalyticsResponse>(getUserStudyAnalyticsUrl(params), {
    ...options,
    method: "GET",
  });
};

export const getGetUserStudyAnalyticsQueryKey = (params?: GetUserStudyAnalyticsParams) =>
  [`/api/v1/users/me/study-analytics`, ...(params ? [params] : [])] as const;

export const getGetUserStudyAnalyticsQueryOptions = <
  TData = Awaited<ReturnType<typeof getUserStudyAnalytics>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: GetUserStudyAnalyticsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getUserStudyAnalytics>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetUserStudyAnalyticsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserStudyAnalytics>>> = ({ signal }) =>
    getUserStudyAnalytics(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getUserStudyAnalytics>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useGetUserStudyAnalytics<
  TData = Awaited<ReturnType<typeof getUserStudyAnalytics>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: GetUserStudyAnalyticsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getUserStudyAnalytics>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetUserStudyAnalyticsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
