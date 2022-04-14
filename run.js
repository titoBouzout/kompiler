#!/usr/bin/env node

console.clear()

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
require('./lib/kill.js')
require('./lib/logs.js')
require('./lib/watch.js')

// start

args = process.argv.slice(2).join('')
project = normalize(process.cwd()) + '/'
compiler = normalize(__dirname) + '/'

// options

require('./lib/options.js').then(function () {
	setInterval(() => {
		title(
			'kompiler - ' +
				(options.site && options.site.domain ? options.site.domain + ' - ' + project : project) +
				' ',
		)
	}, 30000)

	blue('[1] Changes - [2] Save - [3] Upload - [4] Localhost - [5] Reset')

	// features

	require('./features/autoupdate.js')
	require('./features/build.js')
	require('./features/serve.js')
	require('./features/socket.js')
	require('./features/autorefresh.js')
	require('./features/optimize-images.js')

	require('./features/git-status.js')
	require('./features/npm.js')
})
