const STORAGE_KEY = 'trendradar-data-v1';

const seedData = [
  {
    title: '多模态生成搜索',
    category: 'AI',
    stage: '试点',
    momentum: 5,
    relevance: 5,
    confidence: 4,
    description: '将 RAG 与多模态模型结合，用实时数据生成答案与素材。',
    lastUpdate: '2024-10-01',
    owner: '产品团队'
  },
  {
    title: '低代码自动化运营',
    category: 'Automation',
    stage: '扩张',
    momentum: 4,
    relevance: 4,
    confidence: 5,
    description: '用低代码工作流整合 CRM、短信和企业微信，实现拉新-转化闭环。',
    lastUpdate: '2024-09-18',
    owner: '增长团队'
  },
  {
    title: '数据合同与可追溯链路',
    category: 'Data',
    stage: '探索',
    momentum: 3,
    relevance: 4,
    confidence: 3,
    description: '在内部数据流转中引入 data contract 与 lineage，减少回归故障。',
    lastUpdate: '2024-08-12',
    owner: '数据平台'
  },
  {
    title: '语音客服 copilots',
    category: 'AI',
    stage: '试点',
    momentum: 4,
    relevance: 3,
    confidence: 3,
    description: '在语音渠道上部署实时意图识别和回复建议，提升首次解决率。',
    lastUpdate: '2024-09-30',
    owner: '客服运营'
  },
  {
    title: '第一方数据采集与隐私计算',
    category: 'Marketing',
    stage: '探索',
    momentum: 3,
    relevance: 5,
    confidence: 4,
    description: '在合规前提下采集第一方数据，并通过隐私计算对外合作。',
    lastUpdate: '2024-07-22',
    owner: '合规与市场'
  }
];

const cardsEl = document.getElementById('cards');
const radarCanvas = document.getElementById('radarCanvas');
const statsEl = document.getElementById('stats');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const form = document.getElementById('trendForm');

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...seedData];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...seedData];
    return parsed;
  } catch (err) {
    console.warn('Failed to load from storage, using seed data', err);
    return [...seedData];
  }
}

let trends = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trends));
}

function momentumBadge(value) {
  if (value >= 4) return 'hot';
  if (value >= 3) return 'warm';
  return 'cool';
}

function renderCategories() {
  const cats = Array.from(new Set(trends.map(t => t.category)));
  categoryFilter.innerHTML = '<option value="all">全部类别</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderCards() {
  const keyword = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const filtered = trends.filter(t => {
    const matchesKeyword = t.title.toLowerCase().includes(keyword) || (t.description || '').toLowerCase().includes(keyword);
    const matchesCategory = category === 'all' || t.category === category;
    return matchesKeyword && matchesCategory;
  });

  cardsEl.innerHTML = '';
  filtered.forEach(trend => {
    const badge = momentumBadge(trend.momentum);
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="meta">${trend.category} · ${trend.stage}</div>
      <h3>${trend.title}</h3>
      <p>${trend.description || '暂无描述'}</p>
      <div class="meta">动能 ${trend.momentum} · 相关度 ${trend.relevance} · 信心度 ${trend.confidence}</div>
      <div class="meta">${trend.owner || '未指定'} · 更新于 ${trend.lastUpdate || 'N/A'}</div>
      <span class="badge ${badge}">${badge === 'hot' ? '高动能' : badge === 'warm' ? '成长中' : '观察中'}</span>
    `;
    cardsEl.appendChild(card);
  });

  renderStats(filtered);
  drawRadar(filtered);
}

function renderStats(items) {
  if (!items.length) {
    statsEl.innerHTML = '<p>暂无数据，添加一条趋势或调整筛选条件。</p>';
    return;
  }
  const avg = (key) => (items.reduce((sum, t) => sum + Number(t[key] || 0), 0) / items.length).toFixed(1);
  const hottest = [...items].sort((a, b) => b.momentum - a.momentum)[0];
  const latest = [...items].sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0))[0];

  statsEl.innerHTML = `
    <div class="stat-card"><h4>趋势数量</h4><p>${items.length}</p></div>
    <div class="stat-card"><h4>平均动能</h4><p>${avg('momentum')}</p></div>
    <div class="stat-card"><h4>平均相关度</h4><p>${avg('relevance')}</p></div>
    <div class="stat-card"><h4>平均信心度</h4><p>${avg('confidence')}</p></div>
    <div class="stat-card"><h4>最高动能</h4><p>${hottest.title}</p><small>${hottest.momentum} · ${hottest.category}</small></div>
    <div class="stat-card"><h4>最近更新</h4><p>${latest.lastUpdate || 'N/A'}</p><small>${latest.title}</small></div>
  `;
}

function drawRadar(items) {
  const ctx = radarCanvas.getContext('2d');
  ctx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

  const center = { x: radarCanvas.width / 2, y: radarCanvas.height / 2 };
  const maxRadius = Math.min(center.x, center.y) - 20;
  const axes = ['momentum', 'relevance', 'confidence'];
  const angles = axes.map((_, i) => (Math.PI * 2 * i) / axes.length - Math.PI / 2);

  // grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    angles.forEach((angle, i) => {
      const radius = (maxRadius / 5) * level;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // labels
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Inter, sans-serif';
  axes.forEach((axis, i) => {
    const angle = angles[i];
    const x = center.x + Math.cos(angle) * (maxRadius + 12);
    const y = center.y + Math.sin(angle) * (maxRadius + 12);
    ctx.fillText(axis.toUpperCase(), x - 20, y + 4);
  });

  if (!items.length) return;

  const avg = axes.map(axis => items.reduce((sum, t) => sum + Number(t[axis] || 0), 0) / items.length);
  const points = avg.map((value, i) => {
    const angle = angles[i];
    const radius = (maxRadius / 5) * value;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  });

  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function handleExport() {
  const blob = new Blob([JSON.stringify(trends, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trendradar-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('文件格式需为数组');
      trends = parsed.map(normalizeTrend);
      saveData();
      renderCategories();
      renderCards();
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function normalizeTrend(item) {
  return {
    title: item.title || '未命名趋势',
    category: item.category || '未分类',
    stage: item.stage || '探索',
    momentum: clampNumber(item.momentum, 1, 5, 3),
    relevance: clampNumber(item.relevance, 1, 5, 3),
    confidence: clampNumber(item.confidence, 1, 5, 3),
    description: item.description || '',
    lastUpdate: item.lastUpdate || new Date().toISOString().slice(0, 10),
    owner: item.owner || '未指定'
  };
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function setupForm() {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const trend = normalizeTrend(Object.fromEntries(data.entries()));
    trends.unshift(trend);
    saveData();
    renderCategories();
    renderCards();
    form.reset();
  });
}

searchInput.addEventListener('input', renderCards);
categoryFilter.addEventListener('change', renderCards);
exportBtn.addEventListener('click', handleExport);
importFile.addEventListener('change', handleImport);

setupForm();
renderCategories();
renderCards();
