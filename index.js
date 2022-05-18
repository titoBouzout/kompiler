#!/usr/bin/env node

const childProcess = require('child_process')

console.clear()

require('./lib/@index.js')
require('./lib/files.js')
require('./lib/watch.js')

project = normalize(process.cwd()) + '/'
compiler = normalize(__dirname) + '/'

script = normalize(compiler + 'index-run.js')
json = normalize(project + 'package.json')

remove(project + 'norestart')

watch(null, compiler, restart)
watch(null, json, restart)

// aditional watch
;(async function () {
	if (await exists(json)) {
		let aditional_watch = require(json)
		if (aditional_watch && aditional_watch.kompiler && aditional_watch.kompiler.watch) {
			for (let to_watch of aditional_watch.kompiler.watch) {
				watch(null, to_watch, restart)
			}
		}
	}
})()

// restarts

let fork = false
let message = 'Starting'
let debug = false
async function restart(changed, action) {
	if (await exists(project + 'norestart')) {
		return
	}
	if (debug)
		console.log(
			'\n\x1b[36m' +
				message +
				' ' +
				script +
				', ' +
				action +
				' ' +
				changed +
				' - ' +
				new Date().toString() +
				'\x1b[0m\n',
		)
	if (fork) {
		fork.send('RESTART')
		fork.kill()
	}
	fork = childProcess.fork(script, { cwd: process.cwd() })
	fork.on('error', () => {
		if (!fork.exiting) {
			restart(script, 'onerror')
		}
	})

	message = 'Restarting'
}

restart(script, 'first time')

// for closing the cmd window as soon as possible
;['SIGTERM', 'SIGINT', 'SIGUSR2', 'SIGBREAK'].forEach(function (m) {
	process.on(m, function () {
		try {
			fork.exiting = true
			fork.send('RESTART')
			fork.kill()
		} catch (e) {}
		process.exit()
	})
})
