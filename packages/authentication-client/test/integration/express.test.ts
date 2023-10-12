import axios from 'axios'
import { Server } from 'http'
import { nxpkg, Application as NxpkgApplication } from '@nxpkg/nxpkg'
import * as express from '@nxpkg/express'
import rest from '@nxpkg/rest-client'

import authClient from '../../src'
import getApp from './fixture'
import commonTests from './commons'

describe('@nxpkg/authentication-client Express integration', () => {
  let app: express.Application
  let server: Server

  before(async () => {
    const restApp = express
      .default(nxpkg())
      .use(express.json())
      .configure(express.rest())
      .use(express.parseAuthentication())
    app = getApp(restApp as unknown as NxpkgApplication) as express.Application
    app.use(express.errorHandler())

    server = await app.listen(9776)
  })

  after((done) => server.close(() => done()))

  commonTests(
    () => app,
    () => {
      return nxpkg().configure(rest('http://localhost:9776').axios(axios)).configure(authClient())
    },
    {
      email: 'expressauth@nxpkg.khulnasoft.com',
      password: 'secret',
      provider: 'rest'
    }
  )
})
