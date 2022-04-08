;(function () {
	if (location.hostname === 'localhost' || /^[0-9.]+$/.test(location.hostname)) {
		;(function autoreload() {
			let socket = new WebSocket('ws://localhost:' + (+location.port - 1))
			socket.onmessage = function (m) {
				if (m.data === 'reload') {
					location.reload()
				} else if (m.data === 'reload-css') {
					let links = document.getElementsByTagName('link')
					for (let i = 0; i < links.length; i++) {
						let link  =links[i]
						if (link.getAttribute('rel') == 'stylesheet') {
							if(link.href.indexOf('/'+location.host+'/') !== -1){
								link.href = link.href.replace(/\.css.*$/, '.css?'+Date.now())
							}
						}
					}
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
