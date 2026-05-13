import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface WhiteboardRecord {
  id: string;
  title: string;
  snapshot: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListWhiteboardsParams {
  limit?: number;
  offset?: number;
  q?: string;
}

export interface ListWhiteboardsData {
  items: WhiteboardRecord[];
  page: {
    limit: number;
    offset: number;
  };
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

function buildQueryString(params?: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export const getListWhiteboardsQueryKey = (params?: ListWhiteboardsParams) =>
  ["/api/v1/whiteboards", params?.limit ?? 100, params?.offset ?? 0, params?.q ?? ""] as const;

export const getWhiteboardQueryKey = (whiteboardId: string) =>
  ["/api/v1/whiteboards", whiteboardId] as const;

export function useListWhiteboards(
  params?: ListWhiteboardsParams,
  options?: UseQueryOptions<ApiEnvelope<ListWhiteboardsData>>,
): UseQueryResult<ApiEnvelope<ListWhiteboardsData>> & { queryKey: QueryKey } {
  const queryKey = getListWhiteboardsQueryKey(params);
  const query = useQuery({
    queryKey,
    queryFn: () =>
      customFetch<ApiEnvelope<ListWhiteboardsData>>(
        `/api/v1/whiteboards${buildQueryString({
          limit: params?.limit ?? 100,
          offset: params?.offset ?? 0,
          q: params?.q,
        })}`,
      ),
    ...options,
  }) as UseQueryResult<ApiEnvelope<ListWhiteboardsData>> & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export function useGetWhiteboard(
  whiteboardId: string,
  options?: UseQueryOptions<ApiEnvelope<WhiteboardRecord>>,
): UseQueryResult<ApiEnvelope<WhiteboardRecord>> & { queryKey: QueryKey } {
  const queryKey = getWhiteboardQueryKey(whiteboardId);
  const query = useQuery({
    queryKey,
    enabled: whiteboardId.length > 0,
    queryFn: () => customFetch<ApiEnvelope<WhiteboardRecord>>(`/api/v1/whiteboards/${whiteboardId}`),
    ...options,
  }) as UseQueryResult<ApiEnvelope<WhiteboardRecord>> & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export function useCreateWhiteboard(
  options?: UseMutationOptions<ApiEnvelope<WhiteboardRecord>, Error, { title?: string }>,
): UseMutationResult<ApiEnvelope<WhiteboardRecord>, Error, { title?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      customFetch<ApiEnvelope<WhiteboardRecord>>("/api/v1/whiteboards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/v1/whiteboards"] });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useUpdateWhiteboard(
  options?: UseMutationOptions<
    ApiEnvelope<WhiteboardRecord>,
    Error,
    { whiteboardId: string; data: { title?: string; snapshot?: string } }
  >,
): UseMutationResult<
  ApiEnvelope<WhiteboardRecord>,
  Error,
  { whiteboardId: string; data: { title?: string; snapshot?: string } }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ whiteboardId, data }) =>
      customFetch<ApiEnvelope<WhiteboardRecord>>(`/api/v1/whiteboards/${whiteboardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      }),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getWhiteboardQueryKey(variables.whiteboardId), data);
      await queryClient.invalidateQueries({ queryKey: ["/api/v1/whiteboards"] });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useDeleteWhiteboard(
  options?: UseMutationOptions<ApiEnvelope<{ id: string }>, Error, { whiteboardId: string }>,
): UseMutationResult<ApiEnvelope<{ id: string }>, Error, { whiteboardId: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ whiteboardId }) =>
      customFetch<ApiEnvelope<{ id: string }>>(`/api/v1/whiteboards/${whiteboardId}`, {
        method: "DELETE",
      }),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.removeQueries({ queryKey: getWhiteboardQueryKey(variables.whiteboardId) });
      await queryClient.invalidateQueries({ queryKey: ["/api/v1/whiteboards"] });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
