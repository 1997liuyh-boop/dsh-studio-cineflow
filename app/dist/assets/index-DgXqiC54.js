(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();const _s="modulepreload",qs=function(e,t){return new URL(e,t).href},Oo={},uo=function(t,n,r){let o=Promise.resolve();if(n&&n.length>0){let i=function(f){return Promise.all(f.map(p=>Promise.resolve(p).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};const s=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),u=l?.nonce||l?.getAttribute("nonce");o=i(n.map(f=>{if(f=qs(f,r),f in Oo)return;Oo[f]=!0;const p=f.endsWith(".css"),h=p?'[rel="stylesheet"]':"";if(!!r)for(let y=s.length-1;y>=0;y--){const g=s[y];if(g.href===f&&(!p||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${f}"]${h}`))return;const m=document.createElement("link");if(m.rel=p?"stylesheet":_s,p||(m.as="script"),m.crossOrigin="",m.href=f,u&&m.setAttribute("nonce",u),document.head.appendChild(m),p)return new Promise((y,g)=>{m.addEventListener("load",y),m.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${f}`)))})}))}function a(i){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=i,window.dispatchEvent(s),!s.defaultPrevented)throw i}return o.then(i=>{for(const s of i||[])s.status==="rejected"&&a(s.reason);return t().catch(a)})},Xa=/SCTE35|X-SCTE|CUE-OUT|CUE-IN|-AD[-="]|ID=("?)ad/i;function Ka(e){const t=e.trim();return!!t&&!t.startsWith("#")}function Os(e){for(const t of e){const n=/^#EXTINF:\s*([\d.]+)/i.exec(t.trim());if(n)return Number(n[1])||0}return 0}function Fs(e){return e.some(t=>/^#EXT-X-DISCONTINUITY\b/i.test(t.trim()))}function Fo(e){if(!e.length)return 0;const t=[...e].sort((r,o)=>r-o),n=Math.floor(t.length/2);return t.length%2?t[n]:(t[n-1]+t[n])/2}function zo(e){const t=String(e||"").trim().split(/[?#]/)[0],n=t.lastIndexOf("/");return n>=0?t.slice(0,n):""}const zs=/adjump|advert|guanggao|\/ads?\//i;function Hs(e){const{head:t,segments:n,tail:r}=e;if(n.length<2)return{head:t,segments:n,tail:r,dropped:0};if(!e.tail.some(m=>/^#EXT-X-ENDLIST/i.test(m.trim())))return{head:t,segments:n,tail:r,dropped:0};const o=[];let a=null;for(const m of n)(!a||Fs(m.tags))&&(a={segments:[],duration:0},o.push(a)),a.segments.push(m),a.duration+=m.duration;if(o.length<2)return{head:t,segments:n,tail:r,dropped:0};for(const m of o)m.adUris=m.segments.every(y=>zs.test(y.uri));const i=o.some(m=>!m.adUris)?o.filter(m=>!m.adUris):o;let s=i[0];for(const m of i)m.duration>s.duration&&(s=m);if(s.duration<=0)return{head:t,segments:n,tail:r,dropped:0};const l=zo(s.segments[0]?.uri),u=o.filter(m=>m!==s),f=o.length>=4&&Fo(u.map(m=>m.duration))>=60,p=Fo(u.map(m=>m.duration)),h=[];let w=0;for(const m of o){let y=!1;if(m!==s){const g=m.adUris,A=!!l&&m.segments.every(R=>zo(R.uri)!==l);g?y=!0:f?y=A&&m.duration<=60&&m.duration<p*.25:y=m.duration<=120&&m.duration*3<=s.duration&&m.segments.length<=12}if(y){w+=m.segments.length;continue}for(const g of m.segments)h.push(g)}return{head:t,segments:h,tail:r,dropped:w}}function Us(e){const t=[],n=[],r=[];let o=[],a="head";for(const i of e){const s=i.trim();if(a!=="tail"&&Ka(i)){a="body",n.push({tags:o,uri:i,duration:Os(o)}),o=[];continue}if(s.startsWith("#EXT-X-ENDLIST")){a="tail",r.push(i);continue}a==="head"?t.push(i):a==="tail"?r.push(i):o.push(i)}return{head:t,segments:n,tail:r,pendingTags:o}}function Vs(e,t){const n=[];for(const r of e.head)/^#EXT-X-DISCONTINUITY(-SEQUENCE)?\b/i.test(r.trim())||n.push(r);for(const r of e.segments){for(const o of r.tags){const a=o.trim();/^#EXT-X-DISCONTINUITY\b/i.test(a)||/^#EXT-X-(CUE-OUT|CUE-IN|AS-SCTE35)/i.test(a)||/^#EXT-X-DATERANGE/i.test(a)&&Xa.test(a)||n.push(o)}n.push(r.uri)}for(const r of t)n.push(r);for(const r of e.tail)n.push(r);return n.join(`
`)}function js(e){if(typeof e!="string"||!e)return e||"";let t=e;try{if(/#EXT-X-CUE-OUT/i.test(t)&&/#EXT-X-CUE-IN/i.test(t)){const n=t.split(/\r?\n/),r=[];let o=!1;for(const a of n){const i=a.trim();if(/^#EXT-X-CUE-OUT/i.test(i)){o=!0;continue}if(/^#EXT-X-CUE-IN/i.test(i)){o=!1;continue}o&&(Ka(a)||/^#EXT-X-(?:DISCONTINUITY|MAP|KEY|PROGRAM-DATE-TIME|DATERANGE)/i.test(i))||r.push(a)}t=r.join(`
`)}if(/#EXT-X-DISCONTINUITY\b/i.test(t)&&/#EXTINF/i.test(t)){const n=Us(t.split(/\r?\n/));if(!n.head.some(r=>/#EXT-X-STREAM-INF/i.test(r))){const r=Hs(n);r.dropped>0&&r.segments.length>0&&(t=Vs(r,n.pendingTags))}}/#EXT-X-DISCONTINUITY(-SEQUENCE)?\b|^#EXT-X-(CUE-OUT|CUE-IN|AS-SCTE35)/im.test(t)&&(t=t.split(/\r?\n/).filter(n=>{const r=n.trim();return!(/^#EXT-X-DISCONTINUITY(-SEQUENCE)?\b/i.test(r)||/^#EXT-X-(CUE-OUT|CUE-IN|AS-SCTE35)/i.test(r)||/^#EXT-X-DATERANGE/i.test(r)&&Xa.test(r))}).join(`
`))}catch{return e}return!/#EXTM3U/i.test(t)||t.trim()===""?e:t}function Ws(e){return typeof e=="string"&&/#EXT-X-(DISCONTINUITY|CUE-OUT|CUE-IN|AS-SCTE35)/i.test(e)}function Ys(e){const t=e?.DefaultConfig?.pLoader||e?.DefaultConfig?.loader;return!t||typeof t!="function"?null:class extends t{constructor(r){super(r);const o=this.load.bind(this);this.load=function(i,s,l){if(i&&(i.type==="manifest"||i.type==="level")&&l){const u=l.onSuccess;l.onSuccess=function(p,h,w,m){try{p&&typeof p.data=="string"&&Ws(p.data)&&(p.data=js(p.data))}catch{}return u(p,h,w,m)}}return o(i,s,l)}}}}const Gs=["适合大雪天窝着看的？","心情有点烦躁，想被治愈的？","出差路上 / 飞机上打发时间的？","周末大扫除当背景音的？","朋友聚会想热闹一下的？","一个人小酌配点什么的？"],Xs=[{label:"晴日清爽",patterns:["晴天","大晴天","阳光","好天气","阳光明媚","晒太阳","春游","踏青","野餐","郊游","户外","散步","遛弯","春日","风和日丽"],genreIds:[35,16,10751,10749,12],genreGroups:[[35],[16,10751],[10749],[12]],withoutGenreIds:[27,53],sortBy:"popularity.desc"},{label:"阴天絮语",patterns:["阴天","多云","灰蒙","起雾","大雾","迷雾天","潮湿","回南天","梅雨","湿冷","惆怅","寡淡"],genreIds:[18,9648,10749],genreGroups:[[18],[9648],[18,10749]],withoutGenreIds:[27],sortBy:"vote_average.desc",minRating:6.5},{label:"雪夜寒冬",patterns:["下雪","雪天","初雪","冬天","冬日","寒冷","严寒","雪地","滑雪","暴风雪","圣诞","飘雪"],genreIds:[18,10751,14,10749],genreGroups:[[18],[10751],[14],[10749,18]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"风雨风暴",patterns:["大风","台风","暴风雨","风暴","雷阵雨","打雷","闪电","电闪雷鸣","暴雨"],genreIds:[12,28,9648,53],genreGroups:[[12],[28],[12,9648],[28,53]],sortBy:"popularity.desc"},{label:"炎炎夏日",patterns:["夏天","炎热","酷暑","高温","消暑","纳凉","暑假","泳池","海边","海滩","冲浪","海岛","烈日"],genreIds:[12,14,10749,35],genreGroups:[[12],[10749],[35],[14]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"焦躁求治愈",patterns:["焦虑","烦躁","心烦","压力大","内耗","自闭","emo了","难过","郁闷","不开心","想被治愈","疗愈","平静","静心","心累"],genreIds:[16,35,10751,10402],genreGroups:[[16],[35],[10751],[10402]],withoutGenreIds:[27,53,80],sortBy:"popularity.desc"},{label:"无聊杀时间",patterns:["无聊","打发时间","杀时间","摸鱼","划水","放空","随便看看","都行","剧荒","不知道看什么"],genreIds:[35,16,12,9648],genreGroups:[[35],[16],[12],[9648]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"打起精神",patterns:["励志","打鸡血","鸡血","干劲","冲刺","逆袭","奋斗","拼搏","振作","燃一下","打起精神","重新开始"],genreIds:[18,28,36],genreGroups:[[18],[28],[18,36],[18,28]],sortBy:"vote_average.desc",minRating:6.8},{label:"愤怒发泄",patterns:["生气","愤怒","火大","暴躁","窝火","出气","发泄","气死我了"],genreIds:[28,53,80],genreGroups:[[28],[53],[80],[28,53]],sortBy:"popularity.desc"},{label:"心碎碎片",patterns:["失恋","分手","心碎","白月光","意难平","放不下","舔狗","复合"],genreIds:[18,10749],genreGroups:[[18],[10749],[18,10749]],withoutGenreIds:[27],sortBy:"vote_average.desc",minRating:6.8},{label:"怀旧青春",patterns:["怀旧","复古","童年","小时候","青春","校园","年代感","旧时光","80年代","90年代","千禧","学生时代"],genreIds:[18,10749,35,16],genreGroups:[[18],[10749],[16],[35]],sortBy:"vote_average.desc",minRating:6.8},{label:"好奇探索",patterns:["好奇","揭秘","未知","探索","冷知识","涨知识","真实事件","大开眼界","长见识"],genreIds:[99,9648,12],genreGroups:[[99],[9648],[99,12]],sortBy:"popularity.desc"},{label:"出差远行",patterns:["出差","酒店","宾馆","民宿","候机","飞机上","高铁","火车","大巴","长途","倒时差","绿皮车","候车"],genreIds:[35,12,16,14],genreGroups:[[35],[12],[14],[16]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"通勤路上",patterns:["通勤","地铁","公交","上下班","坐车","堵车","挤地铁","班车"],genreIds:[35,16,12],genreGroups:[[35],[16],[12]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"公路露营",patterns:["自驾","公路旅行","公路","露营","徒步","登山","爬山","旅行","旅游","度假","国家公园","野餐旅行"],genreIds:[12,14,99],genreGroups:[[12],[99],[14],[12,99]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"小酌夜宵",patterns:["喝酒","小酌","独酌","下酒","酒吧","夜宵","烧烤","大排档","配酒","微醺"],genreIds:[80,53,35,18],genreGroups:[[80],[53],[35],[18]],sortBy:"popularity.desc"},{label:"朋友聚会",patterns:["聚会","团建","派对","轰趴","闺蜜","兄弟","几个朋友","多人一起","一起看","热闹"],genreIds:[35,28,14,12],genreGroups:[[35],[28],[14],[12]],sortBy:"popularity.desc"},{label:"家务背景音",patterns:["打扫","做家务","收拾","整理","洗衣服","做饭","烹饪","边做边看","当背景音","大扫除","拖地"],genreIds:[99,35,10402,10764],genreGroups:[[99],[35],[10402],[10764]],withoutGenreIds:[27,53],sortBy:"popularity.desc"}],Ks=[{patterns:["不要爱情","不想看爱情","别爱情","不谈情说爱","没有爱情"],genreIds:[10749]},{patterns:["不要纪录片","别纪录片","不想看纪录片"],genreIds:[99]},{patterns:["不要动画","别动画","不想看动画"],genreIds:[16]},{patterns:["不要战争","别战争","不想看战争"],genreIds:[10752,36]},{patterns:["不要悲伤","不想伤感","别虐"],genreIds:[18]}];function Js(e,t,n){Array.isArray(e)&&e.push(...Xs),Array.isArray(t)&&t.push(...Gs),Array.isArray(n)&&n.push(...Ks)}function Or(e){return String(e||"").normalize("NFKC").replace(/[\u200b-\u200f\u2060\ufeff]/g,"").replace(/\s+/g," ").trim().replace(/^[《「【“‘"']+|[》」】”’"']+$/g,"").trim()}const bn={零:0,"〇":0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};function Te(e){return String(e??"").normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,"")}function Qs(e){const t=String(e??"").trim();if(/^\d+$/.test(t))return Number(t);if(t==="十")return 10;const n=t.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);return n?(n[1]?bn[n[1]]:1)*10+(n[2]?bn[n[2]]:0):t.length===1&&t in bn?bn[t]:Number.NaN}function Zs(e,{side:t="title"}={}){const n=String(e??"").normalize("NFKC").trim(),r=n.match(/^(.*?)[\s·:：\-—]*第\s*([0-9一二两三四五六七八九十]+)\s*[季部](.*)$/);if(r&&r[1].trim()){const i=Qs(r[2]);if(i>0)return{base:r[1].trim(),season:i}}const o=n.match(/^(.*?)[\s·:：\-—]*season\s*(\d{1,2})\b/i);if(o&&o[1].trim())return{base:o[1].trim(),season:Number(o[2])};const a=t==="query"?n.match(/^(.*?\D)\s*(\d{1,2})$/):n.match(/^(.*\S)\s+(\d{1,2})$/);if(a&&Te(a[1])){const i=Number(a[2]);if(i>0&&i<40)return{base:a[1].trim(),season:i}}return{base:n,season:0}}function Ja(e){const t=String(e??"").normalize("NFKC").trim(),{base:n,season:r}=Zs(t,{side:"query"});return{raw:t,normalized:Te(t),base:Te(n),season:r,tokens:t.split(/\s+/).map(Te).filter(Boolean)}}const el=/(解说|预告|花絮|短评|速看|看点|幕后|特辑|reaction|剪辑|混剪|片段)/i;function tl(e){return el.test(`${e?.name||""} ${e?.typeName||""}`)}function wn(e){const t=new Map;for(const o of e)o&&t.set(o,(t.get(o)||0)+1);let n="",r=0;for(const[o,a]of t)a>r&&(n=o,r=a);return n}function hr(e,t,n){const r=new Set(t.map(s=>s.sourceKey)),o=wn(t.map(s=>s.name))||t[0]?.name||"",a=Te(o),i=s=>t.find(l=>l[s])?.[s]||"";return{key:e,name:o,year:wn(t.map(s=>s.year)),typeName:wn(t.map(s=>s.typeName)),area:i("area"),pic:i("pic"),remarks:wn(t.map(s=>s.remarks)),sourceCount:r.size,exact:!!n.normalized&&a===n.normalized,prefix:!!n.normalized&&a.startsWith(n.normalized),noise:t.every(tl),items:t}}function Ho(e,t){const n=typeof t=="object"&&t&&"normalized"in t?t:Ja(t),r=new Map;for(const a of e){const i=Te(a.name);i&&(r.has(i)||r.set(i,[]),r.get(i).push(a))}const o=[];for(const[a,i]of r){const s=[...new Set(i.map(u=>u.year).filter(Boolean))];if(s.length<=1){o.push(hr(`${a}|${s[0]||""}`,i,n));continue}for(const u of s)o.push(hr(`${a}|${u}`,i.filter(f=>f.year===u),n));const l=i.filter(u=>!u.year);l.length&&o.push(hr(`${a}|`,l,n))}return o.sort((a,i)=>Number(i.exact)-Number(a.exact)||Number(a.noise)-Number(i.noise)||Number(i.prefix)-Number(a.prefix)||i.sourceCount-a.sourceCount||a.name.localeCompare(i.name,"zh-Hans-CN")||String(i.year).localeCompare(String(a.year)))}const nl=60*1e3,Uo=4,rl=4,ol=4,At=100;function al(e){let t={at:0,list:[]};async function n(o=!1){if(!o&&Date.now()-t.at<nl&&t.list.length)return t.list;const a=await e.sources();return t={at:Date.now(),list:Array.isArray(a)?a:[]},t.list}async function r(o,{onProgress:a,isCurrent:i=()=>!0}={}){const s=(await n()).filter(A=>!A.disabled),l=s.length,u=[];for(let A=0;A<s.length;A+=Uo)u.push(s.slice(A,A+Uo).map(R=>R.key));const f=[],p=[];let h=0,w=0;const m=[],y=A=>{i()&&a?.({items:f,groups:Ho(f,o),checked:h,total:l,failures:p,done:A,disabledEvents:m})},g=async()=>{for(;w<u.length&&i();){const A=u[w++];try{const R=await e.search(o,A);for(const k of R?.outcomes||[])k.ok?f.push(...k.list||[]):p.push({key:k.key,name:k.name,error:k.error,timedOut:k.timedOut});m.push(...R?.disabledEvents||[])}catch(R){for(const k of A)p.push({key:k,name:k,error:String(R?.message||R)})}h+=A.length,y(!1)}};return await Promise.all(Array.from({length:Math.min(rl,u.length)},g)),m.length&&(t.at=0),y(!0),{items:f,groups:Ho(f,o),checked:h,total:l,failures:p}}return{run:r,listSources:n,invalidate:()=>{t.at=0}}}function mr(e,{title:t,originalTitle:n,year:r,mediaType:o}={}){const a=[t,n].map(Te).filter(Boolean);return e.filter(i=>!i.noise).map(i=>{const s=Te(i.name);let l=0;return a.includes(s)?l+=6:a.some(u=>s.startsWith(u))&&(l+=o==="tv"?3:1),r&&i.year===String(r)?l+=4:r&&i.year&&Math.abs(Number(i.year)-Number(r))<=1&&(l+=2),l+=Math.min(3,i.sourceCount/6),{group:i,score:l}}).filter(i=>i.score>=1).sort((i,s)=>s.score-i.score).map(i=>i.group)}function il(e,t){const n=[e.year,e.typeName,e.area].filter(Boolean).join(" · ");return`
    <article class="movie-card vod-card${e.noise?" is-noise":""}" tabindex="0" data-vod-key="${t(e.key)}">
      <div class="poster-frame">
        ${e.pic?`<img src="${t(e.pic)}" alt="${t(e.name)} 海报" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`:'<div class="poster-fallback">暂无海报</div>'}
        <div class="score-pill">${e.sourceCount} 个来源${e.remarks?` · ${t(e.remarks)}`:""}</div>
      </div>
      <h3>${t(e.name)}</h3>
      <p>${t(n||"采集站资源")}</p>
    </article>
  `}function sl(e){return Number.isFinite(e)?e>=1e3?`${(e/1e3).toFixed(1)} 秒`:`${Math.round(e)} 毫秒`:""}function ll({vodApi:e,escapeHtml:t,onPlay:n,onMeta:r}){function o(i,s,{preferSourceKey:l=""}={}){let u=!0;const f=[...s.items],p=new Map;let h=null,w=!1,m=0,y=0;const g=F=>`${F.sourceKey}:${F.vodId}`;i.innerHTML=`
      <div class="vod-work">
        <div class="vod-work-head">
          <h4>播放来源</h4>
          <span class="vod-work-status">正在测速 0/${f.length}</span>
        </div>
        <div class="vod-source-list" role="listbox" aria-label="播放来源"></div>
        <div class="vod-line-tabs" role="tablist" aria-label="线路"></div>
        <div class="vod-episode-pages"></div>
        <div class="vod-episodes"></div>
      </div>
    `;const A=i.querySelector(".vod-source-list"),R=i.querySelector(".vod-line-tabs"),k=i.querySelector(".vod-episode-pages"),b=i.querySelector(".vod-episodes"),$=i.querySelector(".vod-work-status"),I=()=>[...f].sort((F,B)=>{const C=p.get(g(F)),q=p.get(g(B)),E=C?C.ok?0:2:1,M=q?q.ok?0:2:1;return E-M||(C?.ms??1e9)-(q?.ms??1e9)});function T(){A.innerHTML=I().map(F=>{const B=p.get(g(F)),C=h&&g(h)===g(F);let q="测速中…",E="pending";if(B?.ok){const M=Math.max(...B.lines.map(v=>v.episodes.length));q=`${sl(B.ms)} · ${B.lines.length} 条线路 · ${M} 集`,E=B.ms>2e3?"slow":"ok"}else B&&(q=B.error||"不可用",E="failed");return`
          <button class="vod-source-chip is-${E}${C?" is-active":""}" type="button" role="option" aria-selected="${C?"true":"false"}" data-vod-source="${t(g(F))}" ${B&&!B.ok?"disabled":""}>
            <strong>${t(F.sourceName)}</strong>
            <small>${t(q)}</small>
            ${F.remarks?`<em>${t(F.remarks)}</em>`:""}
          </button>
        `}).join("")}function x(){const F=h?p.get(g(h)):null;if(!F?.ok){R.innerHTML="",k.innerHTML="",b.innerHTML=`<div class="resource-pulse">${p.size<f.length?"正在获取剧集列表…":"所有来源都暂时不可用，请稍后重试或换一个作品。"}</div>`;return}m=Math.min(m,F.lines.length-1),R.innerHTML=F.lines.map((E,M)=>`
        <button class="vod-line-tab${M===m?" is-active":""}" type="button" role="tab" aria-selected="${M===m}" data-vod-line="${M}">
          ${t(E.name)} · ${E.episodes.length} 集${E.episodes[0]?.format?` · ${t(E.episodes[0].format)}`:""}
        </button>
      `).join("");const B=F.lines[m].episodes,C=Math.ceil(B.length/At);y=Math.min(y,C-1),k.innerHTML=C>1?Array.from({length:C},(E,M)=>{const v=M*At+1,S=Math.min(B.length,(M+1)*At);return`<button class="vod-page-tab${M===y?" is-active":""}" type="button" data-vod-page="${M}">${v}-${S}</button>`}).join(""):"";const q=y*At;b.innerHTML=B.slice(q,q+At).map((E,M)=>`
        <button class="resource-episode vod-episode" type="button" data-vod-episode="${q+M}" title="${t(E.label)}">
          <span class="resource-episode-label">${t(E.label)}</span>
        </button>
      `).join("")}function P(F,B=!1){h=F,B&&(w=!0),m=0,y=0,T(),x();const C=p.get(g(F));C?.ok&&r?.(C.meta,s)}i.addEventListener("click",F=>{const B=F.target instanceof Element?F.target:null,C=B?.closest("[data-vod-source]");if(C){const v=f.find(S=>g(S)===C.getAttribute("data-vod-source"));v&&P(v,!0);return}const q=B?.closest("[data-vod-line]");if(q){m=Number(q.getAttribute("data-vod-line"))||0,y=0,x();return}const E=B?.closest("[data-vod-page]");if(E){y=Number(E.getAttribute("data-vod-page"))||0,x();return}const M=B?.closest("[data-vod-episode]");if(M&&h){const v=p.get(g(h));if(!v?.ok)return;n?.({group:s,item:h,detail:v,lineIndex:m,episodeIndex:Number(M.getAttribute("data-vod-episode"))||0,alternatives:f.filter(S=>p.get(g(S))?.ok).map(S=>({item:S,detail:p.get(g(S))}))})}}),T(),x();let O=0;const G=[...f].sort((F,B)=>+(B.sourceKey===l)-+(F.sourceKey===l)),J=async()=>{for(;u&&O<G.length;){const F=G[O++];let B;try{B=await e.detail(F.sourceKey,F.vodId)}catch(C){B={ok:!1,error:String(C?.message||C)}}if(!u)return;p.set(g(F),B||{ok:!1,error:"无响应"}),$.textContent=p.size<f.length?`正在测速 ${p.size}/${f.length}`:`${[...p.values()].filter(C=>C.ok).length}/${f.length} 个来源可用 · 已按速度排序`,B?.ok&&!w&&(!h||l&&F.sourceKey===l)?P(F):(T(),!h&&p.size===f.length&&x())}};return Promise.all(Array.from({length:Math.min(ol,G.length)},J)).then(()=>{u&&!h&&x()}),{destroy(){u=!1},results:p}}function a(i,s,{selectedKey:l=""}={}){let u=null;i.innerHTML=`
      <div class="vod-match-list" role="tablist" aria-label="匹配作品">
        ${s.map(h=>`
          <button class="vod-match-chip${h.key===l?" is-active":""}" type="button" role="tab" data-vod-match="${t(h.key)}">
            ${t(h.name)}${h.year?` · ${t(h.year)}`:""}<small>${h.sourceCount} 个来源</small>
          </button>
        `).join("")}
      </div>
      <div class="vod-match-body"></div>
    `;const f=i.querySelector(".vod-match-body"),p=h=>{const w=s.find(m=>m.key===h);w&&(i.querySelectorAll("[data-vod-match]").forEach(m=>m.classList.toggle("is-active",m.getAttribute("data-vod-match")===h)),u?.destroy(),u=o(f,w))};return i.querySelector(".vod-match-list").addEventListener("click",h=>{const w=h.target instanceof Element?h.target.closest("[data-vod-match]"):null;w&&p(w.getAttribute("data-vod-match"))}),s.length&&p(l||s[0].key),{destroy:()=>u?.destroy()}}return{renderWork:o,renderMatches:a}}function cl(e,t){const n=Ja(t).normalized;return e.filter(r=>Te(r.name)===n)}let be=null,jt=null,Mt=null,Rn=null,$t=null,Vo=!1,dt=null,Et="",jo=null;function mt(){return un()?.api}function Qa(){const e=un()?.state?.player;if(!e)return"";const t=e.originalUrl||e.resolvedUrl||e.url||"";return/^https?:\/\//i.test(t)&&!/127\.0\.0\.1|localhost/i.test(t)?t:/^https?:\/\//i.test(e.url)&&!/127\.0\.0\.1|localhost/i.test(e.url)?e.url:""}function st(e){const t=un();return t?.escapeHtml?t.escapeHtml(e):String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function Za(e="open"){be&&(window.clearTimeout(jo),be.classList.remove("is-rippling-open","is-rippling-close"),be.offsetWidth,be.classList.add(e==="close"?"is-rippling-close":"is-rippling-open"),jo=window.setTimeout(()=>{be?.classList.remove("is-rippling-open","is-rippling-close")},e==="close"?640:780))}function dl(){be&&(be.classList.add("is-open"),be.setAttribute("aria-hidden","false"),document.body.classList.add("cast-open"),Za("open"),fl(),mt()?.castScan?.())}function Nn(){be&&(be.classList.contains("is-open")?Za("close"):be.classList.remove("is-rippling-open","is-rippling-close"),be.classList.remove("is-open"),be.setAttribute("aria-hidden","true"),document.body.classList.remove("cast-open"),mt()?.castStopSearch?.())}function ul(){be?.classList.contains("is-open")?Nn():dl()}function fl(){const e=un()?.state?.player;if($t)if(e?.title){const t=e.episodeIndex?` · 第 ${e.episodeIndex+1} 集`:"";$t.textContent=`${e.title}${t}`,$t.hidden=!1}else $t.textContent="",$t.hidden=!0}function Wt(e){if(!Rn)return;const t=String(e||"");Rn.textContent=t,Rn.hidden=!t}function Wo(e,t){const n=e.udn&&e.udn===Et,r=e.online?"在线":"离线",o=e.connected?" · 已连接":"";return`
    <div class="cast-device${n?" is-casting":""}" data-udn="${st(e.udn||"")}" data-kind="${st(e.kind||"dlna")}">
      <div class="cast-device-icon">${e.kind==="bluetooth"?"◉":"🖵"}</div>
      <div class="cast-device-main">
        <strong>${st(e.name||"未命名设备")}</strong>
        <span>${st(e.modelName||"")}${e.hostName?` · ${st(e.hostName)}`:""}${st(o)}</span>
      </div>
      <button type="button" class="cast-device-action" data-udn="${st(e.udn||"")}" ${t?"":"disabled"}>
        ${n?"断开":e.kind==="bluetooth"?"系统设置":t?"投屏":r}
      </button>
    </div>
  `}function Fr(e){if(!e||!jt||!Mt)return;dt=e;const t=Qa(),n=e.dlna||[];n.length?jt.innerHTML=n.map(o=>Wo(o,!!t)).join(""):jt.innerHTML='<p class="cast-empty">暂无设备</p>';const r=(e.bluetooth||[]).filter(o=>o.category==="display"||o.category==="dock");e.bluetoothSupported?r.length?Mt.innerHTML=r.map(o=>Wo({...o,online:!0},!1)).join(""):Mt.innerHTML='<p class="cast-empty">暂无设备</p>':Mt.innerHTML='<p class="cast-empty">系统不支持</p>',Wt(e.searching?"搜索中…":"")}async function pl(e,t){const n=mt();if(!n)return;if(t==="bluetooth"){n.castOpenBluetoothSettings?.();return}if(Et&&Et===e){const s=(dt?.dlna||[]).find(l=>l.udn===e);await n.castStop?.({device:s||{udn:e}}),Et="",Fr(dt||{dlna:[],bluetooth:[]});return}const r=Qa();if(!r){Wt("本地代理片源无法投屏，请选择在线片源。");return}const o=(dt?.dlna||[]).find(s=>s.udn===e),a=un()?.state?.player,i=await n.castTo?.({device:o,url:r,title:a?.title||""});i?.ok?(Et=e,Wt(`已投屏到「${i.name||"设备"}」。`)):Wt(i?.error||"投屏失败。"),dt&&Fr({...dt,dlna:dt.dlna})}function hl(){document.getElementById("castCloseBtn")?.addEventListener("click",Nn),document.getElementById("castBackdrop")?.addEventListener("click",Nn),document.getElementById("castRescanBtn")?.addEventListener("click",()=>{Et="",Wt(""),mt()?.castScan?.()}),document.getElementById("castBluetoothSettingsBtn")?.addEventListener("click",()=>mt()?.castOpenBluetoothSettings?.());const e=t=>{const n=t.target.closest(".cast-device-action");if(!n||n.disabled)return;const r=n.closest(".cast-device");pl(r?.dataset.udn,r?.dataset.kind)};jt.addEventListener("click",e),Mt.addEventListener("click",e),document.addEventListener("keydown",t=>{t.key==="Escape"&&be.classList.contains("is-open")&&Nn()})}function ml(){Vo||(be=document.getElementById("castPanel"),be&&(jt=document.getElementById("castDlnaList"),Mt=document.getElementById("castBluetoothList"),Rn=document.getElementById("castHint"),$t=document.getElementById("castNowPlaying"),hl(),Vo=!0,mt()?.onCastDevices?.(e=>{Fr(e)}),document.getElementById("playerCastBtn")?.addEventListener("click",ul),setInterval(()=>{be.classList.contains("is-open")&&mt()?.castRefreshBluetooth?.()},12e3)))}const gl=["image.tmdb.org","static-1.themoviedb.org","media.themoviedb.org"],yl=4,vl=2600,bl=/\/t\/p\/(w92|w154|w185|w342|w500)\//;let gr=0;const zr=[];function ei(e){for(;gr<yl&&zr.length;){const t=zr.shift();gr+=1,t(e).finally(()=>{gr-=1,ei(e)})}}function ti(e){try{const t=new URL(e,window.location.href);return t.protocol==="https:"&&gl.includes(t.hostname.toLowerCase())}catch{return!1}}function wl(e,t){return async n=>{try{const r=await n.relayImage(t);if(!r?.ok||!r.base64||!e.isConnected)return;e.src=`data:${r.contentType||"image/jpeg"};base64,${r.base64}`}catch{}}}function ni(e,t){e.dataset.cfRelayed||!ti(t)||(e.dataset.cfRelayed="1",zr.push(wl(e,t)),ei(xl()))}let ri=null;function xl(){return ri}function Wn(e){const t=e.getAttribute("src")||"";!ti(t)||e.dataset.cfRelayed||e.complete&&e.naturalWidth>0||bl.test(t)&&window.setTimeout(()=>{e.complete&&e.naturalWidth>0||!e.isConnected||ni(e,t)},vl)}function Sl(e){e.nodeType===1&&(e.tagName==="IMG"&&Wn(e),e.querySelectorAll?.("img[src]").forEach(Wn))}function kl({api:e}={}){return e?.relayImage?(ri=e,document.addEventListener("error",t=>{const n=t.target;!n||n.tagName!=="IMG"||ni(n,n.getAttribute("src")||n.src||"")},!0),typeof MutationObserver=="function"&&(new MutationObserver(n=>{for(const r of n){if(r.type==="attributes"&&r.target.tagName==="IMG"){Wn(r.target);continue}r.addedNodes.forEach(Sl)}}).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["src"]}),document.querySelectorAll("img[src]").forEach(Wn)),!0):!1}let oi=null;function un(){return oi}function $l(e={}){oi=e;try{kl({api:e.api})}catch(t){console.warn("[CineFlow] 海报兜底加载初始化失败，已跳过",t)}try{ml()}catch(t){console.warn("[CineFlow] 投屏面板初始化失败，已跳过",t)}}const Ml=360,El=Ml+90,yr=.012;function Tl(e,t){return(e%t+t)%t}function Ll(){if([".player-modal.is-open",".detail-panel.is-open",".favorites-panel.is-open",".cast-panel.is-open"].some(n=>document.querySelector(n)))return!0;const t=document.querySelector("#settingsModal");return!!(t&&!t.classList.contains("is-hidden")&&getComputedStyle(t).display!=="none")}function Cl(){const e=document.activeElement;return e?/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)?!0:!!e.isContentEditable:!1}function Il({root:e,pages:t,onSwitch:n}={}){const r=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===!0,o=document.createElement("div");o.className="cf3-stage",o.innerHTML=`
    <div class="cf3-veil" aria-hidden="true"></div>
    <div class="cf3-scene"><div class="cf3-slot"></div></div>
  `,e.append(o);const a=document.querySelector(".titlebar"),i=()=>{const x=a?.offsetHeight,P=Number.isFinite(x)&&x>0?Math.round(x)+2:76;o.style.top=`${P}px`};i();const s=new ResizeObserver(i);a&&s.observe(a);const l=o.querySelector(".cf3-slot");let u=0,f=null,p=!0;function h(x){return t[x]?.el||null}function w(x){const P=t[x],O=P?.el;return O?(O.parentElement!==l&&(l.append(O),P.activate?.(),O.classList.add("cf3-warm")),O.style.visibility="visible",O.style.opacity="1",O.inert=!1,O):null}function m(x,P){let O=!1;const G=()=>{O||(O=!0,x())};try{requestAnimationFrame(G)}catch{}return window.setTimeout(G,P),G}function y(){return document.body.classList.contains("is-motion-throttled")}function g(x){const P=h(x);!P||P.parentElement!==l||x===u||P.style.opacity==="0"&&(P.style.opacity=String(yr),m(()=>{P.style.opacity===String(yr)&&(P.style.opacity="0")},90))}function A(){(window.requestIdleCallback||(P=>window.setTimeout(P,240)))(()=>{for(let P=1;P<t.length;P+=1)g(P)})}function R(){const x=u!==0;for(let P=1;P<t.length;P+=1){const O=h(P);if(!O||O.parentElement!==l)continue;const G=x&&P===u;O.style.visibility="visible",O.style.opacity=G?"1":"0",O.inert=!G,O.style.zIndex="",O.classList.remove("cf3-enter","cf3-leave","is-forward","is-backward","is-cover","is-reveal")}}function k(x,P){if(!p||x===u||x<0||x>=t.length)return;if(f&&b(),r){$(x);return}const O=u,G=typeof P=="boolean"?P:x>O,J=x===0?null:w(x);x!==0&&t[x].prepare?.();const F=O===0?null:h(O);J&&(J.style.zIndex="2"),F&&(F.style.zIndex="1"),o.classList.add("is-switching"),(O===0||x===0)&&o.classList.add("is-home-edge"),document.body.classList.add("cf3-switching"),f={from:O,to:x,entering:J,leaving:F,timer:0};const B=()=>{!f||f.from!==O||f.to!==x||(J&&(J.style.opacity="1",J.classList.add("cf3-enter",G?"is-forward":"is-backward")),F&&F.classList.add("cf3-leave",G?"is-forward":"is-backward",x===0?"is-reveal":"is-cover"),f.timer=window.setTimeout(b,El))};J&&!y()?(J.offsetHeight,J.style.opacity=String(yr),m(B,40)):B()}function b(){if(!f)return;const{from:x,to:P,entering:O,leaving:G}=f;clearTimeout(f.timer),f=null,u=P,R(),O&&(O.style.zIndex=""),G&&(G.style.zIndex=""),o.classList.remove("is-switching","is-home-edge"),document.body.classList.remove("cf3-switching"),t[x].leave?.(),t[x].settle?.(),n?.(P),A()}function $(x){f&&b(),t[u].leave?.(),u=x,x!==0&&(w(x),t[x].prepare?.()),R(),n?.(x)}function I(x){k(Tl(u+x,t.length),x>0)}window.addEventListener("keydown",x=>{if(x.ctrlKey||x.metaKey||x.shiftKey||!p||Ll()||Cl())return;const P=x.altKey?t.findIndex((G,J)=>String(J+1)===x.key):-1,O=x.key==="ArrowRight"?1:x.key==="ArrowLeft"?-1:0;P===-1&&!O||(x.preventDefault(),P!==-1?k(P):I(O))},!0),window.addEventListener("resize",()=>{i(),f&&b()}),document.addEventListener("visibilitychange",()=>{!document.hidden&&f&&b()});function T(x){if(x!==p){if(p=x,!x){f&&b(),u=0,R();return}R()}}return R(),{layer:o,slot:l,go:k,step:I,setEnabled:T,getCurrent:()=>u,isSwitching:()=>!!f,preload(x){f||x===u||w(x)&&(R(),g(x))},dispose(){f&&b(),s.disconnect(),o.remove()}}}const Yo=1800*1e3,Pl=4500,lt=new Map,xn=new Map,Ct=new Map,er={open:!1};let Yn=null,Go=!1;const gt=e=>String(e||"").replace(/[\u200b-\u200d\ufeff]/g,"").replace(/\s+/g," ").trim(),fo=/^https:\/\/[a-z0-9-]+\.doubanio\.com\//i;function fn(){return window.cineflowDouban}function Al(e){const t=gt(e.querySelector("h3")?.textContent);if(!t)return null;const n=gt(e.querySelector("p")?.textContent),r=(/^(19|20)\d{2}/.exec(n)||[])[0]||"",o=e.dataset.mediaType==="tv"?"tv":"movie";return{title:t,year:r,mediaType:o}}async function Hr(e){const t=String(e||"");if(!fo.test(t))return"";if(Ct.has(t))return Ct.get(t);const n=await fn()?.image({url:t}).catch(()=>null),r=n?.ok?`data:${n.contentType||"image/jpeg"};base64,${n.base64}`:"";return r&&Ct.set(t,r),r}function Ur(){return window.cineflowEveryfilm}async function Rl({title:e,year:t,mediaType:n,wantDataUrl:r=!0}={}){const o=Ur();if(!o?.lookup||!e)return"";const a=await o.lookup({query:e,year:t,type:n}).catch(()=>null),i=/^https:\/\//i.test(String(a?.item?.poster||""))?a.item.poster:"";if(!i)return"";if(!r)return i;if(Ct.has(i))return Ct.get(i);const s=await o.image({url:i}).catch(()=>null),l=s?.ok?`data:${s.contentType||"image/jpeg"};base64,${s.base64}`:"";return l&&Ct.set(i,l),l}function Nl(e){return new Promise(t=>{let n=0,r=!1;for(const o of e)Promise.resolve().then(o).then(a=>{!r&&a&&(r=!0,t(a))}).catch(()=>{}).then(()=>{n+=1,!r&&n>=e.length&&t("")})})}async function Xo({title:e,year:t,mediaType:n,cover:r=""}){if(fo.test(String(r||"")))return await Hr(r);const o=await fn()?.poster({title:e,year:t,type:n}).catch(()=>null);return o?.ok?await Hr(o.url):""}async function Bl({title:e,year:t,mediaType:n,cover:r=""}){const o=`${n}:${e}:${t}`;if(lt.has(o)){const s=lt.get(o);if(s&&Date.now()-s.at>Yo)lt.delete(o);else return s?.data||""}if(xn.has(o))return xn.get(o);const a=fo.test(String(r||"")),i=(async()=>{try{const l=await Nl(a?[()=>Xo({title:e,year:t,mediaType:n,cover:r})]:[()=>Rl({title:e,year:t,mediaType:n}),()=>Xo({title:e,year:t,mediaType:n,cover:r})]);return lt.set(o,l?{at:Date.now(),data:l}:{at:Date.now()-Yo+60*1e3,data:""}),lt.size>300&&lt.delete(lt.keys().next().value),l}finally{xn.delete(o)}})();return xn.set(o,i),i}function Dl(e,t){if(!t){e.dataset.cf8Poster="";return}const n=e.querySelector(".poster-frame");if(!n)return;let r=n.querySelector("img");r||(r=document.createElement("img"),r.alt=`${gt(e.querySelector("h3")?.textContent)} 海报`,r.decoding="async",r.loading="eager",n.insertBefore(r,n.firstChild)),r.classList.add("cf8-poster-loaded"),r.src=t,e.dataset.cf8Poster="douban"}async function Gn(e){if(!(e instanceof Element)||e.dataset.cf8Poster==="douban")return;const t=Al(e);if(!t)return;const n=e.querySelector(".poster-frame img"),r=!n||n.complete&&n.naturalWidth===0;if(n&&!r){if(e.dataset.cf8PosterWatch)return;e.dataset.cf8PosterWatch="1";const a=()=>{n.complete&&n.naturalWidth>0||(e.dataset.cf8PosterWatch="",delete e.dataset.cf8Poster,Gn(e))};n.addEventListener("load",()=>{e.dataset.cf8PosterWatch=""},{once:!0}),n.addEventListener("error",()=>{e.dataset.cf8PosterWatch="",delete e.dataset.cf8Poster,Gn(e)},{once:!0}),window.setTimeout(a,Pl);return}e.dataset.cf8Poster="pending";const o=await Bl({...t,cover:e.__cf8Item?.cover||""});Dl(e,o)}let Sn=null;const vr=new WeakMap;function Xn(e){if(!("IntersectionObserver"in window)){Gn(e);return}vr.get(e)||(vr.set(e,!0),Sn||(Sn=new IntersectionObserver(t=>{for(const n of t)n.isIntersecting&&(Sn.unobserve(n.target),vr.delete(n.target),Gn(n.target))},{rootMargin:"320px 0px"})),Sn.observe(e))}function Ko(e=document){for(const t of e.querySelectorAll(".movie-card"))Xn(t)}function _l(){let e=document.querySelector(".cf8-sheet");if(e)return e;const t=document.querySelector("#app");return t?(e=document.createElement("div"),e.className="cf8-sheet",e.setAttribute("role","dialog"),e.setAttribute("aria-hidden","true"),e.setAttribute("aria-label","豆瓣影片资料"),e.innerHTML=`
    <div class="cf8-sheet-card">
      <button type="button" class="cf8-sheet-close" aria-label="关闭">×</button>
      <div class="cf8-sheet-poster"><div class="cf8-sheet-ph">豆瓣</div></div>
      <div class="cf8-sheet-body">
        <h3 class="cf8-sheet-title"></h3>
        <p class="cf8-sheet-meta"></p>
        <p class="cf8-sheet-intro"></p>
        <div class="cf8-sheet-cast"></div>
        <div class="cf21-play" hidden>
          <div class="cf21-play-head">
            <span class="cf21-badge"></span>
            <span class="cf21-play-meta"></span>
          </div>
          <p class="cf21-status"></p>
          <div class="cf21-play-lines"></div>
        </div>
        <p class="cf8-sheet-note">豆瓣数据 · 播放需 TMDB 凭证</p>
        <p class="cf16-sheet-credit" hidden><button type="button" class="cf16-credit-link">every.film</button><span>海报与评分 · CC-BY-SA 4.0</span></p>
      </div>
    </div>
  `,t.append(e),e.addEventListener("click",n=>{const r=n.target instanceof Element?n.target:null;if(r){if(r.closest(".cf16-credit-link")){window.cineflow?.openExternal?.("https://every.film/zh-CN");return}if(r.closest(".cf21-ep")){n.preventDefault(),n.stopPropagation(),jl(r.closest(".cf21-ep"));return}(r.closest(".cf8-sheet-close")||r===e)&&Jo()}}),document.addEventListener("keydown",n=>{n.key==="Escape"&&er.open&&Jo()}),e):null}function Jo(){const e=document.querySelector(".cf8-sheet");e?.classList.remove("is-open"),e?.setAttribute("aria-hidden","true"),er.open=!1}async function Qo(e){const t=_l();if(!t||!e)return;er.open=!0,t.classList.add("is-open"),t.setAttribute("aria-hidden","false");const n=t.querySelector(".cf16-sheet-credit");n&&(n.hidden=!0),t.querySelector(".cf8-sheet-title").textContent=e.title||"",t.querySelector(".cf8-sheet-meta").textContent=[e.year,e.rating?`★ ${e.rating}`:"",e.mediaType==="tv"?"剧集":"电影"].filter(Boolean).join(" · "),t.querySelector(".cf8-sheet-intro").textContent="",t.querySelector(".cf8-sheet-cast").textContent="";const r=t.querySelector(".cf8-sheet-poster");r.querySelector("img")?.remove(),Ul(),si("豆瓣数据 · 播放需 TMDB 凭证"),nn.run+=1,li(e);const o=e.cover||e.cf8Cover||"",a=o?await Hr(o):"";if(a){const u=document.createElement("img");u.src=a,u.alt=`${e.title} 海报`,r.appendChild(u)}const i=await fn()?.subject({id:e.id,type:e.mediaType}).catch(()=>null);if(!i?.ok){await ql(t,e),Zo(e,t.querySelector(".cf8-sheet-title").textContent);return}const s=i.subject;t.querySelector(".cf8-sheet-title").textContent=s.titleWithYear||e.title,t.querySelector(".cf8-sheet-meta").textContent=[s.rating?`★ ${s.rating}`:"",s.genres.join(" / "),s.region,s.duration,s.episodes?`${s.episodes} 集`:""].filter(Boolean).join(" · "),t.querySelector(".cf8-sheet-intro").textContent=s.intro||"";const l=[s.directors.length?`导演：${s.directors.join(" / ")}`:"",s.actors.length?`主演：${s.actors.slice(0,5).join(" / ")}`:""].filter(Boolean).join(`
`);t.querySelector(".cf8-sheet-cast").textContent=l,Zo({...e,year:s.year||e.year,mediaType:s.mediaType||e.mediaType},s.title||e.title)}function Zo(e,t){const n=document.querySelector(".cf21-play");if(!n||!n.__cf21Done||n.__cf21Resource)return;const r=gt(e?.year);!r||n.__cf21AskedYear===r||(n.__cf21AskedYear=r,li({...e,title:gt(t)||e.title}))}async function ql(e,t){const n=Ur();if(!n?.lookup)return;const r=await n.lookup({query:t.title,year:t.year,type:t.mediaType}).catch(()=>null);if(!r?.ok||!r.item)return;const o=r.item.meta||{},a=o.zhTitle||r.item.title;a&&(e.querySelector(".cf8-sheet-title").textContent=[a,o.year||r.item.year].filter(Boolean).join(" "));const i=Number(o.tmdbRating||r.item.rating);if(Number.isFinite(i)&&i>0){const l=e.querySelector(".cf8-sheet-meta").textContent;e.querySelector(".cf8-sheet-meta").textContent=[`★ ${i.toFixed(1)}`,l].filter(Boolean).join(" · ")}const s=/^https:\/\//i.test(String(r.item.poster||""))?r.item.poster:"";if(s&&!e.querySelector(".cf8-sheet-poster img")){const l=await Ur()?.image?.({url:s}).catch(()=>null);if(l?.ok){const u=document.createElement("img");u.src=`data:${l.contentType||"image/jpeg"};base64,${l.base64}`,u.alt=`${a||t.title} 海报`,e.querySelector(".cf8-sheet-poster").appendChild(u)}}if(s||Number.isFinite(i)){const l=e.querySelector(".cf16-sheet-credit");l&&(l.hidden=!1)}}const nn={seq:0,run:0},Ol=3,Fl=12;function ai(e,t){const n=/(\d+)/.exec(String(e||""));return Number(n?.[1])||t+1}function ii(e,t){const n=String(e||"").trim();return/第.+[集话話期]/.test(n)?n:`第 ${ai(n,t)} 集`}function zl(e,t,n){const r=Array.isArray(t?.episodes)?t.episodes:[];if(!r.length||!Yn?.resourcePlaylists?.set)return"";const o=e.sourceName||"如意资源",a=e.title||"",i=t.name||`线路 ${n+1}`,s=`cf21-playlist-${nn.seq+1}`;return nn.seq+=1,Yn.resourcePlaylists.set(s,r.map((l,u)=>({url:l.url,kind:l.kind||"",format:l.format||"",needsResolve:!!l.needsResolve,title:a,sourceName:o,lineName:i,label:l.label||`播放 ${u+1}`,displayLabel:ii(l.label,u),episodeIndex:u,episodeNo:ai(l.label,u),total:r.length}))),s}function Hl(e){const t=window.__cineflowOpenResourcePlayer;if(typeof t!="function"){const n=document.querySelector("#toast");return n&&(n.textContent="播放器入口不可用",n.classList.remove("is-hidden"),window.setTimeout(()=>n.classList.add("is-hidden"),2200)),!1}return t(e),!0}function si(e){const t=document.querySelector(".cf8-sheet-note");t&&(t.textContent=e)}function br(e){const t=document.querySelector(".cf21-play");if(!t)return;const n=t.querySelector(".cf21-status"),r=t.querySelector(".cf21-play-lines");n&&(n.textContent=e||"",n.hidden=!e),r&&(r.innerHTML=""),t.hidden=!1}function Ul(){const e=document.querySelector(".cf21-play");if(!e)return null;e.hidden=!0,delete e.__cf21Resource,delete e.__cf21Done,delete e.__cf21AskedYear;const t=e.querySelector(".cf21-play-lines");t&&(t.innerHTML="");const n=e.querySelector(".cf21-play-meta");n&&(n.textContent="");const r=e.querySelector(".cf21-status");return r&&(r.textContent="",r.hidden=!0),e}function Vl(e,t){const n=(t.lines||[]).filter(l=>Array.isArray(l.episodes)&&l.episodes.length).slice(0,Ol),r=t.sourceName||"如意资源",o=e.querySelector(".cf21-badge"),a=e.querySelector(".cf21-play-meta"),i=e.querySelector(".cf21-play-lines");o&&(o.textContent=r),a&&(a.textContent=[t.year,t.isSeries?`${t.seasonEpisodeCount||t.episodeCount||1} 集`:t.remarks||"可播放",t.formats?.length?t.formats.join(" / "):""].filter(Boolean).join(" · ")),e.__cf21Resource=t,i.innerHTML="";const s=e.querySelector(".cf21-status");s&&(s.textContent="",s.hidden=!0),n.forEach((l,u)=>{const f=l.name||`线路 ${u+1}`,p=document.createElement("div");p.className="cf21-line";const h=document.createElement("span");h.className="cf21-line-name",h.textContent=f;const w=document.createElement("div");w.className="cf21-line-eps";const m=l.episodes.slice(0,t.isSeries?Fl:4);if(m.forEach((y,g)=>{const A=document.createElement("button");A.type="button",A.className="cf21-ep",A.dataset.line=String(u),A.dataset.episode=String(g),A.textContent=t.isSeries?ii(y.label,g):y.label||"播放",w.appendChild(A)}),l.episodes.length>m.length){const y=document.createElement("span");y.className="cf21-more",y.textContent=`播放器内显示全部 ${l.episodes.length} 集`,w.appendChild(y)}p.append(h,w),i.appendChild(p)}),e.hidden=!1}function jl(e){const n=document.querySelector(".cf21-play")?.__cf21Resource;if(!n||!e)return!1;const r=Number(e.dataset.line)||0,o=Number(e.dataset.episode)||0,a=(n.lines||[]).filter(u=>Array.isArray(u.episodes)&&u.episodes.length)[r]||n.lines?.[0],i=a?.episodes?.[o]||a?.episodes?.[0];if(!i)return!1;const s=zl(n,a,r),l=n.sourceName||"如意资源";return Hl({url:i.url,kind:i.kind,format:i.format,needsResolve:i.needsResolve,playlistId:s,episodeIndex:o,title:n.title||"",sourceName:l,lineName:a?.name||`线路 ${r+1}`,label:i.label||"播放"})}async function li(e){const t=document.querySelector(".cf21-play");if(!t||t.__cf21Resource||Yn?.credential?.configured)return;const n=t.querySelector(".cf21-badge");n&&(n.textContent="如意资源");const r=window.cineflowFallbackPlay,o=gt(e?.title);if(!r?.playSource||o.length<2){br("暂不可用");return}const a=nn.run;t.__cf21Done=!1,br("正在找线路…");let i=null;try{i=await r.playSource({title:o,originalTitle:gt(e?.originalTitle)||o,year:String(e?.year||""),mediaType:e?.mediaType==="tv"?"tv":"movie"})}catch{i=null}if(t.__cf21Done=!0,!(!er.open||a!==nn.run)){if(!i?.ok||!i.resource){br(i?.disabled?"外部源已关闭":"这部没找到可播线路");return}Vl(t,i.resource),si("豆瓣数据 · 下方线路可直接播")}}async function Bn({media:e="all",genre:t="",page:n=1,pageSize:r=24}={}){const o=fn()?.hot;if(!o)return[];const a=e==="tv"?"tv":"movie",i=t||"热门",s=Math.max(0,(Number(n)-1)*r),l=await o({type:a,tag:i,pageStart:s,pageSize:r}).catch(()=>null);return(l?.ok?l.items:[]).map(f=>({id:Number(f.id)||f.id,mediaType:a,title:f.title,releaseDate:"",voteAverage:Number(f.rating)||0,voteCount:0,posterPath:"",cf8Douban:!0,cf8Cover:f.cover,cf8Rating:f.rating}))}async function Wl(e={}){const t=e.media||"all";if(t!=="all")return Bn({media:t,genre:e.genre?.name||"",page:e.page||1});const[n,r]=await Promise.all([Bn({media:"movie",genre:e.genre?.name||"",page:e.page||1,pageSize:12}),Bn({media:"tv",genre:e.genre?.name||"",page:e.page||1,pageSize:12})]),o=[];for(let a=0;a<Math.max(n.length,r.length);a+=1)n[a]&&o.push(n[a]),r[a]&&o.push(r[a]);return o}function Yl(e,t,n){if(e){e.innerHTML="";for(const r of n){const o=document.createElement("article");o.className="movie-card",o.tabIndex=0,o.dataset.cf8Douban="1";const a=r.cf8Rating?`★ ${r.cf8Rating}`:"★—";o.innerHTML=`
      <div class="poster-frame">
        <div class="cf8-ph">豆瓣</div>
        <div class="score-pill">${wr(a)} · ${r.mediaType==="tv"?"剧集":"电影"}</div>
      </div>
      <h3>${wr(r.title)}</h3>
      <p>${wr(t)}</p>
    `,o.__cf8Item=Object.assign({},r,{cover:r.cf8Cover||r.cover||""}),e.appendChild(o),Xn(o)}}}function wr(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function ea(e,{media:t,title:n,debug:r}){if(!e||e.dataset.cf8Filling===t)return!1;if(e.querySelector(".movie-card:not([data-cf8-douban])")||e.querySelector("[data-cf8-douban]"))return!0;if(!(e.querySelector(".rail-empty, .empty-state")||e.childElementCount===0))return!1;e.dataset.cf8Filling=t;try{const a=await Bn({media:t,pageSize:18});return r.lastFetch={...r.lastFetch,[t]:a.length},a.length?(Yl(e,n,a),r.filled+=1,!0):!1}finally{delete e.dataset.cf8Filling}}async function ta(){const e=document.querySelector("#personalizedRail"),t=document.querySelector("#trendingRail");if(!e||!t)return!1;const n=window.__cf8DoubanDebug||(window.__cf8DoubanDebug={attempts:0,filled:0,lastError:""});n.attempts+=1;try{return(await Promise.all([ea(e,{media:"movie",title:"热门电影",debug:n}),ea(t,{media:"tv",title:"热门剧集",debug:n})])).some(Boolean)}catch(r){return n.lastError=String(r?.message||r).slice(0,160),!1}}function Gl(){return fn()?.hot?(Go||(Go=!0,Ko(),[3e3,9e3,2e4,45e3].forEach(t=>window.setTimeout(()=>Ko(),t)),new MutationObserver(t=>{for(const n of t)for(const r of n.addedNodes)if(r instanceof Element){r.matches?.(".movie-card")&&Xn(r);for(const o of r.querySelectorAll?.(".movie-card")||[])Xn(o)}}).observe(document.querySelector("#app")||document.body,{childList:!0,subtree:!0}),document.addEventListener("click",t=>{const n=t.target instanceof Element?t.target.closest("[data-cf8-douban]"):null;n&&(t.preventDefault(),t.stopPropagation(),n.__cf8Item&&Qo(n.__cf8Item))},!0),document.addEventListener("keydown",t=>{if(t.key!=="Enter"&&t.key!==" ")return;const n=t.target instanceof Element?t.target.closest("[data-cf8-douban]"):null;n&&(t.preventDefault(),t.stopPropagation(),n.__cf8Item&&Qo(n.__cf8Item))},!0),document.addEventListener("mouseover",t=>{t.target instanceof Element&&t.target.closest("[data-cf8-douban]")&&t.stopPropagation()},!0),window.cineflow.getCredentialState().then(t=>{if(t?.configured)return;let n=0;const r=window.setInterval(async()=>{n+=1,await ta().catch(()=>!1),(document.querySelector("#personalizedRail .movie-card:not([data-cf8-douban]), #trendingRail .movie-card:not([data-cf8-douban])")||n>=30)&&window.clearInterval(r)},1200);ta().catch(()=>!1)}).catch(()=>{})),!0):!1}function Xl(e={}){Yn=e.state||null;try{return Gl()}catch(t){return console.warn("[CineFlow] 豆瓣兜底装配失败，已跳过",t),!1}}const xr=[{id:"popularity",label:"热度",movie:"popularity.desc",tv:"popularity.desc"},{id:"rating",label:"评分",movie:"vote_average.desc",tv:"vote_average.desc"},{id:"latest",label:"最新",movie:"primary_release_date.desc",tv:"first_air_date.desc"},{id:"oldest",label:"最早",movie:"primary_release_date.asc",tv:"first_air_date.asc"}],na=[{id:"all",label:"全部"},{id:"movie",label:"电影"},{id:"tv",label:"节目"}],ra=[{id:"",label:"全部地区"},{id:"CN",label:"中国大陆"},{id:"HK",label:"中国香港"},{id:"TW",label:"中国台湾"},{id:"US",label:"美国"},{id:"JP",label:"日本"},{id:"KR",label:"韩国"},{id:"GB",label:"英国"},{id:"FR",label:"法国"},{id:"DE",label:"德国"},{id:"IN",label:"印度"},{id:"TH",label:"泰国"},{id:"CA",label:"加拿大"},{id:"AU",label:"澳大利亚"},{id:"ES",label:"西班牙"},{id:"IT",label:"意大利"}],Kl=["喜剧","爱情","恐怖","动作","科幻","剧情","犯罪","奇幻","悬疑","惊悚","家庭","冒险","动画","纪录","历史","音乐","战争","西部","儿童","新闻","真人秀","脱口秀"],Jl="https://image.tmdb.org/t/p",Ql="w342",Zl=420,ec=18,tc=8,ci="pre2000";function oa(e){const t=Kl.findIndex(n=>String(e||"").includes(n));return t===-1?99:t}function nc(e){return String(e||"").replace(/片$/,"").trim()}function Sr(e){const t=Array.isArray(e?.genres)?e.genres:[],n=[];for(const r of t){const o=String(r?.name||"").trim(),a=nc(o);!a||/与|\/|&/.test(o)||Number.isFinite(Number(r.id))&&(n.some(i=>i.label===a)||n.push({id:Number(r.id),label:a,name:a}))}return n.sort((r,o)=>oa(r.label)-oa(o.label))}function rc(e){if(!e)return"";const t=String(e);return/^(https?:|data:)/i.test(t)?t:`${Jl}/${Ql}${e}`}function oc(e){return Number(e.voteAverage||0).toFixed(1)}function ac(e,t){const r=`${t.mediaType==="tv"?"tv":"movie"}:${t.id}`;if(!t.cf8Douban)try{e?.cardMovies?.set&&e.cardMovies.set(r,t)}catch{}return r}function ic(e,t,n){const r=ac(t,e),o=document.createElement("article");o.className="movie-card",o.tabIndex=0,o.dataset.movieId=String(e.id),o.dataset.mediaType=e.mediaType==="tv"?"tv":"movie",o.dataset.contentKey=r,e.cf8Douban&&(o.dataset.cf8Douban="1",o.__cf8Item={id:e.cf8Id||e.id,title:e.title,mediaType:e.mediaType==="tv"?"tv":"movie",cover:e.cf8Cover||e.posterPath||"",rating:e.cf8Rating||""});const a=rc(e.posterPath),i=String(e.releaseDate||"").slice(0,4);return o.innerHTML=`
    <div class="poster-frame">
      ${a?`<img src="${a}" alt="${n(e.title)} 海报" decoding="async" fetchpriority="low" />`:'<div class="poster-fallback">No Poster</div>'}
      <div class="score-pill">★ ${oc(e)} · ${o.dataset.mediaType==="tv"?"节目":"电影"}</div>
    </div>
    <h3>${n(e.title)}</h3>
    <p>${n(i||"未知年份")}</p>
  `,o}function sc(e){return e===ci?{yearTo:"1999-12-31"}:e?{year:e}:{}}async function lc(e,{genre:t,media:n,sort:r,year:o,region:a,dateFrom:i,dateTo:s,page:l}){const u=r.movie,f=r.tv,p={...sc(o==="custom"?null:o),originCountry:a||void 0,releaseDateFrom:o==="custom"&&i||void 0,releaseDateTo:o==="custom"&&s||void 0,minVotes:r.id==="rating"?50:0};if(n!=="all")return e.discoverMovies({mediaType:n,genreId:t?t.id:void 0,sortBy:n==="tv"?f:u,...p,page:l});const[h,w]=await Promise.all([e.discoverMovies({mediaType:"movie",genreId:t?.id,sortBy:u,...p,page:l}),e.discoverMovies({mediaType:"tv",genreId:t?.id,sortBy:f,...p,page:l})]),m=r.id==="rating"?g=>g.voteAverage||0:r.id==="popularity"?g=>g.popularity||0:g=>g.releaseDate||"",y=r.id==="oldest"?1:-1;return[...h||[],...w||[]].sort((g,A)=>{const R=m(g),k=m(A);return(R<k?-1:R>k?1:0)*y})}async function cc(e,t){try{return await lc(e,t)}catch(n){if(t.region||t.year||t.sort.id!=="popularity")throw n;const r=await Wl(t).catch(()=>[]);if(r.length)return r;throw n}}function dc({api:e,state:t,escapeHtml:n=r=>String(r??"")}={}){const r=document.createElement("div");r.className="cf3-page cf3-library";let o=Sr(t);const a=new Date().getFullYear(),i=[{year:null,label:"不限"},...Array.from({length:a-1999},(X,z)=>({year:a-z,label:String(a-z)})),{year:ci,label:"2000 年以前"},{year:"custom",label:"自定义日期范围"}];r.innerHTML=`
    <div class="cf3-scroll">
      <header class="cf3-head">
        <p class="eyebrow">LIBRARY</p>
        <div class="cf3-heading-row">
          <h2 class="cf3-title">分类片库</h2>
          <button class="cf3-chip cf3-reset" type="button">重置筛选</button>
        </div>
        <p class="cf3-filter-help">组合选择地区、类别和发布时间，发现想看的电影与节目。</p>
        <div class="cf3-media cf3-no-drag" role="group" aria-label="媒体类型"></div>
      </header>
      <div class="cf3-criteria cf3-no-drag">
        <div class="cf3-filter"><span class="cf3-filter-label">地区</span><div class="cf3-option-row cf3-region-row" role="group" aria-label="地区"></div></div>
        <div class="cf3-filter"><span class="cf3-filter-label">时间</span><div class="cf3-option-row cf3-year-row" role="group" aria-label="发布时间"></div></div>
        <div class="cf3-filter"><span class="cf3-filter-label">排序</span><div class="cf3-option-row cf3-sort-row" role="group" aria-label="排序"></div></div>
      </div>
      <form class="cf3-date-range cf3-no-drag" hidden>
        <label class="cf3-field">开始日期<input class="cf3-date-from" type="date" aria-label="开始日期" /></label>
        <span class="cf3-date-separator">至</span>
        <label class="cf3-field">结束日期<input class="cf3-date-to" type="date" aria-label="结束日期" /></label>
        <button class="cf3-chip" type="submit">应用日期</button>
        <p class="cf3-date-error" role="alert" hidden></p>
      </form>
      <div class="cf3-filter">
        <span class="cf3-filter-label">类别</span>
        <div class="cf3-styles cf3-no-drag" role="group" aria-label="风格分类"></div>
      </div>
      <p class="cf3-filter-summary" role="status"></p>
      <div class="cf3-grid" aria-live="polite"></div>
      <div class="cf3-foot">
        <button class="rail-more-button cf3-more" type="button" hidden>加载更多</button>
      </div>
    </div>
    <button class="cf3-totop cf3-no-drag" type="button" title="回到顶部" aria-label="回到顶部">
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 16V5" /><path d="M5.5 9.5 10 5l4.5 4.5" /></svg>
    </button>
  `;const s=r.querySelector(".cf3-scroll"),l=r.querySelector(".cf3-media"),u=r.querySelector(".cf3-styles"),f=r.querySelector(".cf3-grid"),p=r.querySelector(".cf3-more"),h=r.querySelector(".cf3-totop"),w=r.querySelector(".cf3-region-row"),m=r.querySelector(".cf3-year-row"),y=r.querySelector(".cf3-sort-row"),g=r.querySelector(".cf3-date-range"),A=r.querySelector(".cf3-date-from"),R=r.querySelector(".cf3-date-to"),k=r.querySelector(".cf3-date-error"),b=r.querySelector(".cf3-filter-summary"),$={genre:null,media:"all",sort:xr[0],year:null,region:"",dateFrom:"",dateTo:""};let I=!1;const T=new Map,x=new Set;let P=1,O=0,G=!1,J=!1,F=!0,B="";function C(X,z,ie,D,W){const Z=X.scrollLeft,te=[...X.children].indexOf(document.activeElement);X.innerHTML="",z.forEach(Ie=>{const Ae=document.createElement("button");Ae.type="button",Ae.className="cf3-chip",Ae.textContent=Ie.label,Ae.classList.toggle("is-on",!!ie(Ie)),Ae.setAttribute("aria-pressed",String(!!ie(Ie))),Ae.addEventListener("click",()=>D(Ie)),X.appendChild(Ae)}),X.scrollLeft=Z,te>=0&&X.children[te]?.focus({preventScroll:!0})}function q(){C(l,na,z=>z.id===$.media,z=>{$.media!==z.id&&($.media=z.id,q(),V(!0))}),C(u,[{label:"全部",id:0},...o],z=>z.id===0?!$.genre:$.genre?.id===z.id,z=>{const ie=z.id===0?null:z;($.genre?.id||0)!==(ie?.id||0)&&($.genre=ie,q(),V(!0))}),C(w,ra,z=>z.id===$.region,z=>{$.region!==z.id&&($.region=z.id,q(),V(!0))}),C(m,i,z=>z.year===(I?"custom":$.year),z=>{if(I=z.year==="custom",I){q();return}$.year=z.year,q(),V(!0)}),C(y,xr,z=>z.id===$.sort.id,z=>{$.sort.id!==z.id&&($.sort=z,q(),V(!0))}),g.hidden=!I,k.hidden=!0;const X=$.year==="custom"?`${$.dateFrom||"不限开始"} 至 ${$.dateTo||"不限结束"}`:i.find(z=>z.year===$.year)?.label||"不限";b.textContent=[na.find(z=>z.id===$.media).label,ra.find(z=>z.id===$.region).label,$.genre?.label||"全部类别",`发布时间：${X}`,`${$.sort.label}排序`].join(" · ")}for(const X of[w,m,y])X.addEventListener("wheel",z=>{if(z.ctrlKey||z.shiftKey||Math.abs(z.deltaX)>=Math.abs(z.deltaY))return;const ie=z.deltaY*(z.deltaMode===1?16:z.deltaMode===2?X.clientWidth:1),D=Math.max(0,Math.min(X.scrollWidth-X.clientWidth,X.scrollLeft+ie));D!==X.scrollLeft&&(X.scrollLeft=D,z.preventDefault())},{passive:!1});g.addEventListener("submit",X=>{X.preventDefault();const z=A.value,ie=R.value;if(!z&&!ie||z&&ie&&z>ie){k.textContent=!z&&!ie?"请至少选择一个日期。":"开始日期不能晚于结束日期。",k.hidden=!1;return}$.year="custom",I=!0,$.dateFrom=z,$.dateTo=ie,q(),V(!0)}),r.querySelector(".cf3-reset").addEventListener("click",()=>{Object.assign($,{genre:null,media:"all",sort:xr[0],year:null,region:"",dateFrom:"",dateTo:""}),A.value="",R.value="",I=!1,q();for(const X of[w,m,y])X.scrollLeft=0;V(!0)});function E(){const X=Sr(t);X.length&&X.map(z=>z.id).join()!==o.map(z=>z.id).join()&&(o=X,q())}q();function M(){return`${v()}|${$.genre?.id||0}|${$.media}|${$.sort.id}|${$.year||0}|${$.region}|${$.dateFrom}|${$.dateTo}|${P}`}function v(){const X=t?.credential;return`${X?.configured?"1":"0"}:${X?.type||""}`}function S(X){const z=document.createDocumentFragment();let ie=0;for(const D of X||[]){const W=`${D.mediaType==="tv"?"tv":"movie"}:${D.id}`;x.has(W)||(x.add(W),z.appendChild(ic(D,t,n)),ie+=1)}return f.appendChild(z),ie}function N(X,z){z||(f.innerHTML="",x.clear());const ie=S(X);return!z&&!ie&&!(X||[]).length&&(f.innerHTML='<p class="cf3-empty">暂无符合筛选条件的作品，请调整地区、类别或发布时间。</p>'),ie}function H(){if(!F){p.hidden=!0;return}p.hidden=!1,p.disabled=G,p.textContent=G?"加载中...":J?"重试":"加载更多"}async function V(X){X&&(J=!1,P=1,F=!0,s.scrollTop=0,T.has(M())||(f.innerHTML=le()));const z=++O,ie=M();G=!0,r.classList.add("is-loading"),H();try{const D=T.get(ie),W=D||await cc(e,{...$,page:P});if(z!==O)return;D||T.set(ie,W||[]);const Z=W||[],te=N(Z,!X);r.querySelector(".cf3-load-error")?.remove(),(!X&&!te||Z.length<ec)&&(F=!1)}catch{if(z!==O)return;if(X)f.innerHTML='<p class="cf3-empty">筛选加载失败，请检查 TMDB 配置和网络后重试。</p>';else{P-=1;const W=document.createElement("p");W.className="cf3-empty cf3-load-error",W.textContent="加载更多失败，请重试。",r.querySelector(".cf3-load-error")?.remove(),f.append(W)}F=!0,J=X}finally{z===O&&(G=!1,r.classList.remove("is-loading"),H())}}function le(){return'<article class="movie-card skeleton"><div></div><span></span><small></small></article>'.repeat(tc)}function oe(){if(!(G||!F)){if(J){V(!0);return}P+=1,V(!1)}}function Re(){if(G||!F)return;s.scrollHeight-s.scrollTop-s.clientHeight<Zl&&oe()}const Se=320;function it(){const X=s.scrollTop>Se;h.classList.toggle("is-visible",X),r.classList.toggle("is-scrolled",X)}return h.addEventListener("click",X=>{X.stopPropagation(),s.scrollTo?s.scrollTo({top:0,behavior:"smooth"}):s.scrollTop=0}),s.addEventListener("scroll",()=>{Re(),it()},{passive:!0}),s.addEventListener("wheel",()=>window.setTimeout(()=>{Re(),it()},80),{passive:!0}),p.addEventListener("click",oe),{el:r,async activate(){E();const X=await e?.getCredentialState?.().catch(()=>null);X&&t&&(t.credential=X);const z=v();if(!f.childElementCount){B=z,V(!0);return}B!==z&&(B=z,T.clear(),o=Sr(t),E(),V(!0))},settle(){}}}const di="cineflow:history:v3",ui=60,uc=5e3;let ee=null,kr=null,pe=null,Je=null;function ot(){try{const e=window.localStorage.getItem(di),t=e?JSON.parse(e):null;return Array.isArray(t)?t:[]}catch{return[]}}function bt(e){try{window.localStorage.setItem(di,JSON.stringify(e.slice(0,ui)))}catch{}}function fc(){kr||(kr=window.setTimeout(()=>{kr=null,bt(ee||ot())},uc))}function aa(){return ee||(ee=ot()),ee.slice()}function pc(e){ee||(ee=ot()),ee=ee.filter(t=>t.key!==e),bt(ee)}function hc(){ee=[],bt(ee)}function ia(e){ee||(ee=ot());const t=new Map(ee.map(n=>[n.key,n]));for(const n of e||[])n?.key&&!t.has(n.key)&&t.set(n.key,n);ee=[...t.values()].sort((n,r)=>(r.updatedAt||0)-(n.updatedAt||0)).slice(0,ui),bt(ee)}function fi(e,t){const n=`${t}:${e}`,r=[Je?.state?.detailsCache,Je?.state?.cardMovies];for(const o of r)try{const a=o?.get?.(n);if(a)return a}catch{}return null}function po(e,t){for(const n of t){const r=e?.[n];if(typeof r=="string"&&r)return r}return""}function ho(e){return po(e,["posterPath","backdropPath","poster_path","backdrop_path"])}function mo(e){return po(e,["releaseDate","firstAirDate","release_date","first_air_date"]).slice(0,4)}function mc(){ee||(ee=ot());let e=!1;return ee=ee.map(t=>{if(t?.posterPath&&t?.year&&t?.title)return t;const n=fi(t?.id,t?.mediaType==="tv"?"tv":"movie");if(!n)return t;const r={...t};return r.posterPath||(r.posterPath=ho(n)),r.year||(r.year=mo(n)),r.title||(r.title=po(n,["title","name"]).trim()),(r.posterPath!==t.posterPath||r.year!==t.year||r.title!==t.title)&&(e=!0),r}),e&&bt(ee),ee.slice()}const gc=12,sa=new Set;let $r=!1;function yc(e){const t=Je?.api;if(!t?.getMovieDetails||$r)return!1;ee||(ee=ot());const n=ee.filter(r=>r?.id&&!r.posterPath&&!sa.has(r.key)).slice(0,gc);if(!n.length)return!1;for(const r of n)sa.add(r.key);return $r=!0,(async()=>{let r=!1;for(const o of n)try{const a=await t.getMovieDetails(o.id,{mediaType:o.mediaType==="tv"?"tv":"movie"}),i=ee.find(u=>u.key===o.key);if(!i)continue;const s=ho(a),l=mo(a);s&&!i.posterPath&&(i.posterPath=s,r=!0),l&&!i.year&&(i.year=l,r=!0)}catch{}$r=!1,r&&(bt(ee),e?.())})(),!0}function go(){const e=document.querySelector(".player-episode-button.is-active");return e?e.textContent.replace(/\s+/g," ").trim().slice(0,40):""}function yo(){const e=Je?.state?.player;return!e||!e.open?{}:{sourceName:String(e.sourceName||""),lineName:String(e.lineName||""),label:String(e.label||""),episodeIndex:Number.isFinite(Number(e.episodeIndex))?Number(e.episodeIndex):0}}function pi(e){return`vod:${Te(e?.title)}|${e?.year||""}`}function hi(e){return{sourceKey:String(e.sourceKey||""),vodId:String(e.vodId||""),sourceName:String(e.sourceName||""),lineName:String(e.lineName||""),lineIndex:Number(e.lineIndex)||0}}function mi(){return String(Je?.state?.player?.label||go()||"").trim().slice(0,40)}function gi(e){pe={key:pi(e),id:null,mediaType:"vod",title:String(e.title||document.querySelector("#playerTitle")?.textContent||"").trim(),poster:String(e.pic||""),posterPath:"",year:String(e.year||""),episode:mi(),progress:0,duration:0,updatedAt:Date.now(),vod:hi(e),...yo()}}function Vr(){const e=Je?.state;if(e?.player?.live)return;if(e?.player?.vod){gi(e.player.vod);return}if(e?.lastDetailMediaType==="vod")return;const t=e?.lastDetailMovieId;if(!t)return;const n=e.lastDetailMediaType||"movie",r=fi(t,n);pe={key:`${n}:${t}`,id:t,mediaType:n,title:(r?.title||r?.name||document.querySelector("#playerTitle")?.textContent||"").trim(),posterPath:ho(r),year:mo(r),episode:n==="tv"?go():"",progress:0,duration:0,updatedAt:Date.now(),...yo()}}function jr(e,t){if(Je?.state?.player?.live)return;const n=Je?.state?.player?.vod;if(n&&(!pe||pe.key!==pi(n))&&gi(n),pe||Vr(),!pe||(n&&pe.mediaType==="vod"&&(pe.vod=hi(n),pe.episode=mi()||pe.episode),!Number.isFinite(e)||e<=0))return;pe.progress=Math.round(e),pe.duration=Number.isFinite(t)&&t>0?Math.round(t):pe.duration,pe.updatedAt=Date.now(),pe.episode=pe.mediaType==="tv"&&go()||pe.episode;for(const[o,a]of Object.entries(yo()))a&&(pe[o]=a);ee||(ee=ot());const r=ee.filter(o=>o.key!==pe.key);ee=[{...pe},...r],fc()}function la(){const e=document.querySelector("#resourcePlayer");if(!e||e.dataset.cfHistoryBound)return e;e.dataset.cfHistoryBound="1";let t=0;return e.addEventListener("timeupdate",()=>{const n=Date.now();n-t<4e3||(t=n,jr(e.currentTime,e.duration))}),e.addEventListener("ended",()=>jr(e.duration||0,e.duration)),e}function ca(){return document.querySelector("#playerModal")?.classList.contains("is-open")}function vc(e={}){Je=e,ee||(ee=ot());const t=document.querySelector("#playerModal");if(!t)return!1;let n=!1;return new MutationObserver(()=>{const o=ca();if(o&&!n)la(),Vr();else if(!o&&n){const a=document.querySelector("#resourcePlayer");a&&jr(a.currentTime,a.duration),pe=null,bt(ee||[])}n=o}).observe(t,{attributes:!0,attributeFilter:["class"]}),la(),n=ca(),n&&Vr(),!0}const bc="https://image.tmdb.org/t/p",yi=864e5,wc=.96;function xc(e){return e?`${bc}/w185${e}`:""}function da(e){const t=Math.max(0,Math.round(e||0)),n=Math.floor(t/3600),r=Math.floor(t%3600/60),o=t%60,a=i=>String(i).padStart(2,"0");return n?`${n}:${a(r)}:${a(o)}`:`${r}:${a(o)}`}function Sc(e){if(!e.duration)return e.progress?`已看 ${da(e.progress)}`:"";if(e.progress/e.duration>=wc)return"已看完";const t=Math.max(0,Math.round((e.duration-e.progress)/60));return`看到 ${da(e.progress)} · 还剩 ${t} 分钟`}function kc(e){const t=Date.now()-e;if(t<36e5)return`${Math.max(1,Math.round(t/6e4))} 分钟前`;const n=Math.floor((new Date().setHours(0,0,0,0)-new Date(e).setHours(0,0,0,0))/yi);return n===0?`${Math.round(t/36e5)} 小时前`:n===1?`昨天 ${new Date(e).toTimeString().slice(0,5)}`:n<7?`${n} 天前`:`${new Date(e).getFullYear()}/${String(new Date(e).getMonth()+1).padStart(2,"0")}/${String(new Date(e).getDate()).padStart(2,"0")}`}function $c(e){const t=new Date().setHours(0,0,0,0),n=Math.floor((t-new Date(e).setHours(0,0,0,0))/yi);return n<=0?"今天":n===1?"昨天":n<7?"本周":"更早"}function Mc({state:e,escapeHtml:t=r=>String(r??""),resume:n=null}={}){const r=document.createElement("div");r.className="cf3-page cf3-history",r.innerHTML=`
    <header class="cf3-head">
      <p class="eyebrow">CONTINUE</p>
      <h2 class="cf3-title">播放历史</h2>
    </header>
    <div class="cf3-groups"></div>
    <footer class="cf3-history-foot">
      <button class="cf3-undo" type="button" hidden>撤销</button>
      <button class="cf3-clear" type="button" hidden>清空记录</button>
    </footer>
  `;const o=r.querySelector(".cf3-groups"),a=r.querySelector(".cf3-undo"),i=r.querySelector(".cf3-clear");let s=null,l=null,u=null;function f(k){const b=k.mediaType==="tv"?"tv":"movie",$=`${b}:${k.id}`;try{const I=e?.cardMovies?.get?.($)||{},T=(x,P)=>I[x]?I[x]:P;e?.cardMovies?.set($,{...I,id:k.id,mediaType:b,title:T("title",k.title),posterPath:T("posterPath",k.posterPath||null),backdropPath:T("backdropPath",null),overview:T("overview",""),releaseDate:T("releaseDate",k.year||""),voteAverage:T("voteAverage",0),voteCount:T("voteCount",0),genreIds:T("genreIds",[]),popularity:T("popularity",0),adult:T("adult",!1)})}catch{}return $}function p(k){if(k.mediaType==="vod")return"";const b=f(k);return`<article class="movie-card cf3-inert" tabindex="-1" data-movie-id="${t(String(k.id))}" data-media-type="${t(b.split(":")[0])}" data-content-key="${t(b)}"></article>`}function h(k,b){if(b?.mediaType==="vod"){window.__cineflowVod?.openByTitle?.(b.title,b.year,b.vod?.sourceKey);return}k.querySelector(".cf3-inert")?.click()}function w(k,b){s=b,a.textContent=`撤销「${k}」`,a.hidden=!1,window.clearTimeout(u),u=window.setTimeout(()=>{s=null,a.hidden=!0},8e3)}a.addEventListener("click",()=>{s&&(s(),s=null,a.hidden=!0,window.clearTimeout(u),g(!0))}),i.addEventListener("click",()=>{const k=aa();k.length&&(hc(),w("全部记录",()=>ia(k)),g(!0))});function m(k,b,$){k.addEventListener("click",async I=>{if(I.stopPropagation(),!k.disabled){k.disabled=!0,k.textContent="定位中...";try{await n?.resume(b,$.querySelector(".cf3-inert"))}finally{k.isConnected&&(k.disabled=!1,k.textContent="接着看")}}})}function y(k){const b=document.createElement("div");b.className="cf3-row";const $=k.poster||xc(k.posterPath),I=k.duration?Math.min(100,Math.round(k.progress/k.duration*100)):0;return b.innerHTML=`
      ${p(k)}
      <div class="cf3-thumb">${$?`<img src="${t($)}" alt="" decoding="async" referrerpolicy="no-referrer" />`:"<span>·</span>"}</div>
      <div class="cf3-row-info">
        <strong>${t(k.title)}</strong>
        <p>${t([k.mediaType==="tv"||k.mediaType==="vod"?k.episode:"",Sc(k)].filter(Boolean).join(" · "))}</p>
        <div class="cf3-progress slim"><i style="width:${I}%"></i></div>
      </div>
      <div class="cf3-row-actions">
        <button class="primary-button cf3-resume-btn" type="button">接着看</button>
        <button class="secondary-button cf3-detail-btn" type="button">详情</button>
      </div>
      <time>${t(kc(k.updatedAt))}</time>
      <button class="cf3-del" type="button" title="删除" aria-label="删除">×</button>
    `,m(b.querySelector(".cf3-resume-btn"),k,b),b.querySelector(".cf3-detail-btn").addEventListener("click",T=>{T.stopPropagation(),h(b,k)}),b.addEventListener("click",T=>{T.target.closest(".cf3-del, .cf3-row-actions")||h(b,k)}),b.querySelector(".cf3-del").addEventListener("click",T=>{T.stopPropagation();const x=aa().find(P=>P.key===k.key);pc(k.key),w(k.title,()=>{x&&ia([x])}),g()}),b}function g(k){yc(()=>g(!0));const b=mc().sort((I,T)=>(T.updatedAt||0)-(I.updatedAt||0)),$=A(b);!k&&$===l&&o.firstElementChild||(l=$,R(b))}function A(k){return k.map(b=>`${b.key}|${b.updatedAt||0}|${Math.round((b.progress||0)/(b.duration||1)*100)}`).join(";")}function R(k){if(o.innerHTML="",i.hidden=k.length===0,!k.length){o.innerHTML='<p class="cf3-empty">暂无记录</p>';return}const b=new Map;for(const $ of k){const I=$c($.updatedAt);b.has(I)||b.set(I,[]),b.get(I).push($)}for(const[$,I]of b){const T=document.createElement("section");T.className="cf3-group";const x=document.createElement("h3");x.className="cf3-group-title",x.textContent=$,T.appendChild(x);for(const P of I)T.appendChild(y(P));o.appendChild(T)}}return{el:r,activate(){g()},settle(){s=null,a.hidden=!0}}}const vi="cineflow:live:v1",ua=360*60*1e3,Ec=20,fa=400,Tc=200;function Lc(){try{const e=JSON.parse(localStorage.getItem(vi)||"{}");return{favorites:Array.isArray(e.favorites)?e.favorites:[],recent:Array.isArray(e.recent)?e.recent:[],source:String(e.source||""),probe:e.probe&&typeof e.probe=="object"?e.probe:{}}}catch{return{favorites:[],recent:[],source:"",probe:{}}}}function kn(e){try{localStorage.setItem(vi,JSON.stringify(e))}catch{}}function Cc(e){const t=new Date(e);return`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}function pa(e){return String(e??"").normalize("NFKC").toLowerCase().replace(/[\s\-_.·]+/g,"")}function Ic(e){return/\.flv(?:$|[?#])/i.test(e)?"flv":/\.(?:mp4|webm|m4v)(?:$|[?#])/i.test(e)?"mp4":/\.ts(?:$|[?#])/i.test(e)?"mpegts":"hls"}function Pc({escapeHtml:e=n=>String(n??""),toast:t=()=>{}}={}){const n=window.cineflowLive||null,r=document.createElement("div");r.className="cf3-page cf-live",r.innerHTML=`
    <header class="cf3-head cf-live-head">
      <div>
        <p class="eyebrow">LIVE</p>
        <h2 class="cf3-title">直播</h2>
      </div>
      <div class="cf-live-tools">
        <select class="settings-input cf-live-source" aria-label="直播源"></select>
        <button class="secondary-button cf-live-probe" type="button">测活排序</button>
        <button class="secondary-button cf-live-manage-btn" type="button">管理直播源</button>
      </div>
    </header>
    <div class="cf-live-manage is-hidden">
      <p class="studio-source-help">一行一个：<code>名称|M3U 地址|节目单地址（可选）</code>。也可以在设置 → 片源管理里添加包含直播源的订阅。</p>
      <textarea class="settings-input cf-live-input" rows="4" spellcheck="false" placeholder="示例|https://example.com/live.m3u|https://example.com/epg.xml.gz"></textarea>
      <div class="settings-actions"><button class="primary-button cf-live-save" type="button">保存直播源</button></div>
    </div>
    <p class="cf-live-status" role="status" aria-live="polite"></p>
    <div class="cf-live-body">
      <nav class="cf-live-groups" aria-label="频道分组"></nav>
      <section class="cf-live-main">
        <input class="settings-input cf-live-search" type="search" placeholder="搜索频道" aria-label="搜索频道" />
        <div class="cf-live-list" role="list" aria-label="频道列表"></div>
      </section>
    </div>
  `;const o=r.querySelector(".cf-live-source"),a=r.querySelector(".cf-live-status"),i=r.querySelector(".cf-live-groups"),s=r.querySelector(".cf-live-list"),l=r.querySelector(".cf-live-search"),u=r.querySelector(".cf-live-manage"),f=r.querySelector(".cf-live-input"),p=Lc();let h=[],w=null,m="全部",y="",g={},A=0,R=!1;const k=E=>{a.textContent=E||""},b=E=>{const M=p.probe[E];return M&&Date.now()-M.at<ua?M:null};function $(){const E=w?.playlist?.channels||[];let M;if(m==="收藏")M=E.filter(S=>p.favorites.includes(S.url));else if(m==="最近"){const S=p.recent.map(N=>N.url);M=E.filter(N=>S.includes(N.url)).sort((N,H)=>S.indexOf(N.url)-S.indexOf(H.url))}else m==="全部"?M=E:M=E.filter(S=>S.group===m);y&&(M=M.filter(S=>pa(`${S.name} ${S.group}`).includes(y)));const v=S=>{const N=b(S.url);return N?N.ok?N.ms:2e6:1e6};return M.some(S=>b(S.url))&&(M=[...M].sort((S,N)=>v(S)-v(N))),M}function I(){o.innerHTML=h.length?h.map(E=>`<option value="${e(E.url)}" ${w?.source?.url===E.url?"selected":""}>${e(E.name)}${E.origin==="subscription"?"（订阅）":""}</option>`).join(""):'<option value="">暂无直播源</option>',f.value=h.filter(E=>E.origin==="custom").map(E=>[E.name,E.url,E.epg].filter(Boolean).join("|")).join(`
`)}function T(){const E=w?.playlist?.groups||[],M=[{name:"全部",count:w?.playlist?.channels?.length||0},{name:"收藏",count:(w?.playlist?.channels||[]).filter(v=>p.favorites.includes(v.url)).length},{name:"最近",count:(w?.playlist?.channels||[]).filter(v=>p.recent.some(S=>S.url===v.url)).length},...E];i.innerHTML=M.map(v=>`
      <button class="cf-live-group${v.name===m?" is-active":""}" type="button" data-live-group="${e(v.name)}">
        <span>${e(v.name)}</span><em>${v.count}</em>
      </button>
    `).join("")}function x(E){const M=g[E.id];if(!M)return"";const v=M.now?`正在播：${e(M.now.title)}`:"",S=M.next?`${Cc(M.next.start)} ${e(M.next.title)}`:"";return`<p class="cf-live-epg">${[v,S?`下一个：${S}`:""].filter(Boolean).join(" · ")}</p>`}function P(E){const M=b(E.url);return M?M.ok?`<span class="cf-live-probe-tag${M.ms>2e3?" is-slow":""}">${M.ms} ms</span>`:`<span class="cf-live-probe-tag is-bad" title="${e(M.error||"")}">不可用</span>`:""}function O(){const E=$();if(!w){s.innerHTML=`<div class="cf5-empty cf-live-empty">${h.length?"正在读取直播源…":"还没有直播源。点击「管理直播源」添加 M3U 地址，或在设置 → 片源管理里添加包含直播源的订阅。"}</div>`;return}if(!E.length){s.innerHTML=`<div class="cf5-empty cf-live-empty">${m==="收藏"?"还没有收藏的频道，点击频道右侧的 ☆ 收藏。":"没有匹配的频道。"}</div>`;return}const M=E.slice(0,fa);s.innerHTML=M.map(v=>{const S=p.favorites.includes(v.url);return`
        <div class="cf-live-channel" role="listitem" data-live-url="${e(v.url)}" tabindex="0">
          <div class="cf-live-logo">${v.logo?`<img src="${e(v.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`:`<span>${e(v.name.slice(0,2))}</span>`}</div>
          <div class="cf-live-info">
            <strong>${e(v.name)}</strong>
            <small>${e(v.group)}</small>
            ${x(v)}
          </div>
          ${P(v)}
          <button class="cf-live-fav${S?" is-on":""}" type="button" data-live-fav="1" aria-label="${S?"取消收藏":"收藏"}">${S?"★":"☆"}</button>
        </div>
      `}).join("")+(E.length>M.length?`<p class="cf5-empty">还有 ${E.length-M.length} 个频道，请用搜索缩小范围。</p>`:""),G(M)}async function G(E){const M=w?.source?.epg||w?.playlist?.epgUrl;if(!n||!M)return;const v=A,S=E.filter(H=>!(H.id in g)).slice(0,Tc);if(!S.length)return;for(const H of S)g[H.id]=g[H.id]||null;const N=await n.epg(M,S.map(({id:H,tvgId:V,tvgName:le,name:oe})=>({id:H,tvgId:V,tvgName:le,name:oe}))).catch(()=>null);if(!(v!==A||!N?.ok)){Object.assign(g,N.items);for(const H of S){if(!N.items[H.id])continue;const V=s.querySelector(`[data-live-url="${CSS.escape(H.url)}"] .cf-live-info`);V&&(V.querySelector(".cf-live-epg")?.remove(),V.insertAdjacentHTML("beforeend",x(H)))}}}async function J(E,{force:M=!1}={}){const v=++A;if(w=null,g={},m="全部",T(),O(),!E||!n)return;k(`正在读取「${E.name}」…`);const S=await n.playlist(E.url,{force:M}).catch(N=>({ok:!1,error:String(N?.message||N)}));if(v===A){if(!S?.ok){k(S?.error||"播放列表读取失败"),s.innerHTML=`<div class="cf5-empty cf-live-empty">${e(S?.error||"播放列表读取失败")}</div>`;return}w={source:E,playlist:S},p.source=E.url,kn(p),k(`${S.channels.length} 个频道 · ${S.groups.length} 个分组${E.epg||S.epgUrl?" · 已关联节目单":""}`),T(),O()}}async function F(){if(!n){k("当前版本的宿主不支持直播功能。");return}h=await n.sources().catch(()=>[])||[];const E=h.find(M=>M.url===(w?.source?.url||p.source))||h[0]||null;if(I(),!E){w=null,T(),O();return}w?.source?.url!==E.url&&await J(E)}function B(E){const M=$().slice(0,fa),v=Math.max(0,M.findIndex(V=>V.url===E.url)),S=w?.source?.name||"直播",N=M.map((V,le)=>({url:V.url,kind:Ic(V.url),format:"直播",needsResolve:!1,title:V.name,sourceName:`直播 · ${S}`,lineName:V.group,label:V.name,displayLabel:V.name,episodeIndex:le,episodeNo:le+1,total:M.length}));p.recent=[{url:E.url,name:E.name,at:Date.now()},...p.recent.filter(V=>V.url!==E.url)].slice(0,Ec),kn(p);const H=window.__cineflowOpenResourcePlayer;if(typeof H!="function"){t("播放器尚未就绪");return}H({...N[v],playlist:N,episodeIndex:v,live:!0})}async function C(){const E=$().slice(0,120);if(!E.length||!n)return;const M=r.querySelector(".cf-live-probe");M.disabled=!0,k(`正在测活 ${E.length} 个频道…`);try{const v=await n.probe(E.map(H=>H.url)),S=Date.now();for(const H of v||[])p.probe[H.url]={ok:H.ok,ms:H.ms,error:H.error||"",at:S};for(const[H,V]of Object.entries(p.probe))S-V.at>ua&&delete p.probe[H];kn(p);const N=(v||[]).filter(H=>H.ok).length;k(`测活完成：${N}/${E.length} 个频道可用，已按速度排序`),O()}finally{M.disabled=!1}}o.addEventListener("change",()=>{const E=h.find(M=>M.url===o.value);E&&J(E)}),i.addEventListener("click",E=>{const M=E.target instanceof Element?E.target.closest("[data-live-group]"):null;M&&(m=M.getAttribute("data-live-group"),T(),O(),s.scrollTop=0)});let q=0;return l.addEventListener("input",()=>{window.clearTimeout(q),q=window.setTimeout(()=>{y=pa(l.value),O()},180)}),s.addEventListener("click",E=>{const M=E.target instanceof Element?E.target:null,v=M?.closest("[data-live-url]");if(!v)return;const S=w?.playlist?.channels?.find(N=>N.url===v.getAttribute("data-live-url"));if(S){if(M.closest("[data-live-fav]")){const N=p.favorites.indexOf(S.url);N>=0?p.favorites.splice(N,1):p.favorites.unshift(S.url),kn(p),T(),O();return}B(S)}}),s.addEventListener("keydown",E=>{if(E.key!=="Enter")return;const M=E.target instanceof Element?E.target.closest("[data-live-url]"):null,v=M&&w?.playlist?.channels?.find(S=>S.url===M.getAttribute("data-live-url"));v&&B(v)}),r.querySelector(".cf-live-probe").addEventListener("click",C),r.querySelector(".cf-live-manage-btn").addEventListener("click",()=>u.classList.toggle("is-hidden")),r.querySelector(".cf-live-save").addEventListener("click",async()=>{const E=f.value.split(/\r?\n/).map(M=>M.trim()).filter(Boolean).map(M=>{const[v,S,N]=M.split("|").map(H=>H.trim());return/^https?:\/\//i.test(v)?{url:v,epg:S||""}:{name:v,url:S||"",epg:N||""}});try{await n.saveSources(E),u.classList.add("is-hidden"),k("直播源已保存"),w=null,await F()}catch(M){k(`保存失败：${String(M?.message||M)}`)}}),window.addEventListener("cineflow:resource-settings",()=>{R&&F()}),{el:r,activate(){return R=!0,F()},settle(){}}}const Ac=6e3,Rc=2e4,Mr=15e3,Nc=25e3,bi=250;function Wr(e){return new Promise(t=>window.setTimeout(t,e))}function Bc(){return!!document.querySelector("#detailPanel")?.classList.contains("is-open")}function Dn(){return!!document.querySelector("#playerModal")?.classList.contains("is-open")}function vo(){return document.querySelector("#resourceResults")}function Dc(){return document.querySelector("#resourcePlayer")}function _c(e){return(e?.textContent||"").replace(/\s+/g," ").trim()}function Ve(e){const t=document.querySelector("#toast");!t||!e||(t.textContent=e,t.classList.remove("is-hidden"),window.clearTimeout(Ve.timer),Ve.timer=window.setTimeout(()=>t.classList.add("is-hidden"),2600))}function qc(e){const t=vo();if(!t)return null;const n=[...t.querySelectorAll(".resource-card")];if(!n.length)return null;const r=n.map((i,s)=>{const l=_c(i.querySelector(".resource-card-head strong"));return{card:i,index:s,rank:e.sourceName&&l===e.sourceName?0:1}}).sort((i,s)=>i.rank-s.rank||i.index-s.index);let o=null,a=null;for(const{card:i}of r){const s=[...i.querySelectorAll("[data-play-url]")];for(const l of s){const u=l.getAttribute("data-player-line")||"",f=l.getAttribute("data-player-label")||"";if(e.label&&f===e.label&&(!e.lineName||u===e.lineName))return{button:l,exact:!0};!a&&e.lineName&&u===e.lineName&&(a={button:l,exact:!1}),o||(o={button:l,exact:!1})}}return a||o}function Oc(e){const t=[...document.querySelectorAll(".player-episode-button")];if(!t.length)return null;const n=e.label?t.find(r=>(r.getAttribute("title")||"").trim()===e.label):null;if(n)return n;if(Number.isFinite(Number(e.episodeIndex))&&Number(e.episodeIndex)>0){const r=t.find(o=>Number(o.dataset.playerEpisodeIndex)===Number(e.episodeIndex));if(r&&(!e.label||(r.getAttribute("title")||"").includes(e.label)))return r}return null}async function xt(e,t,n){const r=Date.now()+t;for(;Date.now()<r;){if(n())return null;const o=e();if(o)return o;if(vo()?.querySelector(".resource-empty"))return null;await Wr(bi)}return null}async function ha(e,t){const n=Date.now()+Nc;for(;Date.now()<n;){if(t())return!1;const r=Dc();if(r&&Dn()){const o=Number(r.duration)||0;if(o>0&&o<=e+2)return!1;if(o>0&&r.readyState>=1){try{r.currentTime=e}catch{}await Wr(400);const a=Number(r.currentTime)||0;if(Math.abs(a-e)<=Math.max(3,e*.02))return r.play?.().catch(()=>{}),!0}}await Wr(bi)}return!1}function Fc({state:e}={}){let t=0;async function n(o,a){const i=window.__cineflowVod,s=o.vod||{};if(!i?.detail||!s.sourceKey||!s.vodId)return!1;let l=null;try{l=await i.detail(s.sourceKey,s.vodId)}catch{l=null}if(a())return!1;if(!l?.ok)return Ve("上次的来源暂时不可用，已打开作品页，请换一个来源"),i.openByTitle?.(o.title,o.year),!1;const u=l.lines.findIndex(g=>g.name===s.lineName),f=u>=0?u:Math.min(Number(s.lineIndex)||0,l.lines.length-1),p=l.lines[f].episodes,h=o.label?p.findIndex(g=>g.label===o.label):-1,w=h>=0?h:Math.min(Number(o.episodeIndex)||0,p.length-1);if(i.play({group:{name:o.title,year:o.year,pic:o.poster},item:{sourceKey:s.sourceKey,vodId:s.vodId,sourceName:s.sourceName||o.sourceName},detail:l,lineIndex:f,episodeIndex:w}),!await xt(Dn,Mr,a))return!1;const m=Number(o.progress)||0;if(!m)return!0;const y=await ha(m,a);return!y&&e?.player?.open&&!a()&&Ve("已从头开始播放"),y}async function r(o,a){if(!o)return!1;const i=++t,s=()=>i!==t;if(o.mediaType==="vod")return n(o,s);if(!a)return!1;if(a.click(),!await xt(Bc,Ac,s))return Ve("没能打开介绍页"),!1;const l=await xt(()=>qc(o)||(vo()?.querySelector(".vod-match-list")?"vod":null),Rc,s);if(s())return!1;if(l==="vod")return Ve("已打开介绍页，请在「可用资源」中选择来源继续播放"),!1;if(!l)return Ve("没找到上次的播放源"),!1;if(l.button.click(),!await xt(Dn,Mr,s))return Ve("这个源没能打开播放器"),!1;if(o.mediaType==="tv"&&!l.exact){const p=await xt(()=>Oc(o),4e3,s);if(s())return!1;p&&(p.click(),await xt(Dn,Mr,s))}const u=Number(o.progress)||0;if(!u)return!0;const f=await ha(u,s);return s()?!1:(!f&&e?.player?.open&&Ve("已从头开始播放"),f)}return{resume:r,cancel(){t+=1}}}const zc="--cf4-caret-x",Hc=10,Uc=`
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5.87 21.045h2.923l.959-3.068h4.503l.949 3.068h2.922L11.94 2.955l-6.07 18.09zm6.162-10.12 1.543 4.917h-3.153l1.553-4.916h.057zM24 17.617l-.378-1.182-6.266-.59.733 2.127 5.91-.354zM6.644 15.843l-6.266.591L0 17.616l5.911.355.733-2.128z"/>
  </svg>
`;function Vc(){const e=document.querySelector("#settingsTitle"),t=document.querySelector("#settingsState"),n=document.querySelector(".settings-card"),r=document.querySelector("#settingsModal");if(!e||!t||!n||!r)return!1;if(e.dataset.cf4SettingsBubble==="1")return!0;e.dataset.cf4SettingsBubble="1";const o=document.createElement("button");o.type="button",o.className="cf4-config-btn",o.setAttribute("aria-label","查看当前配置"),o.setAttribute("aria-expanded","false"),o.innerHTML=Uc,e.append(o);const a=document.createElement("div");a.className="cf4-bubble",a.setAttribute("role","status"),a.append(t),n.append(a);const i=()=>a.classList.contains("is-open"),s=16,l=24;function u(){const h=n.getBoundingClientRect(),w=o.getBoundingClientRect(),m=e.getBoundingClientRect(),y=a.offsetWidth;if(!h.width||!w.width||!y)return;a.style.top=`${Math.round(m.bottom-h.top)+Hc}px`;const g=Math.round(h.right-w.right),A=Math.max(0,Math.round(h.width-l-y)),R=Math.min(g,A);a.style.right=`${R}px`;const k=h.right-R-y,b=w.left+w.width/2-k;a.style.setProperty(zc,`${Math.round(Math.min(Math.max(b,s),y-s))}px`)}function f(){u(),a.classList.add("is-open"),a.inert=!1,o.setAttribute("aria-expanded","true")}function p(){i()&&(a.classList.remove("is-open"),a.inert=!0,o.setAttribute("aria-expanded","false"))}return o.addEventListener("click",h=>{h.stopPropagation(),i()?p():f()}),document.addEventListener("click",h=>{h.target instanceof Element&&h.target.closest(".cf4-config-btn, .cf4-bubble")||p()}),document.addEventListener("keydown",h=>{h.key==="Escape"&&p()}),new MutationObserver(()=>{r.classList.contains("is-hidden")&&p()}).observe(r,{attributes:!0,attributeFilter:["class"]}),window.addEventListener("resize",()=>{i()&&u()}),a.inert=!0,!0}function jc({api:e,state:t}={}){const n=document.querySelector("#settingsTitle");if(n&&n.dataset.cf5Title!=="1"){n.dataset.cf5Title="1";const r=Array.from(n.childNodes).find(o=>o.nodeType===Node.TEXT_NODE&&o.nodeValue.trim());r&&(r.nodeValue="设置")}!e?.saveResourceMode||t?.resourceSettings?.mode==="full"||Promise.resolve(e.saveResourceMode("full")).then(r=>{!r||!t||(t.resourceSettings={...t.resourceSettings,...r},t.credential&&(t.credential.resources=t.resourceSettings))}).catch(()=>{})}function Wc(e={}){try{const t=Vc();return jc(e),t}catch(t){return console.warn("[CineFlow] 设置页配置气泡装配失败，已跳过",t),!1}}const Yc=2,ma=[{value:1,label:"每天更新"},{value:7,label:"每周更新"},{value:30,label:"每月更新"},{value:0,label:"仅手动更新"}];function ga(e){const t=new Date(Number(e)||0);if(!e||Number.isNaN(t.getTime()))return"";const n=t.toDateString()===new Date().toDateString(),r=`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`;return n?r:`${t.getMonth()+1}月${t.getDate()}日 ${r}`}function Gc({api:e,state:t,escapeHtml:n=r=>String(r??"")}={}){const r=document.querySelector(".settings-card"),o=document.querySelector("#settingsModal");if(!r||!o||!e?.getResourceSettings)return null;if(r.dataset.cf5Sources==="1")return{refresh:()=>{}};r.dataset.cf5Sources="1";const a=window.cineflowVod||null,i=document.createElement("section");i.className="cf5-sources",i.innerHTML=`
    <header class="cf5-head"><h3 class="cf5-title">片源管理</h3><p class="cf5-count">正在读取</p></header>
    <p class="studio-source-help">电影、剧集和动漫共用这份片源。同一提供商的多个接口收在一项中，展开可查看线路。搜索时连续失败两次的片源会自动停用（30 分钟 → 24 小时 → 长期），可随时恢复。</p>
    <div class="cf5-toolbar">
      <button class="secondary-button cf5-test-all" type="button">全部测速</button>
      ${a?'<button class="secondary-button cf5-restore-all" type="button">恢复全部停用</button><button class="secondary-button cf5-export" type="button">导出片源</button>':""}
    </div>
    <p class="cf5-status" role="status" aria-live="polite"></p>
    <div class="cf5-list" role="list" aria-label="片源列表"></div>
    ${a?`
    <div class="cf5-subs">
      <h4 class="cf5-subtitle">片源订阅</h4>
      <p class="studio-source-help">填写 LibreTV 源列表 JSON 或 TVBox 配置地址。订阅的点播源与直播源按周期自动更新，单独存放，不会覆盖自定义源；需要专用爬虫的 TVBox 线路与成人内容会跳过。已预置几个实测可用的公开订阅，不需要可以删除，删除后不会再自动添加。</p>
      <div class="cf5-sub-list" role="list" aria-label="订阅列表"></div>
      <div class="cf5-sub-add">
        <input class="settings-input cf5-sub-url" type="url" spellcheck="false" placeholder="订阅地址，例如 https://example.com/sources.json" aria-label="订阅地址" />
        <select class="settings-input cf5-sub-days" aria-label="更新周期">${ma.map(v=>`<option value="${v.value}">${v.label}</option>`).join("")}</select>
        <button class="primary-button cf5-sub-add-btn" type="button">添加订阅</button>
      </div>
    </div>`:""}
    <div class="cf5-import">
      <label class="settings-label" for="cf5SourceInput">导入自定义源（替换现有自定义接口）</label>
      <textarea id="cf5SourceInput" class="settings-input cf5-input" rows="4" spellcheck="false" placeholder="一行一个：名称|接口地址，也支持 TVBox 配置 / JSON 数组 / 配置地址"></textarea>
      <div class="settings-actions">
        <button class="primary-button cf5-import-btn" type="button">导入并刷新</button>
        <button class="secondary-button cf5-clear-btn" type="button">清空自定义源</button>
      </div>
    </div>`,r.append(i);const s=i.querySelector(".cf5-list"),l=i.querySelector(".cf5-count"),u=i.querySelector(".cf5-status"),f=i.querySelector("#cf5SourceInput"),p=i.querySelector(".cf5-sub-list"),h=new Map;let w=new Map,m=[],y=[],g=!1,A=0;function R(v){const S=h.get(v.key);if(S)return`<span class="cf5-latency ${S.ok?"is-ok":"is-bad"}" title="${n(S.error||"接口响应时间")}">${S.ok?`${Math.round(S.elapsedMs)} ms`:"检查失败"}</span>`;const N=w.get(v.key)?.health;return N?.status==="ok"&&N.ms?`<span class="cf5-latency is-ok" title="最近一次搜索的耗时">搜索 ${Math.round(N.ms)} ms</span>`:v.verification?.playlist?`<span class="cf5-latency is-ok" title="${n(v.verification.checkedAt)}：样例搜索、详情和 HLS 清单通过">清单已验证</span>`:v.probe?`<span class="cf5-latency${v.probe.catalog?"":" is-bad"}" title="${n(v.probe.checkedAt+"："+(v.probe.error||"仅代表上次检查结果"))}">${v.probe.detail?"详情通过":v.probe.search?"搜索通过":v.probe.catalog?"接口通过":"上次检查未通过"}</span>`:'<span class="cf5-latency">未测</span>'}function k(v){const N=w.get(v.key)?.health;if(!N)return"";if(N.status==="disabled"){const H=N.permanent?"长期停用":`停用至 ${ga(N.disabledUntil)}`;return`<span class="cf5-tag is-bad" title="${n(N.error||"连续搜索失败")}">${H}</span>`}return N.status==="failing"?`<span class="cf5-tag is-warn" title="${n(N.error||"")}">${n(N.label)}</span>`:""}function b(v){return v.origin==="custom"?'<span class="cf5-tag cf5-origin is-custom">自定义</span>':v.origin==="subscription"?'<span class="cf5-tag cf5-origin is-subscription" title="来自订阅，随订阅更新">订阅</span>':'<span class="cf5-tag cf5-origin">内置</span>'}function $(v,S=v.name){const N=w.get(v.key)?.disabled;return`<div class="cf5-item${N?" is-disabled":""}" data-id="${n(v.key)}">
      <div class="cf5-item-main"><strong>${n(S||"未命名源")}</strong><p class="cf5-api" title="${n(v.api)}">${n(v.api)}</p></div>
      <div class="cf5-tags">${b(v)}${v.contentTypes?.includes("anime")?'<span class="cf5-tag">含动漫</span>':""}${v.enabled===!1?'<span class="cf5-tag">已停用</span>':""}${k(v)}</div>
      <span class="cf5-slot">${R(v)}</span>
      ${N?`<button class="ghost-button cf5-restore" type="button" ${g?"disabled":""} aria-label="恢复${n(S)}">恢复</button>`:""}
      <button class="ghost-button cf5-test" type="button" ${g?"disabled":""} aria-label="检查${n(S)}接口">测速</button>
      ${v.origin==="custom"?`<button class="ghost-button cf5-remove" type="button" ${g?"disabled":""} aria-label="删除${n(S)}接口">×</button>`:""}
    </div>`}function I(){const v=new Set([...s.querySelectorAll("details[open]")].map(H=>H.dataset.provider)),S=new Map;for(const H of y){const V=H.provider||{key:H.name||H.api,name:H.name};S.has(V.key)||S.set(V.key,{...V,sources:[]}),S.get(V.key).sources.push(H)}const N=y.filter(H=>w.get(H.key)?.disabled).length;l.textContent=`${S.size} 个片源 · ${y.length} 条接口${N?` · ${N} 条已自动停用`:""}`,s.innerHTML=[...S.values()].map(H=>H.sources.length===1?`<div role="listitem" data-provider="${n(H.key)}">${$(H.sources[0],H.name)}</div>`:`<details class="studio-source-group" role="listitem" data-provider="${n(H.key)}" ${v.has(H.key)?"open":""}>
          <summary><strong>${n(H.name)}</strong><span>${H.sources.length} 条接口 · 展开线路</span></summary>
          <div class="studio-source-lines">${H.sources.map((V,le)=>$(V,`线路 ${le+1}`)).join("")}</div>
        </details>`).join("")||'<p class="cf5-empty">暂无播放源</p>'}function T(v){if(v.lastStatus==="error")return`<span class="is-bad">同步失败：${n(v.lastError||"未知错误")}${v.paused?"（已暂停自动更新）":""}</span>`;if(!v.lastSync)return"尚未同步";const S=v.lastCounts||{},N=S.skipped?` · 跳过 ${S.skipped} 条（${n(Object.keys(S.skippedByReason||{}).join("、"))}）`:"";return`${ga(v.lastSync)} 同步 · ${v.sourceCount} 个点播源 · ${v.liveCount} 个直播源${N}`}function x(){p&&(p.innerHTML=m.map(v=>`
      <div class="cf5-sub" role="listitem" data-sub="${n(v.url)}">
        <div class="cf5-item-main">
          <strong>${n(v.name||v.url)}${v.builtin?' <span class="cf5-tag cf5-origin">内置</span>':""}</strong>
          <p class="cf5-api" title="${n(v.url)}">${n(v.url)}</p>
          <p class="cf5-sub-status">${T(v)}</p>
        </div>
        <select class="settings-input cf5-sub-days-row" aria-label="更新周期" ${g?"disabled":""}>${ma.map(S=>`<option value="${S.value}" ${Number(v.refreshDays??1)===S.value?"selected":""}>${S.label}</option>`).join("")}</select>
        <button class="ghost-button cf5-sub-sync" type="button" ${g?"disabled":""}>同步</button>
        <button class="ghost-button cf5-sub-remove" type="button" ${g?"disabled":""} aria-label="删除订阅">×</button>
      </div>
    `).join("")||'<p class="cf5-empty">还没有订阅</p>')}function P(v){A+=1,y=Array.isArray(v?.sources)?v.sources:[],t&&(t.resourceSettings={...t.resourceSettings,...v},t.credential&&(t.credential.resources=t.resourceSettings)),I(),window.dispatchEvent(new CustomEvent("cineflow:resource-settings",{detail:v}))}async function O(){if(a?.healthList)try{const v=await a.healthList();w=new Map((Array.isArray(v)?v:[]).map(S=>[S.key,S]))}catch{}}async function G(){if(a?.subscriptions){try{m=await a.subscriptions()||[]}catch{m=[]}x()}}async function J(){const v=A;try{const[S]=await Promise.all([e.getResourceSettings(),O(),G()]);A===v&&!g&&P(S)}catch(S){u.textContent=S?.message||"片源读取失败"}}function F(v){g=v,i.querySelectorAll("button,textarea,input,select").forEach(S=>{S.disabled=v})}async function B(v){if(g||!v.length||!e.testResourceSource)return;F(!0);const S=v.slice();let N=0;u.textContent=`检查中 0/${v.length}`;try{await Promise.all(Array.from({length:Math.min(Yc,v.length)},async()=>{for(;S.length;){const V=S.shift();let le;try{le=await e.testResourceSource({key:V.key,api:V.api})}catch(Re){le={ok:!1,error:Re?.message||"检查失败"}}h.set(V.key,le||{ok:!1});const oe=s.querySelector(`[data-id="${CSS.escape(V.key)}"] .cf5-slot`);oe&&(oe.innerHTML=R(V)),u.textContent=`检查中 ${++N}/${v.length}`}}));const H=v.filter(V=>!h.get(V.key)?.ok).length;u.textContent=`完成 ${v.length} 条接口检查${H?` · ${H} 条未通过`:" · 全部通过"}`}finally{F(!1)}}async function C(v,S){if(!g){F(!0);try{const N=await v();P(N),u.textContent=S(N)}catch(N){u.textContent=N?.message||"片源更新失败"}finally{F(!1)}}}async function q(v,S){if(!g){F(!0);try{const N=await v();u.textContent=typeof S=="function"?S(N):S}catch(N){u.textContent=N?.message||"操作失败"}finally{F(!1),await J()}}}function E(v){if(!v)return"同步完成";if(v.ok===!1)return`同步失败：${v.error||"请检查订阅地址"}`;if(Array.isArray(v.results)){const S=v.results.filter(N=>!N.ok).length;return`已同步 ${v.results.length} 个订阅${S?` · ${S} 个失败`:""}`}return`同步完成 · ${v.sources||0} 个点播源 · ${v.live||0} 个直播源${v.stats?.skipped?` · 跳过 ${v.stats.skipped} 条不兼容线路`:""}`}s.addEventListener("click",v=>{const S=v.target.closest("[data-id]"),N=y.find(H=>H.key===S?.dataset.id);if(!(!N||g)&&(v.target.closest(".cf5-test")&&B([N]),v.target.closest(".cf5-restore")&&q(()=>a.healthReset(N.key),`已恢复 ${N.name}`),v.target.closest(".cf5-remove"))){const H=y.filter(V=>V.origin==="custom"&&V.key!==N.key);C(()=>H.length?e.importResourceSources(JSON.stringify(H)):e.clearResourceSources(),()=>`已删除 ${N.name}`)}}),i.querySelector(".cf5-test-all").addEventListener("click",()=>B(y)),i.querySelector(".cf5-restore-all")?.addEventListener("click",()=>q(()=>a.healthReset(""),"已恢复全部自动停用的片源")),i.querySelector(".cf5-export")?.addEventListener("click",()=>q(async()=>{const v=await a.exportSources();let S=!1;try{await navigator.clipboard.writeText(v),S=!0}catch{}const N=document.createElement("a");return N.href=URL.createObjectURL(new Blob([v],{type:"application/json"})),N.download="cineflow-sources.json",N.click(),window.setTimeout(()=>URL.revokeObjectURL(N.href),5e3),S},v=>`已导出 LibreTV 源列表格式${v?"，并复制到剪贴板":""}`)),i.querySelector(".cf5-sub-add-btn")?.addEventListener("click",()=>{const v=i.querySelector(".cf5-sub-url").value.trim(),S=Number(i.querySelector(".cf5-sub-days").value);if(!v){u.textContent="请先填写订阅地址";return}q(async()=>{const N=await a.addSubscription(v,{refreshDays:S});return N?.ok&&(i.querySelector(".cf5-sub-url").value=""),N},E)}),p?.addEventListener("click",v=>{const N=v.target.closest("[data-sub]")?.dataset.sub;!N||g||(v.target.closest(".cf5-sub-sync")&&q(()=>a.syncSubscriptions(N),E),v.target.closest(".cf5-sub-remove")&&q(()=>a.removeSubscription(N),"已删除订阅及其导入的片源"))}),p?.addEventListener("change",v=>{const S=v.target.closest(".cf5-sub-days-row"),N=S?.closest("[data-sub]")?.dataset.sub;N&&q(()=>a.updateSubscription(N,{refreshDays:Number(S.value)}),"已更新订阅周期")}),i.querySelector(".cf5-import-btn").addEventListener("click",()=>{const v=f.value.trim();if(!v){u.textContent="请先粘贴源配置";return}C(()=>e.importResourceSources(v),S=>(f.value="",`导入完成 · 自定义 ${S.customSourceCount||0} 条接口${S.importReport?.skipped?` · 跳过 ${S.importReport.skipped} 条不兼容线路`:""}`))}),i.querySelector(".cf5-clear-btn").addEventListener("click",()=>C(()=>e.clearResourceSources(),()=>(f.value="","自定义源已清空")));let M=!1;return new MutationObserver(()=>{const v=!o.classList.contains("is-hidden");v&&!M&&J(),M=v}).observe(o,{attributes:!0,attributeFilter:["class"]}),{refresh:J,el:i}}function Xc(e={}){try{return Gc(e)!==null}catch(t){return console.warn("[CineFlow] 片源管理面板装配失败",t),!1}}const Kc=700,Jc=800,ya=292,va="https://www.themoviedb.org/settings/api",Rt=["打开 TMDB 申请页","登录并申请 API Key","识别并校验密钥","换取 Read Access Token","写入本机配置"],$n=["申请 request token","打开 TMDB 授权页","等待你点批准","换取 Read Access Token","写入本机配置"],Qc=[{title:"开发者计划",rows:[{key:"app_name",label:"应用名称",def:"AAAA"},{key:"app_url",label:"应用网址",def:"http://127.0.0.1"},{key:"use_type",label:"使用类型",def:"Desktop Application"},{key:"app_desc",label:"应用概述",wide:!0,def:"Meet personalized needs, enrich website interfaces and functions to give users a better experience"}]},{title:"联系方式",copy:!1,rows:[{key:"first_name",label:"名字",ph:"张三"},{key:"last_name",label:"姓氏",ph:"Zhang"},{key:"email",label:"邮箱",ph:"与账号一致可留空"},{key:"phone",label:"电话号码",ph:"00000000000"},{key:"addr1",label:"地址 1",ph:"shenzhen"},{key:"addr2",label:"地址 2",ph:"可选"},{key:"city",label:"城市",ph:"shenzhen"},{key:"state",label:"省",ph:"guangdong"},{key:"zip",label:"邮政编码",ph:"518000"},{key:"country",label:"国家或地区",def:"中国"}]}],wi="cineflow:tmdb-apply-draft:v1",Zc={app_name:{from:"CineFlow",to:"AAAA"},app_url:{from:"https://github.com/incldue/CineFlow",to:"http://127.0.0.1"}};function ba(){try{const e=JSON.parse(window.localStorage.getItem(wi)||"{}");if(!e||typeof e!="object")return{};let t=!1;for(const[n,r]of Object.entries(Zc))e[n]===r.from&&(e[n]=r.to,t=!0);return t&&xi(e),e}catch{return{}}}function xi(e){try{window.localStorage.setItem(wi,JSON.stringify(e))}catch{}}const ed=`
  <div class="cf6-auth-main">
    <span class="cf6-auth-title">TMDB 凭证</span>
    <span class="cf6-auth-state" data-state="empty">未配置</span>
    <span class="cf6-auth-actions">
      <button type="button" class="cf6-auth-btn">一键获取</button>
    </span>
  </div>
`,td=`
  <div class="cf12-head">
    <span class="cf12-title">TMDB 凭证</span>
    <button type="button" class="cf12-close" aria-label="关闭">×</button>
  </div>
  <div class="cf12-idle">
    <button type="button" class="cf6-auth-btn cf12-go">开始授权</button>
    <button type="button" class="cf6-auth-paste cf12-paste">我已复制密钥</button>
  </div>
  <div class="cf12-draft">
    <div class="cf12-draft-bar">
      <button type="button" class="cf12-draft-toggle" aria-expanded="false">申请草稿</button>
      <button type="button" class="cf12-draft-open">打开申请页</button>
    </div>
    <div class="cf12-draft-rows" hidden></div>
  </div>
  <div class="cf12-run" hidden>
    <span class="cf6-ring" aria-hidden="true"><i></i></span>
    <span class="cf6-rail" role="progressbar" aria-valuemin="1" aria-valuemax="5" aria-label="TMDB 授权进度"></span>
    <p class="cf6-auth-msg" role="status"></p>
    <button type="button" class="cf6-auth-cancel cf12-cancel">取消</button>
  </div>
`;function nd({api:e,state:t}={}){const n=document.querySelector(".settings-scroll"),r=document.querySelector('label[for="apiCredentialInput"]');if(!n||!r||!e?.startTmdbAuth)return!1;if(r.dataset.cf6Wizard==="1")return!0;r.dataset.cf6Wizard="1";const o=document.createElement("div");o.className="cf6-auth",o.innerHTML=ed,n.insertBefore(o,r);const a=o.querySelector(".cf6-auth-state"),i=o.querySelector(".cf6-auth-btn"),s=document.querySelector("#app")||document.body,l=document.createElement("div");l.className="cf12-bubble",l.setAttribute("role","dialog"),l.setAttribute("aria-label","TMDB 凭证获取"),l.setAttribute("aria-hidden","true"),l.innerHTML=td,s.append(l);const u=l.querySelector(".cf12-idle"),f=l.querySelector(".cf12-run"),p=l.querySelector(".cf6-rail"),h=l.querySelector(".cf6-auth-msg"),w=l.querySelector(".cf12-go"),m=l.querySelector(".cf12-paste"),y=l.querySelector(".cf12-cancel"),g=l.querySelector(".cf12-close"),A=l.querySelector(".cf12-draft"),R=l.querySelector(".cf12-draft-toggle"),k=l.querySelector(".cf12-draft-open"),b=l.querySelector(".cf12-draft-rows");let $=0,I=!1,T="auth",x=!1,P=!1;function O(){const D=s.getBoundingClientRect(),W=i.getBoundingClientRect(),Z=Math.round(W.right-D.left-ya+6),te=Math.round(W.bottom-D.top)+11;l.style.left=`${Z}px`,l.style.top=`${te}px`;const Ie=Z-l.offsetLeft,Ae=te-l.offsetTop;Math.abs(Ie)>.5&&(l.style.left=`${Z+Ie}px`),Math.abs(Ae)>.5&&(l.style.top=`${te+Ae}px`);const vn=l.offsetWidth||ya,Ds=W.left+W.width/2-(D.left+l.offsetLeft);l.style.setProperty("--cf12-caret-x",`${Math.round(Math.min(Math.max(Ds,18),vn-18))}px`)}function G(){u.hidden=I,f.hidden=!I,A.hidden=I}function J(){x||(x=!0,l.classList.add("is-open"),l.setAttribute("aria-hidden","false"),G(),O(),w.focus?.({preventScroll:!0}))}function F(){x&&(x=!1,l.classList.remove("is-open"),l.setAttribute("aria-hidden","true"))}function B(D){return String(D).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function C(){if(b.childElementCount)return;const D=ba();b.innerHTML=Qc.map(Z=>`
      <div class="cf14-group">
        <div class="cf14-group-title">${B(Z.title)}</div>
        ${Z.rows.map(te=>{const Ie=D[te.key]===void 0?te.def||"":D[te.key],Ae=te.wide?`<textarea class="cf14-input cf14-area" rows="2" data-key="${te.key}" spellcheck="false" placeholder="${B(te.ph||"")}">${B(Ie)}</textarea>`:`<input class="cf14-input" type="text" data-key="${te.key}" spellcheck="false" value="${B(Ie)}" placeholder="${B(te.ph||"")}">`,vn=Z.copy!==!1;return`<div class="cf12-row${te.wide?" cf14-wide":""}${vn?"":" cf20-nocopy"}">
            <span class="cf12-row-label">${B(te.label)}</span>
            ${Ae}
            ${vn?`<button type="button" class="cf12-copy" data-key="${te.key}">复制</button>`:""}
          </div>`}).join("")}
      </div>`).join("")+'<div class="cf14-foot">勾选条款与 Subscribe 由你本人点</div>';let W=0;b.addEventListener("input",Z=>{const te=Z.target instanceof Element?Z.target.dataset.key:"";if(!te)return;const Ie=ba();Ie[te]=Z.target.value,W&&window.clearTimeout(W),W=window.setTimeout(()=>{W=0,xi(Ie)},400)})}function q(D){const W=b.querySelector(`[data-key="${D}"]`);return W?String(W.value||"").trim():""}function E(D){C(),b.hidden=!D,A.classList.toggle("is-open",D),R.setAttribute("aria-expanded",String(D)),x&&O()}async function M(D){if(!D)return!1;try{return await navigator.clipboard.writeText(D),!0}catch{try{const Z=document.createElement("textarea");Z.value=D,Z.setAttribute("readonly",""),Z.className="cf12-copy-shim",document.body.append(Z),Z.select();const te=document.execCommand("copy");return Z.remove(),te}catch{return!1}}}R.addEventListener("click",D=>{D.stopPropagation(),E(b.hidden)}),k.addEventListener("click",D=>{D.stopPropagation(),e.openExternal?.(va)}),b.addEventListener("click",async D=>{const W=D.target instanceof Element?D.target.closest(".cf12-copy"):null;if(!W)return;D.stopPropagation();const Z=await M(q(W.dataset.key)),te=W.closest(".cf12-row");te&&te.classList.toggle("is-copied",Z),W.textContent=Z?"已复制":"空",window.setTimeout(()=>{W.textContent="复制",te&&te.classList.remove("is-copied")},1400)});function v(D,W){p.childElementCount!==D.length&&(p.innerHTML=D.map(Z=>`<i title="${Z}"></i>`).join("")),Array.from(p.children).forEach((Z,te)=>{Z.classList.toggle("is-done",te<W),Z.classList.toggle("is-active",te===W)}),p.setAttribute("aria-valuenow",String(Math.min(D.length,W+1))),p.setAttribute("aria-valuetext",D[W]||"")}function S(D,W,Z){I=!0,G(),v(D,W),Z!==void 0&&(h.textContent=Z)}function N(){I=!1,G(),h.textContent="",l.classList.remove("is-error"),o.classList.remove("is-error")}function H(){$&&window.clearInterval($),$=0,I=!1,P=!1}function V(){const D=t?.credential?.type,W=!!t?.credential?.configured;return o.classList.toggle("is-ready",W),a.dataset.state=W?D==="readToken"?"token":"key":"empty",a.textContent=W?D==="readToken"?"Read Access Token":"API Key":"未配置",i.textContent=W&&D==="apiKey"?"换 Token":"一键获取",W}async function le(){if(I||!e.getCredentialState)return;const D=await e.getCredentialState().catch(()=>null);!D||!t||(t.credential=D,V())}function oe(){H(),N(),F(),V(),window.setTimeout(()=>{const D=document.querySelector("#saveSettingsBtn");D&&!D.disabled&&D.click()},900)}async function Re(D){const W=e.grabTmdbCredential||e.takeTmdbCredentialFromClipboard,Z=W?await W().catch(()=>null):null;return Z?.found?Z.valid===!1?(D?.(`剪贴板里这把${Z.type==="readToken"?" Token ":" Key "}校验未通过：${Z.error||"未知原因"}`),l.classList.add("is-error"),o.classList.add("is-error"),"invalid"):(t&&(t.credential=Z.state),l.classList.remove("is-error"),o.classList.remove("is-error"),Z.type==="apiKey"&&(e.startTmdbAuth||e.getTmdbAuthStatus)?(D?.("API Key 已保存，正在换取 Read Access Token"),P=!0,window.setTimeout(()=>{P&&X(!0)},320),!0):(D?.("已识别剪贴板里的 Read Access Token"),oe(),!0)):!1}function Se(){T="guide",S(Rt,0,"正在打开 TMDB 申请页"),e.openExternal?.(va),window.setTimeout(()=>{I&&S(Rt,1,"没有账号就先点页面上的 Join TMDB")},1200),window.setTimeout(()=>{!I||T!=="guide"||S(Rt,2,"复制 API Key 后回到这里，会自动校验并接续换 Token")},5200),$&&window.clearInterval($),$=window.setInterval(()=>{Re()},Jc)}async function it(){const D=await e.getTmdbAuthStatus?.().catch(()=>null);if(D){if(D.phase==="saved"){if(t){const W=await e.getCredentialState?.().catch(()=>null);W&&(t.credential=W)}oe();return}if(D.phase==="failed"||D.phase==="cancelled"){H(),I=!0,G(),v($n,Math.max(0,(D.step||1)-1)),h.textContent=D.error||"已取消",l.classList.add("is-error"),o.classList.add("is-error");return}if(D.phase==="need-api-key"||D.phase==="has-read-token"){H(),D.phase==="has-read-token"?(N(),V()):Se();return}l.classList.remove("is-error"),o.classList.remove("is-error"),S($n,Math.max(0,(D.step||1)-1),D.message)}}async function X(D=!1){if(I&&!D)return;D&&$&&(window.clearInterval($),$=0),I=!0,T="auth",l.classList.remove("is-error"),o.classList.remove("is-error"),S($n,0,"正在申请 request token");const W=await e.startTmdbAuth().catch(Z=>({ok:!1,code:"IPC_FAILED",error:String(Z?.message||Z)}));if(P=!1,W?.code==="NEED_API_KEY"){Se();return}if(W?.code==="HAS_READ_TOKEN"){N(),await le();return}if(!W?.ok){H(),I=!0,G(),v($n,0),h.textContent=W?.error||W?.state?.error||"没能连上 TMDB",l.classList.add("is-error"),o.classList.add("is-error");return}$&&window.clearInterval($),$=window.setInterval(it,Kc),it()}function z(){H(),N(),T==="auth"&&e.cancelTmdbAuth?.().catch(()=>{})}i.addEventListener("click",D=>{if(D.stopPropagation(),x&&!I){F();return}x||J()}),w.addEventListener("click",D=>{D.stopPropagation(),X()}),m.addEventListener("click",D=>{D.stopPropagation(),l.classList.remove("is-error"),o.classList.remove("is-error"),I=!0,G(),v(Rt,2),h.textContent="正在识别剪贴板",Re(W=>{v(Rt,3),h.textContent=W}).then(W=>{W||(I=!1,h.textContent="剪贴板里没有找到 TMDB 密钥",l.classList.add("is-error"),o.classList.add("is-error"))})}),y.addEventListener("click",D=>{D.stopPropagation(),z()}),g.addEventListener("click",D=>{D.stopPropagation(),I&&z(),F()}),document.addEventListener("keydown",D=>{x&&D.key==="Escape"&&(D.stopPropagation(),I&&z(),F())}),document.addEventListener("pointerdown",D=>{if(!x||I)return;const W=D.target instanceof Element?D.target:null;W&&(W.closest(".cf12-bubble")||W.closest(".cf6-auth"))||F()},{passive:!0}),n.addEventListener("scroll",()=>{x&&O()},{passive:!0}),window.addEventListener("resize",()=>{x&&O()});const ie=document.querySelector("#settingsModal");return ie&&new MutationObserver(()=>{ie.classList.contains("is-hidden")&&(H(),N(),F())}).observe(ie,{attributes:!0,attributeFilter:["class"]}),window.setInterval(()=>{ie&&ie.classList.contains("is-hidden")||le()},1e3),V(),!0}function rd(e={}){try{return nd(e)}catch(t){return console.warn("[CineFlow] TMDB 凭证向导装配失败，已跳过",t),!1}}const Si=12,od=12,ad=1500,ki=2,$i="cineflow:search-history:v2",Mi="cineflow:search-history:v1";function wa(e,t=Date.now()){if(typeof e=="string"){const r=e.trim();return r?{term:r,hits:0,searches:1,at:t}:null}if(!e||typeof e!="object")return null;const n=String(e.term||"").trim();return n?{term:n,hits:Math.max(0,Number(e.hits)||0),searches:Math.max(1,Number(e.searches)||1),at:Number(e.at)||t}:null}function id(){try{const e=JSON.parse(window.localStorage.getItem($i)||"[]");if(Array.isArray(e)&&e.length)return e.map((t,n)=>wa(t,Date.now()-n)).filter(Boolean)}catch{}try{const e=JSON.parse(window.localStorage.getItem(Mi)||"[]");if(Array.isArray(e))return e.map((t,n)=>wa(t,Date.now()-n*1e3)).filter(Boolean)}catch{}return[]}function Nt(e){try{window.localStorage.setItem($i,JSON.stringify(e.slice(0,Si))),window.localStorage.removeItem(Mi)}catch{}}function sd(e){return!(e.length<ki||/'|‘|’/.test(e)||/^[a-z]+$/.test(e))}function ld(e){const n=(Array.isArray(e?.recentSearches)?e.recentSearches.map(r=>String(r||"").trim()).filter(Boolean):[]).filter(sd);return n.filter(r=>!n.some(o=>o!==r&&o.startsWith(r)))}function Ei(e){return String(e||"").replace(/[\u200b-\u200d\ufeff]/g,"")}function Er(e){return Ei(e).trim().toLowerCase().replace(/\s+/g," ")}function cd({state:e}={}){const t=document.querySelector("#globalSearch"),n=document.querySelector("#app"),r=document.querySelector(".search-box");if(!t||!n||!r)return!1;if(n.dataset.cf7SearchHistory==="1")return!0;n.dataset.cf7SearchHistory="1";let o=id(),a=o.length>0;o.length&&Nt(o);function i(){if(a)return;const T=ld(e?.prefs);T.length&&(a=!0,o=T.map((x,P)=>({term:x,hits:0,searches:1,at:Date.now()-P*1e3})),Nt(o))}const s=document.createElement("div");s.className="cf7-history",s.setAttribute("role","dialog"),s.setAttribute("aria-label","搜索记录"),s.setAttribute("aria-hidden","true"),s.innerHTML=`
    <div class="cf7-history-head">
      <span class="cf7-history-title">搜索记录</span>
      <button type="button" class="cf7-history-clear">清空</button>
    </div>
    <div class="cf7-history-list"></div>
  `,n.append(s);const l=s.querySelector(".cf7-history-list");s.querySelector(".cf7-history-clear");let u=0,f=!1;const p=()=>s.classList.contains("is-open"),h=()=>["island-mode","island-expanded-mode","island-docked-mode"].some(T=>document.body.classList.contains(T));function w(T,{replay:x=!1}={}){const P=Ei(T).trim();if(P.length<ki)return;const O=Er(P),G=o.find(J=>Er(J.term)===O);G?(G.term=P,G.searches+=1,x&&(G.hits+=1),G.at=Date.now(),o=[G,...o.filter(J=>J!==G)]):o=[{term:P,hits:x?1:0,searches:1,at:Date.now()},...o],o=o.slice(0,Si),Nt(o),p()&&R()}function m(T){o=o.filter((x,P)=>P!==T),Nt(o),R()}function y(){const T=n.getBoundingClientRect(),x=r.getBoundingClientRect(),P=Math.round(x.left-T.left),O=Math.round(x.bottom-T.top)+od;s.style.left=`${P}px`,s.style.top=`${O}px`;const G=Math.max(220,T.width-P-24);s.style.width=`${Math.round(Math.min(430,G))}px`;const J=P-s.offsetLeft,F=O-s.offsetTop;Math.abs(J)>.5&&(s.style.left=`${P+J}px`),Math.abs(F)>.5&&(s.style.top=`${O+F}px`);const B=s.offsetWidth||430,C=x.left+x.width/2-(T.left+s.offsetLeft);s.style.setProperty("--cf7-caret-x",`${Math.round(Math.min(Math.max(C,18),B-18))}px`)}function g(T){let x=2166136261;for(const P of T)x^=P.codePointAt(0),x=Math.imul(x,16777619)>>>0;return x>>>0}function A(T){const x=Math.min(Number(T.hits)||0,6),P=Math.min(Math.max((Number(T.searches)||1)-1,0),4),O=12.5+x*1.9+P*.45,G=500+Math.min(x,4)*50,J=g(Er(T.term)),F=J%360,B=Math.min(52+(J>>>9)%30+Math.min(x,4)*2,88),C=Math.min(70+(J>>>18)%16+Math.min(x,4)*1.4,88);return`--cf9-size:${O.toFixed(1)}px;--cf9-weight:${G};--cf9-hue:${F};--cf9-sat:${B}%;--cf9-light:${C.toFixed(1)}%`}function R(){if(!o.length){b();return}l.innerHTML=o.map((T,x)=>`<button type="button" class="cf7-history-item" data-index="${x}" tabindex="-1" style="${A(T)}" aria-label="搜索 ${xa(T.term)}">
          <svg class="cf7-history-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/></svg>
          <span class="cf7-history-term">${xa(T.term)}</span>
          <span class="cf7-history-del" role="button" tabindex="-1" title="删除这条" aria-label="删除这条">×</span>
        </button>`).join("")}function k(){h()||(i(),o.length&&(R(),y(),s.classList.add("is-open"),s.setAttribute("aria-hidden","false")))}function b(){s.classList.remove("is-open"),s.setAttribute("aria-hidden","true")}function $(T){const x=String(T||"").trim();x&&(t.value=x,t.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:!0})),w(x,{replay:!0}),b())}function I(){const T=String(t.value||"").trim();u&&window.clearTimeout(u),u=window.setTimeout(()=>{u=0,!f&&T&&String(t.value||"").trim()===T&&w(T)},ad)}return t.addEventListener("compositionstart",()=>{f=!0,u&&(window.clearTimeout(u),u=0)}),t.addEventListener("compositionend",()=>{f=!1,I()}),t.addEventListener("input",()=>{f||I()}),t.addEventListener("keydown",T=>{if(T.key==="Enter"){u&&(window.clearTimeout(u),u=0),f||w(t.value),b();return}T.key==="Escape"&&b()}),window.addEventListener("beforeunload",()=>{u&&window.clearTimeout(u)}),t.addEventListener("focus",k),t.addEventListener("click",k),s.addEventListener("mousedown",T=>{T.target instanceof Element&&T.target.closest(".cf7-history-item, .cf7-history-clear")&&T.preventDefault()}),s.addEventListener("click",T=>{const x=T.target instanceof Element?T.target:null;if(!x)return;if(x.closest(".cf7-history-clear")){o=[],Nt(o),b();return}const P=x.closest(".cf7-history-item");if(!P)return;const O=Number(P.dataset.index||0);if(x.closest(".cf7-history-del")){m(O);return}$(o[O]?.term)}),document.addEventListener("pointerdown",T=>{if(!p())return;const x=T.target instanceof Element?T.target:null;x&&(x.closest(".cf7-history")||x===t||x.closest(".search-box"))||b()},{passive:!0}),window.addEventListener("resize",()=>{p()&&y()}),new MutationObserver(()=>{h()&&b()}).observe(document.body,{attributes:!0,attributeFilter:["class"]}),!0}function xa(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function dd(e={}){try{return cd(e)}catch(t){return console.warn("[CineFlow] 搜索记录弹窗装配失败，已跳过",t),!1}}const ud=6,Tr=1,Bt=new Map;function Lr(e,t){const n=window.cineflowFast;if(!n?.prewarmMedia)return!1;const r=[];let o=0;for(const a of e){if(!a)continue;const i=Bt.get(a);if(i===void 0){const s=t>0;Bt.set(a,s?1:0),s&&(t-=1,o+=1),r.push(a)}else i===0&&t>0&&(Bt.set(a,1),t-=1,o+=1,r.push(a));if(r.length>=ud)break}return r.length?(Bt.size>400&&Bt.clear(),Promise.resolve(n.prewarmMedia(r,o)).catch(()=>{}),o>0):!1}function fd(){if(!window.cineflowFast?.prewarmMedia)return!1;const e=document.querySelector("#detailContent")||document.querySelector("#app");if(!e)return!1;const t=()=>document.querySelector("#detailPanel")?.classList.contains("is-open"),n=()=>["island-mode","island-expanded-mode","island-docked-mode"].some(s=>document.body.classList.contains(s));function r(s){const l=s.querySelector(".resource-open[data-play-url]");return l?String(l.getAttribute("data-play-url")||"").trim():""}let o=null;function a(){const s=document.querySelector("#resourceResults");if(!s)return!1;if(s===o)return!0;o=s;let l=!1;return new MutationObserver(u=>{if(!t()||n())return;const f=[];for(const h of u)for(const w of h.addedNodes)w instanceof Element&&(w.matches(".resource-card")&&f.push(w),f.push(...Array.from(w.querySelectorAll?.(".resource-card")||[])));if(!f.length)return;s.querySelectorAll(".resource-card").length===f.length&&(l=!1),Lr(f.map(r),l?0:Tr)&&(l=!0)}).observe(s,{childList:!0,subtree:!0}),s.addEventListener("pointerover",u=>{if(!t()||n())return;const f=u.target instanceof Element?u.target.closest(".resource-card"):null;f&&Lr([r(f)],Tr)},{passive:!0}),document.addEventListener("click",u=>{u.target instanceof Element&&u.target.closest(".movie-card, #dailyDetailBtn")&&(l=!1,window.setTimeout(()=>{!t()||n()||l||(l=Lr(Array.from(s.querySelectorAll(".resource-card")).map(r),Tr))},1200))},{passive:!0}),!0}return new MutationObserver(()=>{a()}).observe(e,{childList:!0,subtree:!0}),a(),!0}function pd(e={}){try{return fd()}catch(t){return console.warn("[CineFlow] 播放源首帧预热装配失败，已跳过",t),!1}}const hd=800,Ti=240*1e3,md=2,gd=350,yd=20,vd="https://image.tmdb.org/t/p/",ut=new Map,Yt=new Set;let Cr=0,Ir=0,Dt={configured:!1,checkedAt:0},Sa=!1;const bd=e=>window.requestIdleCallback?window.requestIdleCallback(e,{timeout:hd}):window.setTimeout(e,60);function wd(e){const t=String(e?.dataset?.movieId||"").trim(),n=e?.dataset?.mediaType==="tv"?"tv":"movie";if(!/^\d+$/.test(t))return null;const r=(e.querySelector("h3")?.textContent||"").trim();return{id:Number(t),mediaType:n,title:r}}function _t(e,t){if(!e)return;const n=`${vd}${t}${e}`;if(Yt.has(n)||Yt.size>600)return;Yt.add(n);const r=new Image;r.decoding="async",r.src=n}function xd(e){_t(e.posterPath,"w500"),_t(e.backdropPath,"w780");const t=Array.isArray(e.cast)?e.cast.slice(0,6):[],n=Array.isArray(e.recommendations)?e.recommendations.slice(0,8):[],r=Array.isArray(e.similar)?e.similar.slice(0,6):[];for(const o of t)_t(o.profilePath,"w185");for(const o of n)_t(o.posterPath,"w185");for(const o of r)_t(o.posterPath,"w185");Yt.size>yd*30&&Yt.clear()}async function Sd(){if(Date.now()-Dt.checkedAt<60*1e3)return Dt.configured;try{Dt={configured:!!(await window.cineflow.getCredentialState())?.configured,checkedAt:Date.now()}}catch{Dt={configured:!1,checkedAt:Date.now()}}return Dt.configured}function kd(e){return{id:e.id,mediaType:e.mediaType==="tv"?"tv":"movie",title:e.title,originalTitle:e.originalTitle,releaseDate:e.releaseDate,year:String(e.releaseDate||"").slice(0,4)}}async function ka(e){if(!await Sd())return;const t=ut.get(`${e.mediaType||"movie"}:${e.id}`);if(!(t&&Date.now()-t.resourceAt<Ti)&&!(Ir>=1)){Ir+=1;try{await window.cineflow.findMovieResources(kd(e),{cursor:0,limit:3}),t&&(t.resourceAt=Date.now())}catch{}finally{Ir-=1}}}async function $d(e,{resources:t=!1}={}){if(!e)return null;const n=`${e.mediaType}:${e.id}`,r=ut.get(n);if(r&&Date.now()-r.at<Ti)return t&&ka(r.details).catch(()=>{}),r.details;if(Cr>=md)return null;Cr+=1;try{const o=await window.cineflow.getMovieDetails(e.id,{mediaType:e.mediaType});return o?(ut.set(n,{at:Date.now(),details:o,resourceAt:0}),ut.size>120&&ut.delete(ut.keys().next().value),xd(o),t&&ka(o).catch(()=>{}),o):null}catch{return ut.set(n,{at:Date.now(),details:null,resourceAt:0}),null}finally{Cr-=1}}function qt(e,{resources:t=!1,delay:n=0}={}){const r=wd(e);if(!r)return;const o=()=>bd(()=>{$d(r,{resources:t})});n>0?window.setTimeout(o,n):o()}function Md(){if(Sa)return!0;if(!document.querySelector("#app")||!window.cineflow?.getMovieDetails)return!1;Sa=!0;let e=0,t=null;const n=()=>{window.clearTimeout(e),e=0,t=null};new MutationObserver(o=>{const a=[];for(const i of o)for(const s of i.addedNodes)s instanceof Element&&(s.matches?.(".movie-card")&&a.push(s),a.push(...Array.from(s.querySelectorAll?.(".movie-card")||[])));for(const i of a.slice(0,8))qt(i)}).observe(document.querySelector("#app"),{childList:!0,subtree:!0});for(const o of Array.from(document.querySelectorAll(".movie-card")).slice(0,8))qt(o);return document.addEventListener("pointerover",o=>{const i=(o.target instanceof Element?o.target:null)?.closest(".movie-card");if(!i||i===t)return;const s=o.relatedTarget;s instanceof Node&&i.contains(s)||(n(),t=i,qt(i),e=window.setTimeout(()=>{t===i&&qt(i,{resources:!0})},gd))},{passive:!0}),document.addEventListener("pointerout",o=>{const i=(o.target instanceof Element?o.target:null)?.closest(".movie-card");if(!i)return;const s=o.relatedTarget;s instanceof Node&&i.contains(s)||i===t&&n()},{passive:!0}),document.addEventListener("focusin",o=>{const i=(o.target instanceof Element?o.target:null)?.closest(".movie-card");i&&qt(i,{resources:!0})}),!0}function Ed(e={}){try{return Md()}catch(t){return console.warn("[CineFlow] 详情页预热装配失败，已跳过",t),!1}}const Td=5e3,Ld=6*3600*1e3,Li="cineflow:update-dismissed:v1",Cd=10,St=14,ce={open:!1,busy:!1,data:null,offProgress:null,autoTimer:0,revealPath:""};function tr(){return window.cineflowUpdate}function Ft(e){const t=Number(e)||0;return t?`${(t/1048576).toFixed(1)} MB`:""}function Id(){try{return String(window.localStorage.getItem(Li)||"")}catch{return""}}function Pd(e){try{window.localStorage.setItem(Li,String(e||""))}catch{}}function Ad(){return["island-mode","island-expanded-mode","island-docked-mode"].some(e=>document.body.classList.contains(e))}function Rd(){let e=document.querySelector(".cf23-bubble");if(e)return e;const t=document.querySelector("#app");return t?(e=document.createElement("div"),e.className="cf23-bubble",e.setAttribute("role","dialog"),e.setAttribute("aria-hidden","true"),e.setAttribute("aria-label","应用更新"),e.innerHTML=`
    <div class="cf23-head">
      <span class="cf23-badge">CineFlow</span>
      <span class="cf23-versions"></span>
    </div>
    <p class="cf23-title">检查更新</p>
    <p class="cf23-meta"></p>
    <div class="cf23-progress" hidden><i style="width:0%"></i></div>
    <div class="cf23-actions">
      <button type="button" class="primary-button cf23-action">立即更新</button>
      <button type="button" class="ghost-button cf23-later">稍后</button>
    </div>
  `,t.append(e),e.addEventListener("click",n=>{const r=n.target instanceof Element?n.target:null;if(r){if(r.closest(".cf23-later")){_n();const o=ce.data?.latest||"";o&&Pd(o);return}r.closest(".cf23-action")&&(ce.revealPath?tr()?.reveal?.({path:ce.revealPath}).catch(()=>null):Nd())}}),document.addEventListener("keydown",n=>{n.key==="Escape"&&ce.open&&_n()}),document.addEventListener("click",n=>{if(!ce.open)return;const r=n.target instanceof Element?n.target:null;r&&(r.closest(".cf23-bubble, .brand-mark")||_n())}),window.addEventListener("resize",()=>{ce.open&&Yr()}),e):null}function Yr(){const e=document.querySelector(".cf23-bubble"),t=document.querySelector(".brand-mark");if(!e||!t)return;const n=t.getBoundingClientRect(),r=e.offsetWidth,o=e.offsetHeight,a=Math.min(Math.max(St,Math.round(n.left)),Math.max(St,window.innerWidth-St-r));let i=Math.round(n.bottom+Cd);i+o>window.innerHeight-St&&(i=Math.max(St,window.innerHeight-St-o)),e.style.left=`${a}px`,e.style.top=`${i}px`,e.style.setProperty("--cf23-caret-x",`${Math.round(Math.min(Math.max(n.left+n.width/2-a,18),r-18))}px`)}function he(e,t){const n=document.querySelector(e);n&&(n.textContent=t||"")}function We(e,{hidden:t=!1,disabled:n=!1}={}){const r=document.querySelector(".cf23-action");r&&(r.textContent=e,r.hidden=t,r.disabled=n)}function Pr(e,t){const n=document.querySelector(".cf23-progress"),r=n?.querySelector("i");!n||!r||(n.hidden=!1,r.style.width=`${Math.max(0,Math.min(100,Number(e)||0))}%`,he(".cf23-meta",t))}function Gr(){const e=document.querySelector(".cf23-progress");if(e){e.hidden=!0;const t=e.querySelector("i");t&&(t.style.width="0%")}}function ft(e,t={}){const n=Rd();if(!n)return;ce.open=!0,ce.data=t,Yr(),n.classList.add("is-open"),n.setAttribute("aria-hidden","false"),document.querySelector(".brand-mark")?.classList.toggle("cf23-has-update",e==="update"),Gr(),he(".cf23-versions",e==="update"&&t.latest?`v${t.latest}`:"");const r=document.querySelector(".cf23-later");r&&(r.hidden=!1),r&&(r.textContent=e==="managed"?"知道了":"稍后"),e==="checking"?(he(".cf23-title","正在检查更新"),he(".cf23-meta","api.github.com · 直连"),We("检查中",{disabled:!0})):e==="update"?(he(".cf23-title",`发现新版本 v${t.latest}`),he(".cf23-meta",[t.asset?.label,Ft(t.asset?.size)].filter(Boolean).join(" · ")),We("立即更新",{disabled:!1})):e==="latest"?(he(".cf23-title","已是最新版本"),he(".cf23-meta",`当前 v${t.current}`),We("已是最新",{disabled:!0})):e==="managed"?(he(".cf23-title","由 dsh 工作室管理"),he(".cf23-meta",String(t.message||"升级请用工作室的「版本与更新」").slice(0,80)),We("",{hidden:!0})):(he(".cf23-title","检查更新失败"),he(".cf23-meta",String(t.error||"网络不可用").slice(0,80)),We("重试",{disabled:!1})),r&&(r.hidden=e==="checking"),requestAnimationFrame(Yr)}function _n(){const e=document.querySelector(".cf23-bubble");ce.open=!1,e?.classList.remove("is-open"),e?.setAttribute("aria-hidden","true")}async function Ar({force:e=!1,silent:t=!1}={}){const n=tr();if(!n?.check)return null;t||ft("checking");const r=await n.check({force:e}).catch(o=>({ok:!1,error:String(o?.message||o)}));return r?.managed?(t||ft("managed",r),r):!r||r.ok===!1?(t||ft("error",{error:r?.error||"检查失败"}),r):t?r:r.hasUpdate&&r.asset?(ft("update",r),r):r.hasUpdate&&!r.asset?(ft("error",{error:"这个版本没有适合当前系统的安装包"}),r):(ft("latest",r),r)}async function Nd(){if(ce.busy)return;const e=tr(),t=ce.data;if(!e?.download||!t?.asset)return;ce.busy=!0;const n=document.querySelector(".cf23-action");n&&(n.disabled=!0),he(".cf23-title",`正在下载 v${t.latest}`),We("下载中",{disabled:!0}),Gr(),Pr(0,`${t.asset.label} · ${Ft(t.asset.size)}`),ce.offProgress?.(),ce.offProgress=e.onProgress?.(a=>{!ce.open||a?.phase!=="downloading"||Pr(a.percent||0,`下载中 ${a.percent||0}% · ${Ft(a.received)}${a.total?` / ${Ft(a.total)}`:""}`)})||null;const r=await e.download({url:t.asset.url,name:t.asset.name}).catch(a=>({ok:!1,error:String(a?.message||a)}));if(ce.offProgress?.(),ce.offProgress=null,ce.busy=!1,ce.revealPath="",!r?.ok){he(".cf23-title","下载失败"),he(".cf23-meta",String(r?.error||"未知原因").slice(0,80)),We("重试",{disabled:!1}),Gr();return}Pr(100,`已下载 ${Ft(r.bytes)} · ${r.speedMBps} MB/s`),he(".cf23-title","正在安装"),We("安装中",{disabled:!0});const o=await e.install({path:r.path}).catch(a=>({ok:!1,error:String(a?.message||a)}));if(o?.ok){he(".cf23-meta","应用即将重启完成覆盖安装");return}await e.reveal?.({path:r.path}).catch(()=>null),he(".cf23-title","安装包已下载"),he(".cf23-meta",String(o?.error||"请在打开的文件夹里手动安装")),We("打开文件夹",{disabled:!1}),ce.revealPath=r.path}function Bd(e={}){try{const t=document.querySelector(".brand-mark");if(!t||t.dataset.cf23Bound==="1"||!tr()?.check)return!1;t.dataset.cf23Bound="1",t.setAttribute("role","button"),t.setAttribute("tabindex","0"),t.setAttribute("title","检查更新"),t.addEventListener("click",()=>{if(!ce.busy){if(ce.open&&ce.data?.hasUpdate){_n();return}Ar({force:!0})}}),t.addEventListener("keydown",r=>{r.key!=="Enter"&&r.key!==" "||(r.preventDefault(),Ar({force:!0}))});const n=async()=>{const r=await Ar({silent:!0}).catch(()=>null);!r?.hasUpdate||!r.asset||Id()!==r.latest&&(Ad()||ft("update",r))};return ce.autoTimer=window.setTimeout(()=>{n(),ce.autoTimer=window.setInterval(n,Ld)},Td),!0}catch(t){return console.warn("[CineFlow] 更新检查装配失败，已跳过",t),!1}}const Dd=["island-mode","island-expanded-mode","island-docked-mode"],_d=2200;function qd(e){const t=document.getElementById("app");if(!t||t.dataset.cf3Pages==="1")return!1;t.dataset.cf3Pages="1";const{api:n,state:r,escapeHtml:o}=e,a=()=>Dd.some(g=>document.body.classList.contains(g));vc({state:r,api:n}),Wc({api:n,state:r}),Xc({api:n,state:r,escapeHtml:o}),rd({api:n,state:r}),dd({api:n,state:r}),pd({}),Ed({}),Xl({state:r}),Bd({});const i=dc({api:n,state:r,escapeHtml:o}),s=Mc({state:r,escapeHtml:o,resume:Fc({state:r})}),l=Pc({escapeHtml:o}),u=document.createElement("nav");u.className="cf3-navigation",u.setAttribute("aria-label","影音工作室页面");const p=["推荐","分类片库","播放历史","直播"].map((g,A)=>{const R=document.createElement("button");return R.type="button",R.className="cf3-chip",R.textContent=g,R.dataset.page=String(A),u.append(R),R});document.querySelector(".titlebar")?.append(u);function h(g){p.forEach((A,R)=>{A.classList.toggle("is-on",R===g),R===g?A.setAttribute("aria-current","page"):A.removeAttribute("aria-current")})}const w=Il({root:t,onSwitch:h,pages:[{id:"home",el:null},{id:"library",el:i.el,activate:()=>i.activate(),prepare:()=>i.activate(),settle:()=>i.settle()},{id:"history",el:s.el,activate:()=>s.activate(),prepare:()=>s.activate(),settle:()=>s.settle?.()},{id:"live",el:l.el,activate:()=>l.activate(),prepare:()=>l.activate(),settle:()=>l.settle?.()}]});p.forEach((g,A)=>g.addEventListener("click",()=>w.go(A))),h(0);let m=!1;window.setTimeout(()=>{m||a()||w.getCurrent()!==0||(m=!0,w.preload(1),w.preload(2))},_d),new MutationObserver(()=>w.setEnabled(!a())).observe(document.body,{attributes:!0,attributeFilter:["class"]});const y=document.querySelector("#settingsModal");return y&&new MutationObserver(()=>{y.classList.contains("is-hidden")&&w.getCurrent()===1&&i.activate()}).observe(y,{attributes:!0,attributeFilter:["class"]}),!0}function Od(e={}){try{return qd(e)}catch(t){return console.warn("[CineFlow] 分类片库 / 播放历史与三页切换装配失败，已跳过",t),!1}}/*!
 * artplayer.js v5.4.0
 * Github: https://github.com/zhw2590582/ArtPlayer
 * (c) 2017-2026 Harvey Zhao
 * Released under the MIT License.
 */function Fd(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var qn={exports:{}},zd=qn.exports,$a;function Hd(){return $a||($a=1,(function(e,t){(function(n,r){e.exports=r()})(zd,function(){function n(u){return(n=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(f){return typeof f}:function(f){return f&&typeof Symbol=="function"&&f.constructor===Symbol&&f!==Symbol.prototype?"symbol":typeof f})(u)}var r=Object.prototype.toString,o=function(u){if(u===void 0)return"undefined";if(u===null)return"null";var f=n(u);if(f==="boolean")return"boolean";if(f==="string")return"string";if(f==="number")return"number";if(f==="symbol")return"symbol";if(f==="function")return(function(p){return a(p)==="GeneratorFunction"})(u)?"generatorfunction":"function";if((function(p){return Array.isArray?Array.isArray(p):p instanceof Array})(u))return"array";if((function(p){return p.constructor&&typeof p.constructor.isBuffer=="function"?p.constructor.isBuffer(p):!1})(u))return"buffer";if((function(p){try{if(typeof p.length=="number"&&typeof p.callee=="function")return!0}catch(h){if(h.message.indexOf("callee")!==-1)return!0}return!1})(u))return"arguments";if((function(p){return p instanceof Date||typeof p.toDateString=="function"&&typeof p.getDate=="function"&&typeof p.setDate=="function"})(u))return"date";if((function(p){return p instanceof Error||typeof p.message=="string"&&p.constructor&&typeof p.constructor.stackTraceLimit=="number"})(u))return"error";if((function(p){return p instanceof RegExp||typeof p.flags=="string"&&typeof p.ignoreCase=="boolean"&&typeof p.multiline=="boolean"&&typeof p.global=="boolean"})(u))return"regexp";switch(a(u)){case"Symbol":return"symbol";case"Promise":return"promise";case"WeakMap":return"weakmap";case"WeakSet":return"weakset";case"Map":return"map";case"Set":return"set";case"Int8Array":return"int8array";case"Uint8Array":return"uint8array";case"Uint8ClampedArray":return"uint8clampedarray";case"Int16Array":return"int16array";case"Uint16Array":return"uint16array";case"Int32Array":return"int32array";case"Uint32Array":return"uint32array";case"Float32Array":return"float32array";case"Float64Array":return"float64array"}if((function(p){return typeof p.throw=="function"&&typeof p.return=="function"&&typeof p.next=="function"})(u))return"generator";switch(f=r.call(u)){case"[object Object]":return"object";case"[object Map Iterator]":return"mapiterator";case"[object Set Iterator]":return"setiterator";case"[object String Iterator]":return"stringiterator";case"[object Array Iterator]":return"arrayiterator"}return f.slice(8,-1).toLowerCase().replace(/\s/g,"")};function a(u){return u.constructor?u.constructor.name:null}function i(u,f){var p=2<arguments.length&&arguments[2]!==void 0?arguments[2]:["option"];return s(u,f,p),l(u,f,p),(function(h,w,m){var y=o(w),g=o(h);if(y==="object"){if(g!=="object")throw new Error("[Type Error]: '".concat(m.join("."),"' require 'object' type, but got '").concat(g,"'"));Object.keys(w).forEach(function(A){var R=h[A],k=w[A],b=m.slice();b.push(A),s(R,k,b),l(R,k,b),i(R,k,b)})}if(y==="array"){if(g!=="array")throw new Error("[Type Error]: '".concat(m.join("."),"' require 'array' type, but got '").concat(g,"'"));h.forEach(function(A,R){var k=h[R],b=w[R]||w[0],$=m.slice();$.push(R),s(k,b,$),l(k,b,$),i(k,b,$)})}})(u,f,p),u}function s(u,f,p){if(o(f)==="string"){var h=o(u);if(f[0]==="?"&&(f=f.slice(1)+"|undefined"),!(-1<f.indexOf("|")?f.split("|").map(function(w){return w.toLowerCase().trim()}).filter(Boolean).some(function(w){return h===w}):f.toLowerCase().trim()===h))throw new Error("[Type Error]: '".concat(p.join("."),"' require '").concat(f,"' type, but got '").concat(h,"'"))}}function l(u,f,p){if(o(f)==="function"){var h=f(u,o(u),p);if(h!==!0){var w=o(h);throw w==="string"?new Error(h):w==="error"?h:new Error("[Validator Error]: The scheme for '".concat(p.join("."),"' validator require return true, but got '").concat(h,"'"))}}}return i.kindOf=o,i})})(qn)),qn.exports}var Ud=Hd();const Gt=Fd(Ud),bo="5.4.0",Xt={properties:["audioTracks","autoplay","buffered","controller","controls","crossOrigin","currentSrc","currentTime","defaultMuted","defaultPlaybackRate","duration","ended","error","loop","mediaGroup","muted","networkState","paused","playbackRate","played","preload","readyState","seekable","seeking","src","startDate","textTracks","videoTracks","volume"],methods:["addTextTrack","canPlayType","load","play","pause"],events:["abort","canplay","canplaythrough","durationchange","emptied","ended","error","loadeddata","loadedmetadata","loadstart","pause","play","playing","progress","ratechange","seeked","seeking","stalled","suspend","timeupdate","volumechange","waiting"],prototypes:["width","height","videoWidth","videoHeight","poster","webkitDecodedFrameCount","webkitDroppedFrameCount","playsInline","webkitSupportsFullscreen","webkitDisplayingFullscreen","onenterpictureinpicture","onleavepictureinpicture","disablePictureInPicture","cancelVideoFrameCallback","requestVideoFrameCallback","getVideoPlaybackQuality","requestPictureInPicture","webkitEnterFullScreen","webkitEnterFullscreen","webkitExitFullScreen","webkitExitFullscreen"]},pn=globalThis?.CUSTOM_USER_AGENT??(typeof navigator<"u"?navigator.userAgent:""),Ci=/^(?:(?!chrome|android).)*safari/i.test(pn),Ii=/iPad|iPhone|iPod/i.test(pn)&&!window.MSStream,Pi=Ii||pn.includes("Macintosh")&&navigator.maxTouchPoints>=1,ue=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(pn)||Pi,nr=typeof window<"u"&&typeof document<"u";function $e(e,t=document){return t.querySelector(e)}function hn(e,t=document){return Array.from(t.querySelectorAll(e))}function K(e,t){return e.classList.add(t)}function ye(e,t){return e.classList.remove(t)}function ze(e,t){return e.classList.contains(t)}function U(e,t){return t instanceof Element?e.appendChild(t):e.insertAdjacentHTML("beforeend",String(t)),e.lastElementChild||e.lastChild}function rr(e){return e.parentNode.removeChild(e)}function L(e,t,n){return e.style[t]=n,e}function or(e,t){for(const n in t)L(e,n,t[n]);return e}function Vd(e,t,n=!0){const r=window.getComputedStyle(e,null).getPropertyValue(t);return n?Number.parseFloat(r):r}function Ai(e){return Array.from(e.parentElement.children).filter(t=>t!==e)}function De(e,t){Ai(e).forEach(n=>ye(n,t)),K(e,t)}function He(e,t,n="top"){ue||(e.setAttribute("aria-label",t),K(e,"hint--rounded"),K(e,`hint--${n}`))}function wo(e,t=0){const n=e.getBoundingClientRect(),r=window.innerHeight||document.documentElement.clientHeight,o=window.innerWidth||document.documentElement.clientWidth,a=n.top-t<=r&&n.top+n.height+t>=0,i=n.left-t<=o+t&&n.left+n.width+t>=0;return a&&i}function yt(e,t){return So(e).includes(t)}function xo(e,t){return t.parentNode.replaceChild(e,t),e}function me(e){return document.createElement(e)}function Ri(e="",t=""){const n=me("i");return K(n,"art-icon"),K(n,`art-icon-${e}`),U(n,t),n}function Ni(e,t){let n=document.getElementById(e);n||(n=document.createElement("style"),n.id=e,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{document.head.appendChild(n)}):(document.head||document.documentElement).appendChild(n)),n.textContent=t}function Bi(){const e=document.createElement("div");return e.style.display="flex",e.style.display==="flex"}function _e(e){return e.getBoundingClientRect()}function Di(e,t){return new Promise((n,r)=>{const o=new Image;o.onload=function(){if(!t||t===1)n(o);else{const a=document.createElement("canvas"),i=a.getContext("2d");a.width=o.width*t,a.height=o.height*t,i.drawImage(o,0,0,a.width,a.height),a.toBlob(s=>{const l=URL.createObjectURL(s),u=new Image;u.onload=function(){n(u)},u.onerror=function(){URL.revokeObjectURL(l),r(new Error(`Image load failed: ${e}`))},u.src=l})}},o.onerror=function(){r(new Error(`Image load failed: ${e}`))},o.src=e})}function So(e){if(e.composedPath)return e.composedPath();const t=[];let n=e.target;for(;n;)t.push(n),n=n.parentNode;return!t.includes(window)&&window!==void 0&&t.push(window),t}class _i extends Error{constructor(t,n){super(t),typeof Error.captureStackTrace=="function"&&Error.captureStackTrace(this,n||this.constructor),this.name="ArtPlayerError"}}function Le(e,t){if(!e)throw new _i(t);return e}function rn(e){return e.includes("?")?rn(e.split("?")[0]):e.includes("#")?rn(e.split("#")[0]):e.trim().toLowerCase().split(".").pop()}function qi(e,t){const n=document.createElement("a");n.style.display="none",n.href=e,n.download=t,document.body.appendChild(n),n.click(),document.body.removeChild(n)}function Ee(e,t,n){return Math.max(Math.min(e,Math.max(t,n)),Math.min(t,n))}function ar(e){return e.charAt(0).toUpperCase()+e.slice(1)}function qe(e){if(!e)return"00:00";const t=a=>a<10?`0${a}`:String(a),n=Math.floor(e/3600),r=Math.floor((e-n*3600)/60),o=Math.floor(e-n*3600-r*60);return(n>0?[n,r,o]:[r,o]).map(t).join(":")}function Oi(e){return e.replace(/[&<>'"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[t]||t)}function jd(e){const t={"&amp;":"&","&lt;":"<","&gt;":">","&#39;":"'","&quot;":'"'},n=new RegExp(`(${Object.keys(t).join("|")})`,"g");return e.replace(n,r=>t[r]||r)}const j=Object.defineProperty,{hasOwnProperty:Wd}=Object.prototype;function Kt(e,t){return Wd.call(e,t)}function Fi(e,t){return Object.getOwnPropertyDescriptor(e,t)}function ir(...e){const t=n=>n&&typeof n=="object"&&!Array.isArray(n);return e.reduce((n,r)=>(Object.keys(r).forEach(o=>{const a=n[o],i=r[o];Array.isArray(a)&&Array.isArray(i)?n[o]=a.concat(...i):t(a)&&t(i)?n[o]=ir(a,i):n[o]=i}),n),{})}function Yd(e){return e.replace(/(\d\d:\d\d:\d\d)[,.](\d+)/g,(t,n,r)=>{let o=r.slice(0,3);return r.length===1&&(o=`${r}00`),r.length===2&&(o=`${r}0`),`${n},${o}`})}function zi(e){return`WEBVTT \r
\r
`.concat(Yd(e).replace(/\{\\([ibu])\}/g,"</$1>").replace(/\{\\([ibu])1\}/g,"<$1>").replace(/\{([ibu])\}/g,"<$1>").replace(/\{\/([ibu])\}/g,"</$1>").replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g,"$1.$2").replace(/\{[\s\S]*?\}/g,"").concat(`\r
\r
`))}function On(e){return URL.createObjectURL(new Blob([e],{type:"text/vtt"}))}function Hi(e){const t=new RegExp("Dialogue:\\s\\d,(\\d+:\\d\\d:\\d\\d.\\d\\d),(\\d+:\\d\\d:\\d\\d.\\d\\d),([^,]*),([^,]*),(?:[^,]*,){4}([\\s\\S]*)$","i");function n(r=""){return r.split(/[:.]/).map((o,a,i)=>{if(a===i.length-1){if(o.length===1)return`.${o}00`;if(o.length===2)return`.${o}0`}else if(o.length===1)return(a===0?"0":":0")+o;return a===0?o:a===i.length-1?`.${o}`:`:${o}`}).join("")}return`WEBVTT

${e.split(/\r?\n/).map(r=>{const o=r.match(t);return o?{start:n(o[1].trim()),end:n(o[2].trim()),text:o[5].replace(/\{[\s\S]*?\}/g,"").replace(/(\\N)/g,`
`).trim().split(/\r?\n/).map(a=>a.trim()).join(`
`)}:null}).filter(r=>r).map((r,o)=>r?`${o+1}
${r.start} --> ${r.end}
${r.text}`:"").filter(r=>r.trim()).join(`

`)}`}function It(e=0){return new Promise(t=>setTimeout(t,e))}function Ui(e,t){let n;return function(...r){const o=()=>(n=null,e.apply(this,r));clearTimeout(n),n=setTimeout(o,t)}}function Vi(e,t){let n=!1;return function(...r){n||(e.apply(this,r),n=!0,setTimeout(()=>{n=!1},t))}}const Gd=Object.freeze(Object.defineProperty({__proto__:null,ArtPlayerError:_i,addClass:K,append:U,assToVtt:Hi,capitalize:ar,clamp:Ee,createElement:me,debounce:Ui,def:j,download:qi,errorHandle:Le,escape:Oi,get:Fi,getComposedPath:So,getExt:rn,getIcon:Ri,getRect:_e,getStyle:Vd,has:Kt,hasClass:ze,includeFromEvent:yt,inverseClass:De,isBrowser:nr,isIOS:Ii,isIOS13:Pi,isInViewport:wo,isMobile:ue,isSafari:Ci,loadImg:Di,mergeDeep:ir,query:$e,queryAll:hn,remove:rr,removeClass:ye,replaceElement:xo,secondToTime:qe,setStyle:L,setStyleText:Ni,setStyles:or,siblings:Ai,sleep:It,srtToVtt:zi,supportsFlex:Bi,throttle:Vi,tooltip:He,unescape:jd,userAgent:pn,vttToBlob:On},Symbol.toStringTag,{value:"Module"})),Ma="array",re="boolean",ve="string",Ne="number",pt="object",je="function";function ji(e,t,n){return Le(t===ve||t===Ne||e instanceof Element,`${n.join(".")} require '${ve}' or 'Element' type`)}const zt={html:ji,disable:`?${re}`,name:`?${ve}`,index:`?${Ne}`,style:`?${pt}`,click:`?${je}`,mounted:`?${je}`,tooltip:`?${ve}|${Ne}`,width:`?${Ne}`,selector:`?${Ma}`,onSelect:`?${je}`,switch:`?${re}`,onSwitch:`?${je}`,range:`?${Ma}`,onRange:`?${je}`,onChange:`?${je}`},Xr={id:ve,container:ji,url:ve,poster:ve,type:ve,theme:ve,lang:ve,volume:Ne,isLive:re,muted:re,autoplay:re,autoSize:re,autoMini:re,loop:re,flip:re,playbackRate:re,aspectRatio:re,screenshot:re,setting:re,hotkey:re,pip:re,mutex:re,backdrop:re,fullscreen:re,fullscreenWeb:re,subtitleOffset:re,miniProgressBar:re,useSSR:re,playsInline:re,lock:re,gesture:re,fastForward:re,autoPlayback:re,autoOrientation:re,airplay:re,proxy:`?${je}`,plugins:[je],layers:[zt],contextmenu:[zt],settings:[zt],controls:[{...zt,position:(e,t,n)=>{const r=["top","left","right"];return Le(r.includes(e),`${n.join(".")} only accept ${r.toString()} as parameters`)}}],quality:[{default:`?${re}`,html:ve,url:ve}],highlight:[{time:Ne,text:ve}],thumbnails:{url:ve,number:Ne,column:Ne,width:Ne,height:Ne,scale:Ne},subtitle:{url:ve,name:ve,type:ve,style:pt,escape:re,encoding:ve,onVttLoad:je},moreVideoAttr:pt,i18n:pt,icons:pt,cssVar:pt,customType:pt};class at{constructor(t){this.id=0,this.art=t,this.cache=new Map,this.add=this.add.bind(this),this.remove=this.remove.bind(this),this.update=this.update.bind(this)}get show(){return ze(this.art.template.$player,`art-${this.name}-show`)}set show(t){const{$player:n}=this.art.template,r=`art-${this.name}-show`;t?K(n,r):ye(n,r),this.art.emit(this.name,t)}toggle(){this.show=!this.show}add(t){const n=typeof t=="function"?t(this.art):t;if(n.html=n.html||"",Gt(n,zt),!this.$parent||!this.name||n.disable)return;const r=n.name||`${this.name}${this.id}`;Le(!this.cache.has(r),`Can't add an existing [${r}] to the [${this.name}]`),this.id+=1;const o=me("div");K(o,`art-${this.name}`),K(o,`art-${this.name}-${r}`);const a=Array.from(this.$parent.children);o.dataset.index=n.index||this.id;const i=a.find(l=>Number(l.dataset.index)>=Number(o.dataset.index));i?i.insertAdjacentElement("beforebegin",o):U(this.$parent,o),n.html&&U(o,n.html),n.style&&or(o,n.style),n.tooltip&&He(o,n.tooltip);const s=[];if(n.click){const l=this.art.events.proxy(o,"click",u=>{u.preventDefault(),n.click.call(this.art,this,u)});s.push(l)}return n.selector&&["left","right"].includes(n.position)&&this.selector(n,o,s),this[r]=o,this.cache.set(r,{$ref:o,events:s,option:n}),n.mounted&&n.mounted.call(this.art,o),o}remove(t){Le(this.cache.has(t),`Can't find [${t}] from the [${this.name}]`);const n=this.cache.get(t);n.option.beforeUnmount&&n.option.beforeUnmount.call(this.art,n.$ref);for(const r of n.events)this.art.events.remove(r);this.cache.delete(t),delete this[t],rr(n.$ref)}update(t){if(this.cache.has(t.name)){const n=this.cache.get(t.name);t=Object.assign(n.option,t),this.remove(t.name)}return this.add(t)}}function Xd(e){return t=>{const{i18n:n,constructor:{ASPECT_RATIO:r}}=t,o=r.map(a=>`<span data-value="${a}">${a==="default"?n.get("Default"):a}</span>`).join("");return{...e,html:`${n.get("Aspect Ratio")}: ${o}`,click:(a,i)=>{const{value:s}=i.target.dataset;s&&(t.aspectRatio=s,a.show=!1)},mounted:a=>{const i=$e('[data-value="default"]',a);i&&De(i,"art-current"),t.on("aspectRatio",s=>{const l=hn("span",a).find(u=>u.dataset.value===s);l&&De(l,"art-current")})}}}}function Kd(e){return t=>({...e,html:t.i18n.get("Close"),click:n=>{n.show=!1}})}function Jd(e){return t=>{const{i18n:n,constructor:{FLIP:r}}=t,o=r.map(a=>`<span data-value="${a}">${n.get(ar(a))}</span>`).join("");return{...e,html:`${n.get("Video Flip")}: ${o}`,click:(a,i)=>{const{value:s}=i.target.dataset;s&&(t.flip=s.toLowerCase(),a.show=!1)},mounted:a=>{const i=$e('[data-value="normal"]',a);i&&De(i,"art-current"),t.on("flip",s=>{const l=hn("span",a).find(u=>u.dataset.value===s);l&&De(l,"art-current")})}}}}function Qd(e){return t=>({...e,html:t.i18n.get("Video Info"),click:n=>{t.info.show=!0,n.show=!1}})}function Zd(e){return t=>{const{i18n:n,constructor:{PLAYBACK_RATE:r}}=t,o=r.map(a=>`<span data-value="${a}">${a===1?n.get("Normal"):a.toFixed(1)}</span>`).join("");return{...e,html:`${n.get("Play Speed")}: ${o}`,click:(a,i)=>{const{value:s}=i.target.dataset;s&&(t.playbackRate=Number(s),a.show=!1)},mounted:a=>{const i=$e('[data-value="1"]',a);i&&De(i,"art-current"),t.on("video:ratechange",()=>{const s=hn("span",a).find(l=>Number(l.dataset.value)===t.playbackRate);s&&De(s,"art-current")})}}}}function eu(e){const t=nr?location.href:"";return{...e,html:`<a href="https://artplayer.org?ref=${encodeURIComponent(t)}" target="_blank" style="width:100%;">ArtPlayer ${bo}</a>`}}class tu extends at{constructor(t){super(t),this.name="contextmenu",this.$parent=t.template.$contextmenu,ue||this.init()}init(){const{option:t,proxy:n,template:{$player:r,$contextmenu:o}}=this.art;t.playbackRate&&this.add(Zd({name:"playbackRate",index:10})),t.aspectRatio&&this.add(Xd({name:"aspectRatio",index:20})),t.flip&&this.add(Jd({name:"flip",index:30})),this.add(Qd({name:"info",index:40})),this.add(eu({name:"version",index:50})),this.add(Kd({name:"close",index:60}));for(let a=0;a<t.contextmenu.length;a++)this.add(t.contextmenu[a]);n(r,"contextmenu",a=>{if(!this.art.constructor.CONTEXTMENU)return;a.preventDefault(),this.show=!0;const i=a.clientX,s=a.clientY,{height:l,width:u,left:f,top:p}=_e(r),{height:h,width:w}=_e(o);let m=i-f,y=s-p;i+w>f+u&&(m=u-w),s+h>p+l&&(y=l-h),or(o,{top:`${y}px`,left:`${m}px`})}),n(r,"click",a=>{yt(a,o)||(this.show=!1)}),this.art.on("blur",()=>{this.show=!1})}}function nu(e){return t=>({...e,tooltip:t.i18n.get("AirPlay"),mounted:n=>{const{proxy:r,icons:o}=t;U(n,o.airplay),r(n,"click",()=>t.airplay())}})}function ru(e){return t=>({...e,tooltip:t.i18n.get("Fullscreen"),mounted:n=>{const{proxy:r,icons:o,i18n:a}=t,i=U(n,o.fullscreenOn),s=U(n,o.fullscreenOff);L(s,"display","none"),r(n,"click",()=>{t.fullscreen=!t.fullscreen}),t.on("fullscreen",l=>{l?(He(n,a.get("Exit Fullscreen")),L(i,"display","none"),L(s,"display","inline-flex")):(He(n,a.get("Fullscreen")),L(i,"display","inline-flex"),L(s,"display","none"))})}})}function ou(e){return t=>({...e,tooltip:t.i18n.get("Web Fullscreen"),mounted:n=>{const{proxy:r,icons:o,i18n:a}=t,i=U(n,o.fullscreenWebOn),s=U(n,o.fullscreenWebOff);L(s,"display","none"),r(n,"click",()=>{t.fullscreenWeb=!t.fullscreenWeb}),t.on("fullscreenWeb",l=>{l?(He(n,a.get("Exit Web Fullscreen")),L(i,"display","none"),L(s,"display","inline-flex")):(He(n,a.get("Web Fullscreen")),L(i,"display","inline-flex"),L(s,"display","none"))})}})}function au(e){return t=>({...e,tooltip:t.i18n.get("PIP Mode"),mounted:n=>{const{proxy:r,icons:o,i18n:a}=t;U(n,o.pip),r(n,"click",()=>{t.pip=!t.pip}),t.on("pip",i=>{He(n,a.get(i?"Exit PIP Mode":"PIP Mode"))})}})}function iu(e){return t=>({...e,mounted:n=>{const{proxy:r,icons:o,i18n:a}=t,i=U(n,o.play),s=U(n,o.pause);He(i,a.get("Play")),He(s,a.get("Pause")),r(i,"click",()=>{t.play()}),r(s,"click",()=>{t.pause()});function l(){L(i,"display","flex"),L(s,"display","none")}function u(){L(i,"display","none"),L(s,"display","flex")}t.playing?u():l(),t.on("video:playing",()=>{u()}),t.on("video:pause",()=>{l()})}})}function Ht(e,t){const{$progress:n}=e.template,{left:r}=_e(n),o=ue?t.touches[0].clientX:t.clientX,a=Ee(o-r,0,n.clientWidth),i=a/n.clientWidth*e.duration,s=qe(i),l=Ee(a/n.clientWidth,0,1);return{second:i,time:s,width:a,percentage:l}}function Wi(e,t){if(e.isRotate){const n=t.touches[0].clientY/e.height,r=n*e.duration;e.emit("setBar","played",n,t),e.seek=r}else{const{second:n,percentage:r}=Ht(e,t);e.emit("setBar","played",r,t),e.seek=n}}function su(e){return t=>{const{icons:n,option:r,proxy:o}=t,{$player:a,$progress:i}=t.template;return{...e,html:`
                <div class="art-control-progress-inner">
                    <div class="art-progress-hover"></div>
                    <div class="art-progress-loaded"></div>
                    <div class="art-progress-played"></div>
                    <div class="art-progress-highlight"></div>
                    <div class="art-progress-indicator"></div>
                    <div class="art-progress-tip">00:00</div>
                </div>
            `,mounted:s=>{let l=null,u=!1;const f=$e(".art-progress-hover",s),p=$e(".art-progress-loaded",s),h=$e(".art-progress-played",s),w=$e(".art-progress-highlight",s),m=$e(".art-progress-indicator",s),y=$e(".art-progress-tip",s);n.indicator?U(m,n.indicator):L(m,"backgroundColor","var(--art-theme)");function g(b){const{width:$}=Ht(t,b),{text:I}=b.target.dataset;y.textContent=I;const T=y.clientWidth;$<=T/2?L(y,"left",0):$>s.clientWidth-T/2?L(y,"left",`${s.clientWidth-T}px`):L(y,"left",`${$-T/2}px`)}function A(b,$){const{width:I,time:T}=$||Ht(t,b);y.textContent=T||"00:00";const x=y.clientWidth;I<=x/2?L(y,"left",0):I>s.clientWidth-x/2?L(y,"left",`${s.clientWidth-x}px`):L(y,"left",`${I-x/2}px`)}function R(){w.textContent="";for(let b=0;b<r.highlight.length;b++){const $=r.highlight[b],I=Ee($.time,0,t.duration)/t.duration*100,T=`<span data-text="${$.text}" data-time="${$.time}" style="left: ${I}%"></span>`;U(w,T)}}function k(b,$,I){const T=b==="played"&&I&&ue;if(b==="loaded"&&L(p,"width",`${$*100}%`),b==="hover"&&(L(f,"width",`${$*100}%`),yt(I,w)?g(I):A(I),$===0?ye(a,"art-progress-hover"):K(a,"art-progress-hover")),b==="played"&&(L(h,"width",`${$*100}%`),L(m,"left",`${$*100}%`)),T){K(a,"art-progress-hover");const x=s.clientWidth*$,P=qe($*t.duration);A(I,{width:x,time:P}),clearTimeout(l),l=setTimeout(()=>{ye(a,"art-progress-hover")},500)}}t.on("setBar",k),t.on("video:loadedmetadata",R),t.constructor.USE_RAF?t.on("raf",()=>{t.emit("setBar","played",t.played),t.emit("setBar","loaded",t.loaded)}):(t.on("video:timeupdate",()=>{t.emit("setBar","played",t.played)}),t.on("video:progress",()=>{t.emit("setBar","loaded",t.loaded)}),t.on("video:ended",()=>{t.emit("setBar","played",1)})),t.emit("setBar","loaded",t.loaded||0),ue||(o(i,"click",b=>{b.target!==m&&Wi(t,b)}),o(i,"mousemove",b=>{const{percentage:$}=Ht(t,b);t.emit("setBar","hover",$,b)}),o(i,"mouseleave",b=>{t.emit("setBar","hover",0,b)}),o(i,"mousedown",b=>{u=b.button===0}),t.on("document:mousemove",b=>{if(u){const{second:$,percentage:I}=Ht(t,b);t.emit("setBar","played",I,b),t.seek=$}}),t.on("document:mouseup",()=>{u&&(u=!1)}))}}}}function lu(e){return t=>({...e,tooltip:t.i18n.get("Screenshot"),mounted:n=>{const{proxy:r,icons:o}=t;U(n,o.screenshot),r(n,"click",()=>{t.screenshot()})}})}function cu(e){return t=>({...e,tooltip:t.i18n.get("Show Setting"),mounted:n=>{const{proxy:r,icons:o,i18n:a}=t;U(n,o.setting),r(n,"click",()=>{t.setting.toggle(),t.setting.resize()}),t.on("setting",i=>{He(n,a.get(i?"Hide Setting":"Show Setting"))})}})}function du(e){return t=>({...e,style:ue?{fontSize:"12px",padding:"0 5px"}:{cursor:"auto",padding:"0 10px"},mounted:n=>{function r(){const a=`${qe(t.currentTime)} / ${qe(t.duration)}`;a!==n.textContent&&(n.textContent=a)}r();const o=["video:loadedmetadata","video:timeupdate","video:progress"];for(let a=0;a<o.length;a++)t.on(o[a],r)}})}function uu(e){return t=>({...e,mounted:n=>{const{proxy:r,icons:o}=t,a=U(n,o.volume),i=U(n,o.volumeClose),s=U(n,'<div class="art-volume-panel"></div>'),l=U(s,'<div class="art-volume-inner"></div>'),u=U(l,'<div class="art-volume-val"></div>'),f=U(l,'<div class="art-volume-slider"></div>'),p=U(f,'<div class="art-volume-handle"></div>'),h=U(p,'<div class="art-volume-loaded"></div>'),w=U(f,'<div class="art-volume-indicator"></div>');function m(g){const{top:A,height:R}=_e(f);return 1-(g.clientY-A)/R}function y(){if(t.muted||t.volume===0)L(a,"display","none"),L(i,"display","flex"),L(w,"top","100%"),L(h,"top","100%"),u.textContent=0;else{const g=t.volume*100;L(a,"display","flex"),L(i,"display","none"),L(w,"top",`${100-g}%`),L(h,"top",`${100-g}%`),u.textContent=Math.floor(g)}}if(y(),t.on("video:volumechange",y),r(a,"click",()=>{t.muted=!0}),r(i,"click",()=>{t.muted=!1}),ue)L(s,"display","none");else{let g=!1;r(f,"mousedown",A=>{g=A.button===0,t.volume=m(A)}),t.on("document:mousemove",A=>{g&&(t.muted=!1,t.volume=m(A))}),t.on("document:mouseup",()=>{g&&(g=!1)})}}})}class fu extends at{constructor(t){super(t),this.isHover=!1,this.name="control",this.timer=Date.now();const{constructor:n}=t,{$player:r,$bottom:o}=this.art.template;t.on("mousemove",()=>{ue||(this.show=!0)}),t.on("click",()=>{ue?this.toggle():this.show=!0}),t.on("document:mousemove",a=>{this.isHover=yt(a,o)}),t.on("video:timeupdate",()=>{!t.setting.show&&!this.isHover&&!t.isInput&&t.playing&&this.show&&Date.now()-this.timer>=n.CONTROL_HIDE_TIME&&(this.show=!1)}),t.on("control",a=>{a?(ye(r,"art-hide-cursor"),K(r,"art-hover"),this.timer=Date.now()):(K(r,"art-hide-cursor"),ye(r,"art-hover"))}),this.init()}init(){const{option:t}=this.art;t.isLive||this.add(su({name:"progress",position:"top",index:10})),this.add({name:"thumbnails",position:"top",index:20}),this.add(iu({name:"playAndPause",position:"left",index:10})),this.add(uu({name:"volume",position:"left",index:20})),t.isLive||this.add(du({name:"time",position:"left",index:30})),t.quality.length&&It().then(()=>{this.art.quality=t.quality}),t.screenshot&&!ue&&this.add(lu({name:"screenshot",position:"right",index:20})),t.setting&&this.add(cu({name:"setting",position:"right",index:30})),t.pip&&this.add(au({name:"pip",position:"right",index:40})),t.airplay&&window.WebKitPlaybackTargetAvailabilityEvent&&this.add(nu({name:"airplay",position:"right",index:50})),t.fullscreenWeb&&this.add(ou({name:"fullscreenWeb",position:"right",index:60})),t.fullscreen&&this.add(ru({name:"fullscreen",position:"right",index:70}));for(let n=0;n<t.controls.length;n++)this.add(t.controls[n])}add(t){const n=typeof t=="function"?t(this.art):t,{$progress:r,$controlsLeft:o,$controlsRight:a}=this.art.template;switch(n.position){case"top":this.$parent=r;break;case"left":this.$parent=o;break;case"right":this.$parent=a;break;default:Le(!1,"Control option.position must one of 'top', 'left', 'right'");break}super.add(n)}check(t){if(t){t.$control_value.innerHTML=t.html;for(let n=0;n<t.$control_option.length;n++){const r=t.$control_option[n];r.default=r===t,r.default&&De(r.$control_item,"art-current")}}}selector(t,n,r){const{proxy:o}=this.art.events;K(n,"art-control-selector");const a=me("div");K(a,"art-selector-value"),U(a,t.html),n.textContent="",U(n,a);const i=me("div");K(i,"art-selector-list"),U(n,i);for(let l=0;l<t.selector.length;l++){const u=t.selector[l],f=me("div");K(f,"art-selector-item"),u.default&&K(f,"art-current"),f.dataset.index=l,f.dataset.value=u.value,f.innerHTML=u.html,U(i,f),j(u,"$control_option",{get:()=>t.selector}),j(u,"$control_item",{get:()=>f}),j(u,"$control_value",{get:()=>a})}const s=o(i,"click",async l=>{const u=So(l),f=t.selector.find(p=>p.$control_item===u.find(h=>p.$control_item===h));this.check(f),t.onSelect&&(a.innerHTML=await t.onSelect.call(this.art,f,f.$control_item,l))});r.push(s)}}function pu(e,t){const{constructor:n,template:{$player:r,$video:o}}=e;function a(s){yt(s,r)?(e.isInput=s.target.tagName==="INPUT",e.isFocus=!0,e.emit("focus",s)):(e.isInput=!1,e.isFocus=!1,e.emit("blur",s))}e.on("document:click",a),e.on("document:contextmenu",a);let i=[];t.proxy(o,"click",s=>{const l=Date.now();i.push(l);const{MOBILE_CLICK_PLAY:u,DBCLICK_TIME:f,MOBILE_DBCLICK_PLAY:p,DBCLICK_FULLSCREEN:h}=n,w=i.filter(m=>l-m<=f);switch(w.length){case 1:e.emit("click",s),ue?!e.isLock&&u&&e.toggle():e.toggle(),i=w;break;case 2:e.emit("dblclick",s),ue?!e.isLock&&p&&e.toggle():h&&(e.fullscreen=!e.fullscreen),i=[];break;default:i=[]}})}function hu(e,t){return Math.atan2(t,e)*180/Math.PI}function mu(e,t,n,r){const o=t-r,a=n-e;let i=0;if(Math.abs(a)<2&&Math.abs(o)<2)return i;const s=hu(a,o);return s>=-45&&s<45?i=4:s>=45&&s<135?i=1:s>=-135&&s<-45?i=2:(s>=135&&s<=180||s>=-180&&s<-135)&&(i=3),i}function gu(e,t){if(ue&&!e.option.isLive){const{$video:n,$progress:r}=e.template;let o=null,a=!1,i=0,s=0,l=0;const u=h=>{if(h.touches.length===1&&!e.isLock){o===r&&Wi(e,h),a=!0;const{pageX:w,pageY:m}=h.touches[0];i=w,s=m,l=e.currentTime}},f=h=>{if(h.touches.length===1&&a&&e.duration){const{pageX:w,pageY:m}=h.touches[0],y=mu(i,s,w,m),g=[3,4].includes(y),A=[1,2].includes(y);if(g&&!e.isRotate||A&&e.isRotate){const k=Ee((w-i)/e.width,-1,1),b=Ee((m-s)/e.height,-1,1),$=e.isRotate?b:k,I=o===n?e.constructor.TOUCH_MOVE_RATIO:1,T=Ee(l+e.duration*$*I,0,e.duration);e.seek=T,e.emit("setBar","played",Ee(T/e.duration,0,1),h),e.notice.show=`${qe(T)} / ${qe(e.duration)}`}}},p=()=>{a&&(i=0,s=0,l=0,a=!1,o=null)};e.option.gesture&&(t.proxy(n,"touchstart",h=>{o=n,u(h)}),t.proxy(n,"touchmove",f)),t.proxy(r,"touchstart",h=>{o=r,u(h)}),t.proxy(r,"touchmove",f),e.on("document:touchend",p)}}function yu(e,t){const n=["click","mouseup","keydown","touchend","touchmove","mousemove","pointerup","contextmenu","pointermove","visibilitychange","webkitfullscreenchange"],r=["resize","scroll","orientationchange"],o=[];function a(i={}){for(let l=0;l<o.length;l++)t.remove(o[l]);o.length=0;const{$player:s}=e.template;n.forEach(l=>{const u=i.document||s.ownerDocument||document,f=t.proxy(u,l,p=>{e.emit(`document:${l}`,p)});o.push(f)}),r.forEach(l=>{const u=i.window||s.ownerDocument?.defaultView||window,f=t.proxy(u,l,p=>{e.emit(`window:${l}`,p)});o.push(f)})}a(),t.bindGlobalEvents=a}function vu(e,t){const{$player:n}=e.template;t.hover(n,r=>{K(n,"art-hover"),e.emit("hover",!0,r)},r=>{ye(n,"art-hover"),e.emit("hover",!1,r)})}function bu(e,t){const{$player:n}=e.template;t.proxy(n,"mousemove",r=>{e.emit("mousemove",r)})}function wu(e,t){const{option:n,constructor:r}=e;e.on("resize",()=>{const{aspectRatio:a,notice:i}=e;e.state==="standard"&&n.autoSize&&e.autoSize(),e.aspectRatio=a,i.show=""});const o=Ui(()=>e.emit("resize"),r.RESIZE_TIME);e.on("window:orientationchange",()=>o()),e.on("window:resize",()=>o()),screen&&screen.orientation&&screen.orientation.onchange&&t.proxy(screen.orientation,"change",()=>o())}function xu(e){if(e.constructor.USE_RAF){let t=null;(function n(){e.playing&&e.emit("raf"),e.isDestroy||(t=requestAnimationFrame(n))})(),e.on("destroy",()=>{cancelAnimationFrame(t)})}}function Su(e){const{option:t,constructor:n,template:{$container:r}}=e,o=Vi(()=>{e.emit("view",wo(r,n.SCROLL_GAP))},n.SCROLL_TIME);e.on("window:scroll",()=>o()),e.on("view",a=>{t.autoMini&&(e.mini=!a)})}class ku{constructor(t){this.destroyEvents=new Set,this.proxy=this.proxy.bind(this),this.hover=this.hover.bind(this),pu(t,this),vu(t,this),bu(t,this),wu(t,this),gu(t,this),Su(t),yu(t,this),xu(t)}proxy(t,n,r,o={}){if(Array.isArray(n))return n.map(i=>this.proxy(t,i,r,o));t.addEventListener(n,r,o);const a=()=>t.removeEventListener(n,r,o);return this.destroyEvents.add(a),a}hover(t,n,r){n&&this.proxy(t,"mouseenter",n),r&&this.proxy(t,"mouseleave",r)}remove(t){if(this.destroyEvents.has(t))try{t()}catch(n){console.warn("Failed to remove event listener:",n)}finally{this.destroyEvents.delete(t)}}destroy(){for(const t of this.destroyEvents)try{t()}catch(n){console.warn("Failed to destroy event listener:",n)}this.destroyEvents.clear()}}class $u{constructor(t){this.art=t,this.keys={},ue||this.init()}init(){const{constructor:t}=this.art;this.art.option.hotkey&&(this.add("Escape",()=>{this.art.fullscreenWeb&&(this.art.fullscreenWeb=!1)}),this.add("Space",()=>{this.art.toggle()}),this.add("ArrowLeft",()=>{this.art.backward=t.SEEK_STEP}),this.add("ArrowUp",()=>{this.art.volume+=t.VOLUME_STEP}),this.add("ArrowRight",()=>{this.art.forward=t.SEEK_STEP}),this.add("ArrowDown",()=>{this.art.volume-=t.VOLUME_STEP})),this.art.on("document:keydown",n=>{if(this.art.isFocus){const r=document.activeElement.tagName.toUpperCase(),o=document.activeElement.getAttribute("contenteditable");if(r!=="INPUT"&&r!=="TEXTAREA"&&o!==""&&o!=="true"&&!n.altKey&&!n.ctrlKey&&!n.metaKey&&!n.shiftKey){const a=this.keys[n.code];if(a){n.preventDefault();for(let i=0;i<a.length;i++)a[i].call(this.art,n);this.art.emit("hotkey",n)}}}this.art.emit("keydown",n)})}add(t,n){return this.keys[t]?this.keys[t].includes(n)||this.keys[t].push(n):this.keys[t]=[n],this}remove(t,n){if(this.keys[t]){const r=this.keys[t].indexOf(n);r!==-1&&this.keys[t].splice(r,1),this.keys[t].length===0&&delete this.keys[t]}return this}}const Yi={"Video Info":"统计信息",Close:"关闭","Video Load Failed":"加载失败",Volume:"音量",Play:"播放",Pause:"暂停",Rate:"速度",Mute:"静音","Video Flip":"画面翻转",Horizontal:"水平",Vertical:"垂直",Reconnect:"重新连接","Show Setting":"显示设置","Hide Setting":"隐藏设置",Screenshot:"截图","Play Speed":"播放速度","Aspect Ratio":"画面比例",Default:"默认",Normal:"正常",Open:"打开","Switch Video":"切换","Switch Subtitle":"切换字幕",Fullscreen:"全屏","Exit Fullscreen":"退出全屏","Web Fullscreen":"网页全屏","Exit Web Fullscreen":"退出网页全屏","Mini Player":"迷你播放器","PIP Mode":"开启画中画","Exit PIP Mode":"退出画中画","PIP Not Supported":"不支持画中画","Fullscreen Not Supported":"不支持全屏","Subtitle Offset":"字幕偏移","Last Seen":"上次看到","Jump Play":"跳转播放",AirPlay:"隔空播放","AirPlay Not Available":"隔空播放不可用"};typeof window<"u"&&(window["artplayer-i18n-zh-cn"]=Yi);class Mu{constructor(t){this.art=t,this.languages={"zh-cn":Yi},this.language={},this.update(t.option.i18n)}init(){const t=this.art.option.lang.toLowerCase();this.language=this.languages[t]||{}}get(t){return this.language[t]||t}update(t){this.languages=ir(this.languages,t),this.init()}}const Eu=`<svg width="18px" height="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <g>
        <path d="M16,1 L2,1 C1.447,1 1,1.447 1,2 L1,12 C1,12.553 1.447,13 2,13 L5,13 L5,11 L3,11 L3,3 L15,3 L15,11 L13,11 L13,13 L16,13 C16.553,13 17,12.553 17,12 L17,2 C17,1.447 16.553,1 16,1 L16,1 Z"></path>
        <polygon points="4 17 14 17 9 11"></polygon>
    </g>
</svg>
`,Tu=`<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" version="1.1" viewBox="0 0 32 32">
    <path d="M 19.41,20.09 14.83,15.5 19.41,10.91 18,9.5 l -6,6 6,6 z" />
</svg>`,Lu=`<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" version="1.1" viewBox="0 0 32 32">
    <path d="m 12.59,20.34 4.58,-4.59 -4.58,-4.59 1.41,-1.41 6,6 -6,6 z" />
</svg>`,Cu='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px);"><defs><clipPath id="__lottie_element_216"><rect width="88" height="88" x="0" y="0"></rect></clipPath></defs><g clip-path="url(#__lottie_element_216)"><g transform="matrix(1,0,0,1,44,44)" opacity="1" style="display: block;"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill-opacity="1" d=" M12.437999725341797,-12.70199966430664 C12.437999725341797,-12.70199966430664 9.618000030517578,-9.881999969482422 9.618000030517578,-9.881999969482422 C8.82800006866455,-9.092000007629395 8.82800006866455,-7.831999778747559 9.618000030517578,-7.052000045776367 C9.618000030517578,-7.052000045776367 16.687999725341797,0.017999999225139618 16.687999725341797,0.017999999225139618 C16.687999725341797,0.017999999225139618 9.618000030517578,7.0879998207092285 9.618000030517578,7.0879998207092285 C8.82800006866455,7.877999782562256 8.82800006866455,9.137999534606934 9.618000030517578,9.918000221252441 C9.618000030517578,9.918000221252441 12.437999725341797,12.748000144958496 12.437999725341797,12.748000144958496 C13.227999687194824,13.527999877929688 14.48799991607666,13.527999877929688 15.267999649047852,12.748000144958496 C15.267999649047852,12.748000144958496 26.58799934387207,1.437999963760376 26.58799934387207,1.437999963760376 C27.368000030517578,0.6579999923706055 27.368000030517578,-0.6119999885559082 26.58799934387207,-1.3919999599456787 C26.58799934387207,-1.3919999599456787 15.267999649047852,-12.70199966430664 15.267999649047852,-12.70199966430664 C14.48799991607666,-13.491999626159668 13.227999687194824,-13.491999626159668 12.437999725341797,-12.70199966430664z M-12.442000389099121,-12.70199966430664 C-13.182000160217285,-13.442000389099121 -14.362000465393066,-13.482000350952148 -15.142000198364258,-12.821999549865723 C-15.142000198364258,-12.821999549865723 -15.272000312805176,-12.70199966430664 -15.272000312805176,-12.70199966430664 C-15.272000312805176,-12.70199966430664 -26.582000732421875,-1.3919999599456787 -26.582000732421875,-1.3919999599456787 C-27.32200050354004,-0.6520000100135803 -27.36199951171875,0.5180000066757202 -26.70199966430664,1.3079999685287476 C-26.70199966430664,1.3079999685287476 -26.582000732421875,1.437999963760376 -26.582000732421875,1.437999963760376 C-26.582000732421875,1.437999963760376 -15.272000312805176,12.748000144958496 -15.272000312805176,12.748000144958496 C-14.531999588012695,13.48799991607666 -13.362000465393066,13.527999877929688 -12.571999549865723,12.868000030517578 C-12.571999549865723,12.868000030517578 -12.442000389099121,12.748000144958496 -12.442000389099121,12.748000144958496 C-12.442000389099121,12.748000144958496 -9.612000465393066,9.918000221252441 -9.612000465393066,9.918000221252441 C-8.871999740600586,9.178000450134277 -8.831999778747559,8.008000373840332 -9.501999855041504,7.2179999351501465 C-9.501999855041504,7.2179999351501465 -9.612000465393066,7.0879998207092285 -9.612000465393066,7.0879998207092285 C-9.612000465393066,7.0879998207092285 -16.68199920654297,0.017999999225139618 -16.68199920654297,0.017999999225139618 C-16.68199920654297,0.017999999225139618 -9.612000465393066,-7.052000045776367 -9.612000465393066,-7.052000045776367 C-8.871999740600586,-7.791999816894531 -8.831999778747559,-8.961999893188477 -9.501999855041504,-9.751999855041504 C-9.501999855041504,-9.751999855041504 -9.612000465393066,-9.881999969482422 -9.612000465393066,-9.881999969482422 C-9.612000465393066,-9.881999969482422 -12.442000389099121,-12.70199966430664 -12.442000389099121,-12.70199966430664z M28,-28 C32.41999816894531,-28 36,-24.420000076293945 36,-20 C36,-20 36,20 36,20 C36,24.420000076293945 32.41999816894531,28 28,28 C28,28 -28,28 -28,28 C-32.41999816894531,28 -36,24.420000076293945 -36,20 C-36,20 -36,-20 -36,-20 C-36,-24.420000076293945 -32.41999816894531,-28 -28,-28 C-28,-28 28,-28 28,-28z" data-darkreader-inline-fill="" style="--darkreader-inline-fill:#a8a6a4;"></path></g></g></g></svg>',Iu=`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" style="width: 100%; height: 100%;">
<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
</svg>`,Pu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg t="1655876154826" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="22" height="22">
<path d="M571.733333 512l268.8-268.8c17.066667-17.066667 17.066667-42.666667 0-59.733333-17.066667-17.066667-42.666667-17.066667-59.733333 0L512 452.266667 243.2 183.466667c-17.066667-17.066667-42.666667-17.066667-59.733333 0-17.066667 17.066667-17.066667 42.666667 0 59.733333L452.266667 512 183.466667 780.8c-17.066667 17.066667-17.066667 42.666667 0 59.733333 8.533333 8.533333 19.2 12.8 29.866666 12.8s21.333333-4.266667 29.866667-12.8L512 571.733333l268.8 268.8c8.533333 8.533333 19.2 12.8 29.866667 12.8s21.333333-4.266667 29.866666-12.8c17.066667-17.066667 17.066667-42.666667 0-59.733333L571.733333 512z" p-id="2131">
</path>
</svg>`,Au='<svg height="24" viewBox="0 0 24 24" width="24"><path d="M15,17h6v1h-6V17z M11,17H3v1h8v2h1v-2v-1v-2h-1V17z M14,8h1V6V5V3h-1v2H3v1h11V8z            M18,5v1h3V5H18z M6,14h1v-2v-1V9H6v2H3v1 h3V14z M10,12h11v-1H10V12z" data-darkreader-inline-fill="" style="--darkreader-inline-fill:#a8a6a4;"></path></svg>',Ru=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg t="1652850026663" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2749" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50">
<path d="M593.8176 168.5504l356.00384 595.21024c26.15296 43.74528 10.73152 99.7376-34.44736 125.05088-14.39744 8.06912-30.72 12.30848-47.37024 12.30848H155.97568C103.75168 901.12 61.44 860.16 61.44 809.61536c0-16.09728 4.38272-31.92832 12.71808-45.8752L430.16192 168.5504c26.17344-43.7248 84.00896-58.65472 129.20832-33.34144a93.0816 93.0816 0 0 1 34.44736 33.34144zM512 819.2a61.44 61.44 0 1 0 0-122.88 61.44 61.44 0 0 0 0 122.88z m0-512a72.31488 72.31488 0 0 0-71.76192 81.3056l25.72288 205.7216a46.40768 46.40768 0 0 0 92.07808 0l25.72288-205.74208A72.31488 72.31488 0 0 0 512 307.2z" p-id="2750">
</path>
</svg>`,Nu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg t="1652445277062" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24">
<path d="M554.666667 810.666667v85.333333h-85.333334v-85.333333h85.333334zM170.666667 178.005333a42.666667 42.666667 0 0 1 34.986666 18.218667l203.904 291.328a42.666667 42.666667 0 0 1 0 48.896l-203.946666 291.328A42.666667 42.666667 0 0 1 128 803.328V220.672a42.666667 42.666667 0 0 1 42.666667-42.666667z m682.666666 0a42.666667 42.666667 0 0 1 42.368 37.717334l0.298667 4.949333v582.656a42.666667 42.666667 0 0 1-74.24 28.629333l-3.413333-4.181333-203.904-291.328a42.666667 42.666667 0 0 1-3.029334-43.861333l3.029334-5.034667 203.946666-291.328A42.666667 42.666667 0 0 1 853.333333 178.005333zM554.666667 640v85.333333h-85.333334v-85.333333h85.333334zM196.266667 319.104V716.8L335.957333 512 196.309333 319.104zM554.666667 469.333333v85.333334h-85.333334v-85.333334h85.333334z m0-170.666666v85.333333h-85.333334V298.666667h85.333334z m0-170.666667v85.333333h-85.333334V128h85.333334z">
</path>
</svg>
`,Bu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg class="icon" width="22" height="22" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
<path d="M768 298.666667h170.666667v85.333333h-256V128h85.333333v170.666667zM341.333333 384H85.333333V298.666667h170.666667V128h85.333333v256z m426.666667 341.333333v170.666667h-85.333333v-256h256v85.333333h-170.666667zM341.333333 640v256H256v-170.666667H85.333333v-85.333333h256z" />
</svg>
`,Du=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg class="icon" width="22" height="22" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
<path d="M625.777778 256h142.222222V398.222222h113.777778V142.222222H625.777778v113.777778zM256 398.222222V256H398.222222v-113.777778H142.222222V398.222222h113.777778zM768 625.777778v142.222222H625.777778v113.777778h256V625.777778h-113.777778zM398.222222 768H256V625.777778h-113.777778v256H398.222222v-113.777778z" />
</svg>
`,_u=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg class="icon" width="18" height="18" viewBox="0 0 1152 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
<path d="M1075.2 0H76.8A76.8 76.8 0 0 0 0 76.8v870.4A76.8 76.8 0 0 0 76.8 1024h998.4a76.8 76.8 0 0 0 76.8-76.8V76.8A76.8 76.8 0 0 0 1075.2 0zM1024 128v768H128V128h896zM896 512a64 64 0 0 1 7.488 127.552L896 640h-128v128a64 64 0 0 1-56.512 63.552L704 832a64 64 0 0 1-63.552-56.512L640 768V582.592c0-34.496 25.024-66.112 61.632-70.208L709.632 512H896zM256 512a64 64 0 0 1-7.488-127.552L256 384h128V256a64 64 0 0 1 56.512-63.552L448 192a64 64 0 0 1 63.552 56.512L512 256v185.408c0 34.432-25.024 66.112-61.632 70.144L442.368 512H256z" />
</svg>
`,qu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg class="icon" width="18" height="18" viewBox="0 0 1152 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
<path d="M1075.2 0H76.8A76.8 76.8 0 0 0 0 76.8v870.4A76.8 76.8 0 0 0 76.8 1024h998.4a76.8 76.8 0 0 0 76.8-76.8V76.8A76.8 76.8 0 0 0 1075.2 0zM1024 128v768H128V128h896zM448 192a64 64 0 0 1 7.488 127.552L448 320H320v128a64 64 0 0 1-56.512 63.552L256 512a64 64 0 0 1-63.552-56.512L192 448V262.592c0-34.432 25.024-66.112 61.632-70.144L261.632 192H448zM704 832a64 64 0 0 1-7.488-127.552L704 704h128V576a64 64 0 0 1 56.512-63.552L896 512a64 64 0 0 1 63.552 56.512L960 576v185.408c0 34.496-25.024 66.112-61.632 70.208l-8 0.384H704z" />
</svg>
`,Ou=`<svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="uil-default">
  <rect x="0" y="0" width="100" height="100" fill="none" class="bk"/>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(0 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-1s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(30 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.9166666666666666s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(60 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.8333333333333334s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(90 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.75s" repeatCount="indefinite"/></rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(120 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.6666666666666666s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(150 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.5833333333333334s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(180 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.5s" repeatCount="indefinite"/></rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(210 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.4166666666666667s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(240 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.3333333333333333s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(270 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.25s" repeatCount="indefinite"/></rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(300 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.16666666666666666s" repeatCount="indefinite"/>
  </rect>
  <rect x="47" y="40" width="6" height="20" rx="5" ry="5" transform="rotate(330 50 50) translate(0 -30)">
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="-0.08333333333333333s" repeatCount="indefinite"/>
  </rect>
</svg>`,Fu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg t="1650612139149" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20">
<path d="M298.666667 426.666667V341.333333a213.333333 213.333333 0 1 1 426.666666 0v85.333334h42.666667a85.333333 85.333333 0 0 1 85.333333 85.333333v256a85.333333 85.333333 0 0 1-85.333333 85.333333H256a85.333333 85.333333 0 0 1-85.333333-85.333333v-256a85.333333 85.333333 0 0 1 85.333333-85.333333h42.666667z m213.333333-213.333334a128 128 0 0 0-128 128v85.333334h256V341.333333a128 128 0 0 0-128-128z"></path>
</svg>
`,zu=`<svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 22 22">
    <path d="M7 3a2 2 0 0 0-2 2v12a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zM15 3a2 2 0 0 0-2 2v12a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2z"></path>
</svg>`,Hu=`<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
<path d="M844.8 219.648h-665.6c-6.144 0-10.24 4.608-10.24 10.752v563.2c0 5.632 4.096 10.24 10.24 10.24h256v92.16h-256a102.4 102.4 0 0 1-102.4-102.4v-563.2c0-56.832 45.568-102.4 102.4-102.4h665.6a102.4 102.4 0 0 1 102.4 102.4v204.8h-92.16v-204.8c0-6.144-4.608-10.752-10.24-10.752zM614.4 588.8c-28.672 0-51.2 22.528-51.2 51.2v204.8c0 28.16 22.528 51.2 51.2 51.2h281.6c28.16 0 51.2-23.04 51.2-51.2v-204.8c0-28.672-23.04-51.2-51.2-51.2H614.4z"></path>
</svg>`,Uu=`<svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 22 22">
  <path d="M17.982 9.275L8.06 3.27A2.013 2.013 0 0 0 5 4.994v12.011a2.017 2.017 0 0 0 3.06 1.725l9.922-6.005a2.017 2.017 0 0 0 0-3.45z"></path>
</svg>`,Vu='<svg height="24" viewBox="0 0 24 24" width="24"><path d="M10,8v8l6-4L10,8L10,8z M6.3,5L5.7,4.2C7.2,3,9,2.2,11,2l0.1,1C9.3,3.2,7.7,3.9,6.3,5z            M5,6.3L4.2,5.7C3,7.2,2.2,9,2,11 l1,.1C3.2,9.3,3.9,7.7,5,6.3z            M5,17.7c-1.1-1.4-1.8-3.1-2-4.8L2,13c0.2,2,1,3.8,2.2,5.4L5,17.7z            M11.1,21c-1.8-0.2-3.4-0.9-4.8-2 l-0.6,.8C7.2,21,9,21.8,11,22L11.1,21z            M22,12c0-5.2-3.9-9.4-9-10l-0.1,1c4.6,.5,8.1,4.3,8.1,9s-3.5,8.5-8.1,9l0.1,1 C18.2,21.5,22,17.2,22,12z" data-darkreader-inline-fill="" style="--darkreader-inline-fill:#a8a6a4;"></path></svg>',ju=`<svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 50 50">
	<path d="M 19.402344 6 C 17.019531 6 14.96875 7.679688 14.5 10.011719 L 14.097656 12 L 9 12 C 6.238281 12 4 14.238281 4 17 L 4 38 C 4 40.761719 6.238281 43 9 43 L 41 43 C 43.761719 43 46 40.761719 46 38 L 46 17 C 46 14.238281 43.761719 12 41 12 L 35.902344 12 L 35.5 10.011719 C 35.03125 7.679688 32.980469 6 30.597656 6 Z M 25 17 C 30.519531 17 35 21.480469 35 27 C 35 32.519531 30.519531 37 25 37 C 19.480469 37 15 32.519531 15 27 C 15 21.480469 19.480469 17 25 17 Z M 25 19 C 20.589844 19 17 22.589844 17 27 C 17 31.410156 20.589844 35 25 35 C 29.410156 35 33 31.410156 33 27 C 33 22.589844 29.410156 19 25 19 Z "/>
</svg>
`,Wu=`<svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="2"></circle>
    <path d="M19.164 8.861L17.6 8.6a6.978 6.978 0 0 0-1.186-2.099l.574-1.533a1 1 0 0 0-.436-1.217l-1.997-1.153a1.001 1.001 0 0 0-1.272.23l-1.008 1.225a7.04 7.04 0 0 0-2.55.001L8.716 2.829a1 1 0 0 0-1.272-.23L5.447 3.751a1 1 0 0 0-.436 1.217l.574 1.533A6.997 6.997 0 0 0 4.4 8.6l-1.564.261A.999.999 0 0 0 2 9.847v2.306c0 .489.353.906.836.986l1.613.269a7 7 0 0 0 1.228 2.075l-.558 1.487a1 1 0 0 0 .436 1.217l1.997 1.153c.423.244.961.147 1.272-.23l1.04-1.263a7.089 7.089 0 0 0 2.272 0l1.04 1.263a1 1 0 0 0 1.272.23l1.997-1.153a1 1 0 0 0 .436-1.217l-.557-1.487c.521-.61.94-1.31 1.228-2.075l1.613-.269a.999.999 0 0 0 .835-.986V9.847a.999.999 0 0 0-.836-.986zM11 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"></path>
</svg>`,Yu=`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
<path d="M9.5 9.325v5.35q0 .575.525.875t1.025-.05l4.15-2.65q.475-.3.475-.85t-.475-.85L11.05 8.5q-.5-.35-1.025-.05t-.525.875ZM12 22q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/>
</svg>
`,Gu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg class="icon" width="26" height="26" viewBox="0 0 1740 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M511.8976 1024h670.5152c282.4192-0.4096 511.1808-229.4784 511.1808-511.8976 0-282.4192-228.7616-511.488-511.1808-511.8976H511.8976C229.4784 0.6144 0.7168 229.6832 0.7168 512.1024c0 282.4192 228.7616 511.488 511.1808 511.8976zM511.3344 48.64A464.5888 464.5888 0 1 1 48.0256 513.024 463.872 463.872 0 0 1 511.3344 48.4352V48.64z" />
</svg>
`,Xu=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg class="icon" width="26" height="26" viewBox="0 0 1664 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path fill="#648FFC" d="M1152 0H512a512 512 0 0 0 0 1024h640a512 512 0 0 0 0-1024z m0 960a448 448 0 1 1 448-448 448 448 0 0 1-448 448z"  />
</svg>`,Ku=`<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg t="1650612464266" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20"><path d="M666.752 194.517333L617.386667 268.629333A128 128 0 0 0 384 341.333333l0.042667 85.333334h384a85.333333 85.333333 0 0 1 85.333333 85.333333v256a85.333333 85.333333 0 0 1-85.333333 85.333333H256a85.333333 85.333333 0 0 1-85.333333-85.333333v-256a85.333333 85.333333 0 0 1 85.333333-85.333333h42.666667V341.333333a213.333333 213.333333 0 0 1 368.085333-146.816z"></path></svg>
`,Ju=`<svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 22 22">
    <path d="M15 11a3.998 3.998 0 0 0-2-3.465v2.636l1.865 1.865A4.02 4.02 0 0 0 15 11z"></path>
    <path d="M13.583 5.583A5.998 5.998 0 0 1 17 11a6 6 0 0 1-.585 2.587l1.477 1.477a8.001 8.001 0 0 0-3.446-11.286 1 1 0 0 0-.863 1.805zM18.778 18.778l-2.121-2.121-1.414-1.414-1.415-1.415L13 13l-2-2-3.889-3.889-3.889-3.889a.999.999 0 1 0-1.414 1.414L5.172 8H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1l4.188 3.35a.5.5 0 0 0 .812-.39v-3.131l2.587 2.587-.01.005a1 1 0 0 0 .86 1.806c.215-.102.424-.214.627-.333l2.3 2.3a1.001 1.001 0 0 0 1.414-1.416zM11 5.04a.5.5 0 0 0-.813-.39L8.682 5.854 11 8.172V5.04z"></path>
</svg>`,Qu=`<svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 22 22">
    <path d="M10.188 4.65L6 8H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1l4.188 3.35a.5.5 0 0 0 .812-.39V5.04a.498.498 0 0 0-.812-.39zM14.446 3.778a1 1 0 0 0-.862 1.804 6.002 6.002 0 0 1-.007 10.838 1 1 0 0 0 .86 1.806A8.001 8.001 0 0 0 19 11a8.001 8.001 0 0 0-4.554-7.222z"></path>
    <path d="M15 11a3.998 3.998 0 0 0-2-3.465v6.93A3.998 3.998 0 0 0 15 11z"></path>
</svg>`;class Zu{constructor(t){const n={loading:Ou,state:Yu,play:Uu,pause:zu,check:Iu,volume:Qu,volumeClose:Ju,screenshot:ju,setting:Wu,pip:Hu,arrowLeft:Tu,arrowRight:Lu,playbackRate:Vu,aspectRatio:Cu,config:Au,lock:Fu,flip:Nu,unlock:Ku,fullscreenOff:Bu,fullscreenOn:Du,fullscreenWebOff:_u,fullscreenWebOn:qu,switchOn:Xu,switchOff:Gu,error:Ru,close:Pu,airplay:Eu,...t.option.icons};for(const r in n)j(this,r,{get:()=>Ri(r,n[r])})}}class ef extends at{constructor(t){super(t),this.name="info",ue||this.init()}init(){const{proxy:t,constructor:n,template:{$infoPanel:r,$infoClose:o,$video:a}}=this.art;t(o,"click",()=>{this.show=!1});let i=null;const s=hn("[data-video]",r)||[];this.art.on("destroy",()=>clearTimeout(i));function l(){for(let u=0;u<s.length;u++){const f=s[u],p=a[f.dataset.video],h=typeof p=="number"?p.toFixed(2):p;f.textContent!==h&&(f.textContent=h)}i=setTimeout(l,n.INFO_LOOP_TIME)}l()}}class tf extends at{constructor(t){super(t);const{option:n,template:{$layer:r}}=t;this.name="layer",this.$parent=r;for(let o=0;o<n.layers.length;o++)this.add(n.layers[o])}}class nf extends at{constructor(t){super(t),this.name="loading",U(t.template.$loading,t.icons.loading)}}class rf extends at{constructor(t){super(t),this.name="mask";const{template:n,icons:r,events:o}=t,a=U(n.$state,r.state),i=U(n.$state,r.error);L(i,"display","none"),t.on("destroy",()=>{L(a,"display","none"),L(i,"display",null)}),o.proxy(n.$state,"click",()=>t.play())}}class of{constructor(t){this.art=t,this.timer=null,t.on("destroy",()=>this.destroy())}destroy(){this.timer&&(clearTimeout(this.timer),this.timer=null)}set show(t){const{constructor:n,template:{$player:r,$noticeInner:o}}=this.art;t?(o.textContent=t instanceof Error?t.message.trim():t,K(r,"art-notice-show"),clearTimeout(this.timer),this.timer=setTimeout(()=>{o.textContent="",ye(r,"art-notice-show")},n.NOTICE_TIME)):ye(r,"art-notice-show")}get show(){const{template:{$player:t}}=this.art;return t.classList.contains("art-notice-show")}}function af(e){const{i18n:t,notice:n,proxy:r,template:{$video:o}}=e;let a=!0;window.WebKitPlaybackTargetAvailabilityEvent&&o.webkitShowPlaybackTargetPicker?r(o,"webkitplaybacktargetavailabilitychanged",i=>{switch(i.availability){case"available":a=!0;break;case"not-available":a=!1;break}}):a=!1,j(e,"airplay",{value(){a?(o.webkitShowPlaybackTargetPicker(),e.emit("airplay")):n.show=t.get("AirPlay Not Available")}})}function sf(e){const{i18n:t,notice:n,template:{$video:r,$player:o}}=e;j(e,"aspectRatio",{get(){return o.dataset.aspectRatio||"default"},set(a){if(a||(a="default"),a==="default")L(r,"width",null),L(r,"height",null),L(r,"margin",null),delete o.dataset.aspectRatio;else{const i=a.split(":").map(Number),{clientWidth:s,clientHeight:l}=o,u=s/l,f=i[0]/i[1];u>f?(L(r,"width",`${f*l}px`),L(r,"height","100%"),L(r,"margin","0 auto")):(L(r,"width","100%"),L(r,"height",`${s/f}px`),L(r,"margin","auto 0")),o.dataset.aspectRatio=a}n.show=`${t.get("Aspect Ratio")}: ${a==="default"?t.get("Default"):a}`,e.emit("aspectRatio",a)}})}function lf(e){const{template:{$video:t}}=e;j(e,"attr",{value(n,r){if(r===void 0)return t[n];t[n]=r}})}function cf(e){const{template:{$container:t,$video:n}}=e;j(e,"autoHeight",{value(){const{clientWidth:r}=t,{videoHeight:o,videoWidth:a}=n,i=o*(r/a);L(t,"height",`${i}px`),e.emit("autoHeight",i)}})}function df(e){const{$container:t,$player:n,$video:r}=e.template;j(e,"autoSize",{value(){const{videoWidth:o,videoHeight:a}=r,{width:i,height:s}=_e(t),l=o/a;if(i/s>l){const f=s*l/i*100;L(n,"width",`${f}%`),L(n,"height","100%")}else{const f=i/l/s*100;L(n,"width","100%"),L(n,"height",`${f}%`)}e.emit("autoSize",{width:e.width,height:e.height})}})}function uf(e){const{$player:t}=e.template;j(e,"cssVar",{value(n,r){return r?t.style.setProperty(n,r):getComputedStyle(t).getPropertyValue(n)}})}function ff(e){const{$video:t}=e.template;j(e,"currentTime",{get:()=>t.currentTime||0,set:n=>{n=Number.parseFloat(n),!Number.isNaN(n)&&(t.currentTime=Ee(n,0,e.duration))}})}function pf(e){j(e,"duration",{get:()=>{const{duration:t}=e.template.$video;return t===1/0?0:t||0}})}function hf(e){const{i18n:t,notice:n,option:r,constructor:o,proxy:a,template:{$player:i,$video:s,$poster:l}}=e;let u=0;for(let f=0;f<Xt.events.length;f++)a(s,Xt.events[f],p=>{e.emit(`video:${p.type}`,p)});e.on("video:canplay",()=>{u=0,e.loading.show=!1}),e.once("video:canplay",()=>{e.loading.show=!1,e.controls.show=!0,e.mask.show=!0,e.isReady=!0,e.emit("ready")}),e.on("video:ended",()=>{r.loop?(e.seek=0,e.play(),e.controls.show=!1,e.mask.show=!1):(e.controls.show=!0,e.mask.show=!0)}),e.on("video:error",async f=>{u<o.RECONNECT_TIME_MAX?(await It(o.RECONNECT_SLEEP_TIME),u+=1,e.url=r.url,n.show=`${t.get("Reconnect")}: ${u}`,e.emit("error",f,u)):(e.mask.show=!0,e.loading.show=!1,e.controls.show=!0,K(i,"art-error"),await It(o.RECONNECT_SLEEP_TIME),n.show=t.get("Video Load Failed"))}),e.on("video:loadedmetadata",()=>{e.emit("resize"),ue&&(e.loading.show=!1,e.controls.show=!0,e.mask.show=!0)}),e.on("video:loadstart",()=>{e.loading.show=!0,e.mask.show=!1,e.controls.show=!0}),e.on("video:pause",()=>{e.controls.show=!0,e.mask.show=!0}),e.on("video:play",()=>{e.mask.show=!1,L(l,"display","none")}),e.on("video:playing",()=>{e.mask.show=!1}),e.on("video:progress",()=>{e.playing&&(e.loading.show=!1)}),e.on("video:seeked",()=>{e.loading.show=!1,e.mask.show=!0}),e.on("video:seeking",()=>{e.loading.show=!0,e.mask.show=!1}),e.on("video:timeupdate",()=>{e.mask.show=!1}),e.on("video:waiting",()=>{e.loading.show=!0,e.mask.show=!1})}function mf(e){const{template:{$player:t},i18n:n,notice:r}=e;j(e,"flip",{get(){return t.dataset.flip||"normal"},set(o){o||(o="normal"),o==="normal"?delete t.dataset.flip:t.dataset.flip=o,r.show=`${n.get("Video Flip")}: ${n.get(ar(o))}`,e.emit("flip",o)}})}const Ea=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],et=(()=>{if(typeof document>"u")return!1;const e=Ea[0],t={};for(const n of Ea)if(n[1]in document){for(const[o,a]of n.entries())t[e[o]]=a;return t}return!1})(),Ta={change:et.fullscreenchange,error:et.fullscreenerror},ge={request(e=document.documentElement,t){return new Promise((n,r)=>{const o=()=>{ge.off("change",o),n()};ge.on("change",o);const a=e[et.requestFullscreen](t);a instanceof Promise&&a.then(o).catch(r)})},exit(){return new Promise((e,t)=>{if(!ge.isFullscreen){e();return}const n=()=>{ge.off("change",n),e()};ge.on("change",n);const r=document[et.exitFullscreen]();r instanceof Promise&&r.then(n).catch(t)})},toggle(e,t){return ge.isFullscreen?ge.exit():ge.request(e,t)},onchange(e){ge.on("change",e)},onerror(e){ge.on("error",e)},on(e,t){const n=Ta[e];n&&document.addEventListener(n,t,!1)},off(e,t){const n=Ta[e];n&&document.removeEventListener(n,t,!1)},raw:et};Object.defineProperties(ge,{isFullscreen:{get:()=>!!document[et.fullscreenElement]},element:{enumerable:!0,get:()=>document[et.fullscreenElement]},isEnabled:{enumerable:!0,get:()=>!!document[et.fullscreenEnabled]}});function gf(e){const{i18n:t,notice:n,template:{$video:r,$player:o}}=e,a=s=>{ge.on("change",()=>{s.emit("fullscreen",ge.isFullscreen),ge.isFullscreen?(s.state="fullscreen",K(o,"art-fullscreen")):ye(o,"art-fullscreen"),s.emit("resize")}),ge.on("error",l=>{s.emit("fullscreenError",l)}),j(s,"fullscreen",{get(){return ge.isFullscreen},async set(l){l?await ge.request(o):await ge.exit()}})},i=s=>{s.on("document:webkitfullscreenchange",()=>{s.emit("fullscreen",s.fullscreen),s.emit("resize")}),j(s,"fullscreen",{get(){return document.fullscreenElement===r},set(l){l?(s.state="fullscreen",r.webkitEnterFullscreen()):r.webkitExitFullscreen()}})};e.once("video:loadedmetadata",()=>{ge.isEnabled?a(e):r.webkitSupportsFullscreen?i(e):j(e,"fullscreen",{get(){return!1},set(){n.show=t.get("Fullscreen Not Supported")}}),j(e,"fullscreen",Fi(e,"fullscreen"))})}function yf(e){const{constructor:t,template:{$container:n,$player:r}}=e;let o="";j(e,"fullscreenWeb",{get(){return ze(r,"art-fullscreen-web")},set(a){a?(o=r.style.cssText,t.FULLSCREEN_WEB_IN_BODY&&U(document.body,r),e.state="fullscreenWeb",L(r,"width","100%"),L(r,"height","100%"),K(r,"art-fullscreen-web"),e.emit("fullscreenWeb",!0)):(t.FULLSCREEN_WEB_IN_BODY&&U(n,r),o&&(r.style.cssText=o,o=""),ye(r,"art-fullscreen-web"),e.emit("fullscreenWeb",!1)),e.emit("resize")}})}function vf(e){const{$video:t}=e.template;j(e,"loaded",{get:()=>e.loadedTime/t.duration}),j(e,"loadedTime",{get:()=>t.buffered.length?t.buffered.end(t.buffered.length-1):0})}function bf(e){const{icons:t,proxy:n,storage:r,template:{$player:o,$video:a}}=e;let i=!1,s=0,l=0;function u(){const{$mini:w}=e.template;w&&(ye(o,"art-mini"),L(w,"display","none"),o.prepend(a),e.emit("mini",!1))}function f(w,m){e.playing?(L(w,"display","none"),L(m,"display","flex")):(L(w,"display","flex"),L(m,"display","none"))}function p(){const{$mini:w}=e.template;if(w)return U(w,a),L(w,"display","flex");{const m=me("div");K(m,"art-mini-popup"),U(document.body,m),e.template.$mini=m,U(m,a);const y=U(m,'<div class="art-mini-close"></div>');U(y,t.close),n(y,"click",u);const g=U(m,'<div class="art-mini-state"></div>'),A=U(g,t.play),R=U(g,t.pause);return n(A,"click",()=>e.play()),n(R,"click",()=>e.pause()),f(A,R),e.on("video:playing",()=>f(A,R)),e.on("video:pause",()=>f(A,R)),e.on("video:timeupdate",()=>f(A,R)),n(m,"mousedown",k=>{i=k.button===0,s=k.pageX,l=k.pageY}),e.on("document:mousemove",k=>{if(i){K(m,"art-mini-dragging");const b=k.pageX-s,$=k.pageY-l;L(m,"transform",`translate(${b}px, ${$}px)`)}}),e.on("document:mouseup",()=>{if(i){i=!1,ye(m,"art-mini-dragging");const k=_e(m);r.set("left",k.left),r.set("top",k.top),L(m,"left",`${k.left}px`),L(m,"top",`${k.top}px`),L(m,"transform",null)}}),m}}function h(){const{$mini:w}=e.template,m=_e(w),y=window.innerHeight-m.height-50,g=window.innerWidth-m.width-50;r.set("top",y),r.set("left",g),L(w,"top",`${y}px`),L(w,"left",`${g}px`)}j(e,"mini",{get(){return ze(o,"art-mini")},set(w){if(w){e.state="mini",K(o,"art-mini");const m=p(),y=r.get("top"),g=r.get("left");typeof y=="number"&&typeof g=="number"?(L(m,"top",`${y}px`),L(m,"left",`${g}px`),wo(m)||h()):h(),e.emit("mini",!0)}else u()}})}function wf(e){const{option:t,storage:n,template:{$video:r,$poster:o}}=e;for(const i in t.moreVideoAttr)e.attr(i,t.moreVideoAttr[i]);t.muted&&(e.muted=t.muted),t.volume&&(r.volume=Ee(t.volume,0,1));const a=n.get("volume");typeof a=="number"&&(r.volume=Ee(a,0,1)),t.poster&&L(o,"backgroundImage",`url(${t.poster})`),t.autoplay&&(r.autoplay=t.autoplay),t.playsInline&&(r.playsInline=!0,r["webkit-playsinline"]=!0),t.theme&&(t.cssVar["--art-theme"]=t.theme);for(const i in t.cssVar)e.cssVar(i,t.cssVar[i]);e.url=t.url}function xf(e){const{template:{$video:t},i18n:n,notice:r}=e;j(e,"pause",{value(){const o=t.pause();return r.show=n.get("Pause"),e.emit("pause"),o}})}function Sf(e){const{template:{$video:t},proxy:n,notice:r}=e;t.disablePictureInPicture=!1,j(e,"pip",{get(){return document.pictureInPictureElement},set(o){o?(e.state="pip",t.requestPictureInPicture().catch(a=>{throw r.show=a,a})):document.exitPictureInPicture().catch(a=>{throw r.show=a,a})}}),n(t,"enterpictureinpicture",()=>{e.emit("pip",!0)}),n(t,"leavepictureinpicture",()=>{e.emit("pip",!1)})}function kf(e){const{$video:t}=e.template;t.webkitSetPresentationMode("inline"),j(e,"pip",{get(){return t.webkitPresentationMode==="picture-in-picture"},set(n){n?(e.state="pip",t.webkitSetPresentationMode("picture-in-picture"),e.emit("pip",!0)):(t.webkitSetPresentationMode("inline"),e.emit("pip",!1))}})}function $f(e){const{i18n:t,notice:n,template:{$video:r}}=e;document.pictureInPictureEnabled?Sf(e):r.webkitSupportsPresentationMode?kf(e):j(e,"pip",{get(){return!1},set(){n.show=t.get("PIP Not Supported")}})}function Mf(e){const{template:{$video:t},i18n:n,notice:r}=e;j(e,"playbackRate",{get(){return t.playbackRate},set(o){if(o){if(o===t.playbackRate)return;t.playbackRate=o,r.show=`${n.get("Rate")}: ${o===1?n.get("Normal"):`${o}x`}`}else e.playbackRate=1}})}function Ef(e){j(e,"played",{get:()=>e.currentTime/e.duration})}function Tf(e){const{$video:t}=e.template;j(e,"playing",{get:()=>typeof t.playing=="boolean"?t.playing:t.currentTime>0&&!t.paused&&!t.ended&&t.readyState>2})}function Lf(e){const{i18n:t,notice:n,option:r,constructor:{instances:o},template:{$video:a}}=e;j(e,"play",{async value(){const i=await a.play();if(n.show=t.get("Play"),e.emit("play"),r.mutex)for(let s=0;s<o.length;s++){const l=o[s];l!==e&&l.pause()}return i}})}function Cf(e){const{template:{$poster:t}}=e;j(e,"poster",{get:()=>{try{return t.style.backgroundImage.match(/"(.*)"/)[1]}catch{return""}},set(n){L(t,"backgroundImage",`url(${n})`)}})}function If(e){j(e,"quality",{set(t){const{controls:n,notice:r,i18n:o}=e,a=t.find(i=>i.default)||t[0];n.update({name:"quality",position:"right",index:10,style:{marginRight:"10px"},html:a?.html||"",selector:t,async onSelect(i){return await e.switchQuality(i.url),r.show=`${o.get("Switch Video")}: ${i.html}`,i.html}})}})}function Pf(e){j(e,"rect",{get:()=>_e(e.template.$player)});const t=["bottom","height","left","right","top","width"];for(let n=0;n<t.length;n++){const r=t[n];j(e,r,{get:()=>e.rect[r]})}j(e,"x",{get:()=>e.left+window.pageXOffset}),j(e,"y",{get:()=>e.top+window.pageYOffset})}function Af(e){const{notice:t,template:{$video:n}}=e,r=me("canvas");j(e,"getDataURL",{value:()=>new Promise((o,a)=>{try{r.width=n.videoWidth,r.height=n.videoHeight,r.getContext("2d").drawImage(n,0,0),o(r.toDataURL("image/png"))}catch(i){t.show=i,a(i)}})}),j(e,"getBlobUrl",{value:()=>new Promise((o,a)=>{try{r.width=n.videoWidth,r.height=n.videoHeight,r.getContext("2d").drawImage(n,0,0),r.toBlob(i=>{o(URL.createObjectURL(i))})}catch(i){t.show=i,a(i)}})}),j(e,"screenshot",{value:async o=>{const a=await e.getDataURL(),i=o||`artplayer_${qe(n.currentTime)}`;return qi(a,`${i}.png`),e.emit("screenshot",a),a}})}function Rf(e){const{notice:t}=e;j(e,"seek",{set(n){e.currentTime=n,e.duration&&(t.show=`${qe(e.currentTime)} / ${qe(e.duration)}`),e.emit("seek",e.currentTime,n)}}),j(e,"forward",{set(n){e.seek=e.currentTime+n}}),j(e,"backward",{set(n){e.seek=e.currentTime-n}})}function Nf(e){const t=["mini","pip","fullscreen","fullscreenWeb"];j(e,"state",{get:()=>t.find(n=>e[n])||"standard",set(n){for(let r=0;r<t.length;r++){const o=t[r];o!==n&&e[o]&&(e[o]=!1)}}})}function Bf(e){const{notice:t,i18n:n,template:r}=e;j(e,"subtitleOffset",{get(){return r.$track?.offset||0},set(o){const{cues:a}=e.subtitle;if(!r.$track||a.length===0)return;const i=Ee(o,-10,10);r.$track.offset=i;for(let s=0;s<a.length;s++){const l=a[s];l.originalStartTime=l.originalStartTime??l.startTime,l.originalEndTime=l.originalEndTime??l.endTime,l.startTime=Ee(l.originalStartTime+i,0,e.duration),l.endTime=Ee(l.originalEndTime+i,0,e.duration)}e.subtitle.update(),t.show=`${n.get("Subtitle Offset")}: ${o}s`,e.emit("subtitleOffset",o)}})}function Df(e){function t(n,r){return new Promise((o,a)=>{if(n===e.url){o();return}const{playing:i,aspectRatio:s,playbackRate:l}=e;e.pause(),e.url=n,e.notice.show="";const u={};u.error=f=>{e.off("video:canplay",u.canplay),e.off("video:loadedmetadata",u.metadata),a(f)},u.metadata=()=>{e.currentTime=r},u.canplay=async()=>{e.off("video:error",u.error),e.playbackRate=l,e.aspectRatio=s,i&&await e.play(),e.notice.show="",o()},e.once("video:error",u.error),e.once("video:loadedmetadata",u.metadata),e.once("video:canplay",u.canplay)})}j(e,"switchQuality",{value:n=>t(n,e.currentTime)}),j(e,"switchUrl",{value:n=>t(n,0)}),j(e,"switch",{set:e.switchUrl})}function _f(e){j(e,"theme",{get(){return e.cssVar("--art-theme")},set(t){e.cssVar("--art-theme",t)}})}function qf(e){const{option:t,template:{$progress:n,$video:r}}=e;let o=null,a=!1,i=null;function s(){clearTimeout(o),o=null,a=!1,i=null}function l(u){const f=e.controls?.thumbnails;if(!f)return;const{number:p,column:h,width:w,height:m,scale:y}=t.thumbnails,g=w*y||i.naturalWidth/h,A=m*y||g/(r.videoWidth/r.videoHeight),R=n.clientWidth/p,k=Math.floor(u/R),b=Math.ceil(k/h)-1,$=k%h||h-1;L(f,"backgroundImage",`url(${i.src})`),L(f,"height",`${A}px`),L(f,"width",`${g}px`),L(f,"backgroundPosition",`-${$*g}px -${b*A}px`),u<=g/2?L(f,"left",0):u>n.clientWidth-g/2?L(f,"left",`${n.clientWidth-g}px`):L(f,"left",`${u-g/2}px`)}e.on("setBar",async(u,f,p)=>{const h=e.controls?.thumbnails,{url:w,scale:m}=t.thumbnails;if(!h||!w)return;if(u==="hover"||u==="played"&&p&&ue){if(!i&&!a&&(a=!0,i=await Di(w,m),a=!1),!i)return;const g=n.clientWidth*f;g>0&&g<n.clientWidth&&l(g)}}),j(e,"thumbnails",{get(){return e.option.thumbnails},set(u){u.url&&!e.option.isLive&&(e.option.thumbnails=u,s())}})}function Of(e){j(e,"toggle",{value(){return e.playing?e.pause():e.play()}})}function Ff(e){j(e,"type",{get(){return e.option.type},set(t){e.option.type=t}})}function zf(e){const{option:t,template:{$video:n}}=e;j(e,"url",{get(){return n.src},async set(r){if(r){const o=e.url,a=t.type||rn(r),i=t.customType[a];a&&i?(await It(),e.loading.show=!0,i.call(e,n,r,e)):(URL.revokeObjectURL(o),n.src=r),o!==e.url&&(e.option.url=r,e.isReady&&o&&e.once("video:canplay",()=>{e.emit("restart",r)}))}else await It(),e.loading.show=!0}})}function Hf(e){const{template:{$video:t},i18n:n,notice:r,storage:o}=e;j(e,"volume",{get:()=>t.volume||0,set:a=>{t.volume=Ee(a,0,1),r.show=`${n.get("Volume")}: ${Number.parseInt(t.volume*100,10)}`,t.volume!==0&&o.set("volume",t.volume)}}),j(e,"muted",{get:()=>t.muted,set:a=>{t.muted=a,e.emit("muted",a)}})}class Uf{constructor(t){zf(t),lf(t),Lf(t),xf(t),Of(t),Rf(t),Hf(t),ff(t),pf(t),Df(t),Mf(t),sf(t),Af(t),gf(t),yf(t),$f(t),vf(t),Ef(t),Tf(t),df(t),Pf(t),mf(t),bf(t),Cf(t),cf(t),uf(t),_f(t),Ff(t),Nf(t),Bf(t),af(t),If(t),qf(t),hf(t),wf(t)}}function Vf(e){const{notice:t,constructor:n,template:{$player:r,$video:o}}=e,a="art-auto-orientation",i="art-auto-orientation-fullscreen";let s=!1;function l(){const p=document.documentElement.clientWidth,h=document.documentElement.clientHeight;L(r,"width",`${h}px`),L(r,"height",`${p}px`),L(r,"transform-origin","0 0"),L(r,"transform",`rotate(90deg) translate(0, -${p}px)`),K(r,a),e.isRotate=!0,e.emit("resize")}function u(){L(r,"width",""),L(r,"height",""),L(r,"transform-origin",""),L(r,"transform",""),ye(r,a),e.isRotate=!1,e.emit("resize")}function f(){const{videoWidth:p,videoHeight:h}=o,w=document.documentElement.clientWidth,m=document.documentElement.clientHeight;return p>h&&w<m||p<h&&w>m}return e.on("fullscreenWeb",p=>{if(p){if(f()){const h=Number(n.AUTO_ORIENTATION_TIME??0);setTimeout(()=>{e.fullscreenWeb&&!ze(r,a)&&l()},h)}}else ze(r,a)&&u()}),e.on("fullscreen",async p=>{const h=!!screen?.orientation?.lock;if(p){if(h&&f())try{const m=screen.orientation.type.startsWith("portrait")?"landscape":"portrait";await screen.orientation.lock(m),s=!0,K(r,i)}catch(w){s=!1,t.show=w}}else if(ze(r,i)&&ye(r,i),h&&s){try{screen.orientation.unlock()}catch{}s=!1}}),{name:"autoOrientation",get state(){return ze(r,a)}}}function jf(e){const{i18n:t,icons:n,storage:r,constructor:o,proxy:a,template:{$poster:i}}=e,s=e.layers.add({name:"auto-playback",html:`
            <div class="art-auto-playback-close"></div>
            <div class="art-auto-playback-last"></div>
            <div class="art-auto-playback-jump"></div>
        `}),l=$e(".art-auto-playback-last",s),u=$e(".art-auto-playback-jump",s),f=$e(".art-auto-playback-close",s);U(f,n.close);let p=null;e.on("video:timeupdate",()=>{if(e.playing){const w=r.get("times")||{},m=Object.keys(w);m.length>o.AUTO_PLAYBACK_MAX&&delete w[m[0]],w[e.option.id||e.option.url]=e.currentTime,r.set("times",w)}});function h(){const m=(r.get("times")||{})[e.option.id||e.option.url];clearTimeout(p),L(s,"display","none"),m&&m>=o.AUTO_PLAYBACK_MIN&&(L(s,"display","flex"),l.textContent=`${t.get("Last Seen")} ${qe(m)}`,u.textContent=t.get("Jump Play"),a(f,"click",()=>{L(s,"display","none")}),a(u,"click",()=>{e.seek=m,e.play(),L(i,"display","none"),L(s,"display","none")}),e.once("video:timeupdate",()=>{p=setTimeout(()=>{L(s,"display","none")},o.AUTO_PLAYBACK_TIMEOUT)}))}return e.on("ready",h),e.on("restart",h),{name:"auto-playback",get times(){return r.get("times")||{}},clear(){return r.del("times")},delete(w){const m=r.get("times")||{};return delete m[w],r.set("times",m),m}}}function Wf(e){const{constructor:t,proxy:n,template:{$player:r,$video:o}}=e;let a=null,i=!1,s=1;const l=f=>{f.touches.length===1&&e.playing&&!e.isLock&&(a=setTimeout(()=>{i=!0,s=e.playbackRate,e.playbackRate=t.FAST_FORWARD_VALUE,K(r,"art-fast-forward")},t.FAST_FORWARD_TIME))},u=()=>{clearTimeout(a),i&&(i=!1,e.playbackRate=s,ye(r,"art-fast-forward"))};return n(o,"touchstart",l),e.on("document:touchmove",u),e.on("document:touchend",u),{name:"fastForward",get state(){return ze(r,"art-fast-forward")}}}function Yf(e){const{layers:t,icons:n,template:{$player:r}}=e;function o(){return ze(r,"art-lock")}function a(){K(r,"art-lock"),e.isLock=!0,e.emit("lock",!0)}function i(){ye(r,"art-lock"),e.isLock=!1,e.emit("lock",!1)}return t.add({name:"lock",mounted(s){const l=U(s,n.lock),u=U(s,n.unlock);L(l,"display","none"),e.on("lock",f=>{f?(L(l,"display","inline-flex"),L(u,"display","none")):(L(l,"display","none"),L(u,"display","inline-flex"))})},click(){o()?i():a()}}),{name:"lock",get state(){return o()},set state(s){s?a():i()}}}function Gf(e){return e.on("control",t=>{t?ye(e.template.$player,"art-mini-progress-bar"):K(e.template.$player,"art-mini-progress-bar")}),{name:"mini-progress-bar"}}class Xf{constructor(t){this.art=t,this.id=0;const{option:n}=t;n.miniProgressBar&&!n.isLive&&this.add(Gf),n.lock&&ue&&this.add(Yf),n.autoPlayback&&!n.isLive&&this.add(jf),n.autoOrientation&&ue&&this.add(Vf),n.fastForward&&ue&&!n.isLive&&this.add(Wf);for(let r=0;r<n.plugins.length;r++)this.add(n.plugins[r])}add(t){this.id+=1;const n=t.call(this.art,this.art);return n instanceof Promise?n.then(r=>this.next(t,r)):this.next(t,n)}next(t,n){const r=n&&n.name||t.name||`plugin${this.id}`;return Le(!Kt(this,r),`Cannot add a plugin that already has the same name: ${r}`),j(this,r,{value:n}),this}}function Kf(e){const{i18n:t,icons:n,constructor:{SETTING_ITEM_WIDTH:r,ASPECT_RATIO:o}}=e;function a(s){return s==="default"?t.get("Default"):s}function i(){const s=e.setting.find(`aspect-ratio-${e.aspectRatio}`);e.setting.check(s)}return{width:r,name:"aspect-ratio",html:t.get("Aspect Ratio"),icon:n.aspectRatio,tooltip:a(e.aspectRatio),selector:o.map(s=>({value:s,name:`aspect-ratio-${s}`,default:s===e.aspectRatio,html:a(s)})),onSelect(s){return e.aspectRatio=s.value,s.html},mounted:()=>{i(),e.on("aspectRatio",()=>i())}}}function Jf(e){const{i18n:t,icons:n,constructor:{SETTING_ITEM_WIDTH:r,FLIP:o}}=e;function a(s){return t.get(ar(s))}function i(){const s=e.setting.find(`flip-${e.flip}`);e.setting.check(s)}return{width:r,name:"flip",html:t.get("Video Flip"),tooltip:a(e.flip),icon:n.flip,selector:o.map(s=>({value:s,name:`flip-${s}`,default:s===e.flip,html:a(s)})),onSelect(s){return e.flip=s.value,s.html},mounted:()=>{i(),e.on("flip",()=>i())}}}function Qf(e){const{i18n:t,icons:n,constructor:{SETTING_ITEM_WIDTH:r,PLAYBACK_RATE:o}}=e;function a(s){return s===1?t.get("Normal"):s.toFixed(1)}function i(){const s=e.setting.find(`playback-rate-${e.playbackRate}`);e.setting.check(s)}return{width:r,name:"playback-rate",html:t.get("Play Speed"),tooltip:a(e.playbackRate),icon:n.playbackRate,selector:o.map(s=>({value:s,name:`playback-rate-${s}`,default:s===e.playbackRate,html:a(s)})),onSelect(s){return e.playbackRate=s.value,s.html},mounted:()=>{i(),e.on("video:ratechange",()=>i())}}}function Zf(e){const{i18n:t,icons:n,constructor:r}=e;return{width:r.SETTING_ITEM_WIDTH,name:"subtitle-offset",html:t.get("Subtitle Offset"),icon:n.subtitle,tooltip:"0s",range:[0,-10,10,.1],onChange(o){return e.subtitleOffset=o.range[0],`${o.range[0]}s`},mounted:(o,a)=>{e.on("subtitleOffset",i=>{a.$range.value=i,a.tooltip=`${i}s`})}}}class ep extends at{constructor(t){super(t);const{option:n,controls:r,template:{$setting:o}}=t;this.name="setting",this.$parent=o,this.id=0,this.active=null,this.cache=new Map,this.option=[...this.builtin,...n.settings],n.setting&&(this.format(),this.render(),t.on("blur",()=>{this.show&&(this.show=!1,this.render())}),t.on("focus",a=>{const i=yt(a,r.setting),s=yt(a,this.$parent);this.show&&!i&&!s&&(this.show=!1,this.render())}),t.on("resize",()=>this.resize()))}get builtin(){const t=[],{option:n}=this.art;return n.playbackRate&&t.push(Qf(this.art)),n.aspectRatio&&t.push(Kf(this.art)),n.flip&&t.push(Jf(this.art)),n.subtitleOffset&&t.push(Zf(this.art)),t}traverse(t,n=this.option){for(let r=0;r<n.length;r++){const o=n[r];t(o),o.selector?.length&&this.traverse(t,o.selector)}}check(t){t&&(t.$parent.tooltip=t.html,this.traverse(n=>{n.default=n===t,n.default&&n.$item&&De(n.$item,"art-current")},t.$option),this.render(t.$parents))}format(t=this.option,n,r,o=[]){for(let a=0;a<t.length;a++){const i=t[a];if(i?.name?(Le(!o.includes(i.name),`The [${i.name}] already exists in [setting]`),o.push(i.name)):i.name=`setting-${this.id++}`,!i.$formatted){j(i,"$parent",{get:()=>n}),j(i,"$parents",{get:()=>r}),j(i,"$option",{get:()=>t});const s=[];j(i,"$events",{get:()=>s}),j(i,"$formatted",{get:()=>!0})}this.format(i.selector||[],i,t,o)}this.option=t}find(t=""){let n=null;return this.traverse(r=>{r.name===t&&(n=r)}),n}resize(){const{controls:t,constructor:{SETTING_WIDTH:n,SETTING_ITEM_HEIGHT:r},template:{$player:o,$setting:a}}=this.art;if(t.setting&&this.show){const i=this.active[0]?.$parent?.width||n,{left:s,width:l}=_e(t.setting),{left:u,width:f}=_e(o),p=s-u+l/2-i/2,h=this.active===this.option?this.active.length*r:(this.active.length+1)*r;if(L(a,"height",`${h}px`),L(a,"width",`${i}px`),this.art.isRotate||ue)return;p+i>f?(L(a,"left",null),L(a,"right",null)):(L(a,"left",`${p}px`),L(a,"right","auto"))}}inactivate(t){for(let n=0;n<t.$events.length;n++)this.art.events.remove(t.$events[n]);t.$events.length=0}remove(t){const n=this.find(t);Le(n,`Can't find [${t}] in the [setting]`);const r=n.$option.indexOf(n);n.$option.splice(r,1),this.inactivate(n),n.$item&&rr(n.$item),this.render()}update(t){const n=this.find(t.name);return n?(this.inactivate(n),Object.assign(n,t),this.format(),this.createItem(n,!0),this.render(),n):this.add(t)}add(t,n=this.option){return n.push(t),this.format(),this.createItem(t),this.render(),t}createHeader(t){if(!this.cache.has(t.$option))return;const n=this.cache.get(t.$option),{proxy:r,icons:{arrowLeft:o},constructor:{SETTING_ITEM_HEIGHT:a}}=this.art,i=me("div");L(i,"height",`${a}px`),K(i,"art-setting-item"),K(i,"art-setting-item-back");const s=U(i,'<div class="art-setting-item-left"></div>'),l=me("div");K(l,"art-setting-item-left-icon"),U(l,o),U(s,l),U(s,t.$parent.html);const u=r(i,"click",()=>this.render(t.$parents));t.$parent.$events.push(u),U(n,i)}createItem(t,n=!1){if(!this.cache.has(t.$option))return;const r=this.cache.get(t.$option),o=t.$item;let a="selector";Kt(t,"switch")&&(a="switch"),Kt(t,"range")&&(a="range"),Kt(t,"onClick")&&(a="button");const{icons:i,proxy:s,constructor:l}=this.art,u=me("div");K(u,"art-setting-item"),L(u,"height",`${l.SETTING_ITEM_HEIGHT}px`),u.dataset.name=t.name||"",u.dataset.value=t.value||"";const f=U(u,'<div class="art-setting-item-left"></div>'),p=U(u,'<div class="art-setting-item-right"></div>'),h=me("div");switch(K(h,"art-setting-item-left-icon"),a){case"button":case"switch":case"range":U(h,t.icon||i.config);break;case"selector":t.selector?.length?U(h,t.icon||i.config):U(h,i.check);break}U(f,h),j(t,"$icon",{configurable:!0,get:()=>h}),j(t,"icon",{configurable:!0,get(){return h.innerHTML},set(y){h.innerHTML="",U(h,y)}});const w=me("div");K(w,"art-setting-item-left-text"),U(w,t.html||""),U(f,w),j(t,"$html",{configurable:!0,get:()=>w}),j(t,"html",{configurable:!0,get(){return w.innerHTML},set(y){w.innerHTML="",U(w,y)}});const m=me("div");switch(K(m,"art-setting-item-right-tooltip"),U(m,t.tooltip||""),U(p,m),j(t,"$tooltip",{configurable:!0,get:()=>m}),j(t,"tooltip",{configurable:!0,get(){return m.innerHTML},set(y){m.innerHTML="",U(m,y)}}),a){case"switch":{const y=me("div");K(y,"art-setting-item-right-icon");const g=U(y,i.switchOn),A=U(y,i.switchOff);L(t.switch?A:g,"display","none"),U(p,y),j(t,"$switch",{configurable:!0,get:()=>y});let R=t.switch;j(t,"switch",{configurable:!0,get:()=>R,set(k){R=k,k?(L(A,"display","none"),L(g,"display",null)):(L(A,"display",null),L(g,"display","none"))}});break}case"range":{const y=me("div");K(y,"art-setting-item-right-icon");const g=U(y,'<input type="range">');g.value=t.range[0],g.min=t.range[1],g.max=t.range[2],g.step=t.range[3],K(g,"art-setting-range"),U(p,y),j(t,"$range",{configurable:!0,get:()=>g});let A=[...t.range];j(t,"range",{configurable:!0,get:()=>A,set(R){A=[...R],g.value=R[0],g.min=R[1],g.max=R[2],g.step=R[3]}})}break;case"selector":if(t.selector?.length){const y=me("div");K(y,"art-setting-item-right-icon"),U(y,i.arrowRight),U(p,y)}break}switch(a){case"switch":{if(t.onSwitch){const y=s(u,"click",async g=>{t.switch=await t.onSwitch.call(this.art,t,u,g)});t.$events.push(y)}break}case"range":{if(t.$range){if(t.onRange){const y=s(t.$range,"change",async g=>{t.range[0]=t.$range.valueAsNumber,t.tooltip=await t.onRange.call(this.art,t,u,g)});t.$events.push(y)}if(t.onChange){const y=s(t.$range,"input",async g=>{t.range[0]=t.$range.valueAsNumber,t.tooltip=await t.onChange.call(this.art,t,u,g)});t.$events.push(y)}}break}case"selector":{const y=s(u,"click",async g=>{t.selector?.length?this.render(t.selector):(this.check(t),t.$parent.onSelect&&(t.$parent.tooltip=await t.$parent.onSelect.call(this.art,t,u,g)))});t.$events.push(y),t.default&&K(u,"art-current")}break;case"button":if(t.onClick){const y=s(u,"click",async g=>{t.tooltip=await t.onClick.call(this.art,t,u,g)});t.$events.push(y)}break}j(t,"$item",{configurable:!0,get:()=>u}),n?xo(u,o):U(r,u),t.mounted&&setTimeout(()=>t.mounted.call(this.art,t.$item,t),0)}render(t=this.option){if(this.active=t,this.cache.has(t)){const n=this.cache.get(t);De(n,"art-current")}else{const n=me("div");this.cache.set(t,n),K(n,"art-setting-panel"),U(this.$parent,n),De(n,"art-current"),t[0]?.$parent&&this.createHeader(t[0]);for(let r=0;r<t.length;r++)this.createItem(t[r])}this.resize()}}class tp{constructor(){this.name="artplayer_settings",this.settings={}}get(t){try{const n=JSON.parse(window.localStorage.getItem(this.name))||{};return t?n[t]:n}catch{return t?this.settings[t]:this.settings}}set(t,n){try{const r=Object.assign({},this.get(),{[t]:n});window.localStorage.setItem(this.name,JSON.stringify(r))}catch{this.settings[t]=n}}del(t){try{const n=this.get();delete n[t],window.localStorage.setItem(this.name,JSON.stringify(n))}catch{delete this.settings[t]}}clear(){try{window.localStorage.removeItem(this.name)}catch{this.settings={}}}}const Gi=`.art-video-player {
  --art-theme: #f00;
  --art-font-color: #fff;
  --art-background-color: #000;
  --art-text-shadow-color: rgba(0, 0, 0, 0.5);
  --art-transition-duration: 0.2s;
  --art-padding: 10px;
  --art-border-radius: 3px;
  --art-progress-height: 6px;
  --art-progress-color: rgba(255, 255, 255, 0.25);
  --art-progress-top-gap: 10px;
  --art-hover-color: rgba(255, 255, 255, 0.25);
  --art-loaded-color: rgba(255, 255, 255, 0.25);
  --art-state-size: 80px;
  --art-state-opacity: 0.8;
  --art-bottom-height: 100px;
  --art-bottom-offset: 20px;
  --art-bottom-gap: 5px;
  --art-highlight-width: 8px;
  --art-highlight-color: rgba(255, 255, 255, 0.5);
  --art-control-height: 46px;
  --art-control-opacity: 0.75;
  --art-control-icon-size: 36px;
  --art-control-icon-scale: 1.1;
  --art-volume-height: 120px;
  --art-volume-handle-size: 14px;
  --art-lock-size: 36px;
  --art-indicator-scale: 0;
  --art-indicator-size: 16px;
  --art-fullscreen-web-index: 9999;
  --art-settings-icon-size: 24px;
  --art-settings-max-height: 300px;
  --art-selector-max-height: 300px;
  --art-contextmenus-min-width: 250px;
  --art-subtitle-font-size: 20px;
  --art-subtitle-gap: 5px;
  --art-subtitle-bottom: 15px;
  --art-subtitle-border: #000;
  --art-widget-background: rgba(0, 0, 0, 0.85);
  --art-tip-background: rgba(0, 0, 0, 0.7);
  --art-scrollbar-size: 4px;
  --art-scrollbar-background: rgba(255, 255, 255, 0.25);
  --art-scrollbar-background-hover: rgba(255, 255, 255, 0.5);
  --art-mini-progress-height: 2px;
}
.art-bg-cover {
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
}
.art-bottom-gradient {
  background-image: linear-gradient(to top, #000, rgba(0, 0, 0, 0.4), transparent);
  background-repeat: repeat-x;
  background-position: center bottom;
}
.art-backdrop-filter {
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  background-color: rgba(0, 0, 0, 0.75) !important;
}
.art-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.art-video-player {
  position: relative;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  outline: 0;
  zoom: 1;
  padding: 0;
  text-align: left;
  direction: ltr;
  font-size: 14px;
  line-height: 1.3;
  user-select: none;
  box-sizing: border-box;
  color: var(--art-font-color);
  background-color: var(--art-background-color);
  text-shadow: 0 0 2px var(--art-text-shadow-color);
  font-family: PingFang SC, Helvetica Neue, Microsoft YaHei, Roboto, Arial, sans-serif;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -ms-touch-action: manipulation;
  touch-action: manipulation;
  -ms-high-contrast-adjust: none;
}
.art-video-player *,
.art-video-player *::before,
.art-video-player *::after {
  box-sizing: border-box;
}
.art-video-player ::-webkit-scrollbar {
  width: var(--art-scrollbar-size);
  height: var(--art-scrollbar-size);
}
.art-video-player ::-webkit-scrollbar-thumb {
  background-color: var(--art-scrollbar-background);
}
.art-video-player ::-webkit-scrollbar-thumb:hover {
  background-color: var(--art-scrollbar-background-hover);
}
.art-video-player img {
  max-width: 100%;
  vertical-align: top;
}
.art-video-player svg {
  fill: var(--art-font-color);
}
.art-video-player a {
  color: var(--art-font-color);
  text-decoration: none;
}
.art-icon {
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.art-video-player.art-backdrop .art-contextmenus,
.art-video-player.art-backdrop .art-info,
.art-video-player.art-backdrop .art-settings,
.art-video-player.art-backdrop .art-layer-auto-playback,
.art-video-player.art-backdrop .art-selector-list,
.art-video-player.art-backdrop .art-volume-inner {
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  background-color: rgba(0, 0, 0, 0.75) !important;
}
.art-video {
  position: absolute;
  inset: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
}
.art-poster {
  position: absolute;
  inset: 0;
  z-index: 11;
  width: 100%;
  height: 100%;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  pointer-events: none;
}
.art-video-player .art-subtitle {
  display: none;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: absolute;
  z-index: 20;
  width: 100%;
  padding: 0 5%;
  text-align: center;
  pointer-events: none;
  gap: var(--art-subtitle-gap);
  bottom: var(--art-subtitle-bottom);
  font-size: var(--art-subtitle-font-size);
  transition: bottom var(--art-transition-duration) ease;
  text-shadow: var(--art-subtitle-border) 1px 0 1px, var(--art-subtitle-border) 0 1px 1px, var(--art-subtitle-border) -1px 0 1px, var(--art-subtitle-border) 0 -1px 1px, var(--art-subtitle-border) 1px 1px 1px, var(--art-subtitle-border) -1px -1px 1px, var(--art-subtitle-border) 1px -1px 1px, var(--art-subtitle-border) -1px 1px 1px;
}
.art-video-player.art-subtitle-show .art-subtitle {
  display: flex;
}
.art-video-player.art-control-show .art-subtitle {
  bottom: calc(var(--art-control-height) + var(--art-subtitle-bottom));
}
.art-danmuku {
  position: absolute;
  inset: 0;
  z-index: 30;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}
.art-video-player .art-layers {
  position: absolute;
  inset: 0;
  z-index: 40;
  width: 100%;
  height: 100%;
  display: none;
  pointer-events: none;
}
.art-video-player .art-layers .art-layer {
  pointer-events: auto;
}
.art-video-player.art-layer-show .art-layers {
  display: flex;
}
.art-video-player .art-mask {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 0;
  z-index: 50;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.art-video-player .art-mask .art-state {
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transform: scale(2);
  width: var(--art-state-size);
  height: var(--art-state-size);
  transition: all var(--art-transition-duration) ease;
}
.art-video-player.art-mask-show .art-state {
  pointer-events: auto;
  opacity: var(--art-state-opacity);
  transform: scale(1);
}
.art-video-player.art-loading-show .art-state {
  display: none;
}
.art-video-player .art-loading {
  display: none;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 0;
  z-index: 70;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.art-video-player.art-loading-show .art-loading {
  display: flex;
}
.art-video-player.art-loading-show .art-mask {
  display: none;
}
.art-video-player .art-bottom {
  position: absolute;
  inset: 0;
  z-index: 60;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  padding: 0 var(--art-padding);
  transition: all var(--art-transition-duration) ease;
  background-size: 100% var(--art-bottom-height);
  background-image: linear-gradient(to top, #000, rgba(0, 0, 0, 0.4), transparent);
  background-repeat: repeat-x;
  background-position: center bottom;
}
.art-video-player .art-bottom .art-controls,
.art-video-player .art-bottom .art-progress {
  transform: translateY(var(--art-bottom-offset));
  transition: transform var(--art-transition-duration) ease;
}
.art-video-player.art-control-show .art-bottom,
.art-video-player.art-hover .art-bottom {
  opacity: 1;
}
.art-video-player.art-control-show .art-bottom .art-controls,
.art-video-player.art-hover .art-bottom .art-controls,
.art-video-player.art-control-show .art-bottom .art-progress,
.art-video-player.art-hover .art-bottom .art-progress {
  transform: translateY(0);
}
.art-bottom .art-progress {
  position: relative;
  z-index: 0;
  cursor: pointer;
  pointer-events: auto;
  padding-top: var(--art-progress-top-gap);
  padding-bottom: var(--art-bottom-gap);
}
.art-bottom .art-progress .art-control-progress {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--art-progress-height);
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner {
  display: flex;
  align-items: center;
  position: relative;
  height: 50%;
  width: 100%;
  transition: height var(--art-transition-duration) ease;
  background-color: var(--art-progress-color);
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-hover {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  width: 0%;
  background-color: var(--art-hover-color);
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-loaded {
  position: absolute;
  inset: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  width: 0%;
  background-color: var(--art-loaded-color);
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-played {
  position: absolute;
  inset: 0;
  z-index: 20;
  width: 100%;
  height: 100%;
  width: 0%;
  background-color: var(--art-theme);
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-highlight {
  position: absolute;
  inset: 0;
  z-index: 30;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-highlight span {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  right: auto;
  pointer-events: auto;
  width: var(--art-highlight-width) !important;
  transform: translateX(calc(var(--art-highlight-width) / -2));
  background-color: var(--art-highlight-color);
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 40;
  left: 0;
  border-radius: 50%;
  width: var(--art-indicator-size);
  height: var(--art-indicator-size);
  transform: scale(var(--art-indicator-scale));
  margin-left: calc(var(--art-indicator-size) / -2);
  transition: transform var(--art-transition-duration) ease;
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-indicator .art-icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-indicator:hover {
  transform: scale(1.2) !important;
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-indicator:active {
  transform: scale(1) !important;
}
.art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-tip {
  transform-origin: bottom center;
  transform: scale(0.5);
  opacity: 0;
  position: absolute;
  z-index: 50;
  top: -25px;
  left: 0;
  padding: 3px 5px;
  line-height: 1;
  font-size: 12px;
  border-radius: var(--art-border-radius);
  white-space: nowrap;
  background-color: var(--art-tip-background);
  transition: transform var(--art-transition-duration) ease, opacity var(--art-transition-duration) ease;
}
.art-bottom .art-progress .art-control-thumbnails {
  transform-origin: bottom center;
  transform: scale(0.5);
  opacity: 0;
  position: absolute;
  bottom: calc(var(--art-bottom-gap) + 10px);
  left: 0;
  border-radius: var(--art-border-radius);
  pointer-events: none;
  background-color: var(--art-widget-background);
  transition: transform var(--art-transition-duration) ease, opacity var(--art-transition-duration) ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2);
}
.art-bottom .art-progress:hover .art-control-progress .art-control-progress-inner {
  height: 100%;
}
.art-bottom:hover .art-progress .art-control-progress .art-control-progress-inner .art-progress-indicator {
  transform: scale(1);
}
.art-progress-hover .art-bottom .art-progress .art-control-progress .art-control-progress-inner .art-progress-tip,
.art-progress-hover .art-bottom .art-progress .art-control-thumbnails {
  transform: scale(1);
  opacity: 1;
}
.art-video-player .art-controls {
  position: relative;
  z-index: 10;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--art-control-height);
}
.art-video-player .art-controls .art-controls-left,
.art-video-player .art-controls .art-controls-right {
  display: flex;
  height: 100%;
}
.art-video-player .art-controls .art-controls-center {
  display: none;
  justify-content: center;
  align-items: center;
  flex: 1;
  height: 100%;
  padding: 0 10px;
}
.art-video-player .art-controls .art-controls-right {
  justify-content: flex-end;
}
.art-video-player .art-controls .art-control {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  white-space: nowrap;
  opacity: var(--art-control-opacity);
  min-height: var(--art-control-height);
  min-width: var(--art-control-height);
  transition: opacity var(--art-transition-duration) ease;
}
.art-video-player .art-controls .art-control .art-icon {
  height: var(--art-control-icon-size);
  width: var(--art-control-icon-size);
  transform: scale(var(--art-control-icon-scale));
  transition: transform var(--art-transition-duration) ease;
}
.art-video-player .art-controls .art-control .art-icon:active {
  transform: scale(calc(var(--art-control-icon-scale) * 0.8));
}
.art-video-player .art-controls .art-control:hover {
  opacity: 1;
}
.art-control-volume {
  position: relative;
}
.art-control-volume .art-volume-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0;
  right: 0;
  padding: 0 5px;
  font-size: 12px;
  text-align: center;
  cursor: default;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  bottom: var(--art-control-height);
  width: var(--art-control-height);
  height: var(--art-volume-height);
  transition: all var(--art-transition-duration) ease;
}
.art-control-volume .art-volume-panel .art-volume-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  height: 100%;
  width: 100%;
  padding: 10px 0 12px;
  border-radius: var(--art-border-radius);
  background-color: var(--art-widget-background);
}
.art-control-volume .art-volume-panel .art-volume-inner .art-volume-slider {
  flex: 1;
  width: 100%;
  display: flex;
  cursor: pointer;
  position: relative;
  justify-content: center;
}
.art-control-volume .art-volume-panel .art-volume-inner .art-volume-slider .art-volume-handle {
  position: relative;
  display: flex;
  justify-content: center;
  width: 2px;
  border-radius: var(--art-border-radius);
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.25);
}
.art-control-volume .art-volume-panel .art-volume-inner .art-volume-slider .art-volume-handle .art-volume-loaded {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  background-color: var(--art-theme);
}
.art-control-volume .art-volume-panel .art-volume-inner .art-volume-slider .art-volume-indicator {
  position: absolute;
  width: var(--art-volume-handle-size);
  height: var(--art-volume-handle-size);
  margin-top: calc(var(--art-volume-handle-size) / -2);
  flex-shrink: 0;
  transform: scale(1);
  border-radius: 100%;
  background-color: var(--art-theme);
  transition: transform var(--art-transition-duration) ease;
}
.art-control-volume .art-volume-panel .art-volume-inner .art-volume-slider:active .art-volume-indicator {
  transform: scale(0.9);
}
.art-control-volume:hover .art-volume-panel {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.art-video-player .art-notice {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 80;
  width: 100%;
  height: 100%;
  height: auto;
  bottom: auto;
  padding: var(--art-padding);
  pointer-events: none;
}
.art-video-player .art-notice .art-notice-inner {
  display: inline-flex;
  padding: 5px;
  line-height: 1;
  border-radius: var(--art-border-radius);
  background-color: var(--art-tip-background);
}
.art-video-player.art-notice-show .art-notice {
  display: flex;
}
.art-video-player .art-contextmenus {
  display: none;
  flex-direction: column;
  position: absolute;
  z-index: 120;
  padding: 5px 0;
  border-radius: var(--art-border-radius);
  font-size: 12px;
  background-color: var(--art-widget-background);
  min-width: var(--art-contextmenus-min-width);
}
.art-video-player .art-contextmenus .art-contextmenu {
  cursor: pointer;
  display: flex;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.art-video-player .art-contextmenus .art-contextmenu span {
  padding: 0 8px;
}
.art-video-player .art-contextmenus .art-contextmenu span:hover,
.art-video-player .art-contextmenus .art-contextmenu span.art-current {
  color: var(--art-theme);
}
.art-video-player .art-contextmenus .art-contextmenu:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.art-video-player .art-contextmenus .art-contextmenu:last-child {
  border-bottom: none;
}
.art-video-player.art-contextmenu-show .art-contextmenus {
  display: flex;
}
.art-video-player .art-settings {
  display: none;
  flex-direction: column;
  position: absolute;
  z-index: 90;
  left: auto;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: var(--art-border-radius);
  max-height: var(--art-settings-max-height);
  right: var(--art-padding);
  bottom: var(--art-control-height);
  transition: all var(--art-transition-duration) ease;
  background-color: var(--art-widget-background);
}
.art-video-player .art-settings .art-setting-panel {
  display: none;
  flex-direction: column;
}
.art-video-player .art-settings .art-setting-panel.art-current {
  display: flex;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  cursor: pointer;
  overflow: hidden;
  transition: background-color var(--art-transition-duration) ease;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.art-video-player .art-settings .art-setting-panel .art-setting-item.art-current {
  color: var(--art-theme);
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-icon-check {
  visibility: hidden;
  height: 15px;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item.art-current .art-icon-check {
  visibility: visible;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-left {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  gap: 5px;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-left .art-setting-item-left-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--art-settings-icon-size);
  width: var(--art-settings-icon-size);
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-tooltip {
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.5);
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 32px;
  height: 24px;
}
.art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-range {
  height: 3px;
  width: 80px;
  outline: none;
  appearance: none;
  background-color: rgba(255, 255, 255, 0.2);
}
.art-video-player .art-settings .art-setting-panel .art-setting-item-back {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.art-video-player.art-setting-show .art-settings {
  display: flex;
}
.art-video-player .art-info {
  display: none;
  position: absolute;
  left: var(--art-padding);
  top: var(--art-padding);
  z-index: 100;
  padding: 10px;
  font-size: 12px;
  border-radius: var(--art-border-radius);
  background-color: var(--art-widget-background);
}
.art-video-player .art-info .art-info-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.art-video-player .art-info .art-info-panel .art-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.art-video-player .art-info .art-info-panel .art-info-item .art-info-title {
  width: 100px;
  text-align: right;
}
.art-video-player .art-info .art-info-panel .art-info-item .art-info-content {
  width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: all;
}
.art-video-player .art-info .art-info-close {
  position: absolute;
  top: 5px;
  right: 5px;
  cursor: pointer;
}
.art-video-player.art-info-show .art-info {
  display: flex;
}
.art-hide-cursor * {
  cursor: none !important;
}
.art-video-player[data-aspect-ratio] {
  overflow: hidden;
}
.art-video-player[data-aspect-ratio] .art-video {
  object-fit: fill;
  box-sizing: content-box;
}
.art-fullscreen {
  --art-progress-height: 8px;
  --art-indicator-size: 20px;
  --art-control-height: 60px;
  --art-control-icon-scale: 1.3;
}
.art-fullscreen-web {
  --art-progress-height: 8px;
  --art-indicator-size: 20px;
  --art-control-height: 60px;
  --art-control-icon-scale: 1.3;
  position: fixed;
  inset: 0;
  z-index: var(--art-fullscreen-web-index);
  width: 100%;
  height: 100%;
}
.art-mini-popup {
  position: fixed;
  z-index: 9999;
  width: 320px;
  height: 180px;
  background: #000;
  border-radius: var(--art-border-radius);
  cursor: move;
  user-select: none;
  overflow: hidden;
  transition: opacity 0.2s ease;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
.art-mini-popup svg {
  fill: #fff;
}
.art-mini-popup .art-video {
  pointer-events: none;
}
.art-mini-popup .art-mini-close {
  position: absolute;
  z-index: 20;
  right: 10px;
  top: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.art-mini-popup .art-mini-state {
  position: absolute;
  inset: 0;
  z-index: 30;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  background-color: rgba(0, 0, 0, 0.25);
}
.art-mini-popup .art-mini-state .art-icon {
  opacity: 0.75;
  cursor: pointer;
  transform: scale(3);
  pointer-events: auto;
  transition: transform 0.2s ease;
}
.art-mini-popup .art-mini-state .art-icon:active {
  transform: scale(2.5);
}
.art-mini-popup.art-mini-dragging {
  opacity: 0.9;
}
.art-mini-popup:hover .art-mini-close,
.art-mini-popup:hover .art-mini-state {
  opacity: 1;
}
.art-video-player[data-flip='horizontal'] .art-video {
  transform: scaleX(-1);
}
.art-video-player[data-flip='vertical'] .art-video {
  transform: scaleY(-1);
}
.art-video-player .art-layer-lock {
  display: none;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
  height: var(--art-lock-size);
  width: var(--art-lock-size);
  left: var(--art-padding);
  background-color: var(--art-tip-background);
}
.art-video-player .art-layer-auto-playback {
  display: none;
  gap: 10px;
  align-items: center;
  position: absolute;
  border-radius: var(--art-border-radius);
  padding: 10px;
  line-height: 1;
  left: var(--art-padding);
  bottom: calc(var(--art-control-height) + var(--art-bottom-gap) + 10px);
  background-color: var(--art-widget-background);
}
.art-video-player .art-layer-auto-playback .art-auto-playback-close {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.art-video-player .art-layer-auto-playback .art-auto-playback-close svg {
  width: 15px;
  height: 15px;
  fill: var(--art-theme);
}
.art-video-player .art-layer-auto-playback .art-auto-playback-jump {
  color: var(--art-theme);
  cursor: pointer;
}
.art-video-player.art-lock .art-subtitle {
  bottom: var(--art-subtitle-bottom) !important;
}
.art-video-player.art-mini-progress-bar .art-bottom,
.art-video-player.art-lock .art-bottom {
  opacity: 1;
  padding: 0;
  background-image: none;
}
.art-video-player.art-mini-progress-bar .art-bottom .art-controls,
.art-video-player.art-lock .art-bottom .art-controls,
.art-video-player.art-mini-progress-bar .art-bottom .art-progress,
.art-video-player.art-lock .art-bottom .art-progress {
  transform: translateY(calc(var(--art-control-height) + var(--art-bottom-gap) + var(--art-progress-height) / 4));
}
.art-video-player.art-mini-progress-bar .art-bottom .art-progress-indicator,
.art-video-player.art-lock .art-bottom .art-progress-indicator {
  display: none !important;
}
.art-video-player.art-control-show .art-layer-lock {
  display: flex;
}
.art-control-selector {
  position: relative;
  display: flex;
  justify-content: center;
}
.art-control-selector .art-selector-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: absolute;
  border-radius: var(--art-border-radius);
  overflow-y: auto;
  overflow-x: hidden;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  bottom: var(--art-control-height);
  max-height: var(--art-selector-max-height);
  background-color: var(--art-widget-background);
  transition: all var(--art-transition-duration) ease;
}
.art-control-selector .art-selector-list .art-selector-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  flex-shrink: 0;
  line-height: 1;
}
.art-control-selector .art-selector-list .art-selector-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.art-control-selector .art-selector-list .art-selector-item:hover,
.art-control-selector .art-selector-list .art-selector-item.art-current {
  color: var(--art-theme);
}
.art-control-selector:hover .art-selector-list {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.art-video-player {
  /*! Hint.css - v2.7.0 - 2021-10-01
    * https://kushagra.dev/lab/hint/
    * Copyright (c) 2021 Kushagra Gour */
  /*-------------------------------------*\\
        HINT.css - A CSS tooltip library
    \\*-------------------------------------*/
  /**
    * HINT.css is a tooltip library made in pure CSS.
    *
    * Source: https://github.com/chinchang/hint.css
    * Demo: http://kushagragour.in/lab/hint/
    *
    */
  /**
    * source: hint-core.scss
    *
    * Defines the basic styling for the tooltip.
    * Each tooltip is made of 2 parts:
    * 	1) body (:after)
    * 	2) arrow (:before)
    *
    * Classes added:
    * 	1) hint
    */
  /**
    * source: hint-position.scss
    *
    * Defines the positoning logic for the tooltips.
    *
    * Classes added:
    * 	1) hint--top
    * 	2) hint--bottom
    * 	3) hint--left
    * 	4) hint--right
    */
  /**
    * set default color for tooltip arrows
    */
  /**
    * top tooltip
    */
  /**
    * bottom tooltip
    */
  /**
    * right tooltip
    */
  /**
    * left tooltip
    */
  /**
    * top-left tooltip
    */
  /**
    * top-right tooltip
    */
  /**
    * bottom-left tooltip
    */
  /**
    * bottom-right tooltip
    */
  /**
    * source: hint-sizes.scss
    *
    * Defines width restricted tooltips that can span
    * across multiple lines.
    *
    * Classes added:
    * 	1) hint--small
    * 	2) hint--medium
    * 	3) hint--large
    *
    */
  /**
    * source: hint-theme.scss
    *
    * Defines basic theme for tooltips.
    *
    */
  /**
    * source: hint-color-types.scss
    *
    * Contains tooltips of various types based on color differences.
    *
    * Classes added:
    * 	1) hint--error
    * 	2) hint--warning
    * 	3) hint--info
    * 	4) hint--success
    *
    */
  /**
    * Error
    */
  /**
    * Warning
    */
  /**
    * Info
    */
  /**
    * Success
    */
  /**
    * source: hint-always.scss
    *
    * Defines a persisted tooltip which shows always.
    *
    * Classes added:
    * 	1) hint--always
    *
    */
  /**
    * source: hint-rounded.scss
    *
    * Defines rounded corner tooltips.
    *
    * Classes added:
    * 	1) hint--rounded
    *
    */
  /**
    * source: hint-effects.scss
    *
    * Defines various transition effects for the tooltips.
    *
    * Classes added:
    * 	1) hint--no-animate
    * 	2) hint--bounce
    *
    */
}
.art-video-player [class*='hint--'] {
  position: relative;
  display: inline-block;
  font-style: normal;
  /**
        * tooltip arrow
        */
  /**
        * tooltip body
        */
}
.art-video-player [class*='hint--']:before,
.art-video-player [class*='hint--']:after {
  position: absolute;
  -webkit-transform: translate3d(0, 0, 0);
  -moz-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  visibility: hidden;
  opacity: 0;
  z-index: 1000000;
  pointer-events: none;
  -webkit-transition: 0.3s ease;
  -moz-transition: 0.3s ease;
  transition: 0.3s ease;
  -webkit-transition-delay: 0ms;
  -moz-transition-delay: 0ms;
  transition-delay: 0ms;
}
.art-video-player [class*='hint--']:hover:before,
.art-video-player [class*='hint--']:hover:after {
  visibility: visible;
  opacity: 1;
}
.art-video-player [class*='hint--']:hover:before,
.art-video-player [class*='hint--']:hover:after {
  -webkit-transition-delay: 100ms;
  -moz-transition-delay: 100ms;
  transition-delay: 100ms;
}
.art-video-player [class*='hint--']:before {
  content: '';
  position: absolute;
  background: transparent;
  border: 6px solid transparent;
  z-index: 1000001;
}
.art-video-player [class*='hint--']:after {
  background: #000000;
  color: white;
  padding: 8px 10px;
  font-size: 12px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 12px;
  white-space: nowrap;
}
.art-video-player [class*='hint--'][aria-label]:after {
  content: attr(aria-label);
}
.art-video-player [class*='hint--'][data-hint]:after {
  content: attr(data-hint);
}
.art-video-player [aria-label='']:before,
.art-video-player [aria-label='']:after,
.art-video-player [data-hint='']:before,
.art-video-player [data-hint='']:after {
  display: none !important;
}
.art-video-player .hint--top-left:before {
  border-top-color: #000000;
}
.art-video-player .hint--top-right:before {
  border-top-color: #000000;
}
.art-video-player .hint--top:before {
  border-top-color: #000000;
}
.art-video-player .hint--bottom-left:before {
  border-bottom-color: #000000;
}
.art-video-player .hint--bottom-right:before {
  border-bottom-color: #000000;
}
.art-video-player .hint--bottom:before {
  border-bottom-color: #000000;
}
.art-video-player .hint--left:before {
  border-left-color: #000000;
}
.art-video-player .hint--right:before {
  border-right-color: #000000;
}
.art-video-player .hint--top:before {
  margin-bottom: -11px;
}
.art-video-player .hint--top:before,
.art-video-player .hint--top:after {
  bottom: 100%;
  left: 50%;
}
.art-video-player .hint--top:before {
  left: calc(50% - 6px);
}
.art-video-player .hint--top:after {
  -webkit-transform: translateX(-50%);
  -moz-transform: translateX(-50%);
  transform: translateX(-50%);
}
.art-video-player .hint--top:hover:before {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--top:hover:after {
  -webkit-transform: translateX(-50%) translateY(-8px);
  -moz-transform: translateX(-50%) translateY(-8px);
  transform: translateX(-50%) translateY(-8px);
}
.art-video-player .hint--bottom:before {
  margin-top: -11px;
}
.art-video-player .hint--bottom:before,
.art-video-player .hint--bottom:after {
  top: 100%;
  left: 50%;
}
.art-video-player .hint--bottom:before {
  left: calc(50% - 6px);
}
.art-video-player .hint--bottom:after {
  -webkit-transform: translateX(-50%);
  -moz-transform: translateX(-50%);
  transform: translateX(-50%);
}
.art-video-player .hint--bottom:hover:before {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--bottom:hover:after {
  -webkit-transform: translateX(-50%) translateY(8px);
  -moz-transform: translateX(-50%) translateY(8px);
  transform: translateX(-50%) translateY(8px);
}
.art-video-player .hint--right:before {
  margin-left: -11px;
  margin-bottom: -6px;
}
.art-video-player .hint--right:after {
  margin-bottom: -14px;
}
.art-video-player .hint--right:before,
.art-video-player .hint--right:after {
  left: 100%;
  bottom: 50%;
}
.art-video-player .hint--right:hover:before {
  -webkit-transform: translateX(8px);
  -moz-transform: translateX(8px);
  transform: translateX(8px);
}
.art-video-player .hint--right:hover:after {
  -webkit-transform: translateX(8px);
  -moz-transform: translateX(8px);
  transform: translateX(8px);
}
.art-video-player .hint--left:before {
  margin-right: -11px;
  margin-bottom: -6px;
}
.art-video-player .hint--left:after {
  margin-bottom: -14px;
}
.art-video-player .hint--left:before,
.art-video-player .hint--left:after {
  right: 100%;
  bottom: 50%;
}
.art-video-player .hint--left:hover:before {
  -webkit-transform: translateX(-8px);
  -moz-transform: translateX(-8px);
  transform: translateX(-8px);
}
.art-video-player .hint--left:hover:after {
  -webkit-transform: translateX(-8px);
  -moz-transform: translateX(-8px);
  transform: translateX(-8px);
}
.art-video-player .hint--top-left:before {
  margin-bottom: -11px;
}
.art-video-player .hint--top-left:before,
.art-video-player .hint--top-left:after {
  bottom: 100%;
  left: 50%;
}
.art-video-player .hint--top-left:before {
  left: calc(50% - 6px);
}
.art-video-player .hint--top-left:after {
  -webkit-transform: translateX(-100%);
  -moz-transform: translateX(-100%);
  transform: translateX(-100%);
}
.art-video-player .hint--top-left:after {
  margin-left: 12px;
}
.art-video-player .hint--top-left:hover:before {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--top-left:hover:after {
  -webkit-transform: translateX(-100%) translateY(-8px);
  -moz-transform: translateX(-100%) translateY(-8px);
  transform: translateX(-100%) translateY(-8px);
}
.art-video-player .hint--top-right:before {
  margin-bottom: -11px;
}
.art-video-player .hint--top-right:before,
.art-video-player .hint--top-right:after {
  bottom: 100%;
  left: 50%;
}
.art-video-player .hint--top-right:before {
  left: calc(50% - 6px);
}
.art-video-player .hint--top-right:after {
  -webkit-transform: translateX(0);
  -moz-transform: translateX(0);
  transform: translateX(0);
}
.art-video-player .hint--top-right:after {
  margin-left: -12px;
}
.art-video-player .hint--top-right:hover:before {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--top-right:hover:after {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--bottom-left:before {
  margin-top: -11px;
}
.art-video-player .hint--bottom-left:before,
.art-video-player .hint--bottom-left:after {
  top: 100%;
  left: 50%;
}
.art-video-player .hint--bottom-left:before {
  left: calc(50% - 6px);
}
.art-video-player .hint--bottom-left:after {
  -webkit-transform: translateX(-100%);
  -moz-transform: translateX(-100%);
  transform: translateX(-100%);
}
.art-video-player .hint--bottom-left:after {
  margin-left: 12px;
}
.art-video-player .hint--bottom-left:hover:before {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--bottom-left:hover:after {
  -webkit-transform: translateX(-100%) translateY(8px);
  -moz-transform: translateX(-100%) translateY(8px);
  transform: translateX(-100%) translateY(8px);
}
.art-video-player .hint--bottom-right:before {
  margin-top: -11px;
}
.art-video-player .hint--bottom-right:before,
.art-video-player .hint--bottom-right:after {
  top: 100%;
  left: 50%;
}
.art-video-player .hint--bottom-right:before {
  left: calc(50% - 6px);
}
.art-video-player .hint--bottom-right:after {
  -webkit-transform: translateX(0);
  -moz-transform: translateX(0);
  transform: translateX(0);
}
.art-video-player .hint--bottom-right:after {
  margin-left: -12px;
}
.art-video-player .hint--bottom-right:hover:before {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--bottom-right:hover:after {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--small:after,
.art-video-player .hint--medium:after,
.art-video-player .hint--large:after {
  white-space: normal;
  line-height: 1.4em;
  word-wrap: break-word;
}
.art-video-player .hint--small:after {
  width: 80px;
}
.art-video-player .hint--medium:after {
  width: 150px;
}
.art-video-player .hint--large:after {
  width: 300px;
}
.art-video-player [class*='hint--'] {
  /**
        * tooltip body
        */
}
.art-video-player [class*='hint--']:after {
  text-shadow: 0 -1px 0px black;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
}
.art-video-player .hint--error:after {
  background-color: #b34e4d;
  text-shadow: 0 -1px 0px #592726;
}
.art-video-player .hint--error.hint--top-left:before {
  border-top-color: #b34e4d;
}
.art-video-player .hint--error.hint--top-right:before {
  border-top-color: #b34e4d;
}
.art-video-player .hint--error.hint--top:before {
  border-top-color: #b34e4d;
}
.art-video-player .hint--error.hint--bottom-left:before {
  border-bottom-color: #b34e4d;
}
.art-video-player .hint--error.hint--bottom-right:before {
  border-bottom-color: #b34e4d;
}
.art-video-player .hint--error.hint--bottom:before {
  border-bottom-color: #b34e4d;
}
.art-video-player .hint--error.hint--left:before {
  border-left-color: #b34e4d;
}
.art-video-player .hint--error.hint--right:before {
  border-right-color: #b34e4d;
}
.art-video-player .hint--warning:after {
  background-color: #c09854;
  text-shadow: 0 -1px 0px #6c5328;
}
.art-video-player .hint--warning.hint--top-left:before {
  border-top-color: #c09854;
}
.art-video-player .hint--warning.hint--top-right:before {
  border-top-color: #c09854;
}
.art-video-player .hint--warning.hint--top:before {
  border-top-color: #c09854;
}
.art-video-player .hint--warning.hint--bottom-left:before {
  border-bottom-color: #c09854;
}
.art-video-player .hint--warning.hint--bottom-right:before {
  border-bottom-color: #c09854;
}
.art-video-player .hint--warning.hint--bottom:before {
  border-bottom-color: #c09854;
}
.art-video-player .hint--warning.hint--left:before {
  border-left-color: #c09854;
}
.art-video-player .hint--warning.hint--right:before {
  border-right-color: #c09854;
}
.art-video-player .hint--info:after {
  background-color: #3986ac;
  text-shadow: 0 -1px 0px #1a3c4d;
}
.art-video-player .hint--info.hint--top-left:before {
  border-top-color: #3986ac;
}
.art-video-player .hint--info.hint--top-right:before {
  border-top-color: #3986ac;
}
.art-video-player .hint--info.hint--top:before {
  border-top-color: #3986ac;
}
.art-video-player .hint--info.hint--bottom-left:before {
  border-bottom-color: #3986ac;
}
.art-video-player .hint--info.hint--bottom-right:before {
  border-bottom-color: #3986ac;
}
.art-video-player .hint--info.hint--bottom:before {
  border-bottom-color: #3986ac;
}
.art-video-player .hint--info.hint--left:before {
  border-left-color: #3986ac;
}
.art-video-player .hint--info.hint--right:before {
  border-right-color: #3986ac;
}
.art-video-player .hint--success:after {
  background-color: #458746;
  text-shadow: 0 -1px 0px #1a321a;
}
.art-video-player .hint--success.hint--top-left:before {
  border-top-color: #458746;
}
.art-video-player .hint--success.hint--top-right:before {
  border-top-color: #458746;
}
.art-video-player .hint--success.hint--top:before {
  border-top-color: #458746;
}
.art-video-player .hint--success.hint--bottom-left:before {
  border-bottom-color: #458746;
}
.art-video-player .hint--success.hint--bottom-right:before {
  border-bottom-color: #458746;
}
.art-video-player .hint--success.hint--bottom:before {
  border-bottom-color: #458746;
}
.art-video-player .hint--success.hint--left:before {
  border-left-color: #458746;
}
.art-video-player .hint--success.hint--right:before {
  border-right-color: #458746;
}
.art-video-player .hint--always:after,
.art-video-player .hint--always:before {
  opacity: 1;
  visibility: visible;
}
.art-video-player .hint--always.hint--top:before {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--always.hint--top:after {
  -webkit-transform: translateX(-50%) translateY(-8px);
  -moz-transform: translateX(-50%) translateY(-8px);
  transform: translateX(-50%) translateY(-8px);
}
.art-video-player .hint--always.hint--top-left:before {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--always.hint--top-left:after {
  -webkit-transform: translateX(-100%) translateY(-8px);
  -moz-transform: translateX(-100%) translateY(-8px);
  transform: translateX(-100%) translateY(-8px);
}
.art-video-player .hint--always.hint--top-right:before {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--always.hint--top-right:after {
  -webkit-transform: translateY(-8px);
  -moz-transform: translateY(-8px);
  transform: translateY(-8px);
}
.art-video-player .hint--always.hint--bottom:before {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--always.hint--bottom:after {
  -webkit-transform: translateX(-50%) translateY(8px);
  -moz-transform: translateX(-50%) translateY(8px);
  transform: translateX(-50%) translateY(8px);
}
.art-video-player .hint--always.hint--bottom-left:before {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--always.hint--bottom-left:after {
  -webkit-transform: translateX(-100%) translateY(8px);
  -moz-transform: translateX(-100%) translateY(8px);
  transform: translateX(-100%) translateY(8px);
}
.art-video-player .hint--always.hint--bottom-right:before {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--always.hint--bottom-right:after {
  -webkit-transform: translateY(8px);
  -moz-transform: translateY(8px);
  transform: translateY(8px);
}
.art-video-player .hint--always.hint--left:before {
  -webkit-transform: translateX(-8px);
  -moz-transform: translateX(-8px);
  transform: translateX(-8px);
}
.art-video-player .hint--always.hint--left:after {
  -webkit-transform: translateX(-8px);
  -moz-transform: translateX(-8px);
  transform: translateX(-8px);
}
.art-video-player .hint--always.hint--right:before {
  -webkit-transform: translateX(8px);
  -moz-transform: translateX(8px);
  transform: translateX(8px);
}
.art-video-player .hint--always.hint--right:after {
  -webkit-transform: translateX(8px);
  -moz-transform: translateX(8px);
  transform: translateX(8px);
}
.art-video-player .hint--rounded:after {
  border-radius: 4px;
}
.art-video-player .hint--no-animate:before,
.art-video-player .hint--no-animate:after {
  -webkit-transition-duration: 0ms;
  -moz-transition-duration: 0ms;
  transition-duration: 0ms;
}
.art-video-player .hint--bounce:before,
.art-video-player .hint--bounce:after {
  -webkit-transition: opacity 0.3s ease, visibility 0.3s ease, -webkit-transform 0.3s cubic-bezier(0.71, 1.7, 0.77, 1.24);
  -moz-transition: opacity 0.3s ease, visibility 0.3s ease, -moz-transform 0.3s cubic-bezier(0.71, 1.7, 0.77, 1.24);
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s cubic-bezier(0.71, 1.7, 0.77, 1.24);
}
.art-video-player .hint--no-shadow:before,
.art-video-player .hint--no-shadow:after {
  text-shadow: initial;
  box-shadow: initial;
}
.art-video-player .hint--no-arrow:before {
  display: none;
}
.art-video-player.art-mobile {
  --art-bottom-gap: 10px;
  --art-control-height: 38px;
  --art-control-icon-scale: 1;
  --art-state-size: 60px;
  --art-settings-max-height: 180px;
  --art-selector-max-height: 180px;
  --art-indicator-scale: 1;
  --art-control-opacity: 1;
}
.art-video-player.art-mobile .art-controls-left {
  margin-left: calc(var(--art-padding) / -1);
}
.art-video-player.art-mobile .art-controls-right {
  margin-right: calc(var(--art-padding) / -1);
}
`;class np extends at{constructor(t){super(t),this.name="subtitle",this.option=null,this.destroyEvent=()=>null,this.init(t.option.subtitle);let n=!1;t.on("video:timeupdate",()=>{if(!this.url)return;const r=this.art.template.$video.webkitDisplayingFullscreen;typeof r=="boolean"&&r!==n&&(n=r,this.createTrack(r?"subtitles":"metadata",this.url))})}get url(){return this.art.template.$track.src}set url(t){this.switch(t)}get textTrack(){return this.art.template.$video?.textTracks?.[0]}get activeCues(){return this.textTrack?Array.from(this.textTrack.activeCues):[]}get cues(){return this.textTrack?Array.from(this.textTrack.cues):[]}style(t,n){const{$subtitle:r}=this.art.template;return typeof t=="object"?or(r,t):L(r,t,n)}update(){const{option:{subtitle:t},template:{$subtitle:n}}=this.art;n.innerHTML="",this.activeCues.length&&(this.art.emit("subtitleBeforeUpdate",this.activeCues),n.innerHTML=this.activeCues.map((r,o)=>r.text.split(/\r?\n/).filter(a=>a.trim()).map(a=>`<div class="art-subtitle-line" data-group="${o}">
                                ${t.escape?Oi(a):a}
                            </div>`).join("")).join(""),this.art.emit("subtitleAfterUpdate",this.activeCues))}async switch(t,n={}){const{i18n:r,notice:o,option:a}=this.art,i={...a.subtitle,...n,url:t},s=await this.init(i);return n.name&&(o.show=`${r.get("Switch Subtitle")}: ${n.name}`),s}createTrack(t,n){const{template:r,proxy:o,option:a}=this.art,{$video:i,$track:s}=r,l=me("track");l.default=!0,l.kind=t,l.src=n,l.label=a.subtitle.name||"Artplayer",l.track.mode="hidden",l.onload=()=>{this.art.emit("subtitleLoad",this.cues,this.option)},this.art.events.remove(this.destroyEvent),s.onload=null,rr(s),U(i,l),r.$track=l,this.destroyEvent=o(this.textTrack,"cuechange",()=>this.update())}async init(t){const{notice:n,template:{$subtitle:r}}=this.art;if(!this.textTrack)return null;if(Gt(t,Xr.subtitle),!!t.url)return this.option=t,this.style(t.style),fetch(t.url).then(o=>o.arrayBuffer()).then(o=>{const i=new TextDecoder(t.encoding).decode(o);switch(t.type||rn(t.url)){case"srt":{const s=zi(i),l=t.onVttLoad(s);return On(l)}case"ass":{const s=Hi(i),l=t.onVttLoad(s);return On(l)}case"vtt":{const s=t.onVttLoad(i);return On(s)}default:return t.url}}).then(o=>(r.innerHTML="",this.url===o||(URL.revokeObjectURL(this.url),this.createTrack("metadata",o)),o)).catch(o=>{throw r.innerHTML="",n.show=o,o})}}class Kn{constructor(t){this.art=t;const{option:n,constructor:r}=t;n.container instanceof Element?this.$container=n.container:(this.$container=$e(n.container),Le(this.$container,`No container element found by ${n.container}`)),Le(Bi(),"The current browser does not support flex layout");const o=this.$container.tagName.toLowerCase();Le(o==="div",`Unsupported container element type, only support 'div' but got '${o}'`),Le(r.instances.every(a=>a.template.$container!==this.$container),"Cannot mount multiple instances on the same dom element"),this.query=this.query.bind(this),this.$container.dataset.artId=t.id,this.init()}static get html(){return`
          <div class="art-video-player art-subtitle-show art-layer-show art-control-show art-mask-show">
            <video class="art-video">
              <track default kind="metadata" src=""></track>
            </video>
            <div class="art-poster"></div>
            <div class="art-subtitle"></div>
            <div class="art-danmuku"></div>
            <div class="art-layers"></div>
            <div class="art-mask">
              <div class="art-state"></div>
            </div>
            <div class="art-bottom">
              <div class="art-progress"></div>
              <div class="art-controls">
                <div class="art-controls-left"></div>
                <div class="art-controls-center"></div>
                <div class="art-controls-right"></div>
              </div>
            </div>
            <div class="art-loading"></div>
            <div class="art-notice">
              <div class="art-notice-inner"></div>
            </div>
            <div class="art-settings"></div>
            <div class="art-info">
              <div class="art-info-panel">
                <div class="art-info-item">
                  <div class="art-info-title">Player version:</div>
                  <div class="art-info-content">${bo}</div>
                </div>
                <div class="art-info-item">
                  <div class="art-info-title">Video url:</div>
                  <div class="art-info-content" data-video="currentSrc"></div>
                </div>
                <div class="art-info-item">
                  <div class="art-info-title">Video volume:</div>
                  <div class="art-info-content" data-video="volume"></div>
                </div>
                <div class="art-info-item">
                  <div class="art-info-title">Video time:</div>
                  <div class="art-info-content" data-video="currentTime"></div>
                </div>
                <div class="art-info-item">
                  <div class="art-info-title">Video duration:</div>
                  <div class="art-info-content" data-video="duration"></div>
                </div>
                <div class="art-info-item">
                  <div class="art-info-title">Video resolution:</div>
                  <div class="art-info-content">
                    <span data-video="videoWidth"></span> x <span data-video="videoHeight"></span>
                  </div>
                </div>
              </div>
              <div class="art-info-close">[x]</div>
            </div>
            <div class="art-contextmenus"></div>
          </div>
        `}query(t){return $e(t,this.$container)}init(){const{option:t}=this.art;if(t.useSSR||(this.$container.innerHTML=Kn.html),this.$player=this.query(".art-video-player"),this.$video=this.query(".art-video"),this.$track=this.query("track"),this.$poster=this.query(".art-poster"),this.$subtitle=this.query(".art-subtitle"),this.$danmuku=this.query(".art-danmuku"),this.$bottom=this.query(".art-bottom"),this.$progress=this.query(".art-progress"),this.$controls=this.query(".art-controls"),this.$controlsLeft=this.query(".art-controls-left"),this.$controlsCenter=this.query(".art-controls-center"),this.$controlsRight=this.query(".art-controls-right"),this.$layer=this.query(".art-layers"),this.$loading=this.query(".art-loading"),this.$notice=this.query(".art-notice"),this.$noticeInner=this.query(".art-notice-inner"),this.$mask=this.query(".art-mask"),this.$state=this.query(".art-state"),this.$setting=this.query(".art-settings"),this.$info=this.query(".art-info"),this.$infoPanel=this.query(".art-info-panel"),this.$infoClose=this.query(".art-info-close"),this.$contextmenu=this.query(".art-contextmenus"),t.proxy){const n=t.proxy.call(this.art,this.art);Le(n instanceof HTMLVideoElement||n instanceof HTMLCanvasElement,"Function 'option.proxy' needs to return 'HTMLVideoElement' or 'HTMLCanvasElement'"),xo(n,this.$video),n.className="art-video",this.$video=n}t.backdrop&&K(this.$player,"art-backdrop"),ue&&K(this.$player,"art-mobile")}destroy(t){t?this.$container.innerHTML="":K(this.$player,"art-destroy")}}class La{on(t,n,r){const o=this.e||(this.e={});return(o[t]||(o[t]=[])).push({fn:n,ctx:r}),this}once(t,n,r){const o=this;function a(...i){o.off(t,a),n.apply(r,i)}return a._=n,this.on(t,a,r)}emit(t,...n){const r=((this.e||(this.e={}))[t]||[]).slice();for(let o=0;o<r.length;o+=1)r[o].fn.apply(r[o].ctx,n);return this}off(t,n){const r=this.e||(this.e={}),o=r[t],a=[];if(o&&n)for(let i=0,s=o.length;i<s;i+=1)o[i].fn!==n&&o[i].fn._!==n&&a.push(o[i]);return a.length?r[t]=a:delete r[t],this}}let rp=0;const Mn=[];class Q extends La{constructor(t,n){if(super(),!nr)throw new Error("Artplayer can only be used in the browser environment");this.id=++rp;const r=ir(Q.option,t);if(r.container=t.container,this.option=Gt(r,Xr),this.isLock=!1,this.isReady=!1,this.isFocus=!1,this.isInput=!1,this.isRotate=!1,this.isDestroy=!1,this.template=new Kn(this),this.events=new ku(this),this.storage=new tp(this),this.icons=new Zu(this),this.i18n=new Mu(this),this.notice=new of(this),this.player=new Uf(this),this.layers=new tf(this),this.controls=new fu(this),this.contextmenu=new tu(this),this.subtitle=new np(this),this.info=new ef(this),this.loading=new nf(this),this.hotkey=new $u(this),this.mask=new rf(this),this.setting=new ep(this),this.plugins=new Xf(this),typeof n=="function"&&this.on("ready",()=>n.call(this,this)),Q.DEBUG){const o=a=>console.log(`[ART.${this.id}] -> ${a}`);o(`Version@${Q.version}`);for(let a=0;a<Xt.events.length;a++)this.on(`video:${Xt.events[a]}`,i=>o(`Event@${i.type}`))}Mn.push(this)}static get instances(){return Mn}static get version(){return bo}static get config(){return Xt}static get utils(){return Gd}static get scheme(){return Xr}static get Emitter(){return La}static get validator(){return Gt}static get kindOf(){return Gt.kindOf}static get html(){return Kn.html}static get option(){return{id:"",container:"#artplayer",url:"",poster:"",type:"",theme:"#f00",volume:.7,isLive:!1,muted:!1,autoplay:!1,autoSize:!1,autoMini:!1,loop:!1,flip:!1,playbackRate:!1,aspectRatio:!1,screenshot:!1,setting:!1,hotkey:!0,pip:!1,mutex:!0,backdrop:!0,fullscreen:!1,fullscreenWeb:!1,subtitleOffset:!1,miniProgressBar:!1,useSSR:!1,playsInline:!0,lock:!1,gesture:!0,fastForward:!1,autoPlayback:!1,autoOrientation:!1,airplay:!1,proxy:void 0,layers:[],contextmenu:[],controls:[],settings:[],quality:[],highlight:[],plugins:[],thumbnails:{url:"",number:60,column:10,width:0,height:0,scale:1},subtitle:{url:"",type:"",style:{},name:"",escape:!0,encoding:"utf-8",onVttLoad:t=>t},moreVideoAttr:{controls:!1,preload:Ci?"auto":"metadata"},i18n:{},icons:{},cssVar:{},customType:{},lang:navigator?.language.toLowerCase()}}get proxy(){return this.events.proxy}get query(){return this.template.query}get video(){return this.template.$video}reset(){this.video.removeAttribute("src"),this.video.load()}destroy(t=!0){Q.REMOVE_SRC_WHEN_DESTROY&&this.reset(),this.events.destroy(),this.template.destroy(t),Mn.splice(Mn.indexOf(this),1),this.isDestroy=!0,this.emit("destroy")}}Q.STYLE=Gi;Q.DEBUG=!1;Q.CONTEXTMENU=!0;Q.NOTICE_TIME=2e3;Q.SETTING_WIDTH=250;Q.SETTING_ITEM_WIDTH=200;Q.SETTING_ITEM_HEIGHT=35;Q.RESIZE_TIME=200;Q.SCROLL_TIME=200;Q.SCROLL_GAP=50;Q.AUTO_PLAYBACK_MAX=10;Q.AUTO_PLAYBACK_MIN=5;Q.AUTO_PLAYBACK_TIMEOUT=3e3;Q.RECONNECT_TIME_MAX=5;Q.RECONNECT_SLEEP_TIME=1e3;Q.CONTROL_HIDE_TIME=3e3;Q.DBCLICK_TIME=300;Q.DBCLICK_FULLSCREEN=!0;Q.MOBILE_DBCLICK_PLAY=!0;Q.MOBILE_CLICK_PLAY=!1;Q.AUTO_ORIENTATION_TIME=200;Q.INFO_LOOP_TIME=1e3;Q.FAST_FORWARD_VALUE=3;Q.FAST_FORWARD_TIME=1e3;Q.TOUCH_MOVE_RATIO=.5;Q.VOLUME_STEP=.1;Q.SEEK_STEP=5;Q.PLAYBACK_RATE=[.5,.75,1,1.25,1.5,2];Q.ASPECT_RATIO=["default","4:3","16:9"];Q.FLIP=["normal","horizontal","vertical"];Q.FULLSCREEN_WEB_IN_BODY=!0;Q.LOG_VERSION=!0;Q.USE_RAF=!1;Q.REMOVE_SRC_WHEN_DESTROY=!0;nr&&(Ni("artplayer-style",Gi),setTimeout(()=>{Q.LOG_VERSION&&console.log(`%c ArtPlayer %c ${Q.version} %c https://artplayer.org`,"color: #fff; background: #5f5f5f","color: #fff; background: #4bc729","")},100));const Xi="cineflow:skip-marks:v1",op=300,Ca=3;function Ia(e){try{const t=JSON.parse(e.getItem(Xi)||"{}");return t&&typeof t=="object"&&!Array.isArray(t)?t:{}}catch{return{}}}function ap(e,t){const n=Object.entries(t).sort((r,o)=>(o[1]?.updatedAt||0)-(r[1]?.updatedAt||0)).slice(0,op);try{e.setItem(Xi,JSON.stringify(Object.fromEntries(n)))}catch{}}function ip(e=globalThis.localStorage){const t=s=>Te(s);function n(s){const l=t(s);if(!l)return null;const u=Ia(e)[l];return u?{introEnd:Number(u.introEnd)||0,outroLength:Number(u.outroLength)||0}:null}function r(s,l){const u=t(s);if(!u)return null;const f=Ia(e),p={...f[u]||{},...l,updatedAt:Date.now()};return!p.introEnd&&!p.outroLength?delete f[u]:f[u]=p,ap(e,f),n(s)}function o(s,l,u){const f=Math.round(Number(l)||0);return f<Ca?{ok:!1,reason:"片头太短，请在片头结束处再标记"}:u>0&&f>u/2?{ok:!1,reason:"当前位置超过一半时长，不像片头"}:{ok:!0,mark:r(s,{introEnd:f})}}function a(s,l,u){const f=Math.round((Number(u)||0)-(Number(l)||0));return u>0?f<Ca?{ok:!1,reason:"离结尾太近，请在片尾开始处再标记"}:f>u/4?{ok:!1,reason:"片尾超过总时长四分之一，请检查位置"}:{ok:!0,mark:r(s,{outroLength:f})}:{ok:!1,reason:"时长未知，暂时不能标记片尾"}}function i(s){return r(s,{introEnd:0,outroLength:0})}return{get:n,markIntroEnd:o,markOutroStart:a,clear:i}}function sp(e,t,n,r){if(!e)return null;const o=Number(n)||0,a=Number(t.lastTime);if(t.lastTime=o,e.introEnd>0&&!t.introDone&&(t.introDone=!0,o<e.introEnd-1&&(!(r>0)||e.introEnd<r-2)))return{action:"intro",to:e.introEnd,from:o};if(e.outroLength>0&&!t.outroDone&&r>0){const i=r-e.outroLength;if(Number.isFinite(a)&&a<i&&o>=i&&o-a<=10&&i>(e.introEnd||0))return t.outroDone=!0,{action:"outro"}}return null}const Ki="cineflow:player-prefs:v1",lp=1e3,cp=1e4;Q.RECONNECT_TIME_MAX=0;Q.CONTEXTMENU=!1;Q.LOG_VERSION=!1;Q.NOTICE_TIME=2600;let ae=null;function dp(){if(ae)return ae;const e=document.querySelector("#playerStage"),t=document.querySelector("#resourcePlayer");if(!e||!t)return null;const n=document.createElement("div");n.className="cf-art-holder",e.insertBefore(n,e.firstChild);try{ae=new Q({container:n,url:"",lang:"zh-cn",theme:"#7fd7c6",volume:.9,autoplay:!1,autoSize:!1,setting:!0,playbackRate:!0,aspectRatio:!0,pip:!0,hotkey:!0,mutex:!0,backdrop:!0,fullscreen:!0,fullscreenWeb:!1,miniProgressBar:!0,fastForward:!0,lock:!0,autoOrientation:!0,moreVideoAttr:{preload:"metadata",playsInline:!0}})}catch{return n.remove(),ae=null,null}const r=ae.template.$video;return r.id="resourcePlayer",r.classList.add("resource-player"),t.remove(),ae.on("video:loadstart",()=>ae.template.$player.classList.remove("art-error")),ae}dp();function up(){try{return{autoNext:!0,autoSkip:!0,...JSON.parse(localStorage.getItem(Ki)||"{}")}}catch{return{autoNext:!0,autoSkip:!0}}}function Pa(e){try{localStorage.setItem(Ki,JSON.stringify(e))}catch{}}function Rr(e){const t=Math.max(0,Math.round(Number(e)||0));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function fp({state:e,escapeHtml:t,toast:n,playEpisode:r}){if(!ae)return null;const o=up(),a=ip();let i={introDone:!1,outroDone:!1,lastTime:Number.NaN,loadId:-1},s=0,l=null;const u=()=>e.player||{},f=()=>Array.isArray(u().playlist)?u().playlist:[],p=()=>u().open&&Number(u().episodeIndex)<f().length-1,h=()=>u().open&&Number(u().episodeIndex)>0,w=()=>u().vod?.title||u().title||"";ae.controls.add({name:"cf-prev",position:"left",index:11,html:'<span class="cf-art-btn">上一集</span>',tooltip:"上一集",click:()=>h()&&r(Number(u().episodeIndex)-1)}),ae.controls.add({name:"cf-next",position:"left",index:12,html:'<span class="cf-art-btn">下一集</span>',tooltip:"下一集",click:()=>p()&&r(Number(u().episodeIndex)+1)}),ae.controls.add({name:"cf-switch",position:"right",index:5,html:'<span class="cf-art-btn">换源</span>',tooltip:"换一个来源，保留当前集数与进度",click:()=>G()});function m(){const C=f().length>1,q=!!u().live;for(const M of["cf-prev","cf-next"]){const v=ae.controls[M];if(!v)continue;v.style.display=C?"":"none";const S=v.querySelector(".cf-art-btn");S&&(S.textContent=M==="cf-prev"?q?"上一台":"上一集":q?"下一台":"下一集")}const E=ae.controls["cf-switch"];E&&(E.style.display=u().vod?"":"none")}const y=()=>{const C=a.get(w());return C&&[C.introEnd?`片头 ${Rr(C.introEnd)}`:"",C.outroLength?`片尾 ${C.outroLength} 秒`:""].filter(Boolean).join(" · ")||"未标记"};ae.setting.add({name:"cf-auto-next",html:"自动连播",switch:o.autoNext,onSwitch(C){return o.autoNext=!C.switch,Pa(o),o.autoNext}}),ae.setting.add({name:"cf-auto-skip",html:"跳过片头片尾",switch:o.autoSkip,onSwitch(C){return o.autoSkip=!C.switch,Pa(o),o.autoSkip}}),ae.setting.add({name:"cf-skip-marks",html:"片头片尾标记",tooltip:y(),selector:[{html:"当前位置设为片头结束",value:"intro"},{html:"当前位置设为片尾开始",value:"outro"},{html:"清除本作品的标记",value:"clear"}],onSelect(C){const q=ae.template.$video;let E={ok:!0};return C.value==="intro"?E=a.markIntroEnd(w(),q.currentTime,q.duration):C.value==="outro"?E=a.markOutroStart(w(),q.currentTime,q.duration):a.clear(w()),ae.notice.show=E.ok?`已保存：${y()}（同一作品所有剧集生效）`:E.reason,y()}});const g=document.createElement("div");g.className="cf-skip-undo is-hidden",ae.template.$player.appendChild(g);let A=0;function R(C,q){window.clearTimeout(A),g.innerHTML=`<span>${t(C)}</span><button type="button">撤销</button>`,g.classList.remove("is-hidden"),g.querySelector("button").onclick=()=>{q(),g.classList.add("is-hidden")},A=window.setTimeout(()=>g.classList.add("is-hidden"),cp)}const k=ae.template.$video;k.addEventListener("loadedmetadata",()=>{if(l&&l.loadId<=u().loadId){const C=l.time;l=null,C>3&&k.duration>C+5&&(k.currentTime=C,ae.notice.show=`已换源，从 ${Rr(C)} 继续`)}}),k.addEventListener("timeupdate",()=>{const C=u();if(!C.open||(i.loadId!==C.loadId&&(i={introDone:!1,outroDone:!1,lastTime:Number.NaN,loadId:C.loadId},m()),!o.autoSkip))return;const q=sp(a.get(w()),i,k.currentTime,k.duration);if(q?.action==="intro"){const E=q.from;k.currentTime=q.to,R(`已跳过片头（${Rr(q.to)}）`,()=>{k.currentTime=E})}else q?.action==="outro"&&(o.autoNext&&p()?(ae.notice.show="已跳过片尾，播放下一集",r(Number(C.episodeIndex)+1)):k.currentTime=Math.max(0,k.duration-.5))}),k.addEventListener("ended",()=>{if(window.clearTimeout(s),!o.autoNext||!p())return;const C=Number(u().episodeIndex)+1,q=u().loadId;ae.notice.show=`即将播放第 ${C+1} 集`,s=window.setTimeout(()=>{u().loadId===q&&u().open&&r(C)},lp)});const b=document.createElement("aside");b.className="cf-source-panel is-hidden",b.setAttribute("aria-label","换源"),ae.template.$player.appendChild(b);let $={candidates:[],searching:!1,message:"",key:""};const I=C=>`${C.sourceKey}:${C.vodId}`;function T(){const C=u().vod;if(!C)return[];const q=[{sourceKey:C.sourceKey,vodId:C.vodId,sourceName:C.sourceName,ms:null,current:!0}];for(const E of C.alternatives||[])I(E)!==I(C)&&q.push({...E,current:!1});return q}function x(){const C=u().vod,q=Number(u().episodeIndex)+1,E=[...$.candidates].sort((M,v)=>Number(v.current)-Number(M.current)||Number(M.failed||!1)-Number(v.failed||!1)||(M.ms??1e9)-(v.ms??1e9));b.innerHTML=`
      <header>
        <strong>换源</strong>
        <span>保留第 ${q} 集与当前进度</span>
        <button class="cf-source-close" type="button" aria-label="关闭">×</button>
      </header>
      ${$.message?`<p class="cf-source-message">${t($.message)}</p>`:""}
      <div class="cf-source-rows">
        ${E.map(M=>`
          <button class="cf-source-row${M.current?" is-current":""}${M.failed?" is-failed":""}${M.ms>2e3?" is-slow":""}" type="button" data-cf-source="${t(I(M))}" ${M.current||M.failed?"disabled":""}>
            <strong>${t(M.sourceName||M.sourceKey)}</strong>
            <small>${M.current?"当前来源":M.failed?t(M.error||"不可用"):M.ms!=null?`${M.ms} 毫秒${M.episodes?` · ${M.episodes} 集`:""}`:"未测速"}</small>
          </button>
        `).join("")}
      </div>
      <footer>
        <button class="secondary-button cf-source-more" type="button" ${$.searching||!C?"disabled":""}>${$.searching?"正在搜索同名来源…":"搜索更多同名来源"}</button>
      </footer>
    `}function P(C=""){const q=u().vod?I(u().vod):"";$.key!==q&&($={candidates:T(),searching:!1,message:"",key:q}),$.message=C,x(),b.classList.remove("is-hidden"),$.candidates.length<=1&&!$.searching&&J()}function O(){b.classList.add("is-hidden")}function G(){b.classList.contains("is-hidden")?P():O()}async function J(){const C=u().vod,q=window.__cineflowVod;if(!(!C||!q?.search)){$.searching=!0,x();try{const E=await q.search(C.title),M=Te(C.title),v=new Set($.candidates.map(I)),S=[];for(const V of E?.groups||[])if(Te(V.name)===M&&!(C.year&&V.year&&V.year!==C.year))for(const le of V.items){const oe={sourceKey:le.sourceKey,vodId:le.vodId,sourceName:le.sourceName,ms:null,current:!1};v.has(I(oe))||(v.add(I(oe)),S.push(oe))}$.candidates.push(...S),$.searching=!1,x();let N=0;const H=async()=>{for(;N<S.length;){const V=S[N++],le=performance.now();try{const oe=await q.detail(V.sourceKey,V.vodId);V.ms=oe?.ok?Math.round(oe.ms??performance.now()-le):null,V.failed=!oe?.ok,V.error=oe?.error||"",V.detail=oe?.ok?oe:null,V.episodes=oe?.ok?Math.max(...oe.lines.map(Re=>Re.episodes.length)):0}catch(oe){V.failed=!0,V.error=String(oe?.message||oe)}b.classList.contains("is-hidden")||x()}};await Promise.all(Array.from({length:Math.min(4,S.length)},H)),S.length||($.message="没有找到更多同名来源。",x())}catch(E){$.searching=!1,$.message=`搜索失败：${String(E?.message||E)}`,x()}}}async function F(C){const q=u(),E=q.vod,M=window.__cineflowVod;if(!E||!M)return;const v=b.querySelector(`[data-cf-source="${CSS.escape(I(C))}"]`);v&&(v.querySelector("small").textContent="正在切换…");let S=C.detail;if(!S)try{S=await M.detail(C.sourceKey,C.vodId)}catch(Se){S={ok:!1,error:String(Se?.message||Se)}}if(!S?.ok){C.failed=!0,C.error=S?.error||"不可用",x();return}const N=S.lines.findIndex(Se=>Se.name===E.lineName),H=N>=0?N:0,V=S.lines[H].episodes.length,le=Number(q.episodeIndex)<V?Number(q.episodeIndex):0,oe=le===Number(q.episodeIndex)?ae.template.$video.currentTime:0;l=oe>3?{loadId:q.loadId+1,time:oe}:null;const Re=$.candidates.filter(Se=>!Se.failed).map(({sourceKey:Se,vodId:it,sourceName:X,ms:z})=>({sourceKey:Se,vodId:it,sourceName:X,ms:z}));O(),M.play({group:{name:E.title,year:E.year,pic:E.pic},item:{sourceKey:C.sourceKey,vodId:C.vodId,sourceName:C.sourceName},detail:S,lineIndex:H,episodeIndex:le,alternatives:Re}),$.key=`${C.sourceKey}:${C.vodId}`;for(const Se of $.candidates)Se.current=I(Se)===$.key;le!==Number(q.episodeIndex)&&n?.(`新来源只有 ${V} 集，已从第 1 集开始`)}b.addEventListener("click",C=>{const q=C.target instanceof Element?C.target:null;if(q?.closest(".cf-source-close"))return O();if(q?.closest(".cf-source-more"))return J();const E=q?.closest("[data-cf-source]");if(!E)return;const M=$.candidates.find(v=>I(v)===E.getAttribute("data-cf-source"));M&&!M.current&&!M.failed&&F(M)}),window.addEventListener("cineflow:player-error",()=>{!u().open||!u().vod||P("当前来源播放失败，请换一个来源（会保留集数）。")});const B=document.querySelector("#playerModal");return B&&new MutationObserver(()=>{B.classList.contains("is-open")?m():(O(),g.classList.add("is-hidden"),window.clearTimeout(s),ae.fullscreen&&(ae.fullscreen=!1))}).observe(B,{attributes:!0,attributeFilter:["class"]}),m(),{art:ae,openSourcePanel:P,closeSourcePanel:O}}const Y=window.cineflow,Jn=window.cineflowVod||null,tt=Jn?al(Jn):null,pp="https://image.tmdb.org/t/p",ko="w500",hp="w342",Ji="w185",$o="w780",mp="w185",gp=72,yp=96,vp=2e3,bp=240,Aa=380,wp=320,xp=14,Sp=900,kp=9e3,$p=46,Mp=6,Kr=[{id:28,name:"动作"},{id:878,name:"科幻"},{id:10749,name:"爱情"},{id:9648,name:"悬疑"},{id:16,name:"动画"},{id:27,name:"恐怖"},{id:35,name:"喜剧"},{id:18,name:"剧情"},{id:80,name:"犯罪"},{id:14,name:"奇幻"}],Ep={12:[10759],14:[10765],28:[10759],53:[9648,10759],878:[10765],10749:[18],10752:[10768],10759:[12,28],10765:[14,878],10768:[10752]},Mo=["想找放松身心的电影或节目？","适合一个人独处看的？","适合晚上/下雨天看的？","想看治愈一点的？","想找节奏快一点的？","适合周末窝在家看的？"],Qi=[{label:"放松治愈",patterns:["放松","轻松","解压","开心","治愈","暖心","舒服","周末","窝在家","下饭","吃饭","快乐","无脑","舒服点","喜剧","搞笑","幽默"],genreIds:[35,16,10751,10749],genreGroups:[[35],[16,10751],[35,10749]],withoutGenreIds:[27,53],sortBy:"popularity.desc"},{label:"独处氛围",patterns:["一个人","独处","孤独","安静","自我","内心","人生","emo","低落","失落","发呆","文艺","剧情"],genreIds:[18,10749,16],genreGroups:[[18],[18,10749],[16]],withoutGenreIds:[27],sortBy:"vote_average.desc",minRating:6.5},{label:"夜晚雨天",patterns:["晚上","夜晚","深夜","下雨","雨天","阴天","失眠","雨夜","睡前","夜里","氛围"],genreIds:[18,10749,9648,16],genreGroups:[[18,10749],[18,9648],[18],[16]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"刺激高能",patterns:["刺激","高能","燃","爽","紧张","动作","冒险","打斗","速度","爆米花","热血"],genreIds:[28,53,12,80],genreGroups:[[28],[28,12],[28,53]],sortBy:"popularity.desc"},{label:"烧脑悬疑",patterns:["烧脑","悬疑","推理","反转","犯罪","谜团","破案","侦探","谜案","真相"],genreIds:[9648,80,53],genreGroups:[[9648],[9648,80],[9648,53]],sortBy:"vote_average.desc",minRating:6.6},{label:"未来想象",patterns:["科幻","未来","赛博","太空","机器人","末日","外星","宇宙","AI","人工智能"],genreIds:[878,12,28],genreGroups:[[878],[878,12],[878,28]],sortBy:"popularity.desc"},{label:"恐怖惊悚",patterns:["恐怖","惊悚","吓人","鬼","怪物","灵异","胆小勿入"],genreIds:[27,53,9648],genreGroups:[[27],[27,53],[27,9648]],sortBy:"popularity.desc"},{label:"恋爱约会",patterns:["恋爱","爱情","浪漫","约会","暧昧","心动","情侣","甜","告白"],genreIds:[10749,35,18],genreGroups:[[10749],[10749,35],[10749,18]],withoutGenreIds:[27],sortBy:"popularity.desc"},{label:"家庭陪伴",patterns:["家庭","亲子","孩子","小朋友","全家","温馨","陪伴","父母"],genreIds:[10751,16,12,35],genreGroups:[[10751],[16,10751],[10751,12]],withoutGenreIds:[27,53,80],sortBy:"popularity.desc"},{label:"催泪感动",patterns:["催泪","感动","哭","想哭","泪点","悲伤","遗憾","温柔"],genreIds:[18,10749,10751],genreGroups:[[18],[18,10749],[18,10751]],withoutGenreIds:[27],sortBy:"vote_average.desc",minRating:6.8},{label:"高分经典",patterns:["高分","经典","口碑","神作","必看","影史","豆瓣"],genreIds:[18,80,9648,878],genreGroups:[[18],[18,80],[9648,80],[878]],sortBy:"vote_average.desc",minRating:7.2}],Zi=[{patterns:["不要恐怖","不恐怖","别恐怖","不吓人","别吓人","不要惊悚","别惊悚"],genreIds:[27,53]},{patterns:["不要血腥","不血腥","别血腥","不要暴力","不暴力"],genreIds:[27,53,80]},{patterns:["不要爱情","不想看爱情","别爱情"],genreIds:[10749]}];Js(Qi,Mo,Zi);const d={appShell:document.querySelector(".app-shell"),statusBanner:document.querySelector("#statusBanner"),dailyTitle:document.querySelector("#dailyTitle"),dailyOverview:document.querySelector("#dailyOverview"),dailyMeta:document.querySelector("#dailyMeta"),dailyPoster:document.querySelector("#dailyPoster"),heroBackdrop:document.querySelector("#heroBackdrop"),dailyDetailBtn:document.querySelector("#dailyDetailBtn"),dailyLikeBtn:document.querySelector("#dailyLikeBtn"),searchBox:document.querySelector(".search-box"),globalSearch:document.querySelector("#globalSearch"),searchMode:document.querySelector("#searchMode"),clearSearchBtn:document.querySelector("#clearSearchBtn"),islandRestoreBtn:document.querySelector("#islandRestoreBtn"),islandRestoreLabel:document.querySelector("#islandRestoreBtn .restore-label"),refreshBtn:document.querySelector("#refreshBtn"),settingsBtn:document.querySelector("#settingsBtn"),favoritesBtn:document.querySelector("#favoritesBtn"),favoritesCount:document.querySelector("#favoritesCount"),favoritesPanel:document.querySelector("#favoritesPanel"),favoritesPullBtn:document.querySelector("#favoritesPullBtn"),favoritesList:document.querySelector("#favoritesList"),minBtn:document.querySelector("#minBtn"),maxBtn:document.querySelector("#maxBtn"),closeBtn:document.querySelector("#closeBtn"),islandDockHandle:document.querySelector("#islandDockHandle"),searchSection:document.querySelector("#searchSection"),searchTitle:document.querySelector("#searchTitle"),searchHint:document.querySelector("#searchHint"),searchMoreBtn:document.querySelector("#searchMoreBtn"),searchRail:document.querySelector("#searchRail"),styleRail:document.querySelector("#styleRail"),personalizedRail:document.querySelector("#personalizedRail"),personalizedMoreBtn:document.querySelector("#personalizedMoreBtn"),trendingRail:document.querySelector("#trendingRail"),trendingMoreBtn:document.querySelector("#trendingMoreBtn"),profileHint:document.querySelector("#profileHint"),detailPanel:document.querySelector("#detailPanel"),detailContent:document.querySelector("#detailContent"),detailCloseBtn:document.querySelector("#detailCloseBtn"),settingsModal:document.querySelector("#settingsModal"),settingsCloseBtn:document.querySelector("#settingsCloseBtn"),settingsState:document.querySelector("#settingsState"),apiCredentialInput:document.querySelector("#apiCredentialInput"),proxyInput:document.querySelector("#proxyInput"),resourceModeSelect:document.querySelector("#resourceModeSelect"),resourcePlaybackModeSelect:document.querySelector("#resourcePlaybackModeSelect"),playbackProxySelect:document.querySelector("#playbackProxySelect"),saveSettingsBtn:document.querySelector("#saveSettingsBtn"),testConnectionBtn:document.querySelector("#testConnectionBtn"),clearSettingsBtn:document.querySelector("#clearSettingsBtn"),closeChoiceModal:document.querySelector("#closeChoiceModal"),closeToIslandBtn:document.querySelector("#closeToIslandBtn"),exitAppBtn:document.querySelector("#exitAppBtn"),cancelCloseBtn:document.querySelector("#cancelCloseBtn"),toast:document.querySelector("#toast"),splash:document.querySelector("#splash"),splashCanvas:document.querySelector("#splashCanvas"),splashStatus:document.querySelector("#splashStatus"),playerModal:document.querySelector("#playerModal"),playerShell:document.querySelector(".player-shell"),playerTitle:document.querySelector("#playerTitle"),playerSource:document.querySelector("#playerSource"),playerMeta:document.querySelector("#playerMeta"),playerStage:document.querySelector("#playerStage"),resourcePlayer:document.querySelector("#resourcePlayer"),playerEpisodes:document.querySelector("#playerEpisodes"),playerEpisodesMeta:document.querySelector("#playerEpisodesMeta"),playerEpisodeList:document.querySelector("#playerEpisodeList"),playerLoader:document.querySelector("#playerLoader"),playerError:document.querySelector("#playerError"),playerStatus:document.querySelector("#playerStatus"),playerCloseBtn:document.querySelector("#playerCloseBtn"),playerCopyBtn:document.querySelector("#playerCopyBtn"),playerExternalBtn:document.querySelector("#playerExternalBtn"),playerStopBtn:document.querySelector("#playerStopBtn")},Tp=2360,c={genres:Kr,genreMap:new Map(Kr.map(e=>[e.id,e.name])),daily:null,trending:[],popular:[],credential:null,proxy:null,resourceSettings:{mode:"stable",label:"稳定优先",enabled:!0,playbackMode:"auto",playbackLabel:"自动判断（推荐）",playbackModes:[{value:"auto",label:"自动判断（推荐）",description:""},{value:"direct",label:"直连优先",description:""},{value:"proxy",label:"本地代理优先",description:""}],sources:[],sourceCount:0,builtInSourceCount:0,customSourceCount:0},player:{open:!1,url:"",originalUrl:"",resolvedUrl:"",proxiedUrl:"",kind:"native",title:"",sourceName:"",lineName:"",label:"",format:"",playlistId:"",playlist:[],episodeIndex:0,playbackMode:"auto",transport:"direct",transportFallbackUsed:!1,proxyUrlPromise:null,recoveries:0,loadId:0,seeking:!1},searchTimer:null,activeSearchId:0,initialLoadId:0,initialRetryTimer:null,windowMode:"normal",detailsCache:new Map,detailRequests:new Map,railCache:new Map,railCachePending:new Map,railStates:new Map,cardMovies:new Map,resourcePlaylists:new Map,lastDetailMovieId:null,lastDetailMediaType:"movie",lastDetailFallback:null,lastRenderedDetail:null,activeResourceSearchId:0,islandPointer:{down:!1,moved:!1,startX:0,startY:0,lastX:0,lastY:0,source:null,fromInput:!1},dockEdge:null,islandAutoRestoreFrame:0,islandDragMoveFrame:0,splashStartedAt:performance.now(),splashHidden:!1,prefs:Pp()};let ht=null,Nr=0,Ra=0,Tt=null,En=null,Ut=null,Tn=null,Vt=null,Ln=null,se=null,we=null,Be=null,Jr=0,Br=0,Cn=new Set,Jt=0,Qt=0,on=0,Qn=0,Qr=0,Zr=0,Oe=null,Eo=null,Dr=null;function Qe(e,t){return e?`${pp}/${t}${e}`:""}function To(e){return(e?.releaseDate||"").slice(0,4)||"未知年份"}function xe(e,t="movie"){return String(e?.mediaType||e?.media_type||t||"movie").toLowerCase()==="tv"?"tv":"movie"}function es(e){return xe(e)==="tv"?"节目":"电影"}function ts(e){return xe(e)==="tv"?"节目详情":"电影详情"}function ke(e,t="movie"){return typeof e=="object"&&e?`${xe(e,t)}:${e.id||""}`:`${xe({mediaType:t})}:${e||""}`}function Lo(e){const t=Number(e?.voteAverage||0);return t?t.toFixed(1):"暂无"}function ns(e,t=3){return(e?.genreIds||[]).map(r=>c.genreMap.get(r)).filter(Boolean).slice(0,t)}function Lp(e,t=""){return String(e||t)}function Co(e,t,n,r){for(e.has(t)&&e.delete(t);e.size>=r;){const o=e.keys().next().value;if(o===void 0)break;e.delete(o)}return e.set(t,n),n}function Ye(e,t="movie"){return ke(e,t)}function Cp(e,t,n){return Co(c.detailsCache,Ye(e,t),n,gp)}function Ip(e){e?.id&&Co(c.cardMovies,ke(e),e,vp)}function Pp(){try{const e=JSON.parse(localStorage.getItem("cineflow:prefs")||"{}");return{genreWeights:e.genreWeights||{},likedMovieIds:e.likedMovieIds||[],favorites:Array.isArray(e.favorites)?e.favorites:[],recentSearches:e.recentSearches||[],clickedMovieIds:e.clickedMovieIds||[]}}catch{return{genreWeights:{},likedMovieIds:[],favorites:[],recentSearches:[],clickedMovieIds:[]}}}function mn(e={}){if(clearTimeout(Nr),e.immediate){localStorage.setItem("cineflow:prefs",JSON.stringify(c.prefs));return}Nr=setTimeout(()=>{localStorage.setItem("cineflow:prefs",JSON.stringify(c.prefs)),Nr=0},bp)}function an(e=[],t=1){for(const n of e)c.prefs.genreWeights[n]=(c.prefs.genreWeights[n]||0)+t;mn()}function rs(e){const t=String(e||"").trim();t&&(c.prefs.recentSearches=[t,...c.prefs.recentSearches.filter(n=>n!==t)].slice(0,8),mn())}function Na(e){if(!e?.id)return;const t=ke(e);c.prefs.clickedMovieIds=[t,...c.prefs.clickedMovieIds.filter(n=>n!==t)].slice(0,20),an(e.genreIds,.8)}function os(e){if(!e?.id)return;const t=ke(e);c.prefs.likedMovieIds=[t,...c.prefs.likedMovieIds.filter(n=>n!==t)].slice(0,50),as(e),an(e.genreIds,2.5),fe("已加入你的偏好"),Ro()}function Ap(e){const t=ke(e),n=c.detailsCache.get(Ye(e?.id,xe(e)))||c.cardMovies.get(t)||{},r=a=>e?.[a]??n[a],o=Array.isArray(n.genres)?n.genres.map(a=>a.id).filter(Boolean):[];return{id:e.id,mediaType:xe(e),title:r("title")||"未命名",posterPath:r("posterPath")||null,releaseDate:r("releaseDate")||"",voteAverage:Number(r("voteAverage")||0),genreIds:r("genreIds")||o||[]}}function as(e){if(!e?.id)return;const t=ke(e);c.prefs.favorites=[Ap(e),...(c.prefs.favorites||[]).filter(n=>ke(n)!==t)].slice(0,100),mn(),cr(),d.favoritesPanel?.classList.contains("is-open")&&dr()}function is(e){if(!e?.id)return!1;const t=ke(e);return(c.prefs.favorites||[]).some(n=>ke(n)===t)}function ss(e){c.prefs.favorites=(c.prefs.favorites||[]).filter(t=>ke(t)!==e),c.prefs.likedMovieIds=(c.prefs.likedMovieIds||[]).filter(t=>t!==e),mn({immediate:!0}),dr(),cr(),oo(),fe("已取消收藏")}function Rp(e){return e?.id?is(e)?(ss(ke(e)),!1):(as(e),cr(),fe("已加入收藏"),!0):!1}function Ba(e,t="movie"){const n=Ye(e,t);if(!n||c.detailsCache.has(n)||c.detailRequests.has(n)||c.detailRequests.size>=2)return;(window.requestIdleCallback?o=>window.requestIdleCallback(o,{timeout:900}):o=>window.setTimeout(o,120))(()=>{c.detailsCache.has(n)||c.detailRequests.has(n)||ls(e,t).catch(()=>{})})}async function ls(e,t="movie"){const n=xe({mediaType:t}),r=Ye(e,n);if(!r)return null;if(c.detailsCache.has(r))return c.detailsCache.get(r);if(c.detailRequests.has(r))return c.detailRequests.get(r);const o=Y.getMovieDetails(e,{mediaType:n}).then(a=>Cp(e,n,a)).finally(()=>c.detailRequests.delete(r));return c.detailRequests.set(r,o),o}function Np(e=3){return Object.entries(c.prefs.genreWeights).sort((t,n)=>n[1]-t[1]).map(([t])=>Number(t)).filter(Boolean).slice(0,e)}function ct(e,t="info"){if(!e){d.statusBanner.classList.add("is-hidden"),d.statusBanner.textContent="";return}d.statusBanner.textContent=e,d.statusBanner.dataset.type=t,d.statusBanner.classList.remove("is-hidden")}let Da;function fe(e){clearTimeout(Da),d.toast.textContent=e,d.toast.classList.remove("is-hidden"),Da=setTimeout(()=>d.toast.classList.add("is-hidden"),2400)}function Fn(e){!d.splashStatus||!e||(d.splashStatus.textContent=e)}function cs(e){return Math.min(1,Math.max(0,e))}function Bp(e){const t=cs(e);return 1-Math.pow(1-t,3)}function Ot(e,t,n){const r=cs((n-e)/(t-e||1));return r*r*(3-2*r)}function Dp(){if(!d.splash||!d.splashCanvas)return;ht&&(ht(),ht=null);const e=d.splashCanvas,t=e.getContext("2d",{alpha:!0});if(!t)return;const n=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,r=["rgba(218,226,255,","rgba(158,142,255,","rgba(78,150,255,","rgba(112,92,190,"];let o=!1,a=0,i=1,s=1,l=1,u=[],f=[],p=[];const h=()=>{if(o||!d.splash)return;const m=d.splash.getBoundingClientRect();i=Math.max(1,m.width||window.innerWidth||1),s=Math.max(1,m.height||window.innerHeight||1),l=Math.min(n?1.05:1.35,Math.max(1,window.devicePixelRatio||1)),e.width=Math.floor(i*l),e.height=Math.floor(s*l),t.setTransform(l,0,0,l,0,0),u=Array.from({length:n?18:52},()=>({x:Math.random()*i,y:Math.random()*s,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.11,r:Math.random()*1.25+.24,a:Math.random()*.095+.018,phase:Math.random()*Math.PI*2})),f=Array.from({length:n?4:14},(y,g)=>({x:Math.random()*i,y:s*(.2+Math.random()*.62),len:i*(.12+Math.random()*.25),width:.65+Math.random()*2.05,speed:i*(3e-4+Math.random()*46e-5),angle:(-10+Math.random()*20)*Math.PI/180,phase:Math.random()*Math.PI*2,color:r[g%r.length],delay:Math.random()*.52,alpha:.15+Math.random()*.31})),p=Array.from({length:n?6:22},(y,g)=>({ox:(Math.random()-.5)*i*.9,oy:(Math.random()-.5)*s*.22,w:16+Math.random()*78,h:1+Math.random()*4.5,skew:(Math.random()-.5)*18,phase:Math.random()*Math.PI*2,color:r[g%r.length],alpha:.07+Math.random()*.2}))},w=m=>{if(o||!e.isConnected)return;const y=(m-c.splashStartedAt)/1e3;t.clearRect(0,0,i,s);const g=t.createLinearGradient(0,0,i,s);g.addColorStop(0,"rgba(3,4,12,0.72)"),g.addColorStop(.46,"rgba(10,10,22,0.74)"),g.addColorStop(1,"rgba(0,0,0,0.88)"),t.fillStyle=g,t.fillRect(0,0,i,s),t.save(),t.globalAlpha=.17,t.fillStyle="rgba(218,226,255,0.027)";const A=y*28%36;for(let b=-A;b<s;b+=36)t.fillRect(0,b,i,1);t.restore();for(const b of u){n||(b.x+=b.vx,b.y+=b.vy,b.phase+=.018),b.x<-10&&(b.x=i+10),b.x>i+10&&(b.x=-10),b.y<-10&&(b.y=s+10),b.y>s+10&&(b.y=-10);const $=b.a*(.58+Math.sin(b.phase+y*.8)*.34);t.beginPath(),t.arc(b.x,b.y,b.r,0,Math.PI*2),t.fillStyle=`rgba(255,255,255,${Math.max(0,$).toFixed(3)})`,t.fill()}t.save(),t.globalCompositeOperation="lighter";for(const b of f){const I=(y*b.speed*240+b.x+Math.sin(y*.8+b.phase)*28)%(i+b.len+180)-b.len-90,T=b.y+Math.sin(y*.75+b.phase)*18,x=Ot(b.delay*.55,b.delay*.55+.48,y)*(1-Ot(2.2,2.7,y));if(x<=0)continue;t.save(),t.translate(I,T),t.rotate(b.angle);const P=t.createLinearGradient(-b.len*.5,0,b.len*.5,0);P.addColorStop(0,`${b.color}0)`),P.addColorStop(.52,`${b.color}${(b.alpha*x).toFixed(3)})`),P.addColorStop(1,"rgba(255,255,255,0)"),t.strokeStyle=P,t.lineWidth=b.width,t.shadowColor=`${b.color}${(.32*x).toFixed(3)})`,t.shadowBlur=17,t.beginPath(),t.moveTo(-b.len*.5,0),t.lineTo(b.len*.5,0),t.stroke(),t.restore()}const R=Bp((y-.08)/.92),k=1-Ot(2.1,2.7,y);if(R>0&&k>0){const b=s*.5+Math.sin(y*1.4)*1.6,$=i*(.16+R*.72),I=i*.5-$*.5,T=i*.5+$*.5,x=(.32+R*.54)*k,P=t.createLinearGradient(I,b,T,b);P.addColorStop(0,"rgba(78,150,255,0)"),P.addColorStop(.18,`rgba(78,150,255,${(.17*k).toFixed(3)})`),P.addColorStop(.5,`rgba(255,255,255,${x.toFixed(3)})`),P.addColorStop(.68,`rgba(218,226,255,${(.36*k).toFixed(3)})`),P.addColorStop(.84,`rgba(158,142,255,${(.18*k).toFixed(3)})`),P.addColorStop(1,"rgba(158,142,255,0)"),t.shadowColor=`rgba(218,226,255,${(.45*k).toFixed(3)})`,t.shadowBlur=38+R*38,t.lineCap="round",t.strokeStyle=P,t.lineWidth=1.4+R*2.2,t.beginPath(),t.moveTo(I,b),t.lineTo(T,b),t.stroke();const O=Math.exp(-Math.pow((y-.58)/.24,2));if(O>.018){const B=t.createLinearGradient(0,b,i,b);B.addColorStop(0,"rgba(158,142,255,0)"),B.addColorStop(.46,`rgba(158,142,255,${(.064*O).toFixed(3)})`),B.addColorStop(.5,`rgba(255,255,255,${(.15*O).toFixed(3)})`),B.addColorStop(.54,`rgba(78,150,255,${(.074*O).toFixed(3)})`),B.addColorStop(1,"rgba(218,226,255,0)"),t.fillStyle=B,t.fillRect(0,b-48*O,i,96*O)}const G=Ot(.45,1.55,y)*k;if(G>0){t.shadowBlur=18,t.strokeStyle=`rgba(218,226,255,${(.2*G).toFixed(3)})`,t.lineWidth=1,t.beginPath();const B=76;for(let C=0;C<=B;C+=1){const q=C/B,E=I+$*q,M=1-Math.abs(q-.5)*2,v=(4+18*R)*Math.pow(Math.max(0,M),1.4)*G,S=b+Math.sin(q*34+y*8.2)*v+Math.sin(q*87-y*5.1)*v*.18;C===0?t.moveTo(E,S):t.lineTo(E,S)}t.stroke()}const J=Ot(.42,1.75,y)*k;for(const B of p){const C=Math.sin(y*1.7+B.phase)*22,q=i*.5+B.ox*(.18+J*.82)+C,E=b+B.oy*(.2+J*.92),M=B.alpha*J*(.62+Math.sin(y*5+B.phase)*.38);M<=0||(t.save(),t.translate(q,E),t.rotate((-6+B.skew*.1)*Math.PI/180),t.fillStyle=`${B.color}${Math.max(0,M).toFixed(3)})`,t.shadowColor=`${B.color}${Math.min(.36,M*1.12).toFixed(3)})`,t.shadowBlur=13,t.beginPath(),t.moveTo(-B.w*.5,-B.h*.5),t.lineTo(B.w*.5,-B.h*.5),t.lineTo(B.w*.5+B.skew,B.h*.5),t.lineTo(-B.w*.5+B.skew,B.h*.5),t.closePath(),t.fill(),t.restore())}const F=Math.exp(-Math.pow((y-1.08)/.32,2));if(F>.015){const B=t.createLinearGradient(0,b,i,b);B.addColorStop(0,"rgba(78,150,255,0)"),B.addColorStop(.48,`rgba(255,255,255,${(.17*F).toFixed(3)})`),B.addColorStop(.52,`rgba(218,226,255,${(.2*F).toFixed(3)})`),B.addColorStop(1,"rgba(158,142,255,0)"),t.fillStyle=B,t.fillRect(0,b-42*F,i,84*F)}}t.restore(),(!n||y<.9||d.splash?.classList.contains("exiting"))&&(a=window.requestAnimationFrame(w))};h(),window.addEventListener("resize",h),a=window.requestAnimationFrame(w),ht=()=>{o=!0,window.removeEventListener("resize",h),a&&window.cancelAnimationFrame(a),t.clearRect(0,0,i,s)}}function _p(){ht&&(ht(),ht=null)}function qp(){if(!d.splash||c.splashHidden)return;c.splashHidden=!0,Fn("正在进入 CineFlow"),d.splash.classList.add("ready");const e=performance.now()-c.splashStartedAt,t=Math.max(0,Tp-e);window.setTimeout(()=>{document.body.classList.add("splash-revealing"),d.splash.classList.add("exiting"),window.setTimeout(()=>{_p(),d.splash?.remove(),document.body.classList.remove("splash-active","splash-revealing")},980)},t)}function Pt(e,t=8){Ze(e),e.innerHTML=Array.from({length:t}).map(()=>'<article class="movie-card skeleton"><div></div><span></span><small></small></article>').join("")}function rt(e,t){Ze(e),e.innerHTML=`<div class="empty-state">${t}</div>`}function Ze(e){const t=e===d.searchRail?d.searchMoreBtn:e===d.personalizedRail?d.personalizedMoreBtn:e===d.trendingRail?d.trendingMoreBtn:null;t&&(t.hidden=!0)}function Io(){return!!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches}function Po(e,t={}){if(!Array.isArray(e)||!e.length||Io()||document.body.classList.contains("is-motion-throttled"))return;const n=Math.min(e.length,Number(t.limit||xp));window.requestAnimationFrame(()=>{for(let r=0;r<n;r+=1){const o=e[r];o&&(o.style.setProperty("--cf-reveal-index",String(r)),o.style.setProperty("--cf-reveal-delay",`${r*34}ms`),o.classList.add("is-premium-revealing"),window.setTimeout(()=>{o.classList.remove("is-premium-revealing"),o.style.removeProperty("--cf-reveal-index"),o.style.removeProperty("--cf-reveal-delay")},Sp+r*34))}})}function ds(e,t,n={}){const r=document.createDocumentFragment(),o=[];for(const a of t){const i=Op(a,n);o.push(i),r.appendChild(i)}e.appendChild(r),Po(o,{limit:n.revealLimit})}function Op(e,{compact:t=!1}={}){const n=document.createElement("article");n.className=t?"movie-card compact":"movie-card",n.tabIndex=0,n.dataset.movieId=e.id,n.dataset.mediaType=xe(e),n.dataset.contentKey=ke(e),Ip(e);const r=Qe(e.posterPath,t?Ji:hp),o=ns(e).join(" · ");return n.innerHTML=`
    <div class="poster-frame">
      ${r?`<img src="${r}" alt="${_(e.title)} 海报" loading="lazy" decoding="async" />`:'<div class="poster-fallback">No Poster</div>'}
      <div class="score-pill">★ ${Lo(e)} · ${es(e)}</div>
    </div>
    <h3>${_(e.title)}</h3>
    <p>${_([To(e),o].filter(Boolean).join(" · "))}</p>
  `,n}function nt(e,t,n={}){if(e.innerHTML="",e.classList.remove("is-expanded"),n.stateKey){if(String(n.stateKey).startsWith("search:"))for(const r of c.railStates.keys())String(r).startsWith("search:")&&r!==n.stateKey&&c.railStates.delete(r);c.railStates.set(n.stateKey,{rail:e,movies:Ue(t||[]),options:{...n},loadMore:n.loadMore,page:n.initialPage||1,hasMore:n.hasMore!==!1,loading:!1,autoBound:!1})}if(!t?.length){rt(e,n.empty||"暂时没有找到合适的电影或节目。"),eo(n.moreButton,e,0,n.stateKey);return}ds(e,t,n),eo(n.moreButton,e,t.length,n.stateKey)}function eo(e,t,n,r){if(!e)return;const o=r?c.railStates.get(r):null,a=n>0&&(n>6||!!o?.loadMore);e.hidden=!a,e.disabled=!1,e.classList.remove("is-expanded"),e.textContent="加载更多",e.onclick=()=>Fp(e,t,r),e.title="展开后向下滚动会自动加载更多电影/节目"}async function Fp(e,t,n){if(t.classList.contains("is-expanded")){Hp(e,t);return}zp(e,t,n),await fs(n,e)}function zp(e,t,n){t.classList.add("is-expanded"),e.classList.add("is-expanded"),e.textContent="收起",e.title="点击收起，向下滚动自动加载更多";const r=n?c.railStates.get(n):null;r&&!r.autoBound&&(r.autoBound=!0,t.addEventListener("scroll",()=>qa(n,e),{passive:!0}),t.addEventListener("wheel",()=>setTimeout(()=>qa(n,e),80),{passive:!0}))}function Hp(e,t){t.classList.remove("is-expanded"),e.classList.remove("is-expanded"),e.disabled=!1,e.textContent="加载更多",e.title="展开后向下滚动会自动加载更多电影/节目",t.scrollTo({left:0,top:0,behavior:"smooth"}),t.closest(".content-section")?.scrollIntoView({behavior:"smooth",block:"nearest"})}function Up(e={}){if(!d.searchSection||d.searchSection.classList.contains("is-hidden"))return;const t=(o="auto")=>{if(!d.searchSection||d.searchSection.classList.contains("is-hidden"))return;const a=Math.max(0,d.searchSection.offsetTop-18);if(d.appShell){d.appShell.scrollTo({top:a,behavior:o});return}d.searchSection.scrollIntoView({behavior:o,block:"start",inline:"nearest"})},n=()=>{requestAnimationFrame(()=>t("auto")),window.setTimeout(()=>t("smooth"),120),window.setTimeout(()=>t("smooth"),320)},r=Math.max(0,Number(e.delayMs||0));r>0?window.setTimeout(n,r):n()}function us(){Zt({focusInputRecommendations:!0})}function Ao(e=c.windowMode){return e==="island"||e==="island-expanded"||e==="island-docked"}function _a(e){for(const t of[document.documentElement,document.body])t.classList.toggle("is-window-restoring",e)}function sn(e={}){if(!d.islandRestoreBtn)return;const t=e.mode||c.windowMode,n=t==="island"||t==="island-expanded",r=!!d.globalSearch?.value.trim(),o=t==="island-expanded"&&r,a=t==="island-expanded"?"回主窗":"展开",i=t==="island-expanded"?"恢复主窗口并定位到当前推荐":"展开回 CineFlow 主窗口";d.islandRestoreBtn.dataset.mode=t,d.islandRestoreBtn.classList.toggle("is-visible",n),d.islandRestoreBtn.classList.toggle("is-compact",o),d.islandRestoreBtn.classList.toggle("is-restoring",!!e.restoring),d.islandRestoreLabel&&(d.islandRestoreLabel.textContent=e.restoring?"展开中":a),d.islandRestoreBtn.title=i,d.islandRestoreBtn.setAttribute("aria-label",i)}function Zt(e={}){if(!Ao())return;const t=!!e.focusInputRecommendations;Lt(),_a(!0),sn({restoring:!0}),window.setTimeout(()=>{_a(!1),sn()},Aa),Y.restoreNormal(),Ke({mode:"normal"}),t&&Up({delayMs:Math.max(280,Aa-120)})}function qa(e,t){const n=e?c.railStates.get(e):null;if(!n||!n.rail.classList.contains("is-expanded")||n.loading||n.hasMore===!1)return;n.rail.scrollHeight-n.rail.scrollTop-n.rail.clientHeight<420&&(c.windowMode==="island-expanded"&&us(),fs(e,t))}async function fs(e,t){const n=e?c.railStates.get(e):null;if(!n?.loadMore||n.loading||n.hasMore===!1){t&&n?.hasMore===!1&&(t.textContent=n.rail?.classList.contains("is-expanded")?"收起":"加载更多",t.disabled=!1);return}n.loading=!0;const r=t?.textContent;t&&(t.disabled=!1,t.textContent="加载中...");try{const o=n.page+1,a=await n.loadMore(o,n);if(c.railStates.get(e)!==n)return;const i=Ue([...n.movies||[],...a||[]]),s=i.slice(n.movies.length);n.movies=i,n.page=o,s.length&&ds(n.rail,s,n.options),(!s.length||a?.length<18)&&(n.hasMore=!1,s.length||fe("已全部显示")),t&&(t.textContent=n.rail.classList.contains("is-expanded")?"收起":"加载更多")}catch(o){if(c.railStates.get(e)!==n)return;fe(Ce(o)),t&&(t.textContent=n.rail.classList.contains("is-expanded")?r||"收起":"加载更多")}finally{n.loading=!1,t&&c.railStates.get(e)===n&&(t.disabled=!1)}}function Oa(e){if(c.daily=e,!e){d.dailyTitle.textContent="还没有拿到今日推荐",d.dailyOverview.textContent="请检查 TMDB 密钥或网络连接。",d.dailyMeta.innerHTML="",d.dailyPoster.textContent="CineFlow",d.dailyPoster.className="hero-poster poster-placeholder",d.heroBackdrop.style.backgroundImage="";return}d.dailyTitle.textContent=e.title,d.dailyOverview.textContent=e.overview||`这部${es(e)}暂时没有中文简介，但它已经进入今天的推荐片单。`,d.dailyMeta.innerHTML=`
    <span>★ ${Lo(e)}</span>
    <span>${To(e)}</span>
    ${ns(e).map(r=>`<span>${_(r)}</span>`).join("")}
  `;const t=Qe(e.posterPath,ko),n=Qe(e.backdropPath,$o);d.dailyPoster.className=t?"hero-poster":"hero-poster poster-placeholder",d.dailyPoster.innerHTML=t?`<img src="${t}" alt="${_(e.title)} 海报" decoding="async" fetchpriority="high" />`:"CineFlow",d.heroBackdrop.style.backgroundImage=n?`url("${n}")`:""}function Fa(){const e=[...c.genres].sort((r,o)=>za(r.name)-za(o.name)).slice(0,14);d.styleRail.innerHTML="";const t=document.createDocumentFragment(),n=[];for(const r of e){const o=document.createElement("button");o.className="style-chip",o.type="button",o.innerHTML=`
      <span>${_(r.name)}</span>
      <small>${Vp(r.name)}</small>
    `,o.addEventListener("click",async()=>{an([r.id],1.2),await jp(r),Ro()}),n.push(o),t.appendChild(o)}d.styleRail.appendChild(t),Po(n,{limit:10})}function za(e){const n=["动作","科幻","爱情","悬疑","动画","恐怖","喜剧","剧情","犯罪","奇幻","冒险","纪录"].findIndex(r=>e.includes(r));return n===-1?99:n}function Vp(e){return e.includes("动作")?"高能节奏":e.includes("科幻")?"未来想象":e.includes("爱情")?"温柔心动":e.includes("悬疑")?"反转推理":e.includes("动画")?"治愈幻想":e.includes("恐怖")?"暗夜惊悚":e.includes("喜剧")?"轻松解压":e.includes("剧情")?"人物故事":e.includes("犯罪")?"灰色边界":e.includes("奇幻")?"异世界":"探索更多"}async function jp(e){clearTimeout(c.searchTimer);const t=++c.activeSearchId;for(const n of c.railStates.keys())String(n).startsWith("search:")&&c.railStates.delete(n);Ze(d.searchRail),d.searchSection.classList.remove("is-hidden"),d.searchTitle.textContent=`${e.name}电影/节目推荐`,d.searchHint.textContent="来自 TMDB Discover",Pt(d.searchRail,8);try{const n=`genre:${e.id}`,r=await ln(n,()=>Y.discoverMovies({genreId:e.id,sortBy:"popularity.desc",page:1}));if(t!==c.activeSearchId)return;nt(d.searchRail,r,{empty:`暂时没有找到 ${e.name} 类型电影或节目。`,moreButton:d.searchMoreBtn,stateKey:`search:genre:${e.id}`,loadMore:o=>Y.discoverMovies({genreId:e.id,sortBy:"popularity.desc",page:o})})}catch(n){if(t!==c.activeSearchId)return;rt(d.searchRail,Ce(n))}}async function Ro(){Pt(d.personalizedRail,8);const e=Np(3);try{let t=[],n="personal:popular",r=o=>Y.discoverMovies({sortBy:"popularity.desc",minVotes:120,page:o});if(e.length){d.profileHint.textContent=`偏好：${e.map(a=>c.genreMap.get(a)).filter(Boolean).join(" · ")}`,n=`personal:${e.join(",")}`;const o=await Promise.all(e.map(a=>ln(`personal:${a}`,()=>Y.discoverMovies({genreId:a,sortBy:"vote_average.desc",minVotes:200}))));t=Ue(o.flat()).slice(0,24),r=async a=>{const i=await Promise.all(e.map(s=>Y.discoverMovies({genreId:s,sortBy:"vote_average.desc",minVotes:200,page:a}).catch(()=>[])));return Ue(i.flat())}}else if(c.daily?.id){d.profileHint.textContent="还没有偏好记录，先从今日推荐延展";const o=xe(c.daily);n=`personal:recommend:${o}:${c.daily.id}`,t=await ln(`recommend:${o}:${c.daily.id}`,()=>Y.recommendByMovie(c.daily.id,{mediaType:o})),t.length||(t=c.popular),r=async a=>{const i=await Y.recommendByMovie(c.daily.id,{mediaType:o,page:a}).catch(()=>[]);return i.length?i:Y.discoverMovies({sortBy:"popularity.desc",minVotes:120,page:a})}}else d.profileHint.textContent="还没有偏好记录，先展示热门电影/节目",t=c.popular;nt(d.personalizedRail,t,{empty:"多点击或收藏几部电影/节目后，这里会更懂你。",moreButton:d.personalizedMoreBtn,stateKey:n,loadMore:r})}catch(t){nt(d.personalizedRail,c.popular,{empty:Ce(t),moreButton:d.personalizedMoreBtn,stateKey:"personal:fallback",loadMore:n=>Y.discoverMovies({sortBy:"popularity.desc",minVotes:120,page:n})})}}function Wp(){nt(d.trendingRail,Ue([...c.trending,...c.popular]).slice(0,24),{moreButton:d.trendingMoreBtn,stateKey:"trending",loadMore:async e=>{const[t,n]=await Promise.all([Y.discoverMovies({sortBy:"popularity.desc",minVotes:120,page:e}).catch(()=>[]),Y.discoverMovies({sortBy:"vote_average.desc",minVotes:300,page:e}).catch(()=>[])]);return Ue([...t,...n])}})}async function ln(e,t){if(c.railCache.has(e))return c.railCache.get(e);if(c.railCachePending.has(e))return c.railCachePending.get(e);const n=Promise.resolve().then(t).then(r=>{const o=Array.isArray(r)?r:[];return Co(c.railCache,e,o,yp),o}).finally(()=>c.railCachePending.delete(e));return c.railCachePending.set(e,n),n}function Ue(e=[]){const t=new Set;return e.filter(n=>{const r=ke(n);return!n?.id||t.has(r)?!1:(t.add(r),!0)})}async function sr(e=0){const t=++c.initialLoadId;clearTimeout(c.initialRetryTimer),c.initialRetryTimer=null,e===0&&(Fn("正在装载今日片单"),ct(""),Pt(d.personalizedRail,8),Pt(d.trendingRail,8)),Fa();try{const n=await Y.getInitialData();if(t!==c.initialLoadId)return;Fn("正在点亮推荐流"),c.credential=n.credential,vt(n.credential?.resources||c.resourceSettings),c.genres=n.genres?.length?n.genres:Kr,c.genreMap=new Map(c.genres.map(r=>[r.id,r.name])),c.trending=n.trending||[],c.popular=n.popular||[],Oa(n.daily),Fa(),Wp(),Ro(),c.proxy=n.credential?.proxy||null,wt(n.credential),n.credential?.configured?c.trending.length||c.popular.length?ct(""):e<2?(ct(`正在重新加载 TMDB 推荐（${e+1}/2）…`,"info"),c.initialRetryTimer=setTimeout(()=>{sr(e+1)},1800)):ct("TMDB 推荐暂时无法加载，请检查凭据或网络后点击右上角刷新。","warn"):(d.dailyTitle.textContent="每日推荐尚未启用",d.dailyOverview.textContent="配置 TMDB 凭据后可启用每日推荐，也可以使用搜索和片库浏览电影与节目。",ct("尚未配置 TMDB 凭据，可在右上角设置中启用每日推荐；搜索和片库仍可使用。","info"))}catch(n){if(t!==c.initialLoadId)return;Fn("进入本机配置模式"),Oa(null),rt(d.personalizedRail,Ce(n)),rt(d.trendingRail,"配置 TMDB 后即可加载热门电影/节目。"),n?.code==="MISSING_TMDB_CREDENTIAL"||Ce(n).includes("credential")?ct("请先配置 TMDB API Key 或 Read Access Token，配置后会自动加载每日推荐。","warn"):ct(Ce(n),"error")}finally{t===c.initialLoadId&&qp()}}function wt(e){const t=e||c.credential,n=t?.proxy||c.proxy||{mode:"system",value:"system"};c.proxy=n,d.proxyInput&&(d.proxyInput.value=n.value||"system");const r=vt(t?.resources||c.resourceSettings||{});Yp(r,!0),Gp(r,!0),d.resourceModeSelect&&(d.resourceModeSelect.value=r.mode||"stable"),d.resourcePlaybackModeSelect&&(d.resourcePlaybackModeSelect.value=r.playbackMode||"auto");const o=n.mode==="system"?"系统代理":n.mode==="direct"?"直连":n.mode==="auto_detect"?"自动检测":n.value,a=[`内置 ${r.builtInSourceCount||0}`,`自定义 ${r.customSourceCount||0}`,`总计 ${r.sourceCount||0}`].join(" · ");t?.configured?d.settingsState.innerHTML=`当前已配置：<strong>${t.type==="readToken"?"Read Access Token":"API Key"}</strong> <span>${_(t.preview||"")}</span> <em>${_(t.source||"")}</em><br/>代理：<strong>${_(o||"system")}</strong><br/>介绍页资源：<strong>${_(r.label||"稳定优先")}</strong><br/>播放方式：<strong>${_(r.playbackLabel||"自动判断")}</strong><br/>资源源：<strong>${_(a)}</strong>`:d.settingsState.innerHTML=`当前未配置 TMDB 密钥。<br/>代理：<strong>${_(o||"system")}</strong><br/>介绍页资源：<strong>${_(r.label||"稳定优先")}</strong><br/>播放方式：<strong>${_(r.playbackLabel||"自动判断")}</strong><br/>资源源：<strong>${_(a)}</strong>`}function vt(e={}){const t={...c.resourceSettings,...e||{}};t.mode=t.mode||"stable",t.label=t.label||"稳定优先",t.description=t.description||"",t.enabled=t.enabled!==!1,t.playbackMode=yn(t.playbackMode),t.playbackModes=Array.isArray(t.playbackModes)&&t.playbackModes.length?t.playbackModes:[{value:"auto",label:"自动判断（推荐）",description:"直链优先，必要时回退本地代理。"},{value:"direct",label:"直连优先",description:"尽量不使用本地媒体代理。"},{value:"proxy",label:"本地代理优先",description:"始终通过本地媒体代理播放。"}];const n=t.playbackModes.find(r=>r.value===t.playbackMode);return t.playbackLabel=t.playbackLabel||n?.label||"自动判断（推荐）",t.playbackDescription=t.playbackDescription||n?.description||"",t.sources=Array.isArray(t.sources)?t.sources:[],t.sourceCount=Number(t.sourceCount||0),t.builtInSourceCount=Number(t.builtInSourceCount||0),t.customSourceCount=Number(t.customSourceCount||0),t.revision=Number(t.revision||0),c.resourceSettings=t,c.credential&&(c.credential.resources=t),t}function Yp(e=c.resourceSettings,t=!1){if(!d.resourceModeSelect||!t&&d.resourceModeSelect.dataset.synced==="1")return;const n=Array.isArray(e?.modes)?e.modes:[];if(!n.length)return;const r=e?.mode||d.resourceModeSelect.value||"stable";d.resourceModeSelect.innerHTML=n.map(o=>{const a=o.value==="stable"?"（推荐）":"";return`<option value="${_(o.value)}" title="${_(o.description||"")}">${_(o.label)}${a}</option>`}).join(""),d.resourceModeSelect.value=n.some(o=>o.value===r)?r:"stable",d.resourceModeSelect.dataset.synced="1"}function Gp(e=c.resourceSettings,t=!1){if(!d.resourcePlaybackModeSelect||!t&&d.resourcePlaybackModeSelect.dataset.synced==="1")return;const n=Array.isArray(e?.playbackModes)?e.playbackModes:[];if(!n.length)return;const r=e?.playbackMode||d.resourcePlaybackModeSelect.value||"auto";d.resourcePlaybackModeSelect.innerHTML=n.map(o=>`<option value="${_(o.value)}" title="${_(o.description||"")}">${_(o.label)}</option>`).join(""),d.resourcePlaybackModeSelect.value=n.some(o=>o.value===r)?r:"auto",d.resourcePlaybackModeSelect.dataset.synced="1"}function ps(e){const t=d.playbackProxySelect;if(!t||!e||t.dataset.synced==="1")return;const n=Array.isArray(e.modes)?e.modes:[];n.length&&(t.innerHTML=n.map(r=>`<option value="${_(r.value)}" title="${_(r.description||"")}">${_(r.label)}</option>`).join(""),t.value=n.some(r=>r.value===e.mode)?e.mode:"follow",t.dataset.synced="1")}async function Ha(){if(Y.getPlaybackProxyMode)try{const e=await Y.getPlaybackProxyMode();c.playbackProxyMode=e?.mode||"follow",d.playbackProxySelect&&(d.playbackProxySelect.dataset.synced="0"),ps(e)}catch{}}async function Xp(e){if(Y.savePlaybackProxyMode)try{const t=await Y.savePlaybackProxyMode(e);c.playbackProxyMode=t?.mode||e||"follow",ps(t||{mode:c.playbackProxyMode,modes:d.playbackProxySelect?[]:[]}),fe(`播放代理偏好已更新：${{follow:"跟随全局代理",proxy:"播放走代理",direct:"不走代理（DoH 直连）"}[c.playbackProxyMode]||c.playbackProxyMode}`)}catch{fe("保存播放代理偏好失败")}}Y.onPlaybackProxyState&&Y.onPlaybackProxyState(e=>{c.player?.open&&(e?.state==="down"?fe("检测到代理断开 · 播放已切换直连上行，保持不中断"):e?.state==="up"&&fe("代理连接已恢复 · 播放上行切回代理"))});function No(){d.detailPanel?.classList.contains("is-open")&&c.lastRenderedDetail&&Ps(c.lastRenderedDetail)}window.addEventListener("cineflow:resource-settings",e=>{vt(e.detail),wt(c.credential),No()});function Kp(){d.resourceModeSelect&&(d.resourceModeSelect.dataset.synced="0"),d.resourcePlaybackModeSelect&&(d.resourcePlaybackModeSelect.dataset.synced="0"),wt(c.credential),d.settingsModal.classList.remove("is-hidden"),d.settingsModal.setAttribute("aria-hidden","false"),setTimeout(()=>d.apiCredentialInput.focus(),50)}function en(){d.settingsModal.classList.add("is-hidden"),d.settingsModal.setAttribute("aria-hidden","true"),d.apiCredentialInput.type="password";const e=document.querySelector("#credentialVisibilityBtn");e&&(e.textContent="显示",e.setAttribute("aria-pressed","false"))}async function Jp(){try{const e=await Y.getResourceSettings?.();if(!e)return;vt(e),wt(c.credential)}catch{}}function Qp(){d.closeChoiceModal.classList.remove("is-hidden"),d.closeChoiceModal.setAttribute("aria-hidden","false")}function zn(){d.closeChoiceModal.classList.add("is-hidden"),d.closeChoiceModal.setAttribute("aria-hidden","true")}async function Zp(){const e=d.apiCredentialInput.value.trim(),t=d.proxyInput?.value.trim()||"system",n=d.resourceModeSelect?.value||c.resourceSettings?.mode||"stable",r=d.resourcePlaybackModeSelect?.value||c.resourceSettings?.playbackMode||"auto";d.saveSettingsBtn.disabled=!0,d.saveSettingsBtn.textContent="保存中...";try{e&&(c.credential=await Y.saveCredential(e),d.apiCredentialInput.value="");const o=await Y.saveProxy(t);c.credential=o,c.proxy=o.proxy,vt(await Y.saveResourceMode?.(n)||c.resourceSettings),vt(await Y.saveResourcePlaybackMode?.(r)||c.resourceSettings),wt(c.credential),No(),en(),fe("设置已保存"),await sr()}catch(o){fe(Ce(o))}finally{d.saveSettingsBtn.disabled=!1,d.saveSettingsBtn.textContent="保存并刷新"}}async function eh(){try{c.credential=await Y.clearCredential(),wt(c.credential),No(),fe("已清除本机密钥")}catch(e){fe(Ce(e))}}async function th(){const e=d.proxyInput?.value.trim()||"system";d.testConnectionBtn.disabled=!0,d.testConnectionBtn.textContent="测试中...";try{const t=await Y.saveProxy(e);c.credential=t,c.proxy=t.proxy,wt(t);const n=await Y.testConnection();fe(`TMDB 连接成功（${n.elapsedMs}ms，${n.resolvedProxy||"proxy ok"}）`)}catch(t){fe(Ce(t))}finally{d.testConnectionBtn.disabled=!1,d.testConnectionBtn.textContent="测试连接"}}function nh(){rh();let e=!1;const t=()=>{clearTimeout(c.searchTimer),c.activeSearchId+=1;for(const r of c.railStates.keys())String(r).startsWith("search:")&&c.railStates.delete(r);Ze(d.searchRail);const n=Or(d.globalSearch.value);if(d.clearSearchBtn.classList.toggle("is-visible",!!n),sn(),!e){if(!n){to({collapseIsland:!0});return}(c.windowMode==="island"||c.windowMode==="island-docked")&&(Y.expandIsland(330),Ke({mode:"island-expanded"})),c.searchTimer=setTimeout(()=>Ua(n),320)}};d.globalSearch.addEventListener("compositionstart",()=>{e=!0,t()}),d.globalSearch.addEventListener("compositionend",()=>{e=!1,t()}),d.globalSearch.addEventListener("input",t),d.searchMode?.addEventListener("change",()=>{no(),t()}),d.globalSearch.addEventListener("keydown",n=>{if(n.key==="Enter"&&!e&&!n.isComposing&&n.keyCode!==229){n.preventDefault(),clearTimeout(c.searchTimer);const r=Or(d.globalSearch.value);r&&Ua(r)}}),d.clearSearchBtn.addEventListener("click",()=>{d.globalSearch.value="",d.clearSearchBtn.classList.remove("is-visible"),to({collapseIsland:!0}),sn(),d.globalSearch.focus()})}function to(e={}){clearTimeout(c.searchTimer),c.searchTimer=null,c.activeSearchId+=1,d.searchSection.classList.add("is-hidden"),d.searchRail.innerHTML="",d.searchRail.classList.remove("is-expanded");for(const t of c.railStates.keys())String(t).startsWith("search:")&&c.railStates.delete(t);Ze(d.searchRail),d.searchMoreBtn&&(d.searchMoreBtn.classList.remove("is-expanded"),d.searchMoreBtn.disabled=!1,d.searchMoreBtn.textContent="加载更多",d.searchMoreBtn.title=""),e.collapseIsland&&c.windowMode==="island-expanded"&&(Y.enterIsland?.(72)?.catch?.(()=>{}),Ke({mode:"island"}))}function rh(){if(!d.globalSearch||d.globalSearch.dataset.rotating==="true")return;d.globalSearch.dataset.rotating="true";let e=0;no(),setInterval(()=>{document.activeElement===d.globalSearch||d.globalSearch.value.trim()||(e=(e+1)%Mo.length,no(e))},3600)}function no(e=0){const t=d.searchMode?.value||"title";d.globalSearch.placeholder=t==="recommend"?`${Mo[e]} 例如：下雨天 / 独处 / 放松`:t==="exact"?"输入完整片名，仅显示同名作品":"搜索电影、剧集或动漫，例如：绿皮书 / JOJO的奇妙冒险"}function oh(e){const t=String(e||"").toLowerCase(),n=[];for(const p of Qi){const h=[],w=p.patterns.reduce((m,y)=>{const g=y.toLowerCase();return!t.includes(g)||ah(t,g)?m:(h.push(y),m+(g.length>=2?2:1))},0);w>0&&n.push({...p,score:w,matchedPatterns:h})}if(!n.length)return null;n.sort((p,h)=>h.score-p.score);const r=n[0].score,o=n.filter(p=>p.score===r).slice(0,2),a=Zi.filter(p=>p.patterns.some(h=>t.includes(h.toLowerCase()))).flatMap(p=>p.genreIds),i=new Set(a),s=[...new Set(o.flatMap(p=>p.genreIds))].filter(p=>!i.has(p)).slice(0,6),l=o.flatMap(p=>p.genreGroups||[p.genreIds]).map(p=>p.filter(h=>s.includes(h)&&!i.has(h))).filter(p=>p.length).slice(0,4),u=[...new Set([...o.flatMap(p=>p.withoutGenreIds||[]),...a])].filter(p=>!s.includes(p)||a.includes(p)),f=Math.max(0,...o.map(p=>Number(p.minRating||0)));return{label:o.map(p=>p.label).join(" · "),genreIds:s,genreGroups:l,sortBy:n[0].sortBy||"popularity.desc",withoutGenreIds:u,minRating:f||void 0,matchedPatterns:[...new Set(o.flatMap(p=>p.matchedPatterns))]}}function ah(e,t){const n=e.indexOf(t);if(n<=0)return!1;const r=e.slice(Math.max(0,n-5),n);return/(不要|别|不想看|不想|不看|不喜欢|拒绝|不要太|不太|不|非|无|没)$/.test(r)}function ih(e=[]){return e.map(t=>c.genreMap.get(t)).filter(Boolean).slice(0,4).join(" · ")}function In(e=[]){const t=new Set;for(const n of e||[]){const r=Number(n);if(r){t.add(r);for(const o of Ep[r]||[])t.add(o)}}return[...t]}function Bo(e=[],t){if(!t)return e;const n=new Set(In(t.genreIds||[])),r=(t.genreGroups||[]).map(a=>new Set(In(a))),o=new Set(In(t.withoutGenreIds||[]));return Ue(e).map((a,i)=>{const s=In(a.genreIds||[]),l=s.filter(y=>n.has(y)).length,u=r.reduce((y,g)=>g.size?y+[...g].every(A=>s.includes(A)):y,0),f=s.filter(y=>o.has(y)).length,p=Math.min(Number(a.voteAverage||0),10),h=Math.min(Math.log10(Number(a.voteCount||0)+1),4),w=Math.min(Math.log10(Number(a.popularity||0)+1),3),m=u*18+l*10+p*1.5+h+w-f*30-i*.03;return{movie:a,score:m,preferredHits:l,groupHits:u,avoidedHits:f}}).filter(a=>a.preferredHits>0||!(t.genreIds||[]).length).filter(a=>a.avoidedHits===0).sort((a,i)=>i.score-a.score).map(a=>a.movie)}function sh(e){return e?Bo([...c.trending,...c.popular],e).slice(0,12):[]}async function hs(e,t=1){if(!e?.genreIds?.length)return[];const n=e.withoutGenreIds||[],o=(e.genreGroups?.length?e.genreGroups:[e.genreIds]).slice(0,3).map(i=>{const s=["mood",i.join(","),n.join(","),e.sortBy,e.minRating||"",t].join(":");return ln(s,()=>Y.discoverMovies({genreIds:i.join(","),withoutGenreIds:n.join(","),sortBy:e.sortBy,minVotes:60,minRating:e.minRating,page:t}))}),a=await Promise.allSettled(o);if(a.every(i=>i.status==="rejected"))throw a[0].reason;return Bo(a.flatMap(i=>i.status==="fulfilled"?i.value:[]),e)}function lh(e,t,n){const r=t?`${t.label}:${t.genreIds.join(",")}`:"text";return{moreButton:d.searchMoreBtn,stateKey:`search:${n}:${r}:${e}`,hasMore:n!=="exact",loadMore:n==="exact"?null:async o=>t?hs(t,o):Y.searchMovies(e,{page:o,enrich:n==="recommend",match:n})}}async function Ua(e){if(e=Or(e),!e)return to();const t=++c.activeSearchId,n=d.searchMode?.value||"title";if(n!=="recommend"&&tt)return rm(e,t,n);const r=n==="recommend"?oh(e):null,o=lh(e,r,n);d.searchSection.classList.remove("is-hidden"),d.searchTitle.textContent=r?`“${e}” 的氛围推荐`:`“${e}” 的${n==="exact"?"精确片名":"片名搜索"}结果`,d.searchHint.textContent=r?`正在匹配：${r.label}`:"搜索中...",Pt(d.searchRail,8);try{rs(e);let a=[];if(r){const u=sh(r);u.length&&(d.searchHint.textContent=`${r.label} · 先显示本地缓存，正在更新`,nt(d.searchRail,u,{empty:"正在继续搜索更多相关电影/节目...",...o}))}if(r?.genreIds?.length){if(an(r.genreIds,.7),a=await hs(r),t!==c.activeSearchId)return;a.length&&(d.searchHint.textContent=`${r.label} · ${ih(r.genreIds)}`,nt(d.searchRail,a,{empty:"正在继续搜索更多相关电影/节目...",...o}))}const i=r?[]:await ln(`title:${n}:${e}`,()=>Y.searchMovies(e,{enrich:n==="recommend",match:n}));if(t!==c.activeSearchId)return;const s=Bo(Ue([...a,...i]),r).slice(0,24);d.searchHint.textContent=`${s.length} 个结果`,nt(d.searchRail,s,{empty:n==="exact"?"没有找到同名作品，可切换“片名搜索”尝试别名或部分片名。":"没有找到相关电影/节目，试试换一个关键词。",...o});const l=Ue(s).flatMap(u=>u.genreIds||[]);an(l.slice(0,6),.15)}catch(a){if(t!==c.activeSearchId)return;d.searchHint.textContent="搜索失败",Ze(d.searchRail),rt(d.searchRail,`${Ce(a)}；按回车重试。`)}}async function cn(e,t){const n=xe(t),r=e,o=n;c.lastDetailMovieId=e,c.lastDetailMediaType=n,c.lastDetailFallback=t||c.lastDetailFallback,gn(),Do("open",{metricsSynced:!0}),d.detailPanel.classList.add("is-open"),d.detailPanel.setAttribute("aria-hidden","false"),_o(!0),d.detailContent.innerHTML=hh(t),Hn();try{const a=await ls(e,n);if(Ye(c.lastDetailMovieId,c.lastDetailMediaType)!==Ye(r,o))return;mh(a),Hn()}catch(a){if(Ye(c.lastDetailMovieId,c.lastDetailMediaType)!==Ye(r,o))return;d.detailContent.innerHTML=`<div class="empty-state">${_(Ce(a))}</div>`,Hn()}}function lr(){const e=d.detailPanel.classList.contains("is-open");c.activeResourceSearchId+=1,gn(),e?Do("close",{metricsSynced:!0}):d.detailPanel.classList.remove("is-rippling-open","is-rippling-close"),d.detailPanel.classList.remove("is-open"),d.detailPanel.setAttribute("aria-hidden","true"),_o(!1)}function Do(e="open",t={}){if(!d.detailPanel)return;t.metricsSynced||gn(),window.clearTimeout(Ra),d.detailPanel.classList.remove("is-rippling-open","is-rippling-close"),d.detailPanel.offsetWidth,d.detailPanel.classList.add(e==="close"?"is-rippling-close":"is-rippling-open");const n=e==="close"?640:780;Ra=window.setTimeout(()=>{d.detailPanel?.classList.remove("is-rippling-open","is-rippling-close")},n)}function gn(){if(!d.detailPanel)return;const e=d.detailPanel.getBoundingClientRect(),t=window.innerWidth||document.documentElement.clientWidth||1200,n=window.innerHeight||document.documentElement.clientHeight||760,r=Math.min(760,t*(t<=1120?.72:.62)),o=Math.max(320,Math.round(e.width||r)),a=Math.max(420,Math.round(e.height||n)),i=Math.ceil(Math.hypot(o,a/2)+Math.min(92,Math.max(48,o*.09))),s=Math.round(Math.min(56,Math.max(30,o*.065))),l=Math.round(Math.min(116,Math.max(62,o*.135))),u=o+l*2,f=(p,h)=>d.detailPanel.style.setProperty(p,`${Math.round(h)}px`);f("--detail-panel-width-px",o),f("--detail-panel-height-px",a),f("--detail-wave-radius",i),f("--detail-wave-radius-24",i*.24),f("--detail-wave-radius-48",i*.48),f("--detail-wave-radius-76",i*.76),f("--detail-edge-feather",s),f("--detail-crest-width",l),f("--detail-ripple-bg-width",o+l*2),f("--detail-ripple-bg-height",a+l*2),f("--detail-wave-travel",u),f("--detail-wave-travel-neg",-u)}function Hn(){d.detailContent&&(d.detailContent.scrollTop=0,d.detailContent.scrollLeft=0,d.detailContent.scrollTo?.({top:0,left:0,behavior:"auto"}),requestAnimationFrame(()=>{d.detailContent.scrollTop=0,d.detailContent.scrollLeft=0}))}function _o(e){if(!d.detailCloseBtn)return;const t=e?"收回":"拉出",n=e?"›":"‹",r=d.detailCloseBtn.querySelector("span"),o=d.detailCloseBtn.querySelector("em");r&&(r.textContent=n),o&&(o.textContent=t),d.detailCloseBtn.setAttribute("aria-label",`${t}${c.lastDetailMediaType==="tv"?"节目":"电影"}介绍页`)}function ch(){if(d.detailPanel.classList.contains("is-open")){lr();return}c.lastDetailMovieId&&c.detailsCache.has(Ye(c.lastDetailMovieId,c.lastDetailMediaType))?cn(c.lastDetailMovieId,c.lastDetailFallback||{id:c.lastDetailMovieId,mediaType:c.lastDetailMediaType}):fe("先选择一部电影或节目查看介绍")}function dh(e){if(!d.detailPanel.classList.contains("is-open"))return;const t=e.target;t instanceof Element&&(c.player.open||t.closest(".player-modal, .player-shell")||d.detailPanel.contains(t)||t.closest("button, a, input, textarea, .movie-card, .style-chip, .settings-card, .search-box, .window-controls")||lr())}function ms(){return!!d.favoritesPanel?.classList.contains("is-open")}function cr(){if(!d.favoritesCount)return;const e=(c.prefs.favorites||[]).length;d.favoritesCount.textContent=e>0?String(e):"",d.favoritesCount.hidden=e<=0}function dr(){if(!d.favoritesList)return;const e=c.prefs.favorites||[];if(!e.length){d.favoritesList.innerHTML='<div class="favorites-empty">还没有收藏。在影视介绍页点击“加入收藏”后，内容会出现在这里。</div>';return}d.favoritesList.innerHTML="";const t=document.createDocumentFragment();for(const n of e)t.appendChild(uh(n));d.favoritesList.appendChild(t)}function uh(e){const t=document.createElement("div");t.className="favorite-item",t.dataset.favoriteKey=ke(e);const n=Qe(e.posterPath,Ji),r=[To(e),e.mediaType==="tv"?"节目":"电影"].filter(Boolean).join(" · ");return t.innerHTML=`
    <div class="favorite-poster">
      ${n?`<img src="${n}" alt="${_(e.title)} 海报" loading="lazy" decoding="async" />`:'<div class="poster-fallback">无</div>'}
    </div>
    <div class="favorite-info">
      <h4>${_(e.title)}</h4>
      <p>${_(r)}</p>
    </div>
    <div class="favorite-actions">
      <button type="button" class="favorite-open ghost-button" title="查看介绍">查看</button>
      <button type="button" class="favorite-remove ghost-button" title="取消收藏" aria-label="取消收藏">×</button>
    </div>
  `,t}let Va=null;function gs(e="open"){if(!d.favoritesPanel)return;window.clearTimeout(Va),d.favoritesPanel.classList.remove("is-rippling-open","is-rippling-close"),d.favoritesPanel.offsetWidth,d.favoritesPanel.classList.add(e==="close"?"is-rippling-close":"is-rippling-open");const t=e==="close"?640:780;Va=window.setTimeout(()=>{d.favoritesPanel?.classList.remove("is-rippling-open","is-rippling-close")},t)}function fh(){d.favoritesPanel&&(dr(),gs("open"),d.favoritesPanel.classList.add("is-open"),d.favoritesPanel.setAttribute("aria-hidden","false"),d.favoritesBtn?.classList.add("is-active"))}function ro(){d.favoritesPanel&&(d.favoritesPanel.classList.contains("is-open")?gs("close"):d.favoritesPanel.classList.remove("is-rippling-open","is-rippling-close"),d.favoritesPanel.classList.remove("is-open"),d.favoritesPanel.setAttribute("aria-hidden","true"),d.favoritesBtn?.classList.remove("is-active"))}function ja(){if(ms()){ro();return}fh()}function ph(e){const t=e.target instanceof Element?e.target.closest(".favorite-item"):null;if(!t)return;const n=t.dataset.favoriteKey;if(e.target instanceof Element&&e.target.closest(".favorite-remove")){ss(n);return}if(e.target instanceof Element&&e.target.closest(".favorite-open")){const r=(c.prefs.favorites||[]).find(o=>ke(o)===n);r&&cn(r.id,r)}}function oo(){const e=d.detailContent?.querySelector("#detailFavoriteBtn");if(!e)return;const t=is({id:c.lastDetailMovieId,mediaType:c.lastDetailMediaType});e.classList.toggle("is-active",t),e.textContent=t?"已收藏":"加入收藏"}function hh(e){const t=ts(e);return`
    <div class="detail-hero skeleton-detail">
      <div class="detail-poster"></div>
      <div class="detail-info">
        <p class="eyebrow">${_(t)}</p>
        <h2>${_(e?.title||`加载${t}中...`)}</h2>
        <p></p>
        <p></p>
      </div>
    </div>
  `}function mh(e){const t=xe(e)==="tv";c.lastRenderedDetail=e;const n=Qe(e.posterPath,ko),r=Qe(e.backdropPath,$o),o=e.productionCountries?.map(l=>l.name).filter(Boolean).slice(0,2).join(" · "),a=e.spokenLanguages?.map(l=>l.name).filter(Boolean).slice(0,2).join(" · "),i=e.crew?.filter(l=>t?["Creator","Executive Producer","Director"].includes(l.job):l.job==="Director").map(l=>l.name).join(" / "),s=[e.releaseDate||(t?"未知首播日期":"未知上映日期"),e.runtime?`${t?"单集约 ":""}${e.runtime} 分钟`:"",t&&e.numberOfSeasons?`${e.numberOfSeasons} 季`:"",t&&e.numberOfEpisodes?`${e.numberOfEpisodes} 集`:"",o,a].filter(Boolean);d.detailContent.innerHTML=`
    <div class="detail-backdrop" style="${r?`background-image:url('${r}')`:""}"></div>
    <div class="detail-hero">
      <div class="detail-poster">
        ${n?`<img src="${n}" alt="${_(e.title)} 海报" decoding="async" />`:'<div class="poster-fallback">No Poster</div>'}
      </div>
      <div class="detail-info">
        <p class="eyebrow">${_(ts(e))}</p>
        <h2>${_(e.title)}</h2>
        ${e.originalTitle&&e.originalTitle!==e.title?`<h3>${_(e.originalTitle)}</h3>`:""}
        ${e.tagline?`<p class="tagline">${_(e.tagline)}</p>`:""}
        <div class="meta-row">
          <span>★ ${Lo(e)}</span>
          ${s.map(l=>`<span>${_(l)}</span>`).join("")}
        </div>
        <div class="genre-row">
          ${(e.genres||[]).map(l=>`<span>${_(l.name)}</span>`).join("")}
        </div>
        <p class="overview">${_(e.overview||"暂无简介。")}</p>
        <div class="detail-actions">
          <button id="detailLikeBtn" class="primary-button" type="button">加入偏好</button>
          <button id="detailFavoriteBtn" class="secondary-button detail-favorite-btn" type="button">加入收藏</button>
          ${e.homepage?'<button id="homepageBtn" class="secondary-button" type="button">打开官网</button>':""}
          ${e.videos?.[0]?'<button id="trailerBtn" class="secondary-button" type="button">预告片</button>':""}
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <section>
        <h4>主创</h4>
        <p>${_(i?`${t?"主创":"导演"}：${i}`:`${t?"主创":"导演"}信息暂无`)}</p>
        <p>${_((e.crew||[]).filter(l=>l.job!=="Director").map(l=>`${l.job}：${l.name}`).join(" · ")||"")}</p>
      </section>
      <section>
        <h4>主演</h4>
        <div class="cast-row">
          ${(e.cast||[]).map(l=>Hh(l)).join("")||"<p>演员信息暂无</p>"}
        </div>
      </section>
    </div>
    <section class="detail-recommendations">
      <h4>更多相似推荐</h4>
      <div id="detailRecommendations" class="movie-rail mini"></div>
    </section>
    <section id="detailResources" class="detail-resources">
      <div class="resource-header">
        <div>
          <h4>可用资源</h4>
          <p id="resourceStatus">准备轮询资源源...</p>
        </div>
        <span id="resourceModeBadge">${_(c.resourceSettings?.label||"稳定优先")}</span>
      </div>
      <div id="resourceResults" class="resource-results"></div>
    </section>
  `,d.detailContent.querySelector("#detailLikeBtn")?.addEventListener("click",()=>{os({id:e.id,title:e.title,mediaType:xe(e),genreIds:(e.genres||[]).map(l=>l.id)})}),d.detailContent.querySelector("#detailFavoriteBtn")?.addEventListener("click",()=>{Rp({id:e.id,mediaType:xe(e),title:e.title,posterPath:e.posterPath,releaseDate:e.releaseDate,voteAverage:e.voteAverage,genreIds:(e.genres||[]).map(l=>l.id)}),oo()}),oo(),d.detailContent.querySelector("#homepageBtn")?.addEventListener("click",()=>Y.openExternal(e.homepage)),d.detailContent.querySelector("#trailerBtn")?.addEventListener("click",()=>Y.openExternal(`https://www.youtube.com/watch?v=${e.videos[0].key}`)),nt(d.detailContent.querySelector("#detailRecommendations"),Ue([...e.recommendations||[],...e.similar||[]]).slice(0,10),{compact:!0,empty:"暂无相似推荐。"}),Ps(e)}function gh(e={}){return{id:e.id,mediaType:xe(e),title:e.title,originalTitle:e.originalTitle,releaseDate:e.releaseDate,year:(e.releaseDate||"").slice(0,4)}}function ys(e="",t=1){const n=String(e||""),r=n.match(/(?:第\s*)?(\d{1,4})\s*(?:集|话|話|期)?/);if(r)return Number(r[1]);const o=n.match(/第([一二三四五六七八九十百千万两]+)[集话話期]/);if(!o)return t;const a={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9},i=o[1];if(i==="十")return 10;if(i.includes("十")){const[s,l]=i.split("十");return(s&&a[s]||1)*10+(l&&a[l]||0)}return a[i]||t}function ao(e="",t=0){const n=ys(e,t+1);return/第.+[集话話期]/.test(String(e||""))?String(e||"").trim():`第 ${n} 集`}function io(e,t,n,r,o){const a=Array.isArray(t?.episodes)?t.episodes:[],i=`playlist-${++Qr}`,s=a.map((l,u)=>{const f=l.label||ao("",u),p=l.format||Ge(Pe(l.url));return{url:l.url,kind:l.kind||Pe(l.url),format:p,needsResolve:!!l.needsResolve,title:o,sourceName:r,lineName:t?.name||`线路 ${n+1}`,label:f,displayLabel:ao(f,u),episodeIndex:u,episodeNo:ys(f,u+1),total:a.length}});return c.resourcePlaylists.set(i,s),{playlistId:i,playlist:s}}function yh(e){const t=e.sourceName||"资源源",n=e.title||"未命名资源",o=(e.lines||[]).slice(0,3).map((m,y)=>{const g=m.name||"默认线路",{playlistId:A,playlist:R}=io(e,{...m,name:g},y,t,n),k=R.slice(0,e.isSeries?12:4),b=k.map(I=>{const T=I.label||"播放",x=I.format||Ge(Pe(I.url));return`
            <button
              class="resource-episode"
              type="button"
              data-play-url="${_(I.url)}"
              data-player-kind="${_(I.kind||Pe(I.url))}"
              data-player-format="${_(x)}"
              data-player-resolve="${I.needsResolve?"1":"0"}"
              data-player-playlist="${_(A)}"
              data-player-episode-index="${I.episodeIndex}"
              data-player-title="${_(n)}"
              data-player-source="${_(t)}"
              data-player-line="${_(g)}"
              data-player-label="${_(T)}"
            ><span class="resource-episode-label">${_(e.isSeries?I.displayLabel:T)}</span><span class="resource-format">${_(x)}</span></button>
          `}).join(""),$=R.length>k.length?`<span class="resource-line-more">播放器内显示全部 ${R.length} 集</span>`:"";return`
        <div class="resource-line">
          <span>${_(g)}${R.length>1?` · ${R.length} 集`:""}</span>
          <div>${b}${$}</div>
        </div>
      `}).join(""),a=(e.lines||[]).find(m=>Array.isArray(m.episodes)&&m.episodes.length)||{},i=a.episodes?.[0]||{},s=Math.max(0,(e.lines||[]).findIndex(m=>m===a)),{playlistId:l}=io(e,{...a,name:a.name||"默认线路"},s,t,n),u=i.label||"首个播放项",f=a.name||"默认线路",p=i.format||Ge(Pe(e.firstUrl)),h=Array.isArray(e.formats)&&e.formats.length?e.formats.join(" / "):"",w=e.isSeries?`电视剧集 · ${e.seasonEpisodeCount||e.episodeCount||1} 集`:e.remarks||e.type||e.year||"可播放";return`
    <article class="resource-card" data-source="${_(e.sourceKey)}" data-resource-kind="${_(i.kind||Pe(e.firstUrl))}">
      <div class="resource-card-head">
        <div>
          <strong>${_(t)}</strong>
          <h5>${_(n)}</h5>
        </div>
        <span>${_(w)}</span>
      </div>
      <p>${_([e.year,e.type,h,`${e.playGroupCount||1} 条线路`,e.isSeries?`${e.seasonEpisodeCount||e.episodeCount||1} 集/季`:`${e.episodeCount||1} 个播放项`].filter(Boolean).join(" · "))}</p>
      <div class="resource-lines">${o}</div>
      ${e.firstUrl?`
        <div class="resource-card-actions">
          <button
            class="primary-button resource-open"
            type="button"
            data-play-url="${_(e.firstUrl)}"
            data-player-kind="${_(i.kind||Pe(e.firstUrl))}"
            data-player-format="${_(p)}"
            data-player-resolve="${i.needsResolve?"1":"0"}"
            data-player-playlist="${_(l)}"
            data-player-episode-index="0"
            data-player-title="${_(n)}"
            data-player-source="${_(t)}"
            data-player-line="${_(f)}"
            data-player-label="${_(u)}"
          >${e.isSeries?`播放第 1 集 · 共 ${e.seasonEpisodeCount||1} 集`:`应用内播放 · ${_(p)}`}</button>
          <button class="secondary-button resource-external" type="button" data-external-url="${_(e.firstUrl)}">外部打开</button>
        </div>
      `:""}
    </article>
  `}function vh(e){!e||e.dataset.bound==="1"||(e.dataset.bound="1",e.addEventListener("click",t=>{const n=t.target instanceof Element?t.target:null,o=n?.closest("[data-external-url]")?.getAttribute("data-external-url");if(o){Y.openExternal(o);return}const a=n?.closest("[data-play-url]"),i=a?.getAttribute("data-play-url");i&&fr({url:i,kind:a.getAttribute("data-player-kind")||"",format:a.getAttribute("data-player-format")||"",needsResolve:a.getAttribute("data-player-resolve")==="1",playlistId:a.getAttribute("data-player-playlist")||"",episodeIndex:Number(a.getAttribute("data-player-episode-index")||0),title:a.getAttribute("data-player-title")||"",sourceName:a.getAttribute("data-player-source")||"",lineName:a.getAttribute("data-player-line")||"",label:a.getAttribute("data-player-label")||""})}),e.addEventListener("pointerover",t=>{const r=(t.target instanceof Element?t.target:null)?.closest(".resource-card");if(!r)return;const o=r.getAttribute("data-resource-kind")||"";(o==="hls"||o==="dash"||o==="flv")&&qo([o])},{passive:!0}))}function so(e){const t=String(e||"").trim();try{const n=new URL(t);return["http:","https:"].includes(n.protocol)?n.toString():""}catch{return""}}function bh(e){return/\.m3u8(?:$|[?#])/i.test(String(e||""))||/m3u8/i.test(String(e||""))}function wh(e){const t=String(e||"").toLowerCase();return/\.mpd(?:$|[?#])/i.test(t)||/(?:^|[?&#=/])(mpd|mpeg-dash|dash\+xml)(?:$|[?&#=/])/i.test(t)}function xh(e){return/\.flv(?:$|[?#])/i.test(String(e||""))}function Sh(e){return/\.(?:ts|m2ts|mts)(?:$|[?#])/i.test(String(e||""))}function kh(e){return/\.(?:mp4|m4v)(?:$|[?#])/i.test(String(e||""))}function $h(e){return/\.webm(?:$|[?#])/i.test(String(e||""))}function Mh(e){return/\.(?:ogv|ogg)(?:$|[?#])/i.test(String(e||""))}function Eh(e){return/\.(?:mov|mkv|avi|mpeg|mpg|3gp|f4v)(?:$|[?#])/i.test(String(e||""))}function Th(e){return/\/(?:share|play|player|embed|vodplay|video)\//i.test(String(e||""))}function Pe(e){return bh(e)?"hls":wh(e)?"dash":xh(e)?"flv":Sh(e)?"mpegts":kh(e)?"mp4":$h(e)?"webm":Mh(e)?"ogg":Eh(e)?"native-video":Th(e)?"page":"native"}function Ge(e="native"){switch(e){case"hls":return"HLS";case"dash":return"DASH";case"flv":return"FLV";case"mpegts":return"MPEG-TS";case"mp4":return"MP4";case"webm":return"WebM";case"ogg":return"OGG";case"page":return"网页解析";case"native-video":return"视频直连";default:return"原生媒体"}}function Lh(e,t){return so(e?.url)||t}function Ch(){return new Promise(e=>requestAnimationFrame(()=>e()))}function Ih(e){return window.setTimeout(e,0)}function ne(e,t={}){if(!d.playerStatus)return;const n=e||"",r=!!t.muted;d.playerStatus.textContent!==n&&(d.playerStatus.textContent=n),d.playerStatus.classList.contains("is-muted")!==r&&d.playerStatus.classList.toggle("is-muted",r)}function Me(e,t="正在加载",n="高清优先 · 全屏优化"){const r=!!e&&!tn(2400);if(d.playerStage?.classList.contains("is-loading")!==r&&d.playerStage?.classList.toggle("is-loading",r),d.playerLoader){const o=d.playerLoader.querySelector("strong"),a=d.playerLoader.querySelector("em");o&&o.textContent!==t&&(o.textContent=t),a&&a.textContent!==n&&(a.textContent=n)}}function Xe(e){window.dispatchEvent(new CustomEvent("cineflow:player-error",{detail:{message:e||""}})),d.playerStage?.classList.add("has-error"),d.playerError?.classList.remove("is-hidden");const t=d.playerError?.querySelector("span");t&&(t.textContent=e||"可尝试外部打开，或切换其它线路。"),Me(!1),ne("应用内播放失败 · 可外部打开或切换线路",{muted:!0})}function vs(){d.playerStage?.classList.remove("has-error"),d.playerError?.classList.add("is-hidden")}async function bs(){return Tt||(En||(En=uo(()=>import("./hls.light-B7xrY_9y.js"),[],import.meta.url).then(e=>(Tt=e.default||e,Tt)).finally(()=>{En=null})),En)}async function ws(){return Ut||(Tn||(Tn=uo(()=>import("./dash.all.min-JWr5UOmn.js"),[],import.meta.url).then(e=>(Ut=e.default||e,Ut)).finally(()=>{Tn=null})),Tn)}async function xs(){return Vt||(Ln||(Ln=uo(()=>import("./flv-B5MAThxB.js").then(e=>e.f),[],import.meta.url).then(e=>(Vt=e.default||e,Vt)).finally(()=>{Ln=null})),Ln)}function qo(e=[]){for(const t of e||[])(t==="hls"||t==="dash"||t==="flv")&&Cn.add(t);!Cn.size||Br||(Br=Ih(()=>{const t=new Set(Cn);Cn.clear(),Br=0,t.has("hls")&&bs().catch(()=>{}),t.has("dash")&&ws().catch(()=>{}),t.has("flv")&&xs().catch(()=>{})}))}function Ss(){if(se){try{se.destroy()}catch{}se=null}}function ks(){if(we){try{we.reset()}catch{}we=null}}function $s(){if(Be){try{Be.pause?.(),Be.unload?.(),Be.detachMediaElement?.(),Be.destroy?.()}catch{}Be=null}}function Ms(){window.clearTimeout(Jt),window.clearTimeout(Qt),window.clearTimeout(on),Jt=0,Qt=0,on=0,Qn=0,c.player&&(c.player.seeking=!1),c.player&&(c.player.proxyUrlPromise=null,c.player.transportFallbackUsed=!1,c.player.selection=null,c.player.transport="direct"),d.playerStage?.classList.remove("is-seeking"),d.playerShell?.classList.remove("has-episodes"),d.playerEpisodes?.classList.add("is-hidden"),d.playerEpisodeList&&(d.playerEpisodeList.innerHTML=""),d.playerEpisodesMeta&&(d.playerEpisodesMeta.textContent=""),Ss(),ks(),$s();const e=d.resourcePlayer;if(e)try{e.pause(),e.removeAttribute("src"),e.load()}catch{}}function Ph(){d.playerModal&&(window.clearTimeout(Jr),d.playerModal.classList.remove("is-hidden","is-closing"),document.body.classList.add("player-open"),requestAnimationFrame(()=>d.playerModal?.classList.add("is-open")))}function Un(){!d.playerModal||d.playerModal.classList.contains("is-hidden")||(c.player.open=!1,c.player.loadId+=1,Ms(),Me(!1),vs(),d.playerModal.classList.remove("is-open"),d.playerModal.classList.add("is-closing"),document.body.classList.remove("player-open"),window.clearTimeout(Jr),Jr=window.setTimeout(()=>{d.playerModal?.classList.add("is-hidden"),d.playerModal?.classList.remove("is-closing")},wp))}async function _r(e){const t=d.resourcePlayer;if(!(!t||e!==c.player.loadId||!c.player.open))try{await t.play(),Me(!1),ne("正在播放")}catch{Me(!1),ne("已就绪 · 点击播放")}}function Es(e){c.player.open&&(window.clearTimeout(on),c.player.seeking=!!e,d.playerStage?.classList.toggle("is-seeking",!!e),Qn=Date.now(),Me(!1),ne("定位中...",{muted:!0}))}function Vn(e=1200){window.clearTimeout(on),on=window.setTimeout(()=>{c.player.open&&(c.player.seeking=!1,d.playerStage?.classList.remove("is-seeking"))},e)}function tn(e=2400){return!!(c.player.seeking||Qn&&Date.now()-Qn<e)}function qr(){c.player.open&&Es(!0)}function kt(){!c.player.open||!c.player.seeking||Vn(1800)}function dn(){const e=d.resourcePlayer,t=document.fullscreenElement||document.webkitFullscreenElement;return!!(t&&(t===e||t===d.playerStage||t?.contains?.(e)))}function Ts(){const e=d.resourcePlayer;if(dn())return 2160;const n=e?.getBoundingClientRect()?.height||540,r=Math.min(Math.max(window.devicePixelRatio||1,1),2);return Math.min(1080,Math.max(720,Math.round(n*r*1.18)))}function Ah(){if(se?.config)try{se.config.maxBufferLength=96,se.config.maxMaxBufferLength=260,se.config.maxBufferSize=340*1e3*1e3,se.config.abrEwmaDefaultEstimate=Math.max(se.config.abrEwmaDefaultEstimate||0,18e6)}catch{}}function Rh(){if(we)try{we.updateSettings?.({streaming:{bufferTimeAtTopQuality:54,bufferTimeAtTopQualityLongForm:96,limitBitrateByPortal:!1,usePixelRatioInLimitBitrateByPortal:!0,abr:{initialBitrate:{video:12e3},maxBitrate:{video:-1}}}})}catch{}}function Nh(){window.clearTimeout(Jt),window.clearTimeout(Qt),Jt=0,Qt=0,!(!c.player.open||!dn())&&(requestAnimationFrame(()=>{c.player.open&&dn()&&ne("全屏就绪")}),Jt=window.setTimeout(()=>{Wa({aggressive:!1})},420),Qt=window.setTimeout(()=>{Wa({aggressive:!0})},1180))}function lo(e=[]){const t=Ts(),n=e.map((r,o)=>({index:Number.isFinite(Number(r?.qualityIndex))?Number(r.qualityIndex):o,height:Number(r?.height||0),width:Number(r?.width||0),bitrate:Number(r?.bitrate||r?.maxBitrate||0)})).filter(r=>r.height>0||r.bitrate>0).sort((r,o)=>o.height-r.height||o.bitrate-r.bitrate);return n.length?n.find(r=>r.height&&r.height<=t)||n[0]:null}function Ls(e,t={}){if(e!==c.player.loadId||!c.player.open||!se)return;const n=lo(se.levels||[]);if(!n)return;const r=!!t.fullscreen||dn()||Ts()>=2160;try{r&&Ah(),se.autoLevelCapping=n.index,t.aggressive?(se.nextLevel=n.index,se.nextLoadLevel=n.index):r||(se.nextLevel=n.index)}catch{}const o=n.height?`${n.height}P`:"高清";t.silent||ne(r&&n.height>=2e3?"4K 优先 · 就绪":`高清就绪 · ${o}`)}function Wa(e={}){if(!c.player.open||!dn())return;const t=c.player.loadId;if(se){Ls(t,{silent:!0,fullscreen:!0,aggressive:!!e.aggressive});const n=lo(se.levels||[]);e.aggressive&&ne(n?.height>=2e3?"全屏 4K 优先":"全屏高清已优化");return}if(we)try{Rh();const n=we.getBitrateInfoListFor?.("video")||[],r=lo(n),o=Number.isFinite(Number(r?.index))?Number(r.index):-1;e.aggressive&&o>=0&&we.setQualityFor?.("video",o,!1),e.aggressive&&ne(r?.height>=2e3?"全屏 4K 优先":"全屏高清已优化")}catch{}}async function Bh(e,t={}){if(e!==c.player.loadId||!c.player.open||!se)return;if(!t.fatal){ne("片源轻微波动，正在继续缓冲...",{muted:!0});return}c.player.recoveries+=1;const n=Tt?.ErrorTypes||{};if(c.player.recoveries<=2&&t.type===n.NETWORK_ERROR){ne("网络片段波动，正在快速重连...",{muted:!0}),se.startLoad();return}if(c.player.recoveries<=2&&t.type===n.MEDIA_ERROR){ne("媒体流解码波动，正在恢复播放...",{muted:!0}),se.recoverMediaError();return}await ur(e)||Xe("该线路的媒体流暂时不可用，建议切换其它播放项或外部打开。")}function Dh(){const e=Array.isArray(c.player.playlist)?c.player.playlist:[],t=e.length>1;if(d.playerEpisodes?.classList.toggle("is-hidden",!t),d.playerShell?.classList.toggle("has-episodes",t),!t){d.playerEpisodeList&&(d.playerEpisodeList.innerHTML=""),d.playerEpisodesMeta&&(d.playerEpisodesMeta.textContent="");return}const n=Math.max(0,Number(c.player.episodeIndex||0));d.playerEpisodesMeta&&(d.playerEpisodesMeta.textContent=`${n+1} / ${e.length} 集 · ${c.player.lineName||"默认线路"}`),d.playerEpisodeList&&(d.playerEpisodeList.innerHTML=e.map((r,o)=>{const a=r.displayLabel||ao(r.label,o),i=r.format||Ge(Pe(r.url));return`
          <button
            class="player-episode-button${o===n?" is-active":""}"
            type="button"
            data-player-episode-index="${o}"
            title="${_(r.label||a)}"
          >
            <span>${_(a)}</span>
            <em>${_(i)}</em>
          </button>
        `}).join(""),requestAnimationFrame(()=>{d.playerEpisodeList?.querySelector(".player-episode-button.is-active")?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})}))}function Cs(e){const t=Array.isArray(c.player.playlist)?c.player.playlist:[],n=Math.max(0,Math.min(t.length-1,Number(e||0))),r=t[n];r?.url&&fr({url:r.url,kind:r.kind,format:r.format,needsResolve:r.needsResolve,title:r.title||c.player.title,sourceName:r.sourceName||c.player.sourceName,lineName:r.lineName||c.player.lineName,label:r.label||`第 ${n+1} 集`,playlistId:c.player.playlistId,playlist:t,episodeIndex:n,playbackMode:c.player.playbackMode,vod:c.player.vod,live:c.player.live})}function yn(e="auto"){const t=String(e||"").trim().toLowerCase();return["auto","direct","proxy"].includes(t)?t:"auto"}function _h(e,t){return yn(t)==="proxy"}function qh(e,t){return yn(t)==="auto"&&["hls","dash","flv","mp4","webm","ogg","mpegts","native","native-video"].includes(e)}async function Is(e,t,n){const r=d.resourcePlayer;if(!r||e!==c.player.loadId||!c.player.open)return!1;r.preload=t==="hls"||t==="dash"?"metadata":"auto",r.crossOrigin=c.player.transport==="proxy"||["hls","dash","flv"].includes(t)?"anonymous":"",r.disableRemotePlayback=!0,r.playsInline=!0;try{if(t==="hls"){ne(c.player.transport==="proxy"?"HLS 加载中（代理）...":"HLS 加载中...");const o=await(se?Promise.resolve(Tt):bs());if(e!==c.player.loadId||!c.player.open)return!1;if(o?.isSupported())return ne("HLS 解析中..."),se=new o({enableWorker:!0,lowLatencyMode:!1,capLevelToPlayerSize:!1,ignoreDevicePixelRatio:!1,backBufferLength:18,maxBufferLength:24,maxMaxBufferLength:64,maxBufferSize:96*1e3*1e3,startFragPrefetch:!0,abrEwmaFastVoD:3,abrEwmaSlowVoD:9,abrEwmaDefaultEstimate:12e6,abrBandWidthFactor:.92,abrBandWidthUpFactor:.88,maxStarvationDelay:3,maxLoadingDelay:3,maxBufferHole:.28,maxFragLookUpTolerance:.18,nudgeOffset:.05,highBufferWatchdogPeriod:1.2,nudgeMaxRetry:3,manifestLoadingTimeOut:8500,levelLoadingTimeOut:8500,fragLoadingTimeOut:18e3,pLoader:Ys(o)||o.DefaultConfig?.pLoader}),se.on(o.Events.ERROR,(a,i)=>{Bh(e,i).catch(()=>{})}),se.on(o.Events.MANIFEST_PARSED,()=>{Ls(e),_r(e)}),se.attachMedia(r),se.loadSource(n),!0}if(t==="dash"){ne(c.player.transport==="proxy"?"DASH 加载中（代理）...":"DASH 加载中...");const o=await(we?Promise.resolve(Ut):ws());if(e!==c.player.loadId||!c.player.open)return!1;const a=o?.MediaPlayer;if(typeof a=="function"){ne("DASH 解析中..."),we=a().create();try{we.updateSettings?.({streaming:{lowLatencyEnabled:!1,stableBufferTime:8,stableBufferTimeFastSwitch:5,bufferTimeAtTopQuality:16,bufferTimeAtTopQualityLongForm:24,jumpGaps:!0,fastSwitchEnabled:!0,limitBitrateByPortal:!1,usePixelRatioInLimitBitrateByPortal:!0,abr:{useDefaultABRRules:!0,ABRStrategy:"abrDynamic",initialBitrate:{video:8e3},maxBitrate:{video:-1}}}})}catch{}return we.on?.("manifestLoaded",()=>ne("DASH 已加载")),we.on?.("streamInitialized",()=>ne("DASH 就绪")),we.on?.("playbackPlaying",()=>{Me(!1),ne("正在播放 · DASH")}),we.on?.("playbackWaiting",()=>{if(tn()){Me(!1),ne("定位中...",{muted:!0});return}Me(!0,"缓冲中","网络波动"),ne("缓冲中...",{muted:!0})}),we.on?.("error",()=>Ya(e,"DASH 资源暂时无法解析，可切换其它线路或外部打开。")),we.initialize(r,n,!0),!0}}if(t==="flv"){ne(c.player.transport==="proxy"?"FLV 加载中（代理）...":"FLV 加载中...");const o=await(Be?Promise.resolve(Vt):xs());if(e!==c.player.loadId||!c.player.open)return!1;if(o?.isSupported?.())return ne("FLV 解析中..."),Be=o.createPlayer({type:"flv",isLive:!!c.player.live,hasAudio:!0,hasVideo:!0,url:n},{enableWorker:!1,enableStashBuffer:!c.player.live,stashInitialSize:1024*320,lazyLoad:!c.player.live,lazyLoadMaxDuration:150,reuseRedirectedURL:!0,autoCleanupSourceBuffer:!0,autoCleanupMaxBackwardDuration:96,autoCleanupMinBackwardDuration:24}),Be.on?.(o.Events?.ERROR||"error",()=>Ya(e,"FLV 资源暂时无法解析，可切换其它线路或外部打开。")),Be.attachMediaElement(r),Be.load(),await _r(e),!0}return r.src=n,r.load(),ne(t==="mpegts"?"MPEG-TS 加载中...":`${Ge(t)} 加载中...`),await _r(e),!0}catch{return ne("播放地址暂时不可用，正在检查备用传输...",{muted:!0}),!1}}function Ya(e,t){Promise.resolve(ur(e)).then(n=>{n||Xe(t)}).catch(()=>Xe(t))}async function ur(e){const t=yn(c.player.playbackMode||c.resourceSettings?.playbackMode||"auto");if(!qh(c.player.kind,t)||c.player.transport!=="direct"||c.player.transportFallbackUsed||!c.player.selection||e!==c.player.loadId||!c.player.open)return!1;c.player.transportFallbackUsed=!0,c.player.transport="proxy",Me(!0,"切换代理中","兼容性优先"),ne("直连失败，正在切换本地代理...",{muted:!0});let n=c.player.proxiedUrl;const r=c.player.proxyUrlPromise;if(r&&typeof r.then=="function")try{n=await r||n}catch{}if(!n||n===c.player.url)try{n=await Y.getMediaProxyUrl?.(c.player.url)||c.player.url}catch{n=c.player.url}return e!==c.player.loadId||!c.player.open?!1:!n||n===c.player.url?(c.player.transport="direct",c.player.transportFallbackUsed=!1,Xe("直连播放失败，当前资源也无法通过本地代理加速。可尝试外部打开或切换其它线路。"),!1):(c.player.proxiedUrl=n,Ss(),ks(),$s(),Is(e,c.player.kind,n))}async function fr(e={}){const t=e.playlistId||"",n=Array.isArray(e.playlist)?e.playlist:t?c.resourcePlaylists.get(t)||[]:[],r=Math.max(0,Math.min(Math.max(n.length-1,0),Number(e.episodeIndex||0))),o=n[r]||null,a=o?.url||e.url,i=so(a);if(!i){fe("播放地址不可用");return}const s=c.player.loadId+1,l=o?.kind||e.kind||Pe(i),u=o?.format||e.format||Ge(l),f=o?.needsResolve===!0||o?.needsResolve==="1"||e.needsResolve===!0||e.needsResolve==="1"||l==="page",p=yn(e.playbackMode||c.player.playbackMode||c.resourceSettings?.playbackMode||"auto");Ms(),c.player={open:!0,url:i,originalUrl:i,resolvedUrl:"",proxiedUrl:"",kind:l,format:u,title:o?.title||e.title||"影视资源",sourceName:o?.sourceName||e.sourceName||"资源源",lineName:o?.lineName||e.lineName||"默认线路",label:o?.label||e.label||"播放项",playlistId:t,playlist:n,episodeIndex:r,playbackMode:p,transport:_h(l,p)?"proxy":"direct",transportFallbackUsed:!1,selection:o||{url:i},proxyUrlPromise:null,recoveries:0,loadId:s,seeking:!1,vod:e.vod||null,live:!!e.live},(c.playbackProxyMode==="proxy"||c.playbackProxyMode==="direct")&&(c.player.transport="proxy"),vs(),Ph(),d.playerTitle&&(d.playerTitle.textContent=c.player.title||"影视资源"),d.playerSource&&(d.playerSource.textContent=c.player.sourceName||"CineFlow Player"),d.playerMeta&&(d.playerMeta.textContent=[c.player.lineName,c.player.label,u].filter(Boolean).join(" · ")||"应用内极速播放"),Dh(),Me(!0,"正在加载",c.player.transport==="proxy"?"本地代理兼容优先":"直连优先"),ne(f?"解析播放页...":"准备播放...");const h=["hls","dash","flv"].includes(l)&&p==="auto",w=f&&Y.resolveMediaUrl?Y.resolveMediaUrl(i).catch(()=>null):Promise.resolve(null);if(h&&qo([l]),await Ch(),s!==c.player.loadId||!c.player.open)return;let m=l,y=i,g=null;if(f)try{if(g=await w,s!==c.player.loadId||!c.player.open)return;if(y=Lh(g,i),m=g?.kind||Pe(y),d.playerMeta){const x=g?.resolved?`${u} → ${g.format||Ge(m)}`:g?.format||u||Ge(m);d.playerMeta.textContent=[c.player.lineName,c.player.label,x].filter(Boolean).join(" · ")}ne(g?.resolved?`${g.format||Ge(m)} · 已解析`:"解析完成")}catch{y=i,m=Pe(i),ne("尝试直连...",{muted:!0})}const A=c.player.transport,R=["hls","dash","flv"].includes(m)&&p==="auto",k=A==="proxy"&&Y.getMediaProxyUrl?Y.getMediaProxyUrl(y).catch(()=>y):R&&Y.getMediaProxyUrl?Y.getMediaProxyUrl(y).then(x=>{const P=so(x);return P&&P!==y?P:""}).catch(()=>""):Promise.resolve("");if(m==="page"){Xe("该网页播放页暂时没有提取到真实视频地址，可外部打开或切换同资源下的 m3u8 / MP4 线路。");return}c.player.url=y,c.player.resolvedUrl=g?.resolved?y:"",c.player.kind=m,c.player.selection=o||{url:y};let b=y;if(A==="proxy"?b=await k:R&&(c.player.proxyUrlPromise=k),s!==c.player.loadId||!c.player.open)return;c.player.proxiedUrl=b;const I=d.resourcePlayer;if(!I)return;I.removeAttribute("src"),I.load();const T=await Is(s,m,b);!T&&c.player.transport==="direct"?await ur(s)||Xe("该播放地址暂时无法播放，可尝试外部打开或切换其它线路。"):T||Xe("该播放地址暂时无法被播放器识别，可尝试外部打开或切换线路。")}async function Oh(){const e=c.player.url;if(e){try{await navigator.clipboard.writeText(e)}catch{const t=document.createElement("textarea");t.value=e,t.setAttribute("readonly","true"),t.style.position="fixed",t.style.left="-9999px",document.body.appendChild(t),t.select(),document.execCommand("copy"),t.remove()}fe("播放链接已复制")}}function Fh(){d.playerModal?.addEventListener("click",t=>{t.target===d.playerModal&&Un()}),d.playerCloseBtn?.addEventListener("click",Un),d.playerStopBtn?.addEventListener("click",Un),d.playerExternalBtn?.addEventListener("click",()=>{const t=c.player.originalUrl||c.player.url;t&&Y.openExternal(t)}),d.playerCopyBtn?.addEventListener("click",Oh),d.playerEpisodeList?.addEventListener("click",t=>{const r=(t.target instanceof Element?t.target:null)?.closest("[data-player-episode-index]");if(!r)return;const o=Number(r.getAttribute("data-player-episode-index")||0);Number(c.player.episodeIndex||0)!==o&&Cs(o)}),d.resourcePlayer?.addEventListener("pointerdown",qr,{capture:!0,passive:!0}),d.resourcePlayer?.addEventListener("mousedown",qr,{capture:!0,passive:!0}),d.resourcePlayer?.addEventListener("touchstart",qr,{capture:!0,passive:!0}),d.resourcePlayer?.addEventListener("pointerup",kt,{capture:!0,passive:!0}),d.resourcePlayer?.addEventListener("pointercancel",kt,{capture:!0,passive:!0}),d.resourcePlayer?.addEventListener("mouseup",kt,{capture:!0,passive:!0}),d.resourcePlayer?.addEventListener("touchend",kt,{capture:!0,passive:!0}),document.addEventListener("pointerup",kt,{passive:!0}),document.addEventListener("mouseup",kt,{passive:!0}),d.resourcePlayer?.addEventListener("loadstart",()=>{c.player.open&&(tn()||Me(!0,"正在加载","高清优先"))}),d.resourcePlayer?.addEventListener("loadedmetadata",()=>{c.player.open&&ne("媒体就绪")}),d.resourcePlayer?.addEventListener("playing",()=>{c.player.open&&(Vn(420),Me(!1),ne("正在播放"))}),d.resourcePlayer?.addEventListener("waiting",()=>{if(c.player.open){if(tn()){Me(!1),ne("定位中...",{muted:!0});return}Me(!0,"缓冲中","网络波动"),ne("缓冲中...",{muted:!0})}}),d.resourcePlayer?.addEventListener("seeking",()=>{c.player.open&&Es(!0)}),d.resourcePlayer?.addEventListener("seeked",()=>{c.player.open&&(Me(!1),ne("定位完成",{muted:!0}),Vn(1600))}),d.resourcePlayer?.addEventListener("canplay",()=>{c.player.open&&tn()&&Vn(900)}),d.resourcePlayer?.addEventListener("error",()=>{c.player.open&&Promise.resolve(ur(c.player.loadId)).then(t=>{t||Xe("视频元素无法读取该资源，建议外部打开或切换其它线路。")}).catch(()=>{Xe("视频元素无法读取该资源，建议外部打开或切换其它线路。")})});const e=()=>{c.player.open&&Nh()};document.addEventListener("fullscreenchange",e),document.addEventListener("webkitfullscreenchange",e),window.addEventListener("resize",e,{passive:!0})}function zh(e=[]){const t=new Set;for(const n of e||[]){for(const o of n.lines||[])for(const a of o.episodes||[]){const i=Pe(a.url);(i==="hls"||i==="dash"||i==="flv")&&t.add(i)}const r=Pe(n.firstUrl);(r==="hls"||r==="dash"||r==="flv")&&t.add(r)}t.size&&qo(t)}function Fe(e,t,n={}){const r=e?.querySelector("#resourceStatus");r&&(r.textContent=t,r.classList.toggle("is-muted",!!n.muted))}async function Ps(e){if(tt)return sm(e);c.lastRenderedDetail=e;const t=d.detailContent.querySelector("#detailResources"),n=d.detailContent.querySelector("#resourceResults");if(!t||!n)return;const r=++c.activeResourceSearchId;c.resourcePlaylists.clear(),Qr=0;const o=c.resourceSettings||{enabled:!0,label:"稳定优先"};if(t.querySelector("#resourceModeBadge").textContent=o.label||"稳定优先",vh(n),!o.enabled){Fe(t,"资源查找已在设置中关闭。",{muted:!0}),n.innerHTML="";return}n.innerHTML='<div class="resource-pulse">正在轮询资源源，只会显示已找到的可用资源...</div>',Fe(t,"正在轮询资源源...");const a=new Set;let i=0,s=0,l=0,u=0,f=Number(c.resourceSettings?.revision||0);const p=gh(e);try{for(;r===c.activeResourceSearchId;){const h=await Y.findMovieResources?.(p,{cursor:i,limit:3});if(r!==c.activeResourceSearchId||!h)return;const w=Number(h.revision||0);if(w&&w!==f){f=w,a.clear(),i=0,s=0,l=0,u=0,c.resourcePlaylists.clear(),Qr=0,n.innerHTML='<div class="resource-pulse">资源配置已更新，正在重新轮询资源源...</div>',Fe(t,"资源配置已更新，正在重新轮询资源源...");continue}l=h.total||l,u=h.checked||u,vt({mode:h.mode,label:h.label,description:h.description,enabled:h.enabled,playbackMode:h.playbackMode||c.resourceSettings.playbackMode||"auto",playbackLabel:h.playbackLabel||c.resourceSettings.playbackLabel||"自动判断（推荐）",playbackDescription:h.playbackDescription||c.resourceSettings.playbackDescription||"",playbackModes:h.playbackModes||c.resourceSettings.playbackModes||[],sources:h.sources||c.resourceSettings.sources||[],sourceCount:h.sourceCount??c.resourceSettings.sourceCount??0,builtInSourceCount:h.builtInSourceCount??c.resourceSettings.builtInSourceCount??0,customSourceCount:h.customSourceCount??c.resourceSettings.customSourceCount??0,revision:h.revision??c.resourceSettings.revision??0}),t.querySelector("#resourceModeBadge").textContent=h.label||o.label||"稳定优先";const m=[];for(const y of h.resources||[]){const g=`${y.sourceKey}:${y.title}:${y.firstUrl}`;a.has(g)||(a.add(g),s+=1,m.push(yh(y)))}if(m.length){s===m.length&&(n.innerHTML=""),n.insertAdjacentHTML("beforeend",m.join(""));const y=Array.from(n.querySelectorAll(".resource-card")).slice(-m.length);Po(y,{limit:8}),zh(h.resources||[])}if(Fe(t,h.done?`轮询完成 · 已检查 ${u}/${l} 个来源 · 找到 ${s} 个可用资源`:`正在轮询 · 已检查 ${u}/${l||"?"} 个来源 · 找到 ${s} 个可用资源`),h.done||s>=8)break;i=h.nextCursor||u,await new Promise(y=>window.setTimeout(y,90))}if(r!==c.activeResourceSearchId)return;s||(n.innerHTML='<div class="resource-empty">暂未发现可用资源，可在设置中切换资源查找范围。</div>',Fe(t,l?`轮询完成 · 已检查 ${u}/${l} 个来源`:"暂无可轮询的资源来源",{muted:!0}))}catch(h){if(r!==c.activeResourceSearchId)return;n.innerHTML='<div class="resource-empty">资源轮询暂时不可用，稍后可重新打开介绍页再试。</div>',Fe(t,Ce(h),{muted:!0})}}function Hh(e){const t=Qe(e.profilePath,mp);return`
    <article class="cast-card">
      ${t?`<img src="${t}" alt="${_(e.name)}" loading="lazy" decoding="async" />`:'<div class="avatar-fallback">★</div>'}
      <strong>${_(e.name)}</strong>
      <span>${_(e.character||"")}</span>
    </article>
  `}function Ce(e){const t=e?.message||String(e||"未知错误");return e?.code==="MISSING_TMDB_CREDENTIAL"||t.includes("credential")?"缺少 TMDB 密钥，请点击右上角设置后粘贴 API Key 或 Read Access Token。":e?.code==="TMDB_AUTH_FAILED"||/401|Invalid API key|auth/i.test(t)?"TMDB 密钥验证失败，请检查 API Key 或 Read Access Token。":/fetch failed|network|ENOTFOUND|ECONN/i.test(t)?"网络连接失败，请稍后重试。":(/ERR_CONNECTION_TIMED_OUT|ERR_PROXY|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED/i.test(t),t)}function Ke(e={}){const t=e.mode||"normal",n=c.windowMode;c.windowMode=t;for(const r of[document.documentElement,document.body]){r.classList.toggle("island-mode",t==="island"),r.classList.toggle("island-expanded-mode",t==="island-expanded"),r.classList.toggle("island-docked-mode",t==="island-docked"),r.classList.toggle("normal-mode",t==="normal");for(const o of["left","right","top","bottom"])r.classList.toggle(`dock-edge-${o}`,t==="island-docked"&&e.edge===o)}c.dockEdge=t==="island-docked"?e.edge:null,d.islandDockHandle&&t==="island-docked"&&d.islandDockHandle.setAttribute("aria-label",`${e.edge||""}边缘拉出灵动岛`),t==="normal"&&d.globalSearch.blur(),t==="island-expanded"&&n!=="island-expanded"&&(d.searchSection.classList.remove("is-hidden"),d.globalSearch.value.trim()||(d.searchTitle.textContent="灵动搜索",d.searchHint.textContent="输入片名 / 节目名，或切换智能推荐",rt(d.searchRail,"输入片名查找作品；心情、天气或演员请使用智能推荐。"))),(t==="island"||t==="island-expanded"||t==="island-docked")&&(lr(),en(),zn(),t!=="island-docked"&&setTimeout(()=>d.globalSearch.focus(),180)),t!=="island"&&t!=="island-expanded"&&t!=="island-docked"&&As(),sn({mode:t})}function Uh(){d.appShell?.addEventListener("scroll",()=>{c.windowMode!=="island-expanded"||c.islandAutoRestoreFrame||(c.islandAutoRestoreFrame=requestAnimationFrame(()=>{if(c.islandAutoRestoreFrame=0,c.windowMode!=="island-expanded")return;d.appShell.scrollHeight-d.appShell.scrollTop-d.appShell.clientHeight<80&&us()}))},{passive:!0})}function Vh(e){return e.button===0||e.button===void 0}function pr(e){const t=Number(e?.screenX??c.islandPointer.lastX??c.islandPointer.startX??0),n=Number(e?.screenY??c.islandPointer.lastY??c.islandPointer.startY??0);return{screenX:Math.round(Number.isFinite(t)?t:0),screenY:Math.round(Number.isFinite(n)?n:0)}}function jh(e){if(!["island","island-expanded","island-docked"].includes(c.windowMode)||!Vh(e))return!1;const t=e.target;return t instanceof Element?c.windowMode==="island-docked"?!!t.closest("#islandDockHandle"):t.closest("button")?!1:!!t.closest(".titlebar, .search-box"):!1}function Wh(e){jh(e)&&(c.islandPointer.down=!0,c.islandPointer.moved=!1,c.islandPointer.startX=e.screenX,c.islandPointer.startY=e.screenY,c.islandPointer.lastX=e.screenX,c.islandPointer.lastY=e.screenY,c.islandPointer.source=c.windowMode,c.islandPointer.fromInput=!!(e.target instanceof Element&&e.target.closest("input")),e.target?.setPointerCapture?.(e.pointerId),document.body.classList.add("is-island-dragging"),Y.islandDragBegin?.(pr(e)),c.islandPointer.fromInput||(e.preventDefault(),e.stopPropagation()))}function Yh(e){if(!c.islandPointer.down||!["island","island-expanded","island-docked"].includes(c.windowMode))return;c.islandPointer.lastX=e.screenX,c.islandPointer.lastY=e.screenY;const t=e.screenX-c.islandPointer.startX,n=e.screenY-c.islandPointer.startY;if(Math.hypot(t,n)>4&&(c.islandPointer.moved=!0),!c.islandPointer.moved){c.islandPointer.fromInput||(e.preventDefault(),e.stopPropagation());return}c.islandDragMoveFrame||(c.islandDragMoveFrame=requestAnimationFrame(()=>{c.islandDragMoveFrame=0,Y.islandDragMove?.(pr())})),e.preventDefault(),e.stopPropagation()}async function Gh(e){if(!c.islandPointer.down)return;const t=pr(e),n=c.islandPointer.moved,r=c.islandPointer.source,o=c.islandPointer.fromInput;let a=!1;if(c.islandDragMoveFrame&&(cancelAnimationFrame(c.islandDragMoveFrame),c.islandDragMoveFrame=0,Y.islandDragMove?.(t),a=!0),e.target?.releasePointerCapture?.(e.pointerId),c.islandPointer.down=!1,c.islandPointer.moved=!1,c.islandPointer.lastX=t.screenX,c.islandPointer.lastY=t.screenY,c.islandPointer.source=null,c.islandPointer.fromInput=!1,document.body.classList.remove("is-island-dragging"),(n||!o)&&(e.preventDefault(),e.stopPropagation()),!n&&r==="island-docked"){await Y.enterIsland(72),Ke({mode:"island"});return}if(!n){await Y.islandDragEnd?.(!1,t);return}a||Y.islandDragMove?.(t);const i=await Y.islandDragEnd?.(!0,t);i?.mode==="island-docked"&&Ke({mode:"island-docked",edge:i.edge})}function As(){c.islandPointer.down&&(c.islandDragMoveFrame&&(cancelAnimationFrame(c.islandDragMoveFrame),c.islandDragMoveFrame=0),c.islandPointer.down=!1,c.islandPointer.moved=!1,c.islandPointer.source=null,c.islandPointer.fromInput=!1,document.body.classList.remove("is-island-dragging"),Y.islandDragEnd?.(!1,pr()).then(e=>{e?.mode==="island-docked"&&Ke({mode:"island-docked",edge:e.edge})}).catch(()=>{}))}function Xh(){document.addEventListener("pointerdown",Wh,{capture:!0}),document.addEventListener("pointermove",Yh,{capture:!0}),document.addEventListener("pointerup",Gh,{capture:!0}),document.addEventListener("pointercancel",As,{capture:!0})}function jn(){return c.windowMode==="island-expanded"&&d.searchSection&&!d.searchSection.classList.contains("is-hidden")}function Kh(){d.islandRestoreBtn?.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Zt({focusInputRecommendations:jn()})}),d.searchBox?.addEventListener("dblclick",e=>{if(!Ao())return;const t=e.target;t instanceof Element&&t.closest("button, input")||Zt({focusInputRecommendations:jn()})}),d.islandDockHandle?.addEventListener("dblclick",e=>{e.preventDefault(),e.stopPropagation(),Zt({focusInputRecommendations:jn()})})}function _(e){return Lp(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function Pn(e){return e instanceof Element?e.closest(".movie-card"):null}function An(e){const t=e?.dataset?.contentKey||(e?.dataset?.movieId?ke(e.dataset.movieId,e.dataset.mediaType||"movie"):"");return t?c.cardMovies.get(String(t)):null}function Jh(){document.documentElement.dataset.movieCardDelegation!=="true"&&(document.documentElement.dataset.movieCardDelegation="true",document.addEventListener("click",e=>{const t=Pn(e.target);if(!t)return;const n=An(t);n&&(Na(n),cn(n.id,n))}),document.addEventListener("mouseover",e=>{const t=Pn(e.target),n=e.relatedTarget;if(!t||n instanceof Node&&t.contains(n))return;const r=An(t);r&&Ba(r.id,xe(r))},{passive:!0}),document.addEventListener("focusin",e=>{const t=Pn(e.target),n=An(t);n&&Ba(n.id,xe(n))}),document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=Pn(e.target),n=An(t);n&&(e.preventDefault(),Na(n),cn(n.id,n))}))}function Lt(e=Oe){e&&(e.classList.remove("is-pointer-lit"),e.style.removeProperty("--cf-pointer-x"),e.style.removeProperty("--cf-pointer-y"),e.style.removeProperty("--cf-card-tilt-x"),e.style.removeProperty("--cf-card-tilt-y"),e.style.removeProperty("--cf-sheen-x"),e.style.removeProperty("--cf-sheen-y"),e===Oe&&(Oe=null,Eo=null))}function Qh(){Zr=0;const e=Oe,t=Eo;!e||!t||(e.classList.add("is-pointer-lit"),e.style.setProperty("--cf-pointer-x",`${t.x}%`),e.style.setProperty("--cf-pointer-y",`${t.y}%`),e.style.setProperty("--cf-card-tilt-x",`${t.tiltX}deg`),e.style.setProperty("--cf-card-tilt-y",`${t.tiltY}deg`),e.style.setProperty("--cf-sheen-x",`${t.sheenX}%`),e.style.setProperty("--cf-sheen-y",`${t.sheenY}%`))}function Zh(){if(document.documentElement.dataset.premiumPointerMotion==="true"||(document.documentElement.dataset.premiumPointerMotion="true",window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches))return;const t=n=>Math.min(1,Math.max(0,n));document.addEventListener("pointermove",n=>{if(n.pointerType==="touch")return;if(c.player.open||document.body.classList.contains("is-island-dragging")||document.body.classList.contains("is-motion-throttled")){Lt();return}const r=n.target instanceof Element?n.target.closest(".movie-card, .resource-card"):null;if(!r){Lt();return}Oe&&Oe!==r&&Lt(Oe);const o=r.getBoundingClientRect();if(!o.width||!o.height)return;const a=t((n.clientX-o.left)/o.width),i=t((n.clientY-o.top)/o.height);Oe=r,Eo={x:Math.round(a*100),y:Math.round(i*100),tiltX:((a-.5)*3.2).toFixed(2),tiltY:((.5-i)*2.4).toFixed(2),sheenX:((a-.5)*36).toFixed(1),sheenY:((i-.5)*10).toFixed(1)},Zr||(Zr=window.requestAnimationFrame(Qh))},{passive:!0}),document.addEventListener("pointerout",n=>{if(!Oe)return;const r=n.relatedTarget;r instanceof Node&&Oe.contains(r)||Lt()},{passive:!0})}function em(){if(document.documentElement.dataset.premiumMotionGuard==="true"||(document.documentElement.dataset.premiumMotionGuard="true",Io()))return;const e=performance.now();let t=e,n=0;const r=o=>{const a=o-t;if(t=o,a>$p&&(n+=1),n>=Mp){document.body.classList.add("is-motion-throttled"),Lt();return}o-e<kp&&window.requestAnimationFrame(r)};window.requestAnimationFrame(r)}function tm(){if(document.documentElement.dataset.premiumSectionReveal==="true"||(document.documentElement.dataset.premiumSectionReveal="true",Io()))return;const e=Array.from(document.querySelectorAll(".hero-section, .content-section"));if(e.length){for(const[t,n]of e.entries())n.classList.add("is-premium-section"),n.style.setProperty("--cf-section-delay",`${Math.min(t*74,220)}ms`);if(!("IntersectionObserver"in window)){window.requestAnimationFrame(()=>{e.forEach(t=>t.classList.add("is-section-visible"))});return}Dr=new IntersectionObserver(t=>{for(const n of t)n.isIntersecting&&(n.target.classList.add("is-section-visible"),Dr?.unobserve(n.target))},{root:null,threshold:.12,rootMargin:"0px 0px -8% 0px"}),e.forEach(t=>Dr.observe(t))}}function nm(){nh(),Jh(),Zh(),em(),tm(),Uh(),Xh(),Kh(),Fh(),window.addEventListener("beforeunload",()=>mn({immediate:!0})),window.addEventListener("resize",gn,{passive:!0}),Y.onWindowMode?.(e=>Ke(e)),d.dailyDetailBtn.addEventListener("click",()=>c.daily&&cn(c.daily.id,c.daily)),d.dailyLikeBtn.addEventListener("click",()=>c.daily&&os(c.daily)),d.detailCloseBtn.addEventListener("click",ch),d.favoritesBtn?.addEventListener("click",ja),d.favoritesPullBtn?.addEventListener("click",ja),d.favoritesList?.addEventListener("click",ph),cr(),dr(),d.settingsBtn.addEventListener("click",Kp),d.settingsCloseBtn.addEventListener("click",en),document.querySelector("#credentialVisibilityBtn")?.addEventListener("click",e=>{const t=d.apiCredentialInput.type==="password";d.apiCredentialInput.type=t?"text":"password",e.currentTarget.textContent=t?"隐藏":"显示",e.currentTarget.setAttribute("aria-pressed",String(t))}),d.saveSettingsBtn.addEventListener("click",Zp),d.testConnectionBtn.addEventListener("click",th),d.clearSettingsBtn.addEventListener("click",eh),d.settingsBtn.addEventListener("click",()=>{Ha()}),d.playbackProxySelect?.addEventListener("change",()=>{Xp(d.playbackProxySelect.value||"follow")}),Ha(),d.refreshBtn.addEventListener("click",async()=>{c.railCache.clear(),c.railCachePending.clear(),fe("正在刷新推荐"),await sr()}),d.settingsModal.addEventListener("click",e=>{e.target===d.settingsModal&&en()}),document.addEventListener("pointerdown",dh),document.addEventListener("pointerdown",e=>{if(!ms())return;const t=e.target;t instanceof Element&&(t.closest(".favorites-panel, #favoritesBtn, .settings-card, .player-modal, .window-controls")||ro())}),document.addEventListener("keydown",e=>{if(Ao()&&(e.key==="Escape"||e.altKey&&e.key==="Enter")){e.preventDefault(),Zt({focusInputRecommendations:jn()});return}if(e.key==="Escape"){if(c.player.open){Un();return}lr(),en(),ro()}(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&(e.preventDefault(),d.globalSearch.focus())}),d.closeChoiceModal.addEventListener("click",e=>{e.target===d.closeChoiceModal&&zn()}),d.closeToIslandBtn.addEventListener("click",async()=>{zn(),Ke({mode:"island"}),await Y.enterIsland(72)}),d.exitAppBtn.addEventListener("click",()=>Y.close()),d.cancelCloseBtn.addEventListener("click",zn),d.minBtn.addEventListener("click",async()=>{Ke({mode:"island"}),await Y.minimize()}),d.maxBtn.addEventListener("click",()=>Y.maximize()),d.closeBtn.addEventListener("click",Qp)}Dp();nm();Jp();sr();$l({api:Y,state:c,escapeHtml:_});Od({api:Y,state:c,escapeHtml:_});fp({state:c,escapeHtml:_,toast:fe,playEpisode:Cs});window.__cineflowOpenResourcePlayer=e=>fr(e);const de={groups:new Map,work:null,showNoise:!1,query:"",mode:"title",lastProgress:null,searchId:0};let Ga=null;function Rs(){return Ga||=ll({vodApi:Jn,escapeHtml:_,onPlay:Bs,onMeta:am}),Ga}async function rm(e,t,n){de.query=e,de.mode=n,de.showNoise=!1,de.lastProgress=null,de.searchId=t,d.searchSection.classList.remove("is-hidden"),d.searchTitle.textContent=`“${e}” 的${n==="exact"?"精确片名":"片名搜索"}结果`,d.searchHint.textContent="正在搜索采集站…",Ze(d.searchRail),Pt(d.searchRail,8),rs(e);let r=0,o=0;const a=()=>t===c.activeSearchId;try{await tt.run(e,{isCurrent:a,onProgress:i=>{de.lastProgress=i,window.clearTimeout(o);const s=performance.now();if(i.done||s-r>220){r=s,co(i);return}o=window.setTimeout(()=>{a()&&(r=performance.now(),co(de.lastProgress))},220)}})}catch(i){if(!a())return;d.searchHint.textContent="搜索失败",Ze(d.searchRail),rt(d.searchRail,`${Ce(i)}；按回车重试。`)}}function co(e){if(!e||de.searchId!==c.activeSearchId)return;const t=d.searchRail,n=de.mode==="exact"?cl(e.groups,de.query):e.groups,r=n.filter(l=>!l.noise),o=n.filter(l=>l.noise);de.groups=new Map(n.map(l=>[l.key,l]));const a=e.failures.length;if(d.searchHint.textContent=[e.done?"搜索完成":"搜索中",`已查 ${e.checked}/${e.total} 个片源`,`${r.length} 部作品`,a?`${a} 个片源失败`:""].filter(Boolean).join(" · "),e.done&&e.disabledEvents?.length&&fe(`${e.disabledEvents.length} 个片源连续失败，已暂时停用（可在设置 → 片源管理中恢复）`),!r.length&&!o.length){if(!e.done)return;Ze(t),rt(t,de.mode==="exact"?"没有找到同名作品，可切换“片名搜索”尝试别名或部分片名。":e.total?"采集站没有找到相关作品，试试换一个关键词或别名。":"当前没有可用的采集站，请在设置 → 片源管理中添加或恢复。");return}const i=[...r,...de.showNoise?o:[]].map(l=>il(l,_)).join(""),s=o.length?`<button class="vod-noise-toggle" type="button" data-vod-noise="1">${de.showNoise?"收起":"显示"}相关解说 / 预告 ${o.length} 条</button>`:"";t.innerHTML=i+s,t.classList.contains("is-expanded")||eo(d.searchMoreBtn,t,r.length,null)}function om(e){gn(),Do("open",{metricsSynced:!0}),d.detailPanel.classList.add("is-open"),d.detailPanel.setAttribute("aria-hidden","false"),_o(!0),d.detailContent.innerHTML=e,Hn()}function Zn(e,{preferSourceKey:t=""}={}){de.work?.destroy(),c.activeResourceSearchId+=1,c.lastDetailMovieId=`vod:${e.key}`,c.lastDetailMediaType="vod";const n=[e.year,e.typeName,e.area,e.remarks].filter(Boolean);om(`
    <div class="detail-backdrop vod-backdrop"></div>
    <div class="detail-hero vod-hero" data-vod-work="${_(e.key)}">
      <div class="detail-poster">
        ${e.pic?`<img src="${_(e.pic)}" alt="${_(e.name)} 海报" decoding="async" referrerpolicy="no-referrer" />`:'<div class="poster-fallback">暂无海报</div>'}
      </div>
      <div class="detail-info">
        <p class="eyebrow">采集站聚合 · ${e.sourceCount} 个来源</p>
        <h2>${_(e.name)}</h2>
        <div class="meta-row">
          <span class="vod-score" hidden></span>
          ${n.map(o=>`<span>${_(o)}</span>`).join("")}
        </div>
        <p class="overview vod-overview">正在读取简介…</p>
        <p class="vod-credits"></p>
      </div>
    </div>
    <section class="detail-resources vod-resources"><div class="vod-work-body"></div></section>
  `);const r=d.detailContent.querySelector(".vod-work-body");de.work=Rs().renderWork(r,e,{preferSourceKey:t}),im(e)}function Ns(e){const t=d.detailContent.querySelector(".vod-hero");return t&&t.getAttribute("data-vod-work")===e.key?t:null}function am(e,t){const n=Ns(t);if(!n||!e)return;const r=n.querySelector(".vod-overview");r&&r.dataset.source!=="tmdb"&&(r.textContent=e.content||"暂无简介。",r.dataset.source="cms");const o=n.querySelector(".vod-credits");o&&!o.textContent&&(o.textContent=[e.director?`导演：${e.director}`:"",e.actor?`主演：${e.actor}`:""].filter(Boolean).join("　"));const a=n.querySelector(".detail-poster");a&&!a.querySelector("img")&&e.pic&&(a.innerHTML=`<img src="${_(e.pic)}" alt="${_(e.name)} 海报" decoding="async" referrerpolicy="no-referrer" />`)}async function im(e){if(!(!c.credential?.configured||!Y.searchMovies))try{const t=await Y.searchMovies(e.name,{match:"exact"}),n=Array.isArray(t)?t:[],r=n.find(f=>e.year&&(f.releaseDate||"").startsWith(e.year))||(e.year?null:n[0]),o=Ns(e);if(!r||!o)return;const a=o.querySelector(".vod-score");a&&Number(r.voteAverage)>0&&(a.hidden=!1,a.textContent=`★ ${Number(r.voteAverage).toFixed(1)}`);const i=o.querySelector(".vod-overview");i&&r.overview&&(i.textContent=r.overview,i.dataset.source="tmdb");const s=Qe(r.posterPath,ko);s&&(o.querySelector(".detail-poster").innerHTML=`<img src="${s}" alt="${_(e.name)} 海报" decoding="async" />`);const l=Qe(r.backdropPath,$o),u=d.detailContent.querySelector(".vod-backdrop");l&&u&&(u.style.backgroundImage=`url('${l}')`)}catch{}}function Bs({group:e,item:t,detail:n,lineIndex:r=0,episodeIndex:o=0,alternatives:a=[]}){const i=n?.lines?.[r];if(!i)return;const s=e?.name||n.meta?.name||"影视资源",{playlistId:l,playlist:u}=io({},i,r,t.sourceName,s),f=u[o]||u[0];f&&fr({url:f.url,kind:f.kind,format:f.format,needsResolve:f.needsResolve,playlistId:l,episodeIndex:f.episodeIndex,title:s,sourceName:t.sourceName,lineName:f.lineName,label:f.label,vod:{sourceKey:t.sourceKey,vodId:t.vodId,sourceName:t.sourceName,title:s,year:e?.year||n.meta?.year||"",pic:e?.pic||n.meta?.pic||"",lineIndex:r,lineName:i.name,alternatives:a.map(p=>p.item?{sourceKey:p.item.sourceKey,vodId:p.item.vodId,sourceName:p.item.sourceName,ms:p.detail?.ms??null}:p)}})}async function sm(e){const t=d.detailContent.querySelector("#detailResources"),n=d.detailContent.querySelector("#resourceResults");if(!t||!n)return;const r=++c.activeResourceSearchId;de.work?.destroy(),t.querySelector("#resourceModeBadge").textContent="采集站聚合",n.innerHTML='<div class="resource-pulse">正在搜索采集站，找到后列出匹配的作品与来源…</div>',Fe(t,"正在搜索采集站…");const o=(e.releaseDate||"").slice(0,4),a={title:e.title,originalTitle:e.originalTitle,year:o,mediaType:xe(e)},i=()=>r===c.activeResourceSearchId,s=l=>tt.run(l,{isCurrent:i,onProgress:u=>{const f=mr(u.groups,a);Fe(t,`${u.done?"搜索完成":"正在搜索"} · 已查 ${u.checked}/${u.total} 个片源 · 匹配 ${f.length} 部作品`)}});try{let l=await s(e.title),u=mr(l.groups,a);if(!u.length&&e.originalTitle&&e.originalTitle!==e.title&&i()&&(l=await s(e.originalTitle),u=mr(l.groups,a)),!i())return;if(!u.length){n.innerHTML='<div class="resource-empty">采集站暂未找到同名资源，可在顶部搜索框用别名或原名再试。</div>',Fe(t,`搜索完成 · 已查 ${l.checked}/${l.total} 个片源`,{muted:!0});return}de.work=Rs().renderMatches(n,u.slice(0,16))}catch(l){if(!i())return;n.innerHTML='<div class="resource-empty">采集站搜索暂时不可用，稍后可重新打开介绍页再试。</div>',Fe(t,Ce(l),{muted:!0})}}document.addEventListener("click",e=>{const t=e.target instanceof Element?e.target:null;if(t?.closest("[data-vod-noise]")){de.showNoise=!de.showNoise,co(de.lastProgress);return}const n=t?.closest(".vod-card[data-vod-key]"),r=n?de.groups.get(n.getAttribute("data-vod-key")):null;r&&Zn(r)});document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target instanceof Element?e.target.closest(".vod-card[data-vod-key]"):null,n=t?de.groups.get(t.getAttribute("data-vod-key")):null;n&&(e.preventDefault(),Zn(n))});window.addEventListener("cineflow:resource-settings",()=>tt?.invalidate());window.__cineflowVod={openWork:Zn,play:Bs,detail:(e,t)=>Jn?.detail(e,t),search:(e,t)=>tt?.run(e,t),openByTitle:async(e,t="",n="")=>{if(!tt||!e)return!1;fe(`正在查找「${e}」的来源…`);const r=await tt.run(e).catch(()=>null),o=Te(e),a=(r?.groups||[]).filter(s=>Te(s.name)===o),i=a.find(s=>!t||!s.year||s.year===String(t))||a[0];return i?(Zn(i,{preferSourceKey:n}),!0):(fe("采集站暂时没有找到这部作品"),!1)}};
