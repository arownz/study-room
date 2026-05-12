import { useQuery } from "@tanstack/react-query";
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";
import type { ErrorResponse } from "./generated/api.schemas";

export interface StudyAnalyticsDailyPoint {
  date: string;
  dateKey: string;
  hours: number;
}

export interface StudyAnalyticsSubjectSlice {
  subject: string;
  hours: number;
  color: string;
}

export interface StudyAnalyticsHeatmapDay {
  dateKey: string;
  intensity: number;
}

export interface StudyAnalyticsDeckRow {
  name: string;
  mastered: number;
  total: number;
}

export interface StudyAnalytics {
  totalFocusHours: number;
  streakDays: number;
  flashcardCount: number;
  rankLabel: string;
  rankSubtitle: string;
  dailyFocus: StudyAnalyticsDailyPoint[];
  subjectBreakdown: StudyAnalyticsSubjectSlice[];
  streakCalendar: StudyAnalyticsHeatmapDay[];
  flashcardMastery: StudyAnalyticsDeckRow[];
}

export interface StudyAnalyticsParams {
  chartDays?: number;
  heatmapDays?: number;
}

interface StudyAnalyticsEnvelope {
  success: true;
  data: StudyAnalytics;
}

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

const getStudyAnalyticsUrl = (params?: StudyAnalyticsParams) => {
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

export const getStudyAnalytics = async (
  params?: StudyAnalyticsParams,
  options?: RequestInit,
): Promise<StudyAnalyticsEnvelope> => {
  return customFetch<StudyAnalyticsEnvelope>(getStudyAnalyticsUrl(params), {
    ...options,
    method: "GET",
  });
};

export const getStudyAnalyticsQueryKey = (params?: StudyAnalyticsParams) =>
  [`/api/v1/users/me/study-analytics`, ...(params ? [params] : [])] as const;

export const getStudyAnalyticsQueryOptions = <
  TData = Awaited<ReturnType<typeof getStudyAnalytics>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: StudyAnalyticsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getStudyAnalytics>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getStudyAnalyticsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getStudyAnalytics>>> = ({ signal }) =>
    getStudyAnalytics(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getStudyAnalytics>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useStudyAnalytics<
  TData = Awaited<ReturnType<typeof getStudyAnalytics>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: StudyAnalyticsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getStudyAnalytics>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getStudyAnalyticsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
