promise(function kill() {
	let exiting = false
	function on_exit(who) {
		if (!exiting) {
			exiting = true
			if (
				who == 'SIGHUP' ||
				who == 'SIGBREAK' ||
				who == 'SHUTDOWN' ||
				who == 'exit' ||
				who == 'SIGINT'
			) {
				process.exit(0)
			} else {
				console.log('restarted by', who)
				if (process.send) process.send('RESTART')
				process.exit(0)
			}
		}
	}

	process.on('SIGTERM', () => on_exit('SIGTERM'))
	process.on('SIGINT', () => on_exit('SIGINT'))
	process.on('SIGUSR2', () => on_exit('SIGUSR2'))
	process.on('SIGBREAK', () => on_exit('SIGBREAK'))
	// process.on('SIGKILL', () => on_exit('SIGKILL')) UNCOMMENTED MAKE IT CRASH ON LINUX!
	process.on('SIGHUP', () => on_exit('SIGHUP'))
	process.on('exit', () => on_exit('exit'))
	process.on('message', m => {
		if (m === 'RESTART' || m === 'SHUTDOWN') {
			on_exit(m)
		}
	})
})
