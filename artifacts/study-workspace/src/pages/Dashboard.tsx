import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Flame, Clock, TrendingUp, Users, BookOpen, Layers, Sparkles, ArrowRight, Calendar, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { mockStudyStats, mockUser, mockNotes, mockFlashcardDecks, mockUpcomingSessions, mockRecentActivity, mockStudyRooms } from "@/lib/mock-data";
import { Link } from "wouter";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const activityIcon: Record<string, typeof Flame> = {
  note: BookOpen,
  flashcard: Layers,
  room: Users,
  ai: Sparkles,
};

const pieColors = ["hsl(248,87%,66%)", "hsl(270,80%,60%)", "hsl(190,90%,50%)", "hsl(160,80%,45%)", "hsl(340,85%,65%)"];

export default function Dashboard() {
  const [loading] = useState(false);
  const weeklyPct = Math.round((mockStudyStats.weeklyCompleted / mockStudyStats.weeklyGoal) * 100);

  const subjectData = [
    { name: "Chem", value: 28 },
    { name: "Math", value: 22 },
    { name: "Bio", value: 18 },
    { name: "Hist", value: 12 },
    { name: "Econ", value: 8 },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {mockUser.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground text-sm mt-1">You're on a {mockUser.streak}-day streak. Keep it going.</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-semibold">
          <Sparkles size={13} className="text-primary" />
          {mockUser.rank}
        </Badge>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Study Streak", value: `${mockUser.streak} days`, icon: Flame, color: "text-orange-400", sub: "Personal best: 21 days" },
          { label: "Today's Focus", value: `${mockStudyStats.todayFocusHours}h`, icon: Clock, color: "text-primary", sub: "Goal: 6h" },
          { label: "Weekly Progress", value: `${weeklyPct}%`, icon: TrendingUp, color: "text-emerald-400", sub: `${mockStudyStats.weeklyCompleted}/${mockStudyStats.weeklyGoal}h done` },
          { label: "Active Rooms", value: `${mockStudyRooms.filter(r => r.timerRunning).length}`, icon: Users, color: "text-violet-400", sub: "2 rooms live now" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/60 hover:border-primary/30 transition-colors" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="pt-5 pb-4">
                {loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                      <Icon size={16} className={stat.color} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity size={15} className="text-primary" />
              Weekly Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockStudyStats.weeklyHours} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Bar dataKey="hours" fill="hsl(248,87%,66%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen size={15} className="text-primary" />
              Subject Split
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={subjectData} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="value" stroke="none">
                  {subjectData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
              {subjectData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold ml-auto">{s.value}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-4">
        {/* Recent notes */}
        <Card className="border-border/60">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen size={14} className="text-primary" />
              Recent Notes
            </CardTitle>
            <Link href="/notes" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-all-notes">
              All <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockNotes.slice(0, 3).map((note) => (
              <div key={note.id} className="flex items-start gap-2.5 py-1.5 hover:bg-muted/50 rounded-md px-2 -mx-2 cursor-pointer transition-colors" data-testid={`note-item-${note.id}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground">{note.updatedAt}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming sessions */}
        <Card className="border-border/60">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUpcomingSessions.map((session, i) => (
              <div key={i} className="flex items-center gap-3" data-testid={`session-item-${i}`}>
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{session.time}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{session.participants} joined</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {mockRecentActivity.slice(0, 5).map((item, i) => {
              const Icon = activityIcon[item.type] || Activity;
              return (
                <div key={i} className="flex items-start gap-2.5" data-testid={`activity-item-${i}`}>
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={11} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Flashcard progress */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/60">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              Flashcard Progress
            </CardTitle>
            <Link href="/flashcards" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-all-flashcards">
              All Decks <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {mockFlashcardDecks.slice(0, 4).map((deck) => {
              const pct = Math.round((deck.mastered / deck.cardCount) * 100);
              return (
                <div key={deck.id} className="space-y-2" data-testid={`deck-progress-${deck.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{deck.title}</span>
                    <span className="text-muted-foreground text-xs ml-2 shrink-0">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{deck.mastered}/{deck.cardCount} mastered</span>
                    <Badge variant="outline" className="text-[10px] py-0">{deck.due} due</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Recommendation */}
      <motion.div variants={fadeUp}>
        <Card className="bg-primary/5 border-border/60">
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">AI Recommendation</p>
              <p className="text-xs text-muted-foreground mt-0.5">You haven't reviewed your Organic Chemistry flashcards in 3 days. 8 cards are due — a 10-minute session now will lock in long-term retention.</p>
            </div>
            <Link href="/flashcards">
              <Button size="sm" className="shrink-0" data-testid="button-ai-recommendation">
                Start Review
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
