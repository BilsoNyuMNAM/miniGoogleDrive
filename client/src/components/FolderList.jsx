import React, { useState } from 'react';

export default function FolderList({ folders, activeFolderId, onSelectFolder, onCreateFolder }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName);
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="folder-list-container">
      <div className="folder-list-header">
        <h3 className="folder-list-title">FOLDERS</h3>
        <button className="new-folder-btn" onClick={() => setIsCreating(true)} title="New Folder">
          +
        </button>
      </div>

      <ul className="folder-list">
        {folders.map((folder, index) => {
          const isActive = activeFolderId === folder.id;
          return (
            <li key={folder.id} className="folder-item-wrapper">
              <button
                className={`folder-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectFolder(folder.id)}
              >
                <div className="folder-item-left">
                  <span className={`folder-item-number ${isActive ? 'active-number' : ''}`}>
                    {folder.id === 'uncategorized' ? '-' : `${index + 1}.`}
                  </span>
                  <span className="folder-item-name">{folder.name}</span>
                </div>
                <span className={`folder-item-count ${isActive ? 'active-count' : ''}`}>
                  {folder.files ? folder.files.length : 0}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {isCreating && (
        <form className="new-folder-form" onSubmit={handleCreateSubmit}>
          <input
            type="text"
            className="new-folder-input"
            placeholder="Folder name..."
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => setIsCreating(false)}
          />
        </form>
      )}

      <style>{`
        .folder-list-container {
          padding: 24px 0;
        }

        .folder-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          margin-bottom: 12px;
        }

        .folder-list-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.88px;
          text-transform: uppercase;
          color: var(--muted-soft);
        }

        .new-folder-btn {
          color: var(--muted);
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: var(--rounded-sm);
          transition: all var(--transition-fast);
        }

        .new-folder-btn:hover {
          color: var(--ink);
          background: var(--surface-strong);
        }

        .folder-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .folder-item-wrapper {
          display: block;
        }

        .folder-item {
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

        .folder-item:hover:not(.active) {
          background: var(--surface-card);
        }

        .folder-item.active {
          border-left-color: var(--primary);
          background: var(--surface-card);
        }

        .folder-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .folder-item-number {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--muted-soft);
          width: 20px;
        }

        .folder-item.active .folder-item-number {
          color: var(--primary);
        }

        .folder-item-name {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          transition: color var(--transition-fast);
        }

        .folder-item.active .folder-item-name {
          color: var(--ink);
        }

        .folder-item-count {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          background: var(--surface-strong);
          padding: 2px 8px;
          border-radius: var(--rounded-pill);
        }

        .folder-item.active .folder-item-count {
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
        }

        .new-folder-form {
          padding: 8px 24px;
        }

        .new-folder-input {
          width: 100%;
          padding: 8px 12px;
          background: var(--surface-card);
          border: 1px solid var(--primary);
          border-radius: var(--rounded-sm);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
