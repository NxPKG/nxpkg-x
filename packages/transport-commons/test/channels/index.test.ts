/* eslint-disable @typescript-eslint/no-empty-function */
import assert from 'assert'
import { nxpkg } from '@nxpkg/nxpkg'
import { channels, keys } from '../../src/channels'

describe('nxpkg-channels', () => {
  it('has app.channel', () => {
    const app = nxpkg().configure(channels())

    assert.strictEqual(typeof app.channel, 'function')
    assert.strictEqual(typeof (app as any)[keys.CHANNELS], 'object')
    assert.strictEqual(app.channels.length, 0)
  })

  it('throws an error when called with nothing', () => {
    const app = nxpkg().configure(channels())

    try {
      app.channel()
      assert.ok(false, 'Should never get here')
    } catch (e: any) {
      assert.strictEqual(e.message, 'app.channel needs at least one channel name')
    }
  })

  it('configuring twice does nothing', () => {
    nxpkg().configure(channels()).configure(channels())
  })

  it('does not add things to the service if `dispatch` exists', () => {
    const app = nxpkg()
      .configure(channels())
      .use('/test', {
        async setup() {},
        publish() {
          return this
        }
      } as any)

    const service: any = app.service('test')

    assert.ok(!service[keys.PUBLISHERS])
  })
})
