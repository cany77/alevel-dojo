import { papers } from "./papersData";
import { supabase } from "./supabaseClient";
import PdfViewer from "./PdfViewer";
import Watermark from "./Watermark";
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  Layers3,
  LibraryBig,
  LineChart as LineChartIcon,
  Lock,
  LogOut,
  Menu,
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
  User,
} from "lucide-react";

const subjectGroups = [
  {
    board: "OxfordAQA",
    description: "International AQA subjects",
    subjects: [
      { id: "physics", name: "Physics", detail: "Units 1–5, topic tests, practical skills", progress: 18 },
      { id: "chemistry", name: "Chemistry", detail: "Physical, organic, inorganic, practical skills", progress: 0 },
      { id: "biology", name: "Biology", detail: "Cells, molecules, genetics, physiology, ecology", progress: 0 },
      { id: "psychology", name: "Psychology", detail: "Research methods, approaches, memory, attachment", progress: 0 },
    ],
  },
  {
    board: "Cambridge",
    description: "CAIE subjects and variants",
    subjects: [
      { id: "computer-science", name: "Computer Science", detail: "Paper 1, Paper 2, variants 1–3", progress: 32 },
      { id: "cambridge-maths", name: "Mathematics", detail: "Pure, statistics, mechanics", progress: 0 },
      { id: "cambridge-physics", name: "Physics", detail: "AS/A Level structured papers", progress: 0 },
    ],
  },
  {
    board: "Edexcel",
    description: "Pearson Edexcel subjects",
    subjects: [
      { id: "maths", name: "Mathematics", detail: "Pure 1–4, statistics, mechanics", progress: 45 },
      { id: "further-maths", name: "Further Mathematics", detail: "Further pure, mechanics, statistics", progress: 0 },
      { id: "statistics", name: "Statistics", detail: "Probability, distributions, hypothesis testing", progress: 0 },
      { id: "mechanics", name: "Mechanics", detail: "Kinematics, forces, moments, projectiles", progress: 0 },
    ],
  },
];

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

const examDates = [
  { subject: "Physics", board: "OxfordAQA", paper: "Unit 3: Fields and their consequences", date: "2026-06-01" },
  { subject: "Chemistry", board: "OxfordAQA", paper: "Unit 4: Kinetics and equilibria", date: "2026-06-05" },
  { subject: "Biology", board: "OxfordAQA", paper: "Unit 3: Populations and genes", date: "2026-06-09" },
  { subject: "Psychology", board: "OxfordAQA", paper: "Paper 2: Core topics", date: "2026-06-12" },
  { subject: "Computer Science", board: "Cambridge", paper: "Paper 3: Advanced theory", date: "2026-06-03" },
  { subject: "Mathematics", board: "Edexcel", paper: "Pure 3", date: "2026-06-04" },
  { subject: "Further Mathematics", board: "Edexcel", paper: "Further Pure 2", date: "2026-06-10" },
  { subject: "Statistics", board: "Edexcel", paper: "Statistics 2", date: "2026-06-14" },
  { subject: "Mechanics", board: "Edexcel", paper: "Mechanics 2", date: "2026-06-18" },
];

const gradeBoundaryData = [
  { year: "2023", astar: 79, a: 66, b: 54 },
  { year: "2024", astar: 82, a: 69, b: 57 },
  { year: "2025", astar: 84, a: 72, b: 60 },
  { year: "2026", astar: 87, a: 75, b: 63 },
];

const plans = [
  ["Free", "Past papers, topic tests, save progress"],
  ["Pro", "AI tutor, mistakes tracker, grade boundary insights"],
  ["Premium", "Advanced AI, topic-test generator, deeper analytics"],
];

const userPlan = "free";

function paperId(paper) {
  return [
    paper.type,
    paper.board,
    paper.subject,
    paper.variant,
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

function paperLabel(paper) {
  if (paper.type === "Topic Test") {
    return `${paper.subject} • ${paper.topic}`;
  }

  return `${paper.subject} • ${paper.qualification || ""} • ${
    paper.session || ""
  } ${paper.year || ""} • ${paper.unit || ""}`;
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
function daysUntil(date) {
  const today = new Date();
  const examDate = new Date(`${date}T00:00:00`);
  const diff = examDate.getTime() - today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diff / 86400000));
}
function allSubjects() {
  return subjectGroups.flatMap((group) =>
    group.subjects.map((subject) => ({ ...subject, board: group.board }))
  );
}

function profileSubjectsToIds(profileSubjects = [], subjects = []) {
  return profileSubjects
    .map((item) => {
      if (typeof item === "string") return item;

      const subjectName = item.subject || item.name || item.subject_name;
      const board = item.board;

      const match = subjects.find(
        (subject) => subject.name === subjectName && subject.board === board
      );

      return match?.id;
    })
    .filter(Boolean);
}


function Logo({ onGoHome = () => {} }) {
  return (
    <button
      onClick={onGoHome}
      className="flex items-center gap-3 text-left"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 text-sm font-black text-white shadow-lg shadow-rose-500/20">
        A
      </div>
      <div>
        <p className="text-base font-black tracking-tight text-white">A-Level Dojo</p>
        <p className="-mt-1 text-[11px] text-white/40">dashboard preview</p>
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
  const colors = boardColors[subject.board];

  return (
    <button
      onClick={onOpen}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">{subject.name}</h3>
          <p className="mt-1 text-sm text-white/45">{subject.detail}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${colors.chip}`}>
          {subject.board}
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-white/40">
        <span>Progress</span>
        <span>{subject.progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400"
          style={{ width: `${subject.progress}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm font-bold text-white/55 group-hover:text-white">
        <span>Open subject</span>
        <ChevronRight size={17} />
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
          Choose the subjects and exam boards you are actually taking. Your dashboard will stay simple and only show the papers, notes, syllabus, flashcards, and revision tools that match your choices.
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

function SubjectSetupPage({ selectedIds, onToggle, onSave }) {
  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,92,82,0.11),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(124,58,237,0.14),transparent_28%),radial-gradient(circle_at_72%_86%,rgba(34,211,238,0.06),transparent_24%)]" />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <Logo />
        <section className="mt-14 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-200">First login setup</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Choose your subjects</h1>
            <p className="mt-5 text-base leading-8 text-white/55">
              Select the subjects and boards you are currently studying. You can change them later.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            {subjectGroups.map((group) => (
              <section key={group.board}>
                <div className="mb-4">
                  <h2 className="text-xl font-black">{group.board}</h2>
                  <p className="mt-1 text-sm text-white/45">{group.description}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {group.subjects.map((subject) => {
                    const selected = selectedIds.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        onClick={() => onToggle(subject.id)}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                          selected
                            ? "border-cyan-300/50 bg-cyan-300/10"
                            : "border-white/10 bg-slate-950/55 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black">{subject.name}</h3>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black ${selected ? "bg-cyan-300 text-slate-950" : "bg-white/[0.06] text-white/45"}`}>
                            {selected ? "Selected" : group.board}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/45">{subject.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-sm text-white/45">{selectedIds.length} subjects selected</p>
            <button
              onClick={onSave}
              disabled={selectedIds.length === 0}
              className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/15 transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save subjects
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function DashboardShellSidebar({
  open,
  onOpen,
  onClose,
  onToggleOpen,
  activeView,
  onSelectView,
  activeSubjects,
  onOpenSubject,
  onOpenProfile,
  onGoHome,
}) {
  const nav = [
    [Home, "Dashboard", "dashboard"],
    [FileText, "Past papers", "pastpapers"],
    [Layers3, "Topic tests", "topictests"],
    [CalendarDays, "Exam calendar", "calendar"],
    [RotateCcw, "Mistakes tracker", "mistakes"],
    [LineChartIcon, "Grade boundaries", "boundaries"],
    [Brain, "AI tutor", "ai"],
    [User, "Profile", "profile"],
    [Settings2, "Settings", "settings"],
  ];

  return (
    <aside
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      className={`${open ? "w-[292px]" : "w-[76px]"} hidden shrink-0 border-r border-white/10 bg-slate-950/78 p-4 backdrop-blur-xl transition-all duration-200 ease-out lg:block`}
    >
      <div className={`mb-5 flex items-center ${open ? "justify-between" : "justify-center"}`}>
        {open && <Logo onGoHome={onGoHome} />}
        <button
          onClick={onToggleOpen}
          className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5 text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.07]"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <nav className="space-y-2">
        {nav.map(([Icon, label, id]) => (
          <button
            key={id}
            onClick={() => (id === "profile" ? onOpenProfile() : onSelectView(id))}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 ${
              activeView === id
                ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/25"
                : "text-white/55 hover:bg-white/[0.055] hover:text-white"
            } ${open ? "" : "justify-center"}`}
            title={label}
          >
            <Icon size={18} />
            {open && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {open && (
        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-white/32">My subjects</p>
          <div className="space-y-2">
            {activeSubjects.slice(0, 4).map((subject) => (
              <button
                key={subject.id}
                onClick={() => onOpenSubject(subject.id)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                <p className="truncate text-sm font-black text-white">{subject.name}</p>
                <p className="mt-1 text-xs text-white/38">{subject.board}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <button
          onClick={() => onSelectView("ai")}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/15 transition-all duration-200 ease-out hover:-translate-y-0.5"
        >
          Upgrade
        </button>
      )}
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

function DashboardHome({ activeSubjects, onOpenSubject, stats, upcomingExams, onSelectView }) {
  return (
    <>
      <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles size={15} /> A-Level Dojo dashboard
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white">Start where you left off.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
              Your subjects stay compact, your revision tools are one click away, and your progress stays visible without crowding the page.
            </p>
          </div>
          <button
            onClick={() => onSelectView("calendar")}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]"
          >
            View exam calendar
          </button>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Upcoming exams" value={upcomingExams.length} detail="Personal timetable" />
        <MetricCard label="Continue revision" value="1 paper" detail="Resume your latest session" accent="text-violet-200" />
        <MetricCard label="Mistakes to review" value={stats.mistakesOpen} detail="Unfixed questions" accent="text-rose-200" />
        <MetricCard label="Completed papers" value={stats.completedCount} detail="Marked complete" accent="text-emerald-200" />
        <MetricCard label="Saved papers" value={stats.savedCount} detail="Ready to revisit" accent="text-yellow-200" />
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">My subjects</h2>
          <p className="text-sm text-white/40">Open a card for papers and topic tests</p>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeSubjects.map((subject) => (
              <ActiveSubjectCard key={subject.id} subject={subject} onOpen={() => onOpenSubject(subject.id)} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ExamCalendarPanel exams={upcomingExams.slice(0, 4)} compact />
        <AiTutorPanel onUpgrade={() => onSelectView("ai")} compact />
      </section>
    </>
  );
}

function ExamCalendarPanel({ exams, compact = false }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Exam calendar</h2>
          <p className="mt-1 text-sm text-white/42">Static timetable for selected subjects</p>
        </div>
        <CalendarDays className="text-cyan-200" size={22} />
      </div>
      <div className="space-y-3">
        {exams.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">
            Select subjects to see upcoming exams.
          </p>
        ) : (
          exams.map((exam) => (
            <div key={`${exam.board}-${exam.subject}-${exam.paper}`} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-black text-white">{exam.subject}</p>
                <p className="mt-1 text-sm text-white/42">{exam.board} - {exam.paper}</p>
                {!compact && <p className="mt-2 text-xs font-bold text-cyan-200">{new Date(exam.date).toLocaleDateString()}</p>}
              </div>
              <div className="rounded-2xl bg-cyan-300/10 px-4 py-3 text-center">
                <p className="text-2xl font-black text-cyan-100">{daysUntil(exam.date)}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">days</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function GradeBoundariesPanel() {
  const chartLines = [
    { key: "astar", label: "A*", color: "#22d3ee", points: "50,92 160,84 270,76 380,66" },
    { key: "a", label: "A", color: "#a78bfa", points: "50,128 160,119 270,109 380,96" },
    { key: "b", label: "B", color: "#fb7185", points: "50,164 160,151 270,139 380,124" },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black text-white">Grade boundaries</h2>
        <p className="mt-1 text-sm text-white/42">Example A* trend by subject and board. Static for now.</p>
      </div>
      <div className="h-[300px] rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <svg viewBox="0 0 430 230" className="h-full w-full" role="img" aria-label="A star, A, and B grade boundary trend from 2023 to 2026 predicted">
          <defs>
            <linearGradient id="boundaryFade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.14" />
              <stop offset="55%" stopColor="#a78bfa" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          <rect x="38" y="22" width="360" height="170" rx="18" fill="url(#boundaryFade)" />
          {[56, 92, 128, 164].map((y) => (
            <line key={y} x1="50" y1={y} x2="390" y2={y} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 6" />
          ))}
          <line x1="50" y1="192" x2="390" y2="192" stroke="rgba(255,255,255,0.24)" />
          <line x1="50" y1="32" x2="50" y2="192" stroke="rgba(255,255,255,0.24)" />

          {chartLines.map((line) => (
            <g key={line.key}>
              <polyline
                points={line.points}
                fill="none"
                stroke={line.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {line.points.split(" ").map((point) => {
                const [cx, cy] = point.split(",");
                return <circle key={`${line.key}-${point}`} cx={cx} cy={cy} r="4.5" fill={line.color} />;
              })}
            </g>
          ))}

          {["2023", "2024", "2025", "2026 predicted"].map((year, index) => (
            <text key={year} x={50 + index * 110} y="214" textAnchor="middle" fill="rgba(255,255,255,0.48)" fontSize="12" fontWeight="700">
              {year}
            </text>
          ))}
          {["94%", "77%", "62%", "47%"].map((label, index) => (
            <text key={label} x="38" y={58 + index * 36} textAnchor="end" fill="rgba(255,255,255,0.42)" fontSize="11" fontWeight="700">
              {label}
            </text>
          ))}
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-white/55">
        {chartLines.map((line) => (
          <span key={line.key} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function MistakesTrackerPanel({ mistakes, setMistakes }) {
  const [draft, setDraft] = useState({ question: "", topic: "", note: "", fixed: false });

  function saveMistake() {
    if (!draft.question.trim() && !draft.note.trim()) return;
    setMistakes([{ id: Date.now(), ...draft }, ...mistakes]);
    setDraft({ question: "", topic: "", note: "", fixed: false });
  }

  function toggleFixed(id) {
    setMistakes(mistakes.map((mistake) => mistake.id === id ? { ...mistake, fixed: !mistake.fixed } : mistake));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xl font-black text-white">Mistakes tracker</h2>
        <p className="mt-1 text-sm text-white/42">Track questions you got wrong and mark them fixed later.</p>
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/45 p-5 text-center text-sm text-white/40">
          Question image upload placeholder
        </div>
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
          value={draft.note}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          placeholder="What went wrong?"
          className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
        />
        <button onClick={saveMistake} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-violet-400 px-5 py-3 text-sm font-black text-white">
          <Save size={16} /> Save mistake
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h3 className="text-lg font-black text-white">Review queue</h3>
        <div className="mt-4 space-y-3">
          {mistakes.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">No mistakes saved yet.</p>
          ) : (
            mistakes.map((mistake) => (
              <button key={mistake.id} onClick={() => toggleFixed(mistake.id)} className="w-full rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.055]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{mistake.topic || "Untitled topic"}</p>
                    <p className="mt-1 text-sm text-white/45">{mistake.note || mistake.question}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${mistake.fixed ? "bg-emerald-300 text-slate-950" : "bg-rose-400/15 text-rose-200"}`}>
                    {mistake.fixed ? "Fixed" : "Open"}
                  </span>
                </div>
              </button>
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

function UpgradeModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d1224] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Upgrade AI tutor</h2>
            <p className="mt-2 text-sm leading-7 text-white/50">AI tutor is part of Pro and Premium. Plans are placeholders for now.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/[0.06]"><X size={20} /></button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {plans.map(([name, text]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-black">{name}</p>
              <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ open, onClose, user, subjects, stats, mistakes, onLogout }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d1224] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Profile</h2>
            <p className="mt-1 text-sm text-white/45">{user?.email || "Signed in student"}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/[0.06]"><X size={20} /></button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MetricCard label="Study streak" value="2 days" detail="Current streak" />
          <MetricCard label="Completed papers" value={stats.completedCount} detail="Across subjects" accent="text-emerald-200" />
          <MetricCard label="Mistakes count" value={mistakes.length} detail="Saved reviews" accent="text-rose-200" />
          <MetricCard label="Perfected topics" value="0" detail="Coming soon" accent="text-violet-200" />
          <MetricCard label="Selected subjects" value={subjects.length} detail={subjects.map((item) => item.name).join(", ") || "None"} accent="text-cyan-200" />
          <MetricCard label="Refer a friend" value="dojo.link/ref" detail="Share A-Level Dojo" accent="text-yellow-200" />
        </div>
        <button onClick={onLogout} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}

function ProfileSettingsPanel({
  profile,
  allSubjectsList,
  draftSelectedIds,
  onToggleSubject,
  onSaveSubjects,
  onSaveProfile,
}) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    year_group: profile?.year_group || "Year 13",
    target_grade: profile?.target_grade || "A",
    predicted_grade: profile?.predicted_grade || "",
  });

  async function saveAll() {
    const selectedSubjects = allSubjectsList
      .filter((subject) => draftSelectedIds.includes(subject.id))
      .map((subject) => ({ board: subject.board, subject: subject.name }));

    await onSaveProfile({
      ...profile,
      ...form,
      subjects: selectedSubjects,
      selected_subjects: selectedSubjects,
      predicted_grade: form.predicted_grade || null,
      onboarding_completed: true,
    });
    await onSaveSubjects();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">Settings</h2>
        <p className="mt-1 text-sm text-white/42">Edit your onboarding details, profile, and selected subjects.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.full_name}
          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
          placeholder="Name"
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
        />
        <select
          value={form.year_group}
          onChange={(event) => setForm({ ...form, year_group: event.target.value })}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300"
        >
          {["Year 12", "Year 13", "Private candidate", "Other"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select
          value={form.target_grade}
          onChange={(event) => setForm({ ...form, target_grade: event.target.value })}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300"
        >
          {["E", "D", "C", "B", "A", "A*"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select
          value={form.predicted_grade || ""}
          onChange={(event) => setForm({ ...form, predicted_grade: event.target.value })}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300"
        >
          <option value="">Predicted grade (optional)</option>
          {["E", "D", "C", "B", "A", "A*"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="mt-8 space-y-6">
        {subjectGroups.map((group) => (
          <section key={group.board}>
            <h3 className="mb-3 font-black text-white">{group.board}</h3>
            <div className="flex flex-wrap gap-2">
              {group.subjects.map((subject) => {
                const selected = draftSelectedIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    onClick={() => onToggleSubject(subject.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                      selected
                        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06]"
                    }`}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <button
        onClick={saveAll}
        className="mt-8 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-3 text-sm font-black text-white"
      >
        Save settings
      </button>
    </section>
  );
}
function PastPapersPanel({ subject, user, onRequireLogin }) {
  const [activePreview, setActivePreview] = useState(null);
  const [showMarkScheme, setShowMarkScheme] = useState(false);
  const [maximizedPreview, setMaximizedPreview] = useState(false);
  const [paperSearch, setPaperSearch] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("All qualifications");
  const [selectedUnit, setSelectedUnit] = useState("All units");
  const [selectedYear, setSelectedYear] = useState("All years");
  const [selectedSession, setSelectedSession] = useState("All sessions");
  const [completionFilter, setCompletionFilter] = useState("All papers");

  const [completedPaperIds, setCompletedPaperIds] = useState(() =>
    readStorage("alevel-dojo-completed-papers", [])
  );

  const [savedPaperIds, setSavedPaperIds] = useState(() =>
    readStorage("alevel-dojo-favourites", [])
  );

  const subjectPastPapers = papers.filter(
    (paper) =>
      paper.type === "Past Paper" &&
      paper.board === subject.board &&
      paper.subject === subject.name
  );

  const availableQualifications = [
    "All qualifications",
    ...unique(subjectPastPapers.map((paper) => paper.qualification)),
  ];

  const availableUnits = [
    "All units",
    ...unique(subjectPastPapers.map((paper) => paper.unit)),
  ];

  const availableYears = [
    "All years",
    ...unique(subjectPastPapers.map((paper) => paper.year)),
  ];

  const availableSessions = [
    "All sessions",
    ...unique(subjectPastPapers.map((paper) => paper.session)),
  ];

  const filteredPapers = subjectPastPapers.filter((paper) => {
    const id = paperId(paper);
    const isCompleted = completedPaperIds.includes(id);

    const text = `${paper.board} ${paper.subject} ${paper.variant || ""} ${
      paper.qualification || ""
    } ${paper.session || ""} ${paper.year || ""} ${paper.unit || ""}`.toLowerCase();

    return (
      text.includes(paperSearch.toLowerCase()) &&
      (selectedQualification === "All qualifications" ||
        paper.qualification === selectedQualification) &&
      (selectedUnit === "All units" || paper.unit === selectedUnit) &&
      (selectedYear === "All years" || paper.year === selectedYear) &&
      (selectedSession === "All sessions" || paper.session === selectedSession) &&
      (completionFilter === "All papers" ||
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

    const next = completedPaperIds.includes(id)
      ? completedPaperIds.filter((item) => item !== id)
      : [...completedPaperIds, id];

    setCompletedPaperIds(next);
    writeStorage("alevel-dojo-completed-papers", next);
  }

  function toggleSaved(paper) {
    const id = paperId(paper);

    const next = savedPaperIds.includes(id)
      ? savedPaperIds.filter((item) => item !== id)
      : [...savedPaperIds, id];

    setSavedPaperIds(next);
    writeStorage("alevel-dojo-favourites", next);
  }

  function clearFilters() {
    setPaperSearch("");
    setSelectedQualification("All qualifications");
    setSelectedUnit("All units");
    setSelectedYear("All years");
    setSelectedSession("All sessions");
    setCompletionFilter("All papers");
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
              setActivePreview(null);
              setShowMarkScheme(false);
              setMaximizedPreview(false);
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
                <button
                    onClick={() => setMaximizedPreview(!maximizedPreview)}
                    className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
                >
                    {maximizedPreview ? "Minimize" : "Maximize"}
                </button>
              <button
                onClick={() => {
                  setActivePreview(null);
                  setShowMarkScheme(false);
                  setMaximizedPreview(false);
                }}
                className="rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white"
              >
                Close
              </button>
            </div>
          </div>

            <div
            className={
                activePreview.mode === "edit"
                ? "flex gap-4 overflow-x-auto"
                : `grid gap-4 ${
                    showMarkScheme && activePreview.paper.markScheme
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

                <PdfViewer
                fileUrl={
                    activePreview.paper.questionPaper || activePreview.paper.pdf
                }
                editable={activePreview.mode === "edit"}
                />
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

                <PdfViewer
                    fileUrl={activePreview.paper.markScheme}
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

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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

              <button
                onClick={clearFilters}
                className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
              >
                Clear
              </button>
            </div>
          </div>

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

                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-white">
                          {paperLabel(paper)}
                        </h4>

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
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          requireLogin(() => {
                            setActivePreview({ paper, mode: "preview" });
                            setShowMarkScheme(true);
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                      >
                        <Eye size={16} />
                        Preview Q + MS
                      </button>

                      <button
                       onClick={() =>
  requireLogin(() => {
    setActivePreview({ paper, mode: "edit" });
    setShowMarkScheme(false);
  })
}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white hover:brightness-110"
                      >
                        <Edit3 size={16} />
                        PDF Edit
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
function TopicTestsPanel({ subject, user, onRequireLogin }) {
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

    const next = completedTestIds.includes(id)
      ? completedTestIds.filter((item) => item !== id)
      : [...completedTestIds, id];

    setCompletedTestIds(next);
    writeStorage("alevel-dojo-completed-topic-tests", next);
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
            onClick={() => setActivePreview(null)}
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
              onClick={() => setActivePreview(null)}
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
                            setActivePreview({ paper, mode: "preview" });
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
                            setActivePreview({ paper, mode: "edit" });
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
function SubjectPagePreview({ subject, onBack, user, onRequireLogin, initialSection = "overview" }) {
  const [section, setSection] = useState(initialSection);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection, subject.id]);

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
        Back to dashboard
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
            onClick={() => setSection("pastpapers")}
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
            onClick={() => setSection(id)}
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
            />
        ) : section === "topictests" ? (
        <TopicTestsPanel
            subject={subject}
            user={user}
            onRequireLogin={onRequireLogin}
            />
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([Icon, title, text, id]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
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

      {section !== "overview" && section !== "pastpapers" && section !== "topictests" && (
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
  onGoHome = () => {},
}) {
  const subjects = allSubjects();
  const [selectedIds, setSelectedIds] = useState(() =>
    profileSubjectsToIds(profile?.subjects || profile?.selected_subjects || [], subjects)
  );
  const [draftSelectedIds, setDraftSelectedIds] = useState(() =>
    profileSubjectsToIds(profile?.subjects || profile?.selected_subjects || [], subjects)
  );
  const [dashboardProfile, setDashboardProfile] = useState(profile);
  const [loadingSubjects, setLoadingSubjects] = useState(Boolean(user && !profile));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [subjectSection, setSubjectSection] = useState("overview");
  const [profileOpen, setProfileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mistakes, setMistakes] = useState(() => readStorage("alevel-dojo-mistakes", []));

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

  const activeSubjects = subjects.filter((subject) => selectedIds.includes(subject.id));
  const activeSubject = subjects.find((subject) => subject.id === activeSubjectId) || null;

  const stats = {
    completedCount:
      readStorage("alevel-dojo-completed-papers", []).length +
      readStorage("alevel-dojo-completed-topic-tests", []).length,
    savedCount:
      readStorage("alevel-dojo-favourites", []).length +
      readStorage("alevel-dojo-saved-topic-tests", []).length,
    mistakesOpen: mistakes.filter((mistake) => !mistake.fixed).length,
  };

  const upcomingExams = examDates
    .filter((exam) =>
      activeSubjects.some(
        (subject) => subject.name === exam.subject && subject.board === exam.board
      )
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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

  function openSubject(id, section = "overview") {
    setActiveSubjectId(id);
    setSubjectSection(section);
    setActiveView(section === "topictests" ? "topictests" : section === "pastpapers" ? "pastpapers" : "subject");
  }

  function selectView(view) {
    setActiveSubjectId(null);
    setActiveView(view);

    if ((view === "pastpapers" || view === "topictests") && activeSubjects[0]) {
      openSubject(activeSubjects[0].id, view);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfileOpen(false);
  }

  if (loadingSubjects) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060816] text-white">
        <Watermark />
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">A-Level Dojo</p>
          <p className="mt-3 text-white/55">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,92,82,0.11),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(124,58,237,0.14),transparent_28%),radial-gradient(circle_at_72%_86%,rgba(34,211,238,0.06),transparent_24%)]" />

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        subjects={activeSubjects}
        stats={stats}
        mistakes={mistakes}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex min-h-screen">
        <DashboardShellSidebar
          open={sidebarOpen}
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          onToggleOpen={() => setSidebarOpen((current) => !current)}
          activeView={activeView}
          onSelectView={selectView}
          activeSubjects={activeSubjects}
          onOpenSubject={openSubject}
          onOpenProfile={() => setProfileOpen(true)}
          onGoHome={onGoHome}
        />

        <main className="flex-1 px-5 py-6 md:px-8 lg:px-10">
          <div className="mb-4 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-3 lg:hidden">
            <Logo onGoHome={onGoHome} />
            <select
              value={activeView}
              onChange={(event) => selectView(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none"
            >
              <option value="dashboard">Dashboard</option>
              <option value="pastpapers">Past papers</option>
              <option value="topictests">Topic tests</option>
              <option value="calendar">Exam calendar</option>
              <option value="mistakes">Mistakes tracker</option>
              <option value="boundaries">Grade boundaries</option>
              <option value="ai">AI tutor</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-xl">
            <div>
              <p className="text-sm text-white/40">Welcome back</p>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {activeSubject ? `${activeSubject.name} workspace` : "Your revision dashboard"}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setProfileOpen(true)}
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.07]"
              >
                Profile
              </button>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/15 transition-all duration-200 ease-out hover:-translate-y-0.5"
              >
                Upgrade
              </button>
            </div>
          </header>

          {activeSubject ? (
            <SubjectPagePreview
              subject={activeSubject}
              onBack={() => {
                setActiveSubjectId(null);
                setSubjectSection("overview");
                setActiveView("dashboard");
              }}
              user={user}
              onRequireLogin={onRequireLogin}
              initialSection={subjectSection}
            />
          ) : activeView === "calendar" ? (
            <ExamCalendarPanel exams={upcomingExams} />
          ) : activeView === "mistakes" ? (
            <MistakesTrackerPanel mistakes={mistakes} setMistakes={setMistakes} />
          ) : activeView === "boundaries" ? (
            <GradeBoundariesPanel />
          ) : activeView === "ai" ? (
            <AiTutorPanel onUpgrade={() => setUpgradeOpen(true)} />
          ) : activeView === "settings" ? (
            <ProfileSettingsPanel
              profile={dashboardProfile}
              allSubjectsList={subjects}
              draftSelectedIds={draftSelectedIds}
              onToggleSubject={toggleDraftSubject}
              onSaveSubjects={saveSubjectChoices}
              onSaveProfile={onSaveProfile}
            />
          ) : (
            <DashboardHome
              activeSubjects={activeSubjects}
              onOpenSubject={openSubject}
              stats={stats}
              upcomingExams={upcomingExams}
              onSelectView={selectView}
            />
          )}
        </main>
      </div>
    </div>
  );
}
