## Npm Registries Migration Tool

**Migrate npm packages from one npm registry into another**

### Usage
```bash
npm install -g @rugpanov/regsync

regsync --packages "pacote" "@babel/core" \
 --from.registry https://registry.npmjs.org/ --from.token $NPM_TOKEN \
 --to.registry http://localhost:8390/npm/p/mp/npm/ --to.token $GITHUB_TOKEN
```

### Additional arguments
* `dry-run` - does everything except publish
* `latest-only` - syncs only the latest dist-tag version
* `latest-majors` - syncs only the latest majors
* `repository` - overrides the repository field in the package.json with provided value


### Tool development
```bash
./dist/cli.js --packages "pacote" "@babel/core" --from.registry https://registry.npmjs.org/ --to.registry http://localhost:8390/npm/p/mp/npm/
```
