import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { posts as postsTable } from '../db/schema'
import type { PostJob } from '../queues/posts'

type Bindings = {
  DB: D1Database
  POST_QUEUE: Queue<PostJob>
  PUBLISH_FLOW: Workflow
}

const PostSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    wordCount: z.number().int().nullable(),
    readingTime: z.number().int().nullable(),
    summary: z.string().nullable(),
    status: z.enum(['draft', 'processing', 'published', 'failed']),
    createdAt: z.number().int(),
  })
  .openapi('Post')

const CreatePost = z
  .object({
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    pipeline: z.enum(['queue', 'workflow', 'none']).optional().default('queue'),
  })
  .openapi('CreatePost')

const ErrorSchema = z.object({ error: z.string() }).openapi('Error')

const IdParam = z.object({
  id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' } }),
})

const SearchQuery = z.object({
  q: z.string().min(1).openapi({ param: { name: 'q', in: 'query' } }),
})

export const posts = new OpenAPIHono<{ Bindings: Bindings }>()

posts.openapi(
  createRoute({
    method: 'get',
    path: '/posts',
    tags: ['posts'],
    summary: 'List posts (newest first)',
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.array(PostSchema) } },
      },
    },
  }),
  async (c) => {
    const rows = await db(c.env.DB)
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.createdAt))
      .all()
    return c.json(rows, 200)
  }
)

posts.openapi(
  createRoute({
    method: 'post',
    path: '/posts',
    tags: ['posts'],
    summary: 'Create a post (queue/workflow/none decides background pipeline)',
    request: {
      body: { content: { 'application/json': { schema: CreatePost } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: PostSchema } },
      },
    },
  }),
  async (c) => {
    const { title, body, pipeline } = c.req.valid('json')
    const [row] = await db(c.env.DB)
      .insert(postsTable)
      .values({ id: crypto.randomUUID(), title, body })
      .returning()

    if (pipeline === 'queue') {
      await c.env.POST_QUEUE.send({ postId: row.id, kind: 'process' })
    } else if (pipeline === 'workflow') {
      await c.env.PUBLISH_FLOW.create({ params: { postId: row.id } })
    }

    return c.json(row, 201)
  }
)

posts.openapi(
  createRoute({
    method: 'get',
    path: '/posts/search',
    tags: ['posts'],
    summary: 'LIKE search title + body',
    request: { query: SearchQuery },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.array(PostSchema) } },
      },
    },
  }),
  async (c) => {
    const { q } = c.req.valid('query')
    const like = `%${q}%`
    const rows = await db(c.env.DB)
      .select()
      .from(postsTable)
      .where(sql`${postsTable.title} LIKE ${like} OR ${postsTable.body} LIKE ${like}`)
      .orderBy(desc(postsTable.createdAt))
      .all()
    return c.json(rows, 200)
  }
)

posts.openapi(
  createRoute({
    method: 'get',
    path: '/posts/{id}',
    tags: ['posts'],
    summary: 'Get one post',
    request: { params: IdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: PostSchema } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const row = await db(c.env.DB)
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, id))
      .get()
    if (!row) return c.json({ error: 'post not found' }, 404)
    return c.json(row, 200)
  }
)

posts.openapi(
  createRoute({
    method: 'delete',
    path: '/posts/{id}',
    tags: ['posts'],
    summary: 'Delete a post',
    request: { params: IdParam },
    responses: { 204: { description: 'Deleted' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    await db(c.env.DB).delete(postsTable).where(eq(postsTable.id, id)).run()
    return c.body(null, 204)
  }
)
