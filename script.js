import { BUDGETS, FEATURES, PRIORITIES, ROLES, TOOLS, BUNDLE_RECIPE_DEFS } from './data.js';

const els = {
  roleChips: document.getElementById('roleChips'),
  budgetChips: document.getElementById('budgetChips'),
  priorityChips: document.getElementById('priorityChips'),
  featureChips: document.getElementById('featureChips'),
  useCaseInput: document.getElementById('useCaseInput'),
  findBtn: document.getElementById('findBtn'),
  resetBtn: document.getElementById('resetBtn'),
  recalcBtn: document.getElementById('recalcBtn'),
  resultsSection: document.getElementById('resultsSection'),
  bundleGrid: document.getElementById('bundleGrid'),
  toolRows: document.getElementById('toolRows'),
  topSummary: document.getElementById('topSummary'),
  copyBtn: document.getElementById('copyBtn'),
};

const state = {
  role: 'founder',
  budget: 'mid',
  priority: 'best-output',
  features: new Set(['long-context', 'integrations']),
  useCase: '',
  lastBundles: [],
};

const TAG_MAP = {
  write: ['writing'], blog: ['writing'], essay: ['writing'], report: ['writing', 'research'], email: ['writing'],
  research: ['research'], paper: ['research'], citation: ['research'], pdf: ['research', 'long-context'], summarize: ['research'], analyze: ['analysis'], analysis: ['analysis'],
  code: ['coding'], coding: ['coding'], build: ['builder'], app: ['builder', 'coding'], website: ['builder'], landing: ['builder'], debug: ['coding'], api: ['coding'],
  design: ['design'], image: ['image-gen'], visual: ['design', 'image-gen'], logo: ['design'], slides: ['presentation'], deck: ['presentation'], pitch: ['presentation'],
  automate: ['automation'], workflow: ['automation'], agents: ['automation'], agent: ['automation'], integrate: ['automation'], integration: ['automation'],
  private: ['privacy'], offline: ['privacy'], local: ['privacy'], confidential: ['privacy'],
  student: ['student'], founder: ['founder'], pm: ['pm'], analyst: ['analyst'], marketer: ['marketer'], developer: ['developer'], consultant: ['consultant'], researcher: ['researcher'], designer: ['designer'],
  long: ['long-context'], context: ['long-context'], tokens: ['token-efficiency'], token: ['token-efficiency'], budget: ['budget'], cheap: ['budget'], fast: ['speed'], speed: ['speed'],
  canva: ['integrations'], github: ['integrations'], notion: ['integrations'], slack: ['integrations'], google: ['integrations'], teams: ['integrations'],
};

function formatINR(n) {
  if (n === 0) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function uniq(arr) { return [...new Set(arr)]; }

function parseIntent() {
  const text = `${state.useCase} ${state.role}`.toLowerCase();
  const words = text.split(/\W+/).filter(Boolean);
  const tags = new Set();
  words.forEach(w => (TAG_MAP[w] || []).forEach(t => tags.add(t)));
  if (state.features.has('image-gen')) tags.add('image-gen');
  if (state.features.has('agents')) tags.add('automation');
  if (state.features.has('long-context')) tags.add('long-context');
  if (state.features.has('token-efficiency')) tags.add('token-efficiency');
  if (state.features.has('integrations')) tags.add('integrations');
  if (state.priority === 'privacy-first') tags.add('privacy');
  return {
    tags: [...tags],
    role: state.role,
    budget: state.budget,
    priority: state.priority,
    features: [...state.features],
    useCase: state.useCase,
  };
}

function scoreTool(tool, intent) {
  let score = 0;
  const overlap = intent.tags.filter(t => (tool.useCases || []).includes(t)).length;
  const maxTags = Math.max(intent.tags.length, 1);
  score += Math.min(35, Math.round((overlap / maxTags) * 35));

  if ((tool.bestForRoles || []).includes(intent.role)) score += 15;

  const budgetScore = {
    free: tool.priceInrMonth === 0 ? 20 : tool.priceApprox ? 8 : 0,
    under500: tool.priceInrMonth <= 500 ? 20 : tool.priceInrMonth <= 1000 ? 10 : 0,
    mid: tool.priceInrMonth <= 2000 ? 20 : 8,
    high: 20,
  }[intent.budget] ?? 0;
  score += budgetScore;

  const priorityScore = {
    'best-output': { top: 15, high: 10, good: 5, basic: 0 }[tool.outputQuality] ?? 0,
    cheapest: tool.priceInrMonth === 0 ? 15 : tool.priceInrMonth <= 500 ? 12 : tool.priceInrMonth <= 1000 ? 7 : 0,
    fastest: tool.speed === 'fast' ? 15 : tool.speed === 'medium' ? 8 : 0,
    'privacy-first': tool.privacyLevel === 'high' ? 15 : tool.privacyLevel === 'medium' ? 6 : 0,
  }[intent.priority] ?? 0;
  score += priorityScore;

  let featureScore = 0;
  if (intent.tags.includes('image-gen') && tool.imageGen) featureScore += 5;
  if (intent.tags.includes('long-context') && tool.longContext) featureScore += 5;
  if (intent.tags.includes('automation') && tool.agentWorkflow) featureScore += 5;
  if (intent.tags.includes('privacy') && tool.privacyLevel === 'high') featureScore += 5;
  if (intent.tags.includes('integrations') && (tool.integrations || []).length) featureScore += 3;
  score += Math.min(15, featureScore);

  if (tool.indiaPaymentSupport === 'no') score -= 20;
  if (tool.indiaPaymentSupport === 'workaround' && intent.budget !== 'high') score -= 5;
  if (tool.tokenExhaustionRisk === 'high' && intent.budget !== 'high') score -= 8;
  if (intent.features.includes('token-efficiency') && tool.tokenExhaustionRisk === 'low') score += 6;

  return Math.max(0, Math.min(100, score));
}

function calcCompatibility(tools) {
  let pairs = 0;
  let compatible = 0;
  const notes = [];
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      pairs++;
      const shared = (tools[i].integrations || []).filter(x => (tools[j].integrations || []).includes(x));
      if (shared.length > 0) {
        compatible++;
        notes.push(`${tools[i].name} + ${tools[j].name}: ${shared.slice(0, 2).join(', ')}`);
      } else {
        notes.push(`${tools[i].name} + ${tools[j].name}: manual handoff`);
      }
    }
  }
  return { score: pairs ? compatible / pairs : 1, notes: uniq(notes).slice(0, 4) };
}

function buildBundle(strategy, tools, intent, opts = {}) {
  const selected = [];
  const usedCategories = new Set();
  for (const tool of tools) {
    if (selected.length >= (opts.maxTools || 3)) break;
    if (!opts.allowSameCategory && usedCategories.has(tool.category)) continue;
    selected.push(tool);
    usedCategories.add(tool.category);
  }
  const totalCost = selected.reduce((sum, t) => sum + (t.priceInrMonth || 0), 0);
  const avgScore = selected.reduce((sum, t) => sum + (t.score || 0), 0) / Math.max(selected.length, 1);
  const compat = calcCompatibility(selected);
  const labels = {
    'best-overall': { name: 'Best overall', badge: 'Best overall match' },
    cheap: { name: 'Cheapest', badge: 'Lowest cost' },
    fast: { name: 'Fastest', badge: 'Fastest to start' },
    output: { name: 'Best output', badge: 'Highest quality' },
    privacy: { name: 'Privacy first', badge: 'Local / private' },
    builder: { name: 'Best for builders', badge: 'Build faster' },
    research: { name: 'Best for researchers', badge: 'Deep reading' },
    design: { name: 'Best for designers', badge: 'Visual / creative' },
  };
  const pros = [];
  if (selected.some(t => t.outputQuality === 'top')) pros.push('Includes top-tier output quality');
  if (totalCost === 0) pros.push('Entirely free');
  else if (totalCost < 1000) pros.push(`Costs under ${formatINR(totalCost)}/mo`);
  if (selected.every(t => t.indiaPaymentSupport === 'native')) pros.push('Indian payment support is smooth');
  if (compat.score >= 0.5) pros.push('Tools connect reasonably well');
  if (selected.some(t => t.privacyLevel === 'high')) pros.push('Includes a privacy-safe option');

  const cons = [];
  if (selected.some(t => t.indiaPaymentSupport === 'workaround')) cons.push('Some tools need an international card');
  if (selected.some(t => t.tokenExhaustionRisk === 'high')) cons.push('Token burn can happen faster than expected');
  if (selected.filter(t => t.category === 'llm').length > 1) cons.push('Two LLMs may overlap unless you split tasks carefully');
  if (selected.some(t => t.category === 'builder') && selected.some(t => t.category === 'llm')) cons.push('Best for building, not just chatting');

  const tradeoffs = [];
  if (strategy === 'cheap' && totalCost > 0) tradeoffs.push(`Cheaper option saves about ${formatINR(totalCost)}/mo, but gives up some polish.`);
  if (strategy === 'output' && selected.some(t => t.priceInrMonth < 1000)) tradeoffs.push('High quality is balanced with some low-cost support tools, not premium everywhere.');
  if (strategy === 'privacy' && selected.some(t => t.privacyLevel !== 'high')) tradeoffs.push('A few supporting tools may still be cloud-based.');
  if (strategy === 'fast') tradeoffs.push('Speed comes from fewer tools, lighter setup, and simpler workflows.');

  const fitSummaryBits = [];
  if (selected.some(t => t.outputQuality === 'top')) fitSummaryBits.push('top-tier output');
  if (selected.every(t => t.indiaPaymentSupport === 'native')) fitSummaryBits.push('smooth India billing');
  if (compat.score === 1) fitSummaryBits.push('native compatibility');
  if (selected.some(t => t.privacyLevel === 'high')) fitSummaryBits.push('privacy-friendly');
  if (selected.some(t => t.longContext)) fitSummaryBits.push('long-context support');

  return {
    id: strategy,
    label: labels[strategy] || { name: strategy, badge: strategy },
    bundleName: nameBundle(strategy, selected, intent),
    tools: selected,
    totalCostInr: totalCost,
    averageScore: avgScore,
    compatibilityScore: compat.score,
    fitSummary: fitSummaryBits.length ? `This stack gives ${fitSummaryBits.join(', ')}.` : 'A balanced stack for the chosen use case.',
    pros,
    cons,
    tradeoffs,
    compatibilityNotes: compat.notes,
    sourceLinks: selected.map(t => ({ name: t.name, url: t.sourceUrl })),
    primaryCTA: totalCost === 0 ? 'Free stack' : 'Paid stack',
  };
}

function nameBundle(strategy, tools, intent) {
  const base = {
    'best-overall': ['Smart Stack', 'Lean Stack', 'Signal Stack'],
    cheap: ['Lean Stack', 'Budget Stack', 'Zero-to-Low Stack'],
    fast: ['Quick Stack', 'Fast Lane Stack', 'Ship Stack'],
    output: ['Power Stack', 'Max Output Stack', 'Prime Stack'],
    privacy: ['Local Stack', 'Private Stack', 'Safe Stack'],
    builder: ['Builder Stack', 'Ship Stack', 'Founder Stack'],
    research: ['Research Stack', 'Deep Read Stack', 'Paper Stack'],
    design: ['Creator Stack', 'Visual Stack', 'Design Stack'],
  }[strategy] || ['Stack'];
  const roleName = intent.role ? intent.role.charAt(0).toUpperCase() + intent.role.slice(1) : 'AI';
  return `${base[0]} for ${roleName}`;
}

function buildBundles(scoredTools, intent) {
  const ranked = [...scoredTools].sort((a, b) => b.score - a.score);
  const budgetCap = state.budget === 'free' ? 0 : state.budget === 'under500' ? 500 : state.budget === 'mid' ? 2000 : 999999;

  const bundleBuilders = [
    { id: 'best-overall', tools: ranked, maxTools: 4, allowSameCategory: false },
    { id: 'cheap', tools: [...ranked].filter(t => t.priceInrMonth <= budgetCap || t.priceInrMonth === 0), maxTools: 3, allowSameCategory: false },
    { id: 'fast', tools: [...ranked].filter(t => t.speed === 'fast' || t.speed === 'medium'), maxTools: 3, allowSameCategory: false },
    { id: 'output', tools: [...ranked].filter(t => ['top', 'high'].includes(t.outputQuality)), maxTools: 4, allowSameCategory: false },
    { id: 'privacy', tools: [...ranked].filter(t => t.privacyLevel === 'high'), maxTools: 4, allowSameCategory: false },
    { id: 'builder', tools: [...ranked].filter(t => t.category === 'builder' || t.agentWorkflow), maxTools: 4, allowSameCategory: false },
    { id: 'research', tools: [...ranked].filter(t => t.category === 'search-research' || t.longContext), maxTools: 4, allowSameCategory: false },
    { id: 'design', tools: [...ranked].filter(t => t.category === 'image-gen' || t.useCases.includes('design')), maxTools: 4, allowSameCategory: false },
  ];

  const bundles = bundleBuilders.map(cfg => buildBundle(cfg.id, cfg.tools, intent, cfg)).filter(b => b.tools.length >= 2);
  const deduped = [];
  bundles.forEach(b => {
    const ids = new Set(b.tools.map(t => t.id));
    const overlap = deduped.some(existing => {
      const exIds = new Set(existing.tools.map(t => t.id));
      const shared = [...ids].filter(id => exIds.has(id)).length;
      return shared / Math.max(ids.size, exIds.size) > 0.6;
    });
    if (!overlap) deduped.push(b);
  });

  const rank = b => {
    let s = b.averageScore * 0.45 + b.compatibilityScore * 100 * 0.25;
    if (b.totalCostInr <= budgetCap) s += 15;
    if (b.tools.some(t => t.outputQuality === 'top')) s += 8;
    if (b.tools.some(t => t.privacyLevel === 'high')) s += 5;
    if (b.tools.some(t => t.indiaPaymentSupport === 'native')) s += 3;
    if (state.priority === 'cheapest') s += Math.max(0, 25 - Math.min(25, b.totalCostInr / 100));
    if (state.priority === 'fastest') s += b.tools.every(t => t.speed === 'fast' || t.speed === 'medium') ? 10 : 0;
    if (state.priority === 'privacy-first') s += b.tools.every(t => t.privacyLevel === 'high' || t.category === 'local-privacy') ? 10 : 0;
    if (state.priority === 'best-output') s += b.tools.some(t => t.outputQuality === 'top') ? 10 : 0;
    return s;
  };

  return deduped.sort((a, b) => rank(b) - rank(a)).slice(0, 6);
}

function renderChips(container, items, group, multi = false) {
  container.innerHTML = '';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = item.label;
    btn.dataset.id = item.id;
    const active = multi ? state[group].has(item.id) : state[group] === item.id;
    if (active) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (multi) {
        if (state[group].has(item.id)) state[group].delete(item.id); else state[group].add(item.id);
      } else {
        state[group] = item.id;
      }
      rerender();
    });
    container.appendChild(btn);
  });
}

function renderToolTable() {
  const sorted = [...TOOLS].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  els.toolRows.innerHTML = sorted.map(tool => `
    <tr>
      <td><strong>${tool.name}</strong></td>
      <td><span class="pill pill-muted">${labelCategory(tool.category)}</span></td>
      <td>${tool.priceInrMonth === 0 ? 'Free' : `${tool.priceApprox ? '~' : ''}${formatINR(tool.priceInrMonth)}`}</td>
      <td>${(tool.bestForRoles || []).slice(0,2).map(cap).join(', ')}</td>
      <td>${tool.strengths?.[0] || '-'}</td>
      <td>${tool.weaknesses?.[0] || '-'}</td>
      <td><a href="${tool.sourceUrl}" target="_blank" rel="noreferrer">Open</a></td>
    </tr>
  `).join('');
}

function labelCategory(cat) {
  return ({ 'llm':'LLM', 'search-research':'Search', 'image-gen':'Image', 'automation':'Automation', 'builder':'Builder', 'productivity':'Productivity', 'local-privacy':'Local' }[cat] || cat);
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function renderSummary(bundles) {
  if (!bundles.length) { els.topSummary.innerHTML = ''; return; }
  const top = bundles[0];
  const second = bundles[1];
  const third = bundles[2];
  els.topSummary.innerHTML = `
    <div class="summary-card featured">
      <div class="summary-tag">Top pick</div>
      <h3>${top.bundleName}</h3>
      <p>${top.fitSummary}</p>
      <div class="summary-meta">${formatINR(top.totalCostInr)} / mo • ${top.tools.map(t => t.name).join(' • ')}</div>
    </div>
    ${second ? `<div class="summary-card"><div class="summary-tag">Alternative</div><h3>${second.label.name}</h3><p>${second.fitSummary}</p><div class="summary-meta">${formatINR(second.totalCostInr)} / mo</div></div>` : ''}
    ${third ? `<div class="summary-card"><div class="summary-tag">Backup</div><h3>${third.label.name}</h3><p>${third.fitSummary}</p><div class="summary-meta">${formatINR(third.totalCostInr)} / mo</div></div>` : ''}
  `;
}

function renderBundles(bundles) {
  if (!bundles.length) {
    els.bundleGrid.innerHTML = '<div class="empty-state">Pick a role and press <strong>Find my stack</strong>.</div>';
    return;
  }
  els.bundleGrid.innerHTML = bundles.map((bundle, idx) => {
    const badgeClass = idx === 0 ? 'accent' : '';
    return `
      <article class="bundle-card ${badgeClass}">
        <div class="bundle-top">
          <div>
            <div class="bundle-badge">${bundle.label.badge}</div>
            <h3>${bundle.bundleName}</h3>
          </div>
          <div class="bundle-cost">${bundle.totalCostInr === 0 ? 'Free' : `${formatINR(bundle.totalCostInr)}/mo`}</div>
        </div>
        <p class="bundle-summary">${bundle.fitSummary}</p>
        <div class="tool-pills">${bundle.tools.map(t => `<span class="pill">${t.name}</span>`).join('')}</div>

        <div class="bundle-columns">
          <div>
            <h4>Pros</h4>
            <ul>${bundle.pros.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
          <div>
            <h4>Cons</h4>
            <ul>${bundle.cons.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
        </div>

        <details>
          <summary>Tradeoffs & compatibility</summary>
          <div class="detail-body">
            <div class="subhead">Tradeoffs</div>
            <ul>${bundle.tradeoffs.length ? bundle.tradeoffs.map(x => `<li>${x}</li>`).join('') : '<li>Balanced stack with minimal tradeoff noise.</li>'}</ul>
            <div class="subhead">Compatibility notes</div>
            <ul>${bundle.compatibilityNotes.length ? bundle.compatibilityNotes.map(x => `<li>${x}</li>`).join('') : '<li>Manual handoff required between tools.</li>'}</ul>
            <div class="subhead">Official links</div>
            <div class="link-list">${bundle.sourceLinks.map(x => `<a href="${x.url}" target="_blank" rel="noreferrer">${x.name}</a>`).join('')}</div>
          </div>
        </details>
      </article>
    `;
  }).join('');
}

function scoreAndBuild() {
  const intent = parseIntent();
  const scored = TOOLS.map(tool => ({ ...tool, score: scoreTool(tool, intent) }));
  const bundles = buildBundles(scored, intent);
  state.lastBundles = bundles;
  renderSummary(bundles);
  renderBundles(bundles);
  els.resultsSection.classList.remove('hidden');
  els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function rerender() {
  renderChips(els.roleChips, ROLES, 'role');
  renderChips(els.budgetChips, BUDGETS, 'budget');
  renderChips(els.priorityChips, PRIORITIES, 'priority');
  renderChips(els.featureChips, FEATURES, 'features', true);
  renderToolTable();
  if (state.lastBundles.length) renderSummary(state.lastBundles), renderBundles(state.lastBundles);
}

function resetState() {
  state.role = 'founder';
  state.budget = 'mid';
  state.priority = 'best-output';
  state.features = new Set(['long-context', 'integrations']);
  state.useCase = '';
  els.useCaseInput.value = '';
  state.lastBundles = [];
  els.resultsSection.classList.add('hidden');
  rerender();
}

async function copyTopStack() {
  if (!state.lastBundles.length) return;
  const top = state.lastBundles[0];
  const text = `${top.bundleName}\n${top.tools.map(t => t.name).join(' + ')}\n${top.fitSummary}`;
  try { await navigator.clipboard.writeText(text); els.copyBtn.textContent = 'Copied'; setTimeout(() => els.copyBtn.textContent = 'Copy top stack', 1200); } catch {}
}

function init() {
  els.useCaseInput.addEventListener('input', (e) => { state.useCase = e.target.value; });
  els.findBtn.addEventListener('click', scoreAndBuild);
  els.recalcBtn.addEventListener('click', scoreAndBuild);
  els.resetBtn.addEventListener('click', resetState);
  els.copyBtn.addEventListener('click', copyTopStack);
  rerender();
}

init();
