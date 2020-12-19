import { readFileSync as readFile } from 'fs';
import path from 'path';
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

function resolveURL(url) {
  switch (url.protocol) {
    case 'data:':
    case 'file:':
    case 'http:':
    case 'https:':
      return url.href;
    default:
      throw new Error(`Cannot resolve URL protocol: ${url.protocol}`);
  }
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

function splitPackageAndFile(specifier) {
  const segments = specifier.split('/');

  // Example: '@foo/strip-ansi/index.js' or '@foo/strip-ansi'
  if (specifier.startsWith('@')) {
    return [segments.splice(0, 2).join('/'), segments.splice(2).join('/')];
  }

  // Example: 'strip-ansi/index.js'
  if (segments.length > 2) {
    return [segments[0], segments.splice(1).join('/')];
  }

  // Example: 'strip-ansi' or 'foo.js'
  return specifier.indexOf('.') === -1 ? [specifier, ''] : ['', specifier];
}

// Input example: "/@foo/string-length@4.0.1/index.js" or "/string-length@4.0.1/index.js"
function packageName(absolutePath) {
  const segments = absolutePath.split('/');

  if (absolutePath.startsWith('/@')) {
    // Output example "@foo/string-length@4.0.1"
    return path.join(segments[1], segments[2]);
  }

  // Output example "string-length@4.0.1"
  return segments[1];
}

export default function urlResolve(fetchOpts) {
  return {
    async resolveId(source, importer) {
      // Example: https://unpkg.com/strip-ansi@6.0.0/index.js
      const url = parseURL(source);
      if (url) {
        return resolveURL(url);
      }

      // Example: https://unpkg.com/string-length@4.0.1/index.js
      const importerUrl = parseURL(importer);
      if (!importerUrl) {
        return null;
      }

      const importerPackage = packageName(importerUrl.pathname);
      importerUrl.pathname = path.join(importerPackage, 'package.json');
      const importerPackageJson = JSON.parse(
        await loadURL(importerUrl, fetchOpts)
      );

      const [sourcePackage, sourceFile] = splitPackageAndFile(source);
      if (sourcePackage === '') {
        return null;
      }

      const version = importerPackageJson.dependencies[sourcePackage];
      importerUrl.pathname = path.join(
        `${sourcePackage}@${version}`,
        sourceFile
      );
      return importerUrl.toString();
    },
    load(id) {
      const url = parseURL(id);
      return url ? loadURL(url, fetchOpts) : null;
    }
  };
}
