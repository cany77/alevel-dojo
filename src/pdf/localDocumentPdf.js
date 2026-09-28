import { PDFDocument, degrees } from "pdf-lib";
import { rasterAnnotations } from "./annotationArtwork.js";

export async function assembleLocalPdf(draft, { annotations = false, onProgress = () => {} } = {}) {
  const source = await PDFDocument.load(draft.original.slice(0));
  const output = await PDFDocument.create();
  for (let index = 0; index < draft.pages.length; index++) {
    const entry = draft.pages[index];
    const page = entry.sourceIndex === null
      ? output.addPage([entry.width, entry.height])
      : output.addPage((await output.copyPages(source, [entry.sourceIndex]))[0]);
    if (annotations) {
      const items = draft.annotations.filter(item => item.pageId === entry.id);
      if (items.length) {
        const image = await output.embedPng(await rasterAnnotations(items, entry.width, entry.height));
        const box = page.getCropBox();
        page.drawImage(image, { x: box.x, y: box.y, width: entry.width, height: entry.height });
      }
    }
    page.setRotation(degrees(entry.rotation));
    onProgress(Math.round((index + 1) / draft.pages.length * 100));
  }
  return output.save();
}
