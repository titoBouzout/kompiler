promise(async function socket() {
	if (options.socket && options.socket.input && (await exists(project + options.socket.input))) {
		let server

		subtitle('Starting Socket Server')
		console.log()

		function start() {
			const { spawn } = require('child_process')
			let command = options.socket.es6
				? ['-r', project + 'node_modules/esm/index.js', options.socket.input]
				: [options.socket.input]
			return spawn('node', command, { stdio: 'inherit' })
		}

		async function restart(file) {
			subtitle('Restarting Socket Server - ' + file.replace(project, ''))
			console.log()

			server && server.kill() // Stops the child process
			server = start()
		}
		watch('Restarting Socket Server', dirname(project + options.socket.input), restart, true)

		server = start()
	}
})
