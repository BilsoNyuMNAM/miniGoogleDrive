import React, { useState } from 'react';

/* ─── Notebook Icon ─── */
function NotebookIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export default function NotebookList({ notebooks, activeNotebookId, onSelectNotebook, onCreateNotebook }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName);
      setNewNotebookName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="notebook-list-container">
      <div className="notebook-list-header">
        <h3 className="notebook-list-title">NOTEBOOKS</h3>
        <button className="new-notebook-btn" onClick={() => setIsCreating(true)} title="New Notebook">
          +
        </button>
      </div>

      <ul className="notebook-list">
        {notebooks.map((notebook, index) => {
          const isActive = activeNotebookId === notebook.id;
          return (
            <li key={notebook.id} className="notebook-item-wrapper">
              <button
                className={`notebook-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectNotebook(notebook.id)}
              >
                <div className="notebook-item-left">
                  <NotebookIcon active={isActive} />
                  <span className="notebook-item-name">{notebook.name}</span>
                </div>
                <span className={`notebook-item-count ${isActive ? 'active-count' : ''}`}>
                  {notebook.notes ? notebook.notes.length : 0}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {isCreating && (
        <form className="new-notebook-form" onSubmit={handleCreateSubmit}>
          <input
            type="text"
            className="new-notebook-input"
            placeholder="Notebook name..."
            autoFocus
            value={newNotebookName}
            onChange={(e) => setNewNotebookName(e.target.value)}
            onBlur={() => {
              if (!newNotebookName.trim()) setIsCreating(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewNotebookName('');
              }
            }}
          />
        </form>
      )}

      <style>{`
        .notebook-list-container {
          padding: 24px 0;
        }

        .notebook-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          margin-bottom: 12px;
        }

        .notebook-list-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.88px;
          text-transform: uppercase;
          color: var(--muted-soft);
        }

        .new-notebook-btn {
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

        .new-notebook-btn:hover {
          color: var(--ink);
          background: var(--surface-strong);
        }

        .notebook-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .notebook-item-wrapper {
          display: block;
        }

        .notebook-item {
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

        .notebook-item:hover:not(.active) {
          background: var(--surface-card);
        }

        .notebook-item.active {
          border-left-color: var(--primary);
          background: var(--surface-card);
        }

        .notebook-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notebook-item-name {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          transition: color var(--transition-fast);
        }

        .notebook-item.active .notebook-item-name {
          color: var(--ink);
        }

        .notebook-item-count {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          background: var(--surface-strong);
          padding: 2px 8px;
          border-radius: var(--rounded-pill);
        }

        .notebook-item.active .notebook-item-count {
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
        }

        .new-notebook-form {
          padding: 8px 24px;
        }

        .new-notebook-input {
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
