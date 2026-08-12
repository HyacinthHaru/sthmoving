import type { ApiDependencies } from '../dependencies'
import { ApiException } from '../errors'
import { MembershipService } from '../membership/service'
import type { ApiHandler } from '../types'

interface BootstrapPayload {
  token?: unknown
}

function createService(deps: ApiDependencies): MembershipService {
  return new MembershipService(deps.membership)
}

export function createAuthHandlers(
  deps: ApiDependencies,
): Readonly<Record<string, ApiHandler>> {
  return {
    login: async (_payload, context) =>
      createService(deps).login(context.userId, context.openid),

    bootstrapOwner: async (payload, context) => {
      const configuredToken = process.env['OWNER_BOOTSTRAP_TOKEN']
      const submittedToken = (payload as BootstrapPayload | undefined)?.token
      if (
        !configuredToken ||
        configuredToken.length < 16 ||
        typeof submittedToken !== 'string' ||
        submittedToken !== configuredToken
      ) {
        throw new ApiException(
          'INVALID_BOOTSTRAP_TOKEN',
          '所有者初始化口令无效或未配置',
        )
      }
      return createService(deps).bootstrapOwner(context.userId, context.openid)
    },
  }
}
