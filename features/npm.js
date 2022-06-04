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
	if (await exists(project + 'client/package.json')) {
		setTimeout(function () {
			outdated(project + 'client/')
		}, 5000)
		watch(null, project + 'client/package.json', function () {
			outdated(project + 'client/')
		})
	}

	// watch server
	if (await exists(project + 'socket/package.json')) {
		setTimeout(function () {
			outdated(project + 'socket/')
		}, 5000)
		watch(null, project + 'socket/package.json', function () {
			outdated(project + 'socket/')
		})
	}
})
