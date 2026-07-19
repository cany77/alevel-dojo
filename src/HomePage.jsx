import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  Layers3,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import Watermark from "./Watermark";
import ContactForm from "./ContactForm";
import { examDates } from "./data/examDates";
import { supabase } from "./supabaseClient";
import { logAuthDiagnostic } from "./authDiagnostics";
import useResendCooldown from "./useResendCooldown";
import PasswordInput from "./PasswordInput";
import { CursorGlow, PublicScrollProgress } from "./PublicPageEffects";

function examStartDate(exam) {
  const time = exam.time || "00:00";
  return new Date(`${exam.date}T${time}:00`);
}

function findClosestFutureExam(now = new Date()) {
  return examDates
    .filter((exam) => exam?.date && examStartDate(exam).getTime() > now.getTime())
    .sort((a, b) => examStartDate(a).getTime() - examStartDate(b).getTime())[0] || null;
}

function countdownParts(exam, now = new Date()) {
  if (!exam) return { days: "00", hours: "00", mins: "00", secs: "00" };

  const diff = Math.max(0, examStartDate(exam).getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    mins: String(mins).padStart(2, "0"),
    secs: String(secs).padStart(2, "0"),
  };
}

function formatExamDate(exam) {
  return examStartDate(exam).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function BrowserMockup({ mode = "papers" }) {
  const labels = {
    papers: ["Past Papers", "Paper, mark scheme, insert, and PDF Edit", ["Question", "MS", "Edit"]],
    tests: ["Topic Tests", "Unit sliders with focused topic tests", ["Unit 1", "Paper 2", "Formula"]],
    boundaries: ["Grade Tools", "Raw marks, predictions, and UMS support", ["A* line", "UMS", "Trend"]],
    dashboard: ["Student Home", "Subjects, papers, calendar, and progress", ["Physics", "Maths", "Saved"]],
  };
  const [label, headline, chips] = labels[mode] || labels.papers;

  return (
    <div className="public-product-frame p-4 md:p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-xs font-black text-cyan-100">A-Level Dojo</span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{label}</p>
        <p className="mt-2 text-lg font-black leading-7">{headline}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm font-black text-white">
        {chips.map((item) => <div key={item} className="rounded-xl border border-white/10 bg-white/[0.055] py-3">{item}</div>)}
      </div>
      <div className="mt-4 rounded-2xl bg-white p-4 text-slate-950">
        <div className="mb-3 h-2 w-2/3 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-200" />
          <div className="h-2 rounded-full bg-slate-200" />
          <div className="h-2 w-3/4 rounded-full bg-slate-200" />
        </div>
        <div className="mt-5 h-14 rounded-2xl border-2 border-cyan-400/70 bg-cyan-200/30" />
      </div>
    </div>
  );
}

function FeatureMarquee() {
  const items = ["OxfordAQA Physics", "Cambridge Computer Science", "Edexcel Mathematics", "Formula books", "PDF annotations", "Grade boundaries", "UMS calculator", "Topic tests", "Exam calendar", "Mistakes tracker", "Saved papers", "Mark schemes"];
  return (
    <section className="public-marquee" aria-label="A-Level Dojo tools">
      <div className="public-marquee-track">
        {[...items, ...items].map((item, index) => <span key={`${item}-${index}`} className="public-marquee-pill"><span />{item}</span>)}
      </div>
    </section>
  );
}

function HomePageUpgradePreview({
  user = null,
  email = "",
  setEmail = () => {},
  password = "",
  setPassword = () => {},
  signIn = () => {},
  signUp = () => {},
  onBrowsePapers = () => {},
  onOpenPublicBrowse = () => {},
  onOpenPricing = () => {},
  onGoDashboard = () => {},
  onOpenLegal = () => {},
  onOpenAuth = () => {},
  onLogout = () => {},
}) {
  const [openFaq, setOpenFaq] = useState(0);
  const [authMode, setAuthMode] = useState("signin");
  const [name, setName] = useState("");
  const [inlineAuthStatus, setInlineAuthStatus] = useState("idle");
  const [inlineAuthMessage, setInlineAuthMessage] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [inlineConfirmPassword, setInlineConfirmPassword] = useState("");
  const { secondsRemaining, startCooldown, coolingDown } = useResendCooldown();
  const [now, setNow] = useState(() => new Date());
  const loggedIn = Boolean(user);
  const closestExam = useMemo(() => findClosestFutureExam(now), [now]);
  const countdown = countdownParts(closestExam, now);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const upcomingCount = examDates.filter(
      (exam) => exam?.date && examStartDate(exam).getTime() > Date.now()
    ).length;
    console.log("[A-Level Dojo] upcoming exams:", upcomingCount);
  }, []);

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changeInlineAuthMode(nextMode) {
    setAuthMode(nextMode);
    setInlineConfirmPassword("");
    setInlineAuthStatus("idle");
    setInlineAuthMessage("");
  }

  async function handleInlineAuth() {
    if (password !== inlineConfirmPassword) {
      setInlineAuthStatus("error");
      setInlineAuthMessage("Passwords do not match.");
      return;
    }

    if (authMode === "signin") {
      setInlineAuthStatus("loading");
      setInlineAuthMessage("");
      const result = await signIn();
      if (!result?.ok) {
        setInlineAuthStatus("error");
        setInlineAuthMessage(result?.error || "Could not sign in.");
      }
      return;
    }

    setInlineAuthStatus("loading");
    setInlineAuthMessage("");
    const result = await signUp(name);
    if (!result?.ok) {
      setInlineAuthStatus("error");
      setInlineAuthMessage(result?.error || "Could not create your account.");
      return;
    }
    if (result.requiresConfirmation) {
      setConfirmationEmail(result.email || email.trim());
      setInlineAuthStatus("confirmation");
      setInlineAuthMessage("Check your email to confirm your account.");
    }
  }

  async function resendInlineConfirmation() {
    const targetEmail = confirmationEmail || email.trim();
    if (coolingDown) return;
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    startCooldown();
    setInlineAuthStatus("loading");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo },
    });
    logAuthDiagnostic("inline confirmation resend response", {
      hasError: Boolean(error),
      errorMessage: error?.message || null,
      origin: window.location.origin,
      redirectUrl: emailRedirectTo,
    });
    setInlineAuthStatus(error ? "error" : "confirmation");
    setInlineAuthMessage(error ? "We could not resend the email. Please wait and try again when the timer ends." : "Confirmation email resent. Check your inbox and spam.");
  }

  const boards = [
    [
      "International AQA",
      "OxfordAQA",
      "Past papers, mark schemes, topic tests, and syllabus resources.",
      "border-rose-400/35 bg-[radial-gradient(circle_at_18%_12%,rgba(244,63,94,0.24),transparent_34%),linear-gradient(135deg,rgba(244,63,94,0.17),rgba(15,23,42,0.55)_54%,rgba(76,29,149,0.13))] shadow-rose-500/10",
    ],
    [
      "CAIE",
      "Cambridge",
      "Variant-based papers with organized units, years, and topic practice.",
      "border-cyan-300/35 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.22),transparent_34%),linear-gradient(135deg,rgba(6,182,212,0.15),rgba(15,23,42,0.6)_54%,rgba(14,165,233,0.12))] shadow-cyan-500/10",
    ],
    [
      "Pearson",
      "Edexcel",
      "Cleanly sorted papers, textbooks, notes, and revision pathways.",
      "border-violet-300/35 bg-[radial-gradient(circle_at_18%_12%,rgba(167,139,250,0.22),transparent_34%),linear-gradient(135deg,rgba(124,58,237,0.16),rgba(15,23,42,0.56)_54%,rgba(88,28,135,0.18))] shadow-violet-500/10",
    ],
  ];

  const faqs = [
    ["Why is A-Level Dojo better than a normal AI?", "Because A-Level Dojo is built around A-Level revision: past papers, mark schemes, syllabus checklists, topic tests, notes, flashcards, and progress tracking. It is made for exam practice, not random general answers."],
    ["Can I use it without an account?", "You can browse the homepage and see available subjects. To preview, download, edit PDFs, save papers, or track progress, you create a free account."],
    ["What subjects do you cover?", "OxfordAQA, Cambridge, and Edexcel subjects, including Physics, Chemistry, Biology, Psychology, Computer Science, Mathematics, Further Maths, Statistics, and Mechanics."],
    ["Is it really free?", "The core account can start free. Premium features like the personalized AI tutor, advanced mistake tracking, and deeper analytics can be added later as paid upgrades."],
  ];

  const features = [
    [FileText, "Past papers", "Browse papers with mark schemes, inserts, formula books, PDF editing, saved papers, and completion tracking.", "Available"],
    [BarChart3, "Grade boundaries", "View raw-mark trends, prediction points, exact tooltips, and UMS or threshold calculators where data exists.", "Available"],
    [Layers3, "Topic tests", "Practise with generated topic-test libraries grouped by selected subjects and units.", "Available"],
    [CalendarDays, "Exam calendar", "Official timetable data and personal revision events filtered by selected subjects.", "Premium"],
    [CheckCircle2, "Mistakes tracker", "Log mistakes, correct methods, review status, and unresolved counts.", "Premium"],
    [Brain, "AI Tutor", "Personalised tutoring and explanations are planned behind the premium paywall.", "Coming soon"],
    [GraduationCap, "Interactive lessons", "Guided lessons and worked revision flows are planned as the learning layer expands.", "Coming soon"],
    [BookOpen, "Notes and textbooks", "Subject notes, textbook links, and syllabus resources can slot into this same public layout.", "Coming soon"],
  ];

  return (
    <div className="public-page min-h-screen overflow-x-hidden bg-[#060816] text-white">
      <PublicScrollProgress />
      <CursorGlow />
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,92,82,0.16),transparent_26%),radial-gradient(circle_at_80%_16%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_70%_82%,rgba(34,211,238,0.08),transparent_24%)]" />

      <header className="fixed inset-x-0 top-[2px] z-[9998] border-b border-white/10 bg-[#060816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 font-black text-white shadow-lg shadow-rose-500/20">A</div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">A-Level Dojo</p>
              <p className="-mt-1 text-[11px] text-white/45">past papers, smarter revision</p>
            </div>
          </button>
          <nav className="hidden items-center gap-7 text-sm font-bold text-white/65 md:flex">
            <button onClick={onOpenPublicBrowse} className="hover:text-white">Subjects</button>
            <button onClick={() => scrollToSection("features")} className="hover:text-white">Features</button>
            <button onClick={onOpenPricing} className="hover:text-white">Pricing</button>
            <button onClick={() => scrollToSection("faqs")} className="hover:text-white">FAQs</button>
            <button onClick={() => scrollToSection("contact")} className="hover:text-white">Contact</button>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {loggedIn ? (
              <>
                <button onClick={onBrowsePapers} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5">Open Home</button>
                <button onClick={onLogout} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/5">Log out</button>
              </>
            ) : (
              <>
                <button onClick={onOpenAuth} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/5">Sign in</button>
                <button onClick={onOpenAuth} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5">Get started free</button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-[72px]" aria-hidden="true" />

      <main className="public-grid-opening relative z-10">
        <section className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200"><Sparkles size={16} />767+ papers across 3 exam boards</div>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.95] tracking-tight text-white md:text-8xl">Revise smarter. <br /><span className="bg-gradient-to-r from-[#ff6a5f] via-[#f472b6] to-[#a78bfa] bg-clip-text text-transparent">Score higher.</span></h1>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-white/65">Every A-Level past paper from OxfordAQA, Cambridge, and Edexcel — with mark schemes, timed mocks, progress tracking, and revision tools in one clean place.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onBrowsePapers} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5">Browse papers</button>
              <button onClick={loggedIn ? onBrowsePapers : onOpenAuth} className="rounded-2xl border border-white/20 px-8 py-4 text-lg font-black text-white/85 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/5">{loggedIn ? "Open Home" : "Create account"}</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-cyan-200"><CalendarDays size={17} />Closest exam</div>
            {closestExam ? (
              <>
                <div className="grid grid-cols-4 gap-3">{[["Days", countdown.days], ["Hours", countdown.hours], ["Mins", countdown.mins], ["Secs", countdown.secs]].map(([label, value]) => (<div key={label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-center"><p className="text-3xl font-black text-white">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}</p></div>))}</div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center"><p className="text-sm font-black text-white">{closestExam.subject} • {closestExam.paper || closestExam.unit || "Exam"}</p><p className="mt-1 text-xs text-white/45">{closestExam.board} • {formatExamDate(closestExam)}</p></div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-center">
                <p className="text-sm font-black text-white">No upcoming exams added yet</p>
                <p className="mt-2 text-xs leading-6 text-white/45">Add official timetable HTML files and regenerate the exam calendar data.</p>
              </div>
            )}
          </div>
        </section>

                <FeatureMarquee />
      </main>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 md:pt-16">
          <p className="mb-8 text-sm font-black uppercase tracking-[0.45em] text-white/35">Exam boards</p>
          <div className="grid gap-8 md:grid-cols-3">
            {boards.map(([tag, title, text, color]) => (
              <button key={title} onClick={onBrowsePapers} className={`min-h-[285px] rounded-[2rem] border p-10 text-left shadow-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.045] ${color}`}>
                <p className="text-sm font-black text-white/70">{tag}</p>
                <h3 className="mt-5 text-4xl font-black text-white">{title}</h3>
                <p className="mt-5 max-w-sm text-lg leading-8 text-white/50">{text}</p>
                <p className="mt-10 inline-flex items-center gap-2 text-sm font-black text-white/55">
                  Open papers <ChevronDown size={16} />
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] rounded-[2rem] border border-cyan-300/10 bg-cyan-400/5 px-6 py-8 md:px-10 md:py-10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-400/[0.07]">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-cyan-200"><Search size={16} />Question bank</p>
              <h2 className="text-4xl font-black leading-tight text-white md:text-[42px]">Real exam questions, not random practice.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">Find actual A-Level papers by board, subject, unit, year, month, paper number, and variant. Preview the question paper and mark scheme side by side, then edit the PDF with highlights, drawings, and text boxes.</p>
              <button onClick={onBrowsePapers} className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-cyan-300 px-7 py-4 font-black text-slate-950">Start with past papers</button>
            </div>
            <BrowserMockup mode="papers" />
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-[1120px] rounded-[2rem] border border-yellow-300/10 bg-yellow-400/5 px-6 py-8 md:px-10 md:py-10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-yellow-400/[0.07]">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <BrowserMockup mode="tests" />
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-yellow-200"><Layers3 size={16} />Topic tests + formula sheets</p>
              <h2 className="text-4xl font-black leading-tight text-white md:text-[42px]">Practise by unit without digging through folders.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">Topic tests use the same clean subject structure as past papers, with space for formula sheets, inserts, and focused practice files as the library grows.</p>
              <button className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-yellow-300 px-7 py-4 font-black text-slate-950">Explore topic tests</button>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-[1120px] rounded-[2rem] border border-violet-300/10 bg-violet-500/5 px-6 py-8 md:px-10 md:py-10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-violet-500/[0.07]">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-violet-200"><BarChart3 size={16} />Grade boundaries + UMS</p>
              <h2 className="text-4xl font-black leading-tight text-white md:text-[42px]">Turn raw marks into realistic targets.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">The graph page shows historical raw-mark boundaries, predictions, exact hover tooltips, and UMS or threshold calculators where official data exists.</p>
              <button className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-violet-300 px-7 py-4 font-black text-slate-950">View grade tools</button>
            </div>
            <BrowserMockup mode="boundaries" />
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-[1120px] rounded-[2rem] border border-emerald-300/10 bg-emerald-400/5 px-6 py-8 md:px-10 md:py-10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-400/[0.07]">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <BrowserMockup mode="dashboard" />
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-emerald-200"><GraduationCap size={16} />One organised revision Home</p>
              <h2 className="text-4xl font-black leading-tight text-white md:text-[42px]">One organised place to pick up the next useful task.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">Your Home keeps selected subjects, recommended papers, continue revision, upcoming exams, saved papers, and premium tools close without clutter.</p>
              <button className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-emerald-300 px-7 py-4 font-black text-slate-950">Open Home</button>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-24">
          <div className="mb-12 text-center"><h2 className="text-4xl font-black text-white md:text-6xl">All features</h2><p className="mt-5 text-lg text-white/50">Available tools stay clear, and coming-soon tools are labelled instead of pretending to be finished.</p></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map(([Icon, title, text, status]) => (<div key={title} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.06]"><div className="mb-5 flex items-center justify-between gap-3"><div className="inline-flex rounded-2xl bg-rose-400/15 p-3 text-white"><Icon size={22} /></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${status === "Available" ? "bg-cyan-400/15 text-cyan-100" : status === "Premium" ? "bg-violet-400/15 text-violet-100" : "bg-white/10 text-white/45"}`}>{status}</span></div><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-4 text-sm leading-7 text-white/45">{text}</p></div>))}
          </div>
        </section>


        <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-24">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-200">Pick a plan</p>
              <h2 className="mt-3 text-4xl font-black text-white md:text-6xl">Start free, upgrade when revision gets serious.</h2>
            </div>
            <button type="button" onClick={onOpenPricing} className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15">Open full pricing</button>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ["Free", "$0", "start now", "Browse, try the core workflow, and keep revision organised with starter limits.", ["Browse public subjects", "Limited weekly downloads", "Limited PDF editing", "Starter saved papers"], "border-white/10 bg-white/[0.035]", "Start free"],
              ["Dojo Plus", "$7.99", "per month", "Full access for everyday revision across papers, exports, trackers, and premium tools.", ["Unlimited paper workflow", "PDF export", "Exam calendar", "Mistakes tracker", "Advanced grade tools"], "border-violet-300/35 bg-violet-400/10 shadow-violet-500/20", "Upgrade to Plus", true],
              ["Exam Season Pass", "$32.99", "one-time", "Full access through 30 June 2026 without a subscription.", ["One payment", "Full premium access", "Built for exam season", "Private Founder plan stays hidden"], "border-cyan-300/35 bg-cyan-400/10 shadow-cyan-500/20", "Get season pass"],
            ].map(([name, price, cadence, description, points, tone, cta, featured]) => (
              <article key={name} className={`relative rounded-[2rem] border p-6 shadow-2xl ${tone}`}>
                {featured && <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-violet-400 to-rose-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Popular</span>}
                <h3 className="text-2xl font-black text-white">{name}</h3>
                <div className="mt-5 flex items-end gap-2"><span className="text-5xl font-black text-white">{price}</span><span className="pb-2 text-sm font-bold text-white/45">{cadence}</span></div>
                <p className="mt-5 min-h-16 text-sm leading-7 text-white/55">{description}</p>
                <div className="mt-6 space-y-3">{points.map((point) => <p key={point} className="flex items-center gap-2 text-sm font-bold text-white/70"><CheckCircle2 size={16} className="text-cyan-200" />{point}</p>)}</div>
                <button type="button" onClick={name === "Free" && !loggedIn ? onOpenAuth : onOpenPricing} className={`mt-7 w-full rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${featured ? "bg-gradient-to-r from-violet-400 to-rose-400 text-white shadow-lg shadow-violet-500/20" : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"}`}>{cta}</button>
              </article>
            ))}
          </div>
        </section>
        <section id="faqs" className="mx-auto max-w-5xl px-6 py-20 scroll-mt-24">
          <div className="mb-10 text-center"><h2 className="text-4xl font-black text-white md:text-6xl">Frequently asked <span className="bg-gradient-to-r from-rose-300 to-violet-300 bg-clip-text text-transparent">questions</span></h2><p className="mt-4 text-white/50">Everything students need to know before they start.</p></div>
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
            {faqs.map(([q, a], index) => { const isOpen = openFaq === index; return (<div key={q} className="border-b border-white/10 last:border-b-0"><button onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"><span className="font-black text-white">{q}</span><ChevronDown className={`shrink-0 text-violet-300 transition ${isOpen ? "rotate-180" : ""}`} size={20} /></button>{isOpen && <div className="px-6 pb-6 text-sm leading-7 text-white/55">{a}</div>}</div>); })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/25">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-slate-950/45 p-8"><p className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-rose-200"><Zap size={18} />Sign in flow</p><h2 className="text-4xl font-black text-white">Clean login and locked tools.</h2><p className="mt-5 leading-8 text-white/55">If a student tries to preview, download, edit, or save without logging in, they see a polished sign-in-required popup.</p></div>
              <div className="p-8">
                {loggedIn ? (<div><div className="mb-5 inline-flex rounded-2xl bg-emerald-400/15 p-4 text-emerald-200"><CheckCircle2 size={28} /></div><h3 className="text-3xl font-black text-white">You are signed in.</h3><p className="mt-4 leading-8 text-white/55">Home, selected subjects, saved papers, and revision tools are ready.</p><button onClick={onBrowsePapers} className="mt-6 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-4 font-black text-white shadow-xl shadow-violet-500/20">Open Home</button></div>) : (<><div className="mb-5 grid grid-cols-2 rounded-2xl bg-white/[0.06] p-1"><button type="button" onClick={() => changeInlineAuthMode("signin")} className={`rounded-xl py-3 text-sm font-black ${authMode === "signin" ? "bg-[#ff554f] text-white" : "text-white/45"}`}>Sign in</button><button type="button" onClick={() => changeInlineAuthMode("signup")} className={`rounded-xl py-3 text-sm font-black ${authMode === "signup" ? "bg-[#ff554f] text-white" : "text-white/45"}`}>Sign up</button></div>{authMode === "signup" && (<input
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Your name"
  className="mb-3 w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-rose-300"
/>)}<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Email address"
  className="mb-3 w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-rose-300"
/><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} className="mb-3" inputClassName="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 pr-12 text-white outline-none placeholder:text-white/30 focus:border-rose-300" /><PasswordInput value={inlineConfirmPassword} onChange={(e) => setInlineConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} className="mb-4" inputClassName="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 pr-12 text-white outline-none placeholder:text-white/30 focus:border-rose-300" /><button type="button" disabled={inlineAuthStatus === "loading"} onClick={handleInlineAuth} className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-4 font-black text-white shadow-lg shadow-violet-500/20 disabled:cursor-wait disabled:opacity-60">{inlineAuthStatus === "loading" ? "Please wait..." : authMode === "signin" ? "Sign in" : "Create account"}</button>{inlineAuthMessage && <p role="status" className={`mt-3 rounded-xl border p-3 text-sm ${inlineAuthStatus === "error" ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"}`}>{inlineAuthMessage}</p>}{inlineAuthStatus === "confirmation" && <button type="button" disabled={coolingDown} onClick={resendInlineConfirmation} className="mt-3 w-full rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-400/15 disabled:cursor-wait disabled:opacity-60">{coolingDown ? `Resend again in ${secondsRemaining}s` : "Resend confirmation email"}</button>}</>)}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="relative z-10 scroll-mt-24 border-t border-white/10 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className="text-lg font-black text-white">A-Level Dojo</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/45">Past papers, mark schemes, topic tests, notes, and progress tools for smarter A-Level revision.</p>
          </div>
          <div>
            <h4 className="font-black text-white">Platform</h4>
            <div className="mt-4 grid gap-2 text-left text-sm text-white/45">
              <button onClick={onBrowsePapers} className="text-left hover:text-white">Past papers</button>
              <button onClick={onBrowsePapers} className="text-left hover:text-white">Topic tests</button>
              <button onClick={loggedIn ? onGoDashboard : onOpenAuth} className="text-left hover:text-white">Home</button>
              <button onClick={onOpenPricing} className="text-left hover:text-white">Pricing</button>
            </div>
          </div>
          <div>
            <h4 className="font-black text-white">Resources</h4>
            <div className="mt-4 grid gap-2 text-left text-sm text-white/45">
              <button onClick={() => scrollToSection("faqs")} className="text-left hover:text-white">FAQs</button>
              <button onClick={() => scrollToSection("features")} className="text-left hover:text-white">Revision tips</button>
              <button onClick={onBrowsePapers} className="text-left hover:text-white">Exam guides</button>
              <button onClick={onOpenPublicBrowse} className="text-left hover:text-white">Subjects</button>
            </div>
          </div>
          <div>
            <h4 className="font-black text-white">Contact</h4>
            <div className="mt-4 grid gap-2 text-left text-sm text-white/45">
              <a href="mailto:support@aleveldojo.com" className="hover:text-white">support@aleveldojo.com</a>
              <button onClick={() => onOpenLegal("privacy")} className="text-left hover:text-white">Privacy Policy</button>
              <button onClick={() => onOpenLegal("terms")} className="text-left hover:text-white">Terms</button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl">
          <ContactForm />
        </div>
      </footer>
    </div>
  );
}

export default function HomePage({
  user = null,
  email = "",
  setEmail = () => {},
  password = "",
  setPassword = () => {},
  signIn = () => {},
  signUp = () => {},
  onBrowsePapers = () => {},
  onOpenPublicBrowse = () => {},
  onOpenPricing = () => {},
  onGoDashboard = () => {},
  onOpenLegal = () => {},
  onOpenAuth = () => {},
  onLogout = () => {},
}) {
  return (
    <HomePageUpgradePreview
      user={user}
      onBrowsePapers={onBrowsePapers}
      onOpenPublicBrowse={onOpenPublicBrowse}
      onOpenPricing={onOpenPricing}
      onGoDashboard={onGoDashboard}
      onOpenLegal={onOpenLegal}
      onOpenAuth={onOpenAuth}
      onLogout={onLogout}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      signIn={signIn}
      signUp={signUp}
    />
  );
}












