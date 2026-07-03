/**
 * Vercel Serverless API —— 反馈收集
 *
 * POST /api/feedback  →  提交反馈
 * GET  /api/feedback?pw=xxx  →  查看所有反馈（需密码）
 */

// 本地开发用内存存储，线上用 Vercel KV
let memoryStore = [];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 提交反馈
  if (req.method === 'POST') {
    try {
      const { device_id, content } = req.body;
      if (!content) return res.status(400).json({ error: 'content required' });

      const feedback = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        device_id: device_id || 'unknown',
        content,
        created_at: new Date().toISOString(),
      };

      // 尝试用 KV，失败则用内存
      try {
        const { kv } = await import('@vercel/kv');
        const existing = await kv.get('feedbacks') || [];
        existing.push(feedback);
        await kv.set('feedbacks', existing);
      } catch {
        memoryStore.push(feedback);
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 查看反馈（需密码）
  if (req.method === 'GET') {
    const pw = new URL(req.url, 'http://localhost').searchParams.get('pw');
    const ADMIN_PW = process.env.ADMIN_PASSWORD || 'ray171215.';

    if (pw !== ADMIN_PW) return res.status(401).json({ error: 'wrong password' });

    try {
      try {
        const { kv } = await import('@vercel/kv');
        const feedbacks = await kv.get('feedbacks') || [];
        return res.status(200).json(feedbacks);
      } catch {
        return res.status(200).json(memoryStore);
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
}
