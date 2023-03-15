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
		let start = Date.now()

		result = result.trim()
		switch (+result) {
			// diff
			case 1: {
				await spawn({
					command: [
						'git',
						'diff',
						'HEAD',
						'--no-color',
						'-w',
						'--',
						'.',
						'>',
						compiler + '.cache/diff.diff',
					],
				})
				await spawn({
					command: ['start', compiler + '.cache/diff.diff'],
				})
				break
			}
			// open in browser
			case 2: {
				open_in_browser()
				break
			}

			// upload
			case 3: {
				yellow('Update live site.. ')

				no_git_status = true
				let old_on_bundle_done = on_bundle_done_notification

				// prevent compiler from restarting the compiler
				await write('./norestart', '')

				// track
				for (let build of options.builds) {
					let dist = await list(dirname(build.output))
					for (let file of dist)
						await spawn({
							command: ['git', 'update-index', '--no-skip-worktree', '"' + file + '"'],
						})
				}

				let version

				on_bundle_done_notification = async () => {
					on_bundle_done_notification = old_on_bundle_done

					// write version to index
					cyan('Write Version To Index')

					for (let build of options.builds) {
						let root = dirname(build.input[0])
						if (await exists(root + '/index.html')) {
							let index = await read(root + '/index.html')
							await write(
								root + '/index.html',
								index
									.replace(/\.js\?[^"']+/g, '.js?' + version)
									.replace(/\.css\?[^"']+/g, '.css?' + version),
							)
						}
					}

					// commit add
					cyan('Git Add/Commit')
					await spawn({
						command: 'git add --all'.split(' '),
					})
					await spawn({
						command: ('git commit -m "' + version + '"').split(' '),
					})

					// pull
					cyan('Git Pull')

					let result = await spawn({ command: 'git remote'.split(' ') })
					let remotes = result.stdout.trim().split('\n')

					for (let remote of remotes) {
						await spawn({
							command: ['git', 'pull', remote, 'master'],
						})
					}

					// merge
					cyan('Git Merge')
					await spawn({
						command: 'git add --all'.split(' '),
					})
					await spawn({
						command: ('git commit -m "' + version + '"').split(' '),
					})

					// push
					cyan('Git Push')
					for (let remote of remotes) {
						await spawn({
							command: ['git', 'push', remote, 'master'],
						})
					}

					await remove('./norestart')

					no_git_status = false

					yellow('Site updated in ' + enlapsed(start) + ' seconds at ' + time())
					console.log()
				}

				// tell npm to bump the project version
				cyan('Bump Version')
				await spawn({
					command: 'call npm version patch -f --no-git-tag-version'.split(' '),
					callback: noop,
				})
				// write the version so its usable on the frontend
				version = JSON.parse(await read(project + 'package.json')).version
				yellow('v' + version)

				cyan('Waiting For Build')

				break
			}

			default: {
				if (/^[0-9\s]+$/i.test(result)) {
					error('Unkown action ' + result)
				} else if (result.trim() !== '') {
					yellow('Git Add/Commit')

					// untrack build
					for (let build of options.builds) {
						let dist = await list(dirname(build.output))
						for (let file of dist)
							await spawn({
								command: ['git', 'update-index', '--skip-worktree', '"' + file + '"'],
							})
					}
					await spawn({
						command: 'git add --all'.split(' '),
					})
					await spawn({
						command: ['git', 'commit', '-m', '"' + result + '"'],
					})

					// track
					for (let build of options.builds) {
						let dist = await list(dirname(build.output))
						for (let file of dist)
							await spawn({
								command: ['git', 'update-index', '--no-skip-worktree', '"' + file + '"'],
							})
					}

					yellow('Git Add/Commit done at ' + time())
					console.log()
				} else if (result.trim() === '') {
					// commit add
					yellow('Git Pull/Push')

					// untrack build
					for (let build of options.builds) {
						let dist = await list(dirname(build.output))
						for (let file of dist)
							await spawn({
								command: ['git', 'update-index', '--skip-worktree', '"' + file + '"'],
							})
					}

					await spawn({
						command: ['git', 'pull'],
					})

					await spawn({
						command: ['git', 'push'],
					})

					// track
					for (let build of options.builds) {
						let dist = await list(dirname(build.output))
						for (let file of dist)
							await spawn({
								command: ['git', 'update-index', '--no-skip-worktree', '"' + file + '"'],
							})
					}

					yellow('Git Pull/Push done at ' + time())
					console.log()
				}
			}
		}
	}
})
