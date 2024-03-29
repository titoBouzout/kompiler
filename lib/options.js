module.exports = promise(async function () {
	if (await exists(project + 'package.json')) {
		try {
			options = require(project + 'package.json')
		} catch (e) {
			options = {}
		}
	} else {
		options = {}
	}

	if (!options.kompiler) {
		options.kompiler = {}
	}

	options = options.kompiler

	if (options.env) {
		Object.assign(process.env, options.env)
	}
	return options
})
