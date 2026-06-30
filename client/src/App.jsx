import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import FolderList from './components/FolderList.jsx';
import FileSidebar from './components/FileSidebar.jsx';
import FileDetail from './components/FileDetail.jsx';
import NotebookList from './components/NotebookList.jsx';
import NoteSidebar from './components/NoteSidebar.jsx';
import NoteDetail from './components/NoteDetail.jsx';

/* ─── Search Icon ─── */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ─── Drive Icon ─── */
function DriveIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ─── Notes Icon ─── */
function NotesIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/* ─── App Component ─── */
export default function App() {
  // ── Mode ──
  const [mode, setMode] = useState('drive'); // 'drive' | 'notes'

  // ── Panel Collapse ──
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [middleCollapsed, setMiddleCollapsed] = useState(false);

  // ── Drive State ──
  const [folders, setFolders] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef(null);

  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);

  // ── Notes State ──
  const [notebooks, setNotebooks] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [activeNotebookId, setActiveNotebookId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteSearchResults, setNoteSearchResults] = useState([]);
  const noteSearchTimeoutRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // DRIVE LOGIC (unchanged)
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/folders');
      if (!res.ok) throw new Error('Failed to fetch folders');
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSearchResults = useCallback(async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/files?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search files');
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  /* Debounced search */
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 350);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, fetchSearchResults]);

  // Set default active folder if none is selected
  useEffect(() => {
    if (folders.length > 0 && !activeFolderId && !searchQuery) {
      setActiveFolderId(folders[0].id);
    }
  }, [folders, activeFolderId, searchQuery]);

  // Handle folder creation
  const handleCreateFolder = async (name) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchFolders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compute currently active folder object (or mock search folder)
  const activeFolder = useMemo(() => {
    if (searchQuery) {
      return { id: 'search', name: `Search: "${searchQuery}"`, files: searchResults };
    }
    return folders.find(f => f.id === activeFolderId) || null;
  }, [folders, activeFolderId, searchQuery, searchResults]);

  // Set default active file when folder changes
  useEffect(() => {
    if (activeFolder && activeFolder.files.length > 0) {
      const isFileInFolder = activeFolder.files.some(f => f.id === activeFileId);
      if (!isFileInFolder) {
        setActiveFileId(activeFolder.files[0].id);
      }
    } else {
      setActiveFileId(null);
    }
  }, [activeFolder, activeFileId]);

  // Compute active file and its index
  const activeFileIndex = useMemo(() => {
    if (!activeFolder) return -1;
    return activeFolder.files.findIndex(f => f.id === activeFileId);
  }, [activeFolder, activeFileId]);

  const activeFile = useMemo(() => {
    if (!activeFolder || activeFileIndex === -1) return null;
    return activeFolder.files[activeFileIndex];
  }, [activeFolder, activeFileIndex]);

  // Navigation handlers
  const handlePrev = () => {
    if (activeFileIndex > 0) {
      setActiveFileId(activeFolder.files[activeFileIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (activeFolder && activeFileIndex < activeFolder.files.length - 1) {
      setActiveFileId(activeFolder.files[activeFileIndex + 1].id);
    }
  };

  const handleJump = (index) => {
    if (activeFolder && index >= 0 && index < activeFolder.files.length) {
      setActiveFileId(activeFolder.files[index].id);
    }
  };

  // Upload complete handler
  const handleUploadComplete = () => {
    fetchFolders();
  };

  // Move file handler
  const handleMoveFile = async (fileId, newFolderId) => {
    try {
      const res = await fetch(`/api/files/${fileId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: newFolderId })
      });
      if (res.ok) {
        fetchFolders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete file handler
  const handleDeleteFile = async (fileId) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFolders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rename file handler
  const handleRenameFile = async (fileId, newTitle) => {
    try {
      const res = await fetch(`/api/files/${fileId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        fetchFolders();
      } else {
        const err = await res.json();
        alert(`Rename failed: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Rename failed due to network error.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchNotebooks = useCallback(async () => {
    try {
      setNotesLoading(true);
      const res = await fetch('/api/notebooks');
      if (!res.ok) throw new Error('Failed to fetch notebooks');
      const data = await res.json();
      setNotebooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  // Fetch notebooks when switching to notes mode
  useEffect(() => {
    if (mode === 'notes') {
      fetchNotebooks();
    }
  }, [mode, fetchNotebooks]);

  // Set default active notebook
  useEffect(() => {
    if (notebooks.length > 0 && !activeNotebookId && !noteSearchQuery) {
      setActiveNotebookId(notebooks[0].id);
    }
  }, [notebooks, activeNotebookId, noteSearchQuery]);

  // Note search
  const fetchNoteSearchResults = useCallback(async (query) => {
    if (!query) {
      setNoteSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/notes?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search notes');
      const data = await res.json();
      setNoteSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'notes') return;
    if (noteSearchTimeoutRef.current) clearTimeout(noteSearchTimeoutRef.current);
    noteSearchTimeoutRef.current = setTimeout(() => {
      fetchNoteSearchResults(noteSearchQuery);
    }, 350);
    return () => clearTimeout(noteSearchTimeoutRef.current);
  }, [noteSearchQuery, fetchNoteSearchResults, mode]);

  // Compute active notebook
  const activeNotebook = useMemo(() => {
    if (noteSearchQuery) {
      return { id: 'search', name: `Search: "${noteSearchQuery}"`, notes: noteSearchResults };
    }
    return notebooks.find(nb => nb.id === activeNotebookId) || null;
  }, [notebooks, activeNotebookId, noteSearchQuery, noteSearchResults]);

  // Set default active note when notebook changes
  useEffect(() => {
    if (activeNotebook && activeNotebook.notes && activeNotebook.notes.length > 0) {
      const isNoteInNotebook = activeNotebook.notes.some(n => n.id === activeNoteId);
      if (!isNoteInNotebook) {
        setActiveNoteId(activeNotebook.notes[0].id);
      }
    } else {
      setActiveNoteId(null);
    }
  }, [activeNotebook, activeNoteId]);

  // Compute active note
  const activeNote = useMemo(() => {
    if (!activeNotebook || !activeNotebook.notes) return null;
    return activeNotebook.notes.find(n => n.id === activeNoteId) || null;
  }, [activeNotebook, activeNoteId]);

  // Create notebook
  const handleCreateNotebook = async (name) => {
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchNotebooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create note
  const handleCreateNote = async (title, notebookId, notionId = "") => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notebookId, notionId })
      });
      if (res.ok) {
        const newNote = await res.json();
        await fetchNotebooks();
        setActiveNoteId(newNote.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId, updates) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await fetchNotebooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchNotebooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="var(--primary)" />
                <path
                  d="M5 8C5 7.44772 5.44772 7 6 7H10L11.5 8.5H18C18.5523 8.5 19 8.94772 19 9.5V17C19 17.5523 18.5523 18 18 18H6C5.44772 18 5 17.5523 5 17V8Z"
                  fill="var(--canvas)"
                />
              </svg>
            </div>
            <div>
              <h1 className="header-title">MiniDrive</h1>
              <p className="header-subtitle">
                {mode === 'drive' ? 'Your personal file library' : 'Your personal notes'}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="mode-switcher">
            <button
              className={`mode-btn ${mode === 'drive' ? 'active' : ''}`}
              onClick={() => setMode('drive')}
            >
              <DriveIcon active={mode === 'drive'} />
              <span>Drive</span>
            </button>
            <button
              className={`mode-btn ${mode === 'notes' ? 'active' : ''}`}
              onClick={() => setMode('notes')}
            >
              <NotesIcon active={mode === 'notes'} />
              <span>Notes</span>
            </button>
          </div>

          <div className="header-search">
            <div className="search-wrapper">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="text"
                className="search-input"
                placeholder={mode === 'drive' ? 'Search files…' : 'Search notes…'}
                value={mode === 'drive' ? searchQuery : noteSearchQuery}
                onChange={(e) => {
                  if (mode === 'drive') {
                    setSearchQuery(e.target.value);
                  } else {
                    setNoteSearchQuery(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Pane Layout */}
      <main className="app-main">
        {mode === 'drive' ? (
          <>
            {/* Left Pane: Folders */}
            <aside className={`pane-left ${leftCollapsed ? 'collapsed' : ''}`}>
              <button className="pane-toggle pane-toggle-left" onClick={() => setLeftCollapsed(c => !c)} title={leftCollapsed ? 'Show folders' : 'Hide folders'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {leftCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
              {!leftCollapsed && (
                <FolderList
                  folders={folders}
                  activeFolderId={searchQuery ? null : activeFolderId}
                  onSelectFolder={(id) => {
                    setSearchQuery(''); // clear search when manually selecting folder
                    setActiveFolderId(id);
                  }}
                  onCreateFolder={handleCreateFolder}
                />
              )}
            </aside>

            {/* Middle Pane: Files in Folder */}
            <section className={`pane-middle ${middleCollapsed ? 'collapsed' : ''}`}>
              <button className="pane-toggle pane-toggle-middle" onClick={() => setMiddleCollapsed(c => !c)} title={middleCollapsed ? 'Show files' : 'Hide files'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {middleCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
              {!middleCollapsed && (
                <FileSidebar
                  folder={activeFolder}
                  activeFileId={activeFileId}
                  onSelectFile={setActiveFileId}
                  onUploadComplete={handleUploadComplete}
                  isSearchMode={!!searchQuery}
                />
              )}
            </section>

            {/* Right Pane: File Detail */}
            <section className="pane-right">
              <FileDetail
                folder={activeFolder}
                file={activeFile}
                fileIndex={activeFileIndex}
                totalFiles={activeFolder ? activeFolder.files.length : 0}
                allFolders={folders}
                onPrev={handlePrev}
                onNext={handleNext}
                onJump={handleJump}
                onMoveFile={handleMoveFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
              />
            </section>
          </>
        ) : (
          <>
            {/* Left Pane: Notebooks */}
            <aside className={`pane-left ${leftCollapsed ? 'collapsed' : ''}`}>
              <button className="pane-toggle pane-toggle-left" onClick={() => setLeftCollapsed(c => !c)} title={leftCollapsed ? 'Show notebooks' : 'Hide notebooks'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {leftCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
              {!leftCollapsed && (
                <NotebookList
                  notebooks={notebooks}
                  activeNotebookId={noteSearchQuery ? null : activeNotebookId}
                  onSelectNotebook={(id) => {
                    setNoteSearchQuery('');
                    setActiveNotebookId(id);
                  }}
                  onCreateNotebook={handleCreateNotebook}
                />
              )}
            </aside>

            {/* Middle Pane: Notes in Notebook */}
            <section className={`pane-middle ${middleCollapsed ? 'collapsed' : ''}`}>
              <button className="pane-toggle pane-toggle-middle" onClick={() => setMiddleCollapsed(c => !c)} title={middleCollapsed ? 'Show notes' : 'Hide notes'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {middleCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
              {!middleCollapsed && (
                <NoteSidebar
                  notebook={activeNotebook}
                  activeNoteId={activeNoteId}
                  onSelectNote={setActiveNoteId}
                  onCreateNote={handleCreateNote}
                  isSearchMode={!!noteSearchQuery}
                />
              )}
            </section>

            {/* Right Pane: Note Detail */}
            <section className="pane-right">
              <NoteDetail
                notebook={activeNotebook}
                note={activeNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
              />
            </section>
          </>
        )}
      </main>

      <style>{`
        .app {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--canvas);
        }

        /* ── Header ── */
        .app-header {
          flex-shrink: 0;
          height: 72px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--hairline);
          padding: 0 24px;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 20px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .header-title {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 500;
          color: var(--ink);
          line-height: 1.2;
        }

        .header-subtitle {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--muted);
        }

        /* ── Mode Switcher ── */
        .mode-switcher {
          display: flex;
          align-items: center;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--rounded-md);
          padding: 3px;
          gap: 2px;
          flex-shrink: 0;
        }

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--rounded-sm);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          color: var(--muted);
          background: transparent;
          transition: all var(--transition-fast);
          cursor: pointer;
          border: none;
          white-space: nowrap;
        }

        .mode-btn:hover:not(.active) {
          color: var(--body);
          background: var(--surface-strong);
        }

        .mode-btn.active {
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
          font-weight: 600;
        }

        /* ── Search ── */
        .header-search {
          width: 320px;
          flex-shrink: 0;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--muted-soft);
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--rounded-md);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          border-color: var(--hairline-strong);
          background: var(--surface-strong);
        }

        /* ── Main Layout ── */
        .app-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .pane-left {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid var(--hairline);
          background: var(--canvas);
          overflow-y: auto;
          transition: width var(--transition-normal), min-width var(--transition-normal);
          position: relative;
        }

        .pane-left.collapsed {
          width: 40px;
          min-width: 40px;
          overflow: hidden;
        }

        .pane-middle {
          width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--hairline);
          background: var(--canvas);
          overflow-y: auto;
          transition: width var(--transition-normal), min-width var(--transition-normal);
          position: relative;
        }

        .pane-middle.collapsed {
          width: 40px;
          min-width: 40px;
          overflow: hidden;
        }

        .pane-right {
          flex: 1;
          background: var(--canvas);
          min-width: 0;
          overflow: hidden;
        }

        /* ── Panel Toggle Buttons ── */
        .pane-toggle {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%) translateX(50%);
          z-index: 10;
          width: 24px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--rounded-sm);
          color: var(--muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          opacity: 0;
        }

        .pane-left:hover .pane-toggle,
        .pane-middle:hover .pane-toggle,
        .pane-left.collapsed .pane-toggle,
        .pane-middle.collapsed .pane-toggle {
          opacity: 1;
        }

        .pane-toggle:hover {
          color: var(--ink);
          background: var(--surface-strong);
          border-color: var(--hairline-strong);
        }

        .pane-left.collapsed .pane-toggle {
          right: 50%;
          transform: translateY(-50%) translateX(50%);
        }

        .pane-middle.collapsed .pane-toggle {
          right: 50%;
          transform: translateY(-50%) translateX(50%);
        }

        /* ── Responsive Design ── */
        @media (max-width: 768px) {
          .header-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .app-header {
            height: auto;
            padding: 16px 24px;
          }
          .header-search {
            width: 100%;
          }
          .mode-switcher {
            align-self: center;
          }
          .app-main {
            flex-direction: column;
            overflow-y: auto;
          }
          .pane-left, .pane-middle, .pane-right {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--hairline);
            flex: none;
            overflow: visible;
          }
          .pane-left {
            max-height: 300px;
            overflow-y: auto;
          }
          .pane-middle {
            max-height: 400px;
            overflow-y: auto;
          }
          .pane-right {
            border-bottom: none;
            min-height: 500px;
          }
        }
      `}</style>
    </div>
  );
}
