/**
 * 管理笔记 —— 统计 + 主题 + 反馈
 */
import { getStats, saveEntry, getAllEntries, deleteEntry } from './db.js';
import { showToast, uuid, today } from './utils.js';
import { getUserName } from './user.js';

window.pickColor = function(color) {
  document.body.style.backgroundColor = color === 'lavender' ? '#E8DCFF' : color === 'peach' ? '#FFE0D0' : color === 'blue' ? '#D0E4FF' : '#FFF9F3';
  document.body.setAttribute('data-theme', color);
  document.querySelectorAll('.color-dot').forEach(function(d) { d.classList.remove('active'); });
  var target = document.querySelector('[onclick*="' + color + '"]');
  if (target) target.classList.add('active');
  localStorage.setItem('mood-diary-theme-color', color);
};

export async function renderManage() {
  var container = document.getElementById('manage-content');
  if (!container) return;
  var stats = await getStats();

  container.innerHTML = buildManageHTML(stats);

  // 主题切换
  var switchEl = document.getElementById('theme-switch');
  if (switchEl) switchEl.addEventListener('click', function(e) {
    var btn = e.target.closest('.theme-btn');
    if (!btn) return;
    switchEl.querySelectorAll('.theme-btn').forEach(function(b) { b.classList.remove('theme-btn--active'); });
    btn.classList.add('theme-btn--active');
    var theme = btn.dataset.theme;
    document.body.classList.toggle('dark-theme', theme === 'dark');
    showToast(theme === 'dark' ? '已切换深色模式 🌙' : '已切换浅色模式 ☀️');
  });

  // 颜色主题
  var dotsEl = document.querySelector('.color-dots');
  if (dotsEl) dotsEl.addEventListener('click', function(e) {
    var dot = e.target.closest('.color-dot');
    if (!dot) return;
    document.querySelectorAll('.color-dot').forEach(function(d) { d.classList.remove('active'); });
    dot.classList.add('active');
    showToast('主题颜色已更新 🎨');
  });

  // 击登闻鼓 toggle
  var toggle = document.getElementById('feedback-toggle');
  if (toggle) toggle.addEventListener('click', async function() {
    var form = document.getElementById('feedback-form');
    var arrow = document.getElementById('feedback-arrow');
    var isOpen = form.style.display === 'block';
    form.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '▶' : '▼';
    if (!isOpen) {
      var subj = document.getElementById('feedback-subject');
      if (subj) subj.focus();
      renderFeedbackList();
    }
  });

  // 提交反馈
  var fbBtn = document.getElementById('btn-feedback');
  if (fbBtn) fbBtn.addEventListener('click', async function() {
    var catEl = document.getElementById('feedback-category');
    var category = catEl ? catEl.value : 'other';
    var catLabels = { suggestion: '💡 建议', bug: '🐛 Bug', other: '💬 其他' };
    var catLabel = catLabels[category] || '💬 其他';
    var subject = document.getElementById('feedback-subject');
    var subjVal = subject ? subject.value.trim() : '';
    if (!subjVal) subjVal = '未填写主题';
    var textEl = document.getElementById('feedback-text');
    var text = textEl ? textEl.value.trim() : '';
    if (!text) { showToast('请填写反馈内容'); return; }
    var fullContent = catLabel + ' 【' + subjVal + '】' + text;
    await saveEntry({ id: uuid(), type: 'feedback', role: 'self', date: today(), createdAt: Date.now(), content: fullContent, category: category });
    // 云端函数暂不可用（Netlify 额度用完），反馈保存在本地
    var toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = '感谢您的反馈，我将用心聆听 💚';
      toast.classList.add('toast--show');
      setTimeout(function() { toast.classList.remove('toast--show'); }, 3000);
    }
    if (subject) subject.value = '';
    if (textEl) textEl.value = '';
    if (catEl) catEl.value = 'suggestion';
    renderFeedbackList();
  });

  renderFeedbackList();
}

function buildManageHTML(stats) {
  var h = '';
  // 统计
  h += '<section class="manage-section">';
  h += '<h3 class="manage-section__title">📋 本月统计</h3>';
  h += '<div class="manage-stats">';
  h += '<div class="manage-stat"><span class="manage-stat__num">' + stats.thisMonth + '</span><span class="manage-stat__label">本月记录</span></div>';
  h += '<div class="manage-stat mood-good"><span class="manage-stat__num">' + stats.thisMonthGood + '</span><span class="manage-stat__label">😊 Nice Mood</span></div>';
  h += '<div class="manage-stat mood-neutral"><span class="manage-stat__num">' + stats.thisMonthNeutral + '</span><span class="manage-stat__label">😐 Peace</span></div>';
  h += '<div class="manage-stat mood-bad"><span class="manage-stat__num">' + stats.thisMonthBad + '</span><span class="manage-stat__label">😫 Bad Mood</span></div>';
  h += '<div class="manage-stat"><span class="manage-stat__num">' + stats.favoriteCount + '</span><span class="manage-stat__label">⭐ 收藏语录</span></div>';
  h += '</div></section>';

  // 主题模式
  h += '<section class="manage-section">';
  h += '<h3 class="manage-section__title">🎨 主题模式</h3>';
  h += '<div class="theme-switch" id="theme-switch">';
  h += '<button class="theme-btn theme-btn--active" data-theme="light">☀️ 浅色</button>';
  h += '<button class="theme-btn" data-theme="dark">🌙 深色</button>';
  h += '</div></section>';

  // 主题配置
  h += '<section class="manage-section">';
  h += '<h3 class="manage-section__title">🎨 主题配置</h3>';
  h += '<p class="manage-hint">更多主题颜色coming soon～</p>';
  h += '<div class="color-dots">';
  h += '<span class="color-dot active" style="background:#7BAE7A" onclick="pickColor(\'green\')"></span>';
  h += '<span class="color-dot" style="background:#B8A0D0" onclick="pickColor(\'lavender\')"></span>';
  h += '<span class="color-dot" style="background:#F0B8A0" onclick="pickColor(\'peach\')"></span>';
  h += '<span class="color-dot" style="background:#A0C8E8" onclick="pickColor(\'blue\')"></span>';
  h += '</div></section>';

  // 击登闻鼓
  h += '<section class="manage-section">';
  h += '<h3 class="manage-section__title" id="feedback-toggle" style="cursor:pointer">💬 击登闻鼓 <span id="feedback-arrow" style="font-size:12px;color:#999">▶</span></h3>';
  h += '<div id="feedback-form" style="display:none">';
  h += '<select id="feedback-category" class="form-input" style="margin-bottom:8px"><option value="suggestion">💡 建议</option><option value="bug">🐛 Bug反馈</option><option value="other">💬 其他</option></select>';
  h += '<input type="text" id="feedback-subject" class="form-input" placeholder="击鼓主题" maxlength="50" style="margin-bottom:8px">';
  h += '<textarea id="feedback-text" class="form-textarea" rows="3" placeholder="诉说你的想法～"></textarea>';
  h += '<button class="btn btn--primary btn--full" id="btn-feedback" style="margin-top:12px">击鼓鸣冤</button>';
  h += '<div id="feedback-items" style="margin-top:16px"></div>';
  h += '</div></section>';

  h += '<div style="text-align:center;padding:24px 0;color:#999;font-size:12px">情绪日记 v2 · 记录让情绪被看见</div>';
  return h;
}

async function renderFeedbackList() {
  var itemsContainer = document.getElementById('feedback-items');
  if (!itemsContainer) return;
  var all = await getAllEntries();
  var feedbacks = all.filter(function(e) { return e.type === 'feedback'; }).sort(function(a, b) { return b.createdAt - a.createdAt; });
  if (feedbacks.length === 0) { itemsContainer.innerHTML = ''; return; }

  var html = '<div style="font-size:12px;color:#999;margin-bottom:8px;padding-top:8px;border-top:1px solid #eee">堂前鼓声 (' + feedbacks.length + ')</div>';
  feedbacks.forEach(function(f, i) {
    var subject = f.content.slice(0, 20) + (f.content.length > 20 ? '...' : '');
    html += '<div class="feedback-item" style="background:#fff;border-radius:12px;padding:8px 12px;margin-bottom:6px">';
    html += '<div class="feedback-item__header" data-idx="' + i + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer">';
    html += '<span style="font-size:12px;color:#999;white-space:nowrap">' + f.date + '</span>';
    html += '<span style="flex:1;font-size:14px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + subject + '</span>';
    html += '<span class="feedback-arrow" data-idx="' + i + '" style="font-size:10px;color:#999">▶</span></div>';
    html += '<div class="feedback-item__body" data-idx="' + i + '" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:14px;color:#666;line-height:1.7;white-space:pre-wrap">' + f.content + '</div>';
    html += '<button class="btn btn--danger btn--sm feedback-del-btn" data-id="' + f.id + '" style="margin-top:6px;display:none">删除</button></div>';
  });
  itemsContainer.innerHTML = html;

  // 展开/收起
  itemsContainer.querySelectorAll('.feedback-item__header').forEach(function(el) {
    el.addEventListener('click', function() {
      var idx = el.dataset.idx;
      var item = el.closest('.feedback-item');
      var body = item.querySelector('.feedback-item__body');
      var arrow = item.querySelector('.feedback-arrow');
      var delBtn = item.querySelector('.feedback-del-btn');
      var isOpen = body.style.display === 'block';
      body.style.display = isOpen ? 'none' : 'block';
      if (delBtn) delBtn.style.display = isOpen ? 'none' : 'block';
      arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    });
  });

  // 删除
  itemsContainer.querySelectorAll('.feedback-del-btn').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      if (!confirm('确定删除这条反馈吗？')) return;
      await deleteEntry(btn.dataset.id);
      showToast('已删除');
      renderFeedbackList();
    });
  });
}
