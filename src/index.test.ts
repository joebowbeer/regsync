import {syncPackages} from './index'

test('regsync', () => {
  expect(syncPackages).toBeInstanceOf(Function)
})
