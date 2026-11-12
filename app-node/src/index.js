require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nodedb';

// Penting untuk reverse proxy: membaca header X-Forwarded-*
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// State Database
let dbStatus = {
  connected: false,
  message: 'Mencoba menghubungkan ke MongoDB...',
  uri: MONGO_URI,
};

// In-memory fallback untuk item jika Mongo belum menyala
let memoryItems = [
  { id: 1, title: 'Item Sample 1', description: 'Item fallback dari memory' },
  { id: 2, title: 'Item Sample 2', description: 'Bisa diganti MongoDB ketika online' }
];

// MongoDB Mongoose Schema
const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});
const Item = mongoose.model('Item', itemSchema);

// Hubungkan ke MongoDB secara non-blocking
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 2000,
  })
  .then(() => {
    dbStatus.connected = true;
    dbStatus.message = `Terhubung ke MongoDB (${MONGO_URI})`;
    console.log('[MongoDB] Connected successfully');
  })
  .catch((err) => {
    dbStatus.connected = false;
    dbStatus.message = `Gagal terhubung ke MongoDB: ${err.message}`;
    console.warn('[MongoDB] Connection failed (running in offline fallback mode):', err.message);
  });

// Endpoint Halaman Utama (HTML Dashboard)
app.get('/', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const proxyHeaders = {
    'Host': req.headers['host'] || '-',
    'X-Real-IP': req.headers['x-real-ip'] || '-',
    'X-Forwarded-For': req.headers['x-forwarded-for'] || '-',
    'X-Forwarded-Proto': req.headers['x-forwarded-proto'] || '-',
    'X-Forwarded-Host': req.headers['x-forwarded-host'] || '-',
    'X-Forwarded-Port': req.headers['x-forwarded-port'] || '-',
  };

  const headerRows = Object.entries(proxyHeaders)
    .map(
      ([k, v]) => `
      <tr>
        <td class="py-2 text-emerald-300 font-semibold">${k}</td>
        <td class="py-2 text-slate-200 break-all">${v}</td>
      </tr>`
    )
    .join('');

  const dbBadge = dbStatus.connected
    ? `<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
         <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Connected
       </span>`
    : `<span class="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1.5">
         <span class="w-2 h-2 rounded-full bg-amber-500"></span> Not Connected
       </span>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App 2: Node.js + MongoDB (Port ${PORT})</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <!-- Header Navbar -->
  <header class="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30">
          N
        </span>
        <div>
          <h1 class="text-base font-bold text-white leading-tight">Node.js + MongoDB</h1>
          <p class="text-xs text-emerald-400">Reverse Proxy Backend #2</p>
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
          Port: ${PORT}
        </span>
        <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
          Node ${process.version}
        </span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Hero section -->
    <div class="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/30 rounded-2xl p-6 sm:p-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Service Siap Di-Proxy
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Aplikasi Express & MongoDB
          </h2>
          <p class="text-slate-400 text-sm mt-2 max-w-2xl">
            Aplikasi backend berbasis Express.js dengan driver Mongoose. Mendukung pengecekan header reverse proxy dan REST API.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a href="/api/health" target="_blank" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2">
            <span>Cek JSON Healthcheck</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
          <a href="/api/items" target="_blank" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-2">
            <span>API Data (/api/items)</span>
          </a>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Reverse Proxy Headers Inspector -->
      <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <h3 class="font-bold text-white text-base">Reverse Proxy Headers</h3>
          </div>
          <span class="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            IP Klien: ${clientIp}
          </span>
        </div>
        <p class="text-xs text-slate-400 mb-4">
          Header ini diterima langsung oleh Node.js via <code class="text-indigo-300">app.set('trust proxy', true)</code>.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800">
                <th class="pb-2 font-semibold">Header Name</th>
                <th class="pb-2 font-semibold">Received Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${headerRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Database Status Card -->
      <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 5c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3M4 7c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3"></path></svg>
            <h3 class="font-bold text-white text-base">Status Database (MongoDB)</h3>
          </div>
          ${dbBadge}
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono">
            <span class="text-slate-400">URI:</span>
            <span class="text-white ml-1 break-all">${dbStatus.uri}</span>
          </div>

          <div class="p-3 rounded-lg border ${dbStatus.connected ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'}">
            <p class="font-semibold text-xs mb-1">Keterangan:</p>
            <p class="text-xs font-mono break-all">${dbStatus.message}</p>
          </div>

          <p class="text-[11px] text-slate-400">
            *Catatan: Konfigurasi Mongo URI dapat disesuaikan di file <code class="text-slate-200">app-node/.env</code>.
          </p>
        </div>
      </div>
    </div>

    <!-- Multi-app Navigation helper -->
    <div class="bg-slate-950 border border-slate-800 rounded-xl p-6">
      <h3 class="font-bold text-white text-base mb-3">Tiga Layanan yang Tersedia untuk Reverse Proxy</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-red-500/30 transition">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-red-400 text-sm">1. Laravel + MySQL</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Port 8001</span>
          </div>
          <p class="text-xs text-slate-400">Default Port: <code class="text-white">8001</code></p>
          <p class="text-xs text-slate-500 mt-1">PHP Artisan Serve</p>
        </div>

        <div class="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/10">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-emerald-400 text-sm">2. Node.js + MongoDB</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Aktif Disini</span>
          </div>
          <p class="text-xs text-slate-400">Default Port: <code class="text-white">8002</code></p>
          <p class="text-xs text-slate-500 mt-1">Express.js & Mongoose</p>
        </div>

        <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/30 transition">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-cyan-400 text-sm">3. Go + PostgreSQL</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Port 8003</span>
          </div>
          <p class="text-xs text-slate-400">Default Port: <code class="text-white">8003</code></p>
          <p class="text-xs text-slate-500 mt-1">Go Gin / HTTP Server</p>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`;

  res.send(html);
});

// Endpoint Healthcheck JSON
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Node.js + MongoDB',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    client_ip: req.ip,
    database: {
      type: 'mongodb',
      connected: dbStatus.connected,
      uri: dbStatus.uri,
    },
    proxy_headers: {
      x_real_ip: req.headers['x-real-ip'] || null,
      x_forwarded_for: req.headers['x-forwarded-for'] || null,
      x_forwarded_proto: req.headers['x-forwarded-proto'] || null,
      host: req.headers['host'] || null,
    },
  });
});

// Endpoint Data Items (CRUD Sample)
app.get('/api/items', async (req, res) => {
  if (dbStatus.connected) {
    try {
      const items = await Item.find().sort({ createdAt: -1 });
      return res.json({ source: 'mongodb', data: items });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  return res.json({ source: 'memory_fallback', data: memoryItems });
});

app.post('/api/items', async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (dbStatus.connected) {
    try {
      const newItem = await Item.create({ title, description });
      return res.status(201).json({ source: 'mongodb', data: newItem });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const newItem = {
    id: memoryItems.length + 1,
    title,
    description: description || '',
    createdAt: new Date().toISOString(),
  };
  memoryItems.push(newItem);
  return res.status(201).json({ source: 'memory_fallback', data: newItem });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Node.js] Server running on http://0.0.0.0:${PORT}`);
});

