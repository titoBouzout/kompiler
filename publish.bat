
git add --all
git commit -m "update"

call npm version minor

git add --all
git commit -m "update version"

git push --all --prune

npm update -g kompiler
