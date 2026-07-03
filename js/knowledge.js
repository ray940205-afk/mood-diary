/**
 * 知识库页面 —— 支持受众筛选（本人 / 家属 / 通用）
 */

const ARTICLES = [
  {
    id: 'understand-worry',
    icon: '😰',
    audience: 'both',
    title: '理解持续的担忧和紧张',
    content: `
      <h3>这不仅仅是"想太多"</h3>
      <p>持续的担忧和紧张是一种常见的困扰，表现为过度的不安和恐惧。这些感受超出了普通的紧张范围，会显著影响日常生活。</p>
      <h3>常见的表现</h3>
      <ul>
        <li>持续不安、紧张、提心吊胆</li>
        <li>心跳加速、出汗、手抖</li>
        <li>难以集中注意力</li>
        <li>睡眠困难（入睡难、易醒）</li>
        <li>回避让人紧张的场景</li>
        <li>肌肉紧张、容易疲劳</li>
      </ul>
      <h3>常见误区</h3>
      <ul>
        <li>❌ "就是性格软弱" → ✅ 这是生理、心理、环境共同作用的结果</li>
        <li>❌ "忍一忍就过去了" → ✅ 专业的支持可以极大地改善状况</li>
        <li>❌ "只是想获得关注" → ✅ 当事人真实地在经历痛苦</li>
        <li>❌ "药物会依赖，不能吃" → ✅ 在专业指导下用药是安全有效的</li>
      </ul>
      <div class="highlight-box">
        💡 <strong>最重要的事：</strong>不要否定自己或他人的感受。说"别担心"、"没什么大不了的"往往适得其反。理解和接纳是第一步。
      </div>
    `,
  },
  {
    id: 'understand-low-mood',
    icon: '😢',
    audience: 'both',
    title: '理解持续的情绪低落',
    content: `
      <h3>这不只是"心情不好"</h3>
      <p>持续的情绪低落是一种常见的心理困扰，核心特征是持久的悲伤感、兴趣减退和精力下降。它不是一个人可以"想开点"就能摆脱的。</p>
      <h3>常见的表现</h3>
      <ul>
        <li>持续的悲伤、空虚、绝望感</li>
        <li>对曾经喜欢的事物失去兴趣</li>
        <li>食欲和体重显著变化</li>
        <li>睡眠问题（失眠或嗜睡）</li>
        <li>疲劳、精力严重不足</li>
        <li>自我价值感低下、过度自责</li>
        <li>难以做决定、思维迟缓</li>
      </ul>
      <h3>常见误区</h3>
      <ul>
        <li>❌ "开心一点就好了" → ✅ 这是一种真实的困扰，不是情绪选择</li>
        <li>❌ "TA看起来挺好的，不可能有事" → ✅ 很多人会在外人面前掩饰</li>
        <li>❌ "药物会改变性格" → ✅ 药物帮助恢复大脑化学平衡，不会改变一个人</li>
      </ul>
      <div class="highlight-box highlight-box--warm">
        ⚠️ 如果你或你关心的人出现了伤害自己的想法，请<strong>认真对待</strong>。不要回避这个话题，直接寻求专业支持。心理援助热线：<strong>400-161-9995</strong>
      </div>
    `,
  },
  {
    id: 'intense-fear',
    icon: '🫀',
    audience: 'both',
    title: '当强烈的恐惧突然来袭',
    content: `
      <h3>识别强烈的恐惧反应</h3>
      <p>强烈的恐惧通常在几分钟内达到高峰，可能出现：心跳剧烈、呼吸困难、胸闷、头晕、手脚发麻、濒死感、失控感。</p>
      <h3>如果你正在经历：</h3>
      <ul>
        <li><strong>提醒自己：</strong>这虽然非常难受，但<strong>不会致命</strong>，通常 10-30 分钟内会自然消退</li>
        <li><strong>深呼吸：</strong>吸气4秒、屏住2秒、呼气6秒，反复几次</li>
        <li><strong>5-4-3-2-1 接地练习：</strong>说出看到的5样东西 → 能触摸的4样 → 听到的3个声音 → 闻到的2种气味 → 1种味道</li>
        <li><strong>把注意力放在脚底：</strong>感受脚踩在地上的感觉</li>
      </ul>
      <h3>如果你在陪伴正在经历的人：</h3>
      <ul>
        <li><strong>保持冷静：</strong>你的平静本身就有安抚作用</li>
        <li><strong>用温和平稳的语气说话：</strong>"我在这里陪着你，这很快就会过去"</li>
        <li><strong>引导深呼吸：</strong>和TA一起缓慢呼吸</li>
        <li><strong>不要强迫：</strong>不要说"你冷静下来"、"这没什么"</li>
        <li><strong>过后：</strong>让TA休息，不要急着讨论</li>
      </ul>
      <div class="highlight-box">
        🧘 <strong>记住：</strong>这种强烈的恐惧虽然非常难受，但它<strong>不致命</strong>，会自然消退。你的陪伴就是最大的帮助。
      </div>
    `,
  },
  {
    id: 'selfcare-self',
    icon: '🌱',
    audience: 'self',
    title: '照顾好自己：日常小事的力量',
    content: `
      <h3>小小的自我照顾，大大的不同</h3>
      <p>当你正在经历情绪的起伏，照顾好自己可能是最难也最重要的事。以下是一些可以在日常生活中尝试的小事：</p>
      <h3>身体层面的照顾</h3>
      <ul>
        <li><strong>规律进食：</strong>哪怕只是少量多餐，让身体有能量</li>
        <li><strong>温和的运动：</strong>散步、伸展、瑜伽——不需要很剧烈</li>
        <li><strong>晒太阳：</strong>每天10-15分钟，对情绪有真实的帮助</li>
        <li><strong>保证睡眠节奏：</strong>固定时间上床和起床，即使睡不着也躺着休息</li>
      </ul>
      <h3>情绪层面的照顾</h3>
      <ul>
        <li><strong>允许自己有情绪：</strong>感到难过、愤怒、害怕都是正常的</li>
        <li><strong>写下来：</strong>把脑袋里的想法倒出来，不需整理</li>
        <li><strong>做一件小事：</strong>哪怕只是洗个脸、整理床铺，给自己一点成就感</li>
        <li><strong>靠近让你感觉安全的人：</strong>不需要说什么，只是待在一起</li>
      </ul>
      <h3>心态层面</h3>
      <ul>
        <li><strong>降低对自己的要求：</strong>今天只做了30%也没关系</li>
        <li><strong>不和别人比较：</strong>你的节奏就是你该有的节奏</li>
        <li><strong>庆祝小进步：</strong>今天起床了，今天出门了，都是胜利</li>
      </ul>
      <div class="highlight-box highlight-box--warm">
        💚 <strong>你已经很努力了。</strong>每天醒来面对这一切本身就是一种勇气。对自己温柔一点，你值得被善待。
      </div>
    `,
  },
  {
    id: 'selfcare-family',
    icon: '🌿',
    audience: 'family',
    title: '陪伴者的自我照顾',
    content: `
      <h3>你不能从空杯子里倒水</h3>
      <p>陪伴有情绪困扰的人是持久战。很多陪伴者把自己的需求放在最后，最终导致自己也陷入困境。照顾好自己不是自私——它是你能持续支持所关心之人的前提。</p>
      <h3>自我照顾清单</h3>
      <ul>
        <li><strong>保持自己的社交：</strong>定期见朋友，维持你的支持网络</li>
        <li><strong>保证充足的睡眠：</strong>睡眠不足会严重损害你的情绪调节能力</li>
        <li><strong>做你喜欢的事：</strong>哪怕每天只有15分钟</li>
        <li><strong>设定情感边界：</strong>你可以关心，但不能替对方承受一切</li>
        <li><strong>找人倾诉：</strong>朋友、家人、心理咨询师都可以</li>
        <li><strong>运动：</strong>哪怕只是散步，对情绪有显著帮助</li>
        <li><strong>接受自己的情绪：</strong>感到愤怒、沮丧、疲惫都是正常的</li>
      </ul>
      <div class="highlight-box highlight-box--warm">
        💚 <strong>你并不孤单。</strong>全国有数以百万计的陪伴者和你有相似的经历。允许自己有情绪，允许自己不完美，允许自己寻求帮助。
      </div>
    `,
  },
  {
    id: 'professional-help',
    icon: '📞',
    audience: 'both',
    title: '什么时候可以寻求专业支持',
    content: `
      <h3>以下情况建议寻求专业支持：</h3>
      <ul>
        <li>困扰持续超过两周且没有好转</li>
        <li>日常生活受到明显影响（工作、学习、社交困难）</li>
        <li>出现伤害自己的想法</li>
        <li>伴随过量饮酒或药物依赖</li>
        <li>身体不适明显（体重剧变、持续失眠等）</li>
      </ul>
      <h3>可以寻求哪些支持？</h3>
      <ul>
        <li><strong>精神科医生：</strong>诊断、药物方案</li>
        <li><strong>心理咨询师：</strong>心理治疗（如CBT认知行为疗法）</li>
        <li><strong>社区心理服务站：</strong>许多城市有免费或低价服务</li>
        <li><strong>线上心理平台：</strong>更便捷的咨询方式</li>
      </ul>
      <h3>援助热线</h3>
      <ul>
        <li>全国心理援助热线：<strong>400-161-9995</strong></li>
        <li>北京心理危机研究与干预中心：<strong>010-82951332</strong></li>
      </ul>
      <div class="highlight-box">
        🤝 寻求专业帮助不是软弱，而是对自己负责的勇敢行为。
      </div>
    `,
  },
  {
    id: 'communication',
    icon: '💬',
    audience: 'family',
    title: '如何更好地沟通和陪伴',
    content: `
      <h3>有效沟通的原则</h3>
      <h3>✅ 有帮助的沟通方式</h3>
      <ul>
        <li><strong>倾听，而不是解决：</strong>"你想聊聊吗？"比"你应该..."好得多</li>
        <li><strong>认可对方的感受：</strong>"听起来你真的很痛苦，这一定很难"</li>
        <li><strong>表达关心而非指责：</strong>"我注意到你最近睡不好，我有点担心你"</li>
        <li><strong>用"我"开头：</strong>"我看到你难过的时候，我也很难受"</li>
        <li><strong>提供具体的帮助：</strong>"我可以帮你预约医生"</li>
        <li><strong>保持耐心：</strong>恢复是一个漫长的过程，不是线性的</li>
      </ul>
      <h3>❌ 尽量避免说的话</h3>
      <ul>
        <li>"你想开点就好了"</li>
        <li>"比你辛苦的人多了"</li>
        <li>"你是不是太闲了"</li>
        <li>"我也经历过，我靠意志力走出来了"</li>
        <li>"你这样对得起我吗？"</li>
        <li>"你到底想要我怎么做？"</li>
      </ul>
      <div class="highlight-box">
        🤝 <strong>最好的支持不是"修复"对方，而是让对方感到被理解和接纳。</strong>你不需要提供所有答案，你的陪伴本身就是答案。
      </div>
    `,
  },
  {
    id: 'self-methods',
    icon: '🧘',
    audience: 'self',
    title: '可以尝试的自我调节方法',
    content: `
      <h3>每个人都能找到适合自己的方法</h3>
      <p>以下方法不一定每个都适合你，可以一个个尝试，找到对自己有效的：</p>
      <h3>身体类</h3>
      <ul>
        <li><strong>深呼吸：</strong>吸气4秒 → 屏住2秒 → 呼气6秒。简单但有效</li>
        <li><strong>渐进式肌肉放松：</strong>从脚趾开始，依次收紧再放松每个肌肉群</li>
        <li><strong>冷水刺激：</strong>用冷水洗脸、握冰块，快速将注意力拉回当下</li>
        <li><strong>有节奏的运动：</strong>散步、跑步、跳舞——让身体带动情绪</li>
      </ul>
      <h3>认知类</h3>
      <ul>
        <li><strong>把想法写下来：</strong>不用整理，只是把脑袋里的东西倒出来</li>
        <li><strong>区分"事实"和"想法"：</strong>"我觉得大家都在看我"≠"大家都在看我"</li>
        <li><strong>给自己一个"担忧时间"：</strong>每天固定15分钟专门担忧，其余时间告诉自己"留到担忧时间再想"</li>
      </ul>
      <h3>感官类</h3>
      <ul>
        <li><strong>5-4-3-2-1练习：</strong>看5样东西 + 摸4样 + 听3个声音 + 闻2种气味 + 尝1种味道</li>
        <li><strong>舒适的触感：</strong>毛毯、热水袋、抱枕——用触觉安抚自己</li>
        <li><strong>听平静的音乐或自然声音</strong></li>
      </ul>
      <div class="highlight-box">
        🌱 <strong>不追求完美，只追求"比刚才好一点"。</strong>每一种尝试都值得被肯定。
      </div>
    `,
  },
];

let openCards = new Set();
let currentAudience = 'all'; // 'all' | 'self' | 'family'

/**
 * 渲染知识库
 */
export function renderKnowledge() {
  currentAudience = 'all';
  openCards.clear();

  const container = document.getElementById('knowledge-list');
  if (!container) return;

  renderContent(container);
}

function renderContent(container) {
  // 受众筛选按钮
  const filterHtml = `
    <div class="knowledge-filter">
      <button class="chip ${currentAudience === 'all' ? 'chip--active' : ''}" data-audience="all">全部</button>
      <button class="chip ${currentAudience === 'self' ? 'chip--active' : ''}" data-audience="self">🌱 自我调节</button>
      <button class="chip ${currentAudience === 'family' ? 'chip--active' : ''}" data-audience="family">💝 陪伴支持</button>
    </div>
  `;

  const filteredArticles = currentAudience === 'all'
    ? ARTICLES
    : ARTICLES.filter((a) => a.audience === currentAudience || a.audience === 'both');

  const cardsHtml = filteredArticles.map((article) => {
    const isOpen = openCards.has(article.id);
    return `
      <div class="knowledge-card ${isOpen ? 'knowledge-card--open' : ''}" data-id="${article.id}">
        <div class="knowledge-card__header" data-toggle="${article.id}">
          <span class="knowledge-card__title">
            <span class="knowledge-card__icon">${article.icon}</span>
            ${article.title}
          </span>
          <span class="knowledge-card__arrow">▼</span>
        </div>
        <div class="knowledge-card__body">
          <div class="knowledge-card__content">${article.content}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = filterHtml + cardsHtml;

  // 绑定筛选
  container.querySelectorAll('[data-audience]').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentAudience = chip.dataset.audience;
      renderContent(container);
    });
  });

  // 绑定展开
  container.querySelectorAll('.knowledge-card__header').forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.knowledge-card');
      const id = card.dataset.id;
      openCards.has(id) ? openCards.delete(id) : openCards.add(id);
      card.classList.toggle('knowledge-card--open');
    });
  });
}
