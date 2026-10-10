# Vyaz (`@vyaz/core`)

Переиспользуемое ядро приложения: runtime, SSR и browser-сборка, роутинг, auth/API
glue-код, базовый layout-слой и служебные утилиты.

Пакет не содержит бизнес-логики конкретного проекта. Всё проектно-специфичное
(страницы, модели, permissions, контент) живёт в приложении-воркспейсе и
передаётся в ядро через `createApp(...)`.

## Возможности

- запуск Hono-приложения и SSR через `createApp.mjs`;
- сборка браузерного бандла и SSR-модулей через `esbuild` (`builder/`);
- серверная обвязка маршрутов, auth и API (`server/`);
- React-контекст приложения, клиентский роутер и хук `useFetch` (`Layout/`, `router/`, `useFetch.js`);
- плагины esbuild для CSS-модулей, SCSS, SVG-компонентов и резолвинга `@vyaz/core`.

## Требования

- Node.js с поддержкой ESM и `process.loadEnvFile` (Node 20.12+);
- peer-зависимости: `react`, `react-dom`, `prop-types`, `hono`, `@hono/auth-js`.

## Установка

```bash
yarn add @vyaz/core
```

## Быстрый старт

Точка входа — `createApp.mjs`. Вызывается из приложения-воркспейса:

```js
import createApp from '@vyaz/core/createApp.mjs';

await createApp({
    routes,
    api,
    auth,
    hasAccess,
    PAGE_TITLE: 'My site',
    PORT: 3000,
});
```

`createApp` собирает браузерную и/или SSR-сборку и при необходимости запускает
HTTP-сервер в зависимости от флагов командной строки.

## CLI-флаги

| Флаг             | Назначение                                  |
| ---------------- | ------------------------------------------- |
| `--build-public` | собрать браузерный бандл                    |
| `--build-ssr`    | собрать SSR-модули                          |
| `--serve`        | запустить HTTP-сервер                       |
| `--watch`        | пересобирать браузерный бандл в watch-режиме |
| `--minify`       | минифицировать браузерную сборку            |
| `--sourcemap`    | добавить source maps                        |

Флаги можно комбинировать, например:

```bash
node app.mjs --build-public --build-ssr --serve
```

## Настройки

Настройки передаются в `createApp` и нормализуются в `utils/normalizeSettings.mjs`.

| Ключ                | По умолчанию              | Описание                                  |
| ------------------- | ------------------------- | ----------------------------------------- |
| `PORT`              | `3000`                    | порт сервера                              |
| `SERVER_URL`        | `http://localhost:PORT`   | публичный URL сервера                     |
| `OUTDIR`            | `./dist`                  | каталог сборки                            |
| `PUBLIC_PATH`       | `/public`                 | путь к собранной статике                  |
| `STATIC_PATH`       | `/static`                 | путь к статике из workspace               |
| `ASSET_PUBLIC_BASE` | `/uploads`                | путь к пользовательским загрузкам         |
| `API_ROOT`          | `/api`                    | префикс API                               |
| `AUTH_URL`          | `/auth`                   | префикс Auth.js                           |
| `AUTH_SIGNIN`       | `AUTH_URL + /signin`      | страница входа                            |
| `PAGE_TITLE`        | `''`                      | заголовок по умолчанию                    |
| `LAYOUT_HTML`       | `Layout/Layout.jsx`       | HTML-документ для SSR                     |
| `LAYOUT_APP`        | `Layout/Application.jsx`  | корневая обёртка приложения               |
| `LAYOUT_AUTH`       | `''`                      | layout страницы авторизации (опционально) |

## Маршруты

`routes` — массив объектов:

```js
const routes = [
    {
        path: '/',
        title: 'Главная',
        component: './Pages/Home.jsx',
        isPrivate: false,
        isServer: false,
    },
    {
        path: '/profile',
        title: 'Профиль',
        component: './Pages/Profile.jsx',
        isPrivate: true,
        getData: (c) => ({ from: c.req.url }),
    },
];
```

- `component` — путь к файлу страницы; в бандл попадает как ленивый `import()`;
- `isPrivate` — требует авторизации, иначе редирект на `AUTH_SIGNIN`;
- `isServer` — маршрут только для SSR, исключается из браузерной сборки;
- `getData` — функция, возвращающая начальные данные маршрута;
- `hasAccess(user, route)` — общий callback доступа из настроек `createApp`.

Доступ проверяется в `server/router.mjs`, первый совпавший маршрут не
перезаписывается более поздним динамическим.

## API

`api` — массив кортежей `[route, options, handler]`:

```js
const api = [
    ['/health', {}, async () => ({ ok: true })],
    [
        '/admin/users',
        { method: 'POST', permissions: ['admin'] },
        async (c) => ({ created: true }),
    ],
];
```

- `options.method` — `GET` (по умолчанию), `POST`, `PUT`, `PATCH`, `DELETE`;
- `options.private`, `permissions`, `permissionsAny`, `roles` делают маршрут приватным;
- `handler` может вернуть объект (уйдёт как JSON) или готовый `Response`
  (например, для файлов и кастомных заголовков).

Проверка доступа выполняется через `hasAccess(authUser, options)`.

## Авторизация

Если передан callback `auth`, ядро подключает Auth.js (`@hono/auth-js`),
монтирует обработчик по `AUTH_URL` и, при заданном `LAYOUT_AUTH`, отдельную
страницу входа `AUTH_SIGNIN`.

```js
await createApp({
    auth: ({ c, AUTH_URL, AUTH_SECRET, AUTH_SIGNIN, CredentialsProvider }) => ({
        providers: [
            CredentialsProvider({
                /* ... */
            }),
        ],
        secret: AUTH_SECRET,
        basePath: AUTH_URL,
    }),
});
```

Переменные окружения читаются из `.env` (или `APP_ENV_FILE`). Публичные
маршруты работают без настроенной авторизации, приватные без конфигурации
возвращают `503`.

## Клиентский слой

- `Context.js` — React-контекст приложения (`routeComponent`, `user`, `setUser`,
  `initialData`, `pathname`, `navigate`).
- `Layout/ApplicationCore.jsx` — провайдер состояния и клиентская навигация.
- `Layout/CurrentRoute.jsx` / `Layout/ServerCurrentRoute.jsx` — рендер активного
  маршрута на клиенте и на сервере.
- `router/createRouter.js` — клиентский роутер с поддержкой `:param`.
- `useFetch.js` — хук для запросов к API с `refetch`.
- `getAuthUrl.js` — константы `SIGNIN`, `SIGNUP`, `LOGOUT`.

## Структура

```
createApp.mjs        главная точка входа: настройки, сборка, Hono, SSR
builder/             esbuild-плагины и сборка browser/SSR
server/              роутинг, API, auth, сбор начальных данных
Layout/              базовые React-обвязки и HTML-layout
router/              клиентский роутер
utils/               настройки, env, argv и общие утилиты
test/                тесты ядра (node:test)
```

## Интеграция с workspace

Приложение подключается к ядру только через публичные пути `@vyaz/core/...`
и параметры `createApp`. Внутри ядра относительные self-импорты допустимы.

Точки расширения workspace: `config.mjs`, `server.mjs`, `auth.mjs`, а также
`routes`, `auth`, `api`, `hasAccess` и layout-пути, переданные в `createApp`.

## Разработка

```bash
yarn lint
node --test test/*.test.mjs
```

Тесты покрывают API-хендлеры (`test/api.test.mjs`) и серверный роутинг
(`test/router.test.mjs`).
