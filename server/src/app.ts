import type { IncomingMessage, Server } from 'node:http'

import type { Pool } from 'pg'

import { ApiException } from '../../cloudfunctions/api/src/errors'
import { createRouter } from '../../cloudfunctions/api/src/router'
import type { RequestContext } from '../../cloudfunctions/api/src/types'
import type { ServerConfig } from './config'
import { migrate } from './db/migrate'
import { createPool } from './db/pool'
import type { ExternalDependencies } from './dependencies.pg'
import { createPgDependencies } from './dependencies.pg'
import { unavailableExternalDependencies } from './external/unavailable'
import type { HttpRoute } from './http/server'
import { createHttpApi } from './http/server'

export interface ServerOverrides {
  authenticate?: (request: IncomingMessage) => Promise<RequestContext>
  external?: ExternalDependencies
  routes?: readonly HttpRoute[]
}

export interface StartedServer {
  readonly server: Server
  readonly pool: Pool
  readonly port: number
  close(): Promise<void>
}

async function rejectSession(): Promise<RequestContext> {
  throw new ApiException('UNAUTHENTICATED', '会话服务尚未启用')
}

function listen(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => reject(error)
    server.once('error', onError)
    server.listen(port, () => {
      server.off('error', onError)
      const address = server.address()
      resolve(typeof address === 'object' && address ? address.port : port)
    })
  })
}

export async function startServer(
  config: ServerConfig,
  overrides: ServerOverrides = {},
): Promise<StartedServer> {
  const pool = createPool({
    connectionString: config.databaseUrl,
    max: config.databasePoolMax,
  })

  try {
    if (config.runMigrations) {
      await migrate(pool)
    }

    const server = createHttpApi({
      route: createRouter(
        createPgDependencies(
          pool,
          overrides.external ?? unavailableExternalDependencies,
        ),
      ),
      authenticate: overrides.authenticate ?? rejectSession,
      checkHealth: async () => {
        await pool.query('SELECT 1')
      },
      routes: overrides.routes ?? [],
    })

    const port = await listen(server, config.port)

    return {
      server,
      pool,
      port,
      close: async () => {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
          server.closeIdleConnections()
        })
        await pool.end()
      },
    }
  } catch (error) {
    await pool.end()
    throw error
  }
}
