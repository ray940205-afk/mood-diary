/**
 * Supabase 数据同步模块
 * 将匿名使用数据上报到云端，供管理后台查看
 *
 * 配置：替换下方的 SUPABASE_URL 和 SUPABASE_KEY
 * 在 https://supabase.com 创建免费项目即可获取
 */
const SUPABASE_URL = 'https://xraoohpkytbwguhwhrbl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYW9vaHBreXRid2d1aHdocmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjA4NDMsImV4cCI6MjA5ODYzNjg0M30.wAbiZjjrw43dQt7vf5DCRSqW-KZht3qv_lfVV-CKvI8';

let supabase = null;

async function getClient() {
  if (SUPABASE_URL.includes('YOUR_')) return null;
  if (!supabase) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

/** 生成匿名设备ID */
function deviceId() {
  let id = localStorage.getItem('mood-diary-device-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('mood-diary-device-id', id); }
  return id;
}

/** 上报访问记录 */
export async function trackVisit() {
  const sb = await getClient();
  if (!sb) return;
  try {
    const did = deviceId();
    await sb.from('visitors').upsert({ device_id: did, last_seen: new Date().toISOString() }, { onConflict: 'device_id' });
  } catch (_) {}
}

/** 同步记录到云端（匿名） */
export async function syncEntry(entry) {
  const sb = await getClient();
  if (!sb) return;
  try {
    await sb.from('entries').insert({
      device_id: deviceId(),
      type: entry.type,
      role: entry.role,
      mood: entry.mood || null,
      content: (entry.content || '').slice(0, 200),
      created_at: new Date(entry.createdAt).toISOString(),
    });
  } catch (_) {}
}

/** 发送反馈到云端 */
export async function sendFeedback(text) {
  const sb = await getClient();
  if (!sb) return;
  try {
    await sb.from('feedback').insert({
      device_id: deviceId(),
      content: text,
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}
