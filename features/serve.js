open_in_browser = function () {
	browser('http://localhost:' + options.port)
}

promise(function serve() {
	if (options.port) {
		subtitle('Serving ' + project + 'client/')
		log('http://localhost:' + options.port)

		if (!options.express) {
			let mime = require('mime-types')
			require('http')
				.createServer(async function (req, res) {
					let file =
						project + 'client/' + decodeURIComponent(req.url).replace(/^\//, '').replace(/\?.*/, '')

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
							let content = '<h1>' + file.replace(project + 'client/', '') + '</h1><hr/><ul>'
							for (let f of files)
								content +=
									'<li><a href="/' +
									f.replace(project + 'client/', '') +
									'">' +
									f.replace(project + 'client/', '') +
									'</a>'

							res.setHeader('Content-Type', 'text/html')
							res.writeHead(200)
							res.end(content)
						} else {
							if (/\/[^\.]+$/.test(file) && (await exists(project + 'client/index.html'))) {
								file = project + 'client/index.html'
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
				.listen(options.port)
		} else {
			const express = require('express')
			const app = express()
			app.listen(options.port)
			app.use(express.static(project + 'client/'))
		}

		open_in_browser()
	}
})
