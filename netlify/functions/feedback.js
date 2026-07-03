/**
 * Netlify Function —— 反馈收集（Netlify Blobs 持久化）
 * POST /.netlify/functions/feedback  →  提交反馈
 * GET  /.netlify/functions/feedback?pw=xxx  →  查看所有反馈
 */
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const store = getStore('feedbacks');
  const ADMIN_PW = process.env.ADMIN_PASSWORD || 'ray171215.';

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

      const existing = await store.get('list', { type: 'json' }) || [];
      existing.push(feedback);
      await store.set('list', JSON.stringify(existing));

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // 查看反馈
  if (event.httpMethod === 'GET') {
    const pw = event.queryStringParameters?.pw || '';
    if (pw !== ADMIN_PW) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'wrong password' }) };
    }
    try {
      const list = await store.get('list', { type: 'json' }) || [];
      return { statusCode: 200, headers, body: JSON.stringify(list) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
};
