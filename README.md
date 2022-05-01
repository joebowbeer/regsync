# @joebowbeer/regsync [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=joebowbeer_regsync&metric=coverage)](https://sonarcloud.io/summary/new_code?id=joebowbeer_regsync)
Publish package versions from one registry into another.

```shell script
regsync --name @scope/pkgname \
 --from.registry https://registry.npmjs.org/ --from.token $NPM_TOKEN \
 --to.registry https://npm.pkg.github.com --to.token $GITHUB_TOKEN
```
