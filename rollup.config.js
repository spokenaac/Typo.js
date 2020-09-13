import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
// import cleanup from 'rollup-plugin-cleanup';
import pkg from './package.json';
const scratchBuild = pkg._scratchBuild.replace('{0}', pkg._scratch);
const inputIife = scratchBuild +'/typo.js';
const inputCjs = scratchBuild + '/index.js';
const esOut = pkg._jsEsFile; // js/es/typo.js
const external = (id) => !id.startsWith('.') && !id.startsWith('/');
const getBabelOptions = (useESModules = true) => ({
  extensions: ['.js'],
  // babelHelpers: 'runtime',
  babelHelpers: 'bundled',
  comments: false,
  presets: [
    ['@babel/preset-env', { 
      "targets": {
        "chrome": "60"
      },
      bugfixes: true, loose: false }]
  ],
  plugins: [
    ["@babel/plugin-transform-classes"]
  ]
});

export default [
  {
    input: inputCjs,
    output: {
      file: pkg.main,
      format: 'cjs',
      interop: false,
      sourcemap: true,
    },
    external,
    plugins: [
      //resolve({ extensions: ['.ts', '.tsx', 'js'] }),
      resolve(),
      babel(getBabelOptions(false)),
      //sizeSnapshot(),
    ],
  },
  {
    input: inputIife,
    output: {
      file: esOut,
      format: 'iife',
      interop: false,
      sourcemap: true,
    },
    external,
    plugins: [
      //resolve({ extensions: ['.ts', '.tsx', 'js'] }),
      resolve(),
      babel(getBabelOptions(false)),
      //sizeSnapshot(),
    ],
  }
];

