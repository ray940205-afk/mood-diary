/**
 * 用户昵称管理
 */
var USER_NAME_KEY = 'mood-diary-user-name';

/** 获取用户昵称 */
export function getUserName() {
  // IndexedDB 更持久，localStorage 更快，都检查
  var name = localStorage.getItem(USER_NAME_KEY);
  if (name) return name;
  // 尝试从 sessionStorage 恢复（PWA 跨页面共享）
  name = sessionStorage.getItem(USER_NAME_KEY);
  return name || '';
}

/** 设置用户昵称（双写，PWA 兼容） */
export function setUserName(name) {
  localStorage.setItem(USER_NAME_KEY, name);
  sessionStorage.setItem(USER_NAME_KEY, name);
}

/** 是否已设置昵称 */
export function hasUserName() {
  return !!(localStorage.getItem(USER_NAME_KEY) || sessionStorage.getItem(USER_NAME_KEY));
}
