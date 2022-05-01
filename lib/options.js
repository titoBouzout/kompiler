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
		title('Kompíler Setup')

		let kompiler = {}

		kompiler.site = {}
		kompiler.site.domain = prompt('What is the site domain? [example.net]') || 'example.net'
		kompiler.site.port = +(prompt('What is the site port for localhost? [1111]') || '1111')

		kompiler.folders = {}
		kompiler.folders.client =
			(prompt('Path to the client folder? [client]') || 'client')
				.replace(/\\+$/g, '')
				.replace(/\/+$/g, '') + '/'
		kompiler.folders.server =
			(prompt('Path to the server folder? [server]') || 'server')
				.replace(/\\+$/g, '')
				.replace(/\/+$/g, '') + '/'

		kompiler.autoupdates = [['http://example.net/jquery.js', 'client/js/jquery.js']]

		let build = {}
		build.input = [prompt('Path to client js "input file"? [client/index.js]') || 'client/index.js']
		build.output =
			prompt('Path to client js "output file"? [client/index.m.js]') || 'client/index.m.js'

		build.minified = false
		build.babel = {
			'presets': ['solid'],
		}
		kompiler.builds = [build]

		let socket = {}
		socket.input = [
			prompt('Path to socket js "input file"? [socket/index.js]') || 'socket/index.js',
		]

		socket.es6 = true

		kompiler.socket = socket

		if (!options.prettier)
			options.prettier = {
				'printWidth': 100,
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

		kompiler.folders.client = kompiler.folders.client.replace(/\\+$/g, '').replace(/\/+$/g, '')
		kompiler.folders.server = kompiler.folders.server.replace(/\\+$/g, '').replace(/\/+$/g, '')

		if (!(await exists(kompiler.folders.client + '/index.html')))
			write(
				kompiler.folders.client + '/index.html',
				`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset='utf-8'>

	<title>App</title>

	<link rel='stylesheet' href='/index.m.css'>

	<script defer src='/index.m.js'></script>
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

		options.kompiler = kompiler
		await write(project + 'package.json', JSON.stringify(options, null, 2))
	}

	options.kompiler.folders.client =
		options.kompiler.folders.client.replace(/\\+$/g, '').replace(/\/+$/g, '') + '/'
	options.kompiler.folders.server =
		options.kompiler.folders.server.replace(/\\+$/g, '').replace(/\/+$/g, '') + '/'

	options = options.kompiler
	return options
})
