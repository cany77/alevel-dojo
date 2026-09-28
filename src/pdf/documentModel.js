export const MAX_PDF_BYTES = 40 * 1024 * 1024;
export const newPageId = () => crypto.randomUUID();
export const quarterTurn = rotation => ((rotation % 360) + 360) % 360;

export function validateUpload(file) {
  if (!file || !/\.pdf$/i.test(file.name)) throw new Error("Choose a PDF file (.pdf).");
  if (!file.size) throw new Error("This PDF is empty. Choose another file.");
  if (file.size > MAX_PDF_BYTES) throw new Error("This PDF exceeds the 40 MB limit.");
}

export function annotationsForPages(draft) {
  const indices = new Map(draft.pages.map((page, index) => [page.id, index + 1]));
  return draft.annotations.filter(item => indices.has(item.pageId)).map(item => ({ ...item, pageNumber: indices.get(item.pageId) }));
}

export function storePageAnnotations(pages, annotations) {
  return annotations.map(item => ({ ...item, pageId: pages[item.pageNumber - 1]?.id }))
    .filter(item => item.pageId);
}

export function changePages(draft, action, index) {
  const pages = draft.pages.map(page => ({ ...page }));
  const current = pages[index];
  if (!current) return draft;
  if (action === "delete") {
    if (pages.length === 1) throw new Error("Keep at least one page in the document.");
    pages.splice(index, 1);
  } else if (action === "left" || action === "right") {
    current.rotation = quarterTurn(current.rotation + (action === "right" ? 90 : -90));
  } else {
    pages.splice(index + (action === "after" ? 1 : 0), 0, {
      id: newPageId(), sourceIndex: null, width: current.width, height: current.height, rotation: 0,
    });
  }
  // Retain deleted-page annotations for page-operation undo, keyed by page identity.
  return { ...draft, pages };
}

export function inversePoint(x, y, rotation) {
  switch (quarterTurn(rotation)) {
    case 90: return { x: y, y: 1 - x };
    case 180: return { x: 1 - x, y: 1 - y };
    case 270: return { x: 1 - y, y: x };
    default: return { x, y };
  }
}
