const timeouts = {},
	files = {},
	hidden_keys = {
		'Optimize images': true,
		'Auto refresh': true,
		'Git Status': true,
		'Restarting Socket Server': true,
	}
watch = function (key, w, cb, time, only_folder_changes) {
	const k = hash(w + cb.toString())
	let as_directory = false

	function run(a, f) {
		if (!f) return

		if (as_directory) {
			f = normalize(w + '/' + f)
		} else {
			f = w
		}
		if (is_directory(f)) {
			return
		}
		if (
			f.indexOf('.git/') === -1 &&
			f.indexOf('data/') === -1
			// f.indexOf('node_modules') === -1 &&
			// f.indexOf('package-lock.json') === -1
		) {
			clearTimeout(timeouts[k + (!only_folder_changes ? f : '')])
			timeouts[k + (!only_folder_changes ? f : '')] = setTimeout(function () {
				fs.stat(f, function (err, stats) {
					stats = stats || {}
					stats = [stats.ctimeMs, stats.mtimeMs, stats.birthtimeMs, stats.size].join(',')
					if (files[k + f] !== stats) {
						files[k + f] = stats
						if (!hidden_keys[key]) console.log(key + ' changed', relative(f))
						cb(f)
					} else {
						if (!hidden_keys[key]) console.log(key + ' didnt change', relative(f))
					}
				})
			}, time || 50)
		}
	}

	w = normalize(w)
	if (is_directory(w)) {
		as_directory = true
		try {
			fs.watch(w, { recursive: true }, run)
		} catch (e) {}
	} else {
		try {
			fs.watch(w, run)
		} catch (e) {}
	}
}
