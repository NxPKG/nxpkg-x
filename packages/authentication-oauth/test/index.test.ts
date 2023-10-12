import { strict as assert } from 'assert'
import { nxpkg } from '@nxpkg/nxpkg'
import { oauth, OauthSetupSettings } from '../src'
import { AuthenticationService } from '@nxpkg/authentication'

describe('@nxpkg/authentication-oauth', () => {
  describe('setup', () => {
    it('errors when service does not exist', () => {
      const app = nxpkg()

      assert.throws(
        () => {
          app.configure(oauth({ authService: 'something' } as OauthSetupSettings))
        },
        {
          message: 'An authentication service must exist before registering @nxpkg/authentication-oauth'
        }
      )
    })

    it('does not error when service is configured', () => {
      const app = nxpkg()

      app.use('/authentication', new AuthenticationService(app))

      app.configure(oauth())
    })
  })
})
