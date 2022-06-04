promise(async function socket() {
	if (options.socket && options.socket) {
		const { spawn } = require('child_process')
		let server

		subtitle('Starting Socket Server')

		function start() {
			let command = options.es6
				? ['-r', project + 'node_modules/esm/index.js', options.socket]
				: [options.socket]
			return spawn('node', command, { stdio: 'inherit' })
		}

		async function restart() {
			server && server.kill() // Stops the child process
			server = start()
		}
		watch('Restarting Socket Server', dirname(project + options.socket), restart, true)

		server = start()
	}
})
