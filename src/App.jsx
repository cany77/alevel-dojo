import React, { useEffect, useMemo, useState } from "react";
import { papers } from "./papersData";
import MockTimer from "./MockTimer";
import { supabase } from "./supabaseClient";
import AuthModal from "./AuthModal";
import PdfViewer from "./PdfViewer";
import HomePage from "./HomePage";
import LockedActionModal from "./LockedActionModal";
import Dashboard from "./Dashboard";

const subjects = [
  {
    id: "physics",
    name: "Physics",
    board: "OxfordAQA",
    description: "OxfordAQA Physics: AS Unit 1–2, A Level Unit 3–5, topic tests, and notes.",
    topics: ["Measurements and errors", "Particles and radiation", "Waves and optics", "Mechanics and materials", "Electricity", "Fields", "Nuclear physics"],
    popular: true,
  },
  {
    id: "chemistry",
    name: "Chemistry",
    board: "OxfordAQA",
    description: "OxfordAQA Chemistry: physical, organic, inorganic chemistry, practical skills, papers, and notes.",
    topics: ["Atomic structure", "Amount of substance", "Bonding", "Energetics", "Kinetics", "Organic chemistry", "Inorganic chemistry"],
    popular: true,
  },
  {
    id: "biology",
    name: "Biology",
    board: "OxfordAQA",
    description: "OxfordAQA Biology: cells, molecules, genetics, physiology, ecology, and exam practice.",
    topics: ["Cell structure", "Biological molecules", "Enzymes", "DNA and genetics", "Homeostasis", "Immunity", "Ecology"],
    popular: true,
  },
  {
    id: "psychology",
    name: "Psychology",
    board: "OxfordAQA",
    description: "OxfordAQA Psychology: research methods, approaches, memory, attachment, and psychopathology.",
    topics: ["Research methods", "Approaches", "Biopsychology", "Memory", "Attachment", "Psychopathology"],
    popular: false,
  },
  {
    id: "computer-science",
    name: "Computer Science",
    board: "Cambridge",
    description: "Cambridge Computer Science: variants 1–3, AS/A Level papers, programming, algorithms, and systems.",
    topics: ["Programming", "Data structures", "Algorithms", "Computer systems", "Networks", "Databases", "Cyber security"],
    popular: true,
  },
  {
    id: "maths",
    name: "Mathematics",
    board: "Edexcel",
    description: "Edexcel Mathematics: Pure 1–4, statistics, mechanics, topic tests, and exam practice.",
    topics: ["Algebra", "Coordinate geometry", "Trigonometry", "Differentiation", "Integration", "Statistics", "Mechanics"],
    popular: true,
  },
  {
    id: "further-maths",
    name: "Further Mathematics",
    board: "Edexcel",
    description: "Edexcel Further Mathematics: Pure 1–3, advanced algebra, calculus, mechanics, and statistics.",
    topics: ["Complex numbers", "Matrices", "Further algebra", "Further calculus", "Further mechanics", "Further statistics"],
    popular: false,
  },
  {
    id: "statistics",
    name: "Statistics",
    board: "Edexcel",
    description: "Edexcel Statistics: Statistics 1–2, probability, distributions, hypothesis testing, and data analysis.",
    topics: ["Data presentation", "Probability", "Distributions", "Hypothesis testing", "Correlation", "Sampling"],
    popular: false,
  },
  {
    id: "mechanics",
    name: "Mechanics",
    board: "Edexcel",
    description: "Edexcel Mechanics: Mechanics 1–2, forces, kinematics, moments, projectiles, energy, and momentum.",
    topics: ["Kinematics", "Forces", "Newton’s laws", "Moments", "Projectiles", "Work and energy", "Momentum"],
    popular: false,
  },
];

const boards = ["All boards", "OxfordAQA", "Cambridge", "Edexcel"];
const mainTabs = ["Papers", "Topic Tests", "Notes", "AI Tutor", "Progress"];

const examDurations = {
  "Unit 1": 90,
  "Unit 2": 90,
  "Unit 3": 105,
  "Unit 4": 105,
  "Unit 5": 105,
  "Paper 1": 75,
  "Paper 2": 75,
  "Paper 3": 105,
  "Paper 4": 105,
  "Pure 1": 90,
  "Pure 2": 90,
  "Pure 3": 90,
  "Pure 4": 90,
  "Statistics 1": 90,
  "Statistics 2": 90,
  "Mechanics 1": 90,
  "Mechanics 2": 90,
};

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

function paperId(paper) {
  return [paper.type, paper.board, paper.subject, paper.variant, paper.qualification, paper.session, paper.year, paper.unit, paper.topic, paper.questionPaper, paper.pdf]
    .filter(Boolean)
    .join("|");
}

function paperLabel(paper) {
  if (paper.type === "Topic Test") return `${paper.subject} • ${paper.topic}`;
  return `${paper.subject} • ${paper.variant ? paper.variant + " • " : ""}${paper.qualification || ""} • ${paper.session || ""} ${paper.year || ""} • ${paper.unit || ""}`;
}

export default function ALevelDojo() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showFloatingMock, setShowFloatingMock] = useState(false);
  async function loadCompletedPapers(userId) {
  const { data, error } = await supabase
    .from("completed_papers")
    .select("paper_id")
    .eq("user_id", userId);

  if (!error && data) {
    const ids = data.map((item) => item.paper_id);

    setCompletedPapers(ids);

    writeStorage("alevel-dojo-completed-papers", ids);
  }
}
async function logOut() {
  await supabase.auth.signOut();

  setUser(null);
  setShowAuthModal(false);
  setShowLockedModal(false);
}
 useEffect(() => {
  async function getSession() {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user ?? null;

    setUser(currentUser);

    if (currentUser) {
      loadCompletedPapers(currentUser.id);
    }
  }

  getSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const currentUser = session?.user ?? null;

    setUser(currentUser);

    if (currentUser) {
      loadCompletedPapers(currentUser.id);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);


  async function signUp(name = "") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: name,
      });

      setUser(data.user);
    }

    setShowAuthModal(false);
    setPage("home");
    setEmail("");
    setPassword("");
    alert("Account created");
  }

async function signIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const signedInUser = data.user;

  setUser(signedInUser);

  await supabase.from("profiles").upsert({
    id: signedInUser.id,
    email: signedInUser.email,
    last_login_at: new Date().toISOString(),
  });

  await supabase.from("login_events").insert({
    user_id: signedInUser.id,
    email: signedInUser.email,
  });

  setShowAuthModal(false);
  setShowLockedModal(false);
  setEmail("");
  setPassword("");
}

async function signOut() {
  await supabase.auth.signOut();
}
const [page, setPage] = useState("home");
const [dashboardView, setDashboardView] = useState("overview");

const [studentSubjectIds, setStudentSubjectIds] = useState(() =>
  readStorage("alevel-dojo-student-subjects", [])
);

const [editingSubjects, setEditingSubjects] = useState(() => {
  const savedSubjects = readStorage("alevel-dojo-student-subjects", []);
  return savedSubjects.length === 0;
});

const [selectedBoard, setSelectedBoard] = useState("All boards");
const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedTopic, setSelectedTopic] = useState(subjects[0].topics[0]);
  const [activeTab, setActiveTab] = useState("Papers");
  const [globalSearch, setGlobalSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [activeEditor, setActiveEditor] = useState(null);

  const [selectedVariant, setSelectedVariant] = useState("All variants");
  const [selectedQualification, setSelectedQualification] = useState("All qualifications");
  const [selectedYear, setSelectedYear] = useState("All years");
  const [selectedSession, setSelectedSession] = useState("All sessions");
  const [selectedUnit, setSelectedUnit] = useState("All units");
  const [completionFilter, setCompletionFilter] = useState("All papers");

  const [activePreview, setActivePreview] = useState(null);
  const [maximizedPreview, setMaximizedPreview] = useState(false);
  const [showMarkSchemeInMax, setShowMarkSchemeInMax] = useState(false);
  const [completedPapers, setCompletedPapers] = useState(() => readStorage("alevel-dojo-completed-papers", []));
  const [mockSettings, setMockSettings] = useState({ open: false, paper: null, extraTime: 0, duration: 0 });
  const [paperNotes, setPaperNotes] = useState(() => readStorage("alevel-dojo-paper-notes", {}));
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [favourites, setFavourites] = useState(() => readStorage("alevel-dojo-favourites", []));
  const [recent, setRecent] = useState(() => readStorage("alevel-dojo-recent", []));
  const [progress, setProgress] = useState(() => readStorage("alevel-dojo-progress", {}));

  const selectedSubjectBoard = selectedSubject.board;

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const boardMatch = selectedBoard === "All boards" || subject.board === selectedBoard;
      const textMatch = subject.name.toLowerCase().includes(subjectSearch.toLowerCase());
      return boardMatch && textMatch;
    });
  }, [selectedBoard, subjectSearch]);

  const subjectPapers = useMemo(() => {
    return papers.filter((paper) => paper.board === selectedSubject.board && paper.subject === selectedSubject.name);
  }, [selectedSubject]);

  const pastPapers = subjectPapers.filter((paper) => paper.type === "Past Paper");
  const topicTests = subjectPapers.filter((paper) => paper.type === "Topic Test");

  const availableVariants = ["All variants", ...unique(subjectPapers.map((paper) => paper.variant))];
  const availableQualifications = ["All qualifications", ...unique(subjectPapers.map((paper) => paper.qualification))];
  const availableYears = ["All years", ...unique(pastPapers.map((paper) => paper.year))];
  const availableSessions = ["All sessions", ...unique(pastPapers.map((paper) => paper.session))];
  const availableUnits = ["All units", ...unique(pastPapers.map((paper) => paper.unit))];

  const filteredPastPapers = pastPapers.filter((paper) => {
    const id = paperId(paper);
    const isCompleted = completedPapers.includes(id);
    const text = `${paper.board} ${paper.subject} ${paper.variant || ""} ${paper.qualification || ""} ${paper.session || ""} ${paper.year || ""} ${paper.unit || ""}`.toLowerCase();
    return (
      text.includes(globalSearch.toLowerCase()) &&
      (selectedVariant === "All variants" || paper.variant === selectedVariant) &&
      (selectedQualification === "All qualifications" || paper.qualification === selectedQualification) &&
      (selectedYear === "All years" || paper.year === selectedYear) &&
      (selectedSession === "All sessions" || paper.session === selectedSession) &&
      (selectedUnit === "All units" || paper.unit === selectedUnit) &&
      (completionFilter === "All papers" ||
        (completionFilter === "Complete" && isCompleted) ||
        (completionFilter === "Incomplete" && !isCompleted))
    );
  });

  const filteredTopicTests = topicTests.filter((paper) => {
    const text = `${paper.board} ${paper.subject} ${paper.variant || ""} ${paper.qualification || ""} ${paper.topic || ""} ${paper.title || ""}`.toLowerCase();
    return (
      text.includes(globalSearch.toLowerCase()) &&
      (selectedVariant === "All variants" || paper.variant === selectedVariant) &&
      (selectedQualification === "All qualifications" || paper.qualification === selectedQualification)
    );
  });

  const allVisibleCount = filteredPastPapers.length + filteredTopicTests.length;
  const progressKey = `${selectedSubject.board}-${selectedSubject.name}-${selectedTopic}`;
  const currentProgress = progress[progressKey] || 0;
  const favouriteIds = new Set(favourites.map((item) => item.id));

function chooseSubject(subject) {
  setSelectedSubject(subject);
  setSelectedTopic(subject.topics[0]);
  setActiveTab("Papers");
  setPage("library");
  setDashboardView("subject");
  clearFilters();
  closePreview();
}

function toggleStudentSubject(subjectId) {
  const alreadySelected = studentSubjectIds.includes(subjectId);

  const nextSubjects = alreadySelected
    ? studentSubjectIds.filter((id) => id !== subjectId)
    : [...studentSubjectIds, subjectId];

  setStudentSubjectIds(nextSubjects);
  writeStorage("alevel-dojo-student-subjects", nextSubjects);
}

  function clearFilters() {
    setGlobalSearch("");
    setSelectedVariant("All variants");
    setSelectedQualification("All qualifications");
    setSelectedYear("All years");
    setSelectedSession("All sessions");
    setSelectedUnit("All units");
    setCompletionFilter("All papers");
  }
  function requireLogin() {
    if (!user) {
      setShowLockedModal(true);
      return;
    }

    return true;
  }
  function openPreview(paper, previewType) {
    const id = paperId(paper);
    setActivePreview({ id, paper, previewType });
    setMaximizedPreview(false);
    setShowMarkSchemeInMax(previewType === "side-by-side");

    const item = { id, label: paperLabel(paper), board: paper.board, subject: paper.subject };
    const nextRecent = [item, ...recent.filter((entry) => entry.id !== id)].slice(0, 6);
    setRecent(nextRecent);
    writeStorage("alevel-dojo-recent", nextRecent);
  }

  function closePreview() {
    setActivePreview(null);
    setMaximizedPreview(false);
    setShowMarkSchemeInMax(false);
  }

async function toggleCompleted(paper) {
  if (!user) {
    setShowAuthModal(true);
    return;
  }

  const id = paperId(paper);

  const exists = completedPapers.includes(id);

  let next;

  if (exists) {
    next = completedPapers.filter((item) => item !== id);
  } else {
    next = [...completedPapers, id];

    await supabase.from("completed_papers").insert({
      user_id: user.id,
      paper_id: id,
    });
  }

  setCompletedPapers(next);

  writeStorage("alevel-dojo-completed-papers", next);
}

  function startMock(paper, extraTimePercent = 0) {
    const baseMinutes = examDurations[paper.unit] || 90;
    const finalMinutes = Math.round(baseMinutes * (1 + extraTimePercent / 100));
    setMockSettings({ open: true, paper, extraTime: extraTimePercent, duration: finalMinutes });
    setActivePreview({ id: paperId(paper), paper, previewType: "mock" });
    setMaximizedPreview(true);
    setShowMarkSchemeInMax(false);
  }

  function savePaperNote(paper, value) {
    const id = paperId(paper);
    const next = { ...paperNotes, [id]: value };
    setPaperNotes(next);
    writeStorage("alevel-dojo-paper-notes", next);
  }

  function closeMock() {
    setMockSettings({ open: false, paper: null, extraTime: 0, duration: 0 });
    closePreview();
  }

  function toggleFavourite(paper) {
    const id = paperId(paper);
    const exists = favourites.some((item) => item.id === id);
    const next = exists
      ? favourites.filter((item) => item.id !== id)
      : [{ id, label: paperLabel(paper), board: paper.board, subject: paper.subject }, ...favourites].slice(0, 20);
    setFavourites(next);
    writeStorage("alevel-dojo-favourites", next);
  }

  function markProgress(value) {
    const next = { ...progress, [progressKey]: value };
    setProgress(next);
    writeStorage("alevel-dojo-progress", next);
  }

  function askDemoTutor() {
    if (!aiQuestion.trim()) {
      setAiAnswer("Type a question first, for example: Explain this topic simply.");
      return;
    }
    setAiAnswer(`Demo AI answer for ${selectedSubject.name} (${selectedSubject.board}) — ${selectedTopic}: start with the definition, practise a related past-paper question, then compare against the mark scheme. Your question was: “${aiQuestion}”.`);
  }

  function PreviewPanel({ paper, previewType }) {
    const isSideBySide = previewType === "side-by-side";
    const isQuestionOnly = previewType === "question";
    const isMarkOnly = previewType === "mark-scheme";
    const isTopicTest = previewType === "topic-test";
    const isMock = previewType === "mock";
    const isEditMode = previewType === "edit";
    const containerClass = maximizedPreview
      ? "fixed inset-3 z-50 overflow-auto rounded-3xl bg-slate-950 p-5 shadow-2xl"
      : "mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4";
    const iframeClass = `${maximizedPreview ? "h-[82vh]" : "h-[680px]"} w-full rounded-xl bg-white`;

    return (
      <div className={containerClass}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-white">
            {isSideBySide && `Question + Mark Scheme: ${paperLabel(paper)}`}
            {isQuestionOnly && `Question Paper: ${paperLabel(paper)}`}
            {isMarkOnly && `Mark Scheme: ${paperLabel(paper)}`}
            {isTopicTest && `Topic Test: ${paper.topic}`}
            {isMock && `Timed Mock: ${paperLabel(paper)}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {!isMock && paper.type === "Past Paper" && (
            <button
              onClick={() => setShowFloatingMock(true)}
              className="rounded-xl bg-purple-400 px-4 py-2 font-black text-slate-950"
            >
              Timer
            </button>
            )}
            {(isSideBySide || isMock) && paper.markScheme && (
              <button onClick={() => setShowMarkSchemeInMax(!showMarkSchemeInMax)} className="rounded-lg bg-emerald-400 px-3 py-1 text-sm font-black text-slate-950">
                {showMarkSchemeInMax ? "Hide MS" : "Show MS"}
              </button>
            )}
            <button onClick={() => setMaximizedPreview(!maximizedPreview)} className="rounded-lg bg-cyan-400 px-3 py-1 text-sm font-black text-slate-950">
              {maximizedPreview ? "Minimize" : "Maximize"}
            </button>
            <button onClick={isMock ? closeMock : closePreview} className="rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-slate-200 hover:bg-white/20">Close</button>
          </div>
        </div>
{isEditMode && (
  <div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-red-300">PDF Editor</p>
        <p className="text-xs text-slate-400">
          Markings stay saved when you show or hide the mark scheme.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowMarkSchemeInMax(!showMarkSchemeInMax)}
          className={`rounded-xl px-4 py-2 font-black ${
            showMarkSchemeInMax
              ? "bg-slate-700 text-white"
              : "bg-emerald-400 text-slate-950"
          }`}
        >
          {showMarkSchemeInMax ? "Hide MS" : "Show MS"}
        </button>

      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <div>
        <p className="mb-2 font-bold text-cyan-300">Question Paper</p>
        <PdfViewer fileUrl={paper.questionPaper || paper.pdf} editable={true} />
      </div>

      <div>
        <p className="mb-2 font-bold text-emerald-300">Mark Scheme</p>

        {paper.markScheme && showMarkSchemeInMax ? (
          <PdfViewer fileUrl={paper.markScheme} editable={false} />
        ) : (
          <div className="flex h-[72vh] items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-center text-slate-400">
            <div>
              <p className="font-bold text-slate-300">Mark scheme hidden</p>
              <p className="mt-2 text-sm">Press Show MS when you need it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
        {!isEditMode && (isSideBySide || isMock) && (
          <div className={`grid gap-4 ${showMarkSchemeInMax && paper.markScheme ? "xl:grid-cols-2" : ""}`}>
            <div>
              <p className="mb-2 font-bold text-cyan-300">Question Paper</p>
              <PdfViewer fileUrl={paper.questionPaper} />
            </div>
            {showMarkSchemeInMax && (
              <div>
                <p className="mb-2 font-bold text-emerald-300">Mark Scheme</p>
              {paper.markScheme ? (
                <PdfViewer fileUrl={paper.markScheme} />
              ) : (
                <div className={`${maximizedPreview ? "h-[82vh]" : "h-[680px]"} flex items-center justify-center rounded-xl bg-white/5 text-slate-400`}>
                  No mark scheme added
                </div>
              )}              </div>
            )}
          </div>
        )}
        {paper.type === "Past Paper" && (isSideBySide || isQuestionOnly || isMock) && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-cyan-300">Saved working / notes for this paper</p>
              <p className="text-xs text-slate-400">Stays saved when you show or hide the mark scheme</p>
            </div>
            <textarea
              value={paperNotes[paperId(paper)] || ""}
              onChange={(event) => savePaperNote(paper, event.target.value)}
              placeholder="Write your working, marks, corrections, or reminders here..."
              className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
            />
          </div>
        )}

        {isQuestionOnly && (
            <PdfViewer fileUrl={paper.questionPaper} editable={false} />
          )}

          {isMarkOnly && (
            <PdfViewer fileUrl={paper.markScheme} editable={false} />
          )}

          {isTopicTest && (
            <PdfViewer fileUrl={paper.pdf} />
          )}
      </div>
    );
  }
function getBoardCardStyle(board) {
  if (board === "OxfordAQA") {
    return {
      card: "border-rose-400/30 bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-white/[0.03]",
      badge: "bg-rose-400/15 text-rose-200",
      button: "bg-rose-400 text-white hover:bg-rose-300",
    };
  }

  if (board === "Cambridge") {
    return {
      card: "border-cyan-300/30 bg-gradient-to-br from-cyan-400/25 via-cyan-400/10 to-white/[0.03]",
      badge: "bg-cyan-400/15 text-cyan-200",
      button: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
    };
  }

  if (board === "Edexcel") {
    return {
      card: "border-violet-300/30 bg-gradient-to-br from-violet-400/25 via-violet-400/10 to-white/[0.03]",
      badge: "bg-violet-400/15 text-violet-200",
      button: "bg-violet-400 text-white hover:bg-violet-300",
    };
  }

  return {
    card: "border-white/10 bg-white/[0.04]",
    badge: "bg-white/10 text-white/70",
    button: "bg-white text-slate-950",
  };
}

function DashboardOverview() {
  const selectedSubjects = subjects.filter((subject) =>
    studentSubjectIds.includes(subject.id)
  );

  const subjectsToShow =
    editingSubjects || selectedSubjects.length === 0
      ? filteredSubjects
      : selectedSubjects;

  return (
    <div>
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-rose-200">
              Dashboard
            </p>

            <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
              Choose the subjects you are actually taking.
            </h2>

            <p className="mt-4 max-w-2xl text-slate-400">
              Pick your A-Level subjects from OxfordAQA, Cambridge, and Edexcel.
              Your dashboard will then show the papers, notes, syllabus, flashcards,
              and AI tools for only those subjects.
            </p>
          </div>

          <button
            onClick={() => setEditingSubjects(!editingSubjects)}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-black text-white hover:bg-white/15"
          >
            {editingSubjects ? "Done" : "Change subjects"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.05] p-4">
            <p className="text-3xl font-black text-rose-300">
              {studentSubjectIds.length}
            </p>
            <p className="text-sm text-slate-400">Chosen subjects</p>
          </div>

          <div className="rounded-2xl bg-white/[0.05] p-4">
            <p className="text-3xl font-black text-cyan-300">
              {papers.length}
            </p>
            <p className="text-sm text-slate-400">Files loaded</p>
          </div>

          <div className="rounded-2xl bg-white/[0.05] p-4">
            <p className="text-3xl font-black text-violet-300">
              {completedPapers.length}
            </p>
            <p className="text-sm text-slate-400">Completed papers</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black text-white">
            {editingSubjects || selectedSubjects.length === 0
              ? "Select your subjects"
              : "My subjects"}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Open a subject to view its papers, topic tests, notes, progress, and AI tutor.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjectsToShow.map((subject) => {
          const style = getBoardCardStyle(subject.board);
          const isSelected = studentSubjectIds.includes(subject.id);

          return (
            <div
              key={subject.id}
              className={`rounded-[2rem] border p-5 shadow-xl transition hover:-translate-y-1 ${style.card}`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div> 
                  <h4 className="text-2xl font-black text-white">
                    {subject.name}
                  </h4>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                    {subject.description}
                  </p>
                </div>

                <span className={`rounded-full px-3 py-1 text-xs font-black ${style.badge}`}>
                  {subject.board}
                </span>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {subject.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => chooseSubject(subject)}
                  className={`rounded-xl px-4 py-2 text-sm font-black ${style.button}`}
                >
                  Open
                </button>

                <button
                  onClick={() => toggleStudentSubject(subject.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-black ${
                    isSelected
                      ? "bg-white text-slate-950"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {isSelected ? "✓ Added" : "+ Add subject"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!editingSubjects && selectedSubjects.length > 0 && (
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">
            Recommended next
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-950 p-5">
              <p className="text-xl font-black text-white">Continue a paper</p>
              <p className="mt-2 text-sm text-slate-400">
                Open your latest past paper and continue revision.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5">
              <p className="text-xl font-black text-white">Review weak topics</p>
              <p className="mt-2 text-sm text-slate-400">
                Use topic tests and notes to target unfinished syllabus areas.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5">
              <p className="text-xl font-black text-white">Ask AI tutor</p>
              <p className="mt-2 text-sm text-slate-400">
                Combine multiple topics and get quizzed step by step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  function PaperCard({ paper }) {
    const id = paperId(paper);
    const isFavourite = favouriteIds.has(id);
    const isCompleted = completedPapers.includes(id);

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="font-black">{paperLabel(paper)}</h4>
            <p className="mt-1 text-sm text-slate-400">{paper.board} • {paper.subject}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggleCompleted(paper)} className={`rounded-xl px-3 py-2 text-sm font-black ${isCompleted ? "bg-green-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
              {isCompleted ? "✓ Complete" : "Mark complete"}
            </button>
            <button onClick={() => toggleFavourite(paper)} className={`rounded-xl px-3 py-2 text-sm font-black ${isFavourite ? "bg-yellow-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
              {isFavourite ? "★ Saved" : "☆ Save"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {paper.type === "Past Paper" ? (
            <>
              <button
                onClick={() => {
                  if (!requireLogin()) return;
                  openPreview(paper, "edit");
                }}
                className="rounded-xl bg-red-500 px-4 py-2 font-black text-white hover:bg-red-400"
              >
                PDF Edit
              </button>
              <button
                onClick={() => {
                  if (!requireLogin()) return;
                  openPreview(paper, "side-by-side");
                }}
                className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950 hover:bg-cyan-300"
              >
                Preview Q + MS
              </button>
              <button
                onClick={() => {
                  if (!requireLogin()) return;
                  window.open(paper.questionPaper, "_blank");
                }}
                className="rounded-xl bg-white px-4 py-2 font-black text-slate-950"
              >
                Download Q
              </button>
              {paper.markScheme && <button
                  onClick={() => {
                    if (!requireLogin()) return;
                    window.open(paper.markScheme, "_blank");
                  }}
                  className="rounded-xl bg-white px-4 py-2 font-black text-slate-950"
                >
                  Download MS
                </button>}

            </>
          ) : (
            <>
              <button
              onClick={() => {
                if (!requireLogin()) return;
                openPreview(paper, "topic-test");
              }}
              className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950"
            >
              Preview Topic Test
            </button>
            <button
              onClick={() => {
                if (!requireLogin()) return;
                window.open(paper.pdf, "_blank");
              }}
              className="rounded-xl bg-white px-4 py-2 font-black text-slate-950"
            >
              Download
            </button>
            </>
          )}
        </div>

        {activePreview && activePreview.id === id && <PreviewPanel paper={activePreview.paper} previewType={activePreview.previewType} />}
      </div>
    );
  }

if (page === "home") {
  
  return (
    <>
    <HomePage
      user={user}
      onOpenAuth={() => setShowAuthModal(true)}
      onLogout={logOut}
      onBrowsePapers={() => {
        setPage("library");
        window.scrollTo(0, 0);
      }}
    />
      <AuthModal
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        signIn={signIn}
        signUp={signUp}
      />
            <LockedActionModal
        showLockedModal={showLockedModal}
        setShowLockedModal={setShowLockedModal}
        setShowAuthModal={setShowAuthModal}
      />
    </>
  );
}
function startFloatingMock() {
  setShowFloatingMock(true);
}
if (page === "library") {
  return (
    <Dashboard
      user={user}
      onRequireLogin={() => setShowLockedModal(true)}
    />
  );
}
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AuthModal
  showAuthModal={showAuthModal}
  setShowAuthModal={setShowAuthModal}
  email={email}
  setEmail={setEmail}
  password={password}
  setPassword={setPassword}
  signIn={signIn}
  signUp={signUp}
/>

<LockedActionModal
  showLockedModal={showLockedModal}
  setShowLockedModal={setShowLockedModal}
  setShowAuthModal={setShowAuthModal}
/>
      {showFloatingMock && (
  <MockTimer onClose={() => setShowFloatingMock(false)} />
)}
      {activeEditor && (
  <div className="fixed inset-0 z-[999999] overflow-auto bg-slate-950 p-6 text-white">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-red-300">PDF Editor</p>
        <h2 className="text-xl font-black">
          {paperLabel(activeEditor)}
        </h2>
      </div>

      <button
        onClick={() => setActiveEditor(null)}
        className="rounded-xl bg-white px-4 py-2 font-black text-slate-950"
      >
        Back to papers
      </button>
    </div>

    <div className="rounded-3xl border border-white/10 bg-slate-900 p-4">
      <p className="mb-2 font-bold text-cyan-300">Question Paper</p>

      <PdfViewer
        fileUrl={activeEditor.questionPaper || activeEditor.pdf}
        editable={true}
      />
    </div>
  </div>
)}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[99999] select-none rounded-xl bg-slate-950/40 px-3 py-1 text-sm font-black text-white/25">
  ALevelDojo by Ahmed Shantour
</div>
      <header className="border-b border-white/10 bg-slate-950/90 px-6 py-5 backdrop-blur sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <button onClick={() => setPage("home")} className="flex items-center gap-3 text-left">
            <img
              src="/logo.png"
              alt="A-Level Dojo logo"
              className="h-11 w-11 rounded-2xl object-contain"
            />
            <div>
              <h1 className="text-xl font-black tracking-tight">A-Level Dojo</h1>
              <p className="text-xs text-slate-400">Fast papers, topic tests, notes, and AI revision</p>
            </div>
          </button>
          <div className="flex flex-wrap gap-2">
            {boards.map((board) => (
              <button key={board} onClick={() => setSelectedBoard(board)} className={`rounded-full px-4 py-2 text-sm font-bold ${selectedBoard === board ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}>{board}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[360px_1fr] lg:px-16">
        <aside className="space-y-5">
          <button
  onClick={() => {
    setDashboardView("overview");
    closePreview();
  }}
  className={`w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${
    dashboardView === "overview"
      ? "border-rose-300 bg-rose-400/10"
      : "border-white/10 bg-white/[0.04] hover:border-white/25"
  }`}
>
  <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-200">
    Home
  </p>
  <h3 className="mt-2 text-xl font-black text-white">My dashboard</h3>
  <p className="mt-2 text-sm text-slate-400">
    Choose subjects and see your revision overview.
  </p>
</button>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
            <input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="Search subjects..." className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" />
            <div className="mt-4 grid gap-3">
              {filteredSubjects.map((subject) => (
                <button key={subject.id} type="button" onClick={() => chooseSubject(subject)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selectedSubject.id === subject.id ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-slate-900 hover:border-white/25"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black">{subject.name}</h3>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-cyan-200">{subject.board}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-400">{subject.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-bold text-cyan-300">Continue studying</p>
            {recent.length === 0 ? <p className="mt-3 text-sm text-slate-400">Open a paper to start tracking recent activity.</p> : recent.slice(0, 3).map((item) => <p key={item.id} className="mt-3 rounded-xl bg-slate-900 p-3 text-sm text-slate-300">{item.label}</p>)}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-bold text-yellow-300">Saved papers</p>
            {favourites.length === 0 ? <p className="mt-3 text-sm text-slate-400">Click ☆ Save on papers you want to keep.</p> : favourites.slice(0, 4).map((item) => <p key={item.id} className="mt-3 rounded-xl bg-slate-900 p-3 text-sm text-slate-300">{item.label}</p>)}
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
        {dashboardView === "overview" ? (
          <DashboardOverview />
        ) : (
          <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-3xl bg-slate-900 p-5">
            <div>
              <p className="text-sm font-bold text-cyan-300">{selectedSubject.board}</p>
              <h2 className="mt-1 text-3xl font-black">{selectedSubject.name}</h2>
              <p className="mt-2 max-w-2xl text-slate-400">{selectedSubject.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-black">{subjectPapers.length}</p><p className="text-xs text-slate-400">Files</p></div>
              <div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-black">{allVisibleCount}</p><p className="text-xs text-slate-400">Results</p></div>
              <div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-black">{currentProgress}%</p><p className="text-xs text-slate-400">Progress</p></div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {mainTabs.map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); closePreview(); }} className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeTab === tab ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-white/10"}`}>{tab}</button>
            ))}
          </div>

          {activeTab === "Papers" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <div className="grid gap-3 xl:grid-cols-6">
                <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search papers by unit, year, month, variant..." className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300 xl:col-span-6" />
                {availableVariants.length > 1 && <select value={selectedVariant} onChange={(event) => setSelectedVariant(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">{availableVariants.map((item) => <option key={item} value={item}>{item}</option>)}</select>}
                <select value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">{availableQualifications.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <select value={selectedUnit} onChange={(event) => setSelectedUnit(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">{availableUnits.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">{availableYears.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <select value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">{availableSessions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <select value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                  <option>All papers</option>
                  <option>Complete</option>
                  <option>Incomplete</option>
                </select>
                <button onClick={clearFilters} className="rounded-xl bg-white px-4 py-3 font-black text-slate-950">Clear</button>
              </div>
              <div className="mt-5 grid gap-5">
                {filteredPastPapers.length === 0 ? <p className="text-slate-400">No past papers found for this selection.</p> : filteredPastPapers.map((paper) => <PaperCard key={paperId(paper)} paper={paper} />)}
              </div>
            </div>
          )}

          {activeTab === "Topic Tests" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search topic tests..." className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" />
              <div className="mt-5 grid gap-5">
                {filteredTopicTests.length === 0 ? <p className="text-slate-400">No topic tests found for this selection.</p> : filteredTopicTests.map((paper) => <PaperCard key={paperId(paper)} paper={paper} />)}
              </div>
            </div>
          )}

          {activeTab === "Notes" && (
            <div className="grid gap-4 md:grid-cols-2">
              {selectedSubject.topics.map((topic) => (
                <button key={topic} onClick={() => setSelectedTopic(topic)} className={`rounded-2xl border p-5 text-left ${selectedTopic === topic ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-slate-900"}`}>
                  <p className="text-sm font-bold text-cyan-300">Topic note</p>
                  <h3 className="mt-1 text-xl font-black">{topic}</h3>
                  <p className="mt-2 text-sm text-slate-400">Placeholder for concise notes, formulas, common mistakes, and exam tips.</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === "AI Tutor" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
              <p className="text-sm font-bold text-cyan-300">AI tutor demo</p>
              <h3 className="mt-2 text-2xl font-black">Ask about {selectedTopic}</h3>
              <textarea value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Example: Explain this topic like I am stuck in an exam..." className="mt-4 min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" />
              <button onClick={askDemoTutor} className="mt-4 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950">Ask AI tutor</button>
              {aiAnswer && <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 leading-7 text-slate-300">{aiAnswer}</div>}
              <p className="mt-3 text-sm text-slate-400">This is a demo. A real AI tutor needs a backend and API key later.</p>
            </div>
          )}

          {activeTab === "Progress" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
              <h3 className="text-2xl font-black">Progress for {selectedTopic}</h3>
              <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${currentProgress}%` }} /></div>
              <p className="mt-3 text-lg font-black">{currentProgress}% complete</p>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                {[25, 50, 75, 100].map((value) => <button key={value} onClick={() => markProgress(value)} className="rounded-xl bg-white/10 px-4 py-2 font-bold hover:bg-white/20">Mark {value}%</button>)}
                <button onClick={() => markProgress(0)} className="rounded-xl bg-red-500/20 px-4 py-2 font-bold text-red-200 hover:bg-red-500/30">Reset</button>
              </div>
            </div>
          )}
            </>
)}  
</section>

</main>
</div>
);
}