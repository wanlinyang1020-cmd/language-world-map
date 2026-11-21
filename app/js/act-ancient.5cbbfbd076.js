/* act_ancient.js */
// 🏮 一起走古代中国（2026-11-15，样板 样板/一起走古代中国样板.html，用户：「可以，放进软件」）
// 一本通关文牒护照：1 月 24 日领护照，1 月 25–29 日每天一站（山东 → 河南 → 丝绸之路 → 江南 → 长江边的诗人）。
// 每站：听几句老话 → 真去做一件事（描「友」、画甲骨文、真发一句送别、泡一杯、去看月亮）→ 三档里挑一档说你自己的一句（录下来）→ 盖章 → 同一页世界各地的人 + 李娜接着你的话回；
// 第三站寄出一句送别、收到一封别人的；第五站盖完，护照首映。
// 活动框架（activities.js）管：海报、加入、五天那排格子、「你在参加的」、章；这里管每一天的身体（ACT_MODES.ancient）。
// 日子是固定的（json 里 fixed: true）：大家 1 月 25 日一起出发（加入时 d0 = starts[0]），到了那天才开那一站；错过的天在格子里点开就能补走。
// 两种人：学中文的外国人（界面不是中文、在学中文）说中文那句，带拼音；其余的（中文界面学英语，西、日、阿界面也先照这一套）说英文那句。
// 数据：content-skeleton/activities/ancient_china_trip.json 的 an（stops 每站的老话、zd 中文词典、ed 英文词典、days 五天的内容；每一格都有 from，现在都是 system）。
// 存：act.v1 的 j.ancient_china_trip.an（每天做到哪、选了什么、写了什么，跟着账号同步）；你描的字、拍的照片、你的录音只存在这台手机上（IndexedDB hv.ancient）。
(function(){
const H = () => window.HVI || {};
const UI = () => (document.documentElement.lang || "zh").slice(0, 2), ZH = () => UI() === "zh";
const TR = en => { if (en == null || ZH()) return en; const D = (window.ACTS_I18N || {})[UI()] || {}, v = D[en]; if (v) return v;
  const ns = String(en).match(/\d+/g), w = ns && D[String(en).replace(/\d+/g, "{n}")]; if (w){ let i = 0; return w.replace(/\{n\}/g, () => ns[i++] || ""); } return en; };
const T = (zh, en) => ZH() ? zh : TR(en);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const AKx = () => window.AK || {};
const toast = t => { try { AKx().toast(t); } catch(e){} };
// 在学的语言："zh" = 学中文的外国人；"en" = 学英语（中文界面，西、日、阿界面也先走这一套）
const tgt = () => (H().LEARN === "zh" && !ZH()) ? "zh" : "en";
const L = o => !o ? "" : ZH() ? (o.zh || "") : TR(o.en || "");        // 双语对象取界面语言
const TL = o => !o ? "" : tgt() === "zh" ? o.zh : o.en;               // 取在学的语言
const PUN = /^[，。！？、「」『』：；…—（）,.!?'"’\-:;]+$/;
// 页面上的 class 都加 an- 前缀，免得跟别的模块撞名
const cls = h => h.replace(/class="([^"]*)"/g, (m, c) => 'class="' + c.split(/\s+/).filter(Boolean).map(x => /^(ak-|py-on)/.test(x) ? x : "an-" + x).join(" ") + '"');

let cx = null, A = null, N = null, R = null, S = null, DAY = 0, popT = 0;
const P = n => "https://img.heyvoyo.com/npc/" + n + "/face.webp";

// ── 你描的字、拍的照片、你的录音：只存在这台手机上（IndexedDB hv.ancient，键 = 天.art / 天.rec）──
const IDB = (mode, fn) => new Promise(res => { try { const r = indexedDB.open("hv.ancient", 1); r.onupgradeneeded = () => r.result.createObjectStore("f");
  r.onsuccess = () => { try { const tx = r.result.transaction("f", mode), q = fn(tx.objectStore("f")); tx.oncomplete = () => res(q && q.result); tx.onerror = () => res(null); } catch(e){ res(null); } }; r.onerror = () => res(null); } catch(e){ res(null); } });
const fget = k => IDB("readonly", s => s.get(k));
const fset = (k, v) => IDB("readwrite", s => s.put(v, k));
const ART = {}, REC = {};
async function loadFiles(){ for (let i = 0; i < 5; i++){ if (ART[i] === undefined){ const a = await fget(i + ".art"); ART[i] = a || null; } if (REC[i] === undefined){ const b = await fget(i + ".rec"); REC[i] = b ? URL.createObjectURL(b) : null; } } }

// ── 状态 ──
const fresh = () => ({heard: {}, open: null, task: false, lvl: "b", pick: 0, slots: [], och: "日", rec: false, recSim: false, recLen: 0, recText: "", sent: false, stamped: false, trans: "", own: "", ref: false, envOpen: false, hookOpen: false, cv: false, art: false});
const J = () => cx.st().j[A.id];
function load(){ const j = J(), s = (j && j.an) || {}; S = {P: [0, 1, 2, 3, 4].map(i => Object.assign(fresh(), (s.P || [])[i] || {}))}; }
function save(){ const o = cx.st(); if (!o.j[A.id]) return; const P_ = S.P.map(p => { const q = Object.assign({}, p); delete q.justStamped; return q; }); o.j[A.id].an = {P: P_}; cx.save(o); }
const join = () => { const o = cx.st(); if (!o.j[A.id]) o.j[A.id] = {d0: A.starts[0], done: {}}; cx.save(o); try { window.hvPx && window.hvPx({k: "actjoin", act: A.id}); } catch(e){} };

// ── 日子 ──
const dAt = k => { const d = new Date(A.starts[0] + "T12:00"); d.setDate(d.getDate() + k - 1); return d; };   // k = 0 领护照那天，1–5 五站
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function dLab(k){ const d = dAt(k); if (ZH()) return `${d.getMonth() + 1} 月 ${d.getDate()} 日 周${"日一二三四五六"[d.getDay()]}`;
  try { return new Intl.DateTimeFormat(UI() === "en" ? "en-GB" : UI(), {weekday: "short", day: "numeric", month: "short"}).format(d); } catch(e){ return ymd(d); } }
function dShort(k){ const d = dAt(k); if (ZH()) return `${d.getMonth() + 1} 月 ${d.getDate()} 日`; try { return new Intl.DateTimeFormat(UI() === "en" ? "en-GB" : UI(), {day: "numeric", month: "short"}).format(d); } catch(e){ return ymd(d); } }
const before = () => cx.today() < A.starts[0];
// 🗓️ 随到随开（json 里 schedule: "rolling"，2026-11-15 用户）：领护照那天就是第一站，以后一天一站，没走的随时补上；A.starts / A.pre / A.premiere 由 activities.js 按你加入的那天算好。
const RL = () => A.schedule === "rolling";
const isTmr = k => { const t = new Date(cx.today() + "T12:00"); t.setDate(t.getDate() + 1); return ymd(t) === ymd(dAt(k)); };

// ── 说话 ──
let curBtn = null, AU = null;
function speak(text, lang, btn){ try { const ss = window.speechSynthesis; if (AU){ AU.pause(); AU = null; } if (!ss){ toast(T("这台设备不能朗读", "No speech on this device")); return; }
  ss.cancel(); if (curBtn) curBtn.classList.remove("an-on");
  const u = new SpeechSynthesisUtterance(String(text).replace(/＿\d/g, "").replace(/\|/g, "")); u.lang = lang === "zh" ? "zh-CN" : "en-GB"; u.rate = lang === "zh" ? .82 : .92;
  const v = ss.getVoices().find(v => v.lang && v.lang.replace("_", "-").startsWith(u.lang.slice(0, 2)) && (lang !== "zh" || /CN|Hans/i.test(v.lang))); if (v) u.voice = v;
  if (btn){ btn.classList.add("an-on"); curBtn = btn; u.onend = u.onerror = () => btn.classList.remove("an-on"); } ss.speak(u); } catch(e){} }
function hush(){ try { speechSynthesis.cancel(); } catch(e){} if (AU){ try { AU.pause(); } catch(e){} AU = null; } }
const blip = () => { try { AKx().blip(880); } catch(e){} };
function thud(){ try { if (localStorage.getItem("hv.sound") === "off") return; const ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(140, ac.currentTime); o.frequency.exponentialRampToValueAtTime(50, ac.currentTime + .2); g.gain.setValueAtTime(.35, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .3); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + .32); } catch(e){} }
const confetti = () => { try { AKx().confetti(); } catch(e){} };

// ── 一句话：中文是用 | 切好的词（带拼音、能点），英文按空格切 ──
function enJoin(toks, fmt){ let out = "", q = false, prev = "";
  toks.forEach((t, i) => { let sp = " "; if (i === 0) sp = ""; else if (/^[,.!?;:]$/.test(t)) sp = ""; else if (t === "'"){ if (q) sp = ""; q = !q; } else if (prev === "'" && q) sp = ""; out += sp + fmt(t); prev = t; }); return out; }
function segText(seg){ if (/[A-Za-z]/.test(seg.replace(/china|moon|tinto|phra chan/g, "")) || /^[A-Z]/.test(seg)) return enJoin(seg.split("|"), t => /^＿\d$/.test(t) ? "…" : t);
  return seg.split("|").join("").replace(/＿\d/g, "……"); }
const enSeg = s => String(s).split(/\s+/).filter(Boolean).join("|");
function segHTML(seg, lang, c){ const toks = String(seg).split("|"), ZD = N.zd; let h = "";
  if (lang === "zh"){ for (const t of toks){
      if (/^＿\d$/.test(t)){ h += `<span class="blank">　</span>`; continue; }
      if (PUN.test(t)){ h += `<span class="pn">${esc(t)}</span>`; continue; }
      const d = ZD[t], sy = d ? d[0].replace(/-/g, " ").split(" ") : [];
      if (d && t.length > 1 && sy.length === t.length) h += `<span class="rw" data-w="${esc(t)}">${[...t].map((ch, k) => `<ruby>${esc(ch)}<rt>${esc(sy[k])}</rt></ruby>`).join("")}</span>`;
      else if (d) h += `<ruby data-w="${esc(t)}">${esc(t)}<rt>${esc(d[0])}</rt></ruby>`;
      else h += `<span class="w" data-w="${esc(t)}">${esc(t)}</span>`; } }
  else h = enJoin(toks, t => /^＿\d$/.test(t) ? `<span class="blank">　</span>` : /^[,.!?;:'—]$/.test(t) ? `<span class="pn">${esc(t)}</span>` : `<span class="w" data-w="${esc(t)}">${esc(t)}</span>`);
  return `<div class="seg ${lang === "en" ? "en" : ""} ${c || ""}" lang="${lang === "zh" ? "zh-CN" : "en"}" dir="ltr" data-nopy>${h}</div>`; }
const tgtHTML = (t, c) => tgt() === "zh" ? segHTML(t, "zh", c) : segHTML(enSeg(t), "en", c);
const tgtText = t => tgt() === "zh" ? segText(t) : t;
const plyBtn = (text, lang) => `<button class="ply" data-say="${esc(text)}" data-lang="${lang}" aria-label="${esc(T("听", "listen"))}">🔊</button>`;
const tgtPly = t => plyBtn(tgtText(t), tgt());
// 地图上的一句切成词（沿用词典，找不到就按字）
let ZK = null;
function seg22(s){ ZK = ZK || Object.keys(N.zd).sort((a, b) => b.length - a.length); const out = []; let j = 0;
  while (j < s.length){ const ch = s[j]; if (PUN.test(ch)){ out.push(ch); j++; continue; }
    if (/[A-Za-z]/.test(ch)){ let k = j; while (k < s.length && /[A-Za-z]/.test(s[k])) k++; out.push(s.slice(j, k)); j = k; continue; }
    if (ch === " "){ j++; continue; } const k = ZK.find(w => s.startsWith(w, j)); if (k){ out.push(k); j += k.length; } else { out.push(ch); j++; } }
  return out.join("|"); }
const bdi = s => `<bdi>${esc(s)}</bdi>`;
// 站名、城市名：中文界面只写中文；别的界面英文（或界面语言）在前，中文放旁边
const zhBeside = z => `<span class="zhb" lang="zh-CN" dir="ltr" data-nopy>${esc(z)}</span>`;
const nmHTML = (z, e) => ZH() ? `<span lang="zh-CN" data-nopy>${esc(z)}</span>` : `<bdi>${esc(TR(e))}</bdi> ${zhBeside(z)}`;
const nmText = (z, e) => ZH() ? z : TR(e) + " " + z;
// 离春节几天：按当天日期算，过了就换一句
function cnyLine(){ const c = A.cny; if (!c || RL()) return "";   // rolling：哪天走都行，不倒数离春节几天
  const n = Math.round((Date.parse(c + "T12:00") - Date.parse(cx.today() + "T12:00")) / 864e5);
  return n > 1 ? T(`再过 ${n} 天就过年了。`, `${n} days to Chinese New Year.`) : n === 1 ? T("明天就过年了。", "Chinese New Year is tomorrow.") : n === 0 ? T("今天过年，新年快乐！", "It's Chinese New Year today — Happy New Year!") : T("春节已经过了，新年快乐！", "Chinese New Year has passed — Happy New Year!"); }
const allDone = () => S.P.every(p => p.stamped);
// 第五天的结尾：离春节几天 + 护照收在哪（走满五站才说）+ 下一条路线
const hook5 = () => [cnyLine(), allDone() ? T("这本护照收在「活动」页的「你做完的」里，随时能再翻开。", "Your passport is kept under “Finished” on the Activities page — open it again anytime.") : T("走满五站，这本护照会收进「活动」页的「你做完的」里。", "Walk all five stops and your passport goes under “Finished” on the Activities page."), L(D_(4).hook)].filter(Boolean).join(" ");

// ── 点词：中文出拼音和意思（意思按界面语言：中文词典只有英文，西日阿界面先给英文），英文词出中文意思 ──
function showPop(el, html){ let pop = document.getElementById("anPop"); if (!pop){ pop = document.createElement("div"); pop.id = "anPop"; pop.className = "an-pop"; pop.dataset.nopy = ""; document.body.appendChild(pop); }
  pop.innerHTML = cls(html); pop.classList.add("an-on"); const r = el.getBoundingClientRect();
  let x = r.left + r.width / 2 - pop.offsetWidth / 2, y = r.top - pop.offsetHeight - 6; x = Math.max(8, Math.min(x, innerWidth - pop.offsetWidth - 8)); if (y < 4) y = r.bottom + 6;
  pop.style.left = x + "px"; pop.style.top = y + "px"; clearTimeout(popT); popT = setTimeout(() => { pop.classList.remove("an-on"); el.classList.remove("an-hl"); }, 2200); }
function wordTap(w){ const word = w.dataset.w, isEn = !!w.closest(".an-seg.an-en"); speak(word, isEn ? "en" : "zh");
  document.querySelectorAll(".an-seg .an-hl").forEach(x => x.classList.remove("an-hl")); w.classList.add("an-hl");
  let html; if (isEn){ const m = N.ed[word.toLowerCase().replace(/[^a-z' ]/g, "").trim()]; html = `<b class="en" lang="en" dir="ltr">${esc(word)}</b>${m && ZH() ? `<i>${esc(m)}</i>` : `<i>${esc(T("点一下就是听", "tap to hear"))}</i>`}`; }
  else { const d = N.zd[word]; html = `<b lang="zh-CN" dir="ltr">${esc(word)}</b>${d ? `<i dir="ltr">${esc(d[0])}</i><span dir="auto">${esc(TR(d[1]))}</span>` : ""}`; }
  showPop(w, html); }

// ── 路线图 ──
function proj([lon, lat]){ const x = lon < 104 ? 16 + (lon - 74) / 30 * 96 : 112 + (lon - 104) / 19 * 222; return [x, 178 - (lat - 28.5) / (41 - 28.5) * 160]; }
const LBL = [[119, 38.5, "middle"], [111.6, 35.3, "end"], [90, 36.9, "middle"], [119.2, 28.7, "middle"], [107.2, 29.0, "middle"]];
const SOFF = [[121.6, 36.6], [109.6, 32.4], [84, 36.2], [121.9, 31.6], [100.5, 32.6]];
function mapSVG(day){ const ST_ = N.stops, pts = []; ST_.forEach((d, i) => d.stops.forEach(s => pts.push({i, p: proj(s.ll)})));
  const path = "M" + pts.map(o => o.p.map(v => v.toFixed(1)).join(",")).join(" L");
  let h = `<svg viewBox="0 0 350 196" role="img" aria-label="${esc(T("你的路线", "Your route"))}" dir="ltr"><path d="${path}" fill="none" stroke="#c9b98f" stroke-width="1.3" stroke-dasharray="3 4"/>`;
  pts.forEach(o => { const done = S.P[o.i].stamped, td = o.i === day - 1, col = done ? "#14305c" : td ? "#e2552f" : "#cfc4a8";
    h += `<circle cx="${o.p[0]}" cy="${o.p[1]}" r="${td ? 4 : 3}" fill="${col}">${td && !done ? '<animate attributeName="r" values="3;5.5;3" dur="1.6s" repeatCount="indefinite"/>' : ""}</circle>`; });
  ST_.forEach((d, i) => { const done = S.P[i].stamped, td = i === day - 1, lab = ZH() ? d.city.zh : TR(d.city.en), lp = proj(LBL[i]), sp = proj(SOFF[i]);
    h += `<text x="${lp[0]}" y="${lp[1]}" text-anchor="${LBL[i][2]}" font-size="11" font-weight="800" fill="${done ? "#14305c" : td ? "#e2552f" : "#a89c80"}" font-family="Georgia,'Noto Serif SC',serif">${esc(lab)}</text>`;
    if (done) h += `<g transform="translate(${sp[0] - 10},${sp[1] - 10}) rotate(-8 10 10)"><rect width="20" height="20" rx="3" fill="#fffdf7" stroke="#b5332a" stroke-width="1.6"/><text x="10" y="15" text-anchor="middle" font-size="13" fill="#b5332a" font-weight="900" font-family="'Noto Serif SC','Songti SC',serif">${esc(N.seal[i][0][0])}</text></g>`; });
  return h + "</svg>"; }
const sealHTML = (i, c, alt) => { const s = alt || N.seal[i]; return `<div class="seal ${c || ""}" data-nopy><div class="s1">${esc(s[0])}</div><div class="s2">${esc(s[1])}</div>${s[3] ? `<div class="s3">${s[3]}</div>` : ""}</div>`; };

// ── 画画板 ──
const ORACLE = {"日": "M60 40 Q50 40 50 60 L50 140 Q50 160 70 160 L130 160 Q150 160 150 140 L150 60 Q150 40 130 40 Z M78 100 L122 100", "山": "M40 150 L160 150 M50 150 L50 105 M100 150 L100 50 M150 150 L150 105", "水": "M100 30 Q80 60 100 90 Q120 120 100 150 Q90 165 96 175 M62 60 L72 76 M60 112 L70 128 M138 60 L128 76 M140 112 L130 128"};
let pad = null;
function mountPad(kind, ch){ const cv = R.querySelector("#anCv"); if (!cv) return; const r = cv.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext("2d"); g.scale(dpr, dpr); g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#1b1b1b";
  let down = false, last = null, len = 0; const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = e => { down = true; last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch(x){} };
  cv.onpointermove = e => { if (!down) return; const p = pos(e), d = Math.hypot(p[0] - last[0], p[1] - last[1]); g.lineWidth = Math.max(5, 13 - d * .35); g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p; len += d;
    if (len > 160 && !pad.ok){ pad.ok = true; const b = R.querySelector("#anPadDone"); if (b){ b.disabled = false; b.classList.add("an-say"); } } };
  cv.onpointerup = cv.onpointercancel = () => { down = false; };
  pad = {cv, g, kind, ch, ok: false}; }
function padImage(){ const s = 360, o = document.createElement("canvas"); o.width = o.height = s; const g = o.getContext("2d");
  g.fillStyle = "#fffef9"; g.fillRect(0, 0, s, s); g.strokeStyle = "rgba(181,51,42,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke();
  g.fillStyle = "rgba(20,48,92,.12)"; g.strokeStyle = "rgba(20,48,92,.14)";
  if (pad.kind === "trace"){ g.font = `${s * .78}px "Ma Shan Zheng","Noto Serif SC",serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(pad.ch, s / 2, s / 2 + s * .04); }
  else { g.save(); g.scale(s / 200, s / 200); g.lineWidth = 12; g.lineCap = "round"; g.stroke(new Path2D(ORACLE[pad.ch])); g.restore(); }
  g.drawImage(pad.cv, 0, 0, s, s); return o.toDataURL("image/jpeg", .85); }
async function setArt(i, url){ ART[i] = url; S.P[i].art = true; S.P[i].task = true; await fset(i + ".art", url); save(); render(); blip(); }

// ── 你的那一句 ──
const D_ = i => N.days[i];
const sayData = i => D_(i).say[tgt()];
function myLine(i){ const st = S.P[i], sd = sayData(i);
  if (st.lvl === "b") return sd.b.opts[st.pick][1];
  if (st.lvl === "m"){ let s = sd.m.st, ok = true; sd.m.slots.forEach((sl, k) => { const v = st.slots[k]; if (v == null) ok = false; else s = s.replace("＿" + (k + 1), sl[v]); }); return ok ? s : null; }
  return null; }   // 比较流利：说你自己的
function myLineText(i){ const l = myLine(i); if (l) return segText(l); const o = (S.P[i].own || "").trim(); if (o) return o; const r = (S.P[i].recText || "").trim(); if (r) return r; return T("（我自己说的，在录音里）", "(my own words, in my recording)"); }
function myLineHTML(i, c){ const l = myLine(i); if (l) return segHTML(l, tgt(), c || "sm"); const o = (S.P[i].own || S.P[i].recText || "").trim();
  if (o) return tgt() === "zh" ? segHTML(seg22(o), "zh", c || "sm") : segHTML(enSeg(o), "en", c || "sm"); return `<div class="need" style="text-align:start;margin:0">${esc(myLineText(i))}</div>`; }
function reactOf(i){ const d = D_(i), st = S.P[i]; let k = "_";
  if (d.rk && st.lvl !== "f"){ const m = d.rk[tgt()]; k = st.lvl === "b" ? m.b[st.pick] : (st.slots[0] != null ? m.m[st.slots[0]] : "_"); }
  return d.react[k] || d.react._; }
const learnTag = () => tgt() === "zh" ? T("在学中文", "learning Chinese") : T("在学英语", "learning English");
const worldOf = i => D_(i).world[tgt()];
const envOf = i => D_(i).env ? D_(i).env[tgt()] : null;
function playMine(i, btn){ const st = S.P[i]; hush(); if (REC[i]){ AU = new Audio(REC[i]); if (btn){ btn.classList.add("an-on"); AU.onended = () => btn.classList.remove("an-on"); } AU.play().catch(() => {}); }
  else speak(myLineText(i), tgt(), btn); }

// ── 画 ──
const brand = () => `<div class="hd"><span class="brand" data-nopy>HEYVOYO</span></div>`;
const hostWho = () => `<div class="who"><div class="ava" aria-hidden="true" data-nopy>娜</div><div><b>🎭 ${esc(T("李娜", "Li Na"))}</b><small>${esc(L(N.host.who))}</small></div></div>`;
const emb = full => `<svg class="emb" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#c9a861" stroke-width="2"/>${full ? `<circle cx="50" cy="50" r="36" fill="none" stroke="#c9a861" stroke-width="1" stroke-dasharray="2 3"/>` : ""}<path d="M22 60 Q35 30 50 48 T78 40" fill="none" stroke="#c9a861" stroke-width="2.4" stroke-linecap="round"/>${full ? `<circle cx="22" cy="60" r="3" fill="#c9a861"/><circle cx="78" cy="40" r="3" fill="#c9a861"/>` : ""}</svg>`;
const meanOf = t => { const m = tgt() === "zh" ? TR(t.en) : ZH() ? t.zh.split("|").join("") : TR(t.en); return m && m !== TL(t) ? `<div class="tr" dir="auto">${esc(m)}</div>` : ""; };

function coverDay(){ const j = J(), pre = N.pre, tmr = cx.today() === A.pre;
  let h = brand() + `<div style="text-align:center;padding:0 18px"><div class="${ZH() ? "zhs" : "geo"}" style="font-size:${ZH() ? 18 : 20}px;font-weight:${ZH() ? 900 : 700};color:var(--ink)">${esc(T(A.t.zh, A.t.en))}</div>
  <div style="font-size:13px;color:var(--soft);margin-top:2px">${esc(RL() ? (j ? T("五天，一天一座城 · 没走的随时补上", "Five days, one city a day · catch up on any stop anytime") : T("五天，一天一座城 · 今天领护照，今天就出发", "Five days, one city a day · get your passport and set off today")) : tmr ? T(`五天，一天一座城 · 明天（${dShort(1)}）出发`, `Five days, one city a day · leaves tomorrow, ${dShort(1)}`) : before() ? T(`五天，一天一座城 · ${dShort(1)} 一起出发`, `Five days, one city a day · we all leave on ${dShort(1)}`) : T("五天，一天一座城 · 大家已经出发了，你也能接着走", "Five days, one city a day · everyone's on the road — you can still join"))}</div></div>`;
  if (!j){
    const intro = RL() && pre.introR ? pre.introR : tmr ? pre.intro : pre.intro2;
    h += `<button class="cover" id="anGetP" aria-label="${esc(T("点一下，领你的护照", "Tap to collect your passport"))}" data-nopy>${emb(1)}<div class="ct1">通关文牒</div><div class="ct2">Passport · Ancient China</div><div class="ct3">HEYVOYO</div><div class="tap">${esc(T("点一下，领你的护照", "Tap to collect your passport"))}</div></button>`;
    h += `<div class="host" style="margin-top:18px"><div class="body" style="margin-top:0;padding-top:14px">${hostWho()}<div style="display:flex;gap:8px;align-items:flex-start"><div class="q" style="flex:1;min-width:0">${tgtHTML(TL(intro), "sm")}</div>${tgtPly(TL(intro))}</div>${meanOf(intro)}</div></div>`;
    return h; }
  h += `<div class="pg"><div class="pgh"><div><div class="k">${esc(T("持照人", "Bearer"))}</div><div class="city" style="font-size:22px">${esc(T("你", "You"))}<small>${esc(T(tgt() === "zh" ? "学中文 · 从你在的地方出发" : "学英语 · 从你在的地方出发", tgt() === "zh" ? "learning Chinese · from wherever you are" : "learning English · from wherever you are"))}</small></div></div>${sealHTML(0, "round", ["起", "DEPART", "", "⛵"])}</div>
    <div class="bearer" style="padding-top:0"><div class="ph">🧳</div><dl><dt>${esc(T("路线", "Route"))}</dt><dd>${esc(T("古代中国", "Ancient China"))}</dd><dt>${esc(T("日期", "Dates"))}</dt><dd>${bdi(dShort(1) + " – " + dShort(5))}</dd><dt>${esc(T("领队", "Guide"))}</dt><dd>🎭 ${esc(T("李娜", "Li Na"))}</dd><dt>${esc(T("同行", "Fellow traveller"))}</dt><dd>🎭 ${bdi(pre.mate)}</dd></dl></div>
    <div class="mrz" dir="ltr">P&lt;HVY&lt;ANCIENT&lt;CHINA&lt;&lt;QUFU&lt;&lt;&lt;MEISHAN&lt;&lt;&lt;&lt;${A.starts[0].slice(2).replace(/-/g, "")}${A.premiere.slice(2).replace(/-/g, "")}</div></div>
    <div class="sec"><h3 class="${ZH() ? "" : "en"}">${esc(T("五页行程", "Your five pages"))}</h3></div>
    <div class="itin">${N.stops.map((d, i) => `<div><b>${nmHTML(d.city.zh, d.city.en)}</b><span>${esc(dLab(i + 1))} · ${esc(L(d.theme))}</span></div>`).join("")}</div>
    <button class="env ${S.tmrOpen ? "" : "shut"}" id="anTmr"><div class="k">${esc(tmr ? T("明天", "Tomorrow") : dLab(1))}</div><div class="t ${ZH() ? "" : "en"}">${esc(L(pre.tmr))}</div><span class="open">${esc(T("点开偷看", "Tap to peek"))}</span></button>`;
  if (!before()) h += `<div class="stampzone"><button class="btn say big" id="anGo1">${esc(T("出发 · 第一站 ›", "Set off · first stop ›"))}</button></div>`;
  else h += `<div class="stampzone"><div class="need">${esc(T(`${dShort(1)}，第一站开门。`, `The first stop opens on ${dShort(1)}.`))}</div></div>`;
  return h; }

function dayPage(i){ const d = D_(i), st = S.P[i], Rr = N.stops[i];
  let h = brand();
  if (!st.cv){
    h += `<div style="text-align:center;font-size:13px;color:var(--soft)">${esc(dLab(i + 1))} · ${esc(T("第 " + (i + 1) + " 站", "Stop " + (i + 1) + " of 5"))}</div>
    <button class="cover" id="anOpenCover" aria-label="${esc(T("点开今天这一页", "Tap to open today's page"))}" data-nopy>${emb(0)}<div class="ct1">通关文牒</div><div class="ct2">${esc(cx.today() === ymd(dAt(i + 1)) ? T("今天：" + Rr.city.zh, "Today: " + nmText(Rr.city.zh, Rr.city.en)) : T("补走：" + Rr.city.zh, "Catch up: " + nmText(Rr.city.zh, Rr.city.en)))}</div><div class="ct3">HEYVOYO</div><div class="tap">${esc(cx.today() === ymd(dAt(i + 1)) ? T("点开今天这一页", "Tap to open today's page") : T("点开这一页", "Open this page"))}</div></button>`;
    return h; }
  h += `<div class="pg"><div class="pgh"><div><div class="k">${esc(T("第 " + (i + 1) + " 页 · " + Rr.theme.zh, "Page " + (i + 1) + " · " + TR(Rr.theme.en)))}</div><div class="city">${ZH() ? `<span lang="zh-CN" data-nopy>${esc(Rr.city.zh)}</span><small>${esc(Rr.city.en)}</small>` : `<bdi>${esc(TR(Rr.city.en))}</bdi><small lang="zh-CN" dir="ltr" data-nopy>${esc(Rr.city.zh)}</small>`}</div><div class="date" style="text-align:start;margin-top:6px">${esc(dLab(i + 1))}</div></div>
   <div class="slot ${st.stamped ? "hasstamp" : ""}" id="anSlot">${st.stamped ? sealHTML(i, st.justStamped ? "slam" : "") : T("章盖<br>这里", "stamp<br>goes here")}</div></div>
   <div class="map">${mapSVG(i + 1)}</div><div class="mapcap"><span>${esc(T("你的路线", "Your route"))}</span><span>${Rr.stops.map(s => esc(L(s.t))).join(" · ")}</span></div></div>`;
  h += `<div class="host"><div class="bg" style="background-image:url(${esc(N.hostbg)})"><span class="bgcap">${esc(T("故宫，李娜上班的地方", "The Palace Museum, where Li Na works"))}</span></div><div class="body">${hostWho()}
   <div style="display:flex;gap:8px;align-items:flex-start;margin-top:8px"><div style="flex:1;min-width:0"><div class="q">${tgtHTML(TL(d.host), "sm")}</div>${meanOf(d.host)}</div>${tgtPly(TL(d.host))}</div></div></div>`;
  h += `<div class="sec"><h3 class="${ZH() ? "" : "en"}">${esc(T("今天的几站", "Today's stops"))}</h3><span>${esc(T("点一站，听它的一句", "tap one to hear its line"))}</span></div><div class="stops">`;
  Rr.stops.forEach((s, k) => { h += `<button class="tk ${st.heard[k] ? "heard" : ""} ${st.open === k ? "sel" : ""}" data-stop="${k}"><div class="im" style="background-image:url(${esc(s.img)})"></div><div class="tx"><div class="nm">${nmHTML(s.n, s.ne || s.n)}</div><div class="pl">${esc(L(s.t))}</div></div><span class="hrd" data-nopy>听</span></button>`; });
  h += `</div>`;
  if (st.open != null){ const s = Rr.stops[st.open], z = tgt() === "zh";
    h += `<div class="stopcard"><div class="line">${z ? segHTML(seg22(s.say[0]), "zh") : segHTML(enSeg(s.say[2]), "en")}${plyBtn(z ? s.say[0] : s.say[2], z ? "zh" : "en")}</div>
     <div class="mean ${z ? "" : "zh"}" dir="auto">${z ? esc(TR(s.say[2])) : `<span lang="zh-CN" dir="ltr" data-nopy>${esc(s.say[0])}</span><span style="display:block;font:12px -apple-system,sans-serif;color:var(--soft)" dir="ltr">${esc(s.say[1])}</span>`}</div>
     <div class="core">${esc(L(s.core))}</div></div>`; }
  h += `<div class="sec"><h3 class="${ZH() ? "" : "en"}">${esc(T("今天真去做", "Today, really do it"))}</h3></div>` + taskBlock(i);
  h += `<div class="sec"><h3 class="${ZH() ? "" : "en"}">${esc(T("说你自己的一句", "Say your own line"))}</h3><span>${esc(T("帮多少，你挑", "pick how much help you want"))}</span></div>` + sayBlock(i);
  if (!st.stamped){ const can = st.task && st.rec, miss = [];
    if (!st.task) miss.push(T("今天那件事", "do today's thing")); if (!st.rec) miss.push(T("录你的那句", "record your line"));
    h += `<div class="stampzone"><button class="btn say big" id="anStampB" ${can ? "" : "disabled"}>${esc(T("盖章", "Stamp this page"))} 🔖</button><div class="need">${esc(can ? T("你做的和你的声音，会贴在这一页。", "Your thing and your voice go on this page.") : T("还差：", "Still to go: ") + miss.join(T("、", " and ")))}</div></div>`; }
  else h += afterStamp(i);
  return h; }

function taskBlock(i){ const d = D_(i), st = S.P[i], t = d.task;
  let h = `<div class="task"><div class="tt ${ZH() ? "" : "en"}">${esc(L(t.t))}</div><p>${esc(L(t.p))}</p>`;
  if (st.task){ const och = st.och || "日";
    const what = {trace: T("你的「友」字，贴在这一页", "Your 友, on today's page"), oracle: T("你画的「" + och + "」，贴在这一页", "Your " + och + ", on today's page"), send: T("发出去了。发给谁，只有你知道。", "Sent. Who to is yours to know."), photo: T("你的那一杯，贴在这一页", "Your cup, on today's page"), moon: T("你真去看了。", "You went and looked.")}[t.kind];
    const art = ART[i];
    h += `<div class="done">${art ? `<img src="${esc(art)}" alt="">` : `<span style="font-size:34px">${t.kind === "send" ? "📮" : t.kind === "moon" ? "🌗" : "🖼️"}</span>`}<div><b>✓ ${esc(what)}</b><small>${t.kind === "moon" && st.trans ? esc(st.trans) : !art && st.art ? esc(T("画和照片只存在当时那台手机上。", "Your picture is on the phone you made it on.")) : esc(T("好，真的做了。", "Nice — that's the real thing done."))}</small></div></div>`;
    if (t.kind === "moon" && !st.trans) h += transInput();
    return h + `</div>`; }
  if (t.kind === "trace" || t.kind === "oracle"){ const och = st.och || "日";
    if (t.kind === "oracle") h += `<div class="row" style="margin-bottom:4px">${["日", "山", "水"].map(c => `<button class="chip ${och === c ? "on" : ""}" data-och="${c}"><span class="zhs" lang="zh-CN" data-nopy>${c}</span><small>${esc(tgt() === "zh" ? N.zd[c][0] + " · " + TR(N.zd[c][1].split(";")[0]) : ZH() ? {"日": "太阳", "山": "山", "水": "水"}[c] : N.zd[c][0] + " · " + TR(N.zd[c][1].split(";")[0]))}</small></button>`).join("")}</div>`;
    const guide = t.kind === "trace" ? `<div class="guide" data-nopy>友</div>` : `<svg class="guide" viewBox="0 0 200 200"><path d="${ORACLE[och]}" fill="none" stroke="rgba(20,48,92,.15)" stroke-width="12" stroke-linecap="round"/></svg>`;
    h += `<div class="pad">${guide}<canvas id="anCv"></canvas></div>
     <div class="row" style="justify-content:center"><button class="btn ghost" id="anPadClr">${esc(T("重来", "Again"))}</button><button class="btn" id="anPadDone" disabled>${esc(T("贴到这一页", "Stick it on the page"))}</button>
     <span class="btn ghost fileb">📷 ${esc(T("拍我纸上的", "Photo of my paper"))}<input type="file" accept="image/*" capture="environment" data-photo="${i}"></span></div>`; }
  else if (t.kind === "send") h += `<div class="need" style="margin:0;text-align:start">${esc(T("先在下面拼好你的那句，然后：", "Make your line in the box below first, then:"))}</div><div class="row" style="margin-top:8px"><button class="btn say" id="anSendB">📤 ${esc(T("发给 TA", "Send it to them"))}</button></div>`;
  else if (t.kind === "photo") h += `<div class="row"><span class="btn say fileb">📷 ${esc(T("拍我的那一杯", "Photo of my cup"))}<input type="file" accept="image/*" capture="environment" data-photo="${i}"></span></div>`;
  else if (t.kind === "moon") h += `<div class="moon"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#2a3552"/><path d="M32 6 A26 26 0 0 1 32 58 Z" fill="#efe6c8" transform="rotate(180 32 32)"/></svg><div>${RL() ? `<b>${esc(T("今晚，去看一眼月亮", "Tonight, go and look at the moon"))}</b><small>${esc(T("什么样的月亮都行，看得到就看一眼；看不到，拍窗外也算。", "Whatever the moon looks like, go and look if you can see it — if not, a photo of your window counts."))}</small>` : cx.today() === ymd(dAt(5)) ? `<b>${esc(T("今天是下弦月", "Tonight: a last-quarter moon"))}</b><small>${esc(T("半夜前后才升起，到了早上还挂在天上——睡得晚就睡前看，不然明天一早看。", "It only rises around midnight, and it's still up in the sky in the morning — so look late before bed, or first thing tomorrow."))}</small>` : `<b>${esc(T(dShort(5) + "那晚是下弦月", "The night of " + dShort(5) + " had a last-quarter moon"))}</b><small>${esc(T("今晚是什么月亮都行，看得到就看一眼；看不到，拍窗外也算。", "Whatever the moon is like tonight, go and look if you can see it — if not, a photo of your window counts."))}</small>`}</div></div>
     <div class="row"><button class="btn say" id="anMoonB">🌗 ${esc(T("我看到了", "I saw it"))}</button><span class="btn ghost fileb">📷 ${esc(T("看不到，拍窗外", "Can't see it — my window"))}<input type="file" accept="image/*" capture="environment" data-photo="${i}"></span></div>`;
  return h + `</div>`; }
const transInput = () => `<div style="margin-top:8px"><div class="lab">${esc(tgt() === "zh" ? T("用你的语言你会怎么翻？", "How would you translate your line into your own language?") : T("用英文怎么翻？", "How would you say it in English?"))}</div><input class="txtin" id="anTransIn" dir="auto" placeholder="${esc(tgt() === "zh" ? T("用你的语言写……", "e.g. in your own language…") : T("比如：Moonlight in front of my bed…", "e.g. Moonlight in front of my bed…"))}"><div class="row" style="margin-top:6px"><button class="btn ghost" id="anTransB">${esc(T("写进护照", "Write it in"))}</button></div></div>`;

function sayBlock(i){ const st = S.P[i], sd = sayData(i), tl = tgt();
  let h = `<div class="sayb"><div class="lv">${[["b", "刚开始", "Just starting"], ["m", "能聊日常", "Everyday chat"], ["f", "比较流利", "Quite fluent"]].map(([k, z, e]) => `<button data-lvl="${k}" class="${st.lvl === k ? "on" : ""}">${esc(T(z, e))}</button>`).join("")}</div>`;
  if (st.lvl === "b"){
    h += `<div class="lab">${esc(T("选你的", "Choose yours"))}</div><div class="row">${sd.b.opts.map((o, k) => `<button class="chip ${st.pick === k ? "on" : ""}" data-pick="${k}"><span class="${/[一-龥]/.test(o[0]) ? "zhs" : ""}" lang="zh-CN" data-nopy>${esc(o[0])}</span>${tl === "zh" && N.zd[o[0]] ? `<small>${esc(TR(N.zd[o[0]][1].split(";")[0]))}</small>` : ""}</button>`).join("")}</div>
     <div class="lab">${esc(T("你的这句", "Your line"))}</div><div class="my">${segHTML(sd.b.opts[st.pick][1], tl)}${plyBtn(segText(sd.b.opts[st.pick][1]), tl)}</div>
     <div class="lab">${esc(T("要用的词 · 点了听", "Words you need · tap to hear"))}</div><div class="words">${sd.b.words.map(w => { const z = tl === "zh" ? N.zd[w] : null; return `<button class="wd" data-say="${esc(w)}" data-lang="${tl}"><b class="${tl === "en" ? "en" : ""}" lang="${tl === "zh" ? "zh-CN" : "en"}" dir="ltr" data-nopy>${esc(w)}</b>${z ? `<span dir="ltr">${esc(z[0])}</span> · ${esc(TR(z[1]))}` : ZH() ? esc(N.ed[w.toLowerCase()] || "") : ""}</button>`; }).join("")}</div>`; }
  else if (st.lvl === "m"){
    h += `<div class="lab">${esc(T("开头", "Start with"))}</div><div class="my">${segHTML(sd.m.st, tl, "sm")}${plyBtn(segText(sd.m.st.replace(/＿\d/g, "")), tl)}</div>`;
    sd.m.slots.forEach((sl, k) => { h += `<div class="lab">${esc(T("第 " + (k + 1) + " 个空可以填", "Idea words for blank " + (k + 1)))}</div><div class="row">${sl.map((c, j) => `<button class="chip ${st.slots[k] === j ? "on" : ""}" data-slot="${k}" data-j="${j}"><span class="${tl === "zh" ? "zhs" : ""}" lang="${tl === "zh" ? "zh-CN" : "en"}" dir="ltr" data-nopy>${esc(segText(c))}</span></button>`).join("")}</div>`; });
    const l = myLine(i);
    h += `<div class="lab">${esc(T("你的这句", "Your line"))}</div>${l ? `<div class="my">${segHTML(l, tl)}${plyBtn(segText(l), tl)}</div>` : `<div class="need" id="anBlankHint" style="text-align:start">${esc(T("把空填上——或者直接用自己的话录下来，都能盖章。", "Fill the blanks — or just record it in your own words. Either way you can stamp."))}</div>`}`; }
  else {
    h += `<div class="lab">${esc(T("只有问题", "Just the question"))}</div><div class="my">${segHTML(sd.f.q, tl, "sm")}${plyBtn(segText(sd.f.q), tl)}</div>${sd.f.qe && !ZH() ? `<div class="need" style="text-align:start">${esc(TR(sd.f.qe))}</div>` : ""}
     <div class="need" style="text-align:start">${esc(T("说 30 秒左右。没有要照着念的，说你自己的。", "Talk for about 30 seconds. Nothing to copy — it's your story."))}</div>
     <div class="lab">${esc(T("把你要说的写下来（可以不写，写了会印进护照）", "Write down what you'll say (optional — it goes in your passport)"))}</div><textarea class="txtin" id="anOwnIn" rows="2" dir="auto" placeholder="${esc(tl === "zh" ? "在我们那儿……" : "Where I live…")}">${esc(st.own || "")}</textarea>
     ${st.ref ? `<div class="ref"><small>${esc(T("一种说法", "One way to say it"))}${sd.f.refBy ? " · " + esc(L(sd.f.refBy) || sd.f.refBy.en || sd.f.refBy.zh || "") : ""}</small><div style="display:flex;gap:8px">${segHTML(sd.f.ref, tl, "sm")}${plyBtn(segText(sd.f.ref), tl)}</div></div>` : `<button class="btn ghost" id="anRefB" style="margin-top:8px">${esc(T("看看一种说法", "Peek at one way to say it"))}</button>`}`; }
  if (D_(i).send) h += `<div class="row" style="margin-top:10px"><button class="btn ghost" id="anSendB2">📤 ${esc(st.sent ? T("发过了 ✓ 再发一次", "Sent ✓ — send again") : i === 2 ? T("发给 TA", "Send it to them") : T("把这句发给远方的人", "Send this line to someone far away"))}</button></div>`;
  h += `<div id="anMic"></div>`;
  if (st.rec) h += `<div class="row" style="margin-top:6px"><button class="ply" data-mine="${i}" aria-label="${esc(T("听我的", "play mine"))}">▶</button><span class="need" style="margin:0;text-align:start">${esc(REC[i] ? T("你的录音", "Your recording") + (st.recLen ? " · " + st.recLen + "″" : "") : st.recSim ? T("没录到声音（这台设备没有麦克风或没有允许），▶ 先用机器朗读你的那句。", "No sound was recorded (no microphone, or it wasn't allowed) — ▶ plays a machine voice reading your line.") : T("录音在你录的那台手机上，▶ 先用机器朗读。", "Your recording is on the phone you made it on — ▶ plays a machine voice for now."))}</span></div>`;
  return h + `</div>`; }

function afterStamp(i){ const d = D_(i), st = S.P[i];
  let h = `<div class="sec"><h3 class="${ZH() ? "" : "en"}">${esc(T("同一页，世界各地的人", "Same page, around the world"))}</h3></div><div class="wall">`;
  h += `<div class="wl me"><div class="ava" style="width:42px;height:42px;font-size:18px;background:#fff">🧳</div><div style="flex:1;min-width:0"><div class="nm">${esc(T("你", "You"))}</div><div class="sd">${myLineHTML(i)}<button class="ply" data-mine="${i}">▶</button></div></div></div>`;
  worldOf(i).forEach((w, k) => { h += `<div class="wl" style="animation-delay:${.15 * (k + 1)}s"><img src="${esc(P(w.p))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div style="flex:1;min-width:0"><div class="nm">🎭 ${bdi(w.nm)} <small>· ${esc(L(w.c))} · ${esc(learnTag())}</small></div><div class="did">${esc(L(w.did))}</div><div class="sd">${tgtHTML(w.s, "sm")}${tgtPly(w.s)}</div></div></div>`; });
  const r = reactOf(i);
  h += `</div><div class="react"><div class="ava" data-nopy>娜</div><div><b>🎭 ${esc(T("李娜", "Li Na"))}</b>${tgtHTML(TL(r), "sm")}${meanOf(r).replace('class="tr"', 'class="tr" style="font-size:12.5px;opacity:.72;margin:0"')}</div>${tgtPly(TL(r))}</div>`;
  const e = envOf(i);
  if (e){ h += `<div class="fly"><div class="route"><span class="plane">✉️</span> ${esc(T("你的送别写好了。也有一封寄给你的 ↓", "Your goodbye is written. There's one for you too ↓"))}</div></div>`;
    h += `<button class="env ${st.envOpen ? "" : "shut"}" id="anEnvB"><div class="k">${esc(T("寄给你的一句送别", "A goodbye for you"))} · 🎭 ${bdi(e.nm)} · ${esc(L(e.c))} · ${esc(learnTag())}</div><div class="t">${tgtHTML(e.s, "sm")}</div><span class="open">${esc(T("点开信封", "Tap to open the envelope"))}</span></button>`;
    if (st.envOpen) h += `<div class="row" style="margin:8px 16px 0">${tgtPly(e.s)}<span style="font-size:12.5px;color:var(--soft)">${esc(T("已经贴在你的「丝路」那一页。", "It's on your Silk Road page now."))}</span></div>`; }
  const back = S.P.findIndex((p, k) => k < i && !p.stamped && cx.canOpen(k));
  if (i < 4){ h += `<button class="env ${st.hookOpen ? "" : "shut"}" id="anHookB"><div class="k">${esc(isTmr(i + 2) ? T("明天", "Tomorrow") + " · " + dLab(i + 2) : T("下一站", "Next stop") + " · " + dLab(i + 2))}</div><div class="t ${ZH() ? "" : "en"}">${esc(L(d.hook))}</div><span class="open">${esc(T("点开偷看", "Tap to peek"))}</span></button>`;
    h += `<div class="stampzone">${cx.canOpen(i + 1) ? `<button class="btn" data-goday="${i + 1}">${esc(T("下一站 · " + N.stops[i + 1].city.zh + " ›", "Next stop · " + nmText(N.stops[i + 1].city.zh, N.stops[i + 1].city.en) + " ›"))}</button>` : `<div class="need">${esc(T(`${dShort(i + 2)}，下一站开门。`, `The next stop opens on ${dShort(i + 2)}.`))}</div>`}
      ${back >= 0 ? `<div style="margin-top:8px"><button class="btn ghost" data-goday="${back}">${esc(T("补走第 " + (back + 1) + " 站 · " + N.stops[back].city.zh, "Catch up: stop " + (back + 1) + " · " + nmText(N.stops[back].city.zh, N.stops[back].city.en)))}</button></div>` : ""}</div>`; }
  else h += `<div class="stampzone"><button class="btn gold big" id="anPremB">${esc(T("翻开你的护照 · 首映", "Open your passport · premiere"))} ✨</button><div class="need">${esc(hook5())}</div>
     ${back >= 0 ? `<div style="margin-top:8px"><button class="btn ghost" data-goday="${back}">${esc(T("补走第 " + (back + 1) + " 站 · " + N.stops[back].city.zh, "Catch up: stop " + (back + 1) + " · " + nmText(N.stops[back].city.zh, N.stops[back].city.en)))}</button></div>` : ""}</div>`;
  return h; }

// ── 首映 ──
let leaf = 0, PREM = null;
function premiere(){ closePrem(); const el = document.createElement("div"); el.className = "anx an-prem"; el.dataset.nopy = ""; PREM = el;
  let pages = N.stops.map((Rr, i) => { const st = S.P[i], art = ART[i];
    return `<div class="leaf" data-l="${i}"><div class="lt"><h4>${ZH() ? `<span lang="zh-CN">${esc(Rr.city.zh)}</span><small>${esc(Rr.city.en)} · ${esc(dLab(i + 1))}</small>` : `<bdi>${esc(TR(Rr.city.en))}</bdi> <span class="zhb" lang="zh-CN" dir="ltr">${esc(Rr.city.zh)}</span><small>${esc(dLab(i + 1))}</small>`}</h4>${st.stamped ? sealHTML(i) : `<div class="slot">${T("还没<br>盖章", "not yet<br>stamped")}</div>`}</div>
     ${st.stamped ? `${art ? `<img class="art" src="${esc(art)}" alt="">` : `<div style="font-size:40px;text-align:center;margin:10px 0">${["🖌️", "☀️", "📮", "🍵", "🌗"][i]}</div>`}
     <div class="ml"><button class="ply" data-mine="${i}">▶</button><div><small>${esc(T("你", "You"))}</small>${myLineHTML(i)}</div></div>
     ${i === 2 && st.envOpen && envOf(2) ? `<div class="ot"><img src="${esc(P(envOf(2).p))}" alt=""><span>✉️ 🎭 ${bdi(envOf(2).nm)}${tgtHTML(envOf(2).s, "xs")}</span>${tgtPly(envOf(2).s)}</div>` : ""}` : `<div class="need" style="margin:12px 0">${esc(T("这一站你还没走。", "You haven't walked this stop yet."))} <button class="btn ghost" data-goday="${i}" style="margin-top:6px">${esc(T("去补走 ›", "Catch up ›"))}</button></div>`}
     ${worldOf(i).map(w => `<div class="ot"><img src="${esc(P(w.p))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span>🎭 ${bdi(w.nm)} · ${esc(L(w.c))}${tgtHTML(w.s, "xs")}</span>${tgtPly(w.s)}</div>`).join("")}</div>`; }).join("");
  pages += `<div class="leaf fin" data-l="5"><div class="pt" style="color:var(--gold2)">${esc(T("古代中国 · 走完了", "ANCIENT CHINA · DONE"))}</div>
    <div class="seal round slam"><div class="s1">走完了</div><div class="s2">ANCIENT CHINA</div><div class="s3">🏮</div></div>
    <div style="font:900 16px 'Noto Serif SC',serif;color:var(--ink)">${esc(T("你这五天说的五句", "Your five lines"))}</div>
    <ol>${S.P.map((st, i) => `<li>${st.stamped ? myLineHTML(i, "xs") : `<span class="need">${esc(T("（还没走）", "(not walked yet)"))}</span>`}</li>`).join("")}</ol>
    ${S.P[4].trans ? `<div class="need">${esc(T("你的翻法", "Your translation"))}：<span dir="auto">${esc(S.P[4].trans)}</span></div>` : ""}
    <div class="row" style="justify-content:center;margin-top:10px"><button class="btn say" id="anPlayAll">▶ ${esc(T("连着放五句", "Play all five"))}</button></div>
    <div class="need" style="margin-top:10px">${esc(hook5())}</div></div>`;
  el.innerHTML = cls(`<button class="xclose" id="anPremX" aria-label="${esc(T("关上", "Close"))}">✕</button><div class="pt">${esc(T("护照 · 首映", "PASSPORT · PREMIERE"))}</div><div class="ph1">${esc(T("你的古代中国护照", "Your Ancient China passport"))}</div>
   <div class="book" id="anBook">${pages}</div>
   <div class="pnav" dir="ltr"><button class="btn" id="anPPrev">‹</button><span class="dots">${"<i></i>".repeat(6)}</span><button class="btn" id="anPNext">${esc(T("翻页 ›", "Turn ›"))}</button></div>`);
  document.body.appendChild(el); leaf = 0; setLeaf(); confetti(); thud();
  if (!S.prem){ S.prem = cx.today(); save(); }
  el.addEventListener("click", e => { const t = e.target;
    const w = t.closest("[data-w]"); if (w && w.closest(".an-seg")){ e.stopPropagation(); wordTap(w); return; }
    if (t.closest("#anPremX")){ closePrem(); return; }
    if (t.closest("#anPNext")){ if (leaf < 5){ leaf++; setLeaf(); blip(); if (leaf === 5){ confetti(); thud(); } } return; }
    if (t.closest("#anPPrev")){ if (leaf > 0){ leaf--; setLeaf(); } return; }
    if (t.closest("#anPlayAll")){ playAll(); return; }
    const g = t.closest("[data-goday]"); if (g){ closePrem(); cx.reopen(+g.dataset.goday); return; }
    const m = t.closest("[data-mine]"); if (m){ playMine(+m.dataset.mine, m); return; }
    const b = t.closest("[data-say]"); if (b){ speak(b.dataset.say, b.dataset.lang, b); return; } }); }
function closePrem(){ if (PREM){ PREM.remove(); PREM = null; } hush(); }
function setLeaf(){ if (!PREM) return; PREM.querySelectorAll(".an-leaf").forEach((l, k) => { l.classList.toggle("an-gone", k < leaf); l.classList.toggle("an-wait", k > leaf); l.style.zIndex = 10 - k; });
  PREM.querySelectorAll(".an-dots i").forEach((d, k) => d.classList.toggle("an-on", k === leaf)); const n = PREM.querySelector("#anPNext"); if (n) n.style.visibility = leaf === 5 ? "hidden" : "visible"; }
function playAll(){ let k = 0; hush(); const next = () => { while (k < 5 && !S.P[k].stamped) k++; if (k > 4) return; const i = k++;
  if (REC[i]){ AU = new Audio(REC[i]); AU.onended = next; AU.play().catch(next); }
  else { try { const u = new SpeechSynthesisUtterance(myLineText(i)); u.lang = tgt() === "zh" ? "zh-CN" : "en-GB"; u.rate = .85; u.onend = next; u.onerror = next; speechSynthesis.speak(u); } catch(e){} } }; next(); }

// ── 发出去（第一、三天）：用手机自己的分享，电脑上复制 ──
async function doSend(i){ const st = S.P[i], l = myLine(i), own = (st.own || "").trim(); let text = l ? segText(l) : own;
  if (!text && !st.rec){ toast(st.lvl === "m" ? T("把空填上，或者用自己的话录下来", "Fill the blanks, or record it your way") : T("先录下来，或者写下来", "Record it, or write it down first"));
    const b = R.querySelector(st.lvl === "m" ? "#anBlankHint" : ".an-sayb"); b && b.scrollIntoView({block: "center", behavior: "smooth"}); return; }
  st.sent = true; if (D_(i).task.kind === "send") st.task = true; save(); render(); blip();
  if (!text){ toast(T("记下了：你自己用录音发过去。", "Noted — send your recording yourself.")); return; }
  text += tgt() === "zh" ? "\n(I'm learning Chinese, so this one's in Chinese!)" : "\n（我在学英语，这句用英语说给你！）";
  try { if (navigator.share && matchMedia("(pointer:coarse)").matches) navigator.share({text}).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast(T("复制好了，去微信、WhatsApp 里粘贴", "Copied — paste it into WhatsApp, WeChat…")), () => toast(T("发出去了 ✓", "Sent ✓")));
    else toast(T("发出去了 ✓", "Sent ✓")); } catch(e){} }

// ── 画一页 ──
function render(){ if (!R || !R.isConnected) return; const pg = cx.pg, y = pg ? pg.scrollTop : 0;
  const j = J(), pre = !j || before();
  R.innerHTML = cls(pre ? coverDay() : dayPage(DAY)); if (pg) pg.scrollTop = y;
  if (!pre){ const st = S.P[DAY], k = D_(DAY).task.kind; if (st.cv && !st.task && (k === "trace" || k === "oracle")) mountPad(k, k === "trace" ? "友" : (st.och || "日"));
    const mb = R.querySelector("#anMic"); if (mb && st.cv && window.AK){ mb.innerHTML = AK.micHTML({hint: T("点一下或按住，说你的那句", "Tap or hold, and say your line"), done: st.rec ? (st.recText || myLineText(DAY)) : null, real: st.rec && !st.recSim});
      const sp = st.rec && tgt() === "zh" && mb.querySelector(".ak-live span"); if (sp){ const l = myLine(DAY), o = (st.own || st.recText || "").trim(); if (l || o) sp.outerHTML = cls(segHTML(l || seg22(o), "zh", "xs")).replace("<div ", "<span ").replace(/<\/div>$/, "</span>"); }
      AK.mic(mb.querySelector(".ak-mic"), {want: () => { const l = myLine(DAY); return l ? segText(l) : (S.P[DAY].own || "").trim(); }, l: tgt(), free: true, onDone: v => onRec(DAY, v)}); } } }
async function onRec(i, v){ const st = S.P[i]; st.rec = true; st.recSim = !v.blob; st.recLen = v.dur || 0; st.recText = v.blob ? String(v.text || "").trim() : "";
  if (st.lvl === "f" && st.recText && !(st.own || "").trim()) st.own = st.recText;
  if (v.blob){ await fset(i + ".rec", v.blob); if (REC[i]) URL.revokeObjectURL(REC[i]); REC[i] = URL.createObjectURL(v.blob); }
  save(); toast(T("✓ 录好了，这句是你的", "✓ Recorded — that one's yours")); render(); }

function click(e){ const t = e.target, i = DAY, st = S.P[i];
  const w = t.closest("[data-w]"); if (w && w.closest(".an-seg")){ e.stopPropagation(); wordTap(w); return; }
  const m = t.closest("[data-mine]"); if (m){ playMine(+m.dataset.mine, m); return; }
  const b = t.closest("[data-say]"); if (b){ speak(b.dataset.say, b.dataset.lang, b); return; }
  if (t.closest("#anGetP")){ const c = t.closest("#anGetP"); c.classList.add("an-opening"); blip(); setTimeout(() => { join(); confetti(); toast(T("护照领好了 ✓", "Passport collected ✓")); cx.reopen(); }, 700); return; }
  if (t.closest("#anTmr")){ S.tmrOpen = true; t.closest("#anTmr").classList.remove("an-shut"); blip(); return; }
  if (t.closest("#anGo1")){ cx.reopen(0); return; }
  if (t.closest("#anOpenCover")){ const c = t.closest("#anOpenCover"); c.classList.add("an-opening"); blip(); setTimeout(() => { st.cv = true; save(); render(); }, 700); return; }
  const g = t.closest("[data-goday]"); if (g){ cx.reopen(+g.dataset.goday); return; }
  const tk = t.closest("[data-stop]"); if (tk){ const k = +tk.dataset.stop, was = st.heard[k]; st.open = k; st.heard[k] = true; save(); render();
    const s = N.stops[i].stops[k]; speak(tgt() === "zh" ? s.say[0] : s.say[2], tgt()); if (!was){ blip(); toast(T("听过了 ✓ " + s.n, "Heard ✓ " + nmText(s.n, s.ne || s.n))); }
    const sel = R.querySelector(".an-tk.an-sel"); sel && sel.scrollIntoView({block: "nearest", inline: "center", behavior: "smooth"}); return; }
  const oc = t.closest("[data-och]"); if (oc){ st.och = oc.dataset.och; save(); render(); return; }
  if (t.closest("#anPadClr")){ render(); return; }
  if (t.closest("#anPadDone")){ if (!pad || !pad.ok) return; setArt(i, padImage()).then(() => toast(T("贴好了 ✓", "Stuck on the page ✓"))); return; }
  if (t.closest("#anMoonB")){ st.task = true; save(); render(); blip(); toast(T("🌗 跟大家同一个月亮", "🌗 Same moon as everyone")); setTimeout(() => { const x = R.querySelector("#anTransIn"); x && x.focus({preventScroll: true}); }, 50); return; }
  if (t.closest("#anTransB")){ const v = (R.querySelector("#anTransIn").value || "").trim(); if (!v){ toast(T("先写几个字", "Write a few words first")); return; } st.trans = v; save(); render(); blip(); return; }
  if (t.closest("#anSendB") || t.closest("#anSendB2")){ doSend(i); return; }
  const lv = t.closest("[data-lvl]"); if (lv){ st.lvl = lv.dataset.lvl; save(); render(); return; }
  const pk = t.closest("[data-pick]"); if (pk){ st.pick = +pk.dataset.pick; save(); render(); blip(); speak(segText(sayData(i).b.opts[st.pick][1]), tgt()); return; }
  const sl = t.closest("[data-slot]"); if (sl){ st.slots[+sl.dataset.slot] = +sl.dataset.j; save(); render(); blip(); const l = myLine(i); if (l) speak(segText(l), tgt()); return; }
  if (t.closest("#anRefB")){ st.ref = true; save(); render(); return; }
  if (t.closest("#anStampB")){ if (!(st.task && st.rec)) return; st.stamped = true; st.justStamped = true; save(); cx.finish(myLineText(i)); render(); thud(); confetti();
    toast(T("盖好了：" + N.stops[i].city.zh, "Stamped: " + nmText(N.stops[i].city.zh, N.stops[i].city.en))); const s2 = R.querySelector("#anSlot"); s2 && s2.scrollIntoView({block: "center", behavior: "smooth"}); setTimeout(() => { st.justStamped = false; }, 800); return; }
  if (t.closest("#anEnvB")){ if (!st.envOpen){ st.envOpen = true; save(); render(); blip(); speak(tgtText(envOf(i).s), tgt()); } return; }
  if (t.closest("#anHookB")){ st.hookOpen = true; save(); render(); blip(); return; }
  if (t.closest("#anPremB")){ premiere(); return; } }
let ownT = null;
function input(e){ if (e.target.id === "anOwnIn"){ S.P[DAY].own = e.target.value; clearTimeout(ownT); ownT = setTimeout(save, 600); } }
function change(e){ const f = e.target.closest("[data-photo]"); if (!f || !f.files || !f.files[0]) return; const i = +f.dataset.photo;
  const go = u => setArt(i, u).then(() => toast(T("贴好了 ✓", "On the page ✓")));
  if (window.AK && AK.shrink) AK.shrink(f.files[0], 720, .82).then(go); else { const r = new FileReader(); r.onload = () => go(r.result); r.readAsDataURL(f.files[0]); } }
let rsT = null;
function onResize(){ clearTimeout(rsT); rsT = setTimeout(() => { if (!R || !R.isConnected || !J() || before()) return; const st = S.P[DAY], k = D_(DAY).task.kind; if (st.cv && !st.task && R.querySelector("#anCv")) mountPad(k, k === "trace" ? "友" : (st.och || "日")); }, 200); }

// ── 交给 activities.js：html(ctx) 画这一天，wire(ctx) 接上 ──
window.ACT_MODES = window.ACT_MODES || {};
window.ACT_MODES.ancient = {
 html(c){ return `<div class="anx"><div data-anx></div></div>`; },
 wire(c){ cx = c; A = c.a; N = A.an; DAY = Math.max(0, Math.min(4, c.d)); R = c.pg.querySelector("[data-anx]");
  if (!document.getElementById("anxCss")){ const s = document.createElement("style"); s.id = "anxCss"; s.textContent = CSS; document.head.appendChild(s);
    if (!document.getElementById("anxFont")){ const l = document.createElement("link"); l.id = "anxFont"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;900&family=Ma+Shan+Zheng&display=swap"; document.head.appendChild(l); } }
  try { AKx().mount && AKx().mount(); } catch(e){}
  load(); R.onclick = click; R.oninput = input; R.onchange = change; removeEventListener("resize", onResize); addEventListener("resize", onResize);
  render(); loadFiles().then(() => { if (cx === c && R && R.isConnected) render(); }); },
 stop(){ hush(); closePrem(); clearTimeout(ownT); if (cx && S && R && R.isConnected) { const x = R.querySelector("#anOwnIn"); if (x){ S.P[DAY].own = x.value; save(); } } removeEventListener("resize", onResize); }
};

const CSS = `
.anx{--ink:#14305c;--ivory:#fbf7ee;--say:#e2552f;--seal:#b5332a;--gold:#c9a861;--gold2:#a8843f;--soft:#6b7488;--line:#e6dfcf;--desk:#ece4d3;--paper:#fffdf7;--cover:#1c3a5e;--cover2:#122a47;
 max-width:480px;margin:10px auto 0;padding:0 0 40px;background:var(--ivory);border-radius:22px;color:#24303a;font:15px/1.55 -apple-system,"PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif;overflow:hidden}
:where(.anx) button{font:inherit;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}
.an-prem button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.anx .an-zhs,.an-prem .an-zhs{font-family:"Noto Serif SC",serif}.anx .an-geo{font-family:Georgia,"Times New Roman",serif}
.an-hd{padding:20px 18px 4px;text-align:center}
.an-brand{display:inline-flex;align-items:center;gap:7px;font:600 11px Georgia,serif;letter-spacing:.42em;color:#8f7a4c;padding-inline-start:.42em}
.an-cover{margin:14px auto 0;width:84%;max-width:300px;aspect-ratio:5/7;border-radius:8px 14px 14px 8px;background:radial-gradient(120% 90% at 30% 20%,#25496f,var(--cover2));box-shadow:inset 9px 0 0 rgba(0,0,0,.18),inset 11px 0 0 rgba(255,255,255,.06),0 14px 30px rgba(18,42,71,.35);color:var(--gold);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;position:relative;border:0;padding:20px;transform-origin:left center;transition:transform .9s cubic-bezier(.6,.05,.3,1),opacity .9s}
.an-cover::before{content:"";position:absolute;inset:12px 12px 12px 18px;border:1.5px solid rgba(201,168,97,.55);border-radius:4px;pointer-events:none}
.an-cover .an-ct1{font:900 30px/1.1 "Noto Serif SC",serif;letter-spacing:.18em;padding-left:.18em}
.an-cover .an-ct2{font:italic 15px Georgia,serif;letter-spacing:.06em;color:#e6d3a3}
.an-cover .an-emb{width:86px;height:86px}
.an-cover .an-ct3{font:600 10px Georgia,serif;letter-spacing:.4em;padding-left:.4em}
.an-cover .an-tap{position:absolute;bottom:22px;font-size:12px;color:#e6d3a3;opacity:.85;animation:anxbreathe 2s infinite}
.an-cover.an-opening{transform:perspective(900px) rotateY(-100deg);opacity:0}
@keyframes anxbreathe{50%{opacity:.35}}
.an-pg{margin:12px 12px 0;background:var(--paper);border-radius:6px;border:1px solid var(--line);box-shadow:0 2px 0 #efe7d6,0 4px 0 #e9e0cc,0 8px 18px rgba(20,48,92,.08);position:relative;overflow:hidden}
.an-pg::before{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 50% 120%,rgba(20,48,92,.035) 0 1px,transparent 1px 9px);pointer-events:none}
.an-pg>*{position:relative}
.an-pgh{padding:16px 16px 6px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.an-pgh .an-k{font:600 10.5px Georgia,serif;letter-spacing:.24em;color:#8f7a4c;text-transform:uppercase}
.an-pgh .an-city{font:900 30px/1.1 "Noto Serif SC",serif;color:var(--ink);margin-top:4px}
.an-pgh .an-city small{display:block;font:italic 15px Georgia,serif;color:var(--soft);margin-top:3px}
.an-pgh .an-date{font:600 12px Georgia,serif;color:var(--soft);text-align:right;white-space:nowrap}
.an-slot{width:84px;height:84px;flex:none;border:1.5px dashed #d9cdb2;border-radius:6px;display:grid;place-items:center;color:#c4b694;font-size:11px;text-align:center;line-height:1.3;position:relative}
.an-slot.an-hasstamp{border-color:transparent}
.an-seal{width:80px;height:80px;border:3px solid var(--seal);border-radius:7px;color:var(--seal);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg);background:rgba(181,51,42,.04);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6),inset 0 0 0 4px rgba(181,51,42,.85);mix-blend-mode:multiply;position:relative}
.an-seal .an-s1{font:900 22px/1 "Noto Serif SC","Songti SC","STSong",serif;letter-spacing:.04em}
.an-seal .an-s2{font:700 8px Georgia,serif;letter-spacing:.14em;margin-top:4px}
.an-seal .an-s3{font-size:15px;line-height:1;margin-top:3px}
.an-seal.an-slam{animation:anxslam .55s cubic-bezier(.2,1.4,.4,1) both}
@keyframes anxslam{0%{transform:scale(2.6) rotate(-20deg);opacity:0}60%{transform:scale(.92) rotate(-7deg);opacity:1}100%{transform:scale(1) rotate(-8deg)}}
.an-seal.an-round{border-radius:50%}
.an-map{margin:4px 12px 0;border-radius:6px;background:#f7f1e3;border:1px solid var(--line)}
.an-map svg{display:block;width:100%;height:auto}
.an-mapcap{display:flex;justify-content:space-between;padding:0 10px 7px;font-size:11px;color:var(--soft)}
.an-host{margin:12px 12px 0;border-radius:10px;overflow:hidden;background:var(--ink);color:#f5ecd8;position:relative}
.an-host .an-bg{height:96px;background-size:cover;background-position:center 40%;position:relative}
.an-host .an-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 20%,var(--ink))}
.an-host .an-bgcap{position:absolute;right:8px;top:6px;font-size:10px;color:#fff;opacity:.8;z-index:1;text-shadow:0 1px 2px #000}
.an-host .an-body{padding:0 14px 14px;margin-top:-34px;position:relative}
.an-who{display:flex;align-items:center;gap:9px}
.an-ava{width:46px;height:46px;border-radius:50%;flex:none;background:#f5ecd8;color:var(--seal);display:grid;place-items:center;font:900 23px "Noto Serif SC","Songti SC",serif;border:2px solid var(--gold);object-fit:cover}
img.an-ava{background:#ddd}
.an-who b{font-size:14px}.an-who small{display:block;font-size:11.5px;opacity:.75}
.an-host .an-q{margin-top:9px}
.an-host .an-seg,.an-react .an-seg{color:#f5ecd8}.an-host .an-seg rt,.an-react .an-seg rt{color:#b9c3d6}.an-host .an-seg ruby:hover,.an-host .an-seg .an-rw:hover,.an-react .an-seg ruby:hover,.an-react .an-seg .an-rw:hover,.an-host .an-seg .an-hl,.an-react .an-seg .an-hl{background:rgba(255,255,255,.15)}
.an-host .an-q.an-en{font:italic 15.5px/1.5 Georgia,serif}
.an-host .an-tr{font-size:12.5px;opacity:.72;margin-top:4px}
.an-ply{border:0;background:rgba(20,48,92,.08);color:var(--ink);width:30px;height:30px;border-radius:50%;display:inline-grid;place-items:center;font-size:14px;flex:none;vertical-align:middle;transition:transform .15s}
.an-ply:active{transform:scale(.88)}
.an-ply.an-on{background:var(--ink);color:#fff;animation:anxpulse 1s infinite}
@keyframes anxpulse{50%{box-shadow:0 0 0 6px rgba(20,48,92,.15)}}
.an-host .an-ply{background:rgba(245,236,216,.16);color:#f5ecd8}
.an-sec{margin:20px 16px 8px;display:flex;align-items:baseline;gap:8px}
.an-sec h3{margin:0;font:900 17px "Noto Serif SC",serif;color:var(--ink)}
.an-sec h3.an-en{font:700 18px Georgia,serif}
.an-sec span{font-size:12px;color:var(--soft)}
.an-stops{display:flex;gap:10px;overflow-x:auto;padding:2px 16px 8px;scroll-snap-type:x mandatory;scrollbar-width:none}
.an-stops::-webkit-scrollbar{display:none}
.an-tk{flex:none;width:128px;border:0;padding:0;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(20,48,92,.12);text-align:left;scroll-snap-align:start;position:relative;overflow:hidden;transition:transform .2s}
.an-tk:active{transform:scale(.96)}
.an-tk .an-im{height:84px;background:#ddd center/cover}
.an-tk .an-tx{padding:7px 9px 9px;border-top:2px dashed var(--line)}
.an-tk .an-nm{font:900 14px "Noto Serif SC",serif;color:var(--ink)}
.an-tk .an-pl{font-size:11px;color:var(--soft)}
.an-tk.an-sel{outline:2.5px solid var(--ink)}
.an-tk .an-hrd{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:var(--paper);color:var(--seal);font:900 12px "Noto Serif SC","Songti SC",serif;display:grid;place-items:center;border:1.5px solid var(--seal);transform:rotate(-12deg) scale(0);transition:transform .35s cubic-bezier(.2,1.6,.4,1)}
.an-tk.an-heard .an-hrd{transform:rotate(-12deg) scale(1)}
.an-stopcard{margin:4px 16px 0;background:#fff;border-radius:10px;padding:13px 14px;box-shadow:0 2px 10px rgba(20,48,92,.08);animation:anxrise .35s both}
@keyframes anxrise{from{opacity:0;transform:translateY(8px)}}
.an-stopcard .an-line{display:flex;gap:8px;align-items:flex-start}
.an-stopcard .an-mean{font:italic 14px/1.45 Georgia,serif;color:var(--soft);margin-top:4px}
.an-stopcard .an-mean.an-zh{font:600 13.5px/1.5 "Noto Serif SC",serif;font-style:normal}
.an-stopcard .an-core{font-size:13px;color:#4a5466;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)}
.an-seg{font:600 19px/2.05 "Noto Serif SC",serif;color:var(--ink);flex:1;min-width:0;word-break:break-all}
.an-seg.an-sm{font-size:16.5px;line-height:1.95}
.an-seg.an-en{font:500 18px/1.55 Georgia,serif;word-break:normal}
.an-seg.an-en.an-sm{font-size:16px}
.an-seg ruby{ruby-position:over;cursor:pointer;border-radius:4px;padding:0 1px;transition:background .15s}
.an-seg .an-rw{cursor:pointer;border-radius:4px}
.an-seg ruby:hover,.an-seg ruby.an-hl,.an-seg .an-w:hover,.an-seg .an-w.an-hl,.an-seg .an-rw:hover,.an-seg .an-rw.an-hl{background:rgba(20,48,92,.1)}
.an-seg rt{font:500 10.5px/1 -apple-system,sans-serif;color:#8a93a5;letter-spacing:0}
.an-seg .an-w{cursor:pointer;border-radius:4px}
.an-seg .an-pn{color:#9aa}
.an-seg .an-blank{display:inline-block;min-width:54px;border-bottom:2px solid var(--say);margin:0 3px;line-height:1.2;text-align:center;color:var(--say)}
.an-nopy .an-seg rt{visibility:hidden}
.an-pop{position:fixed;z-index:95;background:var(--ink);color:#fff;border-radius:10px;padding:8px 12px;font-size:13px;box-shadow:0 8px 20px rgba(0,0,0,.25);max-width:230px;pointer-events:none;opacity:0;transform:translateY(4px);transition:.18s}
.an-pop.an-on{opacity:1;transform:none}
.an-pop b{font:900 19px "Noto Serif SC",serif;display:block}
.an-pop b.an-en{font:700 17px Georgia,serif}
.an-pop i{opacity:.75;font-style:normal;display:block;font-size:12px}
.an-task{margin:0 12px;background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 10px rgba(20,48,92,.08);border-left:5px solid var(--say)}
.an-task .an-tt{font:900 16px/1.4 "Noto Serif SC",serif;color:var(--ink)}
.an-task .an-tt.an-en{font:700 17px/1.35 Georgia,serif}
.an-task p{margin:6px 0 10px;font-size:13.5px;color:#4a5466}
.an-pad{position:relative;width:100%;max-width:280px;aspect-ratio:1;margin:6px auto 4px;background:#fffef9;border-radius:6px;border:1px solid #e3d8c0;overflow:hidden;background-image:linear-gradient(rgba(181,51,42,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(181,51,42,.22) 1px,transparent 1px),linear-gradient(45deg,transparent calc(50% - .5px),rgba(181,51,42,.12) 50%,transparent calc(50% + .5px)),linear-gradient(-45deg,transparent calc(50% - .5px),rgba(181,51,42,.12) 50%,transparent calc(50% + .5px));background-size:50% 50%,50% 50%,100% 100%,100% 100%;background-position:center}
.an-pad .an-guide{position:absolute;inset:0;display:grid;place-items:center;color:rgba(20,48,92,.13);font:400 210px/1 "Ma Shan Zheng","Noto Serif SC",serif;pointer-events:none;user-select:none}
.an-pad svg.an-guide{width:100%;height:100%}
.an-pad canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}
.an-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.an-btn{border:0;border-radius:99px;padding:9px 16px;font-weight:800;font-size:14px;background:var(--ink);color:#fff;transition:transform .15s,opacity .2s}
.an-btn:active{transform:scale(.95)}
.an-btn.an-say{background:var(--say)}
.an-btn.an-ghost{background:#f1ece0;color:var(--ink)}
.an-btn.an-gold{background:linear-gradient(#d6b46d,#b38a3e);color:#2a1e06}
.an-btn[disabled]{opacity:.35;cursor:default}
.an-chip{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:6px 12px;font-weight:700;font-size:14px;color:var(--ink);transition:transform .15s}
.an-chip:active{transform:scale(.93)}
.an-chip.an-on{background:var(--ink);color:#fff;border-color:var(--ink)}
.an-chip .an-zhs{font-weight:900}
.an-chip small{font-weight:500;opacity:.7;margin-left:3px;font-size:11px}
.an-done{display:flex;align-items:center;gap:10px;background:#f6f1e4;border-radius:10px;padding:8px;margin-top:6px;animation:anxrise .35s both}
.an-done img{width:64px;height:64px;object-fit:cover;border-radius:6px;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.15);transform:rotate(-3deg);background:#fff}
.an-done b{color:var(--ink);font-size:13.5px}
.an-done small{display:block;color:var(--soft);font-size:12px}
.an-fileb{position:relative;overflow:hidden}
.an-fileb input{position:absolute;inset:0;opacity:0;cursor:pointer}
.an-moon{display:flex;gap:12px;align-items:center;background:#16213a;color:#e9e3cf;border-radius:10px;padding:12px;margin-bottom:10px}
.an-moon svg{width:62px;height:62px;flex:none}
.an-moon small{display:block;font-size:12px;opacity:.75;margin-top:3px}
.an-txtin{width:100%;border:1.5px solid var(--line);border-radius:10px;padding:9px 11px;font:15px/1.4 inherit;background:#fffef9;margin-top:6px}
.an-sayb{margin:0 12px;background:#fff;border-radius:12px;padding:12px 14px 14px;box-shadow:0 2px 10px rgba(20,48,92,.08);border-top:4px solid var(--say)}
.an-lv{display:flex;background:#f4efe3;border-radius:99px;padding:3px;margin-bottom:10px}
.an-lv button{flex:1;border:0;background:none;border-radius:99px;padding:6px 4px;font-size:12.5px;font-weight:800;color:var(--soft)}
.an-lv button.an-on{background:#fff;color:var(--say);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.an-lab{font-size:11.5px;font-weight:800;color:var(--soft);letter-spacing:.04em;margin:10px 0 5px;text-transform:uppercase}
.an-my{display:flex;gap:8px;align-items:flex-start;background:#fdf3ee;border-radius:10px;padding:6px 10px;margin-top:4px}
.an-words{display:flex;flex-wrap:wrap;gap:6px}
.an-wd{border:0;background:#f4efe3;border-radius:8px;padding:5px 9px;text-align:left;font-size:12px;color:var(--soft);line-height:1.25}
.an-wd b{display:block;font:900 15px "Noto Serif SC",serif;color:var(--ink)}
.an-wd b.an-en{font:700 14px Georgia,serif}
.an-ref{margin-top:8px;background:#f4f6fa;border-radius:10px;padding:8px 10px;animation:anxrise .3s both}
.an-ref small{display:block;font-size:11.5px;color:var(--soft)}
.an-mic{display:flex;align-items:center;gap:10px;margin-top:12px}
.an-micb{width:58px;height:58px;border-radius:50%;border:0;background:var(--say);color:#fff;font-size:24px;flex:none;box-shadow:0 4px 12px rgba(226,85,47,.35);transition:transform .15s}
.an-micb:active{transform:scale(.92)}
.an-micb.an-rec{animation:anxrecp 1s infinite}
@keyframes anxrecp{50%{box-shadow:0 0 0 10px rgba(226,85,47,.18)}}
.an-bars{display:flex;gap:3px;align-items:center;height:30px}
.an-bars i{width:4px;border-radius:3px;background:var(--say);height:6px;transition:height .1s}
.an-mic .an-st{font-size:13px;color:var(--soft);flex:1}
.an-mic .an-st b{color:var(--ink)}
.an-ok{color:#2d8a4e;font-weight:800}
.an-stampzone{margin:18px 12px 0;text-align:center}
.an-need{font-size:12.5px;color:var(--soft);margin-top:7px}
.an-big{font-size:16px;padding:13px 26px}
.an-wall{margin:0 12px;display:flex;flex-direction:column;gap:9px}
.an-wl{display:flex;gap:10px;background:#fff;border-radius:12px;padding:10px;box-shadow:0 2px 8px rgba(20,48,92,.07);animation:anxrise .4s both}
.an-wl img{width:42px;height:42px;border-radius:50%;object-fit:cover;flex:none;background:#ddd}
.an-wl .an-nm{font-size:12.5px;font-weight:800;color:var(--ink)}
.an-wl .an-nm small{font-weight:500;color:var(--soft)}
.an-wl .an-did{font-size:12.5px;color:var(--soft);margin:1px 0 3px}
.an-wl .an-sd{display:flex;gap:6px;align-items:flex-start}
.an-wl .an-sd div{font:600 14.5px/1.5 "Noto Serif SC",serif;color:#24303a;flex:1}
.an-wl .an-sd div.an-en{font:italic 14.5px/1.45 Georgia,serif}
.an-wl.an-me{background:#fdf3ee;border:1.5px solid #f3c9b8}
.an-react{margin:12px 12px 0;background:var(--ink);color:#f5ecd8;border-radius:12px;padding:11px 13px;display:flex;gap:10px;align-items:flex-start;animation:anxrise .5s .2s both}
.an-react .an-ava{width:36px;height:36px;font-size:21px}
.an-react>div:not(.an-ava){flex:1;font-size:14px}
.an-react .an-ava{flex:none;font-size:19px}
.an-react .an-zhs{font-weight:600}
.an-env{margin:12px 12px 0;border:0;width:calc(100% - 24px);background:linear-gradient(135deg,#f8efd9,#efe0bd);border-radius:10px;padding:14px;text-align:left;position:relative;box-shadow:0 3px 10px rgba(120,90,30,.18);animation:anxrise .5s both}
.an-env::after{content:"";position:absolute;right:14px;top:12px;width:30px;height:30px;border-radius:50%;background:radial-gradient(#c8453a,#8f231c);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.an-env .an-k{font:600 10.5px Georgia,serif;letter-spacing:.2em;color:#8f7a4c;text-transform:uppercase}
.an-env .an-t{font:900 15px/1.45 "Noto Serif SC",serif;color:#3d2f10;margin-top:5px;padding-right:40px}
.an-env .an-t .an-seg{color:#3d2f10}
.an-env .an-t.an-en{font:700 15.5px/1.4 Georgia,serif}
.an-env.an-shut .an-t{filter:blur(5px);user-select:none}
.an-env.an-shut .an-open{display:inline-block}
.an-env .an-open{display:none;margin-top:6px;font-size:12px;font-weight:800;color:#8f7a4c}
.an-fly{margin:12px 12px 0;background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 2px 10px rgba(20,48,92,.08);animation:anxrise .4s both}
.an-fly .an-route{font-size:12.5px;color:var(--soft);display:flex;align-items:center;gap:6px}
.an-fly .an-plane{display:inline-block;animation:anxflyx 2.2s ease-in-out both}
@keyframes anxflyx{from{transform:translateX(-30px);opacity:0}to{transform:none;opacity:1}}
.an-bearer{margin:14px 12px 0;padding:14px;display:flex;gap:12px;align-items:center}
.an-bearer .an-ph{width:72px;height:90px;border-radius:4px;background:#eae3d2;display:grid;place-items:center;font-size:30px;flex:none;border:1px solid #d9cdb2}
.an-bearer dl{margin:0;font-size:12px;color:var(--soft);display:grid;grid-template-columns:auto 1fr;gap:2px 10px}
.an-bearer dd{margin:0;color:var(--ink);font-weight:700}
.an-mrz{font:12px/1.3 "Courier New",monospace;color:#9a9483;letter-spacing:.08em;padding:0 14px 12px;word-break:break-all}
.an-itin{margin:0 12px;display:flex;flex-direction:column;gap:6px}
.an-itin div{display:flex;gap:10px;align-items:center;background:#fff;border-radius:10px;padding:8px 11px;font-size:13px}
.an-itin b{font:900 15px "Noto Serif SC",serif;color:var(--ink);min-width:72px}
.an-itin span{color:var(--soft)}
.an-prem{position:fixed;inset:0;z-index:70;background:radial-gradient(120% 80% at 50% 10%,#25496f,#0d1e35);display:flex;flex-direction:column;align-items:center;padding:20px 14px 16px;color:#f5ecd8;animation:anxfadein .4s both}

@keyframes anxfadein{from{opacity:0}}
.an-prem .an-pt{font:600 11px Georgia,serif;letter-spacing:.36em;color:var(--gold);padding-left:.36em}
.an-prem .an-ph1{font:900 20px "Noto Serif SC",serif;margin:4px 0 12px}
.an-book{flex:1;width:100%;max-width:340px;perspective:1200px;position:relative;min-height:0}
.an-leaf{position:absolute;inset:0;background:var(--paper);color:#24303a;border-radius:4px 10px 10px 4px;box-shadow:inset 10px 0 14px -10px rgba(0,0,0,.35),0 12px 30px rgba(0,0,0,.35);padding:16px 16px 14px;overflow-y:auto;transform-origin:left center;transition:transform .8s cubic-bezier(.6,.05,.3,1),opacity .8s;scrollbar-width:none}
.an-leaf::-webkit-scrollbar{display:none}
.an-leaf.an-gone{transform:rotateY(-110deg);opacity:0;pointer-events:none}
.an-leaf.an-wait{opacity:0;pointer-events:none}
.an-leaf h4{margin:0;font:900 24px "Noto Serif SC",serif;color:var(--ink)}
.an-leaf h4 small{display:block;font:italic 13px Georgia,serif;color:var(--soft)}
.an-leaf .an-lt{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.an-leaf .an-art{width:100%;max-height:150px;object-fit:cover;border-radius:4px;border:5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.15);margin:10px 0 6px;transform:rotate(-1.5deg);background:#fff}
.an-leaf .an-ml{display:flex;gap:8px;align-items:flex-start;background:#fdf3ee;border-radius:8px;padding:7px 9px;margin-bottom:8px}
.an-leaf .an-ml div{flex:1;font:600 14.5px/1.5 "Noto Serif SC",serif}
.an-leaf .an-ml div.an-en{font:italic 14.5px/1.45 Georgia,serif}
.an-leaf .an-ml small{display:block;font:500 11px -apple-system,sans-serif;color:var(--soft)}
.an-leaf .an-ot{display:flex;gap:7px;align-items:center;font-size:12.5px;padding:4px 0;border-top:1px dashed var(--line)}
.an-leaf .an-ot img{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:none}
.an-leaf .an-ot span{flex:1;min-width:0}
.an-seg.an-xs{font-size:14.5px;line-height:1.85}.an-seg.an-sm rt{font-size:9.5px}.an-seg.an-xs rt{font-size:9px}.an-seg.an-en.an-xs{font-size:14px;line-height:1.45}
.an-fin ol li{margin-bottom:2px}
.an-leaf .an-ot .an-ply{width:26px;height:26px;font-size:12px}
.an-pnav{display:flex;gap:10px;align-items:center;margin-top:12px}
.an-pnav .an-dots{display:flex;gap:5px}
.an-pnav .an-dots i{width:7px;height:7px;border-radius:50%;background:rgba(245,236,216,.3)}
.an-pnav .an-dots i.an-on{background:var(--gold)}
.an-pnav .an-btn{background:rgba(245,236,216,.14);color:#f5ecd8}
.an-fin{text-align:center}
.an-fin .an-seal{margin:14px auto 10px;width:118px;height:118px}
.an-fin .an-seal .an-s1{font-size:30px}
.an-fin ol{text-align:left;padding-left:20px;margin:8px 0;font:600 14px/1.7 "Noto Serif SC",serif}
.an-fin ol.an-en{font:italic 14px/1.6 Georgia,serif}
.an-xclose{position:absolute;top:12px;right:12px;border:0;background:rgba(245,236,216,.14);color:#f5ecd8;width:32px;height:32px;border-radius:50%;font-size:16px;z-index:2}
.anx.an-prem{max-width:none;margin:0;border-radius:0;padding:20px 14px 16px}
.an-tr{font-size:12.5px;opacity:.72;margin-top:4px}
.an-dots i{width:7px;height:7px;border-radius:50%;background:rgba(245,236,216,.3)}.an-dots i.an-on{background:var(--gold)}
.an-pop.an-on{opacity:1;transform:none}
.an-pop span{display:block;font-size:12.5px}
.an-sayb .ak-mic{margin-top:12px}
.ak-live .an-seg{display:inline;font-size:15px;line-height:1.9}.an-zhb{font-size:.8em;opacity:.75;margin-inline-start:4px;font-family:"Noto Serif SC",serif}
.an-core,.an-did,.an-task p,.an-tr,.an-need,.an-mean,.an-pl,.an-mapcap span,.an-bearer dd,.an-itin span{unicode-bidi:plaintext}
[dir=rtl] .an-cover{transform-origin:right center}
`;
})();

/* act_value.js */
// 🧾 年底大促性价比之王（2026-11-15 放进软件；样板 样板/双十二性价比之王样板.html，用户「可以，放进软件」；同一天又定「活动要全球的」：两边合成一期）
// 全世界学语言的人同一期：12 月 12 日开张，各晒自己城市那一场大促（双十二、黑五、节礼日、普通的年底打折都算）里最值的一样，或者忍住没买的；
// 小票当场打出「一次多少钱」；12 月 26 日投 3 个瓶盖；12 月 27 日主持人打开收银台颁三个奖。学中文的人主持人是苏梅（说中文），学英语的人是 Oliver（说英语），墙和颁奖台是同一个。
// 活动框架（activities.js）管：海报、加入、四步那排格子（json 的 open = 每一步全世界同一时刻开）、「你在参加的」和章；这里画每一步的身体（ACT_MODES.value）。
// 数据 content-skeleton/activities/yearend_value.json（gz = 中文词的拼音和意思，按词写好，不在线加载拼音）。进度在 act.v1 的 j.yearend_value.vk[zh|en]（跟着账号同步）；
// 照片只存在手机上（yv.photo.<边>），录音只存在手机上（IndexedDB hv.yv），「送给世界」时才连小票一起存进 Supabase docs（coll = 'yearend'，后台/yearend.sql）。
// 票：真人票还没有后台，你投的 3 个瓶盖只记在你手机上；第一届由主持人评，台上写明，不编票数。🎭 角色的票只当评论。
(function(){
const K = () => window.AK;
const T = (zh, en) => K().T(zh, en), ZH = () => K().ZH(), esc = s => K().esc(s);
const KEYS = ["poster", "post", "vote", "reveal"];
let cx = null, A = null, R = null, SIDE = "en", REAL = [], REAL_ON = false, LAST_BLOB = null;
const D = () => A.side[SIDE];
const X = v => Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string" ? T(v[0], v[1]) : v;   // [中, 英] → 按界面
const plain = t => String(t || "").replace(/[⟦⟧\[\]]/g, "");
const now = () => Date.now();
const at = i => A.open[i] ? Date.parse(A.open[i]) : 0;
const opened = i => !A.open[i] || at(i) <= now();
const loc = () => ZH() ? "zh-CN" : K().UI() === "ar" ? "en-GB" : (document.documentElement.lang || "en-GB");   // 阿语界面：句子还是英文，日期也用英文格式（27 Dec, 16:00）
// 阿语界面：夹在中间的日期和英文时间用从左往右的隔离（⁦…⁩），不搅乱顺序
const bd = s => K().UI() === "ar" ? "\u2066" + s + "\u2069" : s;
function lt(ms){ try { return bd(new Intl.DateTimeFormat(loc(), {month: ZH() ? "long" : "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false}).format(new Date(ms))); } catch(e){ return bd(new Date(ms).toLocaleString()); } }
const HT = k => bd(X(D().host.time[k]));
// 🗓️ 随到随开（json 里 schedule: "rolling"，2026-11-15 用户）：不再是全世界同一时刻，按你自己的进度——加入那天第 1 天，第 2 天晒，第 3 天（最后一天前）投瓶盖，第 4 天揭晓。
// A.open 由 activities.js 按你加入的那天算好；这里只把「你那儿 12 月 26 日 0:00（伦敦半夜 12 点）」换成「第 3 天（明天）」。
const RL = () => A.schedule === "rolling";
const dayW = i => { const k = Math.round((Date.parse(A.open[i]) - Date.parse(cx.today() + "T00:00")) / 864e5); return T(`第 ${i + 1} 天`, `day ${i + 1}`) + (k === 1 ? T("（明天）", " (tomorrow)") : k === 0 ? T("（今天）", " (today)") : ""); };
const whenO = () => RL() ? dayW(1) : T(`你那儿 ${lt(at(1))}（${HT("O")}）`, `${lt(at(1))} your time (${HT("O")})`);
const whenV = () => RL() ? dayW(2) : T(`你那儿 ${lt(at(2))}（${HT("V")}）`, `${lt(at(2))} your time (${HT("V")})`);
const whenR = () => RL() ? dayW(3) : T(`你那儿 ${lt(at(3))}（${HT("R")}）`, `${lt(at(3))} your time (${HT("R")})`);
function cdTxt(ms){ if (ms <= 0) return ""; const h = Math.round(ms / 36e5), d = Math.floor(h / 24), hh = h % 24; return ZH() ? (d ? `${d} 天 ${hh} 小时` : `${hh} 小时`) : (d ? `${d}d ${hh}h` : `${hh}h`); }
const PH = id => /^(https?:|data:)/.test(id || "") ? id : `https://img.heyvoyo.com/npc/${id}/face.webp`;
const hostImg = () => D().host.img;
const hostNm = () => SIDE === "zh" ? (ZH() ? "苏梅" : D().host.nm) : D().host.nm;

// ── 进度：act.v1 → j.yearend_value.vk[边] ──
function fresh(){ const d = D(); return {joined: false, nb: false, item: null, cur: d.defCur, curName: "", price: null, was: null, uses: 200, pick: 0, chips: [], said: false, printed: false, own: "", showRef: false,
  votes: [], vpick: 0, vchip: 0, vsaid: false, revealed: false, sent: null, postId: "", pocket: {}, saidAt: {}, haulOpen: null}; }
let S = null;
function load(){ const o = cx.st(), J = o.j[A.id] || {}; const vk = J.vk || {}; S = Object.assign(fresh(), vk[SIDE] || {}); S.lv = K().level(); if (!A.cur[S.cur]) S.cur = D().defCur; /* 存坏了的币种不让整页出错 */ }
function save(){ const o = cx.st(); if (!o.j[A.id]) o.j[A.id] = {d0: A.starts[0], done: {}}; const J = o.j[A.id]; J.vk = J.vk || {}; const keep = Object.assign({}, S); delete keep.lv; delete keep._anim; J.vk[SIDE] = keep; cx.save(o); }
const PHK = () => "yv.photo." + SIDE;   // 照片只留在手机上，不进 act.v1（太大，不同步）
const photo = v => { try { if (v === undefined) return localStorage.getItem(PHK()) || ""; if (v) localStorage.setItem(PHK(), v); else localStorage.removeItem(PHK()); } catch(e){ return ""; } return v; };
const IDB = (mode, fn) => new Promise(res => { try { const r = indexedDB.open("hv.yv", 1); r.onupgradeneeded = () => r.result.createObjectStore("takes");
  r.onsuccess = () => { try { const tx = r.result.transaction("takes", mode), q = fn(tx.objectStore("takes")); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch(e){ res(null); } }; r.onerror = () => res(null); } catch(e){ res(null); } });

// ── 钱 ──
function fmt(v, big, ex){ if (v == null || isNaN(v)) return "—";
  if (ex){ const r = Math.round(v * 100) / 100; return big && r >= 1000 ? r.toLocaleString("en-US", {maximumFractionDigits: 2}) : String(r); }   // 用户自己打的价钱：照原样（9.99 就是 9.99）
  if (v >= 1000) return big ? Math.round(v).toLocaleString("en-US") : String(Math.round(v)); if (v >= 10) return String(Math.round(v)); if (v >= 1) return String(Math.round(v * 10) / 10); return String(Math.round(v * 100) / 100); }
const curNm = s => (s.curName || "").trim();
// money / moneyT 默认是用户打的价钱（照原样）；算出来的「一次多少钱」传 ex = false，照旧约
function money(v, k, s, ex){ ex = ex !== false; const c = A.cur[k] || A.cur.OTHER; if (k === "OTHER") return fmt(v, 1, ex) + (s && curNm(s) ? " " + curNm(s) : ""); return c.suf ? fmt(v, 1, ex) + c.suf : c.s + fmt(v, 1, ex); }
// 说出来的钱：学中文那边「29块」「12英镑」，学英语那边「12 pounds」
// 「块」说成口语：0.15 → 一毛五，0.03 → 三分，2.8 → 两块八，29 → 29块（检查员 2026-11-15：不说「0.15 块」）
const CN = "零一二三四五六七八九";
// 中文数字（一万以内）：2 → 两，12 → 十二，105 → 一百零五，560 → 五百六十，1999 → 一千九百九十九，2000 → 两千
function cnN(n){ n = Math.round(n); if (n < 10) return n === 2 ? "两" : CN[n]; if (n >= 10000) return String(n);
  const q = Math.floor(n / 1000), b = Math.floor(n % 1000 / 100), t = Math.floor(n % 100 / 10), u = n % 10, out = []; let zero = false;
  if (q) out.push((q === 2 ? "两" : CN[q]) + "千");
  if (b){ out.push((b === 2 && !q ? "两" : CN[b]) + "百"); } else if (q && (t || u)) zero = true;
  if (t){ if (zero){ out.push("零"); zero = false; } out.push((t === 1 && !q && !b ? "" : CN[t]) + "十"); } else if ((q || b) && u) zero = true;
  if (u){ if (zero) out.push("零"); out.push(CN[u]); }
  return out.join(""); }
// 「块」说成口语：0.03 → 三分，0.15 → 一毛五，1 → 一块，2 → 两块，2.8 → 两块八，12 → 十二块，1999 → 一千九百九十九块（一块以上说到毛，十块以上说整数，跟小票上的数对得上）
function kuai(v, ex){ let f = Math.round(v * 100); if (!ex){ if (f >= 1000) return cnN(Math.round(v)) + "块"; if (f >= 100) f = Math.round(f / 10) * 10; }
  const y = Math.floor(f / 100), j = Math.floor(f % 100 / 10), fe = f % 10;
  if (y >= 10000) return fmt(v, 0, ex) + "块";
  if (!y && !j) return (fe === 2 ? "两" : CN[fe]) + "分";
  if (!y) return (j === 2 ? "两" : CN[j]) + "毛" + (fe ? CN[fe] : "");
  return cnN(y) + "块" + (j && fe ? CN[j] + "毛" + CN[fe] : j ? CN[j] : fe ? "零" + CN[fe] : ""); }
function moneyT(v, k, s, ex){ ex = ex !== false; const c = A.cur[k] || A.cur.OTHER; if (SIDE === "zh" && c.zh === "块" && v > 0) return kuai(v, ex); if (k === "OTHER") return SIDE === "zh" ? fmt(v, 0, ex) + curNm(s) : fmt(v, 1, ex) + (curNm(s) ? " " + curNm(s) : ""); return SIDE === "zh" ? fmt(v, 0, ex) + c.zh : fmt(v, 1, ex) + " " + c.en; }
const curOpt = k => { const c = A.cur[k]; return SIDE === "zh" ? (c.ue || (c.s.trim() + " " + c.en)).trim() : ZH() ? (c.uz || (c.s.trim() + " " + c.zh)).trim() : (c.ue || (c.s.trim() + " " + c.en)).trim(); };
const noUnit = s => s.cur === "OTHER" && !curNm(s);
const per = s => s.price / (s.uses || 1);
const defPrice = s => { const b = A.defp[s.cur] || 100, f = (D().items[s.item == null ? 0 : s.item] || {}).pf || 1, v = b * f; return v >= 1000 ? Math.round(v / 100) * 100 : v >= 100 ? Math.round(v / 10) * 10 : Math.round(v); };
function dirOf(s){ if (!(s.was > 0) || !(s.price > 0)) return "na"; const r = (s.price - s.was) / s.was; return r <= -.05 ? "down" : r >= .05 ? "up" : "same"; }

// ── 中文：按词切开，拼音按词写在数据里（gz），一、不按后面的字变调 ──
const toneOf = py => { const m = String(py || "").match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/); if (!m) return 0; const c = m[0]; return "āēīōūǖ".includes(c) ? 1 : "áéíóúǘ".includes(c) ? 2 : "ǎěǐǒǔǚ".includes(c) ? 3 : 4; };
function segZ(text){ const G = A.gz, out = []; let i = 0, sl = false; while (i < text.length){ const c = text[i]; if (c === "⟦"){ sl = true; i++; continue; } if (c === "⟧"){ sl = false; i++; continue; }
    if (/[A-Za-z0-9.,]/.test(c) && !(c === "," && !/\d/.test(text[i + 1] || ""))){ let j = i; while (j < text.length && /[A-Za-z0-9.,]/.test(text[j]) && !(text[j] === "," && !/\d/.test(text[j + 1] || ""))) j++; out.push({t: text.slice(i, j), sl, lat: 1}); i = j; continue; }
    if (/[一-鿿]/.test(c)){ let L = Math.min(7, text.length - i), hit = null; for (; L > 0; L--){ const w = text.slice(i, i + L); if (/[⟦⟧]/.test(w)) continue; if (G[w]){ hit = w; break; } } const w = hit || c; out.push({t: w, sl, z: 1, py: G[w] ? G[w][0] : ""}); i += w.length; continue; }
    out.push({t: c, sl, p: 1}); i++; }
  out.forEach((u, k) => { if (!u.z || (u.t !== "一" && u.t !== "不")) return; const nx = out[k + 1]; if (!nx || !nx.z){ u.py = u.t === "一" ? "yī" : "bù"; return; } const tn = toneOf(String(nx.py).split(" ")[0]);
    u.py = u.t === "一" ? (tn === 4 ? "yí" : "yì") : (tn === 4 ? "bú" : "bù"); });
  return out; }
const pyOf = t => segZ(plain(t)).filter(u => u.z).map(u => u.py).join(" ");
function segE(text){ const out = []; const re = /(⟦|⟧)|([A-Za-z][A-Za-z'’-]*)|([^A-Za-z⟦⟧]+)/g; let m, sl = false; while ((m = re.exec(text))){ if (m[1]){ sl = m[1] === "⟦"; continue; } if (m[2]) out.push({t: m[2], sl, w: 1}); else out.push({t: m[3], sl, p: 1}); } return out; }
const CLOSE = /^[，。！？；：、）」』”’…—,.!?;:)]$/, OPEN = /^[「『“‘（(]$/;
const glossZ = w => (A.gz[w] || [])[1] || "", glossE = w => ZH() ? (A.ge[w.toLowerCase().replace(/[’]/g, "'")] || "") : "";
const ruby = l => l === "zh" && !ZH();   // 中文句子上面放拼音：只给不是中文界面的人（学中文的人）
function unitsOf(text, l){ const zh = l === "zh", rb = ruby(l); return (zh ? segZ(text) : segE(text)).map(k => { const cls = "w" + (k.sl ? " sl" : "");
  if (zh && k.z) return {h: `<span class="${cls}" data-w="${esc(k.t)}" data-l="zh">${rb && k.py ? `<ruby>${esc(k.t)}<rt>${esc(k.py.replace(/ /g, ""))}</rt></ruby>` : esc(k.t)}</span>`, box: 1};
  if (k.w || k.lat) return {h: `<span class="${cls}" data-w="${esc(k.t)}" data-l="${zh ? "zh" : "en"}">${esc(k.t)}</span>`, box: 1};
  return {h: k.sl ? `<span class="sl w">${esc(k.t)}</span>` : esc(k.t), p: k.t, box: k.sl ? 1 : 0}; }); }
// 一句话：画线的说法（[…]）只在你在学的那种语言里画，点了收进口袋
function tokHTML(text, l){ const zh = l === "zh", mine = l === D().tl, parts = String(text).split(/\[([^\]]+)\]/); const U2 = [];
  parts.forEach((part, i) => { if (!part) return; const us = unitsOf(part, l); if (i % 2 && mine){ const got = S.pocket[part]; U2.push({h: `<u class="bw${got ? " got" : ""}" data-bw="${esc(part)}">${us.map(u => u.h).join("")}</u>`, box: 1}); } else U2.push(...us); });
  if (!zh) return U2.map(u => u.h).join("");
  const out = []; let pre = "";   // 中文：逗号句号贴在前一个字上，开引号贴在后一个字上
  for (const u of U2){ if (u.p && CLOSE.test(u.p) && out.length && out[out.length - 1].box){ const L = out[out.length - 1]; L.h = L.h.replace(/(<\/span>(?:<\/u>)?)$/, esc(u.p) + "$1"); continue; }
    if (u.p && OPEN.test(u.p)){ pre += esc(u.p); continue; }
    if (pre && u.box){ u.h = u.h.replace(/^((?:<u[^>]*>)?<span[^>]*>)/, "$1" + pre); pre = ""; } else if (pre){ u.h = pre + u.h; pre = ""; }
    out.push(u); }
  return out.map(u => u.h).join("") + pre; }
// 意思：中文句子给不是中文界面的人看英文意思；英文句子只给中文界面的人看中文意思（阿语、西语界面不看中文）
const meanFor = (l, tr) => !tr ? "" : l === "zh" ? (ZH() ? "" : tr) : (ZH() ? tr : "");
function TL(text, tr, l, extra){ l = l || D().tl; const m = meanFor(l, tr); return `<div class="tl ${l === "zh" ? "" : "en"} ${extra || ""}" dir="auto"><button class="say" data-say="${esc(plain(text))}" data-l="${l}" aria-label="▶">▶</button><div class="tx"${l === "en" ? ' lang="en"' : ' lang="zh"'}>${tokHTML(text, l)}</div>${m ? `<small>${esc(m)}</small>` : ""}</div>`; }
function wordsHTML(text){ const l = D().tl; text = plain(text); const seen = new Set();
  const list = (l === "zh" ? segZ(text).filter(k => k.z).map(k => [k.t, k.py, glossZ(k.t)]) : segE(text).filter(k => k.w).map(k => [k.t, "", glossE(k.t)])).filter(([w, , g]) => g && !seen.has(w) && seen.add(w));
  if (!list.length) return ""; return `<div class="words"><div class="wt">${T("需要的词 · 点一下听", "Words you need · tap to hear")}</div>${list.map(([w, p, g]) => `<button data-ws="${esc(w)}">${esc(w)}${p ? ` <small>${esc(p)}</small>` : ""}<small>${esc(g)}</small></button>`).join("")}</div>`; }
function say(t, l, btn){ K().say(plain(t), {l: l || D().tl}); if (btn){ btn.classList.add("play"); setTimeout(() => btn.classList.remove("play"), Math.max(1800, plain(t).length * (l === "zh" ? 300 : 85))); } }

// ── 你的句子（和它的意思，一句对一句）──
const itemOf = s => D().items[s.item == null ? 0 : s.item];
const ZH_NB_PICK = m => [["这钱我留着。", "I'm keeping the money."], [`我已经有一${m}了。`, "I already have one."], ["下次再说。", "Maybe next time."]];
const ZH_NB_CHIP = m => [[`我已经有一${m}了`, "I already have one"], ["用不了几次", "I'd hardly use it"], ["我想先存钱", "I want to save first"], ["我在等打折", "I'm waiting for a sale"]];
const ZH_V = [["很值！", "Really worth it!"], ["还行。", "It's OK."], ["不值。", "Not worth it."]];
const ZH_CHIP = [["它是二手的。", "It's second-hand."], ["我会天天用。", "I'll use it every day."], ["它很结实。", "It's sturdy."], ["我差点买了贵的。", "I almost bought a pricier one."]];
const EN_NB_PICK = m => [["I'm keeping the money.", "这钱我留着。"], ["I already have one.", `我已经有一${m}了。`], ["Maybe next time.", "下次吧。"]];
const EN_NB_CHIP = (m, d) => ({down: [["I don't really need it", "我不是真的需要"], ["I already have one", `我已经有一${m}了`], ["I'd rather save the money", "我宁愿把钱存着"], ["it's still a lot of money", "就算降了，也还是不便宜"]],
  same: [["the price didn't drop", "价钱根本没降"], ["I don't really need it", "我不是真的需要"], ["I already have one", `我已经有一${m}了`], ["I'd rather save the money", "我宁愿把钱存着"]],
  up: [["the price went up", "价钱反而涨了"], ["I don't really need it", "我不是真的需要"], ["I already have one", `我已经有一${m}了`], ["I'd rather wait", "我宁愿再等等"]],
  na: [["I don't really need it", "我不是真的需要"], ["I already have one", `我已经有一${m}了`], ["I'd rather save the money", "我宁愿把钱存着"], ["it's still a lot of money", "还是挺贵的"]]}[d]);
const EN_V = [["It's worth it!", "很值！"], ["It's OK.", "还行。"], ["It's not worth it.", "不值。"]];
const EN_CHIP = d => ({down: [["It was a real drop.", "真的降价了。"], ["I checked the price before the sale.", "我大促前看过价。"], ["I almost bought a more expensive one.", "我差点买了更贵的。"], ["I'll use it every day.", "我每天都会用。"]],
  same: [["The price didn't change, but I need it.", "价钱没变，可我需要它。"], ["I checked the price before the sale.", "我大促前看过价。"], ["I'll use it every day.", "我每天都会用。"], ["I almost bought a more expensive one.", "我差点买了更贵的。"]],
  up: [["It went up, but I still need it.", "价钱涨了，可我还是需要它。"], ["I checked the price before the sale.", "我大促前看过价。"], ["I'll use it every day.", "我每天都会用。"], ["Next time I'll buy earlier.", "下次我早点买。"]],
  na: [["I'll use it every day.", "我每天都会用。"], ["I almost bought a more expensive one.", "我差点买了更贵的。"], ["It's second-hand.", "它是二手的。"], ["I really need it.", "我真的需要它。"]]}[d]);
const low1 = t => t.charAt(0).toLowerCase() + t.slice(1);
// 返回 [句子, 意思]；比较流利档自己写的不翻
function mine(s){ const it = itemOf(s);
  if (SIDE === "zh"){ const mE = (v, ex) => s.cur === "OTHER" && /[一-鿿]/.test(curNm(s)) ? fmt(v, 1, ex !== false) : A.cur[s.cur] && A.cur[s.cur].zh === "块" ? fmt(v, 1, ex !== false) + " " + A.cur[s.cur].en : money(v, s.cur, s, ex); const P = moneyT(s.price, s.cur, s), Pm = mE(s.price), m = it.m, g = it.g;
    if (s.nb){ const nm = `那${m}${it.t}`;
      if (s.lv === 0){ const p = ZH_NB_PICK(m)[s.pick] || ZH_NB_PICK(m)[0]; return [`我没买⟦${nm}⟧，省了⟦${P}⟧。${p[0]}`, `I didn't buy that ${g}. I saved ${Pm}. ${p[1]}`]; }
      if (s.lv === 1){ const c = ZH_NB_CHIP(m)[s.chips[0] || 0]; return [`我没买⟦${nm}⟧，省了⟦${P}⟧，因为⟦${c[0]}⟧。`, `I didn't buy that ${g}. I saved ${Pm}, because ${low1(c[1])}.`]; }
      return s.own.trim() ? [s.own.trim(), ""] : [`我盯了${nm}很久，最后没买。我已经有一${m}能用的了，省下的${P}，我先存着。`, `I'd had my eye on that ${g} for ages, but in the end I didn't buy it. I already have one that works, so I'm keeping the ${Pm} I saved.`]; }
    const nm = `这${m}${it.t}`, pu = moneyT(per(s), s.cur, s, false), pum = mE(per(s), false);
    if (s.lv === 0){ const v = ZH_V[s.pick] || ZH_V[0]; return [`⟦${nm}⟧${noUnit(s) ? "花了" : ""}⟦${P}⟧，我打算用⟦${s.uses}⟧次。${v[0]}`, `This ${g} cost ${Pm}, and I plan to use it ${s.uses} times. ${v[1]}`]; }
    if (s.lv === 1) return [`${nm}${noUnit(s) ? "花了" : ""}⟦${P}⟧，我打算用⟦${s.uses}⟧次，一次才⟦${pu}⟧。` + s.chips.map(i => ZH_CHIP[i][0]).join(""), `This ${g} cost ${Pm}. I plan to use it ${s.uses} times, so it's only ${pum} a go.` + s.chips.map(i => " " + ZH_CHIP[i][1]).join("")];
    return s.own.trim() ? [s.own.trim(), ""] : [`${nm}${noUnit(s) ? "花了" : ""}${P}。我差点买了一${m}贵一倍的，后来想想没必要。我打算天天用，大概能用${s.uses}次，一次才${pu}。我觉得很值。`, `This ${g} cost ${Pm}. I almost bought one that cost twice as much, but then I thought, there's no need. I'll use it every day — about ${s.uses} times, only ${pum} a go. I think it's really worth it.`]; }
  const t = it.t, g = it.g, m = it.zm, P = moneyT(s.price, s.cur, s), Pm = money(s.price, s.cur, s), dir = dirOf(s), old = s.was > 0 ? moneyT(s.was, s.cur, s) : P, oldm = s.was > 0 ? money(s.was, s.cur, s) : Pm;
  if (s.nb){
    if (s.lv === 0){ const p = EN_NB_PICK(m)[s.pick] || EN_NB_PICK(m)[0]; return [`I didn't buy ⟦${t}⟧. I saved ⟦${P}⟧. ${p[0]}`, `我没买${g}，省了 ${Pm}。${p[1]}`]; }
    if (s.lv === 1){ const c = EN_NB_CHIP(m, dir)[s.chips[0] || 0]; return [`I didn't buy ⟦${t}⟧. I saved ⟦${P}⟧, because ⟦${c[0]}⟧.`, `我没买${g}，省了 ${Pm}，因为${c[1]}。`]; }
    if (s.own.trim()) return [s.own.trim(), ""];
    return {down: [`It went from ${old} to ${P}, so the drop was real. But mine still works, so in the end I didn't buy it. Not buying felt better than I expected.`, `它从 ${oldm} 降到了 ${Pm}，是真降价。可我原来那${m}还能用，所以最后没买。没买的感觉比我想的好。`],
      same: [`It was ${P} before the sale and ${P} now, so the sale sign didn't mean much. Mine still works, so I didn't buy it.`, `大促前 ${Pm}，现在还是 ${Pm}，大促的牌子没什么意思。我原来那${m}还能用，所以没买。`],
      up: [`It actually went up, from ${old} to ${P}. Mine still works anyway, so I didn't buy it.`, `它居然从 ${oldm} 涨到了 ${Pm}。反正我原来那${m}还能用，所以没买。`],
      na: [`I'd had my eye on it for a while, but mine still works, so in the end I didn't buy it. I'm keeping the ${P} I saved.`, `我盯了它一阵子，可我原来那${m}还能用，所以最后没买。省下的 ${Pm} 我留着。`]}[dir]; }
  const pu = moneyT(per(s), s.cur, s, false), pum = money(per(s), s.cur, s, false);
  if (s.lv === 0){ const v = EN_V[s.pick] || EN_V[0]; return [`I bought ⟦${t}⟧ for ⟦${P}⟧. ${v[0]}`, `我花 ${Pm} 买了一${m}${g}。${v[1]}`]; }
  if (s.lv === 1){ const C = EN_CHIP(dir); return [`I got ⟦${t}⟧ for ⟦${P}⟧. If I use it ⟦${s.uses}⟧ times, that's ⟦${pu}⟧ a go.` + s.chips.map(i => " " + C[i][0]).join(""), `我花 ${Pm} 买到了一${m}${g}。要是用 ${s.uses} 次，一次就是 ${pum}。` + s.chips.map(i => C[i][1]).join("")]; }
  if (s.own.trim()) return [s.own.trim(), ""];
  return {down: [`It went from ${old} to ${P}, and I checked the price before the sale, so the drop is real. I almost got a fancier one, but this does the same job. I'll use it about ${s.uses} times. That's ${pu} a go. Worth it.`, `它从 ${oldm} 降到了 ${Pm}，我大促前看过价，所以是真降价。我差点买了更好看的，可这一${m}一样好用。我大概会用 ${s.uses} 次，一次 ${pum}。值。`],
    same: [`The price didn't change. It was ${P} before the sale too, so the sale didn't help. But I really need it, and I'll use it about ${s.uses} times. That's ${pu} a go. Still worth it.`, `价钱没变，大促前也是 ${Pm}，大促没帮上忙。可我真的需要它，大概会用 ${s.uses} 次，一次 ${pum}。还是值。`],
    up: [`It went up from ${old} to ${P}. I bought it anyway, because I really need it. I'll use it about ${s.uses} times, so that's ${pu} a go. Worth it, but next time I'll buy earlier.`, `它从 ${oldm} 涨到了 ${Pm}。我还是买了，因为真的需要。大概会用 ${s.uses} 次，一次 ${pum}。值，不过下次我早点买。`],
    na: [`I almost got a fancier one, but this does the same job. It was ${P}, and I'll use it about ${s.uses} times. That's ${pu} a go. Worth it.`, `我差点买了更好看的，可这一${m}一样好用。它 ${Pm}，我大概会用 ${s.uses} 次，一次 ${pum}。值。`]}[dir]; }
const lineMine = s => mine(s)[0], trMine = s => mine(s)[1];
const allCards = () => A.wall.concat(REAL);
const wallOf = id => allCards().find(x => x.id === id);
function vName(s){ const w = wallOf(s.votes[0]); return w ? String(w.nm || "").replace("小雨 ", "") || T("这一位", "this one") : ""; }
const ZH_VP = [["这个最值！", "This is the best value!"], ["这个最好笑！", "This is the funniest!"], ["这个我也想买！", "I want to buy this too!"]];
const ZH_VC = m => [["一次很便宜", "it's cheap per use"], ["用了很久", "it's been used for ages"], ["没买也很值", "not buying is good value too"], [`我也想买一${m}`, "I want to buy one too"]];
const EN_VP = [["Best value!", "最值！"], ["So funny!", "太好笑了！"], ["I want one too!", "我也想要一个！"]];
const EN_VC = [["it costs almost nothing a go", "一次几乎不花钱"], ["they'll use it for years", "能用好多年"], ["not buying was smart", "没买很聪明"], ["I want one too", "我也想要一个"]];
function votePair(s){ const n = vName(s), w = wallOf(s.votes[0]) || {};
  if (SIDE === "zh"){ if (s.lv === 0){ const p = ZH_VP[s.vpick] || ZH_VP[0]; return [`我投给⟦${n}⟧，${p[0]}`, `I'm voting for ${n}. ${p[1]}`]; } if (s.lv === 1){ const c = ZH_VC(w.m || "个")[s.vchip] || ZH_VC("个")[0]; return [`我投给⟦${n}⟧，因为⟦${c[0]}⟧。`, `I'm voting for ${n}, because ${c[1]}.`]; }
    return s.own.trim() ? [s.own.trim(), ""] : ["下次买东西，我会先问自己：我会用多少次？要是用不了十次，我就先不买。", "Next time I go shopping, I'll first ask myself: how many times will I use it? If it's fewer than ten, I won't buy it for now."]; }
  if (s.lv === 0){ const p = EN_VP[s.vpick] || EN_VP[0]; return [`I'm voting for ⟦${n}⟧. ${p[0]}`, `我投给 ${n}。${p[1]}`]; } if (s.lv === 1){ const c = EN_VC[s.vchip] || EN_VC[0]; return [`I'm voting for ⟦${n}⟧, because ⟦${c[0]}⟧.`, `我投给 ${n}，因为${c[1]}。`]; }
  return s.own.trim() ? [s.own.trim(), ""] : ["Next time I shop, I'll ask myself one thing first: how many times will I really use it? If it's less than ten, I'll wait.", "下次买东西，我会先问自己一件事：我真的会用几次？要是不到十次，我就再等等。"]; }

// ── 口袋：画线的说法 ──
let TIP = null;
function tipEl(){ if (!TIP){ TIP = document.createElement("div"); TIP.className = "yvx-tip"; TIP.dataset.nopy = ""; document.body.appendChild(TIP); } return TIP; }
function tipAt(el, html){ const tip = tipEl(); tip.innerHTML = html; tip.classList.add("on"); const r = el.getBoundingClientRect(), tw = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2)) + "px"; tip.style.top = (r.top > 90 ? r.top - tip.offsetHeight - 6 : r.bottom + 6) + "px"; }
const tipOff = () => { if (TIP) TIP.classList.remove("on"); };
const bwMean = ph => { const m = D().bw[ph] || ""; return D().tl === "zh" ? (ZH() ? "" : m) : (ZH() ? m : ""); };
function grab(ph, el){ const fr = !S.pocket[ph]; if (fr) S.pocket[ph] = {st: cx.d}; say(ph); K().blip(fr ? 1250 : 950);
  tipAt(el, `<b>${esc(ph)}</b>${D().tl === "zh" ? `<span class="py">${esc(pyOf(ph))}</span><br>` : ""}${esc(bwMean(ph))}<br><span style="color:#ffd27a">${fr ? T("🎒 收进口袋了", "🎒 In your pocket") : T("🎒 口袋里已经有了", "🎒 Already in your pocket")}</span>`);
  if (fr){ R.querySelectorAll(`[data-bw="${CSS.escape(ph)}"]`).forEach(u => u.classList.add("got")); note8(el); save(); } }
const saidAll = () => Object.values(S.saidAt).join(" ").toLowerCase();
function ammoHTML(){ const ks = Object.keys(S.pocket).slice(-3).reverse(), said = saidAll();
  if (!ks.length) return `<div class="ammo"><span class="at">🎒 ${T("出招前 · 再听一遍", "Before you speak · hear it again")}</span> <span class="hint2">${T("上面画线的说法点一下就收进口袋，说的时候在这儿等你。", "Tap an underlined phrase above to pocket it — it'll wait here.")}</span></div>`;
  return `<div class="ammo"><span class="at">🎒 ${T("出招前 · 再听一遍", "Before you speak · hear it again")}</span><div class="chips">${ks.map(k => `<button class="chip am" data-am="${esc(k)}"><span>${said.includes(k.toLowerCase()) ? "🗣️" : "🎒"}</span> ${esc(k)}<small>${esc(bwMean(k))}</small></button>`).join("")}</div></div>`; }
function haulHTML(){ const k = KEYS[cx.d], line = S.saidAt[k], got = Object.keys(S.pocket).filter(p => S.pocket[p].st === cx.d); if (!line && !got.length) return "";
  const open = S.haulOpen == null ? innerWidth >= 900 : S.haulOpen;
  return `<details class="haul" ${open ? "open" : ""}><summary class="hh">🏷️ ${T("今天捡到的说法", "Today's pickups")} <small>${(line ? 1 : 0) + got.length}</small></summary><p>${T("只收你说出来的（🗣️）和你收进口袋的（🎒）。点一张再听。", "Only what you said (🗣️) and what you pocketed (🎒). Tap one to hear it again.")}</p>
    ${line ? `<button class="hs2 used" data-say="${esc(line)}"><span>🗣️</span>${esc(line)}</button>` : ""}${got.map(p => `<button class="hs2" data-say="${esc(p)}"><span>🎒</span><b>${esc(p)}</b> <i>${esc(bwMean(p))}</i></button>`).join("")}</details>`; }

// ── 小块 ──
const tag = t => `<span class="tag">${esc(X(t))}</span>`;
const lrnTag = id => { const l = (A.learning || {})[id]; return l === "zh" ? `<span class="tag lrn">${T("在学中文", "learning Chinese")}</span>` : l === "en" ? `<span class="tag lrn">${T("在学英语", "learning English")}</span>` : ""; };
function hostSay(k, pol){ const d = D(), L = d.L[k]; if (!L) return ""; return `<div class="hs">${pol ? `<div class="pol"><div class="im">${d.polaroid.e}</div><div class="cap">${esc(d.polaroid.cap)}</div></div>` : ""}<div class="hsb"><div class="who"><img class="av" src="${esc(hostImg())}" alt="" style="width:22px;height:22px;vertical-align:middle"> <b>${esc(hostNm())}</b> ${tag(d.host.tag)}</div>${TL(L[0], L[1])}</div></div>`; }
function matHTML(k){ let m = D().mat[k]; if (!m) return ""; if (!Array.isArray(m)) m = ZH() ? m.zh : (m.en || m.zh);
  if (RL()) m = [m[0], String(m[1]).replace(/\s*(12 月 12 日到 25 日，哪天晒都可以。|Post any day from 12 to 25 December\.)/, ""), m[2]];   // rolling：材料里「12 月 12 日到 25 日哪天晒都行」这句是按日历的，不说
  return `<div class="mat"><span class="k">📎 ${esc(m[0])}</span><br>${esc(m[1])}<span class="src">${esc(m[2])}</span></div>`; }
function lockHTML(k){ const nm = hostNm(); const H = {poster: [RL() ? T("晒一样：" + whenO(), "Show yours: " + whenO()) : T("开张：" + whenO(), "Posting opens " + whenO()), T("先挑一样你真想买的东西——或者一样你忍住没买的。", "Bring one thing — or one thing you didn't buy.")], to: 1},
    post = {h: [T("开始投票：" + whenV(), "Voting opens " + whenV()), T("揭晓：" + whenR() + "。三个瓶盖，三个性价比之王。", "Results " + whenR() + ": three caps, three winners.")], to: 2},
    vote = {h: [T("揭晓：" + whenR(), "Results " + whenR()), T(nm + "打开收银台。", nm + " opens the till.")], to: 3},
    rev = {h: [T("第二届：明年年底的大促", "Year two: next year's sales"), T("带着你今年学会的那一招来。", "Bring the trick you learned this year.")]};
  const x = {poster: {h: H.poster.slice(0, 2), to: 1}, post, vote, reveal: rev}[k]; if (!x) return ""; const cd = x.to && !opened(x.to) ? cdTxt(at(x.to) - now()) : "";
  return `<div class="lock"><span class="ic">${k === "reveal" ? "🎟️" : "🔒"}</span><div><b>${esc(x.h[0])}</b><span>${esc(x.h[1])}</span></div>${cd ? `<span class="cd">${cd}</span>` : ""}</div>`; }
const levels = () => `<div class="lvrow">${K().levelsHTML(S.lv)}</div>`;
function micBlock(key, done, line){ return `${ammoHTML()}<div class="yv-mic" data-mic="${key}">${K().micHTML(done ? {done: plain(line), real: !!S.real} : null)}</div>`; }

function receiptHTML(s, o){ o = o || {}; const d = D(), it = itemOf(s), ph = photo(); let i = 0; const ln = h => `<div class="ln" style="animation-delay:${o.anim ? (i++) * .13 : 0}s">${h}</div>`;
  const rows = [ln(`<div class="shop">${esc(d.shop[0])}<small>${esc(X(d.shop[1]))}</small></div>`), ln(`<div class="r"><span>${esc((s.at || A.starts[0]) + " " + d.rcPlace)}</span><span>${esc(A.t[ZH() ? "zh" : "en"])}</span></div>`), ln(`<div class="dash"></div>`)];
  if (o.blank) rows.push(ln(o.blank)); else {
    rows.push(ln(`<div class="ph"><div class="im">${ph ? `<img src="${esc(ph)}" alt="">` : it.e}</div><div style="min-width:0"><b>${esc(it.t)}</b>${(SIDE === "zh" ? !ZH() : ZH()) ? `<br><small style="color:#6a6f78">${esc(it.g)}</small>` : ""}</div></div>`));
    if (s.was > 0) rows.push(ln(`<div class="r"><span>${T("大促前", "WAS")}</span><span>${money(s.was, s.cur, s)}</span></div>`));
    if (s.nb){ rows.push(ln(`<div class="r"><span>${T("没买", "NOT BOUGHT")}</span><span>✓</span></div>`), ln(`<div class="dash"></div>`), ln(`<div class="r big"><span>${T("省下", "SAVED")}</span><span>${money(s.price, s.cur, s)}</span></div>`)); }
    else rows.push(ln(`<div class="r"><span>${T("价钱", "PRICE")}</span><span>${money(s.price, s.cur, s)}</span></div>`), ln(`<div class="r"><span>${T("打算用", "WILL USE")}</span><span>× ${s.uses}</span></div>`), ln(`<div class="dash"></div>`), ln(`<div class="r big"><span>${T("一次", "PER USE")}</span><span>${money(per(s), s.cur, s, false)}</span></div>`)); }
  if (o.said) rows.push(ln(`<div class="dash"></div><div class="said" dir="auto">“${esc(plain(lineMine(s)))}”</div>`));
  if (o.note) rows.push(ln(o.note));
  rows.push(ln(`<div class="bc"></div><div class="tiny">${T("一张照片 · 一句话 · 三个瓶盖可投", "1 PHOTO · 1 LINE · 3 CAPS TO GIVE")}</div>`));
  const pu = o.pu ? `<div class="pu">${s.nb ? `${T("省下", "SAVED")}<b>${money(s.price, s.cur, s)}</b>` : `${T("一次", "PER USE")}<b>${money(per(s), s.cur, s, false)}</b>`}</div>` : "";
  return `<div class="rcw" ${o.id ? `id="${o.id}"` : ""}>${pu}<div class="rc">${rows.join("")}${o.stamp ? `<div class="rstamp">${o.stamp}</div>` : ""}</div></div>`; }

// 墙上一张：角色（🎭）、真人（送给世界的）、你自己
function miniHTML(w, mode){ const isMe = w.me, voted = S.votes.includes(w.id), won = mode === "reveal" && A.awards.some(a => a.to === w.id), l = isMe ? D().tl : (w.l || "en");
  const ph = photo(), img = isMe ? (ph ? `<img src="${esc(ph)}" alt="">` : itemOf(S).e) : w.img ? `<img src="data:image/jpeg;base64,${esc(w.img)}" alt="">` : (w.e || "🧾");
  const city = Array.isArray(w.city) ? T(w.city[0], w.city[1]) : (w.city || "");
  const who = isMe ? `<span class="av me">${esc(T("你", "You").slice(0, 1))}</span><b>${T("你", "You")}</b>` : `${w.real ? `<span class="av me">${esc(String(w.nm || "?").slice(0, 1))}</span>` : `<img class="av" src="${esc(PH(w.id))}" alt="">`}<span style="min-width:0"><b>${esc(w.nm || T("一位朋友", "Someone"))}</b>${city ? " · " + esc(city) : ""} ${w.real ? "" : lrnTag(w.id)}</span>`;
  const p = isMe ? S : w, cur = p.cur, o = isMe ? S : {curName: w.curName};
  const nums = p.nb ? `<div class="r"><span>${T("没买", "didn't buy")}</span><span class="nb">${T("省", "saved")} ${money(p.price, cur, o)}</span></div>` : `<div class="r"><span>${money(p.price, cur, o)}</span><span>× ${p.uses}</span></div><div class="r"><span>${T("一次", "per use")}</span><span class="pc">${money(p.price / (p.uses || 1), cur, o, false)}</span></div>`;
  const line = isMe ? TL(lineMine(S), trMine(S), l) : TL(w.real ? w.t : w.line, w.tr, l);
  const sale = !isMe && w.sale && w.sale[0] ? `<div class="sale">🏷️ ${esc(T(w.sale[0][0], w.sale[0][1]))}${w.sale[1] ? `<small>${esc(T(w.sale[1][0], w.sale[1][1]))}</small>` : ""}</div>` : "";
  const gl = isMe ? ((SIDE === "zh" ? !ZH() : ZH()) ? itemOf(S).g : "") : (l === "zh" ? (ZH() ? "" : w.ig) : (ZH() ? w.ig : ""));
  let foot = "";
  if (mode === "vote" && !isMe) foot = `<button class="cap-b ${voted ? "on" : ""}" data-cap="${esc(w.id)}" ${!voted && S.votes.length >= 3 ? "disabled" : ""}><span class="capi ${voted ? "drop" : ""}"></span>${voted ? T("你的瓶盖 ✓", "Your cap ✓") : T("投一个瓶盖", "Give a cap")}</button>`;
  if (mode === "vote" && isMe) foot = `<div class="rv" style="color:var(--soft)">${T("不能投自己", "Can't vote for yourself")}</div>`;
  if (mode === "reveal" && voted) foot = `<div class="rv"><span class="capi"></span>${T("1 张真人票，是你投的", "1 real vote — yours")}</div>`;
  if (w.real && !isMe) foot += `<div class="mod">${K().modHTML("yearend", w)}</div>`;
  return `<div class="mini ${l === "en" ? "en" : ""} ${isMe ? "me" : ""} ${voted ? "voted" : ""} ${won ? "win" : ""}"><div class="who">${who}${isMe ? "" : w.real ? `<span class="tag real">${T("真人", "real")}</span>` : `<span class="tag">🎭</span>`}</div><div class="e">${img}</div><div class="itn">${esc(isMe ? itemOf(S).t : w.item)} ${gl ? `<small>${esc(gl)}</small>` : ""}</div>${nums}${sale}${line}${foot}</div>`; }
// 墙：你 → 真人 → 说你在学的语言的角色 → 别的角色
function wallHTML(mode){ const tl = D().tl, seeds = A.wall.slice().sort((a, b) => (a.l === tl ? 0 : 1) - (b.l === tl ? 0 : 1));
  const list = [...(S.printed ? [{me: true, id: "me"}] : []), ...REAL.filter(r => !r.own), ...seeds];
  return `<div class="wall">${list.map(w => miniHTML(w, mode)).join("")}</div>`; }
async function loadReal(){ if (REAL_ON) return; REAL_ON = true; try { const L = await K().load("yearend", {eq: {ed: A.ed}, limit: 120}); REAL = L.filter(x => x.k === "rc" && x.t);
    if (REAL.length && R && R.isConnected && ["post", "vote", "reveal"].includes(KEYS[cx.d])) keep(render); } catch(e){} }

// ── 每一步 ──
function vPoster(){ const d = D(), s = S, zh = SIDE === "zh";
  return `<div class="poster"><div class="pk">${esc(d.kick)}</div><div class="big">${RL() ? `DAY 1 <em>→</em> ${A.days}` : `12<em>·</em>12 → 12<em>·</em>27`}</div><div class="t">${esc(A.t[ZH() ? "zh" : "en"])}</div>
    <ol>${[T("晒一样你今年大促里买的、真的值的东西——或者一样你<b>忍住没买</b>的。中国的双十二、美国的黑五，<b>年底各地的大促都算</b>，平时的年底打折也算。", "Show one thing from <b>this year's sales where you live</b> that was really worth it — or one thing you <b>didn't</b> buy. Double 12 in China, Black Friday in the US: <b>every year-end sale counts</b>, ordinary year-end discounts too."),
      T("价钱（用你自己那里的钱）÷ 打算用的次数 = <b>一次多少钱</b>。没人拿元比英镑。", "Price in your own money ÷ the times you'll use it = <b>cost per use</b>. Nobody compares yuan with pounds."),
      RL() ? T("第 2 天晒一样，小票打好就能挂上墙。第 3 天你有 <b>3 个瓶盖</b>，投给墙上的小票（不能投自己）。", "Day 2: show yours — your receipt goes on the wall as soon as it's printed. Day 3: you get <b>3 bottle caps</b> to give to receipts on the wall (not your own).")
      : T("12 月 12 日到 25 日，哪天晒都行，小票打好就能挂上墙。最后两天每人 <b>3 个瓶盖</b>投票（不能投自己）。", "Post any day from 12 to 25 December; your receipt goes on the wall as soon as it's printed. In the last two days everyone gets <b>3 bottle caps</b> to vote (not for yourself)."),
      T(`揭晓：${esc(whenR())}。${esc(hostNm())}打开收银台，三个瓶盖，三个性价比之王。`, `Results ${esc(whenR())}: ${esc(hostNm())} opens the till. Three caps, three winners.`)].map(x => `<li>${x}</li>`).join("")}</ol></div>
    <div class="card">${hostSay("poster")}${matHTML("poster")}</div>
    <div class="card"><h3><span class="n ${s.joined ? "ok" : ""}">${s.joined ? "✓" : "1"}</span>${T("领一张小票", "Get your receipt")}</h3>
     <p class="hint">${T("不比谁花得少。几块钱的东西能赢，什么都没买也能赢。", "Not about spending less. A cheap thing can win, and so can not buying at all.")}</p>
     ${!RL() && !opened(1) ? `<div class="lock in"><span class="ic">🔒</span><div><b>${esc(T("开张：" + whenO(), "Opens " + whenO()))}</b><span>${esc(T("到了那一刻才能领小票、晒东西。", "Receipts and posting open at that moment."))}</span></div></div>` : s.joined ? receiptHTML(s, {blank: `<div style="text-align:center;color:#8a8f98;padding:16px 0">${T("— 空白 · 等你晒 —", "— blank · waiting for your sale —")}</div>`}) : `<button class="btn hot" data-act="join">🎟️ ${T("我要参加 · 打一张空白小票", "I'm in — print my blank receipt")}</button>`}
    </div>${lockHTML("poster")}`; }
function itemPicker(s){ return `<div class="items">${D().items.map((it, i) => `<button class="it ${s.item === i ? "on" : ""}" data-item="${i}"><span class="e">${it.e}</span><b>${esc(it.t)}</b>${(SIDE === "zh" ? !ZH() : ZH()) ? `<small>${esc(it.g)}</small>` : ""}</button>`).join("")}</div>`; }
const curSel = s => `<select data-cur>${D().curs.map(k => `<option value="${k}" ${s.cur === k ? "selected" : ""}>${esc(curOpt(k))}</option>`).join("")}</select>`;
const curNameRow = s => s.cur === "OTHER" ? `<div class="nums one"><div><label>${T("你的币种（可以不填）", "Your currency (optional)")}</label><div class="nf"><input type="text" data-curname maxlength="20" value="${esc(s.curName || "")}" placeholder="${esc(SIDE === "zh" ? T("比如 比索 / 兰特，不填也行", "e.g. 比索 / 兰特 — or leave empty") : T("比如 rand / lira，不填也行", "e.g. rand / lira — or leave empty"))}"></div></div></div>` : "";
const photoRow = () => `<div class="photo"><label>📷 ${T("放你拍的照片", "Add your photo")}<input type="file" accept="image/*" data-photo></label><span>${photo() ? T("照片印上小票了 ✓", "Photo on the receipt ✓") : T("照片只留在你手机上，送给世界时才一起送出", "Stays on your phone until you send it to the world")}</span></div>`;
function sayBlock(kind){ const s = S, zh = SIDE === "zh"; let pair, picks = null, chips = null, multi = false, q = "";
  if (kind === "vote"){ pair = votePair(s); const w = wallOf(s.votes[0]) || {}; if (s.lv === 0) picks = zh ? ZH_VP : EN_VP; if (s.lv === 1) chips = zh ? ZH_VC(w.m || "个") : EN_VC; if (s.lv === 2) q = T("看完大家的，你下次买东西会先问自己什么？说 30 秒。", "After seeing everyone's, what will you ask yourself first next time you shop? (30 sec)"); }
  else { pair = mine(s); const it = itemOf(s);
    if (s.lv === 0) picks = s.nb ? (zh ? ZH_NB_PICK(it.m) : EN_NB_PICK(it.zm)) : (zh ? ZH_V : EN_V);
    if (s.lv === 1){ if (s.nb) chips = zh ? ZH_NB_CHIP(it.m) : EN_NB_CHIP(it.zm, dirOf(s)); else { chips = zh ? ZH_CHIP : EN_CHIP(dirOf(s)); multi = true; } }
    if (s.lv === 2) q = s.nb ? T("最后为什么没买？省下的钱打算怎么办？说 30 秒。", "Why didn't you buy it in the end? What will you do with the money? (30 sec)") : T("它为什么值？你差点买了别的什么？说 30 秒。", "Why is it worth it? What did you almost buy instead? (30 sec)"); }
  const sel = kind === "vote" ? (s.lv === 0 ? [s.vpick] : [s.vchip]) : (s.lv === 0 ? [s.pick] : s.chips), mm = p => meanFor(D().tl, p[1]);
  let h = "";
  if (s.lv === 1) h += `<div class="frame">${T("红色的部分来自你的小票。再加一个想法：", "The red bits come from your receipt. Add an idea:")}</div>`;
  if (picks) h += `<div class="chips">${picks.map((p, i) => `<button class="chip ${sel.includes(i) ? "on" : ""}" data-pick="${kind}:${i}" dir="auto">${esc(p[0])}${mm(p) ? `<small>${esc(mm(p))}</small>` : ""}</button>`).join("")}</div>`;
  if (chips) h += `<div class="chips">${chips.map((p, i) => `<button class="chip ${sel.includes(i) ? "on" : ""}" data-chip="${kind}:${i}:${multi ? 1 : 0}" dir="auto">${esc(p[0])}${mm(p) ? `<small>${esc(mm(p))}</small>` : ""}</button>`).join("")}</div>`;
  if (q){ h += `<div class="q2">${esc(q)}</div><textarea class="ta" data-own dir="auto" placeholder="${esc(zh ? T("想写就用中文写下来（可以不写）", "Write it in Chinese if you like (optional)") : T("想写就用英语写下来（可以不写）", "Write it in English if you like (optional)"))}">${esc(s.own)}</textarea>`;
    h += `<button class="link" data-act="ref">${s.showRef ? T("收起参考说法", "Hide the sample answer") : T("看一个参考说法", "Show a sample answer")}</button>`;
    if (s.showRef || s.own.trim()) h += TL(pair[0], s.own.trim() ? "" : pair[1]); }
  else h += TL(pair[0], pair[1]);
  if (s.lv === 0) h += wordsHTML(pair[0]);
  return h; }
const postClosed = () => !RL() && opened(2);   // rolling：晒这一关一直开着，晚了也能补上
function vPost(){ const s = S, en = SIDE === "en", it = s.item != null;
  let h = `<div class="card"><div class="when"><span>${RL() ? T("第 2 天 · 晒一样", "Day 2 · show yours") : T("12 月 12 日到 25 日 · 哪天晒都行", "12–25 December · post any day")}</span><span>${esc(T("投票：", "Voting: ") + whenV())}</span></div>${hostSay("post", true)}${matHTML("post")}</div>`;
  if (postClosed() && !s.printed) return h + `<div class="card"><h3>${T("晒的时间过了", "Posting has closed")}</h3><p class="hint">${T("今年来不及晒了，还可以去看大家的、投瓶盖。", "Too late to post this year — you can still look at everyone's and give your caps.")}</p><button class="btn" data-go="2">${T("去投瓶盖", "Go and give caps")} →</button></div>`;
  h += `<div class="card"><h3><span class="n ${it ? "ok" : ""}">${it ? "✓" : "1"}</span>${T("你晒哪一样？", "What are you showing?")}</h3><div class="seg"><button data-nb="0" class="${!s.nb ? "on" : ""}">${T("买了", "I bought it")}<small>${T("而且很值", "and it was worth it")}</small></button><button data-nb="1" class="${s.nb ? "on" : ""}">${T("没买", "I didn't buy it")}<small>${T("也能拿奖", "that can win too")}</small></button></div>${itemPicker(s)}${it ? photoRow() : ""}</div>`;
  if (!it) return h;
  h += `<div class="card"><h3><span class="n ok">✓</span>${s.nb ? T("省了多少？", "How much did you save?") : T("算一算", "The numbers")}</h3><div class="nums"><div><label>${s.nb ? T("本来要花", "It would have cost") : T("价钱（你那里的钱）", "Price (your money)")}</label><div class="nf"><input type="number" inputmode="decimal" min="0" data-price value="${s.price == null ? "" : s.price}">${curSel(s)}</div>${curNameRow(s)}</div>
    ${s.nb ? `<div><label>${T("省下", "Saved")}</label><div class="bigv nb">${money(s.price, s.cur, s)}</div></div>` : `<div><label>${T("打算用几次", "Times you'll use it")}</label><div class="nf"><input type="number" inputmode="numeric" min="1" data-uses value="${s.uses}"><span class="u">×</span></div><div class="quick">${[10, 50, 100, 300, 500].map(n => `<button data-q="${n}">${n}</button>`).join("")}</div></div>`}</div>
    ${en ? `<div class="nums one"><div><label>${T("大促前它多少钱？（记得就填，可以不填）", "What was it before the sale? (optional)")}</label><div class="nf"><input type="number" inputmode="decimal" min="0" data-was value="${s.was == null ? "" : s.was}"><span class="u">${esc(s.cur === "OTHER" ? curNm(s) : curOpt(s.cur))}</span></div></div></div>${priceDiff(s)}` : ""}
    ${s.nb ? "" : `<div class="mat row"><span class="k">${T("一次多少钱", "Cost per use")}</span><b class="bigv">${money(per(s), s.cur, s, false)}</b></div>`}</div>`;
  h += `<div class="card"><h3><span class="n ${s.said ? "ok" : ""}">${s.said ? "✓" : "3"}</span>${en ? T("用英语说出来", "Say it in English") : T("用中文说出来", "Say it in Chinese")}</h3>${levels()}${sayBlock("mine")}${micBlock("mine", s.said, lineMine(s))}
    ${s.said && !s.printed ? `<button class="btn hot" data-act="print">🖨️ ${T("打出我的小票", "Print my receipt")}</button>` : ""}</div>`;
  if (s.printed){ h += receiptHTML(s, {said: true, pu: true, anim: s._anim, id: "yvMyrc"}); s._anim = false; h += sendHTML(s);
    h += `<div class="card flat"><h3>${T("性价比墙", "The value wall")} <span class="tag">${T("🎭 角色先撑场，有真人就排前面", "🎭 characters keep it warm until real people post")}</span></h3></div>${wallHTML("post")}${lockHTML("post")}`; }
  return h; }
function priceDiff(s){ if (!(s.was > 0) || !(s.price > 0)) return ""; const o = s.was, n = s.price, r = (n - o) / o; const t = r <= -.05 ? T(`↓ 降了 ${Math.round(-r * 100)}%`, `↓ ${Math.round(-r * 100)}% down`) : r >= .05 ? T(`↑ 涨了 ${Math.round(r * 100)}%`, `↑ ${Math.round(r * 100)}% up`) : T("→ 基本没变", "→ about the same"), c = r <= -.05 ? "var(--mint)" : r >= .05 ? "var(--hot)" : "var(--soft)";
  return `<div class="mat row"><span>${money(o, s.cur, s)} → <b>${money(n, s.cur, s)}</b></span><b style="font:800 15px -apple-system,sans-serif;color:${c}">${t}</b></div>`; }
function vVote(){ const s = S, left = 3 - s.votes.length;
  let h = `<div class="card"><div class="when"><span>${T("投瓶盖", "Give your caps")}</span><span>${esc(T("揭晓：", "Results ") + whenR())}</span></div>${hostSay("vote")}${matHTML("vote")}</div>
   <div class="card"><h3><span class="n ${left === 0 ? "ok" : ""}">${left === 0 ? "✓" : "1"}</span>${T("投出你的 3 个瓶盖", "Give your 3 bottle caps")}</h3><p class="hint">${T("看一次多少钱、理由实不实在——不看谁花得少。", "Judge by cost per use and how honest the reason is — not by who spent least.")}</p>
    <div class="caps">${[0, 1, 2].map(i => `<span class="capi ${i < s.votes.length ? "used" : ""}"></span>`).join("")} <span>${left ? T(`还剩 ${left} 个`, `${left} left`) : T("投完了", "All given")}</span></div></div>
   ${wallHTML("vote")}
   <div class="card white"><h3 style="font-size:14px">${T("别人怎么投", "What others said")} <span class="tag">🎭</span></h3>${A.cvotes.map(c => `<div class="cmt"><img class="av" src="${esc(PH(c.id))}" alt=""><div style="flex:1;min-width:0"><div class="who"><b>${esc(c.nm)}</b> · ${esc(T(c.city[0], c.city[1]))} ${lrnTag(c.id)}</div>${TL(c.line, c.tr, c.l)}</div></div>`).join("")}<p class="hint" style="margin-top:8px">${T("🎭 角色的票只当评论放，不算票数。", "🎭 votes are shown as comments and never counted.")}</p></div>`;
  if (s.votes.length) h += `<div class="card"><h3><span class="n ${s.vsaid ? "ok" : ""}">${s.vsaid ? "✓" : "2"}</span>${T("说说你投给谁", "Say who you voted for")}</h3>${levels()}${sayBlock("vote")}${micBlock("vote", s.vsaid, votePair(s)[0])}</div>`;
  if (s.vsaid) h += lockHTML("vote");
  return h; }
// 送给世界 / 只留给自己：小票打好就能选（2026-11-15 创意总监：不用等揭晓，12/26 投票时墙上就有真人的小票）
function sendHTML(s){ return s.sent === "world" ? `<div class="sent">✓ ${T("挂在性价比墙上了，别人能听到你的声音。", "On the value wall for the world — with your voice.")}${s.postId ? `<div class="mod">${K().modHTML("yearend", {own: true, id: s.postId})}</div>` : ""}</div>`
  : s.sent === "me" ? `<div class="sent">✓ ${T("只留在你的手机上。", "Kept just for you, on your phone.")}</div>`
  : `<div class="sendr"><button class="btn hot" data-send="world">🌍 ${T("送给世界", "Give it to the world")}<small>${T("小票、照片和你的声音挂上墙", "receipt, photo and your voice go on the wall")}</small></button><button class="btn ghost" data-send="me">🔒 ${T("只留给自己", "Keep it for me")}<small>${T("只存在你的手机上", "stays only on your phone")}</small></button></div><div class="sendmsg" data-sendmsg></div>`; }
function vReveal(){ const s = S, d = D(), nm = hostNm(), zh = SIDE === "zh";
  let h = `<div class="card"><div class="when"><span>${T("揭晓", "Results")}</span><span>${esc(whenR())}</span></div>${hostSay("reveal")}</div>`;
  const honest = `<div class="honest"><b>${T("谁评的：", "Who picked the winners:")}</b> ${T(`第一届人还少，三个奖由主持人自己评（学中文的人这边是苏梅颁，学英语的人这边是 Oliver 颁，评的是同一面墙），台上写明。你的票只记在你手机上；🎭 角色的票从来不算。`, `Year one is small, so the hosts pick the three themselves (Su Mei presents for people learning Chinese, Oliver for people learning English — same wall) and say so on the podium. Your votes are kept only on your phone; 🎭 characters' votes never count.`)}</div>`;
  if (!s.revealed) return h + `<div class="till" id="yvTill"><button data-act="till">🥁 ${T("打开收银台", "Open the till")}<small>${T("三个瓶盖，三个性价比之王", "Three caps, three winners")}</small></button></div>${honest}`;
  const W = id => wallOf(id) || {}, mineV = a => s.votes.includes(a.to);
  h += `<div class="pod">${A.awards.map((a, i) => { const w = W(a.to); return `<div class="pc-col"><img class="av" src="${esc(PH(w.id))}" alt="" style="animation-delay:${.3 + i * .25}s"><div class="cap" style="animation-delay:${.5 + i * .25}s"><span class="capi ${a.cap}"></span></div><div class="blk" style="height:${[78, 112, 64][i]}px;animation-delay:${i * .2}s"><b>${esc(T(a.t[0], a.t[1]))}</b>${esc(String(w.nm || "").replace("小雨 ", ""))}</div></div>`; }).join("")}</div>
   <div class="honest"><b>${T(`${nm}评的`, `Judged by ${nm}`)}</b> ${T("——第一届人还少，先由主持人评。🎭 = 角色。", "— year one, too few people for a public vote. 🎭 = character.")} ${s.votes.length ? T(`今年你的真人票：${s.votes.length} 张，只记在你手机上。`, `Your real votes this year: ${s.votes.length}, kept on your phone.`) : T("你今年没投瓶盖。", "You didn't give any caps this year.")}</div>`;
  h += A.awards.slice().sort((a, b) => a.k === "king" ? -1 : b.k === "king" ? 1 : 0).map(a => { const w = W(a.to), L = a[SIDE]; return `<div class="aw ${mineV(a) ? "mine" : ""}">${mineV(a) ? `<span class="yv">${T("你投了 ✓", "your cap ✓")}</span>` : ""}<div class="ttl"><span class="capi ${a.cap}"></span>${esc(T(a.t[0], a.t[1]))}</div><div class="by"><img class="av" src="${esc(PH(w.id))}" alt="" style="width:20px;height:20px;vertical-align:middle"> <b>${esc(w.nm)}</b> ${lrnTag(w.id)} · ${esc(w.item)} · ${w.nb ? T("省 ", "saved ") + money(w.price, w.cur) : money(w.price / w.uses, w.cur, null, false) + T(" 一次", " a go")} <span class="tag">🎭</span></div>${TL(L[0], L[1])}</div>`; }).join("");
  if (s.printed){ const rx = d.rx[s.nb ? "nb" : s.lv === 0 ? ["v0", "v1", "v2"][s.pick] || "v0" : "sum"];
    h += `<div class="card flat"><h3>${T("你的小票，留着", "Your receipt, to keep")}</h3><p class="hint">${T(`每个交了的人都盖这个章。${nm}在你的小票上写了一句。`, `Everyone who posted gets the stamp. ${nm} wrote on yours.`)}</p></div>`;
    h += receiptHTML(s, {said: true, pu: true, stamp: `${zh ? "算过账了" : "DID THE MATHS"}<small>${zh ? "DID THE SUMS" : "算过账了"}</small>`, note: `<div class="note" dir="auto">${esc(rx[0])}<small>— ${esc(nm)}${meanFor(d.tl, rx[1]) ? " · " + esc(meanFor(d.tl, rx[1])) : ""}</small></div>`});
    h += sendHTML(s); }
  else h += RL() ? `<div class="card"><h3>${T("你还没晒小票", "You haven't posted a receipt yet")}</h3><p class="hint">${T("现在补上也算，带上你今年最值的一样。", "It still counts if you post now — bring your best-value thing this year.")}</p><button class="btn" data-go="1">${T("去晒小票", "Post my receipt")} →</button></div>` : `<div class="honest">${T("你今年没晒小票。明年年底再来，带上你最值的一样。", "You didn't post a receipt this year. Come back next year-end with your best-value thing.")}</div>`;
  h += wallHTML("reveal") + lockHTML("reveal"); return h; }

// ── 画 ──
function render(){ if (!R) return; const d = D(), k = KEYS[cx.d] || "poster";
  const mate = d.mate, head = `<div class="awn"></div><div class="hd"><div class="k">${esc(d.kick)}</div><div class="s">${esc(X(d.sub))}</div></div>
   <div class="ppl"><span class="pp"><img class="av" src="${esc(hostImg())}" alt=""><span><b>${esc(hostNm())}</b> · ${T("主持", "host")} ${tag(d.host.tag)}</span></span><span class="pp"><img class="av" src="${esc(PH(mate.id))}" alt=""><span><b>${esc(mate.nm)}</b> · ${esc(X(mate.who))} ${tag(mate.tag)}</span></span></div>`;
  R.innerHTML = head + ({poster: vPoster, post: vPost, vote: vVote, reveal: vReveal}[k])() + haulHTML();
  R.querySelectorAll(".yv-mic").forEach(box => { const key = box.dataset.mic, el = box.querySelector(".ak-mic");
    K().mic(el, {want: () => plain(key === "vote" ? votePair(S)[0] : lineMine(S)), l: D().tl, free: S.lv === 2, onDone: v => saidIt(key, v)}); }); }
const keep = fn => { const pg = cx.pg, y = pg.scrollTop, wy = scrollY; fn(); pg.scrollTop = y; scrollTo(0, wy); };
function goTo(el){ if (el) el.scrollIntoView({behavior: "smooth", block: "center"}); }

// ── 反应 ──
let BD = null, bT = null;
function buddy(pair){ if (!pair) return; if (!BD){ BD = document.createElement("div"); BD.className = "yvx-bd"; BD.dataset.nopy = ""; document.body.appendChild(BD); BD.onclick = () => BD.classList.remove("on"); }
  const m = meanFor(D().tl, pair[1]); BD.innerHTML = `<img class="av" src="${esc(hostImg())}" alt=""><div class="bt"><span class="e" dir="auto">${esc(pair[0])}</span>${m ? `<span class="z">${esc(m)}</span>` : ""}</div>`;
  BD.classList.add("on"); say(pair[0]); clearTimeout(bT); bT = setTimeout(() => BD.classList.remove("on"), 4200); }
function note8(el){ try { const r = el.getBoundingClientRect(), n = document.createElement("div"); n.className = "yvx-n8"; n.textContent = "♪"; n.style.left = r.left + r.width / 2 + "px"; n.style.top = r.top + "px"; document.body.appendChild(n); setTimeout(() => n.remove(), 1000); } catch(e){} }
function stamp(h){ K().stamp(h); }

// ── 说 ──
function saidIt(key, v){ const text = plain(key === "vote" ? votePair(S)[0] : lineMine(S)); S.real = !!(v && v.text && !v.sim);
  if (key === "vote") S.vsaid = true; else S.said = true; S.saidAt[KEYS[cx.d]] = text;
  if (v && v.blob && key === "mine"){ LAST_BLOB = v.blob; IDB("readwrite", st => st.put({blob: v.blob, mime: v.blob.type || "audio/webm"}, SIDE)); }
  save(); keep(render); const r = D().rx;
  if (key === "vote"){ stamp(`${T("投好了", "CAPS GIVEN")}<small>${T("CAPS GIVEN", "投好了")}</small>`); cx.finish(text); setTimeout(() => buddy(r.vote), 700); }
  else buddy(S.nb ? r.nb : S.lv === 0 ? r[["v0", "v1", "v2"][S.pick]] : r.sum); }

// ── 送给世界：小票 + 照片 + 你的录音（没登录先请登录；没送出去就照实说）──
async function sendWorld(btn){ const box = R.querySelector("[data-sendmsg]"); btn.disabled = true; const s = S, it = itemOf(s);
  let au = "", mime = ""; try { const t = LAST_BLOB ? {blob: LAST_BLOB} : await IDB("readonly", st => st.get(SIDE)); if (t && t.blob && t.blob.size < 250000){ au = await K().blobB64(t.blob); mime = t.blob.type || "audio/webm"; } } catch(e){}
  let img = photo(); img = img && img.length < 140000 ? img.split(",")[1] || "" : "";
  const data = {k: "rc", ed: A.ed, l: D().tl, t: plain(lineMine(s)).slice(0, 280), item: it.t, ig: it.g, e: it.e, m: it.m || it.zm || "", cur: s.cur, curName: curNm(s).slice(0, 20), price: Number(s.price) || 0, uses: s.nb ? 0 : Number(s.uses) || 1, nb: !!s.nb, was: s.was > 0 ? Number(s.was) : null};
  if (img) data.img = img; if (au){ data.au = au; data.mime = mime; }
  const id = await K().post("yearend", data); btn.disabled = false;
  if (!id){ const e = K().err() || {}; if (box) box.textContent = e.code === "login" ? T("先登录，再送给世界。小票还在这儿等你。", "Log in first, then send it. Your receipt will wait here.") : T("没送出去，等一会儿再试。小票还在你手机上。", "Couldn't send — try again in a bit. Your receipt is still on your phone."); return; }
  s.sent = "world"; s.postId = id; save(); keep(render); K().confetti(); stamp(`${T("送给世界", "TO THE WORLD")}<small>${T("TO THE WORLD", "送给世界")}</small>`); REAL_ON = false; }

// ── 点 ──
function onClick(e){ const t = e.target; let b;
  if (!t.closest("[data-w]") && !t.closest("[data-bw]")) tipOff();
  if ((b = t.closest("[data-aklv]"))){ const v = +b.dataset.aklv; K().level(v); S.lv = v; S.chips = []; S.pick = 0; S.vchip = 0; S.vpick = 0; S.own = ""; S.showRef = false; K().blip(640); save(); keep(render); return; }
  if ((b = t.closest("[data-bw]"))){ grab(b.dataset.bw, b); return; }
  if ((b = t.closest("[data-am]"))){ say(b.dataset.am); K().blip(900); note8(b); return; }
  if ((b = t.closest("[data-say]"))){ K().blip(700); say(b.dataset.say, b.dataset.l, b); return; }
  if ((b = t.closest("[data-ws]"))){ say(b.dataset.ws); b.animate([{background: "#f2b45a"}, {background: "#f3eee2"}], {duration: 600}); return; }
  if ((b = t.closest("[data-w]"))){ const w = b.dataset.w, l = b.dataset.l, g = l === "zh" ? (ZH() ? "" : glossZ(w)) : glossE(w), p = l === "zh" && !ZH() ? pyOf(w) : "";
    if (!g && !p){ say(w, l); return; } tipAt(b, `<b>${esc(w)}</b>${p ? `<span class="py">${esc(p)}</span><br>` : ""}${esc(g)}`); say(w, l); K().blip(800); return; }
  if ((b = t.closest("[data-go]"))){ cx.reopen(+b.dataset.go); return; }
  if ((b = t.closest("[data-act]"))){ const a = b.dataset.act, s = S;
    if (a === "join"){ s.joined = true; save(); const o = cx.st(); if (o.j[A.id] && o.j[A.id].done[0] == null) cx.finish("joined"); K().blip(1040); cx.reopen(0); stamp(`${T("入场", "JOINED")}<small>${T("JOINED", "入场")}</small>`); setTimeout(() => buddy(D().rx.join), 600); return; }
    if (a === "ref"){ s.showRef = !s.showRef; save(); keep(render); return; }
    if (a === "print"){ s.printed = true; s._anim = true; s.at = cx.today(); save(); keep(render); cx.finish(plain(lineMine(s))); let k = 0; const iv = setInterval(() => { K().blip(1200 + (k % 2) * 200); if (++k > 14) clearInterval(iv); }, 70); setTimeout(() => { stamp(`${T("晒好了", "ON THE WALL")}<small>${T("ON THE WALL", "晒好了")}</small>`); goTo(R.querySelector("#yvMyrc")); }, 1100); return; }
    if (a === "till"){ const tl = R.querySelector("#yvTill"); tl && tl.classList.add("shake"); let k = 0; const iv = setInterval(() => { K().blip(180 + k * 30); if (++k > 12){ clearInterval(iv); s.revealed = true; save(); keep(render); K().confetti(); const won = A.awards.some(x => s.votes.includes(x.to)); stamp(`${T("揭晓", "RESULTS")}<small>${won ? T("你投的得奖了", "YOUR CAP PICKED A WINNER") : T("三个瓶盖", "THREE CAPS")}</small>`); if (won) setTimeout(() => K().toast(T("你投的那张得奖了 ✓", "Your cap went to a winner ✓")), 900); if (cx.st().j[A.id] && cx.st().j[A.id].done[3] == null) cx.finish(s.printed ? plain(lineMine(s)) : ""); } }, 110); return; }
  }
  if ((b = t.closest("[data-send]"))){ if (b.dataset.send === "world"){ sendWorld(b); return; } S.sent = "me"; save(); keep(render); K().toast(T("只有你看得到", "Only you can see it")); return; }
  if ((b = t.closest("[data-item]"))){ const s = S; s.item = +b.dataset.item; if (!s.priceSet) s.price = defPrice(s); s.said = false; note8(b); K().blip(720); save(); keep(render); K().toast(`${D().items[s.item].e} ${D().items[s.item].t}`); return; }
  if ((b = t.closest("[data-nb]"))){ const s = S; s.nb = b.dataset.nb === "1"; s.pick = 0; s.chips = []; s.said = false; K().blip(620); note8(b); save(); keep(render); return; }
  if ((b = t.closest("[data-q]"))){ S.uses = +b.dataset.q; S.said = false; K().blip(760); save(); keep(render); return; }
  if ((b = t.closest("[data-pick]"))){ const [k, i] = b.dataset.pick.split(":"); if (k === "vote"){ S.vpick = +i; S.vsaid = false; } else { S.pick = +i; S.said = false; } K().blip(700); note8(b); save(); keep(render); return; }
  if ((b = t.closest("[data-chip]"))){ const [k, i, m] = b.dataset.chip.split(":"); const s = S; if (k === "vote"){ s.vchip = +i; s.vsaid = false; } else { if (m === "1"){ const n = +i; s.chips = s.chips.includes(n) ? s.chips.filter(x => x !== n) : [...s.chips, n]; } else s.chips = [+i]; s.said = false; } K().blip(700); note8(b); save(); keep(render); return; }
  if ((b = t.closest("[data-cap]"))){ const s = S, id = b.dataset.cap; if (s.votes.includes(id)){ s.votes = s.votes.filter(x => x !== id); K().blip(400); } else if (s.votes.length < 3){ s.votes.push(id); K().blip(900); } s.vsaid = false; save(); keep(render); if (s.votes.length === 3) K().toast(T("3 个瓶盖都投出去了", "All 3 caps given")); return; }
}
function onChange(e){ const t = e.target, s = S;
  if (t.matches("[data-cur]")){ if (!A.cur[t.value]) return; s.cur = t.value; if (!s.priceSet) s.price = defPrice(s); s.was = null; s.said = false; save(); keep(render); }
  if (t.matches("[data-photo]") && t.files[0]){ K().shrink(t.files[0], 600, .72).then(u => { if (u){ try { photo(u); } catch(_){} K().toast(T("照片放上了", "Photo added")); } keep(render); }); }
  if (t.matches("[data-price],[data-uses],[data-was],[data-curname]")){ s.said = false; save(); keep(render);
    if (t.matches("[data-was],[data-price]") && SIDE === "en" && s.was > 0 && s.price > 0 && !s._rx){ s._rx = 1; buddy(D().rx[dirOf(s)]); } } }
function onInput(e){ const t = e.target, s = S;
  if (t.matches("[data-price]")){ s.price = Math.max(0, parseFloat(t.value) || 0); s.priceSet = true; }
  if (t.matches("[data-uses]")) s.uses = Math.max(1, parseInt(t.value) || 1);
  if (t.matches("[data-was]")){ const v = parseFloat(t.value); s.was = v > 0 ? v : null; s._rx = 0; }
  if (t.matches("[data-own]")) s.own = t.value;
  if (t.matches("[data-curname]")) s.curName = t.value; }

// ── 交给 activities.js ──
window.ACT_MODES = window.ACT_MODES || {};
window.ACT_MODES.value = {
  html(c){ return `<div class="yvx" data-nopy><div data-yvx></div></div>`; },
  wire(c){ cx = c; A = c.a; SIDE = K().LG() === "zh" ? "zh" : "en"; R = c.pg.querySelector("[data-yvx]"); if (!R) return; mountCss(); load();
    R.onclick = onClick; R.onchange = onChange; R.oninput = onInput;
    R.addEventListener("toggle", e => { if (e.target.matches && e.target.matches("details.haul")){ S.haulOpen = e.target.open; save(); } }, true);
    R.addEventListener("focusout", e => { if (e.target.matches("[data-own],[data-curname]")){ save(); keep(render); } });
    if (!this._g){ this._g = 1; addEventListener("scroll", tipOff, true); document.addEventListener("ak:changed", e => { if (!cx || !R || !R.isConnected || !A || A.mode !== "value") return; const dl = e.detail && e.detail.deleted; if (dl && S.postId && dl === "yearend/" + S.postId && e.detail.ok){ S.sent = null; S.postId = ""; save(); } REAL_ON = false; loadReal(); keep(render); }); }
    if (c.d > 0 && !S.joined){ S.joined = true; save(); }
    render(); if (c.d > 0) loadReal(); },
  stop(){ tipOff(); try { K().hush(); } catch(e){} if (BD) BD.classList.remove("on"); }
};

function mountCss(){ if (document.getElementById("yvxCss")) return; const s = document.createElement("style"); s.id = "yvxCss"; s.textContent = CSS; document.head.appendChild(s); }
const CSS = `
.yvx{--ink:#14305c;--ivory:#fbf7ee;--hot:#e2552f;--gold:#f2b45a;--soft:#6b7488;--line:#e6dfcf;--paper:#fffefa;--counter:#efe6d3;--mint:#2f6b4f;background:var(--counter);color:#24303a;border-radius:18px;padding:0 0 18px;margin:12px 0 0;overflow:hidden;font:15px/1.55 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif}
.yvx button{font:inherit;cursor:pointer;color:inherit}.yvx input,.yvx textarea,.yvx select{font:inherit}
.yvx .awn{height:22px;background:repeating-linear-gradient(90deg,var(--hot) 0 22px,#fff 22px 44px);-webkit-mask:radial-gradient(circle 11px at 11px 11px,#000 98%,#0000) 0 0/22px 22px repeat-x;mask:radial-gradient(circle 11px at 11px 11px,#000 98%,#0000) 0 0/22px 22px repeat-x}
.yvx .hd{text-align:center;padding:8px 14px 2px}.yvx .hd .k{font:800 10.5px -apple-system,sans-serif;letter-spacing:.18em;color:var(--hot)}.yvx .hd .s{font:italic 13px Georgia,"Noto Serif SC",serif;color:var(--soft)}
.yvx .ppl{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 12px 0}
.yvx .pp{display:flex;align-items:center;gap:6px;background:#fff;border-radius:99px;padding:3px 10px 3px 3px;font-size:11.5px;color:var(--soft);max-width:100%}.yvx .pp b{color:var(--ink)}
.yvx .av{width:30px;height:30px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #fff;box-shadow:0 0 0 1.5px var(--line);background:#ddd}
.yvx .av.me{display:inline-grid;place-items:center;background:var(--ink);color:#fff;font:700 12px Georgia,serif;width:24px;height:24px}
.yvx .tag{font-size:10px;background:#f1ece0;border-radius:99px;padding:1px 6px;color:var(--soft);white-space:nowrap;font-weight:700}.yvx .tag.lrn{background:#e8eef8;color:var(--ink)}.yvx .tag.real{background:#e6f1ea;color:var(--mint)}
.yvx u.bw{text-decoration:none;border-bottom:2px solid #f0b39f;cursor:pointer;border-radius:3px}.yvx u.bw:hover{background:#fde9e1}.yvx u.bw.got{border-bottom-color:var(--mint);background:#e3f1ec}
.yvx .ammo{margin-top:10px;padding-top:8px;border-top:1px dashed #e7b98a;font-size:12px}.yvx .ammo .at{font-weight:800;color:#9a4a1c}.yvx .ammo .hint2{color:var(--soft)}
.yvx .chip.am{background:#fff;font:700 13px "Noto Serif SC",Georgia,serif}
.yvx .haul{margin:14px 12px 0;background:var(--ink);color:#fff;border-radius:14px;padding:11px 12px}
.yvx .haul .hh{font:900 15px "Noto Serif SC",serif;cursor:pointer;list-style:none}.yvx .haul .hh::-webkit-details-marker{display:none}.yvx .haul .hh::after{content:" ▾";font-size:12px;color:#cfd6e4}.yvx .haul[open] .hh::after{content:" ▴"}
.yvx .haul .hh small{font:12px -apple-system,sans-serif;color:#cfd6e4;margin-left:6px}.yvx .haul p{margin:2px 0 6px;font-size:12px;color:#cfd6e4}
.yvx .hs2{display:block;width:100%;text-align:left;border:0;border-radius:10px;background:rgba(255,255,255,.1);color:#fff;padding:7px 9px;margin-top:6px;font:14px/1.45 "Noto Serif SC",Georgia,serif}.yvx .hs2.used{background:rgba(226,85,47,.3)}.yvx .hs2 span{margin-right:6px}.yvx .hs2 i{font:12px -apple-system,sans-serif;color:#cfd6e4;font-style:normal}
.yvx .sale{margin-top:6px;font:11.5px/1.4 -apple-system,"PingFang SC",sans-serif;color:#4d5563;background:#f3eee2;border-radius:6px;padding:4px 6px}.yvx .sale small{display:block;color:var(--soft);font-style:italic;font-size:10.5px}
.yvx .card{margin:12px 12px 0;background:var(--ivory);border-radius:16px;padding:13px 13px 14px;box-shadow:0 2px 10px rgba(20,48,92,.07);position:relative}.yvx .card.flat{background:transparent;box-shadow:none;padding:6px 2px 0}.yvx .card.white{background:#fff}
.yvx .card h3{flex-wrap:wrap;margin:0 0 4px;font:900 17px/1.3 "Noto Serif SC",serif;color:var(--ink);display:flex;gap:8px;align-items:center}
.yvx .card h3 .n{flex:none;width:22px;height:22px;border-radius:50%;background:var(--hot);color:#fff;font:800 12px/22px -apple-system,sans-serif;text-align:center}.yvx .card h3 .n.ok{background:var(--mint)}
.yvx .hint{font-size:12.5px;color:var(--soft);margin:0 0 8px}
.yvx .when{font:italic 12.5px Georgia,"Noto Serif SC",serif;color:var(--soft);display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:6px}
.yvx .hs{display:flex;gap:11px;align-items:flex-start}
.yvx .pol{background:#fff;padding:6px 6px 22px;box-shadow:0 3px 10px rgba(0,0,0,.16);transform:rotate(-3deg);flex:none;width:92px;position:relative}
.yvx .pol .im{width:80px;height:80px;background:#f3eee2;display:grid;place-items:center;font-size:40px;overflow:hidden}
.yvx .pol .cap{position:absolute;bottom:3px;left:2px;right:2px;text-align:center;font:italic 10.5px/1.15 Georgia,serif;color:var(--soft)}
.yvx .hsb{flex:1;min-width:0}.yvx .hsb .who{font-size:11.5px;color:var(--soft)}.yvx .hsb .who b{color:var(--ink);font-size:13px}
.yvx .tl{background:#fff;border-radius:12px;padding:8px 10px 8px 40px;margin-top:6px;position:relative;box-shadow:0 1px 4px rgba(20,48,92,.07)}
.yvx .tl .say{position:absolute;left:8px;top:9px;width:24px;height:24px;border-radius:50%;border:0;background:var(--ink);color:#fff;font-size:11px;display:grid;place-items:center;padding:0}
.yvx .tl .say.play{background:var(--hot);animation:yvpulse 1s infinite}
.yvx .tl .tx{font:700 17px/1.9 "Noto Serif SC",serif;color:var(--ink);word-break:break-word}.yvx .tl.en .tx{font:700 16px/1.5 Georgia,serif}
.yvx .tl small{display:block;font:12px/1.4 -apple-system,"PingFang SC",sans-serif;color:var(--soft);margin-top:1px}
.yvx .w{cursor:pointer;border-radius:4px;transition:background .15s}.yvx .w:hover{background:#fdeee3}.yvx .w.sl{color:var(--hot);border-bottom:2px solid var(--hot)}
.yvx ruby{ruby-position:over}.yvx .tl:not(.en) .w{display:inline-block;line-height:1.35;margin-top:3px;margin-right:3px}
.yvx rt{font:500 10.5px -apple-system,sans-serif;color:var(--hot);letter-spacing:0}
@keyframes yvpulse{50%{box-shadow:0 0 0 9px rgba(226,85,47,.15)}}
.yvx .mat{margin-top:10px;background:#f3eee2;border-radius:10px;padding:8px 10px;font-size:12.5px;color:#4d5563}.yvx .mat.row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.yvx .mat .k{font-weight:800;color:var(--ink);font-size:12px}.yvx .mat .src{display:block;font-size:11px;color:var(--soft);margin-top:2px;font-style:italic}
.yvx .bigv{font:700 20px Georgia,serif;color:var(--hot);margin-top:6px}.yvx .bigv.nb{color:var(--mint)}
.yvx .seg{display:flex;gap:6px;margin-bottom:8px}
.yvx .seg button{flex:1;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:7px 6px;font-weight:800;color:var(--ink);font-size:13px;line-height:1.25}
.yvx .seg button small{display:block;font-weight:500;color:var(--soft);font-size:11px}.yvx .seg button.on{border-color:var(--hot);background:#fff4ee;box-shadow:0 0 0 2px rgba(226,85,47,.15)}
.yvx .items{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.yvx .it{border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:6px 4px 5px;text-align:center;line-height:1.2;transition:transform .12s;min-width:0}
.yvx .it .e{font-size:24px;display:block}.yvx .it b{display:block;font:700 13px "Noto Serif SC",Georgia,serif;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yvx .it small{display:block;font-size:10.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yvx .it.on{border-color:var(--hot);background:#fff4ee;box-shadow:0 0 0 2px rgba(226,85,47,.15)}
.yvx .it:active,.yvx .seg button:active,.yvx .chip:active,.yvx .btn:active,.yvx .cap-b:active{transform:scale(.95)}
.yvx .nums{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.yvx .nums.one{grid-template-columns:1fr}
.yvx .nums label{font-size:11.5px;color:var(--soft);font-weight:700;display:block}
.yvx .nf{display:flex;align-items:center;background:#fff;border:1.5px solid var(--line);border-radius:12px;overflow:hidden;margin-top:3px}
.yvx .nf input{border:0;width:100%;min-width:0;padding:8px;font:700 17px Georgia,serif;color:var(--ink);background:none}.yvx .nf input:focus{outline:none}
.yvx .nf select{border:0;background:#f3eee2;font:700 12.5px -apple-system,sans-serif;color:var(--ink);padding:10px 4px;max-width:110px}
.yvx .nf .u{padding:0 9px;color:var(--soft);font-size:12px;white-space:nowrap}
.yvx .quick{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.yvx .quick button{border:1px solid var(--line);background:#fffdf8;border-radius:99px;padding:1px 8px;font-size:11.5px;color:var(--soft)}
.yvx .photo{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12px;color:var(--soft)}
.yvx .photo label{border:1.5px dashed #c9bda2;border-radius:10px;padding:6px 10px;color:var(--ink);font-weight:700;cursor:pointer;background:#fff;white-space:nowrap}.yvx .photo input{display:none}
.yvx .chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px}
.yvx .chip{border:1.5px solid var(--line);background:#fffdf8;border-radius:99px;padding:4px 11px;font-weight:700;color:var(--ink);font-size:13px;line-height:1.25;transition:transform .12s;text-align:left}
.yvx .chip{max-width:100%;white-space:normal;overflow-wrap:anywhere}.yvx .chip small{display:block;font-size:10.5px;font-weight:500;color:var(--soft)}.yvx .chip.on{background:var(--hot);color:#fff;border-color:var(--hot)}.yvx .chip.on small{color:#ffe1d6}
.yvx .words{margin-top:9px;background:#fff;border-radius:12px;padding:7px 9px}.yvx .words .wt{font-size:11px;font-weight:800;color:var(--ink);letter-spacing:.03em}
.yvx .words button{border:0;background:#f3eee2;border-radius:99px;padding:3px 9px;margin:5px 5px 0 0;font:700 13px "Noto Serif SC",Georgia,serif;color:var(--ink)}
.yvx .words button small{font:11px -apple-system,sans-serif;color:var(--soft);margin-left:4px;font-weight:400}
.yvx .frame{font-size:12.5px;color:var(--soft);margin:2px 0 4px}.yvx .lvrow{margin:4px 0 8px}
.yvx .q2{font:900 15px/1.4 "Noto Serif SC",serif;color:var(--ink);background:#fff;border-left:4px solid var(--hot);border-radius:4px 10px 10px 4px;padding:8px 10px}
.yvx .ta{width:100%;box-sizing:border-box;min-height:64px;border:1.5px solid var(--line);border-radius:12px;padding:8px 10px;font:15px/1.45 "Noto Serif SC",Georgia,serif;color:var(--ink);background:#fff;resize:vertical;margin-top:8px}
.yvx .link{border:0;background:none;color:var(--hot);font-weight:800;font-size:12.5px;padding:4px 0;text-decoration:underline}
.yvx .btn{border:0;border-radius:14px;padding:11px 14px;font-weight:800;font-size:14.5px;background:var(--ink);color:#fff!important;width:100%;transition:transform .12s;margin-top:10px}
.yvx .btn small{display:block;font-weight:500;font-size:11px;opacity:.85}.yvx .btn.hot{background:var(--hot)}.yvx .btn.ghost{background:#fff;color:var(--ink)!important;border:1.5px solid var(--line)}.yvx .btn:disabled{opacity:.45}
.yvx .yv-mic{margin-top:10px}
.yvx .rcw{filter:drop-shadow(0 5px 8px rgba(20,48,92,.16));margin:14px 18px 0;position:relative}
.yvx .rc{background:var(--paper);font:13px/1.5 "Courier New",ui-monospace,"PingFang SC",monospace;color:#2b2f36;padding:16px 14px 20px;position:relative;
 -webkit-mask:conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/14px 7px repeat-x,conic-gradient(from 135deg at top,#0000,#000 1deg 89deg,#0000 90deg) top/14px 7px repeat-x,linear-gradient(#000 0 0) center/100% calc(100% - 14px) no-repeat;
 mask:conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/14px 7px repeat-x,conic-gradient(from 135deg at top,#0000,#000 1deg 89deg,#0000 90deg) top/14px 7px repeat-x,linear-gradient(#000 0 0) center/100% calc(100% - 14px) no-repeat}
.yvx .rc .shop{text-align:center;font-weight:700;font-size:14px}.yvx .rc .shop small{display:block;font-size:10.5px;letter-spacing:.1em;font-weight:400;color:#6a6f78}
.yvx .rc .dash{border-top:1.5px dashed #b9b2a2;margin:7px 0}.yvx .rc .r{display:flex;justify-content:space-between;gap:10px}.yvx .rc .r span:first-child{color:#6a6f78;flex:none}.yvx .rc .r span:last-child{text-align:right;min-width:0;word-break:break-word}
.yvx .rc .big{font-size:18px;font-weight:700;color:var(--hot)}.yvx .rc .said{font-size:13px;color:var(--ink);margin-top:4px;font-family:"Noto Serif SC",Georgia,serif}
.yvx .rc .bc{height:28px;margin-top:9px;background:repeating-linear-gradient(90deg,#2b2f36 0 2px,#0000 2px 4px,#2b2f36 4px 5px,#0000 5px 8px,#2b2f36 8px 11px,#0000 11px 12px)}
.yvx .rc .tiny{text-align:center;font-size:10.5px;color:#8a8f98;margin-top:3px}.yvx .rc .ln{animation:yvpr .28s both}@keyframes yvpr{from{opacity:0;transform:translateY(-6px)}}
.yvx .rc .ph{display:flex;gap:10px;align-items:center}.yvx .rc .ph .im{width:52px;height:52px;flex:none;background:#f3eee2;display:grid;place-items:center;font-size:28px;border-radius:6px;overflow:hidden}.yvx .rc .ph .im img{width:100%;height:100%;object-fit:cover}
.yvx .pu{position:absolute;right:-6px;top:-10px;width:72px;height:72px;border-radius:50%;background:var(--hot);color:#fff;display:grid;place-items:center;text-align:center;font:800 10px/1.15 -apple-system,sans-serif;transform:rotate(12deg);box-shadow:0 4px 10px rgba(226,85,47,.4);animation:yvpop .4s cubic-bezier(.3,1.6,.5,1) both;z-index:2}
.yvx .pu b{display:block;font:700 14px/1.1 Georgia,serif}@keyframes yvpop{from{transform:scale(0) rotate(-40deg)}}
.yvx .note{font:italic 15px/1.35 "Noto Serif SC",Georgia,serif;color:var(--hot);transform:rotate(-2deg);margin-top:8px;padding:6px 8px;border:1.5px solid rgba(226,85,47,.4);border-radius:8px;background:#fff7f2}.yvx .note small{display:block;font:11px -apple-system,sans-serif;color:var(--soft);font-style:normal}
.yvx .rstamp{position:absolute;right:24px;bottom:46px;border:3px double var(--hot);color:var(--hot);border-radius:50%;width:84px;height:84px;display:grid;place-items:center;text-align:center;font:900 12px/1.2 "Noto Serif SC",Georgia,serif;transform:rotate(-14deg);background:rgba(255,254,250,.85);animation:yvthunk .45s both}
.yvx .rstamp small{display:block;font:700 9px Georgia,serif;letter-spacing:.06em}@keyframes yvthunk{from{transform:rotate(-14deg) scale(2.4);opacity:0}}
.yvx .wall{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 12px 0}
.yvx .mini{background:var(--paper);border-radius:4px;padding:9px 9px 10px;font:12px/1.4 "Courier New",ui-monospace,monospace;position:relative;box-shadow:0 2px 6px rgba(20,48,92,.1);min-width:0}
.yvx .mini.me{box-shadow:0 0 0 2px var(--ink),0 2px 6px rgba(20,48,92,.1)}.yvx .mini.voted{box-shadow:0 0 0 2.5px var(--hot),0 2px 8px rgba(226,85,47,.25)}.yvx .mini.win{box-shadow:0 0 0 3px var(--gold),0 0 22px rgba(242,180,90,.6)}
.yvx .mini .who{display:flex;gap:6px;align-items:center;font:11.5px -apple-system,sans-serif;color:var(--soft)}.yvx .mini .who b{color:var(--ink)}.yvx .mini .who .av{width:24px;height:24px}
.yvx .mini .e{font-size:26px;text-align:center;margin:4px 0 0}.yvx .mini .e img{width:100%;height:70px;object-fit:cover;border-radius:4px}
.yvx .mini .itn{font-weight:700;color:var(--ink);font-family:"Noto Serif SC",Georgia,serif}.yvx .mini .itn small{color:var(--soft);font:11px -apple-system,sans-serif}
.yvx .mini .r{display:flex;justify-content:space-between;gap:4px}.yvx .mini .r span:first-child{color:#8a8f98}.yvx .mini .pc{color:var(--hot);font-weight:700}.yvx .mini .nb{color:var(--mint);font-weight:700}
.yvx .mini .tl{padding:6px 6px 6px 30px;margin-top:6px;box-shadow:none;background:#f8f4ea}.yvx .mini .tl .say{width:20px;height:20px;left:6px;top:7px;font-size:9px}
.yvx .mini .tl .tx{font-size:13.5px;line-height:1.75}.yvx .mini.en .tl .tx{font-size:13px;line-height:1.4}.yvx .mini .tl small{font-size:11px}
.yvx .mini .mod{margin-top:4px;font:11px -apple-system,sans-serif}
.yvx .cap-b{margin-top:7px;width:100%;border:1.5px dashed #c9bda2;background:#fff;border-radius:99px;padding:4px;font:700 12px -apple-system,sans-serif;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:5px}
.yvx .cap-b.on{border:1.5px solid var(--hot);background:#fff4ee;color:var(--hot)}.yvx .cap-b:disabled{opacity:.45}
.yvx .capi{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#e2552f 52%,#b9381a 54%,#e2552f 62%);box-shadow:0 0 0 2px #f4c9b8;display:inline-block;flex:none;position:relative}
.yvx .capi.g{background:radial-gradient(circle,#f2b45a 52%,#c98a2a 54%,#f2b45a 62%);box-shadow:0 0 0 2px #f8e2b8}.yvx .capi.s{background:radial-gradient(circle,#c8ccd4 52%,#8e949f 54%,#c8ccd4 62%);box-shadow:0 0 0 2px #e6e8ec}.yvx .capi.b{background:radial-gradient(circle,#c98a5a 52%,#97603a 54%,#c98a5a 62%);box-shadow:0 0 0 2px #ecd2bd}
.yvx .caps{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--soft);margin:2px 0 0}.yvx .caps .capi.used{opacity:.2}
.yvx .drop{animation:yvdrop .45s cubic-bezier(.3,1.5,.5,1) both}@keyframes yvdrop{from{transform:translateY(-30px) scale(1.4);opacity:0}}
.yvx .rv{font:11px -apple-system,sans-serif;color:var(--mint);font-weight:800;margin-top:4px;display:flex;gap:4px;align-items:center}
.yvx .cmt{display:flex;gap:7px;align-items:flex-start;margin-top:8px}.yvx .cmt .av{width:26px;height:26px}.yvx .cmt .tl{flex:1;margin-top:0}.yvx .cmt .who{font-size:11px;color:var(--soft)}
.yvx .lock{margin:14px 12px 0;background:var(--ink);color:#fff;border-radius:14px;padding:11px 13px;display:flex;gap:10px;align-items:center}.yvx .lock .ic{font-size:22px}.yvx .lock b{display:block;font-size:14px}.yvx .lock span{font-size:12px;opacity:.85}
.yvx .cd{margin-left:auto;font:700 15px Georgia,serif;background:var(--hot);border-radius:9px;padding:4px 8px;white-space:nowrap;font-variant-numeric:tabular-nums;opacity:1!important}
.yvx .poster{margin:12px 12px 0;border-radius:18px;background:var(--ink);color:#fff;padding:16px 14px;position:relative;overflow:hidden}
.yvx .poster::after{content:"";position:absolute;right:-40px;top:-40px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,#e2552f 50%,#b9381a 52%,#e2552f 60%);opacity:.9;box-shadow:0 0 0 10px rgba(226,85,47,.3)}
.yvx .poster>*{position:relative;z-index:1}.yvx .poster .pk{font:800 10.5px -apple-system,sans-serif;letter-spacing:.16em;color:var(--gold)}
.yvx .poster .big{font:700 34px/1.05 Georgia,serif;letter-spacing:-.02em}.yvx .poster .big em{color:var(--gold);font-style:normal}
.yvx .poster ol{margin:10px 0 0;padding-left:20px;font-size:13.5px;line-height:1.5}.yvx .poster ol li{margin:4px 0}.yvx .poster .t{font:900 18px "Noto Serif SC",serif;margin-top:4px}
.yvx .pod{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:6px;align-items:end;margin:14px 12px 0;padding:0 2px}
.yvx .pc-col{text-align:center;min-width:0}.yvx .pc-col .av{width:46px;height:46px;border:3px solid #fff;margin:0 auto;display:block;animation:yvdrop .5s both}
.yvx .pc-col .cap{width:40px;height:40px;margin:-10px auto 4px;position:relative;z-index:1;animation:yvdrop .5s both}.yvx .pc-col .cap .capi{width:40px;height:40px;box-shadow:0 0 0 4px #fff,0 3px 8px rgba(0,0,0,.2)}
.yvx .pc-col .blk{background:var(--ink);color:#fff;border-radius:10px 10px 0 0;padding:8px 4px;font:800 11.5px/1.25 -apple-system,"PingFang SC",sans-serif;animation:yvrise .6s both;transform-origin:bottom}
.yvx .pc-col .blk b{display:block;font:900 13px "Noto Serif SC",serif;color:var(--gold)}@keyframes yvrise{from{transform:scaleY(0)}}
.yvx .aw{margin:10px 12px 0;background:linear-gradient(160deg,#fff7e3,#fde7b8);border-radius:14px;padding:10px 11px;position:relative;animation:yvpr .4s both}
.yvx .aw.mine{box-shadow:0 0 0 3px var(--hot),0 0 26px rgba(226,85,47,.35)}.yvx .aw .ttl{display:flex;align-items:center;gap:7px;font:900 14px "Noto Serif SC",serif;color:#8a5a14}
.yvx .aw .by{font-size:12px;color:#6b5a2e;margin-top:3px}.yvx .aw .yv{position:absolute;right:9px;top:9px;background:var(--hot);color:#fff;border-radius:99px;font:800 10.5px -apple-system,sans-serif;padding:1px 8px}
.yvx .honest{margin:12px 12px 0;background:#fff8e6;border:1px dashed #d9b86a;border-radius:12px;padding:8px 11px;font-size:12px;color:#6b5a2e}.yvx .honest b{color:#4a3a14}
.yvx .till{margin:14px 12px 0;text-align:center}
.yvx .till button{border:0;border-radius:18px;padding:16px 18px;background:var(--hot);color:#fff;font:900 17px "Noto Serif SC",Georgia,serif;width:100%;box-shadow:0 6px 0 #b9381a;transition:transform .1s}
.yvx .till button:active{transform:translateY(4px);box-shadow:0 2px 0 #b9381a}.yvx .till small{display:block;font:500 12px -apple-system,sans-serif;opacity:.85;margin-top:2px}
.yvx .shake{animation:yvshk .12s 8}@keyframes yvshk{25%{transform:translateX(-3px) rotate(-1deg)}75%{transform:translateX(3px) rotate(1deg)}}
.yvx .sendr{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 12px 0}.yvx .sendr .btn{margin:0;font-size:13px;padding:11px 6px}
.yvx .sent,.yvx .sendmsg{margin:10px 12px 0;text-align:center;font-size:13px;color:var(--mint);font-weight:800}.yvx .sendmsg{color:var(--hot)}
@media(max-width:480px){.yvx .pol{width:70px;padding:4px 4px 20px}.yvx .pol .im{width:62px;height:62px;font-size:30px}.yvx .hs{gap:8px}.yvx .wall{grid-template-columns:1fr}}
@media(max-width:700px){.yvx{margin:10px 0 0;border-radius:0}}
html[dir=rtl] .yvx :is(div,p,li,h3,h4,label,summary,small){unicode-bidi:plaintext;text-align:start}
.yvx .lock.in{margin:6px 0 0}
.yvx-tip{position:fixed;z-index:9000;background:#14305c;color:#fff;border-radius:12px;padding:7px 11px;font-size:13px;max-width:240px;box-shadow:0 8px 20px rgba(0,0,0,.25);display:none}
.yvx-tip b{font:700 17px "Noto Serif SC",Georgia,serif;display:block}.yvx-tip .py{color:#ffcfb9;font-size:12px}.yvx-tip.on{display:block}
.yvx-bd{position:fixed;left:12px;right:12px;bottom:14px;max-width:420px;margin:0 auto;display:flex;gap:9px;align-items:center;background:#fff;color:#24303a;border-radius:16px;padding:9px 11px;box-shadow:0 10px 30px rgba(20,48,92,.35);font-size:13px;transform:translateY(180%);transition:transform .35s cubic-bezier(.3,1.4,.5,1);z-index:8999}
.yvx-bd.on{transform:none}.yvx-bd .av{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none}.yvx-bd .bt{min-width:0}
.yvx-bd .e{font:700 15px/1.4 "Noto Serif SC",Georgia,serif;color:#e2552f;display:block}.yvx-bd .z{color:#6b7488;font-size:12px}
.yvx-n8{position:fixed;font:700 18px Georgia,serif;color:#e2552f;pointer-events:none;z-index:9001;animation:yvflo 1s forwards}@keyframes yvflo{to{transform:translateY(-40px);opacity:0}}
`;
})();

/* act_council.js */
// 🏛️ 模拟市议会（2026-11-15 放进软件；样板 样板/模拟市议会样板.html，用户「可以，放进软件」）
// 两个会场、两期活动：英文会场「四天工作制」（content-skeleton/activities/council_4day.json，Oliver 主持，中文界面学英语的人，2027-02-15 起五天）；
// 中文会场「小区议事会 · 老楼加装电梯」（council_lift.json，沈越主持，学中文的人，2027-01-20 起五天）。
// 五天：看议题划一条 → 抽角色牌 → 举牌发言 → 回应对面 → 投两张票、拆信封、翻「真实世界」档案、说一句。
// 用别人的身份说话；可以匿名、可以只旁听；只评「最有说服力的一句」，只看说得好不好。会场里除了你都是 🎭 角色，🎭 的票不算，不显示任何票数。
// 活动框架（activities.js）管：海报、加入、五天那排格子（固定日期，按用户当地日子开）、「你在参加的」和章；这里画每一天的身体（ACT_MODES.council）。
// 中文句子按词空格写好，拼音和意思在 json 的 ck.dict（不在线加载拼音）。进度在 act.v1 的 j.<活动>.ck（跟着账号同步）。麦克风用 AK.mic。
(function(){
const K_ = () => window.AK;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const PH = id => /^(https?:|data:)/.test(id || "") ? id : `https://img.heyvoyo.com/npc/${id}/face.webp`;
const UI = (zh, en) => K_().T(zh, en);
let cx = null, A = null, R = null, FX = null, S = null;
const D = () => A.ck;
// 英文会场所有学英语的人都看得到（2026-11-15）：说明文字中文界面看中文，别的界面看英文版（json 里字段名后面带 E）；中文的意思只给中文界面看
const ZH_ = () => K_().ZH();
const Z = (o, k) => o == null ? "" : (!ZH_() && o[k + "E"] != null) ? o[k + "E"] : o[k];
const SIDE = () => D().lang;
const K = k => SIDE() + ":" + k;
const PUNCT = /^[，。？！、：；「」（）…—,.?!:;()"']+$/;
const blank = () => ({lv: 0, anon: false, gallery: false, chOpen: innerWidth >= 560, hi: {}, b1: {}, fill: {}, role: {}, roleDraws: {}, stance: {}, said: {}, saidTxt: {}, opp: {}, rep: {}, vote1: {}, voteAs: {}, vote2: {}, opened: {}, folder: {}, sec5: {}, done: {}, pocket: {}});
function load(){ const J = cx.st().j[A.id] || {}; S = Object.assign(blank(), J.ck || {}); S.lv = K_().level(); S.view = cx.d; S.today = 0; for (let i = 0; i < A.days; i++) if (cx.canOpen(i)) S.today = i; }
function save(){ const o = cx.st(); if (!o.j[A.id]) o.j[A.id] = {d0: A.starts[0], done: {}}; const keep = Object.assign({}, S); delete keep.lv; delete keep.view; delete keep.today; o.j[A.id].ck = keep; cx.save(o); }
const roleOf = () => { const k = S.role[SIDE()]; return D().roles.find(r => r.k === k) || null; };
const roleOrDefault = () => roleOf() || D().roles[SIDE() === "en" ? 0 : 5];
const stanceOf = () => S.stance[SIDE()] || roleOrDefault().lean;
const castBy = id => D().cast.find(c => c.id === id);
const meName = () => S.anon ? UI("匿名 · 4 号席", "Anon · seat 4") : UI("你", "You");
const fillT = (t, r) => t.replace("{art}", r.art).replace("{floor}", r.floor || "");
// 时间：最后一晚开票的时刻，按用户当地时间，括号里是主持人那边
const loc = () => K_().ZH() ? "zh-CN" : K_().UI() === "ar" ? "en-GB" : (document.documentElement.lang || "en-GB");   // 阿语界面：英文句子里的日期用英文格式
const bd = s => K_().UI() === "ar" ? "\u2066" + s + "\u2069" : s;   // 阿语界面：日期从左往右隔开
function lt(ms){ try { return bd(new Intl.DateTimeFormat(loc(), {month: K_().ZH() ? "long" : "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false}).format(new Date(ms))); } catch(e){ return bd(new Date(ms).toLocaleString()); } }
const countAt = () => Date.parse(A.count), hostT = () => bd(UI(A.hostTime[0], A.hostTime[1]));
// 🗓️ 随到随开（json 里 schedule: "rolling"，2026-11-15 用户）：不是全世界同一晚开票，按你自己的进度——加入那天第 1 天，第 5 天投票，第二天一早出主持人收尾。
// A.starts / A.count 由 activities.js 按你加入的那天算好；这里把日子（Wed 20 Jan、2/15 周一）换成「第 N 天」，收尾的时刻换成「投完票的第二天」。
const RL = () => A.schedule === "rolling";
const dts = () => RL() ? Array.from({length: A.days}, (_, i) => UI("第 " + (i + 1) + " 天", "Day " + (i + 1))) : Z(D(), "dates");
const countWhen = () => { if (!RL()) return UI(`你那儿 ${lt(countAt())}（${hostT()}）`, `${lt(countAt())} your time (${hostT()})`);
  const k = Math.round((countAt() - Date.parse(K_().today() + "T00:00")) / 864e5); return k === 1 ? UI("明天", "tomorrow") : k === 0 ? UI("今天", "today") : k < 0 ? UI("已经出来了", "already out") : UI("投完票的第二天", "the day after you vote"); };
const whenOf = day => RL() ? dts()[day] + " · " + UI("主持人收尾：", "host's closing words: ") + countWhen() : bd(day < 4 ? D().whenEn[day] : D().whenEn[4].replace(/ · (8 pm|晚上八点)$/, "")) + " · " + UI("主持人收尾：", "host's closing words: ") + countWhen();
const hostName = () => SIDE() === "zh" ? UI("沈越", "Shen Yue") : D().host.nm;
// 开票时间过了：只放一段写好的主持人收尾（不是投票结果，票没有后台）
const closingHTML = () => now() < countAt() ? `<div class="envnote">${esc(RL() ? UI(`投完票的第二天，这里会有${hostName()}写好的收尾。`, `The day after you vote, ${hostName()}'s closing words appear here.`) : UI(`${countWhen()}以后，这里会有${hostName()}写好的收尾。`, `After ${countWhen()}, ${hostName()}'s closing words appear here.`))}</div>`
  : `<div class="closing"><div class="lab">🎙️ ${esc(UI(`${hostName()}的收尾`, `${hostName()}'s closing words`))}</div>${L(D().closing[0], D().closing[1], {who: D().host.id})}<div class="envnote">${esc(UI("这是主持人写好的话，不是投票结果。", "These are the host's own words, not a vote result."))}</div></div>`;
const now = () => Date.now();

// ── 能借走的说法：画线 ──
function phrases(){ const out = []; D().BW.forEach((day, di) => day.forEach(p => out.push({p: p[0], g: p[1], d: di}))); return out.sort((a, b) => b.p.length - a.p.length); }
function findSpans(s, lang){ const spans = [], low = lang === "zh" ? " " + s + " " : s.toLowerCase();
  phrases().forEach(ph => { const key = lang === "zh" ? " " + ph.p + " " : ph.p.toLowerCase(); let i = low.indexOf(key);
    while (i >= 0){ let a = i, b = lang === "zh" ? i + ph.p.length : i + key.length;
      const okB = lang === "zh" || ((a === 0 || !/[a-z]/i.test(s[a - 1])) && (b >= s.length || !/[a-z']/i.test(s[b])));
      if (okB && !spans.some(x => !(b <= x.a || a >= x.b))) spans.push({a, b, ph}); i = low.indexOf(key, i + 1); } });
  return spans.sort((x, y) => x.a - y.a); }
function T(s, lang){ lang = lang || D().lang; const spans = findSpans(s, lang); let out = "", pos = 0;
  spans.forEach(sp => { out += tok(s.slice(pos, sp.a), lang); const got = S.pocket[K(sp.ph.p)] != null; out += `<u class="bw ${got ? "got" : ""}" data-bw="${esc(sp.ph.p)}">${tok(s.slice(sp.a, sp.b), lang)}</u>`; pos = sp.b; });
  return out + tok(s.slice(pos), lang); }
const ZD = () => D().lang === "zh" ? D().dict : {};
function tok(s, lang){ if (!s) return "";
  if (lang === "zh") return s.split(" ").map(w => { if (!w) return ""; if (PUNCT.test(w)) return `<span class="zp">${esc(w)}</span>`; if (/^\{\d\}$/.test(w)) return w; const py = ZD()[w] ? ZD()[w][0] : "";
    return `<span class="w zw" data-w="${esc(w)}"><span class="py">${esc(py || " ")}</span><span class="hz">${esc(w)}</span></span>`; }).join("");
  return esc(s).replace(/[A-Za-z][A-Za-z'’\-]*/g, m => `<span class="w" data-w="${m}">${m}</span>`); }
const plain = (s, lang) => (lang || D().lang) === "zh" ? String(s || "").replace(/ /g, "") : String(s || "");
const pyOf = s => String(s || "").split(" ").filter(w => w && !PUNCT.test(w)).map(w => ZD()[w] ? ZD()[w][0] : "").join(" ");
// 意思：英文会场（中文界面）给中文意思；中文会场给英文意思，界面不是英文的也先看英文
const G = g => SIDE() === "en" && !ZH_() ? "" : (g || "");
const LINES = {}; let lineSeq = 0;
function L(s, g, opts){ opts = opts || {}; const lang = opts.lang || D().lang, id = "L" + (++lineSeq); LINES[id] = {s, g, lang, who: opts.who};
  return `<div class="ln ${lang === "zh" ? "zh" : ""}" data-l="${id}"><button class="pl" data-play="${id}" aria-label="▶">▶</button><div class="tx"><div class="t">${T(s, lang)}</div>${g ? `<div class="g">${esc(G(g))}</div>` : ""}</div></div>`; }
function speak(text, lang, btn){ lang = lang || D().lang; K_().say(plain(text, lang), {l: lang});
  if (btn){ R.querySelectorAll(".pl.play").forEach(b => { b.classList.remove("play"); b.textContent = "▶"; }); btn.classList.add("play"); btn.textContent = "❚❚"; setTimeout(() => { btn.classList.remove("play"); btn.textContent = "▶"; }, Math.max(2200, plain(text, lang).length * (lang === "zh" ? 300 : 80))); } }

// ── 反应 ──
const blip = f => K_().blip(f);
let tT, bT;
function fx(){ if (!FX || !FX.isConnected){ FX = document.createElement("div"); FX.className = "ckx-fx"; FX.dataset.nopy = ""; FX.innerHTML = `<div class="toast"></div><div class="stamp"></div><div class="buddy"><img class="av" alt=""><div class="bt" style="flex:1;min-width:0"></div></div><div class="pop"></div>`; document.body.appendChild(FX); FX.addEventListener("click", onClick); } return FX; }
const $f = s => fx().querySelector(s);
function toast(m){ const t = $f(".toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 1900); }
function avHTML(p, cls){ cls = cls == null ? "av" : cls; return `<img class="${cls}" src="${esc(p.img || PH(p.id))}" alt="${esc(p.nm)}" loading="lazy">`; }
function buddy(pool){ const d = D(), p = pool[Math.floor(Math.random() * pool.length)]; const av = $f(".buddy .av"); av.src = d.host.img || PH(d.host.id);
  $f(".buddy .bt").innerHTML = `<b>${esc(d.host.nm)}</b><span class="e">${esc(plain(p[0], d.lang))}</span><span style="font-size:12px;color:var(--soft)">${esc(G(p[1]))}</span>`;
  const b = $f(".buddy"); b.classList.add("on"); clearTimeout(bT); bT = setTimeout(() => b.classList.remove("on"), 3600); speak(p[0], d.lang); }
function stamp(big, small){ const s = $f(".stamp"); s.innerHTML = `${esc(big)}<small>${esc(small)}</small>`; s.classList.remove("go"); void s.offsetWidth; s.classList.add("go"); blip(330); setTimeout(() => s.classList.remove("go"), 1700); }
function note(el){ try { const r = el.getBoundingClientRect(), n = document.createElement("span"); n.className = "note"; n.textContent = "♪"; n.style.left = (r.left + r.width / 2) + "px"; n.style.top = (r.top - 6) + "px"; fx().appendChild(n); setTimeout(() => n.remove(), 1000); } catch(e){} }
function keepScroll(fn){ const pg = cx.pg, sy = pg.scrollTop, wy = scrollY; fn(); pg.scrollTop = sy; scrollTo(0, wy); }

// ── 会场 ──
function seatPos(i, n){ const th = Math.PI * (1 - (i + .5) / n); return {x: 50 + 42 * Math.cos(th), y: 74 - 58 * Math.sin(th)}; }
function chamberHTML(){ const d = D(), day = S.view, n = d.cast.length, r = roleOf(); let seats = "", threads = "";
  d.cast.forEach((c, i) => { const p = seatPos(i, n);
    if (c.me){ const rr = day >= 1 ? (r || (day >= 2 ? roleOrDefault() : null)) : null, st = day >= 2 && (S.stance[SIDE()] || day > 2) ? stanceOf() : null;
      seats += `<button class="seat me" data-seat="me" style="left:${p.x}%;top:${p.y}%">${st && !S.gallery ? `<div class="plac up p${st[0]}"><b>${esc(d.stance[st])}</b></div>` : ""}<span class="av empty">${S.gallery ? "🪑" : (rr ? rr.ic : "?")}</span><div class="nm">${esc(meName())}${S.gallery ? `<br><i>${UI("旁听席", "Gallery")}</i>` : ""}</div></button>`; }
    else { const rr = d.roles.find(x => x.k === c.role);
      seats += `<button class="seat" data-seat="${c.id}" style="left:${p.x}%;top:${p.y}%">${day >= 2 ? `<div class="plac up p${c.st[0]}"><b>${esc(d.stance[c.st])}</b></div>` : ""}${avHTML(c)}${day >= 1 ? `<span class="ri">${rr.ic}</span>` : ""}${c.learner ? `<span class="wtag">${UI("同路人", "buddy")}</span>` : ""}<div class="nm">🎭 ${esc(c.nm)}<br><i>${esc(Z(c, "city"))}</i></div></button>`; } });
  if (day >= 3){ const meI = d.cast.findIndex(c => c.me), mp = seatPos(meI, n), tgt = S.rep[K(3)] ? S.opp[K(3)] : null;
    if (tgt && !S.gallery){ const ti = d.cast.findIndex(c => c.id === tgt), tp = seatPos(ti, n); threads += `<path d="M${mp.x} ${mp.y} Q ${(mp.x + tp.x) / 2} ${Math.min(mp.y, tp.y) - 28} ${tp.x} ${tp.y}" fill="none" stroke="#ffc861" stroke-width="2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`; }
    (SIDE() === "en" ? [["awa", "nate"], ["daniel", "marta"]] : [["tobi", "emma"], ["leila", "pong"]]).forEach(([a, b]) => { const ap = seatPos(d.cast.findIndex(c => c.id === a), n), bp = seatPos(d.cast.findIndex(c => c.id === b), n);
      threads += `<path d="M${ap.x} ${ap.y} Q ${(ap.x + bp.x) / 2} ${Math.min(ap.y, bp.y) - 18} ${bp.x} ${bp.y}" fill="none" stroke="rgba(233,220,195,.35)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`; }); }
  const rr = roleOf() || (day >= 2 ? roleOrDefault() : null);
  return `<div class="chamber ${S.chOpen ? "" : "shut"}"><div class="cap"><span>${esc(D().chamberE || "")}</span><button data-ch>${S.chOpen ? UI("收起会场 ▲", "Hide ▲") : UI("展开会场 ▼", "Show ▼")}</button></div>
    <div class="shutbar"><div class="mini">${d.cast.map(c => c.me ? `<b class="me0">${S.gallery ? "🪑" : rr ? rr.ic : "?"}</b>` : `<img class="${day >= 2 ? "s" + c.st[0] : ""}" src="${esc(PH(c.id))}" alt="${esc(c.nm)}">`).join("")}<span>${UI("点「展开」看会场", "tap Show for the chamber")}</span></div></div>
    <div class="hemi"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${threads}</svg>${seats}<div class="box ${day === 4 ? "on" : ""}" data-ballotbox></div>
     <div class="lect">${avHTML(d.host)}<div class="desk">${esc(SIDE() === "zh" ? "沈越" : d.host.nm)} · ${UI("中立", "neutral")}</div></div></div>
    <div class="withp">${avHTML(d.withP, "")}<span><b>${esc(d.withP.nm)}</b> · ${esc(Z(d.withP, "who"))}</span></div>
    <div class="chlegend">${day >= 2 ? `<span><i style="background:var(--for)"></i>${esc(d.stance.for)}</span><span><i style="background:var(--against)"></i>${esc(d.stance.against)}</span><span><i style="background:var(--but)"></i>${esc(d.stance.but)}</span>` : ""}<span>🎭 = ${UI("角色，不是真人", "role-play character")}</span></div></div>`; }

// ── 你的那一段 ──
const MICTXT = {};
const isOwn = t => /^[（(]/.test(t || "");
function micHTML(key, text){ const ok = S.said[key]; MICTXT[key] = text; const own = isOwn(text);
  return `<div class="mine"><div class="lab">${UI("🎙️ 说出来", "🎙️ SAY IT")}</div><div class="t ${text && !own ? "" : "empty"}">${own ? esc(text) : text ? T(text) : esc(UI("先在上面选好或填好", "Pick or fill in above first"))}</div>
    <div class="sayrow"><button class="ear" data-hear="${esc(own ? "" : text || "")}" ${text && !own ? "" : "disabled"} aria-label="🔊">🔊</button></div>
    <div class="ck-mic" data-mic="${esc(key)}">${text ? K_().micHTML(ok ? {done: own ? text : plain(text), real: true} : null) : ""}</div></div>`; }
// 英文会场在不是中文的界面：要用的词配英文解释（ck.wordsE），角色名配 your role
const WG = w => SIDE() === "en" && !ZH_() ? ((D().wordsE || {})[w[0]] || (D().roles.some(r => r.en === w[0]) ? "your role" : "")) : G(w[1]);
function wordsHTML(ws){ return `<div class="words"><div class="wt">${UI("要用的词 · 点了能听", "WORDS YOU NEED · tap to hear")}</div>${ws.map(w => `<button data-cksay="${esc(w[0])}">${esc(plain(w[0]))}${D().lang === "zh" ? ` <small style="color:var(--hot)">${esc(pyOf(w[0]))}</small>` : ""}<small>${esc(WG(w))}</small></button>`).join("")}</div>`; }
function tplFill(tpl, key, n){ const vals = S.fill[key] || []; let out = T(tpl); for (let i = 0; i < n; i++){ const v = vals[i]; out = out.replace(`{${i}}`, v ? `<span class="slot">${T(v)}</span>` : `<span class="slot empty">＿＿</span>`); } return out; }
function tplText(tpl, key, n){ const vals = S.fill[key] || []; for (let i = 0; i < n; i++) if (!vals[i]) return ""; let t = tpl; for (let i = 0; i < n; i++) t = t.replace(`{${i}}`, vals[i]); return t; }
function chipRow(key, i, list, label){ const vals = S.fill[key] || [];
  return `${label ? `<div class="chl">${esc(label)}</div>` : ""}<div class="chips">${list.map(c => `<button class="chip ${vals[i] === c[0] ? "on" : ""}" data-fill="${esc(key)}" data-i="${i}" data-v="${esc(c[0])}">${esc(plain(c[0]))}${D().lang === "zh" ? `<small style="color:var(--hot)">${esc(pyOf(c[0]))}</small>` : ""}<small>${esc(G(c[1]))}</small></button>`).join("")}</div>`; }
const lvBadge = () => `<span class="lvb">${esc(Z(D(), "lvName")[S.lv])}</span>`;
const refBlock = ref => `<details class="ref"><summary>${UI("看一个参考说法", "See one way to say it")}</summary>${L(ref[0], ref[1])}</details>`;
const qBox = f => `<div class="qbox">${D().lang === "zh" ? T(f.q) : esc(Z(f, "q"))}${f.qg ? `<small>${esc(f.qg)}</small>` : ""}</div>`;
const optList = (key, opts) => opts.map((o, i) => `<button class="opt ${S.b1[key] === i ? "on" : ""}" data-b1="${esc(key)}" data-i="${i}"><div class="t">${T(o[0])}</div><div class="z">${esc(G(o[1]))}</div></button>`).join("");
function galleryBlock(){ const d4 = S.view === 4;
  return `<div class="you"><div class="gallery">🪑 <b>${UI("你在旁听席。", "You're in the public gallery.")}</b> ${d4 ? UI("今天你也能投票，不署名。", "You can still vote today, anonymously.") : UI("今天可以听每个人的发言、点词看意思，不用开口。", "Today you can listen to every speech and tap any word; no need to speak.")} ${UI("想上场了，点上面「只旁听」换回来。", "Want to join in? Tap 'Just watch' above to switch back.")}</div></div>`; }
const OWN = () => UI("（你自己的话）", "(your own words)");
const lvRow = () => `<div class="lvrow">${K_().levelsHTML(S.lv)}</div>`;

function day0(){ const d = D(), dd = d.days[0], hk = K("hi");
  const col = (arr, pre, cls, h) => `<div class="col ${cls}"><h5>${esc(h)}</h5>${arr.map((r, i) => `<button class="rs ${S.hi[hk] === pre + i ? "on" : ""}" data-hi="${pre + i}"><span class="mk"></span><span class="pen">✏️</span><span class="e">${T(r[0])}</span><span class="z">${esc(G(r[1]))}</span></button>`).join("")}</div>`;
  let h = `<div class="agenda"><div class="q">${T(d.issue.t)}<div style="font:12.5px -apple-system,sans-serif;color:var(--soft);font-weight:400;margin-top:2px">${esc(G(d.issue.g))}</div></div>
    <div class="cols">${col(d.F, "f", "f", d.stance.for)}${col(d.A, "a", "a", d.stance.against)}</div><div class="hint" style="margin:8px 0 0;text-align:center">${UI("✏️ 点一条，用荧光笔划出你觉得最有道理的那一条", "✏️ Tap one to highlight the reason you find strongest")}</div></div>`;
  if (S.gallery) return h + galleryBlock();
  const key = K("d0"), lv = dd.lv;
  h += `<div class="you"><div class="yh">${UI("你自己的第一感觉", "Your own first feeling")}${lvBadge()}</div>${lvRow()}`;
  if (S.lv === 0) h += `<div class="hint">${esc(Z(lv.b, "hint"))}</div>${optList(key, lv.b.opts)}${wordsHTML(lv.b.words)}` + micHTML(key, S.b1[key] != null ? lv.b.opts[S.b1[key]][0] : "");
  else if (S.lv === 1){ const chunks = [...d.F, ...d.A].map(r => [r[2], r[3]]); h += `<div class="hint">${esc(Z(lv.m, "hint"))}</div><div class="tplbox">${tplFill(lv.m.tpl, key, 1)}</div>${chipRow(key, 0, chunks)}` + micHTML(key, tplText(lv.m.tpl, key, 1)); }
  else h += qBox(lv.f) + refBlock(lv.f.ref) + micHTML(key, OWN());
  return h + `</div>`; }
function day1(){ const d = D(), r = roleOf();
  let h = `<div class="deck">${d.roles.map((x, i) => `<button class="rc ${r ? (r.k === x.k ? "flip" : "dim") : ""}" data-draw="${i}"><span class="in"><span class="ba">HEYVOYO<br>🎭</span><span class="fa"><span class="ic">${x.ic}</span><b>${esc(Z(x, "nm"))}</b></span></span></button>`).join("")}</div>`;
  if (!r) return h + `<div class="hint" style="text-align:center;margin-top:8px">${UI("六张牌扣着，点一张翻过来。不喜欢可以换一次。", "Six cards face down. Tap one to turn it over. You can swap once.")}</div>`;
  h += `<div class="rolecard"><span class="mask">🎭 ${UI("你演的角色", "the role you play")}</span><div class="h"><span class="ic">${r.ic}</span><div class="nm">${esc(Z(r, "nm"))}<small>${esc(plain(r.en))}</small></div></div>
    <div class="wk">${esc(Z(r, "wk"))}</div><div class="cares">${esc(Z(r, "cares"))}</div>${(S.roleDraws[SIDE()] || 0) < 2 ? `<button class="btn ghost" data-redraw style="margin-top:8px;padding:6px 12px;font-size:12.5px">${UI("换一张（只能换一次）", "Swap once")}</button>` : ""}</div>`;
  if (S.gallery) return h + galleryBlock();
  const key = K("d1");
  h += `<div class="you"><div class="yh">${UI("用这个人的口气开场", "Open as this person")}${lvBadge()}</div>${lvRow()}`;
  if (S.lv === 0){ h += `<div class="hint">${UI("挑一句跟着说。", "Pick one and say it.")}</div>${optList(key, r.open)}`;
    h += wordsHTML(SIDE() === "en" ? [["speaking as", "作为……来说"], ["from where I stand", "站在我的位置看"], ["worry about", "担心"], [r.en, r.nm]] : [["作为", "as"], ["站在 我 的 角度", "from where I stand"], ["担心", "worry"], [r.floor || r.en, "your floor"]]);
    h += micHTML(key, S.b1[key] != null ? r.open[S.b1[key]][0] : ""); }
  else if (S.lv === 1){ const tpl = fillT(d.tpl1, r); h += `<div class="hint">${UI("点一个这个人最担心的事。", "Tap what this person worries about most.")}</div><div class="tplbox">${tplFill(tpl, key, 1)}</div>${chipRow(key, 0, r.worry)}` + micHTML(key, tplText(tpl, key, 1)); }
  else h += `<div class="qbox">${UI("用这个角色说 30 秒：这件事对你的一周意味着什么？", "30 seconds as this person: what would this mean for your week?")}</div>` + refBlock(r.open[1]) + micHTML(key, OWN());
  return h + `</div>`; }
function day2(){ const d = D(), r = roleOrDefault(), st = stanceOf(), key = K(2);
  let h = `<div class="rolecard" style="animation:none;padding:9px 12px"><div class="h"><span class="ic" style="font-size:26px">${r.ic}</span><div class="nm" style="font-size:15px">${UI("你演", "You play")}：${esc(Z(r, "nm"))}<small>${esc(Z(r, "cares"))}</small></div></div>${roleOf() ? "" : `<div class="hint" style="margin:4px 0 0">${UI("（你还没抽角色牌，先替你拿了一张；想自己抽，回第 2 天）", "(You haven't drawn a card yet, so one was given to you; go back to day 2 to draw your own)")}</div>`}</div>`;
  if (S.gallery) return h + galleryBlock();
  h += `<div class="you"><div class="yh">${UI("举牌", "Raise a placard")}</div><div class="hint">${UI("替这个角色决定。", "Decide for your role.")}</div>
   <div class="placs">${["for", "against", "but"].map(s => `<button class="pc ${s[0]} ${S.stance[SIDE()] === s ? "on" : S.stance[SIDE()] ? "off" : ""}" data-st="${s}">${esc(d.stance[s])}<small>${esc(Z(d, "stanceG")[s])}</small></button>`).join("")}</div></div>`;
  if (!S.stance[SIDE()]) return h;
  h += `<div class="you"><div class="yh">${UI("发言：一个理由 + 一个例子", "Speak: one reason + one example")}${lvBadge()}</div>${lvRow()}`;
  if (S.lv === 0){ h += `<div class="hint">${UI("跟着说这一段。", "Say this speech.")}</div>${L(r.sp[st][0], r.sp[st][1])}`;
    h += wordsHTML(SIDE() === "en" ? [["I support it", "我支持"], ["I'm against it", "我反对"], ["yes, but", "可以，但……"], ["for example", "比如"]] : [["同意", "agree"], ["不同意", "disagree"], ["不过", "but"], ["比如", "for example"]]);
    h += micHTML(key, r.sp[st][0]); }
  else if (S.lv === 1){ const tpl = fillT(d.tpl2[st], r), reasons = r.rs[st], vals = S.fill[key] || [], ri = reasons.findIndex(x => x[0] === vals[0]);
    h += `<div class="hint">${UI("先挑理由，再挑一个接得上的例子。", "Pick a reason first, then an example that fits it.")}</div><div class="tplbox">${tplFill(tpl, key, 2)}</div>`;
    h += chipRow(key, 0, reasons.map(x => [x[0], x[1]]), UI("理由", "Reason"));
    h += ri >= 0 ? chipRow(key, 1, reasons[ri][2], UI("例子（接得上这个理由）", "Example (fits this reason)")) : `<div class="chl">${UI("例子：先挑理由", "Example: pick a reason first")}</div>`;
    h += micHTML(key, tplText(tpl, key, 2)); }
  else h += `<div class="qbox">${UI("录 45 秒：一个理由 + 一个这个人生活里的例子", "45 seconds: one reason + one example from this person's life")}</div>` + refBlock(r.sp[st]) + micHTML(key, OWN());
  return h + `</div>`; }
const fillRep = (tpl, a, r, c) => tpl.replace("{a0}", a[0]).replace("{a1}", a[1]).replace("{art}", r.art).replace("{nm}", r.nm).replace("{ga}", r.ga || r.art).replace("{c0}", c[0]).replace("{c1}", c[1]);
function replyOpts(tgt){ const d = D(), r = roleOrDefault(), c = castBy(tgt), ctr = r.ctr[c.st === "for" ? "for" : "against"], ack = c.ack || ["", ""];
  return d.rep.map(p => [fillRep(p[0], ack, r, ctr), fillRep(p[1], ack, r, ctr)]); }
function day3(){ const d = D(), r = roleOrDefault(), st = stanceOf(), key = K(3), ids = d.opp[st];
  let h = `<div class="you" style="border:0;margin-top:10px;padding-top:0"><div class="yh">${UI("👂 先听对面的两段", "👂 First, two from the other side")}</div><div class="hint">${UI("点 ▶ 听，点词看意思。听完挑一段回。", "Tap ▶ to listen, tap words for meaning. Then pick one to answer.")}</div>`;
  ids.forEach(id => { const c = castBy(id), rr = d.roles.find(x => x.k === c.role), on = S.opp[key] === id;
    h += `<div class="opp ${on ? "on" : ""}"><div class="h">${avHTML(c)}<div style="flex:1"><b>🎭 ${esc(c.nm)}</b> · ${esc(Z(c, "city"))} · ${UI("演", "as")} ${esc(Z(rr, "nm"))}</div><span class="tag" style="background:${c.st === "for" ? "var(--for)" : c.st === "against" ? "var(--against)" : "var(--but)"};color:#fff">${esc(d.stance[c.st])}</span>${S.gallery ? "" : `<button class="btn ${on ? "ink" : "ghost"}" data-opp="${c.id}" style="padding:5px 10px;font-size:12px">${on ? "✓ " + UI("回它", "Answering") : S.opp[key] ? UI("换成它", "Switch") : UI("回它", "Answer")}</button>`}</div>${S.opp[key] && !on && !S.gallery ? "" : L(c.line[0], c.line[1], {who: c.id})}
    ${on && S.rep[key] && !S.gallery ? `<div class="thread">↳ ${esc(meName())}：${esc(plain(S.rep[key]))}</div>` : ""}</div>`; });
  h += `</div>`;
  if (S.gallery) return h + galleryBlock();
  const tgt = S.opp[key]; if (!tgt) return h;
  const reps = replyOpts(tgt), k2 = K("r3");
  h += `<div class="you"><div class="yh">${UI("回一句", "Your reply")}${lvBadge()}</div>${lvRow()}`;
  if (S.lv === 0){ h += `<div class="hint">${UI("先承认对方说对的一点，再用你角色的理由回。挑一句。", "Say what they got right, then answer with your role's reason. Pick one.")}</div>${optList(k2, reps)}`;
    h += wordsHTML(SIDE() === "en" ? [["That's a fair point", "说得有道理"], ["I see what you mean", "我明白你的意思"], ["but", "但是"]] : [["有道理", "makes sense"], ["确实", "really"], ["不过", "but"], ["可是", "but"]]);
    h += micHTML(key, S.b1[k2] != null ? reps[S.b1[k2]][0] : ""); }
  else if (S.lv === 1){ const tpl = fillT(d.tpl3, r); h += `<div class="tplbox">${tplFill(tpl, key, 1)}</div>${chipRow(key, 0, r.worry)}` + micHTML(key, tplText(tpl, key, 1)); }
  else h += `<div class="qbox">${UI("回应这一段，再问对方一个问题。", "Answer this speech, then ask them one question.")}</div>` + refBlock(reps[0]) + micHTML(key, OWN());
  return h + `</div>`; }
function myLine2(){ const t = S.saidTxt[K(2)]; if (t && !isOwn(t)) return t; return t ? UI("（你录的那段 45 秒）", "(your 45-second recording)") : ""; }
function day4(){ const d = D(), key = K(4), r = roleOrDefault(), v1 = S.vote1[key], as = S.voteAs[key], v2 = S.vote2[key], op = S.opened[key], sec = S.sec5[key] || "ballot";
  const acc = (id, title, state, body, locked) => `<div class="acc ${locked ? "lock" : ""}"><button class="ah" data-sec="${id}" ${locked ? "disabled" : ""}>${title}<small>${state}</small></button>${sec === id && !locked ? `<div class="ab">${body}</div>` : ""}</div>`;
  const myL = myLine2(), items = d.cast.filter(c => !c.me).map(c => ({c, rr: d.roles.find(x => x.k === c.role)}));
  let b = `<div class="ballot"><h5>${UI("第一张票", "Ballot 1")} · ${T(SIDE() === "en" ? "Should our council try it for a year?" : "同意 这个 方案 吗 ？")}</h5><div class="h">${UI("替谁投？", "Voting as?")}</div>
    <div class="bx">${S.gallery ? "" : `<button data-as="role" class="${as === "role" ? "on" : ""}">${UI("替我的角色投", "As my role")}<small>${esc(Z(r, "nm"))}</small></button>`}<button data-as="self" class="${as === "self" ? "on" : ""}">${UI("我自己投", "As myself")}<small>${UI("不公开是谁", "nobody sees who")}</small></button></div>
    <div class="h" style="margin-top:8px">${UI("你的票", "Your vote")}</div>
    <div class="bx">${[["yes", UI("试", "Yes"), SIDE() === "en" ? "Yes" : "同意"], ["no", UI("不试", "No"), SIDE() === "en" ? "No" : "不同意"], ["abs", UI("弃权", "Abstain"), SIDE() === "en" ? "Abstain" : "弃权"]].map(([k, a, z]) => `<button data-v1="${k}" class="${v1 === k ? "on" : ""}" ${as ? "" : "disabled"}>${esc(a)}<small>${esc(z)}</small></button>`).join("")}</div></div>
    <div class="ballot"><h5>${UI("第二张票 · 最有说服力的一句", "Ballot 2 · the most persuasive line")}</h5><div class="h">${UI("只评说得好不好（一个理由、一个例子），不评哪边对。", "Judge how it's argued (a reason, an example), not which side is right.")}</div>
    ${items.map(({c, rr}) => `<button class="vl ${v2 === c.id ? "on" : ""}" data-v2="${c.id}" ${v1 ? "" : "disabled"}>${avHTML(c)}<div class="t">${T(c.line[0])}<small>🎭 ${esc(c.nm)} · ${esc(Z(rr, "nm"))}</small><span class="vg">${esc(G(c.line[1]))}</span></div><span class="st">⭐</span></button>`).join("")}
    ${myL ? `<div class="vl mine"><span class="av txt" style="width:28px;height:28px;font-size:12px">${UI("你", "Me")}</span><div class="t">${isOwn(myL) ? esc(myL) : T(myL)}<small>${esc(meName())} · ${UI("不能投自己", "can't vote for yourself")}</small></div></div>` : ""}</div>
    <button class="btn wide" data-count ${v1 && v2 && !op ? "" : "disabled"}>${op ? UI("✓ 已开票", "✓ Counted") : UI("🗳️ 投进投票箱，开票", "🗳️ Drop in the box and count")}</button>`;
  let e = "";
  if (op){ const c = castBy(v2);
    e = `<div class="env ${op === "open" ? "open" : ""}" data-envbox><span class="seal">✦</span><div class="lab">${UI("最有说服力的一句 · 信封", "THE MOST PERSUASIVE LINE")}</div>${op !== "open" ? `<button class="btn ink" data-env style="margin-top:10px">${UI("拆开信封", "Open the envelope")}</button>` : ""}
     <div class="in"><div class="q">${T(c.line[0])}</div><div class="by">🎭 ${esc(c.nm)} · ${esc(Z(d.roles.find(x => x.k === c.role), "nm"))} · ${UI("你投的这一句", "the line you voted for")}</div>
     <div class="envnote">${esc(UI("今年的票只记在你手机上。🎭 角色的票不算，所以这里不显示任何票数。", "This year your votes are kept only on your phone. 🎭 votes don't count, so there are no numbers here."))}</div>${closingHTML()}
     ${S.gallery ? `<div class="envnote">🪑 ${UI("你在旁听席：谢谢你来听、来投票。上场演一个角色的人才拿「议员」章。", "You watched from the gallery: thanks for listening and voting. The badge goes to people who play a role.")}</div>` : `<div class="badge"><div><small>${esc(d.badge[0])}</small><big>${r.ic}</big>${esc(Z(r, "nm"))}<small>${esc(dts()[4])}</small></div></div>`}
     <button class="btn ink" data-sec="folder" style="margin-top:12px">${UI("翻开「真实世界」档案 →", "Open the real-world file →")}</button></div></div>`; }
  const f = `<div class="folder open"><span class="tab">${UI("REAL WORLD · 档案", "REAL WORLD · FILE")}</span><div class="body"><div class="cover">${UI("真实世界是怎么决定的", "How the real world decided")}</div>
     <div class="docs">${d.real.map(x => `<div class="doc ${x.honest ? "honest" : ""}"><div class="k">${esc(Z(x, "k"))}</div>${esc(Z(x, "t"))}<span class="src">${UI("出处", "Source")}：${esc(Z(x, "s"))}</span></div>`).join("")}</div></div></div>
     ${S.gallery ? "" : `<button class="btn" data-sec="say" style="margin-top:12px;width:100%">${UI("说一句：跟你想的一样吗？ →", "Say it: is it what you thought? →")}</button>`}`;
  let s = ""; const lv = d.days[4].lv, sk = K("d4");
  if (S.lv === 0) s = `<div class="hint">${esc(Z(lv.b, "hint"))}</div>${optList(sk, lv.b.opts)}${wordsHTML(lv.b.words)}` + micHTML(sk, S.b1[sk] != null ? lv.b.opts[S.b1[sk]][0] : "");
  else if (S.lv === 1) s = `<div class="hint">${esc(Z(lv.m, "hint"))}</div><div class="tplbox">${tplFill(lv.m.tpl, sk, 2)}</div>${chipRow(sk, 0, lv.m.slots[0])}${chipRow(sk, 1, lv.m.slots[1])}` + micHTML(sk, tplText(lv.m.tpl, sk, 2));
  else s = qBox(lv.f) + refBlock(lv.f.ref) + micHTML(sk, OWN());
  let h = acc("ballot", `🗳️ ${UI("两张票", "Two ballots")}`, op ? `<span class="ok">✓</span>` : v1 && v2 ? UI("可以开票", "ready") : "", b, false);
  h += acc("env", `✉️ ${UI("开票 · 信封", "Count · envelope")}`, op === "open" ? `<span class="ok">✓</span>` : op ? UI("待拆", "sealed") : UI("投完才开", "after voting"), e, !op);
  h += acc("folder", `📂 ${UI("真实世界怎么决定的", "How the real world decided")}`, S.folder[key] ? `<span class="ok">✓</span>` : "", f, op !== "open");
  if (!S.gallery) h += acc("say", `🎙️ ${UI("跟你想的一样吗？", "Is it what you thought?")}${lvBadge()}`, S.said[sk] ? `<span class="ok">✓</span>` : "", lvRow() + s, !S.folder[key]);
  return h; }
function react0(d){ const R0 = d.react0; if (S.lv === 0){ const i = S.b1[K("d0")]; return R0.b[i != null ? i : 2]; } return S.lv === 1 ? R0.m : R0.f; }
function dayOfKey(k){ const x = k.split(":")[1]; return {d0: 0, d1: 1, "2": 2, "3": 3, d4: 4}[x] != null ? {d0: 0, d1: 1, "2": 2, "3": 3, d4: 4}[x] : -1; }
function haulHTML(){ const d = D(), day = S.view, list = d.BW[day];
  const saidToday = Object.keys(S.saidTxt).filter(k => k.startsWith(SIDE() + ":") && dayOfKey(k) === day).map(k => S.saidTxt[k]).filter(t => t && !isOwn(t));
  if (!saidToday.length && !list.some(p => S.pocket[K(p[0])] != null)) return "";
  const used = p => saidToday.some(t => d.lang === "zh" ? (" " + t + " ").includes(" " + p + " ") : t.toLowerCase().includes(p.toLowerCase()));
  return `<div class="haul"><div class="bh">🏷️ ${UI("今天捡到的说法", "Phrases you picked up today")}<small>${esc(dts()[day])}</small></div>
    <div class="sub">${UI("🗣️ 你说出来的 · 🎒 收进口袋的 · 👀 还没碰过。画红线的说法点开就能收；点这里的卡再听。", "🗣️ you said it · 🎒 in your pocket · 👀 not yet. Underlined phrases can be pocketed; tap a card to hear it.")}</div>
    ${saidToday.length ? `<div class="hmine">🗣️ ${esc(plain(saidToday[saidToday.length - 1]))}</div>` : ""}
    <div class="hrow">${list.map(p => { const u = used(p[0]), g = S.pocket[K(p[0])] != null; return `<button class="hc ${u ? "used" : g ? "got" : "no"}" data-hc="${esc(p[0])}">${u ? "🗣️" : g ? "🎒" : "👀"} ${esc(plain(p[0]))}<i>${d.lang === "zh" ? esc(pyOf(p[0])) + " · " : ""}${esc(G(p[1]))}</i></button>`; }).join("")}</div></div>`; }

// ── 画 ──
function render(){ lineSeq = 0; for (const k in LINES) delete LINES[k];
  const d = D(), day = S.view, dd = d.days[day], tru = Z(dd, "truth"), hk = Z(dd, "hook"), dates = dts();
  // 还没开会：第一天也不能先做，锁上写真实日期（2026-11-15 检查员）
  const notYet = K_().today() < A.starts[0];
  let h = `<div class="mast"><div class="k">${esc(d.mast.k)}</div><div class="t">${SIDE() === "zh" ? T(d.mast.t) : esc(d.mast.t)}</div><div class="zt">${esc(Z(d.mast, "zt"))}</div><div class="sub">${esc(RL() && d.mast.subR ? Z(d.mast, "subR") : Z(d.mast, "sub"))}</div></div>
   <div class="host">${avHTML(d.host)}<span><b>${esc(d.host.nm)}</b> ${UI("主持", "hosts")} · ${esc(Z(d.host, "who"))}</span><span class="tag">🎭 ${UI("角色", "character")}</span></div>
   <div class="seatbar">${UI("你的座位", "Your seat")}：<button data-anon="0" class="${S.anon ? "" : "on"}">${UI("署名", "Named")}</button><button data-anon="1" class="${S.anon ? "on" : ""}">${UI("匿名", "Anonymous")}</button><button data-gal class="${S.gallery ? "on" : ""}">🪑 ${UI("只旁听", "Just watch")}</button></div>
   <div class="rules">${esc(Z(d, "rules"))}</div>
   ${chamberHTML()}
   <div class="pg"><div class="when">${esc(whenOf(day))}</div><div class="task">${esc(Z(dd, "task"))}</div><div class="taskEn">${SIDE() === "zh" ? T(dd.ten) : esc(dd.ten)}</div><p class="why">${esc(Z(dd, "why"))}</p>
    <div class="hs">${avHTML(d.host)}<div class="b"><div class="who"><b>${esc(d.host.nm)}</b> · 🎭</div>${L(dd.host[0], dd.host[1], {who: d.host.id})}<div class="ph">📷 ${esc(Z(dd, "ph"))}</div></div></div>
    ${notYet ? `<div class="next lockd"><span class="lk">🔒</span><div><b>${esc(UI(dates[0] + " 开会", "Opens " + dates[0]))}</b><span>${esc(UI("到那天再来，第一天才开。现在可以先看看议题和会场。", "Come back that day: day 1 opens then. You can look at the issue and the chamber now."))}</span></div></div>` : [day0, day1, day2, day3, day4][day]()}
    ${tru ? `<details class="truth" ${innerWidth < 560 ? "" : "open"}><summary class="k">📎 ${esc(tru.k)} <span style="font-weight:500;color:var(--soft)">${UI("· 有出处", "· sourced")}</span></summary>${esc(tru.t)}<span class="src">${UI("出处", "Source")}：${esc(tru.s)}</span></details>` : ""}
    ${haulHTML()}</div>
   <div class="wh"><h3>${UI("会场里的其他人", "Others in the room")}</h3><span>🎭 ${UI("都是角色 · 不编票数", "all characters · no made-up counts")}</span></div>
   <div class="row">${dd.world.map(w => { const c = castBy(w.id), rr = d.roles.find(x => x.k === c.role), q = w.use === "line" ? c.line : w.q;
     return `<div class="card"><span class="rolet">🎭</span><div class="who">${avHTML(c)}<div><b>${esc(c.nm)}</b>${esc(Z(c, "city"))}${day >= 1 ? ` · ${esc(Z(rr, "nm"))}` : ""}${c.learner ? UI(" · 同路人", " · buddy") : ""}</div></div>
     ${q ? L(q[0], q[1], {who: c.id}) : ""}${Z(w, "z") ? `<div class="z">${esc(Z(w, "z"))}</div>` : ""}<div class="cb"><button data-nod>👏 ${UI("说得好", "Well put")}</button><button data-nod>🤔 ${UI("想想", "Hmm")}</button></div></div>`; }).join("")}</div>
   ${day < 4 ? `<div class="next" data-next><span class="lk">${day + 1 <= S.today ? "🔓" : "🔒"}</span><div><b>${esc(dates[day + 1] + " · " + hk[0].replace(/^(明天|Tomorrow: ?)/, ""))}</b><span>${esc(hk[1])}</span></div></div>` : `<div class="next" data-next4><span class="lk">🗳️</span><div><b>${esc(hk[0])}</b><span>${esc(hk[1])}</span></div></div>`}
   <div style="height:30px"></div>`;
  R.innerHTML = h;
  R.querySelectorAll(".ck-mic").forEach(box => { const key = box.dataset.mic, el = box.querySelector(".ak-mic"); if (!el) return;
    K_().mic(el, {want: () => isOwn(MICTXT[key]) ? "" : plain(MICTXT[key]), l: D().lang, free: isOwn(MICTXT[key]), onDone: v => finishRec(key, v)}); }); }

// ── 小卡：点词看意思、收说法 ──
function showPop(el, lineId){ const w = el.dataset.w, ln = LINES[lineId] || {}, lang = ln.lang || D().lang; let py = "", m = "";
  if (lang === "zh"){ const z = ZD()[w]; if (z){ py = z[0]; m = z[1]; } }
  else { const ED = D().dict || {}; let k = w.toLowerCase().replace(/’/g, "'").replace(/['’]+$/, ""); m = ZH_() ? (ED[k] || ED[k.replace(/'s$/, "")] || ED[k.replace(/s$/, "")] || "") : ""; }
  const u = el.closest("u.bw"); let bw = "";
  if (u){ const p = u.dataset.bw, ph = phrases().find(x => x.p === p), got = S.pocket[K(p)] != null;
    bw = `<div class="bwrow">${UI("能借走的说法", "A phrase you can borrow")}<b>${esc(plain(p, lang))}</b>${esc(G(ph ? ph.g : ""))}<br><button data-cksay="${esc(p)}" data-lang="${lang}">🔊</button> <button data-pocket="${esc(p)}">${got ? UI("✓ 已在口袋里", "✓ In your pocket") : UI("🎒 收进口袋", "🎒 Pocket it")}</button></div>`; }
  const pop = $f(".pop");
  pop.innerHTML = `<div class="w0"><button data-cksay="${esc(w)}" data-lang="${lang}">🔊</button>${esc(w)}</div>${py ? `<div class="py">${esc(py)}</div>` : ""}<div class="m">${esc(m || "—")}</div>${ln.g ? `<div class="ln2">${UI("整句", "Whole line")}：${esc(G(ln.g))}</div>` : ""}${bw}`;
  pop.classList.add("on"); const r = el.getBoundingClientRect(); let x = r.left + r.width / 2 - 115, y = r.bottom + 8;
  x = Math.max(8, Math.min(x, innerWidth - 238)); if (y + 190 > innerHeight) y = Math.max(8, r.top - pop.offsetHeight - 8); pop.style.left = x + "px"; pop.style.top = y + "px";
  R.querySelectorAll(".w.hit").forEach(e => e.classList.remove("hit")); el.classList.add("hit"); speak(w, lang); }
function hidePop(){ if (!FX) return; $f(".pop").classList.remove("on"); if (R) R.querySelectorAll(".w.hit").forEach(e => e.classList.remove("hit")); }

// ── 说完 ──
const STAMP = [["说过感觉", "FIRST TAKE"], ["抽到角色", "ROLE DRAWN"], ["发过言", "SPOKEN"], ["回过话", "REPLIED"], ["说完了", "ALL SAID"]];
function finishRec(key){ const first = !S.said[key]; S.said[key] = true; S.saidTxt[key] = MICTXT[key]; blip(880);
  const d = D(), day = S.view; buddy(day === 0 ? [react0(d)] : d.days[day].react);
  if (day === 3 && first){ const t = S.saidTxt[key]; S.rep[K(3)] = t && !isOwn(t) ? t : UI("（你自己的回应）", "(your own reply)"); }
  save();
  if (first){ if (day === 1) toast(UI("角色卡挂上你的座位了", "Your role card is on your seat")); if (day === 2) toast(UI("你的牌在会场里举起来了", "Your placard is up in the chamber")); if (day === 3) toast(UI("你的回应连上了那段发言", "Your reply is threaded to their speech")); }
  if (!S.done[K(day)]){ S.done[K(day)] = 1; save(); cx.finish(plain(isOwn(MICTXT[key]) ? "" : MICTXT[key])); setTimeout(() => stamp(UI(STAMP[day][0], STAMP[day][1]), "DAY " + (day + 1) + (RL() ? "" : " · " + Z(d, "dates")[day])), 700); }
  setTimeout(() => { keepScroll(render); const s = R.querySelector(".seat.me"); if (s){ s.classList.remove("speak"); void s.offsetWidth; s.classList.add("speak"); } }, 900); }

// ── 选票飞进投票箱 ──
function flySlip(fromEl, label, cb){ const box = R.querySelector("[data-ballotbox]"); if (!box || !fromEl || !S.chOpen){ cb && cb(); return; }
  const fr = fromEl.getBoundingClientRect(), br = box.getBoundingClientRect(); if (br.bottom < 0 || br.top > innerHeight){ cb && cb(); return; }
  const s = document.createElement("div"); s.className = "slip"; s.textContent = label; s.style.left = (fr.left + fr.width / 2 - 23) + "px"; s.style.top = fr.top + "px"; fx().appendChild(s);
  requestAnimationFrame(() => { s.style.transform = `translate(${br.left - fr.left - fr.width / 2 + 29}px,${br.top - fr.top}px) rotate(-14deg) scale(.5)`; s.style.opacity = ".2"; });
  setTimeout(() => { s.remove(); box.animate([{transform: "translate(-50%,-50%) scale(1)"}, {transform: "translate(-50%,-50%) scale(1.15)"}, {transform: "translate(-50%,-50%) scale(1)"}], {duration: 300}); blip(300); cb && cb(); }, 950); }

// ── 点 ──
function onClick(e){ const t = e.target, w = t.closest(".w");
  if (w && R.contains(w)){ e.stopPropagation(); const ln = w.closest("[data-l]"); showPop(w, ln ? ln.dataset.l : null); blip(760); return; }
  const b = t.closest("button,[data-next],[data-next4]");
  if (!t.closest(".pop")) hidePop();
  if (!b) return;
  const ds = b.dataset;
  if (ds.aklv != null){ const v = +ds.aklv; K_().level(v); S.lv = v; keepScroll(render); blip(640); return; }
  if (ds.play){ const L0 = LINES[ds.play]; if (L0){ speak(L0.s, L0.lang, b); note(b); } return; }
  if (ds.cksay != null){ speak(ds.cksay, ds.lang || D().lang); return; }
  if (ds.hear != null){ if (ds.hear) speak(ds.hear, D().lang); note(b); return; }
  if (ds.pocket){ const k = K(ds.pocket); if (S.pocket[k] == null){ S.pocket[k] = S.view; save(); toast(UI("🎒 收进口袋了", "🎒 Pocketed")); blip(900); } hidePop(); keepScroll(render); return; }
  if (ds.hc){ const k = K(ds.hc); speak(ds.hc, D().lang); if (S.pocket[k] == null){ S.pocket[k] = S.view; save(); toast(UI("🎒 收进口袋了", "🎒 Pocketed")); } keepScroll(render); return; }
  if ("ch" in ds){ S.chOpen = !S.chOpen; save(); keepScroll(render); blip(500); return; }
  if (ds.anon != null){ S.anon = ds.anon === "1"; save(); keepScroll(render); toast(S.anon ? UI("别人只看到「匿名 · 4 号席」", "Others only see 'Anon · seat 4'") : UI("用你的名字", "Using your name")); return; }
  if ("gal" in ds){ S.gallery = !S.gallery; save(); keepScroll(render); toast(S.gallery ? UI("你坐到旁听席了：听就好", "You're in the gallery: just listen") : UI("回到你的座位", "Back in your seat")); return; }
  if (ds.hi){ const d = D(), hk = K("hi"), was = S.hi[hk]; S.hi[hk] = ds.hi; const r = (ds.hi[0] === "f" ? d.F : d.A)[+ds.hi.slice(1)]; S.fill[K("d0")] = [r[2]]; save();
    keepScroll(render); blip(700); if (was !== ds.hi) buddy([d.days[0].hi[ds.hi === d.days[0].hiRare ? 0 : 1]]); return; }
  if (ds.b1){ S.b1[ds.b1] = +ds.i; save(); keepScroll(render); blip(700); toast(UI("选好了，按红色话筒说出来", "Picked. Tap the red mic to say it")); return; }
  if (ds.fill){ const a = S.fill[ds.fill] || []; a[+ds.i] = ds.v; if (+ds.i === 0 && S.view === 2) a.length = 1; S.fill[ds.fill] = a; save(); keepScroll(render); blip(720); return; }
  if (ds.draw != null){ if (roleOf()) return; const d = D(), i = +ds.draw; S.role[SIDE()] = d.roles[i].k; S.roleDraws[SIDE()] = 1; save(); b.classList.add("flip"); blip(500);
    setTimeout(() => { keepScroll(render); toast(UI(`你抽到：${Z(d.roles[i], "nm")}`, `You drew: ${Z(d.roles[i], "nm")}`)); }, 650); return; }
  if ("redraw" in ds){ const d = D(), cur = S.role[SIDE()], rest = d.roles.filter(r => r.k !== cur), n = rest[Math.floor(Math.random() * rest.length)]; S.role[SIDE()] = n.k; S.roleDraws[SIDE()] = 2; S.b1[K("d1")] = null; S.fill[K("d1")] = []; S.said[K("d1")] = false; save(); keepScroll(render); toast(UI(`换成了：${Z(n, "nm")}`, `Swapped to: ${Z(n, "nm")}`)); blip(500); return; }
  if (ds.st){ S.stance[SIDE()] = ds.st; S.said[K(2)] = false; S.fill[K(2)] = []; save(); keepScroll(render); blip(600); toast(UI(`举起「${D().stance[ds.st]}」`, `Placard up: ${D().stance[ds.st]}`)); return; }
  if (ds.opp){ S.opp[K(3)] = ds.opp; S.b1[K("r3")] = null; S.said[K(3)] = false; S.rep[K(3)] = null; save(); keepScroll(render); blip(640); return; }
  if (ds.as){ S.voteAs[K(4)] = ds.as; save(); keepScroll(render); blip(600); return; }
  if (ds.v1){ S.vote1[K(4)] = ds.v1; save(); keepScroll(render); blip(640); toast(UI("第一张票填好了", "Ballot 1 filled in")); return; }
  if (ds.v2){ if (!S.vote1[K(4)]) return; S.vote2[K(4)] = ds.v2; save(); keepScroll(render); blip(700); toast(UI("⭐ 第二张票填好了", "⭐ Ballot 2 filled in")); return; }
  if ("count" in ds){ if (S.opened[K(4)]) return; b.disabled = true;
    { const o = cx.st(), J = o.j[A.id]; if (J){ J.dt = J.dt || {}; if (!J.dt[4]) J.dt[4] = K_().today(); cx.save(o); } }   // 随到随开：投完票这天记下，收尾第二天出来
    flySlip(b, "✓", () => flySlip(b, "⭐", () => { S.opened[K(4)] = "sealed"; S.sec5[K(4)] = "env"; save(); render(); toast(UI("两张票都进箱了", "Both ballots are in")); const env = R.querySelector("[data-envbox]"); env && env.scrollIntoView({behavior: "smooth", block: "center"}); })); return; }
  if ("env" in ds){ S.opened[K(4)] = "open"; save(); keepScroll(render);
    setTimeout(() => { K_().confetti(); if (S.gallery){ toast(UI("开票了", "Counted")); if (!S.done[K(4)]){ S.done[K(4)] = 1; save(); cx.finish(""); } } else stamp(D().badge[1] + " · " + D().badge[0], UI("你演过：", "You played: ") + Z(roleOrDefault(), "nm")); }, 250);
    setTimeout(() => buddy([D().days[4].host]), 1500); return; }
  if (ds.sec){ const k = K(4); S.sec5[k] = ds.sec; if (ds.sec === "folder" && !S.folder[k]){ S.folder[k] = 1; toast(UI("📂 真实世界的档案", "📂 The real-world file")); } save(); render();
    setTimeout(() => { const a = R.querySelector(`[data-sec="${ds.sec}"].ah`); a && a.scrollIntoView({behavior: "smooth", block: "start"}); }, 60); blip(560); return; }
  if ("nod" in ds){ b.classList.toggle("on"); blip(820); note(b); return; }
  if ("next" in ds){ const nx = S.view + 1; if (cx.canOpen(nx)){ cx.reopen(nx); } else { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); toast(RL() ? UI("明天才开，到时候再来", "Opens tomorrow — see you then") : UI(`${Z(D(), "dates")[nx]} 才开`, `Opens ${Z(D(), "dates")[nx]}`)); } return; }
  if ("next4" in ds){ toast(UI("下一期的议题投票在这里开", "Next issue vote opens here")); blip(); return; }
  if (b.closest(".seat")){ const id = ds.seat; if (id === "me") toast(S.gallery ? UI("旁听席", "The public gallery") : UI("这是你的座位", "This is your seat")); else { const c = castBy(id), rr = D().roles.find(x => x.k === c.role); toast(`🎭 ${c.nm} · ${Z(c, "city")}${S.view >= 1 ? " · " + Z(rr, "nm") : ""}`); if (S.view >= 2) speak(c.line[0], D().lang); } blip(780); return; }
}

// ── 交给 activities.js ──
window.ACT_MODES = window.ACT_MODES || {};
window.ACT_MODES.council = {
  html(c){ return `<div class="ckx" data-nopy><div data-ckx></div></div>`; },
  wire(c){ cx = c; A = c.a; R = c.pg.querySelector("[data-ckx]"); if (!R) return; mountCss(); fx(); load(); R.onclick = onClick;
    if (!this._g){ this._g = 1; addEventListener("scroll", hidePop, {passive: true, capture: true}); addEventListener("resize", hidePop); }
    render(); },
  stop(){ hidePop(); try { K_().hush(); } catch(e){} if (FX) FX.querySelector(".buddy").classList.remove("on"); }
};
function mountCss(){ if (document.getElementById("ckxCss")) return; const s = document.createElement("style"); s.id = "ckxCss"; s.textContent = CSS; document.head.appendChild(s); }
const CSS = `.ckx,.ckx-fx{--ink:#14305c;--ivory:#fbf7ee;--hot:#e2552f;--gold:#ffc861;--soft:#6b7488;--desk:#ece4d3;--line:#e6dfcf;--paper:#fffdf7;
 --for:#2f6b4f;--against:#a86a22;--but:#6f7d99;--wood:#7a5232;--wood2:#5e3e25;--felt:#20324f}
.ckx *{box-sizing:border-box}
.ckx,.ckx{margin:0;background:var(--desk);color:#24303a;font:15px/1.55 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;overflow-x:hidden}
.ckx button,.ckx-fx button{font:inherit;cursor:pointer;color:inherit}
.ckx textarea,.ckx-fx textarea,.ckx input,.ckx-fx input{font:inherit}
.ckx .mast{padding:16px 16px 10px;text-align:center;border-bottom:3px double var(--ink);margin:0 12px}
.ckx .mast .k{font:700 10.5px Georgia,serif;letter-spacing:.32em;color:var(--soft)}
.ckx .mast .t{font:italic 900 30px/1.05 Georgia,serif;color:var(--ink);margin-top:4px}
.ckx .mast .zt{font:900 18px/1.3 "Noto Serif SC",serif;color:var(--ink);margin-top:3px}
.ckx .mast .sub{font-size:12px;color:var(--soft);margin-top:2px}
.ckx .host{display:flex;align-items:center;gap:9px;margin:10px 12px 0;background:#fff;border-radius:99px;padding:5px 10px 5px 5px;font-size:12px;color:var(--soft);box-shadow:0 1px 4px rgba(20,48,92,.06)}
.ckx .host b{color:var(--ink)}
.ckx .host>span:not(.tag){flex:1;min-width:0}
.ckx .av{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:none;border:2px solid var(--ink);background:#d8cfbd center/cover}
.ckx .av.txt{display:grid;place-items:center;font:900 15px "Noto Serif SC",serif;color:#fff;background:var(--ink)}
.ckx .tag{font-size:10px;background:#f1ebdd;border-radius:99px;padding:1px 7px;color:var(--soft);white-space:nowrap;flex:none}
.ckx .seatbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 12px 0;font-size:11.5px;color:var(--soft)}
.ckx .seatbar button{border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:3px 9px;font-size:11.5px;font-weight:700;color:var(--ink)}
.ckx .seatbar button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ckx .chamber{margin:10px 12px 0;border-radius:16px;background:radial-gradient(ellipse 80% 100% at 50% 100%,#2c4469,var(--felt) 70%);padding:10px 8px 8px;position:relative;box-shadow:inset 0 0 0 4px var(--wood),inset 0 0 0 6px var(--wood2),0 6px 18px rgba(20,48,92,.25)}
.ckx .chamber .cap{display:flex;justify-content:space-between;font:700 10px Georgia,serif;letter-spacing:.2em;color:#c9b38a;padding:2px 8px 0}
.ckx .hemi{position:relative;height:262px}
@media(max-width:560px){.ckx .hemi{height:212px}.ckx .chamber{padding:6px 4px}}
.ckx .chamber.shut .hemi,.ckx .chamber.shut .chlegend,.ckx .chamber.shut .withp{display:none}
.ckx .cap button{border:0;background:rgba(255,255,255,.12);color:#e8dcc3;border-radius:99px;padding:1px 8px;font:700 10px -apple-system,sans-serif;letter-spacing:0}
.ckx .withp{display:flex;gap:7px;align-items:center;justify-content:center;font-size:10.5px;color:#e8dcc3;padding:5px 6px 0}
.ckx .withp img{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--gold)}
.ckx .seat .wtag{position:absolute;left:-2px;top:-4px;background:var(--gold);color:var(--ink);font:800 8.5px -apple-system,sans-serif;border-radius:99px;padding:0 4px}
.ckx .shutbar{display:none;font-size:11px;color:#e8dcc3;padding:4px 6px}
.ckx .mini{display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:3px}
.ckx .mini img,.ckx .mini .me0{width:26px;height:26px;border-radius:50%;border:2.5px solid #c9b38a;object-fit:cover;background:#2c4469;display:grid;place-items:center;font-size:13px}
.ckx .mini .sf{border-color:var(--for)}
.ckx .mini .sa{border-color:var(--against)}
.ckx .mini .sb{border-color:var(--but)}
.ckx .mini .me0{border-color:var(--gold)}
.ckx .mini span{margin-left:auto;font-size:10.5px;color:#c9b38a}
.ckx .chamber.shut .shutbar{display:block}
.ckx .hemi svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.ckx .seat{position:absolute;transform:translate(-50%,-50%);width:58px;text-align:center;border:0;background:none;padding:0;color:#fff}
.ckx .seat .av{width:38px;height:38px;margin:0 auto;border-color:#c9b38a;display:block}
.ckx .seat .av.empty{border-style:dashed;background:rgba(255,255,255,.08);display:grid;place-items:center;font-size:16px;color:#c9b38a}
.ckx .seat .nm{font-size:10px;line-height:1.15;margin-top:2px;color:#e8dcc3;white-space:nowrap}
.ckx .seat .nm i{font-style:normal;opacity:.75}
.ckx .seat .ri{position:absolute;right:2px;top:-4px;width:19px;height:19px;border-radius:50%;background:var(--ivory);font-size:11px;display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.ckx .seat.me .av{border-color:var(--gold);box-shadow:0 0 0 3px rgba(255,200,97,.35)}
.ckx .seat.me .nm{color:var(--gold);font-weight:800}
.ckx .seat.speak .av{animation:ckspk .5s 3 alternate}
@keyframes ckspk{to{box-shadow:0 0 0 7px rgba(255,200,97,.45)}}
.ckx .plac{position:absolute;left:50%;bottom:calc(100% - 4px);transform:translateX(-50%) translateY(10px);opacity:0;transition:.4s cubic-bezier(.3,1.5,.5,1);pointer-events:none}
.ckx .plac b{display:block;font:900 9px/1.1 -apple-system,sans-serif;color:#fff;border-radius:3px;padding:2px 4px;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,.4)}
.ckx .plac::after{content:"";display:block;width:2px;height:5px;margin:0 auto;background:#c9b38a}
.ckx .plac.up{opacity:1;transform:translateX(-50%)}
.ckx .pf b{background:var(--for)}
.ckx .pa b{background:var(--against)}
.ckx .pb b{background:var(--but)}
.ckx .lect{position:absolute;left:50%;bottom:0;transform:translateX(-50%);text-align:center;width:112px}
.ckx .lect .av{width:34px;height:34px;margin:0 auto;border-color:#e8dcc3}
.ckx .lect .desk{margin-top:-4px;background:linear-gradient(var(--wood),var(--wood2));border-radius:6px 6px 2px 2px;color:#f3e6cc;font:700 9.5px/1.25 -apple-system,sans-serif;padding:4px 4px 3px}
.ckx .box{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);width:58px;height:44px;background:linear-gradient(#f3e6cc,#d9c6a0);border-radius:4px;box-shadow:0 4px 10px rgba(0,0,0,.4);display:none}
.ckx .box::before{content:"";position:absolute;left:12px;right:12px;top:5px;height:4px;border-radius:2px;background:#3a2a18}
.ckx .box::after{content:"BALLOT";position:absolute;left:0;right:0;bottom:6px;text-align:center;font:700 8px Georgia;letter-spacing:.15em;color:#5e3e25}
.ckx .box.on{display:block}
.ckx .chlegend{display:flex;gap:10px;justify-content:center;font-size:10px;color:#c9b38a;padding-top:4px;flex-wrap:wrap}
.ckx .chlegend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:3px;vertical-align:-1px}
.ckx .pg{margin:16px 12px 0;background:var(--paper);border-radius:6px 16px 16px 16px;box-shadow:0 4px 18px rgba(20,48,92,.12);padding:16px 14px;position:relative;border:1px solid var(--line)}
.ckx .pg::before{content:"";position:absolute;top:-8px;left:20px;width:66px;height:17px;background:rgba(255,200,97,.65);transform:rotate(-4deg)}
.ckx .when{font:italic 13px Georgia,serif;color:var(--soft)}
.ckx .task{font:900 22px/1.3 "Noto Serif SC",serif;color:var(--ink);margin:3px 0 0}
.ckx .taskEn{font:italic 16px Georgia,serif;color:var(--hot);margin:0 0 6px}
.ckx .why{font-size:13px;color:#5b6474;margin:0}
.ckx .hs{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding-top:12px;border-top:1.5px dashed var(--line)}
.ckx .hs .av{width:40px;height:40px}
.ckx .hs .b{flex:1;min-width:0}
.ckx .hs .who{font-size:11.5px;color:var(--soft)}
.ckx .hs .who b{color:var(--ink)}
.ckx .hs .ph{font-size:12px;color:var(--soft);font-style:italic;margin-top:2px}
.ckx .ln{display:flex;gap:8px;align-items:flex-start;background:#fff;border-radius:12px;padding:8px 10px;margin-top:6px;box-shadow:0 1px 4px rgba(20,48,92,.08)}
.ckx .pl{flex:none;width:24px;height:24px;border-radius:50%;border:0;background:var(--ink);color:#fff;font-size:9px;display:grid;place-items:center;margin-top:2px}
.ckx .pl.play{background:var(--hot);animation:ckpulse 1s infinite}
.ckx .ln .tx{flex:1;min-width:0}
.ckx .ln .t{font:700 15.5px/1.55 Georgia,"Noto Serif SC",serif;color:var(--ink);word-break:break-word}
.ckx .ln.zh .t{font:700 16px/1.5 "Noto Serif SC",serif}
.ckx .ln .g{font-size:12px;color:var(--soft);margin-top:1px}
.ckx .w{cursor:pointer;border-radius:3px;transition:background .15s}
.ckx .w:hover{background:#fff1d6}
.ckx .w.hit{background:var(--gold)}
.ckx .zw{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;margin:0 2px;line-height:1.25}
.ckx .zw .py{font:500 9px/1.1 -apple-system,sans-serif;color:#8a93a6;white-space:nowrap;letter-spacing:0}
.ckx .zw .hz{white-space:nowrap}
.ckx .zp{vertical-align:bottom}
.ckx u.bw{text-decoration:none;border-bottom:2px solid #f0b39f;border-radius:2px}
.ckx u.bw.got{border-bottom-color:var(--for);background:#e3f1ec}
.ckx .agenda{margin-top:12px;background:#fffef8;border:1.5px solid var(--line);border-radius:12px;padding:10px;background-image:repeating-linear-gradient(transparent 0 23px,#efe8d8 23px 24px)}
.ckx .agenda .q{font:900 15px/1.4 "Noto Serif SC",Georgia,serif;color:var(--ink);text-align:center;margin-bottom:8px}
.ckx .cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(max-width:560px){.ckx .cols{grid-template-columns:1fr}}
.ckx .col h5{margin:0 0 4px;font:900 12px Georgia,serif;letter-spacing:.12em;text-align:center;border-radius:6px;padding:2px;color:#fff}
.ckx .col.f h5{background:var(--for)}
.ckx .col.a h5{background:var(--against)}
.ckx .rs{display:block;width:100%;text-align:left;border:1.5px solid var(--line);background:#fff;border-radius:10px;padding:6px 8px;margin-top:5px;position:relative;transition:transform .12s;font-size:12.5px;line-height:1.4}
.ckx .rs .e{font:700 13.5px/1.45 Georgia,"Noto Serif SC",serif;color:var(--ink);display:block}
.ckx .rs .z{font-size:11.5px;color:var(--soft);display:block}
.ckx .rs .mk{position:absolute;inset:0;border-radius:9px;background:linear-gradient(100deg,rgba(255,214,90,.0),rgba(255,214,90,.55) 8%,rgba(255,214,90,.55) 92%,rgba(255,214,90,0));transform-origin:left;transform:scaleX(0);transition:transform .45s ease-out;pointer-events:none;mix-blend-mode:multiply}
.ckx .rs.on .mk{transform:scaleX(1)}
.ckx .rs.on{border-color:#e5b13a}
.ckx .rs:active{transform:scale(.97)}
.ckx .rs{padding-right:24px}
.ckx .rs .pen{position:absolute;right:5px;top:5px;font-size:11px;opacity:.45}
.ckx .rs.on .pen{opacity:1}
.ckx .deck{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;perspective:800px}
.ckx .rc{position:relative;height:96px;border:0;background:none;padding:0;transition:transform .15s}
.ckx .rc .in{position:absolute;inset:0;transition:transform .6s;transform-style:preserve-3d}
.ckx .rc.flip .in{transform:rotateY(180deg)}
.ckx .rc .fa,.ckx .rc .ba{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:10px;display:grid;place-items:center;text-align:center}
.ckx .rc .ba{background:var(--ink);background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0 6px,transparent 6px 12px);color:#c9b38a;font:italic 700 13px Georgia,serif;box-shadow:0 3px 8px rgba(20,48,92,.25);border:3px solid #fff}
.ckx .rc .fa{background:#fff;border:2px solid var(--ink);transform:rotateY(180deg);padding:4px;font-size:12px;color:var(--ink)}
.ckx .rc .fa .ic{font-size:26px;display:block;line-height:1.1}
.ckx .rc .fa b{display:block;font:900 12.5px "Noto Serif SC",Georgia,serif}
.ckx .rc.dim{opacity:.35}
.ckx .rc:active{transform:scale(.95)}
.ckx .rolecard{margin-top:12px;background:#fff;border:2px solid var(--ink);border-radius:14px;padding:12px;position:relative;animation:ckpop .45s cubic-bezier(.3,1.5,.5,1)}
@keyframes ckpop{from{transform:scale(.85);opacity:0}}
.ckx .rolecard .h{display:flex;align-items:center;gap:10px}
.ckx .rolecard .ic{font-size:34px}
.ckx .rolecard .nm{font:900 18px "Noto Serif SC",Georgia,serif;color:var(--ink)}
.ckx .rolecard .nm small{display:block;font:italic 13px Georgia,serif;color:var(--hot);font-weight:400}
.ckx .rolecard .wk{font-size:12.5px;color:#4b5566;margin-top:8px}
.ckx .rolecard .cares{font-size:12.5px;color:var(--ink);margin-top:4px;font-weight:700}
.ckx .rolecard .mask{position:absolute;right:10px;top:10px;font-size:10.5px;background:#f1ebdd;border-radius:99px;padding:1px 8px;color:var(--soft)}
.ckx .placs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
.ckx .pc{border:0;border-radius:10px;padding:10px 4px 8px;color:#fff;font-weight:900;font-size:13px;line-height:1.25;transition:transform .2s;position:relative;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.ckx .pc small{display:block;font-size:10.5px;font-weight:600;opacity:.85}
.ckx .pc.f{background:var(--for)}
.ckx .pc.a{background:var(--against)}
.ckx .pc.b{background:var(--but)}
.ckx .pc.on{transform:translateY(-8px) rotate(-2deg);box-shadow:0 10px 16px rgba(0,0,0,.25),0 0 0 3px var(--gold)}
.ckx .pc.off{opacity:.45}
.ckx .you{margin-top:16px;padding-top:12px;border-top:1.5px dashed var(--line)}
.ckx .yh{display:flex;align-items:center;gap:8px;font:900 16px "Noto Serif SC",serif;color:var(--ink)}
.ckx .yh .lvb{margin-left:auto;font:700 11px -apple-system,sans-serif;background:var(--ink);color:#fff;border-radius:99px;padding:2px 9px;white-space:nowrap}
.ckx .hint{font-size:12.5px;color:var(--soft);margin:3px 0 6px}
.ckx .opt{display:block;width:100%;text-align:left;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:6px 10px;margin-top:6px;transition:transform .12s}
.ckx .opt .t{font:700 15px/1.5 Georgia,"Noto Serif SC",serif;color:var(--ink)}
.ckx .opt .z{font-size:12px;color:var(--soft)}
.ckx .opt.on{border-color:var(--hot);background:#fff4ee}
.ckx .opt:active,.ckx .chip:active,.ckx .btn:active{transform:scale(.96)}
.ckx .tplbox{background:#fff;border-radius:12px;padding:9px 11px;font:700 15.5px/1.7 Georgia,"Noto Serif SC",serif;color:var(--ink);box-shadow:0 1px 4px rgba(20,48,92,.08)}
.ckx .slot{color:var(--hot);border-bottom:2.5px solid var(--hot);padding:0 2px}
.ckx .slot.empty{color:#d9a691}
.ckx .chl{font-size:11px;font-weight:800;color:var(--soft);margin-top:8px}
.ckx .chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}
.ckx .chip{border:1.5px solid var(--line);background:#fffdf8;border-radius:99px;padding:4px 11px;font-weight:700;color:var(--ink);font-size:13px;line-height:1.25;transition:transform .12s;text-align:left}
.ckx .chip small{display:block;font-size:10.5px;font-weight:500;color:var(--soft)}
.ckx .chip.on{background:var(--hot);color:#fff;border-color:var(--hot)}
.ckx .chip.on small{color:#ffe1d6}
.ckx .qbox{background:#f3eee2;border-radius:12px;padding:10px 12px;font:900 15px/1.5 "Noto Serif SC",serif;color:var(--ink)}
.ckx .qbox small{display:block;font:12.5px -apple-system,sans-serif;color:var(--soft);font-weight:400}
.ckx details.ref{margin-top:8px;font-size:12.5px;color:var(--soft)}
.ckx details.ref summary{cursor:pointer;color:var(--ink);font-weight:700}
.ckx .words{margin-top:10px;background:#fff;border-radius:12px;padding:8px 10px}
.ckx .words .wt{font-size:11px;font-weight:800;color:var(--ink);letter-spacing:.04em}
.ckx .words button{border:0;background:#f3eee2;border-radius:99px;padding:4px 10px;margin:5px 5px 0 0;font:700 13px Georgia,"Noto Serif SC",serif;color:var(--ink)}
.ckx .words button small{font:11px -apple-system,"PingFang SC",sans-serif;color:var(--soft);margin-left:4px;font-weight:400}
.ckx .words button.play{background:var(--gold)}
.ckx .mine{margin-top:12px;background:#fff;border-radius:14px;padding:12px;box-shadow:0 2px 10px rgba(20,48,92,.07);text-align:center}
.ckx .mine .lab{font-size:11px;font-weight:800;color:var(--hot);letter-spacing:.06em}
.ckx .mine .t{font:700 17px/1.55 Georgia,"Noto Serif SC",serif;color:var(--ink);margin-top:2px}
.ckx .mine .t.empty{color:#c3b89f;font-weight:400;font-style:italic;font-size:14px}
.ckx .sayrow{display:flex;justify-content:center;gap:14px;align-items:center;margin-top:10px}
.ckx .ear{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--line);background:#fff;font-size:18px}
.ckx .mic{width:62px;height:62px;border-radius:50%;border:0;background:var(--hot);color:#fff;font-size:25px;box-shadow:0 6px 16px rgba(226,85,47,.38)}
.ckx .mic.rec{animation:ckpulse 1s infinite}
.ckx .mic.ok{background:var(--for);box-shadow:0 6px 16px rgba(47,107,79,.35)}
.ckx .mic:disabled{opacity:.35}
@keyframes ckpulse{50%{box-shadow:0 0 0 13px rgba(226,85,47,.16)}}
.ckx .bars{height:20px;display:flex;justify-content:center;gap:3px;align-items:center;margin-top:6px}
.ckx .bars i{width:4px;height:4px;border-radius:2px;background:var(--hot);opacity:0}
.ckx .bars.on i{opacity:1;animation:ckbar .45s infinite alternate}
.ckx .bars i:nth-child(2n){animation-delay:.15s}
.ckx .bars i:nth-child(3n){animation-delay:.3s}
@keyframes ckbar{to{height:18px}}
.ckx .micnote{font-size:11px;color:#a49a86;margin-top:2px}
.ckx .gallery{background:#f3eee2;border-radius:12px;padding:10px 12px;font-size:13px;color:#4b5566}
.ckx .gallery b{color:var(--ink)}
.ckx .truth{margin-top:12px;background:#f3eee2;border-radius:10px;padding:9px 11px;font-size:12.5px;color:#4d5563}
.ckx .truth .k{font-weight:800;color:var(--ink);font-size:12px;letter-spacing:.03em}
.ckx .truth .src{display:block;font-size:11px;color:var(--soft);margin-top:3px;font-style:italic}
.ckx .warn{color:#a06a14;font-style:normal;font-weight:700}
.ckx .opp{display:block;width:100%;text-align:left;border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:9px 10px;margin-top:8px;transition:transform .12s}
.ckx .opp .h{display:flex;gap:8px;align-items:center;font-size:11.5px;color:var(--soft)}
.ckx .opp .h .av{width:30px;height:30px;border-width:1.5px}
.ckx .opp .h b{color:var(--ink);font-size:13px}
.ckx .opp.on{border-color:var(--gold);box-shadow:0 0 0 3px rgba(255,200,97,.4)}
.ckx .opp .ln{box-shadow:none;background:#faf6ec;margin-top:6px}
.ckx .thread{margin:8px 0 0 18px;padding-left:12px;border-left:2.5px solid var(--gold);font-size:12.5px;color:var(--soft)}
.ckx .ballot{margin-top:12px;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:12px;position:relative}
.ckx .ballot h5{margin:0;font:900 15px "Noto Serif SC",serif;color:var(--ink)}
.ckx .ballot .h{font-size:12px;color:var(--soft);margin:2px 0 6px}
.ckx .bx{display:flex;gap:6px;flex-wrap:wrap}
.ckx .bx button{flex:1 1 30%;border:1.5px solid var(--line);background:#fffdf8;border-radius:10px;padding:8px 6px;font-weight:800;color:var(--ink);font-size:13px;line-height:1.25;transition:transform .12s}
.ckx .bx button small{display:block;font-weight:500;font-size:10.5px;color:var(--soft)}
.ckx .bx button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ckx .bx button.on small{color:#cfd8ea}
.ckx .vl{display:flex;gap:9px;align-items:flex-start;width:100%;text-align:left;border:1.5px solid var(--line);background:#fffdf8;border-radius:12px;padding:7px 9px;margin-top:6px;transition:transform .12s}
.ckx .vl .av{width:28px;height:28px;border-width:1.5px;margin-top:2px}
.ckx .vl .t{flex:1;min-width:0;font:14px/1.45 Georgia,"Noto Serif SC",serif;color:var(--ink)}
.ckx .vl .t small{display:block;font:11px -apple-system,sans-serif;color:var(--soft)}
.ckx .vl .vg{display:none;font:11.5px -apple-system,"PingFang SC",sans-serif;color:var(--soft)}
.ckx .vl.on .vg{display:block}
.ckx .vl .t{font-size:13.5px}
.ckx .opp .h .btn{margin:0!important;flex:none}
.ckx .vl .st{font-size:18px;opacity:.25;flex:none}
.ckx .vl.on{border-color:var(--gold);background:#fff8e6}
.ckx .vl.on .st{opacity:1}
.ckx .vl.mine{opacity:.55;cursor:default}
.ckx-fx .slip{position:fixed;width:46px;height:30px;background:#fff;border:1.5px solid #c9b38a;border-radius:3px;z-index:9070;pointer-events:none;font:700 8px Georgia;color:var(--ink);display:grid;place-items:center;box-shadow:0 3px 8px rgba(0,0,0,.3);transition:transform .9s cubic-bezier(.5,0,.6,1),opacity .9s}
.ckx .btn{border:0;border-radius:99px;padding:11px 14px;font-weight:800;background:var(--hot);color:#fff;box-shadow:0 4px 12px rgba(226,85,47,.3);transition:transform .12s;font-size:14px}
.ckx .btn.ink{background:var(--ink);box-shadow:0 4px 12px rgba(20,48,92,.3)}
.ckx .btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);box-shadow:none}
.ckx .btn:disabled{opacity:.4}
.ckx .btn.wide{width:100%;margin-top:10px}
.ckx .env{margin-top:14px;position:relative;background:#f4ead2;border-radius:6px;padding:28px 14px 14px;text-align:center;box-shadow:0 6px 18px rgba(94,62,37,.25);overflow:hidden}
.ckx .env::before{content:"";position:absolute;left:0;right:0;top:0;height:50px;background:linear-gradient(160deg,#e9dab7 50%,transparent 50%) left/50% 100% no-repeat,linear-gradient(200deg,#e9dab7 50%,transparent 50%) right/50% 100% no-repeat;transition:transform .6s;transform-origin:top}
.ckx .env.open::before{transform:scaleY(-1)}
.ckx .env .seal{position:absolute;left:50%;top:26px;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:var(--hot);color:#fff;font:900 14px Georgia;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:.4s}
.ckx .env.open .seal{opacity:0;transform:translate(-50%,-50%) scale(1.6)}
.ckx .env .lab{font:700 10.5px Georgia,serif;letter-spacing:.22em;color:#8a6a3a;margin-top:12px}
.ckx .env .in{display:none;margin-top:8px;animation:ckpop .5s cubic-bezier(.3,1.5,.5,1)}
.ckx .env.open .in{display:block}
.ckx .env .q{font:italic 700 17px/1.45 Georgia,"Noto Serif SC",serif;color:var(--ink)}
.ckx .env .by{font-size:12px;color:var(--soft);margin-top:4px}
.ckx .env .envnote{font-size:11.5px;color:#7a6a4a;margin-top:8px;text-align:left;background:rgba(255,255,255,.5);border-radius:8px;padding:6px 8px}
.ckx .badge{margin:12px auto 0;width:150px;height:150px;border-radius:50%;border:4px double var(--hot);color:var(--hot);display:grid;place-items:center;text-align:center;transform:rotate(-8deg);background:rgba(255,255,255,.6);font:900 12px/1.3 Georgia,"Noto Serif SC",serif;padding:10px}
.ckx .badge big{display:block;font-size:30px;line-height:1}
.ckx .badge small{display:block;font:700 10px Georgia;letter-spacing:.12em}
.ckx .folder{margin-top:14px;border:0;width:100%;text-align:left;padding:0;background:none}
.ckx .folder .tab{display:inline-block;background:#d9c08a;border-radius:8px 8px 0 0;padding:4px 14px;font:700 11px Georgia,serif;letter-spacing:.15em;color:#5e3e25}
.ckx .folder .body{background:#e8d3a2;border-radius:0 12px 12px 12px;padding:12px;box-shadow:0 6px 16px rgba(94,62,37,.25);color:#3a2a18}
.ckx .folder .cover{font:900 16px "Noto Serif SC",serif;display:flex;justify-content:space-between;align-items:center;gap:8px}
.ckx .folder .cover span{font:600 12px -apple-system,sans-serif;color:#7a5a2a;white-space:nowrap}
.ckx .folder .docs{display:none;margin-top:10px}
.ckx .folder.open .docs{display:block}
.ckx .doc{background:#fffdf7;border-radius:6px;padding:9px 11px;margin-top:8px;box-shadow:0 2px 5px rgba(0,0,0,.12);font-size:13px;color:#2e3846;animation:ckpop .45s cubic-bezier(.3,1.5,.5,1) backwards}
.ckx .doc:nth-child(2){animation-delay:.12s}
.ckx .doc:nth-child(3){animation-delay:.24s}
.ckx .doc:nth-child(4){animation-delay:.36s}
.ckx .doc .k{font:800 11px -apple-system,sans-serif;color:var(--for);letter-spacing:.05em}
.ckx .doc .src{display:block;font-size:11px;color:var(--soft);font-style:italic;margin-top:3px}
.ckx .doc.honest{background:#fff8e6}
.ckx .doc.honest .k{color:#a06a14}
.ckx .wh{padding:20px 14px 2px;display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.ckx .wh h3{margin:0;font:900 16px "Noto Serif SC",serif;color:var(--ink)}
.ckx .wh span{font-size:11px;color:var(--soft)}
.ckx .row{display:flex;gap:10px;overflow-x:auto;padding:8px 12px 8px;scroll-snap-type:x mandatory}
.ckx .row::-webkit-scrollbar{height:0}
.ckx .card{flex:none;width:220px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 11px;scroll-snap-align:start;position:relative}
.ckx .card .who{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--soft)}
.ckx .card .who b{color:var(--ink);font-size:13px;display:block;line-height:1.1}
.ckx .card .who .av{width:32px;height:32px;border-width:1.5px}
.ckx .card .z{font-size:12.5px;color:#4b5566;margin-top:6px}
.ckx .card .ln{box-shadow:none;background:#faf6ec;padding:6px 8px}
.ckx .card .ln .t{font-size:14px}
.ckx .card .cb{display:flex;gap:6px;margin-top:8px}
.ckx .card .cb button{border:0;background:#f3eee2;color:var(--ink);border-radius:99px;padding:4px 10px;font-size:12px;font-weight:700}
.ckx .card .cb button.on{background:var(--gold)}
.ckx .rolet{position:absolute;right:9px;top:9px;font-size:10px;color:var(--soft)}
.ckx .rules{margin:6px 12px 0;font-size:11px;color:#6b5a2e;background:#fff8e6;border:1px dashed #d9b86a;border-radius:10px;padding:4px 9px;line-height:1.45}
.ckx .acc{margin-top:10px;border:1.5px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.ckx .acc>.ah{display:flex;align-items:center;gap:8px;width:100%;border:0;background:#faf6ec;padding:9px 12px;font:900 14.5px "Noto Serif SC",serif;color:var(--ink);text-align:left}
.ckx .acc>.ah small{margin-left:auto;font:700 11px -apple-system,sans-serif;color:var(--soft)}
.ckx .acc>.ah .ok{color:var(--for)}
.ckx .acc.lock>.ah{opacity:.5}
.ckx .acc .ab{padding:0 10px 10px}
.ckx .acc .ballot{border:0;padding:8px 2px 2px;margin-top:0}
.ckx .haul{margin-top:14px;background:var(--ink);color:#fff;border-radius:14px;padding:11px 12px}
.ckx .haul .bh{font:900 15px "Noto Serif SC",serif;color:#ffd27a;display:flex;justify-content:space-between;align-items:baseline;gap:6px}
.ckx .haul .bh small{font:600 11px -apple-system,sans-serif;color:#cfd6e4}
.ckx .haul .sub{font-size:11.5px;color:#cfd6e4;margin:2px 0 6px}
.ckx .hrow{display:flex;flex-wrap:wrap;gap:6px}
.ckx .hc{border:0;background:#fbf7ee;color:var(--ink);border-radius:9px;padding:5px 8px;font:700 13px/1.3 Georgia,"Noto Serif SC",serif;text-align:left;border:2px dashed transparent}
.ckx .hc i{display:block;font:500 10.5px -apple-system,sans-serif;color:var(--soft);font-style:normal}
.ckx .hc.used{border-color:var(--hot)}
.ckx .hc.got{border-color:#9fcfbf}
.ckx .hc.no{opacity:.75}
.ckx .hmine{background:#fbf7ee;color:var(--ink);border-radius:9px;padding:6px 9px;font:14px/1.45 Georgia,"Noto Serif SC",serif;margin-bottom:7px}
.ckx-fx .pop .bwrow{margin-top:7px;padding-top:6px;border-top:1px dashed var(--line);font-size:12px;color:var(--soft)}
.ckx-fx .pop .bwrow b{display:block;font:700 14px Georgia,"Noto Serif SC",serif;color:var(--ink)}
.ckx-fx .pop .bwrow button{margin-top:5px;border:0;background:#ffd27a;border-radius:99px;padding:3px 10px;font:800 12px -apple-system,sans-serif;color:var(--ink)}
.ckx .next{margin:16px 12px 0;border:1.5px dashed #c9b38a;border-radius:14px;padding:12px 14px;display:flex;gap:12px;align-items:center;cursor:pointer;background:#fffaf0}
.ckx .next .lk{font-size:26px}
.ckx .next b{color:var(--ink);font:900 15px "Noto Serif SC",serif;display:block}
.ckx .next span{font-size:12.5px;color:var(--soft)}
.ckx .next.shake{animation:ckwig .4s}
@keyframes ckwig{25%{transform:rotate(-2deg)}75%{transform:rotate(2deg)}}
.ckx-fx .toast{position:fixed;top:14px;left:50%;transform:translate(-50%,-30px);opacity:0;background:var(--ink);color:#fff;font-weight:800;padding:7px 14px;border-radius:99px;transition:.3s;z-index:9060;font-size:13px;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis}
.ckx-fx .toast.on{opacity:1;transform:translate(-50%,0)}
.ckx-fx .buddy{position:fixed;left:12px;right:12px;bottom:12px;display:flex;gap:9px;align-items:center;background:#fff;color:#24303a;border-radius:16px;padding:9px 11px;box-shadow:0 10px 30px rgba(20,48,92,.35);font-size:13px;transform:translateY(150%);transition:transform .35s cubic-bezier(.3,1.4,.5,1);z-index:9055;border:1.5px solid var(--line)}
.ckx-fx .buddy.on{transform:none}
.ckx-fx .buddy b{color:var(--ink)}
.ckx-fx .buddy .e{font:italic 14px Georgia,"Noto Serif SC",serif;color:var(--hot);display:block}
.ckx-fx .stamp{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0;border:4px double var(--hot);color:var(--hot);border-radius:12px;padding:8px 14px;font:900 19px/1.2 Georgia,"Noto Serif SC",serif;text-align:center;background:rgba(251,247,238,.95);pointer-events:none;z-index:9058;white-space:nowrap}
.ckx-fx .stamp small{display:block;font:700 11px Georgia,serif;letter-spacing:.08em}
.ckx-fx .stamp.go{animation:ckstp .5s forwards}
@keyframes ckstp{to{opacity:1;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}
.ckx-fx .cf{position:fixed;top:-12px;width:8px;height:12px;z-index:9057;animation:ckfall 2.4s ease-in forwards;pointer-events:none}
@keyframes ckfall{to{transform:translateY(900px) rotate(720deg)}}
.ckx-fx .note{position:fixed;z-index:9056;font:900 18px Georgia;color:var(--hot);pointer-events:none;animation:cknt 1s ease-out forwards}
@keyframes cknt{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-40px)}}
.ckx-fx .pop{position:fixed;z-index:9090;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(20,48,92,.3);padding:10px 12px;width:230px;border:1.5px solid var(--line);display:none}
.ckx-fx .pop.on{display:block;animation:ckpop .25s}
.ckx-fx .pop .w0{font:900 22px Georgia,"Noto Serif SC",serif;color:var(--ink);display:flex;align-items:center;gap:8px}
.ckx-fx .pop .w0 button{border:0;background:var(--ink);color:#fff;border-radius:50%;width:28px;height:28px;font-size:13px;flex:none}
.ckx-fx .pop .py{font:600 13px -apple-system,sans-serif;color:var(--hot)}
.ckx-fx .pop .m{font-size:13.5px;color:#2e3846;margin-top:2px}
.ckx-fx .pop .ln2{font-size:11.5px;color:var(--soft);margin-top:6px;border-top:1px dashed var(--line);padding-top:5px}
@media(max-width:560px){.ckx .words{display:flex;flex-wrap:nowrap;overflow-x:auto;align-items:center;gap:5px}.ckx .words::-webkit-scrollbar,.ckx .hrow::-webkit-scrollbar{height:0}.ckx .words .wt{flex:none;max-width:64px;line-height:1.2}.ckx .words button{flex:none;margin:0}.ckx .hrow{flex-wrap:nowrap;overflow-x:auto}.ckx .hc{flex:none}.ckx .vl:not(.on) .t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ckx .vl:not(.on) .t small{display:none}.ckx .vl{padding:5px 8px;margin-top:5px}.ckx .opp{padding:7px 8px;margin-top:6px}.ckx .ballot{padding:9px}.ckx .why,.ckx .hs .who,.ckx .haul .sub,.ckx .card .ln .g,.ckx .mine .lab{display:none}.ckx .rs:not(.on) .z{display:none}.ckx .mine{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px 8px;text-align:left}.ckx .mine .t{grid-column:1;font-size:15px}.ckx .mine .sayrow{grid-column:2;grid-row:1/3;margin:0;gap:8px}.ckx .mine .bars{grid-column:1;justify-content:flex-start}.ckx details.truth summary{cursor:pointer}.ckx .mast .k,.ckx .mast .sub{display:none}.ckx .micnote{display:none}.ckx .mic{width:52px;height:52px;font-size:21px}.ckx .ear{width:38px;height:38px}.ckx .mine{padding:8px;margin-top:8px}.ckx .sayrow{margin-top:6px}.ckx .bars{height:12px;margin-top:3px}.ckx .words{padding:6px 8px;margin-top:6px}.ckx .truth{padding:7px 9px}.ckx .hs{margin-top:9px;padding-top:9px}.ckx .hs .av{width:32px;height:32px}.ckx .you{margin-top:12px;padding-top:9px}.ckx .opt{padding:5px 9px;margin-top:5px}.ckx .rs{padding:5px 24px 5px 8px;margin-top:4px}.ckx .agenda{padding:8px}.ckx .wh{padding-top:14px}.ckx .mast{padding:10px 8px 6px}.ckx .mast .t{font-size:24px}.ckx .mast .zt{font-size:15px}.ckx .pg{padding:13px 11px}.ckx .task{font-size:19px}.ckx .card{width:200px}.ckx .next{padding:9px 12px}.ckx .hs .ph{display:none}}
@media(max-width:900px){.ckx-fx .toast,.ckx-fx .buddy,.ckx-fx .stamp{position:fixed}.ckx-fx .toast{top:16px}.ckx-fx .buddy{left:12px;right:12px;bottom:14px;max-width:420px;margin:0 auto}}
@media(max-width:440px){.ckx .seat .nm i{display:none}.ckx .seat.me .nm i{display:inline}.ckx .lect{width:96px}}
@media(max-width:380px){.ckx .seat{width:50px}.ckx .seat .av{width:34px;height:34px}.ckx .seat .nm{font-size:9px}.ckx .mast .t{font-size:26px}}
.ckx{border-radius:18px;padding:0 0 18px;margin:12px 0 0;overflow:hidden;background:var(--ivory)}
.ckx-fx{font:15px/1.55 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;color:#24303a}
.ckx-fx .buddy{max-width:420px;margin:0 auto}
.ckx-fx .buddy .av{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;border:2px solid var(--ink);background:#d8cfbd}
.ckx .next.lockd{cursor:default}
.ckx .closing{margin-top:12px;background:#fff8e6;border:1px dashed #d9b86a;border-radius:12px;padding:9px 11px}.ckx .closing .lab{font-weight:800;color:var(--ink);font-size:13px}
.ckx .chip{max-width:100%;white-space:normal;overflow-wrap:anywhere}
html[dir=rtl] .ckx :is(div,p,li,h3,h4,h5,label,summary,small),html[dir=rtl] .ckx-fx :is(div,small){unicode-bidi:plaintext;text-align:start}
.ckx .lvrow{margin:4px 0 8px}
.ckx .ck-mic{margin-top:8px}
@media(max-width:700px){.ckx{margin:10px 0 0;border-radius:0}}
`;
})();

/* world_feed.js */
// 📺 刷世界（2026-11-11，样板 样板/刷世界样板.html，用户：「我的设想是能让用户在这个软件一天停留两个小时」「可以，放进软件」）
// 一屏一条往上刷：真实街头短片（门头短片 ISLE_CLIPS，学中文的先放中国的）+ 要学的语言的字幕（每个词能点：拼音 / 🔊 / 收进复习）
// 中间穿插：朋友页的人的动态（配 TA 自己的声音）、学中文/英语的人送给世界的真声音（Supabase linevoices，有人送才有）、每八条一张活动卡。
// 右边：❤️ 收进复习（feed.v1，template2 的 revPool 读它）· 🐢 慢慢再听 · 🎤 跟着说。顶上「今天听了几分钟、几句」，只给自己看，不设目标、不断签。
// 对外：window.WFEED = {open, card}；地址 #feed 直接打开。
(function(){
const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch(e){ return null; } };
const H = () => window.HVI || {};
const UI = () => (document.documentElement.lang || "zh").slice(0, 2), ZH = () => UI() === "zh";
const LZ = () => (H().LEARN || "en") === "zh";
const T = (zh, en) => ZH() ? zh : en;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ST = () => { const o = ls("feed.v1") || {}; o.saved = o.saved || []; if (o.day !== today()){ o.day = today(); o.secs = 0; o.lines = 0; } return o; };
const SAVE = o => { ls("feed.v1", o); try { window.hvSyncMark && window.hvSyncMark("feed.v1"); } catch(e){} };
const lang = () => LZ() ? "zh-CN" : "en-GB";
let AU = null;
function speak(t, rate, url){ try { speechSynthesis.cancel(); } catch(e){} if (AU){ AU.pause(); AU = null; }
  if (url){ AU = new Audio(url); AU.playbackRate = rate && rate < .9 ? .8 : 1; AU.play().catch(() => tts(t, rate)); return; } tts(t, rate); }
function tts(t, rate){ try { const u = new SpeechSynthesisUtterance(t); u.lang = lang(); u.rate = rate || .95; speechSynthesis.speak(u); } catch(e){} }
const blip = k => { try { if (localStorage.getItem("hv.sound") === "off") return; const A = window.AudioContext || window.webkitAudioContext; const ac = blip.ac || (blip.ac = new A()), o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = k === "ok" ? 880 : 660; g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(.08, ac.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .12); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .14); } catch(e){} };

// ── 内容 ──
const day0 = Math.floor(Date.now() / 864e5);
const shuffle = (A, seed) => { const a = A.slice(); let s = seed || 1; for (let i = a.length - 1; i > 0; i--){ s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function clips(){ const C = typeof ISLE_CLIPS !== "undefined" ? ISLE_CLIPS : {}, out = [], seen = new Set();
  for (const k in C) (C[k] || []).forEach(c => { const t = c.cap && (LZ() ? c.cap.zh : c.cap.en); if (!t || !c.src || seen.has(c.src) || c.ok === false) return; seen.add(c.src);
    out.push({k: "clip", src: c.src, poster: c.poster, t, m: LZ() ? c.cap.en : c.cap.zh, where: c.where ? (ZH() ? c.where.zh : c.where.en) : "", cn: /^(CN|TW|HK)$/.test(c.country || "")}); });
  const A = shuffle(out, day0), cn = A.filter(x => x.cn), rest = A.filter(x => !x.cn);
  return LZ() ? cn.concat(rest) : A; }   // 学中文的人先刷中国的
function posts(){ const D = window.PTAB; if (!D || !D.posts) return []; const out = [], t = today();
  for (const id in D.posts){ const p = (D.people || {})[id] || {}, pl = p.learn || (/^(shanghai|beijing|chengdu|guangzhou)\./.test(id) ? "zh" : "en"); if ((pl === "zh") !== LZ()) continue;
    const I = (window.PTAB_INFO && window.PTAB_INFO(id)) || {}; if (!I.nm) continue;
    (D.posts[id] || []).forEach(x => { if (!x || !x[4] || (x[12] && x[12] > t)) return; out.push({k: "post", id, nm: I.nm, img: I.img || "", home: I.home || "", job: I.job || "", t: x[4], m: x[5] || "", ph: x[3] && x[3][0] ? `https://images.pexels.com/photos/${x[3][0]}/pexels-photo-${x[3][0]}.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop` : "", city: x[2] || "", d: x[12] || ""}); }); }
  const mine = new Set(); try { (window.PTAB_KNOWN ? PTAB_KNOWN() : []).forEach(p => mine.add(p.id)); const J = (ls("act.v1") || {}).j || {}; (window.ACTS || []).forEach(a => { if (J[a.id]) mine.add(a.host); }); } catch(e){}
  const S = shuffle(out.sort((a, b) => (b.d || "").localeCompare(a.d || "")).slice(0, 80), day0 + 7);
  return S.filter(x => mine.has(x.id)).concat(S.filter(x => !mine.has(x.id))); }
function acts(){ try { return (window.ACT && ACT.list ? ACT.list() : []).filter(a => !(((ls("act.v1") || {}).j || {})[a.id])); } catch(e){ return []; } }
let VOICES = [];
async function loadVoices(){ try { const sb = typeof HV !== "undefined" && HV.sb; if (!sb) return; const r = await sb.from("docs").select("id,owner,data").eq("coll", "linevoices").eq("data->>l", LZ() ? "zh" : "en").order("created_at", {ascending: false}).limit(30);
  VOICES = (r.data || []).filter(x => x.data && x.data.hid !== true && (x.data.url || x.data.a) && (x.data.t || x.data.heard)).map(x => ({k: "voice", nm: (x.data.nm || "").trim() || T("一位朋友", "Someone"), t: x.data.t || x.data.heard, url: x.data.url || "", a: x.data.a, mime: x.data.mime})); } catch(e){} }
let Q = [], qi = 0;
function build(){ const C = clips(), P = posts(), A = acts(); const out = []; let ci = 0, pi = 0, ai = 0, vi = 0;
  for (let n = 0; n < 60 && (ci < C.length || pi < P.length); n++){
    if (n % 8 === 7 && A.length){ out.push({k: "act", a: A[ai++ % A.length]}); continue; }
    if (n % 6 === 5 && VOICES.length){ out.push(VOICES[vi++ % VOICES.length]); continue; }
    if (n % 4 === 3 && pi < P.length){ out.push(P[pi++]); continue; }
    if (ci < C.length) out.push(C[ci++]); else if (pi < P.length) out.push(P[pi++]); }
  return out; }

// ── 字幕：每个词能点 ──
function toks(t){ if (!LZ()) return t.split(/(\s+)/).map(w => /\w/.test(w) ? {w, p: ""} : {w, sp: 1});
  const P = window.pinyinPro; let words = null; try { words = P && P.segment ? P.segment(t) : null; } catch(e){ words = null; }
  if (words && words.length) return words.map(x => /[一-鿿]/.test(x.origin) ? {w: x.origin, p: x.result} : {w: x.origin, sp: 1});
  return [...t].map(ch => /[一-鿿]/.test(ch) ? {w: ch, p: (() => { try { return P ? P.pinyin(ch) : ""; } catch(e){ return ""; } })()} : {w: ch, sp: 1}); }
const capHtml = t => toks(t).map(x => x.sp ? `<span>${esc(x.w)}</span>` : `<span class="wf-w" data-w="${esc(x.w)}">${LZ() && x.p ? `<small>${esc(x.p)}</small>` : ""}${esc(x.w)}</span>`).join("");

// ── 画一张卡 ──
const rail = x => `<div class="wf-rail">${x && x.k === "post" ? `<button data-wp="${esc(x.id)}">💬</button><small>${T("回 TA", "Reply")}</small>` : ""}<button data-wl title="Save">❤️</button><small>${T("收藏", "Save")}</small><button data-ws>🐢</button><small>${T("慢放", "Slow")}</small><button data-we>🎤</button><small>${T("跟着说", "Say it")}</small></div>`;
const face = (img, nm) => img ? `<img src="${esc(img)}" alt="">` : `<span class="wf-av">${esc((nm || "?")[0])}</span>`;
function cardHtml(x, i){
  if (x.k === "clip") return `<div class="wf-c" data-i="${i}"><video src="${esc(x.src)}" poster="${esc(x.poster || "")}" muted loop playsinline preload="none"></video><div class="wf-sh"></div>${x.where ? `<span class="wf-where">📍 ${esc(x.where)}</span>` : ""}<div class="wf-cap" data-nopy><div class="wf-t">${capHtml(x.t)}</div><div class="wf-m">${esc(x.m || "")}</div></div>${rail(x)}</div>`;
  if (x.k === "post") return `<div class="wf-c" data-i="${i}"><div class="wf-post"><button class="wf-who wf-pp" data-wp="${esc(x.id)}">${face(x.img, x.nm)}<span>${esc(x.nm)}<br><small>${esc([x.job, x.home].filter(Boolean).join(" · "))}${x.job || x.home ? " · " : ""}🎭 ${T("角色", "character")}</small></span><em>${T("TA 的主页", "Profile")} ›</em></button>${x.ph ? `<div class="wf-ph" style="background-image:url('${esc(x.ph)}')"></div>` : ""}<div class="wf-cap2" data-nopy><div class="wf-t">${capHtml(x.t)}</div><div class="wf-m">${esc(x.m)}</div></div></div>${rail(x)}</div>`;
  if (x.k === "voice") return `<div class="wf-c" data-i="${i}"><div class="wf-voice"><div class="wf-who" style="justify-content:center">${face("", x.nm)}<span>${esc(x.nm)}<br><small>${T("送给世界的 · 真人的声音", "sent to the world · real voice")}</small></span></div><div class="wf-wave">${Array.from({length: 18}, (_, k) => `<i style="height:${18 + (k * 37 % 40)}px;animation-delay:${k * .05}s"></i>`).join("")}</div><div class="wf-cap2" data-nopy><div class="wf-t">${capHtml(x.t)}</div></div><button class="wf-btn" data-wv>▶ ${T("听 TA 说", "Hear them")}</button></div>${rail()}</div>`;
  const a = x.a, nm = (window.PTAB_INFO && window.PTAB_INFO(a.host) || {}).nm || "";
  return `<div class="wf-c" data-i="${i}"><div class="wf-act" style="background-image:url('${esc(/^https?:/.test(a.pic || "") ? a.pic : "https://img.heyvoyo.com/npc/" + (a.pic || "") + ".webp")}')"><div class="wf-box"><small>🎪 ${T("活动", "Activity")} · ${a.days} ${T("天", a.days === 1 ? "day" : "days")}${nm ? " · " + esc(nm) : ""}</small><h3>${esc(T(a.t.zh, a.t.en))}</h3><button class="wf-btn" data-wa="${esc(a.id)}">${T("去看看", "Take a look")} →</button></div></div></div>`; }

// ── 页面 ──
let pg = null, io = null, tick = null;
function mount(){ if (!document.getElementById("wfCss")){ const s = document.createElement("style"); s.id = "wfCss"; s.textContent = CSS; document.head.appendChild(s); }
  if (!pg){ pg = document.createElement("div"); pg.id = "wfPg"; pg.dataset.nopy = ""; pg.hidden = true; document.body.appendChild(pg); } }
function earTxt(){ const o = ST(); return `👂 ${Math.floor((o.secs || 0) / 60)} min · ${o.lines || 0} ${T("句", "lines")}`; }
function add(n){ const feed = pg.querySelector(".wf-feed"), start = qi; let h = ""; for (let k = 0; k < n && Q.length; k++){ const x = Q[qi % Q.length]; h += cardHtml(x, qi); qi++; } feed.insertAdjacentHTML("beforeend", h);
  feed.querySelectorAll(".wf-c").forEach(c => { if (+c.dataset.i >= start) io.observe(c); }); }
async function open(){ mount();
  if (LZ() && !window.pinyinPro && H().loadPinyin){ try { await Promise.race([H().loadPinyin(), new Promise(r => setTimeout(r, 2500))]); } catch(e){} }
  Q = build(); qi = 0; if (!Q.length) return;
  pg.innerHTML = `<div class="wf-top"><button class="wf-x" data-wx>✕</button><b>${T("刷世界", "Watch the world")}</b><span class="wf-ear">${earTxt()}</span></div><div class="wf-feed"></div><div class="wf-sheet"></div><div class="wf-toast"></div>`;
  pg.hidden = false; document.body.classList.add("wf-on"); const feed = pg.querySelector(".wf-feed");
  io = new IntersectionObserver(es => es.forEach(e => { const v = e.target.querySelector("video"), x = Q[+e.target.dataset.i % Q.length];
    if (e.isIntersecting){ if (v){ v.preload = "auto"; v.play().catch(() => {}); } if (!e.target._seen){ e.target._seen = 1; const o = ST(); o.lines = (o.lines || 0) + 1; SAVE(o); pg.querySelector(".wf-ear").textContent = earTxt(); }
      if (x && x.k !== "act" && x.k !== "voice") setTimeout(() => { if (e.target.getBoundingClientRect().top < 40 && e.target.getBoundingClientRect().top > -40) speak(x.t, .95, x.k === "post" && window.hvVoiceUrl ? window.hvVoiceUrl(x.t) : ""); }, 500);
      if (+e.target.dataset.i >= qi - 3) add(10); }
    else if (v) v.pause(); }), {root: feed, threshold: .6});
  feed.addEventListener("scroll", () => { const sh = pg.querySelector(".wf-sheet.on"); if (sh) sh.classList.remove("on"); }, {passive: true});
  add(12); clearInterval(tick); tick = setInterval(() => { if (pg.hidden || document.hidden) return; const o = ST(); o.secs = (o.secs || 0) + 5; SAVE(o); const e = pg.querySelector(".wf-ear"); if (e) e.textContent = earTxt(); }, 5000);
  try { window.hvPulse && window.hvPulse("act"); } catch(e){}
  if (!VOICES.length) loadVoices().then(() => { if (VOICES.length){ const more = build().filter(x => x.k === "voice"); if (more.length) Q.splice(Math.min(Q.length, qi + 2), 0, ...more.slice(0, 3)); } });
  pg.onclick = onClick; }
function close(){ if (!pg) return; pg.hidden = true; document.body.classList.remove("wf-on"); clearInterval(tick); try { io && io.disconnect(); } catch(e){} if (AU){ AU.pause(); AU = null; } try { speechSynthesis.cancel(); } catch(e){} pg.querySelectorAll("video").forEach(v => v.pause());
  if (location.hash === "#feed") history.replaceState(null, "", location.pathname + location.search); }
const toast = t => { const el = pg.querySelector(".wf-toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 1500); };
function saveLine(x, word){ const o = ST(), key = (word || "") + "|" + x.t; if (!o.saved.find(s => s.key === key)){ o.saved.push({key, t: word || x.t, m: word ? x.t : (x.m || ""), at: Date.now()}); if (o.saved.length > 500) o.saved.shift(); SAVE(o); } blip("ok"); toast(T("❤️ 收进复习了，过几天会回来", "❤️ Saved — it'll come back in review")); }
function onClick(e){ if (e.target.closest("[data-wx]")){ close(); return; }
  const sh = pg.querySelector(".wf-sheet"); if (!e.target.closest(".wf-sheet")) sh.classList.remove("on");
  const card = e.target.closest(".wf-c"); if (!card) return; const x = Q[+card.dataset.i % Q.length]; if (!x) return;
  const w = e.target.closest(".wf-w"); if (w){ const word = w.dataset.w; speak(word, .7); blip();
    let py = ""; try { py = LZ() && window.pinyinPro ? pinyinPro.pinyin(word) : ""; } catch(_){}
    sh.innerHTML = `<div><span class="wf-big">${esc(word)}</span><span class="wf-py">${esc(py)}</span></div><div class="wf-in">${T("在这句里：", "In: ")}${esc(x.t)}${x.m ? `<br><small>${esc(x.m)}</small>` : ""}</div><div class="wf-row"><button data-sv>❤️ ${T("收进复习", "Save to review")}</button><button data-ag>🔊 ${T("再听", "Again")}</button></div>`;
    sh.classList.add("on"); sh.querySelector("[data-sv]").onclick = ev => { ev.stopPropagation(); w.classList.add("saved"); sh.classList.remove("on"); saveLine(x, word); }; sh.querySelector("[data-ag]").onclick = ev => { ev.stopPropagation(); speak(word, .6); }; return; }
  if (e.target.closest("[data-wp]")){ const id = e.target.closest("[data-wp]").dataset.wp; close(); try { window.HVI && HVI.ptOpen && HVI.ptOpen(); } catch(_){} setTimeout(() => window.PTAB_PERSON && window.PTAB_PERSON(id), 60); return; }
  if (e.target.closest("[data-wl]")){ e.target.closest("[data-wl]").classList.add("on"); saveLine(x); return; }
  if (e.target.closest("[data-ws]")){ speak(x.t, .6, x.k === "voice" ? x.url : ""); toast("🐢 …"); return; }
  if (e.target.closest("[data-wv]")){ const v = card.querySelector(".wf-voice"); v.classList.add("play"); let u = x.url; if (!u && x.a){ try { const b = atob(x.a), a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); u = URL.createObjectURL(new Blob([a], {type: x.mime || "audio/webm"})); } catch(_){} } speak(x.t, 1, u); setTimeout(() => v.classList.remove("play"), 3000); return; }
  if (e.target.closest("[data-wa]")){ const id = e.target.closest("[data-wa]").dataset.wa; close(); try { ACT.open(id); } catch(_){} return; }
  if (e.target.closest("[data-we]")){ const b = e.target.closest("[data-we]"), h = H(); if (b.classList.contains("rec")) return;
    if (!h.recStart || !h.canRec){ toast(T("这台设备开不了话筒", "No microphone here")); return; }
    b.classList.add("rec"); toast(T("🎤 说吧……", "🎤 Your turn…")); let txt = "";
    h.recStart({lang: lang(), onText: t => { txt = t; }, onDone: v => { b.classList.remove("rec"); const said = (v && v.text) || txt; blip("ok"); toast(said ? "✓ “" + said.slice(0, 40) + "”" : T("没听清，再来一次？", "Didn't catch that — again?")); }, onError: () => { b.classList.remove("rec"); toast(T("话筒打不开", "Can't open the mic")); }}).then(hd => { if (hd) setTimeout(() => hd.stop && hd.stop(), 6000); else b.classList.remove("rec"); }); return; } }
// 「活动」那一栏最上面的入口
function card(){ const c = clips()[0]; if (!c) return ""; mount();
  return `<button class="wf-entry" data-wfopen><video src="${esc(c.src)}" poster="${esc(c.poster || "")}" muted loop playsinline autoplay preload="metadata"></video><span class="wf-eg"></span><span class="wf-et"><b>▶ ${T("有空刷一会儿", "Got a minute? Watch the world")}</b><small>${LZ() ? T("真实的中国街头，中文字幕，每个词都能点", "Real streets in China, Chinese subtitles — tap any word") : T("真实的街头，英文字幕，每个词都能点", "Real streets, English subtitles — tap any word")}</small></span></button>`; }
document.addEventListener("click", e => { const b = e.target.closest("[data-wfopen]"); if (b){ e.preventDefault(); open(); } });
if (location.hash === "#feed") setTimeout(open, 1800);
window.addEventListener("hashchange", () => { if (location.hash === "#feed") open(); });
window.WFEED = {open, close, card, isOpen: () => !!(pg && !pg.hidden)};

const CSS = `#wfPg{position:fixed;inset:0;z-index:62;background:#000;color:#fff}body.wf-on{overflow:hidden}
.wf-top{position:absolute;left:0;right:0;top:0;z-index:5;display:flex;gap:10px;align-items:center;padding:12px 14px;pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,.6)}.wf-top b{flex:1}
.wf-x{pointer-events:auto;border:0;background:rgba(0,0,0,.4);color:#fff;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer}.wf-ear{background:rgba(0,0,0,.4);border-radius:99px;padding:3px 10px;font-size:12px}
.wf-feed{position:absolute;inset:0;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none}.wf-feed::-webkit-scrollbar{display:none}
.wf-c{height:100%;height:100dvh;scroll-snap-align:start;position:relative;overflow:hidden;max-width:560px;margin:0 auto}
.wf-c video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.wf-sh{position:absolute;inset:0;background:linear-gradient(transparent 45%,rgba(0,0,0,.8))}
.wf-where{position:absolute;left:14px;bottom:170px;font-size:12px;background:rgba(0,0,0,.4);padding:2px 8px;border-radius:4px}
.wf-cap{position:absolute;left:14px;right:72px;bottom:64px}.wf-t{font:900 23px/1.6 "Noto Serif SC",Georgia,serif;text-shadow:0 2px 8px rgba(0,0,0,.6)}.wf-m{font-size:13.5px;opacity:.9;margin-top:4px}
.wf-w{cursor:pointer;border-radius:4px;padding:0 1px;display:inline-flex;flex-direction:column;align-items:center;line-height:1.15}.wf-w:hover{background:rgba(255,255,255,.18)}.wf-w small{font:600 10.5px -apple-system,sans-serif;opacity:.85}.wf-w.saved{background:rgba(226,85,47,.55)}
.wf-rail{position:absolute;right:10px;bottom:72px;display:flex;flex-direction:column;gap:12px;align-items:center;z-index:3}.wf-rail button{border:0;background:rgba(0,0,0,.4);color:#fff;width:46px;height:46px;border-radius:50%;font-size:20px;cursor:pointer}.wf-rail small{font-size:10px;margin-top:-9px;text-shadow:0 1px 3px #000}.wf-rail .on{background:#e2552f}.wf-rail .rec{background:#e2552f;animation:wfp 1s infinite}@keyframes wfp{50%{box-shadow:0 0 0 10px rgba(226,85,47,.25)}}
.wf-pp{all:unset;cursor:pointer;box-sizing:border-box}.wf-pp em{font-style:normal;font-size:12px;margin-left:auto;background:rgba(255,255,255,.15);border-radius:99px;padding:3px 10px}.wf-who{display:flex;gap:8px;align-items:center;margin-bottom:6px;font-weight:800}.wf-who img,.wf-av{width:36px;height:36px;border-radius:50%;border:2px solid #fff;object-fit:cover;display:inline-grid;place-items:center;background:#7b2d6e}.wf-who small{font-weight:500;opacity:.85}
.wf-post{position:absolute;inset:0;background:linear-gradient(160deg,#2b3f63,#14305c);display:flex;flex-direction:column;justify-content:center;padding:60px 72px 60px 20px}.wf-ph{width:100%;height:42vh;border-radius:16px;background:#333 center/cover;margin:10px 0 14px}
.wf-voice{position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,#7b2d6e,#2b1630);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 72px 60px 22px}
.wf-wave{display:flex;gap:4px;align-items:center;height:60px;margin:14px 0}.wf-wave i{width:5px;border-radius:3px;background:#fff;opacity:.8;animation:wfw 1s infinite ease-in-out paused}.wf-voice.play .wf-wave i{animation-play-state:running}@keyframes wfw{50%{transform:scaleY(.35)}}
.wf-act{position:absolute;inset:0;background:#222 center/cover}.wf-box{position:absolute;left:16px;right:72px;bottom:72px;background:rgba(251,247,238,.96);color:#24303a;border-radius:16px;padding:14px}.wf-box small{color:#6b7488}.wf-box h3{margin:2px 0 8px;font:900 21px Georgia,"Noto Serif SC",serif;color:#14305c}
.wf-btn{border:0;border-radius:99px;padding:9px 16px;font-weight:800;background:#e2552f;color:#fff;cursor:pointer;margin-top:10px}
.wf-sheet{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:#fbf7ee;color:#24303a;border-radius:20px 20px 0 0;padding:16px 18px 24px;transform:translateY(105%);transition:.3s;z-index:9}.wf-sheet.on{transform:none}
.wf-big{font:900 34px "Noto Serif SC",Georgia,serif;color:#14305c}.wf-py{font-size:18px;color:#e2552f;font-weight:800;margin-left:8px}.wf-in{color:#6b7488;font-size:13px;margin-top:6px}.wf-row{display:flex;gap:8px;margin-top:12px}.wf-row button{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:7px 12px;font-weight:700;color:#14305c;cursor:pointer}
.wf-toast{position:absolute;top:58px;left:50%;transform:translate(-50%,-20px);opacity:0;background:#fff;color:#14305c;font-weight:800;padding:6px 14px;border-radius:99px;transition:.3s;z-index:10;font-size:13px;white-space:nowrap}.wf-toast.on{opacity:1;transform:translate(-50%,0)}
.wf-entry{all:unset;box-sizing:border-box;width:100%;cursor:pointer;display:block;position:relative;height:92px;border-radius:16px;overflow:hidden;margin:6px 0 16px;background:#222;box-shadow:0 8px 20px rgba(20,30,50,.2)}.wf-entry video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.wf-eg{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.75),transparent)}
.wf-et{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#fff;max-width:70%}.wf-et b{display:block;font:900 18px Georgia,"Noto Serif SC",serif}.wf-et small{display:block;opacity:.9;font-size:12px;margin-top:1px}.wf-et em{display:inline-block;font-style:normal;font-size:11.5px;background:rgba(255,255,255,.2);border-radius:99px;padding:2px 8px;margin-top:6px}
@media (prefers-reduced-motion:reduce){.wf-wave i,.wf-rail .rec{animation:none}}`;
})();

/* d73_snap.js */
window.SNAP_WEEKS = [{"start":"2026-11-09","id":"street","host":{"nm":"周岚","en":"Zhou Lan","job":{"zh":"肖像和街头摄影师 · 上海","en":"portrait & street photographer · Shanghai"}},"buddy":{"zh":["Lucas","在西安学中文，跟你一起拍"],"en":["Ji-woo","在首尔学英语，跟你一起拍"]},"t":{"zh":"世界街拍：这周大家在追什么","en":"World Street Snap: what's everyone chasing?"},"sub":{"zh":"5 天 · 每天出门拍一样东西，用你在学的语言说一句，钉在世界夜景地图上","en":"5 days · go out, shoot one thing a day, say it in the language you're learning, pin it on the world night map"},"cover":"mei/night","days":[{"k":"queue","e":"🧋","t":{"zh":"一家正在排队的店","en":"A place with a queue"},"task":{"zh":"今天去找一个在排队的地方：奶茶、面包、小吃、咖啡，什么都行。","en":"Today, find a place with a queue — tea, bread, snacks, coffee, anything."},"tip":{"zh":"蹲低一点，顺着队伍拍，队伍就成了一条长线。","en":"Crouch a little and shoot along the queue, so it becomes one long line."},"guess":{"q":{"zh":"珍珠奶茶最早是在哪里出现的？","en":"Where was bubble tea first made?"},"opts":[["🇹🇼","台中","Taichung"],["🇯🇵","东京","Tokyo"],["🇭🇰","香港","Hong Kong"],["🇹🇭","曼谷","Bangkok"]],"ans":0,"why":{"zh":"1980 年代在台湾台中出现。现在伦敦、拉各斯、墨西哥城、悉尼都有人排队买——这就是一样东西在世界上旅行。","en":"It appeared in Taichung, Taiwan, in the 1980s. Now people queue for it in London, Lagos, Mexico City and Sydney — a thing travelling the world."}},"say":{"zh":{"f":"这家{a}最近特别火，大家排{b}也要买。","a":[["奶茶店","tea shop","tea"],["面包店","bakery","bread"],["小吃店","snack bar","snack"],["咖啡店","café","coffee"]],"b":[["十分钟","10 minutes"],["半个小时","half an hour"],["一个小时","an hour"]]},"en":{"f":"This {a} is so popular right now — people queue for {b}.","a":[["tea shop","奶茶店","tea"],["bakery","面包店","bread"],["snack bar","小吃店","snack"],["café","咖啡店","coffee"]],"b":[["ten minutes","十分钟"],["half an hour","半小时"],["an hour","一个小时"]]}},"seeds":[["台北","mei/night","zh","夜市这家奶茶，晚上十点还在排队。","This tea stall still has a queue at 10pm.","tea"],["墨西哥城","valeria/market","en","Every Sunday there's a line at our market for the churros stand.","每个周日，市集上的吉事果摊都排长队。","snack"]]},{"k":"billboard","e":"🪧","t":{"zh":"街上最大的广告牌：上面是谁？","en":"The biggest billboard on your street: who's on it?"},"task":{"zh":"抬头看看：你那儿最大的广告牌、地铁广告上是谁？拍下来。","en":"Look up: who's on the biggest billboard or subway ad near you? Take a photo."},"tip":{"zh":"把旁边走过的人也拍进去，广告才看得出有多大。","en":"Get people walking past into the frame — that's how you show how big the ad is."},"guess":{"q":{"zh":"在首尔和上海的地铁里，很多明星的生日广告是谁出钱买的？","en":"In Seoul and Shanghai subways, who usually pays for celebrities' birthday ads?"},"opts":[["🏢","明星的公司","their agency"],["💜","粉丝","fans"],["🚇","地铁公司","the subway company"],["🏷️","品牌","brands"]],"ans":1,"why":{"zh":"很多是粉丝一起凑钱买的「应援广告」，在韩国和中国很常见，后来纽约时代广场上也出现了。","en":"Many are fan-funded 'support ads' — common in Korea and China, and they've since appeared in New York's Times Square too."}},"say":{"zh":{"f":"广告牌上是{a}，最近特别火，因为{b}。","a":[["一个歌手","a singer","singer"],["一个演员","an actor","actor"],["一个运动员","an athlete","athlete"],["一个网红","an influencer","influencer"]],"b":[["歌很好听","the songs are good"],["戏演得好","great acting"],["特别拼","works so hard"],["特别搞笑","really funny"]]},"en":{"f":"The face on the billboard is {a} — people love them because {b}.","a":[["a singer","一个歌手","singer"],["an actor","一个演员","actor"],["an athlete","一个运动员","athlete"],["an influencer","一个网红","influencer"]],"b":[["the songs are catchy","歌很好听"],["they're a great actor","戏演得好"],["they work so hard","特别拼"],["they're really funny","特别搞笑"]]}},"seeds":[]},{"k":"wear","e":"🧥","t":{"zh":"这周大家都穿什么","en":"What everyone's wearing this week"},"task":{"zh":"拍一样你在街上看到很多人都在穿的东西：一件外套、一双鞋、一个包。拍东西，不拍陌生人的脸。","en":"Shoot one thing lots of people are wearing: a jacket, shoes, a bag. Shoot the thing, not strangers' faces."},"tip":{"zh":"拍局部：一排鞋、一只袖子、橱窗里的一件，比拍人更好看，也不打扰人。","en":"Shoot details — a row of shoes, a sleeve, one jacket in a window. Better photos, and you don't bother anyone."},"guess":{"q":{"zh":"这几年很多城市的年轻人穿户外冲锋衣、登山鞋上街，英文里叫什么？","en":"Young people in many cities now wear hiking jackets and trail shoes in town. What's the English name for this style?"},"opts":[["🏔️","gorpcore","gorpcore"],["👔","normcore","normcore"],["🏙️","streetwear","streetwear"],["🌸","cottagecore","cottagecore"]],"ans":0,"why":{"zh":"gorpcore 来自 GORP（徒步时吃的什锦果仁）。中文里常说「山系穿搭」「冲锋衣」——同一股风从东京、首尔、北京刮到伦敦。","en":"Gorpcore comes from GORP, the trail mix hikers eat. In Chinese people say 山系穿搭 or 冲锋衣 — the same wind blowing from Tokyo, Seoul and Beijing to London."}},"say":{"zh":{"f":"现在满街都是{a}，{b}。","a":[["冲锋衣","rain jackets","jacket"],["宽松的裤子","baggy trousers","trousers"],["复古球鞋","retro trainers","shoes"],["大大的帆布包","big tote bags","bag"]],"b":[["我也想要","I want one too"],["我不太喜欢","not really my thing"],["我已经有了","I already have one"]]},"en":{"f":"Everyone's wearing {a} right now — {b}.","a":[["rain jackets","冲锋衣","jacket"],["baggy jeans","宽松的裤子","trousers"],["retro trainers","复古球鞋","shoes"],["big tote bags","大帆布包","bag"]],"b":[["I want one too","我也想要"],["it's not really my thing","我不太喜欢"],["I already have one","我已经有了"]]}},"seeds":[]},{"k":"try","e":"🍫","t":{"zh":"试一次那个流行的吃的喝的","en":"Try the trendy food or drink"},"task":{"zh":"大家这周都在吃、在喝的那个东西，你也买一次，拍下来，说说值不值。","en":"Buy the thing everyone's eating or drinking this week, take a photo, and say if it's worth it."},"tip":{"zh":"靠近窗户，用自然光拍吃的，别开闪光灯。","en":"Shoot food near a window in natural light — no flash."},"guess":{"q":{"zh":"「迪拜巧克力」（开心果酥夹心）是哪一年在网上火遍全世界的？","en":"When did 'Dubai chocolate' (pistachio and crispy pastry filling) go viral around the world?"},"opts":[["📅","2019","2019"],["📅","2021","2021"],["📅","2024","2024"],["📅","2026","2026"]],"ans":2,"why":{"zh":"2023 年底一条试吃视频让迪拜一家小店的巧克力火了，2024 年伦敦、首尔、上海都有人排队买仿款。","en":"A tasting video in late 2023 made a small Dubai shop's chocolate go viral; in 2024 people queued for copies in London, Seoul and Shanghai."}},"say":{"zh":{"f":"我试了一下{a}，说实话，{b}。","a":[["那家奶茶","that bubble tea","tea"],["迪拜巧克力","Dubai chocolate","choc"],["网红面包","the trendy bread","bread"],["新口味咖啡","the new coffee","coffee"]],"b":[["值得排队","worth the queue"],["有点太甜了","a bit too sweet"],["没有想象的好吃","not as good as I hoped"]]},"en":{"f":"I tried {a} — honestly, {b}.","a":[["the viral bubble tea","那家奶茶","tea"],["Dubai chocolate","迪拜巧克力","choc"],["the trendy bakery","网红面包","bread"],["the new coffee","新口味咖啡","coffee"]],"b":[["it's worth the queue","值得排队"],["it's a bit too sweet","有点太甜了"],["it's not as good as I hoped","没有想象的好吃"]]}},"seeds":[["台北","mei/work","zh","我们店这周卖得最好的是芋泥奶茶，一天摇几百杯。","Taro milk tea is our best seller this week.","tea"]]},{"k":"mine","e":"💛","t":{"zh":"你自己喜欢的，不用流行","en":"Something you love — trendy or not"},"task":{"zh":"最后一天：拍一样你自己喜欢的东西，不管它流不流行。","en":"Last day: shoot one thing you love, whether it's trendy or not."},"tip":{"zh":"拍你最常去的那个地方，它就是你的城市。","en":"Shoot the place you go most often — that's your city."},"guess":null,"say":{"zh":{"f":"大家都在追{a}，可我更喜欢{b}。","a":[["新东西","new things","new"],["网红店","viral spots","viral"],["名牌","big brands","brand"]],"b":[["家附近的小店","the little shop near home"],["安静的公园","a quiet park"],["我奶奶做的菜","my grandma's cooking"]]},"en":{"f":"Everyone's chasing {a}, but I prefer {b}.","a":[["new things","新东西","new"],["viral spots","网红店","viral"],["big brands","名牌","brand"]],"b":[["the little shop near my home","家附近的小店"],["a quiet park","安静的公园"],["my grandma's cooking","我奶奶做的菜"]]}},"seeds":[["首尔","jiwoo/hike","en","Everyone's chasing new cafés, but I prefer the mountains on weekends.","大家都在追新咖啡馆，可我更喜欢周末去爬山。","nature"],["杭州","xiaoyu/lake","zh","大家都在追网红店，可我更喜欢周末早上去西湖边走走。","I'd rather walk by West Lake on weekend mornings.","nature"]]}]},{"start":"2026-11-16","id":"street-2026-11-16","host":{"nm":"周岚","en":"Zhou Lan","job":{"zh":"肖像和街头摄影师 · 上海","en":"portrait & street photographer · Shanghai"}},"buddy":{"zh":["Lucas","在西安学中文，跟你一起拍"],"en":["Ji-woo","在首尔学英语，跟你一起拍"]},"t":{"zh":"世界街拍：世界的早上","en":"World Street Snap: mornings around the world"},"sub":{"zh":"5 天 · 每天早上拍一样东西，用你在学的语言说一句，在夜间地球上点亮你的灯","en":"5 days · shoot one thing each morning, say one line in the language you're learning, light your lamp on the night Earth"},"cover":"xiaoyu/lake","days":[{"k":"breakfast","e":"🥣","t":{"zh":"你今天的早饭","en":"Your breakfast today"},"task":{"zh":"今天早上吃了什么？从上往下拍你的早饭，或者你买早饭的那个小摊。","en":"What did you have this morning? Shoot your breakfast from above, or the stall where you bought it."},"tip":{"zh":"从正上方往下拍，把碗、杯子、筷子都放进画面里，像一张小地图。","en":"Shoot straight down and fit the bowl, cup and chopsticks in — like a little map."},"guess":{"q":{"zh":"一份「全英式早餐」（full English breakfast）里通常有下面哪一样？","en":"Which of these is usually part of a full English breakfast?"},"opts":[["🫘","茄汁烤豆子","baked beans"],["🍚","米饭","rice"],["🥬","泡菜","kimchi"],["🌮","玉米饼","tortillas"]],"ans":0,"why":{"zh":"鸡蛋、培根、香肠、烤番茄，加上一勺茄汁烤豆子。世界各地的早饭都不一样：首尔有人喝汤配米饭，墨西哥城吃玉米饼，广州去喝早茶。","en":"Eggs, bacon, sausage, grilled tomato and a spoon of baked beans. Breakfast is different everywhere: soup and rice in Seoul, tortillas in Mexico City, dim sum in Guangzhou."}},"say":{"zh":{"f":"我今天早上吃了{a}，{b}。","a":[["包子","steamed buns","bun"],["面包","bread","bread"],["粥","congee","porridge"],["什么都没吃","nothing","none"]],"b":[["很快就吃完了","ate it fast"],["边走边吃","ate it on the way"],["吃得很饱","I'm full"]]},"en":{"f":"This morning I had {a} — {b}.","a":[["toast","吐司","bread"],["porridge","燕麦粥","porridge"],["eggs","鸡蛋","eggs"],["nothing at all","什么都没吃","none"]],"b":[["I ate it on the way","边走边吃"],["it took two minutes","两分钟吃完"],["I'm still hungry","我还饿"]]}},"seeds":[]},{"k":"commute","e":"🚇","t":{"zh":"你上学、上班的路","en":"Your way to school or work"},"task":{"zh":"拍一张你每天早上路上看到的东西：车站、车窗外、自行车、过马路的人群（拍背影，不拍陌生人的正脸）。","en":"Shoot something you see every morning on your way: the station, the view from the window, bikes, the crowd crossing (backs, not strangers' faces)."},"tip":{"zh":"坐车时把车窗当画框，等一个有颜色的东西经过再按。","en":"On a bus or train, use the window as a frame and wait for something colourful to pass."},"guess":{"q":{"zh":"东京地铁早高峰时，车站里有人专门帮忙把乘客推进车厢，日语叫什么？","en":"In Tokyo's morning rush, some station staff help push passengers into the trains. What are they called in Japanese?"},"opts":[["🙇","押し屋（oshiya）","oshiya"],["🎫","駅長（ekichō）","ekichō"],["🚕","運転手（untenshu）","untenshu"],["🍱","駅弁（ekiben）","ekiben"]],"ans":0,"why":{"zh":"「押し屋」就是「推的人」。从上世纪 50 年代起，东京有些车站早高峰会安排人帮忙把门口的乘客推进去。每个城市早上的路都不一样：有人挤地铁，有人骑车，有人坐摩托车。","en":"Oshiya means 'pushers'. Since the 1950s some Tokyo stations have had staff help squeeze people in at rush hour. Every city's morning is different: packed trains, bikes, motorbike taxis."}},"say":{"zh":{"f":"我每天早上{a}，路上要{b}。","a":[["坐地铁","take the subway","metro"],["骑自行车","ride a bike","bike"],["坐公交车","take the bus","bus"],["走路","walk","walk"]],"b":[["十分钟","10 minutes"],["半个小时","half an hour"],["一个多小时","over an hour"]]},"en":{"f":"Every morning I {a} — it takes {b}.","a":[["take the subway","坐地铁","metro"],["ride my bike","骑自行车","bike"],["take the bus","坐公交车","bus"],["walk","走路","walk"]],"b":[["about ten minutes","十分钟左右"],["half an hour","半个小时"],["more than an hour","一个多小时"]]}},"seeds":[["台北","mei/scooter","zh","下雨天骑车去学校，红灯前面全是摩托车。","Riding to school in the rain — scooters everywhere at the red light.","bike"]]},{"k":"drink","e":"🍵","t":{"zh":"你早上喝的第一杯","en":"Your first drink of the day"},"task":{"zh":"拍你今天早上喝的第一杯：茶、咖啡、豆浆、热水，什么都行。","en":"Shoot your first drink of the day: tea, coffee, soy milk, hot water, anything."},"tip":{"zh":"让杯子挡住一半的窗户光，热气就看得见了。","en":"Put the cup against half the window light — that's how the steam shows."},"guess":{"q":{"zh":"按每个人一年喝多少茶算，哪个国家的人喝茶最多？","en":"Per person, which country drinks the most tea?"},"opts":[["🇹🇷","土耳其","Turkey"],["🇨🇳","中国","China"],["🇬🇧","英国","the UK"],["🇯🇵","日本","Japan"]],"ans":0,"why":{"zh":"按人均算，土耳其多年排第一，一天喝好几杯小玻璃杯装的红茶（çay）。中国喝茶的人最多，但人均排不到第一。同一片叶子，在世界各地变成了完全不同的喝法。","en":"Per person, Turkey has topped the list for years — many small tulip glasses of black tea (çay) a day. China has the most tea drinkers in total, but not the most per person. The same leaf, drunk completely differently around the world."}},"say":{"zh":{"f":"我早上一定要喝{a}，不然{b}。","a":[["一杯咖啡","a coffee","coffee"],["一杯茶","a tea","tea"],["一杯豆浆","soy milk","soy"],["一杯热水","hot water","water"]],"b":[["一整天都没精神","I'm tired all day"],["我会很想睡","I'll be sleepy"],["我就不像我了","I'm not myself"]]},"en":{"f":"I can't start the day without {a} — otherwise {b}.","a":[["a coffee","一杯咖啡","coffee"],["a cup of tea","一杯茶","tea"],["a glass of water","一杯水","water"],["my music","我的音乐","music"]],"b":[["I'm half asleep","我半睡半醒"],["I'm grumpy all morning","一上午都没好脸色"],["I can't think","脑子转不动"]]}},"seeds":[]},{"k":"greet","e":"👋","t":{"zh":"早上见到的第一个人","en":"The first person you greet"},"task":{"zh":"早上你跟谁打的第一个招呼？拍一张那个地方：门口、电梯、早餐摊、办公室（不拍对方的脸也可以）。","en":"Who did you greet first this morning? Shoot the place: the doorway, the lift, the breakfast stall, the office (no need to show their face)."},"tip":{"zh":"拍「打招呼的地方」比拍人更有故事：一扇门、一个摊位的招牌。","en":"The place you say hello tells more of a story than a face: a door, a stall's sign."},"guess":{"q":{"zh":"韩国人常用的问候「밥 먹었어?」，字面意思是什么？","en":"Koreans often greet each other with '밥 먹었어?'. What does it literally mean?"},"opts":[["🍚","你吃饭了吗？","Have you eaten?"],["😴","你睡好了吗？","Did you sleep well?"],["💼","你今天忙吗？","Are you busy today?"],["🌤️","今天天气好吗？","Is the weather nice?"]],"ans":0,"why":{"zh":"字面是「你吃饭了吗？」，跟中文的「吃了吗」一样，意思其实是「你好吗」。两个地方说法不同，心思是一样的：先关心你有没有吃饱。","en":"Literally 'Have you eaten?' — just like Chinese 吃了吗. Both really mean 'how are you?'. Different words, the same care: first, did you get enough to eat?"}},"say":{"zh":{"f":"我今天早上第一个见到的是{a}，我说：「{b}」","a":[["楼下的保安","the security guard","guard"],["早餐摊的老板","the breakfast stall owner","stall"],["我的同事","my colleague","colleague"],["我的室友","my flatmate","flatmate"]],"b":[["早！","Morning!"],["吃了吗？","Have you eaten?"],["今天好冷啊！","It's so cold today!"]]},"en":{"f":"The first person I saw this morning was {a}. I said, \"{b}\"","a":[["the security guard","楼下的保安","guard"],["the coffee guy","咖啡店的小哥","stall"],["my colleague","我的同事","colleague"],["my flatmate","我的室友","flatmate"]],"b":[["Morning!","早！"],["How's it going?","最近怎么样？"],["Freezing today, isn't it?","今天好冷啊，是吧？"]]}},"seeds":[]},{"k":"mymorning","e":"🌅","t":{"zh":"你最喜欢的早上","en":"Your favourite kind of morning"},"task":{"zh":"最后一天：拍一样让你喜欢早上的东西，一束光、一条路、一扇窗都行。","en":"Last day: shoot one thing that makes you love mornings: a beam of light, a street, a window."},"tip":{"zh":"早上的光是斜的，蹲低一点，让光从侧面打过来。","en":"Morning light comes in low — crouch so it hits your subject from the side."},"guess":null,"say":{"zh":{"f":"我最喜欢{a}的早上，因为{b}。","a":[["周末","weekend","weekend"],["下雨","rainy","rain"],["天刚亮","early","dawn"]],"b":[["可以慢慢来","I can take my time"],["路上人很少","the streets are empty"],["一切都刚开始","everything is just starting"]]},"en":{"f":"I love {a} mornings, because {b}.","a":[["weekend","周末","weekend"],["rainy","下雨","rain"],["early","天刚亮","dawn"]],"b":[["I can take my time","可以慢慢来"],["the streets are empty","路上人很少"],["everything is just starting","一切都刚开始"]]}},"seeds":[["杭州","xiaoyu/lake","zh","我最喜欢周末的早上，一早去西湖边走走，柳树刚发芽。","Weekend mornings by West Lake, when the willows are just budding.","weekend"],["首尔","jiwoo/hike","en","I love weekend mornings, because I can go up the mountain before anyone else.","我最喜欢周末的早上，可以比所有人都早上山。","weekend"]]}]},{"start":"2026-11-23","id":"street-2026-11-23","host":{"nm":"周岚","en":"Zhou Lan","job":{"zh":"肖像和街头摄影师 · 上海","en":"portrait & street photographer · Shanghai"}},"buddy":{"zh":["Lucas","在西安学中文，跟你一起拍"],"en":["Ji-woo","在首尔学英语，跟你一起拍"]},"t":{"zh":"世界街拍：换季了","en":"World Street Snap: the seasons turn"},"sub":{"zh":"5 天 · 这周北边入冬、南边入夏，每天拍一样换季的东西，用你在学的语言说一句，在夜间地球上点亮你的灯","en":"5 days · winter is coming in the north, summer in the south — shoot one sign of the season each day, say one line in the language you're learning, light your lamp on the night Earth"},"cover":"ingrid/window","days":[{"k":"sky","e":"🌤️","t":{"zh":"你那里今天的天","en":"Your sky today"},"task":{"zh":"出门抬头，拍一张今天的天：阴天、晴天、下雨、下雪都行，把一点街道或屋顶也拍进去。","en":"Step outside and look up. Shoot today's sky — grey, blue, rain or snow — with a bit of street or rooftop in the frame."},"tip":{"zh":"天占三分之二，地占三分之一，这样看得出你在哪儿。","en":"Two-thirds sky, one-third ground — that's what tells people where you are."},"guess":{"q":{"zh":"按气象上的算法，北半球的冬天和南半球的夏天，都从哪一天开始？","en":"By the weather services' calendar, northern winter and southern summer both begin on which day?"},"opts":[["❄️","12 月 1 日","1 December"],["🌸","3 月 1 日","1 March"],["☀️","6 月 1 日","1 June"],["🍂","9 月 1 日","1 September"]],"ans":0,"why":{"zh":"英国气象局把 12、1、2 月算冬天，澳大利亚气象局把这三个月算夏天。同一天，伦敦人开始过冬，悉尼人开始过夏。这周你拍的天，正好在这一天前面。","en":"The UK's Met Office counts December to February as winter; Australia's Bureau of Meteorology counts the same months as summer. On the same day, London starts winter and Sydney starts summer — and this week's skies come just before it."}},"say":{"zh":{"f":"我这儿今天{a}，{b}。","a":[["很冷","cold","cold"],["下雨","rainy","rain"],["很热","hot","hot"],["刮大风","windy","wind"]],"b":[["我一点也不想出门","I don't feel like going out at all"],["跟昨天完全不一样","totally different from yesterday"],["正好出去走走","just right for a walk"]]},"en":{"f":"It's {a} where I am today — {b}.","a":[["freezing","很冷","cold"],["rainy","下雨","rain"],["really hot","很热","hot"],["so windy","刮大风","wind"]],"b":[["I don't feel like going out at all","我一点也不想出门"],["nothing like yesterday","跟昨天完全不一样"],["perfect for a walk","正好出去走走"]]}},"seeds":[["汉堡","hans/elbe","en","Sunday walk by the Elbe — the wind nearly took my hat.","周日沿着易北河散步，风大得差点把我的帽子吹走。","wind"],["墨尔本","mia/beach","en","It's finally warm — straight to the beach after class.","终于暖和了，一下课就去海边。","hot"]]},{"k":"carry","e":"🧤","t":{"zh":"你出门带上的那样东西","en":"The thing you take out with you"},"task":{"zh":"这几天天气变了，你出门多带了什么？雨伞、手套、围巾、防晒霜、一瓶水……拍你手里或包里的那一样。","en":"The weather's changing — what do you take out now? Umbrella, gloves, scarf, sunscreen, a water bottle… shoot the one in your hand or your bag."},"tip":{"zh":"把东西放在你每天出门的门口或台阶上拍，比放在桌上更有「要出门了」的感觉。","en":"Shoot it by your front door or on the steps — it looks like you're about to head out, not like a product photo."},"guess":{"q":{"zh":"冬天很多日本人揣在兜里、贴在衣服里的一次性小暖包，日语叫什么？","en":"In winter, many people in Japan keep a little disposable heat pack in their pocket or stuck inside their clothes. What is it called in Japanese?"},"opts":[["🔥","カイロ（kairo）","kairo"],["🛋️","こたつ（kotatsu）","kotatsu"],["🪭","扇子（sensu）","sensu"],["🍱","弁当（bentō）","bentō"]],"ans":0,"why":{"zh":"「カイロ」撕开就会热，能热好几个小时，中文里常叫「暖宝宝」。こたつ是盖着被子的取暖桌，搬不出门；扇子是夏天的。南半球这几天正好反过来：大家出门带的是防晒霜和水。","en":"A kairo warms up as soon as you open it and stays warm for hours; in Chinese it's often called 暖宝宝. A kotatsu is a heated table under a blanket — you can't take it out. Down south it's the other way round this week: sunscreen and water."}},"say":{"zh":{"f":"这几天我出门一定带着{a}，因为{b}。","a":[["雨伞","an umbrella","umbrella"],["手套","gloves","gloves"],["暖宝宝","a heat pack","heatpack"],["防晒霜","sunscreen","sunscreen"],["一瓶水","a bottle of water","water"]],"b":[["天说变就变","the weather changes so fast"],["我特别怕冷","I really feel the cold"],["太阳太晒了","the sun is so strong"]]},"en":{"f":"These days I never go out without {a}, because {b}.","a":[["an umbrella","雨伞","umbrella"],["my gloves","手套","gloves"],["sunscreen","防晒霜","sunscreen"],["a bottle of water","一瓶水","water"]],"b":[["the weather changes so fast","天说变就变"],["I really feel the cold","我特别怕冷"],["the sun is brutal","太阳太晒了"]]}},"seeds":[["密尔沃基","jake/snow","en","Shovel by the door, gloves in my pocket — winter's here.","铲子放在门口，手套揣在兜里——冬天来了。","gloves"]]},{"k":"street","e":"🌰","t":{"zh":"街上这个季节才有的吃的","en":"A street food of the season"},"task":{"zh":"找一样只有这个季节街上才多起来的吃的：烤红薯、栗子、热汤、冰淇淋、刚上市的水果。拍那个摊子或者你手里那一份。","en":"Find a food that only fills the streets this time of year: roast sweet potatoes, chestnuts, hot soup, ice cream, the first fruit of summer. Shoot the stall or the one in your hand."},"tip":{"zh":"热的吃的要趁冒气的时候拍，背后最好是暗一点的街。","en":"Shoot hot food while it's still steaming, ideally against a darker street behind."},"guess":{"q":{"zh":"冬天在巴黎、伊斯坦布尔、纽约和北京的街头，都能买到同一种热乎乎的小吃。是什么？","en":"In winter you can buy the same hot street snack in Paris, Istanbul, New York and Beijing. What is it?"},"opts":[["🌰","烤栗子","roasted chestnuts"],["🍣","寿司","sushi"],["🍉","西瓜","watermelon"],["🍦","冰淇淋","ice cream"]],"ans":0,"why":{"zh":"巴黎叫 marrons chauds，伊斯坦布尔叫 kestane kebap，纽约是街边小车上卖的，北京是糖炒栗子。做法不一样，都是装在纸袋里、捧在手里暖手。南半球这时候正好反过来，街上多起来的是冰的东西。","en":"Marrons chauds in Paris, kestane kebap in Istanbul, the street carts in New York, sugar-roasted chestnuts in Beijing. Cooked differently, but always in a paper bag that warms your hands. Down south it's the opposite: the streets fill with cold treats."}},"say":{"zh":{"f":"这个季节我最想吃{a}，{b}。","a":[["烤红薯","roast sweet potato","sweetpotato"],["糖炒栗子","roasted chestnuts","chestnut"],["火锅","hot pot","hotpot"],["冰淇淋","ice cream","icecream"],["西瓜","watermelon","fruit"]],"b":[["捧在手里很暖和","it warms my hands"],["一年就等这个时候","I wait all year for it"],["吃完整个人都舒服了","I feel so good after"]]},"en":{"f":"This time of year I really want {a} — {b}.","a":[["roasted chestnuts","烤栗子","chestnut"],["a bowl of hot soup","一碗热汤","soup"],["hot chocolate","热巧克力","hotdrink"],["ice cream","冰淇淋","icecream"],["fresh mango","新鲜芒果","fruit"]],"b":[["it warms my hands","捧在手里很暖和"],["I wait all year for it","一年就等这个时候"],["it just feels right","就是这个季节的味道"]]}},"seeds":[]},{"k":"home","e":"🛏️","t":{"zh":"家里换季的那样东西","en":"What changed at home"},"task":{"zh":"天冷了或者热了，你家里多了什么、换了什么？厚被子、电暖器、热水袋、电风扇……拍你家里的那一样。","en":"It's colder or hotter now — what's new at home? A thick duvet, the heater, a hot-water bottle, the fan… shoot that one thing."},"tip":{"zh":"拍家里的东西，开一盏暖色的灯，比开顶灯好看得多。","en":"Indoors, switch on a warm lamp instead of the ceiling light — it looks much better."},"guess":{"q":{"zh":"韩国传统的「온돌」（ondol）是靠什么让屋子暖起来的？","en":"How does the traditional Korean ondol keep a house warm?"},"opts":[["🔥","把地板烧热","it heats the floor"],["🧣","在墙上挂厚毯子","thick blankets on the walls"],["🪟","把窗户封起来","it seals up the windows"],["🧊","在门口放冰块","ice by the door"]],"ans":0,"why":{"zh":"在灶口烧火，热气从地板下面的通道走过去，整块地板都是热的，所以韩国人习惯坐在地上、睡在地上。2018 年它被列为韩国国家非物质文化遗产。今天的公寓多用热水管，还是热在地板上。各地办法不一样：北京有暖气，日本有こたつ，南半球这周开始搬出电风扇。","en":"A fire is lit at one end and the heat runs through channels under the floor, so the whole floor is warm — that's why people in Korea sit and sleep on the floor. It became a national intangible heritage of Korea in 2018. Today's flats use hot-water pipes, but the heat is still in the floor. Every place has its own way: radiators in Beijing, the kotatsu in Japan, and down south the fans come out this week."}},"say":{"zh":{"f":"最近我家里多了{a}，{b}。","a":[["一床厚被子","a thick duvet","duvet"],["一个电暖器","a heater","heater"],["一个热水袋","a hot-water bottle","hotwater"],["一台电风扇","an electric fan","fan"]],"b":[["晚上睡得香多了","I sleep much better"],["早上都不想起床了","I don't want to get up in the morning"],["屋里舒服多了","the room feels much nicer"]]},"en":{"f":"I've just got {a} out — {b}.","a":[["the thick duvet","厚被子","duvet"],["the heater","电暖器","heater"],["a hot-water bottle","热水袋","hotwater"],["the fan","电风扇","fan"]],"b":[["I'm sleeping so much better","睡得香多了"],["I never want to get up","早上都不想起床了"],["my room feels so much nicer","屋里舒服多了"]]}},"seeds":[["首尔","jiwoo/room","en","My room is tiny, but the floor is warm, so I just eat dinner sitting on it.","我的房间很小，可是地板是热的，我就坐在地上吃晚饭。","floor"]]},{"k":"myseason","e":"🕯️","t":{"zh":"你最喜欢这个季节的什么","en":"What you love about this season"},"task":{"zh":"最后一天：拍一样让你喜欢这个季节的东西。冬天的一盏灯、夏天的一片海、一条落满叶子的路都行。","en":"Last day: shoot one thing that makes you love this season — a lamp in winter, the sea in summer, a street full of leaves."},"tip":{"zh":"这一张不用讲究，拍你真的会停下来多看一眼的那一刻。","en":"Don't overthink this one — shoot the moment you'd actually stop and look twice."},"guess":null,"say":{"zh":{"f":"这个季节我最喜欢的是{a}，因为{b}。","a":[["早早窝在家里","staying in early","home"],["晚上出去走走","evening walks","outdoors"],["第一场雪","the first snow","snow"],["热乎乎的吃的","warm food","food"]],"b":[["一年就这几个月","it only lasts a few months"],["整个人都慢下来了","everything slows down"],["让我想起小时候","it reminds me of being a kid"]]},"en":{"f":"What I love about this season is {a}, because {b}.","a":[["cosy nights in","早早窝在家里","home"],["long evenings outside","晚上在外面待很久","outdoors"],["the first snow","第一场雪","snow"],["warm food","热乎乎的吃的","food"]],"b":[["it only lasts a few months","一年就这几个月"],["everything slows down","整个人都慢下来了"],["it reminds me of being a kid","让我想起小时候"]]}},"seeds":[["马尔默","elin/fika","en","What I love about winter here is candles and cinnamon buns at four, because it's already dark outside.","我最喜欢这里的冬天：下午四点点上蜡烛、吃肉桂卷，因为外面天已经黑了。","home"],["北京","suqing/hutong","zh","我最喜欢北京这时候，骑车穿过胡同，银杏叶落了一地。","Beijing at this time of year: cycling through the hutongs, ginkgo leaves all over the ground.","outdoors"]]}]}];

/* d74_snapvoice.js */
window.SNAP_VOICE_HAS = new Set("0065768b 00d7980a 01c7672f 01d34464 021745e9 022115d1 0247381c 03761797 03d2fb58 042f427d 0440b27a 04e4f3ed 0571cbef 05dd7ff5 074f180e 085d76e3 08e845e2 090133c2 09ec0711 0b4d4d3e 0b52cacc 0ba9a54a 0bd9100e 0c9e8fc9 0cf36238 0cfe531f 0d01e14f 0d2b5dcd 0d31dc2a 0dea36df 0f3411a4 0f9b881c 106aa7ad 10e23018 10f4483c 1111dbb2 116e6b5e 11b01c8f 11e51ea5 11fc26e6 12084250 12803d6b 12aaa03c 12df5da3 13859734 143aa4f8 1448ea37 153dfe08 161a9c66 165f10d3 170849a8 171ca5a2 1747da93 178b5086 184ed83d 188832e5 18a8717f 18bb3ce3 18e52f76 1a597284 1b16bf3c 1c321845 1c6f5aab 1ca59507 1cd17bb5 1d15ab4e 1d24968f 1d7c4655 1dd48817 1df4c27a 1e3f3241 1e6a7cef 1eba223a 1f6c9b61 2008e4b0 20cd9bb2 20d1099a 218acf70 2202b55c 2205a331 2217af38 2231c5ad 224f9547 2293c612 23b161f9 23f01b12 23f64e6e 2456cd9e 253143d6 2601dc64 26ad336b 2709a490 275718d9 27c8acfe 284cd9d5 284f8961 2a6d187d 2aaa36f6 2b137111 2b9b02de 2ba935b1 2be3f21c 2c33768b 2ca89ae0 2d26ff47 2d382f27 2d8e84a5 2e255654 2e8256f5 2f6151ee 2f6ef7b7 2f7270ae 2fc90432 2fffd1a0 301cc1cf 3074d989 3131be8f 315f114e 3160d800 323a078d 325eebea 32cf49d7 337463d4 33babd1e 34005ac6 34369c69 349982c9 3520825d 358e2ca4 369ce9e4 37078430 372a3d9f 37b7ab0e 382c93f9 382cbcfa 3894f0f0 3901423a 3932aa1a 39433270 396a03a4 39e14100 3a2dd0bf 3af4f432 3b570017 3d1ce6ef 3de4350f 3e0908c7 3ec02edb 3ed7ced1 3f125ad6 3fcb822f 3fd8e494 3fdc8063 4096349f 41998923 41ef0053 4378c350 44381bfa 44a90adf 44da9338 459757c1 4652b8de 467b2df8 46937a2b 470e06d2 47143ffd 47b531a3 4910c3cb 49458586 49bd0064 49f3c3f5 4abaae1a 4b32f0c8 4b657e46 4b677012 4c0c9e6b 4d2f998c 4d753e9a 4da12b7e 4db47a49 4dcd7c77 4ebe2183 4eed4ba6 4efa59ea 4fab535a 4fcdffab 500a9b6d 503b150a 50438f8b 50ffbd55 51537857 5177cf9d 51a2928e 52aed500 52c30041 52dfc4a5 53895e09 53a3092e 53fdd9d0 54302a24 54759c79 54b21fa6 55e5e0cf 56049503 56344970 567bf2de 5687074b 571f3525 5857079d 5879f053 58dec23f 58f47986 5922c58d 59eaab83 5a6ea1a7 5a7f9bd1 5b0ea2b6 5ba85ca5 5c567e36 5c5ee85b 5c92bd95 5cdf3319 5cff1ccf 5d8010b0 5db01f46 5db04a76 5ef4916f 60b90243 6138a60d 61fff088 6260689a 628d1396 62ad0262 6332df8f 63489575 63c45325 65c5c45c 65db034d 669ddae3 66ca7e4e 672b58ed 6896b093 68a8075a 68df8f23 69d9f0d5 6a138f6a 6a3763d9 6a9b10f1 6aa920d2 6aeefde0 6b3645a0 6b48a5a1 6b718fd1 6bbf444e 6c5bd6f1 6cafe902 6cbd3fc2 6d2ef1fe 6d562bd7 6da365d8 6e7bd369 6f94f5e0 70cd91a0 7116bf21 71d39ec3 71d9a949 71decf61 7244fdc8 724769f8 725b9640 73213f12 7327328d 7439d565 7440760a 7518887e 75b73b5f 762599ca 765334d2 7671abfb 76a40a2a 77eb7072 77ee3534 784f928e 78587841 785d5c4f 798b309e 79f7d87d 7a5ae8c8 7aed58bc 7b979ebe 7c1d6713 7c97e4d2 7ce2dc44 7cee177d 7d2e4c9c 7d63a1ab 7e8a8d5d 7ee83f7d 7f564738 7f5ae84c 7faaa654 7fac6107 7ff38b6f 80b427c1 811c9fef 814b3e7d 8214e7f9 82c8567c 82e2c667 82f8f39d 83031f39 838fec39 83cd1ad2 83d9f986 8468175a 846d16a2 8488fe2c 84f93544 85dc6b31 85e35184 85e485b3 86ac7c26 86b3a2d9 8771b5da 885ae197 88b94b2a 8a1fef92 8a326b46 8a3a3068 8adacf9a 8ae04ed2 8b399e08 8b80eec5 8c442e3a 8ca25e81 8cb07fc5 8d474f9a 8dacf997 8db4c134 8df61e00 8ebf94f3 8f483575 903485b0 905be39f 90b99c71 91846b1c 92ac079f 92c14b72 92feaa35 933e44da 93655beb 939c41d8 93ee6379 93f81e9f 9453405e 9484f4e2 952438d7 96339d74 97229ef6 980ac0c0 984ad77f 98f13caf 9911e53c 99f0d777 9a0ee995 9ab136c3 9ab9b8f1 9acc6a10 9aed35c4 9b8b2c4c 9c281b2b 9c95f903 9ccded95 9dbd2874 9e54fb72 9fa1b24a a1537a8e a199d272 a1c8d5e4 a32da326 a41bef72 a4380d74 a47a5df9 a4b9e008 a57d2f5b a5a1fcb7 a6e91d69 a7555703 a76b0b59 a78248ec a9bb4554 aa2555ff aac23bc9 ab05ec30 ac095ab5 acc1f5a6 ada671c3 adc44667 adf40d9a ae349d53 ae7fb6f1 aee6cacc aef8a8a1 afc14ee1 afe3deb6 b01b040c b0b85dec b0fdc7e6 b174dc8a b201d30f b290a2a4 b336ed12 b3b33083 b3eec531 b40aa1dc b4275aa0 b43ed31d b4914811 b4bbdea8 b5252878 b57d5271 b58732de b5b509b0 b63b8ba1 b672e510 b6be5dba b742f267 b7a4b4bc b7c75f3c b7f433e4 b8dcb1cb b921306c ba2f8a77 bb09bf55 bb310d0d bbd59129 bbe21b4a bbfac225 bc66a093 bcc983a4 bcd41cfa bdcc5991 be4f0ff9 be6d43f5 bf689235 bf7a4af9 bf892fbb bf8c7064 bfc75105 bff1397d bffff28c c11413fd c129fee3 c12d2998 c17199e3 c1de490f c2a436f4 c369559a c3a0779c c3d139c2 c4367c2a c4c08062 c5774d16 c5a9c614 c62061f9 c62796bf c6340d6d c64b3416 c9eff4af c9f82215 ca694501 ca7bf178 ca8f4f0d cba1bbf9 cba74b3f cc661603 cc71e4d7 ccad60ff cd010f98 ce413d48 ce51d810 cefaaa8c cf781a99 d00cd128 d0414345 d194ab26 d206f295 d2745afb d322a992 d3abd3bf d3def7f0 d4efdc13 d50059f8 d54d5336 d5b57291 d74d0678 d7f1739f d8b69160 d90d3ab1 d9c563f6 da6ea6c2 daf1c65b dbdbd831 df96d90e e01cbac5 e09f756c e10d6ec4 e12e731e e15198c3 e1af64f7 e1f3eebe e224731c e32e0502 e37e24e8 e3c90552 e49840c5 e4d5c06d e4fb3be7 e5e46ed1 e6100fd6 e7cec8d9 e96cec24 e97a98f1 ea35b7ea eadd6e97 ebb7a1e1 ec6be23b ecee6c88 edf00d91 ee588bcf ee6c0b4e eea1694e f04f112d f0851553 f09ba192 f0b5e95f f0c8b1c4 f13db175 f165fea8 f16bef70 f16c1474 f1714929 f1fb3367 f2cb764b f3fcaca4 f4f26995 f555414f f557be6c f5b9f08c f5c2ebc6 f635d519 f6389892 f64dc2bd f670f0e7 f83182cb fa6bf6a5 faeca215 fb03f840 fc5ebaca fc84a8d2 fc9b0750 fd18fb73 fd42d3c6 fe117da7 fe8c2ca2 febca2fc fece7324 ff0c36f5 ff1cc6f6 ff41c522 ff772a91".split(' '));

/* street_snap.js */
// 📸 世界街拍 + 🌃 夜景地图（2026-11-11，样板 样板/世界街拍样板.html、样板/夜景地图样板.html，用户「可以，放进软件」）
// 全世界的人同一周在自己的城市出门拍同一道题（5 天），用自己在学的语言说一句，钉在真实的夜间地球上（NASA 卫星照片，公有领域）。
// 内容 content-skeleton/world_snap/*.json，一周一个文件（build.sh → window.SNAP_WEEKS）。声音：周岚（voices.json 的 world.zhoulan），gen_snap_voices.py → d74_snapvoice.js。照片存在 Supabase docs，coll = 'snaps'（后台/snaps.sql）；没登录只存在自己手机上。
// 进度 snap.v1（同步）。冷启动用已有人物的照片（🎭）。不编数字：人数、城市数都是真的数出来的。
// 对外：window.SNAP = {open, map, card}；地址 #snap 打开今天这一步，#nightmap 打开夜景地图。
(function(){
// 每周一组题（world_snap/<周一>.json）：选 start 最晚、但不晚于今天的那一周
const D = () => { const W = window.SNAP_WEEKS || (window.SNAP_DATA ? [window.SNAP_DATA] : []); if (!W.length) return null; const t = today(); let w = W[0]; W.forEach(x => { if ((x.start || "") <= t) w = x; }); return w; };
const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch(e){ return null; } };
const H = () => window.HVI || {};
const UI = () => (document.documentElement.lang || "zh").slice(0, 2), ZH = () => UI() === "zh";
const T = (zh, en) => ZH() ? zh : ((typeof UI_L10N !== "undefined" && UI_L10N[UI()] && UI_L10N[UI()][zh]) || en), TX = o => o ? (ZH() ? o.zh : o.en) || o.zh || "" : "";
const DAYN = n => T("第 {n} 天", "Day {n}").replace("{n}", n);   // 整句查翻译表，不要一个字一个字拼
const LG = () => (H().LEARN === "zh" ? "zh" : "en"), TTS = () => LG() === "zh" ? "zh-CN" : "en-GB";
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ST = () => { let o = ls("snap.v1") || {}; const id = (D() || {}).id; if (id && o.wk && o.wk !== id) o = {}; o.wk = id; o.done = o.done || {}; return o; };   // 换了一周，从第 1 天重新开始
const SAVE = o => { ls("snap.v1", o); try { window.hvSyncMark && window.hvSyncMark("snap.v1"); } catch(e){} };
const NPC = p => `https://img.heyvoyo.com/npc/${p}.webp`;
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
let AU = null;
const say = (t, lg) => { const l2 = (lg || TTS()).slice(0, 2), k = fnv("snap|" + l2 + "|" + String(t || "").trim()), V = window.SNAP_VOICE_HAS;
  if (V && V.has(k)){ try { speechSynthesis.cancel(); } catch(e){} if (AU) AU.pause(); AU = new Audio("https://img.heyvoyo.com/voice/" + k + ".mp3"); AU.play().catch(() => say0(t, lg)); return; } say0(t, lg); };
const say0 = (t, lg) => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lg || TTS(); u.rate = .9; speechSynthesis.speak(u); } catch(e){} };
const blip = () => { try { if (localStorage.getItem("hv.sound") === "off") return; const A = window.AudioContext || window.webkitAudioContext, ac = blip.ac || (blip.ac = new A()), o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .15); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .16); } catch(e){} };
const CITIES = () => { const P = typeof CLUB_PINS !== "undefined" ? CLUB_PINS : {}; return Object.assign({}, EXTRA, P.cities || {}, P.home || {}); };
const EXTRA = {"西安": [108.9, 34.3], "武汉": [114.3, 30.6], "南京": [118.8, 32.1], "重庆": [106.6, 29.6], "天津": [117.2, 39.1], "苏州": [120.6, 31.3], "长沙": [112.9, 28.2], "青岛": [120.4, 36.1], "厦门": [118.1, 24.5], "昆明": [102.7, 25.0], "哈尔滨": [126.6, 45.8], "大连": [121.6, 38.9], "澳门": [113.5, 22.2], "高雄": [120.3, 22.6], "釜山": [129.1, 35.2], "京都": [135.8, 35.0], "河内": [105.85, 21.0], "利马": [-77.0, -12.0], "波哥大": [-74.1, 4.7], "圣地亚哥": [-70.7, -33.4], "里约热内卢": [-43.2, -22.9], "开罗": [31.2, 30.0], "卡萨布兰卡": [-7.6, 33.6], "利雅得": [46.7, 24.7], "德黑兰": [51.4, 35.7], "卡拉奇": [67.0, 24.9], "达卡": [90.4, 23.8], "阿拉木图": [76.9, 43.2], "基辅": [30.5, 50.45], "布拉格": [14.4, 50.1], "布达佩斯": [19.0, 47.5], "雅典": [23.7, 38.0], "爱丁堡": [-3.2, 55.95], "曼彻斯特": [-2.2, 53.5], "波士顿": [-71.06, 42.36], "西雅图": [-122.3, 47.6], "蒙特利尔": [-73.6, 45.5]};
const r1 = v => Math.round(v * 10) / 10;   // 只记到 0.1 度（约十公里）
const near = ll => { if (!ll) return ""; const C = CITIES(); let best = "", bd = 1e9; for (const k in C){ const dx = (C[k][0] - ll[0]) * Math.cos(ll[1] * Math.PI / 180), dy = C[k][1] - ll[1], dd = dx * dx + dy * dy; if (dd < bd){ bd = dd; best = k; } } return bd < 2.2 ? best : ""; };   // 约 150 公里内最近的城市，只用在卡片角落
const gkey = x => Math.round(x.lat * 2) / 2 + "," + Math.round(x.lon * 2) / 2;
const myLL = () => { const s = ls("snap.ll"); if (s && s.ll) return s.ll; const c = ls("hv.city"), C = CITIES(); return c && C[c] ? C[c] : null; };
const myCity = () => { const c = ls("hv.city"); return c && CITIES()[c] ? c : ""; };
const uid = () => { try { return (H().SOC && H().SOC.uid) || ""; } catch(e){ return ""; } };
// 今天是第几天：做完一天，第二天才开下一天
function dayNow(){ const o = ST(), n = Object.keys(o.done).length, last = Object.values(o.done).map(x => x.date).sort().pop();
  if (n >= 5) return {i: 4, done: true, all: true}; if (last === today()) return {i: n - 1, done: true}; return {i: n, done: false}; }

// ── 活动这一页 ──
let pg = null, step = 0, cur = {};
function mount(){ if (!document.getElementById("snapCss")){ const s = document.createElement("style"); s.id = "snapCss"; s.textContent = CSS; document.head.appendChild(s); }
  if (!pg){ pg = document.createElement("div"); pg.id = "snapPg"; pg.hidden = true; document.body.appendChild(pg); pg.onclick = onClick; } }
function open(){ const d = D(); if (!d) return; mount(); step = 0; cur = {}; { const sl = ls("snap.ll"); if (sl && sl.ll){ cur.ll = sl.ll; cur.place = sl.place || ""; } } pg.hidden = false; document.body.classList.add("snap-on"); draw(); try { window.hvPulse && window.hvPulse("act"); } catch(e){} }
function close(){ if (pg){ pg.hidden = true; document.body.classList.remove("snap-on"); } try { speechSynthesis.cancel(); } catch(e){} if (/^#(snap|nightmap)$/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); }
const host = (html) => `<div class="sn-host"><img class="sn-av" src="https://img.heyvoyo.com/npc/zhoulan/face.webp" alt=""><div class="sn-bub"><b>${esc(T(D().host.nm, D().host.en))}</b> <em>· ${esc(TX(D().host.job))}</em><br>${html}</div></div>`;
function draw(){ const d = D(), now = dayNow(), day = d.days[now.i], o = ST(), lg = LG(), S = day.say[lg] || day.say.en, bud = d.buddy[lg === "zh" ? "zh" : "en"];
  const chips = d.days.map((x, i) => `<span class="${o.done[i] ? "ok" : i === now.i && !now.done ? "on" : ""}">${o.done[i] ? "✓ " : i > now.i || (i === now.i && now.done && !o.done[i]) ? "🔒 " : ""}${i + 1}</span>`).join("");
  let h = `<div class="sn-bar"><button class="sn-x" data-snx>✕</button><b>📸 ${esc(TX(d.t))}</b><button class="sn-mapb" data-snmap>🌃 ${T("看全世界", "World map")}</button></div><div class="sn-in">`;
  if (now.done){ const nx = d.days[now.i + 1];
    h += `<div class="sn-poster" style="background-image:url('${NPC(d.cover)}')"><div><span class="sn-k">${T("今天这一步做完了", "Today's step is done")} ✓</span><h2>${esc(TX(d.t))}</h2></div></div><div class="sn-days">${chips}</div>
      ${host(now.all ? T("五天都拍完了。流行会过去，你喜欢的东西才是你。谢谢你把你的城市拍给世界看。", "All five days done. Trends pass; what you love is you. Thanks for showing your city to the world.") : `${T("明天的题：", "Tomorrow: ")}<b>🔒 ${esc(T("明天早上揭晓", "revealed tomorrow morning"))}</b><br>${T("提示：", "Hint: ")}${esc(nx ? TX(nx.t).slice(0, 4) : "")}……`)}
      <button class="sn-btn" data-snmap>🌃 ${T("看全世界今天拍了什么", "See what the world shot today")}</button>${postcard()}</div>`;
    pg.innerHTML = h; return; }
  if (step === 0) h += `<div class="sn-poster" style="background-image:url('${NPC(d.cover)}')"><div><span class="sn-k">${DAYN(now.i + 1)} · ${esc(TX(day.t))}</span><h2>${esc(TX(d.t))}</h2><p>${esc(TX(d.sub))}</p></div></div><div class="sn-days">${chips}</div>
      ${host(`${esc(TX(day.task))}<br>${T("拍下来，然后用你在学的语言，对世界说一句：", "Then, in the language you're learning, say one line to the world:")}<span class="sn-tl" data-say="${esc(S.f.replace("{a}", S.a[0][0]).replace("{b}", S.b[0][0]))}">${esc(S.f.replace("{a}", S.a[0][0]).replace("{b}", S.b[0][0]))}</span>`)}
      <div class="sn-host"><span class="sn-av" data-nopy style="background:#2f7d70">${esc(bud[0][0])}</span><div class="sn-bub"><b>${esc(bud[0])}</b> <em>· ${esc(bud[1])}</em><br>${now.i === 0 ? T("我们一起拍五天吧！拍完在地图上找找我。", "Let's shoot all five days together! Find me on the map.") : T("今天我也出门拍，地图上见。", "I'm going out to shoot too — see you on the map.")}</div></div>
      <button class="sn-btn" data-snnext>${day.guess ? T("先猜一题 →", "Guess first →") : T("出门拍 →", "Go and shoot →")}</button>`;
  else if (step === 1 && day.guess){ const g = day.guess;
    h += `<h3>${T("先猜", "Guess first")}</h3><p class="sn-sub">${esc(TX(g.q))}</p><div class="sn-opts${cur.g != null ? " rev" : ""}">${g.opts.map((x, k) => `<button class="sn-opt${cur.g === k ? " pick" : ""}${cur.g != null && k === g.ans ? " win" : ""}" data-sng="${k}"><b>${x[0]}</b>${esc(ZH() ? x[1] : x[2])}</button>`).join("")}</div>
      ${cur.g != null ? `<div class="sn-why">🌍 ${esc(TX(g.why))}</div><button class="sn-btn" data-snnext>${T("出门拍 →", "Go and shoot →")}</button>` : ""}`; }
  else { const fr = S.f.replace("{a}", `<span class="sn-slot">${esc(cur.a != null ? S.a[cur.a][0] : "？")}</span>`).replace("{b}", `<span class="sn-slot">${esc(cur.b != null ? S.b[cur.b][0] : "？")}</span>`), C = CITIES();
    h += `<h3>${T("出门拍", "Go and shoot")}</h3><p class="sn-sub">${esc(TX(day.task))}</p>
      <label class="sn-shot${cur.img ? " got" : ""}" ${cur.img ? `style="background-image:url('${cur.img}')"` : ""}>${cur.img ? "" : `📷<br>${T("拍一张，或者从相册选", "Take a photo or pick one")}`}<input type="file" accept="image/*" capture="environment" data-snfile hidden></label>
      <div class="sn-tip"><img class="sn-av s" src="https://img.heyvoyo.com/npc/zhoulan/face.webp" alt=""><div><b>${T("周岚的小招：", "Zhou Lan's trick: ")}</b>${esc(TX(day.tip))}</div></div>
      ${cur.img ? `<div class="sn-frame"><div class="sn-lamp">${cur.ll ? `💡 ${T("你的灯点在：", "Your light: ")}<b>${esc(cur.place ? T(cur.place + " 附近", "near " + cur.place) : T("地球上的这里", "this spot on Earth"))}</b> <button class="sn-link inl" data-snlamp>${T("换一个", "change")}</button>` : `<b>💡 ${T("你的灯点在哪里？", "Where does your light go?")}</b><div class="sn-lb"><button data-snloc>📍 ${T("用我现在的大概位置", "Use my rough location")}</button><button data-snpick>🌃 ${T("在夜景地图上点", "Tap it on the night map")}</button></div><input data-sncityin list="snCities" placeholder="${T("或者输入城市名", "or type a city")}"><datalist id="snCities">${Object.keys(C).sort().map(c => `<option value="${esc(c)}">`).join("")}</datalist><small>${T("只记到大约十公里，地图上不写地名。", "Only roughly (~10 km). No place names on the map.")}</small>`}</div>
        <div class="sn-sub" style="text-align:center;margin:10px 0 0">${T("对世界说一句：", "Say one line to the world:")}</div>
        <div class="sn-say">${fr}</div><div class="sn-chips">${S.a.map((x, k) => `<button class="sn-chip${cur.a === k ? " on" : ""}" data-sna="${k}">${esc(x[0])}<small>${esc(x[1])}</small></button>`).join("")}</div>
        <div class="sn-chips">${S.b.map((x, k) => `<button class="sn-chip${cur.b === k ? " on" : ""}" data-snb="${k}">${esc(x[0])}<small>${esc(x[1])}</small></button>`).join("")}</div>
        <button class="sn-mic${cur.rec ? " rec" : ""}" data-snmic>🎤</button><p class="sn-sub" style="text-align:center">${cur.said ? "✓ " + esc(cur.said) : cur.a == null || cur.b == null ? T("先选两个，再说出来", "Pick both, then say it") : T("点一下，说出这一句", "Tap and say the line")}</p>
        ${cur.said ? `<button class="sn-btn" data-snpost>💡 ${T("点亮我的灯，送给世界", "Light my lamp — send it to the world")}</button><button class="sn-btn sn-keep" data-snkeep>🔒 ${T("只留给自己", "Keep it to myself")}<small>${T("照片和这一句只存在这台手机上，不点灯，不上传", "The photo and the line stay on this phone only — no lamp, no upload")}</small></button>` : cur.a != null && cur.b != null ? `<button class="sn-link" data-snskip>${T("现在不方便说话？先不说", "Can't talk right now? Skip saying it")}</button>` : ""}</div>` : ""}`; }
  pg.innerHTML = h + `</div>`; }
function postcard(){ const o = ST(); return `<div class="sn-card5">${[0, 1, 2, 3, 4].map(i => o.done[i] && (o.done[i].th || (KEEP()[o.wk + "|" + i] || {}).th) ? `<div style="background-image:url('${o.done[i].th || KEEP()[o.wk + "|" + i].th}')"></div>` : `<div>${o.done[i] ? "✓" : "🔒"}</div>`).join("")}</div><p class="sn-sub" style="text-align:center">${T("你的五张明信片", "Your five postcards")}</p>`; }
function shrink(file, max, q){ return new Promise(ok => { const im = new Image(); im.onload = () => { const r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", q)); URL.revokeObjectURL(im.src); }; im.onerror = () => ok(""); im.src = URL.createObjectURL(file); }); }
// 🔒 只留给自己（2026-11-12）：照片和那一句只存在这台手机上（snap.keep，不同步），snap.v1 里只记「这一天做过」，不点灯，不上传
const KEEP = () => ls("snap.keep") || {};
async function keep(){ const d = D(), now = dayNow(), day = d.days[now.i], lg = LG(), S = day.say[lg] || day.say.en;
  const line = S.f.replace("{a}", S.a[cur.a][0]).replace("{b}", S.b[cur.b][0]), th = cur.file ? await shrink(cur.file, 240, .7) : "";
  const K = KEEP(); K[d.id + "|" + now.i] = {t: line, th, date: today()}; try { localStorage.setItem("snap.keep", JSON.stringify(K)); } catch(e){}
  const o = ST(); o.done[now.i] = {date: today(), keep: true}; if (!o.start) o.start = today(); SAVE(o);
  const s = document.createElement("div"); s.className = "sn-stamp"; s.innerHTML = `${T("只留给自己了", "KEPT")} 🔒<br><small>DAY ${now.i + 1}</small>`; pg.appendChild(s); blip();
  setTimeout(() => { s.remove(); draw(); }, 1300); }
async function post(){ const d = D(), now = dayNow(), day = d.days[now.i], lg = LG(), S = day.say[lg] || day.say.en, ll = cur.ll, city = cur.place || "";
  const line = S.f.replace("{a}", S.a[cur.a][0]).replace("{b}", S.b[cur.b][0]), mean = S.f === day.say.zh.f ? day.say.en.f.replace("{a}", day.say.en.a[cur.a][0]).replace("{b}", day.say.en.b[cur.b][0]) : day.say.zh.f.replace("{a}", day.say.zh.a[cur.a][0]).replace("{b}", day.say.zh.b[cur.b][0]);
  const th = await shrink(cur.file, 240, .7), o = ST(); o.done[now.i] = {date: today(), t: line, city, ll, th, tag: S.a[cur.a][2] || ""}; if (!o.start) o.start = today(); SAVE(o);
  let sent = false;
  if (uid() && H().SOC && H().SOC.db){ try { const img = await shrink(cur.file, 900, .72); await H().SOC.db.collection("snaps").doc().set({author: uid(), act: d.id, d: now.i, city, lon: ll ? ll[0] : null, lat: ll ? ll[1] : null, l: lg, t: line, m: mean, tag: S.a[cur.a][2] || "", nm: (H().myName && H().myName()) || "", img, ts: Date.now()}); sent = true; } catch(e){ sent = false; } }
  const s = document.createElement("div"); s.className = "sn-stamp"; s.innerHTML = `${T("送给世界了", "SENT")} ✓<br><small>DAY ${now.i + 1}</small>`; pg.appendChild(s); blip(); try { window.hvPx && window.hvPx({k: "gift", to: "world"}); } catch(e){}
  setTimeout(() => { s.remove(); draw(); map(now.i, {fly: ll}); if (!sent){ const n = document.createElement("div"); n.className = "sn-note"; n.innerHTML = uid() ? T("网络不太好，照片先存在你手机上了。", "Network trouble — the photo is saved on your phone for now.") : `${T("照片先存在你手机上。登录以后，别人才能在世界地图上看到它。", "Saved on your phone. Log in so others can see it on the world map.")} <button class="sn-link" data-snlogin>${T("登录", "Log in")}</button>`; pg.querySelector(".sn-in").prepend(n); } }, 1300); }
function onClick(e){ const t = e.target, c = s => t.closest(s);
  if (c("[data-snx]")){ close(); return; } if (c("[data-snmap]")){ map(); return; } if (c("[data-snlogin]")){ try { H().login && H().login(); } catch(_){} return; }
  if (c("[data-say]")){ say(c("[data-say]").dataset.say); return; }
  if (c("[data-snnext]")){ step = step === 0 && D().days[dayNow().i].guess ? 1 : 2; draw(); pg.scrollTop = 0; return; }
  if (c("[data-sng]")){ if (cur.g != null) return; cur.g = +c("[data-sng]").dataset.sng; blip(); draw(); return; }
  if (c("[data-sna]")){ cur.a = +c("[data-sna]").dataset.sna; cur.said = ""; const S = D().days[dayNow().i].say[LG()] || D().days[dayNow().i].say.en; say(S.a[cur.a][0]); draw(); return; }
  if (c("[data-snb]")){ cur.b = +c("[data-snb]").dataset.snb; cur.said = ""; const S = D().days[dayNow().i].say[LG()] || D().days[dayNow().i].say.en; say(S.b[cur.b][0]); draw(); return; }
  if (c("[data-snskip]")){ cur.said = "…"; draw(); return; }   // 不方便说话：也先让人选「送给世界 / 只留给自己」（2026-11-12）
  if (c("[data-snkeep]")){ keep(); return; }
  if (c("[data-snpost]")){ if (!cur.ll){ const l = pg.querySelector(".sn-lamp"); if (l){ l.classList.add("need"); l.scrollIntoView({block: "center", behavior: "smooth"}); } return; } post(); return; }
  if (c("[data-snlamp]")){ cur.ll = null; draw(); return; }
  if (c("[data-snloc]")){ const b = c("[data-snloc]"); b.textContent = "…"; if (!navigator.geolocation){ b.textContent = T("这台设备定位不了", "No location here"); return; }
    navigator.geolocation.getCurrentPosition(p => setLL([p.coords.longitude, p.coords.latitude]), () => { b.textContent = T("定位不了，换一个办法吧", "Couldn't locate — try another way"); }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000}); return; }
  if (c("[data-snpick]")){ map(dayNow().i, {pick: ll => setLL(ll)}); return; }
  if (c("[data-snmic]")){ if (cur.a == null || cur.b == null || cur.rec) return; const S = D().days[dayNow().i].say[LG()] || D().days[dayNow().i].say.en, line = S.f.replace("{a}", S.a[cur.a][0]).replace("{b}", S.b[cur.b][0]), h = H();
    if (!h.recStart || !h.canRec){ cur.said = line; blip(); draw(); return; }
    cur.rec = true; draw(); let txt = "", hd = null; const fin = v => { if (!cur.rec) return; cur.rec = false; cur.said = (v && v.text) || txt || line; blip(); draw(); };
    h.recStart({lang: TTS(), onText: x => { txt = x; }, onDone: fin, onError: () => fin(null)}).then(x => { hd = x; if (!x) fin(null); else setTimeout(() => hd && hd.stop && hd.stop(), 7000); }); return; } }
document.addEventListener("change", async e => { if (e.target.matches("[data-snfile]") && e.target.files[0]){ cur.file = e.target.files[0]; cur.img = await shrink(cur.file, 900, .72); blip(); draw(); }
  if (e.target.matches("[data-sncityin]")){ const C = CITIES(), v = e.target.value.trim(); if (C[v]) setLL(C[v], v); } });
function setLL(ll, place){ cur.ll = [r1(ll[0]), r1(ll[1])]; cur.place = place || near(cur.ll); ls("snap.ll", {ll: cur.ll, place: cur.place}); blip(); draw(); }

// ── 夜景地图 ──
let mp = null, MS = 1, MX = 0, MY = 0, BW = 0, BH = 0, mday = 0, ITEMS = [], showRoute = false;
const BASE = "https://img.heyvoyo.com/map/earth_night.webp";   // NASA Earth Observatory / NOAA NGDC「The earth at night」（公有领域，维基共享资源 3840 宽），转成 webp 放在 R2
const P = (lon, lat) => [(lon + 180) / 360, (90 - lat) / 180];
async function loadDay(i){ const d = D(), C = CITIES(), day = d.days[i], out = [];
  (day.seeds || []).forEach(s => { const ll = C[s[0]]; if (ll) out.push({city: s[0], lon: ll[0], lat: ll[1], img: NPC(s[1]), l: s[2], t: s[3], m: s[4], tag: s[5], seed: true}); });
  try { if (typeof HV !== "undefined" && HV.sb){ const r = await HV.sb.from("docs").select("id,owner,data").eq("coll", "snaps").eq("data->>act", d.id).eq("data->>d", String(i)).order("created_at", {ascending: false}).limit(400);
    (r.data || []).forEach(x => { const v = x.data || {}; if (v.hid === true || v.lon == null) return; out.push({id: x.id, own: x.owner === uid(), city: v.city, lon: v.lon, lat: v.lat, img: v.img, l: v.l, t: v.t, m: v.m, tag: v.tag, nm: v.nm}); }); } } catch(e){}
  const o = ST().done[i], oll = o && (o.ll || (C[o.city] || null)); if (oll && !o.keep && !out.some(x => x.own)) out.push({own: true, local: true, city: o.city || "", lon: oll[0], lat: oll[1], img: o.th, t: o.t, m: "", tag: o.tag});
  return out; }
let MOPT = {};
function map(i, opt){ const d = D(); if (!d) return; mount(); MOPT = opt || {}; if (!mp){ mp = document.createElement("div"); mp.id = "snapMap"; document.body.appendChild(mp); }
  mday = i != null ? i : Math.min(4, dayNow().i); mp.hidden = false; document.body.classList.add("snap-on"); MS = 1; layout.d = 0;
  mp.innerHTML = `<div class="nm-vp"><div class="nm-w"><img class="nm-base" src="${BASE}" alt=""><svg class="nm-routes" viewBox="0 0 1000 500" preserveAspectRatio="none"></svg></div></div>
   <div class="nm-top"><button class="nm-x" data-nmx>✕</button><h1>${MOPT.pick ? T("点一下你住的地方", "Tap where you live") : T("这一刻，世界在说什么", "What the world is saying")}</h1><p>${esc(TX(d.t))} · ${DAYN(mday + 1)}${T("：", ": ")}${esc(TX(d.days[mday].t))}</p><span class="nm-live" data-nmlive>…</span>
   <div class="nm-chips">${d.days.map((x, k) => `<button class="nm-chip${k === mday ? " on" : ""}" data-nmday="${k}">${x.e} ${k + 1}</button>`).join("")}<button class="nm-chip" data-nmroute>🔗 ${T("同一样东西", "Same thing")}</button></div></div>
   <div class="nm-zb"><button data-nmz="1.5">＋</button><button data-nmz="0.667">－</button></div>
   <div class="nm-bottom"${MOPT.pick ? " hidden" : ""}><button class="nm-b lt" data-nmfull>▶ ${T("一张一张看", "One by one")}</button><button class="nm-b" data-nmgo>📸 ${T("我也去拍", "Shoot mine")}</button></div>
   <div class="nm-sheet"></div><div class="nm-full"><button class="nm-x" data-nmfx>✕</button><div class="nm-fs"></div></div>
   <div class="nm-credit">Earth at night: NASA / NOAA NGDC (public domain)</div>`;
  mp.querySelector(".nm-base").onload = layout; wire(); layout(); loadDay(mday).then(L => { ITEMS = L; pins(); if (MOPT.fly) fly(MOPT.fly); }); }
function fly(ll){ const vp = mp.querySelector(".nm-vp").getBoundingClientRect(), [x, y] = P(ll[0], ll[1]); MS = 3.5; MX = vp.width / 2 - x * BW * MS; MY = vp.height / 2 - y * BH * MS; apply();
  const me = mp.querySelector(".nm-city.me"); if (me){ me.classList.remove("flash"); void me.offsetWidth; me.classList.add("flash"); } const t = document.createElement("div"); t.className = "nm-toast"; t.textContent = T("💡 你的灯亮了，世界看得见", "💡 Your light is on — the world can see it"); mp.appendChild(t); setTimeout(() => t.remove(), 2600); }
function layout(){ if (!mp) return; const vp = mp.querySelector(".nm-vp"), r = vp.getBoundingClientRect(), w = mp.querySelector(".nm-w"); BW = Math.max(r.width, r.height * 1.25); BH = BW / 2; w.style.width = BW + "px"; w.style.height = BH + "px";
  if (!layout.d){ layout.d = 1; const me = myLL(); const cx = me ? P(me[0], me[1])[0] : .62; MX = r.width / 2 - BW * cx; MY = (r.height - BH) / 2 + 50; } apply(); }
function apply(){ const vp = mp.querySelector(".nm-vp"), r = vp.getBoundingClientRect(), w = mp.querySelector(".nm-w"); MX = Math.min(0, Math.max(r.width - BW * MS, MX)); MY = Math.min(r.height * .3, Math.max(r.height * .7 - BH * MS, MY));
  w.style.transform = `translate(${MX}px,${MY}px) scale(${MS})`; w.classList.toggle("zoomed", MS >= 2.2); w.querySelectorAll(".nm-city").forEach(c => c.style.transform = `translate(-50%,-50%) scale(${1 / MS})`); w.querySelectorAll(".nm-empty").forEach(c => c.style.transform = `translate(-50%,-100%) scale(${1 / MS})`); }
function zoomAt(f, cx, cy){ const ns = Math.min(9, Math.max(1, MS * f)); MX = cx - (cx - MX) * ns / MS; MY = cy - (cy - MY) * ns / MS; MS = ns; apply(); }
function groups(){ const G = {}; ITEMS.forEach(x => { const k = gkey(x); (G[k] = G[k] || {k, city: x.city, lon: x.lon, lat: x.lat, L: []}).L.push(x); if (!G[k].city && x.city) G[k].city = x.city; }); return Object.values(G); }
function pins(){ const w = mp.querySelector(".nm-w"); w.querySelectorAll(".nm-city,.nm-empty").forEach(x => x.remove()); const G = groups(), real = ITEMS.filter(x => !x.seed).length;
  G.forEach((g, i) => { const [x, y] = P(g.lon, g.lat), n = g.L.length, own = g.L.some(v => v.own), top = g.L.find(v => v.own) || g.L[0], gl = 16 + Math.sqrt(n) * 10, el = document.createElement("div");
    el.className = "nm-city" + (own ? " me" : ""); el.style.left = x * 100 + "%"; el.style.top = y * 100 + "%"; el.dataset.g = i;
    el.innerHTML = `<div class="nm-glow" style="width:${gl}px;height:${gl}px"></div><div class="nm-hit"></div><div class="nm-lamp${n > 1 ? " many" : ""}"><b style="background-image:url('${esc(top.img)}')"></b></div><div class="nm-lbl" data-nopy>${esc(String(top.t || "").slice(0, 12))}${String(top.t || "").length > 12 ? "…" : ""}${n > 1 ? `<i> · ${n}</i>` : ""}</div>`; w.appendChild(el); });
  const me = myLL(); if (me && !ITEMS.some(v => v.own) && !MOPT.pick){ const [x, y] = P(me[0], me[1]), e = document.createElement("div"); e.className = "nm-empty"; e.style.left = x * 100 + "%"; e.style.top = y * 100 + "%"; e.innerHTML = `💡<br>${T("你的灯", "your light")}<br>${T("还没亮", "isn't on")}`; e.dataset.nmgo = 1; w.appendChild(e); }
  const live = mp.querySelector("[data-nmlive]"); if (live) live.innerHTML = MOPT.pick ? T("拉近、再点一下。只记到大约十公里，地图上不写地名。", "Zoom in and tap. Only roughly (~10 km), no place names.") : real ? `💡 ${T("今天地球上亮了", "Lights on Earth today:")} <b>${real}</b> ${T("盏灯", real === 1 ? "" : "")}` : T("今天还没有人点灯，你可以点亮第一盏 ✨", "No lights yet today — you could light the first ✨");
  route(); apply(); }
// 同一样东西在好几个城市：按标签找出现城市最多的那个，连起来
function route(){ const svg = mp.querySelector(".nm-routes"), by = {}; ITEMS.forEach(x => { if (x.tag && x.tag !== "other") (by[x.tag] = by[x.tag] || new Map()).set(gkey(x), x); });
  const best = Object.entries(by).sort((a, b) => b[1].size - a[1].size)[0]; svg.innerHTML = ""; mp.querySelector("[data-nmroute]").hidden = !best || best[1].size < 2;
  if (!best || best[1].size < 2 || !showRoute) return; const L = [...best[1].values()].sort((a, b) => a.lon - b.lon);
  svg.innerHTML = L.slice(1).map((c, k) => { const a = P(L[k].lon, L[k].lat), b = P(c.lon, c.lat), x0 = a[0] * 1000, y0 = a[1] * 500, x1 = b[0] * 1000, y1 = b[1] * 500; return `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.min(y0, y1) - Math.abs(x1 - x0) * .18} ${x1} ${y1}"/>`; }).join(""); }
function sheet(g){ const sh = mp.querySelector(".nm-sheet"), d = D();
  sh.innerHTML = `<div class="nm-gr"></div><div class="nm-strip">${g.L.map(v => `<div class="nm-pc" style="background-image:url('${esc(v.img)}')"><div class="nm-ov"><b data-say="${esc(v.t)}" data-lg="${v.l === "zh" ? "zh-CN" : "en-GB"}">${esc(v.t)} <i>🔊</i></b><small>${esc(v.m || "")}</small><span>${v.seed ? "🎭 " + T("角色", "character") : v.own ? T("你", "you") : esc(v.nm || (v.l === "zh" ? T("一位在学中文的人", "someone learning Chinese") : T("一位在学英语的人", "someone learning English")))}${v.city ? " · " + esc(T(v.city + " 附近", "near " + v.city)) : ""}${v.id && !v.own ? ` · <button data-nmrep="${esc(v.id)}">${T("举报", "Report")}</button>` : ""}</span></div></div>`).join("")}</div>
    ${dayNow().done ? `<p class="nm-done">${T("你今天的灯已经亮了 ✓ 明天的题早上揭晓", "Your light is on today ✓ Tomorrow's prompt opens in the morning")}</p>` : `<button class="nm-b go" data-nmgo>📸 ${T("你也拍一张", "Shoot yours")} · ${esc(TX(d.days[dayNow().i].t))}</button>`}`; sh.classList.add("on"); }
function wire(){ const vp = mp.querySelector(".nm-vp"); let drag = null, pts = new Map(), pinch = 0, moved = 0;
  vp.onpointerdown = e => { pts.set(e.pointerId, e); moved = 0; if (pts.size === 1) drag = {x: e.clientX - MX, y: e.clientY - MY}; };
  vp.onpointermove = e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e); if (pts.size === 2){ const [a, b] = [...pts.values()], dd = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pinch) zoomAt(dd / pinch, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2); pinch = dd; moved = 9; return; }
    if (drag){ moved++; MX = e.clientX - drag.x; MY = e.clientY - drag.y; apply(); } };
  vp.onpointerup = vp.onpointercancel = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) drag = null; };
  vp.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY); }, {passive: false});
  mp.onclick = e => { const t = e.target, c = s => t.closest(s);
    if (c("[data-nmx]")){ mp.hidden = true; if (pg && pg.hidden) document.body.classList.remove("snap-on"); return; }
    if (c("[data-nmgo]")){ mp.hidden = true; open(); return; }
    if (c("[data-nmz]")){ zoomAt(+c("[data-nmz]").dataset.nmz, innerWidth / 2, innerHeight / 2); return; }
    if (c("[data-nmday]")){ map(+c("[data-nmday]").dataset.nmday); return; }
    if (c("[data-nmroute]")){ showRoute = !showRoute; c("[data-nmroute]").classList.toggle("on", showRoute); route(); return; }
    if (c("[data-nmrep]")){ const id = c("[data-nmrep]").dataset.nmrep; try { if (uid()) H().SOC.db.collection("reports").add({by: uid(), target: "snaps/" + id, ts: Date.now()}); } catch(_){} ITEMS = ITEMS.filter(x => x.id !== id); pins(); mp.querySelector(".nm-sheet").classList.remove("on"); return; }
    if (c("[data-say]")){ say(c("[data-say]").dataset.say, c("[data-say]").dataset.lg); return; }
    if (c("[data-nmfull]")){ const L = ITEMS.slice().sort(() => Math.random() - .5); mp.querySelector(".nm-fs").innerHTML = L.map(v => `<div class="nm-fc" style="background-image:url('${esc(v.img)}')"><div class="nm-cap"><b>${esc(v.t)}</b><small>${esc(v.m || "")}</small><small style="opacity:.6">${v.seed ? "🎭 " + T("角色", "character") : v.l === "zh" ? T("一位在学中文的人", "someone learning Chinese") : T("一位在学英语的人", "someone learning English")}</small></div></div>`).join("") || `<div class="nm-fc"><div class="nm-cap"><b>${T("还没有照片", "No photos yet")}</b></div></div>`; mp.querySelector(".nm-full").classList.add("on"); return; }
    if (c("[data-nmfx]")){ mp.querySelector(".nm-full").classList.remove("on"); return; }
    if (MOPT.pick && moved < 4 && c(".nm-vp")){ const w = mp.querySelector(".nm-w").getBoundingClientRect(), fx = (e.clientX - w.left) / w.width, fy = (e.clientY - w.top) / w.height; if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
      const ll = [fx * 360 - 180, 90 - fy * 180], cb = MOPT.pick; MOPT = {}; mp.hidden = true; cb(ll); return; }
    const city = c(".nm-city"); if (city && moved < 4){ sheet(groups()[+city.dataset.g]); return; }
    if (!c(".nm-sheet") && moved < 4) mp.querySelector(".nm-sheet").classList.remove("on"); }; }
addEventListener("resize", () => { if (mp && !mp.hidden) layout(); });

// ── 入口卡（活动日历下面、「今天」页）──
function card(){ const d = D(); if (!d) return ""; mount(); const now = dayNow(), day = d.days[now.i];
  return `<div class="sn-entry" style="background-image:url('${NPC(d.cover)}')"><div class="sn-eg"></div><div class="sn-et"><span class="sn-k">📸 ${T("这周 · 全世界一起拍", "This week · the whole world")}</span><b>${esc(TX(d.t))}</b>
    <small>${now.all ? T("五天都拍完了 ✓", "All five days done ✓") : now.done ? T("今天拍完了 ✓ 明天的题还锁着", "Done for today ✓ Tomorrow's is locked") : `${DAYN(now.i + 1)}${T("：", ": ")}${esc(TX(day.t))}`}</small>
    <span class="sn-ebtns">${now.done ? "" : `<button data-snopen>${T("今天去拍", "Shoot today")}</button>`}<button class="lt" data-snmapopen>🌃 ${T("看全世界", "World map")}</button></span></div></div>`; }
document.addEventListener("click", e => { if (e.target.closest("[data-snopen]")){ e.preventDefault(); open(); } else if (e.target.closest("[data-snmapopen]")){ e.preventDefault(); map(); } });
const fromHash = () => { if (location.hash === "#snap") setTimeout(open, 1500); else if (location.hash === "#nightmap") setTimeout(() => map(), 1500); };
fromHash(); window.addEventListener("hashchange", () => { if (location.hash === "#snap") open(); else if (location.hash === "#nightmap") map(); });
window.SNAP = {open, close, map, card, isOpen: () => !!((pg && !pg.hidden) || (mp && !mp.hidden))};

const CSS = `#snapPg{position:fixed;inset:0;z-index:63;background:#fbf7ee;color:#24303a;overflow-y:auto}body.snap-on{overflow:hidden}
.sn-bar{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;padding:10px 14px;background:#fbf7ee;border-bottom:1px solid #e6dfcf;font-size:14px}.sn-bar b{flex:1;color:#14305c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sn-x{border:0;background:#efe8d8;width:32px;height:32px;border-radius:50%;cursor:pointer}.sn-mapb{border:0;background:#0b1430;color:#ffe2a0;border-radius:99px;padding:6px 11px;font-weight:700;cursor:pointer}
.sn-in{max-width:560px;margin:0 auto;padding:14px 16px 60px}
.sn-poster{position:relative;min-height:260px;border-radius:18px;overflow:hidden;color:#fff;background:#333 center 40%/cover;display:flex;align-items:flex-end}.sn-poster::before{content:"";position:absolute;inset:0;background:linear-gradient(transparent 35%,rgba(0,0,0,.8))}
.sn-poster>div{position:relative;padding:16px}.sn-poster h2{margin:8px 0 4px;font:900 26px/1.25 "Noto Serif SC",serif}.sn-poster p{margin:0;font-size:13px;opacity:.92}
.sn-k{display:inline-block;background:#e2552f;color:#fff;font-weight:800;font-size:12px;border-radius:99px;padding:3px 10px}
.sn-days{display:flex;gap:6px;margin:10px 0}.sn-days span{flex:1;text-align:center;font-size:12px;padding:6px 0;border-radius:99px;background:#fff;border:1.5px solid #e6dfcf;color:#6b7488;font-weight:700}.sn-days .on{background:#14305c;border-color:#14305c;color:#fff}.sn-days .ok{background:#e6f1ef;border-color:#bfdcd5;color:#2f7d70}
.sn-host{display:flex;gap:10px;align-items:flex-start;margin:12px 0}.sn-av{width:40px;height:40px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:800;color:#fff;background:#3b4a5e;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.12)}.sn-av.s{width:30px;height:30px;font-size:13px}img.sn-av{object-fit:cover;object-position:50% 25%;background:#3b4a5e}
.sn-bub{background:#fff;border-radius:4px 16px 16px 16px;padding:10px 12px;box-shadow:0 2px 8px rgba(20,48,92,.07);font-size:14.5px}.sn-bub b{color:#14305c}.sn-bub em{font-style:normal;color:#6b7488;font-size:12.5px}
.sn-tl{display:block;font:700 17px/1.5 "Noto Serif SC",Georgia,serif;color:#14305c;margin:4px 0 0;cursor:pointer}
.sn-btn.sn-keep{background:#fff;color:#14305c;box-shadow:0 0 0 1.5px #e6dfcf}.sn-btn.sn-keep small{display:block;font-weight:500;font-size:12px;color:#6b7488;margin-top:2px}
.sn-btn{display:block;width:100%;border:0;border-radius:99px;padding:12px 18px;font-weight:800;background:#e2552f;color:#fff;margin-top:10px;cursor:pointer;box-shadow:0 4px 12px rgba(226,85,47,.3)}
.sn-link{border:0;background:none;color:#6b7488;text-decoration:underline;cursor:pointer;display:block;margin:8px auto 0;font-size:13px}
#snapPg h3{font:900 19px Georgia,"Noto Serif SC",serif;color:#14305c;margin:4px 0}.sn-sub{color:#6b7488;font-size:13.5px;margin:2px 0 10px}
.sn-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn-opt{background:#fff;border:2px solid #e6dfcf;border-radius:14px;padding:10px;font-weight:700;color:#14305c;cursor:pointer}.sn-opt b{display:block;font-size:24px}.rev .sn-opt.pick{border-color:#e2552f}.rev .sn-opt.win{background:#fff4ee;border-color:#e2552f}
.sn-why{background:#fff4ee;border-left:3px solid #e2552f;border-radius:8px;padding:9px 11px;font-size:14px;margin-top:10px}
.sn-shot{display:grid;place-items:center;height:240px;border:2px dashed #d8cfba;border-radius:16px;text-align:center;color:#6b7488;background:#fffdf8 center/cover;cursor:pointer}.sn-shot.got{border:0}
.sn-tip{display:flex;gap:8px;align-items:flex-start;background:#fff;border-radius:14px;padding:9px 11px;margin-top:10px;font-size:13.5px;box-shadow:0 2px 8px rgba(20,48,92,.06)}
.sn-frame{background:#fff;border-radius:16px;padding:14px;box-shadow:0 2px 10px rgba(20,48,92,.07);margin-top:10px}.sn-row select{font:inherit;border:1.5px solid #e6dfcf;border-radius:99px;padding:5px 10px;background:#fff}.sn-row select.need{border-color:#e2552f}
.sn-say{font:900 19px/1.7 "Noto Serif SC",Georgia,serif;color:#14305c;text-align:center;margin-top:8px}.sn-slot{display:inline-block;min-width:56px;border-bottom:3px solid #e2552f;color:#e2552f}
.sn-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}.sn-chip{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:5px 11px;font-weight:700;color:#14305c;cursor:pointer}.sn-chip.on{background:#14305c;color:#fff;border-color:#14305c}.sn-chip small{display:block;font-size:10px;font-weight:500;opacity:.7}
.sn-mic{width:64px;height:64px;border-radius:50%;border:0;background:#e2552f;color:#fff;font-size:26px;display:block;margin:10px auto 4px;cursor:pointer;box-shadow:0 6px 16px rgba(226,85,47,.35)}.sn-mic.rec{animation:snp 1s infinite}@keyframes snp{50%{box-shadow:0 0 0 14px rgba(226,85,47,.15)}}
.sn-stamp{position:fixed;left:50%;top:40%;transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0;border:4px solid #e2552f;color:#e2552f;border-radius:12px;padding:8px 14px;font:900 22px Georgia,serif;text-align:center;background:rgba(251,247,238,.95);z-index:70;animation:snst .45s forwards}@keyframes snst{to{opacity:1;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}
.sn-note{background:#fff8e6;border:1px dashed #d9b86a;border-radius:12px;padding:8px 12px;font-size:13px;margin-bottom:10px}
.sn-card5{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:14px}.sn-card5 div{aspect-ratio:3/4;border-radius:8px;background:#efe8d8 center/cover;display:grid;place-items:center;color:#6b7488;font-size:13px}
.sn-entry{position:relative;min-height:170px;border-radius:18px;overflow:hidden;margin:8px 0 16px;background:#333 center 40%/cover;color:#fff}.sn-eg{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.15))}
.sn-et{position:relative;padding:16px;max-width:80%;display:flex;flex-direction:column;gap:4px}.sn-et b{font:900 21px/1.25 "Noto Serif SC",Georgia,serif}.sn-et small{opacity:.92;font-size:13px}.sn-et .sn-k{align-self:flex-start}
.sn-ebtns{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}.sn-ebtns button{border:0;border-radius:99px;padding:8px 14px;font-weight:800;background:#e2552f;color:#fff;cursor:pointer}.sn-ebtns .lt{background:#0b1430;color:#ffe2a0}
#snapMap{position:fixed;inset:0;z-index:64;background:#02050c;color:#fff;overflow:hidden}
.nm-vp{position:absolute;inset:0;overflow:hidden;cursor:grab;touch-action:none}.nm-w{position:absolute;left:0;top:0;transform-origin:0 0}.nm-base{display:block;width:100%;height:100%;user-select:none;-webkit-user-drag:none;filter:brightness(.85)}
.nm-routes{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}.nm-routes path{fill:none;stroke:#ffd27a;stroke-width:.6;stroke-dasharray:3 3;animation:nmd 2s linear infinite}@keyframes nmd{to{stroke-dashoffset:-12}}
.nm-city{position:absolute}.nm-glow{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,226,150,.95) 0,rgba(255,190,90,.55) 25%,rgba(255,160,60,.18) 55%,transparent 72%);animation:nmb 3.2s ease-in-out infinite;pointer-events:none}@keyframes nmb{50%{opacity:.65}}
.nm-hit{position:absolute;left:50%;top:50%;width:30px;height:30px;transform:translate(-50%,-50%);border-radius:50%;cursor:pointer}
.nm-lbl{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;font-size:10px;color:rgba(255,236,200,.9);text-shadow:0 1px 3px #000;display:none;margin-top:2px}
.zoomed .nm-lamp,.zoomed .nm-lbl{display:block}.nm-empty{position:absolute;display:none;width:58px;height:62px;border:2px dashed rgba(255,226,150,.9);border-radius:6px;color:#ffe2a0;font-size:9.5px;text-align:center;padding-top:8px;cursor:pointer;background:rgba(0,0,0,.35)}.zoomed .nm-empty{display:block}
.nm-top{position:absolute;left:0;right:0;top:10px;text-align:center;padding:0 54px;pointer-events:none}.nm-top>*{pointer-events:auto}.nm-top h1{margin:6px 0 0;font:900 23px/1.25 "Noto Serif SC",serif;text-shadow:0 2px 12px #000}.nm-top p{margin:4px 0 0;color:#ffe2a0;font-size:13px;text-shadow:0 1px 6px #000}
.nm-live{display:inline-block;margin-top:6px;background:rgba(255,255,255,.12);border-radius:99px;padding:3px 11px;font-size:12.5px}.nm-live b{color:#ffc861}
.nm-x{position:absolute;left:12px;top:0;border:0;background:rgba(255,255,255,.15);color:#fff;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer}
.nm-chips{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px}.nm-chip{border:0;border-radius:99px;padding:5px 11px;font-weight:700;font-size:12.5px;background:rgba(255,255,255,.14);color:#fff;cursor:pointer}.nm-chip.on{background:#fff;color:#14305c}
.nm-zb{position:absolute;right:14px;bottom:110px;display:flex;flex-direction:column;gap:6px}.nm-zb button{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:20px;cursor:pointer}
.nm-bottom{position:absolute;left:50%;transform:translateX(-50%);bottom:22px;display:flex;gap:8px;white-space:nowrap}.nm-b{border:0;border-radius:99px;padding:11px 18px;font-weight:800;background:#e2552f;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(226,85,47,.45)}.nm-b.lt{background:rgba(255,255,255,.16);box-shadow:none}
.nm-full{position:absolute;inset:0;z-index:5;background:#000;display:none}.nm-full.on{display:block}.nm-full .nm-x{top:14px;z-index:3}
.nm-fs{position:absolute;inset:0;overflow-y:auto;scroll-snap-type:y mandatory}.nm-fc{height:100%;scroll-snap-align:start;position:relative;background:#111 center/cover}.nm-fc::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,rgba(0,0,0,.8))}
.nm-cap{position:absolute;left:18px;right:18px;bottom:40px;z-index:2}.nm-cap b{display:block;font:900 22px/1.5 "Noto Serif SC",serif}.nm-cap small{display:block;color:#ffe2a0}
#snapPg .sn-lamp{background:#0b1430;color:#ffe2a0;border-radius:14px;padding:10px 12px;margin-bottom:6px;font-size:14px}#snapPg .sn-lamp b{color:#fff}#snapPg .sn-lamp.need{outline:2px solid #e2552f}
.sn-lb{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.sn-lb button{border:0;border-radius:99px;padding:7px 12px;font-weight:700;background:#ffe2a0;color:#0b1430;cursor:pointer}
#snapPg .sn-lamp input{width:100%;border:1px solid #33416a;background:#14214a;color:#fff;border-radius:99px;padding:7px 12px;font:inherit}#snapPg .sn-lamp small{display:block;opacity:.75;margin-top:6px;font-size:12px}.sn-link.inl{display:inline;margin:0 0 0 6px;color:#ffe2a0}
.nm-city.flash .nm-glow{animation:nmf 1.6s ease-out}@keyframes nmf{0%{transform:translate(-50%,-50%) scale(3);filter:brightness(1.8)}100%{transform:translate(-50%,-50%) scale(1)}}
.nm-toast{position:absolute;left:50%;top:150px;transform:translateX(-50%);background:#ffe2a0;color:#0b1430;font-weight:800;border-radius:99px;padding:7px 16px;z-index:6;animation:nmt .4s}@keyframes nmt{from{opacity:0;transform:translate(-50%,-10px)}}
.nm-lamp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;display:none;cursor:pointer;border-radius:50%;padding:2px;background:radial-gradient(circle,#ffe9b8,#d9a24a);box-shadow:0 0 10px 3px rgba(255,200,110,.7),0 0 28px 8px rgba(255,170,70,.3)}
.nm-lamp b{display:block;width:100%;height:100%;border-radius:50%;background:#1a2340 center/cover}.nm-lamp.many::before{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid rgba(255,214,140,.55)}
.nm-city.me .nm-lamp{background:radial-gradient(circle,#fff,#ffd27a);animation:nml 2.4s ease-in-out infinite}@keyframes nml{50%{box-shadow:0 0 16px 6px rgba(255,220,140,.9),0 0 40px 14px rgba(255,180,80,.4)}}
.nm-lbl{top:calc(50% + 22px)!important;max-width:150px;overflow:hidden;text-overflow:ellipsis;font:500 11px "Noto Serif SC",Georgia,serif!important;color:#ffe9c2!important;text-shadow:0 0 6px #000,0 0 2px #000}.nm-lbl i{font-style:normal;opacity:.7}
.nm-sheet{position:absolute;left:0;right:0;bottom:0;max-width:640px;margin:0 auto;background:rgba(9,14,32,.78);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:#f3e6c8;border-radius:22px 22px 0 0;border-top:1px solid rgba(255,214,140,.22);padding:10px 16px 18px;transform:translateY(105%);transition:.35s cubic-bezier(.3,1.2,.5,1);z-index:3}
.nm-sheet.on{transform:none}
.nm-gr{width:36px;height:4px;border-radius:2px;background:rgba(255,226,160,.35);margin:0 auto 12px}
.nm-strip{display:flex;justify-content:safe center;gap:12px;overflow-x:auto;padding-bottom:4px;scroll-snap-type:x mandatory}.nm-strip::-webkit-scrollbar{display:none}
.nm-pc{flex:none;width:230px;height:290px;border-radius:16px;overflow:hidden;position:relative;background:#1a2340 center/cover;scroll-snap-align:start;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.nm-ov{position:absolute;left:0;right:0;bottom:0;padding:40px 14px 12px;background:linear-gradient(transparent,rgba(5,8,20,.88))}
.nm-ov b{display:block;font:700 19px/1.55 "Noto Serif SC",Georgia,serif;color:#fff8ea;cursor:pointer;text-shadow:0 1px 6px rgba(0,0,0,.6)}.nm-ov b ruby{color:#fff8ea}.nm-ov b rt{font:600 10px -apple-system,sans-serif;color:#ffe2a0;opacity:.9}.nm-ov b i{font-style:normal;font-size:13px;opacity:.7}
.nm-ov small{display:block;color:#ffe2a0;opacity:.85;font-size:12px;margin-top:3px}.nm-ov span{display:block;color:#cdbf9f;opacity:.75;font-size:11px;margin-top:6px}
.nm-ov button{border:0;background:none;color:#cdbf9f;text-decoration:underline;font-size:11px;cursor:pointer;padding:0}
.nm-sheet .nm-b.go{display:block;margin:14px auto 0;background:none;border:1px solid #ffd27a;color:#ffd27a;box-shadow:none;padding:9px 20px;font-weight:700}
.nm-done{text-align:center;color:#cdbf9f;font-size:13px;margin:12px 0 0}
.nm-credit{position:absolute;left:10px;bottom:6px;font-size:10px;color:rgba(255,255,255,.45)}`;
})();

/* act_kit.js */
// 🧰 活动共用零件（2026-11-11，用户同意收窄计划「需要」：首发三个活动，先做一套共用零件，以后的新活动只写内容）
// 起因：五个活动各自写了一遍夜景地球、三档、分享，检查员每轮挑出同样的毛病（阿语标点跑到另一头、「示意」只写中文、名字被截断、a/an 用错、
//   借来的说法拼进句子不通、你自己那条没从 0 开始）。这里每样只写一次，写对一次。
// 用法见 地图源文件/_接线待办/act_kit.md。对外：window.AK。
// 规矩：界面文字 T(中, 英)（西日阿走 ACTS_I18N，check_acts.py 会把这里的英文列进缺口清单）；外语句子一律 dir="auto"；不编人数；冷启动只有 🎭 角色。
(function(){
const H = () => window.HVI || {};
const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch(e){ return null; } };
const UI = () => (document.documentElement.lang || "zh").slice(0, 2), ZH = () => UI() === "zh";
// 界面不是中文也不是英文：按英文原文去 ACTS_I18N[界面语言] 找译文（跟 activities.js 一样），没有就用英文
const TR = en => { if (en == null || ZH()) return en; const D = (window.ACTS_I18N || {})[UI()] || {}, v = D[en]; if (v) return v;
  const ns = String(en).match(/\d+/g), w = ns && D[String(en).replace(/\d+/g, "{n}")]; if (w){ let i = 0; return w.replace(/\{n\}/g, () => ns[i++] || ""); } return en; };
const T = (zh, en) => ZH() ? zh : TR(en);
const TX = o => !o ? "" : typeof o === "string" ? o : ZH() ? (o.zh || o.en || "") : (o[UI()] || TR(o.en) || o.zh || "");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const strip = s => String(s == null ? "" : s).replace(/<[^>]+>/g, "");
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => ymd(new Date());
const LG = () => (H().LEARN === "zh" ? "zh" : H().LEARN === "fr" ? "fr" : "en");   // 在学的语言（中文、英语两边；2026-11-12 起「你那边呢」也有法语）
// 法语的字一律包 lang="fr" dir="ltr"：法语点词工具（fr_tool.js）只认 lang="fr" 里的字；阿语界面里法语句子也从左往右排
const LA = l => /^fr/.test(l || "") ? ' lang="fr" dir="ltr"' : ' dir="auto"';
const uid = () => { try { return (H().SOC && H().SOC.uid) || ""; } catch(e){ return ""; } };
const logged = () => { try { return !!(H().logged ? H().logged() : uid()); } catch(e){ return !!uid(); } };
const login = () => { try { H().login && H().login(); } catch(e){} };
const sb = () => (typeof HV !== "undefined" && HV.sb) ? HV.sb : null;
const ST = () => { const o = ls("ak.v1") || {}; o.tries = o.tries || {}; o.hid = o.hid || {}; return o; };
const SAVE = o => { ls("ak.v1", o); try { window.hvSyncMark && window.hvSyncMark("ak.v1"); } catch(e){} };

// ── 「示意」：跟着界面语言 ──
const SAMPLE_W = {zh: "示意", en: "Sample", ja: "サンプル", es: "Muestra", ar: "عينة"};
const sampleW = () => SAMPLE_W[UI()] || SAMPLE_W.en;
const sample = (txt) => `<span class="ak-demo">${esc(txt ? txt + " · " + sampleW() : sampleW())}</span>`;

// ── 语言名、朗读用的语言 ──
const LANGN = {zh: ["中文", "Chinese"], en: ["英语", "English"], tl: ["菲律宾语", "Filipino"], no: ["挪威语", "Norwegian"], es: ["西班牙语", "Spanish"], ja: ["日语", "Japanese"], pt: ["葡萄牙语", "Portuguese"], de: ["德语", "German"], hi: ["印地语", "Hindi"], ar: ["阿拉伯语", "Arabic"], fr: ["法语", "French"], ko: ["韩语", "Korean"], th: ["泰语", "Thai"], yo: ["约鲁巴语", "Yoruba"], id: ["印尼语", "Indonesian"], tr: ["土耳其语", "Turkish"], sv: ["瑞典语", "Swedish"], yue: ["粤语", "Cantonese"]};
const langName = l => { const x = LANGN[l]; return x ? T(x[0], x[1]) : (l || ""); };
const BCP = {zh: "zh-CN", en: "en-GB", tl: "fil-PH", no: "nb-NO", es: "es-ES", ja: "ja-JP", pt: "pt-BR", de: "de-DE", hi: "hi-IN", ar: "ar-EG", fr: "fr-FR", ko: "ko-KR", th: "th-TH", id: "id-ID", tr: "tr-TR", sv: "sv-SE", yue: "zh-HK"};
const bcp = l => BCP[l] || (l && l.indexOf("-") > 0 ? l : "en-GB");

// ── 我的母语 ──
const MOTHERS = [["zh", "中文", "Chinese"], ["ja", "日语", "Japanese"], ["pt", "葡萄牙语", "Portuguese"], ["es", "西班牙语", "Spanish"], ["de", "德语", "German"], ["hi", "印地语", "Hindi"], ["ar", "阿拉伯语", "Arabic"]];
const mother = v => { const o = ST(); if (v !== undefined){ o.mother = v; SAVE(o); return v; } if (o.mother) return o.mother; const u = UI(); return MOTHERS.some(m => m[0] === u) ? u : ""; };
const motherHTML = (list) => { const L = list || MOTHERS, m = mother();
  return `<div class="ak-mother"><span>${esc(T("我的母语", "My first language"))}</span>${L.map(x => `<button class="${m === x[0] ? "on" : ""}" data-akmother="${esc(x[0])}">${esc(T(x[1], x[2]))}</button>`).join("")}</div>`; };

// ── 声音：有配音放配音（FNV(ns|说话人|语言|句子)，跟 gen_*_voices.py 一样），没有就用手机朗读 ──
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
const VOICES = {}, URLS = {};   // URLS：真人送来的录音（data: 地址），用 key 指过去，不塞进 HTML   // ns → Set（活动的 d8x_<模块>voice.js 里登记：AK.voices.ha = window.HA_VOICE_HAS）
let AU = null;
function hush(){ try { speechSynthesis.cancel(); } catch(e){} if (AU){ try { AU.pause(); } catch(e){} AU = null; } }
// 法语里角色（spk 不是 "_"）说的话：只放 TA 自己的录音；没有就不出 🔊、也不退回手机朗读（手机是巴黎口音，像是 TA 本人在说，比如 Fatou）。中文、英文照旧退回手机朗读。
const vSet = ns => ns && (VOICES[ns] || window[(ns + "_VOICE_HAS").toUpperCase()]);
const frPerson = o => /^fr/.test(o.l || LG()) && !!o.spk && o.spk !== "_";
function mutedFr(t, o){ o = o || {}; if (!frPerson(o) || o.url || o.urlKey) return false; const V = vSet(o.ns), txt = strip(t).replace(/\s+/g, " ").trim();
  return !(V && V.has(fnv(o.ns + "|" + o.spk + "|fr|" + txt))); }
function say(t, o){ o = o || {}; let txt = strip(t).replace(/\s+/g, " ").trim(); if (!txt) return; hush();
  if (mutedFr(t, o)) return;
  const l = o.l || LG(), l2 = l.slice(0, 2), V = vSet(o.ns);
  if (V && o.ns){ for (const spk of (frPerson(o) ? [o.spk] : [o.spk, "_"].filter(Boolean))){ const k = fnv(o.ns + "|" + spk + "|" + l2 + "|" + txt); if (V.has(k)){ const a = new Audio("https://img.heyvoyo.com/voice/" + k + ".mp3"); AU = a; a.play().catch(() => tts(txt, l)); return; } } }
  if (/^fr/.test(l)) txt = txt.replace(/(\p{L})\/(\p{L})/gu, "$1, $2");   // 还没选阴阳性的 content/contente：两种都念
  if (o.url){ const a = new Audio(o.url); AU = a; a.play().catch(() => tts(txt, l)); return; }
  tts(txt, l); }
function tts(t, l){ try { const u = new SpeechSynthesisUtterance(t); u.lang = bcp(l); u.rate = .88; speechSynthesis.speak(u); } catch(e){} }
// 能点着听的一段（外语句子一律 dir="auto"）：AK.sayable(句子, {l, spk, ns, p 拼音, cls, tag 标签名})
const sayable = (t, o) => { o = o || {}; const tg = o.tag || "span";
  return `<${tg} class="ak-say ${o.cls || ""}"${LA(o.l || LG())} data-aksay="${esc(strip(t))}" data-akl="${esc(o.l || LG())}"${o.urlKey ? ` data-akurl="${esc(o.urlKey)}"` : ""}${o.spk ? ` data-akspk="${esc(o.spk)}"` : ""}${o.ns ? ` data-akns="${esc(o.ns)}"` : ""}>${o.html || esc(t)}${o.icon === false || mutedFr(t, o) ? "" : `<i class="ak-ear" aria-hidden="true">🔊</i>`}${o.p ? `<span class="ak-py" dir="ltr">${esc(o.p)}</span>` : ""}</${tg}>`; };

// ── 每一下都有回应（every-action-reacts）──
function blip(f){ try { if (localStorage.getItem("hv.sound") === "off") return; const A = window.AudioContext || window.webkitAudioContext, ac = blip.ac || (blip.ac = new A()), o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f || 880; g.gain.setValueAtTime(.07, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .15); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .16); } catch(e){} }
function tap(el, f){ blip(f); if (!el || !el.getBoundingClientRect) return; el.classList.add("ak-press"); setTimeout(() => el.classList.remove("ak-press"), 130);
  const r = el.getBoundingClientRect(), n = document.createElement("div"); n.className = "ak-note"; n.textContent = "♪"; n.style.left = (r.left + r.width / 2 - 6) + "px"; n.style.top = (r.top - 4) + "px"; document.body.appendChild(n); setTimeout(() => n.remove(), 900); }
function toast(t){ let e = document.getElementById("akToast"); if (!e){ e = document.createElement("div"); e.id = "akToast"; e.className = "ak-toast"; document.body.appendChild(e); } e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 1800); }
function stamp(html){ const s = document.createElement("div"); s.className = "ak-stamp"; s.innerHTML = html; document.body.appendChild(s); blip(520); setTimeout(() => s.remove(), 1600); }
function confetti(){ const c = ["#e2552f", "#ffc861", "#2f7d70", "#2c64b8", "#14305c"]; for (let i = 0; i < 46; i++){ const d = document.createElement("div"); d.className = "ak-cf"; d.style.left = Math.random() * 100 + "vw"; d.style.background = c[i % 5]; d.style.animationDelay = Math.random() * .5 + "s"; d.style.borderRadius = i % 3 ? "2px" : "50%"; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); } }
function pop(faceId, html){ let e = document.getElementById("akPop"); if (!e){ e = document.createElement("div"); e.id = "akPop"; e.className = "ak-pop"; e.dataset.nopy = ""; document.body.appendChild(e); }
  e.innerHTML = `${faceId ? `<img class="ak-av s" src="${esc(face(faceId))}" alt="">` : ""}<div>${html}</div>`; e.classList.add("on"); clearTimeout(pop.t); pop.t = setTimeout(() => e.classList.remove("on"), 2600); }

// ── 人物卡：人在前面（people-over-things）。名字永远显示全名，不截断 ──
const face = id => /^(https?:|data:)/.test(id || "") ? id : `https://img.heyvoyo.com/npc/${id}/face.webp`;
const photo = p => /^(https?:|data:)/.test(p || "") ? p : `https://img.heyvoyo.com/npc/${p}.webp`;
// p = {face 或 id（角色照片 id）, nm 全名, city 显示用的城市, st: n 母语 / l 在学 / g 从小就说, l 说的语言, nat 母语（真人自己选的）, seed: 🎭 角色, own: 你自己, real: 真人}
function person(p, o){ o = o || {}; const nm = p.own ? T("你", "You") : p.nm || (p.l === "zh" ? T("一位在学中文的人", "Someone learning Chinese") : p.l === "en" ? T("一位在学英语的人", "Someone learning English") : p.l === "fr" ? T("一位在学法语的人", "Someone learning French") : T("一位学习者", "A learner"));
  const st = p.st === "n" ? T("母语", "native") : p.st === "g" ? T("从小就说", "grew up speaking") : p.st === "l" ? T("在学", "learning") : "";
  const fid = p.face || (p.seed ? p.id : ""), av = fid ? `<img class="ak-av${o.small ? " s" : ""}" src="${esc(face(fid))}" alt="" loading="lazy" data-nm="${esc(nm)}">` : `<span class="ak-av${o.small ? " s" : ""} ak-av0">${esc((p.own ? T("你", "Me") : (p.nm || "?")).slice(0, 1))}</span>`;
  const bits = [p.city ? esc(p.city) : "", st && p.l ? `<span class="ak-tag ${p.st === "l" ? "lrn" : "nat"}">${esc(st)}</span> ${esc(langName(p.l))}` : "", p.nat ? esc(T("母语 ", "first language: ") + langName(p.nat)) : ""].filter(Boolean).join(" · ");
  return `<div class="ak-person">${av}<div class="ak-pn"><b dir="auto">${esc(nm)}</b>${p.seed ? ` <span class="ak-tag npc">🎭 ${esc(T("角色", "character"))}</span>` : ""}${p.own ? "" : p.real ? ` <span class="ak-tag real">${esc(T("真人", "real person"))}</span>` : ""}<small>${bits}</small></div></div>`; }

// 角色还没有照片（Pierre、Camille、Amadou、Sophie 2026-11-12 还没有）：头像图出不来就换成名字的第一个字，不留破图
document.addEventListener("error", e => { const t = e.target; if (!t || t.tagName !== "IMG" || !t.classList.contains("ak-av") || t.dataset.err) return; t.dataset.err = "1";
  const sp = document.createElement("span"); sp.className = t.className + " ak-av0"; sp.textContent = (t.dataset.nm || "·").trim().slice(0, 1); t.replaceWith(sp); }, true);

// ── 拼句子：英文句首大写、I 大写、a/an、中英文标点；拼音跟着拼 ──
const CJK = "\\u3400-\\u9fff\\uf900-\\ufaff";
const anWord = w => { const x = w.toLowerCase(); if (/^(hour|honest|honou?r|heir)/.test(x)) return true; if (/^(uni|use|usu|uti|euro|eu|one|once|ub|ur[aeiou])/.test(x)) return false; if (/^[A-Z]{2,}/.test(w)) return /^[AEFHILMNORSX]/.test(w); return /^[aeiou]/.test(x); };
function fixEn(s, keepEnd){ s = String(s || "").replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1").replace(/([,;:])(?=[A-Za-z])/g, "$1 ").trim();
  s = s.replace(/\b([Aa])n? (?=([A-Za-z][\w'-]*))/g, (m, a, w) => (anWord(w) ? a + "n " : a + " "));
  s = s.replace(/\bi(?=\b|'m|'ve|'d|'ll)/g, "I");
  s = s.replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
  if (!keepEnd && s && !/[.!?…]$/.test(s)) s += ".";
  return s; }
function fixZh(s, keepEnd){ s = String(s || "").trim();
  s = s.replace(new RegExp(`([${CJK}，。！？、])\\s+(?=[${CJK}，。！？、])`, "g"), "$1");
  s = s.replace(new RegExp(`([${CJK}])(?=[A-Za-z])`, "g"), "$1 ").replace(new RegExp(`([A-Za-z])(?=[${CJK}])`, "g"), "$1 ");   // 汉字和外文字母之间空一格：一张 IMAX 电影票、用 App
  s = s.replace(new RegExp(`([${CJK}])\\s*,\\s*`, "g"), "$1，").replace(new RegExp(`([${CJK}])\\s*\\.\\s*$`), "$1。").replace(new RegExp(`([${CJK}])\\s*\\?`, "g"), "$1？").replace(new RegExp(`([${CJK}])\\s*!`, "g"), "$1！");
  s = s.replace(/，{2,}/g, "，").replace(/。{2,}/g, "。").replace(/，。/g, "。").replace(/。，/g, "，");
  if (!keepEnd && s && !/[。！？…）」]$/.test(s)) s += "。";
  return s; }
function fixPy(s){ s = String(s || "").replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").replace(/,(?=\S)/g, ", ").trim(); if (!s) return "";
  s = s.replace(/(^|[.!?]\s+)(\S)/g, (m, p, c) => p + c.toUpperCase()); if (!/[.!?]$/.test(s)) s += "."; return s; }
// 法语：只并普通空格——不换行空格（U+00A0）留着，法语的 ? ! : ; 前面和 « 后面要有；不做 a/an；句首大写、句号
function fixFr(s, keepEnd){ s = String(s || "").replace(/[ \t\n]+/g, " ").replace(/ +([,.])/g, "$1").trim();
  s = s.replace(/(^|[.!?]\s+)(\p{L})/gu, (m, p, c) => p + c.toUpperCase());
  if (!keepEnd && s && !/[.!?…]$/.test(s)) s += ".";
  return s; }
const fix = (s, lang) => lang === "zh" ? fixZh(s) : lang === "fr" ? fixFr(s) : fixEn(s);
// 模板 "我今天{A}去{B}，路上{C}。" + {A: "坐地铁", …}；没填的空返回 null
function build(tpl, map, lang){ if (!tpl) return null; let miss = false; const s = tpl.replace(/\{(\w+)\}/g, (m, k) => { const v = map[k]; if (v == null || v === ""){ miss = true; return ""; } return v; }); return miss ? null : fix(s, lang); }
function buildP(tpl, map){ if (!tpl) return ""; let miss = false; const s = tpl.replace(/\{(\w+)\}/g, (m, k) => { const v = map[k]; if (v == null){ miss = true; return ""; } return v; }); return miss ? "" : fixPy(s); }
// 借来的说法：只接得上才接（连词开头的接在逗号后面；别的另起一句）；跟你选的意思打架（又贵又便宜、又晴又下雨）就不接
// 标签可以有几个（空格分开，比如 "metro busy"）；deny = 这一天自己加的冲突（比如 [["metro", "traffic"], ["walk", "packed"]]：坐地铁不会堵车，走路不说挤）
const CLASH = [["p", "c"], ["bright", "rain"], ["bright", "dark"], ["bright", "cloud"], ["hot", "cold"], ["busy", "quiet"], ["alone", "together"]];
const tagsOf = x => String(x || "").split(/\s+/).filter(Boolean);
const clashes = (a, b, deny) => { const A = tagsOf(a), B = tagsOf(b); if (!A.length || !B.length) return false; const L = CLASH.concat(deny || []);
  return A.some(x => B.some(y => L.some(([p, q]) => (p === x && q === y) || (p === y && q === x)))); };
// 选项之间的冲突：选了 m[key][i] 以后，别的空里已经选的、跟它打架的那些空（AK.pickClash(m 这一天的内容, pick 选了的 {空: 第几个}, key, i)）
function pickClash(m, pick, key, i){ const o = opt(((m || {})[key] || [])[i]); if (!o || !o.x) return [];
  return Object.keys(pick || {}).filter(k => { if (k === key || pick[k] == null || !Array.isArray(m[k])) return false; const p = opt(m[k][pick[k]]); return !!p && clashes(o.x, p.x, m.deny); }); }
const GLUE_EN = /^(but|and|so|because|though|although|plus|then|or)\b/i, GLUE_ZH = /^(可是|但是|不过|所以|因为|而且|还|然后|就|结果)/, GLUE_FR = /^(mais|et|puis|alors|donc|parce que|sauf que|ou)(?![\p{L}'’])/iu;
function joinB(line, b, lang, tags, deny){ line = line || {}; if (!line.t || !b || !b.t) return {t: line.t, p: line.p || "", joined: false};
  if ((tags || []).some(t => clashes(t, b.tag, deny))) return {t: line.t, p: line.p || "", joined: false, clash: true};
  const zh = lang === "zh", glue = (zh ? GLUE_ZH : lang === "fr" ? GLUE_FR : GLUE_EN).test(b.t.trim());
  let t, p = line.p || "";
  if (zh){ t = glue ? line.t.replace(/[。！？]$/, "") + "，" + b.t.trim() : line.t.replace(/([^。！？])$/, "$1。") + b.t.trim(); t = fixZh(t);
    if (p && b.p) p = glue ? fixPy(p.replace(/[.!?]$/, "") + ", " + b.p) : fixPy(p.replace(/([^.!?])$/, "$1.") + " " + b.p); else if (p) p = ""; }
  else if (lang === "fr"){ const bt = b.t.trim().replace(/[\s.!?]+$/, ""), lt = line.t.replace(/[\s.!?]+$/, ""); t = fixFr(glue ? lt + ", " + bt.charAt(0).toLowerCase() + bt.slice(1) : lt + ". " + bt.charAt(0).toUpperCase() + bt.slice(1)); }
  else { const bt = b.t.trim().replace(/[.!?]$/, ""); t = glue ? line.t.replace(/[.!?]$/, "") + ", " + bt.charAt(0).toLowerCase() + bt.slice(1) : line.t.replace(/([^.!?])$/, "$1.") + " " + bt.charAt(0).toUpperCase() + bt.slice(1); t = fixEn(t); }
  return {t, p, joined: true, glue}; }
// 数字、钱说成中文：三块五毛、两点五欧元、两万两千。拼音里的「一」：一百 yìbǎi、一千 yìqiān、一万 yíwàn（照变调写）；十一、二十一、一点五里的「一」还是 yī
const DG = "零一二三四五六七八九", DGP = ["líng", "yī", "èr", "sān", "sì", "wǔ", "liù", "qī", "bā", "jiǔ"];
function zhNum(n){ n = Math.max(0, Math.floor(n)); if (n === 0) return ["零", "líng"]; if (n === 2) return ["两", "liǎng"];
  let s = "", ch = [], zero = false, tail = ""; const J = (a, x) => a + (a && /^[aoeāáǎàōóǒòēéěè]/.test(x) ? "'" : "") + x;
  for (const [v, c, cp] of [[10000, "万", "wàn"], [1000, "千", "qiān"], [100, "百", "bǎi"]]){ const q = Math.floor(n / v); n %= v;
    if (q){ if (zero){ s += "零"; ch.push("líng"); zero = false; } const two = q === 2 && (v >= 1000 || s === ""); s += (two ? "两" : DG[q]) + c; ch.push((two ? "liǎng" : q === 1 ? (v === 10000 ? "yí" : "yì") : DGP[q]) + cp); }
    else if (s) zero = true; }
  if (n){ const t = Math.floor(n / 10), o = n % 10; if (zero || (s && t === 0)){ s += "零"; ch.push("líng"); }
    if (t){ if (!(t === 1 && s === "")){ s += DG[t]; tail = J(tail, DGP[t]); } s += "十"; tail = J(tail, "shí"); }
    if (o){ s += DG[o]; tail = J(tail, DGP[o]); } ch.push(tail); }
  return [s, ch.join(" ")]; }
// 小数说「二点八」，不说「两点八」；人民币把「毛」说出来：二十块两毛、一百块五毛（2026-11-11 用户定的：「二十块二」「一百块五」容易听错）
// 「一」后面直接跟量词时照变调写（跟别处的拼音一样）：一块 yí kuài、一毛 yì máo、一美元 yì měiyuán、一澳元 yí àoyuán
const yiTone = next => { const m = String(next || "").match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/); return m && "àèìòùǜ".includes(m[0]) ? "yí" : "yì"; };
function zhMoney(v, cu){ const I = Math.floor(v + 1e-9), d = Math.round((v - I) * 100), ds = d ? String(d).padStart(2, "0").replace(/0$/, "") : "", n = I === 2 && ds && !(cu && cu[3] === "CNY") ? ["二", "èr"] : zhNum(I), dz = [...ds].map(x => DG[+x]), dp = [...ds].map(x => DGP[+x]);
  if (!cu) return ds ? [n[0] + "点" + dz.join(""), n[1] + " diǎn " + dp.join(" ")] : n;
  if (cu[3] === "CNY"){ const head = I ? [n[0] + "块", (I === 1 ? "yí" : n[1]) + " kuài"] : ["", ""]; if (!ds) return head;
    const mz = x => x === "2" ? "两" : DG[+x], mp = x => x === "2" ? "liǎng" : x === "1" ? "yì" : DGP[+x], sp = head[1] ? head[1] + " " : "";
    if (ds.length === 1) return [head[0] + mz(ds) + "毛", sp + mp(ds) + " máo"];   // 二十块两毛、一百块五毛、五毛
    if (ds[0] === "0") return I ? [head[0] + "零" + dz[1] + "分", head[1] + " líng " + (ds[1] === "1" ? "yì" : dp[1]) + " fēn"] : [dz[1] + "分", (ds[1] === "1" ? "yì" : dp[1]) + " fēn"];   // 十二块零五分、五分
    return [head[0] + mz(ds[0]) + "毛" + dz[1], sp + mp(ds[0]) + " máo " + dp[1]]; }   // 三块两毛五
  if (!ds) return [n[0] + cu[0], (I === 1 ? yiTone(cu[1]) : n[1]) + " " + cu[1]];
  return [n[0] + "点" + dz.join("") + cu[0], n[1] + " diǎn " + dp.join(" ") + " " + cu[1]]; }

// 英文里的钱：美元、英镑、欧元、澳元写符号（$2.50、£3.75、A$5.20），别的写数 + 名字（18 yuan、12.50 reais、1 real）
const EN_SYM = {USD: "$", GBP: "£", EUR: "€", AUD: "A$"};
function enMoney(v, code, word, sing){ const r = Math.round(v * 100) / 100, n = r % 1 ? r.toFixed(2) : r >= 1000 ? r.toLocaleString("en-US") : String(r);
  if (EN_SYM[code]) return EN_SYM[code] + n; return n + " " + (r === 1 && sing ? sing : word || code); }

// 法语里的钱：2,50 €、4,75 $、500 FCFA、2 000 FCFA（小数用逗号，符号在数字后面，中间和千位是不换行空格；西非法郎不带小数）。sym = 这一周的 sym_fr，sing = sing_fr（不到 2 用单数：1,50 euro）
function frMoney(v, code, sym, sing, nodec){ const nd = (nodec || []).includes(code), r = nd ? Math.round(v) : Math.round(v * 100) / 100, I = Math.floor(r), d = Math.round((r - I) * 100);
  if (code === "CHF") return "CHF\u00a0" + String(I).replace(/\B(?=(\d{3})+(?!\d))/g, "’") + "." + String(d).padStart(2, "0");   // 瑞士的写法：CHF 3.90（币种在前、小数点、千位用 ’）
  const n = String(I).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + (d ? "," + String(d).padStart(2, "0") : ""), w = (sym || {})[code] || code;
  return n + "\u00a0" + (r < 2 && sing && sing[w] ? sing[w] : w); }

// ── 三档 ──
const LEVELS = [["刚开始", "Just starting"], ["能聊日常", "Everyday chat"], ["比较流利", "Fairly fluent"]];
const level = v => { const o = ST(); if (v !== undefined){ o.lv = v; SAVE(o); return v; } return o.lv == null ? 0 : o.lv; };
const levelsHTML = lv => `<div class="ak-lv" role="tablist">${LEVELS.map((x, i) => `<button role="tab" aria-selected="${lv === i}" class="${lv === i ? "on" : ""}" data-aklv="${i}">${esc(T(x[0], x[1]))}</button>`).join("")}</div>`;
// 一个选项：学中文 [句子, 拼音, 意思, 标签]，学英语 [句子, 意思, 标签]
// 学法语 [句子, 中文意思, 英文意思, 标签, {f: 阴性写法}]：f 只在有阴阳性时才有；用哪一种看你点过的（gram，存在 ak.v1）；没点过不默认阳性：两种都亮着，拼出来的句子写成 content/contente
const gram = v => { const o = ST(); if (v !== undefined){ o.gram = v; SAVE(o); return v; } return o.gram || ""; };
const fOf = a => { const z = a && a[a.length - 1]; return z && typeof z === "object" && !Array.isArray(z) && z.f ? z.f : ""; };
// 两种写法只把不一样的那几个词分开：[前面一样的, 阳性那几个词, 阴性那几个词, 后面一样的]
function gSplit(m0, f){ const a = m0.split(" "), b = f.split(" "); let i = 0, j = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return [a.slice(0, i).join(" "), a.slice(i, a.length - j).join(" "), b.slice(i, b.length - j).join(" "), a.slice(a.length - j).join(" ")]; }
const gBoth = (m0, f) => { const [pre, mw, fw, suf] = gSplit(m0, f); return [pre, mw + "/" + fw, suf].filter(Boolean).join(" "); };
const opt = (a, lg) => !a ? null : (lg || LG()) === "zh" ? {t: a[0], p: a[1], m: a[2], x: a[3]} : (lg || LG()) === "fr" ? {t: !fOf(a) ? a[0] : gram() === "f" ? fOf(a) : gram() === "m" ? a[0] : gBoth(a[0], fOf(a)), p: "", m: {zh: a[1], en: a[2]}, x: typeof a[3] === "string" ? a[3] : "", f: fOf(a), m0: a[0]} : {t: a[0], p: "", m: a[1], x: a[2]};   // 学中文的选项带拼音，学英语的不带
// 内容里写的意思：学中文那边是英文（界面不是英文时去 ACTS_I18N 找），学英语那边是中文（界面不是中文就不显示，免得给阿语界面的人看中文）
// 学法语那边两种意思都写了：{zh, en} 或者 [英, 中]（角色回答、借走的说法），跟着界面给
const meanOf = m => !m ? "" : Array.isArray(m) ? (ZH() ? m[1] : TR(m[0])) : typeof m === "object" ? (ZH() ? m.zh : TR(m.en)) : LG() === "zh" ? TR(m) : ZH() ? m : "";
const optM = a => { const o = opt(a); return o ? meanOf(o.m) : ""; };
// dim：跟已经选的意思打架的那几个（变淡；点了会把打架的那一个换掉）
function chipsHTML(key, arr, picked, label, dim){ return `${label ? `<div class="ak-rowlbl">${esc(label)}</div>` : ""}<div class="ak-chips">${(arr || []).map((a, i) => { const o = opt(a);
  return `<button class="ak-chip${picked === i ? " on" : ""}${dim && dim.has && dim.has(i) && picked !== i ? " dim" : ""}" data-akchip="${esc(key)}" data-i="${i}">${o.f ? gHTML(o) : `<span${LA(LG())}>${esc(o.t)}</span>`}<small dir="auto">${esc([o.p, meanOf(o.m)].filter(Boolean).join(" · "))}</small></button>`; }).join("")}</div>${gNote(arr)}`; }
// 两种写法并排的地方，底下一行小字说清楚为什么有两种（五种界面语言）
const GNOTE = {zh: "说话的人是男生 / 女生，写法不一样：点你的那一种。", en: "Written differently when the speaker is a man / a woman: tap yours.", es: "Se escribe distinto si quien habla es hombre / mujer: toca la tuya.", ja: "話す人が男性か女性かで書き方が変わります。自分のほうをタップ。", ar: "تختلف الكتابة إذا كان المتكلم رجلًا أو امرأة: اضغط على ما يناسبك."};
const gNote = arr => LG() === "fr" && (arr || []).some(a => fOf(a)) ? `<div class="ak-gnote" dir="auto">${esc(GNOTE[UI()] || GNOTE.en)}</div>` : "";
// 有阴阳性的选项：两种写法并排，点哪一边就用哪一种（以后都照这个显示），不问你是男是女；只把不一样的那几个词分开
function gHTML(o){ const g = gram(), [pre, mw, fw, suf] = gSplit(o.m0, o.f);   // 没点过（g 空）：两种都亮着
  return `<span${LA("fr")}>${pre ? esc(pre) + " " : ""}<span class="ak-g"><i data-akg="m" class="${g !== "f" ? "on" : ""}">${esc(mw)}</i><i data-akg="f" class="${g !== "m" ? "on" : ""}">${esc(fw)}</i></span>${suf ? " " + esc(suf) : ""}</span>`; }
function wordsHTML(W, o){ o = o || {}; return `<div class="ak-rowlbl">${esc(T("要用的词 · 点着听", "Words you'll need · tap to hear"))}</div><div class="ak-words">${(W || []).map(a => { const x = opt(a);
  return `<button data-aksay="${esc(x.t)}" data-akl="${esc(LG())}"${o.ns ? ` data-akns="${esc(o.ns)}"` : ""}><b${LA(LG())}>${esc(x.f ? x.m0 + " · " + x.f : x.t)}</b><small dir="auto">${esc([x.p, meanOf(x.m)].filter(Boolean).join(" · "))}</small></button>`; }).join("")}</div>${gNote(W)}`; }
// 比较流利：参考说法翻开
const refHTML = (r, o) => { o = o || {}; if (!r || !r.t) return ""; return `<div class="ak-refw"><button class="ak-mini" data-akref>👀 ${esc(T("翻开一种说法", "Peek at one way to say it"))}</button><div class="ak-ref" hidden>${sayable(r.t, {l: LG(), p: r.p, ns: o.ns, spk: "_"})}${meanOf(r.m) ? `<div class="ak-mean" dir="auto">${esc(meanOf(r.m))}</div>` : ""}</div></div>`; };

// ── 麦克风（mic-states-clear）：点一下或按住都行；在听时红色 + 声波 + 边说边出字；说完自己停；立刻 ✓ ──
// AK.micHTML() 放进页面，再 AK.mic(那个元素, {want 要说的那句, l 语言, onDone(v)})。v = {text, blob, url, dur, sim}
// 真的「听你说得对不对」还没做：✓ 旁边一直标「示意」。
const micHTML = (o) => `<div class="ak-mic"><button class="ak-micb" aria-label="${esc(T("点一下或按住说", "Tap or hold to speak"))}">🎤</button><div class="ak-bars"><i></i><i></i><i></i><i></i><i></i></div><div class="ak-live" dir="auto">${o && o.done != null ? `✓ <span dir="auto">${esc(o.done)}</span> ${o.real ? "" : sample()}<br><small>${esc(T("再点一下可以重说", "Tap again to redo"))}</small>` : esc((o && o.hint) || T("点一下或按住说", "Tap or hold to speak"))}</div></div>`;
// 2026-11-13：只有示范（没录到、模拟出来的）才挂「示意」，你自己说出来的不挂
function mic(box, o){ if (!box || box._ak) return; box._ak = 1; const b = box.querySelector(".ak-micb"), live = box.querySelector(".ak-live"); let st = "idle", hd = null, hold = false, t0 = 0, auto = null, idle = null, sim = null, txt = "";
  const set = s => { st = s; box.classList.toggle("rec", s === "rec"); };
  const want = () => typeof o.want === "function" ? o.want() : o.want;
  const finish = v => { if (st !== "rec") return; b.querySelectorAll(".ak-ring").forEach(x => x.remove()); set("done"); clearTimeout(auto); clearTimeout(idle); clearInterval(sim); const text = (v && v.text) || txt || want() || "";
    live.innerHTML = `✓ <span${LA(o.l || LG())}>${esc(text)}</span> ${(v && v.sim) || !((v && v.text) || txt) ? sample() : ""}`; blip(1040); o.onDone && o.onDone(Object.assign({text}, v || {})); };
  const stop = () => { if (hd && hd.stop) hd.stop(); else finish({sim: true}); };
  const start = async () => { const w = want(); if (!w && !o.free){ toast(T("先把空填上 ↑", "Fill in the blanks first ↑")); return; } set("rec"); txt = ""; t0 = Date.now(); live.textContent = hold ? T("在听……松开就停", "Listening… let go to stop") : T("在听……说完会自己停", "Listening… stops when you're done");
    const h = H(), words = String(w || "").split(o.l === "zh" || LG() === "zh" ? "" : " "), dur = Math.min(12000, 2200 + words.length * (LG() === "zh" ? 260 : 420));
    // 2026-11-20 用户真机「我正在停顿，软件就以为我说完了」：开过口以后安静 3 秒才停（照着说一句 2 秒），话筒周围一圈跟着走完，再开口重新计时；一直没开口 8 秒停；按住就一直听到松手
    if (h.recStart && h.canRec){ const SIL = w && !o.free ? 2000 : 3000;
      hd = await h.recStart({lang: bcp(o.l || LG()), onText: x => { txt = x; live.textContent = x; clearTimeout(idle); clearTimeout(auto); ring(0); if (hold || !String(x || "").trim()) return; idle = setTimeout(() => { if (!hold) stop(); }, SIL); ring(SIL); }, onDone: v => finish(v), onError: () => { hd = null; finish({sim: true}); }});
      if (!hd){ finish({sim: true}); return; }
      if (!hold) auto = setTimeout(() => { if (!hold && !txt) stop(); }, 8000); return; }
    else { let k = 0; sim = setInterval(() => { k += LG() === "zh" ? 2 : 1; live.textContent = words.slice(0, k).join(LG() === "zh" ? "" : " "); if (k >= words.length) clearInterval(sim); }, 160); }
    if (!hold) auto = setTimeout(stop, dur); };
  // 安静下来到停之前：话筒周围一圈慢慢走完（ms = 0 收掉）
  const ring = ms => { b.querySelectorAll(".ak-ring").forEach(x => x.remove()); if (!ms || st !== "rec") return; b.style.position = "relative";
    b.insertAdjacentHTML("beforeend", `<svg class="ak-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" pathLength="100" style="animation-duration:${ms}ms"/></svg>`); };
  b.addEventListener("pointerdown", e => { e.preventDefault(); if (st === "rec"){ stop(); return; } hold = false; t0 = Date.now(); b._hold = setTimeout(() => { hold = true; live.textContent = T("在听……松开就停", "Listening… let go to stop"); clearTimeout(auto); clearTimeout(idle); ring(0); }, 380); start(); });
  const up = () => { clearTimeout(b._hold); if (hold && st === "rec") stop(); hold = false; };
  b.addEventListener("pointerup", up); b.addEventListener("pointerleave", () => { if (hold) up(); }); b.addEventListener("pointercancel", up);
  box._reset = () => { set("idle"); live.textContent = (o && o.hint) || T("点一下或按住说", "Tap or hold to speak"); }; }

// ── 送给世界 / 只留给自己（照 street_snap 的 post()）──
const sendKeepHTML = (o) => { o = o || {}; return `<div class="ak-choose"><button class="w" data-aksend="1">🌍 ${esc(T("送给世界", "Send to the world"))}<small>${esc(o.wSub || T("地图上亮你的灯，大家听得到", "your light and your voice go on the map"))}</small></button><button data-aksend="0">🔒 ${esc(T("只留给自己", "Just for me"))}<small>${esc(o.mSub || T("只存在你的手机上", "stays only on your phone"))}</small></button></div>`; };
// 存进 Supabase docs：AK.post(coll, data)。没登录 → 先请登录（返回 null）。成功返回 id。
let ERR = null;   // 最近一次 post 的错（AK.err()）：{code, message}；23505 = 后台的「只能一条」挡住了
async function post(coll, data){ ERR = null; if (!logged() || !uid()){ ERR = {code: "login"}; login(); return null; } const db = H().SOC && H().SOC.db; if (!db){ ERR = {code: "nodb"}; return null; }
  try { const ref = db.collection(coll).doc(); await ref.set(Object.assign({author: uid(), nm: (H().myName && H().myName()) || "", ts: Date.now()}, data)); return ref.id; } catch(e){ ERR = {code: String((e && e.code) || ""), message: String((e && e.message) || e || "")}; return null; } }
const dupErr = () => !!ERR && (ERR.code === "23505" || /duplicate key|unique constraint/i.test(ERR.message || ""));
async function del(coll, id){ try { await H().SOC.db.collection(coll).doc(id).delete(); return true; } catch(e){ return false; } }
function report(coll, id){ hide(coll + "/" + id); try { if (uid()) H().SOC.db.collection("reports").add({by: uid(), target: coll + "/" + id, ts: Date.now()}); } catch(e){} toast(T("已经替你藏起来了，谢谢告诉我们", "Hidden for you — thanks for telling us")); }
const hide = key => { const o = ST(); o.hid[key] = 1; SAVE(o); };
const hidden = key => !!ST().hid[key];
const blocked = () => { try { return new Set(JSON.parse(localStorage.getItem("soc.block.v1") || "[]")); } catch(e){ return new Set(); } };
// 举报 / 藏起来 / 删掉（自己的）那一排小按钮
const modHTML = (coll, it) => it.seed ? `<button class="ak-link" data-akhide="${esc(it.key || "")}">${esc(T("不想看这条", "Hide this"))}</button>` : it.own ? `<button class="ak-link" data-akdel="${esc(coll + "/" + it.id)}">🗑 ${esc(T("删掉", "Delete"))}</button>` : `<button class="ak-link" data-akhide="${esc(coll + "/" + it.id)}">${esc(T("藏起来", "Hide"))}</button> · <button class="ak-link" data-akrep="${esc(coll + "/" + it.id)}">${esc(T("举报", "Report"))}</button>`;
// 读真人送给世界的（没登录也能读，要跑过对应的 SQL）：AK.load(coll, {eq: {字段: 值}, limit})
// q.fields = ["t", "p", …]：只拿这几样（不拿大照片、录音；2026-11-15 朋友墙检查员：墙上用缩略图，点开再拿大图）
async function load(coll, q){ const S = sb(); if (!S) return []; q = q || {}; const F = q.fields ? [...new Set(q.fields.concat(["hid"]))] : null;
  try { let r = S.from("docs").select(F ? "id,owner," + F.map(f => f + ":data->>" + f).join(",") : "id,owner,data").eq("coll", coll);
    Object.entries(q.eq || {}).forEach(([k, v]) => { r = r.eq("data->>" + k, String(v)); }); r = r.order("created_at", {ascending: false}).limit(q.limit || 300);
    const res = await r, bl = blocked(), me = uid(); const rows = (res.data || []).map(x => F ? {id: x.id, owner: x.owner, data: Object.fromEntries(F.filter(f => x[f] != null).map(f => [f, f === "hid" ? x[f] === "true" : x[f]]))} : x);
    return rows.filter(x => x.data && x.data.hid !== true && !bl.has(x.owner) && !hidden(coll + "/" + x.id)).map(x => Object.assign({id: x.id, owner: x.owner, own: !!me && x.owner === me, real: true}, x.data)); } catch(e){ return []; } }
// 点开一条再拿大的：AK.one(coll, id, ["img", "au"]) → {img, au}
async function one(coll, id, fields){ const S = sb(); if (!S) return {}; try { const r = await S.from("docs").select(fields.map(f => f + ":data->>" + f).join(",")).eq("coll", coll).eq("id", id).maybeSingle(); return (r && r.data) || {}; } catch(e){ return {}; } }
// 送出去之前把照片压小：照片 + 缩略图 + 录音一共不超过 limit（lifeshare 的规则是 40 万字节，留点余地）。ph = data:image 地址，au = base64 录音
//   返回 {img, th}（都是不带前缀的 base64）；还是太大就先降照片，最后才不带录音（drop = true）
function shrinkData(u, max, q){ return new Promise(ok => { const im = new Image(); im.onload = () => { const r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", q)); }; im.onerror = () => ok(""); im.src = u; }); }
async function fit(ph, au, limit){ limit = limit || 360000; au = au || ""; if (!ph) return {img: "", th: "", drop: au.length > limit};
  const th = ((await shrinkData(ph, 240, .6)) || "").split(",")[1] || "";
  for (const [m, q] of [[900, .8], [720, .72], [560, .66], [420, .6]]){ const img = ((await shrinkData(ph, m, q)) || "").split(",")[1] || ""; if (img.length + th.length + au.length < limit) return {img, th, drop: false}; }
  const img = ((await shrinkData(ph, 420, .6)) || "").split(",")[1] || ""; return {img, th, drop: img.length + th.length + au.length >= limit}; }

// ── 夜景地球（照 street_snap 的 map()）：能拖、能缩放；你的灯会亮起；点一盏灯看人和那句话；没有真人时只亮 🎭 ──
// AK.globe({title, sub, items: [{lon, lat, l 语言, face, img, nm, city, st, t, p, m, seed, own, id, real, key}], coll, fly: [lon, lat], ns, actions(it) → HTML, onAct(动作, it, 按钮), onClose})
const EARTH = "https://img.heyvoyo.com/map/earth_night.webp";   // NASA Earth Observatory / NOAA NGDC「The earth at night」（公有领域）
const PJ = (lon, lat) => [(lon + 180) / 360, (90 - lat) / 180];
let G = null, GO = {}, GS = 1, GX = 0, GY = 0, GW = 0, GH = 0;
function globe(o){ mount(); GO = o || {}; if (!G){ G = document.createElement("div"); G.id = "akGlobe"; G.className = "ak-globe"; G.dataset.nopy = ""; document.body.appendChild(G); }
  G.hidden = false; document.body.classList.add("ak-on"); GS = 1; glay.d = 0; const items = (GO.items || []).filter(it => it && it.lon != null && it.lat != null), real = items.filter(x => x.real).length;
  G.innerHTML = `<div class="ak-gvp"><div class="ak-gw"><img class="ak-gbase" src="${EARTH}" alt=""></div></div>
   <div class="ak-gtop"><button class="ak-gx" data-akgx aria-label="${esc(T("关上", "Close"))}">✕</button><h1>${esc(GO.pick ? T("拉近，点一下你住的地方", "Zoom in and tap where you live") : GO.title || T("今晚的世界", "The world tonight"))}</h1>${GO.pick ? `<p>${esc(T("只记到大约十公里，地图上不写地名。", "Only roughly (~10 km). No place names on the map."))}</p>` : GO.sub ? `<p dir="auto">${esc(GO.sub)}</p>` : ""}<span class="ak-glive">${real ? `💡 ${esc(T("真人点亮的灯：", "Lights from real people: "))}<b>${real}</b>` : esc(T("还没有真人点灯——现在亮着的都是 🎭 角色。你可以点亮第一盏 ✨", "No real lights yet — the ones on now are 🎭 characters. You could light the first ✨"))}</span>
   <div class="ak-glg"><span><i class="zh"></i>${esc(langName("zh"))}</span><span><i class="en"></i>${esc(langName("en"))}</span><span><i class="ot"></i>${esc(T("别的语言", "Other languages"))}</span><span><i class="me"></i>${esc(T("你", "You"))}</span></div></div>
   <div class="ak-gzb"><button data-akgz="1.5" aria-label="+">＋</button><button data-akgz="0.667" aria-label="-">－</button></div>
   <div class="ak-gsheet"></div><div class="ak-gcredit">Earth at night: NASA / NOAA NGDC (public domain)</div>`;
  G.querySelector(".ak-gbase").onload = glay; gwire(); glay();
  const w = G.querySelector(".ak-gw"); items.forEach((it, i) => { const [x, y] = PJ(it.lon, it.lat), el = document.createElement("button"); el.className = "ak-lamp " + (it.own ? "me" : it.l === "zh" ? "zh" : it.l === "en" ? "en" : "ot") + (it.seed ? " seed" : "");
    el.style.left = x * 100 + "%"; el.style.top = y * 100 + "%"; el.dataset.gi = i; el.style.animationDelay = (i % 7) * .3 + "s"; el.setAttribute("aria-label", strip(it.nm || "") + " " + strip(it.city || ""));
    const pic = it.face ? face(it.face) : it.img ? photo(it.img) : ""; el.innerHTML = `<i class="ak-glow"></i><b style="${pic ? `background-image:url('${esc(pic)}')` : ""}"></b>`; w.appendChild(el); });
  G._items = items; if (GO.fly) setTimeout(() => gfly(GO.fly), 120); }
function gfly(ll){ const vp = G.querySelector(".ak-gvp").getBoundingClientRect(), [x, y] = PJ(ll[0], ll[1]); GS = 3.2; GX = vp.width / 2 - x * GW * GS; GY = vp.height / 2 - y * GH * GS; gapply();
  const me = G.querySelector(".ak-lamp.me"); if (me){ me.classList.remove("flash"); void me.offsetWidth; me.classList.add("flash"); } toast(T("💡 你的灯亮了，世界看得见", "💡 Your light is on — the world can see it")); }
function glay(){ if (!G || G.hidden) return; const vp = G.querySelector(".ak-gvp"), r = vp.getBoundingClientRect(), w = G.querySelector(".ak-gw"); GW = Math.max(r.width, r.height * 1.25); GH = GW / 2; w.style.width = GW + "px"; w.style.height = GH + "px";
  if (!glay.d){ glay.d = 1; GX = r.width / 2 - GW * .55; GY = (r.height - GH) / 2 + 40; } gapply(); }
function gapply(){ const vp = G.querySelector(".ak-gvp"), r = vp.getBoundingClientRect(), w = G.querySelector(".ak-gw"); GX = Math.min(0, Math.max(r.width - GW * GS, GX)); GY = Math.min(r.height * .3, Math.max(r.height * .7 - GH * GS, GY));
  w.style.transform = `translate(${GX}px,${GY}px) scale(${GS})`; w.classList.toggle("zoomed", GS >= 2.2); w.querySelectorAll(".ak-lamp").forEach(c => c.style.transform = `translate(-50%,-50%) scale(${1 / GS})`); }
function gzoom(f, cx, cy){ const ns = Math.min(9, Math.max(1, GS * f)); GX = cx - (cx - GX) * ns / GS; GY = cy - (cy - GY) * ns / GS; GS = ns; gapply(); }
function gsheet(it){ const sh = G.querySelector(".ak-gsheet"); sh.innerHTML = `<div class="ak-ggr"></div>${person(it)}${it.img ? `<div class="ak-gimg" style="background-image:url('${esc(photo(it.img))}')"></div>` : ""}
    ${it.t ? sayable(it.t, {l: it.l, p: it.p, ns: GO.ns, spk: it.spk || it.id, cls: "ak-ln", urlKey: it.au ? (URLS["g:" + it.id] = it.au, "g:" + it.id) : ""}) : ""}${it.m ? `<div class="ak-mean" dir="auto">${esc(it.m)}</div>` : ""}
    ${GO.actions ? GO.actions(it) : ""}<div class="ak-mod">${modHTML(GO.coll || "", it)}</div>`; sh.classList.add("on"); sh._it = it;
  if (it.t) say(it.t, {l: it.l, ns: GO.ns, spk: it.spk || it.id, url: it.au}); }
function gwire(){ const vp = G.querySelector(".ak-gvp"); let drag = null, pts = new Map(), pinch = 0; G._mv = 0;
  vp.onpointerdown = e => { pts.set(e.pointerId, e); G._mv = 0; if (pts.size === 1) drag = {x: e.clientX - GX, y: e.clientY - GY}; };
  vp.onpointermove = e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e); if (pts.size === 2){ const [a, b] = [...pts.values()], dd = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pinch) gzoom(dd / pinch, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2); pinch = dd; G._mv = 9; return; }
    if (drag){ G._mv++; GX = e.clientX - drag.x; GY = e.clientY - drag.y; gapply(); } };
  vp.onpointerup = vp.onpointercancel = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) drag = null; };
  vp.addEventListener("wheel", e => { e.preventDefault(); gzoom(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY); }, {passive: false});
  G.onclick = e => { const c = s => e.target.closest(s);
    if (c("[data-akgx]")){ gclose(); return; }
    if (c("[data-akgz]")){ gzoom(+c("[data-akgz]").dataset.akgz, innerWidth / 2, innerHeight / 2); return; }
    const sh = G.querySelector(".ak-gsheet"), act = c("[data-akact]");
    if (act && sh._it){ tap(act); GO.onAct && GO.onAct(act.dataset.akact, sh._it, act); return; }
    if (c("[data-akhide],[data-akrep],[data-akdel]")){ setTimeout(() => { sh.classList.remove("on"); const it = sh._it; if (it){ const el = G.querySelector(`.ak-lamp[data-gi="${G._items.indexOf(it)}"]`); if (el) el.remove(); } }, 50); return; }
    if (GO.pick && G._mv < 4 && c(".ak-gvp")){ const r = G.querySelector(".ak-gw").getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height; if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return; const cb = GO.pick; GO.pick = null; gclose(); cb([r1(fx * 360 - 180), r1(90 - fy * 180)]); return; }
    const l = c(".ak-lamp"); if (l && G._mv < 4){ tap(l, 990); gsheet(G._items[+l.dataset.gi]); return; }
    if (!c(".ak-gsheet") && G._mv < 4) sh.classList.remove("on"); }; }
function gclose(){ if (G){ G.hidden = true; } if (!document.querySelector(".ak-page:not([hidden])")) document.body.classList.remove("ak-on"); GO.onClose && GO.onClose(); }
addEventListener("resize", () => { if (G && !G.hidden) glay(); });

// ── 分享卡：默认竖版 9:16，能换 1:1；长名字自动缩小字号；配文中英两份写好 ──
// AK.share({kicker, q 问题, line 你说的那句, p 拼音, name, city, img 你的照片（data:）, caption: {zh, en} 或 {list: [[语言, 文字], …]}（按顺序：先学的语言、再界面语言）, file 文件名})
let SH = null, SO = {}, SR = "916";
function share(o){ mount(); SO = o || {}; if (!SH){ SH = document.createElement("div"); SH.className = "ak-share"; SH.dataset.nopy = ""; document.body.appendChild(SH); SH.onclick = shClick; } SH.hidden = false; shDraw(); }
function fitFont(ctx, txt, max, size, min, weight, fam){ let s = size; do { ctx.font = `${weight} ${s}px ${fam}`; if (ctx.measureText(txt).width <= max) break; s -= 2; } while (s > min); return s; }
function wrap(ctx, txt, max, zh){ const out = []; let cur = ""; const units = zh ? [...txt] : txt.split(" ");
  units.forEach(u => { const test = cur ? cur + (zh ? "" : " ") + u : u; if (ctx.measureText(test).width > max && cur){ out.push(cur); cur = u; } else cur = test; }); if (cur) out.push(cur); return out; }
async function shDraw(){ const W = 1080, Hh = SR === "916" ? 1920 : 1080, c = document.createElement("canvas"); c.width = W; c.height = Hh; const x = c.getContext("2d"), fam = `"Noto Serif SC","PingFang SC","Hiragino Sans GB",Georgia,serif`, sans = `-apple-system,"PingFang SC","Helvetica Neue",Arial,sans-serif`;
  const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#0b1430"); g.addColorStop(1, "#14305c"); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
  if (SO.img){ await new Promise(ok => { const im = new Image(); im.onload = () => { const ph = SR === "916" ? Hh * .5 : Hh * .46, r = Math.max(W / im.width, ph / im.height), w = im.width * r, h = im.height * r; x.save(); x.beginPath(); x.rect(0, 0, W, ph); x.clip(); x.drawImage(im, (W - w) / 2, (ph - h) / 2, w, h); x.restore(); const gg = x.createLinearGradient(0, ph * .55, 0, ph); gg.addColorStop(0, "rgba(11,20,48,0)"); gg.addColorStop(1, "rgba(11,20,48,1)"); x.fillStyle = gg; x.fillRect(0, 0, W, ph); ok(); }; im.onerror = ok; im.src = SO.img; }); }
  let y = SO.img ? (SR === "916" ? Hh * .5 + 30 : Hh * .46 + 10) : (SR === "916" ? 360 : 150), pad = 90, mw = W - pad * 2, rtl = /[֐-ࣿ]/.test((SO.line || "") + (SO.name || ""));
  x.textBaseline = "top"; x.textAlign = rtl ? "right" : "left"; const X0 = rtl ? W - pad : pad; x.direction = rtl ? "rtl" : "ltr";
  x.fillStyle = "#ffc861"; x.font = `800 34px ${sans}`; x.fillText(SO.kicker || "", X0, y); y += 64;
  if (SO.q){ x.fillStyle = "#cdd6ea"; const s = fitFont(x, SO.q, mw, 46, 28, 700, fam); wrap(x, SO.q, mw, /[㐀-鿿]/.test(SO.q)).slice(0, 2).forEach(l => { x.fillText(l, X0, y); y += s * 1.35; }); y += 18; }
  if (SO.line){ x.fillStyle = "#ffffff"; const zh = /[㐀-鿿]/.test(SO.line); let s = SR === "916" ? 72 : 60; x.font = `900 ${s}px ${fam}`; let L = wrap(x, SO.line, mw, zh); while (L.length > (SR === "916" ? 6 : 4) && s > 36){ s -= 4; x.font = `900 ${s}px ${fam}`; L = wrap(x, SO.line, mw, zh); }
    L.forEach(l => { x.fillText(l, X0, y); y += s * 1.4; }); }
  if (SO.p){ x.fillStyle = "#9fb0d0"; const s = fitFont(x, SO.p, mw, 30, 20, 500, sans); wrap(x, SO.p, mw, false).slice(0, 3).forEach(l => { x.fillText(l, X0, y); y += s * 1.4; }); }
  const by = Hh - (SR === "916" ? 260 : 170); x.fillStyle = "#ffffff"; const nm = (SO.name || "") + (SO.city ? " · " + SO.city : ""), ns = fitFont(x, nm, mw, 44, 22, 800, sans); x.fillText(nm, X0, by);   // 名字长就缩小，不截断
  x.fillStyle = "#ffc861"; x.font = `800 36px ${sans}`; x.fillText("heyvoyo.com", X0, by + ns + 24);
  SH._url = c.toDataURL("image/png"); SH._c = c; const cap = SO.caption || {};
  SH.innerHTML = `<div class="ak-shb"><div class="ak-shh"><b>📤 ${esc(T("分享卡", "Share card"))}</b><span class="ak-seg"><button class="${SR === "916" ? "on" : ""}" data-akratio="916">9:16</button><button class="${SR === "11" ? "on" : ""}" data-akratio="11">1:1</button></span><button class="ak-gx s" data-akshx aria-label="${esc(T("关上", "Close"))}">✕</button></div>
    <img class="ak-shimg ${SR === "11" ? "sq" : ""}" src="${SH._url}" alt="">
    <div class="ak-rowlbl">${esc(cap.list ? T("配文（" + cap.list.map(c => LANGN[c[0]] ? LANGN[c[0]][0] : c[0]).join(" + ") + "，复制就能用）", "Caption (" + cap.list.map(c => LANGN[c[0]] ? LANGN[c[0]][1] : c[0]).join(" + ") + ", ready to paste)") : T("配文（中英两份，复制就能用）", "Caption (Chinese + English, ready to paste)"))}</div><textarea class="ak-cap" dir="auto" readonly>${esc((cap.list ? cap.list.map(c => c[1]) : [cap.zh, cap.en]).filter(Boolean).join("\n\n"))}</textarea>
    <div class="ak-shbt"><button data-aksharego>📤 ${esc(T("分享", "Share"))}</button><button data-aksave>⬇️ ${esc(T("保存图片", "Save image"))}</button><button data-akcopy>📋 ${esc(T("复制配文", "Copy caption"))}</button></div></div>`; }
async function shClick(e){ const c = s => e.target.closest(s);
  if (c("[data-akshx]") || e.target === SH){ SH.hidden = true; return; }
  if (c("[data-akratio]")){ SR = c("[data-akratio]").dataset.akratio; tap(c("[data-akratio]")); shDraw(); return; }
  const cap = SH.querySelector(".ak-cap").value;
  if (c("[data-akcopy]")){ try { await navigator.clipboard.writeText(cap); toast(T("配文复制好了", "Caption copied")); } catch(_){ SH.querySelector(".ak-cap").select(); } return; }
  if (c("[data-aksave]")){ const a = document.createElement("a"); a.href = SH._url; a.download = (SO.file || "heyvoyo") + (SR === "916" ? "-9x16" : "-1x1") + ".png"; document.body.appendChild(a); a.click(); a.remove(); return; }
  if (c("[data-aksharego]")){ try { const blob = await new Promise(ok => SH._c.toBlob(ok, "image/png")), f = new File([blob], (SO.file || "heyvoyo") + ".png", {type: "image/png"});
      if (navigator.canShare && navigator.canShare({files: [f]})){ await navigator.share({files: [f], text: cap}); return; } if (navigator.share){ await navigator.share({text: cap + "\nhttps://heyvoyo.com"}); return; } } catch(_){ return; }
    try { await navigator.clipboard.writeText(cap); } catch(_){} toast(T("这台设备不能直接分享：图片先保存，配文已经复制", "Can't share directly here — save the image; caption copied")); } }

// ── 「我试试 → 回来说」循环：有用 / 没用 / 还在试，每样有计数（计数由活动给真的数，不编）──
// AK.tryHTML(id, {counts: {yes, no, wip}（真人的数）, demo: true 显示「示意：一小时后 / 第二天」})；状态存 ak.v1 的 tries[id] = {t0, r}
const TRY_R = [["yes", "有用", "It worked"], ["no", "没用", "Didn't work"], ["wip", "还在试", "Still trying"]];
const TRYO = {};
function tryHTML(id, o){ o = o || TRYO[id] || {}; TRYO[id] = o; const s = ST().tries[id], n = o.counts || {}, mine = s && s.r;
  const cnt = TRY_R.map(r => { const v = (n[r[0]] || 0) + (mine === r[0] ? 1 : 0); return `<span class="ak-trc ${r[0]}">${esc(T(r[1], r[2]))} <b>${v}</b></span>`; }).join("");
  if (!s) return `<div class="ak-try" data-aktryid="${esc(id)}"><button class="ak-tryb" data-aktry>🧪 ${esc(T("我试试", "I'll try it"))}</button><div class="ak-trn">${cnt}</div></div>`;
  const back = s.r || (Date.now() - s.t0 > 3600e3 * (o.after || 1));
  return `<div class="ak-try" data-aktryid="${esc(id)}">${s.r ? `<div class="ak-trd">✓ ${esc(T("你回来说了：", "You came back and said: "))}<b>${esc(T(...TRY_R.find(r => r[0] === s.r).slice(1)))}</b> <button class="ak-link" data-aktryr="">${esc(T("改一下", "Change"))}</button></div>`
    : back ? `<div class="ak-trq">${esc(T("试了吗？回来说一声：", "Did you try it? Tell us:"))}</div><div class="ak-trbs">${TRY_R.map(r => `<button data-aktryr="${r[0]}">${esc(T(r[1], r[2]))}</button>`).join("")}</div>`
    : `<div class="ak-trq">🧪 ${esc(T("你在试了。过一会儿回来说说有没有用。", "You're trying it. Come back and say whether it worked."))}</div>${o.demo !== false ? `<div class="ak-trbs demo"><button data-aktrydemo="1">${esc(T("一小时后", "An hour later"))} ${sample()}</button><button data-aktrydemo="24">${esc(T("第二天", "Next day"))} ${sample()}</button></div>` : ""}`}<div class="ak-trn">${cnt}</div></div>`; }
const TRYCB = {};   // AK.onTry(id, fn(动作, 结果)) —— 活动想在回来说的时候存到后台，就登记一下
function tryClick(e){ const box = e.target.closest("[data-aktryid]"); if (!box) return false; const id = box.dataset.aktryid, o = ST(), b = e.target.closest("button"); if (!b) return true;
  if (b.matches("[data-aktry]")){ o.tries[id] = {t0: Date.now()}; SAVE(o); tap(b); TRYCB[id] && TRYCB[id]("start"); }
  else if (b.matches("[data-aktrydemo]")){ const s = o.tries[id]; if (s){ s.t0 = Date.now() - (+b.dataset.aktrydemo) * 3600e3 - 1000; SAVE(o); } tap(b); }
  else if (b.matches("[data-aktryr]")){ const s = o.tries[id] || (o.tries[id] = {t0: Date.now() - 7200e3}); const r = b.dataset.aktryr; if (r){ s.r = r; s.ts = Date.now(); stamp(T("回来说了 ✓", "CAME BACK ✓")); } else delete s.r; SAVE(o); tap(b); TRYCB[id] && TRYCB[id](r ? "report" : "undo", r); }
  else return true;
  const nb = document.createElement("div"); nb.innerHTML = tryHTML(id); box.replaceWith(nb.firstChild); return true; }

// ── 照片：缩小（照 street_snap 的 shrink）──
function shrink(file, max, q){ return new Promise(ok => { const im = new Image(); im.onload = () => { const r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", q)); URL.revokeObjectURL(im.src); }; im.onerror = () => ok(""); im.src = URL.createObjectURL(file); }); }
const blobB64 = b => new Promise(ok => { try { const f = new FileReader(); f.onload = () => ok(String(f.result).split(",")[1] || ""); f.onerror = () => ok(""); f.readAsDataURL(b); } catch(e){ ok(""); } });
// 位置只记到 0.1 度（约十公里）
const r1 = v => Math.round(v * 10) / 10;

// ── 统一的点击：听、母语、参考说法、举报 / 藏 / 删、试试循环 ──
document.addEventListener("click", e => { const c = s => e.target.closest(s);
  if (tryClick(e)) return;
  const sy = c("[data-aksay]"); if (sy && !c(".ak-gsheet [data-akact]")){ tap(sy, 900); say(sy.dataset.aksay, {l: sy.dataset.akl, spk: sy.dataset.akspk, ns: sy.dataset.akns, url: sy.dataset.akurl ? URLS[sy.dataset.akurl] : ""}); return; }
  const m = c("[data-akmother]"); if (m){ mother(m.dataset.akmother); m.parentElement.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === m)); tap(m); document.dispatchEvent(new CustomEvent("ak:mother", {detail: m.dataset.akmother})); return; }
  const rf = c("[data-akref]"); if (rf){ const r = rf.parentElement.querySelector(".ak-ref"); r.hidden = false; rf.hidden = true; tap(rf); const s = r.querySelector("[data-aksay]"); if (s) say(s.dataset.aksay, {l: s.dataset.akl, ns: s.dataset.akns, spk: "_"}); return; }
  const hd = c("[data-akhide]"); if (hd){ if (hd.dataset.akhide) hide(hd.dataset.akhide); toast(T("藏起来了", "Hidden")); document.dispatchEvent(new CustomEvent("ak:changed")); return; }
  const rp = c("[data-akrep]"); if (rp){ const [cl, ...id] = rp.dataset.akrep.split("/"); report(cl, id.join("/")); document.dispatchEvent(new CustomEvent("ak:changed")); return; }
  const dl = c("[data-akdel]"); if (dl){ if (dl.dataset.sure !== "1"){ dl.dataset.sure = "1"; dl.textContent = T("再点一下，确定删掉", "Tap again to delete"); return; } const [cl, ...id] = dl.dataset.akdel.split("/"); del(cl, id.join("/")).then(ok => { toast(ok ? T("删掉了", "Deleted") : T("没删掉，等一会儿再试", "Couldn't delete — try again later")); document.dispatchEvent(new CustomEvent("ak:changed", {detail: {deleted: dl.dataset.akdel, ok}})); }); return; }
});

// ── 样式（只插一次）──
function mount(){ if (document.getElementById("akCss")) return; const s = document.createElement("style"); s.id = "akCss"; s.textContent = CSS; document.head.appendChild(s); }
const CSS = `body.ak-on{overflow:hidden}
:where(.ak-page,.ak-kit,.ak-globe,.ak-share,.ak-pop,.ak-toast,.ak-stamp) :is(p,h1,h2,h3,div,button,span,small,b,label,i,u){unicode-bidi:plaintext}
.ak-page{position:fixed;inset:0;z-index:63;background:#fbf7ee;color:#24303a;overflow-y:auto;overflow-x:hidden;font:15px/1.55 -apple-system,"PingFang SC","Helvetica Neue",sans-serif}
.ak-page *,.ak-globe *,.ak-share *{box-sizing:border-box}:where(.ak-page,.ak-globe,.ak-share) button{font:inherit;cursor:pointer;color:inherit}
.ak-demo{display:inline-block;font-size:10.5px;font-weight:700;background:#fde7df;color:#a4432a;border-radius:99px;padding:1px 7px;white-space:nowrap;vertical-align:1px}
.ak-tag{font-size:10.5px;background:#f1ece0;border-radius:99px;padding:1px 7px;color:#6b7488;white-space:nowrap}.ak-tag.npc{background:#efe7f6;color:#6a4c8c}.ak-tag.nat{background:#e4eefb;color:#2c64b8}.ak-tag.lrn{background:#fde7df;color:#a4432a}.ak-tag.real{background:#e6f1ef;color:#2f7d70}
.ak-say{cursor:pointer;unicode-bidi:isolate}.ak-say:hover{color:#e2552f}.ak-ear{font-style:normal;font-size:.62em;opacity:.55;margin-inline-start:4px;vertical-align:.15em}
.ak-py{display:block;color:#8a8f9c;font:12.5px/1.45 -apple-system,sans-serif;font-weight:400;letter-spacing:.01em;text-align:start}
.ak-mean{color:#6b7488;font-size:13px;margin-top:3px;unicode-bidi:isolate}
.ak-av{width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:50% 25%;flex:none;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.14);background:#c9bfa8}.ak-av.s{width:30px;height:30px}
.ak-av0{display:grid;place-items:center;background:#e2552f;color:#fff;font-weight:800;font-size:14px}
.ak-person{display:flex;gap:9px;align-items:center;min-width:0}.ak-pn{min-width:0;line-height:1.3}.ak-pn b{color:#14305c;font-size:14.5px;overflow-wrap:anywhere}.ak-pn small{display:block;color:#6b7488;font-size:12px}
.ak-lv{display:flex;gap:4px;margin:12px 0 8px;background:#efe8d8;border-radius:99px;padding:3px}.ak-lv button{flex:1;border:0;background:none;border-radius:99px;padding:6px 4px;font-weight:800;font-size:12.5px;color:#6b7488;min-width:0}.ak-lv button.on{background:#fff;color:#14305c;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.ak-rowlbl{font-size:11.5px;color:#6b7488;text-align:center;margin-top:10px;letter-spacing:.03em}
.ak-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0 0}.ak-g{display:inline-flex;gap:0;border:1px dashed currentColor;border-radius:8px;overflow:hidden;vertical-align:baseline}.ak-g i{font-style:normal;padding:0 6px;cursor:pointer}.ak-g i+i{border-inline-start:1px dashed currentColor}.ak-g i.on{background:#ffd27a;color:#14305c}.ak-gnote{font-size:11.5px;color:#7a8296;text-align:center;margin:4px 0 0}.ak-chip{border:1.5px solid #e6dfcf;background:#fff;border-radius:12px;padding:5px 10px;font-weight:700;color:#14305c;line-height:1.25;max-width:100%}.ak-chip.on{background:#14305c;color:#fff;border-color:#14305c}.ak-chip.dim{opacity:.42}.ak-chip small{display:block;font-size:10.5px;font-weight:500;opacity:.75}
.ak-words{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.ak-words button{border:0;background:#f6f1e6;border-radius:10px;padding:6px 8px;text-align:start;font-size:13px;line-height:1.3;min-width:0}.ak-words b{color:#14305c}.ak-words small{display:block;color:#6b7488;font-size:11px}
.ak-mini{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:4px 11px;font-weight:700;font-size:12.5px;color:#14305c;line-height:1.25}.ak-mini.on{background:#14305c;color:#fff;border-color:#14305c}.ak-mini small{display:block;font-weight:500;font-size:10px;opacity:.75}
.ak-refw{text-align:center;margin-top:10px}.ak-ref{background:#f6f1e6;border-radius:12px;padding:10px;margin-top:8px;font:700 15px/1.6 "Noto Serif SC",Georgia,serif;color:#14305c;text-align:start}
.ak-mic{text-align:center;margin-top:12px}.ak-micb{width:66px;height:66px;border-radius:50%;border:0;background:#e2552f;color:#fff!important;font-size:28px;box-shadow:0 6px 16px rgba(226,85,47,.35);touch-action:none;-webkit-user-select:none;user-select:none}
.ak-mic.rec .ak-micb{background:#c0392b;animation:akpulse 1s infinite}@keyframes akpulse{50%{box-shadow:0 0 0 14px rgba(226,85,47,.15)}}
.ak-bars{display:none;justify-content:center;gap:3px;height:22px;align-items:center;margin-top:6px}.ak-mic.rec .ak-bars{display:flex}.ak-bars i{width:4px;border-radius:2px;background:#e2552f;animation:akbar .5s infinite alternate}.ak-bars i:nth-child(2){animation-delay:.1s}.ak-bars i:nth-child(3){animation-delay:.2s}.ak-bars i:nth-child(4){animation-delay:.3s}.ak-bars i:nth-child(5){animation-delay:.15s}@keyframes akbar{from{height:4px}to{height:20px}}
.ak-ring{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);pointer-events:none;overflow:visible;transform:rotate(-90deg)}.ak-ring circle{fill:none;stroke:#e2552f;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:0;animation:akRing linear forwards}@keyframes akRing{to{stroke-dashoffset:100}}
.ak-live{font-size:13.5px;color:#14305c;min-height:20px;margin-top:5px;overflow-wrap:anywhere}
.ak-choose{display:flex;gap:8px;margin-top:12px}.ak-choose button{flex:1;min-width:0;border-radius:14px;padding:10px 8px;font-weight:800;border:1.5px solid #e6dfcf;background:#fff;color:#14305c;line-height:1.3}.ak-choose button small{display:block;font-weight:500;font-size:11.5px;color:#6b7488}.ak-choose button.w{background:#e2552f;color:#fff;border-color:#e2552f}.ak-choose button.w small{color:#ffe1d6}
.ak-link{border:0;background:none;color:#6b7488;text-decoration:underline;font-size:12px;padding:0}
.ak-mother{display:flex;flex-wrap:wrap;gap:5px;align-items:center;font-size:12.5px;color:#6b7488;margin:8px 0}.ak-mother button{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:3px 10px;font-weight:700;font-size:12px;color:#14305c}.ak-mother button.on{background:#14305c;color:#fff;border-color:#14305c}
.ak-press{transform:scale(.94);transition:transform .12s}
.ak-note{position:fixed;pointer-events:none;z-index:90;font-size:18px;color:#e2552f;animation:akfl .9s forwards}@keyframes akfl{to{transform:translateY(-46px);opacity:0}}
.ak-toast{position:fixed;top:64px;left:50%;transform:translate(-50%,-20px);opacity:0;background:#14305c;color:#fff;font-weight:800;padding:7px 15px;border-radius:99px;transition:.3s;z-index:91;font-size:13px;max-width:calc(100vw - 32px);text-align:center;pointer-events:none}.ak-toast.on{opacity:1;transform:translate(-50%,0)}
.ak-pop{position:fixed;left:50%;bottom:18px;width:min(420px,calc(100vw - 24px));z-index:89;display:flex;gap:9px;align-items:center;background:#fff;border-radius:16px;padding:9px 12px;box-shadow:0 8px 26px rgba(20,48,92,.22);transform:translate(-50%,160%);transition:.4s cubic-bezier(.3,1.4,.5,1);font-size:13.5px;pointer-events:none;color:#24303a}.ak-pop.on{transform:translate(-50%,0)}.ak-pop b{color:#14305c}
.ak-stamp{position:fixed;left:50%;top:40%;z-index:92;transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0;border:4px solid #e2552f;color:#e2552f;border-radius:12px;padding:8px 14px;font:900 20px/1.25 Georgia,"Noto Serif SC",serif;text-align:center;background:rgba(251,247,238,.95);pointer-events:none;animation:akst .5s forwards;max-width:calc(100vw - 40px)}
.ak-stamp small{display:block;font:700 11px Georgia,serif;letter-spacing:.08em;margin-top:2px}@keyframes akst{to{opacity:1;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}
.ak-cf{position:fixed;top:-10px;width:7px;height:11px;z-index:93;pointer-events:none;animation:akcf 1.8s ease-in forwards}@keyframes akcf{to{transform:translateY(105vh) rotate(540deg)}}
.ak-globe{position:fixed;inset:0;z-index:70;background:#02050c;color:#fff;overflow:hidden}
.ak-gvp{position:absolute;inset:0;overflow:hidden;cursor:grab;touch-action:none}.ak-gw{position:absolute;left:0;top:0;transform-origin:0 0}.ak-gbase{display:block;width:100%;height:100%;user-select:none;-webkit-user-drag:none;filter:brightness(.85)}
.ak-lamp{position:absolute;width:30px;height:30px;border:0;padding:0;background:none;transform:translate(-50%,-50%)}.ak-glow{position:absolute;left:50%;top:50%;width:22px;height:22px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff6d8 0,#ffc861 30%,rgba(255,190,90,.3) 55%,transparent 72%);animation:akbr 3s ease-in-out infinite}
.ak-lamp.zh .ak-glow{background:radial-gradient(circle,#fff 0,#ff9a7a 30%,rgba(255,120,90,.3) 55%,transparent 72%)}.ak-lamp.ot .ak-glow{background:radial-gradient(circle,#fff 0,#7fd6c2 30%,rgba(120,210,190,.3) 55%,transparent 72%)}.ak-lamp.me .ak-glow{width:34px;height:34px;background:radial-gradient(circle,#fff 0,#fff0b0 30%,rgba(255,230,140,.4) 55%,transparent 72%)}
@keyframes akbr{50%{opacity:.6}}.ak-lamp b{display:none;position:absolute;left:50%;top:50%;width:30px;height:30px;transform:translate(-50%,-50%);border-radius:50%;background:#1a2340 center/cover;box-shadow:0 0 10px 3px rgba(255,200,110,.7);border:2px solid #ffe9b8}.zoomed .ak-lamp b{display:block}
.ak-lamp.flash .ak-glow{animation:akflash 1.6s ease-out}@keyframes akflash{0%{transform:translate(-50%,-50%) scale(4);filter:brightness(1.8)}100%{transform:translate(-50%,-50%) scale(1)}}
.ak-gtop{position:absolute;left:0;right:0;top:10px;text-align:center;padding:0 56px;pointer-events:none}.ak-gtop>*{pointer-events:auto}.ak-gtop h1{margin:6px 0 0;font:900 22px/1.3 "Noto Serif SC",serif;text-shadow:0 2px 12px #000}.ak-gtop p{margin:4px 0 0;color:#ffe2a0;font-size:13px;text-shadow:0 1px 6px #000}
.ak-glive{display:inline-block;margin-top:6px;background:rgba(255,255,255,.12);border-radius:12px;padding:3px 11px;font-size:12.5px}.ak-glive b{color:#ffc861}
.ak-glg{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:6px;font-size:11.5px;color:#cdd6ea}.ak-glg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-inline-end:4px;background:#ffc861}.ak-glg i.zh{background:#ff9a7a}.ak-glg i.ot{background:#7fd6c2}.ak-glg i.me{background:#fff0b0;box-shadow:0 0 6px #fff0b0}
.ak-gx{position:absolute;inset-inline-start:12px;top:0;border:0;background:rgba(255,255,255,.15);color:#fff;width:36px;height:36px;border-radius:50%;font-size:16px}.ak-gx.s{position:static;background:#efe8d8;color:#14305c;width:32px;height:32px}
.ak-gzb{position:absolute;inset-inline-end:14px;bottom:110px;display:flex;flex-direction:column;gap:6px}.ak-gzb button{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:20px}
.ak-gsheet{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;max-height:72%;overflow-y:auto;background:#fbf7ee;color:#24303a;border-radius:20px 20px 0 0;padding:10px 16px 20px;transform:translateY(110%);transition:.35s cubic-bezier(.3,1.2,.5,1);z-index:3;box-shadow:0 -10px 30px rgba(0,0,0,.35)}.ak-gsheet.on{transform:none}
.ak-ggr{width:40px;height:4px;border-radius:2px;background:#d9cfba;margin:0 auto 10px}.ak-gimg{height:170px;border-radius:12px;background:#ccc center 30%/cover;margin:8px 0}
.ak-ln{display:block;font:700 17px/1.6 "Noto Serif SC",Georgia,serif;color:#14305c;margin-top:8px}.ak-mod{margin-top:10px;font-size:12px;color:#6b7488}
.ak-gcredit{position:absolute;inset-inline-start:10px;bottom:6px;font-size:10px;color:rgba(255,255,255,.45)}
.ak-share{position:fixed;inset:0;z-index:80;background:rgba(6,10,24,.7);display:grid;place-items:center;padding:16px;overflow-y:auto}.ak-shb{background:#fbf7ee;color:#24303a;border-radius:18px;padding:12px 14px 14px;width:min(420px,100%);max-height:100%;overflow-y:auto}
.ak-shh{display:flex;align-items:center;gap:8px}.ak-shh b{flex:1;color:#14305c}.ak-seg{display:inline-flex;background:#efe8d8;border-radius:99px;padding:3px}.ak-seg button{border:0;background:none;border-radius:99px;padding:4px 10px;font-weight:800;font-size:12px;color:#6b7488}.ak-seg button.on{background:#fff;color:#14305c}
.ak-shimg{display:block;width:auto;max-width:100%;height:46vh;max-height:520px;margin:10px auto 0;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.25)}.ak-shimg.sq{height:auto;width:100%;max-height:none}
.ak-cap{width:100%;min-height:96px;border:1.5px solid #e6dfcf;border-radius:12px;padding:8px 10px;font:13px/1.5 -apple-system,sans-serif;background:#fff;margin-top:6px;resize:vertical}
.ak-shbt{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.ak-shbt button{flex:1 1 30%;border:0;border-radius:99px;padding:10px 8px;font-weight:800;background:#14305c;color:#fff;font-size:13px}.ak-shbt button:first-child{background:#e2552f}
.ak-try{background:#fff;border-radius:14px;padding:10px 12px;margin-top:8px;box-shadow:0 2px 8px rgba(20,48,92,.06)}.ak-tryb{border:0;border-radius:99px;padding:8px 16px;font-weight:800;background:#2f7d70;color:#fff}
.ak-trq{font-size:13.5px;color:#14305c}.ak-trbs{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.ak-trbs button{border:1.5px solid #e6dfcf;background:#fff;border-radius:99px;padding:5px 12px;font-weight:700;font-size:12.5px;color:#14305c}.ak-trbs.demo button{border-style:dashed}
.ak-trn{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px;font-size:12px;color:#6b7488}.ak-trn b{color:#14305c}.ak-trd{font-size:13.5px}`;

window.AK = {ls, esc, strip, today, ymd, UI, ZH, T, TR, TX, LG, uid, logged, login, sample, sampleW, langName, bcp,
  MOTHERS, mother, motherHTML, voices: VOICES, fnv, say, hush, sayable, blip, tap, toast, stamp, confetti, pop,
  face, photo, person, urls: URLS, meanOf, fixEn, fixZh, fixPy, fixFr, fix, build, buildP, joinB, clashes, tagsOf, pickClash, CLASH, zhNum, zhMoney, enMoney, frMoney, gram, LA, mutedFr,
  LEVELS, level, levelsHTML, opt, optM, chipsHTML, wordsHTML, refHTML, micHTML, mic,
  sendKeepHTML, post, err: () => ERR, dupErr, del, report, hide, hidden, blocked, modHTML, load, one, fit, globe, globeClose: gclose, share,
  tryHTML, onTry: (id, fn) => { TRYCB[id] = fn; }, shrink, blobB64, r1, mount};
})();

