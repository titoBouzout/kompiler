promise(async function npm() {
	const { spawn } = require('child_process')

	function npmOutdated(folder) {
		spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['outdated'], {
			stdio: 'inherit',
			cwd: folder,
		})
	}

	// watch main

	if (project && (await exists(project + '/package.json'))) {
		npmOutdated(project)
		watch(
			'NPM',
			project + '/package.json',
			() => {
				npmOutdated(project)
			},
			10000,
		)
	}

	// watch client
	if (
		options.folders.client &&
		(await exists(project + options.folders.client + '/package.json'))
	) {
		npmOutdated(project + options.folders.client)
		watch(
			'NPM',
			project + options.folders.client + '/package.json',
			() => {
				npmOutdated(project + options.folders.client)
			},
			10000,
		)
	}

	// watch server
	if (
		options.folders.server &&
		(await exists(project + options.folders.server + '/package.json'))
	) {
		npmOutdated(project + options.folders.server)
		watch(
			'NPM',
			project + options.folders.server + '/package.json',
			() => {
				npmOutdated(project + options.folders.server)
			},
			10000,
		)
	}
})
