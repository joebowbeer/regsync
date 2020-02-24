# regsync
Publish package versions from one registry into another.

```shell script
regsync --name @scope/pkgname \
 --from.registry https://registry.npmjs.org/ --from.token $NPM_TOKEN \
 --to.registry https://npm.pkg.github.com --to.token $GITHUB_TOKEN
```
