/**
 * 应用入口 —— v2：4 模块（首页 / 记录 / 笔记 / 管理）
 */
import { initDB, getStats, saveEntry } from './db.js';
import { QUOTES } from './quotes.js';
import { initGuidedEntry, nextStep, prevStep } from './guided-entry.js';
import { initFreeEntry, saveFreeEntry } from './free-entry.js';
import { renderNotes } from './notes.js';
import { renderManage } from './manage.js';
import { initDreamEntry, saveDream, interpretDreamNow } from './dream-entry.js';
import { showToast, uuid, today } from './utils.js';
import { hasUserName, setUserName, getUserName } from './user.js';

export let currentRole = 'self';

/** 获取一条未读过的语录，全部读过则重置 */
function freshQuote() {
  const key = 'mood-diary-seen-quotes';
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(key)) || []; } catch (_) {}
  const unseen = QUOTES.filter((_, i) => !seen.includes(i));
  if (unseen.length === 0) { seen = []; }
  const pool = unseen.length > 0 ? unseen : QUOTES;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const idx = QUOTES.indexOf(pick);
  seen.push(idx);
  localStorage.setItem(key, JSON.stringify(seen));
  return pick;
}

const ROUTES = {
  home:       { view: 'view-home',       nav: 'home',   init: renderHome },
  record:     { view: 'view-record',     nav: 'record', init: renderRecord },
  'guided-entry': { view: 'view-guided-entry', nav: null, init: initGuidedEntry },
  'free-entry':   { view: 'view-free-entry',   nav: null, init: initFreeEntry },
  notes:      { view: 'view-notes',      nav: 'notes',  init: renderNotes },
  manage:     { view: 'view-manage',     nav: 'manage', init: renderManage },
  'dream-entry': { view: 'view-dream-entry', nav: null, init: initDreamEntry },
};

let currentRoute = 'home';
let currentQuote = null;

/** 检测新版本 */
async function checkVersion() {
  try {
    var resp = await fetch('./version.json?t=' + Date.now());
    var data = await resp.json();
    var current = localStorage.getItem('mood-diary-version');
    if (current && current !== data.version) {
      // 发现新版本
      var ok = confirm('✨ 发现新版本 (v' + data.version + ')，点击确定刷新页面获取最新功能～');
      if (ok) {
        localStorage.setItem('mood-diary-version', data.version);
        // 注销旧SW，强制刷新
        if ('serviceWorker' in navigator) {
          var reg = await navigator.serviceWorker.getRegistration();
          if (reg) await reg.unregister();
        }
        if ('caches' in window) {
          var keys = await caches.keys();
          await Promise.all(keys.map(function(k) { return caches.delete(k); }));
        }
        location.reload();
      }
    }
    if (!current) localStorage.setItem('mood-diary-version', data.version);
  } catch (_) {}
}

async function bootstrap() {
  // 首次使用：设置昵称
  if (!hasUserName()) {
    var name = prompt('欢迎来到 Arya\'s Diary 🌙\n\n请为自己起一个名字：', '');
    if (name && name.trim()) {
      setUserName(name.trim());
      showToast('你好，' + name.trim() + ' 💚');
    } else {
      setUserName('匿名用户');
    }
  }

  try {
    restoreThemeColor();
    await initDB();
  } catch (err) {
    console.error('初始化失败:', err);
    return;
  }

  await checkVersion();

  if ('serviceWorker' in navigator) {
    if (location.hostname === 'localhost') {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { await reg.unregister(); }
    } else {
      try { await navigator.serviceWorker.register('/mood-diary/sw.js'); } catch (_) {}
    }
  }

  window.addEventListener('hashchange', handleRoute);
  bindGlobalEvents();
  navigateTo(window.location.hash.replace('#', '') || 'home');
}

function navigateTo(route) {
  if (!ROUTES[route]) route = 'home';
  currentRoute = route;
  window.location.hash = route;
  Object.values(ROUTES).forEach((r) => document.getElementById(r.view)?.classList.add('view--hidden'));
  const active = ROUTES[route];
  document.getElementById(active.view)?.classList.remove('view--hidden');
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('nav-item--active', item.dataset.nav === active.nav);
  });
  if (active.init) active.init();
  window.scrollTo(0, 0);
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '');
  if (hash && hash !== currentRoute && ROUTES[hash]) navigateTo(hash);
}

function bindGlobalEvents() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => { const r = item.dataset.nav; if (r) navigateTo(r); });
  });
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      const role = navBtn.dataset.role;
      if (role) currentRole = role;
      navigateTo(navBtn.dataset.nav);
    }
  });
  document.getElementById('btn-next')?.addEventListener('click', nextStep);
  document.getElementById('btn-prev')?.addEventListener('click', prevStep);
  document.getElementById('btn-unsure')?.addEventListener('click', showUnsurePopup);
  document.getElementById('free-form')?.addEventListener('submit', (e) => { e.preventDefault(); saveFreeEntry(); });
  document.getElementById('btn-save-dream')?.addEventListener('click', saveDream);
  document.getElementById('btn-interpret-dream')?.addEventListener('click', interpretDreamNow);
}

// ====== 首页 ======
function renderHome() {
  currentQuote = freshQuote();
  document.getElementById('quote-text').textContent = currentQuote.text;
  document.getElementById('quote-author').textContent = `—— ${currentQuote.author} ${currentQuote.source}`;

  document.getElementById('btn-like').onclick = async () => {
    try {
      await saveEntry({
        id: uuid(), type: 'quote', role: 'self', date: today(), createdAt: Date.now(),
        content: `"${currentQuote.text}" —— ${currentQuote.author}，${currentQuote.source}`,
        isFavorite: true, mood: 'good',
      });
      showToast('已收藏 👍');
    } catch (err) { showToast('操作失败'); }
  };
  document.getElementById('btn-dislike').onclick = async () => {
    try {
      await saveEntry({
        id: uuid(), type: 'quote', role: 'self', date: today(), createdAt: Date.now(),
        content: `"${currentQuote.text}" —— ${currentQuote.author}，${currentQuote.source}`,
        isFavorite: true, mood: 'bad',
      });
      window.__quoteForFree = `"${currentQuote.text}" —— ${currentQuote.author}，${currentQuote.source}`;
      const goWrite = confirm('看来你对此有不同看法？写下你的想法吧～');
      if (goWrite) { currentRole = 'self'; navigateTo('free-entry'); }
    } catch (err) { showToast('操作失败'); }
  };
}

// ====== 记录页 ======
async function renderRecord() {
  try {
    const [selfStats, familyStats] = await Promise.all([getStats('self'), getStats('family')]);
    const container = document.getElementById('quick-stats');
    if (!container) return;
    const totalAll = selfStats.total + familyStats.total;
    if (totalAll === 0) {
      container.innerHTML = '<div style="text-align:center;color:var(--color-text-secondary);padding:var(--space-md) 0"><p style="font-size:var(--font-size-sm)">还没有记录</p><p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:4px">开始记录吧 🌱</p></div>';
      return;
    }
    container.innerHTML = `
      <div class="home-quick-stats__title">📊 近期概览</div>
      <div class="stats-dual">
        <div class="stats-column"><div class="stats-column__label">📝 我的情绪</div><div class="stats-mini-grid"><div class="stat-item stat-item--sm"><span class="stat-item__number">${selfStats.total}</span><span class="stat-item__label">总记录</span></div><div class="stat-item stat-item--sm"><span class="stat-item__number">${selfStats.recentCount}</span><span class="stat-item__label">近7天</span></div></div></div>
        <div class="stats-column"><div class="stats-column__label">💝 我和TA的情绪</div><div class="stats-mini-grid"><div class="stat-item stat-item--sm"><span class="stat-item__number">${familyStats.total}</span><span class="stat-item__label">总记录</span></div><div class="stat-item stat-item--sm"><span class="stat-item__number">${familyStats.recentCount}</span><span class="stat-item__label">近7天</span></div></div></div>
      </div>`;
  } catch (err) { console.error(err); }
}

// ====== 主题 ======
function restoreThemeColor() {
  const saved = localStorage.getItem('mood-diary-theme-color');
  if (!saved) return;
  document.body.setAttribute('data-theme', saved);
}

// ====== 弹窗 ======
function showUnsurePopup() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-dialog">
      <div class="popup-dialog__title">没关系的～</div>
      <button class="btn btn--outline btn--full" id="popup-back">再想想</button>
      <button class="btn btn--primary btn--full" id="popup-free">随便记录点什么</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#popup-back').onclick = () => overlay.remove();
  overlay.querySelector('#popup-free').onclick = () => { overlay.remove(); currentRole = 'self'; navigateTo('free-entry'); };
}

// ====== 启动 ======
document.addEventListener('DOMContentLoaded', bootstrap);

// Lucide CDN慢，异步加载后重试渲染图标
