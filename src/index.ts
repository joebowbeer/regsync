import {fetchTarball, getPackument, namedScope, prepareManifest, publish, scopedOptions} from './util'

export async function sync(name: string, from: Record<string, string>, to: Record<string, string>, dryRun = false) {
  // TODO: handle version spec
  const scope = namedScope(name)
  console.debug('scope', scope)

  // get available source versions
  const srcOptions = scopedOptions(scope, from.registry, from.token)
  // fullMetadata may needed to obtain the repository property in manifest
  srcOptions.fullMetadata = true
  const srcPackument = await getPackument(name, srcOptions)
  const srcVersions = srcPackument ? Object.keys(srcPackument.versions) : []
  console.debug('Source versions', srcVersions)

  // get available target versions
  const dstOptions = scopedOptions(scope, to.registry, to.token)
  const dstPackument = await getPackument(name, dstOptions)
  const dstVersions = dstPackument ? Object.keys(dstPackument.versions) : []
  console.debug('Target versions', dstVersions)

  const missing = srcVersions.filter(x => !dstVersions.includes(x))
  console.log('Missing versions', missing)
  if (!missing.length) {
    return 0
  }

  // Always publish latest repository info
  const latestRepository = srcPackument.versions[srcPackument['dist-tags'].latest].repository
  console.debug('Latest repository', latestRepository)

  for (const version of missing) {
    const spec = name + '@' + version
    console.log('Reading %s from %s', spec, from.registry)

    const manifest = srcPackument.versions[version]
    console.debug('Dist', manifest.dist)

    //const tarball = await getTarball(spec, srcOptions)
    const tarball = await fetchTarball(manifest.dist, from.token)
    console.debug('Tarball length', tarball.length)

    prepareManifest(manifest, latestRepository)

    console.log('Publishing %s to %s', spec, to.registry)
    await publish(manifest, tarball, dstOptions, dryRun)
  }
  return missing.length
}
