// Tiny IndexedDB key-value store used to keep the draft (including image blobs) across reloads.
const DB = 'photo-director'; const STORE = 'kv';
function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
export async function idbGet(key) {
  try { const db = await open(); return await new Promise((res, rej) => { const q = db.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch { return undefined; }
}
export async function idbSet(key, val) {
  try { const db = await open(); await new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(val, key); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch {}
}
export async function idbDel(key) {
  try { const db = await open(); await new Promise((res) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).delete(key); t.oncomplete = res; t.onerror = res; }); } catch {}
}
