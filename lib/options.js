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

		kompiler.domain = 'localhost'
		kompiler.port = random(1025, 65534)
		kompiler.express = false
		kompiler.es6 = true
		kompiler.socket = ''

		kompiler.autoupdates = [['http://example.net/jquery.js', 'client/js/jquery.js']]

		let build = {}
		build.input = ['client/index.js']
		build.output = 'client/dist/index.m.js'
		build.minified = false
		build.babel = {
			'presets': ['solid'],
		}
		kompiler.builds = [build]

		if (!options.prettier)
			options.prettier = {
				'printWidth': 90,
				'useTabs': true,
				'semi': false,
				'singleQuote': true,
				'jsxSingleQuote': false,
				'trailingComma': 'all',
				'bracketSpacing': true,
				'jsxBracketSameLine': false,
				'arrowParens': 'avoid',
				'quoteProps': 'preserve',
				'proseWrap': 'preserve',
			}

		options.kompiler = kompiler
		await write(project + 'package.json', JSON.stringify(options, null, 2))
	}

	options = options.kompiler
	return options
})
