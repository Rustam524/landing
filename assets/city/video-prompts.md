# Промпты для видео блока «Путешествие по ночному Шымкенту»

Четыре ролика заменяют временные материалы (фото с Wikimedia и нарисованные сцены).
Куда положить готовые файлы и как подключить — в конце.

## Общие требования ко всем роликам

- Формат: MP4 (H.264), 1600×1067 или 1920×1280 (пропорция 3:2), 24–30 fps, без звука.
- Длительность 6–8 секунд, движение камеры ровное и медленное, без резких рывков.
- Ночь, реальный Шымкент (в промпте — реальные ориентиры, не «абстрактный азиатский город»).
- Цвет: тёплые натриевые фонари, глубокие тени, чистый чёрный; красные акценты #b91c1c допустимы только там, где указано.
- Без текста, логотипов и людей крупным планом в кадре, если не сказано иначе — надписи и билборд накладываются HTML-слоями.
- Референс-кадры: `assets/city/media/*.jpg` (можно загрузить как image-to-video стартовый кадр).

Для scroll-скраббинга перекодировать с частыми ключевыми кадрами:

```
ffmpeg -i in.mp4 -an -c:v libx264 -pix_fmt yuv420p -g 1 -crf 22 -vf "scale=1600:-2" out.mp4
```

## Сцена 1 — SMM и создание контента (пролёт над улицей к билборду)

> Cinematic slow drone flyover at night over a lively street in Shymkent, Kazakhstan.
> Camera glides forward and slightly down toward a flat rooftop on the right, where a large dark, switched-off billboard stands on two poles (the billboard screen itself must be plain matte black, no image). Warm sodium streetlights, headlight trails on the road, low residential buildings, bare poplar trees. Realistic photographic look, shallow film grain, no text, no people in focus. Smooth constant motion, 7 seconds, 3:2.

Билборд в кадре нужен чёрным — ролик агентства и подсветка накладываются поверх (см. `data-hot="billboard"`). После генерации замерь положение билборда в кадре и обнови проценты `left/top/width/height` у слоя `.cj-layer` в сцене `smm`.

## Сцена 2 — Таргетированная реклама (подлёт к бизнес-центру)

> Night exterior of a modern glass-and-stone business centre in Shymkent, Kazakhstan, with illuminated floors and a curved roofline outlined by small white lights. Camera slowly pushes in from across the plaza toward the lit upper floors, slight upward tilt. Clear dark sky above the roof with plenty of empty space for a light-lettering overlay. A few blurred pedestrians far away. Photorealistic, warm interior light against cool night, no signage text readable, no logos. 7 seconds, 3:2.

Небо над крышей должно быть чистым: туда ставится световая надпись. Контур крыши для импульса задаётся в `<path class="cj-contour-path">` — переснять по новому кадру.

## Сцена 3 — Команда ALGORITM (студия)

> Interior of a small professional video studio at night, warm and cinematic. Left: a deep red seamless paper backdrop lit by a softbox on a stand; a real person (young Kazakh man, 25–35, casual dark clothes) stands calmly facing a cinema camera on a tripod, natural relaxed posture, no talking to viewer. Right, further back: an editor at a desk, seen from behind, in front of a monitor whose screen is plain black (screen must be blank — UI is overlaid later). Large window behind shows the night city of Shymkent out of focus. Slow lateral camera move from the studio toward the editing desk. Photorealistic, shallow depth of field, no text, no logos. 8 seconds, 3:2.

Экраны камеры и монитора — чёрные: таймлайн и REC накладываются слоями `.cj-monitor--edit` и `.cj-rec`.

## Сцена 4 — ИИ-боты и автоматизация (рабочее место и робот)

> Same studio, a quiet workstation at night. A marketing specialist (woman, 25–35, Kazakh, dark casual clothes) sits at a desk in front of a large monitor with a completely blank black screen. Beside the desk stands a sleek, realistic humanoid service robot, matte dark grey body, soft white light strip for eyes, calm and still, subtle head turn toward the monitor. Warm desk lamp, cool monitor glow on faces. Slow push-in toward the monitor. Photorealistic, restrained, no cartoon look, no text, no logos. 8 seconds, 3:2.

Экран монитора — чёрный: диалог с клиентом, CRM-карточка и уведомление накладываются слоем `.cj-chat`. Визор робота можно оставить светящимся; «оживление» при наведении добавляется CSS.

## Как подключить

1. Файлы положить в `assets/city/media/`, например `scene-smm.mp4`.
2. В `assets/city/media.js` для нужной сцены поменять `kind: 'photo'` на `kind: 'video'`, указать `src` и `poster` (первый кадр JPG).
3. Для сцен `team` и `ai` заменить `kind: 'dom'` на `kind: 'video'` — HTML-слои (монитор, REC, чат, робот) остаются поверх, их позиции подстроить в процентах под новый кадр.
4. Снять флаг `temporary: true` и убрать подпись «Временный кадр» в `index.html` / `city.html` (блок `.cj-cap`).
5. Проверить в `city.html`: скролл, наведение, мобильный тап, клавиатуру (Tab по горячим точкам).

Хостинг должен отдавать видео с поддержкой Range-запросов (любой обычный статический хостинг это умеет; встроенный `python -m http.server` — нет, там перемотка по скроллу не сработает).
