import { NxpkgError, NotFound } from '@nxpkg/errors'
import { NxpkgKoaContext } from './declarations'

export const errorHandler = () => async (ctx: NxpkgKoaContext, next: () => Promise<any>) => {
  try {
    await next()

    if (ctx.body === undefined) {
      throw new NotFound(`Path ${ctx.path} not found`)
    }
  } catch (error: any) {
    ctx.response.status = error instanceof NxpkgError ? error.code : 500
    ctx.body =
      typeof error.toJSON === 'function'
        ? error.toJSON()
        : {
            message: error.message
          }
  }
}
