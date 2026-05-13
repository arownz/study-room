import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import type { ProfileUpdateInput, ProfileUser } from "../types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../types";

const PROFILE_PATH = "/api/v1/users/me";
const AVATAR_PATH = "/api/v1/users/me/avatar";
const PROFILE_QUERY_KEY = ["profile", "me"] as const;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

async function fetchProfile(): Promise<ProfileUser> {
  const envelope = await customFetch<ApiEnvelope<ProfileUser>>(PROFILE_PATH, {
    method: "GET",
  });
  const data = envelope.data;
  return {
    ...data,
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(data.notificationPreferences ?? {}),
    },
  };
}

async function patchProfile(input: ProfileUpdateInput): Promise<ProfileUser> {
  const envelope = await customFetch<ApiEnvelope<ProfileUser>>(PROFILE_PATH, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  });
  return envelope.data;
}

async function uploadAvatar(file: File): Promise<ProfileUser> {
  const form = new FormData();
  form.append("file", file);
  const envelope = await customFetch<ApiEnvelope<ProfileUser>>(AVATAR_PATH, {
    method: "POST",
    body: form,
  });
  return envelope.data;
}

async function clearAvatar(): Promise<ProfileUser> {
  const envelope = await customFetch<ApiEnvelope<ProfileUser>>(AVATAR_PATH, {
    method: "DELETE",
  });
  return envelope.data;
}

export function useProfile() {
  const { session, isLoading: isSessionLoading } = useAuth();
  const isAuthenticated = Boolean(session?.user?.id);

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    enabled: !isSessionLoading && isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { refetchSession } = useAuth();

  return useMutation({
    mutationFn: patchProfile,
    onSuccess: async (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
      // Better Auth's session payload caches name/avatar — refresh so
      // top-nav and other session-driven UI update immediately.
      await refetchSession();
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { refetchSession } = useAuth();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
      await refetchSession();
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const { refetchSession } = useAuth();
  return useMutation({
    mutationFn: clearAvatar,
    onSuccess: async (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
      await refetchSession();
    },
  });
}

export const profileQueryKey = PROFILE_QUERY_KEY;
