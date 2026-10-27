const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/** 复用原 Electron 处理器；网页只获得预加载声明的能力。 */
exports.install = function install({ app, ipcMain, dataDirectory, port }) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  app.setPath('userData', dataDirectory);
  const token = crypto.randomBytes(32).toString('hex');
  const handlers = new Map();
  const clients = new Set();
  const handle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel, listener) => { handlers.set(channel, listener); handle(channel, listener); };
  const preload = fs.readFileSync(path.join(__dirname, 'preload.cjs'), 'utf8');
  const channels = new Set([...preload.matchAll(/ipcRenderer\.invoke\('([^']+)'/g)].map(match => match[1]).filter(channel => !channel.startsWith('window:') && !channel.startsWith('update:')));
  const origin = 'http://127.0.0.1:' + port;
  const descriptor = path.join(dataDirectory, 'bridge.json');
  let window;
  let server;
  const send = (res, status, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  const authorize = req => req.headers.authorization === 'Bearer ' + token;
  const bootstrap = fs.readFileSync(path.join(__dirname, 'studioControl.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'studio-browser.js'), 'utf8') + '\n' + preload.replace("const { contextBridge, ipcRenderer } = require('electron');", 'const { contextBridge, ipcRenderer } = window.cineflowStudioBridge;');

  async function dispatch(req, res) {
    if (req.headers.host !== '127.0.0.1:' + port) return send(res, 403, { error: '请求来源无效' });
    const url = new URL(req.url, origin);
    if (url.pathname === '/health' && req.method === 'GET') return send(res, 200, { name: 'CineFlow', studio: true });
    if (url.pathname === '/studio/rpc' || url.pathname === '/studio/events') {
      if (!authorize(req) || req.headers.origin && req.headers.origin !== origin) return send(res, 403, { error: '工作室连接已失效，请重新打开' });
      if (url.pathname === '/studio/events' && req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write(': connected\n\n'); clients.add(res);
        req.once('close', () => clients.delete(res)); return;
      }
      if (req.method !== 'POST' || req.headers['content-type']?.split(';')[0] !== 'application/json') return send(res, 405, { error: '请求方式无效' });
      let size = 0; const chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > 1024 * 1024) return send(res, 413, { error: '导入内容过大' }); chunks.push(chunk); }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch (error) { return send(res, 400, { error: '参数必须是 JSON' }); }
      if (!input || !channels.has(input.channel) || !Array.isArray(input.args) || input.args.length > 4) return send(res, 400, { error: '工作室操作无效' });
      const listener = handlers.get(input.channel);
      if (!listener) return send(res, 503, { error: '工作室尚未准备完成' });
      try { return send(res, 200, { result: await listener({ sender: window.webContents, senderFrame: { origin } }, ...input.args) }); }
      catch (error) { return send(res, 500, { error: error instanceof Error ? error.message : '操作失败，请稍后重试' }); }
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, '请求方式无效');
    if (url.pathname === '/studio-preload.js') return send(res, 200, bootstrap, 'text/javascript; charset=utf-8');
    let relative;
    try { relative = decodeURIComponent(url.pathname); } catch (error) { return send(res, 400, '地址无效'); }
    if (relative.includes('\\') || relative.split('/').some(part => part === '..' || part === '.' || part.includes('\0'))) return send(res, 404, '资源不存在');
    const root = path.resolve(__dirname, '../dist');
    const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
    if (!file.startsWith(root + path.sep)) return send(res, 404, '资源不存在');
    try {
      let body = await fs.promises.readFile(file);
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
      if (file.endsWith('index.html')) body = Buffer.from(body.toString().replace('</head>', '<link rel="stylesheet" href="/studio-embedded.css"><script src="/studio-preload.js"></script></head>'));
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) { send(res, error.code === 'ENOENT' ? 404 : 500, '资源读取失败'); }
  }
  return {
    async start(mainWindow) {
      window = mainWindow;
      const originalSend = window.webContents.send.bind(window.webContents);
      window.webContents.send = (channel, payload) => {
        const event = 'data: ' + JSON.stringify({ channel, payload }) + '\n\n';
        for (const client of clients) client.write(event);
        originalSend(channel, payload);
      };
      server = http.createServer((req, res) => { void dispatch(req, res).catch(() => { if (!res.headersSent) send(res, 500, { error: '工作室服务异常' }); else res.end(); }); });
      await new Promise((done, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', done); });
      fs.writeFileSync(descriptor, JSON.stringify({ schemaVersion: 1, origin, token, pid: process.pid }) + '\n', { mode: 0o600 });
      app.once('before-quit', () => {
        for (const client of clients) client.end();
        server.close();
        try { if (JSON.parse(fs.readFileSync(descriptor, 'utf8')).pid === process.pid) fs.unlinkSync(descriptor); }
        catch (error) { /* 未成功写入的连接信息无需清理。 */ }
      });
      console.log('CineFlow 工作室已就绪，端口 ' + port);
    }
  };
};
