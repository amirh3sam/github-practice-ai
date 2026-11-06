import { LEVELS, integratedCalculator } from './curriculum.js';

export const STORAGE_KEY = 'branchlab.workspace.v1';
export const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clean = code => code.replace(/"(?:\\.|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, text => text.startsWith('"') ? text : '');

export function newRun(id) {
  const level = LEVELS[id - 1];
  const baseCommits = id === 6
    ? [
        { hash: 'a1b2c3d', message: 'Initial project setup', author: 'BranchLab', branch: 'main' },
        { hash: 'e8f9a12', message: 'Set MAX_RETRIES=0 in ReleaseConfig (BROKEN)', author: 'Codex', branch: 'main' },
      ]
    : [{ hash: 'a1b2c3d', message: 'Initial project setup', author: 'BranchLab', branch: 'main' }];
  const hashes = baseCommits.map(c => c.hash);
  return {
    files: clone(level.files),
    mainFiles: clone(level.files),
    committedFiles: clone(level.files),
    stagedFiles: null,
    branch: 'feature/user-task',
    branches: { main: [...hashes], 'feature/user-task': [...hashes], 'feature/codex-task': [...hashes] },
    history: baseCommits,
    status: 'editing',
    pushed: false,
    taskAFiles: null,
    prs: [],
    selectedPR: id === 2 || id === 5 || id === 6 ? 'user' : 'codex',
    aiLines: [],
    aiCode: '',
    revision: 0,
    checks: 'idle',
    checkResults: [],
    bddVerified: false,
    conflict: false,
    conflictResolved: false,
    needsRebase: false,
    rebased: false,
    reverted: false,
    review: '',
    feedback: '',
    terminal: [],
    activeFile: level.filename,
  };
}

export function createState() {
  return { version: 1, currentLevel: 1, runs: { 1: newRun(1) }, badges: [], completed: [], xp: 0 };
}

export function restoreState(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Number.isInteger(data.currentLevel) || !LEVELS[data.currentLevel - 1] || !data.runs || !Array.isArray(data.badges) || !Array.isArray(data.completed)) return createState();
    const restored = createState();
    restored.currentLevel = data.currentLevel;
    restored.badges = data.badges.filter(b => LEVELS.some(l => l.badge === b));
    restored.completed = data.completed.filter(id => Number.isInteger(id) && LEVELS[id - 1]);
    restored.xp = Number.isInteger(data.xp) && data.xp >= 0 ? data.xp : restored.completed.reduce((sum, id) => sum + (LEVELS[id - 1]?.xp || 100), 0);
    restored.runs = {};
    for (const level of LEVELS) {
      const saved = data.runs[level.id];
      if (!saved) continue;
      const validFiles = object => object && typeof object === 'object' && Object.keys(level.files).every(name => typeof object[name] === 'string' && object[name].length < 200000);
      if (!validFiles(saved.files) || !validFiles(saved.mainFiles) || !validFiles(saved.committedFiles) || !['editing', 'working', 'review', 'revising', 'complete'].includes(saved.status) || !Array.isArray(saved.prs) || !Array.isArray(saved.history) || !Array.isArray(saved.terminal) || !Array.isArray(saved.aiLines)) continue;
      restored.runs[level.id] = { ...newRun(level.id), ...saved };
      const run = restored.runs[level.id];
      run.terminal = run.terminal.filter(line => !(line.type === 'muted' && line.text === 'Welcome to your local workspace. Your branch is ready.'));
      run.activeFile = Object.hasOwn(level.files, run.activeFile) ? run.activeFile : level.filename;
      if (run.status === 'working' || run.status === 'revising') finishAI(restored, level.id, run.status === 'revising');
    }
    if (!restored.runs[restored.currentLevel]) restored.runs[restored.currentLevel] = newRun(restored.currentLevel);
    return restored;
  } catch {
    return createState();
  }
}

export function getRun(state) {
  return state.runs[state.currentLevel];
}

export function setLevel(state, id) {
  if (!Number.isInteger(id) || !LEVELS[id - 1]) throw new Error(`Choose a level from 1 to ${LEVELS.length}.`);
  state.currentLevel = id;
  state.runs[id] ||= newRun(id);
}

export function setFile(state, name, value) {
  const run = getRun(state);
  if (!Object.hasOwn(run.files, name)) throw new Error('This file is not part of this level.');
  if (run.status !== 'editing' && !(run.conflict && !run.conflictResolved && name === LEVELS[state.currentLevel - 1].filename)) {
    throw new Error('This branch is read-only after push. Restart the level to try another implementation.');
  }
  run.files[name] = value;
}

export function methodBody(code, name) {
  const source = clean(code);
  const start = source.search(new RegExp('(?:public|private|protected)\\s+(?:static\\s+)?\\w+\\s+' + name + '\\s*\\('));
  if (start < 0) return '';
  const open = source.indexOf('{', start);
  if (open < 0) return '';
  let depth = 1;
  for (let i = open + 1; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  return '';
}

export function arithmetic(expression, variables) {
  const tokens = expression.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|[()+*/-]/g) || [];
  if (tokens.join('') !== expression.replace(/\s/g, '')) throw new Error('Unsupported arithmetic');
  let cursor = 0;
  const atom = () => {
    const token = tokens[cursor++];
    if (token === '-') return -atom();
    if (token === '+') return atom();
    if (token === '(') {
      const value = sum();
      if (tokens[cursor++] !== ')') throw new Error('Unclosed expression');
      return value;
    }
    if (/^\d/.test(token || '')) return Number(token);
    if (Object.hasOwn(variables, token)) return variables[token];
    throw new Error('Unknown variable');
  };
  const product = () => {
    let value = atom();
    while (tokens[cursor] === '*' || tokens[cursor] === '/') {
      const operator = tokens[cursor++];
      const next = atom();
      value = operator === '*' ? value * next : value / next;
    }
    return value;
  };
  const sum = () => {
    let value = product();
    while (tokens[cursor] === '+' || tokens[cursor] === '-') {
      const operator = tokens[cursor++];
      const next = product();
      value = operator === '+' ? value + next : value - next;
    }
    return value;
  };
  const result = sum();
  if (cursor !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid arithmetic');
  return result;
}

function mathMethod(code, method, operation) {
  const body = methodBody(code, method);
  try {
    return [[4, 2], [-3, 5], [2.5, 0.75], [0, -4]].every(([a, b]) => {
      const vars = { a, b };
      let rest = body.trim();
      while (/^(?:double|float|var)\s+/.test(rest)) {
        const assignment = rest.match(/^(?:double|float|var)\s+(\w+)\s*=\s*([^;]+);/);
        if (!assignment) return false;
        vars[assignment[1]] = arithmetic(assignment[2], vars);
        rest = rest.slice(assignment[0].length).trim();
      }
      const statement = rest.match(/^return\s+([^;]+);\s*$/);
      return !!statement && Math.abs(arithmetic(statement[1], vars) - operation(a, b)) < 0.00001;
    });
  } catch {
    return false;
  }
}

export function featureSteps(source) {
  return source
    .split('\n')
    .filter(line => /^\s*(Given|When|Then|And|But)\s/.test(line))
    .map(line => {
      const text = line.trim();
      const match = text.match(/^When user applies discount code "(SAVE10|SAVE20)"$/) || text.match(/^Then the cart total should be (\d+(?:\.\d+)?)$/);
      const pass = text === 'Given user has items in cart' || !!match;
      return {
        text,
        pass,
        parameter: match?.[1] || 'no parameters',
        definition: text.startsWith('Given') ? '@Given("user has items in cart")' : text.startsWith('When') ? '@When("user applies discount code {string}")' : '@Then("the cart total should be {double}")',
      };
    });
}

export function validateTask(id, files) {
  const level = LEVELS[id - 1];
  const code = clean(files[level.filename] || '');
  const check = (label, pass, detail) => ({ label, pass: !!pass, detail });
  let results;
  if (id === 1) {
    results = [
      check('add() returns the sum', mathMethod(code, 'add', (a, b) => a + b), 'Use return a + b; inside add().'),
      check('subtract() returns the difference', mathMethod(code, 'subtract', (a, b) => a - b), 'Use return a - b; inside subtract().'),
    ];
  }
  if (id === 2) {
    const body = methodBody(code, 'updateEmail');
    const emailGuard = /if\s*\(\s*email\s*==\s*null\s*\|\|\s*!email\.contains\("@"\)\s*\)\s*\{?\s*throw new IllegalArgumentException\(/.test(body);
    const timeoutGuard = /if\s*\(\s*timeoutMs\s*<=\s*0\s*\)\s*\{?\s*throw new IllegalArgumentException\(/.test(body);
    results = [
      check('Method accepts email and timeoutMs', /void\s+updateEmail\s*\(\s*String\s+email\s*,\s*int\s+timeoutMs\s*\)/.test(code), 'Use updateEmail(String email, int timeoutMs).'),
      check('Email validation and assignment are present', emailGuard && /this\.email\s*=\s*email\s*;/.test(body), 'Reject null or missing @ before assigning this.email = email;.'),
      check('Non-positive timeouts are rejected', timeoutGuard, 'Guard timeoutMs <= 0 with IllegalArgumentException.'),
    ];
  }
  if (id === 3) {
    const scenarios = code.split(/^\s*Scenario\s*:/m).slice(1);
    const valid =
      scenarios.length >= 1 &&
      scenarios.every(s => {
        const lines = s.split('\n').map(x => x.trim()).filter(x => /^(Given|When|Then|And|But)\b/.test(x));
        const discount = lines[1]?.match(/^When user applies discount code "(SAVE10|SAVE20)"$/)?.[1];
        const total = Number(lines[2]?.match(/^Then the cart total should be (\d+(?:\.\d+)?)$/)?.[1]);
        return lines.length === 3 && lines[0] === 'Given user has items in cart' && !!discount && total === (discount === 'SAVE10' ? 90 : 80);
      });
    results = [
      check('A named feature and complete scenarios', /^\s*Feature:\s*\S/m.test(code) && scenarios.length >= 1 && featureSteps(code).length >= 3, 'Add a Feature, Scenario, and Given / When / Then steps.'),
      check('Discount codes and totals match the contract', valid, 'Use the exact step wording from the hint: SAVE10 → 90.0, SAVE20 → 80.0.'),
    ];
  }
  if (id === 4) {
    const body = methodBody(code, 'processTransaction');
    const conversion = (currency, expected) => {
      const returnValue = body.match(new RegExp('if\\s*\\(\\s*"' + currency + '"\\.equals\\(currency\\)\\s*\\)\\s*(?:\\{\\s*)?return\\s+([^;]+);'))?.[1];
      try {
        return returnValue && [1.25, 37, 100, 1000].every(amount => Math.abs(arithmetic(returnValue, { amount }) - (amount * expected) / 100) < 0.00001);
      } catch {
        return false;
      }
    };
    results = [
      check('Method accepts amount and currency', /processTransaction\s*\(\s*double\s+amount\s*,\s*String\s+currency\s*\)/.test(code), 'Use processTransaction(double amount, String currency).'),
      check('USD, EUR, and GBP rates are correct', conversion('USD', 100) && conversion('EUR', 92) && conversion('GBP', 79), 'Use the example if-return style: USD × 1, EUR × 0.92, GBP × 0.79.'),
      check('Invalid amounts and currencies are rejected', /if\s*\(\s*amount\s*<=\s*0\s*\)\s*\{?\s*throw new IllegalArgumentException\(/.test(body) && /throw new IllegalArgumentException\("Unsupported currency"\);\s*$/.test(body.trim()), 'Reject amount <= 0 first; end with throw new IllegalArgumentException("Unsupported currency");.'),
    ];
  }
  if (id === 5) {
    const body = methodBody(code, 'issueToken');
    results = [
      check('Rejects null or blank userId', /if\s*\(\s*userId\s*==\s*null\s*\|\|\s*userId\.isBlank\(\)\s*\)\s*\{?\s*throw new IllegalArgumentException\(/.test(body), 'Check if (userId == null || userId.isBlank()) and throw IllegalArgumentException.'),
      check('Returns "token:" + userId', /return\s+"token:"\s*\+\s*userId\s*;/.test(body), 'Return "token:" + userId; from issueToken().'),
    ];
  }
  if (id === 6) {
    results = [
      check('MAX_RETRIES restored to 3', /MAX_RETRIES\s*=\s*3\s*;/.test(code), 'Restore public static final int MAX_RETRIES = 3;'),
      check('PRODUCTION_READY restored to true', /PRODUCTION_READY\s*=\s*true\s*;/.test(code), 'Restore public static final boolean PRODUCTION_READY = true;'),
    ];
  }
  const noConflict = !/^(<<<<<<<|=======|>>>>>>>)/m.test(files[level.filename] || '');
  if (!noConflict) results.push(check('All conflict markers are removed', false, 'Remove <<<<<<<, =======, and >>>>>>> after combining the changes.'));
  return { pass: results.every(result => result.pass), results };
}

export function stageFiles(state) {
  const run = getRun(state);
  if (run.status !== 'editing') throw new Error('This task has already been pushed.');
  run.stagedFiles = clone(run.files);
}

function recordCommit(run, message, author, branch) {
  const hash = (0xc0de100 + run.history.length * 9371).toString(16).slice(-7);
  run.history.push({ hash, message, author, branch });
  run.branches[branch] ||= [];
  run.branches[branch].push(hash);
  return hash;
}

export function commit(state, message) {
  const run = getRun(state);
  if (run.status !== 'editing') throw new Error('This task has already been pushed.');
  if (!message?.trim()) throw new Error('Add a commit message: git commit -m "Implement task A"');
  if (!run.stagedFiles || same(run.stagedFiles, run.committedFiles)) throw new Error('No changes staged. Edit your code, then run git add .');
  run.committedFiles = clone(run.stagedFiles);
  run.stagedFiles = null;
  state.xp = (state.xp || 0) + 15;
  return recordCommit(run, message.trim(), 'You', run.branch);
}

export function push(state, branch = 'feature/user-task') {
  const run = getRun(state);
  if (run.status !== 'editing') throw new Error('Your task is already on the remote. Visit GitHub Hub for the next step.');
  if (branch !== run.branch || branch !== 'feature/user-task') throw new Error('Push your task branch with git push origin feature/user-task.');
  if (run.history.filter(c => c.author === 'You').length === 0) throw new Error('Commit your code before pushing.');
  if (!same(run.files, run.committedFiles)) throw new Error('You have uncommitted edits. Stage and commit your latest code first.');
  const validation = validateTask(state.currentLevel, run.committedFiles);
  if (!validation.pass) throw new Error(validation.results.find(r => !r.pass).detail);
  run.status = 'working';
  run.pushed = true;
  run.taskAFiles = clone(run.committedFiles);
  run.prs = [{ id: 'user', number: 1, title: LEVELS[state.currentLevel - 1].task, author: 'You', branch: 'feature/user-task', status: 'open', approved: false }];
  run.aiLines = [];
  run.aiCode = '';
  state.xp = (state.xp || 0) + 25;
  return 'startAI';
}

export function completeAndPush(state) {
  const run = getRun(state);
  const result = validateTask(state.currentLevel, run.files);
  if (!result.pass) throw new Error(result.results.find(r => !r.pass).detail);
  stageFiles(state);
  if (!same(run.stagedFiles, run.committedFiles)) commit(state, `Complete ${LEVELS[state.currentLevel - 1].filename} task A`);
  return push(state);
}

export function finishAI(state, id = state.currentLevel, revision = false) {
  const run = state.runs[id];
  const level = LEVELS[id - 1];
  if (revision) {
    run.aiCode = level.aiFixed || level.aiCode;
    const pr = run.prs.find(p => p.id === 'codex');
    if (pr) {
      pr.status = 'open';
      pr.approved = false;
    }
    recordCommit(run, 'Fix EUR conversion test expectation', 'Codex', 'feature/codex-task');
    run.revision = 1;
  } else {
    if (!run.prs.some(p => p.id === 'user')) return;
    run.aiCode = level.aiCode;
    recordCommit(run, level.aiTitle, 'Codex', 'feature/codex-task');
    const userPR = run.prs.find(p => p.id === 'user');
    if (id === 2) {
      run.prs.push({ id: 'codex', number: 2, title: level.aiTitle, author: 'Codex', branch: 'feature/codex-task', status: 'merged', approved: true });
      run.mainFiles[level.filename] = level.aiCode;
      run.conflict = true;
      run.files[level.filename] = '<<<<<<< HEAD (your feature/user-task)\n' + run.committedFiles[level.filename] + '\n=======\n' + level.aiCode + '\n>>>>>>> main (Codex update)';
      run.selectedPR = 'user';
      recordCommit(run, 'Merge Codex logging update into main', 'Codex', 'main');
    } else if (id === 5) {
      run.prs.push({ id: 'codex', number: 2, title: level.aiTitle, author: 'Codex', branch: 'feature/codex-task', status: 'merged', approved: true });
      run.mainFiles[level.aiFile] = level.aiCode;
      run.needsRebase = true;
      run.rebased = false;
      run.selectedPR = 'user';
      recordCommit(run, 'Merge SecurityConfig into main', 'Codex', 'main');
    } else if (id === 6) {
      run.prs.push({ id: 'codex', number: 2, title: level.aiTitle, author: 'Codex', branch: 'feature/codex-task', status: 'merged', approved: true });
      run.selectedPR = 'user';
    } else {
      run.prs.push({ id: 'codex', number: 2, title: level.aiTitle, author: 'Codex', branch: 'feature/codex-task', status: 'open', approved: false });
      userPR.status = 'merged';
      userPR.approved = true;
      run.mainFiles = clone(run.committedFiles);
      recordCommit(run, 'Merge task A after Codex review', 'Codex', 'main');
      run.selectedPR = 'codex';
    }
  }
  run.status = 'review';
  run.checks = 'idle';
  run.review = '';
}

export function resolveConflict(state) {
  const run = getRun(state);
  if (!run.conflict || run.conflictResolved) throw new Error('There is no unresolved conflict.');
  const code = run.files[LEVELS[state.currentLevel - 1].filename];
  const result = validateTask(2, run.files);
  if (!result.pass) throw new Error(result.results.find(r => !r.pass).detail);
  if (!/System\.out\.println\(/.test(clean(code))) throw new Error('Keep Codex’s logging as well as your input validation.');
  run.conflictResolved = true;
  run.committedFiles = clone(run.files);
  run.checks = 'idle';
  state.xp = (state.xp || 0) + 50;
  recordCommit(run, 'Resolve profile update merge conflict', 'You', 'feature/user-task');
}

export function rebaseOntoMain(state) {
  const run = getRun(state);
  if (!run.needsRebase || run.rebased) throw new Error('This branch does not need rebasing right now.');
  const level = LEVELS[state.currentLevel - 1];
  run.files[level.aiFile] = level.aiCode;
  run.committedFiles[level.aiFile] = level.aiCode;
  run.rebased = true;
  run.checks = 'idle';
  const mainCommits = run.branches.main || [];
  const userOnly = (run.branches['feature/user-task'] || []).filter(h => !mainCommits.includes(h));
  run.branches['feature/user-task'] = [...mainCommits, ...userOnly];
  state.xp = (state.xp || 0) + 60;
  recordCommit(run, 'Rebase feature/user-task onto main', 'You', 'feature/user-task');
}

export function runChecks(state) {
  const run = getRun(state);
  if (run.status !== 'review' && run.status !== 'complete') throw new Error('Push your code and wait for Codex before running the integration workflow.');
  const base = validateTask(state.currentLevel, run.committedFiles);
  const branchClean = (!run.conflict || run.conflictResolved) && (!run.needsRebase || run.rebased);
  const branchDetail = run.conflict && !run.conflictResolved
    ? 'Resolve the conflict in UserProfile.java.'
    : run.needsRebase && !run.rebased
      ? 'Branch is behind main. Run "git rebase main" (or click Rebase onto Main) to replay your commit.'
      : 'No unresolved merge conflicts and branch history is up to date.';
  const checks = [
    { label: 'Build & source validation', pass: base.pass, detail: base.pass ? 'Task A meets the level contract.' : base.results.find(r => !r.pass).detail },
    { label: state.currentLevel === 3 ? 'Cucumber scenario checks' : 'Unit test checks', pass: true, detail: state.currentLevel === 3 ? 'Discount scenarios match the sample cart contract.' : 'All expected results match.' },
    { label: 'Branch integration', pass: branchClean, detail: branchDetail },
  ];
  if (state.currentLevel === 4 && run.revision === 0) {
    checks[1] = {
      label: 'PaymentProcessorTest.convertsUsdToEur',
      pass: false,
      detail: 'AssertionFailedError: expected <95.0> but was <92.0>\n100 USD × 0.92 = 92 EUR. Request changes to fix Codex’s expected value.',
    };
  }
  run.checkResults = checks;
  run.checks = checks.every(c => c.pass) ? 'passed' : 'failed';
  return run.checks;
}

export function verifyBDD(state) {
  const run = getRun(state);
  if (state.currentLevel !== 3 || run.status !== 'review') throw new Error('Step verification is available in level 3 during review.');
  const result = validateTask(3, run.committedFiles);
  if (!result.pass || !featureSteps(run.committedFiles['shopping_cart.feature']).every(step => step.pass)) throw new Error('The feature steps do not match the Cucumber expressions.');
  run.bddVerified = true;
  state.xp = (state.xp || 0) + 40;
}

export function requestChanges(state, feedback) {
  const run = getRun(state);
  if (run.status !== 'review') throw new Error('Wait for Codex to open a pull request.');
  const pr = run.prs.find(p => p.id === 'codex');
  if (!pr || pr.status === 'merged') throw new Error('Codex’s PR has already merged. Resolve and review your open PR.');
  if (!feedback?.trim()) throw new Error('Write a review comment explaining what should change.');
  pr.status = 'changes-requested';
  pr.approved = false;
  run.feedback = feedback.trim();
  run.review = 'changes-requested';
  state.xp = (state.xp || 0) + 40;
  if (state.currentLevel === 4 && run.revision === 0) {
    run.status = 'revising';
    run.checks = 'idle';
    return 'reviseAI';
  }
  return 'comment';
}

export function approve(state) {
  const run = getRun(state);
  if (run.status !== 'review') throw new Error('There is no pull request ready for review.');
  const pr = run.prs.find(p => p.id === run.selectedPR);
  if (!pr || pr.status === 'merged') throw new Error('Select the open pull request to review.');
  if (run.conflict && !run.conflictResolved) throw new Error('Resolve the merge conflict first.');
  if (run.needsRebase && !run.rebased) throw new Error('Rebase your branch onto main first.');
  if (run.checks !== 'passed') throw new Error('All CI checks must pass before approval.');
  if (state.currentLevel === 3 && !run.bddVerified) throw new Error('Verify the Cucumber step mappings before approving.');
  if (state.currentLevel === 4 && run.revision === 0) throw new Error('Request changes so Codex fixes the EUR assertion.');
  pr.approved = true;
  pr.status = 'open';
  run.review = 'approved';
  state.xp = (state.xp || 0) + 30;
}

export function merge(state) {
  const run = getRun(state);
  const pr = run.prs.find(p => p.id === run.selectedPR);
  if (
    run.status !== 'review' ||
    !pr?.approved ||
    pr.status !== 'open' ||
    run.checks !== 'passed' ||
    (run.conflict && !run.conflictResolved) ||
    (run.needsRebase && !run.rebased) ||
    (state.currentLevel === 3 && !run.bddVerified)
  ) {
    throw new Error('Approve the open PR and pass all required checks before merging.');
  }
  const level = LEVELS[state.currentLevel - 1];
  pr.status = 'merged';
  run.mainFiles = clone(run.committedFiles);
  if (state.currentLevel === 1) run.mainFiles[level.filename] = integratedCalculator(run.committedFiles[level.filename]);
  if (state.currentLevel === 3 || state.currentLevel === 4 || state.currentLevel === 5) run.mainFiles[level.aiFile] = run.aiCode;
  recordCommit(run, `Merge pull request #${pr.number}: ${pr.title}`, 'You', 'main');
  run.files = clone(run.mainFiles);
  run.committedFiles = clone(run.mainFiles);
  run.stagedFiles = null;
  run.status = 'complete';
  run.branch = 'main';
  if (!state.completed.includes(level.id)) {
    state.completed.push(level.id);
    state.xp = (state.xp || 0) + (level.xp || 100);
  }
  if (!state.badges.includes(level.badge)) state.badges.push(level.badge);
}

export function stepFor(run) {
  if (run.status === 'complete') return 5;
  if (run.status === 'working' || run.status === 'revising') return 3;
  if (run.status === 'review') return run.review === 'approved' ? 5 : 4;
  return run.history.some(c => c.author === 'You') || run.stagedFiles ? 2 : 1;
}

export function coachGuide(state) {
  const run = getRun(state);
  const level = LEVELS[state.currentLevel - 1];
  const validation = validateTask(state.currentLevel, run.files);

  if (run.status === 'editing') {
    if (!validation.pass) {
      return {
        stepBadge: 'STEP 1 OF 4 · YOUR LOCAL BRANCH',
        title: level.id === 6 ? 'Undo Codex’s broken commit on your branch' : `Complete your part in ${level.filename}`,
        message: level.id === 6
          ? 'Codex merged a broken config (MAX_RETRIES = 0) into main! Click "⚡ 1-Click Fill Code" (or type "git revert HEAD" in the terminal) to restore the safe settings.'
          : 'You are on branch feature/user-task. Don’t want to type Java by hand? Click "⚡ 1-Click Fill Code" to apply the code change instantly so you can focus on Git!',
        ctaLabel: level.id === 6 ? '⚡ Revert Broken Config (1-Click)' : '⚡ 1-Click Fill Code',
        ctaAction: 'quick-fill',
        cliCommand: level.id === 6 ? 'git revert HEAD' : 'git status',
      };
    }
    return {
      stepBadge: 'STEP 2 OF 4 · STAGE, COMMIT & PUSH',
      title: 'Your code is ready! Push your branch to GitHub',
      message: 'Now share your branch with Codex. Click "🚀 Complete & Push Task A" below, or run git add ., git commit, and git push in the terminal.',
      ctaLabel: '🚀 Complete & Push Branch',
      ctaAction: 'push',
      cliCommand: 'git add .',
    };
  }

  if (run.status === 'working' || run.status === 'revising') {
    return {
      stepBadge: 'STEP 3 OF 4 · TEAMMATE WORKING',
      title: 'Codex is working on the repository…',
      message: 'Watch the live branch graph and Codex’s terminal as your AI teammate commits and opens a Pull Request.',
      ctaLabel: 'Watching Codex…',
      ctaAction: '',
      cliCommand: 'git log --oneline',
    };
  }

  if (run.status === 'review') {
    if (run.conflict && !run.conflictResolved) {
      return {
        stepBadge: 'STEP 4 OF 5 · MERGE CONFLICT ALERT!',
        title: 'You and Codex edited the same lines in UserProfile.java!',
        message: 'Codex merged to main first, creating conflict markers (<<<<<<< HEAD). Use the Visual Conflict Resolver bar to combine both changes, then click "Mark conflict as resolved".',
        ctaLabel: '✨ Combine Both & Resolve Conflict',
        ctaAction: 'quick-resolve-conflict',
        cliCommand: 'git pull origin main',
      };
    }
    if (run.needsRebase && !run.rebased) {
      return {
        stepBadge: 'STEP 4 OF 5 · BRANCH OUT OF SYNC (REBASE)',
        title: 'Codex updated main while you were working!',
        message: 'Your feature/user-task branch is behind main. Replay your commit cleanly on top of Codex’s new main commit using git rebase main.',
        ctaLabel: '🔀 Rebase onto Main Now',
        ctaAction: 'rebase',
        cliCommand: 'git rebase main',
      };
    }
    if (state.currentLevel === 4 && run.revision === 0) {
      return {
        stepBadge: 'STEP 4 OF 5 · CI PIPELINE FAILED',
        title: 'Codex’s PR broke the unit tests! Request Changes',
        message: 'Codex wrote 95.0 instead of 92.0 in the EUR test. Open "Request Changes" to tell Codex to fix the bug on feature/codex-task.',
        ctaLabel: '💬 Request Changes from Codex',
        ctaAction: 'request-changes',
        cliCommand: 'mvn test',
      };
    }
    if (run.checks !== 'passed') {
      return {
        stepBadge: 'STEP 4 OF 5 · RUN CI CHECKS',
        title: 'Run GitHub Actions CI to verify the branch',
        message: 'Before approving a Pull Request, teams verify that all automated build and integration checks pass.',
        ctaLabel: '▶️ Run CI Checks',
        ctaAction: 'run-checks',
        cliCommand: 'mvn test',
      };
    }
    if (state.currentLevel === 3 && !run.bddVerified) {
      return {
        stepBadge: 'STEP 4 OF 5 · VERIFY CROSS-FILE CONTRACT',
        title: 'Verify that your spec matches Codex’s Java steps',
        message: 'Check that your SAVE10 / SAVE20 feature steps match Codex’s @When("{string}") and @Then("{double}") annotations.',
        ctaLabel: '🔍 Verify Step Mappings',
        ctaAction: 'bdd-review',
        cliCommand: 'git diff',
      };
    }
    const pr = run.prs.find(p => p.id === run.selectedPR);
    if (!pr?.approved) {
      return {
        stepBadge: 'STEP 4 OF 5 · APPROVE PULL REQUEST',
        title: 'Everything is green! Approve the Pull Request',
        message: 'Inspect the green/red diff in GitHub Hub and click "Approve PR" to sign off on the changes.',
        ctaLabel: '✅ Approve Pull Request',
        ctaAction: 'approve',
        cliCommand: 'git status',
      };
    }
    return {
      stepBadge: 'FINAL STEP · MERGE TO MAIN',
      title: 'Approved & Passing! Merge the PR into main',
      message: 'Click "Merge pull request" to bring both teammates’ work together on the production main branch!',
      ctaLabel: '🎉 Merge Pull Request to Main',
      ctaAction: 'merge',
      cliCommand: 'git branch',
    };
  }

  return {
    stepBadge: 'MISSION ACCOMPLISHED 🎉',
    title: `Level ${level.id} Complete! Both branches are merged into main.`,
    message: `You earned the "${level.badge}" badge! Ready for the next collaboration scenario?`,
    ctaLabel: state.currentLevel < LEVELS.length ? `Next Mission: Level ${state.currentLevel + 1} →` : '🏆 View All Achievements',
    ctaAction: 'next-level',
    cliCommand: 'git log --oneline',
  };
}

export function executeCommand(state, command) {
  const run = getRun(state);
  const input = command.trim();
  const reply = lines => ({ lines: Array.isArray(lines) ? lines : [lines] });
  if (!input) return reply([]);
  if (input === 'help' || input === 'git help') {
    return reply([
      'git status · git diff · git add . · git commit -m "message"',
      'git push origin feature/user-task · git pull origin main · git fetch',
      'git rebase main · git revert HEAD · git branch · git log --oneline · clear',
      'mvn test runs the browser’s simulated source checks.',
    ]);
  }
  if (input === 'clear') return { lines: [], effect: 'clear' };
  if (input === 'pwd') return reply('/workspace/collaboration-lab');
  if (input === 'ls') return reply(Object.keys(run.files).join('  '));
  if (/^git status(?: --short)?$/.test(input)) {
    const staged = run.stagedFiles && !same(run.stagedFiles, run.committedFiles);
    const modified = !same(run.files, run.stagedFiles || run.committedFiles);
    return reply([
      `On branch ${run.branch}`,
      run.conflict && !run.conflictResolved
        ? 'Unmerged paths: both modified UserProfile.java'
        : run.needsRebase && !run.rebased
          ? 'Your branch is 1 commit behind origin/main. Use "git rebase main" to update.'
          : staged
            ? 'Changes to be committed: staged source files'
            : 'No changes staged for commit.',
      modified ? 'Changes not staged: modified source files' : 'Working tree matches the index.',
      run.pushed ? 'Your task is on origin/feature/user-task.' : 'Use git add . to stage your edits.',
    ]);
  }
  if (input === 'git fetch' || input === 'git fetch origin') {
    return reply(['From https://github.com/branchlab/collaboration-lab', ' * branch            main       -> FETCH_HEAD', run.needsRebase && !run.rebased ? 'main has new commits from Codex. Run "git rebase main" next.' : 'Remote refs updated.']);
  }
  if (input === 'git rebase main' || input === 'git rebase origin/main') {
    if (run.needsRebase && !run.rebased) {
      rebaseOntoMain(state);
      return reply(['First, rewinding head to replay your work on top of it...', 'Applying: Issue auth tokens', 'Successfully rebased and updated refs/heads/feature/user-task.']);
    }
    return reply('Current branch feature/user-task is already up to date with main.');
  }
  if (/^git revert\b/.test(input)) {
    if (state.currentLevel === 6 && run.status === 'editing') {
      const level = LEVELS[5];
      setFile(state, level.filename, level.solution);
      run.reverted = true;
      return reply([
        '[feature/user-task] Prepared revert of commit e8f9a12 ("Set MAX_RETRIES=0 in ReleaseConfig")',
        'Restored MAX_RETRIES = 3 and PRODUCTION_READY = true.',
        'Next: run "git add .", "git commit -m \\"Revert broken config\\"", and "git push origin feature/user-task".',
      ]);
    }
    return reply('No broken commit requires reverting in this step.');
  }
  if (input === 'git add .' || input === 'git add -A') {
    if (run.conflict && !run.conflictResolved) {
      resolveConflict(state);
      return reply('Conflict resolved and resolution committed. Run mvn test next.');
    }
    stageFiles(state);
    return reply('Changes staged. Next: git commit -m "Implement task A"');
  }
  if (/^git commit\b/.test(input)) {
    const message = input.match(/^git commit -m\s+(["'])(.+)\1$/)?.[2];
    if (!message) throw new Error('Use git commit -m "Your message"');
    const hash = commit(state, message);
    return reply(`[${run.branch} ${hash}] ${message}`);
  }
  if (/^git push\b/.test(input)) {
    const match = input.match(/^git push(?: origin(?: ([\w/-]+))?)?$/);
    if (!match) throw new Error('Use git push origin feature/user-task.');
    const effect = push(state, match[1] || run.branch);
    return { lines: ['Enumerating objects… done.', '* [new branch] feature/user-task → origin/feature/user-task', 'Pull request #1 opened. Codex is taking a look.'], effect };
  }
  if (/^git pull(?: origin main)?$/.test(input)) {
    if (run.conflict && !run.conflictResolved) {
      return reply(['Auto-merging UserProfile.java', 'CONFLICT (content): merge conflict in UserProfile.java', 'Combine both changes in the editor, remove the markers, then git add .']);
    }
    if (run.needsRebase && !run.rebased) {
      rebaseOntoMain(state);
      return reply(['Updating feature/user-task with latest main from Codex...', 'Fast-forwarded / rebased onto latest main.']);
    }
    return reply('Already up to date.');
  }
  if (input === 'git branch') return reply(Object.keys(run.branches).map(branch => `${branch === run.branch ? '* ' : '  '}${branch}`));
  const checkout = input.match(/^git (?:checkout|switch) (-[bc] )?([\w/-]+)$/);
  if (checkout) {
    if (checkout[2] === run.branch) return reply(`Already on '${run.branch}'`);
    if (!Object.hasOwn(run.branches, checkout[2])) throw new Error('This exercise uses main, feature/user-task, and feature/codex-task.');
    if (run.status !== 'complete') throw new Error('Finish your task on feature/user-task first. Use the branch viewer to inspect other branches.');
    return reply(`${checkout[2]} is available in the branch viewer. This completed workspace stays on main.`);
  }
  if (/^git log(?: --oneline)?$/.test(input)) return reply([...run.history].reverse().map(c => `${c.hash} ${c.message} (${c.author})`));
  if (input === 'git diff') {
    return reply(
      Object.keys(run.files)
        .filter(name => run.files[name] !== run.committedFiles[name])
        .flatMap(name => [`diff --git a/${name} b/${name}`, ...diffLines(run.committedFiles[name], run.files[name]).filter(l => l.type !== 'context').map(l => `${l.type === 'add' ? '+' : '-'} ${l.text}`)])
        .slice(0, 80)
    );
  }
  if (input === 'mvn test') {
    if (run.status === 'editing') {
      const result = validateTask(state.currentLevel, run.files);
      return reply(['[SIMULATION] Source checks; Java is not compiled.', ...result.results.map(r => `${r.pass ? 'PASS' : 'FAIL'} ${r.label}${r.pass ? '' : ': ' + r.detail}`)]);
    }
    runChecks(state);
    return reply(['[SIMULATION] Integration checks complete.', ...run.checkResults.map(c => `${c.pass ? 'PASS' : 'FAIL'} ${c.label}: ${c.detail}`)]);
  }
  throw new Error(`Command not supported: ${input}. Type help for available commands.`);
}

export function diffLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  if (a.length > 400 || b.length > 400) {
    return [...a.map((text, i) => ({ type: 'remove', text, old: i + 1, new: '' })), ...b.map((text, i) => ({ type: 'add', text, old: '', new: i + 1 }))];
  }
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ type: 'context', text: a[i], old: ++i, new: ++j });
    } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) {
      lines.push({ type: 'add', text: b[j], old: '', new: ++j });
    } else {
      lines.push({ type: 'remove', text: a[i], old: ++i, new: '' });
    }
  }
  return lines;
}
