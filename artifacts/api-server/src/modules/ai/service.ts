import { randomUUID } from "node:crypto";
import type { PaginationQuery } from "../../core/http/contracts";
import { AppError } from "../../lib/app-error";
import {
  aiMessageDtoSchema,
  aiTemplateKeySchema,
  aiThreadDtoSchema,
  appendAiMessageResponseSchema,
  listAiMessagesResponseSchema,
  listAiThreadsResponseSchema,
} from "./contracts";
import { completeStudyTutorChat } from "./openai-provider";
import { resolveTemplatePrompt } from "./prompt-templates";
import { AiRepository } from "./repository";
import type { AppendAiMessageBody, CreateAiThreadBody } from "./types";

function toIso(d: Date): string {
  return d.toISOString();
}

function toLlmTurn(row: { role: string; content: string; templateKey: string | null }): {
  role: "user" | "assistant";
  content: string;
} {
  if (row.role === "assistant") {
    return { role: "assistant", content: row.content };
  }
  const parsedKey = row.templateKey ? aiTemplateKeySchema.safeParse(row.templateKey) : null;
  const content =
    parsedKey && parsedKey.success
      ? resolveTemplatePrompt(parsedKey.data, row.content)
      : row.content;
  return { role: "user", content };
}

export class AiService {
  constructor(private readonly repository: AiRepository) {}

  async listAiJobs(query: PaginationQuery) {
    return {
      items: await this.repository.listAiJobs(query),
    };
  }

  async createThread(userId: string, body: CreateAiThreadBody) {
    const row = await this.repository.createThread(userId, randomUUID(), body);
    return aiThreadDtoSchema.parse({
      id: row.id,
      title: row.title,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    });
  }

  async listThreads(userId: string, query: PaginationQuery) {
    const rows = await this.repository.listThreads(userId, query);
    return listAiThreadsResponseSchema.parse({
      items: rows.map((row) =>
        aiThreadDtoSchema.parse({
          id: row.id,
          title: row.title,
          createdAt: toIso(row.createdAt),
          updatedAt: toIso(row.updatedAt),
        }),
      ),
      limit: query.limit,
      offset: query.offset,
    });
  }

  async listMessages(userId: string, threadId: string) {
    const thread = await this.repository.getThread(userId, threadId);
    if (!thread) {
      throw new AppError("Thread not found", 404, "NOT_FOUND");
    }
    const rows = await this.repository.listMessagesForThread(threadId);
    return listAiMessagesResponseSchema.parse({
      items: rows
        .filter((row) => row.role === "user" || row.role === "assistant")
        .map((row) =>
          aiMessageDtoSchema.parse({
            id: row.id,
            threadId: row.threadId,
            role: row.role === "assistant" ? "assistant" : "user",
            content: row.content,
            templateKey: row.templateKey,
            createdAt: toIso(row.createdAt),
          }),
        ),
    });
  }

  async appendMessage(userId: string, threadId: string, body: AppendAiMessageBody) {
    const thread = await this.repository.getThread(userId, threadId);
    if (!thread) {
      throw new AppError("Thread not found", 404, "NOT_FOUND");
    }

    const userMessageId = randomUUID();
    const userRow = await this.repository.insertMessage(
      threadId,
      userMessageId,
      "user",
      body.content,
      body.templateKey ?? null,
    );

    await this.repository.maybeSetTitleFromFirstMessage(threadId, body.content);
    await this.repository.touchThread(threadId);

    const historyRows = await this.repository.listMessagesForThread(threadId);
    const llmHistory = historyRows
      .filter((r) => r.role === "user" || r.role === "assistant")
      .slice(-24)
      .map(toLlmTurn);

    let assistantText: string;
    try {
      assistantText = await completeStudyTutorChat(llmHistory);
    } catch {
      assistantText = [
        "I couldn’t reach the AI provider just now.",
        "Your message was saved — please try again in a moment.",
      ].join("\n");
    }

    const assistantRow = await this.repository.insertMessage(
      threadId,
      randomUUID(),
      "assistant",
      assistantText,
      null,
    );
    await this.repository.touchThread(threadId);

    return appendAiMessageResponseSchema.parse({
      userMessage: aiMessageDtoSchema.parse({
        id: userRow.id,
        threadId: userRow.threadId,
        role: "user",
        content: userRow.content,
        templateKey: userRow.templateKey,
        createdAt: toIso(userRow.createdAt),
      }),
      assistantMessage: aiMessageDtoSchema.parse({
        id: assistantRow.id,
        threadId: assistantRow.threadId,
        role: "assistant",
        content: assistantRow.content,
        templateKey: assistantRow.templateKey,
        createdAt: toIso(assistantRow.createdAt),
      }),
    });
  }
}
