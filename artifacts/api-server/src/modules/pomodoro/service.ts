import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import type { CreatePomodoroSessionBody, ListPomodoroSessionsQuery } from "./contracts";
import {
  pomodoroPreferencesDtoSchema,
  pomodoroSessionDtoSchema,
  type PomodoroPreferencesDto,
  type PomodoroPreferencesPutBody,
} from "./contracts";
import { PomodoroRepository } from "./repository";

const DEFAULT_FOCUS_SEC = 25 * 60;
const DEFAULT_SHORT_BREAK_SEC = 5 * 60;
const DEFAULT_LONG_BREAK_SEC = 15 * 60;

function toIso(d: Date): string {
  return d.toISOString();
}

function defaultPreferencesDto(): PomodoroPreferencesDto {
  return pomodoroPreferencesDtoSchema.parse({
    focusSec: DEFAULT_FOCUS_SEC,
    shortBreakSec: DEFAULT_SHORT_BREAK_SEC,
    longBreakSec: DEFAULT_LONG_BREAK_SEC,
    updatedAt: new Date(0).toISOString(),
  });
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

  async getPreferences(userId: string): Promise<PomodoroPreferencesDto> {
    const row = await this.repository.getPreferences(userId);
    if (!row) {
      return defaultPreferencesDto();
    }
    return pomodoroPreferencesDtoSchema.parse({
      focusSec: row.focusSec,
      shortBreakSec: row.shortBreakSec,
      longBreakSec: row.longBreakSec,
      updatedAt: toIso(row.updatedAt),
    });
  }

  async putPreferences(userId: string, body: PomodoroPreferencesPutBody): Promise<PomodoroPreferencesDto> {
    const row = await this.repository.upsertPreferences(userId, {
      focusSec: body.focusSec,
      shortBreakSec: body.shortBreakSec,
      longBreakSec: body.longBreakSec,
    });
    if (!row) {
      throw new AppError("Failed to save preferences", 500, "INTERNAL_ERROR");
    }
    return pomodoroPreferencesDtoSchema.parse({
      focusSec: row.focusSec,
      shortBreakSec: row.shortBreakSec,
      longBreakSec: row.longBreakSec,
      updatedAt: toIso(row.updatedAt),
    });
  }
}
