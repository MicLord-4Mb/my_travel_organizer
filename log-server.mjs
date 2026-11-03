// log-server.mjs (в корне проекта)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3002;
const LOGS_DIR = path.resolve('./logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const COLORS = {
  debug: '\x1b[90m', // серый
  info: '\x1b[36m',  // голубой
  warn: '\x1b[33m',  // жёлтый
  error: '\x1b[31m', // красный
  reset: '\x1b[0m',
};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/logs') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        const level = entry.level || 'info';
        const line = JSON.stringify(entry) + '\n';

        // 1. Пишем в общий лог и в файл конкретного потока (logs/error.log, logs/info.log и т.д.)
        fs.appendFileSync(path.join(LOGS_DIR, 'all.jsonl'), line);
        fs.appendFileSync(path.join(LOGS_DIR, `${level}.jsonl`), line);

        // 2. Дублируем в консоль сервера с цветом по важности
        const color = COLORS[level] || COLORS.info;
        console.log(`${color}[${level.toUpperCase()}]${COLORS.reset} ${entry.timestamp} — ${entry.message}`);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
}).listen(PORT, () => {
  console.log(`Log server listening on http://localhost:${PORT}/logs -> writing to ${LOGS_DIR}`);
});
