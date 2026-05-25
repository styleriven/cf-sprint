# Notes — cf-sprint

Mỗi ngày 1 section. Format:
- **Học gì** (3 gạch đầu dòng)
- **Gotcha** (chỗ vướng + cách fix)
- **Link docs** (chỉ link đã thực sự đọc)
- **Câu hỏi còn mơ hồ** (để hôm sau quay lại)

---

## Day 1 — 2026-05-22 — Hono + KV

### Học gì
-set up wrangler 
-run wrangler (local + deploy)
-c.env

### Gotcha
-

### Link docs
-

### Câu hỏi còn mơ hồ
-

---

## Day 2 — 2026-05-22 — Hono middleware + Zod + RPC

### Học gì
- Middleware pipeline: `logger()`, `cors()` — `app.use('*', ...)` áp cho mọi request
- `@hono/zod-validator` + `zod` — validate input ngay middleware, handler chỉ nhận data đã sạch và type chuẩn
- `c.req.valid('json')` thay cho `await c.req.json()` khi đã validate
- `HTTPException` — throw thay vì return, `app.onError` bắt 1 chỗ
- Tách app theo route module: `app.route('/todos', todos)` mount sub-app
- KV `list({ prefix })` chỉ trả keys → phải `Promise.all(keys.map(get))` (1 read = 1 round-trip)
- Hono RPC: `export type AppType = typeof app` cho client TS infer signature

### Gotcha
- KV không full-text search, không filter server-side → list nhiều todo sẽ tốn reads (Day 3 chuyển D1 sẽ gọn hơn)
- 1 binding KV = 1 namespace; muốn dùng 2 thư mục dữ liệu khác nhau (LINKS + TODOS) phải tạo 2 namespace, thêm 2 block `[[kv_namespaces]]`
- Mỗi lần thêm binding mới trong `wrangler.toml` cần restart `npm run dev`
- **Hono match route theo thứ tự đăng ký**: catch-all `/:code` ăn cả `/docs` → phải đăng ký static path (`/docs`, `/openapi.json`) **trước** sub-app có catch-all
- OpenAPIHono yêu cầu `c.json(data, statusCode)` rõ ràng để khớp schema khai trong `responses`; không thể dùng `HTTPException` nếu muốn response khớp `ErrorSchema`

### Link docs
- 

### Câu hỏi còn mơ hồ
- 

---

## Day 2.5 — 2026-05-23 — OpenAPI + Swagger UI

### Học gì
- `OpenAPIHono` extends `Hono`: API y hệt + thêm `.openapi(route, handler)` và `.doc(path, info)`
- `createRoute({ method, path, request, responses, tags })` — định nghĩa contract trước, handler chạy sau
- `@hono/swagger-ui` — `app.get('/docs', swaggerUI({ url: '/openapi.json' }))` là xong
- 1 schema Zod dùng cho 3 việc: validate input, sinh OpenAPI doc, infer TypeScript type
- `.openapi('Name')` đặt tên schema reusable trong Swagger UI
- `c.req.valid('json' | 'param' | 'query')` lấy data đã validate, type chuẩn
- `.openapi(...)` route phải `c.json(data, statusCode)` rõ ràng để khớp `responses` đã khai

### Gotcha
- Catch-all `/:code` ăn cả `/docs` → đăng ký static path (`/docs`, `/openapi.json`) **trước** sub-app có catch-all
- `app.route('/todos', subApp)` chỉ prefix runtime, **không** prefix path trong OpenAPI spec → sub-app phải khai full path (`/todos`, `/todos/{id}`) rồi mount bằng `app.route('/', subApp)`
- Không dùng `HTTPException` được khi muốn response khớp `ErrorSchema` — phải `return c.json({ error: '...' }, 404)`
- Sub-app phải dùng `OpenAPIHono`, không phải `Hono` thường, mới merge spec được

### Link docs
- 

### Câu hỏi còn mơ hồ
- 

---

## Day 3 — 2026-05-23 — D1 + Drizzle ORM (đang học)

### Học gì
- D1 = SQLite distributed; binding `c.env.DB` là `D1Database` instance
- API D1 raw: `prepare(sql).bind(...).first() / .all() / .run() / .batch([...])`
- Drizzle = ORM mỏng, compile TS → SQL thuần, không runtime engine → fit Workers
- Schema TS-first: `sqliteTable('name', { col: text/integer/... })`
- Type infer từ schema: `typeof todos.$inferSelect` (SELECT), `$inferInsert` (INSERT)
- SQLite không có `boolean` → dùng `integer({ mode: 'boolean' })`, Drizzle tự convert
- SQLite không có `DATETIME` → lưu Unix epoch ms qua `integer({ mode: 'number' })`
- `drizzle-kit generate` đọc schema TS sinh SQL migration trong `drizzle/`
- `wrangler d1 migrations apply DB --local / --remote` áp migration

### Gotcha
- 

### Link docs
- 

### Câu hỏi còn mơ hồ
- 

