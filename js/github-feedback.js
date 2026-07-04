/**
 * GitHub Issues 反馈提交
 * 用户反馈 → 创建 GitHub Issue（标签：反馈）
 * 管理员在 https://github.com/ray940205-afk/mood-diary/issues 查看
 */
function getToken() {
  return localStorage.getItem('mood-diary-gh-token') || '';
}

export async function submitFeedback(userName, category, subject, content) {
  var token = getToken();
  if (!token) return;

  var catLabel = { suggestion: '建议', bug: 'Bug', other: '其他' }[category] || '其他';
  var title = '[' + catLabel + '] ' + subject;
  var body = '**来自：** ' + (userName || '匿名用户') + '\n\n' + content;

  try {
    await fetch('https://api.github.com/repos/ray940205-afk/mood-diary/issues', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: title.slice(0, 200),
        body: body,
        labels: ['反馈']
      }),
    });
  } catch (_) {}
}
