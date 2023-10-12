import superagent from 'superagent'
import { clientTests } from '@nxpkg/tests'
import { Server } from 'http'

import * as nxpkg from '../dist/nxpkg'
import app from './fixture'

describe('Superagent REST connector', function () {
  let server: Server
  const rest = nxpkg.rest('http://localhost:8889')
  const client = nxpkg.default().configure(rest.superagent(superagent))

  before(async () => {
    server = await app().listen(8889)
  })

  after(function (done) {
    server.close(done)
  })

  clientTests(client, 'todos')
})
