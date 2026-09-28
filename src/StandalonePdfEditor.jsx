import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileUp, FileDown, FolderOpen, X, Printer, RotateCcw, RotateCw, FilePlus2, Trash2, Undo2, Redo2, PanelLeft, Ellipsis, Save, Info, Keyboard, ChevronsLeft, ChevronsRight } from "lucide-react";
import PdfViewer from "./PdfViewer";
import { cleanPdfExportFilename } from "./pdfExport";
import { annotationsForPages, changePages, newPageId, storePageAnnotations, validateUpload } from "./pdf/documentModel";
import { saveLocalDraft, listLocalDrafts, readLocalDraft, deleteLocalDraft } from "./pdf/localDrafts";
import { assembleLocalPdf } from "./pdf/localDocumentPdf";
import "./pdf/standalone.css";
import AdvancedToolPanel from "./pdf/AdvancedToolPanel";
import { standaloneTools } from "./pdf/standaloneTools";
import { annotationMarkup } from "./pdf/annotationArtwork";

function IconButton({ icon: Icon, label, ...props }) {
  return <button type="button" className="local-pdf-icon" title={label} aria-label={label} {...props}><Icon size={18} /></button>;
}

class WorkspaceBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? <div role="alert" className="p-6">The editor could not render. Your draft is preserved. <button onClick={() => this.setState({ error: false })}>Retry</button></div> : this.props.children;
  }
}

function createUploadedDraft(file, original, parsed) {
  return {
    id: newPageId(), name: file.name, original, annotations: [], view: {}, preferences: {}, updatedAt: Date.now(),
    pages: parsed.getPages().map((page, sourceIndex) => ({ id: newPageId(), sourceIndex, width: page.getCropBox().width, height: page.getCropBox().height, rotation: page.getRotation().angle })),
  };
}

export default function StandalonePdfEditor({ user, authorizeOpen, canExport, onExportBlocked, onDocumentOpenChange }) {
  const [draft, setDraft] = useState(null);
  const current = useRef(null);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Saved locally");
  const [exportProgress, setExportProgress] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [headerHost, setHeaderHost] = useState(null);
  const [mobileActionsHost, setMobileActionsHost] = useState(null);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);
  const viewerControls = useRef(null);
  const moreMenu = useRef(null);
  const exportMenu = useRef(null);
  const printMenu = useRef(null);
  const [information, setInformation] = useState(null);
  const picker = useRef(null);
  const pending = useRef(null);
  const savedVersion = useRef(0);
  const version = useRef(0);
  const saving = useRef(Promise.resolve());
  const alive = useRef(true);
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const working = useRef(false);
  const activeDraftKey = `alevel-dojo-local-pdf-active:${user.id}`;

  useEffect(() => {
    onDocumentOpenChange?.(Boolean(draft));
    return () => onDocumentOpenChange?.(false);
  }, [draft, onDocumentOpenChange]);

  useEffect(() => {
    if (!draft) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [draft]);

  useEffect(() => {
    if (!draft) return;
    function closeMenu(event) {
      if (event.key === "Escape" || event.type === "pointerdown") {
        for (const menu of [moreMenu, exportMenu, printMenu]) {
          if (menu.current && (event.key === "Escape" || !menu.current.contains(event.target))) menu.current.open = false;
        }
        if (event.key === "Escape") setInformation(null);
      }
    }
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => { document.removeEventListener("pointerdown", closeMenu); document.removeEventListener("keydown", closeMenu); };
  }, [draft]);

  const refreshDrafts = useCallback(async () => {
    try { const rows = await listLocalDrafts(user.id); if (alive.current) setDrafts(rows); }
    catch { if (alive.current) setError("Local drafts are unavailable. Enable browser storage and try again."); }
  }, [user.id]);

  const flush = useCallback(() => {
    clearTimeout(pending.current);
    if (!current.current) return saving.current;
    const snapshot = current.current;
    const snapshotVersion = version.current;
    setStatus("Saving...");
    // Serialize writes so a slow old transaction cannot overwrite a newer edit.
    const write = saving.current.catch(() => {}).then(() => saveLocalDraft(user.id, snapshot));
    saving.current = write;
    return write.then(() => {
      savedVersion.current = snapshotVersion;
      if (alive.current && snapshotVersion === version.current) setStatus("Saved locally");
    }).catch(error => {
      if (alive.current) setStatus("Save failed. Free browser storage and retry.");
      throw error;
    });
  }, [user.id]);

  const update = useCallback((next, recordHistory = false) => {
    current.current = { ...next, updatedAt: Date.now() };
    if (recordHistory) {
      const snapshot = { pages: next.pages, annotations: next.annotations };
      history.current = [...history.current.slice(0, historyIndex.current + 1), snapshot].slice(-40);
      historyIndex.current = history.current.length - 1;
    }
    version.current++;
    setStatus("Saving...");
    clearTimeout(pending.current);
    pending.current = setTimeout(() => { flush().catch(() => {}); }, 450);
  }, [flush]);

  useEffect(() => {
    alive.current = true;
    Promise.resolve().then(refreshDrafts);
    function unload(event) {
      if (version.current !== savedVersion.current) { event.preventDefault(); event.returnValue = ""; }
    }
    function hidden() { if (document.hidden && current.current) flush().catch(() => {}); }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      alive.current = false; clearTimeout(pending.current);
      if (current.current) flush().catch(() => {});
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [flush, refreshDrafts]);

  useEffect(() => {
    let canceled = false;
    const id = localStorage.getItem(activeDraftKey);
    if (id) readLocalDraft(user.id,id).then(next => {
      if (!next || canceled) return;
      current.current = next;
      history.current = [{ pages: next.pages, annotations: next.annotations }]; historyIndex.current=0;
      setPage(next.view?.page||0); setPageCount(next.pages.length); setDraft(next);
    }).catch(()=>{if(!canceled)setError("Your last draft could not be restored. Try opening it from Local drafts.");});
    return ()=>{canceled=true;};
  }, [activeDraftKey,user.id]);

  useEffect(() => {
    if (!draft) return;
    let canceled = false;
    let url;
    assembleLocalPdf(current.current).then(bytes => {
      if (canceled) return;
      url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      setPdfUrl(url);
    }).catch(() => { if (!canceled) setError("This document could not render. Retry or close it; your original file is unchanged."); });
    return () => { canceled = true; if (url) URL.revokeObjectURL(url); };
  }, [draft, revision]);

  async function openDraft(next) {
    if (!await authorizeOpen(next)) return;
    current.current = next;
    history.current = [{ pages: next.pages, annotations: next.annotations }]; historyIndex.current = 0;
    version.current = savedVersion.current = 0;
    setError(""); setPage(next.view?.page || 0); setDraft(next); setStatus("Saved locally");
    setPageCount(next.pages.length); setPdfUrl("");
    setThumbnailsOpen(false);
    localStorage.setItem(activeDraftKey,next.id);
  }

  async function upload(file) {
    if (working.current || !file) return;
    working.current = true; setBusy(true); setError("");
    try {
      validateUpload(file);
      const original = await file.arrayBuffer();
      const parsed = await PDFDocument.load(original.slice(0));
      if (!parsed.getPageCount()) throw new Error("This PDF has no pages.");
      const next = createUploadedDraft(file, original, parsed);
      await saveLocalDraft(user.id, next);
      await openDraft(next);
      await refreshDrafts();
    } catch (error) {
      setError(/encrypt|password/i.test(error.message) ? "Password-protected PDFs are not supported. Unlock a copy in your PDF app and upload that copy." : error.message || "This PDF could not open. Try a fresh PDF export of the file.");
    } finally { setBusy(false); working.current = false; if (picker.current) picker.current.value = ""; }
  }

  async function resume(id) {
    if (working.current) return;
    working.current = true; setBusy(true); setError("");
    try { const next = await readLocalDraft(user.id, id); if (!next) throw new Error("This draft was removed from browser storage."); await openDraft(next); }
    catch (error) { setError(error.message); }
    finally { working.current = false; setBusy(false); }
  }

  async function close() {
    try { if (version.current !== savedVersion.current) await flush(); }
    catch { if (!window.confirm("This draft could not be saved. Close and discard unsaved changes?")) return; }
    current.current = null; setDraft(null); setPdfUrl(""); setError(""); refreshDrafts();
    localStorage.removeItem(activeDraftKey);
  }

  async function exportFile({ print = false, original = false } = {}) {
    if (!canExport) { onExportBlocked(); return; }
    if (working.current || !current.current) return;
    working.current = true; setExportProgress(0); setError("");
    // Open the print window synchronously to avoid popup blocking after asynchronous export.
    const printWindow = print ? window.open("", "_blank") : null;
    try {
      if (print && !printWindow) throw new Error("Allow popups to print, or export and print the downloaded PDF.");
      const bytes = original ? current.current.original : await assembleLocalPdf(current.current, { annotations: true, onProgress: setExportProgress });
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      if (printWindow) {
        printWindow.location.replace(url);
        // The browser PDF viewer supplies printing, with every flattened annotation included.
        setTimeout(() => { try { printWindow.print(); } catch { /* Native PDF viewer retains Print. */ } }, 1500);
      } else {
        const link = document.createElement("a"); link.href = url;
        link.download = cleanPdfExportFilename(current.current.name.replace(/\.pdf$/i, original ? "-original" : "-annotated")); link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), print ? 300000 : 30000);
    } catch (error) { printWindow?.close(); setError(`Export failed: ${error.message}`); }
    finally { working.current = false; setExportProgress(null); }
  }

  const operations = useRef({});
  useLayoutEffect(() => { operations.current = { update, flush, exportFile }; });
  const adapter = useMemo(() => draft ? {
    revision,
    tools: standaloneTools,
    artwork: annotationMarkup,
    controls: props => <AdvancedToolPanel key={props.tool} {...props}/>,
    load: () => annotationsForPages(current.current),
    change: annotations => {
      const next = current.current;
      const ids = new Set(next.pages.map(p => p.id));
      const retained = next.annotations.filter(a => !ids.has(a.pageId));
      operations.current.update({ ...next, annotations: [...retained, ...storePageAnnotations(next.pages, annotations)] });
    },
    save: async annotations => { adapter.change(annotations); await operations.current.flush(); },
    workspace: preferences => { if (JSON.stringify(current.current?.preferences) !== JSON.stringify(preferences)) operations.current.update({ ...current.current, preferences }); },
    preferences: () => current.current.preferences,
    view: () => current.current.view || {},
    setView: view => { operations.current.update({ ...current.current, view: { ...current.current.view, ...view } }); if (view.page !== undefined) setPage(view.page); },
    export: () => operations.current.exportFile(),
    mobileActionsHost,
    page: number => current.current.pages[number - 1],
  } : null, [draft, revision, mobileActionsHost]);

  function pageAction(action) {
    if (action === "delete" && !window.confirm("Delete this page? You can undo this operation.")) return;
    try {
      const next = changePages(current.current, action, page);
      // Snapshot current annotation edits immediately before a page operation.
      history.current[historyIndex.current] = { pages: current.current.pages, annotations: current.current.annotations };
      next.view = { ...next.view, page: Math.min(page,next.pages.length-1) };
      setPdfUrl(""); setPageCount(next.pages.length); setThumbnailsOpen(false);
      update(next, true); setRevision(value => value + 1); setPage(Math.min(page, next.pages.length - 1));
    } catch (error) { setError(error.message); }
  }

  function restorePages(direction) {
    const index = historyIndex.current + direction;
    if (index < 0 || index >= history.current.length) return;
    historyIndex.current = index;
    setPdfUrl(""); setPageCount(history.current[index].pages.length); setThumbnailsOpen(false);
    update({ ...current.current, ...history.current[index] }); setRevision(value => value + 1);
  }

  function showProperties() {
    const active = current.current;
    setInformation({ title: "Document properties", lines: [active.name, `${active.pages.length} pages`, `${(active.original.byteLength / 1048576).toFixed(2)} MB original file`, "Draft stored locally in this browser"] });
  }

  return <section className={`standalone-pdf text-white ${draft ? "standalone-pdf--open" : ""}`}>
    <input ref={picker} type="file" accept="application/pdf,.pdf" hidden aria-label="Choose PDF" onChange={event => upload(event.target.files?.[0])} />
    <header className={draft ? "local-pdf-header" : "mb-4 flex flex-wrap items-center justify-between gap-3"}>
      <div className="local-pdf-title min-w-0"><h1 className={`truncate font-black ${draft ? "text-sm sm:text-base" : "text-2xl"}`} title={draft?.name}>{draft ? draft.name : "PDF Editor"}</h1><p className={draft ? "text-xs text-white/55" : "mt-1 text-sm text-white/55"}>{draft ? (exportProgress !== null ? `Exporting... ${exportProgress}%` : status) : "Upload, annotate and export your own PDFs. Drafts stay in this browser, not in the cloud."}</p></div>
      {draft && <>
        <div className="local-pdf-header-center">
          <IconButton icon={PanelLeft} label="Toggle page thumbnails" aria-expanded={thumbnailsOpen} disabled={!pdfUrl} onClick={() => { viewerControls.current?.toggleThumbnails(); setThumbnailsOpen(value => !value); }} />
          <div ref={setHeaderHost} className="local-pdf-header-navigation" />
        </div>
        <div className="local-pdf-header-actions">
          <IconButton icon={Save} label="Save PDF draft" onClick={() => flush().catch(() => {})} />
          <details ref={exportMenu} className="local-pdf-more">
            <summary aria-label="Export PDF" title="Export PDF"><FileDown size={19} /></summary>
            <div className="local-pdf-more-menu" onClick={event => { if (event.target.closest("button")) exportMenu.current.open = false; }}>
              <button disabled={exportProgress !== null} onClick={() => exportFile()}><FileDown size={17} />Export annotated PDF</button>
              <button disabled={exportProgress !== null} onClick={() => exportFile({ original: true })}><FileDown size={17} />Export original PDF (without edits)</button>
            </div>
          </details>
          <details ref={printMenu} className="local-pdf-more local-pdf-print">
            <summary aria-label="Print PDF" title="Print PDF"><Printer size={19} /></summary>
            <div className="local-pdf-more-menu" onClick={event => { if (event.target.closest("button")) printMenu.current.open = false; }}>
              <button disabled={exportProgress !== null} onClick={() => exportFile({ print: true })}><Printer size={17} />Print annotated PDF</button>
              <button disabled={exportProgress !== null} onClick={() => exportFile({ print: true, original: true })}><Printer size={17} />Print original PDF (without edits)</button>
            </div>
          </details>
          <details ref={moreMenu} className="local-pdf-more">
            <summary aria-label="More PDF actions" title="More PDF actions"><Ellipsis size={19} /></summary>
            <div className="local-pdf-more-menu" onClick={event => { if (event.target.closest("button")) moreMenu.current.open = false; }}>
              <div ref={setMobileActionsHost} className="local-pdf-mobile-actions" />
              <button className="local-pdf-mobile-action" onClick={() => { moreMenu.current.open = false; flush().catch(() => {}); }}><Save size={17} />Save PDF draft</button>
              <button onClick={() => { moreMenu.current.open = false; close(); }}><FolderOpen size={17} />Open another PDF</button>
              <button className="local-pdf-mobile-action" disabled={exportProgress !== null} onClick={() => exportFile({ print: true })}><Printer size={17} />Print annotated PDF</button>
              <button className="local-pdf-mobile-action" disabled={exportProgress !== null} onClick={() => exportFile({ print: true, original: true })}><Printer size={17} />Print original PDF</button>
              <button onClick={showProperties}><Info size={17} />Document properties</button>
              <button onClick={() => viewerControls.current?.jumpToPage(0)}><ChevronsLeft size={17} />First page</button>
              <button onClick={() => viewerControls.current?.jumpToPage(pageCount - 1)}><ChevronsRight size={17} />Last page</button>
              <button onClick={() => setInformation({ title: "Keyboard shortcuts", lines: ["Ctrl/Cmd + F: Find in document", "Enter / Shift + Enter: Next / previous match", "Escape: Close find or menu", "Ctrl/Cmd + Z: Undo annotation", "Ctrl/Cmd + Y: Redo annotation"] })}><Keyboard size={17} />Keyboard shortcuts</button>
              <span className="local-pdf-menu-divider" />
              <button onClick={() => { moreMenu.current.open = false; pageAction("left"); }}><RotateCcw size={17} />Rotate page left</button>
              <button onClick={() => { moreMenu.current.open = false; pageAction("right"); }}><RotateCw size={17} />Rotate page right</button>
              <button onClick={() => { moreMenu.current.open = false; pageAction("before"); }}><FilePlus2 size={17} />Insert page before</button>
              <button onClick={() => { moreMenu.current.open = false; pageAction("after"); }}><FilePlus2 size={17} />Insert page after</button>
              <button disabled={pageCount === 1} onClick={() => { moreMenu.current.open = false; pageAction("delete"); }}><Trash2 size={17} />Delete page</button>
              <button onClick={() => { moreMenu.current.open = false; restorePages(-1); }}><Undo2 size={17} />Undo page operation</button>
              <button onClick={() => { moreMenu.current.open = false; restorePages(1); }}><Redo2 size={17} />Redo page operation</button>
            </div>
          </details>
          <button className="local-pdf-close" aria-label="Close PDF Editor" title="Close PDF Editor" onClick={close}><X size={17} /><span>Close</span></button>
        </div>
      </>}
    </header>
    {error && <div role="alert" className={draft ? "local-pdf-error" : "mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100"}>{error}{draft && <button className="ml-3 underline" onClick={() => { setError(""); setRevision(v => v + 1); }}>Retry</button>}</div>}
    {information && <div className="local-pdf-info-backdrop" onClick={() => setInformation(null)}><section className="local-pdf-info" role="dialog" aria-modal="true" aria-label={information.title} onClick={event => event.stopPropagation()}><header><h2>{information.title}</h2><IconButton icon={X} label="Close dialog" onClick={() => setInformation(null)} /></header>{information.lines.map(line => <p key={line}>{line}</p>)}</section></div>}
    {!draft ? <>
      <button disabled={busy} onClick={() => picker.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }} className={`flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 transition ${dragging ? "border-cyan-200 bg-cyan-300/15" : "border-white/20 bg-white/[0.03] hover:border-cyan-300/50"}`}>
        <FileUp size={36} className="text-cyan-200" /><span className="text-lg font-bold">{busy ? "Opening PDF..." : "Choose or drop a PDF"}</span><span className="text-sm text-white/50">PDF files up to 40 MB. Password-protected files must be unlocked first.</span>
      </button>
      <h2 className="mb-3 mt-7 text-lg font-bold">Local drafts</h2>
      <div className="divide-y divide-white/10">{drafts.map(row => <div key={row.id} className="flex items-center justify-between gap-3 py-3"><button disabled={busy} onClick={() => resume(row.id)} className="min-w-0 text-left"><span className="block truncate font-bold">{row.name}</span><span className="text-xs text-white/50">{row.pageCount} pages · {new Date(row.updatedAt).toLocaleString()}</span></button><IconButton icon={Trash2} label={`Delete draft ${row.name}`} onClick={async () => { if (window.confirm("Permanently delete this local draft?")) { try { await deleteLocalDraft(user.id, row.id); refreshDrafts(); } catch { setError("Could not delete the draft. Try again."); } } }} /></div>)}</div>
      {!drafts.length && <p className="text-sm text-white/50">No local drafts yet.</p>}
    </> : <>
      <WorkspaceBoundary key={draft.id}>{pdfUrl ? <PdfViewer key={`${draft.id}:${revision}`} fileUrl={pdfUrl} editable user={user} storageKey={`standalone:${draft.id}`} draftAdapter={adapter} toolbarHost={headerHost} onControlsReady={controls => { viewerControls.current = controls; }} onGoBack={close} canExportPdf={canExport} onExportBlocked={onExportBlocked} /> : <p role="status" className="p-8 text-white/60">Preparing document...</p>}</WorkspaceBoundary>
    </>}
  </section>;
}
