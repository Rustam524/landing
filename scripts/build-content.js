#!/usr/bin/env node
/**
 * Сборка контента перед деплоем (запускается Netlify при каждом пуше/
 * сохранении в Decap CMS — см. netlify.toml, команда сборки).
 *
 * Ничего не публикует "мимо" Git — просто раскладывает то, что уже лежит
 * в /content (отредактировано через /admin или руками), в формат, который
 * умеет читать статический сайт без собственного сервера:
 *
 *  1. /content/services/*.json, /content/cases/*.json,
 *     /content/testimonials/*.json  →  /content/generated/{services,cases,testimonials}.json
 *     (просто собранные в один массив, отсортированные по полю order/date)
 *
 *  2. /content/blog/*.md (публикации со status: published) →
 *     - отдельная HTML-страница на каждую статью: /blog/<slug>/index.html
 *       (свои Title, Description, H1, канонический URL, OG-изображение)
 *     - список публикаций: /blog/index.html
 *     - /content/generated/latest-posts.json — три последние для главной
 *
 * Черновики (status: draft) и есть в репозитории, но не попадают на сайт —
 * ничего не публикуется без установки статуса "Опубликовано" в CMS.
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const GENERATED_DIR = path.join(CONTENT_DIR, "generated");

function readJsonFolder(folder) {
  const dir = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}

function writeGenerated(name, data) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(path.join(GENERATED_DIR, name), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function buildDataCollections() {
  const services = readJsonFolder("services")
    .filter((s) => s.kind !== "learning")
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const learningTracks = readJsonFolder("services")
    .filter((s) => s.kind === "learning")
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const cases = readJsonFolder("cases").sort((a, b) => (a.order || 0) - (b.order || 0));
  const testimonials = readJsonFolder("testimonials");

  writeGenerated("services.json", services);
  writeGenerated("learning.json", learningTracks);
  writeGenerated("cases.json", cases);
  writeGenerated("testimonials.json", testimonials);

  console.log(
    `[build-content] services=${services.length} learning=${learningTracks.length} cases=${cases.length} testimonials=${testimonials.length}`
  );
}

const CATEGORY_LABELS = {
  smm: "SMM",
  target: "Таргетированная реклама",
  content: "Контент",
  ai: "ИИ и нейросети",
  automation: "Автоматизация",
  education: "Обучение",
  news: "Новости ALGORITM",
};

function readBlogPosts() {
  const dir = path.join(CONTENT_DIR, "blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      const slug = data.slug || f.replace(/\.md$/, "");
      return Object.assign({}, data, { slug: slug, body: content, sourceFile: f });
    });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function formatDateRu(dateVal) {
  try {
    var d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
  } catch (e) {
    return "";
  }
}

function videoEmbedHtml(url) {
  if (!url) return "";
  var yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) {
    return (
      '<div class="blog-post__video"><iframe src="https://www.youtube.com/embed/' +
      yt[1] +
      '" title="Видео" loading="lazy" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;border-radius:14px;"></iframe></div>'
    );
  }
  // Instagram/TikTok и прочее — просто ссылка-приглашение (без стороннего JS-embed ради веса страницы).
  return '<p class="blog-post__video-link"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Смотреть видео →</a></p>';
}

function postPageHtml(post) {
  var categoryLabel = CATEGORY_LABELS[post.category] || post.category || "";
  var title = escapeHtml(post.seoTitle || post.title);
  var description = escapeHtml(post.seoDescription || post.excerpt || "");
  var url = "https://algoritm.top/blog/" + post.slug + "/";
  var cover = post.cover || "";
  var bodyHtml = marked.parse(post.body || "");
  var dateHuman = formatDateRu(post.date);
  var dateIso = post.date ? new Date(post.date).toISOString() : "";

  return (
    "<!doctype html>\n" +
    '<html lang="ru">\n<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    "  <title>" +
    title +
    "</title>\n" +
    '  <meta name="description" content="' +
    description +
    '" />\n' +
    '  <link rel="canonical" href="' +
    url +
    '" />\n' +
    '  <meta property="og:type" content="article" />\n' +
    '  <meta property="og:title" content="' +
    title +
    '" />\n' +
    '  <meta property="og:description" content="' +
    description +
    '" />\n' +
    '  <meta property="og:url" content="' +
    url +
    '" />\n' +
    (cover ? '  <meta property="og:image" content="https://algoritm.top' + escapeHtml(cover) + '" />\n' : "") +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png" />\n' +
    '  <link rel="stylesheet" href="/assets/css/styles.css" />\n' +
    "  <script type=\"application/ld+json\">\n" +
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      datePublished: dateIso,
      author: { "@type": "Organization", name: post.author || "ALGORITM" },
      publisher: { "@type": "Organization", name: "ALGORITM" },
      description: post.excerpt || "",
      url: url,
    }) +
    "\n  </script>\n" +
    "</head>\n<body>\n" +
    '  <a class="skip-link" href="#main-content">Перейти к содержимому</a>\n' +
    '  <div id="site-header-root"></div>\n' +
    '  <main id="main-content">\n' +
    '    <article class="section blog-post">\n' +
    '      <div class="container" style="max-width: 760px;">\n' +
    '        <p style="font-size:13px; color:#7a7266; margin-bottom:18px;"><a href="/" style="color:#7a7266;">Главная</a> / <a href="/blog/" style="color:#7a7266;">Блог</a> / ' +
    escapeHtml(categoryLabel) +
    "</p>\n" +
    '        <span class="eyebrow">' +
    escapeHtml(categoryLabel) +
    "</span>\n" +
    "        <h1 style=\"font-size:clamp(28px,4vw,42px); margin-bottom:14px;\">" +
    escapeHtml(post.title) +
    "</h1>\n" +
    '        <p style="color:#7a7266; font-size:14px; margin-bottom:28px;">' +
    escapeHtml(dateHuman) +
    (post.author ? " · " + escapeHtml(post.author) : "") +
    "</p>\n" +
    (cover
      ? '        <img src="' + escapeHtml(cover) + '" alt="' + escapeHtml(post.title) + '" style="width:100%; border-radius:16px; margin-bottom:28px;" loading="lazy" />\n'
      : "") +
    '        <div class="blog-post__body" style="font-size:17px; line-height:1.7; color:#1b1712;">\n' +
    bodyHtml +
    "\n        </div>\n" +
    videoEmbedHtml(post.video) +
    '        <div style="margin-top:40px;"><a class="btn btn-outline" href="/blog/">← Все статьи блога</a></div>\n' +
    "      </div>\n" +
    "    </article>\n" +
    "  </main>\n" +
    '  <div id="site-footer-root"></div>\n' +
    '  <script src="/assets/js/config.js"></script>\n' +
    '  <script src="/assets/js/data.js"></script>\n' +
    '  <script src="/assets/js/content-loader.js"></script>\n' +
    '  <script src="/assets/js/common.js"></script>\n' +
    '  <script src="/assets/js/analytics.js"></script>\n' +
    '  <script src="/assets/js/partials.js"></script>\n' +
    '  <script src="/assets/js/header.js"></script>\n' +
    "</body>\n</html>\n"
  );
}

function blogIndexHtml(posts) {
  var cards = posts
    .map(function (p) {
      var categoryLabel = CATEGORY_LABELS[p.category] || p.category || "";
      return (
        '<article class="case-card">' +
        '<div class="case-card__media"><img src="' +
        escapeHtml(p.cover || "") +
        '" alt="' +
        escapeHtml(p.title) +
        '" loading="lazy" /></div>' +
        '<div class="case-card__body">' +
        '<span class="case-tag">' +
        escapeHtml(categoryLabel) +
        "</span><h3>" +
        escapeHtml(p.title) +
        "</h3>" +
        '<p class="case-card__task">' +
        escapeHtml(p.excerpt || "") +
        "</p>" +
        '<p style="font-size:13px; color:#7a7266;">' +
        escapeHtml(formatDateRu(p.date)) +
        "</p>" +
        '<a class="case-card__link" href="/blog/' +
        escapeHtml(p.slug) +
        '/">Читать →</a>' +
        "</div></article>"
      );
    })
    .join("\n");

  var categoriesRow = Object.keys(CATEGORY_LABELS)
    .map(function (id) {
      return (
        '<li style="background:#ece4d8; padding:8px 16px; border-radius:999px; font-size:13.5px; font-weight:700; color:#1b1712;">' +
        escapeHtml(CATEGORY_LABELS[id]) +
        "</li>"
      );
    })
    .join("\n");

  return (
    "<!doctype html>\n" +
    '<html lang="ru">\n<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    "  <title>Блог | ALGORITM</title>\n" +
    '  <meta name="description" content="Блог ALGORITM — материалы о SMM, таргетированной рекламе, контенте, ИИ и автоматизации." />\n' +
    '  <link rel="canonical" href="https://algoritm.top/blog/" />\n' +
    '  <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png" />\n' +
    '  <link rel="stylesheet" href="/assets/css/styles.css" />\n' +
    "</head>\n<body>\n" +
    '  <a class="skip-link" href="#main-content">Перейти к содержимому</a>\n' +
    '  <div id="site-header-root"></div>\n' +
    '  <main id="main-content">\n' +
    '    <section class="section" style="padding-top:56px;">\n' +
    '      <div class="container">\n' +
    "        <h1 style=\"font-size:clamp(28px,4vw,40px); margin-bottom:18px;\">Блог ALGORITM</h1>\n" +
    '        <ul style="display:flex; flex-wrap:wrap; gap:10px; padding:0; margin:0 0 32px; list-style:none;">\n' +
    categoriesRow +
    "\n        </ul>\n" +
    (posts.length
      ? '        <div class="case-grid">' + cards + "</div>\n"
      : '        <p style="font-size:17px; color:#4a4238;">Материалы готовятся.</p>\n') +
    "      </div>\n" +
    "    </section>\n" +
    "  </main>\n" +
    '  <div id="site-footer-root"></div>\n' +
    '  <script src="/assets/js/config.js"></script>\n' +
    '  <script src="/assets/js/data.js"></script>\n' +
    '  <script src="/assets/js/content-loader.js"></script>\n' +
    '  <script src="/assets/js/common.js"></script>\n' +
    '  <script src="/assets/js/analytics.js"></script>\n' +
    '  <script src="/assets/js/partials.js"></script>\n' +
    '  <script src="/assets/js/header.js"></script>\n' +
    "</body>\n</html>\n"
  );
}

function buildBlog() {
  var all = readBlogPosts();
  var published = all
    .filter(function (p) {
      return p.status === "published";
    })
    .sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

  // Страница на каждую опубликованную статью.
  published.forEach(function (post) {
    var dir = path.join(ROOT, "blog", post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), postPageHtml(post), "utf8");
  });

  // Список публикаций /blog/ — только если есть хотя бы одна опубликованная
  // статья, иначе оставляем существующую заглушку "Материалы готовятся"
  // нетронутой (не перезаписываем вручную сделанный noindex-стаб).
  if (published.length > 0) {
    fs.writeFileSync(path.join(ROOT, "blog", "index.html"), blogIndexHtml(published), "utf8");
  }

  writeGenerated(
    "latest-posts.json",
    published.slice(0, 3).map(function (p) {
      return {
        id: p.slug,
        title: p.title,
        excerpt: p.excerpt || "",
        cover: p.cover || "",
        date: p.date,
        categoryLabel: CATEGORY_LABELS[p.category] || p.category || "",
        href: "/blog/" + p.slug + "/",
      };
    })
  );

  console.log(
    "[build-content] blog posts total=" + all.length + " published=" + published.length + " (черновики на сайт не попадают)"
  );
}

buildDataCollections();
buildBlog();
