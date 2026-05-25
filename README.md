# cf-sprint — 14 ngày master Cloudflare Stack

Stack: **Hono + Workers + D1 + KV + R2 + Durable Objects + Workers AI + Agents SDK**
Tiêu chí: **100% free tier**, deploy thật mỗi ngày.

## Free tier đủ dùng cho học + product nhỏ
- Workers: 100k requests/ngày
- KV: 100k reads, 1k writes, 1GB storage / ngày
- D1: 5GB, 5M row reads, 100k writes / ngày
- R2: 10GB storage, **0 egress fee**
- Pages: unlimited requests
- Workers AI: ~10k neurons/ngày
- Vectorize: 5M vectors stored, 30M queries / tháng
- Durable Objects: 1M requests/tháng (chỉ trên paid plan — Day 4 sẽ dùng `--local`)

## Tracking 14 ngày

### Tuần 1 — Foundation
- [ ] Day 1 — Hono + KV: URL shortener
- [ ] Day 2 — Hono RPC + Zod validator: Todo API
- [ ] Day 3 — D1 + Drizzle ORM: Blog API + FTS5 search
- [ ] Day 4 — Durable Objects + WebSocket: Realtime chatroom (local)
- [ ] Day 5 — Queues + Workflows + Cron: Image pipeline
- [ ] Day 6 — R2 + Cache API: Image CDN
- [ ] Day 7 — Auth (JWT + KV session + OAuth): refactor monorepo

### Tuần 2 — AI + Product
- [ ] Day 8 — Security: WAF, Rate Limit, Turnstile
- [ ] Day 9 — Workers AI + AI Gateway: Chat streaming
- [ ] Day 10 — Vectorize + RAG: Semantic search
- [ ] Day 11 — Cloudflare Agents SDK + MCP server
- [ ] Day 12 — Hyperdrive vs D1 benchmark
- [ ] Day 13 — Observability: Tail, Logpush, Analytics Engine
- [ ] Day 14 — CAPSTONE: ship `cf-saas-starter` template

## Cấu trúc repo
```
cf-sprint/
├── README.md            # file này — checklist
├── docs/
│   └── NOTES.md         # ghi chép mỗi ngày (gotcha, link docs)
├── app/    # Hono + KV
├── ...
└── day-14-capstone/     # cf-saas-starter
```
