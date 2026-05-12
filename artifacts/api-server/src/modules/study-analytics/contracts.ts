import { z } from "zod";

export const studyAnalyticsQuerySchema = z.object({
  chartDays: z.coerce.number().int().min(7).max(90).optional().default(14),
  heatmapDays: z.coerce.number().int().min(14).max(56).optional().default(35),
});

export const studyAnalyticsDailyPointSchema = z.object({
  date: z.string(),
  dateKey: z.string(),
  hours: z.number(),
});

export const studyAnalyticsSubjectSliceSchema = z.object({
  subject: z.string(),
  hours: z.number(),
  color: z.string(),
});

export const studyAnalyticsHeatmapDaySchema = z.object({
  dateKey: z.string(),
  intensity: z.number().int().min(0).max(4),
});

export const studyAnalyticsDeckRowSchema = z.object({
  name: z.string(),
  mastered: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const studyAnalyticsSchema = z.object({
  totalFocusHours: z.number(),
  streakDays: z.number().int().nonnegative(),
  flashcardCount: z.number().int().nonnegative(),
  rankLabel: z.string(),
  rankSubtitle: z.string(),
  dailyFocus: z.array(studyAnalyticsDailyPointSchema),
  subjectBreakdown: z.array(studyAnalyticsSubjectSliceSchema),
  streakCalendar: z.array(studyAnalyticsHeatmapDaySchema),
  flashcardMastery: z.array(studyAnalyticsDeckRowSchema),
});

export type StudyAnalyticsQuery = z.infer<typeof studyAnalyticsQuerySchema>;
export type StudyAnalytics = z.infer<typeof studyAnalyticsSchema>;
