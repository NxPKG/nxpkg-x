/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import fetch from 'node-fetch'
import { Server } from 'http'
import { clientTests } from '@nxpkg/tests'

import * as nxpkg from '../dist/nxpkg'
import app from './fixture'

describe('fetch REST connector', function () {
  let server: Server
  const rest = nxpkg.rest('http://localhost:8889')
  const client = nxpkg.default().configure(rest.fetch(fetch))

  before(async () => {
    server = await app().listen(8889)
  })

  after(function (done) {
    server.close(done)
  })

  clientTests(client, 'todos')
})
