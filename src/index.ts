import {fetchTarball, getScopedOptions, prepareManifest, publish} from './utils'
import * as pacote from "pacote"
import {filterSourceVersions} from "./filters"
import {MigrationSettings} from "./settings"

const logger = require('pino')()

export async function syncPackages(settings: MigrationSettings) {
  let result = 0
  for (let i = 0; i < settings.packages.length; i++) {
    const npmPackage = settings.packages[i]
    logger.info(`[${npmPackage}] synchronisation started`)
    let versionsImported = await syncPackage(settings, npmPackage)
    logger.info(`[${npmPackage}] imported ${versionsImported} versions`)
    logger.info(`--------------------------`)

    result += versionsImported
  }
  return result
}

async function syncPackage(
  settings: MigrationSettings,
  packageName: string
) {
  // fullMetadata may be needed to obtain the repository property in manifest
  const srcPackument = await getPackageMetadata(settings.source, packageName, true)
  const srcVersions = filterSourceVersions(packageName, srcPackument, settings.migrationMode);
  logger.debug(`[${packageName}] pre-selected source version: ${srcVersions}`)

  if (srcVersions.length === 0) {
    logger.info(`[${packageName}] nothing to sync`)
    return 0
  }

  const dstPackument = await getPackageMetadata(settings.target, packageName, false)
  const dstVersions = dstPackument ? Object.keys(dstPackument.versions) : []
  logger.debug(`[${packageName}] found target versions: ${dstVersions}`)

  const srcLatestDistTag = (srcPackument != null) ? srcPackument['dist-tags'].latest : null
  let packageVersionsToPublish = calculateMissing(packageName, srcVersions, dstVersions, srcLatestDistTag)

  if (packageVersionsToPublish.length === 0) {
    logger.info(`[${packageName}] nothing to import`)
  } else {
    logger.info(`[${packageName}] versions to import: ${packageVersionsToPublish}`)
  }

  for (const packageVersion of packageVersionsToPublish) {
    await processPackageVersionHandleErrors(settings,
                                            packageName,
                                            packageVersion)
  }

  return packageVersionsToPublish.length
}

async function getPackageMetadata(source: Record<string, string>,
                                  packageName: string,
                                  fromSource: boolean) {
  const srcOptions = getScopedOptions(packageName, source)
  srcOptions.fullMetadata = fromSource
  return await getPackument(packageName, srcOptions, !fromSource)
}

export async function getPackument(name: string,
                                   options: Record<string, string>,
                                   ignoreNotFound: boolean): Promise<Record<string, any>> {
  try {
    return await pacote.packument(name, options)
  } catch (error) {
    if (error.message) {
      if (!ignoreNotFound || !error.message.startsWith("404 Not Found")) {
        logger.error(error.message)
      }
    } else {
      logger.error(error)
    }
    return null
  }
}

function calculateMissing(packageName: string, srcVersions: string[], dstVersions: string[], srcLatestDistTag?: string) {
  let missing = srcVersions.filter(x => !dstVersions.includes(x))
  if (missing.length != 0 && srcLatestDistTag != null) {
    placePackageWithLatestDistDagInTheEnd(packageName, missing, srcLatestDistTag)
  }
  return missing
}

function placePackageWithLatestDistDagInTheEnd(packageName: string, missing: string[], srcLatestDistTag: string) {
  /*
    Covers the rare case that the highest version
    is not the version the `latest` dist tag points to.
    This code makes sure the last version in the array
    is the latest, so it's published last and GitHub will
    then make it's latest dist tag point to it.

    e.g [1.5.6, 2.0.0] but latest is 1.5.6, will change to [2.0.0, 1.5.6]
  */
  const lastVersionInMissing = missing[missing.length - 1]
  if (srcLatestDistTag !== lastVersionInMissing) {
    logger.debug(`[${packageName}] highest version is not same as latest dist tag!`)
    missing = missing.filter(x => x !== srcLatestDistTag)
    missing.push(srcLatestDistTag)
    logger.debug(`[${packageName}] updated publish order of missing versions: ${missing}`);
  }
}

async function processPackageVersionHandleErrors(settings: MigrationSettings,
                                                 packageName: string,
                                                 packageVersion: string) {
  try {
    await processPackageVersion(settings,
                                packageName,
                                packageVersion)
  } catch (error) {
    logger.error(error)
  }
}

async function processPackageVersion(settings: MigrationSettings,
                                     packageName: string,
                                     packageVersion: string) {
  const spec = packageName + '@' + packageVersion
  logger.info(`[${spec}] start importing`)

  logger.debug(`[${packageName}] reading ${spec} from ${settings.source.registry}`)
  const srcPackument = await getPackageMetadata(settings.source, packageName, true)
  const manifest = prepareManifest(srcPackument, packageVersion, settings.repositoryFieldNewValue)
  logger.debug(`[${packageName}] dist ${manifest.dist}`)

  const tarball = await fetchTarball(manifest.dist, settings.source.token)
  logger.debug(`[${packageName}] tarball length: ${tarball.length}`)

  logger.debug(`[${packageName}] do publish ${spec} to ${settings.target.registry}`)
  const dstOptions = getScopedOptions(packageName, settings.target)
  await publish(manifest, tarball, dstOptions, settings.dryRun)
  logger.info(`[${spec}] finish importing`)
}