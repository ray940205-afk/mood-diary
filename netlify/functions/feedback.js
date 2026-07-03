/**
 * Netlify Function —— 反馈收集（内存 + /tmp 双写持久化）
 */
const fs = require('fs');
const STORE_FILE = '/tmp/feedbacks.json';

function loadStore() {
  try { const data = fs.readFileSync(STORE_FILE, 'utf8'); return JSON.parse(data); } catch { return []; }
}
function saveStore(data) {
  try { fs.writeFileSync(STORE_FILE, JSON.stringify(data)); } catch {}
}

// 启动时从 /tmp 恢复
let store = loadStore();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const ADMIN_PW = process.env.ADMIN_PASSWORD || 'ray171215.';

  // 提交反馈
  if (event.httpMethod === 'POST') {
    try {
      const { device_id, content, category } = JSON.parse(event.body);
      if (!content) return { statusCode: 400, headers, body: JSON.stringify({ error: 'content required' }) };
      store.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        device_id: device_id || 'unknown',
        content,
        category: category || 'other',
        created_at: new Date().toISOString(),
      });
      saveStore(store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // 删除反馈
  if (event.httpMethod === 'DELETE') {
    const pw = event.queryStringParameters?.pw || '';
    const id = event.queryStringParameters?.id || '';
    if (pw !== ADMIN_PW) return { statusCode: 401, headers, body: JSON.stringify({ error: 'wrong password' }) };
    store = store.filter(f => f.id !== id);
    saveStore(store);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // 查看反馈
  if (event.httpMethod === 'GET') {
    const pw = event.queryStringParameters?.pw || '';
    if (pw !== ADMIN_PW) return { statusCode: 401, headers, body: JSON.stringify({ error: 'wrong password' }) };
    return { statusCode: 200, headers, body: JSON.stringify(store) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
};
