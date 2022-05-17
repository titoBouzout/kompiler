const imagemin = require('imagemin')
const imageminOptipng = require('imagemin-optipng')
const imageminGifsicle = require('imagemin-gifsicle')
const imageminJpegtran = require('imagemin-jpegtran')

const process_image_options = {
	imageminOptipng: { optimizationLevel: 7, interlaced: true },
	imageminGifsicle: { interlaced: true, optimizationLevel: 3 },
	imageminJpegtran: { progressive: true },
}
const process_image_options_h = JSON.stringify(process_image_options)

process_image = async function (f) {
	if (/\.(png|jpg|jpeg|gif)$/i.test(f) && f.indexOf('node_modules') === -1) {
		let h = hash((await hash_file(f)) + process_image_options_h)
		if (await db(h)) {
			// already optimized
		} else {
			const start = Date.now()

			const original = await read_bin(f)
			const optimized = await imagemin.buffer(original, {
				plugins: [
					imageminOptipng(process_image_options.imageminOptipng),
					imageminGifsicle(process_image_options.imageminGifsicle),
					imageminJpegtran(process_image_options.imageminJpegtran),
				],
			})
			if (optimized.length > 2 && optimized.length < original.length) {
				await write_bin(f, optimized)
				h = hash((await hash_file(f)) + process_image_options_h)
				db(h, 1)
				return (
					relative(f) +
					' in ' +
					enlapsed(start) +
					', saved ' +
					fixed((original.length - optimized.length) / 1024) +
					'kb'
				)
			} else {
				db(h, 1)
			}
		}
		return true
	}
}
