/**
 * ЕДИНАЯ ТОЧКА КОНФИГУРАЦИИ САЙТА ALGORITM
 * -----------------------------------------------------------------------
 * Здесь и только здесь хранятся контакты, номер WhatsApp, соцсети и
 * идентификаторы аналитики. Ничего из перечисленного не должно
 * дублироваться в HTML — только читаться отсюда через window.ALGORITM_CONFIG.
 *
 * ЗНАЧЕНИЯ-ЗАГЛУШКИ (отмечены "// TODO(owner)") придуманы НЕ были —
 * реальные данные должен предоставить владелец агентства. Список
 * недостающих данных приведён в итоговом отчёте по задаче.
 */
window.ALGORITM_CONFIG = {
  brand: {
    name: "ALGORITM",
    tagline: "Продвижение. Автоматизация. Обучение.",
  },

  whatsapp: {
    number: "77058903755",
    defaultMessage:
      "Здравствуйте! Хочу получить консультацию по услугам ALGORITM.",
  },

  contacts: {
    city: "Шымкент",
    address: "г. Шымкент, ул. Карасу 2/1 — услуги оказываем по всему Казахстану удалённо",
    phone: "+7 705 890 37 55",
    email: "sayora@algoritm.top",
    legalName: "ИП «ALGORITM KZ»",
  },

  social: {
    instagram: "https://www.instagram.com/algoritm_co",
  },

  // Идентификаторы аналитики — заполняются владельцем через переменные окружения
  // на этапе сборки/деплоя. Пока используются понятные заглушки, которые НЕ
  // инициализируют реальные счётчики.
  analytics: {
    ga4MeasurementId: "G-XXXXXXXXXX", // TODO(owner): реальный ID GA4
    gtmContainerId: "GTM-XXXXXXX", // TODO(owner): реальный ID GTM
    // Пока ID не заменены на настоящие, скрипты аналитики не подключаются —
    // см. assets/js/analytics.js (проверка isPlaceholderId).
  },

  // Официальный embed-код Nextbot должен вставить владелец/разработчик после
  // получения кода в личном кабинете Nextbot. См. assets/js/nextbot.js.
  nextbot: {
    enabled: false, // включить true после вставки официального кода
    webhookNote:
      "Nextbot → webhook → Make.com → Telegram/Google Sheets/amoCRM (настраивается в кабинете Nextbot)",
  },

  // Серверная функция для приёма формы аудита (см. netlify/functions/audit-submit.js).
  // URL Make.com вебхука и токены хранятся ТОЛЬКО на сервере (переменные окружения Netlify),
  // а не во фронтенд-коде.
  forms: {
    auditEndpoint: "/.netlify/functions/audit-submit",
  },
};
