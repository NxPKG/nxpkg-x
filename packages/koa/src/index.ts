import Koa from 'koa'
import koaQs from 'koa-qs'
import { Application as NxpkgApplication } from '@nxpkg/nxpkg'
import { routing } from '@nxpkg/transport-commons'
import { createDebug } from '@nxpkg.khulnasoft.commons'
import { koaBody as bodyParser } from 'koa-body'
import cors from '@koa/cors'
import serveStatic from 'koa-static'

import { Application } from './declarations'

export { Koa, bodyParser, cors, serveStatic }
export * from './authentication'
export * from './declarations'
export * from './handlers'
export * from './rest'

const debug = createDebug('@nxpkg/koa')

export function koa<S = any, C = any>(
  nxpkgApp?: NxpkgApplication<S, C>,
  koaApp: Koa = new Koa()
): Application<S, C> {
  if (!nxpkgApp) {
    return koaApp as any
  }

  if (typeof nxpkgApp.setup !== 'function') {
    throw new Error('@nxpkg/koa requires a valid Nxpkg application instance')
  }

  const app = nxpkgApp as any as Application<S, C>
  const { listen: koaListen, use: koaUse } = koaApp
  const { use: nxpkgUse, teardown: nxpkgTeardown } = nxpkgApp

  Object.assign(app, {
    use(location: string | Koa.Middleware, ...args: any[]) {
      if (typeof location === 'string') {
        return (nxpkgUse as any).call(this, location, ...args)
      }

      return koaUse.call(this, location)
    },

    async listen(port?: number, ...args: any[]) {
      const server = koaListen.call(this, port, ...args)

      this.server = server
      await this.setup(server)
      debug('Nxpkg application listening')

      return server
    },

    async teardown(server?: any) {
      return nxpkgTeardown.call(this, server).then(
        () =>
          new Promise((resolve, reject) => {
            if (this.server) {
              this.server.close((e) => (e ? reject(e) : resolve(this)))
            } else {
              resolve(this)
            }
          })
      )
    }
  } as Application)

  const appDescriptors = {
    ...Object.getOwnPropertyDescriptors(Object.getPrototypeOf(app)),
    ...Object.getOwnPropertyDescriptors(app)
  }
  const newDescriptors = {
    ...Object.getOwnPropertyDescriptors(Object.getPrototypeOf(koaApp)),
    ...Object.getOwnPropertyDescriptors(koaApp)
  }

  // Copy all non-existing properties (including non-enumerables)
  // that don't already exist on the Express app
  Object.keys(newDescriptors).forEach((prop) => {
    const appProp = appDescriptors[prop]
    const newProp = newDescriptors[prop]

    if (appProp === undefined && newProp !== undefined) {
      Object.defineProperty(app, prop, newProp)
    }
  })

  koaQs(app as any)

  Object.getOwnPropertySymbols(koaApp).forEach((symbol) => {
    const target = app as any
    const source = koaApp as any

    target[symbol] = source[symbol]
  })

  // This reinitializes hooks
  app.setup = nxpkgApp.setup as any
  app.teardown = nxpkgApp.teardown as any

  app.configure(routing() as any)
  app.use((ctx, next) => {
    ctx.nxpkg = { ...ctx.nxpkg, provider: 'rest' }
    return next()
  })

  return app
}
