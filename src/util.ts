import * as pacote from 'pacote'
import {publish as _publish} from 'libnpmpublish'
import got from 'got'
import ssri from 'ssri'

export function namedScope(name: string) {
  const scope = name.match(/^(@[\w-]+)\/[\w-]+$/)
  return scope ? scope[1] : undefined
}

export function scopedOptions(scope: string | undefined, registry: string, token: string | undefined) {
  const scopedRegistry = scope ? scope + ':registry' : 'registry'
  const opts: Record<string, any> = {}
  opts[scopedRegistry] = registry
  if (token) {
    opts.token = token
  }
  return opts
}

export async function getPackument(name: string, options: Record<string, string>): Promise<Record<string, any>> {
  try {
    return await pacote.packument(name, options)
  } catch(error) {
    // TODO: special handling only for 404
    return null
  }
}

// export async function getTarball(spec: string, options: Record<string, string>) {
//   try {
//     return await pacote.tarball(spec, options)
//   } catch(error) {
//     console.error(error.code)
//     // TODO: special handling only for EINTEGRITY
//     return null
//   }
// }

export interface ManifestDist {
  integrity: string
  shasum: string
  tarball: string
}

function getIntegrity(dist: ManifestDist) {
  return dist.integrity ? dist.integrity : ssri.fromHex(dist.shasum, 'sha1').toString()
}

export async function fetchTarball(dist: ManifestDist, token?: string) {
  const res = got(dist.tarball, {
    headers: token ? {authorization: `Bearer ${token}`} : {},
    hooks: {
      // workaround for https://github.com/sindresorhus/got/issues/1090
      beforeRedirect: [
        (options) => {
          delete options.headers.authorization
        }
      ]
    }
  })
  const data = await res.buffer()
  const check = await ssri.checkData(data, getIntegrity(dist))
  if (!check) {
    throw new Error('EINTEGRITY')
  }
  return data
}

// Prepare manifest before publishing to target
export function prepareManifest(packument: Record<string, any>, version: string): Record<string, any> {
  const manifest = packument.versions[version]
  const latestVersion = packument['dist-tags'].latest

  // Remove source registry
  delete manifest.publishConfig

  // Always publish latest repository info
  manifest.repository = packument.versions[latestVersion].repository

  // Ensure we include the readme on the latest version
  if (!manifest.readme && version === latestVersion) {
    manifest.readme = packument.readme
    manifest.readmeFilename = packument.readmeFilename
  }

  return manifest
}

export async function publish(
    manifest: Record<string, any>,
    tarball: Buffer,
    options: Record<string, string>,
    dryRun = false): Promise<boolean> {
  if (dryRun) {
    console.log('Dry Run')
    return true
  }
  return _publish(manifest, tarball, options)
}
