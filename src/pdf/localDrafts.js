const DATABASE = "alevel-dojo-local-pdfs";
const STORE = "documents";
let database;

function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "key" });
      if (!request.result.objectStoreNames.contains("originals")) request.result.createObjectStore("originals");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(request.error); };
  });
  return database;
}

async function transaction(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error || request.error);
    tx.onabort = () => reject(tx.error || new Error("Local storage transaction was canceled."));
  });
}

function draftKey(userId, id) {
  if (!userId || !id) throw new Error("Sign in to access local PDF drafts.");
  return `${userId}:standalone:${id}`;
}

export async function saveLocalDraft(userId, draft) {
  const key = draftKey(userId,draft.id);
  const db = await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE,"originals"],"readwrite");
    const originals=tx.objectStore("originals");
    const request=originals.getKey(key);
    request.onsuccess=()=>{if(request.result===undefined) originals.put(draft.original,key);};
    // PDF bytes are immutable and written once; autosave updates only the editable draft.
    tx.objectStore(STORE).put({...draft,original:undefined,userId,key});
    tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error||new Error("Saving was canceled."));
  });
}
export async function readLocalDraft(userId, id) {
  const key=draftKey(userId,id);
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE,"originals"],"readonly");
    const draft=tx.objectStore(STORE).get(key), original=tx.objectStore("originals").get(key);
    tx.oncomplete=()=>resolve(draft.result ? {...draft.result,original:original.result||draft.result.original} : undefined);
    tx.onerror=()=>reject(tx.error);
  });
}
export async function listLocalDrafts(userId) {
  const all = await transaction("readonly", store => store.getAll());
  return all.filter(row => row.userId === userId).sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, name, updatedAt, pages }) => ({ id, name, updatedAt, pageCount: pages.length }));
}
export async function deleteLocalDraft(userId, id) {
  const key=draftKey(userId,id); const db=await openDatabase();
  return new Promise((resolve,reject)=>{const tx=db.transaction([STORE,"originals"],"readwrite");tx.objectStore(STORE).delete(key);tx.objectStore("originals").delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
}
