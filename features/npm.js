promise(async function npm() {
	const { spawn } = require('child_process')

	function outdated(folder) {
		spawn(is_windows() ? 'npm.cmd' : 'npm', ['outdated'], {
			stdio: 'inherit',
			cwd: folder,
		})
	}

	// watch all folders with packages json to run npm outdated
	let packagesJson = await find(project, 'package.json')

	for (let package of packagesJson) {
		let folder = dirname(package)
		setTimeout(function () {
			outdated(folder)
		}, 5000)
		watch(null, package, function () {
			outdated(folder)
		})
	}
})
