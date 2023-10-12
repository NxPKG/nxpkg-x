import { nxpkg } from '@nxpkg/nxpkg'
import authentication from '@nxpkg/authentication-client'
import rest from '@nxpkg/rest-client'
import socketio from '@nxpkg/socketio-client'

export * from '@nxpkg/nxpkg'
export * as errors from '@nxpkg/errors'
export { authentication, rest, socketio }
export default nxpkg

if (typeof module !== 'undefined') {
  module.exports = Object.assign(nxpkg, module.exports)
}
