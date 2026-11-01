#!/usr/bin/env node
/**
 * Статическая сборка VIBECOMIX.
 *
 * Приложение — чистый статический сайт без npm-зависимостей в рантайме:
 * index.html + style.css + js/*.js (классические скрипты, общая глобальная
 * область видимости). Поэтому сборка — это копирование в dist/ с опциональной
 * минификацией через esbuild (он уже есть в devDependencies).
 *
 * Использование:
 *   node scripts/build.mjs               # минификация (по умолчанию)
 *   node scripts/build.mjs --no-minify   # копирование как есть (удобно для отладки)
 */
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const minify = !process.argv.includes('--no-minify');

const log = (...a) => console.log('[build]', ...a);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// 1. index.html и CSS — как есть (порядок <script> в разметке должен сохраниться).
await cp(join(root, 'index.html'), join(out, 'index.html'));
await cp(join(root, 'style.css'), join(out, 'style.css'));

// 2. JS — копируем (или минифицируем) в том порядке, в котором они подключены.
const html = await (
  await import('node:fs/promises')
).readFile(join(root, 'index.html'), 'utf8');
const order = [...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(
  (m) => m[1],
);
if (order.length === 0)
  throw new Error('В index.html не найдены теги <script src="js/...">');

await mkdir(join(out, 'js'), { recursive: true });
for (const name of order) {
  const from = join(root, 'js', name);
  const to = join(out, 'js', name);
  if (!minify) {
    await cp(from, to);
    continue;
  }
  const result = await esbuild.transform(
    await (await import('node:fs/promises')).readFile(from, 'utf8'),
    {
      loader: 'js',
      minify: true,
      target: 'es2020',
    },
  );
  await writeFile(to, result.code);
}

const files = await readdir(join(out, 'js'));
log(
  `dist/ готов: index.html, style.css, js/ (${files.length} файлов, минификация: ${minify ? 'да' : 'нет'})`,
);
