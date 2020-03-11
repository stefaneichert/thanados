const path = require('path');
const Webpack = require('webpack');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
    context: __dirname,

    target: 'web',

    mode: 'production',

    devtool: 'source-map',

    entry: {
        'L.Control.HtmlLegend': './src/L.Control.HtmlLegend.js',
        'L.Control.HtmlLegend.css': './src/L.Control.HtmlLegend.css'
    },

    output: {
        path: path.resolve('dist'),
        filename: '[name].js',
        sourceMapFilename: '[name].js.map'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            }
        ]
    },

    optimization: {
        minimize: true
    },

    plugins: [
        new Webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new IgnoreEmitPlugin(/^.*css\.js.*$/),
        new MiniCssExtractPlugin({
            filename: '[name]',
        }),
        new OptimizeCSSAssetsPlugin()
    ]
};
