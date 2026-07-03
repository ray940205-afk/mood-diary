/**
 * 你问我答 —— 心情优先引导模式
 */
import { saveEntry } from './db.js';
import { currentRole } from './app.js';
import { uuid, today, showToast, MOOD_TAGS } from './utils.js';

const PROMPTS = {
  self: {
    good: [
      { q: '今天发生了什么让你感到开心或温暖的事？', hint: '试着描述事情的经过，越具体越好' },
      { q: '那时候你在做什么？身边有谁？', hint: '回忆当时的场景细节' },
      { q: '这种感觉让你想到了什么？', hint: '可以是某个画面、某个人、某句话...' },
    ],
    neutral: [
      { q: '今天过得怎么样？随便聊聊', hint: '不用刻意组织语言，想到什么写什么' },
      { q: '有没有哪个瞬间让你停下来注意了一下？', hint: '哪怕是很小的事' },
      { q: '此刻的你心里在想什么？', hint: '不用过滤，写下脑子里的第一反应' },
    ],
    bad: [
      { q: '今天发生了什么？不着急，慢慢说', hint: '不需要梳理得很清楚，把想到的写下来就好' },
      { q: '那种感觉具体是什么样的？', hint: '是身体上的紧张？心里的空洞？还是别的什么？' },
      { q: '如果不用"好"或"不好"，你会怎么形容现在的自己？', hint: '比如：像一杯放凉了的水 / 像被揉皱的纸...' },
    ],
  },
  family: {
    good: [
      { q: '今天发生了什么让你觉得温暖或欣慰的事？', hint: '跟TA有关的瞬间，或者只是你自己的感受' },
      { q: 'TA当时是什么状态？', hint: '说了什么、做了什么、表情是什么样的' },
      { q: '那一刻你在想什么？', hint: '你的感受也很重要' },
    ],
    neutral: [
      { q: '今天和TA相处得怎么样？随便聊聊', hint: '平淡的一天也值得记录' },
      { q: '有没有哪个细节让你注意了一下？', hint: 'TA的一个表情、一句话、一个动作...' },
      { q: '此刻的你心里在想什么？', hint: '关于TA，也关于你自己' },
    ],
    bad: [
      { q: '今天发生了什么？不着急，慢慢说', hint: '事情的起因和经过，按你自己的节奏来' },
      { q: 'TA当时的状态是什么样的？', hint: '观察到的行为、话语、表情' },
      { q: '你当时心里是什么感受？', hint: '不需要"正确"或"应该"，你的真实感受' },
    ],
  },
};

let currentStep = 1;
let totalSteps = 5;
let data = {};

export function initGuidedEntry() {
  totalSteps = currentRole === 'self' ? 4 : 5;
  currentStep = 1;
  resetData();
  document.getElementById('guided-title').textContent = '你问我答';
  document.getElementById('btn-prev').style.display = 'none';
  renderStep();
  updateProgress();
}

function resetData() {
  data = {
    id: uuid(), type: 'guided', role: currentRole, date: today(), createdAt: Date.now(),
    mood: '', content: '', note: '',
  };
}

function renderStep() {
  var c = document.getElementById('wizard-container'); if (!c) return;
  if (currentStep === 1) {
    c.innerHTML = renderMoodStep();
    setTimeout(function(){ bindMoodCards(); }, 0);
    document.getElementById('progress-fill').style.width = '33%';
    document.getElementById('progress-text').textContent = '选心情';
  } else {
    var prompts = PROMPTS[currentRole][data.mood];
    c.innerHTML = renderPromptStep(prompts);
    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('progress-text').textContent = '聊一聊';
  }
  updateNavButtons();
}

// ====== Step 1: 选心情 ======
function renderMoodStep() {
  var cards = MOOD_TAGS.map(function(t) {
    return '<button class="mood-card" data-mood="' + t.id + '">' +
      '<span class="mood-card__emoji">' + t.emoji + '</span>' +
      '<span class="mood-card__label">' + t.label + '</span>' +
      '</button>';
  }).join('');
  return '<div class="mood-select">' +
    '<h3 class="mood-select__title">此刻的你是什么样的？</h3>' +
    '<p class="mood-select__sub">选一个最接近的感受，我会陪你聊一聊</p>' +
    '<div class="mood-select__grid">' + cards + '</div>' +
    '</div>';
}

// ====== Step 2: 心情专属提问 ======
function renderPromptStep(prompts) {
  var emoji = '';
  var found = MOOD_TAGS.find(function(t) { return t.id === data.mood; });
  if (found) emoji = found.emoji;
  var blocks = prompts.map(function(p, i) {
    var val = data['prompt_' + i] || '';
    return '<div class="prompt-block">' +
      '<div class="prompt-block__q">' + emoji + ' ' + p.q + '</div>' +
      '<textarea class="prompt-block__input" id="prompt-' + i + '" placeholder="' + p.hint + '">' + esc(val) + '</textarea>' +
      '</div>';
  }).join('');
  return '<div class="prompt-step">' + blocks + '</div>';
}

// ====== 导航 ======
function updateProgress() {
  var fill = document.getElementById('progress-fill');
  var text = document.getElementById('progress-text');
  if (fill) fill.style.width = currentStep === 1 ? '33%' : '100%';
  if (text) text.textContent = currentStep === 1 ? '选心情' : '聊一聊';
}

function updateNavButtons() {
  var prevBtn = document.getElementById('btn-prev');
  var nextBtn = document.getElementById('btn-next');
  var unsureBtn = document.getElementById('btn-unsure');
  var nav = document.getElementById('wizard-nav');

  if (currentStep === 1) {
    if (nav) nav.className = 'wizard-nav wizard-nav--two';
    if (prevBtn) prevBtn.style.display = 'none';
    if (unsureBtn) unsureBtn.style.display = '';
    if (nextBtn) nextBtn.textContent = '选好了';
  } else {
    if (nav) nav.className = 'wizard-nav wizard-nav--three';
    if (prevBtn) prevBtn.style.display = '';
    if (unsureBtn) unsureBtn.style.display = 'none';
    if (nextBtn) nextBtn.textContent = '✓ 保存记录';
  }
}

// ====== 收集数据 ======
function collectPromptData(prompts) {
  prompts.forEach(function(_, i) {
    var el = document.getElementById('prompt-' + i);
    if (el) data['prompt_' + i] = el.value;
  });
  data.content = prompts.map(function(p, i) {
    var answer = data['prompt_' + i] || '';
    return answer ? p.q + '\n' + answer : '';
  }).filter(Boolean).join('\n\n');
}

export function bindMoodCards() {
  document.querySelectorAll('.mood-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.mood-card').forEach(function(c) { c.classList.remove('mood-card--selected'); });
      card.classList.add('mood-card--selected');
      data.mood = card.dataset.mood;
    });
  });
}

export function nextStep() {
  if (currentStep === 1) {
    var selected = document.querySelector('.mood-card--selected');
    if (!selected) { showToast('请先选择一个心情'); return; }
    data.mood = selected.dataset.mood;
    currentStep = 2;
    renderStep();
  } else {
    var prompts = PROMPTS[currentRole][data.mood];
    collectPromptData(prompts);
    if (!data.content.trim()) { showToast('请至少回答一个问题'); return; }
    saveCurrentEntry();
  }
}

export function prevStep() {
  if (currentStep > 1) { currentStep = 1; renderStep(); }
}

async function saveCurrentEntry() {
  try {
    data.createdAt = Date.now();
    await saveEntry(data);
    showToast('记录已保存 💚');
    setTimeout(function() { resetData(); window.location.hash = '#record'; }, 800);
  } catch (err) { console.error(err); showToast('保存失败'); }
}

function esc(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
