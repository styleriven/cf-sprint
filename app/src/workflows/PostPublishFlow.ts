import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { posts as postsTable } from '../db/schema'

export type PublishParams = {
  postId: string
}

type Env = {
  DB: D1Database
}

export class PostPublishFlow extends WorkflowEntrypoint<Env, PublishParams> {
  async run(event: WorkflowEvent<PublishParams>, step: WorkflowStep) {
    const { postId } = event.payload
    const orm = db(this.env.DB)

    await step.do('mark-processing', async () => {
      await orm
        .update(postsTable)
        .set({ status: 'processing' })
        .where(eq(postsTable.id, postId))
        .run()
    })

    const post = await step.do('load-post', async () => {
      const row = await orm
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, postId))
        .get()
      if (!row) throw new Error(`post ${postId} not found`)
      return row
    })

    const stats = await step.do(
      'analyze',
      { retries: { limit: 3, delay: '2 seconds', backoff: 'exponential' } },
      async () => {
        const words = post.body.trim().split(/\s+/).filter(Boolean)
        return {
          wordCount: words.length,
          readingTime: Math.max(1, Math.round(words.length / 200)),
          summary:
            post.body.slice(0, 140) + (post.body.length > 140 ? '...' : ''),
        }
      }
    )

    await step.sleep('cooldown', '5 seconds')

    await step.do('save', async () => {
      await orm
        .update(postsTable)
        .set({ ...stats, status: 'published' })
        .where(eq(postsTable.id, postId))
        .run()
    })

    return { postId, ...stats }
  }
}
