import { readFileSync as readFile } from 'fs';
import readData from 'data-uri-to-buffer';
import mimeTypes from 'mime-types';
import fetch from 'make-fetch-happen';

import rewriteRelativeImports from './rewriteRelativeImports.js';

function parseURL(source) {
  try {
    return new URL(source);
  } catch (error) {
    // Not a valid absolute-URL-with-fragment string
    // https://url.spec.whatwg.org/#absolute-url-with-fragment-string
    return null;
  }
}

function isValidURL(url) {
  return url && (['data:', 'file:', 'http:', 'https:'].indexOf(url.protocol) >= 0);
}

async function loadURL(url, fetchOpts) {
  // console.log('load', url.href);

  switch (url.protocol) {
    case 'data:':
      // TODO: Resolve relative imports in data URIs?
      return readData(url.href);
    case 'file:':
      return rewriteRelativeImports(
        url,
        mimeTypes.lookup(url.href),
        readFile(url).toString()
      );
    case 'http:':
    case 'https:':
      return fetch(url.href, fetchOpts).then(res =>
        res.status === 404
          ? null
          : res.text().then(text => {
              // Resolve relative to the final URL, i.e. how browsers do it.
              const finalURL = new URL(res.url);
              const contentTypeHeader = res.headers.get('Content-Type');
              const contentType = contentTypeHeader
                ? contentTypeHeader.split(';')[0]
                : 'text/plain';

              return rewriteRelativeImports(finalURL, contentType, text);
            })
      );
    default:
      throw new Error(`Cannot load URL protocol: ${url.protocol}`);
  }
}

export default function urlResolve(fetchOpts) {
  return {
    resolveId(source) {
      const url = parseURL(source);
      return isValidURL(url) ? url.href : null;
    },
    load(id) {
      const url = parseURL(id);
      return isValidURL(url) ? loadURL(url, fetchOpts) : null;
    }
  };
}
