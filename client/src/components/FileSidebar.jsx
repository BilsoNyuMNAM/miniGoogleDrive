import React, { useRef, useState } from 'react';

export default function FileSidebar({ folder, activeFileId, onSelectFile, onUploadComplete, isSearchMode }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [pendingUploadTitle, setPendingUploadTitle] = useState('');

  if (!folder) return null;

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set pending file and default title, wait for user confirmation
    setPendingUploadFile(file);
    setPendingUploadTitle(file.name);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmUpload = async () => {
    if (!pendingUploadFile) return;

    const formData = new FormData();
    formData.append('file', pendingUploadFile);
    formData.append('title', pendingUploadTitle || pendingUploadFile.name);
    if (folder.id !== 'uncategorized' && folder.id !== 'search') {
      formData.append('folderId', folder.id);
    }

    try {
      setIsUploading(true);
      setPendingUploadFile(null); // Close modal immediately
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onUploadComplete();
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed due to network error.');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setPendingUploadFile(null);
    setPendingUploadTitle('');
  };

  return (
    <div className="file-sidebar-container">
      <div className="file-sidebar-header">
        <h3 className="file-sidebar-title">FILES</h3>
        {!isSearchMode && (
          <>
            <button 
              className="upload-btn" 
              onClick={handleUploadClick}
              disabled={isUploading || !!pendingUploadFile}
              title="Upload file to this folder"
            >
              {isUploading ? 'Uploading...' : '↑ Upload'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
          </>
        )}
      </div>

      <ul className="file-sidebar-list">
        {folder.files && folder.files.length > 0 ? (
          folder.files.map((file, index) => {
            const isActive = activeFileId === file.id;
            return (
              <li key={file.id} className="file-item-wrapper">
                <button
                  className={`file-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectFile(file.id)}
                >
                  <div className="file-item-left">
                    <span className={`file-item-number ${isActive ? 'active-number' : ''}`}>
                      {index + 1}.
                    </span>
                    <span className="file-item-name" title={file.title || file.originalName}>
                      {file.title || file.originalName || file.filename}
                    </span>
                  </div>
                </button>
              </li>
            );
          })
        ) : (
          <div className="empty-files">
            No files in this folder.
          </div>
        )}
      </ul>

      {/* Rename & Confirm Upload Modal Overlay */}
      {pendingUploadFile && (
        <div className="rename-modal-overlay">
          <div className="rename-modal-content glass">
            <h4 className="rename-modal-title">Upload File</h4>
            <p className="rename-modal-desc">Rename this file before uploading (optional):</p>
            <input 
              type="text" 
              className="rename-modal-input" 
              value={pendingUploadTitle} 
              onChange={(e) => setPendingUploadTitle(e.target.value)} 
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmUpload();
                if (e.key === 'Escape') cancelUpload();
              }}
            />
            <div className="rename-modal-actions">
              <button className="rename-modal-btn cancel" onClick={cancelUpload}>Cancel</button>
              <button className="rename-modal-btn confirm" onClick={confirmUpload}>Upload</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .file-sidebar-container {
          padding: 24px 0;
          height: 100%;
          overflow-y: auto;
          position: relative;
        }

        .file-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          margin-bottom: 12px;
        }

        .file-sidebar-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.88px;
          text-transform: uppercase;
          color: var(--muted-soft);
        }

        .upload-btn {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
          padding: 4px 10px;
          border-radius: var(--rounded-pill);
          transition: all var(--transition-fast);
        }

        .upload-btn:hover:not(:disabled) {
          background: rgba(245, 78, 0, 0.2);
        }

        .upload-btn:disabled {
          opacity: 0.5;
          cursor: wait;
        }

        .file-sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .empty-files {
          padding: 24px;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        .file-item-wrapper {
          display: block;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 24px;
          border-left: 3px solid transparent;
          background: transparent;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .file-item:hover:not(.active) {
          background: var(--surface-card);
        }

        .file-item.active {
          border-left-color: var(--primary);
          background: var(--surface-card);
        }

        .file-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .file-item-number {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--muted-soft);
          flex-shrink: 0;
          width: 20px;
        }

        .file-item.active .file-item-number {
          color: var(--primary);
        }

        .file-item-name {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          transition: color var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-item.active .file-item-name {
          color: var(--ink);
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
