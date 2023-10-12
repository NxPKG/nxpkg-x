/* eslint-disable @typescript-eslint/ban-ts-comment */
import { strict as assert } from 'assert'
import express, { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { nxpkg, HookContext, Id } from '@nxpkg/nxpkg'

import { default as nxpkgExpress, rest, notFound, errorHandler, original, serveStatic } from '../src'
import { RequestListener } from 'http'

describe('@nxpkg/express', () => {
  const service = {
    async get(id: Id) {
      return { id }
    }
  }

  it('exports .default, .original .rest, .notFound and .errorHandler', () => {
    assert.strictEqual(original, express)
    assert.strictEqual(typeof rest, 'function')
    assert.ok(notFound)
    assert.ok(errorHandler)
  })

  it('returns an Express application, keeps Nxpkg service and configuration typings typings', () => {
    type Config = {
      hostname: string
      port: number
    }

    const app = nxpkgExpress<Record<string, any>, Config>(nxpkg())

    app.set('hostname', 'test.com')

    const hostname = app.get('hostname')

    assert.strictEqual(hostname, 'test.com')
    assert.strictEqual(typeof app, 'function')
  })

  it('allows to use an existing Express instance', () => {
    const expressApp = express()
    const app = nxpkgExpress(nxpkg(), expressApp)

    assert.strictEqual(app, expressApp)
  })

  it('exports `express.rest`', () => {
    assert.ok(typeof rest === 'function')
  })

  it('returns a plain express app when no app is provided', () => {
    const app = nxpkgExpress()

    assert.strictEqual(typeof app.use, 'function')
    assert.strictEqual(typeof app.service, 'undefined')
    assert.strictEqual(typeof app.services, 'undefined')
  })

  it('errors when app with wrong version is provided', () => {
    try {
      // @ts-ignore
      nxpkgExpress({})
    } catch (e: any) {
      assert.strictEqual(e.message, '@nxpkg/express requires a valid Nxpkg application instance')
    }

    try {
      const app = nxpkg()
      app.version = '2.9.9'

      nxpkgExpress(app)
    } catch (e: any) {
      assert.strictEqual(
        e.message,
        '@nxpkg/express requires an instance of a Nxpkg application version 3.x or later (got 2.9.9)'
      )
    }

    try {
      const app = nxpkg()
      delete app.version

      nxpkgExpress(app)
    } catch (e: any) {
      assert.strictEqual(
        e.message,
        '@nxpkg/express requires an instance of a Nxpkg application version 3.x or later (got unknown)'
      )
    }
  })

  it('Can use Express sub-apps', () => {
    const typedApp = nxpkg<Record<string, unknown>>()
    const app = nxpkgExpress(typedApp)
    const child = express()

    app.use('/path', child)
    assert.strictEqual((child as any).parent, app)
  })

  it('Can use express.static', () => {
    const app = nxpkgExpress(nxpkg())

    app.use('/path', serveStatic(__dirname))
  })

  it('has Nxpkg functionality', async () => {
    const app = nxpkgExpress(nxpkg())

    app.use('/myservice', service)

    app.hooks({
      after: {
        get(hook: HookContext) {
          hook.result.fromAppHook = true
        }
      }
    })

    app.service('myservice').hooks({
      after: {
        get(hook: HookContext) {
          hook.result.fromHook = true
        }
      }
    })

    const data = await app.service('myservice').get(10)

    assert.deepStrictEqual(data, {
      id: 10,
      fromHook: true,
      fromAppHook: true
    })
  })

  it('can register a service and start an Express server', async () => {
    const app = nxpkgExpress(nxpkg())
    const response = {
      message: 'Hello world'
    }

    app.use('/myservice', service)
    app.use((_req: Request, res: Response) => res.json(response))

    const server = await app.listen(8787)
    const data = await app.service('myservice').get(10)

    assert.deepStrictEqual(data, { id: 10 })

    const res = await axios.get<any>('http://localhost:8787')
    assert.deepStrictEqual(res.data, response)

    await new Promise((resolve) => server.close(() => resolve(server)))
  })

  it('.listen calls .setup', async () => {
    const app = nxpkgExpress(nxpkg())
    let called = false

    app.use('/myservice', {
      async get(id: Id) {
        return { id }
      },

      async setup(appParam, path) {
        assert.strictEqual(appParam, app)
        assert.strictEqual(path, 'myservice')
        called = true
      }
    })

    const server = await app.listen(8787)

    assert.ok(called)
    await new Promise((resolve) => server.close(() => resolve(server)))
  })

  it('.teardown closes http server', async () => {
    const app = nxpkgExpress(nxpkg())
    let called = false

    const server = await app.listen(8787)
    server.on('close', () => {
      called = true
    })

    await app.teardown()
    assert.ok(called)
  })

  it('passes middleware as options', () => {
    const nxpkgApp = nxpkg()
    const app = nxpkgExpress(nxpkgApp)
    const oldUse = nxpkgApp.use
    const a = (_req: Request, _res: Response, next: NextFunction) => next()
    const b = (_req: Request, _res: Response, next: NextFunction) => next()
    const c = (_req: Request, _res: Response, next: NextFunction) => next()
    const service = {
      async get(id: Id) {
        return { id }
      }
    }

    nxpkgApp.use = function (path, serviceArg, options) {
      assert.strictEqual(path, '/myservice')
      assert.strictEqual(serviceArg, service)
      assert.deepStrictEqual(options.express, {
        before: [a, b],
        after: [c]
      })
      // eslint-disable-next-line prefer-rest-params
      return (oldUse as any).apply(this, arguments)
    }

    app.use('/myservice', a, b, service, c)
  })

  it('Express wrapped and context.app are the same', async () => {
    const app = nxpkgExpress(nxpkg())

    app.use('/test', {
      async get(id: Id) {
        return { id }
      }
    })

    app.service('test').hooks({
      before: {
        get: [
          (context) => {
            assert.ok(context.app === app)
          }
        ]
      }
    })

    assert.deepStrictEqual(await app.service('test').get('testing'), {
      id: 'testing'
    })
  })

  it('Works with HTTPS', (done) => {
    const todoService = {
      async get(name: Id) {
        return {
          id: name,
          description: `You have to do ${name}!`
        }
      }
    }

    const app = nxpkgExpress(nxpkg()).configure(rest())

    app.use('/secureTodos', todoService)

    const httpsServer = https
      .createServer(
        {
          key: fs.readFileSync(path.join(__dirname, '..', '..', 'tests', 'resources', 'privatekey.pem')),
          cert: fs.readFileSync(path.join(__dirname, '..', '..', 'tests', 'resources', 'certificate.pem')),
          rejectUnauthorized: false,
          requestCert: false
        },
        app as unknown as RequestListener
      )
      .listen(7889)

    app.setup(httpsServer)

    httpsServer.on('listening', function () {
      const instance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      })

      instance
        .get<any>('https://localhost:7889/secureTodos/dishes')
        .then((response) => {
          assert.ok(response.status === 200, 'Got OK status code')
          assert.strictEqual(response.data.description, 'You have to do dishes!')
          httpsServer.close(() => done())
        })
        .catch(done)
    })
  })
})
