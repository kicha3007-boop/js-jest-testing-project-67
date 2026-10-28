import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nock from "nock";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import pageLoader from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const getFixturePath = (name) => path.join(__dirname, "..", "__fixtures__", name);
const readFixture = (name, encoding = "utf-8") => fs.readFile(getFixturePath(name), encoding);

const origin = "https://ru.hexlet.io";
const pageUrl = `${origin}/courses`;
const filesDir = "ru-hexlet-io-courses_files";

const resources = [
  {
    url: "/assets/professions/nodejs.png",
    fixture: "nodejs.png",
    file: "ru-hexlet-io-assets-professions-nodejs.png",
  },
  {
    url: "/assets/application.css",
    fixture: "application.css",
    file: "ru-hexlet-io-assets-application.css",
  },
  { url: "/packs/js/runtime.js", fixture: "runtime.js", file: "ru-hexlet-io-packs-js-runtime.js" },
  { url: "/courses", fixture: "page.html", file: "ru-hexlet-io-courses.html" },
];

let page;
let tmpDir;

beforeAll(async () => {
  nock.disableNetConnect();
  page = await readFixture("page.html");
});

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "page-loader-"));
});

afterEach(() => {
  nock.cleanAll();
});

describe("successful download", () => {
  beforeEach(async () => {
    const scope = nock(origin).get("/courses").reply(200, page);
    for (const { url, fixture } of resources) {
      scope.get(url).reply(200, await readFixture(fixture, null));
    }
  });

  test("saves the page with links to local resources", async () => {
    const { filepath } = await pageLoader(pageUrl, tmpDir);

    expect(filepath).toBe(path.join(tmpDir, "ru-hexlet-io-courses.html"));
    const actual = await fs.readFile(filepath, "utf-8");
    expect(actual).toBe(await readFixture("expected.html"));
  });

  test.each(resources)("downloads $url", async ({ fixture, file }) => {
    await pageLoader(pageUrl, tmpDir);

    const actual = await fs.readFile(path.join(tmpDir, filesDir, file));
    expect(actual).toEqual(await readFixture(fixture, null));
  });
});

describe("errors", () => {
  test.each([404, 500])("page responds with %i", async (status) => {
    nock(origin).get("/courses").reply(status);

    await expect(pageLoader(pageUrl, tmpDir)).rejects.toThrow(String(status));
  });

  test("resource is unavailable", async () => {
    nock(origin).get("/courses").reply(200, page).get(/.*/).times(resources.length).reply(404);

    await expect(pageLoader(pageUrl, tmpDir)).rejects.toThrow();
  });

  test("network error", async () => {
    nock(origin).get("/courses").replyWithError("connect ECONNREFUSED");

    await expect(pageLoader(pageUrl, tmpDir)).rejects.toThrow("ECONNREFUSED");
  });

  test("resource network error", async () => {
    nock(origin)
      .get("/courses")
      .reply(200, page)
      .get(/.*/)
      .times(resources.length)
      .replyWithError("socket hang up");

    await expect(pageLoader(pageUrl, tmpDir)).rejects.toThrow("socket hang up");
  });

  test("output directory does not exist", async () => {
    const missing = path.join(tmpDir, "missing");

    await expect(pageLoader(pageUrl, missing)).rejects.toThrow("ENOENT");
    await expect(fs.access(missing)).rejects.toThrow("ENOENT");
  });

  test("output path is a file", async () => {
    const file = path.join(tmpDir, "file.txt");
    await fs.writeFile(file, "");
    nock(origin).get("/courses").reply(200, page).get(/.*/).times(resources.length).reply(200, "");

    await expect(pageLoader(pageUrl, file)).rejects.toThrow();
  });
});

describe("defaults", () => {
  test("downloads to the current working directory", async () => {
    const scope = nock(origin).get("/courses").reply(200, page);
    for (const { url, fixture } of resources) {
      scope.get(url).reply(200, await readFixture(fixture, null));
    }
    const cwd = process.cwd();
    process.chdir(tmpDir);

    try {
      const { filepath } = await pageLoader(pageUrl);
      expect(await fs.realpath(filepath)).toBe(
        await fs.realpath(path.join(tmpDir, "ru-hexlet-io-courses.html")),
      );
      expect((await fs.readdir(path.join(tmpDir, filesDir))).sort()).toEqual(
        resources.map(({ file }) => file).sort(),
      );
    } finally {
      process.chdir(cwd);
    }
  });
});
