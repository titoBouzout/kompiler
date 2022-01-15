cp = require('child_process')
exec = cp.exec
_spawn = cp.spawn

run = function (cmd) {
	return spawn({
		command: cmd.split(' '),
		sync: true,
		cwd: project,
		noempty: true,
		norepeat: true,
		callback: output,
	})
}

output = function (cmd) {
	if (cmd.noempty && cmd.stdout.trim() == '' && cmd.stderr.trim() == '') {
		return
	}

	if (cmd.norepeat && cmd.last == cmd.stdout + cmd.stderr) {
		return
	}
	cmd.last = cmd.stdout + cmd.stderr

	subtitle('\n' + cmd.title)
	if (cmd.stdout) {
		blue('\n' + cmd.stdout)
	}
	if (cmd.stderr && !cmd.nostderr && cmd.stderr !== cmd.stdout) {
		error('\n' + cmd.stderr)
	}
	console.log()
}

browser = function (url) {
	if (is_osx()) {
		exec('open -a "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ' + url)
	} else {
		let chrome = [
			'chrome.exe',
			'%HOMEPATH%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
			'%HOMEPATH%\\Chromium\\Application\\chrome.exe',
			'%HOMEPATH%\\Google\\Chrome\\Application\\chrome.exe',
			'%HOMEPATH%\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe',
			'%PROGRAMFILES%\\Chromium\\Application\\chrome.exe',
			'%PROGRAMFILES%\\Google\\Chrome Dev\\Application\\chrome.exe',
			'%PROGRAMFILES%\\Google\\Chrome\\Application\\chrome.exe',
			'%PROGRAMFILES(X86)%\\Google\\Chrome Dev\\Application\\chrome.exe',
			'%PROGRAMFILES(X86)%\\Chromium\\Application\\chrome.exe',
			'%PROGRAMFILES(X86)%\\Google\\Chrome\\Application\\chrome.exe',
			'%USERPROFILE%\\Local Settings\\Application Data\\Google\\Chrome\\chrome.exe',
		]
		let displayed = false
		function open_chrome() {
			if (chrome.length) {
				let browser = chrome.shift()
				exec('"' + browser + '" ' + url, function (err) {
					if (err) {
						if (!displayed) warning('chrome.exe is not in PATH')
						displayed = true
						open_chrome()
					} else {
						log('Found Chrome at ' + browser + ' ' + url)
					}
				})
			}
		}
		open_chrome()
	}
}

spawn = function (cmd) {
	return promise(function (resolve, reject) {
		if (cmd.running && cmd.sync) {
			console.log('SPAWN: IS RUNNING ALREADY?')
			return
		}
		if (!cmd.command) {
			log(cmd)
			throw new Error('SPAWN: COMMAND IS NOT DEFINED?')
		}
		if (!cmd.cwd) {
			cmd.cwd = './'
		}

		cmd.running = true
		cmd.start = Date.now()

		spawn_command(resolve, reject, cmd)
	})
}

function spawn_command(resolve, reject, cmd) {
	cmd.stdout = ''
	cmd.stderr = ''
	cmd.code = ''

	const subprocess = _spawn(cmd.command[0], cmd.command.slice(1), {
		shell: true,
		windowsHide: true,
		cwd: cmd.cwd,
	})
	subprocess.unref()

	subprocess.stdout.on('data', data => {
		if (data instanceof Buffer) {
			data = data.toString()
		}
		cmd.stdout += data
	})

	subprocess.stderr.on('data', data => {
		if (data instanceof Buffer) {
			data = data.toString()
		}
		if (
			data.indexOf('remote:') === 0 ||
			data.indexOf('Auto packing') === 0 ||
			(data.indexOf('From ') == 0 && /origin\/master\n$/.test(data))
		) {
		} else {
			cmd.stderr += data
		}
	})
	subprocess.on('error', data => {
		if (data instanceof Buffer) {
			data = data.toString()
		}
		if (
			data.indexOf('remote:') === 0 ||
			data.indexOf('Auto packing') === 0 ||
			(data.indexOf('From ') == 0 && /origin\/master\n$/.test(data))
		) {
		} else {
			cmd.stderr += data
		}
	})

	function on_close(code) {
		exit(code || 0)
	}
	let closed = false

	function exit(code) {
		if (!closed) {
			closed = true

			cmd.code = code

			cmd.end = Date.now()
			cmd.running = false

			cmd.title = cmd.cwd + ' ' + cmd.command.join(' ') + ' in ' + enlapsed(cmd.start)

			if (cmd.callback) {
				cmd.callback(cmd)
			}
			if (cmd.stderr) {
				reject(cmd)
			} else {
				resolve(cmd)
			}
		}
	}

	subprocess.on('close', on_close)
	subprocess.on('exit', on_close)
	subprocess.on('disconnect', on_close)
}
