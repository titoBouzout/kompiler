// let mime = require('mime-types')

promise(function serve() {
	if (options.site && options.site.port && options.folders && options.folders.client) {
		subtitle('Serving ' + project + options.folders.client)
		log('http://localhost:' + options.site.port)

		const express = require('express')
		const app = express()
		app.listen(options.site.port)
		app.use(express.static(project + options.folders.client))

		browser('http://localhost:' + options.site.port)
	}
})
