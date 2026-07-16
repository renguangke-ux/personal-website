const fs   = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CAT_MAP = {
  law:  { label: '法律',      cls: 'cat-law'  },
  ai:   { label: 'AI 与法律', cls: 'cat-ai'   },
  econ: { label: '法经济学',  cls: 'cat-econ' },
  book: { label: '读书笔记',  cls: 'cat-book' },
};

function readDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return data;
    })
    .filter(d => d.title)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function articleCard(a) {
  const cat  = CAT_MAP[a.category] || { label: a.category, cls: 'cat-law' };
  const link = a.link || '#';
  const year = a.date ? new Date(a.date).getFullYear() + '年' : '';
  const type = a.type || '查看 →';
  return `
      <div class="article-card" data-cat="${a.category}" onclick="location.href='${link}'">
        <span class="article-cat ${cat.cls}">${cat.label}</span>
        <h3>${a.title}</h3>
        <p>${a.summary || ''}</p>
        <div class="article-meta"><span>${year}</span><span>${type}</span></div>
      </div>`;
}

function timelineItem(a) {
  const d = a.date ? new Date(a.date) : null;
  const dateStr = d
    ? `${d.getFullYear()}年 · ${d.getMonth() + 1}月`
    : '';
  return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-date">${dateStr}</div>
        <h3>${a.title}</h3>
        <p>${a.description || ''}</p>
      </div>`;
}

const articles   = readDir('content/articles');
const activities = readDir('content/activities');

const articlesHTML   = articles.length
  ? articles.map(articleCard).join('\n')
  : '<p style="color:var(--muted);padding:1rem 0">暂无文章</p>';

const activitiesHTML = activities.length
  ? activities.map(timelineItem).join('\n')
  : '<p style="color:var(--muted);padding:1rem 0">暂无活动记录</p>';

let tpl = fs.readFileSync('templates/index.template.html', 'utf8');
tpl = tpl
  .replace('<!-- {{ARTICLES}} -->', articlesHTML)
  .replace('<!-- {{ACTIVITIES}} -->', activitiesHTML);

fs.writeFileSync('index.html', tpl);
console.log(`✓ 构建完成：${articles.length} 篇文章，${activities.length} 个活动`);
