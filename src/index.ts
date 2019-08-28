import { rollup, watch as rollupWatch, InputOptions } from "rollup";
import { basename, resolve } from "path";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import buble from "rollup-plugin-buble";
import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
import gzip from "gzip-size";
import { prettyTerserConfig, minifiedTerserConfig } from "./config/terser";
import transformInvariantWarning from './babel/transformInvariantWarning';
import { BuildType, BundleValue, OutputOptions } from "./types";
import { baseOutputOptions, external as baseExternals, steps } from "./constants";
import { prettyPrintBytes } from "./utils";

const pkgInfo = require(resolve(process.cwd(), 'package.json'));
const { main, peerDependencies, dependencies } = pkgInfo;
const name = basename(main, ".js");
const external = [...baseExternals];

if (pkgInfo.peerDependencies) {
  external.push(...Object.keys(peerDependencies));
}

if (pkgInfo.dependencies) {
  external.push(...Object.keys(dependencies));
}

const externalPredicate = new RegExp(`^(${external.join("|")})($|/)`);
const externalTest = id => {
  if (id === "babel-plugin-transform-async-to-promises/helpers") return false;
  return externalPredicate.test(id);
};

async function getGzippedSize(code, name) {
  const size = await gzip(code);
  return `${name} (gz): ${prettyPrintBytes(size)}`;
}

const getPlugins = (isProduction = false) => [
  nodeResolve({
    mainFields: ['module', 'jsnext', 'main'],
    browser: true
  }),
  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
    namedExports: {
      'react': Object.keys(require('react'))
    },
  }),
  typescript({
    typescript: require('typescript'),
    cacheRoot: './node_modules/.cache/.rts2_cache',
    useTsconfigDeclarationDir: true,
    tsconfigDefaults: {
      compilerOptions: {
        sourceMap: true
      },
    },
    tsconfigOverride: {
     exclude: [
       'src/**/*.test.ts',
       'src/**/*.test.tsx',
       'src/**/test-utils/*'
     ],
     compilerOptions: {
        declaration: !isProduction,
        declarationDir: './dist/types/',
        target: 'es6',
      },
    },
  }),
  buble({
    transforms: {
      unicodeRegExp: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true
    },
    objectAssign: 'Object.assign',
    exclude: 'node_modules/**'
  }),
  babel({
    babelrc: false,
    extensions: [...DEFAULT_EXTENSIONS, 'ts', 'tsx'],
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      transformInvariantWarning,
      ['babel-plugin-closure-elimination', {}],
      ['@babel/plugin-transform-object-assign', {}],
      ['@babel/plugin-transform-react-jsx', {
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
        useBuiltIns: true
      }],
      ['babel-plugin-transform-async-to-promises', {
        inlineHelpers: true,
        externalHelpers: true
      }]
    ]
  }),
  isProduction && replace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  terser(isProduction ? minifiedTerserConfig : prettyTerserConfig),
].filter(Boolean);

const getInputOptions = ({ production }): InputOptions => ({
  plugins: getPlugins(production),
  input: "./src/index.ts",
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false
  }
})

const getOutputOptions = ({ type, production }: OutputOptions) => {
  if (production) {
    return {
      ...baseOutputOptions,
      file: `./dist/${name}${type === 'esm' ? '.es' : ''}.min.js`,
      format: type
    }
  }
  return {
    ...baseOutputOptions,
    esModule: false,
    file: `./dist/${name}${type === "esm" ? ".es" : ""}.js`,
    format: type
  };
}

export default async function build({ watch }) {
  if (watch) {
		return new Promise((_, reject) => {
      steps.map(step => {
        const inputOptions = getInputOptions(step);
        const outputOptions = getOutputOptions(step);
        const watchOptions = {
          ...inputOptions,
          output: outputOptions,
          watch: { exclude: "node_modules/**" }
        };
        rollupWatch(watchOptions as any).on("event", e => {
          if (e.code === "FATAL") {
            console.error(e);
            return reject(e.error);
          } else if (e.code === "ERROR") {
            console.error(e.error);
          }
          if (e.code === "END") {
            console.log("success");
          }
        });
      });
    });
  }

  const bundleSizes: Array<string> = [];
  try {
    let cache;
    for (let i = 0; i < steps.length; i++) {
      const inputOptions = getInputOptions(steps[i]);
      (inputOptions as any).cache = cache;
      const outputOptions = getOutputOptions(steps[i]);
      const bundle = await rollup(inputOptions);
      cache = bundle;
      const { output } = await bundle.generate(outputOptions);
      const bundleValues: BundleValue[] = Object.values(output);
      for (let i = 0; i < bundleValues.length; i++) {
        const { code, fileName } = bundleValues[i];
        if (code) { bundleSizes.push(await getGzippedSize(code, fileName)); }
      }
      await bundle.write(outputOptions);
    }
  } catch(e) {
    console.error(e);
  }

  console.log('Build success');
  bundleSizes.forEach(entry => console.log(entry));
}
