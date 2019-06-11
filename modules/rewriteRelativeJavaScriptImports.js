import babel from '@babel/core';

import relativeRewrite from './plugins/relativeRewrite.js';

export default function rewriteRelativeJavaScriptImports(base, code) {
  const options = {
    // Ignore .babelrc and package.json babel config
    // because we haven't installed dependencies so
    // we can't load plugins; see #84
    babelrc: false,
    // Make a reasonable attempt to preserve whitespace
    // from the original file. This ensures minified
    // .mjs stays minified; see #149
    retainLines: true,
    plugins: [relativeRewrite(base)]
  };

  return babel.transform(code, options).code;
}
