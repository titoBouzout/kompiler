promise(async function autorefresh() {
	const WebSocket = require('ws')
	wss = new WebSocket.Server({ port: options.site.port - 1 })

	if (options.site && options.site.port && options.folders && options.folders.client) {
		// watch index
		watch(null, project + options.folders.client + 'index.html', function () {
			line('Auto Refresh - index.html changed, refreshing')
			wss.clients.forEach(function (client) {
				client.send('reload')
			})
		})

		// watch js and css
		let reload_js = false
		let reload_css = false

		for (let build of options.builds) {
			watch(null, project + build.output, function () {
				reload_js = true
			})
			watch(null, project + build.output.replace('.js', '.css'), function () {
				reload_css = true
			})
		}

		// wait for bundle to refresh
		on_bundle_done = async function () {
			if (reload_js) {
				reload_js = false
				line('Auto Refresh - js changed, refreshing')
				wss.clients.forEach(function (client) {
					client.send('reload')
				})
			} else if (reload_css) {
				reload_css = false
				line('Auto Refresh - css changed, hot reloading')
				wss.clients.forEach(function (client) {
					client.send('reload-css')
				})
			}
		}

		subtitle('Auto Refresh - watching js, css, index.html')
	}
})
