<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Запуск и деплой вашего приложения из AI Studio

Здесь содержится всё необходимое для локального запуска вашего приложения.

Посмотреть приложение в AI Studio: https://ai.studio/apps/fb3cd2f0-f8f1-4d23-8ff5-0ea2af206918

## Локальный запуск

**Предварительные требования:** Node.js

1. Установите зависимости:
   `npm install`
2. Укажите ваш API-ключ Gemini в переменной `GEMINI_API_KEY` в файле [.env.local](.env.local)
3. Запустите приложение:
   `npm run dev`