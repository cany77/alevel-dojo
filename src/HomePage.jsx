import Watermark from "./Watermark";
import React, { useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers3,
  LibraryBig,
  Lock,
  Menu,
  PenLine,
  PlayCircle,
  Search,
  Sparkles,
  Timer,
  Wand2,
  X,
  Zap,
} from "lucide-react";

const subjects = ["Physics", "Maths", "Chemistry", "Biology", "Computer Science", "Psychology"];

const boardCards = [
  {
    name: "OxfordAQA",
    tag: "International AQA",
    text: "Past papers, mark schemes, topic tests, and syllabus resources.",
    accent: "from-rose-500/25 via-rose-500/10 to-transparent",
    border: "border-rose-400/30",
    label: "text-rose-300",
    glow: "shadow-rose-500/10",
  },
  {
    name: "Cambridge",
    tag: "CAIE",
    text: "Variant-based papers with organized units, years, and topic practice.",
    accent: "from-cyan-400/25 via-cyan-400/10 to-transparent",
    border: "border-cyan-300/30",
    label: "text-cyan-200",
    glow: "shadow-cyan-400/10",
  },
  {
    name: "Edexcel",
    tag: "Pearson",
    text: "Cleanly sorted papers, textbooks, notes, and revision pathways.",
    accent: "from-violet-400/25 via-violet-400/10 to-transparent",
    border: "border-violet-300/30",
    label: "text-violet-200",
    glow: "shadow-violet-400/10",
  },
];

const features = [
  {
    icon: FileText,
    title: "Real Past Papers",
    text: "Actual exam questions with question papers, mark schemes, previews, downloads, and PDF editing.",
  },
  {
    icon: LibraryBig,
    title: "Textbooks + Syllabus",
    text: "Authorized syllabus checklists and textbook resources organized by subject, board, unit, and topic.",
  },
  {
    icon: PenLine,
    title: "Exam-Technique Notes",
    text: "Short notes that summarize chapters and explain how to approach each question type.",
  },
  {
    icon: PlayCircle,
    title: "Interactive Lessons",
    text: "Lessons that explain textbook notes, exam techniques, and common mistakes step by step.",
  },
  {
    icon: Layers3,
    title: "Flashcards",
    text: "Create your own flashcards or revise from pre-made decks matched to the syllabus.",
  },
  {
    icon: Brain,
    title: "AI Study Partner",
    text: "Ask questions, go through papers, get quizzed, visualize topics, and combine topics into one revision session.",
  },
  {
    icon: Timer,
    title: "Timed Mock Mode",
    text: "Practice under timed exam conditions with extra time options and progress tracking.",
  },
  {
    icon: CheckCircle2,
    title: "Progress Dashboard",
    text: "Track completed papers, saved papers, weak topics, and subject progress in a personal dashboard.",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 font-black text-white shadow-lg shadow-rose-500/20">
        A
      </div>
      <div>
        <p className="text-lg font-black tracking-tight text-white">A-Level Dojo</p>
        <p className="-mt-1 text-[11px] text-white/45">past papers, smarter revision</p>
      </div>
    </div>
  );
}

function FloatingPaperMock() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
      <div className="absolute -bottom-10 right-8 h-32 w-32 rounded-full bg-rose-400/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-white/75">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Paper library
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">Live</span>
        </div>

        <div className="space-y-3">
          {[
            ["Physics", "OxfordAQA", "Jan 2020 · Unit 3", "Preview"],
            ["Maths", "Cambridge", "May/June 2023 · P1", "Edit PDF"],
            ["Chemistry", "Edexcel", "Oct/Nov 2022 · P2", "Mock"],
          ].map((row, index) => (
            <div key={row[0]} className="flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-4">
              <div>
                <p className="font-bold text-white">{row[0]} · A Level</p>
                <p className="mt-1 text-xs text-white/45">{row[1]} · {row[2]}</p>
              </div>
              <button className={`rounded-full px-3 py-1 text-xs font-bold ${index === 0 ? "bg-rose-400/15 text-rose-200" : index === 1 ? "bg-cyan-400/15 text-cyan-200" : "bg-violet-400/15 text-violet-200"}`}>
                {row[3]}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white/[0.05] p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-white/45">
            <span>Physics progress</span>
            <span className="text-rose-200">38%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className="h-2 w-[38%] rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 -left-4 rounded-3xl border border-white/15 bg-slate-950/90 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
            <Wand2 size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AI topic mixer</p>
            <p className="text-xs text-white/45">Fields + mechanics quiz ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPreview() {
  return (
    <div className="rounded-[2rem] border border-white/15 bg-slate-950/85 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff554f] font-black text-white shadow-lg shadow-red-500/20">
            A
          </div>

          <div>
            <p className="text-lg font-black tracking-tight text-white">
              A-Level Dojo
            </p>
            <p className="-mt-1 text-[11px] text-white/45">
              past papers, smarter revision
            </p>
          </div>
        </div>

        <X className="text-white/35" size={18} />
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white/[0.06] p-1">
        <button className="rounded-xl bg-[#ff554f] py-3 text-sm font-black text-white">
          Sign in
        </button>

        <button className="rounded-xl py-3 text-sm font-bold text-white/50">
          Sign up
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/20 px-4 py-4 text-sm text-white/35">
          Email address
        </div>

        <div className="rounded-2xl border border-white/20 px-4 py-4 text-sm text-white/35">
          Password
        </div>

        
      </div>

      <div className="my-4 text-center text-xs text-white/35">or</div>

      <div className="grid grid-cols-2 gap-3 text-sm text-white/65">
        <button className="rounded-2xl border border-white/20 py-3 hover:bg-white/5">
          Google
        </button>

        <button className="rounded-2xl border border-white/20 py-3 hover:bg-white/5">
          GitHub
        </button>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const [active, setActive] = useState("Physics");

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">
            <Lock size={16} /> Logged-in dashboard
          </p>
          <h2 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
            Your subjects, your boards, your progress.
          </h2>
        </div>
        <p className="max-w-md text-white/60">
          After login, students choose their subjects and exam boards. The dashboard changes to show the exact papers, notes, flashcards, and syllabus progress they need.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-4 text-sm font-bold text-white/55">Choose subjects</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActive(subject)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active === subject
                    ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-slate-950/60 p-5">
            <p className="text-sm text-white/45">Current subject</p>
            <h3 className="mt-1 text-3xl font-black text-white">{active}</h3>
            <div className="mt-5 space-y-3">
              {["Syllabus progress", "Completed papers", "Flashcard mastery"].map((item, index) => (
                <div key={item}>
                  <div className="mb-1 flex justify-between text-xs text-white/45">
                    <span>{item}</span>
                    <span>{[64, 28, 41][index]}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                      style={{ width: `${[64, 28, 41][index]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/45">Recommended next</p>
              <h3 className="text-2xl font-black text-white">{active} revision path</h3>
            </div>
            <button className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-400 px-5 py-3 text-sm font-black text-white">Open dashboard</button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              [FileText, "Do one real paper", "OxfordAQA · Unit 3 · Jan 2020"],
              [BookOpen, "Read the chapter notes", "Fields and their consequences"],
              [Layers3, "Review flashcards", "35 cards due today"],
              [Brain, "Ask AI to quiz you", "Combine weak topics together"],
            ].map(([Icon, title, text]) => (
              <div key={title} className="rounded-3xl bg-slate-950/50 p-5">
                <div className="mb-4 inline-flex rounded-2xl bg-white/[0.07] p-3 text-cyan-200">
                  <Icon size={22} />
                </div>
                <h4 className="font-black text-white">{title}</h4>
                <p className="mt-2 text-sm text-white/45">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureBand({ theme, icon: Icon, label, title, text, button, reverse }) {
  const themes = {
    cyan: {
      section: "bg-cyan-950/20",
      pill: "bg-cyan-300 text-slate-950",
      label: "text-cyan-200",
      button: "bg-cyan-300 text-slate-950",
      glow: "from-cyan-300/20",
    },
    amber: {
      section: "bg-amber-950/15",
      pill: "bg-amber-300 text-slate-950",
      label: "text-amber-200",
      button: "bg-amber-300 text-slate-950",
      glow: "from-amber-300/20",
    },
    violet: {
      section: "bg-violet-950/20",
      pill: "bg-violet-300 text-slate-950",
      label: "text-violet-200",
      button: "bg-violet-300 text-slate-950",
      glow: "from-violet-300/20",
    },
    green: {
      section: "bg-emerald-950/15",
      pill: "bg-emerald-300 text-slate-950",
      label: "text-emerald-200",
      button: "bg-emerald-300 text-slate-950",
      glow: "from-emerald-300/20",
    },
  };
  const t = themes[theme];

  return (
    <section className={`mx-auto max-w-7xl px-6 py-14`}>
      <div className={`overflow-hidden rounded-[3rem] border border-white/10 ${t.section} p-8 md:p-14`}>
        <div className={`grid items-center gap-12 md:grid-cols-2 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
          <div>
            <p className={`mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] ${t.label}`}>
              <Icon size={18} /> {label}
            </p>
            <h2 className="max-w-xl text-4xl font-black leading-tight text-white md:text-6xl">{title}</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">{text}</p>
            <button className={`mt-8 rounded-2xl px-6 py-4 font-black ${t.button} shadow-xl shadow-black/20`}>{button}</button>
          </div>

          <div className="relative min-h-[330px]">
            <div className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${t.glow} to-transparent blur-2xl`} />
            <div className="relative mx-auto max-w-[500px] rounded-[2rem] border-[10px] border-slate-950 bg-white p-5 shadow-2xl shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">A-Level Dojo</span>
              </div>
              <div className="space-y-3 text-slate-900">
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs font-bold text-slate-400">Question 7</p>
                  <p className="mt-2 font-bold">Explain how this topic links to the exam mark scheme.</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6">
                  Use keywords from the syllabus, then apply the formula, then compare your answer with the command word.
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-100 p-3 text-center text-xs font-bold">Notes</div>
                  <div className="rounded-xl bg-slate-100 p-3 text-center text-xs font-bold">Flashcards</div>
                  <div className="rounded-xl bg-slate-100 p-3 text-center text-xs font-bold">AI Quiz</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage({
  onBrowsePapers = () => {},
  onOpenAuth = () => {},
  onLogout = () => {},
  user = null,
}) {
    const isLoggedIn = Boolean(user);
  return (
  <div className="min-h-screen bg-[#060816] text-white">
    <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,92,82,0.16),transparent_26%),radial-gradient(circle_at_80%_16%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_70%_82%,rgba(34,211,238,0.08),transparent_24%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#060816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-bold text-white/65 md:flex">
            <a className="hover:text-white">Features</a>
            <a className="hover:text-white">Past Papers</a>
            <a className="hover:text-white">Subjects</a>
            <a className="hover:text-white">AI Study</a>
            <a className="hover:text-white">Dashboard</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
                <>
                <button
                    onClick={onBrowsePapers}
                    className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20"
                >
                    Open dashboard
                </button>

                <button
                    onClick={onLogout}
                    className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75 hover:bg-white/5"
                >
                    Log out
                </button>
                </>
            ) : (
                <>
                <button
                    onClick={onOpenAuth}
                    className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75 hover:bg-white/5"
                >
                    Sign in
                </button>

                <button
                    onClick={onOpenAuth}
                    className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20"
                >
                    Create account
                </button>
                </>
            )}
            </div>
          <button className="rounded-2xl border border-white/10 p-3 md:hidden">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200">
              <Sparkles size={16} /> 767+ papers across 3 exam boards
            </div>

            <h1 className="max-w-4xl text-6xl font-black leading-[0.95] tracking-tight text-white md:text-8xl">
              Revise smarter. <br />
              <span className="bg-gradient-to-r from-[#ff6a5f] via-[#f472b6] to-[#a78bfa] bg-clip-text text-transparent">
                Score higher.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-white/65">
              A-Level Dojo brings past papers, mark schemes, syllabus checklists, textbook notes, flashcards, timed mocks, and AI-guided revision into one clean dashboard.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onBrowsePapers} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-500/20">
                Browse papers
              </button>
              <button
                onClick={isLoggedIn ? onBrowsePapers : onOpenAuth}
                className="rounded-2xl border border-white/20 px-8 py-4 text-lg font-black text-white/85 hover:bg-white/5"
                >
                {isLoggedIn ? "Open dashboard" : "Create free account"}
                </button>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-4 gap-5">
              {[
                ["767+", "Papers"],
                ["9", "Subjects"],
                ["3", "Boards"],
                ["100%", "Free start"],
              ].map(([number, label], index) => (
                <div key={label}>
                  <p className={`text-3xl font-black ${index === 1 ? "text-violet-300" : index === 2 ? "text-cyan-300" : "text-rose-300"}`}>{number}</p>
                  <p className="mt-1 text-xs text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <FloatingPaperMock />
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <p className="mb-6 text-sm font-bold uppercase tracking-[0.3em] text-white/35">Exam boards</p>
          <div className="grid gap-5 md:grid-cols-3">
            {boardCards.map((board) => (
              <div key={board.name} onClick={onBrowsePapers} className={`cursor-pointer rounded-[2rem] border ${board.border} bg-gradient-to-br ${board.accent} p-8 shadow-2xl ${board.glow} transition hover:-translate-y-1 hover:bg-white/[0.02]`}>
                <p className={`mb-4 text-sm font-bold ${board.label}`}>{board.tag}</p>
                <h3 className="text-4xl font-black text-white">{board.name}</h3>
                <p className="mt-4 leading-7 text-white/55">{board.text}</p>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-white/55">
                  Open papers <ChevronDown size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <FeatureBand
          theme="cyan"
          icon={Search}
          label="Question bank"
          title="Real exam questions, not random practice."
          text="Find actual A-Level papers by board, subject, unit, year, month, paper number, and variant. Preview the question paper and mark scheme side by side, then edit the PDF with highlights, drawings, and text boxes."
          button="Start with past papers"
        />

        <FeatureBand
          theme="amber"
          icon={BookOpen}
          label="Textbooks + syllabus"
          title="Know exactly what you need to learn."
          text="Each subject can include the official syllabus, textbook sections, topic summaries, and chapter-by-chapter checklists so students stop guessing what to revise."
          button="Explore syllabus library"
          reverse
        />

        <FeatureBand
          theme="violet"
          icon={GraduationCap}
          label="Interactive lessons"
          title="Notes that teach you how to answer."
          text="Instead of only reading notes, students can open interactive lessons that explain the idea, show the exam technique, highlight common mistakes, and then give quick questions to test understanding."
          button="Try lesson mode"
        />

        <FeatureBand
          theme="green"
          icon={Brain}
          label="AI study partner"
          title="Combine topics and hit two birds with one stone."
          text="The AI study partner can go through papers with you, explain mark schemes, create flashcards, quiz weak areas, visualize tricky topics, and combine unfinished syllabus topics into one targeted revision session."
          button="Open AI revision"
          reverse
        />

        <DashboardPreview />

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-5xl font-black text-white md:text-6xl">All features</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/55">
              The homepage can end with a clean feature grid showing what already exists and what is coming next.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.07]">
                <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-rose-400/20 to-violet-400/20 p-4 text-white">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-8">
              <p className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-rose-200">
                <Zap size={18} /> Sign in flow
              </p>
              <h2 className="text-4xl font-black text-white">Clean login and locked tools.</h2>
              <p className="mt-5 leading-8 text-white/55">
                If a student tries to preview, download, edit, or save without logging in, they will see a polished sign-in-required popup. After login, the dashboard unlocks their chosen subjects.
              </p>
            </div>
            {isLoggedIn ? (
  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
    <div className="mb-5 inline-flex rounded-2xl bg-emerald-400/15 p-4 text-emerald-200">
      <CheckCircle2 size={28} />
    </div>

    <h3 className="text-3xl font-black text-white">
      You are signed in.
    </h3>

    <p className="mt-4 leading-8 text-white/55">
      Your dashboard, selected subjects, saved papers, and revision tools are ready.
    </p>

    <button
      onClick={onBrowsePapers}
      className="mt-6 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-4 font-black text-white shadow-xl shadow-violet-500/20"
    >
      Open dashboard
    </button>
  </div>
) : (
  <AuthPreview />
)}
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-20 text-center">
          <h2 className="mx-auto max-w-3xl text-5xl font-black leading-tight text-white md:text-7xl">
            Ready to build your revision dashboard?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            Start with papers today, then grow into notes, syllabus tracking, flashcards, lessons, and AI-guided revision.
          </p>
          <button onClick={onBrowsePapers} className="mt-10 rounded-2xl bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-500 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-violet-500/20">
            Open A-Level Dojo
          </button>
        </section>
      </main>
    </div>
  );
}
