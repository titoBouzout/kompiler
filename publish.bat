
git add --all
git commit -m "update"

call npm version patch

git commit -m "update"

git push --all --prune

call npm publish

