import React, { useState, useEffect, useRef } from 'react';
import { formatFileSize, getFileIcon, isPreviewable } from '../utils.js';

export default function FileDetail({ folder, file, fileIndex, totalFiles, allFolders, onPrev, onNext, onJump, onMoveFile, onDeleteFile, onRenameFile }) {
  const [textContent, setTextContent] = useState('');
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [showJumpMenu, setShowJumpMenu] = useState(false);
  const jumpMenuRef = useRef(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleRenameClick = () => {
    setNewTitle(file.title || file.originalName || file.filename);
    setIsRenaming(true);
  };

  const submitRename = () => {
    if (newTitle.trim() && newTitle.trim() !== (file.title || file.originalName || file.filename)) {
      onRenameFile(file.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  // Close jump menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (jumpMenuRef.current && !jumpMenuRef.current.contains(event.target)) {
        setShowJumpMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch text content if applicable
  useEffect(() => {
    setTextContent('');
    if (file && (file.mimetype.startsWith('text/') || file.mimetype.includes('json') || file.mimetype.includes('javascript'))) {
      setIsLoadingText(true);
      fetch(file.url || `/uploads/${file.filename}`)
        .then(res => res.text())
        .then(text => setTextContent(text))
        .catch(err => console.error("Failed to fetch text content", err))
        .finally(() => setIsLoadingText(false));
    }
  }, [file]);

  if (!file) {
    return (
      <div className="file-detail-empty">
        Select a file to view details
      </div>
    );
  }

  const fileExt = file.originalName?.split('.').pop()?.toUpperCase() || file.mimetype?.split('/')[1]?.toUpperCase() || 'UNKNOWN';
  const formattedDate = new Date(file.updatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const canPreview = isPreviewable(file.mimetype);
  const icon = getFileIcon(file.mimetype);

  const isTextBased = file.mimetype.startsWith('text/') || file.mimetype.includes('json') || file.mimetype.includes('javascript');
  const isPdf = file.mimetype === 'application/pdf';
  const isImage = file.mimetype.startsWith('image/');

  const handleImageClick = () => {
    window.open(file.url || `/uploads/${file.filename}`, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url ? `${file.url}?download=` : `/uploads/${file.filename}`;
    link.download = file.originalName || file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="file-detail-container">
      {/* Breadcrumb Header */}
      <div className="breadcrumb-header">
        <div className="breadcrumb">
          <span className="breadcrumb-icon">📁</span>
          <span className="breadcrumb-folder">{folder?.name}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-file">{file.title || file.originalName || file.filename}</span>
        </div>
        
        <div className="action-buttons">
          <select 
            className="action-select" 
            value="" 
            onChange={(e) => {
              if (e.target.value) {
                onMoveFile(file.id, e.target.value);
              }
            }}
          >
            <option value="" disabled>Move to...</option>
            {allFolders.map(f => (
              <option key={f.id} value={f.id} disabled={f.id === folder?.id}>
                {f.name}
              </option>
            ))}
          </select>

          <button className="action-btn" onClick={handleRenameClick} title="Rename file">
            Rename
          </button>

          <button className="action-btn" onClick={handleDownload} title="Download file">
            Download
          </button>

          <button 
            className="action-btn delete-btn" 
            onClick={() => {
              if (confirm('Are you sure you want to delete this file?')) {
                onDeleteFile(file.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="file-detail-content">
        <div className="preview-card glass">
          <div className="preview-visual">
            {isImage ? (
              <img 
                src={file.url || `/uploads/${file.filename}`} 
                alt={file.title} 
                className="preview-image clickable-image" 
                onClick={handleImageClick}
                title="Click to view full size"
              />
            ) : isPdf ? (
              <iframe src={file.url || `/uploads/${file.filename}`} className="preview-iframe" title="PDF Preview" />
            ) : isTextBased ? (
              <div className="preview-text">
                {isLoadingText ? 'Loading content...' : <pre><code>{textContent}</code></pre>}
              </div>
            ) : (
              <div className="preview-icon-large">{icon}</div>
            )}
          </div>
          
          <div className="preview-info">
            <h2 className="preview-title">{file.title || file.originalName || file.filename}</h2>
            <div className="preview-meta-grid">
              <span className="meta-label">Size</span>
              <span className="meta-value">{formatFileSize(file.size)}</span>
              
              <span className="meta-label">Type</span>
              <span className="meta-value">{fileExt}</span>
              
              <span className="meta-label">Modified</span>
              <span className="meta-value">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="file-navigation">
        <div className="nav-buttons">
          <div className="jump-menu-wrapper" ref={jumpMenuRef}>
            <button className="nav-btn" onClick={() => setShowJumpMenu(!showJumpMenu)}>
              Jump to ↗
            </button>
            {showJumpMenu && folder?.files && (
              <div className="jump-menu">
                {folder.files.map((f, idx) => (
                  <button 
                    key={f.id}
                    className={`jump-menu-item ${idx === fileIndex ? 'active' : ''}`}
                    onClick={() => {
                      onJump(idx);
                      setShowJumpMenu(false);
                    }}
                  >
                    {idx + 1} - {f.title || f.originalName || f.filename}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="nav-btn" onClick={onPrev} disabled={fileIndex === 0}>
            ← Prev
          </button>
          <button className="nav-btn" onClick={onNext} disabled={fileIndex === totalFiles - 1}>
            Next →
          </button>
        </div>
        <div className="nav-counter">
          File {fileIndex + 1} of {totalFiles}
        </div>
      </div>

      {/* Rename Modal Overlay */}
      {isRenaming && (
        <div className="rename-modal-overlay">
          <div className="rename-modal-content glass">
            <h4 className="rename-modal-title">Rename File</h4>
            <p className="rename-modal-desc">Enter a new name for this file:</p>
            <input 
              type="text" 
              className="rename-modal-input" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)} 
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
            />
            <div className="rename-modal-actions">
              <button className="rename-modal-btn cancel" onClick={() => setIsRenaming(false)}>Cancel</button>
              <button className="rename-modal-btn confirm" onClick={submitRename}>Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .file-detail-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--muted);
          font-size: 14px;
        }

        .file-detail-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }

        .breadcrumb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--hairline);
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 13px;
        }

        .breadcrumb-icon {
          color: var(--primary);
        }

        .breadcrumb-folder {
          color: var(--muted);
        }

        .breadcrumb-separator {
          color: var(--hairline-strong);
        }

        .breadcrumb-file {
          color: var(--ink);
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-select {
          background: var(--surface-card);
          color: var(--ink);
          border: 1px solid var(--hairline);
          padding: 6px 12px;
          border-radius: var(--rounded-sm);
          font-family: var(--font-mono);
          font-size: 12px;
          outline: none;
        }

        .action-select:focus {
          border-color: var(--primary);
        }

        .action-btn {
          font-family: var(--font-mono);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: var(--rounded-sm);
          border: 1px solid var(--hairline);
          background: transparent;
          color: var(--muted);
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--surface-card);
          color: var(--ink);
        }

        .delete-btn:hover {
          color: var(--semantic-error);
          border-color: var(--semantic-error);
          background: rgba(207, 45, 86, 0.1);
        }

        .file-detail-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          overflow-y: auto;
        }

        .preview-card {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          border-radius: var(--rounded-lg);
          overflow: hidden;
        }

        .preview-visual {
          height: 350px;
          background: #1e1b18; /* Dark brownish tint */
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--hairline);
          overflow: hidden;
        }

        .preview-icon-large {
          font-size: 80px;
          color: var(--primary);
          filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(3);
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .clickable-image {
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        
        .clickable-image:hover {
          transform: scale(1.02);
        }

        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: #fff;
        }

        .preview-text {
          width: 100%;
          height: 100%;
          padding: 16px;
          background: #121211;
          color: var(--ink);
          overflow: auto;
          font-family: var(--font-mono);
          font-size: 13px;
          text-align: left;
        }

        .preview-text pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .preview-info {
          padding: 24px;
        }

        .preview-title {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 24px;
        }

        .preview-meta-grid {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 13px;
        }

        .meta-label {
          color: var(--muted-soft);
        }

        .meta-value {
          color: var(--muted);
          text-align: right;
        }

        .file-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid var(--hairline);
        }

        .nav-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .jump-menu-wrapper {
          position: relative;
        }

        .jump-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          background: var(--surface-strong);
          border: 1px solid var(--hairline-strong);
          border-radius: var(--rounded-md);
          padding: 8px 0;
          min-width: 280px;
          max-height: 300px;
          overflow-y: auto;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          z-index: 100;
        }

        .jump-menu-item {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--body-strong);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .jump-menu-item:hover {
          background: var(--surface-card);
        }

        .jump-menu-item.active {
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
        }

        .nav-btn {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          background: transparent;
          border: 1px solid var(--hairline-strong);
          padding: 8px 16px;
          border-radius: var(--rounded-md);
          transition: all var(--transition-fast);
        }

        .nav-btn:hover:not(:disabled) {
          color: var(--ink);
          background: var(--surface-card);
          border-color: var(--muted-soft);
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-counter {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--muted-soft);
        }

        /* Rename Modal Styles */
        .rename-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .rename-modal-content {
          background: var(--surface-card);
          border: 1px solid var(--hairline-strong);
          border-radius: var(--rounded-md);
          padding: 24px;
          width: 320px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .rename-modal-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 8px;
        }

        .rename-modal-desc {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 16px;
        }

        .rename-modal-input {
          width: 100%;
          background: var(--canvas);
          border: 1px solid var(--hairline-strong);
          padding: 8px 12px;
          border-radius: var(--rounded-sm);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
          margin-bottom: 20px;
        }

        .rename-modal-input:focus {
          border-color: var(--primary);
          outline: none;
        }

        .rename-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .rename-modal-btn {
          font-size: 13px;
          font-weight: 500;
          padding: 6px 16px;
          border-radius: var(--rounded-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .rename-modal-btn.cancel {
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--hairline-strong);
        }

        .rename-modal-btn.cancel:hover {
          background: var(--surface-strong);
          color: var(--ink);
        }

        .rename-modal-btn.confirm {
          background: var(--primary);
          color: #fff;
          border: none;
        }

        .rename-modal-btn.confirm:hover {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}
