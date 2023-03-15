let data

let path = compiler + '/.cache/db.json'

try {
	data = require(path)
} catch {
	data = {}
}

function save() {
	write(path, JSON.stringify(data))
}

let timeout = false

db = function (k, v) {
	if (v !== undefined) {
		data[k] = v
		clearTimeout(timeout)
		timeout = setTimeout(save, 100)
	} else {
		return data[k]
	}
}
