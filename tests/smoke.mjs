#!/usr/bin/env node
/**
 * Дымовой тест редактора в jsdom.
 *
 * Проверяет главный сценарий целиком: создание проекта → рендер фреймов →
 * разрез фрейма → undo/redo → удаление → превью → экспорт HTML. Ловит
 * поломки, которые не видно по коду: перепутанный порядок скриптов, опечатки
 * в id, исключения при инициализации, падение экспорта.
 *
 * Запуск: npm test
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawHtml = readFileSync(join(root, 'index.html'), 'utf8');

// Порядок подключения скриптов берём из index.html, чтобы тест не расходился с разметкой.
const scripts = [
  ...rawHtml.matchAll(/<script src="js\/([^"]+)"><\/script>/g),
].map((m) => m[1]);
if (scripts.length === 0)
  throw new Error('В index.html не найдены теги <script src="js/...">');

// Шрифты в тесте не нужны, а скрипты подключаем сами — в том же порядке.
const html = rawHtml
  .replace(/<script src="js\/[^"]+"><\/script>/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = dom;

// ── Заглушки того, чего в jsdom нет ──────────────────────────────────────────
const ctx2d = new Proxy(
  {},
  { get: (_t, prop) => (prop === 'canvas' ? {} : () => {}) },
);
window.HTMLCanvasElement.prototype.getContext = () => ctx2d; // миниатюры страниц
window.URL.createObjectURL = () => 'blob:stub'; // экспорт HTML
window.HTMLAnchorElement.prototype.click = function () {}; // скачивание файла
let lastAlert = null;
window.alert = (msg) => (lastAlert = msg);

// ── Загрузка приложения ──────────────────────────────────────────────────────
// Подключаем скрипты так же, как это делает браузер: классическими <script>.
// (Через eval объявления const/let жили бы только внутри одного eval-вызова.)
for (const name of scripts) {
  const el = window.document.createElement('script');
  el.textContent = readFileSync(join(root, 'js', name), 'utf8');
  window.document.body.appendChild(el);
}

// Глобали объявлены через const/let на верхнем уровне классических скриптов,
// поэтому это глобальные лексические binding'и, а не свойства window —
// читаем их через eval в глобальной области видимости.
const app = new Proxy({}, { get: (_t, name) => window.eval(String(name)) });
const $ = (id) => window.document.getElementById(id);

const checks = [];
const check = (name, fn) => {
  try {
    checks.push({ name, ok: true, value: fn() });
  } catch (err) {
    checks.push({ name, ok: false, value: err.message });
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

// ── Сценарий ─────────────────────────────────────────────────────────────────
check('скрипты объявляют состояние S и фабрики mkFrame/mkLayer', () => {
  assert(typeof app.S === 'object', 'S не определён');
  assert(typeof app.mkFrame === 'function', 'mkFrame не определён');
  assert(typeof app.mkLayer === 'function', 'mkLayer не определён');
  return `S: ${Object.keys(app.S).length} полей`;
});

check('кнопка «Создать» разворачивает редактор и создаёт страницу', () => {
  $('btn-create').click();
  assert(
    app.S.pages.length === 1,
    `ожидалась 1 страница, получено ${app.S.pages.length}`,
  );
  assert(app.S.pages[0].frames.length === 1, 'ожидался 1 фрейм');
  assert($('editor').classList.contains('visible'), 'редактор не стал видимым');
  return `страниц: ${app.S.pages.length}, фреймов: ${app.S.pages[0].frames.length}`;
});

check('фрейм отрисован в контейнере', () => {
  const n = $('frame-container').children.length;
  assert(n >= 1, 'контейнер фреймов пуст');
  return `элементов: ${n}`;
});

check('сайдбар показывает миниатюры страниц', () => {
  const n = $('page-list').children.length;
  assert(
    n === app.S.pages.length,
    `миниатюр: ${n}, страниц: ${app.S.pages.length}`,
  );
  return `миниатюр: ${n}`;
});

check('splitFrame разрезает фрейм надвое', () => {
  app.splitFrame(app.S.pages[0].frames[0], 'v');
  const n = app.S.pages[0].frames.length;
  assert(n === 2, `ожидалось 2 фрейма после разреза, получено ${n}`);
  return `фреймов: ${n}`;
});

check('undo/redo отменяют и возвращают разрез', () => {
  const before = app.S.pages[0].frames.length;
  app.splitFrame(app.S.pages[0].frames[0], 'h'); // внутри сам делает snapshot()
  const after = app.S.pages[0].frames.length;
  app.undo();
  const undone = app.S.pages[0].frames.length;
  app.redo();
  const redone = app.S.pages[0].frames.length;
  assert(after === before + 1, `разрез: ${before} → ${after}`);
  assert(undone === before, `undo вернул ${undone}, ожидалось ${before}`);
  assert(redone === after, `redo вернул ${redone}, ожидалось ${after}`);
  return `${before} → ${after} → undo ${undone} → redo ${redone}`;
});

check('deleteFrame удаляет фрейм', () => {
  const before = app.S.pages[0].frames.length;
  app.deleteFrame(app.S.pages[0].frames[0]);
  const after = app.S.pages[0].frames.length;
  assert(after === before - 1, `было ${before}, стало ${after}`);
  return `${before} → ${after}`;
});

check('последний фрейм удалить нельзя', () => {
  while (app.S.pages[0].frames.length > 1)
    app.deleteFrame(app.S.pages[0].frames[0]);
  lastAlert = null;
  app.deleteFrame(app.S.pages[0].frames[0]);
  assert(app.S.pages[0].frames.length === 1, 'фрейм всё равно удалился');
  assert(lastAlert, 'пользователю не показано предупреждение');
  return 'предупреждение показано';
});

check('превью рендерит страницы', () => {
  $('btn-preview-toggle').click();
  const n = $('preview-pages').children.length;
  assert(
    n === app.S.pages.length,
    `страниц в превью: ${n}, в проекте: ${app.S.pages.length}`,
  );
  return `страниц в превью: ${n}`;
});

check('экспорт HTML не падает', () => {
  app.exportHTML();
  return 'ok';
});

// ── Итог ─────────────────────────────────────────────────────────────────────
let failed = 0;
for (const c of checks) {
  if (!c.ok) failed++;
  console.log(
    `${c.ok ? '  ✓' : '  ✗'} ${c.name}${c.ok ? ` — ${c.value}` : `\n      ${c.value}`}`,
  );
}
console.log(`\n${checks.length - failed}/${checks.length} проверок пройдено`);
if (failed > 0) process.exit(1);
