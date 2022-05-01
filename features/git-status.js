promise(function git_status() {
	let command = {
		command: ['git', 'status', '-s'],
		sync: true,
		cwd: project,
		noempty: true,
		norepeat: true,
		callback: output,
		nostderr: true,
	}

	async function status() {
		if (await exists('.git')) {
			spawn(command)
		}
	}

	watch(null, project, status, true)

	run(
		`git init && git config merge.ours.driver true && git config color.ui auto && git config diff.mnemonicPrefix true && git config diff.renames true  `,
	)

	status()
})
