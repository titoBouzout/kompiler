let pages = []
open_in_browser = function () {
	for (let page of pages) {
		browser(page)
	}
}

promise(async function serve() {
	if (options.builds)
		for (let build of options.builds) {
			// do not serve
			if (build.root === false) continue

			build.root = build.root ? normalize(build.root) : dirname(build.input[0])
			build.port = seeded_random(1025, 65534, build.root)
			const host = 'http://' + (build.hostname || 'localhost') + ':' + build.port
			const page = build.page ? host + '/' + build.page : host
			if (!build.page) build.page = 'index.html'
			pages.push(page)

			subtitle('Serving ' + build.root)

			log(page)

			if (!build.express) {
				let mime = require('mime-types')

				function contentType(mime) {
					switch (mime) {
						// dinamic imports require strict mime type
						case 'application/jsx':
						case 'text/jsx':
							return 'application/javascript; charset=utf-8'

						case 'text/html':
						case 'text/css':

						case 'application/javascript':
						case 'application/json':

						case 'text/javascript':
						case 'text/json':

						case 'text/plain':
							return mime + '; charset=utf-8'
						default:
							return ''
					}
				}

				function _decodeURIComponent(a) {
					try {
						return decodeURIComponent(a)
					} catch (e) {
						console.log(a)
						return a
					}
				}
				require('http')
					.createServer(async function (req, res) {
						async function serve(file) {
							let mimeType = mime.lookup(file)
							res.setHeader('Content-Type', contentType(mimeType))
							// res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
							// res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')

							res.writeHead(200)
							res.end(Buffer.from(await fs.promises.readFile(file)))
						}

						let file =
							build.root +
							'/' +
							_decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*/, ''))

						if (is_directory(file) && (await exists(file + build.page))) {
							file += build.page
						}

						if ((await exists(file)) && !is_directory(file)) {
							serve(file)
						} else {
							if (is_directory(file)) {
								let files = await list(file)
								let content =
									'<h1>' + file.replace(build.root + '/', '') + '</h1><hr/><ul>'
								for (let f of files)
									content +=
										'<li><a href="/' +
										f.replace(build.root + '/', '') +
										'">' +
										f.replace(build.root + '/', '') +
										'</a>'

								res.setHeader('Content-Type', 'text/html; charset=utf-8')
								res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
								res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
								res.writeHead(200)
								res.end(content)
							} else {
								if (
									(/\/[^\.]+$/.test(file) || /\/[^\.]+\.html$/.test(file)) &&
									(await exists(build.root + '/' + build.page))
								) {
									blue('map: ' + file.replace(build.root, '') + ' -> ' + '/' + build.page)
									file = build.root + '/' + build.page
									serve(file)
								} else {
									let map = build.map || options.map
									if (map) {
										for (const redirect of map) {
											let target = file.replace(redirect[0], redirect[1])
											if (await exists(target)) {
												return serve(target)
											}
										}
									}
									error('404 Not Found: ' + file)
									res.setHeader('Content-Type', 'text/plain; charset=utf-8')
									res.writeHead(404)
									res.end('404 File not found: ' + file)
								}
							}
						}
					})
					.listen({ host: '127.0.0.1', port: build.port })
			} else {
				const express = require('express')
				const app = express()
				app.listen(build.port)
				app.use(express.static(build.root))
			}

			// AUTO REFRESH
			const WebSocket = require('ws')
			build.wss = new WebSocket.Server({ host: '127.0.0.1', port: build.port - 1 })

			// watch index
			if (await exists(build.root + '/' + build.page)) {
				watch(null, build.root + '/' + build.page, function () {
					line('Auto Refresh - ' + build.page + ' changed, refreshing')
					build.wss.clients.forEach(function (client) {
						client.send('reload')
					})
				})
			} else {
				warning(
					build.root + '/' + build.page + ' - doesnt exists so wont be watched till then',
				)
			}

			// watch js and css
			let reload_js = false
			let reload_css = false

			// watch output
			if (await exists(project + build.output)) {
				watch(null, project + build.output, function () {
					reload_js = true
				})
			} else {
				warning(project + build.output + ' - doesnt exists so wont be watched till then')
			}

			// watch output css
			if (await exists(project + build.output.replace('.js', '.css'))) {
				watch(null, project + build.output.replace('.js', '.css'), function () {
					reload_css = true
				})
			} else {
				warning(
					project +
						build.output.replace('.js', '.css') +
						' - doesnt exists so wont be watched till then',
				)
			}

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
		}

	if ((await db('opened in browser')) !== today()) {
		db('opened in browser', today())
		open_in_browser()
	}
})
