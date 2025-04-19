// Функции для работы с IndexedDB через Dexie.js
import {
  saveChaptersOrder as dbSaveChaptersOrder,
  loadChaptersOrder as dbLoadChaptersOrder,
  saveChapterContent as dbSaveChapterContent,
  loadChapterContent as dbLoadChapterContent,
  saveChapterVersions as dbSaveChapterVersions,
  loadChapterVersions as dbLoadChapterVersions
} from './indexedDbStorage';

export const saveChaptersOrder = dbSaveChaptersOrder;
export const loadChaptersOrder = dbLoadChaptersOrder;
export const saveChapterContent = dbSaveChapterContent;
export const loadChapterContent = dbLoadChapterContent;
export const saveChapterVersions = dbSaveChapterVersions;
export const loadChapterVersions = dbLoadChapterVersions;

// Функция для проверки поддержки IndexedDB (Dexie работает везде, где есть IndexedDB)
export const isIndexedDBSupported = () => {
  return 'indexedDB' in window;
};
