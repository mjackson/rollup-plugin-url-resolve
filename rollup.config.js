import commonjs    from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json        from '@rollup/plugin-json';
import pkg         from './package.json';


const external = [ '@babel/core', 'data-uri-to-buffer', 'make-fetch-happen', 'mime-types', 'fs' ];

const esm = {
  input: './modules/index.js',
  external: external,
  output: {
    file: `esm/${pkg.name}.js`,
    format: 'esm'
  },
  plugins: [
    nodeResolve(),
    json(),
    commonjs()
  ]
};

const cjs = {
  input: './modules/index.js',
  external: external,
  output: {
    exports: 'default',
    file: `cjs/${pkg.name}.js`,
    format: 'cjs'
  },
  plugins: [
    nodeResolve(),
    json(),
    commonjs()
  ]
};

export default [ esm, cjs ];
