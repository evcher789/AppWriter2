// fileStorageOther.js — копия fileStorage.js, но для OtherTextsDB
import otherDb from './otherDb';

// Здесь реализуйте все функции как в fileStorage.js, только используйте otherDb вместо основной базы
// Пример:
export function isIndexedDBSupportedOther() {
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

// ... (скопируйте остальные функции из fileStorage.js и адаптируйте под otherDb)
