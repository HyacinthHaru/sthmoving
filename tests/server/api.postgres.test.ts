import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'

import { deriveUserId } from '../../cloudfunctions/api/src/identity'
import type { ApiResponse } from '../../cloudfunctions/api/src/types'
import { startServer } from '../../server/src/app'
import type { StartedServer } from '../../server/src/app'
import type { ExternalDependencies } from '../../server/src/dependencies.pg'
import { unavailableExternalDependencies } from '../../server/src/external/unavailable'
import { ApiException } from '../../cloudfunctions/api/src/errors'
import {
  closeTestPool,
  describePostgres,
  getTestPool,
  truncateAll,
} from '../contracts/postgres-support'

const ownerOpenid = 'openid-owner'
const bootstrapToken = 'bootstrap-token-for-test'

const external: ExternalDependencies = {
  ...unavailableExternalDependencies,
  resolveFileUrls: async (fileIds) =>
    new Map(fileIds.map((fileId) => [fileId, `https://files.test/${fileId}`])),
  resolveFileUrl: async (fileId) => `https://files.test/${fileId}`,
}

describePostgres('自建后端的 HTTP 接口', () => {
  let started: StartedServer
  let baseUrl: string

  async function call(
    module: string,
    action: string,
    payload: unknown = {},
    openid: string | null = ownerOpenid,
  ): Promise<{ status: number; body: ApiResponse }> {
    const response = await fetch(`${baseUrl}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(openid ? { 'x-test-openid': openid } : {}),
      },
      body: JSON.stringify({ module, action, payload }),
    })
    return { status: response.status, body: (await response.json()) as ApiResponse }
  }

  function expectData<T>(body: ApiResponse): T {
    if (!body.ok) {
      throw new Error(`接口返回错误 ${body.error.code}: ${body.error.message}`)
    }
    return body.data as T
  }

  beforeAll(async () => {
    const pool = await getTestPool()
    process.env['OWNER_BOOTSTRAP_TOKEN'] = bootstrapToken
    started = await startServer(
      {
        port: 0,
        databaseUrl: process.env['TEST_DATABASE_URL'] as string,
        databasePoolMax: 4,
        runMigrations: true,
      },
      {
        external,
        authenticate: async (request) => {
          const openid = request.headers['x-test-openid']
          if (typeof openid !== 'string') {
            throw new ApiException('UNAUTHENTICATED', '缺少身份标识')
          }
          return { userId: deriveUserId(openid), openid }
        },
      },
    )
    baseUrl = `http://127.0.0.1:${started.port}`
    await truncateAll(pool)
  })

  beforeEach(async () => {
    await truncateAll(await getTestPool())
  })

  afterAll(async () => {
    delete process.env['OWNER_BOOTSTRAP_TOKEN']
    await started.close()
    await closeTestPool()
  })

  it('健康检查连通数据库', async () => {
    const response = await fetch(`${baseUrl}/health`)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { status: 'ok' },
    })
  })

  it('缺少身份的请求返回 401', async () => {
    const { status, body } = await call('system', 'ping', {}, null)
    expect(status).toBe(401)
    expect(body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } })
  })

  it('未实现的接口返回 404', async () => {
    const { status, body } = await call('notifications', 'create')
    expect(status).toBe(404)
    expect(body).toMatchObject({ error: { code: 'NOT_IMPLEMENTED' } })
  })

  it('非法 JSON 返回 400', async () => {
    const response = await fetch(`${baseUrl}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-openid': ownerOpenid,
      },
      body: '{',
    })
    expect(response.status).toBe(400)
  })

  it('走完登记与查询的完整链路', async () => {
    const bootstrap = await call('auth', 'bootstrapOwner', {
      token: bootstrapToken,
    })
    expect(expectData<{ user: { role: string } }>(bootstrap.body).user.role).toBe(
      'OWNER',
    )

    const created = await call('categories', 'create', { name: '活动器材' })
    const category = expectData<{ id: string; name: string }>(created.body)
    expect(category.name).toBe('活动器材')

    const item = await call('items', 'create', {
      name: '折叠桌',
      images: [],
      description: '两张长桌',
      quantityMode: 'MULTIPLE',
      quantity: 2,
      categoryId: category.id,
      commitSummary: '首次登记物品',
    })
    const createdItem = expectData<{ id: string; code: string }>(item.body)
    expect(createdItem.code).toMatch(/^[0-9A-F]{12}$/)

    const listed = await call('items', 'list', {})
    const list = expectData<{ items: { id: string; name: string }[] }>(
      listed.body,
    )
    expect(list.items.map((entry) => entry.name)).toContain('折叠桌')

    const detail = await call('items', 'detail', { itemId: createdItem.id })
    const loaded = expectData<{ quantity: number; category: { id: string } }>(
      detail.body,
    )
    expect(loaded.quantity).toBe(2)
    expect(loaded.category.id).toBe(category.id)

    const logs = await call('items', 'logs', { itemId: createdItem.id })
    expect(expectData<{ action: string }[]>(logs.body)).toHaveLength(1)
  })

  it('重名分类返回业务错误码', async () => {
    await call('auth', 'bootstrapOwner', { token: bootstrapToken })
    await call('categories', 'create', { name: '活动器材' })

    const { status, body } = await call('categories', 'create', {
      name: '活动器材',
    })
    expect(status).toBe(200)
    expect(body).toMatchObject({
      ok: false,
      error: { code: 'CATEGORY_NAME_EXISTS' },
    })
  })

  it('未初始化所有者时拒绝错误的初始化口令', async () => {
    const { body } = await call('auth', 'bootstrapOwner', { token: '错误口令' })
    expect(body).toMatchObject({
      ok: false,
      error: { code: 'INVALID_BOOTSTRAP_TOKEN' },
    })
  })
})
