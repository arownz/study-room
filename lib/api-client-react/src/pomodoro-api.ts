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
import type {
  CreatePomodoroSessionRequest,
  ErrorResponse,
  ListPomodoroSessionsParams,
  ListPomodoroSessionsResponse,
  PomodoroPreferences,
  PomodoroPreferencesPutRequest,
  PomodoroPreferencesResponse,
  PomodoroSessionResponse,
} from "./generated/api.schemas";
import { getGetPomodoroPreferencesQueryKey, getGetUserDashboardSummaryQueryKey, getGetUserStudyAnalyticsQueryKey } from "./generated/api";
import { customFetch } from "./custom-fetch";
import type { BodyType, ErrorType } from "./custom-fetch";

export type {
  PomodoroSession,
  PomodoroSessionMode,
} from "./generated/api.schemas";

export type { CreatePomodoroSessionRequest, ListPomodoroSessionsParams } from "./generated/api.schemas";

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
): Promise<ListPomodoroSessionsResponse> => {
  return customFetch<ListPomodoroSessionsResponse>(getListPomodoroSessionsUrl(params), {
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
): Promise<PomodoroSessionResponse> => {
  return customFetch<PomodoroSessionResponse>("/api/v1/pomodoro/sessions", {
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
      void queryClient.invalidateQueries({ queryKey: getGetUserDashboardSummaryQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetUserStudyAnalyticsQueryKey() });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const getPomodoroPreferences = async (
  options?: RequestInit,
): Promise<PomodoroPreferencesResponse> => {
  return customFetch<PomodoroPreferencesResponse>("/api/v1/pomodoro/preferences", {
    ...options,
    method: "GET",
  });
};

export const getGetPomodoroPreferencesQueryOptions = <
  TData = Awaited<ReturnType<typeof getPomodoroPreferences>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getPomodoroPreferences>>, TError, TData>;
  request?: SP<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetPomodoroPreferencesQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getPomodoroPreferences>>> = ({
    signal,
  }) => getPomodoroPreferences({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getPomodoroPreferences>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useGetPomodoroPreferences<
  TData = Awaited<ReturnType<typeof getPomodoroPreferences>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getPomodoroPreferences>>, TError, TData>;
  request?: SP<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetPomodoroPreferencesQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const putPomodoroPreferences = async (
  body: PomodoroPreferencesPutRequest,
  options?: RequestInit,
): Promise<PomodoroPreferencesResponse> => {
  return customFetch<PomodoroPreferencesResponse>("/api/v1/pomodoro/preferences", {
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
    { data: BodyType<PomodoroPreferencesPutRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof putPomodoroPreferences>>,
  TError,
  { data: BodyType<PomodoroPreferencesPutRequest> },
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
    { data: BodyType<PomodoroPreferencesPutRequest> }
  > = (props) => putPomodoroPreferences(props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getGetPomodoroPreferencesQueryKey(), data);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export type { PomodoroPreferences, PomodoroPreferencesPutRequest };
