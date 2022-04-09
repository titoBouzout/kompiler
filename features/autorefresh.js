promise(async function autorefresh() {
	const WebSocket = require('ws')
	wss = new WebSocket.Server({ port: options.site.port - 1 })

	if (options.site && options.site.port && options.folders && options.folders.client) {
		let hash = ''
		watch(
			'Auto refresh',
			project + options.folders.client + 'index.html',
			async function refresh() {
				_hash = await hash_file(project + options.folders.client + 'index.html')
				if (_hash != hash) {
					hash = _hash
					line('Auto refresh - index.html changed, refreshing')
					wss.clients.forEach(function (client) {
						client.send('reload')
					})
				}
			},
		)

		let files = {}

		for (let build of options.builds) {
			let file = project + build.output
			files[file] = await hash_file(file)

			file = project + build.output.replace('.js', '.css')
			files[file] = await hash_file(file)
		}

		on_bundle_done = async function () {
			for (let id in files) {
				let file = id
				let hash = files[id]
				let _hash = await hash_file(file)
				if (_hash != hash) {
					files[id] = _hash
					if (file.indexOf('.js') !== -1) {
						line('Auto refresh - js changed, refreshing')
						wss.clients.forEach(function (client) {
							client.send('reload')
						})
						break
					} else if (file.indexOf('.css') !== -1) {
						line('Auto refresh - css changed, hot reloading')
						wss.clients.forEach(function (client) {
							client.send('reload-css')
						})
					}
				}
			}
		}

		subtitle('Auto refresh - watching ')
	}
})
