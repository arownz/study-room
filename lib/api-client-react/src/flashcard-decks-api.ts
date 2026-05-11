/**
 * Hand-maintained client for flashcard deck endpoints (OpenAPI orval pending in CI).
 * Mirrors generated api.ts patterns.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
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
  CreateFlashcardDeckRequest,
  DeleteResponse,
  ErrorResponse,
  FlashcardDeckResponse,
  FlashcardDeckStatsResponse,
  ListFlashcardDecksParams,
  ListFlashcardDecksResponse,
  UpdateFlashcardDeckRequest,
} from "./generated/api.schemas";
import { customFetch } from "./custom-fetch";
import type { BodyType, ErrorType } from "./custom-fetch";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SP<T extends (...args: never) => unknown> = Parameters<T>[1];

const getListFlashcardDecksUrl = (params?: ListFlashcardDecksParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0
    ? `/api/v1/flashcard-decks?${stringifiedParams}`
    : `/api/v1/flashcard-decks`;
};

export const listFlashcardDecks = async (
  params?: ListFlashcardDecksParams,
  options?: RequestInit,
): Promise<ListFlashcardDecksResponse> => {
  return customFetch<ListFlashcardDecksResponse>(getListFlashcardDecksUrl(params), {
    ...options,
    method: "GET",
  });
};

export const getListFlashcardDecksQueryKey = (params?: ListFlashcardDecksParams) =>
  [`/api/v1/flashcard-decks`, ...(params ? [params] : [])] as const;

export const getListFlashcardDecksQueryOptions = <
  TData = Awaited<ReturnType<typeof listFlashcardDecks>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: ListFlashcardDecksParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listFlashcardDecks>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListFlashcardDecksQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listFlashcardDecks>>> = ({
    signal,
  }) => listFlashcardDecks(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listFlashcardDecks>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListFlashcardDecks<
  TData = Awaited<ReturnType<typeof listFlashcardDecks>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: ListFlashcardDecksParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listFlashcardDecks>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListFlashcardDecksQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const createFlashcardDeck = async (
  body: CreateFlashcardDeckRequest,
  options?: RequestInit,
): Promise<FlashcardDeckResponse> => {
  return customFetch<FlashcardDeckResponse>("/api/v1/flashcard-decks", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateFlashcardDeck = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createFlashcardDeck>>,
    TError,
    { data: BodyType<CreateFlashcardDeckRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createFlashcardDeck>>,
  TError,
  { data: BodyType<CreateFlashcardDeckRequest> },
  TContext
> => {
  const mutationKey = ["createFlashcardDeck"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createFlashcardDeck>>,
    { data: BodyType<CreateFlashcardDeckRequest> }
  > = (props) => createFlashcardDeck(props?.data, requestOptions);

  return useMutation({ mutationFn, ...mutationOptions });
};

export const getFlashcardDeckById = async (
  deckId: string,
  options?: RequestInit,
): Promise<FlashcardDeckResponse> => {
  return customFetch<FlashcardDeckResponse>(`/api/v1/flashcard-decks/${deckId}`, {
    ...options,
    method: "GET",
  });
};

export const getGetFlashcardDeckByIdQueryKey = (deckId: string) =>
  [`/api/v1/flashcard-decks/${deckId}`] as const;

export function useGetFlashcardDeckById<
  TData = Awaited<ReturnType<typeof getFlashcardDeckById>>,
  TError = ErrorType<ErrorResponse>,
>(
  deckId: string,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getFlashcardDeckById>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetFlashcardDeckByIdQueryKey(deckId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFlashcardDeckById>>> = ({
    signal,
  }) => getFlashcardDeckById(deckId, { signal, ...requestOptions });
  const q = useQuery({
    queryKey,
    queryFn,
    enabled: !!deckId,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...q, queryKey };
}

export const updateFlashcardDeck = async (
  deckId: string,
  body: UpdateFlashcardDeckRequest,
  options?: RequestInit,
): Promise<FlashcardDeckResponse> => {
  return customFetch<FlashcardDeckResponse>(`/api/v1/flashcard-decks/${deckId}`, {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useUpdateFlashcardDeck = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateFlashcardDeck>>,
    TError,
    { deckId: string; data: BodyType<UpdateFlashcardDeckRequest> },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateFlashcardDeck>>,
  TError,
  { deckId: string; data: BodyType<UpdateFlashcardDeckRequest> },
  TContext
> => {
  const mutationKey = ["updateFlashcardDeck"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateFlashcardDeck>>,
    { deckId: string; data: BodyType<UpdateFlashcardDeckRequest> }
  > = (props) => updateFlashcardDeck(props?.deckId, props?.data, requestOptions);

  return useMutation({ mutationFn, ...mutationOptions });
};

export const deleteFlashcardDeck = async (
  deckId: string,
  options?: RequestInit,
): Promise<DeleteResponse> => {
  return customFetch<DeleteResponse>(`/api/v1/flashcard-decks/${deckId}`, {
    ...options,
    method: "DELETE",
  });
};

export const useDeleteFlashcardDeck = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteFlashcardDeck>>,
    TError,
    { deckId: string },
    TContext
  >;
  request?: SP<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof deleteFlashcardDeck>>,
  TError,
  { deckId: string },
  TContext
> => {
  const mutationKey = ["deleteFlashcardDeck"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
        "mutationKey" in options.mutation &&
        options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteFlashcardDeck>>,
    { deckId: string }
  > = (props) => deleteFlashcardDeck(props?.deckId, requestOptions);

  return useMutation({ mutationFn, ...mutationOptions });
};

export const getFlashcardDeckStats = async (
  deckId: string,
  options?: RequestInit,
): Promise<FlashcardDeckStatsResponse> => {
  return customFetch<FlashcardDeckStatsResponse>(
    `/api/v1/flashcard-decks/${deckId}/stats`,
    { ...options, method: "GET" },
  );
};

export function useGetFlashcardDeckStats<
  TData = Awaited<ReturnType<typeof getFlashcardDeckStats>>,
  TError = ErrorType<ErrorResponse>,
>(
  deckId: string,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getFlashcardDeckStats>>,
      TError,
      TData
    >;
    request?: SP<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = [`/api/v1/flashcard-decks/${deckId}/stats`] as const;
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFlashcardDeckStats>>> = ({
    signal,
  }) => getFlashcardDeckStats(deckId, { signal, ...requestOptions });
  const q = useQuery({
    queryKey,
    queryFn,
    enabled: !!deckId,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...q, queryKey };
}
