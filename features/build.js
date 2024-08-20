on_bundle_done_notification = () => {}
__IS_LOCALHOST__ = true
promise(async function build() {
	if (!(await exists(project + 'package.json'))) {
		return
	}

	if (!options.builds || !Array.isArray(options.builds)) {
		return
	}

	const rollup = require('rollup')
	const resolve =
		require('@rollup/plugin-node-resolve').default ||
		require('@rollup/plugin-node-resolve')
	const alias = require('@rollup/plugin-alias').default || require('@rollup/plugin-alias')
	const multi = require('@rollup/plugin-multi-entry')
	const replace = require('@rollup/plugin-replace')
	const babel = require('@rollup/plugin-babel').default || require('@rollup/plugin-babel')

	const terser = require('@rollup/plugin-terser')
	const css = require('rollup-plugin-postcss')
	const commonjs = require('@rollup/plugin-commonjs')

	const cssimports = require('postcss-import')
	const jsonimport = require('@rollup/plugin-json')

	const autorefresh = await read(compiler + 'lib/autoreload-client.js')

	let consoleFormatting =
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

	// for notifying bundles are done
	let refreshTimeoutAll = false

	const circular = {}

	for (let build of options.builds) {
		// modules

		let root = dirname(build.input[0]) + '/'
		let modules = []

		// entry modules
		if (await exists(root + 'node_modules')) modules.push(root + 'node_modules')

		// globals modules
		if (await exists(process.env.AppData + '/npm/node_modules'))
			modules.push(normalize(process.env.AppData + '/npm/node_modules'))

		modules.push('./node_modules')

		// handle error messages
		let errored = ''
		function on_error(event) {
			// console.log(event)

			if (event.filename) warning(relative(event.filename) + '\n')
			else if (event.loc) warning(relative(event.loc.file) + '\n')
			else if (event.importer) warning(relative(event.importer) + '\n')
			else if (event.code === 'CIRCULAR_DEPENDENCY') {
				const key = JSON.stringify(event.ids)
				if (!circular[key]) {
					circular[key] = true
					console.warn('CIRCULAR_DEPENDENCY', event.ids)
				}
				return
			}
			error(event.message)
			event.message && console.log()
			event.frame && console.log(event.frame) && console.log()

			if (event.filename && event.start.line && event.message && event.frame) {
				errored = JSON.stringify({
					file: event.filename,
					line: event.start.line,
					message: (event.message || '').replace(consoleFormatting, '') || undefined,
					frame: (event.frame || '').replace(consoleFormatting, '') || undefined,
				})
			} else {
				errored = JSON.stringify({
					error: (event.message || '').replace(consoleFormatting, '') || undefined,
					frame: (event.frame || '').replace(consoleFormatting, '') || undefined,
				})
			}

			if (build.wss)
				build.wss.clients.forEach(function (client) {
					client.send(errored)
				})
		}
		if (build.wss)
			build.wss.on('connection', function connection(ws) {
				if (errored !== '') ws.send(errored)
			})

		// building
		let babel_options = build.babel || options.babel || {}

		babel_options.presets = babel_options.presets || []

		babel_options.babelHelpers = babel_options.babelHelpers || 'bundled'
		if (babel_options.presets) {
			for (let i in babel_options.presets) {
				let value = babel_options.presets[i]
				let location = value
				if (Array.isArray(value)) {
					location = value[0]
				}
				if (await exists(root + 'node_modules/' + location))
					location = root + 'node_modules/' + location
				else if (await exists(root + 'node_modules/babel-preset-' + location))
					location = root + 'node_modules/babel-preset-' + location

				if (Array.isArray(value)) {
					babel_options.presets[i][0] = location
				} else {
					babel_options.presets[i] = location
				}
			}
		}

		babel_options.plugins = babel_options.plugins || []
		if (babel_options.plugins) {
			for (let value of babel_options.plugins) {
				if (await exists(root + 'node_modules/' + value[0]))
					value[0] = root + 'node_modules/' + value[0]
			}
		}
		let aliases = []

		if (await exists(root + 'jsconfig.json')) {
			let jsconfig = require(root + 'jsconfig.json')
			if (jsconfig.compilerOptions && jsconfig.compilerOptions.paths) {
				for (let key of Object.keys(jsconfig.compilerOptions.paths)) {
					aliases.push({
						find: key.replace(/\*/, '').replace(/\//, ''),
						replacement: root + jsconfig.compilerOptions.paths[key][0].replace(/\*/, ''),
					})
				}
			}
		}

		// watch packages json
		let aditional = {}
		let packagesJson = await find(project, 'package.json')

		for (let package of packagesJson) {
			aditional[package] = true
		}

		// aditional files or folders to watch
		const toWatch = build.watch || options.watch
		if (toWatch && toWatch.length) {
			for (let fileOrFolder of toWatch) {
				if (is_directory(fileOrFolder)) {
					let addFiles = async function () {
						let files = await list(fileOrFolder)
						for (const file of files) {
							if (
								(file.endsWith('js') || file.endsWith('json') || file.endsWith('ts')) &&
								file.indexOf('data/') === -1 &&
								file.indexOf('.vscode/') === -1 &&
								file.indexOf('.sqlite') === -1 &&
								file.indexOf('node_modules/') === -1 &&
								file.indexOf('.cache/') === -1
							)
								aditional[file] = true
						}
					}
					await addFiles()
					watch(null, fileOrFolder, addFiles, true)
				} else {
					aditional[fileOrFolder] = true
				}
			}
		}

		const extensions = ['.js', '.ts', '.jsx', '.tsx']

		const isMulti = !/\/[^\/]+\.[^\/]+$/.test(build.output)

		let watcher = rollup.watch({
			input: build.input,
			/*experimentalCacheExpiry: 0,
			cache: true,*/
			treeshake: build.treeshake === undefined ? 'recommended' : build.treeshake,
			// IT BREAKS SOURCEMAPS! preserveSymlinks: true,
			plugins: [
				replace({
					values: {
						'process.env.NODE_ENV': () =>
							build.minified || !__IS_LOCALHOST__
								? JSON.stringify('production')
								: JSON.stringify('development'),
						'"_DX_DEV_"': () =>
							build.minified || !__IS_LOCALHOST__ ? false : '"_DX_DEV_"',
						"'_DX_DEV_'": () =>
							build.minified || !__IS_LOCALHOST__ ? false : '"_DX_DEV_"',
						'"__DEV__"': () =>
							build.minified || !__IS_LOCALHOST__ ? false : '"__DEV__"',
						"'__DEV__'": () =>
							build.minified || !__IS_LOCALHOST__ ? false : '"__DEV__"',
						"'__IS_LOCALHOST__'": !build.minified ? true : false,
						'"__IS_LOCALHOST__"': !build.minified ? true : false,
						__DATE__: () => Date.now(),
						__VERSION__: () => JSON.parse(read_sync(project + 'package.json')).version,
					},
					preventAssignment: true,
					delimiters: ['', ''],
				}),
				alias({
					entries: aliases,
				}),
				{
					// watching aditional files
					buildStart(options) {
						for (const file of Object.keys(aditional)) this.addWatchFile(file)
					},
				},
				multi(),
				resolve({
					browser: true,
					modulePaths: modules,
					rootDir: root,
					// dedupe: ['solid'],
					// 	exportConditions: ['solid'],
					extensions,
					// IT BREAKS SOURCEMAPS! preserveSymlinks: true,
				}),
				css({
					plugins: [cssimports()],
					extract: true,
					minimize: true,
					sourceMap: true,
					autoModules: true,
				}),
				babel({
					// cwd: project,

					// cwd: project ,
					// exclude: 'node_modules/**',
					// include: ['./*'],
					compact: false,
					extensions,
					babelHelpers: 'bundled',
					...babel_options,
				}),
				// this is needed for component that arent es6
				// module interoperability
				commonjs({
					/*exclude: './node_modules/**',*/
					requireReturnsDefault: 'auto', // <---- this solves default issue
				}),
				jsonimport(),
				build.minified || !__IS_LOCALHOST__ ? terser() : null,
			],
			context: 'window',
			output: [
				{
					file: !isMulti ? build.output : undefined,
					dir: isMulti ? build.output : undefined,
					intro: function () {
						return build.root === undefined || build.root ? autorefresh : ''
					},
					sourcemap: build.sourcemap === undefined ? true : build.sourcemap,
					sourcemapExcludeSources: true,
					format: isMulti ? 'es' : build.format || 'iife',
					entryFileNames: `entry/[name].[ext]`,
					chunkFileNames: `chunk/[name].js`,
					assetFileNames: `asset/[name].[ext]`,
				},
			],

			onwarn: function (event) {
				switch (event.code) {
					case 'xxxx':
					case 'CIRCULAR_DEPENDENCY':
					case 'EMPTY_BUNDLE':
					case 'FILE_NAME_CONFLICT':
					case 'MISSING_NAME_OPTION_FOR_IIFE_EXPORT':
					case 'UNUSED_EXTERNAL_IMPORT':
						break
					default: {
						on_error(event)
					}
				}
			},

			...build.rollup,
		})

		let refreshTimeout = false
		watcher.on('event', function (event) {
			switch (event.code) {
				case 'START':
					clearTimeout(refreshTimeout)
					clearTimeout(refreshTimeoutAll)
					break
				case 'BUNDLE_START':
					break
				case 'BUNDLE_END':
					errored = ''
					erroredDuplicates = {}
					subtitle(
						'Compiling ' +
							build.output +
							' done in ' +
							fixed(event.duration / 1000) +
							's',
					)
					event.result.close()
					break
				case 'ERROR':
					on_error(event.error)
					break
				case 'END':
					clearTimeout(refreshTimeout)
					clearTimeout(refreshTimeoutAll)
					refreshTimeout = setTimeout(() => {
						if (build.on_bundle_done) build.on_bundle_done()
					}, 100)
					refreshTimeoutAll = setTimeout(on_bundle_done_notification, 100)
					break
			}
		})
	}
})
