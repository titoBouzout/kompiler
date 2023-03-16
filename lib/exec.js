cp = require('child_process')
exec = cp.exec
_spawn = cp.spawn

let processes = []

run = function (command, options) {
	let cmd = {
		command: command.split(' '),
	}
	options = options || {}
	cmd.sync = options.sync !== undefined ? options.sync : false
	cmd.cwd = options.cwd !== undefined ? options.cwd : project
	cmd.noempty = options.noempty !== undefined ? options.noempty : true
	cmd.norepeat = options.norepeat !== undefined ? options.norepeat : false
	cmd.callback = options.callback !== undefined ? options.callback : output
	cmd.nostderr = options.nostderr !== undefined ? options.nostderr : false
	return spawn(cmd)
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
		blue('\n' + cmd.stderr)
	}
	console.log()
}

let runningSync = false
spawn = function (cmd) {
	cmd.sync = cmd.sync !== undefined ? cmd.sync : false
	cmd.cwd = cmd.cwd !== undefined ? cmd.cwd : project
	cmd.noempty = cmd.noempty !== undefined ? cmd.noempty : true
	cmd.norepeat = cmd.norepeat !== undefined ? cmd.norepeat : false
	cmd.callback = cmd.callback !== undefined ? cmd.callback : output
	cmd.nostderr = cmd.nostderr !== undefined ? cmd.nostderr : false

	if (cmd.sync && runningSync) {
		processes.push(cmd)
		return
	} else if (cmd.sync) {
		runningSync = true
	}

	return promise(function (resolve, reject) {
		if (!cmd.command) {
			log(cmd)
			throw new Error('SPAWN: command is not defined')
		}
		if (!cmd.cwd) {
			cmd.cwd = './'
		}

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

	subprocess.stdout.setEncoding('utf8')
	subprocess.stdout.on('data', data => {
		cmd.stdout += data
	})
	subprocess.stderr.setEncoding('utf8')
	subprocess.stderr.on('data', data => {
		cmd.stderr += data
	})
	subprocess.on('error', data => {
		cmd.stderr += data
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

			cmd.title = cmd.cwd + ' ' + cmd.command.join(' ') + ' in ' + enlapsed(cmd.start)

			if (cmd.callback) {
				cmd.callback(cmd)
			}
			if (cmd.code !== 0 && cmd.stderr !== '') {
				reject(cmd)
			} else {
				resolve(cmd)
			}

			if (cmd.sync) {
				runningSync = false
				queueMicrotask(() => {
					if (processes.length) {
						let cmd = processes.shift()
						spawn(cmd)
					}
				})
			}
		}
	}

	// subprocess.on('close', on_close)
	subprocess.on('exit', on_close)
	// subprocess.on('disconnect', on_close)
}

browser = function (url) {
	if (is_osx()) {
		exec('open -a "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ' + url)
	} else if (is_windows()) {
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
		function open_chrome() {
			if (chrome.length) {
				let browser = chrome.shift()
				exec('"' + browser + '" ' + url, function (err) {
					if (err) {
						open_chrome()
					}
				})
			}
		}
		open_chrome()
	} else {
		open_file(url)
	}
}
