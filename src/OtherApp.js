import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FiEdit2, FiPlus, FiChevronDown, FiTrash2, FiSave, FiDownload, FiUpload, FiClock, FiMenu, FiX } from 'react-icons/fi';
import { isIndexedDBSupportedOther } from './fileStorageOther';
import otherDb from './otherDb';

function OtherApp() {
  const [text, setText] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [activeChapter, setActiveChapter] = useState(1);
  const [chapters, setChapters] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [versions, setVersions] = useState({});
  const [editingChapter, setEditingChapter] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const titleInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [storageInfo] = useState(() => {
    return isIndexedDBSupportedOther() ? 'IndexedDB (Dexie.js)' : 'localStorage';
  });

  useEffect(() => {
    async function loadChaptersFromDb() {
      let savedChapters = await otherDb.chapters.toArray();
      if (savedChapters.length > 0) {
        setChapters(savedChapters);
      } else {
        const initialChapters = Array.from({ length: 5 }, (_, i) => ({
          id: `chapter-${i + 1}`,
          number: i + 1,
          title: `Глава ${i + 1}`,
          level: 0,
          parentId: null,
          children: []
        }));
        setChapters(initialChapters);
        await otherDb.chapters.bulkAdd(initialChapters);
      }
      loadChapter(activeChapter);
    }
    loadChaptersFromDb();
    autoSaveTimerRef.current = setInterval(() => {
      if (!isSaved) {
        saveText();
      }
    }, 5000);
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadChapter(activeChapter);
    // eslint-disable-next-line
  }, [activeChapter]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const loadChapter = async (chapterNumber) => {
    const chapterContent = await otherDb.chapterContents.get({ chapterNumber });
    if (chapterContent && chapterContent.content) {
      setText(chapterContent.content);
    } else {
      setText('');
    }
    setIsSaved(true);
    // Загрузка версий
    let chapterVersions = await otherDb.chapterVersions.get({ chapterNumber });
    setVersions(prev => ({ ...prev, [chapterNumber]: chapterVersions ? chapterVersions.versions : [] }));
  };

  const saveText = async () => {
    await otherDb.chapterContents.put({ chapterNumber: activeChapter, content: text });
    await createNewVersion(activeChapter, text);
    setIsSaved(true);
  };

  const createNewVersion = async (chapterNumber, content) => {
    let chapterVersions = await otherDb.chapterVersions.get({ chapterNumber });
    chapterVersions = chapterVersions ? chapterVersions.versions : [];
    const timestamp = new Date().toISOString();
    const maxId = chapterVersions.length > 0 ? Math.max(...chapterVersions.map(v => v.id)) : 0;
    const newVersion = {
      id: maxId + 1,
      timestamp,
      content
    };
    let updatedVersions = [...chapterVersions, newVersion];
    if (updatedVersions.length > 10) {
      updatedVersions = updatedVersions.slice(updatedVersions.length - 10);
    }
    await otherDb.chapterVersions.put({ chapterNumber, versions: updatedVersions });
    setVersions(prev => ({ ...prev, [chapterNumber]: updatedVersions }));
  };

  const restoreVersion = async (chapterNumber, versionId) => {
    let chapterVersions = await otherDb.chapterVersions.get({ chapterNumber });
    chapterVersions = chapterVersions ? chapterVersions.versions : [];
    const versionToRestore = chapterVersions.find(v => v.id === versionId);
    if (versionToRestore) {
      setText(versionToRestore.content);
      await otherDb.chapterContents.put({ chapterNumber, content: versionToRestore.content });
      setIsSaved(true);
    }
  };

  const exportDataToJson = async () => {
    if (!isSaved) {
      await saveText();
    }
    const allChapters = await otherDb.chapters.toArray();
    const allVersionsArr = await otherDb.chapterVersions.toArray();
    const allContentsArr = await otherDb.chapterContents.toArray();
    const allVersions = {};
    allVersionsArr.forEach(v => { allVersions[v.chapterNumber] = v.versions; });
    const allContents = {};
    allContentsArr.forEach(c => { allContents[c.chapterNumber] = c.content; });
    const allData = {
      chapters: allChapters,
      versions: allVersions,
      chapterContents: allContents
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `other-app-writer-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  };

  const importDataFromJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.chapters || !importedData.versions || !importedData.chapterContents) {
          alert('Неверный формат файла. Файл должен содержать главы, версии и содержимое глав.');
          return;
        }
        await otherDb.chapters.clear();
        await otherDb.chapterVersions.clear();
        await otherDb.chapterContents.clear();
        await otherDb.chapters.bulkAdd(importedData.chapters);
        for (const [chapterNumber, versions] of Object.entries(importedData.versions)) {
          await otherDb.chapterVersions.put({ chapterNumber: Number(chapterNumber), versions });
        }
        for (const [chapterNumber, content] of Object.entries(importedData.chapterContents)) {
          await otherDb.chapterContents.put({ chapterNumber: Number(chapterNumber), content });
        }
        setChapters(importedData.chapters);
        setVersions(importedData.versions);
        loadChapter(activeChapter);
        alert('Данные успешно импортированы!');
      } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        alert('Ошибка при импорте данных. Проверьте формат файла.');
      }
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
    if (!isSaved) {
      saveText();
    }
    setActiveChapter(chapterNumber);
  };

  // Drag-and-drop, add, edit, delete главы (аналогично App.js)
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', index);
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const isInUpperHalf = y < height / 2;
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
    if (isInUpperHalf) {
      e.currentTarget.classList.add('drag-over-top');
    } else {
      e.currentTarget.classList.add('drag-over-bottom');
    }
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
  };
  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedItem === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const isInUpperHalf = y < height / 2;
    const newChapters = Array.from(chapters);
    const [movedChapter] = newChapters.splice(draggedItem, 1);
    let insertIndex = index;
    if (!isInUpperHalf && index < newChapters.length) {
      insertIndex = index + 1;
    } else if (draggedItem < index) {
      insertIndex = index - 1;
    }
    newChapters.splice(insertIndex, 0, movedChapter);
    setChapters(newChapters);
    otherDb.chapters.clear().then(() => otherDb.chapters.bulkAdd(newChapters));
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    });
    setDraggedItem(null);
  };
  const handleDragEnd = (e) => {
    e.preventDefault();
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    });
    setDraggedItem(null);
  };

  const addChapter = async (afterIndex = null, parentChapter = null) => {
    if (!isSaved) {
      await saveText();
    }
    const maxChapterNumber = Math.max(...chapters.map(ch => ch.number), 0);
    const newChapterNumber = maxChapterNumber + 1;
    let level = 0;
    let parentId = null;
    if (parentChapter) {
      level = parentChapter.level + 1;
      parentId = parentChapter.id;
    }
    const newChapter = {
      id: `chapter-${newChapterNumber}`,
      number: newChapterNumber,
      title: level === 0 ? `Глава ${newChapterNumber}` : `Подглава ${newChapterNumber}`,
      level,
      parentId,
      children: []
    };
    let updatedChapters = [...chapters];
    if (afterIndex !== null) {
      updatedChapters.splice(afterIndex + 1, 0, newChapter);
    } else {
      updatedChapters.push(newChapter);
    }
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
    await otherDb.chapters.clear();
    await otherDb.chapters.bulkAdd(updatedChapters);
    setActiveChapter(newChapterNumber);
  };
  const addSubchapter = (parentIndex) => {
    const parentChapter = chapters[parentIndex];
    addChapter(parentIndex, parentChapter);
  };
  const deleteChapter = async (chapterNumber, e) => {
    e.stopPropagation();
    if (chapters.length <= 1) {
      alert('Нельзя удалить единственную главу');
      return;
    }
    const chapterToDelete = chapters.find(ch => ch.number === chapterNumber);
    if (!chapterToDelete) return;
    const idsToDelete = [chapterToDelete.id, ...getAllChildrenIds(chapterToDelete.id)];
    const updatedChapters = chapters.filter(ch => !idsToDelete.includes(ch.id));
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
    await otherDb.chapters.clear();
    await otherDb.chapters.bulkAdd(updatedChapters);
    idsToDelete.forEach(async id => {
      const chapter = chapters.find(ch => ch.id === id);
      if (chapter) {
        await otherDb.chapterContents.delete({ chapterNumber: chapter.number });
      }
    });
    if (activeChapter === chapterNumber) {
      const firstAvailableChapter = updatedChapters[0]?.number || 1;
      setActiveChapter(firstAvailableChapter);
    }
  };
  const getAllChildrenIds = (parentId) => {
    const childrenIds = [];
    const childChapters = chapters.filter(ch => ch.parentId === parentId);
    childChapters.forEach(child => {
      childrenIds.push(child.id);
      const nestedChildren = getAllChildrenIds(child.id);
      if (nestedChildren.length > 0) {
        childrenIds.push(...nestedChildren);
      }
    });
    return childrenIds;
  };
  const editChapterTitle = (chapterNumber, e) => {
    e.stopPropagation();
    setEditingChapter(chapterNumber);
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        const length = titleInputRef.current.value.length;
        titleInputRef.current.setSelectionRange(length, length);
      }
    }, 10);
  };
  const saveChapterTitle = async (chapterNumber, newTitle) => {
    if (newTitle && newTitle.trim() !== '') {
      const updatedChapters = chapters.map(ch =>
        ch.number === chapterNumber ? { ...ch, title: newTitle } : ch
      );
      setChapters(updatedChapters);
      await otherDb.chapters.clear();
      await otherDb.chapters.bulkAdd(updatedChapters);
    }
    setEditingChapter(null);
  };
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
  const handleTitleKeyDown = (e, chapterNumber) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChapterTitle(chapterNumber, e.target.value);
    } else if (e.key === 'Escape') {
      setEditingChapter(null);
    }
  };
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

  // Версии главы (аналогично App.js)
  const renderVersionButtons = () => {
    const chapterVersions = versions[activeChapter] || [];
    return chapterVersions
      .slice()
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

  // Переключение sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="App">
      <div style={{ background: '#222', color: '#4ec9b0', padding: '6px 0', fontSize: 13, textAlign: 'center' }}>
        Storage: {storageInfo}
      </div>
      <div className="container">
        <button 
          className={`sidebar-toggle ${sidebarVisible ? 'active' : ''}`} 
          onClick={toggleSidebar}
          aria-label="Переключить боковую панель"
        >
          {sidebarVisible ? <FiX /> : <FiMenu />}
        </button>
        <div className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}> 
          <div className="chapters-header">
            <h2>Главы</h2>
            <button className="add-chapter-button" onClick={() => addChapter()}>
              Add chapter
            </button>
          </div>
          <div className="chapters-list">
            {chapters.map((chapter, idx) => renderChapter(chapter, idx))}
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

export default OtherApp;
