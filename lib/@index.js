promise = function (fn) {
	if (typeof fn == 'function') {
		return new Promise(function (resolve, reject) {
			if (fn.constructor.name === 'AsyncFunction') {
				return fn().then(function (ret) {
					return resolve(ret)
				})
			} else {
				if (fn.length) {
					return fn(resolve, reject)
				} else {
					let ret = fn()
					if (ret && ret.then) return ret.then(resolve)
					else return resolve(ret)
				}
			}
		})
	} else {
		let promises = []
		let fn = function (fn) {
			promises.push(promise(fn))
		}
		fn.promises = promises
		fn.all = function (fn) {
			return Promise.all(promises).then(fn)
		}
		fn.sync = async function () {
			for (let i = 0; i < promises.length; i++) {
				await promises[i]()
			}
		}
		return fn
	}
}

noop = function () {}

is_osx = function () {
	return process.platform == 'darwin'
}
is_windows = function () {
	return /^win/i.test(process.platform)
}

unique = function (b) {
	let a = []
	for (let i = 0, l = b.length; i < l; i++) {
		if (a.indexOf(b[i]) === -1) a.push(b[i])
	}
	return a
}

sleep = function (seconds) {
	return promise(function (resolve) {
		setTimeout(resolve, seconds * 1000)
	})
}

fixed = function (v) {
	return +v.toFixed(2)
}
enlapsed = function (v) {
	return fixed((Date.now() - v) / 1000) + 's'
}

hash = function (s) {
	return require('crypto').createHash('sha1').update(s).digest('hex')
}

prompt = function (s) {
	this.prompt = this.prompt || require('prompt-sync')()
	return String(this.prompt('\x1b[33m' + s + '\x1b[0m ')).trim()
}

time = function (time) {
	if (time) var date = new Date(time)
	else var date = new Date()
	return (
		(date.getHours() < 10 ? '0' : '') +
		date.getHours() +
		':' +
		(date.getMinutes() < 10 ? '0' : '') +
		date.getMinutes() +
		':' +
		(date.getSeconds() < 10 ? '0' : '') +
		date.getSeconds()
	)
}

random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

// used to always use the same port for a given folder

seeded_random = function (min, max, seed) {
	seed = xmur3(seed)()

	seed = (seed * 9301 + 49297) % 233280
	let rnd = seed / 233280

	return (min + rnd * (max - min)) | 0
}

xmur3 = function (str) {
	for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
		(h = Math.imul(h ^ str.charCodeAt(i), 3432918353)), (h = (h << 13) | (h >>> 19))
	return function () {
		h = Math.imul(h ^ (h >>> 16), 2246822507)
		h = Math.imul(h ^ (h >>> 13), 3266489909)
		return (h ^= h >>> 16) >>> 0
	}
}

today = function () {
	return new Date().getDate()
}

hour = function () {
	return new Date().getHours()
}
