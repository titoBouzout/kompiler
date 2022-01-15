;(function () {
	if (location.hostname === 'localhost') {
		;(function autoreload() {
			let socket = new WebSocket('ws://localhost:' + (+location.port - 1))
			socket.onmessage = function (m) {
				if (m.data === 'reload') {
					location.reload()
				} else {
					m = JSON.parse(m.data)
					console.error(m.message, 'on file', m.file, 'line', m.line, '\n', m.code.trim())
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
