import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

type Bindings = { LINKS: KVNamespace }

const ShortenBody = z
  .object({ url: z.string().url() })
  .openapi('ShortenRequest')

const ShortenResponse = z
  .object({
    code: z.string().openapi({ example: 'a1b2c3' }),
    short: z.string().url(),
  })
  .openapi('ShortenResponse')

const ErrorSchema = z.object({ error: z.string() }).openapi('Error')

export const shortener = new OpenAPIHono<{ Bindings: Bindings }>()

shortener.openapi(
  createRoute({
    method: 'post',
    path: '/shorten',
    tags: ['shortener'],
    summary: 'Create short URL',
    request: {
      body: { content: { 'application/json': { schema: ShortenBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: ShortenResponse } },
      },
      400: {
        description: 'Invalid URL',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { url } = c.req.valid('json')
    const code = Math.random().toString(36).slice(2, 8)
    await c.env.LINKS.put(code, url, { expirationTtl: 60 * 60 * 24 * 30 })
    return c.json(
      {
        code,
        short: new URL(`/${code}`, c.req.url).toString(),
      },
      200
    )
  }
)

shortener.openapi(
  createRoute({
    method: 'get',
    path: '/{code}',
    tags: ['shortener'],
    summary: 'Redirect to original URL',
    request: {
      params: z.object({
        code: z.string().openapi({ param: { name: 'code', in: 'path' } }),
      }),
    },
    responses: {
      302: { description: 'Redirect' },
      404: { description: 'Not found' },
    },
  }),
  async (c) => {
    const url = await c.env.LINKS.get(c.req.valid('param').code)
    if (!url) return c.notFound()
    return c.redirect(url, 302)
  }
)
