import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Account,
  Trader,
  ExpenseItem,
  PlannedHedge,
  ActiveHedge,
  ClosedHedge,
  AppLogEntry,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRADERS,
  INITIAL_EXPENSES,
  INITIAL_PLANNED_HEDGES,
  INITIAL_ACTIVE_HEDGES,
  INITIAL_CLOSED_HEDGES,
  INITIAL_LOGS,
} from '../data/mockData';

// Utility to remove undefined keys before saving to Firestore
function sanitizeDoc<T>(obj: T): T {
  const clean: any = {};
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        clean[key] = value.map((item) => (typeof item === 'object' && item !== null ? sanitizeDoc(item) : item));
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = sanitizeDoc(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

// 1. Initial Seeding Check (Seeds Firestore only if database was never initialized)
export async function seedInitialFirestoreDataIfEmpty(localData?: {
  accounts?: Account[];
  traders?: Trader[];
  expenses?: ExpenseItem[];
  plannedHedges?: PlannedHedge[];
  activeHedges?: ActiveHedge[];
  closedHedges?: ClosedHedge[];
  logs?: AppLogEntry[];
}) {
  try {
    const metaRef = doc(db, 'meta', 'app_state');
    const metaSnap = await getDocs(collection(db, 'meta'));
    
    // If meta collection already exists, do not re-seed
    if (!metaSnap.empty) {
      return;
    }

    const accSnap = await getDocs(collection(db, 'accounts'));
    if (accSnap.empty) {
      console.log('First time launch: initializing clean Firestore state...');
      const batch = writeBatch(db);

      // Create initial metadata document
      batch.set(metaRef, {
        lastUpdatedText: `Last updated: ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}`,
        seededAt: new Date().toISOString(),
        isInitializedClean: true,
      });

      await batch.commit();
      console.log('Firestore initialized cleanly.');
    }
  } catch (err) {
    console.error('Error checking or seeding Firestore:', err);
  }
}

// 2. Real-time Subscriptions
export function subscribeToAccounts(callback: (accounts: Account[]) => void) {
  const q = collection(db, 'accounts');
  return onSnapshot(q, (snapshot) => {
    const list: Account[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as Account);
    });
    callback(list);
  }, (err) => console.error('Accounts snapshot error:', err));
}

export function subscribeToTraders(callback: (traders: Trader[]) => void) {
  const q = collection(db, 'traders');
  return onSnapshot(q, (snapshot) => {
    const list: Trader[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as Trader);
    });
    callback(list);
  }, (err) => console.error('Traders snapshot error:', err));
}

export function subscribeToExpenses(callback: (expenses: ExpenseItem[]) => void) {
  const q = collection(db, 'expenses');
  return onSnapshot(q, (snapshot) => {
    const list: ExpenseItem[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as ExpenseItem);
    });
    // Sort descending by date / ID
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    callback(list);
  }, (err) => console.error('Expenses snapshot error:', err));
}

export function subscribeToPlannedHedges(callback: (hedges: PlannedHedge[]) => void) {
  const q = collection(db, 'plannedHedges');
  return onSnapshot(q, (snapshot) => {
    const list: PlannedHedge[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as PlannedHedge);
    });
    callback(list);
  }, (err) => console.error('Planned hedges snapshot error:', err));
}

export function subscribeToActiveHedges(callback: (hedges: ActiveHedge[]) => void) {
  const q = collection(db, 'activeHedges');
  return onSnapshot(q, (snapshot) => {
    const list: ActiveHedge[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as ActiveHedge);
    });
    callback(list);
  }, (err) => console.error('Active hedges snapshot error:', err));
}

export function subscribeToClosedHedges(callback: (hedges: ClosedHedge[]) => void) {
  const q = collection(db, 'closedHedges');
  return onSnapshot(q, (snapshot) => {
    const list: ClosedHedge[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as ClosedHedge);
    });
    // Sort closed hedges newest first
    list.sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));
    callback(list);
  }, (err) => console.error('Closed hedges snapshot error:', err));
}

export function subscribeToLogs(callback: (logs: AppLogEntry[]) => void) {
  const q = collection(db, 'logs');
  return onSnapshot(q, (snapshot) => {
    const list: AppLogEntry[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as AppLogEntry);
    });
    // Sort descending
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (err) => console.error('Logs snapshot error:', err));
}

export function subscribeToMeta(callback: (meta: { lastUpdatedText?: string }) => void) {
  const ref = doc(db, 'meta', 'app_state');
  return onSnapshot(ref, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as { lastUpdatedText?: string });
    }
  }, (err) => console.error('Meta snapshot error:', err));
}

// 3. Write operations
export async function saveAccountToFirestore(account: Account) {
  const ref = doc(db, 'accounts', account.id);
  await setDoc(ref, sanitizeDoc(account), { merge: true });
}

export async function deleteAccountFromFirestore(accountId: string) {
  const ref = doc(db, 'accounts', accountId);
  await deleteDoc(ref);
}

export async function saveTraderToFirestore(trader: Trader) {
  const ref = doc(db, 'traders', trader.id);
  await setDoc(ref, sanitizeDoc(trader), { merge: true });
}

export async function deleteTraderFromFirestore(traderId: string) {
  const ref = doc(db, 'traders', traderId);
  await deleteDoc(ref);
}

export async function saveExpenseToFirestore(expense: ExpenseItem) {
  const ref = doc(db, 'expenses', expense.id);
  await setDoc(ref, sanitizeDoc(expense), { merge: true });
}

export async function deleteExpenseFromFirestore(expenseId: string) {
  const ref = doc(db, 'expenses', expenseId);
  await deleteDoc(ref);
}

export async function savePlannedHedgeToFirestore(hedge: PlannedHedge) {
  const ref = doc(db, 'plannedHedges', hedge.id);
  await setDoc(ref, sanitizeDoc(hedge), { merge: true });
}

export async function deletePlannedHedgeFromFirestore(hedgeId: string) {
  const ref = doc(db, 'plannedHedges', hedgeId);
  await deleteDoc(ref);
}

export async function saveActiveHedgeToFirestore(hedge: ActiveHedge) {
  const ref = doc(db, 'activeHedges', hedge.id);
  await setDoc(ref, sanitizeDoc(hedge), { merge: true });
}

export async function deleteActiveHedgeFromFirestore(hedgeId: string) {
  const ref = doc(db, 'activeHedges', hedgeId);
  await deleteDoc(ref);
}

export async function saveClosedHedgeToFirestore(hedge: ClosedHedge) {
  const ref = doc(db, 'closedHedges', hedge.id);
  await setDoc(ref, sanitizeDoc(hedge), { merge: true });
}

export async function deleteClosedHedgeFromFirestore(hedgeId: string) {
  const ref = doc(db, 'closedHedges', hedgeId);
  await deleteDoc(ref);
}

export async function saveLogToFirestore(log: AppLogEntry) {
  const ref = doc(db, 'logs', log.id);
  await setDoc(ref, sanitizeDoc(log));
}

export async function deleteLogFromFirestore(logId: string) {
  const ref = doc(db, 'logs', logId);
  await deleteDoc(ref);
}

export async function saveMetaToFirestore(data: { lastUpdatedText?: string; resetAt?: string }) {
  const ref = doc(db, 'meta', 'app_state');
  await setDoc(ref, sanitizeDoc(data), { merge: true });
}

export async function clearAllCollectionsFromFirestore() {
  try {
    const collectionsToClear = [
      'accounts',
      'traders',
      'expenses',
      'plannedHedges',
      'activeHedges',
      'closedHedges',
      'logs',
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }

    const metaRef = doc(db, 'meta', 'app_state');
    await setDoc(metaRef, {
      lastUpdatedText: `Last updated: ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}`,
      resetAt: new Date().toISOString(),
      isInitializedClean: true,
    }, { merge: true });

    console.log('Successfully cleared all Firestore collections for a fresh start.');
  } catch (err) {
    console.error('Error clearing Firestore collections:', err);
    throw err;
  }
}
