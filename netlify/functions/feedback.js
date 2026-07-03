/**
 * Netlify Function —— 反馈收集（GitHub API 持久化存储）
 */
var https = require('https');

var TOKEN = process.env.GITHUB_TOKEN || '';
var OWNER = 'ray940205-afk';
var REPO = 'mood-diary';
var FILE_PATH = 'data/feedbacks.json';
var ADMIN_PW = process.env.ADMIN_PASSWORD || 'ray171215.';

// 内存缓存，减少 GitHub API 调用
var cache = null;
var cacheTime = 0;

function ghRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'mood-diary',
      },
    };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); } catch(_) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function readFeedbacks() {
  // 缓存5秒，减少API调用
  if (cache && Date.now() - cacheTime < 5000) return cache;
  try {
    var result = await ghRequest('GET', '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH);
    if (result.content) {
      var content = Buffer.from(result.content, 'base64').toString('utf8');
      cache = JSON.parse(content);
      cacheTime = Date.now();
      cache._sha = result.sha;
      return cache;
    }
  } catch (_) {}
  // 文件不存在，创建
  cache = [];
  cacheTime = Date.now();
  return cache;
}

async function writeFeedbacks(data) {
  var sha = data._sha;
  delete data._sha;
  var content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  var body = { message: '📝 更新反馈数据', content: content };
  if (sha) body.sha = sha;

  var result = await ghRequest('PUT', '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH, body);
  data._sha = result.content ? result.content.sha : '';
  cache = data;
  cacheTime = Date.now();
}

exports.handler = async function(event) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: headers, body: '' };
  if (!TOKEN) return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'GITHUB_TOKEN not set' }) };

  // 提交反馈
  if (event.httpMethod === 'POST') {
    try {
      var body = JSON.parse(event.body);
      if (!body.content) return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'content required' }) };
      var store = await readFeedbacks();
      store.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        user_name: body.user_name || '未命名',
        device_id: body.device_id || 'unknown',
        content: body.content,
        category: body.category || 'other',
        created_at: new Date().toISOString(),
      });
      await writeFeedbacks(store);
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // 删除反馈
  if (event.httpMethod === 'DELETE') {
    var pw = event.queryStringParameters?.pw || '';
    var id = event.queryStringParameters?.id || '';
    if (pw !== ADMIN_PW) return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'wrong password' }) };
    var store = await readFeedbacks();
    store = store.filter(function(f) { return f.id !== id; });
    await writeFeedbacks(store);
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };
  }

  // 查看反馈
  if (event.httpMethod === 'GET') {
    var pw = event.queryStringParameters?.pw || '';
    if (pw !== ADMIN_PW) return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'wrong password' }) };
    try {
      var list = await readFeedbacks();
      return { statusCode: 200, headers: headers, body: JSON.stringify(list) };
    } catch (e) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'method not allowed' }) };
};
