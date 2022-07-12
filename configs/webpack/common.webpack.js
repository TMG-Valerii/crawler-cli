const root = require('app-root-path');
const deepfreeze = require('deep-freeze');
const nodeExternals = require('webpack-node-externals');

module.exports = deepfreeze({
    mode: 'development',
    entry: root.resolve('src/index.ts'),
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
    },
    externals: [nodeExternals()]
})
