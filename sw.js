// Service Worker: macht die Bach-App offline nutzbar (wird von tools/build.js erzeugt)
const VERSION = 'fadbcbdafe';
const CACHE = 'bach-' + VERSION;
const FILES = ["index.html","manifest.webmanifest","pieces/bwv772.json","pieces/bwv773.json","pieces/bwv774.json","pieces/bwv775.json","pieces/bwv776.json","pieces/bwv777.json","pieces/bwv778.json","pieces/bwv779.json","pieces/bwv780.json","pieces/bwv781.json","pieces/bwv782.json","pieces/bwv783.json","pieces/bwv784.json","pieces/bwv785.json","pieces/bwv786.json","pieces/bwv787.json","pieces/bwv788.json","pieces/bwv789.json","pieces/bwv790.json","pieces/bwv791.json","pieces/bwv792.json","pieces/bwv793.json","pieces/bwv794.json","pieces/bwv795.json","pieces/bwv796.json","pieces/bwv797.json","pieces/bwv798.json","pieces/bwv799.json","pieces/bwv800.json","pieces/bwv801.json","pieces/bwv846f.json","pieces/bwv846p.json","pieces/bwv847f.json","pieces/bwv847p.json","pieces/bwv848f.json","pieces/bwv848p.json","pieces/bwv849f.json","pieces/bwv849p.json","pieces/bwv850f.json","pieces/bwv850p.json","pieces/bwv851f.json","pieces/bwv851p.json","pieces/bwv852f.json","pieces/bwv852p.json","pieces/bwv853f.json","pieces/bwv853p.json","pieces/bwv854f.json","pieces/bwv854p.json","pieces/bwv855f.json","pieces/bwv855p.json","pieces/bwv856f.json","pieces/bwv856p.json","pieces/bwv857f.json","pieces/bwv857p.json","pieces/bwv858f.json","pieces/bwv858p.json","pieces/bwv859f.json","pieces/bwv859p.json","pieces/bwv860f.json","pieces/bwv860p.json","pieces/bwv861f.json","pieces/bwv861p.json","pieces/bwv862f.json","pieces/bwv862p.json","pieces/bwv863f.json","pieces/bwv863p.json","pieces/bwv864f.json","pieces/bwv864p.json","pieces/bwv865f.json","pieces/bwv865p.json","pieces/bwv866f.json","pieces/bwv866p.json","pieces/bwv867f.json","pieces/bwv867p.json","pieces/bwv868f.json","pieces/bwv868p.json","pieces/bwv869f.json","pieces/bwv869p.json","pieces/bwv988a.json","pieces/bwv988da.json","pieces/bwv988v1.json","pieces/bwv988v10.json","pieces/bwv988v11.json","pieces/bwv988v12.json","pieces/bwv988v13.json","pieces/bwv988v14.json","pieces/bwv988v15.json","pieces/bwv988v16a.json","pieces/bwv988v16b.json","pieces/bwv988v17.json","pieces/bwv988v18.json","pieces/bwv988v19.json","pieces/bwv988v2.json","pieces/bwv988v20.json","pieces/bwv988v21.json","pieces/bwv988v22.json","pieces/bwv988v23.json","pieces/bwv988v24.json","pieces/bwv988v25.json","pieces/bwv988v26.json","pieces/bwv988v27.json","pieces/bwv988v28.json","pieces/bwv988v29.json","pieces/bwv988v3.json","pieces/bwv988v30.json","pieces/bwv988v4.json","pieces/bwv988v5.json","pieces/bwv988v6.json","pieces/bwv988v7.json","pieces/bwv988v8.json","pieces/bwv988v9.json","pieces/index.json","pieces/notes/bwv846f.json","pieces/notes/bwv846p.json","samples/salamander/A1.mp3","samples/salamander/A2.mp3","samples/salamander/A3.mp3","samples/salamander/A4.mp3","samples/salamander/A5.mp3","samples/salamander/A6.mp3","samples/salamander/C2.mp3","samples/salamander/C3.mp3","samples/salamander/C4.mp3","samples/salamander/C5.mp3","samples/salamander/C6.mp3","samples/salamander/C7.mp3","samples/salamander/Ds2.mp3","samples/salamander/Ds3.mp3","samples/salamander/Ds4.mp3","samples/salamander/Ds5.mp3","samples/salamander/Ds6.mp3","samples/salamander/Fs2.mp3","samples/salamander/Fs3.mp3","samples/salamander/Fs4.mp3","samples/salamander/Fs5.mp3","samples/salamander/Fs6.mp3","lib/verovio-toolkit-wasm.js","fonts/EBGaramond-Italic.woff","fonts/EBGaramond.woff","icons/apple-touch-icon.png","icons/favicon-64.png","icons/icon-192.png","icons/icon-512.png","icons/icon.svg"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('bach-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'version') e.source.postMessage({ version: VERSION, files: FILES.length }); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Seite selbst: zuerst aus dem Netz (damit Neuerungen ankommen), offline aus dem Speicher
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // alles andere: aus dem Speicher, sonst aus dem Netz (und merken)
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
