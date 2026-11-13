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
    ${window.HOWABOUT ? window.HOWABOUT.card() : ""}<div class="hv-echo-slot"></div>${window.ACT ? window.ACT.starter() + window.ACT.todayBar() : ""}${window.WNET ? window.WNET.todayCard() : ""}${window.SNAP ? window.SNAP.card() : ""}${window.WFEED ? window.WFEED.card() : ""}
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
    if (a === "boat"){ window.__deskBoat = true; X.bpOpen(); } else if (a === "me"){ if (window.MYLANG) window.MYLANG.open({}); else X.meOpen(); } else if (a === "people") X.ptOpen(); else if (a === "topics") X.galOpen();
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
    out += `<div class="dw-tw" data-twopen><div class="dw-twh"><b>🌍 ${E(L("今日世界", "World Today"))} #${E(no)}</b><small>${E(done === 3 ? L("今天的 3 张都看完了", "All 3 done today") : L("全世界今天一起看这 3 张", "The whole world sees these 3 today"))}</small></div>
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
window.DESK = {on, html, after, stop: stopAll, article, close: artClose, worldTop, worldList, topics: topicItems};   // topics：手机「今天」也用同一份话题（2026-11-12）

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

/* d89_world_net.js */
/* 世界的网：由 地图源文件/gen_world_net.py 生成，别手改。改 content-skeleton/world_net/ 里的文件再跑一遍。 */


/* hv_mylang.js */
// 🌱 「我说过的话」共用的一段（2026-11-13 用户「可以，放进软件」；样板 样板/世界的网样板.html、地图上的线样板.html、你的语言样板.html 里一模一样的 hvSharedJs）
// 世界的网（world_net.js）、地图上的线（map_lines.js）、你的语言（my_lang.js）共用：六个柜子四十个抽屉、一句话放进哪个抽屉（关键词规则）、
// 手机上的一本 hv.mylang.v1（登录后同步）、真的麦克风（浏览器的语音识别，不行就打字）、回应先接住你的话、「说一句」那个框。
// 对外 window.HVML（不叫 HV：那是登录和数据库）。三页都在 Shadow DOM 里，样式 HVML.CSS 各自放一份。

/* ==== HV_MYLANG 共用（三页样板一模一样的一段：世界的网 · 地图上的线 · 你的语言） ==== */
(function(){
"use strict";
const HV = window.HVML = {};   // 软件里叫 HVML：window.HV 是登录和数据库（backend_shim.js），不能占
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const plain = s => String(s || "").replace(/\[\[([^\]|]+)\]\]/g, "$1").replace(/[\[\]]/g, "");
HV.esc = esc; HV.plain = plain;
/* 界面字：中文界面用中文；西、日、阿先查 UI_L10N（键是中文），没有就用英文（跟 app_notify.js 一样的办法） */
HV.appUI = () => (document.documentElement.lang || "zh").slice(0, 2);
HV.tr = (zh, en, ui) => { if ((ui || "en") === "zh") return zh; const u = HV.appUI(); if (u !== "zh" && u !== "en") { try { const D = window.UI_L10N && window.UI_L10N[u]; if (D && D[zh]) return D[zh]; } catch (e) {} HV.miss(zh, en); } return en; };
HV.gaps = new Map(); HV.miss = (zh, en) => { if (zh && !HV.gaps.has(zh)) HV.gaps.set(zh, en); };   // 西、日、阿还没翻的（window.HVML.gaps 能看到）

/* ---------- 六个柜子、四十个抽屉（跟《你的语言》同一套编号） ---------- */
HV.CABS = [
 {id:"c1",i:"🤝",zh:"跟人打交道",en:"Getting along with people"},
 {id:"c2",i:"💬",zh:"说说事、问问事",en:"Telling & asking"},
 {id:"c3",i:"❤️",zh:"我的心情和看法",en:"How I feel & what I think"},
 {id:"c4",i:"🙋",zh:"请人做事、帮人做事",en:"Asking for & giving a hand"},
 {id:"c5",i:"🧵",zh:"把话说顺",en:"Making the talk flow"},
 {id:"c6",i:"🔧",zh:"听不懂时救场",en:"When you get lost"}];
// [号, 柜子, 中文名, 英文名, 中文「在说什么」, 英文「在说什么」]
HV.DR = [
 [1,"c1","打招呼","Saying hi","这是在打招呼","They're saying hi"],
 [2,"c1","寒暄、闲聊开个头","Small talk, getting a chat going","这是在闲聊、开个头","They're getting a little chat going"],
 [3,"c1","介绍自己、介绍别人","Introducing yourself & others","这是在介绍自己","They're introducing themselves"],
 [4,"c1","道别","Saying bye","这是在道别","They're saying bye"],
 [5,"c1","道谢、回应别人的谢","Thanks & you're welcome","这是在道谢","They're saying thanks"],
 [6,"c1","道歉、回应别人的道歉","Sorry & that's OK","这是在道歉","They're saying sorry"],
 [7,"c1","祝贺、祝福","Congrats & good wishes","这是在祝贺、祝福","They're wishing someone well"],
 [8,"c1","安慰、表示同情","Comforting someone","这是在安慰人","They're comforting someone"],
 [9,"c1","邀请、答应或推掉","Inviting, yes or no thanks","这是在约人","They're inviting someone"],
 [10,"c2","说自己的事","Talking about me","这是在说自己的日子","They're talking about their own days"],
 [11,"c2","讲一段经历、讲个故事","Telling a story","这是在讲一件发生过的事","They're telling something that happened"],
 [12,"c2","描述一样东西、一个地方","Describing a thing or place","这是在描述一样东西、一个地方","They're describing a thing or a place"],
 [13,"c2","问事情","Asking things","这是在问事情","They're asking something"],
 [14,"c2","好奇别人的事（怎么问才不冒犯）","Curious about someone (asking nicely)","这是想了解对方","They want to know about the other person"],
 [15,"c2","纠正：「其实不是这样」","“Actually, it's not like that”","这是在轻轻纠正：其实不是这样","They're gently saying “actually, no”"],
 [16,"c3","开心、兴奋","Happy, excited","这是在说开心","They're happy about it"],
 [17,"c3","难过、失望","Sad, let down","这是在说难过","They're sad about it"],
 [18,"c3","担心、害怕","Worried, scared","这是在说担心","They're worried"],
 [19,"c3","生气、不满、抱怨","Annoyed, complaining","这是在抱怨","They're complaining a bit"],
 [20,"c3","惊讶","Surprised","这是在说吃惊","They're surprised"],
 [21,"c3","喜欢、不喜欢","Like, don't like","这是在说喜欢不喜欢","They're saying what they like"],
 [22,"c3","我觉得……（说看法）","I think…","这是在说看法","They're giving their view"],
 [23,"c3","同意、不同意","Agree, disagree","这是在说同意不同意","They're agreeing (or not)"],
 [24,"c3","不确定、拿不准","Not sure","这是在说拿不准","They're not sure"],
 [25,"c3","想要、打算","Want, plan to","这是在说想做什么","They're saying what they want to do"],
 [26,"c3","希望、盼着","Hoping, looking forward","这是在说盼着","They're looking forward to something"],
 [27,"c3","后悔、可惜","Regret, what a shame","这是在说可惜","They're saying it's a shame"],
 [28,"c3","无所谓、都行","Either is fine","这是在说都行","They're saying either is fine"],
 [29,"c4","请人帮忙","Asking for help","这是在请人帮忙","They're asking for a hand"],
 [30,"c4","建议、出主意","Suggesting","这是在出主意","They're suggesting something"],
 [31,"c4","主动帮忙","Offering help","这是在说「我来帮你」","They're offering to help"],
 [32,"c4","关心一下、提醒一下","Looking out, a heads-up","这是在提醒一下","They're giving a heads-up"],
 [33,"c4","鼓励、打气","Cheering someone on","这是在打气","They're cheering someone on"],
 [34,"c4","拒绝，又不伤人","Saying no nicely","这是在客气地说不","They're saying no nicely"],
 [35,"c5","想一想、拖一下","Buying a second to think","这是在想一想、拖一下","They're buying a second to think"],
 [36,"c5","换个话题、接着刚才说","Changing topic, going back","这是在接着刚才的话说","They're picking up the thread"],
 [37,"c5","举个例子、打个比方","Giving an example","这是在举例子","They're giving an example"],
 [38,"c5","开玩笑、接梗","Joking around","这是在开玩笑","They're joking"],
 [39,"c6","没听懂，请再说一遍、说慢一点","“Sorry, again? Slower?”","这是在说没听懂","They didn't catch it"],
 [40,"c6","不知道那个词，绕着说","Talking around a missing word","这是在绕着说一个想不起来的词","They're talking around a word they don't know"]];
HV.dr = n => HV.DR.find(r => r[0] === +n);
HV.drName = (n, ui) => { const r = HV.dr(n); return r ? (ui === "zh" ? r[2] : r[3]) : ""; };
HV.drGist = (n, ui) => { const r = HV.dr(n); return r ? (ui === "zh" ? r[4] : r[5]) : ""; };

/* ---------- 一句话自动放进哪个抽屉（样板：关键词规则；真软件里换成 AI 判断） ---------- */
/* 「喜欢」：looks like / feel like / like a 都不算——分抽屉和回应用同一套 */
const LIKE_RX = /(?<!\b(?:looks?|seems?|sounds?|feels?|just|more|something) )\blike\b(?! (?:a|an|the|this|that)\b)|\blove\b|favou?rite|\benjoy/i;
const RULES = {
 zh: {1:[/你好|您好|嗨|哈喽|早上好|晚上好|早啊|吃了吗/],2:[/最近怎么样|最近好吗|最近忙吗|今天好热|今天好冷|天气/],3:[/我叫|我来自|我是.{1,10}的|我是.{1,6}人|介绍一下/],
  4:[/再见|拜拜|回头见|下次见|先走了|晚安|慢走/],5:[/谢谢|多谢|感谢|谢啦|不客气/],6:[/对不起|不好意思|抱歉|没关系/],7:[/恭喜|祝你|生日快乐|新年快乐/],
  8:[/别难过|没事的|会好的|辛苦了|抱抱|我懂你/],9:[/一起去|要不要一起|有空吗|我请你|改天一起/],10:[/我每天|我平时|我常常|周末我|我住在|我在.{1,6}(上班|工作|上学|读书)/],
  11:[[/第一次|那时候|那天|小时候|有一次|后来|刚到|以前|记得/,1.2]],12:[/看起来|长得|颜色|里面有|那个地方|很大|很小/],13:[[/[？?]/,.6],/为什么|怎么|什么|哪儿|哪里|多少|吗$/],
  14:[/你(是|在|怎么|为什么|喜欢|平时|家|们那儿).{0,12}[？?吗]/],15:[[/其实|并不是|没那么|不是.{1,8}而是/,1.3]],16:[/开心|高兴|太好了|好棒|好好玩|兴奋|爱死了/],17:[/难过|伤心|失望|哭/],
  18:[/担心|害怕|怕|紧张|不安/],19:[/受不了|好烦|讨厌|不满|太(贵|甜|累|吵|辣|慢|挤)了/],20:[[/没想到|竟然|居然|原来|真的吗|天哪|一直以为|我以为/,1.4]],21:[/喜欢|爱看|爱吃|最爱|最记得/],
  22:[/我觉得|我认为|我看(?![过了到见完])|说句实话|说实话/],23:[/我也是|我也这么|同意|没错|对啊|不一定|一样/],24:[/不知道|不确定|可能|也许|好像|说不定|大概/],25:[/我想|我要|打算|准备|想去|想学/],
  26:[/希望|盼着|等不及|期待/],27:[/可惜|后悔|早知道|错过/],28:[/都行|无所谓|随便|都可以/],29:[/能不能帮|可以帮我|帮我|麻烦你/],30:[/你可以|要不|建议|不如|最好|试试/],
  31:[/我来帮|我帮你|需要帮忙/],32:[/小心|注意|别忘了|记得(要|带|给|别)/],33:[/加油|你可以的|别怕|慢慢来/],34:[/不了，|下次吧|不用了|不太想/],35:[/^嗯|让我想想|怎么说呢/],
  36:[/对了|说到|话说|我补一句/],37:[/比如|例如|就像|像.{1,12}一样/],38:[/哈哈|开玩笑|笑死/],39:[/没听懂|再说一遍|说慢一点|什么意思|听不懂/],40:[/就是那个|那种.{1,6}的东西|叫什么来着/]},
 en: {1:[/^(hi|hello|hey)\b|good morning|what'?s up|you alright/i],2:[/how'?s it going|how are you|lovely weather|how was your/i],3:[/my name is|i'?m from|i am from|let me introduce|i work as/i],
  4:[/\bbye\b|see you|good night|take care|talk soon/i],5:[/thank|cheers|you'?re welcome|no worries/i],6:[/\bsorry\b(?! for)|apolog|my bad|excuse me/i],7:[/congrat|happy birthday|well done|best wishes|good luck/i],
  8:[/that'?s (so )?hard|sorry to hear|it'?ll be ok|hang in there/i],9:[/want to come|shall we|let'?s go|join me|are you free/i],10:[/i usually|every day i|i live in|on weekends|i work (at|in|on)/i],
  11:[[/i remember|the first time|when i was|one time|back then|years ago|last (year|week|summer)|when i (first )?(came|moved|arrived)/i,1.2]],12:[/looks like|it'?s (big|small|tiny|huge|full)|the place is/i],
  13:[[/\?/,.6],/^(what|why|how|where|when|who|which|is|are|do|does|can)\b/i],14:[/\b(you|your)\b[^?]*\?/i],15:[[/actually|not really|in fact|it'?s not/i,1.3]],16:[/happy|glad|so fun|awesome|love it|excited/i],
  17:[/\bsad\b|cried|disappoint|upset|sorry for/i],18:[/worr|scared|afraid|nervous/i],19:[/too (sweet|expensive|much|loud|spicy|slow)|annoy|can'?t stand|\bhate\b/i],20:[[/no way|really\?|\bwow\b|i didn'?t know|i always thought|surpris|can'?t believe/i,1.4]],
  21:[LIKE_RX],22:[/i think|in my opinion|honestly|i feel like|i reckon/i],23:[/me too|same here|i agree|exactly|i disagree|so do i/i],24:[/not sure|maybe|perhaps|i guess|probably|i don'?t know/i],
  25:[/i want|i'?d like to|i'?m going to|planning|i plan/i],26:[/\bhope|can'?t wait|looking forward/i],27:[/shame|pity|regret|wish i had|missed/i],28:[/either|whatever|doesn'?t matter|i don'?t mind/i],
  29:[/could you|can you help|would you mind|please/i],30:[/you could|you should|why not|how about|try it/i],31:[/i'?ll help|let me help|i can show/i],32:[/careful|watch out|don'?t forget|remember to/i],
  33:[/you can do it|go for it|keep going|you'?ve got this/i],34:[/no thanks|next time|i'?ll pass|i'?d rather not/i],35:[/^(um|hmm|erm)|let me think|how do i put it/i],36:[/by the way|speaking of|anyway|back to/i],
  37:[/for example|like when|such as|just like/i],38:[/haha|\blol\b|kidding|\bjoke/i],39:[/say that again|slower|what do you mean|didn'?t catch/i],40:[/the thing that|what'?s it called|you know, the/i]}};
HV.classify = (text, lg, kind) => {
  const R = RULES[lg] || RULES.en, s = String(text || "").trim(), sc = {};
  Object.entries(R).forEach(([n, rs]) => rs.forEach(r => { const [rx, w] = Array.isArray(r) ? r : [r, 1]; if (rx.test(s)) sc[n] = (sc[n] || 0) + w; }));
  const top = Object.keys(sc).map(Number).sort((a, b) => sc[b] - sc[a] || a - b);
  const out = top.slice(0, 2).filter((n, i) => i === 0 || sc[n] >= 1);
  if (!out.length && kind !== "strict") out.push(kind === "ask" ? 13 : kind === "story" ? 11 : kind === "think" ? 22 : 10);
  return kind === "strict" ? out.slice(0, 1) : out;
};
/* 别人的话（网上的公开聊）属于哪个抽屉：先看内容编辑写的 fn，没有就按关键词严格地猜一个 */
HV.fnOf = m => m.fn ? [].concat(m.fn).map(Number) : [];

/* ---------- 三页共用的一本「我说过的话」：localStorage hv.mylang.v1 ---------- */
const KEY = "hv.mylang.v1";
HV.KEY = KEY;
HV.load = () => { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && Array.isArray(d.items)) return d; } catch (e) {} return {v: 1, items: [], seenDr: []}; };
HV.save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); try { window.hvSyncMark && window.hvSyncMark(KEY); } catch (e) {} return true; } catch (e) { return false; } };   // 登录后同步到账号（template2 的 SYNC_KEYS 里有它）
HV.items = lg => HV.load().items.filter(x => !lg || x.lg === lg);
HV.add = it => { const d = HV.load(); it.id = it.id || "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); it.who = "me"; it.when = it.when || new Date().toISOString(); d.items.push(it); HV.save(d); return it; };
HV.update = (id, patch) => { const d = HV.load(); const it = d.items.find(x => x.id === id); if (it) { Object.assign(it, patch); HV.save(d); } return it; };
HV.when = (iso, ui) => { try { const d = new Date(iso); return ui === "zh" ? `${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString("en-GB", {day: "numeric", month: "short"}); } catch (e) { return ""; } };
/* 页面之间怎么回去（软件里）：每一句的来源记成一个小记号，点了交给 HV.nav 打开那一页
   net:open=点&th=那段聊 · net:line=线 · map:g=贴纸&via=线 · me:dr=抽屉 */
HV.url = src => {
  if (!src) return "";
  if (src.page === "map") return "map:" + (src.g ? "g=" + encodeURIComponent(src.g) + (src.line ? "&via=" + encodeURIComponent(src.line) : "") : "line=" + encodeURIComponent(src.line || ""));
  if (src.page === "net") return "net:" + (src.line ? "line=" + encodeURIComponent(src.line) : "open=" + encodeURIComponent(src.node || "")) + (src.thread ? "&th=" + encodeURIComponent(src.thread) : "") + (src.qa ? "&qa=" + encodeURIComponent(src.qa) : "");
  return "";
};
HV.parse = s => { const o = {}; String(s || "").replace(/^[a-z]+:/, "").split("&").forEach(kv => { const i = kv.indexOf("="); if (i > 0) o[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); }); return o; };
HV.nav = tok => { tok = String(tok || ""); const k = tok.split(":")[0], o = HV.parse(tok);
  if (k === "net" && window.WNET) return window.WNET.open(o);
  if (k === "map" && window.MAPL) return window.MAPL.open(o);
  if (k === "me" && window.MYLANG) return window.MYLANG.open(o); };
HV.goMe = o => { if (window.MYLANG) window.MYLANG.open(o || {}); };
HV.hash = () => { const o = {}; String(location.hash || "").replace(/^#/, "").split("&").forEach(kv => { const i = kv.indexOf("="); if (i > 0) o[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); }); return o; };

/* ---------- 麦克风：Chrome 的语音识别，识别到的字实时显示；不支持就退回打字 ---------- */
HV.micOK = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
HV.LANGCODE = {zh: "zh-CN", en: "en-US", pt: "pt-BR", es: "es-MX"};
HV.listen = (lg, on) => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { on.fail && on.fail("unsupported"); return null; }
  let r, fin = "", done = false;
  try { r = new SR(); } catch (e) { on.fail && on.fail("unsupported"); return null; }
  r.lang = HV.LANGCODE[lg] || lg; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  r.onresult = e => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t; else interim += t; } on.text && on.text(fin + interim, !interim); };
  r.onerror = e => { done = true; on.fail && on.fail(e.error || "error"); };
  r.onend = () => { if (!done) { done = true; on.end && on.end(fin.trim()); } };
  try { r.start(); on.start && on.start(); } catch (e) { on.fail && on.fail("start"); return null; }
  return {stop: () => { try { r.stop(); } catch (e) {} }};
};
const MICERR = {unsupported: ["这个浏览器听不了，请打字。", "This browser can't listen — please type it."], "not-allowed": ["没拿到麦克风的许可，请打字，或者在浏览器里允许麦克风。", "No microphone permission — type it, or allow the mic in your browser."],
  "no-speech": ["没听到声音。再按一下说，或者打字。", "Didn't hear anything. Tap and try again, or type it."], network: ["语音识别要联网，现在连不上，请打字。", "Speech recognition needs the internet and couldn't connect — please type it."],
  "audio-capture": ["没找到麦克风，请打字。", "No microphone found — please type it."]};
HV.micErr = (code, ui) => { const m = MICERR[code] || [`麦克风没用上（${code}），请打字。`, `The mic didn't work (${code}) — please type it.`]; return HV.tr(m[0], m[1], ui); };

/* ---------- 回应：先接住用户的话，再接一句跟这一页有关的；没有合适的就照实说 ---------- */
function swapZh(s){ return s.replace(/我们/g, "\u0001").replace(/你们/g, "\u0002").replace(/我/g, "\u0003").replace(/你/g, "我").replace(/\u0003/g, "你").replace(/\u0001/g, "你们").replace(/\u0002/g, "我们"); }
function swapEn(s){
  const m = {"i'm":"you're","i am":"you are","i've":"you've","i was":"you were","i":"you","me":"you","my":"your","mine":"yours","myself":"yourself","we":"you","our":"your","us":"you"};
  return s.replace(/\b(i'm|i am|i've|i was|i|me|my|mine|myself|we|our|us)\b/gi, w => m[w.toLowerCase()] || w);
}
HV.echo = (text, lg, kind) => {
  const orig = plain(text).trim();
  if (kind === "ask" && !/[？?]|吗|为什么|怎么|什么|哪|几|多少|^(what|why|how|where|when|who|which|is|are|do|does|can)\b/i.test(orig)) kind = "think";   // 没真问，就别说「你问的是」
  let s = orig.replace(/[。！？!?.…~～]+$/, "");
  if (lg === "zh") {
    if ([...s].length < 6 || /^(有|没有|说不好)/.test(s)) return {t: "", tr: "", short: 1};   // 很短的回答不复述，直接接着回
    s = swapZh(s).replace(/[。！？]\s*/g, "，");
    if (kind === "ask") return /吗$/.test(s) ? {t: `你是问${s}？`, tr: `You asked: “${orig}”`} : {t: `你问的是${s}。`, tr: `You asked: “${orig}”`};
    return {t: `你说${s}。`, tr: `You said: “${orig}”`};
  }
  if (kind === "ask") return {t: `You asked: “${orig}”`, tr: `你问：「${orig}」`};
  s = swapEn(s.replace(/^(yes|no|yeah|oh|well)\b[,!.]?\s*/i, "")).replace(/^([A-Z])(?=[a-z' ]|$)/, c => c.toLowerCase());
  s = s.replace(/([.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());   // 句点后面大写
  return {t: /^so\b/i.test(s) ? s.charAt(0).toUpperCase() + s.slice(1) + "." : `So ${s}.`, tr: `你说：「${orig}」`};
};
/* 接住用户说的那件事：一句反应 + 一句跟这件事有关的反问（关键词规则，真软件换 AI） */
const REACT = {
  zh: {who: [[/朋友|同学|同事/, "和朋友一起，更热闹！"], [/家里|家人|妈妈|爸爸|父母|孩子|奶奶|爷爷|妹妹|哥哥|姐姐|弟弟/, "跟家里人一起，真好。"], [/一个人(?!的)/, "一个人也挺自在的。"]],
       q: [[/电影|电影院|看片|剧/, "看完以后，一般会去吃点什么吗？"], [/做饭|自己做|在家做|在家|做了|做的/, "你常自己做饭吗？"], [/常常|经常|每周|每天|平时|一般|总是/, "一般跟谁去？"], [/吃|喝|面|茶|饭|咖啡|菜|汤/, "你一般点什么？"], [/去|想去|打算|明年|下次|旅行/, "打算什么时候去？"], [/喜欢|最爱|好看|好吃|好喝/, "最喜欢哪一点？"], [/第一次|以前|小时候|那时候|记得/, "那时候几岁？"], [/觉得|认为/, "为什么这么觉得？"]],
       feel: [[/喜欢|最爱|好看|好吃|好喝|太好了/, "听起来你很喜欢！"], [/第一次|小时候|记得|以前/, "真是很好的回忆。"], [/想|打算/, "听起来不错！"], [/觉得|认为/, "有意思。"]],
       ask: "好问题。我也不确定，住在这儿的人可能知道——要不要问问？", more: "能多说一点吗？"},
  en: {who: [[/\b(friends?|mates?|classmates?|colleagues?)\b/i, "With friends — even better!"], [/\b(family|mum|mom|dad|parents|kids?|gran|grandma|grandpa|brothers?|sisters?)\b/i, "With family — that's lovely."], [/\b(alone|by myself|on my own)\b/i, "On your own can be nice too."]],
       q: [[/\b(film|films|movie|movies|cinema|show|series)\b/i, "Do you usually grab something to eat afterwards?"], [/\b(cook|cooks|cooked|cooking|made|make|at home)\b/i, "Do you often cook for yourself?"], [/\b(usually|often|every (?:day|week)|normally|always)\b/i, "Who do you usually go with?"], [/\b(eat|ate|drink|food|tea|coffee|noodles?|soup|dish)\b/i, "What do you usually order?"], [/\b(go|going|visit|trip|travel|plan|next year)\b/i, "When are you thinking of going?"], [LIKE_RX, "What do you like most about it?"], [/\b(first time|when i was|used to|remember)\b/i, "How old were you then?"], [/\b(i think|i feel|i reckon)\b/i, "What makes you think so?"]],
       feel: [[/\b(love|favou?rite|enjoy|amazing|great)\b/i, "Sounds like you really love it!"], [/\b(first time|when i was|remember)\b/i, "What a nice memory."], [/\b(want|plan|hope)\b/i, "Sounds great!"], [/\b(think|reckon)\b/i, "Interesting."]],
       ask: "Good question. I'm not sure either — someone who lives here might know. Want to ask?", more: "Tell me a bit more?"}};
/* 情绪别接反（检查员 2026-11-13）：先认否定（不、没、别、讨厌 / don't、not、never），再认负面的词（怕、难过、累、无聊 / scared、sad、tired、boring）。
   碰到就不说「听起来你很喜欢」「真好的回忆」「和朋友一起更热闹」，用中性的接法 */
const NEG = {zh: /(?<!差)不(?!错|好意思|用谢|过|一样)|没(?!想到|关系|事)|别(?!人|的|处)|讨厌/, en: /\b(don'?t|didn'?t|doesn'?t|not|never|no)\b|n't\b/i};
const SAD = {zh: /怕|难过|累|无聊|烦|伤心|失望|担心|孤单|生气/, en: /\b(boring|bored|scared|afraid|sad|tired|lonely|upset|angry|worried|hate)\b/i};
const CALM = {zh: ["这样啊。是哪一点让你这么觉得？", "I see. What made you feel that way?"], en: ["I see. What made you feel that way?", "这样啊。是哪一点让你这么觉得？"]};
/* 「不错」「还行」「not bad」算好话，先拿掉再看 */
const OKISH = /not bad|not too bad|不错|还行|还可以|没那么糟/gi;
const t0 = text => plain(text).replace(OKISH, "");
const negOf = (t, lg) => (NEG[lg] || NEG.en).test(t) || (lg !== "zh" && NEG.zh.test(t));
const sadOf = (t, lg) => (SAD[lg] || SAD.en).test(t) || (lg !== "zh" && SAD.zh.test(t));
HV.mood = (text, lg) => { const t = t0(text); return negOf(t, lg) || sadOf(t, lg); };
/* 还没做过（没看过 / haven't seen）：不安慰，问一句「想吗」 */
const NOTYET = {zh: [[/没(有)?看过/, ["想看吗？那你平时看什么？", "Would you like to? What do you usually watch?"]], [/没(有)?去过/, ["想去吗？", "Would you like to go?"]], [/没(有)?(吃|喝)过/, ["想尝尝吗？", "Would you like to try it?"]], [/没(有)?(听|试|玩|做)过/, ["想试试吗？", "Would you like to give it a try?"]]],
  en: [[/\b(haven'?t|have not|never|didn'?t)\b.*\b(seen|watched|see|watch)\b/i, ["Would you like to? What do you usually watch?", "想看吗？那你平时看什么？"]], [/\b(haven'?t|have not|never)\b.*\bbeen\b/i, ["Would you like to go?", "想去吗？"]], [/\b(haven'?t|have not|never|didn'?t)\b.*\b(tried|eaten|had|try|eat|played|heard)\b/i, ["Would you like to give it a try?", "想试试吗？"]]]};
/* 说的是感受（喜欢不喜欢、好不好）才用中性的接法 */
const FEELW = {zh: /喜欢|爱|好看|好吃|好喝|有意思|好玩|开心|舒服|习惯/, en: /\b(like|love|enjoy|good|fun|interesting|great|nice|into)\b/i};
HV.react = (text, lg, kind) => {
  const R = REACT[lg] || REACT.en, O = REACT[lg === "zh" ? "en" : "zh"], t = plain(text);
  const asked = kind === "ask" || /[？?]\s*$/.test(t);
  const pick = (arr, oarr) => { const i = arr.findIndex(([rx]) => rx.test(t)); return i < 0 ? null : [arr[i][1], oarr[i] ? oarr[i][1] : ""]; };
  if (asked) return {t: R.ask, tr: O.ask, ask: 1};
  const tt = t0(t), neg = negOf(tt, lg), sad = sadOf(tt, lg);
  const ny = (NOTYET[lg] || NOTYET.en).find(([rx]) => rx.test(tt)); if (ny) return {t: ny[1][0], tr: ny[1][1], notyet: 1};
  if (sad || (neg && (FEELW[lg] || FEELW.en).test(tt))) { const c = CALM[lg] || CALM.en; return {t: c[0], tr: c[1], calm: 1}; }
  const w = neg ? null : pick(R.who, O.who), f = (w || neg) ? null : pick(R.feel, O.feel);   // 说了「不」：不接「真好」「更热闹」
  let q = pick(R.q, O.q);
  if (neg && q && /喜欢|like most/i.test(q[0])) q = null;
  // 已经说了跟谁一起，就别再问「一般跟谁去」，改问多久去一次
  if (w && q && /一般跟谁去|Who do you usually go with/.test(q[0])) q = lg === "zh" ? ["多久去一次？", "How often do you go together?"] : ["How often do you go together?", "多久去一次？"];
  const J = lg === "zh" ? "" : " ";
  return {t: [w && w[0], f && f[0], q ? q[0] : R.more].filter(Boolean).join(J), tr: [w && w[1], f && f[1], q ? q[1] : O.more].filter(Boolean).join(" ")};
};
/* 简短复述：只取用户最后一小句 */
HV.echoShort = (text, lg, kind) => {
  const orig = plain(text).trim(), parts = orig.split(/[，。！？,.!?;；]\s*/).map(x => x.trim()).filter(Boolean);
  if (kind === "ask" || /[？?]\s*$/.test(orig)) return HV.echo(orig, lg, "ask");
  // 英文复述整句（复查 2026-11-13：只截最后一小句会出「So but you don't like it.」）；太长才截，
  // 截下来那一小句先去掉开头的 but / and / so / because（中文：但是、可是、不过、而且、所以、因为），剩下的本身是一句完整的话才用
  const LONG = lg === "zh" ? 40 : 140;
  if (parts.length < 2 || [...orig].length <= LONG) return HV.echo(orig, lg, kind);
  const cut = parts[parts.length - 1].replace(lg === "zh" ? /^(但是|可是|不过|而且|所以|因为|然后)\s*/ : /^(but|and|so|because|then)\b[,\s]*/i, "");
  const whole = lg === "zh" ? /^(我|你|他|她|它|我们|你们|他们|大家|这|那)/.test(cut) && [...cut].length >= 4 : /^(i|you|we|they|he|she|it|my|our|your|their|people|there|this|that)\b/i.test(cut) && cut.split(/\s+/).length >= 3;
  return HV.echo(whole ? cut : orig, lg, kind);
};
/* rp：内容编辑写的几种回应。{who, when:[中文关键词, 英文关键词] 或 "any", zh, en, lg}；正文是跟 lg 同一种文字的那一栏，另一栏是翻译 */
const isCJK = t => /[\u4e00-\u9fff]/.test(String(t || ""));
function rpList(o, lg){
  if (!o || !o.rp) return [];
  const a = Array.isArray(o.rp) ? o.rp : (o.rp[lg] || []);
  return a.map(x => {
    if (typeof x === "string") return {t: x};
    if (Array.isArray(x)) return {t: x[0], tr: x[1], by: x[2]};
    const xl = x.lg || lg, f = [x.zh, x.en, x.t, x.text].filter(Boolean);
    const t = f.find(v => xl === "zh" ? isCJK(v) : !isCJK(v)), tr = f.find(v => v !== t);
    return {t, tr, by: x.by || x.who, lg: xl, kw: x.when && x.when !== "any" ? [].concat(x.when) : null, any: x.when === "any" || !x.when};
  }).filter(x => x.t && x.lg === lg);
}
function overlap(a, b){ const A = new Set(), s = String(b); const chars = [...String(a).toLowerCase()]; for (let i = 0; i < chars.length - 1; i++) A.add(chars[i] + chars[i + 1]); let n = 0; A.forEach(x => { if (s.toLowerCase().includes(x)) n++; }); return n; }
/* ctx: {net, text, lg, ui, kind, node, nodes, line, thread, place, where} */
HV.reply = ctx => {
  const NET = ctx.net || window.WORLD_NET, N = NET.nodes, lg = ctx.lg, ui = ctx.ui;
  const e = HV.echo(ctx.text, lg, ctx.kind), J = lg === "zh" ? "" : " ";
  const casts = Object.keys(N).filter(k => N[k].role && ((N[k].chat && N[k].chat[lg]) || (N[k].pages && N[k].pages[lg])));
  const castAt = place => casts.find(k => N[k].at === place);
  const fallbackBy = () => (ctx.place && castAt(ctx.place)) ? N[castAt(ctx.place)].who : ({zh: "mei", en: "holly"}[lg]);
  // ⓪ 你在回答一个 🎭 角色的问题：先是 TA 自己谢你，也先接住你的话
  const th0 = ctx.answering && NET.threads.find(t => t.id === ctx.answering);
  if (th0 && th0.thx) return {by: th0.by, t: (e.t ? e.t + J : "") + th0.thx, tr: (e.tr ? e.tr + " " : "") + (th0.thxTr || ""), how: "thx"};
  // ① 内容编辑写好的几种回应（rp）：帖子、线、点；线上没有，就用线两头那两个点的
  const line = ctx.line && NET.lines.find(l => l.id === ctx.line);
  const tiers = [[ctx.thread && NET.threads.find(t => t.id === ctx.thread), line, ctx.node && N[ctx.node], ...(ctx.nodes || []).filter(id => id !== ctx.node).map(id => N[id])],
                 line ? [N[line.from], N[line.to]] : []];
  const low = String(ctx.text).toLowerCase(), h = [...String(ctx.text)].reduce((a, c) => a + c.charCodeAt(0), 0);
  for (const tier of tiers) {
    const pool = []; tier.forEach(o => rpList(o, lg).forEach(x => pool.push(x)));
    // 用户点了哪个起头：起头的 when 跟回应的 when 对上，就接那一句；再看用户自己的话里有没有这些词
    const W_ = (ctx.when || []).map(k => String(k).toLowerCase());
    const byWhen = W_.length ? pool.filter(x => x.kw && x.kw.some(k => W_.includes(String(k).toLowerCase()))) : [];
    const hit = byWhen.length ? byWhen : pool.filter(x => x.kw && x.kw.some(k => k && low.includes(String(k).toLowerCase())));
    const POS = /喜欢|最爱|真好|太好了|好棒|开心|回忆|羡慕|梦想|幸运|我也是|同意|没错|\blove|\bgreat|\bamazing|\blovely|\bfavou?rite|\bglad|\bnice memory|\bdream|\benv(y|ious)|\bjealous|\blucky|\bme too|\bsame here|\bagree|\bexactly|\bwish i/i;   // 赞同、羡慕的也算
    const arr = HV.mood(ctx.text, lg) ? hit.filter(x => !POS.test(x.t)) : hit;   // 只用对得上关键词（或起头的 when）的；你说的是「不喜欢」「怕」「累」，就不接「你也喜欢」这类
    if (arr.length) { const pick = arr[h % arr.length]; return {by: pick.by || fallbackBy(), t: (e.t ? e.t + J : "") + pick.t, tr: (e.tr ? e.tr + " " : "") + (pick.tr || ""), how: "rp"}; }
  }
  // ② 碰不到写好的关键词：先接用户说的那件事（简短复述 + 一句反应），再问一句跟这件事有关的。不讲这座城的事。
  {
    const plOf = id => N[id] ? (N[id].type === "place" ? id : N[id].at) : null;
    const F0 = (ctx.place && N[ctx.place]) || (ctx.node && N[ctx.node]) || null, fs = new Set((F0 && F0.fields) || []);
    const home = ctx.place ? castAt(ctx.place) : null;
    let who = home, away = 0;
    if (!who) { const inField = casts.filter(k => (N[k].fields || []).some(f => fs.has(f))); who = inField.length ? inField[[...String(ctx.text)].length % inField.length] : null; away = 1; }
    const by = who ? N[who].who : ({zh: "mei", en: "holly"}[lg]);
    if (by) {
      const r = HV.react(ctx.text, lg, ctx.kind);
      const ec = HV.echoShort(ctx.text, lg, ctx.kind);
      const parts = [ec.t, r.t].filter(Boolean), partsTr = [ec.tr, r.tr].filter(Boolean);
      return {by, away: who ? away : 1, t: parts.join(J), tr: partsTr.join(" "), how: away ? "away" : "home", askPeople: r.ask ? 1 : 0, ask: home || null};
    }
  }
  // ④ 真没人回：先接住你这句，再说清楚谁会看到它
  const w = ctx.where ? (ctx.where[ui] || ctx.where.en || "") : "";
  const note = ui === "zh" ? `这句话现在挂在${w ? w.replace(/^\S+\s/, "") : "这一页"}，来这儿的人和这一行的 🎭 角色都看得到；有人回了，会在《我的语言》里提醒你。`
                           : `It's now up ${w ? w.replace(/^\S+\s/, "").replace(/^On /, "on ") : "on this page"} — people who come by and the 🎭 characters in this field will see it. When someone replies, you'll find it in My language.`;
  return {none: 1, by: null, t: e.t, tr: e.tr, note, how: "none", ask: ctx.place && castAt(ctx.place) ? castAt(ctx.place) : null};
};

/* ---------- 「这句话在说什么？」 ---------- */
HV.whatSays = (text, lg, fn, ui) => {
  const ns = fn ? [].concat(fn).map(Number) : HV.classify(text, lg);
  return {ns, html: ns.map(n => `<b>${esc(HV.drGist(n, ui))}</b> <span style="opacity:.75">· ${ui === "zh" ? `抽屉「${esc(HV.drName(n, ui))}」` : `drawer “${esc(HV.drName(n, ui))}”`}</span>`).join("<br>"), auto: !fn};
};

/* ---------- 改抽屉：点一下换，一句话可以放在两个抽屉 ---------- */
HV.pickDrawers = (host, cur, ui, done) => {
  let sel = new Set(cur.map(Number));
  const box = document.createElement("div"); box.className = "hvs-pick";
  const draw = () => { box.innerHTML = `<div class="hvs-card"><b class="hvs-h">${ui === "zh" ? "放进哪个抽屉？（可以选两个）" : "Which drawer? (up to two)"}</b>
    ${HV.CABS.map(c => `<div class="hvs-cab">${c.i} ${esc(ui === "zh" ? c.zh : c.en)}</div><div class="hvs-chips">${HV.DR.filter(r => r[1] === c.id).map(r => `<button data-pk="${r[0]}" class="${sel.has(r[0]) ? "on" : ""}">${esc(ui === "zh" ? r[2] : r[3])}</button>`).join("")}</div>`).join("")}
    <div class="hvs-row"><button class="hvs-btn" data-pkok="1">${ui === "zh" ? "好了" : "Done"}</button></div></div>`; };
  draw(); host.appendChild(box);
  box.addEventListener("click", ev => { const b = ev.target.closest("[data-pk],[data-pkok]"); if (!b) { if (ev.target === box) { box.remove(); } return; }
    if (b.dataset.pkok) { box.remove(); done && done([...sel]); return; }
    const n = +b.dataset.pk; if (sel.has(n)) sel.delete(n); else { if (sel.size >= 2) sel.delete([...sel][0]); sel.add(n); } if (!sel.size) sel.add(n); draw(); });
};

/* ---------- 说一句：同一个框（世界的网、地图上都用它） ---------- */
/* o: {host, ui, lg, question:{t,tr}, starters:[{t,m,by,thread}], src:{page,node,line,thread,g}, where:{zh,en}, kind, place, answering, net, onSaved(item, reply), onAsk(castId)} */
HV.say = o => {
  const ui = o.ui, lg = o.lg, Z = (zh, en) => HV.tr(zh, en, ui);
  const wrap = document.createElement("div"); wrap.className = "hvs-wrap";
  if (o.host === document.body) wrap.classList.add("fix");
  wrap.innerHTML = `<div class="hvs-scrim"></div><div class="hvs-sheet" role="dialog"><div class="hvs-grab"></div><button class="hvs-x" aria-label="close">✕</button><div class="hvs-in"></div></div>`;
  o.host.appendChild(wrap);
  const IN = wrap.querySelector(".hvs-in"), close = () => { stopMic(); wrap.classList.remove("on"); setTimeout(() => wrap.remove(), 300); };
  requestAnimationFrame(() => wrap.classList.add("on"));
  wrap.querySelector(".hvs-scrim").onclick = close; wrap.querySelector(".hvs-x").onclick = close;
  let used = null, mic = null, via = "typed";
  const q = o.question || {};
  IN.innerHTML = `
    <div class="hvs-q"><div class="hvs-ql">${o.answering ? Z("TA 问：", "They asked:") : Z("引出这一句的问题", "THE QUESTION")}</div><div class="hvs-qt ${lg === "en" ? "en" : ""}">${esc(plain(q.t || ""))} ${q.t ? `<button class="hvs-spk" data-hvsay="${esc(plain(q.t))}">🔊</button>` : ""}</div>${q.tr ? `<div class="hvs-qm">${esc(plain(q.tr))}</div>` : ""}</div>
    ${(o.starters || []).length ? `<div class="hvs-sl">${Z("挑一句最像你的，照着说，也可以改成你自己的：", "Pick the one most like you — say it as it is, or make it yours:")}</div><div class="hvs-st">${o.starters.map((s, i) => `<button data-st="${i}"><span class="${lg === "en" ? "en" : ""}">${esc(s.t)}</span>${s.m ? `<small>${esc(s.m)}</small>` : ""}</button>`).join("")}</div>` : ""}
    <div class="hvs-micw"><button class="hvs-mic" aria-label="mic">🎤</button><div class="hvs-ml">${Z(`按一下，用${lg === "zh" ? "中文" : "英语"}说`, `Tap and say it in ${lg === "zh" ? "Chinese" : "English"}`)}</div><div class="hvs-bars"><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="hvs-err" hidden></div>
    <textarea class="hvs-ta ${lg === "en" ? "en" : ""}" placeholder="${Z("你说的话会出现在这里。说不了也可以打字。", "What you say shows up here. Can't speak right now? Type it.")}"></textarea>
    <div class="hvs-tip">${Z("说一句是主要的事；打字是备选。说了，软件才会帮你整理进「我的语言」。", "Saying it is the main thing; typing is the backup. Once you've said it, it gets sorted into My language.")}</div>
    <button class="hvs-btn hvs-send" disabled>${o.answering ? Z("送出回答", "Send answer") : Z("说出去 · 挂在这一页", "Say it · it hangs on this page")}</button>
    <div class="hvs-out"></div>`;
  const ta = IN.querySelector(".hvs-ta"), send = IN.querySelector(".hvs-send"), micB = IN.querySelector(".hvs-mic"), bars = IN.querySelector(".hvs-bars"), err = IN.querySelector(".hvs-err"), ml = IN.querySelector(".hvs-ml");
  const sync = () => { const v = ta.value.trim(); send.disabled = !v || /(…|\.\.\.)$/.test(v); };
  ta.addEventListener("input", () => { via = "typed"; sync(); });
  function stopMic(){ if (mic) { mic.stop(); mic = null; } micB.classList.remove("rec"); bars.classList.remove("on"); }
  const showErr = code => { stopMic(); err.hidden = false; err.textContent = HV.micErr(code, ui); ml.textContent = Z("改用打字", "Typing instead"); ta.focus(); };
  if (!HV.micOK()) { err.hidden = false; err.textContent = HV.micErr("unsupported", ui); }
  micB.onclick = () => {
    if (mic) { stopMic(); return; }
    const base = ta.value.replace(/(……|…|\.\.\.)\s*$/, "");
    err.hidden = true;
    mic = HV.listen(lg, {
      start: () => { micB.classList.add("rec"); bars.classList.add("on"); ml.textContent = Z("在听……说完会自己停", "Listening… stops by itself"); },
      text: t => { ta.value = base + t; via = "voice"; sync(); },
      end: fin => { stopMic(); if (fin) { ta.value = base + fin; via = "voice"; ml.textContent = Z("✓ 听到了。可以再按一下重说，也可以改字。", "✓ Got it. Tap again to redo, or edit the words."); } else ml.textContent = Z("没听到。再按一下试试。", "Didn't catch that. Tap to try again."); sync(); },
      fail: showErr });
    if (!mic && !HV.micOK()) showErr("unsupported");
  };
  IN.addEventListener("click", ev => {
    const s = ev.target.closest("[data-st]"); if (s) { const st = o.starters[+s.dataset.st]; used = st; ta.value = st.t; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); IN.querySelectorAll("[data-st]").forEach(b => b.classList.toggle("on", b === s)); sync(); o.fx && o.fx(ev); return; }
    const sp = ev.target.closest("[data-hvsay]"); if (sp) { HV.speak(sp.dataset.hvsay, lg); return; }
  });
  send.onclick = () => {
    const text = ta.value.trim(); if (!text) return;
    stopMic();
    const kind = o.kind || "think";
    const dr = HV.classify(text, lg, kind);
    const borrowed = used && used.by ? [{who: used.by, t: used.t, thread: used.thread || null}] : [];
    const item = HV.add({t: text, lg, kind, via, page: o.src.page, src: o.src, where: o.where, borrowed, starter: used ? used.t : null, dr, drAuto: 1, q: q.t ? {t: plain(q.t), tr: plain(q.tr || "")} : null, answering: o.answering || null});
    const rep = HV.reply({net: o.net, text, lg, ui, kind, topic: o.topic || null, where: o.where, when: used && used.when && text.includes(String(used.t).replace(/(……|…)$/, "").slice(0, 6)) ? used.when : null, node: o.src.node, nodes: o.nodes, line: o.src.line, thread: o.src.thread, place: o.place, answering: o.answering});
    HV.update(item.id, {reply: rep.none ? null : {by: rep.by, t: rep.t, tr: rep.tr, away: rep.away || 0}});
    IN.querySelectorAll(".hvs-micw,.hvs-err,.hvs-st,.hvs-sl,.hvs-tip,.hvs-send").forEach(e => e.remove());
    ta.readOnly = true;
    const out = IN.querySelector(".hvs-out");
    const drLine = () => `🗄️ ${Z("放进了", "Put in")} ${item.dr.map(n => Z("『", "“") + esc(HV.drName(n, ui)) + Z("』", "”")).join(Z("和", " & "))} <button class="hvs-lk" data-chdr="1">${Z("放错了？改一下", "Wrong drawer? Change")}</button>`;
    out.innerHTML = `<div class="hvs-dr">${drLine()}</div><div class="hvs-rep"></div><button class="hvs-btn hvs-ghost" data-tome="1">🌱 ${Z("看看我的语言 →", "See my language →")}</button><button class="hvs-btn hvs-ghost" data-done="1">${Z("接着走", "Walk on")}</button>`;
    out.addEventListener("click", ev => {
      if (ev.target.closest("[data-chdr]")) { HV.pickDrawers(wrap.querySelector(".hvs-sheet"), item.dr, ui, ns => { item.dr = ns; HV.update(item.id, {dr: ns, drAuto: 0}); out.querySelector(".hvs-dr").innerHTML = drLine(); }); return; }
      if (ev.target.closest("[data-done]")) { close(); return; }
      if (ev.target.closest("[data-tome]")) { close(); HV.goMe({fresh: item.id}); return; }
      const a = ev.target.closest("[data-hvask]"); if (a) { close(); o.onAsk && o.onAsk(a.dataset.hvask); }
    });
    o.onSaved && o.onSaved(item, rep);
    const R = out.querySelector(".hvs-rep");
    R.innerHTML = `<div class="hvs-wait">${rep.none ? "" : "…"}</div>`;
    setTimeout(() => {
      if (rep.none) { R.innerHTML = `<div class="hvs-none"><div class="hvs-tx ${lg === "en" ? "en" : ""}">${esc(rep.t)}</div><div class="hvs-qm">${esc(rep.tr)}</div><div style="margin-top:6px">${esc(rep.note)}</div>${rep.ask && o.onAsk ? ` <button class="hvs-lk" data-hvask="${esc(rep.ask)}">${Z("去问问住在这儿的人 →", "Ask someone who lives here →")}</button>` : (o.onAsk ? ` <button class="hvs-lk" data-hvask="">${Z("看看这儿有谁在问 →", "See who's asking around here →")}</button>` : "")}</div>`; return; }
      const P = (o.net || window.WORLD_NET).people[rep.by] || {};
      const nm = typeof P.nm === "string" ? P.nm : (P.nm ? (ui === "zh" ? P.nm.zh : P.nm.en) : rep.by);
      R.innerHTML = `<div class="hvs-msg"><img src="${esc(o.face ? o.face(rep.by) : (P.face || ""))}" alt=""><div><div class="hvs-nm">${esc(String(nm).split(" · ")[0])} <span class="hvs-seed">🎭 ${rep.away ? Z("角色 · 没住在这儿", "Character · doesn't live here") : Z("角色", "Character")}</span></div><div class="hvs-tx ${lg === "en" ? "en" : ""}">${esc(rep.t)} <button class="hvs-spk" data-hvsay="${esc(rep.t)}">🔊</button></div>${rep.tr ? `<div class="hvs-qm">${esc(rep.tr)}</div>` : ""}</div></div>`;
      if (rep.askPeople && o.onAsk) R.insertAdjacentHTML("beforeend", `<button class="hvs-lk" style="margin-top:6px" data-hvask="${esc(rep.ask || "")}">${Z("问问住在这儿的人 →", "Ask someone who lives here →")}</button>`);
      o.fx && o.fx(null, "reply");
    }, 900);
  };
  return {close};
};
HV.speak = (t, lg) => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(plain(t)); u.lang = lg === "zh" ? "zh-CN" : lg === "pt" ? "pt-BR" : lg === "es" ? "es-MX" : "en-GB"; u.rate = .9; speechSynthesis.speak(u); } catch (e) {} };

/* ---------- 线的种类：两页同一套英文，有方向的写成 A → 动词 → B ---------- */
HV.LT = {
  from: {e: "🧬", zh: "从这儿来", en: "Came from", verb: "passed on to", vzh: "传到"},
  learn: {e: "💡", zh: "互相学", en: "Inspired", verb: "inspired", vzh: "启发了"},
  make: {e: "🔧", zh: "一起做", en: "Made together", verb: "sent work to", vzh: "把活儿交给"},
  sell: {e: "🚚", zh: "卖到那儿", en: "Went out to", verb: "went out to", vzh: "卖到 / 放到"},
  study: {e: "🎓", zh: "去那儿学", en: "Went to learn", verb: "went to learn at", vzh: "去那儿学："},
  like: {e: "❤️", zh: "TA 喜欢", en: "Loves", verb: "loves", vzh: "喜欢"}};
/* 线的动词：用线自己写的 v（{en, zh}）；没有 v 就不写「A → 动词 → B」 */
HV.dirLine = (l, a, b, ui, nodes) => {
  const v = l && l.v && l.v[ui === "zh" ? "zh" : "en"]; if (!v) return "";
  if (nodes) { const f = nodes[l.from], t = nodes[l.to];   // 两头有一头是「一件事」，或者主语是一座城：拼起来读不通，交给那条线自己的一句话
    if (!f || !t || f.type === "event" || t.type === "event" || f.type === "place") return ""; }
  return `${a} → ${v} → ${b}`;
};
/* 不是城市的地方（山、地区、一个国家、一大片）：找「最近的城市」时不算 */
HV.NOT_CITY = new Set(["andes", "amazon", "kaffa", "akuapem", "india", "darjeeling", "wuyi", "tiantai", "europe", "china", "chenjiagou", "kumasi"]);
HV.isCity = (id, N) => !HV.NOT_CITY.has(id) && !(N && N[id] && /山|一带|各地|西南部|地区/.test(N[id].name.zh || ""));
HV.the = x => /^the\s/i.test(String(x)) ? String(x) : "the " + x;
})();
window.HVML.CSS = ":host(.rtl) .hvs-sheet :is(div,span,b,small,button,textarea,a){unicode-bidi:plaintext}\n\n/* 软件里：手机上底栏盖在最下面，框里留出底栏的高度 */\n@media (max-width:700px){.hvs-sheet{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))}}\n/* ==== HV_MYLANG 共用样式 ==== */\n.hvs-wrap{position:absolute;inset:0;z-index:300;pointer-events:none}\n.hvs-wrap.fix{position:fixed}\n.hvs-scrim{position:absolute;inset:0;background:rgba(20,30,50,.35);opacity:0;transition:opacity .25s}\n.hvs-sheet{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:520px;max-height:90%;overflow-y:auto;background:#fbf7ee;border-radius:24px 24px 0 0;padding:8px 16px 22px;box-shadow:0 -10px 30px rgba(20,48,92,.22);transform:translateY(105%);transition:transform .3s cubic-bezier(.3,.9,.4,1);color:#14305c;font:15px/1.55 -apple-system,\"PingFang SC\",\"Helvetica Neue\",sans-serif;scrollbar-width:none}\n.hvs-wrap.on{pointer-events:auto}.hvs-wrap.on .hvs-scrim{opacity:1}.hvs-wrap.on .hvs-sheet{transform:none}\n.hvs-grab{width:42px;height:5px;border-radius:9px;background:#d8cfbb;margin:2px auto 8px}\n.hvs-x{position:absolute;right:12px;top:10px;border:0;background:#fff;border-radius:50%;width:30px;height:30px;color:#6b7488;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.08);cursor:pointer}\n.hvs-sheet button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}\n.hvs-q{background:#fff;border-radius:16px;padding:10px 12px;box-shadow:0 2px 10px rgba(20,48,92,.07);margin-right:34px}\n.hvs-ql{font-size:10.5px;font-weight:800;letter-spacing:.12em;color:#8f7a4c;text-transform:uppercase}\n.hvs-qt{font:700 17px/1.5 \"Noto Serif SC\",Georgia,serif;margin-top:2px}.hvs-qt.en,.hvs-tx.en,.hvs-ta.en,.hvs-st .en{font-family:Georgia,\"Noto Serif SC\",serif}\n.hvs-qm{font-size:12.5px;color:#6b7488;margin-top:2px;line-height:1.45}\n.hvs-sl{font-size:12px;color:#6b7488;margin:10px 2px 4px}\n.hvs-st{display:flex;flex-direction:column;gap:6px}\n.hvs-st button{border:1.5px dashed #d9b86a;background:#fffaf0;border-radius:12px;padding:7px 11px;text-align:left;color:#14305c;transition:transform .1s}\n.hvs-st button span{font-weight:700;font-size:15px}.hvs-st button small{display:block;color:#6b7488;font-size:12px}\n.hvs-st button.on{border-style:solid;border-color:#e2552f;background:#fff4ee}\n.hvs-st button:active,.hvs-mic:active,.hvs-btn:active{transform:scale(.96)}\n.hvs-micw{display:flex;flex-direction:column;align-items:center;margin:12px 0 4px}\n.hvs-mic{width:66px;height:66px;border-radius:50%;border:0;background:#e2552f;color:#fff;font-size:27px;box-shadow:0 6px 16px rgba(226,85,47,.35)}\n.hvs-mic.rec{animation:hvspulse 1s infinite}\n@keyframes hvspulse{50%{box-shadow:0 0 0 14px rgba(226,85,47,.14)}}\n.hvs-ml{font-size:12.5px;color:#6b7488;margin-top:5px;text-align:center}\n.hvs-bars{display:flex;gap:3px;height:18px;align-items:center;margin-top:3px;opacity:0}.hvs-bars.on{opacity:1}\n.hvs-bars i{width:4px;height:4px;border-radius:3px;background:#e2552f}.hvs-bars.on i{animation:hvsbar .5s ease-in-out infinite alternate}\n.hvs-bars i:nth-child(2){animation-delay:.1s}.hvs-bars i:nth-child(3){animation-delay:.2s}.hvs-bars i:nth-child(4){animation-delay:.05s}\n@keyframes hvsbar{to{height:17px}}\n.hvs-err{font-size:12.5px;color:#8a3a14;background:#fff1d6;border-radius:10px;padding:6px 10px;margin:4px 0}\n.hvs-ta{width:100%;min-height:70px;border:1.5px solid #e6dfcf;border-radius:14px;padding:9px 12px;font:600 16px/1.5 \"Noto Serif SC\",Georgia,serif;color:#14305c;background:#fff;outline:0;resize:none;margin-top:6px;box-sizing:border-box}\n.hvs-ta[readonly]{border-color:#e2552f;background:#fff4ee}\n.hvs-tip{font-size:11.5px;color:#8a8f9c;margin:4px 2px 0}\n.hvs-btn{display:block;width:100%;margin-top:10px;border:0;border-radius:99px;background:#e2552f;color:#fff;font-weight:800;padding:11px 16px;font-size:15px;box-shadow:0 3px 0 #b8401f;text-align:center;text-decoration:none;box-sizing:border-box}\n.hvs-btn[disabled]{opacity:.38}\n.hvs-btn.hvs-ghost{background:#fff;color:#14305c;box-shadow:0 0 0 1.5px #e6dfcf}\n.hvs-dr{font-size:13px;color:#6b5a2e;background:#fff6e2;border-radius:12px;padding:7px 10px;margin-top:10px;animation:hvsin .4s}\n.hvs-lk{border:0;background:none;padding:0;color:#e2552f;font-weight:800;text-decoration:underline;font-size:12.5px}\n.hvs-msg{display:flex;gap:9px;background:#f2f7fd;border-radius:14px;padding:9px 10px;margin-top:10px;animation:hvsin .4s}\n.hvs-msg img{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:none;background:#eee}\n.hvs-nm{font-size:12.5px;font-weight:800}.hvs-seed{font-size:10.5px;color:#7a6a4a;background:#fff6e2;border-radius:99px;padding:1px 7px}\n.hvs-tx{font-size:15px;line-height:1.55;color:#1d2838;margin-top:1px}\n.hvs-none{font-size:13.5px;color:#4b5563;background:#fff;border:1.5px dashed #d6ccb6;border-radius:14px;padding:9px 11px;margin-top:10px}\n.hvs-wait{color:#9aa3b5;font-size:20px;letter-spacing:.2em;margin-top:8px;animation:hvsblink 1s infinite}\n@keyframes hvsblink{50%{opacity:.3}}\n@keyframes hvsin{from{opacity:0;transform:translateY(6px)}}\n.hvs-spk{border:0;background:#fdeee8;color:#e2552f;border-radius:99px;padding:1px 8px;font-size:12px;vertical-align:1px}\n.hvs-pick{position:absolute;inset:0;z-index:5;background:rgba(251,247,238,.97);overflow-y:auto;padding:12px 14px;border-radius:24px 24px 0 0}\n.hvs-wrap .hvs-pick{position:fixed;inset:auto 0 0 0;max-width:520px;margin:0 auto;max-height:90%}\n.hvs-card .hvs-h{display:block;font:700 17px \"Noto Serif SC\",Georgia,serif;color:#14305c;margin:4px 0 6px}\n.hvs-cab{font-size:12px;font-weight:800;color:#7a6a4a;margin:8px 0 4px}\n.hvs-chips{display:flex;flex-wrap:wrap;gap:5px}\n.hvs-chips button{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:3px 9px;font-size:12px;font-weight:700;color:#14305c;cursor:pointer}\n.hvs-chips button.on{background:#14305c;color:#fff;border-color:#14305c}\n.hvs-row{position:sticky;bottom:0;background:rgba(251,247,238,.97);padding-top:4px}\n.hvs-what{font-size:12.5px;color:#33476b;background:#eef3fa;border-radius:10px;padding:6px 9px;margin-top:5px;line-height:1.5;animation:hvsin .3s}\n/* ==== /HV_MYLANG ==== */";

/* world_net.js */
// 🌍 世界 = 世界的网（2026-11-13 用户「可以，放进软件」）
// 样板：样板/新的软件结构样板.html（底栏四格、世界最上面「正在热闹的活动」、16 座岛 = 网上的 16 行）+ 样板/世界的网样板.html（点、线、公开聊、在这儿说一句、有人接住你）。
// 数据 window.WORLD_NET（content-skeleton/world_net/ → gen_world_net.py → d89_world_net.js；网站上在 later.js 里后台下载，到了才画）。
// 共用的一段 window.HVML（hv_mylang.js）：说过的话存 hv.mylang.v1（登录后同步）。整页放在 Shadow DOM 里（样式、id 不跟主程序打架）。
// 对外 window.WNET = {open(o), hide(), isOpen(), route(), back(), todayCard()}；o = {open: 点 / "row:行" / "field:行", line, th, qa, act, rows}
(function(){
"use strict";
const ZH = () => (document.documentElement.lang || "zh").slice(0, 2) === "zh";
const LEARN = () => (window.HVI && window.HVI.LEARN) || window.HV_LEARN || "en";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T = (zh, en) => window.HVML ? window.HVML.tr(zh, en, ZH() ? "zh" : "en") : (ZH() ? zh : en);
/* 16 座岛 → 16 行（新的软件结构样板）。织好的行 = 世界的网里有那一行（f）；还在织的行先把岛上原来的话题、地方、船票原样挂进来 */
const ROWS = [
 {id:"food", i:"🍜", n:["做吃的","Making food"], s:["番茄、茶、拉面、外卖","Tomatoes, tea, ramen, delivery"], isle:"eat_well", f:["food"], c:"#b8401f,#e2552f"},
 {id:"fit", i:"🏋️", n:["健身 · 身体和心情","Body & mind"], s:["从一场瑜伽演讲到客厅里的健身","From a yoga talk to living-room workouts"], isle:"body_mind", f:["fitness"], c:"#1f5d52,#2f7d70"},
 {id:"fashion", i:"👗", n:["服装 · 时尚","Clothes & fashion"], s:["从长安的丝绸到阿克拉","From Chang'an silk to Accra"], isle:"fashion_club", f:["fashion"], c:"#5a2440,#c0577a"},
 {id:"soft", i:"💻", n:["写软件 · 科技","Software & tech"], s:["从 Ada 的注释到 AI","From Ada's notes to AI"], isle:"dev_club", f:["software"], c:"#1d2a44,#3a4f7a"},
 {id:"anim", i:"🎬", n:["影视 · 动画","Film, TV & animation"], s:["从一只老鼠到全世界一起追的剧","A 1928 mouse to shows the world binges"], isle:"fun_club", f:["film","animation"], c:"#14305c,#3a6fb8"},
 {id:"home", i:"🏠", n:["住 · 在外面生活","Home & living abroad"], s:["房子、合租、搬到一个新地方","Flats, flatmates, moving somewhere new"], isle:"life_abroad", c:"#7a5a2a,#b8862f"},
 {id:"trend", i:"✨", n:["正在流行","What's trending"], s:["大家正在追的","What people are into right now"], isle:"trends_now", c:"#8a2f6e,#d6336c"},
 {id:"pets", i:"🐾", n:["养宠物","Pets"], s:["猫、狗和遛它们的人","Cats, dogs and the people who walk them"], isle:"pet_club", c:"#6b4a1f,#a8752e"},
 {id:"travel", i:"🧳", n:["出门旅行","Travel"], s:["怎么去、到了怎么办","Getting there and getting by"], isle:"see_world", c:"#0b5d7a,#1f8fb0"},
 {id:"money", i:"👛", n:["花钱 · 攒钱","Spending & saving"], s:["价钱、预算、第一份工资","Prices, budgets, first pay"], isle:"first_money", c:"#00706f,#00a3a3"},
 {id:"biz", i:"📈", n:["做生意 · 经济","Business & the economy"], s:["小店、物价、房租、谁在做什么","Shops, prices, rent, who makes what"], isle:"economy_club", c:"#2b3a55,#4a6390"},
 {id:"fair", i:"⚖️", n:["公平不公平","Fair or not"], s:["大家会争的问题","Questions people argue about"], isle:"social_money", c:"#4a3a6a,#7a5fb0"},
 {id:"artists", i:"🎨", n:["艺术家 · 人物","Artists & people"], s:["做出东西的人","People who made things"], isle:"people_values", c:"#2a2a2a,#5b4a3a"},
 {id:"life", i:"💭", n:["人生大事","Life's big moments"], s:["搬家、结婚、重新开始","Moving, marrying, starting over"], isle:"life_questions", c:"#5a3a2a,#9a5a3a"},
 {id:"health", i:"🩺", n:["看病","Seeing a doctor"], s:["诊所、药店、你那边怎么看病","Clinics, pharmacies, how it works where you are"], isle:"med_club", c:"#1f4f6b,#2f7da0"},
 {id:"grow", i:"🌱", n:["变好一点","Getting better at things"], s:["习惯、学东西、再试一次","Habits, learning, trying again"], isle:"growth_club", c:"#3a5a1f,#5f8f2f"}];
const ROW = id => ROWS.find(r => r.id === id);
const rowName = r => T(r.n[0], r.n[1]);
/* 活动挂在哪一行：按活动的种类（cat）；世界街拍在「艺术家 · 人物」 */
const CAT_ROW = {eat: "food", move: "fit", go: "travel", world: "artists", say: "grow", life: "home"};
const HVI = () => window.HVI || {};
function acts(){ try { return window.ACT && window.ACT.list ? window.ACT.list().filter(a => a.D && a.D.length) : []; } catch (e) { return []; } }
const actMeta = a => { try { return window.ACT.meta(a.id) || null; } catch (e) { return null; } };
/* 正在热闹：你在参加的先放，再按参加的人多少排 */
function busyActs(){ const A = acts().map(a => ({a, m: actMeta(a)})).filter(x => x.m); A.sort((x, y) => (y.m.joined - x.m.joined) || ((y.a.n || 0) - (x.a.n || 0))); return A; }
/* 「今天」那张活动小卡（在 Shadow DOM 外面，用页面自己的样式写在行内） */
function todayCardHtml(){
  const A = busyActs(); if (!A.length) return "";
  const x = A.find(y => y.m.joined) || A[0], r = ROW(CAT_ROW[x.a.cat] || "grow"), j = x.m.joined;
  const img = x.m.host.img ? `<img src="${esc(x.m.host.img)}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none">` : `<span style="width:40px;height:40px;border-radius:50%;background:#fff1ec;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none">🎪</span>`;
  return `<button data-wnact="${esc(x.a.id)}" data-wnrow="${r.id}" style="display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:0;cursor:pointer;background:linear-gradient(150deg,#fff1ec,#fff);border-radius:16px;padding:11px 13px;margin:10px 0;box-shadow:0 2px 10px rgba(20,48,92,.08);font:inherit;color:#24303a">${img}<span style="flex:1;min-width:0"><b dir="auto" style="display:block;color:#14305c;font-size:14.5px">${j ? T("你在参加：", "You're doing: ") : T("正在热闹：", "Busy right now: ")}${esc(x.m.t)}</b><small dir="auto" style="display:block;color:#6b7488;font-size:12px">${r.i} ${esc(rowName(r))} · ${T("主持：", "Host: ")}${esc(x.m.host.nm)} 🎭</small><small dir="auto" style="display:block;color:#e2552f;font-weight:800;font-size:12px;margin-top:2px">${T("去世界里看 →", "Open in World →")}</small></span></button>`;
}

const WN_CSS = "\n:host{--ink:#14305c;--ivory:#fbf7ee;--hot:#e2552f;--soft:#6b7488;--desk:#ece4d3;--line:#e6dfcf;--ok:#2f7d70;--gold:#ffc861;--paper:#f5efe2;--ear:#2c64b8}\n*{box-sizing:border-box}\n.phone{margin:0;color:#24303a;font:15px/1.55 -apple-system,\"PingFang SC\",\"Helvetica Neue\",sans-serif}\nbutton{font:inherit;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}\nimg{display:block}\n.wrap{max-width:1180px;margin:0 auto;padding:18px 16px 40px;display:grid;grid-template-columns:390px minmax(0,1fr);gap:30px;align-items:start}\n.lead{grid-column:1/-1;background:#fff8e6;border:1px dashed #d9b86a;border-radius:14px;padding:12px 14px;font-size:13.5px;color:#6b5a2e}\n.lead b.big{font:900 19px/1.5 \"Noto Serif SC\",serif;color:var(--ink);display:block;margin-bottom:4px}\n.ctl{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}\n.ctl button{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:6px 13px;font-weight:800;font-size:13px;color:var(--ink)}\n.ctl button.on{background:var(--ink);border-color:var(--ink);color:#fff}\n.ctl button.pri{background:var(--hot);border-color:var(--hot);color:#fff}\n.left{position:sticky;top:12px}\n.phone{background:var(--ivory);border-radius:34px;box-shadow:0 14px 40px rgba(20,48,92,.22),0 0 0 9px #1c2333;height:812px;max-height:calc(100vh - 40px);min-height:620px;position:relative;overflow:hidden;overflow:clip;width:375px;margin:9px auto 0}\n.scr{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding:14px 16px 104px;scrollbar-width:none;background:var(--ivory)}\n.scr::-webkit-scrollbar{display:none}\n.tabs{position:absolute;left:10px;right:10px;bottom:10px;z-index:30;background:rgba(20,48,92,.96);backdrop-filter:blur(8px);border-radius:24px;display:flex;padding:6px;box-shadow:0 8px 24px rgba(20,48,92,.3)}\n.tabs button{flex:1;border:0;background:none;color:#b9c4da;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 0 6px;border-radius:18px;font-size:11.5px;font-weight:600;min-width:0}\n.tabs button svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n.tabs button.on{background:rgba(255,255,255,.14);color:#fff;font-weight:800}\n.press{transition:transform .12s}.press:active{transform:scale(.96)}\nh1.pg{margin:4px 0 2px;font:900 27px/1.2 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\nh1.pg.en{font-family:Georgia,\"Noto Serif SC\",serif}\n.sub{color:var(--soft);font-size:13.5px;margin:0 0 12px}\n.sec{margin:22px 2px 9px;font:800 12px/1.2 -apple-system,sans-serif;letter-spacing:.1em;color:#7a6a4a;display:flex;gap:8px;align-items:center}\n.sec .r{margin-left:auto;border:0;background:none;color:var(--hot);font-weight:800;font-size:12.5px;letter-spacing:0;padding:0}\n.srch{display:flex;align-items:center;gap:8px;background:#fff;border-radius:99px;padding:10px 14px;box-shadow:0 2px 10px rgba(20,48,92,.07);position:relative}\n.srch input{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:15px;color:var(--ink)}\n.sres{background:#fff;border-radius:16px;margin-top:6px;box-shadow:0 6px 18px rgba(20,48,92,.12);overflow:hidden}\n.sres button{display:flex;gap:10px;align-items:center;width:100%;border:0;background:none;text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);font-size:14px}\n.sres button small{color:var(--soft);font-size:12px;margin-left:auto;white-space:nowrap}\n.chiprow{display:flex;gap:7px;overflow-x:auto;margin:8px -16px 0;padding:2px 16px 6px;scrollbar-width:none}.chiprow::-webkit-scrollbar{display:none}\n.chip{flex:none;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font-size:12.5px;font-weight:700;color:var(--ink);white-space:nowrap}\n.chip.on{background:var(--ink);border-color:var(--ink);color:#fff}\n.chip i{font-style:normal;display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:0}\n.empty{color:var(--soft);font-size:14px;text-align:center;padding:16px 8px}\n@keyframes pop{from{transform:scale(.92);opacity:0}}\n@keyframes slidein{from{transform:translateX(26px);opacity:0}}\n\n/* 别人的声音：每一段是一扇门 */\n.door{display:block;width:100%;border:0;text-align:left;background:#fff;border-radius:20px;padding:12px 13px 11px;margin-bottom:10px;box-shadow:0 3px 14px rgba(20,48,92,.07);animation:pop .35s;position:relative}\n.door .who{display:flex;gap:9px;align-items:center}\n.av{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;background:#eee}\n.av.s{width:28px;height:28px}\n.who b{font-size:14.5px;color:var(--ink)}\n.who small{display:block;color:var(--soft);font-size:11.5px;line-height:1.35}\n.door .q{margin:8px 0 2px;font-size:16px;line-height:1.5;color:#1d2838}\n.door .tr{font-size:12.5px;color:var(--soft);line-height:1.45}\n.door .at{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;font-weight:800;color:var(--hot)}\n.door .at span{color:var(--ink);font-weight:700;background:var(--paper);border-radius:8px;padding:2px 7px;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.ftag{display:inline-block;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:99px;color:#fff;vertical-align:1px;white-space:nowrap}\n.seed{font-size:10.5px;color:#7a6a4a;background:#fff6e2;border-radius:99px;padding:2px 7px;font-weight:700;white-space:nowrap}\n.waitme{border:2px solid var(--hot)}\n.waitme .flag{position:absolute;right:12px;top:-9px;background:var(--hot);color:#fff;font-size:11px;font-weight:800;border-radius:99px;padding:2px 9px}\n\n/* 整张网的地图 */\n.mapw{border-radius:18px;overflow:hidden;background:#0b1530;box-shadow:0 4px 16px rgba(20,48,92,.18);position:relative}\n.mapbox{overflow-x:auto;overflow-y:hidden;scrollbar-width:none;cursor:grab}.mapbox::-webkit-scrollbar{display:none}\n.mapbox svg{display:block}\n.mapw .hint{position:absolute;left:10px;bottom:8px;font-size:11px;color:#c9d4ea;background:rgba(11,21,48,.7);border-radius:99px;padding:3px 9px;pointer-events:none}\n.mapw .zoom{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:5px}\n.mapw .zoom button{width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.88);font-weight:900;color:var(--ink);font-size:16px;line-height:1}\n.dot{cursor:pointer}\n.ln{cursor:pointer}\n.lbl{font:700 3.3px -apple-system,\"PingFang SC\",sans-serif;fill:#e9eefb;paint-order:stroke;stroke:#0b1530;stroke-width:.7px;pointer-events:none}\n.legend{display:flex;flex-wrap:wrap;gap:4px 10px;margin:7px 2px 0;font-size:11.5px;color:var(--soft)}\n.legend i{display:inline-block;width:14px;height:3px;border-radius:2px;vertical-align:3px;margin-right:4px}\n\n/* 一行一张小海报 */\n.fposts{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n.fpost{border:0;border-radius:16px;color:#fff;text-align:left;padding:11px 12px 10px;min-height:92px;position:relative;overflow:hidden;box-shadow:0 3px 12px rgba(20,48,92,.15)}\n.fpost b{display:block;font:900 17px/1.25 \"Noto Serif SC\",serif}\n.fpost small{display:block;font-size:11.5px;line-height:1.4;opacity:.9;margin-top:4px}\n.fpost .ic{position:absolute;right:8px;top:4px;font-size:30px;opacity:.9}\n\n/* 我走过的 */\n.trail{display:flex;align-items:center;gap:0;overflow-x:auto;scrollbar-width:none;padding:2px 0}.trail::-webkit-scrollbar{display:none}\n.trail button{flex:none;border:0;background:none;padding:0;display:flex;align-items:center}\n.trail .td{width:26px;height:26px;border-radius:50%;background:#fff;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 1px 4px rgba(20,48,92,.12)}\n.trail .td.cur{border-color:var(--hot);background:#fff4ee;width:30px;height:30px}\n.trail .tl{flex:none;width:12px;height:2px;background:repeating-linear-gradient(90deg,#d9b86a 0 3px,transparent 3px 6px)}\n.trail .tn{font-size:11.5px;font-weight:800;color:var(--ink);margin-left:6px;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mytrail{background:#fff;border-radius:16px;padding:9px 11px;box-shadow:0 2px 10px rgba(20,48,92,.06);margin-top:10px}\n.mytrail .h{font-size:11.5px;color:#8f7a4c;font-weight:800;margin-bottom:5px;letter-spacing:.06em}\n\n/* 一页 */\n.push{position:absolute;inset:0;z-index:40;background:var(--ivory);transform:translateX(100%);visibility:hidden;transition:transform .32s cubic-bezier(.3,.9,.4,1),visibility 0s .32s;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}\n.push::-webkit-scrollbar{display:none}\n.push.on{transform:none;visibility:visible;transition:transform .32s cubic-bezier(.3,.9,.4,1),visibility 0s}\n.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;padding:10px 12px 8px;background:rgba(251,247,238,.96);backdrop-filter:blur(6px);border-bottom:1px solid rgba(230,223,207,.7)}\n.bar .back{flex:none;border:0;background:#efe9db;border-radius:99px;padding:6px 12px;font-weight:800;color:var(--ink);font-size:14px}\n.bar .trail{flex:1;min-width:0}\n.bar .home{flex:none;border:0;background:none;font-size:18px;padding:2px 4px}\n.pin{padding:6px 16px 130px;animation:slidein .3s}\n.hero{border-radius:18px;overflow:hidden;background:var(--paper);box-shadow:0 3px 14px rgba(20,48,92,.1);position:relative}\n.hero img.ph{width:100%;max-height:300px;min-height:150px;object-fit:contain;background:#efe7d6 url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ctext x='20' y='26' font-size='16' text-anchor='middle' fill='%23c9b98f'%3E…%3C/text%3E%3C/svg%3E\") center no-repeat}\n.hero img.ph.ok{min-height:0}\n.minimap .stk{position:absolute;right:10px;bottom:8px;height:78px;width:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))}\n.minimap .pl{position:absolute;left:12px;bottom:10px;font:700 12px -apple-system,sans-serif;color:#ffe6a8;letter-spacing:.08em}\n.hero .cap{padding:8px 11px 9px;font-size:13px;line-height:1.45;color:#2a3546;background:#fff}\n.hero .cap .cr{display:block;font-size:11px;color:#8a8f9c;margin-top:2px}\n.hero .cap .cr a{color:#8a8f9c}\n.hero .phn{position:absolute;right:8px;top:8px;display:flex;gap:4px}\n.hero .phn button{width:9px;height:9px;border-radius:50%;border:0;background:rgba(255,255,255,.6);padding:0}\n.hero .phn button.on{background:#fff}\n.drawn{height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%,#fff8e6,#f1e6cc);position:relative}\n.drawn .e{font-size:62px;line-height:1;filter:drop-shadow(0 4px 6px rgba(20,48,92,.15))}\n.drawn .y{font:600 22px \"Caveat\",cursive;color:#8f7a4c;margin-top:6px}\n.drawn img.stk{height:120px;width:auto;filter:drop-shadow(0 6px 10px rgba(20,48,92,.2))}\n.minimap svg{display:block;width:100%;height:170px}\n.ttl{margin:14px 2px 2px;font:900 25px/1.25 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 2px 0;font-size:12.5px;color:var(--soft)}\n.meta .lnk{border:0;background:var(--paper);border-radius:99px;padding:3px 10px;font-weight:800;color:var(--ink);font-size:12.5px}\n.read{background:#fff;border-radius:18px;padding:12px 13px;margin-top:12px;box-shadow:0 2px 10px rgba(20,48,92,.06)}\n.lv{display:flex;gap:5px;margin-bottom:8px}\n.lv button{flex:1;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:4px 0;font-size:11.5px;font-weight:800;color:var(--soft)}\n.lv button.on{border-color:var(--ink);color:var(--ink);background:#eef2f8}\n.read .t{font-size:16.5px;line-height:1.65;color:#1d2838}\n.read .m{font-size:13px;color:var(--soft);margin-top:6px;line-height:1.5;display:none}\n.read.show .m{display:block}\n.read .row{display:flex;gap:6px;margin-top:9px;align-items:center;flex-wrap:wrap}\n.sbtn{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font-weight:800;font-size:12.5px;color:var(--ink)}\n.src{font-size:11.5px;color:#8a8f9c;margin-top:8px;line-height:1.45}\n.w{border:0;background:none;padding:0;color:inherit;font:inherit;border-bottom:2px dotted var(--hot);cursor:pointer}\n\n\n/* ① 线长在句子里：深蓝实线的词 = 网上的另一页 */\n.wl{border:0;background:none;padding:0;font:inherit;color:var(--ink);font-weight:700;border-bottom:1.5px solid rgba(20,48,92,.55);cursor:pointer;line-height:inherit}\n.wl:hover,.wl:focus-visible{background:#eef2f8;outline:0}\n.wl.nb{background:#fff1d6;border-bottom-color:var(--hot);color:#8a3a14;border-radius:3px;padding:0 2px}\n.lk .sent{font-size:15.5px;line-height:1.6;color:#1d2838;margin-top:6px}\n.lk .sent .m{display:block;font-size:12.5px;color:var(--soft);margin-top:2px;line-height:1.45;font-weight:400}\n.lk .sub2{font-size:10.5px;font-weight:800;border-radius:99px;padding:1px 7px;background:#f1ece0;color:#6b5a2e}\n.lk .sub2.auto{background:#f4f4f4;color:#8a8f9c}\n.lk .ft{display:flex;align-items:center;gap:8px;margin-top:9px}\n.lk .ft .to{margin:0;flex:1;min-width:0;border:0;background:none;padding:0;text-align:left}\n.lk .ft .to img,.lk .ft .to .em{width:34px;height:34px;border-radius:8px}\n.lk .ft .to b{font-size:13px}\n.lk .ft .vsb{flex:none;border:1.5px solid var(--ink);background:#fff;border-radius:99px;padding:5px 10px;font-weight:800;font-size:12px;color:var(--ink)}\n.lk .other{display:block;width:100%;text-align:left;border:0;background:none;margin-top:7px;font-size:11.5px;color:var(--soft);border-top:1px dashed var(--line);padding:5px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.lk .dir{font:600 12.5px Georgia,serif;color:#7a6a4a;margin-top:5px}\n.vs .mid .vb{font:italic 600 13px Georgia,serif;color:#7a6a4a}\n.mylang{display:flex;align-items:center;gap:6px;margin:0 0 10px;background:#fff4ee;border:1.5px solid #f3c9b6;border-radius:99px;padding:6px 12px;font-weight:800;font-size:13px;color:var(--hot);text-decoration:none;width:max-content}\n.mylang b{background:var(--hot);color:#fff;border-radius:99px;padding:0 6px;font-size:11px}.mylang b:empty{display:none}\n.keep{display:flex;flex-direction:column;gap:6px}.keep button{border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:8px 11px;text-align:left;font-weight:800;color:var(--ink);font-size:13.5px}.keep button small{display:block;font-weight:600;color:var(--soft);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.msg .acts button.wh{background:#eef3fa;color:#33476b}\n.thr.flash{box-shadow:0 0 0 3px var(--gold)}\n.lk .other b{color:#7a6a4a}\n/* ② 两头并排比 */\n.sheet{container-type:inline-size}\n.vs{display:grid;grid-template-columns:1fr;gap:6px;margin:12px 0 8px}\n.vs .end{border:0;background:#fff;border-radius:16px;padding:8px;box-shadow:0 2px 10px rgba(20,48,92,.08);display:grid;grid-template-columns:118px 1fr;gap:10px;align-items:center;text-align:left;position:relative}\n.vs .end.here{outline:2px solid var(--gold)}\n.vs .end .here-t{position:absolute;right:8px;top:6px;background:var(--gold);color:#5a3c00;font-size:10.5px;font-weight:800;border-radius:99px;padding:1px 7px}\n.vs .pos{height:118px;border-radius:10px;background:#efe7d6;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:40px}\n.vs .pos img{max-width:100%;max-height:118px;object-fit:contain}\n.vs .end b{display:block;font:900 16px/1.3 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.vs .end small{display:block;font-size:11.5px;color:var(--soft);line-height:1.4;margin-top:2px}\n.vs .end .yr{font:600 20px \"Caveat\",cursive;color:#8f7a4c}\n.vs .end .cr{font-size:10px;color:#9a9fab;margin-top:4px;line-height:1.3}\n.vs .mid{display:flex;align-items:center;justify-content:center;gap:8px;padding:2px 0;font-weight:800;font-size:13px}\n.vs .mid .ic{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;box-shadow:0 2px 6px rgba(20,48,92,.2)}\n.vs .mid .yr{font:600 20px \"Caveat\",cursive;color:#8f7a4c}\n.vs .mid .ar{font-size:18px;color:var(--hot)}\n@container (min-width:460px){\n  .vs{grid-template-columns:1fr 110px 1fr;align-items:stretch}\n  .vs .end{grid-template-columns:1fr;text-align:center}\n  .vs .pos{height:200px}.vs .pos img{max-height:200px}\n  .vs .mid{flex-direction:column}\n  .vs .mid .ar{transform:rotate(-90deg)}\n}\n.howto{background:#fff;border-radius:16px;padding:10px 12px;font-size:15.5px;line-height:1.6;color:#1d2838;box-shadow:0 2px 10px rgba(20,48,92,.06)}\n.howto .m{display:block;font-size:12.5px;color:var(--soft);margin-top:3px}\n/* ③ 按种类筛 */\n.chip .n{font-weight:600;opacity:.65;margin-left:3px}\n.chiprow.subs .chip{font-size:11.5px;padding:3px 9px;border-style:dashed}\n/* ④ TA 喜欢的 */\n.likes{background:#fff;border-radius:18px;box-shadow:0 2px 12px rgba(20,48,92,.07);overflow:hidden}\n.likes .li{display:grid;grid-template-columns:56px 1fr;gap:10px;padding:10px 12px;border:0;background:none;text-align:left;width:100%;border-bottom:1px solid var(--line)}\n.likes .li img,.likes .li .em{width:56px;height:56px;border-radius:10px;object-fit:cover;background:#f6efe0;display:flex;align-items:center;justify-content:center;font-size:24px}\n.likes .q{font:700 15px/1.5 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.likes .qm{font-size:12px;color:var(--soft)}\n.likes .qs{font-size:11px;color:#8a8f9c;margin-top:3px}\n.likes .emp{padding:14px;font-size:13.5px;color:var(--soft);line-height:1.6}\n.likes .emp b{color:var(--ink)}\n/* ⑤ 合集 */\n.colls{display:flex;flex-direction:column;gap:8px}\n.cl{background:#fff;border-radius:16px;padding:10px 12px;box-shadow:0 2px 10px rgba(20,48,92,.07)}\n.cl .h{display:flex;gap:8px;align-items:center;font-size:13px;line-height:1.4}\n.cl .h b{color:var(--ink)}\n.cl .nb{display:flex;align-items:center;gap:6px;margin-top:8px;overflow-x:auto;scrollbar-width:none}\n.cl .nb::-webkit-scrollbar{display:none}\n.cl .nb .lab{flex:none;font-size:11px;color:var(--soft);font-weight:700}\n.cl .nb button{flex:none;border:0;background:#f6efe0;border-radius:10px;padding:3px 8px 3px 3px;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--ink);max-width:150px}\n.cl .nb button.me{background:#fff1d6;outline:2px solid var(--gold)}\n.cl .nb button img,.cl .nb button .em{width:26px;height:26px;border-radius:7px;object-fit:cover;flex:none;font-size:14px;display:flex;align-items:center;justify-content:center;background:#efe7d6}\n.cl .nb button span.t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.cl .nb i{flex:none;font-style:normal;color:#c9b98f;font-size:11px}\n.collrow{display:flex;gap:9px;overflow-x:auto;margin:0 -16px;padding:2px 16px 8px;scrollbar-width:none}.collrow::-webkit-scrollbar{display:none}\n.cc{flex:none;width:150px;border:0;background:#fff;border-radius:16px;padding:0 0 8px;text-align:left;box-shadow:0 3px 12px rgba(20,48,92,.08);overflow:hidden}\n.cc .grid4{display:grid;grid-template-columns:1fr 1fr;gap:2px;height:92px;background:#efe7d6}\n.cc .grid4 > *{width:100%;height:45px;object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:18px;background:#f3ead7}\n.cc b{display:block;font:800 13px/1.3 \"Noto Serif SC\",Georgia,serif;color:var(--ink);padding:7px 9px 0}\n.cc small{display:block;font-size:10.5px;color:var(--soft);padding:2px 9px 0}\n.cc.new{display:flex;align-items:center;justify-content:center;flex-direction:column;border:2px dashed #d9cdb0;box-shadow:none;background:none;color:#8f7a4c;font-weight:800;font-size:13px;min-height:140px;gap:4px}\n.pickc{display:flex;flex-direction:column;gap:6px;margin:8px 0}\n.pickc button{border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:9px 11px;text-align:left;font-weight:800;color:var(--ink);font-size:14px}\n.pickc button small{font-weight:600;color:var(--soft);margin-left:6px}\n.pickc button.on{border-color:var(--hot);background:#fff4ee}\n.pub{display:flex;align-items:center;gap:8px;background:#fff;border-radius:14px;padding:9px 12px;margin-top:10px;box-shadow:0 2px 8px rgba(20,48,92,.06);font-size:13px}\n.pub .sw{margin-left:auto;width:44px;height:26px;border-radius:99px;border:0;background:#d8cfbb;position:relative;padding:0}\n.pub .sw::after{content:\"\";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}\n.pub .sw.on{background:var(--ok)}.pub .sw.on::after{left:21px}\n.ci{display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:center;background:#fff;border-radius:14px;padding:8px;margin-bottom:6px;box-shadow:0 2px 8px rgba(20,48,92,.06);border:0;width:100%;text-align:left}\n.ci img,.ci .em{width:64px;height:64px;border-radius:10px;object-fit:cover;background:#f6efe0;display:flex;align-items:center;justify-content:center;font-size:26px}\n.ci b{color:var(--ink);font-size:14.5px}\n.ci small{display:block;color:var(--soft);font-size:11.5px}\n.ci .nt{font-size:13px;color:#33404f;margin-top:2px}\n.cj{text-align:center;color:#c9b98f;font-size:11px;margin:-2px 0 4px}\n/* 顶上：界面语言、说明 */\n.hrow{display:flex;align-items:center;gap:6px;margin-right:64px}\n.hrow h1{flex:1;min-width:0}\n.pill{flex:none;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:800;color:var(--ink)}\n.pill.info{display:none;background:var(--hot);border-color:var(--hot);color:#fff}\n/* 线：为什么值得过去 */\n.lk{display:block;width:100%;border:0;text-align:left;background:#fff;border-radius:18px;padding:11px 12px 10px;margin-bottom:9px;box-shadow:0 2px 12px rgba(20,48,92,.07);position:relative;animation:pop .3s}\n.lk .h{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--soft);font-weight:700}\n.lk .h .ty{font-weight:800}\n.lk .h .yr{margin-left:auto;font:600 15px \"Caveat\",cursive;color:#8f7a4c}\n.lk .to{display:flex;align-items:center;gap:8px;margin-top:5px}\n.lk .to img{width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none;background:#f1e9d8}\n.lk .to .em{width:44px;height:44px;border-radius:10px;flex:none;background:#f6efe0;display:flex;align-items:center;justify-content:center;font-size:22px}\n.lk .to b{font-size:15.5px;color:var(--ink);line-height:1.3}\n.lk .to small{display:block;font-size:11.5px;color:var(--soft)}\n.lk .why{margin-top:7px;font-size:14px;line-height:1.5;color:#1d2838}\n.lk .why .m{display:block;font-size:12px;color:var(--soft);margin-top:1px}\n.lk .asked{margin-top:7px;background:#fff4ee;border-radius:12px;padding:7px 9px;font-size:13.5px;line-height:1.45;display:flex;gap:7px;align-items:flex-start}\n.lk .asked b{color:var(--hot)}\n.lk .asked .m{display:block;font-size:11.5px;color:var(--soft)}\n.lk .go{display:flex;gap:6px;margin-top:8px}\n.lk .go span{flex:1;text-align:center;border-radius:99px;padding:6px 0;font-weight:800;font-size:12.5px}\n.lk .go .g1{background:var(--ink);color:#fff}\n.lk .go .g2{background:var(--paper);color:var(--ink)}\n.lk.pend{border:2px dashed #9ec2a8;background:#f6fbf7}\n.morebtn{width:100%;border:1.5px dashed #d9cdb0;background:none;border-radius:14px;padding:9px;font-weight:800;color:#8f7a4c;font-size:13px}\n\n/* 在这儿的东西 */\n.here{display:flex;gap:8px;overflow-x:auto;margin:0 -16px;padding:2px 16px 6px;scrollbar-width:none}.here::-webkit-scrollbar{display:none}\n.hc{flex:none;width:118px;border:0;background:#fff;border-radius:14px;padding:0 0 7px;text-align:left;box-shadow:0 2px 10px rgba(20,48,92,.07);overflow:hidden}\n.hc .im{height:74px;background:#f3ead7;display:flex;align-items:center;justify-content:center;font-size:28px}\n.hc .im img{width:100%;height:74px;object-fit:cover}\n.hc b{display:block;font-size:12.5px;line-height:1.3;color:var(--ink);padding:6px 8px 0;max-height:3.9em;overflow:hidden}\n.hc small{display:block;font-size:10.5px;color:var(--soft);padding:2px 8px 0}\n\n/* 公开聊 */\n.thr{background:#fff;border-radius:18px;padding:11px 12px 9px;margin-bottom:10px;box-shadow:0 2px 12px rgba(20,48,92,.07);animation:pop .35s}\n.thr.mine{border:2px solid var(--hot)}\n.thr .top{display:flex;align-items:center;gap:6px;margin-bottom:5px;font:800 11px/1.2 -apple-system,sans-serif;color:#8f7a4c;letter-spacing:.04em;flex-wrap:wrap}\n.msg{display:flex;gap:8px;margin-top:8px}\n.msg .bd{flex:1;min-width:0}\n.msg .nm{font-size:12.5px;font-weight:800;color:var(--ink)}\n.msg .nm small{font-weight:600;color:var(--soft);font-size:11px;margin-left:4px}\n.msg .tx{font-size:15px;line-height:1.55;color:#1d2838;margin-top:1px}\n.msg .tr{font-size:12.5px;color:var(--soft);line-height:1.45;margin-top:2px;display:none}\n.msg.showtr .tr{display:block}\n.msg .acts{display:flex;gap:5px;margin-top:5px;flex-wrap:wrap}\n.msg .acts button{border:0;background:#f3efe6;border-radius:99px;padding:3px 9px;font-size:11.5px;font-weight:800;color:var(--ink)}\n.msg .acts button.thx.on{background:#fff0c9;color:#8a5a00}\n.reply{margin-left:22px;border-left:2px solid var(--line);padding-left:9px}\n.rt{font-size:10.5px;font-weight:800;color:var(--ok);background:#e9f5f1;border-radius:6px;padding:1px 6px;margin-right:4px}\n.easy{background:#f2f7fd;border-radius:10px;padding:6px 9px;margin-top:6px;font-size:13.5px;line-height:1.5}\n.easy div+div{margin-top:4px;padding-top:4px;border-top:1px dashed #cfdcf0}\n.kind{margin-top:8px;font-size:12px;color:#7a5a1a;background:#fff6e2;border-radius:10px;padding:5px 9px}\n.cta{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:99px;background:var(--hot);color:#fff;font-weight:800;padding:11px 18px;font-size:15px;box-shadow:0 3px 0 #b8401f;transition:transform .1s}\n.cta:active{transform:translateY(2px);box-shadow:0 1px 0 #b8401f}\n.cta.navy{background:var(--ink);box-shadow:0 3px 0 #0a1c38}\n.cta.ghost{background:#fff;color:var(--ink);box-shadow:0 0 0 1.5px var(--line)}\n.cta.wide{width:100%}\n.cta[disabled]{opacity:.4}\n\n/* 🎭 角色 */\n.cast{background:#fff;border-radius:18px;padding:11px 12px;box-shadow:0 2px 12px rgba(20,48,92,.07);margin-bottom:9px}\n.cast .who{display:flex;gap:9px;align-items:center}\n.cast .qs{display:flex;flex-direction:column;gap:6px;margin-top:9px}\n.cast .qs button{border:1.5px solid var(--line);background:#fffdf7;border-radius:12px;padding:7px 10px;text-align:left;font-size:13.5px;color:var(--ink);font-weight:700}\n.cast .ans{background:#f2f7fd;border-radius:12px;padding:8px 10px;font-size:14px;line-height:1.55;margin-top:2px}\n.cast .ans .m{display:block;font-size:12px;color:var(--soft);margin-top:3px}\n.cast .ai{margin-top:8px;font-size:12px;color:var(--soft)}\n\n/* 下面拉起来的卡 */\n.scrim{position:absolute;inset:0;z-index:60;background:rgba(20,30,50,.35);opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}\n.scrim.on{opacity:1;visibility:visible;transition:opacity .25s}\n.sheet{position:absolute;left:0;right:0;bottom:0;z-index:61;background:var(--ivory);border-radius:24px 24px 0 0;max-height:86%;overflow-y:auto;transform:translateY(105%);transition:transform .3s cubic-bezier(.3,.9,.4,1);padding:8px 16px 26px;scrollbar-width:none;box-shadow:0 -10px 30px rgba(20,48,92,.2)}\n.sheet::-webkit-scrollbar{display:none}\n.sheet.on{transform:none}\n.sheet .grab{width:42px;height:5px;border-radius:9px;background:#d8cfbb;margin:2px auto 10px}\n.sheet h3{margin:2px 0 6px;font:900 20px/1.35 \"Noto Serif SC\",serif;color:var(--ink)}\n.ends{display:flex;align-items:center;gap:6px;margin:6px 0 4px}\n.ends button{flex:1;min-width:0;border:0;background:#fff;border-radius:14px;padding:8px 9px;text-align:left;box-shadow:0 2px 8px rgba(20,48,92,.07);font-weight:800;color:var(--ink);font-size:13.5px;line-height:1.3}\n.ends button small{display:block;font-weight:600;color:var(--soft);font-size:11px}\n.ends .arr{flex:none;font-size:18px;color:var(--hot)}\ntextarea.say{width:100%;min-height:80px;border:1.5px solid var(--line);border-radius:14px;padding:10px 12px;font:inherit;font-size:15px;color:var(--ink);background:#fff;outline:0;resize:none}\ninput.tx{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:9px 11px;font:inherit;font-size:14.5px;color:var(--ink);background:#fff;outline:0}\n.kinds{display:flex;gap:6px;margin:6px 0 10px}\n.kinds button{flex:1;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:7px 0;font-weight:800;font-size:13px;color:var(--ink)}\n.kinds button.on{border-color:var(--hot);background:#fff4ee;color:var(--hot)}\n.ideas{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}\n.ideas button{border:1.5px dashed #d9b86a;background:#fffaf0;border-radius:99px;padding:5px 11px;font-size:13px;font-weight:700;color:#6b5a2e}\n.hintb{font-size:12.5px;color:#6b5a2e;background:#fff6e2;border-radius:12px;padding:7px 10px;margin:6px 0}\n.mic{display:flex;align-items:center;gap:8px;margin:8px 0}\n.mic .bars{display:none;gap:3px;align-items:flex-end;height:22px}\n.mic.rec .bars{display:flex}\n.mic .bars i{width:4px;background:var(--hot);border-radius:2px;animation:bar .5s infinite alternate}\n.mic .bars i:nth-child(2){animation-delay:.1s}.mic .bars i:nth-child(3){animation-delay:.2s}.mic .bars i:nth-child(4){animation-delay:.3s}\n@keyframes bar{from{height:4px}to{height:22px}}\n.newpg{border:2px dashed #9ec2a8;border-radius:16px;background:#f6fbf7;padding:10px 12px;margin:8px 0;font-size:13.5px}\n.newbadge{display:inline-block;font-size:11px;font-weight:800;color:#2f7d70;background:#e3f3ec;border-radius:99px;padding:2px 8px}\n.wordpop{background:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 2px 10px rgba(20,48,92,.08)}\n.wordpop b{font:900 24px \"Noto Serif SC\",serif;color:var(--ink)}\n.buoy{position:absolute;right:14px;top:12px;z-index:35;background:#fff;border-radius:99px;padding:4px 10px;font-weight:800;font-size:13px;color:var(--ink);box-shadow:0 2px 8px rgba(20,48,92,.12)}\n\n.stamp{position:absolute;left:50%;top:38%;z-index:90;transform:translate(-50%,-50%) rotate(-12deg);border:4px solid var(--hot);color:var(--hot);font:900 22px/1.1 -apple-system,sans-serif;letter-spacing:.08em;padding:10px 16px;border-radius:12px;background:rgba(251,247,238,.92);pointer-events:none;animation:stampfx 1.8s forwards;text-align:center;white-space:nowrap}\n.stamp small{display:block;font-size:10px;letter-spacing:.2em;margin-top:3px}\n@keyframes stampfx{0%{transform:translate(-50%,-50%) rotate(-12deg) scale(2.4);opacity:0}18%{transform:translate(-50%,-50%) rotate(-12deg) scale(1);opacity:1}80%{opacity:1}100%{opacity:0}}\n.note{position:absolute;z-index:96;pointer-events:none;font-size:16px;color:var(--hot);animation:up 1s forwards}\n@keyframes up{to{transform:translateY(-40px);opacity:0}}\n#fx{position:absolute;inset:0;z-index:94;pointer-events:none}\n.toast{position:absolute;left:14px;right:14px;top:14px;z-index:95;background:var(--ink);color:#fff;border-radius:16px;padding:10px 12px;display:flex;gap:9px;align-items:center;font-size:13.5px;line-height:1.45;transform:translateY(calc(-100% - 40px));transition:transform .3s;box-shadow:0 8px 20px rgba(20,48,92,.3)}\n.toast.on{transform:none}\n.toast img{width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none}\n\n/* 说明 */\n.notes h2{font:900 20px/1.4 \"Noto Serif SC\",serif;color:var(--ink);margin:26px 0 8px}\n.notes h2:first-child{margin-top:4px}\n.notes p,.notes li{font-size:14.5px;line-height:1.75;color:#33404f}\n.notes ul{padding-left:20px;margin:6px 0}\n.notes .box{background:#fff;border-radius:16px;padding:12px 16px;margin:10px 0;box-shadow:0 2px 10px rgba(20,48,92,.05)}\n.notes .ask{background:#fff4ee;border:1.5px solid #f3c9b6;border-radius:16px;padding:12px 16px}\n.notes b.r{color:var(--hot)}\n.notes code{background:#f3ecdc;border-radius:5px;padding:0 4px;font-size:13px}\n.notes table{border-collapse:collapse;width:100%;font-size:13px;background:#fff;border-radius:14px;overflow:hidden}\n.notes td,.notes th{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;line-height:1.55}\n.notes th{background:#f6f0e2;color:#6b5a2e;font-size:12.5px}\n.tblw{overflow-x:auto}\n#infoClose{display:none}\n\n/* ===== 软件里：整屏、跟着底栏 ===== */\n:host{position:fixed;inset:0;z-index:40;display:block;background:var(--ivory);color:#24303a;font:15px/1.55 -apple-system,\"PingFang SC\",\"Helvetica Neue\",sans-serif}\n:host([hidden]){display:none}\n.phone{width:100%;height:100%;max-height:none;min-height:0;margin:0;border-radius:0;box-shadow:none}\n.buoy{display:none!important}\n@media (max-width:700px){.sheet{padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))}}\n.scr{padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(110px + env(safe-area-inset-bottom,0px))}\n.push .pin{padding-bottom:calc(110px + env(safe-area-inset-bottom,0px))}\n.wnload{display:flex;align-items:center;justify-content:center;height:100%;color:#8f7a4c;font:600 12px \"Cormorant Garamond\",Georgia,serif;letter-spacing:.5em}\nbutton.mylang{border:1.5px solid #f3c9b6;font-family:inherit}\n.maplinks{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.maplinks .sbtn{font-size:12.5px}\n.weavenote{margin:10px 0 0;background:#fbf7ee;border:1.5px dashed #d6ccb6;border-radius:14px;padding:9px 12px;font-size:13px;color:#6b5a2e}\n/* 正在热闹的活动：海报横着划（新的软件结构样板） */\n.poster{border-radius:18px;padding:14px;color:#fff;position:relative;overflow:hidden;margin-bottom:12px;box-shadow:0 6px 18px rgba(20,48,92,.18);text-align:left;cursor:pointer}\n.poster .pk{font:700 12px/1.3 -apple-system,sans-serif;letter-spacing:.04em;opacity:.88}\n.poster h4{margin:4px 0 0;font:900 21px/1.2 \"Noto Serif SC\",Georgia,serif}\n.poster .pe{font:italic 600 13.5px Georgia,serif;opacity:.9}\n.poster .hosts{display:flex;gap:8px;align-items:center;font-size:12px;margin:8px 0}\n.poster .hosts .av{border:1.5px solid rgba(255,255,255,.7)}\n.poster .big{display:block;width:100%;border:0;border-radius:12px;padding:9px 12px;font-weight:800;font-size:14px;background:rgba(255,255,255,.92);color:var(--ink);margin-top:6px}\n.poster .mini.rowl{display:inline-block;margin-top:8px;border:0;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:800;background:rgba(255,255,255,.18);color:#fff}\n.poster .stampd{position:absolute;right:12px;top:12px;border:2.5px solid #fff;border-radius:8px;padding:2px 8px;font:800 11px Georgia,serif;transform:rotate(8deg);letter-spacing:.06em}\n.actstrip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 16px 8px;margin:0 -16px;scrollbar-width:none}\n.actstrip::-webkit-scrollbar{display:none}\n.actstrip .poster{flex:none;width:82%;max-width:320px;scroll-snap-align:start;margin-bottom:0}\n.poster.flash{animation:wnflash 1.6s ease 2}@keyframes wnflash{50%{box-shadow:0 0 0 5px #ffd98a}}\n.rowacts .poster{margin-bottom:10px}\n/* 16 行 */\n.rows{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.rw{border:0;text-align:left;background:#fff;border-radius:14px;padding:10px;box-shadow:0 1px 6px rgba(20,48,92,.07);position:relative}\n.rw .ri{font-size:20px}.rw b{display:block;color:var(--ink);font-size:13.5px;line-height:1.25;margin-top:2px}\n.rw .rs{font-size:11px;color:var(--soft);line-height:1.3;display:block;margin-top:2px}\n.rw.weave{background:#fbf7ee;border:1.5px dashed #d6ccb6;box-shadow:none}.rw.weave b{color:#7d8597}\n/* 挂在这一行的话题 */\n.tps{display:flex;flex-direction:column;gap:7px}\n.tp{display:flex;gap:6px}\n.tpm{flex:1;min-width:0;display:flex;align-items:center;gap:10px;border:0;background:#fff;border-radius:14px;padding:9px 12px;text-align:left;box-shadow:0 1px 6px rgba(20,48,92,.07)}\n.tpm .e{font-size:20px;flex:none}.tpm b{display:block;color:var(--ink);font-size:14px}.tpm small{display:block;color:var(--soft);font-size:11.5px}.tpm em{margin-left:auto;font-style:normal;color:var(--hot);font-weight:800}\n.stripnote{margin-top:4px!important}\n.trq{display:block;font-size:11.5px;color:var(--soft);font-weight:500}\n:host(.rtl) :is(p,div,span,b,small,button,h1,h2,h3,h4,a,em,i,u,label,textarea,input,.ftag,.chip,.seed){unicode-bidi:plaintext}\n.tps-sail{flex:none;border:0;background:#eaf2fb;border-radius:14px;width:46px;font-size:18px}\n/* 电脑上：左边是底栏那一竖排，网上那一页从右边滑进来，盖住一半 */\n@media (min-width:701px){\n :host{left:84px}\n .scr{padding:28px 36px 60px}\n .scr>*{max-width:980px;margin-left:auto;margin-right:auto}\n .scr>.mylang{margin-left:max(0px,calc((100% - 980px) / 2));margin-right:0}\n .scr>.actstrip{margin:0 auto;padding:2px 0 8px}\n .rows{grid-template-columns:repeat(4,1fr)}\n .actstrip{margin:0;padding:2px 2px 8px}\n .actstrip .poster{width:300px}\n .push{left:auto;width:min(600px,62%);box-shadow:-18px 0 40px rgba(20,48,92,.18)}\n .push .pin{padding-bottom:40px}\n .sheet{left:auto;right:0;width:min(600px,62%)}\n .toast{left:auto;right:14px;width:420px}\n}\n";

const SKEL = `<div class="phone" id="phone"><section class="scr" id="home"></section><div class="push" id="page"></div><div class="buoy" id="buoy"></div><div class="scrim" id="scrim"></div><div class="sheet" id="sheet"></div><canvas id="fx"></canvas><div class="toast" id="toast"></div></div>`;
let HOST = null, SR = null, API = null, WANT = null, POLL = 0;
const ready = () => !!(window.WORLD_NET && window.HVML);
function shell(){ if (HOST) return; HOST = document.createElement("div"); HOST.id = "wnPg"; HOST.hidden = true; document.body.appendChild(HOST);
  SR = HOST.attachShadow({mode: "open"}); SR.innerHTML = `<style>${WN_CSS}</style><div class="wnload">HEYVOYO</div>`; }
function boot(){ if (API) return; SR.innerHTML = `<style>${WN_CSS}${window.HVML.CSS}</style>` + SKEL; API = run(SR); }
function open(o){ shell(); if (window.hvPage) window.hvPage.show("map"); HOST.hidden = false; HOST.classList.toggle("rtl", document.documentElement.dir === "rtl"); document.body.classList.add("gal-on", "wn-on"); WANT = o || {};
  if (ready()){ boot(); API.enter(WANT); return; }
  if (!POLL) POLL = setInterval(() => { if (!ready()) return; clearInterval(POLL); POLL = 0; boot(); if (!HOST.hidden) API.enter(WANT); }, 150); }
function hide(){ if (!HOST || HOST.hidden) return; HOST.hidden = true; document.body.classList.remove("wn-on"); try { speechSynthesis.cancel(); } catch (e) {} }
/* 在这儿说一句、去别的页回来：别的页（《你的语言》、地图上的线）说完一句，这里重新挂上 */
addEventListener("storage", e => { if (e.key === "hv.mylang.v1" && API) API.rerender(); });
window.WNET = {open, hide, isOpen: () => !!(HOST && !HOST.hidden), route: () => API ? API.route() : "map", back: () => !!(API && HOST && !HOST.hidden && API.back()), todayCard: () => { try { return todayCardHtml(); } catch (e) { return ""; } }, refresh: () => { if (API) API.rerender(); }};
/* 「今天」那张活动小卡：点了到世界里那一行，海报闪一下 */
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-wnact]"); if (!b) return; e.preventDefault(); e.stopPropagation(); open({open: "row:" + b.dataset.wnrow, act: b.dataset.wnact}); }, true);
function run(SR){
const HV = window.HVML;

const $ = s => SR.querySelector(s), $$ = s => [...SR.querySelectorAll(s)];
const PHONE = $("#phone");
const NET = window.WORLD_NET;
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let M = LEARN() === "zh" ? "zh" : "en"; // 在学的语言：zh = 学中文（主要用户），en = 学英语
const T = (zh, en) => HV.tr(zh, en, ZH() ? "zh" : "en");        // 界面字（用户的语言）：中文界面中文，别的先查翻译表、没有用英文
const TL = () => M;                                  // 在学的语言
const OL = () => ZH() ? "zh" : "en";                 // 用户说得好的语言（意思用这一种写）
const ui = o => o == null ? "" : typeof o === "string" ? o : (o[OL()] || o.zh || o.en || "");
const yrOf = l => [l.year, l.year_note ? (typeof l.year_note === "string" ? l.year_note : (l.year_note[OL()] || l.year_note.en || l.year_note.zh || "")) : ""].filter(Boolean).join(" ");
const tl = o => o == null ? "" : typeof o === "string" ? o : (o[TL()] || o.en || o.zh || "");
const VL = l => ({zh:"zh-CN",en:"en-GB",es:"es-MX",ja:"ja-JP",ko:"ko-KR",fr:"fr-FR"}[l] || "en-US");
const LGN = {zh:["中文","Chinese"],en:["英语","English"],ja:["日语","Japanese"],es:["西班牙语","Spanish"],pt:["葡萄牙语","Portuguese"],ko:["韩语","Korean"],fil:["菲律宾语","Filipino"],ar:["阿拉伯语","Arabic"],th:["泰语","Thai"],ga:["爱尔兰语","Irish"],bn:["孟加拉语","Bengali"],fr:["法语","French"],ig:["伊博语","Igbo"],pl:["波兰语","Polish"]};
const lgName = l => LGN[l] ? LGN[l][ZH() ? 0 : 1] : l;
const TYPES = {place:["📍","地方","Place"],person:["👤","人","Person"],work:["🎬","作品","Work"],org:["🏛️","公司或机构","Company"],event:["✨","一件事","Event"],kind:["🧩","一类事","Kind of thing"]};
const LT = {make:["🔧","一起做","Making it together","#5aa0ff"],learn:["💡","互相学","Learning from each other","#ff7a55"],study:["🎓","去那儿学","Going there to learn","#5fd39a"],sell:["🚚","卖到那儿","Selling it there","#ffc861"],from:["🧬","从这儿来","Came from here","#d79bff"],like:["❤️","TA 喜欢","They love it","#ff8fb1"]};
const SUBS = NET.subs || {};
const subName = l => l.sub && SUBS[l.type] && SUBS[l.type][l.sub] ? ui(SUBS[l.type][l.sub]) : "";
Object.keys(LT).forEach(k => { if (window.HV && HV.LT[k]) LT[k][2] = HV.LT[k].en; });
const ltName = k => LT[k] ? (ZH() ? LT[k][1] : LT[k][2]) : k;
/* 有方向的线：英文界面写成 A → 动词 → B，不会读反 */
const dirOf = l => ZH() ? "" : HV.dirLine(l, nname(l.from).replace(/\s*\(.*$/, ""), nname(l.to).replace(/\s*\(.*$/, ""), "en", NET.nodes);
const ltInk = k => LT[k] ? ({"#ffc861":"#b8860b","#ff8fb1":"#c0446e"}[LT[k][3]] || LT[k][3]) : "#14305c";
const KIND = {ask:["❓","我想问","I want to ask"],think:["💭","我的想法","My thought"],story:["📖","我的经历","My story"]};
const RT = {answer:["回答","Answer"],same:["我也是","Me too"],add:["我补一句","Adding one thing"],angle:["我换个角度","Another angle"],reply:["回你","Replying"],thx:["谢谢你","Thanks"],away:["回你 · 没住在这儿","Replying · doesn't live here"]};
const N = id => NET.nodes[id];
const LBY = {}; NET.lines.forEach(l => LBY[l.id] = l);
const isLine = id => !!LBY[id];
const placeOf = id => { const n = N(id); if (!n) return null; return n.type === "place" ? id : n.at; };
const llOf = id => { const p = placeOf(id); return p && N(p) ? N(p).ll : null; };
const HERE = {}; Object.entries(NET.nodes).forEach(([id, n]) => { if (n.at) (HERE[n.at] = HERE[n.at] || []).push(id); });
const F = fid => NET.fields[fid];
const fName = fid => F(fid) ? F(fid).icon + " " + ui(F(fid).name) : fid;
const fColor = fid => { const c = F(fid) && F(fid).color || ""; const m = c.match(/#[0-9a-f]{6}/gi); return m ? m[m.length - 1] : "#14305c"; };
const ftag = fid => `<span class="ftag" style="background:${fColor(fid)}">${esc(fName(fid))}</span>`;
let nname = id => { if (id.startsWith("field:")) return fName(id.slice(6)); if (id.startsWith("coll:")) { const c = collById(id.slice(5)); return c ? "「" + ui(c.t) + "」" : id; } if (isLine(id)) return T("这条线", "this line"); const n = N(id); return n ? ui(n.name) : id; };
const plain = s => String(s || "").replace(/\[\[([^\]|]+)\]\]/g, "$1").replace(/[\[\]]/g, "");
const rich = s => esc(s).replace(/\[\[([^\]|]+)\]\]/g, (m, w) => `<button class="w" data-w="${esc(w)}">${esc(w)}</button>`).replace(/\[([^\]]+)\]/g, "$1");
/* ① 线长在句子里：句子里提到网上另一页的地方，直接是可点的词（每页只链第一次，像维基百科） */
let NAMEIDX = null;
function buildNames(){
  const m = new Map(), bad = new Set();
  const ascii = s => /^[\x00-\x7f]+$/.test(s);
  const add = (s, id) => { s = (s || "").trim(); if (!s) return; if (ascii(s) ? s.length < 4 : [...s].length < 2) return; if (m.has(s) && m.get(s) !== id) bad.add(s); else m.set(s, id); };
  Object.entries(NET.nodes).forEach(([id, n]) => { if (n.role || !n.name) return; const z = n.name.zh || "", e = n.name.en || "";
    [z, z.replace(/[《》]/g, ""), z.replace(/（.*$/, ""), e, e.replace(/\s*\(.*$/, "")].forEach(x => add(x, id)); });
  bad.forEach(x => m.delete(x));
  const keys = [...m.keys()].sort((a, b) => b.length - a.length);
  const rx = new RegExp(keys.map(k => { const e = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return ascii(k) ? `(?<![A-Za-z])${e}(?![A-Za-z])` : e; }).join("|"), "g");
  NAMEIDX = {m, rx};
}
function linkify(raw, self, nb){
  if (!NAMEIDX) buildNames();
  const used = new Set();
  return String(raw || "").split(/(\[\[[^\]]+\]\])/).map(p => {
    const w = p.match(/^\[\[([^\]|]+)\]\]$/); if (w) return `<button class="w" data-w="${esc(w[1])}">${esc(w[1])}</button>`;
    p = p.replace(/[\[\]]/g, "");
    let out = "", last = 0, mm; NAMEIDX.rx.lastIndex = 0;
    while ((mm = NAMEIDX.rx.exec(p))) {
      const id = NAMEIDX.m.get(mm[0]); out += esc(p.slice(last, mm.index));
      if (id && id !== self && !used.has(id)) { used.add(id); out += `<button class="wl ${id === nb ? "nb" : ""}" data-open="${id}" title="${esc(nname(id))}">${esc(mm[0])}</button>`; }
      else out += esc(mm[0]);
      last = mm.index + mm[0].length;
    }
    return out + esc(p.slice(last));
  }).join("");
}
const svgUri = s => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);

/* 说话的人 */
const P = id => NET.people[id];
const AVC = ["#e2552f","#2c64b8","#2f7d70","#8a4a9a","#b8401f","#3a6fb8","#c0577a","#5a7a2a"];
function face(id){
  if (id === "me") return svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#ffc861"/><text x="20" y="27" font-size="20" text-anchor="middle">🙂</text></svg>');
  const p = P(id); if (p && p.face) return p.face;
  const nm = p ? (typeof p.nm === "string" ? p.nm : (p.nm.zh || p.nm.en)) : id;
  const c = AVC[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVC.length];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${c}"/><text x="20" y="26.5" font-size="17" font-weight="700" fill="#fff" text-anchor="middle" font-family="sans-serif">${esc([...nm][0])}</text></svg>`);
}
const pname = id => id === "me" ? T("你", "You") : (P(id) ? (typeof P(id).nm === "string" ? P(id).nm : (ZH() ? P(id).nm.zh : P(id).nm.en)) : id);
const castOf = who => Object.keys(NET.nodes).find(k => N(k).role && N(k).who === who);
function ptag(id, noCast){
  if (id === "me") return T("在学：", "Learning: ") + lgName(TL());
  const p = P(id); if (!p) return "";
  const c = castOf(id);
  const pos = c ? ui(N(c).pos) : "", cityBase = p.city ? ui(p.city).replace(/\s*[（(].*$/, "") : "";
  const city = p.city && !(cityBase && pos.includes(cityBase)) ? ui(p.city) + " · " : "";   // 职位里已经写了城市，就不再写一遍
  return (c ? (noCast ? "" : "🎭 ") + ui(N(c).pos) + " · " : "") + city + T("说得好：", "Speaks well: ") + (p.good || []).map(lgName).join(T("、", ", ")) + " · " + T("在学：", "Learning: ") + lgName(p.le) + (p.le2 ? T("、", ", ") + lgName(p.le2) : "");
}

/* 状态 */
let S;
function fresh(){ S = {stack:[], walked:[], lvl:0, buoy:5, thanked:{}, showTr:{}, easy:{}, mine:[], what:{}, newNodes:{}, newLines:[], misses:[], fField:"all", fType:"all", lineField:"all", lineType:"all", lineSub:"all", sheetLine:null, feedSeed:1, zoom:1, phIdx:{}, asked:{}, nudged:0, castOpen:{}}; }
fresh();
/* 以前说过的话（存在 hv.mylang.v1）重新挂回它说的那一页 */
function mineFromStore(){
  return HV.items().filter(x => x.page === "net" && !x.answering && x.src).reverse().map(x => {
    const on = x.src.line || x.src.node, n = N(on) || LBY[on];
    return {id: "st_" + x.id, on, kind: x.kind || "think", lg: x.lg, by: "me", mine: 1, text: x.t, tr: {}, fields: n ? n.fields || [] : [],
      replies: x.reply ? [{by: x.reply.by, rt: x.reply.away ? "away" : x.kind === "ask" ? "answer" : "reply", lg: x.lg, text: x.reply.t, tr: {[x.lg === "zh" ? "en" : "zh"]: x.reply.tr}}] : []};
  }).filter(t => N(t.on) || LBY[t.on]);
}
S.mine = mineFromStore();
const allThreads = () => [...S.mine, ...NET.threads];

/* 「回答过你的人也在问问题」：你问一句，一个那种语言说得好的 🎭 角色回你；TA 自己也在学你说得好的语言 */
const REPLIER = {zh: "mei", en: "holly"};   // 没有别的人可回时，学中文的人由台北的 Mei、学英语的人由伦敦的 Holly 接   // 按在学的语言：学中文的人由台北的 Mei 回，学英语的人由伦敦的 Holly 回
NET.threads.push(
  {id: "meiEN", on: "e_boba", kind: "ask", seed: 1, lg: "en", by: "mei", open: 1, fields: ["food"], replies: [],
   text: "Is bubble tea popular where you live? What do people there usually order?", tr: {zh: "你住的地方，珍珠奶茶火吗？那边的人一般点什么？"},
   tp: {opts: [{en: "There are lots of bubble tea shops near me.", zh: "我家附近有很多奶茶店。"}, {en: "It's getting popular where I live.", zh: "我们那儿越来越火了。"}, {en: "I haven't seen many shops where I live.", zh: "我住的地方没见过几家。"}]},
   thx: "Thank you! I never knew that about where you live.", thxTr: "谢谢你！你那边的事，我以前一点都不知道。"},
  {id: "hollyZH", on: "w_zhenhuan", kind: "ask", seed: 1, lg: "zh", by: "holly", open: 1, fields: ["film"], replies: [],
   text: "请问，《甄嬛传》在中国现在还有很多人看吗？", tr: {en: "Excuse me — do lots of people in China still watch Empresses in the Palace?"},
   tp: {opts: [{zh: "还有很多人看，我妈妈最近又看了一遍。", en: "Lots of people still watch it — my mum just rewatched it."}, {zh: "没那么火了，可是大家还记得里面的话。", en: "It's not so hot now, but people still quote it."}, {zh: "我身边的年轻人也看。", en: "Young people around me watch it too."}]},
   thx: "谢谢你！你说得很清楚，我都听懂了。", thxTr: "Thank you! You were very clear — I understood all of it."}
);

const collById = () => null;

/* 小互动 */
let AC = null;
function blip(f = 660, d = .07){ try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; g.gain.value = .05; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d + .02); } catch (e) {} }
function noteAt(ev, txt){ if (!ev || !ev.clientX) return; const r = PHONE.getBoundingClientRect(); const n = document.createElement("span"); n.className = "note"; n.textContent = txt || "✦"; n.style.left = (ev.clientX - r.left - 6) + "px"; n.style.top = (ev.clientY - r.top - 18) + "px"; PHONE.appendChild(n); setTimeout(() => n.remove(), 1000); }
function stamp(t, sub){ const s = document.createElement("div"); s.className = "stamp"; s.innerHTML = esc(t) + (sub ? `<small>${esc(sub)}</small>` : ""); PHONE.appendChild(s); blip(520, .12); setTimeout(() => blip(780, .1), 120); setTimeout(() => s.remove(), 1900); }
let TT = 0;
function toast(html, fc, ms){ const t = $("#toast"); t.innerHTML = (fc ? `<img src="${fc}" alt="">` : "") + `<span>${html}</span>`; t.classList.add("on"); clearTimeout(TT); TT = setTimeout(() => t.classList.remove("on"), ms || 2600); }
const cv = $("#fx"), cx = cv.getContext("2d"); let parts = [], raf = 0;
function confetti(){ cv.width = PHONE.clientWidth; cv.height = PHONE.clientHeight; const C = ["#e2552f","#ffc861","#2c64b8","#2f7d70","#c0577a"]; for (let i = 0; i < 90; i++) parts.push({x: cv.width / 2 + (Math.random() - .5) * 80, y: cv.height * .35, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3, c: C[i % 5], a: Math.random() * 6, l: 70 + Math.random() * 40}); if (!raf) tick(); }
function tick(){ cx.clearRect(0, 0, cv.width, cv.height); parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .32; p.a += .2; p.l--; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-4, -2, 8, 4); cx.restore(); }); parts = parts.filter(p => p.l > 0 && p.y < cv.height + 20); raf = parts.length ? requestAnimationFrame(tick) : 0; if (!raf) cx.clearRect(0, 0, cv.width, cv.height); }
function say(t, lang){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(plain(t)); u.lang = VL(lang); u.rate = .92; speechSynthesis.speak(u); } catch (e) {} }
function drawBuoy(){ $("#buoy").textContent = "🛟 " + S.buoy; }

/* 三档 */
const LVN = () => [T("刚开始", "Just starting"), T("能聊日常", "Everyday chat"), T("比较流利", "Quite fluent")];
const lvText = arr => { arr = arr || []; return S.lvl === 0 ? arr[0] : S.lvl === 1 ? (arr[1] || arr[0]) : [arr[1] || arr[0], arr[2]].filter(Boolean).join(" "); };

/* ============ 地图 ============ */
const PX = ll => [ll[1] + 180, 90 - ll[0]];
function arc(a, b){ const [x1, y1] = PX(a), [x2, y2] = PX(b); const d = Math.hypot(x2 - x1, y2 - y1); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(34, d * .28); return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`; }
function reachOf(pid){ let n = 0; NET.lines.forEach(l => { if (placeOf(l.from) === pid || placeOf(l.to) === pid) n++; }); return n; }
const REACH = {}; Object.keys(NET.nodes).forEach(id => { if (N(id).type === "place") REACH[id] = reachOf(id); });
function mapLines(fid, ty){ return [...NET.lines, ...S.newLines].filter(l => (fid === "all" || (l.fields || []).includes(fid)) && (ty === "all" || l.type === ty) && llOf(l.from) && llOf(l.to) && placeOf(l.from) !== placeOf(l.to)); }
function mapPlaces(fid){ return Object.keys(NET.nodes).filter(id => N(id).type === "place" && N(id).ll && (fid === "all" || (N(id).fields || []).includes(fid))); }
function mapHtml(fid, ty, id){
  const ls = mapLines(fid, ty), ps = mapPlaces(fid);
  const walkedP = []; S.walked.forEach(w => { const p = placeOf(w); if (p && N(p) && N(p).ll && walkedP[walkedP.length - 1] !== p) walkedP.push(p); });
  const seen = new Set(walkedP);
  let g = ls.map(l => `<path class="ln" data-line="${l.id}" d="${arc(llOf(l.from), llOf(l.to))}" fill="none" stroke="${LT[l.type][3]}" stroke-width="${l.pend ? .5 : .55}" ${l.pend ? 'stroke-dasharray="1.5 1"' : ""} opacity=".75"/><path class="ln" data-line="${l.id}" d="${arc(llOf(l.from), llOf(l.to))}" fill="none" stroke="transparent" stroke-width="3"/>`).join("");
  if (walkedP.length > 1) g += `<path d="${walkedP.map((p, i) => (i ? "L" : "M") + PX(N(p).ll).map(v => v.toFixed(1)).join(" ")).join("")}" fill="none" stroke="#ffd98a" stroke-width=".8" stroke-dasharray="1.6 1.2" opacity=".95"/>`;
  g += ps.map(p => { const [x, y] = PX(N(p).ll), r = Math.min(2.6, 1 + (REACH[p] || 0) * .12), on = seen.has(p);
    return `<g class="dot" data-pin="${p}">${on ? `<circle cx="${x}" cy="${y}" r="${r + 2.2}" fill="#ffd98a" opacity=".35"/>` : ""}<circle cx="${x}" cy="${y}" r="${r}" fill="${on ? "#ffd98a" : "#fff"}" stroke="${on ? "#e2552f" : "#0b1530"}" stroke-width=".35" opacity="${on ? 1 : .88}"/><circle cx="${x}" cy="${y}" r="4.2" fill="transparent"/></g>`; }).join("");
  g += ps.filter(p => (REACH[p] || 0) >= 5 || seen.has(p)).map(p => { const [x, y] = PX(N(p).ll); return `<text class="lbl" x="${x + 2.6}" y="${y + 1.1}">${esc(ui(N(p).name).replace(/（.*$/, ""))}</text>`; }).join("");
  const w = Math.round(330 * 2.4 * S.zoom);
  return `<div class="mapw"><div class="mapbox" id="${id}"><svg viewBox="0 8 360 142" width="${w}" height="${Math.round(w * 142 / 360)}"><image href="https://img.heyvoyo.com/map/earth_night.webp" x="0" y="0" width="360" height="180" preserveAspectRatio="none" opacity=".95"/>${g}</svg></div>
    <div class="zoom"><button data-zoom="1">+</button><button data-zoom="-1">−</button></div>
    <div class="hint">${T("左右拖 · 点一个地方或一条线", "Drag · tap a place or a line")}</div></div>
    <div class="legend">${Object.entries(LT).map(([k, v]) => `<span><i style="background:${v[3]}"></i>${v[0]} ${ZH() ? v[1] : v[2]}</span>`).join("")}</div>`;
}
function centerMap(id, ll){ const box = $("#" + id); if (!box) return; const svg = box.querySelector("svg"); const w = svg.getAttribute("width"); const x = ((ll ? ll[1] : 100) + 180) / 360 * w; box.scrollLeft = x - box.clientWidth / 2; }
function dragMap(box){ if (!box || box._drag) return; box._drag = 1; let sx = 0, sl = 0, down = false, moved = 0; box.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = box.scrollLeft; }); box.addEventListener("pointermove", e => { if (!down) return; moved = Math.abs(e.clientX - sx); box.scrollLeft = sl - (e.clientX - sx); }); window.addEventListener("pointerup", () => { if (down && moved > 6) box._justDragged = Date.now(); down = false; }); }

/* ============ 首页：世界 ============ */
function rng(seed){ let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function feedBatch(){
  const r = rng(S.feedSeed), byField = {};
  allThreads().filter(t => !t.mine).forEach(t => { const f = (t.fields || [])[0] || "x"; (byField[f] = byField[f] || []).push(t); });
  const fs = Object.keys(byField).sort(() => r() - .5), out = [];
  fs.forEach(f => { const arr = byField[f]; out.push(arr[Math.floor(r() * arr.length)]); });
  const wait = S.nudged ? NET.threads.find(t => t.id === S.nudged) : null; // 回答过你的人，正等着你回答
  if (wait) { const i = out.indexOf(wait); if (i >= 0) out.splice(i, 1); out.unshift(wait); }
  out.sort((a, b) => ((b === wait) - (a === wait)) || ((b.lg === TL()) - (a.lg === TL())));   // 跟你在学同一种语言的人排前面（2026-11-13）
  return out.slice(0, 6);
}
function doorHtml(t){
  const k = KIND[t.kind], f = (t.fields || [])[0];
  const wait = t.open && t.lg === OL() && !S.asked[t.id];
  const tr = t.tr && (t.tr[OL()] || t.tr.en || t.tr.zh);
  return `<button class="door press ${wait ? "waitme" : ""}" data-open="${t.on}" data-thread="${t.id}">
    ${wait ? `<span class="flag">${T("在等一个说中文的人", "Waiting for someone who speaks English")}</span>` : ""}
    <div class="who"><img class="av" src="${face(t.by)}" alt=""><div style="flex:1;min-width:0"><b>${esc(pname(t.by))}</b> ${t.seed ? `<span class="seed">🎭 ${T("角色", "Character")}</span>` : ""}<small>${esc(ptag(t.by, !!t.seed))}</small></div></div>
    <div class="q">${k[0]} ${esc(plain(t.text))}</div>
    ${tr && t.lg !== OL() ? `<div class="tr">${esc(tr)}</div>` : ""}
    <div class="at">${f ? ftag(f) : ""}<span>${esc(t.on.startsWith("field:") ? fName(t.on.slice(6)) : (isLine(t.on) ? "🔗 " + lineTitle(LBY[t.on]) : ui(N(t.on).name)))}</span>${t.replies && t.replies.length ? `<em style="font-style:normal;color:var(--soft);font-weight:600;margin-left:auto">${T("有人回了", "answered")} ›</em>` : `<em style="font-style:normal;margin-left:auto">›</em>`}</div>
  </button>`;
}
function trailHtml(clickable){
  if (!S.walked.length) return "";
  return `<div class="mytrail"><div class="h">👣 ${T("我走过的", "WHERE I'VE BEEN")}</div><div class="trail">${S.walked.slice(-12).map((id, i, a) => `${i ? '<span class="tl"></span>' : ""}<button data-go="${id}" title="${esc(nname(id))}"><span class="td">${iconOf(id)}</span>${i === a.length - 1 ? `<span class="tn">${esc(nname(id))}</span>` : ""}</button>`).join("")}</div></div>`;
}
let iconOf = id => id.startsWith("field:") ? F(id.slice(6)).icon : id.startsWith("coll:") ? "📌" : isLine(id) ? "🔗" : (N(id) ? (N(id).role ? "🎭" : TYPES[N(id).type][0]) : "•");
/* 搜索 */
function search(q, enter){
  q = (q || "").trim(); const box = $("#sres"); if (!q) { box.innerHTML = ""; return; }
  const low = q.toLowerCase();
  const hits = Object.entries({...NET.nodes, ...S.newNodes}).filter(([id, n]) => !n.role && ((n.name.zh || "").includes(q) || (n.name.en || "").toLowerCase().includes(low))).slice(0, 7);
  const fh = NET.order.filter(f => (F(f).name.zh || "").includes(q) || (F(f).name.en || "").toLowerCase().includes(low));
  if (!hits.length && !fh.length) {
    if (enter && !S.misses.includes(q)) { S.misses.push(q); drawGaps(); }
    box.innerHTML = `<div class="sres" style="padding:12px 14px"><div style="font-size:14px;color:var(--ink)">${T(`网上还没有「${esc(q)}」。`, `"${esc(q)}" isn't on the net yet.`)}</div><div style="font-size:12.5px;color:var(--soft);margin:3px 0 9px">${T("你知道它？说一句，就能长出新的一页。", "Know it? Say one line and a new page grows.")}</div><button class="cta wide" data-start="${esc(q)}">🌱 ${T("你来开个头？", "Start it?")}</button></div>`;
    if (!S.misses.includes(q)) { S.misses.push(q); drawGaps(); }
    return;
  }
  box.innerHTML = `<div class="sres">${fh.map(f => `<button data-field="${f}">${F(f).icon} <b>${esc(ui(F(f).name))}</b><small>${T("一行", "a field")}</small></button>`).join("")}${hits.map(([id, n]) => `<button data-open="${id}">${iconOf(id)} <b>${esc(ui(n.name))}</b><small>${esc((n.fields || []).map(fName).join(" "))}</small></button>`).join("")}</div>`;
}

/* ============ 一页 ============ */
function go(id, ev){
  if (!id) return;
  if (!N(id) && !S.newNodes[id] && !isLine(id) && !id.startsWith("field:") && !(id.startsWith("row:") && ROW(id.slice(4))) && !(id.startsWith("coll:") && collById(id.slice(5)))) return;
  if (isLine(id) || (S.newLines.find(l => l.id === id))) { openLine(id); return; }
  closeSheet();
  if (S.stack[S.stack.length - 1] !== id) { S.stack.push(id); S.lineField = "all"; S.lineType = "all"; S.lineSub = "all"; }
  if (S.walked[S.walked.length - 1] !== id) S.walked.push(id);
  blip(560 + Math.min(8, S.stack.length) * 30, .06);
  drawPage();
  $("#page").classList.add("on"); $("#page").scrollTop = 0;
  drawGaps();
}
function back(){ S.stack.pop(); closeSheet(); if (!S.stack.length) { $("#page").classList.remove("on"); drawHome(); return; } drawPage(); $("#page").scrollTop = 0; }
function jumpTo(id){ const i = S.stack.lastIndexOf(id); if (i >= 0) { S.stack = S.stack.slice(0, i + 1); drawPage(); $("#page").scrollTop = 0; $("#page").classList.add("on"); } else go(id); }
function home(){ S.stack = []; closeSheet(); $("#page").classList.remove("on"); drawHome(); }
const NODE = id => N(id) || S.newNodes[id];

function photoHtml(id){
  const n = NODE(id), all = (NET.photos[id] || []).filter(p => !p.small);
  if (all.length) {
    const i = (S.phIdx[id] || 0) % all.length, p = all[i];
    return `<div class="hero"><img class="ph" src="${esc(p.u)}" alt="${esc(ui(p.w))}" onload="this.classList.add('ok')" onerror="this.closest('.hero').outerHTML=window.__wnDrawn('${id}')">${all.length > 1 ? `<div class="phn">${all.map((_, k) => `<button data-ph="${id}:${k}" class="${k === i ? "on" : ""}" aria-label="${k + 1}"></button>`).join("")}</div>` : ""}
      <div class="cap">${esc(ui(p.w))}<span class="cr">${esc(ui(p.c))}${p.link ? ` · <a href="${esc(p.link)}" target="_blank" rel="noopener">${T("出处", "source")}</a>` : ""}</span></div></div>`;
  }
  return drawnHtml(id);
}
function drawnHtml(id){
  const n = NODE(id); if (!n) return "";
  let a = NET.art[id];
  if (a === "as_004") a = null; // 旧样板里东京配的是游戏手柄贴纸，不像东京，先不放
  if (n.type === "place" && n.ll) { // 地方：先是它在世界上的哪儿，城市贴纸画放在角上
    const [x, y] = PX(n.ll);
    return `<div class="hero minimap"><svg viewBox="${x - 36} ${y - 14} 72 28" preserveAspectRatio="xMidYMid slice"><image href="https://img.heyvoyo.com/map/earth_night.webp" x="0" y="0" width="360" height="180" preserveAspectRatio="none"/><circle cx="${x}" cy="${y}" r="2.6" fill="#ffd98a" opacity=".4"/><circle cx="${x}" cy="${y}" r="1.2" fill="#ffd98a" stroke="#e2552f" stroke-width=".3"/></svg>${a && !a.startsWith("draw:") ? `<img class="stk" src="https://heyvoyo.com/stk/${a}.webp" alt="">` : ""}<span class="pl">${esc((n.name.en || "").toUpperCase())}</span></div>`;
  }
  if (a && !a.startsWith("draw:")) return `<div class="hero"><div class="drawn"><img class="stk" src="https://heyvoyo.com/stk/${a}.webp" alt=""><div class="y">${esc(n.year || "")}</div></div></div>`;
  const e = a && a.startsWith("draw:") ? a.slice(5) : (n.role ? "🎭" : TYPES[n.type][0]);
  return `<div class="hero"><div class="drawn"><div class="e">${e}</div><div class="y">${esc(n.year || "")}</div></div></div>`;
}
window.__wnDrawn = id => drawnHtml(id);
function readHtml(obj, key, self){
  if (!obj || !obj.text) return "";
  const t = lvText(obj.text[TL()]), m = lvText(obj.text[OL()]);
  if (!t) return "";
  return `<div class="read ${S.showTr[key] ? "show" : ""}" data-rk="${key}">
    <div class="lv">${LVN().map((x, i) => `<button data-lv="${i}" class="${S.lvl === i ? "on" : ""}">${x}</button>`).join("")}</div>
    <div class="t">${linkify(t, self)}</div><div class="m">${esc(plain(m))}</div>
    <div class="row"><button class="sbtn press" data-say="${esc(plain(t))}" data-lg="${TL()}">🔊 ${T("听", "Listen")}</button><button class="sbtn press" data-tr="${key}">${T("意思", "Meaning")}</button></div>
    ${obj.src ? `<div class="src">${T("出处：", "Source: ")}${esc(!ZH() && NET.src_en[obj.src] ? NET.src_en[obj.src] : obj.src)}</div>` : ""}
  </div>`;
}
function lineTitle(l){ return `${ui(NODE(l.from) ? NODE(l.from).name : l.from).replace(/（.*$/, "")} → ${ui(NODE(l.to) ? NODE(l.to).name : l.to).replace(/（.*$/, "")}`; }
function thumbOf(id){
  const p = (NET.photos[id] || [])[0]; if (p) return `<img src="${esc(p.u)}" alt="" loading="lazy">`;
  const a = NET.art[id]; if (a && !a.startsWith("draw:")) return `<img src="https://heyvoyo.com/stk/${a}.webp" alt="" style="object-fit:contain;background:#f6efe0">`;
  return `<span class="em">${a && a.startsWith("draw:") ? a.slice(5) : iconOf(id)}</span>`;
}
/* 一条线为什么值得过去：这条线上、或同一行相邻页上有人公开问过 → 问题；别的行的问题单独一行，不混进这条线的故事 */
function questionNear(nb, l){
  const fs = new Set(l.fields || []);
  const near = new Set([nb, ...(N(nb) && N(nb).type === "place" ? HERE[nb] || [] : [])]);
  const asks = allThreads().filter(t => t.kind === "ask" && !t.mine);
  const onLine = asks.find(t => t.on === l.id); if (onLine) return {t: onLine};
  const same = asks.find(t => near.has(t.on) && fs.has((t.fields || [])[0])); if (same) return {t: same};  // 只认这一行的问题；别的行的降到「Over at…」一行
  const other = asks.find(t => near.has(t.on)); return other ? {t: other, other: 1} : null;
}
function subTag(l){ const n = subName(l); return n ? `<span class="sub2 ${l.subAuto ? "auto" : ""}" title="${l.subAuto ? T("从那一句故事里自动认的，等确认", "Guessed from the story, to be confirmed") : ""}">${esc(n)}${l.subAuto ? " · " + T("自动", "auto") : ""}</span>` : ""; }
const storyOf = (l, lg) => l.type === "like" && l.quote ? (l.quote[lg] || "") : (l.text ? ((l.text[lg] || [])[0] || "") : (l.say || ""));
function lineCard(l, cur){
  const fromHere = l.from === cur || (N(cur) && N(cur).type === "place" && placeOf(l.from) === cur && l.to !== cur);
  const nb = fromHere ? l.to : l.from, start = fromHere ? l.from : l.to;
  const nbn = NODE(nb); if (!nbn) return "";
  const lt = LT[l.type] || LT.learn, fs = l.fields || [];
  const q = questionNear(nb, l);
  const story = storyOf(l, TL()), storyM = storyOf(l, OL());
  let sent = linkify(l.type === "like" ? "“" + story + "”" : story, cur, nb);
  if (!sent.includes(`data-open="${nb}"`)) sent += ` <button class="wl nb" data-open="${nb}">→ ${esc(tl(nbn.name))}</button>`;
  const whereNb = nbn.type !== "place" && nbn.at && N(nbn.at) ? ui(N(nbn.at).name) + " · " : "";
  const qf = q && (q.t.fields || [])[0];
  const asked = q && !q.other ? `<div class="asked"><img class="av s" src="${face(q.t.by)}" alt=""><div><b>${esc(pname(q.t.by))}${q.t.seed ? " 🎭" : ""}</b> ${T("问：", "asked: ")}${esc(plain(q.t.text))}${q.t.lg !== OL() && q.t.tr ? `<span class="m">${esc(q.t.tr[OL()] || "")}</span>` : ""}</div></div>` : "";
  const other = q && q.other ? `<button class="other" data-open="${q.t.on}">💬 ${T(`在${esc(nname(q.t.on))}那边，也有人在问`, `Over at ${esc(nname(q.t.on))}, someone is asking too`)} ${qf ? ftag(qf) : ""} ›</button>` : "";
  return `<div class="lk ${l.pend ? "pend" : ""}">
    <div class="h"><span class="ty" style="color:${ltInk(l.type)}">${lt[0]} ${ltName(l.type)}</span>${subTag(l)}${fs.map(ftag).join(" ")}${l.pend ? `<span class="newbadge">🌱 ${T("等核对", "being checked")}</span>` : ""}<span class="yr">${esc(yrOf(l))}</span></div>
    ${dirOf(l) ? `<div class="dir">${esc(dirOf(l))}</div>` : ""}
    <div class="sent">${sent}${storyM && storyM !== story ? `<span class="m">${esc(plain(storyM))}</span>` : ""}</div>
    ${asked}
    <div class="ft"><button class="to" data-open="${nb}">${thumbOf(nb)}<div style="min-width:0"><b>${T("过去：", "Go to ")}${esc(ui(nbn.name))}</b><small>${esc(whereNb)}${esc(TYPES[nbn.type][ZH() ? 1 : 2])}${start !== cur && NODE(start) ? " · " + T("从", "from ") + esc(ui(NODE(start).name)) : ""}</small></div></button><button class="vsb press" data-vs="${l.id}" data-cur="${cur}">⇄ ${T("两头比一比", "Compare")}</button></div>
    ${other}
  </div>`;
}
function linesAt(id){
  const n = NODE(id); const ids = new Set([id]); if (n && n.type === "place") (HERE[id] || []).forEach(x => ids.add(x));
  const ls = [...NET.lines, ...S.newLines].filter(l => ids.has(l.from) || ids.has(l.to));
  // 几行交错着摆：东京页一打开就同时看到动画、吃的、时尚……而不是先翻完一整行
  const by = {}; ls.forEach(l => { const f = (l.fields || [])[0] || "x"; (by[f] = by[f] || []).push(l); });
  Object.values(by).forEach(a => a.sort((x, y) => (x.y || 0) - (y.y || 0)));
  const out = [], keys = Object.keys(by); let i = 0;
  while (out.length < ls.length) { keys.forEach(k => { if (by[k][i]) out.push(by[k][i]); }); i++; }
  return out;
}
function threadsAt(id){
  const n = NODE(id); const ids = new Set([id]); if (n && n.type === "place") (HERE[id] || []).forEach(x => ids.add(x));
  return allThreads().filter(t => ids.has(t.on));
}
function drawPage(){
  const id = S.stack[S.stack.length - 1];
  if (id.startsWith("field:")) return drawField(id.slice(6));
  if (id.startsWith("row:")) return drawRow(id.slice(4));
  const n = NODE(id); if (!n) return;
  const isPlace = n.type === "place";
  let html = barHtml();
  html += `<div class="pin">`;
  html += photoHtml(id);
  html += `<div class="ttl">${esc(ui(n.name))}${n.newNode ? ` <span class="newbadge">🌱 ${T("新长出来的一页 · 还在核对", "New page · being checked")}</span>` : ""}</div>`;
  const where = !isPlace && n.at && N(n.at) ? `<button class="lnk" data-open="${n.at}">📍 ${esc(ui(N(n.at).name))}</button>` : "";
  html += `<div class="meta">${n.role ? "🎭 " + T("角色", "Character") : TYPES[n.type][0] + " " + TYPES[n.type][ZH() ? 1 : 2]}${n.year ? " · " + esc(n.year) : ""} ${where} ${(n.fields || []).map(f => `<button class="lnk" data-field="${f}">${esc(fName(f))}</button>`).join("")}</div>`;
  if (n.newNode) html += `<div class="newpg">${T(`这一页是 ${esc(pname("me"))} 开的头：「${esc(n.said)}」。事实要核对，你的感受会标成「看法」。`, `You started this page: "${esc(n.said)}". Facts get checked; your feelings are marked as a view.`)}</div>`;
  if (n.role) html += castHtml(id, true);
  else html += readHtml(n, id, id);
  if (n.type === "person" && !n.role) html += likesHtml(id);
  if (n.q && !n.role) html += `<div class="kind" style="margin-top:10px">💭 ${esc(plain(tl(n.q)))}${tl(n.q) !== ui(n.q) ? `<span style="display:block;font-size:11.5px;color:var(--soft)">${esc(plain(ui(n.q)))}</span>` : ""} <button class="sbtn" style="margin-left:6px;padding:2px 9px" data-compose="${id}" data-kind="think">${T("说一句", "Say one line")}</button></div>`;

  // 在这儿的
  if (isPlace) {
    const things = (HERE[id] || []).filter(x => !N(x).role), people = (HERE[id] || []).filter(x => N(x).role);
    if (things.length) html += `<div class="sec">📍 ${T("在这儿的", "HERE")}</div><div class="here">${things.sort((a, b) => (+N(a).year || 0) - (+N(b).year || 0)).map(x => `<button class="hc press" data-open="${x}"><div class="im">${(NET.photos[x] || [])[0] ? `<img src="${esc(NET.photos[x][0].u)}" alt="" loading="lazy" onerror="this.parentNode.textContent='${iconOf(x)}'">` : (NET.art[x] && !NET.art[x].startsWith("draw:") ? `<img src="https://heyvoyo.com/stk/${NET.art[x]}.webp" alt="" style="object-fit:contain">` : iconOf(x))}</div><b>${esc(ui(N(x).name))}</b><small>${esc(N(x).year || "")} ${(N(x).fields || []).map(f => F(f).icon).join("")}</small></button>`).join("")}</div>`;
    if (people.length) html += `<div class="sec">🎭 ${T("住在这儿的人", "PEOPLE WHO LIVE HERE")}</div>` + people.map(c => castHtml(c, false)).join("");
  }
  // 角色说过这件事
  const said = Object.keys(NET.nodes).filter(k => N(k).role && N(k).pages && Object.entries(N(k).pages).some(([lg, pg]) => pg[id] && qOK(N(k), pg[id], lg)));
  if (said.length) html += `<div class="sec">🎭 ${T("这一行的人说过这件事", "SOMEONE IN THE FIELD ON THIS")}</div>` + said.map(c => { const pg = N(c).pages[TL()] && N(c).pages[TL()][id] || Object.values(N(c).pages).map(p => p[id]).find(Boolean); return `<div class="cast"><div class="who"><img class="av" src="${face(N(c).who)}" alt=""><div style="flex:1;min-width:0"><b>${esc(pname(N(c).who))}</b> <span class="seed">🎭 ${T("角色", "Character")}</span><small>${esc(ui(N(c).pos))}</small></div><button class="sbtn" data-open="${c}">${T("TA 的页", "Profile")}</button></div><div class="ans" style="margin-top:8px"><b style="color:var(--ink)">${esc(plain(pg.q))}</b>${qTr(N(c), pg, N(c).pages[TL()] && N(c).pages[TL()][id] ? TL() : Object.keys(N(c).pages).find(l => N(c).pages[l][id])) ? `<span class="m" style="margin:0 0 3px">${esc(qTr(N(c), pg, N(c).pages[TL()] && N(c).pages[TL()][id] ? TL() : Object.keys(N(c).pages).find(l => N(c).pages[l][id])))}</span>` : "<br>"}${linkify(pg.a, id)}<span class="m">${esc(pg[OL()] || pg.en || pg.zh || "")}</span></div></div>`; }).join("");

  // 它所有的线
  let ls = linesAt(id);
  const fsIn = [...new Set(ls.flatMap(l => l.fields || []))];
  const lf = S.lineField !== "all" && fsIn.includes(S.lineField) ? S.lineField : "all";
  const byF = ls.filter(l => lf === "all" || (l.fields || []).includes(lf));
  const cnt = (arr, k) => arr.reduce((o, l) => (o[k(l)] = (o[k(l)] || 0) + 1, o), {});
  const tyN = cnt(byF, l => l.type), tys = Object.keys(LT).filter(k => tyN[k]);
  const ty = S.lineType !== "all" && tyN[S.lineType] ? S.lineType : "all";
  const byT = byF.filter(l => ty === "all" || l.type === ty);
  const subN = cnt(byT.filter(l => l.sub), l => l.sub), subs = Object.keys(subN);
  const sb = S.lineSub !== "all" && (subN[S.lineSub] || S.lineSub === "_none") ? S.lineSub : "all";
  const shown = byT.filter(l => sb === "all" || (sb === "_none" ? !l.sub : l.sub === sb));
  html += `<div class="sec" id="linesH">🔗 ${isPlace ? T("从这儿出去的线", "LINES FROM HERE") : T("它的线", "ITS LINES")} <span style="font-weight:600;letter-spacing:0;color:var(--soft)">${ls.length}</span></div>`;
  if (fsIn.length > 1) html += `<div class="chiprow" style="margin-top:0">${["all", ...fsIn].map(f => `<button class="chip ${lf === f ? "on" : ""}" data-lf="${f}">${f === "all" ? T("每一行", "Every field") : esc(fName(f))}<span class="n">${f === "all" ? ls.length : ls.filter(l => (l.fields || []).includes(f)).length}</span></button>`).join("")}</div>`;
  if (tys.length) html += `<div class="chiprow" style="margin-top:0">${["all", ...tys].map(k => `<button class="chip ${ty === k ? "on" : ""}" data-lty="${k}">${k === "all" ? T("所有种类", "All kinds") : `<i style="background:${LT[k][3]}"></i>${LT[k][0]} ${ltName(k)}`}<span class="n">${k === "all" ? byF.length : tyN[k]}</span></button>`).join("")}</div>`;
  if (ty !== "all" && subs.length) { const none = byT.filter(l => !l.sub).length; html += `<div class="chiprow subs" style="margin-top:0">${["all", ...subs, ...(none ? ["_none"] : [])].map(k => `<button class="chip ${sb === k ? "on" : ""}" data-lsub="${k}">${k === "all" ? T("都看", "All") : k === "_none" ? T("还没细分", "Not split yet") : esc(ui(SUBS[ty][k]))}<span class="n">${k === "all" ? byT.length : k === "_none" ? none : subN[k]}</span></button>`).join("")}</div>`; }
  if (shown.length) html += shown.map(l => lineCard(l, id)).join("");
  else if (ls.length) html += `<div class="empty">${T("这个种类这儿还没有线。", "No lines of this kind here yet.")}</div>`;
  else if (!isPlace && n.at) {
    const pl = linesAt(n.at).slice(0, 5);
    html += `<div class="empty" style="padding:4px 4px 10px;text-align:left">${T(`它自己还没有线。它在${esc(ui(N(n.at).name))}，那儿有这些线：`, `No lines of its own yet. It's in ${esc(ui(N(n.at).name))}, which has these:`)}</div>` + pl.map(l => lineCard(l, n.at)).join("");
  } else html += `<div class="empty">${T("这儿还没有线。", "No lines here yet.")}</div>`;
  if (!isPlace && n.at && shown.length) {
    const more = linesAt(n.at).filter(l => !shown.includes(l)).slice(0, 3);
    if (more.length) html += `<div class="sec" style="margin-top:14px">📍 ${T(`${esc(ui(N(n.at).name))}还有`, `ALSO FROM ${esc(ui(N(n.at).name)).toUpperCase()}`)}</div>` + more.map(l => lineCard(l, n.at)).join("");
  }
  if (ls.length <= 1) html += keepGoing(id);
  html += `<button class="morebtn" data-addline="${id}">🔗 ${T("我知道一条线，网上还没有", "I know a line that isn't here")}</button>`;

  // 公开聊
  const th = threadsAt(id);
  html += `<div class="sec">💬 ${T("这里的公开聊", "PUBLIC TALK HERE")}</div>`;
  html += th.length ? th.map(t => threadHtml(t, isPlace && t.on !== id)).join("") : `<div class="empty">${T("这里还没有人说话。你可以第一个。", "No one has spoken here yet. You could be first.")}</div>`;
  html += `<div style="display:flex;gap:8px;margin-top:6px"><button class="cta" style="flex:1" data-compose="${id}" data-kind="ask">❓ ${T("问一句", "Ask")}</button><button class="cta navy" style="flex:1" data-compose="${id}" data-kind="think">💭 ${T("说我的想法", "My thought")}</button></div>`;
  html += `<p class="sub" style="text-align:center;margin-top:10px">${T("说的话大家都能看到，挂在这一页下面。", "Everyone can see what you say; it hangs on this page.")}</p>`;
  html += `<button class="morebtn" style="margin-top:6px" data-start="">🌱 ${T(`${isPlace ? "这儿" : "这附近"}还缺一样东西？你来开个头`, "Something missing here? Start it")}</button>`;
  html += `</div>`;
  $("#page").innerHTML = html;
}
/* 死胡同：只有来时那一条线的点，至少给一样能接着走的 */
function keepGoing(id){
  const n = NODE(id), pl = placeOf(id), out = [];
  const plural = k => k === 1 ? T("1 条线从那儿出去", "1 line goes out from there") : T(`${k} 条线从那儿出去`, `${k} lines go out from there`);
  if (n && n.type !== "place" && n.at && N(n.at) && linesAt(n.at).length > 1) out.push(`<button data-open="${n.at}">📍 ${T("它在：", "It's in ")}${esc(ui(N(n.at).name))}<small>${plural(linesAt(n.at).length)}</small></button>`);
  const near = new Set([id, pl, ...(HERE[pl] || [])]);
  const ask = allThreads().find(t => t.kind === "ask" && !t.mine && near.has(t.on) && t.on !== id);
  const f0 = (n.fields || [])[0];
  const far = !ask && f0 && allThreads().find(t => t.kind === "ask" && !t.mine && (t.fields || [])[0] === f0 && t.on !== id);
  const asker = t => `${esc(pname(t.by))}${t.seed ? " 🎭" : ""}`, askTr = t => t.lg !== OL() && t.tr && t.tr[OL()] ? `<small class="trq">${esc(t.tr[OL()])}</small>` : "";
  if (ask) out.push(`<button data-open="${ask.on}" data-th="${ask.id}">💬 ${T("这儿有人在问：", "Someone's asking here: ")}${asker(ask)}<small>${esc(plain(ask.text))}</small>${askTr(ask)}</button>`);
  else if (far) out.push(`<button data-open="${far.on}" data-th="${far.id}">💬 ${T(`在${esc(fName(f0))}别的地方，有人在问`, `Elsewhere in ${esc(fName(f0))}, someone is asking`)}<small>${asker(far)}${T("：", ": ")}${esc(plain(far.text))}</small>${askTr(far)}</button>`);
  out.push(`<button data-wander="1">🎲 ${T("随便走走", "Wander somewhere")}<small>${T("去网上随便一个线多的地方", "jump to a busy corner of the net")}</small></button>`);
  return `<div class="sec">🧭 ${T("从这儿接着走", "GO ON FROM HERE")}</div><div class="keep">${out.join("")}</div>`;
}
function barHtml(){
  return `<div class="bar"><button class="back press" data-back="1">‹</button><div class="trail">${S.stack.map((x, i, a) => `${i ? '<span class="tl"></span>' : ""}<button data-jump="${x}" title="${esc(nname(x))}"><span class="td ${i === a.length - 1 ? "cur" : ""}">${iconOf(x)}</span>${i === a.length - 1 ? `<span class="tn">${esc(nname(x))}</span>` : ""}</button>`).join("")}</div><button class="home" data-mylang="1" title="${T("我的语言", "My language")}">🌱</button><button class="home" data-home="1" title="${T("回到世界", "Back to World")}">🌐</button></div>`;
}

/* 一行：只是网的一个看法 */
function drawField(fid){
  const f = F(fid);
  const ids = Object.keys(NET.nodes).filter(k => (N(k).fields || []).includes(fid));
  const places = ids.filter(k => N(k).type === "place").sort((a, b) => (REACH[b] || 0) - (REACH[a] || 0));
  let html = barHtml() + `<div class="pin">`;
  html += `<div class="fpost" style="background:${f.color};min-height:120px;display:block"><span class="ic" style="font-size:44px">${f.icon}</span><b style="font-size:24px">${esc(ui(f.name))}</b><small style="font-size:13px">${esc(ui(f.one))}</small></div>`;
  html += `<div class="sec">🌐 ${T("这一行在网上", "THIS FIELD ON THE NET")}</div>`;
  html += mapHtml(fid, "all", "fmap");
  html += `<div class="sec">📍 ${T("挑一个地方进去", "PICK A PLACE")}</div><div class="chiprow" style="margin-top:0;flex-wrap:wrap;overflow:visible">${places.slice(0, 18).map(p => `<button class="chip" data-open="${p}">${esc(ui(N(p).name).replace(/（.*$/, ""))}</button>`).join("")}</div>`;
  if ((f.cast || []).length) html += `<div class="sec">🎭 ${T("这一行的人", "PEOPLE IN THIS FIELD")}</div><div class="here">${f.cast.filter(N).map(c => `<button class="hc press" data-open="${c}"><div class="im"><img src="${face(N(c).who)}" alt=""></div><b>${esc(pname(N(c).who))}</b><small>${esc(ui(N(c).pos))}</small></button>`).join("")}</div>`;
  const th = allThreads().filter(t => (t.fields || []).includes(fid)).slice(0, 4);
  if (th.length) html += `<div class="sec">💬 ${T("这一行在聊", "TALK IN THIS FIELD")}</div>` + th.map(t => threadHtml(t, true)).join("");
  html += `<div class="sec">🕰️ ${T("一路走来（一种看法，可以不看）", "HOW IT GOT HERE (OPTIONAL)")}<button class="r" data-route="${fid}">${S.routeOpen === fid ? T("收起", "Hide") : T("打开", "Show")}</button></div>`;
  if (S.routeOpen === fid) html += (f.route || []).filter(N).map((s, i) => `<button class="lk press" data-open="${s}"><div class="h"><span class="ty">${i + 1}</span><span class="yr">${esc(N(s).year || "")}</span></div><div class="to">${thumbOf(s)}<div><b>${esc(ui(N(s).name))}</b><small>${N(s).at && N(N(s).at) ? esc(ui(N(N(s).at).name)) : ""}</small></div></div></button>`).join("");
  html += `</div>`;
  $("#page").innerHTML = html;
  const box = $("#fmap"); dragMap(box); requestAnimationFrame(() => centerMap("fmap", places[0] && N(places[0]).ll));
}

/* 🎭 角色 */
function castHtml(c, full){
  const n = N(c), who = n.who, chat = n.chat ? (n.chat[TL()] || Object.values(n.chat)[0] || []) : [];
  const open = full || S.castOpen[c];
  return `<div class="cast"><div class="who"><img class="av" src="${face(who)}" alt=""><div style="flex:1;min-width:0"><b>${esc(pname(who))}</b> <span class="seed">🎭 ${T("角色", "Character")}</span><small>${esc(ptag(who, true))}</small></div>${full ? "" : `<button class="sbtn" data-cast="${c}">${open ? T("收起", "Hide") : T("问 TA", "Ask")}</button>`}</div>
    ${open ? `<div class="qs">${chat.filter(x => qOK(n, x)).slice(0, 4).map((x, i) => `<button data-ca="${c}:${i}">${esc(plain(x.q))}${qTr(n, x) ? `<small style="display:block;font-weight:600;color:var(--soft);font-size:11.5px">${esc(qTr(n, x))}</small>` : ""}</button>${S.castOpen[c + ":" + i] ? `<div class="ans">${linkify(x.a)} <button class="sbtn" style="padding:1px 8px" data-say="${esc(x.a)}" data-lg="${chatLang(n)}">🔊</button><span class="m">${esc(x[OL()] || x.en || x.zh || "")}</span></div>` : ""}`).join("")}</div>
    <div class="ai">${T("准备好的问题免费。", "Prepared questions are free.")}</div>` : ""}</div>`;
}
const chatLang = n => n.chat ? (n.chat[TL()] ? TL() : Object.keys(n.chat)[0]) : TL();
/* 角色问答的问题：不是界面语言的，配上 qtr 里的翻译；没有翻译又不是在学的语言，就不显示 */
const uiLg = () => !ZH() ? "en" : "zh";
const qTr = (n, x, lg) => { lg = lg || chatLang(n); if (lg === uiLg()) return ""; return uiLg() === "en" ? (x.qen || "") : (x.qzh || ""); };
const qOK = (n, x, lg) => { lg = lg || chatLang(n); return lg === uiLg() || lg === TL() || !!qTr(n, x, lg); };

/* 公开聊 */
function msgHtml(m, key, lg, opener, t){
  const tr = m.tr && (m.tr[OL()] || "");
  const th = S.thanked[key], ez = m.easy && (m.easy[TL()] || m.easy[lg]);
  return `<div class="msg ${S.showTr[key] ? "showtr" : ""} ${opener ? "" : "reply"}"><img class="av s" src="${face(m.by)}" alt=""><div class="bd">
    <div class="nm">${m.rt ? `<span class="rt">${esc(RT[m.rt] ? RT[m.rt][ZH() ? 0 : 1] : m.rt)}</span>` : ""}${esc(pname(m.by))}<small>${esc(ptag(m.by))}</small></div>
    <div class="tx">${linkify(m.text, t && t.on)}</div>${tr && lg !== OL() ? `<div class="tr">${esc(tr)}</div>` : ""}
    ${S.what[key] ? whatHtml(m, lg) : ""}
    ${S.easy[key] && ez ? `<div class="easy">${ez.map(x => `<div>${esc(x)}</div>`).join("")}</div>` : ""}
    <div class="acts"><button data-say="${esc(plain(m.text))}" data-lg="${lg}">🔊</button>${tr && lg !== OL() ? `<button data-mtr="${key}">${T("意思", "Meaning")}</button>` : ""}${ez && lg === TL() ? `<button data-easy="${key}">🪜 ${T("简单一点", "Simpler")}</button>` : ""}${m.by !== "me" ? `<button class="wh" data-what="${key}">❔ ${T("这句话在说什么？", "What's this saying?")}</button>` : ""}${!opener && m.by !== "me" ? `<button class="thx ${th ? "on" : ""}" data-thx="${key}" data-who="${m.by}">${th ? "💛 " + T("谢过了", "Thanked") : "💛 " + T("谢谢", "Thanks")}</button>` : ""}</div>
  </div></div>`;
}
function whatHtml(m, lg){
  const w = HV.whatSays(m.text, lg, m.fn, ZH() ? "zh" : "en");
  return `<div class="hvs-what">${w.html}${w.auto ? `<span style="display:block;font-size:11px;color:var(--soft)">${T("（按句子里的词猜的，可能不准）", "(guessed from the words in it — may be off)")}</span>` : ""}<button class="hvs-lk" data-tomedr="d${w.ns[0]}" style="font-size:12px;font-weight:800;color:var(--hot)">${T("在我的语言里看这个抽屉 →", "Open this drawer in My language →")}</button></div>`;
}
function threadHtml(t, showOn){
  const k = KIND[t.kind], lg = t.lg;
  const ans = t.replies || [];
  const wait = t.open && t.lg === OL();
  return `<div class="thr ${t.mine ? "mine" : ""}" id="th-${t.id}">
    <div class="top">${k[0]} ${ZH() ? k[1] : k[2]} ${t.seed ? `<span class="seed">🎭 ${T("角色", "Character")}</span>` : ""}${t.mine ? `<span class="seed" style="background:#fdeee8;color:var(--hot)">${T("大家都能看到", "Everyone can see this")}</span>` : ""}${showOn ? `<button class="lnk" style="border:0;background:var(--paper);border-radius:99px;padding:2px 8px;font-size:11px;font-weight:800;color:var(--ink);margin-left:auto" data-open="${t.on}">${iconOf(t.on)} ${esc(nname(t.on))}</button>` : ""}</div>
    ${msgHtml({...t}, t.id + "_0", lg, true, t)}
    ${ans.map((r, i) => msgHtml(r, t.id + "_" + (i + 1), r.lg || lg, false, t)).join("")}
    ${(t.thanks || []).map(([a, b]) => `<div class="kind">🛟 ${esc(pname(a))} ${T("谢了", "thanked")} ${esc(pname(b))}</div>`).join("")}
    ${wait && !S.asked[t.id] ? `<button class="cta wide" style="margin-top:9px" data-answer="${t.id}">${T(`用中文回答 ${esc(pname(t.by))}`, `Answer ${esc(pname(t.by))} in English`)}</button>` : ""}
    ${t.mine && t.kind === "ask" && !ans.length ? `<div class="kind">⏳ ${T(`等这一行的人回答。他们会用${lgName(TL())}回你，说慢一点、简单一点。`, `Waiting for people in the field. They'll answer in ${lgName(TL())}, slowly and simply.`)}</div>` : ""}
  </div>`;
}

/* ② 线：两头并排比（WhoSampled） */
function endPoster(id){
  const n = NODE(id); if (!n) return `<div class="pos">•</div>`;
  const all = NET.photos[id] || [], p = all.filter(x => !x.small)[0] || all[0];
  if (p) return `<div class="pos"><img src="${esc(p.u)}" alt="${esc(ui(p.w))}" loading="lazy" onerror="this.parentNode.textContent='${iconOf(id)}'"></div>`;
  const a = NET.art[id];
  if (a && a !== "as_004" && !a.startsWith("draw:")) return `<div class="pos"><img src="https://heyvoyo.com/stk/${a}.webp" alt=""></div>`;
  if (n.type === "place" && n.ll) { const [x, y] = PX(n.ll); return `<div class="pos" style="background:#0b1530"><svg viewBox="${x - 24} ${y - 18} 48 36" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><image href="https://img.heyvoyo.com/map/earth_night.webp" x="0" y="0" width="360" height="180" preserveAspectRatio="none"/><circle cx="${x}" cy="${y}" r="2.6" fill="#ffd98a" opacity=".4"/><circle cx="${x}" cy="${y}" r="1.2" fill="#ffd98a" stroke="#e2552f" stroke-width=".3"/></svg></div>`; }
  return `<div class="pos">${a && a.startsWith("draw:") ? a.slice(5) : iconOf(id)}</div>`;
}
function endHtml(id, isHere){
  const n = NODE(id); if (!n) return "";
  const p = (NET.photos[id] || []).filter(x => !x.small)[0] || (NET.photos[id] || [])[0];
  const cur = S.sheetCur && NODE(S.sheetCur) ? nname(S.sheetCur).replace(/\s*\(.*$/, "") : "";
  return `<div class="end press ${isHere ? "here" : ""}" data-open="${id}" role="button" tabindex="0">${isHere ? `<span class="here-t">${cur ? T(`你从「${esc(cur)}」这一页来`, `You came from ${esc(HV.the(cur))} page`) : T("你从这头来", "You came from this end")}</span>` : ""}${endPoster(id)}
    <div style="min-width:0"><b>${esc(ui(n.name))}</b><small>${esc(n.role ? "🎭 " + T("角色", "Character") : TYPES[n.type][ZH() ? 1 : 2])}${n.type !== "place" && n.at && N(n.at) ? " · " + esc(ui(N(n.at).name)) : ""}</small>${n.year ? `<span class="yr">${esc(n.year)}</span>` : ""}
    ${p ? `<div class="cr">${esc(ui(p.c))}${p.link ? ` · <a href="${esc(p.link)}" target="_blank" rel="noopener">${T("出处", "source")}</a>` : ""}</div>` : ""}</div></div>`;
}
function openLine(id, cur){
  const l = LBY[id] || S.newLines.find(x => x.id === id); if (!l) return;
  cur = cur || S.stack[S.stack.length - 1] || null;
  if (S.walked[S.walked.length - 1] !== id) S.walked.push(id);
  const lt = LT[l.type] || LT.learn;
  const at = e => cur && (cur === l[e] || (N(cur) && N(cur).type === "place" && placeOf(l[e]) === cur));
  const here = at("to") && !at("from") ? "to" : at("from") ? "from" : null;
  const other = here === "to" ? l.from : l.to;
  const story = storyOf(l, TL()), storyM = storyOf(l, OL());
  const th = allThreads().filter(t => t.on === id);
  S.sheetCur = cur;
  openSheet(`<div class="grab"></div>
    <div class="vs">
      ${endHtml(l.from, here === "from")}
      <div class="mid"><span class="ic" style="background:${lt[3]}">${lt[0]}</span><span style="color:${ltInk(l.type)}">${ltName(l.type)}${subName(l) ? " · " + esc(subName(l)) : ""}</span>${dirOf(l) ? `<span class="vb">${esc(dirOf(l))}</span>` : ""}<span class="yr">${esc(yrOf(l))}</span><span class="ar">↓</span></div>
      ${endHtml(l.to, here === "to")}
    </div>
    <div class="howto">${l.type === "like" ? "“" : ""}${linkify(story || lineTitle(l), null)}${l.type === "like" ? "”" : ""}${storyM && storyM !== story ? `<span class="m">${esc(plain(storyM))}</span>` : ""}${l.type === "like" && l.quote_src ? `<span class="m">— ${esc(l.quote_src)}</span>` : ""}</div>
    <button class="cta wide" style="margin-top:10px" data-open="${other}">⇄ ${T("换到那一头：", "Switch to the other end: ")}${esc(ui(NODE(other).name))} →</button>
    ${l.pend ? `<div class="newpg">🌱 ${T("这条线是你说的，正在核对出处：", "You added this line; its source is being checked: ")}${esc(l.src)}</div>` : readHtml(l, "L" + id)}
    <div class="sec">💬 ${T("这条线上的公开聊", "TALK ON THIS LINE")}</div>
    ${th.length ? th.map(t => threadHtml(t, false)).join("") : `<div class="empty" style="padding:8px">${T("还没有人在这条线上说话。", "No one has spoken on this line yet.")}</div>`}
    <button class="cta wide navy" data-compose="${id}" data-kind="ask">❓ ${T("在这条线上问一句", "Ask about this line")}</button>`);
  S.sheetLine = {id, cur};
  blip(700, .05);
}

/* ④ 人带着线：TA 喜欢的（荒岛唱片 / Criterion 衣柜挑片） */
function likesHtml(id){
  const n = NODE(id), ls = [...NET.lines, ...S.newLines].filter(l => l.type === "like" && l.from === id);
  let h = `<div class="sec" id="likesH">❤️ ${T("TA 喜欢的", "WHAT THEY LOVE")}<span style="font-weight:600;letter-spacing:0;color:var(--soft)">${T("一张 TA 自己的挑选清单", "their own list of picks")}</span></div><div class="likes">`;
  if (ls.length) h += ls.map(l => { const to = NODE(l.to); if (!to) return ""; const cross = (to.fields || []).filter(f => !(n.fields || []).includes(f));
    return `<button class="li press" data-open="${l.to}">${thumbOf(l.to)}<div style="min-width:0"><div class="q">“${esc(plain((l.quote || {})[TL()] || ""))}”</div><div class="qm">${esc(plain((l.quote || {})[OL()] || ""))}</div>
      <div class="qs">→ <b style="color:var(--ink)">${esc(ui(to.name))}</b>${subName(l) ? " · " + esc(subName(l)) : ""}${cross.length ? " · " + T("跨到 ", "into ") + cross.map(fName).join(" ") : ""} · ${T("出处：", "Source: ")}${esc(l.quote_src || l.src || "")}</div></div></button>`; }).join("");
  else h += `<div class="emp">${T(`还没有记下<b>${esc(ui(n.name))}</b>喜欢的东西。这里只放 TA 自己在访谈、书、节目里说过的——吃的、看的、用的，每一样带一句 TA 的话和出处，不放粉丝传言。`, `Nothing from <b>${esc(ui(n.name))}</b> yet. Only things they said themselves — in an interview, a book, a show — go here: what they eat, watch, use, each with their own words and a source. No fan rumours.`)}
    <div style="margin-top:8px"><button class="sbtn press" data-addline="${id}" data-lt0="like">❤️ ${T("我知道 TA 喜欢什么（要写出处）", "I know something they love (with a source)")}</button></div></div>`;
  return h + `</div>`;
}

function openSheet(html){ S.sheetLine = null; $("#sheet").innerHTML = html; $("#sheet").classList.add("on"); $("#scrim").classList.add("on"); $("#sheet").scrollTop = 0; }
function closeSheet(){ S.sheetLine = null; $("#sheet").classList.remove("on"); $("#scrim").classList.remove("on"); }

/* 说一句（挂到公开聊）：三页共用一个框（HV.say），说完存进 hv.mylang.v1，回应先接住你的话 */
const GEN_ST = {
  zh: {think: [["我第一次……", "The first time I…"], ["我一直以为……", "I always thought…"], ["我们那边……", "Where I'm from…"]],
       ask: [["我想问一下，……", "Can I ask…"], ["你们那边，……吗？", "Where you are, do people…?"], ["我一直不明白，为什么……", "I've never understood why…"]]},
  en: {think: [["The first time I…", "我第一次……"], ["I always thought…", "我一直以为……"], ["Where I'm from, …", "我们那边……"]],
       ask: [["Can I ask…", "我想问一下……"], ["Where you live, do people…?", "你们那边……吗？"], ["I've never understood why…", "我一直不明白，为什么……"]]}};
const shortName = (id, lg) => { if (String(id).startsWith("field:")) { const f = F(id.slice(6)); return f ? (lg === "zh" ? f.name.zh : f.name.en) : id; } const n = NODE(id); if (!n) return nname(id); return ((lg === "zh" ? n.name.zh : n.name.en) || ui(n.name)).replace(/（.*$/, "").replace(/\s*\(.*$/, "").replace(/^《(.*)》$/, "$1"); };
function starters(on, kind, t, lg){
  const n = NODE(on), o = lg === "zh" ? "en" : "zh";
  const opts = (t && ((t.tp && t.tp.opts) || t.opts)) || (!t && n && n.tp && n.tp.opts) || (!t && LBY[on] && LBY[on].tp && LBY[on].tp.opts);
  if (opts && opts.length) return opts.slice(0, 3).filter(x => x[lg]).map(x => ({t: x[lg], m: lg === OL() ? "" : (x[o] || ""), when: x.when || null, by: t ? t.by : null, thread: t ? t.id : null}));
  return (GEN_ST[lg] || GEN_ST.en)[kind === "ask" ? "ask" : "think"].map(x => ({t: x[0], m: lg === OL() ? "" : x[1]}));
}
function questionFor(on, kind, t, lg){
  if (t) return {t: plain(t.text), tr: t.tr && t.tr[OL()] || ""};
  const n = NODE(on), l = LBY[on];
  if (n && n.q && kind !== "ask") return {t: plain(n.q[lg] || ""), tr: lg === OL() ? "" : plain(n.q[OL()] || "")};
  const o = lg === "zh" ? "en" : "zh";
  if (l) { const A = x => shortName(l.from, x), B = x => shortName(l.to, x);
    const q = {zh: kind === "ask" ? `从「${A("zh")}」到「${B("zh")}」，你想问什么？` : `从「${A("zh")}」到「${B("zh")}」，你想到了自己的什么事？`, en: kind === "ask" ? `From ${A("en")} to ${B("en")} — what would you like to ask?` : `From ${A("en")} to ${B("en")} — does it remind you of anything in your own life?`};
    return {t: q[lg], tr: lg === OL() ? "" : q[o]}; }
  const nm = x => shortName(on, x);
  const q = {zh: kind === "ask" ? `关于「${nm("zh")}」，你想问这儿的人什么？` : `「${nm("zh")}」让你想到自己的什么事？`, en: kind === "ask" ? `What would you like to ask people here about ${nm("en")}?` : `Does ${nm("en")} remind you of anything in your own life?`};
  return {t: q[lg], tr: lg === OL() ? "" : q[o]};
}
function whereOf(on, t){
  const l = LBY[on];
  const nm = x => l ? `${shortName(l.from, x)} → ${shortName(l.to, x)}` : shortName(on, x);
  if (t) return {zh: `在「${nm("zh")}」回答 ${pname(t.by)}`, en: `Answering ${pname(t.by)} on ${nm("en")}`};
  return l ? {zh: `🧵 在「${nm("zh")}」这条线上`, en: `🧵 On the line ${nm("en")}`} : {zh: `📍 在「${nm("zh")}」这一页`, en: `📍 On ${HV.the(nm("en"))} page`};
}
function compose(on, kind, answering){
  const t = answering && allThreads().find(x => x.id === answering);
  const lg = t ? t.lg : TL(), l = LBY[on];
  closeSheet();
  HV.say({host: PHONE, ui: ZH() ? "zh" : "en", lg, net: NET, face, kind: t ? "answer" : kind, answering: t ? t.id : null,
    question: questionFor(on, kind, t, lg), starters: starters(on, kind, t, lg),
    src: {page: "net", node: l ? null : on, line: l ? on : null, thread: t ? t.id : null}, where: whereOf(on, t),
    place: l ? placeOf(l.from) : placeOf(on),
    fx: (ev, w) => { if (w === "reply") blip(820, .07); else { blip(720, .05); noteAt(ev, "✦"); } },
    onAsk: c => { if (c) go(c); else { const f = ((NODE(on) || l || {}).fields || [])[0]; if (f) go("field:" + f); } },
    onSaved: (item, rep) => posted(on, kind, t, item, rep)});
}
function posted(on, kind, t, item, rep){
  const redraw = () => { if (S.stack.length) { const sc = $("#page").scrollTop; drawPage(); $("#page").scrollTop = sc; } else drawHome(); };
  if (t) {
    t.replies = [...(t.replies || []), {by: "me", rt: "answer", text: item.t, tr: {}}];
    S.asked[t.id] = 1; S.buoy++; drawBuoy();
    stamp(T("送到了", "SENT"), T("TA 听懂了", "UNDERSTOOD")); setTimeout(confetti, 300);
    if (!rep.none) setTimeout(() => { t.replies.push({by: rep.by, rt: rep.how === "thx" ? "thx" : rep.away ? "away" : "reply", lg: t.lg, text: rep.t, tr: {[OL()]: rep.tr}}); redraw(); }, 1000);
  } else {
    const n = NODE(on), l = LBY[on];
    const mt = {id: "me" + Date.now(), on, kind, lg: item.lg, by: "me", mine: 1, text: item.t, tr: {}, replies: [], fields: l ? l.fields : n ? n.fields : []};
    S.mine.unshift(mt);
    stamp(T("挂上网了", "ON THE NET"), nname(on));
    if (HV.items().length === 1) setTimeout(confetti, 300);
    if (!rep.none) setTimeout(() => { mt.replies.push({by: rep.by, rt: rep.away ? "away" : kind === "ask" ? "answer" : "reply", lg: item.lg, text: rep.t, tr: {[OL()]: rep.tr}}); redraw(); if (!S.nudgedOnce) { S.nudgedOnce = 1; setTimeout(() => nudge(rep.by), 5200); } }, 1000);
  }
  redraw();
}
function nudge(who){
  who = who || REPLIER[TL()];
  const t = NET.threads.find(x => x.by === who && x.open && !S.asked[x.id] && x.lg === OL()) || NET.threads.find(x => x.open && !S.asked[x.id] && x.lg === OL()); if (!t) return;
  S.nudged = t.id;
  toast(`${T(`${esc(pname(t.by))} 也在问问题——TA 在学${lgName(t.lg)}，正好是你说得好的语言。用${lgName(t.lg)}回 TA？`, `${esc(pname(t.by))} has a question too — they're learning ${lgName(t.lg)}, one of the languages you speak well. Answer in ${lgName(t.lg)}?`)} <button class="sbtn" style="margin-left:4px;padding:2px 9px;color:var(--ink)" data-answer="${t.id}">${T("去看看", "Take a look")}</button>`, face(t.by), 7000);
  if (!S.stack.length) drawHome();
}
function demoAsk(){
  if (!S.stack.length) go("tokyo");
  const on = S.stack[S.stack.length - 1];
  compose(on, "ask");
}

/* 自己往网上加：说一句 → 开一页 → 连一条线 */
function startPage(seed){
  const cur = S.stack[S.stack.length - 1];
  const at = cur && NODE(cur) ? placeOf(cur) : null;
  openSheet(`<div class="grab"></div><h3>🌱 ${T("开一页", "Start a page")}</h3>
    <div class="hintb">${T("说一句就行：它是什么、你为什么想到它。AI 帮你起个草稿，你确认了就挂上网，标着「还在核对」。", "One line is enough: what it is and why you thought of it. AI drafts the page; you confirm; it goes up marked 'being checked'.")}</div>
    <input class="tx" id="npName" placeholder="${T("名字，比如《间谍过家家》", "Name, e.g. Spy x Family")}" value="${esc(seed || "")}">
    <textarea class="say" id="npSay" style="margin-top:8px" placeholder="${T("说一句：比如「日本的动画，我在里约每周追」", "One line: e.g. 'Japanese anime I watch every week in Rio'")}"></textarea>
    <div style="font-size:12.5px;color:var(--soft);margin:6px 0">${T("它在哪儿？", "Where is it?")} <b style="color:var(--ink)">${at ? esc(ui(N(at).name)) : T("（之后再连）", "(link it later)")}</b></div>
    <button class="cta wide" data-mkpage="${at || ""}">${T("让 AI 起草这一页", "Let AI draft the page")}</button>`);
}
function mkPage(at){
  const name = ($("#npName").value || "").trim(), said = ($("#npSay").value || "").trim();
  if (!name) { $("#npName").focus(); $("#npName").style.borderColor = "var(--hot)"; return; }
  const id = "new_" + Date.now(), cur = S.stack[S.stack.length - 1];
  const fields = cur && NODE(cur) ? (NODE(cur).fields || []).slice(0, 1) : [];
  const nn = {type: "work", name: {zh: name, en: name}, at: at || undefined, newNode: 1, said: said || name, fields, text: said ? {zh: [said], en: [said]} : null};
  S.newNodes[id] = nn; NET.nodes[id] = nn; NAMEIDX = null; if (at) (HERE[at] = HERE[at] || []).push(id);
  closeSheet(); stamp(T("长出一页", "NEW PAGE"), name); setTimeout(confetti, 250);
  go(id); drawGaps();
}
function subBtns(ty){ const d = SUBS[ty] || {}; return Object.keys(d).length ? `<div style="font-size:12px;color:var(--soft);margin:2px 0 4px">${T("细一点（可以不选）：", "More precisely (optional):")}</div><div class="ideas" id="alSubs">${Object.entries(d).map(([k, v]) => `<button data-lsb="${k}">${esc(ui(v))}</button>`).join("")}</div>` : ""; }
function addLine(from, ty0){
  ty0 = ty0 || "learn";
  const isLike = ty0 === "like";
  openSheet(`<div class="grab"></div><h3>${isLike ? "❤️ " + T("我知道 TA 喜欢什么", "I know something they love") : "🔗 " + T("我知道一条线", "I know a line")}</h3>
    <div class="hintb">${T(`一条线 = <b>一句话</b>（从「${esc(nname(from))}」怎么到那儿、为什么值得过去）+ <b>出处</b>（一篇报道、官网、一本书、一次访谈）。两样都写了，核对过才挂上网。`, `A line = <b>one sentence</b> (how you get from "${esc(nname(from))}" to there, and why it's worth going) + <b>a source</b> (an article, official site, book, interview). Both are needed; it goes up once checked.`)}${isLike ? "<br>" + T("TA 喜欢的，要是 TA 自己说过的话，不要粉丝传言。", "It must be something they said themselves, not a fan rumour.") : ""}</div>
    <input class="tx" id="alTo" placeholder="${T("连到哪儿：输入一个地方、作品或东西", "To: type a place, a work or a thing")}" list="alList"><datalist id="alList">${Object.values(NET.nodes).filter(n => !n.role).slice(0, 400).map(n => `<option value="${esc(ui(n.name))}">`).join("")}</datalist>
    <div class="kinds" style="flex-wrap:wrap">${Object.entries(LT).map(([k, v]) => `<button data-lt="${k}" class="${k === ty0 ? "on" : ""}" style="flex:1 1 30%">${v[0]} ${ZH() ? v[1] : v[2]}</button>`).join("")}</div>
    <div id="alSubW">${subBtns(ty0)}</div>
    <textarea class="say" id="alSay" style="min-height:64px" placeholder="${isLike ? T("TA 的原话，或者 TA 说过什么", "Their own words, or what they said") : T("一句话：比如「宫崎骏年轻时看了这部法国动画，才知道动画能这样拍」", "One sentence, e.g. 'Young Miyazaki saw this French film and realised what animation could do'")}"></textarea>
    <input class="tx" id="alSrc" style="margin-top:8px" placeholder="${T("出处（必须写）", "Source (required)")}">
    <button class="cta wide" style="margin-top:10px" data-mkline="${from}">${T("送去核对", "Send for checking")}</button>`);
}
function mkLine(from){
  const toName = ($("#alTo").value || "").trim(), src = ($("#alSrc").value || "").trim(), say = ($("#alSay").value || "").trim();
  const ty = $(".kinds button.on[data-lt]") ? $(".kinds button.on[data-lt]").dataset.lt : "learn";
  const sb = $("#alSubs button.on") ? $("#alSubs button.on").dataset.lsb : null;
  const to = Object.keys(NET.nodes).find(k => ui(N(k).name) === toName || N(k).name.zh === toName || N(k).name.en === toName);
  if (!to) { $("#alTo").style.borderColor = "var(--hot)"; toast(T("网上还没有这一页，先去开个头。", "That page isn't on the net yet — start it first.")); return; }
  if (!say) { $("#alSay").style.borderColor = "var(--hot)"; $("#alSay").focus(); toast(T("还差一句话：为什么从这儿到那儿。", "One sentence still missing: why go from here to there.")); return; }
  if (!src) { $("#alSrc").style.borderColor = "var(--hot)"; $("#alSrc").focus(); toast(T("还差出处。", "The source is still missing.")); return; }
  const id = "pend_" + Date.now();
  const l = {id, from, to, type: ty, sub: sb || undefined, year: new Date().getFullYear(), fields: NODE(from).fields || [], src, pend: 1, text: {zh: [say], en: [say]}};
  if (ty === "like") { l.quote = {zh: say, en: say}; l.quote_src = src; }
  S.newLines.push(l); LBY[id] = l;
  closeSheet(); stamp(T("送去核对", "SENT FOR CHECK"), ""); drawPage(); drawGaps();
}

/* 点词 */
function wordPop(w){
  const lang = /[一-鿿]/.test(w) ? "zh" : "en";
  const d = (NET.words[lang] || {})[w];
  openSheet(`<div class="grab"></div><div class="wordpop"><b>${esc(w)}</b> ${d && d[0] ? `<span style="color:var(--soft)">${esc(d[0])}</span>` : ""}<div style="margin-top:6px;font-size:15px">${esc(d ? (lang === "zh" ? d[1] : d[2] || d[1]) : T("（这个词还没写解释）", "(no note for this word yet)"))}</div>
    <div class="row" style="display:flex;gap:6px;margin-top:10px"><button class="sbtn" data-say="${esc(w)}" data-lg="${lang}">🔊 ${T("听", "Listen")}</button></div></div>`);
}

/* ============ 点击 ============ */
PHONE.addEventListener("click", e => {
  const el = t => e.target.closest(t);
  let b;
  if (e.target.closest("a[href]")) return; // 出处链接：直接打开，不当成点了那一页
  if ((b = el("#more"))) { S.feedSeed++; $("#feed").innerHTML = feedBatch().map(doorHtml).join(""); blip(640, .05); noteAt(e, "↻"); return; }


  if ((b = el("[data-vs]"))) { noteAt(e, "⇄"); return openLine(b.dataset.vs, b.dataset.cur); }
  if ((b = el("[data-lty]"))) { S.lineType = b.dataset.lty; S.lineSub = "all"; blip(640, .04); const sc = $("#page").scrollTop; drawPage(); $("#page").scrollTop = sc; return; }
  if ((b = el("[data-lsub]"))) { S.lineSub = b.dataset.lsub; blip(700, .04); const sc = $("#page").scrollTop; drawPage(); $("#page").scrollTop = sc; return; }
  if ((b = el("[data-lsb]"))) { const was = b.classList.contains("on"); $$("[data-lsb]").forEach(x => x.classList.remove("on")); if (!was) b.classList.add("on"); blip(720, .04); return; }
  if ((b = el("[data-zoom]"))) { S.zoom = Math.max(.7, Math.min(2.4, S.zoom * (b.dataset.zoom === "1" ? 1.4 : 1 / 1.4))); const box = b.closest(".mapw").querySelector(".mapbox"); const mid = (box.scrollLeft + box.clientWidth / 2) / box.scrollWidth; if (S.stack.length && S.stack[S.stack.length - 1].startsWith("field:")) drawPage(); else drawHome(); const nb = $("#" + box.id); if (nb) requestAnimationFrame(() => nb.scrollLeft = mid * nb.scrollWidth - nb.clientWidth / 2); return; }
  const mb = el(".mapbox"); if (mb && mb._justDragged && Date.now() - mb._justDragged < 250) return;
  if ((b = el("[data-pin]"))) { noteAt(e, "📍"); return go(b.dataset.pin); }
  if ((b = el("[data-line]"))) { noteAt(e, "🔗"); return openLine(b.dataset.line, S.stack[S.stack.length - 1]); }
  if ((b = el("[data-answer]"))) { $("#toast").classList.remove("on"); const t = allThreads().find(x => x.id === b.dataset.answer); return compose(t.on, "answer", t.id); }
  if ((b = el("[data-compose]"))) return compose(b.dataset.compose, b.dataset.kind);
  if ((b = el("[data-what]"))) { const k = b.dataset.what; S.what[k] = !S.what[k]; blip(700, .05); noteAt(e, "❔"); rerender(); return; }
  if ((b = el("[data-wander]"))) { const c = Object.keys(NET.nodes).filter(k => !N(k).role && linesAt(k).length >= 3 && k !== S.stack[S.stack.length - 1]); noteAt(e, "🎲"); return go(c[Math.floor(Math.random() * c.length)]); }
  if ((b = el("[data-start]"))) return startPage(b.dataset.start || ($("#q") && $("#q").value) || "");
  if ((b = el("[data-mkpage]"))) return mkPage(b.dataset.mkpage);
  if ((b = el("[data-addline]"))) return addLine(b.dataset.addline, b.dataset.lt0);
  if ((b = el("[data-lt]"))) { $$("[data-lt]").forEach(x => x.classList.toggle("on", x === b)); $("#alSubW").innerHTML = subBtns(b.dataset.lt); blip(640, .04); return; }
  if ((b = el("[data-mkline]"))) return mkLine(b.dataset.mkline);
  if ((b = el("[data-open]"))) { const th = b.dataset.th; noteAt(e, "→"); go(b.dataset.open); if (th) flashThread(th); return; }
  if ((b = el("[data-field]"))) return go("field:" + b.dataset.field);
  if ((b = el("[data-go]"))) return go(b.dataset.go);
  if ((b = el("[data-jump]"))) return jumpTo(b.dataset.jump);
  if ((b = el("[data-back]"))) return back();
  if ((b = el("[data-home]"))) return home();
  if ((b = el("[data-ff]"))) { S.fField = b.dataset.ff; blip(600, .04); const sc = $("#home").scrollTop; drawHome(); $("#home").scrollTop = sc; return; }
  if ((b = el("[data-ft]"))) { S.fType = b.dataset.ft; blip(640, .04); const sc = $("#home").scrollTop; drawHome(); $("#home").scrollTop = sc; return; }
  if ((b = el("[data-lf]"))) { S.lineField = b.dataset.lf; blip(640, .04); const sc = $("#page").scrollTop; drawPage(); $("#page").scrollTop = sc; return; }
  if ((b = el("[data-route]"))) { S.routeOpen = S.routeOpen === b.dataset.route ? null : b.dataset.route; const sc = $("#page").scrollTop; drawPage(); $("#page").scrollTop = sc; return; }
  if ((b = el("[data-lv]"))) { S.lvl = +b.dataset.lv; blip(600 + S.lvl * 80, .05); rerender(); return; }
  if ((b = el("[data-tr]"))) { const k = b.dataset.tr; S.showTr[k] = !S.showTr[k]; b.closest(".read").classList.toggle("show", !!S.showTr[k]); return; }
  if ((b = el("[data-mtr]"))) { const k = b.dataset.mtr; S.showTr[k] = !S.showTr[k]; b.closest(".msg").classList.toggle("showtr", !!S.showTr[k]); return; }
  if ((b = el("[data-easy]"))) { const k = b.dataset.easy; S.easy[k] = !S.easy[k]; blip(660, .05); rerender(); return; }
  if ((b = el("[data-thx]"))) { const k = b.dataset.thx; if (S.thanked[k]) return; S.thanked[k] = 1; noteAt(e, "💛"); blip(880, .08); toast(T(`你谢了 ${esc(pname(b.dataset.who))}，TA 得到 1 🛟。`, `You thanked ${esc(pname(b.dataset.who))} — they get 1 🛟.`), face(b.dataset.who)); b.classList.add("on"); b.textContent = "💛 " + T("谢过了", "Thanked"); return; }
  if ((b = el("[data-say]"))) { noteAt(e, "♪"); return say(b.dataset.say, b.dataset.lg); }
  if ((b = el(".w[data-w]"))) return wordPop(b.dataset.w);
  if ((b = el("[data-ph]"))) { const [id, k] = b.dataset.ph.split(":"); S.phIdx[id] = +k; rerender(); return; }
  if ((b = el("[data-cast]"))) { S.castOpen[b.dataset.cast] = !S.castOpen[b.dataset.cast]; rerender(); return; }
  if ((b = el("[data-ca]"))) { S.castOpen[b.dataset.ca] = !S.castOpen[b.dataset.ca]; const [c, i] = b.dataset.ca.split(":"); const n = N(c), x = (n.chat[TL()] || Object.values(n.chat)[0]).filter(x => qOK(n, x))[+i]; if (S.castOpen[b.dataset.ca]) say(x.a, chatLang(n)); rerender(); return; }
  if ((b = el("[data-aiask]"))) { if (S.buoy < 1) return toast(T("🛟 用完了。帮别人回答一个问题就能拿到。", "Out of 🛟. Answer someone's question to earn one.")); openSheet(`<div class="grab"></div><h3>✨ ${T(`自己问 ${esc(pname(N(b.dataset.aiask).who))}`, `Ask ${esc(pname(N(b.dataset.aiask).who))} yourself`)}</h3><div class="hintb">${T("这是 AI 扮演的 🎭 角色，回答只给你自己看；觉得好，可以选择挂到公开聊。", "This is an AI 🎭 character; the answer is only for you. If it's good, you can post it publicly.")}</div><textarea class="say" placeholder="${TL() === "zh" ? "用中文问……" : "Ask in English…"}"></textarea><button class="cta wide" style="margin-top:8px" data-aigo="1">${T("问（1 🛟）", "Ask (1 🛟)")}</button>`); return; }

});
$("#scrim").addEventListener("click", closeSheet);
function rerender(){ const sc = $("#page").scrollTop, ss = $("#sheet").scrollTop, sheetOn = $("#sheet").classList.contains("on"), sl = S.sheetLine; if (S.stack.length) { drawPage(); $("#page").scrollTop = sc; } else drawHome(); if (sheetOn && sl) { openLine(sl.id, sl.cur); $("#sheet").scrollTop = ss; } }



/* ============ 缺口清单（后台） ============ */
function drawGaps(){
  if (!$("#gapT")) return;
  const deg = {}; NET.lines.forEach(l => { deg[l.from] = (deg[l.from] || 0) + 1; deg[l.to] = (deg[l.to] || 0) + 1; });
  const talk = {}; NET.threads.forEach(t => talk[t.on] = 1);
  const content = Object.keys(NET.nodes).filter(k => !N(k).role && !N(k).newNode);
  const byReach = (a, b) => (REACH[placeOf(b)] || 0) - (REACH[placeOf(a)] || 0);
  const noPh = content.filter(k => !(NET.photos[k] || []).length).sort(byReach);
  const one = content.filter(k => deg[k] === 1);
  const zero = content.filter(k => !deg[k] && N(k).type !== "place");
  const noTalk = content.filter(k => !talk[k]).sort(byReach);
  const walkedNoTalk = [...new Set(S.walked)].filter(k => N(k) && !talk[k] && !N(k).role);
  const nm = k => esc(ui(N(k).name));
  const row = (lab, why, arr, max) => `<tr><td><b>${lab}</b><br><small style="color:#9a8a6a">${why}</small></td><td>${arr.length}</td><td>${arr.slice(0, max || 14).map(x => typeof x === "string" && N(x) ? nm(x) : esc(x)).join("、")}${arr.length > (max || 14) ? "……" : ""}</td></tr>`;
  $("#gapT").innerHTML = `<tr><th>缺什么</th><th>几个</th><th>先补这些（按碰到的线多少排）</th></tr>`
    + row("搜不到的词", "这次试用里有人搜了、网上没有", S.misses, 20)
    + row("有人开了头的新页", "等核对", Object.values(S.newNodes).map(n => n.name.zh))
    + row("有人说知道的线", "等核对出处", S.newLines.map(l => lineTitle(l)))
    + row("有人停过、却没有公开聊", "你这次走过的", walkedNoTalk)
    + row("自己没有线的作品、事件、人", "只能靠所在的城市走出去", zero)
    + row("只有一条线的", "走进去很快就到头", one)
    + row("自动认的小标签", "从那一句故事里认的，等内容编辑写成正式的 sub", NET.lines.filter(l => l.subAuto).map(l => l.id + "（" + subName(l) + "）"))
    + row("还没有「❤️ TA 喜欢」的人", "要找本人的访谈、书、节目里说过的", Object.keys(NET.nodes).filter(k => N(k).type === "person" && !N(k).role && !NET.lines.some(l => l.type === "like" && l.from === k)))
    + row("缺照片的", "先画小地图或图标顶着", noPh)
    + row("没有公开聊的", "冷启动要几段种子对话", noTalk);
  const st = NET.stats;
  $("#statLine").innerHTML = `现在这张网：<b>${NET.order.length} 行 · ${st.nodes} 个点 · ${st.lines} 条线 · ${st.threads} 段公开聊</b>；跨两行以上的点 <b>${st.cross}</b> 个（纽约在六行里都有；东京、洛杉矶、伦敦、北京、上海各在五行里）。`;
}



function flashThread(th){ setTimeout(() => { const el = $("#th-" + CSS.escape(th)); if (!el) { const t = allThreads().find(x => x.id === th); if (t) openSheet(`<div class="grab"></div>${threadHtml(t, true)}`); return; } if (el) { $("#page").scrollTo({top: el.offsetTop - 70, behavior: "smooth"}); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 2200); } }, 420); }
/* ============ 软件里加的：首页（正在热闹的活动 · 别人正在说 · 整张网 · 16 行）、一行一页、进出软件 ============ */
const woven = r => (r.f || []).some(f => F(f));
function posterHtml(x, where){
  const {a, m} = x, r = ROW(CAT_ROW[a.cat] || "grow");
  const days = m.days === 1 ? T("一次", "One day") : m.days + T(" 天", " days");
  return `<div class="poster" data-act="${esc(a.id)}" style="background:linear-gradient(150deg,${r.c})">
    ${m.joined ? `<span class="stampd">${T("参加了", "JOINED")}</span>` : ""}
    <div class="pk">${r.i} ${esc(rowName(r))} · ${esc(days)}</div><h4>${esc(m.t)}</h4>${ZH() ? `<div class="pe">${esc(m.en)}</div>` : ""}
    <div class="hosts">${m.host.img ? `<img class="av s" src="${esc(m.host.img)}" alt="">` : ""}<span>${T("主持：", "Host: ")}${esc(m.host.nm)}${m.host.job ? " · " + esc(m.host.job) : ""} 🎭</span></div>
    <button class="big pale">${m.joined ? T("接着做今天这一步 →", "Do today's step →") : T("看看，也来说一句 →", "Take a look, say yours →")}</button>
    ${where === "strip" ? `<button class="mini rowl" data-go="row:${r.id}">${r.i} ${T("在这一行：", "In the row: ")}${esc(rowName(r))} →</button>` : ""}
  </div>`;
}
function snapPoster(where){
  if (!window.SNAP) return "";
  const r = ROW("artists");
  return `<div class="poster" data-snap="1" style="background:linear-gradient(150deg,#2a2a2a,#5b4a3a)"><div class="pk">${T("一周一道题", "one week, one photo prompt")}</div><h4>📸 ${T("世界街拍", "World Street Snap")}</h4>${ZH() ? `<div class="pe">World Street Snap</div>` : ""}
    <div class="hosts"><img class="av s" src="https://img.heyvoyo.com/npc/zhoulan/face.webp" alt=""><span>${T("主持：周岚 · 上海的肖像摄影师，不评判", "Host: Zhou Lan · portrait photographer, Shanghai — never judges")} 🎭</span></div>
    <button class="big pale">${T("看看这周的题 →", "See this week's prompt →")}</button>
    ${where === "strip" ? `<button class="mini rowl" data-go="row:${r.id}">${r.i} ${T("在这一行：", "In the row: ")}${esc(rowName(r))} →</button>` : ""}</div>`;
}
function actStrip(){
  const A = busyActs().slice(0, 8);
  if (!A.length && !window.SNAP) return "";
  return `<div class="sec">🎪 ${T("正在热闹的活动", "BUSY RIGHT NOW")}<span style="font-weight:600;letter-spacing:0;color:var(--soft)">${T("往右划 →", "swipe →")}</span></div>
    <div class="actstrip">${A.slice(0, 3).map(x => posterHtml(x, "strip")).join("")}${snapPoster("strip")}${A.slice(3).map(x => posterHtml(x, "strip")).join("")}</div>
    <p class="sub stripnote">${T("在这儿说的话，也会进你的抽屉。", "What you say here goes into your drawers too.")}</p>`;
}
function rowsHtml(){
  return `<div class="rows">${ROWS.map(r => `<button class="rw press ${woven(r) ? "" : "weave"}" data-go="row:${r.id}"><span class="ri">${r.i}</span><b>${esc(rowName(r))}</b><span class="rs">${esc(T(r.s[0], r.s[1]))}</span></button>`).join("")}</div>`;
}
function drawHome(){
  const h = $("#home"), n = HV.items(TL()).length;
  h.innerHTML = `
    <div class="hrow"><h1 class="pg ${ZH() ? "" : "en"}">${T("世界的网", "The world net")}</h1></div>
    <p class="sub">${T("每张贴纸是一个点，线告诉你它跟另一样东西是怎么连上的。点一个地方、一条线，或者别人的一句话。", "Each sticker is a point; a line tells you how it connects to something else. Tap a place, a line, or someone's words.")}</p>
    <button class="mylang press" data-mylang="1">🌱 ${T("我的语言", "My language")} <b>${n || ""}</b> →</button>
    ${actStrip()}
    <div class="srch" style="margin-top:14px"><span>🔍</span><input id="q" placeholder="${T("找一个地方、一部作品、一个人……", "Find a place, a work, a person…")}" autocomplete="off"></div>
    <div id="sres"></div>
    ${trailHtml()}
    <div class="sec">💬 ${T("别人正在说", "PEOPLE ARE SAYING")}<button class="r" id="more">${T("换几段", "Show others")} ↻</button></div>
    <div id="feed">${feedBatch().map(doorHtml).join("")}</div>
    <div class="sec">🌐 ${T("整张网", "THE WHOLE NET")}</div>
    <div class="chiprow" id="ffs">${["all", ...NET.order].map(f => `<button class="chip ${S.fField === f ? "on" : ""}" data-ff="${f}">${f === "all" ? T("都看", "All") : esc(fName(f))}</button>`).join("")}</div>
    <div class="chiprow" id="fts" style="margin-top:0">${["all", ...Object.keys(LT)].map(k => `<button class="chip ${S.fType === k ? "on" : ""}" data-ft="${k}">${k === "all" ? T("所有的线", "All lines") : `<i style="background:${LT[k][3]}"></i>${LT[k][0]} ${ZH() ? LT[k][1] : LT[k][2]}`}</button>`).join("")}</div>
    <div style="margin-top:6px">${mapHtml(S.fField, S.fType, "bigmap")}</div>
    <div class="maplinks"><button class="sbtn press" data-mapl="1">〰️ ${T("地图上的线：点一张贴纸，线就划出去", "Lines on the map: tap a sticker, its lines fan out")}</button><button class="sbtn press" data-stkmap="1">🗺️ ${T("整张贴纸地图", "The whole sticker map")}</button></div>
    <div class="sec" id="rowsH">🧵 ${T("网上的 16 行", "16 ROWS OF THE NET")}<span style="font-weight:600;letter-spacing:0;color:var(--soft)">${T("虚线 = 还在长", "dashed = still growing")}</span></div>
    ${rowsHtml()}
    <div class="maplinks" style="margin-top:12px"><button class="sbtn press" data-galall="1">🏝️ ${T("按岛看全部话题", "All topics, island by island")}</button></div>
    <p class="sub" style="margin-top:14px;text-align:center">${T("网还在长。找不到的，可以自己开个头。", "The net is still growing. Can't find something? Start it yourself.")}</p>`;
  const box = $("#bigmap"); dragMap(box); requestAnimationFrame(() => centerMap("bigmap", S.walked.length && llOf(S.walked[S.walked.length - 1]) || [30, 60]));
  $("#q").addEventListener("input", e => search(e.target.value));
  $("#q").addEventListener("keydown", e => { if (e.key === "Enter") search(e.target.value, true); });
}
/* 一行一页：织好的行 = 这一行的网（地方、人、聊）；每一行都挂着岛上原来的话题、地方和船票，还有这一行的活动 */
function isleTopics(r){ try { const P = HVI().plOf ? HVI().plOf(r.isle) : null; return (P && P.places) || []; } catch (e) { return []; } }
const tpName = p => ZH() ? (p.zh || p.en || p.k) : (p.en || p.zh || p.k);
function drawRow(rid){
  const r = ROW(rid); if (!r) return home();
  const fs = (r.f || []).filter(F), A = busyActs().filter(x => (CAT_ROW[x.a.cat] || "grow") === r.id);
  let html = barHtml() + `<div class="pin">`;
  html += `<div class="fpost" style="background:linear-gradient(150deg,${r.c});min-height:120px;display:block"><span class="ic" style="font-size:44px">${r.i}</span><b style="font-size:24px">${esc(rowName(r))}</b><small style="font-size:13px">${esc(T(r.s[0], r.s[1]))}</small></div>`;
  if (!fs.length) html += `<div class="weavenote">🧵 ${T("这一行的点和线还在长。先从下面这些话题、地方和船票开始吧。", "This row is still growing. Start with the topics, places and ship tickets below.")}</div>`;
  if (fs.length) {
    html += `<div class="sec">🌐 ${T("这一行在网上", "THIS ROW ON THE NET")}</div><div class="fposts">${fs.map(f => `<button class="fpost press" data-field="${f}" style="background:${F(f).color}"><span class="ic">${F(f).icon}</span><b>${esc(ui(F(f).name))}</b><small>${esc(ui(F(f).one))}</small></button>`).join("")}</div>`;
    const ids = Object.keys(NET.nodes).filter(k => (N(k).fields || []).some(f => fs.includes(f)));
    const places = ids.filter(k => N(k).type === "place").sort((a, b) => (REACH[b] || 0) - (REACH[a] || 0));
    html += `<div class="sec">📍 ${T("挑一个地方进去", "PICK A PLACE")}</div><div class="chiprow" style="margin-top:0;flex-wrap:wrap;overflow:visible">${places.slice(0, 14).map(p => `<button class="chip" data-open="${p}">${esc(ui(N(p).name).replace(/（.*$/, ""))}</button>`).join("")}</div>`;
    const ls = NET.lines.filter(l => (l.fields || []).some(f => fs.includes(f))).slice(0, 4);
    if (ls.length) html += `<div class="sec">🔗 ${T("这一行的线", "LINES IN THIS ROW")}</div>` + ls.map(l => lineCard(l, l.from)).join("");
  }
  if (A.length || r.id === "artists") html += `<div class="sec">🎪 ${T("这一行的活动", "ACTIVITIES IN THIS ROW")}</div><div class="rowacts">${A.map(x => posterHtml(x, "row")).join("")}${r.id === "artists" ? snapPoster("row") : ""}</div>`;
  const tps = isleTopics(r);
  if (tps.length) {
    html += `<div class="sec">💬 ${T("这一行的话题", "TOPICS IN THIS ROW")}</div><div class="tps">`;
    html += tps.map(p => { let tk = null; try { tk = HVI().ticket ? HVI().ticket(r.isle, p.k) : null; } catch (e) {}
      return `<div class="tp"><button class="tpm press" data-topic="${esc(r.isle + "|" + p.k)}"><span class="e">${esc(p.e || "💬")}</span><span><b>${esc(tpName(p))}</b>${tk && tk.city ? `<small>🛳️ ${T("能开船去", "Sail to")} ${esc(tk.city)}</small>` : ""}</span><em>›</em></button>${tk ? `<button class="tps-sail press" data-sail="${esc(r.isle + "|" + p.k)}" title="${T("开船去说一句", "Sail there and say a line")}">🛳️</button>` : ""}</div>`; }).join("");
    html += `</div>`;
  }
  html += `<div class="maplinks"><button class="sbtn press" data-isle="${r.isle}">🏝️ ${T("进岛：岛上的地图、群聊和词", "Visit the island: its map, group chat and words")}</button></div>`;
  html += `</div>`;
  $("#page").innerHTML = html;
}
/* 软件里的点击：活动、岛、话题、船票、我的语言、贴纸地图（先于样板里那一套接住） */
PHONE.addEventListener("click", e => {
  const el = t => e.target.closest(t); let b;
  const stop = () => { e.stopPropagation(); e.preventDefault(); };
  if ((b = el("[data-act]"))) { if (el(".rowl")) return; stop(); blip(640, .05); try { window.ACT.open(b.dataset.act); } catch (er) {} return; }
  if ((b = el("[data-snap]"))) { if (el(".rowl")) return; stop(); try { window.SNAP.open(); } catch (er) {} return; }
  if ((b = el("[data-mylang]"))) { stop(); HV.goMe({}); return; }
  if ((b = el("[data-tomedr]"))) { stop(); HV.goMe({dr: b.dataset.tomedr}); return; }
  if ((b = el("[data-mapl]"))) { stop(); window.MAPL && window.MAPL.open({}); return; }
  if ((b = el("[data-stkmap]"))) { stop(); window.hvPage && window.hvPage.stickers(); return; }
  if ((b = el("[data-galall]"))) { stop(); window.hvPage && window.hvPage.isles(); return; }
  if ((b = el("[data-isle]"))) { stop(); window.hvPage && window.hvPage.isle(b.dataset.isle); return; }
  if ((b = el("[data-topic]"))) { stop(); const [i, k] = b.dataset.topic.split("|"); window.hvPage && window.hvPage.isle(i, k); return; }
  if ((b = el("[data-sail]"))) { stop(); const [i, k] = b.dataset.sail.split("|"); window.hvPage && window.hvPage.sail(i, k); return; }
}, true);
/* 进来：o = {open: 点 / row:行 / field:行, line, th, qa, act, rows} */
function enter(o){
  o = o || {};
  if (o.line && LBY[o.line]) { const l = LBY[o.line]; go(l.from); setTimeout(() => openLine(o.line, l.from), 400); return; }
  if (o.open) {
    if (o.qa && N(o.open) && N(o.open).role) { const i = String(o.qa).split(":")[1]; S.castOpen[o.open] = 1; S.castOpen[o.open + ":" + i] = 1; }
    if (S.stack[S.stack.length - 1] !== o.open) go(o.open);
    if (o.th) flashThread(o.th);
    if (o.act) setTimeout(() => { const p = $(`#page [data-act="${CSS.escape(o.act)}"]`); if (p) { p.scrollIntoView({behavior: "smooth", block: "center"}); p.classList.add("flash"); } }, 420);
    return;
  }
  if (o.keep && S.stack.length) return;
  home();
  if (o.acts) setTimeout(() => { const t = $(".actstrip"); if (t) $("#home").scrollTo({top: Math.max(0, t.offsetTop - 60), behavior: "smooth"}); }, 120);
  if (o.rows) setTimeout(() => { const t = $("#rowsH"); if (t) $("#home").scrollTo({top: t.offsetTop - 10, behavior: "smooth"}); }, 120);
}
function route(){ const id = S.stack[S.stack.length - 1]; return id ? "map/net/" + encodeURIComponent(id) : "map"; }
const nm0 = nname;
nname = id => { if (String(id).startsWith("row:")) { const r = ROW(id.slice(4)); return r ? rowName(r) : id; } return nm0(id); };
const ic0 = iconOf;
iconOf = id => String(id).startsWith("row:") ? ((ROW(id.slice(4)) || {}).i || "🧵") : ic0(id);
drawHome(); drawBuoy();
return {enter, route, back: () => { if (!S.stack.length) return false; back(); return true; }, rerender: () => { S.mine = mineFromStore(); rerender(); }};


}
})();

/* my_lang.js */
// 🙂 我 = 《你的语言》（2026-11-13 用户「可以，放进软件」；样板 样板/你的语言样板.html）
// 你说过的话自动整理进 6 个柜子、40 个抽屉，每一句带着来源（点一下回到世界的网 / 地图上的线那一页）；外面是借来的说法；
// 词卡三张网：🗂️ 意思 · 🌱 字形（部首、声旁、词根）· 🔊 声音（拼音、音、只差一点的一对）；「你的话里的字形」「你的话里的音」；跟着说用真话筒，不打分。
// 数据 window.WORLD_NET（drawer_words、roots、sound，gen_world_net.py → d89_world_net.js）+ hv.mylang.v1（hv_mylang.js，登录后同步）。
// 演示的人（Lucas / 苏苏）照样板收成一行「演示」，跟你的话分开。最下面接原来「我」里的东西：再说一遍、你走过的路、设置。
// 对外 window.MYLANG = {open(o), hide(), isOpen()}；o = {dr: "d22" 打开那个抽屉, fresh: 刚说的那一句}
(function(){
"use strict";
const ZH = () => (document.documentElement.lang || "zh").slice(0, 2) === "zh";
const LEARN = () => (window.HVI && window.HVI.LEARN) || window.HV_LEARN || "en";
const UT = (zh, en) => window.HVML ? window.HVML.tr(zh, en, ZH() ? "zh" : "en") : (ZH() ? zh : en);
const ML_CSS = "\n:host{--ink:#14305c;--ivory:#fbf7ee;--hot:#e2552f;--ok:#2f7d70;--soft:#6b7488;--desk:#ece4d3;--line:#e6dfcf;--paper:#fffdf7}\n*{box-sizing:border-box}\n.phone{margin:0;color:#24303a;font:15px/1.55 -apple-system,\"PingFang SC\",\"Helvetica Neue\",sans-serif}\nbutton{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}\n.wrap{max-width:1140px;margin:0 auto;padding:18px 16px 80px;display:grid;grid-template-columns:390px 1fr;gap:28px;align-items:start}\n@media(max-width:880px){.wrap{grid-template-columns:1fr}}\n.note0{grid-column:1/-1;background:#fff8e6;border:1px dashed #d9b86a;border-radius:14px;padding:11px 14px;font-size:14px;color:#6b5a2e;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between}\n.note0 b{color:#4b3d17}\n.sw{display:inline-flex;background:#fff;border-radius:99px;padding:3px;border:1.5px solid var(--line)}\n.sw button{border:0;background:none;border-radius:99px;padding:5px 12px;font-weight:800;color:var(--soft);font-size:13px}\n.sw button.on{background:var(--ink);color:#fff}\n\n/* 手机 */\n.phone{background:var(--ivory);border-radius:30px;box-shadow:0 12px 34px rgba(20,48,92,.2);height:820px;position:relative;overflow:hidden;display:flex;flex-direction:column;width:100%;max-width:390px;justify-self:center}\n@media(max-width:480px){.phone{height:86vh;min-height:640px;border-radius:24px}}\n.bar{display:flex;align-items:center;gap:8px;padding:12px 16px 10px;border-bottom:1px solid var(--line);font-size:13px;color:var(--soft);background:var(--ivory);z-index:2}\n.bar b{color:var(--ink)}.bar .demo{margin-left:auto;font-size:11px;background:#f1ece0;border-radius:99px;padding:2px 8px;color:#8a7a50;font-weight:700}\n.scr{flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 14px 40px;scroll-behavior:smooth}\n.hd h1{font:700 26px/1.15 Georgia,\"Noto Serif SC\",serif;color:var(--ink);margin:2px 0 4px}\n:host(.zhui) .hd h1{font-family:\"Noto Serif SC\",Georgia,serif;font-weight:900}\n.hd p{margin:0;color:var(--soft);font-size:13.5px}\n.hd .me{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12.5px;color:var(--soft)}\n.hd .me i{font-style:normal;background:#fff;border:1px solid var(--line);border-radius:99px;padding:2px 9px}\n\n/* 网 */\n.netcard{margin:12px -4px 0;background:var(--paper);border-radius:20px;box-shadow:0 2px 12px rgba(20,48,92,.07);position:relative;overflow:hidden;\n background-image:radial-gradient(circle at 50% 50%,rgba(226,85,47,.06),transparent 42%),repeating-linear-gradient(0deg,transparent 0 23px,rgba(20,48,92,.035) 23px 24px)}\n.net{display:block;width:100%;height:auto;touch-action:manipulation}\n.net .e{transition:opacity .3s}\n.net .n{cursor:pointer;transition:opacity .3s}\n.net .n:hover .tg{stroke-width:2}\n.net.focus .n:not(.hl){opacity:.14}.net.focus .e:not(.hl){opacity:.05}\n.net.focus .e.hl{opacity:1!important;stroke-width:2.2}\n.net .tg{fill:#fff;stroke-width:1.3}\n.net .unused .tg{fill:#fbf7ee;stroke-dasharray:3 2.5}\n.net .unused text{fill:#8a93a6}\n.net text{font:600 11px -apple-system,\"PingFang SC\",sans-serif;fill:var(--ink);pointer-events:none}\n.net .own circle{fill:var(--hot);filter:drop-shadow(0 2px 3px rgba(226,85,47,.35))}\n.net .own text{font-size:11.5px;fill:#fff}\n.net .own.fresh circle{animation:fresh 1.2s ease 2}\n@keyframes fresh{50%{r:17}}\n.net .me text{font:italic 700 13px Georgia,serif;fill:var(--hot)}\n.net .pop{animation:netpop .7s cubic-bezier(.3,1.6,.5,1)}\n@keyframes netpop{0%{opacity:0;transform:scale(.2)}100%{opacity:1;transform:scale(1)}}\n.legend{display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:var(--soft);padding:0 12px 10px}\n.legend span{display:inline-flex;align-items:center;gap:4px}\n.legend .d{width:10px;height:10px;border-radius:50%;background:var(--hot)}\n.legend .t{width:16px;height:10px;border-radius:5px;border:1.3px solid var(--ink);background:#fff}\n.legend .t.u{border-style:dashed;border-color:#9aa3b5}\n.legend .f{width:11px;height:11px;border-radius:50%;background:#c9d3e6;border:1.5px solid #fff;box-shadow:0 0 0 1px #c9d3e6}\n.nethint{position:absolute;top:10px;right:12px;font-size:11px;color:var(--soft);background:rgba(255,255,255,.8);border-radius:99px;padding:2px 8px}\n\n/* 区块 */\n.sec{margin-top:18px}\n.sec h3{font:700 18px/1.3 Georgia,\"Noto Serif SC\",serif;color:var(--ink);margin:0 0 3px}\n:host(.zhui) .sec h3{font-family:\"Noto Serif SC\",Georgia,serif}\n.sec .sub{margin:0 0 10px;color:var(--soft);font-size:13px}\n.voice{background:#fff;border-radius:18px;padding:14px;box-shadow:0 2px 10px rgba(20,48,92,.06)}\n.voice .like{font:600 15.5px/1.55 Georgia,\"Noto Serif SC\",serif;color:var(--ink)}\n.voice .like b{color:var(--hot)}\n.blobs{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:12px 0 6px}\n.blob{border:0;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;position:relative;transition:transform .2s;padding:0}\n.blob:active{transform:scale(.92)}\n.blob .bi{font-size:20px;line-height:1}\n.blob.faint{opacity:.35}\n.blobl{font-size:11.5px;color:var(--ink);text-align:center;font-weight:700;margin-top:4px;max-width:96px;line-height:1.25}\n.blobw{display:flex;flex-direction:column;align-items:center}\n.voice .mine{font-size:13px;color:#5b6474;background:#f7f2e7;border-radius:12px;padding:9px 11px;margin-top:8px}\n.go{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}\n.go button{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font-size:12.5px;font-weight:700;color:var(--ink)}\n\n.shelf{display:flex;flex-direction:column;gap:8px}\n.lay{display:flex;align-items:center;gap:10px;background:#fbf7ee;border:1.5px dashed #d6ccb6;border-radius:14px;padding:9px 10px;transition:.3s}\n.lay img{width:30px;height:30px;border-radius:50%;object-fit:cover;flex:none}\n.lay .lt{flex:1;min-width:0}\n.lay .lt b{font:700 16px \"Noto Serif SC\",Georgia,serif;color:#58627a;cursor:pointer}\n.lay .lt small{display:block;color:var(--soft);font-size:11.5px}\n.lay .use{border:0;background:var(--hot);color:#fff;border-radius:99px;padding:6px 10px;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 3px 8px rgba(226,85,47,.25)}\n.lay.gone{opacity:0;transform:translateX(40px);height:0;padding:0;margin:-4px 0;border:0;overflow:hidden}\n.empty{color:var(--soft);font-size:13px;background:#fff;border-radius:12px;padding:10px 12px}\n\n.said{display:flex;flex-direction:column;gap:9px}\n.s1{background:#fff;border-radius:16px;padding:11px 12px;box-shadow:0 2px 8px rgba(20,48,92,.06);position:relative}\n.s1.newin{animation:slidein .6s ease}\n@keyframes slidein{from{opacity:0;transform:translateY(-12px) scale(.97)}}\n.s1 .k{font-size:11.5px;color:var(--soft);font-weight:700}\n.s1 .tx{font:600 16.5px/1.6 \"Noto Serif SC\",Georgia,serif;color:var(--ink);margin:3px 0 2px}\n.s1 .tr{font-size:12.5px;color:var(--soft)}\n.s1 .row{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap}\n.mini{width:20px;height:20px;border-radius:50%;object-fit:cover;border:1.5px solid #fff;box-shadow:0 0 0 1px var(--line)}\n.play{border:0;background:#fff4ee;color:var(--hot);border-radius:99px;padding:4px 10px;font-size:12px;font-weight:800}\n.play.on{background:var(--hot);color:#fff}\n.pend{font-size:11px;background:#eef6ef;color:#2f6d4a;border-radius:99px;padding:1px 8px;font-weight:700}\nu.ph{text-decoration:none;background:linear-gradient(transparent 62%,rgba(226,85,47,.25) 62%);cursor:pointer;border-radius:2px}\nu.ph:hover{background:linear-gradient(transparent 50%,rgba(226,85,47,.4) 50%)}\n\n.start{background:var(--ink);color:#fff;border-radius:18px;padding:15px;position:relative;overflow:hidden}\n.start h3{color:#fff!important}\n.start p{margin:4px 0 10px;font-size:13.5px;opacity:.88}\n.start .btn{background:#fff;color:var(--ink);box-shadow:none}\n.start::after{content:\"\";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(rgba(255,200,97,.45),transparent 70%)}\n\n.btn{border:0;border-radius:99px;padding:11px 18px;font-weight:800;background:var(--hot);color:#fff;width:100%;margin-top:8px;box-shadow:0 4px 12px rgba(226,85,47,.3);transition:transform .12s}\n.btn:active,.chip:active,.opt:active,.use:active,.play:active{transform:scale(.95)}\n.btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);box-shadow:none}\n.btn[disabled]{opacity:.4}\n\n/* 底下拉起的纸 */\n.veil{position:absolute;inset:0;background:rgba(20,48,92,.28);opacity:0;pointer-events:none;transition:.25s;z-index:20}\n.veil.on{opacity:1;pointer-events:auto}\n.sheet{position:absolute;left:0;right:0;bottom:0;max-height:88%;background:var(--ivory);border-radius:22px 22px 0 0;box-shadow:0 -8px 30px rgba(20,48,92,.2);transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.3,1);z-index:21;display:flex;flex-direction:column}\n.sheet{visibility:hidden;transition:transform .32s cubic-bezier(.2,.9,.3,1),visibility 0s .32s}\n.sheet.on{transform:none;visibility:visible;transition:transform .32s cubic-bezier(.2,.9,.3,1)}\n.sheet .grab{width:40px;height:4px;border-radius:9px;background:#d6ccb6;margin:8px auto 2px;flex:none}\n.sheet .x{position:absolute;right:12px;top:8px;border:0;background:#fff;border-radius:50%;width:30px;height:30px;color:var(--soft);font-size:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)}\n.sheet .in{overflow-y:auto;padding:6px 16px 22px}\n.big{font:900 30px/1.25 \"Noto Serif SC\",Georgia,serif;color:var(--ink);margin:6px 0 0}\n.en-t .big{font-family:Georgia,\"Noto Serif SC\",serif;font-weight:700;font-size:27px}\n.py{color:var(--hot);font-weight:700;font-size:14px}\n.mean{color:#4b5563;font-size:14px;margin-top:2px}\n.card{background:#fff;border-radius:16px;padding:12px;box-shadow:0 2px 8px rgba(20,48,92,.06);margin-top:10px}\n.card .lab{font-size:11.5px;font-weight:800;color:var(--soft);letter-spacing:.02em;margin-bottom:6px}\n.who{display:flex;gap:9px;align-items:center}\n.who img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.12)}\n.who b{color:var(--ink)}.who small{display:block;color:var(--soft);font-size:12px;line-height:1.35}\n.quote{font:600 15.5px/1.65 \"Noto Serif SC\",Georgia,serif;color:var(--ink);margin:8px 0 2px;padding-left:10px;border-left:3px solid #c9d3e6}\n.quote.mine{border-left-color:var(--hot)}\n.qtr{font-size:12.5px;color:var(--soft)}\n.where{font-size:12px;color:var(--soft);margin-top:6px}\n.chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}\n.chip{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font-weight:700;color:var(--ink);font-size:13.5px;transition:.15s}\n.chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}\n.chip small{font-weight:500;opacity:.7;margin-left:4px;font-size:11px}\n.letgo{border:0;background:none;color:var(--soft);font-size:12.5px;text-decoration:underline;margin-top:10px;padding:4px 0}\n\n.ask{display:flex;gap:9px;align-items:flex-start;margin:6px 0 4px}\n.ask .bub{background:#fff;border-radius:4px 16px 16px 16px;padding:9px 12px;box-shadow:0 2px 8px rgba(20,48,92,.07);font:600 15px/1.55 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.ask .bub small{display:block;font:400 12px/1.4 -apple-system,sans-serif;color:var(--soft);margin-top:2px}\n.lv{display:flex;gap:6px;margin:12px 0 4px}\n.lv button{flex:1;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:7px 4px;font-size:12.5px;font-weight:800;color:var(--soft);line-height:1.2}\n.lv button small{display:block;font-weight:500;font-size:10.5px;margin-top:2px}\n.lv button.on{border-color:var(--hot);color:var(--hot);background:#fff4ee}\n.lvnote{font-size:12px;color:var(--soft);margin:2px 0 8px}\n.opt{display:block;width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:14px;padding:9px 12px;margin-top:7px;transition:.15s}\n.opt b{display:block;font:600 15.5px/1.5 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.opt small{color:var(--soft);font-size:12px}\n.opt.on{border-color:var(--hot);background:#fff4ee}\n.frame{font:700 19px/1.8 \"Noto Serif SC\",Georgia,serif;color:var(--ink);text-align:center;background:#fff;border-radius:16px;padding:14px 10px;box-shadow:0 2px 8px rgba(20,48,92,.06);margin-top:6px}\n.slot{display:inline-block;min-width:54px;border-bottom:3px solid var(--hot);color:var(--hot);padding:0 3px}\n.slot.got{animation:netpop .4s}\n.own-in{width:100%;border:1.5px dashed #d6ccb6;border-radius:12px;padding:8px 10px;font:inherit;font-size:14px;background:#fff;margin-top:4px}\ntextarea.own-in{min-height:64px;resize:vertical;font:600 15px/1.5 Georgia,\"Noto Serif SC\",serif;color:var(--ink)}\n.mic{width:64px;height:64px;border-radius:50%;border:0;background:var(--hot);color:#fff;font-size:26px;display:block;margin:12px auto 4px;box-shadow:0 6px 16px rgba(226,85,47,.35);transition:transform .15s}\n.mic.rec{animation:pulse 1s infinite}\n@keyframes pulse{50%{box-shadow:0 0 0 14px rgba(226,85,47,.12)}}\n.micl{text-align:center;font-size:12.5px;color:var(--soft)}\n.bars{display:flex;gap:3px;justify-content:center;height:22px;align-items:center;margin:4px 0}\n.bars i{width:4px;border-radius:3px;background:var(--hot);height:4px}\n.bars.on i{animation:bar .5s ease-in-out infinite alternate}\n.bars i:nth-child(2){animation-delay:.1s}.bars i:nth-child(3){animation-delay:.2s}.bars i:nth-child(4){animation-delay:.05s}.bars i:nth-child(5){animation-delay:.15s}\n@keyframes bar{to{height:20px}}\n.two{display:flex;gap:8px}.two .btn{margin-top:6px;font-size:13.5px;padding:10px 8px}\n.grow{font:700 21px/1.75 \"Noto Serif SC\",Georgia,serif;color:var(--ink);background:#fff;border-radius:16px;padding:14px 12px;box-shadow:0 2px 8px rgba(20,48,92,.06);margin-top:8px;min-height:60px}\n.en-t .grow{font-family:Georgia,\"Noto Serif SC\",serif}\n.grow span{opacity:0;display:inline;transition:opacity .35s}\n.grow span.gin{opacity:1}\n.grow u.ph{position:relative}\n.src{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\n.src span{display:inline-flex;align-items:center;gap:5px;background:#fff;border-radius:99px;padding:3px 9px 3px 3px;font-size:12px;color:var(--ink);box-shadow:0 1px 4px rgba(20,48,92,.08);opacity:0;transform:translateY(6px);transition:.4s}\n.src span.gin{opacity:1;transform:none}\n.src img{width:20px;height:20px;border-radius:50%;object-fit:cover}\n.native{font:600 15px/1.55 Georgia,\"Noto Serif SC\",serif;color:#4b5563;background:#f7f2e7;border-radius:12px;padding:9px 11px;margin-top:6px}\n.steps{display:flex;gap:4px;margin:4px 0 8px}.steps i{flex:1;height:4px;border-radius:9px;background:#e6dfcf}.steps i.on{background:var(--hot)}\n.q1 .opt{display:flex;align-items:center;gap:10px}\n.q1 .opt .em{font-size:24px}\n.aihelp{font-size:11.5px;color:#8a7a50;background:#fff8e6;border-radius:10px;padding:6px 9px;margin-top:8px}\n\n/* 抽屉 */\n.cab{background:#f3e9d4;border:1.5px solid #e0d2b2;border-radius:16px;padding:10px 10px 8px;margin-top:10px;box-shadow:inset 0 -3px 0 #e0d2b2}\n.cabh{font:700 15.5px Georgia,\"Noto Serif SC\",serif;color:var(--ink);display:flex;gap:7px;align-items:center}\n:host(.zhui) .cabh{font-family:\"Noto Serif SC\",Georgia,serif}\n.dws{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}\n.dw{position:relative;background:#fffdf7;border:1.5px solid #d8c9a6;border-radius:10px;padding:8px 22px 8px 9px;text-align:left;min-height:50px;box-shadow:0 2px 0 #d8c9a6;transition:transform .12s;display:flex;flex-direction:column;justify-content:center;gap:3px}\n.dw:active{transform:translateY(2px);box-shadow:none}\n.dw b{font-size:12.5px;line-height:1.3;color:var(--ink)}\n.dw small{font-size:10.5px;color:#9a8a62;font-weight:600}\n.dw .kn{position:absolute;right:8px;top:50%;width:6px;height:16px;margin-top:-8px;border-radius:4px;background:#cbb98d}\n.dw.full .kn{background:var(--hot)}\n.dw .sl{display:flex;gap:3px}.dw .sl i{width:14px;height:4px;border-radius:2px;background:rgba(226,85,47,.55)}\n.dw.empty{border-style:dashed;background:#fbf7ee;box-shadow:none}\n.dw.empty b{color:#58627a}\n.dw.custom{background:#fff8e6}\n.dw.grow{animation:dgrow 1.4s cubic-bezier(.3,1.5,.5,1)}\n@keyframes dgrow{0%{transform:scale(.2);opacity:0;box-shadow:0 0 0 0 rgba(226,85,47,.6)}60%{transform:scale(1.06);opacity:1;box-shadow:0 0 0 10px rgba(226,85,47,.15)}100%{transform:none;box-shadow:0 2px 0 #d8c9a6}}\n.more{border:0;background:none;color:#8a7a50;font-size:11.5px;padding:7px 2px 2px;text-align:left;cursor:pointer}\n.ghosts{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}\n.ghost{border:1px dashed #d6ccb6;background:transparent;color:#a39a86;border-radius:8px;padding:3px 7px;font-size:11px}\n.growdemo{background:#fff8e6;border:1.5px dashed #d9b86a;border-radius:14px;padding:10px 12px;font-size:13px;color:#6b5a2e}\n.growdemo b{display:block;color:#4b3d17;font-size:12px}\n.newdr{margin-top:12px}\n.dtabs{display:none}\n.dtabs::-webkit-scrollbar{display:none}\n.dtab{flex:none;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:6px 10px;font-size:12.5px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:5px;transition:.15s}\n.dtab.empty{border-style:dashed;color:var(--soft);background:#fbf7ee}\n.dtab.on{background:var(--ink);color:#fff;border-color:var(--ink);border-style:solid}\n.dtab:active{transform:scale(.94)}\n.drw{background:#fff;border-radius:18px;padding:12px;box-shadow:0 2px 10px rgba(20,48,92,.06);animation:in .3s}\n@keyframes in{from{opacity:0;transform:translateY(6px)}}\n.drh{font:700 17px Georgia,\"Noto Serif SC\",serif;color:var(--ink);display:flex;gap:7px;align-items:center}\n.lab2{font-size:11px;font-weight:800;color:var(--soft);letter-spacing:.04em;margin:12px 0 5px;text-transform:uppercase}\n.dmine{display:flex;flex-direction:column;gap:7px}\n.dm{background:#fff4ee;border-left:3px solid var(--hot);border-radius:10px;padding:8px 10px;cursor:pointer}\n.dm.newin{animation:slidein .6s ease}\n.dm .play{margin-top:5px}\n.dt{font:600 16px/1.55 \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n:host(.zhui) .dt{font-family:Georgia,\"Noto Serif SC\",serif}\n.dinv{font:italic 600 14.5px/1.5 Georgia,\"Noto Serif SC\",serif;color:#8a7a50;background:#fbf7ee;border:1.5px dashed #d6ccb6;border-radius:12px;padding:10px 12px}\n.do{display:flex;gap:9px;padding:9px 0;border-top:1px solid #f1ece0}\n.do img{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:none}\n.dob{flex:1;min-width:0}\n.don{font-size:12px;color:var(--soft)}.don b{color:var(--ink)}\n.dkeep{border:1.5px solid var(--hot);background:#fff;color:var(--hot);border-radius:99px;padding:3px 10px;font-size:12px;font-weight:800}\n.dkeep.on{background:var(--hot);color:#fff}\n.dworld{margin-top:10px;background:#eef3fa;border-radius:12px;padding:9px 11px;font-size:13px;color:#33476b;line-height:1.5}\n.dworld b{color:var(--ink)}\n\n/* 你自己说的 / 演示 / 来源 */\n.net .own.demo circle{fill:#e9b4a3;filter:none}\n.net .own.you circle{fill:var(--hot);stroke:#fff;stroke-width:2.5}\n.net .pin rect{fill:#fff;stroke:#14305c;stroke-width:1;stroke-dasharray:2 2}\n.net .pin text{font-size:10px;fill:#14305c}\n.legend .d.demo{background:#e9b4a3}\n.s1.you{border:2px solid var(--hot)}\n.s1.demo{opacity:.85;background:#fbf7ee;box-shadow:none;border:1.5px dashed #e0d2b2}\n.srcl{color:var(--ink);font-weight:800;text-decoration:none;border-bottom:1.5px solid rgba(20,48,92,.35)}\n.srcl:hover{background:#eef2f8}\n.srcn{color:#8a7a50;font-weight:700}\n.dtag{font-size:10.5px;font-weight:800;background:#f1ece0;color:#8a7a50;border-radius:99px;padding:1px 7px;margin-left:4px}\n.drl{font-size:12px;color:#6b5a2e;background:#fff6e2;border-radius:10px;padding:3px 8px;display:inline-block;margin-top:6px}\n.drl button{border:0;background:none;color:var(--hot);font-weight:800;text-decoration:underline;font-size:12px;padding:0;margin-left:4px}\n.heardf{font-size:12px;color:#2f6d4a;background:#eef6ef;border-radius:10px;padding:3px 8px;display:inline-block;margin:6px 6px 0 0}\n.myempty{background:#fff;border:1.5px dashed #d6ccb6;border-radius:16px;padding:12px;font-size:13.5px;color:#4b5563}\n.myempty .go a{display:inline-block;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 11px;font-size:12.5px;font-weight:700;color:var(--ink);text-decoration:none;margin:6px 6px 0 0}\n.lead2{font:700 15px/1.5 Georgia,\"Noto Serif SC\",serif;color:var(--hot);margin:2px 0 4px}\n:host(.zhui) .lead2{font-family:\"Noto Serif SC\",Georgia,serif}\n.cabh.tg{width:100%;border:0;background:none;padding:0;text-align:left;cursor:pointer}\n.cabh .dots{margin-left:auto;display:flex;gap:3px;align-items:center}\n.cabh .dots i{width:7px;height:7px;border-radius:50%;background:var(--hot)}\n.cabh .dots i.demo{background:#e9b4a3}\n.cabh .car{font-size:12px;color:#8a7a50;margin-left:6px;transition:transform .2s}\n.cab.shut .dws,.cab.shut .more{display:none}\n.cab.shut .car{transform:rotate(-90deg)}\n.more{cursor:default}\n.tc{cursor:pointer;border-bottom:1.5px dotted rgba(20,48,92,.35)}.tc:hover{background:#eef2f8}\n.bk{border:0;background:#efe9db;border-radius:99px;padding:4px 11px;font-weight:800;color:var(--ink);font-size:13px;margin-top:8px}\n.w3{background:#fff;border-radius:14px;padding:9px 11px;margin-top:10px;box-shadow:0 1px 6px rgba(20,48,92,.06)}\n.w3h{font-size:12px;font-weight:800;color:#7a6a4a;letter-spacing:.04em;margin-bottom:6px}\n.w3n{font-size:12px;color:var(--soft);margin-top:4px}\n.w3.soon{opacity:.55;border:1.5px dashed #d6ccb6;box-shadow:none;background:none}\n.rchips{display:flex;flex-wrap:wrap;gap:6px}\n.rchip{display:inline-flex;align-items:center;gap:6px;border:1.5px solid #c9dcc4;background:#f3faf0;border-radius:12px;padding:5px 9px;text-align:left}\n.rchip b{font:700 18px \"Noto Serif SC\",serif;color:#2f6d4a}.rchip.en b{font-family:Georgia,serif;font-size:15px}\n.rchip small{font-size:11.5px;color:#4b5563;max-width:150px}\n.rchip .rc{font:700 15px \"Noto Serif SC\",serif;color:var(--ink);border-right:1px solid #c9dcc4;padding-right:6px}\n.rchip.dim{border-style:dashed;background:#fbf7ee}.rchip.dim b{color:#8a93a6}\n.rchip.ph{border-color:#c9d3e6;background:#eef3fa}.rchip.ph b{color:#2c64b8}.rchip.ph.drifted{border-style:dashed}\n.rchip.none{border-style:dashed;background:none}\n.rgrp{display:inline-flex;flex-direction:column;gap:2px}.rnote{font-size:11.5px;color:#6b5a2e;background:#fff6e2;border-radius:8px;padding:2px 7px;max-width:240px}\n.big.en{font-family:Georgia,serif}\n.rbig{font:900 44px/1.1 \"Noto Serif SC\",serif;color:#2f6d4a;margin-top:6px}.rbig small{font-size:15px;color:var(--soft);margin-left:8px;font-weight:600}.rbig.en{font-family:Georgia,serif;font-size:34px}\n.rsent{font:600 14.5px/1.5 \"Noto Serif SC\",Georgia,serif;color:var(--ink);background:#f3faf0;border-left:3px solid #2f7d70;border-radius:8px;padding:6px 10px;margin-top:8px}\n.rnet{display:block;width:100%;height:auto;margin-top:6px}\n.rnet .rl{stroke:#9ec2a8;stroke-width:1.2}\n.rnet .rcen{fill:#2f7d70}.rnet .rct{font:900 20px \"Noto Serif SC\",serif;fill:#fff}.rnet .rct.en{font:700 12px Georgia,serif}\n.rnet .rw{cursor:pointer}.rnet .rw rect{fill:#fff;stroke:#c9d3e6;stroke-width:1.2}.rnet .rw text{font:600 13px \"Noto Serif SC\",Georgia,serif;fill:var(--ink)}\n.rnet .rw.l0 rect{fill:var(--hot);stroke:var(--hot)}.rnet .rw.l0 text{fill:#fff}\n.rnet .rw.l2 rect{fill:#fbf7ee;stroke-dasharray:3 2}.rnet .rw.l2 text{fill:#6b7488}\n.rleg{display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:var(--soft);margin-top:4px}\n.rleg i{display:inline-block;width:12px;height:12px;border-radius:6px;vertical-align:-2px;margin-right:4px;border:1.2px solid #c9d3e6;background:#fff}\n.rleg i.l0{background:var(--hot);border-color:var(--hot)}.rleg i.l2{background:#fbf7ee;border-style:dashed}\n.shps{display:flex;flex-wrap:wrap;gap:7px}\n.shp{display:flex;flex-direction:column;align-items:flex-start;border:1.5px solid #c9dcc4;background:#f3faf0;border-radius:14px;padding:6px 10px;min-width:74px;text-align:left}\n.shp b{font:900 22px/1.1 \"Noto Serif SC\",serif;color:#2f6d4a}.shp b.en{font:700 16px Georgia,serif}\n.shp small{font-size:11px;color:#4b5563}.shp .sw{font-size:12px;color:var(--hot);font-weight:800;margin-top:2px}\n.shp.p{border-color:#c9d3e6;background:#eef3fa}.shp.p b{color:#2c64b8}\n.pron{display:flex;gap:4px;align-items:flex-end;margin-top:6px;flex-wrap:wrap}\n.pron .pc{display:flex;flex-direction:column;align-items:center;min-width:38px}\n.pron .pc i{font-style:normal;font-size:13px;font-weight:700;color:var(--hot);position:relative;padding-right:6px}\n.pron .pc b{font:900 34px/1.1 \"Noto Serif SC\",serif;color:var(--ink)}\n.pron .pyw{font-size:15px;color:var(--hot);font-weight:700}.pron .ipa{font:600 18px Georgia,serif;color:#2c64b8}\n.w3s{font-size:11.5px;color:#7a6a4a;font-weight:700;margin:6px 0 4px}\n.schips{display:flex;flex-wrap:wrap;gap:6px}\n.schip{display:flex;flex-direction:column;align-items:flex-start;border:1.5px solid #c9d3e6;background:#eef3fa;border-radius:12px;padding:4px 9px;text-align:left}\n.schip b{font:700 15px Georgia,\"Noto Serif SC\",serif;color:#2c64b8}.schip small{font-size:12px;color:var(--ink)}\n.pairc{display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff;border:1.5px solid #e6dfcf;border-radius:14px;padding:7px 9px;margin-top:6px;cursor:pointer}\n.pairc .vs{font-size:11.5px;color:#7a6a4a;font-weight:800;background:#fff6e2;border-radius:99px;padding:1px 8px}\n.ps{display:inline-flex;align-items:baseline;gap:5px}.ps b{font:700 17px \"Noto Serif SC\",Georgia,serif;color:var(--ink)}.ps small{font-size:12px;color:var(--hot);font-weight:700}.ps .play{padding:0 7px}\n.pairc .why{flex-basis:100%;font-size:12.5px;color:#4b5563}\n.pnote{flex-basis:100%;font-size:12px;color:#6b5a2e;background:#fff6e2;border-radius:10px;padding:3px 8px;margin-top:4px}\n.hard{flex-basis:100%;font-size:12px;color:#2f6d4a;background:#eef6ef;border-radius:10px;padding:3px 8px;margin-top:4px}\n.pairc.hardp{border-color:#9ec2a8}\n.pairbig{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px}.pairbig .ps b{font-size:28px}\n.rbig.snd{color:#2c64b8;font-family:Georgia,\"Noto Serif SC\",serif}.rsent.snd{background:#eef3fa;border-left-color:#2c64b8}\n.rnet.snd .rcen{fill:#2c64b8}.rnet.snd .rl{stroke:#a9bfe0}\n.slist{margin-top:8px}.srow{display:flex;align-items:center;gap:8px;padding:4px 0;border-top:1px dashed #e6dfcf}.srow .sp{font-size:12.5px;color:var(--hot);font-weight:700}.srow .sg{font-size:12px;color:var(--soft);flex:1}\n.sayafter{display:flex;gap:8px}.sayafter .btn{margin-top:0}.aftout{font:600 16px \"Noto Serif SC\",Georgia,serif;color:var(--ink);text-align:center;min-height:1.5em;margin-top:6px}\n.shp.snd{border-color:#c9d3e6;background:#eef3fa}.shp.snd b{color:#2c64b8}\n.wlist{display:flex;flex-direction:column}\n.wrow{padding:6px 2px;border-top:1px dashed #e6dfcf;cursor:pointer}\n.wrow.u{background:linear-gradient(90deg,#eef3fa,transparent 70%)}\n.ub{font-size:12px}\n.wmain{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}\n.wmain b{font:700 17px \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.wpy{font-size:12px;color:var(--hot);font-weight:700}\n.wmean{font-size:12.5px;color:var(--soft)}\n.wi{font-size:12px;color:#8a7a50}\n.wmain .play{margin-left:auto;padding:1px 8px}\n.wother{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:3px;font-size:13px;color:#33476b}\n.wother .wl i{font-style:normal;font-size:10.5px;font-weight:800;color:#8a93a6;margin-right:4px}\n.wnote{display:none;font-size:12.5px;color:#6b5a2e;background:#fff6e2;border-radius:10px;padding:5px 9px;margin-top:5px}\n.wrow.open .wnote{display:block}\n.uni{background:#eef3fa;border-radius:14px;padding:8px 10px;margin-top:10px}\n.uni .sub2{font-size:11.5px;color:var(--soft);margin:0 0 4px}\n.unichips{display:flex;flex-wrap:wrap;gap:5px}\n.uc{border:1.5px solid #c9d3e6;background:#fff;border-radius:99px;padding:3px 10px;font:600 13px \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.split{margin-top:12px;background:#fff;border-radius:14px;padding:10px 12px}\n.split b{display:block;color:var(--ink);font-size:13.5px;margin-bottom:4px}\n.split .sp{padding:5px 0;border-top:1px dashed #e6dfcf;font-size:13px}\n.split .sp span{font-weight:800;color:var(--ink)}.split .sp small{display:block;color:var(--soft);font-size:12px}\n.lucasT{border:0;background:none;padding:0;text-align:left;width:100%;cursor:pointer}\n.lucasT .car{font-size:13px;color:#8a7a50;display:inline-block;transition:transform .2s}\n.lucas-shut .said,.lucas-shut .sub{display:none}.lucas-shut .car{transform:rotate(-90deg)}\n.same{margin-top:12px;background:#eef3fa;border-radius:14px;padding:10px 11px}\n.same .h{font:700 14px Georgia,\"Noto Serif SC\",serif;color:var(--ink)}\n.same .sub2{font-size:11.5px;color:var(--soft);margin:1px 0 4px}\n.same .do{border-top-color:#d7e1f0}\n.same .lg{font-size:10.5px;font-weight:800;background:#fff;border-radius:99px;padding:1px 7px;color:#33476b;margin-left:4px}\n.same .nt{font-size:12.5px;color:#33476b;margin-top:8px;border-top:1px dashed #c9d3e6;padding-top:7px}\n.sbx{margin-top:10px}\n.sbx .micerr{font-size:12.5px;color:#8a3a14;background:#fff1d6;border-radius:10px;padding:6px 10px;margin:6px 0}\n.sbx .live{font:600 17px/1.5 \"Noto Serif SC\",Georgia,serif;color:var(--ink);min-height:1.5em;text-align:center;margin:4px 0}\n.locked{position:relative;border:1.5px dashed #d9b86a!important;background:#fffaf0!important}\n.locked .lk{display:block;font:600 11.5px -apple-system,sans-serif;color:#8a7a50;margin-bottom:4px}\n/* 回应 */\n.toast{position:absolute;top:52px;left:50%;transform:translate(-50%,-14px);opacity:0;background:var(--ink);color:#fff;font-weight:700;padding:7px 14px;border-radius:99px;transition:.3s;z-index:40;font-size:13px;max-width:88%;text-align:center;pointer-events:none}\n.toast.on{opacity:1;transform:translate(-50%,0)}\n.stamp{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%) rotate(-10deg) scale(3);opacity:0;border:4px solid var(--hot);color:var(--hot);border-radius:12px;padding:8px 16px;font:900 21px/1.2 Georgia,\"Noto Serif SC\",serif;text-align:center;background:rgba(251,247,238,.94);z-index:45;pointer-events:none;white-space:nowrap}\n.stamp small{display:block;font-size:12px;font-weight:700;letter-spacing:.04em}\n.stamp.on{animation:stamp 1.9s ease forwards}\n@keyframes stamp{0%{opacity:0;transform:translate(-50%,-50%) rotate(-10deg) scale(3)}14%{opacity:1;transform:translate(-50%,-50%) rotate(-10deg) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(-10deg) scale(1)}}\n.note{position:absolute;pointer-events:none;font-size:16px;color:var(--hot);z-index:50;animation:note 1s ease-out forwards}\n@keyframes note{to{transform:translateY(-36px);opacity:0}}\n.conf{position:absolute;width:8px;height:12px;z-index:46;pointer-events:none;border-radius:2px;animation:conf 1.6s ease-in forwards}\n@keyframes conf{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}\n.flyer{position:fixed;z-index:9999;pointer-events:none;background:#fff;border:1.5px solid var(--hot);color:var(--ink);border-radius:99px;padding:3px 10px;font:700 13px \"Noto Serif SC\",Georgia,serif;box-shadow:0 6px 18px rgba(226,85,47,.3);transition:transform .8s cubic-bezier(.4,0,.2,1),opacity .8s;white-space:nowrap}\n.flyer.red{background:var(--hot);color:#fff;border-color:var(--hot)}\n\n/* 右边说明 */\n.side{min-width:0}\n.side h2{margin:2px 0 6px;color:var(--ink);font:900 24px/1.3 \"Noto Serif SC\",serif}\n.side .eff{font:700 16px/1.6 \"Noto Serif SC\",serif;color:var(--ink);background:#fff;border-radius:14px;padding:12px 14px;border-left:4px solid var(--hot)}\n.side .m{background:#fff;border-radius:14px;padding:12px 14px;margin:10px 0}\n.side .m b{color:var(--ink)}.side .m p{margin:4px 0 0;font-size:14px;color:#4b5563}\n.side h4{margin:20px 0 6px;color:var(--ink);font:700 16px \"Noto Serif SC\",serif}\n.side table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;font-size:13px}\n.side td,.side th{padding:6px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}\n.side th{background:#f4efe4;color:var(--ink)}\n.tbl{overflow-x:auto;border-radius:14px}\n.chk{background:#f4efe4;border-radius:14px;padding:10px 14px;font-size:13.5px;color:#4b5563;margin-top:12px}\n.chk li{margin:4px 0}\n\n/* ===== 软件里：整屏、跟着底栏 ===== */\n:host{position:fixed;inset:0;z-index:40;display:block;background:var(--ivory);color:#24303a;font:15px/1.55 -apple-system,\"PingFang SC\",\"Helvetica Neue\",sans-serif}\n:host([hidden]){display:none}\n.phone{width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;border-radius:0!important;box-shadow:none!important;margin:0}\n.bar{padding-top:calc(12px + env(safe-area-inset-top,0px))}\n.bar .setb{margin-left:auto;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700;color:var(--ink)}\n.scr{padding-bottom:calc(110px + env(safe-area-inset-bottom,0px))}\n@media (max-width:700px){.sheet{padding-bottom:calc(88px + env(safe-area-inset-bottom,0px))}}\n.myempty .go button{border:0;background:none;color:var(--hot);font:inherit;font-weight:800;padding:0;cursor:pointer}\n:host(.rtl) :is(p,div,span,b,small,button,h1,h2,h3,h4,a,em,i,u,label,textarea,input,text){unicode-bidi:plaintext}\n.mefoot{display:flex;flex-direction:column;gap:8px}\n.mefoot button{display:block;width:100%;text-align:left;border:0;background:#fff;border-radius:14px;padding:11px 13px;box-shadow:0 1px 6px rgba(20,48,92,.07);font:inherit;color:#24303a;cursor:pointer}\n.mefoot b{color:var(--ink);font-size:14.5px}.mefoot small{display:block;color:var(--soft);font-size:12px;margin-top:1px}\n@media (min-width:701px){\n :host{left:84px}\n .scr{padding:22px 32px 60px}\n .scr>*{max-width:760px;margin-left:auto;margin-right:auto}\n .sheet{left:50%;right:auto;width:min(620px,92%);transform:translate(-50%,105%)}\n .sheet.on{transform:translate(-50%,0)}\n}\n";
const SKEL = () => `<div class="phone" id="phone"><div class="bar">🌱 <b id="tBar"></b><span class="demo" id="tDemo" hidden></span><button class="setb" data-mego="set">⚙️ ${UT("设置", "Settings")}</button></div><div class="toast" id="toast"></div><div class="stamp" id="stamp"></div><div class="scr" id="scr"></div><div class="veil" id="veil"></div><div class="sheet" id="sheet"><div class="grab"></div><button class="x" id="x" aria-label="close">✕</button><div class="in" id="sin"></div></div></div>`;
let HOST = null, SR = null, API = null, WANT = null, POLL = 0;
const ready = () => !!(window.WORLD_NET && window.HVML);
function shell(){ if (HOST) return; HOST = document.createElement("div"); HOST.id = "mlPg"; HOST.hidden = true; document.body.appendChild(HOST);
  SR = HOST.attachShadow({mode: "open"}); SR.innerHTML = `<style>${ML_CSS}</style><div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8f7a4c;font:600 12px Georgia,serif;letter-spacing:.5em">HEYVOYO</div>`; }
function boot(){ if (API) return; SR.innerHTML = `<style>${ML_CSS}${window.HVML.CSS}</style>` + SKEL(); API = run(SR, HOST); }
function open(o){ shell(); if (window.hvPage) window.hvPage.show("me"); HOST.hidden = false; HOST.classList.toggle("rtl", document.documentElement.dir === "rtl"); document.body.classList.add("gal-on", "ml-on"); WANT = o || {};
  if (ready()){ boot(); API.enter(WANT); return; }
  if (!POLL) POLL = setInterval(() => { if (!ready()) return; clearInterval(POLL); POLL = 0; boot(); if (!HOST.hidden) API.enter(WANT); }, 150); }
function hide(){ if (!HOST || HOST.hidden) return; HOST.hidden = true; document.body.classList.remove("ml-on"); if (API) API.close(); try { speechSynthesis.cancel(); } catch (e) {} }
window.MYLANG = {open, hide, isOpen: () => !!(HOST && !HOST.hidden)};
function run(SR, HOST){
const HV = window.HVML;

const NET = window.WORLD_NET || {people:{}};
const PHOTO = {mei:1,ren:1,pong:1,tobi:1,linhao:1,rina:1,jade:1,tom:1,rosa:1,kenji:1,bea:1,owen:1,camila:1,nadia:1,nour:1,jiwoo:1};
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const svgUri = s => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
function face(id){
  if (PHOTO[id]) return `https://img.heyvoyo.com/npc/${id}/face.webp`;
  const p = NET.people && NET.people[id];
  if (p && p.face) return p.face;
  // 没有画好的头像：用名字的第一个字（跟世界的网样板一样）
  const nm = p ? (typeof p.nm === "string" ? p.nm : (p.nm.zh || p.nm.en)) : id;
  const AVC = ["#e2552f","#2c64b8","#2f7d70","#8a4a9a","#b8401f","#3a6fb8","#c0577a","#5a7a2a"];
  const c = AVC[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVC.length];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${c}"/><text x="20" y="26.5" font-size="17" font-weight="700" fill="#fff" text-anchor="middle" font-family="sans-serif">${esc([...nm][0])}</text></svg>`);
}

/* ───────── 两个人的数据（说法全部来自世界的网的公开聊和角色问答；自己的话是演示） ───────── */
const D = {
zh: {
 ui:"en", tl:"zh-CN", natLang:"pt-BR", natName:"Portuguese",
 bar:"Your Chinese", demo:"demo · 演示", title:"Lucas's Chinese",
 me:"Lucas", meTag:"São Paulo · speaks Portuguese · learning Chinese",
 lead:"It grows every time you say something of your own.",
 circles:{
  anim:{n:"Animation people",i:"🎬",c:"#3a6fb8"},
  food:{n:"Food people",i:"🍜",c:"#e2552f"},
  fit:{n:"Home-workout people",i:"🏃",c:"#2f7d70"},
  fash:{n:"Clothes people",i:"👗",c:"#c0577a"}
 },
 people:{
  lin:{nm:"Lin Xia",c:"anim",d:"🎭 key animator · Tokyo",s:"a key animator in Tokyo"},
  ren:{nm:"Ren",c:"anim",d:"🎭 anime fan · Tokyo · also learning Chinese",s:"Ren, an anime fan in Tokyo"},
  seoyeon:{nm:"Han Seo-yeon",c:"anim",d:"🎭 in-between artist · Shanghai",s:"an animator in Shanghai"},
  pong:{nm:"Pong",c:"anim",d:"🎭 fixes old houses · Bangkok · also learning Chinese",s:"Pong in Bangkok"},
  tobi:{nm:"Tobi",c:"anim",d:"🎭 Lagos · also learning Chinese",s:"Tobi in Lagos"},
  mei:{nm:"Mei",c:"food",d:"🎭 bubble-tea shop · Taipei",s:"Mei, who shakes bubble tea in Taipei"},
  xiaoyu_hz:{nm:"Xiaoyu",c:"fit",d:"🎭 works out at home after work · Hangzhou",s:"Xiaoyu, who works out at home in Hangzhou"},
  chenjie:{nm:"Chen Jie",c:"fash",d:"🎭 runs a garment factory · Panyu, Guangzhou",s:"Chen Jie in Panyu"}
 },
 order:["lin","ren","seoyeon","pong","tobi","mei","xiaoyu_hz","chenjie"],
 phrases:[
  {id:"p_wende",t:"问得好",py:"wèn de hǎo",m:"Good question!",who:"lin",mk:["问得好"],
   where:"🎬 Animation · public talk — Camila asked “what is key animation?”",
   q:"问得好！原画画最重要的几张：一个动作的开始、结束，还有最用力的那一下。",qtr:"Great question! Key animators draw the most important frames: where a move starts, ends, and its strongest moment.",
   prac:{ask:"你第一次在中国吃饭，最意外的是什么？",askTr:"The first time you ate in China, what surprised you most?",
    pick:[["问得好！最意外的是大家一起分着吃。","Good question! What surprised me most was everyone sharing the dishes."],["问得好！我没想到早饭也吃热的。","Good question! I didn't expect breakfast to be hot food too."],["问得好！最意外的是有一桌菜一点都不辣。","Good question! The biggest surprise was a whole table of food that wasn't spicy at all."]],
    fill:{f:"问得好！最意外的是___。",chips:[["大家分着吃","everyone shares the dishes"],["早饭吃热的","breakfast is hot food"],["店里会给一杯免费的茶","the restaurant brings you free tea"]],tr:"Good question! What surprised me most was ___."},
    nat:"Boa pergunta! O que mais me surpreendeu foi todo mundo dividir os pratos."}},
  {id:"p_yiban",t:"一半是真的",py:"yíbàn shì zhēn de",m:"Half of it is true.",who:"lin",mk:["一半是真的"],
   where:"🎬 Animation · line “Manila draws Japan's in-betweens” — Pong asked if it's tiring and badly paid",
   q:"一半是真的。日本动画师演出协会 2019 年的调查，平均年收入大约 440 万日元，可是刚入行画中割的人多是按张算钱。",qtr:"Half true. A 2019 survey put average income at about ¥4.4 million, but new in-betweeners are mostly paid per drawing.",
   prac:{ask:"你来中国以前听说的事，有没有哪件后来发现只对了一半？",askTr:"Something you heard before you came to China — did any of it turn out only half true?",
    pick:[["一半是真的：菜是很辣，可是不是每个地方都辣。","Half true: the food is spicy — but not everywhere."],["一半是真的：大家都用手机付钱，可是我的房东还收现金。","Half true: everyone pays by phone — but my landlord still takes cash."],["一半是真的：地铁人很多，可是很准时。","Half true: the metro is packed — but it's always on time."]],
    fill:{f:"一半是真的：___，可是不是每个地方都这样。",chips:[["菜很辣","the food is spicy"],["人很多","it's crowded"],["大家起得很早","people get up early"]],tr:"Half true: ___ — but not everywhere."},
    nat:"Metade é verdade: a comida é apimentada, mas não em todo lugar."}},
  {id:"p_renlai",t:"还要人来定",py:"hái yào rén lái dìng",m:"a person still has to decide",who:"lin",mk:["还要人来定"],
   where:"🎬 Animation · “AI arrives” — Nour said AI will take in-betweeners' jobs",
   q:"我也担心。可是一个动作好不好看、像不像这个人，还要人来定。我觉得这行会变，不会没有。",qtr:"I worry too. But whether a move looks right, whether it feels like this character — a person still decides. The job will change, not disappear."},
  {id:"p_luanshuo",t:"就不乱说了",py:"jiù bú luàn shuō le",m:"…so I won't guess",who:"lin",mk:["就不乱说了"],
   where:"🎬 Animation · Ne Zha — Marisol asked: drawn first or voiced first?",
   q:"《哪吒》具体是怎么录的，我没查到确切的说法，就不乱说了。",qtr:"I couldn't find a solid account of how Ne Zha was recorded, so I won't guess.",
   prac:{ask:"你觉得巴西的中餐馆好吃吗？",askTr:"Are Chinese restaurants in Brazil any good?",
    pick:[["我没吃过几家，就不乱说了。","I haven't tried many, so I won't guess."],["我只吃过一次，就不乱说了。","I've only eaten there once, so I won't guess."],["我不太懂中国菜，就不乱说了。","I don't really know Chinese food, so I won't guess."]],
    fill:{f:"我只___过一次，就不乱说了。",chips:[["吃","eaten there"],["去","been"],["点","ordered"]],tr:"I've only ___ once, so I won't guess."},
    nat:"Só comi lá uma vez, então não vou chutar."}},
  {id:"p_yizhi",t:"一直以为",py:"yìzhí yǐwéi",m:"I always thought… (but no)",who:"ren",mk:["一直以为"],
   where:"🎬 Animation · Astro Boy on TV — Tobi asked how many drawings an episode needs",
   q:"我也一直以为一秒二十四张！难怪打斗的地方特别有劲。",qtr:"I always thought it was 24 a second too! No wonder the fights feel so punchy.",
   also:{who:"camila",nm:"Camila",d:"🎭 Bogotá · also learning Chinese",where:"🍜 Food · fortune cookies",q:"什么？幸运饼干不是中国的？我一直以为是！",qtr:"What? Fortune cookies aren't Chinese? I always thought they were!"}},
  {id:"p_nanguai",t:"难怪",py:"nánguài",m:"no wonder",who:"ren",mk:["难怪"],
   where:"🎬 Animation · Astro Boy on TV — Tobi asked how many drawings an episode needs",
   q:"我也一直以为一秒二十四张！难怪打斗的地方特别有劲。",qtr:"I always thought it was 24 a second too! No wonder the fights feel so punchy."},
  {id:"p_buju",t:"我补一句",py:"wǒ bǔ yí jù",m:"Let me add one thing",who:"seoyeon",mk:["我补一句"],
   where:"🎬 Animation · public talk — Owen asked what it takes to get in",
   q:"我补一句：在上海，很多年轻画师是先在外包公司画中割，画快了再去画原画。",qtr:"Adding one thing: in Shanghai many young artists start on in-betweens at outsourcing studios, then move to key frames once they're fast.",
   also:{who:"chenhao",nm:"Chen Hao",d:"🎭 back-end programmer · Beijing",where:"💻 Software · DeepSeek, from Hangzhou",q:"我补一句：我是看了英文的新闻，才知道硅谷那边那么紧张。",qtr:"Adding one thing: I only learned how worried Silicon Valley was from the English news."},
   prac:{ask:"大家在聊巴西怎么过新年。有人说：「大家去海边看烟花。」",askTr:"Everyone's talking about New Year in Brazil. Someone says: “People go to the beach for fireworks.”",
    pick:[["我补一句：很多人穿白衣服。","Let me add: lots of people wear white."],["我补一句：还要跳七个浪。","Let me add: you jump seven waves, too."],["我补一句：我们家都在家吃饭。","Let me add: my family just eats at home."]],
    fill:{f:"我补一句：很多人穿___衣服。",chips:[["白","white"],["新","new"],["黄","yellow"]],tr:"Let me add: lots of people wear ___ clothes."},
    nat:"Só complementando: muita gente usa roupa branca."}},
  {id:"p_shuoju",t:"说句实话",py:"shuō jù shíhuà",m:"to be honest",who:"pong",mk:["说句实话"],
   where:"🎬 Animation · line “Manila draws Japan's in-betweens” — Pong's own question",
   q:"说句实话，画中割是不是又累、钱又少？",qtr:"Honestly — is drawing in-betweens exhausting and badly paid?"},
  {id:"p_zuishang",t:"嘴上很凶，可是心里很软",short:"嘴上…心里…",py:"zuǐ shang hěn xiōng, kěshì xīn li hěn ruǎn",m:"tough words, soft heart",who:"tobi",mk:["嘴上很凶，可是心里很软"],
   where:"🎬 Animation · Ne Zha — what Tobi felt after the film",
   q:"看完《哪吒》，我想到了我爸。他嘴上很凶，可是心里很软。",qtr:"After Ne Zha I thought of my dad. Tough words, soft heart."},
  {id:"p_qishi",t:"其实",py:"qíshí",m:"actually (not what you'd think)",who:"mei",mk:["其实"],
   where:"🍜 Food · General Tso's chicken, Taipei → New York — Owen asked if people eat it in China",
   q:"其实不常见。它是一位湖南厨师彭长贵 1950 年代在台北做出来的。",qtr:"Not really. A Hunan chef, Peng Chang-kuei, created it in Taipei in the 1950s."},
  {id:"p_faner",t:"反而",py:"fǎn'ér",m:"instead — the opposite of what you'd expect",who:"mei",mk:["反而"],
   where:"🍜 Food · General Tso's chicken, Taipei → New York",
   q:"美国的中餐馆把它做得更甜，就到处都是了。所以很多中国人、台湾人反而没吃过。",qtr:"American Chinese restaurants made it sweeter, then it was everywhere. So lots of people in China and Taiwan have never had it.",
   prac:{ask:"你开始学中文以后，什么跟你想的不一样？",askTr:"Since you started Chinese, what turned out different from what you expected?",
    pick:[["我以为声调最难，反而写字更难。","I thought tones would be hardest — writing's harder, actually."],["我以为会很无聊，反而越学越好玩。","I thought it'd be boring — instead it gets more fun."],["我以为没人会听我说，反而大家很有耐心。","I thought nobody would listen — instead people are so patient."]],
    fill:{f:"我以为声调最难，反而___更难。",chips:[["写字","writing"],["听","listening"],["说快","speaking fast"]],tr:"I thought tones were hardest — ___ is harder, actually."},
    nat:"Eu achava que os tons eram o mais difícil, mas escrever é ainda mais difícil."}},
  {id:"p_buyong",t:"不用……就行",short:"不用…就行",py:"búyòng … jiù xíng",m:"no need to … — just … is enough",who:"xiaoyu_hz",mk:["不用","就行"],
   where:"🏃 Home workouts · asked Xiaoyu “why work out with videos?”",
   q:"去健身房要办卡，还要跟教练说话，我有点怕。跟着视频不用说话，跟着音乐动就行。",qtr:"The gym means a membership and talking to trainers — that scares me a bit. With a video I don't have to talk, I just move with the music."},
  {id:"p_liangtian",t:"……了两天，……就……",short:"…了两天就…",py:"…le liǎng tiān, … jiù …",m:"after just two days, …",who:"xiaoyu_hz",mk:["了两天","就"],
   where:"🏃 Home workouts · living-room workouts go viral — Camila asked who Liu Genghong is",
   q:"我也跳过，跳了两天腿就酸了！",qtr:"I tried it too — two days and my legs were sore!"},
  {id:"p_lei",t:"累是真的累，可是……",short:"累是真的累",py:"lèi shì zhēn de lèi, kěshì…",m:"it really is tiring — but…",who:"chenjie",mk:["累是真的累，可是"],
   where:"👗 Clothes · SHEIN's factories in Panyu — Camila asked if the workers are exhausted",
   q:"番禺做快单的小厂很多……工人常常做到很晚。累是真的累，可是很多人也靠这份工养家。",qtr:"…workers often go on late into the night. It really is exhausting — and a lot of people support their families with this work.",
   prac:{ask:"你学中文累不累？",askTr:"Is learning Chinese tiring?",
    pick:[["累是真的累，可是很好玩。","It really is tiring — but it's fun."],["累是真的累，可是我能看懂一点动画了。","Tiring, really — but I can follow a bit of anime now."],["累是真的累，可是我认识了很多人。","It really is tiring — but I've met so many people."]],
    fill:{f:"___是真的___，可是我喜欢。",chips:[["难","hard"],["累","tiring"],["慢","slow"]],tr:"It really is ___ — but I like it.",twice:1},
    nat:"Cansa mesmo, mas é divertido."}},
  {id:"p_xinqing",t:"……完，心情就好了",short:"…完，心情就好了",py:"…wán, xīnqíng jiù hǎo le",m:"once it's done, I feel better",who:"xiaoyu_hz",mk:["心情就好了"],hidden:1,
   where:"🏃 Home workouts · asked Xiaoyu “why work out with videos?”",
   q:"跟着视频不用说话，跟着音乐动就行。练完出一身汗，心情就好了。",qtr:"With a video I don't have to talk. After a good sweat I feel better."}
 ],
 kinds:{answer:"💬 Answer in a public talk",think:"🗣️ What do you think?",like:"❤️ I like",line:"🔗 I know a line",fresh:"🌱 Just said"},
 lines:[
  {id:"o1",k:"answer",at:"Spirited Away",t:"我小时候一直以为千寻很勇敢。其实她一开始很害怕，跟我第一次来中国一样。",tr:"As a kid I always thought Chihiro was brave. Actually she's scared at first — like me my first time in China.",uses:["p_yizhi","p_qishi"]},
  {id:"o2",k:"like",at:"Ne Zha",t:"我喜欢哪吒的爸爸。嘴上很凶，可是心里很软，跟我爸一模一样。",tr:"I like Ne Zha's dad. Tough words, soft heart — exactly like my dad.",uses:["p_zuishang"],mk:{p_zuishang:["嘴上很凶，可是心里很软"]}},
  {id:"o3",k:"think",at:"AI arrives",t:"说句实话，我看不出哪张是 AI 画的。可是好不好看，还要人来定。",tr:"Honestly, I can't tell which drawings AI made. But whether it looks good — a person still has to decide.",uses:["p_shuoju","p_renlai"]},
  {id:"o4",k:"think",at:"Bubble tea",t:"圣保罗的奶茶太甜了，难怪我每次都喝不完。去台北我要点无糖的。",tr:"Milk tea in São Paulo is too sweet — no wonder I never finish one. In Taipei I'll order it with no sugar.",uses:["p_nanguai"]},
  {id:"o5",k:"answer",at:"Pamela takes off in China",t:"我也跟着她练过！不用去健身房，铺个垫子就行。练了三天，我的腿就酸得下不了楼了，哈哈。",tr:"I've done her workouts too! No gym needed — just a mat. Three days in, my legs were too sore to take the stairs, haha.",uses:["p_buyong","p_liangtian"],mk:{p_liangtian:["了三天","就酸"]}},
  {id:"o6",k:"line",at:"Tokyo's first ramen shop ↔ São Paulo",t:"其实圣保罗也有很多拉面店。巴西是日本以外日裔最多的国家。",tr:"Actually São Paulo has lots of ramen shops too. Brazil has more people of Japanese descent than anywhere outside Japan.",uses:["p_qishi"],pend:"🌱 being checked · needs a source"}
 ],


 /* 抽屉里的东西：「别人这么说」全部是世界的网的公开聊和角色问答原句；找不到真句子的抽屉就空着 */
 dr:{
  d1:{note:"Camila (Bogotá) opens with what she loves; Ana (São Paulo) goes straight to her question.",others:[
    {w:"camila",nm:"Camila",c:"Bogotá",t:"你好！我很喜欢动画。",tr:"Hi! I really like anime.",at:"🎬 Animation · public talk"},
    {w:"ana",nm:"Ana",c:"São Paulo",t:"你好！《龙珠》的悟空和《西游记》的孙悟空……是一个人吗？",tr:"Hi! Dragon Ball's Goku and Journey to the West's Sun Wukong… same person?",at:"🎬 Dragon Ball ← Journey to the West"}]},
  d3:{note:"Everyone leads with what they do — Marisol and Pong say it in five words: “我是做……的”.",others:[
    {w:"jade",nm:"Jade",c:"Melbourne",t:"你好！我是墨尔本的教练。",tr:"Hi! I'm a coach in Melbourne.",at:"🏃 Pamela takes off in China"},
    {w:"marisol",nm:"Marisol",c:"Mexico City",t:"我是做配音的。",tr:"I do dubbing.",at:"🎬 Ne Zha"},
    {w:"pong",nm:"Pong",c:"Bangkok",t:"我是修老房子的。",tr:"I fix up old houses.",at:"🎬 Spirited Away"}]},
  d8:{note:"Lin comforts by worrying alongside; Tang Tang tells Kwame what his story made her want to do.",others:[
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"我也担心。",tr:"I worry too.",at:"🎬 AI arrives · answering Nour"},
    {w:"tangtang",nm:"Tang Tang",c:"Shanghai",t:"听你这么说，我更想把每一件都好好卖出去了。",tr:"Hearing you say that, I want to sell every piece properly even more.",at:"👗 Kantamanto · answering Kwame"}]},
  d10:{note:"Xiaoyu (Hangzhou) and Mei (Taipei) both start from an ordinary moment of their day.",others:[
    {w:"xiaoyu_hz",nm:"Xiaoyu",c:"Hangzhou",t:"下班回来，在出租屋里跟着帕梅拉的视频练，十五分钟，铺个瑜伽垫就行。",tr:"After work I follow Pamela's videos in my rented room — fifteen minutes, just a yoga mat.",at:"🏃 asked Xiaoyu"},
    {w:"mei",nm:"Mei",c:"Taipei",t:"下课以后去店里。先煮珍珠，要煮好久。",tr:"After class I go to the shop. First I cook the pearls, which takes ages.",at:"🍜 asked Mei"}]},
  d11:{note:"Nour (Cairo) and Kwame (Accra) both tell it as a “first time” or a childhood memory.",others:[
    {w:"nour",nm:"Nour",c:"Cairo",t:"我第一次带中国旅游团的时候也很害怕，可是我笑着，没人看出来。",tr:"The first time I led a Chinese tour group I was scared too — but I smiled, and nobody noticed.",at:"🎬 Spirited Away"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"我在成都画了三年中割，后来考进了东京的一家公司。",tr:"I drew in-betweens in Chengdu for three years, then got into a Tokyo studio.",at:"🎬 asked Lin Xia"},
    {w:"kwame",nm:"Kwame",c:"Accra",t:"小时候妈妈常常去那儿买衣服，一大包一大包的，打开以前不知道里面有什么。",tr:"As a kid my mum often bought clothes there, by the big bundle — you never knew what was inside till you opened it.",at:"👗 Kantamanto"}]},
  d12:{note:"Amadou paints one person in one moment; that's enough to see it.",others:[
    {w:"amadou",nm:"Amadou",c:"Guangzhou",t:"一个女孩穿着汉服，手里拿着一杯奶茶，特别好看。",tr:"A girl in hanfu, holding a milk tea — she looked great.",at:"👗 Hanfu"}]},
  d13:{note:"Nadia (London) slows down with “我想问……”; Tobi (Lagos) asks for a rough number with “大概”.",others:[
    {w:"nadia",nm:"Nadia",c:"London",t:"我想问……在台湾买珍珠奶茶，可以……不要糖吗？",tr:"Can I ask… in Taiwan, can I get bubble tea… with no sugar?",at:"🍜 Bubble tea"},
    {w:"tobi",nm:"Tobi",c:"Lagos",t:"一集电视动画，大概要画多少张？",tr:"Roughly how many drawings go into one TV episode?",at:"🎬 Astro Boy on TV"},
    {w:"owen",nm:"Owen",c:"New York",t:"这个菜……在中国，大家也常常吃吗？",tr:"This dish… do people eat it a lot in China too?",at:"🍜 General Tso's chicken"}]},
  d14:{note:"Good questions people asked on the characters' pages. “你是怎么……？” lets someone tell a story; Owen asks about names, not age or money.",others:[
    {w:"owen",nm:"Owen",c:"New York",t:"你家里人怎么叫你？",tr:"What does your family call you?",at:"🎬 Spirited Away · Owen asks his students"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"你是怎么来东京的？",tr:"How did you end up in Tokyo?",at:"asked on Lin Xia's page"},
    {w:"majun",nm:"Ma Jun",c:"Chengdu",t:"你为什么从深圳搬到成都？",tr:"Why did you move from Shenzhen to Chengdu?",at:"asked on Ma Jun's page"}]},
  d15:{note:"Mei says “其实” and then the real story; Tang Tang corrects with a joke.",others:[
    {w:"mei",nm:"Mei",c:"Taipei",t:"其实不常见。",tr:"Not really.",at:"🍜 General Tso's chicken"},
    {w:"tangtang",nm:"Tang Tang",c:"Shanghai",t:"我说我这儿是「古着」，不是「古代」，哈哈。",tr:"I tell them mine is “vintage”, not “ancient”, haha.",at:"👗 Hanfu"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"一半是真的。",tr:"Half true.",at:"🎬 answering Pong"}]},
  d16:{note:"Both say it through one small thing that made their day.",others:[
    {w:"chenhao",nm:"Chen Hao",c:"Beijing",t:"他回我：「Thanks, clear report!」我开心了一整天。",tr:"He replied “Thanks, clear report!” — I was happy all day.",at:"💻 GitHub"},
    {w:"xiaoyu_hz",nm:"Xiaoyu",c:"Hangzhou",t:"这个比秤上的数字更让我开心。",tr:"That makes me happier than the number on the scale.",at:"🏃 asked Xiaoyu"}]},
  d17:{note:"Nour says it softly: “有点……难过”, and through a film.",others:[
    {w:"nour",nm:"Nour",c:"Cairo",t:"我觉得 AI 会抢走中割的工作，有点替画画的人难过。",tr:"I think AI will take in-betweeners' jobs. I feel a bit sad for people who draw.",at:"🎬 AI arrives"},
    {w:"nour",nm:"Nour",c:"Cairo",t:"千寻吃饭团哭的时候，我也哭了。",tr:"When Chihiro cried eating the rice ball, I cried too.",at:"🎬 Spirited Away"}]},
  d18:{note:"Xiaoyu softens it with “有点”; Tang Tang names the exact moment.",others:[
    {w:"xiaoyu_hz",nm:"Xiaoyu",c:"Hangzhou",t:"去健身房要办卡，还要跟教练说话，我有点怕。",tr:"The gym means a membership and talking to trainers — that scares me a bit.",at:"🏃 asked Xiaoyu"},
    {w:"tangtang",nm:"Tang Tang",c:"Shanghai",t:"打开那一下最紧张。",tr:"The moment I open it is the most nerve-racking.",at:"👗 Kantamanto"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"我更担心的是，没问过画师就拿他们的画去训练。",tr:"What worries me more is training on artists' work without asking them.",at:"🎬 AI arrives"}]},
  d19:{note:"Short and plain in Tokyo; Ma Jun says the good part first, then “可是”.",others:[
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"大家说得太快了。",tr:"Everyone talks too fast.",at:"🎬 asked Lin Xia"},
    {w:"majun",nm:"Ma Jun",c:"Chengdu",t:"什么零件都买得到，可是节奏太快了。",tr:"You can buy any part there, but the pace is too fast.",at:"💻 asked Ma Jun"}]},
  d20:{note:"“我一直以为……” turns up in Bogotá and Tokyo alike.",others:[
    {w:"camila",nm:"Camila",c:"Bogotá",t:"什么？幸运饼干不是中国的？我一直以为是！",tr:"What? Fortune cookies aren't Chinese? I always thought they were!",at:"🍜 Fortune cookies"},
    {w:"ren",nm:"Ren",c:"Tokyo",t:"我也一直以为一秒二十四张！",tr:"I always thought it was 24 a second too!",at:"🎬 Astro Boy on TV"},
    {w:"mei",nm:"Mei",c:"Taipei",t:"我们这里也没有！",tr:"We don't have them here either!",at:"🍜 Fortune cookies"}]},
  d21:{note:"Camila says it in three short sentences — and that's plenty.",others:[
    {w:"camila",nm:"Camila",c:"Bogotá",t:"我喜欢电车。很安静。我想我的奶奶。",tr:"I like the train. It's quiet. I miss my grandma.",at:"🎬 Spirited Away"}]},
  d22:{note:"Lin and Ji-hye start with “我觉得”.",others:[
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"我觉得这行会变，不会没有。",tr:"I think the job will change, not disappear.",at:"🎬 AI arrives"},
    {w:"jihye",nm:"Park Ji-hye",c:"Seoul",t:"我觉得是笑话。",tr:"I think it's the jokes.",at:"🎞️ Korean films remade in China"}]},
  d23:{note:"Agreeing can be “我也是！” or “很多人也这么说”; Xu Jing sees both sides.",others:[
    {w:"ren",nm:"Ren",c:"Tokyo",t:"我也是！我小时候一直以为悟空是日本人。",tr:"Me too! As a kid I thought Goku was Japanese.",at:"🎬 Dragon Ball"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"很多中国观众也这么说。",tr:"Lots of Chinese viewers say the same.",at:"🎬 Ne Zha · answering Tobi"},
    {w:"xujing",nm:"Xu Jing",c:"Shanghai",t:"两边我都能理解。",tr:"I can see both sides.",at:"🎞️ Squid Game subtitles"}]},
  d24:{note:"Lin and Xu Jing both say “it depends” in two words before explaining.",others:[
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"我没查到确切的说法，就不乱说了。",tr:"I couldn't find a solid account, so I won't guess.",at:"🎬 Ne Zha"},
    {w:"xujing",nm:"Xu Jing",c:"Shanghai",t:"看情况。",tr:"It depends.",at:"🎞️ asked Xu Jing about subtitles"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"不一定。",tr:"Not always.",at:"🎬 Ne Zha"}]},
  d25:{note:"Two people learning a language for the same reason: to understand people themselves.",others:[
    {w:"majun",nm:"Ma Jun",c:"Chengdu",t:"我想自己看懂他们在骂什么，哈哈，也想看懂他们夸什么。",tr:"I want to understand what they're cursing about, haha — and what they're praising.",at:"💻 asked Ma Jun"},
    {w:"tangtang",nm:"Tang Tang",c:"Shanghai",t:"我想自己跟老板讲价，也想听懂他们讲每件衣服的故事。",tr:"I want to bargain myself and understand the story of every piece.",at:"👗 asked Tang Tang"}]},
  d27:{note:"Xu Jing says “太可惜了” about something cut from a subtitle.",others:[
    {w:"xujing",nm:"Xu Jing",c:"Shanghai",t:"如果删掉的正好是人物的性格，那就太可惜了。",tr:"If what gets cut is exactly the character's personality, that's a real shame.",at:"🎞️ Squid Game subtitles"}]},
  d28:{note:"Xu Jing turns “either is fine” into a tip.",others:[
    {w:"xujing",nm:"Xu Jing",c:"Shanghai",t:"两种都可以，看你这一遍想要什么。",tr:"Either works — it depends what you want from this viewing.",at:"🎞️ Chinese or Spanish subtitles?"}]},
  d30:{note:"Advice here always comes with a small, doable step.",others:[
    {w:"xujing",nm:"Xu Jing",c:"Shanghai",t:"想练中文，第二遍再开中文字幕。",tr:"If you want to practise Chinese, turn on Chinese subtitles the second time.",at:"🎞️ Chinese or Spanish subtitles?"},
    {w:"majun",nm:"Ma Jun",c:"Chengdu",t:"你可以跟学生说：先学会看，再让 AI 帮你写。",tr:"You could tell your students: learn to read code first, then let AI help you write it.",at:"💻 AI writes code"},
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"要一份作品集。多放速写和人在动的画。",tr:"You need a portfolio — lots of quick sketches and people moving.",at:"🎬 getting into animation"}]},
  d32:{note:"Mei gives a heads-up before you're disappointed; Ma Jun passes on someone's “别太激动”.",others:[
    {w:"mei",nm:"Mei",c:"Taipei",t:"不过珍珠煮好以后常常泡在糖水里，所以完全不甜比较难。",tr:"But the pearls usually soak in syrup, so totally unsweet is hard.",at:"🍜 Bubble tea · answering Nadia"},
    {w:"majun",nm:"Ma Jun",c:"Chengdu",t:"也有人说别太激动，好不好用要看自己的项目。",tr:"Some said don't get carried away — whether it's useful depends on your own project.",at:"💻 DeepSeek"}]},
  d33:{note:"Lin cheers the asker; Owen answers a 63-year-old with what he sees in the park.",others:[
    {w:"lin",nm:"Lin Xia",c:"Tokyo",t:"问得好！",tr:"Great question!",at:"🎬 answering Camila"},
    {w:"owen",nm:"Owen",c:"New York",t:"至于年纪嘛，我在公园里看到打太极的，好多都是六七十岁的。",tr:"As for age — lots of the people I see doing tai chi in the park are in their sixties and seventies.",at:"🏃 Tai chi · answering Ruth"}]},
  d34:{note:"Chen Jie says no to the question, then says what she does instead.",others:[
    {w:"chenjie",nm:"Chen Jie",c:"Panyu",t:"我们不做那种快单，我们给欧洲、澳洲的小品牌做。",tr:"We don't do that kind of fast order — we make for small brands in Europe and Australia.",at:"👗 SHEIN's factories"}]},
  d35:{note:"Learners everywhere buy time with “嗯……” and “……” — and people wait.",others:[
    {w:"camila",nm:"Camila",c:"Bogotá",t:"嗯……原画……是什么？",tr:"Um… key animation… what is it?",at:"🎬 Animation · public talk"}]},
  d36:{note:"Seoyeon and Chen Hao both jump back in with “我补一句”.",others:[
    {w:"seoyeon",nm:"Han Seo-yeon",c:"Shanghai",t:"我补一句：在上海，很多年轻画师是先在外包公司画中割。",tr:"Adding one thing: in Shanghai many young artists start on in-betweens at outsourcing studios.",at:"🎬 getting into animation"},
    {w:"chenhao",nm:"Chen Hao",c:"Beijing",t:"我补一句：我是看了英文的新闻，才知道硅谷那边那么紧张。",tr:"Adding one thing: I only learned how worried Silicon Valley was from the English news.",at:"💻 DeepSeek"}]},
  d37:{note:"Mei gives a real order as the example; Pong compares to Bangkok.",others:[
    {w:"mei",nm:"Mei",c:"Taipei",t:"比如「珍珠奶茶，半糖少冰」。",tr:"Like “bubble milk tea, half sugar, less ice”.",at:"🍜 asked Mei"},
    {w:"pong",nm:"Pong",c:"Bangkok",t:"汤屋让我想起曼谷的老店屋。",tr:"The bathhouse reminds me of Bangkok's old shophouses.",at:"🎬 Spirited Away"}]},
  d38:{note:"A “哈哈” at the end tells everyone it's light.",others:[
    {w:"owen",nm:"Owen",c:"New York",t:"我在纽约也跟着她练过！不过我跟不上她的速度，哈哈。",tr:"I did her workouts in New York too! Couldn't keep up with her though, haha.",at:"🏃 Pamela takes off in China"}]}
 },
 mine:{
  d10:[{t:"我也跟着她练过！不用去健身房，铺个垫子就行。",tr:"I've done her workouts too! No gym needed — just a mat.",src:"o5"}],
  d11:[{t:"练了三天，我的腿就酸得下不了楼了，哈哈。",tr:"Three days in, my legs were too sore to take the stairs, haha.",src:"o5"}],
  d15:[{t:"其实她一开始很害怕。",tr:"Actually she's scared at first.",src:"o1"},{t:"其实圣保罗也有很多拉面店。",tr:"Actually São Paulo has lots of ramen shops too.",src:"o6"}],
  d19:[{t:"圣保罗的奶茶太甜了。",tr:"Milk tea in São Paulo is too sweet.",src:"o4"}],
  d20:[{t:"我小时候一直以为千寻很勇敢。",tr:"As a kid I always thought Chihiro was brave.",src:"o1"}],
  d21:[{t:"我喜欢哪吒的爸爸。",tr:"I like Ne Zha's dad.",src:"o2"}],
  d22:[{t:"说句实话，我看不出哪张是 AI 画的。",tr:"Honestly, I can't tell which drawings AI made.",src:"o3"}],
  d25:[{t:"去台北我要点无糖的。",tr:"In Taipei I'll order it with no sugar.",src:"o4"}]
 },
 drMap:{p_wende:"d33",p_yiban:"d15",p_luanshuo:"d24",p_buju:"d36",p_faner:"d20",p_lei:"d10",start:"d10"},
 grow:{t:"我没赶上在电影院看《哪吒》，太可惜了。",tr:"I missed Ne Zha in the cinema — such a shame.",at:"Ne Zha",dr:"d27",word:"可惜"},
 start:{
  q1:"On weekends, what do you do most?",q2:"Why? Pick the one most like you.",
  a1:[
   {em:"📺",l:"Watch anime at home",t:"周末我常常在家看动画。",tr:"On weekends I usually watch anime at home.",n:"No fim de semana eu costumo ver anime em casa.",done:"看完"},
   {em:"🍳",l:"Cook for myself",t:"周末我常常自己做饭。",tr:"On weekends I usually cook for myself.",n:"No fim de semana eu costumo cozinhar pra mim.",done:"做完饭"},
   {em:"🏃",l:"Go running in the park",t:"周末我常常去公园跑步。",tr:"On weekends I usually go running in the park.",n:"No fim de semana eu costumo correr no parque.",done:"跑完"},
   {em:"😴",l:"Sleep till noon",t:"周末我常常睡到中午。",tr:"On weekends I usually sleep till noon.",n:"No fim de semana eu costumo dormir até o meio-dia.",done:"睡醒了"}
  ],
  a2:[
   {l:"No plans, nobody to meet up with",g:[["不用","p_buyong"],["跟别人约，一个人"],["就行","p_buyong"],["。"]],tr:"No need to make plans with anyone — on my own is fine.",n:"Não preciso combinar com ninguém — sozinho já basta."},
   {l:"Honestly, the week wears me out",g:[["说句实话","p_shuoju"],["，一周下来太累了。"]],tr:"Honestly, by the end of the week I'm worn out.",n:"Pra ser sincero, a semana me cansa demais."},
   {l:"Afterwards I'm in a better mood",g:[["{done}，"],["心情就好了","p_xinqing"],["。"]],tr:"Once it's done, I feel better.",n:"Depois disso eu fico de bom humor."}
  ]
 },
 T:{
  net:"tap anything", lgOwn:"what you said", lgUsed:"phrases you use", lgUn:"not yours yet", lgWho:"who you got them from",
  voiceH:"Your voice right now", voiceS:"It comes from the circles you hang out in.",
  likeA:(a,b)=>`Right now your Chinese sounds a little like <b>${a}</b> — and a bit like <b>${b}</b>.`,
  mine:"You picked these circles yourself — nobody gave you a textbook. Want to sound more like someone? Hang out there more.",
  hang:c=>`Hang out with ${c.toLowerCase()} →`, hangT:c=>`(sample) opens the world net · ${c}`,
  listening:"just listening so far",
  shelfH:"Not yours yet", shelfS:"Phrases you picked up but haven't used. No rush — they'll wait here.",
  use:"Use it to say something about you", useS:"Use it", empty:"Everything you borrowed is yours now. Go borrow something new.",
  saidH:"Things you've said", saidS:"The middle of your net. Tap to hear yourself.",
  play:"▶ your voice", playDemo:"▶ your voice (demo)", from:"borrowed from",
  startH:"Not sure what to say yet?", startP:"Start from you. Two small choices about your week, say it in Portuguese first, then watch it grow into Chinese.", startB:"Start from you →",
  heard:"WHERE YOU HEARD IT", alsoSays:"ALSO SAYS IT", usedIn:"WHERE YOU'VE USED IT", notYet:"NOT YOURS YET",
  notYetP:"You've heard it, but haven't said anything of your own with it.",
  hear:"🔊 hear it", hearOrig:"▶ original", letgo:"Not really me — let it go",
  letgoT:"Let go. Your Chinese, your choice.",
  personBorrow:"YOU BORROWED FROM THEM", hangWith:n=>`Go hang out with ${n} →`, hangWithT:n=>`(sample) opens ${n}'s page in the world net`,
  ownWhere:"WHERE YOU SAID IT", ownUses:"PHRASES IN IT", trTog:"meaning",
  someone:"Someone asks you:", lv:[["Pick","most like you"],["Fill in","your own word"],["Say it","your way"]],
  lvNote:"Pick any one. Saying it counts — there's no wrong answer.",
  sayOnce:"🎙️ say it once",
  typeOwn:"…or type your own word", fillDone:"Hear it",
  sayTl:"🎙️ Say it in Chinese", sayNat:"🗣️ Portuguese first",
  sayHint:"Answer with the phrase, about your own life.",
  listen:"Listening… (sample: it stops by itself)", tapMic:"Tap to talk", heardYou:"✓ Got it — that's yours.",
  youSaid:"You said (demo):", growing:"Growing it into Chinese…", aiNote:"AI helps turn your Portuguese into Chinese. In the real app this may cost 1 🛟 — here it's a demo.",
  stamp:"IT'S YOURS NOW", stampS:"a new line in your net", flyNew:n=>`New phrase from ${n} ✨`,
  s1:"About you", s3:"Say it your way first", s3P:"In Portuguese, in your own words. (In this sample the Chinese below is built from your two choices — it won't follow these words.)",
  s4:"Now it grows into Chinese", s4P:"The underlined bits are phrases borrowed from people in your net.",
  next:"Next →", grow:"Grow it into Chinese →", sayNow:"🎙️ Now say it in Chinese",
  rx:["Nice.","That sounds like you.","Ooh, good one.","Yes — that's yours.","Lovely."],
  kept:"Sorted. It's in the middle of your net now.",
  voiceDemo:"(demo: phone voice instead of your recording)",
  drH:"Your drawers", drS:"Six cabinets everyone in the world shares — what you say in each one is yours. New drawers grow when you say something that fits.",
  drCommon:"most people use this", drMore:"more drawers grow here as you talk", drMoreHide:"hide", drGhost:"grows when you say one",
  drNew:"＋ Open a drawer of my own", drNewH:"A drawer of your own", drNewP:"Name it the way you'd say it. Pick the cabinet it lives in.", drNewPh:"e.g. Talking about football", drNewGo:"Open it",
  customQ:"Your own drawer. Put your first line here.", drMineTag:"mine",
  drInvA:q=>`Empty for now. ${q} Listen to how others say it.`, drInvB:q=>`Empty for now. ${q} Nobody in the net has said one yet — you could be the first.`,
  drGrew:"A NEW DRAWER GREW", drGrewS:n=>n, drDemoH:"Demo · a drawer grows", drDemoP:w=>`Lucas says something with “${w}” for the first time.`, drDemoB:"🎙️ Play it",
  drMine:"I USUALLY SAY", drOthers:"OTHERS SAY IT LIKE THIS", drFrom:"from"
 }
},
en: {
 ui:"zh", tl:"en-GB", natLang:"zh-CN", natName:"中文",
 bar:"你的英语", demo:"演示", title:"苏苏的英语",
 me:"Susu", meTag:"成都 · 说得好：中文 · 在学：英语",
 lead:"你每说一句自己的话，它就长大一点。",
 circles:{
  anim:{n:"做动画的人",i:"🎬",c:"#3a6fb8"},
  film:{n:"看剧的人",i:"🎞️",c:"#a8322a"},
  food:{n:"做吃的人",i:"🍜",c:"#e2552f"},
  fit:{n:"练身体的人",i:"🏃",c:"#2f7d70"},
  code:{n:"写代码的人",i:"💻",c:"#2f6d70"},
  fash:{n:"做衣服的人",i:"👗",c:"#c0577a"}
 },
 people:{
  siobhan:{nm:"Siobhán",c:"anim",d:"🎭 开小动画工作室 · 爱尔兰基尔肯尼",s:"爱尔兰开动画工作室的 Siobhán"},
  linhao:{nm:"林浩",c:"anim",d:"🎭 里昂 · 也在学英语",s:"在里昂的林浩"},
  holly:{nm:"Holly",c:"film",d:"🎭 伦敦 · 爱看剧",s:"伦敦爱看剧的 Holly"},
  tom:{nm:"Tom",c:"food",d:"🎭 布里斯托 · 做吃的",s:"布里斯托的 Tom"},
  jade:{nm:"Jade",c:"fit",d:"🎭 健身教练 · 墨尔本",s:"墨尔本的教练 Jade"},
  kasia:{nm:"Kasia",c:"code",d:"🎭 程序员 · 都柏林（波兰人）",s:"都柏林的程序员 Kasia"},
  priya:{nm:"Priya",c:"code",d:"🎭 程序员 · 旧金山（班加罗尔长大）",s:"旧金山的 Priya"},
  rina:{nm:"Rina",c:"fash",d:"🎭 服装厂安全检查 · 达卡",s:"达卡的 Rina"}
 },
 order:["siobhan","linhao","holly","tom","jade","kasia","priya","rina"],
 phrases:[
  {id:"q_eye",t:"Good eye!",m:"眼睛真尖！",who:"siobhan",mk:["Good eye!"],
   where:"🎬 动画 · 《铁臂阿童木》上电视 —— Kenji 问：日本动画为什么一顿一顿的？",
   q:"Good eye! A lot of TV anime is drawn on threes: one drawing holds for three frames.",qtr:"眼睛真尖！很多电视动画是一拍三：一张画停三格。",
   prac:{ask:"Is that sign on the noodle shop hand-painted?",askTr:"那家面馆的招牌是手写的吗？",
    pick:[["Good eye! The owner painted it himself.","眼睛真尖！是老板自己写的。"],["Good eye! It's been there since the 90s.","眼睛真尖！九十年代就在那儿了。"],["Good eye! I never noticed before.","眼睛真尖！我以前都没注意到。"]],
    fill:{f:"Good eye! I ___ that too.",chips:[["noticed","注意到"],["missed","没看到"],["love","喜欢"]],tr:"眼睛真尖！我也___。"},
    nat:"眼睛真尖！是老板自己写的。"}},
  {id:"q_late",t:"Not too late.",m:"不晚。",who:"siobhan",mk:["Not too late."],
   where:"🎬 动画 · 公开聊 —— Kenji 说 31 岁才开始画，是不是太晚了",
   q:"Not too late. I switched from graphic design at 29.",qtr:"不晚。我 29 岁才从平面设计转过来。",
   prac:{ask:"I'm 35. Is it too late to learn to swim?",askTr:"我 35 岁了，现在学游泳太晚了吗？",
    pick:[["Not too late. My dad learned at 50.","不晚。我爸五十岁才学会。"],["Not too late. Start with ten minutes.","不晚。先从十分钟开始。"],["Not too late — I started English at 28.","不晚，我二十八岁才开始学英语。"]],
    fill:{f:"Not too late. I started ___ at 28.",chips:[["drawing","画画"],["running","跑步"],["English","英语"]],tr:"不晚。我二十八岁才开始___。"},
    nat:"不晚。我爸五十岁才学会游泳。"}},
  {id:"q_totally",t:"Totally OK.",m:"完全可以。",who:"kasia",mk:["Totally OK."],
   where:"💻 写软件 · 程序员在家上班 —— Kenji 问：开会我说得慢，可以吗？",
   q:"Totally OK. English is a second language for half my team — me too.",qtr:"完全可以。我们组一半的人英语是第二语言，我也是。",
   prac:{ask:"Can I switch to Chinese if I get stuck?",askTr:"卡住的时候，我可以换成中文吗？",
    pick:[["Totally OK. I do that too.","完全可以，我也这样。"],["Totally OK — just slow down.","完全可以，慢一点就行。"],["Totally OK. Mix both!","完全可以，混着说！"]],
    fill:{f:"Totally OK. I ___ all the time.",chips:[["forget words","忘词"],["mix languages","混着说"],["ask again","再问一遍"]],tr:"完全可以。我老是___。"},
    nat:"完全可以，我也这样。"}},
  {id:"q_beats",t:"… beats …",m:"……比……好",who:"kasia",mk:["beats"],
   where:"💻 写软件 · 程序员在家上班 —— Kenji 问：开会我说得慢，可以吗？",
   q:"Write two lines in the chat before the meeting, then read them out. Slow and clear beats fast.",qtr:"开会前先在群里写两句，开会时照着读。慢一点、说清楚，比说得快好。"},
  {id:"q_both",t:"Both, in a way!",m:"可以说两边都是！",who:"jade",mk:["Both, in a way"],
   where:"🏃 健身 · 普拉提在纽约开了工作室 —— 林浩问：普拉提是德国的还是美国的？",
   q:"Both, in a way! Joseph Pilates was German… So it was born in Europe and grew up in New York.",qtr:"可以说两边都是！约瑟夫·普拉提是德国人……所以它生在欧洲，在纽约长大。"},
  {id:"q_pretty",t:"Pretty much every …",m:"差不多每……都",who:"tom",mk:["Pretty much every"],
   where:"🍜 做吃的 · 土豆从安第斯山到了欧洲 —— Rosa 问：英国人天天吃土豆吗？",
   q:"Pretty much every day — chips, mash, roasties!",qtr:"差不多天天吃：薯条、土豆泥、烤土豆！"},
  {id:"q_stays",t:"stays with you",m:"让人一直忘不了",who:"holly",mk:["stays with"],
   where:"🎞️ 影视 · 《无间道》被翻拍 —— Mei 问：你更喜欢哪一部？",
   q:"Infernal Affairs, I think — it's tighter, and the ending stays with you.",qtr:"我觉得是《无间道》，更紧凑，结尾让人一直忘不了。"},
  {id:"q_never",t:"I'd never have found … without …",short:"never have found…without",m:"没有……我肯定找不到……",who:"holly",mk:["I'd never have found","without"],
   where:"🎞️ 影视 · 《无间道》被翻拍 —— Mei 问：你更喜欢哪一部？",
   q:"But I'd never have found the original without the remake, so I'm grateful to both.",qtr:"可是没有翻拍，我也找不到原版，所以两部我都感谢。",
   prac:{ask:"How did you find this little café?",askTr:"这家小咖啡馆你是怎么找到的？",
    pick:[["I'd never have found it without my roommate.","没有我室友，我肯定找不到。"],["I'd never have found it without getting lost.","要不是迷路，我肯定找不到。"],["I'd never have found it without a food blogger.","没有一个美食博主，我肯定找不到。"]],
    fill:{f:"I'd never have found ___ without this app.",chips:[["my favourite show","我最喜欢的剧"],["my running club","我的跑步群"],["this café","这家咖啡馆"]],tr:"没有这个软件，我肯定找不到___。"},
    nat:"没有我室友，我肯定找不到。"}},
  {id:"q_wrong",t:"felt wrong for",m:"跟……对不上",who:"holly",mk:["felt wrong for"],
   where:"🎞️ 影视 · 《鱿鱼游戏》 —— Jiwoo 问：伦敦人看字幕还是听配音？",
   q:"My flatmates started with the English dub, then switched to subtitles because the voices felt wrong for the faces.",qtr:"我的室友一开始听英语配音，后来换成字幕，因为觉得声音跟脸对不上。"},
  {id:"q_point",t:"and that's the point",m:"要的就是这个",who:"linhao",mk:["and that's the point"],
   where:"🎬 动画 · 《千与千寻》 —— 林浩说的「你怎么看」",
   q:"The train scene. Nobody talks, and that's the point. It felt like my first night in Lyon.",qtr:"电车那一段。没有人说话，要的就是这个。很像我在里昂的第一个晚上。",
   prac:{ask:"Why do you walk home without headphones?",askTr:"你为什么走路回家不戴耳机？",
    pick:[["It's quiet, and that's the point.","很安静，要的就是这个。"],["No phone, no news — and that's the point.","不看手机、不看新闻，要的就是这个。"],["It's slow, and that's the point.","很慢，要的就是这个。"]],
    fill:{f:"Nobody ___, and that's the point.",chips:[["talks","说话"],["calls","打电话"],["rushes","赶时间"]],tr:"没人___，要的就是这个。"},
    nat:"很安静，要的就是这个。"}},
  {id:"q_yesbut",t:"…, yes — but not …",m:"是……，可是还不……",who:"rina",mk:[", yes — but not"],
   where:"👗 服装 · 拉纳广场大楼倒塌 —— Kenji 问：孟加拉的工厂现在安全了吗？",
   q:"Safer, yes — but not perfect.",qtr:"是安全了一些，可是还不完美。"},
  {id:"q_start",t:"is a good start",m:"就是个好开头",who:"jade",mk:["is a good start"],
   where:"🏃 健身 · 减重的常识 —— Kenji 问：天天做仰卧起坐，肚子会瘦吗？",
   q:"Maybe add a walk after dinner — twenty minutes is a good start.",qtr:"再加一个晚饭后的散步，二十分钟就是个好开头。",
   prac:{ask:"I only learned three new words today.",askTr:"我今天只学了三个新词。",
    pick:[["Three words is a good start.","三个词就是个好开头。"],["That's a good start — use them tomorrow.","是个好开头，明天用一用。"],["A good start! Which three?","好开头！哪三个？"]],
    fill:{f:"___ a day is a good start.",chips:[["Ten minutes","十分钟"],["One song","一首歌"],["One page","一页"]],tr:"一天___就是个好开头。"},
    nat:"三个词就是个好开头。"}},
  {id:"q_these",t:"these days",m:"现在、这些年",who:"priya",mk:["These days","these days"],
   where:"💻 写软件 · 班加罗尔的卫星天线 —— Bea 问：班加罗尔也是呼叫中心吗？",
   q:"Both exist, but these days it's a lot of coding.",qtr:"两种都有，不过现在写代码的很多。"}
 ],
 kinds:{answer:"💬 公开聊里的回答",think:"🗣️ 你怎么看",like:"❤️ 我喜欢",line:"🔗 我知道一条线",fresh:"🌱 刚说的"},
 lines:[
  {id:"o1",k:"answer",at:"《千与千寻》",t:"The bathhouse scene stays with me. It felt like my grandma's old teahouse in Chengdu.",tr:"汤屋那一段我一直忘不了，很像成都我外婆那间老茶馆。",uses:["q_stays"]},
  {id:"o2",k:"like",at:"《哪吒》",t:"I love Ne Zha's dad. Strict, yes — but not cold.",tr:"我喜欢哪吒的爸爸。严是严，可是不冷淡。",uses:["q_yesbut"]},
  {id:"o3",k:"think",at:"AI 来了",t:"AI drawing anime? Both, in a way. Fine for the in-betweens, not for the faces.",tr:"AI 画动画？两边都有点道理。画中割可以，画脸不行。",uses:["q_both"],mk:{q_both:["Both, in a way"]}},
  {id:"o4",k:"think",at:"《鱿鱼游戏》",t:"Pretty much every night I watch one episode with subtitles. The dub felt wrong for the faces.",tr:"我差不多每天晚上看一集，开字幕。配音跟脸对不上。",uses:["q_pretty","q_wrong"]},
  {id:"o5",k:"answer",at:"程序员在家上班",t:"Written notes beat a good memory. I write two lines before every stand-up.",tr:"写下来比记性好。每次站会前我都先写两句。",uses:["q_beats"],mk:{q_beats:["beat"]}},
  {id:"o6",k:"line",at:"《哪吒》↔ 成都",t:"These days Chengdu makes films the whole world watches — Ne Zha was made right here.",tr:"现在成都做的片子全世界都在看，《哪吒》就是在这儿做的。",uses:["q_these"],pend:"🌱 还在核对 · 要附来源"}
 ],

 dr:{
  d1:{note:"Rosa in Guadalajara uses the name first; Kenji in Osaka and Lin in Tokyo both ease in with “I want to ask…”.",others:[
    {w:"rosa",nm:"Rosa",c:"瓜达拉哈拉",t:"Hi Tom! In England you eat potato every day, no?",tr:"嗨 Tom！英国人天天吃土豆，对吧？",at:"🍜 土豆从安第斯山到了欧洲"},
    {w:"kenji",nm:"Kenji",c:"大阪 · 也在学英语",t:"Hello. I want ask… why anime look a little… shaky?",tr:"你好。我想问……为什么日本动画看起来有点……一顿一顿的？",at:"🎬 《铁臂阿童木》上电视"},
    {w:"lin",nm:"林夏",c:"东京 · 也在学英语",t:"Hello! I want to ask… how does a small studio in Ireland pay for a long film?",tr:"你好！我想问……爱尔兰的小工作室，做长片的钱从哪儿来？",at:"🎬 Siobhán 的页面"}]},
  d3:{note:"大家都先说自己做什么：Kenji 连年纪一起说，Paolo 说「I'm one of them」。",others:[
    {w:"kenji",nm:"Kenji",c:"大阪 · 也在学英语",t:"I am backend developer, 31.",tr:"我是后端程序员，31 岁。",at:"🎬 动画 · 公开聊"},
    {w:"marisol",nm:"Marisol",c:"墨西哥城",t:"I dub into Spanish, so I match the original lips.",tr:"我配西班牙语，所以要对上原来的口型。",at:"🎬 先画还是先录"},
    {w:"paolo",nm:"Paolo",c:"马尼拉",t:"I'm one of them — I draw in-betweens after class.",tr:"我就是其中一个，下课以后画中割。",at:"🎬 马尼拉给日本画中割"}]},
  d8:{note:"Siobhán 和 Kasia 都先说「没事」，再说自己也一样。",others:[
    {w:"siobhan",nm:"Siobhán",c:"爱尔兰基尔肯尼",t:"Not too late. I switched from graphic design at 29.",tr:"不晚。我 29 岁才从平面设计转过来。",at:"🎬 回 Kenji"},
    {w:"kasia",nm:"Kasia",c:"都柏林",t:"Totally OK. English is a second language for half my team — me too.",tr:"完全可以。我们组一半的人英语是第二语言，我也是。",at:"💻 回 Kenji"}]},
  d10:{note:"拉各斯的 Tobi 说家里说哪几种话；Priya 说自己在哪儿长大。",others:[
    {w:"tobi",nm:"Tobi",c:"拉各斯",t:"Same in my house in Lagos — English, Yoruba and pidgin, all in one sentence.",tr:"我在拉各斯的家里也一样：英语、约鲁巴语、皮钦语，一句话里全有。",at:"🎞️ 《狮子心》"},
    {w:"priya",nm:"Priya",c:"旧金山",t:"I grew up in Bangalore.",tr:"我在班加罗尔长大。",at:"💻 班加罗尔的卫星天线"}]},
  d11:{note:"故事都很短：一个时间、一件事、结果。",others:[
    {w:"siobhan",nm:"Siobhán",c:"爱尔兰基尔肯尼",t:"At 29 I sent a short film to a festival, someone saw it, and that was my first job.",tr:"29 岁时我把一个短片投到电影节，有人看到了，那就是我的第一份工作。",at:"🎬 Siobhán 的页面"},
    {w:"holly",nm:"Holly",c:"伦敦",t:"My flatmates started with the English dub, then switched to subtitles.",tr:"我的室友一开始听英语配音，后来换成了字幕。",at:"🎞️ 《鱿鱼游戏》"}]},
  d12:{note:"Siobhán 用一句话就让人看见她的工作室。",others:[
    {w:"siobhan",nm:"Siobhán",c:"爱尔兰基尔肯尼",t:"We're six people in a room above a shop.",tr:"我们六个人，在一家店楼上的一间屋子里。",at:"🎬 Siobhán 的页面"}]},
  d13:{note:"也在学英语的人问得最直接：「Is it OK?」——听得懂就够了。",others:[
    {w:"kenji",nm:"Kenji",c:"大阪 · 也在学英语",t:"Is it OK?",tr:"这样可以吗？",at:"💻 程序员在家上班"},
    {w:"jiwoo",nm:"Jiwoo",c:"首尔 · 也在学英语",t:"In London, people watch Squid Game with subtitle, or with English voice?",tr:"在伦敦，大家看《鱿鱼游戏》是看字幕，还是听英语配音？",at:"🎞️ 《鱿鱼游戏》"},
    {w:"linhao",nm:"林浩",c:"里昂",t:"Pilates is from Germany or America?",tr:"普拉提是德国的还是美国的？",at:"🏃 普拉提"}]},
  d14:{note:"大家在人物页面上问的好问题。「What are you learning?」几乎每个人的页面上都有人问——问学什么，不问年纪和钱。",others:[
    {w:"siobhan",nm:"Siobhán",c:"爱尔兰基尔肯尼",t:"What are you learning these days?",tr:"你最近在学什么？",at:"在 Siobhán 的页面上问的"},
    {w:"holly",nm:"Holly",c:"伦敦",t:"What are you studying?",tr:"你在读什么？",at:"在 Holly 的页面上问的"},
    {w:"jade",nm:"Jade",c:"墨尔本",t:"Have you been to the gym at Venice Beach?",tr:"你去过威尼斯海滩那家健身房吗？",at:"在 Jade 的页面上问的"}]},
  d15:{note:"Nadia 先说好的一半，再用「but」纠正。",others:[
    {w:"nadia",nm:"Nadia",c:"伦敦",t:"Sit-ups make your stomach muscles stronger, which is great — but they don't burn fat just from your belly.",tr:"仰卧起坐能让肚子的肌肉更有力，这挺好——但它不会只烧肚子上的脂肪。",at:"🏃 减重的常识"}]},
  d16:{note:"马尼拉的 Bea 一句「I love that.」就够了。",others:[
    {w:"bea",nm:"Bea",c:"马尼拉",t:"I love that.",tr:"我好喜欢这个想法。",at:"🎬 马尼拉给日本画中割"}]},
  d17:{note:"Jiwoo 用一个角色说自己的孤单。",others:[
    {w:"jiwoo",nm:"Jiwoo",c:"首尔 · 也在学英语",t:"No-Face is… like me in new city. Want friend, don't know how.",tr:"无脸男……像刚到新城市的我。想交朋友，不知道怎么交。",at:"🎬 《千与千寻》"}]},
  d18:{note:"Bea 说小时候怕什么；Kenji 说现在担心什么。",others:[
    {w:"bea",nm:"Bea",c:"马尼拉",t:"The pigs scared me as a kid.",tr:"小时候那些猪把我吓坏了。",at:"🎬 《千与千寻》"},
    {w:"kenji",nm:"Kenji",c:"大阪 · 也在学英语",t:"I want to explain my bug, but I am slow.",tr:"我想讲我的 bug，可是我说得慢。",at:"💻 程序员在家上班"}]},
  d19:{note:"Kenji 直接说；伦敦的 Holly 拿两样东西比。",others:[
    {w:"kenji",nm:"Kenji",c:"大阪 · 也在学英语",t:"In our stand-up meeting everyone speak very fast.",tr:"我们的站会上大家说得很快。",at:"💻 程序员在家上班"},
    {w:"holly",nm:"Holly",c:"伦敦",t:"The Departed is louder and longer.",tr:"《无间行者》更热闹，也更长。",at:"🎞️ 《无间道》被翻拍"}]},
  d20:{note:"台北的 Mei 用「It's funny that…」说自己没想到。",others:[
    {w:"mei",nm:"Mei",c:"台北 · 也在学英语",t:"It's funny that people in London queue for them.",tr:"伦敦的人排队买它，真好玩。",at:"🍜 珍珠奶茶"}]},
  d21:{note:"林浩说得很慢，可是很清楚。",others:[
    {w:"linhao",nm:"林浩",c:"里昂",t:"I like the quiet.",tr:"我喜欢那种安静。",at:"🎞️ 《无间道》被翻拍"}]},
  d22:{note:"Holly 先说答案，再加一句「I think」。",others:[
    {w:"holly",nm:"Holly",c:"伦敦",t:"Infernal Affairs, I think — it's tighter.",tr:"我觉得是《无间道》，更紧凑。",at:"🎞️ 《无间道》被翻拍"}]},
  d23:{note:"「Me too.」是最短的同意；Rina 说两边都对。",others:[
    {w:"linhao",nm:"林浩",c:"里昂",t:"Me too.",tr:"我也是。",at:"🎞️ 《无间道》被翻拍"},
    {w:"rina",nm:"Rina",c:"达卡",t:"Both are true.",tr:"两件事都是真的。",at:"👗 拉纳广场大楼倒塌"},
    {w:"jade",nm:"Jade",c:"墨尔本",t:"Both, in a way!",tr:"可以说两边都是！",at:"🏃 普拉提"}]},
  d24:{note:"「Maybe…」两个人都用，一个是怕太晚，一个是还没想好。",others:[
    {w:"kenji",nm:"Kenji",c:"大阪 · 也在学英语",t:"Maybe too late, but I want try.",tr:"也许太晚了，可是我想试试。",at:"🎬 动画 · 公开聊"},
    {w:"siobhan",nm:"Siobhán",c:"爱尔兰基尔肯尼",t:"Maybe one day.",tr:"也许有一天吧。",at:"🎬 Siobhán 的页面"}]},
  d25:{note:"Nadia 学中文，是想跟病人家属多说两句。",others:[
    {w:"nadia",nm:"Nadia",c:"伦敦",t:"I'd love to say more than hello.",tr:"我很想不只会说「你好」。",at:"🍜 Nadia 的页面"}]},
  d30:{note:"建议都很小、马上能做。",others:[
    {w:"kasia",nm:"Kasia",c:"都柏林",t:"What helps: write two lines in the chat before the meeting, then read them out.",tr:"有个办法：开会前先在群里写两句，开会时照着读。",at:"💻 程序员在家上班"},
    {w:"jade",nm:"Jade",c:"墨尔本",t:"Maybe add a walk after dinner — twenty minutes is a good start.",tr:"再加一个晚饭后的散步，二十分钟就是个好开头。",at:"🏃 减重的常识"}]},
  d32:{note:"Jade 先说「接着做」，再提醒。",others:[
    {w:"jade",nm:"Jade",c:"墨尔本",t:"And keep the sit-ups if you enjoy them!",tr:"喜欢的话，仰卧起坐接着做！",at:"🏃 减重的常识 · 回 Kenji"}]},
  d33:{note:"Siobhán 和 Ngozi 都先夸问的人。",others:[
    {w:"siobhan",nm:"Siobhán",c:"爱尔兰基尔肯尼",t:"Good eye!",tr:"眼睛真尖！",at:"🎬 回 Kenji"},
    {w:"ngozi",nm:"Ngozi",c:"拉各斯",t:"Good question!",tr:"问得好！",at:"🎞️ 《狮子心》 · 回 Kenji"}]},
  d35:{note:"林浩用「……」和问号给自己一点时间。",others:[
    {w:"linhao",nm:"林浩",c:"里昂",t:"The Hong Kong one is more… quiet?",tr:"香港那部更……安静？",at:"🎞️ 《无间道》被翻拍"}]},
  d37:{note:"Tom 一口气举了三个例子。",others:[
    {w:"tom",nm:"Tom",c:"布里斯托",t:"Pretty much every day — chips, mash, roasties!",tr:"差不多天天吃：薯条、土豆泥、烤土豆！",at:"🍜 土豆 · 回 Rosa"}]},
  d38:{note:"Holly 拿妈妈开个小玩笑；Paolo 让你看动画时挥挥手。",others:[
    {w:"holly",nm:"Holly",c:"伦敦",t:"My mum still watches everything dubbed — she says she can't knit and read at the same time.",tr:"我妈到现在什么都看配音的，她说她没法一边织毛衣一边看字。",at:"🎞️ 《鱿鱼游戏》"},
    {w:"paolo",nm:"Paolo",c:"马尼拉",t:"Next time you watch, wave :)",tr:"下次你看的时候，挥挥手 :)",at:"🎬 马尼拉给日本画中割"}]}
 },
 mine:{
  d10:[{t:"These days Chengdu makes films the whole world watches.",tr:"现在成都做的片子全世界都在看。",src:"o6"}],
  d11:[{t:"The bathhouse scene stays with me. It felt like my grandma's old teahouse in Chengdu.",tr:"汤屋那一段我一直忘不了，很像成都我外婆那间老茶馆。",src:"o1"}],
  d19:[{t:"The dub felt wrong for the faces.",tr:"配音跟脸对不上。",src:"o4"}],
  d21:[{t:"I love Ne Zha's dad. Strict, yes — but not cold.",tr:"我喜欢哪吒的爸爸。严是严，可是不冷淡。",src:"o2"}],
  d23:[{t:"Both, in a way.",tr:"两边都有点道理。",src:"o3"}],
  d30:[{t:"Written notes beat a good memory.",tr:"写下来比记性好。",src:"o5"}]
 },
 drMap:{q_eye:"d33",q_late:"d8",q_totally:"d8",q_never:"d11",q_point:"d22",q_start:"d33",start:"d10"},
 grow:{t:"I missed Ne Zha in the cinema — what a shame.",tr:"没赶上在电影院看《哪吒》，太可惜了。",at:"《哪吒》",dr:"d27",word:"what a shame"},
 start:{
  q1:"周末你最常做什么？",q2:"为什么？挑最像你的。",
  a1:[
   {em:"📺",l:"在家看动画",t:" weekend, I watch anime at home.",tr:"周末我差不多都在家看动画。",n:"周末我差不多都在家看动画。"},
   {em:"🍳",l:"自己做饭",t:" weekend, I cook for myself.",tr:"周末我差不多都自己做饭。",n:"周末我差不多都自己做饭。"},
   {em:"🏃",l:"去公园跑步",t:" weekend, I go running in the park.",tr:"周末我差不多都去公园跑步。",n:"周末我差不多都去公园跑步。"},
   {em:"😴",l:"睡到中午",t:" weekend, I sleep till noon.",tr:"周末我差不多都睡到中午。",n:"周末我差不多都睡到中午。"}
  ],
  pre:[["Pretty much every","q_pretty"]],
  a2:[
   {l:"不用约人，一个人就挺好",g:[[" No plans, no people — "],["and that's the point","q_point"],["."]],tr:"不用约人，要的就是这个。",n:"不用约人，要的就是这个。"},
   {l:"说实话，一周下来太累了",g:[[" Honestly, by Friday I'm worn out."]],tr:"说实话，到周五我就累坏了。",n:"说实话，一周下来太累了。"},
   {l:"做完心情好，能好一整天",g:[[" The good mood "],["stays with","q_stays"],[" me all day."]],tr:"好心情能一直待到晚上。",n:"做完心情好，能好一整天。"}
  ]
 },
 T:{
  net:"点哪儿都行", lgOwn:"你说过的话", lgUsed:"你在用的说法", lgUn:"还没变成你的", lgWho:"借给你的人",
  voiceH:"你现在的声音", voiceS:"你混哪个圈子，说话就像哪个圈子。",
  likeA:(a,b)=>`你的英语现在有点像<b>${a}</b>，也有一点像<b>${b}</b>。`,
  mine:"这些圈子是你自己逛出来的，不是课本给的。想说得更像谁，就多去哪儿逛逛。",
  hang:c=>`去${c}那儿逛逛 →`, hangT:c=>`（样板）会打开世界的网 · ${c}`,
  listening:"还只是在听",
  shelfH:"还没变成你的", shelfS:"听到了、借来了，还没用它说过自己的事。不急，它们在这儿等你。",
  use:"用它说一句你自己的事", useS:"用它说一句", empty:"借来的都变成你的了。再去逛逛，借点新的。",
  saidH:"你说过的话", saidS:"这是你这张网的中心。点一下，听听自己。",
  play:"▶ 你的声音", playDemo:"▶ 你的声音（演示）", from:"借自",
  startH:"还没想好要说什么？", startP:"从你自己开始。两道关于你的小选择，先用中文说，再看它长成英语。", startB:"从我开始 →",
  heard:"从哪儿听来的", alsoSays:"也这么说", usedIn:"你在哪儿用过", notYet:"还没变成你的",
  notYetP:"你听过它，还没用它说过自己的事。",
  hear:"🔊 听", hearOrig:"▶ 原声", letgo:"不像我，放下",
  letgoT:"放下了。你的英语，你说了算。",
  personBorrow:"你从 TA 那儿借的", hangWith:n=>`去 ${n} 那儿逛逛 →`, hangWithT:n=>`（样板）会打开世界的网里 ${n} 的那一页`,
  ownWhere:"在哪儿说的", ownUses:"里面借来的说法", trTog:"意思",
  someone:"有人问你：", lv:[["选","挑最像你的"],["填空","填你的词"],["自己说","用你的话"]],
  lvNote:"挑一档就行。说出来就算，没有错的答案。",
  sayOnce:"🎙️ 说一遍",
  typeOwn:"……或者写你自己的词", fillDone:"听一遍",
  sayTl:"🎙️ 用英语说", sayNat:"🗣️ 先用中文说",
  sayHint:"用这个说法，说你自己的事。",
  listen:"在听……（样板：会自己停）", tapMic:"点一下开始说", heardYou:"✓ 听到了，这句是你的。",
  youSaid:"你说的（演示）：", growing:"正在长成英语……", aiNote:"AI 帮你把中文变成英语。真软件里可能用 1 🛟，这里是演示。",
  stamp:"它是你的了", stampS:"你的网里多了一句", flyNew:n=>`新借来一个说法，来自 ${n} ✨`,
  s1:"关于你", s3:"先用你自己的话说", s3P:"用中文，说你自己的话。（样板里，下面的英语是按你的两个选择拼的，不会跟着这些字变。）",
  s4:"现在它长成英语", s4P:"画线的是从你网里的人那儿借来的说法。",
  next:"下一步 →", grow:"长成英语 →", sayNow:"🎙️ 现在用英语说一遍",
  rx:["好。","这句很像你。","哟，这句好。","对，这是你的。","真好。"],
  kept:"整理好了。它在你的网中间了。",
  voiceDemo:"（演示：用手机朗读代替你的录音）",
  drH:"你的抽屉", drS:"六个柜子，全世界的人都一样；每个抽屉里放什么，是你自己的。你说到了，新抽屉就会长出来。",
  drCommon:"大家常用", drMore:"还有一些抽屉，等你说到了自己会长出来", drMoreHide:"收起", drGhost:"说到了就长出来",
  drNew:"＋ 开一个我自己的抽屉", drNewH:"开一个你自己的抽屉", drNewP:"用你自己会说的话起个名字，再挑它放在哪个柜子里。", drNewPh:"比如：聊足球", drNewGo:"开好了",
  customQ:"这是你自己的抽屉，放进第一句吧。", drMineTag:"我的",
  drInvA:q=>`还空着。${q}听听大家怎么说。`, drInvB:q=>`还空着。${q}网上还没人说过——你可以是第一个。`,
  drGrew:"长出一个新抽屉", drGrewS:n=>n, drDemoH:"演示 · 抽屉长出来", drDemoP:w=>`苏苏第一次说了一句带「${w}」的话。`, drDemoB:"🎙️ 放一遍",
  drMine:"我常这么说", drOthers:"别人这么说", drFrom:"来自"
 }
}
};


/* ───────── 新的界面字（两种界面各一份） ───────── */
const T2 = {
 zh: {sorted:"Everything you've said, sorted for you.", youTitle:"Your Chinese", youTag:"You · São Paulo · speaks Portuguese & English · learning Chinese",
  demoNote:"The pale dots are Lucas's demo lines, so the net isn't empty. The bright red ones are yours.", lgDemo:"Lucas · demo", lgSrc:"where you said it",
  myH:"What you said out there", myS:"On the world net and on the map. Tap where you said it to go straight back.",
  myNone:"Nothing yet. Say one line on the world net or the map — it shows up here, already sorted into a drawer.", goNet:"🕸️ Go to the world net →", goMap:"🗺️ Go to the map →",
  inDr:"In", change:"Wrong drawer? Change", heardFrom:(ph, nm) => `You heard “${ph}” from ${nm}`, alsoSays2:(ph, nm) => `${nm} says “${ph}” too`, heardIn:nm => `heard from ${nm}, in a reply to you`, demoMine:n => `${n} · demo`, demoTag:"demo", lucasH:"Lucas's lines · demo", lucasS:"Sample lines so you can see how a full net looks. Not yours.",
  viaVoice:"said aloud", viaTyped:"typed", sameH:"Same meaning — how people say it", sameS:"Different words, one idea. Each line is one person's way of saying it — not a whole place's.",
  inThread:pl => `in the “${pl}” talk`, onPage:pl => `on ${HV.the(pl)} page`, onPerson:pl => `on ${pl}'s page`, here:"🌱 said while practising here",
  sayIt:"🎙️ Say it", sayItP:"It's only sorted into your language once you say it — or type it if the mic can't hear you.", typeIt:"…or type it here", doneT:"That's it ✓",
  demoLocked:"Demo sentence — in the real app AI grows this from your own words. In the sample it can't change.",
  startLocked:"Built from your two choices (demo sentence). What you said in Portuguese can't change it in this sample.",
  shelfS2:"Phrases that came up in replies to you — you've heard them, but haven't said them yourself yet.", moreYou:n => `${n} more`, likeOne:a => `Right now your Chinese sounds a little like <b>${a}</b>.`, moreDr:"··· more grow here once you say something that fits", back:"back", netMean:"MEANING · which drawers it's in", netMeanNone:"Not in a drawer yet.", netShape:"SHAPE · what it's built from", netShapeTip:"Tap a part to see the other words built from it.", netSound:"SOUND", netSoundSoon:"", sShare:"Shares a sound", withChar:w => `Drawer words with “${w}” in them:`, noChar:w => `No drawer word with “${w}” in it yet.`, afterNoMic:"The mic isn't available here — just say it out loud to yourself.", sPair:"Just one bit different", sNone:"No sound links for this one yet.", hardTip:"These two often get mixed up — listen to both, then say them.", hardTip1:"This sound often takes a little practice.", sayAfter:"SAY IT AFTER", youSaidX:x => `You said: ${x}`, noTts:"This browser can't read aloud.", toShape:c => `same sound part ${c} in Shape — they look alike and sound alike`, toSound:"hear them: they look alike and sound alike",
  toneN:k => k === 5 ? "neutral tone ·" : typeof k === "number" ? `tone ${k} ${["", "ˉ", "ˊ", "ˇ", "ˋ"][k]}` : String(k), soundH:"Sounds in your words", soundS:"The sounds that come up in what you've said, sorted for you. Tap one to hear the words that share it.", byName:{syllable:"same syllable", phonetic:"same sound part", tone:"same tone", initial:"same start", final:"same ending", sound:"same sound", spelling:"same spelling"},
  rPart:"a part of it", rDict:"a dictionary heading, not a meaning", rNone:"No part here that helps you guess.", eNone:"An everyday word — it doesn't split into roots.", pSound:py => `sound part · ${py}`, pDrift:"sound part · has drifted",
  rLine:(r, m) => `All have ${r} → mostly about “${m}”.`, rLineDict:r => `All filed under ${r} — here it's a dictionary heading, not a meaning.`, pLine:py => `They look alike, and sound alike too (${py}).`, pLineDrift:"They look alike, but the sound has drifted — don't guess by it.",
  eLine:(r, m) => `All carry ${r} → mostly about “${m}”.`, otherSense:"IN THESE, IT MEANS SOMETHING ELSE", rMine:"you said these", rDrawer:"in your drawers", rEx:"more words like it", shapeH:"Shapes in your words", shapeS:"The parts that show up in what you've said. Sorted for you — tap one to see the words that share it.", wPhr:"COMMON PHRASES", wWords:"WORDS IN THIS DRAWER", wUni:"WORDS EVERY LANGUAGE HAS", uniS2:"🌍 = a word almost every language has, with the same meaning. Tap for the small differences.", uniH:"Words every language has", uniS:"Some words line up across almost every language — tap one to see it side by side.", splitH:"And some words split differently around the world", inDrawers:"SHOWS UP IN THESE DRAWERS",
  replyBy:n => `🎭 ${n} replied`, awayTag:" (doesn't live here)", sortedT:n => `Sorted into “${n}”`, youSaidIt:"You said:", nat1:"🗣️ Say it in Portuguese first", natSaid:"You said in Portuguese:",
  noSrc:"demo", playYou:"▶ hear it (phone voice — no recording saved in this sample)", drGrewMine:"A NEW DRAWER GREW", cabOpen:"tap to open", whoAge:a => `${a}`},
 en: {sorted:"你说过的话，我们帮你整理好了。", youTitle:"你的英语", youTag:"你 · 成都 · 说得好：中文 · 在学：英语",
  demoNote:"淡一点的点是苏苏的演示句，免得网是空的；亮红色的才是你说的。", lgDemo:"苏苏 · 演示", lgSrc:"你在哪儿说的",
  myH:"你在外面说过的", myS:"在世界的网和地图上说的。点「在哪儿说的」，就回到那儿。",
  myNone:"还没有。去世界的网或者地图上说一句——它会出现在这里，已经放进抽屉了。", goNet:"🕸️ 去世界的网 →", goMap:"🗺️ 去地图上 →",
  inDr:"放进了", change:"放错了？改一下", heardFrom:(ph, nm) => `这个「${ph}」你是从 ${nm} 那儿听来的`, alsoSays2:(ph, nm) => `${nm} 也这么说「${ph}」`, heardIn:nm => `${nm} 回你的时候说过`, demoMine:n => `${n} · 演示`, demoTag:"演示", lucasH:"苏苏的话 · 演示", lucasS:"示范用的句子，让你看看网满了是什么样子。不是你的。",
  viaVoice:"说出来的", viaTyped:"打字的", sameH:"同一个意思，大家这么说", sameS:"说的不是一句话，意思是一个。每一句都是一个具体的人的说法，不代表一个地方的人。",
  inThread:pl => `在「${pl}」的公开聊里`, onPage:pl => `在「${pl}」这一页`, onPerson:pl => `在 ${pl} 的页上`, here:"🌱 在这儿练的时候说的",
  sayIt:"🎙️ 说出来", sayItP:"说出来才会整理进你的语言；麦克风用不了，可以打字。", typeIt:"……或者在这儿打字", doneT:"就这样 ✓",
  demoLocked:"这里用演示句：真软件里 AI 会跟着你的话长出来；样板里它不会变。",
  startLocked:"这句是按你的两个选择拼出来的（演示句）；你刚才用中文说的话，在样板里改不了它。",
  shelfS2:"回你的话里出现过的说法：你听过，自己还没说过。", moreYou:n => `还有 ${n} 句`, likeOne:a => `你的英语现在有点像<b>${a}</b>。`, moreDr:"··· 说到了就会长出来", back:"返回", netMean:"意思 · 在哪几个抽屉里", netMeanNone:"还不在哪个抽屉里。", netShape:"字形 · 它是怎么拼起来的", netShapeTip:"点一个部分，看看还有哪些词也用它。", netSound:"声音", netSoundSoon:"", sShare:"有一样的音", withChar:w => `抽屉里带「${w}」的词：`, noChar:w => `抽屉里还没有带「${w}」的词。`, afterNoMic:"这里用不了麦克风——自己大声说一遍就好。", sPair:"只差一点", sNone:"这个词还没有连上声音的线。", hardTip:"这两个常有人分不清——两个都听一听，再跟着说。", hardTip1:"这个音常常要多练一下。", sayAfter:"跟着说", youSaidX:x => `你说的：${x}`, noTts:"这个浏览器不会朗读。", toShape:c => `字形里也是声旁「${c}」：字形像，读音也像`, toSound:"听听它们：字形像，读音也像",
  toneN:k => k === 5 ? "轻声 ·" : typeof k === "number" ? `第${"一二三四"[k - 1]}声 ${["", "ˉ", "ˊ", "ˇ", "ˋ"][k]}` : String(k), soundH:"你的话里的音", soundS:"你说过的话里出现过的音，软件整理好的。点一个，听听哪些词也是这个音。", byName:{syllable:"同一个音节", phonetic:"同一个声旁", tone:"同一个声调", initial:"同一个声母", final:"同一个韵母", sound:"同一个音", spelling:"同一种拼法"},
  rPart:"偏旁", rDict:"查字典用的，不代表意思", rNone:"这里没有能帮你猜的部分。", eNone:"日常词，拆不出词根。", pSound:py => `管读音 · ${py}`, pDrift:"管读音 · 读音已经变了",
  rLine:(r, m) => `都有「${r}」→ 多半跟${m}有关。`, rLineDict:r => `都归在「${r}」下面——这里只是查字典用的，不代表意思。`, pLine:py => `字形像，读音也像（${py}）。`, pLineDrift:"字形像，可是读音已经变了，别靠它猜。",
  eLine:(r, m) => `都有 ${r} → 多半跟「${m}」有关。`, otherSense:"这几个词里，它当别的意思讲", rMine:"你说过的", rDrawer:"抽屉里的", rEx:"还有这些", shapeH:"你的话里的字形", shapeS:"你说过的话里出现过的部首、词根。软件整理好的——点一个，看看哪些词也用它。", wPhr:"常用搭配", wWords:"这个抽屉的词", wUni:"全世界都有的词", uniS2:"🌍 = 几乎每种语言都有、意思对得上的词。点一下看细微的不一样。", uniH:"全世界都有的词", uniS:"有些词几乎每种语言都有、意思对得上——点一个，几种语言并排看。", splitH:"也有些词，各地分得不一样", inDrawers:"常落进这些抽屉",
  replyBy:n => `🎭 ${n} 回了你`, awayTag:"（没住在这儿）", sortedT:n => `放进了「${n}」`, youSaidIt:"你说的：", nat1:"🗣️ 先用中文说", natSaid:"你用中文说的：",
  noSrc:"演示", playYou:"▶ 听一遍（手机朗读；样板不存录音）", drGrewMine:"长出一个新抽屉", cabOpen:"点开", whoAge:a => `${a}`}};
Object.assign(D.zh.T, T2.zh); Object.assign(D.en.T, T2.en);

/* 软件里的你：标签不写演示的城市；「先用母语说」用你的界面语言（学中文的人）。样板里写「（样板）」的几句换成真的去处 */
(function(){ const nat = {en: ["en-US", "English"], es: ["es-ES", "Spanish"], ja: ["ja-JP", "Japanese"], ar: ["ar-SA", "Arabic"], pt: ["pt-BR", "Portuguese"]}[(document.documentElement.lang || "en").slice(0, 2)] || ["en-US", "English"];
  const z = D.zh, e = D.en;
  z.natLang = nat[0]; z.natName = nat[1];
  const swapNat = o => { for (const k in o) if (typeof o[k] === "string") o[k] = o[k].replace(/Portuguese/g, nat[1]).replace(/葡萄牙语/g, nat[1]); };
  swapNat(z.T); if (z.start) swapNat(z.start);
  z.T.youTag = "You · learning Chinese"; e.T.youTag = "你 · 在学英语";
  z.T.listen = "Listening… it stops by itself"; e.T.listen = "在听……说完会自己停";
  z.T.hangT = c => `Opening the world net · ${c}`; e.T.hangT = c => `打开世界的网 · ${c}`;
  z.T.hangWithT = n => `${n} isn't on the world net yet`; e.T.hangWithT = n => `世界的网上还没有 ${n} 的那一页`;
  z.T.aiNote = `AI helps turn your ${nat[1]} into Chinese — it isn't switched on yet, so this is a demo sentence.`; e.T.aiNote = "AI 帮你把中文变成英语——还没接上，这里先给演示句。";
  z.T.s3P = `In ${nat[1]}, in your own words. (For now the Chinese below is built from your two choices — it won't follow these words yet.)`; e.T.s3P = "用中文，说你自己的话。（现在下面的英语是按你的两个选择拼的，还不会跟着这些字变。）";
  z.T.demoLocked = "Demo sentence — later, AI will grow this from your own words."; e.T.demoLocked = "这里先用演示句：以后 AI 会跟着你的话长出来。";
  z.T.startLocked = `Built from your two choices (demo sentence). What you said in ${nat[1]} doesn't change it yet.`; e.T.startLocked = "这句是按你的两个选择拼出来的（演示句）；你刚才用中文说的话，现在还改不了它。";
  z.T.playYou = "▶ hear it (phone voice — recordings aren't kept yet)"; e.T.playYou = "▶ 听一遍（手机朗读，录音还没存下来）";
})();
/* 每个抽屉一句小注：写「有些人……」，不写「哪国人都这么说」 */
const NOTES = {
 d1:{zh:"有些人见面说「吃了吗？」，其实不是在问吃饭，是打招呼；也有人说 “You alright?”，也不是真在问你好不好。", en:"Some people say 吃了吗 (“eaten yet?”) as a hello — it isn't really about food. Some say “You alright?” and aren't really asking how you are."},
 d2:{zh:"有些人用「最近忙吗？」开个头，不用真回答忙不忙；也有人从天气聊起。", en:"Some people open with 最近忙吗 (“busy lately?”) — no real answer needed. Others start with the weather."},
 d4:{zh:"有些人送人时说「慢走」，不是让人走慢一点，是「路上小心」。", en:"Some people say 慢走 (“walk slowly”) as you leave — it means “take care”, not “slow down”."},
 d5:{zh:"有些人跟很熟的人不太说「谢谢」，觉得见外；也有人把 “cheers” 当谢谢用。", en:"Some people rarely say 谢谢 to close friends — it can feel too formal. Some use “cheers” to mean thanks."},
 d6:{zh:"有些人用「不好意思」借过、打扰别人，比「对不起」轻。", en:"Some people use 不好意思 to squeeze past or interrupt — lighter than 对不起."},
 d15:{zh:"有些人说「其实」不是要反驳，只是把真实的情况轻轻摆出来。", en:"When some people say 其实 (“actually”), they aren't arguing — just gently putting the real story down."},
 d20:{zh:"「一直以为」和 “I always thought…” 是同一种恍然大悟。", en:"一直以为 and “I always thought…” are the same moment of finding out."},
 d33:{zh:"有些人说「加油」（字面是 add oil），意思是 “you can do it”。", en:"Some people say 加油 (literally “add oil”) — it means “you can do it”."},
 d38:{zh:"有些人打字写「哈哈」，有些人写 “kkkk” 或 “jajaja”——笑的是同一件事。", en:"Some people type 哈哈, some “kkkk” or “jajaja” — same laugh."},
 d39:{zh:"有些人没听清会说「啊？」，听着有点急，其实只是想你再说一遍。", en:"Some people say 啊? when they missed it — it can sound abrupt, but it just means “say that again?”"}};
const LGN = {zh:["中文","Chinese"], en:["英语","English"], es:["西语","Spanish"], pt:["葡语","Portuguese"], ja:["日语","Japanese"], ko:["韩语","Korean"]};

/* ───────── 六个柜子、四十个抽屉（欧洲理事会《入门级》Threshold Level 1990 的六大类）───────── */
const CABS = [
 {id:"c1",i:"🤝",zh:"跟人打交道",en:"Getting along with people",common:[1,3,5,2]},
 {id:"c2",i:"💬",zh:"说说事、问问事",en:"Telling & asking",common:[13,14,10]},
 {id:"c3",i:"❤️",zh:"我的心情和看法",en:"How I feel & what I think",common:[22,16,18]},
 {id:"c4",i:"🙋",zh:"请人做事、帮人做事",en:"Asking for & giving a hand",common:[29,30,33]},
 {id:"c5",i:"🧵",zh:"把话说顺",en:"Making the talk flow",common:[35,36]},
 {id:"c6",i:"🔧",zh:"听不懂时救场",en:"When you get lost",common:[39,40]}
];
// [号, 柜子, 中文名, 英文名, 中文邀请, 英文邀请]
const DR40 = [
 [1,"c1","打招呼","Saying hi","你平时怎么打招呼？","How do you say hi?"],
 [2,"c1","寒暄、闲聊开个头","Small talk, getting a chat going","你怎么开始一段闲聊？","How do you get a little chat going?"],
 [3,"c1","介绍自己、介绍别人","Introducing yourself & others","你怎么介绍自己？","How do you introduce yourself?"],
 [4,"c1","道别","Saying bye","你怎么道别？","How do you say bye?"],
 [5,"c1","道谢、回应别人的谢","Thanks & you're welcome","你怎么说谢谢？","How do you say thanks?"],
 [6,"c1","道歉、回应别人的道歉","Sorry & that's OK","你怎么道歉？","How do you say sorry?"],
 [7,"c1","祝贺、祝福","Congrats & good wishes","你怎么祝贺别人？","How do you congratulate someone?"],
 [8,"c1","安慰、表示同情","Comforting someone","别人难过的时候，你怎么说？","What do you say when someone's down?"],
 [9,"c1","邀请、答应或推掉","Inviting, yes or no thanks","你怎么约人？","How do you invite someone?"],
 [10,"c2","说自己的事","Talking about me","你怎么说你自己的日子？","How do you talk about your days?"],
 [11,"c2","讲一段经历、讲个故事","Telling a story","你怎么讲一件发生过的事？","How do you tell something that happened?"],
 [12,"c2","描述一样东西、一个地方","Describing a thing or place","你怎么描述一个地方？","How do you describe a place?"],
 [13,"c2","问事情","Asking things","你想知道什么的时候，怎么问？","How do you ask when you want to know?"],
 [14,"c2","好奇别人的事（怎么问才不冒犯）","Curious about someone (asking nicely)","你想了解一个人，会问什么？","What do you ask to get to know someone?"],
 [15,"c2","纠正：「其实不是这样」","“Actually, it's not like that”","你怎么说「其实不是这样」？","How do you say “actually, no”?"],
 [16,"c3","开心、兴奋","Happy, excited","你开心的时候怎么说？","What do you say when you're happy?"],
 [17,"c3","难过、失望","Sad, let down","你难过的时候怎么说？","How do you say you're sad?"],
 [18,"c3","担心、害怕","Worried, scared","你担心的时候怎么说？","How do you say you're worried?"],
 [19,"c3","生气、不满、抱怨","Annoyed, complaining","你不满意的时候怎么说才不伤人？","How do you complain without a fight?"],
 [20,"c3","惊讶","Surprised","你吃惊的时候怎么说？","What do you say when you're surprised?"],
 [21,"c3","喜欢、不喜欢","Like, don't like","你怎么说喜欢什么？","How do you say what you like?"],
 [22,"c3","我觉得……（说看法）","I think…","你怎么说你的看法？","How do you say what you think?"],
 [23,"c3","同意、不同意","Agree, disagree","你怎么说「我也这么想」？","How do you say “same here”?"],
 [24,"c3","不确定、拿不准","Not sure","拿不准的时候，你怎么说？","What do you say when you're not sure?"],
 [25,"c3","想要、打算","Want, plan to","你怎么说你想做什么？","How do you say what you want to do?"],
 [26,"c3","希望、盼着","Hoping, looking forward","你盼着什么的时候怎么说？","How do you say you're looking forward to something?"],
 [27,"c3","后悔、可惜","Regret, what a shame","你觉得可惜的时候怎么说？","What do you say when it's a shame?"],
 [28,"c3","无所谓、都行","Either is fine","你怎么说「都行」？","How do you say “either's fine”?"],
 [29,"c4","请人帮忙","Asking for help","你怎么请人帮个忙？","How do you ask someone for a hand?"],
 [30,"c4","建议、出主意","Suggesting","你怎么给人出主意？","How do you suggest something?"],
 [31,"c4","主动帮忙","Offering help","你怎么说「我来帮你」？","How do you offer to help?"],
 [32,"c4","关心一下、提醒一下","Looking out, a heads-up","你怎么提醒别人？","How do you give someone a heads-up?"],
 [33,"c4","鼓励、打气","Cheering someone on","你怎么给人打气？","How do you cheer someone on?"],
 [34,"c4","拒绝，又不伤人","Saying no nicely","你怎么说「不」又不伤人？","How do you say no nicely?"],
 [35,"c5","想一想、拖一下","Buying a second to think","你想不起来的时候怎么拖一下？","How do you buy a second to think?"],
 [36,"c5","换个话题、接着刚才说","Changing topic, going back","你怎么接着刚才的话说？","How do you pick up where you left off?"],
 [37,"c5","举个例子、打个比方","Giving an example","你怎么举例子？","How do you give an example?"],
 [38,"c5","开玩笑、接梗","Joking around","你怎么开个小玩笑？","How do you joke around?"],
 [39,"c6","没听懂，请再说一遍、说慢一点","“Sorry, again? Slower?”","没听懂的时候，你怎么说？","What do you say when you didn't catch it?"],
 [40,"c6","不知道那个词，绕着说","Talking around a missing word","想不起一个词的时候，你怎么绕着说？","How do you talk around a word you don't know?"]
];
function drInfo(id){
  const cu = (S.custom || []).find(x => x.id === id);
  if (cu) return {id, cab: cu.cab, n: cu.n, q: TT().customQ, custom: 1};
  const r = DR40.find(x => "d" + x[0] === id); if (!r) return null;
  const zhUI = d_().ui === "zh";
  return {id, num: r[0], cab: r[1], n: zhUI ? r[2] : r[3], q: zhUI ? r[4] : r[5]};
}

/* ───────── 状态 ───────── */
let M = ZH() ? "en" : (LEARN() === "zh" ? "zh" : "en"), S;   // zh = 学中文（英文界面）；en = 学英语（中文界面）。西日阿界面先用英文那一份
const $ = id => SR.getElementById(id);
/* 来源的小链接（net:… / map:…）：不让浏览器跳走，交给 HVML.nav 打开那一页 */
SR.addEventListener("click", ev => { const a = ev.target.closest && ev.target.closest("a[href]"); if (!a) return; const h = a.getAttribute("href") || ""; if (/^(net|map|me):/.test(h)) { ev.preventDefault(); ev.stopPropagation(); HV.nav(h); } }, true);
const phone = $("phone"), scr = $("scr");
function fresh(){
  const d = D[M];
  const demoMine = JSON.parse(JSON.stringify(d.mine || {})); Object.values(demoMine).forEach(a => a.forEach(m => m.demo = 1));
  S = {
    phrases: d.phrases.map(p => ({...p, hidden: !!p.hidden, gone:false})),
    demoLines: d.lines.map(l => ({...l, demo: 1})), demoMine, lines: [], mine: {},
    grown: {}, custom: [], newDr: null, grewDemo: false, openDr: null, cabOpen: {},
    focus: null, first: true, seq: 0
  };
  sync();
}
const TLg = () => M === "zh" ? "zh" : "en";            // 在学的语言
const UIk = () => D[M].ui;                             // 界面语言
/* 你自己说的话里，用上了网上谁的说法：软件自己找，连上线 */
function detect(text){
  const low = String(text).toLowerCase();
  return S.phrases.filter(p => (p.mk || [p.t]).some(m => m && [...m].length >= 2 && low.includes(String(m).toLowerCase()))).map(p => p.id);
}
function userLines(){
  return HV.items(TLg()).map(it => ({id: "u_" + it.id, k: "you", at: it.where ? (it.where[UIk()] || it.where.en || "") : "", t: it.t, tr: "", uses: detect(it.t), user: 1, it}));
}
function sync(){
  S.lines = S.demoLines.concat(userLines());
  S.lines.forEach(l => l.uses.forEach(pid => { const p = P(pid); if (p && p.hidden && l.user) p.hidden = false; }));
  S.mine = JSON.parse(JSON.stringify(S.demoMine));
  HV.items(TLg()).forEach(it => (it.dr || []).forEach(n => (S.mine["d" + n] = S.mine["d" + n] || []).push({t: it.t, user: 1, id: it.id})));
}
const d_ = () => D[M];
const TT = () => D[M].T;
const P = id => S.phrases.find(p => p.id === id);
const used = p => S.lines.some(l => l.uses.includes(p.id));
const visible = () => S.phrases.filter(p => !p.hidden && !p.gone);
const person = id => d_().people[id];

/* ───────── 回应：声音、音符、提示、印章、彩纸 ───────── */
let AC;
function blip(f){
  try{
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine"; o.frequency.value = f || 880;
    g.gain.setValueAtTime(.0001, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.06, AC.currentTime + .01);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .14);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + .16);
  }catch(e){}
}
function note(ev){
  if (!ev || ev.clientX == null) return;
  const r = phone.getBoundingClientRect();
  const n = document.createElement("span"); n.className = "note"; n.textContent = "♪";
  n.style.left = (ev.clientX - r.left) + "px"; n.style.top = (ev.clientY - r.top - 10) + "px";
  phone.appendChild(n); setTimeout(() => n.remove(), 1000);
}
let tt;
function toast(t){ const e = $("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("on"), 2200); }
function stamp(a, b){ const e = $("stamp"); e.innerHTML = esc(a) + "<small>" + esc(b) + "</small>"; e.classList.remove("on"); void e.offsetWidth; e.classList.add("on"); blip(523); setTimeout(() => blip(784), 120); }
function confetti(n){
  const cs = ["#e2552f","#14305c","#ffc861","#2f7d70","#c0577a","#3a6fb8"];
  for (let i = 0; i < (n || 40); i++){
    const c = document.createElement("span"); c.className = "conf";
    c.style.left = (40 + Math.random() * 20) + "%"; c.style.top = "34%";
    c.style.background = cs[i % cs.length];
    c.style.setProperty("--dx", (Math.random() * 340 - 170) + "px");
    c.style.setProperty("--dy", (Math.random() * 420 + 60) + "px");
    c.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
    c.style.animationDelay = (Math.random() * .2) + "s";
    phone.appendChild(c); setTimeout(() => c.remove(), 2000);
  }
}
function say(text, lang, mine){
  try{
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[_…]+/g, " "));
    u.lang = lang || d_().tl; u.rate = mine ? .88 : .92; u.pitch = mine ? .85 : 1;
    speechSynthesis.speak(u);
  }catch(e){}
}
const rx = () => { const a = TT().rx; return a[Math.floor(Math.random() * a.length)]; };

/* ───────── 句子里给说法画线 ───────── */
function marks(line){
  const out = [];
  for (const pid of line.uses){
    const p = P(pid); if (!p) continue;
    const ms = (line.mk && line.mk[pid]) || p.mk || [p.t];
    for (const m of ms) out.push([m, pid]);
  }
  return out;
}
function markText(text, list){
  // list: [[substring, pid]]; 每个子串只画第一次出现，不重叠
  const spans = [];
  for (const [m, pid] of list){
    let from = 0, idx;
    while ((idx = text.indexOf(m, from)) >= 0){
      const end = idx + m.length;
      if (!spans.some(s => idx < s[1] && end > s[0])){ spans.push([idx, end, pid]); break; }
      from = idx + 1;
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  let o = "", last = 0;
  for (const [a, b, pid] of spans){ o += esc(text.slice(last, a)) + `<u class="ph" data-p="${pid}">${esc(text.slice(a, b))}</u>`; last = b; }
  return o + esc(text.slice(last));
}

/* ───────── 网的位置 ───────── */
const W = 400, H = 420, CX = 200, CY = 212;
function layout(){
  const d = d_(); const vis = visible();
  const ordered = [];
  for (const who of d.order) for (const p of vis) if (p.who === who) ordered.push(p);
  const N = ordered.length || 1;
  const pos = {};
  ordered.forEach((p, i) => {
    const a = (-90 + (i + .5) * 360 / N) * Math.PI / 180;
    const u = used(p);
    const r = (u ? 102 : 136) + (i % 2 ? 9 : -6);
    const label = p.short || p.t;
    const w = Math.min(120, measure(label) + 16);
    pos[p.id] = {x: CX + r * Math.cos(a), y: CY + r * Math.sin(a), w, h: 21, a, label, u};
  });
  // 松一松：标签不要叠在一起
  const ids = Object.keys(pos);
  for (let it = 0; it < 80; it++){
    let moved = false;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++){
      const A = pos[ids[i]], B = pos[ids[j]];
      const ox = (A.w + B.w) / 2 + 4 - Math.abs(A.x - B.x), oy = (A.h + B.h) / 2 + 3 - Math.abs(A.y - B.y);
      if (ox > 0 && oy > 0){
        moved = true;
        if (ox < oy){ const s = (A.x < B.x ? -1 : 1) * ox / 2; A.x += s; B.x -= s; }
        else { const s = (A.y < B.y ? -1 : 1) * oy / 2; A.y += s; B.y -= s; }
      }
    }
    for (const id of ids){ const q = pos[id]; q.x = Math.max(q.w / 2 + 4, Math.min(W - q.w / 2 - 4, q.x)); q.y = Math.max(16, Math.min(H - 16, q.y)); }
    if (!moved) break;
  }
  // 人：在 TA 的说法外面
  const ppos = {};
  for (const who of d.order){
    const mine = ordered.filter(p => p.who === who); if (!mine.length) continue;
    let sx = 0, sy = 0; mine.forEach(p => { sx += Math.cos(pos[p.id].a); sy += Math.sin(pos[p.id].a); });
    const a = Math.atan2(sy, sx), r = 182;
    ppos[who] = {x: Math.max(16, Math.min(W - 16, CX + r * Math.cos(a))), y: Math.max(16, Math.min(H - 16, CY + r * Math.sin(a)))};
  }
  // 你说过的话：中间一圈
  // 每一句放在它借来的说法那一边，线就不乱穿
  const L = S.lines, n = L.length, opos = {};
  const want = L.map(l => {
    let sx = 0, sy = 0; l.uses.forEach(pid => { const q = pos[pid]; if (q){ sx += Math.cos(q.a); sy += Math.sin(q.a); } });
    return {l, a: Math.atan2(sy, sx)};
  }).sort((u, v) => u.a - v.a);
  const step = 2 * Math.PI / Math.max(n, 1);
  let best = 0, bestCost = Infinity;
  for (let k = 0; k < 72; k++){
    const off = k * 2 * Math.PI / 72; let cost = 0;
    want.forEach((w, i) => { let dd = Math.abs(((off + i * step) - w.a + 3 * Math.PI) % (2 * Math.PI) - Math.PI); cost += dd * dd; });
    if (cost < bestCost){ bestCost = cost; best = off; }
  }
  want.forEach((w, i) => {
    const a = best + i * step, r = n > 8 ? (i % 2 ? 68 : 48) : 56;
    opos[w.l.id] = {x: CX + r * Math.cos(a), y: CY + r * Math.sin(a)};
  });
  // 你在外面说的话：外圈一个小签，连回说它的那一页 / 那条线
  const pins = {};
  L.filter(l => l.user && l.it.src && (l.it.src.page === "net" || l.it.src.page === "map")).forEach(l => {
    const o = opos[l.id], a = Math.atan2(o.y - CY, o.x - CX), lab = pinLabel(l.it);
    const w = Math.min(110, measure(lab) + 14);
    pins[l.id] = {x: Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, CX + 196 * Math.cos(a))), y: Math.max(14, Math.min(H - 14, CY + 190 * Math.sin(a))), w, lab, url: HV.url(l.it.src)};
  });
  return {pos, ppos, opos, pins};
}
function pinLabel(it){
  const src = it.src || {}, N = NET.nodes || {}, ui = UIk(), nm = n => n ? (ui === "zh" ? n.name.zh : n.name.en) : "";
  let s = "";
  if (src.node && N[src.node]) s = nm(N[src.node]);
  if (src.page === "map" && src.g) s = src.g[0] === "n" && N[src.g.slice(2)] ? nm(N[src.g.slice(2)]) : (ui === "zh" ? src.g.slice(2) : (src.gEn || src.g.slice(2)));
  if (src.line && src.page !== "map") { const l = (NET.lines || []).find(x => x.id === src.line); if (l && !src.node) s = nm(N[l.from]).replace(/（.*$|\s*\(.*$/, "") + "→" + nm(N[l.to]).replace(/（.*$|\s*\(.*$/, ""); }
  if (!s && src.node && src.node.startsWith("field:")) s = src.node.slice(6);
  s = (src.page === "map" ? "🗺️ " : "🕸️ ") + s.replace(/[《》]/g, "");
  return [...s].length > 14 ? [...s].slice(0, 13).join("") + "…" : s;
}
let _cv;
function measure(t){
  _cv = _cv || document.createElement("canvas").getContext("2d");
  _cv.font = '600 11px -apple-system,"PingFang SC",sans-serif';
  return _cv.measureText(t).width;
}

function drawNet(newIds){
  newIds = newIds || [];
  const d = d_(); const {pos, ppos, opos, pins} = layout();
  let edges = "", nodes = "";
  for (const p of visible()){
    const q = pos[p.id], pp = ppos[p.who]; if (!pp) continue;
    const col = d.circles[person(p.who).c].c;
    edges += `<line class="e" data-a="w:${p.who}" data-b="p:${p.id}" x1="${pp.x}" y1="${pp.y}" x2="${q.x}" y2="${q.y}" stroke="${col}" stroke-opacity=".45" stroke-width="1.2" ${used(p) ? "" : 'stroke-dasharray="3 3"'}/>`;
  }
  for (const l of S.lines){
    const o = opos[l.id];
    for (const pid of l.uses){
      const q = pos[pid]; if (!q) continue;
      const mx = (o.x + q.x) / 2 + (CX - (o.x + q.x) / 2) * .25, my = (o.y + q.y) / 2 + (CY - (o.y + q.y) / 2) * .25;
      edges += `<path class="e" data-a="o:${l.id}" data-b="p:${pid}" d="M${o.x},${o.y} Q${mx},${my} ${q.x},${q.y}" fill="none" stroke="#e2552f" stroke-opacity=".55" stroke-width="1.3"/>`;
    }
  }
  for (const id in pins){ const o = opos[id], q = pins[id];
    edges += `<line class="e" data-a="o:${id}" data-b="s:${id}" x1="${o.x}" y1="${o.y}" x2="${q.x}" y2="${q.y}" stroke="#14305c" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 3"/>`;
    nodes += `<g class="n pin" data-k="s:${id}" data-url="${esc(q.url)}"><rect x="${q.x - q.w / 2}" y="${q.y - 9}" width="${q.w}" height="18" rx="9"/><text x="${q.x}" y="${q.y + 3.5}" text-anchor="middle">${esc(q.lab)}</text></g>`; }
  // 中心
  nodes += `<g class="me"><circle cx="${CX}" cy="${CY}" r="19" fill="#fff" stroke="#e2552f" stroke-width="1.5" stroke-dasharray="2 2.5"/><text x="${CX}" y="${CY + 4.5}" text-anchor="middle">${esc(HV.items(TLg()).length ? (UIk() === "zh" ? "你" : "You") : d.me)}</text></g>`;
  // 说法
  for (const p of visible()){
    const q = pos[p.id], col = d.circles[person(p.who).c].c, u = used(p);
    nodes += `<g class="n tagn ${u ? "" : "unused"} ${newIds.includes("p:" + p.id) ? "pop" : ""}" data-k="p:${p.id}" style="transform-origin:${q.x}px ${q.y}px"><rect class="tg" x="${q.x - q.w / 2}" y="${q.y - q.h / 2}" width="${q.w}" height="${q.h}" rx="10.5" stroke="${u ? col : "#a5adbd"}"/><text x="${q.x}" y="${q.y + 4}" text-anchor="middle">${esc(q.label)}</text></g>`;
  }
  // 人
  for (const who in ppos){
    const q = ppos[who], col = d.circles[person(who).c].c;
    nodes += `<g class="n" data-k="w:${who}"><clipPath id="cp_${who}"><circle cx="${q.x}" cy="${q.y}" r="13"/></clipPath><circle cx="${q.x}" cy="${q.y}" r="15" fill="#fff" stroke="${col}" stroke-width="1.5"/><image href="${face(who)}" x="${q.x - 13}" y="${q.y - 13}" width="26" height="26" clip-path="url(#cp_${who})" preserveAspectRatio="xMidYMid slice"/></g>`;
  }
  // 你的话
  const icon = {answer:"💬",think:"🗣️",like:"❤️",coll:"📌",line:"🔗",fresh:"🌱",you:"★"};
  for (const l of S.lines){
    const o = opos[l.id];
    nodes += `<g class="n own ${l.user ? "you" : "demo"} ${newIds.includes("o:" + l.id) ? "pop fresh" : ""}" data-k="o:${l.id}" style="transform-origin:${o.x}px ${o.y}px"><circle cx="${o.x}" cy="${o.y}" r="13"/><text x="${o.x}" y="${o.y + 4}" text-anchor="middle">${l.user ? ({net:"🕸️", map:"🗺️", mylang:"🌱"}[l.it.page] || "★") : (icon[l.k] || "💬")}</text></g>`;
  }
  return `<svg class="net" id="net" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.title)}">${edges}${nodes}</svg>`;
}

function focusNet(keys){
  const svg = $("net"); if (!svg) return;
  svg.querySelectorAll(".hl").forEach(e => e.classList.remove("hl"));
  if (!keys){ svg.classList.remove("focus"); return; }
  svg.classList.add("focus");
  const K = new Set(keys);
  svg.querySelectorAll(".n").forEach(e => { if (K.has(e.dataset.k)) e.classList.add("hl"); });
  svg.querySelectorAll(".e").forEach(e => { if (K.has(e.dataset.a) && K.has(e.dataset.b)) e.classList.add("hl"); });
}
function keysForPhrase(pid){
  const p = P(pid); const k = ["p:" + pid, "w:" + p.who];
  S.lines.forEach(l => { if (l.uses.includes(pid)) k.push("o:" + l.id); });
  return k;
}
function keysForPerson(who){
  const k = ["w:" + who];
  visible().filter(p => p.who === who).forEach(p => { k.push("p:" + p.id); S.lines.forEach(l => { if (l.uses.includes(p.id)) k.push("o:" + l.id); }); });
  return k;
}
function keysForLine(lid){
  const l = S.lines.find(x => x.id === lid); const k = ["o:" + lid, "s:" + lid];
  l.uses.forEach(pid => { const p = P(pid); if (p){ k.push("p:" + pid, "w:" + p.who); } });
  return k;
}

/* ───────── 页面 ───────── */
function render(newIds){
  const d = d_(), T = TT();
  HOST.classList.toggle("zhui", d.ui === "zh");
  $("tBar").textContent = d.bar; $("tDemo").textContent = d.demo;
  // 只按用户自己的话算：你用上了谁的说法、谁跟你说过话
  const userL = S.lines.filter(l => l.user), usedU = p => userL.some(l => l.uses.includes(p.id));
  // 「还没变成你的」：只放回你的那几句里真的出现过的说法，算在说它的那个人名下
  const un = S.phrases.filter(p => !p.gone && heardBy(p.id) && !usedU(p));
  // 你的声音像谁
  const cnt = {}, pc = {};
  for (const p of S.phrases){ if (!usedU(p)) continue; const c = person(p.who).c; cnt[c] = (cnt[c] || 0) + 1; pc[p.who] = (pc[p.who] || 0) + userL.filter(l => l.uses.includes(p.id)).length; }
  const top = Object.keys(pc).sort((a, b) => pc[b] - pc[a] || d.order.indexOf(a) - d.order.indexOf(b));
  const nm = w => person(w).s;
  const blobs = Object.keys(cnt).map(c => {
    const C = d.circles[c], v = cnt[c], sz = v ? 44 + v * 9 : 40;
    const fs = S.phrases.filter(p => usedU(p) && person(p.who).c === c).map(p => p.who).filter((w, i, a) => a.indexOf(w) === i).slice(0, 3);
    return `<div class="blobw"><button class="blob ${v ? "" : "faint"}" data-hang="${c}" style="width:${sz}px;height:${sz}px;background:${C.c}"><span class="bi">${C.i}</span></button><div class="blobl">${esc(C.n)}${v ? "" : `<br><small style="font-weight:500;color:var(--soft)">${esc(T.listening)}</small>`}</div><div style="display:flex;margin-top:3px">${fs.map(w => `<img class="mini" src="${face(w)}" alt="">`).join("")}</div></div>`;
  }).join("");
  const hangBtns = Object.keys(cnt).slice(0, 3).map(c => `<button data-hang="${c}">${d.circles[c].i} ${esc(T.hang(d.circles[c].n))}</button>`).join("");

  const kinds = d.kinds;
  const said = S.lines.filter(l => !l.user).slice().reverse().map(l => {
    const fs = l.uses.map(pid => P(pid) && P(pid).who).filter((w, i, a) => w && a.indexOf(w) === i);
    return `<div class="s1 demo ${newIds && newIds.includes("o:" + l.id) ? "newin" : ""}" data-line="${l.id}">
      <div class="k">${esc(kinds[l.k] || "")} · ${esc(l.at)} <span class="dtag">${esc(T.demoTag)}</span> ${l.pend ? `<span class="pend">${esc(l.pend)}</span>` : ""}</div>
      <div class="tx">${markText(l.t, marks(l))}</div>
      <div class="tr">${esc(l.tr)}</div>
      <div class="row"><button class="play" data-play="${l.id}">${esc(T.playDemo)}</button><span style="font-size:11.5px;color:var(--soft)">${esc(T.from)}</span>${fs.map(w => `<img class="mini" src="${face(w)}" alt="${esc(person(w).nm)}" title="${esc(person(w).nm)}">`).join("")}</div>
    </div>`;
  }).join("");

  const mineL = S.lines.filter(l => l.user).slice().reverse();
  const youH = mineL.length ? mineL.map((l, i) => i < 2 || S.showAllYou ? youCard(l, newIds) : "").join("") + (mineL.length > 2 && !S.showAllYou ? `<button class="btn ghost" data-moreyou="1">${esc(T.moreYou(mineL.length - 2))}</button>` : "") : `<div class="myempty">${esc(T.myNone)}<div class="go"><button data-gonet="1">${esc(T.goNet)}</button><button data-gomap="1">${esc(T.goMap)}</button></div></div>`;
  const shelf = un.map(p => `<div class="lay" data-lay="${p.id}"><img src="${face(heardBy(p.id))}" alt=""><div class="lt"><b data-p="${p.id}">${esc(p.short || p.t)}</b><small>${esc(p.m)} · ${esc(T.heardIn(whoName(heardBy(p.id))))}</small></div><button class="use" data-use="${p.id}">${esc(T.useS)} →</button></div>`).join("");

  scr.innerHTML = `
   <div class="hd"><h1>${esc(T.youTitle)}</h1><p class="lead2">${esc(T.sorted)}</p><p>${esc(d.lead)}</p><div class="me"><i>${esc(T.youTag)}</i></div>${mineL.length ? `<p style="font-size:12px;color:var(--soft);margin:6px 0 0">${esc(T.demoNote)}</p>` : ""}</div>
   <div class="netcard"><span class="nethint">${esc(T.net)}</span>${drawNet(newIds)}
    <div class="legend"><span><i class="d"></i>${esc(T.lgOwn)}</span><span><i class="d demo"></i>${esc(T.lgDemo)}</span><span><i class="t"></i>${esc(T.lgUsed)}</span><span><i class="t u"></i>${esc(T.lgUn)}</span><span><i class="f"></i>${esc(T.lgWho)}</span></div></div>
   <div class="sec" id="youSec"><h3>${esc(T.myH)}</h3><p class="sub">${esc(T.myS)}</p><div class="said">${youH}</div></div>
   ${shapeSection()}
   ${soundSection()}
   ${Object.keys(cnt).length ? `<div class="sec"><h3>${esc(T.voiceH)}</h3><p class="sub">${esc(T.voiceS)}</p>
    <div class="voice"><div class="like">${top.length > 1 ? T.likeA(esc(nm(top[0])), esc(nm(top[1]))) : top.length ? T.likeOne(esc(nm(top[0]))) : ""}</div>
     <div class="blobs">${blobs}</div>
     <div class="mine">${esc(T.mine)}</div><div class="go">${hangBtns}</div></div></div>` : ""}
   ${uniSection()}
   <div class="sec" id="drSec"><h3>${esc(T.drH)}</h3><p class="sub">${esc(T.drS)}</p>${drawerHtml()}</div>
   ${un.length ? `<div class="sec"><h3>${esc(T.shelfH)}</h3><p class="sub">${esc(T.shelfS2)}</p><div class="shelf">${shelf}</div></div>` : ""}
   <div class="sec ${narrow() && !S.showLucas ? "lucas-shut" : ""}" id="lucasSec"><button class="lucasT" data-lucas="1"><h3>${esc(T.lucasH)} <span class="car">▾</span></h3></button><p class="sub">${esc(T.lucasS)}</p><div class="said">${said}</div></div>
   <div class="sec start"><h3>${esc(T.startH)}</h3><p>${esc(T.startP)}</p><button class="btn" id="startBtn">${esc(T.startB)}</button></div>
   <div class="sec mefoot"><button data-mego="again">🔁 <b>${esc(UT("今天再说一遍", "Say these again today"))}</b><small>${esc(UT("1、3、7 天前说过的，再说一遍", "What you said 1, 3 and 7 days ago"))}</small></button><button data-mego="walk">👣 <b>${esc(UT("你走过的路", "Where you've been"))}</b><small>${esc(UT("去过的岛、说过话的人、盖过的章", "Islands, people and stamps so far"))}</small></button><button data-mego="set">⚙️ <b>${esc(UT("设置、账号和记录", "Settings, account & records"))}</b><small>${esc(UT("界面语言、在学的语言、登录、提醒", "App language, learning language, sign-in, reminders"))}</small></button></div>`;
  const tbl = $("srcTbl"); if (tbl) tbl.innerHTML = "<tr><th>说法</th><th>谁说的</th><th>在网上哪儿</th></tr>" + S.phrases.map(p => `<tr><td><b>${esc(p.t)}</b></td><td>${esc(person(p.who).nm)}${p.also ? "、" + esc(p.also.nm) : ""}</td><td>${esc(p.where)}</td></tr>`).join("");
}

/* 你说过的一句：在哪儿说的（点了回去）、哪天、放进了哪个抽屉、谁回了你、用上了谁的说法 */
function srcHtml(it){
  const T = TT(), url = HV.url(it.src), w = it.where ? (it.where[UIk()] || it.where.en) : "";
  const when = HV.when(it.when, UIk()), via = it.via === "voice" ? T.viaVoice : T.viaTyped;
  return `${url ? `<a class="srcl" href="${esc(url)}">${esc(w)}</a>` : `<span class="srcn">${esc(w || T.here)}</span>`} · ${esc(when)} · ${esc(via)}`;
}
function drLine(it){ const T = TT(); return `<span class="drl">🗄️ ${esc(T.inDr)} ${(it.dr || []).map(n => (UIk() === "zh" ? "『" : "“") + esc(HV.drName(n, UIk())) + (UIk() === "zh" ? "』" : "”")).join(" ")}<button data-chdr="${it.id}">${esc(T.change)}</button></span>`; }
/* 一个说法，用户是从谁那儿听来的：回过你的那些话里真出现过，才算听过 */
function heardBy(pid){
  const p = P(pid); if (!p) return null;
  const ms = (p.mk || [p.t]).filter(m => m && [...m].length >= 2);
  const it = HV.items(TLg()).find(x => x.reply && x.reply.t && ms.some(m => x.reply.t.toLowerCase().includes(String(m).toLowerCase())));
  return it ? it.reply.by : null;
}
function whoName(w){ if (!w) return ""; if (person(w)) return person(w).nm; return personTag(w).split(" · ")[0]; }
function heardHtml(l){ const T = TT(); return l.uses.map(pid => { const p = P(pid); if (!p) return ""; const by = heardBy(pid);
  return `<span class="heardf" data-p="${pid}">🔗 ${esc(by ? T.heardFrom(p.short || p.t, whoName(by)) : T.alsoSays2(p.short || p.t, person(p.who).nm))}</span>`; }).join(""); }
function youCard(l, newIds){
  const T = TT(), it = l.it, P_ = NET.people || {};
  const rb = it.reply && P_[it.reply.by] ? (typeof P_[it.reply.by].nm === "string" ? P_[it.reply.by].nm : (UIk() === "zh" ? P_[it.reply.by].nm.zh : P_[it.reply.by].nm.en)) : "";
  return `<div class="s1 you ${newIds && newIds.includes("o:" + l.id) ? "newin" : ""}" data-line="${l.id}">
    <div class="k">${srcHtml(it)}</div>
    <div class="tx">${markText(l.t, marks(l))}</div>
    ${it.reply ? `<div class="tr">${esc(T.replyBy(rb))}${it.reply.away ? esc(T.awayTag) : ""}${UIk() === "zh" ? "：" : ": "}${esc(it.reply.t)}</div>` : ""}
    <div>${drLine(it)} ${heardHtml(l)}</div>
  </div>`;
}

/* ───────── 抽屉：六个柜子 ───────── */
const hasMine = id => (S.mine[id] || []).length > 0;
function shownIn(cab){
  const all = DR40.filter(r => r[1] === cab.id).map(r => "d" + r[0]);
  const filled = all.filter(id => hasMine(id) || S.grown[id]);
  const common = cab.common.map(n => "d" + n).filter(id => !filled.includes(id)).slice(0, 1);   // 空抽屉每个柜子最多露一个
  const shown = all.filter(id => filled.includes(id) || common.includes(id));
  return {shown, hidden: all.filter(id => !shown.includes(id)), filled};
}
const narrow = () => matchMedia("(max-width:600px)").matches;
function drawerHtml(){
  const d = d_(), T = TT(), zhUI = d.ui === "zh";
  const cabs = CABS.map(cab => {
    const {shown, hidden, filled} = shownIn(cab);
    const chips = shown.map(id => {
      const D = drInfo(id), m = S.mine[id] || [], full = m.length > 0;
      const slips = full ? `<span class="sl">${m.slice(0, 4).map(x => `<i style="${x.demo ? "background:#e9b4a3" : ""}"></i>`).join("")}</span>` : "";
      return `<button class="dw ${full ? "full" : "empty"} ${S.newDr === id ? "grow" : ""}" data-dw="${id}"><b>${esc(D.n)}</b>${slips}<span class="kn"></span></button>`;
    }).join("");
    const shut = narrow() && !S.cabOpen[cab.id];
    const dots = filled.map(id => `<i class="${(S.mine[id] || []).some(x => x.user) ? "" : "demo"}"></i>`).join("");
    return `<div class="cab ${shut ? "shut" : ""}" id="cab_${cab.id}"><button class="cabh tg" data-cab="${cab.id}"><span>${cab.i}</span>${esc(zhUI ? cab.zh : cab.en)}<span class="dots">${dots}</span><span class="car">▾</span></button>
      <div class="dws">${chips}</div>
      ${hidden.length ? `<div class="more">${esc(T.moreDr)}</div>` : ""}</div>`;
  }).join("");
  const g = d.grow;
  const demo = S.grewDemo ? "" : `<div class="growdemo"><b>${esc(T.drDemoH)}</b><div>${esc(T.drDemoP(g.word))}</div><button class="btn ghost" data-growdemo="1">${esc(T.drDemoB)}</button></div>`;
  return demo + cabs;
}
function redrawDrawer(){ const sec = $("drSec"); if (!sec) return; const T = TT(); sec.innerHTML = `<h3>${esc(T.drH)}</h3><p class="sub">${esc(T.drS)}</p>${drawerHtml()}`; }
function addMine(drId, item){
  if (!hasMine(drId) && !S.grown[drId] && drInfo(drId)){
    const cab = CABS.find(c => c.id === drInfo(drId).cab);
    if (!shownIn(cab).shown.includes(drId)) S.newDr = drId;   // 原来藏着的抽屉：长出来
  }
  S.grown[drId] = 1;
  (S.demoMine[drId] = S.demoMine[drId] || []).push(item);
  sync();
}
/* 网上的一句话在哪儿：找到那段公开聊，就能点回去 */
let MSGS = null;
function allMsgs(){
  if (MSGS) return MSGS;
  MSGS = [];
  (NET.threads || []).forEach(t => { MSGS.push({by: t.by, text: t.text, lg: t.lg, tr: t.tr, fn: t.fn, thread: t.id, on: t.on}); (t.replies || []).forEach(r => MSGS.push({by: r.by, text: r.text, lg: r.lg || t.lg, tr: r.tr, fn: r.fn, thread: t.id, on: t.on})); });
  return MSGS;
}
/* ───────── 抽屉里的词：常用搭配 · 这个抽屉的词 · 全世界都有的词 ───────── */
const DW = NET.drawer_words || {drawers: {}, universal: [], split: []};
const LCOL = ["zh", "en", "es", "pt", "ja"];
const LNAME = {zh: ["中文", "Chinese"], en: ["英语", "English"], es: ["西语", "Spanish"], pt: ["葡语", "Portuguese"], ja: ["日语", "Japanese"]};
const isPhrase = w => [...(w.zh || "")].length >= 3 || /…/.test(w.zh || "");
/* 词的小注：英文界面用 note_en（内容编辑补上之前先用中文的） */
const wNote = w => TLg() === "en" ? "" : UIk() === "zh" ? (w.note || "") : (w.note_en || w.note || "");   // 词的小注讲的是中文怎么用：学英语的人不看
/* 学英语的人：一个格子里写了几个说法（"amazing, impressive"）就用第一个；音标先看声音网，没有就用英文小工具算的 */
const en1 = s => String(s || "").split(/\s*[,，/;；]\s*/)[0].trim();
/* 英文小工具算的是美式（带 r）：换成英式，跟声音网一样（important /ɪmˈpɔːtənt/、fairly /ˈfeəli/） */
const V_ = "aeiouæɑɒɔəɛɪʊʌɜ", noV = "(?![" + V_ + "ː])";
const brit = s => String(s || "").replace(new RegExp("ɜːr" + noV, "g"), "ɜː").replace(new RegExp("aɪə?r" + noV, "g"), "aɪə").replace(new RegExp("aʊə?r" + noV, "g"), "aʊə").replace(new RegExp("ɔːr" + noV, "g"), "ɔː").replace(new RegExp("ɑːr" + noV, "g"), "ɑː")
  .replace(new RegExp("[eɛ]r" + noV, "g"), "eə").replace(new RegExp("ɪr" + noV, "g"), "ɪə").replace(new RegExp("iːr" + noV, "g"), "ɪə").replace(new RegExp("ʊr" + noV, "g"), "ʊə").replace(new RegExp("ər" + noV, "g"), "ə").replace(/oʊ/g, "əʊ").replace(/ɛ/g, "e");
/* 美式的 ɑ 在英式里看拼法：aw / au → ɔː（awesome），有 o 没有 ar、al → ɒ（probably）；词尾带次重音的 iː → i */
const britW = (w, ip) => { let x = brit(ip); const lw = String(w).toLowerCase();
  if (/aw|au|ough/.test(lw)) x = x.replace(/ɑː/g, "ɔː"); else if (/o/.test(lw) && !/ar|al/.test(lw)) x = x.replace(/ɑː/g, "ɒ");
  return x.replace(/ˌ([^ˈˌ]*)iː$/, "$1i").replace(/ˌ(?=[^ˈ]*ˈ)/g, ""); };   // 主重音前面的次重音不写（important /ɪmˈpɔːtənt/）
const ipaOf = w => { const p = PRON.en && PRON.en[String(w).toLowerCase()]; if (p && p.ipa) return p.ipa; try { return britW(w, (window.ENT && window.ENT.ipa && window.ENT.ipa(String(w).toLowerCase())) || ""); } catch (e) { return ""; } };
function wordRow(w, key, all){
  const tl = TLg(), ui = UIk(), big = tl === "zh" ? w.zh : en1(w.en), py = tl === "zh" ? (w.py || "") : (ipaOf(big) ? "/" + ipaOf(big) + "/" : ""), mean = tl === "zh" ? w.en : w.zh;
  const others = all ? LCOL.filter(l => l !== tl && l !== ui && w[l]).map(l => `<span class="wl"><i>${esc(LNAME[l][ui === "zh" ? 0 : 1])}</i>${esc(w[l])}</span>`).join("") : "";
  return `<div class="wrow ${w.note ? "hasn" : ""} ${all ? "u" : ""}" data-card="${cardKey({w: big, obj: w})}"><div class="wmain">${all ? `<span class="ub" title="${esc(TT().wUni)}">🌍</span>` : ""}<b>${esc(big)}</b>${py ? `<span class="wpy">${esc(py)}</span>` : ""}<span class="wmean">${esc(mean)}</span>${wNote(w) ? `<span class="wi">ⓘ</span>` : ""}<button class="play" data-say="${esc(big)}">▶</button></div>
    ${others ? `<div class="wother">${others}</div>` : ""}${wNote(w) ? `<div class="wnote">${esc(wNote(w))}</div>` : ""}</div>`;
}
function wordsHtml(n){
  const T = TT(), seenEn = new Set(), once = w => { if (TLg() !== "en") return true; const k = en1(w.en).toLowerCase(); if (!k || seenEn.has(k)) return false; seenEn.add(k); return true; };
  const ws = (DW.drawers[String(n)] || []).filter(once), uni = (DW.universal || []).filter(w => (w.fn || []).includes(n)).filter(once);
  const ph = ws.filter(isPhrase), wd = ws.filter(w => !isPhrase(w));
  let h = "";
  if (ph.length) h += `<div class="lab2">${esc(T.wPhr)}</div><div class="wlist">${ph.map((w, i) => wordRow(w, "p" + n + ":" + i)).join("")}</div>`;
  // 全世界都有的词（语义基元、基本词表、日历、数字）按 fn 也放进这个抽屉自己的词里，旁边一个 🌍，几种语言并排
  if (wd.length || uni.length) h += `<div class="lab2">${esc(T.wWords)}</div><div class="wlist">${wd.map((w, i) => wordRow(w, "w" + n + ":" + i)).join("")}${uni.map((w, i) => wordRow(w, "u" + n + ":" + i, 1)).join("")}</div>${uni.length ? `<div class="sub2" style="font-size:11.5px;color:var(--soft);margin-top:4px">${esc(T.uniS2)}</div>` : ""}`;
  return h;
}
function uniSection(){
  const T = TT(), U = DW.universal || []; if (!U.length) return "";
  const tl = TLg();
  return `<div class="sec" id="uniSec"><h3>🌍 ${esc(T.uniH)}</h3><p class="sub">${esc(T.uniS)}</p>
    <div class="unichips">${U.map((w, i) => `<button class="uc" data-uw="${i}">${esc(tl === "zh" ? w.zh : en1(w.en))}</button>`).join("")}</div>
    ${(DW.split || []).length ? `<div class="split"><b>${esc(T.splitH)}</b>${DW.split.map(x => `<div class="sp"><span>${esc(UIk() === "zh" ? x.zh : (x.en || x.zh))}</span><small>${esc(UIk() === "zh" ? x.why : (x.why_en || x.why))}</small></div>`).join("")}</div>` : ""}</div>`;
}
function uniSheet(i){
  const T = TT(), w = DW.universal[i]; if (!w) return;
  return wordCard(cardKey({w: TLg() === "zh" ? w.zh : en1(w.en), obj: w}));
  openSheet(`<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">🌍 ${esc(T.uniH)}</div>
    <div class="uni" style="margin-top:6px">${wordRow(w, "x" + i, 1).replace('class="wrow', 'class="wrow open')}</div>
    ${(w.fn || []).length ? `<div class="lab2">${esc(T.inDrawers)}</div><div class="chips">${w.fn.map(n => `<button class="chip" data-dw="d${n}">${esc(HV.drName(n, UIk()))}</button>`).join("")}</div>` : ""}`);
}

/* ───────── 一个词三张网：🗂️ 意思 · 🌱 字形 · 🔊 声音（声音网的位置先留着） ───────── */
const RT = NET.roots || {zh: {}, en: {}, links: {zh: {}, en: {}}};
const idShow = id => String(id).replace(/\s*\(.*\)\s*$/, "");          // 「-er (更)」显示成 -er
const RAD = {}; (RT.zh.radicals || []).forEach(r => { RAD[r.rad] = r; (r.variants || []).forEach(v => { if (!RAD[v]) RAD[v] = r; }); });
const PHON = {}; (RT.zh.phonetic || []).forEach(p => PHON[p.phon] = p);
const ENR = {}; ["roots", "prefixes", "suffixes"].forEach(k => (RT.en[k] || []).forEach(x => ENR[x.id] = {...x, kind: k}));
/* 字 → {c, rad, phon, unsure, py, en}：先看抽屉词的连法，再看部首、声旁的例字 */
const CH = {};
Object.values((RT.links || {}).zh || {}).forEach(cs => cs.forEach(c => { if (!CH[c.c]) { const {note, note_en, ...rest} = c; CH[c.c] = rest; } }));   // 字在某个词里的意思（note）只在打开那个词时显示
(RT.zh.radicals || []).forEach(r => (r.examples || []).forEach(e => { const o = CH[e.c] || (CH[e.c] = {c: e.c, rad: r.rad}); o.py = o.py || e.py; o.en = o.en || e.en; }));
(RT.zh.phonetic || []).forEach(p => (p.chars || []).forEach(e => { const o = CH[e.c] || (CH[e.c] = {c: e.c}); o.phon = o.phon || p.phon; o.py = o.py || e.py; o.en = o.en || e.en; }));
/* 英文词 → 用到的词根 / 前缀 / 后缀 */
const ENW = {};
/* 一个键里写了几个词（"amazing, impressive"）时，按拼法把词根分给真带着它的那个词：前缀看开头、后缀看结尾、词根看中间 */
const partFits = (id, w) => { const E = ENR[id]; if (!E) return false; const fs = (E.forms && E.forms.length ? E.forms : idShow(id).split(/\s*,\s*/)).map(f => f.replace(/-/g, "").toLowerCase()).filter(Boolean);
  return E.kind === "prefixes" ? fs.some(f => w.startsWith(f)) : E.kind === "suffixes" ? fs.some(f => w.endsWith(f) || w.endsWith(f.replace(/e$/, ""))) : fs.some(f => w.includes(f)); };
Object.entries((RT.links || {}).en || {}).forEach(([k, v]) => { const ws = k.split(/\s*,\s*/).map(w => w.toLowerCase());
  ws.forEach(w => { const pw = v.per_word && (v.per_word[w] || v.per_word[Object.keys(v.per_word).find(k => k.toLowerCase() === w)]);
    ENW[w] = {...v, parts: pw ? pw : v.per_word ? [] : ws.length > 1 ? (v.parts || []).filter(id => partFits(id, w)) : (v.parts || [])}; }); });   // 合写的键：内容编辑写了 per_word 就照它分
Object.values(ENR).forEach(x => (x.examples || []).forEach(e => { const w = e.w.toLowerCase(); if (!ENW[w]) ENW[w] = {parts: [x.id], ex: e}; else if (!ENW[w].parts.includes(x.id)) ENW[w].parts.push(x.id); }));
const FROMZH = {"Latin / Greek": "拉丁语、希腊语", "Old English / Latin": "古英语、拉丁语", "modern (from electronic)": "现代（从 electronic 来）", "Latin": "拉丁语", "Greek": "希腊语", "Old English": "古英语", "French": "法语", "Old French": "古法语", "Old Norse": "古诺斯语", "Germanic": "日耳曼语", "Latin/Greek": "拉丁语、希腊语", "Greek/Latin": "希腊语、拉丁语", "Italian": "意大利语", "Dutch": "荷兰语", "Arabic": "阿拉伯语"};
const isZh = s => /[一-鿿]/.test(s);
const radLook = r => r.look || r.rad;
/* 一个词里的根：中文按字，英文按整个词 */
function rootsOf(word){
  if (isZh(word)) { const lw = ((RT.links || {}).zh || {})[word]; return [...word].filter(isZh).map(c => ({c, ...(CH[c] || {}), ...((lw || []).find(x => x.c === c) || {})})); }
  const v = ENW[String(word).toLowerCase().trim()]; return v ? (v.parts || []).filter(id => ENR[id]).map(id => ({part: id})) : [];
}
/* 所有用户说过的词（只算用户自己的话，软件整理，不用收） */
function myWords(){
  const out = [];
  HV.items(TLg()).forEach(it => {
    if (TLg() === "zh") [...it.t].filter(isZh).forEach(c => out.push({w: c, it}));
    else (it.t.match(/[A-Za-z'-]+/g) || []).forEach(w => out.push({w: w.toLowerCase(), it}));
  });
  return out;
}
/* 所有抽屉里的词（去重只为画网，不改抽屉本身） */
function allDrawerWords(){
  const seen = new Set(), out = [];
  Object.values(DW.drawers || {}).flat().concat(DW.universal || []).forEach(w => { const k = (w.zh || "") + "|" + (w.en || ""); if (!seen.has(k)) { seen.add(k); out.push(w); } });
  return out;
}
const WK = {};   // 卡片上点得开的词：key → {w, py, mean, note, others}
function cardKey(w){ const k = "k" + Object.keys(WK).length; WK[k] = w; return k; }
/* 用户的句子切成词：先拿抽屉词表做最长匹配，匹配不上的才按单字（中文）；英文按词 */
function segment(t){
  if (TLg() !== "zh") return (t.match(/[A-Za-z][A-Za-z'-]*/g) || []).map(w => w.toLowerCase());
  const dict = new Set(allDrawerWords().map(x => x.zh).filter(x => x && [...x].length > 1 && !/…/.test(x))), cs = [...t], out = []; let i = 0;
  while (i < cs.length) { if (!isZh(cs[i])) { i++; continue; } let L = 0; for (let k = Math.min(6, cs.length - i); k > 1; k--) if (dict.has(cs.slice(i, i + k).join(""))) { L = k; break; } out.push(cs.slice(i, i + (L || 1)).join("")); i += L || 1; }
  return out;
}
const myPieces = () => { const set = new Set(); HV.items(TLg()).forEach(it => segment(it.t).forEach(w => set.add(w))); return [...set]; };
function tapText(t){
  // 你自己的句子里，每个字（中文）或每个词（英文）都点得开
  if (TLg() === "zh") {   // 先拿抽屉词表做最长匹配，匹配不上的才按单字
    const dict = new Set(allDrawerWords().map(x => x.zh).filter(x => x && [...x].length > 1 && !/…/.test(x))), cs = [...t]; let out = "", i = 0;
    while (i < cs.length) { if (!isZh(cs[i])) { out += esc(cs[i]); i++; continue; }
      let L = 0; for (let k = Math.min(6, cs.length - i); k > 1; k--) if (dict.has(cs.slice(i, i + k).join(""))) { L = k; break; }
      const piece = cs.slice(i, i + (L || 1)).join(""); out += `<span class="tc" data-card="${cardKey({w: piece})}">${esc(piece)}</span>`; i += L || 1; }
    return out;
  }
  return esc(t).replace(/[A-Za-z][A-Za-z'-]*/g, w => `<span class="tc" data-card="${cardKey({w})}">${w}</span>`);
}
function rootChip(r){
  const T = TT(), ui = UIk();
  if (r.part) { const E = ENR[r.part]; return `<button class="rchip en" data-rn="e:${esc(r.part)}"><b>${esc(idShow(r.part))}</b><small>${esc(ui === "zh" ? E.zh : E.en)}</small></button>`; }
  let h = "";
  const R = RAD[r.rad];
  if (R) h += `<button class="rchip ${R.meaningful ? "" : "dim"}" data-rn="r:${esc(R.rad)}"><span class="rc">${esc(r.c)}</span><b>${esc(radLook(R))}</b><small>${esc((ui === "zh" ? r.note : r.note_en) || (r.unsure ? T.rPart : (R.meaningful ? (ui === "zh" ? R.zh : R.en) : T.rDict)))}</small></button>`;
  const P = r.phon && PHON[r.phon];
  if (P) h += `<button class="rchip ph ${P.match}" data-rn="p:${esc(P.phon)}"><span class="rc">${esc(r.c)}</span><b>${esc(P.phon)}</b><small>${esc(P.match === "drifted" ? T.pDrift : T.pSound(P.py))}</small></button>`;
  if (!h) h = `<span class="rchip none"><span class="rc">${esc(r.c)}</span><small>${esc(T.rNone)}</small></span>`;
  const cn = ui === "zh" ? r.note : (r.note_en || "");
  return cn && !R ? `<span class="rgrp">${h}<span class="rnote">${esc(cn)}</span></span>` : h;   // 有部首那一格，说明已经写在格子里了
}
function wordCard(key, back){
  const T = TT(), ui = UIk(), tl = TLg(), o = WK[key]; if (!o) return;
  const w = o.w, info = isZh(w) && [...w].length === 1 ? CH[w] || {} : {};
  const dw = o.obj || allDrawerWords().find(x => tl === "zh" ? x.zh === w : String(x.en || "").toLowerCase().split(/\s*,\s*/).includes(w.toLowerCase()));
  const py = tl === "zh" ? ((dw && dw.zh === w && dw.py) || info.py || "") : "", mean = dw ? (tl === "zh" ? dw.en : dw.zh) : (tl === "zh" ? info.en || "" : "");
  const note = dw ? wNote(dw) : "";
  const drs = []; Object.entries(DW.drawers || {}).forEach(([n, ws]) => { if (ws.some(x => (tl === "zh" ? x.zh : x.en) === (dw ? (tl === "zh" ? dw.zh : dw.en) : w)) && !drs.includes(+n)) drs.push(+n); });
  (DW.universal || []).forEach(x => { if ((tl === "zh" ? x.zh : x.en) === (dw ? (tl === "zh" ? dw.zh : dw.en) : w)) (x.fn || []).forEach(n => { if (!drs.includes(n)) drs.push(n); }); });
  const rs = rootsOf(w);
  const others = dw ? LCOL.filter(l => l !== tl && l !== ui && dw[l]).map(l => `<span class="wl"><i>${esc(LNAME[l][ui === "zh" ? 0 : 1])}</i>${esc(dw[l])}</span>`).join("") : "";
  openSheet(`${back ? `<button class="bk" data-back="${esc(back)}">‹ ${esc(T.back)}</button>` : ""}
    ${tl === "zh" ? (pronHtml(w, py) || `<div class="big">${esc(w)}</div>`) : `<div class="big en">${esc(w)}</div>${pronHtml(w)}`}${mean ? `<div class="mean">${esc(mean)}</div>` : ""}
    <button class="play" style="margin-top:6px" data-sayw="${esc(w)}">${esc(T.hear)}</button>
    ${note ? `<div class="wnote" style="display:block">${esc(note)}</div>` : ""}${others ? `<div class="wother" style="margin-top:6px">${others}</div>` : ""}
    <div class="w3"><div class="w3h">🗂️ ${esc(T.netMean)}</div>${drs.length ? `<div class="chips">${drs.map(n => `<button class="chip" data-dw="d${n}">${esc(HV.drName(n, ui))}</button>`).join("")}</div>` : withChar(w)}</div>
    <div class="w3"><div class="w3h">🌱 ${esc(T.netShape)}</div>${rs.length ? `<div class="rchips">${rs.map(rootChip).join("")}</div><div class="w3n">${esc(T.netShapeTip)}</div>` : `<div class="w3n">${esc(tl === "zh" ? T.rNone : T.eNone)}</div>`}</div>
    <div class="w3 snd"><div class="w3h">🔊 ${esc(T.netSound)}</div>${soundRow(w) || `<div class="w3n">${esc(T.sNone)}</div>`}</div>`);
  S.lastCard = key;
}
/* 单个字、或不在抽屉里的词：列出带着它的抽屉词，点了打开那个抽屉 */
function withChar(w){
  const T = TT(), tl = TLg(), hits = [];
  const fits = k => k && k !== w && (tl === "zh" ? k.includes(w) : new RegExp("\\b" + w.replace(/[^a-z']/gi, "") + "\\b", "i").test(k));
  Object.entries(DW.drawers || {}).forEach(([n, ws]) => ws.forEach(x => { const k = tl === "zh" ? x.zh : x.en; if (fits(k) && !hits.some(h => h.k === k && h.n === +n)) hits.push({k, n: +n}); }));
  (DW.universal || []).forEach(x => { const k = tl === "zh" ? x.zh : x.en; if (fits(k)) (x.fn || []).forEach(n => { if (!hits.some(h => h.k === k && h.n === n)) hits.push({k, n}); }); });   // 全世界都有的词按 fn 列出抽屉
  return hits.length ? `<div class="w3n" style="margin:0 0 4px">${esc(T.withChar(w))}</div><div class="chips">${hits.slice(0, 10).map(h => `<button class="chip" data-dw="d${h.n}">${esc(h.k)} <small>${esc(HV.drName(h.n, UIk()))}</small></button>`).join("")}</div>` : `<div class="w3n">${esc(T.noChar(w))}</div>`;
}
/* 点进一个根：它是一个点，连到同一个根的词——你说过的排前面、亮起来，其次是抽屉里的词，再其次是例字 */
function rootSheet(rn, back){
  const T = TT(), ui = UIk(), tl = TLg(), [kind, id] = [rn[0], rn.slice(2)];
  let head = "", sentence = "", members = []; const other = [];
  const mine = myWords(), dws = allDrawerWords();
  const add = (w, lvl, obj) => { if (!members.some(m => m.w === w)) members.push({w, lvl, obj}); };
  if (kind === "r") {
    const R = RAD[id]; if (!R) return;
    const has = c => CH[c] && !CH[c].unsure && RAD[CH[c].rad] === R;
    mine.filter(x => has(x.w)).forEach(x => add(x.w, 0));
    // 这个字在某个词里是别的意思（links.zh 写了 note，比如 里面 的 面 =「边」）：不连进「多半跟…有关」，另放一行
    const sense = (word, c) => { const lw = ((RT.links || {}).zh || {})[word]; const e = lw && lw.find(x => x.c === c); return e && (ui === "zh" ? e.note : (e.note_en || e.note)); };
    dws.filter(x => x.zh && [...x.zh].some(has)).forEach(x => { const c = [...x.zh].find(has), nt = sense(x.zh, c); if (nt) { if (!other.some(o => o.w === x.zh)) other.push({w: x.zh, nt, obj: x}); } else add(x.zh, 1, x); });
    (R.examples || []).forEach(e => add(e.c, 2, {zh: e.c, py: e.py, en: e.en}));
    head = `<div class="rbig">${esc(radLook(R))}${R.variants && R.variants.length ? `<small>${esc([R.rad, ...R.variants].filter(v => v !== radLook(R)).join(" "))}</small>` : ""}</div><div class="mean">${esc(ui === "zh" ? R.name + " · " + R.zh : R.en)}</div>${(ui === "zh" ? R.note : R.note_en) ? `<div class="wnote" style="display:block">${esc(ui === "zh" ? R.note : R.note_en)}</div>` : ""}`;
    sentence = R.meaningful ? T.rLine(radLook(R), ui === "zh" ? R.zh : R.en) : T.rLineDict(radLook(R));
  } else if (kind === "p") {
    const P = PHON[id]; if (!P) return;
    const cs = new Set((P.chars || []).map(x => x.c)), has = c => cs.has(c) || (CH[c] && CH[c].phon === P.phon);
    mine.filter(x => has(x.w)).forEach(x => add(x.w, 0));
    dws.filter(x => x.zh && [...x.zh].some(has)).forEach(x => add(x.zh, 1, x));
    (P.chars || []).forEach(e => add(e.c, 2, {zh: e.c, py: e.py, en: e.en}));
    head = `<div class="rbig">${esc(P.phon)}<small>${esc(P.py)}</small></div>${(ui === "zh" ? P.note : P.note_en) ? `<div class="wnote" style="display:block">${esc(ui === "zh" ? P.note : P.note_en)}</div>` : ""}${SL["zh.comp." + P.phon] ? `<button class="chip" data-sn="zh.comp.${esc(P.phon)}">🔊 ${esc(T.toSound)}</button>` : ""}`;
    sentence = P.match === "drifted" ? T.pLineDrift : T.pLine(P.py);
  } else {
    const E = ENR[id]; if (!E) return;
    const has = w => (ENW[w] || {parts: []}).parts.includes(id);
    mine.filter(x => has(x.w)).forEach(x => add(x.w, 0));
    dws.filter(x => x.en && x.en.split(/\s*,\s*/).some(w => has(w.toLowerCase()))).forEach(x => add(x.en.split(/\s*,\s*/).find(w => has(w.toLowerCase())), 1, x));
    (E.examples || []).forEach(e => add(e.w, 2, {en: e.w, zh: e.zh}));
    head = `<div class="rbig en">${esc(idShow(E.id))}</div><div class="mean">${esc(ui === "zh" ? E.zh : E.en)}${E.from ? ` · ${esc(ui === "zh" ? "来自" + (FROMZH[E.from] || E.from) : "from " + E.from)}` : ""}${E.makes ? ` · ${esc(ui === "zh" ? "变成" + E.makes : "makes a " + ({"名词": "noun", "形容词": "adjective", "副词": "adverb", "动词": "verb"}[E.makes] || E.makes))}` : ""}</div>`;
    sentence = T.eLine(idShow(E.id), ui === "zh" ? E.zh : E.en);
  }
  members = members.slice(0, 16);
  const keys = members.map(m => cardKey({w: m.w, obj: m.obj}));
  // 小网：中间是这个根，外面一圈是词
  const W = 320, H = 230, cx = W / 2, cy = H / 2, n = members.length;
  const pos = members.map((m, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(n, 1), r = 84 + (i % 2) * 12; return [cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * .95]; });
  const svg = `<svg class="rnet" viewBox="0 0 ${W} ${H}">${pos.map(p => `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" class="rl"/>`).join("")}
    <circle cx="${cx}" cy="${cy}" r="22" class="rcen"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" class="rct ${kind === "e" ? "en" : ""}">${esc(kind === "r" ? radLook(RAD[id]) : kind === "p" ? id : idShow(id))}</text>
    ${members.map((m, i) => { const [x, y] = pos[i], tw = Math.max(26, [...m.w].length * (kind === "e" ? 7.5 : 15) + 14); return `<g class="rw l${m.lvl}" data-card="${keys[i]}" data-from="${esc("rn:" + rn)}"><rect x="${x - tw / 2}" y="${y - 12}" width="${tw}" height="24" rx="12"/><text x="${x}" y="${y + 5}" text-anchor="middle">${esc(m.w)}</text></g>`; }).join("")}</svg>`;
  const lab = [T.rMine, T.rDrawer, T.rEx];
  openSheet(`${back ? `<button class="bk" data-back="${esc(back)}">‹ ${esc(T.back)}</button>` : ""}<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">🌱 ${esc(T.netShape)}</div>
    ${head}<div class="rsent">${esc(sentence)}</div>${svg}
    <div class="rleg"><span><i class="l0"></i>${esc(lab[0])}</span><span><i class="l1"></i>${esc(lab[1])}</span><span><i class="l2"></i>${esc(lab[2])}</span></div>
    ${other.length ? `<div class="lab2">${esc(T.otherSense)}</div><div class="w3n" style="margin:-2px 0 5px">${esc(other[0].nt)}</div><div class="chips">${other.map(o => `<button class="chip" data-card="${cardKey({w: o.w, obj: o.obj})}" data-from="${esc("rn:" + rn)}">${esc(o.w)}</button>`).join("")}</div>` : ""}
    ${[0, 1, 2].map(l => { const ms = members.map((m, i) => ({m, k: keys[i]})).filter(x => x.m.lvl === l); return ms.length ? `<div class="lab2">${esc(lab[l])}</div><div class="chips">${ms.map(x => `<button class="chip ${l === 0 ? "on" : ""}" data-card="${x.k}" data-from="${esc("rn:" + rn)}">${esc(x.m.w)}</button>`).join("")}</div>` : ""; }).join("")}`);
}
/* 《你的语言》里的「🌱 字形」：只亮你自己的话里出现过的根 */
function shapeSection(){
  const T = TT(), ui = UIk(), mine = myWords(); if (!mine.length) return "";
  const found = new Map();
  mine.forEach(x => rootsOf(x.w).forEach(r => {
    if (r.part) { const k = "e:" + r.part; found.set(k, (found.get(k) || new Set()).add(x.w)); return; }
    if (r.rad && RAD[r.rad] && !r.unsure && RAD[r.rad].meaningful) { const k = "r:" + RAD[r.rad].rad; found.set(k, (found.get(k) || new Set()).add(x.w)); }
    if (r.phon && PHON[r.phon]) { const k = "p:" + r.phon; found.set(k, (found.get(k) || new Set()).add(x.w)); }
  }));
  if (!found.size) return "";
  const chip = (k, ws) => { const id = k.slice(2), lab = k[0] === "r" ? radLook(RAD[id]) : k[0] === "p" ? id : idShow(id);
    const sub = k[0] === "r" ? (ui === "zh" ? RAD[id].zh : RAD[id].en) : k[0] === "p" ? (PHON[id].match === "drifted" ? T.pDrift : T.pSound(PHON[id].py)) : (ui === "zh" ? ENR[id].zh : ENR[id].en);
    return `<button class="shp ${k[0]}" data-rn="${esc(k)}"><b class="${k[0] === "e" ? "en" : ""}">${esc(lab)}</b><small>${esc(sub)}</small><span class="sw">${[...ws].slice(0, 4).map(esc).join(" ")}</span></button>`; };
  return `<div class="sec" id="shapeSec"><h3>🌱 ${esc(T.shapeH)}</h3><p class="sub">${esc(T.shapeS)}</p><div class="shps">${[...found.entries()].map(([k, ws]) => chip(k, ws)).join("")}</div></div>`;
}

/* ───────── 🔊 声音网：读音一样或很像（share）· 只差一点（pair） ───────── */
const SN = NET.sound || {zh: {}, en: {}, links: [], by_word: {}};
const SL = {}; (SN.links || []).forEach(l => SL[l.id] = l);
/* 字 / 词 → 读音（中文拼音、英文 IPA），从声音网的例字和线上的词收起来 */
const PRON = {zh: {}, en: {}};
const eatW = (lg, x) => { if (x && x.w && !PRON[lg][x.w]) PRON[lg][x.w] = {py: x.py || "", ipa: x.ipa || "", gloss: x.gloss || "", in_drawer: x.in_drawer || []}; };
["initials", "finals", "tones", "tone_rules"].forEach(k => (SN.zh[k] || []).forEach(o => (o.ex || []).forEach(x => eatW("zh", x))));
(SN.zh.syllables || []).forEach(o => (o.chars || []).forEach(x => eatW("zh", x)));
["vowels", "consonants", "spelling", "stress"].forEach(k => (SN.en[k] || []).forEach(o => (o.ex || []).forEach(x => eatW("en", x))));
(SN.links || []).forEach(l => { (l.words || []).forEach(x => eatW(l.lang, x)); if (l.a) { eatW(l.lang, l.a); eatW(l.lang, l.b); } });
const TONE = s => /[āēīōūǖ]/.test(s) ? 1 : /[áéíóúǘ]/.test(s) ? 2 : /[ǎěǐǒǔǚ]/.test(s) ? 3 : /[àèìòùǜ]/.test(s) ? 4 : 0;
const TGLYPH = ["·", "ˉ", "ˊ", "ˇ", "ˋ"];
const pyOf = c => (PRON.zh[c] && PRON.zh[c].py) || (CH[c] && CH[c].py) || "";
/* 读音那一行：中文每个字一个拼音，右上角一个小记号表示声调；英文是 IPA */
/* 整词的拼音按音节拆开，对到每个字上（地方 dìfang、不是 bú shì）；没有整词的拼音才一个字一个字查 */
const SYL = /(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(?:[aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)(?:ng(?![aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|n(?![aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|r(?![aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]))?/gi;
function splitPy(py, n){ const ss = String(py || "").toLowerCase().replace(/['’]/g, " ").match(SYL) || []; return ss.length === n ? ss : null; }
function pronHtml(w, wordPy){
  if (isZh(w)) {
    const cs = [...w].filter(isZh), ps = splitPy(wordPy, cs.length) || cs.map(pyOf);
    if (ps.every(Boolean)) return `<div class="pron">${cs.map((c, i) => `<span class="pc"><i>${esc(ps[i])}</i><b>${esc(c)}</b></span>`).join("")}</div>`;
    if (wordPy) return `<div class="big">${esc(w)}</div><div class="py">${esc(wordPy)}</div>`;
    return "";
  }
  const ip = ipaOf(w); return ip ? `<div class="pron"><span class="ipa">/${esc(ip)}/</span></div>` : "";
}
/* 一个词连着的声音线：中文按整个词和每个字找，英文按词找 */
/* 一个词的读音按整词来（轻声也算）：抽屉词有整词拼音就拆开对到每个字，没有才一个字一个字查 */
function wordSyl(w){
  const cs = [...w].filter(isZh), dw = allDrawerWords().find(x => x.zh === w && x.py);
  return (dw && splitPy(dw.py, cs.length)) || cs.map(pyOf);
}
const toneNumOf = l => /轻/.test(l.part) ? 0 : "一二三四".indexOf(String(l.part).charAt(1)) + 1;
const initialOf = syl => (String(syl).match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])/) || [""])[0];
const ZHSHARE = (SN.links || []).filter(l => l.lang === "zh" && l.type === "share");
/* 一个词连着的声音线：英文按词找；中文按这个词里每个字「在这个词里」的读音找——例字里没有的字，只要音节、声母、声调对得上也连 */
function soundLinks(w){
  const lg = TLg(), m = (SN.by_word || {})[lg] || {}, ids = new Set();
  if (lg !== "zh") { (m[String(w).toLowerCase()] || []).forEach(i => ids.add(i)); return [...ids].map(i => SL[i]).filter(Boolean); }
  (m[w] || []).forEach(i => ids.add(i));
  const cs = [...w].filter(isZh), sy = wordSyl(w);
  cs.forEach((c, i) => {
    const syl = sy[i] || "";
    (m[c] || []).forEach(id => { const l = SL[id]; if (!l) return;
      if (l.type === "share" && l.by === "syllable" && syl && l.part !== syl) return;
      if (l.type === "share" && l.by === "tone" && syl && toneNumOf(l) !== TONE(syl)) return;
      if (l.type === "pair") { const side = [l.a, l.b].find(x => x.w === c); if (side && syl && side.py && side.py !== syl) return; }
      ids.add(id); });
    if (syl) ZHSHARE.forEach(l => { if ((l.by === "syllable" && l.part === syl) || (l.by === "tone" && toneNumOf(l) === TONE(syl)) || (l.by === "initial" && l.part === initialOf(syl))) ids.add(l.id); });
  });
  return [...ids].map(i => SL[i]).filter(Boolean);
}
const ttsOK = () => !!window.speechSynthesis;
function sayIt(t){ if (!ttsOK()) { toast(TT().noTts); return; } say(t, TLg() === "zh" ? "zh-CN" : "en-GB"); }
const partLabel = l => { const T = TT(); if (l.by === "tone") { const k = /轻/.test(l.part) ? 5 : "一二三四".indexOf(String(l.part).charAt(1)) + 1; return T.toneN(k || l.part); } if (l.by === "sound") return "/" + l.part + "/"; if (l.by === "phonetic") return l.comp + " · " + ((PHON[l.comp] && PHON[l.comp].py) || pyOf(l.comp) || l.part); if (l.by === "spelling" && l.sound) return l.part + " /" + l.sound + "/"; return l.part; };
const pairSide = x => `<span class="ps"><b>${esc(x.w)}</b><small>${esc(x.py || (x.ipa ? "/" + x.ipa + "/" : ""))}</small><button class="play" data-sayw="${esc(x.w)}">▶</button></span>`;
const pNote = l => UIk() === "zh" ? (l.note || "") : (l.note_en || l.note || "");
const myNative = () => M === "zh" ? ["pt", "en"] : ["zh"];   // 演示的人：说得好的语言（Lucas 葡语、英语；苏苏 中文）
const hardForMe = l => (l.hard_for || []).some(x => myNative().includes(x));
function soundRow(w){
  const T = TT(), ui = UIk(), ls = soundLinks(w);
  const share = ls.filter(l => l.type === "share").slice(0, 5), pair = ls.filter(l => l.type === "pair").slice(0, 3);
  let h = "";
  const byK = {}; share.forEach(l => (byK[l.by] = byK[l.by] || []).push(l));
  if (share.length) h += Object.entries(byK).map(([k, arr]) => `<div class="w3s">${esc(T.byName[k] || T.sShare)}</div><div class="schips">${arr.map(l => `<button class="schip ${l.by}" data-sn="${esc(l.id)}"><b>${esc(partLabel(l))}</b><small>${esc((l.words || []).map(x => x.w).filter(x => x !== w && ![...w].includes(x.w)).slice(0, 4).join(" "))}</small></button>`).join("")}</div>`).join("");
  let hardShown = 0; const hardOnce = l => hardForMe(l) && !hardShown++;
  if (pair.length) h += `<div class="w3s">${esc(T.sPair)}</div>${pair.map(l => `<div class="pairc" data-sn="${esc(l.id)}">${pairSide(l.a)}<span class="vs">${esc(ui === "zh" ? l.diff : (l.diff_en || l.diff))}</span>${pairSide(l.b)}<div class="why">${esc(l.why ? l.why[ui] || l.why.en : "")}</div>${pNote(l) ? `<div class="pnote">${esc(pNote(l))}</div>` : ""}${hardOnce(l) ? `<div class="hard">${esc(T.hardTip)}</div>` : ""}</div>`).join("")}`;
  return h;
}
/* 你说过的、跟这条线连着的字词：小块上和点进去以后用同一个算法，数量对得上 */
function mineFor(l){
  const set = new Set();
  myPieces().forEach(w => { if (soundLinks(w).some(y => y.id === l.id)) set.add(w); });
  return set;
}
/* 点进一个音：跟词根那个小网一个样子 */
function soundSheet(id, back){
  const T = TT(), ui = UIk(), l = SL[id]; if (!l) return;
  const mineSet = new Set(myWords().map(x => x.w));
  if (l.type === "pair") {
    openSheet(`${back ? `<button class="bk" data-back="${esc(back)}">‹ ${esc(T.back)}</button>` : ""}<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">🔊 ${esc(T.netSound)}</div>
      <div class="pairbig">${pairSide(l.a)}<span class="vs">${esc(ui === "zh" ? l.diff : (l.diff_en || l.diff))}</span>${pairSide(l.b)}</div>
      <div class="rsent">${esc(l[ui] || l.en)}</div>${l.why ? `<div class="wnote" style="display:block">${esc(l.why[ui] || l.why.en)}</div>` : ""}${pNote(l) ? `<div class="pnote">${esc(pNote(l))}</div>` : ""}
      ${hardForMe(l) ? `<div class="hard">${esc(T.hardTip)}</div>` : ""}
      <div class="lab2">${esc(T.sayAfter)}</div><div class="sayafter"><button class="btn ghost" data-after="${esc(l.a.w)}">🎙️ ${esc(l.a.w)}</button><button class="btn ghost" data-after="${esc(l.b.w)}">🎙️ ${esc(l.b.w)}</button></div><div class="aftout" id="aftout"></div>`);
    return;
  }
  const mineL = mineFor(l);
  const ws = [...mineL].map(w => ({w, lvl: 0, x: (l.words || []).find(x => x.w === w) || {w, py: isZh(w) ? wordSyl(w).join(" ") : "", ipa: (PRON.en[w] || {}).ipa || ""}}))
    .concat((l.words || []).filter(x => !mineL.has(x.w)).map(x => ({w: x.w, lvl: x.in_drawer && x.in_drawer.length ? 1 : 2, x})));
  ws.sort((a, b) => a.lvl - b.lvl);
  const members = ws.slice(0, 16), keys = members.map(m => cardKey({w: m.w}));
  const W = 320, H = 230, cx = W / 2, cy = H / 2, n = members.length;
  const pos = members.map((m, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(n, 1), r = 84 + (i % 2) * 12; return [cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * .95]; });
  const lab = [T.rMine, T.rDrawer, T.rEx];
  openSheet(`${back ? `<button class="bk" data-back="${esc(back)}">‹ ${esc(T.back)}</button>` : ""}<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">🔊 ${esc(T.netSound)}</div>
    <div class="rbig snd">${esc(partLabel(l))}</div><div class="rsent snd">${esc(l[ui] || l.en)}</div>
    ${l.by === "phonetic" && l.comp && PHON[l.comp] ? `<button class="chip" data-rn="p:${esc(l.comp)}">🌱 ${esc(T.toShape(l.comp))}</button>` : ""}
    ${hardForMe(l) ? `<div class="hard">${esc(T.hardTip1)}</div>` : ""}
    <svg class="rnet snd" viewBox="0 0 ${W} ${H}">${pos.map(p => `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" class="rl"/>`).join("")}
    <circle cx="${cx}" cy="${cy}" r="24" class="rcen"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" class="rct en">${esc(partLabel(l)).slice(0, 8)}</text>
    ${members.map((m, i) => { const [x, y] = pos[i], tw = Math.max(26, [...m.w].length * (isZh(m.w) ? 15 : 7.5) + 14); return `<g class="rw l${m.lvl}" data-card="${keys[i]}" data-from="${esc("sn:" + id)}"><rect x="${x - tw / 2}" y="${y - 12}" width="${tw}" height="24" rx="12"/><text x="${x}" y="${y + 5}" text-anchor="middle">${esc(m.w)}</text></g>`; }).join("")}</svg>
    <div class="rleg"><span><i class="l0"></i>${esc(lab[0])}</span><span><i class="l1"></i>${esc(lab[1])}</span><span><i class="l2"></i>${esc(lab[2])}</span></div>
    <div class="slist">${members.map((m, i) => `<div class="srow l${m.lvl}"><button class="chip ${m.lvl === 0 ? "on" : ""}" data-card="${keys[i]}" data-from="${esc("sn:" + id)}">${esc(m.w)}</button><span class="sp">${esc(m.x.py || (m.x.ipa ? "/" + m.x.ipa + "/" : ""))}</span><span class="sg">${esc(m.x.gloss || "")}</span><button class="play" data-sayw="${esc(m.w)}">▶</button></div>`).join("")}</div>`);
}
/* 《你的语言》里的「🔊 你的话里的音」：只亮你自己的话里出现过的音 */
function soundSection(){
  const T = TT(), ui = UIk(), mine = myWords(); if (!mine.length || !(SN.links || []).length) return "";
  const share = new Map(), pairs = [];
  myPieces().forEach(w0 => soundLinks(w0).forEach(l => {
    if (l.type === "share") share.set(l.id, mineFor(l));
    else if (!pairs.some(p => p.l.id === l.id)) pairs.push({l, w: w0});
  }));
  if (!share.size && !pairs.length) return "";
  pairs.sort((a, b) => hardForMe(b.l) - hardForMe(a.l));
  const order = {syllable: 0, phonetic: 1, tone: 2, initial: 3, final: 4, sound: 0, spelling: 1};
  const sh = [...share.entries()].map(([id, ws]) => ({l: SL[id], ws})).sort((a, b) => b.ws.size - a.ws.size || (order[a.l.by] || 9) - (order[b.l.by] || 9)).slice(0, 10);
  return `<div class="sec" id="soundSec"><h3>🔊 ${esc(T.soundH)}</h3><p class="sub">${esc(T.soundS)}</p>
    <div class="shps">${sh.map(x => `<button class="shp snd ${x.l.by}" data-sn="${esc(x.l.id)}"><b class="${isZh(x.l.part) ? "" : "en"}">${esc(partLabel(x.l))}</b><small>${esc(T.byName[x.l.by] || "")}</small><span class="sw">${[...x.ws].slice(0, 4).map(esc).join(" ")}</span></button>`).join("")}</div>
    ${pairs.slice(0, 4).map((p, i) => `<div class="pairc ${i === 0 && hardForMe(p.l) ? "hardp" : ""}" data-sn="${esc(p.l.id)}">${pairSide(p.l.a)}<span class="vs">${esc(ui === "zh" ? p.l.diff : (p.l.diff_en || p.l.diff))}</span>${pairSide(p.l.b)}${i === 0 && hardForMe(p.l) ? `<div class="hard">${esc(T.hardTip)}</div>` : ""}</div>`).join("")}</div>`;
}

/* 小注的出处在英文界面里用英文 */
function srcEn(s){
  if (!s) return ""; if (NET.src_en && NET.src_en[s]) return NET.src_en[s];
  return s.replace(/欧洲理事会《欧洲语言共同参考框架》（CEFR, 2001）4\.4\.3 补偿策略：用描述代替不知道的词/, "Council of Europe, CEFR (2001) 4.4.3, compensation strategies: describing a word you don't know")
    .replace(/这几种写法在中文、巴西葡萄牙语、西班牙语的网上聊天里都常见（各语言的网络用语词典）/, "These spellings are common in online chat in Chinese, Brazilian Portuguese and Spanish (internet-slang dictionaries in each language)")
    .replace(/《现代汉语词典》（第 7 版）对寒暄语的说明/g, "Contemporary Chinese Dictionary (7th ed.), on greetings")
    .replace(/《现代汉语词典》（第 7 版）/g, "Contemporary Chinese Dictionary (7th ed.) ")
    .replace(/（2018 年收录）/g, " (added 2018)")
    .replace(/（[^）]*[\u4e00-\u9fff][^）]*）/g, "")
    .replace(/「([^」]*)」/g, " “$1”").replace(/”\s+“/g, "” “").replace(/；/g, "; ").replace(/（/g, " (").replace(/）/g, ")").replace(/\s+/g, " ").trim();
}
function placeName(on){ const r = placeName0(on); return [...r].length > 30 ? [...r].slice(0, 29).join("") + "…" : r; }
function placeName0(on){
  const N = NET.nodes || {}, ui = UIk(), nm = n => (ui === "zh" ? n.name.zh : n.name.en) || "";
  if (!on) return "";
  if (on.startsWith("field:")) { const f = NET.fields[on.slice(6)]; return f ? (ui === "zh" ? f.name.zh : f.name.en) : on; }
  if (N[on]) return (N[on].role && NET.people[N[on].who] ? personTag(N[on].who) : nm(N[on])).split(" · ")[0].replace(/[《》]/g, "");
  const l = (NET.lines || []).find(x => x.id === on); return l && N[l.from] && N[l.to] ? nm(N[l.from]).replace(/（.*$|\s*\(.*$/, "") + " → " + nm(N[l.to]).replace(/（.*$|\s*\(.*$/, "") : "";
}
function findMsg(text){
  const k = HV.plain(text).slice(0, 10), m = allMsgs().find(m => HV.plain(m.text).includes(k)); if (m) return m;
  // 角色页上的问答：回到那个人的页
  const N = NET.nodes || {};
  for (const id in N) { const n = N[id]; if (!n.role) continue;
    for (const [lg, rows] of Object.entries(n.chat || {})) { const i = rows.findIndex(r => r && HV.plain(r.a || "").includes(k)); if (i >= 0) return {on: id, cast: 1, qa: lg + ":" + i}; }
    for (const [lg, o] of Object.entries(n.pages || {})) { const pg = Object.keys(o).find(x => o[x] && HV.plain(o[x].a || "").includes(k)); if (pg) return {on: pg, cast: 1, pageOf: id}; } }
  return null;
}
function personTag(who, fallbackNm, fallbackCity){
  const p = (NET.people || {})[who], ui = UIk();
  const nm = (p ? (typeof p.nm === "string" ? p.nm : (ui === "zh" ? p.nm.zh : p.nm.en)) : (fallbackNm || who)).split(" · ")[0];
  const city = p && p.city ? (ui === "zh" ? p.city.zh : p.city.en) : (fallbackCity || "");
  return [nm, city, p && p.age ? TT().whoAge(p.age) : ""].filter(Boolean).join(" · ");
}
function msgSrc(m){
  const T = TT(); if (!m) return `<span class="srcn">${esc(T.noSrc)}</span>`;
  if (m.cast) return `<a class="srcl" href="${esc(HV.url({page: "net", node: m.on, qa: m.qa}))}">${esc(m.qa ? T.onPerson(placeName(m.on)) : T.onPage(placeName(m.on)))}</a>`;
  const pl = placeName(m.on), url = HV.url({page: "net", node: (NET.lines || []).some(l => l.id === m.on) ? null : m.on, line: (NET.lines || []).some(l => l.id === m.on) ? m.on : null, thread: m.thread});
  return `<a class="srcl" href="${esc(url)}">${esc(T.inThread(pl))}</a>`;
}
function drawerSheet(id){
  S.sheetKind = "dr:" + id;
  const D = drInfo(id), T = TT(), d = d_(), c = (d.dr || {})[id] || {others: []}, n = +id.slice(1), tl = TLg(), ui = UIk();
  S.openDr = id;
  const cab = CABS.find(x => x.id === D.cab);
  const mine = S.mine[id] || [];
  const items = HV.items(tl);
  const mineU = mine.filter(m => m.user), mineD = mine.filter(m => !m.user);
  const demoH = mineD.map(m => `<div class="dm" style="opacity:.8;border-left-color:#e9b4a3;background:#fbf7ee" ${m.src ? `data-line="${m.src}"` : ""}><div class="dt">${esc(m.t)}</div><div class="qtr">${esc(m.tr || "")}</div><button class="play" data-say="${esc(m.t)}">${esc(T.hear)}</button></div>`).join("");
  const mineH = mineU.length ? mineU.map(m => {
      if (m.user) { const it = items.find(x => x.id === m.id); if (!it) return "";
        return `<div class="dm"><div class="dt">${tapText(m.t)}</div><div class="qtr">${srcHtml(it)}</div><div>${drLine(it)}</div><button class="play" data-say="${esc(m.t)}" data-mine="1">${esc(T.playYou)}</button></div>`; }
      return `<div class="dm" style="opacity:.8;border-left-color:#e9b4a3;background:#fbf7ee" ${m.src ? `data-line="${m.src}"` : ""}><div class="dt">${esc(m.t)}</div><div class="qtr">${esc(m.tr || "")} · <span class="dtag">${esc(T.demoTag)} · ${esc(d.me)}</span></div><button class="play" data-say="${esc(m.t)}" data-mine="1">${esc(T.playDemo)}</button></div>`; }).join("")
    : `<div class="dinv">${esc(c.others.length ? T.drInvA(D.q) : T.drInvB(D.q))}</div>`;
  const demoBlock = demoH ? `<div class="lab2">${esc(T.demoMine(d.me))}</div><div class="dmine">${demoH}</div>` : "";
  // 别人这么说：同一种语言（在学的），只是放在旁边听，不用收
  const seen = new Set();
  const others = c.others.map(o => ({...o, m: findMsg(o.t)}));
  allMsgs().filter(m => m.lg === tl && m.fn && [].concat(m.fn).map(Number).includes(n)).forEach(m => { if (!others.some(o => HV.plain(m.text).includes(o.t.slice(0, 8)))) others.push({w: m.by, t: HV.plain(m.text), tr: m.tr ? (m.tr[ui] || "") : "", m}); });
  const oth = others.filter(o => !seen.has(o.t) && seen.add(o.t)).slice(0, 5).map(o => `<div class="do"><img src="${face(o.w)}" alt=""><div class="dob"><div class="don">🎭 <b>${esc(personTag(o.w, o.nm, o.c))}</b> · ${msgSrc(o.m)}</div><div class="dt">${esc(o.t)}</div><div class="qtr">${esc(o.tr)}</div>
     <div class="row" style="display:flex;gap:6px;margin-top:5px"><button class="play" data-say="${esc(o.t)}">▶</button></div></div></div>`).join("");
  // 同一个意思，别的语言里大家这么说：每一句挂在一个具体的人身上
  const same = [];
  allMsgs().filter(m => m.lg !== tl && HV.fnOf(m).includes(n)).forEach(m => { if (same.length < 4 && !same.some(x => x.by === m.by)) same.push(m); });
  const note0 = (NET.fn_notes || {})[id] || NOTES[id];
  const note = (() => { if (!note0 || tl !== "en") return note0; const tx = note0[ui] || note0.en || "";
    const ss = tx.split(/(?<=[。！？.!?])\s*/).filter(Boolean), keep = ss.filter(x => !(ui === "zh" ? /「[^」]*[\u4e00-\u9fff][^」]*」/ : /[\u4e00-\u9fff]/).test(x));
    if (!keep.length) return null; if (keep.length === ss.length) return note0; return {[ui]: keep.join(ui === "zh" ? "" : " "), en: keep.join(" ")}; })();
  const sameH = same.length || note ? `<div class="same"><div class="h">🌍 ${esc(T.sameH)}</div><div class="sub2">${esc(T.sameS)}</div>
    ${same.map(m => `<div class="do"><img src="${m.demo ? face("lucas") : face(m.by)}" alt=""><div class="dob"><div class="don">${m.demo ? `<b>Lucas</b> · São Paulo · <span class="dtag">${esc(T.demoTag)}</span>` : `🎭 <b>${esc(personTag(m.by))}</b> · ${msgSrc(m)}`}<span class="lg">${esc((LGN[m.lg] || [m.lg, m.lg])[ui === "zh" ? 0 : 1])}</span></div><div class="dt">${esc(HV.plain(m.text))}</div><div class="qtr">${esc(m.tr ? (m.tr[ui] || m.tr.en || "") : "")}</div>
      <div class="row" style="display:flex;gap:6px;margin-top:5px"><button class="play" data-say="${esc(HV.plain(m.text))}" data-lang="${m.lg}">▶</button></div></div></div>`).join("")}
    ${note ? `<div class="nt">💡 ${esc(note[ui] || note.en)}${note.src ? `<span style="display:block;font-size:11px;color:var(--soft);margin-top:2px">${esc(ui === "zh" ? "依据：" : "Based on: ")}${esc(ui === "zh" ? note.src : (note.src_en || srcEn(note.src)))}</span>` : ""}</div>` : ""}</div>` : "";
  openSheet(`<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">${cab.i} ${esc(d.ui === "zh" ? cab.zh : cab.en)}</div>
    <div class="drh" style="font-size:21px;margin:2px 0 4px">${esc(D.n)}</div>
    <div class="lab2">${esc(T.drMine)}</div><div class="dmine" id="dmine">${mineH}</div>${demoBlock}
    ${oth ? `<div class="lab2">${esc(T.drOthers)}</div>${oth}` : ""}
    ${wordsHtml(n)}
    ${sameH}`);
}
function growFx(id, still){
  setTimeout(() => {
    const el = SR.querySelector(`[data-dw="${id}"]`);
    if (el && !still){ const cab = el.closest(".cab"); scr.scrollTop = cab.offsetTop - 60; }
    stamp(TT().drGrew, drInfo(id).n); confetti(30);
    setTimeout(() => { S.newDr = null; }, 1500);
  }, 450);
}

/* ───────── 底下的纸 ───────── */
function openSheet(html, cls){
  const sh = $("sheet"); $("sin").innerHTML = html; $("sin").scrollTop = 0;
  sh.className = "sheet on " + (cls || "") + (d_().tl.startsWith("en") ? " en-t" : "");
  $("veil").classList.add("on");
  if (narrow()) { const r = phone.getBoundingClientRect(); if (r.bottom > innerHeight + 4) window.scrollBy({top: r.bottom - innerHeight + 8, behavior: "smooth"}); }
}
function closeSheet(){ $("sheet").classList.remove("on"); $("veil").classList.remove("on"); focusNet(null); try{ speechSynthesis.cancel(); }catch(e){} }

function whoCard(id, alt){
  const p = alt || person(id);
  return `<div class="who"><img src="${face(alt ? alt.who : id)}" alt=""><div><b>${esc(p.nm)}</b><small>${esc(p.d)}</small></div></div>`;
}
function phraseSheet(pid){
  const p = P(pid), T = TT(), d = d_();
  focusNet(keysForPhrase(pid));
  const uses = S.lines.filter(l => l.uses.includes(pid));
  const one = {uses:[pid], mk:{}}; one.mk[pid] = p.mk;
  let h = `<div class="big">${esc(p.t)}</div>${p.py ? `<div class="py">${esc(p.py)}</div>` : ""}<div class="mean">${esc(p.m)}</div>
   <button class="play" style="margin-top:8px" data-say="${esc(p.t)}">${esc(T.hear)}</button>
   <div class="card"><div class="lab">${esc(T.heard)}</div>${whoCard(p.who)}
    <div class="quote">${markText(p.q, [[...p.mk].map(m => [m, pid])][0])}</div><div class="qtr">${esc(p.qtr)}</div>
    <div class="row" style="display:flex;gap:6px;align-items:center;margin-top:6px"><button class="play" data-say="${esc(p.q)}">${esc(T.hearOrig)}</button></div>
    <div class="where">${esc(p.where)}</div></div>`;
  if (p.also) h += `<div class="card"><div class="lab">${esc(T.alsoSays)}</div>${whoCard(null, p.also)}<div class="quote">${markText(p.also.q, p.mk.map(m => [m, pid]))}</div><div class="qtr">${esc(p.also.qtr)}</div><div class="row" style="margin-top:6px"><button class="play" data-say="${esc(p.also.q)}">${esc(T.hearOrig)}</button></div><div class="where">${esc(p.also.where)}</div></div>`;
  if (uses.length){
    h += `<div class="card"><div class="lab">${esc(T.usedIn)}</div>` + uses.map(l => `<div class="quote mine">${markText(l.t, marks(l))}</div><div class="qtr">${esc(l.tr)}</div><div class="where">${esc(d.kinds[l.k])} · ${esc(l.at)}</div><button class="play" style="margin:6px 0 4px" data-play="${l.id}">${esc(T.playDemo)}</button>`).join("") + `</div>`;
  } else {
    h += `<div class="card" style="background:#fbf7ee;border:1.5px dashed #d6ccb6;box-shadow:none"><div class="lab">${esc(T.notYet)}</div><div style="font-size:13.5px;color:#4b5563">${esc(T.notYetP)}</div>
      ${p.prac ? `<button class="btn" data-use="${pid}">${esc(T.use)} →</button>` : ""}
      <button class="letgo" data-letgo="${pid}">${esc(T.letgo)}</button></div>`;
  }
  openSheet(h);
}
function personSheet(who){
  const T = TT(); focusNet(keysForPerson(who));
  const ps = visible().filter(p => p.who === who);
  const nm = person(who).nm;
  openSheet(`<div style="margin-top:8px">${whoCard(who)}</div>
   <div class="card"><div class="lab">${esc(T.personBorrow)}</div><div class="chips">${ps.map(p => `<button class="chip" data-p="${p.id}">${esc(p.short || p.t)}<small>${used(p) ? "✓" : "…"}</small></button>`).join("")}</div></div>
   <button class="btn ghost" data-hangp="${who}">${esc(T.hangWith(nm))}</button>`);
}
function lineSheet(lid){
  const l = S.lines.find(x => x.id === lid), T = TT(), d = d_();
  focusNet(keysForLine(lid));
  if (l.user) { const it = l.it, url = HV.url(it.src);
    return openSheet(`<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">${esc(T.youSaidIt)}</div>
     <div class="quote mine" style="font-size:19px">${markText(l.t, marks(l))}</div>
     ${it.q ? `<div class="qtr" style="margin-top:4px">❓ ${esc(it.q.t)}${it.q.tr ? " · " + esc(it.q.tr) : ""}</div>` : ""}
     <button class="play" style="margin-top:8px" data-say="${esc(l.t)}" data-mine="1">${esc(T.playYou)}</button>
     <div class="card"><div class="lab">${esc(T.ownWhere)}</div><div style="font-size:14px">${srcHtml(it)}</div>${url ? `<a class="btn ghost" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${esc(url)}">↩ ${esc(it.where ? (it.where[UIk()] || it.where.en) : "")}</a>` : ""}</div>
     <div class="card"><div class="lab">🗄️</div>${drLine(it)}</div>
     ${it.reply ? `<div class="card"><div class="lab">🎭</div><div style="font-size:14px">${esc(it.reply.t)}</div><div class="qtr">${esc(it.reply.tr || "")}</div></div>` : ""}
     ${l.uses.length ? `<div class="card"><div class="lab">${esc(T.ownUses)}</div>${heardHtml(l)}</div>` : ""}`); }
  const fs = l.uses.map(pid => P(pid)).filter(Boolean);
  openSheet(`<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:10px">${esc(d.kinds[l.k])}</div>
   <div class="quote mine" style="font-size:19px">${markText(l.t, marks(l))}</div><div class="qtr">${esc(l.tr)}</div>
   <button class="play on" style="margin-top:8px" data-play="${l.id}">${esc(T.playDemo)}</button> <small style="color:var(--soft);font-size:11px">${esc(T.voiceDemo)}</small>
   <div class="card"><div class="lab">${esc(T.ownWhere)}</div><div style="font-size:14px;color:var(--ink)">${esc(l.at)}</div>${l.pend ? `<div class="where"><span class="pend">${esc(l.pend)}</span></div>` : ""}</div>
   <div class="card"><div class="lab">${esc(T.ownUses)}</div>${fs.map(p => `<div class="who" style="margin:6px 0;cursor:pointer" data-p="${p.id}"><img src="${face(p.who)}" alt=""><div><b>${esc(p.t)}</b><small>${esc(p.m)} · ${esc(T.from)} ${esc(person(p.who).nm)}</small></div></div>`).join("")}</div>`);
}

/* ───────── 用它说一句你自己的事：选 → 填空 → 自己说 ───────── */
let PR;
function practice(pid, lv){
  const p = P(pid), T = TT(); if (!p || !p.prac) return;
  PR = {pid, lv: lv || 0, pick: null, fill: null, out: null};
  focusNet(keysForPhrase(pid));
  drawPractice();
  say(p.prac.ask);
}
function drawPractice(){
  const p = P(PR.pid), T = TT(), x = p.prac;
  let body = "";
  if (PR.lv === 0){
    body = x.pick.map((o, i) => `<button class="opt ${PR.pick === i ? "on" : ""}" data-pick="${i}"><b>${markText(o[0], p.mk.map(m => [m, p.id]))}</b><small>${esc(o[1])}</small></button>`).join("")
      + (PR.pick != null ? `<p class="lvnote" style="margin-top:10px">${esc(T.sayItP)}</p><div id="sbx"></div>` : "");
  } else if (PR.lv === 1){
    const f = x.fill; const val = PR.fill;
    const shown = f.f.split("___").map(esc).join(val ? `<span class="slot got">${esc(val)}</span>` : `<span class="slot">&nbsp;</span>`);
    body = `<div class="frame">${shown}</div><div class="qtr" style="text-align:center;margin-top:4px">${esc(f.tr)}</div>
      <div class="chips" style="justify-content:center">${f.chips.map(c => `<button class="chip ${val === c[0] ? "on" : ""}" data-fill="${esc(c[0])}">${esc(c[0])}<small>${esc(c[1])}</small></button>`).join("")}</div>
      <input class="own-in" id="ownIn" placeholder="${esc(T.typeOwn)}" value="${val && !f.chips.some(c => c[0] === val) ? esc(val) : ""}">
      ${val ? `<p class="lvnote" style="margin-top:10px">${esc(T.sayItP)}</p><div id="sbx"></div>` : ""}`;
  } else {
    body = `<div class="lvnote" style="text-align:center">${esc(T.sayHint)}</div>
      <div class="two"><button class="btn ${PR.route === "nat" ? "ghost" : ""}" data-route="tl">${esc(T.sayTl)}</button><button class="btn ${PR.route === "nat" ? "" : "ghost"}" data-route="nat">${esc(T.nat1 || T.sayNat)}</button></div>
      <div id="natOut"></div><div id="sbx"></div>`;
  }
  openSheet(`<div class="who" style="margin-top:8px"><img src="${face(p.who)}" alt=""><div><b style="font:700 18px 'Noto Serif SC',Georgia,serif">${esc(p.t)}</b><small>${esc(p.m)} · ${esc(T.from)} ${esc(person(p.who).nm)}</small></div></div>
   <div class="lab" style="font-size:12px;color:var(--soft);font-weight:800;margin-top:12px">${esc(T.someone)}</div>
   <div class="ask"><img class="mini" style="width:30px;height:30px" src="${face(p.who)}" alt=""><div class="bub">${esc(x.ask)}<small>${esc(x.askTr)}</small></div><button class="play" data-say="${esc(x.ask)}">🔊</button></div>
   <div class="lv">${T.lv.map((l, i) => `<button class="${PR.lv === i ? "on" : ""}" data-lv="${i}">${esc(l[0])}<small>${esc(l[1])}</small></button>`).join("")}</div>
   <div class="lvnote">${esc(T.lvNote)}</div>${body}`);
  const box = $("sbx"); if (!box) return;
  if (PR.lv === 2) {
    if (PR.route === "nat") {
      // 先用母语说：真的听（葡语 / 中文），说了什么就显示什么；长成的句子样板里变不了，锁住、写明
      sayBox(box, d_().natLang.slice(0, 2), natText => {
        const tgt = x.pick[0];
        $("natOut").innerHTML = `<div class="card"><div class="lab">${esc(T.natSaid)}</div><div class="native">${esc(natText)}</div><div class="lab" style="margin-top:10px">${esc(T.growing)}</div><div class="grow locked" id="g2"></div></div>`;
        growInto($("g2"), `<span class="lk">🔒 ${esc(T.demoLocked)}</span>` + markText(tgt[0], p.mk.map(m => [m, p.id])), () => { say(tgt[0]); sayBox($("sbx"), TLg(), (t, v) => keepPractice(t, v)); });
      }, true);
    } else sayBox(box, TLg(), (t, v) => keepPractice(t, v));
  } else sayBox(box, TLg(), (t, v) => keepPractice(t, v), false, practiceText()[0]);
}
function practiceText(){
  const x = P(PR.pid).prac;
  if (PR.lv === 0) return x.pick[PR.pick];
  if (PR.lv === 1){
    const v = PR.fill, c = x.fill.chips.find(c => c[0] === v);
    return [x.fill.f.split("___").join(v), x.fill.tr.split("___").join(c ? c[1] : v)];
  }
  return ["", ""];
}
/* 一个说话的小框：按一下说（实时出字），不支持就打字；说了才算 */
function sayBox(el, lg, done, keepOpen, hint){
  const T = TT(), ui = UIk();
  el.innerHTML = `<div class="sbx"><button class="mic" aria-label="mic">🎙️</button><div class="bars"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="micl">${esc(T.tapMic)}${hint ? ` · <b>${esc(hint)}</b>` : ""}</div><div class="live"></div><div class="micerr" hidden></div>
    <input class="own-in" placeholder="${esc(T.typeIt)}"><button class="btn" disabled>${esc(T.doneT)}</button></div>`;
  const mic = el.querySelector(".mic"), bars = el.querySelector(".bars"), ml = el.querySelector(".micl"), live = el.querySelector(".live"), err = el.querySelector(".micerr"), inp = el.querySelector("input"), ok = el.querySelector(".btn");
  let rec = null, txt = "", via = "typed";
  const stop = () => { if (rec) rec.stop(); rec = null; mic.classList.remove("rec"); bars.classList.remove("on"); };
  const fail = code => { stop(); err.hidden = false; err.textContent = HV.micErr(code, ui); inp.focus(); };
  if (!HV.micOK()) { err.hidden = false; err.textContent = HV.micErr("unsupported", ui); }
  mic.onclick = ev => { ev.stopPropagation(); if (rec) { stop(); return; } err.hidden = true;
    rec = HV.listen(lg, {start: () => { mic.classList.add("rec"); bars.classList.add("on"); ml.textContent = T.listen.replace(/（.*?）|\(.*?\)/g, ""); },
      text: t => { live.textContent = t; txt = t; via = "voice"; ok.disabled = !t.trim(); },
      end: f => { stop(); if (f) { txt = f; live.textContent = f; via = "voice"; ml.textContent = T.heardYou; ok.disabled = false; blip(990); } else ml.textContent = T.tapMic; },
      fail}); if (!rec && !HV.micOK()) fail("unsupported"); };
  inp.oninput = () => { txt = inp.value; via = "typed"; live.textContent = ""; ok.disabled = !txt.trim(); };
  ok.onclick = ev => { ev.stopPropagation(); stop(); const t = txt.trim(); if (!t) return; done(t, via); };
}
function keepPractice(t, via){
  const p = P(PR.pid), T = TT();
  const drs = HV.classify(t, TLg());
  const pref = (d_().drMap || {})[PR.pid]; if (pref && !drs.includes(+pref.slice(1))) drs.unshift(+pref.slice(1));
  keepLine(t, {via, page: "mylang", src: {page: "mylang", phrase: PR.pid}, where: {zh: `🌱 在《你的语言》里练「${p.t}」`, en: `🌱 Practising “${p.t}” in My language`}, borrowed: [{who: p.who, t: p.t}], dr: drs.slice(0, 2)}, SR.querySelector("#sbx .btn"));
}
function growInto(el, html, done){
  const tmp = document.createElement("div"); tmp.innerHTML = html;
  const parts = [];
  tmp.childNodes.forEach(n => {
    if (n.nodeType === 3){ const s = n.textContent; const bits = s.match(/[^，。！？,.!?—\s]+[，。！？,.!?—\s]*|[，。！？,.!?—\s]+/g) || [s]; bits.forEach(b => parts.push(esc(b))); }
    else parts.push(n.outerHTML);
  });
  el.innerHTML = parts.map(p => `<span>${p}</span>`).join("");
  const sp = el.querySelectorAll(":scope > span");
  sp.forEach((s, i) => setTimeout(() => { s.classList.add("gin"); blip(600 + i * 40); if (i === sp.length - 1) done && done(); }, 260 * (i + 1)));
}

/* ───────── 整理进网里 ───────── */
function keepLine(t, meta, fromEl){
  const T = TT();
  const before = new Set(CABS.flatMap(c => shownIn(c).shown));
  const was = new Set(S.phrases.filter(p => !used(p)).map(p => p.id));
  const hid = new Set(S.phrases.filter(p => p.hidden).map(p => p.id));
  const it = HV.add({t, lg: TLg(), kind: "practice", via: meta.via || "voice", ...meta});
  sync();
  const id = "u_" + it.id, line = S.lines.find(l => l.id === id);
  const flipped = line.uses.filter(pid => was.has(pid)), newPhr = line.uses.filter(pid => hid.has(pid));
  const grew = (it.dr || []).map(n => "d" + n).find(d => !before.has(d));
  if (grew) S.newDr = grew;
  const from = fromEl ? fromEl.getBoundingClientRect() : null;
  closeSheet();
  render([...flipped.map(p => "p:" + p), "o:" + id]);
  scr.scrollTop = 0;
  const svg = $("net");
  flipped.forEach((pid, i) => {
    const g = svg.querySelector(`[data-k="p:${pid}"]`); if (!g || !from) return;
    const to = g.getBoundingClientRect();
    const f = document.createElement("div"); f.className = "flyer"; f.textContent = P(pid).short || P(pid).t;
    f.style.left = from.left + "px"; f.style.top = from.top + "px"; phone.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transform = `translate(${to.left - from.left}px,${to.top - from.top}px) scale(.85)`; f.style.opacity = ".2"; }));
    setTimeout(() => f.remove(), 900 + i * 100);
  });
  setTimeout(() => {
    focusNet(keysForLine(id));
    stamp(T.stamp, T.sortedT((it.dr || []).map(n => HV.drName(n, UIk())).join(" · ")));
    if (S.first){ confetti(46); S.first = false; } else confetti(16);
    const p0 = line.uses[0] && P(line.uses[0]);
    setTimeout(() => toast(p0 ? (heardBy(p0.id) ? T.heardFrom(p0.short || p0.t, whoName(heardBy(p0.id))) : T.alsoSays2(p0.short || p0.t, person(p0.who).nm)) : T.kept), 900);
    setTimeout(() => focusNet(null), 2600);
    if (grew) setTimeout(() => growFx(grew), 2700);
  }, 650);
}

/* ───────── 从你自己开始 ───────── */
let ST;
function startFlow(){ ST = {step:0, a1:null, a2:null, nat:""}; drawStart(); }
function stSteps(n){ return `<div class="steps">${[0,1,2,3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`; }
function stTarget(){
  const s = d_().start, a1 = s.a1[ST.a1], a2 = s.a2[ST.a2];
  const g = [];
  if (s.pre) s.pre.forEach(x => g.push(x));
  if (M === "zh") g.push([a1.t]); else g.push([a1.t]);
  a2.g.forEach(x => g.push([x[0].replace("{done}", a1.done || ""), x[1]]));
  return g;
}
function drawStart(){
  const s = d_().start, T = TT(), d = d_();
  let h = "";
  if (ST.step === 0){
    h = `${stSteps(0)}<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800">${esc(T.s1)}</div><h3 style="font:700 20px Georgia,'Noto Serif SC',serif;color:var(--ink);margin:4px 0 6px">${esc(s.q1)}</h3>
     <div class="q1">${s.a1.map((a, i) => `<button class="opt" data-a1="${i}"><span class="em">${a.em}</span><b>${esc(a.l)}</b></button>`).join("")}</div>`;
  } else if (ST.step === 1){
    h = `${stSteps(1)}<div class="lab" style="font-size:12px;color:var(--soft);font-weight:800">${esc(T.s1)}</div><h3 style="font:700 20px Georgia,'Noto Serif SC',serif;color:var(--ink);margin:4px 0 6px">${esc(s.q2)}</h3>
     ${s.a2.map((a, i) => `<button class="opt" data-a2="${i}"><b>${esc(a.l)}</b></button>`).join("")}`;
  } else if (ST.step === 2){
    const a1 = s.a1[ST.a1], a2 = s.a2[ST.a2];
    ST.nat = ST.nat || (a1.n + " " + a2.n);
    h = `${stSteps(2)}<h3 style="font:700 20px Georgia,'Noto Serif SC',serif;color:var(--ink);margin:4px 0 2px">${esc(T.s3)}</h3><p class="sub" style="margin:0 0 6px;color:var(--soft);font-size:13px">${esc(T.s3P)}</p>
     <textarea class="own-in" id="natIn" placeholder="${esc(ST.nat)}"></textarea>
     <button class="mic" data-mic="st" aria-label="mic">🎙️</button><div class="bars" id="bars"><i></i><i></i><i></i><i></i><i></i></div><div class="micl" id="micl">${esc(T.tapMic)}</div><div class="micerr" id="sterr" hidden style="font-size:12.5px;color:#8a3a14;background:#fff1d6;border-radius:10px;padding:6px 10px"></div>
     <button class="btn" data-stgo="3">${esc(T.grow)}</button>`;
  } else {
    h = `${stSteps(3)}<h3 style="font:700 20px Georgia,'Noto Serif SC',serif;color:var(--ink);margin:4px 0 2px">${esc(T.s4)}</h3><p class="sub" style="margin:0 0 6px;color:var(--soft);font-size:13px">${esc(T.s4P)}</p>
     <div class="native">${esc(ST.nat)}</div><div class="grow locked" id="g1"></div><div class="src" id="src"></div><div class="qtr" id="gtr" style="margin-top:6px"></div><div class="aihelp">🔒 ${esc(T.startLocked)}</div>
     <div id="stEnd"></div>`;
  }
  openSheet(h);
  if (ST.step === 3) growStart();
}
function growStart(){
  const g = stTarget(), T = TT(), s = d_().start;
  const html = g.map(x => x[1] ? `<u class="ph" data-p="${x[1]}">${esc(x[0])}</u>` : esc(x[0])).join("");
  const ids = g.filter(x => x[1]).map(x => x[1]).filter((v, i, a) => a.indexOf(v) === i);
  growInto($("g1"), html, () => {
    $("src").innerHTML = ids.map(pid => { const p = P(pid); return `<span><img src="${face(p.who)}" alt="">${esc(p.short || p.t)} · ${esc(person(p.who).nm)}</span>`; }).join("");
    $("src").querySelectorAll("span").forEach((e, i) => setTimeout(() => { e.classList.add("gin"); blip(880); }, 200 * i));
    const tr = M === "zh" ? s.a1[ST.a1].tr + " " + s.a2[ST.a2].tr : s.a1[ST.a1].tr + s.a2[ST.a2].tr;
    $("gtr").textContent = tr;
    const text = g.map(x => x[0]).join("").trim();
    say(text);
    $("stEnd").innerHTML = `<p class="lvnote" style="margin-top:10px">${esc(T.sayNow)} · ${esc(T.sayItP)}</p><div id="sbx"></div>`;
    sayBox($("sbx"), TLg(), (t, v) => keepLine(t, {via: v, page: "mylang", src: {page: "mylang", start: 1}, where: {zh: "🌱 在《你的语言》里「从你开始」", en: "🌱 “Start from you” in My language"}, borrowed: ids.map(pid => ({who: P(pid).who, t: P(pid).t})), dr: HV.classify(t, TLg()).slice(0, 2)}, $("sbx")), false, text);
    ST.text = text; ST.tr = tr; ST.ids = ids;
    const mk = {}; g.forEach(x => { if (x[1]){ (mk[x[1]] = mk[x[1]] || []).push(x[0].trim().replace(/^[，,]/, "")); } });
    ST.mk = mk;
  });
}

/* ───────── 点击 ───────── */
SR.addEventListener("click", ev => {
  const t = ev.target.closest("button,[data-k],u.ph,[data-p],[data-line],[data-card],[data-rn],[data-sn]");
  if (!t) return;
  if (t.closest("#phone") || t.closest(".note0")){ blip(); note(ev); }
  const ds = t.dataset;
  if (t.id === "x" || t === $("veil")) return closeSheet();

  if (ev.target.closest("a[href]")) return;
  if (ds.url){ HV.nav(ds.url); return; }
  if (ds.chdr){ const it = HV.items().find(x => x.id === ds.chdr); if (!it) return;
    HV.pickDrawers(phone, it.dr || [], UIk(), ns => { const before = new Set(CABS.flatMap(c => shownIn(c).shown)); HV.update(it.id, {dr: ns, drAuto: 0}); sync(); const g = ns.map(n => "d" + n).find(d => !before.has(d)); if (g) S.newDr = g; closeSheet(); render(); toast(TT().sortedT(ns.map(n => HV.drName(n, UIk())).join(" · "))); if (g) growFx(g); }); return; }
  if (ds.cab){ S.cabOpen[ds.cab] = !S.cabOpen[ds.cab]; redrawDrawer(); return; }
  if (ds.moreyou){ S.showAllYou = 1; const sc = scr.scrollTop; render(); scr.scrollTop = sc; return; }
  if (ds.lucas){ S.showLucas = !S.showLucas; $("lucasSec").classList.toggle("lucas-shut", narrow() && !S.showLucas); return; }
  if (ds.route){ PR.route = ds.route; drawPractice(); return; }
  if (ds.k){
    const [kind, id] = ds.k.split(":");
    if (kind === "s"){ const el = t.closest("[data-url]"); if (el && el.dataset.url) HV.nav(el.dataset.url); return; }
    if (kind === "p") return phraseSheet(id);
    if (kind === "w") return personSheet(id);
    if (kind === "o") return lineSheet(id);
  }
  if (ds.use){ return practice(ds.use, 0); }
  if (ds.letgo){
    const p = P(ds.letgo); const lay = SR.querySelector(`[data-lay="${p.id}"]`);
    p.gone = true; closeSheet(); toast(TT().letgoT);
    if (lay){ lay.classList.add("gone"); }
    setTimeout(() => render(), 450); return;
  }
  if (ds.lv){ PR.lv = +ds.lv; PR.out = null; PR.route = null; drawPractice(); return; }
  if (ds.pick != null && ds.pick !== ""){ PR.pick = +ds.pick; drawPractice(); say(P(PR.pid).prac.pick[PR.pick][0]); setTimeout(() => toast(rx()), 300); return; }
  if (ds.fill){ PR.fill = ds.fill; drawPractice(); say(practiceText()[0]); toast(rx()); return; }
  if (ds.dw){ return drawerSheet(ds.dw); }
  if (ds.uw != null && ds.uw !== ""){ return uniSheet(+ds.uw); }
  if (ds.growdemo){
    const g = d_().grow; S.grewDemo = true;
    toast(TT().listen); blip(660);
    setTimeout(() => {
      const id = "n" + (++S.seq);
      S.demoLines.push({id, k:"answer", at:g.at, t:g.t, tr:g.tr, uses:[], demo:1});
      addMine(g.dr, {t:g.t, tr:g.tr, src:id, fresh:true, demo:1});
      render(["o:" + id]); say(g.t, null, true); growFx(g.dr);
    }, 1300);
    return;
  }
  // 一个词三张网：点词开词卡，点根开小网，‹ 回到上一张
  const inSheet = !!t.closest("#sin");
  if (ds.back){ const [k, v] = [ds.back.split(":")[0], ds.back.slice(ds.back.indexOf(":") + 1)]; if (k === "dr") return drawerSheet(v); if (k === "card") return wordCard(v, S.cardBack || ""); if (k === "rn") return rootSheet(v, S.rnBack || ""); if (k === "sn") return soundSheet(v, S.snBack || ""); return; }
  if (ds.sayw){ sayIt(ds.sayw); return; }
  if (ds.after){ const out = $("aftout"); if (out) out.textContent = TT().listen.replace(/（.*?）|\(.*?\)/g, ""); HV.listen(TLg(), {text: x => { if (out) out.textContent = x; }, end: f => { if (out) out.textContent = f ? TT().youSaidX(f) : TT().tapMic; }, fail: c => { if (out) out.textContent = TT().afterNoMic; }}); if (!HV.micOK() && out) out.textContent = TT().afterNoMic; return; }
  if (ds.sn && !ds.say){ const back = inSheet ? S.sheetKind || "" : ""; S.snBack = back; soundSheet(ds.sn, back); S.sheetKind = "sn:" + ds.sn; return; }
  if (ds.card && !ds.say){ const back = ds.from ? ds.from : (inSheet ? S.sheetKind || "" : ""); S.cardBack = back; S.sheetKind = "card:" + ds.card; return wordCard(ds.card, back); }
  if (ds.rn){ const back = inSheet ? S.sheetKind || "" : ""; S.rnBack = back; const r = rootSheet(ds.rn, back); S.sheetKind = "rn:" + ds.rn; return r; }
  if (ds.say){ say(ds.say, ds.lang ? HV.LANGCODE[ds.lang] || ds.lang : null, !!ds.mine); return; }
  if (ds.play){ const l = S.lines.find(x => x.id === ds.play); if (l){ say(l.t, null, true); t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2200); } return; }
  if (ds.hang){ const f = {anim: "animation", food: "food", fit: "fitness", fash: "fashion"}[ds.hang]; if (f && window.WNET) { closeSheet(); window.WNET.open({open: "field:" + f}); } else toast(TT().hangT(d_().circles[ds.hang].n)); return; }
  if (ds.hangp){ const N0 = NET.nodes || {}, c = Object.keys(N0).find(k => N0[k].role && N0[k].who === ds.hangp); if (c && window.WNET) { closeSheet(); window.WNET.open({open: c}); } else toast(TT().hangWithT(person(ds.hangp).nm)); return; }
  if (ds.gonet){ if (window.WNET) window.WNET.open({}); return; }
  if (ds.gomap){ if (window.MAPL) window.MAPL.open({}); return; }
  if (ds.mego){ const g = ds.mego, P_ = window.hvPage || {}; if (g === "set" && P_.settings) P_.settings(); else if (g === "walk" && P_.walk) P_.walk(); else if (g === "again" && P_.review) P_.review(); return; }
  if (t.id === "startBtn"){ startFlow(); return; }
  if (ds.a1 != null && ds.a1 !== ""){ ST.a1 = +ds.a1; t.classList.add("on"); toast(rx()); setTimeout(() => { ST.step = 1; drawStart(); }, 380); return; }
  if (ds.a2 != null && ds.a2 !== ""){ ST.a2 = +ds.a2; t.classList.add("on"); toast(rx()); setTimeout(() => { ST.step = 2; ST.nat = ""; drawStart(); }, 380); return; }
  if (ds.mic === "st"){
    // 先用母语说：真的听，说的话写进框里（可以改）
    const ni = $("natIn"), ml = $("micl"), bars = $("bars"), er = $("sterr");
    if (ST.rec){ ST.rec.stop(); ST.rec = null; t.classList.remove("rec"); bars.classList.remove("on"); return; }
    ST.rec = HV.listen(d_().natLang.slice(0, 2), {start: () => { t.classList.add("rec"); bars.classList.add("on"); ml.textContent = TT().listen.replace(/（.*?）|\(.*?\)/g, ""); },
      text: x => { ni.value = x; }, end: f => { ST.rec = null; t.classList.remove("rec"); bars.classList.remove("on"); if (f) { ni.value = f; ml.textContent = TT().heardYou; } else ml.textContent = TT().tapMic; },
      fail: c => { ST.rec = null; t.classList.remove("rec"); bars.classList.remove("on"); er.hidden = false; er.textContent = HV.micErr(c, UIk()); ni.focus(); }});
    if (!ST.rec && !HV.micOK()) { er.hidden = false; er.textContent = HV.micErr("unsupported", UIk()); }
    return;
  }
  if (ds.stgo){ const ni = $("natIn"); const v = ni ? ni.value.trim() : ""; if (!v){ ni && ni.focus(); toast(TT().sayItP); return; } ST.nat = v; ST.step = 3; drawStart(); return; }
  // 句子里画线的说法 / 小标签
  if (t.matches("u.ph") || ds.p){
    const pid = ds.p; if (P(pid)) return phraseSheet(pid);
  }
  if (ds.line && !ev.target.closest("button")) return lineSheet(ds.line);
});
SR.addEventListener("input", ev => {
  if (ev.target.id === "ownIn" && PR){
    const v = ev.target.value.trim();
    if (v){ PR.fill = v; const fr = SR.querySelector(".frame"); const f = P(PR.pid).prac.fill;
      if (fr) fr.innerHTML = f.f.split("___").map(esc).join(`<span class="slot got">${esc(v)}</span>`);
      if (!SR.getElementById("sbx")) { ev.target.insertAdjacentHTML("afterend", `<p class="lvnote" style="margin-top:10px">${esc(TT().sayItP)}</p><div id="sbx"></div>`); sayBox(SR.getElementById("sbx"), TLg(), (t, w) => keepPractice(t, w), false, practiceText()[0]); }
    }
  }
});
$("veil").addEventListener("click", closeSheet);

function enter(o){
  o = o || {};
  closeSheet(); fresh(); render();
  const st = HV.load(), seen = new Set(st.seenDr || []);
  const fresh_ = HV.items(TLg()).flatMap(it => (it.dr || []).map(n => "d" + n)).filter(d => !seen.has(d));
  const demoOnly = new Set(Object.keys(S.demoMine));
  const g = fresh_.find(d => !demoOnly.has(d) && !CABS.find(c => c.id === drInfo(d).cab).common.map(n => "d" + n).includes(d)) || null;
  if (fresh_.length) { st.seenDr = [...seen, ...fresh_]; HV.save(st); }
  scr.scrollTop = 0;
  if (o.dr && drInfo(o.dr)) { setTimeout(() => { const el = SR.querySelector(`[data-dw="${o.dr}"]`); if (el) { S.cabOpen[drInfo(o.dr).cab] = 1; redrawDrawer(); } drawerSheet(o.dr); }, 300); }
  else if (g) { S.newDr = g; redrawDrawer(); growFx(g, true); }
  else if (o.fresh) setTimeout(() => { const y = $("youSec"); if (y) scr.scrollTo({top: y.offsetTop - 8, behavior: "smooth"}); }, 250);
}
return {enter, close: closeSheet};

}
})();

