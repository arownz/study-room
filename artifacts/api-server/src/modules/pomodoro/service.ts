import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import type { CreatePomodoroSessionBody, ListPomodoroSessionsQuery } from "./contracts";
import { pomodoroSessionDtoSchema } from "./contracts";
import { PomodoroRepository } from "./repository";

function toIso(d: Date): string {
  return d.toISOString();
}

export class PomodoroService {
  constructor(private readonly repository: PomodoroRepository) {}

  async createSession(userId: string, body: CreatePomodoroSessionBody) {
    const startedAt = new Date(body.startedAt);
    const completedAt = new Date(body.completedAt);
    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(completedAt.getTime())) {
      throw new AppError("Invalid session timestamps", 400, "VALIDATION_ERROR");
    }
    if (completedAt.getTime() < startedAt.getTime()) {
      throw new AppError("completedAt must be after startedAt", 400, "VALIDATION_ERROR");
    }
    if (body.durationActualSec > body.durationPlannedSec + 5) {
      throw new AppError("durationActualSec exceeds planned duration", 400, "VALIDATION_ERROR");
    }
    const row = await this.repository.createSession(userId, randomUUID(), body);
    return pomodoroSessionDtoSchema.parse({
      id: row.id,
      mode: row.mode,
      durationPlannedSec: row.durationPlannedSec,
      durationActualSec: row.durationActualSec,
      label: row.label,
      startedAt: toIso(row.startedAt),
      completedAt: toIso(row.completedAt),
      createdAt: toIso(row.createdAt),
    });
  }

  async listSessions(userId: string, query: ListPomodoroSessionsQuery) {
    const rows = await this.repository.listSessions(userId, query);
    return {
      items: rows.map((row) =>
        pomodoroSessionDtoSchema.parse({
          id: row.id,
          mode: row.mode,
          durationPlannedSec: row.durationPlannedSec,
          durationActualSec: row.durationActualSec,
          label: row.label,
          startedAt: toIso(row.startedAt),
          completedAt: toIso(row.completedAt),
          createdAt: toIso(row.createdAt),
        }),
      ),
      limit: query.limit,
      offset: query.offset,
    };
  }
}
