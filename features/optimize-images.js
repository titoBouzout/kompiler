promise(async function optimize_images() {
	if (options.folders && options.folders.client) {
		let start = Date.now()
		let promises = promise()

		let files = await list(project + options.folders.client)
		let images = 0
		let processed = []

		for (let f of files) {
			promises(function () {
				return process_image(f).then(function (image) {
					if (image) {
						images++
						if (typeof image === 'string') {
							processed.push(image)
						}
					}
				})
			})
		}

		promises.all(function () {
			log('Optimize images - checked ' + images + ' images in ' + enlapsed(start))
			log(processed)
		})

		subtitle('Optimize images - watching ' + project + options.folders.client)
		watch(null, project + options.folders.client, process_image)
	}
})
