import React from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import PdfEditorLayer from "./PdfEditorLayer";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

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
}) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
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
    <div className="question-editor-panel relative h-[72vh] overflow-hidden rounded-xl bg-white">
      <PdfEditorErrorBoundary onGoBack={onGoBack}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={safeFileUrl}
            plugins={[defaultLayoutPluginInstance]}
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
          />
        )}
      </PdfEditorErrorBoundary>
    </div>
  );
}
