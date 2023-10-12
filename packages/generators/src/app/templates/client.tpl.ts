import { generator, toFile, when } from '@nxpkghq/pinion'
import { renderSource } from '../../commons'
import { AppGeneratorContext } from '../index'

const template = ({
  name,
  language
}: AppGeneratorContext) => /* ts */ `// For more information about this file see https://dove.nxpkg.khulnasoft.com/guides/cli/client.html
import { nxpkg } from '@nxpkg/nxpkg'
import type { TransportConnection, Application } from '@nxpkg/nxpkg'
import authenticationClient from '@nxpkg/authentication-client'
import type { AuthenticationClientOptions } from '@nxpkg/authentication-client'

export interface Configuration {
  connection: TransportConnection<ServiceTypes>
}

export interface ServiceTypes {}

export type ClientApplication = Application<ServiceTypes, Configuration>

/**
 * Returns a ${language === 'ts' ? 'typed' : ''} client for the ${name} app.
 * 
 * @param connection The REST or Socket.io Nxpkg client connection
 * @param authenticationOptions Additional settings for the authentication client
 * @see https://dove.nxpkg.khulnasoft.com/api/client.html
 * @returns The Nxpkg client application
 */
export const createClient = <Configuration = any> (
  connection: TransportConnection<ServiceTypes>,
  authenticationOptions: Partial<AuthenticationClientOptions> = {}
) => {
  const client: ClientApplication = nxpkg()

  client.configure(connection)
  client.configure(authenticationClient(authenticationOptions))
  client.set('connection', connection)

  return client
}
`

export const generate = async (ctx: AppGeneratorContext) =>
  generator(ctx).then(
    when<AppGeneratorContext>(
      (ctx) => ctx.client,
      renderSource(
        template,
        toFile<AppGeneratorContext>(({ lib }) => lib, 'client')
      )
    )
  )
