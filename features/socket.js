promise(async function socket() {
	if (options.socket && options.socket.input && (await exists(project + options.socket.input))) {
		const { spawn } = require('child_process')
		let server

		subtitle('Starting Socket Server')

		function start() {
			let command = options.socket.es6
				? ['-r', project + 'node_modules/esm/index.js', options.socket.input]
				: [options.socket.input]
			return spawn('node', command, { stdio: 'inherit' })
		}

		async function restart(file) {
			server && server.kill() // Stops the child process
			server = start()
		}
		watch('Restarting Socket Server', dirname(project + options.socket.input), restart, true)

		server = start()
	}
})
