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
	const multi = require('@rollup/plugin-multi-entry')
	const replace = require('@rollup/plugin-replace')
	const babel = require('@rollup/plugin-babel').default || require('@rollup/plugin-babel')

	const terser = require('rollup-plugin-terser')
	const css = require('rollup-plugin-postcss')
	const commonjs = require('@rollup/plugin-commonjs')
	const cssimports = require('postcss-import')
	const jsonimport = require('@rollup/plugin-json')

	let autorefresh = await read(compiler + 'features/autoreload-client.js')

	let modules = []

	if (await exists(project + options.folders.client + 'node_modules'))
		modules.push(project + options.folders.client + 'node_modules')

	if (await exists(project + 'node_modules')) modules.push(project + 'node_modules')

	if (await exists(project + options.folders.server + 'node_modules'))
		modules.push(project + options.folders.server + 'node_modules')

	if (await exists(project + options.folders.client)) modules.push(project + options.folders.client)

	modules.push(normalize(__dirname + '/../node_modules/'))
	modules.push(normalize(process.env.AppData + '/npm/node_modules'))
	modules.push(normalize(process.env.AppData + '/npm/node_modules'))

	let errored = false
	function on_error(event) {
		console.log()
		if (event.filename) warning(relative(event.filename) + '\n')
		else if (event.loc) warning(relative(event.loc.file) + '\n')
		else if (event.importer) warning(relative(event.importer) + '\n')
		else console.log(event)
		console.log(event.message)
		event.message && console.log()
		event.frame && console.log(event.frame) && console.log()
		errored = event
	}

	for (let build of options.builds) {
		let babel_options = build.babel || {}

		babel_options.presets = babel_options.presets || []
		if (babel_options.presets.indexOf('solid') === -1) {
			babel_options.presets.push('solid')
		}

		babel_options.babelHelpers = babel_options.babelHelpers || 'bundled'
		if (babel_options.presets) {
			for (let value of babel_options.presets) {
				if (await exists(project + 'node_modules/' + value[0]))
					value[0] = project + 'node_modules/' + value[0]
				else if (await exists(project + options.folders.client + 'node_modules/' + value[0]))
					value[0] = project + options.folders.client + 'node_modules/' + value[0]
				else if (await exists(compiler + 'node_modules/' + value[0]))
					value[0] = compiler + 'node_modules/' + value[0]
			}
		} else {
			babel_options.presets = []
		}

		if (babel_options.plugins) {
			for (let value of babel_options.plugins) {
				if (await exists(project + 'node_modules/' + value[0]))
					value[0] = project + 'node_modules/' + value[0]
				else if (await exists(project + options.folders.client + 'node_modules/' + value[0]))
					value[0] = project + options.folders.client + 'node_modules/' + value[0]
				else if (await exists(compiler + 'node_modules/' + value[0]))
					value[0] = compiler + 'node_modules/' + value[0]
			}
		} else {
			babel_options.plugins = []
		}

		let watcher = rollup.watch({
			input: build.input,
			experimentalCacheExpiry: 1,
			cache: false,
			// preprocess: [asMarkupPreprocessor([sveltePreprocess()]), cssModules()],

			plugins: [
				multi(),
				//includePaths({ paths: [...modules, project + options.folders.client, './'] }),
				/*replace({
					'process.env.NODE_ENV': JSON.stringify('production'),
					'preventAssignment': true,
				}),*/
				resolve({
					jsnext: true,
					browser: true,
					moduleDirectories: ['./', ...modules, project + options.folders.client],
					rootDir: project,
					// dedupe: ['svelte'],
				}),
				babel({
					cwd: project + options.folders.client,
					...babel_options,
				}),
				css({
					modules: true,
					plugins: [cssimports()],
					extract: true,
					minimize: true,
					sourceMap: true, //'inline',
				}),

				// this is needed for component that arent es6
				commonjs({
					//exclude: './node_modules/**',
				}),
				jsonimport(),
				build.minified ? terser.terser({}) : null,
			],
			context: 'window',
			output: [
				{
					file: build.output,
					intro: function () {
						return autorefresh
					},
					sourcemap: true, //build.sourceMap ? true : false,
					sourcemapExcludeSources: false,
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

		let updateIndex = []
		watcher.on('event', async function (event) {
			switch (event.code) {
				case 'START':
					break
				case 'BUNDLE_END':
					if (errored) {
						wss.clients.forEach(function (client) {
							if (errored.filename && errored.start.line && errored.message && errored.frame)
								client.send(
									JSON.stringify({
										file: errored.filename,
										line: errored.start.line,
										message: errored.message,
										code: errored.frame,
									}),
								)
						})
						errored = false
					}
					subtitle('Compiling ' + build.output + ' done in ' + fixed(event.duration / 1000) + 's')

					event.result.close()
					updateIndex.push(async function () {
						let index = await read(project + options.folders.client + 'index.html')
						for (let file of event.output) {
							let hash = await hash_file(file)
							index = index.replace(
								new RegExp('(' + basename(file) + ')[^"\']*(["\'])'),
								'$1?' + hash.substr(0, 12) + '$2',
							)

							let css = file.replace('.js', '.css')
							if (await exists(css)) {
								let hash = await hash_file(css)
								index = index.replace(
									new RegExp('(' + basename(css) + ')[^"\']*(["\'])'),
									'$1?' + hash.substr(0, 12) + '$2',
								)
							}
						}
						await write(project + options.folders.client + 'index.html', index)
						//log('Wrote index.html')
						if (updateIndex.length) updateIndex.pop()()
					})
					if (updateIndex.length === 1) updateIndex.pop()()

					break
				case 'BUNDLE_START':
				case 'END':
					break
				case 'ERROR':
					on_error(event.error)
					break
			}
		})
	}
})
