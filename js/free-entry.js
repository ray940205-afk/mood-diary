/**
 * 随记 —— 标签插入文本 + 图片上传 + 标签管理
 */
import { saveEntry } from './db.js';
import { currentRole } from './app.js';
import { uuid, today, showToast, MOOD_TAGS, getAllEmotionTags, addCustomTag, removeCustomTag, updateTag, getCustomTags, getTagOverrides, EMOTION_TAGS } from './utils.js';

let selectedMood = '';
let pendingImages = [];

export function initFreeEntry() {
  selectedMood = '';
  pendingImages = [];

  document.getElementById('free-date').value = today();
  document.getElementById('free-content').value = '';
  document.getElementById('free-title').textContent = '随记';
  document.getElementById('free-content-label').textContent = '内容';
  document.getElementById('free-tag-panel').style.display = 'none';

  if (window.__quoteForFree) {
    document.getElementById('free-content').value = `引用：${window.__quoteForFree}\n\n反驳！反驳！反驳！\n`;
    delete window.__quoteForFree;
  }

  renderPreviews();
  renderMood();
  bindImageUpload();
  bindTagPanel();
}

// ====== 图片上传 ======

function bindImageUpload() {
  document.getElementById('btn-add-image').onclick = () => document.getElementById('image-input').click();
  document.getElementById('image-input').onchange = (e) => {
    const files = e.target.files;
    if (!files.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => { pendingImages.push(ev.target.result); renderPreviews(); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
}

function renderPreviews() {
  const container = document.getElementById('image-previews');
  if (!container) return;
  if (pendingImages.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = pendingImages.map((src, i) =>
    `<div class="image-preview"><img src="${src}" alt="图片${i+1}"><button type="button" class="image-preview__remove" data-index="${i}"><i data-lucide="x" class="icon--xs"></i></button></div>`
  ).join('');
  container.querySelectorAll('.image-preview__remove').forEach(btn => {
    btn.addEventListener('click', () => { pendingImages.splice(parseInt(btn.dataset.index), 1); renderPreviews(); });
  });
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
}

// ====== 心情 ======

function renderMood() {
  let grid = document.getElementById('free-mood');
  if (!grid) {
    const form = document.getElementById('free-form');
    const submit = form.querySelector('button[type="submit"]');
    const div = document.createElement('div');
    div.className = 'form-group';
    div.id = 'free-mood-group';
    div.innerHTML = '<label class="form-label">此刻的心情</label><div class="mood-grid" id="free-mood"></div>';
    form.insertBefore(div, submit);
    grid = document.getElementById('free-mood');
  }
  if (!grid) return;
  grid.innerHTML = MOOD_TAGS.map(t =>
    `<button type="button" class="mood-btn ${selectedMood===t.id?'mood-btn--selected':''}" data-mood="${t.id}"><span class="mood-btn__emoji">${t.emoji}</span><span class="mood-btn__label">${t.label}</span></button>`
  ).join('');
  grid.querySelectorAll('.mood-btn').forEach(btn => { btn.addEventListener('click', () => {
    selectedMood = btn.dataset.mood;
    grid.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('mood-btn--selected'));
    btn.classList.add('mood-btn--selected');
  });});
}

// ====== 标签面板（点击标签插入 + 管理标签） ======

function bindTagPanel() {
  const toggleBtn = document.getElementById('btn-toggle-tags');
  const panel = document.getElementById('free-tag-panel');
  if (!toggleBtn || !panel) return;

  toggleBtn.onclick = () => {
    const open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) renderTagPanel(panel);
  };
}

function renderTagPanel(panel) {
  const allTags = getAllEmotionTags();
  const overrides = getTagOverrides();
  const customTags = getCustomTags();
  const currentCount = customTags.length;
  const limitReached = currentCount >= 20;

  let rows = '';
  EMOTION_TAGS.forEach(t => {
    const ov = overrides[t.id];
    rows += tagRow(t.id, ov ? ov.emoji : t.emoji, ov ? ov.label : t.label, !!ov, false);
  });
  customTags.forEach(t => { rows += tagRow(t.id, t.emoji, t.label, false, true); });

  panel.innerHTML = `
    <div class="tag-manager__title">插入标签 <span class="tm-count">${currentCount}/20</span></div>
    <div class="tag-grid" id="free-tag-grid">${allTags.map(t =>
      `<button type="button" class="tag-btn" data-text="${t.emoji} ${t.label}">${t.emoji} ${t.label}</button>`
    ).join('')}</div>
    <details class="free-tag-edit">
      <summary class="free-tag-edit__summary">✏️ 管理标签</summary>
      <div class="tag-manager__list">${rows}</div>
      ${limitReached ? '<p class="tm-limit-hint">已达上限 20 个</p>' : `
      <div class="tm-row">
        <input class="tm-emoji" id="free-new-emoji" value="🏷️" maxlength="4" size="4">
        <input class="tm-label" id="free-new-label" placeholder="新标签名" maxlength="10">
        <button class="tm-btn tm-save" id="free-add-tag" title="确认添加">✓</button>
      </div>`}
    </details>
  `;

  // 点标签插入到内容区
  panel.querySelectorAll('#free-tag-grid .tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('free-content');
      if (!textarea) return;
      const tagText = btn.dataset.text;
      const s = textarea.selectionStart, e = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, s) + tagText + ' ' + textarea.value.slice(e);
      textarea.selectionStart = textarea.selectionEnd = s + tagText.length + 1;
      textarea.focus();
    });
  });

  // 删除
  panel.querySelectorAll('.tm-del').forEach(btn => { btn.onclick = () => {
    removeCustomTag(btn.dataset.id);
    renderTagPanel(panel);
  };});

  // 保存编辑
  panel.querySelectorAll('.tm-save').forEach(btn => { btn.onclick = () => {
    const row = btn.closest('.tm-row');
    if (!row.dataset.id) return; // 这是"添加"按钮，由单独逻辑处理
    const id = row.dataset.id;
    const label = row.querySelector('.tm-label').value.trim();
    const emoji = row.querySelector('.tm-emoji').value.trim() || '🏷️';
    if (!label) { showToast('标签名不能为空'); return; }
    updateTag(id, label, emoji);
    renderTagPanel(panel);
  };});

  // 还原
  panel.querySelectorAll('.tm-reset').forEach(btn => { btn.onclick = () => {
    const overrides = getTagOverrides();
    delete overrides[btn.dataset.id];
    localStorage.setItem('mood-diary-tag-overrides', JSON.stringify(overrides));
    renderTagPanel(panel);
  };});

  // 添加
  const addBtn = document.getElementById('free-add-tag');
  if (addBtn) addBtn.onclick = () => {
    const label = document.getElementById('free-new-label').value.trim();
    const emoji = document.getElementById('free-new-emoji').value.trim() || '🏷️';
    if (!label) { showToast('请输入标签名'); return; }
    if (getCustomTags().length >= 20) { showToast('已达上限 20 个'); return; }
    addCustomTag(label, emoji);
    renderTagPanel(panel);
  };
}

function tagRow(id, emoji, label, edited, isCustom) {
  return `
    <div class="tm-row" data-id="${id}">
      <input class="tm-emoji" value="${esc(emoji)}" maxlength="4" size="4">
      <input class="tm-label" value="${esc(label)}" maxlength="10">
      <button class="tm-btn tm-save" title="保存">✓</button>
      ${edited ? `<button class="tm-btn tm-reset" data-id="${id}" title="还原默认">↩</button>` : ''}
      ${isCustom ? `<button class="tm-btn tm-del" data-id="${id}" title="删除">×</button>` : ''}
    </div>
  `;
}

function esc(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ====== 保存 ======

export async function saveFreeEntry() {
  const role = currentRole;
  const date = document.getElementById('free-date').value;
  const content = document.getElementById('free-content').value.trim();

  if (!content && pendingImages.length === 0) { showToast('请至少写一点内容或添加图片'); return; }

  const entry = { id: uuid(), type: 'free', role, date: date || today(), createdAt: Date.now(), content, mood: selectedMood, images: pendingImages };

  try {
    await saveEntry(entry);
    showToast('记录已保存 💚');
    document.getElementById('free-content').value = '';
    document.getElementById('free-date').value = today();
    selectedMood = ''; pendingImages = [];
    renderMood(); renderPreviews();
  } catch (err) { console.error(err); showToast('保存失败'); }
}
