// Функции для работы с файловым хранилищем через File System Access API

// Переменная для хранения дескриптора директории
let dataDirectoryHandle = null;

// Функция для получения доступа к директории
const getDataDirectory = async () => {
  if (!dataDirectoryHandle) {
    try {
      // Запрашиваем у пользователя выбор директории
      dataDirectoryHandle = await window.showDirectoryPicker({
        id: 'app-writer-data',
        startIn: 'documents',
        mode: 'readwrite'
      });
      console.log('Получен доступ к директории для хранения данных');
    } catch (error) {
      console.error('Ошибка при получении доступа к директории:', error);
      throw error;
    }
  }
  return dataDirectoryHandle;
};

// Функция для сохранения данных в JSON файл
const saveToJsonFile = async (filename, data) => {
  try {
    const dirHandle = await getDataDirectory();
    
    // Создаем или открываем файл
    const fileHandle = await dirHandle.getFileHandle(`${filename}.json`, { create: true });
    
    // Получаем доступ на запись
    const writable = await fileHandle.createWritable();
    
    // Записываем данные
    await writable.write(JSON.stringify(data, null, 2));
    
    // Закрываем поток
    await writable.close();
    
    console.log(`Данные сохранены в ${filename}.json`);
  } catch (error) {
    console.error(`Ошибка при сохранении в ${filename}.json:`, error);
    throw error;
  }
};

// Функция для загрузки данных из JSON файла
const loadFromJsonFile = async (filename) => {
  try {
    const dirHandle = await getDataDirectory();
    
    try {
      // Пробуем получить файл
      const fileHandle = await dirHandle.getFileHandle(`${filename}.json`);
      
      // Получаем файл
      const file = await fileHandle.getFile();
      
      // Читаем содержимое
      const contents = await file.text();
      
      // Парсим JSON
      const data = JSON.parse(contents);
      
      console.log(`Данные загружены из ${filename}.json`);
      return data;
    } catch (error) {
      // Если файл не существует, возвращаем null
      if (error.name === 'NotFoundError') {
        console.log(`Файл ${filename}.json еще не существует`);
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при загрузке из ${filename}.json:`, error);
    throw error;
  }
};

// Функция для сохранения порядка глав
const saveChaptersOrder = (chapters) => {
  return saveToJsonFile('chapters_order', chapters);
};

// Функция для загрузки порядка глав
const loadChaptersOrder = () => {
  return loadFromJsonFile('chapters_order');
};

// Функция для сохранения содержимого главы
const saveChapterContent = (chapterNumber, content) => {
  return saveToJsonFile(`chapter_${chapterNumber}`, { content });
};

// Функция для загрузки содержимого главы
const loadChapterContent = async (chapterNumber) => {
  const data = await loadFromJsonFile(`chapter_${chapterNumber}`);
  return data ? data.content : '';
};

// Функция для сохранения версий глав
const saveChapterVersions = (versions) => {
  return saveToJsonFile('chapter_versions', versions);
};

// Функция для загрузки версий глав
const loadChapterVersions = () => {
  return loadFromJsonFile('chapter_versions');
};

// Проверка поддержки File System Access API
const isFileSystemAccessSupported = () => {
  return 'showDirectoryPicker' in window;
};

export {
  saveChaptersOrder,
  loadChaptersOrder,
  saveChapterContent,
  loadChapterContent,
  saveChapterVersions,
  loadChapterVersions,
  isFileSystemAccessSupported
};
