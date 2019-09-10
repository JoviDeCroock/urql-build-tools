import { resolve } from "path";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import buble from "rollup-plugin-buble";
import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
import { prettyTerserConfig, minifiedTerserConfig } from "./config/terser";
import transformInvariantWarning from "./babel/transformInvariantWarning";

const baseExternals = ["dns", "fs", "path", "url"];
const pkgInfo = require(resolve(process.cwd(), "package.json"));
const { peerDependencies, dependencies } = pkgInfo;
let external = [...baseExternals];

if (pkgInfo.peerDependencies) {
  external.push(...Object.keys(peerDependencies));
}

if (pkgInfo.dependencies) {
  external.push(...Object.keys(dependencies));
}

external = external.filter(x => x !== "tiny-invariant");

const externalPredicate = new RegExp(`^(${external.join("|")})($|/)`);
const externalTest = id => {
  if (id === "babel-plugin-transform-async-to-promises/helpers") return false;
  return externalPredicate.test(id);
};

const namedExports = {};
if (external.includes("react")) {
  namedExports["react"] = Object.keys(require("react"));
}

export const makePlugins = (isProduction = false, cwd) => {
  return [
    nodeResolve({
      mainFields: ["module", "jsnext", "main"],
      browser: true
    }),
    commonjs({
      ignoreGlobal: true,
      include: /\/node_modules\//,
      namedExports
    }),
    typescript({
      typescript: require("typescript"),
      tsconfig: `${cwd}/tsconfig.json`,
      cacheRoot: `${cwd}/node_modules/.cache/.rts2_cache`,
      useTsconfigDeclarationDir: true,
      tsconfigDefaults: {
        compilerOptions: {
          sourceMap: true
        }
      },
      tsconfigOverride: {
        exclude: [
          "src/**/*.test.ts",
          "src/**/*.test.tsx",
          "src/**/test-utils/*"
        ],
        compilerOptions: {
          declaration: !isProduction,
          declarationDir: `${cwd}/dist/types/`,
          target: "es6"
        }
      }
    }),
    buble({
      transforms: {
        unicodeRegExp: false,
        dangerousForOf: true,
        dangerousTaggedTemplateString: true
      },
      objectAssign: "Object.assign",
      exclude: "node_modules/**"
    }),
    babel({
      babelrc: false,
      extensions: [...DEFAULT_EXTENSIONS, "ts", "tsx"],
      exclude: "node_modules/**",
      presets: [],
      plugins: [
        transformInvariantWarning,
        ["babel-plugin-closure-elimination", {}],
        ["@babel/plugin-transform-object-assign", {}],
        [
          "@babel/plugin-transform-react-jsx",
          {
            pragma: "React.createElement",
            pragmaFrag: "React.Fragment",
            useBuiltIns: true
          }
        ],
        [
          "babel-plugin-transform-async-to-promises",
          {
            inlineHelpers: true,
            externalHelpers: true
          }
        ]
      ]
    }),
    isProduction &&
      replace({
        ENVIRONMENT: JSON.stringify("production"),
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
    terser(isProduction ? minifiedTerserConfig : prettyTerserConfig)
  ].filter(Boolean);
};

export const makeConfig = ({
  input = "./src/index.ts",
  isProduction = false,
  outputPath = "./dist"
} = {}) => ({
  external: externalTest,
  input,
  onwarn: () => {},
  ouput: [
    {
      sourcemap: !isProduction,
      legacy: true,
      freeze: false,
      esModule: isProduction ? undefined : false,
      format: "cjs",
      dir: `${outputPath}/cjs${isProduction ? "/min" : ""}`
    },
    {
      sourcemap: !isProduction,
      legacy: true,
      freeze: false,
      esModule: isProduction ? undefined : false,
      format: "esm",
      dir: `${outputPath}/es${isProduction ? "/min" : ""}`
    }
  ],
  plugins: makePlugins(isProduction, outputPath),
  treeshake: {
    propertyReadSideEffects: false
  }
});
