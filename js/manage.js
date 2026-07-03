/**
 * 管理笔记 —— 统计 + 主题 + 反馈
 */
import { getStats, saveEntry, getAllEntries } from './db.js';
import { showToast, uuid, today } from './utils.js';
import { sendFeedback } from './supabase.js';

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
      <h3 class="manage-section__title"><i data-lucide="message-square-heart" class="manage-icon"></i> 反馈建议</h3>
      <textarea id="feedback-text" class="form-textarea" rows="3" placeholder="你的建议对我们很重要～"></textarea>
      <button class="btn btn--primary btn--full" id="btn-feedback" style="margin-top:12px">提交反馈</button>
      <button class="btn btn--outline btn--sm btn--full" id="btn-export-feedback" style="margin-top:8px"><i data-lucide="download" class="icon--sm"></i> 导出所有反馈</button>
      <div id="feedback-list" style="margin-top:16px"></div>
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

  // 反馈
  document.getElementById('btn-feedback')?.addEventListener('click', async () => {
    const text = document.getElementById('feedback-text')?.value.trim();
    if (!text) { showToast('请填写反馈内容'); return; }
    await saveEntry({
      id: uuid(), type: 'feedback', role: 'self', date: today(), createdAt: Date.now(),
      content: text,
    });
    sendFeedback(text); showToast('感谢反馈 💚');
    document.getElementById('feedback-text').value = '';
    renderFeedbackList();
  });

  // 导出反馈
  document.getElementById('btn-export-feedback')?.addEventListener('click', async () => {
    const all = await getAllEntries();
    const feedbacks = all.filter(e => e.type === 'feedback').sort((a, b) => b.createdAt - a.createdAt);
    if (feedbacks.length === 0) { showToast('暂无反馈可导出'); return; }
    const text = feedbacks.map(f => `[${f.date}] ${f.content}`).join('\n\n---\n\n');
    // 下载为文件
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `情绪日记反馈_${today()}.txt`;
    a.click();
    showToast(`已导出 ${feedbacks.length} 条反馈`);
  });

  // 渲染历史反馈
  renderFeedbackList();
}

async function renderFeedbackList() {
  const container = document.getElementById('feedback-list');
  if (!container) return;
  const all = await getAllEntries();
  const feedbacks = all.filter(e => e.type === 'feedback').sort((a, b) => b.createdAt - a.createdAt);
  if (feedbacks.length === 0) return;
  container.innerHTML = `
    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:8px">历史反馈 (${feedbacks.length}条)</div>
    ${feedbacks.map(f => `
      <div style="background:var(--color-card);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md);margin-bottom:6px;font-size:var(--font-size-sm);color:var(--color-text-secondary);display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <span style="flex:1;line-height:1.6">${f.content}</span>
        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);white-space:nowrap;flex-shrink:0">${f.date}</span>
      </div>
    `).join('')}
  `;
}
