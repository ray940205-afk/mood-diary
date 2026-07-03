/**
 * 生成 UUID v4
 */
export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 格式化时间戳为友好的中文日期
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayStr = new Date(now - 86400000).toISOString().slice(0, 10);

  if (dateStr === todayStr) return '今天';
  if (dateStr === yesterdayStr) return '昨天';

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays < 7) {
    return `${diffDays}天前 · ${weekDays[d.getDay()]}`;
  }

  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日 · ${weekDays[d.getDay()]}`;
}

/**
 * 格式化时间戳为相对时间
 */
export function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  const d = new Date(timestamp);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 截断文本
 */
export function truncate(text, maxLen = 80) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

/**
 * 显示 Toast 提示
 */
export function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('toast--show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('toast--show');
  }, duration);
}

/**
 * 确认对话框
 */
export function confirmDialog(message) {
  return window.confirm(message);
}

/**
 * 防抖
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ====== 情绪标签（两个板块共用） ======
export const EMOTION_TAGS = [
  { id: 'helpless', label: '无助', emoji: '🥺' },
  { id: 'anxious', label: '焦虑', emoji: '😟' },
  { id: 'angry', label: '愤怒', emoji: '😠' },
  { id: 'exhausted', label: '疲惫', emoji: '😴' },
  { id: 'calm', label: '平静', emoji: '🙂' },
  { id: 'understanding', label: '理解', emoji: '🩷' },
  { id: 'sad', label: '悲伤', emoji: '💧' },
  { id: 'confused', label: '困惑', emoji: '😶' },
  { id: 'scared', label: '害怕', emoji: '🙈' },
  { id: 'hopeful', label: '有希望', emoji: '🌸' },
];

// ====== 策略标签（分板块） ======

/** 自我调节策略 —— 我的记录 */
export const SELF_STRATEGY_TAGS = [
  { id: 'breathe', label: '深呼吸', emoji: '🌬️' },
  { id: 'distract', label: '转移注意力', emoji: '🎵' },
  { id: 'talk', label: '找人倾诉', emoji: '🫶' },
  { id: 'exercise', label: '运动', emoji: '🚶' },
  { id: 'write', label: '写下来', emoji: '🖊️' },
  { id: 'accept', label: '接纳当下的感受', emoji: '🌊' },
  { id: 'recall', label: '用过往有效的方法', emoji: '🔆' },
  { id: 'professional_self', label: '寻求专业帮助', emoji: '📞' },
  { id: 'selfcare_self', label: '照顾自己', emoji: '🛀' },
];

/** 陪伴支持策略 —— 陪伴记录 */
export const FAMILY_STRATEGY_TAGS = [
  { id: 'listen', label: '倾听陪伴', emoji: '🫶' },
  { id: 'space', label: '给对方空间', emoji: '🍃' },
  { id: 'distract_gentle', label: '温柔转移注意力', emoji: '🎵' },
  { id: 'breathe_together', label: '一起深呼吸', emoji: '🌬️' },
  { id: 'professional', label: '寻求专业帮助', emoji: '📞' },
  { id: 'boundary', label: '设定边界', emoji: '🚪' },
  { id: 'selfcare', label: '照顾好自己', emoji: '🛀' },
  { id: 'gentle_talk', label: '温和沟通', emoji: '🤗' },
  { id: 'validate', label: '认可对方的感受', emoji: '🩵' },
  { id: 'observe', label: '记录观察', emoji: '👁️' },
];

/** 根据角色获取策略标签 */
export function getStrategiesByRole(role) {
  return role === 'self' ? SELF_STRATEGY_TAGS : FAMILY_STRATEGY_TAGS;
}

/** 所有策略标签（用于历史筛选等场景） */
export const STRATEGY_TAGS = [...SELF_STRATEGY_TAGS, ...FAMILY_STRATEGY_TAGS];

// ====== 患者反应（仅陪伴记录使用） ======
/** 心情标签 —— 替代评分 */
export const MOOD_TAGS = [
  { id: 'good', label: 'Nice Mood', emoji: '😊' },
  { id: 'neutral', label: 'Peace of Mind', emoji: '😌' },
  { id: 'bad', label: 'Bad Mood', emoji: '🥲' },
];

export const REACTION_OPTIONS = [
  '情绪波动较大',
  '哭泣',
  '沉默、不愿说话',
  '显得烦躁',
  '自责或自我否定',
  '不愿沟通',
  '身体不适（如头痛、胃痛等）',
  '反复询问或确认',
  '其他',
];
