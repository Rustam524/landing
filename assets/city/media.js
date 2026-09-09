/*
 * Media manifest for the "Night Shymkent journey" block.
 * Everything visual that can be swapped lives here, not in the block code.
 *
 * Coordinates: every scene is drawn on a 1200x800 "plate". Focus/hotspot
 * positions are fractions of that plate, so they stay glued to the picture
 * whatever the frame size is.
 *
 * kind: 'photo'  -> <img>, the camera move is simulated (scale/pan).
 * kind: 'video'  -> <video>, scroll progress drives currentTime (needs a
 *                   keyframe-dense encode, e.g. `-g 1`, muted, no audio).
 * kind: 'dom'    -> the scene is built from HTML/SVG inside the plate.
 *
 * temporary: true marks material that must be replaced for the final version.
 */
export const ROUTE = [
  { id: 'intro', from: 0.00, to: 0.10 },
  { id: 'smm',   from: 0.10, to: 0.34 },
  { id: 'ads',   from: 0.34, to: 0.58 },
  { id: 'team',  from: 0.58, to: 0.80 },
  { id: 'ai',    from: 0.80, to: 1.00 }
];

export const FADE = 0.045;

export const SCENES = {
  intro: {
    kind: 'photo',
    src: 'assets/city/media/shymkent-tauke-khan-avenue.jpg',
    alt: 'Проспект Тауке-хана ночью, Шымкент',
    temporary: true,
    credit: 'Временный кадр · Wikimedia Commons, public domain',
    focus: { x: 0.5, y: 0.55 },
    camera: { from: { s: 1.05, x: 0, y: 0 }, to: { s: 1.22, x: 0.02, y: -0.02 } },
    exit: { s: 1.6 },
    eager: true
  },
  smm: {
    kind: 'photo',
    src: 'assets/city/media/shymkent-street-aerial.jpg',
    alt: 'Ночная улица Шымкента с высоты, следы фар',
    temporary: true,
    credit: 'Временный кадр · Wikimedia Commons, CC0',
    focus: { x: 0.80, y: 0.42 },
    camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.5, x: 0, y: 0 } },
    exit: { s: 1.8 }
  },
  ads: {
    kind: 'photo',
    src: 'assets/city/media/shymkent-mega-center.jpg',
    alt: 'Торгово-деловой центр в Шымкенте ночью',
    temporary: true,
    credit: 'Временный кадр · Wikimedia Commons, public domain',
    focus: { x: 0.36, y: 0.33 },
    camera: { from: { s: 1.42, x: 0, y: 0 }, to: { s: 1.6, x: 0, y: 0 } },
    exit: { s: 2.6 }
  },
  team: {
    kind: 'dom',
    temporary: true,
    credit: 'Временная иллюстрация · заменится на видео студии',
    windowSrc: 'assets/city/media/shymkent-mega-center.jpg',
    focus: { x: 0.5, y: 0.5 },
    focusMobile: { x: 0.3, y: 0.5 },
    camera: { from: { s: 1.12, x: -0.03, y: 0 }, to: { s: 1.0, x: 0.02, y: 0 } },
    exit: { s: 1.25 }
  },
  ai: {
    kind: 'dom',
    temporary: true,
    credit: 'Временная иллюстрация · заменится на видео',
    focus: { x: 0.48, y: 0.5 },
    focusMobile: { x: 0.5, y: 0.5 },
    camera: { from: { s: 1.18, x: 0.05, y: 0 }, to: { s: 1.0, x: 0, y: 0 } },
    exit: { s: 1.0 }
  }
};
