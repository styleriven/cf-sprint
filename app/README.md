# Day 1 — Hono URL Shortener trên Workers KV

## Mục tiêu hôm nay
- Hiểu Workers runtime (V8 isolate, không phải Node).
- Wrangler CLI: `dev`, `deploy`, secrets, bindings.
- Hono cơ bản: routing, `c.req`, `c.env`, `c.json`, `c.redirect`.
- KV: `put` với TTL, `get`.
- Deploy live lên `*.workers.dev`.

## Setup (làm 1 lần)

```bash
cd /d/Desktop/cf-sprint/app
npm install
npx wrangler login          # mở browser, login Cloudflare account
npx wrangler kv namespace create LINKS
```

Lệnh cuối in ra dòng giống:
```
{ binding = "LINKS", id = "abcd1234..." }
```

Copy `id` đó dán vào `wrangler.toml` thay cho `<PASTE_ID_HERE>`.

## Chạy local

```bash
npm run dev
```

Mặc định mở `http://localhost:8787`. Test:

```bash
# rút gọn
curl -X POST http://localhost:8787/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://developers.cloudflare.com/workers/"}'

# follow redirect
curl -I http://localhost:8787/<code-trả-về-ở-trên>
```

## Deploy production

```bash
npm run deploy
```

## Bài tập tự làm sau khi chạy được
1. Validate URL chặt hơn (chỉ http/https).
2. Custom code: cho phép user truyền `code` mong muốn, từ chối nếu trùng.
3. Đếm số lượt click vào mỗi short link (thêm KV key thứ 2 dạng `clicks:<code>`).
4. Thêm endpoint `GET /stats/:code` trả `{ url, clicks }`.

## Concept cần nắm sau Day 1
- KV vs Redis: KV eventually consistent ~60s, đọc nhanh ở edge, không phù hợp counter chính xác → bài 3 sẽ gặp race condition, đó là bài học có chủ ý.
- Workers không có `process.env`, dùng `c.env` (binding inject lúc build).
- `wrangler dev` mặc định chạy trên Workers runtime thật (qua Miniflare), không phải Node.
