import * as semver from "semver";

export function filterSourceVersions(sourcePackument: Record<string, any>, latestOnly: boolean, latestMajors: boolean) {
  const allSourceVersions = sourcePackument ? Object.keys(sourcePackument.versions) : []
  console.debug('Source versions', allSourceVersions)

  let filteredSourceVersions = []
  if (latestOnly === false && latestMajors === false) {
    filteredSourceVersions = allSourceVersions
  } else if (latestOnly === true && sourcePackument != null) {
    filteredSourceVersions = [sourcePackument['dist-tags'].latest]
  } else if (latestMajors == true && allSourceVersions.length != 0) {
    filteredSourceVersions = getLatestMajorVersions(allSourceVersions);
  }
  return filteredSourceVersions;
}

function getLatestMajorVersions(srcVersionsRaw: string[]) {
  const majorVersions = srcVersionsRaw.filter(version => {
    const semverInstance = new semver.SemVer(version)
    return semverInstance.prerelease.length === 0
  })

  return Array.from(semver.rsort(majorVersions).reduce((acc, version) => {
    const semverInstance = new semver.SemVer(version)

    if (semverInstance.major === 0 && semverInstance.minor === 0) {
      acc.set(version, version)
    } else if (semverInstance.major === 0) {
      const key = `${semverInstance.major}.${semverInstance.minor}`
      if (!acc.has(key)) acc.set(key, version.toString())
    } else if (!acc.has(semverInstance.major)) {
      acc.set(semverInstance.major, version.toString())
    }

    return acc;
  }, new Map).values()).reverse() as string[]
}