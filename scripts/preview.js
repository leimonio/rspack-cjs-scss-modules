const rspack = require('@rspack/core');
const { RspackDevServer: rspackDevServer } = require('@rspack/dev-server');
const config = require('../rsbuild.config');

async function run() {
    const compiler = rspack(config);
    const devServer = new rspackDevServer(config.devServer, compiler)
    // console.log(devServer)
    await devServer.start();
}

run();