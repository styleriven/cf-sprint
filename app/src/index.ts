import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

import { shortener } from './routes/shortener'
import { todos } from './routes/todos'
import { posts } from './routes/posts'
import { chat } from './routes/chat'

import { handlePostQueue, type PostJob } from './queues/posts'
import { runScheduled } from './cron/cleanup'

export { ChatRoom } from './do/ChatRoom'
export { PostPublishFlow } from './workflows/PostPublishFlow'

type Bindings = {
  LINKS: KVNamespace
  TODOS: KVNamespace
  DB: D1Database
  CHAT_ROOM: DurableObjectNamespace
  POST_QUEUE: Queue<PostJob>
  PUBLISH_FLOW: Workflow
}

const app = new OpenAPIHono<{ Bindings: Bindings }>()

app.use('*', logger())
app.use('*', cors())

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: 'internal error' }, 500)
})

app.get('/', (c) => c.redirect('/docs'))

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'cf-sprint API', version: '0.1.0' },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

app.route('/', chat)
app.route('/', todos)
app.route('/', posts)
app.route('/', shortener)

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<PostJob>, env: Bindings) {
    await handlePostQueue(batch, env)
  },
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduled(event, env))
  },
}

export type AppType = typeof app
