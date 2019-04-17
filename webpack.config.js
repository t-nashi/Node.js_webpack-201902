const webpack = require('webpack');																							// プラグインを利用するためにwebpackを読み込んでおく
const path = require('path');																										// output.pathに絶対パスを指定する必要があるため、pathモジュールを読み込んでおく
const TerserPlugin = require('terser-webpack-plugin');													// optimization.minimizerを上書きするために必要なプラグイン
const ExtractTextPlugin = require('extract-text-webpack-plugin');								// 
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');								// 
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");	// 
const CopyWebpackPlugin = require('copy-webpack-plugin');												// ファイルを構造を維持してコピー

module.exports = {
	// webpack4以降はモード指定しなければいけない（production | development | none）
	mode: 'development',

	// watchモードを有効にする（ファイルを監視して変更があったらビルドを再実行する機能 - 「webpack --watch」でもok）
	// watch: true,

	// エントリーポイント（モジュール間の依存関係の解析を開始する地点）
	entry: {
		'js/bundle.js': './src/js/app.js',
		'css/style.css': './src/scss/app.scss'
	},

	// 出力設定
	output: {
			// publicPath: '/',															// ブラウザからバンドルにアクセスする際のパス
			path: path.join(__dirname, 'public'),						// 出力先のパス（絶対パスを指定する必要がある）
			filename: '[name]'															// バンドルのファイル名。[name]の部分にはentryで指定したキーが入る
			// library: ['com', 'example'],									// パッケージ名を配列で表現する
			// libraryTarget: 'umd'
	},

	// developmentモードで有効になるdevtool（https://t-hiroyoshi.github.io/webpack-devtool/）
	// バンドル前の元ソースが何かわかる（Chrome開発者ツールの「Source」タブ - 「webpack://配下にオリジナルソースが表示される ）
	devtool: 'source-map',

	// productionモードで有効になるoptimization.minimizerを上書きする
	optimization: {
		minimizer: [
			// JavaScript の minify を行う
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: true												// console記述を無くす
					}
				}
			}),
			// CSS の minify を行う
			new OptimizeCSSAssetsPlugin()
		]
	},

	// ローダーの設定
	module: {
		rules: [
			// js
			{
				// ローダーの処理対象ファイル
				test: /\.js$/,
				// ローダーの処理対象から外すディレクトリ
				exclude: /node_modules/,
				use: [
					{
						// 利用するローダー
						loader: 'babel-loader',
						options: {
							presets: [[
								'@babel/preset-env',
								{
									modules: false
								}
							]]
						}
					}
				]
			},
			// scss
			{
				test: /\.scss$/, // 対象となるファイルの拡張子
				use: ExtractTextPlugin.extract({
					use: [ // 処理を後ろから順に適用

						// linkタグに出力する機能
						// 'style-loader',

						// CSSをバンドルするための機能
						{
							loader: 'css-loader',
							options: {
								url: true,							// true … dataURI、 false … URL参照
								sourceMap: true,				// ソースマップの利用有無

								// 0 => no loaders (default);
								// 1 => postcss-loader;
								// 2 => postcss-loader, sass-loader
								importLoaders: 2
							},
						},

						// PostCSSのための設定
						{
							loader: 'postcss-loader',
							options: {
								// PostCSS側でもソースマップを有効にする
								sourceMap: true,
								plugins: [
									// cssのminify化（minify）
									// require('cssnano')({
									// 	preset: 'default',
									// }),

									// Autoprefixerを有効化、ベンダープレフィックスを自動付与する
									require('autoprefixer')({
										grid: true
										// browsers: ['IE 11', 'last 2 versions']
									})
								]
							},
						},

						// Sassをバンドルするための機能
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true,				// ソースマップの利用有無
							}
						}
					]
				}),
			},
			// img
			{
				// 対象となるファイルの拡張子
				test: /\.(gif|png|jpg|eot|wof|woff|woff2|ttf|svg)$/,
				// test: /\.(jpe?g|png|gif|svg|ico)(\?.+)?$/, // クエリパラメータが付いていた場合でもファイルを対象にする
				use: {
					// 画像をBase64として取り込む（css-loaderのoption - url: trueと連動？）
					loader: 'url-loader',
					options: {
							// limitのbyte数以下はBase64化、以上は画像参照 ※file-loaderが必要
							limit: 8192,
							name: '[name].[ext]',
							// outputPath : 'images/',
							publicPath : function(path){
								return '../images/' + path;
							}
					}
				}
			},

			// eslint-loaderで構文チェックする際に有効（.eslintrcが設定ファイル）
			// {
			// 	// enforce: 'pre'を指定することによって
			// 	// enforce: 'pre'がついていないローダーより早く処理が実行される
			// 	// 今回はbabel-loaderで変換する前にコードを検証したいため、指定が必要
			// 	enforce: 'pre',
			// 	test: /\.js$/,
			// 	exclude: /node_modules/,
			// 	loader: 'eslint-loader'
			// }
		]
	},

	// webpack-dev-server用設定（browsersyncがあれば別に用無し？）
	devServer: {
			open: true,																			// ブラウザを自動で開く
			openPage: 'index.html',													// 自動で指定したページを開く
			contentBase: path.join(__dirname, 'public'),		// HTML等コンテンツのルートディレクトリ
			watchContentBase: true,													// コンテンツの変更監視をする
			port: 3000,																			// ポート番号
	},

	// プラグインの設定
	plugins: [

		new ExtractTextPlugin('[name]'),
		// new CopyWebpackPlugin([{from: './public'}]),
		// ファイルを構造を維持してコピー
		new CopyWebpackPlugin(
			[{
				from: '',
				to: 'images/',
				ignore: [
					'*.psd',
					'datauri/**/*'
				]
			}],
			{ context: 'src/images' }
		),



		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery'
		}),

		// browsersync設定（$ npm run webpack --watchの時に有効）
		new BrowserSyncPlugin({
				host: 'localhost',
				port: 3000,
				tunnel: false,
				server: {
					baseDir: ['./public/'],
				},
				files: [
						'./public/*'
				],

				// target,
				// open: config.open,
				// proxyUrl: config.proxyUrl,
				// watch: config.watch,
				// delay: 500,
		})
	]

};
