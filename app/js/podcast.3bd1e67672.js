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
const EPS = () => (window.PODCASTS || []).filter(e => e.l === LEARN());
const epToday = () => EPS().find(e => e.date === eff()) || null;
const epById = id => (window.PODCASTS || []).find(e => e.id === id) || null;
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

const LABELS = [
["中 国",104,35.5,1],["俄 罗 斯",95,62,1],["美 国",-99,40,1],["加 拿 大",-105,58,1],["巴 西",-52,-11,1],["澳 大 利 亚",134,-24,1],
["印 度",79,21,1],["非 洲",20,5,1],["欧 洲",15,49.5,1],["南 美 洲",-60,-20,1],["北 美 洲",-100,48,0],
["法 国",2.4,46.6,2],["英 国",-2,53.8,2],["意 大 利",12.5,43.3,2],["西 班 牙",-3.7,39.8,2],["德 国",10.4,51.2,2],
["日 本",138.5,37.5,2],["韩 国",128,36.3,2],["埃 及",29.5,26.5,2],["墨 西 哥",-102,23.6,2],["阿 根 廷",-64,-34,2],
["秘 鲁",-75,-9.5,2],["蒙 古",103,46.8,2],["土 耳 其",35,39,2],["南 非",24,-29.5,2],["新 西 兰",172,-41,2],
["泰 国",101,15.5,2],["印 尼",117,-2,2],["伊 朗",54,32.5,2],["沙 特",45,24,2],["挪 威",9,61.5,2],["瑞 典",16,62.5,2],["芬 兰",26,63,2],
["哈萨克斯坦",67,48,2],["阿 尔 及 利 亚",2.5,28,2],["尼 日 利 亚",8,9.5,2],["肯 尼 亚",38,0.5,2],["坦 桑 尼 亚",35,-6,2],
["太 平 洋",-150,5,1],["大 西 洋",-35,25,1],["印 度 洋",80,-20,1],["北 冰 洋",0,80,1],
];

// ===== 自己网站的后台（Supabase + AI 中转）=====
// 在 claude.ai 里打开时用 Claude 自带的登录、数据库和 AI；在 heyvoyo.com 上打开时用这里的实现。
// 对外提供和 claude.ai 一样的接口：HV.user（id / isOwner / can / profiles）、HV.db（collection / doc）、HV.sample.json()。
// HV_CONFIG 由 deploy.sh 从 ../后台/config.json 填进来；没填时整个后台不启用。
var HV_CONFIG = {"url": "https://pfqbskweyqyrmnrkioha.supabase.co", "anonKey": "sb_publishable_t7_0E-MFz55eQVI71X0MEA_UQ-sTb2Y", "ai": "https://pfqbskweyqyrmnrkioha.supabase.co/functions/v1/ai", "google": true, "apple": "", "ai_free": true};
var HV = {sb: null, session: null, user: null, db: null, sample: null, ready: false};
// 从「重设密码」邮件点回来时，网址里带着 type=recovery：记下来，登录后直接打开「设新密码」
try { if (/type=recovery/.test(location.hash + location.search)) sessionStorage.setItem("hv.recovery", "1"); } catch(e){}

function hvLoadScript(src){ return new Promise((ok, bad)=>{ const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }

async function hvInit(){
  if (window.claude || !HV_CONFIG || !HV_CONFIG.url || !HV_CONFIG.anonKey) return false;
  if (!window.supabase) await hvLoadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js");
  HV.sb = window.supabase.createClient(HV_CONFIG.url, HV_CONFIG.anonKey, {auth: {persistSession: true, detectSessionInUrl: true}});
  const {data} = await HV.sb.auth.getSession();
  HV.session = data.session;
  HV.sb.auth.onAuthStateChange((ev, session)=>{ if (ev === "PASSWORD_RECOVERY") try { sessionStorage.setItem("hv.recovery", "1"); } catch(e){} const was = !!HV.session; HV.session = session; if (!!session !== was) location.reload(); });
  if (!HV.session) return true;
  const uid = HV.session.user.id, email = HV.session.user.email || "";
  let admin = false; try { const r = await HV.sb.from("admins").select("uid").eq("uid", uid).maybeSingle(); admin = !!(r.data); } catch(e){}
  HV.user = {
    metaName: (HV.session.user.user_metadata || {}).name || "",   // 注册时填的昵称
    id: async ()=>uid, isOwner: async ()=>admin, canEdit: ()=>admin, can: async ()=>true, email,
    profiles: async ids => { const out = {}; if (!ids.length) return out;
      const r = await HV.sb.from("docs").select("id,data").eq("coll", "profiles").in("id", ids);
      (r.data || []).forEach(d=>{ out[d.id] = {name: d.data && d.data.name || "", avatarUrl: ""}; });
      ids.forEach(id=>{ if (!out[id]) out[id] = {name: "", avatarUrl: ""}; }); return out; }
  };
  HV.db = hvDb();
  if (HV_CONFIG.ai) HV.sample = hvSample();  // 没填 ai 地址时，网站上的 AI 功能先关着
  HV.ready = true;
  return true;
}

function hvBlocked(){ try { return new Set(JSON.parse(localStorage.getItem("soc.block.v1") || "[]")); } catch(e){ return new Set(); } }
// ---- 文档数据库：模仿 claude.ai 的 collection / doc / onSnapshot 接口，背后是一张 docs 表
function hvDb(){
  const sb = HV.sb, uid = () => HV.session && HV.session.user.id;
  const split = path => { const i = path.lastIndexOf("/"); return [path.slice(0, i), path.slice(i + 1)]; };
  const snapDoc = row => ({id: row ? row.id : "", exists: !!row, data: () => row ? row.data : undefined, metadata: {fromCache: false, hasPendingWrites: false}});
  const field = f => "data->>" + f;
  function docRef(coll, id){
    return {
      id, path: coll + "/" + id,
      async get(){ const r = await sb.from("docs").select("id,data").eq("coll", coll).eq("id", id).maybeSingle(); if (r.error) throw r.error; return snapDoc(r.data); },
      async set(data){ const r = await sb.from("docs").upsert({coll, id, data}, {onConflict: "coll,id"}); if (r.error) throw r.error; },  // owner 新建时自动是自己，修改时保留原作者
      async update(data){ const cur = await this.get(); if (!cur.exists) throw {code: "invalid_argument"}; return this.set({...cur.data(), ...data}); },
      async delete(){ const r = await sb.from("docs").delete().eq("coll", coll).eq("id", id); if (r.error) throw r.error; },
      onSnapshot(next, err){ let alive = true; const run = async ()=>{ try { const s = await this.get(); if (alive) next(s); } catch(e){ if (err) err(e); } };
        run(); const ch = sb.channel("d:" + coll + "/" + id + ":" + Math.random()).on("postgres_changes", {event: "*", schema: "public", table: "docs", filter: "coll=eq." + coll}, p=>{ const row = p.new && p.new.id ? p.new : p.old; if (row && row.id === id) run(); }).subscribe();
        return ()=>{ alive = false; sb.removeChannel(ch); }; },
      collection: sub => coll2(coll + "/" + id + "/" + sub)
    };
  }
  function query(coll, opts){
    const q = {
      where: (f, op, v) => query(coll, {...opts, where: [...(opts.where || []), [f, op, v]]}),
      orderBy: (f, dir) => query(coll, {...opts, order: [f, dir || "asc"]}),
      limit: n => query(coll, {...opts, limit: n}),
      async get(){
        let r = sb.from("docs").select("id,data,owner").eq("coll", coll);
        (opts.where || []).forEach(([f, op, v])=>{ if (op === "==") r = r.eq(field(f), String(v)); else if (op === "in") r = r.in(field(f), v.map(String)); });
        if (opts.order){ const f = opts.order[0], num = f === "ts"; r = r.order(num ? "created_at" : field(f), {ascending: opts.order[1] !== "desc"}); }
        if (opts.limit) r = r.limit(opts.limit);
        const res = await r; if (res.error) throw res.error;
        let rows = res.data || [];
        // 屏蔽的人：他发的东西（照片、回复、帖子、评论、私信……）一律不显示（名单在「我 → 屏蔽名单」，存 soc.block.v1）
        const bl = hvBlocked(); if (bl.size && coll !== "profiles") rows = rows.filter(row=>{ const d = row.data || {}; return !(bl.has(row.owner) || bl.has(d.by) || bl.has(d.author) || bl.has(d.from) || bl.has(d.uid)); });
        if (opts.order && opts.order[0] === "ts") rows.sort((a, b)=>((a.data.ts || 0) - (b.data.ts || 0)) * (opts.order[1] === "desc" ? -1 : 1));
        const docs = rows.map(snapDoc);
        return {docs, size: docs.length, empty: !docs.length, docChanges: ()=>[], metadata: {fromCache: false, hasPendingWrites: false}};
      },
      onSnapshot(next, err){ let alive = true, t = null; const run = async ()=>{ try { const s = await q.get(); if (alive) next(s); } catch(e){ if (err) err(e); } };
        run(); const ch = sb.channel("q:" + coll + ":" + Math.random()).on("postgres_changes", {event: "*", schema: "public", table: "docs", filter: "coll=eq." + coll}, ()=>{ clearTimeout(t); t = setTimeout(run, 250); }).subscribe();
        return ()=>{ alive = false; clearTimeout(t); sb.removeChannel(ch); }; }
    };
    return q;
  }
  function coll2(coll){
    const q = query(coll, {});
    q.path = coll;
    q.doc = id => docRef(coll, id || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 20) : String(Date.now()) + Math.random().toString(36).slice(2, 8)));
    q.add = async data => { const ref = q.doc(); await ref.set(data); return ref; };
    return q;
  }
  return {collection: coll2, doc: path => { const [c, id] = split(path); return docRef(c, id); }};
}

// ---- AI：通过 Supabase 云函数（后台/functions/ai）调用，网页里不放任何密钥
function hvSample(){
  // 多聊档（chat）：服务器自己记对话。第一句不带 conv，服务器开一段、扣 1 🛟、回 conv；同一段后面的来回带着它（2026-11-12）。
  // 「同一段」= 同一个人物设定 + 同一个开头那句（岛上、话题、Voyo 的多聊都是这样一路往下加消息）
  const CONV = {}, ENDED = new Set();   // ENDED：服务器说这段已经结束（超过 6 小时 / 换了设定），不再悄悄开新的一段，由页面问用户要不要重新开始
  const convKey = (messages, system) => { const t = String(system || "") + "\u0001" + JSON.stringify(messages[0] || ""); let h = 0x811c9dc5; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  async function call(input, opts){
    const messages = typeof input === "string" ? [{role: "user", content: input}] : input;
    const tier = (opts && opts.modelTier) || "default", ck = tier === "chat" && messages.length > 1 ? convKey(messages, opts && opts.system) : "";
    if (!HV.session) throw {code: "not_signed_in", message: "请先登录"};
    if (ck && !CONV[ck] && ENDED.has(ck)) throw {code: "chat_ended", message: "这段聊天已经结束了"};
    const r = await fetch(HV_CONFIG.ai, {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + HV.session.access_token, apikey: HV_CONFIG.anonKey},
      body: JSON.stringify(Object.assign({messages, tier, system: opts && opts.system}, ck && CONV[ck] ? {conv: CONV[ck]} : {}, (opts && opts.extra) || {}))});
    const j = await r.json().catch(()=>({}));
    if (tier === "chat" && j.conv){ const k0 = convKey(messages, opts && opts.system); CONV[k0] = j.conv; ENDED.delete(k0); }
    if (j.code === "chat_ended" && ck){ delete CONV[ck]; ENDED.add(ck); }
    if (typeof j.lifebuoys === "number") HV.lifebuoys = j.lifebuoys;
    if (r.status === 402 && typeof lbOpen === "function") setTimeout(()=>lbOpen(true), 0);  // 🛟 不够：弹出买救生圈
    if (!r.ok) throw {code: j.code || "ai_error", message: j.message || "AI 暂时用不了"};
    return j;
  }
  const s = async (input, opts) => { const j = await call(input, opts); return {text: j.text || "", truncated: !!j.truncated}; };
  s.json = async (input, opts) => { const j = await call(input, {...(opts || {}), json: true}); const t = String(j.text || "").trim();
    const m = t.match(/\{[\s\S]*\}|\[[\s\S]*\]/); try { return JSON.parse(m ? m[0] : t); } catch(e){ throw {code: "bad_json", message: "AI 返回的内容看不懂"}; } };
  return s;
}

// ---- 救生圈 🛟：余额、记录、能买的包（表和函数见 后台/lifebuoy.sql）。没装好时返回 null，界面就不显示
async function hvLifebuoys(){
  if (!HV.sb || !HV.session) return null;
  const r = await HV.sb.rpc("lb_me"); if (r.error) return null;
  HV.lifebuoys = r.data; return r.data;
}
async function hvLbLedger(n){
  const r = await HV.sb.from("lifebuoy_ledger").select("delta,balance_after,reason,created_at").order("created_at", {ascending: false}).limit(n || 10);
  return r.error ? [] : r.data;
}
async function hvLbPacks(){
  const r = await HV.sb.from("lifebuoy_packs").select("id,lifebuoys,price_pence,label_en,label_zh").order("sort");
  return r.error ? [] : r.data;
}

var HV_BOOT = hvInit().catch(e=>{ console.warn('后台没连上', e); return false; });

// ---- 邮件里的链接点回来去哪：网页版回到当前页；在 App 里（capacitor://localhost）邮件链接打不开 App，就去 heyvoyo.com 网页版（在那里设好密码，回 App 用邮箱 + 密码登录）
function hvInApp(){ try { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); } catch(e){ return false; } }
function hvBackUrl(){ return hvInApp() || !/^https?:$/.test(location.protocol) ? "https://heyvoyo.com/map/" : location.origin + location.pathname; }
// ---- 删除我的账号（苹果要求 App 里能自己删）：先删自己存的家乡视频，再让后台删账号（后台/delete_account.sql），然后退出
async function hvDeleteAccount(){
  const uid = HV.session && HV.session.user && HV.session.user.id; if (!uid) throw {message: "not signed in"};
  try { const l = await HV.sb.storage.from("hometown").list(uid, {limit: 100}); const names = (l.data || []).map(f=>uid + "/" + f.name); if (names.length) await HV.sb.storage.from("hometown").remove(names); } catch(e){}
  const r = await HV.sb.rpc("hv_delete_me"); if (r.error) throw r.error;
  try { await HV.sb.auth.signOut({scope: "local"}); } catch(e){}
  location.reload();
}
// ---- 登录界面：邮箱里点一下链接就登录
async function hvSignIn(email){
  const r = await HV.sb.auth.signInWithOtp({email, options: {emailRedirectTo: hvBackUrl()}});
  if (r.error) throw r.error;
}
async function hvSignOut(){ await HV.sb.auth.signOut(); }
// ---- 用 Google 账号登录（2026-11-10）：跳到 Google，回来就登录了，不发邮件。要在 Supabase → Auth → Providers 里开 Google，config.json 里 google: true 才显示按钮
async function hvSignInGoogle(){ const r = await HV.sb.auth.signInWithOAuth({provider: "google", options: {redirectTo: hvBackUrl()}}); if (r.error) throw r.error; }
// ---- 用 Apple 账号登录（2026-11-10 备好）：iPhone App 里有 Google 登录，苹果规定也要有 Apple 登录。要先有苹果开发者账号，在 Supabase → Auth → Providers 开 Apple，config.json 里 apple: true 才显示按钮
async function hvSignInApple(){ const r = await HV.sb.auth.signInWithOAuth({provider: "apple", options: {redirectTo: hvBackUrl()}}); if (r.error) throw r.error; }
// ---- 邮箱 + 密码：第一次用登录链接进来，之后在「👤 我」里设密码，以后直接用密码登录（不用等邮件）
async function hvSignInPassword(email, password){
  const r = await HV.sb.auth.signInWithPassword({email, password});
  if (r.error) throw r.error;
}
// ---- 注册（邮箱 + 密码 + 昵称）：Supabase 会发一封确认邮件，点了才算注册完
async function hvSignUp(email, password, name){
  const r = await HV.sb.auth.signUp({email, password, options: {data: {name}, emailRedirectTo: hvBackUrl()}});
  if (r.error) throw r.error;
  if (r.data && r.data.user && Array.isArray(r.data.user.identities) && !r.data.user.identities.length) throw {code: "exists", message: "already registered"};   // 邮箱已经注册过
}
// ---- 忘记密码：发一封重设邮件，点回来以后打开「设新密码」
async function hvResetPassword(email){
  const r = await HV.sb.auth.resetPasswordForEmail(email, {redirectTo: hvBackUrl()});
  if (r.error) throw r.error;
}
// ---- 重新发送确认邮件
async function hvResendSignup(email){
  const r = await HV.sb.auth.resend({type: "signup", email, options: {emailRedirectTo: hvBackUrl()}});
  if (r.error) throw r.error;
}
async function hvSetPassword(password){
  const r = await HV.sb.auth.updateUser({password});
  if (r.error) throw r.error;
}


