/**
 * IndexedDB 封装 —— v2：新增 mood 字段
 */

const DB_NAME = 'mood-diary';
const DB_VERSION = 3;
const STORE_NAME = 'entries';

let db = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      const oldVersion = event.oldVersion;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('role', 'role', { unique: false });
        store.createIndex('mood', 'mood', { unique: false });
      } else {
        const tx = request.transaction;
        const store = tx.objectStore(STORE_NAME);

        if (oldVersion < 2) {
          if (!store.indexNames.contains('role')) {
            store.createIndex('role', 'role', { unique: false });
          }
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              if (!cursor.value.role) { cursor.value.role = 'self'; cursor.update(cursor.value); }
              cursor.continue();
            }
          };
        }

        if (oldVersion < 3) {
          if (!store.indexNames.contains('mood')) {
            store.createIndex('mood', 'mood', { unique: false });
          }
        }
      }
    };

    request.onsuccess = (event) => { db = event.target.result; resolve(db); };
    request.onerror = (event) => { console.error('IndexedDB 初始化失败:', event.target.error); reject(event.target.error); };
  });
}

export function saveEntry(entry) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('数据库未初始化'));
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = (event) => reject(event.target.error);
  });
}

export function getEntry(id) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('数据库未初始化'));
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

export function deleteEntry(id) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('数据库未初始化'));
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

export function getAllEntries(filters = {}) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('数据库未初始化'));
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const entries = [];
    const request = index.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (matchFilters(cursor.value, filters)) entries.push(cursor.value);
        cursor.continue();
      } else { resolve(entries); }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

export function getStats(role) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('数据库未初始化'));
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let entries = request.result;
      if (role) entries = entries.filter((e) => e.role === role);

      const total = entries.length;
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentEntries = entries.filter((e) => new Date(e.date) >= sevenDaysAgo);

      // This month
      const now = new Date();
      const thisMonth = entries.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const goodCount = entries.filter((e) => e.mood === 'good').length;
      const neutralCount = entries.filter((e) => e.mood === 'neutral').length;
      const badCount = entries.filter((e) => e.mood === 'bad').length;
      const favoriteCount = entries.filter((e) => e.isFavorite).length;

      const thisMonthGood = thisMonth.filter((e) => e.mood === 'good').length;
      const thisMonthNeutral = thisMonth.filter((e) => e.mood === 'neutral').length;
      const thisMonthBad = thisMonth.filter((e) => e.mood === 'bad').length;

      // Top strategies
      const strategyCount = {};
      entries.forEach((e) => { if (e.strategies) e.strategies.forEach((st) => { strategyCount[st] = (strategyCount[st] || 0) + 1; }); });
      const topStrategies = Object.entries(strategyCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

      resolve({ total, recentCount: recentEntries.length, topStrategies, goodCount, neutralCount, badCount, favoriteCount, thisMonth: thisMonth.length, thisMonthGood, thisMonthNeutral, thisMonthBad });
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

function matchFilters(entry, filters) {
  if (!filters) return true;
  if (filters.role && filters.role !== 'all' && entry.role !== filters.role) return false;
  if (filters.mood && filters.mood !== 'all' && entry.mood !== filters.mood) return false;
  if (filters.type && filters.type !== 'all' && entry.type !== filters.type) return false;
  if (filters.month) {
    const d = new Date(entry.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (m !== filters.month) return false;
  }
  if (filters.emotion && (!entry.emotions || !entry.emotions.includes(filters.emotion))) return false;
  if (filters.strategy && (!entry.strategies || !entry.strategies.includes(filters.strategy))) return false;
  if (filters.search) {
    const keyword = filters.search.toLowerCase();
    const sf = [entry.trigger, entry.patientReaction, entry.title, entry.content, entry.note, entry.strategyNote, entry.emotionText, ...(entry.emotions || []), ...(entry.strategies || []), ...(entry.tags || [])].filter(Boolean).join(' ');
    if (!sf.toLowerCase().includes(keyword)) return false;
  }
  return true;
}
