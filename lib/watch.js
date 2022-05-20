const chokidar = require('chokidar')

let queue = {}
let cached_hashes = {}
watch = async function (key, w, cb, only_folder_changes) {
	let k = hash(w + cb.toString())
	let as_directory = false
	let hashes = {}
	let timeouts = {}

	async function run(a, f) {
		if (!f) return

		if (as_directory) {
			if (is_windows()) {
				f = normalize(w + '/' + f)
			}
		} else {
			f = w
		}
		if (is_directory(f)) {
			return
		}
		if (
			f.indexOf('.git/') === -1 &&
			f.indexOf('data/') === -1 &&
			f.indexOf('.vscode/') === -1 &&
			f.indexOf('.sqlite') === -1 &&
			f.indexOf('.md') === -1 &&
			f.indexOf('.cache/') === -1 &&
			f.indexOf('package-lock.json') === -1
		) {
			let kk = only_folder_changes ? k : k + f
			queue[kk] = queue[kk] || []
			queue[kk].push(f)
			clearTimeout(timeouts[kk])
			timeouts[kk] = setTimeout(async function () {
				let files = unique(queue[kk])
				queue[kk] = false
				for (let file of files) {
					let h = await hash_file(file)
					if (h !== hashes[file]) {
						hashes[file] = h
						cached_hashes[file] = h
						key && blue(key)
						key && log('changed - ' + relative(file))
						cb(file)
						if (only_folder_changes) return
					}
				}
			}, 50)
		}
	}

	try {
		w = normalize(w)
		if (is_directory(w)) {
			as_directory = true

			let promises = promise()

			let _files = await list(w)
			for (let file of _files) {
				if (
					file.indexOf('.git/') !== -1 ||
					file.indexOf('data/') !== -1 ||
					file.indexOf('.sqlite') !== -1 ||
					file.indexOf('.cache/') !== -1
				)
					continue
				promises(async function () {
					if (cached_hashes[file] !== undefined) {
						hashes[file] = cached_hashes[file]
					} else {
						hashes[file] = await hash_file(file)
						cached_hashes[file] = hashes[file]
					}
				})
				if (promises.promises.length % 200 === 0) {
					await promises.all()
				}
			}
			promises.all(function () {
				if (!is_windows()) {
					chokidar.watch(w).on('all', (event, path) => {
						run(event, path)
					})
				} else {
					fs.watch(w, { recursive: true }, run)
				}
			})
		} else {
			if (cached_hashes[w] !== undefined) {
				hashes[w] = cached_hashes[w]
			} else {
				hashes[w] = await hash_file(w)
			}
			if (!is_windows()) {
				chokidar.watch(w).on('all', (event, path) => {
					run(event, path)
				})
			} else {
				fs.watch(w, run)
			}
		}
	} catch (e) {
		console.error(e)
	}
}
