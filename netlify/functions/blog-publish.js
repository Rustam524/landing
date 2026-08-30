/**
 * СКЕЛЕТ будущего защищённого API приёма одобренных статей блога.
 *
 * Планируемый конвейер (ТЗ, раздел 17):
 *   RSS/Inoreader → Make.com → черновик → Google Sheets → подтверждение
 *   человеком → публикация на сайте через этот API/CMS.
 *
 * Статьи сейчас НЕ пишутся и НЕ публикуются автоматически — эта функция
 * является заготовкой контракта API, а не рабочей интеграцией:
 *   - реальное хранилище публикаций (Google Sheets / headless CMS / БД)
 *     ещё не выбрано и не подключено;
 *   - секретный токен авторизации (BLOG_PUBLISH_TOKEN) должен быть задан
 *     только в переменных окружения Netlify, никогда во frontend-коде;
 *   - перед подключением к реальному сайту требуется отдельное решение
 *     владельца по инструменту хранения материалов.
 *
 * Ожидаемая схема материала (валидируется ниже):
 *   title, url, category, cover, excerpt, body, author, date,
 *   seoTitle, seoDescription, videoEmbedUrl (опционально), status: "draft"|"published"
 */
var REQUIRED_FIELDS = ["title", "url", "category", "excerpt", "body", "author", "date", "status"];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  var token = process.env.BLOG_PUBLISH_TOKEN;
  var authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";

  if (!token) {
    return {
      statusCode: 501,
      body: JSON.stringify({
        ok: false,
        error: "not_configured",
        message: "BLOG_PUBLISH_TOKEN и хранилище публикаций ещё не настроены владельцем.",
      }),
    };
  }

  if (authHeader !== "Bearer " + token) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: "unauthorized" }) };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: "invalid_json" }) };
  }

  var missing = REQUIRED_FIELDS.filter(function (f) {
    return !payload[f];
  });
  if (missing.length) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "missing_fields", fields: missing }),
    };
  }

  // TODO(owner/dev): здесь должна происходить запись в выбранное хранилище
  // публикаций (например, Google Sheets/Airtable/headless CMS) и, при
  // status === "published", отдача материала на сайт без правки кода.
  return {
    statusCode: 501,
    body: JSON.stringify({
      ok: false,
      error: "storage_not_implemented",
      message: "Приём данных прошёл валидацию, но хранилище публикаций ещё не подключено.",
    }),
  };
};
