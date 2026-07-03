/**
 * Netlify Function —— 反馈收集（轻量方案：JSON 文件存储）
 * Netlify Functions 实例在闲置时会保留内存状态，可跨请求共享
 */

// 模块级变量在函数实例存活期间持久保留
let feedbackStore = [];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const ADMIN_PW = process.env.ADMIN_PASSWORD || 'ray171215.';

  if (event.httpMethod === 'POST') {
    try {
      const { device_id, content } = JSON.parse(event.body);
      if (!content) return { statusCode: 400, headers, body: JSON.stringify({ error: 'content required' }) };
      feedbackStore.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        device_id: device_id || 'unknown',
        content,
        created_at: new Date().toISOString(),
      });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod === 'GET') {
    const pw = event.queryStringParameters?.pw || '';
    if (pw !== ADMIN_PW) return { statusCode: 401, headers, body: JSON.stringify({ error: 'wrong password' }) };
    return { statusCode: 200, headers, body: JSON.stringify(feedbackStore) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
};
