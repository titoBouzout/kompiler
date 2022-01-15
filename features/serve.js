promise(function serve() {
	if (options.site && options.site.port && options.folders && options.folders.client) {
		subtitle(
			'Serving ' + project + options.folders.client + ' at http://localhost:' + options.site.port,
		)

		require('http')
			.createServer(async function (req, res) {
				let file =
					project +
					options.folders.client +
					decodeURIComponent(req.url).replace(/^\//, '').replace(/\?.*/, '')

				if (is_directory(file) && (await exists(file + 'index.html'))) {
					file += 'index.html'
				}
				if ((await exists(file)) && !is_directory(file)) {
					res.writeHead(200)
					res.end(Buffer.from(await fs.promises.readFile(file)))
				} else {
					if (is_directory(file)) {
						let files = await list(file)
						let content =
							'<h1>' + file.replace(project + options.folders.client, '') + '</h1><hr/><ul>'
						for (let f of files)
							content +=
								'<li><a href="/' +
								f.replace(project + options.folders.client, '') +
								'">' +
								f.replace(project + options.folders.client, '') +
								'</a>'
						res.writeHead(200)
						res.end(content)
					} else {
						log('404 Not Found: ' + file)
						res.writeHead(404)
						res.end()
					}
				}
			})
			.listen(options.site.port)

		browser('http://localhost:' + options.site.port)
	}
})
