/**
 * Production-ready Client Storage & Offline Queue for Exam-Taking Engine.
 * Uses IndexedDB with transparent localStorage fallback.
 * Strictly avoids storing auth tokens or sensitive credentials.
 */

export interface CachedAttemptAnswer {
  examQuestionId: string;
  selectedOptionId?: string | null;
  numericalAnswer?: number | null;
  selectedOptions?: string[] | null;
  isMarkedForReview?: boolean;
  answeredAt?: string | null;
  timeSpentSeconds?: number;
}

export interface CachedAttemptState {
  attemptId: string;
  answers: Record<string, CachedAttemptAnswer>;
  visitedQuestions: string[];
  currentQuestionId?: string;
  lastSavedAt: string;
  sequence: number;
}

export interface SyncQueueEvent {
  eventId: string;
  attemptId: string;
  sequence: number;
  action: 'ANSWER_CHANGED' | 'ANSWER_CLEARED' | 'MARK_REVIEW' | 'TIME_LOG';
  payload: {
    examQuestionId: string;
    selectedOptionId?: string | null;
    numericalAnswer?: number | null;
    selectedOptions?: string[] | null;
    isMarkedForReview?: boolean;
  };
  clientTimestamp: string;
  retryCount: number;
}

const DB_NAME = 'BrainrosExamDB';
const DB_VERSION = 1;
const STORE_ATTEMPTS = 'attempt_states';
const STORE_SYNC_QUEUE = 'sync_queue';

let dbPromise: Promise<IDBDatabase | null> | null = null;

const getDB = (): Promise<IDBDatabase | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event: any) => {
          const db = event.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) {
            db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'attemptId' });
          }
          if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
            const queueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'eventId' });
            queueStore.createIndex('attemptId', 'attemptId', { unique: false });
          }
        };
        req.onsuccess = (event: any) => {
          resolve(event.target.result as IDBDatabase);
        };
        req.onerror = () => {
          console.warn('[ExamStorage] IndexedDB open error, falling back to localStorage');
          resolve(null);
        };
      } catch (err) {
        console.warn('[ExamStorage] IndexedDB init error:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
};

// ─── Local State Persistence ───────────────────────────────────

export const saveLocalAttemptState = async (
  attemptId: string,
  state: Partial<CachedAttemptState>,
): Promise<void> => {
  const db = await getDB();
  const existing = (await getLocalAttemptState(attemptId)) || {
    attemptId,
    answers: {},
    visitedQuestions: [],
    lastSavedAt: new Date().toISOString(),
    sequence: 0,
  };

  const updated: CachedAttemptState = {
    ...existing,
    ...state,
    attemptId,
    lastSavedAt: new Date().toISOString(),
  };

  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_ATTEMPTS, 'readwrite');
        const store = tx.objectStore(STORE_ATTEMPTS);
        store.put(updated);
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          // Fallback to localStorage
          localStorage.setItem(`exam_state_${attemptId}`, JSON.stringify(updated));
          resolve();
        };
      } catch {
        localStorage.setItem(`exam_state_${attemptId}`, JSON.stringify(updated));
        resolve();
      }
    });
  } else {
    try {
      localStorage.setItem(`exam_state_${attemptId}`, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }
  }
};

export const getLocalAttemptState = async (
  attemptId: string,
): Promise<CachedAttemptState | null> => {
  const db = await getDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
        const store = tx.objectStore(STORE_ATTEMPTS);
        const req = store.get(attemptId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => {
          const raw = localStorage.getItem(`exam_state_${attemptId}`);
          resolve(raw ? JSON.parse(raw) : null);
        };
      } catch {
        const raw = localStorage.getItem(`exam_state_${attemptId}`);
        resolve(raw ? JSON.parse(raw) : null);
      }
    });
  } else {
    try {
      const raw = localStorage.getItem(`exam_state_${attemptId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
};

// ─── Offline Sync Queue ────────────────────────────────────────

export const enqueueSyncEvent = async (event: SyncQueueEvent): Promise<void> => {
  const db = await getDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        store.put(event);
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          const raw = localStorage.getItem(`exam_queue_${event.attemptId}`);
          const list: SyncQueueEvent[] = raw ? JSON.parse(raw) : [];
          list.push(event);
          localStorage.setItem(`exam_queue_${event.attemptId}`, JSON.stringify(list));
          resolve();
        };
      } catch {
        resolve();
      }
    });
  } else {
    try {
      const raw = localStorage.getItem(`exam_queue_${event.attemptId}`);
      const list: SyncQueueEvent[] = raw ? JSON.parse(raw) : [];
      list.push(event);
      localStorage.setItem(`exam_queue_${event.attemptId}`, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
};

export const getPendingSyncQueue = async (attemptId: string): Promise<SyncQueueEvent[]> => {
  const db = await getDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        const index = store.index('attemptId');
        const req = index.getAll(attemptId);
        req.onsuccess = () => {
          const results = (req.result || []) as SyncQueueEvent[];
          // Sort by sequence ascending to ensure deterministic replay order
          results.sort((a, b) => a.sequence - b.sequence);
          resolve(results);
        };
        req.onerror = () => {
          const raw = localStorage.getItem(`exam_queue_${attemptId}`);
          resolve(raw ? JSON.parse(raw) : []);
        };
      } catch {
        const raw = localStorage.getItem(`exam_queue_${attemptId}`);
        resolve(raw ? JSON.parse(raw) : []);
      }
    });
  } else {
    try {
      const raw = localStorage.getItem(`exam_queue_${attemptId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
};

export const removeSyncEvents = async (attemptId: string, eventIds: string[]): Promise<void> => {
  if (eventIds.length === 0) return;
  const db = await getDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        eventIds.forEach((id) => store.delete(id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else {
    try {
      const raw = localStorage.getItem(`exam_queue_${attemptId}`);
      if (raw) {
        const list: SyncQueueEvent[] = JSON.parse(raw);
        const filtered = list.filter((e) => !eventIds.includes(e.eventId));
        localStorage.setItem(`exam_queue_${attemptId}`, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  }
};

export const clearAttemptStorage = async (attemptId: string): Promise<void> => {
  const db = await getDB();
  if (db) {
    try {
      const tx = db.transaction([STORE_ATTEMPTS, STORE_SYNC_QUEUE], 'readwrite');
      tx.objectStore(STORE_ATTEMPTS).delete(attemptId);
      const queueStore = tx.objectStore(STORE_SYNC_QUEUE);
      const index = queueStore.index('attemptId');
      const req = index.getAllKeys(attemptId);
      req.onsuccess = () => {
        (req.result || []).forEach((key) => queueStore.delete(key));
      };
    } catch {
      // ignore
    }
  }
  try {
    localStorage.removeItem(`exam_state_${attemptId}`);
    localStorage.removeItem(`exam_queue_${attemptId}`);
  } catch {
    // ignore
  }
};
