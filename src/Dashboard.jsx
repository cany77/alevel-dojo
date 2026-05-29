import { papers } from "./papersData";
import { supabase } from "./supabaseClient";
import PdfViewer from "./PdfViewer";
import Watermark from "./Watermark";
import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  FileText,
  Home,
  Layers3,
  LibraryBig,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Timer,
  X,
  Download,
  Edit3,
  Eye,
  ArrowLeft,
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
function allSubjects() {
  return subjectGroups.flatMap((group) =>
    group.subjects.map((subject) => ({ ...subject, board: group.board }))
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 text-sm font-black text-white shadow-lg shadow-rose-500/20">
        A
      </div>
      <div>
        <p className="text-base font-black tracking-tight text-white">A-Level Dojo</p>
        <p className="-mt-1 text-[11px] text-white/40">dashboard preview</p>
      </div>
    </div>
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

function SelectedSubjectCard({ subject, onOpen }) {
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
function PastPapersPanel({ subject }) {
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
                          onClick={() => toggleCompleted(paper)}
                          className={`rounded-xl px-4 py-2 text-sm font-black ${
                            isCompleted
                              ? "bg-green-300 text-slate-950"
                              : "bg-white/[0.08] text-white/75 hover:bg-white/[0.12]"
                          }`}
                        >
                          {isCompleted ? "✓ Complete" : "Mark complete"}
                        </button>

                        <button
                          onClick={() => toggleSaved(paper)}
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
                        onClick={() => {
                          setActivePreview({ paper, mode: "preview" });
                          setShowMarkScheme(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                      >
                        <Eye size={16} />
                        Preview Q + MS
                      </button>

                      <button
                        onClick={() => {
                          setActivePreview({ paper, mode: "edit" });
                          setShowMarkScheme(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white hover:brightness-110"
                      >
                        <Edit3 size={16} />
                        PDF Edit
                      </button>

                      {paper.questionPaper && (
                        <button
                          onClick={() =>
                            window.open(paper.questionPaper, "_blank")
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
                            window.open(paper.markScheme, "_blank")
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
function TopicTestsPanel({ subject }) {
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
                          onClick={() => toggleCompleted(paper)}
                          className={`rounded-xl px-4 py-2 text-sm font-black ${
                            isCompleted
                              ? "bg-green-300 text-slate-950"
                              : "bg-white/[0.08] text-white/75 hover:bg-white/[0.12]"
                          }`}
                        >
                          {isCompleted ? "✓ Complete" : "Mark complete"}
                        </button>

                        <button
                          onClick={() => toggleSaved(paper)}
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
                        onClick={() => setActivePreview({ paper, mode: "preview" })}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                      >
                        <Eye size={16} />
                        Preview Topic Test
                      </button>

                      <button
                        onClick={() => setActivePreview({ paper, mode: "edit" })}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#ff554f] px-4 py-2 text-sm font-black text-white hover:brightness-110"
                      >
                        <Edit3 size={16} />
                        PDF Edit
                      </button>

                      {fileUrl && (
                        <button
                          onClick={() => window.open(fileUrl, "_blank")}
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
function SubjectPagePreview({ subject, onBack }) {
  const [section, setSection] = useState("overview");

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
        <PastPapersPanel subject={subject} />
        ) : section === "topictests" ? (
        <TopicTestsPanel subject={subject} />
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

      {section !== "overview" && section !== "pastpapers" && (
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

export default function Dashboard({ user, onRequireLogin = () => {} }) {
  const [selectedIds, setSelectedIds] = useState(["physics", "computer-science", "maths"]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState(null);

  const subjects = allSubjects();
  useEffect(() => {
  async function loadUserSubjects() {
    if (!user) {
      setSelectedIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("user_subjects")
      .select("subject_id")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setSelectedIds(data.map((item) => item.subject_id));
  }

  loadUserSubjects();
}, [user]);
  const selectedSubjects = subjects.filter((subject) => selectedIds.includes(subject.id));
  const activeSubject = subjects.find((subject) => subject.id === activeSubjectId);

  const sidebarSubjects = useMemo(() => {
    const base = selectedSubjects.length > 0 ? selectedSubjects : subjects;
    return base.filter((subject) =>
      `${subject.name} ${subject.board}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, selectedSubjects, subjects]);

async function toggleSubject(id) {
  if (!user) {
    onRequireLogin();
    return;
  }

  const subject = subjects.find((item) => item.id === id);
  if (!subject) return;

  const alreadySelected = selectedIds.includes(id);

  if (alreadySelected) {
    const { error } = await supabase
      .from("user_subjects")
      .delete()
      .eq("user_id", user.id)
      .eq("subject_id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setSelectedIds((current) => current.filter((item) => item !== id));
  } else {
    const { error } = await supabase.from("user_subjects").insert({
      user_id: user.id,
      subject_id: subject.id,
      subject_name: subject.name,
      board: subject.board,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setSelectedIds((current) => [...current, id]);
  }
}

 return (
  <div className="min-h-screen bg-[#060816] text-white">
    <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,92,82,0.11),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(124,58,237,0.14),transparent_28%),radial-gradient(circle_at_72%_86%,rgba(34,211,238,0.06),transparent_24%)]" />

      <SubjectSetupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedIds={selectedIds}
        onToggle={toggleSubject}
      />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[370px] shrink-0 border-r border-white/10 bg-slate-950/75 p-5 backdrop-blur-xl lg:block">
          <div className="mb-6 flex items-center justify-between">
            <Logo />
            <button className="rounded-xl border border-white/10 p-2.5 text-white/45 hover:bg-white/[0.05]">
              <Settings2 size={18} />
            </button>
          </div>

          <button
            onClick={() => setActiveSubjectId(null)}
            className={`mb-4 w-full rounded-2xl border p-4 text-left transition ${
              !activeSubject
                ? "border-cyan-300/50 bg-cyan-300/10"
                : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-black text-white">
              <Home size={16} /> Dashboard
            </p>
            <p className="mt-1 text-xs leading-5 text-white/40">Overview and selected subjects</p>
          </button>

          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search my subjects..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-10 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
              />
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-sm font-black text-white/70 hover:bg-white/[0.1]"
            >
              Change subjects
            </button>
          </div>

          <div className="space-y-3">
            {sidebarSubjects.map((subject) => (
              <SidebarSubject
                key={subject.id}
                subject={subject}
                active={activeSubjectId === subject.id}
                onOpen={() => setActiveSubjectId(subject.id)}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 md:px-8 lg:px-10">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-xl">
            <div>
              <p className="text-sm text-white/40">Welcome back</p>
              <h1 className="text-2xl font-black tracking-tight text-white">Your revision dashboard</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white/55">
                {selectedSubjects.length} subjects selected
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/15"
              >
                Edit subjects
              </button>
            </div>
          </header>

          {activeSubject ? (
            <SubjectPagePreview subject={activeSubject} onBack={() => setActiveSubjectId(null)} />
          ) : (
            <>
              {selectedSubjects.length === 0 ? (
                <EmptySubjectRequest onOpenModal={() => setModalOpen(true)} />
              ) : (
                <>
                  <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                          <Sparkles size={15} /> Simple dashboard
                        </p>
                        <h2 className="text-3xl font-black tracking-tight text-white">Start where you left off.</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
                          Your chosen subjects appear here. Open a subject to access papers, notes, syllabus, flashcards, mock mode, and AI tutor tools.
                        </p>
                      </div>

                      <button
                        onClick={() => setModalOpen(true)}
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white/70 hover:bg-white/[0.08]"
                      >
                        Change subjects
                      </button>
                    </div>
                  </section>

                  <section className="mb-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-xl font-black text-white">My subjects</h2>
                      <p className="text-sm text-white/40">Clean, compact, and personal</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {selectedSubjects.map((subject) => (
                        <SelectedSubjectCard
                          key={subject.id}
                          subject={subject}
                          onOpen={() => setActiveSubjectId(subject.id)}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-sm font-black text-cyan-200">Next paper</p>
                      <p className="mt-2 text-lg font-black text-white">Physics Unit 3</p>
                      <p className="mt-1 text-sm text-white/40">Continue your last opened paper.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-sm font-black text-violet-200">Weak topics</p>
                      <p className="mt-2 text-lg font-black text-white">Fields + Mechanics</p>
                      <p className="mt-1 text-sm text-white/40">Combine topics for targeted practice.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-sm font-black text-rose-200">Revision tools</p>
                      <p className="mt-2 text-lg font-black text-white">AI quiz ready</p>
                      <p className="mt-1 text-sm text-white/40">Ask, revise, visualize, and test yourself.</p>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
