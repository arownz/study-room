import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Flame, Clock, Layers, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockAnalytics, mockUser } from "@/lib/mock-data";

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

const intensityColors = [
  "bg-muted",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/60",
  "bg-primary/90",
];

export default function Analytics() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-bold">Analytics</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Your study performance at a glance</p>
      </motion.div>

      {/* Top stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Hours", value: `${mockUser.totalHours}h`, icon: Clock, color: "text-primary", change: "+12h this week" },
          { label: "Current Streak", value: `${mockUser.streak} days`, icon: Flame, color: "text-orange-400", change: "Best: 21 days" },
          { label: "Cards Mastered", value: "157", icon: Layers, color: "text-violet-400", change: "+24 this week" },
          { label: "Rank", value: mockUser.rank, icon: Award, color: "text-amber-400", change: "Top 12% this month" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60" data-testid={`analytics-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Icon size={15} className={s.color} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Charts row 1 */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              Daily Study Hours (May)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={mockAnalytics.dailyFocus} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(248,87%,66%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(248,87%,66%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="hours" stroke="hsl(248,87%,66%)" strokeWidth={2} fill="url(#focusGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={mockAnalytics.subjectBreakdown} cx="50%" cy="50%" innerRadius={32} outerRadius={54} dataKey="hours" stroke="none">
                  {mockAnalytics.subjectBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}h`, "Hours"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {mockAnalytics.subjectBreakdown.map((s) => (
                <div key={s.subject} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground flex-1">{s.subject}</span>
                  <span className="font-semibold">{s.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak calendar + flashcard mastery */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              Activity Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5" data-testid="activity-heatmap">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                <div key={d} className="text-center text-[9px] text-muted-foreground pb-1">{d}</div>
              ))}
              {mockAnalytics.streakCalendar.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-sm",
                    intensityColors[day.intensity]
                  )}
                  title={`${day.intensity > 0 ? day.intensity * 1.5 : 0}h studied`}
                  data-testid={`heatmap-day-${i}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
              <span>Less</span>
              {intensityColors.map((c, i) => (
                <div key={i} className={cn("w-3 h-3 rounded-sm", c)} />
              ))}
              <span>More</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              Flashcard Mastery by Subject
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAnalytics.flashcardMastery.map((deck) => {
              const pct = Math.round((deck.mastered / deck.total) * 100);
              return (
                <div key={deck.name} className="space-y-1.5" data-testid={`mastery-${deck.name.toLowerCase()}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{deck.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{deck.mastered}/{deck.total}</span>
                      <Badge variant="secondary" className="text-[10px] py-0">{pct}%</Badge>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly hours bar */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={mockAnalytics.dailyFocus} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
                <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
                  {mockAnalytics.dailyFocus.map((_, i) => (
                    <Cell key={i} fill={i === mockAnalytics.dailyFocus.length - 1 ? "hsl(248,87%,66%)" : "hsl(248,87%,50%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
