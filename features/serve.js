let pages = []
open_in_browser = function () {
	for (let page of pages) {
		browser(page)
	}
}

promise(function serve() {
	for (let build of options.builds) {
		build.root = dirname(build.input[0])
		build.port = seeded_random(1025, 65534, build.root)
		build.page = 'http://localhost:' + build.port

		pages.push(build.page)

		subtitle('Serving ' + build.root)

		log(build.page)

		if (!build.express) {
			let mime = require('mime-types')
			require('http')
				.createServer(async function (req, res) {
					let file =
						build.root + '/' + decodeURIComponent(req.url).replace(/^\//, '').replace(/\?.*/, '')

					if (is_directory(file) && (await exists(file + 'index.html'))) {
						file += 'index.html'
					}
					if ((await exists(file)) && !is_directory(file)) {
						res.setHeader('Content-Type', mime.lookup(file))
						res.writeHead(200)
						res.end(Buffer.from(await fs.promises.readFile(file)))
					} else {
						if (is_directory(file)) {
							let files = await list(file)
							let content = '<h1>' + file.replace(build.root + '/', '') + '</h1><hr/><ul>'
							for (let f of files)
								content +=
									'<li><a href="/' +
									f.replace(build.root + '/', '') +
									'">' +
									f.replace(build.root + '/', '') +
									'</a>'

							res.setHeader('Content-Type', 'text/html')
							res.writeHead(200)
							res.end(content)
						} else {
							if (/\/[^\.]+$/.test(file) && (await exists(build.root + '/index.html'))) {
								file = build.root + '/index.html'
								res.setHeader('Content-Type', mime.lookup(file))
								res.writeHead(200)
								res.end(Buffer.from(await fs.promises.readFile(file)))
							} else {
								error('404 Not Found: ' + file)
								res.setHeader('Content-Type', 'text/plain')
								res.writeHead(404)
								res.end()
							}
						}
					}
				})
				.listen(build.port)
		} else {
			const express = require('express')
			const app = express()
			app.listen(build.port)
			app.use(express.static(build.root))
		}

		// AUTO REFRESH
		const WebSocket = require('ws')
		build.wss = new WebSocket.Server({ port: build.port - 1 })

		// watch index
		watch(null, build.root + '/index.html', function () {
			line('Auto Refresh - index.html changed, refreshing')
			build.wss.clients.forEach(function (client) {
				client.send('reload')
			})
		})

		// watch js and css
		let reload_js = false
		let reload_css = false

		watch(null, project + build.output, function () {
			reload_js = true
		})
		watch(null, project + build.output.replace('.js', '.css'), function () {
			reload_css = true
		})

		// wait for bundle to refresh
		build.on_bundle_done = async function () {
			if (reload_js) {
				reload_js = false
				line('Auto Refresh - js changed, refreshing')
				build.wss.clients.forEach(function (client) {
					client.send('reload')
				})
			} else if (reload_css) {
				reload_css = false
				line('Auto Refresh - css changed, hot reloading')
				build.wss.clients.forEach(function (client) {
					client.send('reload-css')
				})
			}
		}

		subtitle('Auto Refresh - watching: js, css, index.html')
	}
	open_in_browser()
})
