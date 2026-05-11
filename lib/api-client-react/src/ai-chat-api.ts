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
import { customFetch } from "./custom-fetch";
import type { BodyType, ErrorType } from "./custom-fetch";

export type AiTemplateKey =
  | "explain_concept"
  | "step_by_step"
  | "quiz_me"
  | "essay_outline"
  | "mnemonic";

export interface AiThreadDto {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessageDto {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  templateKey: string | null;
  createdAt: string;
}

export interface ListAiThreadsParams {
  limit?: number;
  offset?: number;
}

export interface ListAiThreadsResponseBody {
  items: AiThreadDto[];
  limit: number;
  offset: number;
}

export interface ListAiMessagesResponseBody {
  items: AiMessageDto[];
}

export interface CreateAiThreadRequest {
  title?: string;
}

export interface AppendAiMessageRequest {
  content: string;
  templateKey?: AiTemplateKey;
}

export interface AppendAiMessageResponseBody {
  userMessage: AiMessageDto;
  assistantMessage: AiMessageDto;
}

interface ThreadEnvelope {
  success: true;
  data: AiThreadDto;
}

interface ListThreadsEnvelope {
  success: true;
  data: ListAiThreadsResponseBody;
}

interface ListMessagesEnvelope {
  success: true;
  data: ListAiMessagesResponseBody;
}

interface AppendEnvelope {
  success: true;
  data: AppendAiMessageResponseBody;
}

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

const getListAiThreadsUrl = (params?: ListAiThreadsParams) => {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined) q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `/api/v1/ai/threads?${s}` : `/api/v1/ai/threads`;
};

export const listAiThreads = async (
  params?: ListAiThreadsParams,
  options?: RequestInit,
): Promise<ListThreadsEnvelope> => {
  return customFetch<ListThreadsEnvelope>(getListAiThreadsUrl(params), {
    ...options,
    method: "GET",
  });
};

export const getListAiThreadsQueryKey = (params?: ListAiThreadsParams) =>
  [`/api/v1/ai/threads`, ...(params ? [params] : [])] as const;

export const getListAiThreadsQueryOptions = <
  TData = Awaited<ReturnType<typeof listAiThreads>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: ListAiThreadsParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiThreads>>, TError, TData>;
    request?: SP<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListAiThreadsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listAiThreads>>> = ({ signal }) =>
    listAiThreads(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listAiThreads>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListAiThreads<
  TData = Awaited<ReturnType<typeof listAiThreads>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: ListAiThreadsParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiThreads>>, TError, TData>;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListAiThreadsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const createAiThread = async (
  body: CreateAiThreadRequest,
  options?: RequestInit,
): Promise<ThreadEnvelope> => {
  return customFetch<ThreadEnvelope>("/api/v1/ai/threads", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateAiThread = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createAiThread>>,
    TError,
    { data: BodyType<CreateAiThreadRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createAiThread>>,
  TError,
  { data: BodyType<CreateAiThreadRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["createAiThread"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createAiThread>>,
    { data: BodyType<CreateAiThreadRequest> }
  > = (props) => createAiThread(props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: ["/api/v1/ai/threads"] });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const listAiMessages = async (
  threadId: string,
  options?: RequestInit,
): Promise<ListMessagesEnvelope> => {
  return customFetch<ListMessagesEnvelope>(`/api/v1/ai/threads/${threadId}/messages`, {
    ...options,
    method: "GET",
  });
};

export const getListAiMessagesQueryKey = (threadId: string | null) =>
  threadId ? ([`/api/v1/ai/threads/${threadId}/messages`] as const) : (["/api/v1/ai/messages", "none"] as const);

export function useListAiMessages<
  TData = Awaited<ReturnType<typeof listAiMessages>>,
  TError = ErrorType<ErrorResponse>,
>(
  threadId: string | null,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiMessages>>, TError, TData>;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getListAiMessagesQueryKey(threadId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listAiMessages>>> = ({ signal }) => {
    if (!threadId) {
      return Promise.reject(new Error("threadId required"));
    }
    return listAiMessages(threadId, { signal, ...requestOptions });
  };
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(threadId),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const appendAiMessage = async (
  threadId: string,
  body: AppendAiMessageRequest,
  options?: RequestInit,
): Promise<AppendEnvelope> => {
  return customFetch<AppendEnvelope>(`/api/v1/ai/threads/${threadId}/messages`, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useAppendAiMessage = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof appendAiMessage>>,
    TError,
    { threadId: string; data: BodyType<AppendAiMessageRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof appendAiMessage>>,
  TError,
  { threadId: string; data: BodyType<AppendAiMessageRequest> },
  TContext
> => {
  const queryClient = useQueryClient();
  const mutationKey = ["appendAiMessage"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof appendAiMessage>>,
    { threadId: string; data: BodyType<AppendAiMessageRequest> }
  > = (props) => appendAiMessage(props.threadId, props.data, requestOptions);

  const userOnSuccess = mutationOptions?.onSuccess;

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: getListAiMessagesQueryKey(variables.threadId),
      });
      void queryClient.invalidateQueries({ queryKey: ["/api/v1/ai/threads"] });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
