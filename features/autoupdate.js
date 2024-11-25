promise(async function autoupdates() {
	if (options.autoupdates && Array.isArray(options.autoupdates)) {
		if ((await db('auto library updates')) == today()) {
			if (options.autoupdates.length > 1)
				subtitle('Auto Library Update - already checked')
			return
		}
		db('auto library updates', today())

		for (let downloads of options.autoupdates) {
			let url = String(downloads[0])
			let file = String(downloads[1])
			if (url && file && url.indexOf('example.net') === -1) {
				subtitle('Auto Library Update - Checking')

				hash_file(file).then(function (_hash) {
					fetch(url)
						.then(x => x.text())
						.then(body => {
							if (_hash != hash(body) && body.indexOf('Rate exceeded') !== 0) {
								log('Auto Library Update - updated ' + basename(file))
								write(file, body)
							} else {
								log('Auto Library Update - no updates for ' + basename(file))
							}
						})
						.catch(() => {})
				})
			}
		}
	}
})
