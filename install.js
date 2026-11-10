// 📲 装到桌面（2026-11-10，样板 样板/装到桌面样板.html）
// 软件「我」的设置里一行、主页右上角一个按钮（deploy.sh 把这个文件拷成 网站/install.js 给主页用）。
// 电脑 Chrome / Edge、安卓：浏览器先给 beforeinstallprompt，留着，点按钮时弹浏览器自己的安装框；
// iPhone / iPad：没有这个框，弹三步图（分享 → 添加到主屏幕 → 添加）；
// 已经装过、从桌面打开、或在手机 App 里（capacitor:），按钮不出现。
// 对外：window.HVInstall = {show(), open(), label(), onChange(fn)}
(function(){
  if (window.HVInstall) return;
  let deferred = null; const subs = [];
  const fire = () => subs.forEach(f => { try { f(); } catch(e){} });
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; fire(); });
  addEventListener("appinstalled", () => { deferred = null; try { localStorage.setItem("hv.installed", "1"); } catch(e){} fire(); });
  const ua = navigator.userAgent || "";
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const mobile = iOS || /Android|Mobi/.test(ua);
  const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true || location.protocol === "capacitor:";
  const zh = () => (document.documentElement.lang || "zh").slice(0, 2) === "zh";
  const T = (a, b) => zh() ? a : b;
  // 装过了、或者这台浏览器既不给安装框又不是 iPhone（比如电脑上的 Firefox），就不显示
  const show = () => !standalone() && (iOS || !!deferred || /Chrome|Edg|Android/.test(ua));
  const label = () => mobile ? T("装到手机桌面", "Add to home screen") : T("装到电脑上", "Install on this computer");
  const CSS = `#hvInst{position:fixed;inset:0;z-index:99999;background:rgba(10,20,40,.45);display:flex;align-items:flex-end;justify-content:center;font:15px/1.55 -apple-system,"PingFang SC",sans-serif}
#hvInst .s{width:min(440px,100%);background:#fbf7ee;color:#24303a;border-radius:22px 22px 0 0;padding:20px 20px 28px;animation:hvIu .3s}@keyframes hvIu{from{transform:translateY(40px);opacity:0}}
@media(min-width:700px){#hvInst{align-items:center}#hvInst .s{border-radius:22px}}
#hvInst h3{margin:0;font:900 20px "Noto Serif SC","Songti SC",serif;color:#14305c}#hvInst p{margin:6px 0 0}
#hvInst .ic{width:60px;height:60px;border-radius:15px;margin-bottom:10px;display:block}
#hvInst .st{display:flex;gap:12px;align-items:center;background:#fff;border-radius:14px;padding:10px 12px;margin-top:10px}#hvInst .st b.n{width:26px;height:26px;border-radius:50%;background:#14305c;color:#fff;display:grid;place-items:center;font-size:13px;flex:none}#hvInst .st span{font-size:22px;width:28px;text-align:center}
#hvInst .sm{font-size:12.5px;color:#6b7488;margin-top:10px}#hvInst button{all:unset;cursor:pointer;margin-top:16px;background:#e2552f;color:#fff;border-radius:99px;padding:10px 22px;font-weight:800}`;
  function sheet(html){ if (!document.getElementById("hvInstCss")){ const s = document.createElement("style"); s.id = "hvInstCss"; s.textContent = CSS; document.head.appendChild(s); }
    const m = document.createElement("div"); m.id = "hvInst"; m.innerHTML = `<div class="s"><img class="ic" src="/app/apple-touch-icon.png" alt="">${html}<button data-x>${T("知道了", "Got it")}</button></div>`;
    m.onclick = e => { if (e.target === m || e.target.closest("[data-x]")) m.remove(); }; document.body.appendChild(m); }
  function open(){
    if (deferred){ const d = deferred; deferred = null; d.prompt(); d.userChoice && d.userChoice.then(fire, fire); return; }
    if (iOS) return sheet(`<h3>${T("把 HeyVoyo 放到主屏幕", "Put HeyVoyo on your home screen")}</h3><p>${T("在 Safari 里装，三步：", "In Safari, three steps:")}</p>
      <div class="st"><b class="n">1</b><span>⬆️</span><div>${T("点屏幕下方的 <b>分享</b> 按钮（方框加向上的箭头）", "Tap the <b>Share</b> button (a box with an arrow)")}</div></div>
      <div class="st"><b class="n">2</b><span>➕</span><div>${T("往下翻，点 <b>添加到主屏幕</b>", "Scroll down, tap <b>Add to Home Screen</b>")}</div></div>
      <div class="st"><b class="n">3</b><span>✓</span><div>${T("右上角点 <b>添加</b>，桌面上就多了 HeyVoyo", "Tap <b>Add</b> — HeyVoyo is on your home screen")}</div></div>
      <p class="sm">${T("装好以后从桌面打开，才能收到每天的提醒。", "Open it from the home screen to get daily reminders.")}</p>`);
    // 浏览器还没给安装框（刚打开、或者已经拒绝过）：教它在菜单里找
    sheet(`<h3>${T("在浏览器菜单里装", "Install from the browser menu")}</h3>
      <div class="st"><b class="n">1</b><span>⋮</span><div>${T("点浏览器右上角的 <b>⋮</b> 菜单", "Open the browser's <b>⋮</b> menu")}</div></div>
      <div class="st"><b class="n">2</b><span>📲</span><div>${T("找 <b>安装 HeyVoyo</b>（有的在「投放、保存和分享」里）", "Choose <b>Install HeyVoyo</b> (sometimes under Cast, save and share)")}</div></div>
      <p class="sm">${T("地址栏右边如果有一个「屏幕加向下箭头」的小图标，点它也可以。", "Or tap the small install icon at the right of the address bar.")}</p>`); }
  window.HVInstall = {show, open, label, onChange: f => subs.push(f)};
})();
