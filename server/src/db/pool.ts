import { Pool } from 'pg'
import type { PoolClient } from 'pg'

export interface DatabaseConfig {
  connectionString: string
  max?: number
}

export function createPool(config: DatabaseConfig): Pool {
  return new Pool({
    connectionString: config.connectionString,
    max: config.max ?? 10,
  })
}

export async function withClient<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    return await operation(client)
  } finally {
    client.release()
  }
}

export async function withTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withClient(pool, async (client) => {
    await client.query('BEGIN')
    try {
      const result = await operation(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}
