import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import PdfEditorLayer from "./PdfEditorLayer";
import FindDocument from "./pdf/FindDocument";
import { Search as SearchIcon } from "lucide-react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

function initialDraftScale(adapter) {
  const view = adapter.view();
  if (view.zoom && (!view.zoomViewportWidth || Math.abs(view.zoomViewportWidth - window.innerWidth) < 120)) return view.zoom;
  if (window.innerWidth > 640) return 1;
  const page = adapter.page(1);
  const pageWidth = page?.rotation % 180 ? page.height : page?.width;
  return Math.min(1, (window.innerWidth - 72) / (pageWidth || 595));
}

class PdfEditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env?.DEV) {
      console.error("PDF editor failed to render", error, errorInfo);
    }
  }

  reset = () => {
    this.setState((current) => ({ error: null, resetKey: current.resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <PdfEditorFallback
          title="The PDF editor couldn\u2019t open"
          message="Something went wrong while opening this paper. Your saved annotations were not cleared."
          onRetry={this.reset}
          onGoBack={this.props.onGoBack}
        />
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

function PdfEditorFallback({ title, message, onRetry, onGoBack }) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-[#060816] p-6 text-white">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">A-Level Dojo</p>
        <h3 className="mt-3 text-2xl font-black">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/55">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={onGoBack || (() => window.history.back())}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/70 transition hover:bg-white/[0.09] hover:text-white"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

function PdfLoader({ percentage = 0 }) {
  const progress = Number.isFinite(percentage) ? " " + Math.round(percentage) + "%" : "";
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-[#060816] p-6 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">A-Level Dojo</p>
        <p className="mt-3 text-sm font-bold text-white/60">Loading PDF{progress}...</p>
      </div>
    </div>
  );
}

export default function PdfViewer({
  fileUrl,
  editable = false,
  user = null,
  paperId = "",
  pdfType = "question",
  exportFileName = "A-Level-Dojo-Paper-Export.pdf",
  canExportPdf = true,
  onExportBlocked = () => {},
  onGoBack = null,
  draftAdapter = null,
  toolbarHost = null,
  onControlsReady = null,
}) {
  const [findOpen, setFindOpen] = useState(false);
  const defaultLayoutPluginInstance = defaultLayoutPlugin(draftAdapter ? {
    toolbarPlugin: { searchPlugin: { enableShortcuts: false } },
    sidebarTabs: tabs => [tabs[0]],
    renderToolbar: Toolbar => <Toolbar>{slots => {
      const navigation = <div className="local-pdf-navigation">
      <button type="button" className="local-pdf-find-trigger" title="Find in document (Ctrl+F)" aria-label="Find in document" onClick={() => setFindOpen(value => !value)}><SearchIcon size={17}/></button>
      <slots.GoToPreviousPage /><slots.CurrentPageInput />
      <span>/ <slots.NumberOfPages /></span><slots.GoToNextPage />
      <slots.ZoomOut /><slots.Zoom /><slots.ZoomIn />
      <slots.SwitchSelectionMode />
      <slots.Search>{search => <FindDocument search={search} open={findOpen} close={() => setFindOpen(false)} />}</slots.Search>
      </div>;
      return toolbarHost ? createPortal(navigation, toolbarHost) : navigation;
    }}</Toolbar>,
  } : undefined);
  useEffect(() => {
    if (!draftAdapter) return;
    const navigation = defaultLayoutPluginInstance.toolbarPluginInstance.pageNavigationPluginInstance;
    onControlsReady?.({ toggleThumbnails: () => defaultLayoutPluginInstance.toggleTab(0), jumpToPage: navigation.jumpToPage });
    return () => onControlsReady?.(null);
  }, [defaultLayoutPluginInstance, draftAdapter, onControlsReady]);
  useEffect(() => {
    if (!draftAdapter) return;
    function onFind(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") { event.preventDefault(); setFindOpen(true); }
      if (event.key === "Escape") setFindOpen(false);
    }
    window.addEventListener("keydown", onFind);
    return () => window.removeEventListener("keydown", onFind);
  }, [draftAdapter]);
  const safeFileUrl = typeof fileUrl === "string" ? fileUrl.trim() : fileUrl;

  if (!safeFileUrl) {
    return (
      <div className="question-editor-panel relative h-[72vh] overflow-hidden rounded-xl bg-[#060816]">
        <PdfEditorFallback
          title="The PDF editor couldn\u2019t open"
          message="This paper is missing a PDF URL. Go back and choose another paper."
          onGoBack={onGoBack}
        />
      </div>
    );
  }

  return (
    <div className={`question-editor-panel relative overflow-hidden ${draftAdapter ? "local-pdf-viewer" : "h-[72vh] rounded-xl bg-white"}`}>
      <PdfEditorErrorBoundary onGoBack={onGoBack}>
        <Worker workerUrl={draftAdapter ? workerUrl : "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"}>
          <Viewer
            fileUrl={safeFileUrl}
            plugins={[defaultLayoutPluginInstance]}
            theme={draftAdapter ? "dark" : undefined}
            initialPage={draftAdapter?.view().page || 0}
            defaultScale={draftAdapter ? initialDraftScale(draftAdapter) : undefined}
            onPageChange={draftAdapter ? event => draftAdapter.setView({ page: event.currentPage }) : undefined}
            onZoom={draftAdapter ? event => draftAdapter.setView({ zoom: event.scale, zoomViewportWidth: window.innerWidth }) : undefined}
            renderLoader={(percentages) => <PdfLoader percentage={percentages} />}
            renderError={(error) => (
              <PdfEditorFallback
                title="The PDF editor couldn\u2019t open"
                message={error?.message || "This PDF could not be loaded. The file may be missing, blocked, or unsupported."}
                onGoBack={onGoBack}
              />
            )}
          />
        </Worker>

        {editable && (
          <PdfEditorLayer
            storageKey={safeFileUrl}
            user={user}
            paperId={paperId}
            pdfType={pdfType}
            exportFileName={exportFileName}
            canExportPdf={canExportPdf}
            onExportBlocked={onExportBlocked}
            draftAdapter={draftAdapter}
          />
        )}
      </PdfEditorErrorBoundary>
    </div>
  );
}
