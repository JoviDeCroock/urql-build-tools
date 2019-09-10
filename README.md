# urql-build-tools

This package exports a function called `makeConfig`, this will supply you with
the default config as seen in [the main repo](https://github.com/FormidableLabs/urql/blob/master/rollup.config.js)
without the `input` and `output` keys.

The function accepts one argument and that is whether or not you're building in production.

Other exports are:

- externalTest - gives you the externals test that takes `babel-plugin-transform-async-to-promises/helpers` in account.
- namedExports - based on React being in the deps will make the keys of React namedExports for the commonjs rollup plugin.
- makePlugins - accepts isProduction and base folder as arguments.
