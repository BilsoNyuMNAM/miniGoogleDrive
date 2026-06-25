import React, { useState } from 'react';

export default function NoteSidebar({ notebook, activeNoteId, onSelectNote, onCreateNote, isSearchMode }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  if (!notebook) return null;

  const filteredNotes = filterQuery
    ? notebook.notes.filter(n =>
        n.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (n.subtitle && n.subtitle.toLowerCase().includes(filterQuery.toLowerCase()))
      )
    : notebook.notes;

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (newNoteTitle.trim()) {
      onCreateNote(newNoteTitle.trim(), notebook.id);
      setNewNoteTitle('');
      setIsCreating(false);
    }
  };

  return (
    <div className="note-sidebar-container">
      <div className="note-sidebar-header">
        <div className="note-sidebar-top-row">
          <h3 className="note-sidebar-folder-name">{notebook.name}</h3>
          <span className="note-sidebar-badge">{notebook.notes ? notebook.notes.length : 0} Notes</span>
        </div>
        <div className="note-sidebar-actions-row">
          <div className="note-filter-wrapper">
            <svg className="note-filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="note-filter-input"
              placeholder="Filter notes..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          {!isSearchMode && (
            <button
              className="new-note-btn"
              onClick={() => setIsCreating(true)}
              title="New Note"
            >
              + New
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <form className="new-note-form" onSubmit={handleCreateNote}>
          <input
            type="text"
            className="new-note-input"
            placeholder="Note title..."
            autoFocus
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onBlur={() => {
              if (!newNoteTitle.trim()) setIsCreating(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewNoteTitle('');
              }
            }}
          />
        </form>
      )}

      <ul className="note-sidebar-list">
        {filteredNotes && filteredNotes.length > 0 ? (
          filteredNotes.map((note, index) => {
            const isActive = activeNoteId === note.id;
            return (
              <li key={note.id} className="note-item-wrapper">
                <button
                  className={`note-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectNote(note.id)}
                >
                  <div className="note-item-content">
                    <div className="note-item-top">
                      <span className={`note-item-number ${isActive ? 'active-number' : ''}`}>
                        {index + 1}.
                      </span>
                      <span className="note-item-title">{note.title}</span>
                    </div>
                    {note.subtitle && (
                      <span className="note-item-subtitle">{note.subtitle}</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })
        ) : (
          <div className="empty-notes">
            {filterQuery ? 'No matching notes.' : 'No notes yet. Create one!'}
          </div>
        )}
      </ul>

      <style>{`
        .note-sidebar-container {
          padding: 0;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .note-sidebar-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--hairline);
          flex-shrink: 0;
        }

        .note-sidebar-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .note-sidebar-folder-name {
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }

        .note-sidebar-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
          padding: 3px 10px;
          border-radius: var(--rounded-pill);
          letter-spacing: 0.3px;
        }

        .note-sidebar-actions-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .note-filter-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .note-filter-icon {
          position: absolute;
          left: 10px;
          color: var(--muted-soft);
          pointer-events: none;
        }

        .note-filter-input {
          width: 100%;
          padding: 7px 12px 7px 32px;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--rounded-sm);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 12px;
          transition: all var(--transition-fast);
        }

        .note-filter-input:focus {
          border-color: var(--hairline-strong);
          background: var(--surface-strong);
        }

        .new-note-btn {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--primary);
          background: rgba(245, 78, 0, 0.1);
          padding: 7px 12px;
          border-radius: var(--rounded-sm);
          transition: all var(--transition-fast);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .new-note-btn:hover {
          background: rgba(245, 78, 0, 0.2);
        }

        .new-note-form {
          padding: 10px 20px;
          border-bottom: 1px solid var(--hairline-soft);
        }

        .new-note-input {
          width: 100%;
          padding: 8px 12px;
          background: var(--surface-card);
          border: 1px solid var(--primary);
          border-radius: var(--rounded-sm);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
        }

        .note-sidebar-list {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }

        .empty-notes {
          padding: 32px 24px;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        .note-item-wrapper {
          display: block;
        }

        .note-item {
          display: flex;
          align-items: flex-start;
          width: 100%;
          padding: 14px 20px;
          border-left: 3px solid transparent;
          background: transparent;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .note-item:hover:not(.active) {
          background: var(--surface-card);
        }

        .note-item.active {
          border-left-color: var(--primary);
          background: var(--surface-card);
        }

        .note-item-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .note-item-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .note-item-number {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--muted-soft);
          flex-shrink: 0;
          width: 22px;
        }

        .note-item.active .note-item-number {
          color: var(--primary);
        }

        .note-item-title {
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
          transition: color var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .note-item.active .note-item-title {
          color: var(--ink);
        }

        .note-item-subtitle {
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--muted-soft);
          padding-left: 32px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .note-item.active .note-item-subtitle {
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
