no_git_status = false

promise(function git() {
	run(
		'git config merge.ours.driver true && git config color.ui auto && git config diff.mnemonicPrefix true && git config diff.renames true',
		{
			sync: true,
			callback: noop,
			nostderr: true,
		},
	)
	let command = {
		command: ['git', 'status', '-s'],
		sync: true,
		norepeat: true,
	}
	async function status() {
		if (!no_git_status) {
			spawn(command)
		}
	}

	if (options.git) {
		status()

		watch(null, project, status, true)
	}
})
