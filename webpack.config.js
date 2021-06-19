var debug = false;
var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: __dirname,
    devtool: debug ? "inline-sourcemap" : false,
    entry: {
        react: [
            path.resolve(__dirname, 'webapp/management/dispatch/react/bookings.js'),
            path.resolve(__dirname, 'webapp/management/dispatch/react/bookings.directive.js'),
            path.resolve(__dirname, 'webapp/management/dispatch/react/drivers.js'),
            path.resolve(__dirname, 'webapp/management/dispatch/react/drivers.directive.js')
        ]
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'stage-0', 'react']
            }
        }]
    },
    output: {
        path: path.resolve(__dirname, 'webapp/management/dispatch/react/'),
        publicPath: '/webapp/management/dispatch/react/',
        filename: "[name].min.js"
    },
    plugins: debug ? [] : [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack
        .optimize
        .DedupePlugin(),
        new webpack
        .optimize
        .OccurenceOrderPlugin(),
        new webpack
        .optimize
        .UglifyJsPlugin({ mangle: true, sourcemap: false })
    ]
};