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

hash_file = async function (f) {
	f = join(arguments)
	return read(f).then(function (c) {
		return hash(c)
	})
}
list = async function (f) {
	f = join(arguments)

	if (is_directory(f)) {
		let results = await glob(f + '/**', {
			nodir: true,
			dot: true,
		})
		for (let i = 0; i < results.length; i++) {
			results[i] = results[i].replace(/\\/g, '/')
		}
		return results
	} else {
		return [f]
	}
}

find = async function (f, find) {
	let files = await list(f)
	let result = []
	for (let file of files) {
		if (
			file.indexOf('data/') === -1 &&
			file.indexOf('.vscode/') === -1 &&
			file.indexOf('node_modules/') === -1 &&
			file.indexOf('.cache/') === -1
		) {
			if (basename(file) === find) {
				result.push(file)
			}
		}
	}
	return result
}

open_file = function (file) {
	if (is_osx()) {
		return spawn({
			command: ['open', file],
		})
	} else if (is_windows()) {
		return spawn({
			command: ['start', file],
		})
	} else {
		return spawn({
			command: ['xdg-open', file],
		}).catch(() => console.log('Couldnt open', file, 'on this system'))
	}
}
