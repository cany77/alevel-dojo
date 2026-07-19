import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, FileText, Layers3, ListChecks } from "lucide-react";
import Watermark from "./Watermark";
import { CursorGlow, PublicScrollProgress } from "./PublicPageEffects";

const subjects = [
  {
    id: "physics",
    name: "Physics",
    board: "OxfordAQA",
    description: "AS and A Level papers, topic tests, and revision support across mechanics, electricity, fields, waves, and particles.",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    board: "OxfordAQA",
    description: "Physical, organic, inorganic, and practical chemistry resources organized for exam-focused revision.",
  },
  {
    id: "biology",
    name: "Biology",
    board: "OxfordAQA",
    description: "Cells, molecules, genetics, physiology, ecology, and exam practice resources in one clean place.",
  },
  {
    id: "psychology",
    name: "Psychology",
    board: "OxfordAQA",
    description: "Research methods, approaches, memory, attachment, biopsychology, and psychopathology revision resources.",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    board: "Cambridge",
    description: "Programming, algorithms, computer systems, networks, databases, and variant-based paper practice.",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    board: "Edexcel",
    description: "Pure maths, statistics, mechanics, topic tests, and past-paper practice for focused A-Level revision.",
  },
  {
    id: "further-mathematics",
    name: "Further Mathematics",
    board: "Edexcel",
    description: "Complex numbers, matrices, further calculus, mechanics, and statistics resources for advanced practice.",
  },
  {
    id: "statistics",
    name: "Statistics",
    board: "Edexcel",
    description: "Data presentation, probability, distributions, hypothesis testing, correlation, and sampling resources.",
  },
  {
    id: "mechanics",
    name: "Mechanics",
    board: "Edexcel",
    description: "Kinematics, forces, moments, projectiles, work, energy, and momentum resources for exam practice.",
  },
  {
    id: "decisions",
    name: "Decisions",
    board: "Edexcel",
    description: "Decision mathematics papers covering algorithms, networks, critical path analysis, and linear programming.",
  },
  {
    id: "economics",
    name: "Economics",
    board: "Edexcel",
    description: "IAL economics papers for markets, business behaviour, macroeconomics, and the global economy.",
  },
];

const boards = ["All", "OxfordAQA", "Cambridge", "Edexcel"];
const resources = [
  [FileText, "Past papers"],
  [Layers3, "Topic tests"],
  [ListChecks, "Syllabus"],
  [BookOpen, "Notes"],
];

function Logo({ onGoHome }) {
  return (
    <button onClick={onGoHome} className="flex items-center gap-3 text-left">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-fuchsia-500 to-violet-500 font-black text-white shadow-lg shadow-rose-500/20">
        A
      </div>
      <div>
        <p className="text-lg font-black tracking-tight text-white">A-Level Dojo</p>
        <p className="-mt-1 text-[11px] font-semibold text-white/45">past papers, smarter revision</p>
      </div>
    </button>
  );
}

export default function PublicBrowsePage({
  user = null,
  onGoHome = () => {},
  onOpenAuth = () => {},
  onRequireLogin = () => {},
  onOpenPricing = () => {},
  onGoFeatures = () => {},
  onGoFaqs = () => {},
  onGoContact = () => {},
  onOpenDashboard = () => {},
  onLogout = () => {},
}) {
  const [selectedBoard, setSelectedBoard] = useState("All");
  const loggedIn = Boolean(user);

  const visibleSubjects = useMemo(() => {
    if (selectedBoard === "All") return subjects;
    return subjects.filter((subject) => subject.board === selectedBoard);
  }, [selectedBoard]);

  return (
    <div className="public-page min-h-screen overflow-x-hidden bg-[#060816] text-white">
      <PublicScrollProgress />
      <CursorGlow />
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(244,63,94,0.14),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(124,58,237,0.16),transparent_30%),radial-gradient(circle_at_68%_84%,rgba(34,211,238,0.08),transparent_26%)]" />
      <header className="fixed inset-x-0 top-[3px] z-[9998] border-b border-white/10 bg-[#060816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Logo onGoHome={onGoHome} />

          <nav className="hidden items-center gap-7 text-sm font-bold text-white/65 md:flex">
            <button className="text-white">Subjects</button>
            <button onClick={onGoFeatures} className="hover:text-white">Features</button>
            <button onClick={onOpenPricing} className="hover:text-white">Pricing</button>
            <button onClick={onGoFaqs} className="hover:text-white">FAQs</button>
            <button onClick={onGoContact} className="hover:text-white">Contact</button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {loggedIn ? (
              <>
                <button
                  onClick={onOpenDashboard}
                  className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5"
                >
                  Open dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/5"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenAuth}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/5"
                >
                  Sign in
                </button>
                <button
                  onClick={onOpenAuth}
                  className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-200 ease-out hover:-translate-y-0.5"
                >
                  Get started free
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-[73px]" aria-hidden="true" />
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-cyan-200">Public subject browser</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">
            Browse A-Level papers by subject
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/58 md:text-lg">
            See all supported boards and subjects before creating an account. Previewing, downloading, editing, and saving papers unlock after sign in.
          </p>
        </section>

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] p-1.5 shadow-2xl shadow-black/10 backdrop-blur-xl">
          {boards.map((board) => (
            <button
              key={board}
              onClick={() => setSelectedBoard(board)}
              className={`rounded-full px-5 py-2.5 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                selectedBoard === board
                  ? "bg-violet-500 text-white shadow-md shadow-violet-600/20"
                  : "text-white/58 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {board}
            </button>
          ))}
        </div>

        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">
                {selectedBoard === "All" ? "All supported subjects" : `${selectedBoard} subjects`}
              </h2>
              <p className="mt-1 text-sm text-white/42">{visibleSubjects.length} subjects available</p>
            </div>
            <button onClick={loggedIn ? onOpenDashboard : onOpenAuth} className="inline-flex items-center gap-2 text-sm font-black text-violet-200 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-white">
              {loggedIn ? "Open dashboard" : "Create a free account"} <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleSubjects.map((subject) => (
              <button
                type="button"
                key={subject.id}
                onClick={loggedIn ? onOpenDashboard : onRequireLogin}
                className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 text-left shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white/[0.055]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white">{subject.name}</h3>
                    <p className="mt-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                      {subject.board}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-400/25 via-violet-400/25 to-cyan-300/20" />
                </div>

                <p className="mt-5 min-h-24 text-sm leading-7 text-white/55">{subject.description}</p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {resources.map(([Icon, label]) => (
                    <div key={label} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/60">
                      <Icon size={14} className="text-violet-200" />
                      {label}
                    </div>
                  ))}
                </div>

                <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-4 py-2 text-sm font-black text-white/82">
                  View papers <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}







