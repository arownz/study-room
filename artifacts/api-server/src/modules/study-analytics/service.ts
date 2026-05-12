import { studyAnalyticsSchema, type StudyAnalytics, type StudyAnalyticsQuery } from "./contracts";
import { StudyAnalyticsRepository } from "./repository";

function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addUtcDays(isoDay: string, delta: number): string {
  const [y, m, dd] = isoDay.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, dd!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function formatChartLabel(isoDay: string): string {
  return new Date(`${isoDay}T12:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function intensityFromSeconds(sec: number): number {
  if (sec <= 0) return 0;
  const hours = sec / 3600;
  if (hours < 0.25) return 1;
  if (hours < 0.75) return 2;
  if (hours < 1.5) return 3;
  return 4;
}

function hashHue(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i += 1) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function rankFromHours(hours: number): { label: string; subtitle: string } {
  if (hours < 2) {
    return { label: "Newcomer", subtitle: "Earn focus hours to climb" };
  }
  if (hours < 10) {
    return { label: "Focused", subtitle: "Building a steady habit" };
  }
  if (hours < 50) {
    return { label: "Scholar", subtitle: "Strong deep-work rhythm" };
  }
  return { label: "Master", subtitle: "Elite consistency" };
}

function streakDaysUtc(activeDayKeys: Set<string>, todayKey: string): number {
  let streak = 0;
  let cur = todayKey;
  while (activeDayKeys.has(cur)) {
    streak += 1;
    cur = addUtcDays(cur, -1);
  }
  if (streak > 0) {
    return streak;
  }
  cur = addUtcDays(todayKey, -1);
  while (activeDayKeys.has(cur)) {
    streak += 1;
    cur = addUtcDays(cur, -1);
  }
  return streak;
}

export class StudyAnalyticsService {
  constructor(private readonly repository: StudyAnalyticsRepository) {}

  async getForUser(userId: string, query: StudyAnalyticsQuery): Promise<StudyAnalytics> {
    const now = new Date();
    const todayKey = utcDateKey(now);
    const lookbackDays = Math.max(query.chartDays, query.heatmapDays, 400);
    const since = new Date(now);
    since.setUTCDate(since.getUTCDate() - lookbackDays);

    const [totalFocusSecAllTime, sessions, flashcardCount, deckRows] = await Promise.all([
      this.repository.getTotalFocusSecondsAllTime(userId),
      this.repository.listFocusSessionsSince(userId, since),
      this.repository.getFlashcardCount(userId),
      this.repository.listDeckCardCounts(userId),
    ]);

    const secondsByUtcDay = new Map<string, number>();
    const secondsByLabel = new Map<string, number>();

    for (const s of sessions) {
      const key = utcDateKey(s.completedAt);
      secondsByUtcDay.set(key, (secondsByUtcDay.get(key) ?? 0) + s.durationActualSec);
      const raw = (s.label ?? "").trim();
      const label = raw.length > 0 ? raw : "Unlabeled";
      secondsByLabel.set(label, (secondsByLabel.get(label) ?? 0) + s.durationActualSec);
    }

    const activeDayKeys = new Set<string>();
    for (const [k, sec] of secondsByUtcDay) {
      if (sec > 0) activeDayKeys.add(k);
    }

    const dailyFocus = Array.from({ length: query.chartDays }, (_, i) => {
      const offset = query.chartDays - 1 - i;
      const dateKey = addUtcDays(todayKey, -offset);
      const sec = secondsByUtcDay.get(dateKey) ?? 0;
      return {
        date: formatChartLabel(dateKey),
        dateKey,
        hours: Math.round((sec / 3600) * 100) / 100,
      };
    });

    let subjectBreakdown = [...secondsByLabel.entries()]
      .map(([subject, sec]) => ({
        subject,
        hours: Math.round((sec / 3600) * 100) / 100,
        color: `hsl(${hashHue(subject)} 70% 55%)`,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);

    if (subjectBreakdown.length === 0) {
      subjectBreakdown = [
        {
          subject: "No focus sessions yet",
          hours: 0,
          color: "hsl(215 16% 47%)",
        },
      ];
    }

    const streakCalendar = Array.from({ length: query.heatmapDays }, (_, i) => {
      const offset = query.heatmapDays - 1 - i;
      const dateKey = addUtcDays(todayKey, -offset);
      const sec = secondsByUtcDay.get(dateKey) ?? 0;
      return {
        dateKey,
        intensity: intensityFromSeconds(sec),
      };
    });

    const flashcardMastery = deckRows.map((d) => ({
      name: d.name,
      mastered: 0,
      total: d.total,
    }));

    const totalFocusHours = Math.round((totalFocusSecAllTime / 3600) * 100) / 100;
    const rank = rankFromHours(totalFocusHours);

    return studyAnalyticsSchema.parse({
      totalFocusHours,
      streakDays: streakDaysUtc(activeDayKeys, todayKey),
      flashcardCount,
      rankLabel: rank.label,
      rankSubtitle: rank.subtitle,
      dailyFocus,
      subjectBreakdown,
      streakCalendar,
      flashcardMastery,
    });
  }
}
