const path = require('path');
const rspack = require('@rspack/core');
const RefreshPlugin = require('@rspack/plugin-react-refresh');
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');
const { fallbacksProvidePluginConfig } = require('@teambit/webpack.webpack-bundler');
const html = require('./rsbuild-html');

process.env.NODE_ENV = 'development';
const isDev = process.env.NODE_ENV === 'development';

const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  '/',
  '/public'
);

const configFactory = (
  workspaceDir,
  entryFiles,
  publicRoot,
  publicPath,
) => {
  const resolveWorkspacePath = (relativePath) =>
    path.resolve(workspaceDir, relativePath);

  const entry = entryFiles.map((filePath) => resolveWorkspacePath(filePath));

  // console.log('🚀 ~ file: rspack.dev.config.ts:35 ~ entry:', entry);

  const publicDirectory = `${publicRoot}${publicPath}`;
  return {
    devtool: 'eval-cheap-module-source-map',
    mode: isDev ? 'development' : 'production',
    entry,
    output: {
      // Development filename output
      path: resolveWorkspacePath(publicDirectory),
      // publicPath: resolveWorkspacePath(publicDirectory),
      filename: 'static/js/[name].bundle.js',
      chunkFilename: 'static/js/[name].chunk.js',
      // point sourcemap entries to original disk locations (format as URL on windows)
      // devtoolModuleFilenameTemplate: (info) =>
      //   pathNormalizeToLinux(path.resolve(info.absoluteResourcePath)),
    },
    infrastructureLogging: {
      level: 'error',
    },
    devServer: {
      allowedHosts: 'all',
      static: [
        {
          directory: resolveWorkspacePath(publicDirectory),
          staticOptions: {},
          // Don't be confused with `dev.publicPath`, it is `publicPath` for static directory
          // Can be:
          // publicPath: ['/static-public-path-one/', '/static-public-path-two/'],
          publicPath: publicDirectory,
          // Can be:
          // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
          serveIndex: true,
          // Can be:
          // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
          watch: true,
        },
      ],

      // Enable compression
      compress: true,

      historyApiFallback: {
        disableDotRule: true,
        // index: resolveWorkspacePath(publicDirectory),
        index: '/index.html',
      },

      client: {
        overlay: false,
      },

      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('rspack-dev-server is not defined');
        }

        // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
        // middlewares before `redirectServedPath` otherwise will not have any effect
        // This lets us fetch source contents from webpack for the error overlay
        middlewares.push(
          evalSourceMapMiddleware(devServer),
          // This lets us open files from the runtime error overlay.
          errorOverlayMiddleware(),
          // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
          redirectServedPath(publicUrlOrPath),
          // This service worker file is effectively a 'no-op' that will reset any
          // previous service worker registered for the same host:port combination.
          // We do this in development to avoid hitting the production cache if
          // it used the same host and port.
          // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
          noopServiceWorkerMiddleware(publicUrlOrPath)
        );
        return middlewares;
      },

      devMiddleware: {
        // forward static files
        publicPath: path.join('/', publicRoot),
        writeToDisk: true,
      },
    },
    target: ['web', 'es5'],
    resolve: {
      extensions: ['...', '.ts', '.tsx', '.jsx'],
      alias: {
        '@teambit/mdx.ui.mdx-scope-context': require.resolve(
          '@teambit/mdx.ui.mdx-scope-context'
        ),
        '@mdx-js/react': require.resolve('@mdx-js/react'),
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
      },
      fallback: {
        fs: false,
        path: false,
        crypto: false,
        buffer: false,
        stream: false,
        os: false,
        assert: false,
        zlib: false,
        url: false,
        util: false,
        http: false,
        https: false,
        net: false,
        tty: false,
        process: false,
        child_process: false,
        constants: false,
        vm: false,
        domain: false,
        punycode: false,
        querystring: false,
        timers: false,
        events: false,
        dns: false,
        dgram: false,
        module: false,
        cluster: false,
        readline: false,
        repl: false,
        string_decoder: false,
        tls: false,
        inspector: false,
        perf_hooks: false,
        worker_threads: false,
        v8: false,
      },
    },
    module: {
      generator: {
        'css/auto': {
          exportsOnly: true,
          esModule:false,
          exportsConvention: 'camel-case-only',
          localIdentName: isDev ? '[path][name][ext]__[local]' : '[hash]',
        },
        css: {
          exportsOnly: true,
          esModule:false,
          exportsConvention: 'camel-case-only',
        },
        'css/module': {
          esModule:false,
          exportsOnly: true,
          exportsConvention: 'camel-case-only',
          localIdentName: isDev ? '[path][name][ext]__[local]' : '[hash]',
        },
      },
      parser: {
        'css/auto': {
          namedExports: false,
        },
        css: {
          namedExports: false,
        },
        'css/module': {
          namedExports: false,
        },
      },
      rules: [
        {
          test: /\.svg$/,
          type: 'asset',
        },
        {
          test: /\.(jsx?|tsx?)$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                sourceMap: true,
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      development: isDev,
                      refresh: isDev,
                    },
                  },
                },
                env: {
                  targets: [
                    'chrome >= 87',
                    'edge >= 88',
                    'firefox >= 78',
                    'safari >= 14',
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.(sass|scss)$/,
          use: 'sass-loader',
          type: 'css/auto',
          parser: {
            namedExports: false,
          },
        },
      ],
    },
    plugins: [
      new rspack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
      new rspack.ProgressPlugin({}),
      new rspack.ProvidePlugin(fallbacksProvidePluginConfig),
      new rspack.HtmlRspackPlugin({
        templateContent: html('Rspack + React + TS'),
        filename: 'index.html',
      }),
      isDev ? new RefreshPlugin() : null,
      // new WebpackBitReporterPlugin({
      //   options: { pubsub, devServerID },
      // }),
    ].filter(Boolean),
    experiments: {
      css: true,
    },
  };
};

module.exports = configFactory(
    __dirname,
    [
        'src/index.ts'
    ],
    '',
    'public',
);