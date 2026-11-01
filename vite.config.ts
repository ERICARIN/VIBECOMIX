import path from 'path';
import { defineConfig } from 'vite';

// Хосты, с которых разрешено открывать дев-сервер (превью в облачных IDE,
// Codespaces, удалённые песочницы). Vite >= 6.0.9 отклоняет запросы с
// неизвестных Host — без этого списка удалённое превью не открывается.
const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig(() => {
  return {
    // Приложение — статический сайт: index.html + style.css + js/*.js
    // (классические скрипты, общая глобальная область видимости).
    // Продакшн-сборку делает scripts/build.mjs, Vite здесь — дев-сервер.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT ?? 3000),
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.e2b.app',
        '.github.dev',
        '.gitpod.io',
        ...extraAllowedHosts,
      ],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT ?? 3000),
    },
  };
});
