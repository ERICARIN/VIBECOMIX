# Как участвовать в разработке

VIBECOMIX — статическое приложение на чистом JS: `index.html` + `style.css` +
`js/*.js`. Никаких сборщиков в рантайме, никаких API-ключей.

## Быстрый старт

```bash
git clone https://github.com/ERICARIN/VIBECOMIX.git
cd VIBECOMIX
npm install          # только dev-инструменты (Vite, esbuild, jsdom, prettier)
npm run dev          # http://localhost:3000
```

Без Node.js тоже работает — любой статический сервер:

```bash
python3 -m http.server 8080
```

Открывать `index.html` через `file://` нельзя: классические `<script>` и часть
API браузер в этом режиме блокирует.

## Перед отправкой PR

```bash
npm test             # дымовой тест в jsdom
npm run lint         # tsc --noEmit
npm run format       # prettier
npm run build        # сборка dist/
```

Всё это проверяется в CI (`.github/workflows/ci.yml`); красный CI — PR не мержим.

## Правила правки кода

1. **Порядок подключения скриптов в `index.html` менять нельзя.** Все модули
   делят глобальную область видимости, поэтому `state.js` обязан идти первым, а
   `preview.js` — последним.
2. **Глобальные переменные и функции** (`S`, `mkFrame`, `activeLayers`,
   `selectedLayerId`, `canvasScale`, `panX`, `panY` …) объявлены в `state.js`.
   Не объявляйте их повторно в других файлах — именно так раньше появились
   мёртвые дубликаты `splitFrame`/`deleteFrame`.
3. **`renderPage()`** (в `js/dividers.js`) — главная перерисовка. Вызывайте её
   после изменения данных.
4. **`snapshot()`** (в `js/state.js`) — положить состояние в историю undo.
   Вызывайте после изменения, которое пользователь должен уметь отменить.
5. **`tests/smoke.mjs`** — если добавили кнопку или сценарий, добавьте проверку.

## Где что менять

| Задача                              | Файл                                  |
| ----------------------------------- | ------------------------------------- |
| Цвета, размеры UI                   | `style.css`                           |
| Поля диалога создания               | `index.html` + `js/dialog.js`         |
| Зум, пан, resize холста             | `js/viewport.js`                      |
| Миниатюры страниц                   | `js/sidebar.js` → `drawThumb()`       |
| Логика перегородок и `renderPage()` | `js/dividers.js`                      |
| Добавление/удаление/разрез фреймов  | `js/frames.js`                        |
| Трансформация картинок              | `js/layers.js` → `setupImgDrag()`     |
| Панель слоёв                        | `js/layers.js` → `buildLayersPanel()` |
| Параллакс в превью                  | `js/preview.js`                       |
| Экспорт HTML                        | `js/preview.js` → `exportHTML()`      |
| Undo/Redo, горячие клавиши          | `js/state.js`                         |

## Оформление

- Ветки: `feat/…`, `fix/…`, `docs/…`, `chore/…` — от `main`.
- Коммиты короткие, в повелительном наклонении (`add page autosave`, `fix divider drag`).
- Один PR = одна задача; в описании — что, зачем и как проверить.
- Для визуальных правок приложите скриншот или GIF.

## Сообщения об уязвимостях

Не публикуйте их в Issues — используйте приватный security advisory на GitHub.
