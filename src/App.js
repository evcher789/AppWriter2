import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FiEdit2, FiPlus, FiChevronDown, FiTrash2, FiSave, FiDownload, FiUpload, FiClock } from 'react-icons/fi';

function App() {
  const [text, setText] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [activeChapter, setActiveChapter] = useState(1);
  const [chapters, setChapters] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [versions, setVersions] = useState({});
  const [editingChapter, setEditingChapter] = useState(null);
  const titleInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Инициализация списка глав
  useEffect(() => {
    // Проверяем, есть ли сохраненный порядок глав
    const savedChapters = localStorage.getItem('chapters_order');
    if (savedChapters) {
      // Проверяем и исправляем структуру данных, если необходимо
      const parsedChapters = JSON.parse(savedChapters);
      const fixedChapters = parsedChapters.map(ch => ({
        ...ch,
        level: ch.level || 0,
        parentId: ch.parentId || null,
        children: Array.isArray(ch.children) ? ch.children : []
      }));
      setChapters(fixedChapters);
      localStorage.setItem('chapters_order', JSON.stringify(fixedChapters));
    } else {
      // Если нет, создаем начальный список
      const initialChapters = Array.from({ length: 5 }, (_, i) => ({
        id: `chapter-${i + 1}`,
        number: i + 1,
        title: `Глава ${i + 1}`,
        level: 0, // Уровень вложенности (0 - глава, 1 - подглава и т.д.)
        parentId: null, // Идентификатор родительской главы (null для корневых глав)
        children: [] // Массив идентификаторов дочерних глав
      }));
      setChapters(initialChapters);
      localStorage.setItem('chapters_order', JSON.stringify(initialChapters)); 
    }
    
    // Загружаем сохраненные версии
    const savedVersions = localStorage.getItem('chapter_versions');
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    }
    
    loadChapter(activeChapter);
    
    // Настройка автосохранения каждые 5 секунд
    autoSaveTimerRef.current = setInterval(() => {
      if (!isSaved) {
        saveText();
      }
    }, 5000);
    
    // Очистка таймера при размонтировании компонента
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Эффект для отслеживания изменения активной главы
  useEffect(() => {
    loadChapter(activeChapter);
  }, [activeChapter]);

  // Функция загрузки главы
  const loadChapter = (chapterNumber) => {
    const savedText = localStorage.getItem(`chapter_${chapterNumber}`);
    if (savedText) {
      setText(savedText);
    } else {
      setText('');
    }
    setIsSaved(true);
  };

  // Функция сохранения текста
  const saveText = () => {
    // Сохраняем текущий текст
    localStorage.setItem(`chapter_${activeChapter}`, text);
    
    // Создаем новую версию
    createNewVersion(activeChapter, text);
    
    console.log(`Глава ${activeChapter} автоматически сохранена`);
    setIsSaved(true);
  };

  // Функция создания новой версии
  const createNewVersion = (chapterNumber, content) => {
    const chapterVersions = versions[chapterNumber] || [];
    const timestamp = new Date().toISOString();
    
    // Находим максимальный ID версии для этой главы
    const maxId = chapterVersions.length > 0 
      ? Math.max(...chapterVersions.map(v => v.id))
      : 0;
    
    // Создаем новую версию с инкрементированным ID
    const newVersion = {
      id: maxId + 1,
      timestamp,
      content
    };
    
    // Ограничиваем количество версий до 10
    let updatedVersions = [...chapterVersions, newVersion];
    if (updatedVersions.length > 10) {
      // Сортируем по ID и оставляем только 10 последних
      updatedVersions = updatedVersions
        .sort((a, b) => a.id - b.id)
        .slice(updatedVersions.length - 10);
    }
    
    // Обновляем состояние и сохраняем в localStorage
    const newVersions = {
      ...versions,
      [chapterNumber]: updatedVersions
    };
    
    setVersions(newVersions);
    localStorage.setItem('chapter_versions', JSON.stringify(newVersions));
  };

  // Функция восстановления версии
  const restoreVersion = (chapterNumber, versionId) => {
    const chapterVersions = versions[chapterNumber] || [];
    const versionToRestore = chapterVersions.find(v => v.id === versionId);
    
    if (versionToRestore) {
      setText(versionToRestore.content);
      localStorage.setItem(`chapter_${chapterNumber}`, versionToRestore.content);
      setIsSaved(true);
    }
  };

  // Функция экспорта всех данных в JSON файл
  const exportDataToJson = () => {
    // Сохраняем текущий текст, если есть несохраненные изменения
    if (!isSaved) {
      saveText();
    }
    
    // Собираем все данные
    const allData = {
      chapters: chapters,
      versions: versions,
      chapterContents: {}
    };
    
    // Добавляем содержимое всех глав
    chapters.forEach(chapter => {
      const chapterContent = localStorage.getItem(`chapter_${chapter.number}`);
      if (chapterContent) {
        allData.chapterContents[chapter.number] = chapterContent;
      }
    });
    
    // Создаем файл для скачивания
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Создаем ссылку для скачивания и кликаем по ней
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-writer-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Очищаем ресурсы
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  };
  
  // Функция импорта данных из JSON файла
  const importDataFromJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Проверяем структуру данных
        if (!importedData.chapters || !importedData.versions || !importedData.chapterContents) {
          alert('Неверный формат файла. Файл должен содержать главы, версии и содержимое глав.');
          return;
        }
        
        // Сохраняем порядок глав
        setChapters(importedData.chapters);
        localStorage.setItem('chapters_order', JSON.stringify(importedData.chapters));
        
        // Сохраняем версии
        setVersions(importedData.versions);
        localStorage.setItem('chapter_versions', JSON.stringify(importedData.versions));
        
        // Сохраняем содержимое глав
        Object.entries(importedData.chapterContents).forEach(([chapterNumber, content]) => {
          localStorage.setItem(`chapter_${chapterNumber}`, content);
        });
        
        // Загружаем текущую главу
        loadChapter(activeChapter);
        
        alert('Данные успешно импортированы!');
      } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        alert('Ошибка при импорте данных. Проверьте формат файла.');
      }
      
      // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
      event.target.value = null;
    };
    
    reader.readAsText(file);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    saveText();
  };

  const handleChapterChange = (chapterNumber) => {
    // Сначала сохраняем текущую главу, если есть несохраненные изменения
    if (!isSaved) {
      saveText();
    }
    setActiveChapter(chapterNumber);
  };

  // Функции для drag-and-drop
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    // Добавляем класс для стилизации
    e.target.classList.add('dragging');
    
    // Сохраняем данные о перетаскиваемом элементе
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    
    if (draggedItem === index) return;
    
    setDragOverItem(index);
    
    // Получаем координаты элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Определяем, находится ли курсор в верхней или нижней половине элемента
    const isInUpperHalf = y < height / 2;
    
    // Удаляем все возможные классы позиционирования
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
    
    // Добавляем соответствующий класс
    if (isInUpperHalf) {
      e.currentTarget.classList.add('drag-over-top');
    } else {
      e.currentTarget.classList.add('drag-over-bottom');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Удаляем классы для стилизации
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    
    // Если перетаскивание на то же место, ничего не делаем
    if (draggedItem === index) return;
    
    // Получаем координаты элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Определяем, находится ли курсор в верхней или нижней половине элемента
    const isInUpperHalf = y < height / 2;
    
    // Создаем копию массива глав
    const newChapters = Array.from(chapters);
    // Удаляем перетаскиваемый элемент
    const [movedChapter] = newChapters.splice(draggedItem, 1);
    
    // Вставляем элемент в зависимости от положения курсора
    let insertIndex = index;
    if (!isInUpperHalf && index < newChapters.length) {
      insertIndex = index + 1;
    } else if (draggedItem < index) {
      insertIndex = index - 1;
    }
    
    // Вставляем перетаскиваемый элемент на новую позицию
    newChapters.splice(insertIndex, 0, movedChapter);

    // Обновляем состояние и сохраняем новый порядок
    setChapters(newChapters);
    localStorage.setItem('chapters_order', JSON.stringify(newChapters));
    
    // Удаляем классы для стилизации
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    });
    
    // Сбрасываем состояние перетаскивания
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    // Удаляем классы для стилизации
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    });
    
    // Сбрасываем состояние перетаскивания
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Функция добавления новой главы
  const addChapter = (afterIndex = null, parentChapter = null) => {
    // Сохраняем текущую главу перед добавлением новой
    if (!isSaved) {
      saveText();
    }

    // Находим максимальный номер главы
    const maxChapterNumber = Math.max(...chapters.map(ch => ch.number), 0);
    const newChapterNumber = maxChapterNumber + 1;
    
    // Определяем уровень вложенности и родительскую главу
    let level = 0;
    let parentId = null;
    
    if (parentChapter) {
      level = parentChapter.level + 1;
      parentId = parentChapter.id;
    }
    
    // Создаем новую главу
    const newChapter = {
      id: `chapter-${newChapterNumber}`,
      number: newChapterNumber,
      title: level === 0 ? `Глава ${newChapterNumber}` : `Подглава ${newChapterNumber}`,
      level,
      parentId,
      children: []
    };
    
    // Добавляем в список и сохраняем
    let updatedChapters = [...chapters];
    
    if (afterIndex !== null) {
      // Вставляем после указанного индекса
      updatedChapters.splice(afterIndex + 1, 0, newChapter);
    } else {
      // Добавляем в конец списка
      updatedChapters.push(newChapter);
    }
    
    // Если у главы есть родитель, обновляем список дочерних элементов родителя
    if (parentId) {
      updatedChapters = updatedChapters.map(ch => {
        if (ch.id === parentId) {
          return {
            ...ch,
            children: Array.isArray(ch.children) ? [...ch.children, newChapter.id] : [newChapter.id]
          };
        }
        return ch;
      });
    }
    
    setChapters(updatedChapters);
    localStorage.setItem('chapters_order', JSON.stringify(updatedChapters));
    
    // Переключаемся на новую главу
    setActiveChapter(newChapterNumber);
  };

  // Функция добавления подглавы
  const addSubchapter = (parentIndex) => {
    const parentChapter = chapters[parentIndex];
    addChapter(parentIndex, parentChapter);
  };

  // Функция удаления главы
  const deleteChapter = (chapterNumber, e) => {
    e.stopPropagation();
    
    if (chapters.length <= 1) {
      alert('Нельзя удалить единственную главу');
      return;
    }

    // Находим главу, которую нужно удалить
    const chapterToDelete = chapters.find(ch => ch.number === chapterNumber);
    if (!chapterToDelete) return;
    
    // Получаем все идентификаторы глав, которые нужно удалить (включая дочерние)
    const idsToDelete = [chapterToDelete.id, ...getAllChildrenIds(chapterToDelete.id)];
    
    // Удаляем главы из списка
    const updatedChapters = chapters.filter(ch => !idsToDelete.includes(ch.id));
    
    // Обновляем список дочерних элементов у родительской главы
    if (chapterToDelete.parentId) {
      const parentIndex = updatedChapters.findIndex(ch => ch.id === chapterToDelete.parentId);
      if (parentIndex !== -1) {
        updatedChapters[parentIndex] = {
          ...updatedChapters[parentIndex],
          children: Array.isArray(updatedChapters[parentIndex].children) 
            ? updatedChapters[parentIndex].children.filter(id => id !== chapterToDelete.id)
            : []
        };
      }
    }
    
    setChapters(updatedChapters);
    localStorage.setItem('chapters_order', JSON.stringify(updatedChapters));
    
    // Удаляем содержимое глав
    idsToDelete.forEach(id => {
      const chapter = chapters.find(ch => ch.id === id);
      if (chapter) {
        localStorage.removeItem(`chapter_${chapter.number}`);
      }
    });
    
    // Если удаляем активную главу, переключаемся на первую доступную
    if (activeChapter === chapterNumber) {
      const firstAvailableChapter = updatedChapters[0]?.number || 1;
      setActiveChapter(firstAvailableChapter);
    }
  };

  // Функция для получения всех идентификаторов дочерних глав
  const getAllChildrenIds = (parentId) => {
    const childrenIds = [];
    const childChapters = chapters.filter(ch => ch.parentId === parentId);
    
    childChapters.forEach(child => {
      childrenIds.push(child.id);
      // Рекурсивно получаем идентификаторы дочерних элементов
      const nestedChildren = getAllChildrenIds(child.id);
      if (nestedChildren.length > 0) {
        childrenIds.push(...nestedChildren);
      }
    });
    
    return childrenIds;
  };

  // Функция редактирования заголовка главы
  const editChapterTitle = (chapterNumber, e) => {
    e.stopPropagation();
    setEditingChapter(chapterNumber);
    
    // Устанавливаем фокус на поле ввода после рендеринга
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        // Устанавливаем курсор в конец текста
        const length = titleInputRef.current.value.length;
        titleInputRef.current.setSelectionRange(length, length);
      }
    }, 10);
  };
  
  // Функция сохранения отредактированного заголовка
  const saveChapterTitle = (chapterNumber, newTitle) => {
    if (newTitle && newTitle.trim() !== '') {
      const updatedChapters = chapters.map(ch => 
        ch.number === chapterNumber ? { ...ch, title: newTitle } : ch
      );
      setChapters(updatedChapters);
      localStorage.setItem('chapters_order', JSON.stringify(updatedChapters));
    }
    setEditingChapter(null);
  };
  
  // Обработчик клика вне поля редактирования для сохранения
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingChapter !== null && 
          titleInputRef.current && 
          !titleInputRef.current.contains(event.target)) {
        saveChapterTitle(editingChapter, titleInputRef.current.value);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingChapter]);
  
  // Обработчик нажатия клавиши Enter для сохранения
  const handleTitleKeyDown = (e, chapterNumber) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChapterTitle(chapterNumber, e.target.value);
    } else if (e.key === 'Escape') {
      setEditingChapter(null);
    }
  };

  // Функция для отображения главы с правильным отступом
  const renderChapter = (chapter, index) => {
    return (
      <div
        key={chapter.id}
        className={`chapter-item ${activeChapter === chapter.number ? 'active' : ''} ${draggedItem === index ? 'dragging' : ''} level-${chapter.level}`}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        onClick={() => handleChapterChange(chapter.number)}
      >
        <div className="chapter-title">
          {editingChapter === chapter.number ? (
            <input
              ref={titleInputRef}
              type="text"
              className="chapter-title-input"
              defaultValue={chapter.title}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleTitleKeyDown(e, chapter.number)}
            />
          ) : (
            chapter.title
          )}
        </div>
        <div className="chapter-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="icon-button edit-button" 
            onClick={(e) => editChapterTitle(chapter.number, e)}
            title="Редактировать"
          >
            <FiEdit2 />
          </button>
          <button 
            className="icon-button add-button" 
            onClick={(e) => {
              e.stopPropagation();
              addChapter(index);
            }}
            title="Добавить главу после этой"
          >
            <FiPlus />
          </button>
          <button 
            className="icon-button add-subchapter-button" 
            onClick={(e) => {
              e.stopPropagation();
              addSubchapter(index);
            }}
            title="Добавить подглаву"
          >
            <FiChevronDown />
          </button>
          <button 
            className="icon-button delete-button" 
            onClick={(e) => deleteChapter(chapter.number, e)}
            title="Удалить главу"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    );
  };

  // Функция для отображения кнопок версий
  const renderVersionButtons = () => {
    const chapterVersions = versions[activeChapter] || [];
    
    // Сортируем версии по ID в порядке убывания (от новых к старым)
    return chapterVersions
      .sort((a, b) => b.id - a.id)
      .map(version => (
        <button 
          key={version.id}
          className="version-button"
          onClick={() => restoreVersion(activeChapter, version.id)}
          title={`Версия ${version.id} (${new Date(version.timestamp).toLocaleString()})`}
        >
          V{version.id}
        </button>
      ));
  };

  return (
    <div className="App">
      <div className="container">
        <div className="sidebar">
          <div className="chapters-header">
            <h2>Главы</h2>
            <button className="add-chapter-button" onClick={() => addChapter()}>
              Добавить главу
            </button>
          </div>
          <div className="chapters-list">
            {chapters.map((chapter, index) => renderChapter(chapter, index))}
          </div>
        </div>
        <div className="editor-section">
          <div className="text-editor-container">
            <textarea
              className="full-screen-textarea"
              value={text}
              onChange={handleTextChange}
              placeholder="Введите текст главы здесь..."
            />
            <div className="toolbar">
              <div className="toolbar-left">
                <button 
                  className={`save-button ${!isSaved ? 'unsaved' : ''}`} 
                  onClick={handleSave}
                  disabled={isSaved}
                >
                  <FiSave className="save-icon" />
                  <span>{isSaved ? 'Сохранено' : 'Сохранить'}</span>
                </button>
                <div className="status-indicator">
                  {!isSaved && <span className="autosave-message"></span>}
                </div>
              </div>
              <div className="toolbar-right">
                <div className="versions-container">
                  {renderVersionButtons()}
                </div>
                <div className="data-actions">
                  <button 
                    className="version-button export-button" 
                    onClick={exportDataToJson}
                    title="Экспортировать данные в JSON файл"
                  >
                    <FiDownload />
                    <span>Экспорт</span>
                  </button>
                  <button 
                    className="version-button import-button" 
                    onClick={() => fileInputRef.current.click()}
                    title="Импортировать данные из JSON файла"
                  >
                    <FiUpload />
                    <span>Импорт</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".json" 
                    onChange={importDataFromJson} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
