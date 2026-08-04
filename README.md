# 任广科个人网站

个人学术网站，展示法律研究文章与社会活动记录。基于 Node.js 静态站点生成器构建，自动部署至 Netlify 和 Cloudflare Pages。

**在线地址：** https://renguangke.com

---

## 技术栈

- **构建工具**：Node.js + [gray-matter](https://github.com/jonschlinkert/gray-matter)（解析 Markdown 前置信息）
- **内容格式**：Markdown（`.md`）文件，带 YAML frontmatter
- **输出**：纯静态 HTML，无框架依赖
- **部署**：推送到 GitHub 后，Netlify 和 Cloudflare Pages 自动构建

---

## 目录结构

```
personal-website/
├── content/
│   ├── articles/          # 文章内容（每篇一个 .md 文件）
│   └── activities/        # 社会活动记录（每条一个 .md 文件）
├── templates/
│   ├── index.template.html     # 首页模板
│   ├── article.template.html   # 文章详情页模板
│   └── activities.template.html # 活动页模板
├── images/                # 图片资源
├── articles/              # 构建输出：文章 HTML（自动生成，勿手动编辑）
├── build.js               # 构建脚本
├── style.css              # 全局样式
├── index.html             # 构建输出（自动生成）
├── activities.html        # 构建输出（自动生成）
├── about.html             # 关于页（手动维护）
└── feed.xml               # RSS 订阅（自动生成）
```

---

## 本地开发

```bash
npm install
npm run build
# 用浏览器打开 index.html 预览
```

---

## 发布新文章

在 `content/articles/` 新建 Markdown 文件，文件名格式为 `YYYY-MM-DD-slug.md`：

```yaml
---
title: 文章标题
date: 2025-01-01
category: law          # law | ai | econ | book | case
type: 发表论文         # 显示在文章卡片右下角
summary: 一句话摘要，显示在文章列表卡片中。
journal: 《山东审判》2025年第1期   # 可选，已发表期刊
link: "#"             # 可选，外部链接（# 表示无）
---

正文内容（支持 Markdown）……
```

---

## 添加社会活动

在 `content/activities/` 新建 Markdown 文件，文件名格式为 `YYYY-MM-DD-slug.md`：

```yaml
---
title: 活动名称
date: 2025-01-01
location: 烟台市图书馆
photos: images/activity-xxx.jpg    # 可选，多张用逗号分隔
description: 一句话简介，显示在时间轴上。
---

详细内容（可选）……
```

---

## 构建与部署

```bash
npm run build   # 构建所有 HTML 和 feed.xml
git add .
git commit -m "发布新文章：xxx"
git push        # 推送后 Netlify 和 Cloudflare Pages 自动部署
```

> **注意**：`index.html`、`activities.html`、`articles/` 目录及 `feed.xml` 均由 `build.js` 自动生成，请勿直接手动修改，否则下次构建时会被覆盖。
