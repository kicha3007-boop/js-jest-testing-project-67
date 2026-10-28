#!/usr/bin/env node

import { program } from "commander";
import pageLoader from "../src/index.js";

program
  .description("Page loader utility")
  .version("1.0.0")
  .arguments("<url>")
  .option("-o, --output [dir]", "output dir", process.cwd())
  .action((url, options) =>
    pageLoader(url, options.output)
      .then(({ filepath }) => {
        console.log(`Page was downloaded as '${filepath}'`);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      }),
  );

program.parse();
