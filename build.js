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
      const { data, content: body } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { ...data, body: body.trim(), slug: f.replace('.md', '') };
    })
    .filter(d => d.title)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function articleCard(a) {
  const cat  = CAT_MAP[a.category] || { label: a.category, cls: 'cat-law' };
  const link = (a.link && a.link !== '#') ? a.link : `articles/${a.slug}.html`;
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

function mdToHtml(md) {
  return md
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="article-figure"><img src="$2" alt="$1" /><figcaption>$1</figcaption></figure>')
    .split(/\n\n+/)
    .map(block => {
      if (/^<h[23]>/.test(block.trim())) return block.trim();
      if (/^<figure/.test(block.trim())) return block.trim();
      return `<p>${block.trim().replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

function generateArticlePage(a, tpl) {
  const cat  = CAT_MAP[a.category] || { label: a.category, cls: 'cat-law' };
  const date = a.date
    ? new Date(a.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
    : '';
  const type = (a.type || '发表论文 →').replace(' →', '');

  const bodyHtml = a.body
    ? `<div class="article-body">${mdToHtml(a.body)}</div>`
    : '';

  const journalBox = a.journal
    ? `<div class="journal-box">
        <div class="journal-icon">📄</div>
        <div>
          <div class="journal-label">发表于</div>
          <div class="journal-name">${a.journal}</div>
          <div class="journal-note">如需全文，可通过知网、万方等学术数据库获取。</div>
        </div>
      </div>`
    : '';

  const externalLink = (a.link && a.link !== '#')
    ? `<a href="${a.link}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:2rem;display:inline-block">查看原文 →</a>`
    : '';

  return tpl
    .replace(/{{TITLE}}/g,         a.title)
    .replace(/{{CAT_CLASS}}/g,     cat.cls)
    .replace(/{{CAT_LABEL}}/g,     cat.label)
    .replace(/{{DATE}}/g,          date)
    .replace(/{{TYPE}}/g,          type)
    .replace(/{{SUMMARY}}/g,       a.summary || '')
    .replace(/{{JOURNAL_BOX}}/g,   journalBox)
    .replace(/{{BODY}}/g,          bodyHtml)
    .replace(/{{EXTERNAL_LINK}}/g, externalLink);
}

function timelineItem(a) {
  const d = a.date ? new Date(a.date) : null;
  const dateStr = d ? `${d.getFullYear()}年 · ${d.getMonth() + 1}月` : '';
  return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-date">${dateStr}</div>
        <h3>${a.title}</h3>
        <p>${a.description || ''}</p>
      </div>`;
}

// ── 构建 ──
const articles   = readDir('content/articles');
const activities = readDir('content/activities');

// 生成每篇文章的独立页面
const articleTpl = fs.readFileSync('templates/article.template.html', 'utf8');
if (!fs.existsSync('articles')) fs.mkdirSync('articles');
articles.forEach(a => {
  fs.writeFileSync(`articles/${a.slug}.html`, generateArticlePage(a, articleTpl));
});

const articlesHTML = articles.length
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
console.log(`✓ 构建完成：${articles.length} 篇文章（已生成独立页面），${activities.length} 个活动`);
