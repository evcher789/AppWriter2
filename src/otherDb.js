// otherDb.js — инициализация и схема IndexedDB через Dexie.js для страницы /other
import Dexie from 'dexie';

const otherDb = new Dexie('OtherTextsDB');
otherDb.version(1).stores({
  chapters: '++id,number,title,level,parentId,children',
  chapterContents: 'chapterNumber',
  chapterVersions: 'chapterNumber',
  chaptersOrder: 'id'
});

export default otherDb;
