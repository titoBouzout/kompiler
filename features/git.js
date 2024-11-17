promise(function git() {
	run(
		'git config merge.ours.driver true && git config color.ui auto && git config diff.mnemonicPrefix true && git config diff.renames true',
		{
			sync: true,
			callback: noop,
			nostderr: true,
		},
	)
})
