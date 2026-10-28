import path from "node:path";

// Всё, кроме букв и цифр, — дефис: ru.hexlet.io/courses → ru-hexlet-io-courses
const slugify = (text) => text.replace(/[^a-zA-Z0-9]/g, "-");

const withoutProtocol = (url) => `${url.hostname}${url.pathname}`.replace(/\/$/, "");

export const buildPageName = (url) => `${slugify(withoutProtocol(url))}.html`;

export const buildResourcesDirName = (url) => `${slugify(withoutProtocol(url))}_files`;

// Расширение ресурса сохраняется, у ресурса без расширения (страница) — .html
export const buildResourceName = (url) => {
  const address = withoutProtocol(url);
  const extension = path.extname(url.pathname);
  const base = extension ? address.slice(0, -extension.length) : address;
  return `${slugify(base)}${extension || ".html"}`;
};
