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

// ====== 自定义标签（增删改） ======
const CUSTOM_TAGS_KEY = 'mood-diary-custom-tags';
const OVERRIDES_KEY = 'mood-diary-tag-overrides';

/** 获取用户自定义情绪标签 */
export function getCustomTags() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TAGS_KEY)) || []; } catch (_) { return []; }
}

/** 获取默认标签的覆盖（用户修改过的默认标签） */
export function getTagOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}; } catch (_) { return {}; }
}

/** 添加自定义标签 */
export function addCustomTag(label, emoji = '🏷️') {
  const tags = getCustomTags();
  const id = 'custom_' + Date.now();
  tags.push({ id, label, emoji });
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
  return { id, label, emoji };
}

/** 更新标签（默认标签写覆盖，自定义标签直接改） */
export function updateTag(id, label, emoji) {
  if (id.startsWith('custom_')) {
    const tags = getCustomTags().map(t => t.id === id ? { ...t, label, emoji } : t);
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
  } else {
    const overrides = getTagOverrides();
    overrides[id] = { label, emoji };
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  }
}

/** 删除自定义标签 */
export function removeCustomTag(id) {
  const tags = getCustomTags().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}

/** 获取全部情绪标签（默认用覆盖版本 + 自定义） */
export function getAllEmotionTags() {
  const overrides = getTagOverrides();
  const defaultTags = EMOTION_TAGS.map(t => {
    if (overrides[t.id]) return { ...t, label: overrides[t.id].label, emoji: overrides[t.id].emoji };
    return t;
  });
  return [...defaultTags, ...getCustomTags()];
}

// ====== 情绪标签（两个板块共用） ======
export const EMOTION_TAGS = [
  { id: 'helpless', label: '要鼠了', emoji: '🐭' },
  { id: 'anxious', label: 'CPU烧了', emoji: '🔥' },
  { id: 'angry', label: '红温了', emoji: '🌡️' },
  { id: 'exhausted', label: '电量告急', emoji: '🔋' },
  { id: 'calm', label: '平静', emoji: '🍃' },
  { id: 'understanding', label: '狠狠懂了', emoji: '💡' },
  { id: 'sad', label: '破防了', emoji: '💔' },
  { id: 'confused', label: '我脑子呢', emoji: '🌀' },
  { id: 'scared', label: '瑟瑟发抖', emoji: '🍂' },
  { id: 'hopeful', label: '我又行了', emoji: '✨' },
];

// ====== 策略标签（分板块） ======

/** 自我调节策略 —— 我的记录 */
export const SELF_STRATEGY_TAGS = [
  { id: 'breathe', label: '深呼吸冷静一下', emoji: '🌬️' },
  { id: 'distract', label: '刷点别的转移注意', emoji: '📱' },
  { id: 'talk', label: '找人唠五块钱的', emoji: '🫶' },
  { id: 'exercise', label: '出去走走散散', emoji: '🚶' },
  { id: 'write', label: '写下来倒一倒', emoji: '🖊️' },
  { id: 'accept', label: '算了就这样吧', emoji: '🌊' },
  { id: 'recall', label: '用上次的方法试试', emoji: '🔆' },
  { id: 'professional_self', label: '寻找专业支援', emoji: '📞' },
  { id: 'selfcare_self', label: '先爱一下老己', emoji: '🛀' },
];

/** 陪伴支持策略 —— 陪伴记录 */
export const FAMILY_STRATEGY_TAGS = [
  { id: 'listen', label: '安静听TA说', emoji: '🫶' },
  { id: 'space', label: '给TA一点空间', emoji: '🍃' },
  { id: 'distract_gentle', label: '带TA换个话题', emoji: '🎵' },
  { id: 'breathe_together', label: '和TA一起深呼吸', emoji: '🌬️' },
  { id: 'professional', label: '寻找专业支援', emoji: '📞' },
  { id: 'boundary', label: '画条线保护自己', emoji: '🚪' },
  { id: 'selfcare', label: '爱一下老己', emoji: '🛀' },
  { id: 'gentle_talk', label: '好好说话不着急', emoji: '🤗' },
  { id: 'validate', label: '认可TA的感受', emoji: '🩵' },
  { id: 'observe', label: '先观察不评判', emoji: '👁️' },
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
  '情绪起伏比较大',
  '哭了',
  '沉默、不想说话',
  '看起来有点烦',
  '在责怪自己',
  '不想沟通',
  '身体不太舒服',
  '反复问同一件事',
  '其他',
];
