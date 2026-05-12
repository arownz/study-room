import { and, desc, eq, type SQL } from "drizzle-orm";
import { pomodoroSessions, userPomodoroPreferences } from "@workspace/db/schema";
import { db } from "../../lib/database";
import type { CreatePomodoroSessionBody, ListPomodoroSessionsQuery } from "./contracts";

export class PomodoroRepository {
  async createSession(
    userId: string,
    sessionId: string,
    payload: CreatePomodoroSessionBody,
  ) {
    const startedAt = new Date(payload.startedAt);
    const completedAt = new Date(payload.completedAt);
    await db.insert(pomodoroSessions).values({
      id: sessionId,
      userId,
      mode: payload.mode,
      durationPlannedSec: payload.durationPlannedSec,
      durationActualSec: payload.durationActualSec,
      label: payload.label ?? null,
      startedAt,
      completedAt,
    });
    const row = await this.getSessionById(userId, sessionId);
    if (!row) throw new Error("Pomodoro session insert failed");
    return row;
  }

  async getSessionById(userId: string, sessionId: string) {
    const rows = await db
      .select()
      .from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, userId), eq(pomodoroSessions.id, sessionId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async listSessions(userId: string, query: ListPomodoroSessionsQuery) {
    const conditions: SQL[] = [eq(pomodoroSessions.userId, userId)];
    if (query.mode) {
      conditions.push(eq(pomodoroSessions.mode, query.mode));
    }
    const items = await db
      .select()
      .from(pomodoroSessions)
      .where(and(...conditions))
      .orderBy(desc(pomodoroSessions.completedAt))
      .limit(query.limit)
      .offset(query.offset);
    return items;
  }

  async getPreferences(userId: string) {
    const [row] = await db
      .select()
      .from(userPomodoroPreferences)
      .where(eq(userPomodoroPreferences.userId, userId))
      .limit(1);
    return row ?? null;
  }

  async upsertPreferences(
    userId: string,
    payload: { focusSec: number; shortBreakSec: number; longBreakSec: number },
  ) {
    const now = new Date();
    const [row] = await db
      .insert(userPomodoroPreferences)
      .values({
        userId,
        focusSec: payload.focusSec,
        shortBreakSec: payload.shortBreakSec,
        longBreakSec: payload.longBreakSec,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userPomodoroPreferences.userId,
        set: {
          focusSec: payload.focusSec,
          shortBreakSec: payload.shortBreakSec,
          longBreakSec: payload.longBreakSec,
          updatedAt: now,
        },
      })
      .returning();
    return row ?? null;
  }
}
