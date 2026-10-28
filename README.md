# Тестирование загрузчика страниц (JS)

[![hexlet-check](https://github.com/kicha3007-boop/js-jest-testing-project-67/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/kicha3007-boop/js-jest-testing-project-67/actions)
[![CI](https://github.com/kicha3007-boop/js-jest-testing-project-67/actions/workflows/main.yml/badge.svg)](https://github.com/kicha3007-boop/js-jest-testing-project-67/actions/workflows/main.yml)

`page-loader` — утилита и библиотека: скачивает страницу вместе с локальными ресурсами (картинки, стили,
скрипты с того же хоста) и переписывает ссылки на скачанные файлы, чтобы страница открывалась без сети.
Главное в проекте — тесты: сеть замокана nock, каждый тест работает в своей временной директории.

## Установка

Нужен Node.js 22+.

```bash
git clone https://github.com/kicha3007-boop/js-jest-testing-project-67.git
cd js-jest-testing-project-67
make install          # зависимости
make test             # тесты (vitest + nock)
make test-coverage    # тесты с порогом покрытия 90%
make lint             # oxlint + oxfmt
npm link              # команда page-loader в системе
```

## Использование

```bash
page-loader --output /var/tmp https://ru.hexlet.io/courses
Page was downloaded as '/var/tmp/ru-hexlet-io-courses.html'
```

- `-o, --output [dir]` — куда сохранять (по умолчанию текущая директория; она должна существовать);
- страница: `ru-hexlet-io-courses.html`, ресурсы: `ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css` —
  адрес без протокола, всё кроме букв и цифр заменено на `-`, расширение сохраняется (у страниц — `.html`);
- ресурсы с других хостов (CDN, счётчики) не скачиваются и их ссылки не меняются;
- ошибки (ответ не 200, сеть, нет директории или прав) печатаются в stderr, код выхода `1`.

Как библиотека:

```javascript
import pageLoader from '@hexlet/code';

const { filepath } = await pageLoader('https://ru.hexlet.io/courses', '/var/tmp');
```

Отладочный лог: `DEBUG=page-loader page-loader …` (с запросами axios — `DEBUG=page-loader,axios`,
с перехватами nock в тестах — `DEBUG=nock.* make test`).

## Что проверяют тесты

- страница сохраняется с переписанными ссылками (сравнение с фикстурой `__fixtures__/expected.html`);
- каждый ресурс скачан с тем же содержимым, что отдал сервер (картинка — побайтно);
- чужие ресурсы не тронуты, загрузка по умолчанию идёт в текущую директорию;
- ошибки: страница 404/500, ресурс недоступен, сетевой сбой, нет выходной директории (и она не создаётся),
  выходной путь — файл.
