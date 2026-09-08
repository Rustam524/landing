/**
 * Серверная функция приёма формы "Бесплатный аудит".
 *
 * Схема (ТЗ, раздел 18):
 *   Форма → эта функция → вебхук Make.com → Telegram + Google Sheets
 *
 * Секреты хранятся ТОЛЬКО в переменных окружения Netlify:
 *   - MAKE_AUDIT_WEBHOOK_URL — приватный URL сценария Make.com (не публиковать
 *     в коде и не коммитить в репозиторий).
 *
 * Пока переменная не задана владельцем, функция намеренно НЕ выполняет
 * реальную отправку и возвращает понятную ошибку конфигурации — frontend
 * в этом случае показывает пользователю аккуратное сообщение с запасной
 * ссылкой на WhatsApp (см. assets/js/modal.js).
 */
exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  var webhookUrl = process.env.MAKE_AUDIT_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      statusCode: 501,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "not_configured",
        message: "MAKE_AUDIT_WEBHOOK_URL не задан в переменных окружения Netlify.",
      }),
    };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: "invalid_json" }) };
  }

  if (!payload.name || !payload.phone) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: "missing_fields" }) };
  }

  try {
    var res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        name: payload.name,
        phone: payload.phone,
        link: payload.link || "",
        page: payload.page || "",
        source: payload.source || "",
        utm: payload.utm || {},
        status: "new",
      }),
    });

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: "webhook_failed" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: "webhook_unreachable" }) };
  }
};
