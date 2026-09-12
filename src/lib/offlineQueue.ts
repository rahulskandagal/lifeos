"use client";

// Lightweight offline queue (section 34): when a mutation fails because the
// browser is offline, we persist it in IndexedDB and replay it once
// connectivity returns. This is intentionally simple — a FIFO outbox, not a
// full conflict-resolution engine — but it means task/habit creation and
// edits made offline are never silently lost.

const DB_NAME = "lifeos-offline";
const STORE = "outbox";

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body?: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueMutation(url: string, method: string, body?: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({ id: crypto.randomUUID(), url, method, body: body ? JSON.stringify(body) : undefined, createdAt: Date.now() } satisfies QueuedMutation);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

export async function getQueuedCount(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

export async function flushQueue(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const all: QueuedMutation[] = await new Promise((resolve) => {
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedMutation[]);
    req.onerror = () => resolve([]);
  });

  let synced = 0;
  for (const item of all.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      const res = await fetch(item.url, { method: item.method, headers: { "Content-Type": "application/json" }, body: item.body });
      if (res.ok) {
        const delTx = db.transaction(STORE, "readwrite");
        delTx.objectStore(STORE).delete(item.id);
        synced++;
      }
    } catch {
      break; // still offline — stop and retry later
    }
  }
  return synced;
}

export function initOfflineSync(onSynced?: (count: number) => void) {
  if (typeof window === "undefined") return;
  window.addEventListener("online", async () => {
    const count = await flushQueue();
    if (count > 0) onSynced?.(count);
  });
}
