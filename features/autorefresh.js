promise(async function autorefresh() {
	if (options.site && options.site.port && options.folders && options.folders.client) {
		const WebSocket = require('ws')
		wss = new WebSocket.Server({ port: options.site.port - 1 })

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

		for (let build of options.builds) {
			;(function () {
				let file = project + build.output
				let hash = ''

				watch('Auto refresh', file, async function refresh() {
					_hash = await hash_file(file)
					if (_hash != hash) {
						hash = _hash
						line('Auto refresh - js changed, refreshing')
						wss.clients.forEach(function (client) {
							client.send('reload')
						})
					}
				})
			})()
			;(function () {
				let file = project + build.output.replace('.js', '.css')
				let hash = ''

				watch('Auto refresh', file, async function refresh() {
					_hash = await hash_file(file)
					if (_hash != hash) {
						hash = _hash
						line('Auto refresh - css changed, refreshing')
						wss.clients.forEach(function (client) {
							client.send('reload-css')
						})
					}
				})
			})()
		}

		subtitle('Auto refresh - watching ')
	}
})
