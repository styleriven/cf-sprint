import { DurableObject } from 'cloudflare:workers'

type ChatMessage = {
  id: string
  user: string
  text: string
  ts: number
}

type Env = {
  CHAT_ROOM: DurableObjectNamespace<ChatRoom>
}

const MAX_HISTORY = 100

export class ChatRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/ws')) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('expected websocket', { status: 426 })
      }
      const user = url.searchParams.get('user') ?? 'anonymous'
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      this.ctx.acceptWebSocket(server, [user])

      const history = await this.history()
      server.send(JSON.stringify({ type: 'history', messages: history }))

      return new Response(null, { status: 101, webSocket: client })
    }

    if (url.pathname.endsWith('/messages')) {
      return Response.json(await this.history())
    }

    return new Response('not found', { status: 404 })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const [user] = this.ctx.getTags(ws)
    let text = ''
    try {
      const parsed = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw))
      text = String(parsed.text ?? '').slice(0, 500).trim()
    } catch {
      return
    }
    if (!text) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      user: user ?? 'anonymous',
      text,
      ts: Date.now(),
    }

    await this.append(msg)

    const payload = JSON.stringify({ type: 'message', message: msg })
    for (const peer of this.ctx.getWebSockets()) {
      try {
        peer.send(payload)
      } catch {}
    }
  }

  async webSocketClose(ws: WebSocket, code: number) {
    try {
      ws.close(code)
    } catch {}
  }

  private async history(): Promise<ChatMessage[]> {
    return (await this.ctx.storage.get<ChatMessage[]>('messages')) ?? []
  }

  private async append(msg: ChatMessage) {
    const list = await this.history()
    list.push(msg)
    if (list.length > MAX_HISTORY) list.splice(0, list.length - MAX_HISTORY)
    await this.ctx.storage.put('messages', list)
  }
}
