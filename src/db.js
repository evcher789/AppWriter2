// db.js — инициализация и схема IndexedDB через Dexie.js
import Dexie from 'dexie';

const db = new Dexie('AppWriterDB');
db.version(1).stores({
  chapters: '++id,number,title,level,parentId,children',
  chapterContents: 'chapterNumber',
  chapterVersions: 'chapterNumber',
  chaptersOrder: 'id'
});

export default db;
