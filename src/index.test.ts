import {syncPackages} from './Index'

test('regsync', () => {
  expect(syncPackages).toBeInstanceOf(Function)
})
