/**
 * 管理笔记 —— 统计 + 主题 + 反馈
 */
import { getStats } from './db.js';
import { showToast } from './utils.js';

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
        <span class="color-dot active" style="background:#7BAE7A" data-color="green"></span>
        <span class="color-dot" style="background:#B8A0D0" data-color="lavender"></span>
        <span class="color-dot" style="background:#F0B8A0" data-color="peach"></span>
        <span class="color-dot" style="background:#A0C8E8" data-color="blue"></span>
      </div>
    </section>

    <!-- 反馈建议 -->
    <section class="manage-section">
      <h3 class="manage-section__title"><i data-lucide="message-square-heart" class="manage-icon"></i> 反馈建议</h3>
      <textarea id="feedback-text" class="form-textarea" rows="3" placeholder="你的建议对我们很重要～"></textarea>
      <button class="btn btn--primary btn--full" id="btn-feedback" style="margin-top:12px">发送反馈</button>
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

  // 颜色主题选择
  document.querySelector('.color-dots')?.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (!dot) return;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    showToast('主题颜色已更新 🎨');
  });

  // 反馈
  document.getElementById('btn-feedback')?.addEventListener('click', () => {
    const text = document.getElementById('feedback-text')?.value.trim();
    if (!text) { showToast('请填写反馈内容'); return; }
    showToast('感谢反馈 💚');
    document.getElementById('feedback-text').value = '';
  });
}
