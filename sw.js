// HeyVoyo 装到手机桌面以后的离线缓存（放在网站根目录，管整个 heyvoyo.com）
// 地图页：先上网拿最新的，没网就用上次存下的；贴纸图、场景图：先用存下的，后台再更新；登录、数据库（Supabase）、AI 一律不存
const V = "hv-v1";
const PAGE = "/map/";
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.add(PAGE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const IMG_HOSTS = ["img.heyvoyo.com", "upload.wikimedia.org", "thumb.wikimedia.org", "cdn.jsdelivr.net"];
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  // 地图页（也包括 /map/?app=1）：网络优先
  if (r.mode === "navigate" && u.origin === location.origin){
    e.respondWith(fetch(r).then(res => { if (u.pathname.startsWith("/map")){ const c = res.clone(); caches.open(V).then(x => x.put(PAGE, c)); } return res; })
      .catch(() => caches.match(u.pathname.startsWith("/map") ? PAGE : r).then(m => m || caches.match(PAGE))));
    return; }
  // 本站的图片、视频（/stk/ /scene/ /img/ /isle/ /app/）和几个图片网站：先用存下的
  const mine = u.origin === location.origin && /^\/(stk|scene|img|isle|app)\//.test(u.pathname);
  if (mine || IMG_HOSTS.includes(u.hostname)){
    if (r.headers.get("range")) return;   // 视频分段请求交给浏览器
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => { const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => m); return m || net; })));
  }
});

// 🔔 今日世界每天一条提醒（云函数 today-push 发来）：安卓、电脑 Chrome 放大照片；点一下打开地图上的今日世界
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(d.title || "HeyVoyo", {body: d.body || "", image: d.image, icon: "/app/icon-192.png", tag: d.tag || "today", data: {url: d.url || "/map/?today=1"}, actions: d.go ? [{action: "go", title: d.go}] : []}));
});
self.addEventListener("notificationclick", e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "/map/";
  e.waitUntil(clients.matchAll({type: "window", includeUncontrolled: true}).then(ws => { const w = ws.find(c => new URL(c.url).pathname.startsWith("/map"));
    if (w) return w.navigate(url).then(x => (x || w).focus()).catch(() => clients.openWindow(url)); return clients.openWindow(url); }));
});
