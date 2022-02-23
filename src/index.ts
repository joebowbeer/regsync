import {fetchTarball, getScopedOptions, prepareManifest, publish} from './utils'
import * as pacote from "pacote";
import {filterSourceVersions} from "./filters";

export async function syncPackages(
  names: string[],
  from: Record<string, string>,
  to: Record<string, string>,
  dryRun = false,
  latestOnly = false,
  latestMajors = false,
  repositoryFieldNewValue?: string
) {
  let result = 0
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    console.debug(`Synchronizing ${name}`)

    result += await syncPackage(name, from, to, dryRun, latestOnly, latestMajors, repositoryFieldNewValue)
  }
  return result
}

async function syncPackage(
  packageName: string,
  source: Record<string, string>,
  target: Record<string, string>,
  dryRun = false,
  latestOnly = false,
  latestMajors = false,
  repositoryFieldNewValue?: string
) {

  // fullMetadata may be needed to obtain the repository property in manifest
  const srcPackument = await getPackageMetadata(source, packageName, true)
  const srcVersions = filterSourceVersions(srcPackument, latestOnly, latestMajors);
  console.debug('Pre-selected source version', srcVersions)

  if (srcVersions.length === 0) {
    console.info("Nothing to sync")
    return 0
  }

  const dstPackument = await getPackageMetadata(target, packageName, false)
  const dstVersions = dstPackument ? Object.keys(dstPackument.versions) : []
  console.debug('Target versions', dstVersions)

  const srcLatestDistTag = (srcPackument != null) ? srcPackument['dist-tags'].latest : null
  let packageVersionsToPublish = calculateMissing(srcVersions, dstVersions, srcLatestDistTag)

  for (const packageVersion of packageVersionsToPublish) {
    await publishPackage(packageName,
                         packageVersion,
                         target,
                         source,
                         srcPackument,
                         repositoryFieldNewValue,
                         dryRun)
  }

  return packageVersionsToPublish.length
}

async function getPackageMetadata(source: Record<string, string>,
                                  packageName: string,
                                  shouldRequestFullMetadata: boolean) {
  const srcOptions = getScopedOptions(packageName, source)
  srcOptions.fullMetadata = shouldRequestFullMetadata
  return await getPackument(packageName, srcOptions)
}

export async function getPackument(name: string, options: Record<string, string>): Promise<Record<string, any>> {
  try {
    return await pacote.packument(name, options)
  } catch (error) {
    if (error.message) {
      console.log(error.message)
    } else {
      console.log(error)
    }
    return null
  }
}

function calculateMissing(srcVersions: string[], dstVersions: string[], srcLatestDistTag?: string) {
  let missing = srcVersions.filter(x => !dstVersions.includes(x))
  if (missing.length != 0 && srcLatestDistTag != null) {
    placePackageWithLatestDistDagInTheEnd(missing, srcLatestDistTag)
  }
  console.log('Missing versions', missing)
  return missing
}

function placePackageWithLatestDistDagInTheEnd(missing: string[], srcLatestDistTag: string) {
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
    console.log('Highest version is not same as latest dist tag!')
    missing = missing.filter(x => x !== srcLatestDistTag)
    missing.push(srcLatestDistTag)
    console.log('Updated publish order of missing versions:', missing);
  }
}

async function publishPackage(packageName: string,
                              packageVersion: string,
                              target: Record<string, string>,
                              source: Record<string, string>,
                              srcPackument: Record<string, any>,
                              repositoryFieldNewValue: string,
                              dryRun: boolean) {
  const spec = packageName + '@' + packageVersion
  console.log('Publishing %s to %s', spec, target.registry)

  console.debug('Reading %s from %s', spec, source.registry)
  const manifest = prepareManifest(srcPackument, packageVersion, repositoryFieldNewValue)
  console.debug('Dist', manifest.dist)

  //const tarball = await getTarball(spec, srcOptions)
  const tarball = await fetchTarball(manifest.dist, source.token)
  console.debug('Tarball length', tarball.length)

  console.debug('Do publish %s to %s', spec, source.registry)

  const dstOptions = getScopedOptions(packageName, target)
  await publish(manifest, tarball, dstOptions, dryRun)
}