#!/usr/bin/env node

const fs = require('fs')
const childProcess = require('child_process')
const path = require('path')
const util = require('util')
const glob = require('glob')

const _access = util.promisify(fs.access)

console.clear()

// when the compiler starts stuff is reported as changed when its only "read"
let shouldRestart = false

function normalize(f) {
	return path.resolve(f).replace(/\\/g, '/')
}

function is_directory(f) {
	try {
		return fs.lstatSync(f).isDirectory()
	} catch (e) {
		return false
	}
}
function exists(f) {
	return _access(f, fs.constants.F_OK)
		.then(err => {
			return true
		})
		.catch(err => {
			return false
		})
}

function watch(w, cb) {
	let as_directory = false

	function _(a, f) {
		if (!f) return
		if (as_directory) {
			f = normalize(w + '/' + f)
		} else {
			f = w
		}
		if (is_directory(f)) {
			return
		}
		f = normalize(f)
		if (f) {
			if (
				shouldRestart &&
				(f.indexOf(project) === -1 || f === json) &&
				f.indexOf('.git/') === -1 &&
				f.indexOf('.vscode/') === -1 &&
				f.indexOf('.sqlite') === -1 &&
				f.indexOf('package-lock.json') === -1
			) {
				_hash(function (hash) {
					if (shouldRestart != hash) {
						shouldRestart = hash
						cb(f, a)
					}
				})
			}
		}
	}
	if (is_directory(w)) {
		as_directory = true
		fs.watch(w, { recursive: true }, _)
	} else {
		fs.watch(w, _)
	}
}

// watch project but only for the package.json file, as the file mahybe doesnt exits we gotta watch the dir
const project = normalize(process.cwd())
const dirname = normalize(__dirname)
const script = normalize(dirname + '/run.js')
const json = normalize(project + '/package.json')

watch(dirname, restart)
watch(project, restart)

// aditional watch
;(async function () {
	if (await exists(json)) {
		let aditional_watch = require(json)
		if (aditional_watch && aditional_watch.kompiler && aditional_watch.kompiler.watch) {
			for (let to_watch of aditional_watch.kompiler.watch) {
				watch(to_watch, restart)
			}
		}
	}
})()

// restarts

let timeout = false
function restart(changed, action) {
	clearTimeout(timeout)
	timeout = setTimeout(function () {
		_restart(changed, action)
	}, 250)
}

let fork = false
let message = 'Starting'
let debug = false
function _restart(changed, action) {
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

// for closing the cmd window that is watching as soon as possible
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

function _hash(cb) {
	glob(
		dirname + '/**',
		{
			nodir: true,
			dot: true,
		},
		async function (err, f) {
			f = f.filter(
				i =>
					i.indexOf('.git') === -1 &&
					i.indexOf('sqlite') === -1 &&
					i.indexOf('node_modules') === -1,
			)
			f.push(project + '/package.json')
			f.sort()

			_read = util.promisify(fs.readFile)

			let hash = ''
			for (let i of f) {
				hash += await _read(i, 'utf8').catch(function () {
					return ''
				})
			}
			cb(hash)
		},
	)
}

_hash(function (hash) {
	shouldRestart = hash
})
