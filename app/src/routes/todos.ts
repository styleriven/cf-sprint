import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { todos as todosTable } from '../db/schema'

type Bindings = { DB: D1Database }

const TodoSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    done: z.boolean(),
    createdAt: z.number().int(),
  })
  .openapi('Todo')

const CreateTodo = z
  .object({ title: z.string().min(1).max(200) })
  .openapi('CreateTodo')

const UpdateTodo = z
  .object({
    title: z.string().min(1).max(200).optional(),
    done: z.boolean().optional(),
  })
  .openapi('UpdateTodo')

const ErrorSchema = z.object({ error: z.string() }).openapi('Error')

const IdParam = z.object({
  id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' } }),
})

export const todos = new OpenAPIHono<{ Bindings: Bindings }>()

todos.openapi(
  createRoute({
    method: 'get',
    path: '/todos',
    tags: ['todos'],
    summary: 'List all todos',
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.array(TodoSchema) } },
      },
    },
  }),
  async (c) => {
    const rows = await db(c.env.DB).select().from(todosTable).all()
    return c.json(rows, 200)
  }
)

todos.openapi(
  createRoute({
    method: 'post',
    path: '/todos',
    tags: ['todos'],
    summary: 'Create a todo',
    request: {
      body: { content: { 'application/json': { schema: CreateTodo } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: TodoSchema } },
      },
    },
  }),
  async (c) => {
    const { title } = c.req.valid('json')
    const [row] = await db(c.env.DB)
      .insert(todosTable)
      .values({ id: crypto.randomUUID(), title })
      .returning()
    return c.json(row, 201)
  }
)

todos.openapi(
  createRoute({
    method: 'get',
    path: '/todos/{id}',
    tags: ['todos'],
    summary: 'Get one todo',
    request: { params: IdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: TodoSchema } },
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
      .from(todosTable)
      .where(eq(todosTable.id, id))
      .get()
    if (!row) return c.json({ error: 'todo not found' }, 404)
    return c.json(row, 200)
  }
)

todos.openapi(
  createRoute({
    method: 'patch',
    path: '/todos/{id}',
    tags: ['todos'],
    summary: 'Update a todo',
    request: {
      params: IdParam,
      body: { content: { 'application/json': { schema: UpdateTodo } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: TodoSchema } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const patch = c.req.valid('json')
    const [row] = await db(c.env.DB)
      .update(todosTable)
      .set(patch)
      .where(eq(todosTable.id, id))
      .returning()
    if (!row) return c.json({ error: 'todo not found' }, 404)
    return c.json(row, 200)
  }
)

todos.openapi(
  createRoute({
    method: 'delete',
    path: '/todos/{id}',
    tags: ['todos'],
    summary: 'Delete a todo',
    request: { params: IdParam },
    responses: { 204: { description: 'Deleted' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    await db(c.env.DB).delete(todosTable).where(eq(todosTable.id, id)).run()
    return c.body(null, 204)
  }
)
