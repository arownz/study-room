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

export interface DashboardNoteSnippet {
  id: string;
  title: string;
  updatedAt: string;
}

export interface DashboardSummary {
  notesCount: number;
  flashcardsCount: number;
  flashcardDecksCount: number;
  studyRoomsCount: number;
  pomodoroSessionsCompletedTotal: number;
  recentNotes: DashboardNoteSnippet[];
}

interface DashboardSummaryEnvelope {
  success: true;
  data: DashboardSummary;
}

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getDashboardSummary = async (
  options?: RequestInit,
): Promise<DashboardSummaryEnvelope> => {
  return customFetch<DashboardSummaryEnvelope>("/api/v1/users/me/dashboard-summary", {
    ...options,
    method: "GET",
  });
};

export const getDashboardSummaryQueryKey = () =>
  ["/api/v1/users/me/dashboard-summary"] as const;

export const getDashboardSummaryQueryOptions = <
  TData = Awaited<ReturnType<typeof getDashboardSummary>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getDashboardSummary>>,
    TError,
    TData
  >;
  request?: SP<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getDashboardSummaryQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getDashboardSummary>>> = ({
    signal,
  }) => getDashboardSummary({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getDashboardSummary>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useDashboardSummary<
  TData = Awaited<ReturnType<typeof getDashboardSummary>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getDashboardSummary>>,
    TError,
    TData
  >;
  request?: SP<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getDashboardSummaryQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
