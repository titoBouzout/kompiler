
git add --all
git commit -m "update"

call npm version patch -f --no-git-tag-version

git commit -m -a "update"

git push --all --prune

call npm publish

