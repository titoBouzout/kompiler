on_bundle_done_notification = () => {}

promise(async function build() {
	if (!(await exists(project + 'package.json'))) {
		return
	}

	if (!options.builds || !Array.isArray(options.builds)) {
		return
	}

	const rollup = require('rollup')
	const resolve =
		require('@rollup/plugin-node-resolve').default || require('@rollup/plugin-node-resolve')
	const alias = require('@rollup/plugin-alias').default || require('@rollup/plugin-alias')
	const multi = require('@rollup/plugin-multi-entry')
	const replace = require('@rollup/plugin-replace')
	const babel = require('@rollup/plugin-babel').default || require('@rollup/plugin-babel')

	const terser = require('rollup-plugin-terser')
	const css = require('rollup-plugin-postcss')
	const commonjs = require('@rollup/plugin-commonjs')

	const cssimports = require('postcss-import')
	const jsonimport = require('@rollup/plugin-json')

	const autorefresh = await read(compiler + 'lib/autoreload-client.js')

	let consoleFormatting =
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

	// for notifying bundles are done
	let refreshTimeoutAll = false

	for (let build of options.builds) {
		// modules

		let root = dirname(build.input[0]) + '/'
		let modules = []

		// entry modules
		if (await exists(root + 'node_modules')) modules.push(root + 'node_modules')

		// globals modules
		if (await exists(process.env.AppData + '/npm/node_modules'))
			modules.push(normalize(process.env.AppData + '/npm/node_modules'))

		// handle error messages
		let errored = ''
		function on_error(event) {
			console.log()
			if (event.filename) warning(relative(event.filename) + '\n')
			else if (event.loc) warning(relative(event.loc.file) + '\n')
			else if (event.importer) warning(relative(event.importer) + '\n')
			else if (
				event.code !== 'UNRESOLVED_IMPORT' &&
				event.code !== 'PLUGIN_ERROR' &&
				event.code !== 'ENOENT'
			)
				console.log(event)
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

			build.wss.clients.forEach(function (client) {
				client.send(errored)
			})
		}
		build.wss.on('connection', function connection(ws) {
			if (errored !== '') ws.send(errored)
		})

		// building
		let babel_options = build.babel || {}

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
		if (build.watch && build.watch.length) {
			for (let fileOrFolder of build.watch) {
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

		let watcher = rollup.watch({
			input: build.input,
			/*experimentalCacheExpiry: 0,
			cache: true,*/
			treeshake: build.minified ? true : false,
			plugins: [
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
				replace({
					values: {
						'process.env.NODE_ENV': build.minified
							? JSON.stringify('production')
							: JSON.stringify('development'),
						'"_DX_DEV_"': build.minified ? false : true,
						"'_DX_DEV_'": build.minified ? false : true,
						'"__DEV__"': build.minified ? false : true,
						"'__DEV__'": build.minified ? false : true,
						__DATE__: () => Date.now(),
						__VERSION__: () => {
							try {
								return require(project + '/package.json').version
							} catch (e) {
								return 1
							}
						},
					},
					preventAssignment: true,
				}),
				resolve({
					jsnext: true,
					browser: true,
					moduleDirectories: modules,
					rootDir: root /*,
					cache: false,*/,
				}),
				css({
					modules: build.cssModules === false ? false : true,
					plugins: [cssimports()],
					extract: true,
					minimize: true,
					sourceMap: true,
				}),
				babel({
					cwd: root,
					...babel_options,
				}),
				// this is needed for component that arent es6
				commonjs({
					//exclude: './node_modules/**',
				}),
				jsonimport(),
				build.minified ? terser.terser() : null,
			],
			context: 'window',
			output: [
				{
					file: build.output,
					intro: function () {
						return autorefresh
					},
					sourcemap: true,
					sourcemapExcludeSources: true,
					format: 'iife',
				},
			],
			onwarn: function (event) {
				switch (event.code) {
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
					subtitle('Compiling ' + build.output + ' done in ' + fixed(event.duration / 1000) + 's')
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
