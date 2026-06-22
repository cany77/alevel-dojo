import { papers } from "./papersData";
import { examDates } from "./data/examDates";
import { gradeBoundaries as generatedGradeBoundaries } from "./data/gradeBoundaries.generated";
import { umsBoundaries } from "./data/umsBoundaries";
import { supabase } from "./supabaseClient";
import PdfViewer from "./PdfViewer";
import Watermark from "./Watermark";
import usePersistentState from "./usePersistentState";
import { annotationsFromPayload, cleanPdfExportFilename, exportAnnotatedPdf } from "./pdfExport";
import { subjectGroups } from "./data/subjects";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  Layers3,
  LibraryBig,
  LineChart as LineChartIcon,
  Lock,
  LogOut,
  PanelLeft,
  RotateCcw,
  Plus,
  Save,
  Search,
  Settings2,
  Sparkles,
  Timer,
  X,
  Download,
  Edit3,
  Eye,
  ArrowLeft,
  Atom,
  Calculator,
  Code2,
  Coins,
  Dna,
  Flame,
  FlaskConical,
  MessageCircle,
  PenLine,
  Star,
  Trophy,
} from "lucide-react";

const boardColors = {
  OxfordAQA: {
    chip: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    accent: "text-rose-300",
    button: "bg-rose-400 text-white hover:bg-rose-300",
    soft: "bg-rose-400/10 border-rose-400/20",
  },
  Cambridge: {
    chip: "bg-cyan-400/12 text-cyan-200 border-cyan-300/20",
    accent: "text-cyan-200",
    button: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
    soft: "bg-cyan-400/10 border-cyan-300/20",
  },
  Edexcel: {
    chip: "bg-violet-400/12 text-violet-200 border-violet-300/20",
    accent: "text-violet-200",
    button: "bg-violet-400 text-white hover:bg-violet-300",
    soft: "bg-violet-400/10 border-violet-300/20",
  },
};

const plans = [
  ["Free", "Past papers, topic tests, save progress"],
  ["Pro", "AI tutor, mistakes tracker, grade boundary insights"],
  ["Premium", "Advanced AI, topic-test generator, deeper analytics"],
];

const userPlan = "free";

const avatarStyles = [
  { value: "initials", label: "Initials", icon: null },
  { value: "graduation-cap", label: "Graduation cap", icon: GraduationCap },
  { value: "book", label: "Book", icon: BookOpen },
  { value: "paper", label: "Paper", icon: FileText },
  { value: "calculator", label: "Calculator", icon: Calculator },
  { value: "brain", label: "Brain", icon: Brain },
  { value: "star", label: "Star", icon: Star },
  { value: "flame", label: "Flame", icon: Flame },
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "dojo-a", label: "Dojo A", icon: null },
];

const avatarColors = {
  violet: "from-violet-500 to-fuchsia-400 shadow-violet-500/20",
  cyan: "from-cyan-400 to-sky-500 shadow-cyan-500/20",
  rose: "from-rose-400 to-pink-500 shadow-rose-500/20",
  amber: "from-amber-300 to-orange-500 shadow-amber-500/20",
  green: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
  blue: "from-blue-400 to-indigo-500 shadow-blue-500/20",
};

const subjectVisuals = {
  mathematics: {
    icon: Calculator,
    accent: "from-violet-400 via-fuchsia-400 to-cyan-300",
    glow: "shadow-violet-500/18",
    soft: "bg-violet-400/12 text-violet-100 border-violet-300/20",
    symbol: "∑",
  },
  "further mathematics": {
    icon: LineChartIcon,
    accent: "from-fuchsia-400 via-violet-400 to-cyan-300",
    glow: "shadow-fuchsia-500/18",
    soft: "bg-fuchsia-400/12 text-fuchsia-100 border-fuchsia-300/20",
    symbol: "ƒ",
  },
  statistics: {
    icon: BarChart3,
    accent: "from-amber-300 via-orange-400 to-violet-400",
    glow: "shadow-amber-500/16",
    soft: "bg-amber-400/12 text-amber-100 border-amber-300/20",
    symbol: "%",
  },
  mechanics: {
    icon: RotateCcw,
    accent: "from-orange-300 via-rose-400 to-violet-400",
    glow: "shadow-orange-500/16",
    soft: "bg-orange-400/12 text-orange-100 border-orange-300/20",
    symbol: "→",
  },
  physics: {
    icon: Atom,
    accent: "from-cyan-300 via-blue-400 to-violet-400",
    glow: "shadow-cyan-500/18",
    soft: "bg-cyan-400/12 text-cyan-100 border-cyan-300/20",
    symbol: "λ",
  },
  chemistry: {
    icon: FlaskConical,
    accent: "from-rose-300 via-pink-400 to-violet-400",
    glow: "shadow-rose-500/18",
    soft: "bg-rose-400/12 text-rose-100 border-rose-300/20",
    symbol: "H₂",
  },
  biology: {
    icon: Dna,
    accent: "from-emerald-300 via-teal-400 to-cyan-300",
    glow: "shadow-emerald-500/16",
    soft: "bg-emerald-400/12 text-emerald-100 border-emerald-300/20",
    symbol: "DNA",
  },
  psychology: {
    icon: Brain,
    accent: "from-purple-300 via-violet-400 to-rose-300",
    glow: "shadow-purple-500/18",
    soft: "bg-purple-400/12 text-purple-100 border-purple-300/20",
    symbol: "ψ",
  },
  "computer science": {
    icon: Code2,
    accent: "from-teal-300 via-cyan-400 to-blue-400",
    glow: "shadow-teal-500/16",
    soft: "bg-teal-400/12 text-teal-100 border-teal-300/20",
    symbol: "</>",
  },
  "english literature": {
    icon: BookOpen,
    accent: "from-indigo-300 via-violet-400 to-rose-300",
    glow: "shadow-indigo-500/16",
    soft: "bg-indigo-400/12 text-indigo-100 border-indigo-300/20",
    symbol: "Aa",
  },
  "english language": {
    icon: MessageCircle,
    accent: "from-sky-300 via-indigo-400 to-violet-400",
    glow: "shadow-sky-500/16",
    soft: "bg-sky-400/12 text-sky-100 border-sky-300/20",
    symbol: "“”",
  },
  economics: {
    icon: Coins,
    accent: "from-amber-300 via-cyan-300 to-violet-400",
    glow: "shadow-cyan-500/16",
    soft: "bg-cyan-400/12 text-cyan-100 border-cyan-300/20",
    symbol: "£",
  },
};

const defaultSubjectVisual = {
  icon: BookOpen,
  accent: "from-cyan-300 via-violet-400 to-rose-300",
  glow: "shadow-violet-500/16",
  soft: "bg-white/[0.06] text-white/75 border-white/10",
  symbol: "A*",
};

const rankThresholds = [
  { name: "Starter", xp: 0, accent: "from-slate-300 to-white" },
  { name: "Bronze", xp: 250, accent: "from-amber-700 to-orange-300" },
  { name: "Silver", xp: 750, accent: "from-slate-400 to-slate-100" },
  { name: "Gold", xp: 1500, accent: "from-yellow-500 to-amber-200" },
  { name: "Emerald", xp: 3000, accent: "from-emerald-500 to-cyan-200" },
  { name: "Ruby", xp: 5000, accent: "from-rose-500 to-fuchsia-300" },
  { name: "Diamond", xp: 8000, accent: "from-cyan-300 to-violet-200" },
  { name: "A* Legend", xp: 12000, accent: "from-violet-400 via-fuchsia-300 to-cyan-200" },
];

const achievementDefinitions = [
  { id: "papers-3", label: "Complete 3 papers", unlocked: (stats, xp) => stats.completedPapers >= 3 },
  { id: "papers-10", label: "Complete 10 papers", unlocked: (stats, xp) => stats.completedPapers >= 10 },
  { id: "mistakes-5", label: "Add 5 mistakes", unlocked: (stats, xp) => stats.mistakesCount >= 5 },
  { id: "fixed-5", label: "Fix 5 mistakes", unlocked: (stats, xp) => stats.mistakesFixed >= 5 },
  { id: "streak-3", label: "3 day streak", unlocked: (stats, xp) => stats.streak >= 3 },
  { id: "streak-7", label: "7 day streak", unlocked: (stats, xp) => stats.streak >= 7 },
  { id: "events-3", label: "Add 3 calendar events", unlocked: (stats, xp) => stats.calendarEvents >= 3 },
  { id: "mock-3", label: "Use mock mode 3 times", unlocked: (stats, xp) => stats.mockSessions >= 3 },
  { id: "xp-500", label: "Reach 500 XP", unlocked: (stats, xp) => xp >= 500 },
  { id: "xp-1500", label: "Reach 1500 XP", unlocked: (stats, xp) => xp >= 1500 },
];

const calendarEventTypes = [
  { value: "official", label: "Official exam", dot: "bg-cyan-300", chip: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" },
  { value: "mock", label: "Mock", dot: "bg-violet-300", chip: "border-violet-300/25 bg-violet-400/10 text-violet-100" },
  { value: "topic_test", label: "Topic test", dot: "bg-rose-300", chip: "border-rose-300/25 bg-rose-400/10 text-rose-100" },
  { value: "revision", label: "Revision", dot: "bg-emerald-300", chip: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" },
  { value: "reminder", label: "Reminder", dot: "bg-amber-300", chip: "border-amber-300/25 bg-amber-400/10 text-amber-100" },
  { value: "custom", label: "Custom event", dot: "bg-white/55", chip: "border-white/10 bg-white/[0.04] text-white/65" },
];

const calendarEventColors = {
  cyan: { label: "Cyan", dot: "bg-cyan-300", chip: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100", ring: "ring-cyan-300/45" },
  violet: { label: "Violet", dot: "bg-violet-300", chip: "border-violet-300/25 bg-violet-400/10 text-violet-100", ring: "ring-violet-300/45" },
  rose: { label: "Rose", dot: "bg-rose-300", chip: "border-rose-300/25 bg-rose-400/10 text-rose-100", ring: "ring-rose-300/45" },
  green: { label: "Green", dot: "bg-emerald-300", chip: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100", ring: "ring-emerald-300/45" },
  amber: { label: "Amber", dot: "bg-amber-300", chip: "border-amber-300/25 bg-amber-400/10 text-amber-100", ring: "ring-amber-300/45" },
  blue: { label: "Blue", dot: "bg-blue-300", chip: "border-blue-300/25 bg-blue-400/10 text-blue-100", ring: "ring-blue-300/45" },
};

const defaultEventColorByType = {
  mock: "violet",
  topic_test: "rose",
  revision: "green",
  reminder: "amber",
  custom: "cyan",
};

const defaultDashboardState = {
  activeView: "dashboard",
  activeSubjectId: null,
  subjectSection: "overview",
  selectedBoard: null,
  openedPaper: null,
  openedTopicTest: null,
};

function paperId(paper) {
  return [
    paper.type,
    paper.board,
    paper.subject,
    paper.variant,
    paper.componentCode,
    paper.qualification,
    paper.session,
    paper.year,
    paper.unit,
    paper.topic,
    paper.questionPaper,
    paper.pdf,
  ]
    .filter(Boolean)
    .join("|");
}

function isPdfUrl(url = "") {
  return String(url).toLowerCase().split("?")[0].endsWith(".pdf");
}

function isPdfPaper(paper) {
  const url = paper?.questionPaper || paper?.questionUrl || paper?.pdf || "";
  const type = String(paper?.questionFileType || paper?.fileType || "").toLowerCase();
  return type ? type === "pdf" : isPdfUrl(url);
}

function openPaperFile(paper) {
  const url = paper?.questionPaper || paper?.questionUrl || paper?.pdf || paper?.markScheme || paper?.markSchemeUrl;
  if (url) window.open(url, "_blank");
}

function DocumentFrame({ url, title = "Document" }) {
  if (!url) return null;
  if (isPdfUrl(url)) {
    return <PdfViewer fileUrl={url} editable={false} />;
  }

  return (
    <iframe
      title={title}
      src={url}
      className="min-h-[70vh] w-full rounded-2xl border border-white/10 bg-white"
    />
  );
}

function paperLabel(paper) {
  if (paper.type === "Topic Test") {
    return `${paper.subject} • ${paper.topic}`;
  }

  return `${paper.subject} • ${paper.qualification || ""} • ${
    paper.session || ""
  } ${paper.year || ""} • ${paper.unit || ""}`;
}
function paperExportFileName(paper = {}) {
  return cleanPdfExportFilename(
    [
      "A-Level-Dojo",
      paper.subject,
      paper.board,
      paper.unit || paper.paper,
      paper.session || paper.year,
      paper.variant,
    ]
      .filter(Boolean)
      .join("-")
  );
}

function paperSessionLabel(paper = {}) {
  const session = String(paper.session || "").trim();
  const year = paper.year ? String(paper.year) : "";
  if (!session) return year;
  return year && !session.includes(year) ? `${session} ${year}` : session;
}

function paperCardTitle(paper = {}, fallback = "") {
  return [paper.paper || paper.unit || fallback, paper.variant].filter(Boolean).join(" ");
}

function getPaperInsert(paper, subject = null, board = null) {
  const subjectName = String(
    paper?.subject || subject?.name || subject || ""
  ).toLowerCase();
  const boardName = String(paper?.board || subject?.board || board || "").toLowerCase();
  const paperText = [
    paper?.unit,
    paper?.variant,
    paper?.qualification,
    paper?.topic,
    paper?.session,
    paper?.year,
    paper?.questionPaper,
    paper?.pdf,
    paper ? paperLabel(paper) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (subjectName.includes("physics")) {
    return {
      label: "Formula book",
      url: "/inserts/physics-formula-book.pdf",
    };
  }

  if (subjectName.includes("chemistry")) {
    return {
      label: "Formula book",
      url: "/inserts/chemistry-formula-book.pdf",
    };
  }

  if (
    subjectName.includes("mathematics") ||
    subjectName.includes("further mathematics") ||
    subjectName.includes("statistics") ||
    subjectName.includes("mechanics")
  ) {
    return {
      label: "Formula book",
      url: "/inserts/math-formula-book.pdf",
    };
  }

  const isComputerScience = subjectName.includes("computer science");
  const isCambridge = boardName.includes("cambridge");
  const isPaper2 =
    /\bpaper\s*2\b/.test(paperText) ||
    /\bp2\b/.test(paperText) ||
    /9618\s*\/\s*2\b/.test(paperText) ||
    /9618\s*\/\s*2[123]\b/.test(paperText) ||
    /9618[-_/ ]?2[123]\b/.test(paperText);

  if (isComputerScience && isCambridge && isPaper2) {
    return {
      label: "Insert",
      url: "/inserts/cs-paper-2-insert.pdf",
    };
  }

  return null;
}

function sessionRank(session = "") {
  const normalized = String(session).toLowerCase();
  if (normalized.includes("nov") || normalized.includes("oct")) return 3;
  if (normalized.includes("jun") || normalized.includes("may")) return 2;
  if (normalized.includes("jan")) return 1;
  return 0;
}

function sortPapersNewestFirst(papersList = []) {
  return [...papersList].sort((a, b) => {
    const yearDiff = Number(b.year || 0) - Number(a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    const sessionDiff = sessionRank(b.session) - sessionRank(a.session);
    if (sessionDiff !== 0) return sessionDiff;
    const unitDiff = unitSortValue(a.unit) - unitSortValue(b.unit);
    if (unitDiff !== 0) return unitDiff;
    return String(a.variant || "").localeCompare(String(b.variant || ""), undefined, { numeric: true });
  });
}

function readStorage(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function readBooleanStorage(key, fallback = false) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved) === true;
  } catch {
    return fallback;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getRankFromXP(xp = 0) {
  return rankThresholds.reduce((current, rank) => (xp >= rank.xp ? rank : current), rankThresholds[0]);
}

function getDashboardGreeting(name = "") {
  const hour = new Date().getHours();
  const cleanName = String(name || "").trim();
  const firstName = cleanName.split(/\s+/)[0] || "Student";
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
      ? "Good afternoon"
      : hour >= 17 && hour < 21
      ? "Good evening"
      : "Good night";

  return { greeting: `${greeting},`, name: firstName };
}

function getNextRankProgress(xp = 0) {
  const currentRank = getRankFromXP(xp);
  const nextRank = rankThresholds.find((rank) => rank.xp > xp) || null;
  if (!nextRank) {
    return { currentRank, nextRank: null, needed: 0, percent: 100 };
  }

  const currentFloor = currentRank.xp;
  const span = nextRank.xp - currentFloor;
  const earned = Math.max(0, xp - currentFloor);
  return {
    currentRank,
    nextRank,
    needed: Math.max(0, nextRank.xp - xp),
    percent: Math.min(100, Math.round((earned / span) * 100)),
  };
}

function achievementStats({ completedPaperIds = [], mistakes = [], calendarEvents = [], xpEvents = [], streak = 0 }) {
  return {
    completedPapers: completedPaperIds.length,
    mistakesCount: mistakes.length,
    mistakesFixed: mistakes.filter((mistake) => mistake.fixed).length,
    calendarEvents: calendarEvents.length,
    mockSessions: xpEvents.filter((event) => event.action === "mock_timer_session").length,
    streak,
  };
}

function getAchievements(stats, xp) {
  return achievementDefinitions.map((achievement) => ({
    ...achievement,
    unlocked: achievement.unlocked(stats, xp),
  }));
}

const sessionOrder = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  may: 3,
  june: 4,
  "may/june": 4,
  october: 5,
  oct: 5,
  november: 6,
  nov: 6,
  "oct/nov": 6,
};

function sortYearsDescending(values) {
  return [...values].sort((a, b) => Number(b) - Number(a));
}

function unitSortValue(unit = "") {
  const match = String(unit).match(/(\d+)/);
  const number = match ? Number(match[1]) : 999;
  const label = String(unit).toLowerCase();
  const prefix =
    label.startsWith("unit") ? 1 :
    label.startsWith("paper") ? 2 :
    label.startsWith("pure") ? 3 :
    label.startsWith("further pure") ? 4 :
    label.startsWith("statistics") ? 5 :
    label.startsWith("mechanics") ? 6 :
    9;

  return prefix * 100 + number;
}

function sortUnits(values) {
  return [...values].sort((a, b) => unitSortValue(a) - unitSortValue(b) || String(a).localeCompare(String(b)));
}

function sortSessions(values) {
  return [...values].sort((a, b) => {
    const aKey = String(a).toLowerCase();
    const bKey = String(b).toLowerCase();
    return (sessionOrder[aKey] || 99) - (sessionOrder[bKey] || 99) || String(a).localeCompare(String(b));
  });
}

function getSubjectPapers(subject) {
  if (!subject) return [];

  return papers.filter(
    (paper) =>
      paper.type === "Past Paper" &&
      paper.board === subject.board &&
      paper.subject === subject.name
  );
}

function getSubjectTopicTests(subject) {
  if (!subject) return [];

  return papers.filter(
    (paper) =>
      paper.type === "Topic Test" &&
      paper.board === subject.board &&
      paper.subject === subject.name
  );
}

function getCompletedCountForSubject(subject, completedPaperIds = []) {
  const completedSet = new Set(completedPaperIds);
  return getSubjectPapers(subject).filter((paper) => completedSet.has(paperId(paper))).length;
}

function getSubjectProgress(subject, completedPaperIds = []) {
  const total = getSubjectPapers(subject).length;
  if (!total) return 0;

  return Math.round((getCompletedCountForSubject(subject, completedPaperIds) / total) * 100);
}

function daysUntil(date) {
  const today = new Date();
  const examDate = new Date(`${date}T00:00:00`);
  const diff = examDate.getTime() - today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diff / 86400000));
}

function normalizeSubjectName(value = "") {
  const normalized = String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bmaths\b/g, "mathematics")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "math" || normalized === "mathematics pure") return "mathematics";
  return normalized;
}

function normalizeBoardName(value = "") {
  const normalized = String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (normalized.includes("oxford") || normalized.includes("aqa")) return "oxfordaqa";
  if (normalized.includes("cambridge") || normalized.includes("caie")) return "cambridge";
  if (normalized.includes("edexcel") || normalized.includes("pearson")) return "edexcel";
  return normalized;
}

function selectedSubjectEntries(selectedSubjects = []) {
  return selectedSubjects
    .map((item) => {
      if (typeof item === "string") {
        return {
          subject: normalizeSubjectName(item),
          board: null,
        };
      }

      return {
        subject: normalizeSubjectName(item.subject || item.name || item.subject_name),
        board: item.board ? normalizeBoardName(item.board) : null,
      };
    })
    .filter((item) => item.subject);
}

function examMatchesSelectedSubjects(exam, selectedSubjects = []) {
  const selected = selectedSubjectEntries(selectedSubjects);
  if (selected.length === 0) return false;

  const examSubject = normalizeSubjectName(exam.subject);
  const examBoard = normalizeBoardName(exam.board);

  return selected.some((item) => {
    if (item.subject !== examSubject) return false;
    return !item.board || item.board === examBoard;
  });
}

function examStartTime(exam) {
  return new Date(`${exam.date}T${exam.time || "00:00"}:00`).getTime();
}

function dateKeyFromDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function calendarTypeMeta(type = "official") {
  return calendarEventTypes.find((item) => item.value === type) || calendarEventTypes[calendarEventTypes.length - 1];
}

function officialBoardColor(exam) {
  const board = normalizeBoardName(exam.board);
  if (board === "oxfordaqa") return calendarEventColors.rose;
  if (board === "cambridge") return calendarEventColors.cyan;
  if (board === "edexcel") return calendarEventColors.violet;
  return calendarEventColors.cyan;
}

function calendarColorMeta(event) {
  if (event.source_kind === "official") return officialBoardColor(event);
  return calendarEventColors[event.color] || calendarEventColors[defaultEventColorByType[event.eventType || event.event_type] || "cyan"];
}

function toOfficialCalendarEvent(exam) {
  return {
    ...exam,
    source_kind: "official",
    event_type: "official",
    eventType: "official",
    title: exam.paper || exam.unit || "Official exam",
    date: exam.date,
    time: exam.time || "",
  };
}

function toUserCalendarEvent(event) {
  const eventType = event.event_type || "custom";
  return {
    ...event,
    source_kind: "user",
    eventType,
    color: event.color || defaultEventColorByType[eventType] || "cyan",
    date: event.event_date || event.date,
    time: event.event_time || event.time || "",
    paper: event.paper || event.title,
    title: event.title || event.paper || "Calendar event",
  };
}

function getUpcomingSelectedExams({ officialExams = [], manualExams = [], selectedSubjects = [], cambridgeZone = "" }) {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const normalizedZone = String(cambridgeZone || "").toLowerCase().trim();
  const officialEvents = officialExams.map(toOfficialCalendarEvent);
  const personalEvents = manualExams.map(toUserCalendarEvent);

  return [
    ...officialEvents.filter((exam) => {
      if (!examMatchesSelectedSubjects(exam, selectedSubjects)) return false;
      if (normalizeBoardName(exam.board) !== "cambridge") return true;
      if (!exam.zone) return true;
      return normalizedZone && String(exam.zone).toLowerCase().trim() === normalizedZone;
    }),
    ...personalEvents.filter((exam) => examMatchesSelectedSubjects(exam, selectedSubjects)),
  ]
    .filter((exam) => exam?.date && new Date(`${exam.date}T00:00:00`).getTime() >= todayStart)
    .sort((a, b) => examStartTime(a) - examStartTime(b));
}

function getAllExamsByDate(exams = []) {
  return exams.reduce((grouped, exam) => {
    if (!exam?.date) return grouped;
    grouped[exam.date] = grouped[exam.date] || [];
    grouped[exam.date].push(exam);
    grouped[exam.date].sort((a, b) => examStartTime(a) - examStartTime(b));
    return grouped;
  }, {});
}

function allSubjects() {
  return subjectGroups.flatMap((group) =>
    group.subjects.map((subject) => ({ ...subject, board: group.board }))
  );
}

function profileSubjectsToIds(profileSubjects = [], subjects = []) {
  return profileSubjects
    .flatMap((item) => {
      if (typeof item === "string") {
        const byId = subjects.find((subject) => subject.id === item);
        if (byId) return [byId.id];

        return subjects
          .filter((subject) => normalizeSubjectName(subject.name) === normalizeSubjectName(item))
          .map((subject) => subject.id);
      }

      const subjectName = item.subject || item.name || item.subject_name;
      const board = item.board;

      const match = subjects.find(
        (subject) =>
          normalizeSubjectName(subject.name) === normalizeSubjectName(subjectName) &&
          (!board || normalizeBoardName(subject.board) === normalizeBoardName(board))
      );

      return match ? [match.id] : [];
    })
    .filter(Boolean);
}


function Logo({ onGoHome = () => {} }) {
  return (
    <button
      onClick={onGoHome}
      className="flex min-w-0 items-center gap-3 text-left"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 text-sm font-black text-white shadow-lg shadow-rose-500/20">
        A
      </div>
      <div className="min-w-0">
        <p className="whitespace-nowrap text-base font-black tracking-tight text-white">A-Level Dojo</p>
        <p className="-mt-1 text-[11px] text-white/40">home preview</p>
      </div>
    </button>
  );
}

function SubjectSetupModal({ open, onClose, selectedIds, onToggle }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-[#111827]/95 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between border-b border-white/10 px-7 py-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Edit subjects</h2>
            <p className="mt-1 text-sm text-white/45">
              Select the subjects and exam boards you are studying.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-7 py-6">
          <div className="space-y-8">
            {subjectGroups.map((group) => (
              <section key={group.board}>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{group.board}</h3>
                    <p className="text-sm text-slate-500">{group.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {group.subjects.map((subject) => {
                    const selected = selectedIds.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        onClick={() => onToggle(subject.id)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                          selected
                            ? "bg-[#ff554f] text-white shadow-sm shadow-red-500/20"
                            : "border border-white/10 bg-white/8 text-white/65 hover:bg-white/12"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-7 py-5">
          <p className="text-sm text-slate-500">
            You can change this later from the dashboard.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white/65 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-[#ff554f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 hover:brightness-110"
            >
              Save subjects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeSubjectsModal({
  open,
  selectedIds = [],
  onClose = () => {},
  onSave = async () => {},
}) {
  const [draftIds, setDraftIds] = useState(selectedIds);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftIds(selectedIds);
      setError("");
      setSaving(false);
    }
  }, [open, selectedIds]);

  if (!open) return null;

  function toggleSubject(subjectId) {
    setError("");
    setDraftIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  }

  async function saveSubjects() {
    if (draftIds.length === 0) {
      setError("Choose at least one subject.");
      return;
    }

    setSaving(true);
    try {
      await onSave(draftIds);
      onClose();
    } catch (saveError) {
      console.error(saveError);
      setError("Could not save subjects. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#080b18]/95 text-white shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Change subjects</h2>
            <p className="mt-1 text-sm leading-6 text-white/48">
              Choose the subjects you want to show on your dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
            aria-label="Close subject selector"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-hidden overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {subjectGroups.map((group) => (
              <section key={group.board} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-black text-white">{group.board}</h3>
                  <p className="mt-1 text-sm text-white/38">{group.description}</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {group.subjects.map((subject) => {
                    const selected = draftIds.includes(subject.id);
                    return (
                      <button
                        type="button"
                        key={subject.id}
                        onClick={() => toggleSubject(subject.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                          selected
                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.10)]"
                            : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {selected && <Check className="mr-1 inline-block" size={14} />}
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-5">
          {error && (
            <p className="mb-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/65 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveSubjects}
              disabled={saving}
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save subjects"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSubject({ subject, active, onOpen }) {
  const colors = boardColors[subject.board];

  return (
    <button
      onClick={onOpen}
      className={`w-full rounded-2xl border p-4 text-left transition hover:bg-white/[0.06] ${
        active
          ? "border-cyan-300/60 bg-cyan-300/10"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="truncate text-base font-black text-white">{subject.name}</h3>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${colors.chip}`}>
          {subject.board}
        </span>
      </div>
      <p className="line-clamp-2 text-xs leading-5 text-white/45">{subject.detail}</p>
    </button>
  );
}

function ActiveSubjectCard({ subject, onOpen }) {
  const visual = subjectVisuals[normalizeSubjectName(subject.name)] || defaultSubjectVisual;
  const Icon = visual.icon;

  return (
    <button
      onClick={onOpen}
      className={`group relative z-0 flex min-h-[148px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-left shadow-xl ${visual.glow} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.055]`}
    >
      <div className={`pointer-events-none absolute -right-8 -top-10 z-0 h-28 w-28 rounded-full bg-gradient-to-br ${visual.accent} opacity-20 blur-2xl transition-opacity duration-200 group-hover:opacity-30`} />
      <div className="pointer-events-none absolute bottom-3 right-4 z-0 text-5xl font-black text-white/[0.035]">
        {visual.symbol}
      </div>
      <div className="relative z-10 flex w-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${visual.soft}`}>
            <Icon size={21} strokeWidth={2.3} />
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black text-white/55">
            {subject.progress}%
          </span>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="truncate text-lg font-black tracking-tight text-white">{subject.name}</h3>
          <p className="mt-0.5 truncate text-xs font-bold text-white/42">{subject.board}</p>
        </div>

        <div className="mt-auto">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${visual.accent}`}
              style={{ width: `${subject.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-white transition-all duration-200 ease-out group-hover:border-cyan-300/30 group-hover:bg-cyan-300/12 group-hover:text-cyan-100">
              Open
            </span>
            <ChevronRight size={16} className="text-white/35 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-100" />
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptySubjectRequest({ onOpenModal }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
          <Plus size={25} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">Set up your subjects</h2>
        <p className="mt-3 text-sm leading-7 text-white/50">
          Choose the subjects and exam boards you are actually taking. Home will stay simple and only show the papers, notes, syllabus, flashcards, and revision tools that match your choices.
        </p>
        <button
          onClick={onOpenModal}
          className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
        >
          Choose subjects
        </button>
      </div>
    </div>
  );
}

function DashboardShellSidebar({
  open,
  onOpen,
  onClose,
  onTogglePinned,
  activeView,
  onSelectView,
  activeSubjects,
  onOpenSubject,
  onOpenProfile,
  onOpenSettings,
  onOpenPricing,
  onGoHome,
  user,
  profile,
  xp = 0,
}) {
  const [subjectsOpen, setSubjectsOpen] = useState(true);
  const nav = [
    [Home, "Home", "dashboard"],
    [FileText, "Past papers", "pastpapers"],
    [Layers3, "Topic tests", "topictests"],
    [CalendarDays, "Exam calendar", "calendar"],
    [RotateCcw, "Mistakes tracker", "mistakes"],
    [LineChartIcon, "Grade boundaries", "boundaries"],
    [Brain, "AI tutor", "ai"],
  ];
  const expandedNavClass =
    "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5";
  const collapsedNavClass =
    "mx-auto flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-transparent p-0 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5";
  const expandedSubjectClass =
    "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-black text-white/62 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.055] hover:text-white";
  const collapsedSubjectClass =
    "mx-auto flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-transparent p-0 text-sm font-black text-white/62 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.055] hover:text-white";

  return (
    <aside
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      className={`fixed left-0 top-0 z-[80] hidden h-screen w-[230px] overflow-hidden bg-[#0b1020]/92 p-2.5 shadow-[18px_0_45px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex lg:flex-col ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-2.5 pb-4">
        {open && (
          <div className="min-w-0 flex-1">
            <Logo onGoHome={onGoHome} />
          </div>
        )}
        <button
          type="button"
          onClick={onTogglePinned}
          className="inline-flex h-10 w-10 shrink-0 self-center items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
          title="Hide sidebar"
          aria-label="Hide sidebar"
        >
          <PanelLeft size={20} strokeWidth={2.2} />
        </button>
      </div>

      <div className={`scrollbar-hidden min-h-0 flex-1 overflow-y-auto ${open ? "pr-1" : "px-0"}`}>
        <nav className={open ? "space-y-1.5 overflow-visible" : "flex flex-col items-center gap-3"}>
          {nav.map(([Icon, label, id]) => {
            const active = activeView === id;
            const stateClass = active
              ? open
                ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-inset ring-cyan-300/25"
                : "bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.15)]"
              : "text-white/55 hover:bg-white/[0.055] hover:text-white";

            return (
              <button
                key={id}
                onClick={() => onSelectView(id)}
                className={`${open ? expandedNavClass : collapsedNavClass} ${stateClass}`}
                title={label}
              >
                <Icon size={open ? 18 : 22} strokeWidth={2.2} />
                {open && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mt-5 border-t border-white/10 pt-4">
          <button
            onClick={() => open && setSubjectsOpen((current) => !current)}
            className={open ? expandedSubjectClass : collapsedSubjectClass}
            title="My subjects"
          >
            <GraduationCap size={open ? 18 : 22} strokeWidth={2.2} />
            {open && (
              <>
                <span className="flex-1 text-left">My subjects</span>
                <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-white/45">{activeSubjects.length}</span>
                <ChevronRight size={15} className={`transition-transform ${subjectsOpen ? "rotate-90" : ""}`} />
              </>
            )}
          </button>

          {open && subjectsOpen && (
            <div className="mt-2 space-y-1">
              {activeSubjects.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-white/42">
                  Add subjects in settings.
                </p>
              ) : activeSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => onOpenSubject(subject.id)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-white">{subject.name}</p>
                  <span className="text-[10px] font-bold text-white/35">{subject.progress}%</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-white/38">{subject.board}</p>
                <div className="mt-1 h-1 rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-400 to-cyan-300"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`shrink-0 border-t border-white/10 pt-3 ${open ? "" : "flex flex-col items-center gap-2"}`}>
        {open && (
          <button
            onClick={onOpenPricing}
            className="mb-3 w-full rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-500/15 transition-all duration-200 ease-out hover:-translate-y-0.5"
          >
            Upgrade
          </button>
        )}
        <div className={open ? "flex items-center gap-2" : "flex flex-col items-center gap-2"}>
          <button
            onClick={onOpenProfile}
            className={`flex min-w-0 items-center gap-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.06] ${open ? "flex-1 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5" : "mx-auto h-11 w-11 justify-center rounded-xl bg-transparent p-0"}`}
            title="Profile"
            aria-label="Open profile"
          >
            <AvatarCircle profile={profile} user={user} size={open ? "h-9 w-9" : "h-9 w-9"} />
            {open && (
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{profile?.full_name || profile?.name || user?.email || "Account"}</p>
                <p className="truncate text-xs font-bold text-cyan-200">{getRankFromXP(xp).name}</p>
              </div>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className={`${open ? "h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.045]" : "mx-auto h-10 w-10 rounded-xl bg-transparent"} flex shrink-0 items-center justify-center text-sm font-black text-white/65 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white`}
            title="Settings"
            aria-label="Open settings"
          >
            <Settings2 size={open ? 19 : 20} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, detail, accent = "text-cyan-200" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className={`text-sm font-black ${accent}`}>{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-white/40">{detail}</p>
    </div>
  );
}

function AvatarCircle({ profile, user, size = "h-10 w-10" }) {
  const name = profile?.full_name || profile?.name || user?.email || "A";
  const preferences = profile?.preferences || {};
  const avatarStyle = preferences.avatarStyle || "initials";
  const avatarColor = preferences.avatarColor || "violet";
  const style = avatarStyles.find((item) => item.value === avatarStyle) || avatarStyles[0];
  const Icon = style.icon;
  const colorClass = avatarColors[avatarColor] || avatarColors.violet;
  const iconSize =
    size.includes("h-20") ? 30 :
    size.includes("h-14") ? 24 :
    size.includes("h-10") || size.includes("h-9") ? 20 :
    18;

  return (
    <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${colorClass} text-sm font-black text-white shadow-lg`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : Icon ? (
        <Icon size={iconSize} strokeWidth={2.5} />
      ) : avatarStyle === "dojo-a" ? (
        <span className="text-lg font-black">A</span>
      ) : (
        String(name).slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function XPBadge({ xp, streak, onToggle, open }) {
  const progress = getNextRankProgress(xp);
  const xpActions = [
    ["Complete paper", "+50 XP"],
    ["Add mistake", "+20 XP"],
    ["Fix mistake", "+30 XP"],
    ["Add calendar event", "+10 XP"],
    ["Mock session", "+25 XP"],
    ["Daily activity", "+10 XP"],
  ];

  return (
    <div className="relative z-[9999]">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-black text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.07]"
      >
        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${progress.currentRank.accent}`} />
        {progress.currentRank.name} · {xp} XP · {streak} day streak
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-[22rem] rounded-3xl border border-white/10 bg-[#0b1020]/98 p-5 text-white shadow-2xl shadow-black/35 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">XP progress</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">{progress.currentRank.name}</h3>
              <p className="mt-1 text-sm text-white/45">{xp} XP earned · {streak} day streak</p>
            </div>
            <span className={`rounded-2xl bg-gradient-to-r ${progress.currentRank.accent} px-3 py-2 text-xs font-black text-slate-950`}>
              Rank
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-rose-300" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-xs font-bold text-white/42">
            <span>{progress.currentRank.name}</span>
            <span>{progress.nextRank ? `${progress.needed} XP to ${progress.nextRank.name}` : "Max rank reached"}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Weekly XP</p>
            <div className="mt-3 flex h-16 items-end gap-2">
              {[24, 44, 36, 62, 52, 74, 66].map((height, index) => (
                <span key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-violet-400/35 to-cyan-300/70" style={{ height }} />
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">XP actions</p>
            <div className="grid gap-2">
              {xpActions.map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-white/62">{label}</span>
                  <span className="font-black text-cyan-200">{amount}</span>
                </div>
              ))}
            </div>
          </div>
          <details className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50/75">
            <summary className="cursor-pointer font-black">How does XP work?</summary>
            <p className="mt-2">Complete papers, fix mistakes, use mock mode, add calendar events, and keep daily activity streaks to climb ranks.</p>
          </details>
        </div>
      )}
    </div>
  );
}

function NotificationDropdown({ open, notifications = [] }) {
  if (!open) return null;
  const placeholders = [
    ["Upcoming exam reminders", "Exam countdown alerts will appear here."],
    ["XP gained", "Recent XP awards will show up as notifications."],
    ["Subscription alerts", "Plan and upgrade notices will live here."],
    ["System updates", "New A-Level Dojo features and resources will appear here."],
  ];

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-[21rem] rounded-3xl border border-white/10 bg-[#0b1020]/98 p-5 text-white shadow-2xl shadow-black/35 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Notifications</p>
          <h3 className="mt-1 text-xl font-black">Notifications</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-black text-white/45">
          {notifications.length}
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="font-black text-white/75">No notifications yet</p>
          <p className="mt-1 text-sm leading-6 text-white/42">Your reminders, XP updates, and system notices will appear here.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {notifications.map((notification) => (
            <div key={notification.id || notification.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-sm font-black text-white">{notification.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/42">{notification.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {placeholders.map(([title, detail]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
            <p className="text-sm font-black text-white/65">{title}</p>
            <p className="mt-1 text-xs leading-5 text-white/35">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileDropdown({
  open,
  user,
  profile,
  subjects,
  xp,
  streak,
  achievements,
  onOpenProfile,
  onOpenSettings,
  onOpenPricing,
  onOpenSaved,
  onOpenSubjects,
  onLogout,
}) {
  if (!open) return null;
  const rank = getRankFromXP(xp);
  const name = profile?.full_name || profile?.name || user?.email || "Student";
  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "Recently";
  const links = [
    ["Profile", onOpenProfile, "normal"],
    ["Saved papers", onOpenSaved, "normal"],
    ["My subjects", onOpenSubjects, "normal"],
    ["Settings", onOpenSettings, "normal"],
    ["Upgrade", onOpenPricing, "upgrade"],
    ["Customer support", () => window.open("mailto:support@aleveldojo.com", "_blank"), "normal"],
    ["Report a bug", () => window.open("mailto:support@aleveldojo.com?subject=A-Level%20Dojo%20bug", "_blank"), "bug"],
  ];
  const menuClass = {
    normal: "text-white/65 hover:bg-white/[0.06] hover:text-white",
    upgrade: "bg-gradient-to-r from-violet-500/90 to-rose-500/90 text-white shadow-lg shadow-violet-500/15 hover:brightness-110",
    bug: "border border-amber-300/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15",
  };

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-[22rem] rounded-3xl border border-white/10 bg-[#0b1020]/98 p-5 text-white shadow-2xl shadow-black/35 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <AvatarCircle profile={profile} user={user} size="h-14 w-14" />
        <div className="min-w-0">
          <p className="truncate text-base font-black">{name}</p>
          <p className="truncate text-xs text-white/42">{user?.email}</p>
          <p className="mt-1 text-xs text-white/35">Joined {joined}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/60">Rank</p>
          <p className="mt-1 truncate text-sm font-black text-white">{rank.name}</p>
        </div>
        <div className="rounded-2xl border border-violet-300/15 bg-violet-300/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-100/60">XP</p>
          <p className="mt-1 text-sm font-black text-white">{xp}</p>
        </div>
        <div className="rounded-2xl border border-rose-300/15 bg-rose-300/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-100/60">Streak</p>
          <p className="mt-1 text-sm font-black text-white">{streak}d</p>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/32">Subjects</p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">{subjects.map((item) => item.name).join(", ") || "None selected"}</p>
        <p className="mt-2 text-xs font-bold text-violet-200">{unlockedCount} achievements unlocked</p>
      </div>
      <div className="mt-3 grid gap-1">
        {links.map(([label, action, variant]) => (
          <button key={label} onClick={action} className={`rounded-xl px-3 py-2 text-left text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 ${menuClass[variant]}`}>
            {label}
          </button>
        ))}
        <button onClick={onLogout} className="mt-2 rounded-xl border border-rose-300/25 bg-rose-500/12 px-3 py-2 text-left text-sm font-black text-rose-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-500/18">
          Log out
        </button>
      </div>
    </div>
  );
}
function DashboardHome({
  activeSubjects,
  onOpenSubject,
  stats,
  upcomingExams,
  onSelectView,
  onOpenSubjectPicker,
  onOpenPricing,
  greeting,
  needsCambridgeZone = false,
  onOpenAllExams = () => {},
}) {
  return (
    <>
      <section className="mx-auto mb-5 max-w-6xl rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 shadow-2xl shadow-black/10 backdrop-blur-xl md:px-6">
        <p className="text-lg font-semibold tracking-tight text-cyan-100/75 md:text-xl">{greeting.greeting}</p>
        <h1 className="mt-0.5 text-3xl font-black tracking-tight text-white md:text-4xl">{greeting.name}</h1>
      </section>

      <section className="mx-auto mb-7 max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">My subjects</h2>
            <p className="mt-1 text-sm text-white/42">Open a subject for papers and topic tests.</p>
          </div>
          <button
            type="button"
            onClick={onOpenSubjectPicker}
            className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-black text-cyan-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/10"
          >
            Change subjects
          </button>
        </div>
        {activeSubjects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-black text-white">No subjects selected yet.</p>
            <p className="mt-2 text-sm text-white/45">Go to settings to add subjects.</p>
            <button
              onClick={() => onSelectView("settings")}
              className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]"
            >
              Open settings
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {activeSubjects.map((subject) => (
              <ActiveSubjectCard key={subject.id} subject={subject} onOpen={() => onOpenSubject(subject.id)} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Upcoming exams" value={upcomingExams.length} detail="Personal timetable" />
        <MetricCard label="Continue revision" value={`${stats.remainingPapers} left`} detail="Uncompleted selected papers" accent="text-violet-200" />
        <MetricCard label="Mistakes to review" value={stats.mistakesOpen} detail="Unfixed questions" accent="text-rose-200" />
        <MetricCard label="Completed papers" value={stats.completedCount} detail="Marked complete" accent="text-emerald-200" />
        <MetricCard label="Saved papers" value={stats.savedCount} detail="Ready to revisit" accent="text-yellow-200" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ExamCalendarPanel
          exams={upcomingExams.slice(0, 4)}
          compact
          needsCambridgeZone={needsCambridgeZone}
          onOpenAllExams={onOpenAllExams}
        />
        <AiTutorPanel onUpgrade={onOpenPricing} compact />
      </section>
    </>
  );
}

function CalendarEventModal({
  open,
  event = null,
  subjects = [],
  onClose = () => {},
  onSave = () => {},
}) {
  const [form, setForm] = useState({
    title: "",
    event_type: "mock",
    event_date: "",
    event_time: "",
    subject: "",
    board: "",
    notes: "",
    color: "violet",
  });

  useEffect(() => {
    if (!open) return;
    const eventType = event?.event_type || event?.eventType || "mock";
    setForm({
      title: event?.title || "",
      event_type: eventType,
      event_date: event?.event_date || event?.date || "",
      event_time: event?.event_time || event?.time || "",
      subject: event?.subject || "",
      board: event?.board || "",
      notes: event?.notes || "",
      color: event?.color || defaultEventColorByType[eventType] || "cyan",
    });
  }, [event, open]);

  if (!open) return null;

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "event_type" && !current.color ? { color: defaultEventColorByType[value] || "cyan" } : {}),
    }));
  }

  function submit(eventSubmit) {
    eventSubmit.preventDefault();
    if (!form.title.trim() || !form.event_type || !form.event_date) return;
    onSave({
      ...(event || {}),
      ...form,
      title: form.title.trim(),
      event_time: form.event_time || null,
      subject: form.subject || null,
      board: form.board || null,
      notes: form.notes || null,
      color: form.color || "cyan",
    });
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-xl rounded-3xl border border-white/12 bg-[#0b1020]/96 p-6 text-white shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Calendar event</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{event?.id ? "Edit event" : "Add event"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-white/60 hover:bg-white/[0.08] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(eventChange) => updateField("title", eventChange.target.value)}
            placeholder="Event title"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <select value={form.event_type} onChange={(eventChange) => updateField("event_type", eventChange.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {calendarEventTypes.filter((item) => item.value !== "official").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input
              type="date"
              value={form.event_date}
              onChange={(eventChange) => updateField("event_date", eventChange.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="time"
              value={form.event_time || ""}
              onChange={(eventChange) => updateField("event_time", eventChange.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300"
            />
            <select
              value={`${form.board || ""}|${form.subject || ""}`}
              onChange={(eventChange) => {
                const [board, subject] = eventChange.target.value.split("|");
                setForm((current) => ({ ...current, board, subject }));
              }}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300"
            >
              <option value="|">Subject optional</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={`${subject.board}|${subject.name}`}>
                  {subject.name} - {subject.board}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={form.notes || ""}
            onChange={(eventChange) => updateField("notes", eventChange.target.value)}
            placeholder="Notes optional"
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
          />

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">Color</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(calendarEventColors).map(([value, meta]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField("color", value)}
                  className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/65 transition-all duration-200 ease-out hover:-translate-y-0.5 ${form.color === value ? `ring-2 ${meta.ring}` : ""}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/65 hover:bg-white/[0.08]">
            Cancel
          </button>
          <button className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/15">
            Save event
          </button>
        </div>
      </form>
    </div>
  );
}

function ExamCalendarPanel({
  exams,
  compact = false,
  subjects = [],
  onSaveEvent = () => {},
  onDeleteEvent = () => {},
  needsCambridgeZone = false,
  onOpenAllExams = () => {},
}) {
  const [subjectFilterIds, setSubjectFilterIds] = useState(["all"]);
  const [boardFilter, setBoardFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  function toggleSubjectFilter(id) {
    setSubjectFilterIds((current) => {
      if (id === "all") return ["all"];
      const withoutAll = current.filter((item) => item !== "all");
      const next = withoutAll.includes(id)
        ? withoutAll.filter((item) => item !== id)
        : [...withoutAll, id];
      return next.length ? next : ["all"];
    });
  }

  const selectedFilterSubjects = subjectFilterIds.includes("all")
    ? subjects
    : subjects.filter((subject) => subjectFilterIds.includes(subject.id));
  const visibleExams = exams.filter((exam) => {
    if (selectedFilterSubjects.length && !examMatchesSelectedSubjects(exam, selectedFilterSubjects)) return false;
    if (boardFilter !== "All" && normalizeBoardName(exam.board) !== normalizeBoardName(boardFilter)) return false;
    if (typeFilter !== "All" && (exam.eventType || exam.event_type) !== typeFilter) return false;
    return true;
  });

  function openAddEvent() {
    setEditingEvent(null);
    setEventModalOpen(true);
  }

  function openEditEvent(event) {
    if (event.source_kind !== "user") return;
    setEditingEvent(event);
    setEventModalOpen(true);
  }

  async function saveEvent(event) {
    await onSaveEvent(event);
    setEventModalOpen(false);
    setEditingEvent(null);
  }

  function deleteEvent(event) {
    if (event.source_kind !== "user") return;
    if (!window.confirm("Delete this event?")) return;
    onDeleteEvent(event);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <CalendarEventModal
        open={eventModalOpen}
        event={editingEvent}
        subjects={subjects}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={saveEvent}
      />
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Exam calendar</h2>
          <p className="mt-1 text-sm text-white/42">Upcoming dates filtered to your selected subjects</p>
        </div>
        <div className="flex items-center gap-2">
          {!compact && (
            <button
              onClick={openAddEvent}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition-all duration-200 ease-out hover:-translate-y-0.5"
            >
              <Plus size={16} /> Add event
            </button>
          )}
          <button
            onClick={onOpenAllExams}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-300/15"
            title="Open full month calendar"
          >
            <CalendarDays size={22} />
          </button>
        </div>
      </div>

      {needsCambridgeZone && (
        <p className="mb-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm font-bold leading-6 text-cyan-50/80">
          Select your Cambridge exam zone in settings to see accurate Cambridge dates.
        </p>
      )}

      {!compact && (
        <div className="mb-5 space-y-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">Subjects</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleSubjectFilter("all")}
                className={`rounded-full border px-3 py-2 text-xs font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                  subjectFilterIds.includes("all") ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55"
                }`}
              >
                All selected
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubjectFilter(subject.id)}
                  className={`rounded-full border px-3 py-2 text-xs font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                    subjectFilterIds.includes(subject.id) ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55"
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select value={boardFilter} onChange={(event) => setBoardFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {["All", "OxfordAQA", "Cambridge", "Edexcel"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              <option value="All">All event types</option>
              {calendarEventTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {visibleExams.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">
            No upcoming exams found for your selected subjects.
          </p>
        ) : (
          visibleExams.map((exam) => {
            const typeMeta = calendarTypeMeta(exam.eventType || exam.event_type);
            const colorMeta = calendarColorMeta(exam);
            return (
            <div
              key={exam.id || `${exam.board}-${exam.subject}-${exam.paper || exam.unit}-${exam.date}`}
              onClick={() => openEditEvent(exam)}
              className={`grid gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 md:grid-cols-[1fr_auto] ${exam.source_kind === "user" ? "cursor-pointer hover:bg-white/[0.05]" : ""}`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colorMeta.dot}`} />
                  <p className="font-black text-white">{exam.title || exam.paper || exam.subject}</p>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${typeMeta.chip}`}>{typeMeta.label}</span>
                </div>
                <p className="mt-1 text-sm text-white/42">
                  {[exam.subject, exam.board].filter(Boolean).join(" - ")}
                  {exam.zone ? ` - ${exam.zone}` : ""}
                </p>
                {!compact && (
                  <p className="mt-2 text-xs font-bold text-cyan-200">
                    {new Date(`${exam.date}T00:00:00`).toLocaleDateString()}
                    {exam.time ? ` - ${exam.time}` : ""}
                    {exam.duration ? ` - ${exam.duration}` : ""}
                    {exam.source_kind === "user" ? " - added by you" : ""}
                  </p>
                )}
                {!compact && exam.source_kind === "user" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={(event) => { event.stopPropagation(); openEditEvent(exam); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/65 hover:bg-white/[0.08]">
                      Edit
                    </button>
                    <button onClick={(event) => { event.stopPropagation(); deleteEvent(exam); }} className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-400/15">
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-cyan-300/10 px-4 py-3 text-center">
                <p className="text-2xl font-black text-cyan-100">{daysUntil(exam.date)}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">days</p>
              </div>
            </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AllExamsCalendarModal({
  open,
  onClose,
  exams = [],
  subjects = [],
  onSaveEvent = () => {},
  onDeleteEvent = () => {},
}) {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => dateKeyFromDate(today));
  const [editingEvent, setEditingEvent] = useState(null);
  const [filters, setFilters] = useState({
    board: "All",
    subject: "All",
    session: "All",
    zone: "All",
    eventType: "All",
  });

  if (!open) return null;

  const boardOptions = ["All", "OxfordAQA", "Cambridge", "Edexcel"];
  const subjectOptions = ["All", ...unique(exams.map((exam) => exam.subject)).sort((a, b) => a.localeCompare(b))];
  const sessionOptions = ["All", ...sortSessions(unique(exams.map((exam) => exam.session)))];
  const zoneOptions = ["All", ...unique(exams.map((exam) => exam.zone)).sort((a, b) => a.localeCompare(b))];

  const filteredExams = exams.filter((exam) => {
    if (filters.board !== "All" && exam.board !== filters.board) return false;
    if (filters.subject !== "All" && exam.subject !== filters.subject) return false;
    if (filters.session !== "All" && exam.session !== filters.session) return false;
    if (filters.board === "Cambridge" && filters.zone !== "All" && exam.zone !== filters.zone) return false;
    if (filters.eventType !== "All" && (exam.eventType || exam.event_type) !== filters.eventType) return false;
    return true;
  });

  const examsByDate = getAllExamsByDate(filteredExams);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    const dateKey = dateKeyFromDate(day);
    return {
      date: day,
      dateKey,
      inMonth: day.getMonth() === month,
      exams: examsByDate[dateKey] || [],
    };
  });

  const selectedExams = examsByDate[selectedDate] || [];
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const monthLabel = monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  function changeMonth(offset) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "board" && value !== "Cambridge" ? { zone: "All" } : {}),
    }));
  }

  async function saveEvent(event) {
    await onSaveEvent(event);
    setEditingEvent(null);
  }

  function deleteEvent(event) {
    if (event.source_kind !== "user") return;
    if (!window.confirm("Delete this event?")) return;
    onDeleteEvent(event);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <CalendarEventModal
        open={Boolean(editingEvent)}
        event={editingEvent}
        subjects={subjects}
        onClose={() => setEditingEvent(null)}
        onSave={saveEvent}
      />
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/12 bg-[#0b1020]/96 text-white shadow-2xl shadow-black/40">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Calendar</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Full month calendar</h2>
            <p className="mt-1 text-sm text-white/45">Browse official timetable dates and your saved personal study events.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-white/60 hover:bg-white/[0.08] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-104px)] overflow-y-auto p-6">
          <div className="mb-5 grid gap-3 md:grid-cols-5">
            <select value={filters.board} onChange={(event) => updateFilter("board", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {boardOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={filters.subject} onChange={(event) => updateFilter("subject", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {subjectOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={filters.session} onChange={(event) => updateFilter("session", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {sessionOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select
              value={filters.zone}
              onChange={(event) => updateFilter("zone", event.target.value)}
              disabled={filters.board !== "Cambridge"}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {zoneOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={filters.eventType} onChange={(event) => updateFilter("eventType", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300">
              <option value="All">All event types</option>
              {calendarEventTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <button onClick={() => changeMonth(-1)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/70 hover:bg-white/[0.08]">
                  Previous
                </button>
                <h3 className="text-lg font-black text-white">{monthLabel}</h3>
                <button onClick={() => changeMonth(1)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/70 hover:bg-white/[0.08]">
                  Next
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/35">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const selected = day.dateKey === selectedDate;
                  return (
                    <button
                      key={day.dateKey}
                      onClick={() => setSelectedDate(day.dateKey)}
                      className={`min-h-[88px] rounded-2xl border p-2 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                        selected
                          ? "border-cyan-300/50 bg-cyan-300/10"
                          : day.exams.length
                            ? "border-white/12 bg-white/[0.055]"
                            : "border-white/8 bg-slate-950/35"
                      } ${day.inMonth ? "opacity-100" : "opacity-35"}`}
                    >
                      <span className="text-sm font-black text-white/75">{day.date.getDate()}</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {day.exams.slice(0, 5).map((exam) => (
                          <span
                            key={exam.id}
                            className={`h-2 w-2 rounded-full ${calendarColorMeta(exam).dot}`}
                            title={`${calendarTypeMeta(exam.eventType || exam.event_type).label} ${exam.subject || ""}`}
                          />
                        ))}
                        {day.exams.length > 5 && <span className="text-[10px] font-black text-white/40">+{day.exams.length - 5}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <h3 className="text-lg font-black text-white">{selectedDateLabel}</h3>
              <p className="mt-1 text-sm text-white/42">{selectedExams.length} exams on this day</p>
              <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {selectedExams.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">No exams match the current filters for this day.</p>
                ) : (
                  selectedExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => exam.source_kind === "user" && setEditingEvent(exam)}
                      className={`rounded-2xl border border-white/10 bg-slate-950/45 p-4 ${exam.source_kind === "user" ? "cursor-pointer hover:bg-white/[0.05]" : ""}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${calendarTypeMeta(exam.eventType || exam.event_type).chip}`}>
                          {calendarTypeMeta(exam.eventType || exam.event_type).label}
                        </span>
                        <span className={`h-2.5 w-2.5 rounded-full ${calendarColorMeta(exam).dot}`} />
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black text-white/60">
                          {exam.board}{exam.zone ? ` ${exam.zone}` : ""}
                        </span>
                        <span className="text-xs font-black text-white/38">{exam.session}</span>
                      </div>
                      <p className="mt-3 font-black text-white">{exam.subject}</p>
                      <p className="mt-1 text-sm leading-6 text-white/48">
                        {exam.title || exam.paper || exam.unit || "Exam"}
                        {exam.time ? ` - ${exam.time}` : ""}
                        {exam.duration ? ` - ${exam.duration}` : ""}
                      </p>
                      {exam.notes && <p className="mt-2 text-xs leading-5 text-white/35">{exam.notes}</p>}
                      {exam.source_kind === "user" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={(event) => { event.stopPropagation(); setEditingEvent(exam); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/65 hover:bg-white/[0.08]">
                            Edit
                          </button>
                          <button onClick={(event) => { event.stopPropagation(); deleteEvent(exam); }} className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-400/15">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradeBoundariesPanel({ subjects = [] }) {
  const grades = ["A*", "A", "B", "C", "D", "E"];
  const gradeColors = {
    "A*": "#38bdf8",
    A: "#8b5cf6",
    B: "#c084fc",
    C: "#fb7185",
    D: "#fbbf24",
    E: "#2dd4bf",
  };
  const monthRank = { jan: 1, january: 1, may: 2, june: 3, jun: 3, oct: 4, october: 4, nov: 5, november: 5 };
  const selectedSubjects = subjects || [];
  const [boundaryRows, setBoundaryRows] = useState([]);
  const [loadingBoundaries, setLoadingBoundaries] = useState(true);
  const [boundaryError, setBoundaryError] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(selectedSubjects[0]?.id || "");
  const selectedSubject = selectedSubjects.find((subject) => subject.id === selectedSubjectId) || selectedSubjects[0] || null;
  const [selectedBoard, setSelectedBoard] = useState(selectedSubject?.board || "");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [viewMode, setViewMode] = useState("All grades");
  const [boundaryTooltip, setBoundaryTooltip] = useState(null);
  const [umsMode, setUmsMode] = useState("raw");
  const [rawMarkInput, setRawMarkInput] = useState("");
  const [umsMarkInput, setUmsMarkInput] = useState("");

  function loadGradeBoundaries() {
    setLoadingBoundaries(true);
    setBoundaryError("");
    const normalizeBoundaryRows = (rows = []) =>
      rows.map((row) => ({
        ...row,
        max_mark: row.max_mark ?? row.maxMark,
      }));
    setBoundaryRows(normalizeBoundaryRows(generatedGradeBoundaries));
    setLoadingBoundaries(false);
  }

  useEffect(() => {
    loadGradeBoundaries();
  }, []);

  function boundarySubjectKey(value = "") {
    return normalizeSubjectName(value).replace(/[^a-z0-9]/g, "");
  }

  function boundaryBoardKey(value = "") {
    return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function boundaryUnit(row) {
    return row.unit || row.paper || "Paper";
  }

  function boundaryMonth(row) {
    return String(row.month || row.session || "").split(" ")[0] || "";
  }

  function boundaryDateRank(row) {
    return Number(row.year || 0) * 10 + (monthRank[boundaryMonth(row).toLowerCase()] || 0);
  }

  function boundarySessionLabel(row) {
    return row.session || `${row.month || ""} ${row.year || ""}`.trim() || String(row.year || "");
  }

  function boundaryPercent(mark, maxMark) {
    if (!Number(maxMark) || mark === undefined || mark === null || mark === "") return null;
    return (Number(mark) / Number(maxMark)) * 100;
  }

  function boundaryMark(row, grade) {
    return row.boundaries?.[grade] ?? row[grade] ?? row[grade.toLowerCase()];
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function matchingUmsBoundary() {
    if (!selectedSubject || !selectedUnit) return null;
    return umsBoundaries.find(
      (row) =>
        boundaryBoardKey(row.board) === boundaryBoardKey(selectedBoard || selectedSubject.board) &&
        boundarySubjectKey(row.subject) === boundarySubjectKey(selectedSubject.name) &&
        boundarySubjectKey(row.unit || row.paper) === boundarySubjectKey(selectedUnit)
    ) || null;
  }

  function gradeFromUms(umsValue, umsData) {
    if (!umsData || !Number.isFinite(umsValue)) return { grade: "Not set", nextGrade: null, needed: null };
    const ordered = grades
      .map((grade) => ({ grade, mark: Number(umsData.umsBoundaries?.[grade]) }))
      .filter((item) => Number.isFinite(item.mark))
      .sort((a, b) => b.mark - a.mark);

    const currentIndex = ordered.findIndex((item) => umsValue >= item.mark);
    if (currentIndex === -1) {
      const lowest = ordered[ordered.length - 1];
      return { grade: "U", nextGrade: lowest?.grade || null, needed: lowest ? Math.max(0, lowest.mark - umsValue) : null };
    }

    const current = ordered[currentIndex];
    const next = ordered[currentIndex - 1];
    return {
      grade: current.grade,
      nextGrade: next?.grade || null,
      needed: next ? Math.max(0, next.mark - umsValue) : null,
    };
  }

  function exactRawToUms(rawMark, umsData) {
    if (!umsData?.rawToUms) return null;
    const roundedRaw = Math.round(Number(rawMark));
    if (!Number.isFinite(roundedRaw)) return null;
    const exact = umsData.rawToUms[String(roundedRaw)];
    return Number.isFinite(Number(exact)) ? Number(exact) : null;
  }

  function minimumRawForUms(targetUms, umsData) {
    if (!umsData?.rawToUms || !Number.isFinite(Number(targetUms))) return null;
    const rows = Object.entries(umsData.rawToUms)
      .map(([raw, ums]) => ({ raw: Number(raw), ums: Number(ums) }))
      .filter((row) => Number.isFinite(row.raw) && Number.isFinite(row.ums) && row.ums >= Number(targetUms))
      .sort((a, b) => a.raw - b.raw);
    return rows[0]?.raw ?? null;
  }

  function gradeFromThreshold(rawValue, boundaryRow) {
    if (!boundaryRow || !Number.isFinite(rawValue)) return { grade: "Not set", nextGrade: null, needed: null };
    const ordered = grades
      .map((grade) => ({ grade, mark: Number(boundaryMark(boundaryRow, grade)) }))
      .filter((item) => Number.isFinite(item.mark))
      .sort((a, b) => b.mark - a.mark);

    const currentIndex = ordered.findIndex((item) => rawValue >= item.mark);
    if (currentIndex === -1) {
      const lowest = ordered[ordered.length - 1];
      return { grade: "Below E", nextGrade: lowest?.grade || null, needed: lowest ? Math.max(0, lowest.mark - rawValue) : null };
    }

    const current = ordered[currentIndex];
    const next = ordered[currentIndex - 1];
    return {
      grade: current.grade,
      nextGrade: next?.grade || null,
      needed: next ? Math.max(0, next.mark - rawValue) : null,
    };
  }

  function nextSeasonLabel(rows) {
    const latest = rows[rows.length - 1];
    if (!latest) return "Next season";
    const month = boundaryMonth(latest).toLowerCase();
    if (month.startsWith("jan")) return `June ${latest.year}`;
    if (month.startsWith("jun") || month.startsWith("may")) return `Nov ${latest.year}`;
    return `Jan ${Number(latest.year || 0) + 1}`;
  }

  function predictBoundary(rows, grade) {
    const points = rows
      .map((row, index) => ({ x: index, y: Number(boundaryMark(row, grade)), max: Number(row.max_mark) || 0 }))
      .filter((point) => Number.isFinite(point.y));
    if (!points.length) return null;
    const maxMark = points[points.length - 1].max || Math.max(...points.map((point) => point.y), 1);
    if (points.length === 1) return Math.max(0, Math.min(maxMark, Math.round(points[0].y)));
    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    return Math.max(0, Math.min(maxMark, Math.round(intercept + slope * n)));
  }

  function trendFor(rows, grade) {
    const values = rows.map((row) => Number(boundaryMark(row, grade))).filter(Number.isFinite);
    if (values.length < 2) return "stable";
    const change = values[values.length - 1] - values[0];
    if (change >= 2) return "increasing";
    if (change <= -2) return "decreasing";
    return "stable";
  }

  const dataForSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return boundaryRows.filter(
      (row) =>
        boundarySubjectKey(row.subject) === boundarySubjectKey(selectedSubject.name) &&
        boundaryBoardKey(row.board) === boundaryBoardKey(selectedBoard || selectedSubject.board)
    );
  }, [boundaryRows, selectedBoard, selectedSubject]);

  const umsRowsForSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return umsBoundaries.filter((row) => boundarySubjectKey(row.subject) === boundarySubjectKey(selectedSubject.name));
  }, [selectedSubject]);

  const umsDataForSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    const activeBoard = selectedBoard || selectedSubject.board;
    return umsRowsForSelectedSubject.filter((row) => boundaryBoardKey(row.board) === boundaryBoardKey(activeBoard));
  }, [selectedBoard, selectedSubject, umsRowsForSelectedSubject]);

  const boardOptions = useMemo(() => {
    const boards = unique(
      [
        ...boundaryRows
          .filter((row) => selectedSubject && boundarySubjectKey(row.subject) === boundarySubjectKey(selectedSubject.name))
          .map((row) => row.board),
        ...umsRowsForSelectedSubject.map((row) => row.board),
      ].filter(Boolean)
    );
    if (selectedSubject?.board && !boards.includes(selectedSubject.board)) boards.unshift(selectedSubject.board);
    return boards.length ? boards : selectedSubject?.board ? [selectedSubject.board] : [];
  }, [boundaryRows, selectedSubject, umsRowsForSelectedSubject]);

  const unitOptions = useMemo(
    () => sortUnits(unique([
      ...dataForSelectedSubject.map(boundaryUnit),
      ...umsDataForSelectedSubject.map((row) => row.unit || row.paper).filter(Boolean),
    ])),
    [dataForSelectedSubject, umsDataForSelectedSubject]
  );

  useEffect(() => {
    if (!selectedSubjectId && selectedSubjects[0]) {
      setSelectedSubjectId(selectedSubjects[0].id);
    }
  }, [selectedSubjectId, selectedSubjects]);

  useEffect(() => {
    if (selectedSubject?.board && (!selectedBoard || !boardOptions.includes(selectedBoard))) {
      setSelectedBoard(boardOptions[0] || selectedSubject.board);
    }
  }, [boardOptions, selectedBoard, selectedSubject]);

  useEffect(() => {
    if (unitOptions.length && !unitOptions.includes(selectedUnit)) {
      setSelectedUnit(unitOptions[0]);
    }
    if (!unitOptions.length && selectedUnit) {
      setSelectedUnit("");
    }
  }, [selectedUnit, unitOptions]);

  const filteredRows = useMemo(() => {
    return dataForSelectedSubject
      .filter((row) => !selectedUnit || boundaryUnit(row) === selectedUnit)
      .sort((a, b) => boundaryDateRank(b) - boundaryDateRank(a));
  }, [dataForSelectedSubject, selectedUnit]);

  const recentRows = filteredRows.slice(0, 5);
  const chronologicalRows = [...recentRows].sort((a, b) => boundaryDateRank(a) - boundaryDateRank(b));
  const visibleGrades = viewMode === "All grades" ? grades : [viewMode];
  const predictionLabel = nextSeasonLabel(chronologicalRows);
  const predictions = Object.fromEntries(visibleGrades.map((grade) => [grade, predictBoundary(chronologicalRows, grade)]));
  const chartMarks = chronologicalRows.flatMap((row) =>
    visibleGrades.map((grade) => Number(boundaryMark(row, grade))).filter((mark) => Number.isFinite(mark))
  );
  const predictionMarks = Object.values(predictions).filter((mark) => Number.isFinite(mark));
  const maxChartMark = Math.max(...chartMarks, ...predictionMarks, ...chronologicalRows.map((row) => Number(row.max_mark) || 0), 1);
  const minChartMark = Math.min(...chartMarks, 0);
  const chartWidth = 760;
  const chartHeight = 300;
  const chart = { left: 58, right: 44, top: 28, bottom: 58 };
  const plotWidth = chartWidth - chart.left - chart.right;
  const plotHeight = chartHeight - chart.top - chart.bottom;

  function chartCoords(index, mark, totalPoints = chronologicalRows.length) {
    const denominator = Math.max(1, totalPoints);
    const x = chart.left + (index / denominator) * plotWidth;
    const y = chart.top + (1 - (mark - minChartMark) / Math.max(1, maxChartMark - minChartMark)) * plotHeight;
    return { x, y };
  }

  function chartPoint(row, index, grade) {
    const mark = Number(boundaryMark(row, grade));
    if (!Number.isFinite(mark)) return null;
    const { x, y } = chartCoords(index, mark);
    return { x, y, mark, row };
  }

  const chartLines = visibleGrades.map((grade) => ({
    grade,
    color: gradeColors[grade],
    points: chronologicalRows
      .map((row, index) => chartPoint(row, index, grade))
      .filter(Boolean),
    prediction: Number.isFinite(predictions[grade])
      ? { ...chartCoords(chronologicalRows.length, predictions[grade]), mark: predictions[grade] }
      : null,
  }));

  const insightGrade = viewMode === "All grades" ? "A*" : viewMode;
  const insightRows = chronologicalRows.filter((row) => Number.isFinite(Number(boundaryMark(row, insightGrade))));
  const insightValues = insightRows.map((row) => Number(boundaryMark(row, insightGrade)));
  const latestRow = insightRows[insightRows.length - 1] || null;
  const latestMark = latestRow ? Number(boundaryMark(latestRow, insightGrade)) : null;
  const lowestMark = insightValues.length ? Math.min(...insightValues) : null;
  const highestMark = insightValues.length ? Math.max(...insightValues) : null;
  const predictedMark = predictions[insightGrade];
  const overallTrend = trendFor(chronologicalRows, insightGrade);
  const latestPercent = boundaryPercent(latestMark, latestRow?.max_mark);
  const predictionMaxMark = chronologicalRows[chronologicalRows.length - 1]?.max_mark || latestRow?.max_mark || maxChartMark;
  const selectedUmsBoundary = matchingUmsBoundary();
  const isCambridgeBoundary = boundaryBoardKey(selectedBoard || selectedSubject?.board) === "cambridge";
  const isEdexcelBoundary = boundaryBoardKey(selectedBoard || selectedSubject?.board) === "edexcel";
  const isEdexcelUmsBoundary = selectedUmsBoundary && boundaryBoardKey(selectedUmsBoundary.board) === "edexcel";
  const selectedThresholdBoundary = !selectedUmsBoundary && isCambridgeBoundary ? filteredRows[0] || null : null;
  const rawMarkValue = Number(rawMarkInput);
  const umsMarkValue = Number(umsMarkInput);
  const hasRawMarkInput = rawMarkInput.trim() !== "" && Number.isFinite(rawMarkValue);
  const hasUmsMarkInput = umsMarkInput.trim() !== "" && Number.isFinite(umsMarkValue);
  const hasExactRawToUms = Boolean(selectedUmsBoundary?.rawToUms && Object.keys(selectedUmsBoundary.rawToUms).length);
  const estimatedUms = selectedUmsBoundary && hasRawMarkInput && hasExactRawToUms
    ? exactRawToUms(rawMarkValue, selectedUmsBoundary)
    : null;
  const activeUmsValue = umsMode === "raw"
    ? estimatedUms
    : selectedUmsBoundary && hasUmsMarkInput
      ? clampNumber(Math.round(umsMarkValue), 0, selectedUmsBoundary.maxUMS)
      : null;
  const umsResult = selectedUmsBoundary && Number.isFinite(activeUmsValue)
    ? gradeFromUms(activeUmsValue, selectedUmsBoundary)
    : null;
  const umsGrades = selectedUmsBoundary
    ? grades.filter((grade) => Number.isFinite(Number(selectedUmsBoundary.umsBoundaries?.[grade])))
    : [];
  const nextUmsRawTarget = selectedUmsBoundary && umsResult?.nextGrade
    ? minimumRawForUms(selectedUmsBoundary.umsBoundaries?.[umsResult.nextGrade], selectedUmsBoundary)
    : null;
  const enteredUmsRawTarget = selectedUmsBoundary && hasUmsMarkInput
    ? minimumRawForUms(activeUmsValue, selectedUmsBoundary)
    : null;
  const activeThresholdValue = selectedThresholdBoundary && hasRawMarkInput
    ? clampNumber(Math.round(rawMarkValue), 0, Number(selectedThresholdBoundary.max_mark) || 0)
    : null;
  const thresholdResult = selectedThresholdBoundary && Number.isFinite(activeThresholdValue)
    ? gradeFromThreshold(activeThresholdValue, selectedThresholdBoundary)
    : null;

  function predictionTooltipPayload(point) {
    return {
      x: point.x,
      y: point.y,
      guideX: point.x,
      label: `${predictionLabel} (Predicted)`,
      items: visibleGrades
        .map((grade) => {
          const mark = predictions[grade];
          if (!Number.isFinite(mark)) return null;
          return {
            grade,
            mark,
            color: gradeColors[grade],
            maxMark: predictionMaxMark,
            percent: boundaryPercent(mark, predictionMaxMark),
          };
        })
        .filter(Boolean),
    };
  }

  function rowTooltipPayload(row, index) {
    const items = visibleGrades
      .map((grade) => {
        const mark = Number(boundaryMark(row, grade));
        if (!Number.isFinite(mark)) return null;
        return {
          grade,
          mark,
          color: gradeColors[grade],
          maxMark: row.max_mark,
          percent: boundaryPercent(mark, row.max_mark),
        };
      })
      .filter(Boolean);
    const yValues = visibleGrades
      .map((grade) => chartPoint(row, index, grade)?.y)
      .filter((value) => Number.isFinite(value));
    const x = chartCoords(index, 0).x;
    const y = yValues.length ? Math.min(...yValues) : chart.top;
    return {
      x,
      y,
      guideX: x,
      label: boundarySessionLabel(row),
      items,
    };
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/80">Boundary analytics</p>
          <h2 className="mt-1 text-2xl font-black text-white">Grade Boundaries</h2>
          <p className="mt-1 text-sm text-white/42">Raw mark trends and next-session predictions.</p>
        </div>
      </div>

      {selectedSubjects.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 text-sm font-bold text-white/50">
          Choose your subjects first to view grade boundaries.
        </div>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <select value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {selectedSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            <select value={selectedBoard} onChange={(event) => setSelectedBoard(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {boardOptions.map((board) => <option key={board}>{board}</option>)}
            </select>
            <select value={selectedUnit} onChange={(event) => setSelectedUnit(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300">
              {unitOptions.length ? unitOptions.map((unit) => <option key={unit}>{unit}</option>) : <option value="">No units yet</option>}
            </select>
            <select value={viewMode} onChange={(event) => setViewMode(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300">
              <option>All grades</option>
              {grades.map((grade) => <option key={grade}>{grade}</option>)}
            </select>
          </div>

          {loadingBoundaries ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-6 text-sm font-bold text-white/50">
              Loading grade boundaries...
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
              <div className="space-y-3">
              {filteredRows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-black/20">
                  <p className="text-lg font-black text-white">No grade-boundary trend data yet for this unit.</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-white/48">
                    {isEdexcelBoundary
                      ? "Add Edexcel grade-boundary files to public/grade-boundaries to activate the trend graph."
                      : "Add official grade-boundary files to public/grade-boundaries to activate the trend graph."}
                  </p>
                  {boundaryRows.length === 0 && (
                    <p className="mt-3 text-xs font-bold text-cyan-100/60">
                      No generated graph rows were found. Run npm run build:boundaries after adding official files.
                    </p>
                  )}
                  {boundaryError && <p className="mt-3 text-xs font-bold text-rose-200">{boundaryError}</p>}
                </div>
              ) : (
                <>
              <div
                className="relative rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-2xl shadow-black/20"
                onMouseLeave={() => setBoundaryTooltip(null)}
              >
                <h3 className="mb-2 text-lg font-black text-white">Grade Boundaries</h3>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[270px] w-full xl:h-[300px]" role="img" aria-label="Raw mark grade boundary trend with prediction">
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y = chart.top + tick * plotHeight;
                    const value = Math.round(maxChartMark - tick * (maxChartMark - minChartMark));
                    return (
                      <g key={tick}>
                        <line x1={chart.left} y1={y} x2={chartWidth - chart.right} y2={y} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 6" />
                        <text x={chart.left - 10} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.45)" fontSize="11" fontWeight="700">{value}</text>
                      </g>
                    );
                  })}
                  <line x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.top + plotHeight} stroke="rgba(255,255,255,0.20)" />
                  <line x1={chart.left} y1={chart.top + plotHeight} x2={chartWidth - chart.right} y2={chart.top + plotHeight} stroke="rgba(255,255,255,0.20)" />

                  {boundaryTooltip?.guideX && (
                    <line
                      x1={boundaryTooltip.guideX}
                      y1={chart.top}
                      x2={boundaryTooltip.guideX}
                      y2={chart.top + plotHeight}
                      stroke="rgba(255,255,255,0.20)"
                      strokeDasharray="4 6"
                    />
                  )}

                  {chartLines.map((line) => (
                    <g key={line.grade}>
                      <polyline points={line.points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={line.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {line.points.length > 0 && line.prediction && (
                        <line
                          x1={line.points[line.points.length - 1].x}
                          y1={line.points[line.points.length - 1].y}
                          x2={line.prediction.x}
                          y2={line.prediction.y}
                          stroke={line.color}
                          strokeWidth="3"
                          strokeDasharray="7 7"
                          strokeLinecap="round"
                        />
                      )}
                      {line.points.map((point) => {
                        const percent = boundaryPercent(point.mark, point.row?.max_mark);
                        const isActive = boundaryTooltip?.label === boundarySessionLabel(point.row);
                        return (
                          <circle
                            key={`${line.grade}-${point.x}-${point.y}`}
                            cx={point.x}
                            cy={point.y}
                            r={isActive ? "7" : "5"}
                            fill={line.color}
                            stroke={isActive ? "rgba(255,255,255,0.85)" : "transparent"}
                            strokeWidth={isActive ? "2" : "0"}
                            className="cursor-pointer"
                            onMouseEnter={() => setBoundaryTooltip(rowTooltipPayload(point.row, chronologicalRows.indexOf(point.row)))}
                            onFocus={() => setBoundaryTooltip(rowTooltipPayload(point.row, chronologicalRows.indexOf(point.row)))}
                            onClick={() => setBoundaryTooltip(rowTooltipPayload(point.row, chronologicalRows.indexOf(point.row)))}
                          >
                            <title>{`${boundarySessionLabel(point.row)}\n${line.grade}: ${point.mark}/${point.row?.max_mark} - ${percent?.toFixed(1)}%`}</title>
                          </circle>
                        );
                      })}
                      {line.prediction && (
                        <circle
                          cx={line.prediction.x}
                          cy={line.prediction.y}
                          r="6"
                          fill={line.color}
                          stroke="rgba(255,255,255,0.8)"
                          strokeWidth="2"
                          className="cursor-pointer"
                          onMouseEnter={() => setBoundaryTooltip(predictionTooltipPayload(line.prediction))}
                          onFocus={() => setBoundaryTooltip(predictionTooltipPayload(line.prediction))}
                          onClick={() => setBoundaryTooltip(predictionTooltipPayload(line.prediction))}
                        >
                          <title>{`${predictionLabel}\nPredicted ${line.grade}: ${line.prediction.mark}`}</title>
                        </circle>
                      )}
                    </g>
                  ))}

                  {chronologicalRows.map((row, index) => {
                    const x = chartCoords(index, 0).x;
                    return <text key={`${row.session}-${index}`} x={x} y={chartHeight - 16} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontWeight="700">{boundarySessionLabel(row)}</text>;
                  })}
                  {chronologicalRows.length > 0 && (
                    <text x={chartCoords(chronologicalRows.length, 0).x} y={chartHeight - 16} textAnchor="middle" fill="rgba(34,211,238,0.75)" fontSize="11" fontWeight="800">{predictionLabel}</text>
                  )}

                  {chronologicalRows.map((row, index) => {
                    const x = chartCoords(index, 0).x;
                    const previousX = index === 0 ? chart.left : chartCoords(index - 1, 0).x;
                    const nextX = index === chronologicalRows.length - 1 ? chartCoords(chronologicalRows.length, 0).x : chartCoords(index + 1, 0).x;
                    const width = Math.max(26, (nextX - previousX) / 2);
                    return (
                      <rect
                        key={`hover-${row.session}-${index}`}
                        x={x - width / 2}
                        y={chart.top}
                        width={width}
                        height={plotHeight}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setBoundaryTooltip(rowTooltipPayload(row, index))}
                        onMouseMove={() => setBoundaryTooltip(rowTooltipPayload(row, index))}
                        onClick={() => setBoundaryTooltip(rowTooltipPayload(row, index))}
                      />
                    );
                  })}
                  {chronologicalRows.length > 0 && (
                    <rect
                      x={chartCoords(chronologicalRows.length, 0).x - 28}
                      y={chart.top}
                      width="56"
                      height={plotHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => {
                        const firstPrediction = chartLines.find((line) => line.prediction)?.prediction;
                        if (firstPrediction) setBoundaryTooltip(predictionTooltipPayload(firstPrediction));
                      }}
                      onMouseMove={() => {
                        const firstPrediction = chartLines.find((line) => line.prediction)?.prediction;
                        if (firstPrediction) setBoundaryTooltip(predictionTooltipPayload(firstPrediction));
                      }}
                      onClick={() => {
                        const firstPrediction = chartLines.find((line) => line.prediction)?.prediction;
                        if (firstPrediction) setBoundaryTooltip(predictionTooltipPayload(firstPrediction));
                      }}
                    />
                  )}
                </svg>

                {boundaryTooltip && (
                  <div
                    className="pointer-events-none absolute z-[9999] min-w-[210px] rounded-xl border border-white/10 bg-slate-950/95 p-3 text-xs shadow-2xl shadow-black/30 backdrop-blur"
                    style={{
                      left: `${Math.min(78, Math.max(12, (boundaryTooltip.x / chartWidth) * 100))}%`,
                      top: `${Math.min(72, Math.max(14, (boundaryTooltip.y / chartHeight) * 100))}%`,
                    }}
                  >
                    <p className="font-black text-white">{boundaryTooltip.label}</p>
                    <div className="mt-2 space-y-1.5">
                      {boundaryTooltip.items.map((item) => (
                        <p key={item.grade} className="flex items-center gap-2 font-bold text-white/72">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.grade}: {item.mark}/{item.maxMark} - {item.percent?.toFixed(1)}%</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs font-bold text-white/55">
                  {chartLines.map((line) => (
                    <span key={line.grade} className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: line.color }} />
                      {line.grade}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-center text-xs font-bold text-white/38">
                  Next values are predicted using linear trend analysis from the latest available boundaries.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Latest" value={latestMark ?? "-"} detail={latestRow ? `${boundarySessionLabel(latestRow)}${latestPercent ? ` - ${latestPercent.toFixed(1)}%` : ""}` : "No data"} />
                <MetricCard label="Lowest" value={lowestMark ?? "-"} detail={insightGrade} accent="text-emerald-200" />
                <MetricCard label="Highest" value={highestMark ?? "-"} detail={insightGrade} accent="text-rose-200" />
                <MetricCard label="Predicted" value={predictedMark ?? "-"} detail={`${predictionLabel} ${insightGrade}`} accent="text-cyan-200" />
                <MetricCard label="Trend" value={overallTrend} detail={insightGrade} accent="text-violet-200" />
              </div>
                </>
              )}
              </div>

              <aside className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-2xl shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {selectedUmsBoundary
                        ? isEdexcelUmsBoundary
                          ? "Edexcel UMS Calculator"
                          : `${selectedUmsBoundary.board} UMS Calculator`
                        : selectedThresholdBoundary
                          ? "Threshold Calculator"
                          : "Conversion Calculator"}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-white/40">
                      {selectedSubject?.name || "Subject"} · {selectedBoard || selectedSubject?.board || "Board"} · {selectedUnit || "Paper"}
                    </p>
                  </div>
                  <Calculator size={20} className="text-cyan-200/70" />
                </div>

                {!selectedUmsBoundary && !selectedThresholdBoundary ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold leading-6 text-white/48">
                    {isEdexcelBoundary
                      ? "No Pearson Edexcel UMS data found for this unit."
                      : "No conversion data available yet for this paper."}
                  </div>
                ) : selectedThresholdBoundary ? (
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-white/38">Raw mark</span>
                      <input
                        type="number"
                        min="0"
                        max={selectedThresholdBoundary.max_mark}
                        value={rawMarkInput}
                        onChange={(event) => setRawMarkInput(event.target.value)}
                        placeholder={`0-${selectedThresholdBoundary.max_mark}`}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300"
                      />
                    </label>

                    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">Result</p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-black text-white">{Number.isFinite(activeThresholdValue) ? activeThresholdValue : "-"}</p>
                          <p className="text-xs font-bold text-white/45">Raw mark</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-cyan-100">{thresholdResult?.grade || "-"}</p>
                          <p className="text-xs font-bold text-white/45">Grade</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-bold leading-6 text-white/62">
                        {!thresholdResult
                          ? "Enter a raw mark to estimate your Cambridge grade."
                          : thresholdResult.nextGrade
                            ? `Need ${thresholdResult.needed} more raw marks for ${thresholdResult.nextGrade}.`
                            : "You are at the highest grade boundary."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-white/50">
                      <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">Session: {boundarySessionLabel(selectedThresholdBoundary)}</span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">Max mark: {selectedThresholdBoundary.max_mark}</span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.035] text-white/40">
                          <tr>
                            <th className="px-3 py-2">Grade</th>
                            <th className="px-3 py-2">Raw mark needed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {grades.map((grade) => (
                            <tr key={grade}>
                              <td className="px-3 py-2 font-black text-white">{grade}</td>
                              <td className="px-3 py-2 font-bold text-white/62">{boundaryMark(selectedThresholdBoundary, grade) ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <p className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-xs font-bold leading-5 text-cyan-50/75">
                      {isEdexcelUmsBoundary
                        ? selectedUmsBoundary.sourceType === "edexcel-boundary-interpolation"
                          ? "Uses official Edexcel grade-boundary anchors with raw-to-UMS interpolation."
                          : "Uses exact Edexcel raw mark to UMS conversion data."
                        : "Uses the exact official raw mark to UMS conversion table."}
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1">
                      <button
                        type="button"
                        onClick={() => setUmsMode("raw")}
                        className={`rounded-xl px-3 py-2 text-xs font-black transition-all duration-200 ease-out ${umsMode === "raw" ? "bg-cyan-300 text-slate-950" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}
                      >
                        Raw → UMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setUmsMode("ums")}
                        className={`rounded-xl px-3 py-2 text-xs font-black transition-all duration-200 ease-out ${umsMode === "ums" ? "bg-violet-300 text-slate-950" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}
                      >
                        UMS → Grade
                      </button>
                    </div>

                    {umsMode === "raw" ? (
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-white/38">Raw mark</span>
                        <input
                          type="number"
                          min="0"
                          max={selectedUmsBoundary.maxRaw}
                          value={rawMarkInput}
                          onChange={(event) => setRawMarkInput(event.target.value)}
                          placeholder={`0-${selectedUmsBoundary.maxRaw}`}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300"
                        />
                      </label>
                    ) : (
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-white/38">UMS mark</span>
                        <input
                          type="number"
                          min="0"
                          max={selectedUmsBoundary.maxUMS}
                          value={umsMarkInput}
                          onChange={(event) => setUmsMarkInput(event.target.value)}
                          placeholder={`0-${selectedUmsBoundary.maxUMS}`}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300"
                        />
                      </label>
                    )}

                    {!hasExactRawToUms ? (
                      <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4 text-sm font-bold leading-6 text-amber-50/70">
                        Exact UMS conversion data is not available for this unit.
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">Result</p>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-2xl font-black text-white">
                              {umsMode === "raw" && hasRawMarkInput ? `${Math.round(rawMarkValue)}/${selectedUmsBoundary.maxRaw}` : enteredUmsRawTarget ?? "-"}
                            </p>
                            <p className="text-xs font-bold text-white/45">{umsMode === "raw" ? "Raw mark" : "Minimum raw"}</p>
                          </div>
                          <div>
                            <p className="text-2xl font-black text-white">{Number.isFinite(activeUmsValue) ? `${activeUmsValue}/${selectedUmsBoundary.maxUMS}` : "-"}</p>
                            <p className="text-xs font-bold text-white/45">Exact UMS</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-cyan-100">{umsResult?.grade || "-"}</p>
                            <p className="text-xs font-bold text-white/45">Grade</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-bold leading-6 text-white/62">
                          {!umsResult
                            ? hasRawMarkInput || hasUmsMarkInput
                              ? "No exact UMS value was found for that mark."
                              : "Enter a mark to calculate your exact UMS and grade."
                            : umsResult.nextGrade
                              ? `Need ${umsResult.needed} more UMS for ${umsResult.nextGrade}.${nextUmsRawTarget !== null ? ` Minimum raw for ${umsResult.nextGrade}: ${nextUmsRawTarget}.` : ""}`
                              : "You are at the highest grade boundary."}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-white/50">
                      <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">Max raw: {selectedUmsBoundary.maxRaw}</span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">Max UMS: {selectedUmsBoundary.maxUMS}</span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.035] text-white/40">
                          <tr>
                            <th className="px-3 py-2">Grade</th>
                            <th className="px-3 py-2">Raw needed</th>
                            <th className="px-3 py-2">UMS needed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {umsGrades.map((grade) => (
                            <tr key={grade}>
                              <td className="px-3 py-2 font-black text-white">{grade}</td>
                              <td className="px-3 py-2 font-bold text-white/62">{selectedUmsBoundary.rawBoundaries?.[grade] ?? minimumRawForUms(selectedUmsBoundary.umsBoundaries?.[grade], selectedUmsBoundary) ?? "-"}</td>
                              <td className="px-3 py-2 font-bold text-white/62">{selectedUmsBoundary.umsBoundaries?.[grade] ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </aside>
              </div>

            </>
          )}
        </>
      )}
      </div>
    </section>
  );
}

function MistakesTrackerPanel({ mistakes, setMistakes, subjects = [], onAwardXP = () => {} }) {
  const subjectOptions = subjects.length ? subjects : allSubjects();
  const emptyDraft = {
    subject: subjectOptions[0]?.name || "",
    board: subjectOptions[0]?.board || "",
    topic: "",
    question: "",
    wrong: "",
    correctMethod: "",
    fixed: false,
  };
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ subject: "All", topic: "", status: "All" });

  useEffect(() => {
    if (!draft.subject && subjectOptions[0]) {
      setDraft((current) => ({
        ...current,
        subject: subjectOptions[0].name,
        board: subjectOptions[0].board,
      }));
    }
  }, [draft.subject, subjectOptions]);

  function saveMistake() {
    if (!draft.question.trim() && !draft.wrong.trim() && !draft.correctMethod.trim()) return;
    if (editingId) {
      setMistakes(mistakes.map((mistake) => mistake.id === editingId ? { ...mistake, ...draft } : mistake));
      setEditingId(null);
    } else {
      const id = Date.now();
      setMistakes([{ id, createdAt: new Date().toISOString(), ...draft }, ...mistakes]);
      onAwardXP("add_mistake", 20, { key: `mistake-${id}`, id });
      if (draft.fixed) onAwardXP("fix_mistake", 30, { key: `mistake-fixed-${id}`, id });
    }
    setDraft(emptyDraft);
  }

  function toggleFixed(id) {
    const target = mistakes.find((mistake) => mistake.id === id);
    const nextFixed = !target?.fixed;
    setMistakes(mistakes.map((mistake) => mistake.id === id ? { ...mistake, fixed: nextFixed } : mistake));
    if (nextFixed) onAwardXP("fix_mistake", 30, { key: `mistake-fixed-${id}`, id });
  }

  function editMistake(mistake) {
    setEditingId(mistake.id);
    setDraft({
      subject: mistake.subject || subjectOptions[0]?.name || "",
      board: mistake.board || subjectOptions.find((subject) => subject.name === mistake.subject)?.board || "",
      topic: mistake.topic || "",
      question: mistake.question || "",
      wrong: mistake.wrong || mistake.note || "",
      correctMethod: mistake.correctMethod || "",
      fixed: Boolean(mistake.fixed),
    });
  }

  function deleteMistake(id) {
    setMistakes(mistakes.filter((mistake) => mistake.id !== id));
    if (editingId === id) setEditingId(null);
  }

  const filteredMistakes = mistakes.filter((mistake) => {
    const subjectMatch = filters.subject === "All" || mistake.subject === filters.subject;
    const topicMatch = !filters.topic.trim() || (mistake.topic || "").toLowerCase().includes(filters.topic.toLowerCase());
    const statusMatch =
      filters.status === "All" ||
      (filters.status === "Fixed" && mistake.fixed) ||
      (filters.status === "Open" && !mistake.fixed);

    return subjectMatch && topicMatch && statusMatch;
  });

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xl font-black text-white">Mistakes tracker</h2>
        <p className="mt-1 text-sm text-white/42">Track questions you got wrong and mark them fixed later.</p>
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/45 p-5 text-center text-sm text-white/40">
          Question image upload placeholder
        </div>
        <select
          value={`${draft.board}|${draft.subject}`}
          onChange={(event) => {
            const [board, subject] = event.target.value.split("|");
            setDraft({ ...draft, board, subject });
          }}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
        >
          {subjectOptions.map((subject) => (
            <option key={`${subject.board}-${subject.name}`} value={`${subject.board}|${subject.name}`}>
              {subject.name} - {subject.board}
            </option>
          ))}
        </select>
        <input
          value={draft.topic}
          onChange={(event) => setDraft({ ...draft, topic: event.target.value })}
          placeholder="Topic"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
        />
        <textarea
          value={draft.question}
          onChange={(event) => setDraft({ ...draft, question: event.target.value })}
          placeholder="Question text"
          className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
        />
        <textarea
          value={draft.wrong}
          onChange={(event) => setDraft({ ...draft, wrong: event.target.value })}
          placeholder="What went wrong?"
          className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
        />
        <textarea
          value={draft.correctMethod}
          onChange={(event) => setDraft({ ...draft, correctMethod: event.target.value })}
          placeholder="Correct method"
          className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
        />
        <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white/60">
          <input
            type="checkbox"
            checked={draft.fixed}
            onChange={(event) => setDraft({ ...draft, fixed: event.target.checked })}
            className="h-4 w-4 accent-cyan-300"
          />
          Mark as fixed/reviewed
        </label>
        <button onClick={saveMistake} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-violet-400 px-5 py-3 text-sm font-black text-white transition-all duration-200 ease-out hover:-translate-y-0.5">
          <Save size={16} /> {editingId ? "Update mistake" : "Save mistake"}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setDraft(emptyDraft);
            }}
            className="ml-3 mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/60"
          >
            Cancel edit
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">Review queue</h3>
            <p className="mt-1 text-sm text-white/42">{filteredMistakes.filter((mistake) => !mistake.fixed).length} unresolved mistakes</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={filters.subject}
              onChange={(event) => setFilters({ ...filters, subject: event.target.value })}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
            >
              <option>All</option>
              {unique(mistakes.map((mistake) => mistake.subject)).map((subject) => (
                <option key={subject}>{subject}</option>
              ))}
            </select>
            <input
              value={filters.topic}
              onChange={(event) => setFilters({ ...filters, topic: event.target.value })}
              placeholder="Topic filter"
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
            >
              <option>All</option>
              <option>Open</option>
              <option>Fixed</option>
            </select>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {filteredMistakes.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">No mistakes saved yet.</p>
          ) : (
            filteredMistakes.map((mistake) => (
              <div key={mistake.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{mistake.subject || "Subject"} {mistake.board ? `- ${mistake.board}` : ""}</p>
                    <p className="mt-2 font-black text-white">{mistake.topic || "Untitled topic"}</p>
                    <p className="mt-1 text-sm text-white/45">{mistake.wrong || mistake.note || mistake.question}</p>
                    {mistake.correctMethod && <p className="mt-2 text-sm text-emerald-100/65">Correct method: {mistake.correctMethod}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${mistake.fixed ? "bg-emerald-300 text-slate-950" : "bg-rose-400/15 text-rose-200"}`}>
                    {mistake.fixed ? "Fixed" : "Open"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => toggleFixed(mistake.id)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.08]">
                    <Check size={14} /> {mistake.fixed ? "Reopen" : "Mark fixed"}
                  </button>
                  <button onClick={() => editMistake(mistake)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.08]">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => deleteMistake(mistake.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-400/15">
                    <X size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function AiTutorPanel({ onUpgrade, compact = false }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Personalized AI tutor</h2>
          <p className="mt-1 text-sm text-white/42">Locked on the Free plan for now.</p>
        </div>
        <Lock className="text-violet-200" size={22} />
      </div>
      <div className={`mt-5 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        {[
          ["Year group", "Year 13"],
          ["Predicted grade", "A"],
          ["Target grade", "A*"],
          ["Weak topics", "Fields, integration, organic mechanisms"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/32">{label}</p>
            <p className="mt-2 font-black text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {plans.map(([name, text]) => (
          <div key={name} className={`rounded-2xl border p-4 ${name === "Free" ? "border-cyan-300/20 bg-cyan-300/10" : "border-white/10 bg-slate-950/45"}`}>
            <p className="font-black text-white">{name}</p>
            <p className="mt-2 text-xs leading-5 text-white/45">{text}</p>
          </div>
        ))}
      </div>
      <button onClick={onUpgrade} className="mt-5 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white">
        Upgrade for AI tutor
      </button>
    </section>
  );
}

function ProfileModal({ open, onClose, user, profile, subjects, stats, mistakes, achievements = [], xp = 0, streak = 0, onLogout }) {
  if (!open) return null;
  const rank = getRankFromXP(xp);
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently";
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d1224] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarCircle profile={profile} user={user} size="h-20 w-20" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Student profile</p>
              <h2 className="mt-2 text-3xl font-black">{profile?.full_name || profile?.name || "A-Level Dojo student"}</h2>
              <p className="mt-1 text-sm text-white/45">{user?.email || "Signed in student"} · Joined {joined}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/[0.06]"><X size={20} /></button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <MetricCard label="Rank" value={rank.name} detail={`${xp} XP`} />
          <MetricCard label="Study streak" value={`${streak} days`} detail="Current streak" />
          <MetricCard label="Completed papers" value={stats.completedCount} detail="Across subjects" accent="text-emerald-200" />
          <MetricCard label="Mistakes fixed" value={mistakes.filter((item) => item.fixed).length} detail="Reviewed mistakes" accent="text-rose-200" />
          <MetricCard label="School" value={profile?.school_name || "Not set"} detail="Editable in settings" accent="text-violet-200" />
          <MetricCard label="Selected subjects" value={subjects.length} detail={subjects.map((item) => item.name).join(", ") || "None"} accent="text-cyan-200" />
          <MetricCard label="Refer a friend" value="dojo.link/ref" detail="Share A-Level Dojo" accent="text-yellow-200" />
        </div>
        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/45 p-5">
          <h3 className="font-black text-white">Achievements</h3>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={`rounded-2xl border p-3 ${achievement.unlocked ? "border-cyan-300/25 bg-cyan-300/10" : "border-white/10 bg-white/[0.035]"}`}>
                <p className="font-black text-white">{achievement.label}</p>
                <p className={`mt-1 text-xs font-bold ${achievement.unlocked ? "text-cyan-200" : "text-white/35"}`}>{achievement.unlocked ? "Unlocked" : "Locked"}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onLogout} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}

function SettingsToggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm font-bold text-white/65">
      {label}
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-300" />
    </label>
  );
}

function SettingsSection({ id, kicker, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-xl md:p-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">{kicker}</p>
      <h3 className="mt-2 text-xl font-black tracking-tight text-white">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileSettingsPanel({
  profile,
  user,
  allSubjectsList,
  draftSelectedIds,
  onToggleSubject,
  onSaveSubjects,
  onSaveProfile,
  stats,
  achievements = [],
  xp = 0,
  streak = 0,
  xpEvents = [],
  onOpenPricing = () => {},
  onLogout = () => {},
}) {
  const settingsSections = [
    {
      group: "Account",
      items: [
        { id: "profile-settings", label: "Profile", icon: GraduationCap },
        { id: "subjects-settings", label: "Subjects", icon: BookOpen },
        { id: "subject-grades-settings", label: "Subject grades", icon: BarChart3 },
        { id: "subscription-settings", label: "Subscription", icon: Sparkles },
        { id: "account-actions-settings", label: "Account actions", icon: LogOut },
      ],
    },
    {
      group: "Preferences",
      items: [
        { id: "appearance-settings", label: "Appearance", icon: Eye },
        { id: "gamification-settings", label: "Gamification", icon: Trophy },
        { id: "sound-settings", label: "Sound", icon: Settings2 },
        { id: "language-settings", label: "Language", icon: BookOpen },
      ],
    },
    {
      group: "Privacy & Security",
      items: [
        { id: "active-logins-settings", label: "Active logins", icon: Lock },
        { id: "blocked-users-settings", label: "Blocked users", icon: X },
      ],
    },
    {
      group: "Email Preferences",
      items: [{ id: "email-preferences-settings", label: "Email preferences", icon: FileText }],
    },
    {
      group: "Progress",
      items: [
        { id: "xp-settings", label: "XP", icon: Star },
        { id: "achievements-settings", label: "Achievements", icon: Trophy },
      ],
    },
  ];
  const preferenceDefaults = {
    theme: "dark",
    show_xp: true,
    show_streaks: true,
    sound_effects: false,
    email_notifications: true,
    product_updates: true,
    marketing_emails: false,
    showXP: true,
    showStreaks: true,
    showAchievements: true,
    levelUpNotifications: true,
    soundEffects: false,
    language: "English",
    emailProductUpdates: true,
    emailMarketing: false,
    emailEssential: true,
    avatarStyle: "initials",
    avatarColor: "violet",
  };
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    school_name: profile?.school_name || "",
    year_group: profile?.year_group || "Year 13",
    cambridge_zone: profile?.cambridge_zone || profile?.exam_zone || "",
    subject_grades: profile?.subject_grades || {},
    preferences: { ...preferenceDefaults, ...(profile?.preferences || {}) },
  });
  const [activeSettingsSection, setActiveSettingsSection] = useState("profile-settings");
  const [saveStatus, setSaveStatus] = useState("saved");
  const debounceSaveRef = useRef(null);
  const selectedSubjects = allSubjectsList.filter((subject) => draftSelectedIds.includes(subject.id));
  const rank = getRankFromXP(xp);
  const rankProgress = getNextRankProgress(xp);
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently";
  const hasCambridgeSubject = selectedSubjects.some((subject) => subject.board === "Cambridge");
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
  const lockedAchievements = achievements.filter((achievement) => !achievement.unlocked);
  const xpGraphEvents = xpEvents.slice(0, 7).reverse();
  const gradeOptions = ["Not set", "A*", "A", "B", "C", "D", "E", "U"];

  useEffect(() => {
    const ids = settingsSections.flatMap((group) => group.items.map((item) => item.id));
    let frame = null;

    function updateActiveSection() {
      frame = null;
      const marker = Math.round(window.innerHeight * 0.28);
      const sections = ids
        .map((id) => ({ id, element: document.getElementById(id) }))
        .filter((item) => item.element)
        .map((item) => ({ ...item, rect: item.element.getBoundingClientRect() }));

      const current =
        sections.find((item) => item.rect.top <= marker && item.rect.bottom > marker) ||
        sections
          .filter((item) => item.rect.top <= marker)
          .sort((a, b) => b.rect.top - a.rect.top)[0] ||
        sections.sort((a, b) => Math.abs(a.rect.top - marker) - Math.abs(b.rect.top - marker))[0];

      if (current?.id) {
        setActiveSettingsSection((previous) => (previous === current.id ? previous : current.id));
      }
    }

    function requestUpdate() {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    }

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    document.addEventListener("scroll", requestUpdate, true);
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      document.removeEventListener("scroll", requestUpdate, true);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  async function autoSaveProfile(patch) {
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    setSaveStatus("saving");
    try {
      await onSaveProfile({
        ...profile,
        ...patch,
        updated_at: new Date().toISOString(),
      });
      setSaveStatus("saved");
    } catch (error) {
      console.error(error);
      setSaveStatus("failed");
    } finally {
      window.requestAnimationFrame(() => window.scrollTo(scrollPosition.x, scrollPosition.y));
    }
  }

  function debounceProfilePatch(patch) {
    setSaveStatus("unsaved");
    if (debounceSaveRef.current) window.clearTimeout(debounceSaveRef.current);
    debounceSaveRef.current = window.setTimeout(() => {
      debounceSaveRef.current = null;
      autoSaveProfile(patch);
    }, 700);
  }

  function updateProfileField(key, value, options = {}) {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    const patch = {
      [key]: value || null,
    };
    if (options.debounce) {
      debounceProfilePatch(patch);
    } else {
      autoSaveProfile(patch);
    }
  }

  function subjectGradeKey(subject) {
    return [subject.name || subject.subject, subject.board].filter(Boolean).join("|");
  }

  function updateSubjectGrade(subject, gradeType, value) {
    const key = subjectGradeKey(subject);
    const savedValue = value === "Not set" ? null : value;
    const nextSubjectGrades = {
      ...(form.subject_grades || {}),
      [key]: {
        ...((form.subject_grades || {})[key] || {}),
        [gradeType]: savedValue,
      },
    };

    setForm((current) => ({ ...current, subject_grades: nextSubjectGrades }));
    autoSaveProfile({ subject_grades: nextSubjectGrades });
  }

  async function saveSubjectSelection(ids, cambridgeZone = form.cambridge_zone) {
    const nextSubjects = allSubjectsList
      .filter((subject) => ids.includes(subject.id))
      .map((subject) => ({ board: subject.board, subject: subject.name }));
    const hasCambridge = nextSubjects.some((subject) => subject.board === "Cambridge");
    await autoSaveProfile({
      subjects: nextSubjects,
      selected_subjects: nextSubjects,
      cambridge_zone: hasCambridge ? cambridgeZone || null : null,
      onboarding_completed: true,
    });
  }

  function toggleSubjectAutosave(subjectId) {
    const nextIds = draftSelectedIds.includes(subjectId)
      ? draftSelectedIds.filter((id) => id !== subjectId)
      : [...draftSelectedIds, subjectId];
    onToggleSubject(subjectId);
    saveSubjectSelection(nextIds);
  }

  async function saveAll(event) {
    event?.preventDefault?.();
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    const savedSubjects = selectedSubjects
      .map((subject) => ({ board: subject.board, subject: subject.name }));
    const hasCambridgeSubject = savedSubjects.some((subject) => subject.board === "Cambridge");

    await onSaveProfile({
      ...profile,
      ...form,
      subjects: savedSubjects,
      selected_subjects: savedSubjects,
      cambridge_zone: hasCambridgeSubject ? form.cambridge_zone || null : null,
      onboarding_completed: true,
    });
    await onSaveSubjects();
    window.requestAnimationFrame(() => window.scrollTo(scrollPosition.x, scrollPosition.y));
  }

  async function savePreferences(nextPreferences) {
    await autoSaveProfile({
      preferences: {
        ...(profile?.preferences || {}),
        ...nextPreferences,
      },
    });
  }

  function updatePreference(key, value, save = true) {
    const nextPreferences = {
      ...form.preferences,
      [key]: value,
    };
    setForm((current) => ({ ...current, preferences: nextPreferences }));
    if (save) savePreferences(nextPreferences);
  }

  function scrollToSettingsSection(id) {
    setActiveSettingsSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    return () => {
      if (debounceSaveRef.current) window.clearTimeout(debounceSaveRef.current);
    };
  }, []);

  const SettingCard = ({ title, children }) => (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );

  const Toggle = SettingsToggle;
  const SettingSection = SettingsSection;
  const previewProfile = { ...profile, preferences: form.preferences };

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Account center</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-black text-white">Settings</h2>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${
            saveStatus === "saving"
              ? "border-violet-300/20 bg-violet-300/10 text-violet-100"
              : saveStatus === "failed"
              ? "border-rose-300/25 bg-rose-400/10 text-rose-100"
              : saveStatus === "unsaved"
              ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
              : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
          }`}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "failed" ? "Save failed" : saveStatus === "unsaved" ? "Unsaved changes" : "Saved"}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-white/42">Manage your profile, subjects, plan, preferences, privacy, email, and progress from one scrollable page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-slate-950/55 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
            {settingsSections.map((group) => (
              <div key={group.group} className="mb-4 last:mb-0">
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{group.group}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeSettingsSection === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => scrollToSettingsSection(item.id)}
                        className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                          active
                            ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200"
                            : "border-transparent text-white/48 hover:bg-white/[0.045] hover:text-white/75"
                        }`}
                      >
                        <Icon size={15} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <SettingSection id="profile-settings" kicker="Account" title="Profile">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-4">
                <AvatarCircle profile={previewProfile} user={user} size="h-20 w-20" />
                <div>
                  <p className="text-xl font-black text-white">{form.full_name || "Name not set"}</p>
                  <p className="mt-1 text-sm text-white/45">{user?.email}</p>
                  <p className="mt-1 text-xs text-white/35">Joined {joined}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{rank.name}</span>
                    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-black text-violet-100">{xp} XP</span>
                    <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-black text-rose-100">{streak} day streak</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <input value={form.full_name} onChange={(event) => updateProfileField("full_name", event.target.value, { debounce: true })} placeholder="Name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300" />
              <input value={form.school_name} onChange={(event) => updateProfileField("school_name", event.target.value, { debounce: true })} placeholder="School name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300" />
              <select value={form.year_group} onChange={(event) => updateProfileField("year_group", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300">{["Year 12", "Year 13", "Private candidate", "Other"].map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm font-black text-white">Choose avatar</p>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {avatarStyles.map((option) => {
                  const Icon = option.icon;
                  const selected = form.preferences.avatarStyle === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => updatePreference("avatarStyle", option.value)}
                      className={`flex aspect-square items-center justify-center rounded-2xl border text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                        selected ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06]"
                      }`}
                      title={option.label}
                    >
                      {Icon ? <Icon size={19} /> : option.value === "dojo-a" ? "A" : (form.full_name || user?.email || "A").slice(0, 1).toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-white/35">Avatar color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(avatarColors).map(([value, colorClass]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => updatePreference("avatarColor", value)}
                    className={`h-8 w-8 rounded-full bg-gradient-to-br ${colorClass} transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                      form.preferences.avatarColor === value ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950" : "ring-1 ring-white/10"
                    }`}
                    title={value}
                  />
                ))}
              </div>
            </div>
          </SettingSection>

          <SettingSection id="subjects-settings" kicker="Account" title="Subjects">
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedSubjects.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">No subjects selected yet.</p>
              ) : selectedSubjects.map((subject) => (
                <div key={subject.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="font-black text-white">{subject.name}</p>
                  <p className="mt-1 text-xs font-bold text-cyan-100/65">{subject.board}</p>
                </div>
              ))}
            </div>
            {hasCambridgeSubject && (
              <select value={form.cambridge_zone || ""} onChange={(event) => {
                const zone = event.target.value;
                setForm((current) => ({ ...current, cambridge_zone: zone }));
                saveSubjectSelection(draftSelectedIds, zone);
              }} className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300 md:max-w-sm"><option value="">Cambridge exam zone</option>{["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"].map((zone) => <option key={zone}>{zone}</option>)}</select>
            )}
            <div className="space-y-5">
              {subjectGroups.map((group) => (
                <section key={group.board}>
                  <h4 className="mb-2 text-sm font-black text-white/75">{group.board}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.subjects.map((subject) => {
                      const selected = draftSelectedIds.includes(subject.id);
                      return <button type="button" key={subject.id} onClick={() => toggleSubjectAutosave(subject.id)} className={`rounded-full border px-4 py-2 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${selected ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06]"}`}>{subject.name}</button>;
                    })}
                  </div>
                </section>
              ))}
            </div>
          </SettingSection>

          <SettingSection id="subject-grades-settings" kicker="Account" title="Subject grades">
            <p className="-mt-2 mb-5 text-sm leading-6 text-white/45">
              Set your current, predicted, and target grades for each subject.
            </p>
            {selectedSubjects.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-sm font-bold text-white/55">Choose your subjects first to set subject grades.</p>
                <button
                  type="button"
                  onClick={() => scrollToSettingsSection("subjects-settings")}
                  className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-300/15"
                >
                  Edit subjects
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSubjects.map((subject) => {
                  const key = subjectGradeKey(subject);
                  const grades = form.subject_grades?.[key] || {};
                  return (
                    <div key={subject.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                      <div className="mb-4">
                        <p className="font-black text-white">{subject.name}</p>
                        <p className="mt-1 text-xs font-bold text-cyan-100/65">{subject.board}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          ["current", "Current grade"],
                          ["predicted", "Predicted grade"],
                          ["target", "Target grade"],
                        ].map(([gradeType, label]) => (
                          <label key={gradeType} className="block">
                            <span className="text-xs font-black uppercase tracking-[0.14em] text-white/35">{label}</span>
                            <select
                              value={grades[gradeType] || "Not set"}
                              onChange={(event) => updateSubjectGrade(subject, gradeType, event.target.value)}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                            >
                              {gradeOptions.map((grade) => (
                                <option key={grade}>{grade}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SettingSection>

          <SettingSection id="subscription-settings" kicker="Account" title="Subscription">
            <div className="grid gap-3 md:grid-cols-3">
              {["Free", "Dojo Plus", "Dojo Pro"].map((plan, index) => (
                <div key={plan} className={`rounded-2xl border p-4 ${index === 0 ? "border-cyan-300/20 bg-cyan-300/10" : "border-white/10 bg-slate-950/45"}`}>
                  <p className="font-black text-white">{index === 0 ? "Current plan: " : ""}{plan}</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    {index === 0 ? "Basic dashboard, saved subjects, and progress tracking." : index === 1 ? "Unlimited papers, PDF tools, topic tests, mistakes, calendar, and insights." : "AI tutor, weak-topic recommendations, generators, and advanced analytics."}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="font-black text-white">Billing</p>
              <p className="mt-1 text-sm text-white/45">Billing controls will appear here when paid plans launch.</p>
            </div>
            <button type="button" onClick={onOpenPricing} className="mt-4 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white transition-all duration-200 ease-out hover:-translate-y-0.5">Upgrade</button>
          </SettingSection>

          <SettingSection id="account-actions-settings" kicker="Account" title="Account actions">
            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => scrollToSettingsSection("profile-settings")} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-left font-black text-cyan-100">Reconfigure account</button>
              <button type="button" onClick={onLogout} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left font-black text-white/65">Log out</button>
              <button type="button" className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-left font-black text-rose-100">Reset progress</button>
              <button type="button" className="rounded-2xl border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-left font-black text-rose-100">Delete account</button>
            </div>
          </SettingSection>

          <SettingSection id="appearance-settings" kicker="Preferences" title="Appearance">
            <div className="grid gap-3 md:grid-cols-3">
              {["dark", "light", "system"].map((theme) => (
                <button type="button" key={theme} onClick={() => updatePreference("theme", theme)} className={`rounded-2xl border p-4 text-left font-black capitalize transition-all duration-200 ease-out hover:-translate-y-0.5 ${form.preferences.theme === theme ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-slate-950/45 text-white/55"}`}>
                  {theme}
                </button>
              ))}
            </div>
          </SettingSection>

          <SettingSection id="gamification-settings" kicker="Preferences" title="Gamification">
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Show XP" value={form.preferences.showXP} onChange={(value) => updatePreference("showXP", value)} />
              <Toggle label="Show streaks" value={form.preferences.showStreaks} onChange={(value) => updatePreference("showStreaks", value)} />
              <Toggle label="Show achievements" value={form.preferences.showAchievements} onChange={(value) => updatePreference("showAchievements", value)} />
              <Toggle label="Show level-up notifications" value={form.preferences.levelUpNotifications} onChange={(value) => updatePreference("levelUpNotifications", value)} />
            </div>
          </SettingSection>

          <SettingSection id="sound-settings" kicker="Preferences" title="Sound">
            <Toggle label="Enable sound effects" value={form.preferences.soundEffects} onChange={(value) => updatePreference("soundEffects", value)} />
          </SettingSection>

          <SettingSection id="language-settings" kicker="Preferences" title="Language">
            <select value={form.preferences.language} onChange={(event) => updatePreference("language", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300 md:max-w-sm">
              {["English", "Arabic", "French", "Spanish"].map((language) => <option key={language}>{language}</option>)}
            </select>
          </SettingSection>

          <SettingSection id="active-logins-settings" kicker="Privacy & Security" title="Active logins">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">No active sessions found</div>
            <button type="button" className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/65">Sign out of all devices</button>
          </SettingSection>

          <SettingSection id="blocked-users-settings" kicker="Privacy & Security" title="Blocked users">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">You haven't blocked anyone yet</div>
          </SettingSection>

          <SettingSection id="email-preferences-settings" kicker="Email Preferences" title="Email preferences">
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Product updates" value={form.preferences.emailProductUpdates} onChange={(value) => updatePreference("emailProductUpdates", value)} />
              <Toggle label="Marketing & promotions" value={form.preferences.emailMarketing} onChange={(value) => updatePreference("emailMarketing", value)} />
              <Toggle label="Essential emails" value={form.preferences.emailEssential} onChange={(value) => updatePreference("emailEssential", value)} />
            </div>
          </SettingSection>

          <SettingSection id="xp-settings" kicker="Progress" title="XP">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Current XP" value={xp} detail="Total earned" />
              <MetricCard label="Current rank" value={rankProgress.currentRank.name} detail="Your level" accent="text-violet-200" />
              <MetricCard label="Next rank" value={rankProgress.nextRank?.name || "Max rank"} detail={`${rankProgress.needed} XP needed`} accent="text-rose-200" />
              <MetricCard label="Streak" value={`${streak} days`} detail="Current streak" accent="text-emerald-200" />
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-rose-300" style={{ width: `${rankProgress.percent}%` }} />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Recent XP</p>
              {xpGraphEvents.length === 0 ? (
                <p className="mt-3 text-sm text-white/42">No XP activity yet.</p>
              ) : (
                <div className="mt-3 flex h-24 items-end gap-2">
                  {xpGraphEvents.map((event, index) => (
                    <span key={event.id || index} className="flex-1 rounded-t-lg bg-gradient-to-t from-violet-400/35 to-cyan-300/70" style={{ height: `${Math.max(16, Math.min(96, Number(event.amount || 0) * 1.8))}%` }} title={`${event.action}: ${event.amount} XP`} />
                  ))}
                </div>
              )}
            </div>
          </SettingSection>

          <SettingSection id="achievements-settings" kicker="Progress" title="Achievements">
            <p className="mb-4 text-sm font-bold text-white/45">{unlockedAchievements.length}/{achievements.length} unlocked</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[...unlockedAchievements, ...lockedAchievements].map((achievement) => (
                <div key={achievement.id} className={`rounded-2xl border p-3 text-sm font-bold ${achievement.unlocked ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/40"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span>{achievement.label}</span>
                    <span className="text-xs">{achievement.unlocked ? "Unlocked" : "Locked"}</span>
                  </div>
                </div>
              ))}
            </div>
          </SettingSection>
        </div>
      </div>

    </section>
  );

  return (
    <section className="space-y-5">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Account center</p>
        <h2 className="mt-2 text-3xl font-black text-white">Settings</h2>
        <p className="mt-1 text-sm text-white/42">Manage your account, subjects, plan, preferences, security, and progress.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingCard title="Account">
          <div className="mb-4 flex items-center gap-4">
            <AvatarCircle profile={previewProfile} user={user} size="h-16 w-16" />
            <div>
              <p className="font-black text-white">{form.full_name || "Name not set"}</p>
              <p className="text-sm text-white/42">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300" />
            <input value={form.school_name} onChange={(event) => setForm({ ...form, school_name: event.target.value })} placeholder="School name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300" />
            <select value={form.year_group} onChange={(event) => setForm({ ...form, year_group: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300">{["Year 12", "Year 13", "Private candidate", "Other"].map((item) => <option key={item}>{item}</option>)}</select>
            <select value={form.cambridge_zone || ""} onChange={(event) => setForm({ ...form, cambridge_zone: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300"><option value="">Cambridge exam zone</option>{["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"].map((zone) => <option key={zone}>{zone}</option>)}</select>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-sm font-black text-white">Choose avatar</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {avatarStyles.map((option) => {
                const Icon = option.icon;
                const selected = form.preferences.avatarStyle === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("avatarStyle", option.value)}
                    className={`flex aspect-square items-center justify-center rounded-2xl border text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                      selected ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06]"
                    }`}
                    title={option.label}
                  >
                    {Icon ? <Icon size={19} /> : option.value === "dojo-a" ? "A" : (form.full_name || user?.email || "A").slice(0, 1).toUpperCase()}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-white/35">Avatar color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(avatarColors).map(([value, colorClass]) => (
                <button
                  key={value}
                  onClick={() => updatePreference("avatarColor", value)}
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${colorClass} transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                    form.preferences.avatarColor === value ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950" : "ring-1 ring-white/10"
                  }`}
                  title={value}
                />
              ))}
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Subjects">
          <div className="mb-4 flex flex-wrap gap-2">{selectedSubjects.map((subject) => <span key={subject.id} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100">{subject.name} · {subject.board}</span>)}</div>
          <div className="space-y-5">
            {subjectGroups.map((group) => (
              <section key={group.board}>
                <h4 className="mb-2 text-sm font-black text-white/75">{group.board}</h4>
                <div className="flex flex-wrap gap-2">
                  {group.subjects.map((subject) => {
                    const selected = draftSelectedIds.includes(subject.id);
                    return <button key={subject.id} onClick={() => onToggleSubject(subject.id)} className={`rounded-full border px-4 py-2 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${selected ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06]"}`}>{subject.name}</button>;
                  })}
                </div>
              </section>
            ))}
          </div>
        </SettingCard>

        <SettingCard title="Plan">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <p className="font-black text-white">Current plan: Free</p>
            <p className="mt-1 text-sm text-white/45">Billing and subscription controls will appear here when paid plans launch.</p>
          </div>
          <button onClick={onOpenPricing} className="mt-4 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white">Upgrade</button>
        </SettingCard>

        <SettingCard title="Preferences">
          <div className="grid gap-3">
            <select value={form.preferences.theme} onChange={(event) => updatePreference("theme", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select>
            <Toggle label="Show XP" value={form.preferences.show_xp} onChange={(value) => updatePreference("show_xp", value)} />
            <Toggle label="Show streaks" value={form.preferences.show_streaks} onChange={(value) => updatePreference("show_streaks", value)} />
            <Toggle label="Sound effects" value={form.preferences.sound_effects} onChange={(value) => updatePreference("sound_effects", value)} />
            <Toggle label="Email notifications" value={form.preferences.email_notifications} onChange={(value) => updatePreference("email_notifications", value)} />
            <Toggle label="Product updates" value={form.preferences.product_updates} onChange={(value) => updatePreference("product_updates", value)} />
            <Toggle label="Marketing emails" value={form.preferences.marketing_emails} onChange={(value) => updatePreference("marketing_emails", value)} />
          </div>
        </SettingCard>

        <SettingCard title="Security">
          <div className="space-y-3 text-sm text-white/50">
            <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">Active sessions placeholder</p>
            <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-black text-white/65">Sign out of all devices</button>
            <button className="ml-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 font-black text-rose-100">Delete account</button>
            <button className="ml-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 font-black text-rose-100">Reset progress</button>
          </div>
        </SettingCard>

        <SettingCard title="Progress">
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Rank" value={rank.name} detail={`${xp} XP`} />
            <MetricCard label="Streak" value={`${streak} days`} detail="Current streak" accent="text-violet-200" />
            <MetricCard label="Completed" value={stats.completedCount} detail="Papers/tests" accent="text-emerald-200" />
          </div>
          <div className="mt-4 flex h-20 items-end gap-2 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            {[34, 50, 42, 72, 64, 86, 76].map((height, index) => <span key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-violet-400/35 to-cyan-300/70" style={{ height }} />)}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {achievements.map((achievement) => <div key={achievement.id} className={`rounded-2xl border p-3 text-sm font-bold ${achievement.unlocked ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/40"}`}>{achievement.label}</div>)}
          </div>
        </SettingCard>
      </div>

    </section>
  );
}

function PastPapersLandingPage({
  subjects = [],
  user = null,
  completedPaperIds = [],
  onOpenSubject = () => {},
  onOpenPaperEdit = () => {},
}) {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All selected subjects");
  const [boardFilter, setBoardFilter] = useState("All boards");
  const [yearFilter, setYearFilter] = useState("All years");
  const [markedFilter, setMarkedFilter] = useState("All");
  const [savedPaperIds] = useState(() => readStorage("alevel-dojo-favourites", []));
  const [annotatedPaperIds, setAnnotatedPaperIds] = useState([]);

  const subjectPaperGroups = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectPapers = sortPapersNewestFirst(getSubjectPapers(subject));
        return {
          subject,
          papers: subjectPapers,
          latestPaper: subjectPapers[0] || null,
        };
      }),
    [subjects]
  );

  const allSubjectPapers = useMemo(
    () =>
      subjectPaperGroups.flatMap(({ subject, papers: subjectPapers }) =>
        subjectPapers.map((paper) => ({ ...paper, subjectEntry: subject }))
      ),
    [subjectPaperGroups]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAnnotationStatus() {
      if (!user?.id || allSubjectPapers.length === 0) {
        setAnnotatedPaperIds([]);
        return;
      }

      const ids = allSubjectPapers.map((paper) => paperId(paper));
      const { data, error } = await supabase
        .from("pdf_annotations")
        .select("paper_id, annotations")
        .eq("user_id", user.id)
        .eq("pdf_type", "question")
        .in("paper_id", ids);

      if (cancelled) return;

      if (error) {
        setAnnotatedPaperIds([]);
        return;
      }

      setAnnotatedPaperIds(
        (data || [])
          .filter((row) => {
            if (!row.annotations?.pages) return false;
            return Object.values(row.annotations.pages).some(
              (items) => Array.isArray(items) && items.length > 0
            );
          })
          .map((row) => row.paper_id)
      );
    }

    loadAnnotationStatus();

    function handleAnnotationSaved(event) {
      const { paperId: changedPaperId, pdfType, hasAnnotations } = event.detail || {};
      if (pdfType !== "question") return;

      setAnnotatedPaperIds((current) => {
        if (hasAnnotations) {
          return current.includes(changedPaperId) ? current : [...current, changedPaperId];
        }

        return current.filter((item) => item !== changedPaperId);
      });
    }

    function handleAnnotationReset(event) {
      const { paperId: changedPaperId, pdfType } = event.detail || {};
      if (pdfType !== "question") return;
      setAnnotatedPaperIds((current) => current.filter((item) => item !== changedPaperId));
    }

    window.addEventListener("alevel-dojo:pdf-annotations-saved", handleAnnotationSaved);
    window.addEventListener("alevel-dojo:pdf-annotations-reset", handleAnnotationReset);

    return () => {
      cancelled = true;
      window.removeEventListener("alevel-dojo:pdf-annotations-saved", handleAnnotationSaved);
      window.removeEventListener("alevel-dojo:pdf-annotations-reset", handleAnnotationReset);
    };
  }, [allSubjectPapers, user?.id]);

  const availableBoards = ["All boards", ...unique(subjects.map((subject) => subject.board))];
  const availableYears = [
    "All years",
    ...sortYearsDescending(unique(allSubjectPapers.map((paper) => paper.year).filter(Boolean))).map(String),
  ];

  const filteredSubjects = subjectPaperGroups.filter(({ subject, papers: subjectPapers }) => {
    const text = `${subject.name} ${subject.board} ${subjectPapers
      .map((paper) => `${paper.unit || ""} ${paper.session || ""} ${paper.year || ""}`)
      .join(" ")}`.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (subjectFilter === "All selected subjects" || subject.id === subjectFilter) &&
      (boardFilter === "All boards" || subject.board === boardFilter)
    );
  });

  function unitLabel(paper) {
    return paper.unit || paper.topic || "Other papers";
  }

  function carouselId(subjectId, unit) {
    return `past-paper-carousel-${subjectId}-${String(unit)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;
  }

  function scrollUnitCarousel(id, direction) {
    const carousel = document.getElementById(id);
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * Math.min(carousel.clientWidth * 0.85, 620),
      behavior: "smooth",
    });
  }

  const subjectSections = filteredSubjects.map(({ subject, papers: subjectPapers }) => {
    const filteredPapers = sortPapersNewestFirst(subjectPapers).filter((paper) => {
      const id = paperId(paper);
      const text = `${paperLabel(paper)} ${paper.subject} ${paper.board} ${paper.unit || ""} ${
        paper.session || ""
      } ${paper.year || ""}`.toLowerCase();
      const isMarked = annotatedPaperIds.includes(id);

      return (
        text.includes(search.toLowerCase()) &&
        (yearFilter === "All years" || String(paper.year) === String(yearFilter)) &&
        (markedFilter === "All" ||
          (markedFilter === "Marked" && isMarked) ||
          (markedFilter === "Unmarked" && !isMarked))
      );
    });

    const grouped = sortUnits(unique(filteredPapers.map(unitLabel))).map((unit) => ({
      unit,
      papers: filteredPapers.filter((paper) => unitLabel(paper) === unit).slice(0, 12),
      total: filteredPapers.filter((paper) => unitLabel(paper) === unit).length,
    }));

    return {
      subject,
      groups: grouped.filter((group) => group.papers.length > 0),
      totalMatchingPapers: filteredPapers.length,
    };
  }).filter((section) => section.totalMatchingPapers > 0);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">
              A-Level Dojo Library
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">Past Papers</h1>
            <p className="mt-2 text-sm text-white/52">
              Choose a subject and start from the latest papers.
            </p>
          </div>

          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subjects, papers, units..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.045] py-3 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option>All selected subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={boardFilter}
            onChange={(event) => setBoardFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            {availableBoards.map((board) => (
              <option key={board}>{board}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            {availableYears.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <select
            value={markedFilter}
            onChange={(event) => setMarkedFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option>All</option>
            <option>Marked</option>
            <option>Unmarked</option>
          </select>
        </div>
      </div>

      <section className="space-y-4">
        {subjects.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-white/48">
            No subjects selected yet. Go to settings to add subjects.
          </div>
        ) : subjectSections.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-white/48">
            No papers found for this filter.
          </div>
        ) : (
          subjectSections.map(({ subject, groups, totalMatchingPapers }) => {
            const visual = subjectVisuals[normalizeSubjectName(subject.name)] || defaultSubjectVisual;
            const Icon = visual.icon || BookOpen;

            return (
              <article
                key={subject.id}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/15"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`hidden rounded-2xl border p-2.5 sm:inline-flex ${visual.soft}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">{subject.name}</h2>
                      <p className="mt-0.5 text-sm text-white/42">
                        {subject.board} · {totalMatchingPapers} matching paper{totalMatchingPapers === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSubject(subject.id, "pastpapers")}
                    className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-300/15"
                  >
                    Go to subject
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="py-5 text-sm text-white/45">No papers available yet.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {groups.map((group) => {
                      const carouselKey = carouselId(subject.id, group.unit);

                      return (
                      <div key={group.unit} className="py-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/58">
                            {group.unit}
                          </h3>
                          <div className="flex items-center gap-2">
                            {group.total > group.papers.length && (
                              <button
                                type="button"
                                onClick={() => onOpenSubject(subject.id, "pastpapers")}
                                className="text-xs font-black text-cyan-200 hover:text-cyan-100"
                              >
                                View all
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => scrollUnitCarousel(carouselKey, -1)}
                              aria-label={`Scroll ${group.unit} papers left`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollUnitCarousel(carouselKey, 1)}
                              aria-label={`Scroll ${group.unit} papers right`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
                            >
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        </div>

                        <div
                          id={carouselKey}
                          className="scrollbar-hidden flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pr-2"
                        >
                          {group.papers.map((paper) => {
                            const id = paperId(paper);
                            const isCompleted = completedPaperIds.includes(id);
                            const isSaved = savedPaperIds.includes(id);
                            const isAnnotated = annotatedPaperIds.includes(id);
                            const paperInsert = getPaperInsert(paper, subject);

                            return (
                              <article
                                key={id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onOpenSubject(subject.id, "pastpapers")}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onOpenSubject(subject.id, "pastpapers");
                                  }
                                }}
                                className="relative flex min-h-[190px] w-[230px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055] hover:shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                              >
                                <FileText
                                  className="pointer-events-none absolute -right-2 top-3 text-cyan-200/[0.07]"
                                  size={76}
                                />
                                <div className="relative z-10">
                                  <div className="mb-3 inline-flex rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-cyan-100">
                                    <FileText size={25} />
                                  </div>
                                  <p className="line-clamp-2 text-sm font-black text-white">
                                    {paperCardTitle(paper, group.unit)}
                                  </p>
                                  <p className="hidden">
                                    {paper.session || "Session"} {paper.year || ""} · {paper.unit || group.unit}
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-white/48">
                                    {paperSessionLabel(paper) || "Session"}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-white/32">
                                    {paper.qualification || "Question paper"}
                                  </p>
                                </div>

                                <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                                  {paper.variant && (
                                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-100">
                                      {paper.variant}
                                    </span>
                                  )}
                                  {paperInsert && (
                                    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-violet-100">
                                      {paperInsert.label}
                                    </span>
                                  )}
                                  {isAnnotated && (
                                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-100">
                                      Marked
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-100">
                                      Completed
                                    </span>
                                  )}
                                  {isSaved && (
                                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-amber-100">
                                      Saved
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (isPdfPaper(paper)) {
                                        onOpenPaperEdit(subject.id, paper);
                                      } else {
                                        openPaperFile(paper);
                                      }
                                    }}
                                    className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${visual.accent} px-3 py-2 text-xs font-black text-white shadow-lg ${visual.glow} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110`}
                                  >
                                    {isPdfPaper(paper) ? <Edit3 size={14} /> : <Eye size={14} />}
                                    {isPdfPaper(paper) ? "PDF Edit" : "View Paper"}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}

function PastPapersPanel({
  subject,
  user,
  onRequireLogin,
  persistedPreview = null,
  onPreviewChange = () => {},
  completedPaperIds = [],
  onCompletedPaperIdsChange = () => {},
  onAwardXP = () => {},
}) {
  const [activePreview, setActivePreview] = useState(null);
  const [showMarkScheme, setShowMarkScheme] = useState(false);
  const [showInsert, setShowInsert] = useState(false);
  const [maximizedPreview, setMaximizedPreview] = useState(false);
  const [paperSearch, setPaperSearch] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("All qualifications");
  const [selectedUnit, setSelectedUnit] = useState("All units");
  const [selectedYear, setSelectedYear] = useState("All years");
  const [selectedSession, setSelectedSession] = useState("All sessions");
  const [completionFilter, setCompletionFilter] = useState("All papers");
  const [annotationFilter, setAnnotationFilter] = useState("All markings");
  const [annotatedPaperIds, setAnnotatedPaperIds] = useState([]);
  const [exportingPaperId, setExportingPaperId] = useState("");
  const [exportError, setExportError] = useState("");

  const [savedPaperIds, setSavedPaperIds] = useState(() =>
    readStorage("alevel-dojo-favourites", [])
  );

  const subjectPastPapers = getSubjectPapers(subject);

  function hasSavedAnnotations(payload) {
    if (!payload?.pages || typeof payload.pages !== "object") return false;
    return Object.values(payload.pages).some(
      (items) => Array.isArray(items) && items.length > 0
    );
  }

  useEffect(() => {
    let cancelled = false;
    const ids = subjectPastPapers.map((paper) => paperId(paper));

    async function loadAnnotationStatus() {
      if (!user?.id || subjectPastPapers.length === 0) {
        setAnnotatedPaperIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("pdf_annotations")
        .select("paper_id, annotations")
        .eq("user_id", user.id)
        .eq("pdf_type", "question")
        .in("paper_id", ids);

      if (cancelled) return;

      if (error) {
        setAnnotatedPaperIds([]);
        return;
      }

      setAnnotatedPaperIds(
        (data || [])
          .filter((row) => hasSavedAnnotations(row.annotations))
          .map((row) => row.paper_id)
      );
    }

    loadAnnotationStatus();

    function handleAnnotationSaved(event) {
      const { paperId: changedPaperId, pdfType, hasAnnotations } = event.detail || {};
      if (pdfType !== "question" || !ids?.includes?.(changedPaperId)) return;

      setAnnotatedPaperIds((current) => {
        if (hasAnnotations) {
          return current.includes(changedPaperId) ? current : [...current, changedPaperId];
        }

        return current.filter((item) => item !== changedPaperId);
      });
    }

    function handleAnnotationReset(event) {
      const { paperId: changedPaperId, pdfType } = event.detail || {};
      if (pdfType !== "question") return;
      setAnnotatedPaperIds((current) => current.filter((item) => item !== changedPaperId));
    }

    window.addEventListener("alevel-dojo:pdf-annotations-saved", handleAnnotationSaved);
    window.addEventListener("alevel-dojo:pdf-annotations-reset", handleAnnotationReset);

    return () => {
      cancelled = true;
      window.removeEventListener("alevel-dojo:pdf-annotations-saved", handleAnnotationSaved);
      window.removeEventListener("alevel-dojo:pdf-annotations-reset", handleAnnotationReset);
    };
  }, [subject.id, user?.id]);

  useEffect(() => {
    if (persistedPreview?.type !== "pastPaper") return;

    const restoredPaper = subjectPastPapers.find(
      (paper) => paperId(paper) === persistedPreview.paperId
    );

    if (restoredPaper) {
      setActivePreview({
        paper: restoredPaper,
        mode: persistedPreview.mode || "preview",
      });
      setShowMarkScheme(Boolean(persistedPreview.showMarkScheme));
      setShowInsert(Boolean(persistedPreview.showInsert));
    }
  }, [persistedPreview?.paperId, persistedPreview?.type, subject.id]);

  function openPaperPreview(paper, mode, showMarkSchemeNext = false) {
    setActivePreview({ paper, mode });
    setShowMarkScheme(showMarkSchemeNext);
    setShowInsert(false);
    onPreviewChange({
      type: "pastPaper",
      paperId: paperId(paper),
      mode,
      showMarkScheme: showMarkSchemeNext,
      showInsert: false,
    });
  }

  function closePaperPreview() {
    setActivePreview(null);
    setShowMarkScheme(false);
    setShowInsert(false);
    setMaximizedPreview(false);
    onPreviewChange(null);
  }

  function toggleInsert() {
    if (!activePreview) return;
    const next = !showInsert;
    setShowInsert(next);
    onPreviewChange({
      type: "pastPaper",
      paperId: paperId(activePreview.paper),
      mode: activePreview.mode,
      showMarkScheme,
      showInsert: next,
    });
  }

  const availableQualifications = [
    "All qualifications",
    ...unique(subjectPastPapers.map((paper) => paper.qualification)),
  ];

  const availableUnits = [
    "All units",
    ...sortUnits(unique(subjectPastPapers.map((paper) => paper.unit))),
  ];

  const availableYears = [
    "All years",
    ...sortYearsDescending(unique(subjectPastPapers.map((paper) => paper.year).filter(Boolean))).map(String),
  ];

  const availableSessions = [
    "All sessions",
    ...sortSessions(unique(subjectPastPapers.map((paper) => paper.session))),
  ];

  const filteredPapers = subjectPastPapers.filter((paper) => {
    const id = paperId(paper);
    const isCompleted = completedPaperIds.includes(id);
    const isAnnotated = annotatedPaperIds.includes(id);

    const text = `${paper.board} ${paper.subject} ${paper.variant || ""} ${
      paper.qualification || ""
    } ${paper.session || ""} ${paper.year || ""} ${paper.unit || ""}`.toLowerCase();

    return (
      text.includes(paperSearch.toLowerCase()) &&
      (selectedQualification === "All qualifications" ||
        paper.qualification === selectedQualification) &&
      (selectedUnit === "All units" || paper.unit === selectedUnit) &&
      (selectedYear === "All years" || String(paper.year) === String(selectedYear)) &&
      (selectedSession === "All sessions" || paper.session === selectedSession) &&
      (completionFilter === "All papers" ||
        (completionFilter === "Complete" && isCompleted) ||
        (completionFilter === "Incomplete" && !isCompleted)) &&
      (annotationFilter === "All markings" ||
        (annotationFilter === "Marked papers" && isAnnotated) ||
        (annotationFilter === "Unmarked papers" && !isAnnotated))
    );
  });
  const activePaperInsert = activePreview
    ? getPaperInsert(activePreview.paper, subject)
    : null;

    function requireLogin(action) {
    if (!user) {
        onRequireLogin();
        return;
    }

    action();
    }
  async function toggleCompleted(paper) {
    const id = paperId(paper);
    const exists = completedPaperIds.includes(id);

    const next = exists
      ? completedPaperIds.filter((item) => item !== id)
      : [...completedPaperIds, id];

    onCompletedPaperIdsChange(next);
    writeStorage("alevel-dojo-completed-papers", next);

    if (!user) return;

    if (exists) {
      await supabase
        .from("completed_papers")
        .delete()
        .eq("user_id", user.id)
        .eq("paper_id", id);
    } else {
      await supabase.from("completed_papers").insert({
        user_id: user.id,
        paper_id: id,
      });
      onAwardXP("complete_paper", 50, { key: `paper-${id}`, paperId: id, subject: paper.subject, board: paper.board });
    }
  }

  function toggleSaved(paper) {
    const id = paperId(paper);

    const next = savedPaperIds.includes(id)
      ? savedPaperIds.filter((item) => item !== id)
      : [...savedPaperIds, id];

    setSavedPaperIds(next);
    writeStorage("alevel-dojo-favourites", next);
  }

  async function loadSavedPaperAnnotations(id) {
    let savedPayload = null;

    if (user?.id && id) {
      const { data, error } = await supabase
        .from("pdf_annotations")
        .select("annotations")
        .eq("user_id", user.id)
        .eq("paper_id", id)
        .eq("pdf_type", "question")
        .maybeSingle();

      if (!error && data?.annotations) savedPayload = data.annotations;
    }

    if (!savedPayload) {
      try {
        const saved = localStorage.getItem(`pdf-editor-${id}-question`);
        savedPayload = saved ? JSON.parse(saved) : null;
      } catch {}
    }

    return annotationsFromPayload(savedPayload);
  }

  async function exportCompletedPaper(paper) {
    const id = paperId(paper);
    const fileUrl = paper.questionPaper || paper.questionUrl || paper.pdf;
    if (!fileUrl || exportingPaperId) return;

    setExportError("");
    setExportingPaperId(id);

    try {
      const savedAnnotations = await loadSavedPaperAnnotations(id);
      await exportAnnotatedPdf({
        fileUrl,
        annotations: savedAnnotations,
        fileName: paperExportFileName(paper),
      });
    } catch (error) {
      setExportError(error?.message || "Export failed. Please try again.");
    } finally {
      setExportingPaperId("");
    }
  }

  function clearFilters() {
    setPaperSearch("");
    setSelectedQualification("All qualifications");
    setSelectedUnit("All units");
    setSelectedYear("All years");
    setSelectedSession("All sessions");
    setCompletionFilter("All papers");
    setAnnotationFilter("All markings");
  }

  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">Past papers</h3>
          <p className="mt-1 text-sm text-white/40">
            {filteredPapers.length} of {subjectPastPapers.length} papers shown for{" "}
            {subject.name}.
          </p>
        </div>

        {activePreview && (
          <button
            onClick={() => {
              closePaperPreview();
            }}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/[0.08]"
          >
            Close preview
          </button>
        )}
      </div>

      {activePreview ? (
        <div
            className={
                maximizedPreview
                ? "fixed inset-3 z-[999998] overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
                : "rounded-3xl border border-white/10 bg-slate-950/70 p-4"
            }
            >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-cyan-200">
                {activePreview.mode === "edit" ? "PDF Editor" : "Preview"}
              </p>
              <h4 className="text-lg font-black text-white">
                {paperLabel(activePreview.paper)}
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {activePreview.paper.markScheme && (
                <button
                  onClick={() => setShowMarkScheme(!showMarkScheme)}
                  className="rounded-xl bg-white/[0.08] px-4 py-2 text-sm font-black text-white hover:bg-white/[0.12]"
                >
                  {showMarkScheme ? "Hide MS" : "Show MS"}
                </button>
              )}
              {activePaperInsert && (
                <button
                  onClick={toggleInsert}
                  className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                    showInsert
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                  }`}
                >
                  {showInsert ? "Hide Insert" : "Show Insert"}
                </button>
              )}
              {activePreview.mode === "edit" && isPdfPaper(activePreview.paper) && (
                <button
                  onClick={() => exportCompletedPaper(activePreview.paper)}
                  disabled={exportingPaperId === paperId(activePreview.paper)}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-70"
                >
                  {exportingPaperId === paperId(activePreview.paper) ? "Exporting..." : "Export PDF"}
                </button>
              )}
                <button
                    onClick={() => setMaximizedPreview(!maximizedPreview)}
                    className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
                >
                    {maximizedPreview ? "Minimize" : "Maximize"}
                </button>
              <button
                onClick={() => {
                  closePaperPreview();
                }}
                className="rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white"
              >
                Close
              </button>
            </div>
          </div>

          {exportError && (
            <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
              {exportError}
            </div>
          )}

            <div
            className={
                activePreview.mode === "edit"
                ? "flex justify-center gap-4 overflow-x-auto"
                : `grid gap-4 ${
                    (showMarkScheme && activePreview.paper.markScheme) ||
                    (showInsert && activePaperInsert)
                        ? "xl:grid-cols-2"
                        : ""
                    }`
            }
            >
            <div
                className={
                activePreview.mode === "edit"
                    ? maximizedPreview
                    ? "w-[1050px] shrink-0"
                    : "w-[720px] shrink-0"
                    : ""
                }
            >
                <p className="mb-2 text-sm font-black text-cyan-200">
                Question paper
                </p>

                {isPdfPaper(activePreview.paper) ? (
                  <PdfViewer
                    fileUrl={activePreview.paper.questionPaper || activePreview.paper.pdf}
                    editable={activePreview.mode === "edit"}
                    user={user}
                    paperId={paperId(activePreview.paper)}
                    pdfType="question"
                    exportFileName={paperExportFileName(activePreview.paper)}
                  />
                ) : (
                  <DocumentFrame
                    url={activePreview.paper.questionPaper || activePreview.paper.questionUrl || activePreview.paper.pdf}
                    title={paperLabel(activePreview.paper)}
                  />
                )}
            </div>

            {showMarkScheme && activePreview.paper.markScheme && (
                <div
                className={
                    activePreview.mode === "edit"
                    ? maximizedPreview
                        ? "w-[850px] shrink-0"
                        : "w-[560px] shrink-0"
                    : ""
                }
                >
                <p className="mb-2 text-sm font-black text-emerald-200">
                    Mark scheme
                </p>

                <DocumentFrame url={activePreview.paper.markScheme} title={`${paperLabel(activePreview.paper)} mark scheme`} />
                </div>
            )}
            {showInsert && activePaperInsert && (
                <div
                className={
                    activePreview.mode === "edit"
                    ? maximizedPreview
                        ? "w-[850px] shrink-0"
                        : "w-[560px] shrink-0"
                    : ""
                }
                >
                <p className="mb-2 text-sm font-black text-cyan-200">
                    {activePaperInsert.label}
                </p>

                <PdfViewer
                    fileUrl={activePaperInsert.url}
                    editable={false}
                />
                </div>
            )}
            </div>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <input
              value={paperSearch}
              onChange={(event) => setPaperSearch(event.target.value)}
              placeholder="Search papers by unit, year, month, variant..."
              className="mb-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
            />

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
              <select
                value={selectedQualification}
                onChange={(event) => setSelectedQualification(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                {availableQualifications.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={selectedUnit}
                onChange={(event) => setSelectedUnit(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                {availableUnits.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                {availableYears.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={selectedSession}
                onChange={(event) => setSelectedSession(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                {availableSessions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={completionFilter}
                onChange={(event) => setCompletionFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                <option>All papers</option>
                <option>Complete</option>
                <option>Incomplete</option>
              </select>

              <select
                value={annotationFilter}
                onChange={(event) => setAnnotationFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                <option>All markings</option>
                <option>Marked papers</option>
                <option>Unmarked papers</option>
              </select>

              <button
                onClick={clearFilters}
                className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
              >
                Clear
              </button>
            </div>
          </div>

          {exportError && (
            <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
              {exportError}
            </div>
          )}

          <div className="grid gap-3">
            {filteredPapers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-white/45">
                No past papers found for this search.
              </div>
            ) : (
              filteredPapers.map((paper) => {
                const id = paperId(paper);
                const isCompleted = completedPaperIds.includes(id);
                const isSaved = savedPaperIds.includes(id);
                const isAnnotated = annotatedPaperIds.includes(id);
                const paperInsert = getPaperInsert(paper, subject);

                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-white">
                            {paperCardTitle(paper, paper.unit)} - {paperSessionLabel(paper)}
                          </h4>

                          {isAnnotated && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-100">
                              <Edit3 size={11} />
                              Marked
                            </span>
                          )}

                          {paperInsert && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-violet-100">
                              <FileText size={11} />
                              {paperInsert.label}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-white/40">
                          {paper.board} • {paper.subject}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            requireLogin(() => {
                                toggleCompleted(paper);
                            })
                            }
                          className={`rounded-xl px-4 py-2 text-sm font-black ${
                            isCompleted
                              ? "bg-green-300 text-slate-950"
                              : "bg-white/[0.08] text-white/75 hover:bg-white/[0.12]"
                          }`}
                        >
                          {isCompleted ? "✓ Complete" : "Mark complete"}
                        </button>

                        <button
                          onClick={() =>
                            requireLogin(() => {
                                toggleSaved(paper);
                            })
                            }
                          className={`rounded-xl px-4 py-2 text-sm font-black ${
                            isSaved
                              ? "bg-yellow-300 text-slate-950"
                              : "bg-white/[0.08] text-white/75 hover:bg-white/[0.12]"
                          }`}
                        >
                          {isSaved ? "★ Saved" : "☆ Save"}
                        </button>
                        {isCompleted && isPdfPaper(paper) && (
                          <button
                            onClick={() =>
                              requireLogin(() => {
                                exportCompletedPaper(paper);
                              })
                            }
                            disabled={exportingPaperId === id}
                            className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-70"
                          >
                            {exportingPaperId === id ? "Exporting..." : "Export PDF"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                       onClick={() =>
  requireLogin(() => {
    if (isPdfPaper(paper)) {
      openPaperPreview(paper, "edit", false);
    } else {
      openPaperFile(paper);
    }
  })
}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-200"
                      >
                        {isPdfPaper(paper) ? <Edit3 size={16} /> : <Eye size={16} />}
                        {isPdfPaper(paper) ? "PDF Edit" : "View Paper"}
                      </button>

                      {paper.questionPaper && (
                        <button
                          onClick={() =>
                            requireLogin(() => {
                              window.open(paper.questionPaper, "_blank");
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"
                        >
                          <Download size={16} />
                          Download Q
                        </button>
                      )}

                      {paper.markScheme && (
                        <button
                          onClick={() =>
                            requireLogin(() => {
                                window.open(paper.markScheme, "_blank");
                            })
                            }
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"
                        >
                          <Download size={16} />
                          Download MS
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
function TopicTestsLandingPage({
  subjects = [],
  onOpenSubject = () => {},
  onOpenTopicTest = () => {},
}) {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All selected subjects");
  const [boardFilter, setBoardFilter] = useState("All boards");
  const [yearFilter, setYearFilter] = useState("All years");

  const subjectTestGroups = useMemo(
    () =>
      subjects.map((subject) => ({
        subject,
        tests: getSubjectTopicTests(subject),
      })),
    [subjects]
  );

  const allTopicTests = useMemo(
    () => subjectTestGroups.flatMap(({ tests }) => tests),
    [subjectTestGroups]
  );
  const availableBoards = ["All boards", ...unique(subjects.map((subject) => subject.board))];
  const availableYears = [
    "All years",
    ...sortYearsDescending(unique(allTopicTests.map((test) => test.year).filter(Boolean))).map(String),
  ];
  const hasYearFilter = availableYears.length > 1;

  function topicUnitLabel(test) {
    if (test.unit || test.paper) return test.unit || test.paper;
    const text = `${test.title || ""} ${test.topic || ""} ${test.qualification || ""}`.toLowerCase();
    const unitMatch = text.match(/\bunit\s*([1-9])\b/);
    if (unitMatch) return `Unit ${unitMatch[1]}`;
    const paperMatch = text.match(/\bpaper\s*([1-9])\b/);
    if (paperMatch) return `Paper ${paperMatch[1]}`;
    const pureMatch = text.match(/\bpure\s*([1-4])\b/);
    if (pureMatch) return `Pure ${pureMatch[1]}`;
    const statsMatch = text.match(/\bstatistics\s*([1-3])\b/);
    if (statsMatch) return `Statistics ${statsMatch[1]}`;
    const mechanicsMatch = text.match(/\bmechanics\s*([1-3])\b/);
    if (mechanicsMatch) return `Mechanics ${mechanicsMatch[1]}`;
    const decisionsMatch = text.match(/\bdecisions?\s*([12])\b/);
    if (decisionsMatch) return `Decisions ${decisionsMatch[1]}`;
    return test.qualification ? `${test.qualification} topic tests` : "Topic tests";
  }

  function topicCarouselId(subjectId, unit) {
    return `topic-test-carousel-${subjectId}-${String(unit)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;
  }

  function scrollTopicCarousel(id, direction) {
    const carousel = document.getElementById(id);
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * Math.min(carousel.clientWidth * 0.85, 620),
      behavior: "smooth",
    });
  }

  const filteredSubjects = subjectTestGroups.filter(({ subject }) => (
    (subjectFilter === "All selected subjects" || subject.id === subjectFilter) &&
    (boardFilter === "All boards" || subject.board === boardFilter)
  ));

  const subjectSections = filteredSubjects
    .map(({ subject, tests }) => {
      const filteredTests = tests.filter((test) => {
        const text = `${test.title || ""} ${test.topic || ""} ${test.subject || ""} ${test.board || ""} ${test.qualification || ""} ${topicUnitLabel(test)} ${test.year || ""}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (yearFilter === "All years" || String(test.year) === String(yearFilter))
        );
      });

      const groups = sortUnits(unique(filteredTests.map(topicUnitLabel))).map((unit) => {
        const unitTests = filteredTests.filter((test) => topicUnitLabel(test) === unit);
        return {
          unit,
          tests: unitTests.slice(0, 12),
          total: unitTests.length,
        };
      });

      return {
        subject,
        groups: groups.filter((group) => group.tests.length > 0),
        totalMatchingTests: filteredTests.length,
      };
    })
    .filter((section) => section.totalMatchingTests > 0);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">
              A-Level Dojo Practice
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">Topic Tests</h1>
            <p className="mt-2 text-sm text-white/52">
              Choose a subject and practise by paper or unit.
            </p>
          </div>

          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subjects, papers, units..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.045] py-3 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60"
            />
          </div>
        </div>

        <div className={`mt-5 grid gap-3 md:grid-cols-2 ${hasYearFilter ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option>All selected subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={boardFilter}
            onChange={(event) => setBoardFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            {availableBoards.map((board) => (
              <option key={board}>{board}</option>
            ))}
          </select>

          {hasYearFilter && (
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
            >
              {availableYears.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <section className="space-y-4">
        {subjects.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-white/48">
            No subjects selected yet. Go to settings to add subjects.
          </div>
        ) : allTopicTests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-white/48">
            <p className="font-black text-white/70">No topic tests added yet.</p>
            <p className="mt-2 text-sm">Add files to public/topic-tests to activate this page.</p>
          </div>
        ) : subjectSections.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-white/48">
            No topic tests found for this filter.
          </div>
        ) : (
          subjectSections.map(({ subject, groups, totalMatchingTests }) => {
            const visual = subjectVisuals[normalizeSubjectName(subject.name)] || defaultSubjectVisual;
            const Icon = visual.icon || Layers3;

            return (
              <article
                key={subject.id}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/15"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`hidden rounded-2xl border p-2.5 sm:inline-flex ${visual.soft}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">{subject.name}</h2>
                      <p className="mt-0.5 text-sm text-white/42">
                        {subject.board} · {totalMatchingTests} matching test{totalMatchingTests === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSubject(subject.id, "topictests")}
                    className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-300/15"
                  >
                    Go to subject
                  </button>
                </div>

                <div className="divide-y divide-white/10">
                  {groups.map((group) => {
                    const carouselKey = topicCarouselId(subject.id, group.unit);

                    return (
                      <div key={group.unit} className="py-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/58">
                            {group.unit}
                          </h3>
                          <div className="flex items-center gap-2">
                            {group.total > group.tests.length && (
                              <button
                                type="button"
                                onClick={() => onOpenSubject(subject.id, "topictests")}
                                className="text-xs font-black text-cyan-200 hover:text-cyan-100"
                              >
                                View all
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => scrollTopicCarousel(carouselKey, -1)}
                              aria-label={`Scroll ${group.unit} topic tests left`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollTopicCarousel(carouselKey, 1)}
                              aria-label={`Scroll ${group.unit} topic tests right`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
                            >
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        </div>

                        <div
                          id={carouselKey}
                          className="scrollbar-hidden flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pr-2"
                        >
                          {group.tests.map((test) => (
                            <article
                              key={paperId(test)}
                              className="relative flex min-h-[180px] w-[230px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055] hover:shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                            >
                              <Layers3
                                className="pointer-events-none absolute -right-2 top-3 text-cyan-200/[0.07]"
                                size={76}
                              />
                              <div className="relative z-10">
                                <div className={`mb-3 inline-flex rounded-2xl border p-3 ${visual.soft}`}>
                                  <Layers3 size={25} />
                                </div>
                                <p className="line-clamp-2 text-sm font-black text-white">
                                  {test.topic || test.title || group.unit}
                                </p>
                                <p className="mt-1 text-xs font-bold text-white/48">{group.unit}</p>
                                <p className="mt-0.5 truncate text-xs text-white/32">
                                  {test.subject} · {test.board}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenTopicTest(subject.id, test)}
                                className={`relative z-10 mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${visual.accent} px-3 py-2 text-xs font-black text-white shadow-lg ${visual.glow} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110`}
                              >
                                <Eye size={14} />
                                Start test
                              </button>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}

function TopicTestsPanel({
  subject,
  user,
  onRequireLogin,
  persistedPreview = null,
  onPreviewChange = () => {},
  onAwardXP = () => {},
}) {
  const [activePreview, setActivePreview] = useState(null);
  const [testSearch, setTestSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All topics");
  const [selectedQualification, setSelectedQualification] = useState("All qualifications");
  const [completionFilter, setCompletionFilter] = useState("All tests");

  const [completedTestIds, setCompletedTestIds] = useState(() =>
    readStorage("alevel-dojo-completed-topic-tests", [])
  );

  const [savedTestIds, setSavedTestIds] = useState(() =>
    readStorage("alevel-dojo-saved-topic-tests", [])
  );

  const subjectTopicTests = papers.filter(
    (paper) =>
      paper.type === "Topic Test" &&
      paper.board === subject.board &&
      paper.subject === subject.name
  );

  useEffect(() => {
    if (persistedPreview?.type !== "topicTest") return;

    const restoredPaper = subjectTopicTests.find(
      (paper) => paperId(paper) === persistedPreview.paperId
    );

    if (restoredPaper) {
      setActivePreview({
        paper: restoredPaper,
        mode: persistedPreview.mode || "preview",
      });
    }
  }, [persistedPreview?.paperId, persistedPreview?.type, subject.id]);

  function openTopicPreview(paper, mode) {
    setActivePreview({ paper, mode });
    onPreviewChange({
      type: "topicTest",
      paperId: paperId(paper),
      mode,
    });
  }

  function closeTopicPreview() {
    setActivePreview(null);
    onPreviewChange(null);
  }

  const availableTopics = [
    "All topics",
    ...unique(subjectTopicTests.map((paper) => paper.topic)),
  ];

  const availableQualifications = [
    "All qualifications",
    ...unique(subjectTopicTests.map((paper) => paper.qualification)),
  ];

  const filteredTests = subjectTopicTests.filter((paper) => {
    const id = paperId(paper);
    const isCompleted = completedTestIds.includes(id);

    const text = `${paper.board} ${paper.subject} ${paper.topic || ""} ${
      paper.title || ""
    } ${paper.qualification || ""} ${paper.variant || ""}`.toLowerCase();

    return (
      text.includes(testSearch.toLowerCase()) &&
      (selectedTopic === "All topics" || paper.topic === selectedTopic) &&
      (selectedQualification === "All qualifications" ||
        paper.qualification === selectedQualification) &&
      (completionFilter === "All tests" ||
        (completionFilter === "Complete" && isCompleted) ||
        (completionFilter === "Incomplete" && !isCompleted))
    );
  });
    function requireLogin(action) {
    if (!user) {
        onRequireLogin();
        return;
    }

    action();
    }
  function toggleCompleted(paper) {
    const id = paperId(paper);
    const alreadyCompleted = completedTestIds.includes(id);

    const next = alreadyCompleted
      ? completedTestIds.filter((item) => item !== id)
      : [...completedTestIds, id];

    setCompletedTestIds(next);
    writeStorage("alevel-dojo-completed-topic-tests", next);
    if (!alreadyCompleted) onAwardXP("complete_topic_test", 40, { key: `topic-test-${id}`, paperId: id, subject: paper.subject, board: paper.board });
  }

  function toggleSaved(paper) {
    const id = paperId(paper);

    const next = savedTestIds.includes(id)
      ? savedTestIds.filter((item) => item !== id)
      : [...savedTestIds, id];

    setSavedTestIds(next);
    writeStorage("alevel-dojo-saved-topic-tests", next);
  }

  function clearFilters() {
    setTestSearch("");
    setSelectedTopic("All topics");
    setSelectedQualification("All qualifications");
    setCompletionFilter("All tests");
  }

  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">Topic tests</h3>
          <p className="mt-1 text-sm text-white/40">
            {filteredTests.length} of {subjectTopicTests.length} topic tests shown for{" "}
            {subject.name}.
          </p>
        </div>

        {activePreview && (
          <button
            onClick={closeTopicPreview}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/[0.08]"
          >
            Close preview
          </button>
        )}
      </div>

      {activePreview ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-cyan-200">
                {activePreview.mode === "edit" ? "Topic Test Editor" : "Topic Test Preview"}
              </p>

              <h4 className="text-lg font-black text-white">
                {paperLabel(activePreview.paper)}
              </h4>
            </div>

            <button
              onClick={closeTopicPreview}
              className="rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white"
            >
              Close
            </button>
          </div>

          <PdfViewer
            fileUrl={
              activePreview.paper.pdf ||
              activePreview.paper.questionPaper ||
              activePreview.paper.markScheme
            }
            editable={activePreview.mode === "edit"}
            user={user}
            paperId={paperId(activePreview.paper)}
            pdfType="topic-test"
          />
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <input
              value={testSearch}
              onChange={(event) => setTestSearch(event.target.value)}
              placeholder="Search topic tests by topic, title, qualification..."
              className="mb-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                value={selectedTopic}
                onChange={(event) => setSelectedTopic(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                {availableTopics.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={selectedQualification}
                onChange={(event) => setSelectedQualification(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                {availableQualifications.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={completionFilter}
                onChange={(event) => setCompletionFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                <option>All tests</option>
                <option>Complete</option>
                <option>Incomplete</option>
              </select>

              <button
                onClick={clearFilters}
                className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredTests.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-white/45">
                No topic tests found for this search.
              </div>
            ) : (
              filteredTests.map((paper) => {
                const id = paperId(paper);
                const isCompleted = completedTestIds.includes(id);
                const isSaved = savedTestIds.includes(id);
                const fileUrl = paper.pdf || paper.questionPaper || paper.markScheme;

                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-white">
                          {paper.topic || paper.title || paperLabel(paper)}
                        </h4>

                        <p className="mt-1 text-sm text-white/40">
                          {paper.board} • {paper.subject}
                          {paper.qualification ? ` • ${paper.qualification}` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            requireLogin(() => {
                                toggleCompleted(paper);
                            })
                            }
                          className={`rounded-xl px-4 py-2 text-sm font-black ${
                            isCompleted
                              ? "bg-green-300 text-slate-950"
                              : "bg-white/[0.08] text-white/75 hover:bg-white/[0.12]"
                          }`}
                        >
                          {isCompleted ? "✓ Complete" : "Mark complete"}
                        </button>

                        <button
                          onClick={() =>
                            requireLogin(() => {
                                toggleSaved(paper);
                            })
                            }
                          className={`rounded-xl px-4 py-2 text-sm font-black ${
                            isSaved
                              ? "bg-yellow-300 text-slate-950"
                              : "bg-white/[0.08] text-white/75 hover:bg-white/[0.12]"
                          }`}
                        >
                          {isSaved ? "★ Saved" : "☆ Save"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          requireLogin(() => {
                            openTopicPreview(paper, "preview");
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                      >
                        <Eye size={16} />
                        Preview Topic Test
                      </button>

                      <button
                        onClick={() =>
                          requireLogin(() => {
                            openTopicPreview(paper, "edit");
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white hover:brightness-110"
                      >
                        <Edit3 size={16} />
                        PDF Edit
                      </button>

                      {fileUrl && (
                        <button
                          onClick={() =>
                            requireLogin(() => {
                              window.open(fileUrl, "_blank");
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
function MockModePanel({ subject, onAwardXP = () => {} }) {
  const [baseMinutes, setBaseMinutes] = useState(90);
  const [extraTime, setExtraTime] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(90 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionAwarded, setSessionAwarded] = useState(false);

  const totalSeconds = Math.max(1, Math.round(baseMinutes * (1 + extraTime / 100))) * 60;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0 && !finished) {
      setRunning(false);
      setFinished(true);
      window.alert("Time is up. Save your answers and review the mark scheme.");
    }
  }, [running, secondsLeft, finished]);

  function applySettings() {
    setSecondsLeft(totalSeconds);
    setRunning(false);
    setFinished(false);
  }

  function resetTimer() {
    setSecondsLeft(totalSeconds);
    setRunning(false);
    setFinished(false);
    setSessionAwarded(false);
  }

  function startTimer() {
    setRunning(true);
    if (!sessionAwarded) {
      const key = `mock-${subject.id}-${new Date().toISOString().slice(0, 10)}-${baseMinutes}-${extraTime}`;
      onAwardXP("mock_timer_session", 25, { key, subject: subject.name, board: subject.board });
      setSessionAwarded(true);
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Mock mode</p>
          <h3 className="mt-2 text-2xl font-black text-white">{subject.name} timed practice</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
            Set a paper-length timer, add extra time if needed, then practise without leaving your subject workspace.
          </p>
        </div>
        <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/10 px-6 py-4 text-center">
          <p className="font-mono text-5xl font-black text-cyan-50">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-100/60">
            {running ? "Running" : finished ? "Finished" : "Ready"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Minutes</span>
          <input
            type="number"
            min="1"
            value={baseMinutes}
            onChange={(event) => setBaseMinutes(Number(event.target.value) || 1)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-300"
          />
        </label>
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Extra time</span>
          <select
            value={extraTime}
            onChange={(event) => setExtraTime(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-300"
          >
            <option value={0}>0%</option>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
          </select>
        </label>
        <button onClick={applySettings} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]">
          Apply
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={startTimer} className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition-all duration-200 ease-out hover:-translate-y-0.5">
          Start
        </button>
        <button onClick={() => setRunning(false)} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]">
          Pause
        </button>
        <button onClick={resetTimer} className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition-all duration-200 ease-out hover:-translate-y-0.5">
          Reset
        </button>
      </div>
    </section>
  );
}

function SubjectPagePreview({
  subject,
  onBack,
  user,
  onRequireLogin,
  onOpenPricing,
  initialSection = "overview",
  persistedPreview = null,
  onPreviewChange = () => {},
  onSectionChange = () => {},
  completedPaperIds = [],
  onCompletedPaperIdsChange = () => {},
  onAwardXP = () => {},
}) {
  const [section, setSection] = useState(initialSection);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection, subject.id]);

  function changeSection(nextSection) {
    setSection(nextSection);
    onSectionChange(nextSection);
  }

  const cards = [
    [FileText, "Past papers", "Question papers, mark schemes, PDF edit, downloads", "pastpapers"],
    [FileText, "Topic tests", "Topic-based practice papers and combined Q/MS files", "topictests"],
    [LibraryBig, "Syllabus", "Official syllabus and topic checklist", "syllabus"],
    [BookOpen, "Notes", "Chapter summaries and exam technique", "notes"],
    [Layers3, "Flashcards", "Pre-made and custom revision cards", "flashcards"],
    [Timer, "Mock mode", "Timed exam practice", "mock"],
    [Brain, "AI tutor", "Quiz, explain, visualize, combine topics", "ai"],
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 hover:bg-white/[0.08]"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${
                boardColors[subject.board].chip
              }`}
            >
              {subject.board}
            </span>

            <h2 className="mt-4 text-3xl font-black text-white">
              {subject.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
              Open past papers, syllabus, notes, flashcards, mock mode, and AI tutor
              tools for this subject.
            </p>
          </div>

          <button
            onClick={() => changeSection("pastpapers")}
            className={`rounded-2xl px-5 py-3 text-sm font-black ${
              boardColors[subject.board].button
            }`}
          >
            Open past papers
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {cards.map(([Icon, title, text, id]) => (
          <button
            key={id}
            onClick={() => changeSection(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
              section === id
                ? "bg-cyan-300 text-slate-950"
                : "border border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08]"
            }`}
          >
            <Icon size={16} />
            {title}
          </button>
        ))}
      </div>

      {section === "pastpapers" ? (
        <PastPapersPanel
            subject={subject}
            user={user}
            onRequireLogin={onRequireLogin}
            persistedPreview={persistedPreview}
            onPreviewChange={onPreviewChange}
            completedPaperIds={completedPaperIds}
            onCompletedPaperIdsChange={onCompletedPaperIdsChange}
            onAwardXP={onAwardXP}
            />
        ) : section === "topictests" ? (
        <TopicTestsPanel
            subject={subject}
            user={user}
            onRequireLogin={onRequireLogin}
            persistedPreview={persistedPreview}
            onPreviewChange={onPreviewChange}
            onAwardXP={onAwardXP}
            />
        ) : section === "mock" ? (
          <MockModePanel subject={subject} onAwardXP={onAwardXP} />
        ) : section === "ai" ? (
          <AiTutorPanel onUpgrade={onOpenPricing} />
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([Icon, title, text, id]) => (
            <button
              key={id}
              onClick={() => changeSection(id)}
              className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              <div className="mb-4 inline-flex rounded-xl bg-white/[0.06] p-3 text-cyan-200">
                <Icon size={21} />
              </div>

              <h3 className="text-lg font-black text-white">{title}</h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                {text}
              </p>
            </button>
          ))}
        </div>
      )}

      {section !== "overview" && section !== "pastpapers" && section !== "topictests" && section !== "mock" && section !== "ai" && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-6">
          <h3 className="text-xl font-black text-white">
            {cards.find((card) => card[3] === section)?.[1]}
          </h3>

          <p className="mt-2 text-sm leading-7 text-white/45">
            This section will be built later. For now, the past papers section
            is connected to your real papers.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  user,
  profile = null,
  onSaveProfile = async () => {},
  onRequireLogin = () => {},
  onOpenPricing = () => {},
  onGoHome = () => {},
}) {
  const subjects = allSubjects();
  const [persistedDashboardState, setPersistedDashboardState] = usePersistentState(
    "alevel-dojo-dashboard-state",
    defaultDashboardState
  );
  const [selectedIds, setSelectedIds] = useState(() =>
    profileSubjectsToIds(profile?.subjects || profile?.selected_subjects || [], subjects)
  );
  const [draftSelectedIds, setDraftSelectedIds] = useState(() =>
    profileSubjectsToIds(profile?.subjects || profile?.selected_subjects || [], subjects)
  );
  const [dashboardProfile, setDashboardProfile] = useState(profile);
  const [loadingSubjects, setLoadingSubjects] = useState(Boolean(user && !profile));
  const [sidebarPinnedOpen, setSidebarPinnedOpen] = useState(() =>
    readBooleanStorage("aleveldojo_sidebar_pinned_open", true)
  );
  const [sidebarPreviewOpen, setSidebarPreviewOpen] = useState(false);
  const [activeView, setActiveView] = useState(persistedDashboardState.activeView || "dashboard");
  const [activeSubjectId, setActiveSubjectId] = useState(persistedDashboardState.activeSubjectId || null);
  const [subjectSection, setSubjectSection] = useState(persistedDashboardState.subjectSection || "overview");
  const [profileOpen, setProfileOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [allExamsCalendarOpen, setAllExamsCalendarOpen] = useState(false);
  const [openedResource, setOpenedResource] = useState({
    openedPaper: persistedDashboardState.openedPaper || null,
    openedTopicTest: persistedDashboardState.openedTopicTest || null,
  });
  const [completedPaperIds, setCompletedPaperIds] = useState(() =>
    readStorage("alevel-dojo-completed-papers", [])
  );
  const [mistakes, setMistakes] = useState(() => readStorage("alevel-dojo-mistakes", []));
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [xpEvents, setXpEvents] = useState([]);
  const [xpEventsLoaded, setXpEventsLoaded] = useState(false);
  const [xpMenuOpen, setXpMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [dashboardSearchOpen, setDashboardSearchOpen] = useState(false);
  const xpMenuCloseTimeout = useRef(null);
  const notificationMenuCloseTimeout = useRef(null);
  const profileMenuCloseTimeout = useRef(null);

  useEffect(() => {
    async function loadDashboardProfile() {
      if (!user) {
        const ids = profileSubjectsToIds(profile?.subjects || profile?.selected_subjects || [], subjects);
        setDashboardProfile(profile);
        setSelectedIds(ids);
        setDraftSelectedIds(ids);
        setLoadingSubjects(false);
        return;
      }

      if (profile) {
        const ids = profileSubjectsToIds(profile.subjects || profile.selected_subjects || [], subjects);
        setDashboardProfile(profile);
        setSelectedIds(ids);
        setDraftSelectedIds(ids);
        setLoadingSubjects(false);
        return;
      }

      setLoadingSubjects(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setLoadingSubjects(false);
        return;
      }

      const ids = profileSubjectsToIds(data?.subjects || data?.selected_subjects || [], subjects);
      setDashboardProfile(data);
      setSelectedIds(ids);
      setDraftSelectedIds(ids);
      setLoadingSubjects(false);
    }

    loadDashboardProfile();
  }, [user, profile]);

  useEffect(() => {
    writeStorage("alevel-dojo-mistakes", mistakes);
  }, [mistakes]);

  useEffect(() => {
    async function loadCompletedPaperIds() {
      if (!user) return;

      const { data, error } = await supabase
        .from("completed_papers")
        .select("paper_id")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      const ids = data?.map((item) => item.paper_id).filter(Boolean) || [];
      setCompletedPaperIds(ids);
      writeStorage("alevel-dojo-completed-papers", ids);
    }

    loadCompletedPaperIds();
  }, [user]);

  useEffect(() => {
    writeStorage("alevel-dojo-completed-papers", completedPaperIds);
  }, [completedPaperIds]);

  useEffect(() => {
    writeStorage("aleveldojo_sidebar_pinned_open", sidebarPinnedOpen);
    if (sidebarPinnedOpen) setSidebarPreviewOpen(false);
  }, [sidebarPinnedOpen]);

  useEffect(() => {
    async function loadCalendarEvents() {
      if (!user) {
        setCalendarEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) {
        console.error(error);
        setCalendarEvents([]);
        return;
      }

      setCalendarEvents(data || []);
    }

    loadCalendarEvents();
  }, [user]);

  useEffect(() => {
    async function loadXpEvents() {
      if (!user) {
        setXpEvents([]);
        setXpEventsLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from("xp_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setXpEvents([]);
        setXpEventsLoaded(true);
        return;
      }

      setXpEvents(data || []);
      setXpEventsLoaded(true);
    }

    setXpEventsLoaded(false);
    loadXpEvents();
  }, [user]);

  const subjectsWithProgress = subjects.map((subject) => ({
    ...subject,
    progress: getSubjectProgress(subject, completedPaperIds),
    completedCount: getCompletedCountForSubject(subject, completedPaperIds),
    totalPapers: getSubjectPapers(subject).length,
  }));
  const activeSubjects = subjectsWithProgress.filter((subject) => selectedIds.includes(subject.id));
  const activeSubject = subjectsWithProgress.find((subject) => subject.id === activeSubjectId) || null;
  const dashboardSearchTerm = dashboardSearch.trim().toLowerCase();
  const dashboardFeatureResults = [
    { label: "Home", detail: "Overview", action: () => selectView("dashboard"), keywords: "dashboard home overview" },
    { label: "Past papers", detail: "Browse papers", action: () => selectView("pastpapers"), keywords: "paper exam pdf" },
    { label: "Topic tests", detail: "Topic practice", action: () => selectView("topictests"), keywords: "topic test practice" },
    { label: "Exam calendar", detail: "Upcoming exams", action: () => selectView("calendar"), keywords: "calendar timetable dates" },
    { label: "Mistakes tracker", detail: "Review mistakes", action: () => selectView("mistakes"), keywords: "mistakes review wrong fixed" },
    { label: "Grade boundaries", detail: "Boundary trends", action: () => selectView("boundaries"), keywords: "grades marks boundary graph" },
    { label: "AI tutor", detail: "Premium tutor", action: () => selectView("ai"), keywords: "ai tutor study partner" },
    { label: "Profile", detail: "Account profile", action: () => setProfileOpen(true), keywords: "account user avatar" },
    { label: "Settings", detail: "Preferences and subjects", action: () => selectView("settings"), keywords: "preferences profile subjects grades" },
  ].filter((item) => {
    if (!dashboardSearchTerm) return false;
    return `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(dashboardSearchTerm);
  });
  const dashboardSubjectResults = activeSubjects.filter((subject) => {
    if (!dashboardSearchTerm) return false;
    return `${subject.name} ${subject.board}`.toLowerCase().includes(dashboardSearchTerm);
  });

  useEffect(() => {
    if (activeSubjectId && !subjects.some((subject) => subject.id === activeSubjectId)) {
      setActiveSubjectId(null);
      setSubjectSection("overview");
      setActiveView("dashboard");
    }
  }, [activeSubjectId, subjects]);

  useEffect(() => {
    setPersistedDashboardState({
      activeView,
      activeSubjectId,
      subjectSection,
      selectedBoard: activeSubject?.board || null,
      openedPaper: openedResource.openedPaper,
      openedTopicTest: openedResource.openedTopicTest,
    });
  }, [
    activeView,
    activeSubjectId,
    subjectSection,
    activeSubject?.board,
    openedResource.openedPaper,
    openedResource.openedTopicTest,
    setPersistedDashboardState,
  ]);

  const stats = {
    completedCount:
      completedPaperIds.length +
      readStorage("alevel-dojo-completed-topic-tests", []).length,
    remainingPapers: Math.max(
      0,
      activeSubjects.reduce((total, subject) => total + subject.totalPapers, 0) -
        activeSubjects.reduce((total, subject) => total + subject.completedCount, 0)
    ),
    savedCount:
      readStorage("alevel-dojo-favourites", []).length +
      readStorage("alevel-dojo-saved-topic-tests", []).length,
    mistakesOpen: mistakes.filter((mistake) => !mistake.fixed).length,
  };
  const currentXp = Number(dashboardProfile?.xp || 0);
  const currentStreak = Number(dashboardProfile?.streak_count || 0);
  const dashboardDisplayName =
    dashboardProfile?.full_name ||
    dashboardProfile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";
  const dashboardGreeting = getDashboardGreeting(dashboardDisplayName);
  const achievementContext = achievementStats({
    completedPaperIds,
    mistakes,
    calendarEvents,
    xpEvents,
    streak: currentStreak,
  });
  const achievements = getAchievements(achievementContext, currentXp);

  const cambridgeZone = dashboardProfile?.cambridge_zone || dashboardProfile?.exam_zone || "";
  const hasCambridgeSubjects = activeSubjects.some((subject) => subject.board === "Cambridge");
  const needsCambridgeZone = hasCambridgeSubjects && !cambridgeZone;
  const upcomingExams = getUpcomingSelectedExams({
    officialExams: examDates,
    manualExams: calendarEvents,
    selectedSubjects: activeSubjects,
    cambridgeZone,
  });
  const sidebarVisible = sidebarPinnedOpen || sidebarPreviewOpen;
  const sidebarAffectsLayout = sidebarPinnedOpen;
  const allCalendarEvents = [
    ...examDates.map(toOfficialCalendarEvent),
    ...calendarEvents.map(toUserCalendarEvent),
  ].sort((a, b) => examStartTime(a) - examStartTime(b));

  async function awardXP(action, amount, metadata = {}) {
    if (!user || !amount) return false;
    const duplicateKey = metadata.key || metadata.paperId || metadata.id || null;
    const existing = duplicateKey
      ? xpEvents.some((event) => event.action === action && event.metadata?.key === duplicateKey)
      : false;
    if (existing) return false;

    const { data: latestProfile } = await supabase
      .from("profiles")
      .select("xp, streak_count")
      .eq("id", user.id)
      .maybeSingle();
    const latestXp = Number(latestProfile?.xp ?? currentXp);
    const latestStreak = Number(latestProfile?.streak_count ?? currentStreak);
    const nextXp = latestXp + amount;
    const rank = getRankFromXP(nextXp);
    const eventPayload = {
      user_id: user.id,
      action,
      amount,
      metadata: { ...metadata, key: duplicateKey },
    };

    const { data: xpEvent, error: eventError } = await supabase
      .from("xp_events")
      .insert(eventPayload)
      .select()
      .single();

    if (eventError) {
      console.error(eventError);
      return false;
    }

    const profilePatch = {
      xp: nextXp,
      rank_name: rank.name,
      updated_at: new Date().toISOString(),
    };

    if (action === "daily_activity") {
      profilePatch.streak_count = Math.max(1, latestStreak + 1);
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", user.id)
      .select()
      .single();

    if (profileError) {
      console.error(profileError);
      setDashboardProfile((current) => ({ ...(current || {}), ...profilePatch }));
    } else {
      setDashboardProfile(updatedProfile);
    }

    setXpEvents((current) => [xpEvent, ...current]);
    return true;
  }

  useEffect(() => {
    if (!user || !xpEventsLoaded) return;
    async function awardDailyActivity() {
      const todayKey = `daily-${new Date().toISOString().slice(0, 10)}`;
      await awardXP("daily_activity", 10, { key: todayKey });
      const nextStreak = currentStreak + 1;
      if (nextStreak >= 3) await awardXP("streak_bonus_3", 30, { key: "streak-3" });
      if (nextStreak >= 7) await awardXP("streak_bonus_7", 100, { key: "streak-7" });
    }
    awardDailyActivity();
  }, [user, xpEventsLoaded]);

  async function saveCalendarEvent(event) {
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: event.title,
      event_type: event.event_type,
      subject: event.subject,
      board: event.board,
      paper: event.paper || null,
      event_date: event.event_date,
      event_time: event.event_time || null,
      duration: event.duration || null,
      notes: event.notes || null,
      color: event.color || defaultEventColorByType[event.event_type] || "cyan",
    };

    async function persistEvent(nextPayload) {
      return event.id
        ? supabase
            .from("calendar_events")
            .update(nextPayload)
            .eq("id", event.id)
            .eq("user_id", user.id)
            .select()
            .single()
        : supabase
            .from("calendar_events")
            .insert(nextPayload)
            .select()
            .single();
    }

    let { data, error } = await persistEvent(payload);

    if (error && (error.message?.includes("color") || error.details?.includes("color"))) {
      const { color, ...payloadWithoutColor } = payload;
      const retry = await persistEvent(payloadWithoutColor);
      data = retry.data;
      error = retry.error;

      if (!error) {
        data = data ? { ...data, color: payload.color } : data;
        console.warn("Saved calendar event without color because Supabase schema cache did not expose calendar_events.color yet.");
      }
    }

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setCalendarEvents((current) => {
      const withoutExisting = current.filter((item) => item.id !== data.id);
      return [...withoutExisting, data].sort((a, b) => examStartTime(toUserCalendarEvent(a)) - examStartTime(toUserCalendarEvent(b)));
    });

    if (!event.id) {
      awardXP("add_calendar_event", 10, { key: `calendar-event-${data.id}`, id: data.id, event_type: data.event_type });
    }
  }

  async function deleteCalendarEvent(event) {
    if (!user || !event?.id) return;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", event.id)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setCalendarEvents((current) => current.filter((item) => item.id !== event.id));
  }

  function handlePreviewChange(resource) {
    if (!resource) {
      setOpenedResource({ openedPaper: null, openedTopicTest: null });
      return;
    }

    if (resource.type === "pastPaper") {
      setOpenedResource({ openedPaper: resource, openedTopicTest: null });
      setSubjectSection("pastpapers");
      return;
    }

    if (resource.type === "topicTest") {
      setOpenedResource({ openedPaper: null, openedTopicTest: resource });
      setSubjectSection("topictests");
    }
  }

  function handleSubjectSectionChange(nextSection) {
    setSubjectSection(nextSection);
    setActiveView(nextSection === "topictests" ? "topictests" : nextSection === "pastpapers" ? "pastpapers" : "subject");

    if (nextSection !== "pastpapers" && nextSection !== "topictests") {
      setOpenedResource({ openedPaper: null, openedTopicTest: null });
    }
  }

  function toggleDraftSubject(id) {
    setDraftSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function saveSubjectChoices() {
    setSelectedIds(draftSelectedIds);
  }

  async function saveDashboardProfile(nextProfile) {
    await onSaveProfile(nextProfile);
    setDashboardProfile((current) => ({ ...(current || {}), ...nextProfile }));
    const ids = profileSubjectsToIds(nextProfile.subjects || nextProfile.selected_subjects || [], subjects);
    setSelectedIds(ids);
    setDraftSelectedIds(ids);
  }

  function openSubjectPicker() {
    setDraftSelectedIds(selectedIds);
    setSubjectPickerOpen(true);
  }

  async function saveSubjectsFromPicker(nextIds) {
    const nextSubjects = subjects
      .filter((subject) => nextIds.includes(subject.id))
      .map((subject) => ({ board: subject.board, subject: subject.name }));
    const hasCambridgeSubject = nextSubjects.some((subject) => subject.board === "Cambridge");
    const nextProfile = {
      ...(dashboardProfile || profile || {}),
      subjects: nextSubjects,
      selected_subjects: nextSubjects,
      cambridge_zone: hasCambridgeSubject
        ? dashboardProfile?.cambridge_zone || dashboardProfile?.exam_zone || profile?.cambridge_zone || profile?.exam_zone || null
        : null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    await saveDashboardProfile(nextProfile);

    if (activeSubjectId && !nextIds.includes(activeSubjectId)) {
      setActiveSubjectId(null);
      setSubjectSection("overview");
      setActiveView("dashboard");
      setOpenedResource({ openedPaper: null, openedTopicTest: null });
    }
  }

  function openSubject(id, section = "overview") {
    setActiveSubjectId(id);
    setSubjectSection(section);
    setActiveView(section === "topictests" ? "topictests" : section === "pastpapers" ? "pastpapers" : "subject");
  }

  function openPaperFromLanding(subjectId, paper) {
    if (!subjectId || !paper) return;
    setActiveSubjectId(subjectId);
    setSubjectSection("pastpapers");
    setActiveView("pastpapers");
    setOpenedResource({
      openedPaper: {
        type: "pastPaper",
        paperId: paperId(paper),
        mode: "edit",
        showMarkScheme: false,
        showInsert: false,
      },
      openedTopicTest: null,
    });
  }

  function openTopicTestFromLanding(subjectId, test) {
    if (!subjectId || !test) return;
    setActiveSubjectId(subjectId);
    setSubjectSection("topictests");
    setActiveView("topictests");
    setOpenedResource({
      openedPaper: null,
      openedTopicTest: {
        type: "topicTest",
        paperId: paperId(test),
        mode: "preview",
      },
    });
  }

  function selectView(view) {
    setActiveSubjectId(null);
    setActiveView(view);
    setOpenedResource({ openedPaper: null, openedTopicTest: null });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfileOpen(false);
  }

  function openProfileMenu() {
    if (profileMenuCloseTimeout.current) {
      window.clearTimeout(profileMenuCloseTimeout.current);
    }
    setProfileMenuOpen(true);
    setXpMenuOpen(false);
    setNotificationMenuOpen(false);
  }

  function closeProfileMenuSoon() {
    if (profileMenuCloseTimeout.current) {
      window.clearTimeout(profileMenuCloseTimeout.current);
    }
    profileMenuCloseTimeout.current = window.setTimeout(() => {
      setProfileMenuOpen(false);
    }, 180);
  }

  function openXpMenu() {
    if (xpMenuCloseTimeout.current) {
      window.clearTimeout(xpMenuCloseTimeout.current);
    }
    setXpMenuOpen(true);
    setNotificationMenuOpen(false);
    setProfileMenuOpen(false);
  }

  function closeXpMenuSoon() {
    if (xpMenuCloseTimeout.current) {
      window.clearTimeout(xpMenuCloseTimeout.current);
    }
    xpMenuCloseTimeout.current = window.setTimeout(() => {
      setXpMenuOpen(false);
    }, 180);
  }

  function openNotificationMenu() {
    if (notificationMenuCloseTimeout.current) {
      window.clearTimeout(notificationMenuCloseTimeout.current);
    }
    setNotificationMenuOpen(true);
    setXpMenuOpen(false);
    setProfileMenuOpen(false);
  }

  function closeNotificationMenuSoon() {
    if (notificationMenuCloseTimeout.current) {
      window.clearTimeout(notificationMenuCloseTimeout.current);
    }
    notificationMenuCloseTimeout.current = window.setTimeout(() => {
      setNotificationMenuOpen(false);
    }, 180);
  }

  function toggleSidebarPinnedOpen() {
    setSidebarPinnedOpen((current) => {
      const next = !current;
      if (next) setSidebarPreviewOpen(false);
      return next;
    });
  }

  if (loadingSubjects) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060816] text-white">
        <Watermark />
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">A-Level Dojo</p>
          <p className="mt-3 text-white/55">Loading Home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,92,82,0.11),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(124,58,237,0.14),transparent_28%),radial-gradient(circle_at_72%_86%,rgba(34,211,238,0.06),transparent_24%)]" />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        profile={dashboardProfile}
        subjects={activeSubjects}
        stats={stats}
        mistakes={mistakes}
        achievements={achievements}
        xp={currentXp}
        streak={currentStreak}
        onLogout={handleLogout}
      />
      <AllExamsCalendarModal
        open={allExamsCalendarOpen}
        onClose={() => setAllExamsCalendarOpen(false)}
        exams={allCalendarEvents}
        subjects={activeSubjects}
        onSaveEvent={saveCalendarEvent}
        onDeleteEvent={deleteCalendarEvent}
      />

      <div className="relative z-10 min-h-screen">
        {!sidebarPinnedOpen && (
          <div
            className="fixed left-0 top-0 z-[90] hidden h-screen w-3 lg:block"
            onMouseEnter={() => setSidebarPreviewOpen(true)}
            aria-hidden="true"
          />
        )}

        <DashboardShellSidebar
          open={sidebarVisible}
          onOpen={() => {
            if (!sidebarPinnedOpen) setSidebarPreviewOpen(true);
          }}
          onClose={() => {
            if (!sidebarPinnedOpen) setSidebarPreviewOpen(false);
          }}
          onTogglePinned={toggleSidebarPinnedOpen}
          activeView={activeView}
          onSelectView={selectView}
          activeSubjects={activeSubjects}
          onOpenSubject={openSubject}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSettings={() => selectView("settings")}
          onOpenPricing={onOpenPricing}
          onGoHome={onGoHome}
          user={user}
          profile={dashboardProfile}
          xp={currentXp}
        />

        <main className={`${sidebarAffectsLayout ? "lg:ml-[230px]" : "lg:ml-0"} px-5 pb-5 pt-20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-8 lg:px-10`}>
          <div className="mb-4 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-3 lg:hidden">
            <Logo onGoHome={onGoHome} />
            <select
              value={activeView}
              onChange={(event) => selectView(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none"
            >
              <option value="dashboard">Home</option>
              <option value="pastpapers">Past papers</option>
              <option value="topictests">Topic tests</option>
              <option value="calendar">Exam calendar</option>
              <option value="mistakes">Mistakes tracker</option>
              <option value="boundaries">Grade boundaries</option>
              <option value="ai">AI tutor</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <header className={`fixed right-0 top-0 z-[70] flex items-center justify-between gap-3 overflow-visible border-b border-white/[0.08] bg-[#0b1020]/92 px-5 py-2 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-8 lg:px-10 ${
            sidebarAffectsLayout ? "left-0 lg:left-[230px]" : "left-0"
          }`}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {!sidebarVisible && (
                <button
                  type="button"
                  onClick={toggleSidebarPinnedOpen}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                  title="Show sidebar"
                  aria-label="Show sidebar"
                >
                  <PanelLeft size={20} strokeWidth={2.2} />
                </button>
              )}
              <div className="relative z-[9999] min-w-0 flex-1 md:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/35" size={18} />
                <input
                  value={dashboardSearch}
                  onChange={(event) => {
                    setDashboardSearch(event.target.value);
                    setDashboardSearchOpen(true);
                  }}
                  onFocus={() => setDashboardSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setDashboardSearchOpen(false), 140)}
                  placeholder="Search subjects, features, papers..."
                  className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.045] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/32 transition-all duration-200 ease-out focus:border-cyan-300/40 focus:bg-white/[0.065] focus:ring-2 focus:ring-cyan-300/10"
                />
                {dashboardSearchOpen && dashboardSearchTerm && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-[9999] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]/98 p-2 text-white shadow-2xl shadow-black/35 backdrop-blur-xl">
                    {dashboardFeatureResults.length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/60">Features</p>
                        <div className="grid gap-1">
                          {dashboardFeatureResults.map((item) => (
                            <button
                              type="button"
                              key={item.label}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                item.action();
                                setDashboardSearch("");
                                setDashboardSearchOpen(false);
                              }}
                              className="rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ease-out hover:bg-cyan-300/10"
                            >
                              <p className="text-sm font-black text-white">{item.label}</p>
                              <p className="mt-0.5 text-xs font-bold text-white/38">{item.detail}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {dashboardSubjectResults.length > 0 && (
                      <div className={dashboardFeatureResults.length > 0 ? "mt-2 border-t border-white/10 pt-2" : ""}>
                        <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200/60">Subjects</p>
                        <div className="grid gap-1">
                          {dashboardSubjectResults.map((subject) => (
                            <button
                              type="button"
                              key={subject.id}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openSubject(subject.id);
                                setDashboardSearch("");
                                setDashboardSearchOpen(false);
                              }}
                              className="rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ease-out hover:bg-cyan-300/10"
                            >
                              <p className="text-sm font-black text-white">{subject.name}</p>
                              <p className="mt-0.5 text-xs font-bold text-cyan-100/55">{subject.board}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {dashboardFeatureResults.length === 0 && dashboardSubjectResults.length === 0 && (
                      <p className="px-3 py-4 text-sm font-bold text-white/42">No matching Home results.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-[9999] flex shrink-0 items-center gap-3 overflow-visible">
              <div
                className="relative z-[9999]"
                onMouseEnter={openXpMenu}
                onMouseLeave={closeXpMenuSoon}
              >
                <XPBadge
                  xp={currentXp}
                  streak={currentStreak}
                  open={xpMenuOpen}
                  onToggle={() => {
                    setXpMenuOpen((current) => !current);
                    setNotificationMenuOpen(false);
                    setProfileMenuOpen(false);
                  }}
                />
              </div>
              <div
                className="relative z-[9999]"
                onMouseEnter={openNotificationMenu}
                onMouseLeave={closeNotificationMenuSoon}
              >
                <button
                  type="button"
                  onClick={() => {
                    setNotificationMenuOpen((current) => !current);
                    setXpMenuOpen(false);
                    setProfileMenuOpen(false);
                  }}
                  onFocus={openNotificationMenu}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-cyan-100"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {upcomingExams.length > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-lg shadow-rose-400/30" />
                  )}
                </button>
                <NotificationDropdown
                  open={notificationMenuOpen}
                  notifications={[]}
                />
              </div>
              <div
                className="relative z-[9999]"
                onMouseEnter={openProfileMenu}
                onMouseLeave={closeProfileMenuSoon}
              >
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen((current) => !current);
                    setXpMenuOpen(false);
                    setNotificationMenuOpen(false);
                  }}
                  onFocus={openProfileMenu}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-black text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.07]"
                >
                  <AvatarCircle profile={dashboardProfile} user={user} size="h-7 w-7" />
                  Profile
                </button>
                <ProfileDropdown
                  open={profileMenuOpen}
                  user={user}
                  profile={dashboardProfile}
                  subjects={activeSubjects}
                  xp={currentXp}
                  streak={currentStreak}
                  achievements={achievements}
                  onOpenProfile={() => {
                    setProfileOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  onOpenSettings={() => {
                    selectView("settings");
                    setProfileMenuOpen(false);
                  }}
                  onOpenPricing={onOpenPricing}
                  onOpenSaved={() => {
                    selectView("pastpapers");
                    setProfileMenuOpen(false);
                  }}
                  onOpenSubjects={() => {
                    setActiveView("dashboard");
                    setProfileMenuOpen(false);
                  }}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          {activeSubject ? (
            <SubjectPagePreview
              subject={activeSubject}
              onBack={() => {
                setActiveSubjectId(null);
                setSubjectSection("overview");
                setActiveView("dashboard");
                setOpenedResource({ openedPaper: null, openedTopicTest: null });
              }}
              user={user}
              onRequireLogin={onRequireLogin}
              onOpenPricing={onOpenPricing}
              initialSection={subjectSection}
              persistedPreview={
                subjectSection === "topictests"
                  ? openedResource.openedTopicTest
                  : openedResource.openedPaper
              }
              onPreviewChange={handlePreviewChange}
              onSectionChange={handleSubjectSectionChange}
              completedPaperIds={completedPaperIds}
              onCompletedPaperIdsChange={setCompletedPaperIds}
              onAwardXP={awardXP}
            />
          ) : activeView === "calendar" ? (
            <ExamCalendarPanel
              exams={upcomingExams}
              subjects={activeSubjects}
              onSaveEvent={saveCalendarEvent}
              onDeleteEvent={deleteCalendarEvent}
              needsCambridgeZone={needsCambridgeZone}
              onOpenAllExams={() => setAllExamsCalendarOpen(true)}
            />
          ) : activeView === "pastpapers" ? (
            <PastPapersLandingPage
              subjects={activeSubjects}
              user={user}
              completedPaperIds={completedPaperIds}
              onOpenSubject={openSubject}
              onOpenPaperEdit={openPaperFromLanding}
            />
          ) : activeView === "topictests" ? (
            <TopicTestsLandingPage
              subjects={activeSubjects}
              onOpenSubject={openSubject}
              onOpenTopicTest={openTopicTestFromLanding}
            />
          ) : activeView === "mistakes" ? (
            <MistakesTrackerPanel mistakes={mistakes} setMistakes={setMistakes} subjects={activeSubjects} onAwardXP={awardXP} />
          ) : activeView === "boundaries" ? (
            <GradeBoundariesPanel subjects={activeSubjects} />
          ) : activeView === "ai" ? (
            <AiTutorPanel onUpgrade={onOpenPricing} />
          ) : activeView === "settings" ? (
            <ProfileSettingsPanel
              profile={dashboardProfile}
              user={user}
              allSubjectsList={subjects}
              draftSelectedIds={draftSelectedIds}
              onToggleSubject={toggleDraftSubject}
              onSaveSubjects={saveSubjectChoices}
              onSaveProfile={saveDashboardProfile}
              stats={stats}
              achievements={achievements}
              xp={currentXp}
              streak={currentStreak}
              xpEvents={xpEvents}
              onOpenPricing={onOpenPricing}
              onLogout={handleLogout}
            />
          ) : (
            <DashboardHome
              activeSubjects={activeSubjects}
              onOpenSubject={openSubject}
              stats={stats}
              upcomingExams={upcomingExams}
              onSelectView={selectView}
              onOpenPricing={onOpenPricing}
              greeting={dashboardGreeting}
              needsCambridgeZone={needsCambridgeZone}
              onOpenSubjectPicker={openSubjectPicker}
              onOpenAllExams={() => setAllExamsCalendarOpen(true)}
            />
          )}
        </main>
      </div>
      <ChangeSubjectsModal
        open={subjectPickerOpen}
        selectedIds={selectedIds}
        onClose={() => setSubjectPickerOpen(false)}
        onSave={saveSubjectsFromPicker}
      />
    </div>
  );
}


