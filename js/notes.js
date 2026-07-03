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
  populateMonthFilter();
  await loadAndRender();
}

function populateMonthFilter() {
  const sel = document.getElementById('filter-month');
  if (!sel) return;
  const now = new Date();
  let html = '<option value="all">全部月份</option>';
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = `${d.getFullYear()}年${d.getMonth()+1}月`;
    html += `<option value="${val}" ${currentMonth===val?'selected':''}>${label}</option>`;
  }
  sel.innerHTML = html;
  sel.onchange = async () => { currentMonth = sel.value; expandedCards.clear(); await loadAndRender(); };

  document.getElementById('filter-mood').onchange = async (e) => { currentMood = e.target.value; expandedCards.clear(); await loadAndRender(); };
  document.getElementById('filter-type').onchange = async (e) => { currentType = e.target.value; expandedCards.clear(); await loadAndRender(); };
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
  const isSelf = entry.role === 'self';

  let roleBadge = isSelf ? '<span class="entry-card__type">🌸 我的情绪</span>' : '<span class="entry-card__type entry-card__type--free">🤍 我和TA</span>';
  if (isQuote) roleBadge = '<span class="entry-card__type" style="background:#FFF9E6;color:#B8860B">⭐ 收藏语录</span>';

  let summaryText = '';
  if (isQuote) summaryText = truncate(entry.content, 80);
  else if (isGuided) summaryText = entry.trigger || '(无事件描述)';
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

  let detailHtml = '';
  if (isQuote) {
    detailHtml = `<div class="detail-row"><div class="detail-row__content" style="font-style:italic;white-space:pre-wrap">${esc(entry.content)}</div></div>`;
  } else if (isGuided) {
    if (!isSelf) detailHtml += entry.patientReaction ? `<div class="detail-row"><div class="detail-row__label">TA的状态</div><div class="detail-row__content">${esc(entry.patientReaction)}</div></div>` : '';
    detailHtml += entry.emotionText ? `<div class="detail-row"><div class="detail-row__label">感受</div><div class="detail-row__content">${esc(entry.emotionText)}</div></div>` : '';
    detailHtml += entry.strategyNote ? `<div class="detail-row"><div class="detail-row__label">应对细节</div><div class="detail-row__content">${esc(entry.strategyNote)}</div></div>` : '';
  } else {
    detailHtml += entry.content ? `<div class="detail-row"><div class="detail-row__label">全文</div><div class="detail-row__content" style="white-space:pre-wrap">${esc(entry.content)}</div></div>` : '';
  }
  if (entry.note) detailHtml += `<div class="detail-row"><div class="detail-row__label">备注</div><div class="detail-row__content">${esc(entry.note)}</div></div>`;
  // 图片
  if (entry.images && entry.images.length > 0) {
    detailHtml += `<div class="detail-row"><div class="detail-row__label">图片</div><div class="entry-images">${entry.images.map(src => `<img src="${src}" alt="">`).join('')}</div></div>`;
  }

  const typeLabel = isQuote ? '语录' : (isGuided ? '你问我答' : '随记');

  return `<div class="entry-card ${isExpanded?'entry-card--expanded':''}" data-id="${entry.id}"><div data-toggle style="cursor:pointer"><div class="entry-card__header"><span class="entry-card__date">${formatDate(entry.date)}</span><div style="display:flex;gap:6px;align-items:center">${moodBadge}${roleBadge}<span class="entry-card__type" style="${isGuided?'':'background:var(--color-accent-light);color:#B8765A'}${isQuote?'background:#FFF9E6;color:#B8860B':''}">${typeLabel}</span></div></div><div class="entry-card__summary">${esc(summaryText)}</div>${tagsHtml?`<div class="entry-card__tags">${tagsHtml}</div>`:''}</div>${detailHtml?`<div class="entry-card__detail">${detailHtml}</div>`:''}<div class="entry-card__actions"><button class="btn btn--danger btn--sm">删除</button></div></div>`;
}

function esc(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
