import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { posts as postsTable } from '../db/schema'

export type PostJob = {
  postId: string
  kind: 'process'
}

type Env = {
  DB: D1Database
}

export async function handlePostQueue(
  batch: MessageBatch<PostJob>,
  env: Env
) {
  for (const msg of batch.messages) {
    try {
      await processPost(env, msg.body.postId)
      msg.ack()
    } catch (err) {
      console.error('queue job failed', msg.body.postId, err)
      msg.retry()
    }
  }
}

async function processPost(env: Env, postId: string) {
  const orm = db(env.DB)
  const post = await orm
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId))
    .get()
  if (!post) return

  const words = post.body.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const readingTime = Math.max(1, Math.round(wordCount / 200))
  const summary = post.body.slice(0, 140) + (post.body.length > 140 ? '...' : '')

  await orm
    .update(postsTable)
    .set({
      wordCount,
      readingTime,
      summary,
      status: 'published',
    })
    .where(eq(postsTable.id, postId))
    .run()
}
