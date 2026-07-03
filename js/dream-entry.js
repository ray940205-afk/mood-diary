/**
 * 梦境记录 —— 记录 + 离线解析
 */
import { saveEntry } from './db.js';
import { uuid, today, showToast, MOOD_TAGS } from './utils.js';
import { interpretDream } from './dream-symbols.js';

let dreamData = {};

export function initDreamEntry() {
  dreamData = { id: uuid(), type: 'dream', role: 'self', date: today(), createdAt: Date.now(), content: '', mood: '', interpretation: '' };
  document.getElementById('dream-content').value = '';
  document.getElementById('dream-mood').innerHTML = MOOD_TAGS.map(t =>
    `<button type="button" class="mood-btn" data-mood="${t.id}"><span class="mood-btn__emoji">${t.emoji}</span><span class="mood-btn__label">${t.label}</span></button>`
  ).join('');
  document.getElementById('dream-mood').querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dreamData.mood = btn.dataset.mood;
      document.getElementById('dream-mood').querySelectorAll('.mood-btn').forEach(b => b.classList.remove('mood-btn--selected'));
      btn.classList.add('mood-btn--selected');
    });
  });
  hideInterpretation();
}

/** 先解析梦境（不保存） */
export function interpretDreamNow() {
  const content = document.getElementById('dream-content').value.trim();
  if (!content) { showToast('请先描述你的梦境'); return; }

  const symbols = interpretDream(content);
  dreamData.interpretation = symbols;

  if (symbols.length > 0) showInterpretation(symbols);
  else showNoMatch();
}

/** 保存梦境（含解析） */
export async function saveDream() {
  dreamData.content = document.getElementById('dream-content').value.trim();
  if (!dreamData.content) { showToast('请描述你的梦境'); return; }
  dreamData.createdAt = Date.now();

  // 如果还没解析过，先解析
  if (!dreamData.interpretation || !dreamData.interpretation.length) {
    dreamData.interpretation = interpretDream(dreamData.content);
  }

  try {
    await saveEntry(dreamData);
    showToast('梦境已保存 🌙');
  } catch (err) { console.error(err); showToast('保存失败'); }
}

function showInterpretation(symbols) {
  const result = document.getElementById('dream-result');
  if (!result) return;
  result.style.display = 'block';
  result.innerHTML = `
    <div class="dream-result__title">🌙 梦境浅析</div>
    <p class="dream-result__disclaimer">以下为象征参考，梦的真正意义只有你自己最清楚</p>
    ${symbols.slice(0, 5).map(s => `
      <div class="dream-symbol">
        <div class="dream-symbol__key">🔑 "${s.matched}"</div>
        <div class="dream-symbol__meaning">${s.meaning.replace(/\n/g, '<br>')}</div>
        ${s.reflect ? `<div class="dream-symbol__reflect">💭 ${s.reflect}</div>` : ''}
        <div class="dream-symbol__source">—— ${s.source}</div>
      </div>
    `).join('')}
    ${symbols.length > 5 ? `<p class="dream-result__more">...还有 ${symbols.length - 5} 个象征未展示</p>` : ''}
  `;
}

function showNoMatch() {
  const result = document.getElementById('dream-result');
  if (!result) return;
  result.style.display = 'block';
  result.innerHTML = `
    <div class="dream-result__title">🌙 梦境已记录</div>
    <p class="dream-result__disclaimer">未匹配到常见的梦境象征。有些梦是独特的、个人的，它们无法被符号化——这本身也是一种意义。</p>
    <p class="dream-result__disclaimer" style="margin-top:12px;font-size:var(--font-size-xs);color:var(--color-text-muted)">💡 建议将梦境复制到<strong>豆包</strong>或<strong>Deepseek</strong>获取更深入的AI解析。</p>
  `;
}

function hideInterpretation() {
  const result = document.getElementById('dream-result');
  if (result) result.style.display = 'none';
}
