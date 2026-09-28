import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { assembleLocalPdf } from "../src/pdf/localDocumentPdf.js";
import { annotationsForPages, changePages, storePageAnnotations, validateUpload } from "../src/pdf/documentModel.js";
import { deleteLocalDraft, listLocalDrafts, readLocalDraft, saveLocalDraft } from "../src/pdf/localDrafts.js";

async function fixture() {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  pdf.addPage([600, 800]);
  return {
    id: "draft-1", name: "Test.pdf", original: (await pdf.save()).buffer,
    pages: [
      { id: "first", sourceIndex: 0, width: 595, height: 842, rotation: 0 },
      { id: "second", sourceIndex: 1, width: 600, height: 800, rotation: 0 },
    ],
    annotations: [{ id: "ink-1", pageId: "second", type: "pen", points: [{ x: .1, y: .2 }] }],
    updatedAt: Date.now(), view: {}, preferences: {},
  };
}

test("page identities preserve annotations through insert, delete, and reorder", async () => {
  let draft = await fixture();
  draft = changePages(draft, "after", 0);
  assert.equal(draft.pages.length, 3);
  assert.equal(annotationsForPages(draft)[0].pageNumber, 3);
  assert.equal(storePageAnnotations(draft.pages, annotationsForPages(draft))[0].pageId, "second");
  draft = changePages(draft, "delete", 0);
  assert.equal(annotationsForPages(draft)[0].pageNumber, 2);
  draft = changePages(draft, "right", 0);
  assert.equal(draft.pages[0].rotation, 90);
});

test("assembly retains original pages, blank pages, dimensions, and rotation", async () => {
  let draft = await fixture();
  draft = changePages(draft, "after", 0);
  draft = changePages(draft, "right", 1);
  const result = await PDFDocument.load(await assembleLocalPdf(draft));
  assert.equal(result.getPageCount(), 3);
  assert.deepEqual(result.getPages().map(page => page.getWidth()), [595, 595, 600]);
  assert.equal(result.getPage(1).getRotation().angle, 90);
  draft = changePages(draft, "delete", 0);
  const withoutFirst = await PDFDocument.load(await assembleLocalPdf(draft));
  assert.equal(withoutFirst.getPageCount(), 2);
});

test("IndexedDB drafts are isolated by user and keep immutable original bytes", async () => {
  const draft = await fixture();
  await saveLocalDraft("student-a", draft);
  assert.equal((await listLocalDrafts("student-a")).length, 1);
  assert.equal((await listLocalDrafts("student-b")).length, 0);
  assert.equal(await readLocalDraft("student-b", draft.id), undefined);
  const updated = { ...draft, name: "Renamed.pdf", original: new ArrayBuffer(0) };
  await saveLocalDraft("student-a", updated);
  const restored = await readLocalDraft("student-a", draft.id);
  assert.equal(restored.name, "Renamed.pdf");
  assert.equal(restored.original.byteLength, draft.original.byteLength);
  await deleteLocalDraft("student-a", draft.id);
  assert.equal(await readLocalDraft("student-a", draft.id), undefined);
});

test("upload validation rejects unsupported, empty, and oversized files", () => {
  assert.throws(() => validateUpload({ name: "notes.txt", size: 12 }), /PDF/);
  assert.throws(() => validateUpload({ name: "empty.pdf", size: 0 }), /empty/);
  assert.throws(() => validateUpload({ name: "huge.pdf", size: 41 * 1024 * 1024 }), /40 MB/);
  assert.doesNotThrow(() => validateUpload({ name: "Paper.PDF", size: 100 }));
});
