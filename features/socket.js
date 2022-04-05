promise(async function socket() {
	if (options.socket && options.socket.input && (await exists(project + options.socket.input))) {
		let socketServer
		let printOutPut = true

		function socketStart() {
			const { spawn } = require('child_process')
			let command = options.socket.es6
				? ['-r', compiler + 'node_modules/esm/index.js', options.socket.input]
				: [options.socket.input]
			const socketServer = spawn('node', command)

			socketServer.on('error', e => {
				// This will be called with err being an AbortError if the controller aborts
				if (printOutPut) {
				}
				console.error(e)
			})
			socketServer.on('data', e => {
				// This will be called with err being an AbortError if the controller aborts
				if (printOutPut) {
					console.error(e)
				}
			})
			socketServer.stdout.on('data', data => {
				if (printOutPut) {
					console.log('Socket Server:', data.toString())
				}
			})
			socketServer.stderr.on('data', data => {
				if (printOutPut) {
					console.error('Socket Server:', data.toString())
				}
			})

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
				if (file) console.log('Restarting Socket Server:', 'changed ' + file)
				hashes[file] = hash
				printOutPut = false
				socketServer && socketServer.kill() // Stops the child process
				printOutPut = true

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

		controller = socketWatch()
	}
})
