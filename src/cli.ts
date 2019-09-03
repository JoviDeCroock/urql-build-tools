#!/usr/bin/env node

import build from ".";
import sade from "sade";

const run = opts => {
  build(opts)
    .then(() => {
      if (!opts.watch) process.exit(0);
    })
    .catch(err => {
      process.exitCode = (typeof err.code === "number" && err.code) || 1;
      process.exit();
    });
};

const cli = handler => {
  const buildTools = sade("urql-build-tools");

  const cmd = type => (_, opts: { cwd?: string; watch?: boolean } = {}) => {
    opts.watch = opts.watch || type === "watch";
    opts.cwd = process.cwd();
    handler(opts);
  };

  buildTools.version("0.0.1").option("--watch, -w", "Watch source", false);

  buildTools
    .command("build", "", { default: true })
    .describe("Build")
    .action(cmd("build"));

  buildTools
    .command("watch")
    .describe("Watch source")
    .action(cmd("watch"));

  return argv => buildTools.parse(argv, { alias: { w: ["watch"] } });
};

cli(run)(process.argv);
