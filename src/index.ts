import { fetchTarball, getPackument, namedScope, prepareManifest, publish, scopedOptions } from './util'
import semver from 'semver';

export async function sync(name: string, from: Record<string, string>, to: Record<string, string>, dryRun = false, latestOnly = false, latestMajors = false) {
  // TODO: handle version spec
  const scope = namedScope(name)
  console.debug('scope', scope)

  // get available source versions
  const srcOptions = scopedOptions(scope, from.registry, from.token)
  // fullMetadata may needed to obtain the repository property in manifest
  srcOptions.fullMetadata = true
  const srcPackument = await getPackument(name, srcOptions)
  const srcVersionsRaw = srcPackument ? Object.keys(srcPackument.versions) : []

  console.debug('Source versions raw', srcVersionsRaw)

  let srcVersions = srcVersionsRaw;

  if (srcPackument && latestOnly) {
    srcVersions = [srcPackument['dist-tags'].latest]
  } else if (srcVersionsRaw.length && latestMajors) {
    srcVersions = Array.from(semver.rsort(srcVersionsRaw).reduce((acc, version) => {
      const major = semver.major(version)
      if (!acc.has(major)) {
        acc.set(major, version.toString())
      }

      return acc;
    }, new Map).values()).reverse() as string[]
  }

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

  for (const version of missing) {
    const spec = name + '@' + version
    console.log('Reading %s from %s', spec, from.registry)

    const manifest = prepareManifest(srcPackument, version)
    // console.debug('Dist', manifest.dist)

    //const tarball = await getTarball(spec, srcOptions)
    const tarball = await fetchTarball(manifest.dist, from.token)
    // console.debug('Tarball length', tarball.length)

    console.log('Publishing %s to %s', spec, to.registry)
    await publish(manifest, tarball, dstOptions, dryRun)
  }
  return missing.length
}
