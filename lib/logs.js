title = function (s) {
	process.title = s
	console.log('\n\x1b[36m' + '='.repeat(10) + ' ' + s + ' ' + '='.repeat(10) + '\x1b[0m')
}

subtitle = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\n\x1b[32m' + s.trim() + '\x1b[0m')
}

log = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\x1b[32m-> \x1b[0m' + s.trim())
}

line = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\n\x1b[32m-> \x1b[0m' + s.trim())
}

blue = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\n\x1b[1;34m' + s.trim() + '\x1b[0m')
}

yellow = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\n\x1b[33m' + s.trim() + '\x1b[0m')
}

error = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\x1b[31m' + s.trim() + '\x1b[0m')
}

warning = function (args) {
	args = Array.isArray(args) ? args : [args]
	for (let s of args) console.log('\x1b[33m' + s + '\x1b[0m')
}

hr = function () {
	console.log('\n\x1b[32m' + '-'.repeat(40) + '\x1b[0m')
}
