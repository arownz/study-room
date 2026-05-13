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
import { customFetch } from "./custom-fetch";
import type { BodyType, ErrorType } from "./custom-fetch";
import type { ErrorResponse, WhiteboardPutRequest, WhiteboardResponse } from "./generated/api.schemas";

export type { WhiteboardDto, WhiteboardPutRequest } from "./generated/api.schemas";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getUserWhiteboard = async (options?: RequestInit): Promise<WhiteboardResponse> => {
  return customFetch<WhiteboardResponse>("/api/v1/whiteboard", {
    ...options,
    method: "GET",
  });
};

export const getGetUserWhiteboardQueryKey = () => ["/api/v1/whiteboard"] as const;

export const getGetUserWhiteboardQueryOptions = <
  TData = Awaited<ReturnType<typeof getUserWhiteboard>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getUserWhiteboard>>, TError, TData>;
  request?: SP<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetUserWhiteboardQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserWhiteboard>>> = ({ signal }) =>
    getUserWhiteboard({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getUserWhiteboard>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useGetUserWhiteboard<
  TData = Awaited<ReturnType<typeof getUserWhiteboard>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getUserWhiteboard>>, TError, TData>;
  request?: SP<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetUserWhiteboardQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const putUserWhiteboard = async (
  body: WhiteboardPutRequest,
  options?: RequestInit,
): Promise<WhiteboardResponse> => {
  return customFetch<WhiteboardResponse>("/api/v1/whiteboard", {
    ...options,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const usePutUserWhiteboard = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof putUserWhiteboard>>,
    TError,
    { data: BodyType<WhiteboardPutRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof putUserWhiteboard>>,
  TError,
  { data: BodyType<WhiteboardPutRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["putUserWhiteboard"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof putUserWhiteboard>>,
    { data: BodyType<WhiteboardPutRequest> }
  > = (props) => putUserWhiteboard(props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getGetUserWhiteboardQueryKey(), data);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
