import { HookContext, NextFunction } from '@nxpkg/nxpkg'
import { createDebug } from '@nxpkg.khulnasoft.commons'
import { ConnectionEvent } from '../core'

const debug = createDebug('@nxpkg/authentication/hooks/connection')

export default (event: ConnectionEvent) => async (context: HookContext, next: NextFunction) => {
  await next()

  const { app, result, params } = context

  if (params.provider && result) {
    debug(`Sending authentication event '${event}'`)
    app.emit(event, result, params, context)
  }
}
