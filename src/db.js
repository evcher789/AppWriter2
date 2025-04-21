// db.js — инициализация и схема IndexedDB через Dexie.js
import Dexie from 'dexie';

const db = new Dexie('appWirter2DB');
db.version(1).stores({
  chapters: '++id,number,title,level,parentId,children',
  chapterContents: 'chapterNumber',
  chapterVersions: 'chapterNumber',
  chaptersOrder: 'id'
});

export default db;
