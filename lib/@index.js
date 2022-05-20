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
	this.crypto = this.crypto || require('crypto')
	return this.crypto.createHash('sha1').update(s).digest('hex')
}

prompt = function (s) {
	this.prompt = this.prompt || require('prompt-sync')()
	return String(this.prompt('\x1b[33m' + s + '\x1b[0m ')).trim()
}
