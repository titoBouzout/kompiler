var should_restart_nginx = false

module.exports = {
	outdated: [
		{
			title: 'packages installed ',
			cwd: 'compile/',
			command: ['npm', 'list', '--depth=0'],
			callback: callback,
		},
		{
			title: 'packages outdated',
			cwd: 'compile/',
			command: ['npm', 'outdated'],
			callback: callback,
			noempty: true,
		},
		{
			title: 'packages installed ',
			cwd: 'www.socket/',
			command: ['npm', 'list', '--depth=0'],
			callback: callback,
		},
		{
			title: 'packages outdated',
			cwd: 'www.socket/',
			command: ['npm', 'outdated'],
			callback: callback,
			noempty: true,
		},
	],

	save: [
		{
			title: 'pre save',
			command: async function () {
				if (await exists('www.web/restart')) {
					should_restart_nginx = true
					await remove('www.web/restart')
				}
				await remove('compile/package-lock.json')
				await remove('www.socket/package-lock.json')
				await remove('diff.diff')
				await remove('log.diff')
				await remove('client.error')
			},
			sync: true,
			noempty: true,
		},
		{
			title: 'add files',
			command: ['git', 'add', '--all', './*'],
			sync: true,
			callback: callback,
			noempty: true,
		},
		{
			title: 'commit',
			command: ['git', 'commit', '--all', '-m', '"' + date.version_readable + '"'],
			sync: true,
			callback: callback,
			noempty: true,
		},
	],

	pull: [
		{
			title: 'pull',
			command: ['git', 'pull', '--all'],
			sync: true,
			callback: callback,
		},
	],
	reset: [
		{
			title: 'reset ',
			command: ['git', 'reset', '--hard'],
			sync: true,
			callback: callback,
		},
	],
	push: [
		{
			title: 'push',
			command: ['git', 'push', '--all', '--porcelain'],
			sync: true,
			callback: callback,
			nostderr: true,
		},
		{
			title: 'restart nginx ',
			command: async function () {
				if (should_restart_nginx) {
					should_restart_nginx = false
					log('Restarting nginx, configuration or php changed')
					return await ssh(
						'service nginx restart && service nginx reload && service nginx restart && systemctl restart php-fpm && service nginx status',
					)
				}
			},
			sync: true,
			noempty: true,
		},
	],
	status: [
		{
			title: 'status site',
			command: ['git', 'status', '-s'],
			noempty: true,
			norepeat: true,
			sync: true,

			callback: callback,
			last: '',
		},
	],
	log: [
		{
			title: 'pre log',
			command: async function () {
				remove('log.diff')
				await write('data/tmp/log.diff')
			},
			sync: true,
		},
		{
			title: 'get last 5 changes ',
			command: ['git log -n 5 -p --decorate --no-color', './*', '>', 'data/tmp/log.diff'],
			sync: true,
			noempty: true,
		},
		{
			title: 'show log',
			command: function () {
				return read('data/tmp/log.diff').then(
					function (c) {
						if (c !== '') {
							return spawn({ command: [is_osx() ? 'open' : 'start', 'data/tmp/log.diff'] })
						} else {
							log('No changes to show')
						}
					}.bind(this),
				)
			},
			noempty: true,
		},
	],
	changes: [
		{
			title: 'pre changes',
			command: async function () {
				remove('diff.diff')
				await write('data/tmp/changes.diff')
			},
			sync: true,
		},
		{
			title: 'get diff',
			command: ['git diff -w --diff-algorithm=patience', './*', '>', 'data/tmp/changes.diff'],
			sync: true,
		},
		{
			title: 'show diff',
			command: function () {
				return read('data/tmp/changes.diff').then(
					function (c) {
						if (c !== '') {
							return spawn({ command: [is_osx() ? 'open' : 'start', 'data/tmp/changes.diff'] })
						} else {
							log('No changes to show')
						}
					}.bind(this),
				)
			},
			noempty: true,
		},
	],
	server_logs: [
		{
			title: 'pre server logs',
			command: async function () {
				remove('client.error')
				remove('data/tmp/client.error')
				await write('data/tmp/client.error.txt')
			},
			sync: true,
		},
		{
			title: 'node logs',
			command: function () {
				return ssh('cat /w/' + config.domain + '/data/log/node')
			},
		},
		{
			title: 'nginx logs',
			command: function () {
				return ssh('cat /w/' + config.domain + '/data/log/web')
			},
		},
		{
			title: 'client logs',
			command: function () {
				return ssh(
					'cat /w/' + config.domain + '/data/log/js',
					function (data) {
						data = data.trim()
						if (data !== '') {
							data = data.replace(/js\/external\//g, '')
							data = data.replace(/www.client\//g, '')

							write('data/tmp/client.error.txt', data)

							var list = {}
							var hidden = 0
							var errors = data.split('\n21')
							for (var report of errors) {
								try {
									report = JSON.parse(
										report
											.replace(/\n+/g, '')
											.replace(/\s+/g, ' ')
											.replace(/^[^{]+{/, '{'),
									)
								} catch (e) {
									console.log(report, e)
									continue
								}

								/*	if (report.m && report.m.indexOf('__reactInternalInstance') !== -1) {
									delete report.m
								}*/
								if (
									report.s /*report.s.indexOf('react-dom') !== -1 ||
										report.s.indexOf('react-with-addons') !== -1 ||*/ &&
									(report.s.indexOf('errors.js') !== -1 ||
										report.s.indexOf('client-autoreload') !== -1 ||
										report.s.indexOf('chrome-extension') !== -1 ||
										false)
								) {
									delete report.s
								}

								// key it
								var k = report.e + report.l + report.c
								report.lc = ':' + report.l + ':' + report.c
								delete report.l
								delete report.c
								if (!list[k]) {
									list[k] = []
								}

								list[k].push(report)
							}

							var txt =
								'Showing ' + Object.keys(list).length + ' different errors, ' + hidden + ' hidden'

							for (var id in list) {
								txt += '\n\nAppears ' + list[id].length + ' times ' + '\n\n'
								txt += JSON.stringify(list[id][list[id].length - 1], null, 2)
							}

							return write('data/tmp/client.errors.txt', txt).then(
								function (c) {
									return spawn({
										command: [is_osx() ? 'open' : 'start', 'data/tmp/client.errors.txt'],
									})
								}.bind(this),
							)
						}
					}.bind(this),
				)
			},
		},
	],
	clear_logs: [
		{
			title: 'clear logs',
			command: function () {
				return ssh(
					"echo '' > /w/" +
						config.domain +
						"/data/log/node && echo '' > /w/" +
						config.domain +
						"/data/log/web && echo '' > /w/" +
						config.domain +
						'/data/log/js   ',
				)
			},
		},
	],
}

// command line input
;(function command_line_input() {
	const readline = require('readline')
	const rl = readline.createInterface({
		input: process.stdin,
	})

	function ask() {
		rl.question('', async function do_action(result, retrying) {
			display_status = false
			try {
				switch (+result) {
					// changes
					case 1: {
						hr(true)
						await run_action(actions.changes)
						hr(true)
						break
					}
					// save
					case 2: {
						hr(true)
						await compiler.compile(true)
						await run_action(actions.save)
						log('Saved changes!')
						hr(true)
						break
					}
					// push
					case 3: {
						hr(true)
						var now = Date.now()
						log('Updating live site.. (add, commit, pull, compile, add, commit, push)')

						await compiler.compile(true)
						await run_action(actions.save)
						try {
							await run_action(actions.push)
						} catch (e) {
							await run_action(actions.pull)
							await compiler.compile(true)
							await run_action(actions.save)
							await run_action(actions.push)
						}

						log('Site updated in ' + enlapsed(now) + ' seconds')
						hr(true)
						break
					}
					// npm shit
					case 4: {
						hr(true)
						await run_action(actions.outdated)
						break
					}
					// open local site
					case 5: {
						hr(true)
						if (process.platform == 'darwin') {
							exec(
								'open -a "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" http://localhost:' +
									config.port,
							)
						} else {
							exec('chrome http://localhost:' + config.port)
						}
						break
					}
					// git log changes
					case 6: {
						hr(true)
						await run_action(actions.log)
						break
					}
					// merge
					case 7: {
						hr(true)
						var now = Date.now()
						log('Download (add, commit, pull, compile, add, commit)')
						await compiler.compile(true)
						await run_action(actions.save)
						await run_action(actions.pull)
						await compiler.compile(true)
						await run_action(actions.save)
						log('Download done in ' + enlapsed(now) + ' seconds')
						hr(true)

						break
					}
					// server_logs
					case 8: {
						hr(true)
						await run_action(actions.server_logs)
						break
					}
					// clear_logs
					case 9: {
						hr(true)
						await run_action(actions.clear_logs)
						break
					}
					// reset
					case 11: {
						hr(true)
						await run_action(actions.reset)
						break
					}
				}
			} catch (e) {
				if (!retrying) {
					await sleep(1)
					console.log(e)
					log_error('Retrying last action due to an error..')
					do_action(result, true)
				} else {
					console.log(e)
				}
			}
			ask()
			display_status = true
		})
	}
	ask()
})()
