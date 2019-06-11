import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';

import pkg from './package.json';

function isBareModuleId(id) {
  return !id.startsWith('.') && !id.startsWith('/');
}

const esm = {
  input: './modules/index.js',
  external: isBareModuleId,
  output: {
    file: `esm/${pkg.name}.js`,
    format: 'esm'
  },
  plugins: [
    nodeResolve(),
    json(),
    commonjs({
      include: /node_modules/
    })
  ]
};

const cjs = {
  input: './modules/index.js',
  external: isBareModuleId,
  output: {
    file: `cjs/${pkg.name}.js`,
    format: 'cjs'
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: /node_modules/
    })
  ]
};

export default [esm, cjs];
