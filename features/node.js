promise(async function node() {
	if (options.node && Array.isArray(options.node)) {
		const { spawn } = require('child_process')

		for (const node of options.node) {
			let server

			subtitle('Starting Node script - ' + node.input)

			function start() {
				let command =
					node.legacyToEs6 === undefined || node.legacyToEs6
						? ['-r', project + 'node_modules/esm/index.js', node.input]
						: [node.input]
				return spawn('node', command, { stdio: 'inherit' })
			}

			let timeout = false

			async function restart() {
				if (server && server.kill) {
					server.kill('SIGKILL')
					try {
						process.kill(server.pid)
					} catch (e) {}
				}

				clearTimeout(timeout)
				timeout = setTimeout(function () {
					server = start()
				}, 100)
			}

			watch('Restarting Node script', dirname(node.input), restart, true)

			if (node.watch && Array.isArray(node.watch)) {
				for (let fileOrFolder of node.watch) {
					watch('Restarting Node script', fileOrFolder, restart, true)
				}
			}

			server = start()
		}
	}
})
