promise(async function command_line() {
	const readline = require('readline')
	const rl = readline.createInterface({
		input: process.stdin,
	})

	function ask() {
		rl.question('', result => {
			ask()
			do_action(result)
		})
	}
	ask()

	async function do_action(result) {
		result = result.trim()
		switch (+result) {
			// diff
			case 1: {
				await spawn({
					command: [
						'git',
						'diff',
						'HEAD',
						'--color',
						'-w',
						'--unified=1',
						'--minimal',
						'--shortstat',
						'--ignore-space-change',
						'--',
						'.',
					],
				})

				break
			}
			// open in browser
			case 2: {
				open_in_browser()
				break
			}

			default: {
				error('Unkown action ' + result)
			}
		}
	}
})
