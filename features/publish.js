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

	async function reset_binary() {
		for (let build of options.builds) {
			let dist = await list(dirname(build.output))
			for (let file of dist)
				await spawn({
					command: ['git', 'checkout', 'HEAD', '"' + file + '"'],
				})
		}
	}
	async function untrack_binary() {
		for (let build of options.builds) {
			let dist = await list(dirname(build.output))
			for (let file of dist)
				await spawn({
					command: ['git', 'update-index', '--skip-worktree', '"' + file + '"'],
				})
		}
	}

	async function track_binary() {
		for (let build of options.builds) {
			let dist = await list(dirname(build.output))
			for (let file of dist)
				await spawn({
					command: ['git', 'update-index', '--no-skip-worktree', '"' + file + '"'],
				})
		}
	}

	async function build_it() {
		let old_on_bundle_done = on_bundle_done_notification
		return new Promise(async function (resolve, reject) {
			on_bundle_done_notification = function () {
				on_bundle_done_notification = old_on_bundle_done
				resolve()
			}
			for (let build of options.builds) {
				let content = await read(build.input[0])
				await write(build.input[0], content)
			}
		})
	}

	async function is_dirty() {
		await track_binary()
		await reset_binary()
		let ret = await spawn({
			command: ['git', 'diff', 'HEAD'],
		})

		await untrack_binary()

		await build_it()

		return ret.stdout !== ''
	}
	async function do_action(result) {
		let start = Date.now()

		result = result.trim()
		switch (+result) {
			// diff
			case 1: {
				no_git_status = true

				await untrack_binary()

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
				await track_binary()

				no_git_status = false

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

				if (await is_dirty()) {
					no_git_status = false
					return warning('Tree is dirty, commit first')
				}

				// prevent compiler from restarting the compiler
				await write('./norestart', '')

				__IS_LOCALHOST__ = false

				await track_binary()
				await reset_binary()

				// pull
				cyan('Git Pull')

				let result = await spawn({ command: 'git remote'.split(' ') })
				let remotes = result.stdout.trim().split('\n')

				for (let remote of remotes) {
					await spawn({
						command: ['git', 'pull', remote, 'master'],
					})
				}

				await reset_binary()

				// merge
				cyan('Git Merge')
				await spawn({
					command: 'git add --all'.split(' '),
				})
				await spawn({
					command: 'git commit -m "Merge"'.split(' '),
				})

				// tell npm to bump the project version
				cyan('Bump Version')
				await spawn({
					command: 'npm version patch -f --no-git-tag-version'.split(' '),
					callback: noop,
				})

				let version = JSON.parse(await read(project + 'package.json')).version
				yellow('v' + version)

				// write version to index

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

				cyan('Waiting For Build')

				await build_it()

				// write version to scripts
				for (let build of options.builds) {
					let content = await read(build.output)
					await write(
						build.output,
						content.replace(/__DATE__/g, Date.now()).replace(/__VERSION__/g, version),
					)
				}

				// commit add
				cyan('Git Add/Commit')
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

				await untrack_binary()

				yellow('Site updated in ' + enlapsed(start) + ' seconds at ' + time())
				console.log()

				no_git_status = false
				__IS_LOCALHOST__ = true
				await remove('./norestart')

				break
			}

			default: {
				if (/^[0-9\s]+$/i.test(result)) {
					error('Unkown action ' + result)
				} else if (result.trim() !== '') {
					yellow('Git Add/Commit')

					no_git_status = true

					await untrack_binary()

					await spawn({
						command: 'git add --all'.split(' '),
					})
					await spawn({
						command: ['git', 'commit', '-m', '"' + result + '"'],
					})

					await track_binary()

					no_git_status = false

					yellow('Git Add/Commit done at ' + time())
					console.log()
				} else if (result.trim() === '') {
					// commit add
					yellow('Git Pull/Push')

					no_git_status = true

					if (await is_dirty()) {
						no_git_status = false
						return warning('Tree is dirty, commit first')
					}

					await track_binary()

					await reset_binary()

					await spawn({
						command: ['git', 'pull'],
					})

					await spawn({
						command: ['git', 'push'],
					})

					await untrack_binary()

					await build_it()

					no_git_status = false

					yellow('Git Pull/Push done at ' + time())
					console.log()
				}
			}
		}
	}
})
