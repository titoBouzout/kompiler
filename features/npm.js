promise(async function npm() {
	const { spawn } = require('child_process')

	function outdated(folder) {
		spawn(is_windows() ? 'npm.cmd' : 'npm', ['outdated'], {
			stdio: 'inherit',
			cwd: folder,
		})
	}

	// watch main

	if (project && (await exists(project + 'package.json'))) {
		setTimeout(function () {
			outdated(project)
		}, 5000)
		watch(null, project + 'package.json', function () {
			outdated(project)
		})
	}

	// watch client
	if (options.folders.client && (await exists(project + options.folders.client + 'package.json'))) {
		setTimeout(function () {
			outdated(project + options.folders.client)
		}, 5000)
		watch(null, project + options.folders.client + 'package.json', function () {
			outdated(project + options.folders.client)
		})
	}

	// watch server
	if (options.folders.server && (await exists(project + options.folders.server + 'package.json'))) {
		setTimeout(function () {
			outdated(project + options.folders.server)
		}, 5000)
		watch(null, project + options.folders.server + 'package.json', function () {
			outdated(project + options.folders.server)
		})
	}
})
