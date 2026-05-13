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
import type {
  ListStudyRoomGoalsResponse,
  PatchStudyRoomTimerRequest,
  StudyRoomGoalResponse,
} from "./generated/api.schemas";
import { getGetStudyRoomTimerQueryKey, getStudyRoomTimer, patchStudyRoomTimer } from "./generated/api";
import { customFetch } from "./custom-fetch";
import type { BodyType, ErrorType } from "./custom-fetch";

export type {
  ListStudyRoomGoalsResponse,
  PatchStudyRoomTimerRequest,
  StudyRoomGoal,
  StudyRoomTimer,
  StudyRoomTimerResponse,
} from "./generated/api.schemas";

type SP<T extends (...args: never) => unknown> = Parameters<T>[1];
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;

export const listStudyRoomGoals = async (
  roomId: string,
  options?: RequestInit,
): Promise<ListStudyRoomGoalsResponse> => {
  return customFetch<ListStudyRoomGoalsResponse>(`/api/v1/study-rooms/${roomId}/goals`, {
    ...options,
    method: "GET",
  });
};

export const getListStudyRoomGoalsQueryKey = (roomId: string | null) =>
  roomId ? ([`/api/v1/study-rooms/${roomId}/goals`] as const) : (["study-room-goals", "none"] as const);

export function useListStudyRoomGoals<
  TData = Awaited<ReturnType<typeof listStudyRoomGoals>>,
  TError = ErrorType<ErrorResponse>,
>(
  roomId: string | null,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStudyRoomGoals>>, TError, TData>;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListStudyRoomGoalsQueryKey(roomId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listStudyRoomGoals>>> = ({ signal }) => {
    if (!roomId) return Promise.reject(new Error("roomId required"));
    return listStudyRoomGoals(roomId, { signal, ...requestOptions });
  };
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(roomId),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const createStudyRoomGoal = async (
  roomId: string,
  body: { text: string },
  options?: RequestInit,
): Promise<StudyRoomGoalResponse> => {
  return customFetch<StudyRoomGoalResponse>(`/api/v1/study-rooms/${roomId}/goals`, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateStudyRoomGoal = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createStudyRoomGoal>>,
    TError,
    { roomId: string; data: BodyType<{ text: string }> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createStudyRoomGoal>>,
  TError,
  { roomId: string; data: BodyType<{ text: string }> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["createStudyRoomGoal"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createStudyRoomGoal>>,
    { roomId: string; data: BodyType<{ text: string }> }
  > = (props) => createStudyRoomGoal(props.roomId, props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: getListStudyRoomGoalsQueryKey(variables.roomId) });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const updateStudyRoomGoal = async (
  roomId: string,
  goalId: string,
  body: { text?: string; done?: boolean },
  options?: RequestInit,
): Promise<StudyRoomGoalResponse> => {
  return customFetch<StudyRoomGoalResponse>(`/api/v1/study-rooms/${roomId}/goals/${goalId}`, {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useUpdateStudyRoomGoal = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateStudyRoomGoal>>,
    TError,
    { roomId: string; goalId: string; data: BodyType<{ text?: string; done?: boolean }> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateStudyRoomGoal>>,
  TError,
  { roomId: string; goalId: string; data: BodyType<{ text?: string; done?: boolean }> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["updateStudyRoomGoal"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateStudyRoomGoal>>,
    { roomId: string; goalId: string; data: BodyType<{ text?: string; done?: boolean }> }
  > = (props) => updateStudyRoomGoal(props.roomId, props.goalId, props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: getListStudyRoomGoalsQueryKey(variables.roomId) });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export function useGetStudyRoomTimer<
  TData = Awaited<ReturnType<typeof getStudyRoomTimer>>,
  TError = ErrorType<ErrorResponse>,
>(
  roomId: string | null,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStudyRoomTimer>>, TError, TData>;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? (roomId ? getGetStudyRoomTimerQueryKey(roomId) : (["study-room-timer", "none"] as const));
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getStudyRoomTimer>>> = ({ signal }) => {
    if (!roomId) return Promise.reject(new Error("roomId required"));
    return getStudyRoomTimer(roomId, { signal, ...requestOptions });
  };
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(roomId),
    refetchInterval: 30_000,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const usePatchStudyRoomTimer = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof patchStudyRoomTimer>>,
    TError,
    { roomId: string; data: BodyType<PatchStudyRoomTimerRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof patchStudyRoomTimer>>,
  TError,
  { roomId: string; data: BodyType<PatchStudyRoomTimerRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["patchStudyRoomTimer"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof patchStudyRoomTimer>>,
    { roomId: string; data: BodyType<PatchStudyRoomTimerRequest> }
  > = (props) => patchStudyRoomTimer(props.roomId, props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: getGetStudyRoomTimerQueryKey(variables.roomId) });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export { getGetStudyRoomTimerQueryKey, getStudyRoomTimer, patchStudyRoomTimer };
