promise(async function socket() {
	if (options.socket && options.socket.input && (await exists(project + options.socket.input))) {
		let socketServer

		subtitle('Starting Socket Server')
		console.log()

		function socketStart() {
			const { spawn } = require('child_process')
			let command = options.socket.es6
				? ['-r', project + 'node_modules/esm/index.js', options.socket.input]
				: [options.socket.input]
			const socketServer = spawn('node', command, { stdio: 'inherit' })
			return socketServer
		}

		let hashes = {}
		let files = await list(dirname(project + options.socket.input))
		for (let file of files) {
			hashes[file] = await hash_file(file)
		}

		async function socketWatch(file) {
			let hash = await hash_file(file)
			if (hash != hashes[file]) {
				if (file) {
					subtitle('Restarting Socket Server - ' + file.replace(project, ''))
					console.log()
				}
				hashes[file] = hash

				socketServer && socketServer.kill() // Stops the child process
				socketServer = socketStart()
			}
		}
		watch(
			'Restarting Socket Server',
			dirname(project + options.socket.input),
			socketWatch,
			500,
			true,
		)

		socketWatch()
	}
})
