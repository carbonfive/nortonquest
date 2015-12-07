var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var autoprefixer = require('autoprefixer');

var cssPlugin = new ExtractTextPlugin("stylesheets/[name].css", { allChunks: true });

var config = {
  entry: {
    application: ['./src/stylesheets/application.scss'],
  },

  output: {
    filename: '[name].js',
    path: './lib/',
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.config.js']
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
      { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!postcss-loader") },
      { test: /\.scss$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!postcss-loader!sass") }
    ],
  },
  postcss: function () {
    return [autoprefixer,];
  },
  plugins: [
    cssPlugin,
  ],
  devtool: 'source-map',
}

if (process.env.NODE_ENV == "production") {
  config.plugins = [
    new webpack.optimize.DedupePlugin(),
    cssPlugin,
    new webpack.optimize.UglifyJsPlugin({minimize: true}),
  ];
}

module.exports = config;
