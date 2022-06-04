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
		kompiler.port = randomBetween(1025, 65534)
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

		if (!(await exists(project + 'client/index.html')))
			write(
				project + 'client/index.html',
				`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset='utf-8'>

	<title>App</title>

	<link rel='stylesheet' href='/dist/index.m.css'>

	<script defer src='/dist/index.m.js'></script>
</head>

<body>
</body>
</html>
`,
			)

		if (!(await exists(kompiler.builds[0].input[0]))) {
			write(
				kompiler.builds[0].input[0],
				`import { render } from 'solid-js/web'

function App(){
	return <div>hello world</div>
}

render(
	() => (
			<App />
	),
	document.body,
)
`,
			)
		}
		if (!(await exists(kompiler.builds[0].output))) write(kompiler.builds[0].output, '')
		if (!(await exists(kompiler.builds[0].output.replace('.js', '.css'))))
			write(kompiler.builds[0].output.replace('.js', '.css'), '')

		options.kompiler = kompiler
		await write(project + 'package.json', JSON.stringify(options, null, 2))
	}

	options = options.kompiler
	return options
})
