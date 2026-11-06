import { LEVELS, FIX_COMMANDS, integratedCalculator } from './curriculum.js';
import {
  STORAGE_KEY,
  clone,
  createState,
  restoreState,
  getRun,
  newRun,
  setLevel,
  setFile,
  validateTask,
  completeAndPush,
  finishAI,
  runChecks,
  resolveConflict,
  rebaseOntoMain,
  featureSteps,
  verifyBDD,
  requestChanges,
  approve,
  merge,
  executeCommand,
  diffLines,
  stepFor,
  coachGuide,
} from './engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  branch: '<path d="M6 3v12a3 3 0 0 0 3 3h3m6-15v4a5 5 0 0 1-5 5H6"/><circle cx="6" cy="3" r="2"/><circle cx="18" cy="3" r="2"/><circle cx="14" cy="18" r="2"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  book: '<path d="M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z"/>',
  trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8"/>',
  settings: '<path d="m9 3-1 3-3 1-1 4 2 2-1 3 3 3 3-1 2 2 4-1 1-3 3-1 1-4-2-2 1-3-3-3-3 1-2-2Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5.7-1.5 1-1.5 3m0 3h.01"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  circlecheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  terminal: '<path d="m4 5 6 6-6 6m9 0h7"/>',
  sparkle: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  pr: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10m7-13h2a3 3 0 0 1 3 3v10m-5-13 3-3m-3 3 3 3"/><circle cx="18" cy="19" r="2"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  file: '<path d="M14 2H5v20h14V7Zm0 0v5h5M8 12h8m-8 4h5"/>',
  folder: '<path d="M3 6V4h6l2 3h10v13H3Zm0 1h8"/>',
  java: '<path d="M8 4 6 7l3 3-2 2m7-10-2 4 3 3-2 3M5 14h12v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Zm12 1h2a2 2 0 0 1 0 4h-3"/>',
  rocket: '<path d="M14 4c3-2 6-2 7-1 1 1 1 4-1 7l-8 8-6-6Zm-8 8H2l4-6h5m1 12v4l6-4v-5M6 17l-3 4m6-2-1 3m-5-8-2 1"/><circle cx="16" cy="8" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  merge: '<circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/><circle cx="6" cy="20" r="2"/><path d="M6 6v12m0-9c0 6 12 0 12 9"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  save: '<path d="m19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8"/>',
  external: '<path d="M14 3h7v7m0-7L10 14m0-10H3v17h17v-7"/>',
  warning: '<path d="m12 3 10 18H2Zm0 6v5m0 3h.01"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;

let storageOK = true;
let state;
try {
  state = restoreState(localStorage.getItem(STORAGE_KEY));
} catch {
  state = createState();
  storageOK = false;
}
const ui = {
  tab: 'codex',
  terminalHistory: [],
  historyIndex: 0,
  checking: new Set(),
  aiActive: new Map(),
  terminalVisible: true,
  saved: true,
  diffExpanded: false,
  levelMenuOpen: false,
  selectedCommitHash: null,
};

let saveTimer;
function save(immediate = false) {
  clearTimeout(saveTimer);
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageOK = true;
      ui.saved = true;
    } catch {
      storageOK = false;
      ui.saved = false;
    }
    updateSaveStatus();
  };
  if (immediate) persist();
  else {
    ui.saved = false;
    updateSaveStatus();
    saveTimer = setTimeout(persist, 250);
  }
}

function updateSaveStatus() {
  document.querySelectorAll('[data-save-status]').forEach(el => {
    el.textContent = !storageOK ? 'Session only' : ui.saved ? 'All changes saved' : 'Saving…';
  });
}

window.addEventListener('pagehide', () => save(true));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function rankForXP(xp = 0) {
  if (xp >= 900) return { title: 'Principal Maintainer', color: '#f59e0b' };
  if (xp >= 600) return { title: 'Rebase Ranger', color: '#c084fc' };
  if (xp >= 350) return { title: 'Conflict Whisperer', color: '#38bdf8' };
  if (xp >= 150) return { title: 'Branch Builder', color: '#4ade80' };
  return { title: 'Repo Rookie', color: '#94a3b8' };
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'warning' : 'circlecheck')}<span>${esc(message)}</span><button class="icon-button" aria-label="Dismiss notification">${icon('close')}</button>`;
  el.querySelector('button').onclick = () => el.remove();
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 6500);
}

function syntax(source) {
  return source
    .split('\n')
    .map(line => {
      if (/^\s*(\/\/|#|<<<<<<<|=======|>>>>>>>)/.test(line)) {
        return `<span class="${/^(<<<<<<<|=======|>>>>>>>)/.test(line) ? 'token-conflict' : 'token-comment'}">${esc(line)}</span>`;
      }
      return line
        .replace(/"(?:\\.|[^"\\])*"|\b(?:package|import|public|private|class|static|final|boolean|void|double|int|String|return|if|else|throw|new|null|true|false|Feature|Scenario|Given|When|Then)\b|@\w+|\b\d+(?:\.\d+)?\b/g, (match, offset) => `\u0001${offset}:${match.length}\u0002`)
        .split(/(\u0001\d+:\d+\u0002)/)
        .map(part => {
          const token = part.match(/^\u0001(\d+):(\d+)\u0002$/);
          if (!token) return esc(part);
          const value = line.slice(Number(token[1]), Number(token[1]) + Number(token[2]));
          const cls = value.startsWith('"') ? 'string' : /^\d/.test(value) ? 'number' : value.startsWith('@') ? 'annotation' : 'keyword';
          return `<span class="token-${cls}">${esc(value)}</span>`;
        })
        .join('');
    })
    .join('\n');
}

function renderConceptGraphic(type) {
  switch (type) {
    case 'conflict':
      return `<svg class="concept-svg" viewBox="0 0 220 90" aria-hidden="true">
        <path d="M20 45 H70 C95 45, 95 20, 120 20 H165" stroke="#4ade80" stroke-width="3" fill="none"/>
        <path d="M20 45 H70 C95 45, 95 70, 120 70 H165" stroke="#c084fc" stroke-width="3" fill="none"/>
        <path d="M165 20 C180 20, 180 45, 198 45" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4 3" fill="none"/>
        <path d="M165 70 C180 70, 180 45, 198 45" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4 3" fill="none"/>
        <circle cx="20" cy="45" r="6" fill="#38bdf8"/>
        <circle cx="145" cy="20" r="6" fill="#4ade80"/>
        <circle cx="145" cy="70" r="6" fill="#c084fc"/>
        <circle cx="198" cy="45" r="9" fill="#f59e0b"/>
        <text x="198" y="49" text-anchor="middle" fill="#0f172a" font-size="11" font-weight="800">!</text>
        <text x="135" y="12" fill="#86efac" font-size="8" font-family="monospace">YOU</text>
        <text x="130" y="85" fill="#d8b4fe" font-size="8" font-family="monospace">CODEX</text>
      </svg>`;
    case 'rebase':
      return `<svg class="concept-svg" viewBox="0 0 220 90" aria-hidden="true">
        <path d="M20 55 H195" stroke="#38bdf8" stroke-width="3" fill="none"/>
        <path d="M55 55 C70 55, 70 22, 90 22 H125" stroke="#4ade80" stroke-width="2" stroke-dasharray="4 3" fill="none" opacity="0.5"/>
        <path d="M140 55 C155 55, 155 22, 175 22 H198" stroke="#4ade80" stroke-width="3" fill="none"/>
        <path d="M115 20 Q145 5, 172 18" stroke="#fbbf24" stroke-width="2" fill="none"/>
        <circle cx="55" cy="55" r="6" fill="#38bdf8"/>
        <circle cx="140" cy="55" r="6" fill="#c084fc"/>
        <circle cx="105" cy="22" r="5" fill="#4ade80" opacity="0.45"/>
        <circle cx="185" cy="22" r="7" fill="#4ade80"/>
        <text x="142" y="13" text-anchor="middle" fill="#fbbf24" font-size="8" font-family="monospace">REBASE →</text>
      </svg>`;
    case 'revert':
      return `<svg class="concept-svg" viewBox="0 0 220 90" aria-hidden="true">
        <path d="M20 48 H198" stroke="#38bdf8" stroke-width="3" fill="none"/>
        <circle cx="45" cy="48" r="6" fill="#38bdf8"/>
        <circle cx="105" cy="48" r="8" fill="#ef4444"/>
        <circle cx="170" cy="48" r="8" fill="#4ade80"/>
        <path d="M165 34 C145 14, 125 14, 110 34" stroke="#4ade80" stroke-width="2.5" fill="none"/>
        <text x="105" y="70" text-anchor="middle" fill="#fca5a5" font-size="8" font-family="monospace">BAD COMMIT</text>
        <text x="170" y="70" text-anchor="middle" fill="#86efac" font-size="8" font-family="monospace">REVERT COMMIT</text>
      </svg>`;
    case 'review-loop':
      return `<svg class="concept-svg" viewBox="0 0 220 90" aria-hidden="true">
        <rect x="18" y="24" width="52" height="38" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
        <text x="44" y="47" text-anchor="middle" fill="#fca5a5" font-size="9" font-family="monospace">CI RED</text>
        <path d="M74 43 H102" stroke="#f59e0b" stroke-width="2.5"/>
        <rect x="104" y="24" width="46" height="38" rx="8" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
        <text x="127" y="47" text-anchor="middle" fill="#d8b4fe" font-size="9" font-family="monospace">FIX</text>
        <path d="M154 43 H172" stroke="#4ade80" stroke-width="2.5"/>
        <circle cx="190" cy="43" r="14" fill="#14532d" stroke="#4ade80" stroke-width="2"/>
        <text x="190" y="47" text-anchor="middle" fill="#86efac" font-size="9" font-weight="700">OK</text>
      </svg>`;
    default:
      return `<svg class="concept-svg" viewBox="0 0 220 90" aria-hidden="true">
        <path d="M18 45 H202" stroke="#38bdf8" stroke-width="3" fill="none"/>
        <path d="M45 45 C62 45, 62 18, 82 18 H135 C152 18, 152 45, 168 45" stroke="#4ade80" stroke-width="3" fill="none"/>
        <path d="M75 45 C92 45, 92 72, 112 72 H160 C175 72, 175 45, 192 45" stroke="#c084fc" stroke-width="3" fill="none"/>
        <circle cx="45" cy="45" r="5" fill="#38bdf8"/>
        <circle cx="108" cy="18" r="6" fill="#4ade80"/>
        <circle cx="136" cy="72" r="6" fill="#c084fc"/>
        <circle cx="168" cy="45" r="6" fill="#4ade80"/>
        <circle cx="192" cy="45" r="7" fill="#c084fc"/>
      </svg>`;
  }
}

function renderLiveBranchGraph(run, level) {
  const commits = run.history;
  const width = Math.max(660, 150 + commits.length * 105);
  const laneY = { 'feature/codex-task': 32, main: 76, 'feature/user-task': 120 };
  const laneColor = { 'feature/codex-task': '#c084fc', main: '#38bdf8', 'feature/user-task': '#4ade80' };

  const nodes = commits.map((c, idx) => {
    const x = 135 + idx * 96;
    const y = laneY[c.branch] || laneY.main;
    const color = laneColor[c.branch] || '#38bdf8';
    return { ...c, x, y, color, idx };
  });

  const links = [];
  for (let i = 1; i < nodes.length; i++) {
    const curr = nodes[i];
    let prev = nodes[i - 1];
    for (let j = i - 1; j >= 0; j--) {
      if (nodes[j].branch === curr.branch || nodes[j].branch === 'main') {
        prev = nodes[j];
        if (nodes[j].branch === curr.branch) break;
      }
    }
    const midX = (prev.x + curr.x) / 2;
    links.push(`<path d="M${prev.x} ${prev.y} C${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}" stroke="${curr.color}" stroke-width="3" fill="none" opacity="0.85"/>`);
    if (/^Merge/i.test(curr.message) && i >= 2) {
      const sourceBranch = curr.author === 'Codex' && level.id !== 1 ? 'feature/codex-task' : curr.author === 'You' && [1, 3, 4].includes(level.id) ? 'feature/codex-task' : 'feature/user-task';
      const sourceNode = [...nodes.slice(0, i)].reverse().find(n => n.branch === sourceBranch);
      if (sourceNode && sourceNode !== prev) {
        const mX = (sourceNode.x + curr.x) / 2;
        links.push(`<path d="M${sourceNode.x} ${sourceNode.y} C${mX} ${sourceNode.y}, ${mX} ${curr.y}, ${curr.x} ${curr.y}" stroke="${sourceNode.color}" stroke-width="2.5" stroke-dasharray="5 3" fill="none" opacity="0.85"/>`);
      }
    }
  }

  const selected = nodes.find(n => n.hash === ui.selectedCommitHash) || nodes.at(-1);

  return `<section class="branch-visualizer" aria-label="Live interactive Git branch graph">
    <div class="visualizer-main">
      <div class="visualizer-header">
        <div class="visualizer-title">
          <span class="live-badge"><i class="green-dot pulsing"></i>LIVE REPO MAP</span>
          <h2>Interactive 2-Developer Branch Graph</h2>
          <span class="visualizer-subtitle">Click any commit dot to inspect it · Watch yours and Codex’s branches diverge &amp; merge!</span>
        </div>
        <div class="visualizer-legend">
          <span class="legend-chip codex-chip"><i></i>🤖 feature/codex-task</span>
          <span class="legend-chip main-chip"><i></i>🌐 main</span>
          <span class="legend-chip user-chip"><i></i>🧑‍💻 feature/user-task ${run.branch === 'feature/user-task' ? '<b>(HEAD)</b>' : ''}</span>
          ${run.conflict && !run.conflictResolved ? '<span class="status-pill danger-pill">⚡ MERGE CONFLICT</span>' : ''}
          ${run.needsRebase && !run.rebased ? '<span class="status-pill warn-pill">⏳ 1 COMMIT BEHIND MAIN (NEEDS REBASE)</span>' : ''}
          ${run.status === 'complete' ? '<span class="status-pill ok-pill">✓ ALL BRANCHES MERGED</span>' : ''}
        </div>
      </div>
      <div class="graph-scroll">
        <svg class="git-graph-svg" viewBox="0 0 ${width} 152" role="img" aria-label="Git commit graph across main, feature/user-task, and feature/codex-task">
          <line x1="115" y1="32" x2="${width - 24}" y2="32" stroke="#2e2344" stroke-width="1.5" stroke-dasharray="4 4"/>
          <line x1="115" y1="76" x2="${width - 24}" y2="76" stroke="#1e3448" stroke-width="1.5" stroke-dasharray="4 4"/>
          <line x1="115" y1="120" x2="${width - 24}" y2="120" stroke="#1b3a2b" stroke-width="1.5" stroke-dasharray="4 4"/>
          <text x="12" y="36" fill="#c084fc" font-size="10" font-family="monospace" font-weight="600">codex-task</text>
          <text x="12" y="80" fill="#38bdf8" font-size="10" font-family="monospace" font-weight="600">main</text>
          <text x="12" y="124" fill="#4ade80" font-size="10" font-family="monospace" font-weight="600">user-task</text>
          ${links.join('')}
          ${nodes
            .map(
              n => `<g class="graph-node-group" data-commit="${esc(n.hash)}" tabindex="0" role="button" aria-label="Commit ${esc(n.hash)}: ${esc(n.message)} by ${esc(n.author)}">
            ${selected?.hash === n.hash ? `<circle cx="${n.x}" cy="${n.y}" r="14" fill="${n.color}" opacity="0.22"/>` : ''}
            <circle cx="${n.x}" cy="${n.y}" r="8" fill="#0d131c" stroke="${n.color}" stroke-width="3.2"/>
            <circle cx="${n.x}" cy="${n.y}" r="3.5" fill="${n.color}"/>
            <text x="${n.x}" y="${n.y - 13}" text-anchor="middle" fill="#cbd5e1" font-size="9" font-family="monospace">${esc(n.hash.slice(0, 6))}</text>
            <text x="${n.x}" y="${n.y + 22}" text-anchor="middle" fill="#94a3b8" font-size="8.5" font-family="sans-serif">${esc(n.author === 'You' ? 'You' : n.author === 'Codex' ? '🤖 Codex' : 'Init')}</text>
          </g>`
            )
            .join('')}
        </svg>
      </div>
      <div class="commit-inspector">
        <span class="commit-hash-pill">commit ${esc(selected.hash)}</span>
        <strong>${esc(selected.message)}</strong>
        <span class="commit-meta-tag">by <b>${esc(selected.author)}</b> on <code>${esc(selected.branch)}</code></span>
        <button class="text-button" data-action="branches">${icon('branch')}Full history (${commits.length})</button>
      </div>
    </div>
    <aside class="concept-card" aria-label="Why two developers need this skill">
      <div class="concept-card-top">
        <span class="concept-tag">${esc(level.topic.toUpperCase())}</span>
        <span class="xp-pill">+${level.xp || 100} XP</span>
      </div>
      ${renderConceptGraphic(level.conceptDiagram)}
      <p class="concept-why"><strong>Why 2 people need this:</strong> ${esc(level.whyTwoPeople)}</p>
      <div class="git-skill-chips"><code>${esc(level.gitSkill)}</code></div>
    </aside>
  </section>`;
}

function renderCoachBanner(state) {
  const guide = coachGuide(state);
  return `<section class="coach-banner" aria-label="Step-by-step interactive guide">
    <div class="coach-avatar-wrap" aria-hidden="true">
      <div class="coach-duo">
        <span class="duo-you">YOU</span>
        <span class="duo-plus">+</span>
        <span class="duo-codex">${icon('sparkle')}</span>
      </div>
    </div>
    <div class="coach-body">
      <div class="coach-eyebrow">
        <span class="coach-step-badge">${esc(guide.stepBadge)}</span>
        <button class="coach-cli-chip" type="button" data-action="terminal-suggestion" data-command="${esc(guide.cliCommand)}" title="Click to insert into terminal">
          ${icon('terminal')}<span>Try CLI: <code>${esc(guide.cliCommand)}</code></span>
        </button>
      </div>
      <h2>${esc(guide.title)}</h2>
      <p>${esc(guide.message)}</p>
    </div>
    <div class="coach-cta">
      ${
        guide.ctaAction
          ? `<button class="button primary spotlight-button" data-action="coach-cta" data-coach-target="${esc(guide.ctaAction)}"><span>${esc(guide.ctaLabel)}</span>${icon('arrow')}</button>`
          : `<div class="waiting-chip"><span class="status-dot"></span>${esc(guide.ctaLabel)}</div>`
      }
    </div>
  </section>`;
}

function render() {
  const run = getRun(state);
  const level = LEVELS[state.currentLevel - 1];
  const step = stepFor(run);
  const rank = rankForXP(state.xp || 0);
  const previous = document.activeElement;
  const menuFocusId = previous?.closest('.level-picker') ? previous.id : null;
  const keepFocus = ['code-input', 'terminal-input'].includes(previous?.id) && $('#app').dataset.level === String(level.id) && $('#app').dataset.file === run.activeFile;
  const focusSnapshot = keepFocus ? { id: previous.id, start: previous.selectionStart, end: previous.selectionEnd, top: previous.scrollTop, left: previous.scrollLeft, value: previous.value } : null;
  const steps = ['1. Edit Branch', '2. Commit & Push', '3. Codex Collaborates', '4. Review & Sync', '5. Merge to Main'];

  $('#app').innerHTML = `
    <aside class="rail" aria-label="Workspace navigation">
      <a class="brand-symbol" href="#" aria-label="BranchLab home" data-action="home">${icon('branch')}</a>
      <div class="rail-links">
        <button class="rail-button active" data-action="workspace" title="Workspace" aria-label="Workspace">${icon('code')}<span class="rail-tooltip">Workspace</span></button>
        <button class="rail-button" data-action="curriculum" title="Curriculum" aria-label="View curriculum">${icon('book')}<span class="rail-tooltip">6 Missions</span></button>
        <button class="rail-button" data-action="badges" title="Your achievements" aria-label="Your achievements">${icon('trophy')}${state.badges.length ? '<i class="notification-dot"></i>' : ''}<span class="rail-tooltip">Achievements</span></button>
      </div>
      <div class="rail-bottom"><button class="rail-button" data-action="help" title="Quick guide" aria-label="Quick guide">${icon('help')}</button><div class="avatar small">YOU</div></div>
    </aside>
    <div class="app-shell">
      <header class="topbar">
        <a class="wordmark" href="#" data-action="home">Branch<span>Lab</span><span class="beta">2.0 VISUAL</span></a>
        <span class="topbar-divider"></span><span class="product-name">2-Player GitHub Collaboration Simulator (You + Codex AI)</span>
        <div class="topbar-right">
          <div class="rank-pill" title="Your Git Collaboration XP &amp; Rank">
            <span class="rank-dot" style="background:${rank.color}"></span>
            <strong>${esc(rank.title)}</strong>
            <span class="xp-counter">${state.xp || 0} XP</span>
          </div>
          <span class="save-indicator"><i></i><span data-save-status>${storageOK ? 'All changes saved' : 'Session only'}</span></span>
          <button class="button subtle guide-button" data-action="help">${icon('book')}How 2-Person Git Works${icon('external')}</button>
          <span class="topbar-divider"></span>
          <div class="avatar">Y</div>
        </div>
      </header>
      <main>
        <div class="page-heading">
          <div>
            <div class="eyebrow"><span class="green-dot"></span> SOLO PRACTICE FOR 2-DEVELOPER GITHUB WORKFLOWS</div>
            <h1>No teammate? <span>Practice with Codex.</span></h1>
            <p>Master branching, Pull Requests, code reviews, merge conflicts, <code>git rebase</code>, and <code>git revert</code> visually.</p>
          </div>
          <div class="progress-summary">
            <div class="progress-ring" style="--progress:${Math.round((state.completed.length / LEVELS.length) * 100)}%">
              <span>${state.completed.length}<small>/${LEVELS.length}</small></span>
            </div>
            <div>
              <strong>Your mission progress</strong>
              <span>${state.completed.length === LEVELS.length ? 'All 6 collaboration missions mastered!' : `${state.completed.length} of ${LEVELS.length} missions completed`}</span>
            </div>
          </div>
        </div>

        ${renderCoachBanner(state)}
        ${renderLiveBranchGraph(run, level)}

        <section class="workflow" aria-label="Collaboration workflow">
          <div class="workflow-label">MISSION ROADMAP<span>Follow the glowing step</span></div>
          <ol>${steps
            .map(
              (label, i) =>
                `<li class="${i + 1 < step || run.status === 'complete' ? 'done' : i + 1 === step ? 'current' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}><span class="step-number">${
                  i + 1 < step || run.status === 'complete' ? icon('check') : i + 1
                }</span><span>${label}</span>${i < 4 ? '<span class="step-line"></span>' : ''}</li>`
            )
            .join('')}</ol>
        </section>

        <div class="workspace-grid">
          <section class="panel local-panel" aria-label="Your local workspace">
            <header class="panel-heading">
              <div class="panel-label">${icon('code')}<h2>Your workspace</h2><span class="local-tag">DEVELOPER A (YOU)</span></div>
              <button class="branch-button" data-action="branches">${icon('branch')}<span>${esc(run.branch)}</span>${icon('down')}</button>
            </header>
            <div class="level-header">
              <div>
                <div class="level-eyebrow">MISSION ${level.id} OF ${LEVELS.length} <span class="difficulty d-${level.id}">${level.difficulty}</span></div>
                <h3>${level.title}</h3>
              </div>
              ${levelPicker(level)}
            </div>
            <div class="objective-card">
              <span class="task-badge">A</span>
              <div>
                <div class="objective-title">
                  <strong>${level.task}</strong>
                  <div class="objective-quick-links">
                    ${
                      run.status === 'editing'
                        ? `<button class="quick-fill-chip" type="button" data-action="quick-fill" title="Fill the code solution automatically so you can focus on practicing Git">${icon('zap')}⚡ 1-Click Fill Code</button>`
                        : ''
                    }
                    <button class="text-button" data-action="hint">${icon('sparkle')}Need a hint?</button>
                  </div>
                </div>
                <p>${level.taskDescription}</p>
                <div id="objective-checks">${objectiveChecks()}</div>
              </div>
            </div>
            ${
              run.conflict && !run.conflictResolved
                ? `<div class="conflict-resolver-bar" role="region" aria-label="Visual Merge Conflict Resolver">
                    <div class="conflict-bar-title">${icon('warning')}<strong>Visual Conflict Resolver:</strong><span>Choose how to combine <code>HEAD</code> (Yours) &amp; <code>main</code> (Codex’s)</span></div>
                    <div class="conflict-bar-buttons">
                      <button type="button" class="button small-button subtle" data-action="conflict-keep-mine">Keep Mine Only</button>
                      <button type="button" class="button small-button subtle" data-action="conflict-keep-codex">Keep Codex’s Only</button>
                      <button type="button" class="button small-button primary" data-action="insert-resolution">${icon('sparkle')}Combine Both (Recommended)</button>
                    </div>
                  </div>`
                : ''
            }
            <div class="editor-layout">
              <nav class="file-explorer" aria-label="Project files">
                <div class="explorer-label">EXPLORER<button class="icon-button" data-action="file-info" title="Project structure" aria-label="Project structure">${icon('folder')}</button></div>
                <div class="project-folder">${icon('down')} collaboration-lab</div>
                <div class="folder-item">${icon('down')}${icon('folder')} ${level.id === 3 ? 'src / test' : 'src / main'}</div>
                ${Object.keys(run.files)
                  .map(
                    file =>
                      `<button class="file-item ${run.activeFile === file ? 'selected' : ''}" data-file="${esc(file)}" title="${esc(file)}">${icon(
                        file.endsWith('.java') ? 'java' : 'file',
                        file.endsWith('.java') ? 'java-icon' : file.endsWith('.feature') ? 'green-icon' : 'muted-icon'
                      )}<span>${esc(file)}</span>${run.files[file] !== run.committedFiles[file] ? '<b>M</b>' : ''}</button>`
                  )
                  .join('')}
                <div class="explorer-bottom">${icon('lock')} Safe browser sandbox</div>
              </nav>
              <div class="editor">
                <div class="editor-tabbar">
                  <div class="editor-tab">${icon(run.activeFile.endsWith('.java') ? 'java' : 'file', 'java-icon')}<span>${esc(run.activeFile)}</span><span id="editor-dirty" class="dirty-dot ${
    run.files[run.activeFile] !== run.committedFiles[run.activeFile] ? '' : 'hidden'
  }"></span></div>
                  <div class="editor-tab-actions">
                    ${
                      run.status === 'editing'
                        ? `<button class="text-button editor-fill-btn" type="button" data-action="quick-fill" title="Insert example code">${icon('zap')}1-Click Fill</button>`
                        : ''
                    }
                    <button class="icon-button" data-action="check-code" title="Check your code" aria-label="Check your code">${icon('play')}</button>
                  </div>
                </div>
                <div class="editor-breadcrumb">${level.path
                  .split('/')
                  .map(p => `<span>${p}</span>${icon('chevron')}`)
                  .join('')}<span>${esc(run.activeFile)}</span></div>
                <div class="code-editor ${run.conflict && !run.conflictResolved ? 'has-conflict' : ''}">
                  <div class="line-numbers" aria-hidden="true"><div class="line-number-list"></div></div>
                  <div class="code-surface"><textarea id="code-input" class="code-input" aria-label="Edit ${esc(run.activeFile)}" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" ${
    isReadOnly(run) ? 'readonly' : ''
  } wrap="off"></textarea></div>
                </div>
                <div class="editor-status">
                  <span>${run.conflict && !run.conflictResolved ? `${icon('warning')} Resolve both changes` : `${icon('circlecheck')} ${isReadOnly(run) ? 'Review mode' : 'Ready when you are'}`}</span>
                  <span id="cursor-position">Ln 1, Col 1</span>
                  <span>${run.activeFile.endsWith('.feature') ? 'Gherkin' : run.activeFile.endsWith('.xml') ? 'XML' : 'Java'}</span>
                </div>
              </div>
            </div>
            ${terminalContent(run)}
            <div class="workspace-actions">
              <div class="workspace-action-row">${localActions(run)}</div>
              <div class="action-note">${icon('shield')}<span>${run.status === 'complete' ? 'Safely merged into main' : 'No real repositories are affected'}</span></div>
            </div>
          </section>

          <section class="panel teammate-panel" aria-label="AI teammate and GitHub Hub">
            <div class="hub-tabs" role="tablist" aria-label="Teammate panels">
              ${[
                ['codex', 'sparkle', 'Codex Teammate'],
                ['github', 'pr', 'GitHub Pull Requests'],
                ['actions', 'play', 'CI/CD Checks'],
              ]
                .map(
                  ([tab, glyph, label]) =>
                    `<button id="tab-${tab}" role="tab" aria-selected="${ui.tab === tab}" aria-controls="hub-content" tabindex="${ui.tab === tab ? 0 : -1}" class="hub-tab ${
                      ui.tab === tab ? 'active' : ''
                    }" data-tab="${tab}">${icon(glyph)}<span>${label}</span>${
                      tab === 'github' && run.prs.some(p => p.status !== 'merged') ? '<b>1</b>' : tab === 'actions' && run.checks === 'failed' ? '<i class="tab-alert"></i>' : ''
                    }</button>`
                )
                .join('')}
            </div>
            <div id="hub-content" class="hub-content" role="tabpanel" aria-labelledby="tab-${ui.tab}" tabindex="0">${hubContent()}</div>
            <div class="teammate-footer">
              <span>${icon('lock')}Browser simulation · no API keys needed</span>
              <button class="text-button" data-action="how-it-works">How it works ${icon('arrow')}</button>
            </div>
          </section>
        </div>

        <section class="learning-path" aria-labelledby="learning-title">
          <div class="learning-header">
            <div>
              <h2 id="learning-title">6 Interactive 2-Developer Missions</h2>
              <p>Click any mission to practice a specific multi-person Git &amp; GitHub workflow with Codex.</p>
            </div>
            <button class="text-button" data-action="badges">${icon('trophy')}Your achievements<span class="count-pill">${state.badges.length}/${LEVELS.length}</span></button>
          </div>
          <div class="level-cards">
            ${LEVELS.map(
              l =>
                `<button class="level-card ${l.id === level.id ? 'active' : ''} ${state.completed.includes(l.id) ? 'completed' : ''}" data-level="${l.id}" aria-label="Level ${l.id}: ${l.short}${
                  state.completed.includes(l.id) ? ', completed' : ''
                }">
                  <span class="level-card-number">${state.completed.includes(l.id) ? icon('check') : `0${l.id}`}</span>
                  <span class="level-card-content">
                    <span class="level-card-topic">${l.difficulty} <i>·</i> ${l.topic}</span>
                    <strong>${l.short}</strong>
                    <span class="level-card-time">${icon(state.completed.includes(l.id) ? 'circlecheck' : 'clock')}${state.completed.includes(l.id) ? 'Completed' : `${l.time} · +${l.xp} XP`}</span>
                  </span>
                  ${icon('arrow', 'level-card-arrow')}
                </button>`
            ).join('')}
          </div>
        </section>
        <footer class="page-footer">
          <span>${icon('branch')}BranchLab 2.0 <i>—</i> Learn 2-Developer Git Collaboration Solo.</span>
          <span>Made for learning. Built for collaboration.<span class="footer-dot"></span>v2.0</span>
        </footer>
      </main>
    </div>`;
  paintEditor();
  $('#app').dataset.level = String(level.id);
  $('#app').dataset.file = run.activeFile;
  if (focusSnapshot) {
    const input = document.getElementById(focusSnapshot.id);
    if (input.id === 'terminal-input') input.value = focusSnapshot.value;
    input.focus({ preventScroll: true });
    input.setSelectionRange(focusSnapshot.start, focusSnapshot.end);
    input.scrollTop = focusSnapshot.top;
    input.scrollLeft = focusSnapshot.left;
    if (input.id === 'code-input') {
      syncEditorScroll();
      updateCursor();
    }
  }
  if (menuFocusId && ui.levelMenuOpen) document.getElementById(menuFocusId)?.focus({ preventScroll: true });
  const terminalOutput = $('.terminal-output');
  if (terminalOutput) terminalOutput.scrollTop = terminalOutput.scrollHeight;
  const log = $('.ai-log');
  if (log) log.scrollTop = log.scrollHeight;
  updateSaveStatus();
}

function levelPicker(level) {
  return `<div class="level-picker"><button id="level-select" class="level-picker-trigger" type="button" data-action="toggle-level-menu" aria-label="Choose a level" aria-haspopup="menu" aria-expanded="${ui.levelMenuOpen}" aria-controls="level-menu"><span>Level ${level.id}: ${esc(level.short)}</span>${icon('down')}</button><div id="level-menu" class="level-menu" role="menu" aria-label="Training levels" ${
    ui.levelMenuOpen ? '' : 'hidden'
  }>${LEVELS.map(
    item =>
      `<button id="level-option-${item.id}" class="level-menu-option" type="button" role="menuitemradio" aria-checked="${item.id === level.id}" tabindex="-1" data-level="${item.id}"><span class="level-menu-number">${item.id}</span><span class="level-menu-label"><strong>${item.short}</strong><small>${item.difficulty} · ${item.topic}</small></span>${
        item.id === level.id ? icon('check') : state.completed.includes(item.id) ? icon('circlecheck') : ''
      }</button>`
  ).join('')}</div></div>`;
}

function setLevelMenuOpen(open, moveFocus = false) {
  ui.levelMenuOpen = open;
  const trigger = $('#level-select');
  const menu = $('#level-menu');
  if (!trigger || !menu) return;
  trigger.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  if (moveFocus) (open ? $(`#level-option-${state.currentLevel}`) : trigger)?.focus({ preventScroll: true });
}

function terminalContent(run) {
  const suggestions =
    run.conflict && !run.conflictResolved
      ? ['git pull origin main', 'git status', 'git add .']
      : run.needsRebase && !run.rebased
        ? ['git fetch', 'git rebase main', 'git log --oneline']
        : state.currentLevel === 6 && run.status === 'editing'
          ? ['git log --oneline', 'git revert HEAD', 'git status']
          : ['git status', 'git add .', 'git commit -m "Complete task A"', 'git push origin feature/user-task', 'help'];

  return `<section class="terminal ${ui.terminalVisible ? '' : 'collapsed'}" aria-label="Practice terminal">
    <div class="terminal-header">
      <button data-action="toggle-terminal" class="terminal-title" aria-expanded="${ui.terminalVisible}" aria-controls="terminal-body">${icon('terminal')}GIT TERMINAL<span class="terminal-count">CLI</span></button>
      <span class="terminal-hint">Click any command pill below or type directly</span>
      <button class="icon-button" data-action="clear-terminal" title="Clear terminal" aria-label="Clear terminal">${icon('reset')}</button>
    </div>
    <div id="terminal-body" class="terminal-body">
      <div class="terminal-output" role="log" aria-label="Terminal output" ${run.terminal.length ? '' : 'hidden'}>${run.terminal
    .slice(-80)
    .map(line => `<div class="terminal-line ${esc(line.type || '')}">${esc(line.text)}</div>`)
    .join('')}</div>
      <form id="terminal-form" class="terminal-prompt">
        <span aria-hidden="true">❯</span>
        <label class="sr-only" for="terminal-input">Terminal command</label>
        <input id="terminal-input" autocomplete="off" spellcheck="false" placeholder="Type a Git command (or click a pill below)…" aria-label="Terminal command">
        <kbd aria-hidden="true">↵</kbd>
      </form>
      <div class="terminal-help">
        ${suggestions.map(cmd => `<button type="button" data-action="terminal-suggestion" data-command="${esc(cmd)}" aria-label="Insert ${esc(cmd)} command"><code>${esc(cmd)}</code></button>`).join('')}
      </div>
    </div>
  </section>`;
}

function isReadOnly(run) {
  return (
    run.activeFile === 'pom.xml' ||
    (run.status !== 'editing' && !(run.conflict && !run.conflictResolved && run.activeFile === 'UserProfile.java')) ||
    (run.status === 'editing' && ['CartSteps.java', 'PaymentProcessorTest.java', 'SecurityConfig.java'].includes(run.activeFile))
  );
}

function objectiveChecks() {
  const run = getRun(state);
  const result = validateTask(state.currentLevel, run.files);
  return `<div class="objective-checklist">${result.results
    .slice(0, 3)
    .map(check => `<span class="${check.pass ? 'checked' : ''}">${icon(check.pass ? 'circlecheck' : 'dot')}${esc(check.label)}</span>`)
    .join('')}</div>`;
}

function localActions(run) {
  if (run.status === 'complete') {
    return `<button class="button primary" data-action="next-level">${icon('check')}${state.currentLevel === LEVELS.length ? 'View your achievements' : 'Continue to next level'}${icon('arrow')}</button>`;
  }
  if (run.conflict && !run.conflictResolved) {
    return `<button class="button amber" data-action="resolve">${icon('merge')}Mark conflict as resolved</button><button class="button subtle" data-action="conflict-help">Resolution guide</button>`;
  }
  if (run.needsRebase && !run.rebased) {
    return `<button class="button primary" data-action="rebase">${icon('branch')}Rebase onto main (git rebase main)</button>`;
  }
  if (run.status === 'editing') {
    return `<button class="button primary push-button" data-action="push">${icon('rocket')}<span>Complete &amp; Push Task A</span>${icon('arrow')}</button><button class="button secondary check-code" data-action="check-code">${icon('circlecheck')}<span>Check code</span></button>`;
  }
  return `<button class="button ${run.status === 'working' || run.status === 'revising' ? 'subtle' : 'primary'}" data-action="view-pr" ${
    run.status === 'working' || run.status === 'revising' ? 'disabled' : ''
  }>${icon(run.status === 'working' || run.status === 'revising' ? 'clock' : 'pr')}${
    run.status === 'working' ? 'Codex is working…' : run.status === 'revising' ? 'Codex is updating the PR…' : 'Review pull request'
  }${icon('arrow')}</button>`;
}

function hubContent() {
  return ui.tab === 'github' ? githubContent() : ui.tab === 'actions' ? actionsContent() : codexContent();
}

function codexContent() {
  const run = getRun(state);
  const level = LEVELS[state.currentLevel - 1];
  const working = ['working', 'revising'].includes(run.status);
  return `<div class="codex-identity">
      <div class="codex-avatar">${icon('sparkle')}</div>
      <div>
        <h3>Codex <span class="ai-label">DEVELOPER B · AI TEAMMATE</span></h3>
        <p><span class="${working ? 'pulsing ' : ''}green-dot"></span>${
    working ? 'Working on feature/codex-task' : run.status === 'complete' ? 'Another great merge, teammate.' : run.status === 'review' ? 'Ready for your review' : 'Waiting for you to push your branch'
  }</p>
      </div>
      <span class="online-pill"><span class="green-dot"></span>Online</span>
    </div>
    <div class="teammate-task">
      <div class="task-badge purple">B</div>
      <div>
        <div class="mini-label">CODEX’S ASSIGNED TASK ON <code>feature/codex-task</code></div>
        <p>${level.aiTask}</p>
        <span>${icon('java')}${level.aiFile}</span>
      </div>
    </div>
    ${
      run.status === 'editing'
        ? `<div class="codex-idle">
            <div class="collaboration-illustration" aria-hidden="true">
              <div class="illustration-grid"></div>
              <div class="illustration-code"><span></span><span></span><span></span><span></span><span></span></div>
              <div class="illustration-branch"><i></i><i></i><i></i><svg viewBox="0 0 130 60"><path d="M8 42h40c26 0 19-28 44-28h30"/><path d="M8 42h114"/></svg></div>
              <div class="illustration-spark">${icon('sparkle')}</div>
              <div class="illustration-check">${icon('check')}</div>
            </div>
            <h3>Your move, teammate!</h3>
            <p>Click <strong>⚡ 1-Click Fill Code</strong> on the left, then click <strong>Complete &amp; Push Task A</strong>.<br>Codex will immediately jump in on <code>feature/codex-task</code>!</p>
            <div class="waiting-chip"><span class="status-dot"></span>Waiting for your first push</div>
          </div>
          <div class="collaboration-note">${icon('book')}<p><strong>How 2-person collaboration works:</strong> You work on <code>feature/user-task</code>. Codex works on <code>feature/codex-task</code>. Neither of you pushes directly to <code>main</code>!</p></div>`
        : `<div class="activity-heading"><span>${icon('terminal')}CODEX LIVE GIT STREAM</span><span>${working ? '<i class="activity-live"></i> Working' : 'Task complete'}</span></div>
          <div class="ai-log" role="log" aria-label="Codex activity">${run.aiLines
            .map(
              (line, i) =>
                `<div class="ai-log-line"><span class="log-time">00:${String(i * 2).padStart(2, '0')}</span><span class="${/CONFLICT|failing|95.0|behind/.test(line) ? 'text-amber' : ''}">${
                  i === run.aiLines.length - 1 && working ? '<span class="typing-indicator"></span>' : '<span class="log-check">✓</span>'
                }${esc(line)}</span></div>`
            )
            .join('')}${working ? '<span class="typing-cursor"></span>' : ''}</div>
          ${
            run.aiCode
              ? `<div class="ai-code-heading">${icon('file')}${level.aiFile}<span>${working ? 'Writing…' : 'Updated'}</span></div><pre class="ai-code">${syntax(run.aiCode)}</pre>`
              : ''
          }
          <div class="activity-result ${working ? 'working' : ''}">
            ${icon(working ? 'clock' : run.status === 'complete' ? 'merge' : 'pr')}
            <div>
              <strong>${
                working
                  ? 'A little teamwork in progress…'
                  : run.status === 'complete'
                    ? 'Merged. On to the next challenge.'
                    : run.conflict && !run.conflictResolved
                      ? 'Two changes. One conflict to resolve.'
                      : run.needsRebase && !run.rebased
                        ? 'Main moved ahead! Time to rebase.'
                        : 'Your review makes the difference.'
              }</strong>
              <span>${
                working
                  ? 'Watch the live branch graph update as Codex works.'
                  : run.conflict && !run.conflictResolved
                    ? 'Use the Visual Conflict Resolver bar on the left editor.'
                    : run.needsRebase && !run.rebased
                      ? 'Run git rebase main to replay your commit onto main.'
                      : 'Open GitHub Pull Requests tab to inspect the diff and merge.'
              }</span>
            </div>
            ${!working ? '<button class="icon-button" data-action="view-pr" aria-label="Open pull request">' + icon('arrow') + '</button>' : ''}
          </div>`
    }`;
}

function prChanges(run, level, pr) {
  if (pr.id === 'user') {
    return {
      filename: level.filename,
      before: level.id === 2 && run.conflictResolved ? level.aiCode : level.files[level.filename],
      after: level.id === 2 && run.conflictResolved ? run.committedFiles[level.filename] : (run.taskAFiles || run.committedFiles)[level.filename],
    };
  }
  if (level.id === 1) {
    return {
      filename: level.aiFile,
      before: (run.taskAFiles || run.committedFiles)[level.aiFile],
      after: run.status === 'complete' ? run.mainFiles[level.aiFile] : integratedCalculator(run.committedFiles[level.aiFile]),
    };
  }
  return { filename: level.aiFile, before: level.files[level.aiFile] || '', after: run.aiCode };
}

function githubContent() {
  const run = getRun(state);
  const level = LEVELS[state.currentLevel - 1];
  if (!run.prs.length) {
    return emptyState('pr', 'Your first PR is one push away.', 'Complete Task A and push your code to open a pull request.', 'Back to the workspace', 'focus-editor');
  }
  const pr = run.prs.find(p => p.id === run.selectedPR) || run.prs[0];
  const change = prChanges(run, level, pr);
  const lines = diffLines(change.before, change.after);
  const add = lines.filter(l => l.type === 'add').length;
  const remove = lines.filter(l => l.type === 'remove').length;
  const canReview = run.status === 'review' && pr.status !== 'merged';
  const required = canReview && run.checks === 'passed' && (!run.conflict || run.conflictResolved) && (!run.needsRebase || run.rebased) && (level.id !== 3 || run.bddVerified);

  return `<div class="hub-section-heading"><h3>Pull requests</h3><span>${run.prs.filter(p => p.status !== 'merged').length} open <i>·</i> ${run.prs.filter(p => p.status === 'merged').length} merged</span></div>
    <div class="pr-list">${run.prs
      .map(
        p =>
          `<button class="pr-list-item ${pr.id === p.id ? 'selected' : ''}" data-pr="${p.id}">${icon(p.status === 'merged' ? 'merge' : 'pr')}<span><strong>${p.title}</strong><small>#${
            p.number
          } opened by ${p.author}${p.status === 'merged' ? ' · merged' : p.status === 'changes-requested' ? ' · changes requested' : ''}</small></span>${pr.id === p.id ? icon('chevron') : ''}</button>`
      )
      .join('')}</div>
    <div class="pr-heading"><span class="pr-status ${pr.status === 'merged' ? 'merged' : ''}">${icon(pr.status === 'merged' ? 'merge' : 'pr')}${
    pr.status === 'merged' ? 'Merged' : 'Open'
  }</span><span><code>${pr.branch}</code>${icon('arrow')}<code>main</code></span><span class="diff-count"><b>+${add}</b><i>−${remove}</i></span></div>
    ${
      run.conflict && !run.conflictResolved && pr.id === 'user'
        ? `<div class="notice amber-notice">${icon('warning')}<div><strong>This branch has conflicts with main</strong><p>Codex’s logging landed on main first. Combine your validation and Codex’s logging using the Visual Conflict Resolver bar on the left.</p><button class="text-button" data-action="focus-conflict">Resolve in your editor ${icon('arrow')}</button></div></div>`
        : ''
    }
    ${
      run.needsRebase && !run.rebased && pr.id === 'user'
        ? `<div class="notice amber-notice">${icon('branch')}<div><strong>This branch is 1 commit behind main</strong><p>Codex merged <code>SecurityConfig.java</code> into main while you worked. Rebase your branch onto main for a clean linear history.</p><button class="text-button" data-action="rebase">Run git rebase main now ${icon('arrow')}</button></div></div>`
        : ''
    }
    <div class="diff-viewer"><div class="diff-file-heading">${icon('file')}<span>${change.filename}</span><button class="icon-button" data-action="expand-diff" aria-label="${
    ui.diffExpanded ? 'Collapse' : 'Expand'
  } diff" title="${ui.diffExpanded ? 'Collapse' : 'Expand'} diff">${icon('external')}</button></div><div class="diff-lines ${
    ui.diffExpanded ? 'expanded' : ''
  }" tabindex="0" aria-label="Code diff">${lines
    .map(
      l =>
        `<div class="diff-line ${l.type}"><span class="diff-line-number">${l.old}</span><span class="diff-line-number">${l.new}</span><span class="diff-sign">${
          l.type === 'add' ? '+' : l.type === 'remove' ? '−' : ' '
        }</span><code>${esc(l.text) || ' '}</code></div>`
    )
    .join('')}</div></div>
    ${
      level.id === 3 && canReview
        ? `<div class="bdd-review"><div><strong>${icon('book')}Step definition review</strong><span>${
            run.bddVerified ? 'Verified · all parameters match' : 'Match each feature step with its expression'
          }</span></div><button class="button small-button ${run.bddVerified ? 'subtle' : 'secondary'}" data-action="bdd-review">${icon(run.bddVerified ? 'check' : 'code')}${
            run.bddVerified ? 'View mappings' : 'Verify steps'
          }</button></div>`
        : ''
    }
    ${
      run.feedback
        ? `<div class="review-comment"><span class="avatar small">Y</span><div><strong>Your review</strong><p>${esc(run.feedback)}</p>${
            run.revision ? '<small>Codex pushed a fix in response. Review the updated diff.</small>' : ''
          }</div></div>`
        : ''
    }
    <div class="pr-check-summary ${run.checks === 'failed' ? 'failed' : ''}"><span>${icon(
    run.checks === 'passed' ? 'circlecheck' : run.checks === 'failed' ? 'warning' : 'clock'
  )}${run.checks === 'passed' ? 'All checks passed' : run.checks === 'failed' ? 'Some checks need attention' : 'Checks waiting to run'}</span><button class="text-button" data-action="view-actions">View checks ${icon(
    'arrow'
  )}</button></div>
    ${
      canReview
        ? `<div class="review-actions"><button class="button ${pr.approved ? 'subtle' : 'secondary'}" data-action="approve" ${!required || pr.approved ? 'disabled' : ''}>${icon('check')}${
            pr.approved ? 'Approved' : 'Approve PR'
          }</button>${pr.id === 'codex' ? '<button class="button subtle" data-action="request-changes">Request changes</button>' : ''}<button class="button primary merge-button" data-action="merge" ${
            !pr.approved || !required ? 'disabled' : ''
          }>${icon('merge')}Merge pull request</button></div><p class="review-note">${
            run.checks === 'failed'
              ? 'Read the failed check, then request changes with your findings.'
              : run.conflict && !run.conflictResolved
                ? 'Resolve the conflict before approving this pull request.'
                : run.needsRebase && !run.rebased
                  ? 'Rebase your branch onto main before approving.'
                  : level.id === 3 && !run.bddVerified
                    ? 'Verify the Cucumber expressions before approving.'
                    : run.checks !== 'passed'
                      ? 'Run CI checks to unlock approval.'
                      : pr.approved
                        ? 'Approved and green. This branch is ready to merge.'
                        : 'Read the diff and approve when you’re happy with the changes.'
          }</p>`
        : pr.status === 'merged'
          ? `<div class="merged-notice">${icon('merge')}<span>${
              run.status === 'complete'
                ? 'Pull request successfully merged. Great teamwork!'
                : pr.id === 'user'
                  ? 'Codex reviewed and merged your task before starting Task B.'
                  : 'Codex’s update landed on main first.'
            }</span></div>${run.status === 'complete' ? '<button class="button primary full-width" data-action="next-level">Continue your journey ' + icon('arrow') + '</button>' : ''}`
          : '<p class="review-note">Codex is preparing the pull request. You can watch the live activity.</p>'
    }`;
}

function actionsContent() {
  const run = getRun(state);
  const checking = ui.checking.has(state.currentLevel);
  const canRun = ['review', 'complete'].includes(run.status);
  return `<div class="hub-section-heading"><div><h3>GitHub Actions</h3><p>Automated build, unit test, and branch integration checks.</p></div><span class="workflow-badge">${icon('play')}CI / Maven</span></div>
    <div class="workflow-overview"><div class="workflow-icon ${run.checks}">${icon(
    checking ? 'clock' : run.checks === 'passed' ? 'circlecheck' : run.checks === 'failed' ? 'warning' : 'play'
  )}</div><div><h3>${
    checking ? 'Running workflow…' : run.checks === 'passed' ? 'Looking good. All checks passed.' : run.checks === 'failed' ? 'A red check. A chance to learn.' : 'Let’s put your code to the test.'
  }</h3><p>${
    checking
      ? 'Checking source, tests, and branch integration.'
      : run.checks === 'failed'
        ? 'A failing assertion or branch sync issue is blocking the merge. Read the details below.'
        : 'Build, test, and verify before bringing changes into main.'
  }</p></div></div>
    <div class="workflow-meta"><span>${icon('branch')}${[2, 5, 6].includes(state.currentLevel) ? 'feature/user-task' : 'feature/codex-task'}</span><span>${icon(
    'file'
  )}java-ci.yml</span><span>Simulated runner</span></div>
    <div class="pipeline-diagram"><div class="pipeline-node ${canRun ? 'passed' : ''}">${icon('code')}<span>Checkout</span></div><span class="pipeline-link"></span><div class="pipeline-node ${
    run.checks === 'passed' ? 'passed' : ''
  }">${icon('settings')}<span>Build</span></div><span class="pipeline-link"></span><div class="pipeline-node ${
    run.checks === 'failed' ? 'failed' : run.checks === 'passed' ? 'passed' : ''
  }">${icon('check')}<span>Test</span></div><span class="pipeline-link"></span><div class="pipeline-node ${run.status === 'complete' ? 'passed' : ''}">${icon('merge')}<span>Merge</span></div></div>
    <div class="checks-list">${
      run.checkResults.length
        ? run.checkResults
            .map(
              check =>
                `<details class="check-result ${check.pass ? 'pass' : 'fail'}" ${check.pass ? '' : 'open'}><summary>${icon(check.pass ? 'circlecheck' : 'warning')}<span>${
                  check.label
                }</span><small>${check.pass ? 'Passed' : 'Failed'}</small>${icon('down')}</summary><pre>${esc(check.detail)}</pre></details>`
            )
            .join('')
        : `<div class="checks-placeholder">${icon('clock')}<p>${canRun ? 'The workflow is ready to run.' : 'Push Task A to start a workflow.'}</p><span>Build → unit tests → branch integration</span></div>`
    }</div>
    ${
      run.checks === 'failed' && state.currentLevel === 4 && !run.revision
        ? `<div class="notice amber-notice">${icon('sparkle')}<div><strong>Be the reviewer your teammate needs.</strong><p>The test expects 95 EUR, but the agreed rate produces 92 EUR. Request changes on Codex’s PR.</p><button class="text-button" data-action="request-changes">Request changes ${icon('arrow')}</button></div></div>`
        : ''
    }
    <div class="workflow-actions"><button class="button ${run.checks === 'failed' ? 'secondary' : 'primary'}" data-action="run-checks" ${!canRun || checking ? 'disabled' : ''}>${icon(
    checking ? 'clock' : 'play'
  )}${checking ? 'Running checks…' : run.checks === 'idle' ? 'Run workflow' : 'Re-run checks'}</button>${
    run.checks === 'passed' ? '<button class="button subtle" data-action="view-pr">Review pull request ' + icon('arrow') + '</button>' : ''
  }</div><div class="simulation-note">${icon('help')}Practice checks inspect Java source and scenario contracts in your browser. They do not compile Java or run Maven / Selenium.</div>`;
}

function emptyState(glyph, title, text, label, action) {
  return `<div class="empty-state"><span>${icon(glyph)}</span><h3>${title}</h3><p>${text}</p><button class="button secondary" data-action="${action}">${label}${icon('arrow')}</button></div>`;
}

function paintEditor() {
  const run = getRun(state);
  const code = run.files[run.activeFile];
  const input = $('#code-input');
  if (!input) return;
  if (input.value !== code) input.value = code;
  $('.line-number-list').innerHTML = Array.from({ length: code.split('\n').length }, (_, i) => `<span>${i + 1}</span>`).join('');
  syncEditorScroll();
}

function syncEditorScroll() {
  const input = $('#code-input');
  if (!input) return;
  $('.line-number-list').style.transform = `translateY(${-input.scrollTop}px)`;
}

function updateCursor() {
  const input = $('#code-input');
  const text = input.value.slice(0, input.selectionStart);
  const lines = text.split('\n');
  $('#cursor-position').textContent = `Ln ${lines.length}, Col ${lines.at(-1).length + 1}`;
}

function refreshHub() {
  const content = $('#hub-content');
  if (content) content.innerHTML = hubContent();
  const log = $('.ai-log');
  if (log) log.scrollTop = log.scrollHeight;
}

async function animateAI(id, revision = false) {
  const run = state.runs[id];
  const level = LEVELS[id - 1];
  const commands = revision ? FIX_COMMANDS : level.commands;
  if (ui.aiActive.get(id) === run) return;
  ui.aiActive.set(id, run);
  const release = () => {
    if (ui.aiActive.get(id) === run) ui.aiActive.delete(id);
  };
  if (revision) run.aiLines.push('── Review update ──');
  const codeLines = (revision ? level.aiFixed : level.aiCode).split('\n');
  run.aiCode = '';
  for (let i = 0; i < commands.length; i++) {
    if (state.runs[id] !== run) {
      release();
      return;
    }
    run.aiLines.push(commands[i]);
    const until = Math.ceil(codeLines.length * ((i + 1) / commands.length));
    for (let j = run.aiCode ? run.aiCode.split('\n').length : 0; j < until; j++) {
      run.aiCode = codeLines.slice(0, j + 1).join('\n');
      if (state.currentLevel === id && ui.tab === 'codex') refreshHub();
      await sleep(reducedMotion ? 1 : 22);
    }
    save();
    await sleep(reducedMotion ? 10 : 280);
  }
  if (state.runs[id] !== run) {
    release();
    return;
  }
  finishAI(state, id, revision);
  release();
  save(true);
  if (state.currentLevel === id) render();
  toast(revision ? 'Codex pushed a fix. Take another look at the PR.' : `Level ${id}: Codex’s work is ready for your review.`);
  await runWorkflow(id, true);
}

async function runWorkflow(id = state.currentLevel, automatic = false) {
  if (ui.checking.has(id)) return;
  ui.checking.add(id);
  if (id === state.currentLevel) refreshHub();
  await sleep(reducedMotion ? 50 : 750);
  try {
    const result = runChecks({ ...state, currentLevel: id });
    save(true);
    if (!automatic || result === 'failed') {
      toast(result === 'passed' ? 'All workflow checks passed. Ready for your review.' : 'The workflow found an issue. Check the Spotlight Coach or CI/CD Checks.', result === 'passed' ? 'success' : 'error');
    }
  } catch (error) {
    if (!automatic) toast(error.message, 'error');
  } finally {
    ui.checking.delete(id);
    if (id === state.currentLevel) render();
  }
}

function addTerminal(text, type = '') {
  const run = getRun(state);
  run.terminal.push({ text, type });
  run.terminal = run.terminal.slice(-120);
}

function showDialog(title, body, footer = '') {
  const modal = $('#modal');
  modal.innerHTML = `<div class="modal-heading"><div>${icon('branch')}<h2 id="modal-title">${title}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ''}`;
  if (!modal.open) modal.showModal();
}

function closeDialog() {
  $('#modal').close();
}

function showHint() {
  const level = LEVELS[state.currentLevel - 1];
  showDialog(
    'A little nudge in the right direction',
    `<div class="modal-eyebrow">MISSION ${level.id} · TASK A</div><p>${level.hint}</p><details class="solution-details"><summary>See an example solution</summary><pre class="solution-code">${syntax(
      level.solution
    )}</pre></details><p class="muted small-text">You can click "Insert example solution" below (or "⚡ 1-Click Fill Code" in the workspace) anytime so you can focus 100% on practicing Git &amp; GitHub!</p>`,
    `<button class="button subtle" data-action="close-modal">I’ll give it a try</button><button class="button secondary" data-action="insert-solution" ${
      getRun(state).status !== 'editing' ? 'disabled' : ''
    }>Insert example solution</button>`
  );
}

function showHelp() {
  showDialog(
    'How 2-Developer GitHub Collaboration Works',
    `<p class="modal-intro">Why is Git hard to learn alone? Because real Git workflows require <strong>two people working on different branches at the same time</strong>. Here is how you and Codex collaborate:</p>
    <div class="help-steps">
      ${[
        ['code', '1. Edit Your Feature Branch (or 1-Click Fill!)', 'You start on feature/user-task. Click "⚡ 1-Click Fill Code" to apply your code change immediately without getting stuck on Java syntax.'],
        ['terminal', '2. Stage, Commit & Push', 'Click "Complete & Push Task A" or run git add ., git commit, and git push in the terminal to open Pull Request #1.'],
        ['sparkle', '3. Codex Works in Parallel', 'Your AI teammate Codex works on feature/codex-task—merging, creating conflicts, updating main, or opening PRs for you to review.'],
        ['pr', '4. Resolve Conflicts, Rebase, Revert & Review', 'Follow the glowing Spotlight Coach banner at the top of the screen to resolve conflicts, rebase onto main, request PR changes, and pass CI!'],
        ['merge', '5. Merge to Main & Earn XP', 'Approve the Pull Request and merge into main to unlock all 6 collaboration badges.'],
      ]
        .map(([glyph, title, text]) => `<div><span>${icon(glyph)}</span><div><h3>${title}</h3><p>${text}</p></div></div>`)
        .join('')}
    </div>
    <div class="help-command">
      <strong>Supported Git Terminal Commands</strong>
      <code>git status · git add . · git commit -m "..." · git push origin feature/user-task</code>
      <code>git pull origin main · git fetch · git rebase main · git revert HEAD · git log --oneline</code>
    </div>`,
    '<button class="button primary" data-action="close-modal">Got it! Let’s collaborate ' + icon('arrow') + '</button>'
  );
}

function showBadges() {
  showDialog(
    'Your Git Collaboration Badges',
    `<p>Every mission teaches a real multi-person Git skill. Your XP (<strong>${state.xp || 0} XP</strong>) and badges are saved in your browser.</p><div class="badge-grid">${LEVELS.map(
      l =>
        `<div class="achievement ${state.badges.includes(l.badge) ? 'earned' : ''}"><div>${icon(l.badgeIcon)}</div><h3>${l.badge}</h3><p>${
          state.badges.includes(l.badge) ? `Earned · Mission ${l.id} (${l.topic})` : `Complete Mission ${l.id}: ${l.short}`
        }</p></div>`
    ).join('')}</div>`,
    '<button class="button primary" data-action="close-modal">Back to the workspace</button>'
  );
}

function conflictHelp() {
  showDialog(
    'Keep the best of both branches',
    `<p><strong>HEAD</strong> is your email validation. <strong>main</strong> contains Codex’s update logging and timeout handling. Combine them into one method.</p><ol class="plain-list"><li>Keep the new <code>updateEmail(String email, int timeoutMs)</code> signature.</li><li>Keep your email and timeout validation.</li><li>Keep Codex’s <code>System.out.println</code> logging.</li><li>Keep one class and one method. Delete all conflict marker lines.</li><li>Click <strong>Mark conflict as resolved</strong>, then re-run checks.</li></ol><details class="solution-details"><summary>See a combined example</summary><pre class="solution-code">${syntax(
      LEVELS[1].resolved
    )}</pre></details>`,
    '<button class="button subtle" data-action="close-modal">Resolve it myself</button><button class="button secondary" data-action="insert-resolution">Use combined example</button>'
  );
}

function showBDD() {
  const steps = featureSteps(getRun(state).committedFiles['shopping_cart.feature']);
  showDialog(
    'Match the words to the code',
    `<p>Cucumber expressions bind your feature text to Java methods. Quoted codes become <code>{string}</code>; numeric totals become <code>{double}</code>.</p><div class="step-mappings">${steps
      .map(
        step =>
          `<div><strong>${icon(step.pass ? 'circlecheck' : 'warning')}${esc(step.text)}</strong><code>${esc(step.definition)}</code><span>Parameter: <b>${esc(step.parameter)}</b></span></div>`
      )
      .join('')}</div><p class="muted small-text">These expressions are Cucumber’s parameter syntax. Selenium’s @Before and @After hooks create and close the driver.</p>`,
    '<button class="button subtle" data-action="close-modal">Keep reviewing</button><button class="button primary" data-action="confirm-bdd">' + icon('check') + 'Confirm step mappings</button>'
  );
}

function reviewDialog() {
  const level = LEVELS[state.currentLevel - 1];
  showDialog(
    'A helpful review moves the team forward',
    `<label class="field-label" for="review-feedback">What should Codex change?</label><textarea class="review-textarea" id="review-feedback" rows="4" placeholder="Describe the issue and the expected behavior…">${esc(
      level.id === 4 && !getRun(state).revision ? 'The EUR test expects 95.0, but our conversion rate is 0.92. Please update the expected result to 92.0 for 100 USD and re-run the checks.' : ''
    )}</textarea><p class="muted small-text">${
      level.id === 4 && !getRun(state).revision
        ? 'Codex will read this review and push a corrected test.'
        : 'Your comment is saved to the PR. In this template-based simulation, automatic revisions are available in level 4; you can approve after your review.'
    }</p>`,
    '<button class="button subtle" data-action="close-modal">Cancel</button><button class="button secondary" data-action="submit-review">Request changes ' + icon('arrow') + '</button>'
  );
}

function celebrate() {
  if (reducedMotion) return;
  const container = $('#confetti');
  container.innerHTML = Array.from(
    { length: 65 },
    (_, i) =>
      `<i style="--x:${Math.random() * 100}vw;--delay:${Math.random() * 0.5}s;--rotation:${Math.random() * 720}deg;--color:${
        ['#78e8ac', '#a78bfa', '#58a6ff', '#f5cf78'][i % 4]
      }"></i>`
  ).join('');
  setTimeout(() => container.replaceChildren(), 4000);
}

function changeLevel(id) {
  save(true);
  setLevel(state, id);
  ui.tab = 'codex';
  ui.diffExpanded = false;
  ui.levelMenuOpen = false;
  ui.selectedCommitHash = null;
  render();
  save(true);
}

function checkCode() {
  const result = validateTask(state.currentLevel, getRun(state).files);
  showDialog(
    result.pass ? 'Your task is ready to push.' : 'A few things to finish.',
    `<p>${
      result.pass ? 'Your implementation meets the practice checks. Stage, commit, and push to bring Codex into the workflow.' : 'Use this feedback to make your next edit, or click "Insert example solution".'
    }</p><div class="validation-list">${result.results
      .map(r => `<div class="${r.pass ? 'pass' : 'fail'}">${icon(r.pass ? 'circlecheck' : 'warning')}<div><strong>${r.label}</strong>${r.pass ? '' : `<p>${r.detail}</p>`}</div></div>`)
      .join('')}</div><p class="muted small-text">Browser source checks use a limited teaching subset of Java. No Java compiler or external service is used.</p>`,
    `<button class="button subtle" data-action="insert-solution" ${getRun(state).status !== 'editing' ? 'disabled' : ''}>⚡ Insert example solution</button><button class="button primary" data-action="close-modal">Back to the code ${icon('arrow')}</button>`
  );
}

function triggerPush(level) {
  completeAndPush(state);
  addTerminal('$ git add .', 'command');
  addTerminal(`$ git commit -m "Complete ${level.filename} task A"`, 'command');
  addTerminal('$ git push origin feature/user-task', 'command');
  addTerminal('Pull request #1 opened. Codex is taking a look.', 'success');
  ui.tab = 'codex';
  save(true);
  render();
  toast('Task A pushed (+40 XP)! Your teammate Codex is on it.');
  void animateAI(level.id);
}

document.addEventListener('click', async event => {
  if (ui.levelMenuOpen && !event.target.closest('.level-picker')) setLevelMenuOpen(false);
  const commitNode = event.target.closest('[data-commit]');
  if (commitNode) {
    ui.selectedCommitHash = commitNode.dataset.commit;
    render();
    return;
  }
  const tab = event.target.closest('[data-tab]');
  const file = event.target.closest('[data-file]');
  const levelButton = event.target.closest('[data-level]');
  const prButton = event.target.closest('[data-pr]');
  if (tab) {
    ui.tab = tab.dataset.tab;
    render();
    $(`#tab-${ui.tab}`).focus();
    return;
  }
  if (file) {
    getRun(state).activeFile = file.dataset.file;
    render();
    save();
    return;
  }
  if (levelButton) {
    const fromPicker = !!levelButton.closest('.level-picker');
    closeDialog();
    changeLevel(Number(levelButton.dataset.level));
    if (fromPicker) $('#level-select').focus({ preventScroll: true });
    return;
  }
  if (prButton) {
    getRun(state).selectedPR = prButton.dataset.pr;
    refreshHub();
    save();
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  event.preventDefault();
  let action = button.dataset.action;
  if (action === 'coach-cta') action = button.dataset.coachTarget;
  const run = getRun(state);
  const level = LEVELS[state.currentLevel - 1];
  try {
    switch (action) {
      case 'toggle-level-menu':
        setLevelMenuOpen(!ui.levelMenuOpen, true);
        break;
      case 'home':
      case 'workspace':
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
        break;
      case 'help':
        showHelp();
        break;
      case 'how-it-works':
        showDialog(
          'A real workflow. A safe sandbox.',
          '<p>BranchLab runs entirely in your browser. The Git engine tracks virtual branches, commits, pull requests, conflicts, rebases, reverts, and reviews. Codex’s code and activity use built-in templates with a typing animation.</p><p>CI checks inspect the example Java source and feature contracts. They don’t execute Java, Maven, Selenium, or an external language model.</p><p>Your work, level progress, XP, and badges are saved to this browser’s local storage. No GitHub account or API key is needed.</p>'
        );
        break;
      case 'badges':
        showBadges();
        break;
      case 'curriculum':
        showDialog(
          'Six Missions. Complete 2-Developer Mastery.',
          `<div class="curriculum-list">${LEVELS.map(
            l =>
              `<button data-level="${l.id}"><span class="level-card-number">0${l.id}</span><span><strong>${l.title} · <em style="color:#78e5ab;font-style:normal">${l.topic}</em></strong><small>${l.description}</small></span>${icon(
                state.completed.includes(l.id) ? 'circlecheck' : 'arrow'
              )}</button>`
          ).join('')}</div>`
        );
        break;
      case 'hint':
        showHint();
        break;
      case 'close-modal':
        closeDialog();
        break;
      case 'quick-fill':
      case 'insert-solution':
        setFile(state, level.filename, level.solution);
        run.activeFile = level.filename;
        closeDialog();
        render();
        save();
        toast('⚡ Code applied! Now click "Complete & Push" to send your branch to GitHub.');
        break;
      case 'conflict-keep-mine':
        setFile(state, level.filename, level.solution);
        render();
        save();
        toast('Kept only your validation—notice Codex’s logging is missing! Click "Combine Both" to keep both teammates’ work.', 'error');
        break;
      case 'conflict-keep-codex':
        setFile(state, level.filename, level.aiCode);
        render();
        save();
        toast('Kept only Codex’s logging—notice your email validation is missing! Click "Combine Both" to keep both teammates’ work.', 'error');
        break;
      case 'insert-resolution':
        setFile(state, level.filename, level.resolved);
        closeDialog();
        render();
        save();
        toast('✨ Both changes combined cleanly! Now click "Mark conflict as resolved".');
        break;
      case 'quick-resolve-conflict':
        setFile(state, level.filename, level.resolved);
        resolveConflict(state);
        save(true);
        ui.tab = 'github';
        render();
        toast('✨ Conflict resolved and committed (+50 XP)! Running CI checks next…');
        await runWorkflow();
        break;
      case 'conflict-help':
        conflictHelp();
        break;
      case 'check-code':
        checkCode();
        break;
      case 'push':
        triggerPush(level);
        break;
      case 'view-pr':
        ui.tab = 'github';
        render();
        break;
      case 'view-actions':
        ui.tab = 'actions';
        render();
        break;
      case 'run-checks':
        ui.tab = 'actions';
        render();
        await runWorkflow();
        break;
      case 'approve':
        ui.tab = 'github';
        approve(state);
        save(true);
        render();
        toast('Review approved (+30 XP)! Ready to merge into main.');
        break;
      case 'merge':
        ui.tab = 'github';
        merge(state);
        save(true);
        render();
        celebrate();
        toast(`Merged into main! Badge unlocked: ${level.badge} (+${level.xp} XP).`);
        break;
      case 'request-changes':
        ui.tab = 'github';
        render();
        reviewDialog();
        break;
      case 'submit-review': {
        const effect = requestChanges(state, $('#review-feedback').value);
        closeDialog();
        save(true);
        if (effect === 'reviseAI') ui.tab = 'codex';
        render();
        toast(effect === 'reviseAI' ? 'Changes requested (+40 XP). Codex is pushing a fix!' : 'Review comment saved to the pull request.');
        if (effect === 'reviseAI') void animateAI(level.id, true);
        break;
      }
      case 'resolve':
        resolveConflict(state);
        save(true);
        ui.tab = 'github';
        render();
        toast('Conflict resolved and committed (+50 XP). Re-run CI checks next.');
        break;
      case 'rebase':
        rebaseOntoMain(state);
        addTerminal('$ git rebase main', 'command');
        addTerminal('Successfully rebased feature/user-task onto main!', 'success');
        save(true);
        ui.tab = 'github';
        render();
        toast('🔀 Branch rebased cleanly onto main (+60 XP)! Re-running CI checks…');
        await runWorkflow();
        break;
      case 'focus-conflict':
        run.activeFile = level.filename;
        render();
        $('#code-input').focus();
        break;
      case 'focus-editor':
        $('#code-input').focus();
        break;
      case 'bdd-review':
        ui.tab = 'github';
        render();
        showBDD();
        break;
      case 'confirm-bdd':
        verifyBDD(state);
        closeDialog();
        save();
        render();
        toast('All feature steps match the Java definitions (+40 XP)!');
        break;
      case 'next-level':
        if (state.currentLevel === LEVELS.length) showBadges();
        else changeLevel(state.currentLevel + 1);
        break;
      case 'clear-terminal':
        run.terminal = [];
        render();
        save();
        break;
      case 'terminal-suggestion':
        $('#terminal-input').value = button.dataset.command;
        $('#terminal-input').focus();
        break;
      case 'toggle-terminal':
        ui.terminalVisible = !ui.terminalVisible;
        render();
        break;
      case 'expand-diff':
        ui.diffExpanded = !ui.diffExpanded;
        refreshHub();
        break;
      case 'file-info':
        showDialog(
          'A small project, a clear focus',
          `<p>This mission keeps the files you need in view. Your file is <code>${level.filename}</code>. Codex’s work appears in the review diff after you push.</p><p><code>pom.xml</code> is a read-only project fixture. This simulator doesn’t need Java installed.</p>`
        );
        break;
      case 'branches':
        showDialog(
          'Your virtual repository',
          `<div class="branch-list">${Object.entries(run.branches)
            .map(([branch, commits]) => `<div>${icon('branch')}<strong>${esc(branch)}</strong><span>${commits.length} commits${branch === run.branch ? ' · current' : ''}</span></div>`)
            .join('')}</div><h3 class="history-label">Commit history</h3><div class="history-list">${[...run.history]
            .reverse()
            .map(c => `<div><code>${c.hash}</code><span>${esc(c.message)}<small>${esc(c.author)} · ${esc(c.branch)}</small></span></div>`)
            .join('')}</div>`,
          '<button class="button subtle danger-text" data-action="confirm-reset">' + icon('reset') + 'Restart this level</button><button class="button secondary" data-action="close-modal">Keep going</button>'
        );
        break;
      case 'confirm-reset':
        showDialog(
          'Start this level fresh?',
          `<p>This clears the code, commits, and review state for level ${level.id}. Your earned badges, XP, and other levels stay saved.</p>`,
          '<button class="button subtle" data-action="close-modal">Cancel</button><button class="button secondary" data-action="reset-level">Restart level</button>'
        );
        break;
      case 'reset-level':
        state.runs[level.id] = newRun(level.id);
        ui.tab = 'codex';
        closeDialog();
        save(true);
        render();
        toast('Fresh branch. Ready for another try.');
        break;
    }
  } catch (error) {
    toast(error.message, 'error');
  }
});

document.addEventListener('input', event => {
  if (event.target.id !== 'code-input') return;
  try {
    const run = getRun(state);
    setFile(state, run.activeFile, event.target.value);
    paintEditor();
    updateCursor();
    $('#objective-checks').innerHTML = objectiveChecks();
    $('#editor-dirty').classList.toggle('hidden', run.files[run.activeFile] === run.committedFiles[run.activeFile]);
    save();
  } catch (error) {
    toast(error.message, 'error');
  }
});

document.addEventListener('scroll', event => {
  if (event.target.id === 'code-input') syncEditorScroll();
}, true);
document.addEventListener('keyup', event => {
  if (event.target.id === 'code-input') updateCursor();
});
document.addEventListener('click', event => {
  if (event.target.id === 'code-input') updateCursor();
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'terminal-form') return;
  event.preventDefault();
  const input = $('#terminal-input');
  const command = input.value.trim();
  if (!command) return;
  input.value = '';
  ui.terminalHistory.push(command);
  ui.historyIndex = ui.terminalHistory.length;
  addTerminal(`❯ ${command}`, 'command');
  try {
    const result = executeCommand(state, command);
    if (result.effect === 'clear') getRun(state).terminal = [];
    else result.lines.forEach(line => addTerminal(line, /^(FAIL|CONFLICT)/.test(line) ? 'error' : ''));
    if (result.effect === 'startAI') {
      ui.tab = 'codex';
      void animateAI(state.currentLevel);
    }
  } catch (error) {
    addTerminal(error.message, 'error');
  }
  save(true);
  render();
  $('#terminal-input').focus();
});

let escapeEditorTab = false;
document.addEventListener('keydown', event => {
  if (event.target.closest('.level-picker')) {
    if (event.key === 'Escape' && ui.levelMenuOpen) {
      event.preventDefault();
      setLevelMenuOpen(false, true);
      return;
    }
    if (event.key === 'Tab' && ui.levelMenuOpen) {
      setLevelMenuOpen(false, true);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const options = [...document.querySelectorAll('.level-menu-option')];
      const index = options.indexOf(document.activeElement);
      setLevelMenuOpen(true);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? options.length - 1
            : index < 0
              ? event.key === 'ArrowUp'
                ? options.length - 1
                : 0
              : (index + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length;
      options[next].focus();
      return;
    }
  }
  if (event.target.closest('[role="tablist"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const tabs = ['codex', 'github', 'actions'];
    const index = tabs.indexOf(ui.tab);
    ui.tab = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : tabs[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
    render();
    $(`#tab-${ui.tab}`).focus();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    save(true);
    toast(storageOK ? 'Workspace saved in this browser.' : 'Browser storage is unavailable. Keep this tab open.', storageOK ? 'success' : 'error');
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !$('#modal').open && getRun(state).status === 'editing') {
    event.preventDefault();
    $('[data-action="push"]').click();
  }
  if (event.target.id === 'code-input') {
    if (event.key === 'Escape') {
      escapeEditorTab = true;
      return;
    }
    if (event.key === 'Tab' && !event.target.readOnly && !escapeEditorTab && !event.shiftKey) {
      event.preventDefault();
      const input = event.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.setRangeText('    ', start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else escapeEditorTab = false;
  }
  if (event.target.id === 'terminal-input' && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    ui.historyIndex = Math.max(0, Math.min(ui.terminalHistory.length, ui.historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    event.target.value = ui.terminalHistory[ui.historyIndex] || '';
  }
});

$('#modal').addEventListener('click', event => {
  if (event.target === $('#modal')) {
    const bounds = $('#modal').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
  }
});

render();
if (!storageOK) toast('Browser storage is unavailable. Progress is kept for this session.', 'error');
