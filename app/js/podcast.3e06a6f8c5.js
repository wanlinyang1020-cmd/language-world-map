/* podcast.js */
// 🎧 角色播客（2026-11-13，样板 样板/角色播客样板.html；用户「对，接着做」）
// 用户：「我觉得我的软件缺少一些视频和音频，都是一句话一句话的这样。」→ 软件里的角色两三个人把当天「你那边呢」的题目聊 3–5 分钟。
// 三档（刚开始 / 能聊日常 / 比较流利）；一句接一句一直播；上一句 / 下一句 / 这一句再听 / 0.75×；点进度条跳；字幕跟着走，拼音、意思能开关；
// 点词出卡片（只用稿子里切好的 g，不查词表、不编）；能借走的说法画红线，收进口袋（pod.v1，同步到账号）；听完「轮到你」：
// 选 A + B 拼一句或自己说，用主程序的录音（HVI.recStart）听；认不出就照实说，不替用户编一句；说完能当作今天「你那边呢」的回答送出去（HOWABOUT.give）。
// 接系统的媒体控制（mediaSession：锁屏能暂停、换句）；关掉这一页不停，底下留一个小播放条。
// 数据 window.PODCASTS（content-skeleton/podcast/<日期>_<题>.json → gen_podcast.py → d90_podcast.js），按在学的语言挑（现在只有学中文的一期）。
// 对外 window.PODCAST = {open(o), close(fromPop), isOpen(), card(), haRow(date), route()}；o = {id: 期号, play: 1 马上播}；地址 #podcast（#podcast/<期号> 打开那一期）。
(function(){
"use strict";
if (window.PODCAST) return;
const UIL = () => (document.documentElement.lang || "zh").slice(0, 2), ZH = () => UIL() === "zh";
const UT = (zh, en) => window.HVML && window.HVML.tr ? window.HVML.tr(zh, en, ZH() ? "zh" : "en") : (ZH() ? zh : en);   // 西日阿还没翻：先英文（缺的记进 HVML 的缺口单）
const LEARN = () => (window.HVI && window.HVI.LEARN) || window.HV_LEARN || "";
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const eff = () => ymd(new Date(Date.now() - 8 * 3600e3));   // 跟「你那边呢」一样：各人当地 8:00 换下一天
// 一期只在它的日子到了（各人当地日期，8:00 换天，跟「你那边呢」、朋友动态一样）才露出；还没有录音的（gen_podcast.py 标 norec：秒数是按字数估的）到了日子也先不露
const live = e => !!(e && !e.norec && e.date <= eff());
const EPS = () => (window.PODCASTS || []).filter(e => e.l === LEARN() && live(e));
const epToday = () => EPS().find(e => e.date === eff()) || null;
const epById = id => (window.PODCASTS || []).find(e => e.id === id && live(e)) || null;
const IMG = (id, ep) => { const c = ((ep || EP) || {}).cast || {}; return `https://img.heyvoyo.com/npc/${(c[id] && c[id].face) || id}/face.webp`; };   // cast 里写了 face（朋友页的 photo）就用它
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const LSK = "pod.v1";
const ST = () => { let o = null; try { o = JSON.parse(localStorage.getItem(LSK)); } catch(e){} o = o && typeof o === "object" ? o : {}; o.pocket = o.pocket || []; o.done = o.done || {}; o.said = o.said || {}; return o; };
const SAVE = o => { try { localStorage.setItem(LSK, JSON.stringify(o)); } catch(e){} try { window.hvSyncMark && window.hvSyncMark(LSK); } catch(e){} };
const setSt = f => { const o = ST(); f(o); SAVE(o); };
const LVS = ["start", "daily", "fluent"];
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const lenOf = (ep, k) => { const ls = ep.levels[k].lines; return ls.reduce((s, l) => s + l.d, 0) + .6 * (ls.length - 1); };
const tgtTitle = ep => ep.l === "zh" ? ep.title.zh : ep.title.en;
const meanTitle = ep => ep.l === "zh" ? (ZH() ? "" : ep.title.en) : (ZH() ? ep.title.zh : "");
const HANR = /[㐀-鿿]/;

// ── 界面文字（中、英；西日阿先英文）──
const TX = () => ({bar: UT("播客", "Podcast"), pocket: UT("口袋", "Pocket"), people: UT("个人", "people"), host: UT("主持", "host"), lrn: EP && EP.l === "zh" ? UT("在学中文", "learning Chinese") : UT("在学英语", "learning English"),
  lv: {start: UT("刚开始", "Just starting"), daily: UT("能聊日常", "Everyday chat"), fluent: UT("比较流利", "Fairly fluent")}, play: UT("开始听", "Play"), resume: UT("接着听", "Keep listening"), again: UT("再听一遍", "Play again"), pause: UT("暂停", "Pause"),
  speaking: UT("在说", "speaking"), paused: UT("暂停了", "paused"), ready: UT("按一下，会一直往下播", "Tap play — it keeps going on its own"), endCta: UT("🎤 轮到你，说你的", "🎤 Your turn — say yours"), b2n: UT("↓ 回到正在说的", "↓ Back to now"),
  listen: UT("🔊 听", "🔊 Listen"), inLine: UT("▶ 回到这一句", "▶ In the line"), borrowK: UT("能借走的说法", "A phrase you can borrow"), toPocket: UT("🎒 收进口袋", "🎒 Put in pocket"), inPocket: UT("✓ 在口袋里了", "✓ In your pocket"),
  pocketH: UT("你的口袋", "Your pocket"), pocketE: UT("还没有。听的时候点红线的说法就能收。", "Nothing yet. Tap a red-underlined phrase while you listen."), from: UT("出自", "from"), gotIt: UT("收进口袋了", "In your pocket"), switched: UT("换成了", "Switched to"), lines: UT("句", "lines"),
  done: UT("听完了", "LISTENED"), doneS: UT("一整期", "the whole episode"), turn: UT("轮到你", "Your turn"), yours: UT("你的这一句", "Your line"), own: UT("或者，随便说你自己的", "Or just say your own"),
  ownOn: EP && EP.l === "zh" ? UT("说什么都行，用中文", "Say anything — in Chinese") : UT("说什么都行，用英语", "Say anything — in English"), ownLab: UT("你自己的一句", "Your own line"),
  mic: UT("点一下或按住说", "Tap or hold to say"), listening: UT("在听……说完会自己停", "Listening… stops by itself"), holding: UT("在听……松开就停", "Listening… let go to stop"), heard: UT("听到：", "Heard:"), saidIt: UT("说出口了", "SAID IT"), saidS: UT("大声说的", "out loud"),
  noMic: UT("这里听不到你的声音。", "We can't hear your voice here."), noSR: UT("这台设备认不出字。大声说出来，再点", "This device can't pick up words. Say it out loud, then tap"),
  demoB: UT("看看是什么样子", "See what it looks like"), demoTag: UT("只是演示：这句不算你说的，也不能发出去。", "Demo only — this isn't you saying it, and it can't be sent."), demoEg: UT("（你的那一句）", "(your sentence)"),
  demoEnd: UT("刚才只是演示。换一台能用麦克风的手机或电脑，真的说一遍。", "That was only a demo. Try it on a phone or computer with a working mic and say it for real."), grey: UT("没听清，再说一遍。", "Didn't catch it — try once more."),
  sendW: UT("📮 送到今天的回答里", "📮 Send to today's answers"), sendS: UT("当作今天「你那边呢」的回答", "as your answer to today's How About Yours?"), already: UT("你今天已经回答过「你那边呢」了 ✓", "You've already answered today's How About Yours? ✓"), seeHa: UT("去看看 →", "Take a look →"),
  replay: UT("↺ 再听一遍", "↺ Listen again"), other: UT("换一档听", "Try another level"), pickFirst: UT("每一排先选一个，或者说你自己的。", "Pick one from each row first — or say your own."),
  saidB: UT("我说出来了", "I said it"), typeB: UT("改成打字", "Type it instead"), typePh: EP && EP.l === "zh" ? UT("用中文打出来……", "Type it in Chinese…") : UT("用英语打出来……", "Type it in English…"), typeSend: UT("送出", "Send"),
  noSound: UT("没听到声音，再试一次。", "No sound came through — try again."), noRec: UT("（没录到声音）", "(no recording)"), typedOk: UT("写好了", "Got your line"),
  heardTag: UT("（听到的）", "(heard)"), sp: UT("速度", "Speed"), re: UT("这一句再听", "This line again"), prev: UT("上一句", "Previous line"), next: UT("下一句", "Next line"), close: UT("关上（会接着播）", "Close (keeps playing)"),
  kickT: UT("今天的题目", "Today's question"), ep: n => UT("第 " + n + " 期", "Episode " + n), py: UT("拼音", "pinyin"), mean: UT("意思", "meaning"),
  miniOn: UT("正在听", "Listening"), miniPause: UT("暂停了", "Paused"), stop: UT("不听了", "Stop"), none: UT("今天没有播客。", "No podcast today."),
  card: UT("🎧 今天的播客", "🎧 Today's podcast"), cardGo: UT("▶ 听", "▶ Listen"), cardDone: UT("听完了 ✓", "Listened ✓"), cardOn: UT("正在听", "Playing"), min: UT("分钟", "min"),
  haRow: UT("先听听他们怎么聊 🎧", "First, hear how they talk it over 🎧")});
let TXC = null, TXK = ""; const T = k => { const key = UIL() + (EP ? EP.l : ""); if (!TXC || key !== TXK){ TXC = TX(); TXK = key; } return TXC[k]; };

// ── 状态 ──
let EP = null, BYID = false, LV = "daily", I = 0, PLAYING = false, RATE = 1, GAPT = null, FINISHED = false, STARTED = false, HOLDRESUME = false, USERSCROLL = 0;
let SHOWPY = true, SHOWEN = true;
const L = () => EP.levels[LV].lines;
const au = new Audio(); au.preload = "auto";
let pre = null;
const gap = () => RATE < 1 ? 900 : 600;
const total = () => L().reduce((s, l) => s + l.d, 0) + gap() / 1000 * (L().length - 1);
const PEO = id => (EP && EP.cast[id]) || {nm: id, en: id, city: ["", ""]};
const nm = id => ZH() ? PEO(id).nm : PEO(id).en;
const cityOf = id => (PEO(id).city || [])[ZH() ? 0 : 1] || "";
const BCP = () => EP && EP.l === "zh" ? "zh-CN" : "en-GB";
{ const o = ST(); SHOWPY = o.py !== false; SHOWEN = o.en !== false; }

// ── 页面（Shadow DOM）──
let HOST = null, SR = null, MINI = null, MSR = null, HIST = 0;
const $ = id => SR.getElementById(id);
function shell(){ if (HOST) return; HOST = document.createElement("div"); HOST.id = "podPg"; HOST.hidden = true; HOST.dataset.nopy = ""; document.body.appendChild(HOST);
  SR = HOST.attachShadow({mode: "open"}); SR.innerHTML = `<style>${CSS}</style>${SKEL}`; wire(); }
const SKEL = `<div class="pg" id="ph">
  <div class="bar"><button class="xb" id="xb">✕</button><b id="tBar"></b><span class="sp"></span><button class="pk" id="pkBtn"><span>🎒</span><span id="pkL"></span><span class="n" id="pkN">0</span></button></div>
  <div class="scr" id="scr">
   <div class="cover"><div class="in">
    <div class="kick" id="kick"></div>
    <div class="art"><div class="faces" id="faces"></div><h1 id="ttl" dir="auto"></h1><div class="en" id="ttlEn" dir="auto"></div><div class="meta" id="meta" dir="auto"></div></div>
    <div class="lv" id="lv"></div>
    <button class="bigplay" id="bigPlay"><svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M7 4.5v15l13-7.5z"/></svg><span id="bigL"></span></button>
   </div></div>
   <div id="tx"></div>
   <button class="endcta" id="endCta"></button>
  </div>
  <button class="back2now" id="b2n"></button>
  <div class="dock" id="dock"><div class="in">
   <div class="prog" id="prog"><div class="f" id="progF"></div></div>
   <div class="tm" dir="ltr"><span id="tNow">0:00</span><span id="tAll">0:00</span></div>
   <div class="now" id="now"></div>
   <div class="btns">
    <button class="rb tog" id="tPy">pīn</button>
    <button class="rb tog" id="tEn">EN</button>
    <button class="rb" id="bPrev"><svg viewBox="0 0 24 24"><path d="M6 5h2.4v14H6zM20 5v14L9.5 12z"/></svg></button>
    <button class="pp" id="bPlay"><svg viewBox="0 0 24 24" id="ppI"><path d="M7 4.5v15l13-7.5z"/></svg></button>
    <button class="rb" id="bNext"><svg viewBox="0 0 24 24"><path d="M15.6 5H18v14h-2.4zM4 5l10.5 7L4 19z"/></svg></button>
    <button class="rb" id="bRe"><svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg></button>
    <button class="rb tog sp1" id="bSp">1×</button>
   </div>
  </div></div>
  <div class="veil" id="veil"></div>
  <div class="card" id="card"></div>
  <div class="turn" id="turn"><div class="bar"><button class="lt" id="tBack">←</button><b id="turnT"></b><span class="sp"></span></div><div class="tb" id="turnB"></div></div>
  <div class="toast" id="toast"></div>
 </div>`;

// ── 小反应 ──
let AC = null;
function blip(f = 660, d = .07){ try { if (localStorage.getItem("hv.sound") === "off") return; AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(.06, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d * 2); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d * 2); } catch(e){} }
function react(el, mark = "♪", f){ if (!el) return; el.classList.add("press"); setTimeout(() => el.classList.remove("press"), 110); blip(f); const r = el.getBoundingClientRect(), s = document.createElement("div"); s.className = "flt"; s.textContent = mark; s.style.left = (r.left + r.width / 2 - 6) + "px"; s.style.top = (r.top - 4) + "px"; $("ph").appendChild(s); setTimeout(() => s.remove(), 900); }
let toT = null;
function toast(t){ const e = $("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toT); toT = setTimeout(() => e.classList.remove("on"), 1900); }
function stamp(big, small){ const ph = $("ph"), s = document.createElement("div"); s.className = "stamp"; s.innerHTML = esc(big) + `<small>${esc(small)} · ${esc(new Date().toLocaleDateString(ZH() ? "zh-CN" : "en-GB", {day: "numeric", month: "short"}))}</small>`; ph.appendChild(s); blip(220, .14); setTimeout(() => s.classList.add("out"), 1500); setTimeout(() => s.remove(), 2100); confetti(); }
function confetti(){ const ph = $("ph"), C = ["#e2552f", "#14305c", "#2c64b8", "#e8a33a", "#2f7d70"]; for (let k = 0; k < 34; k++){ const c = document.createElement("i"); c.className = "cf"; c.style.left = (Math.random() * 100) + "%"; c.style.background = C[k % 5]; c.style.setProperty("--dx", (Math.random() * 120 - 60) + "px"); c.style.animationDelay = (Math.random() * .35) + "s"; ph.appendChild(c); setTimeout(() => c.remove(), 2200); } }
const sayable = t => String(t).replace(/\s*\/\s*/g, "，").replace(/……|…/g, "");
function say(t, r = .8){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(sayable(t)); u.lang = BCP(); u.rate = r; speechSynthesis.speak(u); } catch(e){} }

// ── 封面 ──
function renderCover(){ const ep = EP, n = EPS().indexOf(ep) + 1 || (window.PODCASTS || []).indexOf(ep) + 1;
  $("tBar").textContent = "🎧 " + T("bar"); $("pkL").textContent = T("pocket"); $("xb").title = $("xb").ariaLabel = T("close");
  $("kick").textContent = T("ep")(n) + " · " + (ep.date === eff() ? T("kickT") : new Date(ep.date + "T12:00:00").toLocaleDateString(ZH() ? "zh-CN" : "en-GB", {day: "numeric", month: "short"}));
  $("ttl").textContent = tgtTitle(ep); $("ttl").lang = ep.l === "zh" ? "zh" : "en"; $("ttlEn").textContent = meanTitle(ep);
  $("faces").innerHTML = ep.order.map(id => `<div class="face" data-f="${esc(id)}"><img src="${IMG(id)}" alt=""><b>${esc(nm(id))}</b><small>${esc(cityOf(id))}</small></div>`).join("");
  $("meta").innerHTML = `<span>${esc([...new Set(ep.order.map(cityOf))].join(" · "))}</span><span>·</span><span>${fmt(lenOf(ep, LV))}</span>`;
  $("lv").innerHTML = LVS.filter(k => ep.levels[k]).map(k => `<button data-lv="${k}" class="${k === LV ? "on" : ""}">${esc(T("lv")[k])}<small>${fmt(lenOf(ep, k))} · ${ep.levels[k].lines.length} ${esc(T("lines"))}</small></button>`).join("");
  $("endCta").textContent = T("endCta"); $("b2n").textContent = T("b2n"); $("turnT").textContent = T("turn");
  $("bRe").title = T("re"); $("bSp").title = T("sp"); $("bPrev").title = T("prev"); $("bNext").title = T("next"); $("tPy").title = T("py"); $("tEn").title = T("mean");
  $("tPy").hidden = ep.l !== "zh"; $("tEn").textContent = ep.l === "zh" ? "EN" : "中";
  bigLabel(); talkFace(); }
function bigLabel(){ if (!SR) return; $("bigL").textContent = PLAYING ? T("pause") : FINISHED ? T("again") : (I > 0 || au.currentTime > 0) ? T("resume") : T("play"); $("bigPlay").firstElementChild.innerHTML = PLAYING ? '<path d="M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z"/>' : '<path d="M7 4.5v15l13-7.5z"/>'; }
function talkFace(){ if (!SR) return; const w = L()[I] && L()[I].w; SR.querySelectorAll(".face").forEach(f => f.classList.toggle("talk", PLAYING && f.dataset.f === w)); }

// ── 字幕（按稿子里切好的词 g：[词, 拼音, 这句里的意思, 能借走的说法编号或 -1]；没有意思的标点、语气词不能点）──
const pkKey = bi => EP.id + ":" + LV + ":" + bi, hasPocket = bi => ST().pocket.some(p => p.k === pkKey(bi));
function gHTML(G, k){ let h = "", open = -1; G.forEach((t, j) => { const bi = t[3], sp = /^\s/.test(t[0]) ? " " : "", w = t[0].replace(/^\s+/, "");
    if (bi !== open){ if (open >= 0) h += "</span>"; h += sp; if (bi >= 0) h += `<span class="bw${hasPocket(bi) ? " got" : ""}" data-b="${bi}">`; open = bi; } else h += sp;
    h += t[2] ? `<span class="w" data-k="${k}" data-j="${j}">${esc(w)}</span>` : esc(w); });
  if (open >= 0) h += "</span>"; return h; }
function lineHTML(l, k){ const P = PEO(l.w);
  return `<div class="ln" data-i="${k}"><img class="av" src="${IMG(l.w)}" alt=""><div class="bd"><div class="who"><b>${esc(nm(l.w))}</b><span>${esc(cityOf(l.w))}</span>${P.host ? `<span class="tg">${esc(T("host"))}</span>` : ""}${P.lrn ? `<span class="tg lrn">${esc(T("lrn"))}</span>` : ""}<span class="eq"><i></i><i></i><i></i><i></i></span></div><div class="zh" lang="${EP.l}">${gHTML(l.g, k)}</div>${l.p && EP.l === "zh" ? `<div class="pyl" dir="ltr">${esc(l.p)}</div>` : ""}<div class="enl" dir="auto">${esc(l.m)}</div></div></div>`; }
function renderTx(){ $("tx").innerHTML = L().map(lineHTML).join(""); setTog(); mark(false); renderTicks(); }
function mark(scroll = true){ if (!SR || !EP) return; SR.querySelectorAll(".ln").forEach(e => { const k = +e.dataset.i, d = Math.abs(k - I); e.classList.toggle("on", k === I); e.classList.toggle("playing", k === I && PLAYING); e.classList.toggle("near", d > 0 && d <= 2); e.classList.toggle("done", k < I - 2); });
  const l = L()[I]; $("now").innerHTML = l ? `<img src="${IMG(l.w)}" alt=""><b>${esc(nm(l.w))}</b><span>${esc(PLAYING ? T("speaking") : (I || au.currentTime) ? T("paused") : T("ready"))}</span><span class="eq"><i></i><i></i><i></i><i></i></span><span style="margin-inline-start:auto" dir="ltr">${I + 1} / ${L().length}</span>` : "";
  $("dock").classList.toggle("playing", PLAYING); $("ppI").innerHTML = PLAYING ? '<path d="M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z"/>' : '<path d="M7 4.5v15l13-7.5z"/>'; bigLabel(); talkFace();
  if (scroll && isOpen()) follow(); }
function follow(force){ if (!force && Date.now() < USERSCROLL){ $("b2n").classList.add("on"); return; } $("b2n").classList.remove("on"); const e = SR.querySelector(`.ln[data-i="${I}"]`), sc = $("scr"); if (!e) return; const top = e.offsetTop - sc.clientHeight * .36; sc.scrollTo({top: Math.max(0, top), behavior: "smooth"}); }
function renderTicks(){ const pr = $("prog"); pr.querySelectorAll(".tk").forEach(x => x.remove()); let s = 0; const tt = total(); L().forEach((l, k) => { if (k){ const t = document.createElement("i"); t.className = "tk"; t.style.left = (s / tt * 100) + "%"; pr.appendChild(t); } s += l.d + gap() / 1000; }); $("tAll").textContent = fmt(tt); }
function elapsed(){ let s = 0; for (let k = 0; k < I; k++) s += L()[k].d + gap() / 1000; s += Math.min(au.currentTime || 0, L()[I] ? L()[I].d : 0); return FINISHED ? total() : s; }
function progress(){ if (!EP) return; const s = elapsed(), tt = total();
  if (SR && isOpen()){ $("progF").style.width = Math.min(100, s / tt * 100) + "%"; $("tNow").textContent = fmt(s); }
  if (MSR && !MINI.hidden){ const f = MSR.getElementById("mf"); if (f) f.style.width = Math.min(100, s / tt * 100) + "%"; }
  try { if ("mediaSession" in navigator && navigator.mediaSession.setPositionState && PLAYING) navigator.mediaSession.setPositionState({duration: Math.max(1, tt), position: Math.min(tt, s), playbackRate: RATE}); } catch(e){} }
setInterval(progress, 250);

// ── 播放 ──
function play(k){ clearTimeout(GAPT); FINISHED = false; STARTED = true; I = Math.max(0, Math.min(L().length - 1, k)); const l = L()[I];
  au.src = l.a; au.playbackRate = RATE; try { au.preservesPitch = true; } catch(e){}
  au.play().catch(() => { PLAYING = false; mark(false); mini(); media(); });
  PLAYING = true; mark(); media(); mini();
  const nx = L()[I + 1]; if (nx){ pre = new Audio(); pre.preload = "auto"; pre.src = nx.a; } }
au.addEventListener("ended", () => { if (!PLAYING) return; if (I >= L().length - 1){ finish(); return; } GAPT = setTimeout(() => { if (PLAYING) play(I + 1); }, gap()); });
au.addEventListener("error", () => { if (!PLAYING) return; PLAYING = false; mark(false); mini(); media(); if (SR && isOpen()) toast(UT("这一句的录音放不出来，看看网络。", "This line's audio won't play — check your connection.")); });
function pause(){ PLAYING = false; clearTimeout(GAPT); au.pause(); mark(false); media(); mini(); }
function toggle(){ if (PLAYING){ pause(); return; } if (FINISHED){ play(0); return; } if (au.src && au.currentTime > 0 && !au.ended){ au.play().catch(() => { PLAYING = false; mark(false); mini(); }); PLAYING = true; STARTED = true; mark(); media(); mini(); } else play(I); }
function finish(){ PLAYING = false; FINISHED = true; mark(false); progress(); media(); setSt(o => { const d = o.done[EP.id] = o.done[EP.id] || {}; d[LV] = Date.now(); }); refreshCards();
  if (isOpen()){ stamp(T("done"), T("doneS")); setTimeout(() => { if (isOpen()) openTurn(); }, 900); } else { STARTED = false; mini(); } }
function media(){ if (!("mediaSession" in navigator) || !EP) return; try { const l = L()[I] || L()[0];
  navigator.mediaSession.metadata = new MediaMetadata({title: tgtTitle(EP), artist: `${nm(l.w)} · ${cityOf(l.w)}`, album: "HeyVoyo · " + T("bar"), artwork: [{src: IMG(l.w), sizes: "256x256", type: "image/webp"}]});
  navigator.mediaSession.playbackState = PLAYING ? "playing" : "paused";
  navigator.mediaSession.setActionHandler("play", () => { if (!PLAYING) toggle(); }); navigator.mediaSession.setActionHandler("pause", () => { if (PLAYING) pause(); });
  navigator.mediaSession.setActionHandler("nexttrack", () => { if (I >= L().length - 1) finish(); else play(I + 1); }); navigator.mediaSession.setActionHandler("previoustrack", () => play(I - 1)); } catch(e){} }
function resetPlayer(){ clearTimeout(GAPT); PLAYING = false; FINISHED = false; STARTED = false; I = 0; au.pause(); au.removeAttribute("src"); try { au.load(); } catch(e){} }

// ── 开关和按钮 ──
function setTog(){ $("tPy").classList.toggle("on", SHOWPY); $("tEn").classList.toggle("on", SHOWEN); $("tx").classList.toggle("nopy", !SHOWPY); $("tx").classList.toggle("noen", !SHOWEN); }
function wire(){
  $("xb").onclick = e => { react(e.currentTarget, "✕"); close(); };
  $("tPy").onclick = e => { SHOWPY = !SHOWPY; setSt(o => o.py = SHOWPY); setTog(); react(e.currentTarget, SHOWPY ? "pīn" : "–"); setTimeout(() => follow(true), 60); };
  $("tEn").onclick = e => { SHOWEN = !SHOWEN; setSt(o => o.en = SHOWEN); setTog(); react(e.currentTarget, SHOWEN ? e.currentTarget.textContent : "–"); setTimeout(() => follow(true), 60); };
  $("bPlay").onclick = e => { react(e.currentTarget, PLAYING ? "‖" : "♪", PLAYING ? 440 : 780); toggle(); };
  $("bigPlay").onclick = e => { react(e.currentTarget, PLAYING ? "‖" : "♪", PLAYING ? 440 : 780); toggle(); };
  $("bPrev").onclick = e => { react(e.currentTarget, "⏮"); play(I - 1); };
  $("bNext").onclick = e => { react(e.currentTarget, "⏭"); if (I >= L().length - 1){ finish(); return; } play(I + 1); };
  $("bRe").onclick = e => { react(e.currentTarget, "↺"); play(I); };
  $("bSp").onclick = e => { RATE = RATE === 1 ? .75 : 1; au.playbackRate = RATE; e.currentTarget.textContent = RATE === 1 ? "1×" : "0.75×"; e.currentTarget.classList.toggle("on", RATE !== 1); react(e.currentTarget, RATE === 1 ? "1×" : "0.75×"); renderTicks(); };
  $("prog").onclick = e => { const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * total(); let s = 0, k = 0; for (; k < L().length; k++){ s += L()[k].d + gap() / 1000; if (s > x) break; } blip(); USERSCROLL = 0; play(Math.min(k, L().length - 1)); };
  $("lv").onclick = e => { const b = e.target.closest("[data-lv]"); if (!b || b.dataset.lv === LV) return; react(b, "✦"); const was = PLAYING; resetPlayer(); LV = b.dataset.lv; setSt(o => o.lv = LV); renderCover(); renderTx(); $("scr").scrollTo({top: 0}); toast(`${T("switched")} ${T("lv")[LV]} · ${fmt(lenOf(EP, LV))}`); if (was) play(0); else mini(); };
  $("endCta").onclick = e => { react(e.currentTarget, "🎤"); pause(); openTurn(); };
  $("b2n").onclick = e => { USERSCROLL = 0; react(e.currentTarget, "↓"); follow(true); };
  ["wheel", "touchmove"].forEach(ev => $("scr").addEventListener(ev, () => { USERSCROLL = Date.now() + 6000; if (PLAYING) $("b2n").classList.add("on"); }, {passive: true}));
  $("tx").onclick = e => { const w = e.target.closest(".w"), b = e.target.closest(".bw"), ln = e.target.closest(".ln"); if (!ln) return; const k = +ln.dataset.i;
    if (b){ openBorrow(+b.dataset.b, k, b); return; }
    if (w){ openWord(L()[+w.dataset.k].g[+w.dataset.j], k, w); return; }
    react(ln.querySelector(".av"), "▶"); USERSCROLL = 0; play(k); };
  $("veil").onclick = closeCard;
  $("pkBtn").onclick = e => { react(e.currentTarget, "🎒"); openPocket(); };
  $("tBack").onclick = e => { react(e.currentTarget, "←"); stopRec(); $("turn").classList.remove("on"); };
}

// ── 点词、能借走的说法、口袋 ──
function holdForCard(){ HOLDRESUME = PLAYING; if (PLAYING) pause(); }
function closeCard(){ if (!SR) return; $("card").classList.remove("on"); $("veil").classList.remove("on"); SR.querySelectorAll(".w.hit").forEach(x => x.classList.remove("hit")); if (HOLDRESUME){ HOLDRESUME = false; toggle(); } }
const cardOpen = () => !!SR && $("card").classList.contains("on");
function openWord(t, k, el){ if (!t || !t[2]) return; holdForCard(); react(el, "?", 880); el.classList.add("hit"); const card = $("card"), w = t[0].trim();
  card.innerHTML = `<button class="x" data-x>×</button><div class="wd" lang="${EP.l}">${esc(w)}</div>${t[1] && EP.l === "zh" ? `<div class="wp">${esc(t[1])}</div>` : ""}<div class="wm">${esc(t[2])}</div><div class="row"><button class="lt" data-say>${esc(T("listen"))}</button>${k >= 0 ? `<button class="lt" data-line="${k}">${esc(T("inLine"))}</button>` : ""}</div>`;
  card.classList.add("on"); $("veil").classList.add("on");
  card.querySelector("[data-say]").onclick = e => { react(e.currentTarget, "🔊"); say(w); };
  const li = card.querySelector("[data-line]"); if (li) li.onclick = e => { react(e.currentTarget, "▶"); HOLDRESUME = false; closeCard(); play(k); };
  card.querySelector("[data-x]").onclick = closeCard; }
function openBorrow(bi, k, el){ holdForCard(); react(el, "✦", 880); const b = EP.levels[LV].borrow[bi], card = $("card"), got = hasPocket(bi); if (!b) return;
  const inner = [...el.querySelectorAll(".w")].map(x => L()[+x.dataset.k].g[+x.dataset.j]).map(t => `<button class="ch" data-w="${esc(t[0].trim())}">${esc(t[0].trim())}<small>${esc(t[2])}</small></button>`).join("");
  card.innerHTML = `<button class="x" data-x>×</button><div class="k">${esc(T("borrowK"))}</div><div class="wd ph" lang="${EP.l}">${esc(b.t)}</div>${b.p && EP.l === "zh" ? `<div class="wp">${esc(b.p)}</div>` : ""}<div class="wm">${esc(b.m)}</div>${inner ? `<div class="chs">${inner}</div>` : ""}<div class="row"><button class="go${got ? " got" : ""}" data-pk>${esc(got ? T("inPocket") : T("toPocket"))}</button><button class="lt" data-say>${esc(T("listen"))}</button><button class="lt" data-line="${k}">${esc(T("inLine"))}</button></div>`;
  card.classList.add("on"); $("veil").classList.add("on");
  card.querySelector("[data-say]").onclick = e => { react(e.currentTarget, "🔊"); say(b.t.replace(/……|…/g, "")); };
  card.querySelector("[data-line]").onclick = e => { react(e.currentTarget, "▶"); HOLDRESUME = false; closeCard(); play(k); };
  card.querySelectorAll(".ch").forEach(c => c.onclick = () => { react(c, "?"); say(c.dataset.w); });
  card.querySelector("[data-pk]").onclick = e => { if (hasPocket(bi)){ react(e.currentTarget, "✓"); return; } const btn = e.currentTarget, l = L()[k];
    setSt(o => o.pocket.push({k: pkKey(bi), ep: EP.id, l: EP.l, t: b.t, p: b.p || "", m: b.m, lv: LV, from: l.w, fromNm: PEO(l.w).nm, fromEn: PEO(l.w).en, a: l.a, line: l.t, ts: Date.now()}));
    btn.textContent = T("inPocket"); btn.classList.add("got"); flyTo(btn, b.t); SR.querySelectorAll(`.bw[data-b="${bi}"]`).forEach(x => x.classList.add("got")); };
  card.querySelector("[data-x]").onclick = closeCard; }
function flyTo(from, text){ const a = from.getBoundingClientRect(), t = $("pkBtn").getBoundingClientRect(), f = document.createElement("div"); f.className = "fly"; f.textContent = text; f.style.left = a.left + "px"; f.style.top = a.top + "px"; $("ph").appendChild(f); blip(990, .06); setTimeout(() => blip(1320, .06), 90);
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transform = `translate(${t.left - a.left}px,${t.top - a.top}px) scale(.3)`; f.style.opacity = ".2"; }));
  setTimeout(() => { f.remove(); pkCount(true); toast("🎒 " + T("gotIt") + " · " + text); setTimeout(closeCard, 700); }, 720); }
function pkCount(bump){ $("pkN").textContent = ST().pocket.length; if (bump){ const b = $("pkBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); react(b, "+1", 1100); } }
const clip = new Audio();
function openPocket(){ holdForCard(); const card = $("card"), P = ST().pocket.filter(p => p.l === EP.l || !p.l);
  const lvName = k => (T("lv")[k] || "");
  card.innerHTML = `<button class="x" data-x>×</button><div class="k">${esc(T("pocketH"))} · ${P.length}</div>${P.length ? `<div class="plist">${P.slice().reverse().map(p => `<div class="pi"><button class="e" data-s="${esc(p.t)}" data-a="${esc(p.a || "")}">🔊</button><div><div class="t" lang="${esc(p.l || EP.l)}">${esc(p.t)}</div><small>${p.p ? esc(p.p) + " · " : ""}${esc(p.m)}</small><small>${esc(T("from"))} ${esc(ZH() ? (p.fromNm || p.from) : (p.fromEn || p.from))} · ${esc(lvName(p.lv))}</small></div></div>`).join("")}</div>` : `<div class="wm none" style="margin-top:8px">${esc(T("pocketE"))}</div>`}`;
  card.classList.add("on"); $("veil").classList.add("on"); card.querySelector("[data-x]").onclick = closeCard;
  card.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { react(b, "🔊"); if (b.dataset.a){ clip.src = b.dataset.a; clip.playbackRate = RATE; clip.play().catch(() => say(b.dataset.s)); } else say(b.dataset.s); }); }

// ── 轮到你（稿子里的 turn）──
let PICK = {A: null, B: null}, OWN = false, SAID = false, HEARD = "", VOICE = null;
const TU = () => EP.turn;
const uiOf = (t, m) => (ZH() === (EP.l === "zh")) ? t : m;   // t 是在学的语言、m 是意思：挑界面语言的那一份（学中文：中文界面 t、英文界面 m；学英语反过来）
const qClip = new Audio();
function playSeq(list){ let n = 0; const go = () => { if (n >= list.length) return; qClip.src = list[n++]; qClip.playbackRate = RATE; qClip.onended = () => setTimeout(go, 250); qClip.play().catch(() => {}); }; pause(); go(); }
function sentence(){ const tu = TU(); if (!PICK.A || !PICK.B) return null; const c = (tu.combos || []).find(c => c.A === PICK.A.k && c.B === PICK.B.k);
  if (c && c.you) return {z: c.you.t, p: c.you.p || "", m: c.you.m || ""};
  const lo = s => String(s || "").replace(/^./, x => x.toLowerCase());
  return {z: tu.pat.t.replace("{A}", PICK.A.t).replace("{B}", PICK.B.t), p: (tu.pat.p || "").replace("{A}", lo(PICK.A.p)).replace("{B}", lo(PICK.B.p)), m: tu.pat.m.replace("{A}", PICK.A.m).replace("{B}", PICK.B.m)}; }
const bubbleG = G => G.map((t, j) => { const sp = /^\s/.test(t[0]) ? " " : "", w = t[0].replace(/^\s+/, ""); return sp + (t[2] ? `<span class="w" data-tj="${j}">${esc(w)}</span>` : esc(w)); }).join("");
const lowP = s => EP.l === "zh" ? String(s || "").replace(/^./, x => x.toLowerCase()) : "";
function optHTML(o, j){ const sub = [EP.l === "zh" ? lowP(o.p) : "", (EP.l === "zh" && ZH()) ? "" : o.m].filter(Boolean).join(" · "); return `<button class="op" data-j="${j}" lang="${EP.l}">${esc(o.t)}${sub ? `<small>${esc(sub)}</small>` : ""}</button>`; }
const HA_ST = () => { try { return JSON.parse(localStorage.getItem("howabout.v1")) || {}; } catch(e){ return {}; } };
function openTurn(){ closeCard(); stopRec(); PICK = {A: null, B: null}; OWN = false; SAID = false; HEARD = ""; TYPED = false; NOSND = false; VOICE = null; const tu = TU(), q = tu.q, pat = tu.pat;
  const pa = uiOf(pat.t, pat.m).split("{A}")[0] || "", pickA = pa.replace(/[，,\s]+$/, ZH() ? "，" : " ") + (ZH() ? "……" : "…"), pickB = UT("……再多说一点", "…and a bit more");   // 「下了班，我先……」/「After work, I first …」
  $("turnB").innerHTML = `<div class="host"><img src="${IMG(q.who)}" alt=""><div class="bub"><div class="z" id="qZ" lang="${EP.l}">${bubbleG(q.g)} <span class="ear" data-q>🔊</span></div>${EP.l === "zh" ? `<div class="p">${esc(q.p)}</div>` : ""}${(EP.l === "zh" && ZH()) ? "" : `<div class="m">${esc(q.m)}</div>`}</div></div>
   <div class="sec">${esc(pickA)}</div><div class="opts" data-g="A">${tu.A.map(optHTML).join("")}</div>
   <div class="sec">${esc(pickB)}</div><div class="opts" data-g="B">${tu.B.map(optHTML).join("")}</div>
   <div id="mine"></div><button class="own" id="ownB">${esc(T("own"))}</button>
   <div class="microw"><button class="mic" id="mic" disabled><span class="ic"><svg viewBox="0 0 24 24"><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zm6-3.5h-1.8a4.2 4.2 0 0 1-8.4 0H6a6 6 0 0 0 5.1 5.9V20h1.8v-2.6A6 6 0 0 0 18 11.5z"/></svg></span><span class="l2">${esc(T("mic"))}</span><span class="bars"><i></i><i></i><i></i><i></i><i></i></span></button></div>
   <div class="live" id="live">${esc(T("pickFirst"))}</div><div class="thread" id="thr"></div>`;
  $("turn").classList.add("on"); $("turnB").scrollTop = 0;
  $("turnB").querySelector("[data-q]").onclick = e => { react(e.currentTarget, "🔊"); playSeq([q.a]); };
  $("qZ").querySelectorAll(".w").forEach(w => w.onclick = e => { e.stopPropagation(); openWord(q.g[+w.dataset.tj], -1, w); });
  $("turnB").querySelectorAll(".opts").forEach(g => g.onclick = e => { const b = e.target.closest(".op"); if (!b || SAID || REC) return; g.querySelectorAll(".op").forEach(x => x.classList.toggle("on", x === b)); PICK[g.dataset.g] = tu[g.dataset.g][+b.dataset.j]; react(b, "✓"); say(PICK[g.dataset.g].t, .85); OWN = false; $("ownB").classList.remove("on"); showMine(); });
  $("ownB").onclick = e => { if (SAID || REC) return; OWN = !OWN; react(e.currentTarget, "✎"); e.currentTarget.classList.toggle("on", OWN); if (OWN){ PICK = {A: null, B: null}; SR.querySelectorAll(".op.on").forEach(x => x.classList.remove("on")); } showMine(); };
  holdMic($("mic")); }
function showMine(){ const s = sentence(), m = $("mine"), mic = $("mic");
  if (OWN){ m.innerHTML = `<div class="mine"><div class="lab">${esc(T("ownLab"))}</div><div class="z" id="mineZ" lang="${EP.l}" style="color:var(--soft);font-size:15px">${esc(T("ownOn"))}</div></div>`; mic.disabled = false; $("live").textContent = ""; toMic(); return; }
  if (!s){ m.innerHTML = ""; mic.disabled = true; $("live").textContent = T("pickFirst"); return; }
  const units = EP.l === "zh" ? [...s.z] : s.z.split(/(\s+)/);
  m.innerHTML = `<div class="mine"><div class="lab">${esc(T("yours"))}</div><div class="z" id="mineZ" lang="${EP.l}">${units.map(c => /^\s+$/.test(c) ? c : `<span>${esc(c)}</span>`).join("")}</div>${EP.l === "zh" ? `<div class="p">${esc(s.p)}</div>` : ""}${(EP.l === "zh" && ZH()) ? "" : `<div class="p" style="color:var(--soft)">${esc(s.m)}</div>`}</div>`; mic.disabled = false; $("live").textContent = "";
  $("mineZ").onclick = e => { react(e.currentTarget, "🔊"); say(s.z, .85); }; toMic(); }
function toMic(){ const tb = $("turnB"); setTimeout(() => tb.scrollTo({top: tb.scrollHeight, behavior: "smooth"}), 80); }

// 麦克风：主程序那一套（HVI.recStart：录音 + 听写）。点一下（停顿 1.5 秒自己停）或按住（松开停）。
// 认不出来就照实说：不打勾、不盖章、不回话、不能发送（只留一个标明「不算」的演示）。
const SRK = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
let REC = null, HOLD = false, DOWN = 0, IDLE = null, AUTO = null;
function holdMic(btn){ btn.onpointerdown = e => { if (btn.disabled || SAID) return; e.preventDefault(); if (REC){ stopRec(); return; } DOWN = Date.now(); HOLD = false; startRec(btn); setTimeout(() => { if (DOWN && REC){ HOLD = true; clearTimeout(AUTO); clearTimeout(IDLE); $("live").textContent = T("holding"); } }, 380); };
  btn.onpointerup = () => { const held = HOLD; DOWN = 0; HOLD = false; if (held && REC) stopRec(); }; btn.onpointerleave = () => { if (HOLD) btn.onpointerup(); }; btn.onpointercancel = btn.onpointerup; }
function startRec(btn){ const live = $("live"), tgt = OWN ? "" : (sentence() || {}).z || "", H = window.HVI;
  if (!SRK()){ noSR(); return; }   // 这台设备真的不会认字：才给「我说出来了」
  if (!H || !H.recStart || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)){ noMic(T("noMic")); return; }
  pause(); try { qClip.pause(); clip.pause(); speechSynthesis.cancel(); } catch(e){}
  const me = REC = {h: null}; let fin = "", failed = false; btn.classList.add("on"); blip(700); live.textContent = T("listening");
  const maxMs = tgt ? Math.min(12000, 3000 + [...tgt].length * (EP.l === "zh" ? 380 : 120)) : 9000;
  H.recStart({lang: BCP(), onText: t => { if (REC !== me) return; fin = t; live.innerHTML = `<b>${esc(t)}</b>`; paint(t, tgt); clearTimeout(IDLE); if (!HOLD) IDLE = setTimeout(stopRec, 1500); },
    onDone: v => { if (REC !== me) return; REC = null; clearTimeout(IDLE); clearTimeout(AUTO); btn.classList.remove("on"); doneRec((v && v.text) || fin, tgt, v); },
    onError: () => { failed = true; if (REC !== me) return; REC = null; btn.classList.remove("on"); noMic(T("noMic")); }})
   .then(h => { if (!h){ if (REC === me && !failed){ REC = null; btn.classList.remove("on"); noMic(T("noMic")); } return; } if (REC !== me){ try { h.stop(); } catch(e){} return; } me.h = h; if (!HOLD) AUTO = setTimeout(stopRec, maxMs); })
   .catch(() => { if (REC === me){ REC = null; btn.classList.remove("on"); noMic(T("noMic")); } }); }
function stopRec(){ clearTimeout(IDLE); clearTimeout(AUTO); if (!REC) return; if (REC.h) try { REC.h.stop(); } catch(e){} }
// 2026-11-13：能认字、但听不到声音 / 用不了麦克风：再试一次，或者改成打字（打的那句算你自己写的话）；不会认字的设备：「我说出来了」，你那句标「没录到声音」
let TYPED = false, NOSND = false;
function noSR(){ const live = $("live"); blip(330); const s = OWN ? null : sentence();
  live.innerHTML = `<span style="color:var(--hot);font-weight:800">${esc(T("noSR"))}</span> ` + (s ? `<button class="own" id="saidB" style="display:inline;padding:0 0 0 4px">${esc(T("saidB"))}</button>` : `<button class="own" id="typeB" style="display:inline;padding:0 0 0 4px">✍️ ${esc(T("typeB"))}</button>`);
  const sb = $("saidB"); if (sb) sb.onclick = e => { react(e.currentTarget, "✓"); NOSND = true; doneRec(s.z, s.z, null); };
  const tb = $("typeB"); if (tb) tb.onclick = e => { react(e.currentTarget, "✍️"); typeBox(); }; }
function noMic(msg){ const live = $("live"); blip(330); live.innerHTML = `<span style="color:var(--hot);font-weight:800">${esc(msg)}</span> <button class="own" id="typeB" style="display:inline;padding:0 0 0 4px">✍️ ${esc(T("typeB"))}</button>`;
  $("typeB").onclick = e => { react(e.currentTarget, "✍️"); typeBox(); }; }
function typeBox(){ const live = $("live"); live.innerHTML = `<textarea id="typeT" rows="2" lang="${EP.l}" dir="auto" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:7px 9px;font:500 15px/1.5 'Noto Serif SC',-apple-system,sans-serif" placeholder="${esc(T("typePh"))}">${esc(!OWN && sentence() ? sentence().z : "")}</textarea><button class="go" id="typeS" style="margin-top:6px">${esc(T("typeSend"))}</button>`;
  const ta = $("typeT"); ta.focus(); $("typeS").onclick = e => { const t = ta.value.trim(); if (!t){ toast(T("typePh")); return; } react(e.currentTarget, "📮", 990); OWN = true; PICK = {A: null, B: null}; SR.querySelectorAll(".op.on").forEach(x => x.classList.remove("on")); TYPED = true; showMine(); doneRec(t, "", null); }; }
function demo(){ const live = $("live"), mic = $("mic"), d = (OWN ? "" : (sentence() || {}).z) || T("demoEg"); let n = 0; mic.classList.add("on"); mic.disabled = true;
  const tag = `<br><small style="color:var(--hot)">${esc(T("demoTag"))}</small>`, ch = [...d];
  const iv = setInterval(() => { n++; live.innerHTML = `<span style="opacity:.6">${esc(ch.slice(0, n).join(""))}</span>${tag}`; if (n >= ch.length){ clearInterval(iv); setTimeout(() => { mic.classList.remove("on"); mic.disabled = false; live.innerHTML = `<span style="color:var(--soft)">${esc(T("demoEnd"))}</span>`; }, 900); } }, 110); }
const units = s => EP.l === "zh" ? [...String(s || "")].filter(c => HANR.test(c)) : String(s || "").toLowerCase().match(/[a-z']+/g) || [];
function paint(heard, tgt){ if (!tgt){ const mz = $("mineZ"); if (mz && heard){ mz.style.color = ""; mz.style.fontSize = ""; mz.textContent = heard; } return; }
  const H = new Set(EP.l === "zh" ? [...heard] : units(heard)); SR.querySelectorAll("#mineZ span").forEach(s => s.classList.toggle("hitc", H.has(EP.l === "zh" ? s.textContent : s.textContent.toLowerCase().replace(/[^a-z']/g, "")))); }
function doneRec(heard, tgt, v){ const live = $("live"); heard = String(heard || "").trim();
  const hz = units(heard), tz = units(tgt), hit = tz.filter(c => hz.includes(c)).length;
  const ok = TYPED || NOSND || (tgt ? (tz.length && hit / tz.length >= .5) : hz.length >= (EP.l === "zh" ? 2 : 2));
  if (!ok && !heard){ noMic(T("noSound")); return; }
  if (!ok){ live.innerHTML = heard ? `<span style="color:var(--soft)">${esc(T("heard"))} </span><b>${esc(heard)}</b><br><span style="color:var(--soft)">${esc(T("grey"))}</span>` : `<span style="color:var(--soft)">${esc(T("grey"))}</span>`; blip(330); return; }
  SAID = true; HEARD = heard; VOICE = v && v.blob ? v : null; const btn = $("mic"); btn.disabled = true;
  live.innerHTML = NOSND ? `<span class="okk">✓ ${esc(T("saidIt"))}</span> <span class="hd">${esc(T("noRec"))}</span>` : TYPED ? `<span class="okk">✓ ${esc(T("typedOk"))}</span>` : `<span class="okk">✓ ${esc(T("heard"))}</span> <b>${esc(heard)}</b>`;
  if (!tgt){ const mz = $("mineZ"); if (mz){ mz.style.color = ""; mz.style.fontSize = ""; mz.textContent = heard; } }
  if (tgt && !NOSND) paint(heard, tgt);   // 只有真听到的字变绿，不替你补完
  const ml = mineLine(); if (ml.heard) live.innerHTML += ` <span class="hd">${esc(T("heardTag"))}</span>`;
  const line = mineLine(); setSt(o => { o.said[EP.id] = Object.assign({t: line.t, p: line.p, own: OWN ? 1 : 0, lv: LV, ts: Date.now()}, line.nosnd ? {nosnd: 1} : {}, TYPED ? {typed: 1} : {}); }); refreshCards();
  stamp(T("saidIt"), T("saidS"));
  const thr = $("thr"), R = TU().reply, who = R.who;
  const parts = tgt && PICK.A && PICK.B ? [R.A[PICK.A.k], R.B[PICK.B.k]].filter(Boolean) : [];
  if (parts.length) setTimeout(() => { thr.innerHTML = `<div class="typing"><img src="${IMG(who)}" alt=""><i></i><i></i><i></i></div>`; }, 900);
  setTimeout(() => { if (!SR) return;
    const msg = parts.length ? `<div class="msg"><img src="${IMG(who)}" alt=""><div class="bx"><div class="z" id="rZ" lang="${EP.l}">${parts.map((x, n) => `<span data-n="${n}">${bubbleG(x.g)}</span>`).join(EP.l === "zh" ? "" : " ")} <span class="ear" data-r>🔊</span></div>${EP.l === "zh" ? `<small>${esc(parts.map(x => x.p).join(" "))}</small>` : ""}${(EP.l === "zh" && ZH()) ? "" : `<small>${esc(parts.map(x => x.m).join(" "))}</small>`}</div></div>`
      : `<div class="sent" style="margin-top:0">${esc(uiOf(R.own.t, R.own.m))}</div>`;
    thr.innerHTML = msg + `<div id="haBox"></div><div class="after"><button class="lt" id="again">${esc(T("replay"))}</button><button class="lt" id="other">${esc(T("other"))}</button></div>`; haBox(); toMic(); blip(880);
    if (parts.length){ playSeq(parts.map(x => x.a)); thr.querySelector("[data-r]").onclick = e => { react(e.currentTarget, "🔊"); playSeq(parts.map(x => x.a)); };
      thr.querySelectorAll("#rZ [data-n] .w").forEach(w => w.onclick = () => { const x = parts[+w.parentNode.dataset.n]; openWord(x.g[+w.dataset.tj], -1, w); }); }
    $("again").onclick = e => { react(e.currentTarget, "↺"); $("turn").classList.remove("on"); play(0); };
    $("other").onclick = e => { react(e.currentTarget, "✦"); $("turn").classList.remove("on"); $("scr").scrollTo({top: 0, behavior: "smooth"}); const b = $("lv").querySelector("button:not(.on)"); if (b) b.animate([{transform: "scale(1)"}, {transform: "scale(1.08)"}, {transform: "scale(1)"}], {duration: 500, iterations: 2}); };
  }, parts.length ? 2100 : 700); }
// 说出口的那一句：选的（对上了才算）就用拼好的整句；自己说的就是听写出来的原话
function mineLine(){ if (OWN || !PICK.A || !PICK.B) return {t: HEARD, p: "", own: 1}; const s = sentence(); if (NOSND) return {t: s.z, p: s.p, nosnd: 1};
  return units(HEARD).join(" ") === units(s.z).join(" ") ? {t: s.z, p: s.p} : {t: HEARD, p: "", heard: 1}; }   // 听到的跟拼好的那句不一样：存、送的都是听到的原话
// 送到今天「你那边呢」的回答里：这一期是今天的、「你那边呢」今天开着，才有这颗按钮
function haDate(){ try { const d = window.HOWABOUT && window.HOWABOUT._day && window.HOWABOUT._day(); return d ? d.date : ""; } catch(e){ return ""; } }
const canHA = () => !!(EP && window.HOWABOUT && window.HOWABOUT.give && (!window.HOWABOUT.ok || window.HOWABOUT.ok()) && haDate() === EP.date && EP.date === eff());
function haBox(){ const box = $("haBox"); if (!box) return; if (!canHA()){ box.innerHTML = ""; return; }
  const D0 = HA_ST().d || {}, done = D0[EP.date + "|" + EP.l] || (D0[EP.date] && (D0[EP.date].l || EP.l) === EP.l ? D0[EP.date] : null);   // howabout 回答按「日期|语言」存（老数据只有日期）
  box.innerHTML = done ? `<div class="sent">${esc(T("already"))} <button class="own" id="seeHa" style="display:inline;padding:0 0 0 4px">${esc(T("seeHa"))}</button></div>`
    : `<button class="go big" id="sendW">${esc(T("sendW"))}<small>${esc(T("sendS"))}</small></button>`;
  const s = $("seeHa"); if (s) s.onclick = e => { react(e.currentTarget, "→"); toHA(null); };
  const b = $("sendW"); if (b) b.onclick = e => { react(e.currentTarget, "📮", 990); toHA(Object.assign(mineLine(), {voice: VOICE})); }; }
function toHA(line){ const under = !!(window.HOWABOUT && window.HOWABOUT.isOpen && window.HOWABOUT.isOpen());
  hidePage(); if (location.hash.startsWith("#podcast")){ if (HIST && under) history.back(); else try { history.replaceState({rt: 1}, "", location.pathname + location.search + "#howabout"); } catch(e){} } HIST = 0; mini();
  setTimeout(() => { try { if (line && line.t) window.HOWABOUT.give(line); else window.HOWABOUT.open(); } catch(e){} }, under ? 80 : 0); }

// ── 底下的小播放条：关掉这一页不停 ──
function mini(){ if (!EP) return; injectCss(); if (!isOpen()) refreshCards(); if (!MINI){ MINI = document.createElement("div"); MINI.id = "podMini"; MINI.hidden = true; MINI.dataset.nopy = ""; document.body.appendChild(MINI); MSR = MINI.attachShadow({mode: "open"});
    MSR.innerHTML = `<style>${MCSS}</style><div class="m" id="m"><button class="o" id="mo"><img id="mi" alt=""><span class="t"><b id="mt"></b><small id="ms"></small></span></button><button class="p" id="mp"></button><button class="x" id="mx">✕</button><i class="f" id="mf"></i></div>`;
    MSR.getElementById("mo").onclick = () => open({});
    MSR.getElementById("mp").onclick = () => { toggle(); };
    MSR.getElementById("mx").onclick = () => { pause(); STARTED = false; mini(); }; }
  const show = !isOpen() && STARTED && !FINISHED; MINI.hidden = !show; document.body.classList.toggle("pod-mini", show); if (!show) return;   // pod-mini：页面底部留出小播放条的高度
  const l = L()[I] || L()[0]; MSR.getElementById("mi").src = IMG(l.w); MSR.getElementById("mt").textContent = tgtTitle(EP); MSR.getElementById("mt").lang = EP.l;
  MSR.getElementById("ms").textContent = `${PLAYING ? T("miniOn") : T("miniPause")} · ${nm(l.w)} · ${I + 1}/${L().length}`;
  MSR.getElementById("mp").innerHTML = PLAYING ? '<svg viewBox="0 0 24 24"><path d="M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>';
  MSR.getElementById("mp").ariaLabel = PLAYING ? T("pause") : T("play"); MSR.getElementById("mx").ariaLabel = T("stop"); }

// ── 打开、关上 ──
const isOpen = () => !!(HOST && !HOST.hidden);
// 上次听的那一档；没听过就跟「你那边呢」选的档一样（AK.level：0 刚开始 / 1 能聊日常 / 2 比较流利）
const defLv = ep => { const st = ST(); let v = ep.levels[st.lv] ? st.lv : (window.AK && window.AK.level ? LVS[window.AK.level()] : "") || "daily"; return ep.levels[v] ? v : "daily"; };
function pickEp(o){ if (o.id) return epById(o.id); if (EP && EP.l === LEARN() && (STARTED || EP.date === eff())) return EP;
  return epToday() || EPS().filter(e => e.date <= eff()).pop() || null; }
function open(o){ o = o || {};
  if (!UIOK()){ try { if (location.hash.startsWith("#podcast")) history.replaceState({rt: 1}, "", location.pathname + location.search + "#boat"); if (window.hvRt) window.hvRt.today(); } catch(e){} return false; }   // 西日阿界面还没翻：直接打开 #podcast 的转回「今天」
  const ep = pickEp(o); if (!ep){ if (o.toast !== false) try { window.AK && window.AK.toast && window.AK.toast(T("none")); } catch(e){} return false; }
  shell(); TXC = null; if (ep !== EP){ resetPlayer(); EP = ep; LV = defLv(ep); }
  BYID = !!o.id && o.id !== (epToday() || {}).id;
  HOST.hidden = false; HOST.classList.toggle("rtl", document.documentElement.dir === "rtl"); document.body.classList.add("pod-on");
  const want = "#podcast" + (BYID ? "/" + encodeURIComponent(EP.id) : "");
  if (!location.hash.startsWith("#podcast")){ try { history.pushState({rt: 1, pod: 1}, "", location.pathname + location.search + want); HIST = 1; } catch(e){ HIST = 0; } }
  renderCover(); renderTx(); pkCount(false); $("turn").classList.remove("on"); closeCard(); mini(); try { window.hvPulse && window.hvPulse("act"); } catch(e){}
  if (STARTED) setTimeout(() => follow(true), 60); else $("scr").scrollTop = 0;   // 还没开始听：停在封面
  if (o.play && !PLAYING && !FINISHED) toggle();
  return true; }
function hidePage(){ if (!HOST || HOST.hidden) return; stopRec(); HOST.hidden = true; document.body.classList.remove("pod-on"); HOLDRESUME = false; try { qClip.pause(); clip.pause(); } catch(e){} }
// fromPop = 返回键 / 别的页面要打开（历史已经退过了）。关上不停播，底下留小播放条。
function close(fromPop){ if (!isOpen()) return; hidePage();
  if (!fromPop && location.hash.startsWith("#podcast")){ if (HIST) history.back(); else { const h = window.hvRt ? window.hvRt.now() : "boat"; try { history.replaceState({rt: 1}, "", location.pathname + location.search + "#" + (/^podcast/.test(h) ? "boat" : h)); } catch(e){} } }
  HIST = 0; mini(); refreshCards(); }
const route = () => "podcast" + (BYID && EP ? "/" + encodeURIComponent(EP.id) : "");

// ── 「今天」页上的小卡、「你那边呢」里的一行 ──
const UIOK = () => ["zh", "en"].includes(UIL());
// 「今天」页：这一天「你那边呢」的卡在的话，播客不另放一张卡，只在那张卡里一行「🎧 先听听他们怎么聊」（不比「你那边呢」抢眼）
const inHa = ep => { try { const H = window.HOWABOUT; return !!(H && H.card && (!H.ok || H.ok()) && H._day && H._day().date === ep.date); } catch(e){ return false; } };
function card(){ const ep = epToday(); if (!ep || !UIOK() || inHa(ep)) return ""; injectCss(); const st = ST(), done = st.done[ep.id] && Object.keys(st.done[ep.id]).length, on = EP === ep && PLAYING, mid = EP === ep && STARTED && !FINISHED;
  const faces = ep.order.slice(0, 3).map(id => `<img src="${IMG(id, ep)}" alt="">`).join(""), names = ep.order.map(id => ZH() ? ep.cast[id].nm : ep.cast[id].en).join(" · ");
  const lv = EP === ep ? LV : defLv(ep), mins = Math.max(1, Math.round(lenOf(ep, lv) / 60)), mean = meanTitle(ep);
  return `<div class="pod-card" data-podopen="1" data-nopy><div class="pod-ck">${esc(T("card"))}</div><div class="pod-cb"><span class="pod-faces">${faces}</span><div class="pod-ct"><b lang="${ep.l}">${esc(tgtTitle(ep))}</b>${mean ? `<small>${esc(mean)}</small>` : ""}<small>${esc(names)} · ${mins} ${esc(T("min"))}</small></div></div><button class="pod-go" data-podopen="1">${esc(on ? T("cardOn") : mid ? "▶ " + T("resume") : done ? T("cardDone") : T("cardGo"))}</button></div>`; }
function haRow(date){ const ep = EPS().find(e => e.date === date); if (!ep || ep.date !== eff() || !UIOK()) return ""; injectCss(); const mid = EP === ep && STARTED && !FINISHED;
  return `<button class="pod-ha" data-podopen="1" data-nopy><span class="pod-faces s">${ep.order.slice(0, 3).map(id => `<img src="${IMG(id, ep)}" alt="">`).join("")}</span><span>${esc(PLAYING && EP === ep ? T("cardOn") : mid ? "▶ " + T("resume") : T("haRow"))}</span><b>›</b></button>`; }
function refreshCards(){ document.querySelectorAll(".pod-ha").forEach(el => { const d = (window.HOWABOUT && window.HOWABOUT._day && window.HOWABOUT._day().date) || eff(), h = haRow(d); if (!h) return; const t = document.createElement("div"); t.innerHTML = h; el.replaceWith(t.firstElementChild); });
  document.querySelectorAll(".pod-card").forEach(el => { const h = card(); if (!h){ el.remove(); return; } const t = document.createElement("div"); t.innerHTML = h; el.replaceWith(t.firstElementChild); }); }
function injectCss(){ if (document.getElementById("podCss")) return; const s = document.createElement("style"); s.id = "podCss"; s.textContent = DCSS; document.head.appendChild(s); }
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-podopen]"); if (!b) return; e.preventDefault(); e.stopPropagation(); open({play: 1}); }, true);

// 地址 #podcast：软件里由 template2 的 rtGo 打开（先开「今天」再盖上）；没有主程序的页面自己开
const hashId = () => { const m = location.hash.match(/^#podcast(?:\/(.+))?$/); return m ? {id: m[1] ? decodeURIComponent(m[1]) : ""} : null; };
(() => { if (!hashId()) return; let n = 0; const t = setInterval(() => { if (window.hvRt){ clearInterval(t); return; } if (document.readyState === "complete" || ++n > 200){ clearInterval(t); if (!window.hvRt){ const h = hashId(); if (h) open(h.id ? {id: h.id} : {}); } } }, 300); })();
addEventListener("popstate", () => { if (isOpen() && !location.hash.startsWith("#podcast")){ HIST = 0; close(true); } });
document.addEventListener("keydown", e => { if (!isOpen()) return;
  if (e.key === "Escape"){ if (cardOpen()){ closeCard(); return; } if ($("turn").classList.contains("on")){ stopRec(); $("turn").classList.remove("on"); return; } close(); return; }
  if (e.code === "Space" && (e.target === document.body || e.target === HOST)){ e.preventDefault(); toggle(); } });

window.PODCAST = {open, close, isOpen, card, haRow, route, _st: ST, pause: () => { if (PLAYING) pause(); try { qClip.pause(); clip.pause(); } catch(e){} }};

const DCSS = `body.pod-on{overflow:hidden}#podPg{position:fixed;inset:0;z-index:66;background:#ece4d3}#podPg[hidden],#podMini[hidden]{display:none!important}
body.pod-mini #boatPg,body.pod-mini #ppPg,body.pod-mini #ppPerson,body.pod-mini .ak-page{padding-bottom:calc(170px + env(safe-area-inset-bottom,0px))!important}
@media(min-width:701px){body.pod-mini #boatPg,body.pod-mini #ppPg,body.pod-mini #ppPerson,body.pod-mini .ak-page{padding-bottom:110px!important}}
#podMini{position:fixed;z-index:64;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));width:min(400px,calc(100% - 32px))}
@media(min-width:701px){#podMini{left:auto;right:20px;transform:none;bottom:20px;width:340px}}
.pod-card{display:block;margin:0 0 12px;background:#14305c;color:#fff;border-radius:18px;padding:13px 14px 12px;position:relative;overflow:hidden;cursor:pointer;box-shadow:0 4px 16px rgba(20,48,92,.18)}
.pod-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(226,85,47,.55),transparent 45%),radial-gradient(circle at 0% 100%,rgba(44,100,184,.55),transparent 50%);pointer-events:none}
.pod-card>*{position:relative}.pod-ck{font:800 11.5px/1.3 -apple-system,sans-serif;letter-spacing:.06em;color:#ffd6c8}
.pod-cb{display:flex;gap:11px;align-items:center;margin-top:8px}.pod-ct{min-width:0;flex:1}.pod-ct b{display:block;font:900 18px/1.35 "Noto Serif SC",Georgia,serif}.pod-ct small{display:block;font-size:12px;opacity:.82;margin-top:1px}
.pod-faces{display:flex;flex:none}.pod-faces img{width:38px;height:38px;border-radius:50%;object-fit:cover;border:2.5px solid #fff;background:#c9bfa8;margin-inline-start:-11px}.pod-faces img:first-child{margin-inline-start:0}
.pod-faces.s img{width:24px;height:24px;border-width:2px;margin-inline-start:-8px}
.pod-go{margin-top:10px;width:100%;border:0;border-radius:99px;background:#e2552f;color:#fff;font:800 14px -apple-system,sans-serif;padding:9px;cursor:pointer}
.pod-ha{display:flex;align-items:center;gap:9px;width:100%;margin:10px 0 0;border:1.5px dashed #f2b9a6;background:#fff7f2;border-radius:14px;padding:9px 12px;color:#a4321a;font:800 13.5px/1.35 -apple-system,"PingFang SC",sans-serif;text-align:start;cursor:pointer}.pod-ha>span:nth-child(2){flex:1}.pod-ha b{font-size:18px}`;

const MCSS = `*{box-sizing:border-box}button{font:inherit;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}
.m{position:relative;display:flex;align-items:center;gap:6px;background:#14305c;color:#fff;border-radius:18px;padding:7px 8px 9px;box-shadow:0 8px 24px rgba(0,0,0,.3);overflow:hidden;font:13px/1.3 -apple-system,"PingFang SC",sans-serif}
.o{flex:1;min-width:0;display:flex;align-items:center;gap:9px;border:0;background:none;text-align:start;padding:0}
.o img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#c9bfa8;flex:none}
.t{min-width:0}.t b{display:block;font:800 14px/1.3 "Noto Serif SC",Georgia,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.t small{display:block;font-size:11.5px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p{width:38px;height:38px;border-radius:50%;border:0;background:#e2552f;display:grid;place-items:center;flex:none}.p svg{width:18px;height:18px;fill:#fff}
.x{width:30px;height:30px;border:0;background:rgba(255,255,255,.12);border-radius:50%;flex:none;font-size:12px}
.f{position:absolute;left:0;bottom:0;height:3px;background:#e2552f;width:0}`;

const CSS = `:host{--ink:#14305c;--ivory:#fbf7ee;--hot:#e2552f;--blue:#2c64b8;--ok:#2f7d70;--soft:#6b7488;--desk:#ece4d3;--line:#e6dfcf}
*{box-sizing:border-box}button{font:inherit;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}[hidden]{display:none!important}
.pg{height:100%;max-width:640px;margin:0 auto;background:var(--ivory);display:flex;flex-direction:column;position:relative;overflow:hidden;color:#24303a;font:15px/1.55 -apple-system,"PingFang SC","Helvetica Neue",sans-serif}
@media(min-width:700px){.pg{box-shadow:0 0 40px rgba(20,48,92,.15)}}
.bar{display:flex;align-items:center;gap:8px;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top,0px));border-bottom:1px solid var(--line);font-size:13px;color:var(--soft);background:var(--ivory);z-index:4}
.bar b{color:var(--ink);font-size:14px}.bar .sp{flex:1}
.xb{border:0;background:#efe8d8;width:32px;height:32px;border-radius:50%;flex:none;color:var(--ink)}
.pk{position:relative;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:3px 10px 3px 8px;font-weight:800;font-size:12.5px;color:var(--ink);display:flex;align-items:center;gap:5px}
.pk .n{background:var(--hot);color:#fff;border-radius:99px;min-width:18px;height:18px;font-size:11px;display:grid;place-items:center;padding:0 5px}
.pk.bump{animation:bump .5s cubic-bezier(.3,1.8,.5,1)}@keyframes bump{40%{transform:scale(1.25)}}
.scr{flex:1;overflow-y:auto;overflow-x:hidden;position:relative;scroll-behavior:auto;overscroll-behavior:contain}
.cover{padding:16px 16px 14px;background:linear-gradient(180deg,#f3ead6,var(--ivory));border-bottom:1px solid var(--line)}
.kick{font:700 11px/1.3 Georgia,serif;letter-spacing:.16em;text-transform:uppercase;color:var(--hot)}
.art{margin:12px 0 10px;background:var(--ink);border-radius:20px;padding:16px 14px 14px;color:#fff;position:relative;overflow:hidden}
.art:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 10%,rgba(226,85,47,.55),transparent 45%),radial-gradient(circle at 0% 100%,rgba(44,100,184,.6),transparent 50%)}
.art>*{position:relative}
.faces{display:flex;justify-content:center;gap:14px}
.face{text-align:center;width:86px}
.face img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3);background:#c9bfa8;transition:transform .25s}
.face.talk img{transform:scale(1.08);border-color:#ffd6c8;box-shadow:0 0 0 4px rgba(226,85,47,.55),0 4px 12px rgba(0,0,0,.3)}
.face b{display:block;font-size:12.5px;margin-top:5px}.face small{display:block;font-size:11px;opacity:.75}
.art h1{font:900 23px/1.35 "Noto Serif SC",Georgia,serif;margin:14px 0 2px;text-align:center}
.art .en{font:italic 14px/1.4 Georgia,serif;text-align:center;opacity:.85}
.art .meta{display:flex;justify-content:center;gap:8px;margin-top:9px;font-size:11.5px;opacity:.8;flex-wrap:wrap}
.lv{display:flex;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:3px;gap:2px}
.lv button{flex:1;border:0;background:none;border-radius:11px;padding:6px 4px;font-weight:800;font-size:12.5px;color:var(--soft);line-height:1.25}
.lv button small{display:block;font-weight:500;font-size:10.5px;opacity:.8}
.lv button.on{background:var(--ink);color:#fff}
.bigplay{margin-top:11px;width:100%;border:0;border-radius:99px;background:var(--hot);color:#fff;font-weight:800;font-size:15px;padding:11px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 16px rgba(226,85,47,.3)}
#tx{padding:14px 14px 30px}
.ln{display:flex;gap:9px;padding:9px 8px;border-radius:14px;opacity:.38;transition:opacity .35s,background .35s;cursor:pointer}
.ln.near{opacity:.62}.ln.on{opacity:1;background:#fff;box-shadow:0 3px 14px rgba(20,48,92,.09)}.ln.done{opacity:.5}
.ln .av{width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.15);background:#c9bfa8;margin-top:2px}
.ln .bd{min-width:0;flex:1}
.ln .who{font-size:11.5px;color:var(--soft);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.ln .who b{color:var(--ink);font-size:12px}
.ln .who .tg{font-size:10px;border-radius:99px;padding:0 6px;background:#f1ece0}.ln .who .tg.lrn{background:#fde7df;color:#a4432a}
.ln .who .eq{display:none;gap:2px;align-items:flex-end;height:11px;margin-left:2px}.ln.on.playing .who .eq{display:inline-flex}
.eq i{width:2.5px;background:var(--hot);border-radius:2px;animation:bb .7s infinite ease-in-out}.eq i:nth-child(2){animation-delay:.12s}.eq i:nth-child(3){animation-delay:.24s}.eq i:nth-child(4){animation-delay:.06s}
@keyframes bb{0%,100%{height:3px}50%{height:11px}}
.zh{font:700 17.5px/1.75 "Noto Serif SC",Georgia,serif;color:var(--ink);overflow-wrap:anywhere}.ln.on .zh{font-size:19px}
.w{border-radius:4px;transition:background .15s;cursor:pointer}.w:hover{background:#eaf0fa}.w.hit{background:#cfe0f7}
.bw{text-decoration:underline;text-decoration-color:var(--hot);text-decoration-thickness:2px;text-underline-offset:5px;text-decoration-skip-ink:none;cursor:pointer}
.bw.got{text-decoration-style:double;text-decoration-color:var(--ok)}
.pyl{font-size:12.5px;color:#8a8f9c;line-height:1.45;margin-top:1px}.enl{font-size:13px;color:var(--soft);line-height:1.45;margin-top:2px}
#tx.nopy .pyl,#tx.noen .enl{display:none}
.endcta{display:block;margin:6px 14px 30px;border:2px dashed #f2b9a6;background:#fff7f2;border-radius:16px;padding:12px;text-align:center;color:#a4321a;font-weight:800;width:calc(100% - 28px)}
.back2now{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(140px + env(safe-area-inset-bottom,0px));z-index:6;border:0;background:var(--ink);color:#fff;border-radius:99px;padding:6px 14px;font-size:12px;font-weight:800;box-shadow:0 4px 12px rgba(20,48,92,.3);display:none}
.back2now.on{display:block;animation:pop .25s}
.dock{border-top:1px solid var(--line);background:#fffdf8;padding:9px 12px calc(12px + env(safe-area-inset-bottom,0px));z-index:5}
.prog{height:5px;background:#ece6d8;border-radius:99px;position:relative;cursor:pointer;margin:2px 2px 0;touch-action:manipulation}
.prog:before{content:"";position:absolute;left:0;right:0;top:-9px;bottom:-9px}
.prog .f{position:absolute;left:0;top:0;bottom:0;background:var(--hot);border-radius:99px;width:0}
.prog .tk{position:absolute;top:-2px;width:1px;height:9px;background:rgba(20,48,92,.12)}
.tm{display:flex;justify-content:space-between;font-size:10.5px;color:var(--soft);margin:4px 2px 4px;font-variant-numeric:tabular-nums}
.now{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--soft);min-height:22px}
.now img{width:22px;height:22px;border-radius:50%;object-fit:cover}.now b{color:var(--ink)}
.now .eq{display:inline-flex;gap:2px;align-items:flex-end;height:13px}.now .eq i{animation-play-state:paused}.dock.playing .now .eq i{animation-play-state:running}
.btns{display:flex;align-items:center;justify-content:space-between;margin-top:6px}
.rb{border:0;background:none;border-radius:12px;min-width:40px;height:40px;display:grid;place-items:center;font-weight:800;color:var(--ink);font-size:12px;padding:0 6px}
.rb svg{width:22px;height:22px;fill:var(--ink)}
.rb.tog{font-size:11.5px;border:1.5px solid var(--line);height:30px;min-width:34px;border-radius:9px;color:var(--soft)}.rb.tog.on{background:var(--ink);border-color:var(--ink);color:#fff}
.pp{width:56px;height:56px;border-radius:50%;background:var(--hot);border:0;display:grid;place-items:center;box-shadow:0 5px 14px rgba(226,85,47,.35);flex:none}.pp svg{width:26px;height:26px;fill:#fff}
.sp1{font-variant-numeric:tabular-nums}
.veil{position:absolute;inset:0;background:rgba(20,48,92,.18);z-index:20;opacity:0;pointer-events:none;transition:opacity .2s}.veil.on{opacity:1;pointer-events:auto}
.card{position:absolute;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-radius:20px;padding:15px 16px 14px;z-index:21;box-shadow:0 -6px 30px rgba(20,48,92,.25);transform:translateY(130%);transition:transform .32s cubic-bezier(.3,1.25,.5,1);visibility:hidden}
.card.on{transform:none;visibility:visible}
.card .x{position:absolute;right:10px;top:8px;border:0;background:none;font-size:20px;color:var(--soft)}
.card .wd{font:900 30px/1.3 "Noto Serif SC",Georgia,serif;color:var(--ink);padding-right:24px}.card .wd.ph{font-size:22px}
.card .wp{font-size:15px;color:var(--blue);font-weight:700;margin-top:1px}.card .wm{font-size:14.5px;color:#3b4553;margin-top:4px}.card .wm.none{color:var(--soft);font-size:12.5px}
.card .k{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--hot);margin-bottom:3px}
.card .row{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}
.lt{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:6px 12px;font-weight:700;font-size:12.5px;color:var(--ink)}
.go{border:0;border-radius:99px;padding:7px 14px;font-weight:800;font-size:13px;background:var(--hot);color:#fff}.go.got{background:var(--ok)}
.go.big{display:block;width:100%;margin-top:12px;padding:10px 14px;font-size:14.5px;box-shadow:0 5px 14px rgba(226,85,47,.3)}.go.big small{display:block;font-weight:600;font-size:11.5px;opacity:.88}
.chs{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.ch{border:1px solid var(--line);background:#fffdf8;border-radius:10px;padding:2px 8px;font:700 14px/1.5 "Noto Serif SC",Georgia,serif;color:var(--ink)}.ch small{font:500 10.5px -apple-system,sans-serif;color:var(--soft);margin-left:3px}
.fly{position:fixed;z-index:99;pointer-events:none;background:#fff1ec;border:1.5px solid var(--hot);color:#a4321a;border-radius:99px;padding:3px 10px;font:700 13px "Noto Serif SC",Georgia,serif;transition:transform .7s cubic-bezier(.5,-.3,.6,1),opacity .7s;white-space:nowrap}
.plist{max-height:min(330px,60vh);overflow:auto;margin-top:6px}
.pi{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line)}
.pi .t{font:700 15.5px/1.5 "Noto Serif SC",Georgia,serif;color:var(--ink)}.pi small{display:block;font-size:12px;color:var(--soft)}
.pi .e{border:0;background:#f1ece0;border-radius:50%;width:30px;height:30px;flex:none}
.turn{position:absolute;inset:0;background:var(--ivory);z-index:15;transform:translateY(100%);transition:transform .45s cubic-bezier(.3,1.1,.5,1);display:flex;flex-direction:column;visibility:hidden}
.turn.on{transform:none;visibility:visible}
.turn .tb{flex:1;overflow:auto;padding:16px 15px calc(26px + env(safe-area-inset-bottom,0px))}
.host{display:flex;gap:10px;align-items:flex-start}
.host img{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.18);flex:none}
.bub{background:#fff;border-radius:4px 16px 16px 16px;padding:9px 12px;box-shadow:0 2px 10px rgba(20,48,92,.07);flex:1;min-width:0}
.bub .z{font:900 19px/1.5 "Noto Serif SC",Georgia,serif;color:var(--ink)}
.bub .p{font-size:12.5px;color:#8a8f9c}.bub .m{font-size:13px;color:var(--soft)}
.ear{font-size:14px;cursor:pointer}
.sec{font-size:11.5px;font-weight:800;letter-spacing:.04em;color:var(--soft);margin:15px 0 6px}
.opts{display:flex;flex-wrap:wrap;gap:6px}
.op{border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:5px 10px;text-align:left;font:700 14.5px/1.4 "Noto Serif SC",Georgia,serif;color:var(--ink);transition:transform .12s}
.op small{display:block;font:500 11px/1.3 -apple-system,sans-serif;color:var(--soft)}
.op.on{border-color:var(--hot);background:#fff1ec;color:#a4321a}
.mine{margin-top:14px;background:#fff7f2;border:1.5px solid #f6cdbd;border-radius:16px;padding:11px 13px;position:relative;animation:pop .3s cubic-bezier(.3,1.5,.5,1)}
.mine .lab{font-size:11.5px;color:var(--soft);font-weight:700}
.mine .z{font:900 19px/1.55 "Noto Serif SC",Georgia,serif;color:#a4321a;cursor:pointer}.mine .z .hitc{color:var(--ok)}
.mine .p{font-size:12.5px;color:#9a8f86}
.own{border:0;background:none;color:var(--ink);text-decoration:underline;text-underline-offset:3px;font-size:12.5px;font-weight:700;padding:8px 0 0}.own.on{color:var(--hot)}
.microw{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}
.mic{display:flex;align-items:center;gap:9px;border:0;border-radius:99px;padding:7px 16px 7px 7px;background:var(--hot);color:#fff;font-weight:800;font-size:14px;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 5px 14px rgba(226,85,47,.3)}
.mic .ic{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center}.mic .ic svg{width:18px;height:18px;fill:#fff}
.mic.on{background:#c2341a;animation:pul 1.1s infinite}@keyframes pul{50%{box-shadow:0 0 0 9px rgba(226,85,47,.18)}}
.mic .bars{display:none;gap:3px;align-items:center;height:18px}.mic.on .bars{display:flex}.mic.on .l2{display:none}
.mic .bars i{width:3px;background:#fff;border-radius:2px;animation:bb2 .6s infinite ease-in-out}.mic .bars i:nth-child(2){animation-delay:.1s}.mic .bars i:nth-child(3){animation-delay:.2s}.mic .bars i:nth-child(4){animation-delay:.3s}.mic .bars i:nth-child(5){animation-delay:.15s}
@keyframes bb2{0%,100%{height:4px}50%{height:17px}}
.mic[disabled]{opacity:.35;box-shadow:none}
.live{font-size:13px;color:var(--soft);min-height:18px;margin-top:6px}.live b{color:var(--ink)}.live .hd{font-size:11.5px;color:var(--soft)}
.okk{color:var(--ok);font-weight:800}
.thread{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.msg{display:flex;gap:7px;align-items:flex-start;animation:pop .3s}
.msg img{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:none}
.msg .bx{background:#eef3fb;border:1px solid #d6e2f4;border-radius:4px 12px 12px 12px;padding:6px 10px;min-width:0}
.msg .bx .z{font:700 15px/1.5 "Noto Serif SC",Georgia,serif;color:var(--ink)}.msg .bx small{display:block;font-size:12px;color:var(--soft)}
.typing{font-size:12px;color:var(--soft);display:flex;gap:4px;align-items:center}.typing img{width:22px;height:22px;border-radius:50%;object-fit:cover}.typing i{width:5px;height:5px;border-radius:50%;background:var(--soft);animation:bb3 1s infinite}.typing i:nth-child(3){animation-delay:.15s}.typing i:nth-child(4){animation-delay:.3s}
@keyframes bb3{50%{transform:translateY(-3px);opacity:.4}}
.after{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
.sent{margin-top:12px;background:#fff;border-radius:14px;padding:10px 12px;font-size:13px;color:var(--soft);border:1px dashed var(--line);animation:pop .3s}.sent b{color:var(--ink)}
@keyframes pop{from{transform:scale(.94);opacity:0}}
.press{transform:scale(.9)!important;transition:transform .08s}
.flt{position:fixed;pointer-events:none;font-size:15px;color:var(--hot);font-weight:900;animation:fl .9s forwards;z-index:99}@keyframes fl{to{transform:translateY(-34px);opacity:0}}
.stamp{position:absolute;left:50%;top:38%;z-index:40;border:3px solid var(--hot);color:var(--hot);border-radius:10px;padding:5px 14px;font:900 20px/1.2 Georgia,"Noto Serif SC",serif;letter-spacing:.08em;transform:translate(-50%,-50%) rotate(-12deg) scale(2.4);opacity:0;animation:stp .55s forwards cubic-bezier(.3,1.6,.5,1);background:rgba(255,255,255,.92);text-align:center;pointer-events:none;white-space:nowrap}
.stamp small{display:block;font:700 11px -apple-system,sans-serif;letter-spacing:.04em}
.stamp.out{transition:opacity .5s;opacity:0!important}
@keyframes stp{to{transform:translate(-50%,-50%) rotate(-12deg) scale(1);opacity:1}}
.cf{position:absolute;width:7px;height:10px;top:-10px;z-index:41;pointer-events:none;animation:cf 1.7s forwards ease-in}@keyframes cf{to{transform:translate(var(--dx),820px) rotate(600deg);opacity:.2}}
.toast{position:absolute;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translate(-50%,30px);background:rgba(20,48,92,.94);color:#fff;border-radius:99px;padding:7px 14px;font-size:12.5px;font-weight:700;opacity:0;transition:.3s;z-index:30;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis;pointer-events:none}.toast.on{transform:translate(-50%,0);opacity:1}
:host(.rtl) .pg{direction:rtl}:host(.rtl) .zh,:host(.rtl) .pyl,:host(.rtl) .enl,:host(.rtl) .op,:host(.rtl) .bub .z{direction:ltr;text-align:start}
@media(max-width:380px){.face{width:74px}.face img{width:62px;height:62px}.rb{min-width:34px}.pp{width:50px;height:50px}}`;
})();

/* d92_advent.js */
window.ADVENT_DATA = {"year":2026,"days":[{"d":1,"date":"2026-12-01","city":["慕尼黑","Munich"],"obj":["一张老式的纸日历","An old paper Advent calendar"],"story":["1903 年，慕尼黑的出版商 Gerhard Lang 印了一张给孩子的日历：24 张小画剪下来，十二月里一天贴一张，贴满就到圣诞了。今天，第一格。","In 1903 the Munich publisher Gerhard Lang printed a calendar for children: 24 little pictures to cut out and paste in, one a day through December until Christmas. Today: square one."],"src":"https://de.wikipedia.org/wiki/Adventskalender","src2":"","sz":{"l1":{"zh":"我在等放假。","py":"Wǒ zài děng fàngjià.","en":"I'm waiting for the holidays.","words":[["等","děng","to wait for"],["放假","fàngjià","to have time off"]]},"l2":{"starter":"这个月，我最期待……","py":"Zhège yuè, wǒ zuì qīdài ……","en":"This month, what I'm looking forward to most is …","ideas":[["回家","huí jiā","going home"],["见朋友","jiàn péngyou","seeing friends"],["睡懒觉","shuì lǎnjiào","sleeping in"]]},"l3":{"zh":"说实话，我最期待的就是什么都不干，睡到自然醒，然后慢慢吃一顿早饭。","py":"Shuō shíhuà, wǒ zuì qīdài de jiù shì shénme dōu bú gàn, shuì dào zìrán xǐng, ránhòu mànmàn chī yí dùn zǎofàn.","en":"Honestly, what I'm looking forward to most is doing nothing at all — sleeping till I wake up, then a slow breakfast."}},"se":{"l1":{"en":"I'm looking forward to the holidays.","zh":"我很期待放假。","words":[["look forward to","期待"],["holidays","假期"]]},"l2":{"starter":"This December, I'm looking forward to …","zh":"这个十二月，我最期待……","ideas":[["going home","回家"],["a long sleep","好好睡一觉"],["seeing old friends","见老朋友"]]},"l3":{"en":"Honestly, what I'm looking forward to most is a few days of doing nothing — no alarm, just tea and a long book.","zh":"说实话，我最期待的是有几天什么都不用做：不定闹钟，喝喝茶，看一本长长的书。"}},"ask":["这个十二月，你在等什么？","What are you waiting for this December?"],"rep":null,"from":"system"},{"d":2,"date":"2026-12-02","city":["纽约","New York"],"obj":["一棵挂满小灯的云杉","A little spruce full of lights"],"story":["纽约洛克菲勒中心的大圣诞树，每年在感恩节后的那个星期三前后点灯，树上挂着大约五万个彩色 LED 小灯。今年感恩节是 11 月 26 日，照这个算，点灯在 12 月 2 日前后。","The big tree at Rockefeller Center in New York is lit around the Wednesday after Thanksgiving, with about 50,000 coloured LED lights. Thanksgiving this year falls on 26 November, so the lighting should be around 2 December."],"src":"https://en.wikipedia.org/wiki/Rockefeller_Center_Christmas_Tree","src2":"","sz":{"l1":{"zh":"我家会挂灯。","py":"Wǒ jiā huì guà dēng.","en":"We put up lights at home.","words":[["挂","guà","to hang"],["灯","dēng","light"]]},"l2":{"starter":"过节的时候，我家会……","py":"Guòjié de shíhou, wǒ jiā huì ……","en":"During the holidays, at home we …","ideas":[["摆一棵小树","bǎi yì kē xiǎo shù","put up a little tree"],["贴窗花","tiē chuānghuā","stick paper-cuts on the windows"],["不怎么挂东西","bù zěnme guà dōngxi","not put much up",{"zh":"过节的时候，我家不怎么挂东西。","py":"Guòjié de shíhou, wǒ jiā bù zěnme guà dōngxi.","en":"During the holidays, we don't put much up at home."}]]},"l3":{"zh":"我家其实不怎么布置，不过我很喜欢晚上去街上转转，看别人家窗户里的灯。","py":"Wǒ jiā qíshí bù zěnme bùzhì, búguò wǒ hěn xǐhuan wǎnshang qù jiē shang zhuànzhuan, kàn biérén jiā chuānghu lǐ de dēng.","en":"We don't really decorate at home, but I love wandering the streets at night and looking at the lights in other people's windows."}},"se":{"l1":{"en":"We put up lights at home.","zh":"我们家会挂彩灯。","words":[["put up","挂起来、摆出来"],["lights","彩灯"]]},"l2":{"starter":"At home, we usually decorate with …","zh":"我们家一般会用……来装饰。","ideas":[["a small tree","一棵小树"],["paper stars","纸星星"],["just a few candles","几支蜡烛"]]},"l3":{"en":"We don't really decorate at home, but I love walking past shop windows at night when the lights are on.","zh":"我们家其实不怎么布置，但我很喜欢晚上从亮着灯的橱窗前走过。"}},"ask":["你那边过节，大家会挂灯吗？","Where you are, do people put up lights for the holidays?"],"rep":{"id":"owen","nm":"Owen","c":["纽约","New York"],"face":true,"orig":"zh","zh":"我去看过一次，人多得走不动！我家就在窗户上挂一串小灯，够了。","py":"Wǒ qù kànguo yí cì, rén duō de zǒu bú dòng! Wǒ jiā jiù zài chuānghu shang guà yí chuàn xiǎo dēng, gòu le.","en":"I went to see it once — so crowded you couldn't move! At home we just hang one string of little lights in the window. That's enough.","learner":true,"translated":false},"from":"system"},{"d":3,"date":"2026-12-03","city":["克拉科夫","Kraków"],"obj":["一座闪亮的小马槽模型（szopka）","A tiny shining szopka"],"story":["每年十二月的第一个星期四（今年是 12 月 3 日），克拉科夫的人把自己做的 szopka 搬到中央集市广场、密茨凯维奇像旁边比赛。这种马槽模型常照着城里的圣玛利亚教堂、瓦维尔城堡来做，大的有两米高。","On the first Thursday of December (3 December this year), people in Kraków carry the szopki they've made to the Main Market Square, by the Mickiewicz statue, for the yearly contest. These nativity models copy the city's own St Mary's Basilica and Wawel Castle; big ones stand two metres tall."],"src":"https://en.wikipedia.org/wiki/Krak%C3%B3w_szopka","src2":"","sz":{"l1":{"zh":"我喜欢自己做东西。","py":"Wǒ xǐhuan zìjǐ zuò dōngxi.","en":"I like making things myself.","words":[["自己","zìjǐ","oneself"],["东西","dōngxi","things"]]},"l2":{"starter":"过节以前，我有时候会自己做……","py":"Guòjié yǐqián, wǒ yǒu shíhou huì zìjǐ zuò ……","en":"Before the holidays, I sometimes make …","ideas":[["贺卡","hèkǎ","cards"],["饼干","bǐnggān","cookies"],["小礼物","xiǎo lǐwù","small gifts"]]},"l3":{"zh":"我手特别笨，做什么都不像，不过每年我都会给几个朋友手写卡片，这也算我自己做的吧。","py":"Wǒ shǒu tèbié bèn, zuò shénme dōu bú xiàng, búguò měi nián wǒ dōu huì gěi jǐ ge péngyou shǒuxiě kǎpiàn, zhè yě suàn wǒ zìjǐ zuò de ba.","en":"I'm all thumbs — nothing I make looks right. But every year I handwrite cards for a few friends; I guess that counts as making something."}},"se":{"l1":{"en":"I like making things by hand.","zh":"我喜欢自己动手做东西。","words":[["make","做"],["by hand","手工、自己动手"]]},"l2":{"starter":"Before the holidays, I sometimes make …","zh":"过节前，我有时候会做……","ideas":[["cards","贺卡"],["cookies","饼干"],["a little gift","一个小礼物"]]},"l3":{"en":"I'm terrible with my hands, so I don't really make things — but every year I write a few cards, and that feels like making something.","zh":"我手特别笨，不怎么会做东西；不过每年我都会写几张卡片，感觉也算自己做了点什么。"}},"ask":["你那边过节，有什么东西是自己动手做的？","Where you are, what do people make by hand for the holidays?"],"rep":{"id":"marta","nm":"Marta","c":["克拉科夫","Kraków"],"face":true,"orig":"en","zh":"说到 szopka 比赛，就三样：冷、人多、小孩做的最好看。我上小学的时候也做过一个，第二天就塌了。","py":"Shuōdào szopka bǐsài, jiù sān yàng: lěng, rén duō, xiǎohái zuò de zuì hǎokàn. Wǒ shàng xiǎoxué de shíhou yě zuòguo yí ge, dì-èr tiān jiù tā le.","en":"Three things about the szopka contest: it's cold, it's crowded, and the kids' ones are the best. I made one in primary school. It collapsed the next day.","learner":false,"translated":true},"from":"system"},{"d":4,"date":"2026-12-04","city":["悉尼","Sydney"],"obj":["一双缠着彩带的人字拖","Flip-flops wrapped in tinsel"],"story":["悉尼的十二月是夏天。很多家庭的圣诞午饭是虾、生蚝、冷肉和沙拉，吃完去游泳，或者在街上打一场板球。","December in Sydney is summer. For Christmas lunch many families have prawns, oysters, cold meats and salad — then go for a swim or play cricket in the street."],"src":"https://en.wikipedia.org/wiki/Christmas_in_Australia","src2":"","sz":{"l1":{"zh":"我这边十二月很冷。","py":"Wǒ zhèbiān shí'èr yuè hěn lěng.","en":"It's cold here in December.","words":[["冷","lěng","cold"],["十二月","shí'èr yuè","December"]]},"l2":{"starter":"我这边十二月……","py":"Wǒ zhèbiān shí'èr yuè ……","en":"Here, December is …","ideas":[["又冷又干","yòu lěng yòu gān","cold and dry"],["特别热","tèbié rè","really hot"],["老下雨","lǎo xià yǔ","rainy all the time"]]},"l3":{"zh":"我这边下午五点天就黑了，所以一看到有人在海边过圣诞，我就有点羡慕。","py":"Wǒ zhèbiān xiàwǔ wǔ diǎn tiān jiù hēi le, suǒyǐ yí kàndào yǒu rén zài hǎibiān guò Shèngdàn, wǒ jiù yǒudiǎn xiànmù.","en":"Here it's dark by five in the afternoon, so whenever I see people having Christmas on the beach, I get a bit jealous."}},"se":{"l1":{"en":"It's cold here in December.","zh":"我这边十二月很冷。","words":[["cold","冷"],["here","这里"]]},"l2":{"starter":"In December where I live, it's …","zh":"我住的地方，十二月……","ideas":[["cold and dark","又冷又黑"],["hot","很热"],["rainy","老下雨"]]},"l3":{"en":"Where I live it gets dark by five, so I'm always a little jealous of people having Christmas on the beach.","zh":"我住的地方五点天就黑了，所以看到别人在海边过圣诞，我总有点羡慕。"}},"ask":["你那边十二月是什么天气？","What's the weather like where you are in December?"],"rep":{"id":"jade","nm":"Jade","c":["墨尔本","Melbourne"],"face":true,"orig":"en","zh":"墨尔本也一样，夏天过圣诞。简单说就是：上午游泳，中午吃火腿，下午睡一觉。","py":"Mò'ěrběn yě yíyàng, xiàtiān guò Shèngdàn. Jiǎndān shuō jiù shì: shàngwǔ yóuyǒng, zhōngwǔ chī huǒtuǐ, xiàwǔ shuì yí jiào.","en":"Same in Melbourne — summer Christmas. Short version: swim in the morning, ham at lunch, nap in the afternoon.","learner":false,"translated":true},"from":"system"},{"d":5,"date":"2026-12-05","city":["阿姆斯特丹","Amsterdam"],"obj":["一块巧克力字母","A chocolate letter"],"story":["12 月 5 日晚上是荷兰的「礼物之夜」（pakjesavond）：圣尼古拉节（Sinterklaas）的前一晚，家家拆礼物。常见的小礼物是一块巧克力字母——孩子名字的第一个字母。","The evening of 5 December is pakjesavond, 'gift evening', in the Netherlands — Sinterklaas Eve, when families open presents. A classic little gift: a chocolate letter, the first letter of the child's name."],"src":"https://en.wikipedia.org/wiki/Sinterklaas","src2":"","sz":{"l1":{"zh":"我的名字是 {x} 开头的。","py":"Wǒ de míngzi shì {x} kāitóu de.","en":"My name starts with {x}.","words":[["名字","míngzi","name"],["开头","kāitóu","to start (with)"]],"fill":"letter"},"l2":{"starter":"我的中文名字……","py":"Wǒ de Zhōngwén míngzi ……","en":"My Chinese name …","ideas":[["是老师给我起的","shì lǎoshī gěi wǒ qǐ de","was given to me by my teacher"],["是我自己挑的","shì wǒ zìjǐ tiāo de","is one I picked myself"],["还没有呢","hái méiyǒu ne","not yet",{"zh":"我还没有中文名字呢。","py":"Wǒ hái méiyǒu Zhōngwén míngzi ne.","en":"I don't have a Chinese name yet."}]]},"l3":{"zh":"我的中文名字是一个朋友帮我起的，听起来跟我本来的名字差不多，我自己也挺喜欢。","py":"Wǒ de Zhōngwén míngzi shì yí ge péngyou bāng wǒ qǐ de, tīng qǐlái gēn wǒ běnlái de míngzi chàbuduō, wǒ zìjǐ yě tǐng xǐhuan.","en":"A friend gave me my Chinese name. It sounds a lot like my real name, and I quite like it."}},"se":{"l1":{"en":"My name starts with {x}.","zh":"我的名字是 {x} 开头的。","words":[["name","名字"],["start with","以……开头"]],"fill":"letter"},"l2":{"starter":"My name was picked by …","zh":"我的名字是……起的。","ideas":[["my grandma","我奶奶"],["my parents","我爸妈"],["me","我自己"]]},"l3":{"en":"My name starts with L. My parents picked it because it was short and easy to say in two languages.","zh":"我的名字是 L 开头的。爸妈挑它，是因为它短，两种语言里都好念。"}},"ask":["要是有人送你一块巧克力字母，会是哪个字母？","If someone gave you a chocolate letter, which letter would it be?"],"rep":{"id":"chen_nl","nm":"Chen 陈","c":["阿姆斯特丹","Amsterdam"],"face":true,"orig":"en","zh":"荷兰同学送了我一块字母 C 的巧克力。我说 Chen 是我的姓，不是名字。她说：「可在这儿，大家都叫你 Chen 啊！」","py":"Hélán tóngxué sòngle wǒ yí kuài zìmǔ C de qiǎokèlì. Wǒ shuō Chen shì wǒ de xìng, bú shì míngzi. Tā shuō: 'Kě zài zhèr, dàjiā dōu jiào nǐ Chen a!'","en":"My Dutch classmate gave me a C. I said Chen is my surname, not my first name. She said, 'But here everyone calls you Chen!'","learner":"en","translated":true},"from":"system"},{"d":6,"date":"2026-12-06","city":["柏林","Berlin"],"obj":["门口的一只小靴子","A little boot by the door"],"story":["12 月 6 日是圣尼古拉节。很多德国孩子前一天晚上把靴子放在门外，第二天一早，圣尼古拉已经在里面装了糖和小礼物；据说调皮的孩子只能拿到一根树枝。","6 December is Saint Nicholas Day. The night before, many children in Germany put a boot outside the front door, and by morning Saint Nicholas has filled it with sweets and small gifts — naughty children, the story goes, get a stick."],"src":"https://en.wikipedia.org/wiki/Saint_Nicholas_Day","src2":"","sz":{"l1":{"zh":"我小时候特别爱吃糖。","py":"Wǒ xiǎoshíhou tèbié ài chī táng.","en":"As a kid I loved sweets.","words":[["小时候","xiǎoshíhou","as a child"],["糖","táng","sweets"]]},"l2":{"starter":"小时候过节，我最喜欢……","py":"Xiǎoshíhou guòjié, wǒ zuì xǐhuan ……","en":"At the holidays as a kid, what I loved most was …","ideas":[["晚上不用早睡","wǎnshang bú yòng zǎo shuì","not having to go to bed early"],["拆礼物","chāi lǐwù","opening presents"],["跟表哥表姐玩","gēn biǎogē biǎojiě wán","playing with my cousins"]]},"l3":{"zh":"小时候过节，我最开心的不是礼物，是晚上可以跟大人一起熬夜，听他们聊天。","py":"Xiǎoshíhou guòjié, wǒ zuì kāixīn de bú shì lǐwù, shì wǎnshang kěyǐ gēn dàren yìqǐ áoyè, tīng tāmen liáotiān.","en":"As a kid, what made me happiest at the holidays wasn't the presents — it was staying up late with the adults and listening to them talk."}},"se":{"l1":{"en":"When I was little, I loved sweets.","zh":"我小时候特别爱吃糖。","words":[["when I was little","我小时候"],["sweets","糖"]]},"l2":{"starter":"When I was a kid, my favourite part of the holidays was …","zh":"我小时候，过节最喜欢的是……","ideas":[["staying up late","可以晚睡"],["no school","不用上学"],["playing with my cousins","跟表兄弟姐妹玩"]]},"l3":{"en":"As a kid, the best part wasn't the presents — it was being allowed to stay up late with the grown-ups.","zh":"小时候最开心的不是礼物，而是可以跟大人们一起熬夜。"}},"ask":["你小时候过节，最开心的是什么？","What did you love most about the holidays as a kid?"],"rep":{"id":"lena","nm":"Lena","c":["柏林","Berlin"],"face":true,"orig":"en","zh":"我一直到十二岁都还放靴子。有一年我弟弟偷偷把爸爸的大靴子摆了出去，想多装点——没用。","py":"Wǒ yìzhí dào shí'èr suì dōu hái fàng xuēzi. Yǒu yì nián wǒ dìdi tōutōu bǎ bàba de dà xuēzi bǎile chūqu, xiǎng duō zhuāng diǎn —— méi yòng.","en":"I put my boot out until I was twelve. One year my brother secretly put out our dad's huge boot, hoping for more. It didn't work.","learner":"en","translated":true},"from":"system"},{"d":7,"date":"2026-12-07","city":["波哥大","Bogotá"],"obj":["一盏纸灯笼","A paper lantern"],"story":["12 月 7 日晚上是哥伦比亚的「小蜡烛之夜」（Día de las Velitas）：天黑以后，人们把蜡烛和纸灯笼摆在门口、窗台这些大家看得见的地方，一直点到 8 号早上。","The night of 7 December is Día de las Velitas, the Night of the Little Candles, in Colombia: after dark people set candles and paper lanterns where everyone can see them — doorsteps, windowsills — and keep them lit until the morning of the 8th."],"src":"https://en.wikipedia.org/wiki/Day_of_the_Little_Candles","src2":"","sz":{"l1":{"zh":"我跟家人一起过节。","py":"Wǒ gēn jiārén yìqǐ guòjié.","en":"I spend the holidays with my family.","words":[["家人","jiārén","family"],["过节","guòjié","to celebrate a holiday"]]},"l2":{"starter":"今年过节，我……","py":"Jīnnián guòjié, wǒ ……","en":"This year for the holidays, I …","ideas":[["回家","huí jiā","go home"],["跟朋友一起过","gēn péngyou yìqǐ guò","spend it with friends"],["一个人过","yí ge rén guò","spend it on my own"]]},"l3":{"zh":"今年我回不了家，所以我们几个离家远的朋友打算凑在一起，每人做一个菜。","py":"Jīnnián wǒ huí bù liǎo jiā, suǒyǐ wǒmen jǐ ge lí jiā yuǎn de péngyou dǎsuàn còu zài yìqǐ, měi rén zuò yí ge cài.","en":"I can't go home this year, so a few of us who live far from home are getting together, each cooking one dish."}},"se":{"l1":{"en":"I spend the holidays with my family.","zh":"我跟家人一起过节。","words":[["spend","度过"],["family","家人"]]},"l2":{"starter":"This year I'll spend the holidays with …","zh":"今年过节，我会跟……一起。","ideas":[["my parents","我爸妈"],["friends","朋友"],["just me and a good film","就我自己和一部好电影"]]},"l3":{"en":"This year I can't go home, so a few of us who live far from our families are cooking together.","zh":"今年我回不了家，所以我们几个离家远的人打算一起做饭。"}},"ask":["今年过节，你跟谁一起？","Who are you spending the holidays with this year?"],"rep":{"id":"camila","nm":"Camila","c":["波哥大","Bogotá"],"face":true,"orig":"zh","zh":"我们是 7 号晚上点蜡烛！在我家门口，摆一排。还有纸灯笼！","py":"Wǒmen shì qī hào wǎnshang diǎn làzhú! Zài wǒ jiā ménkǒu, bǎi yì pái. Hái yǒu zhǐ dēnglong!","en":"We light our candles on the night of the 7th! A whole row outside our door. And paper lanterns too!","learner":true,"translated":false},"from":"system"},{"d":8,"date":"2026-12-08","city":["里昂","Lyon"],"obj":["窗台上的一只小烛杯","A little candle glass on the windowsill"],"story":["12 月 8 日这天，里昂很多人家把蜡烛放进彩色或透明的小玻璃杯，一排摆在窗台上。这个习惯 1852 年起流行开来，现在成了灯光节，前后大约四天，8 号这天最热闹。","On 8 December, many families in Lyon line their windowsills with candles in little coloured or clear glasses. The custom caught on in 1852 and has grown into the Fête des Lumières, about four days around the 8th, busiest on the 8th itself."],"src":"https://en.wikipedia.org/wiki/F%C3%AAte_des_Lumi%C3%A8res","src2":"","sz":{"l1":{"zh":"冬天晚上，我喜欢待在家里。","py":"Dōngtiān wǎnshang, wǒ xǐhuan dāi zài jiā lǐ.","en":"On winter evenings I like staying home.","words":[["冬天","dōngtiān","winter"],["待在家里","dāi zài jiā lǐ","to stay home"]]},"l2":{"starter":"冬天晚上，我喜欢……","py":"Dōngtiān wǎnshang, wǒ xǐhuan ……","en":"On winter evenings, I like to …","ideas":[["点一支蜡烛","diǎn yì zhī làzhú","light a candle"],["出去散步","chūqu sànbù","go out for a walk"],["给家里打电话","gěi jiā lǐ dǎ diànhuà","call home"]]},"l3":{"zh":"冬天晚上我会把大灯关了，只开一盏小台灯，感觉屋里一下子暖和多了。","py":"Dōngtiān wǎnshang wǒ huì bǎ dà dēng guān le, zhǐ kāi yì zhǎn xiǎo táidēng, gǎnjué wū lǐ yíxiàzi nuǎnhuo duō le.","en":"On winter nights I switch off the big light and keep just a small desk lamp on — the room suddenly feels much warmer."}},"se":{"l1":{"en":"In winter, I stay in at night.","zh":"冬天晚上我都待在家里。","words":[["stay in","待在家"],["at night","晚上"]]},"l2":{"starter":"On winter evenings, I like to …","zh":"冬天的晚上，我喜欢……","ideas":[["light a candle and read","点支蜡烛看书"],["go for a walk","出去走走"],["call my family","给家里打电话"]]},"l3":{"en":"On winter nights I turn off the big light and keep just a small lamp on — my room suddenly feels warmer.","zh":"冬天晚上我会把大灯关了，只开一盏小灯，房间好像一下子暖和了。"}},"ask":["你那边冬天的晚上，大家喜欢做什么？","What do people like doing on winter evenings where you are?"],"rep":{"id":"emma","nm":"Emma","c":["里斯本","Lisbon"],"face":true,"orig":"zh","zh":"里斯本的冬天晚上，大家爱在街上买烤栗子。我也去，买一袋栗子热乎乎的，边走边吃。","py":"Lǐsīběn de dōngtiān wǎnshang, dàjiā ài zài jiē shang mǎi kǎo lìzi. Wǒ yě qù, mǎi yí dài lìzi rèhūhū de, biān zǒu biān chī.","en":"On winter evenings in Lisbon, people love buying roast chestnuts in the street. I go too — a hot bag of chestnuts, eaten as I walk.","learner":true,"translated":false},"from":"system"},{"d":9,"date":"2026-12-09","city":["东京","Tokyo"],"obj":["一小块草莓奶油蛋糕","A slice of strawberry cream cake"],"story":["在日本，圣诞蛋糕不是水果蛋糕，而是松软的海绵蛋糕，抹满鲜奶油、摆上草莓，一般在平安夜跟家人或朋友分着吃。","In Japan, Christmas cake isn't a fruitcake — it's a soft sponge covered in whipped cream and topped with strawberries, usually shared with family or friends on Christmas Eve."],"src":"https://en.wikipedia.org/wiki/Christmas_cake","src2":"","sz":{"l1":{"zh":"过节我最想吃蛋糕。","py":"Guòjié wǒ zuì xiǎng chī dàngāo.","en":"At the holidays, cake is what I want most.","words":[["想吃","xiǎng chī","to feel like eating"],["蛋糕","dàngāo","cake"]]},"l2":{"starter":"我家过节一定会吃……","py":"Wǒ jiā guòjié yídìng huì chī ……","en":"At the holidays my family always eats …","ideas":[["我妈做的汤","wǒ mā zuò de tāng","my mum's soup",{"zh":"我家过节一定会喝我妈做的汤。","py":"Wǒ jiā guòjié yídìng huì hē wǒ mā zuò de tāng.","en":"At the holidays my family always has my mum's soup."}],["烤肉","kǎoròu","roast meat"],["甜点","tiándiǎn","dessert"]]},"l3":{"zh":"我最想的是外婆做的蛋糕，别人做的怎么都不是那个味道，她又从来不写方子。","py":"Wǒ zuì xiǎng de shì wàipó zuò de dàngāo, biérén zuò de zěnme dōu bú shì nàge wèidao, tā yòu cónglái bù xiě fāngzi.","en":"What I miss most is my grandma's cake. Nobody else's ever tastes quite the same — and she never writes the recipe down."}},"se":{"l1":{"en":"My favourite holiday food is cake.","zh":"过节我最喜欢吃蛋糕。","words":[["favourite","最喜欢的"],["food","吃的"]]},"l2":{"starter":"The one thing we always eat at the holidays is …","zh":"我们过节一定会吃……","ideas":[["my mum's soup","我妈做的汤"],["something sweet","甜的东西"],["dumplings","饺子"]]},"l3":{"en":"What I miss most is my grandma's cake — nobody else's tastes the same, and she never wrote the recipe down.","zh":"我最想的是我奶奶做的蛋糕，别人做的都不是那个味儿，可她从来没把方子写下来。"}},"ask":["你那边过节，桌上一定有什么？","What's always on the table for the holidays where you are?"],"rep":{"id":"mei","nm":"Mei","c":["台北","Taipei"],"face":true,"orig":"zh","zh":"过年回台南，阿嬷桌上一定有一锅鸡汤喔。圣诞节？我在店里摇草莓饮料，根本没空吃！","py":"Guònián huí Táinán, āmà zhuō shang yídìng yǒu yì guō jītāng o. Shèngdànjié? Wǒ zài diàn lǐ yáo cǎoméi yǐnliào, gēnběn méi kòng chī!","en":"At New Year back in Tainan, there's always a pot of chicken soup on Grandma's table. Christmas? I'm at the shop shaking strawberry drinks — no time to eat!","learner":false,"translated":false},"from":"system"},{"d":10,"date":"2026-12-10","city":["伦敦","London"],"obj":["一棵挂着白灯的挪威云杉","A Norwegian spruce with white lights"],"story":["伦敦特拉法加广场的圣诞树是挪威奥斯陆送的：从 1947 年起每年一棵，谢谢英国在二战时帮过挪威。树按挪威的样子布置，挂 500 个白灯，在十二月第一个星期四点亮——今年是 12 月 3 日。","The Christmas tree in Trafalgar Square is a gift from Oslo — one every year since 1947, as thanks for Britain's help to Norway in the Second World War. It's dressed Norwegian-style with 500 white lights and lit on the first Thursday of December: this year, 3 December."],"src":"https://en.wikipedia.org/wiki/Trafalgar_Square_Christmas_tree","src2":"","sz":{"l1":{"zh":"我想谢谢我的朋友。","py":"Wǒ xiǎng xièxie wǒ de péngyou.","en":"I want to thank my friend.","words":[["谢谢","xièxie","to thank"],["朋友","péngyou","friend"]]},"l2":{"starter":"今年我最想谢谢……","py":"Jīnnián wǒ zuì xiǎng xièxie ……","en":"This year, the person I most want to thank is …","ideas":[["我的老师","wǒ de lǎoshī","my teacher"],["我的邻居","wǒ de línjū","my neighbour"],["帮我搬家的朋友","bāng wǒ bānjiā de péngyou","the friend who helped me move"]]},"l3":{"zh":"今年我最想谢谢我的邻居。我出门一个月，她天天帮我浇花，回来还一句都不提。","py":"Jīnnián wǒ zuì xiǎng xièxie wǒ de línjū. Wǒ chūmén yí ge yuè, tā tiāntiān bāng wǒ jiāo huā, huílai hái yí jù dōu bù tí.","en":"This year I most want to thank my neighbour. I was away for a month, she watered my plants every day — and when I got back she didn't even mention it."}},"se":{"l1":{"en":"I want to say thank you to my friend.","zh":"我想谢谢我的朋友。","words":[["say thank you","道谢"],["friend","朋友"]]},"l2":{"starter":"This year, I most want to thank …","zh":"今年我最想谢谢……","ideas":[["my teacher","我的老师"],["a neighbour","一个邻居"],["the friend who helped me move","帮我搬家的朋友"]]},"l3":{"en":"This year I want to thank my neighbour — she watered my plants for a whole month and never once made a thing of it.","zh":"今年我想谢谢我的邻居：她帮我浇了整整一个月的花，一次都没提过这件事。"}},"ask":["今年，你最想谢谢谁？","Who do you most want to thank this year?"],"rep":{"id":"ruth","nm":"Ruth","c":["伦敦","London"],"face":true,"orig":"zh","zh":"今年我最想谢谢我的中文老师。她每次都等我慢慢说，一点也不急，每个星期。","py":"Jīnnián wǒ zuì xiǎng xièxie wǒ de Zhōngwén lǎoshī. Tā měi cì dōu děng wǒ mànmàn shuō, yìdiǎn yě bù jí, měi ge xīngqī.","en":"This year I most want to thank my Chinese teacher. She always waits for me to say it slowly — never in a hurry. Every week.","learner":true,"translated":false},"from":"system"},{"d":11,"date":"2026-12-11","city":["雷克雅未克","Reykjavík"],"obj":["窗台上的一只小鞋","A little shoe on the windowsill"],"story":["冰岛有 13 个圣诞小伙子（Yule Lads），从 12 月 12 日起每天来一个。所以 11 号晚上开始，孩子们每晚都把一只鞋放到窗台上：听话的，早上鞋里有小礼物；调皮的，据说只有一个烂土豆。第一个来的叫 Stekkjarstaur，专门去羊圈捣乱。","Iceland has 13 Yule Lads, arriving one a day from 12 December. So from the night of the 11th, children put a shoe on the windowsill every night: good kids find a small gift in the morning; naughty ones, so they say, a rotten potato. The first to come is Stekkjarstaur, who pesters the sheep."],"src":"https://en.wikipedia.org/wiki/Yule_Lads","src2":"","sz":{"l1":{"zh":"我小时候挺乖的。","py":"Wǒ xiǎoshíhou tǐng guāi de.","en":"I was a pretty good kid.","words":[["乖","guāi","well-behaved"],["挺","tǐng","quite"]]},"l2":{"starter":"我小时候是那种……的孩子。","py":"Wǒ xiǎoshíhou shì nà zhǒng …… de háizi.","en":"As a kid I was the kind who …","ideas":[["特别爱问问题","tèbié ài wèn wèntí","always asked questions"],["坐不住","zuò bú zhù","couldn't sit still"],["很安静","hěn ānjìng","was very quiet"]]},"l3":{"zh":"我小时候看起来挺乖，其实老偷吃家里留着招待客人的饼干，每次都说是猫吃的。","py":"Wǒ xiǎoshíhou kàn qǐlái tǐng guāi, qíshí lǎo tōu chī jiā lǐ liúzhe zhāodài kèrén de bǐnggān, měi cì dōu shuō shì māo chī de.","en":"As a kid I looked well-behaved, but I kept sneaking the biscuits we saved for guests — and blamed the cat every time."}},"se":{"l1":{"en":"I was a good kid. Mostly.","zh":"我小时候挺乖的。大多数时候吧。","words":[["a good kid","乖孩子"],["mostly","大多数时候"]]},"l2":{"starter":"When I was little, I was the kind of kid who …","zh":"我小时候是那种……的孩子。","ideas":[["asked too many questions","问题特别多"],["never sat still","一刻也坐不住"],["was really quiet","很安静"]]},"l3":{"en":"I was the quiet kid who looked well-behaved but secretly ate the biscuits we kept for guests — and blamed the cat.","zh":"我是那种看起来很乖、其实偷吃待客饼干的小孩，还怪到猫头上。"}},"ask":["你那边的孩子过节，会把什么放在外面等礼物？","Where you are, what do kids leave out when they're waiting for presents?"],"rep":null,"from":"system"},{"d":12,"date":"2026-12-12","city":["墨西哥城","Mexico City"],"obj":["一小束包在粗布里的红玫瑰","Red roses wrapped in rough cloth"],"story":["12 月 12 日是墨西哥的瓜达卢佩圣母节。传说 1531 年 12 月 12 日，胡安·迪亚哥在特佩亚克山上找到了冬天本不该开的玫瑰，用斗篷兜下山。墨西哥城的瓜达卢佩圣母大殿据估计一年有两千万人来，大约九百万人集中在 12 月 12 日前后。","12 December is the Feast of Our Lady of Guadalupe in Mexico. The story goes that on 12 December 1531 Juan Diego found roses blooming on Tepeyac Hill, where nothing should flower in winter, and carried them down in his cloak. The Basilica in Mexico City gets an estimated twenty million visitors a year — about nine million of them in the days around 12 December."],"src":"https://en.wikipedia.org/wiki/Basilica_of_Our_Lady_of_Guadalupe","src2":"https://en.wikipedia.org/wiki/Our_Lady_of_Guadalupe","sz":{"l1":{"zh":"我每年都回老家。","py":"Wǒ měi nián dōu huí lǎojiā.","en":"I go back to my hometown every year.","words":[["每年","měi nián","every year"],["老家","lǎojiā","hometown"]]},"l2":{"starter":"有一个地方我每年都会去：……","py":"Yǒu yí ge dìfang wǒ měi nián dōu huì qù: ……","en":"There's one place I go every year: …","ideas":[["外婆家","wàipó jiā","grandma's house"],["海边","hǎibiān","the seaside"],["一家老咖啡馆","yì jiā lǎo kāfēiguǎn","an old café"]]},"l3":{"zh":"每年十二月，我都会回以前学校旁边那个小公园走一走。那儿其实没什么，可每次去都像回家一样。","py":"Měi nián shí'èr yuè, wǒ dōu huì huí yǐqián xuéxiào pángbiān nàge xiǎo gōngyuán zǒu yi zǒu. Nàr qíshí méi shénme, kě měi cì qù dōu xiàng huí jiā yíyàng.","en":"Every December I go back for a walk in the little park by my old school. There's nothing much there, but each time it feels like coming home."}},"se":{"l1":{"en":"I go back to my hometown every year.","zh":"我每年都回老家。","words":[["go back","回去"],["hometown","老家"]]},"l2":{"starter":"There's one place I go back to every year: …","zh":"有一个地方我每年都会回去：……","ideas":[["my grandparents' house","爷爷奶奶家"],["a little café","一家小咖啡馆"],["the sea","海边"]]},"l3":{"en":"Every December I go back to the same little park near my old school. Nothing happens there, but I always feel like I've come home.","zh":"每年十二月我都会回以前学校旁边那个小公园。那儿什么也没有，可我每次去都觉得像回家了。"}},"ask":["有没有一个地方，你每年都会回去？","Is there a place you go back to every year?"],"rep":{"id":"beto","nm":"Beto","c":["墨西哥城","Mexico City"],"face":false,"orig":"en","zh":"每年 12 号，我都一大早跟妈妈去瓜达卢佩圣母大殿，她捧着玫瑰。回来我就去罗马区出摊——那天人特别多！","py":"Měi nián shí'èr hào, wǒ dōu yídàzǎo gēn māma qù Guādálúpèi Shèngmǔ Dàdiàn, tā pěngzhe méiguī. Huílai wǒ jiù qù Luómǎ Qū chū tān —— nà tiān rén tèbié duō!","en":"Every year on the 12th I go to the Basilica with my mamá, very early. She carry the roses. After, I open my stand in Roma — that day, so many people!","learner":false,"translated":true},"from":"system"},{"d":13,"date":"2026-12-13","city":["斯德哥尔摩","Stockholm"],"obj":["一个 S 形的藏红花小面包","An S-shaped saffron bun"],"story":["12 月 13 日是瑞典的圣露西亚节。穿白裙、系红腰带、头戴蜡烛冠的「露西亚」领着队伍唱歌；在家里，常常是大女儿端着咖啡、蜡烛和 S 形的藏红花面包（lussekatt）叫醒大家。","13 December is Lucia Day in Sweden. A 'Lucia' in a white gown with a red sash and a crown of candles leads a singing procession; at home it's often the eldest daughter who wakes everyone with coffee, candles and S-shaped saffron buns — lussekatter."],"src":"https://en.wikipedia.org/wiki/Saint_Lucy%27s_Day","src2":"","sz":{"l1":{"zh":"早上不喝咖啡我醒不过来。","py":"Zǎoshang bù hē kāfēi wǒ xǐng bú guòlái.","en":"I can't wake up in the morning without coffee.","words":[["醒不过来","xǐng bú guòlái","can't wake up"],["咖啡","kāfēi","coffee"]]},"l2":{"starter":"冬天早上，能让我起床的是……","py":"Dōngtiān zǎoshang, néng ràng wǒ qǐchuáng de shì ……","en":"On winter mornings, what gets me up is …","ideas":[["早饭的香味","zǎofàn de xiāngwèi","the smell of breakfast"],["我的猫","wǒ de māo","my cat"],["三个闹钟","sān ge nàozhōng","three alarms"]]},"l3":{"zh":"冬天早上我根本不想起，除非知道有热乎乎的东西吃——就靠这个。","py":"Dōngtiān zǎoshang wǒ gēnběn bù xiǎng qǐ, chúfēi zhīdao yǒu rèhūhū de dōngxi chī——jiù kào zhège.","en":"On winter mornings I don't want to get up at all — unless I know there's something hot to eat. That's all it takes."}},"se":{"l1":{"en":"Coffee wakes me up.","zh":"早上不喝咖啡我醒不过来。","words":[["wake up","醒"],["coffee","咖啡"]]},"l2":{"starter":"On dark winter mornings, what gets me out of bed is …","zh":"冬天天黑的早上，能让我起床的是……","ideas":[["the smell of breakfast","早饭的香味"],["my cat","我的猫"],["three alarms","三个闹钟"]]},"l3":{"en":"Nothing gets me up in winter except knowing there's something warm to eat — that's the whole trick.","zh":"冬天能让我起床的只有一件事：知道有热乎的东西吃。就这么简单。"}},"ask":["你那边冬天早上，大家吃什么暖暖身子？","What do people eat on winter mornings where you are to warm up?"],"rep":{"id":"elin","nm":"Elin","c":["马尔默","Malmö"],"face":true,"orig":"en","zh":"露西亚节早上，就一个藏红花面包加一大杯咖啡——黑乎乎的早上全靠它撑着。节前那个星期五，我们班给家长唱了露西亚的歌，蜡烛全是电池的！","py":"Lùxīyà Jié zǎoshang, jiù yí ge zànghónghuā miànbāo jiā yí dà bēi kāfēi —— hēihūhū de zǎoshang quán kào tā chēngzhe. Jié qián nà ge xīngqīwǔ, wǒmen bān gěi jiāzhǎng chàngle Lùxīyà de gē, làzhú quán shì diànchí de!","en":"Ja, on Lucia morning it's a saffron bun and a big coffee — that's how I get through a dark morning. The Friday before, my class sang Lucia for the parents. Battery candles only!","learner":"en","translated":true},"from":"system"},{"d":14,"date":"2026-12-14","city":["拉各斯","Lagos"],"obj":["一张回家的登机牌","A boarding pass home"],"story":["十二月的拉各斯被叫作「Detty December」：在国外生活的尼日利亚人回家过年底，演唱会、婚礼、海边派对一个接一个，路也堵得厉害，东西也跟着涨价。","In Lagos, December is 'Detty December': Nigerians living abroad fly home, and it's one concert, wedding and beach party after another — with the traffic and prices to match."],"src":"https://en.wikipedia.org/wiki/Detty_December_(Nigeria)","src2":"","sz":{"l1":{"zh":"我十二月回家。","py":"Wǒ shí'èr yuè huí jiā.","en":"I'm going home in December.","words":[["回家","huí jiā","to go home"],["十二月","shí'èr yuè","December"]]},"l2":{"starter":"年底我一般……","py":"Niándǐ wǒ yìbān ……","en":"At the end of the year I usually …","ideas":[["回家","huí jiā","go home"],["哪儿也不去","nǎr yě bú qù","don't go anywhere"],["去看朋友","qù kàn péngyou","go and see friends"]]},"l3":{"zh":"我已经两年没回家了，今年年底终于能回去，想吃的东西都列好单子了。","py":"Wǒ yǐjīng liǎng nián méi huí jiā le, jīnnián niándǐ zhōngyú néng huíqu, xiǎng chī de dōngxi dōu liè hǎo dānzi le.","en":"I haven't been home in two years. This year-end I finally get to go back — I've already listed everything I want to eat."}},"se":{"l1":{"en":"I'm going home in December.","zh":"我十二月回家。","words":[["going home","回家"],["December","十二月"]]},"l2":{"starter":"At the end of the year, I usually …","zh":"年底我一般……","ideas":[["fly home","飞回家"],["stay where I am","哪儿也不去"],["visit friends in another city","去别的城市看朋友"]]},"l3":{"en":"I haven't been home for two years, so this December I'm finally going — and I've already made a list of everything I want to eat.","zh":"我已经两年没回家了，所以今年十二月终于要回去了，想吃的东西已经列好了一张单子。"}},"ask":["年底，你会回家吗？","Are you going home at the end of the year?"],"rep":{"id":"tobi","nm":"Tobi","c":["拉各斯","Lagos"],"face":true,"orig":"zh","zh":"十二月拉各斯的路，太堵了。我表哥从伦敦回来了就要办婚礼了。","py":"Shí'èr yuè Lāgèsī de lù, tài dǔ le. Wǒ biǎogē cóng Lúndūn huílai le jiù yào bàn hūnlǐ le.","en":"Lagos roads in December — so jammed. My cousin's back from London and getting married straight away.","learner":true,"translated":false},"from":"system"},{"d":15,"date":"2026-12-15","city":["果阿","Goa"],"obj":["一小盘 kuswar 点心","A little plate of kuswar sweets"],"story":["在印度果阿，天主教家庭圣诞前会做一整套点心和小吃，叫 kuswar，多的有 22 种，做好了互相送。","In Goa, Catholic families make kuswar before Christmas — a whole set of sweets and snacks, up to 22 kinds — and swap them with each other."],"src":"https://en.wikipedia.org/wiki/Kuswar","src2":"","sz":{"l1":{"zh":"我会送朋友一点吃的。","py":"Wǒ huì sòng péngyou yìdiǎn chī de.","en":"I give my friends something to eat.","words":[["送","sòng","to give (as a gift)"],["吃的","chī de","something to eat"]]},"l2":{"starter":"去别人家，我一般会带……","py":"Qù biérén jiā, wǒ yìbān huì dài ……","en":"When I visit someone, I usually bring …","ideas":[["水果","shuǐguǒ","fruit"],["自己做的点心","zìjǐ zuò de diǎnxin","homemade snacks"],["一束花","yí shù huā","a bunch of flowers"]]},"l3":{"zh":"去别人家我总会带点吃的。我嘴笨，不太会说客气话，一盒自己做的点心就替我说了。","py":"Qù biérén jiā wǒ zǒng huì dài diǎn chī de. Wǒ zuǐ bèn, bú tài huì shuō kèqihuà, yì hé zìjǐ zuò de diǎnxin jiù tì wǒ shuō le.","en":"I always bring food when I visit. I'm not great at polite small talk — a box of homemade snacks says it for me."}},"se":{"l1":{"en":"I give my friends something sweet.","zh":"我会送朋友一点甜的。","words":[["give","送"],["something sweet","甜的东西"]]},"l2":{"starter":"When I visit someone, I usually bring …","zh":"去别人家，我一般会带……","ideas":[["fruit","水果"],["something I baked","自己烤的东西"],["flowers","花"]]},"l3":{"en":"I always bring food when I visit — I'm not good with words, so a box of something homemade says it for me.","zh":"我去别人家总会带点吃的。我不太会说话，一盒自己做的东西就替我说了。"}},"ask":["你那边过节，大家会互相送吃的吗？送什么？","Where you are, do people swap food for the holidays? What do they give?"],"rep":{"id":"priya","nm":"Priya","c":["孟买","Mumbai"],"face":false,"orig":"en","zh":"我有个果阿来的同事，每年都带一盒 kuswar 到办公室。最先被抢光的是 kulkul。","py":"Wǒ yǒu ge Guǒ'ā lái de tóngshì, měi nián dōu dài yì hé kuswar dào bàngōngshì. Zuì xiān bèi qiǎngguāng de shì kulkul.","en":"A colleague of mine from Goa brings a box of kuswar to the office every year. The kulkuls go first.","learner":false,"translated":true},"from":"system"},{"d":16,"date":"2026-12-16","city":["马尼拉","Manila"],"obj":["一盏星形灯笼（parol）","A star lantern (parol)"],"story":["菲律宾的 Simbang Gabi 是从 12 月 16 日到 24 日、一连九天的清晨弥撒，常常凌晨四点左右就开始。做完弥撒，大家在教堂外买 bibingka（米糕）、puto bumbong（紫米糕）当早饭。星形灯笼 parol 当初就是给去早弥撒的人照路的。","Simbang Gabi in the Philippines begins on 16 December: nine dawn Masses through to the 24th, often starting around 4 a.m. Afterwards people buy bibingka and puto bumbong in the churchyard for breakfast. The star lantern, the parol, first lit the way to these early Masses."],"src":"https://en.wikipedia.org/wiki/Simbang_Gabi","src2":"","sz":{"l1":{"zh":"我早上起不来。","py":"Wǒ zǎoshang qǐ bù lái.","en":"I can't get up in the morning.","words":[["起不来","qǐ bù lái","can't get up"],["早上","zǎoshang","morning"]]},"l2":{"starter":"我起得最早的一次，是为了……","py":"Wǒ qǐ de zuì zǎo de yí cì, shì wèile ……","en":"The earliest I ever got up was to …","ideas":[["赶飞机","gǎn fēijī","catch a flight"],["看日出","kàn rìchū","see the sunrise"],["考试","kǎoshì","sit an exam"]]},"l3":{"zh":"我起得最早的一次是凌晨三点，为了爬山看日出。冻得要命，可是到现在还想再去一次。","py":"Wǒ qǐ de zuì zǎo de yí cì shì língchén sān diǎn, wèile pá shān kàn rìchū. Dòng de yàomìng, kěshì dào xiànzài hái xiǎng zài qù yí cì.","en":"The earliest I've ever got up was 3 a.m., to climb a mountain for the sunrise. I was frozen — and I still want to do it again."}},"se":{"l1":{"en":"I'm not a morning person.","zh":"我早上起不来。","words":[["morning person","习惯早起的人"],["not","不是"]]},"l2":{"starter":"The earliest I've ever got up was for …","zh":"我起得最早的一次，是为了……","ideas":[["a flight","赶飞机"],["a sunrise","看日出"],["an exam","考试"]]},"l3":{"en":"The earliest I've ever got up was 3 a.m., to climb a mountain for the sunrise — freezing, but I'd do it again.","zh":"我起得最早的一次是凌晨三点，为了上山看日出。冻得要命，可我还想再去。"}},"ask":["你那边过节，有什么事是一大早就要做的？","Where you are, is there anything people get up really early for at the holidays?"],"rep":{"id":"bea","nm":"Bea","c":["马尼拉","Manila"],"face":true,"orig":"en","zh":"Simbang Gabi 那九天，说实话，我是冲着弥撒后的 puto bumbong 去的，我外婆是冲着弥撒去的。各取所需。","py":"Simbang Gabi nà jiǔ tiān, shuō shíhuà, wǒ shì chòngzhe mísa hòu de puto bumbong qù de, wǒ wàipó shì chòngzhe mísa qù de. Gè qǔ suǒ xū.","en":"Those nine days of Simbang Gabi — honestly, I go for the puto bumbong afterwards. My lola goes for the Mass. Everybody wins.","learner":false,"translated":true},"from":"system"},{"d":17,"date":"2026-12-17","city":["瓜达拉哈拉","Guadalajara"],"obj":["一个星形 piñata","A star piñata"],"story":["墨西哥的 Las Posadas 从 12 月 16 日开始，一连九个晚上：两个人扮成玛利亚和约瑟，大家举着纸罩的蜡烛，挨家挨户「找住处」、对唱；每晚最后是孩子们打 piñata，大家一起吃饭。这时候用的 piñata 传统上是星形的。","Las Posadas in Mexico began on 16 December and runs nine nights: two people play Mary and Joseph, everyone carries candles in paper shades from house to house 'looking for an inn' and singing back and forth; each night ends with children breaking a piñata and a shared meal. The piñatas for these nights are traditionally star-shaped."],"src":"https://en.wikipedia.org/wiki/Las_Posadas","src2":"","sz":{"l1":{"zh":"我不太认识我的邻居。","py":"Wǒ bú tài rènshi wǒ de línjū.","en":"I don't really know my neighbours.","words":[["认识","rènshi","to know (someone)"],["邻居","línjū","neighbour"]]},"l2":{"starter":"我跟邻居……","py":"Wǒ gēn línjū ……","en":"My neighbours and I …","ideas":[["见面打个招呼","jiànmiàn dǎ ge zhāohu","say hi when we meet"],["有时候互相送吃的","yǒu shíhou hùxiāng sòng chī de","sometimes share food"],["基本不说话","jīběn bù shuōhuà","hardly ever talk"]]},"l3":{"zh":"我只认识楼下一位老爷爷。我们认识，是因为我的快递老是被送到他家门口。","py":"Wǒ zhǐ rènshi lóu xià yí wèi lǎo yéye. Wǒmen rènshi, shì yīnwèi wǒ de kuàidì lǎo shì bèi sòng dào tā jiā ménkǒu.","en":"I only know one neighbour, an old man downstairs. We met because my deliveries kept getting left at his door."}},"se":{"l1":{"en":"I don't really know my neighbours.","zh":"我不太认识我的邻居。","words":[["neighbours","邻居"],["know","认识"]]},"l2":{"starter":"With my neighbours, we …","zh":"我跟邻居……","ideas":[["just say hi","就打个招呼"],["share food sometimes","有时候互相送吃的"],["never talk","从来不说话"]]},"l3":{"en":"I only know one neighbour, an old man downstairs — we met because my parcels kept ending up at his door.","zh":"我只认识一个邻居，楼下的一位老爷爷。认识他是因为我的快递老是送到他家门口。"}},"ask":["你那边过节，邻居之间会一起做什么吗？","Where you are, do neighbours do anything together for the holidays?"],"rep":{"id":"rosa","nm":"Rosa","c":["瓜达拉哈拉","Guadalajara"],"face":true,"orig":"en","zh":"九个晚上，每晚换一家，总有一晚轮到我妹妹家。我煮热果茶（ponche），孩子们打 piñata，我的膝盖最怕那段边走边唱。","py":"Jiǔ ge wǎnshang, měi wǎn huàn yì jiā, zǒng yǒu yì wǎn lúndào wǒ mèimei jiā. Wǒ zhǔ rè guǒchá (ponche), háizimen dǎ piñata, wǒ de xīgài zuì pà nà duàn biān zǒu biān chàng.","en":"Nine nights, a different house each night — one of them is always my sister's. I make the ponche, the kids break the piñata, and my knees dread the singing walk.","learner":false,"translated":true},"from":"system"},{"d":18,"date":"2026-12-18","city":["首尔","Seoul"],"obj":["寺庙山门前的一棵小圣诞树","A little Christmas tree at a temple gate"],"story":["首尔的佛教寺庙曹溪寺，从 2010 年起很多年都在圣诞前给山门口的一棵圣诞树点灯，表示不同宗教和睦相处。韩国从 1949 年起把圣诞节定为法定假日，很多人这天跟朋友或另一半出去吃饭，不太是全家团聚的日子。","Since 2010, Jogyesa, a Buddhist temple in Seoul, has for many years lit a Christmas tree at its main gate before Christmas, as a sign of harmony between religions. South Korea has made Christmas a public holiday since 1949; many people spend it eating out with friends or a partner rather than at a big family reunion."],"src":"https://www.korea.net/NewsFocus/Society/view?articleId=123950","src2":"https://en.wikipedia.org/wiki/Christmas_by_country","sz":{"l1":{"zh":"25 号我放假。","py":"Èrshíwǔ hào wǒ fàngjià.","en":"I have the 25th off.","words":[["号","hào","day of the month"],["放假","fàngjià","to have the day off"]]},"l2":{"starter":"25 号那天，我一般……","py":"Èrshíwǔ hào nà tiān, wǒ yìbān ……","en":"On the 25th, I usually …","ideas":[["照常上班","zhàocháng shàngbān","work as usual"],["跟朋友出去吃饭","gēn péngyou chūqu chī fàn","go out to eat with friends"],["在家睡懒觉","zài jiā shuì lǎnjiào","sleep in at home"]]},"l3":{"zh":"我这边圣诞不放假，那天我照常上班，不过我打算带点甜的去，跟同事分着吃。","py":"Wǒ zhèbiān Shèngdàn bú fàngjià, nà tiān wǒ zhàocháng shàngbān, búguò wǒ dǎsuàn dài diǎn tián de qù, gēn tóngshì fēnzhe chī.","en":"Christmas isn't a day off here, so I'll be at work as usual — but I'm planning to bring something sweet to share with my colleagues."}},"se":{"l1":{"en":"I have the day off on the 25th.","zh":"我 25 号放假。","words":[["day off","休息日"],["the 25th","25 号"]]},"l2":{"starter":"On the 25th, I usually …","zh":"25 号那天，我一般……","ideas":[["work as normal","照常上班"],["go out with friends","跟朋友出去"],["sleep in","睡懒觉"]]},"l3":{"en":"Christmas isn't a holiday where I live, so I'll be at work — but I'll bring something sweet to share with my colleagues.","zh":"我住的地方圣诞不放假，所以那天我照常上班，不过我会带点甜的跟同事分着吃。"}},"ask":["25 号那天，你那边放假吗？大家都做什么？","Is the 25th a day off where you are? What do people do?"],"rep":{"id":"jiwoo","nm":"Ji-woo","c":["首尔","Seoul"],"face":true,"orig":"en","zh":"我们这天放假，我跟朋友几个星期前就把餐厅订好了。一家人团聚？那是秋夕（韩国的中秋）的事。","py":"Wǒmen zhè tiān fàngjià, wǒ gēn péngyou jǐ ge xīngqī qián jiù bǎ cāntīng dìnghǎo le. Yì jiā rén tuánjù? Nà shì Qiūxī (Hánguó de Zhōngqiū) de shì.","en":"We get the day off, so my friends and I booked a restaurant weeks ago. Big family get-together? That's Chuseok.","learner":"en","translated":true},"from":"system"},{"d":19,"date":"2026-12-19","city":["加拉加斯","Caracas"],"obj":["一个用芭蕉叶包好的 hallaca","A hallaca wrapped in plantain leaf"],"story":["委内瑞拉的圣诞桌上少不了 hallaca：玉米面团里包着炖肉、葡萄干、刺山柑和橄榄，用芭蕉叶包好、细绳扎紧再煮。做的那天，一家人一早就聚在一起备料。","No Venezuelan Christmas table is complete without hallacas: corn dough filled with stewed meat, raisins, capers and olives, folded in plantain leaves, tied with string and boiled. On making day, the family gathers in the morning to prepare everything."],"src":"https://en.wikipedia.org/wiki/Hallaca","src2":"","sz":{"l1":{"zh":"我在厨房打下手。","py":"Wǒ zài chúfáng dǎ xiàshǒu.","en":"I'm the helper in the kitchen.","words":[["厨房","chúfáng","kitchen"],["打下手","dǎ xiàshǒu","to be the helper"]]},"l2":{"starter":"家里一起做饭的时候，我负责……","py":"Jiā lǐ yìqǐ zuò fàn de shíhou, wǒ fùzé ……","en":"When the family cooks together, I'm in charge of …","ideas":[["洗碗","xǐ wǎn","washing up"],["切菜","qiē cài","chopping"],["尝咸淡","cháng xiándàn","tasting for salt"]]},"l3":{"zh":"家里一起做饭的时候，我的任务是尝咸淡——说白了，就是别的什么都不让我碰。","py":"Jiā lǐ yìqǐ zuò fàn de shíhou, wǒ de rènwu shì cháng xiándàn——shuō bái le, jiù shì biéde shénme dōu bú ràng wǒ pèng.","en":"When the family cooks together, my job is tasting for salt — in other words, I'm not allowed to touch anything else."}},"se":{"l1":{"en":"I help in the kitchen.","zh":"我在厨房打下手。","words":[["help","帮忙"],["kitchen","厨房"]]},"l2":{"starter":"When my family cooks together, my job is …","zh":"家里一起做饭的时候，我负责……","ideas":[["washing up","洗碗"],["chopping","切菜"],["tasting","尝味道"]]},"l3":{"en":"When we cook together, I'm officially 'the taster' — which really means I'm not allowed to touch anything else.","zh":"我们家一起做饭的时候，我的正式工作是「试吃」，其实就是别的什么都不让我碰。"}},"ask":["你那边过节，有什么菜是一家人一起做的？","Where you are, is there a dish the whole family makes together for the holidays?"],"rep":null,"from":"system"},{"d":20,"date":"2026-12-20","city":["巴塞罗那","Barcelona"],"obj":["一截盖着小毯子的笑脸木头（tió）","A smiling log under a blanket (tió)"],"story":["加泰罗尼亚的孩子从 12 月 8 日起每晚「喂」一截叫 tió 的木头，还给它盖毯子，怕它冷。到了平安夜或圣诞节，孩子们一边唱歌一边用小棍敲它，它就「拉」出糖、坚果和杜隆，大家一起分。","From 8 December, children in Catalonia 'feed' a log called the tió every night and tuck a blanket over it so it won't get cold. On Christmas Eve or Christmas Day they sing and tap it with sticks — and it 'poops out' sweets, nuts and turrón for everyone to share."],"src":"https://en.wikipedia.org/wiki/Ti%C3%B3_de_Nadal","src2":"","sz":{"l1":{"zh":"我家有一个好玩的习惯。","py":"Wǒ jiā yǒu yí ge hǎowán de xíguàn.","en":"My family has a fun habit.","words":[["好玩","hǎowán","fun"],["习惯","xíguàn","habit, custom"]]},"l2":{"starter":"我家过节有个习惯：……","py":"Wǒ jiā guòjié yǒu ge xíguàn: ……","en":"At the holidays my family has a habit: …","ideas":[["先吃甜的","xiān chī tián de","eat the sweet stuff first"],["一起唱歌","yìqǐ chàng gē","sing together"],["把礼物藏起来","bǎ lǐwù cáng qǐlái","hide the presents"]]},"l3":{"zh":"我家有个怪习惯：每年我爸都要藏一个礼物，藏得太好，有时候到第二年春天才找出来。","py":"Wǒ jiā yǒu ge guài xíguàn: měi nián wǒ bà dōu yào cáng yí ge lǐwù, cáng de tài hǎo, yǒu shíhou dào dì-èr nián chūntiān cái zhǎo chūlai.","en":"My family has an odd habit: every year my dad hides one present so well that sometimes we only find it the next spring."}},"se":{"l1":{"en":"My family has a funny tradition.","zh":"我们家有一个好玩的习惯。","words":[["funny","好笑的"],["tradition","传统、习惯"]]},"l2":{"starter":"One funny thing my family always does is …","zh":"我们家每次都会做一件好笑的事：……","ideas":[["sing really badly","唱歌特别难听"],["hide the presents","把礼物藏起来"],["eat dessert first","先吃甜点"]]},"l3":{"en":"Every year my dad hides one present so well that we only find it in spring.","zh":"每年我爸都会藏一个礼物，藏得太好了，我们总要到春天才找到。"}},"ask":["你家过节，有没有一个外人看了会笑的习惯？","Does your family have a holiday habit that would make outsiders laugh?"],"rep":{"id":"jordi","nm":"Jordi","c":["巴塞罗那","Barcelona"],"face":true,"orig":"en","zh":"我外甥从 8 号起就在喂我们家的 tió，喂的大多是橘子皮。我跟他说，它就爱吃这个。","py":"Wǒ wàisheng cóng bā hào qǐ jiù zài wèi wǒmen jiā de tió, wèi de dàduō shì júzi pí. Wǒ gēn tā shuō, tā jiù ài chī zhège.","en":"My nephew's been feeding our tió since the 8th. Mostly orange peel. I told him that's its favourite.","learner":false,"translated":true},"from":"system"},{"d":21,"date":"2026-12-21","city":["特罗姆瑟","Tromsø"],"obj":["一张圈着 1 月 15 日的小日历纸","A calendar page with 15 January circled"],"story":["12 月 21 日是冬至，北半球白天最短的一天。在挪威北部的特罗姆瑟，太阳从 11 月底起就没升上过地平线，要到 1 月中旬才回来。","21 December is the winter solstice, the shortest day in the northern hemisphere. In Tromsø, in northern Norway, the sun hasn't risen above the horizon since late November, and won't be back until mid-January."],"src":"https://en.wikipedia.org/wiki/Troms%C3%B8","src2":"https://www.timeanddate.com/calendar/december-solstice.html","sz":{"l1":{"zh":"心情不好的时候，我会出去走走。","py":"Xīnqíng bù hǎo de shíhou, wǒ huì chūqu zǒuzou.","en":"When I'm feeling down, I go out for a walk.","words":[["心情","xīnqíng","mood"],["走走","zǒuzou","to take a walk"]]},"l2":{"starter":"天黑得早的时候，我会……","py":"Tiān hēi de zǎo de shíhou, wǒ huì ……","en":"When it gets dark early, I …","ideas":[["约朋友吃饭","yuē péngyou chī fàn","meet friends for dinner"],["煮点热的","zhǔ diǎn rè de","cook something hot"],["中午出去晒太阳","zhōngwǔ chūqu shài tàiyáng","go out in the sun at noon"]]},"l3":{"zh":"冬天天一短，我就容易没精神，所以我每个星期都跟朋友约一次，哪怕只是一起喝碗汤，日子就有个盼头。","py":"Dōngtiān tiān yì duǎn, wǒ jiù róngyì méi jīngshen, suǒyǐ wǒ měi ge xīngqī dōu gēn péngyou yuē yí cì, nǎpà zhǐshì yìqǐ hē wǎn tāng, rìzi jiù yǒu ge pàntou.","en":"When winter days get short I easily lose my energy, so I meet a friend once a week — even if it's just a bowl of soup — and then there's something to look forward to."}},"se":{"l1":{"en":"When I feel down, I go for a walk.","zh":"心情不好的时候，我会去走走。","words":[["feel down","心情不好"],["go for a walk","去散步"]]},"l2":{"starter":"When the days are short, I keep myself going by …","zh":"白天短的时候，我靠……撑着。","ideas":[["seeing friends","见朋友"],["cooking something warm","做点热的吃"],["going outside at lunch","中午出去晒晒"]]},"l3":{"en":"When the days get short I feel a bit low, so I make one plan a week with a friend — even just soup — so there's always something to look forward to.","zh":"天一变短我就有点低落，所以我每周跟朋友约一次，哪怕只是一起喝碗汤，这样总有个盼头。"}},"ask":["你那边今天天黑得早吗？长长的晚上你怎么过？","Does it get dark early where you are today? How do you spend the long evenings?"],"rep":{"id":"ingrid","nm":"Ingrid","c":["特罗姆瑟","Tromsø"],"face":true,"orig":"en","zh":"冬至一过，白天就一天比一天长了。我们这儿要到一月才看得出来，可我还是会记一笔——为太阳高兴，是我的工作嘛。","py":"Dōngzhì yí guò, báitiān jiù yì tiān bǐ yì tiān cháng le. Wǒmen zhèr yào dào yīyuè cái kàn de chūlái, kě wǒ háishi huì jì yì bǐ —— wèi tàiyáng gāoxìng, shì wǒ de gōngzuò ma.","en":"After the solstice the days start getting longer. Up here you won't notice till January, but I mark it anyway — being happy about the sun is my job.","learner":false,"translated":true},"from":"system"},{"d":22,"date":"2026-12-22","city":["北京","Beijing"],"obj":["一只白白胖胖的饺子","A plump white dumpling"],"story":["按北京时间，今年的冬至在 12 月 22 日凌晨 4 点 50 分。中国北方很多人家冬至吃饺子：传说东汉医生张仲景看到穷人冬天冻坏了耳朵，就做了耳朵形状的面食分给他们。也有很多人家这天吃汤圆。","By Beijing time, this year's winter solstice falls at 4:50 a.m. on 22 December. In northern China many families eat dumplings on the solstice: the story goes that the Han-dynasty doctor Zhang Zhongjing saw poor people's ears frostbitten in winter and handed out ear-shaped dumplings. Many other families eat tangyuan, sweet rice balls."],"src":"https://en.wikipedia.org/wiki/Dongzhi_Festival","src2":"https://www.timeanddate.com/calendar/december-solstice.html","sz":{"l1":{"zh":"冬天我爱喝汤。","py":"Dōngtiān wǒ ài hē tāng.","en":"In winter I love having soup.","words":[["喝汤","hē tāng","to have soup"],["爱","ài","to love (doing)"]]},"l2":{"starter":"天最冷的时候，我就想吃……","py":"Tiān zuì lěng de shíhou, wǒ jiù xiǎng chī ……","en":"When it's coldest, I just want …","ideas":[["一碗热面","yì wǎn rè miàn","a bowl of hot noodles"],["火锅","huǒguō","hot pot"],["饺子","jiǎozi","dumplings"]]},"l3":{"zh":"天最冷的时候，我就想喝我妈煮的汤。倒不是多好喝，是她每次都煮一大锅，非让我带一罐走。","py":"Tiān zuì lěng de shíhou, wǒ jiù xiǎng hē wǒ mā zhǔ de tāng. Dào bú shì duō hǎohē, shì tā měi cì dōu zhǔ yí dà guō, fēi ràng wǒ dài yí guàn zǒu.","en":"On the coldest days I just want my mum's soup. Not that it's amazing — it's that she always makes a huge pot and insists I take a jar home."}},"se":{"l1":{"en":"In winter, I eat a lot of soup.","zh":"冬天我常喝汤。","words":[["soup","汤"],["a lot of","很多"]]},"l2":{"starter":"On the coldest days, I always want …","zh":"最冷的那几天，我总想吃……","ideas":[["noodles","面条"],["hot pot","火锅"],["something my mum makes","我妈做的菜"]]},"l3":{"en":"On the coldest days I want my mum's soup — not because it's special, but because she always makes too much and sends me home with a jar.","zh":"最冷的那几天我就想喝我妈煮的汤，不是因为多特别，是因为她每次都煮太多，非让我带一罐回去。"}},"ask":["你那边最冷的时候，大家吃什么？","What do people eat on the coldest days where you are?"],"rep":{"id":"suqing","nm":"Su Qing 苏晴","c":["北京","Beijing"],"face":true,"orig":"zh","zh":"北方老话说：「冬至不端饺子碗，冻掉耳朵没人管。」其实吧，就是找个理由，一家人坐一块儿包饺子。","py":"Běifāng lǎohuà shuō: 'Dōngzhì bù duān jiǎozi wǎn, dòngdiào ěrduo méi rén guǎn.' Qíshí ba, jiù shì zhǎo ge lǐyóu, yì jiā rén zuò yíkuàir bāo jiǎozi.","en":"There's an old northern saying: 'Skip your bowl of dumplings at the solstice, and if your ears freeze off, nobody'll care.' Honestly, it's just an excuse for the family to sit down together and make dumplings.","learner":false,"translated":false},"from":"system"},{"d":23,"date":"2026-12-23","city":["亚的斯亚贝巴","Addis Ababa"],"obj":["一条白色薄棉披巾（netela）","A white cotton shawl (netela)"],"story":["埃塞俄比亚的圣诞节 Genna 在 1 月 7 日，他们还要再等两个多星期。在那之前，很多东正教徒守 43 天的斋：不吃肉、奶、蛋。到了圣诞那天，大家披上白色的薄棉披巾 netela。","Ethiopia's Christmas, Genna, is on 7 January — they still have just over two weeks to wait. Before it, many Orthodox Christians keep a 43-day fast with no meat, dairy or eggs. On Christmas Day, people wrap themselves in a thin white cotton shawl, the netela."],"src":"https://en.wikipedia.org/wiki/Christmas_in_Ethiopia","src2":"","sz":{"l1":{"zh":"过节我会穿得好看一点。","py":"Guòjié wǒ huì chuān de hǎokàn yìdiǎn.","en":"At the holidays I dress up a bit.","words":[["穿","chuān","to wear"],["好看","hǎokàn","nice-looking"]]},"l2":{"starter":"过节的时候，我喜欢穿……","py":"Guòjié de shíhou, wǒ xǐhuan chuān ……","en":"At the holidays, I like to wear …","ideas":[["红色的衣服","hóngsè de yīfu","something red"],["新衣服","xīn yīfu","new clothes"],["怎么舒服怎么穿","zěnme shūfu zěnme chuān","whatever's comfortable"]]},"l3":{"zh":"一到过节，我最后总是穿那件旧毛衣，我家里人都管它叫我的「过节制服」。","py":"Yí dào guòjié, wǒ zuìhòu zǒng shì chuān nà jiàn jiù máoyī, wǒ jiā lǐ rén dōu guǎn tā jiào wǒ de 'guòjié zhìfú'.","en":"Whenever there's a holiday I end up in the same old jumper — my family calls it my 'holiday uniform'."}},"se":{"l1":{"en":"I wear something nice.","zh":"我会穿得好看一点。","words":[["wear","穿"],["something nice","好看的衣服"]]},"l2":{"starter":"For a big day, I like to wear …","zh":"到了大日子，我喜欢穿……","ideas":[["a warm jumper","一件暖和的毛衣"],["something red","红色的衣服"],["whatever's comfortable","怎么舒服怎么穿"]]},"l3":{"en":"For big days I always end up in the same old jumper — my family calls it my 'holiday uniform'.","zh":"一到大日子，我最后总是穿那件旧毛衣，家里人都说那是我的「过节制服」。"}},"ask":["你那边过节，大家穿什么？","What do people wear for the holidays where you are?"],"rep":null,"from":"system"},{"d":24,"date":"2026-12-24","city":["上海","Shanghai"],"obj":["一个包着彩纸的平安果","A wrapped 'peace apple'"],"story":["12 月 24 日是平安夜。在中国大陆，圣诞节不放假，可有人会在平安夜互相送苹果，叫「平安果」——因为「苹」跟「平」同音，取「平平安安」的意思。","24 December is Christmas Eve — in Chinese, 平安夜, 'the peaceful night'. Christmas isn't a public holiday in mainland China, but some people give each other apples that evening, 'peace apples' (平安果), because 苹 (píng, apple) sounds like 平 (píng, peace)."],"src":"https://zh.wikipedia.org/wiki/%E5%B9%B3%E5%AE%89%E5%A4%9C","src2":"https://en.wikipedia.org/wiki/Christmas_in_China","sz":{"l1":{"zh":"祝你平平安安。","py":"Zhù nǐ píngpíng'ān'ān.","en":"Wishing you peace and safety.","words":[["祝","zhù","to wish"],["平安","píng'ān","safe and well"]]},"l2":{"starter":"今天晚上，我想给……发一条消息。","py":"Jīntiān wǎnshang, wǒ xiǎng gěi …… fā yì tiáo xiāoxi.","en":"Tonight I want to send a message to …","ideas":[["爸妈","bàmā","my parents"],["一个老朋友","yí ge lǎo péngyou","an old friend"],["很久没联系的人","hěn jiǔ méi liánxì de rén","someone I've lost touch with"]]},"l3":{"zh":"今晚我想给一个好几年没联系的老朋友发条消息，就一句：「突然想起你了，你还好吗？」","py":"Jīnwǎn wǒ xiǎng gěi yí ge hǎo jǐ nián méi liánxì de lǎo péngyou fā tiáo xiāoxi, jiù yí jù: 'Tūrán xiǎngqǐ nǐ le, nǐ hái hǎo ma?'","en":"Tonight I want to message an old friend I haven't been in touch with for years. Just one line: 'Suddenly thought of you — how are you?'"}},"se":{"l1":{"en":"I hope you have a peaceful year.","zh":"祝你这一年平平安安。","words":[["hope","希望"],["peaceful","平安的、安稳的"]]},"l2":{"starter":"Tonight I want to send a message to …","zh":"今晚我想给……发一条消息。","ideas":[["my parents","我爸妈"],["a friend far away","远方的一个朋友"],["someone I haven't talked to in years","好几年没联系的人"]]},"l3":{"en":"Tonight I'll text an old friend I haven't spoken to in years — just 'Thinking of you. Hope you're well.' That's enough.","zh":"今晚我想给一个好几年没联系的老朋友发条消息，就一句：「想起你了，希望你一切都好。」这就够了。"}},"ask":["今晚，你想对谁说一句「平安」？","Tonight, who would you like to wish a peaceful night?"],"rep":{"id":"nour","nm":"Nour","c":["开罗","Cairo"],"face":true,"orig":"zh","zh":"我第一次收到平安果是在金字塔，一个中国游客送给我的。我说「非常感谢您的厚礼」，她笑了：「就一个苹果！」","py":"Wǒ dì-yī cì shōudào píng'ānguǒ shì zài jīnzìtǎ, yí ge Zhōngguó yóukè sòng gěi wǒ de. Wǒ shuō 'fēicháng gǎnxiè nín de hòulǐ', tā xiào le: 'Jiù yí ge píngguǒ!'","en":"The first time I got a peace apple was at the pyramids — a Chinese tourist gave it to me. I said, 'Thank you so much for your generous gift,' and she laughed: 'It's one apple!'","learner":true,"translated":false},"from":"system"}],"schedule":"rolling"};

/* d93_advent_spring.js */
window.ADVENT_SPRING_DATA = {"year":2027,"days":[{"d":1,"date":"2027-01-15","city":["北京","Beijing"],"obj":["一碗腊八粥","A bowl of Laba porridge"],"story":["腊月初八，腊八节。北京雍和宫每年这天都在门口舍粥：先把第一锅粥供在佛前，再一碗碗分给排队的人。从腊八到除夕，一共二十二天。","The eighth day of the twelfth lunar month: Laba. Every year on this day Beijing's Yonghe Temple gives out porridge at its gate — the first pot goes before the Buddha, then bowl after bowl goes to the people queuing outside. From Laba to New Year's Eve: twenty-two days, one envelope each."],"src":"https://www.thepaper.cn/newsDetail_forward_26067359","src2":"https://news.ycwb.com/2025-01/07/content_53167957.htm","sz":{"l1":{"zh":"冷的时候，我想喝一碗热粥。","py":"Lěng de shíhou, wǒ xiǎng hē yì wǎn rè zhōu.","en":"When it's cold, I want a bowl of hot porridge.","words":[["一碗","yì wǎn","a bowl of"],["热","rè","hot"],["粥","zhōu","porridge"]]},"l2":{"starter":"天冷的早上，我最想吃……","py":"Tiān lěng de zǎoshang, wǒ zuì xiǎng chī ……","en":"On a cold morning, what I want most is …","ideas":[["热汤面","rè tāngmiàn","hot noodle soup"],["烤面包","kǎo miànbāo","toast"],["燕麦粥","yànmài zhōu","oatmeal"]]},"l3":{"zh":"我平时早上不吃东西，可是一到冬天，就想来一碗热乎乎的，喝完整个人都醒了。","py":"Wǒ píngshí zǎoshang bù chī dōngxi, kěshì yí dào dōngtiān, jiù xiǎng lái yì wǎn rèhūhū de, hē wán zhěng gè rén dōu xǐng le.","en":"I don't usually eat in the morning, but once winter comes I want a hot bowl of something — after that I'm properly awake."}},"se":{"l1":{"en":"On cold mornings, I want something hot.","zh":"冷的早上，我想吃点热的。","words":[["cold mornings","冷的早上"],["something hot","热的东西"]]},"l2":{"starter":"On a cold morning, I like …","zh":"冷的早上，我喜欢……","ideas":[["hot soup","热汤"],["porridge","粥"],["a big mug of tea","一大杯茶"]]},"l3":{"en":"I'm not really a breakfast person, but in winter I need something warm — otherwise I'm cold until lunch.","zh":"我平时不太吃早饭，可冬天得吃点热的，不然一直冷到中午。"}},"ask":["天冷的早上，你爱吃点什么？","On a cold morning, what do you like to eat?"],"rep":{"id":"suqing","nm":"Su Qing 苏晴","c":["北京","Beijing"],"face":true,"orig":"zh","zh":"其实吧，冷的早上我最爱一碗咸豆腐脑，再来根油条。到了腊八，就换成腊八粥。","py":"Qíshí ba, lěng de zǎoshang wǒ zuì ài yì wǎn xián dòufunǎo, zài lái gēn yóutiáo. Dàole Làbā, jiù huàn chéng Làbā zhōu.","en":"Honestly, on a cold morning what I love is a bowl of savoury tofu pudding and a youtiao. On Laba, it's Laba porridge instead.","learner":false,"translated":false},"from":"system","storypy":"Làyuè chū bā, Làbā Jié. Běijīng Yōnghé Gōng měi nián zhè tiān dōu zài ménkǒu shě zhōu: xiān bǎ dì-yī guō zhōu gòng zài fó qián, zài yì wǎn wǎn fēn gěi páiduì de rén. Cóng Làbā dào chúxī, yígòng èrshí'èr tiān.","askpy":"Tiān lěng de zǎoshang, nǐ ài chī diǎn shénme?","lunar":["腊月初八","12th lunar month, day 8","chūbā"],"festival":["腊八","Laba","Làbā"]},{"d":2,"date":"2027-01-16","city":["哈尔滨","Harbin"],"obj":["一盏冰灯","An ice lantern"],"story":["哈尔滨的老说法：早年间赶车、喂马的人把水桶灌满放到外面冻，倒出没冻的水，剩下一个冰壳，里面点上蜡烛，风吹不灭。1963 年冬天，哈尔滨在兆麟公园办了第一届冰灯游园会，第一个晚上就来了大约五万人。","An old Harbin story: carters and horse-keepers would fill a bucket with water, leave it out to freeze, pour off the water that hadn't frozen, and put a candle in the ice shell left behind — no wind could blow it out. In the winter of 1963 Harbin held its first ice-lantern fair in Zhaolin Park. About fifty thousand people came on the first night."],"src":"https://news.bjd.com.cn//2022/02/09/10040100.shtml","src2":"https://paper.people.com.cn/rmrbhwb/html/2020-02/08/content_1970060.htm","sz":{"l1":{"zh":"我很久没见过雪了。","py":"Wǒ hěn jiǔ méi jiànguo xuě le.","en":"I haven't seen snow in a long time.","words":[["很久","hěn jiǔ","a long time"],["见过","jiànguo","have seen"],["雪","xuě","snow"]]},"l2":{"starter":"我们那边的冬天……","py":"Wǒmen nàbian de dōngtiān ……","en":"Winter where I live is …","ideas":[["很少下雪","hěn shǎo xià xuě","hardly ever snowy"],["又冷又干","yòu lěng yòu gān","cold and dry"],["一点儿也不冷","yìdiǎnr yě bù lěng","not cold at all"]]},"l3":{"zh":"我长大的地方冬天不下雪，所以第一次看到雪的时候，我在外面站了半天，手都冻红了。","py":"Wǒ zhǎngdà de dìfang dōngtiān bú xià xuě, suǒyǐ dì-yī cì kàndào xuě de shíhou, wǒ zài wàimiàn zhànle bàntiān, shǒu dōu dòng hóng le.","en":"Where I grew up it never snowed, so the first time I saw snow I stood outside for ages, until my hands went red."}},"se":{"l1":{"en":"I haven't seen snow in a long time.","zh":"我很久没见过雪了。","words":[["a long time","很久"],["snow","雪"]]},"l2":{"starter":"Winter where I live is …","zh":"我们那边的冬天……","ideas":[["pretty mild","挺暖和的"],["cold and dry","又冷又干"],["grey and wet","阴冷潮湿"]]},"l3":{"en":"Where I grew up it hardly ever snowed, so the first time I saw real snow I just stood outside until my hands went red.","zh":"我长大的地方几乎不下雪，所以第一次看到真的雪，我就在外面一直站着，站到手都冻红了。"}},"ask":["你那边冬天下雪吗？","Does it snow where you live?"],"rep":{"id":"camila","nm":"Camila","c":["波哥大","Bogotá"],"face":true,"orig":"zh","zh":"等一下等一下……冰做的灯？我没见过雪！波哥大是不下雪。","py":"Děng yíxià děng yíxià…… bīng zuò de dēng? Wǒ méi jiànguo xuě! Bōgēdà shì bú xià xuě.","en":"Wait, wait… lanterns made of ice? I've never seen snow! It doesn't snow in Bogotá.","learner":true,"translated":false},"from":"system","storypy":"Hā'ěrbīn de lǎo shuōfǎ: zǎo niánjiān gǎn chē, wèi mǎ de rén bǎ shuǐtǒng guàn mǎn fàng dào wàimiàn dòng, dào chū méi dòng de shuǐ, shèng xià yí gè bīng ké, lǐmiàn diǎn shang làzhú, fēng chuī bú miè. 1963 nián dōngtiān, Hā'ěrbīn zài Zhàolín Gōngyuán bànle dì-yī jiè bīngdēng yóuyuánhuì, dì-yī gè wǎnshang jiù láile dàyuē wǔ wàn rén.","askpy":"Nǐ nàbian dōngtiān xià xuě ma?","lunar":["腊月初九","12th lunar month, day 9","chūjiǔ"]},{"d":3,"date":"2027-01-17","city":["苏州","Suzhou"],"obj":["一张桃花坞年画","A Taohuawu New Year print"],"story":["苏州桃花坞的木版年画，从明代印到今天，有四百多年了。它是套色印的：一块版只印一种颜色，一张画常常要刻十几块版。2006 年，它进了第一批国家级非遗名录。","Suzhou's Taohuawu woodblock New Year prints have been made since the Ming dynasty — more than four hundred years. Each colour is printed from its own block, so one picture often needs a dozen or more carved blocks. In 2006 it was on China's first national list of intangible heritage."],"src":"https://www.ihchina.cn/project_details/9681.html","src2":"https://paper.people.com.cn/rmrb/html/2024-02/17/nw.D110000renmrb_20240217_2-06.htm","sz":{"l1":{"zh":"我的墙上有一张照片。","py":"Wǒ de qiáng shang yǒu yì zhāng zhàopiàn.","en":"There's a photo on my wall.","words":[["墙","qiáng","wall"],["一张","yì zhāng","one (flat thing)"],["照片","zhàopiàn","photo"]]},"l2":{"starter":"我房间的墙上贴着……","py":"Wǒ fángjiān de qiáng shang tiēzhe ……","en":"On my bedroom wall there's …","ideas":[["一张地图","yì zhāng dìtú","a map"],["朋友的照片","péngyou de zhàopiàn","photos of friends"],["一张海报","yì zhāng hǎibào","a poster"]]},"l3":{"zh":"我墙上什么都没挂，可是冰箱门上贴满了东西：明信片、外卖单，还有朋友家孩子画的画。","py":"Wǒ qiáng shang shénme dōu méi guà, kěshì bīngxiāng mén shang tiē mǎn le dōngxi: míngxìnpiàn, wàimài dān, hái yǒu péngyou jiā háizi huà de huà.","en":"There's nothing on my walls, but my fridge door is covered: postcards, takeaway menus, and a drawing by a friend's kid."}},"se":{"l1":{"en":"There's a photo on my wall.","zh":"我的墙上有一张照片。","words":[["wall","墙"],["photo","照片"]]},"l2":{"starter":"On my wall, there's …","zh":"我的墙上有……","ideas":[["a map","一张地图"],["a poster","一张海报"],["nothing at all","什么都没有"]]},"l3":{"en":"My walls are bare, but my fridge door is full: postcards, a takeaway menu and a drawing from a friend's kid.","zh":"我墙上光秃秃的，可冰箱门上满满的：明信片、一张外卖单，还有朋友家孩子画的画。"}},"ask":["你家墙上挂着什么？","What's on the walls at your place?"],"rep":{"id":"leila","nm":"Leila","c":["安曼","Amman"],"face":true,"orig":"zh","zh":"我的墙上挂着十二个菜单，都是我们工作室做的。看完这个，我想再挂一张年画。","py":"Wǒ de qiáng shang guàzhe shí'èr gè càidān, dōu shì wǒmen gōngzuòshì zuò de. Kàn wán zhège, wǒ xiǎng zài guà yì zhāng niánhuà.","en":"There are twelve menus on my wall — all made by our studio. After seeing this, I want to hang up a New Year print too.","learner":true,"translated":false},"from":"system","storypy":"Sūzhōu Táohuāwù de mùbǎn niánhuà, cóng Míngdài yìn dào jīntiān, yǒu sìbǎi duō nián le. Tā shì tàosè yìn de: yí kuài bǎn zhǐ yìn yì zhǒng yánsè, yì zhāng huà chángcháng yào kè shí jǐ kuài bǎn. 2006 nián, tā jìnle dì-yī pī guójiājí fēiyí mínglù.","askpy":"Nǐ jiā qiáng shang guàzhe shénme?","lunar":["腊月初十","12th lunar month, day 10","chūshí"]},{"d":4,"date":"2027-01-18","city":["蔚县","Yuxian"],"obj":["一张点彩窗花","A painted paper-cut window flower"],"story":["河北蔚县的窗花不是剪的，是刻的：艺人把一叠薄宣纸垫好，用小刻刀刻出花样，再一点一点染上颜色。2009 年，中国剪纸进了联合国教科文组织的人类非遗名录，蔚县是里面提到的产地之一。","Window flowers from Yuxian in Hebei aren't cut with scissors — they're carved. Artists stack thin sheets of xuan paper, carve the pattern with a small knife, then dab on colour bit by bit. In 2009 Chinese paper-cut joined UNESCO's list of the intangible heritage of humanity, with Yuxian named among its centres."],"src":"https://www.xinhuanet.com/2021-03/03/c_1127163029.htm","src2":"https://ich.unesco.org/en/RL/00219","sz":{"l1":{"zh":"我手不太巧，但是喜欢试试。","py":"Wǒ shǒu bú tài qiǎo, dànshì xǐhuan shìshi.","en":"I'm not very good with my hands, but I like to try.","words":[["手","shǒu","hand"],["巧","qiǎo","skilful"],["试试","shìshi","to give it a try"]]},"l2":{"starter":"最近我自己做了……","py":"Zuìjìn wǒ zìjǐ zuòle ……","en":"Lately I made … myself.","ideas":[["一顿饭","yí dùn fàn","a meal"],["一张卡片","yì zhāng kǎpiàn","a card"],["一个书架","yí gè shūjià","a bookshelf"]]},"l3":{"zh":"我上次自己动手，是给朋友做生日卡片。剪得歪歪扭扭的，可是她一直留着。","py":"Wǒ shàng cì zìjǐ dòngshǒu, shì gěi péngyou zuò shēngrì kǎpiàn. Jiǎn de wāiwāiniǔniǔ de, kěshì tā yìzhí liúzhe.","en":"The last time I made something myself was a birthday card for a friend. I cut it all wonky, but she's kept it ever since."}},"se":{"l1":{"en":"I'm not great with my hands, but I like trying.","zh":"我手不太巧，但是喜欢试试。","words":[["great with my hands","手巧"],["trying","试试"]]},"l2":{"starter":"Recently I made … myself.","zh":"最近我自己做了……","ideas":[["dinner","一顿饭"],["a card","一张卡片"],["a shelf","一个架子"]]},"l3":{"en":"The last thing I made by hand was a birthday card for a friend. It was all wonky, but she still has it.","zh":"我上次亲手做东西，是给朋友做生日卡片。歪歪扭扭的，可她到现在还留着。"}},"ask":["你手巧吗？最近自己做过什么？","Are you good with your hands? Made anything lately?"],"rep":{"id":"ruth","nm":"Ruth","c":["伦敦","London"],"face":true,"orig":"zh","zh":"我手不巧！我们也剪过窗花，上个星期二。我剪的「福」，最后断成两半了。","py":"Wǒ shǒu bù qiǎo! Wǒmen yě jiǎnguo chuānghuā, shàng gè xīngqī'èr. Wǒ jiǎn de 'fú', zuìhòu duàn chéng liǎng bàn le.","en":"I'm not good with my hands! We cut window flowers too — last Tuesday. My 'fu' ended up in two pieces.","learner":true,"translated":false},"from":"system","storypy":"Héběi Yùxiàn de chuānghuā bú shì jiǎn de, shì kè de: yìrén bǎ yì dié báo xuānzhǐ diàn hǎo, yòng xiǎo kèdāo kè chū huāyàng, zài yìdiǎn yìdiǎn rǎn shang yánsè. 2009 nián, Zhōngguó jiǎnzhǐ jìnle Liánhéguó Jiàokēwén Zǔzhī de rénlèi fēiyí mínglù, Yùxiàn shì lǐmiàn tídào de chǎndì zhī yī.","askpy":"Nǐ shǒu qiǎo ma? Zuìjìn zìjǐ zuòguo shénme?","lunar":["腊月十一","12th lunar month, day 11","shíyī"]},{"d":5,"date":"2027-01-19","city":["新加坡","Singapore"],"obj":["一盏羊花灯","A goat lantern"],"story":["每年春节前，新加坡牛车水的大街上空都挂满当年生肖的花灯。2014 年马年，正中间立着一匹十米高、四百公斤的马灯；2021 年牛年，路边排了 88 头牛。2027 年是丁未羊年。","Every year before Chinese New Year, the streets of Singapore's Chinatown are hung with lanterns of that year's zodiac animal. In the 2014 Year of the Horse, the centrepiece was a 10-metre, 400-kilogram horse; in the 2021 Year of the Ox, 88 oxen lined the road. 2027 is the Year of the Goat."],"src":"https://wonderwall.sg/places/12-years-of-chinatown-cny-lanterns","src2":"","sz":{"l1":{"zh":"我想知道我属什么。","py":"Wǒ xiǎng zhīdào wǒ shǔ shénme.","en":"I'd like to know what my zodiac animal is.","words":[["知道","zhīdào","to know"],["属","shǔ","to be born in the year of"]]},"l2":{"starter":"我属……","py":"Wǒ shǔ ……","en":"I was born in the Year of the …","ideas":[["羊","yáng","Goat"],["龙","lóng","Dragon"],["不知道","bù zhīdào","not sure",{"zh":"我还不知道我属什么呢。","py":"Wǒ hái bù zhīdào wǒ shǔ shénme ne.","en":"I don't know my animal yet."}]]},"l3":{"zh":"我属龙。朋友说属龙的人脾气大，我觉得不太准，我只是饿了的时候脾气大。","py":"Wǒ shǔ lóng. Péngyou shuō shǔ lóng de rén píqi dà, wǒ juéde bú tài zhǔn, wǒ zhǐshì è le de shíhou píqi dà.","en":"I'm a Dragon. My friends say Dragons have a temper — I don't think that's quite right. I only have a temper when I'm hungry."}},"se":{"l1":{"en":"I'd like to know my Chinese zodiac sign.","zh":"我想知道我属什么。","words":[["zodiac sign","生肖"],["know","知道"]]},"l2":{"starter":"I was born in the Year of the …","zh":"我属……","ideas":[["Goat","羊"],["Dragon","龙"],["Monkey","猴"]]},"l3":{"en":"I'm a Dragon. People say Dragons have a temper — not really true. I only get grumpy when I'm hungry.","zh":"我属龙。大家说属龙的脾气大，其实不准。我只是饿了才会脾气不好。"}},"ask":["你知道自己属什么吗？","Do you know your Chinese zodiac animal?"],"rep":{"id":"weijie","nm":"Wei Jie","c":["新加坡","Singapore"],"face":true,"orig":"en","zh":"我属兔。我妈每年都去跟生肖灯合张影，每年都说比去年的小。其实没有。","py":"Wǒ shǔ tù. Wǒ mā měi nián dōu qù gēn shēngxiào dēng hé zhāng yǐng, měi nián dōu shuō bǐ qùnián de xiǎo. Qíshí méiyǒu.","en":"I'm a Rabbit. My mum goes every year to take a photo with the zodiac lantern, and every year she says it's smaller than last year's. It isn't.","learner":false,"translated":true},"from":"system","storypy":"Měi nián Chūnjié qián, Xīnjiāpō Niúchēshuǐ de dàjiē shàngkōng dōu guà mǎn dāngnián shēngxiào de huādēng. 2014 nián mǎ nián, zhèng zhōngjiān lìzhe yì pǐ shí mǐ gāo, sìbǎi gōngjīn de mǎ dēng; 2021 nián niú nián, lùbiān páile 88 tóu niú. 2027 nián shì Dīngwèi yáng nián.","askpy":"Nǐ zhīdào zìjǐ shǔ shénme ma?","lunar":["腊月十二","12th lunar month, day 12","shí'èr"]},{"d":6,"date":"2027-01-20","city":["汕头","Shantou"],"obj":["一对英歌槌","A pair of Yingge sticks"],"story":["英歌舞流传在广东汕头潮阳、潮南和揭阳普宁一带：几十个人画着脸谱，两手各拿一根短木槌，边跳边敲。2006 年它进了第一批国家级非遗；这几年春节，汕头的英歌队还被请到法国、德国、新加坡、马来西亚去演。","Yingge dance comes from Chaoyang and Chaonan in Shantou and Puning in Jieyang, Guangdong: dozens of dancers with painted faces, a short wooden stick in each hand, striking them as they dance. It was on China's first national intangible-heritage list in 2006, and in recent Chinese New Years Shantou troupes have been invited to perform in France, Germany, Singapore and Malaysia."],"src":"https://www.news.cn/local/20250123/37f77efb4b32420ca961987a2a98f5bf/c.html","src2":"https://www.news.cn/culture/20250206/6cbcdc36698b4ec7bf55c0c77d77a388/c.html","sz":{"l1":{"zh":"我喜欢看现场表演。","py":"Wǒ xǐhuan kàn xiànchǎng biǎoyǎn.","en":"I like watching live performances.","words":[["现场","xiànchǎng","live, on the spot"],["表演","biǎoyǎn","performance"]]},"l2":{"starter":"我最喜欢看……","py":"Wǒ zuì xǐhuan kàn ……","en":"What I like watching most is …","ideas":[["跳舞","tiàowǔ","dance"],["演唱会","yǎnchànghuì","concerts"],["街头表演","jiētóu biǎoyǎn","street performers"]]},"l3":{"zh":"我看过一次打鼓表演，坐在第一排，鼓声大得我心跳都跟着快了。","py":"Wǒ kànguo yí cì dǎ gǔ biǎoyǎn, zuò zài dì-yī pái, gǔshēng dà de wǒ xīntiào dōu gēnzhe kuài le.","en":"I once saw a drumming show from the front row. The drums were so loud my heart started racing along with them."}},"se":{"l1":{"en":"I love watching live shows.","zh":"我很喜欢看现场表演。","words":[["live","现场的"],["shows","表演"]]},"l2":{"starter":"My favourite thing to watch is …","zh":"我最喜欢看……","ideas":[["dance","跳舞"],["live music","现场音乐"],["street performers","街头表演"]]},"l3":{"en":"I once sat in the front row at a drumming show. It was so loud my heart was racing with the beat.","zh":"我有一次坐在打鼓表演的第一排，声音大得我的心跳都跟着鼓点跑。"}},"ask":["你喜欢看什么表演？","What kind of shows do you like to watch?"],"rep":{"id":"pong","nm":"Pong 阿鹏","c":["曼谷","Bangkok"],"face":true,"orig":"zh","zh":"我……喜欢看……跳舞，有鼓的。英歌……我阿嬷，潮州人。她小时候……胶己看过。","py":"Wǒ…… xǐhuan kàn…… tiàowǔ, yǒu gǔ de. Yīnggē…… wǒ āmā, Cháozhōu rén. Tā xiǎoshíhou…… (潮州话 ka-kī) kànguo.","en":"I… like watching… dance, with drums. Yingge… my grandma, Teochew. When she was little… she saw it herself. (胶己 is Teochew for 'oneself'.)","learner":true,"translated":false},"from":"system","storypy":"Yīnggē wǔ liúchuán zài Guǎngdōng Shàntóu Cháoyáng, Cháonán hé Jiēyáng Pǔníng yídài: jǐ shí gè rén huàzhe liǎnpǔ, liǎng shǒu gè ná yì gēn duǎn mùchuí, biān tiào biān qiāo. 2006 nián tā jìnle dì-yī pī guójiājí fēiyí; zhè jǐ nián Chūnjié, Shàntóu de Yīnggē duì hái bèi qǐng dào Fǎguó, Déguó, Xīnjiāpō, Mǎláixīyà qù yǎn.","askpy":"Nǐ xǐhuan kàn shénme biǎoyǎn?","lunar":["腊月十三","12th lunar month, day 13","shísān"]},{"d":7,"date":"2027-01-21","city":["自贡","Zigong"],"obj":["一盏恐龙灯","A dinosaur lantern"],"story":["四川自贡的灯会，说是从唐代新年点灯的习惯来的，是国家级非遗。自贡也是有名的恐龙化石产地，灯会里常有一整片恐龙灯。从 1988 年在北京北海第一次走出四川，到现在，自贡的灯去过全球 80 多个国家和地区、500 多座城市。","Zigong's lantern festival in Sichuan is said to come from a Tang-dynasty custom of lighting lamps at New Year, and it's on China's national intangible-heritage list. Zigong is also famous for dinosaur fossils, so its fairs often have whole herds of dinosaur lanterns. Since first leaving Sichuan for Beihai Park in Beijing in 1988, Zigong's lanterns have travelled to more than 80 countries and regions and 500-plus cities."],"src":"https://www.news.cn/local/20260124/aaa4bec897644dbc8997b3b4719bc439/c.html","src2":"https://www.ihchina.cn/project_details/9687/","sz":{"l1":{"zh":"晚上我喜欢出去走走。","py":"Wǎnshang wǒ xǐhuan chūqu zǒuzou.","en":"I like going out for a walk in the evening.","words":[["晚上","wǎnshang","evening"],["走走","zǒuzou","to take a stroll"]]},"l2":{"starter":"晚上我喜欢去……走走。","py":"Wǎnshang wǒ xǐhuan qù …… zǒuzou.","en":"In the evening I like a walk …","ideas":[["河边","hébiān","by the river"],["公园","gōngyuán","in the park"],["家附近","jiā fùjìn","near home"]]},"l3":{"zh":"我最喜欢天刚黑的时候出门，路灯一盏一盏亮起来，人也不多，走半个小时，心就静下来了。","py":"Wǒ zuì xǐhuan tiān gāng hēi de shíhou chūmén, lùdēng yì zhǎn yì zhǎn liàng qǐlái, rén yě bù duō, zǒu bàn gè xiǎoshí, xīn jiù jìng xiàlái le.","en":"My favourite time to go out is just after dark: the streetlights come on one by one, it's not crowded, and after half an hour of walking my mind goes quiet."}},"se":{"l1":{"en":"I like going for a walk in the evening.","zh":"晚上我喜欢出去走走。","words":[["going for a walk","出去走走"],["evening","晚上"]]},"l2":{"starter":"In the evening, I like walking …","zh":"晚上我喜欢去……走走。","ideas":[["by the river","河边"],["in the park","公园"],["around my street","家附近"]]},"l3":{"en":"My favourite time is just after dark — the streetlights come on one by one, it's quiet, and half an hour later my head is clear.","zh":"我最喜欢天刚黑的时候：路灯一盏盏亮起来，很安静，走半个小时，脑子就清楚了。"}},"ask":["晚上出门，你爱去哪儿走走？","When you go out in the evening, where do you like to walk?"],"rep":{"id":"yifan","nm":"何一帆","c":["西安","Xi'an"],"face":true,"orig":"zh","zh":"晚上我爱在城墙根下走走，路灯一开，美得很。自贡那么大的恐龙灯，咋扎出来的？","py":"Wǎnshang wǒ ài zài chéngqiáng gēn xià zǒuzou, lùdēng yì kāi, měi de hěn. Zìgòng nàme dà de kǒnglóng dēng, zǎ zā chūlái de?","en":"In the evening I like walking at the foot of the city wall — once the streetlights come on, it's gorgeous. How on earth do they build dinosaur lanterns that big in Zigong?","learner":"en","translated":false},"from":"system","storypy":"Sìchuān Zìgòng de dēnghuì, shuō shì cóng Tángdài xīnnián diǎn dēng de xíguàn lái de, shì guójiājí fēiyí. Zìgòng yě shì yǒumíng de kǒnglóng huàshí chǎndì, dēnghuì lǐ cháng yǒu yì zhěng piàn kǒnglóng dēng. Cóng 1988 nián zài Běijīng Běihǎi dì-yī cì zǒu chū Sìchuān, dào xiànzài, Zìgòng de dēng qùguo quánqiú 80 duō gè guójiā hé dìqū, 500 duō zuò chéngshì.","askpy":"Wǎnshang chūmén, nǐ ài qù nǎr zǒuzou?","lunar":["腊月十四","12th lunar month, day 14","shísì"]},{"d":8,"date":"2027-01-22","city":["广州","Guangzhou"],"obj":["一张回家的火车票","A train ticket home"],"story":["春运常被叫作世界上最大的一年一度的人口迁移。2026 年春运从 2 月 2 日开始，节前 15 天、节后 25 天，一共 40 天；照这个算法，2027 年的春运差不多从 1 月 22 日开始。广州南站 2025 年全年到发旅客 1.75 亿人次，是全国最忙的高铁站。","Chunyun, the Spring Festival travel rush, is often called the largest annual human migration in the world. In 2026 it began on 2 February — 15 days before the festival and 25 after, 40 days in all. By the same count, the 2027 rush begins around 22 January. Guangzhou South station handled 175 million arrivals and departures in 2025, the most of any high-speed rail station in China."],"src":"https://en.wikipedia.org/wiki/Chunyun","src2":"https://news.dayoo.com/guangzhou/202602/09/139995_54926819.htm","sz":{"l1":{"zh":"我上次坐了很久的火车。","py":"Wǒ shàng cì zuòle hěn jiǔ de huǒchē.","en":"Last time, I was on a train for ages.","words":[["上次","shàng cì","last time"],["很久","hěn jiǔ","a long time"],["火车","huǒchē","train"]]},"l2":{"starter":"我上次出远门，是去……","py":"Wǒ shàng cì chū yuǎnmén, shì qù ……","en":"The last time I took a long trip, it was to …","ideas":[["看家人","kàn jiārén","see family"],["参加婚礼","cānjiā hūnlǐ","go to a wedding"],["见老朋友","jiàn lǎo péngyou","see an old friend"]]},"l3":{"zh":"我最长的一次是坐了十几个小时的夜车。睡不着，就看窗外，天亮的时候正好过一条大河。","py":"Wǒ zuì cháng de yí cì shì zuòle shí jǐ gè xiǎoshí de yèchē. Shuì bù zháo, jiù kàn chuāng wài, tiān liàng de shíhou zhènghǎo guò yì tiáo dà hé.","en":"My longest was an overnight train of more than ten hours. I couldn't sleep, so I watched out of the window — just as it got light, we crossed a big river."}},"se":{"l1":{"en":"The last time I took a long trip, it was by train.","zh":"我上次出远门，坐的是火车。","words":[["a long trip","出远门"],["by train","坐火车"]]},"l2":{"starter":"The last long trip I took was to …","zh":"我上次出远门，是去……","ideas":[["see family","看家人"],["a wedding","参加婚礼"],["see an old friend","见老朋友"]]},"l3":{"en":"My longest trip was an overnight train — over ten hours. I couldn't sleep, so I watched the window, and at dawn we crossed a huge river.","zh":"我最长的一次是坐夜车，十几个小时。睡不着，就一直看窗外，天亮时火车正好过一条大河。"}},"ask":["你上一次出远门，是去哪儿？","Where were you going the last time you took a long trip?"],"rep":{"id":"tobi","nm":"Tobi","c":["拉各斯","Lagos"],"face":true,"orig":"zh","zh":"我上次出远门，是回老家过圣诞了，路上堵了半天。我们的中国同事说，春运更挤。","py":"Wǒ shàng cì chū yuǎnmén, shì huí lǎojiā guò Shèngdàn le, lùshang dǔle bàntiān. Wǒmen de Zhōngguó tóngshì shuō, chūnyùn gèng jǐ.","en":"The last time I went far, I went back to my home town for Christmas — stuck in traffic for ages. Our Chinese colleagues say Chunyun is even more packed.","learner":true,"translated":false},"from":"system","storypy":"Chūnyùn cháng bèi jiàozuò shìjiè shang zuì dà de yì nián yí dù de rénkǒu qiānyí. 2026 nián chūnyùn cóng 2 yuè 2 rì kāishǐ, jié qián 15 tiān, jié hòu 25 tiān, yígòng 40 tiān; zhào zhège suànfǎ, 2027 nián de chūnyùn chàbuduō cóng 1 yuè 22 rì kāishǐ. Guǎngzhōu Nán Zhàn 2025 nián quánnián dào fā lǚkè 1.75 yì réncì, shì quánguó zuì máng de gāotiě zhàn.","askpy":"Nǐ shàng yí cì chū yuǎnmén, shì qù nǎr?","lunar":["腊月十五","12th lunar month, day 15","shíwǔ"]},{"d":9,"date":"2027-01-23","city":["旧金山","San Francisco"],"obj":["一个金龙头","A golden dragon head"],"story":["1860 年，旧金山的报纸就写过唐人街街上的舞龙。现在旧金山的春节游行被称为亚洲以外最大的春节游行，压轴的是一条 289 英尺（大约 88 米）长的金龙。","As early as 1860, San Francisco newspapers reported dragon dancers in the streets of Chinatown. Today its Chinese New Year Parade is billed as the biggest outside Asia, and the finale is a golden dragon 289 feet (about 88 metres) long."],"src":"https://www.axios.com/local/san-francisco/2024/02/23/lunar-new-year-parades-chinatown-origin-story","src2":"https://www.sfpublicpress.org/new-parade-dragon-carries-on-local-legacy-dating-back-nearly-175-years/","sz":{"l1":{"zh":"人太多的地方，我不太喜欢。","py":"Rén tài duō de dìfang, wǒ bú tài xǐhuan.","en":"I don't really like places with too many people.","words":[["人太多","rén tài duō","too crowded"],["地方","dìfang","place"],["不太","bú tài","not really"]]},"l2":{"starter":"人多的时候，我会……","py":"Rén duō de shíhou, wǒ huì ……","en":"When it's crowded, I …","ideas":[["站在后面看","zhàn zài hòumiàn kàn","watch from the back"],["挤到前面去","jǐ dào qiánmiàn qù","squeeze to the front"],["早点儿回家","zǎo diǎnr huí jiā","go home early"]]},"l3":{"zh":"热闹我喜欢看，可是只看一会儿就够了。最好是找个高一点儿的地方，看得见，又不用挤。","py":"Rènao wǒ xǐhuan kàn, kěshì zhǐ kàn yíhuìr jiù gòu le. Zuì hǎo shì zhǎo gè gāo yìdiǎnr de dìfang, kàn de jiàn, yòu bú yòng jǐ.","en":"I like watching the buzz, but a little while is enough. Best is to find somewhere a bit higher — you can see, and you don't have to squeeze."}},"se":{"l1":{"en":"I'm not a big fan of crowds.","zh":"我不太喜欢人多的地方。","words":[["a big fan of","很喜欢"],["crowds","人群"]]},"l2":{"starter":"When it's crowded, I usually …","zh":"人多的时候，我一般……","ideas":[["watch from the back","站在后面看"],["push to the front","挤到前面"],["go home early","早点回家"]]},"l3":{"en":"I like the buzz, but only for a bit. Best spot is somewhere a little higher — you can see everything and nobody's elbow is in your face.","zh":"热闹我喜欢，但看一会儿就够了。最好站得高一点：什么都看得见，也不会被人挤来挤去。"}},"ask":["人很多的热闹，你喜欢吗？","Do you like big, noisy crowds?"],"rep":null,"from":"system","storypy":"1860 nián, Jiùjīnshān de bàozhǐ jiù xiěguo Tángrénjiē jiē shang de wǔ lóng. Xiànzài Jiùjīnshān de Chūnjié yóuxíng bèi chēngwéi Yàzhōu yǐwài zuì dà de Chūnjié yóuxíng, yāzhòu de shì yì tiáo 289 yīngchǐ (dàyuē 88 mǐ) cháng de jīn lóng.","askpy":"Rén hěn duō de rènao, nǐ xǐhuan ma?","lunar":["腊月十六","12th lunar month, day 16","shíliù"]},{"d":10,"date":"2027-01-24","city":["重庆","Chongqing"],"obj":["一竿香肠和腊肉","Sausages and cured pork on a pole"],"story":["腊月里，重庆人家的阳台上挂满了香肠和腊肉。城口县的老腊肉要用青冈木熏上好几个月，已经是重庆市级非遗。「腊肉」的「腊」，就是腊月的腊：冬天农闲，正好腌肉、风干。","In the twelfth lunar month, Chongqing balconies fill up with sausages and cured pork. In Chengkou county the old-style larou is smoked over oak for months and is on Chongqing's own intangible-heritage list. The la in larou is the la of layue, the twelfth month: winter was the quiet time on farms, just right for salting and drying meat."],"src":"https://www.news.cn/local/2023-01/06/c_1129260577.htm","src2":"https://cn.chinadaily.com.cn/a/202001/02/WS5e0d5951a31099ab995f4e1b.html","sz":{"l1":{"zh":"冬天我特别想吃热乎的东西。","py":"Dōngtiān wǒ tèbié xiǎng chī rèhū de dōngxi.","en":"In winter I really crave something warm.","words":[["冬天","dōngtiān","winter"],["特别","tèbié","especially"],["热乎","rèhū","nice and warm"]]},"l2":{"starter":"冬天我们家一定会吃……","py":"Dōngtiān wǒmen jiā yídìng huì chī ……","en":"In winter, my family always has …","ideas":[["一锅汤","yì guō tāng","a big pot of soup"],["烤土豆","kǎo tǔdòu","roast potatoes"],["火锅","huǒguō","hotpot"]]},"l3":{"zh":"我们家冬天没有什么特别的菜，可是我妈会多做一锅汤，放在炉子上，谁回来谁就盛一碗。","py":"Wǒmen jiā dōngtiān méiyǒu shénme tèbié de cài, kěshì wǒ mā huì duō zuò yì guō tāng, fàng zài lúzi shang, shéi huílái shéi jiù chéng yì wǎn.","en":"We don't have a special winter dish, but my mum makes an extra pot of soup and leaves it on the stove — whoever comes home ladles out a bowl."}},"se":{"l1":{"en":"In winter, I always want something warm and filling.","zh":"冬天我总想吃点热乎、管饱的。","words":[["warm","热乎的"],["filling","管饱的"]]},"l2":{"starter":"In winter, my family always has …","zh":"冬天我们家一定会吃……","ideas":[["a big pot of soup","一锅汤"],["roast potatoes","烤土豆"],["hotpot","火锅"]]},"l3":{"en":"We don't have a special winter dish, but my mum always makes an extra pot of soup — whoever gets home first gets the first bowl.","zh":"我们家冬天没什么特别的菜，可我妈总会多煮一锅汤，谁先回家谁先喝第一碗。"}},"ask":["冬天，你家有什么一定要吃的？","Is there something your family always eats in winter?"],"rep":{"id":"owen","nm":"Owen","c":["纽约","New York"],"face":true,"orig":"zh","zh":"我们家冬天一定要吃辣椒炖肉，我爸做的，一锅吃三天。在成都那两年，楼下的嬢嬢腊月在阳台上挂香肠，还送了我一串。巴适！","py":"Wǒmen jiā dōngtiān yídìng yào chī làjiāo dùn ròu, wǒ bà zuò de, yì guō chī sān tiān. Zài Chéngdū nà liǎng nián, lóu xià de niángniang làyuè zài yángtái shang guà xiāngcháng, hái sòngle wǒ yí chuàn. Bāshì!","en":"In our family, winter means chili — my dad's, and one pot lasts three days. In my two years in Chengdu, the auntie downstairs hung sausages on her balcony every winter and gave me a string. So good!","learner":true,"translated":false},"from":"system","storypy":"Làyuè lǐ, Chóngqìng rénjiā de yángtái shang guà mǎnle xiāngcháng hé làròu. Chéngkǒu Xiàn de lǎo làròu yào yòng qīnggāng mù xūn shang hǎo jǐ gè yuè, yǐjīng shì Chóngqìng shìjí fēiyí. 'Làròu' de 'là', jiù shì làyuè de 'là': dōngtiān nóngxián, zhènghǎo yān ròu, fēnggān.","askpy":"Dōngtiān, nǐ jiā yǒu shénme yídìng yào chī de?","lunar":["腊月十七","12th lunar month, day 17","shíqī"]},{"d":11,"date":"2027-01-25","city":["台北","Taipei"],"obj":["一盒年货","A box of New Year treats"],"story":["台北迪化街的年货大街从 1996 年办起，到 2025 年是第 30 年。这条老街平时就卖南北货、中药和干货，过年前一个月挤满了买糖果、坚果、腊味的人。2025 年起，它还是全台第一条无烟年货大街。","Taipei's New Year market on Dihua Street started in 1996; 2025 was its thirtieth year. The old street sells dried goods and herbal medicine all year, and in the month before New Year it's packed with people buying sweets, nuts and cured meats. Since 2025 it has also been Taiwan's first smoke-free New Year market."],"src":"https://www.businesstoday.com.tw/article/category/183030/post/202501120011/","src2":"https://udn.com/news/story/123907/9307949","sz":{"l1":{"zh":"过节前，我会去超市买很多零食。","py":"Guò jié qián, wǒ huì qù chāoshì mǎi hěn duō língshí.","en":"Before a holiday, I go to the supermarket and buy loads of snacks.","words":[["过节","guò jié","to celebrate a holiday"],["超市","chāoshì","supermarket"],["零食","língshí","snacks"]]},"l2":{"starter":"过节前，我一定会买……","py":"Guò jié qián, wǒ yídìng huì mǎi ……","en":"Before a holiday, I always buy …","ideas":[["水果","shuǐguǒ","fruit"],["新衣服","xīn yīfu","new clothes"],["给家人的礼物","gěi jiārén de lǐwù","presents for my family"]]},"l3":{"zh":"我不太爱逛街，可是很喜欢逛菜市场。过节前那几天最好玩，每个摊子都让你尝一口。","py":"Wǒ bú tài ài guàngjiē, kěshì hěn xǐhuan guàng càishìchǎng. Guò jié qián nà jǐ tiān zuì hǎowán, měi gè tānzi dōu ràng nǐ cháng yì kǒu.","en":"I'm not into shopping, but I love wandering round a food market. The days before a holiday are the best — every stall lets you taste something."}},"se":{"l1":{"en":"Before a holiday, I stock up on snacks.","zh":"过节前，我会囤很多零食。","words":[["stock up on","囤"],["snacks","零食"]]},"l2":{"starter":"Before a holiday, I always buy …","zh":"过节前，我一定会买……","ideas":[["fruit","水果"],["new clothes","新衣服"],["presents for my family","给家人的礼物"]]},"l3":{"en":"I'm not a shopper, but I love a food market — especially the days before a holiday, when every stall wants you to try something.","zh":"我不爱逛街，但很爱逛菜市场，尤其是过节前那几天，每个摊子都想让你尝一口。"}},"ask":["过节前，你会去哪儿买东西？","Before a holiday, where do you go shopping?"],"rep":{"id":"mei","nm":"Mei","c":["台北","Taipei"],"face":true,"orig":"zh","zh":"迪化街我去年有去，人超多！试吃到饱，最后只买了一包乌鱼子给阿嬷。","py":"Díhuà Jiē wǒ qùnián yǒu qù, rén chāo duō! Shìchī dào bǎo, zuìhòu zhǐ mǎile yì bāo wūyúzǐ gěi āmā.","en":"I went to Dihua Street last year — sooo crowded! I filled up on free samples and in the end only bought a pack of mullet roe for my grandma (a-má in Taiwanese).","learner":false,"translated":false},"from":"system","storypy":"Táiběi Díhuà Jiē de niánhuò dàjiē cóng 1996 nián bàn qǐ, dào 2025 nián shì dì 30 nián. Zhè tiáo lǎo jiē píngshí jiù mài nánběihuò, zhōngyào hé gānhuò, guònián qián yí gè yuè jǐ mǎnle mǎi tángguǒ, jiānguǒ, làwèi de rén. 2025 nián qǐ, tā hái shì quán Tái dì-yī tiáo wú yān niánhuò dàjiē.","askpy":"Guò jié qián, nǐ huì qù nǎr mǎi dōngxi?","lunar":["腊月十八","12th lunar month, day 18","shíbā"]},{"d":12,"date":"2027-01-26","city":["伦敦","London"],"obj":["一串红灯笼","A string of red lanterns"],"story":["伦敦唐人街华人协会每年在特拉法加广场和唐人街办春节庆祝，被称为亚洲以外最大的春节活动之一。2016 年那一届，主办方说来了七十多万人。","Every year the London Chinatown Chinese Association runs Chinese New Year celebrations in Trafalgar Square and Chinatown — billed as one of the biggest outside Asia. In 2016 the organisers said more than 700,000 people came."],"src":"https://www.london.gov.uk/press-releases/mayoral/londons-chinese-new-year-celebrations","src2":"https://prnewswire.com/news-releases/700000-celebrate-chinese-new-year-in-trafalgar-square-millions-around-the-world-join-in-300221275.html","sz":{"l1":{"zh":"我们城市有一条唐人街。","py":"Wǒmen chéngshì yǒu yì tiáo Tángrénjiē.","en":"There's a Chinatown in my city.","words":[["城市","chéngshì","city"],["一条","yì tiáo","one (for streets)"],["唐人街","Tángrénjiē","Chinatown"]]},"l2":{"starter":"我们那儿的唐人街……","py":"Wǒmen nàr de Tángrénjiē ……","en":"The Chinatown where I live is …","ideas":[["很小","hěn xiǎo","tiny"],["总是很热闹","zǒngshì hěn rènao","always busy"],["没有","méiyǒu","there isn't one",{"zh":"我们那儿没有唐人街。","py":"Wǒmen nàr méiyǒu Tángrénjiē.","en":"There's no Chinatown where I live."}]]},"l3":{"zh":"我们那儿的唐人街就两条街，可是我每次去都要买一盒蛋挞，坐在路边吃完再走。","py":"Wǒmen nàr de Tángrénjiē jiù liǎng tiáo jiē, kěshì wǒ měi cì qù dōu yào mǎi yì hé dàntà, zuò zài lùbiān chī wán zài zǒu.","en":"Our Chinatown is just two streets, but every time I go I buy a box of egg tarts and eat them by the road before I leave."}},"se":{"l1":{"en":"There's a Chinatown in my city.","zh":"我住的城市有唐人街。","words":[["Chinatown","唐人街"],["city","城市"]]},"l2":{"starter":"The Chinatown near me is …","zh":"我们那儿的唐人街……","ideas":[["tiny","很小"],["always busy","总是很热闹"],["there isn't one","没有",{"en":"There's no Chinatown near me.","zh":"我们那儿没有唐人街。"}]]},"l3":{"en":"Our Chinatown is only two streets, but I always buy a box of egg tarts and eat them on the kerb before I go home.","zh":"我们那儿的唐人街只有两条街，可我每次都买一盒蛋挞，坐在路边吃完才回家。"}},"ask":["你住的城市有唐人街吗？","Is there a Chinatown in your city?"],"rep":{"id":"oliver","nm":"Oliver","c":["伦敦","London"],"face":true,"orig":"en","zh":"有啊，就在市中心。说来好笑，我在伦敦住了一辈子，去年才第一次去特拉法加广场看春节。还行。冻死了，但还行。","py":"Yǒu a, jiù zài shì zhōngxīn. Shuō lái hǎoxiào, wǒ zài Lúndūn zhùle yíbèizi, qùnián cái dì-yī cì qù Tèlāfǎjiā Guǎngchǎng kàn Chūnjié. Hái xíng. Dòng sǐ le, dàn hái xíng.","en":"Yes — right in the middle of town. Funny thing is, I've lived in London my whole life and only went to the Trafalgar Square New Year last year. Not bad. Freezing, but not bad.","learner":false,"translated":true},"from":"system","storypy":"Lúndūn Tángrénjiē Huárén Xiéhuì měi nián zài Tèlāfǎjiā Guǎngchǎng hé Tángrénjiē bàn Chūnjié qìngzhù, bèi chēngwéi Yàzhōu yǐwài zuì dà de Chūnjié huódòng zhī yī. 2016 nián nà yí jiè, zhǔbànfāng shuō láile qīshí duō wàn rén.","askpy":"Nǐ zhù de chéngshì yǒu Tángrénjiē ma?","lunar":["腊月十九","12th lunar month, day 19","shíjiǔ"]},{"d":13,"date":"2027-01-27","city":["宁波","Ningbo"],"obj":["几条水磨年糕","Ningbo rice cakes"],"story":["宁波人过年要吃年糕，「年糕」听起来像「年年高」。慈城年糕的老做法：米泡软、磨成粉、蒸熟，再一下一下舂打，最后用木模印出花样。慈城做年糕的老师傅里，有人是浙江省非遗慈城年糕的传承人。","In Ningbo, New Year means niangao — rice cake — because niangao sounds like niannian gao, 'higher every year'. The old Cicheng way: soak the rice, grind it, steam it, pound it again and again, then press a pattern into it with a wooden mould. Some of Cicheng's rice-cake masters are officially recognised bearers of this Zhejiang intangible heritage."],"src":"https://www.thepaper.cn/newsDetail_forward_11351362","src2":"","sz":{"l1":{"zh":"小时候，我喜欢在厨房帮忙。","py":"Xiǎoshíhou, wǒ xǐhuan zài chúfáng bāngmáng.","en":"As a kid, I liked helping in the kitchen.","words":[["小时候","xiǎoshíhou","as a child"],["厨房","chúfáng","kitchen"],["帮忙","bāngmáng","to help"]]},"l2":{"starter":"小时候过节，我们家会一起……","py":"Xiǎoshíhou guò jié, wǒmen jiā huì yìqǐ ……","en":"When I was little, at holidays my family would … together.","ideas":[["做蛋糕","zuò dàngāo","bake a cake"],["包饺子","bāo jiǎozi","make dumplings"],["看电影","kàn diànyǐng","watch a film"]]},"l3":{"zh":"我们家过节最重要的事，就是一起做一个大蛋糕。每次都做得不太好看，但是大家都抢着吃。","py":"Wǒmen jiā guò jié zuì zhòngyào de shì, jiù shì yìqǐ zuò yí gè dà dàngāo. Měi cì dōu zuò de bú tài hǎokàn, dànshì dàjiā dōu qiǎngzhe chī.","en":"The most important holiday thing in our family is making one big cake together. It never looks great, but everyone fights over it."}},"se":{"l1":{"en":"As a kid, I loved helping in the kitchen.","zh":"小时候，我很喜欢在厨房帮忙。","words":[["As a kid","小时候"],["helping","帮忙"]]},"l2":{"starter":"At holidays, my family used to … together.","zh":"小时候过节，我们家会一起……","ideas":[["bake a cake","做蛋糕"],["make dumplings","包饺子"],["watch a film","看电影"]]},"l3":{"en":"Our big holiday thing was making one huge cake together. It never looked good, but it was always gone in minutes.","zh":"我们家过节最大的事，就是一起做一个超大的蛋糕。从来不好看，可几分钟就被吃光了。"}},"ask":["小时候过节，你们家会一起做什么？","As a kid, what did your family do together at holidays?"],"rep":{"id":"chen_nl","nm":"Chen 陈","c":["阿姆斯特丹","Amsterdam"],"face":true,"orig":"en","zh":"小时候过年，我跟我妈一起做年糕——其实是她做，我捏小兔子。现在在阿姆斯特丹，我只买得到冷冻的。","py":"Xiǎoshíhou guònián, wǒ gēn wǒ mā yìqǐ zuò niángāo —— qíshí shì tā zuò, wǒ niē xiǎo tùzi. Xiànzài zài Āmǔsītèdān, wǒ zhǐ mǎi de dào lěngdòng de.","en":"At New Year when I was little, my mum and I made nian gao together — well, she made it and I shaped little rabbits. Now in Amsterdam I can only buy the frozen kind.","learner":"en","translated":true},"from":"system","storypy":"Níngbō rén guònián yào chī niángāo, 'niángāo' tīng qǐlái xiàng 'niánnián gāo'. Cíchéng niángāo de lǎo zuòfǎ: mǐ pào ruǎn, mò chéng fěn, zhēng shú, zài yí xià yí xià chōng dǎ, zuìhòu yòng mù mú yìn chū huāyàng. Cíchéng zuò niángāo de lǎo shīfu lǐ, yǒu rén shì Zhèjiāng Shěng fēiyí Cíchéng niángāo de chuánchéngrén.","askpy":"Xiǎoshíhou guò jié, nǐmen jiā huì yìqǐ zuò shénme?","lunar":["腊月二十","12th lunar month, day 20","èrshí"]},{"d":14,"date":"2027-01-28","city":["佛山","Foshan"],"obj":["一个醒狮头","A southern lion head"],"story":["南狮，也叫醒狮，是从北狮演变出来、发源于广东佛山的狮舞，后来传到两广、港澳和海外的华人社区。清末有人把寓意吉祥的「瑞狮」改叫「醒狮」，意思是让中华醒过来。2006 年，广东醒狮进了第一批国家级非遗名录。","The southern lion, or xingshi ('waking lion'), grew out of the northern lion dance in Foshan, Guangdong, and spread through Guangdong, Guangxi, Hong Kong, Macau and Chinese communities overseas. In the late Qing, people renamed the 'auspicious lion' the 'waking lion' — a call for China to wake up. Guangdong lion dance was on the first national intangible-heritage list in 2006."],"src":"https://www.ihchina.cn/ccr_detail/1415.html","src2":"","sz":{"l1":{"zh":"我想学一种新的运动。","py":"Wǒ xiǎng xué yì zhǒng xīn de yùndòng.","en":"I'd like to learn a new sport.","words":[["一种","yì zhǒng","a kind of"],["新","xīn","new"],["运动","yùndòng","sport, exercise"]]},"l2":{"starter":"我坚持……了好几年，很累，可是很开心。","py":"Wǒ jiānchí …… le hǎo jǐ nián, hěn lèi, kěshì hěn kāixīn.","en":"I kept up … for years — tiring, but fun.","ideas":[["跳舞","tiàowǔ","dancing"],["跑步","pǎobù","running"],["练武术","liàn wǔshù","martial arts"]]},"l3":{"zh":"我上大学的时候在舞蹈队待过，每天晚上练两个小时，腿疼得连下楼梯都费劲，可那一年是我最开心的。","py":"Wǒ shàng dàxué de shíhou zài wǔdǎo duì dāiguo, měi tiān wǎnshang liàn liǎng gè xiǎoshí, tuǐ téng de lián xià lóutī dōu fèijìn, kě nà yì nián shì wǒ zuì kāixīn de.","en":"At uni I was in a dance group. Two hours of practice every night — my legs hurt so much even going downstairs was hard, but that was my happiest year."}},"se":{"l1":{"en":"I'd like to try a new sport.","zh":"我想试一种新的运动。","words":[["try","试"],["sport","运动"]]},"l2":{"starter":"I've kept up … — tiring, but fun.","zh":"我坚持过……，很累，可是很开心。","ideas":[["dance","跳舞"],["running","跑步"],["martial arts","武术"]]},"l3":{"en":"At uni I joined a dance group. Two hours every night — my legs ached on the stairs, but it was the best year I had.","zh":"上大学时我在舞蹈队，每晚练两个小时，下楼梯腿都疼，可那是我过得最开心的一年。"}},"ask":["你练过什么很累、但是很开心的东西？","Have you ever trained for something tiring but fun?"],"rep":{"id":"kwame","nm":"Kwame","c":["阿克拉","Accra"],"face":true,"orig":"en","zh":"Chale——我学了两年打鼓，每个星期手都疼，可是很开心。醒狮的鼓点？我真想拿来做采样。","py":"Chale —— wǒ xuéle liǎng nián dǎ gǔ, měi gè xīngqī shǒu dōu téng, kěshì hěn kāixīn. Xǐngshī de gǔdiǎn? Wǒ zhēn xiǎng ná lái zuò cǎiyàng.","en":"Chale — two years of drumming lessons. My hands hurt every week, but I loved it. Those lion-dance drums? I'd sample that in a heartbeat.","learner":false,"translated":true},"from":"system","storypy":"Nánshī, yě jiào xǐngshī, shì cóng běishī yǎnbiàn chūlái, fāyuán yú Guǎngdōng Fóshān de shīwǔ, hòulái chuán dào Liǎng Guǎng, Gǎng Ào hé hǎiwài de huárén shèqū. Qīngmò yǒu rén bǎ yùyì jíxiáng de 'ruìshī' gǎi jiào 'xǐngshī', yìsi shì ràng Zhōnghuá xǐng guòlái. 2006 nián, Guǎngdōng xǐngshī jìnle dì-yī pī guójiājí fēiyí mínglù.","askpy":"Nǐ liànguo shénme hěn lèi, dànshì hěn kāixīn de dōngxi?","lunar":["腊月廿一","12th lunar month, day 21","niànyī"]},{"d":15,"date":"2027-01-29","city":["横滨","Yokohama"],"obj":["一个挂着生菜的红包","A red envelope tied to lettuce"],"story":["日本横滨中华街从 1986 年起办春节活动，到现在已经四十多年。2027 年的春节点灯（日文叫「春節燈花」）从 2026 年 11 月 1 日一直亮到 2027 年 2 月 20 日，主街上挂着一条大龙灯。舞的是南狮：狮子一家店一家店地走，把店门口挂着的红包叼下来，叫「采青」，给这家店送好运。","Yokohama's Chinatown in Japan has held Chinese New Year events since 1986 — more than forty years. The 2027 New Year lights (Shunsetsu Tōka in Japanese) are on from 1 November 2026 to 20 February 2027, with a huge dragon lantern over the main street. The lions are southern-style: they go from shop to shop and pluck the red envelope hanging at each door — 'picking the greens' — bringing that shop good luck."],"src":"https://www.chinatown.or.jp/event/shunsetsu/","src2":"https://www.chinatown.or.jp/event/event/shunsetsutouka2027/","sz":{"l1":{"zh":"我们那边的人常说「祝你好运」。","py":"Wǒmen nàbian de rén cháng shuō 'zhù nǐ hǎoyùn'.","en":"Where I'm from, people often say 'good luck'.","words":[["常","cháng","often"],["祝","zhù","to wish"],["好运","hǎoyùn","good luck"]]},"l2":{"starter":"在我们那儿，祝别人好运的时候会……","py":"Zài wǒmen nàr, zhù biérén hǎoyùn de shíhou huì ……","en":"Where I'm from, to wish someone luck, people …","ideas":[["交叉手指","jiāochā shǒuzhǐ","cross their fingers"],["敲敲木头","qiāoqiao mùtou","knock on wood"],["送一个小礼物","sòng yí gè xiǎo lǐwù","give a small gift"]]},"l3":{"zh":"考试前，我奶奶总塞给我一颗糖。我现在也这么对朋友，虽然早就没人考试了。","py":"Kǎoshì qián, wǒ nǎinai zǒng sāi gěi wǒ yì kē táng. Wǒ xiànzài yě zhème duì péngyou, suīrán zǎo jiù méi rén kǎoshì le.","en":"Before exams my grandma always slipped me a sweet. Now I do the same for my friends, even though none of us take exams any more."}},"se":{"l1":{"en":"Where I'm from, we just say 'good luck'.","zh":"在我们那儿，大家就说「祝你好运」。","words":[["Where I'm from","在我们那儿"],["good luck","好运"]]},"l2":{"starter":"To wish someone luck, we …","zh":"祝别人好运的时候，我们会……","ideas":[["cross our fingers","交叉手指"],["knock on wood","敲敲木头"],["give a little gift","送个小礼物"]]},"l3":{"en":"Before exams my grandma always slipped me a sweet. I still do it for friends, even though none of us have exams any more.","zh":"考试前我奶奶总会塞给我一颗糖。我现在也这样对朋友，虽然我们早就不用考试了。"}},"ask":["在你那边，大家怎么祝别人好运？","Where you live, how do people wish each other luck?"],"rep":null,"from":"system","storypy":"Rìběn Héngbīn Zhōnghuá Jiē cóng 1986 nián qǐ bàn Chūnjié huódòng, dào xiànzài yǐjīng sìshí duō nián. 2027 nián de Chūnjié diǎndēng (Rìwén jiào 'Shunsetsu Tōka') cóng 2026 nián 11 yuè 1 rì yìzhí liàng dào 2027 nián 2 yuè 20 rì, zhǔjiē shang guàzhe yì tiáo dà lóng dēng. Wǔ de shì nánshī: shīzi yì jiā diàn yì jiā diàn de zǒu, bǎ diàn ménkǒu guàzhe de hóngbāo diāo xiàlái, jiào 'cǎi qīng', gěi zhè jiā diàn sòng hǎoyùn.","src3":"https://jsmsj.org.cn/JiangsuArtists/English/Culture/2025/0201/10658.html","askpy":"Zài nǐ nàbian, dàjiā zěnme zhù biérén hǎoyùn?","lunar":["腊月廿二","12th lunar month, day 22","niàn'èr"]},{"d":16,"date":"2027-01-30","city":["天津","Tianjin"],"obj":["一盘糖瓜","A plate of sugar melons"],"story":["腊月二十三，北方的小年。北方有一句老童谣：「二十三，糖瓜粘，灶君老爷要上天。」灶王爷这天上天，去汇报这家人一年的好坏，供上黏黏的糖瓜，是想让他多说好话。天津民俗专家由国庆讲过一个老说法，叫「官三民四船五」：当官的二十三、老百姓二十四、船上人家二十五过小年。","The 23rd of the twelfth month: Little New Year in the north. An old northern nursery rhyme goes: 'On the twenty-third, sugar melons stick; the Kitchen God goes up to heaven.' On this day he goes up to report on each family's year, so people offer sticky sugar melons in the hope he'll say good things. Tianjin folklorist You Guoqing cites an old saying, 'officials on the 23rd, ordinary people on the 24th, boat families on the 25th'."],"src":"https://www.chinanews.com.cn/cul/2025/01-22/10357772.shtml","src2":"https://www.peopleapp.com/column/30048074364-500006061391","sz":{"l1":{"zh":"我希望他替我说：这一年，我挺努力的。","py":"Wǒ xīwàng tā tì wǒ shuō: zhè yì nián, wǒ tǐng nǔlì de.","en":"I'd want him to say for me: this year, I worked pretty hard.","words":[["希望","xīwàng","to hope"],["替","tì","for, on behalf of"],["努力","nǔlì","to work hard"]]},"l2":{"starter":"这一年，我最想让人知道的是：……","py":"Zhè yì nián, wǒ zuì xiǎng ràng rén zhīdào de shì: ……","en":"This year, I'd most like people to know that …","ideas":[["我开始学中文了","wǒ kāishǐ xué Zhōngwén le","I started learning Chinese"],["我搬家了","wǒ bān jiā le","I moved house"],["我没放弃","wǒ méi fàngqì","I didn't give up"]]},"l3":{"zh":"我希望灶王爷替我说点好话：这一年我没做什么大事，可是每天都按时吃饭，还交了两个新朋友。","py":"Wǒ xīwàng Zàowángyé tì wǒ shuō diǎn hǎohuà: zhè yì nián wǒ méi zuò shénme dà shì, kěshì měi tiān dōu ànshí chī fàn, hái jiāole liǎng gè xīn péngyou.","en":"I hope the Kitchen God puts in a good word for me: I didn't do anything big this year, but I ate properly every day and made two new friends."}},"se":{"l1":{"en":"I hope they'd say I tried my best.","zh":"我希望他说，我尽力了。","words":[["tried my best","尽力了"],["hope","希望"]]},"l2":{"starter":"This year, I'd want people to know that …","zh":"这一年，我最想让人知道的是：……","ideas":[["I started something new","我开始了一件新的事"],["I moved","我搬家了"],["I didn't give up","我没放弃"]]},"l3":{"en":"I'd want them to put in a good word: nothing huge happened, but I ate properly, slept more, and made two new friends.","zh":"我希望他替我说点好话：这一年没什么大事，可我好好吃饭、多睡了觉，还交了两个新朋友。"}},"ask":["如果有人替你汇报这一年，你希望他说什么？","If someone had to report on your year, what would you want them to say?"],"rep":{"id":"nour","nm":"Nour","c":["开罗","Cairo"],"face":true,"orig":"zh","zh":"准确地说，我希望他说：这一年我带了很多中国团，也终于把申请材料寄出去了。糖瓜？我只在课本上看过照片。","py":"Zhǔnquè de shuō, wǒ xīwàng tā shuō: zhè yì nián wǒ dàile hěn duō Zhōngguó tuán, yě zhōngyú bǎ shēnqǐng cáiliào jì chūqu le. Tángguā? Wǒ zhǐ zài kèběn shang kànguo zhàopiàn.","en":"To be precise, I'd want him to say: this year I guided lots of Chinese groups, and I finally sent off my applications. Sugar melons? I've only seen a photo in my textbook.","learner":true,"translated":false},"from":"system","storypy":"Làyuè èrshísān, běifāng de xiǎonián. Běifāng yǒu yí jù lǎo tóngyáo: 'Èrshísān, tángguā zhān, Zàojūn lǎoye yào shàng tiān.' Zàowángyé zhè tiān shàng tiān, qù huìbào zhè jiā rén yì nián de hǎohuài, gòng shang niánnián de tángguā, shì xiǎng ràng tā duō shuō hǎohuà. Tiānjīn mínsú zhuānjiā Yóu Guóqìng jiǎngguo yí gè lǎo shuōfǎ, jiào 'guān sān mín sì chuán wǔ': dāng guān de èrshísān, lǎobǎixìng èrshísì, chuán shang rénjiā èrshíwǔ guò xiǎonián.","askpy":"Rúguǒ yǒu rén tì nǐ huìbào zhè yì nián, nǐ xīwàng tā shuō shénme?","lunar":["腊月廿三","12th lunar month, day 23","niànsān"],"festival":["北方小年","Little New Year (north)","běifāng xiǎonián"]},{"d":17,"date":"2027-01-31","city":["上海","Shanghai"],"obj":["一把鸡毛掸子","A feather duster"],"story":["腊月二十四，南方的小年，也是掸尘的日子。北方叫扫房，南方叫掸尘，意思一样：「尘」跟「陈」同音，扫掉的是旧的一年。这一天一大早，家家清扫浮尘、擦家具、拆洗被褥窗帘。","The 24th of the twelfth month: Little New Year in the south, and the day for dusting. The north calls it 'sweeping the house', the south 'brushing off the dust', but it's the same idea: chen (dust) sounds like chen (old), so what you sweep out is the old year. From early morning, families dust, wipe the furniture and wash the bedding and curtains."],"src":"https://cn.chinadaily.com.cn/a/202201/27/WS61f22e9fa3107be497a04335.html","src2":"","sz":{"l1":{"zh":"我想扔掉一些旧衣服。","py":"Wǒ xiǎng rēngdiào yìxiē jiù yīfu.","en":"I want to throw out some old clothes.","words":[["扔掉","rēngdiào","to throw away"],["一些","yìxiē","some"],["旧","jiù","old"]]},"l2":{"starter":"新年以前，我想扔掉……","py":"Xīnnián yǐqián, wǒ xiǎng rēngdiào ……","en":"Before the new year, I want to get rid of …","ideas":[["不穿的衣服","bù chuān de yīfu","clothes I don't wear"],["手机里的旧照片","shǒujī lǐ de jiù zhàopiàn","old photos on my phone"],["一个坏习惯","yí gè huài xíguàn","a bad habit"]]},"l3":{"zh":"我每年这时候都想大扫除，可是收拾到一半，就坐在地上看起旧照片来了。","py":"Wǒ měi nián zhè shíhou dōu xiǎng dàsǎochú, kěshì shōushi dào yíbàn, jiù zuò zài dì shang kàn qǐ jiù zhàopiàn lái le.","en":"Every year around now I plan a big clean-up, but halfway through I end up sitting on the floor looking at old photos."}},"se":{"l1":{"en":"I want to throw out some old clothes.","zh":"我想扔掉一些旧衣服。","words":[["throw out","扔掉"],["old clothes","旧衣服"]]},"l2":{"starter":"Before the new year, I want to get rid of …","zh":"新年以前，我想扔掉……","ideas":[["clothes I never wear","不穿的衣服"],["old photos on my phone","手机里的旧照片"],["a bad habit","一个坏习惯"]]},"l3":{"en":"Every year I plan a big clear-out, and every year I end up on the floor halfway through, looking at old photos.","zh":"我每年都打算大扫除，每年都收拾到一半，就坐在地上看起旧照片来了。"}},"ask":["过新年以前，你想扔掉什么？","Before a new year, what would you like to throw out?"],"rep":{"id":"sana","nm":"Sana","c":["拉合尔","Lahore"],"face":true,"orig":"zh","zh":"我想扔掉哥哥给我的那台旧电脑……不行，我还在用它。那就先扔旧笔记吧，一步一步来。","py":"Wǒ xiǎng rēngdiào gēge gěi wǒ de nà tái jiù diànnǎo…… bù xíng, wǒ hái zài yòng tā. Nà jiù xiān rēng jiù bǐjì ba, yí bù yí bù lái.","en":"I'd like to throw out the old laptop my brother gave me… no, I'm still using it. Old notes first, then — one step at a time.","learner":true,"translated":false},"from":"system","storypy":"Làyuè èrshísì, nánfāng de xiǎonián, yě shì dǎnchén de rìzi. Běifāng jiào sǎofáng, nánfāng jiào dǎnchén, yìsi yíyàng: 'chén' (dust) gēn 'chén' (old) tóngyīn, sǎo diào de shì jiù de yì nián. Zhè yì tiān yídàzǎo, jiājiā qīngsǎo fúchén, cā jiājù, chāixǐ bèirù chuānglián.","askpy":"Guò xīnnián yǐqián, nǐ xiǎng rēngdiào shénme?","lunar":["腊月廿四","12th lunar month, day 24","niànsì"],"festival":["南方小年","Little New Year (south)","nánfāng xiǎonián"]},{"d":18,"date":"2027-02-01","city":["吉隆坡","Kuala Lumpur"],"obj":["一盘黄梨挞","A plate of pineapple tarts"],"story":["在马来西亚和新加坡，过年家家桌上都有一罐黄梨挞。黄梨就是菠萝，闽南话叫 ong lai，听起来像「旺来」：好运来了。送一罐黄梨挞，就是送一份「旺来」。","In Malaysia and Singapore, every New Year table has a jar of pineapple tarts. In Hokkien, pineapple is ong lai, which sounds like 'prosperity arrives' — so a jar of tarts is a jar of good fortune to give away."],"src":"https://guide.michelin.com/sg/en/article/features/5-chinese-new-year-goodies-and-why-we-eat-them","src2":"https://www.saveur.com/story/food/pineapple-tarts-for-a-prosperous-lunar-new-year/","sz":{"l1":{"zh":"我觉得甜的东西都能带来好运。","py":"Wǒ juéde tián de dōngxi dōu néng dàilái hǎoyùn.","en":"I think anything sweet brings good luck.","words":[["觉得","juéde","to think, feel"],["甜","tián","sweet"],["好运","hǎoyùn","good luck"]]},"l2":{"starter":"在我们那儿，新年要吃……","py":"Zài wǒmen nàr, xīnnián yào chī ……","en":"Where I'm from, at New Year we eat …","ideas":[["葡萄","pútao","grapes"],["小扁豆","xiǎo biǎndòu","lentils"],["没有特别的","méiyǒu tèbié de","nothing special",{"zh":"我们那儿新年没有特别要吃的。","py":"Wǒmen nàr xīnnián méiyǒu tèbié yào chī de.","en":"We don't really have a special New Year food."}]]},"l3":{"zh":"要说最吉利的吃的，我选生日蛋糕。不是因为它能带来好运，是因为吃它的那天，大家都在。","py":"Yào shuō zuì jílì de chī de, wǒ xuǎn shēngrì dàngāo. Bú shì yīnwèi tā néng dàilái hǎoyùn, shì yīnwèi chī tā de nà tiān, dàjiā dōu zài.","en":"If I had to pick the luckiest food, I'd choose birthday cake — not because it brings luck, but because on the day you eat it, everyone's there."}},"se":{"l1":{"en":"I think anything sweet brings good luck.","zh":"我觉得甜的东西都能带来好运。","words":[["sweet","甜的"],["good luck","好运"]]},"l2":{"starter":"Where I'm from, at New Year we eat …","zh":"在我们那儿，新年要吃……","ideas":[["grapes","葡萄"],["lentils","小扁豆"],["nothing special","没有特别的",{"en":"We don't really have a special New Year food.","zh":"我们那儿新年没有特别要吃的。"}]]},"l3":{"en":"If I had to pick a lucky food, it'd be birthday cake — not because of luck, but because when you eat it, everyone's there.","zh":"要选一样吉利的吃的，我选生日蛋糕。不是因为运气，是因为吃它的时候，大家都在。"}},"ask":["你那边有没有「好运」的吃的？","Is there a 'lucky' food where you're from?"],"rep":{"id":"budi","nm":"Budi","c":["雅加达","Jakarta"],"face":true,"orig":"en","zh":"在雅加达我们叫它 nastar。客人还没来，我家两个孩子就吃掉半罐了。","py":"Zài Yǎjiādá wǒmen jiào tā nastar. Kèrén hái méi lái, wǒ jiā liǎng gè háizi jiù chī diào bàn guàn le.","en":"In Jakarta we call them nastar. My two kids eat half the jar before the guests even arrive.","learner":"en","translated":true},"from":"system","storypy":"Zài Mǎláixīyà hé Xīnjiāpō, guònián jiājiā zhuō shang dōu yǒu yí guàn huánglí tà. Huánglí jiù shì bōluó, Mǐnnán huà jiào ong lai, tīng qǐlái xiàng 'wàng lái': hǎoyùn lái le. Sòng yí guàn huánglí tà, jiù shì sòng yí fèn 'wàng lái'.","askpy":"Nǐ nàbian yǒu méiyǒu 'hǎoyùn' de chī de?","lunar":["腊月廿五","12th lunar month, day 25","niànwǔ"]},{"d":19,"date":"2027-02-02","city":["香港","Hong Kong"],"obj":["一枝桃花和一个风车","A peach-blossom branch and a pinwheel"],"story":["香港的年宵市场从年廿四开到年初一清晨，一连七天。最大的一个在铜锣湾维多利亚公园，2025 年有将近 400 个摊位，卖年花、年货、挥春和各种装饰。买一枝桃花回家，是盼新一年人缘好。","Hong Kong's Lunar New Year fairs run for seven days, from the 24th of the twelfth month to the early hours of New Year's Day. The biggest is in Victoria Park, Causeway Bay — nearly 400 stalls in 2025, selling New Year flowers, festive food, fai chun (red calligraphy) and decorations. Taking home a peach-blossom branch is a wish for good relationships in the coming year."],"src":"https://www.hk01.com/社會新聞/1096409/年宵花市2025-全港15大年宵市場開放時間及地址-維園封路一覽","src2":"https://www.stheadline.com/society/3420605/","sz":{"l1":{"zh":"我家有一盆小植物。","py":"Wǒ jiā yǒu yì pén xiǎo zhíwù.","en":"I have a little plant at home.","words":[["一盆","yì pén","a pot of"],["小","xiǎo","little"],["植物","zhíwù","plant"]]},"l2":{"starter":"我家窗台上有……","py":"Wǒ jiā chuāngtái shang yǒu ……","en":"On my windowsill there's …","ideas":[["一盆绿萝","yì pén lǜluó","a pothos"],["几棵小葱","jǐ kē xiǎocōng","some spring onions"],["什么都没有","shénme dōu méiyǒu","nothing at all",{"zh":"我家窗台上什么都没有。","py":"Wǒ jiā chuāngtái shang shénme dōu méiyǒu.","en":"There's nothing on my windowsill."}]]},"l3":{"zh":"我养什么死什么，只有一盆仙人掌活了三年。我觉得不是靠我，是靠它自己。","py":"Wǒ yǎng shénme sǐ shénme, zhǐyǒu yì pén xiānrénzhǎng huóle sān nián. Wǒ juéde bú shì kào wǒ, shì kào tā zìjǐ.","en":"Everything I try to grow dies. Only one cactus has lasted three years — and I think that's down to the cactus, not me."}},"se":{"l1":{"en":"I have one little plant at home.","zh":"我家有一盆小植物。","words":[["plant","植物"],["at home","在家"]]},"l2":{"starter":"On my windowsill there's …","zh":"我家窗台上有……","ideas":[["a pothos","一盆绿萝"],["some herbs","几盆香草"],["nothing","什么都没有",{"en":"There's nothing on my windowsill.","zh":"我家窗台上什么都没有。"}]]},"l3":{"en":"I kill every plant I touch. One cactus has survived three years, and honestly, that's all the cactus.","zh":"我养什么死什么。只有一盆仙人掌活了三年，说实话，全靠它自己。"}},"ask":["你家里有花或者植物吗？","Do you have any flowers or plants at home?"],"rep":null,"from":"system","storypy":"Xiānggǎng de niánxiāo shìchǎng cóng nián niànsì kāi dào nián chūyī qīngchén, yìlián qī tiān. Zuì dà de yí gè zài Tóngluówān Wéiduōlìyà Gōngyuán, 2025 nián yǒu jiāngjìn 400 gè tānwèi, mài niánhuā, niánhuò, huīchūn hé gè zhǒng zhuāngshì. Mǎi yì zhī táohuā huí jiā, shì pàn xīn yì nián rényuán hǎo.","askpy":"Nǐ jiā lǐ yǒu huā huòzhě zhíwù ma?","lunar":["腊月廿六","12th lunar month, day 26","niànliù"]},{"d":20,"date":"2027-02-03","city":["吐鲁番","Turpan"],"obj":["一碗唐朝的饺子","A Tang-dynasty dumpling"],"story":["在新疆吐鲁番的唐代古墓里，考古学家发现过一碗饺子。吐鲁番干旱少雨，食物很快就脱了水，所以一千多年都没坏。今天在新疆博物馆，还能看到唐朝的饺子和点心。","In Tang-dynasty tombs in Turpan, Xinjiang, archaeologists found a bowl of jiaozi. Turpan is so dry that food lost its water fast — so the dumplings lasted more than a thousand years. Today you can still see Tang-dynasty dumplings and pastries in the Xinjiang Museum."],"src":"https://en.wikipedia.org/wiki/Jiaozi","src2":"https://www.chinanews.com.cn/dxw/2025/10-05/10494228.shtml","sz":{"l1":{"zh":"我会吃饺子，可是不会包。","py":"Wǒ huì chī jiǎozi, kěshì bú huì bāo.","en":"I can eat dumplings, but I can't make them.","words":[["饺子","jiǎozi","dumplings"],["会","huì","can, know how to"],["包","bāo","to wrap (dumplings)"]]},"l2":{"starter":"我最喜欢的饺子是……馅儿的。","py":"Wǒ zuì xǐhuan de jiǎozi shì …… xiànr de.","en":"My favourite dumplings are filled with …","ideas":[["猪肉白菜","zhūròu báicài","pork and cabbage"],["韭菜鸡蛋","jiǔcài jīdàn","chives and egg"],["香菇","xiānggū","mushroom"]]},"l3":{"zh":"我第一次包饺子，包了二十个，一下锅就破了一半，最后我们喝了一锅饺子汤，还挺好喝的。","py":"Wǒ dì-yī cì bāo jiǎozi, bāole èrshí gè, yí xià guō jiù pòle yíbàn, zuìhòu wǒmen hēle yì guō jiǎozi tāng, hái tǐng hǎohē de.","en":"The first time I made dumplings I made twenty, and half burst as soon as they hit the water. We ended up having a pot of dumpling soup — which was actually pretty good."}},"se":{"l1":{"en":"I can eat dumplings, but I can't make them.","zh":"我会吃饺子，可是不会包。","words":[["dumplings","饺子"],["make","包"]]},"l2":{"starter":"We have something like dumplings too: …","zh":"我们那儿也有像饺子的东西：……","ideas":[["pierogi","波兰饺子"],["ravioli","意大利饺子"],["momos","尼泊尔饺子 momo"]]},"l3":{"en":"My first try at dumplings: twenty made, half burst in the pot, and we ended up eating dumpling soup. Not bad, actually.","zh":"我第一次包饺子：包了二十个，一半在锅里破了，最后大家喝的是饺子汤。其实还不错。"}},"ask":["你会包饺子吗？","Can you make dumplings?"],"rep":{"id":"ximena","nm":"Ximena","c":["墨西哥城","Mexico City"],"face":true,"orig":"zh","zh":"算会吧！我包过一次饺子，一半破了，可是我们还是都吃完了。","py":"Suàn huì ba! Wǒ bāoguo yí cì jiǎozi, yíbàn pò le, kěshì wǒmen háishi dōu chī wán le.","en":"Sort of! I made dumplings once — half of them burst, but we still ate them all.","learner":true,"translated":false},"from":"system","storypy":"Zài Xīnjiāng Tǔlǔfān de Tángdài gǔmù lǐ, kǎogǔ xuéjiā fāxiànguo yì wǎn jiǎozi. Tǔlǔfān gānhàn shǎo yǔ, shíwù hěn kuài jiù tuōle shuǐ, suǒyǐ yìqiān duō nián dōu méi huài. Jīntiān zài Xīnjiāng Bówùguǎn, hái néng kàndào Tángcháo de jiǎozi hé diǎnxin.","askpy":"Nǐ huì bāo jiǎozi ma?","lunar":["腊月廿七","12th lunar month, day 27","niànqī"]},{"d":21,"date":"2027-02-04","city":["荆州","Jingzhou"],"obj":["一张「宜春」帖和一只彩燕","A 'Welcome Spring' sign and a silk swallow"],"story":["2 月 4 日立春（北京时间上午 9:46），比除夕还早一天。南北朝时，荆州人宗懔写的《荆楚岁时记》里记着：立春这天，人们用彩绸剪成小燕子戴在头上，在门上贴「宜春」两个字。","4 February is Lichun, the start of spring (9:46 a.m. Beijing time) — in 2027, the day before New Year's Eve. In the Northern and Southern dynasties, Zong Lin of Jingzhou wrote in his Record of Seasons in Jingchu: on the first day of spring, people cut swallows from coloured silk to wear in their hair, and pasted the words yi chun — 'welcome spring' — on their doors."],"src":"https://zh.wikisource.org/wiki/%E8%8D%8A%E6%A5%9A%E6%AD%B2%E6%99%82%E8%A8%98","src2":"https://eco.mtk.nao.ac.jp/koyomi/yoko/2027/rekiyou272.html","sz":{"l1":{"zh":"春天来了，我想早点儿起床。","py":"Chūntiān lái le, wǒ xiǎng zǎo diǎnr qǐchuáng.","en":"Spring is here — I want to get up a bit earlier.","words":[["春天","chūntiān","spring"],["早点儿","zǎo diǎnr","a bit earlier"],["起床","qǐchuáng","to get up"]]},"l2":{"starter":"今年春天，我想开始……","py":"Jīnnián chūntiān, wǒ xiǎng kāishǐ ……","en":"This spring, I want to start …","ideas":[["跑步","pǎobù","running"],["自己做饭","zìjǐ zuò fàn","cooking for myself"],["每天说一句中文","měi tiān shuō yí jù Zhōngwén","saying one line of Chinese a day"]]},"l3":{"zh":"我每年都在新年定计划，可是到二月就忘了。今年我想换个日子，等到春天再开始，说不定能坚持久一点。","py":"Wǒ měi nián dōu zài xīnnián dìng jìhuà, kěshì dào èr yuè jiù wàng le. Jīnnián wǒ xiǎng huàn gè rìzi, děngdào chūntiān zài kāishǐ, shuōbudìng néng jiānchí jiǔ yìdiǎnr.","en":"Every year I make plans at New Year and forget them by February. This year I'll try a different date — start in spring, and maybe it'll stick a bit longer."}},"se":{"l1":{"en":"Spring is here, so I want to get up earlier.","zh":"春天来了，我想早点起床。","words":[["Spring","春天"],["get up","起床"]]},"l2":{"starter":"This spring, I want to start …","zh":"今年春天，我想开始……","ideas":[["running","跑步"],["cooking for myself","自己做饭"],["saying one English sentence a day","每天说一句英语"]]},"l3":{"en":"I always make plans on the first of January and forget them by February. This year I'm moving the date to spring — maybe they'll last.","zh":"我总在一月一号定计划，二月就忘了。今年我把日子挪到春天，说不定能坚持下去。"}},"ask":["春天来了，你想开始做什么？","Spring is here — what do you want to start?"],"rep":null,"from":"system","storypy":"2 yuè 4 rì lìchūn (Běijīng shíjiān shàngwǔ 9:46), bǐ chúxī hái zǎo yì tiān. Nán-Běi Cháo shí, Jīngzhōu rén Zōng Lǐn xiě de 《Jīng-Chǔ Suìshí Jì》 lǐ jìzhe: lìchūn zhè tiān, rénmen yòng cǎichóu jiǎn chéng xiǎo yànzi dài zài tóu shang, zài mén shang tiē 'yí chūn' liǎng gè zì.","askpy":"Chūntiān lái le, nǐ xiǎng kāishǐ zuò shénme?","lunar":["腊月廿八","12th lunar month, day 28","niànbā"],"festival":["立春","Start of Spring","lìchūn"]},{"d":22,"date":"2027-02-05","city":["成都","Chengdu"],"obj":["一副春联","A pair of spring couplets"],"story":["公元 964 年，后蜀的皇帝孟昶在成都，嫌学士在桃符上写的词不好，自己提笔写了「新年纳余庆，嘉节号长春」。这副对联常被叫作第一副春联。2027 年的腊月只有二十九天，所以今年没有年三十：腊月廿九（2 月 5 日）就是除夕。","In 964, Meng Chang, emperor of Later Shu in Chengdu, didn't like the lines his scholar had written on the peach-wood door charms, so he wrote his own: 'The new year takes in the blessings left over; the festival is called Eternal Spring.' It's often called the first spring couplet. In 2027 the twelfth month has only 29 days, so there's no 'thirtieth' — the 29th (5 February) is New Year's Eve."],"src":"https://www.xinhuanet.com/book/20210702/C96E4301DB000001E0575327BC8413A1/c.html","src2":"https://www.chinahighlights.com/travelguide/festivals/chinese-new-year-calendar.htm","sz":{"l1":{"zh":"新的一年，我想对自己说：慢慢来。","py":"Xīn de yì nián, wǒ xiǎng duì zìjǐ shuō: mànmàn lái.","en":"For the new year, I want to tell myself: take it slow.","words":[["新的一年","xīn de yì nián","the new year"],["对自己说","duì zìjǐ shuō","to tell yourself"],["慢慢来","mànmàn lái","take your time"]]},"l2":{"starter":"新的一年，我想对自己说：……","py":"Xīn de yì nián, wǒ xiǎng duì zìjǐ shuō: ……","en":"For the new year, I'd tell myself: …","ideas":[["别怕","bié pà","don't be afraid"],["多睡觉","duō shuìjiào","sleep more"],["开口说","kāikǒu shuō","just speak up"]]},"l3":{"zh":"我想贴一张纸在门上，写「今天也出门了」。不求每天都很好，能出门、能说几句话，就算过得不错。","py":"Wǒ xiǎng tiē yì zhāng zhǐ zài mén shang, xiě 'jīntiān yě chūmén le'. Bù qiú měi tiān dōu hěn hǎo, néng chūmén, néng shuō jǐ jù huà, jiù suàn guò de búcuò.","en":"I'd stick a note on my door: 'Got out today too.' I'm not asking for every day to be great — if I get out and say a few things, that counts as a good day."}},"se":{"l1":{"en":"For the new year, I'd tell myself: take it easy.","zh":"新的一年，我想对自己说：慢慢来。","words":[["take it easy","慢慢来"],["tell myself","对自己说"]]},"l2":{"starter":"This year, I'd tell myself: …","zh":"新的一年，我想对自己说：……","ideas":[["don't be scared","别怕"],["sleep more","多睡觉"],["just say it","说出来"]]},"l3":{"en":"I'd stick a note on my door: 'You went out today too.' Not every day has to be great — get out, say a few things, and that's a good day.","zh":"我想在门上贴一张纸：「今天也出门了」。不用每天都很好，出了门、说了几句话，就算不错的一天。"}},"ask":["新的一年，你想对自己说一句什么？","What one line would you tell yourself for the new year?"],"rep":null,"from":"system","storypy":"Gōngyuán 964 nián, Hòu Shǔ de huángdì Mèng Chǎng zài Chéngdū, xián xuéshì zài táofú shang xiě de cí bù hǎo, zìjǐ tí bǐ xiěle 'Xīnnián nà yú qìng, jiā jié hào cháng chūn'. Zhè fù duìlián cháng bèi jiàozuò dì-yī fù chūnlián. 2027 nián de làyuè zhǐ yǒu èrshíjiǔ tiān, suǒyǐ jīnnián méiyǒu nián sānshí: làyuè niànjiǔ (2 yuè 5 rì) jiù shì chúxī.","askpy":"Xīn de yì nián, nǐ xiǎng duì zìjǐ shuō yí jù shénme?","lunar":["腊月廿九","12th lunar month, day 29","niànjiǔ"],"festival":["除夕","New Year's Eve","chúxī"]}],"schedule":"rolling"};

/* advent.js */
// 🎁 倒数礼盒（共用的芯）：圣诞倒数日历（advent.js 下半，样板 样板/圣诞倒数日历样板.html）+ 春节红包日历（advent_spring.js，样板 样板/春节红包日历样板.html）
// 两只盒子长得不一样（首饰柜 + 圣诞树 / 卷轴红包 + 红门），里面那一页一样：一座真城市的一件真事、说你自己的一句（三档）、轮到你、大家送出的话。
// 每只盒子是一份配置 C，交给 window.ADV_MK(C)，得到 {bar, open, close, phase}。盒子自己的外观（格子、开的动画、收集的地方、分享卡、样式）由 C 的几个钩子画。
// 内容只从 content-skeleton/advent/<年>.json、<年>_spring.json 来（gen_advent.py → d92_advent.js / d93_advent_spring.js）。
// 两种人：学中文的人（英文界面）说中文句子；学英语的人（中文界面）说英文句子；西、日、阿界面照学英语那套，界面字走 T(中, 英)，阿语从右往左。
// 进度各存一个 key（C.key，在 SYNC_KEYS 里）：开了哪格、♥ 两边共用；说过的、句子、送没送给世界、选到哪按在学的语言分开存（L.zh / L.en）。录音只存在手机上（IndexedDB hv.advent）。
// 规矩（检查员 2026-11-15）：麦克风没真录到不算说过；分享卡只放真的送给世界的句子；集齐了才点亮；「送给世界」真的送出去（AK.post，coll = advent，后台/advent.sql）。
// 以后用户自己往礼盒里放东西、跟别人交换：每格有 from（现在都是 HeyVoyo 放的）；显示内容一律走 item(d) / fromHTML(X)。
(function(){
if (window.ADV_MK) return;
const H = () => window.HVI || {};
const UIL = () => (document.documentElement.lang || "zh").slice(0, 2), UIZ = () => UIL() === "zh";
// 界面文字：中文界面用中文；英文界面用英文；西、日、阿先查 UI_L10N（按中文原句），再查 ACTS_I18N（按英文原句），都没有就用英文
const T = (zh, en) => { const u = UIL(); if (u === "zh") return zh; if (u === "en") return en;
  try { const a = typeof UI_L10N !== "undefined" && UI_L10N[u] && UI_L10N[u][zh]; if (a) return a; const b = (window.ACTS_I18N || {})[u]; if (b && b[en]) return b[en]; } catch(e){}
  return en; };
const TN = (zh, en, n) => T(zh, en).replace(/\{n\}/g, n);
const TZ = () => H().LEARN === "zh";   // 在学中文：说 say_zh；别的都说 say_en
const LG = () => TZ() ? "zh" : "en";
const U = a => UIZ() ? a[0] : a[1];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const FACE = id => `https://img.heyvoyo.com/npc/${id}/face.webp`;
const ymd0 = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const ds = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const diff = (a, b) => Math.round((ymd0(a) - ymd0(b)) / 864e5);
const hostOf = u => { try { return decodeURIComponent(new URL(u).hostname.replace(/^www\./, "")); } catch(e){ return u; } };
const lv3 = () => [T("刚开始", "Just starting"), T("能聊日常", "Everyday"), T("比较流利", "Fluent")];
// 声音（「声音关」时不响）
let AC = null;
const quiet = () => { try { return localStorage.getItem("hv.sound") === "off"; } catch(e){ return false; } };
function ac(){ try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch(e){} return AC; }
function tone(f, t0, dur, vol, type){ if (quiet()) return; const a = ac(); if (!a) return; try { const o = a.createOscillator(), g = a.createGain(); o.type = type || "sine"; o.frequency.value = f; const t = a.currentTime + t0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05); } catch(e){} }
function noise(t0, dur, vol, freq){ if (quiet()) return; const a = ac(); if (!a) return; try { const len = Math.max(1, Math.floor(a.sampleRate * dur)), b = a.createBuffer(1, len, a.sampleRate), c = b.getChannelData(0); for (let i = 0; i < len; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / len); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq || 3000; const g = a.createGain(); g.gain.value = vol || .12; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime + t0); } catch(e){} }
const blip = () => tone(880, 0, .12, .05);
const thunk = () => { tone(150, 0, .18, .18, "triangle"); tone(90, .01, .25, .12); };
const TTS = () => TZ() ? "zh-CN" : "en-GB";
function speak(t, lang){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).replace(/……|…/g, "")); u.lang = lang || TTS(); u.rate = .85; speechSynthesis.speak(u); } catch(e){} }
const SND = {tone, noise, blip, thunk, ac};
// 共用的外壳样式（每只盒子各自套一份，.av-root 换成那只盒子的 scope）
const SHELL_CSS = `/* ---------- 外壳（软件里加的：手机整屏，电脑中间一只竖着的盒子） ---------- */
html.av-noscroll,html.av-noscroll body{overflow:hidden}
.av-root{position:fixed;inset:0;z-index:88;background:rgba(9,15,34,.62);display:flex;align-items:center;justify-content:center;color:#24303a;font:15px/1.55 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;text-align:start;-webkit-text-size-adjust:100%}
.av-root[hidden]{display:none}
.av-root *{box-sizing:border-box}
.av-root button{font:inherit;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent;margin:0}
.av-root .av-pane{position:relative;width:420px;max-width:100%;height:min(880px,calc(100vh - 32px));background:var(--ivory);border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4)}
@media(max-width:600px){.av-root{background:var(--ivory)}.av-root .av-pane{width:100%;height:100%;border-radius:0;box-shadow:none}}
.av-root .av-scr{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-bottom:calc(30px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}
.av-root .av-rv{padding-bottom:env(safe-area-inset-bottom)}
.av-root .av-hd{position:relative;padding-top:calc(22px + env(safe-area-inset-top))}
.av-root .av-close{position:absolute;top:calc(12px + env(safe-area-inset-top));inset-inline-start:12px;width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:16px;line-height:1;z-index:4}
.av-root .av-stage{padding-top:env(safe-area-inset-top)}
.av-root .av-x{top:calc(12px + env(safe-area-inset-top))}.av-root .av-dt{top:calc(16px + env(safe-area-inset-top))}
.av-root .av-cabwrap,.av-root .av-tree,.av-root .av-stage,.av-root .av-scroll,.av-root .av-door{direction:ltr}
.av-root .av-merry{font:600 40px/1.05 "Cormorant Garamond",Georgia,serif;font-style:italic;text-align:center}
.av-root .av-merry.av-zh{font:900 30px/1.2 "Noto Serif SC",serif;font-style:normal}
.av-root .av-from{font-size:12px;color:#8f7a4c;margin-top:6px}
.av-root .av-cd .av-t:not(.av-zh){white-space:nowrap}
/* 🎤 用 AK.mic（act_kit.js）的那一套，样子照样板的红色长按钮 */
.av-root .ak-mic.av-micw{display:contents}
.av-root .ak-micb.av-mic{flex:1;min-width:0;width:auto;height:auto;font-size:15px;border-radius:99px;animation:none;touch-action:none;-webkit-user-select:none;user-select:none}
.av-root .ak-mic.rec .ak-micb.av-mic{background:#c43d1c;animation:none}
.av-root .ak-mic.rec .av-bars{display:inline-flex}
.av-root .ak-micb.av-mic.av-done{background:#2f6b4f;box-shadow:0 4px 0 #1f4a36}
.av-root .ak-mic.rec .ak-micb.av-mic.av-done{background:#c43d1c;box-shadow:0 4px 0 #b53d1d}
.av-root .av-acts{align-items:center;flex-wrap:wrap}
.av-root .ak-live.av-heard{flex:0 0 100%;width:100%;margin-top:2px;padding-right:0;padding-inline-end:96px;text-align:start}
.av-root .av-heard small{color:var(--soft)}
.av-root .av-give{padding-right:0;padding-inline-end:96px}
.av-root[dir=rtl] .av-stamp{right:auto;left:8px}
.av-root .av-world{margin-top:22px}
.av-root .av-none{font-size:13px;color:var(--soft);padding:6px 0}
.av-root .av-mod{margin-top:2px;font-size:11.5px;color:var(--soft)}.av-root .av-mod .ak-link{border:0;background:none;padding:0;color:var(--soft);font-size:11.5px;text-decoration:underline}
.av-root .av-ans.av-wit{cursor:default}
.av-root .av-miss{color:#b5582c}
.av-root .av-fillIn{width:1.6em;border:0;border-bottom:2px solid var(--hot);background:#fde9e1;color:var(--hot);font:inherit;text-align:center;border-radius:6px 6px 0 0;margin:0 4px;padding:0;text-transform:uppercase;outline:none}
.av-root .av-fillTip{font-size:12px;color:#a3884f;margin:2px 2px 0}
.av-root .av-shn{font-size:11.5px;color:#9a917c;margin-top:8px}
.av-root a{color:#8f7a4c}
.av-root .av-bigstamp{padding:0 22px}`;
const SHIP = (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c || "#8f7a4c"}" stroke-width="1.2"><path d="M12 3v14M12 4l6 11h-6M12 6l-5 9h5"/><path d="M4 18c2.5 1.6 13.5 1.6 16 0l-1.6 2.4H5.6z"/></svg>`;

// 「今天」最上面那一条的基本样子（两只盒子共用；只放在圣诞那只里的话，圣诞下架后春节那条就没有样子了）
const BAR_CSS = `/* ---------- 「今天」最上面那一条 ---------- */
.adv-bar{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 12px;padding:11px 14px;border:0;border-radius:16px;background:linear-gradient(160deg,#1d2f57,#0d1734 65%,#0a1127);color:#f3e2b5;text-align:start;cursor:pointer;box-shadow:0 8px 18px -10px rgba(7,13,31,.6),inset 0 0 0 1px rgba(214,190,135,.45);font:inherit;-webkit-tap-highlight-color:transparent}
.adv-bar:active{transform:translateY(1px)}
.adv-gift{font-size:24px;line-height:1;flex:none}
.adv-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.adv-tx b{font:600 19px/1.15 "Cormorant Garamond",Georgia,serif;color:#fbf0d4;font-style:italic}
.adv-tx b.adv-zh{font:700 16px/1.3 "Noto Serif SC","PingFang SC",serif;font-style:normal}
.adv-tx small{font-size:12.5px;color:#d6be87;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adv-num{flex:none;width:34px;height:34px;border-radius:6px;display:grid;place-items:center;font:500 18px "Bodoni Moda","Cormorant Garamond",Georgia,serif;color:#d6be87;background:radial-gradient(circle at 30% 22%,#843046,#4d1424 72%,#36101b);box-shadow:inset 0 0 0 1px rgba(214,190,135,.55)}`;
window.ADV_MK = function(C){
const DATA = () => C.data() || null;
const KEY = C.key;
const N = () => { const D = DATA(); return D ? D.days.length : 0; };
const chime = () => C.chime ? C.chime(SND) : [1318.5, 1760, 2093, 2637].forEach((f, i) => { tone(f, i * .08, 1.4, .05); tone(f * 2.01, i * .08, .6, .012); });

/* ================= 日子：按这台手机的当地日期 ================= */
// C.show = [出现, 下架]；C.fest = 那个节日（倒数到这一天）；数据里第一格到最后一格按日期一天开一格
// 🗓️ 随到随开（数据里 schedule: "rolling"，2026-11-15 用户：活动还不多，先都放出来）：一年到头都在「今天」最上面；第一次打开那天（存在进度里的 d0）开第 1 格，
// 以后每天多开一格，第 N 格 = 开始后的第 N 天，跟 12 月几号、腊月几号没关系；没开的一直留着，随时补上。calendar（不写也是）= 下面原来那套按日期开。
const ROLL = () => { const D = DATA(); return !!(D && D.schedule === "rolling"); };
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const rollD0 = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}, D = DATA(); return o.d0 && (!o.y || !D || o.y === D.year) ? o.d0 : null; } catch(e){ return null; } };
function phase(){ const D = DATA(); if (!D || !D.days.length) return null; const now = new Date();
  if (ROLL()){ const d0 = rollD0(), g = d0 ? diff(now, ds(d0)) : 0, day = Math.max(0, g) + 1;   // 还没打开过：今天就是第 1 格
    return day > D.days.length ? {k: "post", day: D.days.length + 1, left: 0, roll: 1} : {k: "on", day, left: D.days.length - day, roll: 1}; }
  if (now < ds(C.show[0]) || diff(now, ds(C.show[1])) > 0) return null;
  const first = ds(D.days[0].date), last = ds(D.days[D.days.length - 1].date), left = diff(ds(C.fest), now);
  if (diff(now, first) < 0) return {k: "pre", day: 0, left, first: diff(first, now)};
  if (diff(now, last) <= 0) return {k: "on", day: diff(now, first) + 1, left};
  return {k: "post", day: D.days.length + 1, left}; }

/* ================= 进度 ================= */
let S = null;
function load(){ let o = {}; try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){}
  const D = DATA(); if (D && o.y && o.y !== D.year) o = {};
  const st = a => new Set((a || []).map(Number)), B = ((o.L || {})[LG()]) || {};
  S = {y: D ? D.year : 0, raw: o, opened: st(o.opened), hearts: st(o.hearts), said: st(B.said), lines: B.lines || {}, give: B.give || {}, posted: B.posted || {}, mine: B.mine || {}, lv: B.lv || {}, pick: B.pick || {}, own: B.own || {}, fill: B.fill || {}, peek: {}, flip: {}};
  return S; }
function save(){ if (!S) return; const o = S.raw || {}; o.y = S.y; o.opened = [...S.opened]; o.hearts = [...S.hearts]; o.ts = Date.now();
  delete o.said; delete o.lines; delete o.give; delete o.mine; delete o.lv; delete o.pick; delete o.own;   // 老格式（没分语言）不留
  o.L = o.L || {}; o.L[LG()] = {said: [...S.said], lines: S.lines, give: S.give, posted: S.posted, mine: S.mine, lv: S.lv, pick: S.pick, own: S.own, fill: S.fill};
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} try { window.hvSyncMark && window.hvSyncMark(KEY); } catch(e){} }
function keepRec(d, blob){ if (!blob || !window.indexedDB) return; try { const r = indexedDB.open("hv.advent", 1); r.onupgradeneeded = () => { try { r.result.createObjectStore("rec"); } catch(e){} };
  r.onsuccess = () => { try { r.result.transaction("rec", "readwrite").objectStore("rec").put(blob, C.id + "-" + S.y + "-" + LG() + "-" + d); } catch(e){} }; } catch(e){} }

/* ================= 一格的内容（以后可以是某个用户放的） ================= */
const item = d => { const D = DATA(); return D && D.days[d - 1]; };
const A = item;
const fromHTML = X => { const f = X && X.from; if (!f || f === "system" || f.kind === "heyvoyo") return ""; return `<div class="av-from">🎁 ${esc(TN("{n} 放进来的", "Put here by {n}", f.nm || ""))}</div>`; };
const objName = d => U(A(d).obj);
const cityName = d => U(A(d).city);
const useSvg = (d, cls) => `<svg viewBox="0 0 200 200" class="${cls || ""}"><use href="#${C.idp}o-${d}"/></svg>`;
const todayIn = c => T("今天在{c}", "Today in {c}").replace("{c}", c);

let R = null, P = null;   // R = 整个礼盒的根；P = 今天是哪一段（phase）
const q = s => R && R.querySelector(s);
const pane = () => q(".av-pane");
function stateOf(d){ if (S.opened.has(d)) return "open"; if (d === P.day) return "today"; if (d < P.day) return "miss"; return "lock"; }
const lockIn = d => ROLL() ? d - P.day : diff(ds(A(d).date), new Date());
const isFull = () => S.said.size === N();   // 集齐了才点亮
const worldLines = () => Object.keys(S.lines).map(Number).filter(k => S.said.has(k) && S.give[k] === "w" && S.posted[k]);
// 给盒子自己的钩子用
const K = {get S(){ return S; }, get P(){ return P; }, get R(){ return R; }, C, N, A, roll: ROLL, q, pane, esc, T, TN, U, UIZ, UIL, TZ, LG, useSvg, stateOf, lockIn, isFull, worldLines, SND, chime, objName, cityName, SHIP};

function renderGrid(){ q(".av-grid").innerHTML = Array.from({length: N()}, (_, i) => C.cell(K, i + 1)).join(""); }
function renderAll(){ C.head(K); renderGrid(); renderColl(); }
function onGrid(e){
  const b = e.target.closest("[data-d]"); if (!b) return; const d = +b.dataset.d, st = stateOf(d); ac();
  if (st === "lock"){ blip(); b.classList.remove("av-wig"); void b.offsetWidth; b.classList.add("av-wig"); toast(C.t.locked(lockIn(d))); return; }
  if (st === "open"){ blip(); openReveal(d); return; }
  openCell(b, d); }
function openCell(b, d){
  if (b.classList.contains("av-opening")) return;
  const fx = C.openFx(K, b, d) || {};
  const host = pane(), pr = host.getBoundingClientRect(), cr = b.getBoundingClientRect();
  const ox = cr.left - pr.left + cr.width / 2, oy = cr.top - pr.top + cr.height * (fx.oy || .5), sz = Math.max(cr.width, cr.height) * 1.6;
  const bu = document.createElement("i"); bu.className = "av-burst"; bu.style.cssText = `left:${ox}px;top:${oy}px;width:${sz}px;height:${sz}px`; host.appendChild(bu); setTimeout(() => bu.remove(), 1000);
  for (let i = 0; i < 26; i++){ const p = document.createElement("i"); p.className = "av-pt" + (i % 3 === 0 ? " av-star" : ""); p.style.left = ox + "px"; p.style.top = oy + "px"; host.appendChild(p);
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 80; p.style.opacity = 0;
    try { p.animate([{transform: "translate(-50%,-50%) scale(1)", opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r - 30}px)) scale(.3)`, opacity: 0}], {duration: 800 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.3,1)", delay: fx.pdelay || 180}).onfinish = () => p.remove(); } catch(e){ p.remove(); } }
  setTimeout(() => { S.opened.add(d); save(); try { window.hvPx && window.hvPx({k: "advent_open", box: C.id, d}); } catch(e){} renderGrid(); renderColl(); openReveal(d); }, fx.delay || 1050);
}

/* ================= 打开后的一页 ================= */
let cur = 0;
const tgt = () => TZ() ? A(cur).sz : A(cur).se;
// 学英语的人：句子下面那行意思是中文，只给中文界面看（西、日、阿界面先不显示，免得看到中文）
const meanOK = () => TZ() || UIZ();
// 真事：默认用界面的语言；C.flip 的盒子可以翻成在学的语言（学中文的人带拼音，点一下能听）
// rolling：真事是那一天（12 月 13 日、腊月廿三）发生的，开头的「今天 / 今晚 / Today / Tonight」换成「这一天 / 那天晚上」，不说成你的今天
const RW = [[/^今天是/, "这一天是", /^Jīntiān shì/, "Zhè yì tiān shì"], [/^今天/, "这一天", /^Jīntiān/, "Zhè yì tiān"], [/^今晚是/, "这天晚上是", /^Jīnwǎn shì/, "Zhè tiān wǎnshang shì"], [/^今晚/, "这天晚上", /^Jīnwǎn/, "Zhè tiān wǎnshang"],
  [/^Today is /, "This is "], [/^Tonight is /, "This is the night of "], [/^Today /, "On this day "]];
const rollTxt = t => { if (!ROLL()) return t; for (const r of RW) if (r[0].test(t)) return t.replace(r[0], r[1]); return t; };
const rollPy = (t, py) => { if (!ROLL() || !py) return py; for (const r of RW) if (r[2] && r[0].test(t)) return py.replace(r[2], r[3]); return py; };
const storyOf = (X, i) => rollTxt(X.story[i]);
function storyHTML(d){ const X = A(d), zh = UIZ(), f = !!(C.flip && S.flip[d]), tz = TZ(), txt = f ? (tz ? storyOf(X, 0) : storyOf(X, 1)) : (zh ? storyOf(X, 0) : storyOf(X, 1));
  const srcs = [X.src, X.src2, X.src3].filter(Boolean).map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(hostOf(u))}</a>`).join(" · ");
  const canFlip = C.flip && (tz ? !zh : zh);   // 界面跟在学的语言不一样才有得翻
  return `<p class="av-fact${f ? " av-tgt" + (tz ? " av-tz" : "") : ""}" dir="auto">${esc(txt)}${f ? " 🔊" : ""}</p>${f && tz && X.storypy ? `<div class="av-py" dir="ltr">${esc(rollPy(X.story[0], X.storypy))}</div>` : ""}<div class="av-src">${canFlip ? `<button class="av-flip">${esc(f ? T("回到中文", "Back to English") : tz ? T("看中文原文", "Read it in Chinese 中文") : T("看英文原文 English", "Read it in English"))}</button>` : ""}${srcs ? `<span>${esc(T("出处", "Source"))}${zh ? "：" : ": "}${srcs}</span>` : ""}</div>`; }
function bindStory(d){ const b = q(".av-storyBox .av-flip"); if (b) b.onclick = () => { S.flip[d] = !S.flip[d]; blip(); q(".av-storyBox").innerHTML = storyHTML(d); bindStory(d); if (S.flip[d]){ const X = A(d); speak(TZ() ? storyOf(X, 0) : storyOf(X, 1)); } };
  const f = q(".av-storyBox .av-fact.av-tgt"); if (f) f.onclick = () => { const X = A(d); blip(); speak(TZ() ? storyOf(X, 0) : storyOf(X, 1)); }; }
function openReveal(d){
  cur = d; const zh = UIZ(), X = A(d), rv = q(".av-rv"), city = cityName(d), tz = TZ(), AK = window.AK;
  let gl = ""; for (let i = 0; i < 9; i++) gl += `<i class="av-glint" style="left:${10 + Math.random() * 80}%;top:${12 + Math.random() * 70}%;animation-delay:${(Math.random() * 2).toFixed(2)}s"></i>`;
  let h = `<div class="av-stage">${C.stage(K, d, gl)}</div><div class="av-rbody">`;
  h += `<div class="av-city${zh ? " av-zh" : ""}">${esc(objName(d))}<small>${esc(d === P.day && !ROLL() ? todayIn(city) : C.onDay(K, d, city))}</small></div>${fromHTML(X)}`;
  h += `<div class="av-k${zh ? " av-zh" : ""}">${esc(ROLL() ? T("那一天在这里", "On that day") : T("今天在这里", "What's happening"))}</div><div class="av-storyBox">${storyHTML(d)}</div>`;
  const said = S.said.has(d);
  h += `<div class="av-k${zh ? " av-zh" : ""}">${esc(T("说你的", "Say yours"))}</div><div class="av-say" style="position:relative"><div class="av-stamp${zh ? " av-zh" : ""}">${C.stampHTML(K, d)}</div>
   <div class="av-lv">${lv3().map((x, i) => `<button data-i="${i}">${esc(x)}</button>`).join("")}</div><div class="av-lineBox"></div>
   <div class="av-acts"><button class="av-lis">🔊 ${esc(T("听", "Listen"))}</button><div class="ak-mic av-micw"><button class="ak-micb av-mic${said ? " av-done" : ""}" aria-label="${esc(T("点一下或按住说", "Tap or hold to speak"))}"><span class="av-bars"><i></i><i></i><i></i><i></i></span><span class="av-micT">${said ? "✓ " + esc(C.t.done()) + " · 🎤" : "🎤 " + esc(T("说一句", "Say it"))}</span></button>
   <div class="ak-live av-heard" dir="auto">${said && S.lines[d] ? `✓ <span dir="auto">${esc(S.lines[d])}</span><br><small>${esc(T("再点一下可以重说", "Tap again to redo"))}</small>` : esc(T("点一下或按住说", "Tap or hold to speak"))}</div></div></div>
   <div class="av-give${said ? " av-on" : ""}"><span class="av-gk">${esc(T("你这一句：", "Your voice:"))}</span><button data-g="w" class="${S.give[d] === "w" ? "av-on" : ""}">${esc(T("送给世界", "Send to the world"))}</button><button data-g="m" class="${S.give[d] === "m" ? "av-on" : ""}">${esc(T("只留给自己", "Keep it to myself"))}</button></div></div>`;
  const askpy = tz && X.askpy ? `<div class="av-qpy" dir="ltr">${esc(X.askpy)}</div>` : "";
  h += `<div class="av-yours${said ? " av-on" : ""}"><div class="av-k${zh ? " av-zh" : ""}">${esc(T("轮到你", "Over to you"))}</div><div class="av-q${tz ? "" : " av-en"}" dir="auto">${esc(tz ? X.ask[0] : X.ask[1])}</div>${askpy}${tz || zh ? `<div class="av-qt" dir="auto">${esc(tz ? X.ask[1] : X.ask[0])}</div>` : ""}<div class="av-ansBox"></div>
   <div class="av-leave"><input class="av-mineIn" placeholder="${esc(T("写一句……", "Write one line…"))}" maxlength="80" dir="auto"><button class="av-mineGo">${esc(T("送出", "Send"))}</button></div><div class="av-note">${esc(T("🎭 是 HeyVoyo 里的角色。你写的这一句存在你自己这里，别人还看不到。", "🎭 = a HeyVoyo character. What you write is kept for you; others can't see it yet."))}</div></div>`;
  h += `<div class="av-world"><div class="av-k${zh ? " av-zh" : ""}">${esc(T("大家送出的话", "Lines people sent"))}</div><div class="av-wlist"><div class="av-none">…</div></div></div>`;
  h += `<button class="av-back${zh ? " av-zh" : ""}" data-avx>${esc(C.t.back())}</button></div>`;
  rv.innerHTML = h; rv.scrollTop = 0;
  requestAnimationFrame(() => rv.classList.add("av-on"));
  bindStory(d);
  setLevel(S.lv[d] != null ? +S.lv[d] : 0);
  rv.querySelector(".av-lv").onclick = e => { const b = e.target.closest("button"); if (!b) return; blip(); setLevel(+b.dataset.i); save(); };
  rv.querySelector(".av-lis").onclick = () => { blip(); const s = curSentence(); speak(s ? s.text : tgt().l2.starter); };
  const mb = rv.querySelector(".av-micw");
  if (AK && AK.mic) AK.mic(mb, {want: () => { const s = curSentence(); return s ? s.text : ""; }, free: false, l: tz ? "zh" : "en", onDone: v => micDone(d, v)});
  else { mb.querySelector(".av-heard").textContent = T("这台设备上用不了麦克风。", "The mic isn't available on this device."); }
  rv.querySelector(".av-give").onclick = e => { const b = e.target.closest("button"); if (b) giveTo(d, b.dataset.g, b); };
  loadWorld(d);
  rv.querySelector(".av-yours .av-q").onclick = () => { blip(); speak(tz ? X.ask[0] : X.ask[1]); };
  renderAns(d);
  const mi = rv.querySelector(".av-mineIn");
  rv.querySelector(".av-mineGo").onclick = () => sendMine(d);
  mi.onkeydown = e => { if (e.key === "Enter") sendMine(d); };
}
function closeReveal(){ blip(); const rv = q(".av-rv"); if (!rv || !rv.classList.contains("av-on")) return false; rv.classList.remove("av-on"); hidePop(); try { speechSynthesis.cancel(); } catch(e){}
  if (S.said.has(cur)) setTimeout(() => { const sc = q(".av-scr"), tb = q(".av-coll"); sc && tb && sc.scrollTo({top: tb.offsetTop - 30, behavior: "smooth"}); }, 350);
  return true; }
// 🌍 送给世界：存进 Supabase docs，coll = 'advent'（AK.post，跟街拍同一个办法；后台/advent.sql）；只出现在这只盒子每一格的「大家送出的话」里
// 没登录 → AK.post 会先请你登录，这次不算送出。选「只留给自己」→ 送出去的那条删掉。
async function giveTo(d, g, b){ const AK = window.AK, rv = q(".av-rv"), line = S.lines[d]; if (!line || !S.said.has(d)) return;
  const mark = () => { rv && rv.querySelectorAll(".av-give button").forEach(x => x.classList.toggle("av-on", x.dataset.g === S.give[d])); };
  if (g === "m"){ const old = S.posted[d]; delete S.posted[d]; S.give[d] = "m"; save(); mark(); blip(); toast(T("只留给你自己", "Kept just for you"));
    if (old && AK && AK.del) AK.del("advent", old.id).then(() => loadWorld(d)); renderColl(); return; }
  if (S.give[d] === "w" && S.posted[d] && S.posted[d].t === line){ toast(T("这一句已经送出去了", "This line is already sent")); return; }
  if (!AK || !AK.post){ toast(T("现在送不出去，等一会儿再试", "Couldn't send — try again later")); return; }
  b && (b.disabled = true); const id = await AK.post("advent", {box: C.id, y: S.y, d, l: LG(), t: line}); b && (b.disabled = false);
  if (!id){ const e = AK.err && AK.err(); toast(e && e.code === "login" ? T("登录以后才能送给世界", "Log in to send it to the world") : T("没送出去，等一会儿再试", "Couldn't send — try again later")); return; }
  const old = S.posted[d]; if (old && old.id !== id && AK.del) AK.del("advent", old.id);
  S.posted[d] = {id, t: line}; S.give[d] = "w"; save(); mark(); chime(); sparks(b); toast(T("送出去了", "Sent")); renderColl(); loadWorld(d); }
async function loadWorld(d){ const box = q(".av-wlist"), AK = window.AK; if (!box) return;
  if (!AK || !AK.load){ box.innerHTML = ""; return; } try { AK.mount && AK.mount(); } catch(e){}
  const L = await AK.load("advent", {eq: {box: C.id, y: S.y, d}, limit: 60}); if (cur !== d || !q(".av-wlist")) return;
  box.innerHTML = L.length ? L.map((it, i) => `<div class="av-ans av-wit${it.own ? " av-mine" : ""}"><div class="av-me" style="background:${it.own ? "var(--ink)" : "#8f7a4c"}">${esc((it.nm || "?").slice(0, 1))}</div><div style="min-width:0;flex:1"><div class="av-nm"><b>${esc(it.nm || T("一位在学的人", "A learner"))}</b>${it.own ? " · " + esc(T("你", "You")) : ""}</div><div class="av-tx" dir="auto" data-wi="${i}">${esc(it.t || "")} <span style="font-size:12px;opacity:.5">🔊</span></div><div class="av-mod">${AK.modHTML ? AK.modHTML("advent", it) : ""}</div></div></div>`).join("")
    : `<div class="av-none">${esc(C.t.none())}</div>`;
  box.querySelectorAll("[data-wi]").forEach(el => el.onclick = () => { const it = L[+el.dataset.wi]; blip(); speak(it.t, it.l === "zh" ? "zh-CN" : "en-GB"); }); }
document.addEventListener("ak:changed", () => { if (R && !R.hidden && cur && q(".av-rv.av-on")) loadWorld(cur); });
const BL = /……|…/;
const endP = (t, zh) => /[。！？.!?」”'’]$/.test(t) ? t : t + (zh ? "。" : ".");
const fillB = (t, v, zh) => endP(t.replace(BL, (m, o) => (!zh && o > 0 && /[^\s“"(（]/.test(t[o - 1]) ? " " : "") + v).replace(/\s+([.,!?])/g, "$1").replace(/\s{2,}/g, " ").trim(), zh);
function curSentence(){
  const L = tgt(), i = +(S.lv[cur] || 0), zh = TZ();
  if (i === 0){ const f = L.l1.fill ? (S.fill[cur] || "") : null; if (f === "") return null;   // 填空（比如：你名字的第一个字母）没填就还没有这一句
    const r = t => f ? String(t || "").replace(/\{x\}/g, f) : t;
    return zh ? {text: r(L.l1.zh), py: r(L.l1.py), tr: r(L.l1.en)} : {text: r(L.l1.en), tr: r(L.l1.zh)}; }
  if (i === 1){ const p = S.pick[cur], own = (S.own[cur] || "").trim();
    if (own) return {text: fillB(L.l2.starter, own, zh), py: "", tr: ""};
    if (p == null) return null; const id = L.l2.ideas[p], full = id.find(v => v && typeof v === "object");
    if (full) return zh ? {text: full.zh, py: full.py, tr: full.en} : {text: full.en, tr: full.zh};
    return zh ? {text: fillB(L.l2.starter, id[0], 1), py: fillB(L.l2.py, id[1], 0), tr: fillB(L.l2.en, id[2], 0)} : {text: fillB(L.l2.starter, id[0], 0), tr: fillB(L.l2.zh, id[1], 1)}; }
  return zh ? {text: L.l3.zh, py: L.l3.py, tr: L.l3.en} : {text: L.l3.en, tr: L.l3.zh};
}
function markWords(text, words){ // 把要用的词在句子里标出来，点了能看意思
  let h = esc(text); words.forEach((w, j) => { const k = esc(w[0]); const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), TZ() ? "" : "i"); h = h.replace(re, m => `<span class="av-w" data-j="${j}">${m}</span>`); }); return h; }
// 词的小字：学中文的人看拼音（和英文意思），学英语的人在中文界面看中文意思
const wSmall = w => TZ() ? `<small>${esc(w[1])}${w[2] ? " · " + esc(w[2]) : ""}</small>` : UIZ() && w[1] ? `<small>${esc(w[1])}</small>` : "";
function setLevel(i){
  S.lv[cur] = i; R.querySelectorAll(".av-lv button").forEach(b => b.classList.toggle("av-on", +b.dataset.i === i));
  const L = tgt(), zh = TZ(), cls = zh ? "av-line" : "av-line av-en", mo = meanOK(), box = q(".av-lineBox"); let h = "";
  const trn = s => mo && s ? `<div class="av-trn" dir="auto">${esc(s)}</div>` : "";
  const chips = W => `<div class="av-mk">${esc(T("用得上的词", "Words to use"))}</div><div class="av-chips">${W.map((w, j) => `<button class="av-chip" data-j="${j}" dir="ltr">${esc(w[0])}${zh ? `<small>${esc(w[1])}</small>` : ""}</button>`).join("")}</div>`;
  if (i === 0 && L.l1.fill){ const W = L.l1.words, f = S.fill[cur] || "", src = zh ? L.l1.zh : L.l1.en, parts = src.split("{x}"), sub = t => String(t || "").replace(/\{x\}/g, f || "＿");
    h = `<div class="${cls}" dir="ltr">${markWords(parts[0], W)}<input class="av-fillIn" maxlength="1" value="${esc(f)}" aria-label="${esc(T("你名字的第一个字母", "The first letter of your name"))}" autocapitalize="characters" autocomplete="off" spellcheck="false">${markWords(parts.slice(1).join(""), W)}</div>
     <div class="av-fillTip">${esc(T("填你自己名字的第一个字母。", "Fill in the first letter of your own name."))}</div>${zh ? `<div class="av-py" dir="ltr">${esc(sub(L.l1.py))}</div>` : ""}${trn(sub(zh ? L.l1.en : L.l1.zh))}${chips(W)}`;
  } else if (i === 0){ const s = curSentence(), W = L.l1.words;
    h = `<div class="${cls} av-sp" dir="ltr">${markWords(s.text, W)}</div>${s.py ? `<div class="av-py" dir="ltr">${esc(s.py)}</div>` : ""}${trn(s.tr)}${chips(W)}`;
  } else if (i === 1){ const p = S.pick[cur], own = S.own[cur] || "", id = p != null ? L.l2.ideas[p] : null, fill = own ? esc(own) : id ? esc(id[0]) : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    const full = id && !own ? id.find(v => v && typeof v === "object") : null, st = full ? `<span class="av-slot av-on">${esc(zh ? full.zh : full.en)}</span>` : esc(L.l2.starter).replace(BL, `<span class="av-slot${own || id ? " av-on" : ""}">${fill}</span>`), s = curSentence();
    h = `<div class="${cls} av-sp" dir="ltr">${st}</div>${s && s.py ? `<div class="av-py" dir="ltr">${esc(s.py)}</div>` : zh && !own ? `<div class="av-py" dir="ltr">${esc(L.l2.py)}</div>` : ""}${trn(s && s.tr ? s.tr : (zh ? L.l2.en : L.l2.zh))}
     <div class="av-mk">${esc(T("挑一个，或者接你自己的", "Pick one, or finish it your way"))}</div><div class="av-chips">${L.l2.ideas.map((w, j) => `<button class="av-chip av-idea${p === j && !own ? " av-on" : ""}" data-j="${j}" dir="ltr">${esc(w[0])}${wSmall(w)}</button>`).join("")}</div>
     <input class="av-own" placeholder="${esc(T("……接你自己的", "…your own ending"))}" value="${esc(own)}" maxlength="40" dir="auto">`;
  } else { const s = curSentence(), pk = S.peek[cur];
    h = `<div class="av-way">${esc(T("用你自己的话，多说几句。", "Say it your way — a few sentences."))}</div><div class="av-cue" dir="auto">${esc(L.l2.starter)}</div>
     <button class="av-peek${pk ? " av-on" : ""}"><span class="av-pf">${esc(T("翻开看一种说法", "Peek at one way to say it"))} ↓</span><span class="av-pb"><span class="${cls}" style="margin:0" dir="ltr">${esc(s.text)}</span>${s.py ? `<span class="av-py" dir="ltr">${esc(s.py)}</span>` : ""}${mo ? `<span class="av-trn" dir="auto">${esc(s.tr)}</span>` : ""}</span></button>`;
  }
  box.innerHTML = h;
  box.querySelectorAll(".av-w,.av-chip:not(.av-idea)").forEach(el => el.onclick = e => { e.stopPropagation(); const w = L.l1.words[+el.dataset.j]; showPop(zh ? w : [w[0], "", mo ? w[1] : ""], el); });
  box.querySelectorAll(".av-chip.av-idea").forEach(el => el.onclick = () => { S.pick[cur] = +el.dataset.j; S.own[cur] = ""; save(); blip(); sparks(el); const w = L.l2.ideas[+el.dataset.j]; speak(w[0]); setLevel(1); });
  const fi = box.querySelector(".av-fillIn"); if (fi){ fi.oninput = () => { const v = (fi.value.match(/[A-Za-zÀ-ÿ]/) || [""])[0].toUpperCase(); fi.value = v; S.fill[cur] = v; save();
      const sub = t => String(t || "").replace(/\{x\}/g, v || "＿"), py = box.querySelector(".av-py"), tr = box.querySelector(".av-trn");
      if (py) py.textContent = sub(L.l1.py); if (tr) tr.textContent = sub(zh ? L.l1.en : L.l1.zh); if (v) blip(); }; }
  const oi = box.querySelector(".av-own"); if (oi){ oi.onchange = () => { S.own[cur] = oi.value; save(); setLevel(1); }; oi.onkeydown = e => { if (e.key === "Enter"){ S.own[cur] = oi.value; save(); blip(); setLevel(1); } }; }
  const sp = box.querySelector(".av-sp"); if (sp) sp.onclick = e => { if (e.target.closest(".av-w")) return; if (e.target.closest(".av-slot") && !(S.own[cur] || S.pick[cur] != null)) return; blip(); const s = curSentence(); speak(s ? s.text : L.l2.starter); };
  const pk = box.querySelector(".av-peek"); if (pk) pk.onclick = () => { S.peek[cur] = !S.peek[cur]; blip(); pk.classList.toggle("av-on"); if (S.peek[cur]) speak(curSentence().text); };
}
function showPop(w, el){ const pop = q(".av-pop"); pop.querySelector(".av-pw").textContent = w[0]; pop.querySelector(".av-pp").textContent = w[1] || ""; pop.querySelector(".av-pm").textContent = w[2] || "";
  pop.classList.add("av-on"); R.querySelectorAll(".av-w.av-on,.av-chip.av-on2").forEach(x => x.classList.remove("av-on", "av-on2")); el.classList.add(el.classList.contains("av-w") ? "av-on" : "av-on2");
  const pr = pane().getBoundingClientRect(), er = el.getBoundingClientRect();
  pop.style.top = Math.min(er.bottom - pr.top + 10, pr.height - 110) + "px";
  speak(w[0]); pop.querySelector("button").onclick = () => speak(w[0]); }
function hidePop(){ const pop = q(".av-pop"); if (!pop) return; pop.classList.remove("av-on"); R.querySelectorAll(".av-w.av-on,.av-chip.av-on2").forEach(x => x.classList.remove("av-on", "av-on2")); }

// 🎤 说完（AK.mic：点一下或按住都行，在听时红色 + 声波 + 边说边出字，说完自己停，立刻 ✓）
function micDone(d, v){
  const rv = q(".av-rv"); if (!rv || cur !== d) return; const s = curSentence(), m = rv.querySelector(".av-mic"), live = rv.querySelector(".av-heard");
  // 没真的录到（麦克风打不开、没声音、只是示范）：不算说过，不存、不挂上去、不上卡
  const real = v && !v.sim && (v.blob || v.text);
  if (!real){ live.innerHTML = `<span class="av-miss">${esc(C.t.miss())}</span>`; return; }
  // 浏览器能识别，可一个字都没听到：不算说过（照两分钟脱口秀）；只能录音、不能识别的浏览器，录到了就算
  const canHear = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  if (canHear && !String(v.text || "").trim()){ live.innerHTML = `<span class="av-miss">${esc(T("没听到，再说一遍", "Didn't hear you — say it again"))}</span>`; return; }
  const free = +(S.lv[d] || 0) === 2, line = (free ? (v.text || (s && s.text)) : ((s && s.text) || v.text)) || ""; if (!line) return;
  if (S.lines[d] && S.lines[d] !== line && S.give[d]){ delete S.give[d]; rv.querySelectorAll(".av-give button").forEach(x => x.classList.remove("av-on")); }   // 换了一句：送不送给世界重新选
  m.classList.add("av-done"); rv.querySelector(".av-micT").textContent = "✓ " + C.t.done() + " · 🎤";
  tone(1046, 0, .15, .06); tone(1568, .09, .25, .06);
  S.lines[d] = line; if (v && v.blob) keepRec(d, v.blob);
  rv.querySelector(".av-give").classList.add("av-on");
  try { window.hvPx && window.hvPx({k: "advent_say", box: C.id, d, say: line}); } catch(e){}
  if (!S.said.has(d)) collect(d); else { save(); sparks(m); }
}
function collect(d){
  S.said.add(d); save();
  const st = q(".av-stamp"); st.classList.remove("av-on"); void st.offsetWidth; st.classList.add("av-on"); thunk();
  const big = q(".av-stage svg.av-big"); setTimeout(() => { big && big.classList.add("av-fly"); }, 300);
  confetti(q(".av-rv"), 40, true);
  const y = q(".av-yours"); if (y) setTimeout(() => y.classList.add("av-on"), 500);
  renderGrid(); renderColl(d); toast(C.t.toastIn(objName(d)));
  setTimeout(() => { if (isFull()) finale(); }, 900);
}
function renderAns(d){
  const X = A(d), tz = TZ(), r = X.rep, box = q(".av-ansBox"); let h = "";
  if (r){ const main = tz ? r.zh : r.en, py = tz ? r.py : "", tr = tz ? r.en : (UIZ() ? r.zh : ""), lrn = r.learner === "en" ? T("在学英语", "learning English") : r.learner ? T("在学中文", "learning Chinese") : "";
    h += `<div class="av-ans" data-r="1">${r.face ? `<img src="${FACE(r.id)}" alt="" loading="lazy">` : `<div class="av-me" style="background:#8f7a4c">${esc(r.nm[0])}</div>`}<div style="min-width:0"><div class="av-nm"><b>${esc(r.nm)}</b>${lrn ? `<span class="av-tg2">${esc(lrn)}</span>` : ""}${U(r.c) ? " · " + esc(U(r.c)) : ""} · 🎭</div><div class="av-tx" dir="auto">${esc(main)}${r.orig !== (tz ? "zh" : "en") ? ` <span class="av-yi">${esc(T("译", "translated"))}</span>` : ""} <span style="font-size:12px;opacity:.5">🔊</span></div>${py ? `<div class="av-tpy" dir="ltr">${esc(py)}</div>` : ""}${tr ? `<div class="av-tr" dir="auto">${esc(tr)}</div>` : ""}</div><button class="av-heart${S.hearts.has(d) ? " av-on" : ""}" aria-label="like">♥</button></div>`; }
  if (S.mine[d]) h += `<div class="av-ans"><div class="av-me">${esc(T("你", "You"))}</div><div><div class="av-nm"><b>${esc(T("你", "You"))}</b></div><div class="av-tx" dir="auto">${esc(S.mine[d])}</div></div></div>`;
  box.innerHTML = h;
  const el = box.querySelector(".av-ans[data-r]");
  if (el){ el.querySelector(".av-tx").onclick = () => { blip(); el.classList.toggle("av-open"); speak(tz ? r.zh : r.en, tz ? "zh-CN" : "en-GB"); };
    el.querySelector(".av-heart").onclick = e => { const b = e.currentTarget; S.hearts.has(d) ? S.hearts.delete(d) : S.hearts.add(d); save(); b.classList.toggle("av-on"); blip(); if (b.classList.contains("av-on")) sparks(b); }; }
}
function sendMine(d){ const i = q(".av-mineIn"), v = i.value.trim(); if (!v){ i.focus(); return; } S.mine[d] = v; save(); i.value = ""; renderAns(d); chime(); toast(T("留下了", "Saved")); sparks(q(".av-mineGo")); }

/* ================= 收集的地方（圣诞树 / 红门）================= */
function renderColl(fresh){
  const zh = UIZ(), n = S.said.size, h3 = q(".av-coll h3");
  h3.className = zh ? "av-zh" : ""; h3.textContent = C.t.collH(); q(".av-tl").textContent = C.t.collL(n); q(".av-share").textContent = T("做一张卡片", "Make a card");
  q(".av-coll").classList.toggle(C.litCls, isFull()); q(".av-coll").classList.toggle("av-canshare", worldLines().length > 0); q(".av-collSvg").innerHTML = C.collSVG(K, fresh, false);
}
function finale(){
  q(".av-rv").classList.remove("av-on"); renderColl();
  setTimeout(() => {
    const sc = q(".av-scr"), tb = q(".av-coll"); sc.scrollTo({top: tb.offsetTop - 20, behavior: "smooth"});
    const bs = q(".av-bigstamp"); bs.className = "av-bigstamp" + (C.finaleZhCls(K) ? " av-zh" : ""); bs.innerHTML = C.finaleHTML(K);
    void bs.offsetWidth; bs.classList.add("av-on"); C.finaleSnd ? C.finaleSnd(K) : (thunk(), chime(), setTimeout(chime, 500));
    confetti(pane(), 120); setTimeout(() => bs.classList.add("av-off"), 2700);
  }, 600);
}
function confetti(host, n, small){
  const cols = C.confetti || ["#d6be87","#f3e2b5","#9b2a3c","#2f6b4f","#e2552f","#fbf7ee","#14305c"];
  for (let i = 0; i < n; i++){ const c = document.createElement("i"); c.className = "av-cf"; c.style.background = cols[i % cols.length]; c.style.left = Math.random() * 100 + "%"; if (small) c.style.top = (host.scrollTop + 120) + "px";
    host.appendChild(c); const dx = (Math.random() - .5) * 160, dy = (small ? 320 : host.clientHeight) + Math.random() * 80;
    try { c.animate([{transform: "translate(0,0) rotate(0)", opacity: 1}, {transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720}deg)`, opacity: .2}], {duration: 1600 + Math.random() * 1400, delay: Math.random() * 400, easing: "cubic-bezier(.2,.6,.4,1)"}).onfinish = () => c.remove(); } catch(e){ c.remove(); } }
}
function sparks(el){ const host = pane(); if (!host || !el) return; const pr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  for (let i = 0; i < 10; i++){ const p = document.createElement("i"); p.className = "av-pt av-star"; p.style.left = (r.left - pr.left + r.width / 2) + "px"; p.style.top = (r.top - pr.top + r.height / 2) + "px"; host.appendChild(p);
    const a = Math.random() * Math.PI * 2, dd = 24 + Math.random() * 30; try { p.animate([{transform: "translate(-50%,-50%)", opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(a) * dd}px),calc(-50% + ${Math.sin(a) * dd}px)) scale(.3)`, opacity: 0}], {duration: 650}).onfinish = () => p.remove(); } catch(e){ p.remove(); } } }
function toast(m){ const t = q(".av-toast"); if (!t) return; t.textContent = m; t.classList.add("av-on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("av-on"), 2200); }
// 分享卡上的一句：只放送给世界的（没有就不放）
function myLineHTML(){ const ks = worldLines(); if (!ks.length) return "";
  const k = ks.sort((a, b) => b - a)[0];
  return `<div class="av-my" dir="auto">“${esc(S.lines[k])}”<small dir="auto">${esc(T("我说过的一句", "What I said"))} · ${esc(C.dlab(K, k))} · ${esc(cityName(k))}</small></div>`; }
function share(){ blip(); const D = DATA();
  const cities = D.days.filter(x => S.said.has(x.d)).map(x => U(x.city)).join(" · "), c = C.card(K);
  const sh = q(".av-sh");
  sh.innerHTML = `<div class="av-card"><div class="av-to"><span>TO THE WORLD</span><span>FROM ME</span></div><h4 class="${UIZ() ? "av-zh" : ""}">${esc(c.title)}</h4><svg viewBox="${c.vb}">${c.svg}</svg>${myLineHTML()}${cities ? `<div class="av-cl" dir="auto">${esc(cities)}</div>` : ""}${c.extra || ""}<div class="av-u" dir="auto">${esc(c.foot)}</div>
   <div class="av-shb"><button class="av-b" data-avshx>${esc(T("关上", "Close"))}</button></div><div class="av-shn">${esc(T("想发给朋友，截一张图就好。", "To send it to a friend, take a screenshot."))}</div></div>`;
  sh.classList.add("av-on"); chime(); }

/* ================= 外壳：手机上整屏，电脑上中间一只竖着的盒子 ================= */
function fonts(){ if (!C.fonts || document.getElementById(C.rootId + "Fonts")) return; const l = document.createElement("link"); l.id = C.rootId + "Fonts"; l.rel = "stylesheet"; l.href = C.fonts; document.head.appendChild(l); }
function css(){ if (!document.getElementById("advBarCss")){ const b = document.createElement("style"); b.id = "advBarCss"; b.textContent = BAR_CSS; document.head.appendChild(b); }
  if (document.getElementById(C.rootId + "Css")) return; const s = document.createElement("style"); s.id = C.rootId + "Css"; s.textContent = C.css + "\n" + SHELL_CSS.replace(/\.av-root/g, "." + C.scope) + "\n" + (C.barCss || ""); document.head.appendChild(s); }
function build(){
  if (R && document.body.contains(R)) return R;
  css(); fonts();
  R = document.createElement("div"); R.id = C.rootId; R.className = "av-root " + C.scope; R.setAttribute("data-nopy", ""); R.hidden = true;
  R.innerHTML = `<div class="av-pane" role="dialog" aria-modal="true">
   <div class="av-scr"><button class="av-close" data-avclose aria-label="${esc(T("关上", "Close"))}">✕</button>${C.shell(K)}</div>
   <div class="av-rv"></div>
   <div class="av-pop"><div><div class="av-pw" dir="ltr"></div><div class="av-pp" dir="ltr"></div><div class="av-pm" dir="auto"></div></div><button aria-label="${esc(T("听", "Listen"))}">🔊</button></div>
   <div class="av-sh"></div><div class="av-bigstamp"></div><div class="av-toast"></div>
  </div><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${C.defs()}</defs></svg>`;
  document.body.appendChild(R);
  q(".av-grid").addEventListener("click", onGrid);
  q(".av-share").onclick = share;
  R.addEventListener("click", e => {
    if (e.target.closest("[data-avclose]")){ close(); return; }
    if (e.target.closest("[data-avx]")){ closeReveal(); return; }
    if (e.target.closest("[data-avshx]")){ blip(); q(".av-sh").classList.remove("av-on"); return; }
    if (e.target === R){ close(); return; }   // 电脑上点盒子外面
    const pop = q(".av-pop"); if (pop.classList.contains("av-on") && !e.target.closest(".av-pop,.av-w,.av-chip:not(.av-idea)")) hidePop();
  });
  q(".av-rv").addEventListener("scroll", hidePop);
  return R;
}
function open(d){
  P = phase(); if (!P) return false; load(); if (ROLL() && !S.raw.d0){ S.raw.d0 = ymd(new Date()); save(); P = phase(); }   // rolling：第一次打开这天算第 1 格
  build();
  R.setAttribute("dir", UIL() === "ar" ? "rtl" : "ltr"); R.setAttribute("lang", UIL());
  R.hidden = false; document.documentElement.classList.add("av-noscroll");
  q(".av-rv").classList.remove("av-on"); q(".av-sh").classList.remove("av-on");
  renderAll(); q(".av-scr").scrollTop = 0;
  try { window.hvPx && window.hvPx({k: "advent", box: C.id, phase: P.k, day: P.day}); } catch(e){}
  if (d && d >= 1 && d <= N() && stateOf(d) === "open") openReveal(d);
  return true;
}
function close(){ if (!R || R.hidden) return; blip(); hidePop(); try { speechSynthesis.cancel(); } catch(e){} R.hidden = true; document.documentElement.classList.remove("av-noscroll");
  // 回到「今天」：把入口那条的字更新一下（今天这一格开没开）
  document.querySelectorAll(`[data-advopen="${C.id}"]`).forEach(b => { const t = document.createElement("div"); t.innerHTML = bar(); const n = t.firstElementChild; if (n) b.replaceWith(n); }); }
document.addEventListener("keydown", e => { if (e.key !== "Escape" || !R || R.hidden) return; if (q(".av-sh").classList.contains("av-on")){ q(".av-sh").classList.remove("av-on"); return; } if (!closeReveal()) close(); });

/* ================= 「今天」最上面那一条（骨架，不能移除） ================= */
function bar(){
  const p = phase(); if (!p) return ""; css(); const st = load(), zh = UIZ(), b = C.bar(K, p, st);
  return `<button class="adv-bar ${C.barCls || ""}" data-advopen="${C.id}" type="button"><span class="adv-gift">${b.emoji}</span><span class="adv-tx"><b${zh ? ' class="adv-zh"' : ""}>${esc(b.big)}</b><small>${esc(b.small)} ›</small></span><span class="adv-num">${esc(b.num)}</span></button>`;
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest(`[data-advopen="${C.id}"]`); if (!b) return; e.preventDefault(); open(); });

return {bar, open, close, phase};
};
window.ADV_MK.T = T;
})();

// 🎄 圣诞倒数日历 · 世界礼盒（2026-11-14，样板 样板/圣诞倒数日历样板.html）：一只 24 格的首饰柜，说过的小东西挂上你的圣诞树。
// 11 月只倒数（12 月 1 日开第一格）；12-01 到 12-24 一天开一格；12-25 到 1-06 还能补开，24 件都挂上树才亮。进度 advent.v1。
// 入口：「今天」最上面一条「🎁 离圣诞还有 N 天」（ADVENT.bar()），是骨架，today_hide.js 不给它 ×。对外 window.ADVENT = {bar, open, close, phase}
(function(){
if (window.ADVENT || !window.ADV_MK) return;
const T_ = window.ADV_MK.T;
/* ================= 24 件小东西（照 JSON 里的 look 画；跟样板一样） ================= */
const SH=(rx=78,cy=162)=>`<ellipse cx="100" cy="${cy}" rx="${rx}" ry="11" fill="#000" opacity=".22"/>`;
const flame=(x,y,s=1)=>`<circle cx="${x}" cy="${y-6*s}" r="${13*s}" fill="url(#av-glow)"><animate attributeName="opacity" values=".55;1;.55" dur="1.7s" repeatCount="indefinite"/></circle><path d="M${x} ${y}c${-3.6*s} ${-3*s} ${-3.4*s} ${-8*s} 0 ${-13*s}c${3.4*s} ${5*s} ${3.6*s} ${10*s} 0 ${13*s}z" fill="url(#av-flame)"/>`;
const star=(cx,cy,R,r,n,rot=-90)=>{let p=[];for(let i=0;i<n*2;i++){const a=(rot+i*180/n)*Math.PI/180,rr=i%2?r:R;p.push((cx+rr*Math.cos(a)).toFixed(1)+","+(cy+rr*Math.sin(a)).toFixed(1))}return p.join(" ")};
const lights=(pts,cols,r=2.6)=>pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[i%cols.length]}"/><circle cx="${x}" cy="${y}" r="${r*2.2}" fill="${cols[i%cols.length]}" opacity=".18"/>`).join("");
function inTri(n,top,bot,half,seed){const out=[];let s=seed;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280};while(out.length<n){const y=top+(bot-top)*rnd(),w=half*(y-top)/(bot-top)*.82,x=100+(rnd()*2-1)*w;out.push([x.toFixed(1),y.toFixed(1)])}return out}
function candy(x,y,c,rot=0){return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-9 0l-5-4v8z M9 0l5-4v8z" fill="${c}"/><ellipse rx="8" ry="5" fill="${c}"/><path d="M-4-4.5q4 4.5 0 9M2-4.5q4 4.5 0 9" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></g>`}
function dump(x,y,s){let pl="";for(let i=0;i<7;i++){const t=-38+i*12.6,yy=-25+Math.pow(t/44,2)*22;pl+=`<path d="M${t.toFixed(1)} ${yy.toFixed(1)}q2 7 -1 13" fill="none" stroke="#d2bf98" stroke-width="1.2" stroke-linecap="round"/>`}
 return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="16" rx="50" ry="8" fill="#000" opacity=".14"/><path d="M-52 10C-46-18-22-32 0-32C22-32 46-18 52 10C30 22-30 22-52 10Z" fill="url(#av-dough)" stroke="#cdb994" stroke-width="1.2"/><path d="M-44 2C-36-20-18-29 0-29C18-29 36-20 44 2" fill="none" stroke="#f9f2e3" stroke-width="6" stroke-linecap="round"/><path d="M-44 2C-36-20-18-29 0-29C18-29 36-20 44 2" fill="none" stroke="#d8c7a2" stroke-width="6" stroke-dasharray="1.5 6" stroke-linecap="round"/>${pl}<ellipse cx="-14" cy="-4" rx="15" ry="5" fill="#fff" opacity=".55"/></g>`}
const steam=(x,y,d)=>`<path d="M${x} ${y}c-7-9 7-15 0-25c-6-9 6-14 0-22" fill="none" stroke="#efe6d3" stroke-width="2.4" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;.85;0" dur="3s" begin="${d}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 6;0 -8" dur="3s" begin="${d}s" repeatCount="indefinite"/></path>`;

const DRAW={
 1:()=>{let g="";for(let r=0;r<4;r++)for(let c=0;c<6;c++){const x=50+c*15.6,y=76+r*17.6;g+=`<rect x="${x}" y="${y}" width="13" height="15" fill="${r+c===0?"#fff6e0":"#f6ecd2"}" stroke="#c9a35a" stroke-width=".6"/>`;if(r+c)g+=`<text x="${x+6.5}" y="${y+10}" font-size="6" text-anchor="middle" fill="#b39566" font-family="Bodoni Moda,serif">${r*6+c+1}</text>`}
  const angel=`<g transform="translate(56.5 83.5)"><ellipse cx="-3.2" cy="1" rx="3" ry="4" fill="#fff" stroke="#c9a35a" stroke-width=".3"/><ellipse cx="3.2" cy="1" rx="3" ry="4" fill="#fff" stroke="#c9a35a" stroke-width=".3"/><path d="M0-1l-3.4 7.6h6.8z" fill="#7fa7d6"/><circle cy="-2.6" r="1.9" fill="#f2c9a0"/><ellipse cy="-5" rx="2.4" ry=".8" fill="none" stroke="#d6a93a" stroke-width=".7"/></g>`;
  const pic=(x,y,r,col,inner)=>`<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-8" y="-9" width="16" height="18" fill="#fffaf0" stroke="#d8c7a2" stroke-width=".6"/><rect x="-6" y="-7" width="12" height="14" fill="${col}"/>${inner}</g>`;
  return SH(80)+`<g transform="rotate(-6 100 105)"><rect x="38" y="48" width="112" height="108" rx="3" fill="#e9d6a8" stroke="#b8975a"/><rect x="38" y="48" width="112" height="108" rx="3" fill="url(#av-age)"/><rect x="44" y="54" width="100" height="96" fill="none" stroke="#a8322d" stroke-width="1.6"/><rect x="44" y="54" width="100" height="17" fill="#a8322d"/><path d="M48 58h92M48 67h92" stroke="#d6be87" stroke-width=".6"/><text x="94" y="66" font-size="8.5" fill="#f3e2b5" text-anchor="middle" font-family="Georgia" letter-spacing="1.5">ADVENT</text>${g}${angel}</g>`
   +pic(160,128,16,"#c8402f",`<circle r="3.4" fill="#f3e2b5"/>`)+pic(150,152,-10,"#2f6b4f",`<path d="M0-5l4 9h-8z" fill="#f3e2b5"/>`)+pic(172,150,30,"#2c4f8f",`<path d="M0-4l1.2 3h3l-2.4 2 1 3-2.8-1.8-2.8 1.8 1-3-2.4-2h3z" fill="#f3d26b"/>`)
   +`<g transform="translate(40 158) rotate(-24)"><circle cx="-7" cy="0" r="5.5" fill="none" stroke="#a8322d" stroke-width="3"/><circle cx="7" cy="0" r="5.5" fill="none" stroke="#a8322d" stroke-width="3"/><path d="M-4-4L18-26M4-4L-18-26" stroke="#c9ced4" stroke-width="3" stroke-linecap="round" transform="rotate(180)"/><circle r="1.6" fill="#8c6f3a"/></g>`},
 2:()=>`<ellipse cx="100" cy="156" rx="74" ry="15" fill="#eef4f8" stroke="#c9d8e4"/><path d="M50 156q50 -8 100 0" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/><path d="M60 160q20-4 34 1M112 158q14-3 26 2" stroke="#b9cbd9" stroke-width=".8" fill="none"/>
   <rect x="95" y="138" width="10" height="16" fill="#5b3a1e"/><path d="M100 36L134 84L120 84L148 120L130 120L158 150L42 150L70 120L52 120L80 84L66 84Z" fill="url(#av-pine)"/><path d="M100 36L134 84L120 84L148 120L130 120L158 150L100 150Z" fill="#000" opacity=".14"/>`
   +lights(inTri(30,52,146,58,7),["#ff6b6b","#ffd24a","#5ac8ff","#7be07b","#ff9be0"])
   +`<polygon points="${star(100,32,15,6,8,-90)}" fill="#e9f5ff" stroke="#9fc3e6" stroke-width="1"/><polygon points="${star(100,32,8,3.5,8,-67.5)}" fill="#fff"/><circle cx="100" cy="32" r="22" fill="url(#av-glow)" opacity=".6"/>`,
 3:()=>{const win=(x,y,w,h)=>`<path d="M${x} ${y+h}v${-h+w/2}a${w/2} ${w/2} 0 0 1 ${w} 0v${h-w/2}z" fill="#1d2a55" stroke="#f3d26b" stroke-width=".8"/>`;
  return SH(70)+`<rect x="46" y="132" width="108" height="22" fill="#b8312f" stroke="#f3d26b" stroke-width="1.2"/><path d="M48 138h104M48 148h104" stroke="#f3d26b" stroke-width=".8" stroke-dasharray="3 2"/>
  <rect x="58" y="88" width="84" height="46" fill="#f2c94c" stroke="#a3864d"/><rect x="58" y="88" width="84" height="46" fill="url(#av-foil)" opacity=".5"/>${win(66,96,12,28)}${win(122,96,12,28)}
  <path d="M84 132V106a16 16 0 0 1 32 0V132z" fill="#1d2a55" stroke="#f3e2b5" stroke-width="1.4"/><path d="M90 128l4-8h12l4 8z" fill="#8a5a32"/><path d="M92 121l4-3 4 2 4-3 4 4" stroke="#f2c94c" stroke-width="1.4" fill="none"/><circle cx="100" cy="117" r="2.4" fill="#f2c9a0"/><circle cx="100" cy="104" r="6" fill="url(#av-glow)"/>
  <rect x="56" y="46" width="24" height="44" fill="#c9ced8" stroke="#8a93a3"/><rect x="56" y="58" width="24" height="5" fill="#c8402f"/><rect x="56" y="76" width="24" height="5" fill="#c8402f"/>${win(63,64,10,12)}<path d="M56 46L68 12L80 46z" fill="#e2b84a" stroke="#a3864d"/><circle cx="68" cy="11" r="2.4" fill="#f3e2b5"/>
  <rect x="120" y="62" width="24" height="28" fill="#d24b3f" stroke="#8e2a22"/><rect x="120" y="70" width="24" height="4" fill="#f2c94c"/>${win(127,76,10,12)}<path d="M120 62L132 36L144 62z" fill="#c9ced8" stroke="#8a93a3"/><circle cx="132" cy="35" r="2.2" fill="#f3e2b5"/>
  <ellipse cx="100" cy="88" rx="16" ry="9" fill="#5a9bd5" stroke="#f3d26b"/><path d="M100 79v-8" stroke="#f3d26b" stroke-width="1.4"/><circle cx="100" cy="70" r="2" fill="#f3e2b5"/>
  <g fill="#fff">${[[74,40],[140,52],[90,74],[150,100],[50,110],[112,140]].map(([x,y])=>`<polygon points="${star(x,y,4,1.2,4)}"><animate attributeName="opacity" values="1;.2;1" dur="${1.4+x%5*.3}s" repeatCount="indefinite"/></polygon>`).join("")}</g>`},
 4:()=>{const tin=(x1,y1,x2,y2)=>{let o=`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#c99a2e" stroke-width="5" stroke-linecap="round"/>`;for(let i=0;i<=10;i++){const u=i/10,x=x1+(x2-x1)*u,y=y1+(y2-y1)*u;for(let k=0;k<4;k++){const a=(i*47+k*90)*Math.PI/180,l=3.4+((i+k)%3);o+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a)*l).toFixed(1)} ${(Math.sin(a)*l).toFixed(1)}" stroke="${["#f6d76b","#fff3c0","#e0b443","#ffe9a0"][(i+k)%4]}" stroke-width="1.3" stroke-linecap="round"/>`}}return o};
  const ff=(t)=>`<g transform="${t}"><path d="M0-34C-12-34-15-10-12 14C-9 36 12 36 13 14C15-10 12-34 0-34Z" fill="#2f7fc0" stroke="#1f5f95" stroke-width="1.5"/><path d="M0-29C-8-29-10-10-8 12C-6 29 8 29 9 12C10-10 8-29 0-29Z" fill="#5aa6e0"/>${tin(0,-20,-11,2)}${tin(0,-20,11,2)}<circle cy="-20" r="3" fill="#f6d76b"/><polygon points="${star(-9,-6,4,1.2,4)}" fill="#fff"/><polygon points="${star(8,-12,3.4,1,4)}" fill="#fff"/></g>`;
  return `<ellipse cx="100" cy="138" rx="90" ry="34" fill="#f1d9a6"/><g fill="#d9bb7f">${Array.from({length:26},(_,i)=>`<circle cx="${20+((i*37)%160)}" cy="${112+((i*23)%52)}" r="${.8+(i%3)*.4}"/>`).join("")}</g>`
   +ff("translate(76 114) rotate(-14) scale(1.15 .9)")+ff("translate(122 110) rotate(10) scale(1.15 .9)")
   +`<g transform="translate(160 152) rotate(-10)"><path d="M0 0C-16-2-18-20-8-26C-2-30 2-30 8-26C18-20 16-2 0 0Z" fill="#f6c9b8" stroke="#d89c86"/><path d="M0 0L-12-18M0 0L-6-24M0 0L0-27M0 0L6-24M0 0L12-18" stroke="#d89c86" stroke-width="1"/></g><circle cx="38" cy="96" r="20" fill="url(#av-glow)" opacity=".5"/>`},
 5:()=>{const M="50,150 50,58 74,58 100,98 126,58 150,58 150,150 128,150 128,100 100,138 72,100 72,150";
  let torn="M40 110";for(let i=0;i<14;i++)torn+=` L${48+i*8} ${i%2?104:114}`;torn+=" L160 170 L40 170Z";
  return SH(70,160)+`<defs><clipPath id="av-cpM"><polygon points="${M}"/></clipPath></defs><polygon points="${M}" transform="translate(7 7)" fill="#2a140a"/><polygon points="${M}" fill="#6b3a1f"/><polygon points="${M}" fill="url(#av-choc)"/><path d="M53 62L73 62L100 102" stroke="#9a6440" stroke-width="2" fill="none" opacity=".7"/>
  <g clip-path="url(#av-cpM)"><path d="${torn}" fill="url(#av-silver)"/><path d="M56 128l10 6M84 124l6 10M118 130l12 4M136 120l8 8" stroke="#8b939c" stroke-width=".8"/></g>`},
 6:()=>`<rect x="26" y="140" width="148" height="24" rx="4" fill="#8a6a3e"/><path d="M30 146h140M30 152h140M30 158h140" stroke="#6b4f2a" stroke-width="1.6"/>
   <path d="M60 156L46 40M52 92l-12-10M56 120l12-8M50 66l10-6" stroke="#6b4526" stroke-width="2.4" stroke-linecap="round"/>
   ${candy(92,56,"#c8402f",-20)}${candy(110,50,"#2f8a5a",15)}${candy(122,60,"#e2b84a",40)}
   <path d="M80 64L120 64L120 116C120 124 126 128 136 130C152 133 158 140 158 148L158 152L76 152L76 70Z" fill="url(#av-leather)"/><rect x="74" y="150" width="86" height="7" rx="2" fill="#1a0f08"/><rect x="76" y="60" width="48" height="12" rx="3" fill="#5a3a22"/><path d="M88 74v70" stroke="#fff" stroke-width="3" opacity=".18" stroke-linecap="round"/><path d="M128 134q14 2 22 10" stroke="#fff" stroke-width="2.4" opacity=".3" fill="none" stroke-linecap="round"/><g fill="#d6be87">${[84,94,104,114].map(y=>`<circle cx="118" cy="${y}" r="1.6"/>`).join("")}</g>`,
 7:()=>`<rect x="26" y="146" width="148" height="20" fill="#a8957a"/><rect x="26" y="140" width="148" height="8" fill="#c9b79a"/><circle cx="100" cy="104" r="60" fill="url(#av-glow)" opacity=".55"/>
   <path d="M100 36v14" stroke="#3a3a3a" stroke-width="1.6"/><path d="M84 50q16-14 32 0" stroke="#3a3a3a" stroke-width="1.6" fill="none"/><rect x="74" y="50" width="52" height="8" rx="2" fill="#2e2a26"/>
   <rect x="72" y="58" width="56" height="80" rx="10" fill="#d6402f"/><rect x="90" y="58" width="20" height="80" fill="#f2c230"/><rect x="110" y="58" width="18" height="80" rx="0" fill="#3a9a5a"/><path d="M110 58h8a10 10 0 0 1 10 10v60a10 10 0 0 1 -10 10h-8z" fill="#3a9a5a"/><path d="M72 68v60M90 58v80M110 58v80" stroke="#000" stroke-opacity=".12"/>
   <rect x="72" y="58" width="56" height="80" rx="10" fill="url(#av-lamp)"/>
   <g fill="#fff6c8">${[[81,78],[81,112],[100,94],[100,124],[119,80],[119,110]].map(([x,y])=>`<polygon points="${star(x,y,5,2,5)}"/>`).join("")}</g><rect x="74" y="136" width="52" height="7" rx="2" fill="#2e2a26"/>`,
 8:()=>`<rect x="38" y="26" width="124" height="112" fill="#0f1d3a"/><g fill="#fff" opacity=".8"><circle cx="58" cy="42" r="1"/><circle cx="140" cy="38" r="1.2"/><circle cx="120" cy="60" r=".8"/><circle cx="66" cy="70" r=".8"/></g><path d="M38 108q30-14 62-4t62-6V138H38z" fill="#16264a"/><g fill="#f3c46a" opacity=".85"><rect x="52" y="112" width="3" height="4"/><rect x="66" y="108" width="3" height="4"/><rect x="134" y="106" width="3" height="4"/><rect x="146" y="110" width="3" height="4"/></g>
   <rect x="38" y="26" width="124" height="112" fill="none" stroke="#efe6d2" stroke-width="7"/><path d="M100 26v112M38 82h124" stroke="#efe6d2" stroke-width="4"/>
   <rect x="22" y="136" width="156" height="14" rx="2" fill="#d9cdb5"/><rect x="22" y="148" width="156" height="6" fill="#b8a98c"/>
   ${flame(100,114,1)}<rect x="96" y="114" width="8" height="10" fill="#fffaf0"/><path d="M84 112h32l-3 26h-26z" fill="#fff" opacity=".22" stroke="#fff" stroke-opacity=".6"/><path d="M85.5 124h29l-1.6 14h-25.8z" fill="#e98a8a" opacity=".85"/><path d="M88 114l-1 22" stroke="#fff" stroke-width="1.6" opacity=".6"/>`,
 9:()=>`<ellipse cx="100" cy="150" rx="82" ry="20" fill="#fff" stroke="#e4dccb"/><ellipse cx="100" cy="148" rx="66" ry="14" fill="none" stroke="#efe7d6"/>
   <path d="M44 120L140 92L160 104L66 136Z" fill="#fffaf2"/><path d="M66 136L160 104L160 138L66 160Z" fill="#fffdf8" stroke="#eadfcc"/><path d="M66 146L160 118L160 124L66 152Z" fill="#f3d48a"/><path d="M66 134L160 106L160 110L66 138Z" fill="#f3d48a" opacity=".0"/><path d="M66 139L160 111L160 116L66 144Z" fill="#f3d48a"/>
   <g fill="#e2384a">${[78,96,114,132,150].map((x,i)=>`<path d="M${x} ${147-i*5.6}a4 3 0 0 1 8 0z"/>`).join("")}</g><path d="M44 120L66 136L66 160L44 142Z" fill="#f7efe0"/><path d="M44 130L66 146L66 152L44 136Z" fill="#f3d48a"/>
   <path d="M120 96q4-8 10-2q6-8 10 2q2 6-10 8q-12-2-10-8z" fill="#fff" stroke="#eee3d0"/>
   <path d="M130 70c-10 0-14 10-10 18c3 6 8 9 10 11c2-2 7-5 10-11c4-8 0-18-10-18z" fill="#e2384a"/><path d="M130 70c-4-6-10-4-12-2c4 0 8 1 12 2c4-1 8-2 12-2c-2-2-8-4-12 2z" fill="#3f8a4a"/><g fill="#ffd9a0">${[[125,80],[134,80],[129,88],[124,90],[135,90]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.4"/>`).join("")}</g><ellipse cx="125" cy="78" rx="2" ry="4" fill="#fff" opacity=".45"/>
   <g transform="translate(88 92)"><path d="M0 0l-7 18h14z" fill="#d6402f"/><circle cy="-2" r="4" fill="#f2c9a0"/><path d="M-4-4l4-10 4 10z" fill="#d6402f"/><circle cy="-14" r="1.6" fill="#fff"/><path d="M-4 0q4 6 8 0" fill="#fff"/></g>`,
 10:()=>`<rect x="96" y="140" width="8" height="14" fill="#5b3a1e"/><path d="M100 20L118 60L110 60L126 96L116 96L134 140L66 140L84 96L74 96L90 60L82 60Z" fill="url(#av-pine)"/><path d="M100 20L118 60L110 60L126 96L116 96L134 140L100 140Z" fill="#000" opacity=".15"/>`
   +lights(inTri(34,34,136,38,3),["#fffbe8"],2.2)
   +`<ellipse cx="100" cy="156" rx="60" ry="8" fill="#000" opacity=".2"/><rect x="146" y="128" width="3" height="28" fill="#6b4526"/><rect x="128" y="112" width="40" height="22" rx="2" fill="#f4ead2" stroke="#a3864d"/>
   <g transform="translate(131 116)"><rect width="16" height="11" fill="#22408c"/><path d="M0 0L16 11M16 0L0 11" stroke="#fff" stroke-width="2.4"/><path d="M8 0v11M0 5.5h16" stroke="#fff" stroke-width="3.4"/><path d="M8 0v11M0 5.5h16" stroke="#c8202f" stroke-width="1.8"/></g>
   <g transform="translate(149 116)"><rect width="16" height="11" fill="#c8202f"/><path d="M5.5 0v11M0 5.5h16" stroke="#fff" stroke-width="3"/><path d="M5.5 0v11M0 5.5h16" stroke="#22408c" stroke-width="1.5"/></g>`,
 11:()=>{let fr="";[[40,34,1],[160,34,-1],[40,128,1]].forEach(([x,y,s])=>{for(let i=0;i<5;i++){const a=(i*22+(s>0?0:90))*Math.PI/180;fr+=`<path d="M${x} ${y}l${(Math.cos(a)*26*s).toFixed(1)} ${(Math.sin(a)*26*(y>100?-1:1)).toFixed(1)}" stroke="#e8f4ff" stroke-width="1.2" opacity=".75"/>`}});
  return `<rect x="30" y="24" width="140" height="116" fill="#24395e"/><path d="M30 24h140v116H30z" fill="url(#av-frost)"/>${fr}<rect x="30" y="24" width="140" height="116" fill="none" stroke="#efe6d2" stroke-width="7"/><path d="M100 24v116" stroke="#efe6d2" stroke-width="4"/>
   <rect x="16" y="138" width="168" height="14" rx="2" fill="#d9cdb5"/><rect x="16" y="150" width="168" height="6" fill="#b8a98c"/>
   <ellipse cx="146" cy="122" rx="12" ry="9" fill="#b88a52"/><circle cx="142" cy="119" r="1" fill="#7a5a32"/><circle cx="150" cy="124" r="1" fill="#7a5a32"/>
   ${candy(92,102,"#2f8a5a",-25)}
   <path d="M60 138C58 116 76 108 94 110L116 114C136 118 146 126 146 136L146 140L60 140Z" fill="#c0392b"/><path d="M62 120q40-6 80 10" stroke="#f3e2b5" stroke-width="5" stroke-dasharray="3 3" fill="none"/><path d="M62 128q40-6 82 8" stroke="#8e2a22" stroke-width="1" fill="none"/><path d="M76 112q8-8 22-2" stroke="#e05a4a" stroke-width="7" stroke-linecap="round" fill="none"/>`},
 12:()=>{const rose=(x,y,r)=>`<g transform="translate(${x} ${y})"><circle r="${r}" fill="#8e1426"/><path d="M0 0m-${r*.6} 0a${r*.6} ${r*.6} 0 1 1 ${r*.9} ${r*.4}M0 0m-${r*.3} -${r*.2}a${r*.35} ${r*.35} 0 1 1 ${r*.5} ${r*.3}" stroke="#c22a40" stroke-width="1.6" fill="none"/><circle r="${r}" fill="url(#av-velv)" opacity=".5"/></g>`;
  let fray="";for(let i=0;i<=22;i++){const x=40+i*5.5,y=166+Math.sin(i*.9)*1.5;fray+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(i%2?1:-1)*1.2} 5" stroke="#b39a6c" stroke-width="1.1"/>`}
  return SH(72,174)+`<g fill="#4f8a3a">${[[46,172,-25],[156,172,22]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="13" ry="7"/><g fill="#d8e8a0">${[[-5,-2],[3,2],[6,-3],[-2,3]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r=".9"/>`).join("")}</g></g>`).join("")}</g>
   <path d="M100 28C86 30 66 36 54 50C46 80 40 130 38 166Q100 172 162 166C160 130 154 80 146 50C134 36 114 30 100 28Z" fill="#d6c39b"/><path d="M100 28C86 30 66 36 54 50C46 80 40 130 38 166Q100 172 162 166C160 130 154 80 146 50C134 36 114 30 100 28Z" fill="url(#av-cloth)"/>
   <g fill="none" stroke="#bea77a" stroke-width="1.4" stroke-linecap="round"><path d="M70 44C64 80 58 120 56 164"/><path d="M86 36C84 70 82 110 80 168"/><path d="M114 36C116 70 118 110 120 168"/><path d="M130 44C136 80 142 120 144 164"/></g>${fray}
   <path d="M100 30L100 166" stroke="#b39a6c" stroke-width="1.2" opacity=".6"/>
   ${rose(78,92,12)}${rose(102,86,13)}${rose(124,94,12)}${rose(90,104,11)}${rose(114,106,11)}
   <g fill="#2f6b3f"><ellipse cx="66" cy="98" rx="9" ry="4" transform="rotate(-30 66 98)"/><ellipse cx="136" cy="90" rx="9" ry="4" transform="rotate(30 136 90)"/></g>
   <path d="M50 108Q100 124 150 108L156 140Q100 156 44 140Z" fill="#e3d2ae"/><path d="M50 108Q100 124 150 108" stroke="#b39a6c" stroke-width="1.6" fill="none"/><g stroke="#c4ae84" stroke-width="1" fill="none"><path d="M64 116q4 14 2 26"/><path d="M100 120v30"/><path d="M136 116q-4 14-2 26"/></g>
   ${rose(150,156,8)}${rose(60,160,7)}
   <path d="M92 30q8 8 16 0" stroke="#8a6a3e" stroke-width="2.2" fill="none"/><path d="M100 34l-6 14M100 34l5 15" stroke="#8a6a3e" stroke-width="1.6" stroke-linecap="round"/><circle cx="100" cy="34" r="3" fill="#8a6a3e"/>`},
 13:()=>{const p="M64 90C46 94 38 72 54 63C72 52 94 66 97 88L103 112C108 135 134 146 150 133C162 122 151 104 137 109";
  return `<ellipse cx="96" cy="146" rx="84" ry="20" fill="#000" opacity=".22"/><ellipse cx="96" cy="134" rx="80" ry="28" fill="#f6eedd" stroke="#d6be87" stroke-width="1.5"/>
  <g transform="translate(-6 30) scale(1 .78)"><path d="${p}" fill="none" stroke="#8a4c0e" stroke-width="31" stroke-linecap="round" transform="translate(0 5)" opacity=".55"/><path d="${p}" fill="none" stroke="url(#av-saff)" stroke-width="29" stroke-linecap="round"/><path d="${p}" fill="none" stroke="#ffe08a" stroke-width="7" stroke-linecap="round" transform="translate(-3 -6)" opacity=".6"/>
  <circle cx="64" cy="78" r="7.5" fill="#2a120c"/><circle cx="62" cy="76" r="2" fill="#a0604c"/><circle cx="137" cy="121" r="7.5" fill="#2a120c"/><circle cx="135" cy="119" r="2" fill="#a0604c"/><g fill="#fff6d8"><circle cx="86" cy="70" r="1.4"/><circle cx="112" cy="128" r="1.2"/><circle cx="100" cy="98" r="1.1"/></g></g>
  <ellipse cx="170" cy="150" rx="12" ry="4" fill="#d6be87"/><rect x="164" y="104" width="12" height="46" rx="2" fill="url(#av-cWhite)"/><ellipse cx="170" cy="104" rx="6" ry="1.8" fill="#fffdf6"/><path d="M170 104v-4" stroke="#3a2a1a"/>${flame(170,100,1.1)}`},
 14:()=>`${SH(80,156)}<g transform="rotate(-4 100 100)"><rect x="28" y="62" width="146" height="82" rx="7" fill="#fffdf7" stroke="#d8cdb5"/><path d="M28 69a7 7 0 0 1 7-7h132a7 7 0 0 1 7 7v11H28z" fill="#14305c"/><text x="38" y="75" font-size="7.5" fill="#f3e2b5" font-family="Georgia" letter-spacing="1.5">BOARDING PASS</text>
   <path d="M134 80v64" stroke="#c9bfa8" stroke-dasharray="3 3"/><text x="40" y="92" font-size="6" fill="#9a917c" font-family="Arial">TO</text><text x="38" y="118" font-size="28" font-weight="700" fill="#14305c" font-family="Georgia">LOS</text>
   <path d="M88 108l14 0M95 101l7 7-7 7" stroke="#e2552f" stroke-width="2" fill="none"/><text x="40" y="132" font-size="6" fill="#9a917c" font-family="Arial">NAME</text><path d="M62 134h64" stroke="#c9bfa8"/>
   <g fill="#14305c">${Array.from({length:16},(_,i)=>`<rect x="${142+i*1.9}" y="96" width="${i%3?1:1.6}" height="36"/>`).join("")}</g>
   <g transform="translate(142 58) rotate(14)"><rect x="-6" y="-6" width="38" height="34" fill="#f08a24"/><g fill="#1d4f9a">${[[4,4],[20,4],[12,14],[4,24],[20,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join("")}</g><g fill="#3fb06a">${[[12,4],[4,14],[20,14],[12,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6"/>`).join("")}</g><g fill="#ffe04a">${[[4,4],[20,4],[12,14],[4,24],[20,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.4"/>`).join("")}</g><path d="M4 30L4 -2" stroke="#9aa3ad" stroke-width="1.2"/><circle cx="4" cy="-3" r="2.4" fill="#c8202f"/></g></g>`,
 15:()=>{const kul=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="10" ry="6.5" fill="#e8b860"/><path d="M-7-3q7-5 14 0M-8 1q8-5 16 0M-6 4q6-4 12 0" stroke="#c48a3a" stroke-width="1.1" fill="none"/><g fill="#fff">${[[-4,-2],[3,-1],[0,3],[5,2]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r=".8"/>`).join("")}</g></g>`;
  const neu=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-14 4A14 14 0 0 1 14 4Z" fill="#f0d49a" stroke="#c9a35a"/><path d="M-14 4A14 14 0 0 1 14 4" stroke="#e2bd76" stroke-width="3.4" stroke-dasharray="1.6 2.6" fill="none"/></g>`;
  const coco=(x,y)=>`<rect x="${x}" y="${y}" width="13" height="10" rx="2.5" fill="#fbf3e0" stroke="#e6d4b0"/><rect x="${x}" y="${y}" width="13" height="4" rx="2" fill="#f6c6c9" opacity=".7"/>`;
  return `<path d="M14 132C40 88 160 84 190 120C160 168 40 172 14 132Z" fill="#3f8a3a"/><path d="M18 130C60 120 140 116 186 120" stroke="#2c6a2a" stroke-width="2" fill="none"/><g stroke="#57a34e" stroke-width=".8">${Array.from({length:12},(_,i)=>`<path d="M${30+i*13} ${126-i*.3}l-6 ${i%2?-14:14}"/>`).join("")}</g>
   <ellipse cx="100" cy="132" rx="70" ry="24" fill="#a35f2a"/><ellipse cx="100" cy="128" rx="64" ry="20" fill="url(#av-copper)"/><ellipse cx="100" cy="128" rx="54" ry="15" fill="none" stroke="#e7a56a" stroke-width=".8" opacity=".7"/>
   ${neu(80,126,-10)}${neu(98,136,8)}${kul(118,120,15)}${kul(130,132,-20)}${kul(108,124,40)}${coco(64,130)}${coco(140,124)}${coco(120,138)}`},
 16:()=>{const P=[];for(let i=0;i<5;i++){const a=(-90+i*72)*Math.PI/180;P.push([100+60*Math.cos(a),88+60*Math.sin(a)])}
  return `<circle cx="100" cy="90" r="74" fill="url(#av-glow)" opacity=".55"/><path d="M${P[2][0].toFixed(1)} ${P[2][1].toFixed(1)}q-6 30 4 60q-4 10 2 20" stroke="#f2c230" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${P[3][0].toFixed(1)} ${P[3][1].toFixed(1)}q6 30 -4 60q4 10 -2 20" stroke="#d6402f" stroke-width="5" fill="none" stroke-linecap="round"/>
   <g stroke="#fff3c0" stroke-width="1" opacity=".7"><path d="M${P[2][0].toFixed(1)} ${(P[2][1]+20).toFixed(1)}h-6M${P[2][0].toFixed(1)} ${(P[2][1]+40).toFixed(1)}h-6"/></g>
   <polygon points="${star(100,88,62,25,5)}" fill="#d6402f"/><polygon points="${star(100,88,40,16,5)}" fill="#f2c230"/><polygon points="${star(100,88,62,25,5)}" fill="url(#av-lamp)"/><circle cx="100" cy="88" r="16" fill="#fff6c8" opacity=".85"/>
   <polygon points="${star(100,88,62,25,5)}" fill="none" stroke="#b48a4a" stroke-width="2.4"/>${P.map(([x,y])=>`<path d="M100 88L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#b48a4a" stroke-width="1.4" opacity=".8"/>`).join("")}`},
 17:()=>{let c="";const cols=["#f39c34","#4cb86a","#e84a8a","#ffd34a","#5ab0e8","#f39c34","#4cb86a"];for(let i=0;i<7;i++){const a=(-90+i*360/7)*Math.PI/180,bx=100+30*Math.cos(a),by=96+30*Math.sin(a),tx=100+74*Math.cos(a),ty=96+74*Math.sin(a),px=-Math.sin(a)*12,py=Math.cos(a)*12;
   c+=`<path d="M${(bx+px).toFixed(1)} ${(by+py).toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}L${(bx-px).toFixed(1)} ${(by-py).toFixed(1)}Z" fill="${cols[i]}"/><path d="M${(bx+px).toFixed(1)} ${(by+py).toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}" stroke="#fff" stroke-opacity=".5"/>`;
   for(let k=-2;k<=2;k++)c+=`<path d="M${tx.toFixed(1)} ${ty.toFixed(1)}l${(Math.cos(a+k*.25)*14).toFixed(1)} ${(Math.sin(a+k*.25)*14+6).toFixed(1)}" stroke="${["#e84a8a","#f39c34","#4cb86a"][(i+k+3)%3]}" stroke-width="2" stroke-linecap="round"/>`}
  return SH(56,170)+c+`<circle cx="100" cy="96" r="34" fill="#e84a8a"/><path d="M68 90q32-12 64 0M67 102q33-12 66 0" stroke="url(#av-foil)" stroke-width="6" fill="none"/><circle cx="100" cy="96" r="34" fill="url(#av-glass)" opacity=".7"/>`},
 18:()=>`<rect x="34" y="150" width="132" height="10" fill="#bdb3a0"/><rect x="44" y="70" width="11" height="80" fill="#c8402f"/><rect x="145" y="70" width="11" height="80" fill="#c8402f"/><rect x="38" y="64" width="124" height="10" fill="#2f8a6a"/><g fill="#f2c230">${Array.from({length:12},(_,i)=>`<circle cx="${44+i*10.4}" cy="69" r="2"/>`).join("")}</g><rect x="40" y="76" width="120" height="7" fill="#c8402f"/>
   <path d="M18 62Q40 58 52 44H148Q160 58 182 62Q170 66 160 64H40Q30 66 18 62Z" fill="#3a4a46"/><path d="M18 62Q12 56 14 50Q22 58 30 60M182 62Q188 56 186 50Q178 58 170 60" fill="#3a4a46"/><path d="M52 44Q100 34 148 44" stroke="#2a3633" stroke-width="3" fill="none"/><g stroke="#556660" stroke-width="1">${Array.from({length:10},(_,i)=>`<path d="M${58+i*9.5} 46v16"/>`).join("")}</g>
   <rect x="96" y="134" width="8" height="16" fill="#5b3a1e"/><path d="M100 76L124 110L114 110L132 136L68 136L86 110L76 110Z" fill="url(#av-pine)"/>`
   +lights(inTri(14,84,134,30,11),["#ff6b6b","#ffd24a","#5ac8ff","#ffffff"],2.2)+`<polygon points="${star(100,74,7,3,5)}" fill="#ffd24a"/>
   <g transform="translate(160 132)"><path d="M-9 24h18l-3-14h-12z" fill="#8f8a80"/><circle r="13" fill="#ffe9b8"/><circle r="13" fill="url(#av-glow)" opacity=".7"/><path d="M-6-1q2-2 4 0M2-1q2-2 4 0" stroke="#6b4a2a" stroke-width="1.2" fill="none"/><path d="M-4 4q4 4 8 0" stroke="#c8402f" stroke-width="1.4" fill="none"/><circle cx="-7" cy="3" r="2" fill="#f6a5a0" opacity=".7"/><circle cx="7" cy="3" r="2" fill="#f6a5a0" opacity=".7"/></g>`,
 19:()=>SH(76,158)+`<path d="M40 104L120 78L170 104L90 132Z" fill="url(#av-leaf)"/><path d="M40 104L90 132L90 150L40 122Z" fill="#163f20"/><path d="M90 132L170 104L170 122L90 150Z" fill="#1d5229"/>
   <g stroke="#3a7a44" stroke-width="1" opacity=".8">${Array.from({length:8},(_,i)=>`<path d="M${52+i*12} ${100-i*3.6}l${30} ${14}"/>`).join("")}</g><path d="M60 98l80 26" stroke="#fff" stroke-width="4" opacity=".12" stroke-linecap="round"/>
   <path d="M65 96L145 120M145 120v18" stroke="#fffaf0" stroke-width="2.4" fill="none"/><path d="M80 118L146 92M80 118v18" stroke="#fffaf0" stroke-width="2.4" fill="none"/><path d="M65 96v16" stroke="#e8e1d2" stroke-width="2.4"/>
   <path d="M150 98L170 104L156 112Z" fill="#f2c84a"/><path d="M150 98L156 112L144 112Z" fill="#2c7a3a"/>`,
 20:()=>`<defs><pattern id="av-chk" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fff"/><rect width="5" height="5" fill="#c8202f"/><rect x="5" y="5" width="5" height="5" fill="#c8202f"/><rect width="10" height="10" fill="#c8202f" opacity=".25"/></pattern></defs>${SH(80,158)}
   <path d="M66 140v14M80 142v12" stroke="#6b4526" stroke-width="5" stroke-linecap="round"/>
   <rect x="52" y="92" width="112" height="52" rx="24" fill="#8a5a32"/><g stroke="#6b4526" stroke-width="1.4" fill="none">${[100,112,124,136].map(y=>`<path d="M70 ${y}q40 -4 90 0"/>`).join("")}</g>
   <path d="M96 88C120 82 160 84 168 96L170 140C150 150 110 150 96 144Z" fill="url(#av-chk)" stroke="#a01826" stroke-width="1"/><path d="M96 144l-2 6 6-2 4 6 4-6 6 4 2-6" stroke="#a01826" fill="none"/>
   <ellipse cx="56" cy="118" rx="20" ry="26" fill="#d4a674"/><ellipse cx="56" cy="118" rx="14" ry="19" fill="none" stroke="#b88a58"/><ellipse cx="56" cy="118" rx="8" ry="11" fill="none" stroke="#b88a58"/>
   <circle cx="49" cy="114" r="2.4" fill="#2a1a10"/><circle cx="63" cy="114" r="2.4" fill="#2a1a10"/><path d="M47 124q9 8 18 0" stroke="#2a1a10" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="56" cy="119" r="2.6" fill="#c8604a"/><circle cx="45" cy="121" r="2.4" fill="#f09080" opacity=".6"/><circle cx="67" cy="121" r="2.4" fill="#f09080" opacity=".6"/>
   <path d="M38 98C38 82 58 76 72 82C84 86 92 76 98 66C102 78 94 92 76 96C64 98 48 100 38 98Z" fill="#c8202f"/><path d="M38 98q20 4 38 -2" stroke="#8e1420" stroke-width="2" fill="none"/>
   <path d="M150 158L188 134" stroke="#8a5a32" stroke-width="4" stroke-linecap="round"/>${candy(134,160,"#e2b84a",10)}${candy(118,164,"#2f8a5a",-15)}`,
 21:()=>{let top="M52 46";for(let i=0;i<12;i++)top+=` L${56+i*8} ${i%2?40:46}`;top+=" L148 46";
  return SH(56,170)+`<path d="${top} L148 160 L52 160Z" fill="#1d2f57"/><path d="M148 44 L148 160" stroke="#5be3a0" stroke-width="6" opacity=".55" filter="url(#av-soft)"/><path d="M60 52q40 6 84 -2" stroke="#5be3a0" stroke-width="3" opacity=".35" fill="none"/>
   <text x="100" y="72" font-size="13" fill="#d6be87" text-anchor="middle" font-family="Georgia" letter-spacing="4">JAN</text><path d="M64 80h72" stroke="#d6be87" stroke-width=".6"/>
   <text x="100" y="130" font-size="50" fill="#f3e2b5" text-anchor="middle" font-family="Bodoni Moda,serif">15</text>
   <ellipse cx="100" cy="114" rx="32" ry="26" fill="none" stroke="#e2552f" stroke-width="3" transform="rotate(-6 100 114)"/><ellipse cx="102" cy="113" rx="31" ry="24" fill="none" stroke="#e2552f" stroke-width="1.4" transform="rotate(4 100 114)"/>
   <g transform="translate(132 62)"><circle r="7" fill="#f2c230"/>${Array.from({length:8},(_,i)=>`<path d="M${(Math.cos(i*Math.PI/4)*9).toFixed(1)} ${(Math.sin(i*Math.PI/4)*9).toFixed(1)}l${(Math.cos(i*Math.PI/4)*5).toFixed(1)} ${(Math.sin(i*Math.PI/4)*5).toFixed(1)}" stroke="#f2c230" stroke-width="2" stroke-linecap="round"/>`).join("")}</g>`},
 22:()=>SH(80,160)+`<ellipse cx="38" cy="150" rx="24" ry="8.5" fill="#fdfcf8" stroke="#2c4f8f" stroke-width="1.4"/><ellipse cx="38" cy="149" rx="16.5" ry="5" fill="#4a2617"/><ellipse cx="33" cy="148" rx="5" ry="1.4" fill="#a0745a" opacity=".6"/><path d="M21 152q17 6 34 0" stroke="#2c4f8f" stroke-width=".8" fill="none" stroke-dasharray="2 3"/>${dump(122,120,1.3)}${steam(110,76,0)}${steam(126,72,1)}${steam(140,78,2)}`,
 23:()=>{let bd="";for(let i=0;i<14;i++){const x=40+i*9;bd+=`<path d="M${x} 136l4.5-6 4.5 6z" fill="${["#2f8a5a","#f2c230","#c8402f"][i%3]}"/><path d="M${x+2} 142h5" stroke="${["#c8402f","#2f8a5a","#f2c230"][i%3]}" stroke-width="2"/>`}
  return SH(80,160)+`<path d="M34 132L162 132L170 150L42 150Z" fill="#e9e5da"/><path d="M38 120L160 120L166 134L44 134Z" fill="#f2efe6"/><path d="M40 104L158 104L164 124L46 124Z" fill="#fbfaf5" stroke="#e2ddcf"/><path d="M40 104L158 104" stroke="#fff" stroke-width="2"/>
   <path d="M42 128h120" stroke="#fff" stroke-width="1" opacity=".8"/>${bd}<path d="M38 127h124M38 145h124" stroke="#c9a35a" stroke-width=".8"/>
   <g transform="translate(108 96) rotate(-8)"><rect x="-28" y="-20" width="56" height="34" rx="2" fill="#fffdf7" stroke="#d6be87"/><rect x="-24" y="-16" width="48" height="26" fill="none" stroke="#c8402f" stroke-width=".6"/><text x="0" y="3" font-size="12" fill="#14305c" text-anchor="middle" font-family="Noto Serif SC,serif" font-weight="700">1月7日</text></g>`},
 24:()=>SH(60,162)+`<path d="M100 34C88 50 82 60 58 66C40 74 36 112 44 132C54 156 80 162 100 160C120 162 146 156 156 132C164 112 160 74 142 66C118 60 112 50 100 34Z" fill="#fff" opacity=".16" stroke="#fff" stroke-opacity=".6"/>
   <path d="M100 66C86 56 58 60 54 90C50 118 70 150 90 152C96 153 100 150 100 150C100 150 104 153 110 152C130 150 150 118 146 90C142 60 114 56 100 66Z" fill="url(#av-apple)"/><path d="M100 66q-2-10 4-18" stroke="#5b3a1e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M104 54c8-8 20-6 22 0c-8 4-16 4-22 0z" fill="#4f9a4a"/><ellipse cx="74" cy="92" rx="7" ry="14" fill="#fff" opacity=".4" transform="rotate(18 74 92)"/>
   <g stroke="#fff" stroke-width="1" opacity=".55" fill="none"><path d="M60 72q-8 30 0 60"/><path d="M148 80q6 30-4 54"/><path d="M78 56l-6 14M124 58l6 12"/></g>
   <text x="128" y="138" font-size="9" fill="#d6be87" font-family="Noto Serif SC,serif" font-weight="700" transform="rotate(-12 128 138)" opacity=".95">平安</text>
   <g transform="translate(100 44)"><path d="M0 0C-12-14-28-8-24 2C-21 9-8 6 0 0Z" fill="#f0dca8" stroke="#a3864d"/><path d="M0 0C12-14 28-8 24 2C21 9 8 6 0 0Z" fill="#e3c98d" stroke="#a3864d"/><path d="M-1 1l-8 16 5-1 3 4zM1 1l8 16-5-1-3 4z" fill="#d1b373"/><circle r="4" fill="#f6e7bf" stroke="#a3864d"/></g>`
};
function buildDefs(){
 let g=`
 <linearGradient id="av-gGold" x1="0" x2="1"><stop offset="0" stop-color="#8c6f3a"/><stop offset=".5" stop-color="#f3e2b5"/><stop offset="1" stop-color="#a3864d"/></linearGradient>
 <linearGradient id="av-cWhite" x1="0" x2="1"><stop offset="0" stop-color="#d9cfbd"/><stop offset=".45" stop-color="#fffaf0"/><stop offset="1" stop-color="#cfc3ad"/></linearGradient>
 <radialGradient id="av-flame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#f08a24"/></radialGradient>
 <radialGradient id="av-glow"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
 <linearGradient id="av-saff" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7c04a"/><stop offset=".55" stop-color="#e09a26"/><stop offset="1" stop-color="#b86a12"/></linearGradient>
 <linearGradient id="av-dough" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#e6d6b5"/></linearGradient>
 <radialGradient id="av-glass" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".25" stop-color="#fff" stop-opacity=".2"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
 <linearGradient id="av-age" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#c9a35a" stop-opacity=".0"/><stop offset="1" stop-color="#8c6f3a" stop-opacity=".25"/></linearGradient>
 <linearGradient id="av-pine" x1="0" x2="1"><stop offset="0" stop-color="#1b4a37"/><stop offset=".5" stop-color="#2b6b50"/><stop offset="1" stop-color="#173f2f"/></linearGradient>
 <linearGradient id="av-foil" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".0"/></linearGradient>
 <linearGradient id="av-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#aab2bb"/><stop offset=".4" stop-color="#f1f3f6"/><stop offset=".7" stop-color="#b6bec7"/><stop offset="1" stop-color="#e3e7eb"/></linearGradient>
 <linearGradient id="av-choc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5634" stop-opacity=".9"/><stop offset=".5" stop-color="#6b3a1f" stop-opacity="0"/><stop offset="1" stop-color="#40200f" stop-opacity=".6"/></linearGradient>
 <linearGradient id="av-leather" x1="0" x2="1"><stop offset="0" stop-color="#2a170c"/><stop offset=".35" stop-color="#5a3520"/><stop offset="1" stop-color="#2a170c"/></linearGradient>
 <radialGradient id="av-lamp" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff6c8" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <linearGradient id="av-frost" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
 <radialGradient id="av-velv" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <radialGradient id="av-copper" cx=".4" cy=".35"><stop offset="0" stop-color="#f0b27a"/><stop offset=".6" stop-color="#c47a3c"/><stop offset="1" stop-color="#8e4f20"/></radialGradient>
 <linearGradient id="av-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a8a4a"/><stop offset=".5" stop-color="#22622f"/><stop offset="1" stop-color="#1a4f26"/></linearGradient>
 <radialGradient id="av-apple" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ff5a4e"/><stop offset=".6" stop-color="#d4202a"/><stop offset="1" stop-color="#8e0f1a"/></radialGradient>
 <linearGradient id="av-cloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
 <filter id="av-soft"><feGaussianBlur stdDeviation="2"/></filter>`;
 for(let d=1;d<=24;d++)g+=`<symbol id="av-o-${d}" viewBox="0 0 200 200">${DRAW[d]()}</symbol>`;
 return g;
}


/* 样子（照样板；类名都加了 av- 免得跟软件别处打架） */
const XCSS = `.av-xmas .av-serif{font-family:"Cormorant Garamond",Georgia,serif}
.av-xmas .av-num,.av-xmas .av-cd .av-n,.av-xmas .av-tg,.av-xmas .av-dt,.av-xmas .av-stamp small,.av-xmas .av-card .av-u,.av-xmas .av-lb,.av-xmas .av-bigstamp{font-variant-numeric:lining-nums}
.av-xmas .av-num,.av-xmas .av-cd .av-n,.av-xmas .av-tg{font-family:"Bodoni Moda","Cormorant Garamond",Georgia,serif!important;font-weight:500!important}
.av-xmas .av-dt,.av-xmas .av-stamp small,.av-xmas .av-card .av-u{font-family:"Bodoni Moda",Georgia,serif!important}
.av-xmas .av-lb:not(.av-zh),.av-xmas .av-city:not(.av-zh) small,.av-xmas .av-card .av-my small{font-family:"Bodoni Moda",Georgia,serif!important;font-style:normal!important}
.av-xmas .av-city:not(.av-zh) small{font-size:13px;letter-spacing:.02em}
.av-xmas .av-card .av-my small{font-size:11px}
.av-xmas .av-lb:not(.av-zh){font-size:8.5px}.av-xmas .av-z2 .av-lb:not(.av-zh),.av-xmas .av-z3 .av-lb:not(.av-zh),.av-xmas .av-z6 .av-lb:not(.av-zh){font-size:10.5px}
.av-xmas .av-k-drawer .av-face{padding-bottom:7px}
.av-xmas .av-k-drawer.av-z1 .av-face{padding-bottom:6px}

/* ---------- 手机 ---------- */
.av-xmas .av-scr{flex:1;overflow-y:auto;overflow-x:hidden;padding-bottom:30px;scrollbar-width:none}
.av-xmas .av-scr::-webkit-scrollbar{display:none}
.av-xmas .av-toast{position:absolute;top:14px;left:50%;transform:translate(-50%,-30px);opacity:0;background:var(--lac);color:#f5ecd8;font-weight:700;padding:7px 15px;border-radius:99px;transition:.3s;z-index:60;font-size:13px;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(214,190,135,.5);pointer-events:none}
.av-xmas .av-toast.av-on{opacity:1;transform:translate(-50%,0)}

.av-xmas .av-hd{padding:22px 18px 6px;text-align:center}
.av-xmas .av-brand{display:inline-flex;align-items:center;gap:7px;font:600 11px "Cormorant Garamond",Georgia,serif;letter-spacing:.42em;color:#8f7a4c;padding-left:.42em}
.av-xmas .av-brand svg{width:18px;height:18px}
.av-xmas .av-cd{margin:10px 0 2px;display:flex;align-items:baseline;justify-content:center;gap:10px;color:var(--ink)}
.av-xmas .av-cd .av-n{font:500 62px/0.85 "Cormorant Garamond",Georgia,serif;color:var(--ink);transition:transform .3s}
.av-xmas .av-cd .av-n.av-bump{transform:scale(1.12)}
.av-xmas .av-cd .av-t{font:600 19px/1.2 "Cormorant Garamond","Noto Serif SC",serif;text-align:left;font-style:italic}
.av-xmas .av-cd .av-t.av-zh{font:900 17px/1.3 "Noto Serif SC",serif;font-style:normal}
.av-xmas .av-sub{font:italic 500 15px "Cormorant Garamond",Georgia,serif;color:#8f7a4c}
.av-xmas .av-sub.av-zh{font:600 13px "Noto Serif SC",serif;font-style:normal}

/* ---------- 首饰柜 ---------- */
.av-xmas .av-cabwrap{padding:14px 14px 0;perspective:900px}
.av-xmas .av-cab{position:relative;background:linear-gradient(160deg,#16244a,#070d1f 70%);border-radius:12px;padding:30px 9px 11px;box-shadow:0 22px 34px -14px rgba(7,13,31,.55),0 2px 0 #2a3b66 inset,0 0 0 1px #050a18}
.av-xmas .av-cab::before{content:"";position:absolute;inset:4px;border:1px solid rgba(214,190,135,.55);border-radius:9px;pointer-events:none}
.av-xmas .av-cab::after{content:"";position:absolute;inset:7px;border:.5px solid rgba(214,190,135,.25);border-radius:7px;pointer-events:none}
.av-xmas .av-crest{position:absolute;top:8px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:8px;font:600 9.5px "Cormorant Garamond",Georgia,serif;letter-spacing:.38em;color:var(--gold);padding-left:.38em}
.av-xmas .av-crest i{display:block;width:34px;height:.5px;background:linear-gradient(90deg,transparent,var(--gold))}
.av-xmas .av-crest i:last-child{transform:scaleX(-1)}
.av-xmas .av-crest span{white-space:nowrap}
@media(max-width:420px){.av-xmas .av-crest{font-size:8.5px;letter-spacing:.24em;padding-left:.24em}.av-xmas .av-crest i{width:18px}}
.av-xmas .av-z1.av-k-door .av-pull{right:3px;height:10px;margin-top:-5px}
.av-xmas .av-k-ribbon .av-lb{background:rgba(10,17,39,.72);padding:2px 6px;border-radius:99px}
.av-xmas .av-f-ivory.av-k-ribbon .av-lb{background:rgba(251,247,238,.9)}
.av-xmas .av-flat .av-knob{bottom:auto;top:50%;left:auto;right:7px;margin:-4px 0 0}
.av-xmas .av-k-drawer.av-flat .av-face{padding-bottom:0}
.av-xmas .av-f-ivory.av-s-miss .av-lb,.av-xmas .av-f-ivory.av-s-today .av-lb{color:#9a7b3f}
.av-xmas .av-k-drawer.av-z1 .av-knob{bottom:auto;top:50%;left:auto;right:3px;margin:-3px 0 0}
.av-xmas .av-k-drawer.av-z1 .av-face{padding:0 6px 0 0}
.av-xmas .av-k-double .av-lb{background:rgba(60,14,26,.92);padding:1px 7px;border-radius:99px}
.av-xmas .av-f-forest.av-k-double .av-lb,.av-xmas .av-f-forest.av-k-double .av-num{background-color:transparent}
.av-xmas .av-f-forest.av-k-double .av-lb{background:rgba(14,38,32,.92)}
.av-xmas .av-f-forest.av-k-double .av-num{background:radial-gradient(closest-side,rgba(14,38,32,.95) 55%,transparent)}
.av-xmas .av-feet{display:flex;justify-content:space-between;padding:0 26px}
.av-xmas .av-feet i{width:30px;height:7px;background:linear-gradient(#c9ad72,#8c6f3a);border-radius:0 0 6px 6px}

.av-xmas .av-grid{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(9,48px);gap:4px;position:relative}
@media(max-width:380px){.av-xmas .av-grid{grid-template-rows:repeat(9,44px)}}
.av-xmas .av-cell{position:relative;border:0;padding:0;background:#1a0b12;border-radius:4px;transform-style:preserve-3d;perspective:500px;outline:none}
.av-xmas .av-cell:focus-visible{box-shadow:0 0 0 2px var(--gold)}
.av-xmas .av-inside{position:absolute;inset:0;border-radius:4px;overflow:hidden;background:radial-gradient(circle at 50% 42%,#7a2a3c,#3c0f1c 70%,#240810);box-shadow:inset 0 3px 8px rgba(0,0,0,.6)}
.av-xmas .av-inside svg{position:absolute;left:50%;top:50%;width:92%;height:92%;max-width:120px;transform:translate(-50%,-50%);filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))}
.av-xmas .av-inside .av-tg{position:absolute;left:4px;top:2px;font:600 10px "Cormorant Garamond",serif;color:var(--gold);opacity:.85}
.av-xmas .av-inside .av-wait{position:absolute;right:3px;bottom:2px;font-size:9px;color:#f2d8a8;opacity:.9}
.av-xmas .av-face{position:absolute;inset:0;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:transform .7s cubic-bezier(.3,.7,.2,1),opacity .5s,box-shadow .6s;transform-origin:left center;backface-visibility:hidden;overflow:hidden}
.av-xmas .av-face::before{content:"";position:absolute;inset:3px;border:1px solid rgba(214,190,135,.5);border-radius:2px;pointer-events:none}
.av-xmas .av-num{position:relative;font:600 22px/1 "Cormorant Garamond",Georgia,serif;color:var(--gold);z-index:3;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.av-xmas .av-lb{position:relative;font:italic 500 9.5px/1.1 "Cormorant Garamond",Georgia,serif;color:rgba(214,190,135,.85);z-index:3;margin-top:1px;white-space:nowrap}
.av-xmas .av-lb.av-zh{font:600 8.5px "Noto Serif SC",serif;font-style:normal}
.av-xmas .av-z2 .av-num{font-size:38px}.av-xmas .av-z3 .av-num{font-size:30px}.av-xmas .av-z6 .av-num{font-size:66px}
.av-xmas .av-z2 .av-lb,.av-xmas .av-z6 .av-lb,.av-xmas .av-z3 .av-lb{font-size:12px}
.av-xmas .av-z6 .av-lb.av-zh,.av-xmas .av-z2 .av-lb.av-zh{font-size:11px}
/* 漆面 */
.av-xmas .av-f-navy .av-face{background:linear-gradient(158deg,rgba(255,255,255,.1),transparent 34%),linear-gradient(160deg,#1d2f57,#0d1734 65%,#0a1127)}
.av-xmas .av-f-wine .av-face{background:radial-gradient(circle at 30% 22%,#843046,#4d1424 72%,#36101b)}
.av-xmas .av-f-forest .av-face{background:radial-gradient(circle at 30% 22%,#2f6050,#16362d 72%,#0e2620)}
.av-xmas .av-f-jade .av-face{background:linear-gradient(158deg,rgba(255,255,255,.13),transparent 36%),linear-gradient(160deg,#2b6a5a,#13392f 70%)}
.av-xmas .av-f-ivory .av-face{background:linear-gradient(158deg,rgba(255,255,255,.7),transparent 40%),linear-gradient(160deg,#f6eedb,#e3d4b2)}
.av-xmas .av-f-ivory .av-num{color:#1d2f57;text-shadow:none}.av-xmas .av-f-ivory .av-lb{color:#8f7a4c}
.av-xmas .av-f-ivory .av-face::before{border-color:rgba(184,151,90,.75)}
/* 把手、合页、丝带 */
.av-xmas .av-knob{position:absolute;bottom:5px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3cf,#d6be87 45%,#8c6f3a);box-shadow:0 1px 1px rgba(0,0,0,.5);z-index:3}
.av-xmas .av-k-drawer.av-z1 .av-knob{bottom:4px;width:6px;height:6px;margin-left:-3px}
.av-xmas .av-hinge{position:absolute;left:2px;width:3px;height:9px;background:linear-gradient(#e8d29c,#8c6f3a);border-radius:1px;z-index:3}
.av-xmas .av-hinge.av-a{top:18%}.av-xmas .av-hinge.av-b{bottom:18%}
.av-xmas .av-pull{position:absolute;right:6px;top:50%;width:3px;height:14px;margin-top:-7px;border-radius:2px;background:linear-gradient(90deg,#8c6f3a,#f1dca6,#8c6f3a);z-index:3}
.av-xmas .av-rbv,.av-xmas .av-rbh{position:absolute;z-index:2;background:linear-gradient(90deg,#c8ab6e,#f3e2b5 45%,#c8ab6e);transition:transform .6s cubic-bezier(.5,0,.3,1)}
.av-xmas .av-rbv{left:70%;top:-2px;bottom:-2px;width:12px;margin-left:-6px}
.av-xmas .av-rbh{top:60%;left:-2px;right:-2px;height:12px;margin-top:-6px;background:linear-gradient(#c8ab6e,#f3e2b5 45%,#c8ab6e)}
.av-xmas .av-f-ivory .av-rbv,.av-xmas .av-f-ivory .av-rbh{background:linear-gradient(90deg,#6b1b2c,#a33a50 45%,#6b1b2c)}
.av-xmas .av-f-ivory .av-rbh{background:linear-gradient(#6b1b2c,#a33a50 45%,#6b1b2c)}
.av-xmas .av-bow{position:absolute;left:70%;top:60%;width:46px;height:30px;margin:-15px 0 0 -23px;z-index:4;transition:transform .55s cubic-bezier(.5,0,.3,1),opacity .4s}
.av-xmas .av-k-ribbon .av-num{background:rgba(10,17,39,.0);margin-top:46%}
.av-xmas .av-k-ribbon.av-z6 .av-num{margin-top:62%}
.av-xmas .av-k-ribbon .av-lb{position:absolute;bottom:6px}
.av-xmas .av-k-ribbon .av-num,.av-xmas .av-k-ribbon .av-lb{position:absolute}
.av-xmas .av-k-ribbon .av-num{top:6px;left:9px;margin:0;font-size:26px}
.av-xmas .av-k-ribbon.av-z6 .av-num{font-size:40px;margin:0}
.av-xmas .av-k-ribbon .av-lb{left:9px;bottom:6px}
.av-xmas .av-leafL,.av-xmas .av-leafR{position:absolute;top:0;bottom:0;width:50%;transition:transform .75s cubic-bezier(.3,.7,.2,1);backface-visibility:hidden}
.av-xmas .av-leafL{left:0;transform-origin:left center}.av-xmas .av-leafR{right:0;transform-origin:right center}
.av-xmas .av-leafL::before,.av-xmas .av-leafR::before{content:"";position:absolute;inset:3px;border:1px solid rgba(214,190,135,.5);border-radius:2px}
.av-xmas .av-leafL::after,.av-xmas .av-leafR::after{content:"";position:absolute;top:72%;width:3px;height:16px;margin-top:-8px;background:linear-gradient(90deg,#8c6f3a,#f1dca6,#8c6f3a);border-radius:2px}
.av-xmas .av-leafL::after{right:4px}.av-xmas .av-leafR::after{left:4px}
.av-xmas .av-k-double .av-face::after{content:"";position:absolute;left:50%;top:6px;bottom:6px;width:1px;background:rgba(214,190,135,.55);z-index:2}
.av-xmas .av-k-double .av-num{background:radial-gradient(closest-side,rgba(60,14,26,.95) 55%,transparent);padding:6px 12px}
.av-xmas .av-k-double .av-face{background:none!important}
.av-xmas .av-k-double .av-face::before{display:none}
.av-xmas .av-f-wine .av-leafL,.av-xmas .av-f-wine .av-leafR{background:radial-gradient(circle at 60% 30%,#843046,#4d1424 75%)}
.av-xmas .av-f-forest .av-leafL,.av-xmas .av-f-forest .av-leafR{background:radial-gradient(circle at 60% 30%,#2f6050,#16362d 75%)}
.av-xmas .av-k-double .av-num{margin-top:-6px}

/* 状态 */
.av-xmas .av-s-lock .av-face{filter:saturate(.75) brightness(.86)}
.av-xmas .av-s-lock .av-num{opacity:.7}
.av-xmas .av-s-miss .av-lb{color:#f3dfae}
.av-xmas .av-s-today{z-index:5}
.av-xmas .av-s-today .av-face{box-shadow:0 0 0 1.5px #f3dfae,0 0 18px 3px rgba(243,223,174,.55)}
.av-xmas .av-s-today .av-shine{position:absolute;inset:0;z-index:5;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,244,214,.55) 48%,transparent 62%);background-size:260% 100%;animation:av-sh 2.6s infinite;border-radius:4px}
@keyframes av-sh{0%{background-position:130% 0}60%,100%{background-position:-60% 0}}
.av-xmas .av-s-today .av-lb{color:#fff0c8;font-weight:600}
.av-xmas .av-s-open .av-face{display:none}
.av-xmas .av-s-open .av-shine{display:none}
.av-xmas .av-wig{animation:av-wig .4s}
@keyframes av-wig{20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}

/* 打开的动画 */
.av-xmas .av-opening{z-index:20}
.av-xmas .av-opening.av-k-drawer .av-face{transform:translateY(14%) scale(1.18);opacity:0;box-shadow:0 18px 26px rgba(0,0,0,.6);transition-delay:0s,.35s,0s}
.av-xmas .av-opening.av-k-door .av-face{transform:rotateY(-118deg);opacity:.0;transition-delay:0s,.45s,0s}
.av-xmas .av-opening.av-k-double .av-leafL{transform:rotateY(-118deg)}
.av-xmas .av-opening.av-k-double .av-leafR{transform:rotateY(118deg)}
.av-xmas .av-opening.av-k-double .av-num,.av-xmas .av-opening.av-k-double .av-lb{opacity:0;transition:opacity .2s}
.av-xmas .av-opening.av-k-ribbon .av-bow{transform:scale(1.7) rotate(-25deg);opacity:0}
.av-xmas .av-opening.av-k-ribbon .av-rbv{transform:translateY(-115%)}
.av-xmas .av-opening.av-k-ribbon .av-rbh{transform:translateX(115%)}
.av-xmas .av-opening.av-k-ribbon .av-face{transform:translateY(-22%) scale(1.06);opacity:0;transition-delay:.4s,.55s,0s;transform-origin:center}
.av-xmas .av-burst{position:absolute;pointer-events:none;z-index:40;border-radius:50%;background:radial-gradient(circle,rgba(255,243,210,.95),rgba(243,214,150,.45) 40%,transparent 70%);transform:translate(-50%,-50%) scale(.2);opacity:0;animation:av-burst .9s ease-out forwards}
@keyframes av-burst{30%{opacity:1}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
.av-xmas .av-pt{position:absolute;pointer-events:none;z-index:41;width:5px;height:5px;border-radius:50%;background:#f6e2ad;box-shadow:0 0 6px #ffe9b3}
.av-xmas .av-pt.av-star{width:9px;height:9px;border-radius:0;background:none;box-shadow:none}
.av-xmas .av-pt.av-star::before{content:"";position:absolute;inset:0;background:#fff3cf;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)}

.av-xmas .av-hint{text-align:center;padding:12px 22px 0;font:italic 500 14px "Cormorant Garamond",Georgia,serif;color:#8f7a4c}
.av-xmas .av-hint.av-zh{font:600 12.5px "Noto Serif SC",serif;font-style:normal}

/* ---------- 你的树 ---------- */
.av-xmas .av-treebox{margin:22px 14px 0;background:linear-gradient(#fffdf7,#f6efdf);border:1px solid #eadfc6;border-radius:18px;padding:14px 12px 16px;position:relative;overflow:hidden;text-align:center}
.av-xmas .av-treebox h3{margin:0;font:600 22px "Cormorant Garamond",Georgia,serif;color:var(--ink);font-style:italic}
.av-xmas .av-treebox h3.av-zh{font:900 18px "Noto Serif SC",serif;font-style:normal}
.av-xmas .av-treebox .av-tl{font-size:12.5px;color:var(--soft);margin:2px 0 4px}
.av-xmas .av-tree{width:100%;max-width:320px;display:block;margin:0 auto}
.av-xmas .av-treebox.av-lit{background:radial-gradient(circle at 50% 40%,#21345f,#0b1430 75%);border-color:#2a3b66}
.av-xmas .av-treebox.av-lit h3,.av-xmas .av-treebox.av-lit .av-tl{color:#f3e2b5}
.av-xmas .av-lt{opacity:0}
.av-xmas .av-lit .av-lt{opacity:1;animation:av-tw 1.8s infinite}
.av-xmas .av-lit .av-lt:nth-child(3n){animation-delay:.6s}.av-xmas .av-lit .av-lt:nth-child(3n+1){animation-delay:1.2s}
@keyframes av-tw{50%{opacity:.25}}
.av-xmas .av-lit .av-topper{filter:drop-shadow(0 0 8px #ffe7a8)}
.av-xmas .av-orn{transition:transform .6s cubic-bezier(.3,1.6,.5,1)}
.av-xmas .av-orn.av-drop{animation:av-drop .9s cubic-bezier(.3,1.5,.5,1)}
@keyframes av-drop{0%{transform:translateY(-60px);opacity:0}100%{opacity:1}}
.av-xmas .av-orn.av-swing use{transform-box:fill-box;transform-origin:50% 0;animation:av-swing 2.4s ease-in-out 1}
@keyframes av-swing{25%{transform:rotate(8deg)}75%{transform:rotate(-6deg)}}
.av-xmas .av-share{display:none;margin:10px auto 0;border:0;background:var(--hot);color:#fff;font-weight:800;border-radius:99px;padding:10px 20px;box-shadow:0 4px 0 #b53d1d}
.av-xmas .av-canshare .av-share{display:inline-block}

/* ---------- 打开后的一页 ---------- */
.av-xmas .av-rv{position:absolute;inset:0;z-index:50;background:var(--ivory);overflow-y:auto;overflow-x:hidden;transform:translateY(102%);transition:transform .55s cubic-bezier(.2,.8,.2,1);scrollbar-width:none}
.av-xmas .av-rv::-webkit-scrollbar{display:none}
.av-xmas .av-rv.av-on{transform:none}
.av-xmas .av-stage{position:relative;height:290px;background:radial-gradient(ellipse at 50% 58%,#7d2c3f,#3e1020 62%,#200610);overflow:hidden}
.av-xmas .av-stage::before{content:"";position:absolute;left:50%;top:-40px;width:340px;height:330px;margin-left:-170px;background:radial-gradient(ellipse at 50% 0,rgba(255,240,205,.35),transparent 65%);pointer-events:none}
.av-xmas .av-stage .av-tray{position:absolute;left:50%;bottom:26px;width:250px;height:44px;margin-left:-125px;border-radius:50%;background:radial-gradient(ellipse,#2a0912,transparent 70%)}
.av-xmas .av-stage svg.av-big{position:absolute;left:50%;top:50%;width:230px;height:230px;margin:-108px 0 0 -115px;filter:drop-shadow(0 10px 12px rgba(0,0,0,.5));animation:av-rise .9s cubic-bezier(.2,1.3,.4,1) both}
@keyframes av-rise{0%{transform:translateY(40px) scale(.6);opacity:0}100%{transform:none;opacity:1}}
.av-xmas .av-stage svg.av-big.av-fly{animation:av-fly .9s cubic-bezier(.6,0,.4,1) forwards}
@keyframes av-fly{0%{transform:none}35%{transform:scale(1.08)}100%{transform:translateY(260px) scale(.12);opacity:0}}
.av-xmas .av-x{position:absolute;top:12px;left:12px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid rgba(214,190,135,.6);background:rgba(10,17,39,.45);color:#f3e2b5;font-size:17px;line-height:1}
.av-xmas .av-dt{position:absolute;top:16px;right:14px;z-index:3;font:600 13px "Cormorant Garamond",Georgia,serif;letter-spacing:.22em;color:var(--gold)}
.av-xmas .av-glint{position:absolute;width:6px;height:6px;background:#fff3cf;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);animation:av-gl 2.2s infinite}
@keyframes av-gl{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.4)}}
.av-xmas .av-rbody{padding:18px 18px 40px;position:relative}
.av-xmas .av-city{font:600 30px/1.05 "Cormorant Garamond",Georgia,serif;color:var(--ink)}
.av-xmas .av-city.av-zh{font:900 25px "Noto Serif SC",serif}
.av-xmas .av-city small{display:block;font:italic 500 15px "Cormorant Garamond",Georgia,serif;color:#8f7a4c;margin-top:4px}
.av-xmas .av-city.av-zh small{font:600 13px "Noto Serif SC",serif;font-style:normal}
.av-xmas .av-k{font:600 11px "Cormorant Garamond",Georgia,serif;letter-spacing:.3em;color:#a3884f;margin:18px 0 4px;text-transform:uppercase}
.av-xmas .av-k.av-zh{letter-spacing:.12em;font:600 12px "Noto Serif SC",serif}
.av-xmas .av-fact{font-size:14.5px;line-height:1.65;color:#2d3646;margin:0}
.av-xmas .av-src{font-size:11.5px;color:#9a917c;margin-top:6px}
.av-xmas .av-who{display:flex;gap:12px;align-items:center;margin-top:14px}
.av-xmas .av-pol{background:#fff;padding:6px 6px 20px;box-shadow:0 3px 10px rgba(0,0,0,.15);transform:rotate(-2.5deg);flex:none;width:104px;position:relative}
.av-xmas .av-pol img{width:92px;height:92px;object-fit:cover;display:block;background:#ddd}
.av-xmas .av-pol .av-cap{position:absolute;bottom:3px;left:0;right:0;text-align:center;font:italic 10.5px Georgia,serif;color:var(--soft)}
.av-xmas .av-who .av-t{font-size:13px;color:#4a5262;line-height:1.5}
.av-xmas .av-tag{display:inline-block;font-size:10.5px;background:#f1ece0;border-radius:99px;padding:1px 7px;color:var(--soft);white-space:nowrap;margin-top:3px}

.av-xmas .av-say{margin-top:6px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 12px 14px;box-shadow:0 3px 12px rgba(20,48,92,.06)}
.av-xmas .av-lv{display:flex;gap:4px;background:#f4efe3;border-radius:99px;padding:3px}
.av-xmas .av-lv button{flex:1;border:0;background:none;border-radius:99px;padding:5px 2px;font-size:11.5px;font-weight:700;color:var(--soft)}
.av-xmas .av-lv button.av-on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.av-xmas .av-line{margin:14px 2px 2px;font:600 21px/1.9 "Noto Serif SC",Georgia,serif;color:var(--ink);display:flex;flex-wrap:wrap;align-items:flex-end;gap:2px 1px}
.av-xmas .av-line.av-en{font:600 22px/1.45 "Cormorant Garamond",Georgia,serif;gap:2px 6px}
.av-xmas .av-w{cursor:pointer;border-radius:5px;padding:0 1px;transition:background .15s,color .15s;border-bottom:1.5px dotted rgba(226,85,47,.35)}
.av-xmas .av-w:hover,.av-xmas .av-w.av-on{background:#fde9e1;color:var(--hot)}
.av-xmas .av-w.av-p{border:0;cursor:default}.av-xmas .av-w.av-p:hover{background:none;color:inherit}
.av-xmas .av-w ruby rt{font:500 11px -apple-system,sans-serif;color:#8a8f9c;letter-spacing:0}
.av-xmas .av-w.av-lit{color:var(--hot)}
.av-xmas .av-trn{font-size:13px;color:var(--soft);margin:2px 2px 0}
.av-xmas .av-acts{display:flex;gap:10px;align-items:center;margin-top:14px}
.av-xmas .av-lis{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:9px 14px;font-weight:700;color:var(--ink);font-size:13.5px}
.av-xmas .av-mic{flex:1;border:0;background:var(--hot);color:#fff;border-radius:99px;padding:11px 14px;font-weight:800;font-size:15px;box-shadow:0 4px 0 #b53d1d;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .1s}
.av-xmas .av-mic:active{transform:translateY(2px);box-shadow:0 2px 0 #b53d1d}
.av-xmas .av-mic.av-rec{background:#c43d1c}
.av-xmas .av-mic.av-done{background:#2f6b4f;box-shadow:0 4px 0 #1f4a36}
.av-xmas .av-bars{display:none;gap:3px;align-items:center;height:16px}
.av-xmas .av-rec .av-bars{display:inline-flex}
.av-xmas .av-bars i{width:3px;background:#fff;border-radius:2px;animation:av-bar .5s infinite alternate}
.av-xmas .av-bars i:nth-child(2){animation-delay:.12s}.av-xmas .av-bars i:nth-child(3){animation-delay:.24s}.av-xmas .av-bars i:nth-child(4){animation-delay:.36s}
@keyframes av-bar{0%{height:3px}100%{height:16px}}
.av-xmas .av-heard{font-size:13px;color:#2f6b4f;min-height:22px;margin-top:8px;padding-right:96px}
.av-xmas .av-stamp{position:absolute;right:8px;bottom:-8px;z-index:5;width:86px;height:86px;border-radius:50%;border:3px double var(--hot);color:var(--hot);display:grid;place-items:center;text-align:center;font:700 11px/1.15 "Cormorant Garamond",Georgia,serif;letter-spacing:.12em;transform:rotate(-14deg) scale(2.2);opacity:0;pointer-events:none;background:rgba(251,247,238,.6)}
.av-xmas .av-stamp.av-zh{font:900 13px/1.2 "Noto Serif SC",serif;letter-spacing:.05em}
.av-xmas .av-stamp.av-on{animation:av-thunk .45s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes av-thunk{0%{transform:rotate(-14deg) scale(2.2);opacity:0}100%{transform:rotate(-14deg) scale(1);opacity:.92}}
.av-xmas .av-stamp small{display:block;font-size:6.5px;letter-spacing:.06em;margin-top:3px;white-space:nowrap}

.av-xmas .av-yours{margin-top:22px;opacity:.35;pointer-events:none;transition:opacity .5s}
.av-xmas .av-yours.av-on{opacity:1;pointer-events:auto}
.av-xmas .av-yours .av-q{font:600 19px/1.35 "Noto Serif SC",Georgia,serif;color:var(--ink)}
.av-xmas .av-yours .av-q.av-en{font:600 21px/1.3 "Cormorant Garamond",Georgia,serif}
.av-xmas .av-ans{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed var(--line)}
.av-xmas .av-ans img{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.15);background:#ccc}
.av-xmas .av-ans .av-me{width:38px;height:38px;border-radius:50%;flex:none;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}
.av-xmas .av-ans .av-nm{font-size:12px;color:var(--soft)}.av-xmas .av-ans .av-nm b{color:var(--ink)}
.av-xmas .av-ans .av-tx{font-size:15px;color:#24303a;cursor:pointer;margin-top:1px}
.av-xmas .av-ans .av-tr{font-size:12.5px;color:var(--soft);display:none}
.av-xmas .av-ans.av-open .av-tr{display:block}
.av-xmas .av-ans .av-heart{margin-left:auto;border:0;background:none;font-size:16px;color:#c9bfa8;padding:2px 4px;flex:none}
.av-xmas .av-ans .av-heart.av-on{color:var(--hot);animation:av-pop .3s}
@keyframes av-pop{50%{transform:scale(1.5)}}
.av-xmas .av-leave{display:flex;gap:8px;margin-top:12px}
.av-xmas .av-leave input{flex:1;min-width:0;border:1.5px solid var(--line);border-radius:99px;padding:9px 14px;font:inherit;font-size:14px;background:#fff;outline-color:var(--ink)}
.av-xmas .av-leave button{border:0;background:var(--ink);color:#fff;border-radius:99px;padding:0 16px;font-weight:800;font-size:13px}
.av-xmas .av-note{font-size:11.5px;color:#9a917c;margin-top:6px}
.av-xmas .av-back{display:block;width:100%;margin-top:22px;border:1px solid var(--ink);background:var(--ink);color:#f3e2b5;border-radius:99px;padding:12px;font:600 17px "Cormorant Garamond",Georgia,serif;letter-spacing:.08em}
.av-xmas .av-back.av-zh{font:900 15px "Noto Serif SC",serif;letter-spacing:.04em}
.av-xmas .av-ph{background:#f4efe3;border-radius:14px;padding:14px;font-size:14px;color:#5b6474;margin-top:14px}

.av-xmas .av-pop{position:absolute;left:14px;right:14px;z-index:70;background:var(--lac);color:#f5ecd8;border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(214,190,135,.5);display:none;align-items:center;gap:12px}
.av-xmas .av-pop.av-on{display:flex;animation:av-up .25s}
@keyframes av-up{0%{transform:translateY(10px);opacity:0}}
.av-xmas .av-pop .av-pw{font:900 24px "Noto Serif SC",Georgia,serif;color:#fff}
.av-xmas .av-pop .av-pp{font-size:13px;color:var(--gold)}
.av-xmas .av-pop .av-pm{font-size:13.5px;color:#e9e1cf}
.av-xmas .av-pop button{margin-left:auto;border:1px solid rgba(214,190,135,.6);background:none;color:#f3e2b5;border-radius:50%;width:38px;height:38px;flex:none;font-size:16px}


.av-xmas .av-py{font-size:13px;color:#8a8f9c;margin:2px 2px 0}
.av-xmas .av-qt{font-size:12.5px;color:var(--soft);margin-top:2px}
.av-xmas .av-tpy{font-size:11.5px;color:#9aa0ad}
.av-xmas .av-src a{color:#8f7a4c}
.av-xmas .av-mk{font-size:11.5px;color:#a3884f;font-weight:700;margin:12px 2px 6px}
.av-xmas .av-chips{display:flex;flex-wrap:wrap;gap:6px}
.av-xmas .av-chip{border:1.5px solid var(--line);background:#fffdf7;border-radius:12px;padding:5px 11px;font-weight:700;color:var(--ink);font-size:14px;line-height:1.25;text-align:left;transition:transform .12s}
.av-xmas .av-chip small{display:block;font-weight:500;font-size:11px;color:#8a8f9c}
.av-xmas .av-chip:active{transform:scale(.94)}
.av-xmas .av-chip.av-on,.av-xmas .av-chip.av-on2{border-color:var(--hot);background:#fde9e1;color:var(--hot)}
.av-xmas .av-slot{display:inline-block;min-width:56px;border-bottom:2px solid var(--hot);color:var(--hot);padding:0 4px;margin:0 2px;transition:background .2s}
.av-xmas .av-slot.av-on{background:#fde9e1;border-radius:6px 6px 0 0}
.av-xmas .av-own{width:100%;margin-top:8px;border:1.5px dashed var(--line);border-radius:12px;padding:8px 12px;font:inherit;font-size:14px;background:#fff;outline-color:var(--ink)}
.av-xmas .av-way{font:600 16px/1.4 "Noto Serif SC",Georgia,serif;color:var(--ink);margin:12px 2px 2px}
.av-xmas .av-cue{font-size:13px;color:var(--soft);margin:0 2px}
.av-xmas .av-peek{display:block;width:100%;margin-top:12px;border:1.5px dashed #d6be87;background:#fbf6e9;border-radius:14px;padding:10px 12px;text-align:left}
.av-xmas .av-peek .av-pf{font:italic 600 15px "Cormorant Garamond","Noto Serif SC",serif;color:#8f7a4c}
.av-xmas .av-peek .av-pb{display:none}
.av-xmas .av-peek.av-on .av-pf{display:none}
.av-xmas .av-peek.av-on .av-pb{display:block;animation:av-up .3s}
.av-xmas .av-peek .av-line{font-size:18px}
.av-xmas .av-peek .av-py,.av-xmas .av-peek .av-trn{display:block}
.av-xmas .av-line{display:block}
.av-xmas .av-give{display:none;gap:8px;margin-top:2px;flex-wrap:wrap;padding-right:96px;min-height:62px;align-content:flex-start}
.av-xmas .av-give.av-on{display:flex;animation:av-up .3s}
.av-xmas .av-give .av-gk{width:100%;font-size:12px;color:var(--soft)}
.av-xmas .av-give button{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:7px 13px;font-weight:700;font-size:13px;color:var(--ink)}
.av-xmas .av-give button.av-on{background:var(--ink);border-color:var(--ink);color:#fff}
.av-xmas .av-q,.av-xmas .av-sp{cursor:pointer}
.av-xmas .av-q:hover,.av-xmas .av-sp:hover{color:var(--hot)}
.av-xmas .av-q::after,.av-xmas .av-sp::after{content:" 🔊";font-size:12px;opacity:.5}
.av-xmas .av-tg2{display:inline-block;font-size:10.5px;background:#e9f1ec;color:#2f6b4f;border-radius:99px;padding:0 7px;margin-left:4px;font-weight:700}
.av-xmas .av-yi{display:inline-block;font-size:10.5px;background:#f1ece0;color:#8f7a4c;border-radius:99px;padding:0 7px;font-weight:700;vertical-align:1px}
.av-xmas .av-card .av-my{font:600 15px/1.45 "Noto Serif SC",Georgia,serif;color:var(--ink);margin:8px 8px 0;font-style:normal}
.av-xmas .av-card .av-my small{display:block;font:italic 12px "Cormorant Garamond",Georgia,serif;color:#8f7a4c}
/* 分享卡 */
.av-xmas .av-sh{position:absolute;inset:0;z-index:80;background:rgba(7,13,31,.82);display:none;align-items:center;justify-content:center;padding:18px}
.av-xmas .av-sh.av-on{display:flex;animation:av-fade .3s}
@keyframes av-fade{0%{opacity:0}}
.av-xmas .av-card{width:100%;max-width:320px;background:var(--ivory);border-radius:14px;padding:18px 16px 16px;text-align:center;position:relative;box-shadow:0 20px 40px rgba(0,0,0,.4)}
.av-xmas .av-card::before{content:"";position:absolute;inset:6px;border:1px solid #d6be87;border-radius:10px;pointer-events:none}
.av-xmas .av-card .av-to{display:flex;justify-content:space-between;font:600 11px "Cormorant Garamond",Georgia,serif;letter-spacing:.24em;color:#8f7a4c;padding:0 8px}
.av-xmas .av-card h4{margin:6px 0 0;font:600 26px "Cormorant Garamond",Georgia,serif;color:var(--ink);font-style:italic}
.av-xmas .av-card h4.av-zh{font:900 20px "Noto Serif SC",serif;font-style:normal}
.av-xmas .av-card .av-cl{font:500 11.5px/1.6 "Cormorant Garamond","Noto Serif SC",serif;color:#6b5a2e;margin-top:6px;padding:0 8px}
.av-xmas .av-card svg{width:200px;display:block;margin:4px auto 0;background:radial-gradient(circle at 50% 45%,#21345f,#0b1430 75%);border-radius:10px}
.av-xmas .av-card .av-u{font:600 10px "Cormorant Garamond",serif;letter-spacing:.4em;color:#8f7a4c;margin-top:8px}
.av-xmas .av-shb{display:flex;gap:8px;justify-content:center;margin-top:12px}
.av-xmas .av-shb button{border:0;border-radius:99px;padding:9px 16px;font-weight:800;font-size:13px}
.av-xmas .av-shb .av-a{background:var(--hot);color:#fff}.av-xmas .av-shb .av-b{background:#fff;color:var(--ink)}

.av-xmas .av-cf{position:absolute;top:-12px;width:7px;height:11px;z-index:90;pointer-events:none;border-radius:1px}
.av-xmas .av-bigstamp{position:absolute;left:50%;top:38%;z-index:85;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;border:4px double #f3dfae;color:#f3dfae;display:grid;place-items:center;text-align:center;font:700 20px/1.2 "Cormorant Garamond",Georgia,serif;letter-spacing:.14em;background:rgba(10,17,39,.75);transform:rotate(-12deg) scale(2.4);opacity:0;pointer-events:none}
.av-xmas .av-bigstamp.av-zh{font:900 22px/1.3 "Noto Serif SC",serif;letter-spacing:.04em}
.av-xmas .av-bigstamp.av-on{animation:av-thunk2 .5s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes av-thunk2{100%{transform:rotate(-12deg) scale(1);opacity:1}}
.av-xmas .av-bigstamp.av-off{transition:opacity .8s;opacity:0!important}

.av-xmas{--ink:#14305c;--ivory:#fbf7ee;--hot:#e2552f;--gold:#d6be87;--gold2:#b8975a;--lac:#0c1630;--wine:#5a1828;--soft:#6b7488;--line:#e6dfcf;--desk:#ece4d3;--paper:#fffdf7;}
`;


/* ================= 首饰柜（格子位置、开法、漆面跟样板一样） ================= */
const GRID = {24:[1,2,1,3],13:[3,2,1,2],5:[5,1,1,1],18:[6,1,1,1],9:[5,2,2,1],1:[3,1,3,2],16:[4,3,3,1],7:[1,1,4,1],3:[2,1,4,2],20:[4,1,4,1],11:[5,2,4,2],14:[1,1,5,2],22:[3,2,5,2],8:[2,1,6,1],2:[5,1,6,1],10:[6,1,6,2],6:[1,3,7,1],19:[4,1,7,2],15:[5,1,7,1],12:[1,2,8,2],4:[3,1,8,1],17:[5,2,8,1],21:[3,1,9,1],23:[4,3,9,1]};
const KIND = {24:"ribbon",22:"ribbon",13:"double",12:"double",11:"drawer",1:"door",3:"door",14:"door",10:"door",19:"door",16:"drawer",9:"drawer",6:"drawer",17:"drawer",23:"drawer",5:"door",18:"drawer",7:"drawer",20:"door",8:"drawer",2:"door",15:"drawer",4:"door",21:"drawer"};
const FIN = {24:"ivory",22:"jade",13:"wine",12:"forest",3:"wine",8:"ivory",17:"wine",19:"forest",5:"ivory",21:"forest",14:"wine",7:"forest",2:"wine",15:"ivory"};
const BOW = `<svg class="av-bow" viewBox="0 0 46 30"><path d="M23 15C14 2 2 3 4 13c2 8 12 6 19 2z" fill="#f0dca8" stroke="#a3864d" stroke-width=".8"/><path d="M23 15C32 2 44 3 42 13c-2 8-12 6-19 2z" fill="#e3c98d" stroke="#a3864d" stroke-width=".8"/><path d="M22 16l-7 13l5-1l3 2zM24 16l7 13l-5-1l-3 2z" fill="#d1b373"/><circle cx="23" cy="15" r="3.6" fill="#f6e7bf" stroke="#a3864d" stroke-width=".8"/></svg>`;
const BOWW = BOW.replace(/#f0dca8/g, "#a33a50").replace(/#e3c98d/g, "#8a2234").replace(/#d1b373/g, "#7d1a2c").replace(/#f6e7bf/g, "#c04a60");
const roman = y => { const M = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let s = ""; for (const [v, r] of M) while (y >= v){ s += r; y -= v; } return s; };
// 树上 24 个位置
const ROWS = [[96,2,30],[138,3,40],[178,4,62],[222,4,58],[258,5,82],[294,6,104]];
const POS = []; ROWS.forEach(([y, n, h]) => { for (let i = 0; i < n; i++){ const x = 150 - h * .8 + (h * 1.6) * i / (n - 1); POS.push([x, y + (i % 2 ? 4 : -2)]); } });
const ORDER = [11,4,17,7,1,20,14,9,22,2,15,12,24,6,18,3,10,23,13,5,19,8,16,21];
function treeSVG(K, fresh, forCard){
  const S = K.S, lit = K.isFull();
  let s = `<defs><linearGradient id="av-tg1" x1="0" x2="1"><stop offset="0" stop-color="#173f31"/><stop offset=".5" stop-color="#2a6a50"/><stop offset="1" stop-color="#143628"/></linearGradient></defs>`;
  s += `<rect x="140" y="300" width="20" height="22" fill="#5b3a1e"/><path d="M116 318h68l-8 30h-52z" fill="#14305c" stroke="#d6be87" stroke-width="1.2"/><path d="M120 326h60" stroke="#d6be87" stroke-width=".8"/>`;
  s += `<path d="M150 128L262 300Q150 318 38 300Z" fill="url(#av-tg1)" stroke="#d6be87" stroke-width="1"/><path d="M150 70L228 200Q150 214 72 200Z" fill="url(#av-tg1)" stroke="#d6be87" stroke-width="1"/><path d="M150 36L198 124Q150 134 102 124Z" fill="url(#av-tg1)" stroke="#d6be87" stroke-width="1"/>`;
  s += `<g fill="none" stroke="#d6be87" stroke-width=".8" opacity=".55"><path d="M118 112Q150 124 186 104"/><path d="M92 176Q150 196 214 168"/><path d="M68 270Q150 292 240 256"/></g>`;
  let lg = ""; [[118,112,186,104,150,124],[92,176,214,168,150,196],[68,270,240,256,150,292]].forEach(([x1, y1, x2, y2, cx, cy]) => { for (let i = 1; i < 10; i++){ const u = i / 10, x = (1 - u) * (1 - u) * x1 + 2 * u * (1 - u) * cx + u * u * x2, y = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * cy + u * u * y2; lg += `<circle class="av-lt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3" fill="${["#ffe7a3","#ffcf7a","#fff3cf"][i % 3]}"${forCard && lit ? ' style="opacity:1"' : ""}/>`; } });
  s += `<g>${lg}</g><g class="av-topper" transform="translate(150 30)"><path d="M0-15L3.5-3.5L15 0L3.5 3.5L0 15L-3.5 3.5L-15 0L-3.5-3.5Z" fill="${lit ? "#ffe7a3" : "#d6be87"}"/><path d="M0-9L2-2L9 0L2 2L0 9L-2 2L-9 0L-2-2Z" transform="rotate(45)" fill="${lit ? "#fff3cf" : "#b8975a"}"/></g>`;
  ORDER.forEach((d, i) => { const [x, y] = POS[i], said = S.said.has(d), op = S.opened.has(d);
    if (said) s += `<g class="av-orn${fresh === d ? " av-drop av-swing" : ""}" transform="translate(${x.toFixed(1)} ${y})"><line x1="0" y1="-12" x2="0" y2="-1" stroke="#d6be87" stroke-width=".8"/><use href="#av-o-${d}" x="-17" y="-8" width="34" height="34"/></g>`;
    else if (op && !forCard) s += `<g transform="translate(${x.toFixed(1)} ${y})" opacity=".3"><line x1="0" y1="-12" x2="0" y2="-1" stroke="#d6be87" stroke-width=".8" stroke-dasharray="1.5 1.5"/><use href="#av-o-${d}" x="-17" y="-8" width="34" height="34"/></g>`;
    else s += `<circle cx="${x.toFixed(1)}" cy="${y}" r="1.6" fill="#d6be87" opacity=".7"/>`; });
  return s;
}
const unlockSnd = K => { K.SND.tone(392, 0, .08, .05, "triangle"); K.SND.tone(330, .08, .12, .04, "triangle"); };

window.ADVENT = window.ADV_MK({
  id: "xmas", key: "advent.v1", data: () => window.ADVENT_DATA, rootId: "advRoot", scope: "av-xmas", idp: "av-", litCls: "av-lit",
  show: ["2026-11-01", "2027-01-06"], fest: "2026-12-25",
  fonts: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Noto+Serif+SC:wght@600;900&display=swap",
  css: XCSS, defs: buildDefs,
  shell: K => `<div class="av-hd"><div class="av-brand">${K.SHIP()}HEYVOYO</div><div class="av-cd"></div><div class="av-sub"></div></div>
    <div class="av-cabwrap"><div class="av-cab"><div class="av-crest"><i></i><span>THE WORLD GIFT BOX · ${roman((K.C.data() || {}).year || 2026)}</span><i></i></div><div class="av-grid"></div></div><div class="av-feet"><i></i><i></i></div></div>
    <div class="av-hint"></div>
    <div class="av-treebox av-coll"><h3></h3><div class="av-tl"></div><svg class="av-tree av-collSvg" viewBox="0 0 300 360"></svg><button class="av-share"></button></div>`,
  head: K => { const {T, TN, UIZ, UIL, esc, q, P, S} = K, zh = UIZ(), cd = q(".av-cd"), n = P.left;
    if (K.roll()){ const r = K.N() - S.opened.size;   // rolling：数的是还没开的格子，不倒数离圣诞几天
      cd.innerHTML = r === 0 ? `<span class="av-t${zh ? " av-zh" : ""} av-merry">${esc(K.isFull() ? T("树亮了", "The tree is lit") : T("都开了", "All open"))}</span>`
        : zh ? `<span class="av-t av-zh">还有<br>没开的</span><span class="av-n av-bump">${r}</span><span class="av-t av-zh">格</span>` : `<span class="av-n av-bump">${r}</span><span class="av-t">${esc(r === 1 ? T("格没开", "drawer to open") : T("格没开", "drawers to open")).replace(" to ", UIL() === "en" ? "<br>to " : " to ")}</span>`;
      setTimeout(() => { const e = q(".av-cd .av-n"); e && e.classList.remove("av-bump"); }, 300);
      const sb = q(".av-sub"); sb.className = "av-sub" + (zh ? " av-zh" : ""); sb.textContent = K.isFull() ? T("你的树亮了。", "Your tree is lit.") : S.said.size ? TN("你的树上挂了 {n} 件。", "{n} on your tree.", S.said.size) : T("每天一件小东西，来自世界上的一座城。", "One small thing a day, from a city somewhere in the world.");
      const h = q(".av-hint"); h.className = "av-hint" + (zh ? " av-zh" : ""); h.textContent = P.k === "post" ? T("二十四格都能开了，没开的随时补上。", "All twenty-four drawers can be opened now — catch up on any of them.") : TN("今天能开到第 {n} 格。没开的格子一直替你留着，随时补上。", "Today you can open up to drawer {n}. Unopened ones wait for you — catch up anytime.", P.day);
      return; }
    if (P.k === "post") cd.innerHTML = `<span class="av-t${zh ? " av-zh" : ""} av-merry">${esc(T("圣诞快乐", "Merry Christmas"))}</span>`;
    else if (zh) cd.innerHTML = `<span class="av-t av-zh">离圣诞<br>还有</span><span class="av-n av-bump">${n}</span><span class="av-t av-zh">天</span>`;
    else { const t = n === 1 ? T("离圣诞的天数（1 天）", "day to Christmas") : T("离圣诞的天数", "days to Christmas"); cd.innerHTML = `<span class="av-n av-bump">${n}</span><span class="av-t">${UIL() === "en" ? t.replace(" to ", "<br>to ") : esc(t)}</span>`; }
    setTimeout(() => { const e = q(".av-cd .av-n"); e && e.classList.remove("av-bump"); }, 300);
    const sub = P.k === "pre" ? T("12 月 1 日开第一格。", "The first drawer opens on 1 December.") : P.k === "post" ? (K.isFull() ? T("你的树亮了。", "Your tree is lit.") : S.said.size ? TN("你的树上挂了 {n} 件。", "{n} on your tree.", S.said.size) : T("圣诞过了，礼盒还开着。", "Christmas is over; the box is still open.")) : n === 1 ? T("明天就是圣诞。", "Christmas is tomorrow.") : T("每天一件小东西。", "One small thing a day.");
    const hint = P.k === "pre" ? T("12 月 1 日起，每天开当天的一格。错过的，一直替你留着。", "From 1 December, open one drawer a day. Missed one? It waits for you.")
      : P.k === "post" ? T("错过的格子还能补开，一直到 1 月 6 日。", "Missed drawers stay open until 6 January.")
      : T("今天的这一格开了，错过的随时补开。", "Today's drawer is open. Missed ones can be opened any time.");
    const sb = q(".av-sub"); sb.className = "av-sub" + (zh ? " av-zh" : ""); sb.textContent = sub;
    const h = q(".av-hint"); h.className = "av-hint" + (zh ? " av-zh" : ""); h.textContent = hint; },
  cell: (K, d) => { const {T, esc, UIZ, S} = K, [c, cs, r, rs] = GRID[d], k = KIND[d], f = FIN[d] || "navy", st = K.stateOf(d), a = cs * rs, z = a >= 6 ? 6 : a === 4 ? 2 : a === 3 ? 3 : 1;
    const lb = st === "lock" ? (K.lockIn(d) === 1 ? T("明天", "tomorrow") : K.TN("还有 {n} 天", "in {n} days", K.lockIn(d))) : st === "today" ? T("今天", "today") : st === "miss" ? (z === 1 ? T("补开", "catch up") : T("随时补开", "catch up")) : "";
    let deco = "";
    if (k === "drawer") deco = `<i class="av-knob"></i>`;
    if (k === "door") deco = `<i class="av-hinge av-a"></i><i class="av-hinge av-b"></i><i class="av-pull"></i>`;
    if (k === "ribbon") deco = `<i class="av-rbv"></i><i class="av-rbh"></i>${f === "ivory" ? BOWW : BOW}`;
    if (k === "double") deco = `<i class="av-leafL"></i><i class="av-leafR"></i>`;
    const inside = st === "open" ? `${K.useSvg(d)}<i class="av-tg">${d}</i>${S.said.has(d) ? "" : `<i class="av-wait">${esc(T("等你说", "say it"))}</i>`}` : "";
    return `<button class="av-cell av-k-${k} av-f-${f} av-s-${st} av-z${z}${rs === 1 && cs > 1 ? " av-flat" : ""}" data-d="${d}" style="grid-column:${c}/span ${cs};grid-row:${r}/span ${rs}" aria-label="${K.roll() ? d : "12/" + d}">
    <span class="av-inside">${inside}</span><span class="av-face">${deco}<span class="av-num">${d}</span>${lb ? `<span class="av-lb${UIZ() ? " av-zh" : ""}">${esc(lb)}</span>` : ""}</span>${st === "today" ? `<i class="av-shine"></i>` : ""}</button>`; },
  // 门转开 / 抽屉拉出 / 对开门 / 丝带滑开，叮的一声
  openFx: (K, b, d) => { b.querySelector(".av-inside").innerHTML = K.useSvg(d) + `<i class="av-tg">${d}</i>`; b.classList.add("av-opening");
    KIND[d] === "ribbon" ? unlockSnd(K) : K.SND.thunk(); setTimeout(K.chime, KIND[d] === "ribbon" ? 380 : 220); return {delay: 1050, oy: .5, pdelay: 180}; },
  stage: (K, d, gl) => `<button class="av-x" data-avx aria-label="${K.esc(K.T("关上", "Close"))}">✕</button><div class="av-dt">${K.esc(K.roll() ? K.TN("第 {n} 格", "DRAWER {n}", d) : K.TN("12 月 {n} 日", "{n} DECEMBER", d))}</div>${gl}<i class="av-tray"></i>${K.useSvg(d, "av-big")}`,
  stampHTML: (K, d) => (K.UIZ() ? "收进<br>你的盒子" : K.esc(K.T("收进你的盒子", "IN YOUR BOX"))) + `<small>${K.esc(K.roll() ? K.TN("第 {n} 格", "DRAWER {n}", d) : K.TN("12 月 {n} 日", "{n} DECEMBER", d))}</small>`,
  dlab: (K, d) => K.roll() ? K.TN("第 {n} 格", "Drawer {n}", d) : K.TN("12 月 {n} 日", "{n} DECEMBER", d),
  onDay: (K, d, c) => K.TN("12 月 {n} 日在{c}", "On {n} December in {c}", d).replace("{c}", c),
  collSVG: treeSVG,
  t: {
    done: () => T_("收进盒子了", "In your box"), back: () => T_("回到礼盒", "Back to the box"),
    locked: n => n === 1 ? T_("这一格明天才开。", "This one opens tomorrow.") : T_("这一格还有 {n} 天才开。", "This one opens in {n} days.").replace(/\{n\}/g, n),
    toastIn: o => T_("{o}挂上你的树了", "{o} is on your tree").replace("{o}", o),
    none: () => T_("这一格还没有人送出话。", "Nobody has sent a line for this drawer yet."),
    miss: () => T_("没录到你的声音。再点一下，说出来才挂上树。", "Didn't catch your voice. Tap again — it goes on your tree once you say it."),
    collH: () => T_("你的圣诞树", "Your tree"),
    collL: n => n === 0 ? T_("打开的小东西会挂在这里。", "Each thing you open hangs here.") : n === 24 ? T_("二十四件，树亮了。", "All twenty-four. It's lit.") : n === 1 ? T_("来自 1 个地方的 1 件小东西。", "1 small thing from 1 place.") : T_("来自 {n} 个地方的 {n} 件小东西。", "{n} small things from {n} places.").replace(/\{n\}/g, n)
  },
  finaleZhCls: K => K.UIZ(),
  finaleHTML: K => K.UIZ() ? (K.roll() || (K.P && K.P.k === "post") ? "树亮了" : "平安夜<br>树亮了") : K.UIL() === "en" ? "THE TREE<br>IS LIT" : K.esc(K.T("树亮了", "THE TREE IS LIT")),
  card: K => ({title: K.T("我的世界礼盒", "My World Gift Box"), vb: "0 0 300 360", svg: treeSVG(K, 0, true), foot: "HEYVOYO · " + ((K.C.data() || {}).year || "")}),
  bar: (K, p, st) => { const {T, TN} = K;
    if (K.roll()){ const n = Math.min(p.day, K.N());   // rolling：一直在，按你自己开到第几格说
      if (!st.raw.d0) return {emoji: "🎁", big: T("圣诞倒数日历 · 24 格", "Christmas countdown · 24 drawers"), small: T("随时可以开始 · 一天开一格", "Start anytime · one drawer a day"), num: 1};
      if (st.said.size === K.N()) return {emoji: "🎁", big: T("你的树亮了", "Your tree is lit"), small: T("二十四件都挂上了", "All twenty-four are on it"), num: "✦"};
      return {emoji: "🎁", big: TN("圣诞礼盒 · 第 {n} 格", "Christmas box · drawer {n}", n),
        small: st.opened.has(n) ? (st.said.size ? TN("今天这一格开过了 · 树上有 {n} 件", "Today's drawer is open · {n} on your tree", st.said.size) : T("今天这一格开过了", "Today's drawer is open")) : TN("今天开第 {n} 格", "Open drawer {n} today", n), num: n}; }
    if (p.k === "post") return {emoji: "🎁", big: T("圣诞快乐", "Merry Christmas"), small: st.said.size ? TN("你的树上挂了 {n} 件", "{n} on your tree", st.said.size) : T("错过的格子还能补开", "Missed drawers are still open"), num: "✦"};
    return {emoji: "🎁", big: p.left === 1 ? T("离圣诞还有 1 天", "1 day to Christmas") : TN("离圣诞还有 {n} 天", "{n} days to Christmas", p.left),
      small: p.k === "pre" ? T("12 月 1 日开第一格", "The first drawer opens on 1 December")
        : st.opened.has(p.day) ? (st.said.size ? TN("今天这一格开过了 · 树上有 {n} 件", "Today's drawer is open · {n} on your tree", st.said.size) : T("今天这一格开过了", "Today's drawer is open"))
        : TN("今天开第 {n} 格", "Open drawer {n} today", p.day), num: p.k === "on" ? p.day : 1}; }
});
})();

/* advent_spring.js */

// 🧧 春节红包日历（2027-01，样板 样板/春节红包日历样板.html，用户「可以，放进软件」）：腊八到除夕 22 天，一天拆一个挂在卷轴上的红包；
//   说出来的那件小东西贴上你的红门，22 件都贴上，门楣出「福」、灯笼亮、贴春联、盖「过年好」大章。
// 圣诞那一条 1 月 6 日下架，1 月 7 日起「今天」最上面换成「🧧 离春节还有 N 天」，到正月十五（2027-02-20）。进度 advent_spring.v1（在 SYNC_KEYS 里）。
// 内容 content-skeleton/advent/2027_spring.json（gen_advent.py → d93_advent_spring.js）。共用的芯在 advent.js（window.ADV_MK）。对外 window.ADVENT_SPRING = {bar, open, close, phase}
(function(){
if (window.ADVENT_SPRING || !window.ADV_MK) return;
const T_ = window.ADV_MK.T;
const SH=(cx,cy,rx)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx*.16).toFixed(1)}" fill="#000" opacity=".22"/>`;
const rng=seed=>{let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280}};
const ring=(n,r,cx,cy,f)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2-Math.PI/2;return f(cx+Math.cos(a)*r,cy+Math.sin(a)*r,a*180/Math.PI,i)}).join("");
const flower=(x,y,r,c,c2)=>ring(5,r*.9,x,y,(px,py)=>`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${c}"/>`)+`<circle cx="${x}" cy="${y}" r="${(r*.6).toFixed(1)}" fill="${c2}"/>`;
const ZI=(x,y,s,t,c,extra="")=>`<text x="${x}" y="${y}" font-size="${s}" fill="${c}" text-anchor="middle" font-family="Ma Shan Zheng,Noto Serif SC,serif" ${extra}>${t}</text>`;
const DRAW={
 1:()=>{const r=rng(7);let tops="";for(let i=0;i<16;i++){const x=58+r()*84,y=90+r()*12,k=i%4;tops+=k===0?`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.5" ry="4" fill="#9b1426" transform="rotate(${(r()*60-30).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/><path d="M${(x-3).toFixed(1)} ${(y-1).toFixed(1)}q3-2 6 0" stroke="#d24a55" stroke-width="1" fill="none"/>`:k===1?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#c98a3c"/><circle cx="${(x-1).toFixed(1)}" cy="${(y-1.2).toFixed(1)}" r="1.4" fill="#f0c890"/>`:k===2?`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="3.2" fill="#fff6e6"/>`:`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="1.8" fill="#4a1a1e"/>`}
  return SH(100,170,60)+`<path d="M86 52q-8-10 0-20t0-20M112 54q-8-10 0-20t0-20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55" class="av-steam"/>
  <rect x="76" y="156" width="48" height="10" rx="3" fill="#dfe6f0" stroke="#2b4a8a" stroke-width="1.5"/>
  <path d="M36 96Q38 162 100 164Q162 162 164 96Z" fill="url(#avs-porc)" stroke="#2b4a8a" stroke-width="2"/>
  <path d="M46 118q14-8 27 0t27 0t27 0t27 0" stroke="#2b5aa8" stroke-width="2.2" fill="none"/>
  <g fill="#2b5aa8">${[62,100,138].map(x=>`<circle cx="${x}" cy="138" r="5"/><circle cx="${x-7}" cy="138" r="2.4"/><circle cx="${x+7}" cy="138" r="2.4"/><circle cx="${x}" cy="131" r="2.4"/><circle cx="${x}" cy="145" r="2.4"/>`).join("")}</g>
  <ellipse cx="100" cy="96" rx="64" ry="17" fill="#f6f9fd" stroke="#2b4a8a" stroke-width="2"/>
  <ellipse cx="100" cy="97" rx="57" ry="12.5" fill="url(#avs-cong)"/>${tops}
  <path d="M128 98L176 64" stroke="#e9eef6" stroke-width="7" stroke-linecap="round"/><path d="M128 98L176 64" stroke="#2b4a8a" stroke-width="1.2" stroke-linecap="round" opacity=".5"/><ellipse cx="124" cy="101" rx="11" ry="6" fill="#f6f9fd" stroke="#2b4a8a" stroke-width="1.2"/>`},
 2:()=>SH(100,172,66)+`<path d="M24 172q20-22 44-14q22-12 40-2q24-10 46 0q16-4 26 16Z" fill="#f5f9ff"/><path d="M30 170q30-8 60 0" stroke="#d9e6f5" stroke-width="2" fill="none"/>
  <circle cx="100" cy="116" r="62" fill="url(#avs-warm)"/>
  <path d="M56 162L64 66Q100 52 136 66L144 162Z" fill="url(#avs-ice)" stroke="#e8f4ff" stroke-width="2"/>
  <path d="M64 66Q100 80 136 66" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
  <path d="M70 80l-3 70M128 82l4 66M98 74v10" stroke="#fff" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>
  <path d="M60 140q8-4 12 4M126 120q6 4 12-2M80 98l6 6" stroke="#cfe6fa" stroke-width="1.5" fill="none"/>
  <ellipse cx="100" cy="128" rx="34" ry="30" fill="#ffd27a" opacity=".45" filter="url(#avs-soft)"/>
  <rect x="93" y="122" width="14" height="34" rx="2" fill="#d23a2e"/><rect x="93" y="122" width="5" height="34" fill="#f06a5a" opacity=".6"/>
  <path d="M100 96C92 106 92 116 100 120C108 116 108 106 100 96Z" fill="url(#avs-flame)" class="av-flk"/>`,
 3:()=>`<rect x="34" y="26" width="132" height="152" rx="3" fill="#f4e7c8"/><rect x="34" y="26" width="132" height="152" rx="3" fill="url(#avs-age)"/>
  <rect x="41" y="33" width="118" height="138" fill="none" stroke="#c8202f" stroke-width="5"/><rect x="48" y="40" width="104" height="124" fill="none" stroke="#d9b46a" stroke-width="1.2"/>
  <path d="M60 126C70 102 116 98 146 112L162 100L158 126L162 150L146 138C116 152 72 150 60 126Z" fill="#e8762c"/>
  <path d="M60 126C72 118 120 112 146 116" stroke="#b9471a" stroke-width="1.5" fill="none"/>${[78,92,106,120,134].map(x=>`<path d="M${x} 114q6 8 0 16" stroke="#f7b06a" stroke-width="2" fill="none"/>`).join("")}
  <circle cx="68" cy="122" r="3" fill="#1a1a1a"/><path d="M146 112L162 100L158 126L162 150L146 138" fill="#f2a03a"/>
  <path d="M80 104C78 92 84 86 96 86C108 86 116 92 114 104Z" fill="#c8202f"/><path d="M84 96h26" stroke="#f2c230" stroke-width="2.5"/><circle cx="97" cy="99" r="4" fill="#f2c230"/>
  <circle cx="97" cy="66" r="21" fill="#fbe2cc"/><path d="M84 52q4-10 13-8q9-2 13 8q-6-4-13-3q-7-1-13 3Z" fill="#1a1a1a"/><circle cx="97" cy="46" r="5" fill="#1a1a1a"/>
  <circle cx="89" cy="66" r="2.2" fill="#1a1a1a"/><circle cx="105" cy="66" r="2.2" fill="#1a1a1a"/><path d="M91 75q6 5 12 0" stroke="#c8202f" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="84" cy="73" r="4" fill="#f28a8a" opacity=".7"/><circle cx="110" cy="73" r="4" fill="#f28a8a" opacity=".7"/>
  <path d="M80 104q-14 8-6 22M114 104q14 6 8 22" stroke="#fbe2cc" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M120 140q6 14-4 22M76 140q-8 12 2 22" stroke="#2f6b4f" stroke-width="3" fill="none"/>`,
 4:()=>{const r=58,cx=100,cy=100;let s=`<rect x="22" y="22" width="156" height="156" fill="#f3e6c8"/><g stroke="#8a5a32" stroke-width="5"><rect x="22" y="22" width="156" height="156" fill="none"/><path d="M100 22v26M100 152v26M22 100h26M152 100h26"/></g>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#c8202f"/>`;
  s+=ring(28,r,cx,cy,(x,y)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="#c8202f"/>`);
  s+=ring(28,r-6,cx,cy,(x,y)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="#f3e6c8"/>`);
  s+=ring(12,42,cx,cy,(x,y,a)=>`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="3.2" fill="#f3e6c8" transform="rotate(${(a+90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  s+=ring(12,42,cx,cy,(x,y,a,i)=>i%2?"":`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${["#f2c230","#3f9a5a","#e85a8a"][i%3]}"/>`);
  s+=ring(8,22,cx,cy,(x,y,a,i)=>`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="7" fill="${i%2?"#e85a8a":"#f2a03a"}" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  s+=ring(8,22,cx,cy,(x,y,a)=>`<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#c8202f" stroke-width="1.6"/>`);
  s+=`<circle cx="${cx}" cy="${cy}" r="11" fill="#f2c230"/><circle cx="${cx}" cy="${cy}" r="5" fill="#c8202f"/>`+ring(4,33,cx,cy,(x,y,a)=>`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3" fill="#3f9a5a" transform="rotate(${(a+45).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  return s},
 5:()=>SH(100,176,56)+`<circle cx="100" cy="112" r="70" fill="url(#avs-warm)"/>
  <path d="M100 150v18" stroke="#c8202f" stroke-width="2"/><path d="M96 168h8l3 14h-14z" fill="#c8202f"/><path d="M95 182l-2 8M100 182v9M105 182l2 8" stroke="#c8202f" stroke-width="1.5"/>
  <g fill="#e9d7b0"><rect x="66" y="132" width="10" height="26" rx="4"/><rect x="82" y="136" width="10" height="24" rx="4"/><rect x="112" y="136" width="10" height="24" rx="4"/><rect x="128" y="132" width="10" height="26" rx="4"/></g>
  <ellipse cx="100" cy="114" rx="50" ry="32" fill="url(#avs-lampw)" stroke="#e5cfa0" stroke-width="1.5"/>
  ${[70,85,100,115,130].map(x=>`<path d="M${x} ${84+Math.abs(x-100)*.25}Q${x+(x-100)*.12} 114 ${x} ${144-Math.abs(x-100)*.25}" stroke="#ead9b4" stroke-width="1" fill="none"/>`).join("")}
  <path d="M78 90Q100 82 122 90L126 132Q100 140 74 132Z" fill="#c8202f"/><path d="M78 90Q100 82 122 90M74 132Q100 140 126 132" stroke="#f2c230" stroke-width="2.5" fill="none"/><circle cx="100" cy="110" r="7" fill="none" stroke="#f2c230" stroke-width="2"/>
  <ellipse cx="148" cy="86" rx="20" ry="17" fill="url(#avs-lampw)" stroke="#e5cfa0" stroke-width="1.5"/>
  <path d="M138 74C126 60 144 50 150 62C154 70 144 74 142 68" stroke="#d9b46a" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M158 72C170 58 154 48 148 58" stroke="#d9b46a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
  <ellipse cx="164" cy="90" rx="7" ry="5" fill="#f3e7cf"/><circle cx="150" cy="84" r="2.4" fill="#2a1a10"/><path d="M160 94q4 2 7 0" stroke="#2a1a10" stroke-width="1.2" fill="none"/>
  <path d="M152 102q-4 6 0 10" stroke="#f2c230" stroke-width="2" fill="none"/><circle cx="152" cy="114" r="4.5" fill="#f2c230"/>
  <path d="M50 108q-14 0-12 12" stroke="#ead9b4" stroke-width="5" fill="none" stroke-linecap="round"/>`,
 6:()=>{const stick=(rot)=>`<g transform="rotate(${rot} 100 108)"><rect x="40" y="101" width="120" height="14" rx="7" fill="#7a3a1a"/><rect x="40" y="101" width="22" height="14" rx="7" fill="#1a1a1a"/><rect x="62" y="101" width="10" height="14" fill="#c8202f"/><rect x="76" y="101" width="6" height="14" fill="#f2c230"/><rect x="118" y="101" width="6" height="14" fill="#f2c230"/><rect x="128" y="101" width="10" height="14" fill="#c8202f"/><rect x="138" y="101" width="22" height="14" rx="7" fill="#1a1a1a"/><rect x="40" y="103" width="120" height="3" fill="#fff" opacity=".18"/></g>`;
  return SH(100,176,54)+`<path d="M100 30C64 30 52 62 54 92C56 128 76 158 100 160Z" fill="#c8202f"/><path d="M100 30C136 30 148 62 146 92C144 128 124 158 100 160Z" fill="#1d1d22"/>
  <path d="M62 70q16-14 32-2M106 68q16-12 32 2" stroke="#f2c230" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M64 88q12-10 26 0q-12 10-26 0ZM110 88q12-10 26 0q-12 10-26 0Z" fill="#fff"/><circle cx="77" cy="88" r="4" fill="#1a1a1a"/><circle cx="123" cy="88" r="4" fill="#fff" stroke="#1a1a1a" stroke-width="2"/><circle cx="123" cy="88" r="2" fill="#1a1a1a"/>
  <path d="M100 96v28M88 136q12 8 24 0" stroke="#f2c230" stroke-width="3" fill="none"/><path d="M68 112l14 6M132 112l-14 6" stroke="#fff" stroke-width="3"/>`+stick(32)+stick(-32)+`<path d="M44 128l-12 22M46 130l-4 26" stroke="#e2552f" stroke-width="2.5"/><path d="M156 128l12 22M154 130l4 26" stroke="#f2c230" stroke-width="2.5"/>`},
 7:()=>SH(100,176,72)+`<circle cx="100" cy="116" r="76" fill="url(#avs-warm)" opacity=".7"/>
  <path d="M30 128C30 100 62 92 92 96C112 98 124 92 132 74C138 58 144 42 158 40C170 38 176 48 170 56C164 62 156 58 152 66C146 82 146 104 138 118C128 136 104 140 84 138C66 150 40 156 22 150C34 146 36 140 30 128Z" fill="url(#avs-dino)" stroke="#2f7a3f" stroke-width="1.5"/>
  <g stroke="#2f7a3f" stroke-width="1" fill="none" opacity=".55"><path d="M50 104q4 20 0 40M70 98q6 22 0 42M92 96q6 22 0 42M114 96q6 18-2 36M134 82q6 14 2 30M146 56q6 10 2 22"/><path d="M34 122q50-8 104-10M44 140q40 2 84-10"/></g>
  <g fill="#f2903a">${[[56,94],[72,90],[88,90],[104,90],[120,84],[132,70],[140,56]].map(([x,y])=>`<path d="M${x-6} ${y+4}L${x} ${y-8}L${x+6} ${y+4}Z"/>`).join("")}</g>
  <circle cx="162" cy="47" r="2.6" fill="#1a3a20"/><path d="M164 54q4 1 6-2" stroke="#1a3a20" stroke-width="1.2" fill="none"/>
  <g fill="#7fd08f"><rect x="58" y="136" width="13" height="30" rx="5"/><rect x="80" y="136" width="13" height="30" rx="5"/><rect x="108" y="130" width="13" height="34" rx="5"/><rect x="124" y="124" width="13" height="38" rx="5"/></g>
  ${[[22,60],[178,96]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M0-14v6" stroke="#d9b46a" stroke-width="1.5"/><rect x="-5" y="-9" width="10" height="4" fill="#d9b46a"/><ellipse rx="10" ry="12" cy="4" fill="url(#avs-lan)"/><rect x="-5" y="15" width="10" height="3" fill="#d9b46a"/><path d="M0 18v10" stroke="#c8202f" stroke-width="2"/></g>`).join("")}`,
 8:()=>`<path d="M118 12C150 30 160 70 150 120C144 150 150 176 168 196" stroke="#3a5a40" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M118 12C150 30 160 70 150 120" stroke="#5a7a5a" stroke-width="3" fill="none" opacity=".6"/>
  `+SH(100,156,72)+`<g transform="rotate(-6 100 100)"><path d="M26 62h148v76H26z" fill="#f5c6be"/><circle cx="26" cy="100" r="9" fill="#fbf7ee"/><circle cx="174" cy="100" r="9" fill="#fbf7ee"/>
  <path d="M26 62h148v76H26z" fill="url(#avs-tkt)" opacity=".6"/><path d="M36 74h128" stroke="#d98a80" stroke-width="1"/>
  <text x="62" y="102" font-size="17" font-weight="900" fill="#3a1a1a" text-anchor="middle" font-family="Noto Serif SC,serif">广州南</text><text x="62" y="116" font-size="7.5" fill="#6a3a3a" text-anchor="middle" font-family="Georgia,serif" letter-spacing="1">GUANGZHOUNAN</text>
  <path d="M90 98h22l-6-5M112 98l-6 5" stroke="#3a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <text x="140" y="102" font-size="17" font-weight="900" fill="#c8202f" text-anchor="middle" font-family="Noto Serif SC,serif">回家</text><text x="140" y="116" font-size="7.5" fill="#6a3a3a" text-anchor="middle" font-family="Georgia,serif" letter-spacing="1">HOME</text>
  <text x="40" y="132" font-size="9" fill="#5a2a2a" font-family="Georgia,serif">2027 · 01 · 22</text><text x="164" y="132" font-size="9" fill="#5a2a2a" text-anchor="end" font-family="Georgia,serif">¥ · · ·</text>
  <path d="M160 62l8 0l0 8z" fill="#fbf7ee"/><rect x="40" y="80" width="40" height="3" fill="#d98a80"/></g>`,
 9:()=>SH(100,180,74)+`<path d="M146 150C170 162 192 150 196 126" stroke="url(#avs-gGold)" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M146 150C170 162 192 150 196 126" stroke="#a3742a" stroke-width="22" fill="none" stroke-dasharray="3 7" opacity=".45"/>
  ${[[150,34],[166,48],[178,66],[184,88],[182,110],[172,130],[156,144]].map(([x,y],i)=>`<path d="M${x-10} ${y+10}Q${x+8} ${y-14} ${x+16} ${y+2}Q${x+6} ${y+4} ${x+4} ${y+16}Z" fill="${i%2?"#e2552f":"#c8202f"}"/>`).join("")}
  <path d="M136 54C134 34 146 18 164 12M146 34l16 2M140 44l-12-12" stroke="#d9b46a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M122 54C116 36 122 22 134 14M120 40l-12-6" stroke="#b8892e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M146 62C126 48 98 52 82 62L34 72C20 76 18 92 30 96L64 98C72 104 72 112 64 116L38 120C28 124 32 136 44 134L88 128C112 142 146 134 156 112C164 94 162 72 146 62Z" fill="url(#avs-gGold)" stroke="#a3742a" stroke-width="2"/>
  <path d="M64 98L30 97C40 106 40 112 37 120L64 116C72 110 72 104 64 98Z" fill="#9e1420"/>
  ${[34,42,50,58].map(x=>`<path d="M${x} 97l3 7l3-7z" fill="#fff"/><path d="M${x+2} 120l3-7l3 7z" fill="#fff"/>`).join("")}
  <circle cx="38" cy="80" r="7" fill="#f2c94a" stroke="#a3742a" stroke-width="1.5"/><circle cx="37" cy="80" r="2.4" fill="#3a1a0a"/>
  <path d="M60 70q12-8 26 0M66 80q10-6 20 0M70 90q8-4 16 0" stroke="#a3742a" stroke-width="1.6" fill="none"/>
  <path d="M96 64q18-12 34 2" stroke="#2a6a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="114" cy="78" r="12" fill="#fff" stroke="#c8202f" stroke-width="3"/><circle cx="110" cy="79" r="6" fill="#111"/><circle cx="108" cy="76" r="2" fill="#fff"/>
  <path d="M34 84C14 82 4 96 10 112C14 124 6 132 -2 132" stroke="#fff6dc" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M40 76C26 60 10 62 6 50" stroke="#fff6dc" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M60 130q-6 16 6 26M74 132q-2 14 10 20M88 132q2 12 14 14" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="26" cy="164" r="11" fill="#fff3c4" stroke="#e8c06a" stroke-width="2"/><path d="M26 150q-10-8 0-18q2 8 8 10q-2-8 4-12q6 12-2 20" fill="#e2552f" opacity=".85"/>`,
 10:()=>{let s=`<rect x="10" y="30" width="180" height="150" fill="#d9cbb0" opacity=".25"/>`;for(let x=14;x<190;x+=18)s+=`<path d="M${x} 150v40" stroke="#3a3a3a" stroke-width="2.5" opacity=".55"/>`;s+=`<path d="M10 150h180" stroke="#3a3a3a" stroke-width="3" opacity=".55"/>`;
  s+=`<rect x="8" y="34" width="184" height="8" rx="4" fill="#c8a45a"/>${[40,90,140].map(x=>`<rect x="${x}" y="33" width="3" height="10" fill="#8a6a2a"/>`).join("")}`;
  [[38,4],[64,5],[90,4]].forEach(([x,n])=>{s+=`<path d="M${x} 38v8" stroke="#e9dcc0" stroke-width="1.5"/>`;for(let i=0;i<n;i++){const y=56+i*24;s+=`<ellipse cx="${x}" cy="${y}" rx="7.5" ry="12" fill="#8e1f1f"/><ellipse cx="${x-2.5}" cy="${y-3}" rx="2" ry="5" fill="#d0606a" opacity=".6"/>${[...Array(4)].map((_,k)=>`<circle cx="${x+(k%2?3:-3)}" cy="${y-6+k*4}" r="1" fill="#f0d0b0" opacity=".7"/>`).join("")}<path d="M${x-3} ${y+12}h6" stroke="#e9dcc0" stroke-width="2"/>`}});
  s+=`<path d="M138 38v16" stroke="#e9dcc0" stroke-width="1.5"/><g transform="rotate(4 138 100)"><path d="M112 54h52l-2 92h-48z" fill="#3a1a12"/><path d="M114 60h48v14h-48z" fill="#e9d6b4"/><path d="M114 74h48v10h-48z" fill="#7a3020"/><path d="M114 84h48v16h-48z" fill="#efdfc2"/><path d="M114 100h48v12h-48z" fill="#8a3a24"/><path d="M114 112h48v30h-48z" fill="#5a2216"/><path d="M114 60l48 0" stroke="#1a0a06" stroke-width="2"/><circle cx="138" cy="58" r="3" fill="#e9dcc0"/></g>`;
  return s},
 11:()=>{const cx=100,cy=104,R=76;const oct=r=>Array.from({length:8},(_,i)=>{const a=(i/8)*Math.PI*2+Math.PI/8;return `${(cx+Math.cos(a)*r).toFixed(1)} ${(cy+Math.sin(a)*r).toFixed(1)}`}).join(" L");
  let s=SH(100,184,70)+`<path d="M${oct(R)}Z" fill="#9e1420"/><path d="M${oct(R-6)}Z" fill="#c8202f" stroke="#f2c230" stroke-width="2.5"/>`;
  s+=ring(8,R-6,cx,cy,(x,y)=>`<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#f2c230" stroke-width="2.5"/>`).replace(/ring/,"");
  const r=rng(3);const items=[(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="6" ry="3.6" fill="#d9b48a"/><path d="M${x-3} ${y}h6" stroke="#b08a5a" stroke-width="1"/>`,(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2" fill="#2a2a2a"/><path d="M${x-2} ${y}h4" stroke="#fff" stroke-width=".7"/>`,(x,y)=>`<rect x="${x-5}" y="${y-3.5}" width="10" height="7" rx="2" fill="#f2c230"/><path d="M${x-5} ${y}l-4-3v6zM${x+5} ${y}l4-3v6z" fill="#f2c230"/>`,(x,y)=>`<circle cx="${x}" cy="${y}" r="4.6" fill="#e2552f"/><circle cx="${x-1.5}" cy="${y-1.5}" r="1.4" fill="#fff" opacity=".6"/>`];
  for(let k=0;k<8;k++){const a0=(k/8)*Math.PI*2+Math.PI/8,a1=a0+Math.PI/4;for(let j=0;j<6;j++){const t=a0+(a1-a0)*(.2+r()*.6),rr=36+r()*26;s+=items[k%4]((cx+Math.cos(t)*rr).toFixed(1),(cy+Math.sin(t)*rr).toFixed(1))}}
  s+=`<circle cx="${cx}" cy="${cy}" r="24" fill="#c8202f" stroke="#f2c230" stroke-width="2.5"/>${ZI(cx,cy+10,28,"福","#f2c230")}`;return s},
 12:()=>{let s=`<g opacity=".18">${[...Array(7)].map((_,r)=>[...Array(5)].map((_,c)=>`<rect x="${c*44+(r%2?-22:0)}" y="${r*28}" width="42" height="26" fill="#8a3a24"/>`).join("")).join("")}</g><rect x="140" y="110" width="44" height="62" fill="#2a3a5a" opacity=".35"/><path d="M162 110v62M140 140h44" stroke="#fbf7ee" stroke-width="3" opacity=".5"/>`;
  s+=`<path d="M6 42Q100 78 194 46" stroke="#3a2a1a" stroke-width="2" fill="none"/>`;
  [[52,60,1],[100,68,1.12],[148,62,1]].forEach(([x,y,k])=>{s+=`<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 -6v10" stroke="#3a2a1a" stroke-width="1.5"/><rect x="-11" y="4" width="22" height="7" rx="2" fill="url(#avs-gGold)"/><ellipse cx="0" cy="40" rx="27" ry="30" fill="url(#avs-lan)"/>${[-16,-6,6,16].map(dx=>`<path d="M${dx} 12Q${dx*1.5} 40 ${dx} 68" stroke="#8e1420" stroke-width="1.2" fill="none" opacity=".7"/>`).join("")}<rect x="-11" y="68" width="22" height="6" rx="2" fill="url(#avs-gGold)"/><path d="M-4 74v18M0 74v20M4 74v18" stroke="#e2552f" stroke-width="1.6"/><rect x="-3" y="72" width="6" height="5" fill="#f2c230"/></g>`});
  return s},
 13:()=>{const slab=(y,top)=>`<g transform="translate(0 ${y})"><path d="M36 60L132 44L166 60L70 78Z" fill="${top?"#fffdf7":"#f6f1e4"}" stroke="#e3dccb" stroke-width="1"/><path d="M36 60L70 78L70 96L36 78Z" fill="#e8e0cc"/><path d="M70 78L166 60L166 78L70 96Z" fill="#f1ead8"/></g>`;
  return SH(100,180,72)+slab(64,0)+slab(40,0)+slab(16,1)+`<g transform="translate(101 76) rotate(-10) scale(1 .5)"><circle r="22" fill="none" stroke="#e2552f" stroke-width="2.5"/>${ring(8,16,0,0,(x,y)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#e2552f" opacity=".85"/>`)}</g>
  <text x="101" y="82" font-size="15" fill="#e2552f" text-anchor="middle" font-family="Ma Shan Zheng,Noto Serif SC,serif" transform="rotate(-10 101 76) translate(0 2)">福</text>
  <g transform="rotate(14 160 150)"><rect x="134" y="120" width="56" height="60" rx="6" fill="#6a3a1e"/><rect x="134" y="120" width="56" height="8" rx="4" fill="#8a5a32"/><circle cx="162" cy="152" r="16" fill="#4a2410"/>${ring(6,9,162,152,(x,y)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#6a3a1e"/>`)}<circle cx="162" cy="152" r="3.5" fill="#6a3a1e"/></g>`},
 14:()=>SH(100,178,68)+`<path d="M100 18l8 22h-16z" fill="#f2c230"/><circle cx="100" cy="16" r="5" fill="#e2552f"/>
  <circle cx="100" cy="100" r="66" fill="none" stroke="#fff" stroke-width="13" stroke-dasharray="2 4" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="60" fill="url(#avs-lion)"/>
  <path d="M46 70q54-40 108 0" stroke="#1a1a1a" stroke-width="4" fill="none"/><path d="M60 54q40-20 80 0" stroke="#3a8a4a" stroke-width="5" fill="none"/>
  <circle cx="100" cy="56" r="10" fill="url(#avs-silver)" stroke="#d9b46a" stroke-width="2.5"/>
  <ellipse cx="76" cy="88" rx="16" ry="13" fill="#fff"/><ellipse cx="124" cy="88" rx="16" ry="13" fill="#fff"/><circle cx="78" cy="90" r="7" fill="#111"/><circle cx="122" cy="90" r="7" fill="#111"/><circle cx="80" cy="87" r="2" fill="#fff"/><circle cx="124" cy="87" r="2" fill="#fff"/>
  <path d="M58 80Q76 68 94 80" fill="#c8202f" stroke="#1a1a1a" stroke-width="1.5"/><path d="M106 80Q124 68 142 80" fill="#c8202f" stroke="#1a1a1a" stroke-width="1.5"/>${[62,70,78,86].map(x=>`<path d="M${x} ${76-Math.abs(x-76)*.1}l-2-7" stroke="#111" stroke-width="1.5"/><path d="M${x+44} ${76-Math.abs(x-76)*.1}l2-7" stroke="#111" stroke-width="1.5"/>`).join("")}
  <path d="M86 102q14 10 28 0l-4 12h-20z" fill="#e2552f"/>
  <path d="M52 124Q100 110 148 124Q140 160 100 164Q60 160 52 124Z" fill="#c8202f"/><path d="M58 126Q100 116 142 126" stroke="#fff" stroke-width="5" stroke-dasharray="5 3" fill="none"/><path d="M80 146q20 8 40 0" stroke="#f28a8a" stroke-width="6" stroke-linecap="round" fill="none"/>
  <circle cx="40" cy="96" r="9" fill="#f2c230"/><circle cx="160" cy="96" r="9" fill="#f2c230"/>`,
 15:()=>{let s=`<path d="M190 4L120 40" stroke="#8a5a32" stroke-width="7" stroke-linecap="round"/><path d="M124 38v34" stroke="#c8202f" stroke-width="2"/>`;
  const r=rng(11);for(let i=0;i<14;i++){const a=r()*Math.PI*2,rr=r()*20;const x=124+Math.cos(a)*rr,y=92+Math.sin(a)*rr*.8;s+=`<path d="M${(x-12).toFixed(1)} ${y.toFixed(1)}q6-12 12-4q6-8 12 4q-2 10-12 12q-10-2-12-12Z" fill="${i%3?"#5aa83a":"#8fd06a"}" stroke="#3a7a2a" stroke-width="1"/>`}
  s+=`<path d="M124 78v30" stroke="#e9f5d0" stroke-width="2"/><path d="M124 108v10" stroke="#c8202f" stroke-width="2"/>
  <g transform="rotate(-6 124 146)"><rect x="100" y="116" width="48" height="66" rx="4" fill="url(#avs-hong)"/><path d="M100 120L124 138L148 120" fill="none" stroke="#f2c230" stroke-width="1.5"/><circle cx="124" cy="156" r="12" fill="#f2c230"/>${ZI(124,162,15,"福","#9e1420")}</g>
  <path d="M44 150q8-6 14 0q-6 8-14 0ZM62 178q8-4 12 2q-8 6-12-2Z" fill="#8fd06a" stroke="#3a7a2a" stroke-width="1"/>`;return SH(124,190,40)+s},
 16:()=>SH(100,174,74)+`<rect x="122" y="22" width="56" height="78" fill="#c8202f"/><rect x="127" y="27" width="46" height="68" fill="none" stroke="#f2c230" stroke-width="1"/><circle cx="150" cy="46" r="8" fill="#f8e4c4"/><path d="M138 58q12-6 24 0l4 30h-32z" fill="#1a1a1a"/><path d="M142 44h16" stroke="#1a1a1a" stroke-width="3"/><path d="M150 62v24" stroke="#f2c230" stroke-width="1.5"/>
  <ellipse cx="96" cy="148" rx="80" ry="22" fill="#fff" stroke="#d9cdb4" stroke-width="2"/><ellipse cx="96" cy="146" rx="62" ry="15" fill="#f4efe4"/>
  <g transform="rotate(-18 60 120)"><rect x="20" y="114" width="96" height="14" rx="7" fill="#f3e2b8"/><path d="M30 116v10M44 116v10M58 116v10" stroke="#e0c890" stroke-width="1"/></g><g transform="rotate(-10 60 132)"><rect x="24" y="126" width="88" height="13" rx="6.5" fill="#efd9a8"/></g>
  ${[[78,124,22],[118,128,20],[98,104,20]].map(([x,y,r])=>`<g><circle cx="${x}" cy="${y}" r="${r}" fill="url(#avs-tg)"/>${[-.55,-.2,.2,.55].map(k=>`<path d="M${x+k*r} ${y-r*.92}Q${x+k*r*1.5} ${y} ${x+k*r} ${y+r*.92}" stroke="#d9b070" stroke-width="1.2" fill="none"/>`).join("")}${[...Array(7)].map((_,i)=>`<ellipse cx="${x-r*.6+i*r*.2}" cy="${y-r*.5+(i%3)*r*.4}" rx="1.4" ry=".8" fill="#fffaf0"/>`).join("")}</g>`).join("")}`,
 17:()=>{let s=SH(100,184,40)+`<g transform="rotate(-24 100 100)"><rect x="95" y="96" width="10" height="96" rx="4" fill="#d9b46a"/>${[110,126,142,158,174].map(y=>`<path d="M95 ${y}h10" stroke="#c8202f" stroke-width="3"/>`).join("")}<circle cx="100" cy="194" r="4" fill="#c8202f"/>`;
  const cols=["#6a3a1e","#2f6b6b","#c4642a","#8a5a32","#1f4f4f","#d88a3a"];for(let i=0;i<26;i++){const t=i/25,y=24+t*80,w=20+Math.sin(t*Math.PI)*26;const a=(i%2?1:-1)*(10+(i*7)%20);s+=`<ellipse cx="${100+(i%3-1)*6}" cy="${y.toFixed(1)}" rx="${w.toFixed(1)}" ry="9" fill="${cols[i%6]}" transform="rotate(${a} 100 ${y.toFixed(1)})" opacity=".95"/>`}
  s+=`<path d="M100 22v84" stroke="#fff" stroke-width="1.5" opacity=".35"/></g>`;
  const r=rng(5);for(let i=0;i<9;i++)s+=`<circle cx="${(30+r()*50).toFixed(1)}" cy="${(30+r()*60).toFixed(1)}" r="${(1+r()*2).toFixed(1)}" fill="#b8a888" opacity=".7" class="av-dust"/>`;return s},
 18:()=>{let s=`<path d="M150 20q-6 30 4 46M162 18q-2 30 2 46M174 24q2 26-4 44M140 28q-2 24 6 38" stroke="#3f8a3a" stroke-width="6" fill="none" stroke-linecap="round"/>`+SH(100,176,80)+`<ellipse cx="100" cy="134" rx="86" ry="36" fill="#fff" stroke="#e6dccb" stroke-width="2"/>`;
  [[62,124],[100,112],[138,124],[80,148],[122,148]].forEach(([x,y])=>{s+=`<g transform="translate(${x} ${y})"><ellipse rx="20" ry="11" cy="4" fill="#c8202f"/>${ring(16,15,0,0,(px,py)=>`<circle cx="${px.toFixed(1)}" cy="${(py*.6).toFixed(1)}" r="3.4" fill="#e8b25a"/>`)}<ellipse rx="15" ry="8.4" fill="#f2c66e"/><ellipse rx="10" ry="6" cy="-3" fill="url(#avs-jam)"/><ellipse rx="3" ry="2" cx="-3" cy="-6" fill="#fff" opacity=".5"/><path d="M0-9v-4M-2-12h4" stroke="#3a1a0a" stroke-width="1.6"/></g>`});return s},
 19:()=>{let s=SH(100,186,40)+`<path d="M70 150h60l-8 34h-44z" fill="#b8643a"/><path d="M66 146h68v8h-68z" fill="#d0784a"/>
  <path d="M100 148C96 110 84 84 62 60M96 120C110 96 132 84 150 56M88 96C80 78 82 56 92 34M126 88C140 84 154 92 166 96" stroke="#4a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  [[62,60],[72,74],[150,56],[138,72],[92,34],[86,52],[166,96],[150,90],[110,100],[78,92],[120,84],[100,64]].forEach(([x,y],i)=>s+=flower(x,y,i%3?5:6,i%2?"#f6a5c0":"#f28ab0","#fff3c4"));
  s+=`<g transform="translate(46 118)"><path d="M0 0v66" stroke="#8a5a32" stroke-width="3"/><g class="av-pin">${[0,90,180,270].map((a,i)=>`<path d="M0 0L0 -24Q14 -20 0 0Z" fill="${i%2?"#f2c230":"#c8202f"}" transform="rotate(${a})"/>`).join("")}<circle r="3" fill="#fff"/></g></g>`;return s},
 20:()=>SH(100,176,70)+`<path d="M30 96Q34 166 100 168Q166 166 170 96Z" fill="#a8754a"/><path d="M30 96Q34 166 100 168Q166 166 170 96Z" fill="url(#avs-rough)" opacity=".5"/><ellipse cx="100" cy="96" rx="70" ry="18" fill="#c08a5a"/><ellipse cx="100" cy="98" rx="62" ry="13" fill="#6a4a30"/>
  ${[[74,94,-8],[104,90,6],[126,98,14]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-20 4Q-16-14 0-14Q16-14 20 4Q0 10-20 4Z" fill="#d6b488" stroke="#a88a5a" stroke-width="1"/>${[-12,-6,0,6,12].map(px=>`<path d="M${px} ${-13+Math.abs(px)*.35}l${px*.12} 5" stroke="#a88a5a" stroke-width="1.2"/>`).join("")}</g>`).join("")}
  <g transform="translate(150 150) rotate(6)"><rect x="-22" y="-14" width="44" height="30" rx="2" fill="#fbf7ee" stroke="#c9bfa8"/><text x="0" y="0" font-size="12" text-anchor="middle" fill="#3a2a1a" font-family="Noto Serif SC,serif" font-weight="900">唐</text><text x="0" y="11" font-size="6.5" text-anchor="middle" fill="#6a5a3a" font-family="Georgia,serif" letter-spacing="1">TANG</text></g>`,
 21:()=>`<g transform="rotate(-5 84 104)"><rect x="40" y="26" width="84" height="150" fill="#c8202f"/><rect x="46" y="32" width="72" height="138" fill="none" stroke="#f2c230" stroke-width="1"/>${ZI(82,92,50,"宜","#1a1a1a")}${ZI(82,152,50,"春","#1a1a1a")}</g>
  <g transform="translate(150 90) rotate(-14)"><path d="M0 -40v26" stroke="#c8202f" stroke-width="1.5"/><path d="M-4-14C-30-30-44-20-40-6C-26-12-14-8-4-2Z" fill="#3a6ab8"/><path d="M4-14C30-30 44-20 40-6C26-12 14-8 4-2Z" fill="#3f9a5a"/><path d="M-4-6C-24-14-34-6-32 4C-20-2-10 0-4 2Z" fill="#f28ab0"/><path d="M4-6C24-14 34-6 32 4C20-2 10 0 4 2Z" fill="#f2c230"/>
  <ellipse cx="0" cy="0" rx="8" ry="16" fill="#1d2a4a"/><circle cx="0" cy="-12" r="6" fill="#1d2a4a"/><path d="M-1-17l-3-5 6 2z" fill="#f2903a"/><circle cx="2" cy="-13" r="1.2" fill="#fff"/><path d="M-4 14L-12 40M4 14L12 40" stroke="#1d2a4a" stroke-width="4" stroke-linecap="round"/><ellipse cx="0" cy="4" rx="4" ry="8" fill="#fbf7ee"/></g>`,
 22:()=>`<rect x="22" y="14" width="38" height="172" fill="#c8202f"/><rect x="140" y="14" width="38" height="172" fill="#c8202f"/><rect x="22" y="14" width="38" height="172" fill="url(#avs-paperR)"/><rect x="140" y="14" width="38" height="172" fill="url(#avs-paperR)"/>
  ${[..."嘉节号长春"].map((c,i)=>ZI(41,48+i*32,26,c,"#f2c230")).join("")}${[..."新年纳余庆"].map((c,i)=>ZI(159,48+i*32,26,c,"#f2c230")).join("")}
  <g transform="rotate(45 100 100)"><rect x="74" y="74" width="52" height="52" fill="#c8202f"/><rect x="78" y="78" width="44" height="44" fill="none" stroke="#f2c230" stroke-width="1"/></g>${ZI(100,114,38,"福","#f2c230")}
  <path d="M30 186l8-4M150 186l8-4" stroke="#fff" stroke-width="2" opacity=".4"/>`
};


function buildDefs(){
 let g=`<linearGradient id="avs-gGold" x1="0" x2="1"><stop offset="0" stop-color="#a3742a"/><stop offset=".5" stop-color="#f6dc8a"/><stop offset="1" stop-color="#b8892e"/></linearGradient>
 <linearGradient id="avs-porc" x1="0" x2="1"><stop offset="0" stop-color="#dfe7f2"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#d3dcea"/></linearGradient>
 <radialGradient id="avs-cong" cx=".5" cy=".4"><stop offset="0" stop-color="#b0505a"/><stop offset="1" stop-color="#6e1e28"/></radialGradient>
 <radialGradient id="avs-warm"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
 <linearGradient id="avs-ice" x1="0" x2="1"><stop offset="0" stop-color="#bfe0f7" stop-opacity=".85"/><stop offset=".5" stop-color="#f1f9ff" stop-opacity=".6"/><stop offset="1" stop-color="#a9d2f0" stop-opacity=".85"/></linearGradient>
 <radialGradient id="avs-flame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#f08a24"/></radialGradient>
 <linearGradient id="avs-age" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#c9a35a" stop-opacity="0"/><stop offset="1" stop-color="#8c6f3a" stop-opacity=".25"/></linearGradient>
 <radialGradient id="avs-lampw" cx=".45" cy=".4"><stop offset="0" stop-color="#fffdf2"/><stop offset=".7" stop-color="#f8ecd0"/><stop offset="1" stop-color="#e8d2a4"/></radialGradient>
 <radialGradient id="avs-dino" cx=".45" cy=".45"><stop offset="0" stop-color="#d8f7c8"/><stop offset=".55" stop-color="#7fd08f"/><stop offset="1" stop-color="#3f9a5a"/></radialGradient>
 <radialGradient id="avs-lan" cx=".4" cy=".35"><stop offset="0" stop-color="#ff6a5a"/><stop offset=".6" stop-color="#d4202a"/><stop offset="1" stop-color="#8e0f1a"/></radialGradient>
 <linearGradient id="avs-tkt" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#f08a80" stop-opacity=".4"/></linearGradient>
 <radialGradient id="avs-lion" cx=".45" cy=".4"><stop offset="0" stop-color="#ffd84a"/><stop offset=".55" stop-color="#f2903a"/><stop offset="1" stop-color="#c8202f"/></radialGradient>
 <linearGradient id="avs-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#aab2bb"/><stop offset=".4" stop-color="#f1f3f6"/><stop offset="1" stop-color="#b6bec7"/></linearGradient>
 <linearGradient id="avs-hong" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e33a46"/><stop offset="1" stop-color="#9e1420"/></linearGradient>
 <radialGradient id="avs-tg" cx=".38" cy=".32"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#f6e2a8"/><stop offset="1" stop-color="#d9b070"/></radialGradient>
 <radialGradient id="avs-jam" cx=".4" cy=".35"><stop offset="0" stop-color="#ffcf6a"/><stop offset=".7" stop-color="#d8861a"/><stop offset="1" stop-color="#a85a10"/></radialGradient>
 <pattern id="avs-rough" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#6a4a30"/><circle cx="6" cy="5" r=".8" fill="#e0b88a"/></pattern>
 <linearGradient id="avs-paperR" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>
 <linearGradient id="avs-lacq" x1="0" x2="1"><stop offset="0" stop-color="#8e0f1a"/><stop offset=".5" stop-color="#b8182a"/><stop offset="1" stop-color="#8e0f1a"/></linearGradient>
 <radialGradient id="avs-stud" cx=".35" cy=".3"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#e2b45a"/><stop offset="1" stop-color="#8c6a2a"/></radialGradient>
 <filter id="avs-soft"><feGaussianBlur stdDeviation="3"/></filter>`;
 for(let d=1;d<=22;d++)g+=`<symbol id="avs-o-${d}" viewBox="0 0 200 200">${DRAW[d]()}</symbol>`;
 return g;
}
/* 样子（照样板；类名都加了 av-，套在 .av-spring 里，动画名加了 avs-） */
const SCSS = `.av-spring{--ink:#14305c;--paper:#fbf7ee;--ivory:#fbf7ee;--hot:#e2552f;--red:#c8202f;--red2:#9e1420;--red3:#6e0d18;--gold:#e0bd73;--gold2:#b38a3e;--soft:#6b7488;--line:#ecdcc4;--desk:#efe6d4}
.av-spring .av-en-t{font-family:Georgia,"Times New Roman",serif}
.av-spring .av-brush{font-family:"Ma Shan Zheng","Noto Serif SC",serif;font-weight:400}
.av-spring .av-scr{flex:1;overflow-y:auto;overflow-x:hidden;padding-bottom:30px;scrollbar-width:none}
.av-spring .av-scr::-webkit-scrollbar{display:none}
.av-spring .av-toast{position:absolute;top:14px;left:50%;transform:translate(-50%,-30px);opacity:0;background:var(--red3);color:#fbe9c4;font-weight:700;padding:7px 15px;border-radius:99px;transition:.3s;z-index:80;font-size:13px;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(224,189,115,.6);pointer-events:none}
.av-spring .av-toast.av-on{opacity:1;transform:translate(-50%,0)}
.av-spring .av-lace{height:22px;background:
 radial-gradient(circle at 12px 0,transparent 8px,var(--red) 8.5px) 0 0/24px 14px repeat-x,
 linear-gradient(var(--red),var(--red)) 0 0/100% 6px no-repeat;position:relative}
.av-spring .av-lace::after{content:"";position:absolute;left:0;right:0;top:14px;height:8px;background:radial-gradient(circle,var(--red) 2.2px,transparent 2.6px) 6px 0/24px 8px repeat-x}
.av-spring .av-hd{padding:10px 18px 4px;text-align:center;position:relative}
.av-spring .av-brand{display:inline-flex;align-items:center;gap:7px;font:600 11px Georgia,serif;letter-spacing:.42em;color:#9a7a3c;padding-left:.42em}
.av-spring .av-brand svg{width:18px;height:18px}
.av-spring .av-cd{margin:8px 0 0;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--red2)}
.av-spring .av-cd .av-n{font:400 64px/0.9 Georgia,serif;color:var(--red);transition:transform .3s;font-variant-numeric:lining-nums}
.av-spring .av-cd .av-n.av-bump{transform:scale(1.12)}
.av-spring .av-cd .av-t{font:italic 17px/1.2 Georgia,serif;text-align:left;color:var(--red2)}
.av-spring .av-cd .av-t.av-zh{font:900 17px/1.3 "Noto Serif SC",serif;font-style:normal}
.av-spring .av-cd .av-big{font:400 30px/1.2 "Ma Shan Zheng","Noto Serif SC",serif;color:var(--red)}
.av-spring .av-sub{font:600 13.5px "Noto Serif SC",serif;color:#9a7a3c;margin-top:4px}
.av-spring .av-sub i{font:italic 13px Georgia,serif;color:#a8905a}
.av-spring .av-scroll{margin:12px 12px 0;position:relative}
.av-spring .av-rod{height:14px;border-radius:8px;background:linear-gradient(#8a4a28,#5a2a14 60%,#3a1a0a);position:relative;margin:0 -6px;box-shadow:0 3px 6px rgba(0,0,0,.25)}
.av-spring .av-rod::before,.av-spring .av-rod::after{content:"";position:absolute;top:-3px;width:14px;height:20px;border-radius:5px;background:linear-gradient(90deg,#9a7430,#f3dc9a,#9a7430)}
.av-spring .av-rod::before{left:-8px}
.av-spring .av-rod::after{right:-8px}
.av-spring .av-sheet{background:#fff9ec;border-left:1px solid #ead7b0;border-right:1px solid #ead7b0;padding:26px 9px 12px;position:relative;
 background-image:linear-gradient(90deg,rgba(200,32,47,.07) 1px,transparent 1px),linear-gradient(rgba(200,32,47,.07) 1px,transparent 1px);background-size:100% 100%,100% 100%}
.av-spring .av-sheet::before{content:"";position:absolute;inset:5px;border:1.5px solid rgba(200,32,47,.35);pointer-events:none}
.av-spring .av-sheet::after{content:"";position:absolute;inset:9px;border:.5px solid rgba(200,32,47,.25);pointer-events:none}
.av-spring .av-crest{position:absolute;top:8px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:8px;font:600 9.5px Georgia,serif;letter-spacing:.32em;color:var(--red2);padding-left:.32em}
.av-spring .av-crest i{display:block;width:30px;height:1px;background:linear-gradient(90deg,transparent,var(--red))}
.av-spring .av-crest i:last-child{transform:scaleX(-1)}
.av-spring .av-crest span{white-space:nowrap}
@media(max-width:400px){.av-spring .av-crest{letter-spacing:.18em;font-size:8.5px}.av-spring .av-crest i{width:14px}}
.av-spring .av-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:98px;gap:7px;position:relative;padding:0 3px}
@media(max-width:380px){.av-spring .av-grid{grid-auto-rows:90px;gap:6px}}
.av-spring .av-env{position:relative;border:0;padding:0;background:none;perspective:500px;border-radius:7px;min-width:0}
.av-spring .av-env.av-wide{grid-column:span 2}
.av-spring .av-env .av-body{position:absolute;inset:0;border-radius:7px;background:linear-gradient(160deg,#d82b38,#b0151f 60%,#8e0f1a);box-shadow:0 3px 6px rgba(110,13,24,.25),inset 0 0 0 1px rgba(255,255,255,.08);overflow:hidden;display:block;transition:filter .3s}
.av-spring .av-env .av-body::before{content:"";position:absolute;inset:4px;border:1px solid rgba(240,200,120,.55);border-radius:4px;pointer-events:none}
.av-spring .av-pat1 .av-body{background-image:radial-gradient(circle,rgba(242,194,48,.28) 1.5px,transparent 2px),linear-gradient(160deg,#d82b38,#b0151f 60%,#8e0f1a);background-size:10px 10px,100% 100%}
.av-spring .av-pat2 .av-body::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;background:repeating-linear-gradient(90deg,rgba(242,194,48,.35) 0 2px,transparent 2px 7px),linear-gradient(transparent,rgba(0,0,0,.08))}
.av-spring .av-pat3 .av-body{background-image:radial-gradient(circle at 50% 120%,transparent 26%,rgba(242,194,48,.25) 27%,rgba(242,194,48,.25) 29%,transparent 30%),linear-gradient(160deg,#d82b38,#b0151f 60%,#8e0f1a);background-size:22px 14px,100% 100%}
.av-spring .av-flap{position:absolute;left:0;right:0;top:0;height:46%;z-index:3;transform-origin:top center;transition:transform .55s cubic-bezier(.4,0,.2,1);backface-visibility:hidden}
.av-spring .av-flap::before{content:"";position:absolute;inset:0;background:linear-gradient(#e33a46,#c01c28);clip-path:polygon(0 0,100% 0,50% 100%)}
.av-spring .av-flap::after{content:"";position:absolute;inset:0;background:linear-gradient(#f3d58c,#c99a45);clip-path:polygon(0 0,100% 0,50% 100%,50% 96%,96% 2%,4% 2%,50% 96%,50% 100%)}
.av-spring .av-seal{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:4;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e8c06a 55%,#a57a2a);box-shadow:0 2px 3px rgba(0,0,0,.35);display:grid;place-items:center;color:var(--red3);font:400 14px/1 "Ma Shan Zheng","Noto Serif SC",serif;letter-spacing:-.02em}
.av-spring .av-fest .av-seal{width:44px;height:44px;font-size:16px;box-shadow:0 0 0 2px rgba(255,236,170,.7),0 2px 4px rgba(0,0,0,.35)}
.av-spring .av-seal .av-s4{font-size:12.5px;line-height:1.05;text-align:center}
.av-spring .av-wide .av-seal{width:48px;height:48px;font-size:18px}
.av-spring .av-dtag{position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:4;font:11px Georgia,serif;color:#fbe2a8;letter-spacing:.06em;font-variant-numeric:lining-nums}
.av-spring .av-lb{position:absolute;left:0;right:0;bottom:4px;text-align:center;z-index:4;font:italic 9.5px Georgia,serif;color:rgba(251,226,168,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px}
.av-spring .av-lb.av-zh{font:600 9.5px "Noto Serif SC",serif;font-style:normal}
.av-spring .av-inside{position:absolute;inset:0;border-radius:7px;overflow:hidden;background:#fffaf0;display:none;box-shadow:inset 0 0 0 1px #ecd9b4}
.av-spring .av-inside svg{position:absolute;left:50%;top:40%;width:78%;height:70%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 2px rgba(0,0,0,.18))}
.av-spring .av-wide .av-inside svg{width:44%;height:82%;top:42%}
.av-spring .av-inside .av-pk{position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(160deg,#d82b38,#a3121d);display:flex;align-items:center;justify-content:center;gap:5px;color:#fbe2a8;font:400 12px "Ma Shan Zheng","Noto Serif SC",serif}
.av-spring .av-inside .av-pk::before{content:"";position:absolute;left:0;right:0;top:-6px;height:7px;background:radial-gradient(circle at 4px 7px,#d82b38 4px,transparent 4.5px) 0 0/8px 7px repeat-x}
.av-spring .av-inside .av-wait{position:absolute;right:3px;top:3px;font-size:9px;color:var(--hot);background:#fde9e1;border-radius:99px;padding:0 5px;font-weight:700}
.av-spring .av-s-lock .av-body{filter:saturate(.6) brightness(.82)}
.av-spring .av-s-lock .av-seal{filter:grayscale(.3) brightness(.9)}
.av-spring .av-s-miss .av-lb{color:#fff3c4;font-weight:700}
.av-spring .av-s-today{z-index:5;animation:avs-bob 2.4s ease-in-out infinite}
@keyframes avs-bob{50%{transform:translateY(-3px) rotate(-1deg)}}
.av-spring .av-s-today .av-body{box-shadow:0 0 0 2px #ffe7a3,0 0 18px 4px rgba(255,200,90,.65)}
.av-spring .av-s-today .av-shine{position:absolute;inset:0;z-index:6;pointer-events:none;border-radius:7px;background:linear-gradient(110deg,transparent 30%,rgba(255,244,214,.55) 48%,transparent 62%);background-size:260% 100%;animation:avs-sh 2.6s infinite}
@keyframes avs-sh{0%{background-position:130% 0}60%,100%{background-position:-60% 0}}
.av-spring .av-s-today .av-lb{color:#fff;font-weight:700}
.av-spring .av-s-open .av-body{display:none}
.av-spring .av-s-open .av-inside{display:block}
.av-spring .av-s-open .av-shine{display:none}
.av-spring .av-wig{animation:avs-wig .4s}
@keyframes avs-wig{20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
.av-spring .av-opening{z-index:20;animation:none}
.av-spring .av-opening .av-flap{transform:rotateX(178deg)}
.av-spring .av-opening .av-inside{display:block;animation:avs-pull .7s .35s cubic-bezier(.2,1.3,.4,1) both;z-index:2}
.av-spring .av-opening .av-body{z-index:1}
@keyframes avs-pull{0%{transform:translateY(30%) scale(.9);opacity:0}100%{transform:none;opacity:1}}
.av-spring .av-burst{position:absolute;pointer-events:none;z-index:40;border-radius:50%;background:radial-gradient(circle,rgba(255,236,170,.95),rgba(242,194,48,.45) 40%,transparent 70%);transform:translate(-50%,-50%) scale(.2);opacity:0;animation:avs-burst .9s ease-out forwards}
@keyframes avs-burst{30%{opacity:1}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
.av-spring .av-pt{position:absolute;pointer-events:none;z-index:41;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e8c06a 60%,#a57a2a);box-shadow:0 0 4px rgba(255,220,120,.8)}
.av-spring .av-pt::after{content:"";position:absolute;inset:3px;background:#a57a2a;border-radius:1px}
.av-spring .av-pt.av-star{width:8px;height:8px;border-radius:0;background:none;box-shadow:none}
.av-spring .av-pt.av-star::after{display:none}
.av-spring .av-pt.av-star::before{content:"";position:absolute;inset:0;background:#fff3cf;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)}
.av-spring .av-hint{text-align:center;padding:12px 22px 0;font:italic 14px Georgia,serif;color:#9a7a3c}
.av-spring .av-hint.av-zh{font:600 12.5px "Noto Serif SC",serif;font-style:normal}
.av-spring .av-doorbox{margin:22px 12px 0;background:linear-gradient(#fffaf0,#f6ead2);border:1px solid #ead7b0;border-radius:18px;padding:14px 10px 16px;position:relative;overflow:hidden;text-align:center;transition:background .8s}
.av-spring .av-doorbox h3{margin:0;font:italic 22px Georgia,serif;color:var(--red2)}
.av-spring .av-doorbox h3.av-zh{font:900 18px "Noto Serif SC",serif;font-style:normal}
.av-spring .av-doorbox .av-tl{font-size:12.5px;color:var(--soft);margin:2px 0 4px}
.av-spring .av-door{width:100%;max-width:330px;display:block;margin:0 auto}
.av-spring .av-doorbox.av-full{background:radial-gradient(circle at 50% 35%,#3a1418,#1a0a0c 75%);border-color:#4a1a1e}
.av-spring .av-doorbox.av-full h3,.av-spring .av-doorbox.av-full .av-tl{color:#fbe2a8}
.av-spring .av-stud.av-drop{animation:avs-drop .9s cubic-bezier(.3,1.5,.5,1)}
@keyframes avs-drop{0%{transform:translateY(-70px) scale(1.6);opacity:0}100%{opacity:1}}
.av-spring .av-stud.av-drop{transform-box:fill-box;transform-origin:center}
.av-spring .av-lanG{opacity:0;transition:opacity .8s}
.av-spring .av-full .av-lanG{opacity:1;animation:avs-lg 2s infinite}
@keyframes avs-lg{50%{opacity:.6}}
.av-spring .av-fu{transform-box:fill-box;transform-origin:center}
.av-spring .av-full .av-fu{animation:avs-fu 1.1s cubic-bezier(.3,1.6,.5,1) both}
@keyframes avs-fu{0%{transform:scale(0) rotate(-90deg)}100%{transform:none}}
.av-spring .av-share{display:none;margin:10px auto 0;border:0;background:var(--hot);color:#fff;font-weight:800;border-radius:99px;padding:10px 20px;box-shadow:0 4px 0 #b53d1d}
.av-spring .av-canshare .av-share{display:inline-block}
.av-spring .av-rv{position:absolute;inset:0;z-index:50;background:var(--paper);overflow-y:auto;overflow-x:hidden;transform:translateY(102%);transition:transform .55s cubic-bezier(.2,.8,.2,1);scrollbar-width:none}
.av-spring .av-rv::-webkit-scrollbar{display:none}
.av-spring .av-rv.av-on{transform:none}
.av-spring .av-stage{position:relative;height:296px;background:radial-gradient(ellipse at 50% 55%,#d42a36,#a3121d 55%,#6e0d18);overflow:hidden}
.av-spring .av-stage::before{content:"";position:absolute;left:50%;top:50%;width:250px;height:250px;margin:-118px 0 0 -125px;border-radius:50%;background:#fff6e2;box-shadow:0 0 0 6px #e8c06a,0 0 0 9px rgba(255,236,170,.4),0 12px 28px rgba(0,0,0,.35)}
.av-spring .av-stage .av-cut{position:absolute;width:86px;height:86px;opacity:.9}
.av-spring .av-stage .av-cut.av-a{left:-6px;top:-6px}
.av-spring .av-stage .av-cut.av-b{right:-6px;top:-6px;transform:scaleX(-1)}
.av-spring .av-stage .av-cut.av-c{left:-6px;bottom:-6px;transform:scaleY(-1)}
.av-spring .av-stage .av-cut.av-d{right:-6px;bottom:-6px;transform:scale(-1)}
.av-spring .av-stage svg.av-big{position:absolute;left:50%;top:50%;width:206px;height:206px;margin:-98px 0 0 -103px;animation:avs-rise .9s cubic-bezier(.2,1.3,.4,1) both;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
@keyframes avs-rise{0%{transform:translateY(40px) scale(.6);opacity:0}100%{transform:none;opacity:1}}
.av-spring .av-stage svg.av-big.av-fly{animation:avs-fly .9s cubic-bezier(.6,0,.4,1) forwards}
@keyframes avs-fly{0%{transform:none}35%{transform:scale(1.08)}100%{transform:translateY(260px) scale(.12);opacity:0}}
.av-spring .av-x{position:absolute;top:12px;left:12px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid rgba(240,200,120,.7);background:rgba(110,13,24,.55);color:#fbe2a8;font-size:17px;line-height:1}
.av-spring .av-dt{position:absolute;top:14px;right:14px;z-index:3;text-align:right;color:#fbe2a8}
.av-spring .av-dt b{display:block;font:400 22px/1 "Ma Shan Zheng","Noto Serif SC",serif}
.av-spring .av-dt i{display:block;font:italic 11px Georgia,serif;margin:3px 0 2px;opacity:.9}
.av-spring .av-dt small{font:11px Georgia,serif;letter-spacing:.14em}
.av-spring .av-fromtag{position:absolute;left:12px;bottom:12px;z-index:3;font:10px Georgia,serif;letter-spacing:.2em;color:#fbe2a8;border:1px solid rgba(240,200,120,.6);border-radius:3px;padding:3px 7px;background:rgba(110,13,24,.4)}
.av-spring .av-glint{position:absolute;width:6px;height:6px;background:#fff3cf;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);animation:avs-gl 2.2s infinite;z-index:2}
@keyframes avs-gl{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.4)}}
.av-spring .av-rbody{padding:18px 18px 40px;position:relative}
.av-spring .av-city{font:italic 28px/1.1 Georgia,serif;color:var(--ink)}
.av-spring .av-city.av-zh{font:900 25px "Noto Serif SC",serif;font-style:normal}
.av-spring .av-city small{display:block;font:italic 14px Georgia,serif;color:#9a7a3c;margin-top:5px}
.av-spring .av-city.av-zh small{font:600 13px "Noto Serif SC",serif;font-style:normal}
.av-spring .av-k{font:600 11px Georgia,serif;letter-spacing:.3em;color:#b0874a;margin:18px 0 4px;text-transform:uppercase}
.av-spring .av-k.av-zh{letter-spacing:.12em;font:600 12px "Noto Serif SC",serif}
.av-spring .av-fact{font-size:14.5px;line-height:1.65;color:#2d3646;margin:0}
.av-spring .av-fact.av-tz{font:600 15.5px/1.85 "Noto Serif SC",serif;color:var(--ink);cursor:pointer}
.av-spring .av-src{font-size:11.5px;color:#9a917c;margin-top:6px;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}
.av-spring .av-src a{color:#9a7a3c;word-break:break-all}
.av-spring .av-flip{border:1px solid var(--line);background:#fff;border-radius:99px;padding:2px 10px;font-size:11.5px;font-weight:700;color:var(--red2)}
.av-spring .av-say{margin-top:6px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 12px 14px;box-shadow:0 3px 12px rgba(110,13,24,.06)}
.av-spring .av-lv{display:flex;gap:4px;background:#f6efe2;border-radius:99px;padding:3px}
.av-spring .av-lv button{flex:1;border:0;background:none;border-radius:99px;padding:5px 2px;font-size:11.5px;font-weight:700;color:var(--soft);min-width:0}
.av-spring .av-lv button.av-on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.av-spring .av-line{margin:14px 2px 2px;font:600 21px/1.8 "Noto Serif SC",serif;color:var(--ink);cursor:pointer;overflow-wrap:anywhere}
.av-spring .av-line.av-en{font:22px/1.4 Georgia,serif}
.av-spring .av-w{cursor:pointer;border-radius:5px;padding:0 1px;transition:background .15s,color .15s;border-bottom:1.5px dotted rgba(226,85,47,.45)}
.av-spring .av-w:hover,.av-spring .av-w.av-on{background:#fde9e1;color:var(--hot)}
.av-spring .av-trn{font-size:13px;color:var(--soft);margin:2px 2px 0}
.av-spring .av-py{font-size:13px;color:#8a8f9c;margin:2px 2px 0}
.av-spring .av-acts{display:flex;gap:10px;align-items:center;margin-top:14px}
.av-spring .av-lis{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:9px 14px;font-weight:700;color:var(--ink);font-size:13.5px;flex:none}
.av-spring .av-mic{flex:1;border:0;background:var(--hot);color:#fff;border-radius:99px;padding:11px 14px;font-weight:800;font-size:15px;box-shadow:0 4px 0 #b53d1d;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .1s;min-width:0}
.av-spring .av-mic:active{transform:translateY(2px);box-shadow:0 2px 0 #b53d1d}
.av-spring .av-mic.av-rec{background:#c43d1c}
.av-spring .av-mic.av-done{background:#2f6b4f;box-shadow:0 4px 0 #1f4a36}
.av-spring .av-bars{display:none;gap:3px;align-items:center;height:16px}
.av-spring .av-rec .av-bars{display:inline-flex}
.av-spring .av-bars i{width:3px;background:#fff;border-radius:2px;animation:avs-bar .5s infinite alternate}
.av-spring .av-bars i:nth-child(2){animation-delay:.12s}
.av-spring .av-bars i:nth-child(3){animation-delay:.24s}
.av-spring .av-bars i:nth-child(4){animation-delay:.36s}
@keyframes avs-bar{0%{height:3px}100%{height:16px}}
.av-spring .av-heard{font-size:13px;color:#2f6b4f;min-height:22px;margin-top:8px;padding-right:96px}
.av-spring .av-stamp{position:absolute;right:8px;bottom:-8px;z-index:5;width:88px;height:88px;border-radius:50%;border:3px double var(--hot);color:var(--hot);display:grid;place-items:center;text-align:center;font:700 11px/1.15 Georgia,serif;letter-spacing:.1em;transform:rotate(-14deg) scale(2.2);opacity:0;pointer-events:none;background:rgba(251,247,238,.7)}
.av-spring .av-stamp.av-zh{font:900 13px/1.2 "Noto Serif SC",serif;letter-spacing:.04em}
.av-spring .av-stamp.av-on{animation:avs-thunk .45s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes avs-thunk{0%{transform:rotate(-14deg) scale(2.2);opacity:0}100%{transform:rotate(-14deg) scale(1);opacity:.92}}
.av-spring .av-stamp small{display:block;font-size:8px;letter-spacing:.14em;margin-top:3px;font-family:Georgia,serif}
.av-spring .av-give{display:none;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:12.5px;color:var(--soft)}
.av-spring .av-give.av-on{display:flex;animation:avs-up .3s}
.av-spring .av-give button{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font-weight:700;font-size:12.5px;color:var(--ink)}
.av-spring .av-give button.av-on{border-color:var(--hot);background:#fde9e1;color:var(--hot)}
.av-spring .av-mk{font-size:11.5px;color:#b0874a;font-weight:700;margin:12px 2px 6px}
.av-spring .av-chips{display:flex;flex-wrap:wrap;gap:6px}
.av-spring .av-chip{border:1.5px solid var(--line);background:#fffdf7;border-radius:12px;padding:5px 11px;font-weight:700;color:var(--ink);font-size:14px;line-height:1.25;text-align:left;transition:transform .12s;max-width:100%}
.av-spring .av-chip small{display:block;font-weight:500;font-size:11px;color:#8a8f9c}
.av-spring .av-chip:active{transform:scale(.94)}
.av-spring .av-chip.av-on,.av-spring .av-chip.av-on2{border-color:var(--hot);background:#fde9e1;color:var(--hot)}
.av-spring .av-slot{display:inline-block;min-width:56px;border-bottom:2px solid var(--hot);color:var(--hot);padding:0 4px;margin:0 2px}
.av-spring .av-own{width:100%;margin-top:10px;border:1.5px dashed var(--line);border-radius:12px;padding:8px 12px;font:inherit;font-size:14px;background:#fffdf7;outline-color:var(--hot)}
.av-spring .av-way{font:600 15px "Noto Serif SC",serif;color:var(--ink);margin-top:14px}
.av-spring .av-cue{font-size:13px;color:var(--soft);margin-top:4px}
.av-spring .av-peek{display:block;width:100%;text-align:left;margin-top:10px;border:1.5px dashed var(--line);background:#fffdf7;border-radius:12px;padding:9px 12px;color:var(--soft);font-size:13px}
.av-spring .av-peek .av-pb{display:none}
.av-spring .av-peek.av-on .av-pf{display:none}
.av-spring .av-peek.av-on .av-pb{display:block}
.av-spring .av-peek .av-pb .av-line{margin:0}
.av-spring .av-yours{margin-top:22px;opacity:.35;pointer-events:none;transition:opacity .5s}
.av-spring .av-yours.av-on{opacity:1;pointer-events:auto}
.av-spring .av-yours .av-q{font:600 19px/1.4 "Noto Serif SC",serif;color:var(--ink);cursor:pointer}
.av-spring .av-yours .av-q.av-en{font:21px/1.3 Georgia,serif}
.av-spring .av-qpy{font-size:12.5px;color:#8a8f9c}
.av-spring .av-qt{font-size:12.5px;color:var(--soft);margin-top:2px}
.av-spring .av-ans{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed var(--line)}
.av-spring .av-ans img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.15);background:#ddd}
.av-spring .av-ans .av-me{width:40px;height:40px;border-radius:50%;flex:none;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}
.av-spring .av-ans .av-nm{font-size:12px;color:var(--soft)}
.av-spring .av-ans .av-nm b{color:var(--ink)}
.av-spring .av-tg2{display:inline-block;font-size:10.5px;background:#eef3ea;color:#2f6b4f;border-radius:99px;padding:0 7px;margin-left:4px;font-weight:700}
.av-spring .av-yi{display:inline-block;font-size:10.5px;background:#f1ece0;color:var(--soft);border-radius:4px;padding:0 4px}
.av-spring .av-ans .av-tx{font-size:15px;color:#24303a;cursor:pointer;margin-top:1px;overflow-wrap:anywhere}
.av-spring .av-ans .av-tpy{font-size:11.5px;color:#9aa0ad}
.av-spring .av-ans .av-tr{font-size:12.5px;color:var(--soft);display:none}
.av-spring .av-ans.av-open .av-tr{display:block}
.av-spring .av-ans .av-heart{margin-left:auto;border:0;background:none;font-size:16px;color:#c9bfa8;padding:2px 4px;flex:none}
.av-spring .av-ans .av-heart.av-on{color:var(--hot);animation:avs-pop .3s}
@keyframes avs-pop{50%{transform:scale(1.5)}}
.av-spring .av-leave{display:flex;gap:8px;margin-top:12px}
.av-spring .av-leave input{flex:1;min-width:0;border:1.5px solid var(--line);border-radius:99px;padding:9px 14px;font:inherit;font-size:14px;background:#fff;outline-color:var(--ink)}
.av-spring .av-leave button{border:0;background:var(--ink);color:#fff;border-radius:99px;padding:0 16px;font-weight:800;font-size:13px}
.av-spring .av-note{font-size:11.5px;color:#9a917c;margin-top:6px}
.av-spring .av-back{display:block;width:100%;margin-top:22px;border:0;background:var(--red);color:#fbe2a8;border-radius:99px;padding:12px;font:italic 17px Georgia,serif;letter-spacing:.04em;box-shadow:0 4px 0 var(--red3)}
.av-spring .av-back.av-zh{font:900 15px "Noto Serif SC",serif;font-style:normal}
.av-spring .av-pop{position:absolute;left:14px;right:14px;z-index:70;background:var(--red3);color:#fbe9c4;border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(240,200,120,.55);display:none;align-items:center;gap:12px}
.av-spring .av-pop.av-on{display:flex;animation:avs-up .25s}
@keyframes avs-up{0%{transform:translateY(10px);opacity:0}}
.av-spring .av-pop .av-pw{font:900 24px "Noto Serif SC",Georgia,serif;color:#fff}
.av-spring .av-pop .av-pp{font-size:13px;color:var(--gold)}
.av-spring .av-pop .av-pm{font-size:13.5px;color:#f5e6c8}
.av-spring .av-pop button{margin-left:auto;border:1px solid rgba(240,200,120,.6);background:none;color:#fbe2a8;border-radius:50%;width:38px;height:38px;flex:none;font-size:16px}
.av-spring .av-cf{position:absolute;top:-10px;width:8px;height:12px;z-index:90;pointer-events:none;border-radius:1px}
.av-spring .av-bigstamp{position:absolute;left:50%;top:40%;z-index:95;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;border:5px double #f2c230;color:#f2c230;background:rgba(158,20,32,.92);display:grid;place-items:center;text-align:center;font:700 22px/1.2 Georgia,serif;letter-spacing:.14em;transform:rotate(-12deg) scale(2.4);opacity:0;pointer-events:none;box-shadow:0 10px 40px rgba(0,0,0,.4)}
.av-spring .av-bigstamp.av-zh{font:400 40px/1.15 "Ma Shan Zheng","Noto Serif SC",serif;letter-spacing:.06em}
.av-spring .av-bigstamp.av-zh small{display:block;font:italic 17px Georgia,serif;letter-spacing:.08em;margin-top:4px}
.av-spring .av-bigstamp.av-on{animation:avs-thunk2 .6s cubic-bezier(.3,1.6,.5,1) forwards}
.av-spring .av-bigstamp.av-off{transition:opacity .6s;opacity:0!important}
@keyframes avs-thunk2{0%{transform:rotate(-12deg) scale(2.4);opacity:0}100%{transform:rotate(-12deg) scale(1);opacity:1}}
.av-spring .av-sh{position:absolute;inset:0;z-index:85;background:rgba(40,8,12,.7);display:none;align-items:center;justify-content:center;padding:18px}
.av-spring .av-sh.av-on{display:flex;animation:avs-up .3s}
.av-spring .av-card{width:100%;max-width:330px;background:linear-gradient(170deg,#c8202f,#8e0f1a);border-radius:18px;padding:16px 14px 14px;color:#fbe2a8;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.45);position:relative;max-height:100%;overflow:auto}
.av-spring .av-card::before{content:"";position:absolute;inset:6px;border:1px solid rgba(240,200,120,.6);border-radius:13px;pointer-events:none}
.av-spring .av-card .av-to{display:flex;justify-content:space-between;font:10px Georgia,serif;letter-spacing:.2em;opacity:.85}
.av-spring .av-card h4{margin:6px 0 2px;font:italic 22px Georgia,serif}
.av-spring .av-card h4.av-zh{font:400 28px "Ma Shan Zheng","Noto Serif SC",serif;font-style:normal}
.av-spring .av-card svg{width:100%;max-width:240px;display:block;margin:0 auto}
.av-spring .av-card .av-my{background:rgba(255,246,226,.12);border-radius:10px;padding:8px 10px;margin:6px 0;font:600 15px/1.5 "Noto Serif SC",serif;color:#fff}
.av-spring .av-card .av-my small{display:block;font:11px Georgia,serif;color:#f3d58c;margin-top:2px}
.av-spring .av-card .av-cl{font-size:10.5px;line-height:1.6;opacity:.85}
.av-spring .av-card .av-u{font:10px Georgia,serif;letter-spacing:.3em;margin-top:6px;opacity:.85}
.av-spring .av-shb{display:flex;gap:8px;margin-top:10px}
.av-spring .av-shb button{flex:1;border:0;border-radius:99px;padding:9px;font-weight:800}
.av-spring .av-shb .av-a{background:#fbe2a8;color:var(--red3)}
.av-spring .av-shb .av-b{background:rgba(255,255,255,.15);color:#fbe2a8}
.av-spring .av-steam{animation:avs-stm 2.4s ease-in-out infinite}
@keyframes avs-stm{50%{opacity:.15;transform:translateY(-4px)}}
.av-spring .av-flk{transform-box:fill-box;transform-origin:50% 100%;animation:avs-flk .9s ease-in-out infinite alternate}
@keyframes avs-flk{100%{transform:scaleY(.86) scaleX(1.06)}}
.av-spring .av-pin{animation:avs-spin 3s linear infinite}
@keyframes avs-spin{100%{transform:rotate(360deg)}}
.av-spring .av-box{border-radius:14px;padding:12px 16px;margin-top:18px}
.av-spring .av-box.av-warn{background:#fff3ea;border:1px solid #f1cdb2}
.av-spring .av-box b{color:#9a3a1a}`;
const SBARCSS = `.av-spring .av-cd:has(.av-gnh){flex-direction:column;gap:0}
.av-spring .av-gnh{display:block;font:italic 14px/1.3 Georgia,serif;color:#9a7a3c;margin-top:4px;text-align:center}
.av-spring .av-yr{text-align:center;font:italic 11px/1.2 Georgia,serif;color:#f6d77a;margin:-4px 0 6px;opacity:.9}
.adv-bar.adv-spring{background:linear-gradient(160deg,#c8202f,#8e0f1a 72%);color:#fbe2a8;box-shadow:0 8px 18px -10px rgba(110,13,24,.6),inset 0 0 0 1px rgba(242,194,48,.55)}
.adv-bar.adv-spring .adv-tx b{color:#fff3c4}
.adv-bar.adv-spring .adv-tx small{color:#f6d77a}
.adv-bar.adv-spring .adv-num{font:400 13px/1.05 "Ma Shan Zheng","Noto Serif SC",serif;background:radial-gradient(circle at 35% 30%,#ffe9a6,#f2c230 60%,#c99a1e);color:#9e1420;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(158,20,32,.35);text-align:center;padding:2px}
`;

/* ================= 卷轴上的红包、门上的位置（跟样板一样） ================= */
const WIDE = {1: 1, 22: 1};
// 门上的位置：左扇 1–11，右扇 12–22，一行一行往下
const SLOT = {}; (() => { const L = [76,103,130], R = [170,197,224], Y = [132,186,240,294]; let d = 1;
  [[L,0],[L,1],[[76,103],2],[L,3]].forEach(([xs, r]) => xs.forEach(x => SLOT[d++] = [x, Y[r]]));
  [[R,0],[R,1],[[197,224],2],[R,3]].forEach(([xs, r]) => xs.forEach(x => SLOT[d++] = [x, Y[r]])); })();
const CUT = `<svg class="av-cut" viewBox="0 0 80 80"><path d="M0 0h80L0 80Z" fill="#f2c230" opacity=".85"/><path d="M0 0h62L0 62Z" fill="#a3121d"/>${[...Array(5)].map((_, i) => `<circle cx="${8 + i * 11}" cy="6" r="2.4" fill="#f2c230"/><circle cx="6" cy="${8 + i * 11}" r="2.4" fill="#f2c230"/>`).join("")}<path d="M10 10q14 2 18 16q-14-2-18-16Z" fill="#f2c230"/><circle cx="24" cy="24" r="3" fill="#a3121d"/></svg>`;
const sealTxt = x => x.festival ? x.festival[0] : x.lunar[0].replace("腊月", "");
const sealHTML = (K, x) => { const t = sealTxt(x); return t.length === 4 ? `<span class="av-s4">${K.esc(t.slice(0, 2))}<br>${K.esc(t.slice(2))}</span>` : K.esc(t); };
const MD = x => x.date.split("-").map(Number);   // [年, 月, 日]
const dlab = (K, d) => { const [, m, dd] = MD(K.A(d)); return m === 1 ? K.TN("1 月 {n} 日", "{n} January", dd) : K.TN("2 月 {n} 日", "{n} February", dd); };
const rustle = K => { K.SND.noise(0, .18, .1, 2400); K.SND.noise(.12, .14, .08, 3600); };
const crackle = K => { for (let i = 0; i < 34; i++) K.SND.noise(i * .045 + Math.random() * .03, .04, .16, 1200 + Math.random() * 2400); };
function doorSVG(K, fresh, forCard){
  const S = K.S, full = K.isFull(), cp = S.said.has(22);
  let s = `<path d="M8 40L150 8L292 40Z" fill="#2f4a4a"/><path d="M8 40L150 8L292 40" stroke="#1f3333" stroke-width="3" fill="none"/>${[...Array(13)].map((_, i) => `<path d="M${30 + i * 20} ${40 - (1 - Math.abs(i - 6) / 6.5) * 26}v6" stroke="#1f3333" stroke-width="2"/>`).join("")}
  <rect x="16" y="40" width="268" height="300" fill="#4a1a12"/><rect x="40" y="46" width="220" height="34" fill="#3a120c" stroke="#e0bd73" stroke-width="1.5"/>
  <rect x="52" y="84" width="196" height="252" fill="#2a0c08"/>
  <rect x="56" y="88" width="93" height="246" fill="url(#avs-lacq)"/><rect x="151" y="88" width="93" height="246" fill="url(#avs-lacq)"/>
  <rect x="61" y="93" width="83" height="236" fill="none" stroke="rgba(240,200,120,.35)" stroke-width="1"/><rect x="156" y="93" width="83" height="236" fill="none" stroke="rgba(240,200,120,.35)" stroke-width="1"/>
  <path d="M150 88v246" stroke="#1a0604" stroke-width="2"/>
  <rect x="10" y="336" width="280" height="12" fill="#8a8070"/><rect x="0" y="348" width="300" height="14" fill="#a69a86"/>`;
  // 春联（除夕那一句说了才贴；面对门，上联「新年纳余庆」在右边）
  const cpl = (x, txt) => cp ? `<g class="${fresh === 22 ? "av-stud av-drop" : ""}"><rect x="${x}" y="88" width="20" height="232" fill="#c8202f"/><rect x="${x}" y="88" width="20" height="232" fill="url(#avs-paperR)"/>${[...txt].map((c, i) => `<text x="${x + 10}" y="${126 + i * 44}" font-size="17" fill="#f2c230" text-anchor="middle" font-family="Ma Shan Zheng,Noto Serif SC,serif">${c}</text>`).join("")}</g>` : `<rect x="${x}" y="88" width="20" height="232" fill="none" stroke="rgba(240,200,120,.35)" stroke-dasharray="3 4"/>`;
  s += cpl(24, "嘉节号长春") + cpl(256, "新年纳余庆");
  // 门楣 + 福（贴满了才出现）
  s += full ? `<g class="av-fu"><rect x="134" y="47" width="32" height="32" fill="#c8202f" transform="rotate(45 150 63)"/><text x="150" y="73" font-size="26" fill="#f2c230" text-anchor="middle" font-family="Ma Shan Zheng,Noto Serif SC,serif">福</text></g>` : `<rect x="138" y="51" width="24" height="24" fill="none" stroke="rgba(240,200,120,.4)" stroke-dasharray="2 3" transform="rotate(45 150 63)"/>`;
  // 铺首门环
  [[136,240],[164,240]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y - 6}" r="8" fill="url(#avs-stud)"/><circle cx="${x}" cy="${y - 6}" r="3" fill="#6a4a1a"/><circle cx="${x}" cy="${y + 6}" r="9" fill="none" stroke="url(#avs-gGold)" stroke-width="3"/>`);
  // 门钉 / 说过的小东西
  for (let d = 1; d <= 22; d++){ const [x, y] = SLOT[d], said = S.said.has(d), op = S.opened.has(d);
    if (said) s += `<g class="av-stud${fresh === d ? " av-drop" : ""}"><circle cx="${x}" cy="${y}" r="13.5" fill="#fff7e4" stroke="url(#avs-gGold)" stroke-width="2.5"/><use href="#avs-o-${d}" x="${x - 12}" y="${y - 12}" width="24" height="24"/></g>`;
    else if (op && !forCard) s += `<g opacity=".38"><circle cx="${x}" cy="${y}" r="13.5" fill="#fff7e4" stroke="#e0bd73" stroke-width="1.2" stroke-dasharray="2 2"/><use href="#avs-o-${d}" x="${x - 12}" y="${y - 12}" width="24" height="24"/></g>`;
    else s += `<circle cx="${x}" cy="${y}" r="6.5" fill="url(#avs-stud)"/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#fff8d8" opacity=".8"/>`; }
  // 灯笼（门贴满了才亮）
  [[44,40],[256,40]].forEach(([x, y]) => s += `<g transform="translate(${x} ${y})"><path d="M0 0v10" stroke="#3a2a1a" stroke-width="1.5"/><circle cy="34" r="30" fill="url(#avs-warm)" class="av-lanG"${forCard && full ? ' style="opacity:1"' : ""}/><rect x="-9" y="10" width="18" height="5" fill="url(#avs-gGold)"/><ellipse cy="34" rx="20" ry="20" fill="url(#avs-lan)"/>${[-12,-4,4,12].map(dx => `<path d="M${dx} 15Q${dx * 1.5} 34 ${dx} 53" stroke="#8e1420" stroke-width="1" fill="none"/>`).join("")}<rect x="-9" y="52" width="18" height="5" fill="url(#avs-gGold)"/><path d="M-3 57v14M0 57v16M3 57v14" stroke="#e2552f" stroke-width="1.5"/></g>`);
  return s;
}

window.ADVENT_SPRING = window.ADV_MK({
  id: "spring", key: "advent_spring.v1", data: () => window.ADVENT_SPRING_DATA, rootId: "advSpringRoot", scope: "av-spring", idp: "avs-", litCls: "av-full", flip: true,
  show: ["2027-01-07", "2027-02-20"], fest: "2027-02-06",   // 圣诞那一条 1 月 6 日下架以后出现；春节 = 正月初一 2027-02-06；到正月十五下架
  fonts: "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@600;900&display=swap",
  css: SCSS, barCss: SBARCSS, barCls: "adv-spring", defs: buildDefs,
  confetti: ["#c8202f", "#f2c230", "#e2552f", "#fbe2a8", "#9e1420", "#fff3c4"],
  chime: SND => { SND.tone(1318, 0, .5, .05); SND.tone(1760, .08, .6, .04); SND.tone(2637, .16, .7, .025); },
  shell: K => `<div class="av-lace"></div><div class="av-hd"><div class="av-brand">${K.SHIP("#9a7a3c")}HEYVOYO</div><div class="av-cd"></div><div class="av-sub"></div></div>
    <div class="av-scroll"><div class="av-rod"></div><div class="av-sheet"><div class="av-crest"><i></i><span>${K.UIZ() ? "红包日历 · 丁未羊年" : "THE RED ENVELOPE CALENDAR · 丁未"}</span><i></i></div>${K.UIZ() ? "" : `<div class="av-yr" dir="auto">${K.esc(K.T("羊年 · 丁未", "Year of the Goat · 丁未"))}</div>`}<div class="av-grid"></div></div><div class="av-rod"></div></div>
    <div class="av-hint"></div>
    <div class="av-doorbox av-coll"><h3></h3><div class="av-tl"></div><svg class="av-door av-collSvg" viewBox="0 0 300 370"></svg><button class="av-share"></button></div>`,
  head: K => { const {T, TN, UIZ, UIL, esc, q, P, S, A} = K, zh = UIZ(), cd = q(".av-cd"), n = P.left;
    if (K.roll()){ const r = K.N() - S.opened.size;   // rolling：数的是还没拆的红包，不倒数离春节几天
      cd.innerHTML = r === 0 ? `<span class="av-big${zh ? "" : " av-en-t"}">${esc(K.isFull() ? T("门贴满了", "Your door is full") : T("都拆开了", "All open"))}</span>`
        : zh ? `<span class="av-t av-zh">还有<br>没拆的</span><span class="av-n av-bump">${r}</span><span class="av-t av-zh">个</span>` : `<span class="av-n av-bump">${r}</span><span class="av-t">${esc(r === 1 ? T("个没拆", "envelope to open") : T("个没拆", "envelopes to open")).replace(" to ", UIL() === "en" ? "<br>to " : " to ")}</span>`;
      setTimeout(() => { const e = q(".av-cd .av-n"); e && e.classList.remove("av-bump"); }, 300);
      const sb = q(".av-sub"); sb.className = "av-sub" + (zh ? " av-zh" : "");
      if (P.k === "on"){ const x = A(P.day); sb.innerHTML = `${esc(TN("第 {n} 个 · ", "No. {n} · ", P.day))}${esc(x.lunar[0])}${x.festival ? ` · ${esc(x.festival[0])}` : ""}${zh ? "" : ` <i>· ${esc(x.festival ? x.festival[1] : x.lunar[1])}</i>`}`; }
      else sb.textContent = K.isFull() ? T("门贴满了。", "Your door is full.") : S.said.size ? TN("门上贴了 {n} 件。", "{n} on your door.", S.said.size) : T("红包都能拆了。", "Every envelope can be opened now.");
      const h = q(".av-hint"); h.className = "av-hint" + (zh ? " av-zh" : ""); h.textContent = P.k === "post" ? T("二十二个红包都能拆了，没拆的随时补上。", "All twenty-two envelopes can be opened now — catch up on any of them.") : TN("从腊八到除夕，一天拆一个：今天能拆到第 {n} 个。没拆的一直替你留着，随时补上。", "From Laba to New Year's Eve, one a day: today you can open up to No. {n}. Unopened ones wait for you — catch up anytime.", P.day);
      return; }
    if (P.k === "post") cd.innerHTML = zh ? `<span class="av-big av-brush">过年好</span>` : K.TZ() ? `<span class="av-big av-brush">过年好</span><span class="av-gnh">Guònián hǎo · ${esc(T("过年好", "Happy Lunar New Year"))}</span>` : `<span class="av-big av-en-t">${esc(T("过年好", "Happy Lunar New Year"))}</span>`;   // 学中文的人：过年好 + 拼音 + 意思
    else if (P.k === "on" && n === 1) cd.innerHTML = `<span class="av-big${zh ? "" : " av-en-t"}">${esc(T("明天就是春节", "Tomorrow is Lunar New Year"))}</span>`;
    else if (zh) cd.innerHTML = `<span class="av-t av-zh">离春节<br>还有</span><span class="av-n av-bump">${n}</span><span class="av-t av-zh">天</span>`;
    else { const t = n === 1 ? T("离春节的天数（1 天）", "day to Lunar New Year") : T("离春节的天数", "days to Lunar New Year"); cd.innerHTML = `<span class="av-n av-bump">${n}</span><span class="av-t">${UIL() === "en" ? t.replace(" to ", "<br>to ") : esc(t)}</span>`; }
    setTimeout(() => { const e = q(".av-cd .av-n"); e && e.classList.remove("av-bump"); }, 300);
    const sb = q(".av-sub"); sb.className = "av-sub" + (zh ? " av-zh" : "");
    if (P.k === "on"){ const x = A(P.day); sb.innerHTML = `${esc(x.lunar[0])}${x.festival ? ` · ${esc(x.festival[0])}` : ""}${zh ? "" : ` <i>· ${esc(x.festival ? x.festival[1] : x.lunar[1])}</i>`}`; }
    else sb.textContent = P.k === "pre" ? T("腊八（1 月 15 日）拆第一个红包。", "The first envelope opens on Laba, 15 January.")
      : K.isFull() ? T("门贴满了。", "Your door is full.") : S.said.size ? TN("门上贴了 {n} 件。", "{n} on your door.", S.said.size) : T("年过了，红包还在。", "The New Year is here; the envelopes are still open.");
    const h = q(".av-hint"); h.className = "av-hint" + (zh ? " av-zh" : "");
    h.textContent = P.k === "pre" ? T("腊八起，每天拆当天的一个。错过的，一直替你留着。", "From Laba on, open one envelope a day. Missed one? It waits for you.")
      : P.k === "post" ? T("错过的红包还能补拆，一直到正月十五（2 月 20 日）。", "Missed envelopes stay open until the Lantern Festival, 20 February.")
      : T("今天的这一个开了，错过的随时补拆。", "Today's envelope is open. Missed ones can be opened any time."); },
  cell: (K, d) => { const {T, TN, esc, UIZ, S} = K, st = K.stateOf(d), x = K.A(d), [, m, dd] = MD(x), li = K.lockIn(d);
    const lb = st === "lock" ? (li === 1 ? T("明天", "tomorrow") : TN("还有 {n} 天", "in {n} days", li)) : st === "today" ? T("今天 · 拆", "open me") : st === "miss" ? T("补拆", "catch up") : "";
    const inside = st === "open" ? `${K.useSvg(d)}<span class="av-pk">${esc(x.lunar[0].replace("腊月", ""))}</span>${S.said.has(d) ? "" : `<i class="av-wait">${esc(T("等你说", "say it"))}</i>`}` : "";
    return `<button class="av-env av-pat${d % 4} av-s-${st}${WIDE[d] ? " av-wide" : ""}${x.festival ? " av-fest" : ""}" data-d="${d}" aria-label="${K.roll() ? d : m + "/" + dd}">
    <span class="av-inside">${inside}</span><span class="av-body"><i class="av-flap"></i><span class="av-seal">${sealHTML(K, x)}</span><span class="av-dtag">${K.roll() ? d : m + "/" + dd}</span>${lb ? `<span class="av-lb${UIZ() ? " av-zh" : ""}">${esc(lb)}</span>` : ""}</span>${st === "today" ? `<i class="av-shine"></i>` : ""}</button>`; },
  // 封口翻开，卡片从红包里抽出来，沙沙一声
  openFx: (K, b, d) => { b.querySelector(".av-inside").innerHTML = K.useSvg(d) + `<span class="av-pk">${K.esc(K.A(d).lunar[0].replace("腊月", ""))}</span>`; b.classList.add("av-opening"); rustle(K); setTimeout(K.chime, 320); return {delay: 1150, oy: 1 / 3, pdelay: 300}; },
  stage: (K, d, gl) => { const X = K.A(d), cut = c => CUT.replace('class="av-cut"', `class="av-cut av-${c}"`);
    return `${cut("a")}${cut("b")}${cut("c")}${cut("d")}<button class="av-x" data-avx aria-label="${K.esc(K.T("关上", "Close"))}">✕</button><div class="av-dt"><b>${K.esc(X.festival ? X.festival[0] : X.lunar[0])}</b>${K.TZ() ? `<i>${K.esc(X.festival ? X.festival[2] : "làyuè " + X.lunar[2])}</i>` : ""}<small>${K.esc(K.roll() ? K.TN("第 {n} 个红包", "Envelope {n}", d) : dlab(K, d))}</small></div>${gl}${K.useSvg(d, "av-big")}${!X.from || X.from === "system" ? `<span class="av-fromtag">FROM HEYVOYO</span>` : ""}`; },
  stampHTML: (K, d) => (K.UIZ() ? "贴上<br>你的门" : K.esc(K.T("贴上你的门", "ON YOUR DOOR"))) + `<small>${K.esc(K.A(d).lunar[0])}</small>`,
  dlab: (K, d) => K.A(d).lunar[0] + (K.UIZ() ? "" : " (" + K.A(d).lunar[1] + ")"),   // 英文等界面：腊月初十 (12th lunar month, day 10)
  onDay: (K, d, c) => K.T("{d}在{c}", "{d} in {c}").replace("{d}", dlab(K, d)).replace("{c}", c),
  collSVG: doorSVG,
  t: {
    done: () => T_("贴上门了", "On your door"), back: () => T_("回到红包", "Back to the envelopes"),
    locked: n => n === 1 ? T_("这一个明天才能拆。", "This one opens tomorrow.") : T_("这一个还有 {n} 天才能拆。", "This one opens in {n} days.").replace(/\{n\}/g, n),
    toastIn: o => T_("{o}贴上门了", "{o} is on your door").replace("{o}", o),
    none: () => T_("这个红包还没有人送出话。", "Nobody has sent a line for this envelope yet."),
    miss: () => T_("没录到你的声音。再点一下，说出来才贴上门。", "Didn't catch your voice. Tap again — it goes on your door once you say it."),
    collH: () => T_("你的门", "Your door"),
    collL: n => n === 0 ? T_("拆到的小东西会贴到这扇门上。", "Everything you open goes up on this door.") : n === 22 ? T_("二十二件，门贴满了。", "All twenty-two. The door is full.") : T_("门上已经贴了 {n} 件，一共 22 件。", "{n} of 22 on your door.").replace(/\{n\}/g, n)
  },
  // 贴满的大章：学中文的人看「过年好 Guònián hǎo」，学英语的人看英文
  finaleZhCls: K => K.TZ(),
  finaleHTML: K => K.TZ() ? `过年好<br><small>Guònián hǎo</small>` : K.UIL() === "en" || K.UIL() === "zh" ? "THE DOOR<br>IS FULL" : K.esc(K.T("门贴满了", "THE DOOR IS FULL")),
  finaleSnd: K => { K.SND.thunk(); crackle(K); setTimeout(K.chime, 700); },
  card: K => ({title: K.T("我的过年门", "My New Year Door"), vb: "0 0 300 370", svg: doorSVG(K, 0, true), foot: "HEYVOYO · 丁未 · " + ((K.C.data() || {}).year || "") + (K.UIZ() ? "" : " · " + K.T("羊年", "Year of the Goat")),
    extra: `<div class="av-cl" dir="auto" style="margin-top:2px">${K.esc(K.isFull() ? K.T("22 件都贴上门了", "All 22 on the door") : K.TN("门上已经贴了 {n} 件，一共 22 件", "{n} of 22 on the door so far", K.S.said.size))}</div>`}),
  bar: (K, p, st) => { const {T, TN} = K;
    if (K.roll()){ const n = Math.min(p.day, K.N());   // rolling：一直在，按你自己拆到第几个说
      if (!st.raw.d0) return {emoji: "🧧", big: T("春节红包日历 · 22 个", "Lunar New Year envelopes · 22"), small: T("随时可以开始 · 一天拆一个", "Start anytime · one envelope a day"), num: "腊八"};
      if (st.said.size === K.N()) return {emoji: "🧧", big: T("你的门贴满了", "Your door is full"), small: T("二十二件都贴上了", "All twenty-two are on it"), num: "福"};
      return {emoji: "🧧", big: TN("红包日历 · 第 {n} 个", "Red envelopes · No. {n}", n),
        small: st.opened.has(n) ? (st.said.size ? TN("今天的红包拆过了 · 门上有 {n} 件", "Today's envelope is open · {n} on your door", st.said.size) : T("今天的红包拆过了", "Today's envelope is open")) : T("今天拆一个红包", "Open today's envelope"), num: K.A(n).lunar[0].replace("腊月", "")}; }
    if (p.k === "post") return {emoji: "🧧", big: T("过年好", "Happy Lunar New Year"), small: st.said.size ? TN("你的门上贴了 {n} 件", "{n} on your door", st.said.size) : T("错过的红包还能补拆", "Missed envelopes are still open"), num: "福"};
    return {emoji: "🧧", big: p.left === 1 ? T("离春节还有 1 天", "1 day to Lunar New Year") : TN("离春节还有 {n} 天", "{n} days to Lunar New Year", p.left),
      small: p.k === "pre" ? T("腊八（1 月 15 日）拆第一个红包", "The first envelope opens on 15 January")
        : st.opened.has(p.day) ? (st.said.size ? TN("今天的红包拆过了 · 门上有 {n} 件", "Today's envelope is open · {n} on your door", st.said.size) : T("今天的红包拆过了", "Today's envelope is open"))
        : T("今天拆一个红包", "Open today's envelope"), num: p.k === "on" ? K.A(p.day).lunar[0].replace("腊月", "") : "腊八"}; }
});
})();

