import { eq } from "drizzle-orm";
import { userWhiteboards } from "@workspace/db/schema";
import { db } from "../../lib/database";

export class WhiteboardRepository {
  async getByUserId(userId: string) {
    const [row] = await db
      .select()
      .from(userWhiteboards)
      .where(eq(userWhiteboards.userId, userId))
      .limit(1);
    return row ?? null;
  }

  async upsertSnapshot(userId: string, snapshot: string) {
    const now = new Date();
    const [row] = await db
      .insert(userWhiteboards)
      .values({
        userId,
        snapshot,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userWhiteboards.userId,
        set: { snapshot, updatedAt: now },
      })
      .returning();
    return row ?? null;
  }
}
