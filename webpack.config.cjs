const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

const license = fs.readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf8');

module.exports = {
	mode: 'production',
	entry: './src/zeto.js',
	output: {
		filename: 'zeto.js',
		path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'window',
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: false,
			}),
		],
	},
	plugins: [
		new webpack.BannerPlugin({
			banner: license,
		}),
	],
};
