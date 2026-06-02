import React, { useState } from "react";
import {
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
  Timer,
  Zap,
} from "lucide-react";
import Watermark from "./Watermark";
function BrowserMockup() {
  return (
    <div className="rounded-[2rem] border-[10px] border-[#030815] bg-white p-5 text-slate-950 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-black text-slate-500">A-Level Dojo</span>
      </div>
      <div className="rounded-2xl bg-slate-100 p-5">
        <p className="text-xs font-black text-slate-400">Question 7</p>
        <p className="mt-2 text-lg font-black leading-7">Explain how this topic links to the exam mark scheme.</p>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-100 p-5 text-sm leading-7">
        Use keywords from the syllabus, apply the formula, then compare your answer with the command word.
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm font-black">
        <div className="rounded-xl bg-slate-100 py-3">Notes</div>
        <div className="rounded-xl bg-slate-100 py-3">Flashcards</div>
        <div className="rounded-xl bg-slate-100 py-3">AI Quiz</div>
      </div>
    </div>
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
  const loggedIn = Boolean(user);

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    [FileText, "Real Past Papers", "Actual exam questions with question papers, mark schemes, previews, downloads, and PDF editing."],
    [BookOpen, "Textbooks + Syllabus", "Authorized syllabus checklists and textbook resources organized by subject, board, unit, and topic."],
    [Sparkles, "Exam-Technique Notes", "Short notes that summarize chapters and explain how to approach each question type."],
    [GraduationCap, "Interactive Lessons", "Lessons that explain textbook notes, exam techniques, and common mistakes step by step."],
    [Layers3, "Flashcards", "Create your own flashcards or revise from pre-made decks matched to the syllabus."],
    [Brain, "AI Study Partner", "Ask questions, go through papers, get quizzed, visualize topics, and combine topics into one revision session."],
    [Timer, "Timed Mock Mode", "Practise under timed exam conditions with extra time options and progress tracking."],
    [CheckCircle2, "Progress Dashboard", "Track completed papers, saved papers, weak topics, and subject progress in a personal dashboard."],
  ];

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,92,82,0.16),transparent_26%),radial-gradient(circle_at_80%_16%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_70%_82%,rgba(34,211,238,0.08),transparent_24%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#060816]/80 backdrop-blur-xl">
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
                <button onClick={onBrowsePapers} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5">Open dashboard</button>
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

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200"><Sparkles size={16} />767+ papers across 3 exam boards</div>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.95] tracking-tight text-white md:text-8xl">Revise smarter. <br /><span className="bg-gradient-to-r from-[#ff6a5f] via-[#f472b6] to-[#a78bfa] bg-clip-text text-transparent">Score higher.</span></h1>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-white/65">Every A-Level past paper from OxfordAQA, Cambridge, and Edexcel — with mark schemes, timed mocks, progress tracking, and revision tools in one clean place.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onBrowsePapers} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5">Browse papers</button>
              <button onClick={loggedIn ? onBrowsePapers : onOpenAuth} className="rounded-2xl border border-white/20 px-8 py-4 text-lg font-black text-white/85 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/5">{loggedIn ? "Open dashboard" : "Create account"}</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-cyan-200"><CalendarDays size={17} />Closest exam</div>
            <div className="grid grid-cols-4 gap-3">{[["Days", "05"], ["Hours", "08"], ["Mins", "32"], ["Secs", "47"]].map(([label, value]) => (<div key={label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-center"><p className="text-3xl font-black text-white">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}</p></div>))}</div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center"><p className="text-sm font-black text-white">Physics • Unit 3 Fields and their consequences</p><p className="mt-1 text-xs text-white/45">OxfordAQA • 1 June 2026</p></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
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

        <section className="mx-auto max-w-6xl rounded-[2.5rem] border border-cyan-300/10 bg-cyan-400/5 px-8 py-12 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-400/[0.07]">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-cyan-200"><Search size={16} />Question bank</p>
              <h2 className="text-5xl font-black leading-tight text-white">Real exam questions, not random practice.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">Find actual A-Level papers by board, subject, unit, year, month, paper number, and variant. Preview the question paper and mark scheme side by side, then edit the PDF with highlights, drawings, and text boxes.</p>
              <button onClick={onBrowsePapers} className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-cyan-300 px-7 py-4 font-black text-slate-950">Start with past papers</button>
            </div>
            <BrowserMockup />
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl rounded-[2.5rem] border border-yellow-300/10 bg-yellow-400/5 px-8 py-12 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-yellow-400/[0.07]">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <BrowserMockup />
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-yellow-200"><BookOpen size={16} />Textbooks + syllabus</p>
              <h2 className="text-5xl font-black leading-tight text-white">Know exactly what you need to learn.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">Each subject can include the official syllabus, textbook sections, topic summaries, and chapter-by-chapter checklists so students stop guessing what to revise.</p>
              <button className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-yellow-300 px-7 py-4 font-black text-slate-950">Explore syllabus library</button>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl rounded-[2.5rem] border border-violet-300/10 bg-violet-500/5 px-8 py-12 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-violet-500/[0.07]">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-violet-200"><GraduationCap size={16} />Interactive lessons</p>
              <h2 className="text-5xl font-black leading-tight text-white">Notes that teach you how to answer.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">Instead of only reading notes, students can open interactive lessons that explain the idea, show the exam technique, highlight common mistakes, and then give quick questions to test understanding.</p>
              <button className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-violet-300 px-7 py-4 font-black text-slate-950">Try lesson mode</button>
            </div>
            <BrowserMockup />
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl rounded-[2.5rem] border border-emerald-300/10 bg-emerald-400/5 px-8 py-12 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-400/[0.07]">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <BrowserMockup />
            <div>
              <p className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-emerald-200"><Brain size={16} />AI study partner</p>
              <h2 className="text-5xl font-black leading-tight text-white">Combine topics and hit two birds with one stone.</h2>
              <p className="mt-6 text-base leading-8 text-white/55">The AI study partner can go through papers with you, explain mark schemes, create flashcards, quiz weak areas, visualize tricky topics, and combine unfinished syllabus topics into one targeted revision session.</p>
              <button className="mt-7 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-0.5 bg-emerald-300 px-7 py-4 font-black text-slate-950">Open AI revision</button>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-24">
          <div className="mb-12 text-center"><h2 className="text-6xl font-black text-white">All features</h2><p className="mt-5 text-lg text-white/50">The homepage can end with a clean feature grid showing what already exists and what is coming next.</p></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map(([Icon, title, text]) => (<div key={title} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.06]"><div className="mb-6 inline-flex rounded-2xl bg-rose-400/15 p-4 text-white"><Icon size={24} /></div><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-4 text-sm leading-7 text-white/45">{text}</p></div>))}
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
                {loggedIn ? (<div><div className="mb-5 inline-flex rounded-2xl bg-emerald-400/15 p-4 text-emerald-200"><CheckCircle2 size={28} /></div><h3 className="text-3xl font-black text-white">You are signed in.</h3><p className="mt-4 leading-8 text-white/55">Your dashboard, selected subjects, saved papers, and revision tools are ready.</p><button onClick={onBrowsePapers} className="mt-6 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-4 font-black text-white shadow-xl shadow-violet-500/20">Open dashboard</button></div>) : (<><div className="mb-5 grid grid-cols-2 rounded-2xl bg-white/[0.06] p-1"><button type="button" onClick={() => setAuthMode("signin")} className={`rounded-xl py-3 text-sm font-black ${authMode === "signin" ? "bg-[#ff554f] text-white" : "text-white/45"}`}>Sign in</button><button type="button" onClick={() => setAuthMode("signup")} className={`rounded-xl py-3 text-sm font-black ${authMode === "signup" ? "bg-[#ff554f] text-white" : "text-white/45"}`}>Sign up</button></div>{authMode === "signup" && (<input
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Your name"
  className="mb-3 w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-rose-300"
/>)}<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Email address"
  className="mb-3 w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-rose-300"
/><input
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  type="password"
  placeholder="Password"
  className="mb-4 w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-rose-300"
/><button onClick={() => {
  if (authMode === "signin") {
    signIn();
  } else {
    signUp(name);
  }
}} className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-4 font-black text-white shadow-lg shadow-violet-500/20">{authMode === "signin" ? "Sign in" : "Create account"}</button></>)}
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
              <button onClick={loggedIn ? onGoDashboard : onOpenAuth} className="text-left hover:text-white">Dashboard</button>
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
