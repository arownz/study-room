import { and, count, eq, gte, sql } from "drizzle-orm";
import {
  flashcardDecks,
  flashcards,
  pomodoroSessions,
} from "@workspace/db/schema";
import { db } from "../../lib/database";

export class StudyAnalyticsRepository {
  async getTotalFocusSecondsAllTime(userId: string): Promise<number> {
    const [row] = await db
      .select({
        sec: sql<number>`coalesce(sum(${pomodoroSessions.durationActualSec}), 0)::int`,
      })
      .from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, userId), eq(pomodoroSessions.mode, "focus")));
    return Number(row?.sec ?? 0);
  }

  async listFocusSessionsSince(userId: string, since: Date) {
    return db
      .select({
        completedAt: pomodoroSessions.completedAt,
        durationActualSec: pomodoroSessions.durationActualSec,
        label: pomodoroSessions.label,
      })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          eq(pomodoroSessions.mode, "focus"),
          gte(pomodoroSessions.completedAt, since),
        ),
      );
  }

  async getFlashcardCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ c: count() })
      .from(flashcards)
      .where(eq(flashcards.userId, userId));
    return Number(row?.c ?? 0);
  }

  async listDeckCardCounts(userId: string) {
    const rows = await db
      .select({
        title: flashcardDecks.title,
        total: count(flashcards.id),
      })
      .from(flashcardDecks)
      .leftJoin(flashcards, eq(flashcards.deckId, flashcardDecks.id))
      .where(eq(flashcardDecks.userId, userId))
      .groupBy(flashcardDecks.id, flashcardDecks.title)
      .orderBy(flashcardDecks.title);
    return rows.map((r) => ({
      name: r.title,
      total: Number(r.total ?? 0),
    }));
  }
}
