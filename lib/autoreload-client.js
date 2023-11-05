;(function () {
	const location = window.location
	if ('__IS_LOCALHOST__') {
		;(function autoreload() {
			let socket = new WebSocket('ws://' + location.hostname + ':' + (+location.port - 1))
			socket.onmessage = function (m) {
				if (m.data === 'reload') {
					location.reload()
				} else if (m.data === 'reload-css') {
					let links = document.getElementsByTagName('link')
					for (let i = 0; i < links.length; i++) {
						let link = links[i]
						if (
							link.rel === 'stylesheet' &&
							link.href.indexOf('/' + location.host + '/') !== -1
						) {
							link.href = link.href.replace(/\.css.*$/, '.css?' + Date.now())
						}
					}
				} else {
					m = JSON.parse(m.data)
					m.error
						? console.error('Compiler Error:', m.error, m.frame || '')
						: console.error(
								m.message,
								'on file',
								m.file,
								'line',
								m.line,
								'\n',
								(m.frame || '').trim(),
						  )
				}
			}
			let timeout = false
			socket.onclose = socket.onerror = function () {
				clearTimeout(timeout)
				timeout = setTimeout(autoreload, 200)
			}
		})()
	}
})()
