import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { ErrorResponse } from "./generated/api.schemas";
import { getDashboardSummaryQueryKey } from "./dashboard-api";
import { customFetch } from "./custom-fetch";
import { getStudyAnalyticsQueryKey } from "./study-analytics-api";
import type { BodyType, ErrorType } from "./custom-fetch";

export type PomodoroMode = "focus" | "short_break" | "long_break";

export interface PomodoroSessionDto {
  id: string;
  mode: PomodoroMode;
  durationPlannedSec: number;
  durationActualSec: number;
  label: string | null;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

export interface CreatePomodoroSessionRequest {
  mode: PomodoroMode;
  durationPlannedSec: number;
  durationActualSec: number;
  label?: string;
  startedAt: string;
  completedAt: string;
}

export interface ListPomodoroSessionsParams {
  limit?: number;
  offset?: number;
  mode?: PomodoroMode;
}

export interface ListPomodoroSessionsResponseBody {
  items: PomodoroSessionDto[];
  limit: number;
  offset: number;
}

interface PomodoroSessionEnvelope {
  success: true;
  data: PomodoroSessionDto;
}

interface ListPomodoroSessionsEnvelope {
  success: true;
  data: ListPomodoroSessionsResponseBody;
}

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

const getListPomodoroSessionsUrl = (params?: ListPomodoroSessionsParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, String(value));
    }
  });
  const qs = normalizedParams.toString();
  return qs.length > 0 ? `/api/v1/pomodoro/sessions?${qs}` : `/api/v1/pomodoro/sessions`;
};

export const listPomodoroSessions = async (
  params?: ListPomodoroSessionsParams,
  options?: RequestInit,
): Promise<ListPomodoroSessionsEnvelope> => {
  return customFetch<ListPomodoroSessionsEnvelope>(getListPomodoroSessionsUrl(params), {
    ...options,
    method: "GET",
  });
};

export const getListPomodoroSessionsQueryKey = (params?: ListPomodoroSessionsParams) =>
  [`/api/v1/pomodoro/sessions`, ...(params ? [params] : [])] as const;

export const getListPomodoroSessionsQueryOptions = <
  TData = Awaited<ReturnType<typeof listPomodoroSessions>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: ListPomodoroSessionsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listPomodoroSessions>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListPomodoroSessionsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listPomodoroSessions>>> = ({
    signal,
  }) => listPomodoroSessions(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listPomodoroSessions>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListPomodoroSessions<
  TData = Awaited<ReturnType<typeof listPomodoroSessions>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: ListPomodoroSessionsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listPomodoroSessions>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListPomodoroSessionsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const createPomodoroSession = async (
  body: CreatePomodoroSessionRequest,
  options?: RequestInit,
): Promise<PomodoroSessionEnvelope> => {
  return customFetch<PomodoroSessionEnvelope>("/api/v1/pomodoro/sessions", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreatePomodoroSession = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createPomodoroSession>>,
    TError,
    { data: BodyType<CreatePomodoroSessionRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createPomodoroSession>>,
  TError,
  { data: BodyType<CreatePomodoroSessionRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["createPomodoroSession"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createPomodoroSession>>,
    { data: BodyType<CreatePomodoroSessionRequest> }
  > = (props) => createPomodoroSession(props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: getListPomodoroSessionsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getDashboardSummaryQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getStudyAnalyticsQueryKey() });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export interface PomodoroPreferencesDto {
  focusSec: number;
  shortBreakSec: number;
  longBreakSec: number;
  updatedAt: string;
}

export interface PutPomodoroPreferencesRequest {
  focusSec: number;
  shortBreakSec: number;
  longBreakSec: number;
}

interface PomodoroPreferencesEnvelope {
  success: true;
  data: PomodoroPreferencesDto;
}

export const getPomodoroPreferences = async (
  options?: RequestInit,
): Promise<PomodoroPreferencesEnvelope> => {
  return customFetch<PomodoroPreferencesEnvelope>("/api/v1/pomodoro/preferences", {
    ...options,
    method: "GET",
  });
};

export const getPomodoroPreferencesQueryKey = () => ["/api/v1/pomodoro/preferences"] as const;

export const getPomodoroPreferencesQueryOptions = <
  TData = Awaited<ReturnType<typeof getPomodoroPreferences>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getPomodoroPreferences>>, TError, TData>;
  request?: SP<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getPomodoroPreferencesQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getPomodoroPreferences>>> = ({
    signal,
  }) => getPomodoroPreferences({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getPomodoroPreferences>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function usePomodoroPreferences<
  TData = Awaited<ReturnType<typeof getPomodoroPreferences>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getPomodoroPreferences>>, TError, TData>;
  request?: SP<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getPomodoroPreferencesQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const putPomodoroPreferences = async (
  body: PutPomodoroPreferencesRequest,
  options?: RequestInit,
): Promise<PomodoroPreferencesEnvelope> => {
  return customFetch<PomodoroPreferencesEnvelope>("/api/v1/pomodoro/preferences", {
    ...options,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const usePutPomodoroPreferences = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof putPomodoroPreferences>>,
    TError,
    { data: BodyType<PutPomodoroPreferencesRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof putPomodoroPreferences>>,
  TError,
  { data: BodyType<PutPomodoroPreferencesRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["putPomodoroPreferences"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof putPomodoroPreferences>>,
    { data: BodyType<PutPomodoroPreferencesRequest> }
  > = (props) => putPomodoroPreferences(props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getPomodoroPreferencesQueryKey(), data);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
