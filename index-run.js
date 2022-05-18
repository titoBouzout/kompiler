#!/usr/bin/env node

/*console.clear()*/

// setup

require('events').EventEmitter.prototype.defaultMaxListeners = 0
require('events').EventEmitter.prototype.setMaxListeners(0)
process.setMaxListeners(0)

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

// lib

require('./lib/@index.js')
require('./lib/exec.js')
require('./lib/files.js')
require('./lib/db.js')
require('./lib/images.js')
require('./lib/logs.js')
require('./lib/watch.js')

// start

args = process.argv.slice(2).join('')
project = normalize(process.cwd()) + '/'
compiler = normalize(__dirname) + '/'

// options

require('./lib/options.js').then(function () {
	let s =
		'kompiler - ' +
		(options.site && options.site.domain ? options.site.domain + ' - ' + project : project) +
		' '
	title(s)
	// npm changes the process title
	setInterval(() => {
		process.title = s
	}, 10000)

	yellow('[1] Browser - [2] Upload')

	// features

	require('./features/build.js')
	require('./features/socket.js')
	require('./features/serve.js')
	require('./features/autoupdate.js')
	require('./features/autorefresh.js')

	require('./features/git.js')
	require('./features/optimize-images.js')
	require('./features/npm.js')

	require('./features/publish.js')
})
