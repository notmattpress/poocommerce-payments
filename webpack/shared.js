/* eslint-disable */
const path = require( 'path' );
const { mapValues } = require( 'lodash' );
const { ProvidePlugin } = require( 'webpack' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const PooCommerceDependencyExtractionWebpackPlugin = require( '@poocommerce/dependency-extraction-webpack-plugin' );
const WebpackRTLPlugin = require( './webpack-rtl-plugin' );

module.exports = {
	entry: mapValues(
		{
			index: './client/index.js',
			settings: './client/settings/index.js',
			'blocks-checkout': './client/checkout/blocks/index.js',
			woopay: './client/checkout/woopay/index.js',
			'woopay-express-button':
				'./client/checkout/woopay/express-button/index.js',
			'woopay-direct-checkout':
				'./client/checkout/woopay/direct-checkout/index.js',
			cart: './client/cart/index.js',
			checkout: './client/checkout/classic/event-handlers.js',
			'express-checkout': './client/express-checkout/index.js',
			'subscription-edit-page': './client/subscription-edit-page.js',
			tos: './client/tos/index.tsx',
			'multi-currency': './includes/multi-currency/client/index.js',
			'multi-currency-switcher-block':
				'./includes/multi-currency/client/blocks/currency-switcher.js',
			'multi-currency-analytics':
				'./includes/multi-currency/client/analytics/index.js',
			order: './client/order/index.js',
			'subscriptions-empty-state':
				'./client/subscriptions-empty-state/index.js',
			'subscription-product-onboarding-modal':
				'./client/subscription-product-onboarding/modal.js',
			'subscription-product-onboarding-toast':
				'./client/subscription-product-onboarding/toast.js',
			'product-details': './client/product-details/index.js',
			'cart-block': './client/cart/blocks/index.js',
			'plugins-page': './client/plugins-page/index.js',
			'frontend-tracks': './client/frontend-tracks/index.js',
			success: './client/success/index.js',
		},
		// Override webpack public path dynamically on every entry.
		// Required for chunks loading to work on sites with JS concatenation.
		( entry ) => [ './client/public-path.js', entry ]
	),
	output: {
		clean: true,
		chunkFilename: 'chunks/[name].js?ver=[chunkhash]',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [ 'babel-loader', 'ts-loader' ],
				exclude: /node_modules/,
			},
			{
				test: /\.jsx?$/,
				use: [ 'babel-loader' ],
				exclude: /node_modules/,
			},
			{
				test: /\.(scss|css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								includePaths: [
									'client/stylesheets/abstracts',
								],
							},
							additionalData:
								'@import "node_modules/@wordpress/base-styles/_colors.scss"; ' +
								'@import "node_modules/@wordpress/base-styles/_colors.native.scss"; ' +
								'@import "node_modules/@wordpress/base-styles/_variables.scss"; ' +
								'@import "node_modules/@wordpress/base-styles/_mixins.scss"; ' +
								'@import "node_modules/@wordpress/base-styles/_breakpoints.scss"; ' +
								'@import "node_modules/@wordpress/base-styles/_animations.scss"; ' +
								'@import "node_modules/@wordpress/base-styles/_z-index.scss"; ' +
								'@import "_colors"; ' +
								'@import "_breakpoints"; ' +
								'@import "_mixins"; ' +
								'@import "_variables"; ',
						},
					},
				],
			},
			{
				test: /\.(svg|png)$/,
				exclude: [ /node_modules/ ],
				oneOf: [
					{
						resourceQuery: /asset/,
						type: 'asset/resource',
						generator: {
							emit: false,
							filename: '../[file]?ver=[hash]',
						},
					},
					{
						type: 'asset/inline',
					},
				],
			},
		],
	},
	resolve: {
		extensions: [ '.ts', '.tsx', '.json', '.js', '.jsx' ],
		modules: [
			path.join( process.cwd(), 'client' ),
			path.join( process.cwd(), 'includes/multi-currency/client' ),
			'node_modules',
		],
		alias: {
			assets: path.resolve( process.cwd(), 'assets' ),
			'multi-currency': path.resolve(
				process.cwd(),
				'includes/multi-currency/client'
			),
			wcpay: path.resolve( process.cwd(), 'client' ),
			iti: path.resolve(
				process.cwd(),
				'node_modules/intl-tel-input/build/js'
			),
		},
		fallback: {
			crypto: require.resolve( 'crypto-browserify' ),
			stream: require.resolve( 'stream-browserify' ),
			util: require.resolve( 'util' ),
		},
	},
	plugins: [
		new ProvidePlugin( {
			process: 'process/browser.js',
		} ),
		new MiniCssExtractPlugin( { filename: '[name].css' } ),
		new WebpackRTLPlugin( {
			filenameSuffix: '-rtl.css',
		} ),
		new PooCommerceDependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			requestToExternal( request ) {
				switch ( request ) {
					case '@wordpress/components':
						return null;
					case 'wp-mediaelement':
						return [ 'wp', 'mediaelement' ];
				}
			},
			requestToHandle( request ) {
				switch ( request ) {
					case '@wordpress/components':
						return null;
					case 'wp-mediaelement':
						return 'wp-mediaelement';
				}
			},
		} ),
	],
	resolveLoader: {
		modules: [
			path.resolve( process.cwd(), 'node_modules' ),
			path.resolve( process.cwd(), 'webpack/loaders' ),
		],
	},
};
