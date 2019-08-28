import { BuildStep } from "./types";

export const steps: Array<BuildStep> = [
  { type: "cjs", production: false },
  { type: "esm", production: false },
  { type: "cjs", production: true },
  { type: "esm", production: true }
];

export const baseOutputOptions = {
  sourcemap: true,
  legacy: true,
  freeze: false
};

export const external = ["dns", "fs", "path", "url"];
