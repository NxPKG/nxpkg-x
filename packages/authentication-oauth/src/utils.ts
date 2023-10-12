import type { RequestHandler } from 'express'
import type { Middleware, Application as KoaApplication } from '@nxpkg/koa'

import type { ServiceOptions } from '@nxpkg/nxpkg'

import '@nxpkg/koa'
import '@nxpkg/express'
import expressCookieSession from 'cookie-session'
import koaCookieSession from 'koa-session'

import { AuthenticationService } from '@nxpkg/authentication'
import { GrantConfig } from 'grant'

import { defaultsDeep, each, omit } from 'lodash'

export interface OauthSetupSettings {
  linkStrategy: string
  authService?: string
  expressSession?: RequestHandler
  koaSession?: Middleware
}

export const getGrantConfig = (service: AuthenticationService): GrantConfig => {
  const {
    app,
    configuration: { oauth }
  } = service
  // Set up all the defaults
  const port = app.get('port')
  let host = app.get('host')
  let protocol = 'https'

  // Development environments commonly run on HTTP with an extended port
  if (process.env.NODE_ENV !== 'production') {
    protocol = 'http'
    if (String(port) !== '80') {
      host += `:${port}`
    }
  }

  const grant: GrantConfig = defaultsDeep({}, omit(oauth, ['redirect', 'origins']), {
    defaults: {
      prefix: '/oauth',
      origin: `${protocol}://${host}`,
      transport: 'state',
      response: ['tokens', 'raw', 'profile']
    }
  })

  const getUrl = (url: string) => {
    const { defaults } = grant
    return `${defaults.origin}${defaults.prefix}/${url}`
  }

  each(grant, (value, name) => {
    if (name !== 'defaults') {
      value.redirect_uri = value.redirect_uri || getUrl(`${name}/callback`)
    }
  })

  return grant
}

export const setExpressParams: RequestHandler = (req, res, next) => {
  req.session.destroy ||= () => {
    req.session = null
  }

  req.nxpkg = {
    ...req.nxpkg,
    session: req.session,
    state: res.locals
  }

  next()
}

export const setKoaParams: Middleware = async (ctx, next) => {
  ctx.session.destroy ||= () => {
    ctx.session = null
  }

  ctx.nxpkg = {
    ...ctx.nxpkg,
    session: ctx.session,
    state: ctx.state
  } as any

  await next()
}

export const authenticationServiceOptions = (
  service: AuthenticationService,
  settings: OauthSetupSettings
): ServiceOptions => {
  const { secret } = service.configuration
  const koaApp = service.app as KoaApplication

  if (koaApp.context) {
    koaApp.keys = [secret]

    const { koaSession = koaCookieSession({ key: 'nxpkg.oauth' }, koaApp as any) } = settings

    return {
      koa: {
        before: [koaSession, setKoaParams]
      }
    }
  }

  const {
    expressSession = expressCookieSession({
      name: 'nxpkg.oauth',
      keys: [secret]
    })
  } = settings

  return {
    express: {
      before: [expressSession, setExpressParams]
    }
  }
}
