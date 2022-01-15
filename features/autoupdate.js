promise(async function autoupdates() {
	if (options.autoupdates && Array.isArray(options.autoupdates)) {
		let today = new Date().getDate()

		if ((await db('auto library updates')) == today) {
			log('Auto library update - already checked for updates today')
			return
		}
		db('auto library updates', today)

		for (let downloads of options.autoupdates) {
			let url = String(downloads[0])
			let file = String(downloads[1])
			if (url && file && url.indexOf('example.net') === -1) {
				hash_file(file).then(function (_hash) {
					request(url, (err, res, body) => {
						if (!err) {
							if (_hash != hash(body) && body.indexOf('Rate exceeded') !== 0) {
								log('Auto library update - updated ' + basename(file))
								write(file, body)
							} else {
								log('Auto library update - no updates for ' + basename(file))
							}
						}
					})
				})
			}
		}
	}
})
