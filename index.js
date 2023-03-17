#!/usr/bin/env node

// console.clear()

require('./lib/@index.js')
require('./lib/files.js')
require('./lib/watch.js')
require('./lib/exec.js')

project = normalize(process.cwd()) + '/'
compiler = normalize(__dirname) + '/'

script = normalize(compiler + 'index-run.js')
json = normalize(project + 'package.json')

// prevents the compiler from restarting when bumping package.json version
remove(project + 'norestart')

watch(null, compiler, restart)
exists(json).then(function (result) {
	if (result) watch(null, json, restart)
})

// restarts

let fork = fork_script_with_restart(script, process.cwd())

async function restart(changed, action) {
	if (await exists(project + 'norestart')) {
		return
	}
	fork.restart('watch file changed')
}

// for closing the cmd window as soon as possible
;['SIGTERM', 'SIGINT', 'SIGUSR2', 'SIGBREAK'].forEach(function (m) {
	process.on(m, function () {
		process.exit()
	})
})
