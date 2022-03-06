fs = require('fs')
util = require('util')
path = require('path')
glob = require('glob')

request = require('request')

_read = util.promisify(fs.readFile)
_write = util.promisify(fs.writeFile)
_remove = util.promisify(fs.unlink)
_mkdir = util.promisify(fs.mkdir)
_access = util.promisify(fs.access)
_copyFile = util.promisify(fs.copyFile)

dirname = function (f) {
	f = join(arguments)
	return path.dirname(f)
}
basename = function (f) {
	f = join(arguments)
	return path.basename(f)
}
mkdir = function (f) {
	f = join(arguments)
	return _mkdir(dirname(f), { recursive: true })
}
normalize = function (f) {
	return path.resolve(f).replace(/\\/g, '/')
}
is_min = function (f) {
	f = join(arguments)
	return /(-|\.)(min|dev|development|umd)(-|\.)/.test(f)
}
relative = function (f) {
	f = join(arguments)
	return f.replace(project, '')
}

join = function () {
	let file
	if (typeof arguments[0] === 'object') {
		file = arguments[0]
		if (typeof file[0] === 'object' || file[0] === undefined) {
			file = file[0]
		}
	} else {
		file = arguments
	}
	return normalize(path.join.apply('', file))
}

exists = function (f) {
	f = join(arguments)
	return _access(f, fs.constants.F_OK)
		.then(err => {
			return true
		})
		.catch(err => {
			return false
		})
}

read = function (f) {
	f = join(arguments)
	return _read(f, 'utf8').catch(function () {
		return ''
	})
}
read_bin = function (f) {
	f = join(arguments)
	return _read(f)
}

write = function (f, c) {
	return mkdir(f).then(function () {
		return _write(f, String(c || ''), 'utf8')
	})
}

write_bin = function (f, c) {
	return mkdir(f).then(function () {
		return _write(f, c)
	})
}

copy = function (s, d) {
	return mkdir(d).then(function () {
		return _copyFile(s, d)
	})
}

remove = function (f) {
	f = join(arguments)
	return _remove(f).catch(function () {})
}

is_directory = function (f) {
	f = join(arguments)
	try {
		return fs.lstatSync(f).isDirectory()
	} catch (e) {
		return false
	}
}

hash_file = function (f) {
	f = join(arguments)
	return read(f).then(function (c) {
		return hash(c)
	})
}
list = function (f) {
	f = join(arguments)
	return promise(function (resolve, reject) {
		if (is_directory(f)) {
			return glob(
				f + '/**',
				{
					nodir: true,
					dot: true,
				},
				function (err, f) {
					if (err) resolve([])
					else resolve(f)
				},
			)
		} else {
			return resolve([f])
		}
	})
}
