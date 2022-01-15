class SQL {
	constructor(path) {
		// raw commands
		this.run = this.run.bind(this)

		// select commands
		this.select = this.select.bind(this)

		// modify commands
		this.modify = this.modify.bind(this)
		this.insert = this.modify
		this.insertReplace = this.modify
		this.update = this.modify
		this.delete = this.modify

		this.db = new require('better-sqlite3')(path, { timeout: 100 })

		this.db.pragma('secure_delete = false')
		this.db.pragma('auto_vacuum = 2') //incremental
		this.db.pragma('journal_mode = WAL')
		this.db.pragma('automatic_index=on')
	}

	run(q) {
		try {
			return this.db.exec(q)
		} catch (e) {
			console.error(e)
		}
	}
	select(q) {
		try {
			q = this.db.prepare(q)
		} catch (e) {
			console.error(e)
		}
		return q.all.bind(q)
	}
	modify(q) {
		try {
			q = this.db.prepare(q)
		} catch (e) {
			console.error(e)
		}

		return function (o) {
			try {
				return q.run(o).lastInsertRowid
			} catch (e) {
				console.error(e)
			}
		}
	}
}

const sql = new SQL(__dirname + '/../db.sqlite')

sql.run(`
			CREATE TABLE IF NOT EXISTS cache  (
				k TEXT NOT NULL DEFAULT '',
				v TEXT NOT NULL DEFAULT '',
				UNIQUE(k)
			);
		`)

sql.run(`CREATE INDEX IF NOT EXISTS k ON cache (k)`)

// insert or replace (if theres a unique id with the same id)
const insert = sql.insertReplace(`
			INSERT OR REPLACE INTO
				cache
					(k, v)
				VALUES
					(:k, :v)
		`)

const select = sql.select(`
			SELECT
				v
			FROM
				cache
			WHERE
				k = :k
		`)

db = function (k, v) {
	k = hash(k)
	if (v !== undefined) {
		insert({ k: k, v: v })
	} else {
		const ret = select({ k: k })[0]
		return ret && ret.v ? ret.v : ''
	}
}
