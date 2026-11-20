import { LEVELS } from './curriculum.js';

export const AI_CONFIG_KEY = 'branchlab.ai.config.v1';

export const FREE_AI_PROVIDERS = [
  {
    id: 'builtin',
    name: 'Nova · Built-in Free AI',
    badge: '100% FREE · NO SETUP',
    cost: 'Free forever (Offline in browser)',
    needsKey: false,
    description: 'Runs instantly inside your browser with zero setup, no account, and no API key required. Includes deterministic Git simulation + context-aware Git & PR Q&A.',
    defaultModel: 'nova-git-coach-v2',
  },
  {
    id: 'ollama',
    name: 'Ollama · Free Local LLM',
    badge: '100% FREE · LOCAL PC',
    cost: 'Free open-source models on your machine',
    needsKey: false,
    description: 'Connects to your local Ollama server (http://localhost:11434) to run free open-source coding models like Llama 3.2, Qwen 2.5 Coder, or DeepSeek without any API key.',
    defaultModel: 'llama3.2',
    endpoint: 'http://localhost:11434',
  },
  {
    id: 'gemini',
    name: 'Google Gemini Flash (Free Tier)',
    badge: 'FREE TIER API KEY',
    cost: 'Free via Google AI Studio (aistudio.google.com)',
    needsKey: true,
    description: 'Uses Google AI Studio’s free-tier Gemini 2.0/2.5 Flash model for live code reviews and Git coaching. Key is saved only in your browser.',
    defaultModel: 'gemini-2.0-flash',
    keyPlaceholder: 'AIzaSy...',
    getKeyUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    name: 'Groq · Llama 3.3 70B (Free Tier)',
    badge: 'FREE TIER API KEY',
    cost: 'Free via Groq Cloud (console.groq.com)',
    needsKey: true,
    description: 'Ultra-fast open-source Llama 3.3 70B hosted on Groq’s free developer tier for instant Pull Request reviews and Git explanations.',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    getKeyUrl: 'https://console.groq.com/keys',
  },
];

export function defaultAIConfig() {
  return {
    provider: 'builtin',
    teammateName: 'Nova',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    geminiKey: '',
    geminiModel: 'gemini-2.0-flash',
    groqKey: '',
    groqModel: 'llama-3.3-70b-versatile',
  };
}

export function loadAIConfig(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(AI_CONFIG_KEY);
    if (!raw) return defaultAIConfig();
    const parsed = JSON.parse(raw);
    const base = defaultAIConfig();
    return {
      ...base,
      provider: FREE_AI_PROVIDERS.some(p => p.id === parsed.provider) ? parsed.provider : 'builtin',
      teammateName: typeof parsed.teammateName === 'string' && parsed.teammateName.trim() ? parsed.teammateName.trim().slice(0, 24) : 'Nova',
      ollamaUrl: typeof parsed.ollamaUrl === 'string' && parsed.ollamaUrl.trim() ? parsed.ollamaUrl.trim() : base.ollamaUrl,
      ollamaModel: typeof parsed.ollamaModel === 'string' && parsed.ollamaModel.trim() ? parsed.ollamaModel.trim() : base.ollamaModel,
      geminiKey: typeof parsed.geminiKey === 'string' ? parsed.geminiKey.trim() : '',
      geminiModel: typeof parsed.geminiModel === 'string' && parsed.geminiModel.trim() ? parsed.geminiModel.trim() : base.geminiModel,
      groqKey: typeof parsed.groqKey === 'string' ? parsed.groqKey.trim() : '',
      groqModel: typeof parsed.groqModel === 'string' && parsed.groqModel.trim() ? parsed.groqModel.trim() : base.groqModel,
    };
  } catch {
    return defaultAIConfig();
  }
}

export function saveAIConfig(config, storage = globalThis.localStorage) {
  try {
    storage?.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function getProviderMeta(providerId) {
  return FREE_AI_PROVIDERS.find(p => p.id === providerId) || FREE_AI_PROVIDERS[0];
}

export function buildBuiltinResponse(question, state, run, config = defaultAIConfig()) {
  const level = LEVELS[state.currentLevel - 1];
  const name = config.teammateName || 'Nova';
  const q = (question || '').toLowerCase();

  if (q.includes('review') || q.includes('diff') || q.includes('pr')) {
    const openPR = run.prs.find(p => p.status !== 'merged') || run.prs[0];
    if (!openPR) {
      return `**[${name} · Built-in Free PR Reviewer]** You haven’t opened a Pull Request yet on Mission ${level.id} (*${level.title}*). Click **⚡ 1-Click Fill Code** and **🚀 Complete & Push Task A** to open PR #1, then ask me to review the diff!`;
    }
    if (level.id === 2 && run.conflict && !run.conflictResolved) {
      return `**[${name} · PR Conflict Analysis]** PR #${openPR.number} (\`${openPR.branch}\` → \`main\`) currently has a **merge conflict** in \`${level.filename}\`.\n\n- **Why:** Both of us modified \`updateEmail()\` on different branches and my PR merged into \`main\` first.\n- **Fix:** Click **✨ Combine Both (Recommended)** in the Visual Conflict Resolver bar to keep your email validation AND my \`System.out.println\` audit log, then click **Mark conflict as resolved**.`;
    }
    if (level.id === 4 && run.revision === 0) {
      return `**[${name} · Live PR Review]** I inspected PR #${openPR.number} (\`${level.aiFile}\`):\n\n- ⚠️ **Bug Found in Line 11:** \`assertEquals(95.0, processor.processTransaction(100.0, "EUR"), 0.001)\` expects \`95.0\`, but your \`PaymentProcessor.java\` converts EUR at \`0.92\` (\`100 * 0.92 = 92.0\`).\n- **Next Step:** Click **Request changes** on the PR so I can push a fix commit updating the expected value to \`92.0\`!`;
    }
    if (level.id === 5 && run.needsRebase && !run.rebased) {
      return `**[${name} · Branch Sync Review]** Your PR code in \`${level.filename}\` looks clean, but \`main\` moved ahead by 1 commit (\`SecurityConfig.java\`). Run \`git rebase main\` (or click **Rebase onto main**) so your commit sits cleanly on top of \`main\`.`;
    }
    if (level.id === 7 && run.needsStash && !run.stashedAndPopped) {
      return `**[${name} · Working Tree Review]** I merged \`AlertChannelConfig.java\` into \`main\`, and your branch needs it before merging. Run \`git stash\`, \`git pull origin main\`, and \`git stash pop\` (or click **Stash, Pull Main & Pop**).`;
    }
    if (level.id === 8 && run.needsCherryPick && !run.cherryPicked) {
      return `**[${name} · Release Branch Review]** Do **not** merge my entire \`feature/codex-task\` branch—it has experimental WIP commits! Instead, run \`git cherry-pick c0ffee7\` to pluck only my \`HotfixHeaderFilter.java\` security commit onto your branch.`;
    }
    if (level.id === 9 && run.needsSquash && !run.squashed) {
      return `**[${name} · Commit History Review]** The code in \`${level.aiFile}\` is correct, but the PR has 4 noisy WIP commits (\`wip\`, \`oops\`, \`fix typo\`). Run \`git merge --squash feature/codex-task\` (or click **Squash 4 WIP Commits → 1**) before approving!`;
    }
    return `**[${name} · Live PR Review]** I reviewed PR #${openPR.number} (\`${openPR.title}\` on \`${openPR.branch}\`):\n\n- ✅ **Code Contract:** \`${level.filename}\` and \`${level.aiFile}\` integrate cleanly without syntax or contract errors.\n- ✅ **Branch Hygiene:** Ready for CI checks (\`${run.checks}\`), approval, and merge into \`main\`!`;
  }

  if (q.includes('why') || q.includes('team') || q.includes('two') || q.includes('real')) {
    return `**[${name} · Real-World Team Guide]** **Why 2 developers need ${level.topic}:** ${level.whyTwoPeople}\n\nIn a real team, you work on \`feature/user-task\` while your teammate works on their own branch. Mastering \`${level.gitSkill}\` prevents overwritten code and broken \`main\` deployments.`;
  }

  if (q.includes('command') || q.includes('cli') || q.includes('git') || q.includes('how')) {
    return `**[${name} · Git Command Breakdown — Mission ${level.id}]**\n\n- **Core Skills:** \`${level.gitSkill}\`\n- **Current Branch:** \`${run.branch}\` (${run.history.length} commits in repo)\n- **What to run next:** Check the glowing **Spotlight Coach** banner at the top or click any terminal command pill at the bottom of your editor!`;
  }

  return `**[${name} · Free Built-in Git Coach]** We’re on **Mission ${level.id}: ${level.title}** (*${level.topic}*).\n\n- **Your Task A:** ${level.task} in \`${level.filename}\`\n- **My Task B:** ${level.aiTask} in \`${level.aiFile}\`\n- **2-Player Skill:** \`${level.gitSkill}\`\n\nTip: Click **"Review open PR diff"** or **"Explain this Git command"** below anytime—or connect **Ollama (Free Local AI)** / **Gemini Free Tier** in the **🤖 Free AI Engine** settings!`;
}

function buildSystemPrompt(state, run, config) {
  const level = LEVELS[state.currentLevel - 1];
  const openPR = run.prs.find(p => p.status !== 'merged') || run.prs[0];
  return [
    `You are ${config.teammateName || 'Nova'}, a friendly, concise senior developer and AI Git teammate inside BranchLab 2.0 (a 2-player GitHub collaboration simulator).`,
    `Current Mission ${level.id}/9: "${level.title}" (Topic: ${level.topic}, Skills: ${level.gitSkill}).`,
    `Why 2 people need this: ${level.whyTwoPeople}`,
    `User's current branch: ${run.branch}, status: ${run.status}, CI checks: ${run.checks}.`,
    `User's file (${level.filename}):\n${run.files[level.filename] || ''}`,
    `Teammate file (${level.aiFile}):\n${run.aiCode || level.files[level.aiFile] || ''}`,
    openPR ? `Active Pull Request: #${openPR.number} "${openPR.title}" (${openPR.branch} -> main, status: ${openPR.status}).` : 'No Pull Request opened yet.',
    'Answer in 3-5 short, helpful bullet points or sentences with concrete Git commands. Be encouraging and practical.',
  ].join('\n\n');
}

export async function testOllamaConnection(ollamaUrl = 'http://localhost:11434') {
  const cleanUrl = ollamaUrl.replace(/\/+$/, '');
  const response = await fetch(`${cleanUrl}/api/tags`, { method: 'GET' });
  if (!response.ok) throw new Error(`Ollama responded with HTTP ${response.status}`);
  const data = await response.json();
  const models = Array.isArray(data?.models) ? data.models.map(m => m.name).filter(Boolean) : [];
  return { ok: true, models };
}

export async function askFreeAI(question, state, run, config = defaultAIConfig()) {
  const activeConfig = { ...defaultAIConfig(), ...config };
  const prompt = (question || 'Give me a quick review and next step for our current Git mission.').trim();

  if (activeConfig.provider === 'builtin') {
    return {
      provider: 'builtin',
      model: 'nova-git-coach-v2',
      text: buildBuiltinResponse(prompt, state, run, activeConfig),
      fallback: false,
    };
  }

  const systemPrompt = buildSystemPrompt(state, run, activeConfig);

  try {
    if (activeConfig.provider === 'ollama') {
      const cleanUrl = activeConfig.ollamaUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeConfig.ollamaModel || 'llama3.2',
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Local Ollama server returned HTTP ${res.status}`);
      const data = await res.json();
      const content = data?.message?.content?.trim();
      if (!content) throw new Error('Empty response from Ollama');
      return { provider: 'ollama', model: activeConfig.ollamaModel, text: content, fallback: false };
    }

    if (activeConfig.provider === 'gemini') {
      if (!activeConfig.geminiKey) throw new Error('No Gemini Free Tier API key configured');
      const model = activeConfig.geminiModel || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(activeConfig.geminiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      });
      if (!res.ok) throw new Error(`Gemini API returned HTTP ${res.status}`);
      const data = await res.json();
      const content = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n').trim();
      if (!content) throw new Error('Empty response from Gemini');
      return { provider: 'gemini', model, text: content, fallback: false };
    }

    if (activeConfig.provider === 'groq') {
      if (!activeConfig.groqKey) throw new Error('No Groq Free Tier API key configured');
      const model = activeConfig.groqModel || 'llama-3.3-70b-versatile';
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeConfig.groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(`Groq API returned HTTP ${res.status}`);
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('Empty response from Groq');
      return { provider: 'groq', model, text: content, fallback: false };
    }
  } catch (error) {
    const builtinText = buildBuiltinResponse(prompt, state, run, activeConfig);
    return {
      provider: 'builtin',
      model: 'nova-git-coach-v2 (auto-fallback)',
      text: `${builtinText}\n\n*(Note: ${activeConfig.provider.toUpperCase()} was unreachable — "${error.message}" — so Nova answered using the 100% Free Built-in Engine!)*`,
      fallback: true,
    };
  }

  return {
    provider: 'builtin',
    model: 'nova-git-coach-v2',
    text: buildBuiltinResponse(prompt, state, run, activeConfig),
    fallback: false,
  };
}
