export const STAGES = [
  { id: "seed", api: "Seed", label: "Seed", n: 1, blurb: "Capture raw curiosity." },
  { id: "distillation", api: "Distillation", label: "Distillation", n: 2, blurb: "Refine the question." },
  { id: "exploration", api: "Exploration", label: "Exploration", n: 3, blurb: "Range widely." },
  { id: "mapping", api: "Mapping", label: "Mapping", n: 4, blurb: "Build the concept graph." },
  { id: "thesis", api: "Thesis", label: "Thesis", n: 5, blurb: "Compress into a claim." },
  { id: "evidence", api: "Evidence", label: "Evidence", n: 6, blurb: "Gather proof material." },
  { id: "drafting", api: "Drafting", label: "Drafting", n: 7, blurb: "Assemble the article." },
  { id: "publishing", api: "Publishing", label: "Publishing", n: 8, blurb: "Export and share." }
];

export const STAGE_BY_API = Object.fromEntries(STAGES.map((stage) => [stage.api, stage.id]));
export const API_STAGE_BY_ID = Object.fromEntries(STAGES.map((stage) => [stage.id, stage.api]));

export const BLOCK_TYPES = [
  { id: "question", label: "Question", desc: "A curiosity to pursue" },
  { id: "observation", label: "Observation", desc: "Something you noticed" },
  { id: "hypothesis", label: "Hypothesis", desc: "A tentative explanation" },
  { id: "claim", label: "Claim", desc: "An assertion you stand behind" },
  { id: "counterargument", label: "Counterargument", desc: "Against the grain" },
  { id: "evidence", label: "Evidence", desc: "Data, study, quote, statistic" },
  { id: "reference", label: "Reference", desc: "A source to cite" },
  { id: "analogy", label: "Analogy", desc: "A parallel concept" },
  { id: "confusion", label: "Confusion", desc: "What is still unresolved" },
  { id: "conclusion", label: "Conclusion", desc: "A landed insight" },
  { id: "draft_paragraph", label: "Draft Paragraph", desc: "Prose ready for the article" }
];

export const TEMPLATE_ROWS = {
  seed: [
    ["question", "Initial question", "What are you curious about?"],
    ["why", "Why does this bother me?", "Where is the itch coming from?"],
    ["intuition", "Current intuition", "What do I think is going on?"],
    ["surprise", "What would surprise me?", "A finding that would break my model."],
    ["domains", "Related domains", "Fields, papers, communities to pull from."]
  ],
  distillation: [
    ["broad", "Broad question", "The vague version."],
    ["precise", "Precise question", "Sharpened with fewer ambiguities."],
    ["researchable", "Researchable question", "A version answerable with evidence."],
    ["variables", "Variables", "What can change? What stays fixed?"],
    ["assumptions", "Assumptions", "What am I taking for granted?"],
    ["unknowns", "Unknowns", "What would I need to know first?"]
  ],
  thesis: [
    ["main", "Main claim", "In a single sentence."],
    ["insufficient", "Why existing views are insufficient", "The status quo and its blind spot."],
    ["novel", "Novel perspective", "What only this view sees."],
    ["strongest", "Strongest counterargument", "The objection you most respect."],
    ["needed", "Necessary evidence", "What would settle it."]
  ]
};

export const SAMPLE_PROJECTS = [
  {
    id: "local-p1",
    title: "Why do humans trust confident AI?",
    question: "Why do humans trust confident AI?",
    thesis: "Confidence is a social fossil: read as competence in agents that do not share our world.",
    stage: "Thesis",
    tags: ["epistemics", "hci", "ai-safety"],
    progress: 62,
    export_status: "not_exported",
    updated_at: new Date().toISOString()
  }
];

export const SAMPLE_BLOCKS = [
  { id: "local-b01", project_id: "local-p1", type: "question", content: "When two AI assistants disagree, why do users tend to trust the more confident one, even when its track record is worse?", metadata: { stage: "seed", templateKey: "question" }, links: [] },
  { id: "local-b02", project_id: "local-p1", type: "observation", content: "In a pilot study, 73% of participants preferred confident-but-wrong answers over hedged correct ones.", metadata: { stage: "seed", templateKey: "why" }, links: [] },
  { id: "local-b03", project_id: "local-p1", type: "confusion", content: "Why does the effect persist even when users are warned the confident model is sometimes wrong?", metadata: { stage: "seed", templateKey: "surprise" }, links: [] },
  { id: "local-b04", project_id: "local-p1", type: "question", content: "How does perceived confidence in an AI system shape user trust, independent of accuracy?", metadata: { stage: "distillation", templateKey: "precise" }, links: [] },
  { id: "local-b05", project_id: "local-p1", type: "hypothesis", content: "Confidence is parsed as a proxy for competence because social signaling rewards decisiveness in human hierarchies.", metadata: { stage: "exploration" }, links: [] },
  { id: "local-b06", project_id: "local-p1", type: "analogy", content: "Like preferring a surgeon who declares a diagnosis over one who lists probabilities.", metadata: { stage: "exploration" }, links: [] },
  { id: "local-b07", project_id: "local-p1", type: "counterargument", content: "Technical users may actively distrust over-confident systems; the effect may invert above an expertise threshold.", metadata: { stage: "exploration" }, links: ["local-b05"] },
  { id: "local-b08", project_id: "local-p1", type: "claim", content: "Confidence is a social fossil: humans evolved to read decisiveness as competence, and apply that frame to language models.", metadata: { stage: "thesis", templateKey: "main" }, links: ["local-b05"] },
  { id: "local-b09", project_id: "local-p1", type: "evidence", content: "Internal pilot: 73% prefer confident-wrong over hedged-right; effect drops to 41% when both models are labeled AI assistant.", metadata: { stage: "evidence" }, links: [], priority: 80, checked: false },
  { id: "local-b10", project_id: "local-p1", type: "evidence", content: "Brennan & Park (2024) measured a p<.001 effect of confident phrasing on user belief across 14 task types.", metadata: { stage: "evidence" }, links: [], priority: 70, checked: false },
  { id: "local-b11", project_id: "local-p1", type: "evidence", content: "Voice-mode interactions show 2.1x higher belief-rate for assertive responses than the same content delivered in text.", metadata: { stage: "evidence" }, links: [], priority: 45, checked: false }
];

export const SAMPLE_DRAFT = {
  project_id: "local-p1",
  content_format: "markdown",
  revision: 1,
  content: "Trust in artificial intelligence is, at first glance, a question about accuracy. It is not. It is a question about who we believe, and we have inherited our criteria from a world without language models in it.\n\nAcross pilot data and the broader literature, the same pattern appears: users prefer confident wrong answers to hedged right ones. The preference survives warnings, disclaimers, and direct evidence to the contrary.\n\nThis is an interpretive error, not a cognitive failure. The reader is doing what social pressure trained them to do.",
  updated_at: new Date().toISOString()
};
