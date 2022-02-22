# urql-build-tools

This package exports a function called `makeConfig`, this will supply you with
the default config as seen in [the main repo](https://github.com/FormidableLabs/urql/blob/master/rollup.config.js)
without the `input` and `output` keys.

The function accepts one argument and that is whether or not you're building in production.

Other exports are:

- externalTest - gives you the externals test that takes `babel-plugin-transform-async-to-promises/helpers` in account.
- namedExports - based on React being in the deps will make the keys of React namedExports for the commonjs rollup plugin.
- makePlugins - accepts isProduction and base folder as arguments.


## Maintenance Status

**Archived:** This project is no longer maintained by Formidable. We are no longer responding to issues or pull requests unless they relate to security concerns. We encourage interested developers to fork this project and make it their own!
