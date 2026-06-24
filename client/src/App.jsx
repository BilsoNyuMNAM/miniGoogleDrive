import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import FolderList from './components/FolderList.jsx';
import FileSidebar from './components/FileSidebar.jsx';
import FileDetail from './components/FileDetail.jsx';

/* ─── Search Icon ─── */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ─── App Component ─── */
export default function App() {
  const [folders, setFolders] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef(null);

  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);

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
              <p className="header-subtitle">Your personal file library</p>
            </div>
          </div>

          <div className="header-search">
            <div className="search-wrapper">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="text"
                className="search-input"
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Pane Layout */}
      <main className="app-main">
        {/* Left Pane: Folders */}
        <aside className="pane-left">
          <FolderList
            folders={folders}
            activeFolderId={searchQuery ? null : activeFolderId}
            onSelectFolder={(id) => {
              setSearchQuery(''); // clear search when manually selecting folder
              setActiveFolderId(id);
            }}
            onCreateFolder={handleCreateFolder}
          />
        </aside>

        {/* Middle Pane: Files in Folder */}
        <section className="pane-middle">
          <FileSidebar
            folder={activeFolder}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onUploadComplete={handleUploadComplete}
            isSearchMode={!!searchQuery}
          />
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
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .header-search {
          width: 320px;
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
        }

        .pane-middle {
          width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--hairline);
          background: var(--canvas);
          overflow-y: auto;
        }

        .pane-right {
          flex: 1;
          background: var(--canvas);
          min-width: 0;
          overflow: hidden;
        }

        /* ── Responsive Design ── */
        @media (max-width: 768px) {
          .header-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .app-header {
            height: auto;
            padding: 16px 24px;
          }
          .header-search {
            width: 100%;
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
