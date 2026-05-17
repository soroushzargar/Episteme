// Screens: Dashboard, Editor (seed/distillation/exploration), Mapping, Thesis, Evidence, Drafting, Publishing
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo: useMemoS, useCallback: useCallbackS } = React;

// ====== DASHBOARD ======
function Dashboard({ projects, onOpen, onNew }) {
  const [filter, setFilter] = useStateS('all');
  const filters = [
  { id: 'all', label: 'All projects', count: projects.length },
  { id: 'active', label: 'Active', count: projects.filter((p) => p.stage !== 'published' && p.stage !== 'archived').length },
  { id: 'seed', label: 'Seeds', count: projects.filter((p) => p.stage === 'seed').length },
  { id: 'drafting', label: 'Drafting', count: projects.filter((p) => p.stage === 'drafting').length },
  { id: 'published', label: 'Published', count: projects.filter((p) => p.stage === 'published').length }];

  const shown = projects.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'active') return p.stage !== 'published' && p.stage !== 'archived';
    return p.stage === filter;
  });

  return (
    <div className="shell no-right" style={{ gridTemplateColumns: '224px minmax(0, 1fr)' }}>
      <div className="topbar">
        <div className="brand">
          <span className="mark"></span>
          <span>Episteme</span>
        </div>
        <div className="crumbs">
          <span className="here">Projects</span>
        </div>
        <div className="actions">
          <button className="iconbtn" title="Search"><Icon name="search" /></button>
          <button className="iconbtn" title="Settings"><Icon name="settings" /></button>
        </div>
      </div>

      <div className="sidebar">
        <div className="side-section">
          <div className="head"><span>Library</span></div>
          {filters.map((f) =>
          <div key={f.id} className={`side-item ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
              <span style={{ width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.id === 'all' && <Icon name="ledger" size={13} />}
                {f.id === 'active' && <span className="dot"></span>}
                {f.id === 'seed' && <Icon name="circle" size={11} />}
                {f.id === 'drafting' && <Icon name="doc" size={13} />}
                {f.id === 'published' && <Icon name="check" size={13} />}
              </span>
              <span>{f.label}</span>
              <span className="count">{f.count}</span>
            </div>
          )}
        </div>

        <div className="side-section">
          <div className="head"><span>Tags</span></div>
          {['epistemics', 'hci', 'ai-safety', 'mathematics', 'linguistics', 'economics'].map((t) =>
          <div key={t} className="side-item">
              <Icon name="tag" size={12} />
              <span>{t}</span>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <button className="btn accent" style={{ width: '100%', justifyContent: 'center', fontWeight: "300", textAlign: "center" }} onClick={onNew}>
            <Icon name="plus" size={12} /> New curiosity
          </button>
        </div>
      </div>

      <div className="main">
        <div className="main-inner wide">
          <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 className="page-title">Your <em>curiosities</em></h1>
              <div className="page-sub">
                <span>{shown.length} {shown.length === 1 ? 'project' : 'projects'}</span>
                <span className="dot"></span>
                <span>{filters.find((f) => f.id === filter)?.label.toLowerCase()}</span>
                <span className="dot"></span>
                <span>sorted by recency</span>
              </div>
            </div>
            <button className="btn accent" onClick={onNew}>
              <Icon name="plus" size={12} /> New curiosity
            </button>
          </div>

          <div className="proj-grid">
            {shown.map((p) =>
            <div key={p.id} className="proj-card" onClick={() => onOpen(p.id)}>
                <div className="stage-badge">
                  <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: p.stage === 'published' ? 'var(--ink-fade)' : 'var(--accent)'
                }}></span>
                  {window.STAGE_LABELS[p.stage]}
                  <span style={{ color: 'var(--ink-fade)' }}>·</span>
                  <span style={{ color: 'var(--ink-fade)' }}>{p.modified}</span>
                </div>
                <h3>{p.title}</h3>
                {p.thesis ?
              <div className="thesis">“{p.thesis}”</div> :

              <div className="thesis fade">No thesis yet — still <em>seeding</em>.</div>
              }
                <div className="tag-row">
                  {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
                <div className="progress"><div style={{ width: `${p.progress}%` }}></div></div>
                <div className="foot">
                  <span>{p.progress}% explored</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{p.stage === 'published' ? <><Icon name="check" size={11} /> exported</> : 'open →'}</span>
                </div>
              </div>
            )}

            <div className="proj-card" style={{
              border: '1px dashed var(--rule)',
              background: 'transparent',
              alignItems: 'center', justifyContent: 'center', display: 'flex',
              flexDirection: 'column', gap: 8, color: 'var(--ink-mute)', cursor: 'pointer'
            }} onClick={onNew}>
              <Icon name="plus" size={24} stroke={1.2} />
              <div className="serif" style={{ fontStyle: 'italic', fontSize: 16 }}>Plant a new curiosity</div>
              <div className="sans" style={{ fontSize: 11.5, color: 'var(--ink-fade)' }}>Every project starts as a question.</div>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

// ====== TEMPLATE-BASED EDITOR (Seed, Distillation, Thesis) ======
function TemplateEditor({ stage, blocks, onUpdate, onSelectBlock, selectedId }) {
  // Renders a structured form-like view based on the stage
  const templates = {
    seed: [
    { id: 'question', label: 'Initial question', placeholder: 'What are you curious about?' },
    { id: 'why', label: 'Why does this bother me?', placeholder: 'Where is the itch coming from?' },
    { id: 'intuition', label: 'Current intuition', placeholder: 'What do I think is going on, naively?' },
    { id: 'surprise', label: 'What would surprise me?', placeholder: 'A finding that would break my model.' },
    { id: 'domains', label: 'Related domains', placeholder: 'Fields, papers, communities to pull from.' }],

    distillation: [
    { id: 'broad', label: 'Broad question', placeholder: 'The vague version.' },
    { id: 'precise', label: 'Precise question', placeholder: 'Sharpened — fewer ambiguities.' },
    { id: 'researchable', label: 'Researchable question', placeholder: 'A version answerable with evidence.' },
    { id: 'variables', label: 'Variables', placeholder: 'What can change? What stays fixed?' },
    { id: 'assumptions', label: 'Assumptions', placeholder: 'What am I taking for granted?' },
    { id: 'unknowns', label: 'Unknowns', placeholder: 'What I would need to know first.' }],

    thesis: [
    { id: 'main', label: 'Main claim', placeholder: 'In a single sentence.', big: true },
    { id: 'insufficient', label: 'Why existing views are insufficient', placeholder: 'The status quo and its blind spot.' },
    { id: 'novel', label: 'Novel perspective', placeholder: 'What only this view sees.' },
    { id: 'strongest', label: 'Strongest counterargument', placeholder: 'The objection you most respect.' },
    { id: 'needed', label: 'Necessary evidence', placeholder: 'What would settle it.' }]

  };

  // pre-fill with sample content from blocks based on stage
  const stageBlocks = blocks.filter((b) => b.stage === stage);
  const contentMap = {};
  if (stage === 'seed') {
    contentMap.question = stageBlocks.find((b) => b.type === 'question')?.content || '';
    contentMap.why = stageBlocks.find((b) => b.type === 'observation')?.content || '';
    contentMap.intuition = '';
    contentMap.surprise = stageBlocks.find((b) => b.type === 'confusion')?.content || '';
    contentMap.domains = 'Human–AI interaction, social psychology, philosophy of language, calibration literature, evolutionary signaling.';
  }
  if (stage === 'distillation') {
    contentMap.broad = 'Why do humans trust confident AI?';
    contentMap.precise = stageBlocks.find((b) => b.type === 'question')?.content || '';
    contentMap.researchable = 'In a controlled comparison, do users prefer confident-wrong over hedged-right responses, and is the effect mediated by perceived agency?';
    contentMap.variables = 'Confidence level (hedged / neutral / confident). Accuracy (correct / incorrect). Task domain (technical / common-sense). User expertise (low / med / high).';
    contentMap.assumptions = 'Confidence is interpreted within ~3 seconds. Users are not actively comparing systems. The agent is presented as singular and stable.';
    contentMap.unknowns = 'Does the effect persist in voice modalities? Is it culturally invariant? Does it weaken with longer interaction?';
  }
  if (stage === 'thesis') {
    contentMap.main = stageBlocks.find((b) => b.type === 'claim')?.content || '';
    contentMap.insufficient = 'Most accounts treat trust-in-AI as a calibration problem — assuming users would prefer well-calibrated systems if only they could compute calibration. They cannot, and would not.';
    contentMap.novel = 'Trust is not the user’s judgment of the model. It is the user’s reading of the model as a social agent. The model is being parsed, not evaluated.';
    contentMap.strongest = 'Technical users distrust over-confidence. If the effect were a fossil, it should be uniform — but it isn’t.';
    contentMap.needed = 'Cross-modality replication. Expertise stratification. A within-subject design where the same user judges the same model under different framings.';
  }

  return (
    <div className="templ">
      {templates[stage].map((t) =>
      <div key={t.id} className={`templ-row ${t.big ? 'thesis' : ''}`}>
          <label>{t.label}</label>
          <div
          className={`field ${t.big ? '' : 'ruled'}`}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={t.placeholder}
          dangerouslySetInnerHTML={{ __html: contentMap[t.id] || '' }} />
        
        </div>
      )}
    </div>);

}

// ====== EXPLORATION (free-form semantic blocks) ======
function Exploration({ blocks, allBlocks, onUpdate, onAdd, onDelete, selectedId, onSelect, linkMode, linkingFrom, onStartLink, onCompleteLink, onCancelLink }) {
  const [slashPos, setSlashPos] = useStateS(null);
  const [slashQuery, setSlashQuery] = useStateS('');

  // open slash on "/" key when nothing is focused (or focus is on body)
  useEffectS(() => {
    const handler = (e) => {
      if (e.key === '/' && !slashPos) {
        const focused = document.activeElement;
        const isText = focused && (focused.isContentEditable || focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
        if (isText) return;
        e.preventDefault();
        setSlashPos({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 100 });
        setSlashQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slashPos]);

  // listen for "/" at the end of a "draft" empty area
  const handleAddBlock = (afterId) => {
    // Open slash menu at bottom of last block
    const el = afterId ? document.getElementById(`block-${afterId}`) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      setSlashPos({ x: r.left + 22, y: r.bottom + 8 });
    } else {
      setSlashPos({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 });
    }
    setSlashQuery('');
  };

  const pick = (typeId) => {
    onAdd(typeId);
    setSlashPos(null);
  };

  return (
    <>
      <div className="blocks">
        {blocks.map((b) =>
        <Block
          key={b.id}
          block={b}
          blocks={allBlocks}
          isSelected={selectedId === b.id}
          isLinkingSource={linkingFrom === b.id}
          linkMode={linkMode}
          onSelect={onSelect}
          onStartLink={onStartLink}
          onCompleteLink={onCompleteLink}
          onUpdate={onUpdate}
          onDelete={onDelete} />

        )}
        <div
          style={{
            padding: '14px 22px', borderLeft: '2px dashed var(--rule)',
            color: 'var(--ink-fade)', fontStyle: 'italic',
            fontFamily: 'var(--serif)', fontSize: 14,
            cursor: 'text', borderRadius: 4
          }}
          onClick={() => handleAddBlock(blocks[blocks.length - 1]?.id)}>
          
          Type <span className="kbd" style={{ fontStyle: 'normal' }}>/</span> to insert a new block — question, evidence, analogy…
        </div>
      </div>

      {slashPos &&
      <SlashMenu
        position={slashPos}
        query={slashQuery}
        onPick={pick}
        onClose={() => setSlashPos(null)} />

      }

      {linkMode && linkingFrom &&
      <div className="link-toast">
          <Icon name="link" size={12} />
          <span>Click a block to link <span style={{ color: 'var(--ink-fade)' }}>·</span> <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)' }}>{(allBlocks.find((b) => b.id === linkingFrom)?.content || '').slice(0, 40)}…</span></span>
          <button onClick={onCancelLink}>Cancel <span className="kbd" style={{ marginLeft: 4 }}>Esc</span></button>
        </div>
      }
    </>);

}

// ====== MAPPING (graph) ======
function Mapping({ allBlocks }) {
  const [hovered, setHovered] = useStateS(null);
  const [layout, setLayout] = useStateS('radial');

  const nodes = window.GRAPH_NODES;
  const edges = window.GRAPH_EDGES;

  const connectedNodes = useMemoS(() => {
    if (!hovered) return null;
    const s = new Set([hovered]);
    edges.forEach((e) => {
      if (e.from === hovered) s.add(e.to);
      if (e.to === hovered) s.add(e.from);
    });
    return s;
  }, [hovered]);

  const isEdgeActive = (e) => hovered && (e.from === hovered || e.to === hovered);

  const positions = useMemoS(() => {
    const map = {};
    nodes.forEach((n) => {map[n.id] = { x: n.x, y: n.y };});
    return map;
  }, []);

  return (
    <div className="graph-canvas">
      <div style={{
        position: 'absolute', top: 18, left: 18, zIndex: 5,
        display: 'flex', gap: 10, alignItems: 'flex-end'
      }}>
        <div>
          <div className="upper" style={{ color: 'var(--ink-mute)', marginBottom: 4 }}>Mapping</div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', lineHeight: 1.1, fontWeight: 500, maxWidth: 380 }}>
            Concept graph
          </div>
          <div className="sans" style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 4 }}>
            {nodes.length} nodes · {edges.length} edges · hover to highlight
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 18, right: 18, zIndex: 5,
        display: 'flex', gap: 6, background: 'var(--paper-2)',
        border: '1px solid var(--rule)', padding: 3, borderRadius: 6
      }}>
        {['radial', 'force', 'layered'].map((l) =>
        <button key={l} className={`btn ghost ${layout === l ? 'active' : ''}`} style={{
          fontSize: 11.5, padding: '3px 9px',
          background: layout === l ? 'var(--paper-edge)' : 'transparent',
          border: 'none'
        }} onClick={() => setLayout(l)}>{l}</button>
        )}
      </div>

      {/* legend */}
      <div style={{
        position: 'absolute', bottom: 18, left: 18, zIndex: 5,
        background: 'var(--paper-2)', border: '1px solid var(--rule)',
        borderRadius: 6, padding: '10px 14px',
        fontFamily: 'var(--sans)', fontSize: 11
      }}>
        <div className="upper" style={{ color: 'var(--ink-mute)', marginBottom: 6 }}>Edge types</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px' }}>
          {['supports', 'contradicts', 'evidence_for', 'inspired_by', 'depends_on', 'illustrates'].map((r) =>
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="20" height="6">
                <line x1="0" y1="3" x2="20" y2="3" stroke={r === 'contradicts' ? 'var(--warn)' : 'var(--ink-mute)'} strokeWidth="1.2" strokeDasharray={r === 'contradicts' ? '3 2' : ''} />
              </svg>
              <span className="mono" style={{ fontSize: 10.5 }}>{r}</span>
            </div>
          )}
        </div>
      </div>

      <svg className="graph-svg">
        {edges.map((e, i) => {
          const a = positions[e.from];
          const b = positions[e.to];
          if (!a || !b) return null;
          const x1 = `${a.x}%`,y1 = `${a.y}%`,x2 = `${b.x}%`,y2 = `${b.y}%`;
          const mx = (a.x + b.x) / 2,my = (a.y + b.y) / 2;
          const active = isEdgeActive(e);
          const dim = hovered && !active;
          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={`graph-edge ${e.rel === 'contradicts' ? 'contradicts' : ''} ${active ? 'highlight' : ''} ${dim ? 'dim' : ''}`} />
              
              <text
                x={`${mx}%`} y={`${my}%`}
                className={`edge-label ${active ? 'highlight' : ''} ${dim ? 'dim' : ''}`}
                textAnchor="middle" dy="-3">
                {e.rel}</text>
            </g>);

        })}
      </svg>

      {nodes.map((n) => {
        const dim = connectedNodes && !connectedNodes.has(n.id);
        const highlight = hovered === n.id;
        return (
          <div
            key={n.id}
            className={`graph-node ${n.center ? 'center' : ''} ${dim ? 'dim' : ''} ${highlight ? 'highlight' : ''}`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}>
            
            <div className="nodetype">
              {!n.center && <span className={`glyph ${n.type}`} style={{ width: 6, height: 6, display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }}></span>}
              {n.type}
            </div>
            <div>{n.label}</div>
          </div>);

      })}
    </div>);

}

// ====== EVIDENCE (references + evidence blocks) ======
function Evidence({ blocks }) {
  const evidenceBlocks = blocks.filter((b) => b.type === 'evidence');
  return (
    <div>
      <div style={{ marginBottom: 30 }}>
        <h2 className="upper" style={{ color: 'var(--ink-mute)', margin: '0 0 12px' }}>Proof material</h2>
        <div className="blocks">
          {evidenceBlocks.map((b) =>
          <div key={b.id} className="block" style={{ borderLeftColor: 'var(--accent)' }}>
              <div className="block-type">
                <span className="glyph evidence"></span>
                <span>evidence</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)' }}>E-{b.id.slice(1)}</span>
              </div>
              <div className="block-content">{b.content}</div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="upper" style={{ color: 'var(--ink-mute)', margin: '0 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>References · {window.REFERENCES.length}</span>
          <button className="btn ghost" style={{ fontSize: 11.5 }}><Icon name="plus" size={11} /> Add reference</button>
        </h2>
        <div className="ref-list">
          {window.REFERENCES.map((r, i) =>
          <div key={r.id} className="ref-row">
              <span className="idx">[{i + 1}]</span>
              <div>
                <h4>{r.title}</h4>
                <div className="meta">{r.authors} · <em>{r.venue}</em> · {r.year}</div>
                {r.notes && <div className="notes">“{r.notes}”</div>}
              </div>
              <button className="iconbtn" style={{ color: 'var(--ink-fade)' }}><Icon name="chevron" /></button>
            </div>
          )}
        </div>
      </div>
    </div>);

}

// ====== DRAFTING (article editor + evidence rail) ======
function Drafting({ blocks }) {
  // All evidence-type blocks become the "evidence pool"
  const allEvidence = useMemoS(() => blocks.filter((b) => b.type === 'evidence' || b.type === 'counter'), [blocks]);

  // Priority order (drag-reorderable)
  const [priority, setPriority] = useStateS(() => allEvidence.map((b) => b.id));

  // Article state — sections of "runs" ({ text, evidence? })
  const [article, setArticle] = useStateS(() => window.INITIAL_PROSE);

  // Pending text selection waiting to be linked
  const [pending, setPending] = useStateS(null);
  // Hovered evidence (highlights matching citations in article)
  const [hoveredEv, setHoveredEv] = useStateS(null);
  // Section currently scrolled into view
  const [focused, setFocused] = useStateS('intro');
  // Drag-reorder state
  const [dragEv, setDragEv] = useStateS(null);

  const articleRef = useRefS(null);
  const sectionRefs = useRefS({});
  const railRef = useRefS(null);
  const cardRefs = useRefS({});

  // Which evidences are used
  const usedSet = useMemoS(() => {
    const s = new Set();
    Object.values(article).forEach((runs) => runs.forEach((r) => { if (r.evidence) s.add(r.evidence); }));
    return s;
  }, [article]);

  const ordered = priority.map((id) => allEvidence.find((e) => e.id === id)).filter(Boolean);
  const unusedOrdered = ordered.filter((e) => !usedSet.has(e.id));
  const nextUpId = unusedOrdered[0]?.id;

  const sections = window.ARTICLE_SECTIONS;
  const evIndex = (id) => priority.indexOf(id) + 1;

  // ----- Selection tracking -----
  useEffectS(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setPending(null); return; }
      const text = sel.toString().trim();
      if (!text || text.length < 2) { setPending(null); return; }
      const range = sel.getRangeAt(0);
      const articleEl = articleRef.current;
      if (!articleEl || !articleEl.contains(range.commonAncestorContainer)) { setPending(null); return; }
      // Find section
      let secId = null;
      for (const [sid, el] of Object.entries(sectionRefs.current)) {
        if (el && el.contains(range.commonAncestorContainer)) { secId = sid; break; }
      }
      if (!secId) { setPending(null); return; }
      // Reject if selection touches a citation
      const rangeContents = range.cloneContents();
      if (rangeContents.querySelector && rangeContents.querySelector('.cite')) { setPending({ sectionId: secId, text, blocked: true, ...rectFromRange(range) }); return; }
      setPending({ sectionId: secId, text, ...rectFromRange(range) });
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  function rectFromRange(range) {
    const r = range.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top };
  }

  // ----- Linking -----
  const linkTo = (evId) => {
    if (!pending || pending.blocked) return;
    const { sectionId, text } = pending;
    setArticle((prev) => {
      const runs = prev[sectionId];
      // find plain run containing the text
      const next = [];
      let done = false;
      for (const run of runs) {
        if (done || run.evidence) { next.push(run); continue; }
        const idx = run.text.indexOf(text);
        if (idx < 0) { next.push(run); continue; }
        const before = run.text.slice(0, idx);
        const after = run.text.slice(idx + text.length);
        if (before) next.push({ text: before });
        next.push({ text, evidence: evId });
        if (after) next.push({ text: after });
        done = true;
      }
      return { ...prev, [sectionId]: done ? next : runs };
    });
    setPending(null);
    window.getSelection()?.removeAllRanges();
  };

  // Unlink a specific citation run
  const unlinkRun = (sectionId, runIdx) => {
    setArticle((prev) => {
      const runs = [...prev[sectionId]];
      runs[runIdx] = { text: runs[runIdx].text };
      // merge consecutive plain runs
      const merged = [];
      for (const r of runs) {
        const last = merged[merged.length - 1];
        if (last && !last.evidence && !r.evidence) last.text = last.text + r.text;
        else merged.push({ ...r });
      }
      return { ...prev, [sectionId]: merged };
    });
  };

  // Unlink all citations of a given evidence
  const unlinkAllOf = (evId) => {
    setArticle((prev) => {
      const out = {};
      Object.entries(prev).forEach(([sid, runs]) => {
        const cleaned = runs.map((r) => r.evidence === evId ? { text: r.text } : r);
        const merged = [];
        for (const r of cleaned) {
          const last = merged[merged.length - 1];
          if (last && !last.evidence && !r.evidence) last.text = last.text + r.text;
          else merged.push({ ...r });
        }
        out[sid] = merged;
      });
      return out;
    });
  };

  // ----- Scroll tracking -----
  useEffectS(() => {
    const main = articleRef.current?.closest('.main');
    if (!main) return;
    const handler = () => {
      const probe = main.getBoundingClientRect().top + 140;
      let bestId = focused;
      for (const [sid, el] of Object.entries(sectionRefs.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { bestId = sid; break; }
        if (r.top > probe) break;
        bestId = sid;
      }
      if (bestId !== focused) setFocused(bestId);
    };
    main.addEventListener('scroll', handler);
    handler();
    return () => main.removeEventListener('scroll', handler);
  }, [focused]);

  // When focused section changes and there are unused, scroll rail to keep next unused visible
  useEffectS(() => {
    if (!nextUpId) return;
    const card = cardRefs.current[nextUpId];
    const rail = railRef.current;
    if (!card || !rail) return;
    const cr = card.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();
    if (cr.top < rr.top + 20 || cr.bottom > rr.bottom - 20) {
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focused, nextUpId]);

  // ----- Drag-reorder evidence -----
  const onEvDragStart = (id) => { setDragEv(id); };
  const onEvDragOver = (e, overId) => {
    e.preventDefault();
    if (!dragEv || dragEv === overId) return;
    setPriority((prev) => {
      const next = prev.filter((x) => x !== dragEv);
      const i = next.indexOf(overId);
      next.splice(i, 0, dragEv);
      return next;
    });
  };
  const onEvDragEnd = () => setDragEv(null);

  // Find a citation in the article and scroll to it
  const scrollToFirstCite = (evId) => {
    const el = articleRef.current?.querySelector(`.cite[data-ev="${evId}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  // ----- Render helpers -----
  const renderRuns = (runs, sectionId) => {
    let runI = -1;
    return runs.map((run, i) => {
      runI++;
      if (run.evidence) {
        const idx = runI;
        const num = evIndex(run.evidence);
        const isHover = hoveredEv === run.evidence;
        return (
          <span
            key={i}
            className={`cite ${isHover ? 'pulse' : ''}`}
            data-ev={run.evidence}
            onMouseEnter={() => setHoveredEv(run.evidence)}
            onMouseLeave={() => setHoveredEv(null)}
            onClick={(e) => { e.stopPropagation(); unlinkRun(sectionId, idx); }}
            title="Click to unlink">
            {run.text}<sup className="cite-num">[{num}]</sup>
          </span>);
      }
      return <React.Fragment key={i}>{run.text}</React.Fragment>;
    });
  };

  // Stats
  const wordCount = useMemoS(() => {
    let n = 0;
    Object.values(article).forEach((runs) => runs.forEach((r) => { n += r.text.split(/\s+/).filter(Boolean).length; }));
    return n;
  }, [article]);
  const citePct = Math.round((usedSet.size / Math.max(1, allEvidence.length)) * 100);

  const countCites = (evId) => {
    let n = 0;
    Object.values(article).forEach((runs) => runs.forEach((r) => { if (r.evidence === evId) n++; }));
    return n;
  };

  return (
    <div className="drafting-grid">
      <div className="drafting-editor" ref={articleRef}>
        <div className="article-stats">
          <span><span className="num">{wordCount}</span> words</span>
          <span className="dot"></span>
          <span><span className="num">{usedSet.size}</span>/{allEvidence.length} evidences cited</span>
          <div className="progress-mini"><div style={{ width: `${citePct}%` }}></div></div>
          <span className="dot"></span>
          <span>last edit 2m ago</span>
        </div>

        {sections.map((sec, i) => {
          const runs = article[sec.id] || [];
          const hasCite = runs.some((r) => r.evidence);
          const isEmpty = runs.length === 0 || runs.every((r) => !r.text.trim());
          return (
            <section
              key={sec.id}
              ref={(el) => sectionRefs.current[sec.id] = el}
              className={`article-section-prose ${focused === sec.id ? 'focused' : ''}`}>
              <h2>
                <span className="sec-num">{String(i + 1).padStart(2, '0')}</span>
                <span>{sec.label}</span>
                <span className={`sec-status ${hasCite ? 'has-cite' : ''}`}>
                  {hasCite ? `\u2713 ${runs.filter((r) => r.evidence).length} cited` : isEmpty ? 'empty' : 'uncited'}
                </span>
              </h2>
              <div
                className="prose-body"
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}>
                {isEmpty ? (
                  <p style={{ color: 'var(--ink-fade)', fontStyle: 'italic' }}>
                    Write your {sec.label.toLowerCase()} here&hellip;
                  </p>
                ) : (
                  <p>{renderRuns(runs, sec.id)}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="drafting-evidence" ref={railRef}>
        <div className="ev-head">
          <span className="upper" style={{ color: 'var(--ink-mute)' }}>Evidence</span>
          <span className={`ev-counter ${pending && !pending.blocked ? 'targeting' : ''}`}>
            {usedSet.size}/{allEvidence.length}
          </span>
        </div>
        <div className={`ev-hint ${pending && !pending.blocked ? 'active' : ''}`}>
          {pending && pending.blocked ? (
            <>Selection overlaps a citation. Adjust your selection.</>
          ) : pending ? (
            <>Click any evidence to link <span className="kbd" style={{ marginLeft: 4 }}>↵</span></>
          ) : (
            <>Select text to cite. Drag cards to reorder priority. Unused evidence glows.</>
          )}
        </div>
        <div className="ev-list">
          {ordered.map((ev, i) => {
            const used = usedSet.has(ev.id);
            const linkable = !!pending && !pending.blocked;
            const isNextUp = nextUpId === ev.id;
            return (
              <div
                key={ev.id}
                ref={(el) => cardRefs.current[ev.id] = el}
                className={[
                  'ev-card',
                  used ? 'used' : 'unused',
                  isNextUp && !used ? 'next-up' : '',
                  linkable ? 'targeting' : '',
                  dragEv === ev.id ? 'dragging' : '',
                  hoveredEv === ev.id && !linkable ? 'hovered' : ''
                ].join(' ')}
                draggable={!linkable}
                onDragStart={() => onEvDragStart(ev.id)}
                onDragOver={(e) => onEvDragOver(e, ev.id)}
                onDragEnd={onEvDragEnd}
                onMouseEnter={() => setHoveredEv(ev.id)}
                onMouseLeave={() => setHoveredEv(null)}
                onClick={(e) => {
                  if (linkable) linkTo(ev.id);
                  else if (used) scrollToFirstCite(ev.id);
                }}>
                <div className="ev-card-head">
                  <span className="ev-num">{i + 1}</span>
                  <span className={`ev-state ${used ? 'check' : 'circle'}`}>
                    {used ? <Icon name="check" size={11} /> : <Icon name="circle" size={9} />}
                  </span>
                  <span>{used ? 'cited' : (isNextUp ? 'next up' : 'unused')}</span>
                  <span className="ev-handle"><Icon name="drag" size={11} /></span>
                </div>
                <div className="ev-snippet">{ev.content}</div>
                {used && (
                  <div className="ev-cited-in">
                    <Icon name="link" size={10} />
                    cited in {countCites(ev.id)} {countCites(ev.id) === 1 ? 'place' : 'places'}
                    <span
                      className="x-link"
                      onClick={(e) => { e.stopPropagation(); unlinkAllOf(ev.id); }}
                      title="Unlink all">
                      unlink
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn ghost" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
          <Icon name="plus" size={11} /> Add evidence
        </button>
      </aside>

      {pending && (
        <div
          className="selection-toolbar"
          style={{ left: pending.x, top: pending.y }}>
          <Icon name="link" size={11} />
          {pending.blocked ? (
            <span>Selection overlaps a citation</span>
          ) : (
            <span>Click an evidence in the rail to cite this</span>
          )}
        </div>
      )}
    </div>);
}

// ====== PUBLISHING ======
function Publishing({ blocks }) {
  const [selected, setSelected] = useStateS(null);
  const wordCount = blocks.reduce((s, b) => s + b.content.split(/\s+/).length, 0);

  const formats = [
  {
    id: 'md', name: 'Markdown', icon: 'doc',
    desc: 'Plain-text, portable, version-controllable. The canonical export.',
    tree: `why-do-humans-trust.../
  notes.md
  thesis.md
  draft.md
  references.json
  graph.json`
  },
  {
    id: 'pdf', name: 'PDF article', icon: 'doc',
    desc: 'Typeset article only — for sharing.',
    tree: `confident-ai-trust.pdf
  · 8 pages
  · serif body
  · numbered references`
  },
  {
    id: 'pdf-nb', name: 'PDF notebook', icon: 'ledger',
    desc: 'Full research notebook — every block, every link, every reference.',
    tree: `notebook.pdf
  · 42 pages
  · all 16 blocks
  · concept graph
  · references`
  },
  {
    id: 'json', name: 'JSON', icon: 'export',
    desc: 'Machine-readable. For backups, AI pipelines, interop.',
    tree: `{
  "project": {...},
  "blocks": [16],
  "edges": [10],
  "references": [5]
}`
  }];


  return (
    <div>
      <div style={{
        padding: '18px 22px', border: '1px solid var(--rule)',
        borderRadius: 8, background: 'var(--paper-2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 20, flexWrap: 'wrap',
        marginBottom: 24
      }}>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="upper" style={{ color: 'var(--ink-mute)', marginBottom: 3 }}>Snapshot</div>
          <div className="serif" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 500, lineHeight: 1.35 }}>
            16 blocks · 5 references · 10 graph edges · ~{wordCount} words
          </div>
          <div className="sans" style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 4 }}>
            Last edited 2h ago · 4 unexported changes
          </div>
        </div>
        <button className="btn accent" style={{flexShrink: 0}}>
          <Icon name="export" size={12} /> Export all formats
        </button>
      </div>

      <h2 className="upper" style={{ color: 'var(--ink-mute)', margin: '0 0 12px' }}>Choose format</h2>
      <div className="export-grid">
        {formats.map((f) =>
        <div key={f.id} className="export-card" onClick={() => setSelected(f.id)} style={{
          borderColor: selected === f.id ? 'var(--accent)' : 'var(--rule)',
          background: selected === f.id ? 'color-mix(in oklab, var(--accent-soft) 60%, var(--paper-2))' : 'var(--paper-2)'
        }}>
            <h4>{f.name}</h4>
            <div className="desc">{f.desc}</div>
            <div className="tree">{f.tree}</div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn">{selected === f.id ? <><Icon name="check" size={11} /> Selected</> : <>Choose <Icon name="arrow-right" size={11} /></>}</button>
            </div>
          </div>
        )}
      </div>

      <h2 className="upper" style={{ color: 'var(--ink-mute)', margin: '24px 0 12px' }}>Export history</h2>
      <div style={{ border: '1px solid var(--rule)', borderRadius: 8, overflow: 'hidden', background: 'var(--paper-2)' }}>
        {[
        { type: 'PDF article', date: '2 days ago', size: '142 KB' },
        { type: 'Markdown', date: '1 week ago', size: '38 KB' },
        { type: 'JSON', date: '1 week ago', size: '24 KB' }].
        map((h, i) =>
        <div key={i} style={{
          padding: '12px 18px',
          display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 18,
          alignItems: 'center',
          borderBottom: i < 2 ? '1px solid var(--rule-soft)' : 'none',
          fontFamily: 'var(--sans)', fontSize: 12.5
        }}>
            <span className="serif" style={{ fontSize: 14 }}>{h.type}</span>
            <span className="muted">{h.date}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-fade)' }}>{h.size}</span>
            <button className="iconbtn"><Icon name="export" /></button>
          </div>
        )}
      </div>
    </div>);

}

Object.assign(window, {
  Dashboard, TemplateEditor, Exploration, Mapping, Evidence, Drafting, Publishing
});