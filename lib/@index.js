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
		fn.all = function (fn) {
			return Promise.all(promises).then(fn)
		}
		return fn
	}
}

Promise.sync = async function (promises) {
	for (let i = 0; i < promises.length; i++) {
		await promises[i]()
	}
}

noop = function () {}

is_osx = function () {
	return process.platform == 'darwin'
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

crypto = require('crypto')

hash = function (s) {
	return crypto.createHash('md4').update(s).digest('hex')
}

const _prompt = require('prompt-sync')()
prompt = function (s) {
	return String(_prompt('\x1b[33m' + s + '\x1b[0m ')).trim()
}
