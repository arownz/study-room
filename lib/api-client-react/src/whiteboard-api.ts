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
import type { ErrorResponse } from "./generated/api.schemas";

export interface WhiteboardDto {
  snapshot: string;
  updatedAt: string;
}

export interface PutWhiteboardRequest {
  snapshot: string;
}

interface WhiteboardEnvelope {
  success: true;
  data: WhiteboardDto;
}

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getWhiteboard = async (options?: RequestInit): Promise<WhiteboardEnvelope> => {
  return customFetch<WhiteboardEnvelope>("/api/v1/whiteboard", {
    ...options,
    method: "GET",
  });
};

export const getWhiteboardQueryKey = () => ["/api/v1/whiteboard"] as const;

export const getWhiteboardQueryOptions = <
  TData = Awaited<ReturnType<typeof getWhiteboard>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getWhiteboard>>, TError, TData>;
  request?: SP<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getWhiteboardQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getWhiteboard>>> = ({ signal }) =>
    getWhiteboard({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getWhiteboard>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useWhiteboard<
  TData = Awaited<ReturnType<typeof getWhiteboard>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getWhiteboard>>, TError, TData>;
  request?: SP<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getWhiteboardQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const putWhiteboard = async (
  body: PutWhiteboardRequest,
  options?: RequestInit,
): Promise<WhiteboardEnvelope> => {
  return customFetch<WhiteboardEnvelope>("/api/v1/whiteboard", {
    ...options,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const usePutWhiteboard = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof putWhiteboard>>,
    TError,
    { data: BodyType<PutWhiteboardRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof putWhiteboard>>,
  TError,
  { data: BodyType<PutWhiteboardRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["putWhiteboard"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof putWhiteboard>>,
    { data: BodyType<PutWhiteboardRequest> }
  > = (props) => putWhiteboard(props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getWhiteboardQueryKey(), data);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
