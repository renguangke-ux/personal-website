const fs   = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SITE_URL = 'https://personal-website-6dn.pages.dev';

const CAT_MAP = {
  law:  { label: '法律',      cls: 'cat-law'  },
  ai:   { label: 'AI 与法律', cls: 'cat-ai'   },
  econ: { label: '法经济学',  cls: 'cat-econ' },
  book: { label: '读书笔记',  cls: 'cat-book' },
};

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeXml(str) {
  return escapeHtml(str).replace(/'/g, '&apos;');
}

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
  // 1. Extract footnote definitions (remove from body, store for later)
  const footnotes = {};
  md = md.replace(/^\[\^(\w+)\]:\s*(.+)$/gm, (_, key, text) => {
    footnotes[key] = text.trim();
    return '';
  });

  // 2. Add IDs to headings, collect TOC entries
  const tocEntries = [];
  let secIdx = 0;
  md = md.replace(/^(#{2,3}) (.+)$/gm, (_, hashes, text) => {
    secIdx++;
    const level = hashes.length;
    const id = `sec-${secIdx}`;
    tocEntries.push({ level, id, text });
    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  // 3. Inline formatting
  md = md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<figure class="article-figure"><img src="$2" alt="$1" /><figcaption>$1</figcaption></figure>');

  // 4. Inline footnote references → superscript
  const fnOrder = [];
  md = md.replace(/\[\^(\w+)\]/g, (_, key) => {
    if (!fnOrder.includes(key)) fnOrder.push(key);
    const n = fnOrder.indexOf(key) + 1;
    return `<sup class="fn-ref" id="fnref-${key}"><a href="#fn-${key}">${n}</a></sup>`;
  });

  // 5. Block splitting
  const blocks = md.split(/\n\n+/).map(block => {
    const t = block.trim();
    if (!t) return '';
    if (/^<h[23]/.test(t)) return t;
    if (/^<figure/.test(t)) return t;
    return `<p>${t.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean);

  // 6. Footnotes section at end
  if (fnOrder.length > 0) {
    const fnItems = fnOrder.map((key, i) => {
      const text = escapeHtml(footnotes[key] || '');
      return `<li id="fn-${key}" value="${i + 1}">${text} <a href="#fnref-${key}" class="fn-back">↩</a></li>`;
    }).join('\n');
    blocks.push(`<div class="footnotes"><hr/><ol>${fnItems}</ol></div>`);
  }

  // 7. TOC (show only when ≥ 3 headings)
  let tocHtml = '';
  if (tocEntries.length >= 3) {
    const items = tocEntries.map(e =>
      `<li class="toc-l${e.level}"><a href="#${e.id}">${e.text}</a></li>`
    ).join('\n');
    tocHtml = `<div class="toc"><div class="toc-title">目录</div><ol>${items}</ol></div>`;
  }

  return { bodyHtml: blocks.join('\n'), tocHtml };
}

function generateArticlePage(a, tpl) {
  const cat  = CAT_MAP[a.category] || { label: a.category, cls: 'cat-law' };
  const date = a.date
    ? new Date(a.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
    : '';
  const type = (a.type || '发表论文 →').replace(' →', '');

  const { bodyHtml, tocHtml } = a.body ? mdToHtml(a.body) : { bodyHtml: '', tocHtml: '' };
  const bodySection = bodyHtml ? `<div class="article-body">${bodyHtml}</div>` : '';

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

  const ogTags = `
  <meta name="description" content="${escapeHtml(a.summary || '')}" />
  <meta property="og:title" content="${escapeHtml(a.title)}" />
  <meta property="og:description" content="${escapeHtml(a.summary || '')}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${SITE_URL}/articles/${a.slug}.html" />
  <meta property="og:site_name" content="任广科" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(a.title)}" />
  <meta name="twitter:description" content="${escapeHtml(a.summary || '')}" />`;

  return tpl
    .replace(/{{TITLE}}/g,         a.title)
    .replace(/{{CAT_CLASS}}/g,     cat.cls)
    .replace(/{{CAT_LABEL}}/g,     cat.label)
    .replace(/{{DATE}}/g,          date)
    .replace(/{{TYPE}}/g,          type)
    .replace(/{{SUMMARY}}/g,       a.summary || '')
    .replace(/{{JOURNAL_BOX}}/g,   journalBox)
    .replace(/{{TOC}}/g,           tocHtml)
    .replace(/{{BODY}}/g,          bodySection)
    .replace(/{{EXTERNAL_LINK}}/g, externalLink)
    .replace(/{{OG_TAGS}}/g,       ogTags);
}

function generateRSS(articles) {
  const items = articles.map(a => {
    const pubDate = a.date ? new Date(a.date).toUTCString() : '';
    const link = `${SITE_URL}/articles/${a.slug}.html`;
    return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <description>${escapeXml(a.summary || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>任广科</title>
    <link>${SITE_URL}</link>
    <description>任广科的个人网站 — 法律、法经济学与 AI</description>
    <language>zh-CN</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;
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

const articleTpl = fs.readFileSync('templates/article.template.html', 'utf8');
if (!fs.existsSync('articles')) fs.mkdirSync('articles');
articles.forEach(a => {
  fs.writeFileSync(`articles/${a.slug}.html`, generateArticlePage(a, articleTpl));
});

fs.writeFileSync('feed.xml', generateRSS(articles));

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
console.log(`✓ 构建完成：${articles.length} 篇文章，${activities.length} 个活动，feed.xml 已生成`);
