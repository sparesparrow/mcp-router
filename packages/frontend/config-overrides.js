const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Add fallbacks for node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "stream": require.resolve("stream-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "util": require.resolve("util/"),
    "buffer": require.resolve("buffer/"),
    "url": require.resolve("url/"),
    "assert": require.resolve("assert/"),
    "crypto": require.resolve("crypto-browserify"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "process": require.resolve("process/browser.js"),
    "querystring": require.resolve("querystring-es3"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false
  };

  // Comment out mock for @mcp-router/shared to use the real package
  // config.resolve.alias = {
  //   ...config.resolve.alias,
  //   '@mcp-router/shared': path.resolve(__dirname, 'src/mocks/mcp-router-shared.ts'),
  //   '@mcp-router/shared/dist/types/mcp': path.resolve(__dirname, 'src/mocks/mcp-router-shared.ts'),
  //   '@mcp-router/shared/src/types/analyzer': path.resolve(__dirname, 'src/mocks/mcp-router-shared.ts')
  // };

  // Add buffer polyfill
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  );

  return config;
}; 