/**
 * PLnEX IndexedDB Local Storage Architecture
 * 
 * Complies with Priority 2 Local Data requirement:
 * - Do NOT use localStorage as the primary offline database for structured field data.
 * - Stores: Field Updates, DPR drafts, Execution Events, Evidence metadata, Sync queue.
 * - Safe for Server-Side Rendering (Next.js SSG / SSR) with isomorphic fallback.
 */

import { SyncQueueItem, INITIAL_SYNC_QUEUE_ITEMS } from '../domain/syncEngine';

const DB_NAME = 'PLnEX_Field_DB';
const DB_VERSION = 1;

export const STORES = {
  FIELD_UPDATES: 'field_updates',
  DPR_DRAFTS: 'dpr_drafts',
  EXECUTION_EVENTS: 'execution_events',
  EVIDENCE_METADATA: 'evidence_metadata',
  SYNC_QUEUE: 'sync_queue',
} as const;

export interface StoredFieldUpdate {
  id: string;
  projectId: string;
  activityId: string;
  activityName: string;
  quantity: number;
  unit: string;
  date: string;
  time?: string;
  discipline: string;
  areaLine: string;
  remarks: string;
  verificationState: string;
  status: 'LOCAL_DRAFT' | 'QUEUED' | 'SERVER_CONFIRMED';
  localCreatedAt: string;
  syncedAt?: string | null;
}

export interface StoredDPRDraft {
  id: string;
  dprCode: string;
  projectId: string;
  date: string;
  shift: string;
  siteEngineer: string;
  contractorName: string;
  weatherCondition: string;
  fieldUpdates: any[];
  status: 'LOCAL_DRAFT' | 'QUEUED' | 'SERVER_CONFIRMED';
  localCreatedAt: string;
  syncedAt?: string | null;
}

export interface StoredExecutionEvent {
  id: string;
  activityId: string;
  quantity: number;
  unit: string;
  confidence: number;
  source: string;
  timestamp: string;
  status: 'LOCAL_DRAFT' | 'QUEUED' | 'SERVER_CONFIRMED';
}

export interface StoredEvidenceMetadata {
  id: string;
  activityId?: string;
  filename: string;
  fileSize: string;
  fileType: string;
  sha256?: string;
  capturedAt: string;
  localUri?: string;
  status: 'LOCAL_DRAFT' | 'QUEUED' | 'SERVER_CONFIRMED';
}

// In-Memory Fallback Store for SSR and environments where IndexedDB is blocked
class InMemoryFallbackStore {
  private stores: Record<string, Map<string, any>> = {
    [STORES.FIELD_UPDATES]: new Map(),
    [STORES.DPR_DRAFTS]: new Map(),
    [STORES.EXECUTION_EVENTS]: new Map(),
    [STORES.EVIDENCE_METADATA]: new Map(),
    [STORES.SYNC_QUEUE]: new Map(),
  };

  constructor() {
    // Seed initial sync queue
    INITIAL_SYNC_QUEUE_ITEMS.forEach((item) => {
      this.stores[STORES.SYNC_QUEUE].set(item.id, item);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return Array.from(this.stores[storeName]?.values() || []);
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    return this.stores[storeName]?.get(id);
  }

  async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    this.stores[storeName]?.set(item.id, item);
  }

  async delete(storeName: string, id: string): Promise<void> {
    this.stores[storeName]?.delete(id);
  }

  async clear(storeName: string): Promise<void> {
    this.stores[storeName]?.clear();
  }
}

const memoryFallback = new InMemoryFallbackStore();

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB is unavailable in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.FIELD_UPDATES)) {
        db.createObjectStore(STORES.FIELD_UPDATES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.DPR_DRAFTS)) {
        db.createObjectStore(STORES.DPR_DRAFTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.EXECUTION_EVENTS)) {
        db.createObjectStore(STORES.EXECUTION_EVENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.EVIDENCE_METADATA)) {
        db.createObjectStore(STORES.EVIDENCE_METADATA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        // Seed initial sync queue items on creation
        INITIAL_SYNC_QUEUE_ITEMS.forEach((item) => {
          queueStore.put(item);
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic Store Access Operations
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  if (!isIndexedDBAvailable()) {
    return memoryFallback.getAll<T>(storeName);
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        // If sync queue is empty in indexedDB, seed it once
        if (storeName === STORES.SYNC_QUEUE && (!request.result || request.result.length === 0)) {
          resolve(INITIAL_SYNC_QUEUE_ITEMS as unknown as T[]);
        } else {
          resolve(request.result || []);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Fallback to memory for ${storeName}:`, err);
    return memoryFallback.getAll<T>(storeName);
  }
}

async function putInStore<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  // Always update in-memory fallback for instant consistency
  await memoryFallback.put(storeName, item);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error putting item in ${storeName}:`, err);
  }
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  await memoryFallback.delete(storeName, id);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error deleting item from ${storeName}:`, err);
  }
}

// Exported Public IndexedDB API
export const plnexOfflineDB = {
  // Field Updates
  async saveFieldUpdate(update: StoredFieldUpdate): Promise<void> {
    await putInStore(STORES.FIELD_UPDATES, update);
  },
  async getFieldUpdates(): Promise<StoredFieldUpdate[]> {
    return getAllFromStore<StoredFieldUpdate>(STORES.FIELD_UPDATES);
  },

  // DPR Drafts
  async saveDPRDraft(draft: StoredDPRDraft): Promise<void> {
    await putInStore(STORES.DPR_DRAFTS, draft);
  },
  async getDPRDrafts(): Promise<StoredDPRDraft[]> {
    return getAllFromStore<StoredDPRDraft>(STORES.DPR_DRAFTS);
  },

  // Execution Events
  async saveExecutionEvent(event: StoredExecutionEvent): Promise<void> {
    await putInStore(STORES.EXECUTION_EVENTS, event);
  },
  async getExecutionEvents(): Promise<StoredExecutionEvent[]> {
    return getAllFromStore<StoredExecutionEvent>(STORES.EXECUTION_EVENTS);
  },

  // Evidence Metadata
  async saveEvidenceMetadata(evidence: StoredEvidenceMetadata): Promise<void> {
    await putInStore(STORES.EVIDENCE_METADATA, evidence);
  },
  async getEvidenceMetadata(): Promise<StoredEvidenceMetadata[]> {
    return getAllFromStore<StoredEvidenceMetadata>(STORES.EVIDENCE_METADATA);
  },

  // Sync Queue
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return getAllFromStore<SyncQueueItem>(STORES.SYNC_QUEUE);
  },
  async saveSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await putInStore(STORES.SYNC_QUEUE, item);
  },
  async deleteSyncQueueItem(id: string): Promise<void> {
    await deleteFromStore(STORES.SYNC_QUEUE, id);
  },
  async clearSyncQueue(): Promise<void> {
    if (isIndexedDBAvailable()) {
      try {
        const db = await openDatabase();
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        tx.objectStore(STORES.SYNC_QUEUE).clear();
      } catch (e) {
        console.warn('Error clearing sync queue', e);
      }
    }
    await memoryFallback.clear(STORES.SYNC_QUEUE);
  },
};
