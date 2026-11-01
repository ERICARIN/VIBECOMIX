# Как участвовать в разработке

Спасибо, что заглянули! Проект на ранней стадии, поэтому любая помощь полезна:
баг-репорты, идеи по UX, тесты на геометрию, документация.

## Статус проекта

В `main` сейчас лежит только каркас: каталог `src/` не закоммичен, поэтому
`npm run build` падает. Прежде чем брать задачу, посмотрите
[ANALYSIS.md](./ANALYSIS.md) — там разобран текущий долг и приоритеты.
Актуальные задачи — в Issues.

## Быстрый старт

```bash
git clone https://github.com/ERICARIN/VIBECOMIX.git
cd VIBECOMIX
npm install
cp .env.example .env.local   # при необходимости ключ Gemini
npm run dev                  # http://localhost:3000
```

Node.js >= 20.

## Перед отправкой PR

```bash
npm run lint          # tsc --noEmit
npm run format        # prettier
npm run build         # сборка
npm test              # после появления тестов
```

Всё это проверяется в CI (`.github/workflows/ci.yml`); красный CI — PR не мержим.

## Оформление

- Ветки: `feat/…`, `fix/…`, `docs/…`, `chore/…` — от `main`.
- Коммиты: короткие, в повелительном наклонении (`add knife tool`, `fix clip path`).
- Один PR = одна логическая задача.
- В описании PR: что изменилось, зачем, как проверить, скриншот/GIF для визуальных правок.
- Не коммитьте `.env.local`, ключи API и чужие изображения без лицензии.

## Архитектура и соглашения

- Модель данных (`Layer`, `Frame`, `Page`, `AppState`) — в `src/types.ts`.
- Вся математика — чистые функции в `src/utils/geometry.ts`, без обращений к DOM:
  их легко тестировать.
- Состояние приложения и undo/redo — в `src/App.tsx` (по возможности выносить
  в отдельные модули `state/`, см. ANALYSIS.md, п. 12–13).
- Интерактивные режимы (`select`, `knife`, `vertex`, `pressure`) — в `Workspace.tsx`.
- UI — Tailwind CSS v4; иконки — `lucide-react`; анимации — `motion`.

## Сообщения об уязвимостях

Не публикуйте их в Issues — напишите напрямую мейнтейнеру через приватный
security advisory на GitHub.
