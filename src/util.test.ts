import {namedScope, scopedOptions} from './util'

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
