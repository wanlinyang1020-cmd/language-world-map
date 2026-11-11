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
    <div class="hv-echo-slot"></div>${window.ACT ? window.ACT.starter() + window.ACT.todayBar() : ""}${window.SNAP ? window.SNAP.card() : ""}${window.WFEED ? window.WFEED.card() : ""}
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
var HV_CONFIG = {"url": "https://pfqbskweyqyrmnrkioha.supabase.co", "anonKey": "sb_publishable_t7_0E-MFz55eQVI71X0MEA_UQ-sTb2Y", "ai": "https://pfqbskweyqyrmnrkioha.supabase.co/functions/v1/ai", "google": true, "apple": ""};
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
  async function call(input, opts){
    const messages = typeof input === "string" ? [{role: "user", content: input}] : input;
    const r = await fetch(HV_CONFIG.ai, {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + HV.session.access_token, apikey: HV_CONFIG.anonKey},
      body: JSON.stringify({messages, tier: (opts && opts.modelTier) || "default", system: opts && opts.system})});
    const j = await r.json().catch(()=>({}));
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


