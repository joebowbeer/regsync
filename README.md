## Npm Registries Migration Tool

**Migrate npm packages from one npm registry into another**

### Usage
```shell script
regsync --name @scope/pkgname1 @scope/pkgname2 @scope/pkgname3 \
 --from.registry https://registry.npmjs.org/ --from.token $NPM_TOKEN \
 --to.registry http://localhost:8390/npm/p/mp/npm/ --to.token $GITHUB_TOKEN
```

### Additional arguments
* `dry-run` - does everything except publish
* `latest-only` - syncs only the latest dist-tag version
* `latest-only` - syncs only the latest majors
* `repository` - overrides the repository field in the package.json with provided value
