import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import PdfEditorLayer from "./PdfEditorLayer";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function PdfViewer({
  fileUrl,
  editable = false,
  user = null,
  paperId = "",
  pdfType = "question",
  exportFileName = "A-Level-Dojo-Paper-Export.pdf",
  canExportPdf = true,
  onExportBlocked = () => {},
}) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="question-editor-panel relative h-[72vh] overflow-hidden rounded-xl bg-white">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
      </Worker>

      {editable && (
        <PdfEditorLayer
          storageKey={fileUrl}
          user={user}
          paperId={paperId}
          pdfType={pdfType}
          exportFileName={exportFileName}
          canExportPdf={canExportPdf}
          onExportBlocked={onExportBlocked}
        />
      )}
    </div>
  );
}
