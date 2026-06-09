import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'kyper-fix-offline';
const STORE_NAME = 'pending-actions';

export interface PendingAction {
  id?: number;
  type: string;
  payload: any;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function addPendingAction(type: string, payload: any) {
  const db = await getDB();
  return db.add(STORE_NAME, {
    type,
    payload,
    timestamp: Date.now(),
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function removePendingAction(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function clearPendingActions() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}
