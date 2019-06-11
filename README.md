## rollup-plugin-url-resolve

The goal of this plugin is to avoid the need to use `npm` or `yarn` clients to explicitly install your dependencies from the registry before you bundle. Instead of specifying your dependencies in `package.json`, you specify them in your source code as [URLs](https://url.spec.whatwg.org/#absolute-url-with-fragment-string) in `import` statements. Then Rollup dynamically fetches and includes those dependencies when you bundle.

For example, you could put the following in your `rollup.config.js`:

```js
import urlResolve from 'rollup-plugin-url-resolve';

export default {
  // ...
  plugins: [urlResolve()]
};
```

Then, in your source files, you can do stuff like this:

```js
import * as d3 from 'https://unpkg.com/d3?module';
```

Run `rollup`, and you're done. No more `npm install`! :) Well, at least not for your app's dependencies.

Currently, the following URL protocols are supported:

- `https:` and `http:`
- `file:`
- `data:`

It might help to think about this plugin as an alternative to [`rollup-plugin-node-resolve`](https://www.npmjs.com/package/rollup-plugin-node-resolve), but for any URL, not just stuff you've already installed in `node_modules`.

### Options

The `urlResolve` function accepts all the same options as [`make-fetch-happen`](https://www.npmjs.com/package/make-fetch-happen). They are used when we need to `fetch` a module from a remote URL. One option that is particularly useful is `cacheManager`, which can be used to cache the results of `fetch` operations on disk. This can make your builds a lot faster if many of your URLs point to remote servers.

```js
import urlResolve from 'rollup-plugin-url-resolve';

export default {
  // ...
  plugins: [
    urlResolve({
      // Caches the results of all fetch operations
      // in a local directory named ".cache"
      cacheManager: '.cache'
    })
  ]
};
```

There are various other options as well, including support for retrying failed requests and proxy servers. Please see [the list of options](https://www.npmjs.com/package/make-fetch-happen#extra-options) for more information.

### Using CommonJS

You could also try using a URL that returns CommonJS, though you won't get the benefit of tree-shaking that using JavaScript modules provides. Still, it can be a useful stopgap until a package you need starts publishing JavaScript modules.

If you do this, you'll probably want to use [`rollup-plugin-commonjs`](https://www.npmjs.com/package/rollup-plugin-commonjs) on those URLs in your Rollup config, just like you would normally do for stuff in `node_modules`:

```js
import commonjs from 'rollup-plugin-commonjs';
import urlResolve from 'rollup-plugin-url-resolve';

export default {
  // ...
  plugins: [
    urlResolve(),
    commonjs({
      // Treat unpkg URLs as CommonJS
      include: /^https:\/\/unpkg\.com/,
      // ...except for unpkg ?module URLs
      exclude: /^https:\/\/unpkg\.com.*?\?.*?\bmodule\b/
    })
  ]
};
```

### License

[MIT](./LICENSE)
