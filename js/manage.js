/**
 * 管理笔记 —— 统计 + 主题 + 反馈
 */
import { getStats, saveEntry, getAllEntries, deleteEntry } from './db.js';
import { showToast, uuid, today } from './utils.js';
// Supabase 在中国大陆不可用，反馈仅保存在本地
// import { sendFeedback } from './supabase.js';

// 全局主题切换函数（供 onclick 调用）
window.pickColor = function(color) {
  // 直接改背景色——最明显的测试
  document.body.style.backgroundColor = color === 'lavender' ? '#E8DCFF' : color === 'peach' ? '#FFE0D0' : color === 'blue' ? '#D0E4FF' : '#FFF9F3';
  document.body.setAttribute('data-theme', color);
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector(`[onclick*="${color}"]`)?.classList.add('active');
  localStorage.setItem('mood-diary-theme-color', color);
};

export async function renderManage() {
  const container = document.getElementById('manage-content');
  if (!container) return;

  const stats = await getStats();

  container.innerHTML = `
    <!-- 统计 -->
    <section class="manage-section">
      <h3 class="manage-section__title"><i data-lucide="bar-chart-3" class="manage-icon"></i> 本月统计</h3>
      <div class="manage-stats">
        <div class="manage-stat"><span class="manage-stat__num">${stats.thisMonth}</span><span class="manage-stat__label">本月记录</span></div>
        <div class="manage-stat mood-good"><span class="manage-stat__num">${stats.thisMonthGood}</span><span class="manage-stat__label">😊 Nice Mood</span></div>
        <div class="manage-stat mood-neutral"><span class="manage-stat__num">${stats.thisMonthNeutral}</span><span class="manage-stat__label">😐 Peace</span></div>
        <div class="manage-stat mood-bad"><span class="manage-stat__num">${stats.thisMonthBad}</span><span class="manage-stat__label">😫 Bad Mood</span></div>
        <div class="manage-stat"><span class="manage-stat__num">${stats.favoriteCount}</span><span class="manage-stat__label">⭐ 收藏语录</span></div>
      </div>
    </section>

    <!-- 主题模式 -->
    <section class="manage-section">
      <h3 class="manage-section__title"><i data-lucide="palette" class="manage-icon"></i> 主题模式</h3>
      <div class="theme-switch" id="theme-switch">
        <button class="theme-btn theme-btn--active" data-theme="light">☀️ 浅色</button>
        <button class="theme-btn" data-theme="dark">🌙 深色</button>
      </div>
    </section>

    <!-- 主题配置 -->
    <section class="manage-section">
      <h3 class="manage-section__title"><i data-lucide="swatch-book" class="manage-icon"></i> 主题配置</h3>
      <p class="manage-hint">更多主题颜色coming soon～</p>
      <div class="color-dots">
        <span class="color-dot active" style="background:#7BAE7A" onclick="pickColor('green')"></span>
        <span class="color-dot" style="background:#B8A0D0" onclick="pickColor('lavender')"></span>
        <span class="color-dot" style="background:#F0B8A0" onclick="pickColor('peach')"></span>
        <span class="color-dot" style="background:#A0C8E8" onclick="pickColor('blue')"></span>
      </div>
    </section>

    <!-- 反馈建议 -->
    <section class="manage-section">
      <h3 class="manage-section__title" id="feedback-toggle" style="cursor:pointer"><i data-lucide="message-square-heart" class="manage-icon"></i> 反馈建议 <span id="feedback-arrow" style="font-size:12px;color:var(--color-text-muted)">▶</span></h3>
      <div id="feedback-form" style="display:none">
        <select id="feedback-category" class="form-input" style="margin-bottom:8px">
          <option value="suggestion">💡 建议</option>
          <option value="bug">🐛 Bug反馈</option>
          <option value="other">💬 其他</option>
        </select>
        <input type="text" id="feedback-subject" class="form-input" placeholder="反馈主题（如：希望增加暗色模式）" maxlength="50" style="margin-bottom:8px">
        <textarea id="feedback-text" class="form-textarea" rows="3" placeholder="具体反馈内容～"></textarea>
        <button class="btn btn--primary btn--full" id="btn-feedback" style="margin-top:12px">提交反馈</button>
      </div>
      <div id="feedback-list" style="margin-top:16px">
        <button class="btn btn--outline btn--sm btn--full" id="btn-toggle-history" style="display:none">查看历史反馈</button>
        <div id="feedback-items" style="display:none;margin-top:8px"></div>
      </div>
    </section>

    <div style="text-align:center;padding:24px 0;color:var(--color-text-muted);font-size:var(--font-size-xs)">
      情绪日记 v2 · 记录让情绪被看见
    </div>
  `;

  // 主题切换
  document.getElementById('theme-switch')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('theme-btn--active'));
    btn.classList.add('theme-btn--active');
    const theme = btn.dataset.theme;
    document.body.classList.toggle('dark-theme', theme === 'dark');
    showToast(theme === 'dark' ? '已切换深色模式 🌙' : '已切换浅色模式 ☀️');
  });

  // 颜色主题选择（含背景色）
  const colorPalettes = {
    green: {
      primary: '#7BAE7A', primaryDark: '#609F5F', primaryLight: '#EDF7ED',
      accent: '#F0C4B0', accentLight: '#FEF5F1',
      bg: '#FFF9F3', card: '#FFFFFF', border: '#EBE3D8', borderLight: '#F3EFE8', shadow: 'rgba(80,60,40,0.05)',
    },
    lavender: {
      primary: '#B8A0D0', primaryDark: '#9B7EC0', primaryLight: '#F5F0FA',
      accent: '#D0C0E8', accentLight: '#FAF7FF',
      bg: '#FBFAFF', card: '#FFFFFF', border: '#E5E0F0', borderLight: '#F2EFF8', shadow: 'rgba(100,80,140,0.05)',
    },
    peach: {
      primary: '#F0A890', primaryDark: '#E08070', primaryLight: '#FEF0EB',
      accent: '#F0C8A0', accentLight: '#FFF6F0',
      bg: '#FFF9F5', card: '#FFFFFF', border: '#F0E0D5', borderLight: '#F8EFE8', shadow: 'rgba(120,80,60,0.05)',
    },
    blue: {
      primary: '#90B8E0', primaryDark: '#7098C8', primaryLight: '#EEF4FB',
      accent: '#90D0D8', accentLight: '#F0F7FA',
      bg: '#F7FAFD', card: '#FFFFFF', border: '#D8E4F0', borderLight: '#EDF2F8', shadow: 'rgba(60,80,120,0.05)',
    },
  };

  document.querySelector('.color-dots')?.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (!dot) return;
    const palette = colorPalettes[dot.dataset.color];
    if (!palette) return;

    // 应用颜色 - 设置 body data-theme 属性
    document.body.setAttribute('data-theme', dot.dataset.color);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.primary);

    // 保存
    localStorage.setItem('mood-diary-theme-color', dot.dataset.color);

    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    showToast('主题颜色已更新 🎨');
  });

  // 展开/收起反馈表单
  document.getElementById('feedback-toggle')?.addEventListener('click', () => {
    const form = document.getElementById('feedback-form');
    const arrow = document.getElementById('feedback-arrow');
    const isOpen = form.style.display === 'block';
    form.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '▶' : '▼';
    if (!isOpen) document.getElementById('feedback-subject')?.focus();
  });

  // 提交反馈
  document.getElementById('btn-feedback')?.addEventListener('click', async () => {
    const category = document.getElementById('feedback-category')?.value || 'other';
    const catLabel = { suggestion: '💡 建议', bug: '🐛 Bug', other: '💬 其他' }[category];
    const subject = document.getElementById('feedback-subject')?.value.trim() || '未填写主题';
    const text = document.getElementById('feedback-text')?.value.trim();
    if (!text) { showToast('请填写反馈内容'); return; }
    const fullContent = `${catLabel} 【${subject}】${text}`;
    await saveEntry({
      id: uuid(), type: 'feedback', role: 'self', date: today(), createdAt: Date.now(),
      content: fullContent, category,
    });
    try {
      await fetch('https://cerulean-cheesecake-665fbb.netlify.app/.netlify/functions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: localStorage.getItem('mood-diary-device-id') || 'unknown', content: fullContent, category }),
      });
    } catch (_) {}
    // 自定义感谢文案
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = '感谢您的反馈，我将用心聆听 💚';
      toast.classList.add('toast--show');
      setTimeout(() => toast.classList.remove('toast--show'), 3000);
    }
    document.getElementById('feedback-subject').value = '';
    document.getElementById('feedback-text').value = '';
    document.getElementById('feedback-category').value = 'suggestion';
    renderFeedbackList();
  });

  // 渲染历史反馈
  renderFeedbackList();
}

async function renderFeedbackList() {
  const toggleBtn = document.getElementById('btn-toggle-history');
  const itemsContainer = document.getElementById('feedback-items');
  if (!toggleBtn || !itemsContainer) return;

  const all = await getAllEntries();
  const feedbacks = all.filter(e => e.type === 'feedback').sort((a, b) => b.createdAt - a.createdAt);

  if (feedbacks.length === 0) {
    toggleBtn.style.display = 'none';
    itemsContainer.style.display = 'none';
    return;
  }

  toggleBtn.style.display = '';
  toggleBtn.textContent = `历史反馈 (${feedbacks.length}条) ▶`;

  itemsContainer.innerHTML = feedbacks.map((f, i) => {
    const subject = f.content.slice(0, 20) + (f.content.length > 20 ? '...' : '');
    return `
      <div class="feedback-item" style="background:var(--color-card);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md);margin-bottom:6px">
        <div class="feedback-item__header" data-idx="${i}" style="display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer">
          <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);white-space:nowrap">${f.date}</span>
          <span style="flex:1;font-size:var(--font-size-sm);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${subject}</span>
          <span class="feedback-arrow" data-idx="${i}" style="font-size:10px;color:var(--color-text-muted);transition:transform 0.2s">▶</span>
        </div>
        <div class="feedback-item__body" data-idx="${i}" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--color-border-light);font-size:var(--font-size-sm);color:var(--color-text-secondary);line-height:1.7;white-space:pre-wrap">${f.content}</div>
        <button class="btn btn--danger btn--sm feedback-del-btn" data-id="${f.id}" style="margin-top:6px;display:none">删除</button>
      </div>
    `;
  }).join('');

  // 展开时显示删除按钮
  itemsContainer.querySelectorAll('.feedback-item__header').forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.dataset.idx;
      const item = el.closest('.feedback-item');
      const body = item.querySelector('.feedback-item__body');
      const arrow = item.querySelector('.feedback-arrow');
      const delBtn = item.querySelector('.feedback-del-btn');
      const isOpen = body.style.display === 'block';
      body.style.display = isOpen ? 'none' : 'block';
      delBtn.style.display = isOpen ? 'none' : 'block';
      arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    });
  });

  // 删除反馈
  itemsContainer.querySelectorAll('.feedback-del-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('确定删除这条反馈吗？')) return;
      await deleteEntry(btn.dataset.id);
      showToast('已删除');
      renderFeedbackList();
    });
  });

  // 单条展开
  itemsContainer.querySelectorAll('.feedback-item__header, .feedback-arrow').forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.dataset.idx;
      const body = itemsContainer.querySelector(`.feedback-item__body[data-idx="${idx}"]`);
      const arrow = itemsContainer.querySelector(`.feedback-arrow[data-idx="${idx}"]`);
      if (body.style.display === 'none') {
        body.style.display = 'block';
        arrow.style.transform = 'rotate(90deg)';
      } else {
        body.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
      }
    });
  });

  // 总开关
  toggleBtn.onclick = () => {
    const isOpen = itemsContainer.style.display === 'block';
    itemsContainer.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = `历史反馈 (${feedbacks.length}条) ${isOpen ? '▶' : '▼'}`;
  };
}
