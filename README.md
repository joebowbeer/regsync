## Npm Registries Migration Tool

**Migrate npm packages from one npm registry into another**

### Usage with npm

#### 1. Install
```shell
npm install -g @joebowbeer/regsync
```

#### 2. Execute 
**Interactive mode**
```shell
regsync
```
**Provide parameters as cli arguments**
```shell
regsync --packages "pacote" "@babel/core" \
 --from.registry https://registry.npmjs.org/ \
 --from.token $NPM_TOKEN \
 --to.registry http://localhost:8390/npm/p/mp/npm/ \
 --to.token $GITHUB_TOKEN
```

### Usage with docker (under development)
```shell
docker pull registry.jetbrains.team/p/crl/docker-public/rugpanov/regsync

docker run --name regsync --rm -ti rugpanov/regsync /bin/bash \
-c 'regsync --packages "pacote" "@babel/core" \
--from.registry https://registry.npmjs.org \
--to.registry https://npm.pkg.github.com \
--to.token MY_TOKEN \
--latest-only'
```

### Additional arguments
* `dry-run` - does everything except publish
* `latest-only` - syncs only the latest dist-tag version
* `latest-majors` - syncs only the latest majors
* `repository` - overrides the repository field in the package.json with provided value


### Development
```shell
./dist/cli.js --packages "pacote" "@babel/core" \
--from.registry https://registry.npmjs.org/ \
--to.registry http://localhost:8390/npm/p/mp/npm/ 
```
or
```shell
docker build -t rugpanov/regsync .

docker run --name regsync --rm -ti rugpanov/regsync /bin/bash \
-c 'regsync --packages "pacote" "@babel/core" \
--from.registry https://registry.npmjs.org \
--to.registry https://npm.pkg.github.com \
--to.token MY_TOKEN \
--latest-only'
```
