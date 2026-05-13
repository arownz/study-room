/**
 * Legacy re-exports aligned with Orval-generated names.
 * Prefer importing from `@workspace/api-client-react` (package index → `./generated/api`).
 */
export type {
  AiMessage,
  AiThread,
  AppendAiMessageRequest,
  AppendAiMessageRequestTemplateKey,
  CreateAiThreadRequest,
  ListAiMessagesResponse,
  ListAiThreadsParams,
} from "./generated/api.schemas";

export {
  appendAiThreadMessage,
  createAiThread,
  getListAiThreadMessagesQueryKey,
  getListAiThreadsQueryKey,
  getListAiThreadsQueryOptions,
  listAiThreadMessages,
  listAiThreads,
  useAppendAiThreadMessage,
  useCreateAiThread,
  useListAiThreadMessages,
  useListAiThreads,
} from "./generated/api";
