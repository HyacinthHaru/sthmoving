import { ApiException } from '../../../cloudfunctions/api/src/errors'
import type { ExternalDependencies } from '../dependencies.pg'

function unavailable(feature: string): never {
  throw new ApiException('SERVICE_UNAVAILABLE', `${feature}尚未在自建后端启用`)
}

export const unavailableExternalDependencies: ExternalDependencies = {
  miniProgramCode: { generate: async () => unavailable('小程序码生成') },
  labelFiles: { upload: async () => unavailable('标签文件存储') },
  outboundImages: { delete: async () => unavailable('图片删除') },
  miniProgramEnvironment: 'develop',
  resolveFileUrls: async () => unavailable('图片地址解析'),
  resolveFileUrl: async () => unavailable('图片地址解析'),
}
