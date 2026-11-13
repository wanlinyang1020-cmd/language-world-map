/* map_lines.js */
// 〰️ 地图上的线（2026-11-13 用户「可以，放进软件」；样板 样板/地图上的线样板.html）
// 点一张贴纸，它跟世界的线沿着地图划出去（颜色 = 线的种类）；点一条线两头并排；「去那一头」镜头顺着弧线飞过去；每张贴纸下面「🎤 说一句」，跟世界的网同一个框、同一套回应，存进 hv.mylang.v1。
// 贴纸是样板里挑的 115 张真贴纸（卡通画）；线来自 window.WORLD_NET。整页在 Shadow DOM 里。主地图的贴纸卡上多一行（cardRow），点了到这儿。
// 对外 window.MAPL = {open(o), hide(), isOpen(), back(), route(), cardRow(贴纸)}；o = {g: "s:贴纸名", line, say: 1}
(function(){
"use strict";
const ZH = () => (document.documentElement.lang || "zh").slice(0, 2) === "zh";
const LEARN = () => (window.HVI && window.HVI.LEARN) || window.HV_LEARN || "en";
const UT = (zh, en) => window.HVML ? window.HVML.tr(zh, en, ZH() ? "zh" : "en") : (ZH() ? zh : en);
const esc0 = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* ---------- 贴纸：从地图源文件里取的一小部分真贴纸（名字、坐标、卡通画） ---------- */
const STK = [{"n":"硅谷","en":"Silicon Valley","de":"Home to Apple, Google and other tech firms; \"silicon\" is what chips are made of.","e":"💻","p":[-122.08,37.39],"t":2,"c":"I","w":"美国 · 加利福尼亚 · 硅谷","d":"苹果、谷歌等科技公司的总部，“硅”来自芯片的材料。","a":"th_076.webp","cc":"#4b5563"},
{"n":"华特·迪士尼","en":"Walt Disney","de":"Created Mickey Mouse and opened the first Disneyland in 1955.","e":"🐭","p":[-118.32,34.15],"t":3,"c":"P","w":"美国 · 加利福尼亚 · 伯班克","d":"创造了米老鼠，1955年开了第一座迪士尼乐园。","a":"us31.webp","cc":"#8a55f2"},
{"n":"《哪吒之魔童闹海》","en":"Ne Zha 2","de":"China's biggest home-grown box-office hit of recent years (2025). Original title: 哪吒之魔童闹海. Animation: Nezha and Ao Bing's new adventure; box office about 15.46 billion yuan.","e":"🎬","p":[109.212,34.181],"t":2,"c":"V","w":"中国","d":"中国近年最卖座的本国电影（2025）。原名 哪吒之魔童闹海。动画片，哪吒与敖丙的新冒险，票房约154.6亿元","a":"th_225.webp","cc":"#d6336c"},
{"n":"宫崎骏","en":"Hayao Miyazaki","de":"Director of Spirited Away and My Neighbor Totoro; the Ghibli Museum is in Mitaka, Tokyo.","e":"✏️","p":[139.57,35.7],"t":3,"c":"P","w":"日本 · 东京","d":"《千与千寻》《龙猫》的导演，吉卜力美术馆在东京三鹰。","cc":"#8a55f2"},
{"n":"英式下午茶","en":"Afternoon tea","de":"Started by the Duchess of Bedford in the 19th century: scones with cream and jam.","e":"🫖","p":[-0.18,51.49],"t":4,"c":"D","w":"英国 · 伦敦","d":"19世纪由贝德福德公爵夫人开创，司康饼配奶油和果酱。","a":"uk06.webp","cc":"#b0306a"},
{"n":"珍珠奶茶","en":"Bubble tea","de":"Born in Taichung in the 1980s, now loved worldwide.","e":"🧋","p":[120.68,24.14],"t":3,"c":"D","w":"台中","d":"1980年代起源于台中，如今风靡全世界。","a":"cn181.webp","cc":"#b0306a"},
{"n":"秘鲁土豆","en":"Peruvian potatoes","de":"The birthplace of the potato; Peru has over 3,000 varieties.","e":"🥔","p":[-70,-15],"t":3,"c":"F","w":"秘鲁 · 安第斯山","d":"土豆的故乡，秘鲁有三千多个土豆品种。","a":"am_090.webp","cc":"#e9a400"},
{"n":"玉米的故乡","en":"Birthplace of maize","de":"Mexicans domesticated maize 9,000 years ago.","e":"🌽","p":[-97.5,17.5],"t":3,"c":"F","w":"墨西哥","d":"九千年前墨西哥人驯化了玉米。","a":"am_032.webp","cc":"#e9a400"},
{"n":"比利时巧克力","en":"Belgian chocolate","de":"The filled chocolate praline was invented in Brussels.","e":"🍫","p":[4.35,50.85],"t":2,"c":"F","w":"比利时 · 布鲁塞尔","d":"夹心巧克力就是在布鲁塞尔发明的。","a":"eu_054.webp","cc":"#e9a400"},
{"n":"麻婆豆腐","en":"Mapo tofu","de":"Numbing, spicy, hot, fragrant, crisp, tender and fresh: the signature Sichuan dish.","e":"🌶️","p":[104.08,30.68],"t":4,"c":"F","w":"中国 · 四川 · 成都","d":"麻、辣、烫、香、酥、嫩、鲜，川菜的代表。","cc":"#e9a400"},
{"n":"龙井茶","en":"Longjing tea","de":"A famous Chinese green tea; leaves picked before the Qingming festival are the most precious.","e":"🍵","p":[120.12,30.22],"t":3,"c":"D","w":"中国 · 浙江 · 杭州","d":"中国名茶，清明前采的“明前茶”最珍贵。","a":"cn67.webp","cc":"#b0306a"},
{"n":"大吉岭红茶","en":"Darjeeling tea","de":"Called \"the champagne of teas\".","e":"🍵","p":[88.26,27.04],"t":3,"c":"D","w":"印度 · 西孟加拉 · 大吉岭","d":"被称为“红茶中的香槟”。","a":"as_070.webp","cc":"#b0306a"},
{"n":"埃塞俄比亚咖啡","en":"Ethiopian coffee","de":"The birthplace of coffee: legend says a goatherd noticed his goats got lively after eating coffee cherries.","e":"☕","p":[38.74,9.03],"t":2,"c":"D","w":"埃塞俄比亚 · 亚的斯亚贝巴","d":"咖啡的故乡，传说牧羊人发现山羊吃了咖啡果后特别兴奋。","a":"af_010.webp","cc":"#b0306a"},
{"n":"寿司","en":"Sushi","de":"The tuna auction at Tokyo's Toyosu Market starts early in the morning on market days.","e":"🍣","p":[139.77,35.66],"t":2,"c":"F","w":"日本 · 东京","d":"东京丰洲市场的金枪鱼拍卖在营业日的清晨开始。","a":"as_001.webp","cc":"#e9a400"},
{"n":"塔可","en":"Tacos","de":"A corn tortilla wrapped around grilled meat, onion and coriander.","e":"🌮","p":[-99.13,19.43],"t":2,"c":"F","w":"墨西哥 · 墨西哥城","d":"玉米饼卷上烤肉、洋葱和香菜。","a":"am_028.webp","cc":"#e9a400"},
{"n":"星巴克","en":"Starbucks","de":"The first store opened next to Seattle's Pike Place Market in 1971.","e":"☕","p":[-122.34,47.61],"t":3,"c":"B","w":"美国 · 华盛顿州 · 西雅图","d":"1971年第一家店开在西雅图派克市场旁边。","cc":"#00a3a3"},
{"n":"瑞幸","en":"Luckin Coffee","de":"Based in Xiamen. App ordering and low prices took it past Starbucks China in store numbers; it opened in New York in 2025.","e":"☕","p":[118.09,24.48],"t":3,"c":"B","w":"中国 · 福建 · 厦门","d":"总部在厦门，靠手机点单和便宜的价格，店的数量超过了星巴克中国，2025年开到了纽约。","cc":"#00a3a3"},
{"n":"麦当劳","en":"McDonald's","de":"Headquartered in Chicago and selling burgers in over 100 countries — every country's menu is a little different.","e":"🍔","p":[-87.653,41.885],"t":3,"c":"B","w":"美国 · 芝加哥","d":"总部在芝加哥。在100多个国家卖汉堡，每个国家菜单都不一样。","a":"L:am_184.webp","cc":"#00a3a3"},
{"n":"肯德基","en":"KFC","de":"Colonel Sanders began selling fried chicken at a roadside restaurant in Kentucky, then spread worldwide.","e":"🍗","p":[-84.1,36.95],"t":3,"c":"F","w":"美国 · 肯塔基 · 科尔宾","d":"桑德斯上校在肯塔基的路边餐馆开始卖炸鸡，后来开遍全世界。","a":"us77.webp","cc":"#e9a400"},
{"n":"蜜雪冰城","en":"Mixue","de":"It has more shops than McDonald's — one of the biggest food brands in the world by store count. An ice cream costs a few yuan.","e":"🍦","p":[113.62,34.75],"t":3,"c":"B","w":"中国 · 河南 · 郑州","d":"门店数量超过麦当劳，是全世界店最多的餐饮品牌之一，一支冰淇淋几块钱。","cc":"#00a3a3"},
{"n":"加纳可可","en":"Ghanaian cocoa","de":"The world's second-largest cocoa producer; your chocolate may come from here.","e":"🍫","p":[-1.6,6.7],"t":3,"c":"F","w":"加纳 · 库马西","d":"世界第二大可可生产国，你吃的巧克力可能就来自这里。","a":"af_030.webp","cc":"#e9a400"},
{"n":"丝绸","en":"Silk","de":"The Chinese were the first to raise silkworms and reel silk; the Silk Road is named after it.","e":"🧣","p":[120.2,30.3],"t":3,"c":"B","w":"中国 · 浙江 · 杭州","d":"中国人最早养蚕缫丝，丝绸之路就是因它得名。","a":"cn2_048.webp","cc":"#00a3a3"},
{"n":"可可·香奈儿","en":"Coco Chanel","de":"Creator of the little black dress and Chanel No. 5, who changed how women dress.","e":"👗","p":[2.33,48.868],"t":4,"c":"P","w":"法国 · 巴黎","d":"小黑裙和香奈儿5号香水的创造者，改变了女性的穿衣方式。","a":"fr10.webp","cc":"#8a55f2"},
{"n":"米兰时装周","en":"Milan Fashion Week","de":"One of the world's four big fashion weeks; Prada and Armani both come from Milan.","e":"👠","p":[9.2,45.47],"t":4,"c":"I","w":"意大利 · 米兰","d":"世界四大时装周之一，普拉达、阿玛尼都来自米兰。","a":"it_2581303.webp","cc":"#4b5563"},
{"n":"双十一","en":"Singles' Day (11.11)","de":"A shopping festival started by Alibaba in 2009 on 11 November, now one of the biggest online shopping days in the world.","e":"📦","p":[120.03,30.28],"t":3,"c":"T1","w":"中国 · 杭州","d":"2009 年由阿里巴巴开始的 11 月 11 日购物节，现在是全世界最大的网购日之一。","cc":"#0b7fab"},
{"n":"肯特布","en":"Kente cloth","de":"Colourful striped cloth hand-woven by the Ashanti; every pattern has a meaning.","e":"🧣","p":[-1.62,6.69],"t":3,"c":"A","w":"加纳 · 库马西","d":"阿散蒂人手工织的彩色条纹布，每种花纹都有含义。","a":"af_094.webp","cc":"#ff4a87"},
{"n":"优衣库银座店","en":"Uniqlo Ginza","de":"Uniqlo's Ginza flagship has 12 floors; its basics are sold from here to the whole world.","e":"👕","p":[139.765,35.672],"t":3,"c":"T1","w":"日本 · 东京","d":"优衣库的银座旗舰店有 12 层，基本款从这里卖到全世界。","cc":"#0b7fab"},
{"n":"宝莱坞","en":"Bollywood","de":"One of the most productive film industries in the world; song and dance are a must.","e":"🎥","p":[72.88,19.08],"t":2,"c":"A","w":"印度 · 马哈拉施特拉 · 孟买","d":"世界上产量最高的电影工业之一，电影里少不了歌舞。","a":"as_062.webp","cc":"#ff4a87"},
{"n":"戛纳电影节","en":"Cannes Film Festival","de":"One of the world's three great film festivals; the top prize is the Palme d'Or.","e":"🎬","p":[7.02,43.55],"t":3,"c":"A","w":"法国 · 戛纳","d":"世界三大电影节之一，最高奖是“金棕榈奖”。","a":"fr22.webp","cc":"#ff4a87"},
{"n":"李小龙","en":"Bruce Lee","de":"Founder of Jeet Kune Do, who made \"kung fu\" an English word.","e":"🐉","p":[114.15,22.28],"t":4,"c":"P","w":"中国 · 香港","d":"截拳道创始人，让“Kung Fu”成为英语单词。","cc":"#8a55f2"},
{"n":"诺莱坞","en":"Nollywood","de":"Nigeria makes more films than almost any country, earning the name \"Nollywood\".","e":"🎬","p":[3.38,6.52],"t":3,"c":"A","w":"尼日利亚 · 拉各斯","d":"尼日利亚电影产量排在世界前列，被称为“诺莱坞”。","a":"af_034.webp","cc":"#ff4a87"},
{"n":"Linux 的故乡","en":"Linux's home town","de":"In August 1991, 21-year-old University of Helsinki student Linus Torvalds posted online that he was making a free operating system, \"just a hobby, won't be big and professional\". That was Linux. Thirty-five years later most of the world's servers, supercomputers and Android phones run on it. Written together by thousands of volunteers and companies worldwide, it's the most famous example of the open-source spirit.","e":"🐧","p":[24.9384,60.1699],"t":2,"c":"W2","w":"芬兰 · 赫尔辛基","d":"1991 年 8 月，21 岁的赫尔辛基大学学生 Linus Torvalds 在网上发帖说，他在做一个免费的操作系统，“只是个爱好，不会很大很专业”。这就是 Linux。三十五年后，世界上大多数服务器、超级计算机，还有安卓手机，都运行在 Linux 上。它由全世界成千上万的志愿者和公司一起写，是开源精神最有名的例子。","a":"L:logo_tux.webp","cc":"#3b5bdb"},
{"n":"DeepSeek","en":"DeepSeek","de":"DeepSeek was founded in Hangzhou in 2023. In January 2025 its reasoning model R1 came close to the best US models at a far lower training cost, and its weights were released for anyone to download. When the news spread, US AI chipmaker Nvidia's shares plunged in a single day. In April 2026 it released the V4 series. DeepSeek made \"open-weight models\" a topic programmers everywhere talk about.","e":"🐋","p":[120.155,30.274],"t":2,"c":"W2","w":"中国 · 浙江 · 杭州","d":"DeepSeek（深度求索）2023 年在杭州成立。2025 年 1 月，它发布的推理模型 R1 效果接近美国最强的模型，训练成本却低得多，而且把模型权重公开给所有人下载。消息传开后，美国 AI 芯片公司英伟达的股价一天大跌。2026 年 4 月，它又发布了 V4 系列。DeepSeek 让“开源模型”成了全世界程序员都在讨论的话题。","a":"L:logo_deepseek.webp","cc":"#3b5bdb"},
{"n":"华强北电子","en":"Huaqiangbei electronics","de":"One of the world's biggest electronic parts markets; you can buy any phone component here.","e":"🔌","p":[114.08,22.55],"t":3,"c":"I","w":"中国 · 广东 · 深圳","d":"世界最大的电子元器件市场之一，手机零件在这里都能买到。","a":"th_047.webp","cc":"#4b5563"},
{"n":"番茄","e":"🍅","p":[-75,-9.2],"t":3,"c":"F","w":"秘鲁","d":"野生番茄长在南美安第斯山；墨西哥人最早种来吃。","a":"food_14.webp","cc":"#e9a400"},
{"n":"《鱿鱼游戏》","en":"Squid Game","de":"The Korean drama Squid Game's first season is Netflix's most-watched series ever, and its third and final season came out in June 2025. For many people around the world it was the first foreign-language show they watched with subtitles.","e":"🦑","p":[127,37.56],"t":3,"c":"T1","w":"韩国 · 首尔","d":"韩剧《鱿鱼游戏》第一季是 Netflix 看的人最多的剧，第三季也是最后一季在 2025 年 6 月上线。全世界很多人为了它第一次看带字幕的外语剧。","cc":"#0b7fab"},
{"n":"秋叶原","en":"Akihabara","de":"Paradise for anime, games and electronics.","e":"🎮","p":[139.77,35.7],"t":4,"c":"A","w":"日本 · 东京","d":"动漫、游戏和电器的天堂。","a":"as_004.webp","cc":"#ff4a87"},
{"n":"涩谷十字路口","en":"Shibuya Crossing","de":"One of the world's busiest crossings; when the light turns green, a thousand people cross at once.","e":"🚦","p":[139.7,35.66],"t":4,"c":"A","w":"日本 · 东京","d":"世界最繁忙的路口之一，绿灯时上千人同时过马路。","a":"as_003.webp","cc":"#ff4a87"},
{"n":"东京塔","en":"Tokyo Tower","de":"A red-and-white tower modelled on the Eiffel Tower, 333 m tall.","e":"🗼","p":[139.75,35.66],"t":3,"c":"L","w":"日本 · 东京","d":"参照埃菲尔铁塔设计的红白铁塔，高333米。","cc":"#ff7a3d"},
{"n":"埃菲尔铁塔","en":"Eiffel Tower","de":"Built for the 1889 Paris World's Fair, 330 m tall; first called \"ugly\", now the symbol of France.","e":"🗼","p":[2.29,48.86],"t":1,"c":"L","w":"法国 · 巴黎","d":"1889年为巴黎世博会建成，高330米，最初被批评“丑陋”，如今是法国的象征。","a":"fr00.webp","cc":"#ff7a3d"},
{"n":"大本钟","en":"Big Ben","de":"The clock tower of London's Houses of Parliament, chiming since 1859.","e":"🕰️","p":[-0.12,51.5],"t":1,"c":"L","w":"英国 · 伦敦","d":"伦敦国会大厦的钟楼，钟声从1859年响到今天。","a":"uk00.webp","cc":"#ff7a3d"},
{"n":"自由女神像","en":"Statue of Liberty","de":"A gift from France to the United States in 1886, 93 m tall.","e":"🗽","p":[-74.04,40.69],"t":1,"c":"L","w":"美国 · 纽约","d":"1886年法国赠送给美国的礼物，高93米。","a":"us00.webp","cc":"#ff7a3d"},
{"n":"故宫","en":"Forbidden City","de":"The palace of the Ming and Qing emperors, with over 9,000 rooms, the largest wooden palace complex in the world.","e":"🏯","p":[116.39,39.92],"t":2,"c":"L","w":"中国 · 北京","d":"明清两代的皇宫，有9000多间房屋，是世界上最大的木结构宫殿群。","a":"cn04.webp","cc":"#ff7a3d"},
{"n":"东方明珠","en":"Oriental Pearl Tower","de":"A 468 m TV tower that forms Shanghai's skyline together with the Lujiazui skyscrapers.","e":"🗼","p":[121.5,31.24],"t":2,"c":"L","w":"中国 · 上海","d":"高468米的电视塔，和陆家嘴摩天大楼一起组成上海天际线。","cc":"#ff7a3d"},
{"n":"金门大桥","en":"Golden Gate Bridge","de":"An orange-red suspension bridge that often appears and disappears in the fog.","e":"🌉","p":[-122.48,37.82],"t":2,"c":"L","w":"美国 · 加利福尼亚 · 旧金山","d":"橘红色的悬索桥，常常在雾里若隐若现。","a":"us33.webp","cc":"#ff7a3d"},
{"n":"泰姬陵","en":"Taj Mahal","de":"A white marble tomb a Mughal emperor built in memory of his beloved wife.","e":"🕌","p":[78.04,27.17],"t":1,"c":"L","w":"印度 · 北方邦 · 阿格拉","d":"莫卧儿皇帝为纪念爱妻建造的白色大理石陵墓。","a":"as_059.webp","cc":"#ff7a3d"},
{"n":"罗马斗兽场","en":"Colosseum","de":"Built in AD 80, it held 50,000 spectators watching gladiators.","e":"🏛️","p":[12.49,41.89],"t":1,"c":"L","w":"意大利 · 罗马","d":"建于公元80年，可容纳5万名观众观看角斗士比赛。","a":"it_309629.webp","cc":"#ff7a3d"},
{"n":"外滩","en":"The Bund","de":"Dozens of old buildings in different styles along the Huangpu River, called a \"museum of world architecture\".","e":"🌃","p":[121.49,31.24],"t":3,"c":"L","w":"中国 · 上海","d":"黄浦江边几十幢不同风格的老建筑，被称为“万国建筑博览群”。","cc":"#ff7a3d"},
{"n":"鸟巢","en":"Bird's Nest stadium","de":"The main stadium of the 2008 Beijing Olympics, its steel frame like a giant bird's nest.","e":"🏟️","p":[116.39,39.99],"t":4,"c":"S","w":"中国 · 北京","d":"2008年北京奥运会主体育场，钢结构像一个巨大的鸟窝。","a":"cn2_010.webp","cc":"#1f7ae0"},
{"n":"伦敦眼","en":"London Eye","de":"A 135 m Ferris wheel on the Thames; one turn takes about 30 minutes.","e":"🎡","p":[-0.12,51.503],"t":4,"c":"L","w":"英国 · 伦敦","d":"泰晤士河边高135米的摩天轮，转一圈约30分钟。","cc":"#ff7a3d"},
{"n":"帝国大厦","en":"Empire State Building","de":"Completed in 1931, the building King Kong climbed in the film.","e":"🏙️","p":[-73.986,40.748],"t":4,"c":"L","w":"美国 · 纽约","d":"1931年建成，电影《金刚》里大猩猩爬的就是它。","a":"us01.webp","cc":"#ff7a3d"},
{"n":"米兰大教堂","en":"Milan Cathedral","de":"A Gothic cathedral with over 3,000 statues on its roof.","e":"⛪","p":[9.19,45.46],"t":3,"c":"L","w":"意大利 · 米兰","d":"哥特式大教堂，屋顶上有三千多座雕像。","cc":"#ff7a3d"},
{"n":"勃兰登堡门","en":"Brandenburg Gate","de":"The symbol of Berlin, witness to the building and fall of the Berlin Wall.","e":"🏛️","p":[13.38,52.52],"t":2,"c":"L","w":"德国 · 柏林","d":"柏林的象征，见证了柏林墙的建立与倒塌。","a":"eu_043.webp","cc":"#ff7a3d"},
{"n":"好莱坞","en":"Hollywood","de":"The centre of the world's film industry, with over 2,000 stars on the Walk of Fame.","e":"🎬","p":[-118.33,34.1],"t":1,"c":"A","w":"美国 · 加利福尼亚 · 洛杉矶","d":"世界电影工业中心，星光大道上有两千多颗星。","a":"us30.webp","cc":"#ff4a87"},
{"n":"本帮菜馆","en":"Shanghai home-style restaurant","de":"Local Shanghai cooking, rich and sweet-savoury: braised pork, fried river shrimp, bamboo shoot soup, hairy crab in autumn, plus Shanghai-style Western dishes like borscht and fried pork chop. You can say: \"What's your signature dish?\"","e":"🥢","p":[121.4783,31.2349],"t":2,"c":"F","w":"中国 · 上海 · 福州路","d":"上海本地菜，浓油赤酱：红烧肉、油爆虾、腌笃鲜，秋天还有大闸蟹；海派西餐的罗宋汤、炸猪排也算上海味道。可以说：“有什么招牌菜？”","a":"cn53.webp","cc":"#e9a400"},
{"n":"少林寺","en":"Shaolin Temple","de":"\"All kung fu under heaven comes from Shaolin\"; the temple is more than 1,500 years old.","e":"🥋","p":[112.95,34.5],"t":2,"c":"A","w":"中国 · 河南 · 登封","d":"“天下功夫出少林”，少林寺已有1500多年历史。","a":"cn91.webp","cc":"#ff4a87"},
{"n":"新干线","en":"Shinkansen","de":"Opened in 1964 as the world's first high-speed railway, famous for decades of near-perfect punctuality.","e":"🚄","p":[137,35.2],"t":2,"c":"B","w":"日本","d":"1964年开通的世界第一条高速铁路，几十年来准点率极高。","a":"L:logo_jr_central.webp","cc":"#00a3a3"},
{"n":"越南河粉","en":"Pho","de":"Rice noodles in clear broth with sliced beef and fresh herbs: breakfast in Hanoi.","e":"🍜","p":[105.85,21.03],"t":2,"c":"F","w":"越南 · 河内","d":"清汤米粉配牛肉片和香草，是河内人的早餐。","a":"as_039.webp","cc":"#e9a400"},
{"n":"印度咖喱","en":"Indian curry","de":"Every region of India has its own spice mix; South India loves adding coconut milk.","e":"🍛","p":[77,13],"t":2,"c":"F","w":"印度","d":"印度每个地区都有自己的香料配方，南印度喜欢加椰奶。","a":"as_061.webp","cc":"#e9a400"},
{"n":"健力士黑啤","en":"Guinness","de":"Born in Dublin in 1759; the brewery signed a 9,000-year lease.","e":"🍺","p":[-6.26,53.35],"t":2,"c":"D","w":"爱尔兰 · 都柏林","d":"1759年诞生于都柏林，酒厂租约签了9000年。","a":"eu_016.webp","cc":"#b0306a"},
{"n":"弗拉明戈","en":"Flamenco","de":"Andalusian art that blends singing, guitar and stamping footwork.","e":"💃","p":[-5.98,37.39],"t":2,"c":"A","w":"西班牙 · 塞维利亚","d":"融合歌唱、吉他和踢踏舞步的安达卢西亚艺术。","a":"eu_027.webp","cc":"#ff4a87"},
{"n":"AI 写代码","en":"AI writes code","de":"In February 2025 AI researcher Andrej Karpathy coined \"vibe coding\": you tell an AI what you want in plain words, it writes the code, and you can almost \"forget the code exists\". The phrase spread worldwide and was Collins Dictionary's Word of the Year 2025. San Francisco is packed with AI companies, AI coding tools keep getting stronger, and many firms say they're hiring fewer junior programmers; others say being able to read and check AI-written code matters more than ever.","e":"🤖","p":[-122.405,37.778],"t":2,"c":"W2","w":"美国 · 旧金山","d":"2025 年 2 月，AI 研究者 Andrej Karpathy 发明了一个词：vibe coding（氛围编程）——你用普通的话告诉 AI 想要什么，它帮你写代码，你甚至可以“忘了代码的存在”。这个词火遍全球，被柯林斯词典选为 2025 年度词汇。旧金山聚集了很多做 AI 的公司，AI 写代码的工具越来越强，很多公司说新招的初级程序员变少了；也有人说，会读懂、检查 AI 写的代码，比以前更重要。","a":"th_404.webp","cc":"#3b5bdb"},
{"n":"日本缺程序员","en":"Japan's programmer shortage","de":"Japan's Ministry of Economy, Trade and Industry estimated in 2019 that by 2030 Japan could be short of up to 790,000 IT workers. An ageing population, lots of legacy systems (some firms still use fax) and too few young programmers mean more companies hire foreign engineers, and JICA helps Bangladeshi engineers work in regional Japanese cities. Many foreign engineers say the tech isn't hard; Japanese and Japanese-style meetings are.","e":"🗾","p":[139.767,35.681],"t":2,"c":"W2","w":"日本 · 东京","d":"日本经济产业省 2019 年估计：到 2030 年，日本可能缺最多 79 万名 IT 人才。人口老龄化、老系统太多（有的公司还在用传真），年轻程序员又不够，所以越来越多公司招外国工程师，日本国际协力机构（JICA）也帮孟加拉国的工程师到日本地方城市工作。很多外国工程师说，技术不难，难的是日语和日本的开会方式。","a":"th_405.webp","cc":"#3b5bdb"},
{"n":"Y Combinator","en":"Y Combinator","de":"Founded in 2005, Y Combinator (YC) is the world's best-known startup accelerator. It takes four batches a year, invests $500,000 in each company, and spends three months helping founders build a product and find users, ending with Demo Day for investors. Airbnb, Stripe and Dropbox all came from YC. Applications are huge and only about 1% get in. YC's most famous advice is simple: make something people want, and talk to your users.","e":"🟧","p":[-122.389,37.758],"t":2,"c":"W3","w":"美国 · 旧金山","d":"Y Combinator（YC）2005 年成立，是世界上最有名的创业孵化器。它每年招四批公司，每家投 50 万美元，用三个月帮创始人把产品做出来、找到用户，最后在“路演日”见投资人。Airbnb、Stripe、Dropbox 都是从这里出来的。申请的人很多，录取率大约只有百分之一。YC 最有名的建议很简单：做人们真正想要的东西，多和用户聊。","a":"L:logo_ycombinator.webp","cc":"#e8590c"},
{"n":"Moniepoint","en":"Moniepoint","de":"In Nigeria many small shops and stalls used to take only cash. Moniepoint started in 2015 with card terminals and accounts so small businesses could take cards, transfers and savings. In October 2024 it raised $110 million (with Google's Africa Investment Fund among investors), valuing it at over $1 billion, one of Africa's \"unicorns\". It processes over a billion transactions a month, is Nigeria's largest merchant payments company, and is profitable.","e":"🏪","p":[3.376,6.509],"t":2,"c":"W3","w":"尼日利亚 · 拉各斯","d":"在尼日利亚，很多小店和摊主以前只收现金。Moniepoint 2015 年开始做收款机和账户服务，让小商家能刷卡、转账、存钱。2024 年 10 月，它拿到 1.1 亿美元融资（投资人里有谷歌的非洲投资基金），估值超过 10 亿美元，成了非洲的“独角兽”之一。它每月处理超过十亿笔交易，已经是尼日利亚最大的商户收款公司，而且是盈利的。","a":"L:logo_moniepoint.webp","cc":"#e8590c"},
{"n":"Grab","en":"Grab","de":"In 2012 two Harvard Business School classmates launched the ride-hailing app MyTeksi in Malaysia; it became Grab and moved its headquarters to Singapore. Starting with rides, it added food delivery, parcels, payments and loans, becoming an everyday \"super app\" in eight Southeast Asian countries. It listed on Nasdaq in 2021. It also raised new problems: thousands of drivers and riders depend on it, and commissions and protections are constant points of dispute.","e":"🛺","p":[103.787,1.299],"t":2,"c":"W3","w":"新加坡","d":"2012 年，两位哈佛商学院的同学在马来西亚推出了打车 App MyTeksi，后来改名 Grab，总部搬到新加坡。它从打车开始，加了外卖、送货、支付和贷款，在东南亚八个国家成了很多人每天都用的“超级 App”。2021 年它在美国纳斯达克上市。它也带来了新问题：成千上万的司机和骑手靠它谋生，抽成和保障一直是争论的焦点。","a":"L:logo_grab.webp","cc":"#e8590c"},
{"n":"Labubu 盲盒","en":"Labubu blind boxes","de":"Labubu is a little elf drawn by Hong Kong artist Kasing Lung and sold by Beijing's Pop Mart as a \"blind box\": you don't know which one you'll get until you open it. In 2025 it went global: celebrities hung them on their bags, people queued overnight in Thailand and the US, and Pop Mart said it sold over 100 million that year. By 2026 the craze was cooling, and many designs were selling below retail on the resale market.","e":"🧸","p":[116.48,39.99],"t":2,"c":"K1","w":"中国 · 北京 · 泡泡玛特","d":"Labubu 是香港艺术家龙家升画的小精灵，由北京的泡泡玛特做成“盲盒”：买之前不知道会抽到哪一款。2025 年它火遍全球，明星挂在包上，泰国、美国的人通宵排队，泡泡玛特说那一年卖出了一亿多个。到 2026 年，热度开始降温，二手市场上很多款已经跌到原价以下。","a":"th_408.webp","cc":"#e64980"},
{"n":"平替官司","en":"The dupe lawsuit","de":"A \"dupe\" looks like a big-brand item but costs far less, and dupes are huge on TikTok. In June 2025 Vancouver-based yoga brand Lululemon sued US warehouse store Costco, saying several of its jackets and trousers copied Lululemon designs. In 2026 the two settled over most of the products. Many young people say buying dupes is smart; brands say it's stealing designs.","e":"👖","p":[-123.1,49.27],"t":2,"c":"K1","w":"加拿大 · 温哥华 · Lululemon","d":"“平替”（dupe）就是长得很像大牌、价格便宜很多的东西，在 TikTok 上特别火。2025 年 6 月，总部在温哥华的瑜伽服品牌 Lululemon 起诉美国大卖场 Costco，说它卖的几款外套和裤子抄袭了自己的设计。2026 年，双方就大部分产品达成和解。很多年轻人说买平替很聪明；品牌说这是在偷设计。","a":"th_410.webp","cc":"#e64980"},
{"n":"Pokémon GO 十周年","en":"Pokémon GO at ten","de":"In July 2016 San Francisco company Niantic launched Pokémon GO: catch Pokémon on real streets with your phone. That summer people everywhere went outside and parks filled with strangers. Ten years later, in 2026, \"2026 is the new 2016\" trended on social media: people posted old photos, songs and filters, nostalgic for a time when the internet felt fun and less anxious.","e":"🟡","p":[-122.4,37.79],"t":2,"c":"K1","w":"美国 · 旧金山 · Niantic","d":"2016 年 7 月，旧金山公司 Niantic 推出了 Pokémon GO：用手机在真实的街道上抓宝可梦。那个夏天，全世界的人走上街头，公园里挤满陌生人。十年后的 2026 年，社交媒体上流行“2026 就是新的 2016”：大家晒当年的照片、歌和滤镜，怀念一个“网络还很好玩、没那么焦虑”的年代。","a":"L:logo_pokemongo.webp","cc":"#e64980"},
{"n":"指南针","en":"The compass","de":"One of ancient China's Four Great Inventions, first called the \"south-pointer\", later guiding sailors on long voyages.","e":"🧭","p":[112.5,34.2],"t":3,"c":"B","w":"中国","d":"中国古代四大发明之一，最早叫“司南”，后来帮助航海家远航。","a":"cn2_001.webp","cc":"#00a3a3"},
{"n":"北京烤鸭","en":"Peking duck","de":"One duck is carved into over a hundred slices, wrapped in thin pancakes with spring onion and sweet bean sauce.","e":"🦆","p":[116.45,39.9],"t":3,"c":"F","w":"中国 · 北京","d":"一只鸭片成一百多片，用薄饼卷上葱丝和甜面酱。","a":"cn2_006.webp","cc":"#e9a400"},
{"n":"狗不理包子","en":"Goubuli buns","de":"Even pleats, thin skin, generous filling: a Tianjin brand over a hundred years old.","e":"🥟","p":[117.2,39.13],"t":3,"c":"F","w":"中国 · 天津","d":"褶子均匀、皮薄馅大，是天津有一百多年历史的老字号。","a":"cn15.webp","cc":"#e9a400"},
{"n":"小笼包","en":"Xiaolongbao","de":"Nanxiang soup dumplings have thin skin and lots of soup; bite a small hole and sip first.","e":"🥟","p":[121.32,31.29],"t":3,"c":"F","w":"中国 · 上海 · 南翔","d":"南翔小笼皮薄汁多，吃之前先咬个小口吸汤汁。","a":"cn47.webp","cc":"#e9a400"},
{"n":"苏超","en":"Su Chao (Jiangsu city football league)","de":"In 2025, 13 cities in Jiangsu each fielded a team in a city league nicknamed \"Su Chao\". Over 30,000 fans packed a single match, final tickets were won by just 1.2% of applicants, and cities teasing each other became half the fun. You can say: \"Which city are you supporting tonight?\"","e":"⚽","p":[118.73,32.01],"t":3,"c":"S","w":"中国 · 江苏 · 南京","d":"2025 年江苏 13 个城市各出一支队踢城市联赛，大家叫它“苏超”。单场最多 3 万多人到现场看，决赛门票中签率只有 1.2%，城市之间互相开玩笑也成了乐趣。可以说：“今晚苏超你支持哪个城市？”","a":"cn2_037.webp","cc":"#1f7ae0"},
{"n":"阳澄湖大闸蟹","en":"Yangcheng Lake hairy crab","de":"An autumn delicacy; the crab roe is richest in the ninth and tenth lunar months.","e":"🦀","p":[120.8,31.42],"t":3,"c":"F","w":"中国 · 江苏 · 苏州","d":"秋天的美味，“九月团脐十月尖”，蟹黄最肥。","a":"cn61.webp","cc":"#e9a400"},
{"n":"武夷山大红袍","en":"Wuyi Da Hong Pao tea","de":"The king of rock teas; its mother trees grow on a sheer cliff.","e":"🍵","p":[117.97,27.75],"t":3,"c":"D","w":"中国 · 福建 · 武夷山","d":"岩茶之王，母树长在悬崖峭壁上。","a":"cn77.webp","cc":"#b0306a"},
{"n":"龙门石窟","en":"Longmen Grottoes","de":"Over 100,000 Buddha statues on both banks of the Yi River; the great Vairocana Buddha is said to be modelled on Wu Zetian.","e":"🗿","p":[112.47,34.56],"t":3,"c":"A","w":"中国 · 河南 · 洛阳","d":"伊河两岸的十万多尊佛像，卢舍那大佛据说以武则天为原型。","a":"cn2_063.webp","cc":"#ff4a87"},
{"n":"广州早茶","en":"Cantonese morning tea","de":"\"One pot of tea, two dishes\": shrimp dumplings, siu mai and barbecue pork buns are musts.","e":"🫖","p":[113.26,23.13],"t":3,"c":"F","w":"中国 · 广东 · 广州","d":"“一盅两件”，虾饺、烧卖、叉烧包是必点。","a":"cn107.webp","cc":"#e9a400"},
{"n":"深圳无人机","en":"Shenzhen drones","de":"Shenzhen is the world centre for designing and making consumer drones.","e":"🚁","p":[114.06,22.54],"t":3,"c":"I","w":"中国 · 广东 · 深圳","d":"深圳是全球消费级无人机的研发和制造中心。","a":"th_011.webp","cc":"#4b5563"},
{"n":"三星堆","en":"Sanxingdui","de":"Mysterious bronze masks with protruding eyes, three to four thousand years old.","e":"🏺","p":[104.2,30.99],"t":3,"c":"A","w":"中国 · 四川 · 广汉","d":"神秘的青铜面具和纵目人像，距今三四千年。","a":"cn2_081.webp","cc":"#ff4a87"},
{"n":"相扑","en":"Sumo","de":"Japan's national sport; wrestlers often weigh over 150 kg.","e":"🤼","p":[139.79,35.7],"t":3,"c":"S","w":"日本 · 东京","d":"日本的国技，力士体重常常超过150公斤。","a":"as_005.webp","cc":"#1f7ae0"},
{"n":"任天堂","en":"Nintendo","de":"A Kyoto playing-card company from 1889 that later created Mario and Pokémon.","e":"🍄","p":[135.76,34.95],"t":3,"c":"B","w":"日本 · 京都","d":"1889年京都的纸牌公司，后来创造了马里奥和宝可梦游戏。","a":"L:as_289.webp","cc":"#00a3a3"},
{"n":"章鱼烧","en":"Takoyaki","de":"Balls of batter with chunks of octopus inside, Osaka street food.","e":"🐙","p":[135.5,34.67],"t":3,"c":"F","w":"日本 · 大阪","d":"圆圆的面糊球里包着章鱼块，大阪人的街头小吃。","a":"as_012.webp","cc":"#e9a400"},
{"n":"跆拳道","en":"Taekwondo","de":"Korea's national martial art, mostly kicks, and an Olympic sport.","e":"🥋","p":[127.5,36.6],"t":3,"c":"S","w":"韩国","d":"韩国的国技，以腿法为主，是奥运会正式项目。","a":"as_028.webp","cc":"#1f7ae0"},
{"n":"板球","en":"Cricket","de":"India's most popular sport; the whole country watches big matches.","e":"🏏","p":[72.82,18.94],"t":3,"c":"S","w":"印度 · 马哈拉施特拉 · 孟买","d":"印度最受欢迎的运动，大赛时全国都在看。","a":"as_063.webp","cc":"#1f7ae0"},
{"n":"卢浮宫","en":"The Louvre","de":"The world's most visited museum, home of the Mona Lisa, entered through I. M. Pei's glass pyramid.","e":"🖼️","p":[2.34,48.86],"t":3,"c":"A","w":"法国 · 巴黎","d":"世界上参观人数最多的博物馆，藏有《蒙娜丽莎》，入口是贝聿铭设计的玻璃金字塔。","a":"fr01.webp","cc":"#ff4a87"},
{"n":"法棍面包","en":"Baguette","de":"The French eat about ten billion baguettes a year; the craft is on UNESCO's heritage list.","e":"🥖","p":[2.36,48.85],"t":3,"c":"F","w":"法国 · 巴黎","d":"法国人每年吃掉约一百亿根法棍，制作工艺被列入联合国非遗。","a":"fr06.webp","cc":"#e9a400"},
{"n":"莫奈花园","en":"Monet's garden, Giverny","de":"Where the Impressionist Claude Monet painted his famous Water Lilies series.","e":"🎨","p":[1.53,49.08],"t":3,"c":"A","w":"法国 · 诺曼底 · 吉维尼","d":"印象派大师莫奈在这里画出了著名的《睡莲》系列。","a":"fr12.webp","cc":"#ff4a87"},
{"n":"牛顿","en":"Isaac Newton","de":"Said to have thought of gravity after watching an apple fall; he made many discoveries at Cambridge.","e":"🍎","p":[0.12,52.2],"t":3,"c":"P","w":"英国 · 剑桥","d":"据说被苹果启发想到万有引力，他在剑桥大学完成了许多发现。","a":"uk10.webp","cc":"#8a55f2"},
{"n":"牛津大学","en":"University of Oxford","de":"The oldest university in the English-speaking world; Harry Potter's dining hall was filmed here.","e":"🎓","p":[-1.26,51.75],"t":3,"c":"A","w":"英国 · 牛津","d":"英语世界最古老的大学，《哈利·波特》的食堂在这里取景。","a":"uk11.webp","cc":"#ff4a87"},
{"n":"德国香肠","en":"German sausages","de":"Germany has over 1,500 kinds of sausage; Thuringian bratwurst and currywurst are the most famous.","e":"🌭","p":[10,51],"t":3,"c":"F","w":"德国","d":"德国有超过1500种香肠，图林根烤肠和咖喱香肠最出名。","a":"eu_049.webp","cc":"#e9a400"},
{"n":"爱迪生","en":"Thomas Edison","de":"Invented a practical light bulb and the phonograph, with over a thousand patents.","e":"💡","p":[-74.33,40.78],"t":3,"c":"P","w":"美国 · 新泽西 · 门洛帕克","d":"发明了实用的电灯泡和留声机，一生有上千项专利。","a":"us12.webp","cc":"#8a55f2"},
{"n":"龙舌兰酒","en":"Tequila","de":"Made from the heart of the agave plant, named after the town of Tequila.","e":"🍸","p":[-103.8,20.88],"t":3,"c":"D","w":"墨西哥 · 哈利斯科 · 特基拉","d":"用龙舌兰植物的心酿造，名字来自小镇特基拉。","a":"am_033.webp","cc":"#b0306a"},
{"n":"流浪乐队","en":"Mariachi","de":"Street bands in silver-trimmed suits and wide-brimmed sombreros: mariachi.","e":"🎺","p":[-103.35,20.67],"t":3,"c":"A","w":"墨西哥 · 哈利斯科 · 瓜达拉哈拉","d":"穿镶银边礼服、戴宽边帽的街头乐队。","a":"am_034.webp","cc":"#ff4a87"},
{"n":"义乌小商品","en":"Yiwu small commodities","de":"The world's largest small-goods market, with over 70,000 shops; most Christmas decorations come from here.","e":"🧸","p":[120.07,29.31],"t":3,"c":"I","w":"中国 · 浙江 · 义乌","d":"世界最大的小商品市场，商铺七万多个，圣诞装饰大多来自这里。","a":"th_048.webp","cc":"#4b5563"},
{"n":"新竹芯片","en":"Hsinchu chips","de":"Hsinchu Science Park is one of the world's most important chipmaking hubs.","e":"💾","p":[120.97,24.8],"t":3,"c":"I","w":"中国 · 台湾 · 新竹","d":"新竹科学园是全球最重要的芯片制造基地之一。","a":"th_057.webp","cc":"#4b5563"},
{"n":"韩国半导体","en":"Korean semiconductors","de":"Much of the memory in phones and computers is made here.","e":"💾","p":[127.06,37.2],"t":3,"c":"I","w":"韩国 · 京畿道","d":"手机和电脑里的存储芯片很多产自这里。","a":"th_060.webp","cc":"#4b5563"},
{"n":"新加坡港","en":"Port of Singapore","de":"One of the world's busiest ports, with over a thousand ships a day.","e":"🚢","p":[103.8,1.26],"t":3,"c":"I","w":"新加坡","d":"世界上最繁忙的港口之一，每天上千艘船进出。","a":"th_049.webp","cc":"#4b5563"},
{"n":"伦敦金融城","en":"City of London","de":"Only about a square mile, yet one of the world's top financial centres.","e":"💹","p":[-0.09,51.515],"t":3,"c":"I","w":"英国 · 伦敦","d":"只有约一平方英里大，却是世界顶级的金融中心。","a":"th_050.webp","cc":"#4b5563"},
{"n":"加纳黄金","en":"Ghanaian gold","de":"Ghana was once called the \"Gold Coast\" and is one of Africa's largest gold producers.","e":"🥇","p":[-1.67,6.2],"t":3,"c":"I","w":"加纳 · 奥布阿西","d":"加纳旧称“黄金海岸”，是非洲最大的产金国之一。","a":"th_089.webp","cc":"#4b5563"},
{"n":"苏炳添","en":"Su Bingtian","de":"Ran the 100 m in 9.83 at Tokyo 2020, the first Asian under 9.9 seconds.","e":"🏃","p":[113.38,22.52],"t":3,"c":"P","w":"中国 · 广东 · 中山","d":"2021年东京奥运会百米跑出9秒83，成为第一个跑进9秒9的亚洲人。","a":"cn186.webp","cc":"#8a55f2"},
{"n":"潘展乐","en":"Pan Zhanle","de":"Won the 100 m freestyle at Paris 2024 in a world-record 46.40.","e":"🏊","p":[120.7,28],"t":3,"c":"P","w":"中国 · 浙江 · 温州","d":"2024年巴黎奥运会100米自由泳以46秒40打破世界纪录夺金。","a":"cn193.webp","cc":"#8a55f2"},
{"n":"迪士尼乐园","en":"Disneyland","de":"The world's first Disneyland, opened in 1955, home of Sleeping Beauty Castle.","e":"🏰","p":[-117.92,33.81],"t":3,"c":"A","w":"美国 · 加利福尼亚 · 阿纳海姆","d":"1955年开放的世界第一座迪士尼乐园，睡美人城堡就在这里。","a":"us48.webp","cc":"#ff4a87"},
{"n":"波士顿倾茶事件","en":"Boston Tea Party","de":"In 1773 people dumped a shipload of tea into the harbour to protest Britain's tax, leading to the War of Independence.","e":"🫖","p":[-71.05,42.35],"t":3,"c":"A","w":"美国 · 马萨诸塞 · 波士顿","d":"1773年人们把一船茶叶倒进海里，反抗英国的茶税，后来引发了独立战争。","a":"us90.webp","cc":"#ff4a87"},
{"n":"桃太郎","en":"Momotarō","de":"The tale of the boy born from a peach who sets off with a dog, a monkey and a pheasant to fight ogres.","e":"🍑","p":[133.93,34.66],"t":3,"c":"A","w":"日本 · 冈山","d":"从桃子里生出的小男孩带着狗、猴子和雉鸡去打鬼的故事。","a":"as_252.webp","cc":"#ff4a87"},
{"n":"赞岐乌冬","en":"Sanuki udon","de":"Thick, chewy noodles; Kagawa is called the \"udon prefecture\".","e":"🍜","p":[134.04,34.34],"t":3,"c":"F","w":"日本 · 香川","d":"面条又粗又有弹性，香川被称为“乌冬县”。","a":"as_255.webp","cc":"#e9a400"},
{"n":"博多拉面","en":"Hakata ramen","de":"Creamy pork-bone broth with thin noodles; you can ask for them extra firm.","e":"🍜","p":[130.4,33.59],"t":3,"c":"F","w":"日本 · 福冈 · 博多","d":"浓白的猪骨汤配细面条，可以要求“面硬一点”。","a":"as_257.webp","cc":"#e9a400"},
{"n":"熊本熊","en":"Kumamon","de":"Kumamon, the red-cheeked black bear, Japan's most famous local mascot.","e":"🐻","p":[130.74,32.8],"t":3,"c":"A","w":"日本 · 熊本","d":"红脸蛋的黑熊吉祥物，是日本最有名的地方吉祥物。","a":"as_260.webp","cc":"#ff4a87"},
{"n":"戴森","en":"Dyson","de":"James Dyson built more than 5,000 prototypes before his bagless vacuum cleaner worked. Now it also makes hair dryers.","e":"🌀","p":[-2.1,51.58],"t":3,"c":"B","w":"英国 · 马姆斯伯里","d":"詹姆斯·戴森做了五千多个样品，才做出不用集尘袋的吸尘器。现在还做吹风机。","a":"L:eu_147.webp","cc":"#00a3a3"},
{"n":"阿迪达斯","en":"adidas","de":"Adi Dassler fell out with his brother Rudolf, who started Puma across the river in the same small town.","e":"👟","p":[10.886,49.57],"t":3,"c":"B","w":"德国 · 黑措根奥拉赫","d":"阿迪·达斯勒和哥哥鲁道夫吵翻了，哥哥在小镇河对岸开了彪马。","a":"L:eu_152.webp","cc":"#00a3a3"},
{"n":"彪马","en":"Puma","de":"Founded in 1948 by Rudolf Dassler in the same town as his brother's adidas — the town was once split into two sides.","e":"🐆","p":[10.876,49.565],"t":3,"c":"B","w":"德国 · 黑措根奥拉赫","d":"1948年鲁道夫·达斯勒创立，和弟弟的阿迪达斯在同一个小镇，镇上的人曾经分成两派。","a":"L:eu_153.webp","cc":"#00a3a3"},
{"n":"迪士尼","en":"Disney","de":"Mickey Mouse's company, based next to Los Angeles. Shanghai Disneyland opened in 2016.","e":"🏰","p":[-118.32,34.157],"t":3,"c":"B","w":"美国 · 加利福尼亚 · 伯班克","d":"米老鼠的公司，总部在洛杉矶旁边。上海迪士尼2016年开园。","a":"L:am_186.webp","cc":"#00a3a3"},
{"n":"西兰花","e":"🥦","p":[12.5,41.9],"t":3,"c":"F","w":"意大利","d":"西兰花是意大利人从野甘蓝一代代挑出来的，broccoli 就是意大利语。","a":"food_04.webp","cc":"#e9a400"},
{"n":"毛豆","e":"🫛","p":[139.7,35.7],"t":3,"c":"F","w":"日本","d":"毛豆就是没长老的黄豆；英文 edamame 来自日语。","a":"food_25.webp","cc":"#e9a400"},
{"n":"切达奶酪","e":"🧀","p":[-2.78,51.28],"t":3,"c":"F","w":"英国 · 萨默塞特 · 切达","d":"切达奶酪的名字来自英国萨默塞特的切达村。","a":"food_34.webp","cc":"#e9a400"}];
const STK_N = new Set(STK.map(s => s.n));
const MAPL_CSS = "\n:host{--paper:#fbf7ee;--ink:#14305c;--ink2:#3a4a66;--soft:#7a8296;--say:#e2552f;--sea:#e6edeb;--land:#e2e9c9;--landS:#adb98f;--line:rgba(20,48,92,.12);\n  --k-from:#9a6230;--k-learn:#c9971a;--k-make:#2f7d6d;--k-sell:#3a6fb8;--k-study:#7a4fb0;--k-like:#cf4f86;--stack:#e9963a}\n*{box-sizing:border-box}\n:host{margin:0;height:100%;background:var(--paper);color:var(--ink);font:15px/1.55 \"Noto Sans SC\",system-ui,sans-serif;overflow:hidden}\nbutton{font:inherit;color:inherit;cursor:pointer}\n.en-t{font-family:Georgia,\"Times New Roman\",serif}\n.zh-t{font-family:\"Noto Serif SC\",serif}\n\n/* 顶上一句：这页要的效果（给用户看的） */\n.goal{position:fixed;left:0;right:0;top:0;z-index:30;height:40px;display:flex;align-items:center;gap:10px;padding:0 16px;background:var(--ink);color:#f3ead6;font-size:13px}\n.goal b{font:600 13.5px \"Noto Serif SC\",serif;color:#fff;white-space:nowrap}\n.goal span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.goal button{margin-left:auto;flex:none;background:rgba(255,255,255,.12);border:0;border-radius:999px;padding:4px 12px;color:#fff;font-size:12.5px}\n\n/* 地图 */\n#mapwrap{position:fixed;left:0;right:400px;top:40px;bottom:0;background:var(--sea)}\n#map{display:block;width:100%;height:100%;touch-action:none;cursor:grab}\n#map.drag{cursor:grabbing}\n.land{fill:var(--land);stroke:var(--landS);stroke-width:.8;vector-effect:non-scaling-stroke}\n.land2{fill:#cdd8b4;opacity:.55}\n.border{fill:none;stroke:#cbd5ae;stroke-width:.5;vector-effect:non-scaling-stroke}\n.grat{fill:none;stroke:#cad6d4;stroke-width:.5;stroke-dasharray:2 4;vector-effect:non-scaling-stroke}\n.sealab{font:italic 15px Georgia,serif;fill:#9db0b4;letter-spacing:.32em;pointer-events:none}\n\n/* 贴纸 */\n.stk{cursor:pointer;transition:opacity .3s}\n.stk .bob{transition:transform .25s cubic-bezier(.3,1.6,.5,1)}\n.stk:hover .bob{transform:translateY(-3px) scale(1.08)}\n.stk .nm{font:600 11px \"Noto Serif SC\",Georgia,serif;fill:var(--ink);paint-order:stroke;stroke:#f8f4ea;stroke-width:3.4px;stroke-linejoin:round;pointer-events:none}\n.stk .card{fill:#fff;stroke:#d9d2bd;stroke-width:1}\n.stk .disc{fill:#fff;stroke-width:3}\n.stk .emo{font-size:21px;dominant-baseline:central;text-anchor:middle;pointer-events:none}\n.stk .cnt{font:700 10px \"Noto Sans SC\";fill:#fff;text-anchor:middle;pointer-events:none}\n.stk.dim{opacity:.28}\n.stk.nolab .nm{display:none}\n.stk.dim .nm,.city.dim text{display:none}\n.stk.focus .bob{transform:scale(1.22)}\n.stk.pop .bob{animation:pop .5s cubic-bezier(.3,1.7,.5,1)}\n@keyframes pop{0%{transform:scale(.8)}60%{transform:scale(1.35)}100%{transform:scale(1.22)}}\n.knot{pointer-events:none}\n.city{cursor:pointer}\n.city circle{fill:#fff;stroke:var(--ink);stroke-width:1.3}\n.city text{font:italic 11px Georgia,\"Noto Serif SC\",serif;fill:var(--ink2);paint-order:stroke;stroke:#eef2ea;stroke-width:3px}\n.city.dim{opacity:.3}\n.city.focus circle{fill:var(--ink)}\n\n/* 线 */\n.arc{fill:none;stroke-linecap:round;cursor:pointer}\n.arc.base{stroke-width:2.6;opacity:.9}\n.arc.hit{stroke:transparent;stroke-width:16}\n.arc.hl{stroke-width:4.6}\n.arc.faded{opacity:.18}\n.trail{fill:none;stroke:var(--ink);stroke-width:1.6;stroke-dasharray:1 5;stroke-linecap:round;opacity:.42}\n.flow{pointer-events:none}\n.tag{cursor:pointer}\n.tag rect{fill:#fff;stroke-width:1.5}\n.tag text{font:600 11px \"Noto Serif SC\",Georgia,serif;fill:var(--ink);pointer-events:none}\n.arclab{pointer-events:none}\n.arclab rect{fill:#fffdf7;stroke:var(--line)}\n.arclab text{font:12px Georgia,\"Noto Serif SC\",serif;fill:var(--ink)}\n.plane{pointer-events:none;font-size:18px}\n\n/* 安静的筛选 */\n.filters{position:absolute;left:12px;right:12px;top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;pointer-events:none}\n.filters .row{display:flex;gap:4px;background:rgba(251,247,238,.93);border:1px solid var(--line);border-radius:999px;padding:4px;pointer-events:auto;overflow-x:auto;scrollbar-width:none;max-width:100%}\n.filters .row::-webkit-scrollbar{display:none}\n.chip{border:0;background:none;border-radius:999px;padding:4px 10px;font-size:12px;color:var(--ink2);white-space:nowrap;display:flex;align-items:center;gap:5px}\n.chip i{width:8px;height:8px;border-radius:50%;display:inline-block}\n.chip.off{opacity:.38;text-decoration:line-through}\n.chip.on{background:var(--ink);color:#fff}\n.mapbtns{position:absolute;right:14px;bottom:18px;display:flex;flex-direction:column;gap:8px}\n.mapbtns button{background:rgba(251,247,238,.96);border:1px solid var(--line);border-radius:12px;width:40px;height:40px;font-size:17px;box-shadow:0 4px 14px rgba(20,40,60,.08)}\n.wander{position:absolute;left:14px;bottom:18px;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:9px 16px;font-size:13.5px;box-shadow:0 8px 20px rgba(20,48,92,.25)}\n\n/* 面板：桌面右边 / 手机底部抽屉 */\n#panel{position:fixed;right:0;top:40px;bottom:0;width:400px;background:var(--paper);border-left:1px solid var(--line);display:flex;flex-direction:column;z-index:10;box-shadow:-8px 0 26px rgba(20,40,60,.06)}\n.grab{display:none}\n.phead{display:flex;align-items:center;gap:8px;padding:12px 16px 10px;border-bottom:1px solid var(--line)}\n.back{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 12px;font-size:13px}\n.back[disabled]{opacity:.35;cursor:default}\n.trailtxt{flex:1;min-width:0;font-size:12px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:rtl;text-align:left}\n.lang{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 11px;font-size:12.5px}\n.pbody{flex:1;overflow-y:auto;padding:18px 18px 40px;scrollbar-width:thin}\n\n.kick{font:600 10.5px Georgia,serif;letter-spacing:.32em;text-transform:uppercase;color:#8f7a4c}\nh1{font:600 26px/1.2 Georgia,\"Noto Serif SC\",serif;margin:6px 0 4px}\n.lead{color:var(--ink2);font-size:14px;margin:0}\n.hero{display:flex;gap:14px;align-items:center}\n.hero .pic{width:74px;height:74px;flex:none;display:grid;place-items:center;border-radius:18px;background:#fff;border:1px solid var(--line);font-size:38px;overflow:hidden}\n.hero .pic img{width:64px;height:64px;object-fit:contain}\n.hero h2{margin:0;font:600 22px/1.2 \"Noto Serif SC\",serif}\n.hero .sub{font:15px Georgia,serif;color:var(--ink2)}\n.hero .where{font-size:12px;color:var(--soft)}\n.desc{margin:12px 0 0;font-size:13.5px;color:var(--ink2)}\n.kinds{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0 6px}\n.kinds span{font-size:12px;padding:3px 9px;border-radius:999px;background:#fff;border:1px solid var(--line);display:flex;align-items:center;gap:5px}\n.kinds i{width:8px;height:8px;border-radius:50%}\n.sec{font:600 12px Georgia,serif;letter-spacing:.18em;text-transform:uppercase;color:var(--soft);margin:18px 0 8px}\n\n.lrow{display:flex;gap:10px;padding:11px 12px;border-radius:14px;background:#fff;border:1px solid var(--line);margin-bottom:8px;cursor:pointer;transition:transform .15s,box-shadow .15s;position:relative}\n.lrow:hover,.lrow.hl{transform:translateX(-2px);box-shadow:0 6px 18px rgba(20,40,60,.08)}\n.lrow .bar{width:4px;border-radius:4px;flex:none}\n.lrow .top{display:flex;gap:6px;align-items:baseline;font-size:12px;color:var(--soft)}\n.lrow .top b{font:600 14px \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.lrow .tl{font:15px/1.5 \"Noto Serif SC\",serif;margin-top:3px}\n.lrow .tr{font-size:12.5px;color:var(--soft)}\n.lrow .been{position:absolute;right:10px;bottom:8px;background:#fff;font-size:10.5px;color:var(--soft);border:1px dashed #b9bfcc;border-radius:999px;padding:0 6px}\n.here{font-size:12px;color:var(--soft)}\nu.w{text-decoration:none;border-bottom:2px solid var(--say);cursor:pointer}\n\n/* 一条线：两头并排 */\n.pair{display:grid;grid-template-columns:1fr 34px 1fr;gap:6px;align-items:stretch;margin-top:12px}\n.end{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}\n.end .im{aspect-ratio:1/1;background:#f1ece0 center/cover;display:grid;place-items:center;font-size:44px;position:relative}\n.end .im img.art{width:72%;height:72%;object-fit:contain}\n.end .cr{position:absolute;left:0;right:0;bottom:0;font-size:9px;line-height:1.3;padding:3px 6px;background:linear-gradient(transparent,rgba(0,0,0,.55));color:#fff;text-align:right}\n.end .tx{padding:8px 10px 10px}\n.end .yr{font:600 11px Georgia,serif;color:var(--soft);letter-spacing:.06em}\n.end b{display:block;font:600 14.5px/1.3 \"Noto Serif SC\",serif}\n.end .en{font:12.5px Georgia,serif;color:var(--ink2)}\n.end p{margin:6px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.45}\n.mid{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:20px}\n.mid svg{display:block}\n.why{margin-top:12px;background:#fff;border-radius:16px;border:1px solid var(--line);padding:14px 14px 12px;position:relative}\n.why .badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#fff;border-radius:999px;padding:2px 10px}\n.why .say{font:17px/1.6 \"Noto Serif SC\",serif;margin:8px 0 2px}\n.why .say.enf{font-family:Georgia,serif}\n.why .tr{font-size:13px;color:var(--soft)}\n.why .src{font-size:11.5px;color:var(--soft);margin-top:8px}\n.spk{border:0;background:#fdeee8;color:var(--say);border-radius:999px;padding:3px 10px;font-size:12.5px;margin-left:6px;vertical-align:2px}\n.spk.on{animation:pulse 1s infinite}\n@keyframes pulse{50%{box-shadow:0 0 0 6px rgba(226,85,47,.15)}}\n.go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;border:0;background:var(--ink);color:#fff;border-radius:999px;padding:12px 16px;font:600 15px Georgia,\"Noto Serif SC\",serif;box-shadow:0 10px 22px rgba(20,48,92,.22)}\n.go:active{transform:scale(.98)}\n.ghost{display:block;width:100%;margin-top:8px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:9px;font-size:13.5px;color:var(--ink2)}\n\n/* 还没有线 */\n.empty{margin-top:16px;background:#fff;border:1.5px dashed #c8bfa6;border-radius:16px;padding:16px}\n.empty h3{margin:0 0 4px;font:600 16px Georgia,\"Noto Serif SC\",serif}\n.empty p{margin:0;font-size:13px;color:var(--ink2)}\n.form label{display:block;font-size:12px;color:var(--soft);margin:10px 0 4px}\n.form input,.form textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:14px \"Noto Sans SC\",sans-serif;background:var(--paper);color:var(--ink)}\n.form textarea{min-height:60px;resize:vertical}\n.sprout{margin-top:12px;background:#eef5e6;border-radius:12px;padding:10px 12px;font-size:13px;color:#2f5a2a}\n\n/* 首页 */\n.starts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}\n.start{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;cursor:pointer;display:flex;gap:8px;align-items:center}\n.start img,.start .e{width:38px;height:38px;object-fit:contain;flex:none;font-size:26px;display:grid;place-items:center}\n.start b{display:block;font:600 13px Georgia,\"Noto Serif SC\",serif;line-height:1.25}\n.start small{font-size:11.5px;color:var(--soft)}\n.legend{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;font-size:12.5px;color:var(--ink2)}\n.legend span{display:flex;gap:6px;align-items:center}\n.legend i{width:16px;height:3px;border-radius:3px}\n\n/* 盖章、彩纸、小回应 */\n.stamp{position:fixed;z-index:50;pointer-events:none;border:3px solid var(--say);color:var(--say);border-radius:12px;padding:6px 14px;font:700 15px Georgia,\"Noto Serif SC\",serif;letter-spacing:.08em;text-align:center;background:rgba(255,253,247,.9);transform:translate(-50%,-50%) rotate(-8deg) scale(2.2);opacity:0;animation:stamp 1.9s ease forwards}\n.stamp small{display:block;font:600 10.5px Georgia,serif;letter-spacing:.18em}\n@keyframes stamp{12%{opacity:1;transform:translate(-50%,-50%) rotate(-8deg) scale(1)}80%{opacity:1;transform:translate(-50%,-50%) rotate(-8deg) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) rotate(-8deg) scale(1)}}\n.conf{position:fixed;z-index:49;width:8px;height:12px;pointer-events:none;border-radius:2px}\n.toast{position:fixed;z-index:60;left:50%;bottom:28px;transform:translateX(-50%);background:var(--ink);color:#fff;border-radius:999px;padding:8px 16px;font-size:13px;opacity:0;transition:opacity .25s;pointer-events:none}\n.toast.on{opacity:1}\n.wpop{position:fixed;z-index:60;background:#fff;border:1px solid var(--line);border-radius:10px;padding:5px 10px;font-size:13px;box-shadow:0 8px 20px rgba(0,0,0,.12);transform:translate(-50%,-115%);pointer-events:none}\n\n/* 设计说明（给用户看的） */\n.notes{position:fixed;left:12px;top:52px;z-index:25;width:300px;max-height:calc(100vh - 70px);overflow:auto;background:#fffaf0;border:1px solid #e6d7b0;border-radius:16px;padding:14px 16px;font-size:13px;color:#4c4126;box-shadow:0 14px 34px rgba(0,0,0,.14);display:none}\n.notes.on{display:block}\n.notes h4{margin:0 0 6px;font:600 15px \"Noto Serif SC\",serif;color:#2e2610}\n.notes p{margin:6px 0}\n.notes b{color:#2e2610}\n.notes .x{float:right;border:0;background:none;color:#a08850;font-size:15px}\n\n/* 手机 */\n@media (max-width:700px){\n  .goal span{display:none}\n  #mapwrap{right:0;bottom:0}\n  #panel{left:0;right:0;width:auto;top:auto;bottom:0;height:var(--sheet,170px);border-left:0;border-top:1px solid var(--line);border-radius:20px 20px 0 0;box-shadow:0 -10px 30px rgba(20,40,60,.14);transition:height .3s cubic-bezier(.3,1,.4,1)}\n  #panel.dragging{transition:none}\n  .grab{display:block;padding:8px 0 2px;cursor:grab;touch-action:none}\n  .grab i{display:block;width:40px;height:5px;border-radius:5px;background:#cfc7b3;margin:0 auto}\n  .phead{padding:4px 14px 8px}\n  .pbody{padding:12px 16px 40px}\n  h1{font-size:21px}\n  .filters{top:8px;left:8px;right:8px}\n  .filters .row{flex-wrap:nowrap}\n  .wander,.mapbtns{bottom:calc(var(--sheet,170px) + 12px)}\n  #zin,#zout{display:none}\n  :host(.online) .wander{display:none}\n  .notes{left:8px;right:8px;width:auto}\n  .starts{grid-template-columns:1fr}\n}\n\n/* ===== 软件里 ===== */\n:host{position:fixed;inset:0;z-index:41;display:block}\n:host([hidden]){display:none}\n.goal{padding-top:env(safe-area-inset-top,0px);height:calc(40px + env(safe-area-inset-top,0px))}\n.goal .wnb{margin:0 4px 0 -6px;flex:none;background:rgba(255,255,255,.12);border:0;border-radius:999px;padding:4px 10px;color:#fff;font-size:12.5px}\n#notesBtn,.notes{display:none!important}\n#sayhost{position:fixed;inset:0;z-index:80;pointer-events:none}\n.stkw{position:fixed;inset:0;z-index:70}\n.stkveil{position:absolute;inset:0;background:rgba(20,30,50,.3);opacity:0;transition:opacity .25s}\n.stksheet{position:absolute;left:0;right:0;bottom:0;background:#fffdf7;border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(20,48,92,.2);padding:8px 16px calc(18px + env(safe-area-inset-bottom,0px));transform:translateY(105%);transition:transform .3s cubic-bezier(.3,.9,.3,1)}\n.stkw.on .stkveil{opacity:1}.stkw.on .stksheet{transform:none}\n.stkgrab{width:40px;height:5px;border-radius:5px;background:#cfc7b3;margin:0 auto 8px}\n.stksheet>b{font:600 17px \"Noto Serif SC\",Georgia,serif;color:var(--ink)}\n.stacklist{display:flex;flex-direction:column;gap:6px;margin-top:10px;max-height:52vh;overflow-y:auto}\n.stacklist button{border:0;background:#f6f0e2;border-radius:12px;padding:8px 12px;display:flex;gap:10px;align-items:center;font-weight:800;color:var(--ink);font-size:15px;text-align:left}\n.stacklist img{width:36px;height:36px;object-fit:contain}\n.stacklist small{display:block;font-weight:500;font-size:12px;color:var(--soft)}\n:host(.rtl) :is(p,div,span,b,small,button,h1,h2,h3,h4,a,em,i,u,label,textarea,input,text){unicode-bidi:plaintext}\n@media (min-width:701px){ .goal,#mapwrap{left:84px} }\n";
const SKEL = () => `<div id="root"><div class="goal"><button class="wnb" id="wnBack">‹ ${UT("世界", "World")}</button><b>${UT("地图上的线", "Lines on the map")}</b><span>${UT("点一张贴纸，它跟世界的线沿着地图划出去，想顺着哪条走就走哪条。", "Tap a sticker: its lines arc out across the map. Follow whichever you like.")}</span><a id="mylangBtn" href="#" style="margin-left:auto;flex:none;background:#e2552f;border-radius:999px;padding:4px 12px;color:#fff;font-size:12.5px;text-decoration:none;font-weight:700"></a><button id="notesBtn"></button></div>
<div id="mapwrap"><svg id="map"></svg><div class="filters"><div class="row" id="kindRow"></div><div class="row" id="fieldRow"></div></div><button class="wander" id="wander"></button><div class="mapbtns"><button id="zin" aria-label="zoom in">＋</button><button id="zout" aria-label="zoom out">－</button><button id="zhome" aria-label="whole world">🌍</button></div></div>
<aside id="panel"><div class="grab" id="grab"><i></i></div><div class="phead"><button class="back" id="back"></button><div class="trailtxt" id="trailtxt"></div><button class="lang" id="lang" hidden></button></div><div class="pbody" id="pbody"></div></aside><div id="sayhost"></div></div>`;
let HOST = null, SR = null, API = null, WANT = null, POLL = 0;
const ready = () => !!(window.WORLD_NET && window.HVML && window.d3 && window.topojson);
function shell(){ if (HOST) return; HOST = document.createElement("div"); HOST.id = "mlMap"; HOST.hidden = true; document.body.appendChild(HOST);
  SR = HOST.attachShadow({mode: "open"}); SR.innerHTML = `<style>${MAPL_CSS}</style><div style="display:flex;align-items:center;justify-content:center;height:100%;background:#fbf7ee;color:#8f7a4c;font:600 12px Georgia,serif;letter-spacing:.5em">HEYVOYO</div>`;
  if (!document.getElementById("maplCss")){ const s = document.createElement("style"); s.id = "maplCss"; s.textContent = "@media (max-width:700px){body.mapl-on #galTabs{display:none!important}}"; document.head.appendChild(s); } }
function boot(){ if (API) return; SR.innerHTML = `<style>${MAPL_CSS}${window.HVML.CSS}</style>` + SKEL(); API = run(SR, HOST, SR.getElementById("root")); }
function open(o){ shell(); if (window.hvPage) window.hvPage.show("map"); HOST.hidden = false; HOST.classList.toggle("rtl", document.documentElement.dir === "rtl"); document.body.classList.add("gal-on", "mapl-on"); WANT = o || {};
  if (ready()){ boot(); API.enter(WANT); return; }
  if (!POLL) POLL = setInterval(() => { if (!ready()) return; clearInterval(POLL); POLL = 0; boot(); if (!HOST.hidden) API.enter(WANT); }, 150); }
function hide(){ if (!HOST || HOST.hidden) return; HOST.hidden = true; document.body.classList.remove("mapl-on"); try { speechSynthesis.cancel(); } catch (e) {} }
/* 主地图的贴纸卡：这张贴纸在网上有线，就多一行「它连着世界的线 · 在这儿说一句」 */
function cardRow(d){ const n = d && (d.n || d); if (!n || !STK_N.has(n)) return "";
  return `<div class="mapl-row" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px"><button data-maplg="${esc0(n)}" style="border:0;border-radius:99px;padding:6px 12px;background:#14305c;color:#fff;font:700 12.5px/1.2 -apple-system,sans-serif;cursor:pointer">〰️ ${UT("它连着世界的线", "Its lines to the world")} →</button><button data-maplg="${esc0(n)}" data-maplsay="1" style="border:0;border-radius:99px;padding:6px 12px;background:#e2552f;color:#fff;font:700 12.5px/1.2 -apple-system,sans-serif;cursor:pointer">🎤 ${UT("在这儿说一句", "Say a line here")}</button></div>`; }
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-maplg]"); if (!b) return; e.preventDefault(); e.stopPropagation(); open({g: "s:" + b.dataset.maplg, say: b.dataset.maplsay ? 1 : 0}); }, true);
window.MAPL = {open, hide, isOpen: () => !!(HOST && !HOST.hidden), back: () => { if (API && API.back()) return; if (window.WNET) window.WNET.open({keep: 1}); else hide(); }, route: () => { const r = API ? API.route() : "map/lines"; if (r !== "map/lines" && WANT) WANT.g = null; return r === "map/lines" && WANT && WANT.g ? "map/lines/" + encodeURIComponent(WANT.g) : r; }, cardRow};   // 还在飞过去的时候，地址就先写上要去的那张贴纸（后退一步回到贴纸卡）
function run(SR, HOST, ROOT){
const HV = window.HVML;

/* ---------- 贴纸：从地图源文件里取的一小部分真贴纸（名字、坐标、卡通画） ---------- */
const ART = "https://heyvoyo.com/stk/";
/* 贴纸上的地点（STK.w）配英文：一段一段对 */
const W_EN = {"美国":"USA","加利福尼亚":"California","硅谷":"Silicon Valley","伯班克":"Burbank","中国":"China","日本":"Japan","东京":"Tokyo","英国":"UK","伦敦":"London","台湾":"Taiwan","台中":"Taichung","秘鲁":"Peru","安第斯山":"the Andes","墨西哥":"Mexico","比利时":"Belgium","布鲁塞尔":"Brussels","四川":"Sichuan","成都":"Chengdu","浙江":"Zhejiang","杭州":"Hangzhou","印度":"India","西孟加拉":"West Bengal","大吉岭":"Darjeeling","埃塞俄比亚":"Ethiopia","亚的斯亚贝巴":"Addis Ababa","墨西哥城":"Mexico City","华盛顿州":"Washington State","西雅图":"Seattle","福建":"Fujian","厦门":"Xiamen","芝加哥":"Chicago","肯塔基":"Kentucky","科尔宾":"Corbin","河南":"Henan","郑州":"Zhengzhou","加纳":"Ghana","库马西":"Kumasi","法国":"France","巴黎":"Paris","意大利":"Italy","米兰":"Milan","马哈拉施特拉":"Maharashtra","孟买":"Mumbai","戛纳":"Cannes","香港":"Hong Kong","尼日利亚":"Nigeria","拉各斯":"Lagos","芬兰":"Finland","赫尔辛基":"Helsinki","广东":"Guangdong","深圳":"Shenzhen","韩国":"South Korea","首尔":"Seoul","纽约":"New York","北京":"Beijing","上海":"Shanghai","旧金山":"San Francisco","北方邦":"Uttar Pradesh","阿格拉":"Agra","罗马":"Rome","德国":"Germany","柏林":"Berlin","洛杉矶":"Los Angeles","福州路":"Fuzhou Road","登封":"Dengfeng","越南":"Vietnam","河内":"Hanoi","爱尔兰":"Ireland","都柏林":"Dublin","西班牙":"Spain","塞维利亚":"Seville","新加坡":"Singapore","泡泡玛特":"Pop Mart","加拿大":"Canada","温哥华":"Vancouver","Lululemon":"Lululemon","Niantic":"Niantic","天津":"Tianjin","南翔":"Nanxiang","江苏":"Jiangsu","南京":"Nanjing","苏州":"Suzhou","武夷山":"Wuyi Mountains","洛阳":"Luoyang","广州":"Guangzhou","广汉":"Guanghan","京都":"Kyoto","大阪":"Osaka","诺曼底":"Normandy","吉维尼":"Giverny","剑桥":"Cambridge","牛津":"Oxford","新泽西":"New Jersey","门洛帕克":"Menlo Park","哈利斯科":"Jalisco","特基拉":"Tequila","瓜达拉哈拉":"Guadalajara","义乌":"Yiwu","新竹":"Hsinchu","京畿道":"Gyeonggi","奥布阿西":"Obuasi","中山":"Zhongshan","温州":"Wenzhou","阿纳海姆":"Anaheim","马萨诸塞":"Massachusetts","波士顿":"Boston","冈山":"Okayama","香川":"Kagawa","福冈":"Fukuoka","博多":"Hakata","熊本":"Kumamoto","马姆斯伯里":"Malmesbury","黑措根奥拉赫":"Herzogenaurach","萨默塞特":"Somerset","切达":"Cheddar"};
const wEn = w => String(w || "").split(" · ").map(x => W_EN[x] || x).join(" · ");
/* 名字一模一样、网里还没写 sticker 的点 */
const SAME_NAME = {walt:"华特·迪士尼", w_tomato:"番茄", e_squid:"《鱿鱼游戏》"};

const W = window.WORLD_NET, N = W.nodes, LINES = W.lines;
const KINDS = {
  from:{e:"🧬",en:"Comes from",zh:"从这儿来",c:"var(--k-from)",h:"#9a6230"},
  learn:{e:"💡",en:"Learned from",zh:"互相学",c:"var(--k-learn)",h:"#c9971a"},
  make:{e:"🔧",en:"Made together",zh:"一起做",c:"var(--k-make)",h:"#2f7d6d"},
  sell:{e:"🚚",en:"Sold there",zh:"卖到那儿",c:"var(--k-sell)",h:"#3a6fb8"},
  study:{e:"🎓",en:"Went to learn",zh:"去那儿学",c:"var(--k-study)",h:"#7a4fb0"},
  like:{e:"❤️",en:"Loved by",zh:"TA 喜欢",c:"var(--k-like)",h:"#cf4f86"}
};
Object.keys(KINDS).forEach(k => { if (HV.LT[k]) KINDS[k].en = HV.LT[k].en; });
const kindOf = l => KINDS[l.type] ? l.type : (KINDS[l.kind] ? l.kind : "make");

/* ---------- 界面文字 ---------- */
let UI = ZH() ? "zh" : "en";   // 界面：中文界面用中文那一份；别的都先用英文那一份（西日阿的翻译还没做）
const T = {
  en:{back:"← Back",lang:"中文",wander:"🎲 Wander",all:"All",home_k:"The world, by its lines",home_h:"Tap a sticker",home_p:"Its lines arc out across the map — where it came from, who learned from it, where it was sold. Pick any line and go.",starts:"Busy corners",legend:"What the colours mean",lines:n=>n===1?"1 line":n+" lines",here:"Right here",go:n=>"Go to "+n+" →",stay:"Stay here",src:"Source",none_h:"This one isn't linked yet",none_p:"Do you know where it connects to the rest of the world?",know:"🔗 I know a line",where:"Where does it lead? (a place, person or thing)",one:"One sentence: why is it worth going?",srcq:"Source (link, book or interview)",send:"Send for checking",sent:"🌱 Thanks! Your line will show on the map once it's checked.",trail0:"Your trail starts here",arrived:"ARRIVED",newfield:"NEW FIELD",listen:"🔊 Listen",to:"to",from:"from",thisone:"this sticker",empty_f:"No lines of this kind here — try another filter.",city:"City",photo:"Photo",yours:"You walked this",near:"Where it is",near_p:"Lines that start there",sayH:"Say one line here",sayB:"🎤 Say one line",sayP:"Arrived? Say something of your own about it — it goes into your language.",mine:"What you said here",mylang:"🌱 My language →",dead:"Only one line leads from here. Go on:",itsin:"It's in",askFar:f => "Elsewhere in " + f + ", someone is asking",asking:"Someone is asking here",wanderP:"Jump to a sticker with lots of lines"},
  zh:{back:"← 退回",lang:"EN",wander:"🎲 随便走走",all:"全部",home_k:"顺着线看世界",home_h:"点一张贴纸",home_p:"它的线会沿着地图划出去：从哪儿来、谁跟它学过、卖到了哪儿。挑一条，就过去。",starts:"线多的地方",legend:"颜色是什么线",lines:n=>n+" 条线",here:"就在这儿",go:n=>"去那一头 · "+n+" →",stay:"先留在这儿",src:"出处",none_h:"这张还没有连上线",none_p:"你知道它和哪里有关吗？",know:"🔗 我知道一条线",where:"连到哪儿？（一个地方、人或东西）",one:"一句话：为什么值得过去？",srcq:"出处（链接、书或访谈）",send:"交给我们核对",sent:"🌱 谢谢！核对过以后，这条线就会出现在地图上。",trail0:"你的路从这里开始",arrived:"到了",newfield:"新的领域",listen:"🔊 听",to:"到",from:"从",thisone:"这张贴纸",empty_f:"这里没有这种线，换个筛选看看。",city:"城市",photo:"照片",yours:"你走过",near:"它在哪儿",near_p:"从那儿出发的线",sayH:"在这儿说一句",sayB:"🎤 说一句",sayP:"到了？说一句你自己的话，软件会把它整理进你的语言。",mine:"你在这儿说过",mylang:"🌱 我的语言 →",dead:"这儿只有一条线。接着走：",itsin:"它在",askFar:f => "在" + f + "别的地方，有人在问",asking:"这儿有人在问",wanderP:"去一张线多的贴纸"}
};
const t = k => { const v = T[UI][k]; if (UI !== "zh" && typeof v === "string") HV.miss(T.zh[k], v); return v; };
/* 学中文：英文界面时，那一句用中文写；中文界面时反过来学英语 */
const TL = () => LEARN() === "zh" ? "zh" : "en";   // 在学的语言
const nm = o => o ? (UI === "en" ? (o.en || o.zh) : (o.zh || o.en)) : "";

/* ---------- 点和贴纸对起来 ---------- */
const S = {}; STK.forEach(s => { S[s.n] = s; s.nodes = []; });
const stkOfNode = id => { const n = N[id]; if (!n) return null; const k = n.sticker || SAME_NAME[id]; return k && S[k] ? k : null; };
Object.keys(N).forEach(id => { const k = stkOfNode(id); if (k) S[k].nodes.push(id); });
const nodePos = id => { const n = N[id]; if (!n) return null; if (n.ll) return [n.ll[1], n.ll[0]]; const a = n.at && N[n.at]; return a && a.ll ? [a.ll[1], a.ll[0]] : null; };
/* 一个「目标」= 一张贴纸，或者网上一个还不是贴纸的点 */
const tgtOf = id => { const k = stkOfNode(id); return k ? "s:" + k : "n:" + id; };
const TN = {};
/* 一座城 = 城自己 + 在城里、还不是贴纸的点 */
const tgtNodes = g => TN[g] || (TN[g] = g[0] === "s" ? S[g.slice(2)].nodes : (N[g.slice(2)].type === "place" ? [g.slice(2)].concat(Object.keys(N).filter(id => N[id].at === g.slice(2) && !stkOfNode(id))) : [g.slice(2)]));
/* 站在 g 上看一条线：哪头是这儿、另一头是谁、方向 */
const E = (l, g) => { const ids = tgtNodes(g), iF = ids.includes(l.from), iT = ids.includes(l.to), a = iF ? g : tgtOf(l.from), b = iT ? g : tgtOf(l.to); return {a, b, self: a === b, fwd: iF, other: iF ? b : a}; };
const tgtPos = g => g[0] === "s" ? S[g.slice(2)].p : nodePos(g.slice(2));
const tgtName = g => { if (g[0] === "s"){ const s = S[g.slice(2)]; return UI === "en" ? (s.en || s.n) : s.n; } return nm(N[g.slice(2)].name); };
const linesOf = g => { const ids = new Set(tgtNodes(g)); return LINES.filter(l => ids.has(l.from) || ids.has(l.to)); };
const STK_DEG = {}; STK.forEach(s => STK_DEG[s.n] = linesOf("s:" + s.n).filter(l => !E(l, "s:" + s.n).self).length);
const NODE_DEG = {}; LINES.forEach(l => { NODE_DEG[l.from] = (NODE_DEG[l.from]||0) + 1; NODE_DEG[l.to] = (NODE_DEG[l.to]||0) + 1; });
/* 地图上的城市点：网里有线、自己不是贴纸的地方 */
const CITIES = Object.keys(N).filter(id => N[id].type === "place" && N[id].ll && NODE_DEG[id] && !stkOfNode(id));

/* ---------- 状态 ---------- */
let focus = null;        // 现在站在哪个目标上
let selLine = null;      // 选中的一条线
let hoverLine = null;
const history = [];      // 退回用：[{g, line}]
const trail = [];        // 走过的线：[{a, b, id}]
const seenFields = new Set();
const kindOn = new Set(Object.keys(KINDS));
let fieldOn = "all";
const lineVisible = l => kindOn.has(kindOf(l)) && (fieldOn === "all" || (l.fields || l.tags || []).includes(fieldOn));

/* ---------- 地图 ---------- */
const svg = d3.select(SR.getElementById("map")), wrap = SR.getElementById("mapwrap");
let proj, path, Wd, Hd, zT = d3.zoomIdentity, world;
const gRoot = svg.append("g"), gLand = gRoot.append("g"), gTrail = svg.append("g"), gArc = svg.append("g"), gCity = svg.append("g"), gStk = svg.append("g"), gTag = svg.append("g"), gFx = svg.append("g");
const defs = svg.append("defs");
defs.append("filter").attr("id","sh").html('<feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#3e4a32" flood-opacity=".3"/>');
defs.append("filter").attr("id","glow").html('<feGaussianBlur stdDeviation="2.4"/>');
const zoom = d3.zoom().scaleExtent([1, 14]).on("start", () => svg.classed("drag", true)).on("end", () => svg.classed("drag", false))
  .on("zoom", e => { zT = e.transform; gLand.attr("transform", zT); schedule(); });
svg.call(zoom).on("dblclick.zoom", null);
const scr = p => { const q = proj(p); return zT.apply(q); };
const isPhone = () => innerWidth <= 700;

function layout(){
  Wd = wrap.clientWidth; Hd = wrap.clientHeight;
  svg.attr("viewBox", `0 0 ${Wd} ${Hd}`);
  const land = topojson.feature(world, world.objects.countries); land.features = land.features.filter(f => f.id !== "010");
  const bottom = isPhone() ? Hd - sheetH() - 10 : Hd - 16;
  proj = d3.geoNaturalEarth1().fitExtent([[10, isPhone() ? 92 : 62], [Wd - 10, Math.max(bottom, 240)]], land);
  path = d3.geoPath(proj);
  gLand.selectAll("*").remove();
  gLand.append("path").attr("class","grat").attr("d", path(d3.geoGraticule10()));
  gLand.append("path").attr("class","land2").attr("d", path(land)).attr("transform","translate(0,2.5)");
  gLand.append("path").attr("class","land").attr("d", path(land));
  gLand.append("path").attr("class","border").attr("d", path(topojson.mesh(world, world.objects.countries, (a,b) => a !== b)));
  [["PACIFIC",[-150,6]],["ATLANTIC",[-36,20]],["INDIAN OCEAN",[72,-26]]].forEach(([s,p]) => { const [x,y] = proj(p); gLand.append("text").attr("class","sealab").attr("x",x).attr("y",y).attr("text-anchor","middle").text(s); });
  gLand.attr("transform", zT);
  draw();
}

let raf = 0; function schedule(){ if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

/* 一条弧：屏幕上一条往北弯的弧线 */
function arcD(a, b){
  const [x1,y1] = a, [x2,y2] = b, dx = x2-x1, dy = y2-y1, d = Math.hypot(dx,dy) || 1;
  let nx = -dy/d, ny = dx/d; if (ny > 0){ nx = -nx; ny = -ny; }
  const k = Math.min(.32 * d, 220), cx = (x1+x2)/2 + nx*k, cy = (y1+y2)/2 + ny*k;
  return {d:`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, mid:[(x1+2*cx+x2)/4, (y1+2*cy+y2)/4]};
}

/* 现在要画的线和两头的位置 */
function activeArcs(){
  if (!focus) return [];
  const out = [];
  linesOf(focus).forEach(l => {
    const e = E(l, focus);
    if (e.self || !lineVisible(l)) return;
    out.push({l, a: e.a, b: e.b, other: e.other});
  });
  return out;
}

/* 同一个城市里叠在一起的几个「网上的点」，绕一圈摊开 */
function stackSheet(list){
  const old = ROOT.querySelector(".stkw"); if (old) old.remove();
  const w = document.createElement("div"); w.className = "stkw";
  w.innerHTML = `<div class="stkveil"></div><div class="stksheet"><div class="stkgrab"></div><b>${esc(UT("点哪一个？", "Which one?"))}</b><div class="stacklist">${list.map(s => `<button data-stkpick="${esc(s.n)}">${s.a ? `<img src="${ART + s.a.replace(/^L:/, "")}" alt="">` : `<span style="font-size:20px">${s.e}</span>`}<span>${esc(UI === "zh" ? s.n : (s.en || s.n))}${STK_DEG[s.n] ? `<small>${t("lines")(STK_DEG[s.n])}</small>` : ""}</span></button>`).join("")}</div></div>`;
  ROOT.appendChild(w); requestAnimationFrame(() => w.classList.add("on"));
  const close = () => { w.classList.remove("on"); setTimeout(() => w.remove(), 250); };
  w.querySelector(".stkveil").onclick = close;
  w.querySelectorAll("[data-stkpick]").forEach(b => b.onclick = () => { close(); goTo("s:" + b.dataset.stkpick, null, true); });
}
function spreadTags(tags){
  const groups = {};
  tags.forEach(g => { const p = scr(tgtPos(g)); const key = Math.round(p[0]/12) + "," + Math.round(p[1]/12); (groups[key] = groups[key] || []).push(g); });
  const pos = {};
  Object.values(groups).forEach(gs => { const p0 = scr(tgtPos(gs[0]));
    gs.forEach((g, i) => { if (gs.length === 1){ pos[g] = p0; return; } const an = -Math.PI/2 + i * 2*Math.PI/gs.length, r = 30 + gs.length*3; pos[g] = [p0[0] + Math.cos(an)*r, p0[1] + Math.sin(an)*r*.75]; }); });
  /* 纸签互相不压：从上往下排，挨得太近就往下挪 */
  const ks = Object.keys(pos).sort((a,b) => pos[a][1] - pos[b][1]);
  for (let i = 1; i < ks.length; i++) for (let j = 0; j < i; j++){ const p = pos[ks[i]], q = pos[ks[j]];
    if (Math.abs(p[0] - q[0]) < 120 && Math.abs(p[1] - q[1]) < 24) pos[ks[i]] = [p[0], q[1] + 24]; }
  return pos;
}

let ARCS = [], TAGPOS = {};
let fanned = null;   // 摊开的那一叠
function draw(){
  if (!proj) return;
  ARCS = activeArcs();
  const ends = new Set(ARCS.map(x => x.other)); if (focus) ends.add(focus);
  const tagGs = [...ends].filter(g => g[0] === "n" && !CITIES.includes(g.slice(2)));
  TAGPOS = spreadTags(tagGs);
  /* 纸签不压住贴纸：离一张要显示的贴纸太近，就挪到它下面 */
  const showS = STK.filter(x => ends.has("s:" + x.n));
  Object.keys(TAGPOS).forEach(k => { const p = TAGPOS[k]; showS.forEach(x => { const q = scr(x.p); if (Math.abs(q[0] - p[0]) < 46 && Math.abs(q[1] - p[1]) < 36) TAGPOS[k] = [p[0], q[1] + 52]; }); });
  const P = g => TAGPOS[g] || scr(tgtPos(g));

  /* 走过的路 */
  gTrail.selectAll("path").data(trail).join("path").attr("class","trail").attr("d", x => arcD(P(x.a), P(x.b)).d);

  /* 城市点 */
  const cs = gCity.selectAll("g.city").data(CITIES.filter(id => zT.k >= 2.2 || NODE_DEG[id] >= 6 || ends.has("n:"+id)), d => d)
    .join(en => { const g = en.append("g").attr("class","city"); g.append("circle").attr("r",3.6); g.append("text").attr("x",6).attr("y",4); g.on("click", (e,d) => { e.stopPropagation(); goTo("n:"+d, null, true); }); return g; });
  cs.attr("transform", d => { const p = scr(nodePos(d)); return `translate(${p[0]},${p[1]})`; })
    .classed("dim", d => focus && !ends.has("n:"+d)).classed("focus", d => focus === "n:"+d)
    .select("text").text(d => nm(N[d].name));

  /* 贴纸：挤的地方叠成一叠 */
  const must = new Set([...ends].filter(g => g[0] === "s").map(g => g.slice(2)));
  const order = STK.slice().sort((a,b) => must.has(b.n) - must.has(a.n) || (STK_DEG[b.n] > 0) - (STK_DEG[a.n] > 0) || a.t - b.t);
  const heads = [];
  order.forEach(s => { const p = scr(s.p); s._x = p[0]; s._y = p[1];
    if (!must.has(s.n)){ const h = heads.find(h => Math.abs(h._x - s._x) < 46 && Math.abs(h._y - s._y) < 46); if (h){ h._kids.push(s); return; } }
    s._kids = []; heads.push(s); });
  /* 摊开的一叠：一圈排开，每张都能点 */
  const fh = fanned && heads.find(h => h.n === fanned);
  if (fh && fh._kids.length){ const ks = fh._kids, R0 = 50 + ks.length * 4; fh._kids = [];
    ks.forEach((k, i) => { const an = -Math.PI / 2 + (i + 1) * 2 * Math.PI / (ks.length + 1); k._x = fh._x + Math.cos(an) * R0; k._y = fh._y + Math.sin(an) * R0 * .85; k._kids = []; k._fan = 1; heads.push(k); }); fh._fan = 1; }
  else fanned = null;
  const sg = gStk.selectAll("g.stk").data(heads, d => d.n).join(en => {
    const g = en.append("g").attr("class","stk");
    g.append("g").attr("class","stack");
    const b = g.append("g").attr("class","bob");
    b.each(function(d){ const B = d3.select(this);
      if (d.a && d.a.startsWith("L:")){ B.append("rect").attr("x",-22).attr("y",-22).attr("width",44).attr("height",44).attr("rx",12).attr("fill","#fff").attr("stroke",d.cc||"#ccc").attr("stroke-width",2.5).attr("filter","url(#sh)");
        B.append("image").attr("href", ART + d.a.slice(2)).attr("x",-15).attr("y",-15).attr("width",30).attr("height",30); }
      else if (d.a){ B.append("image").attr("href", ART + d.a).attr("x",-24).attr("y",-26).attr("width",48).attr("height",48).attr("filter","url(#sh)"); }
      else { B.append("circle").attr("class","disc").attr("r",20).attr("stroke",d.cc||"#ccc").attr("filter","url(#sh)"); B.append("text").attr("class","emo").text(d.e); }
      /* 有线的贴纸：底下一串小彩点（它有哪几种线） */
      const ks = [...new Set(linesOf("s:"+d.n).filter(l => !E(l, "s:"+d.n).self).map(kindOf))].slice(0,4);
      const kg = B.append("g").attr("class","knot").attr("transform","translate(0,22)");
      ks.forEach((k,i) => kg.append("circle").attr("cx",(i-(ks.length-1)/2)*7).attr("r",2.8).attr("fill",KINDS[k].h).attr("stroke","#fff").attr("stroke-width",1));
    });
    g.append("text").attr("class","nm").attr("text-anchor","middle").attr("y",37);
    g.on("click", (e,d) => { e.stopPropagation();
      if (d._kids.length && !must.has(d.n) && fanned !== d.n){ if (isPhone()){ stackSheet([d, ...d._kids]); blip(880); return; } fanned = d.n; blip(880); draw(); return; }   // 第一下：一叠摊开（手机上：底下拉起小抽屉）
      goTo("s:"+d.n, null, true); });
    return g; });
  sg.attr("transform", d => `translate(${d._x},${d._y})`)
    .classed("dim", d => focus && !must.has(d.n))
    .classed("focus", d => focus === "s:"+d.n);
  sg.select("text.nm").text(d => UI === "en" ? (d.en || d.n) : d.n);
  sg.classed("nolab", d => isPhone() && zT.k < 2.6 && !must.has(d.n) && focus !== "s:" + d.n && !d._fan);
  sg.select("g.stack").each(function(d){ const G = d3.select(this); G.selectAll("*").remove();
    if (!d._kids.length || must.has(d.n)) return;
    G.append("rect").attr("class","card").attr("x",-20).attr("y",-24).attr("width",44).attr("height",44).attr("rx",8).attr("transform","rotate(9)").attr("filter","url(#sh)");
    G.append("rect").attr("class","card").attr("x",-25).attr("y",-23).attr("width",44).attr("height",44).attr("rx",8).attr("transform","rotate(-7)");
    G.append("circle").attr("cx",22).attr("cy",-24).attr("r",9).attr("fill","var(--stack)");
    G.append("text").attr("class","cnt").attr("x",22).attr("y",-20.5).text("+" + d._kids.length);
  });

  /* 线 */
  const ag = gArc.selectAll("g.a").data(ARCS, x => x.l.id).join(en => {
    const g = en.append("g").attr("class","a");
    g.append("path").attr("class","arc base");
    g.append("path").attr("class","arc hit");
    g.append("path").attr("class","arrow").attr("d","M-5,-4 L4,0 L-5,4 Z");
    g.append("circle").attr("class","flow").attr("r",3.4).attr("fill","#fff").attr("stroke-width",2);
    g.on("mouseenter", (e,x) => { hoverLine = x.l.id; markHover(); }).on("mouseleave", () => { hoverLine = null; markHover(); })
     .on("click", (e,x) => { e.stopPropagation(); openLine(x.l); });
    g.each(function(x){ const p = this.querySelector(".base"); p.dataset.fresh = "1"; });
    return g; });
  ag.each(function(x){
    const g = d3.select(this), A = arcD(P(x.a), P(x.b)), col = KINDS[kindOf(x.l)].h;
    g.select(".base").attr("d", A.d).attr("stroke", col);
    g.select(".hit").attr("d", A.d);
    g.select(".flow").attr("stroke", col);
    const el = g.select(".base").node(), L = el.getTotalLength(); x._el = el; x._len = L;
    const p1 = el.getPointAtLength(L*.52), p2 = el.getPointAtLength(L*.54), ang = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 180 / Math.PI;
    g.select(".arrow").attr("fill", col).attr("transform", `translate(${p1.x},${p1.y}) rotate(${ang})`);
    if (el.dataset.fresh){ delete el.dataset.fresh; el.style.strokeDasharray = L; el.style.strokeDashoffset = L; el.getBoundingClientRect();
      el.style.transition = `stroke-dashoffset .7s ${(Math.random()*.25).toFixed(2)}s ease-out`; el.style.strokeDashoffset = 0;
      setTimeout(() => { el.style.transition = ""; el.style.strokeDasharray = ""; }, 1100); }
  });

  /* 两头是「网上的点」（还不是贴纸）：一张小纸签 */
  const tg = gTag.selectAll("g.tag").data(tagGs, d => d).join(en => {
    const g = en.append("g").attr("class","tag");
    g.append("rect").attr("rx",9).attr("height",22).attr("y",-11);
    g.append("text").attr("y",4);
    g.on("click", (e,d) => { e.stopPropagation(); const x = ARCS.find(x => x.other === d); if (x) openLine(x.l); else goTo(d, null, true); });
    return g; });
  tg.attr("transform", d => { const p = P(d); return `translate(${p[0]},${p[1]})`; })
    .each(function(d){ const g = d3.select(this), n = N[d.slice(2)], x = ARCS.find(x => x.other === d);
      const ic = artEmoji(d.slice(2)); const s = (ic ? ic + " " : "") + tgtName(d);
      const tx = g.select("text").text(s); const w = tx.node().getComputedTextLength() + 16;
      tx.attr("x", -w/2 + 8); g.select("rect").attr("x", -w/2).attr("width", w).attr("stroke", x ? KINDS[kindOf(x.l)].h : "var(--ink)"); });
  markHover();
}

function markHover(){
  const on = hoverLine || (selLine && selLine.id);
  gArc.selectAll("g.a").each(function(x){ const g = d3.select(this);
    g.select(".base").classed("hl", x.l.id === on).classed("faded", !!on && x.l.id !== on); g.select(".arrow").attr("opacity", !!on && x.l.id !== on ? .2 : 1); });
  SR.querySelectorAll(".lrow").forEach(r => r.classList.toggle("hl", r.dataset.l === hoverLine));
  /* 桌面：指着的线旁边浮出那一句 */
  gFx.selectAll("g.arclab").remove();
  const x = hoverLine && ARCS.find(x => x.l.id === hoverLine);
  if (x && !isPhone()){
    const el = x._el, p = el.getPointAtLength(x._len * .5), s = say(x.l)[0].replace(/\[\[|\]\]/g,"");
    const g = gFx.append("g").attr("class","arclab").attr("transform",`translate(${p.x},${p.y - 16})`);
    const tx = g.append("text").attr("text-anchor","middle").attr("y",4).text(s.length > 46 ? s.slice(0,45) + "…" : s);
    const w = tx.node().getComputedTextLength() + 20; g.insert("rect","text").attr("x",-w/2).attr("y",-12).attr("width",w).attr("height",24).attr("rx",12);
  }
}

/* 流动的小点：方向从 from 到 to */
let t0 = performance.now();
function tick(now){
  ARCS.forEach(x => { if (!x._el || !x._len) return; const f = ((now - t0) / 2200 + (x.l.id.length % 5) * .19) % 1;
    const p = x._el.getPointAtLength(f * x._len); const c = x._el.parentNode.querySelector(".flow"); c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); });
  requestAnimationFrame(tick);
}

/* ---------- 镜头 ---------- */
function centerOf(){ return isPhone() ? [Wd/2, (92 + (Hd - sheetH())) / 2] : [Wd/2, Hd/2]; }
function zoomAt(p, k, ms = 750){
  const q = proj(p), c = centerOf();
  const tr = d3.zoomIdentity.translate(c[0] - q[0]*k, c[1] - q[1]*k).scale(k);
  return svg.transition().duration(ms).ease(d3.easeCubicInOut).call(zoom.transform, tr).end().catch(() => {});
}
function fitBoth(pa, pb, ms = 900){
  const a = proj(pa), b = proj(pb), c = centerOf();
  const vw = Wd - 80, vh = (isPhone() ? Hd - sheetH() - 120 : Hd - 140);
  const k = Math.max(1, Math.min(6, vw / (Math.abs(a[0]-b[0]) + 60), vh / (Math.abs(a[1]-b[1]) + 120)));
  const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2 - 30/k;
  return svg.transition().duration(ms).ease(d3.easeCubicInOut).call(zoom.transform, d3.zoomIdentity.translate(c[0]-mx*k, c[1]-my*k).scale(k)).end().catch(() => {});
}

/* ---------- 走 ---------- */
function goTo(g, viaLine, push){
  if (push && focus && focus !== g) history.push({g: focus, line: selLine});
  focus = g; selLine = null; hoverLine = null;
  (linesOf(g)).forEach(l => (l.fields || []).forEach(f => seenFields.add(f)));
  if (isPhone()) setSheet(innerHeight * .4);
  draw(); renderPanel();
  const el = gStk.selectAll("g.stk").filter(d => "s:" + d.n === g).node(); if (el){ el.classList.remove("pop"); void el.getBoundingClientRect(); el.classList.add("pop"); }
  blip();
  const ps = activeArcs().map(x => tgtPos(x.other));
  if (!viaLine){ if (ps.length){ const all = ps.concat([tgtPos(g)]); fitAll(all); } else zoomAt(tgtPos(g), Math.max(zT.k, 3)); }
}
function fitAll(pts){
  const q = pts.map(p => proj(p)), xs = q.map(p => p[0]), ys = q.map(p => p[1]);
  const c = centerOf(), vw = Wd - 100, vh = isPhone() ? Hd - sheetH() - 130 : Hd - 150;
  const k = Math.max(1, Math.min(5, vw / (d3.max(xs) - d3.min(xs) + 40), vh / (d3.max(ys) - d3.min(ys) + 100)));
  const mx = (d3.max(xs) + d3.min(xs)) / 2, my = (d3.max(ys) + d3.min(ys)) / 2 - 20/k;
  svg.transition().duration(800).ease(d3.easeCubicInOut).call(zoom.transform, d3.zoomIdentity.translate(c[0]-mx*k, c[1]-my*k).scale(k));
}
function openLine(l){
  selLine = l;
  if (isPhone()) setSheet(innerHeight * .55);
  draw(); renderPanel(); blip();
  const e = E(l, focus); fitBoth(tgtPos(e.a), tgtPos(e.b));
}
/* 去那一头：一只小船/小飞机顺着弧线飞过去，到了盖个章 */
let flying = false;
async function travel(l){
  if (flying) return; flying = true;
  const from = focus, e = E(l, from), to = e.other;
  await fitBoth(tgtPos(from), tgtPos(to), 500);
  const x = ARCS.find(x => x.l.id === l.id);
  if (x && x._el){
    const el = x._el, L = el.getTotalLength(), forward = e.fwd;
    const icon = gFx.append("text").attr("class","plane").attr("text-anchor","middle").attr("dominant-baseline","central").text("⛵");
    const glow = gFx.append("path").attr("fill","none").attr("stroke", KINDS[kindOf(l)].h).attr("stroke-width",6).attr("opacity",.35).attr("filter","url(#glow)").attr("stroke-linecap","round");
    await new Promise(res => { const st = performance.now(), D = 1300;
      (function step(now){ const f = Math.min(1, (now - st) / D), e = d3.easeCubicInOut(f), at = forward ? e*L : (1-e)*L, p = el.getPointAtLength(at);
        icon.attr("x", p.x).attr("y", p.y - 10);
        const pts = []; for (let i = 0; i <= 24; i++){ const s = forward ? (i/24)*at : L - (i/24)*(L-at); const q = el.getPointAtLength(s); pts.push([q.x,q.y]); }
        glow.attr("d", d3.line()(pts));
        if (f < 1) requestAnimationFrame(step); else res(); })(performance.now()); });
    icon.remove(); glow.transition().duration(700).attr("opacity",0).remove();
  }
  trail.push({a: from, b: to, id: l.id});
  const newF = (l.fields || []).filter(f => !seenFields.has(f));
  history.push({g: from, line: l});
  focus = to; selLine = null; hoverLine = null;
  linesOf(to).forEach(m => (m.fields || []).forEach(f => seenFields.add(f)));
  if (isPhone()) setSheet(innerHeight * .4);
  draw(); renderPanel();
  const p = scr(tgtPos(to)), r = SR.getElementById("map").getBoundingClientRect();
  const sx = r.left + p[0], sy = r.top + p[1] - 40;
  if (newF.length){ stamp(sx, sy, t("newfield"), nm(W.fields[newF[0]].name)); confetti(sx, sy); }
  else stamp(sx, sy, t("arrived"), tgtName(to));
  const ps = activeArcs().map(x => tgtPos(x.other));
  if (ps.length) fitAll(ps.concat([tgtPos(to)])); else zoomAt(tgtPos(to), Math.max(zT.k, 3.5));
  flying = false;
}
function goBack(){
  if (!history.length || flying) return;
  const h = history.pop();
  if (trail.length && trail[trail.length-1].a === h.g) trail.pop();
  focus = h.g; selLine = h.line || null;
  if (isPhone()) setSheet(innerHeight * (selLine ? .55 : .4));
  draw(); renderPanel(); blip();
  if (selLine){ const e = E(selLine, focus); fitBoth(tgtPos(e.a), tgtPos(e.b)); }
  else { const ps = activeArcs().map(x => tgtPos(x.other)); ps.length ? fitAll(ps.concat([tgtPos(focus)])) : zoomAt(tgtPos(focus), Math.max(zT.k, 3)); }
}

/* ---------- 面板 ---------- */
const pb = SR.getElementById("pbody");
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const say = l => { const a = (l.text && l.text[TL()]) || [], b = (l.text && l.text[UI === "en" ? "en" : "zh"]) || []; return [a[0] || "", b[0] || "", a[1] || "", b[1] || ""]; };
/* [[词]] = 能借走的词，红线，点了听 */
function marked(s, pair){ let i = 0; const m = (pair.match(/\[\[(.+?)\]\]/g) || []).map(x => x.slice(2,-2));
  return esc(s).replace(/\[\[(.+?)\]\]/g, (_, w) => `<u class="w" data-w="${w}" data-m="${esc(m[i++] || "")}">${w}</u>`); }
const plain = s => esc((s || "").replace(/\[\[|\]\]/g, ""));
function artEmoji(id){ const a = W.art && W.art[id]; if (a && a.startsWith("draw:")) return a.slice(5); const n = N[id]; if (!n) return ""; if (n.type === "place") return "📍"; const f = (n.fields || [])[0]; return f && W.fields[f] ? W.fields[f].icon : "•"; }
function picOf(g){
  if (g[0] === "s"){ const s = S[g.slice(2)]; return s.a ? `<img class="art" src="${ART + s.a.replace(/^L:/,"")}" alt="">` : `<span>${s.e}</span>`; }
  return `<span>${artEmoji(g.slice(2))}</span>`;
}
function endHTML(g, nodeId){
  const n = N[nodeId], ph = W.photos && W.photos[nodeId] && W.photos[nodeId][0];
  let im;
  if (ph) im = `<div class="im" style="background-image:url('${esc(ph.u)}')"><div class="cr">${esc(nm(ph.c))}</div></div>`;
  else if (W.art && W.art[nodeId] && !W.art[nodeId].startsWith("draw:")) im = `<div class="im"><img class="art" src="${ART + W.art[nodeId]}.webp" alt=""></div>`;
  else im = `<div class="im">${picOf(g)}</div>`;
  const tz = n.text && n.text[TL()] ? n.text[TL()][0] : "", tu = n.text && n.text[UI === "en" ? "en" : "zh"] ? n.text[UI === "en" ? "en" : "zh"][0] : "";
  return `<div class="end">${im}<div class="tx"><div class="yr">${n.year || ""}${n.at && N[n.at] ? " · " + esc(nm(N[n.at].name)) : ""}</div>
    <b>${esc(n.name.zh)}</b><div class="en">${esc(n.name.en)}</div><p>${plain(UI === "en" ? tu : tz)}</p></div></div>`;
}
function kindBadge(k){ const K = KINDS[k]; return `<span class="badge" style="background:${K.h}">${K.e} ${UI === "en" ? K.en : K.zh}</span>`; }
function sayBlock(l){
  const [a, b, a2, b2] = say(l), lng = TL();
  return `<div class="say ${lng === "en" ? "enf" : ""}">${marked(a2 || a, b2 || b)} <button class="spk" data-say="${esc((a2||a).replace(/\[\[|\]\]/g,""))}" data-lang="${lng}">${t("listen")}</button></div><div class="tr">${plain(b2 || b)}</div>`;
}

function renderPanel(){
  HOST.classList.toggle("online", !!selLine);
  SR.getElementById("back").textContent = t("back");
  SR.getElementById("back").disabled = !history.length;
  SR.getElementById("lang").textContent = t("lang");
  SR.getElementById("wander").textContent = t("wander");
  const tt = SR.getElementById("trailtxt");
  tt.textContent = history.length ? history.map(h => h.g).concat([focus]).map(tgtName).join(" → ") : (focus ? t("trail0") : "");
  tt.title = tt.textContent;
  if (!focus) return homePanel();
  if (selLine) return linePanel(selLine);
  return pointPanel(focus);
}

function homePanel(){
  const busy = STK.filter(s => STK_DEG[s.n] >= 2).sort((a,b) => STK_DEG[b.n] - STK_DEG[a.n]).slice(0,8);
  pb.innerHTML = `<div class="kick">${t("home_k")}</div><h1>${t("home_h")}</h1><p class="lead">${t("home_p")}</p>
  <div class="sec">${t("starts")}</div><div class="starts">${busy.map(s => `<div class="start" data-g="s:${esc(s.n)}">${s.a ? `<img src="${ART + s.a.replace(/^L:/,"")}" alt="">` : `<span class="e">${s.e}</span>`}<div><b>${esc(UI === "en" ? s.en || s.n : s.n)}</b><small>${t("lines")(STK_DEG[s.n])}</small></div></div>`).join("")}</div>
  <div class="sec">${t("legend")}</div><div class="legend">${Object.values(KINDS).map(K => `<span><i style="background:${K.h}"></i>${K.e} ${UI === "en" ? K.en : K.zh}</span>`).join("")}</div>`;
  pb.querySelectorAll(".start").forEach(e => e.onclick = () => goTo(e.dataset.g, null, true));
}

function pointPanel(g){
  const isS = g[0] === "s", s = isS ? S[g.slice(2)] : null, n = isS ? null : N[g.slice(2)];
  const all = linesOf(g), self = all.filter(l => E(l, g).self), out = all.filter(l => !E(l, g).self);
  const vis = out.filter(lineVisible);
  const ks = [...new Set(out.map(kindOf))];
  const title = isS ? s.n : n.name.zh, sub = isS ? (s.en || "") : n.name.en;
  const where = isS ? (UI === "en" ? wEn(s.w) : s.w) : (n.at && N[n.at] ? nm(N[n.at].name) : (n.type === "place" ? t("city") : ""));
  const desc = isS ? (UI === "en" ? (s.de || s.d) : s.d) : plain(n.text ? n.text[UI === "en" ? "en" : "zh"][0] : "");
  const beenIds = new Set(trail.map(x => x.id));
  const row = l => { const e = E(l, g), other = e.other, dir = e.fwd ? "→" : "←", K = KINDS[kindOf(l)], [a, b] = say(l);
    return `<div class="lrow" data-l="${esc(l.id)}"><div class="bar" style="background:${K.h}"></div><div style="flex:1;min-width:0">
      <div class="top">${K.e} ${UI === "en" && realDir(l) ? `<span>${esc(realDir(l))}</span>` : `<span>${UI === "en" ? K.en : K.zh}</span> ${dir} <b>${esc(tgtName(other))}</b>`} <span style="margin-left:auto">${l.year ? l.year + (l.year_note ? " " + (typeof l.year_note === "string" ? l.year_note : nm(l.year_note)) : "") : ""}</span></div>
      <div class="tl" style="${TL() === "en" ? "font-family:Georgia,serif" : ""}">${plain(a)}</div><div class="tr">${plain(b)}</div></div>${beenIds.has(l.id) ? `<span class="been">${t("yours")}</span>` : ""}</div>`; };
  let html = `<div class="hero"><div class="pic">${picOf(g)}</div><div><h2>${esc(title)}</h2><div class="sub">${esc(sub)}</div><div class="where">${esc(where)}</div></div></div>
    <p class="desc">${esc(desc)}</p>`;
  if (!out.length && !self.length){
    html += `<div class="empty"><h3>${t("none_h")}</h3><p>${t("none_p")}</p><button class="ghost" id="knowBtn" style="margin-top:12px">${t("know")}</button>
      <div class="form" id="knowForm" style="display:none"><label>${t("where")}</label><input id="kf1"><label>${t("one")}</label><textarea id="kf2"></textarea><label>${t("srcq")}</label><input id="kf3"><button class="go" id="kfSend">${t("send")}</button></div><div id="kfDone"></div></div>`;
  } else {
    html += `<div class="kinds">${ks.map(k => `<span><i style="background:${KINDS[k].h}"></i>${KINDS[k].e} ${UI === "en" ? KINDS[k].en : KINDS[k].zh}</span>`).join("")}</div>`;
    html += `<div class="sec">${t("lines")(vis.length)}</div>` + (vis.length ? vis.map(row).join("") : `<p class="here">${t("empty_f")}</p>`);
    if (self.length) html += `<div class="sec">${t("here")}</div>` + self.map(l => { const [a,b] = say(l), K = KINDS[kindOf(l)];
      return `<div class="lrow" style="cursor:default"><div class="bar" style="background:${K.h}"></div><div><div class="top">${K.e} ${UI === "en" ? K.en : K.zh} · ${esc(nm(N[l.from].name))} → ${esc(nm(N[l.to].name))}</div><div class="tl">${plain(a)}</div><div class="tr">${plain(b)}</div></div></div>`; }).join("");
  }
  const dead = out.length <= 1 && (out.length || self.length);
  if (dead) html += deadEnd(g);
  html += sayHere(g);
  const cityId = cityOf(g);
  if (cityId && !dead && linesOf("n:" + cityId).filter(l => !E(l, "n:" + cityId).self).length > 1){ const c = N[cityId], cn = linesOf("n:" + cityId).filter(l => !E(l, "n:" + cityId).self).length;
    html += `<div class="sec">${t("near")}</div><div class="lrow" id="cityHop"><div class="bar" style="background:var(--ink)"></div><div style="flex:1"><div class="top"><b>📍 ${esc(nm(c.name))}</b><span style="margin-left:auto">${t("lines")(cn)} →</span></div><div class="tr">${t("near_p")}</div></div></div>`; }
  pb.innerHTML = html; pb.scrollTop = 0;
  const ch = SR.getElementById("cityHop"); if (ch) ch.onclick = () => goTo("n:" + cityId, null, true);
  pb.querySelectorAll("[data-sayhere]").forEach(b => b.onclick = ev => { blip(740); openSay(g, b.dataset.q || null); });
  pb.querySelectorAll("[data-wander2]").forEach(b => b.onclick = () => SR.getElementById("wander").click());
  pb.querySelectorAll("[data-gocity]").forEach(b => b.onclick = () => goTo("n:" + b.dataset.gocity, null, true));
  pb.querySelectorAll(".lrow[data-l]").forEach(r => { const l = LINES.find(x => x.id === r.dataset.l);
    r.onmouseenter = () => { hoverLine = l.id; markHover(); }; r.onmouseleave = () => { hoverLine = null; markHover(); }; r.onclick = () => openLine(l); });
  const kb = SR.getElementById("knowBtn");
  if (kb){ kb.onclick = () => { kb.style.display = "none"; SR.getElementById("knowForm").style.display = "block"; if (isPhone()) setSheet(innerHeight * .8); };
    SR.getElementById("kfSend").onclick = () => { const v = ["kf1","kf2"].map(id => SR.getElementById(id).value.trim());
      if (!v[0] || !v[1]){ toast(UI === "en" ? "Add where it leads and one sentence" : "写上连到哪儿和一句话"); return; }
      SR.getElementById("knowForm").style.display = "none";
      SR.getElementById("kfDone").innerHTML = `<div class="sprout">${t("sent")}<br><b>${esc(v[0])}</b> · ${esc(v[1])}</div>`;
      const r = SR.getElementById("kfDone").getBoundingClientRect(); stamp(r.left + r.width/2, r.top, "🌱", UI === "en" ? "SENT" : "交出去了"); confetti(r.left + r.width/2, r.top); }; }
}

/* ---------- 说一句：跟世界的网同一个框、同一套回应，存进 hv.mylang.v1 ---------- */
const mainNode = g => { const ids = tgtNodes(g); return ids.find(id => N[id] && N[id].q) || ids.find(id => N[id] && N[id].tp) || ids[0] || null; };
const askHere = g => { const ids = new Set(tgtNodes(g)); const c = cityOf(g); if (c) { ids.add(c); Object.keys(N).forEach(id => { if (N[id].at === c) ids.add(id); }); } return (W.threads || []).filter(t => t.kind === "ask" && ids.has(t.on) && t.lg === TL()); };
function sayHere(g){
  const mine = HV.items(TL()).filter(x => x.page === "map" && x.src && x.src.g === g);
  return `<div class="sec">${t("sayH")}</div><div class="why" style="margin-top:0"><p style="margin:0 0 4px;font-size:13px;color:var(--ink2)">${t("sayP")}</p>
    ${mine.map(x => `<div style="font:16px/1.5 'Noto Serif SC',serif;margin-top:6px">“${esc(x.t)}”</div>${x.reply ? `<div class="tr">🎭 ${esc(x.reply.t)}</div>` : ""}`).join("")}
    <button class="go" data-sayhere="1" style="margin-top:10px;background:var(--say)">${t("sayB")}</button></div>`;
}
/* 线的两头按真实的点写（一张贴纸可能合了好几个点），动词用线自己的 v；没有 v 就不写这一行 */
const realName = id => N[id] ? nm(N[id].name).replace(/\s*\(.*$/, "") : id;
const realDir = l => HV.dirLine(l, realName(l.from), realName(l.to), "en", N);
function deadEnd(g){
  const c = cityOf(g), asks = askHere(g);
  let h = `<div class="sec">${t("dead")}</div>`;
  const cn = c ? linesOf("n:" + c).filter(l => !E(l, "n:" + c).self).length : 0;
  if (c && "n:" + c !== g && cn > 1) h += `<div class="lrow" data-gocity="${c}"><div class="bar" style="background:var(--ink)"></div><div style="flex:1"><div class="top"><b>📍 ${t("itsin")} ${esc(nm(N[c].name))}</b><span style="margin-left:auto">${t("lines")(cn)} →</span></div></div></div>`;
  const P_ = id => { const P = W.people[id] || {}; return (typeof P.nm === "string" ? P.nm : P.nm ? nm(P.nm) : id).split(" · ")[0]; };
  if (asks[0]) { const a = asks[0]; h += `<div class="lrow" data-sayhere="1" data-q="${esc(a.id)}"><div class="bar" style="background:var(--say)"></div><div style="flex:1"><div class="top"><b>💬 ${t("asking")}</b> · ${esc(P_(a.by))}${a.seed ? " 🎭" : ""}</div><div class="tl">${plain(a.text)}</div>${a.tr && a.tr[UI === "zh" ? "zh" : "en"] && a.lg !== (UI === "zh" ? "zh" : "en") ? `<div class="tr">${esc(a.tr[UI === "zh" ? "zh" : "en"])}</div>` : ""}</div></div>`; }
  else { const f = (linesOf(g)[0] || {}).fields, f0 = f && f[0], a = f0 && (W.threads || []).find(x => x.kind === "ask" && x.lg === TL() && (x.fields || [])[0] === f0);
    if (a) h += `<div class="lrow" data-sayhere="1" data-q="${esc(a.id)}"><div class="bar" style="background:var(--say)"></div><div style="flex:1"><div class="top"><b>💬 ${t("askFar")(nm(W.fields[f0].name))}</b> · ${esc(P_(a.by))}${a.seed ? " 🎭" : ""}</div><div class="tl">${plain(a.text)}</div>${a.tr && a.tr[UI === "zh" ? "zh" : "en"] && a.lg !== (UI === "zh" ? "zh" : "en") ? `<div class="tr">${esc(a.tr[UI === "zh" ? "zh" : "en"])}</div>` : ""}</div></div>`; }
  h += `<div class="lrow" data-wander2="1"><div class="bar" style="background:#8f7a4c"></div><div style="flex:1"><div class="top"><b>${t("wander")}</b></div><div class="tr">${t("wanderP")}</div></div></div>`;
  return h;
}
function faceOf(id){ const P = W.people[id]; return P && P.face ? P.face : ""; }
const nm2 = (id, x) => N[id] ? (N[id].name[x] || N[id].name.zh).replace(/（.*$|\s*\(.*$/, "") : id;
function openSay(g, threadId){
  const id = mainNode(g), n = id && N[id], lg = TL(), o = lg === "zh" ? "en" : "zh", nmz = x => g[0] === "s" ? (x === "zh" ? S[g.slice(2)].n : (S[g.slice(2)].en || S[g.slice(2)].n)) : (N[g.slice(2)].name[x] || N[g.slice(2)].name.zh);
  const th = threadId ? (W.threads || []).find(x => x.id === threadId) : null;
  let q;
  if (th) q = {t: HV.plain(th.text), tr: th.tr && th.tr[UI] || ""};
  else if (n && n.q) q = {t: (n.q[lg] || "").replace(/\[\[|\]\]/g, ""), tr: (n.q[o] || "").replace(/\[\[|\]\]/g, "")};
  else q = {t: lg === "zh" ? `「${nmz("zh").replace(/^《(.*)》$/, "$1")}」让你想到自己的什么事？` : `Does ${nmz("en")} remind you of anything in your own life?`, tr: lg === "zh" ? `Does ${nmz("en")} remind you of anything in your own life?` : `「${nmz("zh").replace(/^《(.*)》$/, "$1")}」让你想到自己的什么事？`};
  const fill = (fr, x) => fr.replace(/\[[^\]]+\]/, x);
  let st;
  const opts = th ? ((th.tp && th.tp.opts) || th.opts) : (n && n.tp && n.tp.opts);
  if (opts && opts.length) st = opts.slice(0, 3).filter(x => x[lg]).map(x => ({t: x[lg], m: x[o] || "", when: x.when || null}));
  else st = (lg === "zh" ? [["我第一次……","The first time I…"],["我一直以为……","I always thought…"],["我们那边……","Where I'm from…"]] : [["The first time I…","我第一次……"],["I always thought…","我一直以为……"],["Where I'm from, …","我们那边……"]]).map(x => ({t: x[0], m: x[1]}));
  const via = history.length && history[history.length - 1].line;
  HV.say({host: SR.getElementById("sayhost"), ui: UI === "en" ? "en" : "zh", lg, net: W, face: faceOf, kind: th ? "think" : "think", answering: th ? th.id : null, question: q, starters: st,
    topic: g[0] === "s" && S[g.slice(2)].d ? {name: {zh: S[g.slice(2)].n, en: S[g.slice(2)].en || S[g.slice(2)].n}, t: {zh: S[g.slice(2)].d, en: S[g.slice(2)].de || ""}} : null,   // 用户正看着的这张贴纸
    src: {page: "map", g, gEn: nmz("en"), node: id, line: via ? via.id : null, thread: th ? th.id : null}, nodes: tgtNodes(g).concat(sayCity(g) ? [sayCity(g)] : []),   // 挨着的城市自己写好的回应也算
    where: {zh: `🗺️ 在地图上「${nmz("zh")}」${via ? `（顺着「${nm2(via.from, "zh")} → ${nm2(via.to, "zh")}」过来）` : ""}`, en: `🗺️ On the map at ${nmz("en")}${via ? ` (came along ${nm2(via.from, "en")} → ${nm2(via.to, "en")})` : ""}`},
    place: n && n.type === "place" ? id : (sayCity(g) || (n && n.at) || null),
    fx: (ev, w) => blip(w === "reply" ? 990 : 760),
    onAsk: c => { const ask = askHere(g)[0]; if (ask) setTimeout(() => openSay(g, ask.id), 350); else SR.getElementById("wander").click(); },
    onSaved: () => { const r = SR.getElementById("panel").getBoundingClientRect(); stamp(r.left + r.width / 2, Math.max(120, innerHeight * .3), UI === "en" ? "SAID IT" : "说出去了", nmz(UI === "en" ? "en" : "zh")); confetti(r.left + r.width / 2, innerHeight * .3); setTimeout(renderPanel, 400); }});
}

/* 它所在的城市（城市自己也有很多线）：站在一张贴纸或一个点上，能顺路走到城里 */
function cityOf(g){
  if (g[0] === "n"){ const n = N[g.slice(2)]; if (n.type === "place") return null; return n.at && CITIES.includes(n.at) ? n.at : null; }
  const s = S[g.slice(2)]; const at = s.nodes.map(id => N[id].at).find(a => a && CITIES.includes(a)); if (at) return at;
  return nearCity(s.p);
}
/* 离一个坐标最近的「城市」：山、地区、国家不算 */
function nearCity(p, far){ let best = null, bd = far || 1.3; CITIES.forEach(id => { if (!HV.isCity(id, N)) return; const ll = N[id].ll, d = Math.hypot(ll[0] - p[1], ll[1] - p[0]); if (d < bd){ bd = d; best = id; } }); return best; }
/* 说一句时用的城市：贴纸自己在一座城里就用它，不然找挨着的那座城 */
function sayCity(g){ const c = cityOf(g); if (c && HV.isCity(c, N)) return c; const p = tgtPos(g); return p ? (nearCity(p) || nearCity(p, 9)) : null; }   // 挨着的找不到，就找这一带最近的城市
function linePanel(l){
  const e = E(l, focus), a = tgtOf(l.from), b = tgtOf(l.to), other = e.other, k = kindOf(l);
  const col = KINDS[k].h;
  pb.innerHTML = `<div class="kick">${l.year ? l.year + (l.year_note ? " " + (typeof l.year_note === "string" ? l.year_note : nm(l.year_note)) : "") : ""}</div>
    <div class="pair">${endHTML(a, l.from)}<div class="mid"><svg width="30" height="20"><path d="M2 10 H22" stroke="${col}" stroke-width="3" stroke-linecap="round"/><path d="M19 4 L28 10 L19 16 Z" fill="${col}"/></svg><span style="font-size:18px">${KINDS[k].e}</span></div>${endHTML(b, l.to)}</div>
    ${UI === "en" && realDir(l) ? `<div style="font:italic 600 13.5px Georgia,serif;color:#7a6a4a;margin-top:10px;text-align:center">${esc(realDir(l))}</div>` : ""}
    <div class="why">${kindBadge(k)}${sayBlock(l)}<div class="src">${t("src")} · ${esc((UI === "en" && W.src_en && W.src_en[l.src]) || l.src || "—")}</div></div>
    <button class="go" id="goBtn">${esc(t("go")(tgtName(other)))}</button>
    <button class="ghost" id="stayBtn">${t("stay")}</button>`;
  pb.scrollTop = 0;
  SR.getElementById("goBtn").onclick = () => travel(l);
  SR.getElementById("stayBtn").onclick = () => { selLine = null; draw(); renderPanel(); };
}

/* ---------- 小回应 ---------- */
let AC; function blip(f = 660){ try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(.05, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .14); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + .15); } catch(e){} }
function stamp(x, y, big, small){ const d = document.createElement("div"); d.className = "stamp"; d.style.left = Math.max(130, Math.min(innerWidth - 130, x)) + "px"; d.style.top = Math.max(90, y) + "px"; d.innerHTML = `${esc(big)}<small>${esc(small)}</small>`; ROOT.appendChild(d); blip(520); setTimeout(() => blip(780), 120); setTimeout(() => d.remove(), 2000); }
function confetti(x, y){ const cs = ["#e2552f","#c9971a","#2f7d6d","#3a6fb8","#7a4fb0","#cf4f86"];
  for (let i = 0; i < 46; i++){ const c = document.createElement("div"); c.className = "conf"; c.style.background = cs[i % cs.length]; c.style.left = x + "px"; c.style.top = Math.max(60, y) + "px"; ROOT.appendChild(c);
    const an = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160;
    c.animate([{transform:"translate(0,0) rotate(0)", opacity:1},{transform:`translate(${Math.cos(an)*v}px,${Math.sin(an)*v + 140}px) rotate(${Math.random()*720}deg)`, opacity:0}], {duration:1200 + Math.random()*500, easing:"cubic-bezier(.2,.7,.4,1)"}).onfinish = () => c.remove(); } }
function toast(s){ const d = SR.querySelector(".toast") || ROOT.appendChild(Object.assign(document.createElement("div"), {className:"toast"})); d.textContent = s; d.classList.add("on"); clearTimeout(d._t); d._t = setTimeout(() => d.classList.remove("on"), 1800); }
function speak(text, lang, btn){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang === "zh" ? "zh-CN" : "en-GB"; u.rate = lang === "zh" ? .85 : .95;
  if (btn){ btn.classList.add("on"); u.onend = u.onerror = () => btn.classList.remove("on"); } speechSynthesis.speak(u); } catch(e){} }
pb.addEventListener("click", e => {
  const b = e.target.closest(".spk"); if (b){ speak(b.dataset.say, b.dataset.lang, b); return; }
  const w = e.target.closest("u.w"); if (w){ speak(w.dataset.w, TL()); const r = w.getBoundingClientRect(); const p = Object.assign(document.createElement("div"), {className:"wpop"}); p.textContent = w.dataset.w + (w.dataset.m ? " · " + w.dataset.m : ""); p.style.left = (r.left + r.width/2) + "px"; p.style.top = r.top + "px"; ROOT.appendChild(p); setTimeout(() => p.remove(), 1600); }
});

/* ---------- 筛选（安静的） ---------- */
function renderFilters(){
  const kr = SR.getElementById("kindRow");
  kr.innerHTML = Object.entries(KINDS).map(([k,K]) => `<button class="chip ${kindOn.has(k) ? "" : "off"}" data-k="${k}"><i style="background:${K.h}"></i>${UI === "en" ? K.en : K.zh}</button>`).join("");
  kr.querySelectorAll(".chip").forEach(c => c.onclick = () => { const k = c.dataset.k; kindOn.has(k) ? kindOn.delete(k) : kindOn.add(k); if (!kindOn.size) Object.keys(KINDS).forEach(x => kindOn.add(x)); blip(880); renderFilters(); if (selLine && !lineVisible(selLine)) selLine = null; draw(); renderPanel(); });
  const fr = SR.getElementById("fieldRow");
  fr.innerHTML = [`<button class="chip ${fieldOn === "all" ? "on" : ""}" data-f="all">${t("all")}</button>`].concat(W.order.map(f => `<button class="chip ${fieldOn === f ? "on" : ""}" data-f="${f}">${W.fields[f].icon} ${esc(nm(W.fields[f].name))}</button>`)).join("");
  fr.querySelectorAll(".chip").forEach(c => c.onclick = () => { fieldOn = c.dataset.f; blip(880); renderFilters(); if (selLine && !lineVisible(selLine)) selLine = null; draw(); renderPanel(); });
}

/* ---------- 手机抽屉 ---------- */
const panel = SR.getElementById("panel");
let sheet = 170;
const sheetH = () => isPhone() ? sheet : 0;
function setSheet(h){ sheet = Math.max(150, Math.min(innerHeight - 90, h)); HOST.style.setProperty("--sheet", sheet + "px"); }
(function(){ const gr = SR.getElementById("grab"); let y0 = 0, h0 = 0, moved = false;
  gr.addEventListener("pointerdown", e => { y0 = e.clientY; h0 = sheet; moved = false; panel.classList.add("dragging"); gr.setPointerCapture(e.pointerId); });
  gr.addEventListener("pointermove", e => { if (!panel.classList.contains("dragging")) return; if (Math.abs(e.clientY - y0) > 4) moved = true; setSheet(h0 + (y0 - e.clientY)); });
  gr.addEventListener("pointerup", () => { panel.classList.remove("dragging"); const H = innerHeight; const stops = [170, H * .52, H - 90];
    if (!moved){ setSheet(sheet < H * .4 ? H * .52 : 170); return; } setSheet(stops.reduce((a,b) => Math.abs(b - sheet) < Math.abs(a - sheet) ? b : a)); }); })();

/* ---------- 按钮 ---------- */
SR.getElementById("back").onclick = goBack;
SR.getElementById("wander").onclick = () => { const c = STK.filter(s => STK_DEG[s.n] && "s:" + s.n !== focus); const s = c[Math.floor(Math.random() * c.length)]; goTo("s:" + s.n, null, true); };
SR.getElementById("zin").onclick = () => svg.transition().duration(400).call(zoom.scaleBy, 1.8);
SR.getElementById("zout").onclick = () => svg.transition().duration(400).call(zoom.scaleBy, 1/1.8);
SR.getElementById("zhome").onclick = () => svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity);
svg.on("click", () => { if (fanned){ fanned = null; draw(); } if (selLine){ selLine = null; draw(); renderPanel(); } });
zoom.on("start.fan", () => {});
addEventListener("keydown", e => { if (e.key === "Escape" && !HOST.hidden) goBack(); });

setSheet(170);
renderFilters(); renderPanel();
SR.getElementById("mylangBtn").textContent = t("mylang");
SR.getElementById("mylangBtn").onclick = e => { e.preventDefault(); HV.goMe({}); };
SR.getElementById("wnBack").onclick = () => { if (window.WNET) window.WNET.open({keep: 1}); };
const gotWorld = w => { world = w; layout(); requestAnimationFrame(tick); let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (!HOST.hidden) layout(); }, 120); }); };
const worldP = (typeof WORLD !== "undefined" && WORLD && WORLD.objects) ? Promise.resolve(WORLD) : d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json");
/* 进来：o = {g: "s:贴纸名" / "n:点", line, via, say: 1 = 到了就打开「说一句」} */
function enter(o){
  o = o || {}; HOST.classList.remove("online"); if (!o.g && !o.line && focus && world){ history.length = 0; focus = null; selLine = null; renderPanel(); }
  worldP.then(w => { if (!world) gotWorld(w); else layout();
    const ok = g => g && (g[0] === "s" ? S[g.slice(2)] : N[g.slice(2)]);
    if (ok(o.g)) setTimeout(() => { goTo(o.g, null, true); if (o.say) setTimeout(() => openSay(o.g), 700); }, 300);
    else if (o.line){ const l = LINES.find(x => x.id === o.line); if (l) setTimeout(() => { goTo(tgtOf(l.from), null, true); setTimeout(() => openLine(l), 500); }, 300); } });
}
function back(){ if (flying) return true; if (history.length){ goBack(); return true; } if (selLine){ selLine = null; draw(); renderPanel(); return true; } if (focus){ focus = null; draw(); renderPanel(); svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); return true; } return false; }
const route = () => "map/lines" + (focus ? "/" + encodeURIComponent(focus) : "");
return {enter, back, route, deg: n => STK_DEG[n] || 0};

}
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


