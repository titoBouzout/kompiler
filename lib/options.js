module.exports = promise(async function () {
	if (await exists(project + 'package.json')) {
		try {
			options = require(project + 'package.json')
		} catch (e) {
			options = {}
		}
	} else {
		options = {}
	}

	if (!options.kompiler) {
		let kompiler = {}

		kompiler.node = [
			{
				input: 'socket/index.js',
				legacyToEs6: false,
				watch: [],
			},
		]

		kompiler.autoupdates = [['http://example.net/jquery.js', 'client/js/jquery.js']]

		let build = {}
		build.input = ['client/index.js']
		build.output = 'client/dist/index.m.js'
		build.minified = false
		build.express = false
		build.babel = {
			presets: ['solid'],
		}
		build.watch = []

		kompiler.builds = [build]

		if (!options.prettier)
			options.prettier = {
				printWidth: 90,
				useTabs: true,
				semi: false,
				singleQuote: true,
				quoteProps: 'as-needed',
				jsxSingleQuote: false,
				trailingComma: 'all',
				bracketSpacing: true,
				bracketSameLine: false,
				arrowParens: 'avoid',

				proseWrap: 'never',
				endOfLine: 'lf',
			}

		options.kompiler = kompiler
		await write(project + 'package.json', JSON.stringify(options, null, 2))
	}

	options = options.kompiler

	return options
})
