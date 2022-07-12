const root = require('app-root-path');
const common = require('./common.webpack');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
    ...common,
    plugins: [
        new WebpackNotifierPlugin({ title: root.require('package.json').name }),
    ]
}