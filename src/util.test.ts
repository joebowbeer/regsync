import {namedScope, prepareManifest, scopedOptions} from './util'

test('namedScope without scope', () => {
  expect(namedScope('pkgname')).toBeUndefined
})

test('namedScope without slash', () => {
  expect(namedScope('@pkgscope')).toBeUndefined
})

test('namedScope with @scope/', () => {
  expect(namedScope('@pkgscope/pkgname')).toBe('@pkgscope')
})

test('namedScope with hyphenated names', () => {
  expect(namedScope('@pkg-scope/pkg-name')).toBe('@pkg-scope')
})

test('scopedOptions with scope and token', () => {
  expect(scopedOptions('@pkgscope', 'myregistry', 'mytoken')).toEqual({
    '@pkgscope:registry': 'myregistry',
    token: 'mytoken'
  })
})

test('scopedOptions without scope', () => {
  expect(scopedOptions(undefined, 'myregistry', 'mytoken')).toEqual({
    registry: 'myregistry',
    token: 'mytoken'
  })
})

test('scopedOptions without scope or token', () => {
  expect(scopedOptions(undefined, 'myregistry', undefined)).toEqual({
    registry: 'myregistry'
  })
})

test('prepareManifest removes publishConfig and updates repository', () => {
  const packument = {
    'dist-tags': {
      latest: '1.0.0'
    },
    versions: {
      '0.0.1': {
        publishConfig: 'myPublishConfig',
        repository: 'oldRepository'
      },
      '1.0.0': {
        publishConfig: 'myPublishConfig',
        repository: 'newRepository'
      }
    }
  }

  const manifest = prepareManifest(packument, '0.0.1')
  expect(manifest.publishConfig).toBeUndefined
  expect(manifest.repository).toEqual('newRepository')
})

test('prepareManifest retains non-string values from dist', () => {
  const packument = {
    'dist-tags': {
      latest: '1.0.0'
    },
    versions: {
      '1.0.0': {
        dist: {
          fileCount: 123,
          integrity: 'myIntegrity',
          unpackedSize: 456
        },
        publishConfig: 'myPublishConfig',
        repository: 'newRepository'
      }
    }
  }
  const expected = {...packument.versions['1.0.0'].dist}
  const manifest = prepareManifest(packument, '1.0.0')
  expect(manifest.dist).toEqual(expected)
})

test('prepareManifest includes readme/readmeFilename on latest version', () => {
  const packument = {
    'dist-tags': {
      latest: '1.0.0'
    },
    versions: {
      '1.0.0': {
        dist: {},
        publishConfig: 'myPublishConfig'
      }
    },
    readme: '# readme',
    readmeFilename: 'README.md'
  }
  const manifest = prepareManifest(packument, '1.0.0')
  expect(manifest.readme).toEqual('# readme')
  expect(manifest.readmeFilename).toEqual('README.md')
})

test('prepareManifest ignores readme/readmeFilename if not the latest version', () => {
  const packument = {
    'dist-tags': {
      latest: '1.0.0'
    },
    versions: {
      '0.0.1': {
        dist: {},
        publishConfig: 'myPublishConfig'
      },
      '1.0.0': {
        dist: {},
        publishConfig: 'myPublishConfig'
      }
    },
    readme: '# readme',
    readmeFilename: 'README.md'
  }
  const manifest = prepareManifest(packument, '0.0.1')
  expect(manifest.readme).toBeUndefined
  expect(manifest.readmeFilename).toBeUndefined
})
