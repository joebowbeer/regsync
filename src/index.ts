import {fetchTarball, getManifest, getVersions, namedScope, publish, scopedOptions} from './util'

export async function sync(name: string, from: Record<string, string>, to: Record<string, string>) {
  // TODO: handle version spec
  const scope = namedScope(name)
  console.debug('scope', scope)

  // get available source versions
  const srcOptions = scopedOptions(scope, from.registry, from.token)
  const srcVersions = await getVersions(name, srcOptions)
  console.debug('Source versions', srcVersions)

  // get available target versions
  const dstOptions = scopedOptions(scope, to.registry, to.token)
  const dstVersions = await getVersions(name, dstOptions)
  console.debug('Target versions', dstVersions)

  const missing = srcVersions.filter(x => !dstVersions.includes(x))
  console.log('Missing versions', missing)

  // fullMetadata is needed to obtain the repository property in manifest
  srcOptions.fullMetadata = true

  for (const version of missing) {
    const spec = name + '@' + version
    console.log('Reading ' + spec)

    const manifest = await getManifest(spec, srcOptions)
    console.debug('Dist', manifest.dist)

    //const tarball = await getTarball(spec, srcOptions)
    const tarball = await fetchTarball(manifest.dist, from.token)
    console.debug('Tarball length', tarball.length)

    // remove source registry from manifest before publishing to target
    delete manifest.publishConfig

    await publish(manifest, tarball, dstOptions)
    console.log('Published ' + spec)
  }
  console.log('ok')
}
