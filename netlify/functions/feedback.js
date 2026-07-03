/**
 * Netlify Function —— 反馈收集
 * POST /.netlify/functions/feedback  →  提交反馈
 * GET  /.netlify/functions/feedback?pw=xxx  →  查看所有反馈
 */

// 简单内存存储（Netlify 免费层够用，重启会清空但不影响测试）
const STORE_FILE = '/tmp/feedbacks.json';
const fs = require('fs');

function readStore() {
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); } catch { return []; }
}
function writeStore(data) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data));
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 提交反馈
  if (event.httpMethod === 'POST') {
    try {
      const { device_id, content } = JSON.parse(event.body);
      if (!content) return { statusCode: 400, headers, body: JSON.stringify({ error: 'content required' }) };

      const feedback = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        device_id: device_id || 'unknown',
        content,
        created_at: new Date().toISOString(),
      };

      const store = readStore();
      store.push(feedback);
      writeStore(store);

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // 查看反馈（需密码）
  if (event.httpMethod === 'GET') {
    const pw = event.queryStringParameters?.pw || '';
    const ADMIN_PW = process.env.ADMIN_PASSWORD || 'ray171215.';

    if (pw !== ADMIN_PW) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'wrong password' }) };
    }

    const store = readStore();
    return { statusCode: 200, headers, body: JSON.stringify(store) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
};
