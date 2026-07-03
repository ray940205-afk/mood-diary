/**
 * 历史记录页面 —— 支持角色筛选
 */
import { getAllEntries, deleteEntry } from './db.js';
import {
  formatDate, formatTime, truncate, showToast, confirmDialog,
  EMOTION_TAGS, SELF_STRATEGY_TAGS, FAMILY_STRATEGY_TAGS, debounce,
} from './utils.js';

let currentRoleFilter = 'all'; // 'all' | 'self' | 'family'
let currentEmotionFilter = 'all';
let currentSearch = '';
const expandedCards = new Set();

/** 合并所有策略标签用于展示 */
const ALL_STRATEGY_TAGS = [...SELF_STRATEGY_TAGS, ...FAMILY_STRATEGY_TAGS];

/**
 * 渲染历史页面
 */
export async function renderHistory() {
  currentRoleFilter = 'all';
  currentEmotionFilter = 'all';
  currentSearch = '';
  expandedCards.clear();

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  bindSearch();
  await loadAndRender();
  renderFilterChips();
}

async function loadAndRender() {
  const filters = {};

  if (currentRoleFilter !== 'all') {
    filters.role = currentRoleFilter;
  }

  if (currentEmotionFilter !== 'all') {
    filters.emotion = currentEmotionFilter;
  }

  if (currentSearch) {
    filters.search = currentSearch;
  }

  const entries = await getAllEntries(filters);
  renderEntryList(entries);
}

function renderFilterChips() {
  const container = document.getElementById('filter-chips');
  if (!container) return;

  let html = '';

  // 角色筛选
  html += `<button class="chip ${currentRoleFilter === 'all' ? 'chip--active' : ''}" data-role="all">全部</button>`;
  html += `<button class="chip ${currentRoleFilter === 'self' ? 'chip--active' : ''}" data-role="self">📝 我的记录</button>`;
  html += `<button class="chip ${currentRoleFilter === 'family' ? 'chip--active' : ''}" data-role="family">💝 陪伴记录</button>`;

  html += '<span style="color:var(--color-border);margin:0 2px">|</span>';

  // 情绪筛选
  html += `<button class="chip chip--emotion ${currentEmotionFilter === 'all' ? 'chip--active' : ''}" data-emotion="all">全部情绪</button>`;
  EMOTION_TAGS.forEach((t) => {
    html += `<button class="chip chip--emotion ${currentEmotionFilter === t.id ? 'chip--active' : ''}" data-emotion="${t.id}">${t.emoji} ${t.label}</button>`;
  });

  container.innerHTML = html;

  // 绑定角色筛选
  container.querySelectorAll('.chip[data-role]').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentRoleFilter = chip.dataset.role;
      expandedCards.clear();
      renderFilterChips();
      loadAndRender();
    });
  });

  // 绑定情绪筛选
  container.querySelectorAll('.chip[data-emotion]').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentEmotionFilter = chip.dataset.emotion;
      expandedCards.clear();
      renderFilterChips();
      loadAndRender();
    });
  });
}

function renderEntryList(entries) {
  const list = document.getElementById('entry-list');
  const empty = document.getElementById('empty-state');

  if (!list) return;

  if (entries.length === 0) {
    list.innerHTML = '';
    if (empty) { empty.style.display = 'block'; list.appendChild(empty); }
    return;
  }

  if (empty) empty.style.display = 'none';

  list.innerHTML = entries.map((entry) => renderEntryCard(entry, expandedCards.has(entry.id))).join('');

  // 展开/收起
  list.querySelectorAll('.entry-card').forEach((card) => {
    const toggle = card.querySelector('[data-toggle]');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const id = card.dataset.id;
        expandedCards.has(id) ? expandedCards.delete(id) : expandedCards.add(id);
        loadAndRender();
      });
    }

    const delBtn = card.querySelector('.btn--danger');
    if (delBtn) {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirmDialog('确定要删除这条记录吗？')) {
          await deleteEntry(card.dataset.id);
          expandedCards.delete(card.dataset.id);
          showToast('已删除');
          await loadAndRender();
          renderFilterChips();
        }
      });
    }
  });
}

function renderEntryCard(entry, isExpanded) {
  const isGuided = entry.type === 'guided';
  const isSelf = entry.role === 'self';

  // 角色标识
  const roleBadge = isSelf
    ? '<span class="entry-card__type">📝 我的记录</span>'
    : '<span class="entry-card__type entry-card__type--free">💝 陪伴记录</span>';

  // 摘要文本
  let summaryText = '';
  if (isGuided) {
    summaryText = entry.trigger || '(无触发事件描述)';
  } else {
    summaryText = entry.title || truncate(entry.content, 60) || '(无标题)';
  }

  // 标签
  const tags = [];
  if (entry.emotions) {
    entry.emotions.forEach((eid) => {
      const t = EMOTION_TAGS.find((et) => et.id === eid);
      if (t) tags.push(`${t.emoji} ${t.label}`);
    });
  }
  if (entry.strategies) {
    entry.strategies.forEach((sid) => {
      const t = ALL_STRATEGY_TAGS.find((st) => st.id === sid);
      if (t) tags.push(`${t.emoji} ${t.label}`);
    });
  }

  const tagsHtml = tags.length > 0
    ? tags.slice(0, 4).map((t) => `<span class="entry-card__tag">${t}</span>`).join('') +
      (tags.length > 4 ? `<span class="entry-card__tag">+${tags.length - 4}</span>` : '')
    : '';

  // 详情
  let detailHtml = '';
  if (isGuided) {
    if (isSelf) {
      detailHtml = `
        ${entry.strategyNote ? `<div class="detail-row"><div class="detail-row__label">应对细节</div><div class="detail-row__content">${esc(entry.strategyNote)}</div></div>` : ''}
        ${entry.effectiveness ? `<div class="detail-row"><div class="detail-row__label">感受评分</div><div class="detail-row__content">${stars(entry.effectiveness)}</div></div>` : ''}
      `;
    } else {
      detailHtml = `
        ${entry.patientReaction ? `<div class="detail-row"><div class="detail-row__label">TA的状态</div><div class="detail-row__content">${esc(entry.patientReaction)}</div></div>` : ''}
        ${entry.strategyNote ? `<div class="detail-row"><div class="detail-row__label">应对细节</div><div class="detail-row__content">${esc(entry.strategyNote)}</div></div>` : ''}
        ${entry.effectiveness ? `<div class="detail-row"><div class="detail-row__label">效果评分</div><div class="detail-row__content">${stars(entry.effectiveness)}</div></div>` : ''}
      `;
    }
  } else {
    detailHtml = `
      ${entry.content ? `<div class="detail-row"><div class="detail-row__label">全文</div><div class="detail-row__content" style="white-space:pre-wrap">${esc(entry.content)}</div></div>` : ''}
    `;
  }

  if (entry.note) {
    detailHtml += `<div class="detail-row"><div class="detail-row__label">备注</div><div class="detail-row__content">${esc(entry.note)}</div></div>`;
  }

  const typeLabel = isGuided ? '引导记录' : '自由书写';

  return `
    <div class="entry-card ${isExpanded ? 'entry-card--expanded' : ''}" data-id="${entry.id}">
      <div data-toggle style="cursor:pointer">
        <div class="entry-card__header">
          <span class="entry-card__date">${formatDate(entry.date)}</span>
          <div style="display:flex;gap:6px">
            ${roleBadge}
            <span class="entry-card__type ${isGuided ? '' : 'entry-card__type--free'}" style="${isGuided ? '' : 'background:var(--color-accent-light);color:#B8765A;'}">${isGuided ? '引导' : '自由'}</span>
          </div>
        </div>
        <div class="entry-card__summary">${esc(summaryText)}</div>
        ${tagsHtml ? `<div class="entry-card__tags">${tagsHtml}</div>` : ''}
      </div>
      ${detailHtml ? `<div class="entry-card__detail">${detailHtml}</div>` : ''}
      <div class="entry-card__actions">
        <button class="btn btn--danger btn--sm">删除</button>
      </div>
    </div>
  `;
}

function stars(n) {
  return [1,2,3,4,5].map((s) => `<span class="effectiveness-star ${s <= n ? 'effectiveness-star--filled' : ''}">★</span>`).join('');
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ====== 搜索 ======
let searchBound = false;

function bindSearch() {
  if (searchBound) return;
  searchBound = true;

  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', debounce(async (e) => {
    currentSearch = e.target.value.trim();
    expandedCards.clear();
    await loadAndRender();
  }, 400));
}
