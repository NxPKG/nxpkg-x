import { setDebug } from '@nxpkg.khulnasoft.commons'

import version from './version'
import { Nxpkg } from './application'
import { Application } from './declarations'

export function nxpkg<T = any, S = any>() {
  return new Nxpkg<T, S>() as Application<T, S>
}

nxpkg.setDebug = setDebug

export { version, Nxpkg }
export * from './hooks'
export * from './declarations'
export * from './service'

if (typeof module !== 'undefined') {
  module.exports = Object.assign(nxpkg, module.exports)
}
