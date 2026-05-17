// Components: Sidebar, TopBar, RightPanel, Block, SlashMenu, etc.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---- Icon utility (line icons, hand-rolled) ----
function Icon({ name, size = 14, stroke = 1.4 }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search':
      return <svg {...common}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>;
    case 'plus':
      return <svg {...common}><path d="M8 3v10M3 8h10"/></svg>;
    case 'chevron':
      return <svg {...common}><path d="M6 4l4 4-4 4"/></svg>;
    case 'chevron-down':
      return <svg {...common}><path d="M4 6l4 4 4-4"/></svg>;
    case 'settings':
      return <svg {...common}><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M3 8H1M15 8h-2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>;
    case 'export':
      return <svg {...common}><path d="M8 10V2M5 5l3-3 3 3M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2"/></svg>;
    case 'link':
      return <svg {...common}><path d="M6.5 9.5L9.5 6.5M7 4l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 12l-1 1a2.5 2.5 0 01-3.5-3.5l1-1"/></svg>;
    case 'arrow-right':
      return <svg {...common}><path d="M3 8h10M9 4l4 4-4 4"/></svg>;
    case 'x':
      return <svg {...common}><path d="M4 4l8 8M12 4l-8 8"/></svg>;
    case 'archive':
      return <svg {...common}><rect x="2" y="3" width="12" height="3"/><path d="M3 6v7h10V6M6.5 9h3"/></svg>;
    case 'tag':
      return <svg {...common}><path d="M2 8V3a1 1 0 011-1h5l6 6-6 6-6-6z"/><circle cx="5" cy="5" r="0.5" fill="currentColor"/></svg>;
    case 'doc':
      return <svg {...common}><path d="M4 1.5h5l3 3V14a.5.5 0 01-.5.5h-7A.5.5 0 014 14V1.5z"/><path d="M9 1.5v3h3M5.5 7h5M5.5 9.5h5M5.5 12h3"/></svg>;
    case 'graph':
      return <svg {...common}><circle cx="3.5" cy="3.5" r="1.5"/><circle cx="12.5" cy="3.5" r="1.5"/><circle cx="8" cy="12.5" r="1.5"/><path d="M5 4.5l6 0M4.5 5l3 6M11.5 5l-3 6"/></svg>;
    case 'sparkle':
      return <svg {...common}><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M4 12l2-2M10 6l2-2"/></svg>;
    case 'kbd-cmd':
      return <svg {...common}><path d="M5 5h6v6H5z M5 5a1.5 1.5 0 11-1.5 1.5M11 5a1.5 1.5 0 111.5 1.5M5 11a1.5 1.5 0 11-1.5-1.5M11 11a1.5 1.5 0 111.5-1.5"/></svg>;
    case 'drag':
      return <svg {...common}><circle cx="6" cy="4" r="0.7" fill="currentColor" stroke="none"/><circle cx="10" cy="4" r="0.7" fill="currentColor" stroke="none"/><circle cx="6" cy="8" r="0.7" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="0.7" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="0.7" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>;
    case 'check':
      return <svg {...common}><path d="M3 8.5l3 3 7-7"/></svg>;
    case 'home':
      return <svg {...common}><path d="M2.5 7L8 2.5 13.5 7v6.5a.5.5 0 01-.5.5h-3v-4h-4v4H3a.5.5 0 01-.5-.5V7z"/></svg>;
    case 'circle':
      return <svg {...common}><circle cx="8" cy="8" r="6"/></svg>;
    case 'ledger':
      return <svg {...common}><path d="M3 2h10v12H3z M3 5h10M6 8h5M6 11h5"/><path d="M5 7v5"/></svg>;
    default: return null;
  }
}

// ---- Top bar ----
function TopBar({ projectTitle, view, setView, stage, onExport, onSearch }) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="mark"></span>
        <span>Episteme</span>
      </div>
      <div className="crumbs">
        <span onClick={() => setView('dashboard')} style={{cursor:'pointer'}}>Projects</span>
        {view !== 'dashboard' && <>
          <span className="sep">/</span>
          <span className="here">{projectTitle}</span>
          {stage && <>
            <span className="sep">/</span>
            <span className="mono" style={{fontSize:11, color:'var(--ink-mute)'}}>{window.STAGE_LABELS[stage]}</span>
          </>}
        </>}
      </div>
      <div className="actions">
        <button className="iconbtn" title="Search"><Icon name="search" /></button>
        <button className="iconbtn" onClick={onExport} title="Export"><Icon name="export" /></button>
        <div style={{width:1, height:18, background:'var(--rule)', margin:'0 4px'}}></div>
        <button className="btn ghost sans" style={{fontSize:12}} onClick={() => setView('dashboard')}>
          <Icon name="home" size={12}/> All projects
        </button>
      </div>
    </div>
  );
}

// ---- Sidebar ----
function Sidebar({ stage, setStage, blocksByStage, project, otherProjects, onSwitchProject, onOpenDashboard }) {
  return (
    <div className="sidebar">
      <div className="side-section">
        <div className="head">
          <span>This project</span>
          <span className="kbd">⌘P</span>
        </div>
        <div style={{padding:'4px 8px 8px'}}>
          <div className="serif" style={{fontSize:15, fontStyle:'italic', lineHeight:1.3, color:'var(--ink)', fontWeight:500, marginBottom:4, textWrap:'pretty'}}>
            {project.title}
          </div>
          <div className="mono" style={{fontSize:10.5, color:'var(--ink-fade)'}}>
            P-001 · started Feb 14
          </div>
        </div>
      </div>

      <div className="side-section">
        <div className="head"><span>Lifecycle</span><span className="mono" style={{textTransform:'none', letterSpacing:0}}>{project.progress}%</span></div>
        <div className="lifecycle-rail">
          {window.STAGES.map((s) => {
            const count = (blocksByStage[s.id] || []).length;
            const done = ['seed','distillation','exploration'].includes(s.id);
            const active = stage === s.id;
            return (
              <div
                key={s.id}
                className={`side-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                onClick={() => setStage(s.id)}
              >
                <span className="num">{s.n}</span>
                <span>{s.label}</span>
                {count > 0 && <span className="count">{count}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="side-section">
        <div className="head"><span>Other projects</span></div>
        {otherProjects.filter(p => !p.active).slice(0, 4).map(p => (
          <div key={p.id} className="side-item" onClick={() => onSwitchProject(p.id)}>
            <span className="dot" style={{background: p.stage === 'published' ? 'var(--ink-fade)' : 'var(--accent)'}}></span>
            <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.title}</span>
          </div>
        ))}
        <div className="side-item" style={{color:'var(--ink-fade)'}} onClick={onOpenDashboard}>
          <Icon name="archive" size={13}/>
          <span>All projects</span>
        </div>
      </div>

      <div style={{position:'absolute', bottom:14, left:14, right:14, fontSize:10.5, color:'var(--ink-fade)', fontFamily:'var(--mono)', display:'flex', justifyContent:'space-between'}}>
        <span>local · offline</span>
        <span>v0.3.1</span>
      </div>
    </div>
  );
}

// ---- Right Panel ----
function RightPanel({ mode, setMode, selectedBlock, blocks, onScrollToBlock, contradictions }) {
  const TABS = [
    { id: 'related', label: 'Related' },
    { id: 'papers', label: 'Papers' },
    { id: 'questions', label: 'Open questions' },
    { id: 'ai', label: 'AI' },
  ];
  const linkedIds = selectedBlock?.linkedTo || [];
  const linkedBlocks = blocks.filter(b => linkedIds.includes(b.id));
  const reverseLinks = blocks.filter(b => (b.linkedTo || []).includes(selectedBlock?.id));

  return (
    <div className="right">
      <div className="panel-tabs">
        {TABS.map(t => (
          <div key={t.id} className={`panel-tab ${mode === t.id ? 'active' : ''}`} onClick={() => setMode(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {selectedBlock ? (
        <div style={{marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--rule)'}}>
          <h4>Selected</h4>
          <div style={{fontFamily:'var(--mono)', fontSize:10.5, color:'var(--ink-mute)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:6}}>
            <span className={`glyph ${selectedBlock.type}`} style={{width:8, height:8, display:'inline-block'}}></span>
            {selectedBlock.type}
          </div>
          <div className="serif" style={{fontSize:14, lineHeight:1.45, color:'var(--ink)'}}>
            {selectedBlock.content.length > 180 ? selectedBlock.content.slice(0, 180) + '…' : selectedBlock.content}
          </div>
        </div>
      ) : (
        <div style={{marginBottom:18, color:'var(--ink-fade)', fontStyle:'italic', fontFamily:'var(--serif)', fontSize:13}}>
          Select a block to see its context.
        </div>
      )}

      {mode === 'related' && (
        <>
          <h4>Linked blocks</h4>
          {linkedBlocks.length + reverseLinks.length === 0 && (
            <div className="muted" style={{fontStyle:'italic', fontFamily:'var(--serif)', fontSize:13, marginBottom:14}}>
              No links yet. Press <span className="kbd">⌘L</span> on a block to link.
            </div>
          )}
          {linkedBlocks.map(b => (
            <div key={b.id} onClick={() => onScrollToBlock(b.id)} style={{padding:'8px 0', borderBottom:'1px solid var(--rule-soft)', cursor:'pointer'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:5, marginBottom:2}}>
                <span className={`glyph ${b.type}`} style={{width:6, height:6}}></span>
                <Icon name="arrow-right" size={9}/> {b.type}
              </div>
              <div className="serif" style={{fontSize:13, lineHeight:1.4}}>{b.content.slice(0, 90)}…</div>
            </div>
          ))}
          {reverseLinks.map(b => (
            <div key={b.id} onClick={() => onScrollToBlock(b.id)} style={{padding:'8px 0', borderBottom:'1px solid var(--rule-soft)', cursor:'pointer'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:5, marginBottom:2}}>
                <span className={`glyph ${b.type}`} style={{width:6, height:6}}></span>
                <span style={{transform:'rotate(180deg)', display:'inline-block'}}><Icon name="arrow-right" size={9}/></span> {b.type}
              </div>
              <div className="serif" style={{fontSize:13, lineHeight:1.4}}>{b.content.slice(0, 90)}…</div>
            </div>
          ))}

          {contradictions && contradictions.length > 0 && (
            <>
              <h4 style={{marginTop:18, color:'var(--warn)'}}>Contradictions detected</h4>
              {contradictions.map((c, i) => (
                <div key={i} style={{padding:'8px 10px', background:'color-mix(in oklab, var(--warn) 6%, transparent)', border:'1px solid color-mix(in oklab, var(--warn) 20%, var(--rule))', borderRadius:6, marginBottom:8}}>
                  <div className="serif" style={{fontSize:13, fontStyle:'italic', color:'var(--ink-2)', lineHeight:1.4}}>{c.note}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {mode === 'papers' && (
        <>
          <h4>Related papers</h4>
          {window.RELATED_PAPERS.map((p, i) => (
            <div key={i} style={{padding:'10px 0', borderBottom:'1px solid var(--rule-soft)'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:2}}>
                <span className="serif" style={{fontSize:13.5, fontWeight:500, lineHeight:1.35, paddingRight:8}}>{p.title}</span>
                <span className="mono" style={{fontSize:10, color:'var(--ink-fade)'}}>{p.score.toFixed(2)}</span>
              </div>
              <div style={{fontSize:11.5, color:'var(--ink-mute)'}}>{p.authors}</div>
            </div>
          ))}
          <button className="btn" style={{marginTop:14, width:'100%', justifyContent:'center'}}>
            <Icon name="search" size={12}/> Search arXiv & semantic scholar
          </button>
        </>
      )}

      {mode === 'questions' && (
        <>
          <h4>Open questions</h4>
          {window.OPEN_QUESTIONS.map((q, i) => (
            <div key={i} style={{padding:'10px 0', borderBottom:'1px solid var(--rule-soft)', display:'flex', gap:10}}>
              <span className="mono" style={{fontSize:10, color:'var(--ink-fade)', paddingTop:3, minWidth:14}}>Q{i+1}</span>
              <div className="serif" style={{fontSize:13.5, lineHeight:1.45, fontStyle:'italic'}}>{q}</div>
            </div>
          ))}
          <button className="btn" style={{marginTop:14, width:'100%', justifyContent:'center'}}>
            <Icon name="plus" size={12}/> Add open question
          </button>
        </>
      )}

      {mode === 'ai' && (
        <>
          <h4>Suggested next moves</h4>
          <div style={{padding:'10px 12px', background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, marginBottom:8}}>
            <div className="upper" style={{color:'var(--ink-mute)', marginBottom:4}}>Thesis compression</div>
            <div className="serif" style={{fontSize:13.5, fontStyle:'italic', lineHeight:1.45}}>
              You have 9 exploration blocks. Try compressing them into a single claim.
            </div>
            <button className="btn accent" style={{marginTop:8, fontSize:11.5}}><Icon name="sparkle" size={11}/> Compress</button>
          </div>
          <div style={{padding:'10px 12px', background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, marginBottom:8}}>
            <div className="upper" style={{color:'var(--ink-mute)', marginBottom:4}}>Gap detection</div>
            <div className="serif" style={{fontSize:13.5, fontStyle:'italic', lineHeight:1.45}}>
              Your claim about “evolutionary signaling” has no evidence block attached.
            </div>
            <button className="btn" style={{marginTop:8, fontSize:11.5}}>Suggest evidence</button>
          </div>
          <div style={{padding:'10px 12px', background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, marginBottom:8}}>
            <div className="upper" style={{color:'var(--ink-mute)', marginBottom:4}}>Outline draft</div>
            <div className="serif" style={{fontSize:13.5, fontStyle:'italic', lineHeight:1.45}}>
              I see 3 draft paragraphs and a thesis. Want me to sketch an article structure?
            </div>
            <button className="btn" style={{marginTop:8, fontSize:11.5}}><Icon name="sparkle" size={11}/> Sketch outline</button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Block component ----
function Block({ block, isSelected, isLinkingSource, onSelect, onStartLink, onCompleteLink, onUpdate, onDelete, linkMode, blocks }) {
  const ref = useRef(null);
  const blockTypeInfo = window.BLOCK_TYPES.find(t => t.id === block.type) || { label: block.type };
  const linkedBlocks = (block.linkedTo || []).map(id => blocks.find(b => b.id === id)).filter(Boolean);

  const handleClick = (e) => {
    if (linkMode && !isLinkingSource) {
      e.stopPropagation();
      onCompleteLink(block.id);
    } else {
      onSelect(block.id);
    }
  };

  return (
    <div
      id={`block-${block.id}`}
      ref={ref}
      className={`block ${isSelected ? 'selected' : ''} ${isLinkingSource ? 'linking' : ''}`}
      onClick={handleClick}
      data-comment-anchor={`block-${block.id}`}
    >
      <div className="block-gutter">
        <button title="Link" onClick={(e) => { e.stopPropagation(); onStartLink(block.id); }}><Icon name="link" size={12}/></button>
        <button title="Drag handle"><Icon name="drag" size={12}/></button>
      </div>
      <div className="block-type">
        <span className={`glyph ${block.type}`}></span>
        <span>{blockTypeInfo.label.toLowerCase()}</span>
      </div>
      <div
        className="block-content"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onUpdate(block.id, { content: e.currentTarget.textContent })}
      >
        {block.content}
      </div>
      {linkedBlocks.length > 0 && (
        <div className="block-meta">
          <Icon name="link" size={11}/>
          {linkedBlocks.map(lb => (
            <a key={lb.id} className="link" onClick={(e) => { e.stopPropagation(); document.getElementById(`block-${lb.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}>
              {lb.type} · {lb.content.slice(0, 30)}…
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Slash menu ----
function SlashMenu({ position, query, onPick, onClose }) {
  const filtered = window.BLOCK_TYPES.filter(t =>
    !query || t.label.toLowerCase().includes(query.toLowerCase()) || t.id.includes(query.toLowerCase())
  );
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIdx]) onPick(filtered[activeIdx].id); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIdx, filtered, onPick, onClose]);

  if (!position) return null;

  return (
    <div className="slash" style={{ top: position.y, left: position.x }}>
      <div className="header">
        <span>Insert block</span>
        <span style={{fontFamily:'var(--mono)', textTransform:'none', letterSpacing:0}}>{filtered.length}</span>
      </div>
      <div style={{maxHeight: 280, overflowY: 'auto'}}>
        {filtered.map((t, i) => (
          <div
            key={t.id}
            className={`opt ${i === activeIdx ? 'active' : ''}`}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseDown={(e) => { e.preventDefault(); onPick(t.id); }}
          >
            <span className={`glyph ${t.glyph}`}></span>
            <span>{t.label}</span>
            <span className="desc">{t.desc}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="opt" style={{color:'var(--ink-fade)', fontStyle:'italic'}}>No match</div>
        )}
      </div>
    </div>
  );
}

// ---- Stage progress strip ----
function StageStrip({ stage, setStage, blocksByStage }) {
  return (
    <div className="stage-strip">
      {window.STAGES.map((s, i) => {
        const done = ['seed','distillation','exploration'].includes(s.id) && stage !== s.id;
        return (
          <React.Fragment key={s.id}>
            <div
              className={`stage ${stage === s.id ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => setStage(s.id)}
            >
              <span className="num">{s.n}</span>
              <span>{s.label}</span>
            </div>
            {i < window.STAGES.length - 1 && <span className="sep"></span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---- New project modal ----
function NewProjectModal({ onClose, onCreate }) {
  const [q, setQ] = useState('');
  const [why, setWhy] = useState('');
  const [output, setOutput] = useState('article');
  const [tags, setTags] = useState('');
  const valid = q.trim().length > 4;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <h3>New curiosity</h3>
          <button className="iconbtn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="body">
          <label>Question</label>
          <input
            autoFocus
            type="text"
            placeholder="What are you curious about?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label>Why does this interest you?</label>
          <textarea
            placeholder="A confusion, contradiction, an itch — write loosely."
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
          <label>Output you imagine</label>
          <select value={output} onChange={(e) => setOutput(e.target.value)}>
            <option value="article">Article</option>
            <option value="essay">Long-form essay</option>
            <option value="paper">Research paper</option>
            <option value="talk">Talk / lecture</option>
            <option value="unknown">Not sure yet</option>
          </select>
          <label>Tags <span style={{textTransform:'none', letterSpacing:0, color:'var(--ink-fade)', fontWeight:400}}>comma-separated</span></label>
          <input type="text" placeholder="epistemics, hci" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn accent"
            disabled={!valid}
            style={{opacity: valid ? 1 : 0.5, pointerEvents: valid ? 'auto' : 'none'}}
            onClick={() => onCreate({ q, why, output, tags: tags.split(',').map(s => s.trim()).filter(Boolean) })}
          >
            Plant seed <Icon name="arrow-right" size={12}/>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, TopBar, Sidebar, RightPanel, Block, SlashMenu, StageStrip, NewProjectModal,
});
