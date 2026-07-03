/**
 * 随记 —— 标签插入文本 + 图片上传
 */
import { saveEntry } from './db.js';
import { currentRole } from './app.js';
import { uuid, today, showToast, EMOTION_TAGS, MOOD_TAGS } from './utils.js';
// Note: strategy tags removed from 随记 per user request

let selectedMood = '';
let pendingImages = []; // base64 图片数组

export function initFreeEntry() {
  selectedMood = '';
  pendingImages = [];

  document.getElementById('free-date').value = today();
  document.getElementById('free-title-input').value = '';
  document.getElementById('free-content').value = '';
  document.getElementById('free-title').textContent = '随记';
  document.getElementById('free-content-label').textContent = '内容';

  // 语录引用预填
  if (window.__quoteForFree) {
    document.getElementById('free-content').value = `引用：${window.__quoteForFree}\n\n我的看法：\n`;
    delete window.__quoteForFree;
  }

  renderPreviews();
  renderMood();
  renderTags();
  bindImageUpload();
}

// ====== 图片上传 ======

function bindImageUpload() {
  const btn = document.getElementById('btn-add-image');
  const input = document.getElementById('image-input');
  if (!btn || !input) return;

  // 清除旧监听器
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);

  document.getElementById('btn-add-image').addEventListener('click', () => {
    document.getElementById('image-input').click();
  });

  document.getElementById('image-input').addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files.length) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        pendingImages.push(ev.target.result);
        renderPreviews();
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });
}

function renderPreviews() {
  const container = document.getElementById('image-previews');
  if (!container) return;
  if (pendingImages.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = pendingImages.map((src, i) => `
    <div class="image-preview">
      <img src="${src}" alt="图片${i+1}">
      <button type="button" class="image-preview__remove" data-index="${i}"><i data-lucide="x" class="icon--xs"></i></button>
    </div>
  `).join('');

  // 删除按钮
  container.querySelectorAll('.image-preview__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingImages.splice(parseInt(btn.dataset.index), 1);
      renderPreviews();
    });
  });

  // 刷新 Lucide 图标
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
  grid.innerHTML = MOOD_TAGS.map(t => `<button type="button" class="mood-btn ${selectedMood===t.id?'mood-btn--selected':''}" data-mood="${t.id}"><span class="mood-btn__emoji">${t.emoji}</span><span class="mood-btn__label">${t.label}</span></button>`).join('');
  grid.querySelectorAll('.mood-btn').forEach(btn => { btn.addEventListener('click', () => {
    selectedMood = btn.dataset.mood;
    grid.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('mood-btn--selected'));
    btn.classList.add('mood-btn--selected');
  });});
}

// ====== 标签 —— 点击插入到内容区 ======

function renderTags() {
  const container = document.getElementById('free-emotions');
  if (!container) return;
  container.innerHTML = EMOTION_TAGS.map(t => `<button type="button" class="tag-btn" data-tag="${t.id}" data-text="${t.emoji} ${t.label}">${t.emoji} ${t.label}</button>`).join('');

  container.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('free-content');
      if (!textarea) return;
      const tagText = btn.dataset.text;
      const cur = textarea.value;
      // 在光标位置插入
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = cur.slice(0, start) + tagText + ' ' + cur.slice(end);
      // 光标移到插入文本后
      textarea.selectionStart = textarea.selectionEnd = start + tagText.length + 1;
      textarea.focus();
    });
  });
}

// ====== 保存 ======

export async function saveFreeEntry() {
  const role = currentRole;
  const date = document.getElementById('free-date').value;
  const title = document.getElementById('free-title-input').value.trim();
  const content = document.getElementById('free-content').value.trim();

  if (!content && pendingImages.length === 0) { showToast('请至少写一点内容或添加图片'); return; }

  const entry = {
    id: uuid(), type: 'free', role, date: date || today(), createdAt: Date.now(),
    title, content, mood: selectedMood, images: pendingImages,
  };

  try {
    await saveEntry(entry);
    showToast('记录已保存 💚');
    document.getElementById('free-title-input').value = '';
    document.getElementById('free-content').value = '';
    document.getElementById('free-date').value = today();
    selectedMood = ''; pendingImages = [];
    renderMood(); renderPreviews();
  } catch (err) { console.error(err); showToast('保存失败'); }
}
