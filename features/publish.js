;(function command_line_input() {
	const readline = require('readline')
	const rl = readline.createInterface({
		input: process.stdin,
	})

	function ask() {
		rl.question('', async function do_action(result) {
			ask()
			switch (+result) {
				// open in browser
				case 1: {
					open_in_browser()
					break
				}
				// 2 upload
				case 2: {
					let start = Date.now()
					yellow('Updating live site.. ')
					console.log()

					no_git_status = true

					// prevent compiler from restarting the compiler
					log('Locking Restart')
					await write('./norestart', '')

					// pre update
					log('Git Save Before Pulling')
					await spawn({
						command: 'git add --all'.split(' '),
					})
					await spawn({
						command: 'git commit -m "Pre Update"'.split(' '),
					})
					log('Git Pulling')
					await spawn({
						command: 'git pull'.split(' '),
					})

					// tell npm to bump the project version
					log('Bump Project Version With NPM')
					await spawn({
						command: 'call npm version patch --no-git-tag-version'.split(' '),
						callback: noop,
					})

					// write the version so its  usable on the frontend
					let version = JSON.parse(await read(project + 'package.json')).version
					await write('./version.js', '// AUTOGENERATED\nglobalThis.version ="' + version + '"')

					// track binary files
					log('Track Build Folder')
					await spawn({
						command: 'git update-index --no-skip-worktree client/dist/**'.split(' '),
						callback: noop,
						nostderr: true,
					}).catch(noop)

					// write version to index
					log('Write Version To Index')
					let index = await read(project + options.folders.client + 'index.html')
					await write(
						project + options.folders.client + 'index.html',
						index
							.replace(/\.js\?[^"']+/g, '.js?' + version)
							.replace(/\.css\?[^"']+/g, '.css?' + version),
					)

					// have to give a grace period for the build to finish
					log('Waiting For Build')
					await sleep(4)

					// commit add
					log('Git Add')
					await spawn({
						command: 'git add --all'.split(' '),
					})

					// commit all and push
					log('Git Committing')
					await spawn({
						command: ('git commit -m "' + version + '"').split(' '),
					})

					// commit all and push
					log('Git Pushing')
					await spawn({
						command: 'git push server'.split(' '),
					})

					// untrack build
					log('Untrack Build Folder')
					await spawn({
						command: 'git update-index --skip-worktree client/dist/**'.split(' '),
						callback: noop,
						nostderr: true,
					}).catch(noop)

					log('Unlocking Restart')
					await remove('./norestart')

					no_git_status = false

					yellow('Site updated in ' + enlapsed(start) + ' seconds')
					console.log()

					break
				}
				default: {
					if (/^[0-9\s]+$/i.test(result)) {
						error('Unkown action ' + result)
					} else {
						await spawn({
							command: 'git add --all'.split(' '),
						})
						await spawn({
							command: ['git', 'commit', '-m', '"' + result + '"'],
						})
						await spawn({
							command: 'git pull origin'.split(' '),
						})
						await spawn({
							command: 'git push origin'.split(' '),
						})
					}
				}
			}
		})
	}
	ask()
})()
