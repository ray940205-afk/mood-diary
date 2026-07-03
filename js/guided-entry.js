/**
 * 你问我答 —— 双角色（self=4步 / family=5步），最后一步用心情标签替代评分
 */
import { saveEntry } from './db.js';
import { currentRole } from './app.js';
import { uuid, today, showToast, EMOTION_TAGS, SELF_STRATEGY_TAGS, FAMILY_STRATEGY_TAGS, REACTION_OPTIONS, MOOD_TAGS } from './utils.js';

let currentStep = 1, totalSteps = 5;
let data = {};

export function initGuidedEntry() {
  totalSteps = currentRole === 'self' ? 4 : 5;
  currentStep = 1;
  resetData();
  const title = document.getElementById('guided-title');
  if (title) title.textContent = '你问我答';
  renderStep(); updateProgress();
}

function resetData() {
  data = { id: uuid(), type: 'guided', role: currentRole, date: today(), createdAt: Date.now(), trigger: '', patientReaction: '', emotions: [], emotionText: '', strategies: [], strategyNote: '', mood: '', note: '' };
}

function renderStep() {
  const c = document.getElementById('wizard-container'); if (!c) return;
  if (currentRole === 'self') { selfStep(c); } else { familyStep(c); }
  updateProgress(); updateNavButtons();
}

function selfStep(c) {
  switch (currentStep) { case 1: c.innerHTML=step1(); break; case 2: c.innerHTML=step2(); setTimeout(()=>bindTags('emotions'),0); break; case 3: c.innerHTML=step3(); setTimeout(()=>bindTags('strategies'),0); break; case 4: c.innerHTML=step4(); setTimeout(()=>bindMood(),0); break; }
}
function familyStep(c) {
  switch (currentStep) { case 1: c.innerHTML=step1(); break; case 2: c.innerHTML=stepF2(); setTimeout(()=>bindReactionChips(),0); break; case 3: c.innerHTML=step2(); setTimeout(()=>bindTags('emotions'),0); break; case 4: c.innerHTML=stepF4(); setTimeout(()=>bindTags('strategies'),0); break; case 5: c.innerHTML=step4(); setTimeout(()=>bindMood(),0); break; }
}

function step1() { return ws('发生了什么？',`<textarea id="input-trigger">${esc(data.trigger)}</textarea>`,'💡 客观记录事情的起因和经过'); }
function step2() { return ws('我当时感受到了什么？',`<textarea id="input-emotion-text" class="wizard-textarea-emotion">${esc(data.emotionText)}</textarea><div class="tag-grid" id="tag-grid-emotions">${EMOTION_TAGS.map(t=>tagBtn(t,data.emotions)).join('')}</div>`,'💡 点击下方标签插入，也可以自己输入'); }
function step3() { return ws('我做了什么？',`<div class="tag-grid" id="tag-grid-strategies">${SELF_STRATEGY_TAGS.map(t=>tagBtn(t,data.strategies)).join('')}</div><textarea id="input-strategy-note" class="wizard-textarea-sm">${esc(data.strategyNote)}</textarea>`,'💡 哪怕是很小的尝试也值得记录'); }
function stepF2() { const chips=REACTION_OPTIONS.map(r=>`<button class="tag-btn ${data.patientReaction===r?'tag-btn--selected':''}" data-value="${esc(r)}">${r}</button>`).join(''); return ws('TA 当时的状态',`<div class="tag-grid" id="reaction-chips">${chips}</div><input type="text" id="input-reaction-custom" value="${esc(data.patientReaction&&!REACTION_OPTIONS.includes(data.patientReaction)?data.patientReaction:'')}">`,'💡 选择一个最接近的，或自己描述'); }
function stepF4() { return ws('我是怎么应对的？',`<div class="tag-grid" id="tag-grid-strategies">${FAMILY_STRATEGY_TAGS.map(t=>tagBtn(t,data.strategies)).join('')}</div><textarea id="input-strategy-note" class="wizard-textarea-sm">${esc(data.strategyNote)}</textarea>`,'💡 记录你实际做了什么'); }

function step4() {
  return ws('此刻的心情',`<div class="mood-grid" id="mood-grid">${MOOD_TAGS.map(t=>`<button class="mood-btn ${data.mood===t.id?'mood-btn--selected':''}" data-mood="${t.id}"><span class="mood-btn__emoji">${t.emoji}</span><span class="mood-btn__label">${t.label}</span></button>`).join('')}</div><textarea id="input-note" class="wizard-textarea-sm">${esc(data.note)}</textarea>`,'💡 选一个最接近你此刻感受的心情');
}

function ws(title, body, tip) { return `<div class="wizard-step"><h3 class="wizard-step__title">${title}</h3><div class="wizard-step__body">${body}</div><p class="wizard-step__tip">${tip}</p></div>`; }
function tagBtn(t, arr) { return `<button class="tag-btn ${arr.includes(t.id)?'tag-btn--selected':''}" data-tag="${t.id}">${t.emoji} ${t.label}</button>`; }

function bindTags(field) {
  const grid = document.getElementById(`tag-grid-${field}`); if (!grid) return;
  const isEmo = field === 'emotions';
  const ta = isEmo ? document.getElementById('input-emotion-text') : null;
  grid.querySelectorAll('.tag-btn').forEach(btn => { btn.addEventListener('click', () => {
    const id = btn.dataset.tag, arr = data[field], sel = arr.includes(id);
    if (sel) { data[field]=arr.filter(t=>t!==id); btn.classList.remove('tag-btn--selected'); if(ta) removeFromTA(ta, btn.textContent.trim()); }
    else { data[field]=[...arr,id]; btn.classList.add('tag-btn--selected'); if(ta) insertToTA(ta, btn.textContent.trim()); }
  });});
}

function insertToTA(ta, txt) { const cur=ta.value.trimEnd(); ta.value=cur+(cur?' ':'')+txt; ta.focus(); }
function removeFromTA(ta, txt) { const e=txt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); ta.value=ta.value.replace(new RegExp('\\s*'+e+'\\s*','g'),' ').replace(/\s+/g,' ').trim(); }

function bindMood() {
  const grid = document.getElementById('mood-grid'); if (!grid) return;
  grid.querySelectorAll('.mood-btn').forEach(btn => { btn.addEventListener('click', () => {
    data.mood = btn.dataset.mood;
    grid.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('mood-btn--selected'));
    btn.classList.add('mood-btn--selected');
  });});
}

function bindReactionChips() {
  const grid = document.getElementById('reaction-chips'); if (!grid) return;
  grid.querySelectorAll('.tag-btn').forEach(btn => { btn.addEventListener('click', () => {
    grid.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('tag-btn--selected'));
    btn.classList.add('tag-btn--selected'); data.patientReaction=btn.dataset.value;
    const ci=document.getElementById('input-reaction-custom'); if(ci) ci.value='';
  });});
  const ci=document.getElementById('input-reaction-custom'); if(ci) ci.addEventListener('input',()=>{if(ci.value.trim()){grid.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('tag-btn--selected'));data.patientReaction=ci.value.trim();}});
}

function updateProgress() { const f=document.getElementById('progress-fill'),t=document.getElementById('progress-text'); if(f)f.style.width=(currentStep/totalSteps*100)+'%'; if(t)t.textContent=`步骤 ${currentStep} / ${totalSteps}`; }
function updateNavButtons() { const p=document.getElementById('btn-prev'),n=document.getElementById('btn-next'); if(p)p.style.visibility=currentStep===1?'hidden':'visible'; if(n)n.textContent=currentStep===totalSteps?'✓ 保存记录':'下一步'; }

function collectStepData() {
  switch(currentStep) {
    case 1: { const el=document.getElementById('input-trigger'); data.trigger=el?el.value.trim():''; break; }
    case 2: { if(currentRole==='family'){const ci=document.getElementById('input-reaction-custom');const ch=document.querySelector('#reaction-chips .tag-btn--selected');data.patientReaction=(ci?ci.value.trim():'')||(ch?ch.dataset.value:'');} else {const el=document.getElementById('input-emotion-text');if(el)data.emotionText=el.value;} break; }
    case 3: { if(currentRole==='self'){const el=document.getElementById('input-strategy-note');if(el)data.strategyNote=el.value.trim();} else {const el=document.getElementById('input-emotion-text');if(el)data.emotionText=el.value;} break; }
    case 4: { if(currentRole==='self'){const el=document.getElementById('input-note');if(el)data.note=el.value.trim();} else {const el=document.getElementById('input-strategy-note');if(el)data.strategyNote=el.value.trim();} break; }
    case 5: { const el=document.getElementById('input-note'); if(el)data.note=el.value.trim(); break; }
  }
}

function validateStep() {
  switch(currentStep) {
    case 1: { const el=document.getElementById('input-trigger'); data.trigger=el?el.value.trim():''; if(!data.trigger){showToast('请简单描述发生了什么');return false;} return true; }
    case 2: { if(currentRole==='family'){const ci=document.getElementById('input-reaction-custom');const ch=document.querySelector('#reaction-chips .tag-btn--selected');data.patientReaction=(ci?ci.value.trim():'')||(ch?ch.dataset.value:'');if(!data.patientReaction){showToast('请选择或描述TA的状态');return false;}return true;} const et=document.getElementById('input-emotion-text');if(et)data.emotionText=et.value;if(!data.emotionText||!data.emotionText.trim()){showToast('请记录你的感受');return false;}return true; }
    case 3: { if(currentRole==='family'){const et=document.getElementById('input-emotion-text');if(et)data.emotionText=et.value;if(!data.emotionText||!data.emotionText.trim()){showToast('请记录你的感受');return false;}} else {if(data.strategies.length===0){showToast('请至少选一个你做过的事');return false;}}const el=document.getElementById('input-strategy-note');data.strategyNote=el?el.value.trim():'';return true; }
    case 4: { if(currentRole==='self'){if(!data.mood){showToast('请选择一个心情');return false;}} else {if(data.strategies.length===0){showToast('请至少选一个应对方式');return false;}}const el=document.getElementById('input-note');data.note=el?el.value.trim():'';return true; }
    case 5: { if(!data.mood){showToast('请选择一个心情');return false;} const el=document.getElementById('input-note');data.note=el?el.value.trim():'';return true; }
  }
  return true;
}

export async function nextStep() { collectStepData(); if(!validateStep())return; if(currentStep<totalSteps){currentStep++;renderStep();} else await saveCurrentEntry(); }
export function prevStep() { collectStepData(); if(currentStep>1){currentStep--;renderStep();} }

async function saveCurrentEntry() {
  try { collectStepData(); data.createdAt=Date.now(); data.role=currentRole; await saveEntry(data); showToast('记录已保存 💚'); setTimeout(()=>{resetData();window.location.hash='#record';},800); }
  catch(err){console.error(err);showToast('保存失败');}
}

function esc(str) { if(!str)return''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
