/* voyo.js */
// 🐧 Voyo（2026-11-12 放进软件；样板 样板/AI小伙伴样板.html，提交 f661a0e9，用户：「可以，放进软件」；记忆 penguin-companion、kind-rabbit-hole、learner-not-native-centred）
// 住在你船上的小伙伴，不是老师：不出题、不打分、不排课、不让你内疚；一天最多冒头两次；会说你的母语，递给你的句子是你在学的语言。
//   第一次见面（迎新 welcome.js 走完以后接着来）：船上有什么在动 → 嘿，Voyo！→（迎新没问过兴趣才问）→ 你学到哪了（三句里挑一句说得出口的）→ 「好，我记住了」→ 回船头，停。不往下带人走。
//   平常：在「今天」页右下角待着；有事举一张小卡（昨天的纸条试了吗 / 今天有一件关于穿搭的事 / 拿回一句旧话），一天最多两次，第三件留到你点它时放在对话框最上面。
//   开门：从兴趣网（content-skeleton/interest_net/*.json → gen_nets.py → d88_nets.js，window.HV_NETS）挑今天开着的 2–3 扇门；门上的话按界面语言；
//         钥匙 = 跟着说那条线的 key（说得不完美也开，没有 ✗）；不方便说话：按顺序点词 / 听两遍。开过的门一直开着。只给兴趣里有那座岛（穿搭 = fashion_club）的人看。
//   纸条：「今天就到这」时递一张，上面是今天敲门说的那一句（一字不差）；第二天只问一次「试了 / 没顾上」，全靠你自己说，不打分、不算天数。
//   点它：对话框里只有不用 AI 的东西（留着的那件事、今天的门、旧话）。AI 那几样（跟我多聊几句、这个怎么说）这一版不放。
// 形象：画师还没交稿，先放圆形占位（🐧）。交稿后把图传到 R2 sticker-photos/voyo/（文件名照样板「给画师」：voyo_happy@3x.png、voyo_happy_avatar@3x.png……），把下面 ART_ON 改成 true 就换上。
// 进度 voyo.v1（同步）：{met, open: {门: {d, how, t, p, l}}, slip: {d, t, p, l, asked, r}, day: {d, shown, done, doors}, oldD}；兴趣 hv.interests（同步，迎新 welcome.js 写）。
// 对外：window.VOYO = {after(今天页, 是不是今天), meet(), meRow(), meOpen(), open()}。
(function(){
"use strict";
const ART_ON = false;   // 画师交稿、图传上 R2 以后改成 true
const ART = (mood, av) => `https://img.heyvoyo.com/voyo/voyo_${mood}${av ? "_avatar" : ""}@3x.png`;
const H = () => window.HVI || {}, A = () => window.AK || null;
const UIL = () => { const u = H().UI || (document.documentElement.lang || "zh").slice(0, 2); return u === "pt" ? "en" : u; };
const ZHUI = () => UIL() === "zh";
const LGV = () => H().LEARN || "en";   // 在学的语言
const KL = () => ["zh", "en"].includes(LGV()) ? LGV() : "";   // 开门、句子只有中文和英语
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch(e){ return null; } };
const mark = k => { try { window.hvSyncMark && window.hvSyncMark(k); } catch(e){} };
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => ymd(new Date());
const dBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
// 界面文字：T(中文, English)；西、日、阿在下面 V18 里（按英文原文找），没有再去活动的翻译里找，最后用英文
const T = (zh, en) => { const u = UIL(); if (u === "zh") return zh; if (u === "en") return en; const v = (V18[en] || {})[u]; if (v) return v; try { return A() ? A().TR(en) : en; } catch(e){ return en; } };
const TN = (zh, en, n) => T(zh, en).replace(/\{n\}/g, n);
const ZN = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];
const say = (t, l) => { try { A() ? A().say(t, {l: l || (/[一-鿿]/.test(t) ? "zh" : "en")}) : 0; } catch(e){} };
const blip = f => { try { A() && A().blip(f); } catch(e){} };
const sayable = (t, p, l) => A() ? A().sayable(t, {l: l || KL() || "en", p: p || ""}) : esc(t);
const meanOf = m => { try { return A() ? A().meanOf(m) : ""; } catch(e){ return ""; } };

// ── 状态 ──
const ST = () => { const o = ls("voyo.v1") || {}; o.open = o.open || {}; return o; };
const SAVE = o => { ls("voyo.v1", o); mark("voyo.v1"); };
const ints = () => { const v = ls("hv.interests"); return Array.isArray(v) ? v : null; };
const INTS = () => (window.WELCOME && WELCOME.INTERESTS) ? WELCOME.INTERESTS() : [];
const intLbl = it => ZHUI() ? it.zh : UIL() === "en" ? it.en : (it.u && it.u[UIL()]) || it.en;
const likesTxt = () => { const I = new Set(ints() || []), L = INTS().filter(x => x.isles.every(k => I.has(k))).map(intLbl); return L.join(T("、", ", ")); };

// ── 形象（占位）──
// 尺寸照样板「给画师」：船头 110 · 自我介绍 140 · 气泡旁 48 · 「今天」页角落 60 · 对话框顶上 38 · 纸条 56
function face(px, mood, av){ mood = mood || "quiet";
  if (ART_ON) return `<img class="vy-art" src="${ART(mood, av)}" alt="Voyo" style="height:${px}px">`;
  return `<span class="vy-ph" role="img" aria-label="Voyo" style="width:${px}px;height:${px}px;font-size:${Math.round(px * .52)}px">🐧</span>`; }
const BOAT = `<svg viewBox="0 -20 240 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M120 18 l16 5 -16 5z" fill="#e2552f"/><rect x="118" y="18" width="4" height="100" rx="1.5" fill="#8a6a44"/><path d="M123 28 Q178 72 123 112 Z" fill="#fff" stroke="#14305c" stroke-width="2.2" stroke-linejoin="round"/><path d="M116 36 Q82 80 116 112 Z" fill="#fff8ea" stroke="#14305c" stroke-width="2.2" stroke-linejoin="round"/><path d="M54 116 h134 q-10 30 -42 32 h-54 q-30 -2 -38 -32z" fill="#14305c"/><path d="M62 125 h118" stroke="#ffc861" stroke-width="2.2" stroke-linecap="round"/><circle cx="160" cy="134" r="4" fill="#fbf7ee" stroke="#ffc861" stroke-width="1.6"/><path d="M0 150 q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V170 H0z" fill="#b3d2e6"/><path d="M0 160 q15 -7 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/></svg>`;

// ── 小互动 ──
function sparks(el, n){ try { const r = el.getBoundingClientRect(); for (let k = 0; k < (n || 14); k++){ const s = document.createElement("i"); s.className = "vy-spk"; s.style.left = (r.left + r.width / 2) + "px"; s.style.top = (r.top + r.height / 2) + "px"; s.style.background = ["#e2552f", "#c8962e", "#2f7d70", "#14305c", "#ffc861"][k % 5]; document.body.appendChild(s); const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90; s.animate([{transform: "translate(0,0) rotate(0)", opacity: 1}, {transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 40}px) rotate(${Math.random() * 540}deg)`, opacity: 0}], {duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.4,1)"}).onfinish = () => s.remove(); } } catch(e){} }
function note(x, y){ const n = document.createElement("i"); n.className = "vy-note"; n.textContent = "♪"; n.style.left = (x - 5) + "px"; n.style.top = (y - 18) + "px"; document.body.appendChild(n); setTimeout(() => n.remove(), 800); }
const hop = el => { try { el.animate([{transform: "translateY(0)"}, {transform: "translateY(-12px) scale(1.06)"}, {transform: "translateY(0)"}], {duration: 450}); } catch(e){} };

// ══════════ 一、第一次见面 ══════════
const LV = [["刚开始", "Just started", "你好！", "nǐ hǎo!", "Hi!", "正好，从你真想说的开始。", "Perfect. We'll start from what you actually want to say."],
  ["能聊日常", "Everyday chat", "最近怎么样？忙吗？", "zuìjìn zěnmeyàng? máng ma?", "How's it going? Busy?", "不错，已经能聊了。咱们去找人聊。", "Nice — you can already chat. Let's find people to chat with."],
  ["比较流利", "Pretty fluent", "好久不见！最近在忙什么呢？", "hǎojiǔ bú jiàn! zuìjìn zài máng shénme ne?", "Long time no see — what have you been up to lately?", "那你缺的是能聊的真人。我认识几个。", "Oh, then you mostly need real people to talk to. I know a few."]];
let MS = null, MEET = null;
function meet(done){ if (MEET) return; mount(); MS = {step: 0, picks: [], lv: null, done};
  MEET = document.createElement("div"); MEET.id = "vyMeet"; MEET.className = "vy-meet"; MEET.dataset.nopy = ""; MEET.setAttribute("dir", UIL() === "ar" ? "rtl" : "ltr");
  MEET.innerHTML = `<div class="vy-mph"><div class="vy-mtop" id="vyMtop"></div><div class="vy-float" id="vyFloat"></div>
    <div class="vy-boat wig" id="vyBoat" dir="ltr">${BOAT}<div class="vy-actor hide" id="vyActor"><div class="in">${face(110)}</div></div><span class="vy-dots" id="vyDots">…</span><div class="vy-cargo" id="vyCargo"></div></div>
    <div class="vy-mbot" id="vyMbot"></div></div>`;
  document.body.appendChild(MEET); document.body.classList.add("vy-meet-on"); pose("bow");
  const $ = s => MEET.querySelector(s);
  $("#vyMbot").innerHTML = `<div class="vy-cap">${esc(T("你的船上，有什么在动。", "Something's moving on your boat."))}</div><button class="vy-cta ink" id="vyLook">${esc(T("看看", "Take a look"))}</button>`;
  $("#vyLook").onclick = m1; $("#vyBoat").onclick = () => { if (MS && MS.step === 0) m1(); };
  MEET.addEventListener("pointerdown", e => { const b = e.target.closest("button"); if (b) { blip(700); note(e.clientX, e.clientY); } });
  MEET.addEventListener("click", e => { const t = e.target.closest("[data-aksay]"); if (t) e.stopPropagation(); }, true);
}
const M$ = s => MEET && MEET.querySelector(s);
function pose(p, top){ const a = M$("#vyActor"); if (!a) return; const sz = {bow: 110, big: 140, side: 64}[p];
  a.querySelector(".in").innerHTML = face(sz, p === "bow" ? "quiet" : "happy");
  if (p === "bow") Object.assign(a.style, {left: "calc(34% - 55px)", top: "calc(72% - 110px)"});
  else if (p === "big") Object.assign(a.style, {left: "calc(50% - 70px)", top: (top != null ? top + "px" : "-60%")});
  else Object.assign(a.style, {left: "calc(88% - 64px)", top: "-6%"}); }
const mood = m => { const a = M$("#vyActor .in"); if (a) { const s = a.firstElementChild; const h = s ? (s.offsetHeight || 110) : 110; a.innerHTML = face(h, m); } };
const jump = () => { const a = M$("#vyActor .in"); if (a) hop(a); };
const bub = (html, small) => { const t = M$("#vyMtop"); if (t) t.innerHTML = `<div class="vy-bub">${small ? `<span class="vy-bf">${face(48, small, true)}</span>` : ""}${html}</div>`; };
function m1(){ MS.step = 1; const b = M$("#vyBoat"); b.classList.remove("wig"); const d = M$("#vyDots"); if (d) d.remove();
  const a = M$("#vyActor"); a.classList.remove("hide"); requestAnimationFrame(() => pose("big"));
  setTimeout(() => { sparks(a, 16); blip(990); }, 450);
  setTimeout(() => { if (!MEET) return;
    const hi = KL() === "zh" ? ["你好！我是 Voyo。", "nǐ hǎo! wǒ shì Voyo"] : ["Hi! I'm Voyo.", ""];
    bub(`${esc(T("啊，你好！我是 Voyo。我从南极来。南极不属于任何一个国家，所以我谁也不偏向。我就跟着你的船，去世界各地。", "Oh — hi! I'm Voyo. I'm from Antarctica. Antarctica belongs to no country — so I'm not on anyone's side. I just follow your boat around the world."))}${KL() ? `<span class="vy-tl">${sayable(hi[0], hi[1])}</span>` : ""}`);
    const bw = b.getBoundingClientRect(), bb = M$("#vyMtop .vy-bub").getBoundingClientRect();
    pose("big", Math.max(bb.bottom + 10 - bw.top, -bw.height * .6));
    if (KL()) say(hi[0], KL());
    M$("#vyMbot").innerHTML = `<button class="vy-cta" id="vyHi">${esc(T("嘿，Voyo！", "Hey, Voyo!"))}</button>`;
    M$("#vyHi").onclick = () => { jump(); ints() == null ? m2() : m3(); };
  }, 700); }
// 迎新没问过兴趣（跳过了，或者在学的语言迎新还没有）才问：捞起一到三个
function m2(){ MS.step = 2; mood("curious"); M$("#vyActor").classList.add("hide");
  bub(esc(T("问你个事：你一有空就爱看什么？捞起一到三个。", "Quick one: whenever you've got a free moment, what do you love looking at? Fish out up to three.")), "curious");
  const f = M$("#vyFloat"), L = INTS(); f.classList.add("on"); M$("#vyBoat").classList.add("low");
  f.innerHTML = L.map((x, i) => `<button class="vy-fl" data-i="${i}" style="animation-delay:${(i % 5) * .35}s"><span class="vy-bt">${x.e}</span><b>${esc(intLbl(x))}</b>${KL() === "zh" ? `<small>${esc(x.zh)}</small>` : KL() === "en" && !["en"].includes(UIL()) ? `<small>${esc(x.en)}</small>` : ""}</button>`).join("");
  M$("#vyMbot").innerHTML = `<button class="vy-cta ink" id="vyDone2">${esc(T("就这些", "That's me"))}</button><button class="vy-cta ghost" id="vySkip2">${esc(T("先不选", "Skip for now"))}</button>`;
  f.querySelectorAll(".vy-fl").forEach(b => b.onclick = () => { if (MS.picks.length >= 3) return; const x = L[+b.dataset.i]; MS.picks.push(x); b.classList.add("got"); blip(880);
    if (KL()) say(KL() === "zh" ? x.zh : x.en, KL());
    const c = document.createElement("i"); c.textContent = x.e; M$("#vyCargo").appendChild(c);
    bub(esc(T("记下了。", "Noted.")) + " " + x.e, "happy");
    if (MS.picks.length >= 3){ bub(esc(T("船装满啦！", "Boat's full!")), "happy"); sparks(M$("#vyCargo"), 18); setTimeout(m2done, 1300); } });
  M$("#vyDone2").onclick = m2done; M$("#vySkip2").onclick = () => { MS.picks = []; m2done(true); }; }
function m2done(skip){ if (!MS || MS.step !== 2) return; const I = [...new Set(MS.picks.flatMap(x => x.isles))]; if (MS.picks.length || skip === true){ ls("hv.interests", I); mark("hv.interests"); }
  const f = M$("#vyFloat"); f.classList.remove("on"); f.innerHTML = ""; M$("#vyBoat").classList.remove("low"); m3(); }
function m3(){ MS.step = 3; mood("curious"); M$("#vyActor").classList.add("hide");
  if (!KL()){ m4(); return; }
  const lang = KL() === "zh" ? T("中文", "Chinese") : T("英语", "English");
  bub(esc(KL() === "zh" ? T("那你的中文呢？下面哪句你现在就能跟朋友说出口？点一下能听。", "And your Chinese — which one could you say to a friend right now? Tap to hear.") : T("那你的英语呢？下面哪句你现在就能跟朋友说出口？点一下能听。", "And your English — which one could you say to a friend right now? Tap to hear.")), "curious");
  M$("#vyMbot").innerHTML = `<span class="vy-lang">${esc(T("在学", "Learning"))} <b>${esc(lang)}</b></span>
    <div class="vy-lvls">${LV.map((l, i) => `<button class="vy-lvb" data-l="${i}"><span class="l">${esc(T(l[0], l[1]))}</span><span class="z" dir="auto">${esc(KL() === "zh" ? l[2] : l[4])}</span>${KL() === "zh" ? `<span class="p">${esc(l[3])}</span>` : ""}</button>`).join("")}</div>`;
  M$("#vyMbot").querySelectorAll(".vy-lvb").forEach(b => b.onclick = () => { const i = +b.dataset.l, l = LV[i]; say(KL() === "zh" ? l[2] : l[4], KL());
    if (MS.lv === i){ m4(); return; }
    MS.lv = i; M$("#vyMbot").querySelectorAll(".vy-lvb").forEach(x => x.classList.toggle("on", x === b));
    bub(esc(T(l[5], l[6])), "happy");
    if (!M$("#vyOk3")){ const btn = document.createElement("button"); btn.className = "vy-cta"; btn.id = "vyOk3"; btn.style.marginTop = "10px"; btn.textContent = T("对，差不多这样", "Yep, that's me"); btn.onclick = m4; M$("#vyMbot").appendChild(btn); } }); }
function m4(){ if (MS.step >= 4) return; MS.step = 4; const a = M$("#vyActor"); a.classList.remove("hide"); pose("side"); jump();
  if (MS.lv != null){ try { A() && A().level(MS.lv); } catch(e){} }
  const lk = likesTxt(), lv = MS.lv != null ? LV[MS.lv] : null;
  bub(esc(T("好，我记住了。", "Okay. Got it — I'll remember.")));
  M$("#vyMbot").innerHTML = `<div class="vy-nb"><span class="vy-stamp drop">${esc(T("记住了", "NOTED"))}</span><h4>${esc(T("Voyo 记下的", "Voyo's notes"))}</h4>
    <div>${esc(T("你爱看：", "You like: "))}<span class="w">${esc(lk || "—")}</span></div>
    ${lv ? `<div>${esc(KL() === "zh" ? T("中文：", "Chinese: ") : T("英语：", "English: "))}<span class="w">${esc(T(lv[0], lv[1]))}</span></div>` : ""}
    <div class="sm">${esc(T("哪条不对，随时到「我」里改。", "Anything off? Change it anytime in Me."))}</div></div>`;
  blip(1040); setTimeout(() => sparks(M$(".vy-stamp"), 34), 200);
  setTimeout(m5, 2600); }
function m5(){ if (!MEET) return; MS.step = 5; pose("bow"); mood("quiet");
  bub(esc(T("我回船头啦。想找我就点我。", "I'll be at the bow. Tap me whenever.")));
  const nb = M$("#vyMbot"); nb.insertAdjacentHTML("beforeend", `<button class="vy-cta ink" id="vyBye" style="margin-top:12px">${esc(T("好", "OK"))}</button>`);
  M$("#vyBye").onclick = meetClose;
  M$("#vyActor").onclick = () => { jump(); mood("happy"); setTimeout(() => mood("quiet"), 900); }; }
function meetClose(){ const o = ST(); o.met = o.met || today(); SAVE(o); if (MEET){ MEET.remove(); MEET = null; } document.body.classList.remove("vy-meet-on"); const f = MS && MS.done; MS = null; refresh(); if (f) f(); }

// ══════════ 二、开门（兴趣网）══════════
const NETS = () => window.HV_NETS || {};
const KIND = {person: ["👤", "人", "A person"], post: ["💬", "一条动态", "A post"], sticker: ["📍", "地图上", "On the map"], clip: ["🎬", "短片", "A clip"], howabout_day: ["🌍", "你那边呢", "How About Yours?"], activity: ["🎪", "活动", "An activity"], word: ["🔤", "一个词", "A word"], topic: ["💭", "话题", "A topic"]};
const nodeOk = (N, id, D) => { const n = N[id]; return !!(n && n[4] && (!n[5] || n[5] <= D)); };
const lid = (net, l) => net + "|" + l[0] + ">" + l[1];
// 门上的话、点的标题：网里 zh 是写给学英语的人看的（中文界面），en 是写给学中文的人看的（英文界面）。
// 学中文的人界面是西 / 日 / 阿，先看英文那份；学英语的人界面不是中文，还没有写给他们的门（等内容补 es / ja / ar），先不给门
// 阿语界面：网里有阿语（door.ar、title.ar、key_mean_ar），看阿语；西语、日语界面还没有，学中文的人先看英文那份
const DL = () => UIL() === "ar" ? "ar" : KL() === "en" ? "zh" : "en";
const doorsOK = () => KL() === "zh" || (KL() === "en" && (ZHUI() || UIL() === "ar"));
function myNets(){ const I = new Set(ints() || []), L = KL(); if (!L || !doorsOK()) return []; return Object.entries(NETS()).filter(([k, n]) => (n.isles || []).some(x => I.has(x))); }
function usable(N, l, D){ const L = KL(); return !!(l[2] && doorTxt(l)) && nodeOk(N, l[1], D) && (!l[3] || l[3] === L) && (!l[4] || l[4] <= D) && !l[5] && l[6] && l[6][L]; }
// 今天的门：从入口和你开过的门后面那一点出发；一天定一次（2–3 扇），开过的不再算
function doorsToday(){ const D = today(), o = ST(), nets = myNets(); if (!nets.length) return [];
  const all = {}; nets.forEach(([k, n]) => n.links.forEach(l => { all[lid(k, l)] = [k, n, l]; }));
  const ok = id => { const x = all[id]; return x && usable(x[1].nodes, x[2], D); };
  if (o.day && o.day.d === D && Array.isArray(o.day.doors)) return o.day.doors.filter(ok).map(id => all[id]);
  const opened = Object.entries(o.open).filter(([id]) => all[id]).sort((a, b) => (b[1].d || "").localeCompare(a[1].d || ""));
  const seen = new Set(opened.map(([id]) => all[id][2][1])), fromOpen = opened.map(([id]) => all[id][2][1]);
  let seed = 0; for (const c of D) seed = (seed * 31 + c.charCodeAt(0)) >>> 0; const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
  const pick = [], to = new Set(), add = list => { list.sort(() => rnd() - .5).forEach(x => { if (pick.length < 3 && !to.has(x[2][1]) && !o.open[lid(x[0], x[2])] && !seen.has(x[2][1])){ pick.push(x); to.add(x[2][1]); } }); };
  nets.forEach(([k, n]) => { const near = n.links.filter(l => fromOpen.includes(l[0]) && usable(n.nodes, l, D)).map(l => [k, n, l]); add(near); });
  nets.forEach(([k, n]) => { const ent = new Set((n.entries || []).filter(e => nodeOk(n.nodes, e, D))); add(n.links.filter(l => ent.has(l[0]) && usable(n.nodes, l, D)).map(l => [k, n, l])); });
  o.day = (o.day && o.day.d === D) ? o.day : {d: D, shown: [], done: []}; o.day.doors = pick.map(x => lid(x[0], x[2])); SAVE(o);
  return pick; }
function openedList(){ const o = ST(), out = []; Object.entries(o.open).forEach(([id, v]) => { const [net, ft] = id.split("|"), n = NETS()[net]; if (!n) return; const [f, t] = ft.split(">"), l = n.links.find(x => x[0] === f && x[1] === t); if (l) out.push([net, n, l, v]); }); return out.sort((a, b) => (b[3].d || "").localeCompare(a[3].d || "")); }
// 阿语门分两份（2026-11-12）：学中文的人有 ar_zh 用 ar_zh，没有用 ar；学英语的人一律用 ar
const doorTxt = l => DL() === "ar" && KL() === "zh" ? (l[2].ar_zh || l[2].ar || "") : (l[2][DL()] || "");
const nodeTxt = n => n ? (DL() === "zh" ? n[1] : DL() === "ar" ? n[6] : n[2]) || "" : "";
const keyOf = l => { const k = l[6][KL()]; return KL() === "zh" ? {t: k[0], p: k[1], m: k[2], ar: k[3] || ""} : {t: k[0], p: "", m: k[1], ar: k[2] || ""}; };
function doorCard(x, isOpen){ const [net, n, l] = x, to = n.nodes[l[1]] || [], K = KIND[to[0]] || ["🚪", "", ""], id = lid(net, l);
  return `<button class="vy-dr${isOpen ? " open" : ""}" data-vydoor="${esc(id)}"><span class="vy-dfr"><span class="em">${K[0]}</span><span class="vy-leaf"></span></span><span class="vy-dtx"><b dir="auto">${esc(doorTxt(l))}</b><span class="st">${esc(isOpen ? T("开着 · 随时回去", "Open · go back anytime") : T("说一句就开", "Say one line to open"))}</span></span></button><div data-vyslot="${esc(id)}"></div>`; }
function doorsHTML(){ const D = doorsToday(), O = openedList(), Dset = new Set(D.map(x => lid(x[0], x[2])));
  if (!D.length && !O.length) return "";
  const same = (DL() === "zh" && ZHUI()) || (DL() === "en" && UIL() === "en"), nm = same ? myNets().map(([k, n]) => n.interest[DL()] || "").filter(Boolean).join(T("、", ", ")) : "";
  const older = O.filter(x => !Dset.has(lid(x[0], x[2])));
  return `<div class="vy-sec"><div class="vy-msg">${esc(T("我给你找了几扇门。想开哪扇，就把敲门的那句话说一遍。", "I found a few doors for you. To open one, just say the line that knocks on it."))}${nm ? `<small>👗 ${esc(nm)}</small>` : ""}</div>
    ${D.map(x => doorCard(x, !!ST().open[lid(x[0], x[2])])).join("")}
    ${older.length ? `<details class="vy-old"><summary>${esc(TN("开过的门 · {n}", "Doors you've opened · {n}", older.length))}</summary>${older.map(x => doorCard(x, true)).join("")}</details>` : ""}</div>`; }
function findDoor(id){ const [net, ft] = id.split("|"), n = NETS()[net]; if (!n) return null; const [f, t] = ft.split(">"), l = n.links.find(x => x[0] === f && x[1] === t); return l ? [net, n, l] : null; }
function doorTap(id, root){ const x = findDoor(id); if (!x) return; const slot = root.querySelector(`[data-vyslot="${CSS.escape(id)}"]`), card = root.querySelector(`[data-vydoor="${CSS.escape(id)}"]`);
  root.querySelectorAll("[data-vyslot]").forEach(s => { if (s !== slot) s.innerHTML = ""; }); root.querySelectorAll(".vy-dr").forEach(c => c.classList.toggle("cur", c === card));
  if (slot.innerHTML){ slot.innerHTML = ""; card.classList.remove("cur"); return; }
  if (ST().open[id]){ showBehind(x, slot, false); return; }
  const k = keyOf(x[2]), m = UIL() === "ar" ? k.ar : meanOf(k.m);
  slot.innerHTML = `<div class="vy-knock"><span class="k">${esc(T("敲门的那句 · 先听，再跟着说", "THE LINE THAT KNOCKS · HEAR IT, THEN SAY IT"))}</span>
    <span class="vy-tl">${sayable(k.t, k.p)}</span>${m ? `<span class="mn" dir="auto">${esc(m)}</span>` : ""}
    <div class="vy-nudge">${esc(T("不用说得很完美，能听懂就行。", "It doesn't have to be perfect — being understood is enough."))}</div>
    <div data-vymic>${A() ? A().micHTML({hint: T("点一下或按住说", "Tap or hold to speak")}) : ""}</div>
    <div class="vy-quiet">${esc(T("现在不方便说话？", "Can't talk right now?"))} <button data-vyq="tiles">${esc(T("按顺序点词", "Tap the words in order"))}</button> · <button data-vyq="twice">${esc(T("听两遍", "Just listen twice"))}</button></div>
    <div data-vyqa></div></div>`;
  say(k.t, KL());
  const mb = slot.querySelector(".ak-mic"); if (mb && A()) A().mic(mb, {want: k.t, l: KL(), onDone: () => setTimeout(() => openDoor(x, slot, card, "say"), 350)});
  slot.querySelector('[data-vyq="tiles"]').onclick = () => quietTiles(x, slot, card);
  slot.querySelector('[data-vyq="twice"]').onclick = () => quietTwice(x, slot, card); }
// 词块：中文按词切（有 Intl.Segmenter 就用它），英文按空格；标点跟着前一个词
function tiles(t){ let W = [];
  if (KL() === "zh"){ try { W = [...new Intl.Segmenter("zh", {granularity: "word"}).segment(t)].map(s => s.segment); } catch(e){ W = [...t]; } }
  else W = t.split(/\s+/);
  const out = []; W.forEach(w => { if (!w.trim()) return; if (/^[\p{P}\s]+$/u.test(w) && out.length) out[out.length - 1] += w; else out.push(w); });
  if (KL() === "zh"){ const m = []; out.forEach(w => { if (m.length && [...m[m.length - 1]].length === 1 && [...w].length === 1 && !/\p{P}/u.test(m[m.length - 1])) m[m.length - 1] += w; else m.push(w); }); return m.slice(0, 8); }
  return out; }
function quietTiles(x, slot, card){ const k = keyOf(x[2]), W = tiles(k.t), qa = slot.querySelector("[data-vyqa]"); let n = 0;
  const sh = W.map((w, i) => [w, i]).sort(() => Math.random() - .5);
  qa.innerHTML = `<div class="vy-wline" dir="auto"></div><div class="vy-wtiles">${sh.map(([w, i]) => `<button class="vy-wt" data-wi="${i}" dir="auto">${esc(w)}</button>`).join("")}</div>`;
  qa.querySelectorAll(".vy-wt").forEach(b => b.onclick = () => {
    if (W[+b.dataset.wi] !== W[n]){ b.classList.remove("shk"); void b.offsetWidth; b.classList.add("shk"); blip(440); return; }
    n++; b.classList.add("used"); qa.querySelector(".vy-wline").textContent += (KL() === "en" && n > 1 ? " " : "") + b.textContent; blip(880);
    if (n === W.length) setTimeout(() => openDoor(x, slot, card, "quiet"), 400); }); }
function quietTwice(x, slot, card){ const k = keyOf(x[2]), qa = slot.querySelector("[data-vyqa]"); let c = 0;
  qa.innerHTML = `<button class="vy-chip" data-tw>🔊 ${esc(T("播放", "Play"))} <em>0/2</em></button>`;
  const b = qa.querySelector("[data-tw]"); b.onclick = () => { say(k.t, KL()); c++; b.querySelector("em").textContent = Math.min(c, 2) + "/2"; blip(880); if (c === 2) setTimeout(() => openDoor(x, slot, card, "quiet"), 1800); }; }
function openDoor(x, slot, card, how){ const o = ST(), id = lid(x[0], x[2]), k = keyOf(x[2]); if (o.open[id]) return;
  o.open[id] = {d: today(), how, t: k.t, p: k.p, l: KL()}; o.day = o.day && o.day.d === today() ? o.day : {d: today(), shown: [], done: []}; if (!o.day.done.includes("door")) o.day.done.push("door"); SAVE(o);
  card.classList.add("open"); const st = card.querySelector(".st"); if (st) st.textContent = T("开着 · 随时回去", "Open · go back anytime");
  blip(1040); showBehind(x, slot, true);
  const m = document.querySelector("#vySheet .vy-sec .vy-msg"); if (m && m.firstChild) m.firstChild.textContent = how === "say" ? T("你说出来了，门开了！", "You said it — the door's open!") : T("门开了。下次方便的时候，也可以说出声。", "Door's open. Say it out loud next time if you can."); }
function showBehind(x, slot, fresh){ const [net, n, l] = x, to = n.nodes[l[1]] || [], K = KIND[to[0]] || ["🚪", "", ""], k = keyOf(l), city = ZHUI() && to[3] && !/^[—（]/.test(to[3]) && to[3] !== "全世界" ? to[3] : "";
  slot.innerHTML = `<div class="vy-reply">${fresh ? `<span class="vy-stamp drop">${esc(T("开了", "OPEN"))}</span>` : ""}
    <div class="vy-kind">${K[0]} ${esc(T(K[1], K[2]))}${city ? " · " + esc(city) : ""}</div><b class="vy-ttl" dir="auto">${esc(nodeTxt(to))}</b>
    <div class="vy-said"><small>${esc(T("你敲门说的", "What you said at the door"))}</small><span class="vy-tl">${sayable(k.t, k.p)}</span></div></div>`;
  if (fresh) setTimeout(() => sparks(slot.querySelector(".vy-reply"), 28), 150); }

// ══════════ 三、纸条 ══════════
const WAYS = [["self", "🤫", "只对自己说", "Just to yourself", "小声说就行。", "Under your breath is fine."], ["write", "✍️", "写下来", "Write it down", "备忘录、外卖备注、便利贴。", "Notes app, a delivery note, a sticky note."], ["other", "🗣️", "对别人说", "Say it to someone", "朋友、家里人、店员——谁方便就谁。", "A friend, family, someone at a shop — whoever's easy."]];
function lastToday(){ const D = today(); return Object.values(ST().open).filter(v => v.d === D && v.t).pop() || null; }
function slipView(body){ const L = lastToday(), o = ST();
  if (!L){ body.innerHTML = `<div class="vy-pbub">${face(56, "happy")}<div class="vy-msg">${esc(T("好，回头见。", "Okay. See you."))}</div></div>`; setTimeout(closeSheet, 1300); return; }
  o.slip = {d: today(), t: L.t, p: L.p || "", l: L.l || KL()}; SAVE(o);
  body.innerHTML = `<div class="vy-pbub"><span id="vyNfc">${face(56, "happy")}</span><div class="vy-msg">${esc(T("走之前，带上这个。", "Before you go — take this with you."))}</div></div>
    <div class="vy-slip" id="vySlip"><span class="h">${esc(T("出门带上这个", "TAKE THIS OUT WITH YOU"))}</span><span class="vy-tl">${sayable(L.t, L.p, L.l)}</span>
      <span class="mn">${esc(T("你今天敲门说的那句——找个机会用一次。", "The line you knocked with today — use it once out there."))}</span>
      <div class="vy-ways">${WAYS.map(w => `<button class="vy-way" data-way="${w[0]}"><span class="e">${w[1]}</span><span>${esc(T(w[2], w[3]))}<small>${esc(T(w[4], w[5]))}</small></span></button>`).join("")}</div>
      <div class="vy-fine">${esc(T("哪种都算。不用跟陌生人搭话。", "Any of these counts. No talking to strangers needed."))}</div></div>
    <button class="vy-cta" id="vyKeep" style="margin-top:16px">${esc(T("收好了", "Got it — in my pocket"))}</button>`;
  body.querySelectorAll(".vy-way").forEach(b => b.onclick = () => { body.querySelectorAll(".vy-way").forEach(x => x.classList.toggle("on", x === b)); blip(880); });
  body.querySelector("#vyKeep").onclick = () => { body.querySelector("#vySlip").classList.add("fold"); blip(880);
    setTimeout(() => { const m = body.querySelector(".vy-pbub .vy-msg"); if (m) m.textContent = T("回头见。明天我只问一次，试了没。", "See you. I'll ask how it went — just once."); const f = body.querySelector("#vyNfc"); if (f) f.innerHTML = face(56, "quiet"); body.querySelector("#vyKeep").remove(); setTimeout(closeSheet, 1800); }, 650); }; }
const slipAsk = () => { const s = ST().slip, D = today(); return !!(s && s.d < D && !s.r && (!s.asked || s.asked === D)); };
function slipAnswer(r, box){ const o = ST(); if (!o.slip) return; o.slip.r = r; o.slip.rd = today(); SAVE(o); dayDone("slip");
  box.innerHTML = `<div class="vy-msg">${esc(r === "yes" ? T("真好。这句话已经在你的生活里了。", "Nice. That line's part of your life now.") : T("好。", "Okay."))}</div>`;
  if (r === "yes"){ sparks(box, 24); blip(1040); } setTimeout(() => refresh(), 1400); }
const slipAskHTML = () => { const s = ST().slip; return `<div class="vy-ask"><div>${esc(T("昨天那张纸条，试了吗？", "Yesterday's slip — did you try it?"))}</div><span class="vy-mini" dir="auto">${esc(s.t)}</span><div class="vy-chips"><button class="vy-chip hot" data-vyslip="yes">${esc(T("试了", "I tried it"))}</button><button class="vy-chip" data-vyslip="no">${esc(T("没顾上", "Didn't get to it"))}</button></div></div>`; };

// ══════════ 四、旧话：偶尔拿回一句你以前说过的 ══════════
function oldLine(){ const D = today(), now = Date.now(), L = [];
  try { (H().said ? H().said() : []).forEach(x => { if (x && x.t && x.ts) L.push({t: x.t, ts: x.ts}); }); } catch(e){}
  Object.values(ST().open).forEach(v => { if (v.how === "say" && v.t && v.d) L.push({t: v.t, p: v.p, l: v.l, ts: new Date(v.d + "T12:00:00").getTime()}); });
  const old = L.filter(x => now - x.ts >= 14 * 864e5 && x.t.length <= 60); if (!old.length) return null;
  let s = 0; for (const c of D) s += c.charCodeAt(0); const x = old[s % old.length]; return Object.assign({days: Math.floor((now - x.ts) / 864e5)}, x); }
function oldWhen(days){ const w = Math.floor(days / 7);
  if (w <= 8) return ZHUI() ? (ZN[w] || w) + "周前你说过这句，今天再说一遍？" : TN("{n} 周前你说过这句，今天再说一遍？", "You said this {n} weeks ago. Say it again today?", w);
  return T("以前你说过这句，今天再说一遍？", "You said this a while ago. Say it again today?"); }
function oldHTML(x){ const l = x.l || (/[一-鿿]/.test(x.t) ? "zh" : "en");
  return `<div class="vy-sec vy-oldl"><div class="vy-msg">💬 ${esc(oldWhen(x.days))}<span class="vy-tl">${sayable(x.t, x.p || "", l)}</span><small>${esc(T("今天再说一遍——变了的话，就照现在的说。", "Say it again today — or change it if it's not true any more."))}</small></div><div data-vyoldmic>${A() ? A().micHTML({hint: T("点一下或按住说", "Tap or hold to speak")}) : ""}</div></div>`; }

// ══════════ 五、平常的一天：「今天」页右下角 ══════════
// 一天最多冒头两次；第三件留到点它时放在对话框最上面
function avail(){ const out = []; if (slipAsk()) out.push("slip"); if (doorsToday().length && !lastToday()) out.push("door");
  const o = ST(); if (oldLine() && (!o.oldD || o.oldD === today() || dBetween(o.oldD, today()) >= 7)) out.push("old"); return out; }
function dayState(){ const o = ST(), D = today(); if (!o.day || o.day.d !== D) o.day = {d: D, shown: [], done: [], doors: o.day && o.day.d === D ? o.day.doors : undefined}; o.day.shown = o.day.shown || []; o.day.done = o.day.done || []; return o; }
function dayDone(k){ const o = dayState(); if (!o.day.done.includes(k)) o.day.done.push(k); SAVE(o); }
function raiseKind(){ const o = dayState(), P = avail().filter(k => !o.day.done.includes(k));
  let k = o.day.shown.find(x => P.includes(x)); if (k) return k;
  if (o.day.shown.length >= 2) return null; k = P.find(x => !o.day.shown.includes(x)); if (!k) return null;
  o.day.shown.push(k); if (k === "slip"){ o.slip.asked = today(); } if (k === "old") o.oldD = today(); SAVE(o); return k; }
function heldKinds(){ const o = dayState(); if (o.day.shown.length < 2) return []; return avail().filter(k => !o.day.done.includes(k) && !o.day.shown.includes(k)); }
let BOX = null;
// Voyo 放在「今天」页里面，不浮在页面上（2026-11-12 第二轮复查）：
//   电脑上在顶上那一行（HEYVOYO · 日期 · 搜索）右边、头像前面；手机上在最上面一行问候的右边。点它打开对话框。
//   有事时在那一行下面插一张 Voyo 的卡片（正常占一行，把下面的内容往下推），右边 ✕ 可以关。一天最多冒两次。
function doorTeaser(){ const nm = myNets().map(([x, n]) => (n.interest[DL()] || "")).filter(Boolean)[0] || "", same = (DL() === "zh" && ZHUI()) || (DL() === "en" && UIL() === "en");
  return same && nm ? TN("今天有一件关于{n}的事，要看看吗？", "Something about {n} today. Want a look?", ZHUI() ? nm : nm.toLowerCase()) : T("今天有一件你爱看的事，要看看吗？", "Something you're into is here today. Want a look?"); }
function corner(box){ if (!box) return; mount(); BOX = box; ["vyCorner", "vyRaise", "vyTop"].forEach(id => { const e = box.querySelector("#" + id); if (e) e.remove(); });
  const k = raiseKind(), c = document.createElement("button"); c.id = "vyCorner"; c.className = "vy-corner" + (k ? " alert" : ""); c.setAttribute("aria-label", "Voyo"); c.dataset.nopy = "";
  c.innerHTML = `<span class="in">${face(48, k ? "curious" : "quiet")}</span>`; c.onclick = () => openSheet(k && k !== "slip" ? k : null);
  const head = box.querySelector(".dm-top"), wrap = box.querySelector(".bp-wrap"); let anchor = null;
  if (head){ const av = head.querySelector(".dm-av"); head.insertBefore(c, av || null); anchor = head; }
  else if (wrap){ const h = new Date().getHours(), row = document.createElement("div"); row.id = "vyTop"; row.className = "vy-top"; row.dataset.nopy = ""; row.setAttribute("dir", UIL() === "ar" ? "rtl" : "ltr");
    row.innerHTML = `<b>${esc(h < 11 ? T("早上好", "Good morning") : h < 18 ? T("下午好", "Good afternoon") : T("晚上好", "Good evening"))} 👋</b>`; row.appendChild(c); wrap.insertBefore(row, wrap.firstChild); anchor = row; }
  else return;
  if (!k) return;
  const r = document.createElement("div"); r.id = "vyRaise"; r.className = "vy-raise"; r.dataset.nopy = ""; r.setAttribute("dir", UIL() === "ar" ? "rtl" : "ltr"); r.setAttribute("role", "status");
  const x0 = `<button class="vy-rx" aria-label="${esc(T("关", "Close"))}">✕</button>`;
  if (k === "slip") r.innerHTML = `<span class="vy-rf">${face(40, "curious", true)}</span><div class="vy-rt">${slipAskHTML()}</div>${x0}`;
  else if (k === "door") r.innerHTML = `<span class="vy-rf">${face(40, "curious", true)}</span><div class="vy-rt" data-go>${esc(doorTeaser())}</div>${x0}`;
  else { const x = oldLine(); r.innerHTML = `<span class="vy-rf">${face(40, "curious", true)}</span><div class="vy-rt" data-go>💬 ${esc(x ? oldWhen(x.days) : "")}</div>${x0}`; }
  const go = r.querySelector("[data-go]"); if (go) go.onclick = () => openSheet(k);
  r.querySelectorAll("[data-vyslip]").forEach(b => b.onclick = e => { e.stopPropagation(); slipAnswer(b.dataset.vyslip, r.querySelector(".vy-rt")); });
  r.querySelector(".vy-rx").onclick = e => { e.stopPropagation(); dayDone(k); r.remove(); c.classList.remove("alert"); c.querySelector(".in").innerHTML = face(48, "quiet"); };
  anchor.insertAdjacentElement("afterend", r); blip(440); }
window.addEventListener("hashchange", () => closeSheet(true));
function refresh(){ const b = document.getElementById("boatPg"); if (b && !b.hidden && ST().met) corner(b); }

// ══════════ 六、点它：对话框 ══════════
let SH = null;
function openSheet(focus){ const box = BOX || document.getElementById("boatPg"); if (!box) return; mount(); closeSheet(true);
  const o = dayState(); if (focus && !o.day.done.includes(focus)){ o.day.done.push(focus); SAVE(o); }
  const held = heldKinds(); if (held.length){ const o2 = dayState(); held.forEach(k => { if (k !== "slip" && !o2.day.done.includes(k)) o2.day.done.push(k); }); SAVE(o2); }
  const r = document.getElementById("vyRaise"); if (r) r.remove(); const c = document.getElementById("vyCorner"); if (c){ c.classList.remove("alert"); c.querySelector(".in").innerHTML = face(48, "happy"); }
  SH = document.createElement("div"); SH.id = "vySheet"; SH.className = "vy-sheet"; SH.dataset.nopy = ""; SH.setAttribute("dir", UIL() === "ar" ? "rtl" : "ltr");
  const lk = likesTxt(), ol = oldLine(), dh = doorsHTML();
  const heldH = held.length ? `<div class="vy-held"><small>${esc(T("刚才留着等你的：", "Saved for when you came by:"))}</small>${held.map(k => k === "slip" ? slipAskHTML() : k === "door" ? `<div>👗 ${esc(T("今天有几扇新门。", "A few new doors today."))} ↓</div>` : `<div>💬 ${esc(T("一句你以前说过的话。", "A line you said a while back."))} ↓</div>`).join("")}</div>` : "";
  SH.innerHTML = `<div class="vy-sbg"></div><div class="vy-sp"><div class="vy-shd">${face(38, "happy", true)}<div><b>Voyo</b><small>${esc(T("在你的船上", "on your boat"))}</small></div><span class="sp"></span><button class="vy-x" aria-label="${esc(T("关", "Close"))}">✕</button></div>
    <div class="vy-sbody">${heldH}
      <div class="vy-msg">${esc(lk ? TN("嗨，怎么啦？（我记得，你爱看{n}。）", "Hey. What's up? (I remember — you're into {n}.)", lk) : T("嗨，怎么啦？", "Hey. What's up?"))}${ints() == null || !lk ? `<div class="vy-chips"><button class="vy-chip" data-vyints>${esc(T("告诉我你爱看什么", "Tell me what you're into"))}</button></div>` : ""}</div>
      ${aiChipsHTML()}<div class="vy-ai"></div>
      ${slipAsk() && !held.includes("slip") ? slipAskHTML() : ""}
      ${dh}${ol ? oldHTML(ol) : ""}
      ${!dh && !ol && lk ? `<div class="vy-msg vy-idle">${esc(T("今天没什么要紧的事。我在船头，想找我就点我。", "Nothing urgent today. I'm at the bow — tap me whenever."))}</div>` : ""}
    </div><div class="vy-sfoot"><button class="vy-cta ink" id="vyBye2">${esc(T("今天就到这", "That's it for today"))}</button></div></div>`;
  document.body.appendChild(SH); requestAnimationFrame(() => SH.classList.add("on"));
  const body = SH.querySelector(".vy-sbody");
  SH.querySelector(".vy-x").onclick = () => closeSheet(); SH.querySelector(".vy-sbg").onclick = () => closeSheet();
  SH.querySelector("#vyBye2").onclick = () => { SH.querySelector(".vy-sfoot").remove(); slipView(body); };
  SH.querySelectorAll("[data-vyslip]").forEach(b => b.onclick = () => slipAnswer(b.dataset.vyslip, b.closest(".vy-ask")));
  const ib = SH.querySelector("[data-vyints]"); if (ib) ib.onclick = () => { closeSheet(); editInts(); };
  wireAi(SH);
  SH.addEventListener("click", e => { const d = e.target.closest("[data-vydoor]"); if (d){ blip(700); doorTap(d.dataset.vydoor, SH); } });
  const om = SH.querySelector("[data-vyoldmic] .ak-mic"); if (om && A() && ol) A().mic(om, {want: ol.t, l: ol.l || (/[一-鿿]/.test(ol.t) ? "zh" : "en"), onDone: () => { const m = SH.querySelector(".vy-oldl .vy-msg"); if (m){ m.insertAdjacentHTML("beforeend", `<div class="vy-ok">${esc(T("听到了。", "Got it."))}</div>`); sparks(m, 14); } }});
  if (focus === "door"){ const s = SH.querySelector(".vy-sec"); if (s) setTimeout(() => s.scrollIntoView({block: "start", behavior: "smooth"}), 300); }
  if (focus === "old"){ const s = SH.querySelector(".vy-oldl"); if (s) setTimeout(() => s.scrollIntoView({block: "start", behavior: "smooth"}), 300); } }
function closeSheet(silent){ if (!SH) return; const s = SH; SH = null; try { A() && A().hush(); } catch(e){} if (silent){ s.remove(); return; } s.classList.remove("on"); setTimeout(() => s.remove(), 380); const c = document.querySelector("#vyCorner .in"); if (c) c.innerHTML = face(48, "quiet"); }

// ══════════ 七、问 Voyo（AI，后台/functions/ai）══════════
// 免费：「这个怎么说」「帮我看看这句」（tier free，每天合计 10 次，后台/ai_free.sql）；不用 AI：「想找人聊」
// 🛟 1：「跟我多聊几句」（tier chat，一段只在第一句扣）、「细细说说为什么」（tier chat，一次）。扣之前先说清楚，点了「好」才扣。
// 免费档要等云函数换成新版、config.json 的 ai_free 打开才出现（旧云函数不认 free 档，会当普通档扣 🛟）。
const FREE_MAX = 10;
const aiFn = () => { try { return H().ai ? H().ai() : null; } catch(e){ return null; } };
const freeOn = () => !!aiFn() && (!!window.claude || !!(window.HV_CONFIG && window.HV_CONFIG.ai_free));
const needLogin = () => { try { return !!(H().aiSite && H().aiSite() && !(H().logged && H().logged())); } catch(e){ return false; } };
// 「我」页那一行「我的救生圈」只在网站上登录以后才有：看得到才把人指过去
const lbRow = () => { try { return !!(H().aiSite && H().aiSite() && H().logged && H().logged()); } catch(e){ return false; } };
const lbN = () => { try { return H().lbN ? H().lbN() : null; } catch(e){ return null; } };
function freeUsed(){ const o = ST(); return o.ai && o.ai.d === today() ? o.ai.n || 0 : 0; }
function freeAdd(n){ const o = ST(); o.ai = {d: today(), n: n != null ? n : freeUsed() + 1}; SAVE(o); }
const LN = {zh: "Chinese (Mandarin)", en: "English", fr: "French", es: "Spanish", ja: "Japanese", ar: "Arabic", pt: "Portuguese"};
const lvTxt = () => { let l = 0; try { l = A() ? A().level() : 0; } catch(e){} return ["just starting", "can chat about everyday things", "fairly fluent"][l] || "just starting"; };
// 关心的话：碰到伤害自己 / 被人伤害，不接着聊语言（跟 topics_open/feedback.json 的 care 同一套词，build 时由 gen_nets.py 带进来）
const NOT_HARM = /想死你|笑死|累死|饿死|热死|冷死|困死|急死|气死|忙死|美死|死贵|难死/g;
function careHit(t){ const C = window.HV_CARE || {}, x = String(t || "").replace(NOT_HARM, "").toLowerCase(); const has = K => Object.values(K || {}).some(L => (L || []).some(w => w && x.includes(String(w).toLowerCase())));
  return has(C.kw) ? "self" : has(C.kw_hurt) ? "hurt" : null; }
function careHTML(kind){ const C = window.HV_CARE || {}, h = C.help || ["If you're thinking about hurting yourself, please talk to someone you trust, or a local crisis line, today.", "如果你有伤害自己的念头，请今天就找一个信任的人说说，或者打当地的心理援助热线。"];
  const link = `<a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>`;
  const where = esc(T("按国家查免费的求助热线：", "Find a free helpline in your country: ")) + link;
  const body = kind === "hurt"
    ? `${esc(T("如果有人在伤害你：这不是你的错。请告诉一个你信任的人，或者联系当地的求助机构；有危险的时候，马上打当地的报警电话。", "If someone is hurting you: it is not your fault. Please tell someone you trust, or contact local support services. If you are in danger, call your local emergency number now."))}`
    : esc(T(h[1], h[0]));
  return `<div class="vy-msg vy-care">${esc(T("我先不聊语言了。你说的这件事很重要。", "Let's leave the language for now. What you said matters."))}<br>${body}<br>${where}</div>`; }
function sys(task){ const ui = LN[UIL()] || "English", tg = LN[LGV()] || "English";
  return `You are Voyo, a small penguin who lives on the learner's sailboat in the HeyVoyo app. You come from Antarctica, which belongs to no country, so you take no one's side; you follow the learner's boat around the world. You are quiet and curious — a companion, not a teacher.
The learner's own language (the app's interface) is ${ui}. They are learning ${tg}, level: ${lvTxt()}.
Rules:
- Keep it short. You may use both languages: put the ${tg} first, in simple sentences, then ${ui} if it helps.
- Learner-centred: the goal is to be understood and to take part in a conversation, not to sound like a native speaker. Never say "a native speaker would say", "natural", "unnatural", "not authentic" or similar. No scores, no grades, no pushing, no guilt.
- If the learner shows signs of a crisis (wanting to hurt themselves, being hurt by someone, not wanting to live), stop the language help: set "care": true and keep everything else empty.
- Never make up facts. Never claim to be a human; if asked, you are an AI penguin companion.
- Reply with ONLY JSON, no other text.
${task}`; }
const TASK = {
  how: tgN => `Task: the learner typed something in their own language. Give one simple, everyday way to say it in ${tgN}. JSON: {"say":"the ${tgN} sentence","pron":"${tgN === "Chinese (Mandarin)" ? "pinyin with tone marks" : "IPA of the sentence, or empty"}","note":"optional, one very short tip in the learner's own language, or empty","care":false}`,
  check: tgN => `Task: the learner wrote a sentence in ${tgN} and asks you to look at it. If people could work out the meaning, say so warmly first. If it is easy to follow, "better" is null. If the listener would have to guess (words out of order, words missing, meaning only half clear), still say warmly that you got it, and also give one clearer way to say it in "better". When you praise, say it is clear or easy to understand; never call it "natural". JSON: {"understood":true,"reply":"one short warm line in the learner's own language","better":null or {"t":"a clearer ${tgN} sentence","pron":"${tgN === "Chinese (Mandarin)" ? "pinyin" : "empty"}"},"care":false}`,
  why: tgN => `Task: explain briefly, in the learner's own language, why the second way may be easier for people to understand than the first. At most 3 short sentences, friendly, no grammar lecture, never say the first way is wrong or unnatural. JSON: {"why":"...","care":false}`,
  chat: tgN => `Task: have a light, friendly chat with the learner in ${tgN}. One or two short sentences per turn, then one simple question about their life. If they write in their own language, answer in simple ${tgN} and help them say it. JSON: {"say":"your ${tgN} line","mean":"its meaning in the learner's own language","care":false,"end":false}`
};
function aiErr(e){ const c = (e && e.code) || "";
  if (!navigator.onLine || (e && (e.name === "TypeError" || /fetch|network/i.test(String(e.message || ""))))) return T("网好像断了。等网好了再来找我。", "Looks like you're offline. Come find me when you're back online.");
  if (c === "free_limit"){ freeAdd(FREE_MAX); return T("今天先到这儿，明天再来。", "That's enough for today — come back tomorrow."); }
  if (c === "no_lifebuoys") return lbRow() ? T("救生圈不够了，这次没有扣。在「我」→「我的救生圈」里可以拿。", "Not enough 🛟 — nothing was used this time. You can get more in Me → My lifebuoys.") : T("🛟 不够了。", "Not enough 🛟.");
  if (c === "chat_ended") return T("这段聊天已经结束了。要重新开始吗？", "This chat has ended. Start a new one?");
  if (c === "not_signed_in") return T("登录后可以用。", "Sign in to use this.");
  return T("我这边没拿到回答，等一下再试试。", "I couldn't get an answer just now. Try again in a bit."); }
async function ask(msgs, tier, task){ const ai = aiFn(); if (!ai) throw {code: "off"}; if (!navigator.onLine) throw {name: "TypeError", message: "offline"};
  // 免费档：云函数不收网页送来的人物设定，按 task / 界面语言 / 在学的语言 / 三档自己写 Voyo 的提示词（后台/functions/ai/index.ts 的 voyoSys）；claude.ai 上没有云函数，才用这里的 system
  let lv = 0; try { lv = A() ? A().level() : 0; } catch(e){}
  const j = await ai.json(msgs, {modelTier: tier, system: sys(TASK[task](LN[LGV()] || "English")), cache: false, extra: tier === "free" ? {task, ui: UIL(), learn: LGV(), lv} : null}); if (!j || typeof j !== "object") throw {code: "bad_json"}; return j; }
function aiChipsHTML(){ const ai = !!aiFn(), fr = freeOn();
  return `<div class="vy-chips vy-aichips">${fr ? `<button class="vy-chip" data-vyai="how">${esc(T("这个怎么说？", "How do I say…?"))}<em>${esc(T("免费", "free"))}</em></button><button class="vy-chip" data-vyai="check">${esc(T("帮我看看这句", "Check this line for me"))}<em>${esc(T("免费", "free"))}</em></button>` : ""}<button class="vy-chip" data-vyai="who">${esc(T("想找人聊", "Who could I chat with?"))}<em>${esc(T("免费", "free"))}</em></button>${ai ? `<button class="vy-chip" data-vyai="deep">${esc(T("跟我多聊几句", "Talk with me a bit longer"))}<em>🛟 1</em></button>` : ""}</div>`; }
function wireAi(root){ const box = root.querySelector(".vy-ai"); if (!box) return;
  const bmsg = h => { const m = document.createElement("div"); m.className = "vy-msg"; m.innerHTML = h; box.appendChild(m); m.scrollIntoView({block: "nearest", behavior: "smooth"}); return m; };
  const umsg = t => { const m = document.createElement("div"); m.className = "vy-msg vy-me"; m.setAttribute("dir", "auto"); m.textContent = t; box.appendChild(m); return m; };
  const typing = () => { const m = document.createElement("div"); m.className = "vy-msg vy-typing"; m.innerHTML = "<i></i><i></i><i></i>"; box.appendChild(m); m.scrollIntoView({block: "nearest", behavior: "smooth"}); return m; };
  const errMsg = e => { const m = bmsg(`😶 ${esc(aiErr(e))}`); if ((e && e.code === "not_signed_in") || (needLogin() && !(e && e.code === "no_lifebuoys"))){ m.insertAdjacentHTML("beforeend", `<div class="vy-chips"><button class="vy-chip hot" data-vylogin>${esc(T("登录", "Sign in"))}</button></div>`); m.querySelector("[data-vylogin]").onclick = () => { closeSheet(); try { H().login(); } catch(x){} }; }
    if (e && e.code === "no_lifebuoys" && lbRow()){ m.insertAdjacentHTML("beforeend", `<div class="vy-chips"><button class="vy-chip hot" data-vylb>${esc(T("去「我的救生圈」", "Go to My lifebuoys"))}</button></div>`); m.querySelector("[data-vylb]").onclick = () => { closeSheet(true); location.hash = "#me"; setTimeout(() => { const b = document.getElementById("meLb"); if (b){ b.scrollIntoView({block: "center"}); b.click(); } }, 600); }; } };
  const input = (ph, onSend) => { const w = document.createElement("div"); w.className = "vy-in"; w.innerHTML = `<textarea rows="2" dir="auto" maxlength="200" placeholder="${esc(ph)}"></textarea><button class="vy-chip hot">${esc(T("发给 Voyo", "Send to Voyo"))}</button>`; box.appendChild(w);
    const ta = w.querySelector("textarea"), b = w.querySelector("button"); setTimeout(() => ta.focus(), 50);
    const go = () => { const v = ta.value.trim(); if (!v) return; w.remove(); onSend(v); }; b.onclick = go; ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); go(); } }; return w; };
  const free = (task, ph) => { if (needLogin()){ errMsg({code: "not_signed_in"}); return; } if (freeUsed() >= FREE_MAX){ bmsg(esc(T("今天先到这儿，明天再来。", "That's enough for today — come back tomorrow."))); return; }
    input(ph, async v => { umsg(v); const c = careHit(v); if (c){ box.insertAdjacentHTML("beforeend", careHTML(c)); return; }
      const tp = typing(); let j = null; try { j = await ask([{role: "user", content: v}], "free", task); freeAdd(); } catch(e){ tp.remove(); errMsg(e); return; } tp.remove();
      if (j.care){ box.insertAdjacentHTML("beforeend", careHTML("self")); return; }
      if (task === "how"){ if (!j.say){ errMsg({}); return; } const m = bmsg(`${esc(T("这么说：", "Like this:"))}<span class="vy-tl">${sayable(j.say, j.pron || "", LGV())}</span>${j.note ? `<small>${esc(j.note)}</small>` : ""}<div class="vy-nudge">${esc(T("跟着说一遍？", "Say it once with me?"))}</div><div data-vyaimic>${A() ? A().micHTML({hint: T("点一下或按住说", "Tap or hold to speak")}) : ""}</div>`);
        say(j.say, LGV()); const mb = m.querySelector(".ak-mic"); if (mb && A()) A().mic(mb, {want: j.say, l: LGV(), onDone: () => { m.insertAdjacentHTML("beforeend", `<div class="vy-ok">${esc(T("听到了。", "Got it."))}</div>`); sparks(m, 12); }}); }
      else { const better = j.better && j.better.t ? j.better : null;
        const m = bmsg(`${esc(j.reply || T("我听懂了！", "I understood you!"))}${better ? `<div class="vy-fine2">${esc(T("这样说，别人更容易懂：", "Said this way, it's easier to understand:"))}</div><span class="vy-tl">${sayable(better.t, better.pron || "", LGV())}</span>` : ""}
          <div class="vy-chips">${better && aiFn() ? `<button class="vy-chip" data-vywhy>${esc(T("细细说说为什么", "Tell me more"))}<em>🛟 1</em></button>` : ""}<button class="vy-chip" data-vyask>${esc(T("想找人聊", "Who could I chat with?"))}</button></div>`);
        if (better) say(better.t, LGV());
        const wb = m.querySelector("[data-vywhy]"); if (wb) wb.onclick = () => { wb.disabled = true; spend(() => why(v, better.t)); };
        m.querySelector("[data-vyask]").onclick = who; } }); };
  // 先说清楚要扣 1 个 🛟，点了「好」才扣（扣法跟岛上和 NPC 聊天一样：云函数 chat 档，一段只在第一句扣，出错退回）
  const spend = go => { if (!navigator.onLine){ errMsg({name: "TypeError"}); return; } if (needLogin()){ errMsg({code: "not_signed_in"}); return; } const n = lbN();
    const m = bmsg(`${esc(n != null ? TN("这个要用 1 个 🛟（你还有 {n} 个）。", "This uses 1 🛟 (you have {n}).", n) : T("这个要用 1 个 🛟。", "This uses 1 🛟."))}<div class="vy-chips"><button class="vy-chip hot" data-ok>${esc(T("好，用 1 个 🛟", "OK, use 1 🛟"))}</button><button class="vy-chip" data-no>${esc(T("先不了", "Not now"))}</button></div>`);
    m.querySelector("[data-ok]").onclick = () => { m.querySelector(".vy-chips").remove(); go(); }; m.querySelector("[data-no]").onclick = () => { m.querySelector(".vy-chips").remove(); m.insertAdjacentHTML("beforeend", `<div>${esc(T("好。", "Okay."))}</div>`); }; };
  async function why(orig, better){ const tp = typing(); let j = null;
    try { j = await ask([{role: "user", content: `First way (the learner's): ${orig}\nSecond way: ${better}`}], "chat", "why"); } catch(e){ tp.remove(); errMsg(e); return; } tp.remove();
    if (j.care){ box.insertAdjacentHTML("beforeend", careHTML("self")); return; } bmsg(`<small class="vy-cost">🛟 1</small>${esc(j.why || "")}`); }
  function who(){ bmsg(`${esc(T("朋友页的人每天都在发动态，回一句就是开始聊；今天的「你那边呢」也有人在答。", "People in Friends post every day — reply to one and you're chatting. People are also answering today's \"How About Yours?\"."))}<div class="vy-chips"><button class="vy-chip hot" data-go="people">${esc(T("去朋友页", "Go to Friends"))}</button>${window.HOWABOUT ? `<button class="vy-chip" data-go="ha">${esc(T("去「你那边呢」", "Go to How About Yours?"))}</button>` : ""}</div>`).querySelectorAll("[data-go]").forEach(b => b.onclick = () => { closeSheet(true); if (b.dataset.go === "ha") window.HOWABOUT.open(); else location.hash = "#people"; }); }
  function deep(){ spend(() => { const S0 = {msgs: [{role: "user", content: "(The learner just opened a chat with you. Greet them in one short line and ask one simple question about their day.)"}], turns: 0, over: false, busy: false};
    const log = document.createElement("div"); log.className = "vy-chat"; box.appendChild(log);
    const say1 = j => { const m = document.createElement("div"); m.className = "vy-msg"; m.innerHTML = `<span class="vy-tl">${sayable(j.say, "", LGV())}</span>${j.mean ? `<small dir="auto">${esc(j.mean)}</small>` : ""}`; log.appendChild(m); m.scrollIntoView({block: "nearest", behavior: "smooth"}); say(j.say, LGV()); };
    const bar = document.createElement("div"); bar.className = "vy-in"; bar.innerHTML = `<textarea rows="1" dir="auto" maxlength="200" placeholder="${esc(T("说你在学的语言，说不出来用母语也行", "Use the language you're learning — or your own if you get stuck"))}"></textarea><button class="vy-chip hot">${esc(T("发送", "Send"))}</button><button class="vy-chip" data-end>${esc(T("就聊到这", "That's enough"))}</button>`;
    const turn = async () => { S0.busy = true; const tp = typing(); let j = null; try { j = await ask(S0.msgs, "chat", "chat"); } catch(e){ tp.remove(); S0.busy = false;
        if (e && e.code === "chat_ended"){ S0.over = true; bar.remove(); const m = bmsg(esc(aiErr(e)) + `<div class="vy-chips"><button class="vy-chip hot" data-again>${esc(T("重新开始", "Start again"))}<em>🛟 1</em></button></div>`); m.querySelector("[data-again]").onclick = ev => { ev.currentTarget.disabled = true; deep(); }; return; }
        errMsg(e); if (S0.msgs.length > 1 && S0.msgs[S0.msgs.length - 1].role === "user") S0.msgs.pop(); return; }
      tp.remove(); S0.busy = false; if (j.care){ log.insertAdjacentHTML("beforeend", careHTML("self")); end(); return; } if (!j.say){ errMsg({}); return; }
      S0.msgs.push({role: "assistant", content: JSON.stringify(j)}); say1(j); if (!bar.isConnected) box.appendChild(bar); if (j.end || S0.turns >= 10) end(); };
    const end = () => { S0.over = true; bar.remove(); bmsg(esc(T("好，今天聊到这。我回船头啦。", "Okay, that's it for today. I'll be at the bow."))); };
    const send = () => { const ta = bar.querySelector("textarea"), v = ta.value.trim(); if (!v || S0.busy || S0.over) return; ta.value = ""; const u = document.createElement("div"); u.className = "vy-msg vy-me"; u.setAttribute("dir", "auto"); u.textContent = v; log.appendChild(u);
      const c = careHit(v); if (c){ log.insertAdjacentHTML("beforeend", careHTML(c)); end(); return; } S0.turns++; S0.msgs.push({role: "user", content: v}); turn(); };
    bar.querySelector("button.hot").onclick = send; bar.querySelector("textarea").onkeydown = e => { if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); send(); } }; bar.querySelector("[data-end]").onclick = end;
    log.insertAdjacentHTML("beforeend", `<small class="vy-cost">🛟 1 · ${esc(T("这一段只扣这一个", "only this one for the whole chat"))}</small>`); turn(); }); }
  root.querySelectorAll("[data-vyai]").forEach(b => b.onclick = () => { blip(700); const k = b.dataset.vyai; root.querySelectorAll(".vy-idle").forEach(x => x.remove());
    if (k === "who") return who(); if (k === "deep"){ if (!aiFn()) return; return deep(); }
    if (k === "how") return free("how", T("用你的母语打一句", "Type it in your own language"));
    if (k === "check") return free("check", T("用你在学的语言写一句", "Write a line in the language you're learning")); }); }

// ══════════ 「我」页：改兴趣 ══════════
function editInts(){ if (window.WELCOME && WELCOME.can()){ WELCOME.picker(() => { refresh(); try { document.dispatchEvent(new CustomEvent("hv:me-refresh")); } catch(e){} }); return; }
  // 迎新那边还没有你在学的语言：用同一排泡泡，在这里选
  mount(); const L = INTS(), I = new Set(ints() || []), sel = new Set(L.filter(x => x.isles.every(k => I.has(k))).map(x => x.id));
  const w = document.createElement("div"); w.className = "vy-pick"; w.dataset.nopy = ""; w.setAttribute("dir", UIL() === "ar" ? "rtl" : "ltr");
  const draw = () => { w.innerHTML = `<div class="vy-pk"><h3>${esc(T("你平时爱看什么？", "What do you like to watch and read about?"))}</h3><small>${esc(T("选一到三个，以后多给你看这些。", "Pick one to three. We'll show you more of these."))}</small>
    <div class="vy-bubs">${L.map(x => `<button class="vy-bb${sel.has(x.id) ? " on" : ""}" data-id="${x.id}"><i>${x.e}</i><b>${esc(intLbl(x))}</b></button>`).join("")}</div>
    <div class="vy-chips"><button class="vy-cta" data-ok>${esc(T("好了", "Done"))}</button><button class="vy-cta ghost" data-no>${esc(T("算了", "Cancel"))}</button></div></div>`;
    w.querySelectorAll(".vy-bb").forEach(b => b.onclick = () => { const id = b.dataset.id; if (sel.has(id)) sel.delete(id); else if (sel.size < 3) sel.add(id); else { try { A() && A().toast(T("最多三个，先放下一个再选。", "Up to three. Put one down first.")); } catch(e){} return; } blip(880); draw(); });
    w.querySelector("[data-ok]").onclick = () => { ls("hv.interests", [...new Set(L.filter(x => sel.has(x.id)).flatMap(x => x.isles))]); mark("hv.interests"); w.remove(); refresh(); try { document.dispatchEvent(new CustomEvent("hv:me-refresh")); } catch(e){} };
    w.querySelector("[data-no]").onclick = () => w.remove(); };
  draw(); document.body.appendChild(w); }
const meRow = () => { const lk = likesTxt(); return `<button class="me2-set" id="meInts"><i>👀</i><span>${esc(T("我爱看的", "What I'm into"))}<small>${esc(lk || T("还没选，点这里选一到三个", "Not picked yet — tap to pick one to three"))}</small></span><em>›</em></button>`; };

// ══════════ 接进「今天」页 ══════════
// 老用户（这台手机上已经有学习记录）不再走迎新和见面，Voyo 直接待在角落
const OLD_KEYS = ["practice.v1", "ty.v1", "act.v1", "howabout.v1", "hv.prefs", "words:done", "stickerStamps2", "deep.v1", "wb.v1"];
const isOld = () => { try { return OLD_KEYS.some(k => localStorage.getItem(k) != null); } catch(e){ return false; } };
let STARTING = false;
// 账号里有没有记录：迎新做过、见过 Voyo、选过兴趣，或者有学习记录
const hasRecord = () => isOld() || ls("wel.v1") != null || ls("hv.interests") != null || !!(ls("voyo.v1") || {}).met;
// 这台手机上有登录过的痕迹（Supabase 存的登录）：老用户换了新手机，先等同步回来（最多 3 秒）再决定要不要出迎新
const maybeLogged = () => { try { return Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)); } catch(e){ return false; } };
function waitSync(){ return new Promise(ok => { if (!maybeLogged()) return ok(); const t0 = Date.now(); const tick = () => { if (H().synced || Date.now() - t0 > 3000) return ok(); setTimeout(tick, 150); }; tick(); }); }
async function after(box, isToday){ if (!isToday || !box) return; let o = ST();
  if (o.met){ corner(box); return; }
  if (STARTING) return;
  STARTING = true;
  if (!hasRecord()) await waitSync();
  o = ST();
  if (o.met || isOld()){ if (!o.met){ o.met = "old"; SAVE(o); } STARTING = false; const b = document.getElementById("boatPg"); if (b && !b.hidden) corner(b); return; }
  const go = () => meet(() => { STARTING = false; });
  if (window.WELCOME && WELCOME.can() && WELCOME.need()) WELCOME.open(() => go()); else go(); }

// ── 样式 ──
function mount(){ if (document.getElementById("vyCss")) return; const s = document.createElement("style"); s.id = "vyCss"; s.textContent = CSSV; document.head.appendChild(s); }
const CSSV = `.vy-ph{display:inline-grid;place-items:center;border-radius:50%;background:#fffdf6;border:2.5px dashed #b9a57a;line-height:1;box-sizing:border-box;flex:none;user-select:none}.vy-art{display:block;width:auto}
.vy-spk{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:4000}.vy-note{position:fixed;pointer-events:none;z-index:4000;font:900 16px Georgia;color:#e2552f;animation:vyup .8s forwards}@keyframes vyup{to{transform:translateY(-36px);opacity:0}}
.vy-meet{position:fixed;inset:0;z-index:3000;background:#ece4d3;display:flex;align-items:center;justify-content:center;padding:16px;font:15px/1.55 -apple-system,"PingFang SC","Helvetica Neue",sans-serif;color:#24303a}
body.vy-meet-on{overflow:hidden}body.vy-meet-on #galTabs{display:none!important}
.vy-meet button{font-family:inherit;cursor:pointer;color:inherit}
.vy-mph{position:relative;width:100%;max-width:430px;height:min(820px,100%);border-radius:30px;overflow:hidden;box-shadow:0 12px 34px rgba(20,48,92,.2);background:linear-gradient(#f6f1e4 0%,#eef3f3 46%,#cfe3ef 46%,#b3d2e6 100%)}
@media(max-width:700px){.vy-meet{padding:0}.vy-mph{max-width:none;height:100%;border-radius:0;box-shadow:none}}
.vy-mtop{padding:calc(16px + env(safe-area-inset-top,0px)) 16px 0;min-height:150px;position:relative;z-index:4}
.vy-bub{background:#fff;border-radius:18px;padding:11px 14px;box-shadow:0 4px 14px rgba(20,48,92,.12);font-size:14.5px;line-height:1.5;color:#2b3440;position:relative;animation:vypop .35s cubic-bezier(.3,1.6,.6,1);overflow:hidden}
@keyframes vypop{from{transform:scale(.6);opacity:0}}
.vy-bf{float:left;margin:-2px 10px 2px -2px}[dir=rtl] .vy-bf{float:right;margin:-2px -2px 2px 10px}
.vy-tl{display:block;margin-top:6px;font:700 17px/1.45 "Noto Serif SC",Georgia,serif;color:#e2552f}
.vy-boat{position:absolute;left:6%;right:6%;bottom:24%;aspect-ratio:240/190;z-index:2;transition:transform .6s cubic-bezier(.4,1.2,.5,1)}.vy-boat.low{transform:translateY(40%) scale(.45)}
.vy-boat>svg{width:100%;height:100%;display:block;overflow:visible}.vy-boat.wig>svg{animation:vywig 1.2s ease-in-out infinite}@keyframes vywig{25%{transform:rotate(-1.5deg)}75%{transform:rotate(1.5deg)}}
.vy-actor{position:absolute;transition:left .7s cubic-bezier(.5,1.4,.5,1),top .7s cubic-bezier(.5,1.4,.5,1),opacity .4s;z-index:3;cursor:pointer}.vy-actor.hide{opacity:0;pointer-events:none}
.vy-actor .in,.vy-corner .in{display:block;animation:vybob 3.2s ease-in-out infinite}@keyframes vybob{50%{transform:translateY(-4px)}}
.vy-dots{position:absolute;left:calc(34% + 20px);top:38%;font:900 22px Georgia;color:#14305c;letter-spacing:2px;animation:vyblink 1.2s infinite;z-index:3}@keyframes vyblink{50%{opacity:.2}}
.vy-mbot{position:absolute;left:0;right:0;bottom:0;padding:12px 14px calc(16px + env(safe-area-inset-bottom,0px));z-index:5}
.vy-cta{display:block;width:100%;border:0;border-radius:99px;padding:13px;background:#e2552f;color:#fff!important;font-weight:900;font-size:15px;box-shadow:0 6px 16px rgba(226,85,47,.35);cursor:pointer;font-family:inherit}.vy-cta.ink{background:#14305c;box-shadow:0 6px 16px rgba(20,48,92,.3)}.vy-cta.ghost{background:#fff;color:#14305c!important;box-shadow:0 2px 8px rgba(20,48,92,.12);margin-top:8px}
.vy-cap{text-align:center;color:#4b5a70;font-size:13px;margin-bottom:8px}
.vy-float{position:absolute;left:0;right:0;top:150px;bottom:150px;z-index:4;display:none;padding:0 10px;overflow:auto}.vy-float.on{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 4px;align-content:start}
.vy-fl{border:0;background:none;padding:2px 0;display:flex;flex-direction:column;align-items:center;gap:1px;animation:vybob 2.8s ease-in-out infinite;transition:transform .35s,opacity .35s}
.vy-fl .vy-bt{width:44px;height:44px;border-radius:50%;background:#fffdf7;box-shadow:0 3px 0 rgba(20,48,92,.12),0 6px 12px rgba(20,48,92,.12);display:flex;align-items:center;justify-content:center;font-size:23px;border:2px solid #fff}
.vy-fl b{font-size:11.5px;color:#14305c;line-height:1.15;text-align:center}.vy-fl small{font:700 11px "Noto Serif SC",Georgia,serif;color:#e2552f;line-height:1.1}.vy-fl.got{opacity:0;transform:translateY(120px) scale(.3);pointer-events:none}
.vy-cargo{position:absolute;z-index:4;display:flex;gap:2px;font-size:17px;left:38%;top:60%}.vy-cargo i{font-style:normal}
.vy-lvls{display:flex;flex-direction:column;gap:8px}.vy-lvb{border:2px solid transparent;background:#fff;border-radius:16px 16px 16px 4px;padding:9px 12px;text-align:start;box-shadow:0 3px 10px rgba(20,48,92,.1)}.vy-lvb.on{border-color:#e2552f}
.vy-lvb .z{display:block;font:700 16px/1.4 "Noto Serif SC",Georgia,serif;color:#14305c}.vy-lvb .p{display:block;font-size:11.5px;color:#8a8f9c}.vy-lvb .l{float:right;font-size:11px;font-weight:800;color:#6b7488;background:#f4efe3;border-radius:99px;padding:1px 8px;margin-inline-start:6px}[dir=rtl] .vy-lvb .l{float:left}
.vy-lang{display:inline-flex;gap:6px;align-items:center;background:#fff;border-radius:99px;padding:3px 10px;font-size:12px;color:#6b7488;margin-bottom:8px;border:1px solid #e6dfcf}.vy-lang b{color:#14305c}
.vy-nb{background:#fffdf6;border-radius:6px;padding:12px 14px 12px 22px;box-shadow:0 6px 18px rgba(40,25,10,.18);transform:rotate(-1.5deg);position:relative;font-size:14px;color:#3d3220;background-image:repeating-linear-gradient(transparent 0 25px,#ece2cc 25px 26px);line-height:26px;animation:vypop .4s}
.vy-nb h4{margin:0;font:900 15px/26px "Noto Serif SC",Georgia,serif;color:#14305c}.vy-nb .w{color:#e2552f;font-weight:800}.vy-nb .sm{font-size:12.5px;color:#8a7a4e}
.vy-stamp{position:absolute;right:8px;top:-14px;border:3px solid #e2552f;color:#e2552f;border-radius:10px;padding:2px 10px;font:900 15px/1.3 Georgia,"Noto Serif SC",serif;transform:rotate(9deg);background:rgba(255,253,246,.9);letter-spacing:.06em}.vy-stamp.drop{animation:vystamp .45s cubic-bezier(.3,1.6,.5,1)}@keyframes vystamp{from{transform:rotate(9deg) scale(2.4);opacity:0}}
.vy-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}.vy-top b{font-size:20px;color:#14305c}
.vy-corner{all:unset;cursor:pointer;line-height:0;flex:none;border-radius:50%}
.vy-corner.alert .in{animation:vywig 1s ease-in-out infinite}.vy-corner:focus-visible{outline:3px solid #2f6fe0}
.vy-raise{background:#fffdf6;border-radius:16px;padding:10px 10px 10px 12px;box-shadow:0 2px 10px rgba(20,48,92,.08);font-size:14px;border:1.5px solid #efe2c4;line-height:1.45;display:flex;gap:10px;align-items:center;animation:vypop .35s cubic-bezier(.3,1.6,.6,1);color:#24303a;margin:0 0 14px}
.dm-top+.vy-raise{margin:4px 0 16px}
.vy-rf{flex:none;line-height:0}.vy-rt{flex:1;min-width:0;cursor:pointer}.vy-rt .vy-ask{box-shadow:none;margin:0;padding:0;background:none;cursor:default}.vy-rt .vy-chips{margin-top:4px}
.vy-rx{border:0;background:#f1ece0;border-radius:50%;width:28px;height:28px;color:#14305c;flex:none;cursor:pointer;font-size:13px}
.vy-ask{background:#fff;border-radius:16px;padding:12px;box-shadow:0 4px 14px rgba(20,48,92,.12);margin-top:10px;font-size:14px}
.vy-mini{display:inline-block;background:#fffdf3;padding:4px 8px;font:700 13px "Noto Serif SC",Georgia,serif;color:#e2552f;transform:rotate(-2deg);box-shadow:0 2px 6px rgba(40,25,10,.15);margin:6px 0}
.vy-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.vy-chip{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:6px 11px;font-size:13px;font-weight:700;color:#14305c;cursor:pointer;font-family:inherit}.vy-chip.hot{background:#e2552f;border-color:#e2552f;color:#fff}.vy-chip em{font-style:normal;font-size:11px;color:#6b7488;margin-inline-start:4px}
.vy-sheet{position:fixed;inset:0;z-index:2500;pointer-events:none;color:#24303a;font-family:-apple-system,"PingFang SC","Helvetica Neue",sans-serif}
.vy-sbg{position:absolute;inset:0;background:rgba(20,48,92,.18);opacity:0;transition:opacity .3s}.vy-sheet.on .vy-sbg{opacity:1;pointer-events:auto}
.vy-sp{position:absolute;left:0;right:0;bottom:0;max-height:86%;background:#fffdf7;border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(20,48,92,.22);transform:translateY(105%);transition:transform .38s cubic-bezier(.3,1.2,.5,1);display:flex;flex-direction:column;pointer-events:auto;padding-bottom:env(safe-area-inset-bottom,0px)}
@media(min-width:701px){.vy-sp{left:auto;right:24px;bottom:24px;width:420px;max-height:min(720px,calc(100% - 48px));border-radius:22px}}
.vy-sheet.on .vy-sp{transform:none}
.vy-shd{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;border-bottom:1px solid #e6dfcf}.vy-shd b{color:#14305c;font:900 16px Georgia,"Noto Serif SC",serif}.vy-shd small{display:block;color:#6b7488;font-size:11.5px}.vy-shd .sp{flex:1}
.vy-x{border:0;background:#f1ece0;border-radius:50%;width:30px;height:30px;color:#14305c;flex:none;cursor:pointer}
.vy-sbody{flex:1;overflow-y:auto;padding:10px 14px 14px;-webkit-overflow-scrolling:touch}.vy-sfoot{padding:8px 14px 14px}
.vy-msg{background:#fff;box-shadow:0 2px 8px rgba(20,48,92,.08);border-radius:16px;border-end-start-radius:4px;padding:9px 12px;margin:8px 0;font-size:14px;line-height:1.5;max-width:94%}.vy-msg small{display:block;font-size:12.5px;color:#6b7488;margin-top:4px}
.vy-held{background:#fff6e8;border:1.5px dashed #efcf94;border-radius:14px;padding:8px 10px;font-size:13.5px}.vy-held small{color:#8a6a2c;font-weight:700}
.vy-dr{display:flex;gap:12px;align-items:stretch;background:#fff;border-radius:16px;padding:10px;margin-top:10px;box-shadow:0 2px 10px rgba(20,48,92,.08);cursor:pointer;border:2px solid transparent;text-align:start;width:100%;font:inherit;color:inherit}.vy-dr.cur{border-color:#e2552f}
.vy-dfr{width:54px;height:72px;flex:none;border-radius:27px 27px 4px 4px;background:#e9dfc8;position:relative;perspective:220px;overflow:hidden;box-shadow:inset 0 0 0 3px #c8962e;display:grid;place-items:center}.vy-dfr .em{font-size:26px}
.vy-leaf{position:absolute;inset:3px 3px 0;border-radius:24px 24px 2px 2px;background:linear-gradient(90deg,#2d5a8c,#14305c);transform-origin:left center;transition:transform .9s cubic-bezier(.4,1.3,.5,1);display:flex;align-items:center;justify-content:flex-end;padding-right:7px}.vy-leaf:after{content:"";width:6px;height:6px;border-radius:50%;background:#ffc861}.vy-dr.open .vy-leaf{transform:rotateY(-105deg)}
.vy-dtx{flex:1;min-width:0;font-size:13.5px;color:#3d4655;line-height:1.45}.vy-dtx b{display:block;color:#14305c;font-size:14.5px}.vy-dtx .st{display:inline-block;margin-top:4px;font-size:11px;font-weight:800;border-radius:99px;padding:1px 8px;background:#f4efe3;color:#6b7488}.vy-dr.open .vy-dtx .st{background:#e6f1ef;color:#2f7d70}
.vy-knock,.vy-reply{background:#fffdf7;border-radius:16px;padding:12px;margin-top:10px;box-shadow:0 4px 14px rgba(20,48,92,.12);animation:vypop .3s;position:relative}.vy-knock .k{font-size:11px;font-weight:800;color:#6b7488;letter-spacing:.05em}.vy-knock .mn,.vy-slip .mn{display:block;font-size:12.5px;color:#6b7488}
.vy-nudge{font-size:12px;color:#2f7d70;margin-top:4px}
.vy-quiet{margin-top:8px;font-size:12.5px;color:#6b7488}.vy-quiet button{border:0;background:none;color:#2c64b8;font-weight:700;padding:2px 4px;text-decoration:underline;font-size:12.5px;cursor:pointer;font-family:inherit}
.vy-wtiles{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.vy-wt{border:1.5px solid #e6dfcf;background:#fff;border-radius:10px;padding:5px 10px;font:700 15px "Noto Serif SC",Georgia,serif;color:#14305c;cursor:pointer}.vy-wt.used{opacity:.25;pointer-events:none}.vy-wt.shk{animation:vywig .4s}
.vy-wline{min-height:30px;margin-top:8px;padding:4px 8px;border-bottom:2px dashed #e3d7bd;font:700 16px "Noto Serif SC",Georgia,serif;color:#e2552f}
.vy-reply .vy-stamp{top:-10px;right:10px}.vy-kind{font-size:12px;color:#6b7488;font-weight:700}.vy-ttl{display:block;color:#14305c;font-size:15.5px;margin-top:2px}.vy-said{margin-top:8px;border-top:1px dashed #e6dfcf;padding-top:6px}.vy-said small{font-size:11.5px;color:#6b7488}
.vy-in{display:flex;gap:6px;align-items:flex-end;margin:8px 0;flex-wrap:wrap}.vy-in textarea{flex:1;min-width:0;font:inherit;font-size:14.5px;border:1.5px solid #e6dfcf;border-radius:12px;padding:7px 10px;resize:none;background:#fff;color:#24303a}
.vy-me{margin-inline-start:auto;background:#14305c;color:#fff;border-end-start-radius:16px;border-end-end-radius:4px}.vy-typing i{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#b9a57a;animation:vyblink 1s infinite}.vy-typing i:nth-child(2){animation-delay:.2s}.vy-typing i:nth-child(3){animation-delay:.4s}
.vy-care{background:#fff4ee;border:1.5px solid #f3c9b8}.vy-cost{display:block;font-size:11px;color:#8a6a2c;font-weight:700;margin:6px 0 2px}.vy-fine2{font-size:12.5px;color:#2f7d70;margin-top:6px;font-weight:700}.vy-chat{margin-top:6px}
.vy-old summary{cursor:pointer;font-size:13px;color:#6b7488;font-weight:700;margin-top:12px}
.vy-ok{color:#2f7d70;font-weight:800;margin-top:6px}
.vy-pbub{display:flex;gap:10px;align-items:flex-end}.vy-pbub .vy-msg{flex:1}
.vy-slip{background:#fffdf3;border-radius:3px;padding:16px 16px 14px;margin:18px 4px 0;box-shadow:0 8px 22px rgba(40,25,10,.2);transform:rotate(-2deg);position:relative;animation:vyslip .7s cubic-bezier(.3,1.4,.5,1)}
.vy-slip:before{content:"";position:absolute;left:50%;top:-9px;width:64px;height:18px;margin-left:-32px;background:rgba(255,200,97,.55);transform:rotate(3deg)}
@keyframes vyslip{from{transform:translate(60px,-40px) rotate(12deg) scale(.6);opacity:0}}
.vy-slip .h{font:900 13px Georgia,"Noto Serif SC",serif;color:#a87924;letter-spacing:.08em}.vy-slip .vy-tl{font-size:20px}
.vy-ways{display:flex;flex-direction:column;gap:6px;margin-top:12px}.vy-way{border:1.5px solid #e6dfcf;background:#fff;border-radius:12px;padding:8px 10px;text-align:start;font-size:13.5px;color:#14305c;font-weight:700;display:flex;gap:8px;align-items:center;cursor:pointer;font-family:inherit}.vy-way .e{font-size:20px}.vy-way small{display:block;font-weight:500;color:#6b7488;font-size:12px}.vy-way.on{border-color:#e2552f;background:#fff6f1}
.vy-fine{font-size:12px;color:#8a7a4e;margin-top:8px}
.vy-slip.fold{animation:vyfold .7s forwards}@keyframes vyfold{to{transform:translateY(160px) rotate(8deg) scale(.2);opacity:0}}
.vy-pick{position:fixed;inset:0;z-index:3000;background:rgba(20,48,92,.25);display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,"PingFang SC",sans-serif}
.vy-pk{background:#fbf7ee;border-radius:22px;padding:16px;max-width:420px;width:100%;box-shadow:0 12px 34px rgba(20,48,92,.25)}.vy-pk h3{margin:0;color:#14305c}.vy-pk>small{color:#6b7488}
.vy-bubs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.vy-bb{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:5px 12px 5px 6px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font:inherit;color:#14305c}.vy-bb i{font-style:normal;font-size:18px}.vy-bb.on{background:#fff3c4;border-color:#f0b93a}`;

// 西、日、阿（按英文原文找）。2026-11-12 工程师写的，上线前请母语的人看一遍
const V18 = {
"Good morning": {es: "Buenos días", ja: "おはよう", ar: "صباح الخير"},
"Good afternoon": {es: "Buenas tardes", ja: "こんにちは", ar: "مساء الخير"},
"Good evening": {es: "Buenas noches", ja: "こんばんは", ar: "مساء الخير"},
"Not enough 🛟.": {es: "No tienes suficientes 🛟.", ja: "🛟 が足りないよ。", ar: "لا تكفي 🛟."},
"This chat has ended. Start a new one?": {es: "Esta charla ya terminó. ¿Empezamos otra?", ja: "このおしゃべりはもう終わったよ。新しく始める？", ar: "انتهت هذه المحادثة. هل نبدأ واحدة جديدة؟"},
"Start again": {es: "Empezar otra vez", ja: "もう一度始める", ar: "ابدأ من جديد"},
"Something you're into is here today. Want a look?": {es: "Hoy hay algo de lo que te gusta. ¿Le echas un vistazo?", ja: "今日はきみの好きなことがあるよ。見てみる？", ar: "هناك اليوم شيء مما تحب. هل تلقي نظرة؟"},
"Find a free helpline in your country: ": {es: "Busca una línea de ayuda gratuita en tu país: ", ja: "住んでいる国の無料の相談窓口を探せます：", ar: "ابحث عن خط مساعدة مجاني في بلدك: "},
"If someone is hurting you: it is not your fault. Please tell someone you trust, or contact local support services. If you are in danger, call your local emergency number now.": {es: "Si alguien te está haciendo daño: no es tu culpa. Cuéntaselo a alguien de confianza o contacta con un servicio de ayuda de tu zona. Si estás en peligro, llama ahora al número de emergencias.", ja: "だれかに傷つけられているなら、それはきみのせいじゃない。信頼できる人に話すか、地域の支援窓口に連絡してください。危ないときは、すぐに地域の緊急番号に電話してください。", ar: "إن كان أحد يؤذيك: هذا ليس ذنبك. أخبر شخصاً تثق به، أو تواصل مع جهة دعم محلية. وإن كنت في خطر، فاتصل الآن برقم الطوارئ المحلي."},
"Not enough 🛟 — nothing was used this time. You can get more in Me → My lifebuoys.": {es: "No tienes suficientes 🛟; esta vez no se gastó nada. Puedes conseguir más en Yo → Mis salvavidas.", ja: "🛟 が足りないよ。今回は使っていないよ。「わたし」→「救命浮き輪」でもらえるよ。", ar: "لا تكفي 🛟 — لم يُستخدم شيء هذه المرة. يمكنك الحصول على المزيد من «أنا» ← «أطواق النجاة»."},
"Sign in to use this.": {es: "Inicia sesión para usarlo.", ja: "ログインすると使えるよ。", ar: "سجّل الدخول لتستخدم هذا."},
"Go to My lifebuoys": {es: "Ir a Mis salvavidas", ja: "「救命浮き輪」へ", ar: "اذهب إلى أطواق النجاة"},
"Let's leave the language for now. What you said matters.": {es: "Dejemos el idioma por ahora. Lo que dijiste importa.", ja: "言葉の練習はいったん置いておこう。きみが言ったこと、大事だよ。", ar: "لنترك اللغة جانباً الآن. ما قلته مهم."},
"If you're thinking about hurting yourself, please talk to someone you trust, or a local crisis line, today.": {es: "Si estás pensando en hacerte daño, habla hoy mismo con alguien de confianza o llama a una línea de ayuda de tu zona.", ja: "自分を傷つけたい気持ちがあるなら、今日のうちに信頼できる人か、地域の相談窓口に話してください。", ar: "إن كنت تفكر في إيذاء نفسك، فتحدّث اليوم مع شخص تثق به، أو اتصل بخط مساعدة محلي."},
"If someone is hurting you, please tell someone you trust, or contact local support services.": {es: "Si alguien te está haciendo daño, cuéntaselo a alguien de confianza o contacta con un servicio de ayuda de tu zona.", ja: "だれかに傷つけられているなら、信頼できる人に話すか、地域の支援窓口に連絡してください。", ar: "إن كان أحد يؤذيك، فأخبر شخصاً تثق به، أو تواصل مع جهة دعم محلية."},
"Looks like you're offline. Come find me when you're back online.": {es: "Parece que no tienes conexión. Búscame cuando vuelvas a tenerla.", ja: "ネットがつながっていないみたい。つながったら、また来てね。", ar: "يبدو أنك غير متصل. تعال إليّ حين يعود الاتصال."},
"That's enough for today — come back tomorrow.": {es: "Por hoy es suficiente; vuelve mañana.", ja: "今日はここまで。また明日ね。", ar: "يكفي لليوم، عُد غداً."},
"Not enough 🛟 — nothing was used this time.": {es: "No tienes suficientes 🛟; esta vez no se gastó nada.", ja: "🛟 が足りないよ。今回は使っていないよ。", ar: "لا تكفي 🛟 — لم يُستخدم شيء هذه المرة."},
"Please sign in first.": {es: "Primero inicia sesión.", ja: "先にログインしてね。", ar: "سجّل الدخول أولاً."},
"I couldn't get an answer just now. Try again in a bit.": {es: "Ahora no me llegó la respuesta. Prueba otra vez en un rato.", ja: "いまは答えが届かなかった。少ししてからもう一度ためしてね。", ar: "لم يصلني جواب الآن. جرّب مرة أخرى بعد قليل."},
"How do I say…?": {es: "¿Cómo se dice…?", ja: "これ、なんて言う？", ar: "كيف أقول…؟"},
"free": {es: "gratis", ja: "無料", ar: "مجاناً"},
"Check this line for me": {es: "Mira esta frase", ja: "この文、見てくれる？", ar: "انظر في هذه الجملة"},
"Who could I chat with?": {es: "¿Con quién puedo hablar?", ja: "だれと話せる？", ar: "مع من يمكنني أن أتحدث؟"},
"Talk with me a bit longer": {es: "Charla un rato más conmigo", ja: "もう少しおしゃべりしよう", ar: "تحدّث معي قليلاً بعد"},
"Sign in": {es: "Iniciar sesión", ja: "ログイン", ar: "تسجيل الدخول"},
"Send to Voyo": {es: "Enviar a Voyo", ja: "Voyo に送る", ar: "أرسل إلى Voyo"},
"Like this:": {es: "Así:", ja: "こう言うよ：", ar: "هكذا:"},
"Say it once with me?": {es: "¿La dices una vez conmigo?", ja: "いっしょに一回言ってみる？", ar: "هل تقولها معي مرة؟"},
"I understood you!": {es: "¡Te entendí!", ja: "ちゃんと伝わったよ！", ar: "فهمتك!"},
"Said this way, it's easier to understand:": {es: "Dicha así, se entiende mejor:", ja: "こう言うと伝わりやすいよ：", ar: "إذا قلتها هكذا فهمك الناس أسهل:"},
"Tell me more": {es: "Cuéntame por qué", ja: "くわしく教えて", ar: "اشرح لي أكثر"},
"This uses 1 🛟 (you have {n}).": {es: "Esto usa 1 🛟 (tienes {n}).", ja: "これは 🛟 を1つ使うよ（いま {n} 個）。", ar: "هذا يستخدم 1 🛟 (لديك {n})."},
"This uses 1 🛟.": {es: "Esto usa 1 🛟.", ja: "これは 🛟 を1つ使うよ。", ar: "هذا يستخدم 1 🛟."},
"OK, use 1 🛟": {es: "Vale, usar 1 🛟", ja: "うん、🛟 を1つ使う", ar: "حسناً، استخدم 1 🛟"},
"Not now": {es: "Ahora no", ja: "今はやめておく", ar: "ليس الآن"},
"People in Friends post every day — reply to one and you're chatting. People are also answering today's \"How About Yours?\".": {es: "En Amigos la gente publica cada día: responde a alguien y ya estás charlando. También hay gente respondiendo el «¿Y por allá?» de hoy.", ja: "「友だち」ではみんな毎日投稿しているよ。ひとつに返事すれば、もうおしゃべりの始まり。今日の「そっちはどう？」にも答えている人がいるよ。", ar: "في «الأصدقاء» ينشر الناس كل يوم — ردّ على منشور وتبدأ المحادثة. وهناك من يجيب أيضاً عن «وعندك؟» اليوم."},
"Go to Friends": {es: "Ir a Amigos", ja: "「友だち」へ", ar: "اذهب إلى الأصدقاء"},
"Go to How About Yours?": {es: "Ir a «¿Y por allá?»", ja: "「そっちはどう？」へ", ar: "اذهب إلى «وعندك؟»"},
"Use the language you're learning — or your own if you get stuck": {es: "Usa el idioma que aprendes; si te atascas, el tuyo", ja: "勉強中の言葉で。つまったら自分の言葉でもいいよ", ar: "استخدم اللغة التي تتعلمها — أو لغتك إن تعثّرت"},
"Send": {es: "Enviar", ja: "送る", ar: "إرسال"},
"That's enough": {es: "Ya está", ja: "ここまでにする", ar: "يكفي"},
"Okay, that's it for today. I'll be at the bow.": {es: "Vale, por hoy ya está. Estaré en la proa.", ja: "うん、今日はここまで。船の先にいるね。", ar: "حسناً، يكفي لليوم. سأكون في مقدمة القارب."},
"only this one for the whole chat": {es: "solo este para toda la charla", ja: "このおしゃべり全体でこの1つだけ", ar: "واحدة فقط للمحادثة كلها"},
"Type it in your own language": {es: "Escríbelo en tu idioma", ja: "自分の言葉で書いてね", ar: "اكتبها بلغتك"},
"Write a line in the language you're learning": {es: "Escribe una frase en el idioma que aprendes", ja: "勉強中の言葉で一文書いてね", ar: "اكتب جملة باللغة التي تتعلمها"},
"Something's moving on your boat.": {es: "Algo se mueve en tu barco.", ja: "あなたの船で、何かが動いている。", ar: "هناك شيء يتحرك على قاربك."},
"Take a look": {es: "Mirar", ja: "見てみる", ar: "ألقِ نظرة"},
"Oh — hi! I'm Voyo. I'm from Antarctica. Antarctica belongs to no country — so I'm not on anyone's side. I just follow your boat around the world.": {es: "¡Ah, hola! Soy Voyo. Vengo de la Antártida. La Antártida no es de ningún país, así que no estoy del lado de nadie. Solo sigo tu barco por el mundo.", ja: "あ、こんにちは！ぼくは Voyo。南極から来たよ。南極はどの国のものでもないから、ぼくはだれの味方もしない。きみの船について、世界中を回るんだ。", ar: "آه، مرحباً! أنا Voyo. جئت من القارة القطبية الجنوبية. لا تنتمي القارة القطبية الجنوبية إلى أي بلد، لذلك لا أنحاز لأحد. أنا فقط أتبع قاربك حول العالم."},
"Hey, Voyo!": {es: "¡Hola, Voyo!", ja: "やあ、Voyo！", ar: "أهلاً يا Voyo!"},
"Quick one: whenever you've got a free moment, what do you love looking at? Fish out up to three.": {es: "Una pregunta: cuando tienes un rato libre, ¿qué te encanta mirar? Pesca hasta tres.", ja: "ちょっと聞かせて。ひまなとき、何を見るのが好き？ 3つまで釣り上げてね。", ar: "سؤال سريع: حين يكون لديك وقت فراغ، ما الذي تحب أن تشاهده؟ اصطد حتى ثلاثة."},
"That's me": {es: "Eso soy yo", ja: "これで全部", ar: "هذا أنا"},
"Skip for now": {es: "Ahora no", ja: "今はやめておく", ar: "ليس الآن"},
"Noted.": {es: "Apuntado.", ja: "メモしたよ。", ar: "سجّلتُ ذلك."},
"Boat's full!": {es: "¡El barco está lleno!", ja: "船がいっぱい！", ar: "امتلأ القارب!"},
"Chinese": {es: "chino", ja: "中国語", ar: "الصينية"},
"English": {es: "inglés", ja: "英語", ar: "الإنجليزية"},
"And your Chinese — which one could you say to a friend right now? Tap to hear.": {es: "¿Y tu chino? ¿Cuál de estas podrías decirle ahora mismo a un amigo? Toca para oírla.", ja: "きみの中国語は？ 今すぐ友だちに言えるのはどれ？ タップで聞けるよ。", ar: "وماذا عن صينيتك؟ أيّ جملة من هذه تستطيع أن تقولها لصديق الآن؟ اضغط لتسمع."},
"And your English — which one could you say to a friend right now? Tap to hear.": {es: "¿Y tu inglés? ¿Cuál de estas podrías decirle ahora mismo a un amigo? Toca para oírla.", ja: "きみの英語は？ 今すぐ友だちに言えるのはどれ？ タップで聞けるよ。", ar: "وماذا عن إنجليزيتك؟ أيّ جملة من هذه تستطيع أن تقولها لصديق الآن؟ اضغط لتسمع."},
"Learning": {es: "Aprendes", ja: "勉強中", ar: "تتعلّم"},
"Just started": {es: "Empiezo", ja: "始めたばかり", ar: "بدأت للتو"},
"Everyday chat": {es: "Charla diaria", ja: "日常会話", ar: "محادثة يومية"},
"Pretty fluent": {es: "Bastante fluido", ja: "わりと流暢", ar: "بطلاقة"},
"Perfect. We'll start from what you actually want to say.": {es: "Perfecto. Empezamos por lo que de verdad quieres decir.", ja: "ちょうどいい。きみが本当に言いたいことから始めよう。", ar: "ممتاز. سنبدأ مما تريد أن تقوله فعلاً."},
"Nice — you can already chat. Let's find people to chat with.": {es: "Genial, ya puedes charlar. Busquemos gente con quien hablar.", ja: "いいね、もう話せるんだ。話し相手を探しに行こう。", ar: "رائع، تستطيع أن تتحدث بالفعل. لنبحث عن أناس نتحدث معهم."},
"Oh, then you mostly need real people to talk to. I know a few.": {es: "Ah, entonces lo que te falta es gente real con quien hablar. Conozco a algunos.", ja: "じゃあ、足りないのは話せる相手だね。何人か知ってるよ。", ar: "إذن ما ينقصك هو أناس حقيقيون تتحدث معهم. أعرف بعضهم."},
"Yep, that's me": {es: "Sí, más o menos así", ja: "うん、だいたいこんな感じ", ar: "نعم، هكذا تقريباً"},
"Okay. Got it — I'll remember.": {es: "Vale. Entendido, lo recordaré.", ja: "わかった。覚えておくね。", ar: "حسناً، فهمت. سأتذكّر."},
"NOTED": {es: "APUNTADO", ja: "メモした", ar: "سُجِّل"},
"Voyo's notes": {es: "Notas de Voyo", ja: "Voyo のメモ", ar: "ملاحظات Voyo"},
"You like: ": {es: "Te gusta: ", ja: "好きなもの：", ar: "تحب: "},
"Chinese: ": {es: "Chino: ", ja: "中国語：", ar: "الصينية: "},
"English: ": {es: "Inglés: ", ja: "英語：", ar: "الإنجليزية: "},
"Anything off? Change it anytime in Me.": {es: "¿Algo no cuadra? Cámbialo cuando quieras en «Yo».", ja: "違っていたら、いつでも「わたし」で直せるよ。", ar: "هل هناك خطأ؟ غيّره متى شئت من «أنا»."},
"I'll be at the bow. Tap me whenever.": {es: "Estaré en la proa. Tócame cuando quieras.", ja: "船の先っぽにいるね。用があったらタップして。", ar: "سأكون في مقدمة القارب. اضغط عليّ متى شئت."},
"OK": {es: "Vale", ja: "OK", ar: "حسناً"},
"A person": {es: "Una persona", ja: "人", ar: "شخص"},
"A post": {es: "Una publicación", ja: "投稿", ar: "منشور"},
"On the map": {es: "En el mapa", ja: "地図の上", ar: "على الخريطة"},
"A clip": {es: "Un vídeo corto", ja: "短い動画", ar: "مقطع قصير"},
"How About Yours?": {es: "¿Y por allá?", ja: "そっちはどう？", ar: "وعندك؟"},
"An activity": {es: "Una actividad", ja: "アクティビティ", ar: "نشاط"},
"A word": {es: "Una palabra", ja: "ことば", ar: "كلمة"},
"A topic": {es: "Un tema", ja: "話題", ar: "موضوع"},
"Open · go back anytime": {es: "Abierta · vuelve cuando quieras", ja: "開いてる · いつでも戻れる", ar: "مفتوح · عُد متى شئت"},
"Say one line to open": {es: "Di una frase para abrir", ja: "ひとこと言えば開く", ar: "قل جملة واحدة ليفتح"},
", ": {es: ", ", ja: "、", ar: "، "},
"I found a few doors for you. To open one, just say the line that knocks on it.": {es: "Te encontré unas puertas. Para abrir una, di la frase que llama a esa puerta.", ja: "いくつかドアを見つけたよ。開けたいドアは、ノックのひとことを言えば開くよ。", ar: "وجدتُ لك بعض الأبواب. لتفتح باباً، قل الجملة التي تطرقه."},
"Doors you've opened · {n}": {es: "Puertas que abriste · {n}", ja: "開けたドア · {n}", ar: "أبواب فتحتها · {n}"},
"THE LINE THAT KNOCKS · HEAR IT, THEN SAY IT": {es: "LA FRASE QUE LLAMA · ESCÚCHALA Y DILA", ja: "ノックのひとこと · 聞いてから言ってみて", ar: "الجملة التي تطرق الباب · اسمعها ثم قلها"},
"It doesn't have to be perfect — being understood is enough.": {es: "No tiene que ser perfecto: basta con que se entienda.", ja: "完璧じゃなくていい。伝われば十分。", ar: "لا داعي للكمال، يكفي أن يُفهم كلامك."},
"Tap or hold to speak": {es: "Toca o mantén pulsado para hablar", ja: "タップ、または長押しで話す", ar: "اضغط أو استمر بالضغط لتتكلم"},
"Can't talk right now?": {es: "¿No puedes hablar ahora?", ja: "今は声を出せない？", ar: "لا تستطيع الكلام الآن؟"},
"Tap the words in order": {es: "Toca las palabras en orden", ja: "順番にことばをタップ", ar: "اضغط الكلمات بالترتيب"},
"Just listen twice": {es: "Solo escúchala dos veces", ja: "2回聞くだけ", ar: "استمع مرتين فقط"},
"Play": {es: "Escuchar", ja: "再生", ar: "تشغيل"},
"You said it — the door's open!": {es: "¡Lo dijiste y la puerta se abrió!", ja: "言えたね。ドアが開いた！", ar: "قلتها، وانفتح الباب!"},
"Door's open. Say it out loud next time if you can.": {es: "La puerta está abierta. La próxima vez, si puedes, dila en voz alta.", ja: "ドアが開いたよ。次に声を出せるときは、言ってみてね。", ar: "انفتح الباب. في المرة القادمة إن استطعت، قلها بصوت عالٍ."},
"OPEN": {es: "ABIERTA", ja: "開いた", ar: "فُتح"},
"What you said at the door": {es: "Lo que dijiste en la puerta", ja: "ドアの前で言ったこと", ar: "ما قلته عند الباب"},
"Just to yourself": {es: "Solo para ti", ja: "自分にだけ言う", ar: "لنفسك فقط"},
"Write it down": {es: "Escríbela", ja: "書いておく", ar: "اكتبها"},
"Say it to someone": {es: "Díselo a alguien", ja: "だれかに言う", ar: "قلها لأحد"},
"Under your breath is fine.": {es: "En voz baja está bien.", ja: "小声でいいよ。", ar: "بصوت خافت يكفي."},
"Notes app, a delivery note, a sticky note.": {es: "Notas del móvil, una nota en un pedido, un pósit.", ja: "メモアプリ、出前のメモ、ふせん。", ar: "تطبيق الملاحظات، ملاحظة في طلب توصيل، ورقة لاصقة."},
"A friend, family, someone at a shop — whoever's easy.": {es: "Un amigo, tu familia, alguien en una tienda: quien te quede fácil.", ja: "友だち、家族、お店の人。話しやすい人でいい。", ar: "صديق، أحد من العائلة، شخص في متجر — من يسهل عليك."},
"Okay. See you.": {es: "Vale. Hasta luego.", ja: "うん、またね。", ar: "حسناً، أراك لاحقاً."},
"Before you go — take this with you.": {es: "Antes de irte, llévate esto.", ja: "行く前に、これを持っていって。", ar: "قبل أن تذهب، خذ هذه معك."},
"TAKE THIS OUT WITH YOU": {es: "LLÉVATELA CONTIGO", ja: "持って出かけよう", ar: "خذها معك"},
"The line you knocked with today — use it once out there.": {es: "La frase con la que llamaste hoy: úsala una vez ahí fuera.", ja: "今日ノックしたひとこと。外で一回使ってみて。", ar: "الجملة التي طرقت بها اليوم — استعملها مرة واحدة في الخارج."},
"Any of these counts. No talking to strangers needed.": {es: "Cualquiera vale. No hace falta hablar con desconocidos.", ja: "どれでもOK。知らない人に話しかけなくていい。", ar: "أيّ منها يُحسب. لا حاجة للحديث مع الغرباء."},
"Got it — in my pocket": {es: "Guardada en el bolsillo", ja: "ポケットにしまった", ar: "وضعتها في جيبي"},
"See you. I'll ask how it went — just once.": {es: "Hasta luego. Te preguntaré qué tal, solo una vez.", ja: "またね。どうだったか、一回だけ聞くね。", ar: "أراك لاحقاً. سأسألك كيف جرى الأمر، مرة واحدة فقط."},
"Nice. That line's part of your life now.": {es: "Genial. Esa frase ya es parte de tu vida.", ja: "いいね。このひとこと、もうきみの暮らしの中にあるね。", ar: "رائع. صارت هذه الجملة جزءاً من حياتك."},
"Okay.": {es: "Vale.", ja: "うん。", ar: "حسناً."},
"Yesterday's slip — did you try it?": {es: "La nota de ayer, ¿la probaste?", ja: "きのうのメモ、使ってみた？", ar: "ورقة الأمس — هل جرّبتها؟"},
"I tried it": {es: "Sí, la probé", ja: "使ってみた", ar: "جرّبتها"},
"Didn't get to it": {es: "No me dio tiempo", ja: "できなかった", ar: "لم يتسنَّ لي"},
"You said this {n} weeks ago. Say it again today?": {es: "Hace {n} semanas dijiste esto. ¿Lo dices otra vez hoy?", ja: "{n}週間前にこう言ってたね。今日もう一度言ってみる？", ar: "قلت هذا قبل {n} أسابيع. هل تقوله مرة أخرى اليوم؟"},
"You said this a while ago. Say it again today?": {es: "Hace un tiempo dijiste esto. ¿Lo dices otra vez hoy?", ja: "前にこう言ってたね。今日もう一度言ってみる？", ar: "قلت هذا منذ مدة. هل تقوله مرة أخرى اليوم؟"},
"Say it again today — or change it if it's not true any more.": {es: "Dilo otra vez hoy, o cámbialo si ya no es así.", ja: "今日もう一度。変わっていたら、今のことを言ってね。", ar: "قلها مرة أخرى اليوم، أو غيّرها إن لم تعد صحيحة."},
"Something about {n} today. Want a look?": {es: "Hoy hay algo sobre {n}. ¿Le echas un vistazo?", ja: "今日は {n} のことがあるよ。見てみる？", ar: "هناك شيء عن {n} اليوم. هل تلقي نظرة؟"},
"Close": {es: "Cerrar", ja: "閉じる", ar: "إغلاق"},
"Saved for when you came by:": {es: "Guardado para cuando vinieras:", ja: "来てくれたら話そうと思ってたこと：", ar: "احتفظتُ به حتى تأتي:"},
"A few new doors today.": {es: "Hoy hay unas puertas nuevas.", ja: "今日は新しいドアがいくつかあるよ。", ar: "هناك بعض الأبواب الجديدة اليوم."},
"A line you said a while back.": {es: "Una frase que dijiste hace un tiempo.", ja: "前にきみが言ったひとこと。", ar: "جملة قلتها منذ مدة."},
"on your boat": {es: "en tu barco", ja: "きみの船の上", ar: "على قاربك"},
"Hey. What's up? (I remember — you're into {n}.)": {es: "Hola. ¿Qué tal? (Me acuerdo: te gusta {n}.)", ja: "やあ、どうしたの？（覚えてるよ、{n}が好きなんだよね。）", ar: "أهلاً، ما الأخبار؟ (أتذكّر — تحب {n}.)"},
"Hey. What's up?": {es: "Hola. ¿Qué tal?", ja: "やあ、どうしたの？", ar: "أهلاً، ما الأخبار؟"},
"Tell me what you're into": {es: "Cuéntame qué te gusta", ja: "好きなものを教えて", ar: "أخبرني بما تحب"},
"Nothing urgent today. I'm at the bow — tap me whenever.": {es: "Hoy no hay nada urgente. Estoy en la proa; tócame cuando quieras.", ja: "今日は急ぎのことはないよ。船の先にいるから、いつでもタップしてね。", ar: "لا شيء عاجل اليوم. أنا في مقدمة القارب — اضغط عليّ متى شئت."},
"That's it for today": {es: "Hasta aquí por hoy", ja: "今日はここまで", ar: "يكفي لليوم"},
"Got it.": {es: "Te oí.", ja: "聞こえたよ。", ar: "سمعتك."},
"What do you like to watch and read about?": {es: "¿Qué te gusta ver y leer?", ja: "ふだん何を見たり読んだりするのが好き？", ar: "ما الذي تحب أن تشاهده وتقرأ عنه؟"},
"Pick one to three. We'll show you more of these.": {es: "Elige de uno a tres. Te mostraremos más de esto.", ja: "1〜3個えらんでね。こういうものを多めに見せます。", ar: "اختر من واحد إلى ثلاثة، وسنعرض لك المزيد منها."},
"Up to three. Put one down first.": {es: "Máximo tres. Quita uno primero.", ja: "3つまで。ひとつ外してからね。", ar: "ثلاثة كحد أقصى. أزل واحداً أولاً."},
"Done": {es: "Listo", ja: "OK", ar: "تم"},
"Cancel": {es: "Cancelar", ja: "やめる", ar: "إلغاء"},
"What I'm into": {es: "Lo que me gusta", ja: "好きなもの", ar: "ما أحبّه"},
"Not picked yet — tap to pick one to three": {es: "Aún sin elegir: toca para elegir de uno a tres", ja: "まだ選んでいません。タップして1〜3個えらぶ", ar: "لم تختر بعد — اضغط لتختار من واحد إلى ثلاثة"}
};

window.VOYO = {after, meet, meRow, meOpen: editInts, open: () => openSheet(null), _st: ST};
})();

/* desk_mag.js */
/* 🖥️ 电脑版杂志头版（2026-11-08，样板 样板/电脑版杂志样板.html 第三版；用户「对，照这个做」）
   电脑屏幕大：点「今天」不是手机那张手帐，而是一期杂志的头版——今日世界三张（轮换，可以就地猜）、转动的地球、今天的话题（短片在播）、
   朋友今天的动态、大家正在说（各个话题的群聊一条条冒出来）、我的船（今天要练的）和我。点任何一篇，竖着刷从右边滑出来就地学，不离开这一页。
   手机上不变。主程序 bpHtml / bpOpen 里叫 DESK.on() / DESK.html() / DESK.after()；「开始练」才打开原来那张「我的船」整页（window.__deskBoat）。 */
(function(){
const X = new Proxy({}, {get: (_, k) => { const E0 = window.DESK_ENV; return E0 ? E0[k] : undefined; }});   // 主程序里的东西（主程序包在一个函数里，这里看不到，靠 DESK_ENV 递过来）
const wide = () => window.matchMedia && matchMedia("(min-width:701px)").matches;
const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]));
const P = s => String(s || "").replace(/[\[\]]/g, "");
const L = (zh, en) => (typeof X.UI === "undefined" || X.UI === "zh") ? zh : ((typeof X.ZL !== "undefined" && X.ZL && X.ZL[zh]) || en);
const pex = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w || 800}`;
const sayEn = (t, who) => { try { if (window.hvSay) return window.hvSay(P(t), who); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(P(t).replace(/\p{Extended_Pictographic}/gu, "")); u.lang = typeof X.LEARN_TTS !== "undefined" ? X.LEARN_TTS : "en-GB"; u.rate = .9; speechSynthesis.speak(u); } catch(e){} };
let timers = [], gTimer = null;
const stopAll = () => { timers.forEach(clearInterval); timers.forEach(clearTimeout); timers = []; if (gTimer){ gTimer.stop(); gTimer = null; } };
const on = () => wide() && !window.__deskBoat && typeof LIB !== "undefined";

// ── 数据：全是软件里现成的 ──
function twItems(){ try { const T = X.twToday() || []; return T.map(x => { const d = X.data.find(s => s.n === x.n), ph = typeof STICKER_PHOTOS !== "undefined" && STICKER_PHOTOS[x.n]; return {x, img: (ph && (ph.r2 || ph.src)) || x.img || "", ll: d ? [d.lon, d.lat] : null, where: d ? X.mapR(d.r) : (x.country || "")}; }); } catch(e){ return []; } }
function topicItems(){ const out = [], seen = new Set(), T = window.TALK_YOU || {};
  const add = (i, k, why) => { const key = i + "|" + k; if (seen.has(key) || out.length >= 8) return; let clip = null; try { clip = (X.tkClips(i, k) || []).find(c => c.poster); } catch(e){} if (!clip) return;
    const TX = T[key], m = TX && TX.chat && TX.chat.msgs && TX.chat.msgs[0], n = m && TX.npc ? TX.npc[m[0]] : null, cp = typeof X.galCap === "function" ? X.galCap(i, k) : null; seen.add(key);
    out.push({i, k, key, why: why || "", pl: X.blPlace(i, k), isle: X.blIsleE(i) + " " + X.blIsleName(i), clip, line: m && !X.LEARN_ZH ? [P(m[1]), m[2]] : cp ? [cp.t, cp.s] : null, who: n ? n : null, msgs: TX && TX.chat ? (TX.chat.msgs || []).slice(0, 4) : [], npc: (TX && TX.npc) || {}}); };
  try { X.galRecs().forEach(r => add(r.i, r.k, r.why)); } catch(e){}
  const ks = Object.keys(T), d0 = Math.floor(Date.now() / 864e5); for (let j = 0; j < ks.length && out.length < 8; j++){ const [i, k] = ks[(d0 * 7 + j * 13) % ks.length].split("|"); add(i, k, ""); }
  return out; }
function meNums(){ try { const A = X.pxGet(), d = new Date(), m0 = new Date(d.getFullYear(), d.getMonth(), 1).getTime(), M = A.filter(e => e.t >= m0);
    return [new Set(M.filter(e => X.SAY_K.has(e.k) && e.say).map(e => e.say)).size, new Set(M.filter(e => e.npc && (e.k === "reply" || e.k === "tyreply" || e.k === "npc")).map(X.pxWho)).size, new Set(M.filter(e => e.i && LIB[e.i]).map(e => e.i)).size]; } catch(e){ return [0, 0, 0]; } }

// ── 一页 ──
// 一张话题卡（短片 + 岛 + 为什么今天 + 住在那儿的人说的一句）；头版第一张放大（2026-11-10 用户：今日世界三张在「世界」页已经有了，「今天」不再放）
const tcHtml = (t, cls) => `<div class="dm-tc${cls}" data-dmt="${E(t.key)}"><video muted loop playsinline preload="none" poster="${E(t.clip.poster)}" data-src="${E(t.clip.src_sd || t.clip.src || "")}"></video><span class="is">${E(t.isle)}</span>${t.why ? `<span class="wy">${E(t.why)}</span>` : ""}<div class="bt"><h4>${E(t.pl.e || "")} ${E(t.pl.n)}</h4>${t.line ? `<div class="who">${t.who ? `<i>${E(t.who[1])}</i>` : ""}<div>${t.who ? `<small>${E(t.who[0])} · ${E(t.who[2])}</small>` : ""}${E(t.line[0])}</div></div>` : ""}</div></div>`;
function html(){ const d = new Date(), dt = X.UI === "zh" ? (d.getMonth() + 1) + "月" + d.getDate() + "日" : d.toLocaleDateString("en-GB", {day: "numeric", month: "long"});
  const no = typeof X.twNo === "function" ? X.twNo() : "", TW = twItems(), TP = topicItems(), FR = window.PTAB_FEED ? window.PTAB_FEED(5) : [], N = meNums(), sk = typeof X.bpStreak === "function" ? X.bpStreak() : 0;
  let I = []; try { I = X.bpTodayItems(); } catch(e){}
  let W0 = ["", ""]; try { W0 = X.meWho(); } catch(e){}
  return `<div class="dm"><header class="dm-top"><h1>HEYVOYO</h1><div class="dm-iss">${no ? L("第 " + no + " 期", "No. " + no) + "<br>" : ""}${E(dt)}</div><button class="dm-search" data-dm="search">🔍 ${L("搜一个地方、一个人、一个词……", "Search a place, a person, a word…")}</button>${sk ? `<span class="dm-streak">🔥 ${L("连续 " + sk + " 天", sk + "-day streak")}</span>` : ""}<button class="dm-av" data-dm="me">🙂</button></header>
    ${window.HOWABOUT ? window.HOWABOUT.card() : ""}<div class="hv-echo-slot"></div>${window.ACT ? window.ACT.starter() + window.ACT.todayBar() : ""}${window.SNAP ? window.SNAP.card() : ""}${window.WFEED ? window.WFEED.card() : ""}
    <div class="dm-a">${TP.length ? tcHtml(TP[0], " dm-lead") : `<section class="dm-tw"></section>`}
      <section class="dm-globe"><div class="gh">🌍 ${L("世界 · 今天这些地方有人在说", "WORLD · people are talking here today")}</div><svg id="dmGlobe" viewBox="0 0 400 400"></svg><div class="gf" id="dmGf">${L("点地球上的点，打开那里的一篇", "Tap a dot to open that story")}</div></section></div>
    <div class="dm-sec"><h2>💬 ${L("今天的话题", "Today's topics")}</h2><small>${L("每篇里都有住在那儿的人，点开说一句", "Each one has people who live there — open it and say a line")}</small><button class="more" data-dm="topics">${L("全部话题 →", "All topics →")}</button></div>
    <div class="dm-rail">${TP.slice(1).map(t => tcHtml(t, "")).join("")}</div>
    <div class="dm-c"><section><div class="dm-sec"><h2>👥 ${L("朋友", "Friends")}</h2><small>${L("认识的人今天", "People you know, today")}</small><button class="more" data-dm="people">${L("全部 →", "All →")}</button></div>
        ${FR.map((f, j) => `<div class="dm-post" data-dmf="${j}">${f.photo ? `<div class="ph" style="background-image:url('${pex(f.photo, 900)}')"></div>` : ""}<div class="b"><div class="h"><img src="${E(f.img)}" alt=""><div><b>${E(f.nm)}</b><small>${E(f.home)}${f.job ? " · " + E(f.job) : ""} · ${E(f.when)}</small></div></div><p>${E(f.en)}</p>${f.zh ? `<div class="z">${E(f.zh)}</div>` : ""}${f.topic ? `<span class="tg">💬 ${E(((p => p ? (p.e || "") + " " + p.n : "")(X.blPlace(...f.topic.split("|")))))}</span>` : ""}</div></div>`).join("") || `<p class="dm-none">${L("还没有新动态。", "No new posts yet.")}</p>`}</section>
      <section><div class="dm-sec"><h2>🗣️ ${L("大家正在说", "People are saying")}</h2><small>${L("各个话题里刚冒出来的", "Fresh from the topics")}</small></div><div class="dm-live" id="dmLive"></div></section>
      <section><div class="dm-sec"><h2>⛵ ${L("我的船", "My boat")}</h2><small>${L("练你碰到过的", "Practise what you met")}</small></div>
        <div class="dm-boat"><div class="d">${L("今天要练的", "Today's practice")}</div>${I.length ? I.slice(0, 4).map(x => `<div class="it"><i>${E(x.e)}</i><div>${E(x.t)}<small>${E(x.s)}</small></div></div>`).join("") + `<button class="go" data-dm="boat">${L("开始练 · " + I.length + " 样 →", "Start · " + I.length + " →")}</button>` : `<p class="dm-none" style="color:#4a5a78">${L("还没有要练的。点一篇话题、说一句，这里就会长出来。", "Nothing yet. Open a topic and say a line — it'll show up here.")}</p><button class="go" data-dm="boat">${L("精练：发音、词块、跟读本 →", "Deep practice →")}</button>`}</div>
        <div class="dm-me" data-dm="me"><div class="h"><div class="av">🙂</div><div><b>🙋 ${E(W0[0])}</b></div></div><div class="nums"><div><b>${N[0]}</b><small>${L("说过的句子", "lines said")}</small></div><div><b>${N[1]}</b><small>${L("回过的人", "people")}</small></div><div><b>${N[2]}</b><small>${L("去过的岛", "islands")}</small></div></div>${typeof X.meStampRow === "function" ? X.meStampRow() : ""}</div></section></div></div>`; }

// ── 动起来、点得开 ──
function after(box){ stopAll(); box.classList.add("dm-box"); const $ = s => box.querySelector(s); if (window.ACT) window.ACT.wire(box);   // 🎪 你在参加的活动，今天这一步
  const TW = twItems(), TP = topicItems(), FR = window.PTAB_FEED ? window.PTAB_FEED(5) : [];
  // 今日世界：轮换，就地猜
  let twI = 0, twT = null;
  const twShow = j => { if (!TW.length) return; twI = j; box.querySelectorAll(".dm-sl").forEach(s => s.classList.toggle("on", +s.dataset.j === j)); box.querySelectorAll(".dm-dots i").forEach(d => { d.classList.remove("on"); void d.offsetWidth; d.classList.toggle("on", +d.dataset.j === j); });
    const t = TW[j], x = t.x, ops = (x.l && x.l[X.UI] && x.l[X.UI].opts) || x.opts || [], ans = (x.l && x.l[X.UI] && x.l[X.UI].ans) || x.ans, q = (x.l && x.l[X.UI] && x.l[X.UI].q) || x.q;
    $("#dmTwK").textContent = L("第 " + (j + 1) + " 张", "No. " + (j + 1)) + " · " + t.where; $("#dmTwQ").textContent = q || ""; const W = $("#dmTwW"); W.classList.remove("on");
    W.innerHTML = `${E((x.l && x.l[X.UI] && x.l[X.UI].why) || x.why || "")}${x.say ? `<br><b class="say">“${E(x.say)}”</b>` : ""}<div class="acts">${window.TFEED && TFEED.canFlow && TFEED.canFlow(x.n) ? `<button data-dmw="flow">▶ ${L("往下走：那儿的人怎么说", "Keep going: what people there say")}</button>` : ""}<button data-dmw="map">📰 ${L("读这一篇", "Read the story")}</button><button data-dmw="tw">🛂 ${L("去盖章", "Get the stamp")}</button></div>`;
    $("#dmTwO").innerHTML = ops.map(o => `<button>${E(o)}</button>`).join("");
    $("#dmTwO").querySelectorAll("button").forEach(b => b.onclick = () => { clearTimeout(twT); $("#dmTwO").querySelectorAll("button").forEach(c => c.classList.add(c.textContent === ans ? "ok" : "no")); W.classList.add("on"); if (x.say) sayEn(x.say); });
    W.querySelectorAll("[data-dmw]").forEach(b => b.onclick = () => { const a = b.dataset.dmw; if (a === "flow"){ window.__tfStay = true; if (!TFEED.flow(x.n)) window.__tfStay = false; } else if (a === "tw"){ try { X.twOpen(j); } catch(e){} } else article(x.n, "today"); });
    clearTimeout(twT); twT = setTimeout(() => { if (box.isConnected && !box.hidden && !W.classList.contains("on")) twShow((twI + 1) % TW.length); }, 8000); timers.push(twT); };
  box.querySelectorAll(".dm-dots i").forEach(d => d.onclick = () => twShow(+d.dataset.j)); if ($("#dmTwK")) twShow(0);
  // 话题：短片进到画面里才播；点了竖着刷从右边滑出来
  const vio = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting){ if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src; v.play && v.play().catch(() => {}); } else v.pause && v.pause(); }), {threshold: .5}) : null;
  if (vio && typeof X.CAN_EMBED !== "undefined" && X.CAN_EMBED) box.querySelectorAll(".dm-tc video").forEach(v => vio.observe(v));
  const openTopic = key => { const [i, k] = key.split("|"); window.__tfStay = true; if (window.TFEED && TFEED.open(i, k)) return; window.__tfStay = false; X.galClose(); X.blGo(i, k); };
  box.querySelectorAll("[data-dmt]").forEach(c => c.onclick = () => openTopic(c.dataset.dmt));
  box.querySelectorAll("[data-dmf]").forEach(c => c.onclick = () => { const f = FR[+c.dataset.dmf]; if (!f) return; if (f.topic && window.TFEED && TFEED.has(...f.topic.split("|"))) return openTopic(f.topic); X.ptOpen(); setTimeout(() => window.PTAB_PERSON && window.PTAB_PERSON(f.id), 80); });
  box.querySelectorAll("[data-dm]").forEach(b => b.onclick = e => { e.stopPropagation(); const a = b.dataset.dm;
    if (a === "boat"){ window.__deskBoat = true; X.bpOpen(); } else if (a === "me") X.meOpen(); else if (a === "people") X.ptOpen(); else if (a === "topics") X.galOpen();
    else if (a === "search"){ X.galClose(); setTimeout(() => { const q = document.getElementById("q") || document.querySelector("#head input"); if (q) q.focus(); }, 200); } });
  // 大家正在说：各个话题的群聊一条条冒出来
  const LV = []; TP.forEach(t => t.msgs.forEach(m => LV.push([t, m, t.npc[m[0]] || [m[0], "🙂", ""]]))); LV.sort(() => Math.random() - .5);
  const live = $("#dmLive"); let li = 0;
  const liveAdd = () => { if (!LV.length || !live) return; const [t, m, n] = LV[li++ % LV.length], d = document.createElement("div"); d.className = "ln"; d.innerHTML = `<i>${E(n[1])}</i><div><b>${E(n[0])} <small>· ${E(n[2])} · ${E(t.pl.n)}</small></b><div>${E(P(m[1]))}</div>${X.UI === "zh" && m[2] ? `<div class="z">${E(m[2])}</div>` : ""}</div>`;
    d.onclick = () => openTopic(t.key); live.prepend(d); while (live.children.length > 8) live.lastChild.remove(); };
  if (!X.LEARN_ZH){ for (let j = 0; j < 5; j++) liveAdd(); timers.push(setInterval(() => { if (box.isConnected && !box.hidden && !document.hidden) liveAdd(); }, 4500)); } else if (live) live.closest("section").hidden = true;
  // 地球：慢慢转；今日世界和今天话题的地方是点
  try { const svg = d3.select(box.querySelector("#dmGlobe")), proj = d3.geoOrthographic().scale(170).translate([200, 200]).clipAngle(90), path = d3.geoPath(proj);
    const land = topojson.feature(X.WORLD, X.WORLD.objects.countries), PT = TW.filter(t => t.ll).map((t, j) => ({ll: t.ll, t: L("今日世界 · ", "Today · ") + X.mapN(t.x.n), go: () => article(t.x.n, "today")}));
    TP.forEach(t => { try { const tk = X.tkOf(t.i, t.k), c = tk && tk.go && tk.go.city; const cn = c && (typeof c === "object" ? c.zh : c), d = cn && X.data.find(s => s.area === cn || s.city === cn); if (d) PT.push({ll: [d.lon, d.lat], t: t.pl.n, f: 1, go: () => openTopic(t.key)}); } catch(e){} });
    svg.append("path").datum({type: "Sphere"}).attr("class", "sph"); svg.append("path").datum(d3.geoGraticule10()).attr("class", "grat"); svg.append("path").datum(land).attr("class", "lnd");
    const pins = svg.selectAll(".gp").data(PT).enter().append("circle").attr("class", d => "gp" + (d.f ? " f" : "")).attr("r", 6.5).style("cursor", "pointer").on("click", (e, d) => d.go()).on("mouseenter", (e, d) => { $("#dmGf").innerHTML = "<b>" + E(d.t) + "</b> · " + L("点一下打开", "click to open"); });
    let rot = TW[0] && TW[0].ll ? -TW[0].ll[0] + 40 : 20;
    gTimer = d3.timer(() => { if (!box.isConnected || box.hidden){ gTimer && gTimer.stop(); return; } rot += .1; proj.rotate([rot, -15]); svg.selectAll("path").attr("d", path);
      pins.attr("transform", d => { const p = proj(d.ll); return p ? `translate(${p})` : "translate(-99,-99)"; }).attr("opacity", d => d3.geoDistance(d.ll, [-rot, 15]) < 1.5 ? 1 : 0); }); } catch(e){}
}
// 📰 一张贴纸 = 一篇杂志文章（2026-11-08，样板 样板/贴纸杂志页样板.html；用户「这排版也太好看了」）：电脑上从头版点进一张贴纸不再飞到满屏贴纸的地图，
// 而是整屏短片（STK_HEAD_EXTRA）或照片 + 大标题，正文 = 为什么有名 · 今天为什么是它 · 你可能不知道（有出处）· 到了那儿你会说（STK_STD），右边 = 地图上的位置和附近；想看地图再点「在大地图上看」
let artBox = null, artIo = null;
function artClose(){ if (!artBox) return; artBox.querySelectorAll("video").forEach(v => v.pause()); artBox.remove(); artBox = null; document.body.classList.remove("dm-art-on"); try { speechSynthesis.cancel(); } catch(e){} }
function artNear(d, n){ const pic = o => { const p = typeof STICKER_PHOTOS !== "undefined" && STICKER_PHOTOS[o.n]; return p && (p.r2 || p.src); };
  return X.data.filter(o => o !== d && pic(o)).map(o => [o, d3.geoDistance([d.lon, d.lat], [o.lon, o.lat])]).sort((a, b) => a[1] - b[1]).slice(0, n).map(([o, g]) => ({o, km: Math.round(g * 6371), pic: pic(o)})); }
function article(n, from){ const d = X.data.find(s => s.n === n); if (!d) return false; artClose();
  const zh = X.UI === "zh", S = (typeof STK_STD !== "undefined" && STK_STD[n]) || {}, ph = typeof STICKER_PHOTOS !== "undefined" && STICKER_PHOTOS[n], img = ph && (ph.r2 || ph.src) || "", hv = typeof STK_HEAD_EXTRA !== "undefined" && STK_HEAD_EXTRA[n];
  const nm = X.mapN(n), en = (typeof MAP_EN !== "undefined" && MAP_EN.names && MAP_EN.names[n]) || "", desc = zh ? (S.what || d.d || "") : (S.what_en || d.d || ""), descSub = zh ? "" : "";
  const fame = zh ? S.fame : S.fame_en, fameEn = zh ? S.fame_en : "", fact = zh ? S.fact : S.fact_en, say = S.say;
  let TW = []; try { TW = X.twToday() || []; } catch(e){} const tj = TW.findIndex(x => x.n === n), tw = tj >= 0 ? TW[tj] : null, twWhy = tw ? ((tw.l && tw.l[X.UI] && tw.l[X.UI].why) || tw.why) : "";
  const near = artNear(d, 4), nxt = tw && TW[tj + 1] ? X.data.find(s => s.n === TW[tj + 1].n) : null, far = artNear(d, 12).find(x => x.o.t === 1 && x.o.n !== (nxt && nxt.n));
  const pp = o => { const p = typeof STICKER_PHOTOS !== "undefined" && STICKER_PHOTOS[o.n]; return p && (p.r2 || p.src) || ""; };
  const kick = (tw ? L("今日世界 · 第 " + (tj + 1) + " 张 · ", "Today's world · No. " + (tj + 1) + " · ") : "") + X.mapR(d.r);
  artBox = document.createElement("div"); artBox.id = "dmArt";
  artBox.innerHTML = `<div class="ab" id="dmArtBar"><button data-art="x">← ${from === "today" ? L("回到今天", "Back to Today") : L("回去", "Back")}</button><span class="t">${E(nm)}${en && en !== nm ? " · " + E(en) : ""}</span><div class="r">${window.TFEED && TFEED.canFlow && TFEED.canFlow(n) ? `<button data-art="flow" class="hot">▶ ${L("往下走：那儿的人怎么说", "Keep going: what people there say")}</button>` : ""}<button data-art="map" class="full"><i>🌍</i>${L("全地图", "Full map")}</button></div></div>
    <section class="ah">${img ? `<div class="ph" style="background-image:url('${E(img)}')"></div>` : ""}${hv && hv.hd ? `<video muted loop autoplay playsinline poster="${E(hv.poster || img)}" src="${E(hv.hd)}"></video>` : ""}
      <div class="tx"><div class="kick">${E(kick)}</div><h1>${E(nm)}</h1>${en && en !== nm ? `<div class="en">${E(en)} <button data-say="${E(en)}">🔊</button></div>` : ""}${desc ? `<div class="dek">${E(desc)}</div>` : ""}</div>
      <div class="credit">${hv && hv.nm ? L("短片：", "Video: ") + E(hv.nm) + " / Pexels" : ph && ph.artist ? L("照片：", "Photo: ") + E(ph.artist) + (ph.license ? " · " + E(ph.license) : "") : ""}</div></section>
    <div class="ab2"><article>${fame ? `<p class="lede up">${E(fame)}</p>` : `<p class="lede up">${E(d.d || "")}</p>`}${fameEn && !X.LEARN_ZH ? `<p class="en-p up">${E(fameEn)}</p>` : ""}
      ${twWhy ? `<div class="today up"><div class="h" style="margin-top:0">📅 ${L("今天为什么是它", "Why it's today")}</div><q>${E(twWhy)}</q>${tw.say ? `<div class="sy">“${E(tw.say)}” <button class="sb" data-say="${E(tw.say)}">🔊</button></div>` : ""}</div>` : ""}
      ${fact ? `<div class="h up">💡 ${L("你可能不知道", "Did you know?")}</div><div class="fact up">${E(fact)}${S.src ? `<small>${L("出处：", "Source: ")}${S.url ? `<a href="${E(S.url)}" target="_blank" rel="noopener">${E(S.src)}</a>` : E(S.src)}</small>` : ""}</div>` : ""}
      ${say && say.en && !X.LEARN_ZH ? `<div class="speak up"><button class="mic" data-art="mic">🎙️</button><div><small>${L("到了那儿，你会说", "Once you're there, you'd say")}</small><b>${E(say.en)}</b><span id="dmArtHeard">${zh && say.zh ? E(say.zh) + "　" : ""}${L("点麦克风说一遍", "Tap the mic and say it")}</span></div><button class="sb lt" data-say="${E(say.en)}">🔊</button></div>` : ""}</article>
      <aside><div class="loc"><svg id="dmArtLoc"></svg>${img ? `<div class="pin" id="dmArtPin" style="background-image:url('${E(img)}')"></div>` : ""}<button class="go" data-art="map">🗺️ ${L("在大地图上看周围", "See what's around on the map")} <span>→</span></button></div>
        <div class="near"><h4>📍 ${L("附近还有", "Nearby")}</h4><div class="g">${near.map(x => `<a data-artgo="${E(x.o.n)}"><i style="background-image:url('${E(x.pic)}')"></i><b>${E(x.o.e || "")} ${E(X.mapN(x.o.n))}</b><small>${x.km ? x.km + L(" 公里 · ", " km · ") : ""}${E(((zh ? x.o.d : (typeof MAP_EN !== "undefined" && MAP_EN.desc && MAP_EN.desc[x.o.n]) || x.o.d) || "").slice(0, 34))}</small></a>`).join("")}</div></div></aside></div>
    <div class="af">${[nxt ? [nxt, L("今日世界 · 下一张", "Today's world · next")] : null, far ? [far.o, L(far.km + " 公里外 · 有名的", "Famous · " + far.km + " km away")] : null].filter(Boolean).map(([o, k]) => `<a data-artgo="${E(o.n)}">${pp(o) ? `<i style="background-image:url('${E(pp(o))}')"></i>` : ""}<div><small>${E(k)}</small><b>${E(X.mapN(o.n))}</b></div></a>`).join("")}</div>`;
  document.body.append(artBox); document.body.classList.add("dm-art-on"); artBox.scrollTop = 0;
  try { HVI.stkSeen(n); } catch(e){}
  const bar = artBox.querySelector("#dmArtBar"); artBox.addEventListener("scroll", () => bar.classList.toggle("solid", artBox.scrollTop > innerHeight * .65), {passive: true});
  artIo = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), {root: artBox, threshold: .15}); artBox.querySelectorAll(".up").forEach(e => artIo.observe(e));
  const v = artBox.querySelector(".ah video"); if (v) v.addEventListener("error", () => v.remove());
  artBox.querySelectorAll("[data-say]").forEach(b => b.onclick = () => sayEn(b.dataset.say));
  artBox.querySelectorAll("[data-artgo]").forEach(b => b.onclick = () => article(b.dataset.artgo, from));
  artBox.querySelectorAll("[data-art]").forEach(b => b.onclick = () => { const a = b.dataset.art;
    if (a === "x") artClose(); else if (a === "map"){ artClose(); X.galClose(); setTimeout(() => HVI.stkGo(n), 150); } else if (a === "flow"){ artClose(); window.__tfStay = true; if (!TFEED.flow(n)) window.__tfStay = false; }
    else if (a === "mic"){ const R = window.SpeechRecognition || window.webkitSpeechRecognition, hd = artBox.querySelector("#dmArtHeard"); if (!R){ hd.textContent = L("这个浏览器听不了，跟着念一遍就好", "This browser can't listen — just say it out loud"); return; }
      try { const r = new R(); r.lang = "en-GB"; r.interimResults = true; b.classList.add("rec"); r.onresult = ev => { hd.textContent = [...ev.results].map(x => x[0].transcript).join(" "); }; r.onend = () => { b.classList.remove("rec"); b.textContent = "✓"; try { window.hvPx && window.hvPx({k: "say", u: n + "|art", say: say.en, n, from: "art"}); } catch(e){} }; r.start(); setTimeout(() => { try { r.stop(); } catch(e){} }, 7000); } catch(e){} } });
  // 地图上的位置：那一片的小地图
  try { const loc = artBox.querySelector(".loc"), W = loc.clientWidth, H = loc.clientHeight, svg = d3.select(artBox.querySelector("#dmArtLoc")).attr("viewBox", `0 0 ${W} ${H}`), proj = d3.geoMercator().center([d.lon, d.lat]).scale(1100).translate([W / 2, H / 2 - 20]);
    svg.append("path").attr("class", "lnd").attr("d", d3.geoPath(proj)(topojson.feature(X.WORLD, X.WORLD.objects.countries))); const p = artBox.querySelector("#dmArtPin"); if (p){ const [x, y] = proj([d.lon, d.lat]); p.style.left = x + "px"; p.style.top = y + "px"; } } catch(e){}
  return true; }
addEventListener("keydown", e => { if (e.key === "Escape" && artBox) artClose(); });

// 🗞️ 地图上点贴纸（2026-11-08，用户：以前贴纸的内容挺好，但是排版丑死了）：内容和功能一样不动，电脑上把那张窄卡片排成整屏杂志页——
// 短片 / 照片铺满做封面、名字大标题压在上面；标签页成了杂志的栏目条；正文加大加宽；右边一栏是那一片的小地图、附近（带照片）、往下走
const cardEl = () => document.getElementById("card");
function magOn(){ const c = cardEl(); if (!c || !wide() || c.hidden || document.body.classList.contains("me-page")) return false; const st = document.getElementById("isleStage"); if (st && !st.hidden) return false;
  return !!(c.querySelector(":scope > .c-top") && c.querySelector(":scope > .ctabs")); }
function magApply(){ const c = cardEl(); if (!c) return; if (c.classList.contains("npcpage") && !c.querySelector(":scope > .np-cover")) c.classList.remove("npcpage"); const want = magOn();
  if (!want){ if (c.classList.contains("mag")){ c.classList.remove("mag", "mag-nohero"); document.body.classList.remove("stk-mag"); } return; }
  if (c.dataset.magFor === (X.selected && X.selected.n) && c.querySelector(":scope > .mag-side")) return;
  const d = X.selected; if (!d) return; c.dataset.magFor = d.n; c.classList.add("mag"); document.body.classList.add("stk-mag"); c.scrollTop = 0;
  const hero = c.querySelector(":scope > .ct-head, :scope > .ph"); c.classList.toggle("mag-nohero", !hero); if (hero) hero.classList.add("mag-hero");
  const x = c.querySelector(":scope > .x"); if (x){ x.textContent = "← " + L("回去", "Back"); x.classList.add("mag-x"); }
  c.querySelectorAll(":scope > .mag-full").forEach(e => e.remove()); const full = document.createElement("button"); full.className = "mag-full"; full.innerHTML = `<i>🌍</i><span>${L("全地图", "Full map")}</span>`; full.onclick = () => { if (x) x.click(); }; c.append(full);
  if (!c.dataset.magScroll){ c.dataset.magScroll = 1; c.addEventListener("scroll", () => c.classList.toggle("mag-scrolled", c.scrollTop > innerHeight * .45), {passive: true}); } c.classList.remove("mag-scrolled");
  const near = artNear(d, 4), img = (typeof STICKER_PHOTOS !== "undefined" && STICKER_PHOTOS[d.n] && (STICKER_PHOTOS[d.n].r2 || STICKER_PHOTOS[d.n].src)) || "";
  const side = document.createElement("aside"); side.className = "mag-side";
  side.innerHTML = `<div class="loc"><svg></svg>${img ? `<div class="pin" style="background-image:url('${E(img)}')"></div>` : `<div class="pin em">${E(d.e)}</div>`}<button class="go" data-mag="map">🗺️ ${L("在大地图上看周围", "See what's around on the map")} <span>→</span></button></div>
    ${!c.querySelector(".stk-flow") && window.TFEED && TFEED.canFlow && TFEED.canFlow(d.n) ? `<button class="flow" data-mag="flow">▶ ${L("往下走：住在这儿的人怎么说", "Keep going: what people here say")}</button>` : ""}
    ${near.length ? `<h4>📍 ${L("附近还有", "Nearby")}</h4><div class="g">${near.map(x => `<a data-maggo="${E(x.o.n)}"><i style="background-image:url('${E(x.pic)}')"></i><b>${E(x.o.e || "")} ${E(X.mapN(x.o.n))}</b><small>${x.km ? x.km + L(" 公里", " km") : ""}</small></a>`).join("")}</div>` : ""}`;
  c.querySelectorAll(":scope > .mag-side").forEach(e => e.remove()); c.append(side);
  side.querySelectorAll("[data-mag]").forEach(b => b.onclick = () => { if (b.dataset.mag === "flow"){ window.__tfStay = false; TFEED.flow(d.n); } else if (x) x.click(); });
  side.querySelectorAll("[data-maggo]").forEach(b => b.onclick = () => HVI.stkGo(b.dataset.maggo));
  try { const loc = side.querySelector(".loc"), W = 340, H = 240, svg = d3.select(side.querySelector("svg")).attr("viewBox", `0 0 ${W} ${H}`), proj = d3.geoMercator().center([d.lon, d.lat]).scale(900).translate([W / 2, H / 2 - 16]);
    svg.append("path").attr("class", "lnd").attr("d", d3.geoPath(proj)(topojson.feature(X.WORLD, X.WORLD.objects.countries))); const p = side.querySelector(".pin"), [px, py] = proj([d.lon, d.lat]); p.style.left = (px / W * 100) + "%"; p.style.top = (py / H * 100) + "%"; } catch(e){} }
let magT = null; const magKick = () => { clearTimeout(magT); magT = setTimeout(magApply, 30); };
const magObs = () => { const c = cardEl(); if (!c){ setTimeout(magObs, 500); return; } new MutationObserver(magKick).observe(c, {childList: true, attributes: true, attributeFilter: ["hidden"]}); new MutationObserver(magKick).observe(document.body, {attributes: true, attributeFilter: ["class"]}); };
magObs(); addEventListener("resize", magKick);
// 🗺️ 电脑上的「世界」（样板 样板/世界页地图集样板.html，用户 2026-11-08「可以」）：左边那一栏排成地图集杂志——今日世界三张、文化之旅、这一片的头条大图 + 两列照片；地图上的贴纸还是卡通画（用户：照片太暗）
const PH = n => { const p = typeof STICKER_PHOTOS !== "undefined" && STICKER_PHOTOS[n]; return p ? (p.r2 || p.src || "") : ""; };
function worldTop(){ let out = "";
  try { const T = X.twToday(); if (T && T.length){ const m = (typeof X.twMine === "function" && X.twMine()) || {res: []}, no = typeof X.twNo === "function" ? X.twNo() : "", done = m.res.filter(r => r !== null && r !== undefined).length;
    out += `<div class="dw-tw" data-twopen><div class="dw-twh"><b>🌍 ${E(L("今日世界", "Today's World"))} #${E(no)}</b><small>${E(done === 3 ? L("今天的 3 张都看完了", "All 3 done today") : L("全世界今天一起看这 3 张", "The whole world sees these 3 today"))}</small></div>
      <div class="dw-three">${T.slice(0, 3).map((x, i) => { const im = PH(x.n) || x.img || "", seen = m.res[i] !== null && m.res[i] !== undefined; return `<div class="${seen ? "seen" : ""}" style="background-image:url('${E(im)}')"><span>${seen ? E(X.mapN ? X.mapN(x.n) : x.n) : "?"}</span></div>`; }).join("")}</div>
      <div class="dw-go">${E(done === 3 ? L("看看今天的答案 →", "See today's answers →") : L("猜一猜是哪儿 →", "Guess where →"))}</div></div>`; } } catch(e){}
  try { const cp = document.getElementById("ctPill"); if (cp && cp.textContent.trim()) out += `<div class="dw-ct" data-dwct><div class="ic">🎒</div><div class="tx">${cp.innerHTML}</div></div>`; } catch(e){}
  return out; }
function worldList(Lst, pic){ const D = Lst.map(([d, k]) => ({d, k, ph: pic(d)})), lead = D.find(o => o.ph), rest = D.filter(o => o !== lead);
  const zh = typeof X.UI === "undefined" || X.UI === "zh", std = n => (typeof STK_STD !== "undefined" && STK_STD[n]) || null;
  const line = n => { const s = std(n); if (!s) return ""; const t = zh ? (s.fact || s.fame || s.what) : (s.fact_en || s.fame_en || s.what_en); return t ? String(t).replace(/^(.{0,70}[。.!！?？]).*$/, "$1") : ""; };
  let h = "";
  if (lead){ const d = lead.d, ln = line(d.n); h += `<div class="dw-lead" data-mh="${d.id}" style="background-image:url('${E(lead.ph)}')"><span class="tag">${E(L("头条", "Top story"))}</span><h3>${E(X.mapN(d.n))}</h3><div class="where">${E(X.mapR(d.r))}${lead.k ? ` · 👥 ${lead.k}` : ""}</div>${ln ? `<p>${E(ln)}</p>` : ""}</div>`; }
  h += `<div class="dw-grid">${rest.map(o => `<div class="dw-c" data-mh="${o.d.id}"><div class="ph"${o.ph ? ` style="background-image:url('${E(o.ph)}')"` : ""}>${o.ph ? "" : E(o.d.e || "📍")}</div><b>${E(X.mapN(o.d.n))}</b><small>${E(X.mapR(o.d.r))}${o.k ? ` · 👥 ${o.k}` : ""}</small></div>`).join("")}</div>`;
  return h; }
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-dwct]"); if (b){ e.preventDefault(); e.stopPropagation(); const cp = document.getElementById("ctPill"); if (cp) cp.click(); } }, true);
const h1k = () => { const h = document.querySelector("#head h1"); if (h){ h.dataset.dk = L("世界", "World"); h.dataset.kick = "The Atlas"; } else setTimeout(h1k, 500); }; h1k(); setInterval(h1k, 3000);
window.DESK = {on, html, after, stop: stopAll, article, close: artClose, worldTop, worldList};

// ── 样子 ──
const CSS = `
@media (min-width:701px){
#galTabs{position:fixed!important;left:0!important;top:0!important;bottom:0!important;right:auto!important;transform:none!important;width:84px!important;flex-direction:column!important;justify-content:flex-start!important;gap:6px;padding:76px 0 0!important;border-radius:0!important;background:#14305c!important;box-shadow:none!important;display:flex!important}
#galTabs::before{content:"HEY VOYO";position:absolute;top:22px;left:0;right:0;text-align:center;font:700 12px/1.3 "Cormorant Garamond",Georgia,serif;letter-spacing:.2em;color:#fff;padding:0 18px}
#galTabs button{padding:9px 0!important;width:64px;margin:0 auto}

#gal,#boatPg,#ppPg{padding-left:84px!important}
body:has(#galTabs) #head,body:has(#galTabs) #card,body:has(#galTabs) #mHere{margin-left:84px}
/* 🗺️ 世界页 = 地图集：安静的纸色海、柔和的陆地，贴纸还是卡通画 */
:root{--sea:#e4ecec;--sea-wave:#c9d7d9;--land:#dfe9c6;--land-edge:#98ab78;--land-shade:#d3e0b6}
#sea{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='22'%3E%3Cpath d='M4 13 q5 -5 10 0 t10 0' fill='none' stroke='%23c6d4d6' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E")!important;background-size:44px 22px!important;animation:none!important}
.cty:hover{fill:#d2e2ae}
.tw-g .tw-halo{fill:none!important;stroke:rgba(201,164,92,.75)!important;stroke-width:1.5!important;animation:none!important}.tw-g .tw-ring{stroke:#c9a45c!important;stroke-width:2.5!important}
.tw-g .tw-p>*{transform:scale(.62)!important;transform-origin:0 0!important;transform-box:view-box!important}.tw-g .tw-halo{stroke-dasharray:3 4}
#mHere .mh-tools{flex-wrap:wrap!important;overflow:visible!important;gap:4px 16px!important;margin:4px 0 6px!important}
#mHere .mh-tools button{all:unset!important;cursor:pointer!important;font-size:12.5px!important;color:#3a4a66!important;padding:3px 0!important;border-bottom:1px dotted rgba(20,48,92,.35)!important;white-space:nowrap}#mHere .mh-tools button:hover{color:#e2552f!important;border-bottom-color:#e2552f!important}
.st .pile-n rect{fill:#fbf8f1!important;stroke:#c9a45c!important;stroke-width:1.2px!important}.st .pile-n text{fill:#8a6a2c!important}
.isle-fold{cursor:pointer}.isle-fold .if-o{fill:#fbf8f1;stroke:#c9a45c;stroke-width:1.5;filter:drop-shadow(0 3px 6px rgba(60,70,40,.25))}.isle-fold .if-i{fill:none;stroke:#c9a45c;stroke-width:.8;stroke-dasharray:2 3}.isle-fold .if-e{font-size:21px}.isle-fold .if-t{font:600 12.5px "Noto Serif SC","Songti SC",serif;fill:#14305c}.isle-fold:hover .if-o{fill:#fff}
#twPill,#ctPill{display:none!important}
body:not(.gal-on) #head{background:#fbf8f1!important;border:0!important;border-right:1px solid rgba(20,48,92,.1)!important;padding:26px 24px 14px!important;gap:10px!important}
body:not(.gal-on) #head h1{font-size:0!important;line-height:1!important}
body:not(.gal-on) #head h1::before{content:attr(data-kick);display:block;font:600 11px/1 "Cormorant Garamond",Georgia,serif;letter-spacing:.42em;text-transform:uppercase;color:#8f7a4c;margin-bottom:10px}
body:not(.gal-on) #head h1::after{content:attr(data-dk);display:block;font:600 38px/1.1 "Noto Serif SC","Songti SC",serif;letter-spacing:.04em;color:#14305c}
body:not(.gal-on) #head .sub{font-size:13px;color:#7a8296}body:not(.gal-on) #head .passport{background:none!important;border:0!important;padding:0!important;color:#14305c!important;font-weight:500!important}
body:not(.gal-on) #head .search input{background:#fff!important;border:1px solid rgba(20,48,92,.14)!important;border-radius:999px!important;box-shadow:none!important;padding:10px 16px!important;font-size:14px!important}
body:not(.gal-on) #head .legal{font-size:10.5px;opacity:.7}
#mHere{background:#fbf8f1!important;border:0!important;border-right:1px solid rgba(20,48,92,.1)!important;padding:4px 24px 30px!important}
#mHere .mh-h{margin:22px 0 10px!important;padding-top:14px;border-top:1px solid rgba(20,48,92,.12)}#mHere .mh-h b{font:600 20px "Noto Serif SC","Songti SC",serif!important}
#mHere .mh-tools button{background:#fff!important;border:1px solid rgba(20,48,92,.14)!important;box-shadow:none!important;border-radius:999px!important;font-size:12.5px!important}
.dw-tw{cursor:pointer;margin:10px 0 0;background:#14305c;border-radius:18px;padding:15px 15px 13px;color:#fff}
.dw-twh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.dw-twh b{font:600 15px "Noto Serif SC","Songti SC",serif}.dw-twh small{color:#aab6cc;font-size:11.5px}
.dw-three{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}
.dw-three div{aspect-ratio:3/4;border-radius:10px;background:#2a3d63 center/cover;position:relative;overflow:hidden;display:grid;place-items:center}
.dw-three div::after{content:"";position:absolute;inset:0;background:rgba(14,28,56,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.dw-three div.seen::after{background:linear-gradient(180deg,transparent 50%,rgba(8,16,32,.7));backdrop-filter:none;-webkit-backdrop-filter:none}
.dw-three span{position:relative;z-index:1;font:600 26px "Cormorant Garamond",Georgia,serif;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.4)}.dw-three .seen{place-items:end start}.dw-three .seen span{font:600 12px "Noto Serif SC",serif;padding:7px}
.dw-go{margin-top:10px;font-size:13px;color:#ffd9a8}
.dw-ct{cursor:pointer;margin-top:12px;display:flex;gap:12px;align-items:center;background:#fff;border:1px solid rgba(20,48,92,.1);border-radius:16px;padding:11px 14px}
.dw-ct .ic{width:40px;height:40px;border-radius:11px;background:#f4e6d2;display:grid;place-items:center;font-size:21px;flex:none}
.dw-ct .tx{display:flex;flex-direction:column;font-size:13px;color:#3a4a66;min-width:0}.dw-ct .tx b{font:600 14.5px "Noto Serif SC","Songti SC",serif;color:#14305c}.dw-ct .tx b:first-letter{font-size:0}
.dw-lead{position:relative;cursor:pointer;border-radius:18px;overflow:hidden;aspect-ratio:16/11;background:#ccc center/cover;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:16px;margin-top:4px;box-shadow:0 12px 26px rgba(20,30,50,.16)}
.dw-lead::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(8,16,32,.8))}.dw-lead>*{position:relative}
.dw-lead .tag{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);color:#14305c;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:.06em}
.dw-lead h3{margin:0;font:700 27px/1.15 "Noto Serif SC","Songti SC",serif;letter-spacing:.03em}.dw-lead .where{font-size:12.5px;opacity:.85;margin-top:2px}.dw-lead p{margin:7px 0 0;font-size:13px;line-height:1.55;opacity:.95;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dw-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 12px;margin-top:14px}
.dw-c{cursor:pointer;min-width:0}.dw-c .ph{aspect-ratio:4/3;border-radius:13px;background:#efe6d2 center/cover;display:grid;place-items:center;font-size:34px;transition:transform .25s}.dw-c:hover .ph{transform:translateY(-3px)}
.dw-c b{display:block;font:600 14.5px "Noto Serif SC","Songti SC",serif;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dw-c small{display:block;color:#7a8296;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#boatPg.dm-box{background:#f5efe3}#boatPg.dm-box>.dm{max-width:1500px!important;margin:0 auto}
}
.dm{padding:0 34px 50px;color:#1d2730;font:15px/1.55 -apple-system,"PingFang SC",sans-serif}
.dm button{font:inherit}
.dm-top{display:flex;align-items:center;gap:18px;padding:16px 0;position:sticky;top:0;background:rgba(245,239,227,.94);backdrop-filter:blur(8px);z-index:5}
.dm-top h1{font:700 30px/1 "Cormorant Garamond",Georgia,serif;letter-spacing:.2em;margin:0}
.dm-iss{font:600 13px/1.3 "Cormorant Garamond",Georgia,serif;letter-spacing:.12em;color:#7a705e}
.dm-search{all:unset;cursor:pointer;flex:1;max-width:420px;margin-left:auto;background:#fff;border:1px solid #e0d4bc;border-radius:99px;padding:9px 16px;color:#a0957f;font-size:14px}
.dm-streak{background:#fff3e6;border:1.5px solid #f5c08a;color:#b65c12;border-radius:99px;padding:5px 12px;font-size:13px;font-weight:700}
.dm-av{all:unset;cursor:pointer;width:40px;height:40px;border-radius:50%;background:#efe1c4;display:grid;place-items:center;font-size:20px}
.dm-sec{display:flex;align-items:baseline;gap:12px;margin:30px 0 14px}.dm-sec h2{margin:0;font:900 23px/1 "Noto Serif SC","Songti SC",serif}.dm-sec small{color:#7a705e}.dm-sec .more{all:unset;cursor:pointer;margin-left:auto;font-size:13px;color:#e0603a;font-weight:700}
.dm-a{display:grid;grid-template-columns:2.1fr 1fr;gap:22px;margin-top:6px}
.dm-tw{position:relative;height:500px;border-radius:18px;overflow:hidden;background:#222;color:#fff}
.dm-sl{position:absolute;inset:0;opacity:0;transition:opacity 1.2s}.dm-sl.on{opacity:1}.dm-sl .bg{position:absolute;inset:-3%;background:center/cover}.dm-sl.on .bg{animation:dmkb 9s ease-out forwards}@keyframes dmkb{to{transform:scale(1.08)}}
.dm-tw::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),transparent 30%,transparent 42%,rgba(0,0,0,.88));pointer-events:none}
.dm-tx{position:absolute;left:30px;right:30px;bottom:24px;z-index:2}.dm-tx .k{font-size:12px;font-weight:800;letter-spacing:.16em;color:#ffcf8a}
.dm-tx h3{font:900 30px/1.25 "Noto Serif SC","Songti SC",serif;margin:8px 0 14px;max-width:780px}
.dm-tx .ops{display:flex;gap:10px;flex-wrap:wrap}.dm-tx .ops button{all:unset;cursor:pointer;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.4);border-radius:99px;padding:7px 18px;font-weight:700}.dm-tx .ops button:hover{background:rgba(255,255,255,.3)}.dm-tx .ops button.ok{background:#2f9e5b;border-color:#2f9e5b}.dm-tx .ops button.no{opacity:.4}
.dm-tx .why{display:none;margin-top:12px;font-size:14.5px;max-width:780px}.dm-tx .why.on{display:block;animation:dmfu .5s}.dm-tx .say{font:600 italic 22px "Cormorant Garamond",Georgia,serif}
.dm-tx .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.dm-tx .acts button{all:unset;cursor:pointer;background:#fff;color:#14305c;border-radius:99px;padding:6px 14px;font-weight:700;font-size:13.5px}.dm-tx .acts button:first-child{background:#e0603a;color:#fff}
.dm-dots{position:absolute;top:22px;right:24px;z-index:2;display:flex;gap:8px}.dm-dots i{width:30px;height:4px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden;cursor:pointer}.dm-dots i b{display:block;height:100%;width:0;background:#fff}.dm-dots i.on b{animation:dmbar 8s linear forwards}@keyframes dmbar{to{width:100%}}
.dm-lbl{position:absolute;top:20px;left:30px;z-index:2;font:600 14px/1 "Cormorant Garamond",Georgia,serif;letter-spacing:.25em}
.dm-globe{border-radius:18px;background:radial-gradient(circle at 50% 40%,#1e3d6b,#0c1b33);color:#fff;overflow:hidden;display:flex;flex-direction:column;height:500px}
.dm-globe svg{flex:1;width:100%;min-height:0}.dm-globe .gh{padding:16px 18px 0;font-size:12px;font-weight:800;letter-spacing:.14em;color:#9fc0e6}.dm-globe .gf{padding:0 18px 16px;font-size:13px;color:#c9d4e6}.dm-globe .gf b{color:#fff}
.dm-globe .sph{fill:#173057}.dm-globe .lnd{fill:#e9dfc5;stroke:#cdbb92;stroke-width:.3}.dm-globe .grat{fill:none;stroke:rgba(255,255,255,.06)}.dm-globe .gp{fill:#e0603a;stroke:#fff;stroke-width:1.5}.dm-globe .gp.f{fill:#5fb3e8}
.dm-rail{display:flex;gap:16px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x mandatory}
.dm-tc.dm-lead{height:500px;border-radius:18px}.dm-tc.dm-lead:hover{transform:none}.dm-tc.dm-lead h4{font-size:40px;margin-bottom:14px}.dm-tc.dm-lead .is,.dm-tc.dm-lead .wy{font-size:14px;left:20px}.dm-tc.dm-lead .is{top:18px}.dm-tc.dm-lead .wy{top:50px}.dm-tc.dm-lead .bt{left:24px;right:24px;bottom:24px}.dm-tc.dm-lead .who{font-size:16px;max-width:620px;padding:12px 14px}
.dm-tc{flex:0 0 280px;height:380px;border-radius:16px;overflow:hidden;position:relative;cursor:pointer;scroll-snap-align:start;background:#333;color:#fff;transition:transform .3s}.dm-tc:hover{transform:translateY(-4px)}
.dm-tc video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.dm-tc::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.4),transparent 30%,transparent 45%,rgba(0,0,0,.88))}
.dm-tc .is{position:absolute;top:12px;left:12px;z-index:2;font-size:12px;font-weight:800;background:rgba(0,0,0,.35);border-radius:99px;padding:3px 10px}
.dm-tc .wy{position:absolute;top:40px;left:12px;z-index:2;font-size:11.5px;background:#f4f1ea;color:#13243a;border-radius:99px;padding:2px 9px;font-weight:700}
.dm-tc .bt{position:absolute;left:14px;right:14px;bottom:14px;z-index:2}.dm-tc h4{margin:0 0 8px;font:900 20px/1.2 "Noto Serif SC","Songti SC",serif}
.dm-tc .who{display:flex;gap:8px;align-items:flex-start;background:rgba(255,253,248,.95);color:#1d2730;border-radius:12px;padding:8px 10px;font-size:13px;line-height:1.35}.dm-tc .who i{font-style:normal;font-size:20px}.dm-tc .who small{display:block;color:#7a705e;font-size:11px}
.dm-c{display:grid;grid-template-columns:1.25fr 1fr .95fr;gap:24px}
.dm-post{background:#fffdf8;border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06);cursor:pointer;transition:box-shadow .3s}.dm-post:hover{box-shadow:0 6px 20px rgba(0,0,0,.12)}
.dm-post .ph{height:230px;background:center/cover}.dm-post .b{padding:12px 16px 14px}.dm-post .h{display:flex;gap:10px;align-items:center;margin-bottom:6px}.dm-post .h img{width:38px;height:38px;border-radius:50%;background:#efe1c4}
.dm-post .h b{font-size:14px}.dm-post .h small{display:block;color:#7a705e;font-size:11.5px}.dm-post p{margin:0;font-size:15px}.dm-post .z{color:#7a705e;font-size:13px;margin-top:3px}
.dm-post .tg{display:inline-block;margin-top:8px;font-size:12px;background:#eef3fa;color:#2d5fa0;border-radius:99px;padding:1px 9px;font-weight:700}
.dm-live{background:#fffdf8;border-radius:16px;padding:6px 16px;box-shadow:0 1px 4px rgba(0,0,0,.06);height:720px;overflow:hidden;position:relative}.dm-live::after{content:"";position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(transparent,#fffdf8)}
.dm-live .ln{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #e0d4bc;animation:dmfu .6s;cursor:pointer}.dm-live .ln i{font-style:normal;flex:0 0 36px;height:36px;border-radius:50%;background:#efe1c4;display:grid;place-items:center;font-size:18px}
.dm-live .ln b{font-size:12.5px}.dm-live .ln b small{font-weight:400;color:#7a705e}.dm-live .ln div div{font-size:14.5px}.dm-live .ln .z{font-size:12.5px!important;color:#7a705e}
@keyframes dmfu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.dm-boat{background:radial-gradient(rgba(20,48,92,.11) .9px,transparent 1.1px) 0 0/16px 16px,#efe5d0;border-radius:16px;padding:18px;color:#14305c;margin-bottom:18px}
.dm-boat .d{font:900 23px/1.1 "Noto Serif SC","Songti SC",serif;margin:0 0 12px}
.dm-boat .it{display:flex;gap:10px;align-items:center;background:#fbf7ee;border:1px solid #e6d9bb;border-radius:10px;padding:8px 10px;margin-bottom:6px;font-size:14px}.dm-boat .it i{font-style:normal}.dm-boat .it small{display:block;font-size:11.5px;color:#6b7488}
.dm-boat .go{all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;text-align:center;background:#e0603a;color:#fff;border-radius:99px;padding:9px;font-weight:800;margin-top:8px}
.dm-me{background:#fffdf8;border-radius:16px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.06);cursor:pointer}.dm-me .h{display:flex;gap:12px;align-items:center}.dm-me .av{width:50px;height:50px;border-radius:50%;background:#efe1c4;display:grid;place-items:center;font-size:24px}
.dm-me .nums{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 8px;text-align:center}.dm-me .nums div{background:#f6efe1;border-radius:10px;padding:8px 0}.dm-me .nums b{display:block;font:700 26px/1 "Cormorant Garamond",Georgia,serif;color:#14305c}.dm-me .nums small{font-size:11px;color:#7a705e}
.dm-none{color:#7a705e}
#dmArt{position:fixed;top:0;right:0;bottom:0;left:84px;z-index:60;overflow-y:auto;background:#f5efe3;color:#1d2730;font:16px/1.7 -apple-system,"PingFang SC",sans-serif;animation:dmArtIn .5s cubic-bezier(.2,.8,.2,1)}@keyframes dmArtIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
@media (max-width:700px){#dmArt{left:0}}
#dmArt button{font:inherit}
#dmArt .ab{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;padding:16px 36px;margin-bottom:-74px;color:#fff;transition:background .4s,color .4s}
#dmArt .ab.solid{background:rgba(245,239,227,.95);color:#1d2730;box-shadow:0 1px 0 #ddd0b5;backdrop-filter:blur(8px)}
#dmArt .ab button{all:unset;cursor:pointer;font-size:14px;font-weight:700;border:1.5px solid currentColor;border-radius:99px;padding:6px 14px}#dmArt .ab button.hot{background:#e0603a;border-color:#e0603a;color:#fff}
#dmArt .ab button.full{display:flex;align-items:center;gap:8px;background:rgba(255,253,248,.96);color:#1d2730;border:0;padding:6px 16px 6px 6px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.25)}#dmArt .ab button.full i{font-style:normal;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#d9ecf5 0 42%,#9fcde4 43%);display:grid;place-items:center;font-size:17px}
#dmArt .ab .t{font:700 15px "Noto Serif SC","Songti SC",serif;opacity:0;transition:opacity .4s}#dmArt .ab.solid .t{opacity:1}#dmArt .ab .r{margin-left:auto;display:flex;gap:10px}
#dmArt .ah{position:relative;height:88vh;min-height:520px;overflow:hidden;color:#fff;background:#222}
#dmArt .ah video,#dmArt .ah .ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:center/cover}#dmArt .ah .ph{animation:dmkb 14s ease-out forwards}
#dmArt .ah::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5),rgba(0,0,0,0) 25%,rgba(0,0,0,.1) 50%,rgba(0,0,0,.85));pointer-events:none}
#dmArt .ah .tx{position:absolute;left:64px;right:64px;bottom:56px;z-index:2;max-width:1000px}
#dmArt .kick{font-size:12.5px;font-weight:800;letter-spacing:.2em;color:#ffcf8a}
#dmArt h1{font:900 104px/1.02 "Noto Serif SC","Songti SC",serif;margin:14px 0 6px}
#dmArt .en{font:600 italic 40px/1.1 "Cormorant Garamond",Georgia,serif;display:flex;align-items:center;gap:14px}
#dmArt .en button,#dmArt .sb{all:unset;cursor:pointer;width:42px;height:42px;border-radius:50%;border:1.5px solid currentColor;display:inline-grid;place-items:center;font-size:16px;font-style:normal;flex:none}
#dmArt .dek{font-size:20px;max-width:760px;margin-top:16px;opacity:.95}
#dmArt .credit{position:absolute;right:24px;bottom:18px;z-index:2;font-size:11.5px;opacity:.65}
#dmArt .ab2{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:64px;max-width:1280px;margin:0 auto;padding:64px 56px 70px}
#dmArt .lede{font:600 23px/1.65 "Noto Serif SC","Songti SC",serif;margin:0 0 26px}#dmArt .lede::first-letter{float:left;font:900 78px/.85 "Noto Serif SC",serif;color:#e0603a;margin:8px 12px 0 0}
#dmArt .en-p{font:600 italic 21px/1.5 "Cormorant Garamond",Georgia,serif;color:#4a5560;margin:-12px 0 30px}
#dmArt .h{font-size:12px;font-weight:800;letter-spacing:.2em;color:#e0603a;margin:38px 0 10px}
#dmArt .today{border-top:3px double #1d2730;border-bottom:3px double #1d2730;padding:26px 0;margin:36px 0}#dmArt .today q{display:block;font:900 28px/1.45 "Noto Serif SC",serif;quotes:"「" "」";color:#14305c}
#dmArt .today .sy{font:600 italic 28px/1.3 "Cormorant Garamond",Georgia,serif;margin-top:14px;display:flex;align-items:center;gap:12px}
#dmArt .fact{background:#fffdf8;border-left:4px solid #e0603a;padding:20px 24px;border-radius:0 12px 12px 0;font-size:17px}#dmArt .fact small{display:block;color:#7a705e;margin-top:8px;font-size:13px}#dmArt .fact a{color:#7a705e}
#dmArt .speak{margin-top:34px;background:#14305c;color:#fff;border-radius:18px;padding:26px 28px;display:flex;align-items:center;gap:22px}
#dmArt .speak .mic{all:unset;cursor:pointer;flex:none;width:72px;height:72px;border-radius:50%;background:#e0603a;display:grid;place-items:center;font-size:30px;box-shadow:0 0 0 10px rgba(224,96,58,.25)}#dmArt .speak .mic.rec{animation:pulse2 1s infinite}@keyframes pulse2{50%{box-shadow:0 0 0 18px rgba(224,96,58,.1)}}
#dmArt .speak div{flex:1}#dmArt .speak small{display:block;font-size:12px;letter-spacing:.18em;color:#ffb08f;font-weight:800}#dmArt .speak b{display:block;font:600 italic 30px/1.2 "Cormorant Garamond",Georgia,serif;margin:4px 0}#dmArt .speak span{opacity:.8}#dmArt .sb.lt{color:#fff}
#dmArt aside{position:sticky;top:90px;align-self:start}
#dmArt .loc{border-radius:18px;overflow:hidden;background:#cfe2ec;position:relative;height:300px}#dmArt .loc svg{width:100%;height:100%}#dmArt .loc .lnd{fill:#f3ead2;stroke:#ddcda4;stroke-width:.5}
#dmArt .loc .pin{position:absolute;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:50%;border:3px solid #fff;background:center/cover;box-shadow:0 0 0 8px rgba(224,96,58,.35)}
#dmArt .loc .go{all:unset;box-sizing:border-box;cursor:pointer;position:absolute;left:14px;right:14px;bottom:14px;background:rgba(255,253,248,.95);border-radius:12px;padding:10px 14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between}
#dmArt .near h4{font-size:12px;font-weight:800;letter-spacing:.2em;color:#e0603a;margin:26px 0 12px}#dmArt .near .g{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#dmArt .near a{display:block;cursor:pointer}#dmArt .near a i{display:block;aspect-ratio:4/3;border-radius:12px;background:#ddd center/cover;margin-bottom:6px;transition:transform .3s}#dmArt .near a:hover i{transform:scale(1.03)}
#dmArt .near b{font:900 16px "Noto Serif SC","Songti SC",serif}#dmArt .near small{display:block;color:#7a705e;font-size:12.5px;line-height:1.45}
#dmArt .af{max-width:1280px;margin:0 auto;padding:26px 56px 70px;display:grid;grid-template-columns:1fr 1fr;gap:20px;border-top:3px double #1d2730}
#dmArt .af a{display:flex;gap:16px;align-items:center;background:#fffdf8;border-radius:16px;padding:14px;cursor:pointer}#dmArt .af a i{flex:0 0 120px;height:84px;border-radius:10px;background:center/cover}#dmArt .af small{display:block;font-size:11.5px;letter-spacing:.14em;font-weight:800;color:#e0603a}#dmArt .af b{font:900 19px "Noto Serif SC","Songti SC",serif}
#dmArt .up{opacity:0;transform:translateY(24px);transition:opacity .8s,transform .8s}#dmArt .up.in{opacity:1;transform:none}
@media (max-width:1000px){#dmArt .ab2{grid-template-columns:1fr}#dmArt h1{font-size:64px}}
@media (min-width:701px){
#card.mag{position:fixed!important;left:84px!important;right:0!important;top:0!important;bottom:0!important;width:auto!important;max-height:none!important;border-radius:0!important;box-shadow:none!important;background:#f5efe3!important;padding:0 0 80px!important;z-index:44;display:grid!important;grid-template-columns:1fr minmax(0,720px) 340px 1fr;column-gap:56px;align-content:start;overflow-y:auto;font-size:16.5px;line-height:1.7}
#card.mag{margin-left:0!important}#card.mag>*{grid-column:2}
#card.mag>.cpane,#card.mag>.stk-word,#card.mag>.pp-row{zoom:1.14}#card.mag>.ctabs{zoom:1.1}
#card.mag>.mag-hero{grid-column:1/-1;grid-row:1;margin:0!important;height:72vh;min-height:460px;position:relative;border-radius:0!important;overflow:hidden;background:#222}
#card.mag>.mag-hero video,#card.mag>.mag-hero img,#card.mag>.mag-hero .ph-i{position:absolute!important;inset:0;width:100%!important;height:100%!important;max-height:none!important;object-fit:cover;border-radius:0!important}
#card.mag>.mag-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 28%,rgba(0,0,0,0) 45%,rgba(0,0,0,.85));pointer-events:none}
#card.mag>.mag-hero a,#card.mag>.mag-hero .ph-c,#card.mag>.mag-hero small{position:absolute;right:20px;bottom:14px;z-index:3;color:rgba(255,255,255,.7)!important;font-size:11.5px}
#card.mag>.c-top{grid-row:1;align-self:end;position:relative;z-index:4;color:#fff;margin:0 0 54px;display:block}
#card.mag-nohero>.c-top{grid-row:auto;color:#1d2730;margin:90px 0 10px}
#card.mag>.c-top .c-emo{display:none}
#card.mag>.c-top h2{font:900 92px/1.02 "Noto Serif SC","Songti SC",serif!important;margin:6px 0 10px!important;color:inherit;text-shadow:0 2px 20px rgba(0,0,0,.25)}
#card.mag-nohero>.c-top h2{text-shadow:none}
#card.mag>.c-top .note{color:inherit!important;opacity:.85;font:600 italic 26px "Cormorant Garamond",Georgia,serif}
#card.mag>.c-top .c-region{color:inherit!important;font-size:13px;font-weight:800;letter-spacing:.16em;opacity:.9}
#card.mag>.c-top .c-cat{font-size:12px;vertical-align:middle}
#card.mag>.mag-x{all:unset;position:fixed;left:108px;top:18px;z-index:50;cursor:pointer;background:rgba(20,30,45,.55);color:#fff;border-radius:99px;padding:8px 16px;font-weight:700;font-size:14px;backdrop-filter:blur(8px)}
#card.mag>.mag-x:hover{background:rgba(20,30,45,.8)}
#card.mag>.mag-full{all:unset;position:fixed;right:28px;top:22px;z-index:50;cursor:pointer;display:flex;align-items:center;gap:10px;background:rgba(255,253,248,.96);color:#1d2730;border-radius:99px;padding:9px 20px 9px 9px;font-weight:800;font-size:16px;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:all .35s cubic-bezier(.2,.8,.2,1)}
#card.mag>.mag-full i{font-style:normal;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#d9ecf5 0 42%,#9fcde4 43%);display:grid;place-items:center;font-size:20px;transition:all .35s}
#card.mag>.mag-full:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.32)}
#card.mag.mag-scrolled>.mag-full{top:14px;right:20px;padding:5px 14px 5px 5px;font-size:13px;box-shadow:0 3px 10px rgba(0,0,0,.18)}#card.mag.mag-scrolled>.mag-full i{width:28px;height:28px;font-size:15px}
#card.mag.mag-scrolled>.mag-x{top:14px}
#card:not(.mag)>.mag-full{display:none}
#card.mag>.stk-word{margin-top:34px;font-size:18px}
#card.mag>.ctabs{position:sticky;top:0;z-index:6;background:rgba(245,239,227,.96);backdrop-filter:blur(8px);margin:22px 0 10px;padding:12px 0 0;border-bottom:3px double #1d2730}
#card.mag>.ctabs button{font-size:15px!important;letter-spacing:.06em}
#card.mag>.cpane{font-size:16.5px}
#card.mag>.cpane .bi-p,#card.mag>.cpane p{font-size:17px;line-height:1.8}
#card.mag>.cpane h3{font:900 24px/1.3 "Noto Serif SC","Songti SC",serif!important;margin:34px 0 12px!important;letter-spacing:0}
#card.mag>.pp-row,#card.mag .pp-row{border-radius:14px!important}
#card.mag>.mag-side{grid-column:3;grid-row:2/span 30;position:sticky;top:76px;align-self:start;margin-top:34px}
#card.mag .mag-side .loc{position:relative;border-radius:18px;overflow:hidden;background:#cfe2ec;aspect-ratio:340/240}#card.mag .mag-side svg{width:100%;height:100%;display:block}#card.mag .mag-side .lnd{fill:#f3ead2;stroke:#ddcda4;stroke-width:.5}
#card.mag .mag-side .pin{position:absolute;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;border:3px solid #fff;background:#fff center/cover;box-shadow:0 0 0 8px rgba(224,96,58,.35);display:grid;place-items:center;font-size:24px}
#card.mag .mag-side .go{all:unset;box-sizing:border-box;cursor:pointer;position:absolute;left:12px;right:12px;bottom:12px;background:rgba(255,253,248,.95);border-radius:12px;padding:9px 13px;font-weight:700;font-size:13.5px;display:flex;justify-content:space-between}
#card.mag .mag-side .flow{all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;margin-top:14px;background:#e0603a;color:#fff;border-radius:14px;padding:12px 16px;font-weight:800;font-size:14.5px}
#card.mag .mag-side h4{font-size:12px;font-weight:800;letter-spacing:.2em;color:#e0603a;margin:24px 0 12px}
#card.mag .mag-side .g{display:grid;grid-template-columns:1fr 1fr;gap:12px}#card.mag .mag-side a{cursor:pointer;display:block}#card.mag .mag-side a i{display:block;aspect-ratio:4/3;border-radius:12px;background:#ddd center/cover;margin-bottom:5px;transition:transform .3s}#card.mag .mag-side a:hover i{transform:scale(1.03)}
#card.mag .mag-side b{font:900 15px "Noto Serif SC","Songti SC",serif}#card.mag .mag-side small{display:block;color:#7a705e;font-size:12px}
body.stk-mag #head,body.stk-mag #ctrl,body.stk-mag #bottom{visibility:hidden}
}
@media (min-width:701px){
#card.npcpage{position:fixed!important;left:84px!important;right:0!important;top:0!important;bottom:0!important;width:auto!important;max-height:none!important;margin-left:0!important;border-radius:0!important;box-shadow:none!important;background:#f5efe3!important;padding:0 0 70px!important;z-index:44;display:block!important;overflow-y:auto;color:#1d2730;font-size:16px;line-height:1.65}
#card.npcpage .np-x{all:unset;position:fixed;left:108px;top:18px;z-index:50;cursor:pointer;background:rgba(20,30,45,.55);color:#fff;border-radius:99px;padding:8px 16px;font-weight:700;font-size:14px;backdrop-filter:blur(8px)}
#card.npcpage .np-map{all:unset;position:fixed;right:28px;top:20px;z-index:50;cursor:pointer;display:flex;align-items:center;gap:8px;background:rgba(255,253,248,.96);border-radius:99px;padding:6px 16px 6px 6px;font-weight:800;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.25)}#card.npcpage .np-map i{font-style:normal;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#d9ecf5 0 42%,#9fcde4 43%);display:grid;place-items:center}
#card.npcpage .np-cover{height:360px;background:#2a3d55 center 40%/cover;position:relative}
#card.npcpage .np-cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,0) 40%,rgba(0,0,0,.25))}
#card.npcpage .np-cover small{position:absolute;right:24px;bottom:14px;z-index:2;color:rgba(255,255,255,.8);font-size:12.5px}
#card.npcpage .np-head{max-width:1180px;margin:-86px auto 0;padding:0 48px;display:flex;gap:30px;align-items:flex-end;position:relative;z-index:3}
#card.npcpage .np-av{flex:0 0 180px;height:180px;border-radius:50%;border:7px solid #f5efe3;background:radial-gradient(circle at 50% 35%,#fde7c9,#f3c9a0);display:grid;place-items:center;box-shadow:0 10px 30px rgba(0,0,0,.18);overflow:hidden}
#card.npcpage .np-av svg{width:70%;height:90%;margin-top:18%}
#card.npcpage .np-who{flex:1;padding-bottom:12px}#card.npcpage .np-who h2{font:900 60px/1 "Noto Serif SC","Songti SC",serif;margin:0}
#card.npcpage .np-meta{color:#7a705e;margin-top:10px;font-size:15px}#card.npcpage .np-badge{display:inline-block;background:#e0603a;color:#fff;border-radius:99px;padding:3px 12px;font-size:13px;font-weight:800;margin-right:8px}
#card.npcpage .np-acts{padding-bottom:16px}#card.npcpage .np-btn{all:unset;cursor:pointer;border-radius:99px;padding:11px 20px;font-weight:800;font-size:15px;background:#e0603a;color:#fff}
#card.npcpage .np-bio{max-width:1180px;margin:22px auto 0;padding:0 48px 26px;display:grid;grid-template-columns:1fr 340px;gap:56px;border-bottom:3px double #1d2730}
#card.npcpage .np-bio p{font:600 21px/1.6 "Noto Serif SC","Songti SC",serif;margin:0}
#card.npcpage .np-knows{font-size:14.5px;color:#4a4436}#card.npcpage .np-knows b{display:block;font-size:12px;letter-spacing:.18em;color:#e0603a;margin-bottom:6px}
#card.npcpage .np-main{max-width:1180px;margin:0 auto;padding:30px 48px 40px;display:grid;grid-template-columns:1fr 340px;gap:56px}
#card.npcpage h3{font-size:12px;font-weight:800;letter-spacing:.2em;color:#e0603a;margin:0 0 14px}
#card.npcpage .np-stop{display:grid;grid-template-columns:84px 1fr;gap:18px;margin-bottom:24px}
#card.npcpage .np-tm{font:700 28px/1 "Cormorant Garamond",Georgia,serif;color:#14305c;padding-top:10px}
#card.npcpage .np-sc{background:#fffdf8;border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06);display:grid;grid-template-columns:240px 1fr}#card.npcpage .np-sc.noph{grid-template-columns:1fr}
#card.npcpage .np-ph{background:#ddd center/cover;min-height:200px;position:relative}#card.npcpage .np-ph .chip{position:absolute;left:12px;bottom:10px;background:rgba(255,253,248,.95)}
#card.npcpage .np-tx{padding:18px 22px}#card.npcpage .np-what{font-size:15px;color:#4a4436;margin-bottom:8px}
#card.npcpage .np-tx q{display:block;font:900 22px/1.45 "Noto Serif SC","Songti SC",serif;quotes:"“" "”";color:#14305c}
#card.npcpage .np-py{color:#7a705e;font-size:14px;margin-top:6px}
#card.npcpage .np-say{all:unset;cursor:pointer;display:inline-block;margin-top:12px;background:#14305c;color:#fff;border-radius:99px;padding:6px 14px;font-size:13px;font-weight:700}
#card.npcpage .np-side{position:sticky;top:76px;align-self:start}
#card.npcpage .np-box{background:#fffdf8;border-radius:18px;padding:18px;margin-bottom:18px;box-shadow:0 2px 10px rgba(0,0,0,.05)}
#card.npcpage .np-fr{display:flex!important;gap:10px;align-items:center;width:100%;text-align:left;margin:0 0 8px!important;border-radius:14px!important;padding:8px 10px!important}#card.npcpage .np-fr span{font-size:26px}#card.npcpage .np-fr b{font:900 16px "Noto Serif SC",serif}#card.npcpage .np-fr small{display:block;color:#7a705e;font-size:12.5px;margin-left:auto;max-width:60%}
#card.npcpage .np-ask{background:#14305c!important;color:#fff}#card.npcpage .np-ask h3{color:#ffb08f}#card.npcpage .np-ask p{font:900 18px/1.45 "Noto Serif SC",serif;margin:0 0 10px}#card.npcpage .np-ask small{display:block;font:500 13px sans-serif;opacity:.7}
}
@media (min-width:701px) and (max-width:1150px){#card.mag{grid-template-columns:28px minmax(0,1fr) 28px;column-gap:0}#card.mag>.mag-side{grid-column:2;grid-row:auto;position:static}#card.mag>.c-top h2{font-size:60px}}
@media (max-width:1150px){.dm-a,.dm-c{grid-template-columns:1fr}.dm-globe{height:380px}.dm-live{height:auto;max-height:520px}}
`;
try { const st = document.createElement("style"); st.textContent = CSS; document.head.append(st); } catch(e){}
try { requestAnimationFrame(() => document.documentElement.classList.add("dk-ready")); } catch(e){ document.documentElement.classList.add("dk-ready"); }   // 电脑版样式加好了，标题这些才露出来（开头那段先盖着）
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


