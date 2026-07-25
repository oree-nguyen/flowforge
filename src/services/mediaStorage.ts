import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface FlowForgeDB extends DBSchema {
  outputs: {
    key: string; // indexedDbKey: {workflowId}:{nodeId}:{runId}
    value: {
      indexedDbKey: string;
      blob: Blob;
      type: 'image' | 'video';
      workflowId: string;
      nodeId: string;
      createdAt: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<FlowForgeDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FlowForgeDB>('flowforge-media', 1, {
      upgrade(db) {
        db.createObjectStore('outputs', { keyPath: 'indexedDbKey' });
      },
    });
  }
  return dbPromise;
};

export const saveMediaBlob = async (
  indexedDbKey: string,
  blob: Blob,
  type: 'image' | 'video',
  workflowId: string,
  nodeId: string
): Promise<void> => {
  const db = await getDB();
  await db.put('outputs', {
    indexedDbKey,
    blob,
    type,
    workflowId,
    nodeId,
    createdAt: new Date().toISOString(),
  });
};

export const getMediaBlob = async (indexedDbKey: string): Promise<Blob | undefined> => {
  const db = await getDB();
  const entry = await db.get('outputs', indexedDbKey);
  return entry?.blob;
};

export const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      console.error('Failed to get storage estimate', error);
      return null;
    }
  }
  return null;
};

export const requestPersistentStorage = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (error) {
      console.error('Failed to request persistent storage', error);
      return false;
    }
  }
  return false;
};
