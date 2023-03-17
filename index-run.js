#!/usr/bin/env node

/*console.clear()*/

// setup

require('events').EventEmitter.prototype.defaultMaxListeners = 0
require('events').EventEmitter.prototype.setMaxListeners(0)
process.setMaxListeners(0)

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

// kill the process when asked

process.on('message', async m => {
	if (m === 'EXIT_QUICK') {
		process.exit()
	}
})

// lib

require('./lib/@index.js')
require('./lib/exec.js')
require('./lib/files.js')

// start

args = process.argv.slice(2).join('')
project = normalize(process.cwd()) + '/'
compiler = normalize(__dirname) + '/'

// name

let options = {}
;(async function () {
	if (await exists(project + 'package.json')) {
		try {
			options = require(project + 'package.json')
		} catch (e) {}
	}
})()

// more libs

require('./lib/db.js')
require('./lib/logs.js')
require('./lib/watch.js')

// options

require('./lib/options.js').then(function () {
	let shortcuts =
		' [1] Diff - [2] Browser - [3] Publish - [Type + Enter] Commit - [ENTER] Pull/Push'
	let s = 'kompiler - ' + (options.name ? options.name + ' - ' + project : project)

	title(s)
	// npm changes the process title
	setInterval(() => {
		process.title = s + ' -' + shortcuts
	}, 1000)

	yellow(shortcuts)

	// features

	require('./features/serve.js')
	require('./features/build.js')
	require('./features/node.js')
	require('./features/autoupdate.js')

	require('./features/git.js')
	require('./features/npm.js')

	require('./features/publish.js')
})
