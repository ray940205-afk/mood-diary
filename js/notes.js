/**
 * 情绪笔记 —— 卡片式时间线 + 月份/心情/类型筛选
 */
import { getAllEntries, deleteEntry } from './db.js';
import { formatDate, truncate, showToast, confirmDialog, EMOTION_TAGS, SELF_STRATEGY_TAGS, FAMILY_STRATEGY_TAGS, MOOD_TAGS } from './utils.js';

const ALL_STRATEGY_TAGS = [...SELF_STRATEGY_TAGS, ...FAMILY_STRATEGY_TAGS];
const expandedCards = new Set();
let currentMonth = 'all', currentMood = 'all', currentType = 'all';

export async function renderNotes() {
  currentMonth = 'all'; currentMood = 'all'; currentType = 'all'; expandedCards.clear();
  populateFilters();
  await loadAndRender();
}

function renderChips(containerId, chips, currentValue, onChange) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = chips.map(function(c) {
    var active = currentValue === c.value ? ' chip--active' : '';
    return '<button class="chip' + active + '" data-value="' + c.value + '">' + c.label + '</button>';
  }).join('');
  container.querySelectorAll('.chip').forEach(function(chip) {
    chip.addEventListener('click', async function() {
      // 更新样式
      container.querySelectorAll('.chip').forEach(function(b) { b.classList.remove('chip--active'); });
      chip.classList.add('chip--active');
      // 更新筛选
      onChange(chip.dataset.value);
      expandedCards.clear();
      await loadAndRender();
    });
  });
}

function populateFilters() {
  // 月份
  var now = new Date();
  var months = [{ value: 'all', label: '全部' }];
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'),
      label: d.getMonth()+1 + '月'
    });
  }
  renderChips('filter-month-chips', months, currentMonth, function(v) { currentMonth = v; });

  // 心情
  renderChips('filter-mood-chips', [
    { value: 'all', label: '全部心情' },
    { value: 'good', label: '😊 Nice' },
    { value: 'neutral', label: '😌 Peace' },
    { value: 'bad', label: '🥲 Bad' }
  ], currentMood, function(v) { currentMood = v; });

  // 类型
  renderChips('filter-type-chips', [
    { value: 'all', label: '全部类型' },
    { value: 'guided', label: '你问我答' },
    { value: 'free', label: '随记' },
    { value: 'dream', label: '梦境' },
    { value: 'quote', label: '语录' }
  ], currentType, function(v) { currentType = v; });
}

async function loadAndRender() {
  const filters = {};
  if (currentMonth !== 'all') filters.month = currentMonth;
  if (currentMood !== 'all') filters.mood = currentMood;
  if (currentType !== 'all') filters.type = currentType;
  const entries = await getAllEntries(filters);
  renderList(entries);
}

function renderList(entries) {
  const list = document.getElementById('entry-list'), empty = document.getElementById('empty-state');
  if (!list) return;
  if (entries.length === 0) { list.innerHTML = ''; if (empty) { empty.style.display = 'block'; list.appendChild(empty); } return; }
  if (empty) empty.style.display = 'none';

  list.innerHTML = entries.map(e => card(e, expandedCards.has(e.id))).join('');

  list.querySelectorAll('.entry-card').forEach(card => {
    card.querySelector('[data-toggle]')?.addEventListener('click', () => {
      expandedCards.has(card.dataset.id) ? expandedCards.delete(card.dataset.id) : expandedCards.add(card.dataset.id);
      loadAndRender();
    });
    card.querySelector('.btn--danger')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirmDialog('确定要删除吗？')) { await deleteEntry(card.dataset.id); expandedCards.delete(card.dataset.id); showToast('已删除'); await loadAndRender(); }
    });
  });
}

function card(entry, isExpanded) {
  const isGuided = entry.type === 'guided';
  const isQuote = entry.type === 'quote';
  const isDream = entry.type === 'dream';
  const isSelf = entry.role === 'self';

  let roleBadge = isSelf ? '<span class="entry-card__type">🌸 我的情绪</span>' : '<span class="entry-card__type entry-card__type--free">🤍 我和TA</span>';
  if (isQuote) roleBadge = '<span class="entry-card__type" style="background:#FFF9E6;color:#B8860B">⭐ 收藏语录</span>';
  if (isDream) roleBadge = '<span class="entry-card__type" style="background:#F5F0FF;color:#6B4C8A">🌙 梦境记录</span>';

  let summaryText = '';
  if (isQuote) summaryText = truncate(entry.content, 80);
  else if (isDream) summaryText = truncate(entry.content, 80) || '(梦境记录)';
  else if (isGuided) {
    // 只显示用户回答，去掉引导问题
    const answers = entry.content ? entry.content.split('\n\n').map(block => {
      const lines = block.split('\n');
      return lines.length > 1 ? lines.slice(1).join('\n') : block;
    }).filter(Boolean).join('；') : '';
    summaryText = answers ? truncate(answers, 80) : '(无记录内容)';
  }
  else summaryText = entry.title || truncate(entry.content, 60) || '(无标题)';

  let moodBadge = '';
  if (entry.mood) {
    const mt = MOOD_TAGS.find(m => m.id === entry.mood);
    if (mt) moodBadge = `<span class="mood-badge mood-badge--${entry.mood}">${mt.emoji} ${mt.label}</span>`;
  }

  // Tags
  const tags = [];
  if (entry.emotions) entry.emotions.forEach(eid => { const t = EMOTION_TAGS.find(et => et.id === eid); if (t) tags.push(`${t.emoji} ${t.label}`); });
  if (entry.strategies) entry.strategies.forEach(sid => { const t = ALL_STRATEGY_TAGS.find(st => st.id === sid); if (t) tags.push(`${t.emoji} ${t.label}`); });
  const tagsHtml = tags.length > 0 ? tags.slice(0,4).map(t => `<span class="entry-card__tag">${t}</span>`).join('') + (tags.length>4?`<span class="entry-card__tag">+${tags.length-4}</span>`:'') : '';

  const dreamInterp = entry.interpretation;
  const hasInterp = isDream && dreamInterp && dreamInterp.length > 0;

  let detailHtml = '';
  if (isDream) {
    detailHtml = `
      <div class="detail-row"><div class="detail-row__label">梦境描述</div><div class="detail-row__content" style="white-space:pre-wrap">${esc(entry.content)}</div></div>
      ${entry.mood ? `<div class="detail-row"><div class="detail-row__label">醒来心情</div><div class="detail-row__content">${(() => { const mt = MOOD_TAGS.find(m => m.id === entry.mood); return mt ? mt.emoji + ' ' + mt.label : ''; })()}</div></div>` : ''}
      ${hasInterp ? `
        <div class="dream-interp-collapse">
          <button class="dream-interp-toggle" data-id="${entry.id}" onclick="this.closest('.dream-interp-collapse').classList.toggle('dream-interp-collapse--open')">
            🌙 查看梦境解析 (${dreamInterp.length}个象征) <span class="dream-interp-arrow">▼</span>
          </button>
          <div class="dream-interp-body">
            ${dreamInterp.slice(0, 5).map(s => `
              <div class="dream-symbol dream-symbol--compact">
                <div class="dream-symbol__key">🔑 "${esc(s.matched)}"</div>
                <div class="dream-symbol__meaning">${esc(s.meaning)}</div>
                ${s.reflect ? `<div class="dream-symbol__reflect">💭 ${esc(s.reflect)}</div>` : ''}
                <div class="dream-symbol__source">—— ${esc(s.source)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  } else if (isQuote) {
    detailHtml = `<div class="detail-row"><div class="detail-row__content" style="font-style:italic;white-space:pre-wrap">${esc(entry.content)}</div></div>`;
  } else if (isGuided) {
    detailHtml += entry.content ? `<div class="detail-row"><div class="detail-row__content" style="white-space:pre-wrap">${esc(entry.content)}</div></div>` : '';
  } else {
    detailHtml += entry.content ? `<div class="detail-row"><div class="detail-row__label">全文</div><div class="detail-row__content" style="white-space:pre-wrap">${esc(entry.content)}</div></div>` : '';
  }
  if (entry.note) detailHtml += `<div class="detail-row"><div class="detail-row__label">备注</div><div class="detail-row__content">${esc(entry.note)}</div></div>`;
  // 图片
  if (entry.images && entry.images.length > 0) {
    detailHtml += `<div class="detail-row"><div class="detail-row__label">图片</div><div class="entry-images">${entry.images.map(src => `<img src="${src}" alt="">`).join('')}</div></div>`;
  }

  const typeLabel = isQuote ? '语录' : (isDream ? '梦境' : (isGuided ? '你问我答' : '随记'));

  return `<div class="entry-card ${isExpanded?'entry-card--expanded':''}" data-id="${entry.id}"><div data-toggle style="cursor:pointer"><div class="entry-card__header"><span class="entry-card__date">${formatDate(entry.date)}</span><div style="display:flex;gap:6px;align-items:center">${moodBadge}${roleBadge}<span class="entry-card__type" style="${isGuided?'':'background:var(--color-accent-light);color:#B8765A'}${isQuote?'background:#FFF9E6;color:#B8860B':''}">${typeLabel}</span></div></div><div class="entry-card__summary">${esc(summaryText)}</div>${tagsHtml?`<div class="entry-card__tags">${tagsHtml}</div>`:''}</div>${detailHtml?`<div class="entry-card__detail">${detailHtml}</div>`:''}<div class="entry-card__actions"><button class="btn btn--danger btn--sm">删除</button></div></div>`;
}

function esc(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
