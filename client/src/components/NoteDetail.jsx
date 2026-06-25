import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK EDITOR — NoteDetail (v2)
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  bg: '#0d0d0f',
  surface: '#131316',
  surface2: '#1c1c21',
  border: '#2a2a31',
  accent: '#7c6fff',
  accentSoft: 'rgba(124,111,255,0.12)',
  accentBorder: 'rgba(124,111,255,0.25)',
  text: '#e8e8ed',
  muted: '#6b6b78',
  dim: '#3a3a44',
  code: '#b4b4c8',
  para: '#c4c4cc',
};

/* ─── Helpers ─── */
let _c = 0;
const uid = () => `b${Date.now()}_${_c++}`;

function autoH(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

/* ─── Parse / Serialize ─── */
function parseContent(content) {
  if (!content) return [{ id: uid(), type: 'paragraph', value: '' }];
  try {
    const p = JSON.parse(content);
    if (Array.isArray(p) && p.length > 0) return p.map(b => ({ ...b, id: b.id || uid() }));
  } catch {
    return mdToBlocks(content);
  }
  return [{ id: uid(), type: 'paragraph', value: '' }];
}

function mdToBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('# ')) { blocks.push({ id: uid(), type: 'heading', value: l.slice(2) }); i++; continue; }
    if (l.startsWith('## ')) { blocks.push({ id: uid(), type: 'subheading', value: l.slice(3) }); i++; continue; }
    if (l.startsWith('> ')) { blocks.push({ id: uid(), type: 'callout', value: l.slice(2), icon: '💡' }); i++; continue; }
    if (l.startsWith('```')) {
      const cl = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) { cl.push(lines[i]); i++; }
      i++;
      blocks.push({ id: uid(), type: 'code', value: cl.join('\n'), language: 'javascript' });
      continue;
    }
    if (l.match(/^!\[([^\]]*)\]\(([^)]+)\)/)) {
      const m = l.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      blocks.push({ id: uid(), type: 'image', imageUrl: m[2], caption: m[1] || '' });
      i++; continue;
    }
    if (l.trim() === '') { i++; continue; }
    let pl = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^[#>!`]/.test(lines[i])) { pl.push(lines[i]); i++; }
    blocks.push({ id: uid(), type: 'paragraph', value: pl.join('\n') });
  }
  return blocks.length ? blocks : [{ id: uid(), type: 'paragraph', value: '' }];
}

function serialize(blocks) {
  return JSON.stringify(blocks.map(({ id, ...r }) => r));
}

function newBlock(type) {
  const b = { id: uid(), type, value: '' };
  if (type === 'callout') b.icon = '💡';
  if (type === 'code') b.language = 'javascript';
  if (type === 'image') { b.imageUrl = null; b.caption = ''; }
  return b;
}

const BLOCK_TYPES = [
  { type: 'heading', label: 'H1 Heading', icon: 'H1' },
  { type: 'subheading', label: 'H2 Sub-heading', icon: 'H2' },
  { type: 'paragraph', label: 'Paragraph', icon: '¶' },
  { type: 'code', label: 'Code Block', icon: '{ }' },
  { type: 'callout', label: 'Callout / Note', icon: '💡' },
  { type: 'image', label: 'Image Upload', icon: '🖼' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE BLOCK
// ═══════════════════════════════════════════════════════════════════════════

function Block({ block, onChange, isEditing }) {
  const taRef = useRef(null);
  const imgRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [imgHov, setImgHov] = useState(false);

  useEffect(() => { if (taRef.current) autoH(taRef.current); }, [block.value, block.type]);

  const onInput = (e) => { autoH(e.target); onChange({ ...block, value: e.target.value }); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(block.value || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const onImgFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('title', `note-img-${Date.now()}`);
    try {
      const r = await fetch('/api/files', { method: 'POST', body: fd });
      if (r.ok) { const d = await r.json(); onChange({ ...block, imageUrl: d.url }); }
    } catch (err) { console.error(err); }
    if (imgRef.current) imgRef.current.value = '';
  };

  // ── Heading ──
  if (block.type === 'heading') {
    if (!isEditing) return <div className="bk-heading-view">{block.value || 'Untitled'}</div>;
    return <textarea ref={taRef} className="bk-heading" value={block.value || ''} onChange={onInput} placeholder="Heading" rows={1} />;
  }

  // ── Subheading ──
  if (block.type === 'subheading') {
    if (!isEditing) return <div className="bk-sub-view">{block.value || 'Untitled'}</div>;
    return <textarea ref={taRef} className="bk-sub" value={block.value || ''} onChange={onInput} placeholder="Sub-heading" rows={1} />;
  }

  // ── Paragraph ──
  if (block.type === 'paragraph') {
    if (!isEditing) return block.value ? <div className="bk-para-view">{block.value}</div> : null;
    return <textarea ref={taRef} className="bk-para" value={block.value || ''} onChange={onInput} placeholder="Type something..." rows={1} />;
  }

  // ── Callout ──
  if (block.type === 'callout') {
    if (!isEditing) return (
      <div className="bk-callout">
        <div className="bk-callout-icon">{block.icon || '💡'}</div>
        <div className="bk-callout-body">{block.value}</div>
      </div>
    );
    return (
      <div className="bk-callout">
        <div className="bk-callout-icon">{block.icon || '💡'}</div>
        <textarea ref={taRef} className="bk-callout-ta" value={block.value || ''} onChange={onInput} placeholder="Callout note..." rows={1} />
      </div>
    );
  }

  // ── Code ──
  if (block.type === 'code') {
    if (!isEditing) return (
      <div className="bk-code-wrap">
        <div className="bk-code-head">
          <span className="bk-code-lang">{block.language || 'code'}</span>
          <button className="bk-code-copy" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <pre className="bk-code-pre"><code>{block.value}</code></pre>
      </div>
    );
    return (
      <div className="bk-code-wrap">
        <div className="bk-code-head">
          <input className="bk-code-lang-in" value={block.language || ''} onChange={(e) => onChange({ ...block, language: e.target.value })} placeholder="language" />
          <button className="bk-code-copy" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <textarea ref={taRef} className="bk-code-ta" value={block.value || ''} onChange={onInput} placeholder="// Write code here..." rows={5} />
      </div>
    );
  }

  // ── Image ──
  if (block.type === 'image') {
    return (
      <div>
        <div
          className={`bk-img-wrap ${!block.imageUrl ? 'empty' : ''}`}
          onClick={() => { if (!block.imageUrl && isEditing && imgRef.current) imgRef.current.click(); }}
          onMouseEnter={() => setImgHov(true)}
          onMouseLeave={() => setImgHov(false)}
        >
          {!block.imageUrl ? (
            <div className="bk-img-ph">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span className="bk-img-ph-text">Click to upload an image</span>
              <span className="bk-img-ph-hint">PNG, JPG, GIF up to 10MB</span>
            </div>
          ) : (
            <>
              <img src={block.imageUrl} alt={block.caption || ''} className="bk-img" />
              {isEditing && imgHov && (
                <button className="bk-img-rm" onClick={(e) => { e.stopPropagation(); onChange({ ...block, imageUrl: null }); }}>✕</button>
              )}
            </>
          )}
          {isEditing && <input type="file" accept="image/*" ref={imgRef} style={{ display: 'none' }} onChange={onImgFile} />}
        </div>
        {isEditing ? (
          <input className="bk-img-cap" value={block.caption || ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} placeholder="Caption (optional)…" />
        ) : (
          block.caption && <div className="bk-img-cap-view">{block.caption}</div>
        )}
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// INSERT DIVIDER — shows a "+" between blocks
// ═══════════════════════════════════════════════════════════════════════════

function InsertDivider({ onInsert }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="insert-divider" ref={ref}>
      <div className="insert-line" />
      <button className="insert-btn" onClick={() => setOpen(!open)} title="Insert block here">+</button>
      <div className="insert-line" />
      {open && (
        <div className="insert-menu">
          {BLOCK_TYPES.map(bt => (
            <button key={bt.type} className="insert-menu-item" onClick={() => { onInsert(bt.type); setOpen(false); }}>
              <span className="insert-menu-icon">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NoteDetail({ notebook, note, onUpdateNote, onDeleteNote }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title || '');
      setEditSubtitle(note.subtitle || '');
      setBlocks(parseContent(note.content));
      setIsEditing(false);
    }
  }, [note?.id]);

  useEffect(() => { if (titleRef.current) autoH(titleRef.current); }, [editTitle, isEditing]);

  const save = useCallback(async () => {
    if (!note || isSaving) return;
    setIsSaving(true);
    try {
      await onUpdateNote(note.id, { title: editTitle, subtitle: editSubtitle, content: serialize(blocks) });
      setIsEditing(false);
    } finally { setIsSaving(false); }
  }, [note, editTitle, editSubtitle, blocks, isSaving, onUpdateNote]);

  const onKey = (e) => {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
    if (e.key === 'Escape' && isEditing) {
      setIsEditing(false);
      if (note) { setEditTitle(note.title || ''); setEditSubtitle(note.subtitle || ''); setBlocks(parseContent(note.content)); }
    }
  };

  // Block ops
  const updateBlock = (i, b) => setBlocks(p => p.map((x, j) => j === i ? b : x));
  const removeBlock = (i) => setBlocks(p => { const n = p.filter((_, j) => j !== i); return n.length ? n : [{ id: uid(), type: 'paragraph', value: '' }]; });
  const insertAt = (i, type) => setBlocks(p => { const c = [...p]; c.splice(i, 0, newBlock(type)); return c; });
  const addBottom = (type) => setBlocks(p => [...p, newBlock(type)]);

  // Drag & Drop
  const onDragStart = (e, i) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
    // Make drag image slightly transparent
    if (e.target) e.target.style.opacity = '0.5';
  };
  const onDragEnd = (e) => {
    if (e.target) e.target.style.opacity = '1';
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const onDragOver = (e, i) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(i);
  };
  const onDrop = (e, dropI) => {
    e.preventDefault();
    const fromI = dragIdx;
    if (fromI === null || fromI === dropI) { setDragIdx(null); setDragOverIdx(null); return; }
    setBlocks(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromI, 1);
      const targetI = dropI > fromI ? dropI - 1 : dropI;
      copy.splice(targetI, 0, moved);
      return copy;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // ── Empty ──
  if (!note) {
    return (
      <div className="nd-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <p style={{ font: '500 16px Sora, sans-serif', color: C.muted }}>Select a note to view</p>
        <p style={{ font: '400 13px Inter, sans-serif', color: C.dim }}>Or create a new one from the sidebar</p>
        <style>{`
          .nd-empty { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; background:${C.bg}; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="nd" onKeyDown={onKey}>
      {/* Top bar */}
      <div className="nd-top">
        <div className="nd-bc">
          <span className="nd-bc-nb">{notebook?.name || 'Notes'}</span>
          <span className="nd-bc-sep">›</span>
          <span className="nd-bc-n">{note.title}</span>
        </div>
        <div className="nd-acts">
          {isEditing ? (
            <>
              <button className="nd-btn nd-save" onClick={save} disabled={isSaving}>{isSaving ? '...' : '✓ Save'}</button>
              <button className="nd-btn" onClick={() => { setIsEditing(false); setEditTitle(note.title||''); setEditSubtitle(note.subtitle||''); setBlocks(parseContent(note.content)); }}>Cancel</button>
            </>
          ) : (
            <>
              <button className="nd-btn" onClick={() => setIsEditing(true)} title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="nd-btn nd-del-btn" onClick={() => setShowDeleteConfirm(true)} title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {isEditing && (
        <div className="nd-toolbar">
          {BLOCK_TYPES.map(bt => (
            <button key={bt.type} className={`tb-b ${bt.type === 'image' ? 'tb-img' : ''}`} onClick={() => addBottom(bt.type)}>
              {bt.icon}{bt.type === 'heading' || bt.type === 'subheading' ? '' : ` ${bt.label.split(' ').pop()}`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="nd-scroll">
        <div className="nd-inner">
          {/* Title */}
          {isEditing ? (
            <textarea ref={titleRef} className="nd-title-e" value={editTitle} onChange={(e) => { setEditTitle(e.target.value); autoH(e.target); }} placeholder="Note title..." rows={1} />
          ) : (
            <h1 className="nd-title-v">{note.title}</h1>
          )}

          {/* Subtitle */}
          {isEditing ? (
            <input className="nd-sub-e" value={editSubtitle} onChange={(e) => setEditSubtitle(e.target.value)} placeholder="Short description..." />
          ) : (
            note.subtitle && <p className="nd-sub-v">{note.subtitle}</p>
          )}

          {/* Meta */}
          {!isEditing && (
            <div className="nd-meta">
              Last edited {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}

          {/* Blocks */}
          <div className="nd-blocks">
            {isEditing && <InsertDivider onInsert={(type) => insertAt(0, type)} />}

            {blocks.map((block, idx) => (
              <React.Fragment key={block.id}>
                <div
                  className={`bk-row ${dragOverIdx === idx ? 'drag-over' : ''} ${dragIdx === idx ? 'dragging' : ''}`}
                  draggable={isEditing}
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={(e) => onDrop(e, idx)}
                >
                  {/* Drag handle + delete */}
                  {isEditing && (
                    <div className="bk-controls">
                      <span className="bk-handle" title="Drag to reorder">⠿</span>
                      <button className="bk-del" onClick={() => removeBlock(idx)} title="Delete block">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  )}
                  <div className="bk-body">
                    <Block block={block} onChange={(b) => updateBlock(idx, b)} isEditing={isEditing} />
                  </div>
                </div>

                {isEditing && <InsertDivider onInsert={(type) => insertAt(idx + 1, type)} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 28, width: 380, background: C.surface }}>
            <h4 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 12 }}>Delete Note</h4>
            <p style={{ fontSize: 14, color: C.para, marginBottom: 24, lineHeight: 1.6 }}>
              Delete "<strong>{note.title}</strong>"? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={async () => { await onDeleteNote(note.id); setShowDeleteConfirm(false); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = `
/* Container */
.nd { height:100%; display:flex; flex-direction:column; overflow:hidden; background:${C.bg}; }

/* Top bar */
.nd-top { display:flex; align-items:center; justify-content:space-between; padding:14px 28px; border-bottom:1px solid ${C.border}; flex-shrink:0; }
.nd-bc { display:flex; align-items:center; gap:8px; }
.nd-bc-nb { font: 500 12px 'Space Mono', monospace; color:${C.muted}; }
.nd-bc-sep { font-size:14px; color:${C.dim}; }
.nd-bc-n  { font: 600 12px 'Space Mono', monospace; color:${C.text}; }
.nd-acts { display:flex; gap:6px; }
.nd-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 12px; border-radius:6px; font:500 12px 'Inter', sans-serif; color:${C.muted}; background:transparent; border:none; cursor:pointer; transition:all 150ms; }
.nd-btn:hover { color:${C.text}; background:${C.surface2}; }
.nd-save { color:#4ade80; background:rgba(74,222,128,0.1); font-weight:600; }
.nd-save:hover { background:rgba(74,222,128,0.18); }
.nd-del-btn:hover { color:#ef4444; background:rgba(239,68,68,0.1); }

/* Toolbar */
.nd-toolbar { display:flex; gap:4px; padding:8px 12px; margin:12px 28px 0; background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; flex-shrink:0; flex-wrap:wrap; }
.tb-b { padding:6px 12px; border-radius:6px; font:500 12px 'Inter', sans-serif; color:${C.muted}; background:transparent; border:none; cursor:pointer; transition:all 150ms; white-space:nowrap; }
.tb-b:hover { color:${C.text}; background:${C.surface2}; }
.tb-img { color:${C.accent}; background:${C.accentSoft}; display:inline-flex; align-items:center; gap:5px; }
.tb-img:hover { background:${C.accent}; color:#fff; }

/* Scroll area */
.nd-scroll { flex:1; overflow-y:auto; }
.nd-inner { max-width:760px; margin:0 auto; padding:32px 40px 80px; }

/* Title */
.nd-title-e { display:block; width:100%; font:700 32px 'Sora', sans-serif; color:${C.text}; background:transparent; border:none; border-bottom:2px solid ${C.border}; padding:0 0 12px; margin-bottom:12px; resize:none; overflow:hidden; letter-spacing:-0.5px; outline:none; }
.nd-title-e:focus { border-bottom-color:${C.accent}; }
.nd-title-e::placeholder { color:${C.dim}; }
.nd-title-v { font:700 32px 'Sora', sans-serif; color:${C.text}; letter-spacing:-0.5px; margin-bottom:12px; line-height:1.25; }

/* Subtitle */
.nd-sub-e { display:block; width:100%; font:400 16px 'Inter', sans-serif; color:${C.para}; background:transparent; border:none; border-bottom:1px solid ${C.border}; padding:0 0 10px; margin-bottom:20px; outline:none; }
.nd-sub-e:focus { border-bottom-color:${C.dim}; }
.nd-sub-e::placeholder { color:${C.dim}; }
.nd-sub-v { font:400 17px 'Inter', sans-serif; color:${C.para}; margin-bottom:16px; line-height:1.5; }

/* Meta */
.nd-meta { font:400 12px 'Space Mono', monospace; color:${C.dim}; padding-bottom:24px; margin-bottom:28px; border-bottom:1px solid ${C.border}; }

/* ═══ BLOCKS ═══ */
.nd-blocks { display:flex; flex-direction:column; }

/* Block row */
.bk-row {
  display: flex;
  align-items: flex-start;
  gap: 0;
  position: relative;
  border-radius: 8px;
  transition: background 150ms ease, box-shadow 150ms ease;
}
.bk-row.drag-over {
  box-shadow: 0 -2px 0 0 ${C.accent};
}
.bk-row.dragging {
  opacity: 0.4;
}

/* Controls (handle + delete) */
.bk-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px 6px 0;
  opacity: 0;
  transition: opacity 150ms;
  flex-shrink: 0;
  width: 28px;
}
.bk-row:hover .bk-controls { opacity: 1; }

.bk-handle {
  font-size: 14px;
  color: ${C.dim};
  cursor: grab;
  user-select: none;
  line-height: 1;
}
.bk-handle:active { cursor: grabbing; }

.bk-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: ${C.dim};
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 150ms;
}
.bk-del:hover { color: #ef4444; background: rgba(239,68,68,0.12); }

/* Block body */
.bk-body { flex: 1; min-width: 0; padding: 4px 0; }

/* ── Insert Divider ── */
.insert-divider {
  display: flex;
  align-items: center;
  height: 24px;
  position: relative;
  opacity: 0;
  transition: opacity 200ms;
}
.nd-blocks:hover .insert-divider,
.insert-divider:hover { opacity: 1; }

.insert-line { flex: 1; height: 1px; background: ${C.border}; }

.insert-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 400;
  color: ${C.muted};
  background: ${C.surface};
  border: 1px solid ${C.border};
  cursor: pointer;
  transition: all 150ms;
  flex-shrink: 0;
  line-height: 1;
  padding: 0;
}
.insert-btn:hover { color: ${C.accent}; border-color: ${C.accent}; background: ${C.accentSoft}; }

.insert-menu {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  padding: 6px;
  min-width: 200px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  animation: scaleIn 150ms cubic-bezier(0.34,1.56,0.64,1);
}

.insert-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  font: 400 13px 'Inter', sans-serif;
  color: ${C.para};
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 120ms;
}
.insert-menu-item:hover { background: ${C.surface2}; color: ${C.text}; }

.insert-menu-icon {
  font: 600 12px 'Space Mono', monospace;
  color: ${C.accent};
  min-width: 24px;
  text-align: center;
}

/* ═══ BLOCK TYPE STYLES ═══ */

/* Heading */
.bk-heading, .bk-heading-view {
  display:block; width:100%; font:700 26px 'Sora', sans-serif; color:${C.text};
  border-left:3px solid ${C.accent}; padding-left:16px;
  background:transparent; border-top:none; border-right:none; border-bottom:none;
  resize:none; overflow:hidden; outline:none; line-height:1.35;
}
.bk-heading::placeholder { color:${C.dim}; }
.bk-heading-view { padding-top:2px; padding-bottom:2px; }

/* Subheading */
.bk-sub, .bk-sub-view {
  display:block; width:100%; font:600 19px 'Sora', sans-serif; color:${C.text};
  background:transparent; border:none; resize:none; overflow:hidden; outline:none; line-height:1.4;
}
.bk-sub::placeholder { color:${C.dim}; }

/* Paragraph */
.bk-para, .bk-para-view {
  display:block; width:100%; font:400 16px/1.8 'Inter', sans-serif; color:${C.para};
  background:transparent; border:none; resize:none; overflow:hidden; min-height:28px; outline:none;
}
.bk-para::placeholder { color:${C.dim}; }

/* Callout */
.bk-callout {
  display:flex; gap:12px; align-items:flex-start;
  background:${C.accentSoft}; border:1px solid ${C.accentBorder};
  border-radius:10px; padding:16px 20px;
}
.bk-callout-icon { font-size:18px; flex-shrink:0; line-height:1.6; }
.bk-callout-ta, .bk-callout-body {
  flex:1; font:400 15px/1.7 'Inter', sans-serif; color:${C.para};
  background:transparent; border:none; resize:none; overflow:hidden; outline:none; min-height:24px;
}
.bk-callout-ta::placeholder { color:${C.dim}; }

/* Code */
.bk-code-wrap { background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; overflow:hidden; }
.bk-code-head { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; border-bottom:1px solid ${C.border}; background:${C.surface2}; }
.bk-code-lang { font:400 11px 'Space Mono', monospace; color:${C.accent}; }
.bk-code-lang-in { font:400 11px 'Space Mono', monospace; color:${C.accent}; background:transparent; border:none; outline:none; width:120px; }
.bk-code-lang-in::placeholder { color:${C.dim}; }
.bk-code-copy { font:500 11px 'Inter', sans-serif; color:${C.muted}; background:transparent; border:none; cursor:pointer; padding:2px 8px; border-radius:4px; transition:all 150ms; }
.bk-code-copy:hover { color:${C.text}; background:${C.surface}; }
.bk-code-ta { display:block; width:100%; font:400 13px/1.7 'Space Mono', monospace; color:${C.code}; padding:16px; background:transparent; border:none; resize:none; overflow:hidden; outline:none; min-height:120px; }
.bk-code-ta::placeholder { color:${C.dim}; }
.bk-code-pre { padding:16px; margin:0; font:400 13px/1.7 'Space Mono', monospace; color:${C.code}; white-space:pre-wrap; word-break:break-word; }
.bk-code-pre code { font:inherit; color:inherit; }

/* Image */
.bk-img-wrap { border-radius:12px; overflow:hidden; position:relative; }
.bk-img-wrap.empty { border:2px dashed ${C.border}; cursor:pointer; transition:border-color 200ms; }
.bk-img-wrap.empty:hover { border-color:${C.accent}; }
.bk-img-ph { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:8px; }
.bk-img-ph-text { font:500 14px 'Inter', sans-serif; color:${C.muted}; }
.bk-img-ph-hint { font:400 12px 'Inter', sans-serif; color:${C.dim}; }
.bk-img { width:100%; display:block; border:1px solid ${C.border}; border-radius:12px; }
.bk-img-rm { position:absolute; top:10px; right:10px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:14px; color:#fff; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.15); cursor:pointer; backdrop-filter:blur(4px); transition:background 150ms; }
.bk-img-rm:hover { background:rgba(239,68,68,0.8); }
.bk-img-cap { display:block; width:100%; text-align:center; font:italic 13px 'Inter', sans-serif; color:${C.muted}; background:transparent; border:none; outline:none; padding:8px 0; }
.bk-img-cap::placeholder { color:${C.dim}; }
.bk-img-cap-view { text-align:center; font:italic 13px 'Inter', sans-serif; color:${C.muted}; padding:8px 0; }

/* Responsive */
@media (max-width:768px) {
  .nd-inner { padding:24px 16px 60px; }
  .nd-toolbar { margin:8px 16px 0; }
  .bk-controls { opacity: 0.5; }
}
`;
