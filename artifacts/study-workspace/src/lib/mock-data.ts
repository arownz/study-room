export const mockUser = {
  name: "Harold Pasion",
  email: "pasionharold@gmail.com",
  avatar: "HP",
  streak: 14,
  totalHours: 248,
  rank: "Scholar",
};

export const mockStudyStats = {
  weeklyHours: [
    { day: "Mon", hours: 3.5 },
    { day: "Tue", hours: 5.0 },
    { day: "Wed", hours: 2.0 },
    { day: "Thu", hours: 6.5 },
    { day: "Fri", hours: 4.0 },
    { day: "Sat", hours: 7.5 },
    { day: "Sun", hours: 3.0 },
  ],
  todayFocusHours: 4.2,
  weeklyGoal: 35,
  weeklyCompleted: 31.5,
  monthlyHours: [
    { week: "W1", hours: 24 },
    { week: "W2", hours: 31 },
    { week: "W3", hours: 18 },
    { week: "W4", hours: 35 },
  ],
};

export const mockNotes = [
  {
    id: "1",
    title: "Organic Chemistry — Reaction Mechanisms",
    folder: "Chemistry",
    content: "## SN1 vs SN2 Reactions\n\nThe key difference between SN1 and SN2 reactions lies in the mechanism...\n\n### SN1 (Substitution Nucleophilic Unimolecular)\n- Two-step mechanism\n- Rate depends only on substrate concentration\n- Forms carbocation intermediate\n\n### SN2 (Substitution Nucleophilic Bimolecular)\n- One-step mechanism (concerted)\n- Rate depends on both substrate and nucleophile\n- Inversion of stereochemistry (Walden inversion)",
    preview: "SN1 vs SN2 reactions — comparing mechanisms and stereochemistry...",
    updatedAt: "2 hours ago",
    favorite: true,
    tags: ["chemistry", "organic"],
  },
  {
    id: "2",
    title: "Calculus III — Vector Fields",
    folder: "Mathematics",
    content: "## Vector Fields\n\nA vector field assigns a vector to each point in space...\n\n### Gradient Fields\nGiven a scalar function f, the gradient field ∇f is...\n\n### Curl and Divergence\nCurl measures rotation, divergence measures expansion...",
    preview: "Vector fields, gradient, curl and divergence operations...",
    updatedAt: "Yesterday",
    favorite: false,
    tags: ["math", "calculus"],
  },
  {
    id: "3",
    title: "History of Computing — Key Milestones",
    folder: "Computer Science",
    content: "## Computing Milestones\n\n1. 1936 — Turing Machine concept\n2. 1945 — ENIAC, first general-purpose computer\n3. 1969 — ARPANET (precursor to internet)\n4. 1971 — Intel 4004 (first microprocessor)",
    preview: "Timeline of major computing breakthroughs from Turing to modern era...",
    updatedAt: "3 days ago",
    favorite: true,
    tags: ["history", "cs"],
  },
  {
    id: "4",
    title: "Molecular Biology — DNA Replication",
    folder: "Biology",
    content: "## DNA Replication\n\nSemi-conservative replication: each new DNA molecule consists of one original and one new strand...",
    preview: "Semi-conservative replication, DNA polymerase, leading and lagging strands...",
    updatedAt: "5 days ago",
    favorite: false,
    tags: ["biology", "genetics"],
  },
  {
    id: "5",
    title: "Macroeconomics — IS-LM Model",
    folder: "Economics",
    content: "## IS-LM Framework\n\nThe IS-LM model represents the intersection of goods market (IS) and money market (LM)...",
    preview: "Investment-Savings and Liquidity Preference-Money Supply curves...",
    updatedAt: "1 week ago",
    favorite: false,
    tags: ["economics", "macro"],
  },
];

export const mockFolders = [
  { name: "Chemistry", count: 4 },
  { name: "Mathematics", count: 7 },
  { name: "Computer Science", count: 3 },
  { name: "Biology", count: 5 },
  { name: "Economics", count: 2 },
];

export const mockFlashcardDecks = [
  {
    id: "1",
    title: "Organic Chemistry Reactions",
    subject: "Chemistry",
    cardCount: 48,
    mastered: 32,
    due: 8,
    difficulty: "Hard",
    lastStudied: "2 hours ago",
    color: "hsl(248 87% 66%)",
  },
  {
    id: "2",
    title: "Calculus Formulas",
    subject: "Mathematics",
    cardCount: 36,
    mastered: 28,
    due: 4,
    difficulty: "Medium",
    lastStudied: "Yesterday",
    color: "hsl(270 80% 60%)",
  },
  {
    id: "3",
    title: "Historical Dates & Events",
    subject: "History",
    cardCount: 60,
    mastered: 42,
    due: 12,
    difficulty: "Easy",
    lastStudied: "3 days ago",
    color: "hsl(190 90% 50%)",
  },
  {
    id: "4",
    title: "Biology Terminology",
    subject: "Biology",
    cardCount: 80,
    mastered: 55,
    due: 15,
    difficulty: "Medium",
    lastStudied: "5 days ago",
    color: "hsl(160 80% 45%)",
  },
];

export const mockFlashcards = [
  {
    id: "1",
    front: "What is the difference between SN1 and SN2 reactions?",
    back: "SN1 is a two-step unimolecular process forming a carbocation intermediate, rate depends only on substrate. SN2 is a concerted bimolecular mechanism, rate depends on both substrate and nucleophile, causing Walden inversion.",
    difficulty: "Hard",
    mastered: false,
  },
  {
    id: "2",
    front: "Define Le Chatelier's Principle",
    back: "When a system at equilibrium is disturbed, the system shifts in the direction that counteracts the disturbance and restores equilibrium.",
    difficulty: "Medium",
    mastered: true,
  },
  {
    id: "3",
    front: "What is a nucleophile?",
    back: "A nucleophile is an electron-pair donor that seeks positive charge. It attacks electrophiles by donating electrons to form a new covalent bond.",
    difficulty: "Easy",
    mastered: true,
  },
];

export const mockStudyRooms = [
  {
    id: "1",
    name: "Calculus Study Group",
    subject: "Mathematics",
    participants: [
      { name: "Harold Pasion", avatar: "HP", status: "active" },
      { name: "Maya Patel", avatar: "MP", status: "active" },
      { name: "Jordan Lee", avatar: "JL", status: "idle" },
      { name: "Sam Rivera", avatar: "SR", status: "active" },
    ],
    timer: "1:24:35",
    timerRunning: true,
    maxParticipants: 8,
    isPublic: true,
    topic: "Integration by parts — problem set 4",
    messages: [
      { sender: "Maya Patel", avatar: "MP", text: "Can someone explain the u-substitution for problem 7?", time: "2:14 PM" },
      { sender: "Jordan Lee", avatar: "JL", text: "Sure! Let u = sin(x), then du = cos(x)dx...", time: "2:15 PM" },
      { sender: "Sam Rivera", avatar: "SR", text: "The tricky part is choosing u wisely. LIATE rule helps.", time: "2:16 PM" },
      { sender: "Harold Pasion", avatar: "HP", text: "Got it! Thanks everyone. Starting on problem 8 now.", time: "2:17 PM" },
    ],
    tasks: [
      { text: "Complete Problem Set 4 (Q1–5)", done: true },
      { text: "Review Integration by Parts notes", done: true },
      { text: "Problems 6–10", done: false },
      { text: "Practice exam problems", done: false },
    ],
  },
  {
    id: "2",
    name: "Organic Chem Deep Dive",
    subject: "Chemistry",
    participants: [
      { name: "Riley Kim", avatar: "RK", status: "active" },
      { name: "Charlie Wang", avatar: "CW", status: "active" },
    ],
    timer: "0:45:12",
    timerRunning: true,
    maxParticipants: 6,
    isPublic: true,
    topic: "Nucleophilic substitution reaction mechanisms",
    messages: [],
    tasks: [],
  },
  {
    id: "3",
    name: "History Essay Prep",
    subject: "History",
    participants: [
      { name: "Dana Cruz", avatar: "DC", status: "active" },
    ],
    timer: "0:00:00",
    timerRunning: false,
    maxParticipants: 4,
    isPublic: false,
    topic: "Cold War essay outline and thesis",
    messages: [],
    tasks: [],
  },
];

export const mockAIMessages = [
  {
    id: "1",
    role: "user" as const,
    content: "Can you explain the concept of entropy in thermodynamics?",
    timestamp: "2:10 PM",
  },
  {
    id: "2",
    role: "assistant" as const,
    content: "Entropy is a measure of the disorder or randomness in a thermodynamic system. Formally, it's defined by the Clausius inequality:\n\n**ΔS = Q_rev / T**\n\nwhere Q_rev is the heat transferred reversibly and T is the temperature in Kelvin.\n\nThe second law of thermodynamics states that the total entropy of an isolated system can only increase or remain constant — it never decreases spontaneously. This is why:\n\n1. **Heat flows from hot to cold** — this increases total entropy\n2. **Processes are irreversible** — mixing gases, friction, etc.\n3. **Order spontaneously becomes disorder** — not vice versa\n\nFrom a statistical perspective (Boltzmann), entropy is S = k·ln(W), where W is the number of microstates available to the system. More microstates = more disorder = higher entropy.",
    timestamp: "2:10 PM",
  },
  {
    id: "3",
    role: "user" as const,
    content: "What's the difference between entropy and enthalpy?",
    timestamp: "2:12 PM",
  },
  {
    id: "4",
    role: "assistant" as const,
    content: "Great question! Entropy and enthalpy are both thermodynamic state functions, but they measure different things:\n\n**Enthalpy (H)** measures heat content:\n- H = U + PV (internal energy + pressure-volume work)\n- ΔH = heat absorbed/released at constant pressure\n- Exothermic reactions: ΔH < 0 (releases heat)\n- Endothermic reactions: ΔH > 0 (absorbs heat)\n\n**Entropy (S)** measures disorder:\n- Measures the number of microstates available\n- Always increases in spontaneous isolated processes\n- ΔS > 0 means increasing disorder\n\nThey come together in **Gibbs Free Energy (G)**:\n**ΔG = ΔH − TΔS**\n\nA reaction is spontaneous when ΔG < 0. This is why some endothermic reactions can still be spontaneous — if ΔS is large enough, the TΔS term dominates.",
    timestamp: "2:12 PM",
  },
];

export const mockSuggestedPrompts = [
  "Explain a complex concept simply",
  "Generate flashcards from my notes",
  "Create a practice quiz",
  "Summarize this topic",
  "Help me outline an essay",
  "Solve this problem step by step",
];

export const mockAnalytics = {
  subjectBreakdown: [
    { subject: "Chemistry", hours: 28, color: "hsl(248 87% 66%)" },
    { subject: "Mathematics", hours: 22, color: "hsl(270 80% 60%)" },
    { subject: "Biology", hours: 18, color: "hsl(160 80% 45%)" },
    { subject: "History", hours: 12, color: "hsl(190 90% 50%)" },
    { subject: "Economics", hours: 8, color: "hsl(340 85% 65%)" },
  ],
  streakCalendar: Array.from({ length: 35 }, (_, i) => ({
    date: i,
    intensity: Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0,
  })),
  flashcardMastery: [
    { name: "Chemistry", mastered: 32, total: 48 },
    { name: "Calculus", mastered: 28, total: 36 },
    { name: "History", mastered: 42, total: 60 },
    { name: "Biology", mastered: 55, total: 80 },
  ],
  dailyFocus: [
    { date: "May 1", hours: 4.5 },
    { date: "May 2", hours: 3.0 },
    { date: "May 3", hours: 6.0 },
    { date: "May 4", hours: 2.5 },
    { date: "May 5", hours: 5.5 },
    { date: "May 6", hours: 4.0 },
    { date: "May 7", hours: 7.0 },
    { date: "May 8", hours: 4.2 },
  ],
};

export const mockPomodoroTasks = [
  { id: "1", text: "Review Chapter 8 — Reaction Mechanisms", done: true },
  { id: "2", text: "Complete calculus problem set 4 (Q6–10)", done: false },
  { id: "3", text: "Re-read economics lecture notes", done: false },
  { id: "4", text: "Practice 20 flashcards", done: false },
  { id: "5", text: "Outline essay introduction", done: false },
];

export const mockAmbientSounds = [
  { id: "1", name: "Rain on Window", icon: "CloudRain", active: false },
  { id: "2", name: "Coffee Shop", icon: "Coffee", active: true },
  { id: "3", name: "Deep Focus", icon: "Waves", active: false },
  { id: "4", name: "Forest", icon: "TreePine", active: false },
  { id: "5", name: "White Noise", icon: "Wind", active: false },
  { id: "6", name: "Lo-Fi Beats", icon: "Music", active: false },
];

export const mockUpcomingSessions = [
  { title: "Calculus Study Group", time: "Today, 4:00 PM", subject: "Mathematics", participants: 4 },
  { title: "Chemistry Lab Review", time: "Tomorrow, 2:00 PM", subject: "Chemistry", participants: 2 },
  { title: "History Essay Workshop", time: "Thu, 6:00 PM", subject: "History", participants: 3 },
];

export const mockRecentActivity = [
  { type: "note", text: "Edited Organic Chemistry — Reaction Mechanisms", time: "2h ago" },
  { type: "flashcard", text: "Studied 24 Calculus flashcards (82% accuracy)", time: "3h ago" },
  { type: "room", text: "Joined Calculus Study Group for 90 min", time: "Yesterday" },
  { type: "ai", text: "Generated summary of Molecular Biology chapter", time: "Yesterday" },
  { type: "note", text: "Created IS-LM Model note", time: "2 days ago" },
];
