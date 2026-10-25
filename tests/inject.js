import { Duplex } from 'node:stream';

// Feed real HTTP wire bytes through Node's server parser without binding a port.
// This keeps route, body, headers, cookies and response serialization under test
// even in execution environments that disallow listen().
export function inject(server, { path, method = 'GET', headers = {}, payload = '' }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const socket = new Duplex({ read() {}, write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } });
    socket.localAddress = '127.0.0.1'; socket.remoteAddress = '127.0.0.1';
    socket.on('error', reject);
    socket.on('finish', () => {
      const raw = Buffer.concat(chunks).toString('utf8'), index = raw.indexOf('\r\n\r\n');
      if (index < 0) { reject(new Error('HTTP response missing')); return; }
      const lines = raw.slice(0, index).split('\r\n');
      const status = Number(lines.shift().split(' ')[1]);
      const responseHeaders = new Headers();
      for (const line of lines) { const i = line.indexOf(':'); responseHeaders.append(line.slice(0, i), line.slice(i + 1).trim()); }
      let body = raw.slice(index + 4);
      if (responseHeaders.get('transfer-encoding') === 'chunked') {
        let decoded = '';
        while (body) { const end = body.indexOf('\r\n'), length = parseInt(body.slice(0, end), 16); if (!length) break; const buffer = Buffer.from(body.slice(end + 2)); decoded += buffer.subarray(0, length).toString(); body = buffer.subarray(length + 2).toString(); }
        body = decoded;
      }
      resolve({ status, headers: responseHeaders, body });
    });
    server.emit('connection', socket);
    const requestHeaders = { Host: '127.0.0.1', Connection: 'close', ...headers, 'Content-Length': Buffer.byteLength(payload) };
    const raw = `${method} ${path} HTTP/1.1\r\n${Object.entries(requestHeaders).map(([k, v]) => `${k}: ${v}`).join('\r\n')}\r\n\r\n${payload}`;
    socket.push(Buffer.from(raw));
  });
}
