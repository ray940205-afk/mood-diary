/**
 * 用户昵称管理
 */
var USER_NAME_KEY = 'mood-diary-user-name';

/** 获取用户昵称 */
export function getUserName() {
  return localStorage.getItem(USER_NAME_KEY) || '';
}

/** 设置用户昵称 */
export function setUserName(name) {
  localStorage.setItem(USER_NAME_KEY, name);
}

/** 是否已设置昵称 */
export function hasUserName() {
  return !!localStorage.getItem(USER_NAME_KEY);
}
