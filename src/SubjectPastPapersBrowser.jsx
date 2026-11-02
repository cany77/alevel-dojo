import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Download, Edit3, FileText, Leaf, Search, Snowflake, Star, Sun } from "lucide-react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

const thumbnailCache = new Map();
let pdfRendererPromise;

async function renderThumbnail(url) {
  if (!pdfRendererPromise) {
    pdfRendererPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    });
  }
  const pdfjs = await pdfRendererPromise;
  const document = await pdfjs.getDocument(url).promise;
  try {
    const page = await document.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(160 / base.width, 160 / base.height) });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    await document.destroy();
  }
}

const seasonStyles = {
  winter: { Icon: Snowflake, color: "text-[#83bfff]", surface: "bg-[#83bfff]/10" },
  summer: { Icon: Sun, color: "text-[#f6c86d]", surface: "bg-[#f6c86d]/10" },
  autumn: { Icon: Leaf, color: "text-[#f5a36c]", surface: "bg-[#f5a36c]/10" },
};

function sessionDetails(paper) {
  const raw = String(paper.session || paper.month || "");
  const month = String(paper.month || raw).toLowerCase();
  const season = /jan|feb|winter/.test(month) ? "winter" : /oct|nov|autumn/.test(month) ? "autumn" : "summer";
  const named = /jan/i.test(raw) ? raw.replace(/\bJan\b/i, "January") : /nov/i.test(raw) ? raw.replace(/\bNov\b/i, "November") : raw;
  return { label: named || (paper.year ? String(paper.year) : "Specimen"), style: seasonStyles[season] };
}

function shortUnit(unit) {
  return String(unit || "").replace(/^Further Pure\s*(\d+)$/i, "FP$1").replace(/^Pure\s*(\d+)$/i, "P$1")
    .replace(/^Statistics\s*(\d+)$/i, "S$1").replace(/^Mechanics\s*(\d+)$/i, "M$1")
    .replace(/^Decisions?\s*(\d+)$/i, "D$1");
}

function PaperThumbnail({ url }) {
  const ref = useRef(null);
  const [image, setImage] = useState(() => thumbnailCache.get(url) || "");

  useEffect(() => {
    if (image || !/\.pdf(?:[?#]|$)/i.test(url || "")) return;
    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      renderThumbnail(url).then((data) => {
        if (cancelled) return;
        thumbnailCache.delete(url);
        thumbnailCache.set(url, data);
        if (thumbnailCache.size > 24) thumbnailCache.delete(thumbnailCache.keys().next().value);
        setImage(data);
      }).catch(() => {});
    }, { rootMargin: "120px" });
    if (ref.current) observer.observe(ref.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [url, image]);

  return <div ref={ref} className="flex h-24 items-center justify-center rounded-xl bg-white/[0.055]" aria-label={image ? "Question paper first page" : "Paper thumbnail unavailable"}>
    {image ? <img src={image} alt="" className="h-20 max-w-[95%] object-contain shadow-lg" /> :
    <div className="h-[70px] w-[51px] rounded-[3px] bg-[#f7f7fa] p-2 shadow-lg" aria-hidden="true">
      <div className="mb-2 h-1.5 w-9 rounded bg-slate-700/60" />
      {["w-8", "w-10", "w-9", "w-7", "w-10", "w-8"].map((width, index) => <div key={index} className={`mb-1 h-[2px] rounded bg-slate-400/50 ${width}`} />)}
    </div>}
  </div>;
}

function PaperCard({ paper, mode, saved, completed, annotated, pending, exporting, onSave, onComplete, onQuestion, onMarkScheme, onDownloadQ, onDownloadMS, onEdit, onExport }) {
  const { label, style } = sessionDetails(paper);
  const SeasonIcon = style.Icon;
  const unit = paper.paper || paper.unit || "Paper";
  const variant = paper.variant || (paper.componentCode ? `Variant ${String(paper.componentCode).slice(-1)}` : "");
  const question = paper.questionPaper || paper.questionUrl || paper.pdf;
  const markScheme = paper.markScheme || paper.markSchemeUrl;

  return <article className="w-full max-w-[220px] flex-none rounded-[17px] border border-[#342b41] bg-[#171320] p-3 text-white transition-colors hover:border-violet-300/35 focus-within:border-cyan-300/55 motion-reduce:transition-none">
    <div className="flex items-start justify-between gap-2">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${style.surface} ${style.color}`}><SeasonIcon size={16} aria-hidden="true" /></span>
      <div className="flex items-center gap-0.5">
        <button type="button" aria-label={saved ? `Unsave ${label} ${unit}` : `Save ${label} ${unit}`} title={saved ? "Unsave paper" : "Save paper"} aria-pressed={saved} disabled={pending} onClick={() => onSave(paper)} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.07] ${saved ? "text-[#b49af6]" : "text-[#a8a0b8]"}`}><Star size={16} fill={saved ? "currentColor" : "none"} /></button>
        <button type="button" aria-label={completed ? `Mark ${label} ${unit} incomplete` : `Mark ${label} ${unit} complete`} title={completed ? "Mark incomplete" : "Mark complete"} aria-pressed={completed} disabled={pending} onClick={() => onComplete(paper)} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.07] ${completed ? "text-[#67e8a5]" : "text-[#a8a0b8]"}`}><CheckCircle2 size={16} fill={completed ? "#67e8a533" : "none"}/></button>
      </div>
    </div>
    <div className="mt-2">
      <h4 className="text-sm font-bold text-white">{label}</h4>
      <p className="mt-0.5 text-[11px] text-[#a8a0b8]">{unit}{variant ? ` · ${variant}` : " · Standard paper"}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {completed && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#67e8a5]"><CheckCircle2 size={12}/>Completed</span>}
        {annotated && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#83bfff]"><Edit3 size={12}/>Marked</span>}
      </div>
    </div>
    {mode === "download" && <div className="mt-2"><PaperThumbnail url={question} /></div>}
    <div className="mt-2 grid gap-1">
      {question && <button type="button" onClick={() => mode === "download" ? onDownloadQ(paper, question) : onQuestion(paper)} className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#44dcec] px-3 text-xs font-semibold text-[#111526] hover:bg-cyan-200"><FileText size={14}/>{mode === "download" ? "Download QP" : "Question paper"}</button>}
      {markScheme && <button type="button" onClick={() => mode === "download" ? onDownloadMS(paper, markScheme) : onMarkScheme(paper)} className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-[#51475c] px-3 text-xs font-semibold text-[#eee9f4] hover:bg-white/[0.07]">{mode === "download" ? <Download size={14}/> : <FileText size={14} />}{mode === "download" ? "Download MS" : "Mark scheme"}</button>}
      {question && <button type="button" onClick={() => onEdit(paper)} className="inline-flex min-h-7 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-[#7be5ef] hover:bg-cyan-300/10"><Edit3 size={13}/> {paper.fileType === "html" ? "View paper" : "PDF Edit"}</button>}
      {completed && question && paper.fileType !== "html" && <button type="button" disabled={exporting} onClick={() => onExport(paper)} className="inline-flex min-h-7 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-[#b49af6] hover:bg-violet-300/10 disabled:opacity-50"><Download size={13}/>{exporting ? "Exporting..." : "Export PDF"}</button>}
    </div>
  </article>;
}

export default function SubjectPastPapersBrowser({ subject, papers, units, years, sessions, selectedUnit, setSelectedUnit, selectedYear, setSelectedYear, selectedSession, setSelectedSession, mode, setMode, search, setSearch, getId, savedIds, completedIds, annotatedIds, pendingIds, exportingId, onSave, onComplete, onQuestion, onMarkScheme, onDownloadQ, onDownloadMS, onEdit, onExport, extraFilters, advancedFiltersActive }) {
  const [collapsedYears, setCollapsedYears] = useState(() => new Set());
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  useEffect(() => { if (advancedFiltersActive) setMoreFiltersOpen(true); }, [advancedFiltersActive]);
  const grouped = useMemo(() => {
    const result = new Map();
    for (const paper of papers) {
      const year = paper.year ? String(paper.year) : "Specimen";
      if (!result.has(year)) result.set(year, []);
      result.get(year).push(paper);
    }
    return [...result].sort(([a], [b]) => Number(b) - Number(a) || a.localeCompare(b)).map(([year, items]) => ({ year, items: items.sort((a, b) => {
      const order = value => /jan/i.test(value) ? 1 : /feb|mar|apr/i.test(value) ? 2 : /may|june|jul|aug/i.test(value) ? 3 : /sep/i.test(value) ? 4 : /oct|nov/i.test(value) ? 5 : 6;
      return order(a.month || a.session) - order(b.month || b.session) || String(a.variant || a.componentCode || "").localeCompare(String(b.variant || b.componentCode || ""));
    }) }));
  }, [papers]);
  const selectedUnitLabel = selectedUnit === "All units" ? "All units" : selectedUnit;
  const qualificationLabel = subject.board === "Edexcel" && subject.qualification === "a-level"
    ? "Edexcel International A Level"
    : `${subject.board} · ${subject.qualificationLabel || subject.qualification || "A-Level"}`;
  return <section className="min-w-0 text-white [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-cyan-300">
    <header className="rounded-[20px] border border-[#533368] px-4 py-4 sm:px-6 sm:py-5" style={{ background: "linear-gradient(110deg, #21102f 0%, #241342 47%, #112336 100%)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#c7a8ff]">{qualificationLabel}</p>
          <h1 className="mt-2 text-[28px] font-black leading-tight text-white sm:text-[30px]">{subject.name}</h1>
          <p className="mt-1 text-xs text-[#c3b8cf]">Past papers · Find a paper. Practise. Improve.</p>
        </div>
        <div className="inline-flex shrink-0 rounded-full border border-[#755783] bg-[#1b1328] p-0.5" role="group" aria-label="Paper viewing mode">
          <button type="button" aria-pressed={mode === "browse"} onClick={() => setMode("browse")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === "browse" ? "bg-[#b58af8] text-[#151122]" : "text-[#ded0ea] hover:bg-white/[0.06]"}`}>Browse</button>
          <button type="button" aria-pressed={mode === "download"} onClick={() => setMode("download")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === "download" ? "bg-[#b58af8] text-[#151122]" : "text-[#ded0ea] hover:bg-white/[0.06]"}`}>Download</button>
        </div>
      </div>
      <div className="mb-3 mt-4 h-px" style={{ background: "linear-gradient(90deg, rgba(162,124,195,0.3), rgba(155,142,176,0.1))" }} aria-hidden="true" />
      <div className="flex flex-wrap gap-[7px]" role="group" aria-label="Select unit">{units.map(unit => <button key={unit} type="button" aria-pressed={selectedUnit === unit} title={unit} onClick={() => setSelectedUnit(unit)} className={`min-h-8 rounded-full border px-3 text-xs ${selectedUnit === unit ? "border-[#43d9eb] bg-[#43d9eb] font-semibold text-[#101526]" : "border-[#755783] bg-[#241a35] text-[#eee9f4] hover:border-[#b58af8]"}`}>{unit === "All units" ? "All" : shortUnit(unit)}</button>)}</div>
      <div className="mt-2.5 grid gap-[9px] sm:grid-cols-[minmax(0,1fr)_135px]">
        <label className="min-w-0"><span className="sr-only">Search papers, codes or years</span><span className="flex items-center gap-2 rounded-[11px] border border-[#755783] bg-[#100e1b] px-3 focus-within:border-[#43d9eb]"><Search size={14} className="shrink-0 text-[#aaa0ba]"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search papers, codes or years..." className="h-[37px] min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#aaa0ba]" /></span></label>
        <label className="min-w-0"><span className="sr-only">Year</span><select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="h-[39px] w-full rounded-[11px] border border-[#755783] bg-[#100e1b] px-2 text-xs text-white outline-none focus:border-[#43d9eb]">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      </div>
      <button type="button" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen(open => !open)} className="mt-2 text-left text-[11px] text-[#c3b8cf] hover:text-white">{moreFiltersOpen ? "▾" : "▸"} More filters</button>
      {moreFiltersOpen && <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="min-w-0"><span className="sr-only">Session</span><select value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)} className="h-9 w-full rounded-lg border border-[#755783] bg-[#100e1b] px-2 text-xs text-white outline-none focus:border-[#43d9eb]">{sessions.map((session) => <option key={session} value={session}>{session}</option>)}</select></label>
        {extraFilters}
      </div>}
    </header>
    <div className="mb-1 mt-3 flex items-start justify-between"><div><h3 className="text-base font-bold">{selectedUnitLabel} · {mode === "browse" ? "Browse papers" : "Quick downloads"}</h3><p className="mt-0.5 text-xs text-[#a8a0b8]">{mode === "browse" ? "Open a question paper or mark scheme" : "Download documents directly"}</p></div>{mode === "download" ? <Download size={16} className="text-[#b49af6]"/> : <FileText size={16} className="text-[#b49af6]"/>}</div>
    {grouped.length === 0 ? <p className="rounded-[18px] border border-[#342b41] bg-[#171320] p-4 text-sm text-[#a8a0b8]">No past papers found for these filters.</p> : grouped.map(({ year, items }) => <section key={year} className="mt-2"><button type="button" aria-expanded={!collapsedYears.has(year)} onClick={() => setCollapsedYears(current => { const next = new Set(current); next.has(year) ? next.delete(year) : next.add(year); return next; })} className="flex w-full items-center justify-between border-b border-[#342b41] py-2 text-left"><span className="font-semibold">{year} <span className="ml-1 text-xs font-normal text-[#a8a0b8]">Exam sessions</span></span><ChevronDown size={16} className={`text-[#a8a0b8] transition-transform motion-reduce:transition-none ${collapsedYears.has(year) ? "" : "rotate-180"}`}/></button>{!collapsedYears.has(year) && <div className="mx-auto flex max-w-[916px] flex-wrap items-start justify-center gap-3 py-3">{items.map(paper => { const id=getId(paper); return <PaperCard key={id} paper={paper} mode={mode} saved={savedIds.includes(id)} completed={completedIds.includes(id)} annotated={annotatedIds.includes(id)} pending={pendingIds.includes(id)} exporting={exportingId === id} onSave={onSave} onComplete={onComplete} onQuestion={onQuestion} onMarkScheme={onMarkScheme} onDownloadQ={onDownloadQ} onDownloadMS={onDownloadMS} onEdit={onEdit} onExport={onExport}/>; })}</div>}</section>)}
  </section>;
}
