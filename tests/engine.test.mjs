import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, integratedCalculator } from '../src/curriculum.js';
import {
  createState,
  restoreState,
  getRun,
  setLevel,
  setFile,
  stageFiles,
  commit,
  push,
  completeAndPush,
  finishAI,
  runChecks,
  approve,
  merge,
  resolveConflict,
  rebaseOntoMain,
  requestChanges,
  verifyBDD,
  validateTask,
  arithmetic,
  executeCommand,
  diffLines,
  stepFor,
  coachGuide,
} from '../src/engine.js';

function ready(id = 1) {
  const state = createState();
  setLevel(state, id);
  const level = LEVELS[id - 1];
  setFile(state, level.filename, level.solution);
  completeAndPush(state);
  finishAI(state);
  return state;
}

test('every starter requires work and every reference solution meets its task contract', () => {
  for (const level of LEVELS) {
    assert.equal(validateTask(level.id, level.files).pass, false, level.title);
    assert.equal(validateTask(level.id, { ...level.files, [level.filename]: level.solution }).pass, true, level.title);
  }
});

test('calculator checks evaluate variable arithmetic, negatives, and decimals', () => {
  const source = LEVELS[0].solution.replace('return a + b;', 'double result = b + a; return result;');
  assert.equal(validateTask(1, { 'Calculator.java': source }).pass, true);
  for (const bad of ['return a - b;', 'return 6;', 'return a + b + 1;', '// return a + b;\nreturn 0;']) {
    assert.equal(validateTask(1, { 'Calculator.java': LEVELS[0].solution.replace('return a + b;', bad) }).pass, false);
  }
});

test('arithmetic parser rejects executable source and malformed expressions', () => {
  assert.equal(arithmetic('2 * (a + b) / 2', { a: 1.25, b: -2 }), -0.75);
  for (const source of ['globalThis.alert(1)', 'a; process.exit()', 'a**2', 'a/0', 'a + (b', '1e3', 'a,b']) {
    assert.throws(() => arithmetic(source, { a: 1, b: 2 }));
  }
});

test('one-click push validates before staging and never sends starter code', () => {
  const state = createState();
  assert.throws(() => completeAndPush(state), /return a \+ b/);
  assert.equal(getRun(state).history.length, 1);
  assert.equal(getRun(state).stagedFiles, null);
});

test('staging is a snapshot; edits after staging do not change the commit', () => {
  const state = createState();
  const level = LEVELS[0];
  setFile(state, level.filename, level.solution);
  stageFiles(state);
  setFile(state, level.filename, level.solution + '\n// another edit');
  commit(state, 'Calculator methods');
  assert.equal(getRun(state).committedFiles[level.filename], level.solution);
  assert.throws(() => push(state), /uncommitted edits/);
  stageFiles(state);
  commit(state, 'Add a comment');
  push(state);
  assert.equal(getRun(state).status, 'working');
});

test('terminal git commands drive the complete normal workflow', () => {
  const state = createState();
  const run = getRun(state);
  const level = LEVELS[0];
  setFile(state, level.filename, level.solution);
  assert.match(executeCommand(state, 'git status').lines.join('\n'), /modified/);
  executeCommand(state, 'git add .');
  assert.equal(stepFor(run), 2);
  executeCommand(state, 'git commit -m "Add arithmetic"');
  assert.equal(executeCommand(state, 'git push origin feature/user-task').effect, 'startAI');
  assert.equal(stepFor(run), 3);
  finishAI(state);
  assert.equal(run.prs.find(p => p.id === 'user').status, 'merged');
  assert.equal(stepFor(run), 4);
  assert.equal(runChecks(state), 'passed');
  approve(state);
  assert.equal(stepFor(run), 5);
  merge(state);
  assert.equal(run.branch, 'main');
  assert.equal(run.status, 'complete');
  assert.match(run.mainFiles[level.filename], /return a \+ b/);
  assert.match(run.mainFiles[level.filename], /return a \* b/);
  assert.match(run.mainFiles[level.filename], /Cannot divide by zero/);
  assert.deepEqual(state.completed, [1]);
  assert.deepEqual(state.badges, ['First merge']);
});

test('merge is gated on CI and explicit approval', () => {
  const state = ready();
  assert.throws(() => approve(state), /CI checks/);
  assert.throws(() => merge(state), /Approve/);
  runChecks(state);
  assert.throws(() => merge(state), /Approve/);
  approve(state);
  merge(state);
  assert.throws(() => merge(state), /Approve/);
});

test('level 2 Codex merges first; conflict needs markers removed AND both changes', () => {
  const state = ready(2);
  const run = getRun(state);
  assert.equal(run.prs.find(p => p.id === 'codex').status, 'merged');
  assert.equal(run.selectedPR, 'user');
  assert.match(run.files['UserProfile.java'], /^<<<<<<< HEAD/);
  assert.equal(runChecks(state), 'failed');
  assert.throws(() => approve(state), /conflict/);
  assert.throws(() => resolveConflict(state), /Remove <<<<<<</);
  setFile(state, 'UserProfile.java', LEVELS[1].solution);
  assert.throws(() => resolveConflict(state), /logging/);
  setFile(state, 'UserProfile.java', LEVELS[1].resolved);
  executeCommand(state, 'git add .');
  assert.equal(run.conflictResolved, true);
  assert.equal(runChecks(state), 'passed');
  approve(state);
  merge(state);
  assert.match(run.mainFiles['UserProfile.java'], /email == null/);
  assert.match(run.mainFiles['UserProfile.java'], /System.out.println/);
  assert.doesNotMatch(run.mainFiles['UserProfile.java'], /<<<<<<<|=======|>>>>>>>/);
});

test('level 3 requires Cucumber mapping review and preserves feature and step definitions', () => {
  const state = ready(3);
  runChecks(state);
  assert.throws(() => approve(state), /Cucumber/);
  verifyBDD(state);
  approve(state);
  merge(state);
  const run = getRun(state);
  assert.match(run.mainFiles['shopping_cart.feature'], /SAVE20/);
  assert.match(run.mainFiles['CartSteps.java'], /@When\("user applies discount code \{string\}"\)/);
  assert.match(run.mainFiles['CartSteps.java'], /driver.quit\(\)/);
});

test('level 4 fails first, requires changes, then passes after Codex revision', () => {
  const state = ready(4);
  const run = getRun(state);
  assert.equal(runChecks(state), 'failed');
  assert.match(run.checkResults[1].detail, /95.0.*92.0/s);
  assert.throws(() => approve(state), /CI checks/);
  assert.throws(() => requestChanges(state, ''), /comment/);
  assert.equal(requestChanges(state, 'Use 92.0 for EUR.'), 'reviseAI');
  assert.equal(run.status, 'revising');
  finishAI(state, 4, true);
  assert.equal(run.revision, 1);
  assert.match(run.aiCode, /assertEquals\(92.0/);
  assert.equal(runChecks(state), 'passed');
  approve(state);
  merge(state);
  assert.match(run.mainFiles['PaymentProcessorTest.java'], /assertEquals\(92.0/);
  assert.equal(run.feedback, 'Use 92.0 for EUR.');
});

test('level 5 requires rebasing onto main after Codex updates main', () => {
  const state = ready(5);
  const run = getRun(state);
  assert.equal(run.needsRebase, true);
  assert.equal(run.rebased, false);
  assert.equal(runChecks(state), 'failed');
  assert.throws(() => approve(state), /Rebase/);
  executeCommand(state, 'git rebase main');
  assert.equal(run.rebased, true);
  assert.equal(runChecks(state), 'passed');
  approve(state);
  merge(state);
  assert.match(run.mainFiles['AuthService.java'], /"token:" \+ userId/);
  assert.match(run.mainFiles['SecurityConfig.java'], /TOKEN_PREFIX/);
});

test('level 6 supports git revert HEAD in terminal and completes hotfix PR', () => {
  const state = createState();
  setLevel(state, 6);
  const run = getRun(state);
  assert.equal(run.history.length, 2);
  executeCommand(state, 'git revert HEAD');
  assert.equal(run.reverted, true);
  executeCommand(state, 'git add .');
  executeCommand(state, 'git commit -m "Revert broken config"');
  executeCommand(state, 'git push origin feature/user-task');
  finishAI(state, 6);
  assert.equal(runChecks(state), 'passed');
  approve(state);
  merge(state);
  assert.match(run.mainFiles['ReleaseConfig.java'], /MAX_RETRIES = 3/);
});

test('coachGuide provides actionable guidance at every stage', () => {
  const state = createState();
  assert.equal(coachGuide(state).ctaAction, 'quick-fill');
  setFile(state, 'Calculator.java', LEVELS[0].solution);
  assert.equal(coachGuide(state).ctaAction, 'push');
  completeAndPush(state);
  assert.equal(coachGuide(state).ctaAction, '');
  finishAI(state);
  assert.equal(coachGuide(state).ctaAction, 'run-checks');
  runChecks(state);
  assert.equal(coachGuide(state).ctaAction, 'approve');
  approve(state);
  assert.equal(coachGuide(state).ctaAction, 'merge');
  merge(state);
  assert.equal(coachGuide(state).ctaAction, 'next-level');
});

test('a learner completes all six levels in sequence with reloads and terminal commands', () => {
  let state = createState();
  for (const level of LEVELS) {
    setLevel(state, level.id);
    if (level.id === 6) {
      executeCommand(state, 'git revert HEAD');
    } else {
      setFile(state, level.filename, level.solution);
    }
    executeCommand(state, 'git add .');
    executeCommand(state, 'git commit -m "Complete task A"');
    executeCommand(state, 'git push origin feature/user-task');
    state = restoreState(JSON.stringify(state));
    assert.equal(getRun(state).status, 'review');
    if (level.id === 2) {
      assert.equal(runChecks(state), 'failed');
      setFile(state, level.filename, level.resolved);
      resolveConflict(state);
    }
    if (level.id === 4) {
      assert.equal(runChecks(state), 'failed');
      requestChanges(state, 'The EUR expected value should be 92.0.');
      state = restoreState(JSON.stringify(state));
    }
    if (level.id === 5) {
      assert.equal(runChecks(state), 'failed');
      rebaseOntoMain(state);
    }
    assert.equal(runChecks(state), 'passed');
    if (level.id === 3) verifyBDD(state);
    approve(state);
    merge(state);
    state = restoreState(JSON.stringify(state));
    assert.equal(state.completed.length, level.id);
    assert.equal(state.badges.length, level.id);
    assert.equal(getRun(state).status, 'complete');
    assert.equal(getRun(state).prs.filter(pr => pr.status === 'merged').length, 2);
  }
  assert.deepEqual(state.completed, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(state.badges, LEVELS.map(level => level.badge));
  assert.ok(state.xp > 500);
});
