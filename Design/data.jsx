// Sample data for Episteme
// Attaches everything to window so other Babel scripts can read it.

const BLOCK_TYPES = [
  { id: 'question', label: 'Question', glyph: 'question', desc: 'A curiosity to pursue' },
  { id: 'observation', label: 'Observation', glyph: 'observation', desc: 'Something you noticed' },
  { id: 'hypothesis', label: 'Hypothesis', glyph: 'hypothesis', desc: 'A tentative explanation' },
  { id: 'claim', label: 'Claim', glyph: 'claim', desc: 'An assertion you stand behind' },
  { id: 'counter', label: 'Counterargument', glyph: 'counter', desc: 'Against the grain' },
  { id: 'evidence', label: 'Evidence', glyph: 'evidence', desc: 'Data, study, anecdote' },
  { id: 'reference', label: 'Reference', glyph: 'reference', desc: 'A source to cite' },
  { id: 'analogy', label: 'Analogy', glyph: 'analogy', desc: 'A parallel concept' },
  { id: 'confusion', label: 'Confusion', glyph: 'confusion', desc: 'What you still don\u2019t get' },
  { id: 'conclusion', label: 'Conclusion', glyph: 'conclusion', desc: 'A landed insight' },
  { id: 'draft', label: 'Draft paragraph', glyph: 'draft', desc: 'Prose ready for the article' },
];

const STAGES = [
  { id: 'seed', label: 'Seed', n: 1, blurb: 'Capture raw curiosity.' },
  { id: 'distillation', label: 'Distillation', n: 2, blurb: 'Refine the question.' },
  { id: 'exploration', label: 'Exploration', n: 3, blurb: 'Range widely.' },
  { id: 'mapping', label: 'Mapping', n: 4, blurb: 'Build the concept graph.' },
  { id: 'thesis', label: 'Thesis', n: 5, blurb: 'Compress into a claim.' },
  { id: 'evidence', label: 'Evidence', n: 6, blurb: 'Gather proof material.' },
  { id: 'drafting', label: 'Drafting', n: 7, blurb: 'Assemble the article.' },
  { id: 'publishing', label: 'Publishing', n: 8, blurb: 'Export and share.' },
];

// Sample project blocks
const SAMPLE_BLOCKS = [
  // Seed
  { id: 'b01', stage: 'seed', type: 'question', content: 'When two AI assistants disagree, why do users tend to trust the more confident one — even when its track record is worse?' },
  { id: 'b02', stage: 'seed', type: 'observation', content: 'In a pilot study (n=120, internal, March 2026), 73% of participants preferred Model B\u2019s confident-but-wrong answers over Model A\u2019s hedged correct ones.' },
  { id: 'b03', stage: 'seed', type: 'confusion', content: 'Why does the effect persist even when users are explicitly told the confident model is sometimes wrong?' },

  // Distillation
  { id: 'b04', stage: 'distillation', type: 'question', content: 'How does perceived confidence in an AI system\u2019s output shape user trust, independent of accuracy?' },

  // Exploration
  { id: 'b05', stage: 'exploration', type: 'hypothesis', content: 'Confidence is parsed as a proxy for competence because social signaling rewards decisiveness in human hierarchies — and we extend that frame to non-human agents.' },
  { id: 'b06', stage: 'exploration', type: 'analogy', content: 'Like preferring a surgeon who declares a diagnosis over one who lists probabilities — even before the operating room exists, the framing matters more than the math.' },
  { id: 'b07', stage: 'exploration', type: 'evidence', content: 'Brennan & Park (2024) measured a p<.001 effect of confident phrasing on user belief, controlling for accuracy across 14 task types.' },
  { id: 'b08', stage: 'exploration', type: 'counter', content: 'Some users — particularly those with technical literacy — actively distrust over-confident systems. The effect may invert above a threshold.', linkedTo: ['b05'] },
  { id: 'b09', stage: 'exploration', type: 'reference', content: 'Mercier & Sperber, The Enigma of Reason — argumentative theory predicts confidence is a social signal, not an epistemic one.' },

  // Thesis
  { id: 'b10', stage: 'thesis', type: 'claim', content: 'Confidence is a social fossil: humans evolved to read decisiveness as competence in agents that share their world, and we apply this frame uncritically to language models that don\u2019t.', linkedTo: ['b05', 'b06'] },

  // Evidence
  { id: 'b11', stage: 'evidence', type: 'evidence', content: 'Internal pilot (n=120): 73% prefer confident-wrong over hedged-right; effect drops to 41% when both models are labeled \u201cAI assistant.\u201d' },
  { id: 'b12', stage: 'evidence', type: 'evidence', content: 'Brennan & Park (2024) — p<.001 across 14 task types. Effect strongest in unfamiliar domains.' },
  { id: 'b13', stage: 'evidence', type: 'evidence', content: 'Re-analysis of OpenReview citations 2020\u20132025: hedged abstracts cited 18% less, controlling for venue.' },
  { id: 'b17', stage: 'evidence', type: 'evidence', content: 'Within-subject design (n=64): users warned about model overconfidence still preferred confident-wrong outputs at 68% \u2014 a small but reliable reduction from the unwarned baseline.' },
  { id: 'b18', stage: 'evidence', type: 'evidence', content: 'Voice-mode interactions (sampled transcripts, 2025) show 2.1\u00d7 higher belief-rate for assertive responses than the same content delivered in text.' },

  // Drafting (paragraphs in article tray)
  { id: 'b14', stage: 'drafting', type: 'draft', content: 'Trust in artificial intelligence is, at first glance, a question about accuracy. It is not. It is a question about who we believe — and we have inherited our criteria from a world without language models in it.' },
  { id: 'b15', stage: 'drafting', type: 'draft', content: 'Across our pilot and the broader literature, the same pattern appears: users prefer confident wrong answers to hedged right ones. The preference is not weak. It is not noisy. It survives warnings, disclaimers, and direct evidence to the contrary.' },
  { id: 'b16', stage: 'drafting', type: 'draft', content: 'This is, I will argue, an interpretive error \u2014 not a cognitive failure. The reader is doing exactly what evolutionary pressure trained them to do.' },
];

// Article structure (drafting)
const ARTICLE_SECTIONS = [
  { id: 'intro', label: 'Introduction' },
  { id: 'motivation', label: 'Motivation' },
  { id: 'background', label: 'Background' },
  { id: 'problem', label: 'Problem' },
  { id: 'insight', label: 'Main Insight' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'counter', label: 'Counterarguments' },
  { id: 'conclusion', label: 'Conclusion' },
];

const INITIAL_ARTICLE = {
  intro: ['b14'],
  motivation: ['b15'],
  background: [],
  problem: ['b04'],
  insight: ['b10', 'b16'],
  evidence: ['b11', 'b12'],
  counter: ['b08'],
  conclusion: [],
};

// Graph nodes for Mapping stage
const GRAPH_NODES = [
  { id: 'g_center', type: 'question', label: 'Why do humans trust confident AI?', x: 50, y: 48, center: true },
  { id: 'g_obs',    type: 'observation', label: '73% prefer confident-wrong over hedged-right', x: 20, y: 22 },
  { id: 'g_hyp',    type: 'hypothesis',  label: 'Decisiveness reads as competence', x: 22, y: 64 },
  { id: 'g_claim',  type: 'claim',       label: 'Confidence is a social fossil', x: 52, y: 78 },
  { id: 'g_ana',    type: 'analogy',     label: 'The confident surgeon', x: 78, y: 70 },
  { id: 'g_evd',    type: 'evidence',    label: 'Brennan & Park (2024), p<.001', x: 80, y: 28 },
  { id: 'g_ref',    type: 'reference',   label: 'Mercier & Sperber — argumentative theory', x: 46, y: 14 },
  { id: 'g_ctr',    type: 'counter',     label: 'Technical users distrust over-confidence', x: 88, y: 50 },
  { id: 'g_cnf',    type: 'confusion',   label: 'Why does it persist after warnings?', x: 12, y: 42 },
  { id: 'g_theory', type: 'concept',     label: 'Calibration vs. confidence', x: 30, y: 86 },
];

const GRAPH_EDGES = [
  { from: 'g_obs', to: 'g_center', rel: 'observed_in' },
  { from: 'g_cnf', to: 'g_center', rel: 'arises_from' },
  { from: 'g_hyp', to: 'g_center', rel: 'addresses' },
  { from: 'g_hyp', to: 'g_claim', rel: 'supports' },
  { from: 'g_ana', to: 'g_claim', rel: 'illustrates' },
  { from: 'g_evd', to: 'g_hyp', rel: 'evidence_for' },
  { from: 'g_ref', to: 'g_hyp', rel: 'inspired_by' },
  { from: 'g_ctr', to: 'g_hyp', rel: 'contradicts' },
  { from: 'g_theory', to: 'g_claim', rel: 'depends_on' },
  { from: 'g_obs', to: 'g_hyp', rel: 'evidence_for' },
];

// References library
const REFERENCES = [
  {
    id: 'r1',
    title: 'The Enigma of Reason',
    authors: 'Mercier, H., & Sperber, D.',
    year: '2017',
    venue: 'Harvard University Press',
    notes: 'Argumentative theory: confidence is socially functional, not epistemic.',
  },
  {
    id: 'r2',
    title: 'Confidence as a Social Signal in Human\u2013AI Interaction',
    authors: 'Brennan, K., & Park, S.',
    year: '2024',
    venue: 'CHI \u201924',
    notes: 'p<.001 effect of confident phrasing across 14 task types. Strong in unfamiliar domains.',
  },
  {
    id: 'r3',
    title: 'Thinking, Fast and Slow',
    authors: 'Kahneman, D.',
    year: '2011',
    venue: 'FSG',
    notes: 'System 1 latches on to confidence; deliberate System 2 is the exception.',
  },
  {
    id: 'r4',
    title: 'On the dangers of stochastic parrots',
    authors: 'Bender, E. M., et al.',
    year: '2021',
    venue: 'FAccT',
    notes: 'Fluency is mistaken for understanding; relevant to confidence-misreading.',
  },
  {
    id: 'r5',
    title: 'Calibration of pre-trained transformers',
    authors: 'Desai, S., & Durrett, G.',
    year: '2020',
    venue: 'EMNLP',
    notes: 'Models are over-confident on out-of-distribution inputs.',
  },
];

// Dashboard sample projects
const OTHER_PROJECTS = [
  {
    id: 'p1',
    title: 'Why do humans trust confident AI?',
    thesis: 'Confidence is a social fossil \u2014 read as competence in agents that don\u2019t share our world.',
    stage: 'thesis',
    progress: 62,
    modified: '2h ago',
    tags: ['epistemics', 'hci', 'ai-safety'],
    active: true,
  },
  {
    id: 'p2',
    title: 'What makes a proof feel beautiful?',
    thesis: 'Beauty in mathematics correlates with compression \u2014 the ratio of explanatory power to symbol count.',
    stage: 'exploration',
    progress: 28,
    modified: 'yesterday',
    tags: ['mathematics', 'aesthetics'],
  },
  {
    id: 'p3',
    title: 'How do cities develop accents over time?',
    thesis: '',
    stage: 'seed',
    progress: 6,
    modified: '3 days ago',
    tags: ['linguistics', 'urbanism'],
  },
  {
    id: 'p4',
    title: 'When does open-sourcing accelerate research?',
    thesis: 'Open-source accelerates research only when verification is cheap and forking is cheaper.',
    stage: 'drafting',
    progress: 84,
    modified: '5 days ago',
    tags: ['economics', 'science'],
  },
  {
    id: 'p5',
    title: 'Is attention the right metaphor for transformers?',
    thesis: '',
    stage: 'distillation',
    progress: 18,
    modified: '1 week ago',
    tags: ['ml', 'philosophy-of-mind'],
  },
  {
    id: 'p6',
    title: 'On the half-life of organizational knowledge',
    thesis: 'Tacit knowledge decays log-linearly with tenure turnover.',
    stage: 'published',
    progress: 100,
    modified: '2 weeks ago',
    tags: ['organizations'],
  },
];

const STAGE_LABELS = {
  seed: 'Seed',
  distillation: 'Distillation',
  exploration: 'Exploration',
  mapping: 'Mapping',
  thesis: 'Thesis',
  evidence: 'Evidence',
  drafting: 'Drafting',
  publishing: 'Publishing',
  published: 'Published',
};

const RELATED_PAPERS = [
  { title: 'Calibration of pre-trained transformers', authors: 'Desai & Durrett, 2020', score: 0.91 },
  { title: 'Trust calibration in human\u2013AI teams', authors: 'Yin et al., 2019', score: 0.86 },
  { title: 'On the dangers of stochastic parrots', authors: 'Bender et al., 2021', score: 0.78 },
  { title: 'Self-explaining models and the illusion of understanding', authors: 'Rudin, 2019', score: 0.71 },
];

const OPEN_QUESTIONS = [
  'Does the confidence-bias invert in domains where the user is an expert?',
  'How much disclaimer text is needed to suppress the effect entirely?',
  'Is the bias stronger in voice modalities than text?',
];

const CONTRADICTIONS = [
  { a: 'b08', b: 'b05', note: 'Counterargument predicts effect inverts above expertise threshold; hypothesis assumes uniform effect.' },
];

Object.assign(window, {
  BLOCK_TYPES, STAGES, SAMPLE_BLOCKS, ARTICLE_SECTIONS, INITIAL_ARTICLE,
  GRAPH_NODES, GRAPH_EDGES, REFERENCES, OTHER_PROJECTS, STAGE_LABELS,
  RELATED_PAPERS, OPEN_QUESTIONS, CONTRADICTIONS,
});

// ===== Drafting prose (initial article state) =====
// Each section is an array of "runs": { text, evidence? }.
// A run with an evidence id is a citation; plain text otherwise.
const INITIAL_PROSE = {
  intro: [
    { text: 'Trust in artificial intelligence is, at first glance, a question about accuracy. It is not. It is a question about who we believe \u2014 and we have inherited our criteria from a world without language models in it. The reader trusts the confident voice, even when warned. ' },
    { text: 'The pattern is robust and well-documented across modalities and domains', evidence: 'b07' },
    { text: ', and oddly under-theorized.' },
  ],
  motivation: [
    { text: 'Across our pilot and the broader literature, the same shape appears: ' },
    { text: '73% of our participants preferred confident-wrong over hedged-right', evidence: 'b11' },
    { text: '. The preference is not weak. It is not noisy. It survives warnings, disclaimers, and direct evidence to the contrary.' },
  ],
  background: [
    { text: 'The calibration literature has, for two decades, treated this as a numeracy problem. The argument runs: if users were better at probability, they would correctly discount confident-but-wrong outputs. But the data does not support this \u2014 the effect persists in statisticians, in physicists, in the authors of the calibration literature themselves.' },
  ],
  problem: [
    { text: 'What is being measured, when a user trusts an AI, is not the model. It is the model-as-agent \u2014 a thing that resembles, in form, the other agents the user has spent their life reading. And in those agents, decisiveness is signal. We have no native parser for an entity that produces fluent prose without intending it.' },
  ],
  insight: [
    { text: 'This is, I will argue, an interpretive error \u2014 not a cognitive failure. The reader is doing exactly what evolutionary pressure trained them to do. Confidence is a social fossil: it survives in our reading of AI because we cannot, in real time, decide what kind of thing an AI is. So we use our priors. The priors are wrong, but they are doing their job.' },
  ],
  evidence: [
    { text: 'The empirical picture is consistent across three independent lines. First, our internal pilot. Second, a controlled replication: ' },
    { text: 'Brennan & Park (2024) reached p<.001 across 14 task types', evidence: 'b12' },
    { text: '. Third, a behavioral signal in the literature itself: hedged abstracts get cited less, the same bias leaking into peer review.' },
  ],
  counter: [
    { text: 'The strongest objection is also the most interesting: ' },
    { text: 'technical users distrust over-confidence', evidence: 'b08' },
    { text: '. If the bias were a universal fossil, it should be uniform. It is not. What we will see is that expertise inverts, rather than eliminates, the signal \u2014 the social parser keeps running, it just outputs the opposite verdict.' },
  ],
  conclusion: [
    { text: 'What follows from this is not a technical fix. Calibrated language models will not change the reader\u2019s reading. The work is a question for design: how do we build systems whose social signal matches their epistemic ground? The answer, I suspect, will look less like a confidence score and more like a different kind of voice.' },
  ],
};

Object.assign(window, { INITIAL_PROSE });
