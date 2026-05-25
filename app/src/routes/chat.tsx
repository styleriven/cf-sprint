import { Hono } from 'hono'

type Bindings = {
  CHAT_ROOM: DurableObjectNamespace
}

export const chat = new Hono<{ Bindings: Bindings }>()

chat.get('/chat', (c) => {
  const room = c.req.query('room') ?? 'general'
  return c.html(<ChatPage room={room} />)
})

chat.all('/rooms/:id/ws', (c) => {
  const id = c.env.CHAT_ROOM.idFromName(c.req.param('id'))
  const stub = c.env.CHAT_ROOM.get(id)
  return stub.fetch(c.req.raw)
})

chat.get('/rooms/:id/messages', (c) => {
  const id = c.env.CHAT_ROOM.idFromName(c.req.param('id'))
  const stub = c.env.CHAT_ROOM.get(id)
  return stub.fetch(c.req.raw)
})

const ChatPage = ({ room }: { room: string }) => (
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>cf-sprint chat — {room}</title>
      <style>{css}</style>
    </head>
    <body>
      <header>
        <h1>cf-sprint chat</h1>
        <div class="meta">
          <label>
            room
            <input id="room" value={room} />
          </label>
          <label>
            user
            <input id="user" placeholder="tên của bạn" />
          </label>
          <button id="join">Join</button>
          <span id="status" class="off">disconnected</span>
        </div>
      </header>
      <main>
        <ul id="log"></ul>
        <form id="send">
          <input id="text" placeholder="nhắn gì đó..." autocomplete="off" disabled />
          <button disabled>Send</button>
        </form>
      </main>
      <script dangerouslySetInnerHTML={{ __html: clientJs }} />
    </body>
  </html>
)

const css = `
  :root { color-scheme: light dark; --b: #8884; --me: #2563eb; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 system-ui, sans-serif; display: flex; flex-direction: column; height: 100vh; }
  header { padding: .75rem 1rem; border-bottom: 1px solid var(--b); }
  header h1 { margin: 0 0 .5rem; font-size: 1.1rem; }
  .meta { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
  label { display: flex; gap: .35rem; align-items: center; font-size: .85rem; opacity: .8; }
  input { padding: .35rem .55rem; border: 1px solid var(--b); border-radius: 6px; background: transparent; color: inherit; min-width: 8rem; }
  button { padding: .35rem .85rem; border: 0; border-radius: 6px; background: var(--me); color: white; cursor: pointer; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  #status { font-size: .8rem; padding: .15rem .5rem; border-radius: 999px; }
  #status.on { background: #16a34a22; color: #16a34a; }
  #status.off { background: #dc262622; color: #dc2626; }
  main { flex: 1; display: flex; flex-direction: column; min-height: 0; }
  #log { flex: 1; list-style: none; margin: 0; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: .35rem; }
  #log li { padding: .35rem .55rem; border-radius: 6px; max-width: 70%; word-break: break-word; }
  #log li.sys { align-self: center; opacity: .6; font-size: .8rem; background: transparent; }
  #log li.them { align-self: flex-start; background: #8881; }
  #log li.me { align-self: flex-end; background: var(--me); color: white; }
  #log .who { font-size: .7rem; opacity: .6; margin-bottom: .1rem; }
  #log li.me .who { color: #fff8; }
  #send { display: flex; gap: .5rem; padding: .75rem 1rem; border-top: 1px solid var(--b); }
  #send input { flex: 1; }
`

const clientJs = `
const $ = (id) => document.getElementById(id);
const log = $('log'), text = $('text'), status = $('status'), join = $('join');
let ws = null, me = '';

function add(cls, who, msg) {
  const li = document.createElement('li');
  li.className = cls;
  if (who) {
    const w = document.createElement('div');
    w.className = 'who';
    w.textContent = who;
    li.appendChild(w);
  }
  const t = document.createTextNode(msg);
  li.appendChild(t);
  log.appendChild(li);
  log.scrollTop = log.scrollHeight;
}

function setConnected(on) {
  status.className = on ? 'on' : 'off';
  status.textContent = on ? 'connected' : 'disconnected';
  text.disabled = !on;
  document.querySelector('#send button').disabled = !on;
}

join.onclick = () => {
  const room = $('room').value.trim() || 'general';
  me = $('user').value.trim() || 'anon-' + Math.random().toString(36).slice(2,5);
  $('user').value = me;
  if (ws) ws.close();
  log.innerHTML = '';
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(\`\${proto}://\${location.host}/rooms/\${encodeURIComponent(room)}/ws?user=\${encodeURIComponent(me)}\`);
  ws.onopen = () => { setConnected(true); add('sys','', 'joined #' + room + ' as ' + me); };
  ws.onclose = () => setConnected(false);
  ws.onerror = () => add('sys','', 'connection error');
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'history') {
      data.messages.forEach(m => add(m.user === me ? 'me' : 'them', m.user, m.text));
    } else if (data.type === 'message') {
      add(data.message.user === me ? 'me' : 'them', data.message.user, data.message.text);
    }
  };
};

$('send').onsubmit = (e) => {
  e.preventDefault();
  const t = text.value.trim();
  if (!t || !ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ text: t }));
  text.value = '';
};
`
