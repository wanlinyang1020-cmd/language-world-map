/* fr_tool.js */
// 🔤 法语点词工具（2026-11-11）：给学法语的人——软件里任何法语词，点一下（按钮、链接里的长按）就弹出：
//   词和原形（mange ← manger）、读音（不发音的字母是灰的）、名词是 le 还是 la、意思、听（慢 / 正常）、说一遍；
//   j'ai、l'école、qu'est-ce que、y a-t-il 这种省音和连写会拆开讲；句子里两个词连读（les‿amis）会提示。
// 另一页：「发音」（查一个词 · 鼻音 · r · u 和 ou · é è e · 不发音的词尾 · 连读和省音 · 容易混的词）。
// 对外：window.FRTOOL = {open(词), close(), sounds(), look(词), ipa(词), lang(l), voiceKey(句子), everywhere(true)}。
// 只在 window.HV_LEARN === "fr" 时管点词，而且只认 lang="fr" 里面的字（见下面 isFr）。
// 词典：自己写的种子词表 fr_seed.txt，gen_fr_dict.py 生成 fr_dict.txt / fr_mean.txt，build 时填进下面两个占位。词典里没有的词只能听，不猜读音。
// 声音：先用手机 / 浏览器自带的法语朗读；以后有录音时放录音——window.FR_VOICE_HAS（Set，里面是 FRTOOL.voiceKey(句子)）有就放 img.heyvoyo.com/voice/<key>.mp3。
(function(){
if (window.FRTOOL) return;
const ON = () => window.HV_LEARN === "fr";
let LG = "en", LGFIX = false;
const LGS = ["zh", "en", "es", "ja", "ar"];
const sync = () => { if (!LGFIX){ const l = (document.documentElement.lang || "en").slice(0, 2); LG = LGS.includes(l) ? l : "en"; } };
sync();
// 界面文字：中文、英文是写的人能把握的；西班牙语、日语、阿拉伯语是 2026-11-11 先给的简短版本，还没请母语的人看过（见 _接线待办/fr_tool.md）。
// 变化的说明不用语法名称（用户不要课本味）：t_* 是给人看的说法，g_* 是折起来的「语法名称」小字。
const TX = {
 en: {listen: "🔊 Listen", say: "🎙️ Say it", tapHold: "Tap once, or hold while you speak.", noMic: "No microphone here — try it on your phone.", listening: "Listening… it stops by itself", notHeard: "Didn't catch that — tap and try again.", heard: "✓ Heard:", got: "Heard", again: "— have another go.", yours: "▶︎ Now you", model: "First the model, then you.",
   noIpa: "No pronunciation notes for this word yet — you can still listen.", noVoice: "This device has no French voice. On a phone: Settings → add a French voice (text-to-speech).", grey: "Grey letters are silent.", lk: "The green letter is said here, because the next word starts with a vowel.", from: "from", also: "Could also be", forms: "Other forms ▾", less: "Hide ▴", colon: ": ",
   m: "masculine", f: "feminine", mf: "masculine or feminine", pl: "plural", fpl: "feminine plural", alt: "before a vowel", fixed: "Fixed phrase", link: "Linking", linkS: (l, c) => `the ${l} is sounded here, as <bdi>/${c}/</bdi>`, elide: (a, b) => `${a} = ${b}: the vowel drops before a vowel sound`, tLink: "the t is only there to make it easier to say", asp: "This h is silent, but nothing links or shortens before it (le, not l').",
   numC: (w, i) => `Before a word starting with a consonant, ${w} is said <bdi>/${i}/</bdi>.`,
   t_pr: "now", t_imp: "used to / was …ing", t_fut: "will", t_cond: "would", t_pp: "done", t_ppr: "while …ing", t_sub: "after que", t_inf: "dictionary form", present: "Who's doing it", ppL: "Already did it (j'ai …)", ppLe: "Already did it (je suis …)",
   gram: "Grammar names", g_pr: "present", g_imp: "imperfect", g_fut: "future", g_cond: "conditional", g_pp: "past participle", g_ppr: "present participle", g_sub: "subjunctive", g_inf: "infinitive",
   p_n: "noun", p_adj: "describing word", p_v: "action", p_adv: "how / when", p_x: "small word",
   sounds: "French sounds", lookH: "Look up any word", lookP: "Type a word, or a few words like la table or j'ai.", go: "Go", nasH: "Four nose vowels", nasP: "Air through the nose, and no “n” sound after it. Tap to hear.", nasUn: "Many people in France now say “un” just like “in”.",
   rH: "The French r", rP: "Made at the back of the mouth, like a soft gargle. The tongue tip stays down behind the bottom teeth.", uH: "u and ou", uP: "ou is “oo”. For u: say “ee”, keep your tongue there, and round your lips.", eH: "é · è · e · eu", eP: "é is tight like “ay” without the glide; è is open like “e” in bed; plain e is a quick “uh”; eu is é with rounded lips.",
   silH: "Silent endings", silP: "A final e and most final consonants are not said. Final c, r, f, l usually are.", silE: "Add an e and the consonant wakes up", liaH: "Linking and dropping", liaP: "A silent last letter comes back before a vowel. Small words lose their vowel before a vowel.", liaNo: "no linking: this h blocks it",
   mixH: "Easy to mix up", mixP: "Tap ▶︎, then pick the one you heard.", play: "▶︎ Play", which: "Which one?", right: "✓ Yes —", wasIt: "It was"},
 zh: {listen: "🔊 听", say: "🎙️ 说一遍", tapHold: "点一下或按住说。", noMic: "这里用不了麦克风，在手机上试。", listening: "在听……说完会自己停", notHeard: "没听清，再点一下说一遍。", heard: "✓ 听到了：", got: "听到的是", again: "——再来一次。", yours: "▶︎ 听听自己", model: "先放原声，再放你说的。",
   noIpa: "还没有这个词的读音标注，可以先听。", noVoice: "这台设备没有法语朗读声音。手机上可以在「设置」里添加法语的朗读声音。", grey: "灰色的字母不发音。", lk: "绿色的字母在这里要读出来，因为后面的词是元音开头。", from: "原形", also: "也可能是", forms: "别的样子 ▾", less: "收起 ▴", colon: "：",
   m: "阳性", f: "阴性", mf: "阳性阴性都可以", pl: "复数", fpl: "阴性复数", alt: "用在元音前面", fixed: "固定说法", link: "连读", linkS: (l, c) => `${l} 在这里读出来，读成 <bdi>/${c}/</bdi>`, elide: (a, b) => `${a} = ${b}：后面是元音，元音省掉了`, tLink: "这个 t 只是为了好读加的", asp: "这个 h 不发音，可是前面不连读、也不省音（说 le，不说 l'）。",
   numC: (w, i) => `后面的词是辅音开头时，${w} 读 <bdi>/${i}/</bdi>。`,
   t_pr: "现在", t_imp: "以前常常…… / 那时正在……", t_fut: "以后会……", t_cond: "如果……就会……", t_pp: "做完了", t_ppr: "一边……", t_sub: "que 后面的说法", t_inf: "原本的样子", present: "谁在做，就怎么说", ppL: "已经做过了（j'ai ……）", ppLe: "已经做过了（je suis ……）",
   gram: "语法名称", g_pr: "现在时", g_imp: "未完成过去时", g_fut: "简单将来时", g_cond: "条件式", g_pp: "过去分词", g_ppr: "现在分词", g_sub: "虚拟式", g_inf: "不定式",
   p_n: "东西、人", p_adj: "形容", p_v: "动作", p_adv: "怎么样、什么时候", p_x: "小词",
   sounds: "法语发音", lookH: "查一个词怎么读", lookP: "输入一个或几个法语词，比如 la table、j'ai。", go: "查", nasH: "四个鼻音", nasP: "气从鼻子出来，后面不带 n 的音。点一下能听。", nasUn: "现在很多法国人把 un 读得跟 in 一样。",
   rH: "法语的 r", rP: "在嘴的后面发，像轻轻漱口。舌尖放在下牙后面不动，不卷舌。", uH: "u 和 ou", uP: "ou 是「乌」。u：先说「衣」，舌头不动，把嘴唇收圆，就是「鱼」的韵母。", eH: "é · è · e · eu", eP: "é 嘴扁、紧；è 嘴张大一点；不带符号的 e 是很轻的「呃」；eu 是嘴唇收圆的 é。",
   silH: "不发音的词尾", silP: "词尾的 e 和大多数辅音不读。词尾的 c、r、f、l 常常要读。", silE: "加了 e，前面的辅音就读出来", liaH: "连读和省音", liaP: "不发音的词尾，碰到后面是元音就读出来。小词碰到元音，自己的元音省掉。", liaNo: "不连读：这个 h 挡着",
   mixH: "容易混的词", mixP: "点 ▶︎，听到的是哪一个？", play: "▶︎ 听", which: "是哪一个？", right: "✓ 对，是", wasIt: "刚才是"},
 es: {listen: "🔊 Escuchar", say: "🎙️ Dilo", tapHold: "Toca una vez o mantén pulsado mientras hablas.", noMic: "Aquí no hay micrófono: pruébalo en el móvil.", listening: "Escuchando… se para solo", notHeard: "No te he oído bien. Toca y prueba otra vez.", heard: "✓ Te he oído:", got: "He oído", again: "— prueba otra vez.", yours: "▶︎ Ahora tú", model: "Primero el original, luego tú.",
   noIpa: "Todavía no tenemos la pronunciación de esta palabra, pero puedes escucharla.", noVoice: "Este dispositivo no tiene voz en francés. En el móvil: Ajustes → añade una voz en francés.", grey: "Las letras grises no se pronuncian.", lk: "La letra verde se pronuncia aquí, porque la palabra siguiente empieza por vocal.", from: "de", also: "También puede ser", forms: "Otras formas ▾", less: "Ocultar ▴", colon: ": ",
   m: "masculino", f: "femenino", mf: "masculino o femenino", pl: "plural", fpl: "femenino plural", alt: "delante de vocal", fixed: "Expresión fija", link: "Enlace", linkS: (l, c) => `aquí la ${l} se pronuncia, como <bdi>/${c}/</bdi>`, elide: (a, b) => `${a} = ${b}: la vocal se cae delante de otra vocal`, tLink: "la t solo está para que se diga más fácil", asp: "Esta h no suena, pero delante no hay enlace ni se acorta (le, no l').",
   numC: (w, i) => `Delante de una palabra que empieza por consonante, ${w} se dice <bdi>/${i}/</bdi>.`,
   t_pr: "ahora", t_imp: "antes solía… / estaba …ndo", t_fut: "va a…", t_cond: "…ría (si…)", t_pp: "hecho", t_ppr: "mientras …ndo", t_sub: "después de que", t_inf: "forma de diccionario", present: "Según quién lo hace", ppL: "Ya lo hice (j'ai …)", ppLe: "Ya lo hice (je suis …)",
   gram: "Nombres gramaticales", g_pr: "presente", g_imp: "imperfecto", g_fut: "futuro", g_cond: "condicional", g_pp: "participio", g_ppr: "participio presente", g_sub: "subjuntivo", g_inf: "infinitivo",
   p_n: "cosa o persona", p_adj: "cómo es", p_v: "acción", p_adv: "cómo / cuándo", p_x: "palabra pequeña",
   sounds: "Sonidos del francés", lookH: "Busca cualquier palabra", lookP: "Escribe una palabra o unas pocas, como la table o j'ai.", go: "Ir", nasH: "Cuatro vocales nasales", nasP: "El aire sale por la nariz y no suena ninguna “n” después. Toca para oír.", nasUn: "Mucha gente en Francia dice “un” igual que “in”.",
   rH: "La r francesa", rP: "Se hace al fondo de la boca, como una gárgara suave. La punta de la lengua se queda abajo.", uH: "u y ou", uP: "ou es “u”. Para la u francesa: di “i”, deja la lengua ahí y redondea los labios.", eH: "é · è · e · eu", eP: "é es cerrada; è es abierta; la e sola es una “e” corta y floja; eu es é con los labios redondos.",
   silH: "Finales mudos", silP: "La e final y casi todas las consonantes finales no se dicen. La c, r, f, l finales casi siempre sí.", silE: "Añade una e y la consonante se despierta", liaH: "Enlaces y vocales que se caen", liaP: "Una letra final muda vuelve a sonar delante de vocal. Las palabras pequeñas pierden su vocal delante de vocal.", liaNo: "sin enlace: esta h lo impide",
   mixH: "Fáciles de confundir", mixP: "Toca ▶︎ y elige la que has oído.", play: "▶︎ Oír", which: "¿Cuál es?", right: "✓ Sí —", wasIt: "Era"},
 ja: {listen: "🔊 聞く", say: "🎙️ 言ってみる", tapHold: "1回タップ、または押したまま話してください。", noMic: "ここではマイクが使えません。スマホで試してください。", listening: "聞いています… 自動で止まります", notHeard: "よく聞き取れませんでした。もう一度タップしてください。", heard: "✓ 聞こえました：", got: "聞こえたのは", again: "— もう一度どうぞ。", yours: "▶︎ 自分の声", model: "先にお手本、次にあなた。",
   noIpa: "この単語の発音メモはまだありません。聞くことはできます。", noVoice: "この端末にはフランス語の読み上げ音声がありません。スマホの「設定」でフランス語の音声を追加できます。", grey: "グレーの文字は発音しません。", lk: "緑の文字は、次の語が母音で始まるのでここでは発音します。", from: "もとの形", also: "ほかの可能性", forms: "ほかの形 ▾", less: "閉じる ▴", colon: "：",
   m: "男性", f: "女性", mf: "男性・女性どちらも", pl: "複数", fpl: "女性・複数", alt: "母音の前", fixed: "決まった言い方", link: "リエゾン", linkS: (l, c) => `ここでは ${l} を <bdi>/${c}/</bdi> と発音します`, elide: (a, b) => `${a} = ${b}：母音の前で母音が落ちます`, tLink: "この t は言いやすくするためだけのものです", asp: "この h は発音しませんが、前でつなげたり短くしたりしません（l' ではなく le）。",
   numC: (w, i) => `子音で始まる語の前では、${w} は <bdi>/${i}/</bdi> と言います。`,
   t_pr: "いま", t_imp: "以前よく… / そのとき…していた", t_fut: "これから…する", t_cond: "もし…なら…する", t_pp: "…した", t_ppr: "…しながら", t_sub: "que のあとの形", t_inf: "辞書の形", present: "だれがするかで変わる", ppL: "もう…した（j'ai …）", ppLe: "もう…した（je suis …）",
   gram: "文法の名前", g_pr: "直説法現在", g_imp: "半過去", g_fut: "単純未来", g_cond: "条件法", g_pp: "過去分詞", g_ppr: "現在分詞", g_sub: "接続法", g_inf: "不定詞",
   p_n: "もの・人", p_adj: "ようす", p_v: "動き", p_adv: "どのように・いつ", p_x: "小さな語",
   sounds: "フランス語の音", lookH: "単語を調べる", lookP: "単語をひとつ、または la table、j'ai のように数語入れてください。", go: "調べる", nasH: "4つの鼻母音", nasP: "息を鼻から出し、あとに「ン」をつけません。タップで聞けます。", nasUn: "いまはフランスの多くの人が un を in と同じように言います。",
   rH: "フランス語の r", rP: "口の奥で、軽くうがいをするように出します。舌先は下の歯の裏に置いたまま。", uH: "u と ou", uP: "ou は「ウ」。u は「イ」の舌のまま唇を丸めます。", eH: "é · è · e · eu", eP: "é は口を横に引いた「エ」、è は口を開けた「エ」、記号のない e は軽い「ウ」に近い音、eu は é の口で唇を丸めます。",
   silH: "読まない語尾", silP: "語末の e と、ほとんどの語末の子音は読みません。c、r、f、l はたいてい読みます。", silE: "e がつくと、前の子音が読まれます", liaH: "リエゾンとエリジオン", liaP: "読まない語末の文字は、母音の前でまた読まれます。小さな語は母音の前で自分の母音を落とします。", liaNo: "リエゾンしない：この h が止めます",
   mixH: "まちがえやすい語", mixP: "▶︎ をタップして、聞こえた方を選んでください。", play: "▶︎ 聞く", which: "どっち？", right: "✓ そう —", wasIt: "正解は"},
 ar: {listen: "🔊 استمع", say: "🎙️ قلها", tapHold: "اضغط مرة، أو اضغط مطولًا وأنت تتكلم.", noMic: "لا يوجد ميكروفون هنا — جرّبها على هاتفك.", listening: "أستمع… سيتوقف وحده", notHeard: "لم أسمع جيدًا — اضغط وحاول مرة أخرى.", heard: "✓ سمعت:", got: "سمعت", again: "— حاول مرة أخرى.", yours: "▶︎ صوتك", model: "النطق الأصلي أولًا، ثم أنت.",
   noIpa: "لا توجد ملاحظات نطق لهذه الكلمة بعد — يمكنك الاستماع إليها.", noVoice: "هذا الجهاز ليس فيه صوت فرنسي. في الهاتف: الإعدادات ← أضف صوتًا فرنسيًا.", grey: "الحروف الرمادية لا تُنطق.", lk: "الحرف الأخضر يُنطق هنا لأن الكلمة التالية تبدأ بحرف علة.", from: "من", also: "قد تكون أيضًا", forms: "أشكال أخرى ▾", less: "إخفاء ▴", colon: ": ",
   m: "مذكر", f: "مؤنث", mf: "مذكر أو مؤنث", pl: "جمع", fpl: "جمع مؤنث", alt: "قبل حرف علة", fixed: "عبارة ثابتة", link: "وصل", linkS: (l, c) => `هنا يُنطق ${l} مثل <bdi>/${c}/</bdi>`, elide: (a, b) => `${a} = ${b}: يسقط حرف العلة قبل حرف علة`, tLink: "حرف t هنا لتسهيل النطق فقط", asp: "حرف h هذا لا يُنطق، لكن لا وصل ولا حذف قبله (le وليس l').",
   numC: (w, i) => `قبل كلمة تبدأ بحرف ساكن تُنطق ${w} هكذا <bdi>/${i}/</bdi>.`,
   t_pr: "الآن", t_imp: "كان يفعل عادةً", t_fut: "سوف", t_cond: "لو… لـ…", t_pp: "تمّ", t_ppr: "وهو يفعل", t_sub: "بعد que", t_inf: "شكل القاموس", present: "حسب من يفعل", ppL: "فعلتُها (j'ai …)", ppLe: "فعلتُها (je suis …)",
   gram: "أسماء القواعد", g_pr: "المضارع", g_imp: "الماضي الناقص", g_fut: "المستقبل", g_cond: "الشرطي", g_pp: "اسم المفعول", g_ppr: "اسم الفاعل", g_sub: "صيغة الالتزام", g_inf: "المصدر",
   p_n: "شيء أو شخص", p_adj: "صفة", p_v: "فعل", p_adv: "كيف / متى", p_x: "كلمة صغيرة",
   sounds: "أصوات الفرنسية", lookH: "ابحث عن أي كلمة", lookP: "اكتب كلمة أو بضع كلمات مثل la table أو j'ai.", go: "ابحث", nasH: "أربعة أصوات أنفية", nasP: "يخرج الهواء من الأنف، ولا يُسمع “n” بعدها. اضغط لتسمع.", nasUn: "كثير من الناس في فرنسا اليوم ينطقون “un” مثل “in”.",
   rH: "حرف r الفرنسي", rP: "يخرج من مؤخرة الفم، قريب من الغين. يبقى طرف اللسان خلف الأسنان السفلى.", uH: "u و ou", uP: "ou مثل “أو” الطويلة. u: قل “إي” وأبقِ لسانك مكانه ودوّر شفتيك.", eH: "é · è · e · eu", eP: "é مشدودة؛ è مفتوحة؛ e وحدها صوت قصير خفيف؛ eu هي é مع شفتين مدوّرتين.",
   silH: "نهايات صامتة", silP: "حرف e في آخر الكلمة ومعظم الحروف الساكنة الأخيرة لا تُنطق. أما c و r و f و l فتُنطق غالبًا.", silE: "أضف e فيُنطق الحرف الساكن", liaH: "الوصل والحذف", liaP: "الحرف الأخير الصامت يُنطق قبل حرف علة. الكلمات الصغيرة تحذف حرف علتها قبل حرف علة.", liaNo: "لا وصل: حرف h هذا يمنعه",
   mixH: "كلمات تختلط", mixP: "اضغط ▶︎ ثم اختر ما سمعته.", play: "▶︎ استمع", which: "أيّهما؟", right: "✓ نعم —", wasIt: "كانت"}
};
const T = k => { const v = TX[LG] && TX[LG][k]; return v != null ? v : TX.en[k]; };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// ---------- 词典 ----------
const DICT_SRC = `>le	lə	det	0
>la	la	det	0
>le(s)	le	det	0
>un	œ̃	det	0
un(e)	yn	f
>de(s)	de	det	0
>du	dy	det	0
>au	o	prep	0
au(x)	o	pl
>de	də	prep	0
>à	a	prep	0
>je	ʒə	pron	0
>tu	ty	pron	0
>il	il	pron	0
>ell(e)	ɛl	pron	0
>on	ɔ̃	pron	0
>nou(s)	nu	pron	0
>vou(s)	vu	pron	0
>il(s)	il	pron	0
>ell(es)	ɛl	pron	0
>me	mə	pron	0
>te	tə	pron	0
>se	sə	pron	0
>lui	lɥi	pron	0
>leur	lœʁ	pron	0
leur(s)	lœʁ	pl
>moi	mwa	pron	0
>toi	twa	pron	0
>soi	swa	pron	0
>eu(x)	ø	pron	0
>y	i	pron	0
>en	ɑ̃	prep	0
>ce	sə	det	0
cet	sɛt	alt
cett(e)	sɛt	f
ce(s)	se	pl
>ça	sa	pron	0
>cela	səla	pron	0
>ceci	səsi	pron	0
>celui	səlɥi	pron	0
cell(e)	sɛl	f
ceu(x)	sø	pl
cell(es)	sɛl	fpl
>qui	ki	pron	0
>que	kə	conj	0
>quoi	kwa	pron	0
>où	u	adv	0
>don(t)	dɔ̃	pron	0
>lequel	ləkɛl	pron	0
laquell(e)	lakɛl	f
lesquel(s)	lekɛl	pl
lesquell(es)	lekɛl	fpl
>chacun	ʃakœ̃	pron	0
chacun(e)	ʃakyn	f
>quelqu'un	kɛlkœ̃	pron	0
>quelqu(e)	kɛlk	det	0
quelqu(es)	kɛlk	pl
>quelque chose	kɛlkə ʃoz	x	0
>personn(e)	pɛʁsɔn	nf	0
>rien	ʁjɛ̃	pron	0
>tou(t)	tu	det	0
tout(e)	tut	f
tou(s)	tu	pl
tout(es)	tut	fpl
>mêm(e)	mɛm	adj	0
>autr(e)	otʁ	adj	0
>mon	mɔ̃	det	0
>ma	ma	det	0
>me(s)	me	det	0
>ton	tɔ̃	det	0
>ta	ta	det	0
>te(s)	te	det	0
>son	sɔ̃	det	0
>sa	sa	det	0
>se(s)	se	det	0
>notr(e)	nɔtʁ	det	0
no(s)	no	pl
>votr(e)	vɔtʁ	det	0
vo(s)	vo	pl
>quel	kɛl	det	0
quell(e)	kɛl	f
quel(s)	kɛl	pl
quell(es)	kɛl	fpl
>chaqu(e)	ʃak	det	0
>plusieur(s)	plyzjœʁ	det	0
>aucun	okœ̃	det	0
aucun(e)	okyn	f
>certain	sɛʁtɛ̃	adj	0
certain(e)	sɛʁtɛn	f
>tel	tɛl	adj	0
tell(e)	tɛl	f
>dan(s)	dɑ̃	prep	0
>sur	syʁ	prep	0
>sou(s)	su	prep	0
>avec	avɛk	prep	0
>san(s)	sɑ̃	prep	0
>pour	puʁ	prep	0
>par	paʁ	prep	0
>che(z)	ʃe	prep	0
>ver(s)	vɛʁ	prep	0
>entr(e)	ɑ̃tʁ	prep	0
>avan(t)	avɑ̃	prep	0
>aprè(s)	apʁɛ	prep	0
>pendan(t)	pɑ̃dɑ̃	prep	0
>depui(s)	dəpɥi	prep	0
>jusqu(e)	ʒysk	prep	0
>contr(e)	kɔ̃tʁ	prep	0
>devan(t)	dəvɑ̃	prep	0
>derrièr(e)	dɛʁjɛʁ	prep	0
>prè(s)	pʁɛ	adv	0
>loin	lwɛ̃	adv	0
>parmi	paʁmi	prep	0
>selon	səlɔ̃	prep	0
>malgré	malgʁe	prep	0
>dè(s)	dɛ	prep	0
>*(h)or(s)	ɔʁ	prep	0
>sauf	sof	prep	0
>autour	otuʁ	adv	0
>dedan(s)	dədɑ̃	adv	0
>de(h)or(s)	dəɔʁ	adv	0
>dessu(s)	dəsy	adv	0
>dessou(s)	dəsu	adv	0
>en face	ɑ̃ fas	x	0
>à côté	a kote	x	0
>e(t)	e	conj	0
>ou	u	conj	0
>mai(s)	mɛ	conj	0
>donc	dɔ̃k	conj	0
>car	kaʁ	conj	0
>ni	ni	conj	0
>si	si	conj	0
>quan(d)	kɑ̃	conj	0
>comm(e)	kɔm	conj	0
>parce que	paʁs kə	x	0
>puisqu(e)	pɥisk	conj	0
>lorsqu(e)	lɔʁsk	conj	0
>alor(s)	alɔʁ	adv	0
>pui(s)	pɥi	adv	0
>ensuit(e)	ɑ̃sɥit	adv	0
>pourtan(t)	puʁtɑ̃	adv	0
>cependan(t)	səpɑ̃dɑ̃	adv	0
>sinon	sinɔ̃	conj	0
>du coup	dy ku	x	0
>ne	nə	adv	0
>pa(s)	pa	adv	0
>plu(s)	ply	adv	0
>moin(s)	mwɛ̃	adv	0
>jamai(s)	ʒamɛ	adv	0
>trè(s)	tʁɛ	adv	0
>tro(p)	tʁo	adv	0
>bien	bjɛ̃	adv	0
>mal	mal	adv	0
>peu	pø	adv	0
>beaucou(p)	boku	adv	0
>asse(z)	ase	adv	0
>aussi	osi	adv	0
>encor(e)	ɑ̃kɔʁ	adv	0
>déjà	deʒa	adv	0
>toujour(s)	tuʒuʁ	adv	0
>souven(t)	suvɑ̃	adv	0
>parfoi(s)	paʁfwa	adv	0
>ici	isi	adv	0
>là	la	adv	0
>là-ba(s)	laba	adv	0
>maintenan(t)	mɛ̃tnɑ̃	adv	0
>aujourd'(h)ui	oʒuʁdɥi	adv	0
>(h)ier	jɛʁ	adv	0
>demain	dəmɛ̃	adv	0
>tô(t)	to	adv	0
>tar(d)	taʁ	adv	0
>vit(e)	vit	adv	0
>ensembl(e)	ɑ̃sɑ̃bl	adv	0
>seulemen(t)	sœlmɑ̃	adv	0
>vraimen(t)	vʁɛmɑ̃	adv	0
>peut-êtr(e)	pøtɛtʁ	adv	0
>presqu(e)	pʁɛsk	adv	0
>surtou(t)	syʁtu	adv	0
>plutô(t)	plyto	adv	0
>enfin	ɑ̃fɛ̃	adv	0
>oui	wi	int	0
>non	nɔ̃	int	0
>commen(t)	kɔmɑ̃	adv	0
>combien	kɔ̃bjɛ̃	adv	0
>pourquoi	puʁkwa	adv	0
>ailleur(s)	ajœʁ	adv	0
>partou(t)	paʁtu	adv	0
>longtem(ps)	lɔ̃tɑ̃	adv	0
>bientô(t)	bjɛ̃to	adv	0
>d'abor(d)	dabɔʁ	adv	0
>d'accor(d)	dakɔʁ	x	0
>d'(h)abitud(e)	dabityd	x	0
>tout de suite	tu də sɥit	x	0
>tout à fait	tu ta fɛ	x	0
>tout le monde	tu lə mɔ̃d	x	0
>à peu près	a pø pʁɛ	x	0
>en général	ɑ̃ ʒeneʁal	x	0
>environ	ɑ̃viʁɔ̃	adv	0
>just(e)	ʒyst	adv	0
>debou(t)	dəbu	adv	0
>facilemen(t)	fasilmɑ̃	adv	0
>franchemen(t)	fʁɑ̃ʃmɑ̃	adv	0
>évidemmen(t)	evidamɑ̃	adv	0
>(h)eureusemen(t)	øʁøzmɑ̃	adv	0
>mal(h)eureusemen(t)	maløʁøzmɑ̃	adv	0
>simplemen(t)	sɛ̃pləmɑ̃	adv	0
>exactemen(t)	ɛgzaktəmɑ̃	adv	0
>complètemen(t)	kɔ̃plɛtmɑ̃	adv	0
>rapidemen(t)	ʁapidmɑ̃	adv	0
>lentemen(t)	lɑ̃tmɑ̃	adv	0
>doucemen(t)	dusmɑ̃	adv	0
>tellemen(t)	tɛlmɑ̃	adv	0
>autan(t)	otɑ̃	adv	0
>quelquefoi(s)	kɛlkəfwa	adv	0
>soudain	sudɛ̃	adv	0
>ainsi	ɛ̃si	adv	0
>voici	vwasi	prep	0
>voilà	vwala	prep	0
>merci	mɛʁsi	int	0
>bonjour	bɔ̃ʒuʁ	int	0
>bonsoir	bɔ̃swaʁ	int	0
>salu(t)	saly	int	0
>au revoir	o ʁəvwaʁ	x	0
>pardon	paʁdɔ̃	int	0
>s'il vous plaît	sil vu plɛ	x	0
>s'il te plaît	sil tə plɛ	x	0
>est-ce que	ɛs kə	x	0
>qu'est-ce que	kɛs kə	x	0
>qu'est-c(e)	kɛs	x	0
>est-c(e)	ɛs	x	0
>n'est-ce pas	nɛs pa	x	0
>il y a	il ja	x	0
>y a-t-il	i a til	x	0
>c'e(st)	sɛ	x	0
>c'est-à-dir(e)	sɛ ta diʁ	x	0
>êtr(e)	ɛtʁ	v	0
sui(s)	sɥi	pr:je
e(s)	ɛ	pr:tu
e(st)	ɛ	pr:il
somm(es)	sɔm	pr:nous
êt(es)	ɛt	pr:vous
son(t)	sɔ̃	pr:ils
étai(s)	etɛ	imp:je/tu
étai(t)	etɛ	imp:il
étion(s)	etjɔ̃	imp:nous
étie(z)	etje	imp:vous
étai(ent)	etɛ	imp:ils
étan(t)	etɑ̃	ppr
été	ete	pp
été(e)	ete	pp:f
serai	səʁe	fut:je
sera(s)	səʁa	fut:tu
sera	səʁa	fut:il
seron(s)	səʁɔ̃	fut:nous
sere(z)	səʁe	fut:vous
seron(t)	səʁɔ̃	fut:ils
serai(s)	səʁɛ	cond:je/tu
serai(t)	səʁɛ	cond:il
serion(s)	səʁjɔ̃	cond:nous
serie(z)	səʁje	cond:vous
serai(ent)	səʁɛ	cond:ils
soi(s)	swa	sub
soi(t)	swa	sub
soyon(s)	swajɔ̃	sub
soye(z)	swaje	sub
soi(ent)	swa	sub
>avoir	avwaʁ	v	0
ai	e	pr:je
a(s)	a	pr:tu
a	a	pr:il
avon(s)	avɔ̃	pr:nous
ave(z)	ave	pr:vous
on(t)	ɔ̃	pr:ils
avai(s)	avɛ	imp:je/tu
avai(t)	avɛ	imp:il
avion(s)	avjɔ̃	imp:nous
avie(z)	avje	imp:vous
avai(ent)	avɛ	imp:ils
ayan(t)	ɛjɑ̃	ppr
(e)u	y	pp
(e)u(e)	y	pp:f
aurai	oʁe	fut:je
aura(s)	oʁa	fut:tu
aura	oʁa	fut:il
auron(s)	oʁɔ̃	fut:nous
aure(z)	oʁe	fut:vous
auron(t)	oʁɔ̃	fut:ils
aurai(s)	oʁɛ	cond:je/tu
aurai(t)	oʁɛ	cond:il
aurion(s)	oʁjɔ̃	cond:nous
aurie(z)	oʁje	cond:vous
aurai(ent)	oʁɛ	cond:ils
aie	ɛ	sub
aie(s)	ɛ	sub
ai(t)	ɛ	sub
ayon(s)	ɛjɔ̃	sub
aye(z)	ɛje	sub
ai(ent)	ɛ	sub
>alle(r)	ale	v	0
vai(s)	vɛ	pr:je
va(s)	va	pr:tu
va	va	pr:il
allon(s)	alɔ̃	pr:nous
alle(z)	ale	pr:vous
von(t)	vɔ̃	pr:ils
allai(s)	alɛ	imp:je/tu
allai(t)	alɛ	imp:il
allion(s)	aljɔ̃	imp:nous
allie(z)	alje	imp:vous
allai(ent)	alɛ	imp:ils
allan(t)	alɑ̃	ppr
allé	ale	pp
allé(e)	ale	pp:f
irai	iʁe	fut:je
ira(s)	iʁa	fut:tu
ira	iʁa	fut:il
iron(s)	iʁɔ̃	fut:nous
ire(z)	iʁe	fut:vous
iron(t)	iʁɔ̃	fut:ils
irai(s)	iʁɛ	cond:je/tu
irai(t)	iʁɛ	cond:il
irion(s)	iʁjɔ̃	cond:nous
irie(z)	iʁje	cond:vous
irai(ent)	iʁɛ	cond:ils
aill(e)	aj	sub
aill(es)	aj	sub
aill(ent)	aj	sub
>fair(e)	fɛʁ	v	0
fai(s)	fɛ	pr:je/tu
fai(t)	fɛ	pr:il,pp
faison(s)	fəzɔ̃	pr:nous
fait(es)	fɛt	pr:vous
fon(t)	fɔ̃	pr:ils
faisai(s)	fəzɛ	imp:je/tu
faisai(t)	fəzɛ	imp:il
faision(s)	fəzjɔ̃	imp:nous
faisie(z)	fəzje	imp:vous
faisai(ent)	fəzɛ	imp:ils
faisan(t)	fəzɑ̃	ppr
fait(e)	fɛt	pp:f
ferai	fəʁe	fut:je
fera(s)	fəʁa	fut:tu
fera	fəʁa	fut:il
feron(s)	fəʁɔ̃	fut:nous
fere(z)	fəʁe	fut:vous
feron(t)	fəʁɔ̃	fut:ils
ferai(s)	fəʁɛ	cond:je/tu
ferai(t)	fəʁɛ	cond:il
ferion(s)	fəʁjɔ̃	cond:nous
ferie(z)	fəʁje	cond:vous
ferai(ent)	fəʁɛ	cond:ils
fass(e)	fas	sub
fass(es)	fas	sub
fass(ent)	fas	sub
>pouvoir	puvwaʁ	v	0
peu(x)	pø	pr:je/tu
peu(t)	pø	pr:il
pouvon(s)	puvɔ̃	pr:nous
pouve(z)	puve	pr:vous
peuv(ent)	pœv	pr:ils
pouvai(s)	puvɛ	imp:je/tu
pouvai(t)	puvɛ	imp:il
pouvion(s)	puvjɔ̃	imp:nous
pouvie(z)	puvje	imp:vous
pouvai(ent)	puvɛ	imp:ils
pouvan(t)	puvɑ̃	ppr
pu	py	pp
pu(e)	py	pp:f
pourrai	puʁe	fut:je
pourra(s)	puʁa	fut:tu
pourra	puʁa	fut:il
pourron(s)	puʁɔ̃	fut:nous
pourre(z)	puʁe	fut:vous
pourron(t)	puʁɔ̃	fut:ils
pourrai(s)	puʁɛ	cond:je/tu
pourrai(t)	puʁɛ	cond:il
pourrion(s)	puʁjɔ̃	cond:nous
pourrie(z)	puʁje	cond:vous
pourrai(ent)	puʁɛ	cond:ils
puiss(e)	pɥis	sub
puiss(es)	pɥis	sub
puiss(ent)	pɥis	sub
>vouloir	vulwaʁ	v	0
veu(x)	vø	pr:je/tu
veu(t)	vø	pr:il
voulon(s)	vulɔ̃	pr:nous
voule(z)	vule	pr:vous
veul(ent)	vœl	pr:ils
voulai(s)	vulɛ	imp:je/tu
voulai(t)	vulɛ	imp:il
voulion(s)	vuljɔ̃	imp:nous
voulie(z)	vulje	imp:vous
voulai(ent)	vulɛ	imp:ils
voulan(t)	vulɑ̃	ppr
voulu	vuly	pp
voulu(e)	vuly	pp:f
voudrai	vudʁe	fut:je
voudra(s)	vudʁa	fut:tu
voudra	vudʁa	fut:il
voudron(s)	vudʁɔ̃	fut:nous
voudre(z)	vudʁe	fut:vous
voudron(t)	vudʁɔ̃	fut:ils
voudrai(s)	vudʁɛ	cond:je/tu
voudrai(t)	vudʁɛ	cond:il
voudrion(s)	vudʁijɔ̃	cond:nous
voudrie(z)	vudʁije	cond:vous
voudrai(ent)	vudʁɛ	cond:ils
veuill(e)	vœj	sub
>devoir	dəvwaʁ	v	0
doi(s)	dwa	pr:je/tu
doi(t)	dwa	pr:il
devon(s)	dəvɔ̃	pr:nous
deve(z)	dəve	pr:vous
doiv(ent)	dwav	pr:ils
devai(s)	dəvɛ	imp:je/tu
devai(t)	dəvɛ	imp:il
devion(s)	dəvjɔ̃	imp:nous
devie(z)	dəvje	imp:vous
devai(ent)	dəvɛ	imp:ils
devan(t)	dəvɑ̃	ppr
dû	dy	pp
du(e)	dy	pp:f
devrai	dəvʁe	fut:je
devra(s)	dəvʁa	fut:tu
devra	dəvʁa	fut:il
devron(s)	dəvʁɔ̃	fut:nous
devre(z)	dəvʁe	fut:vous
devron(t)	dəvʁɔ̃	fut:ils
devrai(s)	dəvʁɛ	cond:je/tu
devrai(t)	dəvʁɛ	cond:il
devrion(s)	dəvʁijɔ̃	cond:nous
devrie(z)	dəvʁije	cond:vous
devrai(ent)	dəvʁɛ	cond:ils
>savoir	savwaʁ	v	0
sai(s)	sɛ	pr:je/tu
sai(t)	sɛ	pr:il
savon(s)	savɔ̃	pr:nous
save(z)	save	pr:vous
sav(ent)	sav	pr:ils
savai(s)	savɛ	imp:je/tu
savai(t)	savɛ	imp:il
savion(s)	savjɔ̃	imp:nous
savie(z)	savje	imp:vous
savai(ent)	savɛ	imp:ils
sachan(t)	saʃɑ̃	ppr
su	sy	pp
su(e)	sy	pp:f
saurai	soʁe	fut:je
saura(s)	soʁa	fut:tu
saura	soʁa	fut:il
sauron(s)	soʁɔ̃	fut:nous
saure(z)	soʁe	fut:vous
sauron(t)	soʁɔ̃	fut:ils
saurai(s)	soʁɛ	cond:je/tu
saurai(t)	soʁɛ	cond:il
saurion(s)	soʁjɔ̃	cond:nous
saurie(z)	soʁje	cond:vous
saurai(ent)	soʁɛ	cond:ils
sach(e)	saʃ	sub
sach(es)	saʃ	sub
sach(ent)	saʃ	sub
>voir	vwaʁ	v	1
voi(s)	vwa	pr:je/tu
voi(t)	vwa	pr:il
voyon(s)	vwajɔ̃	pr:nous
voye(z)	vwaje	pr:vous
voi(ent)	vwa	pr:ils
voyai(s)	vwajɛ	imp:je/tu
voyai(t)	vwajɛ	imp:il
voyion(s)	vwajjɔ̃	imp:nous
voyie(z)	vwajje	imp:vous
voyai(ent)	vwajɛ	imp:ils
voyan(t)	vwajɑ̃	ppr
vu	vy	pp
vu(e)	vy	pp:f
verrai	vɛʁe	fut:je
verra(s)	vɛʁa	fut:tu
verra	vɛʁa	fut:il
verron(s)	vɛʁɔ̃	fut:nous
verre(z)	vɛʁe	fut:vous
verron(t)	vɛʁɔ̃	fut:ils
verrai(s)	vɛʁɛ	cond:je/tu
verrai(t)	vɛʁɛ	cond:il
verrion(s)	vɛʁjɔ̃	cond:nous
verrie(z)	vɛʁje	cond:vous
verrai(ent)	vɛʁɛ	cond:ils
>venir	vəniʁ	v	1
vien(s)	vjɛ̃	pr:je/tu
vien(t)	vjɛ̃	pr:il
venon(s)	vənɔ̃	pr:nous
vene(z)	vəne	pr:vous
vienn(ent)	vjɛn	pr:ils
venai(s)	vənɛ	imp:je/tu
venai(t)	vənɛ	imp:il
venion(s)	vənjɔ̃	imp:nous
venie(z)	vənje	imp:vous
venai(ent)	vənɛ	imp:ils
venan(t)	vənɑ̃	ppr
venu	vəny	pp
venu(e)	vəny	pp:f
viendrai	vjɛ̃dʁe	fut:je
viendra(s)	vjɛ̃dʁa	fut:tu
viendra	vjɛ̃dʁa	fut:il
viendron(s)	vjɛ̃dʁɔ̃	fut:nous
viendre(z)	vjɛ̃dʁe	fut:vous
viendron(t)	vjɛ̃dʁɔ̃	fut:ils
viendrai(s)	vjɛ̃dʁɛ	cond:je/tu
viendrai(t)	vjɛ̃dʁɛ	cond:il
viendrion(s)	vjɛ̃dʁijɔ̃	cond:nous
viendrie(z)	vjɛ̃dʁije	cond:vous
viendrai(ent)	vjɛ̃dʁɛ	cond:ils
vienn(e)	vjɛn	sub
vienn(es)	vjɛn	sub
>devenir	dəvəniʁ	v	1
devien(s)	dəvjɛ̃	pr:je/tu
devien(t)	dəvjɛ̃	pr:il
devenon(s)	dəvənɔ̃	pr:nous
devene(z)	dəvəne	pr:vous
devienn(ent)	dəvjɛn	pr:ils
devenai(s)	dəvənɛ	imp:je/tu
devenai(t)	dəvənɛ	imp:il
devenion(s)	dəvənjɔ̃	imp:nous
devenie(z)	dəvənje	imp:vous
devenai(ent)	dəvənɛ	imp:ils
devenan(t)	dəvənɑ̃	ppr
devenu	dəvəny	pp
devenu(e)	dəvəny	pp:f
deviendrai	dəvjɛ̃dʁe	fut:je
deviendra(s)	dəvjɛ̃dʁa	fut:tu
deviendra	dəvjɛ̃dʁa	fut:il
deviendron(s)	dəvjɛ̃dʁɔ̃	fut:nous
deviendre(z)	dəvjɛ̃dʁe	fut:vous
deviendron(t)	dəvjɛ̃dʁɔ̃	fut:ils
deviendrai(s)	dəvjɛ̃dʁɛ	cond:je/tu
deviendrai(t)	dəvjɛ̃dʁɛ	cond:il
deviendrion(s)	dəvjɛ̃dʁijɔ̃	cond:nous
deviendrie(z)	dəvjɛ̃dʁije	cond:vous
deviendrai(ent)	dəvjɛ̃dʁɛ	cond:ils
devienn(e)	dəvjɛn	sub
devienn(es)	dəvjɛn	sub
>revenir	ʁəvəniʁ	v	1
revien(s)	ʁəvjɛ̃	pr:je/tu
revien(t)	ʁəvjɛ̃	pr:il
revenon(s)	ʁəvənɔ̃	pr:nous
revene(z)	ʁəvəne	pr:vous
revienn(ent)	ʁəvjɛn	pr:ils
revenai(s)	ʁəvənɛ	imp:je/tu
revenai(t)	ʁəvənɛ	imp:il
revenion(s)	ʁəvənjɔ̃	imp:nous
revenie(z)	ʁəvənje	imp:vous
revenai(ent)	ʁəvənɛ	imp:ils
revenan(t)	ʁəvənɑ̃	ppr
revenu	ʁəvəny	pp
revenu(e)	ʁəvəny	pp:f
reviendrai	ʁəvjɛ̃dʁe	fut:je
reviendra(s)	ʁəvjɛ̃dʁa	fut:tu
reviendra	ʁəvjɛ̃dʁa	fut:il
reviendron(s)	ʁəvjɛ̃dʁɔ̃	fut:nous
reviendre(z)	ʁəvjɛ̃dʁe	fut:vous
reviendron(t)	ʁəvjɛ̃dʁɔ̃	fut:ils
reviendrai(s)	ʁəvjɛ̃dʁɛ	cond:je/tu
reviendrai(t)	ʁəvjɛ̃dʁɛ	cond:il
reviendrion(s)	ʁəvjɛ̃dʁijɔ̃	cond:nous
reviendrie(z)	ʁəvjɛ̃dʁije	cond:vous
reviendrai(ent)	ʁəvjɛ̃dʁɛ	cond:ils
revienn(e)	ʁəvjɛn	sub
revienn(es)	ʁəvjɛn	sub
>tenir	təniʁ	v	1
tien(s)	tjɛ̃	pr:je/tu
tien(t)	tjɛ̃	pr:il
tenon(s)	tənɔ̃	pr:nous
tene(z)	təne	pr:vous
tienn(ent)	tjɛn	pr:ils
tenai(s)	tənɛ	imp:je/tu
tenai(t)	tənɛ	imp:il
tenion(s)	tənjɔ̃	imp:nous
tenie(z)	tənje	imp:vous
tenai(ent)	tənɛ	imp:ils
tenan(t)	tənɑ̃	ppr
tenu	təny	pp
tenu(e)	təny	pp:f
tiendrai	tjɛ̃dʁe	fut:je
tiendra(s)	tjɛ̃dʁa	fut:tu
tiendra	tjɛ̃dʁa	fut:il
tiendron(s)	tjɛ̃dʁɔ̃	fut:nous
tiendre(z)	tjɛ̃dʁe	fut:vous
tiendron(t)	tjɛ̃dʁɔ̃	fut:ils
tiendrai(s)	tjɛ̃dʁɛ	cond:je/tu
tiendrai(t)	tjɛ̃dʁɛ	cond:il
tiendrion(s)	tjɛ̃dʁijɔ̃	cond:nous
tiendrie(z)	tjɛ̃dʁije	cond:vous
tiendrai(ent)	tjɛ̃dʁɛ	cond:ils
tienn(e)	tjɛn	sub
tienn(es)	tjɛn	sub
>obtenir	ɔptəniʁ	v	1
obtien(s)	ɔptjɛ̃	pr:je/tu
obtien(t)	ɔptjɛ̃	pr:il
obtenon(s)	ɔptənɔ̃	pr:nous
obtene(z)	ɔptəne	pr:vous
obtienn(ent)	ɔptjɛn	pr:ils
obtenai(s)	ɔptənɛ	imp:je/tu
obtenai(t)	ɔptənɛ	imp:il
obtenion(s)	ɔptənjɔ̃	imp:nous
obtenie(z)	ɔptənje	imp:vous
obtenai(ent)	ɔptənɛ	imp:ils
obtenan(t)	ɔptənɑ̃	ppr
obtenu	ɔptəny	pp
obtenu(e)	ɔptəny	pp:f
obtiendrai	ɔptjɛ̃dʁe	fut:je
obtiendra(s)	ɔptjɛ̃dʁa	fut:tu
obtiendra	ɔptjɛ̃dʁa	fut:il
obtiendron(s)	ɔptjɛ̃dʁɔ̃	fut:nous
obtiendre(z)	ɔptjɛ̃dʁe	fut:vous
obtiendron(t)	ɔptjɛ̃dʁɔ̃	fut:ils
obtiendrai(s)	ɔptjɛ̃dʁɛ	cond:je/tu
obtiendrai(t)	ɔptjɛ̃dʁɛ	cond:il
obtiendrion(s)	ɔptjɛ̃dʁijɔ̃	cond:nous
obtiendrie(z)	ɔptjɛ̃dʁije	cond:vous
obtiendrai(ent)	ɔptjɛ̃dʁɛ	cond:ils
obtienn(e)	ɔptjɛn	sub
obtienn(es)	ɔptjɛn	sub
>prendr(e)	pʁɑ̃dʁ	v	1
pren(ds)	pʁɑ̃	pr:je/tu
pren(d)	pʁɑ̃	pr:il
prenon(s)	pʁənɔ̃	pr:nous
prene(z)	pʁəne	pr:vous
prenn(ent)	pʁɛn	pr:ils
prenai(s)	pʁənɛ	imp:je/tu
prenai(t)	pʁənɛ	imp:il
prenion(s)	pʁənjɔ̃	imp:nous
prenie(z)	pʁənje	imp:vous
prenai(ent)	pʁənɛ	imp:ils
prenan(t)	pʁənɑ̃	ppr
pri(s)	pʁi	pp
pris(e)	pʁiz	pp:f
prendrai	pʁɑ̃dʁe	fut:je
prendra(s)	pʁɑ̃dʁa	fut:tu
prendra	pʁɑ̃dʁa	fut:il
prendron(s)	pʁɑ̃dʁɔ̃	fut:nous
prendre(z)	pʁɑ̃dʁe	fut:vous
prendron(t)	pʁɑ̃dʁɔ̃	fut:ils
prendrai(s)	pʁɑ̃dʁɛ	cond:je/tu
prendrai(t)	pʁɑ̃dʁɛ	cond:il
prendrion(s)	pʁɑ̃dʁijɔ̃	cond:nous
prendrie(z)	pʁɑ̃dʁije	cond:vous
prendrai(ent)	pʁɑ̃dʁɛ	cond:ils
prenn(e)	pʁɛn	sub
prenn(es)	pʁɛn	sub
>apprendr(e)	apʁɑ̃dʁ	v	1
appren(ds)	apʁɑ̃	pr:je/tu
appren(d)	apʁɑ̃	pr:il
apprenon(s)	apʁənɔ̃	pr:nous
apprene(z)	apʁəne	pr:vous
apprenn(ent)	apʁɛn	pr:ils
apprenai(s)	apʁənɛ	imp:je/tu
apprenai(t)	apʁənɛ	imp:il
apprenion(s)	apʁənjɔ̃	imp:nous
apprenie(z)	apʁənje	imp:vous
apprenai(ent)	apʁənɛ	imp:ils
apprenan(t)	apʁənɑ̃	ppr
appri(s)	apʁi	pp
appris(e)	apʁiz	pp:f
apprendrai	apʁɑ̃dʁe	fut:je
apprendra(s)	apʁɑ̃dʁa	fut:tu
apprendra	apʁɑ̃dʁa	fut:il
apprendron(s)	apʁɑ̃dʁɔ̃	fut:nous
apprendre(z)	apʁɑ̃dʁe	fut:vous
apprendron(t)	apʁɑ̃dʁɔ̃	fut:ils
apprendrai(s)	apʁɑ̃dʁɛ	cond:je/tu
apprendrai(t)	apʁɑ̃dʁɛ	cond:il
apprendrion(s)	apʁɑ̃dʁijɔ̃	cond:nous
apprendrie(z)	apʁɑ̃dʁije	cond:vous
apprendrai(ent)	apʁɑ̃dʁɛ	cond:ils
apprenn(e)	apʁɛn	sub
apprenn(es)	apʁɛn	sub
>comprendr(e)	kɔ̃pʁɑ̃dʁ	v	1
compren(ds)	kɔ̃pʁɑ̃	pr:je/tu
compren(d)	kɔ̃pʁɑ̃	pr:il
comprenon(s)	kɔ̃pʁənɔ̃	pr:nous
comprene(z)	kɔ̃pʁəne	pr:vous
comprenn(ent)	kɔ̃pʁɛn	pr:ils
comprenai(s)	kɔ̃pʁənɛ	imp:je/tu
comprenai(t)	kɔ̃pʁənɛ	imp:il
comprenion(s)	kɔ̃pʁənjɔ̃	imp:nous
comprenie(z)	kɔ̃pʁənje	imp:vous
comprenai(ent)	kɔ̃pʁənɛ	imp:ils
comprenan(t)	kɔ̃pʁənɑ̃	ppr
compri(s)	kɔ̃pʁi	pp
compris(e)	kɔ̃pʁiz	pp:f
comprendrai	kɔ̃pʁɑ̃dʁe	fut:je
comprendra(s)	kɔ̃pʁɑ̃dʁa	fut:tu
comprendra	kɔ̃pʁɑ̃dʁa	fut:il
comprendron(s)	kɔ̃pʁɑ̃dʁɔ̃	fut:nous
comprendre(z)	kɔ̃pʁɑ̃dʁe	fut:vous
comprendron(t)	kɔ̃pʁɑ̃dʁɔ̃	fut:ils
comprendrai(s)	kɔ̃pʁɑ̃dʁɛ	cond:je/tu
comprendrai(t)	kɔ̃pʁɑ̃dʁɛ	cond:il
comprendrion(s)	kɔ̃pʁɑ̃dʁijɔ̃	cond:nous
comprendrie(z)	kɔ̃pʁɑ̃dʁije	cond:vous
comprendrai(ent)	kɔ̃pʁɑ̃dʁɛ	cond:ils
comprenn(e)	kɔ̃pʁɛn	sub
comprenn(es)	kɔ̃pʁɛn	sub
>mettr(e)	mɛtʁ	v	1
me(ts)	mɛ	pr:je/tu
me(t)	mɛ	pr:il
metton(s)	mɛtɔ̃	pr:nous
mette(z)	mɛte	pr:vous
mett(ent)	mɛt	pr:ils
mettai(s)	mɛtɛ	imp:je/tu
mettai(t)	mɛtɛ	imp:il
mettion(s)	mɛtjɔ̃	imp:nous
mettie(z)	mɛtje	imp:vous
mettai(ent)	mɛtɛ	imp:ils
mettan(t)	mɛtɑ̃	ppr
mi(s)	mi	pp
mis(e)	miz	pp:f
mettrai	mɛtʁe	fut:je
mettra(s)	mɛtʁa	fut:tu
mettra	mɛtʁa	fut:il
mettron(s)	mɛtʁɔ̃	fut:nous
mettre(z)	mɛtʁe	fut:vous
mettron(t)	mɛtʁɔ̃	fut:ils
mettrai(s)	mɛtʁɛ	cond:je/tu
mettrai(t)	mɛtʁɛ	cond:il
mettrion(s)	mɛtʁijɔ̃	cond:nous
mettrie(z)	mɛtʁije	cond:vous
mettrai(ent)	mɛtʁɛ	cond:ils
mett(e)	mɛt	sub
>permettr(e)	pɛʁmɛtʁ	v	1
perme(ts)	pɛʁmɛ	pr:je/tu
perme(t)	pɛʁmɛ	pr:il
permetton(s)	pɛʁmɛtɔ̃	pr:nous
permette(z)	pɛʁmɛte	pr:vous
permett(ent)	pɛʁmɛt	pr:ils
permettai(s)	pɛʁmɛtɛ	imp:je/tu
permettai(t)	pɛʁmɛtɛ	imp:il
permettion(s)	pɛʁmɛtjɔ̃	imp:nous
permettie(z)	pɛʁmɛtje	imp:vous
permettai(ent)	pɛʁmɛtɛ	imp:ils
permettan(t)	pɛʁmɛtɑ̃	ppr
permi(s)	pɛʁmi	pp
permis(e)	pɛʁmiz	pp:f
permettrai	pɛʁmɛtʁe	fut:je
permettra(s)	pɛʁmɛtʁa	fut:tu
permettra	pɛʁmɛtʁa	fut:il
permettron(s)	pɛʁmɛtʁɔ̃	fut:nous
permettre(z)	pɛʁmɛtʁe	fut:vous
permettron(t)	pɛʁmɛtʁɔ̃	fut:ils
permettrai(s)	pɛʁmɛtʁɛ	cond:je/tu
permettrai(t)	pɛʁmɛtʁɛ	cond:il
permettrion(s)	pɛʁmɛtʁijɔ̃	cond:nous
permettrie(z)	pɛʁmɛtʁije	cond:vous
permettrai(ent)	pɛʁmɛtʁɛ	cond:ils
permett(e)	pɛʁmɛt	sub
>promettr(e)	pʁɔmɛtʁ	v	1
prome(ts)	pʁɔmɛ	pr:je/tu
prome(t)	pʁɔmɛ	pr:il
prometton(s)	pʁɔmɛtɔ̃	pr:nous
promette(z)	pʁɔmɛte	pr:vous
promett(ent)	pʁɔmɛt	pr:ils
promettai(s)	pʁɔmɛtɛ	imp:je/tu
promettai(t)	pʁɔmɛtɛ	imp:il
promettion(s)	pʁɔmɛtjɔ̃	imp:nous
promettie(z)	pʁɔmɛtje	imp:vous
promettai(ent)	pʁɔmɛtɛ	imp:ils
promettan(t)	pʁɔmɛtɑ̃	ppr
promi(s)	pʁɔmi	pp
promis(e)	pʁɔmiz	pp:f
promettrai	pʁɔmɛtʁe	fut:je
promettra(s)	pʁɔmɛtʁa	fut:tu
promettra	pʁɔmɛtʁa	fut:il
promettron(s)	pʁɔmɛtʁɔ̃	fut:nous
promettre(z)	pʁɔmɛtʁe	fut:vous
promettron(t)	pʁɔmɛtʁɔ̃	fut:ils
promettrai(s)	pʁɔmɛtʁɛ	cond:je/tu
promettrai(t)	pʁɔmɛtʁɛ	cond:il
promettrion(s)	pʁɔmɛtʁijɔ̃	cond:nous
promettrie(z)	pʁɔmɛtʁije	cond:vous
promettrai(ent)	pʁɔmɛtʁɛ	cond:ils
promett(e)	pʁɔmɛt	sub
>dir(e)	diʁ	v	1
di(s)	di	pr:je/tu
di(t)	di	pr:il,pp
dison(s)	dizɔ̃	pr:nous
dit(es)	dit	pr:vous
dis(ent)	diz	pr:ils
disai(s)	dizɛ	imp:je/tu
disai(t)	dizɛ	imp:il
dision(s)	dizjɔ̃	imp:nous
disie(z)	dizje	imp:vous
disai(ent)	dizɛ	imp:ils
disan(t)	dizɑ̃	ppr
dit(e)	dit	pp:f
dirai	diʁe	fut:je
dira(s)	diʁa	fut:tu
dira	diʁa	fut:il
diron(s)	diʁɔ̃	fut:nous
dire(z)	diʁe	fut:vous
diron(t)	diʁɔ̃	fut:ils
dirai(s)	diʁɛ	cond:je/tu
dirai(t)	diʁɛ	cond:il
dirion(s)	diʁjɔ̃	cond:nous
dirie(z)	diʁje	cond:vous
dirai(ent)	diʁɛ	cond:ils
dis(e)	diz	sub
>lir(e)	liʁ	v	1
li(s)	li	pr:je/tu
li(t)	li	pr:il
lison(s)	lizɔ̃	pr:nous
lise(z)	lize	pr:vous
lis(ent)	liz	pr:ils
lisai(s)	lizɛ	imp:je/tu
lisai(t)	lizɛ	imp:il
lision(s)	lizjɔ̃	imp:nous
lisie(z)	lizje	imp:vous
lisai(ent)	lizɛ	imp:ils
lisan(t)	lizɑ̃	ppr
lu	ly	pp
lu(e)	ly	pp:f
lirai	liʁe	fut:je
lira(s)	liʁa	fut:tu
lira	liʁa	fut:il
liron(s)	liʁɔ̃	fut:nous
lire(z)	liʁe	fut:vous
liron(t)	liʁɔ̃	fut:ils
lirai(s)	liʁɛ	cond:je/tu
lirai(t)	liʁɛ	cond:il
lirion(s)	liʁjɔ̃	cond:nous
lirie(z)	liʁje	cond:vous
lirai(ent)	liʁɛ	cond:ils
>écrir(e)	ekʁiʁ	v	1
écri(s)	ekʁi	pr:je/tu
écri(t)	ekʁi	pr:il,pp
écrivon(s)	ekʁivɔ̃	pr:nous
écrive(z)	ekʁive	pr:vous
écriv(ent)	ekʁiv	pr:ils
écrivai(s)	ekʁivɛ	imp:je/tu
écrivai(t)	ekʁivɛ	imp:il
écrivion(s)	ekʁivjɔ̃	imp:nous
écrivie(z)	ekʁivje	imp:vous
écrivai(ent)	ekʁivɛ	imp:ils
écrivan(t)	ekʁivɑ̃	ppr
écrit(e)	ekʁit	pp:f
écrirai	ekʁiʁe	fut:je
écrira(s)	ekʁiʁa	fut:tu
écrira	ekʁiʁa	fut:il
écriron(s)	ekʁiʁɔ̃	fut:nous
écrire(z)	ekʁiʁe	fut:vous
écriron(t)	ekʁiʁɔ̃	fut:ils
écrirai(s)	ekʁiʁɛ	cond:je/tu
écrirai(t)	ekʁiʁɛ	cond:il
écririon(s)	ekʁiʁjɔ̃	cond:nous
écririe(z)	ekʁiʁje	cond:vous
écrirai(ent)	ekʁiʁɛ	cond:ils
>boir(e)	bwaʁ	v	1
boi(s)	bwa	pr:je/tu
boi(t)	bwa	pr:il
buvon(s)	byvɔ̃	pr:nous
buve(z)	byve	pr:vous
boiv(ent)	bwav	pr:ils
buvai(s)	byvɛ	imp:je/tu
buvai(t)	byvɛ	imp:il
buvion(s)	byvjɔ̃	imp:nous
buvie(z)	byvje	imp:vous
buvai(ent)	byvɛ	imp:ils
buvan(t)	byvɑ̃	ppr
bu	by	pp
bu(e)	by	pp:f
boirai	bwaʁe	fut:je
boira(s)	bwaʁa	fut:tu
boira	bwaʁa	fut:il
boiron(s)	bwaʁɔ̃	fut:nous
boire(z)	bwaʁe	fut:vous
boiron(t)	bwaʁɔ̃	fut:ils
boirai(s)	bwaʁɛ	cond:je/tu
boirai(t)	bwaʁɛ	cond:il
boirion(s)	bwaʁjɔ̃	cond:nous
boirie(z)	bwaʁje	cond:vous
boirai(ent)	bwaʁɛ	cond:ils
>croir(e)	kʁwaʁ	v	1
croi(s)	kʁwa	pr:je/tu
croi(t)	kʁwa	pr:il
croyon(s)	kʁwajɔ̃	pr:nous
croye(z)	kʁwaje	pr:vous
croi(ent)	kʁwa	pr:ils
croyai(s)	kʁwajɛ	imp:je/tu
croyai(t)	kʁwajɛ	imp:il
croyion(s)	kʁwajjɔ̃	imp:nous
croyie(z)	kʁwajje	imp:vous
croyai(ent)	kʁwajɛ	imp:ils
croyan(t)	kʁwajɑ̃	ppr
cru	kʁy	pp
cru(e)	kʁy	pp:f
croirai	kʁwaʁe	fut:je
croira(s)	kʁwaʁa	fut:tu
croira	kʁwaʁa	fut:il
croiron(s)	kʁwaʁɔ̃	fut:nous
croire(z)	kʁwaʁe	fut:vous
croiron(t)	kʁwaʁɔ̃	fut:ils
croirai(s)	kʁwaʁɛ	cond:je/tu
croirai(t)	kʁwaʁɛ	cond:il
croirion(s)	kʁwaʁjɔ̃	cond:nous
croirie(z)	kʁwaʁje	cond:vous
croirai(ent)	kʁwaʁɛ	cond:ils
>partir	paʁtiʁ	v	1
par(s)	paʁ	pr:je/tu
par(t)	paʁ	pr:il
parton(s)	paʁtɔ̃	pr:nous
parte(z)	paʁte	pr:vous
part(ent)	paʁt	pr:ils
partai(s)	paʁtɛ	imp:je/tu
partai(t)	paʁtɛ	imp:il
partion(s)	paʁtjɔ̃	imp:nous
partie(z)	paʁtje	imp:vous
partai(ent)	paʁtɛ	imp:ils
partan(t)	paʁtɑ̃	ppr
parti	paʁti	pp
parti(e)	paʁti	pp:f
partirai	paʁtiʁe	fut:je
partira(s)	paʁtiʁa	fut:tu
partira	paʁtiʁa	fut:il
partiron(s)	paʁtiʁɔ̃	fut:nous
partire(z)	paʁtiʁe	fut:vous
partiron(t)	paʁtiʁɔ̃	fut:ils
partirai(s)	paʁtiʁɛ	cond:je/tu
partirai(t)	paʁtiʁɛ	cond:il
partirion(s)	paʁtiʁjɔ̃	cond:nous
partirie(z)	paʁtiʁje	cond:vous
partirai(ent)	paʁtiʁɛ	cond:ils
>sortir	sɔʁtiʁ	v	1
sor(s)	sɔʁ	pr:je/tu
sor(t)	sɔʁ	pr:il
sorton(s)	sɔʁtɔ̃	pr:nous
sorte(z)	sɔʁte	pr:vous
sort(ent)	sɔʁt	pr:ils
sortai(s)	sɔʁtɛ	imp:je/tu
sortai(t)	sɔʁtɛ	imp:il
sortion(s)	sɔʁtjɔ̃	imp:nous
sortie(z)	sɔʁtje	imp:vous
sortai(ent)	sɔʁtɛ	imp:ils
sortan(t)	sɔʁtɑ̃	ppr
sorti	sɔʁti	pp
sorti(e)	sɔʁti	pp:f
sortirai	sɔʁtiʁe	fut:je
sortira(s)	sɔʁtiʁa	fut:tu
sortira	sɔʁtiʁa	fut:il
sortiron(s)	sɔʁtiʁɔ̃	fut:nous
sortire(z)	sɔʁtiʁe	fut:vous
sortiron(t)	sɔʁtiʁɔ̃	fut:ils
sortirai(s)	sɔʁtiʁɛ	cond:je/tu
sortirai(t)	sɔʁtiʁɛ	cond:il
sortirion(s)	sɔʁtiʁjɔ̃	cond:nous
sortirie(z)	sɔʁtiʁje	cond:vous
sortirai(ent)	sɔʁtiʁɛ	cond:ils
>dormir	dɔʁmiʁ	v	1
dor(s)	dɔʁ	pr:je/tu
dor(t)	dɔʁ	pr:il
dormon(s)	dɔʁmɔ̃	pr:nous
dorme(z)	dɔʁme	pr:vous
dorm(ent)	dɔʁm	pr:ils
dormai(s)	dɔʁmɛ	imp:je/tu
dormai(t)	dɔʁmɛ	imp:il
dormion(s)	dɔʁmjɔ̃	imp:nous
dormie(z)	dɔʁmje	imp:vous
dormai(ent)	dɔʁmɛ	imp:ils
dorman(t)	dɔʁmɑ̃	ppr
dormi	dɔʁmi	pp
dormi(e)	dɔʁmi	pp:f
dormirai	dɔʁmiʁe	fut:je
dormira(s)	dɔʁmiʁa	fut:tu
dormira	dɔʁmiʁa	fut:il
dormiron(s)	dɔʁmiʁɔ̃	fut:nous
dormire(z)	dɔʁmiʁe	fut:vous
dormiron(t)	dɔʁmiʁɔ̃	fut:ils
dormirai(s)	dɔʁmiʁɛ	cond:je/tu
dormirai(t)	dɔʁmiʁɛ	cond:il
dormirion(s)	dɔʁmiʁjɔ̃	cond:nous
dormirie(z)	dɔʁmiʁje	cond:vous
dormirai(ent)	dɔʁmiʁɛ	cond:ils
>endormir	ɑ̃dɔʁmiʁ	v	1
endor(s)	ɑ̃dɔʁ	pr:je/tu
endor(t)	ɑ̃dɔʁ	pr:il
endormon(s)	ɑ̃dɔʁmɔ̃	pr:nous
endorme(z)	ɑ̃dɔʁme	pr:vous
endorm(ent)	ɑ̃dɔʁm	pr:ils
endormai(s)	ɑ̃dɔʁmɛ	imp:je/tu
endormai(t)	ɑ̃dɔʁmɛ	imp:il
endormion(s)	ɑ̃dɔʁmjɔ̃	imp:nous
endormie(z)	ɑ̃dɔʁmje	imp:vous
endormai(ent)	ɑ̃dɔʁmɛ	imp:ils
endorman(t)	ɑ̃dɔʁmɑ̃	ppr
endormi	ɑ̃dɔʁmi	pp
endormi(e)	ɑ̃dɔʁmi	pp:f
endormirai	ɑ̃dɔʁmiʁe	fut:je
endormira(s)	ɑ̃dɔʁmiʁa	fut:tu
endormira	ɑ̃dɔʁmiʁa	fut:il
endormiron(s)	ɑ̃dɔʁmiʁɔ̃	fut:nous
endormire(z)	ɑ̃dɔʁmiʁe	fut:vous
endormiron(t)	ɑ̃dɔʁmiʁɔ̃	fut:ils
endormirai(s)	ɑ̃dɔʁmiʁɛ	cond:je/tu
endormirai(t)	ɑ̃dɔʁmiʁɛ	cond:il
endormirion(s)	ɑ̃dɔʁmiʁjɔ̃	cond:nous
endormirie(z)	ɑ̃dɔʁmiʁje	cond:vous
endormirai(ent)	ɑ̃dɔʁmiʁɛ	cond:ils
>sentir	sɑ̃tiʁ	v	1
sen(s)	sɑ̃	pr:je/tu
sen(t)	sɑ̃	pr:il
senton(s)	sɑ̃tɔ̃	pr:nous
sente(z)	sɑ̃te	pr:vous
sent(ent)	sɑ̃t	pr:ils
sentai(s)	sɑ̃tɛ	imp:je/tu
sentai(t)	sɑ̃tɛ	imp:il
sention(s)	sɑ̃tjɔ̃	imp:nous
sentie(z)	sɑ̃tje	imp:vous
sentai(ent)	sɑ̃tɛ	imp:ils
sentan(t)	sɑ̃tɑ̃	ppr
senti	sɑ̃ti	pp
senti(e)	sɑ̃ti	pp:f
sentirai	sɑ̃tiʁe	fut:je
sentira(s)	sɑ̃tiʁa	fut:tu
sentira	sɑ̃tiʁa	fut:il
sentiron(s)	sɑ̃tiʁɔ̃	fut:nous
sentire(z)	sɑ̃tiʁe	fut:vous
sentiron(t)	sɑ̃tiʁɔ̃	fut:ils
sentirai(s)	sɑ̃tiʁɛ	cond:je/tu
sentirai(t)	sɑ̃tiʁɛ	cond:il
sentirion(s)	sɑ̃tiʁjɔ̃	cond:nous
sentirie(z)	sɑ̃tiʁje	cond:vous
sentirai(ent)	sɑ̃tiʁɛ	cond:ils
>servir	sɛʁviʁ	v	1
ser(s)	sɛʁ	pr:je/tu
ser(t)	sɛʁ	pr:il
servon(s)	sɛʁvɔ̃	pr:nous
serve(z)	sɛʁve	pr:vous
serv(ent)	sɛʁv	pr:ils
servai(s)	sɛʁvɛ	imp:je/tu
servai(t)	sɛʁvɛ	imp:il
servion(s)	sɛʁvjɔ̃	imp:nous
servie(z)	sɛʁvje	imp:vous
servai(ent)	sɛʁvɛ	imp:ils
servan(t)	sɛʁvɑ̃	ppr
servi	sɛʁvi	pp
servi(e)	sɛʁvi	pp:f
servirai	sɛʁviʁe	fut:je
servira(s)	sɛʁviʁa	fut:tu
servira	sɛʁviʁa	fut:il
serviron(s)	sɛʁviʁɔ̃	fut:nous
servire(z)	sɛʁviʁe	fut:vous
serviron(t)	sɛʁviʁɔ̃	fut:ils
servirai(s)	sɛʁviʁɛ	cond:je/tu
servirai(t)	sɛʁviʁɛ	cond:il
servirion(s)	sɛʁviʁjɔ̃	cond:nous
servirie(z)	sɛʁviʁje	cond:vous
servirai(ent)	sɛʁviʁɛ	cond:ils
>ouvrir	uvʁiʁ	v	1
ouvr(e)	uvʁ	pr:je/il
ouvr(es)	uvʁ	pr:tu
ouvron(s)	uvʁɔ̃	pr:nous
ouvre(z)	uvʁe	pr:vous
ouvr(ent)	uvʁ	pr:ils
ouvrai(s)	uvʁɛ	imp:je/tu
ouvrai(t)	uvʁɛ	imp:il
ouvrion(s)	uvʁijɔ̃	imp:nous
ouvrie(z)	uvʁije	imp:vous
ouvrai(ent)	uvʁɛ	imp:ils
ouvran(t)	uvʁɑ̃	ppr
ouver(t)	uvɛʁ	pp
ouvert(e)	uvɛʁt	pp:f
ouvrirai	uvʁiʁe	fut:je
ouvrira(s)	uvʁiʁa	fut:tu
ouvrira	uvʁiʁa	fut:il
ouvriron(s)	uvʁiʁɔ̃	fut:nous
ouvrire(z)	uvʁiʁe	fut:vous
ouvriron(t)	uvʁiʁɔ̃	fut:ils
ouvrirai(s)	uvʁiʁɛ	cond:je/tu
ouvrirai(t)	uvʁiʁɛ	cond:il
ouvririon(s)	uvʁiʁjɔ̃	cond:nous
ouvririe(z)	uvʁiʁje	cond:vous
ouvrirai(ent)	uvʁiʁɛ	cond:ils
>offrir	ɔfʁiʁ	v	1
offr(e)	ɔfʁ	pr:je/il
offr(es)	ɔfʁ	pr:tu
offron(s)	ɔfʁɔ̃	pr:nous
offre(z)	ɔfʁe	pr:vous
offr(ent)	ɔfʁ	pr:ils
offrai(s)	ɔfʁɛ	imp:je/tu
offrai(t)	ɔfʁɛ	imp:il
offrion(s)	ɔfʁijɔ̃	imp:nous
offrie(z)	ɔfʁije	imp:vous
offrai(ent)	ɔfʁɛ	imp:ils
offran(t)	ɔfʁɑ̃	ppr
offer(t)	ɔfɛʁ	pp
offert(e)	ɔfɛʁt	pp:f
offrirai	ɔfʁiʁe	fut:je
offrira(s)	ɔfʁiʁa	fut:tu
offrira	ɔfʁiʁa	fut:il
offriron(s)	ɔfʁiʁɔ̃	fut:nous
offrire(z)	ɔfʁiʁe	fut:vous
offriron(t)	ɔfʁiʁɔ̃	fut:ils
offrirai(s)	ɔfʁiʁɛ	cond:je/tu
offrirai(t)	ɔfʁiʁɛ	cond:il
offririon(s)	ɔfʁiʁjɔ̃	cond:nous
offririe(z)	ɔfʁiʁje	cond:vous
offrirai(ent)	ɔfʁiʁɛ	cond:ils
>découvrir	dekuvʁiʁ	v	1
découvr(e)	dekuvʁ	pr:je/il
découvr(es)	dekuvʁ	pr:tu
découvron(s)	dekuvʁɔ̃	pr:nous
découvre(z)	dekuvʁe	pr:vous
découvr(ent)	dekuvʁ	pr:ils
découvrai(s)	dekuvʁɛ	imp:je/tu
découvrai(t)	dekuvʁɛ	imp:il
découvrion(s)	dekuvʁijɔ̃	imp:nous
découvrie(z)	dekuvʁije	imp:vous
découvrai(ent)	dekuvʁɛ	imp:ils
découvran(t)	dekuvʁɑ̃	ppr
découver(t)	dekuvɛʁ	pp
découvert(e)	dekuvɛʁt	pp:f
découvrirai	dekuvʁiʁe	fut:je
découvrira(s)	dekuvʁiʁa	fut:tu
découvrira	dekuvʁiʁa	fut:il
découvriron(s)	dekuvʁiʁɔ̃	fut:nous
découvrire(z)	dekuvʁiʁe	fut:vous
découvriron(t)	dekuvʁiʁɔ̃	fut:ils
découvrirai(s)	dekuvʁiʁɛ	cond:je/tu
découvrirai(t)	dekuvʁiʁɛ	cond:il
découvririon(s)	dekuvʁiʁjɔ̃	cond:nous
découvririe(z)	dekuvʁiʁje	cond:vous
découvrirai(ent)	dekuvʁiʁɛ	cond:ils
>connaîtr(e)	kɔnɛtʁ	v	1
connai(s)	kɔnɛ	pr:je/tu
connaî(t)	kɔnɛ	pr:il
connaisson(s)	kɔnɛsɔ̃	pr:nous
connaisse(z)	kɔnɛse	pr:vous
connaiss(ent)	kɔnɛs	pr:ils
connaissai(s)	kɔnɛsɛ	imp:je/tu
connaissai(t)	kɔnɛsɛ	imp:il
connaission(s)	kɔnɛsjɔ̃	imp:nous
connaissie(z)	kɔnɛsje	imp:vous
connaissai(ent)	kɔnɛsɛ	imp:ils
connaissan(t)	kɔnɛsɑ̃	ppr
connu	kɔny	pp
connu(e)	kɔny	pp:f
connaîtrai	kɔnɛtʁe	fut:je
connaîtra(s)	kɔnɛtʁa	fut:tu
connaîtra	kɔnɛtʁa	fut:il
connaîtron(s)	kɔnɛtʁɔ̃	fut:nous
connaître(z)	kɔnɛtʁe	fut:vous
connaîtron(t)	kɔnɛtʁɔ̃	fut:ils
connaîtrai(s)	kɔnɛtʁɛ	cond:je/tu
connaîtrai(t)	kɔnɛtʁɛ	cond:il
connaîtrion(s)	kɔnɛtʁijɔ̃	cond:nous
connaîtrie(z)	kɔnɛtʁije	cond:vous
connaîtrai(ent)	kɔnɛtʁɛ	cond:ils
>reconnaîtr(e)	ʁəkɔnɛtʁ	v	1
reconnai(s)	ʁəkɔnɛ	pr:je/tu
reconnaî(t)	ʁəkɔnɛ	pr:il
reconnaisson(s)	ʁəkɔnɛsɔ̃	pr:nous
reconnaisse(z)	ʁəkɔnɛse	pr:vous
reconnaiss(ent)	ʁəkɔnɛs	pr:ils
reconnaissai(s)	ʁəkɔnɛsɛ	imp:je/tu
reconnaissai(t)	ʁəkɔnɛsɛ	imp:il
reconnaission(s)	ʁəkɔnɛsjɔ̃	imp:nous
reconnaissie(z)	ʁəkɔnɛsje	imp:vous
reconnaissai(ent)	ʁəkɔnɛsɛ	imp:ils
reconnaissan(t)	ʁəkɔnɛsɑ̃	ppr
reconnu	ʁəkɔny	pp
reconnu(e)	ʁəkɔny	pp:f
reconnaîtrai	ʁəkɔnɛtʁe	fut:je
reconnaîtra(s)	ʁəkɔnɛtʁa	fut:tu
reconnaîtra	ʁəkɔnɛtʁa	fut:il
reconnaîtron(s)	ʁəkɔnɛtʁɔ̃	fut:nous
reconnaître(z)	ʁəkɔnɛtʁe	fut:vous
reconnaîtron(t)	ʁəkɔnɛtʁɔ̃	fut:ils
reconnaîtrai(s)	ʁəkɔnɛtʁɛ	cond:je/tu
reconnaîtrai(t)	ʁəkɔnɛtʁɛ	cond:il
reconnaîtrion(s)	ʁəkɔnɛtʁijɔ̃	cond:nous
reconnaîtrie(z)	ʁəkɔnɛtʁije	cond:vous
reconnaîtrai(ent)	ʁəkɔnɛtʁɛ	cond:ils
>paraîtr(e)	paʁɛtʁ	v	1
parai(s)	paʁɛ	pr:je/tu
paraî(t)	paʁɛ	pr:il
paraisson(s)	paʁɛsɔ̃	pr:nous
paraisse(z)	paʁɛse	pr:vous
paraiss(ent)	paʁɛs	pr:ils
paraissai(s)	paʁɛsɛ	imp:je/tu
paraissai(t)	paʁɛsɛ	imp:il
paraission(s)	paʁɛsjɔ̃	imp:nous
paraissie(z)	paʁɛsje	imp:vous
paraissai(ent)	paʁɛsɛ	imp:ils
paraissan(t)	paʁɛsɑ̃	ppr
paru	paʁy	pp
paru(e)	paʁy	pp:f
paraîtrai	paʁɛtʁe	fut:je
paraîtra(s)	paʁɛtʁa	fut:tu
paraîtra	paʁɛtʁa	fut:il
paraîtron(s)	paʁɛtʁɔ̃	fut:nous
paraître(z)	paʁɛtʁe	fut:vous
paraîtron(t)	paʁɛtʁɔ̃	fut:ils
paraîtrai(s)	paʁɛtʁɛ	cond:je/tu
paraîtrai(t)	paʁɛtʁɛ	cond:il
paraîtrion(s)	paʁɛtʁijɔ̃	cond:nous
paraîtrie(z)	paʁɛtʁije	cond:vous
paraîtrai(ent)	paʁɛtʁɛ	cond:ils
>vivr(e)	vivʁ	v	1
vi(s)	vi	pr:je/tu
vi(t)	vi	pr:il
vivon(s)	vivɔ̃	pr:nous
vive(z)	vive	pr:vous
viv(ent)	viv	pr:ils
vivai(s)	vivɛ	imp:je/tu
vivai(t)	vivɛ	imp:il
vivion(s)	vivjɔ̃	imp:nous
vivie(z)	vivje	imp:vous
vivai(ent)	vivɛ	imp:ils
vivan(t)	vivɑ̃	ppr
vécu	veky	pp
vécu(e)	veky	pp:f
vivrai	vivʁe	fut:je
vivra(s)	vivʁa	fut:tu
vivra	vivʁa	fut:il
vivron(s)	vivʁɔ̃	fut:nous
vivre(z)	vivʁe	fut:vous
vivron(t)	vivʁɔ̃	fut:ils
vivrai(s)	vivʁɛ	cond:je/tu
vivrai(t)	vivʁɛ	cond:il
vivrion(s)	vivʁijɔ̃	cond:nous
vivrie(z)	vivʁije	cond:vous
vivrai(ent)	vivʁɛ	cond:ils
>suivr(e)	sɥivʁ	v	1
sui(s)	sɥi	pr:je/tu
sui(t)	sɥi	pr:il
suivon(s)	sɥivɔ̃	pr:nous
suive(z)	sɥive	pr:vous
suiv(ent)	sɥiv	pr:ils
suivai(s)	sɥivɛ	imp:je/tu
suivai(t)	sɥivɛ	imp:il
suivion(s)	sɥivjɔ̃	imp:nous
suivie(z)	sɥivje	imp:vous
suivai(ent)	sɥivɛ	imp:ils
suivan(t)	sɥivɑ̃	ppr
suivi	sɥivi	pp
suivi(e)	sɥivi	pp:f
suivrai	sɥivʁe	fut:je
suivra(s)	sɥivʁa	fut:tu
suivra	sɥivʁa	fut:il
suivron(s)	sɥivʁɔ̃	fut:nous
suivre(z)	sɥivʁe	fut:vous
suivron(t)	sɥivʁɔ̃	fut:ils
suivrai(s)	sɥivʁɛ	cond:je/tu
suivrai(t)	sɥivʁɛ	cond:il
suivrion(s)	sɥivʁijɔ̃	cond:nous
suivrie(z)	sɥivʁije	cond:vous
suivrai(ent)	sɥivʁɛ	cond:ils
>recevoir	ʁəsəvwaʁ	v	1
reçoi(s)	ʁəswa	pr:je/tu
reçoi(t)	ʁəswa	pr:il
recevon(s)	ʁəsəvɔ̃	pr:nous
receve(z)	ʁəsəve	pr:vous
reçoiv(ent)	ʁəswav	pr:ils
recevai(s)	ʁəsəvɛ	imp:je/tu
recevai(t)	ʁəsəvɛ	imp:il
recevion(s)	ʁəsəvjɔ̃	imp:nous
recevie(z)	ʁəsəvje	imp:vous
recevai(ent)	ʁəsəvɛ	imp:ils
recevan(t)	ʁəsəvɑ̃	ppr
reçu	ʁəsy	pp
reçu(e)	ʁəsy	pp:f
recevrai	ʁəsəvʁe	fut:je
recevra(s)	ʁəsəvʁa	fut:tu
recevra	ʁəsəvʁa	fut:il
recevron(s)	ʁəsəvʁɔ̃	fut:nous
recevre(z)	ʁəsəvʁe	fut:vous
recevron(t)	ʁəsəvʁɔ̃	fut:ils
recevrai(s)	ʁəsəvʁɛ	cond:je/tu
recevrai(t)	ʁəsəvʁɛ	cond:il
recevrion(s)	ʁəsəvʁijɔ̃	cond:nous
recevrie(z)	ʁəsəvʁije	cond:vous
recevrai(ent)	ʁəsəvʁɛ	cond:ils
>falloir	falwaʁ	v	1
fallu	faly	pp
fallu(e)	faly	pp:f
fau(t)	fo	pr:il
fallai(t)	falɛ	imp:il
faudra	fodʁa	fut:il
faudrai(t)	fodʁɛ	cond:il
>pleuvoir	pløvwaʁ	v	1
plu	ply	pp
plu(e)	ply	pp:f
pleu(t)	plø	pr:il
pleuvai(t)	pløvɛ	imp:il
pleuvra	pløvʁa	fut:il
>plair(e)	plɛʁ	v	1
plaî(t)	plɛ	pr:il
plai(s)	plɛ	pr:je/tu
plaisai(t)	plɛzɛ	imp:il
>valoir	valwaʁ	v	1
vau(t)	vo	pr:il
val(ent)	val	pr:ils
valai(t)	valɛ	imp:il
vaudrai(t)	vodʁɛ	cond:il
vaudra	vodʁa	fut:il
>courir	kuʁiʁ	v	1
cour(s)	kuʁ	pr:je/tu
cour(t)	kuʁ	pr:il
couron(s)	kuʁɔ̃	pr:nous
coure(z)	kuʁe	pr:vous
cour(ent)	kuʁ	pr:ils
courai(s)	kuʁɛ	imp:je/tu
courai(t)	kuʁɛ	imp:il
courion(s)	kuʁjɔ̃	imp:nous
courie(z)	kuʁje	imp:vous
courai(ent)	kuʁɛ	imp:ils
couran(t)	kuʁɑ̃	ppr
couru	kuʁy	pp
couru(e)	kuʁy	pp:f
courrai	kuʁʁe	fut:je
courra(s)	kuʁʁa	fut:tu
courra	kuʁʁa	fut:il
courron(s)	kuʁʁɔ̃	fut:nous
courre(z)	kuʁʁe	fut:vous
courron(t)	kuʁʁɔ̃	fut:ils
courrai(s)	kuʁʁɛ	cond:je/tu
courrai(t)	kuʁʁɛ	cond:il
courrion(s)	kuʁʁijɔ̃	cond:nous
courrie(z)	kuʁʁije	cond:vous
courrai(ent)	kuʁʁɛ	cond:ils
>mourir	muʁiʁ	v	1
meur(s)	mœʁ	pr:je/tu
meur(t)	mœʁ	pr:il
mouron(s)	muʁɔ̃	pr:nous
moure(z)	muʁe	pr:vous
meur(ent)	mœʁ	pr:ils
mourai(s)	muʁɛ	imp:je/tu
mourai(t)	muʁɛ	imp:il
mourion(s)	muʁjɔ̃	imp:nous
mourie(z)	muʁje	imp:vous
mourai(ent)	muʁɛ	imp:ils
mouran(t)	muʁɑ̃	ppr
mor(t)	mɔʁ	pp
mort(e)	mɔʁt	pp:f
mourrai	muʁʁe	fut:je
mourra(s)	muʁʁa	fut:tu
mourra	muʁʁa	fut:il
mourron(s)	muʁʁɔ̃	fut:nous
mourre(z)	muʁʁe	fut:vous
mourron(t)	muʁʁɔ̃	fut:ils
mourrai(s)	muʁʁɛ	cond:je/tu
mourrai(t)	muʁʁɛ	cond:il
mourrion(s)	muʁʁijɔ̃	cond:nous
mourrie(z)	muʁʁije	cond:vous
mourrai(ent)	muʁʁɛ	cond:ils
>naîtr(e)	nɛtʁ	v	1
né	ne	pp
né(e)	ne	pp:f
nai(s)	nɛ	pr:je/tu
naî(t)	nɛ	pr:il
>rir(e)	ʁiʁ	v	1
ri(s)	ʁi	pr:je/tu
ri(t)	ʁi	pr:il
rion(s)	ʁijɔ̃	pr:nous
rie(z)	ʁije	pr:vous
ri(ent)	ʁi	pr:ils
riai(s)	ʁijɛ	imp:je/tu
riai(t)	ʁijɛ	imp:il
riion(s)	ʁijjɔ̃	imp:nous
riie(z)	ʁijje	imp:vous
riai(ent)	ʁijɛ	imp:ils
rian(t)	ʁijɑ̃	ppr
ri	ʁi	pp
ri(e)	ʁi	pp:f
rirai	ʁiʁe	fut:je
rira(s)	ʁiʁa	fut:tu
rira	ʁiʁa	fut:il
riron(s)	ʁiʁɔ̃	fut:nous
rire(z)	ʁiʁe	fut:vous
riron(t)	ʁiʁɔ̃	fut:ils
rirai(s)	ʁiʁɛ	cond:je/tu
rirai(t)	ʁiʁɛ	cond:il
ririon(s)	ʁiʁjɔ̃	cond:nous
ririe(z)	ʁiʁje	cond:vous
rirai(ent)	ʁiʁɛ	cond:ils
>sourir(e)	suʁiʁ	v	1
souri(s)	suʁi	pr:je/tu
souri(t)	suʁi	pr:il
sourion(s)	suʁijɔ̃	pr:nous
sourie(z)	suʁije	pr:vous
souri(ent)	suʁi	pr:ils
souriai(s)	suʁijɛ	imp:je/tu
souriai(t)	suʁijɛ	imp:il
souriion(s)	suʁijjɔ̃	imp:nous
souriie(z)	suʁijje	imp:vous
souriai(ent)	suʁijɛ	imp:ils
sourian(t)	suʁijɑ̃	ppr
souri	suʁi	pp
souri(e)	suʁi	pp:f
sourirai	suʁiʁe	fut:je
sourira(s)	suʁiʁa	fut:tu
sourira	suʁiʁa	fut:il
souriron(s)	suʁiʁɔ̃	fut:nous
sourire(z)	suʁiʁe	fut:vous
souriron(t)	suʁiʁɔ̃	fut:ils
sourirai(s)	suʁiʁɛ	cond:je/tu
sourirai(t)	suʁiʁɛ	cond:il
souririon(s)	suʁiʁjɔ̃	cond:nous
souririe(z)	suʁiʁje	cond:vous
sourirai(ent)	suʁiʁɛ	cond:ils
>conduir(e)	kɔ̃dɥiʁ	v	1
condui(s)	kɔ̃dɥi	pr:je/tu
condui(t)	kɔ̃dɥi	pr:il,pp
conduison(s)	kɔ̃dɥizɔ̃	pr:nous
conduise(z)	kɔ̃dɥize	pr:vous
conduis(ent)	kɔ̃dɥiz	pr:ils
conduisai(s)	kɔ̃dɥizɛ	imp:je/tu
conduisai(t)	kɔ̃dɥizɛ	imp:il
conduision(s)	kɔ̃dɥizjɔ̃	imp:nous
conduisie(z)	kɔ̃dɥizje	imp:vous
conduisai(ent)	kɔ̃dɥizɛ	imp:ils
conduisan(t)	kɔ̃dɥizɑ̃	ppr
conduit(e)	kɔ̃dɥit	pp:f
conduirai	kɔ̃dɥiʁe	fut:je
conduira(s)	kɔ̃dɥiʁa	fut:tu
conduira	kɔ̃dɥiʁa	fut:il
conduiron(s)	kɔ̃dɥiʁɔ̃	fut:nous
conduire(z)	kɔ̃dɥiʁe	fut:vous
conduiron(t)	kɔ̃dɥiʁɔ̃	fut:ils
conduirai(s)	kɔ̃dɥiʁɛ	cond:je/tu
conduirai(t)	kɔ̃dɥiʁɛ	cond:il
conduirion(s)	kɔ̃dɥiʁjɔ̃	cond:nous
conduirie(z)	kɔ̃dɥiʁje	cond:vous
conduirai(ent)	kɔ̃dɥiʁɛ	cond:ils
>construir(e)	kɔ̃stʁɥiʁ	v	1
construi(s)	kɔ̃stʁɥi	pr:je/tu
construi(t)	kɔ̃stʁɥi	pr:il,pp
construison(s)	kɔ̃stʁɥizɔ̃	pr:nous
construise(z)	kɔ̃stʁɥize	pr:vous
construis(ent)	kɔ̃stʁɥiz	pr:ils
construisai(s)	kɔ̃stʁɥizɛ	imp:je/tu
construisai(t)	kɔ̃stʁɥizɛ	imp:il
construision(s)	kɔ̃stʁɥizjɔ̃	imp:nous
construisie(z)	kɔ̃stʁɥizje	imp:vous
construisai(ent)	kɔ̃stʁɥizɛ	imp:ils
construisan(t)	kɔ̃stʁɥizɑ̃	ppr
construit(e)	kɔ̃stʁɥit	pp:f
construirai	kɔ̃stʁɥiʁe	fut:je
construira(s)	kɔ̃stʁɥiʁa	fut:tu
construira	kɔ̃stʁɥiʁa	fut:il
construiron(s)	kɔ̃stʁɥiʁɔ̃	fut:nous
construire(z)	kɔ̃stʁɥiʁe	fut:vous
construiron(t)	kɔ̃stʁɥiʁɔ̃	fut:ils
construirai(s)	kɔ̃stʁɥiʁɛ	cond:je/tu
construirai(t)	kɔ̃stʁɥiʁɛ	cond:il
construirion(s)	kɔ̃stʁɥiʁjɔ̃	cond:nous
construirie(z)	kɔ̃stʁɥiʁje	cond:vous
construirai(ent)	kɔ̃stʁɥiʁɛ	cond:ils
>produir(e)	pʁɔdɥiʁ	v	1
produi(s)	pʁɔdɥi	pr:je/tu
produi(t)	pʁɔdɥi	pr:il,pp
produison(s)	pʁɔdɥizɔ̃	pr:nous
produise(z)	pʁɔdɥize	pr:vous
produis(ent)	pʁɔdɥiz	pr:ils
produisai(s)	pʁɔdɥizɛ	imp:je/tu
produisai(t)	pʁɔdɥizɛ	imp:il
produision(s)	pʁɔdɥizjɔ̃	imp:nous
produisie(z)	pʁɔdɥizje	imp:vous
produisai(ent)	pʁɔdɥizɛ	imp:ils
produisan(t)	pʁɔdɥizɑ̃	ppr
produit(e)	pʁɔdɥit	pp:f
produirai	pʁɔdɥiʁe	fut:je
produira(s)	pʁɔdɥiʁa	fut:tu
produira	pʁɔdɥiʁa	fut:il
produiron(s)	pʁɔdɥiʁɔ̃	fut:nous
produire(z)	pʁɔdɥiʁe	fut:vous
produiron(t)	pʁɔdɥiʁɔ̃	fut:ils
produirai(s)	pʁɔdɥiʁɛ	cond:je/tu
produirai(t)	pʁɔdɥiʁɛ	cond:il
produirion(s)	pʁɔdɥiʁjɔ̃	cond:nous
produirie(z)	pʁɔdɥiʁje	cond:vous
produirai(ent)	pʁɔdɥiʁɛ	cond:ils
>traduir(e)	tʁadɥiʁ	v	1
tradui(s)	tʁadɥi	pr:je/tu
tradui(t)	tʁadɥi	pr:il,pp
traduison(s)	tʁadɥizɔ̃	pr:nous
traduise(z)	tʁadɥize	pr:vous
traduis(ent)	tʁadɥiz	pr:ils
traduisai(s)	tʁadɥizɛ	imp:je/tu
traduisai(t)	tʁadɥizɛ	imp:il
traduision(s)	tʁadɥizjɔ̃	imp:nous
traduisie(z)	tʁadɥizje	imp:vous
traduisai(ent)	tʁadɥizɛ	imp:ils
traduisan(t)	tʁadɥizɑ̃	ppr
traduit(e)	tʁadɥit	pp:f
traduirai	tʁadɥiʁe	fut:je
traduira(s)	tʁadɥiʁa	fut:tu
traduira	tʁadɥiʁa	fut:il
traduiron(s)	tʁadɥiʁɔ̃	fut:nous
traduire(z)	tʁadɥiʁe	fut:vous
traduiron(t)	tʁadɥiʁɔ̃	fut:ils
traduirai(s)	tʁadɥiʁɛ	cond:je/tu
traduirai(t)	tʁadɥiʁɛ	cond:il
traduirion(s)	tʁadɥiʁjɔ̃	cond:nous
traduirie(z)	tʁadɥiʁje	cond:vous
traduirai(ent)	tʁadɥiʁɛ	cond:ils
>éteindr(e)	etɛ̃dʁ	v	1
étein(s)	etɛ̃	pr:je/tu
étein(t)	etɛ̃	pr:il,pp
éteignon(s)	eteɲɔ̃	pr:nous
éteigne(z)	eteɲe	pr:vous
éteign(ent)	etɛɲ	pr:ils
éteignai(s)	eteɲɛ	imp:je/tu
éteignai(t)	eteɲɛ	imp:il
éteignion(s)	eteɲjɔ̃	imp:nous
éteignie(z)	eteɲje	imp:vous
éteignai(ent)	eteɲɛ	imp:ils
éteignan(t)	eteɲɑ̃	ppr
éteint(e)	etɛ̃t	pp:f
éteindrai	etɛ̃dʁe	fut:je
éteindra(s)	etɛ̃dʁa	fut:tu
éteindra	etɛ̃dʁa	fut:il
éteindron(s)	etɛ̃dʁɔ̃	fut:nous
éteindre(z)	etɛ̃dʁe	fut:vous
éteindron(t)	etɛ̃dʁɔ̃	fut:ils
éteindrai(s)	etɛ̃dʁɛ	cond:je/tu
éteindrai(t)	etɛ̃dʁɛ	cond:il
éteindrion(s)	etɛ̃dʁijɔ̃	cond:nous
éteindrie(z)	etɛ̃dʁije	cond:vous
éteindrai(ent)	etɛ̃dʁɛ	cond:ils
>peindr(e)	pɛ̃dʁ	v	1
pein(s)	pɛ̃	pr:je/tu
pein(t)	pɛ̃	pr:il,pp
peignon(s)	peɲɔ̃	pr:nous
peigne(z)	peɲe	pr:vous
peign(ent)	pɛɲ	pr:ils
peignai(s)	peɲɛ	imp:je/tu
peignai(t)	peɲɛ	imp:il
peignion(s)	peɲjɔ̃	imp:nous
peignie(z)	peɲje	imp:vous
peignai(ent)	peɲɛ	imp:ils
peignan(t)	peɲɑ̃	ppr
peint(e)	pɛ̃t	pp:f
peindrai	pɛ̃dʁe	fut:je
peindra(s)	pɛ̃dʁa	fut:tu
peindra	pɛ̃dʁa	fut:il
peindron(s)	pɛ̃dʁɔ̃	fut:nous
peindre(z)	pɛ̃dʁe	fut:vous
peindron(t)	pɛ̃dʁɔ̃	fut:ils
peindrai(s)	pɛ̃dʁɛ	cond:je/tu
peindrai(t)	pɛ̃dʁɛ	cond:il
peindrion(s)	pɛ̃dʁijɔ̃	cond:nous
peindrie(z)	pɛ̃dʁije	cond:vous
peindrai(ent)	pɛ̃dʁɛ	cond:ils
>craindr(e)	kʁɛ̃dʁ	v	1
crain(s)	kʁɛ̃	pr:je/tu
crain(t)	kʁɛ̃	pr:il,pp
craignon(s)	kʁeɲɔ̃	pr:nous
craigne(z)	kʁeɲe	pr:vous
craign(ent)	kʁɛɲ	pr:ils
craignai(s)	kʁeɲɛ	imp:je/tu
craignai(t)	kʁeɲɛ	imp:il
craignion(s)	kʁeɲjɔ̃	imp:nous
craignie(z)	kʁeɲje	imp:vous
craignai(ent)	kʁeɲɛ	imp:ils
craignan(t)	kʁeɲɑ̃	ppr
craint(e)	kʁɛ̃t	pp:f
craindrai	kʁɛ̃dʁe	fut:je
craindra(s)	kʁɛ̃dʁa	fut:tu
craindra	kʁɛ̃dʁa	fut:il
craindron(s)	kʁɛ̃dʁɔ̃	fut:nous
craindre(z)	kʁɛ̃dʁe	fut:vous
craindron(t)	kʁɛ̃dʁɔ̃	fut:ils
craindrai(s)	kʁɛ̃dʁɛ	cond:je/tu
craindrai(t)	kʁɛ̃dʁɛ	cond:il
craindrion(s)	kʁɛ̃dʁijɔ̃	cond:nous
craindrie(z)	kʁɛ̃dʁije	cond:vous
craindrai(ent)	kʁɛ̃dʁɛ	cond:ils
>battr(e)	batʁ	v	1
ba(ts)	ba	pr:je/tu
ba(t)	ba	pr:il
batton(s)	batɔ̃	pr:nous
batte(z)	bate	pr:vous
batt(ent)	bat	pr:ils
battai(s)	batɛ	imp:je/tu
battai(t)	batɛ	imp:il
battion(s)	batjɔ̃	imp:nous
battie(z)	batje	imp:vous
battai(ent)	batɛ	imp:ils
battan(t)	batɑ̃	ppr
battu	baty	pp
battu(e)	baty	pp:f
battrai	batʁe	fut:je
battra(s)	batʁa	fut:tu
battra	batʁa	fut:il
battron(s)	batʁɔ̃	fut:nous
battre(z)	batʁe	fut:vous
battron(t)	batʁɔ̃	fut:ils
battrai(s)	batʁɛ	cond:je/tu
battrai(t)	batʁɛ	cond:il
battrion(s)	batʁijɔ̃	cond:nous
battrie(z)	batʁije	cond:vous
battrai(ent)	batʁɛ	cond:ils
>ass(e)oir	aswaʁ	v	1
assi(s)	asi	pp
assis(e)	asiz	pp:f
assie(ds)	asje	pr:je/tu
assie(d)	asje	pr:il
asseye(z)	aseje	pr:vous
>parle(r)	paʁle	v	1
parl(e)	paʁl	pr:je/il
parl(es)	paʁl	pr:tu
parl(ent)	paʁl	pr:ils
parlai(s)	paʁlɛ	imp:je/tu
parlai(t)	paʁlɛ	imp:il
parlion(s)	paʁlijɔ̃	imp:nous
parlie(z)	paʁlije	imp:vous
parlai(ent)	paʁlɛ	imp:ils
parlon(s)	paʁlɔ̃	pr:nous
parle(z)	paʁle	pr:vous
parlan(t)	paʁlɑ̃	ppr
parlé	paʁle	pp
parlé(e)	paʁle	pp:f
parlerai	paʁləʁe	fut:je
parlera(s)	paʁləʁa	fut:tu
parlera	paʁləʁa	fut:il
parleron(s)	paʁləʁɔ̃	fut:nous
parlere(z)	paʁləʁe	fut:vous
parleron(t)	paʁləʁɔ̃	fut:ils
parlerai(s)	paʁləʁɛ	cond:je/tu
parlerai(t)	paʁləʁɛ	cond:il
parlerion(s)	paʁləʁjɔ̃	cond:nous
parlerie(z)	paʁləʁje	cond:vous
parlerai(ent)	paʁləʁɛ	cond:ils
>aime(r)	ɛme	v	1
aim(e)	ɛm	pr:je/il
aim(es)	ɛm	pr:tu
aim(ent)	ɛm	pr:ils
aimai(s)	ɛmɛ	imp:je/tu
aimai(t)	ɛmɛ	imp:il
aimion(s)	ɛmjɔ̃	imp:nous
aimie(z)	ɛmje	imp:vous
aimai(ent)	ɛmɛ	imp:ils
aimon(s)	ɛmɔ̃	pr:nous
aime(z)	ɛme	pr:vous
aiman(t)	ɛmɑ̃	ppr
aimé	ɛme	pp
aimé(e)	ɛme	pp:f
aimerai	ɛmʁe	fut:je
aimera(s)	ɛmʁa	fut:tu
aimera	ɛmʁa	fut:il
aimeron(s)	ɛmʁɔ̃	fut:nous
aimere(z)	ɛmʁe	fut:vous
aimeron(t)	ɛmʁɔ̃	fut:ils
aimerai(s)	ɛmʁɛ	cond:je/tu
aimerai(t)	ɛmʁɛ	cond:il
aimerion(s)	ɛməʁjɔ̃	cond:nous
aimerie(z)	ɛməʁje	cond:vous
aimerai(ent)	ɛmʁɛ	cond:ils
>mange(r)	mɑ̃ʒe	v	1
mang(e)	mɑ̃ʒ	pr:je/il
mang(es)	mɑ̃ʒ	pr:tu
mang(ent)	mɑ̃ʒ	pr:ils
mangeai(s)	mɑ̃ʒɛ	imp:je/tu
mangeai(t)	mɑ̃ʒɛ	imp:il
mangion(s)	mɑ̃ʒjɔ̃	imp:nous
mangie(z)	mɑ̃ʒje	imp:vous
mangeai(ent)	mɑ̃ʒɛ	imp:ils
mangeon(s)	mɑ̃ʒɔ̃	pr:nous
mange(z)	mɑ̃ʒe	pr:vous
mangean(t)	mɑ̃ʒɑ̃	ppr
mangé	mɑ̃ʒe	pp
mangé(e)	mɑ̃ʒe	pp:f
mangerai	mɑ̃ʒʁe	fut:je
mangera(s)	mɑ̃ʒʁa	fut:tu
mangera	mɑ̃ʒʁa	fut:il
mangeron(s)	mɑ̃ʒʁɔ̃	fut:nous
mangere(z)	mɑ̃ʒʁe	fut:vous
mangeron(t)	mɑ̃ʒʁɔ̃	fut:ils
mangerai(s)	mɑ̃ʒʁɛ	cond:je/tu
mangerai(t)	mɑ̃ʒʁɛ	cond:il
mangerion(s)	mɑ̃ʒəʁjɔ̃	cond:nous
mangerie(z)	mɑ̃ʒəʁje	cond:vous
mangerai(ent)	mɑ̃ʒʁɛ	cond:ils
>regarde(r)	ʁəgaʁde	v	1
regard(e)	ʁəgaʁd	pr:je/il
regard(es)	ʁəgaʁd	pr:tu
regard(ent)	ʁəgaʁd	pr:ils
regardai(s)	ʁəgaʁdɛ	imp:je/tu
regardai(t)	ʁəgaʁdɛ	imp:il
regardion(s)	ʁəgaʁdjɔ̃	imp:nous
regardie(z)	ʁəgaʁdje	imp:vous
regardai(ent)	ʁəgaʁdɛ	imp:ils
regardon(s)	ʁəgaʁdɔ̃	pr:nous
regarde(z)	ʁəgaʁde	pr:vous
regardan(t)	ʁəgaʁdɑ̃	ppr
regardé	ʁəgaʁde	pp
regardé(e)	ʁəgaʁde	pp:f
regarderai	ʁəgaʁdəʁe	fut:je
regardera(s)	ʁəgaʁdəʁa	fut:tu
regardera	ʁəgaʁdəʁa	fut:il
regarderon(s)	ʁəgaʁdəʁɔ̃	fut:nous
regardere(z)	ʁəgaʁdəʁe	fut:vous
regarderon(t)	ʁəgaʁdəʁɔ̃	fut:ils
regarderai(s)	ʁəgaʁdəʁɛ	cond:je/tu
regarderai(t)	ʁəgaʁdəʁɛ	cond:il
regarderion(s)	ʁəgaʁdəʁjɔ̃	cond:nous
regarderie(z)	ʁəgaʁdəʁje	cond:vous
regarderai(ent)	ʁəgaʁdəʁɛ	cond:ils
>écoute(r)	ekute	v	1
écout(e)	ekut	pr:je/il
écout(es)	ekut	pr:tu
écout(ent)	ekut	pr:ils
écoutai(s)	ekutɛ	imp:je/tu
écoutai(t)	ekutɛ	imp:il
écoution(s)	ekutjɔ̃	imp:nous
écoutie(z)	ekutje	imp:vous
écoutai(ent)	ekutɛ	imp:ils
écouton(s)	ekutɔ̃	pr:nous
écoute(z)	ekute	pr:vous
écoutan(t)	ekutɑ̃	ppr
écouté	ekute	pp
écouté(e)	ekute	pp:f
écouterai	ekutʁe	fut:je
écoutera(s)	ekutʁa	fut:tu
écoutera	ekutʁa	fut:il
écouteron(s)	ekutʁɔ̃	fut:nous
écoutere(z)	ekutʁe	fut:vous
écouteron(t)	ekutʁɔ̃	fut:ils
écouterai(s)	ekutʁɛ	cond:je/tu
écouterai(t)	ekutʁɛ	cond:il
écouterion(s)	ekutəʁjɔ̃	cond:nous
écouterie(z)	ekutəʁje	cond:vous
écouterai(ent)	ekutʁɛ	cond:ils
>travaille(r)	tʁavaje	v	1
travaill(e)	tʁavaj	pr:je/il
travaill(es)	tʁavaj	pr:tu
travaill(ent)	tʁavaj	pr:ils
travaillai(s)	tʁavajɛ	imp:je/tu
travaillai(t)	tʁavajɛ	imp:il
travaillion(s)	tʁavajjɔ̃	imp:nous
travaillie(z)	tʁavajje	imp:vous
travaillai(ent)	tʁavajɛ	imp:ils
travaillon(s)	tʁavajɔ̃	pr:nous
travaille(z)	tʁavaje	pr:vous
travaillan(t)	tʁavajɑ̃	ppr
travaillé	tʁavaje	pp
travaillé(e)	tʁavaje	pp:f
travaillerai	tʁavajʁe	fut:je
travaillera(s)	tʁavajʁa	fut:tu
travaillera	tʁavajʁa	fut:il
travailleron(s)	tʁavajʁɔ̃	fut:nous
travaillere(z)	tʁavajʁe	fut:vous
travailleron(t)	tʁavajʁɔ̃	fut:ils
travaillerai(s)	tʁavajʁɛ	cond:je/tu
travaillerai(t)	tʁavajʁɛ	cond:il
travaillerion(s)	tʁavajəʁjɔ̃	cond:nous
travaillerie(z)	tʁavajəʁje	cond:vous
travaillerai(ent)	tʁavajʁɛ	cond:ils
>(h)abite(r)	abite	v	1
(h)abit(e)	abit	pr:je/il
(h)abit(es)	abit	pr:tu
(h)abit(ent)	abit	pr:ils
(h)abitai(s)	abitɛ	imp:je/tu
(h)abitai(t)	abitɛ	imp:il
(h)abition(s)	abitjɔ̃	imp:nous
(h)abitie(z)	abitje	imp:vous
(h)abitai(ent)	abitɛ	imp:ils
(h)abiton(s)	abitɔ̃	pr:nous
(h)abite(z)	abite	pr:vous
(h)abitan(t)	abitɑ̃	ppr
(h)abité	abite	pp
(h)abité(e)	abite	pp:f
(h)abiterai	abitʁe	fut:je
(h)abitera(s)	abitʁa	fut:tu
(h)abitera	abitʁa	fut:il
(h)abiteron(s)	abitʁɔ̃	fut:nous
(h)abitere(z)	abitʁe	fut:vous
(h)abiteron(t)	abitʁɔ̃	fut:ils
(h)abiterai(s)	abitʁɛ	cond:je/tu
(h)abiterai(t)	abitʁɛ	cond:il
(h)abiterion(s)	abitəʁjɔ̃	cond:nous
(h)abiterie(z)	abitəʁje	cond:vous
(h)abiterai(ent)	abitʁɛ	cond:ils
>donne(r)	dɔne	v	1
donn(e)	dɔn	pr:je/il
donn(es)	dɔn	pr:tu
donn(ent)	dɔn	pr:ils
donnai(s)	dɔnɛ	imp:je/tu
donnai(t)	dɔnɛ	imp:il
donnion(s)	dɔnjɔ̃	imp:nous
donnie(z)	dɔnje	imp:vous
donnai(ent)	dɔnɛ	imp:ils
donnon(s)	dɔnɔ̃	pr:nous
donne(z)	dɔne	pr:vous
donnan(t)	dɔnɑ̃	ppr
donné	dɔne	pp
donné(e)	dɔne	pp:f
donnerai	dɔnʁe	fut:je
donnera(s)	dɔnʁa	fut:tu
donnera	dɔnʁa	fut:il
donneron(s)	dɔnʁɔ̃	fut:nous
donnere(z)	dɔnʁe	fut:vous
donneron(t)	dɔnʁɔ̃	fut:ils
donnerai(s)	dɔnʁɛ	cond:je/tu
donnerai(t)	dɔnʁɛ	cond:il
donnerion(s)	dɔnəʁjɔ̃	cond:nous
donnerie(z)	dɔnəʁje	cond:vous
donnerai(ent)	dɔnʁɛ	cond:ils
>trouve(r)	tʁuve	v	1
trouv(e)	tʁuv	pr:je/il
trouv(es)	tʁuv	pr:tu
trouv(ent)	tʁuv	pr:ils
trouvai(s)	tʁuvɛ	imp:je/tu
trouvai(t)	tʁuvɛ	imp:il
trouvion(s)	tʁuvjɔ̃	imp:nous
trouvie(z)	tʁuvje	imp:vous
trouvai(ent)	tʁuvɛ	imp:ils
trouvon(s)	tʁuvɔ̃	pr:nous
trouve(z)	tʁuve	pr:vous
trouvan(t)	tʁuvɑ̃	ppr
trouvé	tʁuve	pp
trouvé(e)	tʁuve	pp:f
trouverai	tʁuvʁe	fut:je
trouvera(s)	tʁuvʁa	fut:tu
trouvera	tʁuvʁa	fut:il
trouveron(s)	tʁuvʁɔ̃	fut:nous
trouvere(z)	tʁuvʁe	fut:vous
trouveron(t)	tʁuvʁɔ̃	fut:ils
trouverai(s)	tʁuvʁɛ	cond:je/tu
trouverai(t)	tʁuvʁɛ	cond:il
trouverion(s)	tʁuvəʁjɔ̃	cond:nous
trouverie(z)	tʁuvəʁje	cond:vous
trouverai(ent)	tʁuvʁɛ	cond:ils
>cherche(r)	ʃɛʁʃe	v	1
cherch(e)	ʃɛʁʃ	pr:je/il
cherch(es)	ʃɛʁʃ	pr:tu
cherch(ent)	ʃɛʁʃ	pr:ils
cherchai(s)	ʃɛʁʃɛ	imp:je/tu
cherchai(t)	ʃɛʁʃɛ	imp:il
cherchion(s)	ʃɛʁʃjɔ̃	imp:nous
cherchie(z)	ʃɛʁʃje	imp:vous
cherchai(ent)	ʃɛʁʃɛ	imp:ils
cherchon(s)	ʃɛʁʃɔ̃	pr:nous
cherche(z)	ʃɛʁʃe	pr:vous
cherchan(t)	ʃɛʁʃɑ̃	ppr
cherché	ʃɛʁʃe	pp
cherché(e)	ʃɛʁʃe	pp:f
chercherai	ʃɛʁʃəʁe	fut:je
cherchera(s)	ʃɛʁʃəʁa	fut:tu
cherchera	ʃɛʁʃəʁa	fut:il
chercheron(s)	ʃɛʁʃəʁɔ̃	fut:nous
cherchere(z)	ʃɛʁʃəʁe	fut:vous
chercheron(t)	ʃɛʁʃəʁɔ̃	fut:ils
chercherai(s)	ʃɛʁʃəʁɛ	cond:je/tu
chercherai(t)	ʃɛʁʃəʁɛ	cond:il
chercherion(s)	ʃɛʁʃəʁjɔ̃	cond:nous
chercherie(z)	ʃɛʁʃəʁje	cond:vous
chercherai(ent)	ʃɛʁʃəʁɛ	cond:ils
>demande(r)	dəmɑ̃de	v	1
demand(e)	dəmɑ̃d	pr:je/il
demand(es)	dəmɑ̃d	pr:tu
demand(ent)	dəmɑ̃d	pr:ils
demandai(s)	dəmɑ̃dɛ	imp:je/tu
demandai(t)	dəmɑ̃dɛ	imp:il
demandion(s)	dəmɑ̃djɔ̃	imp:nous
demandie(z)	dəmɑ̃dje	imp:vous
demandai(ent)	dəmɑ̃dɛ	imp:ils
demandon(s)	dəmɑ̃dɔ̃	pr:nous
demande(z)	dəmɑ̃de	pr:vous
demandan(t)	dəmɑ̃dɑ̃	ppr
demandé	dəmɑ̃de	pp
demandé(e)	dəmɑ̃de	pp:f
demanderai	dəmɑ̃dʁe	fut:je
demandera(s)	dəmɑ̃dʁa	fut:tu
demandera	dəmɑ̃dʁa	fut:il
demanderon(s)	dəmɑ̃dʁɔ̃	fut:nous
demandere(z)	dəmɑ̃dʁe	fut:vous
demanderon(t)	dəmɑ̃dʁɔ̃	fut:ils
demanderai(s)	dəmɑ̃dʁɛ	cond:je/tu
demanderai(t)	dəmɑ̃dʁɛ	cond:il
demanderion(s)	dəmɑ̃dəʁjɔ̃	cond:nous
demanderie(z)	dəmɑ̃dəʁje	cond:vous
demanderai(ent)	dəmɑ̃dʁɛ	cond:ils
>passe(r)	pase	v	1
pass(e)	pas	pr:je/il
pass(es)	pas	pr:tu
pass(ent)	pas	pr:ils
passai(s)	pasɛ	imp:je/tu
passai(t)	pasɛ	imp:il
passion(s)	pasjɔ̃	imp:nous
passie(z)	pasje	imp:vous
passai(ent)	pasɛ	imp:ils
passon(s)	pasɔ̃	pr:nous
passe(z)	pase	pr:vous
passan(t)	pasɑ̃	ppr
passé	pase	pp
passé(e)	pase	pp:f
passerai	pasʁe	fut:je
passera(s)	pasʁa	fut:tu
passera	pasʁa	fut:il
passeron(s)	pasʁɔ̃	fut:nous
passere(z)	pasʁe	fut:vous
passeron(t)	pasʁɔ̃	fut:ils
passerai(s)	pasʁɛ	cond:je/tu
passerai(t)	pasʁɛ	cond:il
passerion(s)	pasəʁjɔ̃	cond:nous
passerie(z)	pasəʁje	cond:vous
passerai(ent)	pasʁɛ	cond:ils
>reste(r)	ʁɛste	v	1
rest(e)	ʁɛst	pr:je/il
rest(es)	ʁɛst	pr:tu
rest(ent)	ʁɛst	pr:ils
restai(s)	ʁɛstɛ	imp:je/tu
restai(t)	ʁɛstɛ	imp:il
restion(s)	ʁɛstjɔ̃	imp:nous
restie(z)	ʁɛstje	imp:vous
restai(ent)	ʁɛstɛ	imp:ils
reston(s)	ʁɛstɔ̃	pr:nous
reste(z)	ʁɛste	pr:vous
restan(t)	ʁɛstɑ̃	ppr
resté	ʁɛste	pp
resté(e)	ʁɛste	pp:f
resterai	ʁɛstəʁe	fut:je
restera(s)	ʁɛstəʁa	fut:tu
restera	ʁɛstəʁa	fut:il
resteron(s)	ʁɛstəʁɔ̃	fut:nous
restere(z)	ʁɛstəʁe	fut:vous
resteron(t)	ʁɛstəʁɔ̃	fut:ils
resterai(s)	ʁɛstəʁɛ	cond:je/tu
resterai(t)	ʁɛstəʁɛ	cond:il
resterion(s)	ʁɛstəʁjɔ̃	cond:nous
resterie(z)	ʁɛstəʁje	cond:vous
resterai(ent)	ʁɛstəʁɛ	cond:ils
>pense(r)	pɑ̃se	v	1
pens(e)	pɑ̃s	pr:je/il
pens(es)	pɑ̃s	pr:tu
pens(ent)	pɑ̃s	pr:ils
pensai(s)	pɑ̃sɛ	imp:je/tu
pensai(t)	pɑ̃sɛ	imp:il
pension(s)	pɑ̃sjɔ̃	imp:nous
pensie(z)	pɑ̃sje	imp:vous
pensai(ent)	pɑ̃sɛ	imp:ils
penson(s)	pɑ̃sɔ̃	pr:nous
pense(z)	pɑ̃se	pr:vous
pensan(t)	pɑ̃sɑ̃	ppr
pensé	pɑ̃se	pp
pensé(e)	pɑ̃se	pp:f
penserai	pɑ̃sʁe	fut:je
pensera(s)	pɑ̃sʁa	fut:tu
pensera	pɑ̃sʁa	fut:il
penseron(s)	pɑ̃sʁɔ̃	fut:nous
pensere(z)	pɑ̃sʁe	fut:vous
penseron(t)	pɑ̃sʁɔ̃	fut:ils
penserai(s)	pɑ̃sʁɛ	cond:je/tu
penserai(t)	pɑ̃sʁɛ	cond:il
penserion(s)	pɑ̃səʁjɔ̃	cond:nous
penserie(z)	pɑ̃səʁje	cond:vous
penserai(ent)	pɑ̃sʁɛ	cond:ils
>arrive(r)	aʁive	v	1
arriv(e)	aʁiv	pr:je/il
arriv(es)	aʁiv	pr:tu
arriv(ent)	aʁiv	pr:ils
arrivai(s)	aʁivɛ	imp:je/tu
arrivai(t)	aʁivɛ	imp:il
arrivion(s)	aʁivjɔ̃	imp:nous
arrivie(z)	aʁivje	imp:vous
arrivai(ent)	aʁivɛ	imp:ils
arrivon(s)	aʁivɔ̃	pr:nous
arrive(z)	aʁive	pr:vous
arrivan(t)	aʁivɑ̃	ppr
arrivé	aʁive	pp
arrivé(e)	aʁive	pp:f
arriverai	aʁivʁe	fut:je
arrivera(s)	aʁivʁa	fut:tu
arrivera	aʁivʁa	fut:il
arriveron(s)	aʁivʁɔ̃	fut:nous
arrivere(z)	aʁivʁe	fut:vous
arriveron(t)	aʁivʁɔ̃	fut:ils
arriverai(s)	aʁivʁɛ	cond:je/tu
arriverai(t)	aʁivʁɛ	cond:il
arriverion(s)	aʁivəʁjɔ̃	cond:nous
arriverie(z)	aʁivəʁje	cond:vous
arriverai(ent)	aʁivʁɛ	cond:ils
>entre(r)	ɑ̃tʁe	v	1
entr(e)	ɑ̃tʁ	pr:je/il
entr(es)	ɑ̃tʁ	pr:tu
entr(ent)	ɑ̃tʁ	pr:ils
entrai(s)	ɑ̃tʁɛ	imp:je/tu
entrai(t)	ɑ̃tʁɛ	imp:il
entrion(s)	ɑ̃tʁijɔ̃	imp:nous
entrie(z)	ɑ̃tʁije	imp:vous
entrai(ent)	ɑ̃tʁɛ	imp:ils
entron(s)	ɑ̃tʁɔ̃	pr:nous
entre(z)	ɑ̃tʁe	pr:vous
entran(t)	ɑ̃tʁɑ̃	ppr
entré	ɑ̃tʁe	pp
entré(e)	ɑ̃tʁe	pp:f
entrerai	ɑ̃tʁəʁe	fut:je
entrera(s)	ɑ̃tʁəʁa	fut:tu
entrera	ɑ̃tʁəʁa	fut:il
entreron(s)	ɑ̃tʁəʁɔ̃	fut:nous
entrere(z)	ɑ̃tʁəʁe	fut:vous
entreron(t)	ɑ̃tʁəʁɔ̃	fut:ils
entrerai(s)	ɑ̃tʁəʁɛ	cond:je/tu
entrerai(t)	ɑ̃tʁəʁɛ	cond:il
entrerion(s)	ɑ̃tʁəʁjɔ̃	cond:nous
entrerie(z)	ɑ̃tʁəʁje	cond:vous
entrerai(ent)	ɑ̃tʁəʁɛ	cond:ils
>rentre(r)	ʁɑ̃tʁe	v	1
rentr(e)	ʁɑ̃tʁ	pr:je/il
rentr(es)	ʁɑ̃tʁ	pr:tu
rentr(ent)	ʁɑ̃tʁ	pr:ils
rentrai(s)	ʁɑ̃tʁɛ	imp:je/tu
rentrai(t)	ʁɑ̃tʁɛ	imp:il
rentrion(s)	ʁɑ̃tʁijɔ̃	imp:nous
rentrie(z)	ʁɑ̃tʁije	imp:vous
rentrai(ent)	ʁɑ̃tʁɛ	imp:ils
rentron(s)	ʁɑ̃tʁɔ̃	pr:nous
rentre(z)	ʁɑ̃tʁe	pr:vous
rentran(t)	ʁɑ̃tʁɑ̃	ppr
rentré	ʁɑ̃tʁe	pp
rentré(e)	ʁɑ̃tʁe	pp:f
rentrerai	ʁɑ̃tʁəʁe	fut:je
rentrera(s)	ʁɑ̃tʁəʁa	fut:tu
rentrera	ʁɑ̃tʁəʁa	fut:il
rentreron(s)	ʁɑ̃tʁəʁɔ̃	fut:nous
rentrere(z)	ʁɑ̃tʁəʁe	fut:vous
rentreron(t)	ʁɑ̃tʁəʁɔ̃	fut:ils
rentrerai(s)	ʁɑ̃tʁəʁɛ	cond:je/tu
rentrerai(t)	ʁɑ̃tʁəʁɛ	cond:il
rentrerion(s)	ʁɑ̃tʁəʁjɔ̃	cond:nous
rentrerie(z)	ʁɑ̃tʁəʁje	cond:vous
rentrerai(ent)	ʁɑ̃tʁəʁɛ	cond:ils
>monte(r)	mɔ̃te	v	1
mont(e)	mɔ̃t	pr:je/il
mont(es)	mɔ̃t	pr:tu
mont(ent)	mɔ̃t	pr:ils
montai(s)	mɔ̃tɛ	imp:je/tu
montai(t)	mɔ̃tɛ	imp:il
montion(s)	mɔ̃tjɔ̃	imp:nous
montie(z)	mɔ̃tje	imp:vous
montai(ent)	mɔ̃tɛ	imp:ils
monton(s)	mɔ̃tɔ̃	pr:nous
monte(z)	mɔ̃te	pr:vous
montan(t)	mɔ̃tɑ̃	ppr
monté	mɔ̃te	pp
monté(e)	mɔ̃te	pp:f
monterai	mɔ̃tʁe	fut:je
montera(s)	mɔ̃tʁa	fut:tu
montera	mɔ̃tʁa	fut:il
monteron(s)	mɔ̃tʁɔ̃	fut:nous
montere(z)	mɔ̃tʁe	fut:vous
monteron(t)	mɔ̃tʁɔ̃	fut:ils
monterai(s)	mɔ̃tʁɛ	cond:je/tu
monterai(t)	mɔ̃tʁɛ	cond:il
monterion(s)	mɔ̃təʁjɔ̃	cond:nous
monterie(z)	mɔ̃təʁje	cond:vous
monterai(ent)	mɔ̃tʁɛ	cond:ils
>tombe(r)	tɔ̃be	v	1
tomb(e)	tɔ̃b	pr:je/il
tomb(es)	tɔ̃b	pr:tu
tomb(ent)	tɔ̃b	pr:ils
tombai(s)	tɔ̃bɛ	imp:je/tu
tombai(t)	tɔ̃bɛ	imp:il
tombion(s)	tɔ̃bjɔ̃	imp:nous
tombie(z)	tɔ̃bje	imp:vous
tombai(ent)	tɔ̃bɛ	imp:ils
tombon(s)	tɔ̃bɔ̃	pr:nous
tombe(z)	tɔ̃be	pr:vous
tomban(t)	tɔ̃bɑ̃	ppr
tombé	tɔ̃be	pp
tombé(e)	tɔ̃be	pp:f
tomberai	tɔ̃bʁe	fut:je
tombera(s)	tɔ̃bʁa	fut:tu
tombera	tɔ̃bʁa	fut:il
tomberon(s)	tɔ̃bʁɔ̃	fut:nous
tombere(z)	tɔ̃bʁe	fut:vous
tomberon(t)	tɔ̃bʁɔ̃	fut:ils
tomberai(s)	tɔ̃bʁɛ	cond:je/tu
tomberai(t)	tɔ̃bʁɛ	cond:il
tomberion(s)	tɔ̃bəʁjɔ̃	cond:nous
tomberie(z)	tɔ̃bəʁje	cond:vous
tomberai(ent)	tɔ̃bʁɛ	cond:ils
>porte(r)	pɔʁte	v	1
port(e)	pɔʁt	pr:je/il
port(es)	pɔʁt	pr:tu
port(ent)	pɔʁt	pr:ils
portai(s)	pɔʁtɛ	imp:je/tu
portai(t)	pɔʁtɛ	imp:il
portion(s)	pɔʁtjɔ̃	imp:nous
portie(z)	pɔʁtje	imp:vous
portai(ent)	pɔʁtɛ	imp:ils
porton(s)	pɔʁtɔ̃	pr:nous
porte(z)	pɔʁte	pr:vous
portan(t)	pɔʁtɑ̃	ppr
porté	pɔʁte	pp
porté(e)	pɔʁte	pp:f
porterai	pɔʁtəʁe	fut:je
portera(s)	pɔʁtəʁa	fut:tu
portera	pɔʁtəʁa	fut:il
porteron(s)	pɔʁtəʁɔ̃	fut:nous
portere(z)	pɔʁtəʁe	fut:vous
porteron(t)	pɔʁtəʁɔ̃	fut:ils
porterai(s)	pɔʁtəʁɛ	cond:je/tu
porterai(t)	pɔʁtəʁɛ	cond:il
porterion(s)	pɔʁtəʁjɔ̃	cond:nous
porterie(z)	pɔʁtəʁje	cond:vous
porterai(ent)	pɔʁtəʁɛ	cond:ils
>apporte(r)	apɔʁte	v	1
apport(e)	apɔʁt	pr:je/il
apport(es)	apɔʁt	pr:tu
apport(ent)	apɔʁt	pr:ils
apportai(s)	apɔʁtɛ	imp:je/tu
apportai(t)	apɔʁtɛ	imp:il
apportion(s)	apɔʁtjɔ̃	imp:nous
apportie(z)	apɔʁtje	imp:vous
apportai(ent)	apɔʁtɛ	imp:ils
apporton(s)	apɔʁtɔ̃	pr:nous
apporte(z)	apɔʁte	pr:vous
apportan(t)	apɔʁtɑ̃	ppr
apporté	apɔʁte	pp
apporté(e)	apɔʁte	pp:f
apporterai	apɔʁtəʁe	fut:je
apportera(s)	apɔʁtəʁa	fut:tu
apportera	apɔʁtəʁa	fut:il
apporteron(s)	apɔʁtəʁɔ̃	fut:nous
apportere(z)	apɔʁtəʁe	fut:vous
apporteron(t)	apɔʁtəʁɔ̃	fut:ils
apporterai(s)	apɔʁtəʁɛ	cond:je/tu
apporterai(t)	apɔʁtəʁɛ	cond:il
apporterion(s)	apɔʁtəʁjɔ̃	cond:nous
apporterie(z)	apɔʁtəʁje	cond:vous
apporterai(ent)	apɔʁtəʁɛ	cond:ils
>emporte(r)	ɑ̃pɔʁte	v	1
emport(e)	ɑ̃pɔʁt	pr:je/il
emport(es)	ɑ̃pɔʁt	pr:tu
emport(ent)	ɑ̃pɔʁt	pr:ils
emportai(s)	ɑ̃pɔʁtɛ	imp:je/tu
emportai(t)	ɑ̃pɔʁtɛ	imp:il
emportion(s)	ɑ̃pɔʁtjɔ̃	imp:nous
emportie(z)	ɑ̃pɔʁtje	imp:vous
emportai(ent)	ɑ̃pɔʁtɛ	imp:ils
emporton(s)	ɑ̃pɔʁtɔ̃	pr:nous
emporte(z)	ɑ̃pɔʁte	pr:vous
emportan(t)	ɑ̃pɔʁtɑ̃	ppr
emporté	ɑ̃pɔʁte	pp
emporté(e)	ɑ̃pɔʁte	pp:f
emporterai	ɑ̃pɔʁtəʁe	fut:je
emportera(s)	ɑ̃pɔʁtəʁa	fut:tu
emportera	ɑ̃pɔʁtəʁa	fut:il
emporteron(s)	ɑ̃pɔʁtəʁɔ̃	fut:nous
emportere(z)	ɑ̃pɔʁtəʁe	fut:vous
emporteron(t)	ɑ̃pɔʁtəʁɔ̃	fut:ils
emporterai(s)	ɑ̃pɔʁtəʁɛ	cond:je/tu
emporterai(t)	ɑ̃pɔʁtəʁɛ	cond:il
emporterion(s)	ɑ̃pɔʁtəʁjɔ̃	cond:nous
emporterie(z)	ɑ̃pɔʁtəʁje	cond:vous
emporterai(ent)	ɑ̃pɔʁtəʁɛ	cond:ils
>laisse(r)	lɛse	v	1
laiss(e)	lɛs	pr:je/il
laiss(es)	lɛs	pr:tu
laiss(ent)	lɛs	pr:ils
laissai(s)	lɛsɛ	imp:je/tu
laissai(t)	lɛsɛ	imp:il
laission(s)	lɛsjɔ̃	imp:nous
laissie(z)	lɛsje	imp:vous
laissai(ent)	lɛsɛ	imp:ils
laisson(s)	lɛsɔ̃	pr:nous
laisse(z)	lɛse	pr:vous
laissan(t)	lɛsɑ̃	ppr
laissé	lɛse	pp
laissé(e)	lɛse	pp:f
laisserai	lɛsʁe	fut:je
laissera(s)	lɛsʁa	fut:tu
laissera	lɛsʁa	fut:il
laisseron(s)	lɛsʁɔ̃	fut:nous
laissere(z)	lɛsʁe	fut:vous
laisseron(t)	lɛsʁɔ̃	fut:ils
laisserai(s)	lɛsʁɛ	cond:je/tu
laisserai(t)	lɛsʁɛ	cond:il
laisserion(s)	lɛsəʁjɔ̃	cond:nous
laisserie(z)	lɛsəʁje	cond:vous
laisserai(ent)	lɛsʁɛ	cond:ils
>montre(r)	mɔ̃tʁe	v	1
montr(e)	mɔ̃tʁ	pr:je/il
montr(es)	mɔ̃tʁ	pr:tu
montr(ent)	mɔ̃tʁ	pr:ils
montrai(s)	mɔ̃tʁɛ	imp:je/tu
montrai(t)	mɔ̃tʁɛ	imp:il
montrion(s)	mɔ̃tʁijɔ̃	imp:nous
montrie(z)	mɔ̃tʁije	imp:vous
montrai(ent)	mɔ̃tʁɛ	imp:ils
montron(s)	mɔ̃tʁɔ̃	pr:nous
montre(z)	mɔ̃tʁe	pr:vous
montran(t)	mɔ̃tʁɑ̃	ppr
montré	mɔ̃tʁe	pp
montré(e)	mɔ̃tʁe	pp:f
montrerai	mɔ̃tʁəʁe	fut:je
montrera(s)	mɔ̃tʁəʁa	fut:tu
montrera	mɔ̃tʁəʁa	fut:il
montreron(s)	mɔ̃tʁəʁɔ̃	fut:nous
montrere(z)	mɔ̃tʁəʁe	fut:vous
montreron(t)	mɔ̃tʁəʁɔ̃	fut:ils
montrerai(s)	mɔ̃tʁəʁɛ	cond:je/tu
montrerai(t)	mɔ̃tʁəʁɛ	cond:il
montrerion(s)	mɔ̃tʁəʁjɔ̃	cond:nous
montrerie(z)	mɔ̃tʁəʁje	cond:vous
montrerai(ent)	mɔ̃tʁəʁɛ	cond:ils
>joue(r)	ʒwe	v	1
jou(e)	ʒu	pr:je/il
jou(es)	ʒu	pr:tu
jou(ent)	ʒu	pr:ils
jouai(s)	ʒwɛ	imp:je/tu
jouai(t)	ʒwɛ	imp:il
jouion(s)	ʒwjɔ̃	imp:nous
jouie(z)	ʒwje	imp:vous
jouai(ent)	ʒwɛ	imp:ils
jouon(s)	ʒwɔ̃	pr:nous
joue(z)	ʒwe	pr:vous
jouan(t)	ʒwɑ̃	ppr
joué	ʒwe	pp
joué(e)	ʒwe	pp:f
jouerai	ʒuʁe	fut:je
jouera(s)	ʒuʁa	fut:tu
jouera	ʒuʁa	fut:il
joueron(s)	ʒuʁɔ̃	fut:nous
jouere(z)	ʒuʁe	fut:vous
joueron(t)	ʒuʁɔ̃	fut:ils
jouerai(s)	ʒuʁɛ	cond:je/tu
jouerai(t)	ʒuʁɛ	cond:il
jouerion(s)	ʒuʁjɔ̃	cond:nous
jouerie(z)	ʒuʁje	cond:vous
jouerai(ent)	ʒuʁɛ	cond:ils
>marche(r)	maʁʃe	v	1
march(e)	maʁʃ	pr:je/il
march(es)	maʁʃ	pr:tu
march(ent)	maʁʃ	pr:ils
marchai(s)	maʁʃɛ	imp:je/tu
marchai(t)	maʁʃɛ	imp:il
marchion(s)	maʁʃjɔ̃	imp:nous
marchie(z)	maʁʃje	imp:vous
marchai(ent)	maʁʃɛ	imp:ils
marchon(s)	maʁʃɔ̃	pr:nous
marche(z)	maʁʃe	pr:vous
marchan(t)	maʁʃɑ̃	ppr
marché	maʁʃe	pp
marché(e)	maʁʃe	pp:f
marcherai	maʁʃəʁe	fut:je
marchera(s)	maʁʃəʁa	fut:tu
marchera	maʁʃəʁa	fut:il
marcheron(s)	maʁʃəʁɔ̃	fut:nous
marchere(z)	maʁʃəʁe	fut:vous
marcheron(t)	maʁʃəʁɔ̃	fut:ils
marcherai(s)	maʁʃəʁɛ	cond:je/tu
marcherai(t)	maʁʃəʁɛ	cond:il
marcherion(s)	maʁʃəʁjɔ̃	cond:nous
marcherie(z)	maʁʃəʁje	cond:vous
marcherai(ent)	maʁʃəʁɛ	cond:ils
>commence(r)	kɔmɑ̃se	v	1
commenc(e)	kɔmɑ̃s	pr:je/il
commenc(es)	kɔmɑ̃s	pr:tu
commenc(ent)	kɔmɑ̃s	pr:ils
commençai(s)	kɔmɑ̃sɛ	imp:je/tu
commençai(t)	kɔmɑ̃sɛ	imp:il
commencion(s)	kɔmɑ̃sjɔ̃	imp:nous
commencie(z)	kɔmɑ̃sje	imp:vous
commençai(ent)	kɔmɑ̃sɛ	imp:ils
commençon(s)	kɔmɑ̃sɔ̃	pr:nous
commence(z)	kɔmɑ̃se	pr:vous
commençan(t)	kɔmɑ̃sɑ̃	ppr
commencé	kɔmɑ̃se	pp
commencé(e)	kɔmɑ̃se	pp:f
commencerai	kɔmɑ̃sʁe	fut:je
commencera(s)	kɔmɑ̃sʁa	fut:tu
commencera	kɔmɑ̃sʁa	fut:il
commenceron(s)	kɔmɑ̃sʁɔ̃	fut:nous
commencere(z)	kɔmɑ̃sʁe	fut:vous
commenceron(t)	kɔmɑ̃sʁɔ̃	fut:ils
commencerai(s)	kɔmɑ̃sʁɛ	cond:je/tu
commencerai(t)	kɔmɑ̃sʁɛ	cond:il
commencerion(s)	kɔmɑ̃səʁjɔ̃	cond:nous
commencerie(z)	kɔmɑ̃səʁje	cond:vous
commencerai(ent)	kɔmɑ̃sʁɛ	cond:ils
>continue(r)	kɔ̃tinɥe	v	1
continu(e)	kɔ̃tiny	pr:je/il
continu(es)	kɔ̃tiny	pr:tu
continu(ent)	kɔ̃tiny	pr:ils
continuai(s)	kɔ̃tinɥɛ	imp:je/tu
continuai(t)	kɔ̃tinɥɛ	imp:il
continuion(s)	kɔ̃tinɥjɔ̃	imp:nous
continuie(z)	kɔ̃tinɥje	imp:vous
continuai(ent)	kɔ̃tinɥɛ	imp:ils
continuon(s)	kɔ̃tinɥɔ̃	pr:nous
continue(z)	kɔ̃tinɥe	pr:vous
continuan(t)	kɔ̃tinɥɑ̃	ppr
continué	kɔ̃tinɥe	pp
continué(e)	kɔ̃tinɥe	pp:f
continuerai	kɔ̃tinyʁe	fut:je
continuera(s)	kɔ̃tinyʁa	fut:tu
continuera	kɔ̃tinyʁa	fut:il
continueron(s)	kɔ̃tinyʁɔ̃	fut:nous
continuere(z)	kɔ̃tinyʁe	fut:vous
continueron(t)	kɔ̃tinyʁɔ̃	fut:ils
continuerai(s)	kɔ̃tinyʁɛ	cond:je/tu
continuerai(t)	kɔ̃tinyʁɛ	cond:il
continuerion(s)	kɔ̃tinyʁjɔ̃	cond:nous
continuerie(z)	kɔ̃tinyʁje	cond:vous
continuerai(ent)	kɔ̃tinyʁɛ	cond:ils
>termine(r)	tɛʁmine	v	1
termin(e)	tɛʁmin	pr:je/il
termin(es)	tɛʁmin	pr:tu
termin(ent)	tɛʁmin	pr:ils
terminai(s)	tɛʁminɛ	imp:je/tu
terminai(t)	tɛʁminɛ	imp:il
terminion(s)	tɛʁminjɔ̃	imp:nous
terminie(z)	tɛʁminje	imp:vous
terminai(ent)	tɛʁminɛ	imp:ils
terminon(s)	tɛʁminɔ̃	pr:nous
termine(z)	tɛʁmine	pr:vous
terminan(t)	tɛʁminɑ̃	ppr
terminé	tɛʁmine	pp
terminé(e)	tɛʁmine	pp:f
terminerai	tɛʁminʁe	fut:je
terminera(s)	tɛʁminʁa	fut:tu
terminera	tɛʁminʁa	fut:il
termineron(s)	tɛʁminʁɔ̃	fut:nous
terminere(z)	tɛʁminʁe	fut:vous
termineron(t)	tɛʁminʁɔ̃	fut:ils
terminerai(s)	tɛʁminʁɛ	cond:je/tu
terminerai(t)	tɛʁminʁɛ	cond:il
terminerion(s)	tɛʁminəʁjɔ̃	cond:nous
terminerie(z)	tɛʁminəʁje	cond:vous
terminerai(ent)	tɛʁminʁɛ	cond:ils
>arrête(r)	aʁɛte	v	1
arrêt(e)	aʁɛt	pr:je/il
arrêt(es)	aʁɛt	pr:tu
arrêt(ent)	aʁɛt	pr:ils
arrêtai(s)	aʁɛtɛ	imp:je/tu
arrêtai(t)	aʁɛtɛ	imp:il
arrêtion(s)	aʁɛtjɔ̃	imp:nous
arrêtie(z)	aʁɛtje	imp:vous
arrêtai(ent)	aʁɛtɛ	imp:ils
arrêton(s)	aʁɛtɔ̃	pr:nous
arrête(z)	aʁɛte	pr:vous
arrêtan(t)	aʁɛtɑ̃	ppr
arrêté	aʁɛte	pp
arrêté(e)	aʁɛte	pp:f
arrêterai	aʁɛtʁe	fut:je
arrêtera(s)	aʁɛtʁa	fut:tu
arrêtera	aʁɛtʁa	fut:il
arrêteron(s)	aʁɛtʁɔ̃	fut:nous
arrêtere(z)	aʁɛtʁe	fut:vous
arrêteron(t)	aʁɛtʁɔ̃	fut:ils
arrêterai(s)	aʁɛtʁɛ	cond:je/tu
arrêterai(t)	aʁɛtʁɛ	cond:il
arrêterion(s)	aʁɛtəʁjɔ̃	cond:nous
arrêterie(z)	aʁɛtəʁje	cond:vous
arrêterai(ent)	aʁɛtʁɛ	cond:ils
>ferme(r)	fɛʁme	v	1
ferm(e)	fɛʁm	pr:je/il
ferm(es)	fɛʁm	pr:tu
ferm(ent)	fɛʁm	pr:ils
fermai(s)	fɛʁmɛ	imp:je/tu
fermai(t)	fɛʁmɛ	imp:il
fermion(s)	fɛʁmjɔ̃	imp:nous
fermie(z)	fɛʁmje	imp:vous
fermai(ent)	fɛʁmɛ	imp:ils
fermon(s)	fɛʁmɔ̃	pr:nous
ferme(z)	fɛʁme	pr:vous
ferman(t)	fɛʁmɑ̃	ppr
fermé	fɛʁme	pp
fermé(e)	fɛʁme	pp:f
fermerai	fɛʁməʁe	fut:je
fermera(s)	fɛʁməʁa	fut:tu
fermera	fɛʁməʁa	fut:il
fermeron(s)	fɛʁməʁɔ̃	fut:nous
fermere(z)	fɛʁməʁe	fut:vous
fermeron(t)	fɛʁməʁɔ̃	fut:ils
fermerai(s)	fɛʁməʁɛ	cond:je/tu
fermerai(t)	fɛʁməʁɛ	cond:il
fermerion(s)	fɛʁməʁjɔ̃	cond:nous
fermerie(z)	fɛʁməʁje	cond:vous
fermerai(ent)	fɛʁməʁɛ	cond:ils
>allume(r)	alyme	v	1
allum(e)	alym	pr:je/il
allum(es)	alym	pr:tu
allum(ent)	alym	pr:ils
allumai(s)	alymɛ	imp:je/tu
allumai(t)	alymɛ	imp:il
allumion(s)	alymjɔ̃	imp:nous
allumie(z)	alymje	imp:vous
allumai(ent)	alymɛ	imp:ils
allumon(s)	alymɔ̃	pr:nous
allume(z)	alyme	pr:vous
alluman(t)	alymɑ̃	ppr
allumé	alyme	pp
allumé(e)	alyme	pp:f
allumerai	alymʁe	fut:je
allumera(s)	alymʁa	fut:tu
allumera	alymʁa	fut:il
allumeron(s)	alymʁɔ̃	fut:nous
allumere(z)	alymʁe	fut:vous
allumeron(t)	alymʁɔ̃	fut:ils
allumerai(s)	alymʁɛ	cond:je/tu
allumerai(t)	alymʁɛ	cond:il
allumerion(s)	alyməʁjɔ̃	cond:nous
allumerie(z)	alyməʁje	cond:vous
allumerai(ent)	alymʁɛ	cond:ils
>garde(r)	gaʁde	v	1
gard(e)	gaʁd	pr:je/il
gard(es)	gaʁd	pr:tu
gard(ent)	gaʁd	pr:ils
gardai(s)	gaʁdɛ	imp:je/tu
gardai(t)	gaʁdɛ	imp:il
gardion(s)	gaʁdjɔ̃	imp:nous
gardie(z)	gaʁdje	imp:vous
gardai(ent)	gaʁdɛ	imp:ils
gardon(s)	gaʁdɔ̃	pr:nous
garde(z)	gaʁde	pr:vous
gardan(t)	gaʁdɑ̃	ppr
gardé	gaʁde	pp
gardé(e)	gaʁde	pp:f
garderai	gaʁdəʁe	fut:je
gardera(s)	gaʁdəʁa	fut:tu
gardera	gaʁdəʁa	fut:il
garderon(s)	gaʁdəʁɔ̃	fut:nous
gardere(z)	gaʁdəʁe	fut:vous
garderon(t)	gaʁdəʁɔ̃	fut:ils
garderai(s)	gaʁdəʁɛ	cond:je/tu
garderai(t)	gaʁdəʁɛ	cond:il
garderion(s)	gaʁdəʁjɔ̃	cond:nous
garderie(z)	gaʁdəʁje	cond:vous
garderai(ent)	gaʁdəʁɛ	cond:ils
>oublie(r)	ublije	v	1
oubli(e)	ubli	pr:je/il
oubli(es)	ubli	pr:tu
oubli(ent)	ubli	pr:ils
oubliai(s)	ublijɛ	imp:je/tu
oubliai(t)	ublijɛ	imp:il
oubliion(s)	ublijjɔ̃	imp:nous
oubliie(z)	ublijje	imp:vous
oubliai(ent)	ublijɛ	imp:ils
oublion(s)	ublijɔ̃	pr:nous
oublie(z)	ublije	pr:vous
oublian(t)	ublijɑ̃	ppr
oublié	ublije	pp
oublié(e)	ublije	pp:f
oublierai	ubliʁe	fut:je
oubliera(s)	ubliʁa	fut:tu
oubliera	ubliʁa	fut:il
oublieron(s)	ubliʁɔ̃	fut:nous
oubliere(z)	ubliʁe	fut:vous
oublieron(t)	ubliʁɔ̃	fut:ils
oublierai(s)	ubliʁɛ	cond:je/tu
oublierai(t)	ubliʁɛ	cond:il
oublierion(s)	ubliʁjɔ̃	cond:nous
oublierie(z)	ubliʁje	cond:vous
oublierai(ent)	ubliʁɛ	cond:ils
>rappele(r)	ʁaple	v	1
rappell(e)	ʁapɛl	pr:je/il
rappell(es)	ʁapɛl	pr:tu
rappell(ent)	ʁapɛl	pr:ils
rappelai(s)	ʁaplɛ	imp:je/tu
rappelai(t)	ʁaplɛ	imp:il
rappelion(s)	ʁaplijɔ̃	imp:nous
rappelie(z)	ʁaplije	imp:vous
rappelai(ent)	ʁaplɛ	imp:ils
rappelon(s)	ʁaplɔ̃	pr:nous
rappele(z)	ʁaple	pr:vous
rappelan(t)	ʁaplɑ̃	ppr
rappelé	ʁaple	pp
rappelé(e)	ʁaple	pp:f
rappellerai	ʁapɛlʁe	fut:je
rappellera(s)	ʁapɛlʁa	fut:tu
rappellera	ʁapɛlʁa	fut:il
rappelleron(s)	ʁapɛlʁɔ̃	fut:nous
rappellere(z)	ʁapɛlʁe	fut:vous
rappelleron(t)	ʁapɛlʁɔ̃	fut:ils
rappellerai(s)	ʁapɛlʁɛ	cond:je/tu
rappellerai(t)	ʁapɛlʁɛ	cond:il
rappellerion(s)	ʁapɛləʁjɔ̃	cond:nous
rappellerie(z)	ʁapɛləʁje	cond:vous
rappellerai(ent)	ʁapɛlʁɛ	cond:ils
>appele(r)	aple	v	1
appell(e)	apɛl	pr:je/il
appell(es)	apɛl	pr:tu
appell(ent)	apɛl	pr:ils
appelai(s)	aplɛ	imp:je/tu
appelai(t)	aplɛ	imp:il
appelion(s)	aplijɔ̃	imp:nous
appelie(z)	aplije	imp:vous
appelai(ent)	aplɛ	imp:ils
appelon(s)	aplɔ̃	pr:nous
appele(z)	aple	pr:vous
appelan(t)	aplɑ̃	ppr
appelé	aple	pp
appelé(e)	aple	pp:f
appellerai	apɛlʁe	fut:je
appellera(s)	apɛlʁa	fut:tu
appellera	apɛlʁa	fut:il
appelleron(s)	apɛlʁɔ̃	fut:nous
appellere(z)	apɛlʁe	fut:vous
appelleron(t)	apɛlʁɔ̃	fut:ils
appellerai(s)	apɛlʁɛ	cond:je/tu
appellerai(t)	apɛlʁɛ	cond:il
appellerion(s)	apɛləʁjɔ̃	cond:nous
appellerie(z)	apɛləʁje	cond:vous
appellerai(ent)	apɛlʁɛ	cond:ils
>achete(r)	aʃte	v	1
achèt(e)	aʃɛt	pr:je/il
achèt(es)	aʃɛt	pr:tu
achèt(ent)	aʃɛt	pr:ils
achetai(s)	aʃtɛ	imp:je/tu
achetai(t)	aʃtɛ	imp:il
achetion(s)	aʃtjɔ̃	imp:nous
achetie(z)	aʃtje	imp:vous
achetai(ent)	aʃtɛ	imp:ils
acheton(s)	aʃtɔ̃	pr:nous
achete(z)	aʃte	pr:vous
achetan(t)	aʃtɑ̃	ppr
acheté	aʃte	pp
acheté(e)	aʃte	pp:f
achèterai	aʃɛtʁe	fut:je
achètera(s)	aʃɛtʁa	fut:tu
achètera	aʃɛtʁa	fut:il
achèteron(s)	aʃɛtʁɔ̃	fut:nous
achètere(z)	aʃɛtʁe	fut:vous
achèteron(t)	aʃɛtʁɔ̃	fut:ils
achèterai(s)	aʃɛtʁɛ	cond:je/tu
achèterai(t)	aʃɛtʁɛ	cond:il
achèterion(s)	aʃɛtəʁjɔ̃	cond:nous
achèterie(z)	aʃɛtəʁje	cond:vous
achèterai(ent)	aʃɛtʁɛ	cond:ils
>leve(r)	ləve	v	1
lèv(e)	lɛv	pr:je/il
lèv(es)	lɛv	pr:tu
lèv(ent)	lɛv	pr:ils
levai(s)	ləvɛ	imp:je/tu
levai(t)	ləvɛ	imp:il
levion(s)	ləvjɔ̃	imp:nous
levie(z)	ləvje	imp:vous
levai(ent)	ləvɛ	imp:ils
levon(s)	ləvɔ̃	pr:nous
leve(z)	ləve	pr:vous
levan(t)	ləvɑ̃	ppr
levé	ləve	pp
levé(e)	ləve	pp:f
lèverai	lɛvʁe	fut:je
lèvera(s)	lɛvʁa	fut:tu
lèvera	lɛvʁa	fut:il
lèveron(s)	lɛvʁɔ̃	fut:nous
lèvere(z)	lɛvʁe	fut:vous
lèveron(t)	lɛvʁɔ̃	fut:ils
lèverai(s)	lɛvʁɛ	cond:je/tu
lèverai(t)	lɛvʁɛ	cond:il
lèverion(s)	lɛvəʁjɔ̃	cond:nous
lèverie(z)	lɛvəʁje	cond:vous
lèverai(ent)	lɛvʁɛ	cond:ils
>enleve(r)	ɑ̃lve	v	1
enlèv(e)	ɑ̃lɛv	pr:je/il
enlèv(es)	ɑ̃lɛv	pr:tu
enlèv(ent)	ɑ̃lɛv	pr:ils
enlevai(s)	ɑ̃lvɛ	imp:je/tu
enlevai(t)	ɑ̃lvɛ	imp:il
enlevion(s)	ɑ̃lvjɔ̃	imp:nous
enlevie(z)	ɑ̃lvje	imp:vous
enlevai(ent)	ɑ̃lvɛ	imp:ils
enlevon(s)	ɑ̃lvɔ̃	pr:nous
enleve(z)	ɑ̃lve	pr:vous
enlevan(t)	ɑ̃lvɑ̃	ppr
enlevé	ɑ̃lve	pp
enlevé(e)	ɑ̃lve	pp:f
enlèverai	ɑ̃lɛvʁe	fut:je
enlèvera(s)	ɑ̃lɛvʁa	fut:tu
enlèvera	ɑ̃lɛvʁa	fut:il
enlèveron(s)	ɑ̃lɛvʁɔ̃	fut:nous
enlèvere(z)	ɑ̃lɛvʁe	fut:vous
enlèveron(t)	ɑ̃lɛvʁɔ̃	fut:ils
enlèverai(s)	ɑ̃lɛvʁɛ	cond:je/tu
enlèverai(t)	ɑ̃lɛvʁɛ	cond:il
enlèverion(s)	ɑ̃lɛvəʁjɔ̃	cond:nous
enlèverie(z)	ɑ̃lɛvəʁje	cond:vous
enlèverai(ent)	ɑ̃lɛvʁɛ	cond:ils
>emmene(r)	ɑ̃mne	v	1
emmèn(e)	ɑ̃mɛn	pr:je/il
emmèn(es)	ɑ̃mɛn	pr:tu
emmèn(ent)	ɑ̃mɛn	pr:ils
emmenai(s)	ɑ̃mnɛ	imp:je/tu
emmenai(t)	ɑ̃mnɛ	imp:il
emmenion(s)	ɑ̃mnjɔ̃	imp:nous
emmenie(z)	ɑ̃mnje	imp:vous
emmenai(ent)	ɑ̃mnɛ	imp:ils
emmenon(s)	ɑ̃mnɔ̃	pr:nous
emmene(z)	ɑ̃mne	pr:vous
emmenan(t)	ɑ̃mnɑ̃	ppr
emmené	ɑ̃mne	pp
emmené(e)	ɑ̃mne	pp:f
emmènerai	ɑ̃mɛnʁe	fut:je
emmènera(s)	ɑ̃mɛnʁa	fut:tu
emmènera	ɑ̃mɛnʁa	fut:il
emmèneron(s)	ɑ̃mɛnʁɔ̃	fut:nous
emmènere(z)	ɑ̃mɛnʁe	fut:vous
emmèneron(t)	ɑ̃mɛnʁɔ̃	fut:ils
emmènerai(s)	ɑ̃mɛnʁɛ	cond:je/tu
emmènerai(t)	ɑ̃mɛnʁɛ	cond:il
emmènerion(s)	ɑ̃mɛnəʁjɔ̃	cond:nous
emmènerie(z)	ɑ̃mɛnəʁje	cond:vous
emmènerai(ent)	ɑ̃mɛnʁɛ	cond:ils
>amene(r)	amne	v	1
amèn(e)	amɛn	pr:je/il
amèn(es)	amɛn	pr:tu
amèn(ent)	amɛn	pr:ils
amenai(s)	amnɛ	imp:je/tu
amenai(t)	amnɛ	imp:il
amenion(s)	amnjɔ̃	imp:nous
amenie(z)	amnje	imp:vous
amenai(ent)	amnɛ	imp:ils
amenon(s)	amnɔ̃	pr:nous
amene(z)	amne	pr:vous
amenan(t)	amnɑ̃	ppr
amené	amne	pp
amené(e)	amne	pp:f
amènerai	amɛnʁe	fut:je
amènera(s)	amɛnʁa	fut:tu
amènera	amɛnʁa	fut:il
amèneron(s)	amɛnʁɔ̃	fut:nous
amènere(z)	amɛnʁe	fut:vous
amèneron(t)	amɛnʁɔ̃	fut:ils
amènerai(s)	amɛnʁɛ	cond:je/tu
amènerai(t)	amɛnʁɛ	cond:il
amènerion(s)	amɛnəʁjɔ̃	cond:nous
amènerie(z)	amɛnəʁje	cond:vous
amènerai(ent)	amɛnʁɛ	cond:ils
>promene(r)	pʁɔmne	v	1
promèn(e)	pʁɔmɛn	pr:je/il
promèn(es)	pʁɔmɛn	pr:tu
promèn(ent)	pʁɔmɛn	pr:ils
promenai(s)	pʁɔmnɛ	imp:je/tu
promenai(t)	pʁɔmnɛ	imp:il
promenion(s)	pʁɔmnjɔ̃	imp:nous
promenie(z)	pʁɔmnje	imp:vous
promenai(ent)	pʁɔmnɛ	imp:ils
promenon(s)	pʁɔmnɔ̃	pr:nous
promene(z)	pʁɔmne	pr:vous
promenan(t)	pʁɔmnɑ̃	ppr
promené	pʁɔmne	pp
promené(e)	pʁɔmne	pp:f
promènerai	pʁɔmɛnʁe	fut:je
promènera(s)	pʁɔmɛnʁa	fut:tu
promènera	pʁɔmɛnʁa	fut:il
promèneron(s)	pʁɔmɛnʁɔ̃	fut:nous
promènere(z)	pʁɔmɛnʁe	fut:vous
promèneron(t)	pʁɔmɛnʁɔ̃	fut:ils
promènerai(s)	pʁɔmɛnʁɛ	cond:je/tu
promènerai(t)	pʁɔmɛnʁɛ	cond:il
promènerion(s)	pʁɔmɛnəʁjɔ̃	cond:nous
promènerie(z)	pʁɔmɛnəʁje	cond:vous
promènerai(ent)	pʁɔmɛnʁɛ	cond:ils
>préfére(r)	pʁefeʁe	v	1
préfèr(e)	pʁefɛʁ	pr:je/il
préfèr(es)	pʁefɛʁ	pr:tu
préfèr(ent)	pʁefɛʁ	pr:ils
préférai(s)	pʁefeʁɛ	imp:je/tu
préférai(t)	pʁefeʁɛ	imp:il
préférion(s)	pʁefeʁjɔ̃	imp:nous
préférie(z)	pʁefeʁje	imp:vous
préférai(ent)	pʁefeʁɛ	imp:ils
préféron(s)	pʁefeʁɔ̃	pr:nous
préfére(z)	pʁefeʁe	pr:vous
préféran(t)	pʁefeʁɑ̃	ppr
préféré	pʁefeʁe	pp
préféré(e)	pʁefeʁe	pp:f
préférerai	pʁefeʁʁe	fut:je
préférera(s)	pʁefeʁʁa	fut:tu
préférera	pʁefeʁʁa	fut:il
préféreron(s)	pʁefeʁʁɔ̃	fut:nous
préférere(z)	pʁefeʁʁe	fut:vous
préféreron(t)	pʁefeʁʁɔ̃	fut:ils
préférerai(s)	pʁefeʁʁɛ	cond:je/tu
préférerai(t)	pʁefeʁʁɛ	cond:il
préférerion(s)	pʁefeʁəʁjɔ̃	cond:nous
préférerie(z)	pʁefeʁəʁje	cond:vous
préférerai(ent)	pʁefeʁʁɛ	cond:ils
>espére(r)	ɛspeʁe	v	1
espèr(e)	ɛspɛʁ	pr:je/il
espèr(es)	ɛspɛʁ	pr:tu
espèr(ent)	ɛspɛʁ	pr:ils
espérai(s)	ɛspeʁɛ	imp:je/tu
espérai(t)	ɛspeʁɛ	imp:il
espérion(s)	ɛspeʁjɔ̃	imp:nous
espérie(z)	ɛspeʁje	imp:vous
espérai(ent)	ɛspeʁɛ	imp:ils
espéron(s)	ɛspeʁɔ̃	pr:nous
espére(z)	ɛspeʁe	pr:vous
espéran(t)	ɛspeʁɑ̃	ppr
espéré	ɛspeʁe	pp
espéré(e)	ɛspeʁe	pp:f
espérerai	ɛspeʁʁe	fut:je
espérera(s)	ɛspeʁʁa	fut:tu
espérera	ɛspeʁʁa	fut:il
espéreron(s)	ɛspeʁʁɔ̃	fut:nous
espérere(z)	ɛspeʁʁe	fut:vous
espéreron(t)	ɛspeʁʁɔ̃	fut:ils
espérerai(s)	ɛspeʁʁɛ	cond:je/tu
espérerai(t)	ɛspeʁʁɛ	cond:il
espérerion(s)	ɛspeʁəʁjɔ̃	cond:nous
espérerie(z)	ɛspeʁəʁje	cond:vous
espérerai(ent)	ɛspeʁʁɛ	cond:ils
>répéte(r)	ʁepete	v	1
répèt(e)	ʁepɛt	pr:je/il
répèt(es)	ʁepɛt	pr:tu
répèt(ent)	ʁepɛt	pr:ils
répétai(s)	ʁepetɛ	imp:je/tu
répétai(t)	ʁepetɛ	imp:il
répétion(s)	ʁepetjɔ̃	imp:nous
répétie(z)	ʁepetje	imp:vous
répétai(ent)	ʁepetɛ	imp:ils
répéton(s)	ʁepetɔ̃	pr:nous
répéte(z)	ʁepete	pr:vous
répétan(t)	ʁepetɑ̃	ppr
répété	ʁepete	pp
répété(e)	ʁepete	pp:f
répéterai	ʁepetʁe	fut:je
répétera(s)	ʁepetʁa	fut:tu
répétera	ʁepetʁa	fut:il
répéteron(s)	ʁepetʁɔ̃	fut:nous
répétere(z)	ʁepetʁe	fut:vous
répéteron(t)	ʁepetʁɔ̃	fut:ils
répéterai(s)	ʁepetʁɛ	cond:je/tu
répéterai(t)	ʁepetʁɛ	cond:il
répéterion(s)	ʁepetəʁjɔ̃	cond:nous
répéterie(z)	ʁepetəʁje	cond:vous
répéterai(ent)	ʁepetʁɛ	cond:ils
>paye(r)	peje	v	1
paie	pɛ	pr:je/il
paie(s)	pɛ	pr:tu
pai(ent)	pɛ	pr:ils
payai(s)	pejɛ	imp:je/tu
payai(t)	pejɛ	imp:il
payion(s)	pejjɔ̃	imp:nous
payie(z)	pejje	imp:vous
payai(ent)	pejɛ	imp:ils
payon(s)	pejɔ̃	pr:nous
paye(z)	peje	pr:vous
payan(t)	pejɑ̃	ppr
payé	peje	pp
payé(e)	peje	pp:f
paierai	pɛʁe	fut:je
paiera(s)	pɛʁa	fut:tu
paiera	pɛʁa	fut:il
paieron(s)	pɛʁɔ̃	fut:nous
paiere(z)	pɛʁe	fut:vous
paieron(t)	pɛʁɔ̃	fut:ils
paierai(s)	pɛʁɛ	cond:je/tu
paierai(t)	pɛʁɛ	cond:il
paierion(s)	pɛʁjɔ̃	cond:nous
paierie(z)	pɛʁje	cond:vous
paierai(ent)	pɛʁɛ	cond:ils
>essaye(r)	eseje	v	1
essaie	esɛ	pr:je/il
essaie(s)	esɛ	pr:tu
essai(ent)	esɛ	pr:ils
essayai(s)	esejɛ	imp:je/tu
essayai(t)	esejɛ	imp:il
essayion(s)	esejjɔ̃	imp:nous
essayie(z)	esejje	imp:vous
essayai(ent)	esejɛ	imp:ils
essayon(s)	esejɔ̃	pr:nous
essaye(z)	eseje	pr:vous
essayan(t)	esejɑ̃	ppr
essayé	eseje	pp
essayé(e)	eseje	pp:f
essaierai	esɛʁe	fut:je
essaiera(s)	esɛʁa	fut:tu
essaiera	esɛʁa	fut:il
essaieron(s)	esɛʁɔ̃	fut:nous
essaiere(z)	esɛʁe	fut:vous
essaieron(t)	esɛʁɔ̃	fut:ils
essaierai(s)	esɛʁɛ	cond:je/tu
essaierai(t)	esɛʁɛ	cond:il
essaierion(s)	esɛʁjɔ̃	cond:nous
essaierie(z)	esɛʁje	cond:vous
essaierai(ent)	esɛʁɛ	cond:ils
>envoye(r)	ɑ̃vwaje	v	1
envoi(e)	ɑ̃vwa	pr:je/il
envoi(es)	ɑ̃vwa	pr:tu
envoi(ent)	ɑ̃vwa	pr:ils
envoyai(s)	ɑ̃vwajɛ	imp:je/tu
envoyai(t)	ɑ̃vwajɛ	imp:il
envoyion(s)	ɑ̃vwajjɔ̃	imp:nous
envoyie(z)	ɑ̃vwajje	imp:vous
envoyai(ent)	ɑ̃vwajɛ	imp:ils
envoyon(s)	ɑ̃vwajɔ̃	pr:nous
envoye(z)	ɑ̃vwaje	pr:vous
envoyan(t)	ɑ̃vwajɑ̃	ppr
envoyé	ɑ̃vwaje	pp
envoyé(e)	ɑ̃vwaje	pp:f
enverrai	ɑ̃vɛʁe	fut:je
enverra(s)	ɑ̃vɛʁa	fut:tu
enverra	ɑ̃vɛʁa	fut:il
enverron(s)	ɑ̃vɛʁɔ̃	fut:nous
enverre(z)	ɑ̃vɛʁe	fut:vous
enverron(t)	ɑ̃vɛʁɔ̃	fut:ils
enverrai(s)	ɑ̃vɛʁɛ	cond:je/tu
enverrai(t)	ɑ̃vɛʁɛ	cond:il
enverrion(s)	ɑ̃vɛʁjɔ̃	cond:nous
enverrie(z)	ɑ̃vɛʁje	cond:vous
enverrai(ent)	ɑ̃vɛʁɛ	cond:ils
>nettoye(r)	netwaje	v	1
nettoi(e)	netwa	pr:je/il
nettoi(es)	netwa	pr:tu
nettoi(ent)	netwa	pr:ils
nettoyai(s)	netwajɛ	imp:je/tu
nettoyai(t)	netwajɛ	imp:il
nettoyion(s)	netwajjɔ̃	imp:nous
nettoyie(z)	netwajje	imp:vous
nettoyai(ent)	netwajɛ	imp:ils
nettoyon(s)	netwajɔ̃	pr:nous
nettoye(z)	netwaje	pr:vous
nettoyan(t)	netwajɑ̃	ppr
nettoyé	netwaje	pp
nettoyé(e)	netwaje	pp:f
nettoierai	netwaʁe	fut:je
nettoiera(s)	netwaʁa	fut:tu
nettoiera	netwaʁa	fut:il
nettoieron(s)	netwaʁɔ̃	fut:nous
nettoiere(z)	netwaʁe	fut:vous
nettoieron(t)	netwaʁɔ̃	fut:ils
nettoierai(s)	netwaʁɛ	cond:je/tu
nettoierai(t)	netwaʁɛ	cond:il
nettoierion(s)	netwaʁjɔ̃	cond:nous
nettoierie(z)	netwaʁje	cond:vous
nettoierai(ent)	netwaʁɛ	cond:ils
>jete(r)	ʒəte	v	1
jett(e)	ʒɛt	pr:je/il
jett(es)	ʒɛt	pr:tu
jett(ent)	ʒɛt	pr:ils
jetai(s)	ʒətɛ	imp:je/tu
jetai(t)	ʒətɛ	imp:il
jetion(s)	ʒətjɔ̃	imp:nous
jetie(z)	ʒətje	imp:vous
jetai(ent)	ʒətɛ	imp:ils
jeton(s)	ʒətɔ̃	pr:nous
jete(z)	ʒəte	pr:vous
jetan(t)	ʒətɑ̃	ppr
jeté	ʒəte	pp
jeté(e)	ʒəte	pp:f
jetterai	ʒɛtʁe	fut:je
jettera(s)	ʒɛtʁa	fut:tu
jettera	ʒɛtʁa	fut:il
jetteron(s)	ʒɛtʁɔ̃	fut:nous
jettere(z)	ʒɛtʁe	fut:vous
jetteron(t)	ʒɛtʁɔ̃	fut:ils
jetterai(s)	ʒɛtʁɛ	cond:je/tu
jetterai(t)	ʒɛtʁɛ	cond:il
jetterion(s)	ʒɛtəʁjɔ̃	cond:nous
jetterie(z)	ʒɛtəʁje	cond:vous
jetterai(ent)	ʒɛtʁɛ	cond:ils
>change(r)	ʃɑ̃ʒe	v	1
chang(e)	ʃɑ̃ʒ	pr:je/il
chang(es)	ʃɑ̃ʒ	pr:tu
chang(ent)	ʃɑ̃ʒ	pr:ils
changeai(s)	ʃɑ̃ʒɛ	imp:je/tu
changeai(t)	ʃɑ̃ʒɛ	imp:il
changion(s)	ʃɑ̃ʒjɔ̃	imp:nous
changie(z)	ʃɑ̃ʒje	imp:vous
changeai(ent)	ʃɑ̃ʒɛ	imp:ils
changeon(s)	ʃɑ̃ʒɔ̃	pr:nous
change(z)	ʃɑ̃ʒe	pr:vous
changean(t)	ʃɑ̃ʒɑ̃	ppr
changé	ʃɑ̃ʒe	pp
changé(e)	ʃɑ̃ʒe	pp:f
changerai	ʃɑ̃ʒʁe	fut:je
changera(s)	ʃɑ̃ʒʁa	fut:tu
changera	ʃɑ̃ʒʁa	fut:il
changeron(s)	ʃɑ̃ʒʁɔ̃	fut:nous
changere(z)	ʃɑ̃ʒʁe	fut:vous
changeron(t)	ʃɑ̃ʒʁɔ̃	fut:ils
changerai(s)	ʃɑ̃ʒʁɛ	cond:je/tu
changerai(t)	ʃɑ̃ʒʁɛ	cond:il
changerion(s)	ʃɑ̃ʒəʁjɔ̃	cond:nous
changerie(z)	ʃɑ̃ʒəʁje	cond:vous
changerai(ent)	ʃɑ̃ʒʁɛ	cond:ils
>voyage(r)	vwajaʒe	v	1
voyag(e)	vwajaʒ	pr:je/il
voyag(es)	vwajaʒ	pr:tu
voyag(ent)	vwajaʒ	pr:ils
voyageai(s)	vwajaʒɛ	imp:je/tu
voyageai(t)	vwajaʒɛ	imp:il
voyagion(s)	vwajaʒjɔ̃	imp:nous
voyagie(z)	vwajaʒje	imp:vous
voyageai(ent)	vwajaʒɛ	imp:ils
voyageon(s)	vwajaʒɔ̃	pr:nous
voyage(z)	vwajaʒe	pr:vous
voyagean(t)	vwajaʒɑ̃	ppr
voyagé	vwajaʒe	pp
voyagé(e)	vwajaʒe	pp:f
voyagerai	vwajaʒʁe	fut:je
voyagera(s)	vwajaʒʁa	fut:tu
voyagera	vwajaʒʁa	fut:il
voyageron(s)	vwajaʒʁɔ̃	fut:nous
voyagere(z)	vwajaʒʁe	fut:vous
voyageron(t)	vwajaʒʁɔ̃	fut:ils
voyagerai(s)	vwajaʒʁɛ	cond:je/tu
voyagerai(t)	vwajaʒʁɛ	cond:il
voyagerion(s)	vwajaʒəʁjɔ̃	cond:nous
voyagerie(z)	vwajaʒəʁje	cond:vous
voyagerai(ent)	vwajaʒʁɛ	cond:ils
>range(r)	ʁɑ̃ʒe	v	1
rang(e)	ʁɑ̃ʒ	pr:je/il
rang(es)	ʁɑ̃ʒ	pr:tu
rang(ent)	ʁɑ̃ʒ	pr:ils
rangeai(s)	ʁɑ̃ʒɛ	imp:je/tu
rangeai(t)	ʁɑ̃ʒɛ	imp:il
rangion(s)	ʁɑ̃ʒjɔ̃	imp:nous
rangie(z)	ʁɑ̃ʒje	imp:vous
rangeai(ent)	ʁɑ̃ʒɛ	imp:ils
rangeon(s)	ʁɑ̃ʒɔ̃	pr:nous
range(z)	ʁɑ̃ʒe	pr:vous
rangean(t)	ʁɑ̃ʒɑ̃	ppr
rangé	ʁɑ̃ʒe	pp
rangé(e)	ʁɑ̃ʒe	pp:f
rangerai	ʁɑ̃ʒʁe	fut:je
rangera(s)	ʁɑ̃ʒʁa	fut:tu
rangera	ʁɑ̃ʒʁa	fut:il
rangeron(s)	ʁɑ̃ʒʁɔ̃	fut:nous
rangere(z)	ʁɑ̃ʒʁe	fut:vous
rangeron(t)	ʁɑ̃ʒʁɔ̃	fut:ils
rangerai(s)	ʁɑ̃ʒʁɛ	cond:je/tu
rangerai(t)	ʁɑ̃ʒʁɛ	cond:il
rangerion(s)	ʁɑ̃ʒəʁjɔ̃	cond:nous
rangerie(z)	ʁɑ̃ʒəʁje	cond:vous
rangerai(ent)	ʁɑ̃ʒʁɛ	cond:ils
>partage(r)	paʁtaʒe	v	1
partag(e)	paʁtaʒ	pr:je/il
partag(es)	paʁtaʒ	pr:tu
partag(ent)	paʁtaʒ	pr:ils
partageai(s)	paʁtaʒɛ	imp:je/tu
partageai(t)	paʁtaʒɛ	imp:il
partagion(s)	paʁtaʒjɔ̃	imp:nous
partagie(z)	paʁtaʒje	imp:vous
partageai(ent)	paʁtaʒɛ	imp:ils
partageon(s)	paʁtaʒɔ̃	pr:nous
partage(z)	paʁtaʒe	pr:vous
partagean(t)	paʁtaʒɑ̃	ppr
partagé	paʁtaʒe	pp
partagé(e)	paʁtaʒe	pp:f
partagerai	paʁtaʒʁe	fut:je
partagera(s)	paʁtaʒʁa	fut:tu
partagera	paʁtaʒʁa	fut:il
partageron(s)	paʁtaʒʁɔ̃	fut:nous
partagere(z)	paʁtaʒʁe	fut:vous
partageron(t)	paʁtaʒʁɔ̃	fut:ils
partagerai(s)	paʁtaʒʁɛ	cond:je/tu
partagerai(t)	paʁtaʒʁɛ	cond:il
partagerion(s)	paʁtaʒəʁjɔ̃	cond:nous
partagerie(z)	paʁtaʒəʁje	cond:vous
partagerai(ent)	paʁtaʒʁɛ	cond:ils
>bouge(r)	buʒe	v	1
boug(e)	buʒ	pr:je/il
boug(es)	buʒ	pr:tu
boug(ent)	buʒ	pr:ils
bougeai(s)	buʒɛ	imp:je/tu
bougeai(t)	buʒɛ	imp:il
bougion(s)	buʒjɔ̃	imp:nous
bougie(z)	buʒje	imp:vous
bougeai(ent)	buʒɛ	imp:ils
bougeon(s)	buʒɔ̃	pr:nous
bouge(z)	buʒe	pr:vous
bougean(t)	buʒɑ̃	ppr
bougé	buʒe	pp
bougé(e)	buʒe	pp:f
bougerai	buʒʁe	fut:je
bougera(s)	buʒʁa	fut:tu
bougera	buʒʁa	fut:il
bougeron(s)	buʒʁɔ̃	fut:nous
bougere(z)	buʒʁe	fut:vous
bougeron(t)	buʒʁɔ̃	fut:ils
bougerai(s)	buʒʁɛ	cond:je/tu
bougerai(t)	buʒʁɛ	cond:il
bougerion(s)	buʒəʁjɔ̃	cond:nous
bougerie(z)	buʒəʁje	cond:vous
bougerai(ent)	buʒʁɛ	cond:ils
>nage(r)	naʒe	v	1
nag(e)	naʒ	pr:je/il
nag(es)	naʒ	pr:tu
nag(ent)	naʒ	pr:ils
nageai(s)	naʒɛ	imp:je/tu
nageai(t)	naʒɛ	imp:il
nagion(s)	naʒjɔ̃	imp:nous
nagie(z)	naʒje	imp:vous
nageai(ent)	naʒɛ	imp:ils
nageon(s)	naʒɔ̃	pr:nous
nage(z)	naʒe	pr:vous
nagean(t)	naʒɑ̃	ppr
nagé	naʒe	pp
nagé(e)	naʒe	pp:f
nagerai	naʒʁe	fut:je
nagera(s)	naʒʁa	fut:tu
nagera	naʒʁa	fut:il
nageron(s)	naʒʁɔ̃	fut:nous
nagere(z)	naʒʁe	fut:vous
nageron(t)	naʒʁɔ̃	fut:ils
nagerai(s)	naʒʁɛ	cond:je/tu
nagerai(t)	naʒʁɛ	cond:il
nagerion(s)	naʒəʁjɔ̃	cond:nous
nagerie(z)	naʒəʁje	cond:vous
nagerai(ent)	naʒʁɛ	cond:ils
>dérange(r)	deʁɑ̃ʒe	v	1
dérang(e)	deʁɑ̃ʒ	pr:je/il
dérang(es)	deʁɑ̃ʒ	pr:tu
dérang(ent)	deʁɑ̃ʒ	pr:ils
dérangeai(s)	deʁɑ̃ʒɛ	imp:je/tu
dérangeai(t)	deʁɑ̃ʒɛ	imp:il
dérangion(s)	deʁɑ̃ʒjɔ̃	imp:nous
dérangie(z)	deʁɑ̃ʒje	imp:vous
dérangeai(ent)	deʁɑ̃ʒɛ	imp:ils
dérangeon(s)	deʁɑ̃ʒɔ̃	pr:nous
dérange(z)	deʁɑ̃ʒe	pr:vous
dérangean(t)	deʁɑ̃ʒɑ̃	ppr
dérangé	deʁɑ̃ʒe	pp
dérangé(e)	deʁɑ̃ʒe	pp:f
dérangerai	deʁɑ̃ʒʁe	fut:je
dérangera(s)	deʁɑ̃ʒʁa	fut:tu
dérangera	deʁɑ̃ʒʁa	fut:il
dérangeron(s)	deʁɑ̃ʒʁɔ̃	fut:nous
dérangere(z)	deʁɑ̃ʒʁe	fut:vous
dérangeron(t)	deʁɑ̃ʒʁɔ̃	fut:ils
dérangerai(s)	deʁɑ̃ʒʁɛ	cond:je/tu
dérangerai(t)	deʁɑ̃ʒʁɛ	cond:il
dérangerion(s)	deʁɑ̃ʒəʁjɔ̃	cond:nous
dérangerie(z)	deʁɑ̃ʒəʁje	cond:vous
dérangerai(ent)	deʁɑ̃ʒʁɛ	cond:ils
>place(r)	plase	v	1
plac(e)	plas	pr:je/il
plac(es)	plas	pr:tu
plac(ent)	plas	pr:ils
plaçai(s)	plasɛ	imp:je/tu
plaçai(t)	plasɛ	imp:il
placion(s)	plasjɔ̃	imp:nous
placie(z)	plasje	imp:vous
plaçai(ent)	plasɛ	imp:ils
plaçon(s)	plasɔ̃	pr:nous
place(z)	plase	pr:vous
plaçan(t)	plasɑ̃	ppr
placé	plase	pp
placé(e)	plase	pp:f
placerai	plasʁe	fut:je
placera(s)	plasʁa	fut:tu
placera	plasʁa	fut:il
placeron(s)	plasʁɔ̃	fut:nous
placere(z)	plasʁe	fut:vous
placeron(t)	plasʁɔ̃	fut:ils
placerai(s)	plasʁɛ	cond:je/tu
placerai(t)	plasʁɛ	cond:il
placerion(s)	plasəʁjɔ̃	cond:nous
placerie(z)	plasəʁje	cond:vous
placerai(ent)	plasʁɛ	cond:ils
>avance(r)	avɑ̃se	v	1
avanc(e)	avɑ̃s	pr:je/il
avanc(es)	avɑ̃s	pr:tu
avanc(ent)	avɑ̃s	pr:ils
avançai(s)	avɑ̃sɛ	imp:je/tu
avançai(t)	avɑ̃sɛ	imp:il
avancion(s)	avɑ̃sjɔ̃	imp:nous
avancie(z)	avɑ̃sje	imp:vous
avançai(ent)	avɑ̃sɛ	imp:ils
avançon(s)	avɑ̃sɔ̃	pr:nous
avance(z)	avɑ̃se	pr:vous
avançan(t)	avɑ̃sɑ̃	ppr
avancé	avɑ̃se	pp
avancé(e)	avɑ̃se	pp:f
avancerai	avɑ̃sʁe	fut:je
avancera(s)	avɑ̃sʁa	fut:tu
avancera	avɑ̃sʁa	fut:il
avanceron(s)	avɑ̃sʁɔ̃	fut:nous
avancere(z)	avɑ̃sʁe	fut:vous
avanceron(t)	avɑ̃sʁɔ̃	fut:ils
avancerai(s)	avɑ̃sʁɛ	cond:je/tu
avancerai(t)	avɑ̃sʁɛ	cond:il
avancerion(s)	avɑ̃səʁjɔ̃	cond:nous
avancerie(z)	avɑ̃səʁje	cond:vous
avancerai(ent)	avɑ̃sʁɛ	cond:ils
>lance(r)	lɑ̃se	v	1
lanc(e)	lɑ̃s	pr:je/il
lanc(es)	lɑ̃s	pr:tu
lanc(ent)	lɑ̃s	pr:ils
lançai(s)	lɑ̃sɛ	imp:je/tu
lançai(t)	lɑ̃sɛ	imp:il
lancion(s)	lɑ̃sjɔ̃	imp:nous
lancie(z)	lɑ̃sje	imp:vous
lançai(ent)	lɑ̃sɛ	imp:ils
lançon(s)	lɑ̃sɔ̃	pr:nous
lance(z)	lɑ̃se	pr:vous
lançan(t)	lɑ̃sɑ̃	ppr
lancé	lɑ̃se	pp
lancé(e)	lɑ̃se	pp:f
lancerai	lɑ̃sʁe	fut:je
lancera(s)	lɑ̃sʁa	fut:tu
lancera	lɑ̃sʁa	fut:il
lanceron(s)	lɑ̃sʁɔ̃	fut:nous
lancere(z)	lɑ̃sʁe	fut:vous
lanceron(t)	lɑ̃sʁɔ̃	fut:ils
lancerai(s)	lɑ̃sʁɛ	cond:je/tu
lancerai(t)	lɑ̃sʁɛ	cond:il
lancerion(s)	lɑ̃səʁjɔ̃	cond:nous
lancerie(z)	lɑ̃səʁje	cond:vous
lancerai(ent)	lɑ̃sʁɛ	cond:ils
>remplace(r)	ʁɑ̃plase	v	1
remplac(e)	ʁɑ̃plas	pr:je/il
remplac(es)	ʁɑ̃plas	pr:tu
remplac(ent)	ʁɑ̃plas	pr:ils
remplaçai(s)	ʁɑ̃plasɛ	imp:je/tu
remplaçai(t)	ʁɑ̃plasɛ	imp:il
remplacion(s)	ʁɑ̃plasjɔ̃	imp:nous
remplacie(z)	ʁɑ̃plasje	imp:vous
remplaçai(ent)	ʁɑ̃plasɛ	imp:ils
remplaçon(s)	ʁɑ̃plasɔ̃	pr:nous
remplace(z)	ʁɑ̃plase	pr:vous
remplaçan(t)	ʁɑ̃plasɑ̃	ppr
remplacé	ʁɑ̃plase	pp
remplacé(e)	ʁɑ̃plase	pp:f
remplacerai	ʁɑ̃plasʁe	fut:je
remplacera(s)	ʁɑ̃plasʁa	fut:tu
remplacera	ʁɑ̃plasʁa	fut:il
remplaceron(s)	ʁɑ̃plasʁɔ̃	fut:nous
remplacere(z)	ʁɑ̃plasʁe	fut:vous
remplaceron(t)	ʁɑ̃plasʁɔ̃	fut:ils
remplacerai(s)	ʁɑ̃plasʁɛ	cond:je/tu
remplacerai(t)	ʁɑ̃plasʁɛ	cond:il
remplacerion(s)	ʁɑ̃plasəʁjɔ̃	cond:nous
remplacerie(z)	ʁɑ̃plasəʁje	cond:vous
remplacerai(ent)	ʁɑ̃plasʁɛ	cond:ils
>étudie(r)	etydje	v	1
étudi(e)	etydi	pr:je/il
étudi(es)	etydi	pr:tu
étudi(ent)	etydi	pr:ils
étudiai(s)	etydjɛ	imp:je/tu
étudiai(t)	etydjɛ	imp:il
étudiion(s)	etydijɔ̃	imp:nous
étudiie(z)	etydije	imp:vous
étudiai(ent)	etydjɛ	imp:ils
étudion(s)	etydjɔ̃	pr:nous
étudie(z)	etydje	pr:vous
étudian(t)	etydjɑ̃	ppr
étudié	etydje	pp
étudié(e)	etydje	pp:f
étudierai	etydiʁe	fut:je
étudiera(s)	etydiʁa	fut:tu
étudiera	etydiʁa	fut:il
étudieron(s)	etydiʁɔ̃	fut:nous
étudiere(z)	etydiʁe	fut:vous
étudieron(t)	etydiʁɔ̃	fut:ils
étudierai(s)	etydiʁɛ	cond:je/tu
étudierai(t)	etydiʁɛ	cond:il
étudierion(s)	etydiʁjɔ̃	cond:nous
étudierie(z)	etydiʁje	cond:vous
étudierai(ent)	etydiʁɛ	cond:ils
>remercie(r)	ʁəmɛʁsje	v	1
remerci(e)	ʁəmɛʁsi	pr:je/il
remerci(es)	ʁəmɛʁsi	pr:tu
remerci(ent)	ʁəmɛʁsi	pr:ils
remerciai(s)	ʁəmɛʁsjɛ	imp:je/tu
remerciai(t)	ʁəmɛʁsjɛ	imp:il
remerciion(s)	ʁəmɛʁsijɔ̃	imp:nous
remerciie(z)	ʁəmɛʁsije	imp:vous
remerciai(ent)	ʁəmɛʁsjɛ	imp:ils
remercion(s)	ʁəmɛʁsjɔ̃	pr:nous
remercie(z)	ʁəmɛʁsje	pr:vous
remercian(t)	ʁəmɛʁsjɑ̃	ppr
remercié	ʁəmɛʁsje	pp
remercié(e)	ʁəmɛʁsje	pp:f
remercierai	ʁəmɛʁsiʁe	fut:je
remerciera(s)	ʁəmɛʁsiʁa	fut:tu
remerciera	ʁəmɛʁsiʁa	fut:il
remercieron(s)	ʁəmɛʁsiʁɔ̃	fut:nous
remerciere(z)	ʁəmɛʁsiʁe	fut:vous
remercieron(t)	ʁəmɛʁsiʁɔ̃	fut:ils
remercierai(s)	ʁəmɛʁsiʁɛ	cond:je/tu
remercierai(t)	ʁəmɛʁsiʁɛ	cond:il
remercierion(s)	ʁəmɛʁsiʁjɔ̃	cond:nous
remercierie(z)	ʁəmɛʁsiʁje	cond:vous
remercierai(ent)	ʁəmɛʁsiʁɛ	cond:ils
>apprécie(r)	apʁesje	v	1
appréci(e)	apʁesi	pr:je/il
appréci(es)	apʁesi	pr:tu
appréci(ent)	apʁesi	pr:ils
appréciai(s)	apʁesjɛ	imp:je/tu
appréciai(t)	apʁesjɛ	imp:il
appréciion(s)	apʁesijɔ̃	imp:nous
appréciie(z)	apʁesije	imp:vous
appréciai(ent)	apʁesjɛ	imp:ils
apprécion(s)	apʁesjɔ̃	pr:nous
apprécie(z)	apʁesje	pr:vous
apprécian(t)	apʁesjɑ̃	ppr
apprécié	apʁesje	pp
apprécié(e)	apʁesje	pp:f
apprécierai	apʁesiʁe	fut:je
appréciera(s)	apʁesiʁa	fut:tu
appréciera	apʁesiʁa	fut:il
apprécieron(s)	apʁesiʁɔ̃	fut:nous
appréciere(z)	apʁesiʁe	fut:vous
apprécieron(t)	apʁesiʁɔ̃	fut:ils
apprécierai(s)	apʁesiʁɛ	cond:je/tu
apprécierai(t)	apʁesiʁɛ	cond:il
apprécierion(s)	apʁesiʁjɔ̃	cond:nous
apprécierie(z)	apʁesiʁje	cond:vous
apprécierai(ent)	apʁesiʁɛ	cond:ils
>crie(r)	kʁije	v	1
cri(e)	kʁi	pr:je/il
cri(es)	kʁi	pr:tu
cri(ent)	kʁi	pr:ils
criai(s)	kʁijɛ	imp:je/tu
criai(t)	kʁijɛ	imp:il
criion(s)	kʁijjɔ̃	imp:nous
criie(z)	kʁijje	imp:vous
criai(ent)	kʁijɛ	imp:ils
crion(s)	kʁijɔ̃	pr:nous
crie(z)	kʁije	pr:vous
crian(t)	kʁijɑ̃	ppr
crié	kʁije	pp
crié(e)	kʁije	pp:f
crierai	kʁiʁe	fut:je
criera(s)	kʁiʁa	fut:tu
criera	kʁiʁa	fut:il
crieron(s)	kʁiʁɔ̃	fut:nous
criere(z)	kʁiʁe	fut:vous
crieron(t)	kʁiʁɔ̃	fut:ils
crierai(s)	kʁiʁɛ	cond:je/tu
crierai(t)	kʁiʁɛ	cond:il
crierion(s)	kʁiʁjɔ̃	cond:nous
crierie(z)	kʁiʁje	cond:vous
crierai(ent)	kʁiʁɛ	cond:ils
>copie(r)	kɔpje	v	1
copi(e)	kɔpi	pr:je/il
copi(es)	kɔpi	pr:tu
copi(ent)	kɔpi	pr:ils
copiai(s)	kɔpjɛ	imp:je/tu
copiai(t)	kɔpjɛ	imp:il
copiion(s)	kɔpijɔ̃	imp:nous
copiie(z)	kɔpije	imp:vous
copiai(ent)	kɔpjɛ	imp:ils
copion(s)	kɔpjɔ̃	pr:nous
copie(z)	kɔpje	pr:vous
copian(t)	kɔpjɑ̃	ppr
copié	kɔpje	pp
copié(e)	kɔpje	pp:f
copierai	kɔpiʁe	fut:je
copiera(s)	kɔpiʁa	fut:tu
copiera	kɔpiʁa	fut:il
copieron(s)	kɔpiʁɔ̃	fut:nous
copiere(z)	kɔpiʁe	fut:vous
copieron(t)	kɔpiʁɔ̃	fut:ils
copierai(s)	kɔpiʁɛ	cond:je/tu
copierai(t)	kɔpiʁɛ	cond:il
copierion(s)	kɔpiʁjɔ̃	cond:nous
copierie(z)	kɔpiʁje	cond:vous
copierai(ent)	kɔpiʁɛ	cond:ils
>vérifie(r)	veʁifje	v	1
vérifi(e)	veʁifi	pr:je/il
vérifi(es)	veʁifi	pr:tu
vérifi(ent)	veʁifi	pr:ils
vérifiai(s)	veʁifjɛ	imp:je/tu
vérifiai(t)	veʁifjɛ	imp:il
vérifiion(s)	veʁifijɔ̃	imp:nous
vérifiie(z)	veʁifije	imp:vous
vérifiai(ent)	veʁifjɛ	imp:ils
vérifion(s)	veʁifjɔ̃	pr:nous
vérifie(z)	veʁifje	pr:vous
vérifian(t)	veʁifjɑ̃	ppr
vérifié	veʁifje	pp
vérifié(e)	veʁifje	pp:f
vérifierai	veʁifiʁe	fut:je
vérifiera(s)	veʁifiʁa	fut:tu
vérifiera	veʁifiʁa	fut:il
vérifieron(s)	veʁifiʁɔ̃	fut:nous
vérifiere(z)	veʁifiʁe	fut:vous
vérifieron(t)	veʁifiʁɔ̃	fut:ils
vérifierai(s)	veʁifiʁɛ	cond:je/tu
vérifierai(t)	veʁifiʁɛ	cond:il
vérifierion(s)	veʁifiʁjɔ̃	cond:nous
vérifierie(z)	veʁifiʁje	cond:vous
vérifierai(ent)	veʁifiʁɛ	cond:ils
>loue(r)	lwe	v	1
lou(e)	lu	pr:je/il
lou(es)	lu	pr:tu
lou(ent)	lu	pr:ils
louai(s)	lwɛ	imp:je/tu
louai(t)	lwɛ	imp:il
louion(s)	lwjɔ̃	imp:nous
louie(z)	lwje	imp:vous
louai(ent)	lwɛ	imp:ils
louon(s)	lwɔ̃	pr:nous
loue(z)	lwe	pr:vous
louan(t)	lwɑ̃	ppr
loué	lwe	pp
loué(e)	lwe	pp:f
louerai	luʁe	fut:je
louera(s)	luʁa	fut:tu
louera	luʁa	fut:il
loueron(s)	luʁɔ̃	fut:nous
louere(z)	luʁe	fut:vous
loueron(t)	luʁɔ̃	fut:ils
louerai(s)	luʁɛ	cond:je/tu
louerai(t)	luʁɛ	cond:il
louerion(s)	luʁjɔ̃	cond:nous
louerie(z)	luʁje	cond:vous
louerai(ent)	luʁɛ	cond:ils
>tue(r)	tɥe	v	1
tu(e)	ty	pr:je/il
tu(es)	ty	pr:tu
tu(ent)	ty	pr:ils
tuai(s)	tɥɛ	imp:je/tu
tuai(t)	tɥɛ	imp:il
tuion(s)	tɥjɔ̃	imp:nous
tuie(z)	tɥje	imp:vous
tuai(ent)	tɥɛ	imp:ils
tuon(s)	tɥɔ̃	pr:nous
tue(z)	tɥe	pr:vous
tuan(t)	tɥɑ̃	ppr
tué	tɥe	pp
tué(e)	tɥe	pp:f
tuerai	tyʁe	fut:je
tuera(s)	tyʁa	fut:tu
tuera	tyʁa	fut:il
tueron(s)	tyʁɔ̃	fut:nous
tuere(z)	tyʁe	fut:vous
tueron(t)	tyʁɔ̃	fut:ils
tuerai(s)	tyʁɛ	cond:je/tu
tuerai(t)	tyʁɛ	cond:il
tuerion(s)	tyʁjɔ̃	cond:nous
tuerie(z)	tyʁje	cond:vous
tuerai(ent)	tyʁɛ	cond:ils
>crée(r)	kʁee	v	1
cré(e)	kʁe	pr:je/il
cré(es)	kʁe	pr:tu
cré(ent)	kʁe	pr:ils
créai(s)	kʁeɛ	imp:je/tu
créai(t)	kʁeɛ	imp:il
créion(s)	kʁejɔ̃	imp:nous
créie(z)	kʁeje	imp:vous
créai(ent)	kʁeɛ	imp:ils
créon(s)	kʁeɔ̃	pr:nous
crée(z)	kʁee	pr:vous
créan(t)	kʁeɑ̃	ppr
créé	kʁee	pp
créé(e)	kʁee	pp:f
créerai	kʁeʁe	fut:je
créera(s)	kʁeʁa	fut:tu
créera	kʁeʁa	fut:il
créeron(s)	kʁeʁɔ̃	fut:nous
créere(z)	kʁeʁe	fut:vous
créeron(t)	kʁeʁɔ̃	fut:ils
créerai(s)	kʁeʁɛ	cond:je/tu
créerai(t)	kʁeʁɛ	cond:il
créerion(s)	kʁeʁjɔ̃	cond:nous
créerie(z)	kʁeʁje	cond:vous
créerai(ent)	kʁeʁɛ	cond:ils
>utilise(r)	ytilize	v	1
utilis(e)	ytiliz	pr:je/il
utilis(es)	ytiliz	pr:tu
utilis(ent)	ytiliz	pr:ils
utilisai(s)	ytilizɛ	imp:je/tu
utilisai(t)	ytilizɛ	imp:il
utilision(s)	ytilizjɔ̃	imp:nous
utilisie(z)	ytilizje	imp:vous
utilisai(ent)	ytilizɛ	imp:ils
utilison(s)	ytilizɔ̃	pr:nous
utilise(z)	ytilize	pr:vous
utilisan(t)	ytilizɑ̃	ppr
utilisé	ytilize	pp
utilisé(e)	ytilize	pp:f
utiliserai	ytilizʁe	fut:je
utilisera(s)	ytilizʁa	fut:tu
utilisera	ytilizʁa	fut:il
utiliseron(s)	ytilizʁɔ̃	fut:nous
utilisere(z)	ytilizʁe	fut:vous
utiliseron(t)	ytilizʁɔ̃	fut:ils
utiliserai(s)	ytilizʁɛ	cond:je/tu
utiliserai(t)	ytilizʁɛ	cond:il
utiliserion(s)	ytilizəʁjɔ̃	cond:nous
utiliserie(z)	ytilizəʁje	cond:vous
utiliserai(ent)	ytilizʁɛ	cond:ils
>prépare(r)	pʁepaʁe	v	1
prépar(e)	pʁepaʁ	pr:je/il
prépar(es)	pʁepaʁ	pr:tu
prépar(ent)	pʁepaʁ	pr:ils
préparai(s)	pʁepaʁɛ	imp:je/tu
préparai(t)	pʁepaʁɛ	imp:il
préparion(s)	pʁepaʁjɔ̃	imp:nous
préparie(z)	pʁepaʁje	imp:vous
préparai(ent)	pʁepaʁɛ	imp:ils
préparon(s)	pʁepaʁɔ̃	pr:nous
prépare(z)	pʁepaʁe	pr:vous
préparan(t)	pʁepaʁɑ̃	ppr
préparé	pʁepaʁe	pp
préparé(e)	pʁepaʁe	pp:f
préparerai	pʁepaʁʁe	fut:je
préparera(s)	pʁepaʁʁa	fut:tu
préparera	pʁepaʁʁa	fut:il
prépareron(s)	pʁepaʁʁɔ̃	fut:nous
préparere(z)	pʁepaʁʁe	fut:vous
prépareron(t)	pʁepaʁʁɔ̃	fut:ils
préparerai(s)	pʁepaʁʁɛ	cond:je/tu
préparerai(t)	pʁepaʁʁɛ	cond:il
préparerion(s)	pʁepaʁəʁjɔ̃	cond:nous
préparerie(z)	pʁepaʁəʁje	cond:vous
préparerai(ent)	pʁepaʁʁɛ	cond:ils
>cuisine(r)	kɥizine	v	1
cuisin(e)	kɥizin	pr:je/il
cuisin(es)	kɥizin	pr:tu
cuisin(ent)	kɥizin	pr:ils
cuisinai(s)	kɥizinɛ	imp:je/tu
cuisinai(t)	kɥizinɛ	imp:il
cuisinion(s)	kɥizinjɔ̃	imp:nous
cuisinie(z)	kɥizinje	imp:vous
cuisinai(ent)	kɥizinɛ	imp:ils
cuisinon(s)	kɥizinɔ̃	pr:nous
cuisine(z)	kɥizine	pr:vous
cuisinan(t)	kɥizinɑ̃	ppr
cuisiné	kɥizine	pp
cuisiné(e)	kɥizine	pp:f
cuisinerai	kɥizinʁe	fut:je
cuisinera(s)	kɥizinʁa	fut:tu
cuisinera	kɥizinʁa	fut:il
cuisineron(s)	kɥizinʁɔ̃	fut:nous
cuisinere(z)	kɥizinʁe	fut:vous
cuisineron(t)	kɥizinʁɔ̃	fut:ils
cuisinerai(s)	kɥizinʁɛ	cond:je/tu
cuisinerai(t)	kɥizinʁɛ	cond:il
cuisinerion(s)	kɥizinəʁjɔ̃	cond:nous
cuisinerie(z)	kɥizinəʁje	cond:vous
cuisinerai(ent)	kɥizinʁɛ	cond:ils
>goûte(r)	gute	v	1
goût(e)	gut	pr:je/il
goût(es)	gut	pr:tu
goût(ent)	gut	pr:ils
goûtai(s)	gutɛ	imp:je/tu
goûtai(t)	gutɛ	imp:il
goûtion(s)	gutjɔ̃	imp:nous
goûtie(z)	gutje	imp:vous
goûtai(ent)	gutɛ	imp:ils
goûton(s)	gutɔ̃	pr:nous
goûte(z)	gute	pr:vous
goûtan(t)	gutɑ̃	ppr
goûté	gute	pp
goûté(e)	gute	pp:f
goûterai	gutʁe	fut:je
goûtera(s)	gutʁa	fut:tu
goûtera	gutʁa	fut:il
goûteron(s)	gutʁɔ̃	fut:nous
goûtere(z)	gutʁe	fut:vous
goûteron(t)	gutʁɔ̃	fut:ils
goûterai(s)	gutʁɛ	cond:je/tu
goûterai(t)	gutʁɛ	cond:il
goûterion(s)	gutəʁjɔ̃	cond:nous
goûterie(z)	gutəʁje	cond:vous
goûterai(ent)	gutʁɛ	cond:ils
>commande(r)	kɔmɑ̃de	v	1
command(e)	kɔmɑ̃d	pr:je/il
command(es)	kɔmɑ̃d	pr:tu
command(ent)	kɔmɑ̃d	pr:ils
commandai(s)	kɔmɑ̃dɛ	imp:je/tu
commandai(t)	kɔmɑ̃dɛ	imp:il
commandion(s)	kɔmɑ̃djɔ̃	imp:nous
commandie(z)	kɔmɑ̃dje	imp:vous
commandai(ent)	kɔmɑ̃dɛ	imp:ils
commandon(s)	kɔmɑ̃dɔ̃	pr:nous
commande(z)	kɔmɑ̃de	pr:vous
commandan(t)	kɔmɑ̃dɑ̃	ppr
commandé	kɔmɑ̃de	pp
commandé(e)	kɔmɑ̃de	pp:f
commanderai	kɔmɑ̃dʁe	fut:je
commandera(s)	kɔmɑ̃dʁa	fut:tu
commandera	kɔmɑ̃dʁa	fut:il
commanderon(s)	kɔmɑ̃dʁɔ̃	fut:nous
commandere(z)	kɔmɑ̃dʁe	fut:vous
commanderon(t)	kɔmɑ̃dʁɔ̃	fut:ils
commanderai(s)	kɔmɑ̃dʁɛ	cond:je/tu
commanderai(t)	kɔmɑ̃dʁɛ	cond:il
commanderion(s)	kɔmɑ̃dəʁjɔ̃	cond:nous
commanderie(z)	kɔmɑ̃dəʁje	cond:vous
commanderai(ent)	kɔmɑ̃dʁɛ	cond:ils
>réserve(r)	ʁezɛʁve	v	1
réserv(e)	ʁezɛʁv	pr:je/il
réserv(es)	ʁezɛʁv	pr:tu
réserv(ent)	ʁezɛʁv	pr:ils
réservai(s)	ʁezɛʁvɛ	imp:je/tu
réservai(t)	ʁezɛʁvɛ	imp:il
réservion(s)	ʁezɛʁvjɔ̃	imp:nous
réservie(z)	ʁezɛʁvje	imp:vous
réservai(ent)	ʁezɛʁvɛ	imp:ils
réservon(s)	ʁezɛʁvɔ̃	pr:nous
réserve(z)	ʁezɛʁve	pr:vous
réservan(t)	ʁezɛʁvɑ̃	ppr
réservé	ʁezɛʁve	pp
réservé(e)	ʁezɛʁve	pp:f
réserverai	ʁezɛʁvəʁe	fut:je
réservera(s)	ʁezɛʁvəʁa	fut:tu
réservera	ʁezɛʁvəʁa	fut:il
réserveron(s)	ʁezɛʁvəʁɔ̃	fut:nous
réservere(z)	ʁezɛʁvəʁe	fut:vous
réserveron(t)	ʁezɛʁvəʁɔ̃	fut:ils
réserverai(s)	ʁezɛʁvəʁɛ	cond:je/tu
réserverai(t)	ʁezɛʁvəʁɛ	cond:il
réserverion(s)	ʁezɛʁvəʁjɔ̃	cond:nous
réserverie(z)	ʁezɛʁvəʁje	cond:vous
réserverai(ent)	ʁezɛʁvəʁɛ	cond:ils
>coûte(r)	kute	v	1
coût(e)	kut	pr:je/il
coût(es)	kut	pr:tu
coût(ent)	kut	pr:ils
coûtai(s)	kutɛ	imp:je/tu
coûtai(t)	kutɛ	imp:il
coûtion(s)	kutjɔ̃	imp:nous
coûtie(z)	kutje	imp:vous
coûtai(ent)	kutɛ	imp:ils
coûton(s)	kutɔ̃	pr:nous
coûte(z)	kute	pr:vous
coûtan(t)	kutɑ̃	ppr
coûté	kute	pp
coûté(e)	kute	pp:f
coûterai	kutʁe	fut:je
coûtera(s)	kutʁa	fut:tu
coûtera	kutʁa	fut:il
coûteron(s)	kutʁɔ̃	fut:nous
coûtere(z)	kutʁe	fut:vous
coûteron(t)	kutʁɔ̃	fut:ils
coûterai(s)	kutʁɛ	cond:je/tu
coûterai(t)	kutʁɛ	cond:il
coûterion(s)	kutəʁjɔ̃	cond:nous
coûterie(z)	kutəʁje	cond:vous
coûterai(ent)	kutʁɛ	cond:ils
>com(p)te(r)	kɔ̃te	v	1
com(p)t(e)	kɔ̃t	pr:je/il
com(p)t(es)	kɔ̃t	pr:tu
com(p)t(ent)	kɔ̃t	pr:ils
com(p)tai(s)	kɔ̃tɛ	imp:je/tu
com(p)tai(t)	kɔ̃tɛ	imp:il
com(p)tion(s)	kɔ̃tjɔ̃	imp:nous
com(p)tie(z)	kɔ̃tje	imp:vous
com(p)tai(ent)	kɔ̃tɛ	imp:ils
com(p)ton(s)	kɔ̃tɔ̃	pr:nous
com(p)te(z)	kɔ̃te	pr:vous
com(p)tan(t)	kɔ̃tɑ̃	ppr
com(p)té	kɔ̃te	pp
com(p)té(e)	kɔ̃te	pp:f
com(p)terai	kɔ̃tʁe	fut:je
com(p)tera(s)	kɔ̃tʁa	fut:tu
com(p)tera	kɔ̃tʁa	fut:il
com(p)teron(s)	kɔ̃tʁɔ̃	fut:nous
com(p)tere(z)	kɔ̃tʁe	fut:vous
com(p)teron(t)	kɔ̃tʁɔ̃	fut:ils
com(p)terai(s)	kɔ̃tʁɛ	cond:je/tu
com(p)terai(t)	kɔ̃tʁɛ	cond:il
com(p)terion(s)	kɔ̃təʁjɔ̃	cond:nous
com(p)terie(z)	kɔ̃təʁje	cond:vous
com(p)terai(ent)	kɔ̃tʁɛ	cond:ils
>augmente(r)	ogmɑ̃te	v	1
augment(e)	ogmɑ̃t	pr:je/il
augment(es)	ogmɑ̃t	pr:tu
augment(ent)	ogmɑ̃t	pr:ils
augmentai(s)	ogmɑ̃tɛ	imp:je/tu
augmentai(t)	ogmɑ̃tɛ	imp:il
augmention(s)	ogmɑ̃tjɔ̃	imp:nous
augmentie(z)	ogmɑ̃tje	imp:vous
augmentai(ent)	ogmɑ̃tɛ	imp:ils
augmenton(s)	ogmɑ̃tɔ̃	pr:nous
augmente(z)	ogmɑ̃te	pr:vous
augmentan(t)	ogmɑ̃tɑ̃	ppr
augmenté	ogmɑ̃te	pp
augmenté(e)	ogmɑ̃te	pp:f
augmenterai	ogmɑ̃tʁe	fut:je
augmentera(s)	ogmɑ̃tʁa	fut:tu
augmentera	ogmɑ̃tʁa	fut:il
augmenteron(s)	ogmɑ̃tʁɔ̃	fut:nous
augmentere(z)	ogmɑ̃tʁe	fut:vous
augmenteron(t)	ogmɑ̃tʁɔ̃	fut:ils
augmenterai(s)	ogmɑ̃tʁɛ	cond:je/tu
augmenterai(t)	ogmɑ̃tʁɛ	cond:il
augmenterion(s)	ogmɑ̃təʁjɔ̃	cond:nous
augmenterie(z)	ogmɑ̃təʁje	cond:vous
augmenterai(ent)	ogmɑ̃tʁɛ	cond:ils
>baisse(r)	bɛse	v	1
baiss(e)	bɛs	pr:je/il
baiss(es)	bɛs	pr:tu
baiss(ent)	bɛs	pr:ils
baissai(s)	bɛsɛ	imp:je/tu
baissai(t)	bɛsɛ	imp:il
baission(s)	bɛsjɔ̃	imp:nous
baissie(z)	bɛsje	imp:vous
baissai(ent)	bɛsɛ	imp:ils
baisson(s)	bɛsɔ̃	pr:nous
baisse(z)	bɛse	pr:vous
baissan(t)	bɛsɑ̃	ppr
baissé	bɛse	pp
baissé(e)	bɛse	pp:f
baisserai	bɛsʁe	fut:je
baissera(s)	bɛsʁa	fut:tu
baissera	bɛsʁa	fut:il
baisseron(s)	bɛsʁɔ̃	fut:nous
baissere(z)	bɛsʁe	fut:vous
baisseron(t)	bɛsʁɔ̃	fut:ils
baisserai(s)	bɛsʁɛ	cond:je/tu
baisserai(t)	bɛsʁɛ	cond:il
baisserion(s)	bɛsəʁjɔ̃	cond:nous
baisserie(z)	bɛsəʁje	cond:vous
baisserai(ent)	bɛsʁɛ	cond:ils
>gagne(r)	gaɲe	v	1
gagn(e)	gaɲ	pr:je/il
gagn(es)	gaɲ	pr:tu
gagn(ent)	gaɲ	pr:ils
gagnai(s)	gaɲɛ	imp:je/tu
gagnai(t)	gaɲɛ	imp:il
gagnion(s)	gaɲjɔ̃	imp:nous
gagnie(z)	gaɲje	imp:vous
gagnai(ent)	gaɲɛ	imp:ils
gagnon(s)	gaɲɔ̃	pr:nous
gagne(z)	gaɲe	pr:vous
gagnan(t)	gaɲɑ̃	ppr
gagné	gaɲe	pp
gagné(e)	gaɲe	pp:f
gagnerai	gaɲʁe	fut:je
gagnera(s)	gaɲʁa	fut:tu
gagnera	gaɲʁa	fut:il
gagneron(s)	gaɲʁɔ̃	fut:nous
gagnere(z)	gaɲʁe	fut:vous
gagneron(t)	gaɲʁɔ̃	fut:ils
gagnerai(s)	gaɲʁɛ	cond:je/tu
gagnerai(t)	gaɲʁɛ	cond:il
gagnerion(s)	gaɲəʁjɔ̃	cond:nous
gagnerie(z)	gaɲəʁje	cond:vous
gagnerai(ent)	gaɲʁɛ	cond:ils
>dépense(r)	depɑ̃se	v	1
dépens(e)	depɑ̃s	pr:je/il
dépens(es)	depɑ̃s	pr:tu
dépens(ent)	depɑ̃s	pr:ils
dépensai(s)	depɑ̃sɛ	imp:je/tu
dépensai(t)	depɑ̃sɛ	imp:il
dépension(s)	depɑ̃sjɔ̃	imp:nous
dépensie(z)	depɑ̃sje	imp:vous
dépensai(ent)	depɑ̃sɛ	imp:ils
dépenson(s)	depɑ̃sɔ̃	pr:nous
dépense(z)	depɑ̃se	pr:vous
dépensan(t)	depɑ̃sɑ̃	ppr
dépensé	depɑ̃se	pp
dépensé(e)	depɑ̃se	pp:f
dépenserai	depɑ̃sʁe	fut:je
dépensera(s)	depɑ̃sʁa	fut:tu
dépensera	depɑ̃sʁa	fut:il
dépenseron(s)	depɑ̃sʁɔ̃	fut:nous
dépensere(z)	depɑ̃sʁe	fut:vous
dépenseron(t)	depɑ̃sʁɔ̃	fut:ils
dépenserai(s)	depɑ̃sʁɛ	cond:je/tu
dépenserai(t)	depɑ̃sʁɛ	cond:il
dépenserion(s)	depɑ̃səʁjɔ̃	cond:nous
dépenserie(z)	depɑ̃səʁje	cond:vous
dépenserai(ent)	depɑ̃sʁɛ	cond:ils
>économise(r)	ekɔnɔmize	v	1
économis(e)	ekɔnɔmiz	pr:je/il
économis(es)	ekɔnɔmiz	pr:tu
économis(ent)	ekɔnɔmiz	pr:ils
économisai(s)	ekɔnɔmizɛ	imp:je/tu
économisai(t)	ekɔnɔmizɛ	imp:il
économision(s)	ekɔnɔmizjɔ̃	imp:nous
économisie(z)	ekɔnɔmizje	imp:vous
économisai(ent)	ekɔnɔmizɛ	imp:ils
économison(s)	ekɔnɔmizɔ̃	pr:nous
économise(z)	ekɔnɔmize	pr:vous
économisan(t)	ekɔnɔmizɑ̃	ppr
économisé	ekɔnɔmize	pp
économisé(e)	ekɔnɔmize	pp:f
économiserai	ekɔnɔmizʁe	fut:je
économisera(s)	ekɔnɔmizʁa	fut:tu
économisera	ekɔnɔmizʁa	fut:il
économiseron(s)	ekɔnɔmizʁɔ̃	fut:nous
économisere(z)	ekɔnɔmizʁe	fut:vous
économiseron(t)	ekɔnɔmizʁɔ̃	fut:ils
économiserai(s)	ekɔnɔmizʁɛ	cond:je/tu
économiserai(t)	ekɔnɔmizʁɛ	cond:il
économiserion(s)	ekɔnɔmizəʁjɔ̃	cond:nous
économiserie(z)	ekɔnɔmizəʁje	cond:vous
économiserai(ent)	ekɔnɔmizʁɛ	cond:ils
>prête(r)	pʁɛte	v	1
prêt(e)	pʁɛt	pr:je/il
prêt(es)	pʁɛt	pr:tu
prêt(ent)	pʁɛt	pr:ils
prêtai(s)	pʁɛtɛ	imp:je/tu
prêtai(t)	pʁɛtɛ	imp:il
prêtion(s)	pʁɛtjɔ̃	imp:nous
prêtie(z)	pʁɛtje	imp:vous
prêtai(ent)	pʁɛtɛ	imp:ils
prêton(s)	pʁɛtɔ̃	pr:nous
prête(z)	pʁɛte	pr:vous
prêtan(t)	pʁɛtɑ̃	ppr
prêté	pʁɛte	pp
prêté(e)	pʁɛte	pp:f
prêterai	pʁɛtʁe	fut:je
prêtera(s)	pʁɛtʁa	fut:tu
prêtera	pʁɛtʁa	fut:il
prêteron(s)	pʁɛtʁɔ̃	fut:nous
prêtere(z)	pʁɛtʁe	fut:vous
prêteron(t)	pʁɛtʁɔ̃	fut:ils
prêterai(s)	pʁɛtʁɛ	cond:je/tu
prêterai(t)	pʁɛtʁɛ	cond:il
prêterion(s)	pʁɛtəʁjɔ̃	cond:nous
prêterie(z)	pʁɛtəʁje	cond:vous
prêterai(ent)	pʁɛtʁɛ	cond:ils
>emprunte(r)	ɑ̃pʁœ̃te	v	1
emprunt(e)	ɑ̃pʁœ̃t	pr:je/il
emprunt(es)	ɑ̃pʁœ̃t	pr:tu
emprunt(ent)	ɑ̃pʁœ̃t	pr:ils
empruntai(s)	ɑ̃pʁœ̃tɛ	imp:je/tu
empruntai(t)	ɑ̃pʁœ̃tɛ	imp:il
empruntion(s)	ɑ̃pʁœ̃tjɔ̃	imp:nous
empruntie(z)	ɑ̃pʁœ̃tje	imp:vous
empruntai(ent)	ɑ̃pʁœ̃tɛ	imp:ils
emprunton(s)	ɑ̃pʁœ̃tɔ̃	pr:nous
emprunte(z)	ɑ̃pʁœ̃te	pr:vous
empruntan(t)	ɑ̃pʁœ̃tɑ̃	ppr
emprunté	ɑ̃pʁœ̃te	pp
emprunté(e)	ɑ̃pʁœ̃te	pp:f
emprunterai	ɑ̃pʁœ̃tʁe	fut:je
empruntera(s)	ɑ̃pʁœ̃tʁa	fut:tu
empruntera	ɑ̃pʁœ̃tʁa	fut:il
emprunteron(s)	ɑ̃pʁœ̃tʁɔ̃	fut:nous
empruntere(z)	ɑ̃pʁœ̃tʁe	fut:vous
emprunteron(t)	ɑ̃pʁœ̃tʁɔ̃	fut:ils
emprunterai(s)	ɑ̃pʁœ̃tʁɛ	cond:je/tu
emprunterai(t)	ɑ̃pʁœ̃tʁɛ	cond:il
emprunterion(s)	ɑ̃pʁœ̃təʁjɔ̃	cond:nous
emprunterie(z)	ɑ̃pʁœ̃təʁje	cond:vous
emprunterai(ent)	ɑ̃pʁœ̃tʁɛ	cond:ils
>rencontre(r)	ʁɑ̃kɔ̃tʁe	v	1
rencontr(e)	ʁɑ̃kɔ̃tʁ	pr:je/il
rencontr(es)	ʁɑ̃kɔ̃tʁ	pr:tu
rencontr(ent)	ʁɑ̃kɔ̃tʁ	pr:ils
rencontrai(s)	ʁɑ̃kɔ̃tʁɛ	imp:je/tu
rencontrai(t)	ʁɑ̃kɔ̃tʁɛ	imp:il
rencontrion(s)	ʁɑ̃kɔ̃tʁijɔ̃	imp:nous
rencontrie(z)	ʁɑ̃kɔ̃tʁije	imp:vous
rencontrai(ent)	ʁɑ̃kɔ̃tʁɛ	imp:ils
rencontron(s)	ʁɑ̃kɔ̃tʁɔ̃	pr:nous
rencontre(z)	ʁɑ̃kɔ̃tʁe	pr:vous
rencontran(t)	ʁɑ̃kɔ̃tʁɑ̃	ppr
rencontré	ʁɑ̃kɔ̃tʁe	pp
rencontré(e)	ʁɑ̃kɔ̃tʁe	pp:f
rencontrerai	ʁɑ̃kɔ̃tʁəʁe	fut:je
rencontrera(s)	ʁɑ̃kɔ̃tʁəʁa	fut:tu
rencontrera	ʁɑ̃kɔ̃tʁəʁa	fut:il
rencontreron(s)	ʁɑ̃kɔ̃tʁəʁɔ̃	fut:nous
rencontrere(z)	ʁɑ̃kɔ̃tʁəʁe	fut:vous
rencontreron(t)	ʁɑ̃kɔ̃tʁəʁɔ̃	fut:ils
rencontrerai(s)	ʁɑ̃kɔ̃tʁəʁɛ	cond:je/tu
rencontrerai(t)	ʁɑ̃kɔ̃tʁəʁɛ	cond:il
rencontrerion(s)	ʁɑ̃kɔ̃tʁəʁjɔ̃	cond:nous
rencontrerie(z)	ʁɑ̃kɔ̃tʁəʁje	cond:vous
rencontrerai(ent)	ʁɑ̃kɔ̃tʁəʁɛ	cond:ils
>retrouve(r)	ʁətʁuve	v	1
retrouv(e)	ʁətʁuv	pr:je/il
retrouv(es)	ʁətʁuv	pr:tu
retrouv(ent)	ʁətʁuv	pr:ils
retrouvai(s)	ʁətʁuvɛ	imp:je/tu
retrouvai(t)	ʁətʁuvɛ	imp:il
retrouvion(s)	ʁətʁuvjɔ̃	imp:nous
retrouvie(z)	ʁətʁuvje	imp:vous
retrouvai(ent)	ʁətʁuvɛ	imp:ils
retrouvon(s)	ʁətʁuvɔ̃	pr:nous
retrouve(z)	ʁətʁuve	pr:vous
retrouvan(t)	ʁətʁuvɑ̃	ppr
retrouvé	ʁətʁuve	pp
retrouvé(e)	ʁətʁuve	pp:f
retrouverai	ʁətʁuvʁe	fut:je
retrouvera(s)	ʁətʁuvʁa	fut:tu
retrouvera	ʁətʁuvʁa	fut:il
retrouveron(s)	ʁətʁuvʁɔ̃	fut:nous
retrouvere(z)	ʁətʁuvʁe	fut:vous
retrouveron(t)	ʁətʁuvʁɔ̃	fut:ils
retrouverai(s)	ʁətʁuvʁɛ	cond:je/tu
retrouverai(t)	ʁətʁuvʁɛ	cond:il
retrouverion(s)	ʁətʁuvəʁjɔ̃	cond:nous
retrouverie(z)	ʁətʁuvəʁje	cond:vous
retrouverai(ent)	ʁətʁuvʁɛ	cond:ils
>invite(r)	ɛ̃vite	v	1
invit(e)	ɛ̃vit	pr:je/il
invit(es)	ɛ̃vit	pr:tu
invit(ent)	ɛ̃vit	pr:ils
invitai(s)	ɛ̃vitɛ	imp:je/tu
invitai(t)	ɛ̃vitɛ	imp:il
invition(s)	ɛ̃vitjɔ̃	imp:nous
invitie(z)	ɛ̃vitje	imp:vous
invitai(ent)	ɛ̃vitɛ	imp:ils
inviton(s)	ɛ̃vitɔ̃	pr:nous
invite(z)	ɛ̃vite	pr:vous
invitan(t)	ɛ̃vitɑ̃	ppr
invité	ɛ̃vite	pp
invité(e)	ɛ̃vite	pp:f
inviterai	ɛ̃vitʁe	fut:je
invitera(s)	ɛ̃vitʁa	fut:tu
invitera	ɛ̃vitʁa	fut:il
inviteron(s)	ɛ̃vitʁɔ̃	fut:nous
invitere(z)	ɛ̃vitʁe	fut:vous
inviteron(t)	ɛ̃vitʁɔ̃	fut:ils
inviterai(s)	ɛ̃vitʁɛ	cond:je/tu
inviterai(t)	ɛ̃vitʁɛ	cond:il
inviterion(s)	ɛ̃vitəʁjɔ̃	cond:nous
inviterie(z)	ɛ̃vitəʁje	cond:vous
inviterai(ent)	ɛ̃vitʁɛ	cond:ils
>visite(r)	vizite	v	1
visit(e)	vizit	pr:je/il
visit(es)	vizit	pr:tu
visit(ent)	vizit	pr:ils
visitai(s)	vizitɛ	imp:je/tu
visitai(t)	vizitɛ	imp:il
visition(s)	vizitjɔ̃	imp:nous
visitie(z)	vizitje	imp:vous
visitai(ent)	vizitɛ	imp:ils
visiton(s)	vizitɔ̃	pr:nous
visite(z)	vizite	pr:vous
visitan(t)	vizitɑ̃	ppr
visité	vizite	pp
visité(e)	vizite	pp:f
visiterai	vizitʁe	fut:je
visitera(s)	vizitʁa	fut:tu
visitera	vizitʁa	fut:il
visiteron(s)	vizitʁɔ̃	fut:nous
visitere(z)	vizitʁe	fut:vous
visiteron(t)	vizitʁɔ̃	fut:ils
visiterai(s)	vizitʁɛ	cond:je/tu
visiterai(t)	vizitʁɛ	cond:il
visiterion(s)	vizitəʁjɔ̃	cond:nous
visiterie(z)	vizitəʁje	cond:vous
visiterai(ent)	vizitʁɛ	cond:ils
>discute(r)	diskyte	v	1
discut(e)	diskyt	pr:je/il
discut(es)	diskyt	pr:tu
discut(ent)	diskyt	pr:ils
discutai(s)	diskytɛ	imp:je/tu
discutai(t)	diskytɛ	imp:il
discution(s)	diskytjɔ̃	imp:nous
discutie(z)	diskytje	imp:vous
discutai(ent)	diskytɛ	imp:ils
discuton(s)	diskytɔ̃	pr:nous
discute(z)	diskyte	pr:vous
discutan(t)	diskytɑ̃	ppr
discuté	diskyte	pp
discuté(e)	diskyte	pp:f
discuterai	diskytʁe	fut:je
discutera(s)	diskytʁa	fut:tu
discutera	diskytʁa	fut:il
discuteron(s)	diskytʁɔ̃	fut:nous
discutere(z)	diskytʁe	fut:vous
discuteron(t)	diskytʁɔ̃	fut:ils
discuterai(s)	diskytʁɛ	cond:je/tu
discuterai(t)	diskytʁɛ	cond:il
discuterion(s)	diskytəʁjɔ̃	cond:nous
discuterie(z)	diskytəʁje	cond:vous
discuterai(ent)	diskytʁɛ	cond:ils
>raconte(r)	ʁakɔ̃te	v	1
racont(e)	ʁakɔ̃t	pr:je/il
racont(es)	ʁakɔ̃t	pr:tu
racont(ent)	ʁakɔ̃t	pr:ils
racontai(s)	ʁakɔ̃tɛ	imp:je/tu
racontai(t)	ʁakɔ̃tɛ	imp:il
racontion(s)	ʁakɔ̃tjɔ̃	imp:nous
racontie(z)	ʁakɔ̃tje	imp:vous
racontai(ent)	ʁakɔ̃tɛ	imp:ils
raconton(s)	ʁakɔ̃tɔ̃	pr:nous
raconte(z)	ʁakɔ̃te	pr:vous
racontan(t)	ʁakɔ̃tɑ̃	ppr
raconté	ʁakɔ̃te	pp
raconté(e)	ʁakɔ̃te	pp:f
raconterai	ʁakɔ̃tʁe	fut:je
racontera(s)	ʁakɔ̃tʁa	fut:tu
racontera	ʁakɔ̃tʁa	fut:il
raconteron(s)	ʁakɔ̃tʁɔ̃	fut:nous
racontere(z)	ʁakɔ̃tʁe	fut:vous
raconteron(t)	ʁakɔ̃tʁɔ̃	fut:ils
raconterai(s)	ʁakɔ̃tʁɛ	cond:je/tu
raconterai(t)	ʁakɔ̃tʁɛ	cond:il
raconterion(s)	ʁakɔ̃təʁjɔ̃	cond:nous
raconterie(z)	ʁakɔ̃təʁje	cond:vous
raconterai(ent)	ʁakɔ̃tʁɛ	cond:ils
>explique(r)	ɛksplike	v	1
expliqu(e)	ɛksplik	pr:je/il
expliqu(es)	ɛksplik	pr:tu
expliqu(ent)	ɛksplik	pr:ils
expliquai(s)	ɛksplikɛ	imp:je/tu
expliquai(t)	ɛksplikɛ	imp:il
expliquion(s)	ɛksplikjɔ̃	imp:nous
expliquie(z)	ɛksplikje	imp:vous
expliquai(ent)	ɛksplikɛ	imp:ils
expliquon(s)	ɛksplikɔ̃	pr:nous
explique(z)	ɛksplike	pr:vous
expliquan(t)	ɛksplikɑ̃	ppr
expliqué	ɛksplike	pp
expliqué(e)	ɛksplike	pp:f
expliquerai	ɛksplikʁe	fut:je
expliquera(s)	ɛksplikʁa	fut:tu
expliquera	ɛksplikʁa	fut:il
expliqueron(s)	ɛksplikʁɔ̃	fut:nous
expliquere(z)	ɛksplikʁe	fut:vous
expliqueron(t)	ɛksplikʁɔ̃	fut:ils
expliquerai(s)	ɛksplikʁɛ	cond:je/tu
expliquerai(t)	ɛksplikʁɛ	cond:il
expliquerion(s)	ɛksplikəʁjɔ̃	cond:nous
expliquerie(z)	ɛksplikəʁje	cond:vous
expliquerai(ent)	ɛksplikʁɛ	cond:ils
>pose(r)	poze	v	1
pos(e)	poz	pr:je/il
pos(es)	poz	pr:tu
pos(ent)	poz	pr:ils
posai(s)	pozɛ	imp:je/tu
posai(t)	pozɛ	imp:il
posion(s)	pozjɔ̃	imp:nous
posie(z)	pozje	imp:vous
posai(ent)	pozɛ	imp:ils
poson(s)	pozɔ̃	pr:nous
pose(z)	poze	pr:vous
posan(t)	pozɑ̃	ppr
posé	poze	pp
posé(e)	poze	pp:f
poserai	pozʁe	fut:je
posera(s)	pozʁa	fut:tu
posera	pozʁa	fut:il
poseron(s)	pozʁɔ̃	fut:nous
posere(z)	pozʁe	fut:vous
poseron(t)	pozʁɔ̃	fut:ils
poserai(s)	pozʁɛ	cond:je/tu
poserai(t)	pozʁɛ	cond:il
poserion(s)	pozəʁjɔ̃	cond:nous
poserie(z)	pozəʁje	cond:vous
poserai(ent)	pozʁɛ	cond:ils
>répondr(e)	ʁepɔ̃dʁ	v	1
répon(ds)	ʁepɔ̃	pr:je/tu
répon(d)	ʁepɔ̃	pr:il
répondon(s)	ʁepɔ̃dɔ̃	pr:nous
réponde(z)	ʁepɔ̃de	pr:vous
répond(ent)	ʁepɔ̃d	pr:ils
répondai(s)	ʁepɔ̃dɛ	imp:je/tu
répondai(t)	ʁepɔ̃dɛ	imp:il
répondion(s)	ʁepɔ̃djɔ̃	imp:nous
répondie(z)	ʁepɔ̃dje	imp:vous
répondai(ent)	ʁepɔ̃dɛ	imp:ils
répondan(t)	ʁepɔ̃dɑ̃	ppr
répondu	ʁepɔ̃dy	pp
répondu(e)	ʁepɔ̃dy	pp:f
répondrai	ʁepɔ̃dʁe	fut:je
répondra(s)	ʁepɔ̃dʁa	fut:tu
répondra	ʁepɔ̃dʁa	fut:il
répondron(s)	ʁepɔ̃dʁɔ̃	fut:nous
répondre(z)	ʁepɔ̃dʁe	fut:vous
répondron(t)	ʁepɔ̃dʁɔ̃	fut:ils
répondrai(s)	ʁepɔ̃dʁɛ	cond:je/tu
répondrai(t)	ʁepɔ̃dʁɛ	cond:il
répondrion(s)	ʁepɔ̃dʁijɔ̃	cond:nous
répondrie(z)	ʁepɔ̃dʁije	cond:vous
répondrai(ent)	ʁepɔ̃dʁɛ	cond:ils
>attendr(e)	atɑ̃dʁ	v	1
atten(ds)	atɑ̃	pr:je/tu
atten(d)	atɑ̃	pr:il
attendon(s)	atɑ̃dɔ̃	pr:nous
attende(z)	atɑ̃de	pr:vous
attend(ent)	atɑ̃d	pr:ils
attendai(s)	atɑ̃dɛ	imp:je/tu
attendai(t)	atɑ̃dɛ	imp:il
attendion(s)	atɑ̃djɔ̃	imp:nous
attendie(z)	atɑ̃dje	imp:vous
attendai(ent)	atɑ̃dɛ	imp:ils
attendan(t)	atɑ̃dɑ̃	ppr
attendu	atɑ̃dy	pp
attendu(e)	atɑ̃dy	pp:f
attendrai	atɑ̃dʁe	fut:je
attendra(s)	atɑ̃dʁa	fut:tu
attendra	atɑ̃dʁa	fut:il
attendron(s)	atɑ̃dʁɔ̃	fut:nous
attendre(z)	atɑ̃dʁe	fut:vous
attendron(t)	atɑ̃dʁɔ̃	fut:ils
attendrai(s)	atɑ̃dʁɛ	cond:je/tu
attendrai(t)	atɑ̃dʁɛ	cond:il
attendrion(s)	atɑ̃dʁijɔ̃	cond:nous
attendrie(z)	atɑ̃dʁije	cond:vous
attendrai(ent)	atɑ̃dʁɛ	cond:ils
>entendr(e)	ɑ̃tɑ̃dʁ	v	1
enten(ds)	ɑ̃tɑ̃	pr:je/tu
enten(d)	ɑ̃tɑ̃	pr:il
entendon(s)	ɑ̃tɑ̃dɔ̃	pr:nous
entende(z)	ɑ̃tɑ̃de	pr:vous
entend(ent)	ɑ̃tɑ̃d	pr:ils
entendai(s)	ɑ̃tɑ̃dɛ	imp:je/tu
entendai(t)	ɑ̃tɑ̃dɛ	imp:il
entendion(s)	ɑ̃tɑ̃djɔ̃	imp:nous
entendie(z)	ɑ̃tɑ̃dje	imp:vous
entendai(ent)	ɑ̃tɑ̃dɛ	imp:ils
entendan(t)	ɑ̃tɑ̃dɑ̃	ppr
entendu	ɑ̃tɑ̃dy	pp
entendu(e)	ɑ̃tɑ̃dy	pp:f
entendrai	ɑ̃tɑ̃dʁe	fut:je
entendra(s)	ɑ̃tɑ̃dʁa	fut:tu
entendra	ɑ̃tɑ̃dʁa	fut:il
entendron(s)	ɑ̃tɑ̃dʁɔ̃	fut:nous
entendre(z)	ɑ̃tɑ̃dʁe	fut:vous
entendron(t)	ɑ̃tɑ̃dʁɔ̃	fut:ils
entendrai(s)	ɑ̃tɑ̃dʁɛ	cond:je/tu
entendrai(t)	ɑ̃tɑ̃dʁɛ	cond:il
entendrion(s)	ɑ̃tɑ̃dʁijɔ̃	cond:nous
entendrie(z)	ɑ̃tɑ̃dʁije	cond:vous
entendrai(ent)	ɑ̃tɑ̃dʁɛ	cond:ils
>vendr(e)	vɑ̃dʁ	v	1
ven(ds)	vɑ̃	pr:je/tu
ven(d)	vɑ̃	pr:il
vendon(s)	vɑ̃dɔ̃	pr:nous
vende(z)	vɑ̃de	pr:vous
vend(ent)	vɑ̃d	pr:ils
vendai(s)	vɑ̃dɛ	imp:je/tu
vendai(t)	vɑ̃dɛ	imp:il
vendion(s)	vɑ̃djɔ̃	imp:nous
vendie(z)	vɑ̃dje	imp:vous
vendai(ent)	vɑ̃dɛ	imp:ils
vendan(t)	vɑ̃dɑ̃	ppr
vendu	vɑ̃dy	pp
vendu(e)	vɑ̃dy	pp:f
vendrai	vɑ̃dʁe	fut:je
vendra(s)	vɑ̃dʁa	fut:tu
vendra	vɑ̃dʁa	fut:il
vendron(s)	vɑ̃dʁɔ̃	fut:nous
vendre(z)	vɑ̃dʁe	fut:vous
vendron(t)	vɑ̃dʁɔ̃	fut:ils
vendrai(s)	vɑ̃dʁɛ	cond:je/tu
vendrai(t)	vɑ̃dʁɛ	cond:il
vendrion(s)	vɑ̃dʁijɔ̃	cond:nous
vendrie(z)	vɑ̃dʁije	cond:vous
vendrai(ent)	vɑ̃dʁɛ	cond:ils
>rendr(e)	ʁɑ̃dʁ	v	1
ren(ds)	ʁɑ̃	pr:je/tu
ren(d)	ʁɑ̃	pr:il
rendon(s)	ʁɑ̃dɔ̃	pr:nous
rende(z)	ʁɑ̃de	pr:vous
rend(ent)	ʁɑ̃d	pr:ils
rendai(s)	ʁɑ̃dɛ	imp:je/tu
rendai(t)	ʁɑ̃dɛ	imp:il
rendion(s)	ʁɑ̃djɔ̃	imp:nous
rendie(z)	ʁɑ̃dje	imp:vous
rendai(ent)	ʁɑ̃dɛ	imp:ils
rendan(t)	ʁɑ̃dɑ̃	ppr
rendu	ʁɑ̃dy	pp
rendu(e)	ʁɑ̃dy	pp:f
rendrai	ʁɑ̃dʁe	fut:je
rendra(s)	ʁɑ̃dʁa	fut:tu
rendra	ʁɑ̃dʁa	fut:il
rendron(s)	ʁɑ̃dʁɔ̃	fut:nous
rendre(z)	ʁɑ̃dʁe	fut:vous
rendron(t)	ʁɑ̃dʁɔ̃	fut:ils
rendrai(s)	ʁɑ̃dʁɛ	cond:je/tu
rendrai(t)	ʁɑ̃dʁɛ	cond:il
rendrion(s)	ʁɑ̃dʁijɔ̃	cond:nous
rendrie(z)	ʁɑ̃dʁije	cond:vous
rendrai(ent)	ʁɑ̃dʁɛ	cond:ils
>descendr(e)	desɑ̃dʁ	v	1
descen(ds)	desɑ̃	pr:je/tu
descen(d)	desɑ̃	pr:il
descendon(s)	desɑ̃dɔ̃	pr:nous
descende(z)	desɑ̃de	pr:vous
descend(ent)	desɑ̃d	pr:ils
descendai(s)	desɑ̃dɛ	imp:je/tu
descendai(t)	desɑ̃dɛ	imp:il
descendion(s)	desɑ̃djɔ̃	imp:nous
descendie(z)	desɑ̃dje	imp:vous
descendai(ent)	desɑ̃dɛ	imp:ils
descendan(t)	desɑ̃dɑ̃	ppr
descendu	desɑ̃dy	pp
descendu(e)	desɑ̃dy	pp:f
descendrai	desɑ̃dʁe	fut:je
descendra(s)	desɑ̃dʁa	fut:tu
descendra	desɑ̃dʁa	fut:il
descendron(s)	desɑ̃dʁɔ̃	fut:nous
descendre(z)	desɑ̃dʁe	fut:vous
descendron(t)	desɑ̃dʁɔ̃	fut:ils
descendrai(s)	desɑ̃dʁɛ	cond:je/tu
descendrai(t)	desɑ̃dʁɛ	cond:il
descendrion(s)	desɑ̃dʁijɔ̃	cond:nous
descendrie(z)	desɑ̃dʁije	cond:vous
descendrai(ent)	desɑ̃dʁɛ	cond:ils
>perdr(e)	pɛʁdʁ	v	1
per(ds)	pɛʁ	pr:je/tu
per(d)	pɛʁ	pr:il
perdon(s)	pɛʁdɔ̃	pr:nous
perde(z)	pɛʁde	pr:vous
perd(ent)	pɛʁd	pr:ils
perdai(s)	pɛʁdɛ	imp:je/tu
perdai(t)	pɛʁdɛ	imp:il
perdion(s)	pɛʁdjɔ̃	imp:nous
perdie(z)	pɛʁdje	imp:vous
perdai(ent)	pɛʁdɛ	imp:ils
perdan(t)	pɛʁdɑ̃	ppr
perdu	pɛʁdy	pp
perdu(e)	pɛʁdy	pp:f
perdrai	pɛʁdʁe	fut:je
perdra(s)	pɛʁdʁa	fut:tu
perdra	pɛʁdʁa	fut:il
perdron(s)	pɛʁdʁɔ̃	fut:nous
perdre(z)	pɛʁdʁe	fut:vous
perdron(t)	pɛʁdʁɔ̃	fut:ils
perdrai(s)	pɛʁdʁɛ	cond:je/tu
perdrai(t)	pɛʁdʁɛ	cond:il
perdrion(s)	pɛʁdʁijɔ̃	cond:nous
perdrie(z)	pɛʁdʁije	cond:vous
perdrai(ent)	pɛʁdʁɛ	cond:ils
>détendr(e)	detɑ̃dʁ	v	1
déten(ds)	detɑ̃	pr:je/tu
déten(d)	detɑ̃	pr:il
détendon(s)	detɑ̃dɔ̃	pr:nous
détende(z)	detɑ̃de	pr:vous
détend(ent)	detɑ̃d	pr:ils
détendai(s)	detɑ̃dɛ	imp:je/tu
détendai(t)	detɑ̃dɛ	imp:il
détendion(s)	detɑ̃djɔ̃	imp:nous
détendie(z)	detɑ̃dje	imp:vous
détendai(ent)	detɑ̃dɛ	imp:ils
détendan(t)	detɑ̃dɑ̃	ppr
détendu	detɑ̃dy	pp
détendu(e)	detɑ̃dy	pp:f
détendrai	detɑ̃dʁe	fut:je
détendra(s)	detɑ̃dʁa	fut:tu
détendra	detɑ̃dʁa	fut:il
détendron(s)	detɑ̃dʁɔ̃	fut:nous
détendre(z)	detɑ̃dʁe	fut:vous
détendron(t)	detɑ̃dʁɔ̃	fut:ils
détendrai(s)	detɑ̃dʁɛ	cond:je/tu
détendrai(t)	detɑ̃dʁɛ	cond:il
détendrion(s)	detɑ̃dʁijɔ̃	cond:nous
détendrie(z)	detɑ̃dʁije	cond:vous
détendrai(ent)	detɑ̃dʁɛ	cond:ils
>finir	finiʁ	v	1
fini(s)	fini	pr:je/tu
fini(t)	fini	pr:il
finisson(s)	finisɔ̃	pr:nous
finisse(z)	finise	pr:vous
finiss(ent)	finis	pr:ils
finissai(s)	finisɛ	imp:je/tu
finissai(t)	finisɛ	imp:il
finission(s)	finisjɔ̃	imp:nous
finissie(z)	finisje	imp:vous
finissai(ent)	finisɛ	imp:ils
finissan(t)	finisɑ̃	ppr
fini	fini	pp
fini(e)	fini	pp:f
finirai	finiʁe	fut:je
finira(s)	finiʁa	fut:tu
finira	finiʁa	fut:il
finiron(s)	finiʁɔ̃	fut:nous
finire(z)	finiʁe	fut:vous
finiron(t)	finiʁɔ̃	fut:ils
finirai(s)	finiʁɛ	cond:je/tu
finirai(t)	finiʁɛ	cond:il
finirion(s)	finiʁjɔ̃	cond:nous
finirie(z)	finiʁje	cond:vous
finirai(ent)	finiʁɛ	cond:ils
>choisir	ʃwaziʁ	v	1
choisi(s)	ʃwazi	pr:je/tu
choisi(t)	ʃwazi	pr:il
choisisson(s)	ʃwazisɔ̃	pr:nous
choisisse(z)	ʃwazise	pr:vous
choisiss(ent)	ʃwazis	pr:ils
choisissai(s)	ʃwazisɛ	imp:je/tu
choisissai(t)	ʃwazisɛ	imp:il
choisission(s)	ʃwazisjɔ̃	imp:nous
choisissie(z)	ʃwazisje	imp:vous
choisissai(ent)	ʃwazisɛ	imp:ils
choisissan(t)	ʃwazisɑ̃	ppr
choisi	ʃwazi	pp
choisi(e)	ʃwazi	pp:f
choisirai	ʃwaziʁe	fut:je
choisira(s)	ʃwaziʁa	fut:tu
choisira	ʃwaziʁa	fut:il
choisiron(s)	ʃwaziʁɔ̃	fut:nous
choisire(z)	ʃwaziʁe	fut:vous
choisiron(t)	ʃwaziʁɔ̃	fut:ils
choisirai(s)	ʃwaziʁɛ	cond:je/tu
choisirai(t)	ʃwaziʁɛ	cond:il
choisirion(s)	ʃwaziʁjɔ̃	cond:nous
choisirie(z)	ʃwaziʁje	cond:vous
choisirai(ent)	ʃwaziʁɛ	cond:ils
>réussir	ʁeysiʁ	v	1
réussi(s)	ʁeysi	pr:je/tu
réussi(t)	ʁeysi	pr:il
réussisson(s)	ʁeysisɔ̃	pr:nous
réussisse(z)	ʁeysise	pr:vous
réussiss(ent)	ʁeysis	pr:ils
réussissai(s)	ʁeysisɛ	imp:je/tu
réussissai(t)	ʁeysisɛ	imp:il
réussission(s)	ʁeysisjɔ̃	imp:nous
réussissie(z)	ʁeysisje	imp:vous
réussissai(ent)	ʁeysisɛ	imp:ils
réussissan(t)	ʁeysisɑ̃	ppr
réussi	ʁeysi	pp
réussi(e)	ʁeysi	pp:f
réussirai	ʁeysiʁe	fut:je
réussira(s)	ʁeysiʁa	fut:tu
réussira	ʁeysiʁa	fut:il
réussiron(s)	ʁeysiʁɔ̃	fut:nous
réussire(z)	ʁeysiʁe	fut:vous
réussiron(t)	ʁeysiʁɔ̃	fut:ils
réussirai(s)	ʁeysiʁɛ	cond:je/tu
réussirai(t)	ʁeysiʁɛ	cond:il
réussirion(s)	ʁeysiʁjɔ̃	cond:nous
réussirie(z)	ʁeysiʁje	cond:vous
réussirai(ent)	ʁeysiʁɛ	cond:ils
>remplir	ʁɑ̃pliʁ	v	1
rempli(s)	ʁɑ̃pli	pr:je/tu
rempli(t)	ʁɑ̃pli	pr:il
remplisson(s)	ʁɑ̃plisɔ̃	pr:nous
remplisse(z)	ʁɑ̃plise	pr:vous
rempliss(ent)	ʁɑ̃plis	pr:ils
remplissai(s)	ʁɑ̃plisɛ	imp:je/tu
remplissai(t)	ʁɑ̃plisɛ	imp:il
remplission(s)	ʁɑ̃plisjɔ̃	imp:nous
remplissie(z)	ʁɑ̃plisje	imp:vous
remplissai(ent)	ʁɑ̃plisɛ	imp:ils
remplissan(t)	ʁɑ̃plisɑ̃	ppr
rempli	ʁɑ̃pli	pp
rempli(e)	ʁɑ̃pli	pp:f
remplirai	ʁɑ̃pliʁe	fut:je
remplira(s)	ʁɑ̃pliʁa	fut:tu
remplira	ʁɑ̃pliʁa	fut:il
rempliron(s)	ʁɑ̃pliʁɔ̃	fut:nous
remplire(z)	ʁɑ̃pliʁe	fut:vous
rempliron(t)	ʁɑ̃pliʁɔ̃	fut:ils
remplirai(s)	ʁɑ̃pliʁɛ	cond:je/tu
remplirai(t)	ʁɑ̃pliʁɛ	cond:il
remplirion(s)	ʁɑ̃pliʁjɔ̃	cond:nous
remplirie(z)	ʁɑ̃pliʁje	cond:vous
remplirai(ent)	ʁɑ̃pliʁɛ	cond:ils
>réfléchir	ʁefleʃiʁ	v	1
réfléchi(s)	ʁefleʃi	pr:je/tu
réfléchi(t)	ʁefleʃi	pr:il
réfléchisson(s)	ʁefleʃisɔ̃	pr:nous
réfléchisse(z)	ʁefleʃise	pr:vous
réfléchiss(ent)	ʁefleʃis	pr:ils
réfléchissai(s)	ʁefleʃisɛ	imp:je/tu
réfléchissai(t)	ʁefleʃisɛ	imp:il
réfléchission(s)	ʁefleʃisjɔ̃	imp:nous
réfléchissie(z)	ʁefleʃisje	imp:vous
réfléchissai(ent)	ʁefleʃisɛ	imp:ils
réfléchissan(t)	ʁefleʃisɑ̃	ppr
réfléchi	ʁefleʃi	pp
réfléchi(e)	ʁefleʃi	pp:f
réfléchirai	ʁefleʃiʁe	fut:je
réfléchira(s)	ʁefleʃiʁa	fut:tu
réfléchira	ʁefleʃiʁa	fut:il
réfléchiron(s)	ʁefleʃiʁɔ̃	fut:nous
réfléchire(z)	ʁefleʃiʁe	fut:vous
réfléchiron(t)	ʁefleʃiʁɔ̃	fut:ils
réfléchirai(s)	ʁefleʃiʁɛ	cond:je/tu
réfléchirai(t)	ʁefleʃiʁɛ	cond:il
réfléchirion(s)	ʁefleʃiʁjɔ̃	cond:nous
réfléchirie(z)	ʁefleʃiʁje	cond:vous
réfléchirai(ent)	ʁefleʃiʁɛ	cond:ils
>grandir	gʁɑ̃diʁ	v	1
grandi(s)	gʁɑ̃di	pr:je/tu
grandi(t)	gʁɑ̃di	pr:il
grandisson(s)	gʁɑ̃disɔ̃	pr:nous
grandisse(z)	gʁɑ̃dise	pr:vous
grandiss(ent)	gʁɑ̃dis	pr:ils
grandissai(s)	gʁɑ̃disɛ	imp:je/tu
grandissai(t)	gʁɑ̃disɛ	imp:il
grandission(s)	gʁɑ̃disjɔ̃	imp:nous
grandissie(z)	gʁɑ̃disje	imp:vous
grandissai(ent)	gʁɑ̃disɛ	imp:ils
grandissan(t)	gʁɑ̃disɑ̃	ppr
grandi	gʁɑ̃di	pp
grandi(e)	gʁɑ̃di	pp:f
grandirai	gʁɑ̃diʁe	fut:je
grandira(s)	gʁɑ̃diʁa	fut:tu
grandira	gʁɑ̃diʁa	fut:il
grandiron(s)	gʁɑ̃diʁɔ̃	fut:nous
grandire(z)	gʁɑ̃diʁe	fut:vous
grandiron(t)	gʁɑ̃diʁɔ̃	fut:ils
grandirai(s)	gʁɑ̃diʁɛ	cond:je/tu
grandirai(t)	gʁɑ̃diʁɛ	cond:il
grandirion(s)	gʁɑ̃diʁjɔ̃	cond:nous
grandirie(z)	gʁɑ̃diʁje	cond:vous
grandirai(ent)	gʁɑ̃diʁɛ	cond:ils
>grossir	gʁosiʁ	v	1
grossi(s)	gʁosi	pr:je/tu
grossi(t)	gʁosi	pr:il
grossisson(s)	gʁosisɔ̃	pr:nous
grossisse(z)	gʁosise	pr:vous
grossiss(ent)	gʁosis	pr:ils
grossissai(s)	gʁosisɛ	imp:je/tu
grossissai(t)	gʁosisɛ	imp:il
grossission(s)	gʁosisjɔ̃	imp:nous
grossissie(z)	gʁosisje	imp:vous
grossissai(ent)	gʁosisɛ	imp:ils
grossissan(t)	gʁosisɑ̃	ppr
grossi	gʁosi	pp
grossi(e)	gʁosi	pp:f
grossirai	gʁosiʁe	fut:je
grossira(s)	gʁosiʁa	fut:tu
grossira	gʁosiʁa	fut:il
grossiron(s)	gʁosiʁɔ̃	fut:nous
grossire(z)	gʁosiʁe	fut:vous
grossiron(t)	gʁosiʁɔ̃	fut:ils
grossirai(s)	gʁosiʁɛ	cond:je/tu
grossirai(t)	gʁosiʁɛ	cond:il
grossirion(s)	gʁosiʁjɔ̃	cond:nous
grossirie(z)	gʁosiʁje	cond:vous
grossirai(ent)	gʁosiʁɛ	cond:ils
>maigrir	megʁiʁ	v	1
maigri(s)	megʁi	pr:je/tu
maigri(t)	megʁi	pr:il
maigrisson(s)	megʁisɔ̃	pr:nous
maigrisse(z)	megʁise	pr:vous
maigriss(ent)	megʁis	pr:ils
maigrissai(s)	megʁisɛ	imp:je/tu
maigrissai(t)	megʁisɛ	imp:il
maigrission(s)	megʁisjɔ̃	imp:nous
maigrissie(z)	megʁisje	imp:vous
maigrissai(ent)	megʁisɛ	imp:ils
maigrissan(t)	megʁisɑ̃	ppr
maigri	megʁi	pp
maigri(e)	megʁi	pp:f
maigrirai	megʁiʁe	fut:je
maigrira(s)	megʁiʁa	fut:tu
maigrira	megʁiʁa	fut:il
maigriron(s)	megʁiʁɔ̃	fut:nous
maigrire(z)	megʁiʁe	fut:vous
maigriron(t)	megʁiʁɔ̃	fut:ils
maigrirai(s)	megʁiʁɛ	cond:je/tu
maigrirai(t)	megʁiʁɛ	cond:il
maigririon(s)	megʁiʁjɔ̃	cond:nous
maigririe(z)	megʁiʁje	cond:vous
maigrirai(ent)	megʁiʁɛ	cond:ils
>vieillir	vjejiʁ	v	1
vieilli(s)	vjeji	pr:je/tu
vieilli(t)	vjeji	pr:il
vieillisson(s)	vjejisɔ̃	pr:nous
vieillisse(z)	vjejise	pr:vous
vieilliss(ent)	vjejis	pr:ils
vieillissai(s)	vjejisɛ	imp:je/tu
vieillissai(t)	vjejisɛ	imp:il
vieillission(s)	vjejisjɔ̃	imp:nous
vieillissie(z)	vjejisje	imp:vous
vieillissai(ent)	vjejisɛ	imp:ils
vieillissan(t)	vjejisɑ̃	ppr
vieilli	vjeji	pp
vieilli(e)	vjeji	pp:f
vieillirai	vjejiʁe	fut:je
vieillira(s)	vjejiʁa	fut:tu
vieillira	vjejiʁa	fut:il
vieilliron(s)	vjejiʁɔ̃	fut:nous
vieillire(z)	vjejiʁe	fut:vous
vieilliron(t)	vjejiʁɔ̃	fut:ils
vieillirai(s)	vjejiʁɛ	cond:je/tu
vieillirai(t)	vjejiʁɛ	cond:il
vieillirion(s)	vjejiʁjɔ̃	cond:nous
vieillirie(z)	vjejiʁje	cond:vous
vieillirai(ent)	vjejiʁɛ	cond:ils
>réunir	ʁeyniʁ	v	1
réuni(s)	ʁeyni	pr:je/tu
réuni(t)	ʁeyni	pr:il
réunisson(s)	ʁeynisɔ̃	pr:nous
réunisse(z)	ʁeynise	pr:vous
réuniss(ent)	ʁeynis	pr:ils
réunissai(s)	ʁeynisɛ	imp:je/tu
réunissai(t)	ʁeynisɛ	imp:il
réunission(s)	ʁeynisjɔ̃	imp:nous
réunissie(z)	ʁeynisje	imp:vous
réunissai(ent)	ʁeynisɛ	imp:ils
réunissan(t)	ʁeynisɑ̃	ppr
réuni	ʁeyni	pp
réuni(e)	ʁeyni	pp:f
réunirai	ʁeyniʁe	fut:je
réunira(s)	ʁeyniʁa	fut:tu
réunira	ʁeyniʁa	fut:il
réuniron(s)	ʁeyniʁɔ̃	fut:nous
réunire(z)	ʁeyniʁe	fut:vous
réuniron(t)	ʁeyniʁɔ̃	fut:ils
réunirai(s)	ʁeyniʁɛ	cond:je/tu
réunirai(t)	ʁeyniʁɛ	cond:il
réunirion(s)	ʁeyniʁjɔ̃	cond:nous
réunirie(z)	ʁeyniʁje	cond:vous
réunirai(ent)	ʁeyniʁɛ	cond:ils
>nourrir	nuʁiʁ	v	1
nourri(s)	nuʁi	pr:je/tu
nourri(t)	nuʁi	pr:il
nourrisson(s)	nuʁisɔ̃	pr:nous
nourrisse(z)	nuʁise	pr:vous
nourriss(ent)	nuʁis	pr:ils
nourrissai(s)	nuʁisɛ	imp:je/tu
nourrissai(t)	nuʁisɛ	imp:il
nourrission(s)	nuʁisjɔ̃	imp:nous
nourrissie(z)	nuʁisje	imp:vous
nourrissai(ent)	nuʁisɛ	imp:ils
nourrissan(t)	nuʁisɑ̃	ppr
nourri	nuʁi	pp
nourri(e)	nuʁi	pp:f
nourrirai	nuʁiʁe	fut:je
nourrira(s)	nuʁiʁa	fut:tu
nourrira	nuʁiʁa	fut:il
nourriron(s)	nuʁiʁɔ̃	fut:nous
nourrire(z)	nuʁiʁe	fut:vous
nourriron(t)	nuʁiʁɔ̃	fut:ils
nourrirai(s)	nuʁiʁɛ	cond:je/tu
nourrirai(t)	nuʁiʁɛ	cond:il
nourririon(s)	nuʁiʁjɔ̃	cond:nous
nourririe(z)	nuʁiʁje	cond:vous
nourrirai(ent)	nuʁiʁɛ	cond:ils
>agir	aʒiʁ	v	1
agi(s)	aʒi	pr:je/tu
agi(t)	aʒi	pr:il
agisson(s)	aʒisɔ̃	pr:nous
agisse(z)	aʒise	pr:vous
agiss(ent)	aʒis	pr:ils
agissai(s)	aʒisɛ	imp:je/tu
agissai(t)	aʒisɛ	imp:il
agission(s)	aʒisjɔ̃	imp:nous
agissie(z)	aʒisje	imp:vous
agissai(ent)	aʒisɛ	imp:ils
agissan(t)	aʒisɑ̃	ppr
agi	aʒi	pp
agi(e)	aʒi	pp:f
agirai	aʒiʁe	fut:je
agira(s)	aʒiʁa	fut:tu
agira	aʒiʁa	fut:il
agiron(s)	aʒiʁɔ̃	fut:nous
agire(z)	aʒiʁe	fut:vous
agiron(t)	aʒiʁɔ̃	fut:ils
agirai(s)	aʒiʁɛ	cond:je/tu
agirai(t)	aʒiʁɛ	cond:il
agirion(s)	aʒiʁjɔ̃	cond:nous
agirie(z)	aʒiʁje	cond:vous
agirai(ent)	aʒiʁɛ	cond:ils
>guérir	geʁiʁ	v	1
guéri(s)	geʁi	pr:je/tu
guéri(t)	geʁi	pr:il
guérisson(s)	geʁisɔ̃	pr:nous
guérisse(z)	geʁise	pr:vous
guériss(ent)	geʁis	pr:ils
guérissai(s)	geʁisɛ	imp:je/tu
guérissai(t)	geʁisɛ	imp:il
guérission(s)	geʁisjɔ̃	imp:nous
guérissie(z)	geʁisje	imp:vous
guérissai(ent)	geʁisɛ	imp:ils
guérissan(t)	geʁisɑ̃	ppr
guéri	geʁi	pp
guéri(e)	geʁi	pp:f
guérirai	geʁiʁe	fut:je
guérira(s)	geʁiʁa	fut:tu
guérira	geʁiʁa	fut:il
guériron(s)	geʁiʁɔ̃	fut:nous
guérire(z)	geʁiʁe	fut:vous
guériron(t)	geʁiʁɔ̃	fut:ils
guérirai(s)	geʁiʁɛ	cond:je/tu
guérirai(t)	geʁiʁɛ	cond:il
guéririon(s)	geʁiʁjɔ̃	cond:nous
guéririe(z)	geʁiʁje	cond:vous
guérirai(ent)	geʁiʁɛ	cond:ils
>rougir	ʁuʒiʁ	v	1
rougi(s)	ʁuʒi	pr:je/tu
rougi(t)	ʁuʒi	pr:il
rougisson(s)	ʁuʒisɔ̃	pr:nous
rougisse(z)	ʁuʒise	pr:vous
rougiss(ent)	ʁuʒis	pr:ils
rougissai(s)	ʁuʒisɛ	imp:je/tu
rougissai(t)	ʁuʒisɛ	imp:il
rougission(s)	ʁuʒisjɔ̃	imp:nous
rougissie(z)	ʁuʒisje	imp:vous
rougissai(ent)	ʁuʒisɛ	imp:ils
rougissan(t)	ʁuʒisɑ̃	ppr
rougi	ʁuʒi	pp
rougi(e)	ʁuʒi	pp:f
rougirai	ʁuʒiʁe	fut:je
rougira(s)	ʁuʒiʁa	fut:tu
rougira	ʁuʒiʁa	fut:il
rougiron(s)	ʁuʒiʁɔ̃	fut:nous
rougire(z)	ʁuʒiʁe	fut:vous
rougiron(t)	ʁuʒiʁɔ̃	fut:ils
rougirai(s)	ʁuʒiʁɛ	cond:je/tu
rougirai(t)	ʁuʒiʁɛ	cond:il
rougirion(s)	ʁuʒiʁjɔ̃	cond:nous
rougirie(z)	ʁuʒiʁje	cond:vous
rougirai(ent)	ʁuʒiʁɛ	cond:ils
>ralentir	ʁalɑ̃tiʁ	v	1
ralenti(s)	ʁalɑ̃ti	pr:je/tu
ralenti(t)	ʁalɑ̃ti	pr:il
ralentisson(s)	ʁalɑ̃tisɔ̃	pr:nous
ralentisse(z)	ʁalɑ̃tise	pr:vous
ralentiss(ent)	ʁalɑ̃tis	pr:ils
ralentissai(s)	ʁalɑ̃tisɛ	imp:je/tu
ralentissai(t)	ʁalɑ̃tisɛ	imp:il
ralentission(s)	ʁalɑ̃tisjɔ̃	imp:nous
ralentissie(z)	ʁalɑ̃tisje	imp:vous
ralentissai(ent)	ʁalɑ̃tisɛ	imp:ils
ralentissan(t)	ʁalɑ̃tisɑ̃	ppr
ralenti	ʁalɑ̃ti	pp
ralenti(e)	ʁalɑ̃ti	pp:f
ralentirai	ʁalɑ̃tiʁe	fut:je
ralentira(s)	ʁalɑ̃tiʁa	fut:tu
ralentira	ʁalɑ̃tiʁa	fut:il
ralentiron(s)	ʁalɑ̃tiʁɔ̃	fut:nous
ralentire(z)	ʁalɑ̃tiʁe	fut:vous
ralentiron(t)	ʁalɑ̃tiʁɔ̃	fut:ils
ralentirai(s)	ʁalɑ̃tiʁɛ	cond:je/tu
ralentirai(t)	ʁalɑ̃tiʁɛ	cond:il
ralentirion(s)	ʁalɑ̃tiʁjɔ̃	cond:nous
ralentirie(z)	ʁalɑ̃tiʁje	cond:vous
ralentirai(ent)	ʁalɑ̃tiʁɛ	cond:ils
>réagir	ʁeaʒiʁ	v	1
réagi(s)	ʁeaʒi	pr:je/tu
réagi(t)	ʁeaʒi	pr:il
réagisson(s)	ʁeaʒisɔ̃	pr:nous
réagisse(z)	ʁeaʒise	pr:vous
réagiss(ent)	ʁeaʒis	pr:ils
réagissai(s)	ʁeaʒisɛ	imp:je/tu
réagissai(t)	ʁeaʒisɛ	imp:il
réagission(s)	ʁeaʒisjɔ̃	imp:nous
réagissie(z)	ʁeaʒisje	imp:vous
réagissai(ent)	ʁeaʒisɛ	imp:ils
réagissan(t)	ʁeaʒisɑ̃	ppr
réagi	ʁeaʒi	pp
réagi(e)	ʁeaʒi	pp:f
réagirai	ʁeaʒiʁe	fut:je
réagira(s)	ʁeaʒiʁa	fut:tu
réagira	ʁeaʒiʁa	fut:il
réagiron(s)	ʁeaʒiʁɔ̃	fut:nous
réagire(z)	ʁeaʒiʁe	fut:vous
réagiron(t)	ʁeaʒiʁɔ̃	fut:ils
réagirai(s)	ʁeaʒiʁɛ	cond:je/tu
réagirai(t)	ʁeaʒiʁɛ	cond:il
réagirion(s)	ʁeaʒiʁjɔ̃	cond:nous
réagirie(z)	ʁeaʒiʁje	cond:vous
réagirai(ent)	ʁeaʒiʁɛ	cond:ils
>réveille(r)	ʁevɛje	v	1
réveill(e)	ʁevɛj	pr:je/il
réveill(es)	ʁevɛj	pr:tu
réveill(ent)	ʁevɛj	pr:ils
réveillai(s)	ʁevɛjɛ	imp:je/tu
réveillai(t)	ʁevɛjɛ	imp:il
réveillion(s)	ʁevɛjjɔ̃	imp:nous
réveillie(z)	ʁevɛjje	imp:vous
réveillai(ent)	ʁevɛjɛ	imp:ils
réveillon(s)	ʁevɛjɔ̃	pr:nous
réveille(z)	ʁevɛje	pr:vous
réveillan(t)	ʁevɛjɑ̃	ppr
réveillé	ʁevɛje	pp
réveillé(e)	ʁevɛje	pp:f
réveillerai	ʁevɛjʁe	fut:je
réveillera(s)	ʁevɛjʁa	fut:tu
réveillera	ʁevɛjʁa	fut:il
réveilleron(s)	ʁevɛjʁɔ̃	fut:nous
réveillere(z)	ʁevɛjʁe	fut:vous
réveilleron(t)	ʁevɛjʁɔ̃	fut:ils
réveillerai(s)	ʁevɛjʁɛ	cond:je/tu
réveillerai(t)	ʁevɛjʁɛ	cond:il
réveillerion(s)	ʁevɛjəʁjɔ̃	cond:nous
réveillerie(z)	ʁevɛjəʁje	cond:vous
réveillerai(ent)	ʁevɛjʁɛ	cond:ils
>couche(r)	kuʃe	v	1
couch(e)	kuʃ	pr:je/il
couch(es)	kuʃ	pr:tu
couch(ent)	kuʃ	pr:ils
couchai(s)	kuʃɛ	imp:je/tu
couchai(t)	kuʃɛ	imp:il
couchion(s)	kuʃjɔ̃	imp:nous
couchie(z)	kuʃje	imp:vous
couchai(ent)	kuʃɛ	imp:ils
couchon(s)	kuʃɔ̃	pr:nous
couche(z)	kuʃe	pr:vous
couchan(t)	kuʃɑ̃	ppr
couché	kuʃe	pp
couché(e)	kuʃe	pp:f
coucherai	kuʃʁe	fut:je
couchera(s)	kuʃʁa	fut:tu
couchera	kuʃʁa	fut:il
coucheron(s)	kuʃʁɔ̃	fut:nous
couchere(z)	kuʃʁe	fut:vous
coucheron(t)	kuʃʁɔ̃	fut:ils
coucherai(s)	kuʃʁɛ	cond:je/tu
coucherai(t)	kuʃʁɛ	cond:il
coucherion(s)	kuʃəʁjɔ̃	cond:nous
coucherie(z)	kuʃəʁje	cond:vous
coucherai(ent)	kuʃʁɛ	cond:ils
>lave(r)	lave	v	1
lav(e)	lav	pr:je/il
lav(es)	lav	pr:tu
lav(ent)	lav	pr:ils
lavai(s)	lavɛ	imp:je/tu
lavai(t)	lavɛ	imp:il
lavion(s)	lavjɔ̃	imp:nous
lavie(z)	lavje	imp:vous
lavai(ent)	lavɛ	imp:ils
lavon(s)	lavɔ̃	pr:nous
lave(z)	lave	pr:vous
lavan(t)	lavɑ̃	ppr
lavé	lave	pp
lavé(e)	lave	pp:f
laverai	lavʁe	fut:je
lavera(s)	lavʁa	fut:tu
lavera	lavʁa	fut:il
laveron(s)	lavʁɔ̃	fut:nous
lavere(z)	lavʁe	fut:vous
laveron(t)	lavʁɔ̃	fut:ils
laverai(s)	lavʁɛ	cond:je/tu
laverai(t)	lavʁɛ	cond:il
laverion(s)	lavəʁjɔ̃	cond:nous
laverie(z)	lavəʁje	cond:vous
laverai(ent)	lavʁɛ	cond:ils
>douche(r)	duʃe	v	1
douch(e)	duʃ	pr:je/il
douch(es)	duʃ	pr:tu
douch(ent)	duʃ	pr:ils
douchai(s)	duʃɛ	imp:je/tu
douchai(t)	duʃɛ	imp:il
douchion(s)	duʃjɔ̃	imp:nous
douchie(z)	duʃje	imp:vous
douchai(ent)	duʃɛ	imp:ils
douchon(s)	duʃɔ̃	pr:nous
douche(z)	duʃe	pr:vous
douchan(t)	duʃɑ̃	ppr
douché	duʃe	pp
douché(e)	duʃe	pp:f
doucherai	duʃʁe	fut:je
douchera(s)	duʃʁa	fut:tu
douchera	duʃʁa	fut:il
doucheron(s)	duʃʁɔ̃	fut:nous
douchere(z)	duʃʁe	fut:vous
doucheron(t)	duʃʁɔ̃	fut:ils
doucherai(s)	duʃʁɛ	cond:je/tu
doucherai(t)	duʃʁɛ	cond:il
doucherion(s)	duʃəʁjɔ̃	cond:nous
doucherie(z)	duʃəʁje	cond:vous
doucherai(ent)	duʃʁɛ	cond:ils
>(h)abille(r)	abije	v	1
(h)abill(e)	abij	pr:je/il
(h)abill(es)	abij	pr:tu
(h)abill(ent)	abij	pr:ils
(h)abillai(s)	abijɛ	imp:je/tu
(h)abillai(t)	abijɛ	imp:il
(h)abillion(s)	abijjɔ̃	imp:nous
(h)abillie(z)	abijje	imp:vous
(h)abillai(ent)	abijɛ	imp:ils
(h)abillon(s)	abijɔ̃	pr:nous
(h)abille(z)	abije	pr:vous
(h)abillan(t)	abijɑ̃	ppr
(h)abillé	abije	pp
(h)abillé(e)	abije	pp:f
(h)abillerai	abijʁe	fut:je
(h)abillera(s)	abijʁa	fut:tu
(h)abillera	abijʁa	fut:il
(h)abilleron(s)	abijʁɔ̃	fut:nous
(h)abillere(z)	abijʁe	fut:vous
(h)abilleron(t)	abijʁɔ̃	fut:ils
(h)abillerai(s)	abijʁɛ	cond:je/tu
(h)abillerai(t)	abijʁɛ	cond:il
(h)abillerion(s)	abijəʁjɔ̃	cond:nous
(h)abillerie(z)	abijəʁje	cond:vous
(h)abillerai(ent)	abijʁɛ	cond:ils
>repose(r)	ʁəpoze	v	1
repos(e)	ʁəpoz	pr:je/il
repos(es)	ʁəpoz	pr:tu
repos(ent)	ʁəpoz	pr:ils
reposai(s)	ʁəpozɛ	imp:je/tu
reposai(t)	ʁəpozɛ	imp:il
reposion(s)	ʁəpozjɔ̃	imp:nous
reposie(z)	ʁəpozje	imp:vous
reposai(ent)	ʁəpozɛ	imp:ils
reposon(s)	ʁəpozɔ̃	pr:nous
repose(z)	ʁəpoze	pr:vous
reposan(t)	ʁəpozɑ̃	ppr
reposé	ʁəpoze	pp
reposé(e)	ʁəpoze	pp:f
reposerai	ʁəpozʁe	fut:je
reposera(s)	ʁəpozʁa	fut:tu
reposera	ʁəpozʁa	fut:il
reposeron(s)	ʁəpozʁɔ̃	fut:nous
reposere(z)	ʁəpozʁe	fut:vous
reposeron(t)	ʁəpozʁɔ̃	fut:ils
reposerai(s)	ʁəpozʁɛ	cond:je/tu
reposerai(t)	ʁəpozʁɛ	cond:il
reposerion(s)	ʁəpozəʁjɔ̃	cond:nous
reposerie(z)	ʁəpozəʁje	cond:vous
reposerai(ent)	ʁəpozʁɛ	cond:ils
>dépêche(r)	depɛʃe	v	1
dépêch(e)	depɛʃ	pr:je/il
dépêch(es)	depɛʃ	pr:tu
dépêch(ent)	depɛʃ	pr:ils
dépêchai(s)	depɛʃɛ	imp:je/tu
dépêchai(t)	depɛʃɛ	imp:il
dépêchion(s)	depɛʃjɔ̃	imp:nous
dépêchie(z)	depɛʃje	imp:vous
dépêchai(ent)	depɛʃɛ	imp:ils
dépêchon(s)	depɛʃɔ̃	pr:nous
dépêche(z)	depɛʃe	pr:vous
dépêchan(t)	depɛʃɑ̃	ppr
dépêché	depɛʃe	pp
dépêché(e)	depɛʃe	pp:f
dépêcherai	depɛʃʁe	fut:je
dépêchera(s)	depɛʃʁa	fut:tu
dépêchera	depɛʃʁa	fut:il
dépêcheron(s)	depɛʃʁɔ̃	fut:nous
dépêchere(z)	depɛʃʁe	fut:vous
dépêcheron(t)	depɛʃʁɔ̃	fut:ils
dépêcherai(s)	depɛʃʁɛ	cond:je/tu
dépêcherai(t)	depɛʃʁɛ	cond:il
dépêcherion(s)	depɛʃəʁjɔ̃	cond:nous
dépêcherie(z)	depɛʃəʁje	cond:vous
dépêcherai(ent)	depɛʃʁɛ	cond:ils
>occupe(r)	ɔkype	v	1
occup(e)	ɔkyp	pr:je/il
occup(es)	ɔkyp	pr:tu
occup(ent)	ɔkyp	pr:ils
occupai(s)	ɔkypɛ	imp:je/tu
occupai(t)	ɔkypɛ	imp:il
occupion(s)	ɔkypjɔ̃	imp:nous
occupie(z)	ɔkypje	imp:vous
occupai(ent)	ɔkypɛ	imp:ils
occupon(s)	ɔkypɔ̃	pr:nous
occupe(z)	ɔkype	pr:vous
occupan(t)	ɔkypɑ̃	ppr
occupé	ɔkype	pp
occupé(e)	ɔkype	pp:f
occuperai	ɔkypʁe	fut:je
occupera(s)	ɔkypʁa	fut:tu
occupera	ɔkypʁa	fut:il
occuperon(s)	ɔkypʁɔ̃	fut:nous
occupere(z)	ɔkypʁe	fut:vous
occuperon(t)	ɔkypʁɔ̃	fut:ils
occuperai(s)	ɔkypʁɛ	cond:je/tu
occuperai(t)	ɔkypʁɛ	cond:il
occuperion(s)	ɔkypəʁjɔ̃	cond:nous
occuperie(z)	ɔkypəʁje	cond:vous
occuperai(ent)	ɔkypʁɛ	cond:ils
>amuse(r)	amyze	v	1
amus(e)	amyz	pr:je/il
amus(es)	amyz	pr:tu
amus(ent)	amyz	pr:ils
amusai(s)	amyzɛ	imp:je/tu
amusai(t)	amyzɛ	imp:il
amusion(s)	amyzjɔ̃	imp:nous
amusie(z)	amyzje	imp:vous
amusai(ent)	amyzɛ	imp:ils
amuson(s)	amyzɔ̃	pr:nous
amuse(z)	amyze	pr:vous
amusan(t)	amyzɑ̃	ppr
amusé	amyze	pp
amusé(e)	amyze	pp:f
amuserai	amyzʁe	fut:je
amusera(s)	amyzʁa	fut:tu
amusera	amyzʁa	fut:il
amuseron(s)	amyzʁɔ̃	fut:nous
amusere(z)	amyzʁe	fut:vous
amuseron(t)	amyzʁɔ̃	fut:ils
amuserai(s)	amyzʁɛ	cond:je/tu
amuserai(t)	amyzʁɛ	cond:il
amuserion(s)	amyzəʁjɔ̃	cond:nous
amuserie(z)	amyzəʁje	cond:vous
amuserai(ent)	amyzʁɛ	cond:ils
>ennuye(r)	ɑ̃nɥije	v	1
ennui(e)	ɑ̃nɥi	pr:je/il
ennui(es)	ɑ̃nɥi	pr:tu
ennui(ent)	ɑ̃nɥi	pr:ils
ennuyai(s)	ɑ̃nɥijɛ	imp:je/tu
ennuyai(t)	ɑ̃nɥijɛ	imp:il
ennuyion(s)	ɑ̃nɥijjɔ̃	imp:nous
ennuyie(z)	ɑ̃nɥijje	imp:vous
ennuyai(ent)	ɑ̃nɥijɛ	imp:ils
ennuyon(s)	ɑ̃nɥijɔ̃	pr:nous
ennuye(z)	ɑ̃nɥije	pr:vous
ennuyan(t)	ɑ̃nɥijɑ̃	ppr
ennuyé	ɑ̃nɥije	pp
ennuyé(e)	ɑ̃nɥije	pp:f
ennuierai	ɑ̃nɥiʁe	fut:je
ennuiera(s)	ɑ̃nɥiʁa	fut:tu
ennuiera	ɑ̃nɥiʁa	fut:il
ennuieron(s)	ɑ̃nɥiʁɔ̃	fut:nous
ennuiere(z)	ɑ̃nɥiʁe	fut:vous
ennuieron(t)	ɑ̃nɥiʁɔ̃	fut:ils
ennuierai(s)	ɑ̃nɥiʁɛ	cond:je/tu
ennuierai(t)	ɑ̃nɥiʁɛ	cond:il
ennuierion(s)	ɑ̃nɥiʁjɔ̃	cond:nous
ennuierie(z)	ɑ̃nɥiʁje	cond:vous
ennuierai(ent)	ɑ̃nɥiʁɛ	cond:ils
>excuse(r)	ɛkskyze	v	1
excus(e)	ɛkskyz	pr:je/il
excus(es)	ɛkskyz	pr:tu
excus(ent)	ɛkskyz	pr:ils
excusai(s)	ɛkskyzɛ	imp:je/tu
excusai(t)	ɛkskyzɛ	imp:il
excusion(s)	ɛkskyzjɔ̃	imp:nous
excusie(z)	ɛkskyzje	imp:vous
excusai(ent)	ɛkskyzɛ	imp:ils
excuson(s)	ɛkskyzɔ̃	pr:nous
excuse(z)	ɛkskyze	pr:vous
excusan(t)	ɛkskyzɑ̃	ppr
excusé	ɛkskyze	pp
excusé(e)	ɛkskyze	pp:f
excuserai	ɛkskyzʁe	fut:je
excusera(s)	ɛkskyzʁa	fut:tu
excusera	ɛkskyzʁa	fut:il
excuseron(s)	ɛkskyzʁɔ̃	fut:nous
excusere(z)	ɛkskyzʁe	fut:vous
excuseron(t)	ɛkskyzʁɔ̃	fut:ils
excuserai(s)	ɛkskyzʁɛ	cond:je/tu
excuserai(t)	ɛkskyzʁɛ	cond:il
excuserion(s)	ɛkskyzəʁjɔ̃	cond:nous
excuserie(z)	ɛkskyzəʁje	cond:vous
excuserai(ent)	ɛkskyzʁɛ	cond:ils
>inquiéte(r)	ɛ̃kjete	v	1
inquièt(e)	ɛ̃kjɛt	pr:je/il
inquièt(es)	ɛ̃kjɛt	pr:tu
inquièt(ent)	ɛ̃kjɛt	pr:ils
inquiétai(s)	ɛ̃kjetɛ	imp:je/tu
inquiétai(t)	ɛ̃kjetɛ	imp:il
inquiétion(s)	ɛ̃kjetjɔ̃	imp:nous
inquiétie(z)	ɛ̃kjetje	imp:vous
inquiétai(ent)	ɛ̃kjetɛ	imp:ils
inquiéton(s)	ɛ̃kjetɔ̃	pr:nous
inquiéte(z)	ɛ̃kjete	pr:vous
inquiétan(t)	ɛ̃kjetɑ̃	ppr
inquiété	ɛ̃kjete	pp
inquiété(e)	ɛ̃kjete	pp:f
inquiéterai	ɛ̃kjetʁe	fut:je
inquiétera(s)	ɛ̃kjetʁa	fut:tu
inquiétera	ɛ̃kjetʁa	fut:il
inquiéteron(s)	ɛ̃kjetʁɔ̃	fut:nous
inquiétere(z)	ɛ̃kjetʁe	fut:vous
inquiéteron(t)	ɛ̃kjetʁɔ̃	fut:ils
inquiéterai(s)	ɛ̃kjetʁɛ	cond:je/tu
inquiéterai(t)	ɛ̃kjetʁɛ	cond:il
inquiéterion(s)	ɛ̃kjetəʁjɔ̃	cond:nous
inquiéterie(z)	ɛ̃kjetəʁje	cond:vous
inquiéterai(ent)	ɛ̃kjetʁɛ	cond:ils
>entraîne(r)	ɑ̃tʁɛne	v	1
entraîn(e)	ɑ̃tʁɛn	pr:je/il
entraîn(es)	ɑ̃tʁɛn	pr:tu
entraîn(ent)	ɑ̃tʁɛn	pr:ils
entraînai(s)	ɑ̃tʁɛnɛ	imp:je/tu
entraînai(t)	ɑ̃tʁɛnɛ	imp:il
entraînion(s)	ɑ̃tʁɛnjɔ̃	imp:nous
entraînie(z)	ɑ̃tʁɛnje	imp:vous
entraînai(ent)	ɑ̃tʁɛnɛ	imp:ils
entraînon(s)	ɑ̃tʁɛnɔ̃	pr:nous
entraîne(z)	ɑ̃tʁɛne	pr:vous
entraînan(t)	ɑ̃tʁɛnɑ̃	ppr
entraîné	ɑ̃tʁɛne	pp
entraîné(e)	ɑ̃tʁɛne	pp:f
entraînerai	ɑ̃tʁɛnʁe	fut:je
entraînera(s)	ɑ̃tʁɛnʁa	fut:tu
entraînera	ɑ̃tʁɛnʁa	fut:il
entraîneron(s)	ɑ̃tʁɛnʁɔ̃	fut:nous
entraînere(z)	ɑ̃tʁɛnʁe	fut:vous
entraîneron(t)	ɑ̃tʁɛnʁɔ̃	fut:ils
entraînerai(s)	ɑ̃tʁɛnʁɛ	cond:je/tu
entraînerai(t)	ɑ̃tʁɛnʁɛ	cond:il
entraînerion(s)	ɑ̃tʁɛnəʁjɔ̃	cond:nous
entraînerie(z)	ɑ̃tʁɛnəʁje	cond:vous
entraînerai(ent)	ɑ̃tʁɛnʁɛ	cond:ils
>déplace(r)	deplase	v	1
déplac(e)	deplas	pr:je/il
déplac(es)	deplas	pr:tu
déplac(ent)	deplas	pr:ils
déplaçai(s)	deplasɛ	imp:je/tu
déplaçai(t)	deplasɛ	imp:il
déplacion(s)	deplasjɔ̃	imp:nous
déplacie(z)	deplasje	imp:vous
déplaçai(ent)	deplasɛ	imp:ils
déplaçon(s)	deplasɔ̃	pr:nous
déplace(z)	deplase	pr:vous
déplaçan(t)	deplasɑ̃	ppr
déplacé	deplase	pp
déplacé(e)	deplase	pp:f
déplacerai	deplasʁe	fut:je
déplacera(s)	deplasʁa	fut:tu
déplacera	deplasʁa	fut:il
déplaceron(s)	deplasʁɔ̃	fut:nous
déplacere(z)	deplasʁe	fut:vous
déplaceron(t)	deplasʁɔ̃	fut:ils
déplacerai(s)	deplasʁɛ	cond:je/tu
déplacerai(t)	deplasʁɛ	cond:il
déplacerion(s)	deplasəʁjɔ̃	cond:nous
déplacerie(z)	deplasəʁje	cond:vous
déplacerai(ent)	deplasʁɛ	cond:ils
>arrache(r)	aʁaʃe	v	1
arrach(e)	aʁaʃ	pr:je/il
arrach(es)	aʁaʃ	pr:tu
arrach(ent)	aʁaʃ	pr:ils
arrachai(s)	aʁaʃɛ	imp:je/tu
arrachai(t)	aʁaʃɛ	imp:il
arrachion(s)	aʁaʃjɔ̃	imp:nous
arrachie(z)	aʁaʃje	imp:vous
arrachai(ent)	aʁaʃɛ	imp:ils
arrachon(s)	aʁaʃɔ̃	pr:nous
arrache(z)	aʁaʃe	pr:vous
arrachan(t)	aʁaʃɑ̃	ppr
arraché	aʁaʃe	pp
arraché(e)	aʁaʃe	pp:f
arracherai	aʁaʃʁe	fut:je
arrachera(s)	aʁaʃʁa	fut:tu
arrachera	aʁaʃʁa	fut:il
arracheron(s)	aʁaʃʁɔ̃	fut:nous
arrachere(z)	aʁaʃʁe	fut:vous
arracheron(t)	aʁaʃʁɔ̃	fut:ils
arracherai(s)	aʁaʃʁɛ	cond:je/tu
arracherai(t)	aʁaʃʁɛ	cond:il
arracherion(s)	aʁaʃəʁjɔ̃	cond:nous
arracherie(z)	aʁaʃəʁje	cond:vous
arracherai(ent)	aʁaʃʁɛ	cond:ils
>attrape(r)	atʁape	v	1
attrap(e)	atʁap	pr:je/il
attrap(es)	atʁap	pr:tu
attrap(ent)	atʁap	pr:ils
attrapai(s)	atʁapɛ	imp:je/tu
attrapai(t)	atʁapɛ	imp:il
attrapion(s)	atʁapjɔ̃	imp:nous
attrapie(z)	atʁapje	imp:vous
attrapai(ent)	atʁapɛ	imp:ils
attrapon(s)	atʁapɔ̃	pr:nous
attrape(z)	atʁape	pr:vous
attrapan(t)	atʁapɑ̃	ppr
attrapé	atʁape	pp
attrapé(e)	atʁape	pp:f
attraperai	atʁapʁe	fut:je
attrapera(s)	atʁapʁa	fut:tu
attrapera	atʁapʁa	fut:il
attraperon(s)	atʁapʁɔ̃	fut:nous
attrapere(z)	atʁapʁe	fut:vous
attraperon(t)	atʁapʁɔ̃	fut:ils
attraperai(s)	atʁapʁɛ	cond:je/tu
attraperai(t)	atʁapʁɛ	cond:il
attraperion(s)	atʁapəʁjɔ̃	cond:nous
attraperie(z)	atʁapəʁje	cond:vous
attraperai(ent)	atʁapʁɛ	cond:ils
>avale(r)	avale	v	1
aval(e)	aval	pr:je/il
aval(es)	aval	pr:tu
aval(ent)	aval	pr:ils
avalai(s)	avalɛ	imp:je/tu
avalai(t)	avalɛ	imp:il
avalion(s)	avaljɔ̃	imp:nous
avalie(z)	avalje	imp:vous
avalai(ent)	avalɛ	imp:ils
avalon(s)	avalɔ̃	pr:nous
avale(z)	avale	pr:vous
avalan(t)	avalɑ̃	ppr
avalé	avale	pp
avalé(e)	avale	pp:f
avalerai	avalʁe	fut:je
avalera(s)	avalʁa	fut:tu
avalera	avalʁa	fut:il
avaleron(s)	avalʁɔ̃	fut:nous
avalere(z)	avalʁe	fut:vous
avaleron(t)	avalʁɔ̃	fut:ils
avalerai(s)	avalʁɛ	cond:je/tu
avalerai(t)	avalʁɛ	cond:il
avalerion(s)	avaləʁjɔ̃	cond:nous
avalerie(z)	avaləʁje	cond:vous
avalerai(ent)	avalʁɛ	cond:ils
>bosse(r)	bɔse	v	1
boss(e)	bɔs	pr:je/il
boss(es)	bɔs	pr:tu
boss(ent)	bɔs	pr:ils
bossai(s)	bɔsɛ	imp:je/tu
bossai(t)	bɔsɛ	imp:il
bossion(s)	bɔsjɔ̃	imp:nous
bossie(z)	bɔsje	imp:vous
bossai(ent)	bɔsɛ	imp:ils
bosson(s)	bɔsɔ̃	pr:nous
bosse(z)	bɔse	pr:vous
bossan(t)	bɔsɑ̃	ppr
bossé	bɔse	pp
bossé(e)	bɔse	pp:f
bosserai	bɔsʁe	fut:je
bossera(s)	bɔsʁa	fut:tu
bossera	bɔsʁa	fut:il
bosseron(s)	bɔsʁɔ̃	fut:nous
bossere(z)	bɔsʁe	fut:vous
bosseron(t)	bɔsʁɔ̃	fut:ils
bosserai(s)	bɔsʁɛ	cond:je/tu
bosserai(t)	bɔsʁɛ	cond:il
bosserion(s)	bɔsəʁjɔ̃	cond:nous
bosserie(z)	bɔsəʁje	cond:vous
bosserai(ent)	bɔsʁɛ	cond:ils
>cale(r)	kale	v	1
cal(e)	kal	pr:je/il
cal(es)	kal	pr:tu
cal(ent)	kal	pr:ils
calai(s)	kalɛ	imp:je/tu
calai(t)	kalɛ	imp:il
calion(s)	kaljɔ̃	imp:nous
calie(z)	kalje	imp:vous
calai(ent)	kalɛ	imp:ils
calon(s)	kalɔ̃	pr:nous
cale(z)	kale	pr:vous
calan(t)	kalɑ̃	ppr
calé	kale	pp
calé(e)	kale	pp:f
calerai	kalʁe	fut:je
calera(s)	kalʁa	fut:tu
calera	kalʁa	fut:il
caleron(s)	kalʁɔ̃	fut:nous
calere(z)	kalʁe	fut:vous
caleron(t)	kalʁɔ̃	fut:ils
calerai(s)	kalʁɛ	cond:je/tu
calerai(t)	kalʁɛ	cond:il
calerion(s)	kaləʁjɔ̃	cond:nous
calerie(z)	kaləʁje	cond:vous
calerai(ent)	kalʁɛ	cond:ils
>coupe(r)	kupe	v	1
coup(e)	kup	pr:je/il
coup(es)	kup	pr:tu
coup(ent)	kup	pr:ils
coupai(s)	kupɛ	imp:je/tu
coupai(t)	kupɛ	imp:il
coupion(s)	kupjɔ̃	imp:nous
coupie(z)	kupje	imp:vous
coupai(ent)	kupɛ	imp:ils
coupon(s)	kupɔ̃	pr:nous
coupe(z)	kupe	pr:vous
coupan(t)	kupɑ̃	ppr
coupé	kupe	pp
coupé(e)	kupe	pp:f
couperai	kupʁe	fut:je
coupera(s)	kupʁa	fut:tu
coupera	kupʁa	fut:il
couperon(s)	kupʁɔ̃	fut:nous
coupere(z)	kupʁe	fut:vous
couperon(t)	kupʁɔ̃	fut:ils
couperai(s)	kupʁɛ	cond:je/tu
couperai(t)	kupʁɛ	cond:il
couperion(s)	kupəʁjɔ̃	cond:nous
couperie(z)	kupəʁje	cond:vous
couperai(ent)	kupʁɛ	cond:ils
>craque(r)	kʁake	v	1
craqu(e)	kʁak	pr:je/il
craqu(es)	kʁak	pr:tu
craqu(ent)	kʁak	pr:ils
craquai(s)	kʁakɛ	imp:je/tu
craquai(t)	kʁakɛ	imp:il
craquion(s)	kʁakjɔ̃	imp:nous
craquie(z)	kʁakje	imp:vous
craquai(ent)	kʁakɛ	imp:ils
craquon(s)	kʁakɔ̃	pr:nous
craque(z)	kʁake	pr:vous
craquan(t)	kʁakɑ̃	ppr
craqué	kʁake	pp
craqué(e)	kʁake	pp:f
craquerai	kʁakʁe	fut:je
craquera(s)	kʁakʁa	fut:tu
craquera	kʁakʁa	fut:il
craqueron(s)	kʁakʁɔ̃	fut:nous
craquere(z)	kʁakʁe	fut:vous
craqueron(t)	kʁakʁɔ̃	fut:ils
craquerai(s)	kʁakʁɛ	cond:je/tu
craquerai(t)	kʁakʁɛ	cond:il
craquerion(s)	kʁakəʁjɔ̃	cond:nous
craquerie(z)	kʁakəʁje	cond:vous
craquerai(ent)	kʁakʁɛ	cond:ils
>dîne(r)	dine	v	1
dîn(e)	din	pr:je/il
dîn(es)	din	pr:tu
dîn(ent)	din	pr:ils
dînai(s)	dinɛ	imp:je/tu
dînai(t)	dinɛ	imp:il
dînion(s)	dinjɔ̃	imp:nous
dînie(z)	dinje	imp:vous
dînai(ent)	dinɛ	imp:ils
dînon(s)	dinɔ̃	pr:nous
dîne(z)	dine	pr:vous
dînan(t)	dinɑ̃	ppr
dîné	dine	pp
dîné(e)	dine	pp:f
dînerai	dinʁe	fut:je
dînera(s)	dinʁa	fut:tu
dînera	dinʁa	fut:il
dîneron(s)	dinʁɔ̃	fut:nous
dînere(z)	dinʁe	fut:vous
dîneron(t)	dinʁɔ̃	fut:ils
dînerai(s)	dinʁɛ	cond:je/tu
dînerai(t)	dinʁɛ	cond:il
dînerion(s)	dinəʁjɔ̃	cond:nous
dînerie(z)	dinəʁje	cond:vous
dînerai(ent)	dinʁɛ	cond:ils
>déjeune(r)	deʒœne	v	1
déjeun(e)	deʒœn	pr:je/il
déjeun(es)	deʒœn	pr:tu
déjeun(ent)	deʒœn	pr:ils
déjeunai(s)	deʒœnɛ	imp:je/tu
déjeunai(t)	deʒœnɛ	imp:il
déjeunion(s)	deʒœnjɔ̃	imp:nous
déjeunie(z)	deʒœnje	imp:vous
déjeunai(ent)	deʒœnɛ	imp:ils
déjeunon(s)	deʒœnɔ̃	pr:nous
déjeune(z)	deʒœne	pr:vous
déjeunan(t)	deʒœnɑ̃	ppr
déjeuné	deʒœne	pp
déjeuné(e)	deʒœne	pp:f
déjeunerai	deʒœnʁe	fut:je
déjeunera(s)	deʒœnʁa	fut:tu
déjeunera	deʒœnʁa	fut:il
déjeuneron(s)	deʒœnʁɔ̃	fut:nous
déjeunere(z)	deʒœnʁe	fut:vous
déjeuneron(t)	deʒœnʁɔ̃	fut:ils
déjeunerai(s)	deʒœnʁɛ	cond:je/tu
déjeunerai(t)	deʒœnʁɛ	cond:il
déjeunerion(s)	deʒœnəʁjɔ̃	cond:nous
déjeunerie(z)	deʒœnəʁje	cond:vous
déjeunerai(ent)	deʒœnʁɛ	cond:ils
>soupe(r)	supe	v	1
soup(e)	sup	pr:je/il
soup(es)	sup	pr:tu
soup(ent)	sup	pr:ils
soupai(s)	supɛ	imp:je/tu
soupai(t)	supɛ	imp:il
soupion(s)	supjɔ̃	imp:nous
soupie(z)	supje	imp:vous
soupai(ent)	supɛ	imp:ils
soupon(s)	supɔ̃	pr:nous
soupe(z)	supe	pr:vous
soupan(t)	supɑ̃	ppr
soupé	supe	pp
soupé(e)	supe	pp:f
souperai	supʁe	fut:je
soupera(s)	supʁa	fut:tu
soupera	supʁa	fut:il
souperon(s)	supʁɔ̃	fut:nous
soupere(z)	supʁe	fut:vous
souperon(t)	supʁɔ̃	fut:ils
souperai(s)	supʁɛ	cond:je/tu
souperai(t)	supʁɛ	cond:il
souperion(s)	supəʁjɔ̃	cond:nous
souperie(z)	supəʁje	cond:vous
souperai(ent)	supʁɛ	cond:ils
>drache(r)	dʁaʃe	v	1
drach(e)	dʁaʃ	pr:je/il
drach(es)	dʁaʃ	pr:tu
drach(ent)	dʁaʃ	pr:ils
drachai(s)	dʁaʃɛ	imp:je/tu
drachai(t)	dʁaʃɛ	imp:il
drachion(s)	dʁaʃjɔ̃	imp:nous
drachie(z)	dʁaʃje	imp:vous
drachai(ent)	dʁaʃɛ	imp:ils
drachon(s)	dʁaʃɔ̃	pr:nous
drache(z)	dʁaʃe	pr:vous
drachan(t)	dʁaʃɑ̃	ppr
draché	dʁaʃe	pp
draché(e)	dʁaʃe	pp:f
dracherai	dʁaʃʁe	fut:je
drachera(s)	dʁaʃʁa	fut:tu
drachera	dʁaʃʁa	fut:il
dracheron(s)	dʁaʃʁɔ̃	fut:nous
drachere(z)	dʁaʃʁe	fut:vous
dracheron(t)	dʁaʃʁɔ̃	fut:ils
dracherai(s)	dʁaʃʁɛ	cond:je/tu
dracherai(t)	dʁaʃʁɛ	cond:il
dracherion(s)	dʁaʃəʁjɔ̃	cond:nous
dracherie(z)	dʁaʃəʁje	cond:vous
dracherai(ent)	dʁaʃʁɛ	cond:ils
>dure(r)	dyʁe	v	1
dur(e)	dyʁ	pr:je/il
dur(es)	dyʁ	pr:tu
dur(ent)	dyʁ	pr:ils
durai(s)	dyʁɛ	imp:je/tu
durai(t)	dyʁɛ	imp:il
durion(s)	dyʁjɔ̃	imp:nous
durie(z)	dyʁje	imp:vous
durai(ent)	dyʁɛ	imp:ils
duron(s)	dyʁɔ̃	pr:nous
dure(z)	dyʁe	pr:vous
duran(t)	dyʁɑ̃	ppr
duré	dyʁe	pp
duré(e)	dyʁe	pp:f
durerai	dyʁʁe	fut:je
durera(s)	dyʁʁa	fut:tu
durera	dyʁʁa	fut:il
dureron(s)	dyʁʁɔ̃	fut:nous
durere(z)	dyʁʁe	fut:vous
dureron(t)	dyʁʁɔ̃	fut:ils
durerai(s)	dyʁʁɛ	cond:je/tu
durerai(t)	dyʁʁɛ	cond:il
durerion(s)	dyʁəʁjɔ̃	cond:nous
durerie(z)	dyʁəʁje	cond:vous
durerai(ent)	dyʁʁɛ	cond:ils
>évite(r)	evite	v	1
évit(e)	evit	pr:je/il
évit(es)	evit	pr:tu
évit(ent)	evit	pr:ils
évitai(s)	evitɛ	imp:je/tu
évitai(t)	evitɛ	imp:il
évition(s)	evitjɔ̃	imp:nous
évitie(z)	evitje	imp:vous
évitai(ent)	evitɛ	imp:ils
éviton(s)	evitɔ̃	pr:nous
évite(z)	evite	pr:vous
évitan(t)	evitɑ̃	ppr
évité	evite	pp
évité(e)	evite	pp:f
éviterai	evitʁe	fut:je
évitera(s)	evitʁa	fut:tu
évitera	evitʁa	fut:il
éviteron(s)	evitʁɔ̃	fut:nous
évitere(z)	evitʁe	fut:vous
éviteron(t)	evitʁɔ̃	fut:ils
éviterai(s)	evitʁɛ	cond:je/tu
éviterai(t)	evitʁɛ	cond:il
éviterion(s)	evitəʁjɔ̃	cond:nous
éviterie(z)	evitəʁje	cond:vous
éviterai(ent)	evitʁɛ	cond:ils
>livre(r)	livʁe	v	1
livr(e)	livʁ	pr:je/il
livr(es)	livʁ	pr:tu
livr(ent)	livʁ	pr:ils
livrai(s)	livʁɛ	imp:je/tu
livrai(t)	livʁɛ	imp:il
livrion(s)	livʁijɔ̃	imp:nous
livrie(z)	livʁije	imp:vous
livrai(ent)	livʁɛ	imp:ils
livron(s)	livʁɔ̃	pr:nous
livre(z)	livʁe	pr:vous
livran(t)	livʁɑ̃	ppr
livré	livʁe	pp
livré(e)	livʁe	pp:f
livrerai	livʁəʁe	fut:je
livrera(s)	livʁəʁa	fut:tu
livrera	livʁəʁa	fut:il
livreron(s)	livʁəʁɔ̃	fut:nous
livrere(z)	livʁəʁe	fut:vous
livreron(t)	livʁəʁɔ̃	fut:ils
livrerai(s)	livʁəʁɛ	cond:je/tu
livrerai(t)	livʁəʁɛ	cond:il
livrerion(s)	livʁəʁjɔ̃	cond:nous
livrerie(z)	livʁəʁje	cond:vous
livrerai(ent)	livʁəʁɛ	cond:ils
>manque(r)	mɑ̃ke	v	1
manqu(e)	mɑ̃k	pr:je/il
manqu(es)	mɑ̃k	pr:tu
manqu(ent)	mɑ̃k	pr:ils
manquai(s)	mɑ̃kɛ	imp:je/tu
manquai(t)	mɑ̃kɛ	imp:il
manquion(s)	mɑ̃kjɔ̃	imp:nous
manquie(z)	mɑ̃kje	imp:vous
manquai(ent)	mɑ̃kɛ	imp:ils
manquon(s)	mɑ̃kɔ̃	pr:nous
manque(z)	mɑ̃ke	pr:vous
manquan(t)	mɑ̃kɑ̃	ppr
manqué	mɑ̃ke	pp
manqué(e)	mɑ̃ke	pp:f
manquerai	mɑ̃kʁe	fut:je
manquera(s)	mɑ̃kʁa	fut:tu
manquera	mɑ̃kʁa	fut:il
manqueron(s)	mɑ̃kʁɔ̃	fut:nous
manquere(z)	mɑ̃kʁe	fut:vous
manqueron(t)	mɑ̃kʁɔ̃	fut:ils
manquerai(s)	mɑ̃kʁɛ	cond:je/tu
manquerai(t)	mɑ̃kʁɛ	cond:il
manquerion(s)	mɑ̃kəʁjɔ̃	cond:nous
manquerie(z)	mɑ̃kəʁje	cond:vous
manquerai(ent)	mɑ̃kʁɛ	cond:ils
>profite(r)	pʁɔfite	v	1
profit(e)	pʁɔfit	pr:je/il
profit(es)	pʁɔfit	pr:tu
profit(ent)	pʁɔfit	pr:ils
profitai(s)	pʁɔfitɛ	imp:je/tu
profitai(t)	pʁɔfitɛ	imp:il
profition(s)	pʁɔfitjɔ̃	imp:nous
profitie(z)	pʁɔfitje	imp:vous
profitai(ent)	pʁɔfitɛ	imp:ils
profiton(s)	pʁɔfitɔ̃	pr:nous
profite(z)	pʁɔfite	pr:vous
profitan(t)	pʁɔfitɑ̃	ppr
profité	pʁɔfite	pp
profité(e)	pʁɔfite	pp:f
profiterai	pʁɔfitʁe	fut:je
profitera(s)	pʁɔfitʁa	fut:tu
profitera	pʁɔfitʁa	fut:il
profiteron(s)	pʁɔfitʁɔ̃	fut:nous
profitere(z)	pʁɔfitʁe	fut:vous
profiteron(t)	pʁɔfitʁɔ̃	fut:ils
profiterai(s)	pʁɔfitʁɛ	cond:je/tu
profiterai(t)	pʁɔfitʁɛ	cond:il
profiterion(s)	pʁɔfitəʁjɔ̃	cond:nous
profiterie(z)	pʁɔfitəʁje	cond:vous
profiterai(ent)	pʁɔfitʁɛ	cond:ils
>quitte(r)	kite	v	1
quitt(e)	kit	pr:je/il
quitt(es)	kit	pr:tu
quitt(ent)	kit	pr:ils
quittai(s)	kitɛ	imp:je/tu
quittai(t)	kitɛ	imp:il
quittion(s)	kitjɔ̃	imp:nous
quittie(z)	kitje	imp:vous
quittai(ent)	kitɛ	imp:ils
quitton(s)	kitɔ̃	pr:nous
quitte(z)	kite	pr:vous
quittan(t)	kitɑ̃	ppr
quitté	kite	pp
quitté(e)	kite	pp:f
quitterai	kitʁe	fut:je
quittera(s)	kitʁa	fut:tu
quittera	kitʁa	fut:il
quitteron(s)	kitʁɔ̃	fut:nous
quittere(z)	kitʁe	fut:vous
quitteron(t)	kitʁɔ̃	fut:ils
quitterai(s)	kitʁɛ	cond:je/tu
quitterai(t)	kitʁɛ	cond:il
quitterion(s)	kitəʁjɔ̃	cond:nous
quitterie(z)	kitəʁje	cond:vous
quitterai(ent)	kitʁɛ	cond:ils
>répare(r)	ʁepaʁe	v	1
répar(e)	ʁepaʁ	pr:je/il
répar(es)	ʁepaʁ	pr:tu
répar(ent)	ʁepaʁ	pr:ils
réparai(s)	ʁepaʁɛ	imp:je/tu
réparai(t)	ʁepaʁɛ	imp:il
réparion(s)	ʁepaʁjɔ̃	imp:nous
réparie(z)	ʁepaʁje	imp:vous
réparai(ent)	ʁepaʁɛ	imp:ils
réparon(s)	ʁepaʁɔ̃	pr:nous
répare(z)	ʁepaʁe	pr:vous
réparan(t)	ʁepaʁɑ̃	ppr
réparé	ʁepaʁe	pp
réparé(e)	ʁepaʁe	pp:f
réparerai	ʁepaʁʁe	fut:je
réparera(s)	ʁepaʁʁa	fut:tu
réparera	ʁepaʁʁa	fut:il
répareron(s)	ʁepaʁʁɔ̃	fut:nous
réparere(z)	ʁepaʁʁe	fut:vous
répareron(t)	ʁepaʁʁɔ̃	fut:ils
réparerai(s)	ʁepaʁʁɛ	cond:je/tu
réparerai(t)	ʁepaʁʁɛ	cond:il
réparerion(s)	ʁepaʁəʁjɔ̃	cond:nous
réparerie(z)	ʁepaʁəʁje	cond:vous
réparerai(ent)	ʁepaʁʁɛ	cond:ils
>révise(r)	ʁevize	v	1
révis(e)	ʁeviz	pr:je/il
révis(es)	ʁeviz	pr:tu
révis(ent)	ʁeviz	pr:ils
révisai(s)	ʁevizɛ	imp:je/tu
révisai(t)	ʁevizɛ	imp:il
révision(s)	ʁevizjɔ̃	imp:nous
révisie(z)	ʁevizje	imp:vous
révisai(ent)	ʁevizɛ	imp:ils
révison(s)	ʁevizɔ̃	pr:nous
révise(z)	ʁevize	pr:vous
révisan(t)	ʁevizɑ̃	ppr
révisé	ʁevize	pp
révisé(e)	ʁevize	pp:f
réviserai	ʁevizʁe	fut:je
révisera(s)	ʁevizʁa	fut:tu
révisera	ʁevizʁa	fut:il
réviseron(s)	ʁevizʁɔ̃	fut:nous
révisere(z)	ʁevizʁe	fut:vous
réviseron(t)	ʁevizʁɔ̃	fut:ils
réviserai(s)	ʁevizʁɛ	cond:je/tu
réviserai(t)	ʁevizʁɛ	cond:il
réviserion(s)	ʁevizəʁjɔ̃	cond:nous
réviserie(z)	ʁevizəʁje	cond:vous
réviserai(ent)	ʁevizʁɛ	cond:ils
>roule(r)	ʁule	v	1
roul(e)	ʁul	pr:je/il
roul(es)	ʁul	pr:tu
roul(ent)	ʁul	pr:ils
roulai(s)	ʁulɛ	imp:je/tu
roulai(t)	ʁulɛ	imp:il
roulion(s)	ʁuljɔ̃	imp:nous
roulie(z)	ʁulje	imp:vous
roulai(ent)	ʁulɛ	imp:ils
roulon(s)	ʁulɔ̃	pr:nous
roule(z)	ʁule	pr:vous
roulan(t)	ʁulɑ̃	ppr
roulé	ʁule	pp
roulé(e)	ʁule	pp:f
roulerai	ʁulʁe	fut:je
roulera(s)	ʁulʁa	fut:tu
roulera	ʁulʁa	fut:il
rouleron(s)	ʁulʁɔ̃	fut:nous
roulere(z)	ʁulʁe	fut:vous
rouleron(t)	ʁulʁɔ̃	fut:ils
roulerai(s)	ʁulʁɛ	cond:je/tu
roulerai(t)	ʁulʁɛ	cond:il
roulerion(s)	ʁuləʁjɔ̃	cond:nous
roulerie(z)	ʁuləʁje	cond:vous
roulerai(ent)	ʁulʁɛ	cond:ils
>saute(r)	sote	v	1
saut(e)	sot	pr:je/il
saut(es)	sot	pr:tu
saut(ent)	sot	pr:ils
sautai(s)	sotɛ	imp:je/tu
sautai(t)	sotɛ	imp:il
saution(s)	sotjɔ̃	imp:nous
sautie(z)	sotje	imp:vous
sautai(ent)	sotɛ	imp:ils
sauton(s)	sotɔ̃	pr:nous
saute(z)	sote	pr:vous
sautan(t)	sotɑ̃	ppr
sauté	sote	pp
sauté(e)	sote	pp:f
sauterai	sotʁe	fut:je
sautera(s)	sotʁa	fut:tu
sautera	sotʁa	fut:il
sauteron(s)	sotʁɔ̃	fut:nous
sautere(z)	sotʁe	fut:vous
sauteron(t)	sotʁɔ̃	fut:ils
sauterai(s)	sotʁɛ	cond:je/tu
sauterai(t)	sotʁɛ	cond:il
sauterion(s)	sotəʁjɔ̃	cond:nous
sauterie(z)	sotəʁje	cond:vous
sauterai(ent)	sotʁɛ	cond:ils
>scrolle(r)	skʁɔle	v	1
scroll(e)	skʁɔl	pr:je/il
scroll(es)	skʁɔl	pr:tu
scroll(ent)	skʁɔl	pr:ils
scrollai(s)	skʁɔlɛ	imp:je/tu
scrollai(t)	skʁɔlɛ	imp:il
scrollion(s)	skʁɔljɔ̃	imp:nous
scrollie(z)	skʁɔlje	imp:vous
scrollai(ent)	skʁɔlɛ	imp:ils
scrollon(s)	skʁɔlɔ̃	pr:nous
scrolle(z)	skʁɔle	pr:vous
scrollan(t)	skʁɔlɑ̃	ppr
scrollé	skʁɔle	pp
scrollé(e)	skʁɔle	pp:f
scrollerai	skʁɔlʁe	fut:je
scrollera(s)	skʁɔlʁa	fut:tu
scrollera	skʁɔlʁa	fut:il
scrolleron(s)	skʁɔlʁɔ̃	fut:nous
scrollere(z)	skʁɔlʁe	fut:vous
scrolleron(t)	skʁɔlʁɔ̃	fut:ils
scrollerai(s)	skʁɔlʁɛ	cond:je/tu
scrollerai(t)	skʁɔlʁɛ	cond:il
scrollerion(s)	skʁɔləʁjɔ̃	cond:nous
scrollerie(z)	skʁɔləʁje	cond:vous
scrollerai(ent)	skʁɔlʁɛ	cond:ils
>sonne(r)	sɔne	v	1
sonn(e)	sɔn	pr:je/il
sonn(es)	sɔn	pr:tu
sonn(ent)	sɔn	pr:ils
sonnai(s)	sɔnɛ	imp:je/tu
sonnai(t)	sɔnɛ	imp:il
sonnion(s)	sɔnjɔ̃	imp:nous
sonnie(z)	sɔnje	imp:vous
sonnai(ent)	sɔnɛ	imp:ils
sonnon(s)	sɔnɔ̃	pr:nous
sonne(z)	sɔne	pr:vous
sonnan(t)	sɔnɑ̃	ppr
sonné	sɔne	pp
sonné(e)	sɔne	pp:f
sonnerai	sɔnʁe	fut:je
sonnera(s)	sɔnʁa	fut:tu
sonnera	sɔnʁa	fut:il
sonneron(s)	sɔnʁɔ̃	fut:nous
sonnere(z)	sɔnʁe	fut:vous
sonneron(t)	sɔnʁɔ̃	fut:ils
sonnerai(s)	sɔnʁɛ	cond:je/tu
sonnerai(t)	sɔnʁɛ	cond:il
sonnerion(s)	sɔnəʁjɔ̃	cond:nous
sonnerie(z)	sɔnəʁje	cond:vous
sonnerai(ent)	sɔnʁɛ	cond:ils
>traîne(r)	tʁɛne	v	1
traîn(e)	tʁɛn	pr:je/il
traîn(es)	tʁɛn	pr:tu
traîn(ent)	tʁɛn	pr:ils
traînai(s)	tʁɛnɛ	imp:je/tu
traînai(t)	tʁɛnɛ	imp:il
traînion(s)	tʁɛnjɔ̃	imp:nous
traînie(z)	tʁɛnje	imp:vous
traînai(ent)	tʁɛnɛ	imp:ils
traînon(s)	tʁɛnɔ̃	pr:nous
traîne(z)	tʁɛne	pr:vous
traînan(t)	tʁɛnɑ̃	ppr
traîné	tʁɛne	pp
traîné(e)	tʁɛne	pp:f
traînerai	tʁɛnʁe	fut:je
traînera(s)	tʁɛnʁa	fut:tu
traînera	tʁɛnʁa	fut:il
traîneron(s)	tʁɛnʁɔ̃	fut:nous
traînere(z)	tʁɛnʁe	fut:vous
traîneron(t)	tʁɛnʁɔ̃	fut:ils
traînerai(s)	tʁɛnʁɛ	cond:je/tu
traînerai(t)	tʁɛnʁɛ	cond:il
traînerion(s)	tʁɛnəʁjɔ̃	cond:nous
traînerie(z)	tʁɛnəʁje	cond:vous
traînerai(ent)	tʁɛnʁɛ	cond:ils
>transpire(r)	tʁɑ̃spiʁe	v	1
transpir(e)	tʁɑ̃spiʁ	pr:je/il
transpir(es)	tʁɑ̃spiʁ	pr:tu
transpir(ent)	tʁɑ̃spiʁ	pr:ils
transpirai(s)	tʁɑ̃spiʁɛ	imp:je/tu
transpirai(t)	tʁɑ̃spiʁɛ	imp:il
transpirion(s)	tʁɑ̃spiʁjɔ̃	imp:nous
transpirie(z)	tʁɑ̃spiʁje	imp:vous
transpirai(ent)	tʁɑ̃spiʁɛ	imp:ils
transpiron(s)	tʁɑ̃spiʁɔ̃	pr:nous
transpire(z)	tʁɑ̃spiʁe	pr:vous
transpiran(t)	tʁɑ̃spiʁɑ̃	ppr
transpiré	tʁɑ̃spiʁe	pp
transpiré(e)	tʁɑ̃spiʁe	pp:f
transpirerai	tʁɑ̃spiʁʁe	fut:je
transpirera(s)	tʁɑ̃spiʁʁa	fut:tu
transpirera	tʁɑ̃spiʁʁa	fut:il
transpireron(s)	tʁɑ̃spiʁʁɔ̃	fut:nous
transpirere(z)	tʁɑ̃spiʁʁe	fut:vous
transpireron(t)	tʁɑ̃spiʁʁɔ̃	fut:ils
transpirerai(s)	tʁɑ̃spiʁʁɛ	cond:je/tu
transpirerai(t)	tʁɑ̃spiʁʁɛ	cond:il
transpirerion(s)	tʁɑ̃spiʁəʁjɔ̃	cond:nous
transpirerie(z)	tʁɑ̃spiʁəʁje	cond:vous
transpirerai(ent)	tʁɑ̃spiʁʁɛ	cond:ils
>trempe(r)	tʁɑ̃pe	v	1
tremp(e)	tʁɑ̃p	pr:je/il
tremp(es)	tʁɑ̃p	pr:tu
tremp(ent)	tʁɑ̃p	pr:ils
trempai(s)	tʁɑ̃pɛ	imp:je/tu
trempai(t)	tʁɑ̃pɛ	imp:il
trempion(s)	tʁɑ̃pjɔ̃	imp:nous
trempie(z)	tʁɑ̃pje	imp:vous
trempai(ent)	tʁɑ̃pɛ	imp:ils
trempon(s)	tʁɑ̃pɔ̃	pr:nous
trempe(z)	tʁɑ̃pe	pr:vous
trempan(t)	tʁɑ̃pɑ̃	ppr
trempé	tʁɑ̃pe	pp
trempé(e)	tʁɑ̃pe	pp:f
tremperai	tʁɑ̃pʁe	fut:je
trempera(s)	tʁɑ̃pʁa	fut:tu
trempera	tʁɑ̃pʁa	fut:il
tremperon(s)	tʁɑ̃pʁɔ̃	fut:nous
trempere(z)	tʁɑ̃pʁe	fut:vous
tremperon(t)	tʁɑ̃pʁɔ̃	fut:ils
tremperai(s)	tʁɑ̃pʁɛ	cond:je/tu
tremperai(t)	tʁɑ̃pʁɛ	cond:il
tremperion(s)	tʁɑ̃pəʁjɔ̃	cond:nous
tremperie(z)	tʁɑ̃pəʁje	cond:vous
tremperai(ent)	tʁɑ̃pʁɛ	cond:ils
>imprime(r)	ɛ̃pʁime	v	1
imprim(e)	ɛ̃pʁim	pr:je/il
imprim(es)	ɛ̃pʁim	pr:tu
imprim(ent)	ɛ̃pʁim	pr:ils
imprimai(s)	ɛ̃pʁimɛ	imp:je/tu
imprimai(t)	ɛ̃pʁimɛ	imp:il
imprimion(s)	ɛ̃pʁimjɔ̃	imp:nous
imprimie(z)	ɛ̃pʁimje	imp:vous
imprimai(ent)	ɛ̃pʁimɛ	imp:ils
imprimon(s)	ɛ̃pʁimɔ̃	pr:nous
imprime(z)	ɛ̃pʁime	pr:vous
impriman(t)	ɛ̃pʁimɑ̃	ppr
imprimé	ɛ̃pʁime	pp
imprimé(e)	ɛ̃pʁime	pp:f
imprimerai	ɛ̃pʁimʁe	fut:je
imprimera(s)	ɛ̃pʁimʁa	fut:tu
imprimera	ɛ̃pʁimʁa	fut:il
imprimeron(s)	ɛ̃pʁimʁɔ̃	fut:nous
imprimere(z)	ɛ̃pʁimʁe	fut:vous
imprimeron(t)	ɛ̃pʁimʁɔ̃	fut:ils
imprimerai(s)	ɛ̃pʁimʁɛ	cond:je/tu
imprimerai(t)	ɛ̃pʁimʁɛ	cond:il
imprimerion(s)	ɛ̃pʁiməʁjɔ̃	cond:nous
imprimerie(z)	ɛ̃pʁiməʁje	cond:vous
imprimerai(ent)	ɛ̃pʁimʁɛ	cond:ils
>rentabilise(r)	ʁɑ̃tabilize	v	1
rentabilis(e)	ʁɑ̃tabiliz	pr:je/il
rentabilis(es)	ʁɑ̃tabiliz	pr:tu
rentabilis(ent)	ʁɑ̃tabiliz	pr:ils
rentabilisai(s)	ʁɑ̃tabilizɛ	imp:je/tu
rentabilisai(t)	ʁɑ̃tabilizɛ	imp:il
rentabilision(s)	ʁɑ̃tabilizjɔ̃	imp:nous
rentabilisie(z)	ʁɑ̃tabilizje	imp:vous
rentabilisai(ent)	ʁɑ̃tabilizɛ	imp:ils
rentabilison(s)	ʁɑ̃tabilizɔ̃	pr:nous
rentabilise(z)	ʁɑ̃tabilize	pr:vous
rentabilisan(t)	ʁɑ̃tabilizɑ̃	ppr
rentabilisé	ʁɑ̃tabilize	pp
rentabilisé(e)	ʁɑ̃tabilize	pp:f
rentabiliserai	ʁɑ̃tabilizʁe	fut:je
rentabilisera(s)	ʁɑ̃tabilizʁa	fut:tu
rentabilisera	ʁɑ̃tabilizʁa	fut:il
rentabiliseron(s)	ʁɑ̃tabilizʁɔ̃	fut:nous
rentabilisere(z)	ʁɑ̃tabilizʁe	fut:vous
rentabiliseron(t)	ʁɑ̃tabilizʁɔ̃	fut:ils
rentabiliserai(s)	ʁɑ̃tabilizʁɛ	cond:je/tu
rentabiliserai(t)	ʁɑ̃tabilizʁɛ	cond:il
rentabiliserion(s)	ʁɑ̃tabilizəʁjɔ̃	cond:nous
rentabiliserie(z)	ʁɑ̃tabilizəʁje	cond:vous
rentabiliserai(ent)	ʁɑ̃tabilizʁɛ	cond:ils
>fatigue(r)	fatige	v	1
fatigu(e)	fatig	pr:je/il
fatigu(es)	fatig	pr:tu
fatigu(ent)	fatig	pr:ils
fatiguai(s)	fatigɛ	imp:je/tu
fatiguai(t)	fatigɛ	imp:il
fatiguion(s)	fatigjɔ̃	imp:nous
fatiguie(z)	fatigje	imp:vous
fatiguai(ent)	fatigɛ	imp:ils
fatiguon(s)	fatigɔ̃	pr:nous
fatigue(z)	fatige	pr:vous
fatiguan(t)	fatigɑ̃	ppr
fatigué	fatige	pp
fatigué(e)	fatige	pp:f
fatiguerai	fatigʁe	fut:je
fatiguera(s)	fatigʁa	fut:tu
fatiguera	fatigʁa	fut:il
fatigueron(s)	fatigʁɔ̃	fut:nous
fatiguere(z)	fatigʁe	fut:vous
fatigueron(t)	fatigʁɔ̃	fut:ils
fatiguerai(s)	fatigʁɛ	cond:je/tu
fatiguerai(t)	fatigʁɛ	cond:il
fatiguerion(s)	fatigəʁjɔ̃	cond:nous
fatiguerie(z)	fatigəʁje	cond:vous
fatiguerai(ent)	fatigʁɛ	cond:ils
>creve(r)	kʁəve	v	1
crèv(e)	kʁɛv	pr:je/il
crèv(es)	kʁɛv	pr:tu
crèv(ent)	kʁɛv	pr:ils
crevai(s)	kʁəvɛ	imp:je/tu
crevai(t)	kʁəvɛ	imp:il
crevion(s)	kʁəvjɔ̃	imp:nous
crevie(z)	kʁəvje	imp:vous
crevai(ent)	kʁəvɛ	imp:ils
crevon(s)	kʁəvɔ̃	pr:nous
creve(z)	kʁəve	pr:vous
crevan(t)	kʁəvɑ̃	ppr
crevé	kʁəve	pp
crevé(e)	kʁəve	pp:f
crèverai	kʁɛvʁe	fut:je
crèvera(s)	kʁɛvʁa	fut:tu
crèvera	kʁɛvʁa	fut:il
crèveron(s)	kʁɛvʁɔ̃	fut:nous
crèvere(z)	kʁɛvʁe	fut:vous
crèveron(t)	kʁɛvʁɔ̃	fut:ils
crèverai(s)	kʁɛvʁɛ	cond:je/tu
crèverai(t)	kʁɛvʁɛ	cond:il
crèverion(s)	kʁɛvəʁjɔ̃	cond:nous
crèverie(z)	kʁɛvəʁje	cond:vous
crèverai(ent)	kʁɛvʁɛ	cond:ils
>allonge(r)	alɔ̃ʒe	v	1
allong(e)	alɔ̃ʒ	pr:je/il
allong(es)	alɔ̃ʒ	pr:tu
allong(ent)	alɔ̃ʒ	pr:ils
allongeai(s)	alɔ̃ʒɛ	imp:je/tu
allongeai(t)	alɔ̃ʒɛ	imp:il
allongion(s)	alɔ̃ʒjɔ̃	imp:nous
allongie(z)	alɔ̃ʒje	imp:vous
allongeai(ent)	alɔ̃ʒɛ	imp:ils
allongeon(s)	alɔ̃ʒɔ̃	pr:nous
allonge(z)	alɔ̃ʒe	pr:vous
allongean(t)	alɔ̃ʒɑ̃	ppr
allongé	alɔ̃ʒe	pp
allongé(e)	alɔ̃ʒe	pp:f
allongerai	alɔ̃ʒʁe	fut:je
allongera(s)	alɔ̃ʒʁa	fut:tu
allongera	alɔ̃ʒʁa	fut:il
allongeron(s)	alɔ̃ʒʁɔ̃	fut:nous
allongere(z)	alɔ̃ʒʁe	fut:vous
allongeron(t)	alɔ̃ʒʁɔ̃	fut:ils
allongerai(s)	alɔ̃ʒʁɛ	cond:je/tu
allongerai(t)	alɔ̃ʒʁɛ	cond:il
allongerion(s)	alɔ̃ʒəʁjɔ̃	cond:nous
allongerie(z)	alɔ̃ʒəʁje	cond:vous
allongerai(ent)	alɔ̃ʒʁɛ	cond:ils
>serre(r)	sɛʁe	v	1
serr(e)	sɛʁ	pr:je/il
serr(es)	sɛʁ	pr:tu
serr(ent)	sɛʁ	pr:ils
serrai(s)	sɛʁɛ	imp:je/tu
serrai(t)	sɛʁɛ	imp:il
serrion(s)	sɛʁjɔ̃	imp:nous
serrie(z)	sɛʁje	imp:vous
serrai(ent)	sɛʁɛ	imp:ils
serron(s)	sɛʁɔ̃	pr:nous
serre(z)	sɛʁe	pr:vous
serran(t)	sɛʁɑ̃	ppr
serré	sɛʁe	pp
serré(e)	sɛʁe	pp:f
serrerai	sɛʁʁe	fut:je
serrera(s)	sɛʁʁa	fut:tu
serrera	sɛʁʁa	fut:il
serreron(s)	sɛʁʁɔ̃	fut:nous
serrere(z)	sɛʁʁe	fut:vous
serreron(t)	sɛʁʁɔ̃	fut:ils
serrerai(s)	sɛʁʁɛ	cond:je/tu
serrerai(t)	sɛʁʁɛ	cond:il
serrerion(s)	sɛʁəʁjɔ̃	cond:nous
serrerie(z)	sɛʁəʁje	cond:vous
serrerai(ent)	sɛʁʁɛ	cond:ils
>sale(r)	sale	v	1
sal(e)	sal	pr:je/il
sal(es)	sal	pr:tu
sal(ent)	sal	pr:ils
salai(s)	salɛ	imp:je/tu
salai(t)	salɛ	imp:il
salion(s)	saljɔ̃	imp:nous
salie(z)	salje	imp:vous
salai(ent)	salɛ	imp:ils
salon(s)	salɔ̃	pr:nous
sale(z)	sale	pr:vous
salan(t)	salɑ̃	ppr
salé	sale	pp
salé(e)	sale	pp:f
salerai	salʁe	fut:je
salera(s)	salʁa	fut:tu
salera	salʁa	fut:il
saleron(s)	salʁɔ̃	fut:nous
salere(z)	salʁe	fut:vous
saleron(t)	salʁɔ̃	fut:ils
salerai(s)	salʁɛ	cond:je/tu
salerai(t)	salʁɛ	cond:il
salerion(s)	saləʁjɔ̃	cond:nous
salerie(z)	saləʁje	cond:vous
salerai(ent)	salʁɛ	cond:ils
>sucre(r)	sykʁe	v	1
sucr(e)	sykʁ	pr:je/il
sucr(es)	sykʁ	pr:tu
sucr(ent)	sykʁ	pr:ils
sucrai(s)	sykʁɛ	imp:je/tu
sucrai(t)	sykʁɛ	imp:il
sucrion(s)	sykʁijɔ̃	imp:nous
sucrie(z)	sykʁije	imp:vous
sucrai(ent)	sykʁɛ	imp:ils
sucron(s)	sykʁɔ̃	pr:nous
sucre(z)	sykʁe	pr:vous
sucran(t)	sykʁɑ̃	ppr
sucré	sykʁe	pp
sucré(e)	sykʁe	pp:f
sucrerai	sykʁəʁe	fut:je
sucrera(s)	sykʁəʁa	fut:tu
sucrera	sykʁəʁa	fut:il
sucreron(s)	sykʁəʁɔ̃	fut:nous
sucrere(z)	sykʁəʁe	fut:vous
sucreron(t)	sykʁəʁɔ̃	fut:ils
sucrerai(s)	sykʁəʁɛ	cond:je/tu
sucrerai(t)	sykʁəʁɛ	cond:il
sucrerion(s)	sykʁəʁjɔ̃	cond:nous
sucrerie(z)	sykʁəʁje	cond:vous
sucrerai(ent)	sykʁəʁɛ	cond:ils
>prévoir	pʁevwaʁ	v	1
prévu	pʁevy	pp
prévu(e)	pʁevy	pp:f
prévoi(s)	pʁevwa	pr:je/tu
prévoi(t)	pʁevwa	pr:il
>refair(e)	ʁəfɛʁ	v	1
refai(s)	ʁəfɛ	pr:je/tu
refai(t)	ʁəfɛ	pr:il,pp
refaison(s)	ʁəfəzɔ̃	pr:nous
refait(es)	ʁəfɛt	pr:vous
refon(t)	ʁəfɔ̃	pr:ils
refaisai(s)	ʁəfəzɛ	imp:je/tu
refaisai(t)	ʁəfəzɛ	imp:il
refaision(s)	ʁəfəzjɔ̃	imp:nous
refaisie(z)	ʁəfəzje	imp:vous
refaisai(ent)	ʁəfəzɛ	imp:ils
refaisan(t)	ʁəfəzɑ̃	ppr
refait(e)	ʁəfɛt	pp:f
referai	ʁəfəʁe	fut:je
refera(s)	ʁəfəʁa	fut:tu
refera	ʁəfəʁa	fut:il
referon(s)	ʁəfəʁɔ̃	fut:nous
refere(z)	ʁəfəʁe	fut:vous
referon(t)	ʁəfəʁɔ̃	fut:ils
referai(s)	ʁəfəʁɛ	cond:je/tu
referai(t)	ʁəfəʁɛ	cond:il
referion(s)	ʁəfəʁjɔ̃	cond:nous
referie(z)	ʁəfəʁje	cond:vous
referai(ent)	ʁəfəʁɛ	cond:ils
refass(e)	ʁəfas	sub
refass(es)	ʁəfas	sub
refass(ent)	ʁəfas	sub
>faillir	fajiʁ	v	1
failli	faji	pp
failli(e)	faji	pp:f
>adore(r)	adɔʁe	v	1
ador(e)	adɔʁ	pr:je/il
ador(es)	adɔʁ	pr:tu
ador(ent)	adɔʁ	pr:ils
adorai(s)	adɔʁɛ	imp:je/tu
adorai(t)	adɔʁɛ	imp:il
adorion(s)	adɔʁjɔ̃	imp:nous
adorie(z)	adɔʁje	imp:vous
adorai(ent)	adɔʁɛ	imp:ils
adoron(s)	adɔʁɔ̃	pr:nous
adore(z)	adɔʁe	pr:vous
adoran(t)	adɔʁɑ̃	ppr
adoré	adɔʁe	pp
adoré(e)	adɔʁe	pp:f
adorerai	adɔʁʁe	fut:je
adorera(s)	adɔʁʁa	fut:tu
adorera	adɔʁʁa	fut:il
adoreron(s)	adɔʁʁɔ̃	fut:nous
adorere(z)	adɔʁʁe	fut:vous
adoreron(t)	adɔʁʁɔ̃	fut:ils
adorerai(s)	adɔʁʁɛ	cond:je/tu
adorerai(t)	adɔʁʁɛ	cond:il
adorerion(s)	adɔʁəʁjɔ̃	cond:nous
adorerie(z)	adɔʁəʁje	cond:vous
adorerai(ent)	adɔʁʁɛ	cond:ils
>déteste(r)	detɛste	v	1
détest(e)	detɛst	pr:je/il
détest(es)	detɛst	pr:tu
détest(ent)	detɛst	pr:ils
détestai(s)	detɛstɛ	imp:je/tu
détestai(t)	detɛstɛ	imp:il
détestion(s)	detɛstjɔ̃	imp:nous
détestie(z)	detɛstje	imp:vous
détestai(ent)	detɛstɛ	imp:ils
déteston(s)	detɛstɔ̃	pr:nous
déteste(z)	detɛste	pr:vous
détestan(t)	detɛstɑ̃	ppr
détesté	detɛste	pp
détesté(e)	detɛste	pp:f
détesterai	detɛstəʁe	fut:je
détestera(s)	detɛstəʁa	fut:tu
détestera	detɛstəʁa	fut:il
détesteron(s)	detɛstəʁɔ̃	fut:nous
détestere(z)	detɛstəʁe	fut:vous
détesteron(t)	detɛstəʁɔ̃	fut:ils
détesterai(s)	detɛstəʁɛ	cond:je/tu
détesterai(t)	detɛstəʁɛ	cond:il
détesterion(s)	detɛstəʁjɔ̃	cond:nous
détesterie(z)	detɛstəʁje	cond:vous
détesterai(ent)	detɛstəʁɛ	cond:ils
>danse(r)	dɑ̃se	v	1
dans(e)	dɑ̃s	pr:je/il
dans(es)	dɑ̃s	pr:tu
dans(ent)	dɑ̃s	pr:ils
dansai(s)	dɑ̃sɛ	imp:je/tu
dansai(t)	dɑ̃sɛ	imp:il
dansion(s)	dɑ̃sjɔ̃	imp:nous
dansie(z)	dɑ̃sje	imp:vous
dansai(ent)	dɑ̃sɛ	imp:ils
danson(s)	dɑ̃sɔ̃	pr:nous
danse(z)	dɑ̃se	pr:vous
dansan(t)	dɑ̃sɑ̃	ppr
dansé	dɑ̃se	pp
dansé(e)	dɑ̃se	pp:f
danserai	dɑ̃sʁe	fut:je
dansera(s)	dɑ̃sʁa	fut:tu
dansera	dɑ̃sʁa	fut:il
danseron(s)	dɑ̃sʁɔ̃	fut:nous
dansere(z)	dɑ̃sʁe	fut:vous
danseron(t)	dɑ̃sʁɔ̃	fut:ils
danserai(s)	dɑ̃sʁɛ	cond:je/tu
danserai(t)	dɑ̃sʁɛ	cond:il
danserion(s)	dɑ̃səʁjɔ̃	cond:nous
danserie(z)	dɑ̃səʁje	cond:vous
danserai(ent)	dɑ̃sʁɛ	cond:ils
>chante(r)	ʃɑ̃te	v	1
chant(e)	ʃɑ̃t	pr:je/il
chant(es)	ʃɑ̃t	pr:tu
chant(ent)	ʃɑ̃t	pr:ils
chantai(s)	ʃɑ̃tɛ	imp:je/tu
chantai(t)	ʃɑ̃tɛ	imp:il
chantion(s)	ʃɑ̃tjɔ̃	imp:nous
chantie(z)	ʃɑ̃tje	imp:vous
chantai(ent)	ʃɑ̃tɛ	imp:ils
chanton(s)	ʃɑ̃tɔ̃	pr:nous
chante(z)	ʃɑ̃te	pr:vous
chantan(t)	ʃɑ̃tɑ̃	ppr
chanté	ʃɑ̃te	pp
chanté(e)	ʃɑ̃te	pp:f
chanterai	ʃɑ̃tʁe	fut:je
chantera(s)	ʃɑ̃tʁa	fut:tu
chantera	ʃɑ̃tʁa	fut:il
chanteron(s)	ʃɑ̃tʁɔ̃	fut:nous
chantere(z)	ʃɑ̃tʁe	fut:vous
chanteron(t)	ʃɑ̃tʁɔ̃	fut:ils
chanterai(s)	ʃɑ̃tʁɛ	cond:je/tu
chanterai(t)	ʃɑ̃tʁɛ	cond:il
chanterion(s)	ʃɑ̃təʁjɔ̃	cond:nous
chanterie(z)	ʃɑ̃təʁje	cond:vous
chanterai(ent)	ʃɑ̃tʁɛ	cond:ils
>dessine(r)	desine	v	1
dessin(e)	desin	pr:je/il
dessin(es)	desin	pr:tu
dessin(ent)	desin	pr:ils
dessinai(s)	desinɛ	imp:je/tu
dessinai(t)	desinɛ	imp:il
dessinion(s)	desinjɔ̃	imp:nous
dessinie(z)	desinje	imp:vous
dessinai(ent)	desinɛ	imp:ils
dessinon(s)	desinɔ̃	pr:nous
dessine(z)	desine	pr:vous
dessinan(t)	desinɑ̃	ppr
dessiné	desine	pp
dessiné(e)	desine	pp:f
dessinerai	desinʁe	fut:je
dessinera(s)	desinʁa	fut:tu
dessinera	desinʁa	fut:il
dessineron(s)	desinʁɔ̃	fut:nous
dessinere(z)	desinʁe	fut:vous
dessineron(t)	desinʁɔ̃	fut:ils
dessinerai(s)	desinʁɛ	cond:je/tu
dessinerai(t)	desinʁɛ	cond:il
dessinerion(s)	desinəʁjɔ̃	cond:nous
dessinerie(z)	desinəʁje	cond:vous
dessinerai(ent)	desinʁɛ	cond:ils
>fume(r)	fyme	v	1
fum(e)	fym	pr:je/il
fum(es)	fym	pr:tu
fum(ent)	fym	pr:ils
fumai(s)	fymɛ	imp:je/tu
fumai(t)	fymɛ	imp:il
fumion(s)	fymjɔ̃	imp:nous
fumie(z)	fymje	imp:vous
fumai(ent)	fymɛ	imp:ils
fumon(s)	fymɔ̃	pr:nous
fume(z)	fyme	pr:vous
fuman(t)	fymɑ̃	ppr
fumé	fyme	pp
fumé(e)	fyme	pp:f
fumerai	fymʁe	fut:je
fumera(s)	fymʁa	fut:tu
fumera	fymʁa	fut:il
fumeron(s)	fymʁɔ̃	fut:nous
fumere(z)	fymʁe	fut:vous
fumeron(t)	fymʁɔ̃	fut:ils
fumerai(s)	fymʁɛ	cond:je/tu
fumerai(t)	fymʁɛ	cond:il
fumerion(s)	fyməʁjɔ̃	cond:nous
fumerie(z)	fyməʁje	cond:vous
fumerai(ent)	fymʁɛ	cond:ils
>pleure(r)	plœʁe	v	1
pleur(e)	plœʁ	pr:je/il
pleur(es)	plœʁ	pr:tu
pleur(ent)	plœʁ	pr:ils
pleurai(s)	plœʁɛ	imp:je/tu
pleurai(t)	plœʁɛ	imp:il
pleurion(s)	plœʁjɔ̃	imp:nous
pleurie(z)	plœʁje	imp:vous
pleurai(ent)	plœʁɛ	imp:ils
pleuron(s)	plœʁɔ̃	pr:nous
pleure(z)	plœʁe	pr:vous
pleuran(t)	plœʁɑ̃	ppr
pleuré	plœʁe	pp
pleuré(e)	plœʁe	pp:f
pleurerai	plœʁʁe	fut:je
pleurera(s)	plœʁʁa	fut:tu
pleurera	plœʁʁa	fut:il
pleureron(s)	plœʁʁɔ̃	fut:nous
pleurere(z)	plœʁʁe	fut:vous
pleureron(t)	plœʁʁɔ̃	fut:ils
pleurerai(s)	plœʁʁɛ	cond:je/tu
pleurerai(t)	plœʁʁɛ	cond:il
pleurerion(s)	plœʁəʁjɔ̃	cond:nous
pleurerie(z)	plœʁəʁje	cond:vous
pleurerai(ent)	plœʁʁɛ	cond:ils
>embrasse(r)	ɑ̃bʁase	v	1
embrass(e)	ɑ̃bʁas	pr:je/il
embrass(es)	ɑ̃bʁas	pr:tu
embrass(ent)	ɑ̃bʁas	pr:ils
embrassai(s)	ɑ̃bʁasɛ	imp:je/tu
embrassai(t)	ɑ̃bʁasɛ	imp:il
embrassion(s)	ɑ̃bʁasjɔ̃	imp:nous
embrassie(z)	ɑ̃bʁasje	imp:vous
embrassai(ent)	ɑ̃bʁasɛ	imp:ils
embrasson(s)	ɑ̃bʁasɔ̃	pr:nous
embrasse(z)	ɑ̃bʁase	pr:vous
embrassan(t)	ɑ̃bʁasɑ̃	ppr
embrassé	ɑ̃bʁase	pp
embrassé(e)	ɑ̃bʁase	pp:f
embrasserai	ɑ̃bʁasʁe	fut:je
embrassera(s)	ɑ̃bʁasʁa	fut:tu
embrassera	ɑ̃bʁasʁa	fut:il
embrasseron(s)	ɑ̃bʁasʁɔ̃	fut:nous
embrassere(z)	ɑ̃bʁasʁe	fut:vous
embrasseron(t)	ɑ̃bʁasʁɔ̃	fut:ils
embrasserai(s)	ɑ̃bʁasʁɛ	cond:je/tu
embrasserai(t)	ɑ̃bʁasʁɛ	cond:il
embrasserion(s)	ɑ̃bʁasəʁjɔ̃	cond:nous
embrasserie(z)	ɑ̃bʁasəʁje	cond:vous
embrasserai(ent)	ɑ̃bʁasʁɛ	cond:ils
>touche(r)	tuʃe	v	1
touch(e)	tuʃ	pr:je/il
touch(es)	tuʃ	pr:tu
touch(ent)	tuʃ	pr:ils
touchai(s)	tuʃɛ	imp:je/tu
touchai(t)	tuʃɛ	imp:il
touchion(s)	tuʃjɔ̃	imp:nous
touchie(z)	tuʃje	imp:vous
touchai(ent)	tuʃɛ	imp:ils
touchon(s)	tuʃɔ̃	pr:nous
touche(z)	tuʃe	pr:vous
touchan(t)	tuʃɑ̃	ppr
touché	tuʃe	pp
touché(e)	tuʃe	pp:f
toucherai	tuʃʁe	fut:je
touchera(s)	tuʃʁa	fut:tu
touchera	tuʃʁa	fut:il
toucheron(s)	tuʃʁɔ̃	fut:nous
touchere(z)	tuʃʁe	fut:vous
toucheron(t)	tuʃʁɔ̃	fut:ils
toucherai(s)	tuʃʁɛ	cond:je/tu
toucherai(t)	tuʃʁɛ	cond:il
toucherion(s)	tuʃəʁjɔ̃	cond:nous
toucherie(z)	tuʃəʁje	cond:vous
toucherai(ent)	tuʃʁɛ	cond:ils
>pousse(r)	puse	v	1
pouss(e)	pus	pr:je/il
pouss(es)	pus	pr:tu
pouss(ent)	pus	pr:ils
poussai(s)	pusɛ	imp:je/tu
poussai(t)	pusɛ	imp:il
poussion(s)	pusjɔ̃	imp:nous
poussie(z)	pusje	imp:vous
poussai(ent)	pusɛ	imp:ils
pousson(s)	pusɔ̃	pr:nous
pousse(z)	puse	pr:vous
poussan(t)	pusɑ̃	ppr
poussé	puse	pp
poussé(e)	puse	pp:f
pousserai	pusʁe	fut:je
poussera(s)	pusʁa	fut:tu
poussera	pusʁa	fut:il
pousseron(s)	pusʁɔ̃	fut:nous
poussere(z)	pusʁe	fut:vous
pousseron(t)	pusʁɔ̃	fut:ils
pousserai(s)	pusʁɛ	cond:je/tu
pousserai(t)	pusʁɛ	cond:il
pousserion(s)	pusəʁjɔ̃	cond:nous
pousserie(z)	pusəʁje	cond:vous
pousserai(ent)	pusʁɛ	cond:ils
>tire(r)	tiʁe	v	1
tir(e)	tiʁ	pr:je/il
tir(es)	tiʁ	pr:tu
tir(ent)	tiʁ	pr:ils
tirai(s)	tiʁɛ	imp:je/tu
tirai(t)	tiʁɛ	imp:il
tirion(s)	tiʁjɔ̃	imp:nous
tirie(z)	tiʁje	imp:vous
tirai(ent)	tiʁɛ	imp:ils
tiron(s)	tiʁɔ̃	pr:nous
tire(z)	tiʁe	pr:vous
tiran(t)	tiʁɑ̃	ppr
tiré	tiʁe	pp
tiré(e)	tiʁe	pp:f
tirerai	tiʁʁe	fut:je
tirera(s)	tiʁʁa	fut:tu
tirera	tiʁʁa	fut:il
tireron(s)	tiʁʁɔ̃	fut:nous
tirere(z)	tiʁʁe	fut:vous
tireron(t)	tiʁʁɔ̃	fut:ils
tirerai(s)	tiʁʁɛ	cond:je/tu
tirerai(t)	tiʁʁɛ	cond:il
tirerion(s)	tiʁəʁjɔ̃	cond:nous
tirerie(z)	tiʁəʁje	cond:vous
tirerai(ent)	tiʁʁɛ	cond:ils
>tourne(r)	tuʁne	v	1
tourn(e)	tuʁn	pr:je/il
tourn(es)	tuʁn	pr:tu
tourn(ent)	tuʁn	pr:ils
tournai(s)	tuʁnɛ	imp:je/tu
tournai(t)	tuʁnɛ	imp:il
tournion(s)	tuʁnjɔ̃	imp:nous
tournie(z)	tuʁnje	imp:vous
tournai(ent)	tuʁnɛ	imp:ils
tournon(s)	tuʁnɔ̃	pr:nous
tourne(z)	tuʁne	pr:vous
tournan(t)	tuʁnɑ̃	ppr
tourné	tuʁne	pp
tourné(e)	tuʁne	pp:f
tournerai	tuʁnəʁe	fut:je
tournera(s)	tuʁnəʁa	fut:tu
tournera	tuʁnəʁa	fut:il
tourneron(s)	tuʁnəʁɔ̃	fut:nous
tournere(z)	tuʁnəʁe	fut:vous
tourneron(t)	tuʁnəʁɔ̃	fut:ils
tournerai(s)	tuʁnəʁɛ	cond:je/tu
tournerai(t)	tuʁnəʁɛ	cond:il
tournerion(s)	tuʁnəʁjɔ̃	cond:nous
tournerie(z)	tuʁnəʁje	cond:vous
tournerai(ent)	tuʁnəʁɛ	cond:ils
>traverse(r)	tʁavɛʁse	v	1
travers(e)	tʁavɛʁs	pr:je/il
travers(es)	tʁavɛʁs	pr:tu
travers(ent)	tʁavɛʁs	pr:ils
traversai(s)	tʁavɛʁsɛ	imp:je/tu
traversai(t)	tʁavɛʁsɛ	imp:il
traversion(s)	tʁavɛʁsjɔ̃	imp:nous
traversie(z)	tʁavɛʁsje	imp:vous
traversai(ent)	tʁavɛʁsɛ	imp:ils
traverson(s)	tʁavɛʁsɔ̃	pr:nous
traverse(z)	tʁavɛʁse	pr:vous
traversan(t)	tʁavɛʁsɑ̃	ppr
traversé	tʁavɛʁse	pp
traversé(e)	tʁavɛʁse	pp:f
traverserai	tʁavɛʁsəʁe	fut:je
traversera(s)	tʁavɛʁsəʁa	fut:tu
traversera	tʁavɛʁsəʁa	fut:il
traverseron(s)	tʁavɛʁsəʁɔ̃	fut:nous
traversere(z)	tʁavɛʁsəʁe	fut:vous
traverseron(t)	tʁavɛʁsəʁɔ̃	fut:ils
traverserai(s)	tʁavɛʁsəʁɛ	cond:je/tu
traverserai(t)	tʁavɛʁsəʁɛ	cond:il
traverserion(s)	tʁavɛʁsəʁjɔ̃	cond:nous
traverserie(z)	tʁavɛʁsəʁje	cond:vous
traverserai(ent)	tʁavɛʁsəʁɛ	cond:ils
>retourne(r)	ʁətuʁne	v	1
retourn(e)	ʁətuʁn	pr:je/il
retourn(es)	ʁətuʁn	pr:tu
retourn(ent)	ʁətuʁn	pr:ils
retournai(s)	ʁətuʁnɛ	imp:je/tu
retournai(t)	ʁətuʁnɛ	imp:il
retournion(s)	ʁətuʁnjɔ̃	imp:nous
retournie(z)	ʁətuʁnje	imp:vous
retournai(ent)	ʁətuʁnɛ	imp:ils
retournon(s)	ʁətuʁnɔ̃	pr:nous
retourne(z)	ʁətuʁne	pr:vous
retournan(t)	ʁətuʁnɑ̃	ppr
retourné	ʁətuʁne	pp
retourné(e)	ʁətuʁne	pp:f
retournerai	ʁətuʁnəʁe	fut:je
retournera(s)	ʁətuʁnəʁa	fut:tu
retournera	ʁətuʁnəʁa	fut:il
retourneron(s)	ʁətuʁnəʁɔ̃	fut:nous
retournere(z)	ʁətuʁnəʁe	fut:vous
retourneron(t)	ʁətuʁnəʁɔ̃	fut:ils
retournerai(s)	ʁətuʁnəʁɛ	cond:je/tu
retournerai(t)	ʁətuʁnəʁɛ	cond:il
retournerion(s)	ʁətuʁnəʁjɔ̃	cond:nous
retournerie(z)	ʁətuʁnəʁje	cond:vous
retournerai(ent)	ʁətuʁnəʁɛ	cond:ils
>déménage(r)	demenaʒe	v	1
déménag(e)	demenaʒ	pr:je/il
déménag(es)	demenaʒ	pr:tu
déménag(ent)	demenaʒ	pr:ils
déménageai(s)	demenaʒɛ	imp:je/tu
déménageai(t)	demenaʒɛ	imp:il
déménagion(s)	demenaʒjɔ̃	imp:nous
déménagie(z)	demenaʒje	imp:vous
déménageai(ent)	demenaʒɛ	imp:ils
déménageon(s)	demenaʒɔ̃	pr:nous
déménage(z)	demenaʒe	pr:vous
déménagean(t)	demenaʒɑ̃	ppr
déménagé	demenaʒe	pp
déménagé(e)	demenaʒe	pp:f
déménagerai	demenaʒʁe	fut:je
déménagera(s)	demenaʒʁa	fut:tu
déménagera	demenaʒʁa	fut:il
déménageron(s)	demenaʒʁɔ̃	fut:nous
déménagere(z)	demenaʒʁe	fut:vous
déménageron(t)	demenaʒʁɔ̃	fut:ils
déménagerai(s)	demenaʒʁɛ	cond:je/tu
déménagerai(t)	demenaʒʁɛ	cond:il
déménagerion(s)	demenaʒəʁjɔ̃	cond:nous
déménagerie(z)	demenaʒəʁje	cond:vous
déménagerai(ent)	demenaʒʁɛ	cond:ils
>installe(r)	ɛ̃stale	v	1
install(e)	ɛ̃stal	pr:je/il
install(es)	ɛ̃stal	pr:tu
install(ent)	ɛ̃stal	pr:ils
installai(s)	ɛ̃stalɛ	imp:je/tu
installai(t)	ɛ̃stalɛ	imp:il
installion(s)	ɛ̃staljɔ̃	imp:nous
installie(z)	ɛ̃stalje	imp:vous
installai(ent)	ɛ̃stalɛ	imp:ils
installon(s)	ɛ̃stalɔ̃	pr:nous
installe(z)	ɛ̃stale	pr:vous
installan(t)	ɛ̃stalɑ̃	ppr
installé	ɛ̃stale	pp
installé(e)	ɛ̃stale	pp:f
installerai	ɛ̃stalʁe	fut:je
installera(s)	ɛ̃stalʁa	fut:tu
installera	ɛ̃stalʁa	fut:il
installeron(s)	ɛ̃stalʁɔ̃	fut:nous
installere(z)	ɛ̃stalʁe	fut:vous
installeron(t)	ɛ̃stalʁɔ̃	fut:ils
installerai(s)	ɛ̃stalʁɛ	cond:je/tu
installerai(t)	ɛ̃stalʁɛ	cond:il
installerion(s)	ɛ̃staləʁjɔ̃	cond:nous
installerie(z)	ɛ̃staləʁje	cond:vous
installerai(ent)	ɛ̃stalʁɛ	cond:ils
>téléphone(r)	telefɔne	v	1
téléphon(e)	telefɔn	pr:je/il
téléphon(es)	telefɔn	pr:tu
téléphon(ent)	telefɔn	pr:ils
téléphonai(s)	telefɔnɛ	imp:je/tu
téléphonai(t)	telefɔnɛ	imp:il
téléphonion(s)	telefɔnjɔ̃	imp:nous
téléphonie(z)	telefɔnje	imp:vous
téléphonai(ent)	telefɔnɛ	imp:ils
téléphonon(s)	telefɔnɔ̃	pr:nous
téléphone(z)	telefɔne	pr:vous
téléphonan(t)	telefɔnɑ̃	ppr
téléphoné	telefɔne	pp
téléphoné(e)	telefɔne	pp:f
téléphonerai	telefɔnʁe	fut:je
téléphonera(s)	telefɔnʁa	fut:tu
téléphonera	telefɔnʁa	fut:il
téléphoneron(s)	telefɔnʁɔ̃	fut:nous
téléphonere(z)	telefɔnʁe	fut:vous
téléphoneron(t)	telefɔnʁɔ̃	fut:ils
téléphonerai(s)	telefɔnʁɛ	cond:je/tu
téléphonerai(t)	telefɔnʁɛ	cond:il
téléphonerion(s)	telefɔnəʁjɔ̃	cond:nous
téléphonerie(z)	telefɔnəʁje	cond:vous
téléphonerai(ent)	telefɔnʁɛ	cond:ils
>télécharge(r)	teleʃaʁʒe	v	1
télécharg(e)	teleʃaʁʒ	pr:je/il
télécharg(es)	teleʃaʁʒ	pr:tu
télécharg(ent)	teleʃaʁʒ	pr:ils
téléchargeai(s)	teleʃaʁʒɛ	imp:je/tu
téléchargeai(t)	teleʃaʁʒɛ	imp:il
téléchargion(s)	teleʃaʁʒjɔ̃	imp:nous
téléchargie(z)	teleʃaʁʒje	imp:vous
téléchargeai(ent)	teleʃaʁʒɛ	imp:ils
téléchargeon(s)	teleʃaʁʒɔ̃	pr:nous
télécharge(z)	teleʃaʁʒe	pr:vous
téléchargean(t)	teleʃaʁʒɑ̃	ppr
téléchargé	teleʃaʁʒe	pp
téléchargé(e)	teleʃaʁʒe	pp:f
téléchargerai	teleʃaʁʒəʁe	fut:je
téléchargera(s)	teleʃaʁʒəʁa	fut:tu
téléchargera	teleʃaʁʒəʁa	fut:il
téléchargeron(s)	teleʃaʁʒəʁɔ̃	fut:nous
téléchargere(z)	teleʃaʁʒəʁe	fut:vous
téléchargeron(t)	teleʃaʁʒəʁɔ̃	fut:ils
téléchargerai(s)	teleʃaʁʒəʁɛ	cond:je/tu
téléchargerai(t)	teleʃaʁʒəʁɛ	cond:il
téléchargerion(s)	teleʃaʁʒəʁjɔ̃	cond:nous
téléchargerie(z)	teleʃaʁʒəʁje	cond:vous
téléchargerai(ent)	teleʃaʁʒəʁɛ	cond:ils
>clique(r)	klike	v	1
cliqu(e)	klik	pr:je/il
cliqu(es)	klik	pr:tu
cliqu(ent)	klik	pr:ils
cliquai(s)	klikɛ	imp:je/tu
cliquai(t)	klikɛ	imp:il
cliquion(s)	klikjɔ̃	imp:nous
cliquie(z)	klikje	imp:vous
cliquai(ent)	klikɛ	imp:ils
cliquon(s)	klikɔ̃	pr:nous
clique(z)	klike	pr:vous
cliquan(t)	klikɑ̃	ppr
cliqué	klike	pp
cliqué(e)	klike	pp:f
cliquerai	klikʁe	fut:je
cliquera(s)	klikʁa	fut:tu
cliquera	klikʁa	fut:il
cliqueron(s)	klikʁɔ̃	fut:nous
cliquere(z)	klikʁe	fut:vous
cliqueron(t)	klikʁɔ̃	fut:ils
cliquerai(s)	klikʁɛ	cond:je/tu
cliquerai(t)	klikʁɛ	cond:il
cliquerion(s)	klikəʁjɔ̃	cond:nous
cliquerie(z)	klikəʁje	cond:vous
cliquerai(ent)	klikʁɛ	cond:ils
>tape(r)	tape	v	1
tap(e)	tap	pr:je/il
tap(es)	tap	pr:tu
tap(ent)	tap	pr:ils
tapai(s)	tapɛ	imp:je/tu
tapai(t)	tapɛ	imp:il
tapion(s)	tapjɔ̃	imp:nous
tapie(z)	tapje	imp:vous
tapai(ent)	tapɛ	imp:ils
tapon(s)	tapɔ̃	pr:nous
tape(z)	tape	pr:vous
tapan(t)	tapɑ̃	ppr
tapé	tape	pp
tapé(e)	tape	pp:f
taperai	tapʁe	fut:je
tapera(s)	tapʁa	fut:tu
tapera	tapʁa	fut:il
taperon(s)	tapʁɔ̃	fut:nous
tapere(z)	tapʁe	fut:vous
taperon(t)	tapʁɔ̃	fut:ils
taperai(s)	tapʁɛ	cond:je/tu
taperai(t)	tapʁɛ	cond:il
taperion(s)	tapəʁjɔ̃	cond:nous
taperie(z)	tapəʁje	cond:vous
taperai(ent)	tapʁɛ	cond:ils
>publie(r)	pyblije	v	1
publi(e)	pybli	pr:je/il
publi(es)	pybli	pr:tu
publi(ent)	pybli	pr:ils
publiai(s)	pyblijɛ	imp:je/tu
publiai(t)	pyblijɛ	imp:il
publiion(s)	pyblijjɔ̃	imp:nous
publiie(z)	pyblijje	imp:vous
publiai(ent)	pyblijɛ	imp:ils
publion(s)	pyblijɔ̃	pr:nous
publie(z)	pyblije	pr:vous
publian(t)	pyblijɑ̃	ppr
publié	pyblije	pp
publié(e)	pyblije	pp:f
publierai	pybliʁe	fut:je
publiera(s)	pybliʁa	fut:tu
publiera	pybliʁa	fut:il
publieron(s)	pybliʁɔ̃	fut:nous
publiere(z)	pybliʁe	fut:vous
publieron(t)	pybliʁɔ̃	fut:ils
publierai(s)	pybliʁɛ	cond:je/tu
publierai(t)	pybliʁɛ	cond:il
publierion(s)	pybliʁjɔ̃	cond:nous
publierie(z)	pybliʁje	cond:vous
publierai(ent)	pybliʁɛ	cond:ils
>gére(r)	ʒeʁe	v	1
gèr(e)	ʒɛʁ	pr:je/il
gèr(es)	ʒɛʁ	pr:tu
gèr(ent)	ʒɛʁ	pr:ils
gérai(s)	ʒeʁɛ	imp:je/tu
gérai(t)	ʒeʁɛ	imp:il
gérion(s)	ʒeʁjɔ̃	imp:nous
gérie(z)	ʒeʁje	imp:vous
gérai(ent)	ʒeʁɛ	imp:ils
géron(s)	ʒeʁɔ̃	pr:nous
gére(z)	ʒeʁe	pr:vous
géran(t)	ʒeʁɑ̃	ppr
géré	ʒeʁe	pp
géré(e)	ʒeʁe	pp:f
gérerai	ʒeʁʁe	fut:je
gérera(s)	ʒeʁʁa	fut:tu
gérera	ʒeʁʁa	fut:il
géreron(s)	ʒeʁʁɔ̃	fut:nous
gérere(z)	ʒeʁʁe	fut:vous
géreron(t)	ʒeʁʁɔ̃	fut:ils
gérerai(s)	ʒeʁʁɛ	cond:je/tu
gérerai(t)	ʒeʁʁɛ	cond:il
gérerion(s)	ʒeʁəʁjɔ̃	cond:nous
gérerie(z)	ʒeʁəʁje	cond:vous
gérerai(ent)	ʒeʁʁɛ	cond:ils
>organise(r)	ɔʁganize	v	1
organis(e)	ɔʁganiz	pr:je/il
organis(es)	ɔʁganiz	pr:tu
organis(ent)	ɔʁganiz	pr:ils
organisai(s)	ɔʁganizɛ	imp:je/tu
organisai(t)	ɔʁganizɛ	imp:il
organision(s)	ɔʁganizjɔ̃	imp:nous
organisie(z)	ɔʁganizje	imp:vous
organisai(ent)	ɔʁganizɛ	imp:ils
organison(s)	ɔʁganizɔ̃	pr:nous
organise(z)	ɔʁganize	pr:vous
organisan(t)	ɔʁganizɑ̃	ppr
organisé	ɔʁganize	pp
organisé(e)	ɔʁganize	pp:f
organiserai	ɔʁganizʁe	fut:je
organisera(s)	ɔʁganizʁa	fut:tu
organisera	ɔʁganizʁa	fut:il
organiseron(s)	ɔʁganizʁɔ̃	fut:nous
organisere(z)	ɔʁganizʁe	fut:vous
organiseron(t)	ɔʁganizʁɔ̃	fut:ils
organiserai(s)	ɔʁganizʁɛ	cond:je/tu
organiserai(t)	ɔʁganizʁɛ	cond:il
organiserion(s)	ɔʁganizəʁjɔ̃	cond:nous
organiserie(z)	ɔʁganizəʁje	cond:vous
organiserai(ent)	ɔʁganizʁɛ	cond:ils
>décide(r)	deside	v	1
décid(e)	desid	pr:je/il
décid(es)	desid	pr:tu
décid(ent)	desid	pr:ils
décidai(s)	desidɛ	imp:je/tu
décidai(t)	desidɛ	imp:il
décidion(s)	desidjɔ̃	imp:nous
décidie(z)	desidje	imp:vous
décidai(ent)	desidɛ	imp:ils
décidon(s)	desidɔ̃	pr:nous
décide(z)	deside	pr:vous
décidan(t)	desidɑ̃	ppr
décidé	deside	pp
décidé(e)	deside	pp:f
déciderai	desidʁe	fut:je
décidera(s)	desidʁa	fut:tu
décidera	desidʁa	fut:il
décideron(s)	desidʁɔ̃	fut:nous
décidere(z)	desidʁe	fut:vous
décideron(t)	desidʁɔ̃	fut:ils
déciderai(s)	desidʁɛ	cond:je/tu
déciderai(t)	desidʁɛ	cond:il
déciderion(s)	desidəʁjɔ̃	cond:nous
déciderie(z)	desidəʁje	cond:vous
déciderai(ent)	desidʁɛ	cond:ils
>accepte(r)	aksɛpte	v	1
accept(e)	aksɛpt	pr:je/il
accept(es)	aksɛpt	pr:tu
accept(ent)	aksɛpt	pr:ils
acceptai(s)	aksɛptɛ	imp:je/tu
acceptai(t)	aksɛptɛ	imp:il
acception(s)	aksɛptjɔ̃	imp:nous
acceptie(z)	aksɛptje	imp:vous
acceptai(ent)	aksɛptɛ	imp:ils
accepton(s)	aksɛptɔ̃	pr:nous
accepte(z)	aksɛpte	pr:vous
acceptan(t)	aksɛptɑ̃	ppr
accepté	aksɛpte	pp
accepté(e)	aksɛpte	pp:f
accepterai	aksɛptəʁe	fut:je
acceptera(s)	aksɛptəʁa	fut:tu
acceptera	aksɛptəʁa	fut:il
accepteron(s)	aksɛptəʁɔ̃	fut:nous
acceptere(z)	aksɛptəʁe	fut:vous
accepteron(t)	aksɛptəʁɔ̃	fut:ils
accepterai(s)	aksɛptəʁɛ	cond:je/tu
accepterai(t)	aksɛptəʁɛ	cond:il
accepterion(s)	aksɛptəʁjɔ̃	cond:nous
accepterie(z)	aksɛptəʁje	cond:vous
accepterai(ent)	aksɛptəʁɛ	cond:ils
>refuse(r)	ʁəfyze	v	1
refus(e)	ʁəfyz	pr:je/il
refus(es)	ʁəfyz	pr:tu
refus(ent)	ʁəfyz	pr:ils
refusai(s)	ʁəfyzɛ	imp:je/tu
refusai(t)	ʁəfyzɛ	imp:il
refusion(s)	ʁəfyzjɔ̃	imp:nous
refusie(z)	ʁəfyzje	imp:vous
refusai(ent)	ʁəfyzɛ	imp:ils
refuson(s)	ʁəfyzɔ̃	pr:nous
refuse(z)	ʁəfyze	pr:vous
refusan(t)	ʁəfyzɑ̃	ppr
refusé	ʁəfyze	pp
refusé(e)	ʁəfyze	pp:f
refuserai	ʁəfyzʁe	fut:je
refusera(s)	ʁəfyzʁa	fut:tu
refusera	ʁəfyzʁa	fut:il
refuseron(s)	ʁəfyzʁɔ̃	fut:nous
refusere(z)	ʁəfyzʁe	fut:vous
refuseron(t)	ʁəfyzʁɔ̃	fut:ils
refuserai(s)	ʁəfyzʁɛ	cond:je/tu
refuserai(t)	ʁəfyzʁɛ	cond:il
refuserion(s)	ʁəfyzəʁjɔ̃	cond:nous
refuserie(z)	ʁəfyzəʁje	cond:vous
refuserai(ent)	ʁəfyzʁɛ	cond:ils
>propose(r)	pʁɔpoze	v	1
propos(e)	pʁɔpoz	pr:je/il
propos(es)	pʁɔpoz	pr:tu
propos(ent)	pʁɔpoz	pr:ils
proposai(s)	pʁɔpozɛ	imp:je/tu
proposai(t)	pʁɔpozɛ	imp:il
proposion(s)	pʁɔpozjɔ̃	imp:nous
proposie(z)	pʁɔpozje	imp:vous
proposai(ent)	pʁɔpozɛ	imp:ils
proposon(s)	pʁɔpozɔ̃	pr:nous
propose(z)	pʁɔpoze	pr:vous
proposan(t)	pʁɔpozɑ̃	ppr
proposé	pʁɔpoze	pp
proposé(e)	pʁɔpoze	pp:f
proposerai	pʁɔpozʁe	fut:je
proposera(s)	pʁɔpozʁa	fut:tu
proposera	pʁɔpozʁa	fut:il
proposeron(s)	pʁɔpozʁɔ̃	fut:nous
proposere(z)	pʁɔpozʁe	fut:vous
proposeron(t)	pʁɔpozʁɔ̃	fut:ils
proposerai(s)	pʁɔpozʁɛ	cond:je/tu
proposerai(t)	pʁɔpozʁɛ	cond:il
proposerion(s)	pʁɔpozəʁjɔ̃	cond:nous
proposerie(z)	pʁɔpozəʁje	cond:vous
proposerai(ent)	pʁɔpozʁɛ	cond:ils
>conseille(r)	kɔ̃sɛje	v	1
conseill(e)	kɔ̃sɛj	pr:je/il
conseill(es)	kɔ̃sɛj	pr:tu
conseill(ent)	kɔ̃sɛj	pr:ils
conseillai(s)	kɔ̃sɛjɛ	imp:je/tu
conseillai(t)	kɔ̃sɛjɛ	imp:il
conseillion(s)	kɔ̃sɛjjɔ̃	imp:nous
conseillie(z)	kɔ̃sɛjje	imp:vous
conseillai(ent)	kɔ̃sɛjɛ	imp:ils
conseillon(s)	kɔ̃sɛjɔ̃	pr:nous
conseille(z)	kɔ̃sɛje	pr:vous
conseillan(t)	kɔ̃sɛjɑ̃	ppr
conseillé	kɔ̃sɛje	pp
conseillé(e)	kɔ̃sɛje	pp:f
conseillerai	kɔ̃sɛjʁe	fut:je
conseillera(s)	kɔ̃sɛjʁa	fut:tu
conseillera	kɔ̃sɛjʁa	fut:il
conseilleron(s)	kɔ̃sɛjʁɔ̃	fut:nous
conseillere(z)	kɔ̃sɛjʁe	fut:vous
conseilleron(t)	kɔ̃sɛjʁɔ̃	fut:ils
conseillerai(s)	kɔ̃sɛjʁɛ	cond:je/tu
conseillerai(t)	kɔ̃sɛjʁɛ	cond:il
conseillerion(s)	kɔ̃sɛjəʁjɔ̃	cond:nous
conseillerie(z)	kɔ̃sɛjəʁje	cond:vous
conseillerai(ent)	kɔ̃sɛjʁɛ	cond:ils
>aide(r)	ɛde	v	1
aid(e)	ɛd	pr:je/il
aid(es)	ɛd	pr:tu
aid(ent)	ɛd	pr:ils
aidai(s)	ɛdɛ	imp:je/tu
aidai(t)	ɛdɛ	imp:il
aidion(s)	ɛdjɔ̃	imp:nous
aidie(z)	ɛdje	imp:vous
aidai(ent)	ɛdɛ	imp:ils
aidon(s)	ɛdɔ̃	pr:nous
aide(z)	ɛde	pr:vous
aidan(t)	ɛdɑ̃	ppr
aidé	ɛde	pp
aidé(e)	ɛde	pp:f
aiderai	ɛdʁe	fut:je
aidera(s)	ɛdʁa	fut:tu
aidera	ɛdʁa	fut:il
aideron(s)	ɛdʁɔ̃	fut:nous
aidere(z)	ɛdʁe	fut:vous
aideron(t)	ɛdʁɔ̃	fut:ils
aiderai(s)	ɛdʁɛ	cond:je/tu
aiderai(t)	ɛdʁɛ	cond:il
aiderion(s)	ɛdəʁjɔ̃	cond:nous
aiderie(z)	ɛdəʁje	cond:vous
aiderai(ent)	ɛdʁɛ	cond:ils
>semble(r)	sɑ̃ble	v	1
sembl(e)	sɑ̃bl	pr:je/il
sembl(es)	sɑ̃bl	pr:tu
sembl(ent)	sɑ̃bl	pr:ils
semblai(s)	sɑ̃blɛ	imp:je/tu
semblai(t)	sɑ̃blɛ	imp:il
semblion(s)	sɑ̃blijɔ̃	imp:nous
semblie(z)	sɑ̃blije	imp:vous
semblai(ent)	sɑ̃blɛ	imp:ils
semblon(s)	sɑ̃blɔ̃	pr:nous
semble(z)	sɑ̃ble	pr:vous
semblan(t)	sɑ̃blɑ̃	ppr
semblé	sɑ̃ble	pp
semblé(e)	sɑ̃ble	pp:f
semblerai	sɑ̃bləʁe	fut:je
semblera(s)	sɑ̃bləʁa	fut:tu
semblera	sɑ̃bləʁa	fut:il
sembleron(s)	sɑ̃bləʁɔ̃	fut:nous
semblere(z)	sɑ̃bləʁe	fut:vous
sembleron(t)	sɑ̃bləʁɔ̃	fut:ils
semblerai(s)	sɑ̃bləʁɛ	cond:je/tu
semblerai(t)	sɑ̃bləʁɛ	cond:il
semblerion(s)	sɑ̃bləʁjɔ̃	cond:nous
semblerie(z)	sɑ̃bləʁje	cond:vous
semblerai(ent)	sɑ̃bləʁɛ	cond:ils
>ressemble(r)	ʁəsɑ̃ble	v	1
ressembl(e)	ʁəsɑ̃bl	pr:je/il
ressembl(es)	ʁəsɑ̃bl	pr:tu
ressembl(ent)	ʁəsɑ̃bl	pr:ils
ressemblai(s)	ʁəsɑ̃blɛ	imp:je/tu
ressemblai(t)	ʁəsɑ̃blɛ	imp:il
ressemblion(s)	ʁəsɑ̃blijɔ̃	imp:nous
ressemblie(z)	ʁəsɑ̃blije	imp:vous
ressemblai(ent)	ʁəsɑ̃blɛ	imp:ils
ressemblon(s)	ʁəsɑ̃blɔ̃	pr:nous
ressemble(z)	ʁəsɑ̃ble	pr:vous
ressemblan(t)	ʁəsɑ̃blɑ̃	ppr
ressemblé	ʁəsɑ̃ble	pp
ressemblé(e)	ʁəsɑ̃ble	pp:f
ressemblerai	ʁəsɑ̃bləʁe	fut:je
ressemblera(s)	ʁəsɑ̃bləʁa	fut:tu
ressemblera	ʁəsɑ̃bləʁa	fut:il
ressembleron(s)	ʁəsɑ̃bləʁɔ̃	fut:nous
ressemblere(z)	ʁəsɑ̃bləʁe	fut:vous
ressembleron(t)	ʁəsɑ̃bləʁɔ̃	fut:ils
ressemblerai(s)	ʁəsɑ̃bləʁɛ	cond:je/tu
ressemblerai(t)	ʁəsɑ̃bləʁɛ	cond:il
ressemblerion(s)	ʁəsɑ̃bləʁjɔ̃	cond:nous
ressemblerie(z)	ʁəsɑ̃bləʁje	cond:vous
ressemblerai(ent)	ʁəsɑ̃bləʁɛ	cond:ils
>existe(r)	ɛgziste	v	1
exist(e)	ɛgzist	pr:je/il
exist(es)	ɛgzist	pr:tu
exist(ent)	ɛgzist	pr:ils
existai(s)	ɛgzistɛ	imp:je/tu
existai(t)	ɛgzistɛ	imp:il
existion(s)	ɛgzistjɔ̃	imp:nous
existie(z)	ɛgzistje	imp:vous
existai(ent)	ɛgzistɛ	imp:ils
existon(s)	ɛgzistɔ̃	pr:nous
existe(z)	ɛgziste	pr:vous
existan(t)	ɛgzistɑ̃	ppr
existé	ɛgziste	pp
existé(e)	ɛgziste	pp:f
existerai	ɛgzistəʁe	fut:je
existera(s)	ɛgzistəʁa	fut:tu
existera	ɛgzistəʁa	fut:il
existeron(s)	ɛgzistəʁɔ̃	fut:nous
existere(z)	ɛgzistəʁe	fut:vous
existeron(t)	ɛgzistəʁɔ̃	fut:ils
existerai(s)	ɛgzistəʁɛ	cond:je/tu
existerai(t)	ɛgzistəʁɛ	cond:il
existerion(s)	ɛgzistəʁjɔ̃	cond:nous
existerie(z)	ɛgzistəʁje	cond:vous
existerai(ent)	ɛgzistəʁɛ	cond:ils
>imagine(r)	imaʒine	v	1
imagin(e)	imaʒin	pr:je/il
imagin(es)	imaʒin	pr:tu
imagin(ent)	imaʒin	pr:ils
imaginai(s)	imaʒinɛ	imp:je/tu
imaginai(t)	imaʒinɛ	imp:il
imaginion(s)	imaʒinjɔ̃	imp:nous
imaginie(z)	imaʒinje	imp:vous
imaginai(ent)	imaʒinɛ	imp:ils
imaginon(s)	imaʒinɔ̃	pr:nous
imagine(z)	imaʒine	pr:vous
imaginan(t)	imaʒinɑ̃	ppr
imaginé	imaʒine	pp
imaginé(e)	imaʒine	pp:f
imaginerai	imaʒinʁe	fut:je
imaginera(s)	imaʒinʁa	fut:tu
imaginera	imaʒinʁa	fut:il
imagineron(s)	imaʒinʁɔ̃	fut:nous
imaginere(z)	imaʒinʁe	fut:vous
imagineron(t)	imaʒinʁɔ̃	fut:ils
imaginerai(s)	imaʒinʁɛ	cond:je/tu
imaginerai(t)	imaʒinʁɛ	cond:il
imaginerion(s)	imaʒinəʁjɔ̃	cond:nous
imaginerie(z)	imaʒinəʁje	cond:vous
imaginerai(ent)	imaʒinʁɛ	cond:ils
>rêve(r)	ʁɛve	v	1
rêv(e)	ʁɛv	pr:je/il
rêv(es)	ʁɛv	pr:tu
rêv(ent)	ʁɛv	pr:ils
rêvai(s)	ʁɛvɛ	imp:je/tu
rêvai(t)	ʁɛvɛ	imp:il
rêvion(s)	ʁɛvjɔ̃	imp:nous
rêvie(z)	ʁɛvje	imp:vous
rêvai(ent)	ʁɛvɛ	imp:ils
rêvon(s)	ʁɛvɔ̃	pr:nous
rêve(z)	ʁɛve	pr:vous
rêvan(t)	ʁɛvɑ̃	ppr
rêvé	ʁɛve	pp
rêvé(e)	ʁɛve	pp:f
rêverai	ʁɛvʁe	fut:je
rêvera(s)	ʁɛvʁa	fut:tu
rêvera	ʁɛvʁa	fut:il
rêveron(s)	ʁɛvʁɔ̃	fut:nous
rêvere(z)	ʁɛvʁe	fut:vous
rêveron(t)	ʁɛvʁɔ̃	fut:ils
rêverai(s)	ʁɛvʁɛ	cond:je/tu
rêverai(t)	ʁɛvʁɛ	cond:il
rêverion(s)	ʁɛvəʁjɔ̃	cond:nous
rêverie(z)	ʁɛvəʁje	cond:vous
rêverai(ent)	ʁɛvʁɛ	cond:ils
>sou(h)aite(r)	swɛte	v	1
sou(h)ait(e)	swɛt	pr:je/il
sou(h)ait(es)	swɛt	pr:tu
sou(h)ait(ent)	swɛt	pr:ils
sou(h)aitai(s)	swɛtɛ	imp:je/tu
sou(h)aitai(t)	swɛtɛ	imp:il
sou(h)aition(s)	swɛtjɔ̃	imp:nous
sou(h)aitie(z)	swɛtje	imp:vous
sou(h)aitai(ent)	swɛtɛ	imp:ils
sou(h)aiton(s)	swɛtɔ̃	pr:nous
sou(h)aite(z)	swɛte	pr:vous
sou(h)aitan(t)	swɛtɑ̃	ppr
sou(h)aité	swɛte	pp
sou(h)aité(e)	swɛte	pp:f
sou(h)aiterai	swɛtʁe	fut:je
sou(h)aitera(s)	swɛtʁa	fut:tu
sou(h)aitera	swɛtʁa	fut:il
sou(h)aiteron(s)	swɛtʁɔ̃	fut:nous
sou(h)aitere(z)	swɛtʁe	fut:vous
sou(h)aiteron(t)	swɛtʁɔ̃	fut:ils
sou(h)aiterai(s)	swɛtʁɛ	cond:je/tu
sou(h)aiterai(t)	swɛtʁɛ	cond:il
sou(h)aiterion(s)	swɛtəʁjɔ̃	cond:nous
sou(h)aiterie(z)	swɛtəʁje	cond:vous
sou(h)aiterai(ent)	swɛtʁɛ	cond:ils
>regrette(r)	ʁəgʁɛte	v	1
regrett(e)	ʁəgʁɛt	pr:je/il
regrett(es)	ʁəgʁɛt	pr:tu
regrett(ent)	ʁəgʁɛt	pr:ils
regrettai(s)	ʁəgʁɛtɛ	imp:je/tu
regrettai(t)	ʁəgʁɛtɛ	imp:il
regrettion(s)	ʁəgʁɛtjɔ̃	imp:nous
regrettie(z)	ʁəgʁɛtje	imp:vous
regrettai(ent)	ʁəgʁɛtɛ	imp:ils
regretton(s)	ʁəgʁɛtɔ̃	pr:nous
regrette(z)	ʁəgʁɛte	pr:vous
regrettan(t)	ʁəgʁɛtɑ̃	ppr
regretté	ʁəgʁɛte	pp
regretté(e)	ʁəgʁɛte	pp:f
regretterai	ʁəgʁɛtʁe	fut:je
regrettera(s)	ʁəgʁɛtʁa	fut:tu
regrettera	ʁəgʁɛtʁa	fut:il
regretteron(s)	ʁəgʁɛtʁɔ̃	fut:nous
regrettere(z)	ʁəgʁɛtʁe	fut:vous
regretteron(t)	ʁəgʁɛtʁɔ̃	fut:ils
regretterai(s)	ʁəgʁɛtʁɛ	cond:je/tu
regretterai(t)	ʁəgʁɛtʁɛ	cond:il
regretterion(s)	ʁəgʁɛtəʁjɔ̃	cond:nous
regretterie(z)	ʁəgʁɛtəʁje	cond:vous
regretterai(ent)	ʁəgʁɛtʁɛ	cond:ils
>remarque(r)	ʁəmaʁke	v	1
remarqu(e)	ʁəmaʁk	pr:je/il
remarqu(es)	ʁəmaʁk	pr:tu
remarqu(ent)	ʁəmaʁk	pr:ils
remarquai(s)	ʁəmaʁkɛ	imp:je/tu
remarquai(t)	ʁəmaʁkɛ	imp:il
remarquion(s)	ʁəmaʁkjɔ̃	imp:nous
remarquie(z)	ʁəmaʁkje	imp:vous
remarquai(ent)	ʁəmaʁkɛ	imp:ils
remarquon(s)	ʁəmaʁkɔ̃	pr:nous
remarque(z)	ʁəmaʁke	pr:vous
remarquan(t)	ʁəmaʁkɑ̃	ppr
remarqué	ʁəmaʁke	pp
remarqué(e)	ʁəmaʁke	pp:f
remarquerai	ʁəmaʁkəʁe	fut:je
remarquera(s)	ʁəmaʁkəʁa	fut:tu
remarquera	ʁəmaʁkəʁa	fut:il
remarqueron(s)	ʁəmaʁkəʁɔ̃	fut:nous
remarquere(z)	ʁəmaʁkəʁe	fut:vous
remarqueron(t)	ʁəmaʁkəʁɔ̃	fut:ils
remarquerai(s)	ʁəmaʁkəʁɛ	cond:je/tu
remarquerai(t)	ʁəmaʁkəʁɛ	cond:il
remarquerion(s)	ʁəmaʁkəʁjɔ̃	cond:nous
remarquerie(z)	ʁəmaʁkəʁje	cond:vous
remarquerai(ent)	ʁəmaʁkəʁɛ	cond:ils
>note(r)	nɔte	v	1
not(e)	nɔt	pr:je/il
not(es)	nɔt	pr:tu
not(ent)	nɔt	pr:ils
notai(s)	nɔtɛ	imp:je/tu
notai(t)	nɔtɛ	imp:il
notion(s)	nɔtjɔ̃	imp:nous
notie(z)	nɔtje	imp:vous
notai(ent)	nɔtɛ	imp:ils
noton(s)	nɔtɔ̃	pr:nous
note(z)	nɔte	pr:vous
notan(t)	nɔtɑ̃	ppr
noté	nɔte	pp
noté(e)	nɔte	pp:f
noterai	nɔtʁe	fut:je
notera(s)	nɔtʁa	fut:tu
notera	nɔtʁa	fut:il
noteron(s)	nɔtʁɔ̃	fut:nous
notere(z)	nɔtʁe	fut:vous
noteron(t)	nɔtʁɔ̃	fut:ils
noterai(s)	nɔtʁɛ	cond:je/tu
noterai(t)	nɔtʁɛ	cond:il
noterion(s)	nɔtəʁjɔ̃	cond:nous
noterie(z)	nɔtəʁje	cond:vous
noterai(ent)	nɔtʁɛ	cond:ils
>signe(r)	siɲe	v	1
sign(e)	siɲ	pr:je/il
sign(es)	siɲ	pr:tu
sign(ent)	siɲ	pr:ils
signai(s)	siɲɛ	imp:je/tu
signai(t)	siɲɛ	imp:il
signion(s)	siɲjɔ̃	imp:nous
signie(z)	siɲje	imp:vous
signai(ent)	siɲɛ	imp:ils
signon(s)	siɲɔ̃	pr:nous
signe(z)	siɲe	pr:vous
signan(t)	siɲɑ̃	ppr
signé	siɲe	pp
signé(e)	siɲe	pp:f
signerai	siɲʁe	fut:je
signera(s)	siɲʁa	fut:tu
signera	siɲʁa	fut:il
signeron(s)	siɲʁɔ̃	fut:nous
signere(z)	siɲʁe	fut:vous
signeron(t)	siɲʁɔ̃	fut:ils
signerai(s)	siɲʁɛ	cond:je/tu
signerai(t)	siɲʁɛ	cond:il
signerion(s)	siɲəʁjɔ̃	cond:nous
signerie(z)	siɲəʁje	cond:vous
signerai(ent)	siɲʁɛ	cond:ils
>présente(r)	pʁezɑ̃te	v	1
présent(e)	pʁezɑ̃t	pr:je/il
présent(es)	pʁezɑ̃t	pr:tu
présent(ent)	pʁezɑ̃t	pr:ils
présentai(s)	pʁezɑ̃tɛ	imp:je/tu
présentai(t)	pʁezɑ̃tɛ	imp:il
présention(s)	pʁezɑ̃tjɔ̃	imp:nous
présentie(z)	pʁezɑ̃tje	imp:vous
présentai(ent)	pʁezɑ̃tɛ	imp:ils
présenton(s)	pʁezɑ̃tɔ̃	pr:nous
présente(z)	pʁezɑ̃te	pr:vous
présentan(t)	pʁezɑ̃tɑ̃	ppr
présenté	pʁezɑ̃te	pp
présenté(e)	pʁezɑ̃te	pp:f
présenterai	pʁezɑ̃tʁe	fut:je
présentera(s)	pʁezɑ̃tʁa	fut:tu
présentera	pʁezɑ̃tʁa	fut:il
présenteron(s)	pʁezɑ̃tʁɔ̃	fut:nous
présentere(z)	pʁezɑ̃tʁe	fut:vous
présenteron(t)	pʁezɑ̃tʁɔ̃	fut:ils
présenterai(s)	pʁezɑ̃tʁɛ	cond:je/tu
présenterai(t)	pʁezɑ̃tʁɛ	cond:il
présenterion(s)	pʁezɑ̃təʁjɔ̃	cond:nous
présenterie(z)	pʁezɑ̃təʁje	cond:vous
présenterai(ent)	pʁezɑ̃tʁɛ	cond:ils
>respecte(r)	ʁɛspɛkte	v	1
respect(e)	ʁɛspɛkt	pr:je/il
respect(es)	ʁɛspɛkt	pr:tu
respect(ent)	ʁɛspɛkt	pr:ils
respectai(s)	ʁɛspɛktɛ	imp:je/tu
respectai(t)	ʁɛspɛktɛ	imp:il
respection(s)	ʁɛspɛktjɔ̃	imp:nous
respectie(z)	ʁɛspɛktje	imp:vous
respectai(ent)	ʁɛspɛktɛ	imp:ils
respecton(s)	ʁɛspɛktɔ̃	pr:nous
respecte(z)	ʁɛspɛkte	pr:vous
respectan(t)	ʁɛspɛktɑ̃	ppr
respecté	ʁɛspɛkte	pp
respecté(e)	ʁɛspɛkte	pp:f
respecterai	ʁɛspɛktəʁe	fut:je
respectera(s)	ʁɛspɛktəʁa	fut:tu
respectera	ʁɛspɛktəʁa	fut:il
respecteron(s)	ʁɛspɛktəʁɔ̃	fut:nous
respectere(z)	ʁɛspɛktəʁe	fut:vous
respecteron(t)	ʁɛspɛktəʁɔ̃	fut:ils
respecterai(s)	ʁɛspɛktəʁɛ	cond:je/tu
respecterai(t)	ʁɛspɛktəʁɛ	cond:il
respecterion(s)	ʁɛspɛktəʁjɔ̃	cond:nous
respecterie(z)	ʁɛspɛktəʁje	cond:vous
respecterai(ent)	ʁɛspɛktəʁɛ	cond:ils
>fête(r)	fɛte	v	1
fêt(e)	fɛt	pr:je/il
fêt(es)	fɛt	pr:tu
fêt(ent)	fɛt	pr:ils
fêtai(s)	fɛtɛ	imp:je/tu
fêtai(t)	fɛtɛ	imp:il
fêtion(s)	fɛtjɔ̃	imp:nous
fêtie(z)	fɛtje	imp:vous
fêtai(ent)	fɛtɛ	imp:ils
fêton(s)	fɛtɔ̃	pr:nous
fête(z)	fɛte	pr:vous
fêtan(t)	fɛtɑ̃	ppr
fêté	fɛte	pp
fêté(e)	fɛte	pp:f
fêterai	fɛtʁe	fut:je
fêtera(s)	fɛtʁa	fut:tu
fêtera	fɛtʁa	fut:il
fêteron(s)	fɛtʁɔ̃	fut:nous
fêtere(z)	fɛtʁe	fut:vous
fêteron(t)	fɛtʁɔ̃	fut:ils
fêterai(s)	fɛtʁɛ	cond:je/tu
fêterai(t)	fɛtʁɛ	cond:il
fêterion(s)	fɛtəʁjɔ̃	cond:nous
fêterie(z)	fɛtəʁje	cond:vous
fêterai(ent)	fɛtʁɛ	cond:ils
>cache(r)	kaʃe	v	1
cach(e)	kaʃ	pr:je/il
cach(es)	kaʃ	pr:tu
cach(ent)	kaʃ	pr:ils
cachai(s)	kaʃɛ	imp:je/tu
cachai(t)	kaʃɛ	imp:il
cachion(s)	kaʃjɔ̃	imp:nous
cachie(z)	kaʃje	imp:vous
cachai(ent)	kaʃɛ	imp:ils
cachon(s)	kaʃɔ̃	pr:nous
cache(z)	kaʃe	pr:vous
cachan(t)	kaʃɑ̃	ppr
caché	kaʃe	pp
caché(e)	kaʃe	pp:f
cacherai	kaʃʁe	fut:je
cachera(s)	kaʃʁa	fut:tu
cachera	kaʃʁa	fut:il
cacheron(s)	kaʃʁɔ̃	fut:nous
cachere(z)	kaʃʁe	fut:vous
cacheron(t)	kaʃʁɔ̃	fut:ils
cacherai(s)	kaʃʁɛ	cond:je/tu
cacherai(t)	kaʃʁɛ	cond:il
cacherion(s)	kaʃəʁjɔ̃	cond:nous
cacherie(z)	kaʃəʁje	cond:vous
cacherai(ent)	kaʃʁɛ	cond:ils
>casse(r)	kase	v	1
cass(e)	kas	pr:je/il
cass(es)	kas	pr:tu
cass(ent)	kas	pr:ils
cassai(s)	kasɛ	imp:je/tu
cassai(t)	kasɛ	imp:il
cassion(s)	kasjɔ̃	imp:nous
cassie(z)	kasje	imp:vous
cassai(ent)	kasɛ	imp:ils
casson(s)	kasɔ̃	pr:nous
casse(z)	kase	pr:vous
cassan(t)	kasɑ̃	ppr
cassé	kase	pp
cassé(e)	kase	pp:f
casserai	kasʁe	fut:je
cassera(s)	kasʁa	fut:tu
cassera	kasʁa	fut:il
casseron(s)	kasʁɔ̃	fut:nous
cassere(z)	kasʁe	fut:vous
casseron(t)	kasʁɔ̃	fut:ils
casserai(s)	kasʁɛ	cond:je/tu
casserai(t)	kasʁɛ	cond:il
casserion(s)	kasəʁjɔ̃	cond:nous
casserie(z)	kasəʁje	cond:vous
casserai(ent)	kasʁɛ	cond:ils
>brûle(r)	bʁyle	v	1
brûl(e)	bʁyl	pr:je/il
brûl(es)	bʁyl	pr:tu
brûl(ent)	bʁyl	pr:ils
brûlai(s)	bʁylɛ	imp:je/tu
brûlai(t)	bʁylɛ	imp:il
brûlion(s)	bʁyljɔ̃	imp:nous
brûlie(z)	bʁylje	imp:vous
brûlai(ent)	bʁylɛ	imp:ils
brûlon(s)	bʁylɔ̃	pr:nous
brûle(z)	bʁyle	pr:vous
brûlan(t)	bʁylɑ̃	ppr
brûlé	bʁyle	pp
brûlé(e)	bʁyle	pp:f
brûlerai	bʁylʁe	fut:je
brûlera(s)	bʁylʁa	fut:tu
brûlera	bʁylʁa	fut:il
brûleron(s)	bʁylʁɔ̃	fut:nous
brûlere(z)	bʁylʁe	fut:vous
brûleron(t)	bʁylʁɔ̃	fut:ils
brûlerai(s)	bʁylʁɛ	cond:je/tu
brûlerai(t)	bʁylʁɛ	cond:il
brûlerion(s)	bʁyləʁjɔ̃	cond:nous
brûlerie(z)	bʁyləʁje	cond:vous
brûlerai(ent)	bʁylʁɛ	cond:ils
>vole(r)	vɔle	v	1
vol(e)	vɔl	pr:je/il
vol(es)	vɔl	pr:tu
vol(ent)	vɔl	pr:ils
volai(s)	vɔlɛ	imp:je/tu
volai(t)	vɔlɛ	imp:il
volion(s)	vɔljɔ̃	imp:nous
volie(z)	vɔlje	imp:vous
volai(ent)	vɔlɛ	imp:ils
volon(s)	vɔlɔ̃	pr:nous
vole(z)	vɔle	pr:vous
volan(t)	vɔlɑ̃	ppr
volé	vɔle	pp
volé(e)	vɔle	pp:f
volerai	vɔlʁe	fut:je
volera(s)	vɔlʁa	fut:tu
volera	vɔlʁa	fut:il
voleron(s)	vɔlʁɔ̃	fut:nous
volere(z)	vɔlʁe	fut:vous
voleron(t)	vɔlʁɔ̃	fut:ils
volerai(s)	vɔlʁɛ	cond:je/tu
volerai(t)	vɔlʁɛ	cond:il
volerion(s)	vɔləʁjɔ̃	cond:nous
volerie(z)	vɔləʁje	cond:vous
volerai(ent)	vɔlʁɛ	cond:ils
>tousse(r)	tuse	v	1
touss(e)	tus	pr:je/il
touss(es)	tus	pr:tu
touss(ent)	tus	pr:ils
toussai(s)	tusɛ	imp:je/tu
toussai(t)	tusɛ	imp:il
toussion(s)	tusjɔ̃	imp:nous
toussie(z)	tusje	imp:vous
toussai(ent)	tusɛ	imp:ils
tousson(s)	tusɔ̃	pr:nous
tousse(z)	tuse	pr:vous
toussan(t)	tusɑ̃	ppr
toussé	tuse	pp
toussé(e)	tuse	pp:f
tousserai	tusʁe	fut:je
toussera(s)	tusʁa	fut:tu
toussera	tusʁa	fut:il
tousseron(s)	tusʁɔ̃	fut:nous
toussere(z)	tusʁe	fut:vous
tousseron(t)	tusʁɔ̃	fut:ils
tousserai(s)	tusʁɛ	cond:je/tu
tousserai(t)	tusʁɛ	cond:il
tousserion(s)	tusəʁjɔ̃	cond:nous
tousserie(z)	tusəʁje	cond:vous
tousserai(ent)	tusʁɛ	cond:ils
>soigne(r)	swaɲe	v	1
soign(e)	swaɲ	pr:je/il
soign(es)	swaɲ	pr:tu
soign(ent)	swaɲ	pr:ils
soignai(s)	swaɲɛ	imp:je/tu
soignai(t)	swaɲɛ	imp:il
soignion(s)	swaɲjɔ̃	imp:nous
soignie(z)	swaɲje	imp:vous
soignai(ent)	swaɲɛ	imp:ils
soignon(s)	swaɲɔ̃	pr:nous
soigne(z)	swaɲe	pr:vous
soignan(t)	swaɲɑ̃	ppr
soigné	swaɲe	pp
soigné(e)	swaɲe	pp:f
soignerai	swaɲʁe	fut:je
soignera(s)	swaɲʁa	fut:tu
soignera	swaɲʁa	fut:il
soigneron(s)	swaɲʁɔ̃	fut:nous
soignere(z)	swaɲʁe	fut:vous
soigneron(t)	swaɲʁɔ̃	fut:ils
soignerai(s)	swaɲʁɛ	cond:je/tu
soignerai(t)	swaɲʁɛ	cond:il
soignerion(s)	swaɲəʁjɔ̃	cond:nous
soignerie(z)	swaɲəʁje	cond:vous
soignerai(ent)	swaɲʁɛ	cond:ils
>respire(r)	ʁɛspiʁe	v	1
respir(e)	ʁɛspiʁ	pr:je/il
respir(es)	ʁɛspiʁ	pr:tu
respir(ent)	ʁɛspiʁ	pr:ils
respirai(s)	ʁɛspiʁɛ	imp:je/tu
respirai(t)	ʁɛspiʁɛ	imp:il
respirion(s)	ʁɛspiʁjɔ̃	imp:nous
respirie(z)	ʁɛspiʁje	imp:vous
respirai(ent)	ʁɛspiʁɛ	imp:ils
respiron(s)	ʁɛspiʁɔ̃	pr:nous
respire(z)	ʁɛspiʁe	pr:vous
respiran(t)	ʁɛspiʁɑ̃	ppr
respiré	ʁɛspiʁe	pp
respiré(e)	ʁɛspiʁe	pp:f
respirerai	ʁɛspiʁʁe	fut:je
respirera(s)	ʁɛspiʁʁa	fut:tu
respirera	ʁɛspiʁʁa	fut:il
respireron(s)	ʁɛspiʁʁɔ̃	fut:nous
respirere(z)	ʁɛspiʁʁe	fut:vous
respireron(t)	ʁɛspiʁʁɔ̃	fut:ils
respirerai(s)	ʁɛspiʁʁɛ	cond:je/tu
respirerai(t)	ʁɛspiʁʁɛ	cond:il
respirerion(s)	ʁɛspiʁəʁjɔ̃	cond:nous
respirerie(z)	ʁɛspiʁəʁje	cond:vous
respirerai(ent)	ʁɛspiʁʁɛ	cond:ils
>blesse(r)	blɛse	v	1
bless(e)	blɛs	pr:je/il
bless(es)	blɛs	pr:tu
bless(ent)	blɛs	pr:ils
blessai(s)	blɛsɛ	imp:je/tu
blessai(t)	blɛsɛ	imp:il
blession(s)	blɛsjɔ̃	imp:nous
blessie(z)	blɛsje	imp:vous
blessai(ent)	blɛsɛ	imp:ils
blesson(s)	blɛsɔ̃	pr:nous
blesse(z)	blɛse	pr:vous
blessan(t)	blɛsɑ̃	ppr
blessé	blɛse	pp
blessé(e)	blɛse	pp:f
blesserai	blɛsʁe	fut:je
blessera(s)	blɛsʁa	fut:tu
blessera	blɛsʁa	fut:il
blesseron(s)	blɛsʁɔ̃	fut:nous
blessere(z)	blɛsʁe	fut:vous
blesseron(t)	blɛsʁɔ̃	fut:ils
blesserai(s)	blɛsʁɛ	cond:je/tu
blesserai(t)	blɛsʁɛ	cond:il
blesserion(s)	blɛsəʁjɔ̃	cond:nous
blesserie(z)	blɛsəʁje	cond:vous
blesserai(ent)	blɛsʁɛ	cond:ils
>pese(r)	pəze	v	1
pès(e)	pɛz	pr:je/il
pès(es)	pɛz	pr:tu
pès(ent)	pɛz	pr:ils
pesai(s)	pəzɛ	imp:je/tu
pesai(t)	pəzɛ	imp:il
pesion(s)	pəzjɔ̃	imp:nous
pesie(z)	pəzje	imp:vous
pesai(ent)	pəzɛ	imp:ils
peson(s)	pəzɔ̃	pr:nous
pese(z)	pəze	pr:vous
pesan(t)	pəzɑ̃	ppr
pesé	pəze	pp
pesé(e)	pəze	pp:f
pèserai	pɛzʁe	fut:je
pèsera(s)	pɛzʁa	fut:tu
pèsera	pɛzʁa	fut:il
pèseron(s)	pɛzʁɔ̃	fut:nous
pèsere(z)	pɛzʁe	fut:vous
pèseron(t)	pɛzʁɔ̃	fut:ils
pèserai(s)	pɛzʁɛ	cond:je/tu
pèserai(t)	pɛzʁɛ	cond:il
pèserion(s)	pɛzəʁjɔ̃	cond:nous
pèserie(z)	pɛzəʁje	cond:vous
pèserai(ent)	pɛzʁɛ	cond:ils
>mesure(r)	məzyʁe	v	1
mesur(e)	məzyʁ	pr:je/il
mesur(es)	məzyʁ	pr:tu
mesur(ent)	məzyʁ	pr:ils
mesurai(s)	məzyʁɛ	imp:je/tu
mesurai(t)	məzyʁɛ	imp:il
mesurion(s)	məzyʁjɔ̃	imp:nous
mesurie(z)	məzyʁje	imp:vous
mesurai(ent)	məzyʁɛ	imp:ils
mesuron(s)	məzyʁɔ̃	pr:nous
mesure(z)	məzyʁe	pr:vous
mesuran(t)	məzyʁɑ̃	ppr
mesuré	məzyʁe	pp
mesuré(e)	məzyʁe	pp:f
mesurerai	məzyʁʁe	fut:je
mesurera(s)	məzyʁʁa	fut:tu
mesurera	məzyʁʁa	fut:il
mesureron(s)	məzyʁʁɔ̃	fut:nous
mesurere(z)	məzyʁʁe	fut:vous
mesureron(t)	məzyʁʁɔ̃	fut:ils
mesurerai(s)	məzyʁʁɛ	cond:je/tu
mesurerai(t)	məzyʁʁɛ	cond:il
mesurerion(s)	məzyʁəʁjɔ̃	cond:nous
mesurerie(z)	məzyʁəʁje	cond:vous
mesurerai(ent)	məzyʁʁɛ	cond:ils
>ajoute(r)	aʒute	v	1
ajout(e)	aʒut	pr:je/il
ajout(es)	aʒut	pr:tu
ajout(ent)	aʒut	pr:ils
ajoutai(s)	aʒutɛ	imp:je/tu
ajoutai(t)	aʒutɛ	imp:il
ajoution(s)	aʒutjɔ̃	imp:nous
ajoutie(z)	aʒutje	imp:vous
ajoutai(ent)	aʒutɛ	imp:ils
ajouton(s)	aʒutɔ̃	pr:nous
ajoute(z)	aʒute	pr:vous
ajoutan(t)	aʒutɑ̃	ppr
ajouté	aʒute	pp
ajouté(e)	aʒute	pp:f
ajouterai	aʒutʁe	fut:je
ajoutera(s)	aʒutʁa	fut:tu
ajoutera	aʒutʁa	fut:il
ajouteron(s)	aʒutʁɔ̃	fut:nous
ajoutere(z)	aʒutʁe	fut:vous
ajouteron(t)	aʒutʁɔ̃	fut:ils
ajouterai(s)	aʒutʁɛ	cond:je/tu
ajouterai(t)	aʒutʁɛ	cond:il
ajouterion(s)	aʒutəʁjɔ̃	cond:nous
ajouterie(z)	aʒutəʁje	cond:vous
ajouterai(ent)	aʒutʁɛ	cond:ils
>mélange(r)	melɑ̃ʒe	v	1
mélang(e)	melɑ̃ʒ	pr:je/il
mélang(es)	melɑ̃ʒ	pr:tu
mélang(ent)	melɑ̃ʒ	pr:ils
mélangeai(s)	melɑ̃ʒɛ	imp:je/tu
mélangeai(t)	melɑ̃ʒɛ	imp:il
mélangion(s)	melɑ̃ʒjɔ̃	imp:nous
mélangie(z)	melɑ̃ʒje	imp:vous
mélangeai(ent)	melɑ̃ʒɛ	imp:ils
mélangeon(s)	melɑ̃ʒɔ̃	pr:nous
mélange(z)	melɑ̃ʒe	pr:vous
mélangean(t)	melɑ̃ʒɑ̃	ppr
mélangé	melɑ̃ʒe	pp
mélangé(e)	melɑ̃ʒe	pp:f
mélangerai	melɑ̃ʒʁe	fut:je
mélangera(s)	melɑ̃ʒʁa	fut:tu
mélangera	melɑ̃ʒʁa	fut:il
mélangeron(s)	melɑ̃ʒʁɔ̃	fut:nous
mélangere(z)	melɑ̃ʒʁe	fut:vous
mélangeron(t)	melɑ̃ʒʁɔ̃	fut:ils
mélangerai(s)	melɑ̃ʒʁɛ	cond:je/tu
mélangerai(t)	melɑ̃ʒʁɛ	cond:il
mélangerion(s)	melɑ̃ʒəʁjɔ̃	cond:nous
mélangerie(z)	melɑ̃ʒəʁje	cond:vous
mélangerai(ent)	melɑ̃ʒʁɛ	cond:ils
>chauffe(r)	ʃofe	v	1
chauff(e)	ʃof	pr:je/il
chauff(es)	ʃof	pr:tu
chauff(ent)	ʃof	pr:ils
chauffai(s)	ʃofɛ	imp:je/tu
chauffai(t)	ʃofɛ	imp:il
chauffion(s)	ʃofjɔ̃	imp:nous
chauffie(z)	ʃofje	imp:vous
chauffai(ent)	ʃofɛ	imp:ils
chauffon(s)	ʃofɔ̃	pr:nous
chauffe(z)	ʃofe	pr:vous
chauffan(t)	ʃofɑ̃	ppr
chauffé	ʃofe	pp
chauffé(e)	ʃofe	pp:f
chaufferai	ʃofʁe	fut:je
chauffera(s)	ʃofʁa	fut:tu
chauffera	ʃofʁa	fut:il
chaufferon(s)	ʃofʁɔ̃	fut:nous
chauffere(z)	ʃofʁe	fut:vous
chaufferon(t)	ʃofʁɔ̃	fut:ils
chaufferai(s)	ʃofʁɛ	cond:je/tu
chaufferai(t)	ʃofʁɛ	cond:il
chaufferion(s)	ʃofəʁjɔ̃	cond:nous
chaufferie(z)	ʃofəʁje	cond:vous
chaufferai(ent)	ʃofʁɛ	cond:ils
>verse(r)	vɛʁse	v	1
vers(e)	vɛʁs	pr:je/il
vers(es)	vɛʁs	pr:tu
vers(ent)	vɛʁs	pr:ils
versai(s)	vɛʁsɛ	imp:je/tu
versai(t)	vɛʁsɛ	imp:il
version(s)	vɛʁsjɔ̃	imp:nous
versie(z)	vɛʁsje	imp:vous
versai(ent)	vɛʁsɛ	imp:ils
verson(s)	vɛʁsɔ̃	pr:nous
verse(z)	vɛʁse	pr:vous
versan(t)	vɛʁsɑ̃	ppr
versé	vɛʁse	pp
versé(e)	vɛʁse	pp:f
verserai	vɛʁsəʁe	fut:je
versera(s)	vɛʁsəʁa	fut:tu
versera	vɛʁsəʁa	fut:il
verseron(s)	vɛʁsəʁɔ̃	fut:nous
versere(z)	vɛʁsəʁe	fut:vous
verseron(t)	vɛʁsəʁɔ̃	fut:ils
verserai(s)	vɛʁsəʁɛ	cond:je/tu
verserai(t)	vɛʁsəʁɛ	cond:il
verserion(s)	vɛʁsəʁjɔ̃	cond:nous
verserie(z)	vɛʁsəʁje	cond:vous
verserai(ent)	vɛʁsəʁɛ	cond:ils
>gare(r)	gaʁe	v	1
gar(e)	gaʁ	pr:je/il
gar(es)	gaʁ	pr:tu
gar(ent)	gaʁ	pr:ils
garai(s)	gaʁɛ	imp:je/tu
garai(t)	gaʁɛ	imp:il
garion(s)	gaʁjɔ̃	imp:nous
garie(z)	gaʁje	imp:vous
garai(ent)	gaʁɛ	imp:ils
garon(s)	gaʁɔ̃	pr:nous
gare(z)	gaʁe	pr:vous
garan(t)	gaʁɑ̃	ppr
garé	gaʁe	pp
garé(e)	gaʁe	pp:f
garerai	gaʁʁe	fut:je
garera(s)	gaʁʁa	fut:tu
garera	gaʁʁa	fut:il
gareron(s)	gaʁʁɔ̃	fut:nous
garere(z)	gaʁʁe	fut:vous
gareron(t)	gaʁʁɔ̃	fut:ils
garerai(s)	gaʁʁɛ	cond:je/tu
garerai(t)	gaʁʁɛ	cond:il
garerion(s)	gaʁəʁjɔ̃	cond:nous
garerie(z)	gaʁəʁje	cond:vous
garerai(ent)	gaʁʁɛ	cond:ils
>loupe(r)	lupe	v	1
loup(e)	lup	pr:je/il
loup(es)	lup	pr:tu
loup(ent)	lup	pr:ils
loupai(s)	lupɛ	imp:je/tu
loupai(t)	lupɛ	imp:il
loupion(s)	lupjɔ̃	imp:nous
loupie(z)	lupje	imp:vous
loupai(ent)	lupɛ	imp:ils
loupon(s)	lupɔ̃	pr:nous
loupe(z)	lupe	pr:vous
loupan(t)	lupɑ̃	ppr
loupé	lupe	pp
loupé(e)	lupe	pp:f
louperai	lupʁe	fut:je
loupera(s)	lupʁa	fut:tu
loupera	lupʁa	fut:il
louperon(s)	lupʁɔ̃	fut:nous
loupere(z)	lupʁe	fut:vous
louperon(t)	lupʁɔ̃	fut:ils
louperai(s)	lupʁɛ	cond:je/tu
louperai(t)	lupʁɛ	cond:il
louperion(s)	lupəʁjɔ̃	cond:nous
louperie(z)	lupəʁje	cond:vous
louperai(ent)	lupʁɛ	cond:ils
>rate(r)	ʁate	v	1
rat(e)	ʁat	pr:je/il
rat(es)	ʁat	pr:tu
rat(ent)	ʁat	pr:ils
ratai(s)	ʁatɛ	imp:je/tu
ratai(t)	ʁatɛ	imp:il
ration(s)	ʁatjɔ̃	imp:nous
ratie(z)	ʁatje	imp:vous
ratai(ent)	ʁatɛ	imp:ils
raton(s)	ʁatɔ̃	pr:nous
rate(z)	ʁate	pr:vous
ratan(t)	ʁatɑ̃	ppr
raté	ʁate	pp
raté(e)	ʁate	pp:f
raterai	ʁatʁe	fut:je
ratera(s)	ʁatʁa	fut:tu
ratera	ʁatʁa	fut:il
rateron(s)	ʁatʁɔ̃	fut:nous
ratere(z)	ʁatʁe	fut:vous
rateron(t)	ʁatʁɔ̃	fut:ils
raterai(s)	ʁatʁɛ	cond:je/tu
raterai(t)	ʁatʁɛ	cond:il
raterion(s)	ʁatəʁjɔ̃	cond:nous
raterie(z)	ʁatəʁje	cond:vous
raterai(ent)	ʁatʁɛ	cond:ils
>tente(r)	tɑ̃te	v	1
tent(e)	tɑ̃t	pr:je/il
tent(es)	tɑ̃t	pr:tu
tent(ent)	tɑ̃t	pr:ils
tentai(s)	tɑ̃tɛ	imp:je/tu
tentai(t)	tɑ̃tɛ	imp:il
tention(s)	tɑ̃tjɔ̃	imp:nous
tentie(z)	tɑ̃tje	imp:vous
tentai(ent)	tɑ̃tɛ	imp:ils
tenton(s)	tɑ̃tɔ̃	pr:nous
tente(z)	tɑ̃te	pr:vous
tentan(t)	tɑ̃tɑ̃	ppr
tenté	tɑ̃te	pp
tenté(e)	tɑ̃te	pp:f
tenterai	tɑ̃tʁe	fut:je
tentera(s)	tɑ̃tʁa	fut:tu
tentera	tɑ̃tʁa	fut:il
tenteron(s)	tɑ̃tʁɔ̃	fut:nous
tentere(z)	tɑ̃tʁe	fut:vous
tenteron(t)	tɑ̃tʁɔ̃	fut:ils
tenterai(s)	tɑ̃tʁɛ	cond:je/tu
tenterai(t)	tɑ̃tʁɛ	cond:il
tenterion(s)	tɑ̃təʁjɔ̃	cond:nous
tenterie(z)	tɑ̃təʁje	cond:vous
tenterai(ent)	tɑ̃tʁɛ	cond:ils
>pratique(r)	pʁatike	v	1
pratiqu(e)	pʁatik	pr:je/il
pratiqu(es)	pʁatik	pr:tu
pratiqu(ent)	pʁatik	pr:ils
pratiquai(s)	pʁatikɛ	imp:je/tu
pratiquai(t)	pʁatikɛ	imp:il
pratiquion(s)	pʁatikjɔ̃	imp:nous
pratiquie(z)	pʁatikje	imp:vous
pratiquai(ent)	pʁatikɛ	imp:ils
pratiquon(s)	pʁatikɔ̃	pr:nous
pratique(z)	pʁatike	pr:vous
pratiquan(t)	pʁatikɑ̃	ppr
pratiqué	pʁatike	pp
pratiqué(e)	pʁatike	pp:f
pratiquerai	pʁatikʁe	fut:je
pratiquera(s)	pʁatikʁa	fut:tu
pratiquera	pʁatikʁa	fut:il
pratiqueron(s)	pʁatikʁɔ̃	fut:nous
pratiquere(z)	pʁatikʁe	fut:vous
pratiqueron(t)	pʁatikʁɔ̃	fut:ils
pratiquerai(s)	pʁatikʁɛ	cond:je/tu
pratiquerai(t)	pʁatikʁɛ	cond:il
pratiquerion(s)	pʁatikəʁjɔ̃	cond:nous
pratiquerie(z)	pʁatikəʁje	cond:vous
pratiquerai(ent)	pʁatikʁɛ	cond:ils
>progresse(r)	pʁɔgʁɛse	v	1
progress(e)	pʁɔgʁɛs	pr:je/il
progress(es)	pʁɔgʁɛs	pr:tu
progress(ent)	pʁɔgʁɛs	pr:ils
progressai(s)	pʁɔgʁɛsɛ	imp:je/tu
progressai(t)	pʁɔgʁɛsɛ	imp:il
progression(s)	pʁɔgʁɛsjɔ̃	imp:nous
progressie(z)	pʁɔgʁɛsje	imp:vous
progressai(ent)	pʁɔgʁɛsɛ	imp:ils
progresson(s)	pʁɔgʁɛsɔ̃	pr:nous
progresse(z)	pʁɔgʁɛse	pr:vous
progressan(t)	pʁɔgʁɛsɑ̃	ppr
progressé	pʁɔgʁɛse	pp
progressé(e)	pʁɔgʁɛse	pp:f
progresserai	pʁɔgʁɛsʁe	fut:je
progressera(s)	pʁɔgʁɛsʁa	fut:tu
progressera	pʁɔgʁɛsʁa	fut:il
progresseron(s)	pʁɔgʁɛsʁɔ̃	fut:nous
progressere(z)	pʁɔgʁɛsʁe	fut:vous
progresseron(t)	pʁɔgʁɛsʁɔ̃	fut:ils
progresserai(s)	pʁɔgʁɛsʁɛ	cond:je/tu
progresserai(t)	pʁɔgʁɛsʁɛ	cond:il
progresserion(s)	pʁɔgʁɛsəʁjɔ̃	cond:nous
progresserie(z)	pʁɔgʁɛsəʁje	cond:vous
progresserai(ent)	pʁɔgʁɛsʁɛ	cond:ils
>prononce(r)	pʁɔnɔ̃se	v	1
prononc(e)	pʁɔnɔ̃s	pr:je/il
prononc(es)	pʁɔnɔ̃s	pr:tu
prononc(ent)	pʁɔnɔ̃s	pr:ils
prononçai(s)	pʁɔnɔ̃sɛ	imp:je/tu
prononçai(t)	pʁɔnɔ̃sɛ	imp:il
prononcion(s)	pʁɔnɔ̃sjɔ̃	imp:nous
prononcie(z)	pʁɔnɔ̃sje	imp:vous
prononçai(ent)	pʁɔnɔ̃sɛ	imp:ils
prononçon(s)	pʁɔnɔ̃sɔ̃	pr:nous
prononce(z)	pʁɔnɔ̃se	pr:vous
prononçan(t)	pʁɔnɔ̃sɑ̃	ppr
prononcé	pʁɔnɔ̃se	pp
prononcé(e)	pʁɔnɔ̃se	pp:f
prononcerai	pʁɔnɔ̃sʁe	fut:je
prononcera(s)	pʁɔnɔ̃sʁa	fut:tu
prononcera	pʁɔnɔ̃sʁa	fut:il
prononceron(s)	pʁɔnɔ̃sʁɔ̃	fut:nous
prononcere(z)	pʁɔnɔ̃sʁe	fut:vous
prononceron(t)	pʁɔnɔ̃sʁɔ̃	fut:ils
prononcerai(s)	pʁɔnɔ̃sʁɛ	cond:je/tu
prononcerai(t)	pʁɔnɔ̃sʁɛ	cond:il
prononcerion(s)	pʁɔnɔ̃səʁjɔ̃	cond:nous
prononcerie(z)	pʁɔnɔ̃səʁje	cond:vous
prononcerai(ent)	pʁɔnɔ̃sʁɛ	cond:ils
>enseigne(r)	ɑ̃sɛɲe	v	1
enseign(e)	ɑ̃sɛɲ	pr:je/il
enseign(es)	ɑ̃sɛɲ	pr:tu
enseign(ent)	ɑ̃sɛɲ	pr:ils
enseignai(s)	ɑ̃sɛɲɛ	imp:je/tu
enseignai(t)	ɑ̃sɛɲɛ	imp:il
enseignion(s)	ɑ̃sɛɲjɔ̃	imp:nous
enseignie(z)	ɑ̃sɛɲje	imp:vous
enseignai(ent)	ɑ̃sɛɲɛ	imp:ils
enseignon(s)	ɑ̃sɛɲɔ̃	pr:nous
enseigne(z)	ɑ̃sɛɲe	pr:vous
enseignan(t)	ɑ̃sɛɲɑ̃	ppr
enseigné	ɑ̃sɛɲe	pp
enseigné(e)	ɑ̃sɛɲe	pp:f
enseignerai	ɑ̃sɛɲʁe	fut:je
enseignera(s)	ɑ̃sɛɲʁa	fut:tu
enseignera	ɑ̃sɛɲʁa	fut:il
enseigneron(s)	ɑ̃sɛɲʁɔ̃	fut:nous
enseignere(z)	ɑ̃sɛɲʁe	fut:vous
enseigneron(t)	ɑ̃sɛɲʁɔ̃	fut:ils
enseignerai(s)	ɑ̃sɛɲʁɛ	cond:je/tu
enseignerai(t)	ɑ̃sɛɲʁɛ	cond:il
enseignerion(s)	ɑ̃sɛɲəʁjɔ̃	cond:nous
enseignerie(z)	ɑ̃sɛɲəʁje	cond:vous
enseignerai(ent)	ɑ̃sɛɲʁɛ	cond:ils
>(h)omm(e)	ɔm	nm	1
>femm(e)	fam	nf	1
>enfan(t)	ɑ̃fɑ̃	nmf	1
>garçon	gaʁsɔ̃	nm	1
>fill(e)	fij	nf	1
>fi(l)s	fis	nm	1
>bébé	bebe	nm	1
>ami	ami	nm	1
ami(e)	ami	f
>copain	kɔpɛ̃	nm	1
copin(e)	kɔpin	f
>gen(s)	ʒɑ̃	nmpl	1
>monsieu(r)	məsjø	nm	1
>madam(e)	madam	nf	1
>pèr(e)	pɛʁ	nm	1
>mèr(e)	mɛʁ	nf	1
>paren(t)	paʁɑ̃	nm	1
>frèr(e)	fʁɛʁ	nm	1
>sœur	sœʁ	nf	1
>mari	maʁi	nm	1
>grand-mèr(e)	gʁɑ̃mɛʁ	nf	1
>grand-pèr(e)	gʁɑ̃pɛʁ	nm	1
>petits-enfan(ts)	pətizɑ̃fɑ̃	nmpl	1
>oncl(e)	ɔ̃kl	nm	1
>tant(e)	tɑ̃t	nf	1
>cousin	kuzɛ̃	nm	1
cousin(e)	kuzin	f
>famill(e)	famij	nf	1
>voisin	vwazɛ̃	nm	1
voisin(e)	vwazin	f
>collègu(e)	kɔlɛg	nmf	1
>patron	patʁɔ̃	nm	1
patronn(e)	patʁɔn	f
>camarad(e)	kamaʁad	nmf	1
>coloc	kɔlɔk	nmf	1
>partenair(e)	paʁtənɛʁ	nmf	1
>élèv(e)	elɛv	nmf	1
>étudian(t)	etydjɑ̃	nm	1
étudiant(e)	etydjɑ̃t	f
>professeur	pʁɔfesœʁ	nm	1
>médecin	medsɛ̃	nm	1
>docteur	dɔktœʁ	nm	1
>infirmie(r)	ɛ̃fiʁmje	nm	1
infirmièr(e)	ɛ̃fiʁmjɛʁ	f
>vendeur	vɑ̃dœʁ	nm	1
vendeus(e)	vɑ̃døz	f
>serveur	sɛʁvœʁ	nm	1
serveus(e)	sɛʁvøz	f
>boulange(r)	bulɑ̃ʒe	nm	1
boulangèr(e)	bulɑ̃ʒɛʁ	f
>coiffeur	kwafœʁ	nm	1
coiffeus(e)	kwaføz	f
>conducteur	kɔ̃dyktœʁ	nm	1
conductric(e)	kɔ̃dyktʁis	f
>chauffeur	ʃofœʁ	nm	1
>cuisinie(r)	kɥizinje	nm	1
cuisinièr(e)	kɥizinjɛʁ	f
>chef	ʃɛf	nm	1
>clien(t)	klijɑ̃	nm	1
client(e)	klijɑ̃t	f
>tourist(e)	tuʁist	nmf	1
>policie(r)	pɔlisje	nm	1
>ingénieur	ɛ̃ʒenjœʁ	nm	1
>avoca(t)	avɔka	nm	1
>acteur	aktœʁ	nm	1
actric(e)	aktʁis	f
>chanteur	ʃɑ̃tœʁ	nm	1
chanteus(e)	ʃɑ̃tøz	f
>artist(e)	aʁtist	nmf	1
>écrivain	ekʁivɛ̃	nm	1
>journalist(e)	ʒuʁnalist	nmf	1
>équip(e)	ekip	nf	1
>group(e)	gʁup	nm	1
>foul(e)	ful	nf	1
>tem(ps)	tɑ̃	nm	1
>(h)eur(e)	œʁ	nf	1
>minut(e)	minyt	nf	1
>second(e)	səgɔ̃d	nf	1
>jour	ʒuʁ	nm	1
>journé(e)	ʒuʁne	nf	1
>matin	matɛ̃	nm	1
>matiné(e)	matine	nf	1
>midi	midi	nm	1
>après-midi	apʁɛmidi	nm	1
>soir	swaʁ	nm	1
>soiré(e)	swaʁe	nf	1
>nui(t)	nɥi	nf	1
>semain(e)	səmɛn	nf	1
>week-end	wikɛnd	nm	1
>moi(s)	mwa	nm	1
>an	ɑ̃	nm	1
>anné(e)	ane	nf	1
>siècl(e)	sjɛkl	nm	1
>momen(t)	mɔmɑ̃	nm	1
>foi(s)	fwa	nf	1
>débu(t)	deby	nm	1
>fin	fɛ̃	nf	1
>dat(e)	dat	nf	1
>lendemain	lɑ̃dmɛ̃	nm	1
>avenir	avniʁ	nm	1
>passé	pase	nm	1
>lundi	lœ̃di	nm	1
>mardi	maʁdi	nm	1
>mercredi	mɛʁkʁədi	nm	1
>jeudi	ʒødi	nm	1
>vendredi	vɑ̃dʁədi	nm	1
>samedi	samdi	nm	1
>dimanch(e)	dimɑ̃ʃ	nm	1
>janvie(r)	ʒɑ̃vje	nm	1
>févrie(r)	fevʁije	nm	1
>mars	maʁs	nm	1
>avril	avʁil	nm	1
>mai	mɛ	nm	1
>juin	ʒɥɛ̃	nm	1
>juille(t)	ʒɥijɛ	nm	1
>(a)oût	ut	nm	1
>septembr(e)	sɛptɑ̃bʁ	nm	1
>octobr(e)	ɔktɔbʁ	nm	1
>novembr(e)	nɔvɑ̃bʁ	nm	1
>décembr(e)	desɑ̃bʁ	nm	1
>printem(ps)	pʁɛ̃tɑ̃	nm	1
>été	ete	nm	1
>auto(m)n(e)	otɔn	nm	1
>(h)iver	ivɛʁ	nm	1
>saison	sɛzɔ̃	nf	1
>anniversair(e)	anivɛʁsɛʁ	nm	1
>vacanc(es)	vakɑ̃s	nfpl	1
>fêt(e)	fɛt	nf	1
>réveil	ʁevɛj	nm	1
>(h)orair(e)	ɔʁɛʁ	nm	1
>retar(d)	ʁətaʁ	nm	1
>avanc(e)	avɑ̃s	nf	1
>paus(e)	poz	nf	1
>siest(e)	sjɛst	nf	1
>décalag(e)	dekalaʒ	nm	1
>éternité	etɛʁnite	nf	1
>mond(e)	mɔ̃d	nm	1
>pay(s)	pei	nm	1
>vill(e)	vil	nf	1
>villag(e)	vilaʒ	nm	1
>quartie(r)	kaʁtje	nm	1
>ru(e)	ʁy	nf	1
>rout(e)	ʁut	nf	1
>chemin	ʃəmɛ̃	nm	1
>plac(e)	plas	nf	1
>pon(t)	pɔ̃	nm	1
>trottoir	tʁɔtwaʁ	nm	1
>coin	kwɛ̃	nm	1
>endroi(t)	ɑ̃dʁwa	nm	1
>maison	mɛzɔ̃	nf	1
>appartemen(t)	apaʁtəmɑ̃	nm	1
>immeubl(e)	imœbl	nm	1
>étag(e)	etaʒ	nm	1
>pièc(e)	pjɛs	nf	1
>chambr(e)	ʃɑ̃bʁ	nf	1
>cuisin(e)	kɥizin	nf	1
>salon	salɔ̃	nm	1
>sall(e)	sal	nf	1
>salle de bain	sal də bɛ̃	x	1
>toilett(es)	twalɛt	nfpl	1
>jardin	ʒaʁdɛ̃	nm	1
>port(e)	pɔʁt	nf	1
>fenêtr(e)	fənɛtʁ	nf	1
>mur	myʁ	nm	1
>plafon(d)	plafɔ̃	nm	1
>sol	sɔl	nm	1
>escalie(r)	ɛskalje	nm	1
>ascenseur	asɑ̃sœʁ	nm	1
>vole(t)	vɔlɛ	nm	1
>rideau	ʁido	nm	1
>écol(e)	ekɔl	nf	1
>université	ynivɛʁsite	nf	1
>fac	fak	nf	1
>class(e)	klas	nf	1
>bibliot(h)èqu(e)	biblijɔtɛk	nf	1
>bureau	byʁo	nm	1
>usin(e)	yzin	nf	1
>magasin	magazɛ̃	nm	1
>boutiqu(e)	butik	nf	1
>marché	maʁʃe	nm	1
>supermarché	sypɛʁmaʁʃe	nm	1
>boulangeri(e)	bulɑ̃ʒʁi	nf	1
>pharmaci(e)	faʁmasi	nf	1
>parapharmaci(e)	paʁafaʁmasi	nf	1
>librairi(e)	libʁɛʁi	nf	1
>restauran(t)	ʁɛstoʁɑ̃	nm	1
>resto	ʁɛsto	nm	1
>café	kafe	nm	1
>bistro(t)	bistʁo	nm	1
>bar	baʁ	nm	1
>cantin(e)	kɑ̃tin	nf	1
>terrass(e)	tɛʁas	nf	1
>comptoir	kɔ̃twaʁ	nm	1
>caiss(e)	kɛs	nf	1
>(h)ôtel	otɛl	nm	1
>auberg(e)	obɛʁʒ	nf	1
>dortoir	dɔʁtwaʁ	nm	1
>(h)ôpital	opital	nm	1
>banqu(e)	bɑ̃k	nf	1
>post(e)	pɔst	nf	1
>post(e)	pɔst	nm	1
>gar(e)	gaʁ	nf	1
>aéropor(t)	aeʁɔpɔʁ	nm	1
>station	stasjɔ̃	nf	1
>arrê(t)	aʁɛ	nm	1
>cinéma	sinema	nm	1
>t(h)éâtr(e)	teatʁ	nm	1
>musé(e)	myze	nm	1
>parc	paʁk	nm	1
>plag(e)	plaʒ	nf	1
>églis(e)	egliz	nf	1
>piscin(e)	pisin	nf	1
>stad(e)	stad	nm	1
>ferm(e)	fɛʁm	nf	1
>fourni(l)	fuʁni	nm	1
>campagn(e)	kɑ̃paɲ	nf	1
>montagn(e)	mɔ̃taɲ	nf	1
>mer	mɛʁ	nf	1
>rivièr(e)	ʁivjɛʁ	nf	1
>fleuv(e)	flœv	nm	1
>riv(e)	ʁiv	nf	1
>lac	lak	nm	1
>forê(t)	fɔʁɛ	nf	1
>îl(e)	il	nf	1
>terr(e)	tɛʁ	nf	1
>ciel	sjɛl	nm	1
>soleil	sɔlɛj	nm	1
>lun(e)	lyn	nf	1
>étoil(e)	etwal	nf	1
>nor(d)	nɔʁ	nm	1
>sud	syd	nm	1
>est	ɛst	nm	1
>ouest	wɛst	nm	1
>côté	kote	nm	1
>fac(e)	fas	nf	1
>milieu	miljø	nm	1
>bou(t)	bu	nm	1
>fon(d)	fɔ̃	nm	1
>centr(e)	sɑ̃tʁ	nm	1
>bor(d)	bɔʁ	nm	1
>distanc(e)	distɑ̃s	nf	1
>paysag(e)	peizaʒ	nm	1
>vu(e)	vy	nf	1
>plui(e)	plɥi	nf	1
>bruin(e)	bʁɥin	nf	1
>brouillar(d)	bʁujaʁ	nm	1
>neig(e)	nɛʒ	nf	1
>ven(t)	vɑ̃	nm	1
>nuag(e)	nɥaʒ	nm	1
>orag(e)	ɔʁaʒ	nm	1
>chaleur	ʃalœʁ	nf	1
>froi(d)	fʁwa	nm	1
>degré	dəgʁe	nm	1
>lumièr(e)	lymjɛʁ	nf	1
>ombr(e)	ɔ̃bʁ	nf	1
>air	ɛʁ	nm	1
>feu	fø	nm	1
feu(x)	fø	pl
>eau	o	nf	1
>repa(s)	ʁəpa	nm	1
>petit-déjeune(r)	pətideʒœne	nm	1
>petit-déj	pətidɛʒ	nm	1
>déjeune(r)	deʒœne	nm	1
>dîne(r)	dine	nm	1
>soupe(r)	supe	nm	1
>goûte(r)	gute	nm	1
>apéro	apeʁo	nm	1
>pla(t)	pla	nm	1
>entré(e)	ɑ̃tʁe	nf	1
>desser(t)	desɛʁ	nm	1
>menu	məny	nm	1
>cart(e)	kaʁt	nf	1
>addition	adisjɔ̃	nf	1
>pourboir(e)	puʁbwaʁ	nm	1
>pain	pɛ̃	nm	1
>baguett(e)	bagɛt	nf	1
>croissan(t)	kʁwasɑ̃	nm	1
>brioch(e)	bʁijɔʃ	nf	1
>tartin(e)	taʁtin	nf	1
>chocolatin(e)	ʃɔkɔlatin	nf	1
>sandwich	sɑ̃dwitʃ	nm	1
>beurr(e)	bœʁ	nm	1
>fromag(e)	fʁɔmaʒ	nm	1
>raclett(e)	ʁaklɛt	nf	1
>fondu(e)	fɔ̃dy	nf	1
>yaourt	jauʁt	nm	1
>œuf	œf	nm	1
œu(fs)	ø	pl
>lai(t)	lɛ	nm	1
>crèm(e)	kʁɛm	nf	1
>viand(e)	vjɑ̃d	nf	1
>bœuf	bœf	nm	1
bœu(fs)	bø	pl
>por(c)	pɔʁ	nm	1
>poule(t)	pulɛ	nm	1
>jambon	ʒɑ̃bɔ̃	nm	1
>poisson	pwasɔ̃	nm	1
>sardin(e)	saʁdin	nf	1
>légum(e)	legym	nm	1
>frui(t)	fʁɥi	nm	1
>pomm(e)	pɔm	nf	1
>pomme de terre	pɔm də tɛʁ	x	1
>frit(es)	fʁit	nfpl	1
>tomat(e)	tɔmat	nf	1
>salad(e)	salad	nf	1
>carott(e)	kaʁɔt	nf	1
>o(i)gnon	ɔɲɔ̃	nm	1
>ail	aj	nm	1
>champignon	ʃɑ̃piɲɔ̃	nm	1
>orang(e)	ɔʁɑ̃ʒ	nf	1
>banan(e)	banan	nf	1
>citron	sitʁɔ̃	nm	1
>frais(e)	fʁɛz	nf	1
>raisin	ʁɛzɛ̃	nm	1
>ri(z)	ʁi	nm	1
>pât(es)	pat	nfpl	1
>nouill(es)	nuj	nfpl	1
>ravioli(s)	ʁavjɔli	nmpl	1
>soup(e)	sup	nf	1
>sauc(e)	sos	nf	1
>sel	sɛl	nm	1
>sucr(e)	sykʁ	nm	1
>poivr(e)	pwavʁ	nm	1
>(h)uil(e)	ɥil	nf	1
>farin(e)	faʁin	nf	1
>céréal(es)	seʁeal	nfpl	1
>compot(e)	kɔ̃pɔt	nf	1
>confitur(e)	kɔ̃fityʁ	nf	1
>miel	mjɛl	nm	1
>chocola(t)	ʃɔkɔla	nm	1
>gâteau	gato	nm	1
>crêp(e)	kʁɛp	nf	1
>bonbon	bɔ̃bɔ̃	nm	1
>glac(e)	glas	nf	1
>pralin(e)	pʁalin	nf	1
>chicoré(e)	ʃikɔʁe	nf	1
>boisson	bwasɔ̃	nf	1
>t(h)é	te	nm	1
>ment(he)	mɑ̃t	nf	1
>ju(s)	ʒy	nm	1
>vin	vɛ̃	nm	1
>bièr(e)	bjɛʁ	nf	1
>expresso	ɛkspʁɛso	nm	1
>latte	late	nm	1
>verr(e)	vɛʁ	nm	1
>tass(e)	tas	nf	1
>bouteill(e)	butɛj	nf	1
>bol	bɔl	nm	1
>assiett(e)	asjɛt	nf	1
>couteau	kuto	nm	1
>fourchett(e)	fuʁʃɛt	nf	1
>cuillèr(e)	kɥijɛʁ	nf	1
>t(h)éièr(e)	tejɛʁ	nf	1
>cuiseur	kɥizœʁ	nm	1
>four	fuʁ	nm	1
>frigo	fʁigo	nm	1
>fourné(e)	fuʁne	nf	1
>morceau	mɔʁso	nm	1
>moitié	mwatje	nf	1
>rest(es)	ʁɛst	nmpl	1
>faim	fɛ̃	nf	1
>soif	swaf	nf	1
>goû(t)	gu	nm	1
>recett(e)	ʁəsɛt	nf	1
>cours(es)	kuʁs	nfpl	1
>bouchon	buʃɔ̃	nm	1
>cor(ps)	kɔʁ	nm	1
>têt(e)	tɛt	nf	1
>visag(e)	vizaʒ	nm	1
>œil	œj	nm	1
yeu(x)	jø	pl
>oreill(e)	ɔʁɛj	nf	1
>ne(z)	ne	nm	1
>bouch(e)	buʃ	nf	1
>den(t)	dɑ̃	nf	1
>cheveu	ʃəvø	nm	1
cheveu(x)	ʃəvø	pl
>barb(e)	baʁb	nf	1
>cou	ku	nm	1
>do(s)	do	nm	1
>bra(s)	bʁa	nm	1
>main	mɛ̃	nf	1
>doi(gt)	dwa	nm	1
>pouc(e)	pus	nm	1
>jamb(e)	ʒɑ̃b	nf	1
>genou	ʒənu	nm	1
genou(x)	ʒənu	pl
>pie(d)	pje	nm	1
>ventr(e)	vɑ̃tʁ	nm	1
>cœur	kœʁ	nm	1
>peau	po	nf	1
>san(g)	sɑ̃	nm	1
>voi(x)	vwa	nf	1
>santé	sɑ̃te	nf	1
>sommeil	sɔmɛj	nm	1
>rêv(e)	ʁɛv	nm	1
>douleur	dulœʁ	nf	1
>médicamen(t)	medikamɑ̃	nm	1
>soin	swɛ̃	nm	1
>vêtemen(t)	vɛtmɑ̃	nm	1
>pull	pyl	nm	1
>chemis(e)	ʃəmiz	nf	1
>pantalon	pɑ̃talɔ̃	nm	1
>jup(e)	ʒyp	nf	1
>rob(e)	ʁɔb	nf	1
>manteau	mɑ̃to	nm	1
>vest(e)	vɛst	nf	1
>chaussur(e)	ʃosyʁ	nf	1
>basket(s)	baskɛt	nfpl	1
>chaussett(e)	ʃosɛt	nf	1
>chapeau	ʃapo	nm	1
>lunett(es)	lynɛt	nfpl	1
>sac	sak	nm	1
>pair(e)	pɛʁ	nf	1
>taill(e)	taj	nf	1
>cachemir(e)	kaʃmiʁ	nm	1
>coiffur(e)	kwafyʁ	nf	1
>coup(e)	kup	nf	1
>chos(e)	ʃoz	nf	1
>truc	tʁyk	nm	1
>obje(t)	ɔbʒɛ	nm	1
>tabl(e)	tabl	nf	1
>chais(e)	ʃɛz	nf	1
>li(t)	li	nm	1
>canapé	kanape	nm	1
>armoir(e)	aʁmwaʁ	nf	1
>lamp(e)	lɑ̃p	nf	1
>lampadair(e)	lɑ̃padɛʁ	nm	1
>clé	kle	nf	1
>téléphon(e)	telefɔn	nm	1
>portabl(e)	pɔʁtabl	nm	1
>ordinateur	ɔʁdinatœʁ	nm	1
>écran	ekʁɑ̃	nm	1
>appareil	apaʁɛj	nm	1
>machin(e)	maʃin	nf	1
>appli	apli	nf	1
>télé	tele	nf	1
>radio	ʁadjo	nf	1
>photo	fɔto	nf	1
>vidéo	video	nf	1
>film	film	nm	1
>séri(e)	seʁi	nf	1
>épisod(e)	epizɔd	nm	1
>musiqu(e)	myzik	nf	1
>chanson	ʃɑ̃sɔ̃	nf	1
>livr(e)	livʁ	nm	1
>livr(e)	livʁ	nf	1
>journal	ʒuʁnal	nm	1
>dictionnair(e)	diksjɔnɛʁ	nm	1
>papie(r)	papje	nm	1
>pag(e)	paʒ	nf	1
>lettr(e)	lɛtʁ	nf	1
>mo(t)	mo	nm	1
>phras(e)	fʁaz	nf	1
>langu(e)	lɑ̃g	nf	1
>nom	nɔ̃	nm	1
>prénom	pʁenɔ̃	nm	1
>(h)istoir(e)	istwaʁ	nf	1
>question	kɛstjɔ̃	nf	1
>répons(e)	ʁepɔ̃s	nf	1
>idé(e)	ide	nf	1
>conversation	kɔ̃vɛʁsasjɔ̃	nf	1
>nouvell(e)	nuvɛl	nf	1
>stylo	stilo	nm	1
>crayon	kʁɛjɔ̃	nm	1
>cadeau	kado	nm	1
>jeu	ʒø	nm	1
jeu(x)	ʒø	pl
>boît(e)	bwat	nf	1
>ticke(t)	tikɛ	nm	1
>bille(t)	bijɛ	nm	1
>coupon	kupɔ̃	nm	1
>fleur	flœʁ	nf	1
>tulip(e)	tylip	nf	1
>bulb(e)	bylb	nm	1
>arbr(e)	aʁbʁ	nm	1
>feuill(e)	fœj	nf	1
>animal	animal	nm	1
>chien	ʃjɛ̃	nm	1
>cha(t)	ʃa	nm	1
>oiseau	wazo	nm	1
>cheval	ʃəval	nm	1
>bouillott(e)	bujɔt	nf	1
>cir(e)	siʁ	nf	1
>puc(e)	pys	nf	1
>couleur	kulœʁ	nf	1
>form(e)	fɔʁm	nf	1
>brui(t)	bʁɥi	nm	1
>odeur	ɔdœʁ	nf	1
>voitur(e)	vwatyʁ	nf	1
>bus	bys	nm	1
>métro	metʁo	nm	1
>tram	tʁam	nm	1
>train	tʁɛ̃	nm	1
>avion	avjɔ̃	nm	1
>bateau	bato	nm	1
>vélo	velo	nm	1
>taxi	taksi	nm	1
>moto	moto	nf	1
>lign(e)	liɲ	nf	1
>traje(t)	tʁaʒɛ	nm	1
>voyag(e)	vwajaʒ	nm	1
>alle(r)	ale	nm	1
>retour	ʁətuʁ	nm	1
>tour	tuʁ	nm	1
>tour	tuʁ	nf	1
>circulation	siʁkylasjɔ̃	nf	1
>valis(e)	valiz	nf	1
>bagag(e)	bagaʒ	nm	1
>passepor(t)	paspɔʁ	nm	1
>abonnemen(t)	abɔnmɑ̃	nm	1
>sorti(e)	sɔʁti	nf	1
>fil(e)	fil	nf	1
>queu(e)	kø	nf	1
>randonné(e)	ʁɑ̃dɔne	nf	1
>cours(e)	kuʁs	nf	1
>jogging	dʒɔgiŋ	nm	1
>spor(t)	spɔʁ	nm	1
>travail	tʁavaj	nm	1
travau(x)	tʁavo	pl
>métie(r)	metje	nm	1
>boulo(t)	bulo	nm	1
>affair(e)	afɛʁ	nf	1
>réunion	ʁeynjɔ̃	nf	1
>visio	vizjo	nf	1
>proje(t)	pʁɔʒɛ	nm	1
>retrait(e)	ʁətʁɛt	nf	1
>cour(s)	kuʁ	nm	1
>argen(t)	aʁʒɑ̃	nm	1
>pri(x)	pʁi	nm	1
>tarif	taʁif	nm	1
>euro	øʁo	nm	1
>centim(e)	sɑ̃tim	nm	1
>dollar	dɔlaʁ	nm	1
>fran(c)	fʁɑ̃	nm	1
>dir(h)am	diʁam	nm	1
>yuan	jɥan	nm	1
>ball(e)	bal	nf	1
>piass(e)	pjas	nf	1
>budge(t)	bydʒɛ	nm	1
>dépens(e)	depɑ̃s	nf	1
>promo	pʁɔmo	nf	1
>occasion	ɔkazjɔ̃	nf	1
>com(p)t(e)	kɔ̃t	nm	1
>doubl(e)	dubl	nm	1
>dizain(e)	dizɛn	nf	1
>quinzain(e)	kɛ̃zɛn	nf	1
>vingtain(e)	vɛ̃tɛn	nf	1
>trentain(e)	tʁɑ̃tɛn	nf	1
>quarantain(e)	kaʁɑ̃tɛn	nf	1
>vi(e)	vi	nf	1
>mor(t)	mɔʁ	nf	1
>amour	amuʁ	nm	1
>envi(e)	ɑ̃vi	nf	1
>plaisir	pleziʁ	nm	1
>(h)umeur	ymœʁ	nf	1
>peur	pœʁ	nf	1
>confianc(e)	kɔ̃fjɑ̃s	nf	1
>volonté	vɔlɔ̃te	nf	1
>chanc(e)	ʃɑ̃s	nf	1
>problèm(e)	pʁɔblɛm	nm	1
>raison	ʁɛzɔ̃	nf	1
>exempl(e)	ɛgzɑ̃pl	nm	1
>façon	fasɔ̃	nf	1
>besoin	bəzwɛ̃	nm	1
>aid(e)	ɛd	nf	1
>(h)abitud(e)	abityd	nf	1
>routin(e)	ʁutin	nf	1
>ménag(e)	menaʒ	nm	1
>vaissell(e)	vɛsɛl	nf	1
>douch(e)	duʃ	nf	1
>bain	bɛ̃	nm	1
>choi(x)	ʃwa	nm	1
>résulta(t)	ʁezylta	nm	1
>parti(e)	paʁti	nf	1
>par(t)	paʁ	nf	1
>rest(e)	ʁɛst	nm	1
>suit(e)	sɥit	nf	1
>cas(e)	kaz	nf	1
>point(e)	pwɛ̃t	nf	1
>pil(e)	pil	nf	1
>cou(p)	ku	nm	1
>ca(s)	ka	nm	1
>éta(t)	eta	nm	1
>loi	lwa	nf	1
>guerr(e)	gɛʁ	nf	1
>pai(x)	pɛ	nf	1
>enfer	ɑ̃fɛʁ	nm	1
>jeuness(e)	ʒœnɛs	nf	1
>version	vɛʁsjɔ̃	nf	1
>fermetur(e)	fɛʁmətyʁ	nf	1
>nettoyan(t)	netwajɑ̃	nm	1
>shampoin(g)	ʃɑ̃pwɛ̃	nm	1
>brushing	bʁœʃiŋ	nm	1
>bon	bɔ̃	adj	1
bonn(e)	bɔn	f
>mauvai(s)	movɛ	adj	1
mauvais(e)	movɛz	f
>gran(d)	gʁɑ̃	adj	1
grand(e)	gʁɑ̃d	f
>peti(t)	pəti	adj	1
petit(e)	pətit	f
>gro(s)	gʁo	adj	1
gross(e)	gʁos	f
>gra(s)	gʁa	adj	1
grass(e)	gʁas	f
>lon(g)	lɔ̃	adj	1
longu(e)	lɔ̃g	f
>cour(t)	kuʁ	adj	1
court(e)	kuʁt	f
>*(h)au(t)	o	adj	1
(h)aut(e)	ot	f
>ba(s)	ba	adj	1
bass(e)	bas	f
>beau	bo	adj	1
bel	bɛl	alt
bell(e)	bɛl	f
beau(x)	bo	pl
>joli	ʒɔli	adj	1
joli(e)	ʒɔli	f
>nouveau	nuvo	adj	1
nouvel	nuvɛl	alt
nouvell(e)	nuvɛl	f
nouveau(x)	nuvo	pl
>vieu(x)	vjø	adj	1
vieil	vjɛj	alt
vieill(e)	vjɛj	f
>jeun(e)	ʒœn	adj	1
>ancien	ɑ̃sjɛ̃	adj	1
ancienn(e)	ɑ̃sjɛn	f
>premie(r)	pʁəmje	adj	1
premièr(e)	pʁəmjɛʁ	f
>dernie(r)	dɛʁnje	adj	1
dernièr(e)	dɛʁnjɛʁ	f
>prochain	pʁɔʃɛ̃	adj	1
prochain(e)	pʁɔʃɛn	f
>seul	sœl	adj	1
seul(e)	sœl	f
>plein	plɛ̃	adj	1
plein(e)	plɛn	f
>vid(e)	vid	adj	1
>ouver(t)	uvɛʁ	adj	1
ouvert(e)	uvɛʁt	f
>fermé	fɛʁme	adj	1
fermé(e)	fɛʁme	f
>chau(d)	ʃo	adj	1
chaud(e)	ʃod	f
>froi(d)	fʁwa	adj	1
froid(e)	fʁwad	f
>frai(s)	fʁɛ	adj	1
fraîch(e)	fʁɛʃ	f
>dou(x)	du	adj	1
douc(e)	dus	f
>dur	dyʁ	adj	1
dur(e)	dyʁ	f
>facil(e)	fasil	adj	1
>difficil(e)	difisil	adj	1
>simpl(e)	sɛ̃pl	adj	1
>possibl(e)	pɔsibl	adj	1
>impossibl(e)	ɛ̃pɔsibl	adj	1
>importan(t)	ɛ̃pɔʁtɑ̃	adj	1
important(e)	ɛ̃pɔʁtɑ̃t	f
>intéressan(t)	ɛ̃teʁesɑ̃	adj	1
intéressant(e)	ɛ̃teʁesɑ̃t	f
>vrai	vʁɛ	adj	1
vraie	vʁɛ	f
>fau(x)	fo	adj	1
fauss(e)	fos	f
>cher	ʃɛʁ	adj	1
chèr(e)	ʃɛʁ	f
>gratui(t)	gʁatɥi	adj	1
gratuit(e)	gʁatɥit	f
>rich(e)	ʁiʃ	adj	1
>pauvr(e)	povʁ	adj	1
>(h)eureu(x)	øʁø	adj	1
(h)eureus(e)	øʁøz	f
>conten(t)	kɔ̃tɑ̃	adj	1
content(e)	kɔ̃tɑ̃t	f
>trist(e)	tʁist	adj	1
>fatigué	fatige	adj	1
fatigué(e)	fatige	f
>crevé	kʁəve	adj	1
crevé(e)	kʁəve	f
>malad(e)	malad	adj	1
>for(t)	fɔʁ	adj	1
fort(e)	fɔʁt	f
>faibl(e)	fɛbl	adj	1
>rapid(e)	ʁapid	adj	1
>len(t)	lɑ̃	adj	1
lent(e)	lɑ̃t	f
>calm(e)	kalm	adj	1
>tranquill(e)	tʁɑ̃kil	adj	1
>bruyan(t)	bʁɥijɑ̃	adj	1
bruyant(e)	bʁɥijɑ̃t	f
>propr(e)	pʁɔpʁ	adj	1
>sal(e)	sal	adj	1
>lége(r)	leʒe	adj	1
légèr(e)	leʒɛʁ	f
>lour(d)	luʁ	adj	1
lourd(e)	luʁd	f
>larg(e)	laʁʒ	adj	1
>étroi(t)	etʁwa	adj	1
étroit(e)	etʁwat	f
>fin	fɛ̃	adj	1
fin(e)	fin	f
>épai(s)	epɛ	adj	1
épaiss(e)	epɛs	f
>genti(l)	ʒɑ̃ti	adj	1
gentill(e)	ʒɑ̃tij	f
>méchan(t)	meʃɑ̃	adj	1
méchant(e)	meʃɑ̃t	f
>sympa	sɛ̃pa	adj	1
>drôl(e)	dʁol	adj	1
>sérieu(x)	seʁjø	adj	1
sérieus(e)	seʁjøz	f
>(h)onnêt(e)	ɔnɛt	adj	1
>poli	pɔli	adj	1
poli(e)	pɔli	f
>libr(e)	libʁ	adj	1
>occupé	ɔkype	adj	1
occupé(e)	ɔkype	f
>pressé	pʁese	adj	1
pressé(e)	pʁese	f
>prê(t)	pʁɛ	adj	1
prêt(e)	pʁɛt	f
>sûr	syʁ	adj	1
sûr(e)	syʁ	f
>différen(t)	difeʁɑ̃	adj	1
différent(e)	difeʁɑ̃t	f
>pareil	paʁɛj	adj	1
pareill(e)	paʁɛj	f
>normal	nɔʁmal	adj	1
normal(e)	nɔʁmal	f
>spécial	spesjal	adj	1
spécial(e)	spesjal	f
>général	ʒeneʁal	adj	1
général(e)	ʒeneʁal	f
>original	ɔʁiʒinal	adj	1
original(e)	ɔʁiʒinal	f
>correct	kɔʁɛkt	adj	1
correct(e)	kɔʁɛkt	f
>parfai(t)	paʁfɛ	adj	1
parfait(e)	paʁfɛt	f
>super	sypɛʁ	adj	1
>génial	ʒenjal	adj	1
génial(e)	ʒenjal	f
>magnifiqu(e)	maɲifik	adj	1
>terribl(e)	tɛʁibl	adj	1
>bizarr(e)	bizaʁ	adj	1
>célèbr(e)	selɛbʁ	adj	1
>modern(e)	mɔdɛʁn	adj	1
>entie(r)	ɑ̃tje	adj	1
entièr(e)	ɑ̃tjɛʁ	f
>illimité	ilimite	adj	1
illimité(e)	ilimite	f
>meilleur	mɛjœʁ	adj	1
meilleur(e)	mɛjœʁ	f
>pir(e)	piʁ	adj	1
>préféré	pʁefeʁe	adj	1
préféré(e)	pʁefeʁe	f
>bondé	bɔ̃de	adj	1
bondé(e)	bɔ̃de	f
>serré	seʁe	adj	1
serré(e)	seʁe	f
>salé	sale	adj	1
salé(e)	sale	f
>sucré	sykʁe	adj	1
sucré(e)	sykʁe	f
>allongé	alɔ̃ʒe	adj	1
allongé(e)	alɔ̃ʒe	f
>assi(s)	asi	adj	1
assis(e)	asiz	f
>allumé	alyme	adj	1
allumé(e)	alyme	f
>rempli	ʁɑ̃pli	adj	1
rempli(e)	ʁɑ̃pli	f
>prévu	pʁevy	adj	1
prévu(e)	pʁevy	f
>national	nasjɔnal	adj	1
national(e)	nasjɔnal	f
>international	ɛ̃tɛʁnasjɔnal	adj	1
international(e)	ɛ̃tɛʁnasjɔnal	f
>public	pyblik	adj	1
publiqu(e)	pyblik	f
>privé	pʁive	adj	1
privé(e)	pʁive	f
>social	sɔsjal	adj	1
social(e)	sɔsjal	f
>étrange(r)	etʁɑ̃ʒe	adj	1
étrangèr(e)	etʁɑ̃ʒɛʁ	f
>françai(s)	fʁɑ̃sɛ	adj	1
français(e)	fʁɑ̃sɛz	f
>anglai(s)	ɑ̃glɛ	adj	1
anglais(e)	ɑ̃glɛz	f
>chinoi(s)	ʃinwa	adj	1
chinois(e)	ʃinwaz	f
>américain	ameʁikɛ̃	adj	1
américain(e)	ameʁikɛn	f
>canadien	kanadjɛ̃	adj	1
canadienn(e)	kanadjɛn	f
>suiss(e)	sɥis	adj	1
>belg(e)	bɛlʒ	adj	1
>espagnol	ɛspaɲɔl	adj	1
espagnol(e)	ɛspaɲɔl	f
>italien	italjɛ̃	adj	1
italienn(e)	italjɛn	f
>alleman(d)	almɑ̃	adj	1
allemand(e)	almɑ̃d	f
>japonai(s)	ʒapɔnɛ	adj	1
japonais(e)	ʒapɔnɛz	f
>malien	maljɛ̃	adj	1
malienn(e)	maljɛn	f
>sénégalai(s)	senegalɛ	adj	1
sénégalais(e)	senegalɛz	f
>roug(e)	ʁuʒ	adj	1
>bleu	blø	adj	1
bleu(e)	blø	f
>ver(t)	vɛʁ	adj	1
vert(e)	vɛʁt	f
>jaun(e)	ʒon	adj	1
>noir	nwaʁ	adj	1
noir(e)	nwaʁ	f
>blan(c)	blɑ̃	adj	1
blanch(e)	blɑ̃ʃ	f
>gri(s)	gʁi	adj	1
gris(e)	gʁiz	f
>ros(e)	ʁoz	adj	1
>marron	maʁɔ̃	adj	1
>brun	bʁœ̃	adj	1
brun(e)	bʁyn	f
>blon(d)	blɔ̃	adj	1
blond(e)	blɔ̃d	f
>zéro	zeʁo	num	1
>deu(x)	dø	num	1
>troi(s)	tʁwa	num	1
>quatr(e)	katʁ	num	1
>cinq	sɛ̃k	num	1
>six	sis	num	1
>se(p)t	sɛt	num	1
>*(h)uit	ɥit	num	1
>neuf	nœf	num	1
>dix	dis	num	1
>*onz(e)	ɔ̃z	num	1
>douz(e)	duz	num	1
>treiz(e)	tʁɛz	num	1
>quatorz(e)	katɔʁz	num	1
>quinz(e)	kɛ̃z	num	1
>seiz(e)	sɛz	num	1
>dix-se(p)t	disɛt	num	1
>dix-(h)uit	dizɥit	num	1
>dix-neuf	diznœf	num	1
>vin(gt)	vɛ̃	num	1
>vin(g)t et un	vɛ̃teœ̃	num	1
>vin(g)t-et-un	vɛ̃teœ̃	num	1
>vin(g)t-deu(x)	vɛ̃tdø	num	1
>vin(g)t-troi(s)	vɛ̃ttʁwa	num	1
>vin(g)t-quatr(e)	vɛ̃tkatʁ	num	1
>vin(g)t-cinq	vɛ̃tsɛ̃k	num	1
>vin(g)t-six	vɛ̃tsis	num	1
>vin(g)t-se(p)t	vɛ̃tsɛt	num	1
>vin(g)t-(h)uit	vɛ̃tɥit	num	1
>vin(g)t-neuf	vɛ̃tnœf	num	1
>trent(e)	tʁɑ̃t	num	1
>quarant(e)	kaʁɑ̃t	num	1
>cinquant(e)	sɛ̃kɑ̃t	num	1
>soixant(e)	swasɑ̃t	num	1
>soixante-dix	swasɑ̃tdis	num	1
>quatre-vin(gts)	katʁəvɛ̃	num	1
>quatre-vin(g)t-dix	katʁəvɛ̃dis	num	1
>cen(t)	sɑ̃	num	1
>mill(e)	mil	num	1
>million	miljɔ̃	nm	1
>demi	dəmi	adj	1
demi(e)	dəmi	f
>quar(t)	kaʁ	nm	1
>deuxièm(e)	døzjɛm	adj	1
>troisièm(e)	tʁwazjɛm	adj	1
>Pari(s)	paʁi	nm	1
>Lyon	ljɔ̃	nm	1
>Lill(e)	lil	nm	1
>Lisbonn(e)	lisbɔn	nf	1
>Porto	pɔʁto	nm	1
>Sintra	sintʁa	nm	1
>Bamako	bamako	nm	1
>Canton	kɑ̃tɔ̃	nm	1
>Shang(h)ai	ʃɑ̃gaj	nm	1
>Chengdu	tʃɛŋdu	nm	1
>Chin(e)	ʃin	nf	1
>Franc(e)	fʁɑ̃s	nf	1
>Europ(e)	øʁɔp	nf	1
>Belgiqu(e)	bɛlʒik	nf	1
>Suiss(e)	sɥis	nf	1
>Québec	kebɛk	nm	1
>Canada	kanada	nm	1
>Mali	mali	nm	1
>Sénégal	senegal	nm	1
>Maroc	maʁɔk	nm	1
>S(a)ôn(e)	son	nf	1
>R(h)ôn(e)	ʁon	nm	1
>Croix-Rouss(e)	kʁwaʁus	nf	1
>Sainte-Ann(e)	sɛ̃tan	nf	1
>miradouro	miʁaduʁu	nm	1
>bica	bika	nf	1
>ramen	ʁamɛn	nm	1
>bo bun	bo bun	x	1
>pH	pe aʃ	nm	1
>dim sum	dim sœm	x	1
>Black Friday	blak fʁajdɛ	x	1
>IMAX	imaks	nm	1
>CFA	se ɛf a	x	1
>sterling	stɛʁliŋ	adj	1
>Vélo'v	velɔv	nm	1
>solo	solo	nm	1
>formul(e)	fɔʁmyl	nf	1
>rédui(t)	ʁedɥi	adj	1
réduit(e)	ʁedɥit	f
>énorm(e)	enɔʁm	adj	1
>couche-tar(d)	kuʃtaʁ	nmf	1
>resto U	ʁɛsto y	x	1
>VO	ve o	x	1
>croi(x)	kʁwa	nf	1
>sain(t)	sɛ̃	adj	1
saint(e)	sɛ̃t	f
>société	sɔsjete	nf	1
>gouvernemen(t)	guvɛʁnəmɑ̃	nm	1
>présiden(t)	pʁezidɑ̃	nm	1
>politiqu(e)	pɔlitik	nf	1
>économi(e)	ekɔnɔmi	nf	1
>entrepris(e)	ɑ̃tʁəpʁiz	nf	1
>marqu(e)	maʁk	nf	1
>produi(t)	pʁɔdɥi	nm	1
>servic(e)	sɛʁvis	nm	1
>command(e)	kɔmɑ̃d	nf	1
>livraison	livʁɛzɔ̃	nf	1
>paiemen(t)	pɛmɑ̃	nm	1
>factur(e)	faktyʁ	nf	1
>loye(r)	lwaje	nm	1
>salair(e)	salɛʁ	nm	1
>impô(t)	ɛ̃po	nm	1
>assuranc(e)	asyʁɑ̃s	nf	1
>contra(t)	kɔ̃tʁa	nm	1
>rendez-vou(s)	ʁɑ̃devu	nm	1
>emploi	ɑ̃plwa	nm	1
>chômag(e)	ʃomaʒ	nm	1
>grèv(e)	gʁɛv	nf	1
>stag(e)	staʒ	nm	1
>diplôm(e)	diplom	nm	1
>examen	ɛgzamɛ̃	nm	1
>not(e)	nɔt	nf	1
>devoir	dəvwaʁ	nm	1
>leçon	ləsɔ̃	nf	1
>exercic(e)	ɛgzɛʁsis	nm	1
>règl(e)	ʁɛgl	nf	1
>erreur	eʁœʁ	nf	1
>faut(e)	fot	nf	1
>vérité	veʁite	nf	1
>mensong(e)	mɑ̃sɔ̃ʒ	nm	1
>secre(t)	səkʁɛ	nm	1
>avi(s)	avi	nm	1
>suje(t)	syʒɛ	nm	1
>information	ɛ̃fɔʁmasjɔ̃	nf	1
>messag(e)	mesaʒ	nm	1
>appel	apɛl	nm	1
>numéro	nymeʁo	nm	1
>adress(e)	adʁɛs	nf	1
>cod(e)	kɔd	nm	1
>mot de passe	mo də pas	x	1
>réseau	ʁezo	nm	1
>sit(e)	sit	nm	1
>lien	ljɛ̃	nm	1
>écouteur(s)	ekutœʁ	nmpl	1
>batteri(e)	batʁi	nf	1
>chargeur	ʃaʁʒœʁ	nm	1
>imag(e)	imaʒ	nf	1
>dessin	desɛ̃	nm	1
>tableau	tablo	nm	1
>ar(t)	aʁ	nm	1
>cultur(e)	kyltyʁ	nf	1
>roman	ʁɔmɑ̃	nm	1
>poèm(e)	pɔɛm	nm	1
>spectacl(e)	spɛktakl	nm	1
>concer(t)	kɔ̃sɛʁ	nm	1
>match	matʃ	nm	1
>football	futbol	nm	1
>natation	natasjɔ̃	nf	1
>dans(e)	dɑ̃s	nf	1
>promenad(e)	pʁɔmnad	nf	1
>balad(e)	balad	nf	1
>loisir	lwaziʁ	nm	1
>natur(e)	natyʁ	nf	1
>plant(e)	plɑ̃t	nf	1
>(h)erb(e)	ɛʁb	nf	1
>pierr(e)	pjɛʁ	nf	1
>sabl(e)	sabl	nm	1
>boi(s)	bwa	nm	1
>métal	metal	nm	1
>or	ɔʁ	nm	1
>fer	fɛʁ	nm	1
>plastiqu(e)	plastik	nm	1
>tissu	tisy	nm	1
>énergi(e)	enɛʁʒi	nf	1
>électricité	elɛktʁisite	nf	1
>gaz	gaz	nm	1
>essenc(e)	esɑ̃s	nf	1
>déche(t)	deʃɛ	nm	1
>poubell(e)	pubɛl	nf	1
>clima(t)	klima	nm	1
>températur(e)	tɑ̃peʁatyʁ	nf	1
>météo	meteo	nf	1
>acciden(t)	aksidɑ̃	nm	1
>dange(r)	dɑ̃ʒe	nm	1
>polic(e)	pɔlis	nf	1
>urgenc(e)	yʁʒɑ̃s	nf	1
>maladi(e)	maladi	nf	1
>r(h)um(e)	ʁym	nm	1
>fièvr(e)	fjɛvʁ	nf	1
>gripp(e)	gʁip	nf	1
>ordonnanc(e)	ɔʁdɔnɑ̃s	nf	1
>dentist(e)	dɑ̃tist	nmf	1
>régim(e)	ʁeʒim	nm	1
>poi(ds)	pwa	nm	1
>forc(e)	fɔʁs	nf	1
>stress	stʁɛs	nm	1
>fatigu(e)	fatig	nf	1
>repo(s)	ʁəpo	nm	1
>sourir(e)	suʁiʁ	nm	1
>larm(e)	laʁm	nf	1
>bon(h)eur	bɔnœʁ	nm	1
>joi(e)	ʒwa	nf	1
>colèr(e)	kɔlɛʁ	nf	1
>*(h)ont(e)	ɔ̃t	nf	1
>surpris(e)	syʁpʁiz	nf	1
>sentimen(t)	sɑ̃timɑ̃	nm	1
>souvenir	suvniʁ	nm	1
>espoir	ɛspwaʁ	nm	1
>dout(e)	dut	nm	1
>courag(e)	kuʁaʒ	nm	1
>patienc(e)	pasjɑ̃s	nf	1
>attention	atɑ̃sjɔ̃	nf	1
>silenc(e)	silɑ̃s	nm	1
>liberté	libɛʁte	nf	1
>droi(t)	dʁwa	nm	1
>égalité	egalite	nf	1
>religion	ʁəliʒjɔ̃	nf	1
>dieu	djø	nm	1
>tradition	tʁadisjɔ̃	nf	1
>mariag(e)	maʁjaʒ	nm	1
>naissanc(e)	nɛsɑ̃s	nf	1
>âg(e)	aʒ	nm	1
>adult(e)	adylt	nmf	1
>ado	ado	nmf	1
>génération	ʒeneʁasjɔ̃	nf	1
>étrange(r)	etʁɑ̃ʒe	nm	1
>(h)abitan(t)	abitɑ̃	nm	1
>frontièr(e)	fʁɔ̃tjɛʁ	nf	1
>capital(e)	kapital	nf	1
>région	ʁeʒjɔ̃	nf	1
>banlieu(e)	bɑ̃ljø	nf	1
>centre-vill(e)	sɑ̃tʁəvil	nm	1
>bâtimen(t)	batimɑ̃	nm	1
>couloir	kulwaʁ	nm	1
>cav(e)	kav	nf	1
>toi(t)	twa	nm	1
>balcon	balkɔ̃	nm	1
>meubl(e)	mœbl	nm	1
>étagèr(e)	etaʒɛʁ	nf	1
>tiroir	tiʁwaʁ	nm	1
>miroir	miʁwaʁ	nm	1
>tapi(s)	tapi	nm	1
>couvertur(e)	kuvɛʁtyʁ	nf	1
>oreille(r)	ɔʁeje	nm	1
>dra(p)	dʁa	nm	1
>serviett(e)	sɛʁvjɛt	nf	1
>savon	savɔ̃	nm	1
>bross(e)	bʁɔs	nf	1
>dentifric(e)	dɑ̃tifʁis	nm	1
>ciseau(x)	sizo	nmpl	1
>paraplui(e)	paʁaplɥi	nm	1
>montr(e)	mɔ̃tʁ	nf	1
>bagu(e)	bag	nf	1
>portefeuill(e)	pɔʁtəfœj	nm	1
>monnaie	mɔnɛ	nf	1
>espèc(es)	ɛspɛs	nfpl	1
>reçu	ʁəsy	nm	1
>sold(e)	sɔld	nm	1
>réduction	ʁedyksjɔ̃	nf	1
>qualité	kalite	nf	1
>quantité	kɑ̃tite	nf	1
>nombr(e)	nɔ̃bʁ	nm	1
>chiffr(e)	ʃifʁ	nm	1
>kilo	kilo	nm	1
>litr(e)	litʁ	nm	1
>mètr(e)	mɛtʁ	nm	1
>kilomètr(e)	kilɔmɛtʁ	nm	1
>typ(e)	tip	nm	1
>sort(e)	sɔʁt	nf	1
>genr(e)	ʒɑ̃ʁ	nm	1
>niveau	nivo	nm	1
>poin(t)	pwɛ̃	nm	1
>trou	tʁu	nm	1
>ron(d)	ʁɔ̃	nm	1
>carré	kaʁe	nm	1
>sign(e)	siɲ	nm	1
>symbol(e)	sɛ̃bɔl	nm	1
>systèm(e)	sistɛm	nm	1
>mét(h)od(e)	metɔd	nf	1
>solution	sɔlysjɔ̃	nf	1
>but	byt	nm	1
>succè(s)	syksɛ	nm	1
>échec	eʃɛk	nm	1
>effor(t)	efɔʁ	nm	1
>progrè(s)	pʁɔgʁɛ	nm	1
>changemen(t)	ʃɑ̃ʒmɑ̃	nm	1
>différenc(e)	difeʁɑ̃s	nf	1
>expérienc(e)	ɛkspeʁjɑ̃s	nf	1
>situation	sitɥasjɔ̃	nf	1
>événemen(t)	evɛnmɑ̃	nm	1
>rencontr(e)	ʁɑ̃kɔ̃tʁ	nf	1
>relation	ʁəlasjɔ̃	nf	1
>coupl(e)	kupl	nm	1
>invité	ɛ̃vite	nm	1
>*(h)éro(s)	eʁo	nm	1
>roi	ʁwa	nm	1
>rein(e)	ʁɛn	nf	1
>solda(t)	sɔlda	nm	1
>davantag(e)	davɑ̃taʒ	adv	1
>autrefoi(s)	otʁəfwa	adv	1
>récemmen(t)	ʁesamɑ̃	adv	1
>actuellemen(t)	aktɥɛlmɑ̃	adv	1
>finalemen(t)	finalmɑ̃	adv	1
>généralemen(t)	ʒeneʁalmɑ̃	adv	1
>normalemen(t)	nɔʁmalmɑ̃	adv	1
>probablemen(t)	pʁɔbabləmɑ̃	adv	1
>certainemen(t)	sɛʁtɛnmɑ̃	adv	1
>absolumen(t)	apsɔlymɑ̃	adv	1
>carrémen(t)	kaʁemɑ̃	adv	1
>quand même	kɑ̃ mɛm	x	1
>en fait	ɑ̃ fɛt	x	1
>bien sûr	bjɛ̃ syʁ	x	1
>pas mal	pa mal	x	1
>tant pis	tɑ̃ pi	x	1
>tant mieux	tɑ̃ mjø	x	1
>à bientôt	a bjɛ̃to	x	1
>à demain	a dəmɛ̃	x	1
>bonne journée	bɔn ʒuʁne	x	1
>bon appétit	bɔ na peti	x	1
>de rien	də ʁjɛ̃	x	1
>excusez-moi	ɛkskyze mwa	x	1
>enchanté	ɑ̃ʃɑ̃te	adj	1
enchanté(e)	ɑ̃ʃɑ̃te	f
>désolé	dezɔle	adj	1
désolé(e)	dezɔle	f
>ça va	sa va	x	1
>mieu(x)	mjø	adv	1
>pir(e)	piʁ	adv	1
>tan(t)	tɑ̃	adv	1
>vachemen(t)	vaʃmɑ̃	adv	1
>tandis que	tɑ̃di kə	x	1
>afin de	afɛ̃ də	x	1
>grâce à	gʁas a	x	1
>à cause de	a koz də	x	1
>au lieu de	o ljø də	x	1
>en train de	ɑ̃ tʁɛ̃ də	x	1
>avoir besoin de	avwaʁ bəzwɛ̃ də	x	1
>avoir envie de	avwaʁ ɑ̃vi də	x	1
>valoir le coup	valwaʁ lə ku	x	1
>agréabl(e)	agʁeabl	adj	1
>confortabl(e)	kɔ̃fɔʁtabl	adj	1
>pratiqu(e)	pʁatik	adj	1
>util(e)	ytil	adj	1
>inutil(e)	inytil	adj	1
>nécessair(e)	nesesɛʁ	adj	1
>dangereu(x)	dɑ̃ʒʁø	adj	1
dangereus(e)	dɑ̃ʒʁøz	f
>délicieu(x)	delisjø	adj	1
délicieus(e)	delisjøz	f
>épicé	epise	adj	1
épicé(e)	epise	f
>amer	amɛʁ	adj	1
amèr(e)	amɛʁ	f
>acid(e)	asid	adj	1
>cru	kʁy	adj	1
cru(e)	kʁy	f
>cui(t)	kɥi	adj	1
cuit(e)	kɥit	f
>sec	sɛk	adj	1
sèch(e)	sɛʃ	f
>mouillé	muje	adj	1
mouillé(e)	muje	f
>(h)umid(e)	ymid	adj	1
>clair	klɛʁ	adj	1
clair(e)	klɛʁ	f
>sombr(e)	sɔ̃bʁ	adj	1
>foncé	fɔ̃se	adj	1
foncé(e)	fɔ̃se	f
>ron(d)	ʁɔ̃	adj	1
rond(e)	ʁɔ̃d	f
>carré	kaʁe	adj	1
carré(e)	kaʁe	f
>pla(t)	pla	adj	1
plat(e)	plat	f
>droi(t)	dʁwa	adj	1
droit(e)	dʁwat	f
>gauch(e)	goʃ	adj	1
>minc(e)	mɛ̃s	adj	1
>maigr(e)	mɛgʁ	adj	1
>sportif	spɔʁtif	adj	1
sportiv(e)	spɔʁtiv	f
>actif	aktif	adj	1
activ(e)	aktiv	f
>timid(e)	timid	adj	1
>fier	fjɛʁ	adj	1
fièr(e)	fjɛʁ	f
>jalou(x)	ʒalu	adj	1
jalous(e)	ʒaluz	f
>curieu(x)	kyʁjø	adj	1
curieus(e)	kyʁjøz	f
>nerveu(x)	nɛʁvø	adj	1
nerveus(e)	nɛʁvøz	f
>inquie(t)	ɛ̃kjɛ	adj	1
inquièt(e)	ɛ̃kjɛt	f
>surpri(s)	syʁpʁi	adj	1
surpris(e)	syʁpʁiz	f
>déçu	desy	adj	1
déçu(e)	desy	f
>énervé	enɛʁve	adj	1
énervé(e)	enɛʁve	f
>amoureu(x)	amuʁø	adj	1
amoureus(e)	amuʁøz	f
>célibatair(e)	selibatɛʁ	adj	1
>marié	maʁje	adj	1
marié(e)	maʁje	f
>mor(t)	mɔʁ	adj	1
mort(e)	mɔʁt	f
>vivan(t)	vivɑ̃	adj	1
vivant(e)	vivɑ̃t	f
>réel	ʁeɛl	adj	1
réell(e)	ʁeɛl	f
>naturel	natyʁɛl	adj	1
naturell(e)	natyʁɛl	f
>personnel	pɛʁsɔnɛl	adj	1
personnell(e)	pɛʁsɔnɛl	f
>officiel	ɔfisjɛl	adj	1
officiell(e)	ɔfisjɛl	f
>(h)abituel	abitɥɛl	adj	1
(h)abituell(e)	abitɥɛl	f
>quotidien	kɔtidjɛ̃	adj	1
quotidienn(e)	kɔtidjɛn	f
>moyen	mwajɛ̃	adj	1
moyenn(e)	mwajɛn	f
>principal	pʁɛ̃sipal	adj	1
principal(e)	pʁɛ̃sipal	f
>local	lɔkal	adj	1
local(e)	lɔkal	f
>mondial	mɔ̃djal	adj	1
mondial(e)	mɔ̃djal	f
>populair(e)	pɔpylɛʁ	adj	1
>typiqu(e)	tipik	adj	1
>traditionnel	tʁadisjɔnɛl	adj	1
traditionnell(e)	tʁadisjɔnɛl	f
>récen(t)	ʁesɑ̃	adj	1
récent(e)	ʁesɑ̃t	f
>actuel	aktɥɛl	adj	1
actuell(e)	aktɥɛl	f
>suivan(t)	sɥivɑ̃	adj	1
suivant(e)	sɥivɑ̃t	f
>précéden(t)	pʁesedɑ̃	adj	1
précédent(e)	pʁesedɑ̃t	f
>uniqu(e)	ynik	adj	1
>doubl(e)	dubl	adj	1
>nombreu(x)	nɔ̃bʁø	adj	1
nombreus(e)	nɔ̃bʁøz	f
>rar(e)	ʁaʁ	adj	1
>couran(t)	kuʁɑ̃	adj	1
courant(e)	kuʁɑ̃t	f
>étrang(e)	etʁɑ̃ʒ	adj	1
>incroyabl(e)	ɛ̃kʁwajabl	adj	1
>formidabl(e)	fɔʁmidabl	adj	1
>excellen(t)	ɛksɛlɑ̃	adj	1
excellent(e)	ɛksɛlɑ̃t	f
>affreu(x)	afʁø	adj	1
affreus(e)	afʁøz	f
>nul	nyl	adj	1
null(e)	nyl	f
>ennuyeu(x)	ɑ̃nɥijø	adj	1
ennuyeus(e)	ɑ̃nɥijøz	f
>amusan(t)	amyzɑ̃	adj	1
amusant(e)	amyzɑ̃t	f
>fou	fu	adj	1
fol	fɔl	alt
foll(e)	fɔl	f
>bêt(e)	bɛt	adj	1
>intelligen(t)	ɛ̃teliʒɑ̃	adj	1
intelligent(e)	ɛ̃teliʒɑ̃t	f
>capabl(e)	kapabl	adj	1
>responsabl(e)	ʁɛspɔ̃sabl	adj	1
>disponibl(e)	dispɔnibl	adj	1
>comple(t)	kɔ̃plɛ	adj	1
complèt(e)	kɔ̃plɛt	f
>cassé	kase	adj	1
cassé(e)	kase	f
>perdu	pɛʁdy	adj	1
perdu(e)	pɛʁdy	f
>pollué	pɔlɥe	adj	1
pollué(e)	pɔlɥe	f
>bio	bjo	adj	1
>végétarien	veʒetaʁjɛ̃	adj	1
végétarienn(e)	veʒetaʁjɛn	f
>Mon(t)réal	mɔ̃ʁeal	nm	1
>Dakar	dakaʁ	nm	1
>Bruxell(es)	bʁysɛl	nf	1
>Lièg(e)	ljɛʒ	nf	1
>Lausann(e)	lozan	nf	1
>Brésil	bʁezil	nm	1
>Guiné(e)	gine	nf	1
>Saint-Gill(es)	sɛ̃ʒil	nm	1
>(H)eysel	ɛjzɛl	nm	1
>Masson	masɔ̃	nm	1
>Touba	tuba	nm	1
>t(h)iéboudièn(e)	tjebudjɛn	nm	1
>tieb	tjɛb	nm	1
>capoeira	kapwɛʁa	nf	1
>café da manhã	kafɛ da maɲɐ̃	x	1
>septant(e)	sɛptɑ̃t	num	1
>*(h)uitant(e)	ɥitɑ̃t	num	1
>nonant(e)	nɔnɑ̃t	num	1
>dépanneur	depanœʁ	nm	1
>tuqu(e)	tyk	nf	1
>panoss(e)	panɔs	nf	1
>pistole(t)	pistɔlɛ	nm	1
>magasine(r)	magazine	v	1
magasin(e)	magazin	pr:je/il
magasin(es)	magazin	pr:tu
magasin(ent)	magazin	pr:ils
magasinai(s)	magazinɛ	imp:je/tu
magasinai(t)	magazinɛ	imp:il
magasinion(s)	magazinjɔ̃	imp:nous
magasinie(z)	magazinje	imp:vous
magasinai(ent)	magazinɛ	imp:ils
magasinon(s)	magazinɔ̃	pr:nous
magasine(z)	magazine	pr:vous
magasinan(t)	magazinɑ̃	ppr
magasiné	magazine	pp
magasiné(e)	magazine	pp:f
magasinerai	magazinʁe	fut:je
magasinera(s)	magazinʁa	fut:tu
magasinera	magazinʁa	fut:il
magasineron(s)	magazinʁɔ̃	fut:nous
magasinere(z)	magazinʁe	fut:vous
magasineron(t)	magazinʁɔ̃	fut:ils
magasinerai(s)	magazinʁɛ	cond:je/tu
magasinerai(t)	magazinʁɛ	cond:il
magasinerion(s)	magazinəʁjɔ̃	cond:nous
magasinerie(z)	magazinəʁje	cond:vous
magasinerai(ent)	magazinʁɛ	cond:ils
>neige(r)	nɛʒe	v	1
neig(e)	nɛʒ	pr:je/il
neig(es)	nɛʒ	pr:tu
neig(ent)	nɛʒ	pr:ils
neigeai(s)	nɛʒɛ	imp:je/tu
neigeai(t)	nɛʒɛ	imp:il
neigion(s)	nɛʒjɔ̃	imp:nous
neigie(z)	nɛʒje	imp:vous
neigeai(ent)	nɛʒɛ	imp:ils
neigeon(s)	nɛʒɔ̃	pr:nous
neige(z)	nɛʒe	pr:vous
neigean(t)	nɛʒɑ̃	ppr
neigé	nɛʒe	pp
neigé(e)	nɛʒe	pp:f
neigerai	nɛʒʁe	fut:je
neigera(s)	nɛʒʁa	fut:tu
neigera	nɛʒʁa	fut:il
neigeron(s)	nɛʒʁɔ̃	fut:nous
neigere(z)	nɛʒʁe	fut:vous
neigeron(t)	nɛʒʁɔ̃	fut:ils
neigerai(s)	nɛʒʁɛ	cond:je/tu
neigerai(t)	nɛʒʁɛ	cond:il
neigerion(s)	nɛʒəʁjɔ̃	cond:nous
neigerie(z)	nɛʒəʁje	cond:vous
neigerai(ent)	nɛʒʁɛ	cond:ils
>relir(e)	ʁəliʁ	v	1
reli(s)	ʁəli	pr:je/tu
reli(t)	ʁəli	pr:il
relison(s)	ʁəlizɔ̃	pr:nous
relise(z)	ʁəlize	pr:vous
relis(ent)	ʁəliz	pr:ils
relisai(s)	ʁəlizɛ	imp:je/tu
relisai(t)	ʁəlizɛ	imp:il
relision(s)	ʁəlizjɔ̃	imp:nous
relisie(z)	ʁəlizje	imp:vous
relisai(ent)	ʁəlizɛ	imp:ils
relisan(t)	ʁəlizɑ̃	ppr
relu	ʁəly	pp
relu(e)	ʁəly	pp:f
relirai	ʁəliʁe	fut:je
relira(s)	ʁəliʁa	fut:tu
relira	ʁəliʁa	fut:il
reliron(s)	ʁəliʁɔ̃	fut:nous
relire(z)	ʁəliʁe	fut:vous
reliron(t)	ʁəliʁɔ̃	fut:ils
relirai(s)	ʁəliʁɛ	cond:je/tu
relirai(t)	ʁəliʁɛ	cond:il
relirion(s)	ʁəliʁjɔ̃	cond:nous
relirie(z)	ʁəliʁje	cond:vous
relirai(ent)	ʁəliʁɛ	cond:ils
>arachid(e)	aʁaʃid	nf	1
>atelie(r)	atəlje	nm	1
>bott(e)	bɔt	nf	1
>frang(e)	fʁɑ̃ʒ	nf	1
>gan(t)	gɑ̃	nm	1
>gobele(t)	gɔblɛ	nm	1
>(h)abitué	abitɥe	nm	1
(h)abitué(e)	abitɥe	f
>lux(e)	lyks	nm	1
>marmit(e)	maʁmit	nf	1
>panie(r)	panje	nm	1
>passag(e)	pasaʒ	nm	1
>prièr(e)	pʁijɛʁ	nf	1
>ruell(e)	ʁɥɛl	nf	1
>tax(e)	taks	nf	1
>tempêt(e)	tɑ̃pɛt	nf	1
>text(e)	tɛkst	nm	1
>grillé	gʁije	adj	1
grillé(e)	gʁije	f
>parfumé	paʁfyme	adj	1
parfumé(e)	paʁfyme	f
>tous	tus	pron	1
>personn(e)	pɛʁsɔn	pron	1
>secon(d)	səgɔ̃	adj	1
second(e)	səgɔ̃d	f
>arc	aʁk	nm	1
>os	ɔs	nm	1
o(s)	o	pl`, MEAN_SRC = `le	det	这个、那个（阳性词前）	the (before masculine words)
la	det	这个、那个（阴性词前）	the (before feminine words)
les	det	这些、那些	the (plural)
un	det	一个（阳性词前）	a, an, one (masculine)
des	det	一些；de + les	some; of the (de + les)
du	det	一些；de + le	some; of the (de + le)
au	prep	à + le：在、到	to the, at the (à + le)
de	prep	的；从	of, from
à	prep	在；到；给	at, to, in
je	pron	我	I
tu	pron	你	you (to a friend)
il	pron	他；它	he, it
elle	pron	她；它	she, it
on	pron	我们；大家；有人	we, people, one
nous	pron	我们	we, us
vous	pron	你们；您	you (plural or polite)
ils	pron	他们	they (masculine)
elles	pron	她们	they (feminine)
me	pron	我（宾语）	me, myself
te	pron	你（宾语）	you, yourself
se	pron	自己	oneself, himself, herself
lui	pron	他；给他、给她	him; to him, to her
leur	pron	他们的；给他们	their; to them
moi	pron	我	me
toi	pron	你	you
soi	pron	自己	oneself
eux	pron	他们	them
y	pron	那里	there, to it
en	prep	在；用；（代词）一些、从那儿	in, by; (pronoun) some, of it
ce	det	这个、那个；这	this, that; it
ça	pron	这个、那个	that, it
cela	pron	那个	that
ceci	pron	这个	this
celui	pron	那一个（阳性）	the one (masculine)
qui	pron	谁；……的那个	who, which
que	conj	什么；……的那个；比	that, what, than
quoi	pron	什么	what
où	adv	哪里；在那儿	where
dont	pron	其中；……的	of which, whose
lequel	pron	哪一个	which one
chacun	pron	每个人	each one, everyone
quelqu'un	pron	有人	someone
quelque	det	某个、一些	some
quelque chose	x	某个东西	something
personne	nf	人；（跟 ne）没有人	person; (with ne) nobody
rien	pron	什么都没有	nothing
tout	det	全部、都	all, everything
même	adj	一样的；甚至	same; even
autre	adj	别的、另一个	other
mon	det	我的（阳性词前）	my (masculine)
ma	det	我的（阴性词前）	my (feminine)
mes	det	我的（复数）	my (plural)
ton	det	你的（阳性词前）	your (masculine)
ta	det	你的（阴性词前）	your (feminine)
tes	det	你的（复数）	your (plural)
son	det	他的、她的（阳性词前）	his, her (masculine)
sa	det	他的、她的（阴性词前）	his, her (feminine)
ses	det	他的、她的（复数）	his, her (plural)
notre	det	我们的	our
votre	det	你们的；您的	your
quel	det	哪个；多么	which, what
chaque	det	每个	each, every
plusieurs	det	好几个	several
aucun	det	没有一个	no, none
certain	adj	某个；肯定的	certain
tel	adj	这样的	such
dans	prep	在……里面	in, inside
sur	prep	在……上面；关于	on, about
sous	prep	在……下面	under
avec	prep	跟、和	with
sans	prep	没有、不带	without
pour	prep	为了、给	for, to
par	prep	通过；每	by, through, per
chez	prep	在……家、在……那儿	at the home of, at
vers	prep	朝；大约（时间）	towards, around
entre	prep	在……之间	between
avant	prep	在……以前	before
après	prep	在……以后	after
pendant	prep	在……期间	during, for
depuis	prep	从……起、已经……了	since, for
jusque	prep	直到	until, up to
contre	prep	反对；靠着	against
devant	prep	在……前面	in front of
derrière	prep	在……后面	behind
près	adv	近	near
loin	adv	远	far
parmi	prep	在……当中	among
selon	prep	按照	according to
malgré	prep	虽然、尽管	despite
dès	prep	从……起、一……就	from, as soon as
hors	prep	在……外面	outside, out of
sauf	prep	除了	except
autour	adv	周围	around
dedans	adv	在里面	inside
dehors	adv	在外面	outside
dessus	adv	在上面	on top
dessous	adv	在下面	underneath
en face	x	对面	opposite, across the road
à côté	x	旁边	next to, beside
et	conj	和	and
ou	conj	或者	or
mais	conj	可是	but
donc	conj	所以	so, therefore
car	conj	因为	because, for
ni	conj	也不	nor
si	conj	如果；这么	if; so
quand	conj	什么时候；当……的时候	when
comme	conj	像；因为	like, as
parce que	x	因为	because
puisque	conj	既然	since, as
lorsque	conj	当……的时候	when
alors	adv	那么；当时	so, then
puis	adv	然后	then
ensuite	adv	接着	next, then
pourtant	adv	可是、然而	yet, however
cependant	adv	然而	however
sinon	conj	不然	otherwise
du coup	x	所以（口语）	so, as a result (spoken)
ne	adv	不（跟 pas 一起用）	not (used with pas)
pas	adv	不	not
plus	adv	更；（跟 ne）不再	more; (with ne) no longer
moins	adv	更少、没那么	less
jamais	adv	从来不；曾经	never, ever
très	adv	很	very
trop	adv	太	too, too much
bien	adv	好；很	well, really
mal	adv	不好、糟	badly
peu	adv	很少、一点	little, few
beaucoup	adv	很多	a lot, much
assez	adv	够、相当	enough, quite
aussi	adv	也；一样	also, as
encore	adv	还；再	still, again
déjà	adv	已经	already
toujours	adv	总是；还	always, still
souvent	adv	常常	often
parfois	adv	有时候	sometimes
ici	adv	这里	here
là	adv	那里；这儿	there, here
là-bas	adv	那边	over there
maintenant	adv	现在	now
aujourd'hui	adv	今天	today
hier	adv	昨天	yesterday
demain	adv	明天	tomorrow
tôt	adv	早	early
tard	adv	晚	late
vite	adv	快	fast, quickly
ensemble	adv	一起	together
seulement	adv	只	only
vraiment	adv	真的	really
peut-être	adv	也许	maybe
presque	adv	差不多、几乎	almost
surtout	adv	尤其	especially, above all
plutôt	adv	比较；宁可	rather
enfin	adv	终于；总之	finally, well
oui	int	是、对	yes
non	int	不	no
comment	adv	怎么	how
combien	adv	多少	how much, how many
pourquoi	adv	为什么	why
ailleurs	adv	别处	elsewhere
partout	adv	到处	everywhere
longtemps	adv	很久	a long time
bientôt	adv	很快、不久	soon
d'abord	adv	首先	first
d'accord	x	好的、同意	OK, agreed
d'habitude	x	平常	usually
tout de suite	x	马上	right away
tout à fait	x	完全、没错	absolutely
tout le monde	x	大家	everyone
à peu près	x	大概	about, roughly
en général	x	一般来说	in general
environ	adv	大约	about, around
juste	adv	只是；刚好	just; fair
debout	adv	站着	standing up
facilement	adv	容易地	easily
franchement	adv	说实话	honestly, frankly
évidemment	adv	当然	obviously
heureusement	adv	幸好	luckily
malheureusement	adv	可惜	unfortunately
simplement	adv	简单地；只是	simply
exactement	adv	正是、没错	exactly
complètement	adv	完全	completely
rapidement	adv	很快地	quickly
lentement	adv	慢慢地	slowly
doucement	adv	轻轻地、慢点	gently, slowly
tellement	adv	这么、非常	so, so much
autant	adv	一样多	as much
quelquefois	adv	有时候	sometimes
soudain	adv	突然	suddenly
ainsi	adv	这样	thus, like this
voici	prep	这是、这儿有	here is
voilà	prep	那是；好了	there is, there you go
merci	int	谢谢	thank you
bonjour	int	你好（白天）	hello, good morning
bonsoir	int	晚上好	good evening
salut	int	嗨；再见	hi, bye
au revoir	x	再见	goodbye
pardon	int	对不起、借过	sorry, excuse me
s'il vous plaît	x	请（对您、你们）	please (polite)
s'il te plaît	x	请（对朋友）	please (to a friend)
est-ce que	x	放在句子前面，表示在问「是不是」	put before a sentence to make it a yes/no question
qu'est-ce que	x	什么（问话开头）	what (at the start of a question)
qu'est-ce	x	什么（qu'est-ce que 的前一半）	what (first half of qu'est-ce que)
est-ce	x	是不是（est-ce que 的前一半）	is it (first half of est-ce que)
n'est-ce pas	x	不是吗？	isn't it?
il y a	x	有；……以前	there is, there are; ago
y a-t-il	x	有没有？	is there, are there?
c'est	x	这是、是	it is, that's
c'est-à-dire	x	也就是说	that is to say
être	v	是；在	to be
avoir	v	有	to have
aller	v	去	to go
faire	v	做	to do, to make
pouvoir	v	能、可以	can, to be able to
vouloir	v	想要	to want
devoir	v	应该、得；欠	must, to have to; to owe
savoir	v	知道、会	to know (a fact, how to)
voir	v	看见	to see
venir	v	来	to come
devenir	v	变成	to become
revenir	v	回来	to come back
tenir	v	拿着、握住	to hold
obtenir	v	得到	to get, to obtain
prendre	v	拿；坐（车）；吃、喝	to take, to have (food, drink)
apprendre	v	学	to learn
comprendre	v	明白、听懂	to understand
mettre	v	放；穿上	to put, to put on
permettre	v	允许	to allow
promettre	v	答应	to promise
dire	v	说	to say, to tell
lire	v	读、看（书）	to read
écrire	v	写	to write
boire	v	喝	to drink
croire	v	相信、觉得	to believe, to think
partir	v	走、出发	to leave
sortir	v	出去	to go out
dormir	v	睡觉	to sleep
endormir	v	（s'endormir）睡着	(s'endormir) to fall asleep
sentir	v	闻；感觉	to smell, to feel
servir	v	端上；有用	to serve
ouvrir	v	打开	to open
offrir	v	送、请	to offer, to give
découvrir	v	发现	to discover
connaître	v	认识、了解	to know (a person, a place)
reconnaître	v	认出	to recognise
paraître	v	好像、看起来	to seem
vivre	v	生活、住	to live
suivre	v	跟着	to follow
recevoir	v	收到	to receive
falloir	v	得、需要（il faut）	to be necessary (il faut)
pleuvoir	v	下雨（il pleut）	to rain (il pleut)
plaire	v	让人喜欢	to please
valoir	v	值	to be worth
courir	v	跑	to run
mourir	v	死	to die
naître	v	出生	to be born
rire	v	笑	to laugh
sourire	v	微笑	to smile
conduire	v	开车	to drive
construire	v	建造	to build
produire	v	生产	to produce
traduire	v	翻译	to translate
éteindre	v	关（灯、机器）	to turn off
peindre	v	画、刷漆	to paint
craindre	v	怕	to fear
battre	v	打	to beat
asseoir	v	（s'asseoir）坐下	(s'asseoir) to sit down
parler	v	说话	to speak, to talk
aimer	v	喜欢、爱	to like, to love
manger	v	吃	to eat
regarder	v	看	to look at, to watch
écouter	v	听	to listen to
travailler	v	工作	to work
habiter	v	住	to live (somewhere)
donner	v	给	to give
trouver	v	找到；觉得	to find
chercher	v	找	to look for
demander	v	问；要	to ask (for)
passer	v	经过；过（时间）	to pass, to spend (time)
rester	v	留下、待着	to stay
penser	v	想、觉得	to think
arriver	v	到；发生	to arrive, to happen
entrer	v	进去	to go in
rentrer	v	回家、回去	to go home, to come back
monter	v	上去	to go up, to get on
tomber	v	掉、摔倒	to fall
porter	v	穿着；拿着	to wear, to carry
apporter	v	带来	to bring
emporter	v	带走	to take away
laisser	v	留下；让	to leave, to let
montrer	v	给……看	to show
jouer	v	玩	to play
marcher	v	走路；行得通	to walk, to work
commencer	v	开始	to start
continuer	v	继续	to continue
terminer	v	结束	to finish
arrêter	v	停	to stop
fermer	v	关	to close
allumer	v	开（灯）、点着	to turn on, to light
garder	v	留着；照看	to keep, to look after
oublier	v	忘记	to forget
rappeler	v	提醒；回电话	to remind, to call back
appeler	v	叫；打电话	to call
acheter	v	买	to buy
lever	v	举起；（se lever）起床	to raise; (se lever) to get up
enlever	v	拿掉、脱掉	to take off, to remove
emmener	v	带（人）去	to take (someone)
amener	v	带（人）来	to bring (someone)
promener	v	（se promener）散步	(se promener) to go for a walk
préférer	v	更喜欢	to prefer
espérer	v	希望	to hope
répéter	v	重复	to repeat
payer	v	付钱	to pay
essayer	v	试	to try
envoyer	v	发、寄	to send
nettoyer	v	打扫、擦	to clean
jeter	v	扔	to throw (away)
changer	v	换、变	to change
voyager	v	旅行	to travel
ranger	v	收拾	to tidy up
partager	v	分享	to share
bouger	v	动	to move
nager	v	游泳	to swim
déranger	v	打扰	to disturb
placer	v	放	to place
avancer	v	往前走	to move forward
lancer	v	扔；发起	to throw, to launch
remplacer	v	换掉	to replace
étudier	v	学习	to study
remercier	v	谢谢	to thank
apprécier	v	喜欢、欣赏	to appreciate
crier	v	喊	to shout
copier	v	抄	to copy
vérifier	v	检查	to check
louer	v	租	to rent
tuer	v	杀	to kill
créer	v	创造	to create
utiliser	v	用	to use
préparer	v	准备	to prepare
cuisiner	v	做饭	to cook
goûter	v	尝	to taste
commander	v	点（菜）；订	to order
réserver	v	预订	to book
coûter	v	值（多少钱）	to cost
compter	v	数；打算	to count
augmenter	v	增加、涨价	to go up, to increase
baisser	v	降低	to go down, to lower
gagner	v	赢；赚	to win, to earn
dépenser	v	花（钱）	to spend (money)
économiser	v	省钱	to save (money)
prêter	v	借给	to lend
emprunter	v	借	to borrow
rencontrer	v	遇见	to meet
retrouver	v	（跟人）碰头；找回	to meet up with, to find again
inviter	v	请	to invite
visiter	v	参观	to visit (a place)
discuter	v	聊	to chat, to discuss
raconter	v	讲（故事）	to tell (a story)
expliquer	v	解释	to explain
poser	v	放下；提（问题）	to put down, to ask (a question)
répondre	v	回答	to answer
attendre	v	等	to wait (for)
entendre	v	听见	to hear
vendre	v	卖	to sell
rendre	v	还；让……变得	to give back, to make
descendre	v	下去、下车	to go down, to get off
perdre	v	丢；输	to lose
détendre	v	（se détendre）放松	(se détendre) to relax
finir	v	做完、结束	to finish
choisir	v	选	to choose
réussir	v	成功	to succeed
remplir	v	装满；填	to fill
réfléchir	v	想一想	to think it over
grandir	v	长大	to grow up
grossir	v	变胖	to put on weight
maigrir	v	变瘦	to lose weight
vieillir	v	变老	to get older
réunir	v	聚到一起	to bring together
nourrir	v	喂、养	to feed
agir	v	行动	to act
guérir	v	治好、好起来	to get better, to cure
rougir	v	脸红	to blush
ralentir	v	慢下来	to slow down
réagir	v	反应	to react
réveiller	v	叫醒；（se réveiller）醒来	to wake; (se réveiller) to wake up
coucher	v	（se coucher）去睡	(se coucher) to go to bed
laver	v	洗	to wash
doucher	v	（se doucher）洗澡	(se doucher) to shower
habiller	v	（s'habiller）穿衣服	(s'habiller) to get dressed
reposer	v	（se reposer）休息	(se reposer) to rest
dépêcher	v	（se dépêcher）赶快	(se dépêcher) to hurry
occuper	v	（s'occuper de）照顾、忙	(s'occuper de) to take care of
amuser	v	（s'amuser）玩得开心	(s'amuser) to have fun
ennuyer	v	（s'ennuyer）觉得无聊	(s'ennuyer) to be bored
excuser	v	原谅	to excuse
inquiéter	v	让人担心	to worry
entraîner	v	（s'entraîner）锻炼、练	(s'entraîner) to train, to work out
déplacer	v	（se déplacer）出行	(se déplacer) to get around
arracher	v	拔；硬拖出来	to pull out, to tear away
attraper	v	抓住；赶上（车）	to catch
avaler	v	吞下去	to swallow
bosser	v	干活（口语）	to work (informal)
caler	v	垫稳；让人吃饱	to wedge; to fill you up
couper	v	切、剪	to cut
craquer	v	忍不住（买了）；裂开	to give in; to crack
dîner	v	吃晚饭	to have dinner
déjeuner	v	吃午饭	to have lunch
souper	v	吃晚饭（魁北克、比利时、瑞士）	to have supper (Quebec, Belgium, Switzerland)
dracher	v	下大雨（法国北部、比利时）	to pour with rain (northern France, Belgium)
durer	v	持续	to last
éviter	v	避开	to avoid
livrer	v	送货	to deliver
manquer	v	缺；想念	to miss, to lack
profiter	v	好好享受	to enjoy, to make the most of
quitter	v	离开	to leave (a place)
réparer	v	修	to repair
réviser	v	复习	to revise
rouler	v	（车）开；滚	to drive along, to roll
sauter	v	跳	to jump
scroller	v	刷（手机）	to scroll
sonner	v	响	to ring
traîner	v	磨蹭；拖	to hang about, to drag
transpirer	v	出汗	to sweat
tremper	v	蘸、泡	to dip, to soak
imprimer	v	打印	to print
rentabiliser	v	用回本	to get your money's worth from
fatiguer	v	让人累	to tire
crever	v	累坏（口语）；爆	to be worn out (informal); to burst
allonger	v	（s'allonger）躺下	(s'allonger) to lie down
serrer	v	握紧；挤	to squeeze
saler	v	放盐	to salt
sucrer	v	放糖	to sweeten
prévoir	v	预计、打算	to plan, to foresee
refaire	v	重做	to redo
faillir	v	差一点	to almost (do)
adorer	v	非常喜欢	to love, to adore
détester	v	讨厌	to hate
danser	v	跳舞	to dance
chanter	v	唱歌	to sing
dessiner	v	画画	to draw
fumer	v	抽烟	to smoke
pleurer	v	哭	to cry
embrasser	v	亲、拥抱	to kiss, to hug
toucher	v	摸、碰	to touch
pousser	v	推；长	to push, to grow
tirer	v	拉	to pull
tourner	v	转	to turn
traverser	v	穿过	to cross
retourner	v	回去	to go back
déménager	v	搬家	to move house
installer	v	安装；安顿	to install, to settle
téléphoner	v	打电话	to phone
télécharger	v	下载	to download
cliquer	v	点（鼠标）	to click
taper	v	打字；拍	to type, to hit
publier	v	发表、发布	to publish, to post
gérer	v	管、应付	to manage, to handle
organiser	v	安排	to organise
décider	v	决定	to decide
accepter	v	接受	to accept
refuser	v	拒绝	to refuse
proposer	v	提议	to suggest
conseiller	v	建议	to advise
aider	v	帮	to help
sembler	v	好像	to seem
ressembler	v	像	to look like
exister	v	存在	to exist
imaginer	v	想象	to imagine
rêver	v	做梦	to dream
souhaiter	v	祝、希望	to wish
regretter	v	后悔；可惜	to regret
remarquer	v	注意到	to notice
noter	v	记下	to note down
signer	v	签字	to sign
présenter	v	介绍	to introduce, to present
respecter	v	尊重	to respect
fêter	v	庆祝	to celebrate
cacher	v	藏	to hide
casser	v	打碎	to break
brûler	v	烧	to burn
voler	v	飞；偷	to fly, to steal
tousser	v	咳嗽	to cough
soigner	v	治、照顾	to treat, to care for
respirer	v	呼吸	to breathe
blesser	v	弄伤	to hurt, to injure
peser	v	称；重	to weigh
mesurer	v	量	to measure
ajouter	v	加	to add
mélanger	v	拌、混	to mix
chauffer	v	加热	to heat
verser	v	倒	to pour
garer	v	停（车）	to park
louper	v	错过（口语）	to miss (informal)
rater	v	错过；没做好	to miss, to fail
tenter	v	试一试	to attempt
pratiquer	v	练、做（运动）	to practise
progresser	v	进步	to make progress
prononcer	v	发音	to pronounce
enseigner	v	教	to teach
homme	nm	男人	man
femme	nf	女人；妻子	woman, wife
enfant	nmf	孩子	child
garçon	nm	男孩	boy
fille	nf	女孩；女儿	girl, daughter
fils	nm	儿子	son
bébé	nm	婴儿	baby
ami	nm	朋友	friend
copain	nm	朋友；男朋友	friend, boyfriend
gens	nmpl	人们	people
monsieur	nm	先生	sir, Mr
madame	nf	女士、太太	madam, Mrs
père	nm	父亲	father
mère	nf	母亲	mother
parent	nm	父母之一；亲戚	parent, relative
frère	nm	兄弟	brother
sœur	nf	姐妹	sister
mari	nm	丈夫	husband
grand-mère	nf	奶奶、外婆	grandmother
grand-père	nm	爷爷、外公	grandfather
petits-enfants	nmpl	孙子孙女	grandchildren
oncle	nm	叔叔、舅舅	uncle
tante	nf	阿姨、姑姑	aunt
cousin	nm	表（堂）兄弟	cousin
famille	nf	家、家人	family
voisin	nm	邻居	neighbour
collègue	nmf	同事	colleague
patron	nm	老板	boss
camarade	nmf	同学、伙伴	classmate, mate
coloc	nmf	室友（口语）	flatmate (informal)
partenaire	nmf	伙伴	partner
élève	nmf	学生（中小学）	pupil
étudiant	nm	大学生	student
professeur	nm	老师	teacher
médecin	nm	医生	doctor
docteur	nm	医生、博士	doctor
infirmier	nm	护士	nurse
vendeur	nm	卖东西的人、店员	seller, shop assistant
serveur	nm	服务员	waiter
boulanger	nm	面包师	baker
coiffeur	nm	理发师	hairdresser
conducteur	nm	司机	driver
chauffeur	nm	司机	driver
cuisinier	nm	厨师	cook
chef	nm	主厨；头儿	chef, boss
client	nm	顾客	customer
touriste	nmf	游客	tourist
policier	nm	警察	police officer
ingénieur	nm	工程师	engineer
avocat	nm	律师；牛油果	lawyer; avocado
acteur	nm	演员	actor
chanteur	nm	歌手	singer
artiste	nmf	艺术家	artist
écrivain	nm	作家	writer
journaliste	nmf	记者	journalist
équipe	nf	队、团队	team
groupe	nm	组、乐队	group, band
foule	nf	人群	crowd
temps	nm	时间；天气	time, weather
heure	nf	小时；点钟	hour, time (o'clock)
minute	nf	分钟	minute
seconde	nf	秒	second
jour	nm	天、白天	day
journée	nf	一整天	day (the whole day)
matin	nm	早上	morning
matinée	nf	上午	morning (the whole morning)
midi	nm	中午	midday, lunchtime
après-midi	nm	下午	afternoon
soir	nm	晚上	evening
soirée	nf	晚上；晚会	evening, party
nuit	nf	夜里	night
semaine	nf	星期	week
week-end	nm	周末	weekend
mois	nm	月	month
an	nm	年；岁	year
année	nf	年	year
siècle	nm	世纪	century
moment	nm	一会儿、时候	moment
fois	nf	次	time (once, twice)
début	nm	开头	beginning
fin	nf	结尾	end
date	nf	日期	date
lendemain	nm	第二天	the next day
avenir	nm	将来	future
passé	nm	过去	past
lundi	nm	星期一	Monday
mardi	nm	星期二	Tuesday
mercredi	nm	星期三	Wednesday
jeudi	nm	星期四	Thursday
vendredi	nm	星期五	Friday
samedi	nm	星期六	Saturday
dimanche	nm	星期天	Sunday
janvier	nm	一月	January
février	nm	二月	February
mars	nm	三月	March
avril	nm	四月	April
mai	nm	五月	May
juin	nm	六月	June
juillet	nm	七月	July
août	nm	八月	August
septembre	nm	九月	September
octobre	nm	十月	October
novembre	nm	十一月	November
décembre	nm	十二月	December
printemps	nm	春天	spring
été	nm	夏天	summer
automne	nm	秋天	autumn
hiver	nm	冬天	winter
saison	nf	季节	season
anniversaire	nm	生日	birthday
vacances	nfpl	假期	holidays
fête	nf	节日、聚会	party, celebration
réveil	nm	醒来；闹钟	waking up; alarm clock
horaire	nm	时间表	timetable, hours
retard	nm	迟到、晚点	delay
avance	nf	提前	advance
pause	nf	休息一下	break
sieste	nf	午觉	nap
décalage	nm	时差；错开	time difference, gap
éternité	nf	很久很久	ages, eternity
monde	nm	世界；人们	world; people
pays	nm	国家	country
ville	nf	城市	city, town
village	nm	村子	village
quartier	nm	街区	neighbourhood
rue	nf	街	street
route	nf	公路	road
chemin	nm	路	path, way
place	nf	广场；位子	square; seat, room
pont	nm	桥	bridge
trottoir	nm	人行道	pavement
coin	nm	角落；附近	corner
endroit	nm	地方	place
maison	nf	房子、家	house, home
appartement	nm	公寓	flat, apartment
immeuble	nm	楼	building
étage	nm	楼层	floor
pièce	nf	房间；硬币	room; coin
chambre	nf	卧室	bedroom
cuisine	nf	厨房；做饭	kitchen; cooking
salon	nm	客厅	living room
salle	nf	厅、室	room, hall
salle de bain	x	浴室	bathroom
toilettes	nfpl	厕所	toilet
jardin	nm	花园	garden
porte	nf	门	door
fenêtre	nf	窗户	window
mur	nm	墙	wall
plafond	nm	天花板；上限	ceiling; cap
sol	nm	地面	floor, ground
escalier	nm	楼梯	stairs
ascenseur	nm	电梯	lift
volet	nm	百叶窗	shutter
rideau	nm	窗帘	curtain
école	nf	学校	school
université	nf	大学	university
fac	nf	大学（口语）	uni (informal)
classe	nf	班；教室	class
bibliothèque	nf	图书馆	library
bureau	nm	办公室；书桌	office; desk
usine	nf	工厂	factory
magasin	nm	商店	shop
boutique	nf	小店	shop, boutique
marché	nm	市场	market
supermarché	nm	超市	supermarket
boulangerie	nf	面包店	bakery
pharmacie	nf	药店	pharmacy
parapharmacie	nf	药妆店	chemist's selling skincare (no prescriptions)
librairie	nf	书店	bookshop
restaurant	nm	饭馆	restaurant
resto	nm	饭馆（口语）	restaurant (informal)
café	nm	咖啡；咖啡馆	coffee; café
bistrot	nm	小酒馆	bistro
bar	nm	酒吧	bar
cantine	nf	食堂	canteen
terrasse	nf	露台、露天座	terrace
comptoir	nm	吧台、柜台	counter
caisse	nf	收银台	till, checkout
hôtel	nm	酒店	hotel
auberge	nf	旅舍	inn, hostel
dortoir	nm	多人间	dorm
hôpital	nm	医院	hospital
banque	nf	银行	bank
poste	nf	邮局	post office
poste	nm	岗位；（电视、收音）机	job, post; set
gare	nf	火车站	railway station
aéroport	nm	机场	airport
station	nf	（地铁）站	station
arrêt	nm	（公交）站；停	stop
cinéma	nm	电影院	cinema
théâtre	nm	剧院	theatre
musée	nm	博物馆	museum
parc	nm	公园	park
plage	nf	海滩	beach
église	nf	教堂	church
piscine	nf	游泳池	swimming pool
stade	nm	体育场	stadium
ferme	nf	农场	farm
fournil	nm	面包房里烤面包的地方	bakehouse
campagne	nf	乡下	countryside
montagne	nf	山	mountain
mer	nf	海	sea
rivière	nf	河	river
fleuve	nm	大河	(big) river
rive	nf	河岸	bank (of a river)
lac	nm	湖	lake
forêt	nf	森林	forest
île	nf	岛	island
terre	nf	地、土	earth, land
ciel	nm	天空	sky
soleil	nm	太阳	sun
lune	nf	月亮	moon
étoile	nf	星星	star
nord	nm	北	north
sud	nm	南	south
est	nm	东	east
ouest	nm	西	west
côté	nm	边、侧	side
face	nf	面；脸	face, side
milieu	nm	中间	middle
bout	nm	头儿、尽头；一小块	end, tip; bit
fond	nm	底、最里面	bottom, back
centre	nm	中心	centre
bord	nm	边	edge
distance	nf	距离	distance
paysage	nm	风景	landscape
vue	nf	景色；视力	view; sight
pluie	nf	雨	rain
bruine	nf	毛毛雨	drizzle
brouillard	nm	雾	fog
neige	nf	雪	snow
vent	nm	风	wind
nuage	nm	云	cloud
orage	nm	雷雨	thunderstorm
chaleur	nf	热	heat
froid	nm	冷	cold
degré	nm	度	degree
lumière	nf	光、灯	light
ombre	nf	阴影	shade, shadow
air	nm	空气；样子	air; look
feu	nm	火；红绿灯	fire; traffic light
eau	nf	水	water
repas	nm	一顿饭	meal
petit-déjeuner	nm	早饭	breakfast
petit-déj	nm	早饭（口语）	breakfast (informal)
déjeuner	nm	午饭（魁北克、比利时、瑞士指早饭）	lunch (breakfast in Quebec, Belgium, Switzerland)
dîner	nm	晚饭（魁北克、比利时、瑞士指午饭）	dinner (lunch in Quebec, Belgium, Switzerland)
souper	nm	晚饭（魁北克、比利时、瑞士）	supper (Quebec, Belgium, Switzerland)
goûter	nm	下午的点心	afternoon snack
apéro	nm	饭前小酌（口语）	pre-dinner drinks (informal)
plat	nm	一道菜；盘子	dish
entrée	nf	前菜；入口	starter; entrance
dessert	nm	甜点	dessert
menu	nm	菜单；套餐	menu, set menu
carte	nf	菜单；卡；地图	menu; card; map
addition	nf	账单	bill
pourboire	nm	小费	tip
pain	nm	面包	bread
baguette	nf	法棍；筷子	baguette; chopstick
croissant	nm	可颂	croissant
brioche	nf	黄油软面包	brioche
tartine	nf	抹了黄油或果酱的面包片	slice of bread with butter or jam
chocolatine	nf	巧克力面包（西南部、魁北克的叫法）	pain au chocolat (south-west France, Quebec)
sandwich	nm	三明治	sandwich
beurre	nm	黄油	butter
fromage	nm	奶酪	cheese
raclette	nf	烤奶酪配土豆（瑞士、萨瓦）	raclette (melted cheese with potatoes)
fondue	nf	奶酪火锅；fondue chinoise = 火锅	fondue; fondue chinoise = hotpot
yaourt	nm	酸奶	yoghurt
œuf	nm	鸡蛋	egg
lait	nm	牛奶	milk
crème	nf	奶油；面霜	cream
viande	nf	肉	meat
bœuf	nm	牛肉；牛	beef; ox
porc	nm	猪肉	pork
poulet	nm	鸡肉	chicken
jambon	nm	火腿	ham
poisson	nm	鱼	fish
sardine	nf	沙丁鱼	sardine
légume	nm	蔬菜	vegetable
fruit	nm	水果	fruit
pomme	nf	苹果	apple
pomme de terre	x	土豆	potato
frites	nfpl	薯条	chips, fries
tomate	nf	西红柿	tomato
salade	nf	沙拉；生菜	salad, lettuce
carotte	nf	胡萝卜	carrot
oignon	nm	洋葱	onion
ail	nm	蒜	garlic
champignon	nm	蘑菇	mushroom
orange	nf	橙子	orange
banane	nf	香蕉	banana
citron	nm	柠檬	lemon
fraise	nf	草莓	strawberry
raisin	nm	葡萄	grapes
riz	nm	米饭	rice
pâtes	nfpl	意面	pasta
nouilles	nfpl	面条	noodles
raviolis	nmpl	饺子、意式饺子	dumplings, ravioli
soupe	nf	汤	soup
sauce	nf	酱汁	sauce
sel	nm	盐	salt
sucre	nm	糖	sugar
poivre	nm	胡椒	pepper
huile	nf	油	oil
farine	nf	面粉	flour
céréales	nfpl	麦片	cereal
compote	nf	果泥	stewed fruit
confiture	nf	果酱	jam
miel	nm	蜂蜜	honey
chocolat	nm	巧克力	chocolate
gâteau	nm	蛋糕	cake
crêpe	nf	法式薄饼	crêpe, pancake
bonbon	nm	糖果	sweet
glace	nf	冰淇淋；冰	ice cream; ice
praline	nf	裹糖的杏仁	praline (sugared almond)
chicorée	nf	菊苣（北方人加在咖啡里）	chicory (added to coffee in the north)
boisson	nf	饮料	drink
thé	nm	茶	tea
menthe	nf	薄荷	mint
jus	nm	果汁	juice
vin	nm	葡萄酒	wine
bière	nf	啤酒	beer
expresso	nm	浓缩咖啡	espresso
latte	nm	拿铁	latte
verre	nm	杯子；玻璃	glass
tasse	nf	（带把的）杯子	cup
bouteille	nf	瓶子	bottle
bol	nm	碗	bowl
assiette	nf	盘子	plate
couteau	nm	刀	knife
fourchette	nf	叉子	fork
cuillère	nf	勺子	spoon
théière	nf	茶壶	teapot
cuiseur	nm	电饭煲（cuiseur à riz）	cooker (cuiseur à riz = rice cooker)
four	nm	烤箱	oven
frigo	nm	冰箱（口语）	fridge
fournée	nf	一炉（面包）	batch (of bread)
morceau	nm	一块	piece
moitié	nf	一半	half
restes	nmpl	剩菜	leftovers
faim	nf	饿	hunger
soif	nf	渴	thirst
goût	nm	味道	taste
recette	nf	菜谱	recipe
courses	nfpl	买菜、买的东西	shopping (groceries)
bouchon	nm	里昂的传统小饭馆；瓶塞；堵车	traditional Lyon restaurant; cork; traffic jam
corps	nm	身体	body
tête	nf	头	head
visage	nm	脸	face
œil	nm	眼睛	eye
oreille	nf	耳朵	ear
nez	nm	鼻子	nose
bouche	nf	嘴	mouth
dent	nf	牙	tooth
cheveu	nm	头发	hair
barbe	nf	胡子	beard
cou	nm	脖子	neck
dos	nm	背	back
bras	nm	胳膊	arm
main	nf	手	hand
doigt	nm	手指	finger
pouce	nm	大拇指	thumb
jambe	nf	腿	leg
genou	nm	膝盖	knee
pied	nm	脚	foot
ventre	nm	肚子	belly
cœur	nm	心	heart
peau	nf	皮肤	skin
sang	nm	血	blood
voix	nf	声音、嗓子	voice
santé	nf	健康	health
sommeil	nm	睡眠；困	sleep
rêve	nm	梦	dream
douleur	nf	疼	pain
médicament	nm	药	medicine
soin	nm	护理、护肤	care, skincare
vêtement	nm	衣服	clothes, garment
pull	nm	毛衣	jumper
chemise	nf	衬衫	shirt
pantalon	nm	裤子	trousers
jupe	nf	裙子	skirt
robe	nf	连衣裙	dress
manteau	nm	大衣	coat
veste	nf	外套	jacket
chaussure	nf	鞋	shoe
baskets	nfpl	运动鞋	trainers
chaussette	nf	袜子	sock
chapeau	nm	帽子	hat
lunettes	nfpl	眼镜	glasses
sac	nm	包、袋子	bag
paire	nf	一双、一对	pair
taille	nf	尺码；腰	size; waist
cachemire	nm	羊绒	cashmere
coiffure	nf	发型	hairstyle
coupe	nf	剪发；杯	haircut; cup
chose	nf	东西、事情	thing
truc	nm	东西（口语）	thing, stuff (informal)
objet	nm	物件	object
table	nf	桌子	table
chaise	nf	椅子	chair
lit	nm	床	bed
canapé	nm	沙发	sofa
armoire	nf	衣柜	wardrobe
lampe	nf	灯	lamp
lampadaire	nm	路灯	streetlight
clé	nf	钥匙	key
téléphone	nm	电话、手机	phone
portable	nm	手机	mobile phone
ordinateur	nm	电脑	computer
écran	nm	屏幕	screen
appareil	nm	机器；appareil photo = 相机	device; appareil photo = camera
machine	nf	机器	machine
appli	nf	App（口语）	app
télé	nf	电视（口语）	TV
radio	nf	收音机、电台	radio
photo	nf	照片	photo
vidéo	nf	视频	video
film	nm	电影	film
série	nf	剧集	series
épisode	nm	一集	episode
musique	nf	音乐	music
chanson	nf	歌	song
livre	nm	书	book
livre	nf	磅；英镑	pound
journal	nm	报纸；日记	newspaper; diary
dictionnaire	nm	词典	dictionary
papier	nm	纸	paper
page	nf	页	page
lettre	nf	信；字母	letter
mot	nm	词、字	word
phrase	nf	句子	sentence
langue	nf	语言；舌头	language; tongue
nom	nm	名字、姓	name
prénom	nm	名	first name
histoire	nf	故事；历史	story; history
question	nf	问题	question
réponse	nf	回答	answer
idée	nf	主意	idea
conversation	nf	聊天	conversation
nouvelle	nf	消息	piece of news
stylo	nm	笔	pen
crayon	nm	铅笔	pencil
cadeau	nm	礼物	present
jeu	nm	游戏	game
boîte	nf	盒子	box
ticket	nm	票；小票	ticket; receipt
billet	nm	票；纸币	ticket; banknote
coupon	nm	优惠券	coupon
fleur	nf	花	flower
tulipe	nf	郁金香	tulip
bulbe	nm	球茎	bulb
arbre	nm	树	tree
feuille	nf	叶子；一张纸	leaf; sheet
animal	nm	动物	animal
chien	nm	狗	dog
chat	nm	猫	cat
oiseau	nm	鸟	bird
cheval	nm	马	horse
bouillotte	nf	热水袋	hot-water bottle
cire	nf	蜡	wax
puce	nf	跳蚤；les puces = 旧货市场	flea; les puces = flea market
couleur	nf	颜色	colour
forme	nf	形状；状态	shape; form
bruit	nm	声音、噪音	noise
odeur	nf	气味	smell
voiture	nf	汽车	car
bus	nm	公交车	bus
métro	nm	地铁	metro, underground
tram	nm	有轨电车	tram
train	nm	火车	train
avion	nm	飞机	plane
bateau	nm	船	boat
vélo	nm	自行车	bike
taxi	nm	出租车	taxi
moto	nf	摩托车	motorbike
ligne	nf	线、线路	line
trajet	nm	路程、一趟	journey, trip
voyage	nm	旅行	trip, travel
aller	nm	单程	one-way trip
retour	nm	回来、回程	return
tour	nm	一圈；轮到	turn; walk around
tour	nf	塔	tower
circulation	nf	车流、交通	traffic
valise	nf	行李箱	suitcase
bagage	nm	行李	luggage
passeport	nm	护照	passport
abonnement	nm	月票、订阅	pass, subscription
sortie	nf	出口；出去玩	exit; outing
file	nf	队	queue, line
queue	nf	排的队；尾巴	queue; tail
randonnée	nf	徒步	hike
course	nf	跑步；赛跑	run, race
jogging	nm	慢跑	jogging
sport	nm	运动	sport
travail	nm	工作；les travaux = 施工	work, job; les travaux = roadworks, building work
métier	nm	职业	job, trade
boulot	nm	活儿（口语）	job, work (informal)
affaire	nf	事情；划算的买卖；les affaires = 生意	matter; bargain; les affaires = business
réunion	nf	会	meeting
visio	nf	视频会议（口语）	video call (informal)
projet	nm	计划、项目	project, plan
retraite	nf	退休	retirement
cours	nm	课	class, lesson
argent	nm	钱；银	money; silver
prix	nm	价钱；奖	price; prize
tarif	nm	价目、票价	rate, fare
euro	nm	欧元	euro
centime	nm	分	cent
dollar	nm	元（美元、加元）	dollar
franc	nm	法郎	franc
dirham	nm	迪拉姆（摩洛哥的钱）	dirham (Moroccan money)
yuan	nm	元（人民币）	yuan
balle	nf	球；dix balles = 十欧（口语）	ball; dix balles = ten euros (slang)
piasse	nf	一块加元（魁北克口语）	a dollar (Quebec slang)
budget	nm	预算	budget
dépense	nf	花的一笔钱	expense
promo	nf	打折（口语）	special offer (informal)
occasion	nf	机会；d'occasion = 二手的	chance; d'occasion = second-hand
compte	nm	账户	account
double	nm	两倍	double
dizaine	nf	十来个	about ten
quinzaine	nf	十五个左右；两个星期	about fifteen; a fortnight
vingtaine	nf	二十来个	about twenty
trentaine	nf	三十来个	about thirty
quarantaine	nf	四十来个	about forty
vie	nf	生活、生命	life
mort	nf	死亡	death
amour	nm	爱	love
envie	nf	想要（avoir envie de）	desire (avoir envie de = to feel like)
plaisir	nm	乐趣、高兴	pleasure
humeur	nf	心情	mood
peur	nf	怕	fear
confiance	nf	信任	trust
volonté	nf	意志；à volonté = 随便吃	will; à volonté = all you can eat
chance	nf	运气	luck
problème	nm	问题	problem
raison	nf	原因；avoir raison = 说得对	reason; avoir raison = to be right
exemple	nm	例子	example
façon	nf	方式	way
besoin	nm	需要	need
aide	nf	帮助	help
habitude	nf	习惯	habit
routine	nf	日常的一套	routine
ménage	nm	家务	housework
vaisselle	nf	碗碟；洗碗	dishes, washing-up
douche	nf	淋浴	shower
bain	nm	洗澡、泡澡	bath
choix	nm	选择	choice
résultat	nm	结果	result
partie	nf	一部分；一局	part; game
part	nf	一份	share, slice
reste	nm	剩下的	the rest
suite	nf	后来、接下去	what comes next
case	nf	格子	box, square
pointe	nf	尖；heure de pointe = 高峰时间	tip; heure de pointe = rush hour
pile	nf	一摞；电池；（时间）正好	pile; battery; on the dot
coup	nm	一下；du coup = 所以	blow, go; du coup = so
cas	nm	情况	case
état	nm	状态；国家	state
loi	nf	法律	law
guerre	nf	战争	war
paix	nf	和平	peace
enfer	nm	地狱；c'est l'enfer = 太可怕了	hell
jeunesse	nf	青春；年轻人	youth
version	nf	版本；version originale = 原声	version; version originale = original language
fermeture	nf	关门	closing
nettoyant	nm	洗面奶、清洁剂	cleanser
shampoing	nm	洗发水；洗头	shampoo
brushing	nm	吹头发	blow-dry
bon	adj	好的；好吃的	good
mauvais	adj	坏的、不好的	bad
grand	adj	大的；高的	big, tall
petit	adj	小的	small, little
gros	adj	大的、胖的	big, fat
gras	adj	油的、肥的	fatty, greasy
long	adj	长的	long
court	adj	短的	short
haut	adj	高的	high
bas	adj	低的	low
beau	adj	好看的；（天气）好	beautiful, handsome; fine
joli	adj	漂亮的	pretty
nouveau	adj	新的	new
vieux	adj	老的、旧的	old
jeune	adj	年轻的	young
ancien	adj	以前的；古老的	former; old
premier	adj	第一	first
dernier	adj	最后的；上一个	last
prochain	adj	下一个	next
seul	adj	一个人的；唯一的	alone; only
plein	adj	满的	full
vide	adj	空的	empty
ouvert	adj	开着的	open
fermé	adj	关着的	closed
chaud	adj	热的	hot, warm
froid	adj	冷的	cold
frais	adj	凉的；新鲜的	cool; fresh
doux	adj	柔和的、甜的	soft, mild
dur	adj	硬的；难的	hard
facile	adj	容易的	easy
difficile	adj	难的	difficult
simple	adj	简单的	simple
possible	adj	可能的	possible
impossible	adj	不可能的	impossible
important	adj	重要的	important
intéressant	adj	有意思的	interesting
vrai	adj	真的	true, real
faux	adj	假的、错的	false, wrong
cher	adj	贵的；亲爱的	expensive; dear
gratuit	adj	免费的	free (no cost)
riche	adj	有钱的	rich
pauvre	adj	穷的	poor
heureux	adj	幸福的、高兴的	happy
content	adj	高兴的	happy, pleased
triste	adj	难过的	sad
fatigué	adj	累的	tired
crevé	adj	累坏了（口语）	worn out (informal)
malade	adj	生病的	ill
fort	adj	强的；（声音）大	strong; loud
faible	adj	弱的	weak
rapide	adj	快的	fast
lent	adj	慢的	slow
calme	adj	安静的	quiet, calm
tranquille	adj	安静的、放心的	quiet, peaceful
bruyant	adj	吵的	noisy
propre	adj	干净的；自己的	clean; own
sale	adj	脏的	dirty
léger	adj	轻的	light
lourd	adj	重的	heavy
large	adj	宽的	wide
étroit	adj	窄的	narrow
fin	adj	细的、薄的	thin, fine
épais	adj	厚的	thick
gentil	adj	和气的、好心的	kind, nice
méchant	adj	坏的、凶的	mean, nasty
sympa	adj	人很好的（口语）	nice (informal)
drôle	adj	好笑的	funny
sérieux	adj	认真的	serious
honnête	adj	诚实的；（价钱）公道的	honest; fair
poli	adj	有礼貌的	polite
libre	adj	有空的；自由的	free
occupé	adj	忙的；有人的	busy
pressé	adj	赶时间的	in a hurry
prêt	adj	准备好的	ready
sûr	adj	肯定的；安全的	sure; safe
différent	adj	不一样的	different
pareil	adj	一样的	the same
normal	adj	正常的	normal
spécial	adj	特别的	special
général	adj	一般的	general
original	adj	原来的；有新意的	original
correct	adj	还行的；对的	decent, fair; correct
parfait	adj	完美的	perfect
super	adj	太好了（口语）	great (informal)
génial	adj	太棒了	brilliant
magnifique	adj	非常美的	magnificent
terrible	adj	可怕的	terrible
bizarre	adj	奇怪的	strange
célèbre	adj	有名的	famous
moderne	adj	现代的	modern
entier	adj	整个的	whole
illimité	adj	不限量的	unlimited
meilleur	adj	更好的、最好的	better, best
pire	adj	更坏的	worse
préféré	adj	最喜欢的	favourite
bondé	adj	挤满人的	packed
serré	adj	挤的、紧的	tight, squeezed
salé	adj	咸的	salty, savoury
sucré	adj	甜的	sweet
allongé	adj	躺着的；（咖啡）加了水的	lying down; (coffee) with extra water
assis	adj	坐着的	sitting
allumé	adj	亮着的	lit, on
rempli	adj	装满的	full, filled
prévu	adj	计划好的	planned
national	adj	全国的	national
international	adj	国际的	international
public	adj	公共的	public
privé	adj	私人的	private
social	adj	社会的	social
étranger	adj	外国的	foreign
français	adj	法国的；法语	French
anglais	adj	英国的；英语	English
chinois	adj	中国的；中文	Chinese
américain	adj	美国的	American
canadien	adj	加拿大的	Canadian
suisse	adj	瑞士的	Swiss
belge	adj	比利时的	Belgian
espagnol	adj	西班牙的	Spanish
italien	adj	意大利的	Italian
allemand	adj	德国的	German
japonais	adj	日本的	Japanese
malien	adj	马里的	Malian
sénégalais	adj	塞内加尔的	Senegalese
rouge	adj	红的	red
bleu	adj	蓝的	blue
vert	adj	绿的	green
jaune	adj	黄的	yellow
noir	adj	黑的	black
blanc	adj	白的	white
gris	adj	灰的	grey
rose	adj	粉红的	pink
marron	adj	棕色的	brown
brun	adj	深棕色的	brown, dark-haired
blond	adj	金色的	blond
zéro	num	零	zero
deux	num	二	two
trois	num	三	three
quatre	num	四	four
cinq	num	五	five
six	num	六	six
sept	num	七	seven
huit	num	八	eight
neuf	num	九；新的	nine; brand new
dix	num	十	ten
onze	num	十一	eleven
douze	num	十二	twelve
treize	num	十三	thirteen
quatorze	num	十四	fourteen
quinze	num	十五	fifteen
seize	num	十六	sixteen
dix-sept	num	十七	seventeen
dix-huit	num	十八	eighteen
dix-neuf	num	十九	nineteen
vingt	num	二十	twenty
vingt et un	num	二十一	twenty-one
vingt-et-un	num	二十一（新拼法）	twenty-one (newer spelling)
vingt-deux	num	二十二	twenty-two
vingt-trois	num	二十三	twenty-three
vingt-quatre	num	二十四	twenty-four
vingt-cinq	num	二十五	twenty-five
vingt-six	num	二十六	twenty-six
vingt-sept	num	二十七	twenty-seven
vingt-huit	num	二十八	twenty-eight
vingt-neuf	num	二十九	twenty-nine
trente	num	三十	thirty
quarante	num	四十	forty
cinquante	num	五十	fifty
soixante	num	六十	sixty
soixante-dix	num	七十	seventy
quatre-vingts	num	八十	eighty
quatre-vingt-dix	num	九十	ninety
cent	num	一百	hundred
mille	num	一千	thousand
million	nm	百万	million
demi	adj	半	half
quart	nm	四分之一；一刻钟	quarter
deuxième	adj	第二	second
troisième	adj	第三	third
Paris	nm	巴黎	Paris
Lyon	nm	里昂	Lyon
Lille	nm	里尔	Lille
Lisbonne	nf	里斯本	Lisbon
Porto	nm	波尔图	Porto
Sintra	nm	辛特拉（葡萄牙）	Sintra (Portugal)
Bamako	nm	巴马科（马里的首都）	Bamako (capital of Mali)
Canton	nm	广州	Guangzhou (Canton)
Shanghai	nm	上海	Shanghai
Chengdu	nm	成都	Chengdu
Chine	nf	中国	China
France	nf	法国	France
Europe	nf	欧洲	Europe
Belgique	nf	比利时	Belgium
Suisse	nf	瑞士	Switzerland
Québec	nm	魁北克	Quebec
Canada	nm	加拿大	Canada
Mali	nm	马里	Mali
Sénégal	nm	塞内加尔	Senegal
Maroc	nm	摩洛哥	Morocco
Saône	nf	索恩河（里昂）	the Saône (river in Lyon)
Rhône	nm	罗讷河	the Rhône (river)
Croix-Rousse	nf	红十字山（里昂的一个街区）	Croix-Rousse (a district of Lyon)
Sainte-Anne	nf	圣安娜	Sainte-Anne
miradouro	nm	观景台（葡萄牙语）	viewpoint (Portuguese word)
bica	nf	里斯本的浓缩咖啡（葡萄牙语）	espresso in Lisbon (Portuguese word)
ramen	nm	拉面	ramen
bo bun	x	越南米粉沙拉（bò bún）	Vietnamese noodle salad (bò bún)
pH	nm	酸碱度	pH
dim sum	x	点心（广东早茶）	dim sum
Black Friday	x	黑色星期五	Black Friday
IMAX	nm	IMAX 巨幕	IMAX
CFA	x	franc CFA = 西非法郎	franc CFA = West African franc
sterling	adj	livre sterling = 英镑	livre sterling = pound sterling
Vélo'v	nm	里昂的共享单车	Lyon's bike-share scheme
solo	nm	en solo = 一个人	en solo = on your own
formule	nf	套餐；说法	set menu; formula
réduit	adj	减价的	reduced
énorme	adj	巨大的	huge
couche-tard	nmf	夜猫子	night owl
resto U	x	大学食堂（口语）	university canteen (informal)
VO	x	原声版（version originale）	original-language version
croix	nf	十字	cross
saint	adj	神圣的；圣……	holy; Saint
société	nf	社会；公司	society; company
gouvernement	nm	政府	government
président	nm	总统；主席	president
politique	nf	政治	politics
économie	nf	经济	economy
entreprise	nf	公司	company
marque	nf	牌子	brand
produit	nm	产品	product
service	nm	服务	service
commande	nf	订单	order
livraison	nf	送货	delivery
paiement	nm	付款	payment
facture	nf	账单、发票	bill, invoice
loyer	nm	房租	rent
salaire	nm	工资	salary
impôt	nm	税	tax
assurance	nf	保险	insurance
contrat	nm	合同	contract
rendez-vous	nm	约好的见面、预约	appointment, date
emploi	nm	工作、就业	job, employment
chômage	nm	失业	unemployment
grève	nf	罢工	strike
stage	nm	实习	internship
diplôme	nm	文凭	degree, diploma
examen	nm	考试	exam
note	nf	分数；笔记	mark; note
devoir	nm	作业；责任	homework; duty
leçon	nf	一课	lesson
exercice	nm	练习；锻炼	exercise
règle	nf	规则；尺子	rule; ruler
erreur	nf	错	mistake
faute	nf	错；过错	mistake, fault
vérité	nf	真话、真相	truth
mensonge	nm	谎话	lie
secret	nm	秘密	secret
avis	nm	看法	opinion
sujet	nm	话题	subject, topic
information	nf	信息、新闻	information
message	nm	消息、短信	message
appel	nm	一通电话	call
numéro	nm	号码	number
adresse	nf	地址	address
code	nm	密码；代码	code
mot de passe	x	密码	password
réseau	nm	网络	network
site	nm	网站；地点	website; site
lien	nm	链接；联系	link
écouteurs	nmpl	耳机	earphones
batterie	nf	电池	battery
chargeur	nm	充电器	charger
image	nf	图片	picture, image
dessin	nm	画	drawing
tableau	nm	画；黑板；表格	painting; board; table
art	nm	艺术	art
culture	nf	文化	culture
roman	nm	小说	novel
poème	nm	诗	poem
spectacle	nm	演出	show
concert	nm	音乐会	concert
match	nm	比赛	match
football	nm	足球	football
natation	nf	游泳	swimming
danse	nf	舞蹈	dance
promenade	nf	散步	walk
balade	nf	溜达	stroll
loisir	nm	业余爱好	leisure, hobby
nature	nf	大自然	nature
plante	nf	植物	plant
herbe	nf	草	grass
pierre	nf	石头	stone
sable	nm	沙子	sand
bois	nm	木头；树林	wood
métal	nm	金属	metal
or	nm	金子	gold
fer	nm	铁	iron
plastique	nm	塑料	plastic
tissu	nm	布	fabric
énergie	nf	能量、能源	energy
électricité	nf	电	electricity
gaz	nm	气、煤气	gas
essence	nf	汽油	petrol
déchet	nm	垃圾	waste
poubelle	nf	垃圾桶	bin
climat	nm	气候	climate
température	nf	温度	temperature
météo	nf	天气预报	weather forecast
accident	nm	事故	accident
danger	nm	危险	danger
police	nf	警察	police
urgence	nf	紧急情况	emergency
maladie	nf	病	illness
rhume	nm	感冒	cold
fièvre	nf	发烧	fever
grippe	nf	流感	flu
ordonnance	nf	处方	prescription
dentiste	nmf	牙医	dentist
régime	nm	节食；制度	diet; regime
poids	nm	体重、重量	weight
force	nf	力气	strength
stress	nm	压力	stress
fatigue	nf	累	tiredness
repos	nm	休息	rest
sourire	nm	微笑	smile
larme	nf	眼泪	tear
bonheur	nm	幸福	happiness
joie	nf	快乐	joy
colère	nf	生气	anger
honte	nf	羞愧	shame
surprise	nf	惊喜	surprise
sentiment	nm	感情、感觉	feeling
souvenir	nm	回忆；纪念品	memory; souvenir
espoir	nm	希望	hope
doute	nm	怀疑	doubt
courage	nm	勇气	courage
patience	nf	耐心	patience
attention	nf	注意；小心！	attention; watch out!
silence	nm	安静	silence
liberté	nf	自由	freedom
droit	nm	权利；法律	right; law
égalité	nf	平等	equality
religion	nf	宗教	religion
dieu	nm	神	god
tradition	nf	传统	tradition
mariage	nm	婚礼、婚姻	wedding, marriage
naissance	nf	出生	birth
âge	nm	年龄	age
adulte	nmf	成年人	adult
ado	nmf	青少年（口语）	teenager (informal)
génération	nf	一代人	generation
étranger	nm	外国人；à l'étranger = 在国外	foreigner; à l'étranger = abroad
habitant	nm	居民	inhabitant
frontière	nf	边境	border
capitale	nf	首都	capital
région	nf	地区	region
banlieue	nf	郊区	suburbs
centre-ville	nm	市中心	town centre
bâtiment	nm	建筑物	building
couloir	nm	走廊	corridor
cave	nf	地下室	cellar
toit	nm	屋顶	roof
balcon	nm	阳台	balcony
meuble	nm	家具	piece of furniture
étagère	nf	架子	shelf
tiroir	nm	抽屉	drawer
miroir	nm	镜子	mirror
tapis	nm	地毯	rug
couverture	nf	毯子；封面	blanket; cover
oreiller	nm	枕头	pillow
drap	nm	床单	sheet
serviette	nf	毛巾；餐巾	towel; napkin
savon	nm	肥皂	soap
brosse	nf	刷子	brush
dentifrice	nm	牙膏	toothpaste
ciseaux	nmpl	剪刀	scissors
parapluie	nm	雨伞	umbrella
montre	nf	手表	watch
bague	nf	戒指	ring
portefeuille	nm	钱包	wallet
monnaie	nf	零钱；货币	change; currency
espèces	nfpl	现金	cash
reçu	nm	收据	receipt
solde	nm	余额；les soldes = 大减价	balance; les soldes = the sales
réduction	nf	折扣	discount
qualité	nf	质量	quality
quantité	nf	数量	quantity
nombre	nm	数目	number
chiffre	nm	数字	figure, digit
kilo	nm	公斤	kilo
litre	nm	升	litre
mètre	nm	米	metre
kilomètre	nm	公里	kilometre
type	nm	种类；家伙（口语）	type; guy (informal)
sorte	nf	种	sort, kind
genre	nm	类型	kind, genre
niveau	nm	水平；层	level
point	nm	点	point
trou	nm	洞	hole
rond	nm	圆	circle
carré	nm	方块	square
signe	nm	记号、迹象	sign
symbole	nm	符号	symbol
système	nm	系统	system
méthode	nf	方法	method
solution	nf	办法	solution
but	nm	目标；进球	goal
succès	nm	成功	success
échec	nm	失败	failure
effort	nm	努力	effort
progrès	nm	进步	progress
changement	nm	变化	change
différence	nf	区别	difference
expérience	nf	经历、经验	experience
situation	nf	情况	situation
événement	nm	事件、活动	event
rencontre	nf	相遇	meeting, encounter
relation	nf	关系	relationship
couple	nm	一对	couple
invité	nm	客人	guest
héros	nm	英雄	hero
roi	nm	国王	king
reine	nf	王后、女王	queen
soldat	nm	士兵	soldier
davantage	adv	更多	more
autrefois	adv	从前	in the past
récemment	adv	最近	recently
actuellement	adv	目前	currently
finalement	adv	最后	in the end
généralement	adv	一般	generally
normalement	adv	正常来说	normally
probablement	adv	大概、很可能	probably
certainement	adv	肯定	certainly
absolument	adv	绝对	absolutely
carrément	adv	干脆、简直（口语）	totally (informal)
quand même	x	还是、毕竟	all the same, still
en fait	x	其实	actually
bien sûr	x	当然	of course
pas mal	x	还不错；不少	not bad; quite a lot
tant pis	x	算了	never mind, too bad
tant mieux	x	那太好了	so much the better
à bientôt	x	回头见	see you soon
à demain	x	明天见	see you tomorrow
bonne journée	x	祝你今天过得好	have a good day
bon appétit	x	吃好	enjoy your meal
de rien	x	不客气	you're welcome
excusez-moi	x	对不起、打扰一下	excuse me
enchanté	adj	幸会	pleased to meet you
désolé	adj	抱歉的	sorry
ça va	x	你好吗？／还行	how are you? / I'm fine
mieux	adv	更好	better
pire	adv	更糟	worse
tant	adv	这么多	so much
vachement	adv	非常（口语）	really (informal)
tandis que	x	而	whereas, while
afin de	x	为了	in order to
grâce à	x	多亏	thanks to
à cause de	x	因为（不好的事）	because of
au lieu de	x	而不是	instead of
en train de	x	正在	in the middle of (doing)
avoir besoin de	x	需要	to need
avoir envie de	x	想要	to feel like
valoir le coup	x	值得	to be worth it
agréable	adj	舒服的、让人喜欢的	pleasant
confortable	adj	舒适的	comfortable
pratique	adj	方便的	handy, practical
utile	adj	有用的	useful
inutile	adj	没用的	useless
nécessaire	adj	必要的	necessary
dangereux	adj	危险的	dangerous
délicieux	adj	很好吃的	delicious
épicé	adj	辣的	spicy
amer	adj	苦的	bitter
acide	adj	酸的	sour
cru	adj	生的	raw
cuit	adj	熟的	cooked
sec	adj	干的	dry
mouillé	adj	湿的	wet
humide	adj	潮湿的	damp, humid
clair	adj	亮的；清楚的	light; clear
sombre	adj	暗的	dark
foncé	adj	（颜色）深的	dark (colour)
rond	adj	圆的	round
carré	adj	方的	square
plat	adj	平的	flat
droit	adj	直的；右边的	straight; right
gauche	adj	左边的	left
mince	adj	瘦的、薄的	slim, thin
maigre	adj	很瘦的	skinny
sportif	adj	爱运动的	sporty
actif	adj	活跃的	active
timide	adj	害羞的	shy
fier	adj	骄傲的	proud
jaloux	adj	嫉妒的	jealous
curieux	adj	好奇的	curious
nerveux	adj	紧张的	nervous
inquiet	adj	担心的	worried
surpris	adj	吃惊的	surprised
déçu	adj	失望的	disappointed
énervé	adj	烦躁的、生气的	annoyed
amoureux	adj	恋爱中的	in love
célibataire	adj	单身的	single
marié	adj	结了婚的	married
mort	adj	死的	dead
vivant	adj	活的、有生气的	alive, lively
réel	adj	真实的	real
naturel	adj	自然的	natural
personnel	adj	个人的	personal
officiel	adj	正式的	official
habituel	adj	平常的	usual
quotidien	adj	每天的	daily
moyen	adj	中等的、平均的	average
principal	adj	主要的	main
local	adj	当地的	local
mondial	adj	全世界的	worldwide
populaire	adj	受欢迎的；大众的	popular
typique	adj	典型的	typical
traditionnel	adj	传统的	traditional
récent	adj	最近的	recent
actuel	adj	现在的	current
suivant	adj	下一个	following, next
précédent	adj	上一个	previous
unique	adj	唯一的	unique, only
double	adj	双的、两倍的	double
nombreux	adj	很多的	numerous
rare	adj	少见的	rare
courant	adj	常见的	common
étrange	adj	奇怪的	strange
incroyable	adj	难以相信的	incredible
formidable	adj	特别好的	wonderful
excellent	adj	非常好的	excellent
affreux	adj	很糟的	awful
nul	adj	很差的（口语）	rubbish (informal)
ennuyeux	adj	无聊的	boring
amusant	adj	好玩的	fun
fou	adj	疯的	mad, crazy
bête	adj	傻的	silly
intelligent	adj	聪明的	intelligent
capable	adj	能干的、能够的	able
responsable	adj	负责的	responsible
disponible	adj	有空的、有货的	available
complet	adj	满的、全的	full, complete
cassé	adj	坏了的、碎了的	broken
perdu	adj	迷路的；丢了的	lost
pollué	adj	污染的	polluted
bio	adj	有机的	organic
végétarien	adj	吃素的	vegetarian
Montréal	nm	蒙特利尔	Montreal
Dakar	nm	达喀尔（塞内加尔的首都）	Dakar (capital of Senegal)
Bruxelles	nf	布鲁塞尔	Brussels
Liège	nf	列日（比利时）	Liège (Belgium)
Lausanne	nf	洛桑（瑞士）	Lausanne (Switzerland)
Brésil	nm	巴西	Brazil
Guinée	nf	几内亚	Guinea
Saint-Gilles	nm	圣吉尔（布鲁塞尔的一个区）	Saint-Gilles (a district of Brussels)
Heysel	nm	海瑟尔（布鲁塞尔北边的一片地方）	Heysel (an area in the north of Brussels)
Masson	nm	rue Masson = 蒙特利尔的一条街	rue Masson = a street in Montreal
Touba	nm	café Touba = 塞内加尔加香料的咖啡	café Touba = Senegalese spiced coffee
thiéboudiène	nm	塞内加尔的鱼饭	thieboudienne (Senegalese rice and fish)
tieb	nm	thiéboudiène 的简称	short for thiéboudiène
capoeira	nf	卡波耶拉（巴西的武术舞）	capoeira
café da manhã	x	早饭（葡萄牙语，巴西的说法）	breakfast (Portuguese, as said in Brazil)
septante	num	七十（比利时、瑞士）	seventy (Belgium, Switzerland)
huitante	num	八十（瑞士）	eighty (Switzerland)
nonante	num	九十（比利时、瑞士）	ninety (Belgium, Switzerland)
dépanneur	nm	便利店（魁北克）；修理工	corner shop (Quebec); repairman
tuque	nf	毛线帽（魁北克）	woolly hat (Quebec)
panosse	nf	拖地的布（瑞士）	floor cloth (Switzerland)
pistolet	nm	小圆面包（比利时）；手枪	bread roll (Belgium); pistol
magasiner	v	逛街买东西（魁北克）	to go shopping (Quebec)
neiger	v	下雪（il neige）	to snow (il neige)
relire	v	再读一遍	to reread
arachide	nf	花生；beurre d'arachide = 花生酱	peanut; beurre d'arachide = peanut butter
atelier	nm	工作间、车间	workshop
botte	nf	靴子	boot
frange	nf	刘海	fringe
gant	nm	手套	glove
gobelet	nm	（纸、塑料的）杯子	cup (paper or plastic)
habitué	nm	常客	regular (customer)
luxe	nm	奢侈	luxury
marmite	nf	大锅	cooking pot
panier	nm	篮子	basket
passage	nm	经过；通道	passing; passage
prière	nf	祈祷	prayer
ruelle	nf	小巷	alley
taxe	nf	税	tax
tempête	nf	暴风雨、暴风雪	storm
texte	nm	文字、课文	text
grillé	adj	烤过的；pain grillé = 烤面包片	toasted, grilled; pain grillé = toast
parfumé	adj	有香味的	flavoured, scented
tous	pron	大家、全部（单独用时 s 要读）	all of them, everyone (the s is said)
personne	pron	没有人（跟 ne 一起用）	nobody (with ne)
second	adj	第二	second
arc	nm	弓；拱门	bow; arch
os	nm	骨头	bone`;
const WCH = "A-Za-zÀ-ÖØ-öø-ÿœŒ", TOKRE = () => new RegExp(`[${WCH}]+(?:['’-][${WCH}]+)*`, "g");
const norm = s => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/ /g, " ").trim();
const plain = mk => mk.replace(/[()]/g, "");
let DICT = null, EXW = null;
// 一个词形可以有好几条（été = 夏天 / être 的过去分词）。每条：{w 写法, mk 带括号的写法（括号里不发音）, ipa, L 原形, tag 是哪种变化}
function dict(){ if (DICT) return DICT; DICT = new Map(); EXW = new Map(); const means = MEAN_SRC.split("\n").map(l=>l.split("\t")); let L = null, k = 0;
  const put = (key, e) => { key = key.toLowerCase(); const a = DICT.get(key); if (a) a.push(e); else DICT.set(key, [e]); };
  DICT_SRC.split("\n").forEach(l=>{ if (!l) return; const a = l.split("\t");
    if (l[0] === ">"){ const m = means[k++] || []; let mk = a[0].slice(1); const asp = mk[0] === "*"; if (asp) mk = mk.slice(1);
      L = {w: plain(mk), mk, ipa: a[1], pos: a[2], rank: +a[3] || 0, asp, zh: m[2] || "", en: m[3] || "", forms: []}; put(L.w, {w: L.w, mk, ipa: L.ipa, L, tag: L.pos === "v" ? "inf" : "", r: L.rank});
      if (L.w.includes(" ")) L.w.toLowerCase().split(" ").forEach(x=>{ const s = EXW.get(x); if (s) s.push(L.w.toLowerCase()); else EXW.set(x, [L.w.toLowerCase()]); }); }
    else if (L){ const e = {w: plain(a[0]), mk: a[0], ipa: a[1], L, tag: a[2] || "", r: L.rank ? 2 : 0}; L.forms.push(e); put(e.w, e); } });
  DICT.forEach(a=>a.sort((x, y)=>x.r - y.r)); return DICT; }
const addSil = (mk, c) => mk.endsWith(")") ? mk.slice(0, -1) + c + ")" : mk + "(" + c + ")";
// 查一个词形；复数（加 s / x，读音不变；-al → -aux）词典里不存，这里现算。查不到就是空的，不猜。
function look(w){ w = norm(w); const D = dict(); if (D.has(w)) return D.get(w);
  const ok = b => (D.get(b) || []).filter(e=>/^n[mf]/.test(e.L.pos) || ["adj", "num", "det"].includes(e.L.pos) || /(^|,)pp/.test(e.tag));
  if (w.length > 2 && /[sx]$/.test(w)){ const b = ok(w.slice(0, -1)); if (b.length) return b.map(e=>({w, mk: addSil(e.mk, w.slice(-1)), ipa: e.ipa, L: e.L, tag: (e.tag ? e.tag + "," : "") + "pl", r: e.r})); }
  if (w.endsWith("aux")){ const b = ok(w.slice(0, -3) + "al").filter(e=>/al$/.test(e.ipa)); if (b.length) return b.map(e=>({w, mk: w.slice(0, -1) + "(x)", ipa: e.ipa.slice(0, -2) + "o", L: e.L, tag: "pl", r: e.r})); }
  return []; }
// 省音：j' = je ……
const EL = {j: ["je", "ʒ"], l: ["le / la", "l"], d: ["de", "d"], qu: ["que", "k"], n: ["ne", "n"], m: ["me", "m"], t: ["te", "t"], s: ["se / si", "s"], c: ["ce", "s"], jusqu: ["jusque", "ʒysk"], lorsqu: ["lorsque", "lɔʁsk"], puisqu: ["puisque", "pɥisk"], quelqu: ["quelque", "kɛlk"], presqu: ["presque", "pʁɛsk"]};
// 把一个连写的词拆开：[{txt, E 词典里的几条} | {txt, el 省音的小词} | {txt, link 为了好读加的 t}]，hy = 前面有连字符
function parts(tok){ let E = look(tok); if (E.length) return [{txt: tok, E}];
  const out = []; let rest = tok; const i = rest.search(/['’]/);
  if (i > 0 && EL[norm(rest.slice(0, i))]){ out.push({txt: rest.slice(0, i + 1), el: norm(rest.slice(0, i))}); rest = rest.slice(i + 1); E = look(rest); if (E.length || !rest.includes("-")){ out.push({txt: rest, E}); return out; } }
  if (rest.includes("-")){ const ps = rest.split("-");
    for (let a = 0; a < ps.length;){ let b = ps.length, hit = null;
      for (; b > a; b--){ const s = ps.slice(a, b).join("-"), e = look(s); if (e.length){ hit = {txt: s, E: e}; break; } }
      if (!hit){ hit = norm(ps[a]) === "t" && a > 0 ? {txt: ps[a], link: 1} : {txt: ps[a], E: []}; b = a + 1; }
      hit.hy = a > 0; out.push(hit); a = b; }
    return out; }
  out.push({txt: rest, E: look(rest)}); return out; }
// 前面是冠词就先当名词，前面是 je / tu / il 就先当动词；avoir / être 后面先当「做完了」；très、trop 后面先当形容的词
const DETS = new Set("le la les un une des du au aux mon ma mes ton ta tes son sa ses ce cet cette ces notre votre nos vos leur leurs quel quelle quels quelles chaque quelques plusieurs deux trois quatre cinq".split(" "));
const SUBJ = new Set("je tu il elle on nous vous ils elles ne qui me te se y ça".split(" "));
const INTENS = new Set("très trop si assez plus moins aussi vraiment tellement super".split(" "));
const isPP = e => /(^|,)pp(:f)?(,|$)/.test(e.tag);
function pick(E, prev, el, next){ if (E.length < 2) return E; let want = null;
  const pp = prev ? parts(prev) : [], pl = pp[pp.length - 1], pe = pl && pl.E && pl.E[0], aux = pe && /^(avoir|être)$/.test(pe.L.w) && pe.tag && !isPP(pe) && pe.tag !== "inf";
  const has = f => E.some(f);
  if (aux && has(isPP)) want = isPP;
  else if (prev && INTENS.has(prev) && has(e=>e.L.pos === "adj")) want = e => e.L.pos === "adj";
  else if (has(e=>e.L.pos === "pron") && has(e=>e.L.pos === "det") && pe && pe.L.pos === "v") want = e => e.L.pos === "pron";      // ils sont tous là
  else if (has(e=>e.L.pos === "pron") && next && /^n(e$|')/.test(next)) want = e => e.L.pos === "pron";
  else if (has(e=>e.L.pos === "pron") && has(e=>e.L.pos === "det") && next === "") want = e => e.L.pos === "pron";
  else if (el === "l" || (prev && DETS.has(prev))) want = e => /^n[mf]/.test(e.L.pos) || e.L.pos === "adj"; else if ((el && "jnmts".includes(el)) || (prev && SUBJ.has(prev))) want = e => e.L.pos === "v";
  if (!want) return E; const i = E.findIndex(want); return i > 0 ? [E[i], ...E.slice(0, i), ...E.slice(i + 1)] : E; }
// 连读：前一个词藏着的辅音（s x z → z，t d → t，un / on / en … → n）
const LIA = new Set("les des ces mes tes ses nos vos leurs aux quels quelles plusieurs quelques deux trois six dix vingt cent un mon ton son aucun nous vous ils elles on en dans chez sans sous très plus moins bien trop tout est sont ont c'est petit petits grand grands gros bon bons mauvais beaux nouveaux vieux quand".split(" "));
const NASL = {un: "œ̃", mon: "mɔ̃", ton: "tɔ̃", son: "sɔ̃", aucun: "okœ̃", on: "ɔ̃", en: "ɑ̃", bien: "bjɛ̃", bon: "bɔ"};
function latent(tok){ const P = parts(tok), p = P[P.length - 1], w = norm(p.txt), whole = norm(tok); if (!p.E || !p.E.length || !(LIA.has(w) || LIA.has(whole))) return null; const e = p.E[0];
  if (NASL[w]) return {c: "n", l: "n", ipa: NASL[w]}; if (w === "six" || w === "dix") return {c: "z", l: "x", ipa: e.ipa.slice(0, -1)};
  const m = /\(([a-zç]+)\)$/.exec(e.mk); if (!m) return null; const l = m[1].slice(-1), c = "sxz".includes(l) ? "z" : "td".includes(l) ? "t" : null; return c ? {c, l, ipa: e.ipa} : null; }
const NOLIA = new Set(["oui", "onze", "onzième", "et", "ou", "où"]);
function vowelStart(tok){ const P = parts(tok), p = P[0], w = norm(p.txt); if (p.el || p.link || NOLIA.has(w)) return false; const e = p.E && p.E[0]; if (e && e.L.asp && e.w === e.L.w) return false; if (e && e.L.asp) return false;
  if (w[0] === "h") return !!e; if (w[0] === "y") return w === "y" || w === "yeux"; return /^[aeiouàâäéèêëîïôöùûüœæ]/.test(w); }
const NUMC = {six: "si", dix: "di", huit: "ɥi"};
const consStart = w => !!w && new RegExp(`^[${WCH}]`).test(w) && !vowelStart(w);
function liaison(a, b){ if (!a || !b || norm(a) === "et") return null; const L = latent(a); if (!L || !vowelStart(b)) return null; const ib = ipaTok(b); return {a, b, c: L.c, l: L.l, ipa: ib ? `${L.ipa} ${L.c}‿${ib}` : ""}; }
// 一整个连写词的读音；有一块查不到就不给
function ipaTok(tok, P){ P = P || parts(tok); let s = ""; for (let i = 0; i < P.length; i++){ const p = P[i];
    if (p.el){ s += EL[p.el][1]; continue; } if (p.link){ s += " t‿"; continue; } if (!p.E || !p.E.length) return "";
    let ip = p.E[0].ipa; if (p.hy && !P[i - 1].link){ const L = P[i - 1].E && P[i - 1].E.length && /^(il|elle|on|ils|elles|y|en)$/.test(norm(p.txt)) ? hidden(P[i - 1].E[0]) : null; s += L ? " " + L + "‿" : " "; } s += ip; }
  return s.trim(); }
const hidden = e => { const m = /\(([a-zç]+)\)$/.exec(e.mk); if (!m) return null; const l = m[1].slice(-1); return "sxz".includes(l) ? "z" : "td".includes(l) ? "t" : null; };
// 写法 → 网页：括号里的字母变灰；orig 是页面上的写法（大小写照它）；lk = 连读时最后那个字母要读出来，标绿
function mkHtml(mk, orig, lk){ const C = []; let k = 0, sil = false; for (const c of mk){ if (c === "("){ sil = true; continue; } if (c === ")"){ sil = false; continue; } C.push({c: orig && orig[k] != null ? orig[k] : c, sil}); k++; }
  if (lk && C.length && C[C.length - 1].c.toLowerCase() === lk) C[C.length - 1].lk = true;
  let out = "", on = false; C.forEach(x=>{ if (x.sil && !x.lk && !on){ out += "<i>"; on = true; } if ((!x.sil || x.lk) && on){ out += "</i>"; on = false; } out += x.lk ? `<b class="frt-lk">${esc(x.c)}</b>` : esc(x.c); }); return out + (on ? "</i>" : ""); }
function tokHtml(tok, P, lk){ P = P || parts(tok); return P.map((p, i)=>(p.hy ? "-" : "") + (p.E && p.E.length ? mkHtml(p.E[0].mk, p.txt, i === P.length - 1 ? lk : null) : esc(p.txt))).join(""); }
const phraseHtml = s => s.split(" ").map(t=>t.replace(TOKRE(), m=>tokHtml(m))).join(" ");
// ---------- 声音 ----------
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); };
const voiceKey = t => fnv("_|fr|" + t);
const voiceUrl = t => { const H = window.FR_VOICE_HAS; if (!H) return ""; const h = voiceKey(t); return H.has(h) ? "https://img.heyvoyo.com/voice/" + h + ".mp3" : ""; };
let AUD = null, VOICES = null;
function loadVoices(){ try { const v = speechSynthesis.getVoices(); if (v && v.length) VOICES = v; } catch(e){} }
try { loadVoices(); speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch(e){}
const frVoice = () => { loadVoices(); if (!VOICES) return null; return VOICES.find(v=>/^fr[-_]FR/i.test(v.lang)) || VOICES.find(v=>/^fr/i.test(v.lang)) || null; };
const noVoice = () => { loadVoices(); return !!VOICES && !frVoice(); };       // 认出了设备上的声音，可是里面没有法语的
function tts(t, rate){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = rate || .9; const v = frVoice(); if (v) u.voice = v; speechSynthesis.speak(u); } catch(e){} }
function say(t, rate){ try { if (AUD){ AUD.pause(); AUD = null; } } catch(e){} const u = voiceUrl(t);
  if (u){ try { speechSynthesis.cancel(); } catch(e){} AUD = new Audio(u); AUD.playbackRate = rate && rate < .7 ? .7 : 1; AUD.onerror = () => tts(t, rate); const p = AUD.play(); if (p && p.catch) p.catch(()=>tts(t, rate)); return; }
  tts(t, rate); }
// ---------- 样式（跟英文发音工具一样：纸色、墨蓝描边、贴纸阴影） ----------
// 音标的字体不用系统默认的（苹果的 SF 会把鼻音的波浪号画到字母旁边），用 Helvetica Neue / Arial。
const css = `
.frt-hit{background:rgba(255,191,31,.55);border-radius:5px}
#frtSheet{position:fixed;left:50%;bottom:0;z-index:99995;width:min(520px,100%);transform:translate(-50%,110%);transition:transform .25s;background:#fffdf5;color:#14305c;border:2.5px solid #14305c;border-bottom:0;border-radius:22px 22px 0 0;box-shadow:0 -4px 0 rgba(20,48,92,.12),0 -12px 30px rgba(20,48,92,.18);padding:10px 16px calc(18px + env(safe-area-inset-bottom));font:15px/1.5 "Noto Sans SC","PingFang SC",sans-serif;box-sizing:border-box;max-height:86vh;overflow-y:auto;text-align:left}
#frtSheet.on{transform:translate(-50%,0)}
#frtSheet .g{width:42px;height:5px;border-radius:9px;background:#d8ccb0;margin:0 auto 8px}
#frtSheet .x,#frtPage .x{all:unset;position:absolute;right:12px;top:8px;cursor:pointer;font-size:19px;color:#5b6b86;padding:2px 8px}
.frt-wd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-right:34px}.frt-big{font:700 34px/1.15 ui-rounded,"Nunito",-apple-system,sans-serif;letter-spacing:.01em}
.frt-big i,.frt-sil i,.frt-ex i,.frt-pair i,.frt-qpk i,.frt-chips i,.frt-row b i{font-style:normal;color:#b9b3a3}
.frt-g{font:700 12.5px/1 "Noto Sans SC",sans-serif;border-radius:999px;padding:5px 10px;color:#fff;white-space:nowrap}.frt-g.m{background:#2a6fdb}.frt-g.f{background:#d6336c}.frt-g.mf{background:#7a5cc7}
.frt-ipa{font:500 19px/1.3 "Charis SIL","Doulos SIL","Helvetica Neue",Arial,"Segoe UI","Noto Sans",sans-serif;margin-top:2px;color:#24303a}
.frt-lem{font-size:13.5px;color:#5b6b86;margin-top:4px}.frt-lem button,.frt-also button{all:unset;cursor:pointer;font-weight:700;color:#14305c;border-bottom:2px solid #ffbf1f}
.frt-mean{font-size:16px;margin-top:6px}
.frt-note{font-size:12.5px;color:#5b6b86;margin-top:5px;line-height:1.45}.frt-note,.frt-fix,.frt-qm,.frt-row{font-family:"Helvetica Neue",Arial,"Noto Sans SC","PingFang SC",sans-serif}.frt-note b{color:#14305c}.frt-note button{all:unset;cursor:pointer;margin-left:4px}
.frt-fix{background:#fff1bf;border:1.5px solid #ffbf1f;border-radius:12px;padding:6px 10px;margin:0 30px 10px 0;font-size:13.5px}.frt-fix b{font-size:16px}.frt-fix small{display:block;color:#5b6b86;font-size:12px}.frt-fix button{all:unset;cursor:pointer;margin-left:6px}
.frt-rows{margin-top:10px;border-top:1.5px dashed #d8cdb0;padding-top:8px;display:grid;gap:6px}
.frt-row{all:unset;cursor:pointer;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;border:1.5px solid #14305c;border-radius:12px;padding:5px 10px;background:#fff;font-size:13.5px;box-sizing:border-box}.frt-row b{font:700 17px/1.2 ui-rounded,-apple-system,sans-serif}.frt-row span{color:#5b6b86}.frt-row em{font-style:normal;font-family:"Charis SIL","Helvetica Neue",Arial,"Segoe UI","Noto Sans",sans-serif;color:#24303a}
.frt-row.plainrow{cursor:default;border-style:dashed}
.frt-btns{display:flex;gap:8px;margin-top:12px}
.frt-b{all:unset;cursor:pointer;border:2.5px solid #14305c;border-radius:999px;padding:8px 14px;font:700 14.5px/1.2 "Noto Sans SC",sans-serif;background:#fff;box-shadow:3px 3px 0 #14305c;user-select:none;-webkit-user-select:none;color:#14305c;box-sizing:border-box;white-space:nowrap}
.frt-b:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #14305c}
.frt-b.main{flex:1;text-align:center;background:#ff5a36;color:#fff}.frt-b.rec{background:#c43c1f}
.frt-wv{display:inline-flex;gap:3px;align-items:center;height:14px;margin-right:6px;vertical-align:middle}.frt-wv i{width:3px;background:#fff;border-radius:2px;animation:frtwv .7s ease-in-out infinite}.frt-wv i:nth-child(2){animation-delay:.15s}.frt-wv i:nth-child(3){animation-delay:.3s}.frt-wv i:nth-child(4){animation-delay:.45s}
@keyframes frtwv{0%,100%{height:4px}50%{height:14px}}
.frt-wv.live i{animation:none;transition:height .06s linear}
.frt-lk{color:#1f8a4c;font-weight:800;text-decoration:underline 2.5px #1f8a4c;text-underline-offset:3px}
.frt-gram{margin-top:4px;font-size:11.5px;color:#8a94a6}.frt-gram summary{cursor:pointer;list-style:none;display:inline}.frt-gram summary::-webkit-details-marker{display:none}.frt-gram summary::after{content:" ▾"}
.frt-mean,.frt-note,.frt-fb,.frt-lab,.frt-also,.frt-lem,.frt-sec>p,.frt-sec h3,.frt-hc>span,.frt-row span,.frt-fix small,#frtPage h2{unicode-bidi:plaintext;text-align:start}
.frt-fb{font-size:13.5px;margin-top:8px;min-height:20px;color:#5b6b86}.frt-fb .ok{color:#1f8a4c;font-weight:700}
.frt-also{font-size:13px;color:#5b6b86;margin-top:8px}.frt-also button{margin-right:10px;font-weight:500}
.frt-more{all:unset;cursor:pointer;display:block;margin-top:8px;font-size:12.5px;color:#5b6b86}
.frt-deep{display:none;margin-top:6px}.frt-deep.on{display:block}
.frt-chips{display:flex;flex-wrap:wrap;gap:6px}.frt-chips button{all:unset;cursor:pointer;font-size:14.5px;border:1.5px solid #14305c;border-radius:999px;padding:2px 10px;background:#fff}.frt-chips small{color:#5b6b86;font-size:11.5px;margin-right:5px}
#frtPage{position:fixed;inset:0;z-index:99990;background:#fbf3df;color:#14305c;overflow-y:auto;font:15px/1.5 "Noto Sans SC","PingFang SC",sans-serif;padding:14px 14px 140px;box-sizing:border-box;display:none;text-align:left}
#frtPage.on{display:block}#frtPage>div{max-width:720px;margin:0 auto}
#frtPage h2{font:24px/1.2 "ZCOOL KuaiLe","PingFang SC",sans-serif;margin:4px 0 10px}
.frt-sec{margin:0 0 18px}.frt-sec h3{font:19px/1.2 "ZCOOL KuaiLe","PingFang SC",sans-serif;margin:0 0 2px}.frt-sec>p{font-size:12.5px;color:#5b6b86;margin:0 0 8px}
.frt-card{background:#fffdf5;border:2.5px solid #14305c;border-radius:16px;box-shadow:4px 4px 0 #14305c;padding:10px 12px;margin-bottom:10px}
.frt-q{display:flex;gap:8px}.frt-q input{flex:1;min-width:0;border:2.5px solid #14305c;border-radius:999px;padding:8px 14px;font:16px/1.2 ui-rounded,-apple-system,sans-serif;background:#fff;color:#14305c;outline:none}
.frt-hard{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.frt-hc{background:#fffdf5;border:2.5px solid #14305c;border-radius:16px;box-shadow:3px 3px 0 #14305c;padding:8px 10px}
.frt-hc>b{font:700 26px/1.1 "Charis SIL","Helvetica Neue",Arial,"Segoe UI","Noto Sans",sans-serif}.frt-hc>span{font-size:12.5px;margin-left:8px;color:#5b6b86}
.frt-lab{font-size:12px;color:#5b6b86;margin:6px 0 4px}
.frt-ex{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.frt-ex .frt-lk{font-weight:700}.frt-ex button{all:unset;cursor:pointer;border:1.5px solid #14305c;border-radius:12px;padding:3px 9px;background:#fff;font-size:15.5px}
.frt-ex em{font-style:normal;font:500 12.5px/1 "Charis SIL","Helvetica Neue",Arial,"Segoe UI","Noto Sans",sans-serif;margin-left:6px;color:#c43c1f}.frt-ex small{font-size:11.5px;color:#5b6b86;margin-left:6px}
.frt-pair{display:flex;gap:8px;margin-bottom:6px}.frt-pair button{all:unset;cursor:pointer;flex:1;text-align:center;border:2px solid #14305c;border-radius:12px;padding:6px 4px;background:#fff}
.frt-pair b{display:block;font:700 18px/1.2 ui-rounded,-apple-system,sans-serif}.frt-pair small{font:500 12px/1.2 "Charis SIL","Helvetica Neue",Arial,"Segoe UI","Noto Sans",sans-serif;color:#5b6b86}
.frt-rule .rt{font-weight:700;font-size:14px}.frt-rule .rd{font-size:12.5px;color:#5b6b86;margin:1px 0 2px}
.frt-qh{display:flex;align-items:center;gap:8px}.frt-qh b{font:700 15px/1.2 "Charis SIL","Helvetica Neue",Arial,"Segoe UI","Noto Sans",sans-serif}
.frt-qpk{display:flex;gap:6px;margin-top:6px}.frt-qpk button{all:unset;cursor:pointer;flex:1;text-align:center;border:2px solid #14305c;border-radius:12px;padding:5px;background:#fff}
.frt-qpk b{font:700 20px/1.2 ui-rounded,-apple-system,sans-serif;display:block}.frt-qpk small{font-size:11.5px;color:#5b6b86}
.frt-qpk button.ok{background:#e3f6e9;border-color:#2f9e5b}.frt-qpk button.no{background:#fff1bf;border-color:#ffbf1f}
.frt-qm{font-size:12.5px;margin-top:4px;color:#5b6b86;min-height:18px}
@media(max-width:380px){.frt-hard{grid-template-columns:1fr}.frt-big{font-size:30px}}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
// ---------- 弹窗 ----------
let CUR = null, REC = null;
const sheet = document.createElement("div"); sheet.id = "frtSheet"; sheet.dataset.nopy = ""; sheet.setAttribute("dir", "ltr"); sheet.setAttribute("lang", "fr"); sheet.innerHTML = `<div class="g"></div><button class="x" data-fx>✕</button><div id="frtB"></div>`; document.body.appendChild(sheet);
const PERS = ["je", "tu", "il", "nous", "vous", "ils"];
function tagLabel(tag){ if (!tag) return ""; return tag.split(",").map(t=>{ const [a, b] = t.split(":"); const nm = a === "f" && b == null ? T("f") : a === "pl" ? T("pl") : a === "fpl" ? T("fpl") : a === "alt" ? T("alt") : (T("t_" + a) || a) + (a === "pp" && b === "f" ? " · " + T("f") : ""); return nm + (b && b !== "f" ? " · " + b.split("/").join(" / ") : ""); }).join(LG === "zh" || LG === "ja" ? "；" : "; "); }
// 折起来的「语法名称」：只给想知道的人看
function gramHtml(tag){ const G = [...new Set((tag || "").split(",").map(t=>t.split(":")[0]).filter(a=>TX.en["g_" + a]))]; return G.length ? `<details class="frt-gram"><summary>${T("gram")}</summary>${G.map(a=>T("g_" + a)).join(" · ")}</details>` : ""; }
const posName = p => T(/^n[mf]/.test(p) ? "p_n" : p === "adj" ? "p_adj" : p === "v" ? "p_v" : p === "adv" ? "p_adv" : "p_x");
const ETRE_V = new Set("aller venir partir sortir arriver rentrer rester tomber naître mourir devenir revenir entrer monter descendre retourner".split(" "));
const startsV = w => /^[aeiouhàâäéèêëîïôöùûüœæ]/i.test(w);
// 名词：le 还是 la
function gender(e){ const p = e.L.pos; if (!/^n[mf]/.test(p)) return ""; const tg = e.tag ? e.tag.split(",") : [];
  const fem = p.startsWith("nf") || tg.includes("f") || tg.includes("fpl"), both = p === "nmf", plur = /pl$/.test(p) || tg.includes("pl") || tg.includes("fpl");
  const el = startsV(e.w) && !e.L.asp, cls = both ? "mf" : fem ? "f" : "m", lab = both ? T("mf") : fem ? T("f") : T("m");
  if (/^[A-ZÀ-Ý]/.test(e.L.w)) return `<span class="frt-g ${cls}">${lab}</span>`;       // 地名、专名：只说阴阳性
  const art = plur ? "les / des" : both ? (el ? "l' · un / une" : "le / la") : el ? `l' · ${fem ? "une" : "un"}` : fem ? "la / une" : "le / un";
  return `<span class="frt-g ${cls}">${art} · ${lab}${plur ? " · " + T("pl") : ""}</span>`; }
const meanOf = L => LG === "zh" ? L.zh : L.en;
function formsHtml(L){ if (L.pos === "v"){ const pr = PERS.map(p=>{ const f = L.forms.find(e=>e.tag.split(",").some(t=>t.startsWith("pr:") && t.slice(3).split("/").includes(p))); return f ? `<button data-fw="${esc(f.w)}"><small>${p === "je" && startsV(f.w) ? "j'" : p}</small>${mkHtml(f.mk)}</button>` : ""; }).join(""), pp = L.forms.find(e=>/(^|,)pp(,|$)/.test(e.tag));
    return pr || pp ? `<div class="frt-lab">${T("present")}</div><div class="frt-chips">${pr}</div>${pp ? `<div class="frt-lab">${T(ETRE_V.has(L.w) ? "ppLe" : "ppL")}</div><div class="frt-chips"><button data-fw="${esc(pp.w)}">${mkHtml(pp.mk)}</button></div>` : ""}` : ""; }
  const F = L.forms.filter(e=>/^(alt|f|pl|fpl)$/.test(e.tag)); return F.length ? `<div class="frt-chips"><button data-fw="${esc(L.w)}">${mkHtml(L.mk)}</button>${F.map(e=>`<button data-fw="${esc(e.w)}"><small>${tagLabel(e.tag)}</small>${mkHtml(e.mk)}</button>`).join("")}</div>` : ""; }
const btns = () => `<div class="frt-btns"><button class="frt-b" data-fh="1">${T("listen")}</button><button class="frt-b" data-fh=".6">🐢</button><button class="frt-b main" data-frec>${T("say")}</button></div><div class="frt-fb" id="frtFb">${T("tapHold")}</div>${noVoice() ? `<div class="frt-note">🔇 ${T("noVoice")}</div>` : ""}`;
// 一个词（一条）的那几行：原形、意思、阴阳性
function entryBody(e, tok){ const L = e.L, isForm = e.w.toLowerCase() !== L.w.toLowerCase() || (e.tag && e.tag !== "inf");
  return `${isForm && e.w.toLowerCase() !== L.w.toLowerCase() ? `<div class="frt-lem">← ${T("from")} <button data-fw="${esc(L.w)}" data-fpos="${L.pos}">${esc(L.w)}</button>${e.tag ? " · " + tagLabel(e.tag) : ""}</div>` : ""}<div class="frt-mean">${esc(meanOf(L))}</div>${gramHtml(e.tag)}`; }
// 打开一个词。o = {prev, next 句子里前后的词, fix 所在的固定说法, alt 用第几条}
function open(input, o){ sync(); dict(); o = o || {}; const tok = String(input).trim().replace(/[‘’]/g, "'").replace(/ /g, " ").replace(/\s+/g, " "); if (!new RegExp(`[${WCH}]`).test(tok)) return;
  if (/ /.test(tok) && !look(tok).length) return openPhrase(tok);
  const nx = o.next == null ? undefined : norm(o.next);
  let P = parts(tok); const single = P.length === 1; if (single && P[0].E.length){ P[0].E = pick(P[0].E, o.prev && norm(o.prev), null, nx); if (o.alt){ const E = P[0].E; P[0].E = [E[o.alt], ...E.slice(0, o.alt), ...E.slice(o.alt + 1)]; } }
  else P.forEach((p, i)=>{ if (p.E && p.E.length > 1) p.E = pick(p.E, i ? norm(P[i - 1].txt.replace(/'$/, "")) : o.prev && norm(o.prev), i && P[i - 1].el); });
  const ipa = ipaTok(tok, P), e = single ? P[0].E[0] : null, known = P.some(p=>p.E && p.E.length), anySil = P.some(p=>p.E && p.E[0] && /\(/.test(p.E[0].mk));
  const lia = [liaison(o.prev, tok), liaison(tok, o.next)].filter(Boolean), lkMe = liaison(tok, o.next), CO = T("colon");
  let h = "";
  if (o.fix){ const F = look(o.fix)[0]; if (F && norm(o.fix) !== norm(tok)) h += `<div class="frt-fix">📎 ${T("fixed")}${CO}<b>${phraseHtml(F.L.w)}</b> <em style="font-style:normal;font-family:'Helvetica Neue',Arial,'Segoe UI','Noto Sans',sans-serif">/${F.ipa}/</em><button data-fsay="${esc(F.L.w)}">🔊</button><small>${esc(meanOf(F.L))}</small></div>`; }
  h += `<div class="frt-wd"><div class="frt-big">${tokHtml(tok, P, lkMe && lkMe.l)}</div>${e ? gender(e) : ""}</div>`;
  h += ipa ? `<div class="frt-ipa">/${ipa}/</div>` : `<div class="frt-note">${T("noIpa")}</div>`;
  if (e) h += entryBody(e, tok);
  else if (!single) h += rowsHtml(P);
  if (anySil) h += `<div class="frt-note">${T("grey")}</div>`;
  if (lia.length) h += `<div class="frt-note">${T("lk")}</div>`;
  if (e && e.L.asp) h += `<div class="frt-note">✋ ${T("asp")}</div>`;
  const nn = norm(tok); if (NUMC[nn] && consStart(o.next)) h += `<div class="frt-note">🔢 ${T("numC")(esc(tok), NUMC[nn])}</div>`;
  lia.forEach(l=>{ h += `<div class="frt-note">🔗 <b>${T("link")}${CO}<bdi dir="ltr">${tokHtml(l.a, null, l.l)}‿${tokHtml(l.b)}</bdi></b> ${l.ipa ? `<bdi dir="ltr">/${l.ipa}/</bdi>` : ""} — ${T("linkS")(l.l, l.c)}<button data-fsay="${esc(l.a + " " + l.b)}">🔊</button></div>`; });
  h += btns();
  if (single && P[0].E.length > 1) h += `<div class="frt-also">${T("also")}${CO}${P[0].E.slice(1, 4).map((x, i)=>`<button data-falt="${i + 1}">${esc(x.L.w)} <span style="color:#5b6b86">· ${x.L === P[0].E[0].L ? esc(tagLabel(x.tag) || posName(x.L.pos)) + ` <bdi dir="ltr">/${x.ipa}/</bdi>` : esc(isPP(x) ? T("t_pp") : posName(x.L.pos)) + " · " + esc(meanOf(x.L).split(/[；;，,]/)[0])}</span></button>`).join("")}</div>`;
  if (e){ const fh = formsHtml(e.L); if (fh) h += `<button class="frt-more" data-fmore>${T("forms")}</button><div class="frt-deep" id="frtDeep">${fh}</div>`; }
  document.getElementById("frtB").innerHTML = h;
  CUR = {tok, key: norm(tok), ipa, o, P, known}; sheet.classList.add("on"); sheet.scrollTop = 0; say(tok); }
// 一排一排列出拆开的每一块
function rowsHtml(P){ return `<div class="frt-rows">${P.map((p, i)=>{ if (p.el) return `<button class="frt-row" data-fw="${esc(EL[p.el][0].split(" / ")[0])}"><b>${esc(p.txt)}</b><span>${T("elide")(esc(p.txt), EL[p.el][0])}</span></button>`;
      if (p.link) return `<div class="frt-row plainrow"><b>-t-</b><span>${T("tLink")}</span></div>`; const x = p.E && p.E[0];
      if (!x) return `<button class="frt-row" data-fw="${esc(p.txt)}"><b>${esc(p.txt)}</b><span>${T("noIpa")}</span></button>`;
      return `<button class="frt-row" data-fw="${esc(p.txt)}" data-fprev="${esc(i && P[i - 1].el ? P[i - 1].txt : "")}"><b>${mkHtml(x.mk, p.txt)}</b><em>/${x.ipa}/</em>${gender(x)}<span>${x.w.toLowerCase() !== x.L.w.toLowerCase() ? "← " + esc(x.L.w) + (x.tag ? " · " + tagLabel(x.tag) : "") + " · " : ""}${esc(meanOf(x.L))}</span></button>`; }).join("")}</div>`; }
// 几个词一起查（la table、les huit）：读音连起来，连读、数字在辅音前都算进去
function openPhrase(tok){ const W = tok.split(" "), PP = [];
  W.forEach((w, i)=>{ const P = parts(w); P.forEach((p, j)=>{ if (p.E && p.E.length > 1) p.E = pick(p.E, j ? norm(P[j - 1].txt.replace(/'$/, "")) : i ? norm(W[i - 1]) : "", j && P[j - 1].el, j === P.length - 1 ? (i + 1 < W.length ? norm(W[i + 1]) : "") : undefined); }); PP.push(P); });
  let ipa = "", ok = true, big = "", lias = [];
  W.forEach((w, i)=>{ const L = i + 1 < W.length ? liaison(w, W[i + 1]) : null, nn = norm(w); let ip = ipaTok(w, PP[i]); if (!ip) ok = false;
    if (NUMC[nn] && consStart(W[i + 1])) ip = NUMC[nn];
    const prevL = i ? liaison(W[i - 1], w) : null; ipa += i ? (prevL ? " " + prevL.c + "‿" : " ") + ip : ip;
    big += (i ? (prevL ? "‿" : " ") : "") + tokHtml(w, PP[i], L && L.l); if (L) lias.push(L); });
  const all = [].concat(...PP), CO = T("colon");
  let h = `<div class="frt-wd"><div class="frt-big">${big}</div></div>` + (ok ? `<div class="frt-ipa">/${ipa}/</div>` : `<div class="frt-note">${T("noIpa")}</div>`) + rowsHtml(all);
  if (all.some(p=>p.E && p.E[0] && /\(/.test(p.E[0].mk))) h += `<div class="frt-note">${T("grey")}</div>`;
  if (lias.length) h += `<div class="frt-note">${T("lk")}</div>`;
  lias.forEach(l=>{ h += `<div class="frt-note">🔗 <b>${T("link")}${CO}<bdi dir="ltr">${tokHtml(l.a, null, l.l)}‿${tokHtml(l.b)}</bdi></b> — ${T("linkS")(l.l, l.c)}</div>`; });
  W.forEach((w, i)=>{ const nn = norm(w); if (NUMC[nn] && consStart(W[i + 1])) h += `<div class="frt-note">🔢 ${T("numC")(esc(w), NUMC[nn])}</div>`; });
  h += btns(); document.getElementById("frtB").innerHTML = h;
  CUR = {tok, key: norm(tok), ipa: ok ? ipa : "", o: {}, P: all, known: all.some(p=>p.E && p.E.length)}; sheet.classList.add("on"); sheet.scrollTop = 0; say(tok); }
const unmark = () => document.querySelectorAll(".frt-hit").forEach(x=>{ const p = x.parentNode; p.replaceChild(document.createTextNode(x.textContent), x); p.normalize(); });
function close(){ sheet.classList.remove("on"); if (REC) REC.stop(); unmark(); }
// 说：点一下或按住都行；有语音识别就告诉你听到了什么，没有就录下来放给你自己听。同音的（mangé / manger）都算听到了。
const strip = s => norm(s).replace(/[^a-zà-öø-ÿœ' -]/g, " ").replace(/\s+/g, " ").trim();
function sameSound(a, b){ if (a === b) return true; const x = ipaTok(a), y = ipaTok(b); return !!x && x === y; }
// 声条：已经给过麦克风权限时，用 Web Audio 的 AnalyserNode 取真实音量；没有权限（或不支持）就保留原来的动画，不为了声条去要权限
let METER = null;
function meterStart(wv, stream0){ if (!wv) return;
  const go = stream => { try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC || !document.contains(wv)){ if (!stream0) stream.getTracks().forEach(t=>t.stop()); return; }
      const ctx = new AC(), an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an); const buf = new Uint8Array(an.fftSize), bars = [...wv.querySelectorAll("i")], K = [.65, 1, .85, .7]; let raf = 0;
      wv.classList.add("live"); const tick = () => { an.getByteTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++){ const d = (buf[i] - 128) / 128; s += d * d; } const lv = Math.min(1, Math.sqrt(s / buf.length) * 7);
        bars.forEach((b, i)=>{ b.style.height = (3 + 11 * lv * K[i]).toFixed(1) + "px"; }); wv.dataset.lv = lv.toFixed(3); raf = requestAnimationFrame(tick); };
      tick(); METER = {stop(){ cancelAnimationFrame(raf); try { ctx.close(); } catch(e){} if (!stream0) stream.getTracks().forEach(t=>t.stop()); }}; } catch(e){} };
  if (stream0) return go(stream0);
  if (!navigator.permissions || !navigator.permissions.query || !navigator.mediaDevices) return;
  navigator.permissions.query({name: "microphone"}).then(p=>{ if (p.state !== "granted" || !document.contains(wv)) return; return navigator.mediaDevices.getUserMedia({audio: true}).then(go); }).catch(()=>{}); }
function meterStop(){ if (METER){ METER.stop(); METER = null; } }
function startRec(btn){ if (REC){ REC.stop(); return; } if (!CUR) return; const fb = document.getElementById("frtFb"), R = window.SpeechRecognition || window.webkitSpeechRecognition, t0 = Date.now();
  const on = stream => { btn.classList.add("rec"); btn.insertAdjacentHTML("afterbegin", `<span class="frt-wv"><i></i><i></i><i></i><i></i></span>`); fb.innerHTML = T("listening"); meterStart(btn.querySelector(".frt-wv"), stream); };
  const off = () => { meterStop(); btn.classList.remove("rec"); const w = btn.querySelector(".frt-wv"); if (w) w.remove(); REC = null; };
  if (R){ const rec = new R(); rec.lang = "fr-FR"; rec.interimResults = true; rec.maxAlternatives = 5; let fin = false;
    rec.onresult = e => { const r = e.results[e.results.length - 1]; if (!r.isFinal){ fb.textContent = r[0].transcript; return; } fin = true;
      const alts = [...r].map(a=>strip(a.transcript)), key = strip(CUR.tok), hit = alts.some(a=>a === key || a.split(" ").some(w=>sameSound(w, key)) || sameSound(a.replace(/ /g, "-"), key) || (" " + a + " ").includes(" " + key + " "));
      fb.innerHTML = hit ? `<span class="ok">${T("heard")} ${esc(CUR.tok)}</span>` : `${T("got")} “${esc(alts[0])}” ${T("again")}`; };
    rec.onerror = () => {}; rec.onend = () => { off(); if (!fin) fb.textContent = T("notHeard"); };
    try { rec.start(); } catch(e){ fb.textContent = T("noMic"); return; } on(); REC = {t0, stop(){ try { rec.stop(); } catch(e){} }}; return; }
  if (!navigator.mediaDevices || !window.MediaRecorder){ fb.textContent = T("noMic"); return; }
  navigator.mediaDevices.getUserMedia({audio: true}).then(stream=>{ const mr = new MediaRecorder(stream), ch = []; mr.ondataavailable = e => ch.push(e.data);
    mr.onstop = () => { stream.getTracks().forEach(x=>x.stop()); off(); clearTimeout(to); const url = URL.createObjectURL(new Blob(ch, {type: mr.mimeType})); fb.innerHTML = `<button class="frt-b" data-fplay="${url}" style="padding:5px 12px">${T("yours")}</button> ${T("model")}`; };
    mr.start(); on(stream); const to = setTimeout(()=>mr.state === "recording" && mr.stop(), 3500); REC = {t0, stop(){ if (mr.state === "recording") mr.stop(); }}; }).catch(()=>{ fb.textContent = T("noMic"); }); }
// ---------- 软件里任何法语词：点一下，或长按 ----------
// 只认写明是法语的地方：外面最近的一层 lang 是 fr（<span lang="fr">…</span>）。不然英文界面上的 on、a、table、main 都会被当成法语。整页都是法语的页面可以 FRTOOL.everywhere(true)。
let EVERY = false;
const isFr = el => { if (EVERY) return true; const g = el.closest("[lang]"); return !!g && /^fr(-|$)/i.test(g.getAttribute("lang")); };
function wordAt(x, y){ let node, off; if (document.caretRangeFromPoint){ const r = document.caretRangeFromPoint(x, y); if (!r) return null; node = r.startContainer; off = r.startOffset; }
  else if (document.caretPositionFromPoint){ const p = document.caretPositionFromPoint(x, y); if (!p) return null; node = p.offsetNode; off = p.offset; }
  if (!node || node.nodeType !== 3 || node.parentElement.closest("#frtSheet,#frtPage,rt,script,style") || !isFr(node.parentElement)) return null;
  const s = node.textContent, M = [...s.matchAll(TOKRE())];
  for (let k = 0; k < M.length; k++){ const m = M[k], a = m.index, b = a + m[0].length; if (off < a || off > b) continue; if (m[0].length < 2 && !/^[aàyAÀY]$/.test(m[0])) return null;
    const r = document.createRange(); r.setStart(node, a); r.setEnd(node, b); if (![...r.getClientRects()].some(q=>x >= q.left - 3 && x <= q.right + 3 && y >= q.top - 3 && y <= q.bottom + 3)) return null;
    const gap = (i, j) => /^[  ]+$/.test(s.slice(i, j)), pv = M[k - 1], nx = M[k + 1];
    return {r, tok: m[0], prev: pv && gap(pv.index + pv[0].length, a) ? pv[0] : "", next: nx && gap(b, nx.index) ? nx[0] : "", fix: fixedAt(s, a, b, m[0])}; }
  return null; }
// 点的词是不是在一个固定说法里（est-ce que、il y a、à peu près ……）
function fixedAt(s, a, b, tok){ dict(); const t = s.toLowerCase().replace(/[’‘]/g, "'").replace(/ /g, " "), cand = new Set(); norm(tok).split(/['-]/).concat(norm(tok)).forEach(w=>(EXW.get(w) || []).forEach(x=>cand.add(x))); let best = "";
  cand.forEach(x=>{ for (let i = t.indexOf(x); i >= 0; i = t.indexOf(x, i + 1)){ const j = i + x.length, wb = c => !c || !new RegExp(`[${WCH}]`).test(c); if (i <= a && j >= b && wb(t[i - 1]) && wb(t[j]) && x.length > best.length) best = x; } });
  return best; }
function mark(h){ try { const sp = document.createElement("span"); sp.className = "frt-hit"; h.r.surroundContents(sp); } catch(e){} }
function tap(h){ close(); mark(h); open(h.tok, {prev: h.prev, next: h.next, fix: h.fix}); }
let LP = null;
document.addEventListener("pointerdown", e=>{ if (!ON() || e.target.closest("#frtSheet,#frtPage")) return; const x = e.clientX, y = e.clientY;
  LP = setTimeout(()=>{ LP = null; const h = wordAt(x, y); if (!h) return; e.target.dataset.frtLp = "1"; tap(h); }, 480); }, true);
document.addEventListener("pointermove", e=>{ if (LP && (Math.abs(e.movementX) + Math.abs(e.movementY) > 6)){ clearTimeout(LP); LP = null; } }, true);
document.addEventListener("pointerup", ()=>{ if (LP){ clearTimeout(LP); LP = null; } if (REC && Date.now() - REC.t0 > 600) REC.stop(); }, true);
document.addEventListener("click", e=>{ if (e.target.dataset && e.target.dataset.frtLp){ delete e.target.dataset.frtLp; e.preventDefault(); e.stopPropagation(); return; }
  if (e.target.closest("#frtSheet,#frtPage")) return;
  if (!ON() || e.target.closest("button,a,input,textarea,select,label,[onclick],[data-w],[contenteditable]")) return;
  for (let el = e.target, k = 0; el && el !== document.body && k < 6; el = el.parentElement, k++) if (getComputedStyle(el).cursor === "pointer") return;
  const h = wordAt(e.clientX, e.clientY); if (!h) return; e.stopPropagation(); tap(h); }, true);
document.addEventListener("contextmenu", e=>{ if (ON() && wordAt(e.clientX, e.clientY)) e.preventDefault(); }, true);
// ---------- 弹窗和页面里的按钮 ----------
document.addEventListener("pointerdown", e=>{ const b = e.target.closest("[data-frec]"); if (b){ e.preventDefault(); startRec(b); } });
document.addEventListener("keydown", e=>{ if (e.key === "Enter" && e.target.id === "frtQ" && e.target.value.trim()) open(e.target.value.trim()); });   // 输入几个词也行：la table、les huit
document.addEventListener("click", e=>{ const d = e.target.closest("[data-fx],[data-fh],[data-fsay],[data-fmore],[data-fw],[data-falt],[data-fq],[data-fqp],[data-fplay],[data-flook]"); if (!d) return; const ds = d.dataset;
  if (ds.fx != null){ if (d.closest("#frtPage")) document.getElementById("frtPage").classList.remove("on"); close(); return; }
  if (ds.fh) return CUR && say(CUR.tok, +ds.fh);
  if (ds.fsay) return say(ds.fsay, .9);
  if (ds.fmore != null){ const dp = document.getElementById("frtDeep"), on = !dp.classList.contains("on"); dp.classList.toggle("on", on); d.textContent = on ? T("less") : T("forms"); return; }
  if (ds.falt) return open(CUR.tok, Object.assign({}, CUR.o, {alt: +ds.falt}));
  if (ds.fw) return open(ds.fw, ds.fprev ? {prev: ds.fprev} : undefined);
  if (ds.flook != null){ const v = document.getElementById("frtQ").value.trim(); if (v) open(v); return; }
  if (ds.fplay){ say(CUR.tok, .9); setTimeout(()=>{ try { new Audio(ds.fplay).play(); } catch(e2){} }, 1300); return; }
  if (ds.fq != null){ const i = +ds.fq, m = MIX[i], j = Math.random() < .5 ? 1 : 2; d.dataset.ans = j - 1; say(m[j][0], .8); document.getElementById("fqm" + i).textContent = T("which"); d.closest(".frt-card").querySelectorAll(".frt-qpk button").forEach(b=>b.className = ""); return; }
  if (ds.fqp != null){ const i = +ds.fqp, q = d.closest(".frt-card"), ans = q.querySelector("[data-fq]").dataset.ans, m = MIX[i]; if (ans == null){ say(m[+ds.j + 1][0], .8); return; }
    const ok = +ds.j === +ans, x = m[+ans + 1]; d.className = ok ? "ok" : "no"; if (!ok) q.querySelectorAll(".frt-qpk button")[ans].className = "ok"; document.getElementById("fqm" + i).textContent = `${ok ? T("right") : T("wasIt")} ${x[0]} /${x[3]}/`; delete q.querySelector("[data-fq]").dataset.ans; return; }
});
// ---------- 「发音」页 ----------
// 例词都在词典里（能点开看）；容易混的词自己带读音和意思：[词, 中文, 英文, 读音]
const NAS = [["ɑ̃", "an · en · am · em", ["enfant", "temps", "dans", "chambre"]], ["ɔ̃", "on · om", ["bon", "monde", "non", "nom"]], ["ɛ̃", "in · ain · ein · im", ["vin", "pain", "matin", "plein"]], ["œ̃", "un · um", ["un", "lundi", "chacun"]]];
const RW = ["rue", "Paris", "merci", "regarder", "très", "soir"], UW = [["tu", "tout"], ["rue", "route"], ["vu", "vous"], ["dessus", "dessous"]];
const EW = [["é", "e", ["été", "café", "parler", "chez"]], ["è · ê · ai", "ɛ", ["mère", "très", "fête", "lait"]], ["e", "ə", ["le", "je", "petit", "demain"]], ["eu · œu", "ø / œ", ["deux", "peu", "heure", "sœur"]]];
const SILW = ["petit", "grand", "trop", "beaucoup", "deux", "temps", "vous", "parlent", "avec", "bonjour", "neuf", "seul"], SILE = [["petit", "petite"], ["grand", "grande"], ["vert", "verte"], ["chaud", "chaude"]];
const LIAW = [["les", "amis"], ["vous", "avez"], ["un", "ami"], ["deux", "heures"], ["petit", "enfant"], ["ils", "ont"]], ELW = [["je + ai", "j'ai"], ["le + ami", "l'ami"], ["la + école", "l'école"], ["que + il", "qu'il"], ["ne + est", "n'est"], ["de + accord", "d'accord"]];
const MIX = [["y / u", ["dessus", "在上面", "on top", "dəsy"], ["dessous", "在下面", "underneath", "dəsu"]], ["s / z", ["poisson", "鱼", "fish", "pwasɔ̃"], ["poison", "毒药", "poison", "pwazɔ̃"]], ["y / u", ["rue", "街", "street", "ʁy"], ["roue", "轮子", "wheel", "ʁu"]],
  ["ɛ̃ / ɑ̃", ["vin", "葡萄酒", "wine", "vɛ̃"], ["vent", "风", "wind", "vɑ̃"]], ["ø / o", ["cheveux", "头发", "hair", "ʃəvø"], ["chevaux", "马（复数）", "horses", "ʃəvo"]], ["œ / o", ["jeune", "年轻", "young", "ʒœn"], ["jaune", "黄", "yellow", "ʒon"]],
  ["ø / u", ["deux", "二", "two", "dø"], ["doux", "柔和", "soft", "du"]], ["ɔ̃ / ɑ̃", ["long", "长", "long", "lɔ̃"], ["lent", "慢", "slow", "lɑ̃"]]];
const wb = w => `<button data-fw="${esc(w)}">${tokHtml(w)}<em>${ipaTok(w)}</em></button>`;
function page(){ dict(); let pg = document.getElementById("frtPage"); if (!pg){ pg = document.createElement("div"); pg.id = "frtPage"; pg.dataset.nopy = ""; pg.setAttribute("dir", "ltr"); document.body.appendChild(pg); } return pg; }
// 阿语界面：说明文字从右往左（dir="rtl"），里面夹的法语词、字母（“n”、la table、é · è）各包一层从左往右
const RTLW = new RegExp(`[“"]?[${WCH}][${WCH}'’]*[”"]?(?:(?:\\s*[·+]\\s*|\\s+)[“"]?[${WCH}][${WCH}'’]*[”"]?)*`, "g");
const AR = s => LG === "ar" ? String(s).replace(RTLW, m => `<bdi dir="ltr">${m}</bdi>`) : s;
const RD = () => LG === "ar" ? ' dir="rtl"' : "";
function sounds(){ sync(); close(); const pg = page();
  pg.innerHTML = `<div><button class="x" data-fx>✕</button><h2${RD()}>🔤 ${AR(T("sounds"))}</h2>${noVoice() ? `<div class="frt-note"${RD()} style="margin-bottom:10px">🔇 ${AR(T("noVoice"))}</div>` : ""}
  <div class="frt-sec"><h3${RD()}>🔎 ${AR(T("lookH"))}</h3><p${RD()}>${AR(T("lookP"))}</p><div class="frt-q"><input id="frtQ" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="aujourd'hui"><button class="frt-b" data-flook>${T("go")}</button></div></div>
  <div class="frt-sec"><h3${RD()}>👃 ${AR(T("nasH"))}</h3><p${RD()}>${AR(T("nasP"))}</p><div class="frt-hard">${NAS.map(([s, sp, W])=>`<div class="frt-hc"><b>${s}</b><span>${sp}</span><div class="frt-ex">${W.map(w=>wb(w)).join("")}</div></div>`).join("")}</div><p${RD()} style="margin-top:8px">${AR(T("nasUn"))}</p></div>
  <div class="frt-sec"><h3${RD()}>🌀 ${AR(T("rH"))}</h3><p${RD()}>${AR(T("rP"))}</p><div class="frt-card"><div class="frt-ex" style="margin-top:0">${RW.map(w=>wb(w)).join("")}</div></div></div>
  <div class="frt-sec"><h3${RD()}>👄 ${AR(T("uH"))}</h3><p${RD()}>${AR(T("uP"))}</p><div class="frt-card">${UW.map(p=>`<div class="frt-pair">${p.map(w=>`<button data-fw="${w}"><b>${tokHtml(w)}</b><small>/${ipaTok(w)}/</small></button>`).join("")}</div>`).join("")}</div></div>
  <div class="frt-sec"><h3${RD()}>🅴 ${AR(T("eH"))}</h3><p${RD()}>${AR(T("eP"))}</p><div class="frt-hard">${EW.map(([sp, s, W])=>`<div class="frt-hc"><b>${s}</b><span>${sp}</span><div class="frt-ex">${W.map(w=>wb(w)).join("")}</div></div>`).join("")}</div></div>
  <div class="frt-sec"><h3${RD()}>🤫 ${AR(T("silH"))}</h3><p${RD()}>${AR(T("silP"))}</p><div class="frt-card"><div class="frt-ex" style="margin-top:0">${SILW.map(w=>wb(w)).join("")}</div><div class="frt-lab"${RD()} style="margin-top:10px">${AR(T("silE"))}</div>${SILE.map(p=>`<div class="frt-pair">${p.map(w=>`<button data-fw="${w}"><b>${tokHtml(w)}</b><small>/${ipaTok(w)}/</small></button>`).join("")}</div>`).join("")}</div></div>
  <div class="frt-sec"><h3${RD()}>🔗 ${AR(T("liaH"))}</h3><p${RD()}>${AR(T("liaP"))}</p><div class="frt-card frt-rule"><div class="frt-ex" style="margin-top:0">${LIAW.map(([a, b])=>{ const l = liaison(a, b); return `<button data-fsay="${a} ${b}">${tokHtml(a, null, l && l.l)}‿${tokHtml(b)}<em>${l ? l.ipa : ""}</em></button>`; }).join("")}<button data-fsay="les héros">${tokHtml("les")} | ${tokHtml("héros")}<small>${T("liaNo")}</small></button></div>
    <div class="frt-ex" style="margin-top:12px">${ELW.map(([a, b])=>`<button data-fw="${esc(b)}"><small style="margin:0 6px 0 0">${a} →</small>${tokHtml(b)}<em>${ipaTok(b)}</em></button>`).join("")}</div></div></div>
  <div class="frt-sec"><h3${RD()}>👂 ${AR(T("mixH"))}</h3><p${RD()}>${AR(T("mixP"))}</p>${MIX.map(([nm, a, b], i)=>`<div class="frt-card"><div class="frt-qh"><b>${nm}</b><button class="frt-b" style="margin-left:auto;padding:5px 12px" data-fq="${i}">${T("play")}</button></div><div class="frt-qpk">${[a, b].map((x, j)=>`<button data-fqp="${i}" data-j="${j}"><b>${x[0]}</b><small>${LG === "zh" ? x[1] : x[2]}</small></button>`).join("")}</div><div class="frt-qm" id="fqm${i}"></div></div>`).join("")}</div></div>`;
  pg.classList.add("on"); pg.scrollTop = 0; }
dict();
window.FRTOOL = {open, close, sounds, look: w => look(w).map(e=>({w: e.w, marked: e.mk, ipa: e.ipa, lemma: e.L.w, pos: e.L.pos, tag: e.tag, zh: e.L.zh, en: e.L.en})), ipa: w => ipaTok(w), parts: w => parts(w).map(p=>({txt: p.txt, el: p.el || "", link: !!p.link, n: p.E ? p.E.length : 0})), liaison, fixedAt, voiceKey, say, everywhere(v){ EVERY = v !== false; }, size: () => dict().size, lang(l){ LGFIX = true; LG = LGS.includes(l) ? l : "en"; }};
})();

/* boat_sea.js */
// 📔 我的船 · 航海手帐（2026-11-06，样板：样板/我的船旅行手帐样板.html，用户说「可以，放进去」；替换原来的「黄昏的海」）
// 包装像 Dior 日历的精致、内容像旅行手帐：
// · 开屏：一天第一次打开「我的船」是一张象牙色礼物卡（TO the world / FROM you · 送给世界的，是你说出的一句话），有出场动画，点一下两扇纸门打开；
// · 手帐一页：日期、三站的细线航线（小圆点跟着三站一个一个出来）、每一站写清楚主题（中英标题）、门头短片的封面做成宝丽来、今天的词做成标签机标签、要说的那一句；
//   开船去城市那站多一张登机牌（去哪、谁在等）；说完盖邮戳 SENT TO THE WORLD；
// · 点照片或那一句：穿过照片进全屏短片（字幕在短片上），听、说；说完就算走过这一站，「再练一会儿」才进原来的船上练习。
// 文字里不写「今晚」这类时间。名字（bsInit / bsHtml / bsAfter / bsEnter / bsOpenPlace、data-bsw）跟黄昏的海一样，template2.html 不用改。
// 依赖 template2.html 递过来的：npcAny、bpPlan、bpDone、bpStopInfo、bpImg、galPh、blDay、blIsleName、blPlace、tkOf、bmU、Z、esc、UI、tkClips、capNat、LEARN_ZH、micListen、boatLog、blGet、blSet、bpRun、bpOpen。
(function(){
const css = `
.bj{--ink:#14305c;--ink2:#2b3f63;--paper:#f6efe1;--ivory:#fbf7ee;--hot:#e2552f;--gold:#c9a45c;--gold2:#e8cf96;--soft:#6b7488;position:relative;margin:-16px -14px 10px;padding:calc(26px + env(safe-area-inset-top)) 22px 8px;color:var(--ink);
  background:radial-gradient(rgba(20,48,92,.13) .9px,transparent 1.1px) 0 0/18px 18px,var(--paper);font:15px/1.55 "Noto Sans SC","PingFang SC",sans-serif}
@media (min-width:701px){.bj{margin:0 0 10px;border-radius:28px;padding-top:30px}}
.bj *{box-sizing:border-box}
.bj-sc{font:600 10.5px/1 "Cormorant Garamond",serif;letter-spacing:.32em;text-transform:uppercase;color:var(--gold)}
.bj-hd{display:flex;justify-content:space-between;align-items:flex-start}
.bj-hd .d{font:500 34px/1 "Noto Serif SC",serif;letter-spacing:.02em;margin-top:10px}
.bj-hd .w{font:italic 500 17px/1 "Cormorant Garamond",serif;color:var(--ink2);margin-top:8px}
.bj-seal{width:62px;height:62px;flex:none;transform:rotate(-8deg);opacity:.9}
.bj-route{position:relative;margin:18px 0 4px;height:62px}
.bj-route svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.bj-route .dot{position:absolute;top:14px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:var(--ivory);border:1.5px solid var(--ink)}
.bj-route .dot.on{background:var(--hot);border-color:var(--hot)}
.bj-route .lb{position:absolute;top:36px;transform:translateX(-50%);text-align:center;font:500 11.5px/1.3 "Noto Serif SC",serif;color:var(--ink2);white-space:nowrap;max-width:34%;overflow:hidden;text-overflow:ellipsis}
.bj-route .lb i{display:block;font:italic 500 11px/1.1 "Cormorant Garamond",serif;color:var(--soft);overflow:hidden;text-overflow:ellipsis}
.bj-intro{font:500 15px/1.6 "Noto Serif SC",serif;color:var(--ink2);margin:16px 0 4px}
.bj-rule{height:1px;background:linear-gradient(90deg,transparent,var(--gold) 20%,var(--gold) 80%,transparent);margin:18px 0 6px;position:relative}
.bj-rule::after{content:"";position:absolute;left:50%;top:-3px;width:7px;height:7px;margin-left:-3.5px;background:var(--paper);border:1px solid var(--gold);transform:rotate(45deg)}
.bj-e{position:relative;margin:26px 0 34px}
.bj-e .no{display:flex;align-items:center;gap:8px}
.bj-e .no b{font:600 12px/1 "Cormorant Garamond",serif;letter-spacing:.2em;color:var(--hot)}
.bj-e .no span{font:500 11.5px/1 "Noto Serif SC",serif;color:var(--soft);letter-spacing:.1em}
.bj-body{display:grid;grid-template-columns:142px minmax(0,1fr);gap:16px;margin-top:12px}
.bj-e.flip .bj-body{grid-template-columns:minmax(0,1fr) 142px}.bj-e.flip .bj-pol{order:2}
.bj-pol{all:unset;cursor:pointer;position:relative;display:block;align-self:start;background:#fff;padding:8px 8px 30px;box-shadow:0 1px 1px rgba(0,0,0,.08),0 8px 18px rgba(40,30,10,.18);transform:rotate(-3deg);transition:transform .3s}
.bj-e.flip .bj-pol{transform:rotate(2.5deg)}
.bj-pol:active{transform:rotate(0) scale(.97)}
.bj-pol img{display:block;width:100%;aspect-ratio:4/4.6;object-fit:cover;filter:saturate(.92) contrast(1.02);background:#e9e2d2}
.bj-pol figcaption{position:absolute;left:4px;right:4px;bottom:7px;text-align:center;font:600 15px/1 "Caveat","Noto Serif SC",cursive;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bj-pol .play{position:absolute;right:14px;bottom:40px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.bj-tape{position:absolute;width:64px;height:20px;top:-10px;left:50%;margin-left:-32px;transform:rotate(-4deg);background:repeating-linear-gradient(45deg,#f2c9a0 0 6px,#f7dcc0 6px 12px);opacity:.85;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.bj-e.flip .bj-tape{background:repeating-linear-gradient(-45deg,#b9d7e6 0 6px,#d3e6ef 6px 12px);transform:rotate(5deg)}
.bj-pm{position:absolute;right:-14px;top:-16px;width:78px;height:78px;opacity:0;transform:rotate(-14deg) scale(1.4);transition:all .5s cubic-bezier(.3,1.6,.5,1);pointer-events:none}
.bj-e.done .bj-pm{opacity:.85;transform:rotate(-14deg) scale(1)}
.bj-e.stamp .bj-pm{animation:bjStamp .7s cubic-bezier(.3,1.6,.5,1) .5s both}
@keyframes bjStamp{0%{opacity:0;transform:rotate(-14deg) scale(1.6)}100%{opacity:.85;transform:rotate(-14deg) scale(1)}}
.bj-tt{font:600 21px/1.25 "Noto Serif SC",serif;margin:0;word-break:break-word}
.bj-te{font:italic 500 16px/1.2 "Cormorant Garamond",serif;color:var(--soft);margin-top:3px}
.bj-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.bj-dymo{font:700 11.5px/1 "Courier Prime",monospace;letter-spacing:.06em;color:#fff;background:var(--ink);padding:6px 8px 5px;border-radius:2px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 1px 2px rgba(0,0,0,.25);text-transform:uppercase}
.bj-dymo:nth-child(3n+2){background:#8a2f22}.bj-dymo:nth-child(3n){background:#2d5a46}
.bj-say{all:unset;cursor:pointer;display:block;margin-top:14px;position:relative;padding:6px 0 0 18px}
.bj-say::before{content:"“";position:absolute;left:0;top:-8px;font:500 40px/1 "Cormorant Garamond",serif;color:var(--gold)}
.bj-say b{display:block;font:600 22px/1.15 "Caveat",cursive;color:var(--ink)}
.bj-say.zh b{font:500 19px/1.4 "Noto Serif SC",serif}
.bj-say small{display:block;font:400 12.5px/1.5 "Noto Sans SC",sans-serif;color:var(--soft);margin-top:3px}
.bj-pass{position:relative;margin-top:14px;background:var(--ivory);border:1px solid rgba(20,48,92,.18);border-radius:10px;display:grid;grid-template-columns:minmax(0,1fr) 70px;box-shadow:0 6px 14px rgba(40,30,10,.12);overflow:hidden}
.bj-pass .m{padding:10px 12px;min-width:0}
.bj-pass .r{border-left:1.5px dashed rgba(20,48,92,.3);padding:10px 8px;text-align:center;position:relative}
.bj-pass .r::before,.bj-pass .r::after{content:"";position:absolute;left:-8px;width:14px;height:14px;border-radius:50%;background:var(--paper);border:1px solid rgba(20,48,92,.18)}
.bj-pass .r::before{top:-8px}.bj-pass .r::after{bottom:-8px}
.bj-pass .k{font:600 9.5px/1 "Cormorant Garamond",serif;letter-spacing:.24em;color:var(--soft);text-transform:uppercase}
.bj-pass .v{font:600 14px/1.35 "Noto Serif SC",serif;margin-top:4px}
.bj-pass .rt{display:flex;align-items:center;gap:8px;font:600 17px/1 "Cormorant Garamond",serif;letter-spacing:.06em;margin-top:6px;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.bj-pass .big{font:600 26px/1 "Cormorant Garamond",serif;margin-top:6px}
.bj-who{margin-top:8px;font:500 12.5px/1.4 "Noto Serif SC",serif;color:var(--ink2)}
.bj-who small{display:block;color:var(--soft);font-size:11.5px;font-weight:400}
.bj-past h3{font:600 12px/1 "Cormorant Garamond",serif;letter-spacing:.3em;color:var(--gold);text-transform:uppercase;margin:6px 0 12px}
.bj-pst{display:flex;gap:4px;overflow-x:auto;padding:6px 4px 14px;scrollbar-width:none}
.bj-pst::-webkit-scrollbar{display:none}
.bj-mini{flex:none;width:72px;background:#fff;padding:4px 4px 16px;box-shadow:0 4px 10px rgba(40,30,10,.16);transform:rotate(var(--r));position:relative;margin-right:2px}
.bj-mini img{display:block;width:100%;aspect-ratio:1;object-fit:cover;background:#e9e2d2}
.bj-mini span{position:absolute;left:0;right:0;bottom:2px;text-align:center;font:600 12px/1 "Caveat","Noto Serif SC",cursive;color:var(--ink2)}
.bj-ftr{margin:28px 0 22px;text-align:center;font:italic 500 17px/1.2 "Cormorant Garamond",serif;color:#8f7a4c}
.bj-ftr span{display:block;margin-top:7px;font:400 11.5px/1 "Noto Serif SC",serif;font-style:normal;letter-spacing:.24em;color:#a39675}
/* 三站一张一张落下，航线上的小圆点跟着出来 */
.bj.drop .bj-e,.bj.drop .bj-rule.r2,.bj.drop .bj-past,.bj.drop .bj-ftr{opacity:0}
.bj.drop .bj-route svg{clip-path:inset(0 84% 0 16%)}
.bj.drop .bj-route .dot{transform:scale(0)}
.bj.drop .bj-route .lb{opacity:0}
.bj.drop.go .bj-e{animation:bjDrop .9s cubic-bezier(.2,.9,.25,1.08) both}
.bj.drop.go .bj-e:nth-of-type(1){animation-delay:.25s}
.bj.drop.go .bj-e:nth-of-type(2){animation-delay:1.05s}
.bj.drop.go .bj-e:nth-of-type(3){animation-delay:1.85s}
.bj.drop.go .bj-rule.r2{animation:bjFade .6s ease 2.6s both}
.bj.drop.go .bj-past,.bj.drop.go .bj-ftr{animation:bjFade .8s ease 2.8s both}
.bj.drop.go .bj-route svg{animation:bjDraw 1.9s ease-in-out .35s both}
.bj.drop.go .bj-route .dot{animation:bjDot .7s cubic-bezier(.3,1.6,.5,1) both}
.bj.drop.go .bj-route .lb{animation:bjFade .6s ease both}
.bj.drop.go .bj-route .dot:nth-of-type(1),.bj.drop.go .bj-route .lb:nth-of-type(1){animation-delay:.35s}
.bj.drop.go .bj-route .dot:nth-of-type(2),.bj.drop.go .bj-route .lb:nth-of-type(2){animation-delay:1.15s}
.bj.drop.go .bj-route .dot:nth-of-type(3),.bj.drop.go .bj-route .lb:nth-of-type(3){animation-delay:1.95s}
@keyframes bjDraw{0%{clip-path:inset(0 84% 0 16%)}100%{clip-path:inset(0 16% 0 16%)}}
@keyframes bjDot{0%{transform:scale(0);box-shadow:0 0 0 0 rgba(201,164,92,.55)}55%{transform:scale(1.35)}100%{transform:scale(1);box-shadow:0 0 0 9px rgba(201,164,92,0)}}
@keyframes bjDrop{0%{opacity:0;transform:translateY(-46px) rotate(-2.5deg) scale(1.03)}60%{opacity:1}100%{opacity:1;transform:none}}
@keyframes bjFade{from{opacity:0}to{opacity:1}}
/* 开屏：象牙色礼物卡 */
#bjCover{position:fixed;inset:0;z-index:9500;perspective:1400px;--ink:#14305c;--ivory:#fbf7ee;--gold:#c9a45c}
#bjCover .half{position:absolute;top:0;bottom:0;width:calc(50% + .6px);overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform 1.8s cubic-bezier(.65,0,.2,1) .35s,opacity .5s ease 1.6s;cursor:pointer}
#bjCover .half.l{left:0;transform-origin:0 50%;box-shadow:inset -1px 0 0 rgba(143,122,76,.18)}
#bjCover .half.r{right:0;transform-origin:100% 50%;box-shadow:inset 1px 0 0 rgba(143,122,76,.18)}
#bjCover.open{pointer-events:none}#bjCover.open .half{opacity:0}#bjCover.open .half.l{transform:rotateY(96deg)}#bjCover.open .half.r{transform:rotateY(-96deg)}
#bjCover .cov{position:absolute;top:0;height:100%;width:100vw;background:var(--ivory);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--ink)}
#bjCover .half.l .cov{left:0}#bjCover .half.r .cov{right:0}
#bjCover .cov::before{content:"";position:absolute;inset:0;opacity:.5;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .4 0 0 0 0 .3 0 0 0 .1 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E")}
#bjCover .cov::after{content:"";position:absolute;inset:16px;border:1px solid var(--gold);border-radius:4px;box-shadow:inset 0 0 0 3px var(--ivory),inset 0 0 0 4px rgba(201,164,92,.35);pointer-events:none;animation:bjFrame 1.4s cubic-bezier(.2,.7,.2,1) .15s both}
#bjCover .cov>*{position:relative}
#bjCover .br{position:absolute;top:calc(50px + env(safe-area-inset-top));font:600 12px/1 "Cormorant Garamond",serif;letter-spacing:.5em;text-indent:.5em;color:#8f7a4c;animation:bjUp 1s ease .5s both}
#bjCover .emb{width:170px;height:170px;filter:drop-shadow(-1.5px -1.5px 1px #fff) drop-shadow(2px 2.5px 2.5px rgba(110,90,50,.42));animation:bjPress 1.6s cubic-bezier(.3,.6,.2,1) .7s both}
#bjCover .emb .bt{transform-origin:85px 110px;animation:bjBob 5.5s ease-in-out 2.6s infinite}
#bjCover .emb .wv{animation:bjWave 5.5s ease-in-out 2.6s infinite}
#bjCover .ttl{font:600 13px/1 "Cormorant Garamond",serif;letter-spacing:.46em;text-indent:.46em;color:var(--gold);margin-top:26px;animation:bjSpread 1.4s cubic-bezier(.2,.7,.2,1) 1.35s both}
#bjCover .d1{font:500 26px/1 "Noto Serif SC",serif;letter-spacing:.28em;text-indent:.28em;margin-top:18px;animation:bjUp 1s ease 1.75s both}
#bjCover .tf{margin-top:30px;display:flex;flex-direction:column;align-items:center;animation:bjUp 1s ease 2.05s both}
#bjCover .tf p{display:flex;align-items:baseline;gap:14px;margin:0 0 6px;transform:translateX(-14px)}
#bjCover .tf b{width:44px;text-align:right;font:600 10.5px/1 "Cormorant Garamond",serif;letter-spacing:.32em;color:#b0914f}
#bjCover .tf i{font:italic 500 23px/1.15 "Cormorant Garamond",serif;color:var(--ink);min-width:96px;text-align:left;border-bottom:1px solid rgba(201,164,92,.45);padding:0 4px 3px}
#bjCover .tf span{margin-top:14px;font:400 12.5px/1.4 "Noto Serif SC",serif;letter-spacing:.24em;text-indent:.24em;color:#8f7a4c;padding:0 30px}
#bjCover .hint{position:absolute;bottom:calc(50px + env(safe-area-inset-bottom));font:400 11.5px/1 "Noto Serif SC",serif;letter-spacing:.4em;text-indent:.4em;color:#a39675;animation:bjUp .9s ease 2.6s both,bjBr 3.2s ease-in-out 3.5s infinite}
#bjCover .sheen{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2}
#bjCover .sheen::before{content:"";position:absolute;top:-20%;bottom:-20%;left:-90%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45) 50%,transparent);transform:skewX(-14deg);animation:bjSheen 7s ease-in-out 2.2s infinite}
@keyframes bjFrame{0%{opacity:0;transform:scale(1.035)}100%{opacity:1;transform:none}}
@keyframes bjUp{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}
@keyframes bjSpread{0%{opacity:0;letter-spacing:.9em;text-indent:.9em}100%{opacity:1;letter-spacing:.46em;text-indent:.46em}}
@keyframes bjPress{0%{opacity:0;transform:scale(1.06);filter:drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 rgba(110,90,50,0))}45%{opacity:1}100%{opacity:1;transform:none;filter:drop-shadow(-1.5px -1.5px 1px #fff) drop-shadow(2px 2.5px 2.5px rgba(110,90,50,.42))}}
@keyframes bjBob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2.5px) rotate(-1.2deg)}}
@keyframes bjWave{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
@keyframes bjSheen{0%{left:-90%}30%,100%{left:150%}}
@keyframes bjBr{50%{opacity:.35}}
/* 穿过照片：全屏短片 */
.bj-portal{position:fixed;z-index:9600;overflow:hidden;background:#000 center/cover;transition:all .9s cubic-bezier(.6,0,.2,1)}
#bsPlace{position:fixed;inset:0;z-index:9700;background:#000;color:#fff;opacity:0;pointer-events:none;transition:opacity .45s;--gold2:#e8cf96}
#bsPlace:empty{display:none}
#bsPlace.on{opacity:1;pointer-events:auto}
#bsPlace .bg,#bsPlace video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#bsPlace .bg{animation:bjKen 26s ease-in-out infinite alternate}
@keyframes bjKen{to{transform:scale(1.12) translate(-1.5%,-1%)}}
#bsPlace .shade{position:absolute;inset:0;background:linear-gradient(rgba(10,14,36,.5) 0,transparent 22%,transparent 36%,rgba(10,14,36,.9) 100%)}
#bsPlace .back{all:unset;cursor:pointer;position:absolute;left:18px;top:calc(20px + env(safe-area-inset-top));font:400 13.5px/1 "Noto Serif SC",serif;letter-spacing:.16em;padding:8px 4px;color:#f4efe4}
#bsPlace .back.ready{color:var(--gold2)}
#bsPlace .where{position:absolute;right:20px;top:calc(28px + env(safe-area-inset-top));text-align:right;font:400 12px/1.5 "Noto Serif SC",serif;opacity:.85;max-width:58%}
#bsPlace .words{position:absolute;left:24px;right:24px;bottom:calc(150px + env(safe-area-inset-bottom));max-width:620px}
#bsPlace .tp{font:600 10.5px/1 "Cormorant Garamond",serif;letter-spacing:.3em;color:var(--gold2);text-transform:uppercase}
#bsPlace .ti{font:500 15px/1.3 "Noto Serif SC",serif;margin:6px 0 14px;opacity:.9}
#bsPlace .say{margin:0;font:500 30px/1.2 "Cormorant Garamond",serif}
#bsPlace .say.zh{font:500 25px/1.4 "Noto Serif SC",serif}
#bsPlace .nat{font:400 14px/1.6 "Noto Serif SC",serif;opacity:.82;margin-top:8px}
#bsPlace .tg{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
#bsPlace .tg span{font:700 11px/1 "Courier Prime",monospace;letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(232,207,150,.6);color:var(--gold2);padding:5px 7px 4px;border-radius:2px}
#bsPlace .heard{margin-top:12px;font:400 14px/1.6 "Noto Serif SC",serif;color:var(--gold2);min-height:1em}
#bsPlace .ctl{position:absolute;left:0;right:0;bottom:calc(44px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center;gap:26px}
#bsPlace .rnd{all:unset;cursor:pointer;width:46px;height:46px;border-radius:50%;border:1px solid rgba(244,239,228,.6);display:grid;place-items:center;color:#f4efe4}
#bsPlace .mic{width:72px;height:72px;border:1.5px solid #f4efe4;position:relative}
#bsPlace .mic::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(244,239,228,.35)}
#bsPlace .mic.done{border-color:var(--gold2);color:var(--gold2)}
#bsPlace .more{all:unset;cursor:pointer;font:400 12.5px/1 "Noto Serif SC",serif;letter-spacing:.1em;color:#f4efe4;opacity:.85;width:46px;text-align:center;white-space:nowrap}
#bsPlace .words{bottom:calc(236px + env(safe-area-inset-bottom))}
#bsPlace .others{position:absolute;left:0;right:0;bottom:calc(128px + env(safe-area-inset-bottom));padding:0 24px;max-width:668px}
#bsPlace .others h4{margin:0 0 9px;font:600 10.5px/1 "Cormorant Garamond",serif;letter-spacing:.3em;color:var(--gold2);text-transform:uppercase;display:flex;justify-content:space-between;gap:10px}
#bsPlace .others h4 span{font:400 11.5px/1 "Noto Serif SC",serif;letter-spacing:.1em;text-transform:none;color:rgba(244,239,228,.7)}
#bsPlace .row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;min-height:44px;align-items:center}
#bsPlace .row::-webkit-scrollbar{display:none}
#bsPlace .vnone{font:400 12.5px/1.5 "Noto Serif SC",serif;color:rgba(244,239,228,.72)}
#bsPlace .vc{flex:none;display:flex;align-items:center;border-radius:99px;background:rgba(255,255,255,.1);border:1px solid rgba(244,239,228,.22);backdrop-filter:blur(6px)}
#bsPlace .vc.me{border-style:dashed;border-color:var(--gold2)}
#bsPlace .vc.new{animation:bjPop .6s cubic-bezier(.3,1.6,.5,1)}
@keyframes bjPop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
#bsPlace .v{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:6px 4px 6px 6px;color:#fff}
#bsPlace .v .av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:600 13px/1 "Noto Serif SC",serif;flex:none;position:relative}
#bsPlace .v b{display:block;font:500 12.5px/1.15 "Noto Sans SC",sans-serif;white-space:nowrap}
#bsPlace .v small{display:block;font:400 10.5px/1.2 "Noto Sans SC",sans-serif;opacity:.7;white-space:nowrap}
#bsPlace .vc.play .av::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1.5px solid var(--gold2);animation:bjRing 1s ease-out infinite}
@keyframes bjRing{from{opacity:1;transform:scale(.9)}to{opacity:0;transform:scale(1.35)}}
#bsPlace .vx{all:unset;cursor:pointer;color:rgba(244,239,228,.6);padding:6px 10px 6px 4px;font-size:13px}
#bsPlace .va{display:none}#bsPlace .vc.menu .va{display:flex}#bsPlace .vc.menu .vx{display:none}
#bsPlace .va button{all:unset;cursor:pointer;font:400 12px/1 "Noto Sans SC",sans-serif;color:var(--gold2);padding:6px 10px;border-left:1px solid rgba(244,239,228,.2)}
#bsPlace .mic.on::after{border-color:var(--gold2);animation:bjRing 1s ease-out infinite}
#bsPlace .sheet{position:absolute;left:0;right:0;bottom:0;z-index:5;background:#fbf7ee;color:#14305c;border-radius:22px 22px 0 0;padding:22px 24px calc(26px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .55s cubic-bezier(.2,.8,.2,1);box-shadow:0 -10px 30px rgba(0,0,0,.25);max-width:700px;margin:0 auto}
#bsPlace .sheet.on{transform:none}
#bsPlace .sheet .k{font:600 10.5px/1 "Cormorant Garamond",serif;letter-spacing:.3em;color:#c9a45c;text-transform:uppercase}
#bsPlace .sheet h3{margin:8px 0 4px;font:600 20px/1.35 "Noto Serif SC",serif}
#bsPlace .sheet p{margin:0;color:#6b7488;font-size:13px;line-height:1.6}
#bsPlace .sheet .line{margin:14px 0 4px;padding:12px 14px;border:1px dashed rgba(20,48,92,.25);border-radius:10px;font:500 18px/1.5 "Noto Serif SC",serif;background:#fff}
#bsPlace .sheet .live{min-height:1.4em;margin-top:6px;font-size:13px;color:#8f7a4c}
#bsPlace .sheet .acts{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}
#bsPlace .sheet .smic{all:unset;cursor:pointer;width:62px;height:62px;border-radius:50%;background:#14305c;color:#fff;display:grid;place-items:center;position:relative}
#bsPlace .sheet .smic.on::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid #c9a45c;animation:bjRing 1s ease-out infinite}
#bsPlace .sheet .skip{all:unset;cursor:pointer;color:#6b7488;font-size:13px;padding:8px;min-width:60px}
#bsPlace .sheet .btn{all:unset;cursor:pointer;flex:1;text-align:center;padding:13px 10px;border-radius:12px;font:500 14.5px/1 "Noto Sans SC",sans-serif}
#bsPlace .sheet .btn.pri{background:#14305c;color:#fff}
#bsPlace .sheet .btn.pri[disabled]{opacity:.45;pointer-events:none}
#bsPlace .sheet .btn.sec{color:#14305c;border:1px solid rgba(20,48,92,.25)}
#bsPlace .sheet .two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:14px}
#bsPlace .sheet .mine{all:unset;box-sizing:border-box;display:block;min-width:0;cursor:pointer;background:#fff;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#6b7488;border:1px solid rgba(20,48,92,.1)}
#bsPlace .sheet .mine b{display:block;color:#14305c;font:500 14px/1.4 "Noto Serif SC",serif;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#bsPlace .sheet .note{margin-top:10px;font-size:12px;color:#8f7a4c}
@media (prefers-reduced-motion:reduce){.bj *,#bjCover *,#bsPlace *{animation:none!important;transition-duration:.01s!important}}
`;
let A = {};
// 「我的船」每次画的时候把要用的东西递过来（template2.html 里的代码在自己的范围里，外面拿不到）
window.bsInit = api => { A = api; if (!A.zeDone && A.ZE){ try { Object.assign(A.ZE, ZEX); } catch(e){} } };
const ZEX = {"航海手帐": "Voyage Journal", "开船去说一句": "Sail there, say one line", "复习": "Review", "学": "Learn", "个词": "words", "在等你": "is waiting for you", "前几天": "Earlier pages", "轻点打开": "Tap to open", "回到手帐": "Back to the journal", "再练": "More", "听到了：": "Heard:", "✓ 说出来了": "✓ Said it", "跟着说一遍就好": "Just say it after the clip", "同一句，别人怎么说": "Same line, other voices", "还没有人送出这一句，你可以做第一个。": "No one has sent this line yet — you could be the first.", "你": "You", "删除": "Delete", "举报": "Report", "在听……说完再点一下": "Listening… tap again when you're done", "用你的母语，说这一句": "Say it in your own language", "这次不用": "Not this time", "这两句，送给世界吗？": "Send these to the world?", "这一句，送给世界吗？": "Send this to the world?", "先存在你的手帐里。公开以后，学这句话的人能听到；随时可以删，只有声音，不露脸。": "It stays in your journal first. Once public, people learning this line can hear it; delete any time — voice only, no face.", "送给世界": "Send to the world", "只留给自己": "Keep it for myself", "登录以后才能送给世界。": "Log in to send it to the world.", "你说的": "You said", "✓ 已经送给世界": "✓ Sent to the world", "✓ 存在你的手帐里了": "✓ Kept in your journal", "没录上，再点一下试试": "Didn't catch that — tap to try again", "用你平时会说的话就好，不用照着念。": "Say it the way you normally would — no need to read it word for word.", "开口说一句，就是给世界的一份礼物": "Say one line — that is your gift to the world", "航线还在准备，先去群岛逛逛。": "Your route is still being drawn — have a look around the islands."};
let st = null;
const ensure = () => { if (st) return; st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const ln = document.createElement("link"); ln.rel = "stylesheet"; ln.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Serif+SC:wght@400;500;600&family=Caveat:wght@600&family=Courier+Prime:wght@700&display=swap"; document.head.appendChild(ln); };
const MON = ["January","February","March","April","May","June","July","August","September","October","November","December"], WK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const COVER_KEY = "bj.cover.v1", SEEN_KEY = "bj.done.v1";
let dropped = false, coverOn = false;
const photo = key => { const [i, k] = key.split("|"); let P = null; try { P = A.galPh ? A.galPh(i, k) : null; } catch(e){} return (P && P.h && P.h.poster) || A.bpImg(i, k) || ""; };
const placeRaw = (i, k) => { try { return ((typeof ISLE_PLACES !== "undefined" && ISLE_PLACES[i] && ISLE_PLACES[i].places) || []).find(p=>p.k === k) || {}; } catch(e){ return {}; } };
const clipOf = (i, k) => { try { return (A.tkClips ? A.tkClips(i, k) : [])[0] || null; } catch(e){ return null; } };
const tgtOf = c => c && c.cap ? (A.LEARN_ZH ? c.cap.zh : c.cap.en) : "";
// 每一站要显示的东西
function stopData(s, n){ const {bpStopInfo, blIsleName, blPlace, tkOf, bmU, Z, UI} = A, zh = UI === "zh";
  const key = s.k === "rv" ? s.keys[0] : s.key, [i, k] = key.split("|"), I = bpStopInfo(s) || {}, c = clipOf(i, k), R = placeRaw(i, k);
  const d = {n, key, i, k, kind: s.k, isle: blIsleName(i), img: (c && c.poster) || photo(key), W: (I.W || []).map(x=>x && (x.w || x)).filter(Boolean).slice(0, 4), say: tgtOf(c), nat: c && c.cap && A.capNat ? A.capNat(c.cap) : "", where: c && c.where ? (zh ? c.where.zh : c.where.en) || "" : ""};
  const T = zh ? (R.zh || blPlace(i, k).n) : (R.en || R.zh || blPlace(i, k).n), T2 = zh ? (R.en || "") : (A.LEARN_ZH ? (R.zh || "") : "");
  if (s.k === "ty" && window.TYOU){ d.t = T; d.te = window.TYOU.stepName(s.step); d.lb = d.isle; d.lbi = T; }
  else if (s.k === "rv"){ d.t = Z("复习"); d.te = s.keys.map(x=>{ const [a, b] = x.split("|"); return blPlace(a, b).n; }).join(" · "); d.lb = Z("复习"); d.lbi = d.isle; }
  else { d.t = T; d.te = T2 !== T ? T2 : ""; d.lb = d.isle; d.lbi = R.en || T; }
  if (s.k === "port"){ const g = ((tkOf ? tkOf(i, k) : null) || {}).go || {}; d.city = bmU(g.city || ""); d.spot = bmU(g.spot || ""); d.npc = I.npc || ""; d.lb = d.city || d.isle; d.lbi = d.npc || T;
    let job = ""; try { const nn = A.npcAny ? A.npcAny(g.npc) : null; job = nn && zh ? (nn.job || "") : ""; } catch(e){} d.job = job; }
  return d; }
const seal = `<svg class="bj-seal" viewBox="0 0 62 62" aria-hidden="true"><circle cx="31" cy="31" r="28" fill="none" stroke="#c9a45c" stroke-width="1"/><circle cx="31" cy="31" r="24.5" fill="none" stroke="#c9a45c" stroke-width=".7" stroke-dasharray="1.5 2.5"/><path d="M32 16c6 4 9 10 10 17H32z" fill="#c9a45c" opacity=".85"/><path d="M30 20v13H21c1-6 4-10 9-13z" fill="#c9a45c" opacity=".55"/><path d="M18 36h26c-1 4-4 7-9 7h-8c-5 0-8-3-9-7z" fill="#14305c"/></svg>`;
const postmark = (txt, n) => { const t = new Date(); return `<svg class="bj-pm" viewBox="0 0 80 80" aria-hidden="true"><defs><path id="bjpp${n}" d="M40 40m-27 0a27 27 0 1 1 54 0a27 27 0 1 1-54 0"/></defs><g fill="none" stroke="#e2552f" stroke-width="1.6"><circle cx="40" cy="40" r="35"/><circle cx="40" cy="40" r="21"/></g><text font-family="Courier Prime,monospace" font-size="8" font-weight="700" fill="#e2552f" letter-spacing="1.4"><textPath href="#bjpp${n}">SENT TO THE WORLD · SENT ·</textPath></text><text x="40" y="38" text-anchor="middle" font-family="Courier Prime,monospace" font-size="9" font-weight="700" fill="#e2552f">${t.getDate()} ${MON[t.getMonth()].slice(0, 3).toUpperCase()}</text><text x="40" y="49" text-anchor="middle" font-family="Courier Prime,monospace" font-size="7" font-weight="700" fill="#e2552f">${txt}</text></svg>`; };
const play = `<span class="play"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 1.5l7 4.5-7 4.5z" fill="#14305c"/></svg></span>`;
function entry(d, done, stamp){ const {Z, esc} = A, flip = d.n % 2 === 1;
  const head = `<div class="no"><b>NO.${d.n + 1}</b><span>${d.kind === "ty" ? esc(d.isle) + " · " + Z("接着走") + " " + esc(d.te) : d.kind === "port" ? Z("开船去说一句") : d.kind === "rv" ? esc(d.isle) + " · " + Z("复习") : esc(d.isle) + (d.W.length ? ` · ${Z("学")} ${d.W.length} ${Z("个词")}` : "")}</span></div>`;
  const pol = `<button class="bj-pol" data-bsw="${d.n}"><i class="bj-tape"></i>${d.img ? `<img src="${esc(d.img)}" alt="" loading="lazy">` : `<img alt="">`}${play}<figcaption>${esc(d.where || d.t)}</figcaption>${postmark(d.kind === "port" ? "PORT" : d.kind === "rv" ? "REVIEW" : "ISLE", d.n)}</button>`;
  const tags = d.W.length ? `<div class="bj-tags">${d.W.map(w=>`<span class="bj-dymo">${esc(w)}</span>`).join("")}</div>` : "";
  const txt = `<div class="txt"><p class="bj-tt">${esc(d.t)}</p>${d.te ? `<div class="bj-te">${esc(d.te)}</div>` : ""}${tags}</div>`;
  const pass = d.kind === "port" ? `<div class="bj-pass"><div class="m"><div class="k">Boarding pass · HeyVoyo</div><div class="rt">MY BOAT <svg width="30" height="10" viewBox="0 0 34 10" aria-hidden="true"><path d="M0 5h30M26 1l5 4-5 4" fill="none" stroke="#14305c" stroke-width="1.2"/></svg> ${esc(d.city)}</div>${d.spot ? `<div class="v">${esc(d.spot)}</div>` : ""}${d.npc ? `<div class="bj-who"><b>${esc(d.npc)} ${Z("在等你")}</b>${d.job ? `<small>${esc(d.job)}</small>` : ""}</div>` : ""}</div><div class="r"><div class="k">Stop</div><div class="big">0${d.n + 1}</div></div></div>` : "";
  const say = d.say ? `<button class="bj-say${A.LEARN_ZH ? " zh" : ""}" data-bsw="${d.n}"><b>${esc(d.say)}</b>${d.nat ? `<small>${esc(d.nat)}</small>` : ""}</button>` : "";
  return `<article class="bj-e${flip ? " flip" : ""}${done ? " done" : ""}${stamp ? " stamp" : ""}">${head}<div class="bj-body">${pol}${txt}</div>${pass}${say}</article>`; }
// 手帐那一页
window.bsHtml = function(R, L){ ensure(); const {bpPlan, bpDone, blDay, Z, esc, UI} = A, zh = UI === "zh", now = new Date(), S = (bpPlan(R).stops || []).slice(0, 3);
  const D = S.map(stopData), done = S.map(s=>bpDone(s, R, L)), nd = done.filter(Boolean).length, left = S.length - nd;
  let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch(e){} if (seen.day !== blDay()) seen = {day: blDay(), n: []};
  const fresh = D.map((d, n)=>done[n] && !seen.n.includes(n));
  const xs = S.length === 1 ? [50] : S.length === 2 ? [25, 75] : [16, 50, 84];
  const path = S.length === 3 ? "M16 20 C 30 6, 38 6, 50 20 S 70 34, 84 20" : S.length === 2 ? "M25 20 C 40 4, 60 4, 75 20" : "";
  const route = S.length ? `<div class="bj-route">${path ? `<svg viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="#c9a45c" stroke-width=".6" stroke-dasharray="1.6 1.6" vector-effect="non-scaling-stroke"/></svg>` : ""}${xs.map((x, n)=>`<span class="dot${done[n] ? " on" : ""}" style="left:${x}%"></span>`).join("")}${D.map((d, n)=>`<div class="lb" style="left:${xs[n]}%">${esc(d.lb)}<i>${esc(d.lbi || "")}</i></div>`).join("")}</div>` : "";
  const intro = !S.length ? Z("航线还在准备，先去群岛逛逛。")
    : !left ? (zh ? "今天的站都走过了，你的话已经送给世界。明天船会带你去新的地方。" : "Every stop is done — your words are out in the world. Tomorrow the boat takes you somewhere new.")
    : nd ? (zh ? `已经送出 ${nd} 句，还剩 ${left} 站。` : `${nd} sent, ${left} to go.`)
    : (zh ? `今天 ${S.length} 站。点照片走进去，说一句。` : `${S.length} stops today. Tap a photo, step in, say one line.`);
  // 前几天：航海日志里走过的地方
  const OLD = []; for (let dd = 1; dd <= 7 && OLD.length < 8; dd++){ const dk = blDay(Date.now() - dd * 864e5), ks = Object.keys((L.days || {})[dk] || {}).filter(x=>x.includes("|") && !x.endsWith("|_prac")).slice(0, 2); ks.forEach(x=>OLD.push({key: x, d: dd})); }
  const dlab = dd => { const t = new Date(Date.now() - dd * 864e5); return zh ? `${t.getMonth() + 1}月${t.getDate()}日` : MON[t.getMonth()].slice(0, 3) + " " + t.getDate(); };
  const past = OLD.length ? `<div class="bj-rule"></div><section class="bj-past"><h3>Earlier pages${zh ? " · 前几天" : ""}</h3><div class="bj-pst">${OLD.map((o, j)=>`<div class="bj-mini" style="--r:${[-4, 3, -2, 4, -3][j % 5]}deg">${photo(o.key) ? `<img src="${esc(photo(o.key))}" alt="" loading="lazy">` : "<img alt=\"\">"}<span>${dlab(o.d)}</span></div>`).join("")}</div></section>` : "";
  return `<section class="bj" id="bsBox">
    <div class="bj-hd"><div><div class="bj-sc">HeyVoyo · ${zh ? "航海手帐" : "Voyage Journal"}</div><div class="d">${zh ? `${now.getMonth() + 1}月${now.getDate()}日` : `${now.getDate()} ${MON[now.getMonth()]}`}</div><div class="w">${WK[now.getDay()]}${zh ? `, ${now.getDate()} ${MON[now.getMonth()]}` : ""}</div></div>${seal}</div>
    ${route}<p class="bj-intro">${intro}</p><div class="bj-rule"></div>
    ${D.map((d, n)=>entry(d, done[n], fresh[n])).join('<div class="bj-rule r2"></div>')}
    ${past}<p class="bj-ftr">One more word, one more world${zh ? "<span>多会一句话，世界就大一点</span>" : ""}</p>
  </section>`; };
// 开屏礼物卡
function coverHtml(){ const {Z, UI} = A, zh = UI === "zh", now = new Date();
  const art = `<div class="sheen"></div><div class="br">HEYVOYO</div><svg class="emb" viewBox="0 0 170 170" aria-hidden="true"><g fill="#fbf7ee"><path fill-rule="evenodd" d="M85 6a79 79 0 110 158A79 79 0 0185 6zm0 5a74 74 0 100 148A74 74 0 0085 11z"/><g class="bt"><path d="M88 34c22 14 34 36 36 62H88z"/><path d="M82 46v50H50c4-20 15-37 32-50z"/><path d="M40 104h90c-4 14-14 24-28 26H68c-14-2-24-12-28-26z"/></g><path class="wv" d="M34 140c8-5 16-5 24 0s16 5 24 0 16-5 24 0 16 5 24 0v6c-8 5-16 5-24 0s-16-5-24 0-16 5-24 0-16-5-24 0z"/></g></svg>
    <div class="ttl">VOYAGE JOURNAL</div><div class="d1">${zh ? `${now.getMonth() + 1}月${now.getDate()}日` : `${now.getDate()} ${MON[now.getMonth()]}`}</div><div class="tf"><p><b>TO</b><i>the world</i></p><p><b>FROM</b><i>you</i></p><span>${Z("开口说一句，就是给世界的一份礼物")}</span></div><div class="hint">${Z("轻点打开")}</div>`;
  return `<div class="half l"><div class="cov">${art}</div></div><div class="half r"><div class="cov">${art}</div></div>`; }
function dropIn(B){ if (!B || matchMedia("(prefers-reduced-motion:reduce)").matches) return; B.classList.add("drop"); B.classList.remove("go"); void B.offsetWidth; B.classList.add("go"); setTimeout(()=>B.classList.remove("drop", "go"), 3800); }
// 画完以后：开屏、三站落下、刚做完的站盖邮戳
window.bsAfter = function(box, R, L){ const {bpPlan, bpDone, blDay} = A, B = box.querySelector("#bsBox"); if (!B) return;
  let opened = true; try { opened = localStorage.getItem(COVER_KEY) === blDay(); } catch(e){}
  if (!opened && !coverOn){ coverOn = true; B.classList.add("drop"); let C = document.getElementById("bjCover"); if (!C){ C = document.createElement("div"); C.id = "bjCover"; document.body.appendChild(C); }
    C.className = ""; C.innerHTML = coverHtml();
    C.onclick = () => { if (C.classList.contains("open")) return; C.classList.add("open"); try { localStorage.setItem(COVER_KEY, blDay()); } catch(e){} dropped = true;
      setTimeout(()=>dropIn(document.getElementById("bsBox")), 1500); setTimeout(()=>{ C.remove(); coverOn = false; }, 2300); }; }
  else if (!coverOn && !dropped){ dropped = true; dropIn(B); }
  else if (coverOn) B.classList.add("drop");
  const S = (bpPlan(R).stops || []).slice(0, 3);
  let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch(e){} if (seen.day !== blDay()) seen = {day: blDay(), n: []};
  S.forEach((s, n)=>{ if (bpDone(s, R, L) && !seen.n.includes(n)) seen.n.push(n); });
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch(e){} };
// 穿过照片以后：全屏短片（这一站的门头短片），字幕在短片上，听、说；说完这一站就算走过，回到手帐盖上邮戳
let CUR = null;
window.bsOpenPlace = function(n, R){ const {bpPlan, Z, esc, LEARN_ZH} = A, S = bpPlan(R).stops || [], s = S[n]; if (!s) return false;
  if (s.k === "ty" && window.TYOU){ const [i, k] = s.key.split("|"), P = A.blPlace(i, k); return !!window.TYOU.open(i, k, (P.e || "") + " " + (P.n || ""), s.step); }   // 🧭 五步：直接进那个话题的下一步
  const d = stopData(s, n), c = clipOf(d.i, d.k); if (!c || !c.src || !d.say) return false;   // 没有短片或字幕的站，照原来的走
  CUR = {n, st: s, i: d.i, k: d.k, tgt: d.say};
  let P = document.getElementById("bsPlace"); if (!P){ P = document.createElement("div"); P.id = "bsPlace"; P.dataset.nopy = ""; document.body.appendChild(P); }
  const top = d.kind === "port" ? (d.city || "") + (d.npc ? " · " + d.npc + " " + Z("在等你") : "") : d.kind === "rv" ? Z("复习") + " · " + d.te : d.isle + " · " + d.t;
  P.className = ""; P.innerHTML = `<img class="bg" src="${esc(c.poster || d.img || "")}" alt=""><video src="${esc(c.src)}" poster="${esc(c.poster || "")}" muted loop playsinline autoplay></video><div class="shade"></div>
    <button class="back" data-bsback>‹ ${Z("回到手帐")}</button><div class="where">${esc(d.where)}</div>
    <div class="words"><div class="tp">NO.${n + 1}${d.te && d.kind !== "rv" ? " · " + esc(d.te) : ""}</div><div class="ti">${esc(top)}</div><p class="say${LEARN_ZH ? " zh" : ""}">${esc(d.say)}</p>${d.nat ? `<div class="nat">${esc(d.nat)}</div>` : ""}${d.W.length ? `<div class="tg">${d.W.map(w=>`<span>${esc(w)}</span>`).join("")}</div>` : ""}<div class="heard" id="bsHeard"></div></div>
    <div class="ctl"><button class="rnd" data-bslisten aria-label="listen"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg></button>
      <button class="rnd mic" id="bsMic" data-bsmic aria-label="say"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3"/></svg></button>
      <button class="more" data-bsmore>${Z("再练")} ›</button></div>
    <div class="others" id="bsOthers"></div><div class="sheet" id="bsSheet"></div>`;
  CUR.d = d; requestAnimationFrame(()=>P.classList.add("on")); loadVoices(d); return true; };
// 🎙️ 别人怎么说（2026-11-06，样板：样板/别人怎么说样板.html；后台：后台/linevoices.sql）
// 同一个主题、同一种语言的真人声音排成一排：母语的、各国口音的（法国人的英语、印度人的英语……）。没有就老实说「还没有人送出」，不造假。
// 说完在学的语言那一句（同时录下来），再请你用母语说一遍；最后自己选「送给世界」（存进 docs 的 linevoices）或「只留给自己」（只存在这台手机上）。
const LNAME = {zh: ["中文", "Chinese"], en: ["英语", "English"], es: ["西班牙语", "Spanish"], ja: ["日语", "Japanese"], ar: ["阿拉伯语", "Arabic"], fr: ["法语", "French"]};
const LOC = {zh: "zh-CN", en: "en-US", es: "es-ES", ja: "ja-JP", ar: "ar-SA", fr: "fr-FR"};
const lname = c => (LNAME[c] || [c, c])[A.UI === "zh" ? 0 : 1];
const tgtL = () => A.LEARN_ZH ? "zh" : (A.LEARN || "en"), natL = () => A.UI;   // 界面语言当作母语
const logged = () => { try { return !!(A.tkLogged && A.tkLogged()); } catch(e){ return false; } };
const myId = () => (A.SOC && A.SOC.uid) || "";
const VC = {}, COLS = ["#2d5a46", "#3a4f8a", "#b5523b", "#8a2f22", "#6b5a2e", "#3d6a7a"];
const repGet = () => { try { return JSON.parse(localStorage.getItem("bj.vrep") || "[]"); } catch(e){ return []; } };
const vLabel = v => v.nat === v.l ? (A.UI === "zh" ? lname(v.l) + "母语" : "Native " + lname(v.l)) : (A.UI === "zh" ? lname(v.nat) + "母语的人" : lname(v.nat) + " speaker");
async function loadVoices(d){ const key = d.i + "|" + d.k;
  if (!VC[key]){ let L = []; try { const sb = A.hv && A.hv.sb; if (sb){ const r = await sb.from("docs").select("id,owner,data").eq("coll", "linevoices").eq("data->>i", d.i).eq("data->>k", d.k).order("created_at", {ascending: false}).limit(60); L = (r.data || []).filter(x=>x.data && x.data.hid !== true).map(x=>({id: x.id, owner: x.owner, ...x.data})); } } catch(e){} VC[key] = L; }
  drawVoices(d); }
function drawVoices(d, fresh){ const box = document.getElementById("bsOthers"); if (!box || !CUR) return; const {Z, esc} = A, key = d.i + "|" + d.k, l = tgtL(), me = myId(), hid = repGet();
  const L = (VC[key] || []).filter(v=>v.l === l && !hid.includes(v.id)).slice(0, 12);
  const chips = L.map((v, j)=>{ const mine = me && (v.owner === me || v.author === me); return `<span class="vc${mine ? " me" : ""}${fresh === v.id ? " new" : ""}"><button class="v" data-bsv="${esc(v.id)}"><span class="av" style="background:${mine ? "#c9a45c" : COLS[j % COLS.length]}">${esc((mine ? Z("你") : (v.nm || "?")).slice(0, 1))}</span><span><b>${esc(mine ? Z("你") : (v.nm || "?"))}</b><small>${esc(vLabel(v))}</small></span></button><button class="vx" data-bsvx aria-label="more">⋯</button><span class="va">${mine ? `<button data-bsvdel="${esc(v.id)}">${Z("删除")}</button>` : `<button data-bsvrep="${esc(v.id)}">${Z("举报")}</button>`}</span></span>`; }).join("");
  box.innerHTML = `<h4>Other voices<span>${Z("同一句，别人怎么说")}</span></h4><div class="row">${chips || `<span class="vnone">${Z("还没有人送出这一句，你可以做第一个。")}</span>`}</div>`;
  if (fresh){ const r = box.querySelector(".row"); if (r) r.scrollLeft = 0; } }
const b64url = v => { if (v._u) return v._u; if (v.url) return v.url; try { const b = atob(v.a), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); v._u = URL.createObjectURL(new Blob([u], {type: v.mime || "audio/webm"})); } catch(e){ v._u = ""; } return v._u; };
let AUD = null;
function playUrl(u, el){ try { if (AUD){ AUD.pause(); AUD = null; } document.querySelectorAll("#bsPlace .vc.play").forEach(x=>x.classList.remove("play")); if (!u) return; AUD = new Audio(u); if (el) el.classList.add("play"); AUD.onended = AUD.onerror = () => el && el.classList.remove("play"); AUD.play().catch(()=>el && el.classList.remove("play")); } catch(e){} }
const toB64 = b => new Promise((ok, no)=>{ const f = new FileReader(); f.onload = ()=>ok(String(f.result).split(",")[1] || ""); f.onerror = no; f.readAsDataURL(b); });
// 录一段：点一下开始，再点一下结束；说完停 1.6 秒或到 12 秒自己停
let REC = null;
async function recOnce(lang, onText, onDone){ if (!A.canRec || !A.recStart) return false; let tm = null, auto = null, done = false;
  const fin = v => { if (done) return; done = true; clearTimeout(tm); clearTimeout(auto); REC = null; onDone(v); };
  REC = await A.recStart({lang: LOC[lang] || lang, onText: t=>{ onText(t); clearTimeout(tm); if (t) tm = setTimeout(()=>REC && REC.stop(), 1600); }, onDone: v=>fin(v), onError: ()=>fin(null)});
  if (!REC){ fin(null); return false; } auto = setTimeout(()=>REC && REC.stop(), 12000); return true; }
const sheet = () => document.getElementById("bsSheet");
const micSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3"/></svg>`;
function askNative(){ const S = sheet(); if (!S || !CUR) return; const {Z, esc} = A, d = CUR.d, zh = A.UI === "zh";
  if (natL() === tgtL() || !d.nat){ askSend(); return; }
  S.innerHTML = `<div class="k">Say it in your language</div><h3>${Z("用你的母语，说这一句")}</h3><p>${zh ? `学${lname(natL())}的人会听到你的声音。` : `People learning ${lname(natL())} will hear your voice. `}${Z("用你平时会说的话就好，不用照着念。")}</p>
    <div class="line">${esc(d.nat)}</div><div class="live" id="bsLive"></div>
    <div class="acts"><button class="skip" data-bsskip>${Z("这次不用")}</button><button class="smic" id="bsSmic" data-bssmic aria-label="say">${micSvg}</button><span style="min-width:60px"></span></div>`;
  S.classList.add("on"); }
function askSend(){ const S = sheet(); if (!S || !CUR) return; const {Z, esc} = A, d = CUR.d, both = CUR.tv && CUR.nv;
  if (!CUR.tv && !CUR.nv){ S.classList.remove("on"); return; }
  const item = (v, lab, txt, n) => v ? `<button class="mine" data-bsmine="${n}">${lab}<b>${esc(txt)}</b></button>` : "";
  S.innerHTML = `<div class="k">Before you send</div><h3>${both ? Z("这两句，送给世界吗？") : Z("这一句，送给世界吗？")}</h3><p>${Z("先存在你的手帐里。公开以后，学这句话的人能听到；随时可以删，只有声音，不露脸。")}</p>
    <div class="two">${item(CUR.tv, Z("你说的") + " · " + lname(tgtL()), CUR.tv && (CUR.tv.text || d.say), "t")}${item(CUR.nv, Z("你说的") + " · " + lname(natL()), CUR.nv && (CUR.nv.text || d.nat), "n")}</div>
    ${logged() ? "" : `<div class="note">${Z("登录以后才能送给世界。")}</div>`}
    <div class="acts"><button class="btn pri" data-bssend${logged() ? "" : " disabled"}>${Z("送给世界")}</button><button class="btn sec" data-bskeep>${Z("只留给自己")}</button></div>`;
  S.classList.add("on"); }
async function sendVoices(){ const S = sheet(); if (!CUR || !logged()) return; const {Z} = A, d = CUR.d, key = d.i + "|" + d.k, h = document.getElementById("bsHeard"); let last = null;
  const one = async (v, kind, l, txt) => { if (!v || !v.blob) return; const url = window.HVAudio ? await HVAudio.up(v.blob) : null, a = url ? "" : await toB64(v.blob); if (!url && a.length > 140000) return;   // 录音放进文件存储（后台/voicefiles.sql）
    const doc = {author: myId(), nm: (A.myName && A.myName()) || "", i: d.i, k: d.k, kind, l, nat: natL(), t: (txt || "").slice(0, 300), heard: (v.text || "").slice(0, 300), mime: v.blob.type || "audio/webm", dur: v.dur || 0, ...(url ? {url} : {a}), ts: Date.now()};
    const ref = A.SOC.db.collection("linevoices").doc(); await ref.set(doc); last = ref.id; (VC[key] || (VC[key] = [])).unshift({id: ref.id, owner: myId(), ...doc, _u: v.url}); };
  try { await one(CUR.tv, "t", tgtL(), d.say); await one(CUR.nv, "n", natL(), d.nat); } catch(e){}
  if (last) try { window.hvPx && window.hvPx({k: "gift", i: d.i, th: d.k, u: d.i + "|" + d.k, say: (d.say || "").slice(0, 200), to: "world", from: "boat"}); } catch(e){}
  if (S) S.classList.remove("on"); if (h) h.textContent = last ? Z("✓ 已经送给世界") : Z("没录上，再点一下试试"); drawVoices(d, last); }
function keepVoices(){ const S = sheet(); if (!CUR) return; const d = CUR.d, h = document.getElementById("bsHeard");
  (async () => { try { const L = JSON.parse(localStorage.getItem("bj.myvoices") || "[]"); for (const [v, kind, l] of [[CUR.tv, "t", tgtL()], [CUR.nv, "n", natL()]]) if (v && v.blob){ const a = await toB64(v.blob); L.push({i: d.i, k: d.k, kind, l, t: v.text || "", mime: v.blob.type, a, ts: Date.now()}); } localStorage.setItem("bj.myvoices", JSON.stringify(L.slice(-10))); } catch(e){} })();
  try { window.hvPx && window.hvPx({k: "gift", i: d.i, th: d.k, u: d.i + "|" + d.k, say: (d.say || "").slice(0, 200), to: "me", from: "boat"}); } catch(e){}
  if (S) S.classList.remove("on"); if (h) h.textContent = A.Z("✓ 存在你的手帐里了"); }
const ttsSay = t => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = A.LEARN_ZH ? "zh-CN" : "en-US"; u.rate = .88; speechSynthesis.speak(u); } catch(e){} };
function said(heard){ const P = document.getElementById("bsPlace"); if (!P || !CUR) return; const {Z, esc, blGet, blSet, blDay, boatLog} = A, h = document.getElementById("bsHeard");
  h.innerHTML = heard ? `${Z("听到了：")}${esc(heard)}` : Z("✓ 说出来了"); h.classList.add("on");
  document.getElementById("bsMic").classList.add("done"); P.querySelector("[data-bsback]").classList.add("ready");
  const {st, i, k, tgt} = CUR;
  try { if (st.k === "rv"){ const L = blGet(), d = blDay(); L.rev = L.rev || {}; st.keys.forEach(x=>{ L.rev[x] = d; }); blSet(L); }
    else boatLog(i, k, e=>{ e.bps = (e.bps || []).concat(tgt).slice(-5); if (st.k === "port") e.go = 1; }); } catch(e){} }
function closePlace(then){ const P = document.getElementById("bsPlace"); try { speechSynthesis.cancel(); } catch(e){} try { if (REC) REC.stop(); } catch(e){} playUrl(""); if (P){ P.classList.remove("on"); setTimeout(()=>{ if (!P.classList.contains("on")) P.innerHTML = ""; }, 500); } CUR = null; if (then) then(); }
document.addEventListener("click", e=>{ const P = document.getElementById("bsPlace"); if (!P || !P.contains(e.target) || !CUR) return;
  if (e.target.closest("[data-bsback]")){ closePlace(()=>A.bpOpen && A.bpOpen()); return; }
  if (e.target.closest("[data-bslisten]")){ ttsSay(CUR.tgt); return; }
  if (e.target.closest("[data-bsmore]")){ const n = CUR.n; closePlace(()=>{ A.bpOpen && A.bpOpen(); A.bpRun && A.bpRun(n); }); return; }
  const vb = e.target.closest("[data-bsv]"); if (vb){ const d = CUR.d, v = (VC[d.i + "|" + d.k] || []).find(x=>x.id === vb.dataset.bsv); if (v) playUrl(b64url(v), vb.closest(".vc")); return; }
  if (e.target.closest("[data-bsvx]")){ document.querySelectorAll("#bsPlace .vc.menu").forEach(x=>x.classList.remove("menu")); e.target.closest(".vc").classList.add("menu"); return; }
  const rp = e.target.closest("[data-bsvrep]"); if (rp){ const id = rp.dataset.bsvrep; try { const L = repGet(); L.push(id); localStorage.setItem("bj.vrep", JSON.stringify(L)); } catch(e){} try { if (logged()) A.SOC.db.collection("reports").add({by: myId(), target: "linevoices/" + id, ts: Date.now()}); } catch(e){} drawVoices(CUR.d); return; }
  const dl = e.target.closest("[data-bsvdel]"); if (dl){ const id = dl.dataset.bsvdel, d = CUR.d, key = d.i + "|" + d.k; (async () => { try { await A.SOC.db.doc("linevoices/" + id).delete(); VC[key] = (VC[key] || []).filter(x=>x.id !== id); } catch(e){} drawVoices(d); })(); return; }
  if (e.target.closest("[data-bsskip]")){ askSend(); return; }
  if (e.target.closest("[data-bssend]")){ sendVoices(); return; }
  if (e.target.closest("[data-bskeep]")){ keepVoices(); return; }
  const mn = e.target.closest("[data-bsmine]"); if (mn){ const v = mn.dataset.bsmine === "t" ? CUR.tv : CUR.nv; if (v) playUrl(v.url, null); return; }
  if (e.target.closest("[data-bssmic]")){ const m = document.getElementById("bsSmic"), lv = document.getElementById("bsLive"); if (REC){ REC.stop(); return; } if (m.classList.contains("on")) return; m.classList.add("on"); lv.textContent = A.Z("在听……说完再点一下");
    recOnce(natL(), t=>{ lv.textContent = t; }, v=>{ m.classList.remove("on"); if (!v){ lv.textContent = A.Z("没录上，再点一下试试"); return; } CUR.nv = v; askSend(); }).then(ok=>{ if (!ok){ m.classList.remove("on"); askSend(); } }); return; }
  if (e.target.closest("[data-bsmic]")){ const h = document.getElementById("bsHeard"), m = document.getElementById("bsMic"); if (REC){ REC.stop(); return; } if (m.classList.contains("done") || m.classList.contains("on")) return;
    const old = () => { const ok = A.micListen && A.micListen({lang: LOC[tgtL()], out: h, onFinal: alts=>{ said(alts[0]); setTimeout(askNative, 1100); }, onError: ()=>{}, onEnd: ()=>{}}); if (!ok){ h.textContent = A.Z("跟着说一遍就好"); said(""); } };
    if (!A.canRec){ old(); return; }
    m.classList.add("on"); h.textContent = A.Z("在听……说完再点一下");
    recOnce(tgtL(), t=>{ h.textContent = t; }, v=>{ m.classList.remove("on"); if (!v){ h.textContent = A.Z("没录上，再点一下试试"); return; } CUR.tv = v; said(v.text); setTimeout(askNative, 1100); }).then(ok=>{ if (!ok){ m.classList.remove("on"); old(); } }); } });
// 点照片或那一句：画面从照片里放大成全屏，再做这一站要做的事
window.bsEnter = function(btn, then){ const e = btn.closest(".bj-e"), img = (e && e.querySelector(".bj-pol img")) || btn.querySelector("img");
  if (!img || !img.src || matchMedia("(prefers-reduced-motion:reduce)").matches){ then(); return; }
  const r = img.getBoundingClientRect(), p = document.createElement("div"); p.className = "bj-portal"; p.style.backgroundImage = `url("${img.src}")`;
  Object.assign(p.style, {left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px"}); document.body.appendChild(p); p.getBoundingClientRect();
  requestAnimationFrame(()=>Object.assign(p.style, {left: 0, top: 0, width: "100vw", height: "100vh"}));
  setTimeout(()=>{ then(); setTimeout(()=>{ p.style.opacity = 0; setTimeout(()=>p.remove(), 450); }, 300); }, 900); };
})();

