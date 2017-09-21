const path = require('path')
const webpack = require('webpack')
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'

const plugins = []
const externals = []

if (isProduction) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({minimize: true}),
    new UnminifiedWebpackPlugin()
  )
  externals.push('jquery')
}

module.exports = {
  devtool: 'source-map',
  entry: ['./src/histo'],
  output: {
    path: path.resolve('./build'),
    filename: 'histo.min.js',
    library: 'Histo',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: [process.cwd(), 'node_modules'],
    extensions: ['.js', '.coffee']
  },
  module: {
    loaders: [
      {
        test: /\.coffee$/,
        loaders: ['coffee-loader']
      }
    ]
  },
  plugins: plugins,
  externals: externals
}
