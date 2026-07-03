/**
 * 随记 —— 标签插入文本 + 图片上传 + 标签管理
 */
import { saveEntry } from './db.js';
import { currentRole } from './app.js';
import { uuid, today, showToast, MOOD_TAGS, getAllEmotionTags, addCustomTag, removeCustomTag, updateTag, getCustomTags, getTagOverrides, EMOTION_TAGS } from './utils.js';

var selectedMood = '';
var pendingImages = [];

export function initFreeEntry() {
  selectedMood = '';
  pendingImages = [];

  document.getElementById('free-date').value = today();
  document.getElementById('free-content').value = '';
  document.getElementById('free-title').textContent = '随记';
  document.getElementById('free-content-label').textContent = '内容';
  var panel = document.getElementById('free-tag-panel');
  if (panel) panel.style.display = 'none';

  if (window.__quoteForFree) {
    document.getElementById('free-content').value = '引用：' + window.__quoteForFree + '\n\n反驳！反驳！反驳！\n';
    delete window.__quoteForFree;
  }

  renderPreviews();
  renderMood();
  bindImageUpload();
  bindTagPanel();
}

// ====== 图片上传 ======
function bindImageUpload() {
  var imgBtn = document.getElementById('btn-add-image');
  var imgInput = document.getElementById('image-input');
  if (!imgBtn || !imgInput) return;
  imgBtn.onclick = function() { imgInput.click(); };
  imgInput.onchange = function(e) {
    var files = e.target.files;
    if (!files.length) return;
    Array.from(files).forEach(function(file) {
      if (!file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function(ev) { pendingImages.push(ev.target.result); renderPreviews(); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
}

function renderPreviews() {
  var container = document.getElementById('image-previews');
  if (!container) return;
  if (pendingImages.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = pendingImages.map(function(src, i) {
    return '<div class="image-preview"><img src="' + src + '" alt="图片' + (i+1) + '"><button type="button" class="image-preview__remove" data-index="' + i + '">✕</button></div>';
  }).join('');
  container.querySelectorAll('.image-preview__remove').forEach(function(btn) {
    btn.addEventListener('click', function() { pendingImages.splice(parseInt(btn.dataset.index), 1); renderPreviews(); });
  });
}

// ====== 心情 ======
function renderMood() {
  var grid = document.getElementById('free-mood');
  if (!grid) {
    var form = document.getElementById('free-form');
    var submit = form.querySelector('button[type="submit"]');
    var div = document.createElement('div');
    div.className = 'form-group';
    div.id = 'free-mood-group';
    div.innerHTML = '<label class="form-label">此刻的心情</label><div class="mood-grid" id="free-mood"></div>';
    form.insertBefore(div, submit);
    grid = document.getElementById('free-mood');
  }
  if (!grid) return;
  grid.innerHTML = MOOD_TAGS.map(function(t) {
    var sel = selectedMood === t.id ? ' mood-btn--selected' : '';
    return '<button type="button" class="mood-btn' + sel + '" data-mood="' + t.id + '"><span class="mood-btn__emoji">' + t.emoji + '</span><span class="mood-btn__label">' + t.label + '</span></button>';
  }).join('');
  grid.querySelectorAll('.mood-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedMood = btn.dataset.mood;
      grid.querySelectorAll('.mood-btn').forEach(function(b) { b.classList.remove('mood-btn--selected'); });
      btn.classList.add('mood-btn--selected');
    });
  });
}

// ====== 标签面板 ======
function bindTagPanel() {
  var toggleBtn = document.getElementById('btn-toggle-tags');
  var panel = document.getElementById('free-tag-panel');
  if (!toggleBtn || !panel) return;
  toggleBtn.onclick = function() {
    var open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) renderTagPanel(panel);
  };
}

function renderTagPanel(panel) {
  var allTags = getAllEmotionTags();
  var overrides = getTagOverrides();
  var customTags = getCustomTags();
  var currentCount = customTags.length;
  var limitReached = currentCount >= 20;

  var rows = '';
  EMOTION_TAGS.forEach(function(t) {
    var ov = overrides[t.id];
    rows += tagRow(t.id, ov ? ov.emoji : t.emoji, ov ? ov.label : t.label, !!ov, false);
  });
  customTags.forEach(function(t) { rows += tagRow(t.id, t.emoji, t.label, false, true); });

  var tagBtns = allTags.map(function(t) {
    return '<button type="button" class="tag-btn" data-text="' + t.emoji + ' ' + t.label + '">' + t.emoji + ' ' + t.label + '</button>';
  }).join('');

  var addRow = limitReached ? '<p class="tm-limit-hint">已达上限 20 个</p>' :
    '<div class="tm-row">' +
    '<input class="tm-emoji" id="free-new-emoji" value="🏷️" maxlength="4" size="4">' +
    '<input class="tm-label" id="free-new-label" placeholder="新标签名" maxlength="10">' +
    '<button class="tm-btn tm-save" id="free-add-tag" title="确认添加">✓</button></div>';

  panel.innerHTML = '<div class="tag-manager__title">插入标签 <span class="tm-count">' + currentCount + '/20</span></div>' +
    '<div class="tag-grid" id="free-tag-grid">' + tagBtns + '</div>' +
    '<details class="free-tag-edit"><summary class="free-tag-edit__summary">✏️ 管理标签</summary>' +
    '<div class="tag-manager__list">' + rows + '</div>' + addRow + '</details>';

  panel.querySelectorAll('#free-tag-grid .tag-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var textarea = document.getElementById('free-content');
      if (!textarea) return;
      var tagText = btn.dataset.text;
      var s = textarea.selectionStart, e = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, s) + tagText + ' ' + textarea.value.slice(e);
      textarea.selectionStart = textarea.selectionEnd = s + tagText.length + 1;
      textarea.focus();
    });
  });

  panel.querySelectorAll('.tm-del').forEach(function(btn) { btn.onclick = function() { removeCustomTag(btn.dataset.id); renderTagPanel(panel); }; });
  panel.querySelectorAll('.tm-save').forEach(function(btn) {
    btn.onclick = function() {
      var row = btn.closest('.tm-row');
      if (!row.dataset.id) return;
      var id = row.dataset.id;
      var label = row.querySelector('.tm-label').value.trim();
      var emoji = row.querySelector('.tm-emoji').value.trim() || '🏷️';
      if (!label) { showToast('标签名不能为空'); return; }
      updateTag(id, label, emoji);
      renderTagPanel(panel);
    };
  });
  panel.querySelectorAll('.tm-reset').forEach(function(btn) {
    btn.onclick = function() {
      var ov = getTagOverrides();
      delete ov[btn.dataset.id];
      localStorage.setItem('mood-diary-tag-overrides', JSON.stringify(ov));
      renderTagPanel(panel);
    };
  });
  var addBtn = document.getElementById('free-add-tag');
  if (addBtn) addBtn.onclick = function() {
    var label = document.getElementById('free-new-label').value.trim();
    var emoji = document.getElementById('free-new-emoji').value.trim() || '🏷️';
    if (!label) { showToast('请输入标签名'); return; }
    if (getCustomTags().length >= 20) { showToast('已达上限 20 个'); return; }
    addCustomTag(label, emoji);
    renderTagPanel(panel);
  };
}

function tagRow(id, emoji, label, edited, isCustom) {
  var resetBtn = edited ? '<button class="tm-btn tm-reset" data-id="' + id + '" title="还原默认">↩</button>' : '';
  var delBtn = isCustom ? '<button class="tm-btn tm-del" data-id="' + id + '" title="删除">×</button>' : '';
  return '<div class="tm-row" data-id="' + id + '">' +
    '<input class="tm-emoji" value="' + esc(emoji) + '" maxlength="4" size="4">' +
    '<input class="tm-label" value="' + esc(label) + '" maxlength="10">' +
    '<button class="tm-btn tm-save" title="保存">✓</button>' + resetBtn + delBtn + '</div>';
}

function esc(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ====== 保存 ======
export async function saveFreeEntry() {
  var role = currentRole;
  var date = document.getElementById('free-date').value;
  var content = document.getElementById('free-content').value.trim();
  if (!content && pendingImages.length === 0) { showToast('请至少写一点内容或添加图片'); return; }
  var entry = { id: uuid(), type: 'free', role: role, date: date || today(), createdAt: Date.now(), content: content, mood: selectedMood, images: pendingImages };
  try {
    await saveEntry(entry);
    showToast('记录已保存 💚');
    document.getElementById('free-content').value = '';
    document.getElementById('free-date').value = today();
    selectedMood = ''; pendingImages = [];
    renderMood(); renderPreviews();
  } catch (err) { console.error(err); showToast('保存失败'); }
}
