import { publish as _publish } from 'libnpmpublish'
import got from 'got'
import ssri from 'ssri'
import URL from "url"
import {MigrationSettings} from "./settings";

const logger = require('pino')()

export function getScopedOptions(packageName: string, source: Record<string, string>) {
  const scope = getNamedScope(packageName)
  return scopedOptions(scope, source.registry, source.token)
}

// exposed for testing
export function getNamedScope(name: string) {
  const scope = name.match(/^(@[\w-]+)\/[\w-]+$/)
  return scope ? scope[1] : undefined
}

function scopedOptions(scope: string | undefined, registry: string, token: string | undefined) {
  const scopedRegistry = scope ? scope + ':registry' : 'registry'
  const opts: Record<string, any> = {}
  opts[scopedRegistry] = registry
  if (token) {
    opts.token = token
  }
  return opts
}

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
    headers: token ? { authorization: `Bearer ${token}` } : {},
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
export function prepareManifest(packument: Record<string, any>, version: string, repository?: string): Record<string, any> {
  const manifest = packument.versions[version]
  const latestVersion = packument['dist-tags'].latest

  // Remove source registry
  delete manifest.publishConfig

  // Always publish latest repository info
  manifest.repository = repository || packument.versions[latestVersion].repository

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
    return true
  }
  return _publish(manifest, tarball, options)
}

export function isValidUrl(str: string): boolean {
  let url

  try {
    url = new URL.URL(str)
  } catch (_) {
    return false
  }

  return url.protocol === "http:" || url.protocol === "https:"
}

export async function ensureRepositoryAccess(settings: MigrationSettings) {
  try {
    const sourceResponse = await got(`${settings.source.registry}/-/ping`, {
      headers: settings.source.token ? {authorization: `Bearer ${settings.source.token}`} : {}
    })
    logger.debug(`Source repository status (read access): ${sourceResponse.statusCode}`)
  } catch (e) {
    logger.error(`No read access for source repository`, e)
    return false
  }

  try {
    const targetResponse = await got(`${settings.target.registry}/-/ping?write=true`, {
      headers: settings.target.token ? { authorization: `Bearer ${settings.target.token}` } : {}
    })
    logger.debug(`Target repository status (write access): ${targetResponse.statusCode}`)
  } catch (e) {
    logger.error(`No write access for target repository`, e)
    return false
  }

  return true
}