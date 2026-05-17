// Main App
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA, useCallback: useCallbackA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "cold",
  "density": "comfortable",
  "ruledMargins": "on",
  "rightPanelMode": "related",
  "accent": "sage",
  "graphLayout": "radial"
}/*EDITMODE-END*/;

const ACCENTS = {
  sage: { accent: 'oklch(0.5 0.13 150)', soft: 'oklch(0.92 0.04 150)', deep: 'oklch(0.38 0.13 150)' },
  rust: { accent: 'oklch(0.55 0.13 35)', soft: 'oklch(0.93 0.04 35)', deep: 'oklch(0.42 0.13 35)' },
  ink:  { accent: 'oklch(0.35 0.04 250)', soft: 'oklch(0.92 0.02 250)', deep: 'oklch(0.25 0.04 250)' },
  ochre:{ accent: 'oklch(0.6 0.12 80)', soft: 'oklch(0.93 0.04 80)', deep: 'oklch(0.45 0.12 80)' },
};

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useStateA('workspace'); // dashboard | workspace
  const [stage, setStage] = useStateA('exploration');
  const [blocks, setBlocks] = useStateA(window.SAMPLE_BLOCKS);
  const [selectedId, setSelectedId] = useStateA('b05');
  const [linkingFrom, setLinkingFrom] = useStateA(null);
  const [newProjectOpen, setNewProjectOpen] = useStateA(false);
  const [otherProjects] = useStateA(window.OTHER_PROJECTS);
  const [currentProjectId, setCurrentProjectId] = useStateA('p1');

  const currentProject = otherProjects.find(p => p.id === currentProjectId) || otherProjects[0];

  // Apply theme/density/rules/accent
  useEffectA(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', tweaks.theme || 'paper');
    html.setAttribute('data-density', tweaks.density || 'comfortable');
    html.setAttribute('data-rules', tweaks.ruledMargins || 'on');
    const a = ACCENTS[tweaks.accent] || ACCENTS.sage;
    html.style.setProperty('--accent', a.accent);
    html.style.setProperty('--accent-soft', a.soft);
    html.style.setProperty('--accent-deep', a.deep);
  }, [tweaks.theme, tweaks.density, tweaks.ruledMargins, tweaks.accent]);

  // Esc cancels linking
  useEffectA(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && linkingFrom) {
        setLinkingFrom(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [linkingFrom]);

  const blocksByStage = useMemoA(() => {
    const grouped = {};
    blocks.forEach(b => {
      grouped[b.stage] = grouped[b.stage] || [];
      grouped[b.stage].push(b);
    });
    return grouped;
  }, [blocks]);

  const stageBlocks = blocksByStage[stage] || [];

  const updateBlock = useCallbackA((id, patch) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const addBlock = useCallbackA((type) => {
    const id = `bn${Date.now()}`;
    const newBlock = { id, stage, type, content: '' };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedId(id);
    setTimeout(() => {
      const el = document.querySelector(`#block-${id} .block-content`);
      if (el) {
        el.focus();
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 50);
  }, [stage]);

  const deleteBlock = useCallbackA((id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const startLink = useCallbackA((id) => {
    setLinkingFrom(id);
    setSelectedId(id);
  }, []);

  const completeLink = useCallbackA((targetId) => {
    if (!linkingFrom || targetId === linkingFrom) return;
    setBlocks(prev => prev.map(b => {
      if (b.id === linkingFrom) {
        const linked = b.linkedTo || [];
        if (linked.includes(targetId)) return b;
        return { ...b, linkedTo: [...linked, targetId] };
      }
      return b;
    }));
    setLinkingFrom(null);
  }, [linkingFrom]);

  const scrollToBlock = useCallbackA((id) => {
    // Find which stage that block is in and switch
    const b = blocks.find(x => x.id === id);
    if (!b) return;
    if (b.stage !== stage && !['exploration', 'evidence'].includes(stage)) {
      setStage(b.stage);
    }
    setSelectedId(id);
    setTimeout(() => {
      document.getElementById(`block-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
  }, [blocks, stage]);

  const selectedBlock = blocks.find(b => b.id === selectedId);

  // ====== render ======

  if (view === 'dashboard') {
    return (
      <>
        <Dashboard
          projects={otherProjects}
          onOpen={(id) => { setCurrentProjectId(id); setView('workspace'); }}
          onNew={() => setNewProjectOpen(true)}
        />
        {newProjectOpen && (
          <NewProjectModal
            onClose={() => setNewProjectOpen(false)}
            onCreate={(data) => {
              // Pretend to create — switch to workspace, seed stage
              setNewProjectOpen(false);
              setStage('seed');
              setView('workspace');
            }}
          />
        )}
        {tweaksPanel(tweaks, setTweak)}
      </>
    );
  }

  // workspace view
  const isMapping = stage === 'mapping';
  const isDrafting = stage === 'drafting';
  const isPublishing = stage === 'publishing';
  const showRight = !isMapping && !isPublishing && !isDrafting;
  const wideMain = isDrafting;

  return (
    <>
      <div className={`shell ${showRight ? '' : 'no-right'}`} style={!showRight ? {gridTemplateColumns:'224px minmax(0, 1fr)'} : {}}>
        <TopBar
          projectTitle={currentProject.title}
          view={view}
          setView={setView}
          stage={stage}
          onExport={() => setStage('publishing')}
        />
        <Sidebar
          stage={stage}
          setStage={setStage}
          blocksByStage={blocksByStage}
          project={currentProject}
          otherProjects={otherProjects}
          onSwitchProject={(id) => setCurrentProjectId(id)}
          onOpenDashboard={() => setView('dashboard')}
        />
        {isMapping ? (
          <Mapping allBlocks={blocks} />
        ) : (
          <div className="main">
            <div className={`main-inner ${wideMain ? 'wide' : ''}`}>
              <StageStrip stage={stage} setStage={setStage} blocksByStage={blocksByStage} />

              {/* Page header */}
              <PageHeader stage={stage} project={currentProject} blocksByStage={blocksByStage}/>

              {/* body */}
              {(stage === 'seed' || stage === 'distillation' || stage === 'thesis') && (
                <TemplateEditor stage={stage} blocks={blocks} onUpdate={updateBlock} onSelectBlock={setSelectedId} selectedId={selectedId}/>
              )}
              {stage === 'exploration' && (
                <Exploration
                  blocks={stageBlocks}
                  allBlocks={blocks}
                  onUpdate={updateBlock}
                  onAdd={addBlock}
                  onDelete={deleteBlock}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  linkMode={!!linkingFrom}
                  linkingFrom={linkingFrom}
                  onStartLink={startLink}
                  onCompleteLink={completeLink}
                  onCancelLink={() => setLinkingFrom(null)}
                />
              )}
              {stage === 'evidence' && (
                <Evidence blocks={blocks}/>
              )}
              {stage === 'drafting' && (
                <Drafting blocks={blocks}/>
              )}
              {stage === 'publishing' && (
                <Publishing blocks={blocks}/>
              )}
            </div>
          </div>
        )}
        {showRight && (
          <RightPanel
            mode={tweaks.rightPanelMode || 'related'}
            setMode={(m) => setTweak('rightPanelMode', m)}
            selectedBlock={selectedBlock}
            blocks={blocks}
            onScrollToBlock={scrollToBlock}
            contradictions={window.CONTRADICTIONS}
          />
        )}
      </div>

      {newProjectOpen && (
        <NewProjectModal
          onClose={() => setNewProjectOpen(false)}
          onCreate={() => { setNewProjectOpen(false); setStage('seed'); }}
        />
      )}

      {tweaksPanel(tweaks, setTweak)}
    </>
  );
}

function PageHeader({ stage, project, blocksByStage }) {
  const s = window.STAGES.find(s => s.id === stage);
  const headings = {
    seed: { title: <>Plant the <em>seed</em>.</>, sub: 'Raw curiosity. No structure required yet.' },
    distillation: { title: <>Distill the <em>question</em>.</>, sub: 'Sharpen vague wondering into something researchable.' },
    exploration: { title: <>Range <em>widely</em>.</>, sub: 'Collect ideas, evidence, analogies, contradictions. Type / to add.' },
    mapping: { title: <>Map the <em>concepts</em>.</>, sub: 'Build the graph of how your blocks relate.' },
    thesis: { title: <>Compress to a <em>thesis</em>.</>, sub: 'One claim, defensible.' },
    evidence: { title: <>Gather <em>evidence</em>.</>, sub: 'Studies, data, references, anecdotes — anything you would cite.' },
    drafting: { title: <>Write the <em>article</em>.</>, sub: 'Select prose to cite. Evidence in the rail checks itself off.' },
    publishing: { title: <><em>Publish</em>.</>, sub: 'Export everything — markdown, PDF, JSON. Your project, your file system.' },
  };
  const h = headings[stage] || { title: stage, sub: '' };
  const stageCount = (blocksByStage[stage] || []).length;

  return (
    <div style={{marginBottom: 32}}>
      <h1 className="page-title">{h.title}</h1>
      <div className="page-sub" style={{marginBottom: 6}}>
        <span className="mono" style={{fontSize:10.5, color:'var(--ink-fade)', textTransform:'uppercase', letterSpacing:'0.1em'}}>
          Stage {s?.n} / 8
        </span>
        {stageCount > 0 && <>
          <span className="dot"></span>
          <span>{stageCount} {stageCount === 1 ? 'block' : 'blocks'}</span>
        </>}
        <span className="dot"></span>
        <span>last edit 2m ago</span>
      </div>
      <div className="serif" style={{fontSize: 15, fontStyle: 'italic', color: 'var(--ink-mute)', lineHeight: 1.45, maxWidth: 520}}>
        {h.sub}
      </div>
    </div>
  );
}

function tweaksPanel(tweaks, setTweak) {
  // map accent name <-> hex for TweakColor
  const accentHex = {
    sage: '#2f7a4f',
    rust: '#b85a3a',
    ink:  '#3b4456',
    ochre:'#a68234',
  };
  const hexToName = Object.fromEntries(Object.entries(accentHex).map(([k, v]) => [v.toLowerCase(), k]));
  const currentHex = accentHex[tweaks.accent] || accentHex.sage;

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Aesthetic">
        <TweakRadio
          label="Theme"
          value={tweaks.theme}
          onChange={(v) => setTweak('theme', v)}
          options={[
            { value: 'paper', label: 'Paper' },
            { value: 'cold', label: 'Cold' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <TweakColor
          label="Accent"
          value={currentHex}
          onChange={(v) => setTweak('accent', hexToName[v.toLowerCase()] || 'sage')}
          options={Object.values(accentHex)}
        />
      </TweakSection>

      <TweakSection label="Layout">
        <TweakRadio
          label="Density"
          value={tweaks.density}
          onChange={(v) => setTweak('density', v)}
          options={[
            { value: 'comfortable', label: 'Airy' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
        <TweakRadio
          label="Ruled margins"
          value={tweaks.ruledMargins}
          onChange={(v) => setTweak('ruledMargins', v)}
          options={[
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Right panel">
        <TweakSelect
          label="Default mode"
          value={tweaks.rightPanelMode}
          onChange={(v) => setTweak('rightPanelMode', v)}
          options={[
            { value: 'related', label: 'Related blocks' },
            { value: 'papers', label: 'Papers' },
            { value: 'questions', label: 'Open questions' },
            { value: 'ai', label: 'AI suggestions' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
