// indexedDbStorage.js — слой для работы с IndexedDB через Dexie.js
import db from './db';

// Сохранение порядка глав
export async function saveChaptersOrder(chapters) {
  await db.chaptersOrder.clear();
  await db.chaptersOrder.add({ id: 1, chapters });
}

export async function loadChaptersOrder() {
  const rec = await db.chaptersOrder.get(1);
  return rec ? rec.chapters : null;
}

// Сохранение содержимого главы
export async function saveChapterContent(chapterNumber, content) {
  await db.chapterContents.put({ chapterNumber, content });
}

export async function loadChapterContent(chapterNumber) {
  const rec = await db.chapterContents.get(chapterNumber);
  return rec ? rec.content : '';
}

// Сохранение версий глав
export async function saveChapterVersions(versions) {
  await db.chapterVersions.put({ chapterNumber: 1, versions });
}

export async function loadChapterVersions() {
  const rec = await db.chapterVersions.get(1);
  return rec ? rec.versions : {};
}
