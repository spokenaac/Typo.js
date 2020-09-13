import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

const scratchBuild = pkg._scratchLegacy.replace('{0}', pkg._scratch);
const input = scratchBuild + '/typo.js';
const out = pkg._jsLegacyFile;
const getBabelOptions = (useESModules = true) => ({
  babelHelpers: 'bundled',
  exclude: 'node_modules/**', // only transpile our source code
  comments: false,
  presets: [
    ['@babel/preset-env', {
      "modules": useESModules,
      "useBuiltIns": "usage",
      "corejs": 3,
      "targets": "ie 11",
    }],
  ],
  plugins: [
    ["@babel/plugin-transform-classes"],
  //  ["@babel/plugin-transform-runtime", { "regenerator": true }]
  ]
});
export default [
  {
    "input": input,
    output: {
      file: out,
      format: 'iife',
      sourcemap: true,
      globals: {
        "window": "window"
      }
    },
   // external
    external: ["window"],
    plugins: [
      resolve(),
      babel(getBabelOptions(false)),
      commonjs()
    ],
  }
];
