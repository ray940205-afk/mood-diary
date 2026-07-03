/**
 * Supabase 数据同步模块
 * 将匿名使用数据上报到云端，供管理后台查看
 */
const SUPABASE_URL = 'https://xraoohpkytbwguhwhrbl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYW9vaHBreXRid2d1aHdocmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjA4NDMsImV4cCI6MjA5ODYzNjg0M30.wAbiZjjrw43dQt7vf5DCRSqW-KZht3qv_lfVV-CKvI8';

let supabase = null;
let initError = null;

async function getClient() {
  if (initError) return null;
  if (supabase) return supabase;
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = mod.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabase;
  } catch (e) {
    initError = e;
    console.error('Supabase 连接失败:', e.message);
    return null;
  }
}

function deviceId() {
  let id = localStorage.getItem('mood-diary-device-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('mood-diary-device-id', id); }
  return id;
}

export async function trackVisit() {
  const sb = await getClient();
  if (!sb) return;
  try {
    const did = deviceId();
    const { error } = await sb.from('visitors').upsert({ device_id: did, last_seen: new Date().toISOString() }, { onConflict: 'device_id' });
    if (error) console.error('trackVisit error:', error.message);
  } catch (e) { console.error('trackVisit failed:', e.message); }
}

export async function syncEntry(entry) {
  const sb = await getClient();
  if (!sb) return;
  try {
    const { error } = await sb.from('entries').insert({
      device_id: deviceId(), type: entry.type, role: entry.role,
      mood: entry.mood || null, content: (entry.content || '').slice(0, 200),
      created_at: new Date(entry.createdAt).toISOString(),
    });
    if (error) console.error('syncEntry error:', error.message);
  } catch (e) { console.error('syncEntry failed:', e.message); }
}

export async function sendFeedback(text) {
  const sb = await getClient();
  if (!sb) return;
  try {
    const { error } = await sb.from('feedback').insert({
      device_id: deviceId(), content: text,
      created_at: new Date().toISOString(),
    });
    if (error) console.error('sendFeedback error:', error.message);
  } catch (e) { console.error('sendFeedback failed:', e.message); }
}
