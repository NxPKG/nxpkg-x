import { generator, toFile } from '@nxpkghq/pinion'
import { renderSource } from '../../commons'
import { AppGeneratorContext } from '../index'

const validatorTemplate = /* ts */ `// For more information about this file see https://dove.nxpkg.khulnasoft.com/guides/cli/validators.html
import { Ajv, addFormats } from '@nxpkg/schema'
import type { FormatsPluginOptions } from '@nxpkg/schema'

const formats: FormatsPluginOptions = [
  'date-time', 
  'time', 
  'date', 
  'email',  
  'hostname', 
  'ipv4', 
  'ipv6', 
  'uri', 
  'uri-reference', 
  'uuid',
  'uri-template', 
  'json-pointer', 
  'relative-json-pointer', 
  'regex'
]

export const dataValidator: Ajv = addFormats(new Ajv({}), formats)

export const queryValidator: Ajv = addFormats(new Ajv({
  coerceTypes: true
}), formats)
`

export const generate = (ctx: AppGeneratorContext) =>
  generator(ctx).then(
    renderSource(
      validatorTemplate,
      toFile<AppGeneratorContext>(({ lib }) => lib, 'validators')
    )
  )
