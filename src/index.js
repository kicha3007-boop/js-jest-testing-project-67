import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import "axios-debug-log";
import * as cheerio from "cheerio";
import debug from "debug";
import Listr from "listr";
import { buildPageName, buildResourceName, buildResourcesDirName } from "./names.js";

const log = debug("page-loader");

const resourceAttributes = {
  img: "src",
  link: "href",
  script: "src",
};

// Ресурсы страницы с того же хоста: заменяет ссылки на локальные пути и возвращает список загрузок
const extractResources = ($, pageUrl, resourcesDirName) =>
  Object.entries(resourceAttributes).flatMap(([tag, attribute]) =>
    $(`${tag}[${attribute}]`)
      .toArray()
      .map((element) => {
        const resourceUrl = new URL($(element).attr(attribute), pageUrl);
        return { element, attribute, resourceUrl };
      })
      .filter(({ resourceUrl }) => resourceUrl.hostname === pageUrl.hostname)
      .map(({ element, attribute: name, resourceUrl }) => {
        const localPath = path.posix.join(resourcesDirName, buildResourceName(resourceUrl));
        $(element).attr(name, localPath);
        return { url: resourceUrl.toString(), localPath };
      }),
  );

const downloadResource = (url, filepath) =>
  axios
    .get(url, { responseType: "arraybuffer" })
    .then(({ data }) => fs.writeFile(filepath, data))
    .then(() => log(`saved ${url} as ${filepath}`));

const pageLoader = (address, outputDir = process.cwd()) => {
  const pageUrl = new URL(address);
  const pagePath = path.resolve(outputDir, buildPageName(pageUrl));
  const resourcesDirName = buildResourcesDirName(pageUrl);
  log(`loading ${address} to ${outputDir}`);

  return fs
    .access(outputDir)
    .then(() => axios.get(address, { responseType: "text" }))
    .then(({ data }) => {
      const $ = cheerio.load(data);
      const resources = extractResources($, pageUrl, resourcesDirName);
      log(`found ${resources.length} local resources`);
      return fs
        .writeFile(pagePath, $.html())
        .then(() => fs.mkdir(path.join(outputDir, resourcesDirName), { recursive: true }))
        .then(() => {
          const tasks = resources.map(({ url, localPath }) => ({
            title: url,
            task: () => downloadResource(url, path.join(outputDir, localPath)),
          }));
          return new Listr(tasks, { concurrent: true }).run();
        });
    })
    .then(() => ({ filepath: pagePath }));
};

export default pageLoader;
