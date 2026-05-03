// Lightweight IndexedDB wrapper for offline chapter downloads.
// No external deps. Stores chapters and novel metadata for offline reading.

const DB_NAME = "zemi-offline";
const DB_VERSION = 1;
const STORE_CHAPTERS = "chapters";
const STORE_NOVELS = "novels";

export interface OfflineChapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  is_premium: boolean;
  coin_price: number;
  status: string;
  created_at: string;
  downloaded_at: number;
}

export interface OfflineNovel {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  genre: string;
  downloaded_at: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CHAPTERS)) {
        const s = db.createObjectStore(STORE_CHAPTERS, { keyPath: "id" });
        s.createIndex("novel_id", "novel_id", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_NOVELS)) {
        db.createObjectStore(STORE_NOVELS, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = fn(s);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const saveChapterOffline = (chapter: Omit<OfflineChapter, "downloaded_at">) =>
  tx(STORE_CHAPTERS, "readwrite", s => s.put({ ...chapter, downloaded_at: Date.now() }));

export const saveNovelOffline = (novel: Omit<OfflineNovel, "downloaded_at">) =>
  tx(STORE_NOVELS, "readwrite", s => s.put({ ...novel, downloaded_at: Date.now() }));

export const getChapterOffline = (id: string): Promise<OfflineChapter | undefined> =>
  tx(STORE_CHAPTERS, "readonly", s => s.get(id));

export const getNovelOffline = (id: string): Promise<OfflineNovel | undefined> =>
  tx(STORE_NOVELS, "readonly", s => s.get(id));

export const deleteChapterOffline = (id: string) =>
  tx(STORE_CHAPTERS, "readwrite", s => s.delete(id));

export const getDownloadedChaptersForNovel = (novelId: string): Promise<OfflineChapter[]> =>
  openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE_CHAPTERS, "readonly");
        const idx = t.objectStore(STORE_CHAPTERS).index("novel_id");
        const req = idx.getAll(novelId);
        req.onsuccess = () => resolve(req.result as OfflineChapter[]);
        req.onerror = () => reject(req.error);
      })
  );

export const getAllDownloadedNovels = (): Promise<OfflineNovel[]> =>
  tx(STORE_NOVELS, "readonly", s => s.getAll());

export const deleteNovelOffline = async (novelId: string) => {
  const chapters = await getDownloadedChaptersForNovel(novelId);
  await Promise.all(chapters.map(c => deleteChapterOffline(c.id)));
  await tx(STORE_NOVELS, "readwrite", s => s.delete(novelId));
};
