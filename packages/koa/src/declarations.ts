import Koa, { Next } from 'koa'
import { Server } from 'http'
import { Application as NxpkgApplication, HookContext, Params, RouteLookup } from '@nxpkg/nxpkg'
import '@nxpkg/authentication'

export type ApplicationAddons = {
  server: Server
  listen(port?: number, ...args: any[]): Promise<Server>
}

export type Application<T = any, C = any> = Omit<Koa, 'listen'> &
  NxpkgApplication<T, C> &
  ApplicationAddons

export type NxpkgKoaContext<A = Application> = Koa.Context & {
  app: A
}

export type Middleware<A = Application> = (context: NxpkgKoaContext<A>, next: Next) => any

declare module '@nxpkg/nxpkg/lib/declarations' {
  interface ServiceOptions {
    koa?: {
      before?: Middleware[]
      after?: Middleware[]
      composed?: Middleware
    }
  }
}

declare module 'koa' {
  interface ExtendableContext {
    nxpkg?: Partial<Params>
    lookup?: RouteLookup
    hook?: HookContext
  }
}
