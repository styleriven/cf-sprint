import { lt, eq, and } from 'drizzle-orm'
import { db } from '../db/client'
import { posts as postsTable } from '../db/schema'

type Env = {
  DB: D1Database
}

export async function runScheduled(
  event: ScheduledEvent,
  env: Env
) {
  const orm = db(env.DB)
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30

  const result = await orm
    .delete(postsTable)
    .where(and(eq(postsTable.status, 'draft'), lt(postsTable.createdAt, cutoff)))
    .run()

  console.log('cron cleanup', { cron: event.cron, deleted: result.meta?.changes ?? 0 })
}
