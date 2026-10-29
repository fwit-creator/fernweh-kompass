/* Fernweh-Kompass: geführte App.
   Jede Person geht die Etappen durch, wählt 3 Favoriten; sobald alle Eingeladenen fertig sind, öffnet die Entscheidungsrunde. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const trv=(d,k)=>+d.tr[TK.indexOf(k)],acv=(d,k)=>+d.ac[AK.indexOf(k)];
const load=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

TRA.auto="Auto / Mietwagen";
const MODES={auto:"Auto",moto:"Motorrad",zug:"Zug & Bus",rad:"Fahrrad",flug:"Flugzeug",beste:"Schnellste Option"};
const MODE_SUB={auto:"Eigenes Auto oder Mietwagen",moto:"Kurven und Freiheit",zug:"Bahn und Fernbus",rad:"Etwa 75 km am Tag",flug:"Inklusive Wege und Wartezeit",beste:"Auto, Zug oder Flug, was schneller ist"};
const CROWDS={meiden:["Möglichst einsam","Kaum andere Reisende. Manches hat dafür geschlossen."],ruhig:["Ruhig, aber belebt","Etwas los, aber kein Gedränge."],egal:["Ist mir egal","Andrang spielt keine Rolle."],suchen:["Trubel gern","Leute kennenlernen, Stimmung, Nachtleben."]};
const BUDGETS={1:["Sparsam","grob unter 60 € pro Person und Tag"],2:["Mittel","grob 60 bis 150 € pro Person und Tag"],3:["Großzügig","grob über 150 € pro Person und Tag"]};
const GRP_SUB={solo:"Nur du",paar:"Ihr zwei",familie:"Mit Kindern",freunde:"Eine kleine Crew",gruppe:"8 Leute oder mehr"};
const ACC_SUB={zelt:"Draußen schlafen",huette:"Berghütte, Lodge, Teehaus",hostel:"Schlafsaal, Leute treffen",hotel:"Bequem und gemacht",fewo:"Selbst kochen",camper:"Rollendes Zuhause"};
const TRA_SUB={fuss:"Wandern und Trekking",rad:"Touren mit dem Rad",auto:"Flexibel mit dem Wagen",zug:"Öffentlich unterwegs",boot:"Kanu, Kajak, Segeln",moto:"Mit dem Motorrad"};
const VDESC={strand:"Baden, Sand, Meeresrauschen",berge:"Gipfel, Hütten, Höhenmeter",stadt:"Gassen, Museen, Cafés",wildnis:"Weite, Wald, kaum Menschen",kultur:"Geschichte, Märkte, Traditionen",essen:"Regionale Küche, Wein, Streetfood",abenteuer:"Herausforderung, Nervenkitzel",ruhe:"Abschalten, durchatmen",party:"Bars, Clubs, Festivals",schnee:"Winter, Nordlicht, Husky",wasser:"Kajak, Segeln, Tauchen",roadtrip:"Unterwegs sein ist das Ziel",lostplaces:"Bunker, Ruinen, verlassene Orte"};
const I=p=>`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON={
  berge:'<path d="M2 26 12 9l6 9 4-5 8 13z"/>',strand:'<circle cx="22" cy="9" r="4"/><path d="M2 20c4-3 8 3 12 0s8 3 12 0M2 26c4-3 8 3 12 0s8 3 12 0"/>',
  stadt:'<path d="M4 28V12h7v16M11 28V5h9v23M20 28V15h8v13M2 28h28"/>',wildnis:'<path d="M9 4 3 18h12zM9 18v8M22 8l-6 14h12zM22 22v5"/>',
  kultur:'<path d="M4 28h24M7 28V14M13 28V14M19 28V14M25 28V14M3 14h26L16 5z"/>',essen:'<path d="M8 3v10a3 3 0 0 0 6 0V3M11 13v16M23 3c-3 2-4 6-4 10h4v16"/>',
  abenteuer:'<circle cx="16" cy="16" r="12"/><path d="m21 11-3 7-7 3 3-7z"/>',ruhe:'<path d="M20 4a11 11 0 1 0 8 15A9 9 0 0 1 20 4z"/>',
  party:'<path d="M4 28 12 8l12 12zM19 4l1 3M27 7l-2 2M28 14h-3"/>',schnee:'<path d="M16 3v26M5 9.5l22 13M5 22.5l22-13M12 5l4 3 4-3M12 27l4-3 4 3"/>',
  wasser:'<path d="M3 21c8 4 18 4 26 0M8 11l16 14M5 9l5 4M22 23l5 4"/>',roadtrip:'<path d="M12 4 6 28M20 4l6 24M16 6v3M16 13v4M16 21v5"/>',
  lostplaces:'<path d="M4 28V14l6-4v18M10 28V18h8v10M18 28V12l6 3v13M2 28h28"/>',
  auto:'<path d="M4 20l3-8h18l3 8v5H4zM4 20h24"/><circle cx="9" cy="25" r="2"/><circle cx="23" cy="25" r="2"/>',
  moto:'<circle cx="7" cy="22" r="5"/><circle cx="25" cy="22" r="5"/><path d="M7 22l6-8h6l6 8M19 14l-2-5h-4"/>',
  zug:'<rect x="7" y="4" width="18" height="20" rx="4"/><path d="M7 15h18M11 28l2-4M21 28l-2-4"/>',
  rad:'<circle cx="7" cy="21" r="5"/><circle cx="25" cy="21" r="5"/><path d="M7 21l6-9h8l4 9M13 12l3 9H7M18 8h4"/>',
  flug:'<path d="M3 18l26-8-4 6-10 2-6 7-2-1 2-6z"/>',beste:'<path d="M18 3 7 18h8l-2 11 11-16h-8z"/>',
  fuss:'<path d="M11 4h6v12l8 4v6H7V16z"/>',boot:'<path d="M3 21c8 4 18 4 26 0M8 11l16 14M5 9l5 4M22 23l5 4"/>',
  zelt:'<path d="M3 27 16 5l13 22zM12 27l4-7 4 7"/>',huette:'<path d="M4 15 16 5l12 10M7 13v14h18V13M13 27v-7h6v7"/>',
  hostel:'<path d="M5 4v24M27 4v24M5 12h22M5 22h22"/>',hotel:'<path d="M6 28V4h20v24M11 9h3M18 9h3M11 15h3M18 15h3M14 28v-6h4v6"/>',
  fewo:'<circle cx="10" cy="16" r="6"/><path d="M16 16h13M24 16v5M28 16v4"/>',camper:'<path d="M2 23V10h18l6 6h4v7zM20 10v6h6"/><circle cx="8" cy="24" r="2"/><circle cx="24" cy="24" r="2"/>'
};
const tile=(k,title,sub,on,attr="")=>`<button type="button" class="tile" data-k="${k}" aria-pressed="${!!on}" ${attr}>${ICON[k]?I(ICON[k]):""}<b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:""}</button>`;

/* ---------- Identität (nur auf diesem Gerät) ---------- */
let ME=load("fk2-me");
if(!ME||!ME.sk){ME={sk:toHex(NostrTools.generateSecretKey()),name:""};store("fk2-me",ME)}
ME.skBytes=fromHex(ME.sk);ME.pk=NostrTools.getPublicKey(ME.skBytes);ME.mid=ME.pk.slice(0,16);
const saveMe=()=>store("fk2-me",{sk:ME.sk,name:ME.name});

/* ---------- Expedition ---------- */
const freshS=()=>({vibes:[],notes:[],start:null,mode:"auto",limType:"zeit",lim:6,custom:[],excluded:[],month:(new Date().getMonth()+2)%12,warm:"mild",nights:5,
  trans:"fuss",accom:"zelt",group:"freunde",crowd:"egal",budget:2,favs:[],submitted:false,votes:{},comments:{},duels:{},packed:{}});
let X=load("fk2-exp"),S=X?Object.assign(freshS(),X.S):freshS();
if(X)X.S=S;
S.custom.forEach(c=>{if(!D.some(d=>d.id===c.id))D.push(c)});
let pubT=0;
function save(){if(!X)return;X.S=S;store("fk2-exp",X);if(X.room){clearTimeout(pubT);pubT=setTimeout(()=>Sync.publish("m:"+ME.mid,memberPayload()),2500)}}
function memberPayload(){return {v:1,name:ME.name,start:S.start,mode:S.mode,group:S.group,month:S.month,nights:S.nights,vibes:S.vibes,favs:S.favs,submitted:S.submitted,
  votes:S.votes,comments:S.comments,duels:S.duels,customs:S.custom.filter(c=>S.favs.includes(c.id))}}
function publishMeta(){if(X&&X.room)Sync.publish("meta",X.meta)}

let INVITE=null;
{const m=location.hash.match(/join=([\w-]+)\.([\w-]+)/);if(m){INVITE={id:m[1],key:m[2]};history.replaceState(null,"",location.pathname+location.search)}}
if(INVITE&&X&&X.room&&X.room.id===INVITE.id)INVITE=null;
const inviteURL=()=>X&&X.room?`${location.origin}${location.pathname}#join=${X.room.id}.${X.room.key}`:"";

/* ---------- Anreise und Bewertung ---------- */
function legH(air,d,mode){
  const land=d.reach!=="fly";
  if(mode==="auto")return land?air*1.15/(air>150?105:75)+.25:null;
  if(mode==="moto")return land?air*1.2/(air>150?88:65)+.4:null;
  if(mode==="zug")return land?air*1.3/(air>300?95:70)+.5+(2-(d.rail??1))*.8:null;
  if(mode==="rad")return land&&air<=900?air*1.2/15:null;
  if(mode==="flug")return air>=400?2.5+air/750+(land?1.5:1):null;
  return null;
}
function trip(start,mode,d){
  if(!start)return {air:null,h:null,m:mode};
  const air=hav(start.lat,start.lon,d.lat,d.lon);
  if(mode!=="beste")return {air,h:legH(air,d,mode),m:mode};
  let best={air,h:null,m:null};["auto","zug","flug"].forEach(m=>{const h=legH(air,d,m);if(h!=null&&(best.h==null||h<best.h))best={air,h,m}});return best;
}
function limCfg(){if(S.limType==="km")return [25,5000,25];if(S.mode==="rad")return [1,14,1];if(S.mode==="flug"||S.mode==="beste")return [1,24,.5];return [.5,16,.5]}
function reachKm(){
  if(S.limType==="km")return S.lim;const h=S.lim;
  const car=Math.max(0,h-.25)*105/1.15;
  return {auto:car,moto:Math.max(0,h-.4)*88/1.2,zug:Math.max(0,h-.5)*90/1.3,rad:h*5*15/1.2,flug:Math.max(0,h-4)*750,beste:Math.max(car,Math.max(0,h-4)*750)}[S.mode];
}
const limText=()=>S.limType==="km"?`höchstens ${S.lim.toLocaleString("de-DE")} km Luftlinie`:S.mode==="rad"?`höchstens ${S.lim} Radtage`:`höchstens ${String(S.lim).replace(".",",")} Std. ${S.mode==="beste"?"mit dem schnellsten Mittel":"mit "+MODES[S.mode]}`;
function fmtT(h,m){
  if(h==null||h===Infinity)return "nicht möglich";
  if(m==="rad"){const d=Math.max(1,Math.ceil(h/5));return `${d} Radtag${d>1?"e":""}`}
  if(h<1)return "unter 1 Std.";
  return `ca. ${String(Math.round(h*2)/2).replace(".",",")} Std.`;
}
const RC=new Map();
function myReach(d){
  if(RC.has(d.id))return RC.get(d.id);
  const t=trip(S.start,S.mode,d);let ok=null,ratio=0;
  if(S.start){ratio=S.limType==="km"?t.air/S.lim:t.h==null?Infinity:S.mode==="rad"?(t.h/5)/S.lim:t.h/S.lim;ok=ratio<=1}
  const r={...t,ok,ratio};RC.set(d.id,r);return r;
}
function crowdFit(d,m){const c=d.c[m],tg={meiden:0,ruhig:1,suchen:3}[S.crowd];return tg==null?1:1-Math.abs(c-tg)/3}
function score(d){
  const m=S.month,vibe=S.vibes.length?S.vibes.reduce((a,v)=>a+(d.tags[v]||0)/3,0)/S.vibes.length:.5;
  const bud=d.cost<=S.budget?1:clamp(1-(d.cost-S.budget)*.45,0,1),r=myReach(d);
  let rf=r.ok===null?.6:r.ok?1-.35*r.ratio:clamp(.35-.25*(r.ratio-1),0,.35);
  if(r.ok&&r.h!=null&&S.mode!=="rad"&&r.h>S.nights*24*.12)rf*=.8;
  const fit=(acv(d,S.accom)+trv(d,S.trans))/6;
  const grp=S.group==="familie"?d.fam/3:(S.group==="freunde"||S.group==="gruppe")?clamp(.6+((d.tags.party||0)+(d.tags.abenteuer||0))/15,0,1):1;
  return Math.round(vibe*32+climFit(d,m)*20+bud*8+rf*16+fit*14+crowdFit(d,m)*5+grp*5);
}
const ranked=()=>D.filter(d=>!S.excluded.includes(d.id)).map(d=>({d,s:score(d)})).sort((a,b)=>b.s-a.s);
const destById=id=>D.find(d=>d.id===id);

/* ---------- Gruppe ---------- */
const norm=s=>(s||"").trim().toLowerCase();
function mergeCustoms(){if(!X||!X.room)return;Sync.members().forEach(m=>(m.customs||[]).forEach(c=>{if(c&&c.id&&!D.some(d=>d.id===c.id))D.push({...c,owner:m.name})}))}
function group(){
  const meta=(X.room&&Sync.meta())||X.meta||{crew:[ME.name]};
  const me={...memberPayload(),mid:ME.mid,isMe:true};
  let others=X.room?Sync.members().filter(m=>m.mid!==ME.mid&&norm(m.name)!==norm(ME.name)):[];
  others=others.sort((a,b)=>b.at-a.at).filter((m,i,a)=>a.findIndex(x=>norm(x.name)===norm(m.name))===i);
  const all=[me,...others],names=(meta.crew&&meta.crew.length?meta.crew:[ME.name]);
  const slots=names.map(n=>({name:n,m:all.find(x=>norm(x.name)===norm(n))||null}));
  all.forEach(x=>{if(!slots.some(s=>s.m===x))slots.push({name:x.name,m:x,extra:true})});
  const ready=s=>!!(s.m&&s.m.submitted&&(s.m.favs||[]).length>=3);
  const open=!X.room?S.submitted:!!(meta.forceOpen||slots.every(ready));
  const pool=[...new Set(all.flatMap(m=>m.submitted?(m.favs||[]):[]))].filter(destById);
  return {meta,all,slots,open,pool,ready};
}
const pairKey=(a,b)=>[a,b].sort().join("|");
const vetoBy=(G,id)=>G.all.filter(m=>(m.votes||{})[id]==="veto").map(m=>m.name);
function points(G,id){
  if(vetoBy(G,id).length)return null;let p=0;
  G.all.forEach(m=>{if((m.favs||[]).includes(id)&&m.submitted)p+=2;const v=(m.votes||{})[id];if(v==="up")p+=2;if(v==="down")p-=2;
    ((m.comments||{})[id]||[]).forEach(c=>p+=c.pro?1:-1);
    Object.entries(m.duels||{}).forEach(([k,w])=>{if(!k.split("|").includes(id))return;if(w===id)p+=3;else if(w==="draw")p+=1})});
  return p;
}
function pairsOf(ids){const o=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)o.push(pairKey(ids[i],ids[j]));return o}

/* ---------- Ablauf ---------- */
const STEPS=["start","lust","anreise","regionen","zeit","vorort","crew","menschen","budget","ziele","runde"];
const TITLES={lust:"Was reizt dich?",anreise:"Wie weit und womit?",regionen:"Eigene Regionen",zeit:"Wann und welches Klima?",vorort:"Unterwegs vor Ort",crew:"Wer ist dabei?",menschen:"Wie viele andere Menschen?",budget:"Wie viel Geld?",ziele:"Deine Möglichkeiten",runde:"Entscheidungsrunde"};
let GL=null,lastStep=null,showAll=false;
const stepNow=()=>X?X.step:"start";
function go(id){if(!X)return;X.step=id;X.maxStep=Math.max(X.maxStep||1,STEPS.indexOf(id));store("fk2-exp",X);render()}
function next(){go(STEPS[STEPS.indexOf(stepNow())+1])}
function themeNow(){
  const st=stepNow();if(st==="start")return ["explore",{}];
  const v=S.vibes[S.vibes.length-1]||"explore",mod={};
  if(STEPS.indexOf(st)>=STEPS.indexOf("zeit")||st==="zeit"){if(S.warm==="eisig"||S.warm==="kalt")mod.cold=true;if(S.warm==="heiss")mod.heat=true}
  return [v,mod];
}
const head=(st,sub)=>`<div class="step-head"><div class="eyebrow">Etappe ${STEPS.indexOf(st)} von ${STEPS.length-1}</div><h1>${TITLES[st]}</h1>${sub?`<p>${sub}</p>`:""}</div>`;
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2600)}
function cta(o){
  const bar=$("#bottombar"),b=$("#nextBtn");
  if(!o){bar.hidden=true;return}
  bar.hidden=false;b.textContent=o.label||"Weiter";b.disabled=!!o.disabled;b.onclick=o.onClick||next;
  $("#ctaHint").textContent=o.hint||"";$("#ctaHint").hidden=!o.hint;
}
function render(){
  RC.clear();if(GL){GL.destroy();GL=null}
  const st=stepNow();Scene.set(...themeNow());
  $("#backBtn").disabled=st==="start";
  const cur=STEPS.indexOf(st);
  $("#progress").innerHTML=st==="start"?"":STEPS.slice(1).map((s,i)=>`<button type="button" data-s="${s}" class="${i+1<cur?"done":i+1===cur?"cur":""}" aria-label="${TITLES[s]}" title="${TITLES[s]}" ${i+1>(X.maxStep||1)?"disabled":""}></button>`).join("");
  const v=VIEW[st]();$("#screen").innerHTML=v.html;
  if(lastStep!==st){$("#screen").scrollTop=0;lastStep=st;$("#screen").focus({preventScroll:true})}
  cta(v.cta);v.bind&&v.bind();
}
function rerenderKeepScroll(){const y=$("#screen").scrollTop;render();$("#screen").scrollTop=y}

/* ---------- Ansichten ---------- */
const VIEW={};
VIEW.start=()=>{
  const meta=X&&X.room?(Sync.meta()||X.meta):X&&X.meta;
  let box;
  if(INVITE){
    const im=Sync.meta();
    box=`<h2>Du bist eingeladen</h2>
      <p class="muted" id="invInfo">${im?`Expedition „${esc(im.name)}“ von ${esc(im.host||"")}. Wer bist du?`:"Einladung wird geladen …"}</p>
      <div class="chips" id="invNames">${im?(im.crew||[]).map(n=>`<button type="button" class="chip" data-n="${esc(n)}">${esc(n)}</button>`).join(""):""}</div>
      <div class="field"><input class="txt" id="invName" placeholder="Dein Name" value="${esc(ME.name)}" aria-label="Dein Name"><button type="button" class="btn acc" id="invJoin">Mitmachen</button></div>
      ${X?`<p class="muted small">Deine bisherige Expedition auf diesem Gerät wird dabei ersetzt.</p>`:""}`;
  }else if(X){
    box=`<h2>${esc(meta&&meta.name||"Deine Expedition")}</h2><p class="muted">Zuletzt bei: ${TITLES[X.step]||"Start"}</p>
      <button type="button" class="cta" id="cont">Weiter planen</button><button type="button" class="link" id="newExp">Neue Expedition beginnen</button>
      <div id="newForm" hidden></div>`;
  }else box=newForm();
  return {html:`<section class="step hero">
      <div class="eyebrow">Expeditionsplaner für Urlaub und Abenteuer</div>
      <h1>Fernweh-<span>Kompass</span></h1>
      <p>Dreh den Globus und lass dich treiben. Danach führt dich der Kompass Etappe für Etappe zu deinem Ziel, allein oder mit deiner Crew.</p>
      <div class="globe-wrap bare" id="gStart"></div>
      <div class="card start-actions">${box}</div></section>`,
    cta:null,
    bind(){
      GL=createGlobe($("#gStart"),{height:520,id:"s",label:"Globus mit allen Zielen"});
      GL.set({pins:D.map(d=>({id:d.id,lon:d.lon,lat:d.lat,name:d.name,cls:"in",r:5}))});GL.spin(true);
      GL.onPin(id=>{const d=destById(id);GL.stopSpin();GL.tip(`<b>${esc(d.name)}</b>${esc(d.land)}${d.hl&&d.hl[0]?` · ${esc(d.hl[0])}`:""}`)});
      bindNewForm();
      const c=$("#cont");if(c)c.onclick=()=>go(X.step==="start"?"lust":X.step);
      const n=$("#newExp");if(n)n.onclick=()=>{const f=$("#newForm");f.innerHTML=newForm(true);f.hidden=false;n.hidden=true;bindNewForm()};
      if(INVITE){
        $$("#invNames .chip").forEach(b=>b.onclick=()=>{$("#invName").value=b.dataset.n});
        $("#invJoin").onclick=()=>{const name=$("#invName").value.trim();if(!name){toast("Bitte gib deinen Namen ein.");return}joinInvite(name)};
      }
    }};
};
function newForm(replace){
  return `${replace?`<p class="muted small">Die aktuelle Expedition auf diesem Gerät wird ersetzt.</p>`:`<h2>Neue Expedition</h2>`}
    <label class="lbl" for="myName">Wie heißt du?</label><input class="txt" id="myName" value="${esc(ME.name)}" autocomplete="given-name">
    <label class="lbl" for="expName">Name der Expedition (optional)</label><input class="txt" id="expName" placeholder="z. B. Sommer 2027">
    <button type="button" class="cta" id="goNew">Expedition starten</button>
    <p class="muted small">Andere lädst du später mit einem Link ein. Niemand braucht ein Konto.</p>`;
}
function bindNewForm(){
  const b=$("#goNew");if(!b)return;
  b.onclick=()=>{
    const name=$("#myName").value.trim();if(!name){toast("Bitte gib deinen Namen ein.");$("#myName").focus();return}
    ME.name=name;saveMe();Sync.stop();
    for(const c of S.custom||[]){const i=D.findIndex(d=>d.id===c.id);if(i>=0)D.splice(i,1)}
    S=freshS();X={room:null,S,step:"lust",maxStep:1,meta:{name:$("#expName").value.trim()||"Expedition "+name,crew:[name],host:name,group:"freunde"}};
    store("fk2-exp",X);render();
  };
}
async function joinInvite(name){
  ME.name=name;saveMe();
  for(const c of S.custom||[]){const i=D.findIndex(d=>d.id===c.id);if(i>=0)D.splice(i,1)}
  const im=Sync.meta();S=freshS();if(im&&im.group)S.group=im.group;
  X={room:{id:INVITE.id,key:INVITE.key,host:false},S,step:"lust",maxStep:1,meta:im||{name:"Expedition",crew:[],host:""}};
  INVITE=null;store("fk2-exp",X);save();render();toast("Willkommen in der Crew!");
}

VIEW.lust=()=>({
  html:`<section class="step">${head("lust","Wähle alles, worauf du Lust hast. Der Hintergrund zeigt dir, wohin die Reise geht.")}
    <div class="card"><div class="tiles" id="vibeTiles">${Object.keys(VIBES).map(k=>tile(k,VIBES[k],VDESC[k],S.vibes.includes(k))).join("")}</div></div>
    <div class="card"><label class="lbl" for="idea">Ideenwand</label><p class="sub">Schreib frei, was dir vorschwebt. Der Kompass erkennt Stichworte und stellt später passende Antworten schon ein.</p>
      <form class="field" id="ideaForm"><input class="txt" id="idea" placeholder="z. B. Lost Places, Wildcampen, im Juli, günstig" autocomplete="off"><button class="btn acc">Anheften</button></form>
      <div class="status" id="ideaStatus" aria-live="polite"></div>
      <div class="note-wall">${S.notes.map((n,i)=>`<div class="note" style="--r:${(i%3-1)*1.5}deg">${esc(n.txt)}${n.tags&&n.tags.length?`<small>${n.tags.map(t=>esc(VIBES[t]||t)).join(" · ")}</small>`:""}<button type="button" data-i="${i}" aria-label="Notiz entfernen">×</button></div>`).join("")}</div></div></section>`,
  cta:{disabled:!S.vibes.length,hint:S.vibes.length?"":"Wähle mindestens eine Sache."},
  bind(){
    $("#vibeTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;const k=b.dataset.k,i=S.vibes.indexOf(k);
      if(i>=0)S.vibes.splice(i,1);else S.vibes.push(k);b.setAttribute("aria-pressed",i<0);save();Scene.set(...themeNow());cta({disabled:!S.vibes.length,hint:S.vibes.length?"":"Wähle mindestens eine Sache."})};
    $("#ideaForm").onsubmit=e=>{e.preventDefault();const t=$("#idea").value.trim();if(!t)return;const f=detect(t),labels=[];
      f.v.forEach(v=>{if(!S.vibes.includes(v))S.vibes.push(v);labels.push(VIBES[v])});
      if(f.a){S.accom=f.a;labels.push(ACC[f.a])}if(f.t){S.trans=f.t;labels.push(TRA[f.t])}if(f.g){S.group=f.g;labels.push(GRP[f.g])}
      if(f.b){S.budget=f.b;labels.push(BUDGETS[f.b][0])}if(f.c){S.crowd=f.c;labels.push(CROWDS[f.c][0])}if(f.m!==null){S.month=f.m;labels.push(MON[f.m])}
      S.notes.push({txt:t,tags:f.v});save();rerenderKeepScroll();
      $("#ideaStatus").textContent=labels.length?"Erkannt: "+labels.join(", "):"Notiert. Keine Stichworte erkannt.";};
    $$(".note button").forEach(b=>b.onclick=()=>{S.notes.splice(+b.dataset.i,1);save();rerenderKeepScroll()});
  }
});

VIEW.anreise=()=>{
  const [mn,mx,stp]=limCfg();S.lim=clamp(S.lim,mn,mx);
  return {html:`<section class="step">${head("anreise","Von wo startest du, womit reist du an und wie weit darf es sein? Die Karte zoomt mit.")}
    <div class="card"><span class="lbl">Startpunkt</span>
      <form class="field" id="startForm"><input class="txt" id="startQ" placeholder="PLZ oder Ort, z. B. 55116" value="${esc(S.start&&S.start.q||"")}" autocomplete="postal-code" aria-label="Postleitzahl oder Ort"><button class="btn solid">Suchen</button></form>
      <button type="button" class="link" id="geoBtn">Meinen Standort verwenden</button>
      <div class="results" id="startRes"></div>
      <div class="status ${S.start?"ok":""}" id="startStatus">${S.start?"Start: "+esc(S.start.label):"Noch kein Startpunkt."}</div>
      <p class="attr" id="osmAttr" ${S.start&&S.start.src==="osm"?"":"hidden"}>Postleitzahlen: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-Mitwirkende</a></p></div>
    <div class="card"><span class="lbl">Womit reist du an?</span><div class="tiles" id="modeTiles">${Object.keys(MODES).map(k=>tile(k,MODES[k],MODE_SUB[k],S.mode===k)).join("")}</div></div>
    <div class="globe-wrap" id="gA"></div>
    <div class="card"><span class="lbl">Wie weit darf es sein?</span>
      <div class="seg" id="limType"><button type="button" data-k="zeit" aria-pressed="${S.limType==="zeit"}">Anreisezeit</button><button type="button" data-k="km" aria-pressed="${S.limType==="km"}">Umkreis in km</button></div>
      <div class="range"><input type="range" id="lim" min="${mn}" max="${mx}" step="${stp}" value="${S.lim}" aria-label="Grenze für die Anreise"><output id="limOut"></output></div>
      <div class="counter" id="reachCount"></div></div></section>`,
  cta:{disabled:!S.start,hint:S.start?"":"Gib zuerst deinen Startpunkt an."},
  bind(){
    GL=createGlobe($("#gA"),{height:460,id:"a"});
    const upd=(fly)=>{
      RC.clear();const km=reachKm(),list=D.filter(d=>!S.excluded.includes(d.id)),inR=list.filter(d=>myReach(d).ok);
      $("#limOut").textContent=S.limType==="km"?`${S.lim.toLocaleString("de-DE")} km`:S.mode==="rad"?`${S.lim} Radtage`:`${String(S.lim).replace(".",",")} Std.`;
      $("#reachCount").innerHTML=S.start?`<b>${inR.length}</b> von ${list.length} Zielen in Reichweite · ${esc(limText())}`:"Mit Startpunkt siehst du, was erreichbar ist.";
      GL.set({pins:list.map(d=>({id:d.id,lon:d.lon,lat:d.lat,name:d.name,cls:S.start?(myReach(d).ok?"in":"out"):"in",r:5,label:S.start&&myReach(d).ok&&inR.length<=12})),
        crew:S.start?[{lon:S.start.lon,lat:S.start.lat,name:ME.name,label:"Start"}]:[],reach:S.start&&km<9000?[{lon:S.start.lon,lat:S.start.lat,km}]:[]});
      if(S.start&&fly!==null)GL.fitKm(S.start.lon,S.start.lat,Math.min(km*1.15,20000),fly?900:250);
    };
    if(!S.start){GL.spin(true);upd(null)}else upd(true);
    GL.onPin(id=>{const d=destById(id),r=myReach(d);GL.tip(`<b>${esc(d.name)}</b>${esc(d.land)} · ${r.h!=null?fmtT(r.h,r.m):"nicht erreichbar"}${r.ok===false?" · zu weit":""}`)});
    const setStart=s=>{S.start=s;save();$("#startStatus").textContent="Start: "+s.label;$("#startStatus").className="status ok";$("#startRes").innerHTML="";$("#osmAttr").hidden=s.src!=="osm";cta({});upd(true)};
    $("#startForm").onsubmit=async e=>{e.preventDefault();const q=$("#startQ").value.trim();if(!q)return;$("#startStatus").textContent="Suche …";$("#startStatus").className="status";
      let res=[];try{res=await findStart(q)}catch(err){}
      if(!res.length){$("#startStatus").textContent="Nichts gefunden. Versuch eine fünfstellige PLZ oder einen Ortsnamen.";$("#startStatus").className="status err";return}
      if(res.length===1)return setStart({...res[0],q});
      $("#startStatus").textContent="Welcher Ort?";$("#startRes").innerHTML=res.map((r,i)=>`<button type="button" data-i="${i}"><span>${esc(r.label)}</span></button>`).join("");
      $$("#startRes button").forEach(b=>b.onclick=()=>setStart({...res[+b.dataset.i],q}))};
    $("#geoBtn").onclick=()=>{if(!navigator.geolocation){toast("Standort ist auf diesem Gerät nicht verfügbar.");return}$("#startStatus").textContent="Standort wird bestimmt …";
      navigator.geolocation.getCurrentPosition(p=>setStart({lat:+p.coords.latitude.toFixed(3),lon:+p.coords.longitude.toFixed(3),label:"Mein Standort",src:"gps",q:""}),()=>{$("#startStatus").textContent="Standort nicht freigegeben. Gib eine PLZ ein.";$("#startStatus").className="status err"},{timeout:10000})};
    $("#modeTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;const k=b.dataset.k;if(k===S.mode)return;
      if(S.limType==="zeit"){if(k==="rad")S.lim=3;else if(S.mode==="rad"||(k==="flug"&&S.lim<4))S.lim=k==="flug"?6:6}
      S.mode=k;$$("#modeTiles .tile").forEach(t=>t.setAttribute("aria-pressed",t.dataset.k===k));const [a,z,s]=limCfg();Object.assign($("#lim"),{min:a,max:z,step:s});S.lim=clamp(S.lim,a,z);$("#lim").value=S.lim;save();upd(true)};
    $("#limType").onclick=e=>{const b=e.target.closest("button");if(!b||b.dataset.k===S.limType)return;S.limType=b.dataset.k;S.lim=S.limType==="km"?400:S.mode==="rad"?3:6;
      $$("#limType button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.k===S.limType));const [a,z,s]=limCfg();Object.assign($("#lim"),{min:a,max:z,step:s});$("#lim").value=S.lim;save();upd(true)};
    let lt=0;$("#lim").oninput=e=>{S.lim=+e.target.value;const now=Date.now();upd(now-lt>120?false:null);lt=now};
    $("#lim").onchange=()=>{save();upd(false)};
  }};
};

let regPick=null;
VIEW.regionen=()=>{
  const mine=S.custom,ex=S.excluded.map(destById).filter(Boolean);
  return {html:`<section class="step">${head("regionen","Fehlt ein Ort, den du im Kopf hast? Such ihn. Die App holt Klima, Wikipedia und Wikivoyage live dazu.")}
    <div class="card"><form class="field" id="regForm"><input class="txt" id="regQ" placeholder="z. B. Bornholm, Hohe Tatra, Kellerwald" autocomplete="off" aria-label="Ort oder Region suchen"><button class="btn solid">Suchen</button></form>
      <div class="results" id="regRes"></div><div id="regPick"></div><div class="status" id="regStatus" aria-live="polite"></div></div>
    <div class="card"><h2>Deine Regionen</h2>${mine.length?`<div class="members">${mine.map(d=>`<div class="member"><span><b>${esc(d.name)}</b> <span class="muted">${esc(d.land)}</span></span><span class="field" style="flex:none"><button type="button" class="btn" data-open="${d.id}">Ansehen</button><button type="button" class="btn" data-del="${d.id}">Entfernen</button></span></div>`).join("")}</div>`:`<p class="muted">Noch keine eigenen Regionen. Das ist optional, du kannst auch einfach weiter.</p>`}</div>
    ${ex.length?`<div class="card"><h2>Ausgeschlossen</h2><div class="members">${ex.map(d=>`<div class="member"><span><b>${esc(d.name)}</b> <span class="muted">${esc(d.land)}</span></span><button type="button" class="btn" data-back="${d.id}">Zurückholen</button></div>`).join("")}</div></div>`:""}
    <p class="attr" style="color:var(--scene-ink)">Klima: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (CC BY 4.0) · Texte: Wikipedia und Wikivoyage (CC BY-SA) · Orte: Open-Meteo, Wikipedia, © OpenStreetMap-Mitwirkende</p></section>`,
  cta:{label:mine.length?"Weiter":"Überspringen"},
  bind(){
    $("#regForm").onsubmit=async e=>{e.preventDefault();const q=$("#regQ").value.trim();if(!q)return;$("#regStatus").textContent="Suche …";$("#regStatus").className="status";$("#regPick").innerHTML="";
      let res=[];try{res=await searchRegions(q)}catch(err){}
      if(!res.length){$("#regStatus").textContent="Nichts gefunden. Versuch eine andere Schreibweise.";$("#regStatus").className="status err";$("#regRes").innerHTML="";return}
      $("#regStatus").textContent="Welcher ist gemeint?";
      $("#regRes").innerHTML=res.map((r,i)=>`<button type="button" data-i="${i}"><span>${esc(r.label)}</span><small>${esc(r.src)}</small></button>`).join("");
      $$("#regRes button").forEach(b=>b.onclick=()=>{regPick=res[+b.dataset.i];$("#regRes").innerHTML="";$("#regStatus").textContent="";showPick()})};
    const showPick=()=>{const p=regPick,sel={};
      $("#regPick").innerHTML=`<div class="callout"><b>${esc(p.label)}</b></div><span class="lbl">Was bietet der Ort?</span>
        <div class="chips" id="pickTags">${Object.keys(VIBES).map(k=>`<button type="button" class="chip" data-k="${k}" aria-pressed="false">${esc(VIBES[k])}</button>`).join("")}</div>
        <span class="lbl">Preisniveau</span><div class="seg" id="pickCost">${[1,2,3].map(c=>`<button type="button" data-k="${c}" aria-pressed="${c===2}">${"€".repeat(c)}</button>`).join("")}</div>
        <label class="small"><input type="checkbox" id="pickFly"> Nur per Flug oder Fähre erreichbar</label>
        <button type="button" class="btn acc" id="pickAdd">Region hinzufügen</button>`;
      let cost=2;
      $("#pickTags").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;const k=b.dataset.k;sel[k]=sel[k]?0:2;b.setAttribute("aria-pressed",!!sel[k])};
      $("#pickCost").onclick=e=>{const b=e.target.closest("button");if(!b)return;cost=+b.dataset.k;$$("#pickCost button").forEach(x=>x.setAttribute("aria-pressed",x===b))};
      $("#pickAdd").onclick=async()=>{
        const tags={};Object.entries(sel).forEach(([k,v])=>{if(v)tags[k]=v});
        if(!Object.keys(tags).length){toast("Wähle mindestens eine Sache, die der Ort bietet.");return}
        $("#pickAdd").disabled=true;
        try{const d=await buildPlace(p,{tags,cost,fly:$("#pickFly").checked,owner:ME.name},t=>{$("#regStatus").textContent=t+" …"});
          S.custom.push(d);D.push(d);save();regPick=null;rerenderKeepScroll();$("#regStatus").textContent=`${d.name} ist dabei. Klima, Wikipedia und Wikivoyage wurden live geladen.`;$("#regStatus").className="status ok";}
        catch(err){$("#regStatus").textContent="Die Daten konnten nicht geladen werden. Bitte prüfe die Internetverbindung und versuch es noch einmal.";$("#regStatus").className="status err";$("#pickAdd").disabled=false}
      };};
    $$("[data-open]").forEach(b=>b.onclick=()=>openSheet(b.dataset.open));
    $$("[data-del]").forEach(b=>b.onclick=()=>{const id=b.dataset.del;S.custom=S.custom.filter(c=>c.id!==id);S.favs=S.favs.filter(f=>f!==id);const i=D.findIndex(d=>d.id===id);if(i>=0)D.splice(i,1);save();rerenderKeepScroll()});
    $$("[data-back]").forEach(b=>b.onclick=()=>{S.excluded=S.excluded.filter(x=>x!==b.dataset.back);save();rerenderKeepScroll()});
  }};
};

VIEW.zeit=()=>({
  html:`<section class="step">${head("zeit","In welchem Monat soll es losgehen und worauf hast du Lust: Hitze, Frische oder Frost?")}
    <div class="card"><span class="lbl">Reisemonat</span><div class="months" id="months">${MS.map((n,i)=>`<button type="button" data-m="${i}" style="--mc:color-mix(in srgb,${SEASONCOL[i]} 40%,var(--card-solid))" aria-pressed="${S.month===i}" aria-label="${MON[i]}">${n}</button>`).join("")}</div></div>
    <div class="card"><span class="lbl">Temperatur am Tag</span><div class="tiles" id="warmTiles">${Object.entries(WARM).map(([k,v])=>`<button type="button" class="tile" data-k="${k}" aria-pressed="${S.warm===k}"><b>${v[0]}</b><small>${v[1]}</small><span style="display:block;height:6px;border-radius:3px;background:linear-gradient(90deg,#4C8BD8,#F2B33D ${clamp((v[2]+6)/37*100,0,100)}%,#E2552B);opacity:${.35+clamp((v[2]+6)/37,0,1)*.65}"></span></button>`).join("")}</div></div>
    <div class="card"><span class="lbl">Reisedauer</span><div class="range"><input type="range" id="nights" min="1" max="28" step="1" value="${S.nights}" aria-label="Anzahl Nächte"><output id="nOut">${S.nights} Nächte</output></div></div></section>`,
  cta:{},
  bind(){
    $("#months").onclick=e=>{const b=e.target.closest("button");if(!b)return;S.month=+b.dataset.m;$$("#months button").forEach(x=>x.setAttribute("aria-pressed",x===b));save()};
    $("#warmTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;S.warm=b.dataset.k;$$("#warmTiles .tile").forEach(x=>x.setAttribute("aria-pressed",x===b));save();Scene.set(...themeNow())};
    $("#nights").oninput=e=>{S.nights=+e.target.value;$("#nOut").textContent=`${S.nights} Nächte`};$("#nights").onchange=save;
  }
});

VIEW.vorort=()=>({
  html:`<section class="step">${head("vorort","Wie bewegst du dich am Ziel und wo schläfst du? Danach richten sich Risiken und Packliste.")}
    <div class="card"><span class="lbl">Unterwegs vor Ort</span><div class="tiles" id="trTiles">${TK.map(k=>tile(k==="auto"?"auto":k,TRA[k],TRA_SUB[k],S.trans===k)).join("")}</div></div>
    <div class="card"><span class="lbl">Unterkunft</span><div class="tiles" id="acTiles">${AK.map(k=>tile(k,ACC[k],ACC_SUB[k],S.accom===k)).join("")}</div></div></section>`,
  cta:{},
  bind(){
    $("#trTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;S.trans=b.dataset.k;$$("#trTiles .tile").forEach(x=>x.setAttribute("aria-pressed",x===b));save()};
    $("#acTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;S.accom=b.dataset.k;$$("#acTiles .tile").forEach(x=>x.setAttribute("aria-pressed",x===b));save()};
  }
});

function statusPill(G,s){return G.ready(s)?`<span class="pill ok">3 Favoriten gewählt</span>`:s.m?`<span class="pill wait">plant noch</span>`:`<span class="pill">noch nicht dabei</span>`}
function inviteBox(){
  const url=inviteURL(),txt=`Plan mit mir die Expedition „${X.meta.name}“ im Fernweh-Kompass: ${url}`;
  return `<div class="invite"><span class="lbl">Einladungslink</span><code>${esc(url)}</code>
    <div class="field"><button type="button" class="btn solid" id="copyInv">Link kopieren</button>${navigator.share?`<button type="button" class="btn" id="shareInv">Teilen</button>`:""}<a class="btn" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Per WhatsApp</a></div>
    <p class="muted small">Wer den Link hat, kann mitplanen und mitlesen. Teile ihn nur mit deiner Crew.</p></div>`;
}
function bindInvite(){
  const url=inviteURL(),c=$("#copyInv");if(c)c.onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Link kopiert")}catch(e){toast("Kopieren nicht möglich. Markiere den Link von Hand.")}};
  const s=$("#shareInv");if(s)s.onclick=()=>navigator.share({title:"Fernweh-Kompass",text:`Plan mit mir die Expedition „${X.meta.name}“`,url}).catch(()=>{});
}
VIEW.crew=()=>{
  const G=group(),isHost=!X.room||X.room.host;
  const crewEdit=isHost?`<div class="members">${X.meta.crew.map((n,i)=>`<div class="member"><b>${esc(n)}</b>${i===0?`<span class="pill">du</span>`:`<button type="button" class="btn" data-rm="${i}">Entfernen</button>`}</div>`).join("")}</div>
      <form class="field" id="addCrew"><input class="txt" id="crewName" placeholder="Name einer weiteren Person" aria-label="Name einer weiteren Person"><button class="btn solid">Hinzufügen</button></form>`:"";
  const statusList=X.room?`<div class="members">${G.slots.map(s=>`<div class="member"><b>${esc(s.name)}</b>${statusPill(G,s)}</div>`).join("")}</div>
      <p class="muted small"><span class="sync-dot ${Sync.online()?"on":""}"></span>${Sync.online()?`Verbunden mit ${Sync.online()} von ${RELAYS.length} Servern`:"Keine Verbindung. Die Abstimmung wartet, bis du wieder online bist."}</p>`:"";
  return {html:`<section class="step">${head("crew","Mit wem reist du? Lade deine Crew ein. Jede Person wählt ihre eigenen 3 Favoriten, danach entscheidet ihr gemeinsam.")}
    <div class="card"><span class="lbl">Reisegruppe</span><div class="tiles" id="grpTiles">${Object.keys(GRP).map(k=>tile(k,GRP[k],GRP_SUB[k],S.group===k)).join("")}</div></div>
    <div class="card"><h2>${X.room?"Deine Crew":"Andere einladen"}</h2>
      ${isHost?crewEdit:`<p class="muted">Expedition „${esc(G.meta.name)}“ von ${esc(G.meta.host||"")}.</p>`}
      ${X.room?inviteBox():(X.meta.crew.length>1?`<button type="button" class="btn acc" id="mkRoom">Einladungslink erstellen</button><p class="muted small">Der Link enthält einen Schlüssel. Eure Antworten werden verschlüsselt über offene Nostr-Server ausgetauscht, ohne Konto.</p>`:`<p class="muted small">Allein unterwegs? Dann geht es einfach weiter. Sonst füge oben Namen hinzu und erstelle einen Einladungslink.</p>`)}
      ${statusList}</div></section>`,
  cta:{},
  bind(){
    $("#grpTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;S.group=b.dataset.k;$$("#grpTiles .tile").forEach(x=>x.setAttribute("aria-pressed",x===b));if(isHost){X.meta.group=S.group;publishMeta()}save()};
    const f=$("#addCrew");if(f)f.onsubmit=e=>{e.preventDefault();const n=$("#crewName").value.trim();if(!n)return;if(X.meta.crew.some(x=>norm(x)===norm(n))){toast("Der Name ist schon dabei.");return}
      X.meta.crew.push(n);if(S.group==="solo"){S.group=X.meta.crew.length>2?"freunde":"paar"}save();publishMeta();rerenderKeepScroll();const i=$("#crewName");if(i)i.focus()};
    $$("[data-rm]").forEach(b=>b.onclick=()=>{X.meta.crew.splice(+b.dataset.rm,1);save();publishMeta();rerenderKeepScroll()});
    const mk=$("#mkRoom");if(mk)mk.onclick=async()=>{X.room={...newRoom(),host:true};X.meta.host=ME.name;X.meta.group=S.group;store("fk2-exp",X);await Sync.start(X.room,ME);publishMeta();save();rerenderKeepScroll();toast("Einladungslink erstellt")};
    if(X.room)bindInvite();
  }};
};

VIEW.menschen=()=>({
  html:`<section class="step">${head("menschen","Wie viel los darf am Ziel sein? Das verändert, welche Monate und Orte vorne liegen.")}
    <div class="card"><div class="tiles two" id="crTiles">${Object.entries(CROWDS).map(([k,v])=>`<button type="button" class="tile" data-k="${k}" aria-pressed="${S.crowd===k}"><b>${v[0]}</b><small>${v[1]}</small></button>`).join("")}</div></div></section>`,
  cta:{},
  bind(){$("#crTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;S.crowd=b.dataset.k;$$("#crTiles .tile").forEach(x=>x.setAttribute("aria-pressed",x===b));save()}}
});
VIEW.budget=()=>({
  html:`<section class="step">${head("budget","Ganz grob: wie viel möchtest du ausgeben? Gemeint sind Unterkunft, Essen und Aktivitäten vor Ort, ohne Anreise.")}
    <div class="card"><div class="tiles two" id="budTiles">${Object.entries(BUDGETS).map(([k,v])=>`<button type="button" class="tile" data-k="${k}" aria-pressed="${S.budget==k}"><b>${"€".repeat(+k)} ${v[0]}</b><small>${v[1]}</small></button>`).join("")}</div></div></section>`,
  cta:{label:"Möglichkeiten zeigen"},
  bind(){$("#budTiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;S.budget=+b.dataset.k;$$("#budTiles .tile").forEach(x=>x.setAttribute("aria-pressed",x===b));save()}}
});

/* ---------- Möglichkeiten und Favoriten ---------- */
function destCard(d,s,rank){
  const m=S.month,r=myReach(d),fav=S.favs.includes(d.id),C=2*Math.PI*24;
  const top=Object.entries(d.tags).filter(([k,v])=>S.vibes.includes(k)&&v>=2).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>`<span class="tag">${esc(VIBES[k])}</span>`).join("");
  const hi=riskList(d).find(x=>x.l===3&&x.on);
  return `<article class="dest${fav?" fav":""}${r.ok===false?" out":""}" data-id="${d.id}">
    <div class="ring"><svg viewBox="0 0 58 58"><circle class="bg" cx="29" cy="29" r="24"/><circle class="fg" cx="29" cy="29" r="24" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-s/100)}"/></svg><span>${s}%</span></div>
    <div><h3>${esc(d.name)}</h3><div class="where">${rank}. Platz · ${esc(d.land)}${d.custom?` · eigene Region${d.owner&&d.owner!==ME.name?" von "+esc(d.owner):""}`:""}</div>
      <div class="tags">${top}<span class="tag">${CROWDL[d.c[m]]}</span>${hi?`<span class="tag warn">${esc(hi.n)}</span>`:""}</div>
      <div class="facts"><span class="${r.ok===false?"over":""}">Anreise <b>${r.h!=null?fmtT(r.h,r.m):"nicht möglich"}</b>${S.mode==="beste"&&r.m?" "+MODES[r.m]:""}</span><span><b>${d.t[m]} °C</b> im ${MS[m]}</span><span><b>${d.r[m]}</b> Regentage</span><span><b>${"€".repeat(d.cost)}</b></span></div></div>
    <div class="dest-actions"><button type="button" class="btn" data-open="${d.id}">Ansehen</button><button type="button" class="star" data-fav="${d.id}" aria-pressed="${fav}">${fav?"★ Favorit":"☆ Favorit"}</button><button type="button" class="link" data-excl="${d.id}">Nicht für mich</button></div></article>`;
}
function toggleFav(id){
  const i=S.favs.indexOf(id);
  if(i>=0)S.favs.splice(i,1);else{if(S.favs.length>=3){toast("Du hast schon 3 Favoriten. Nimm erst einen raus.");return false}S.favs.push(id)}
  save();return true;
}
VIEW.ziele=()=>{
  const list=ranked(),shown=showAll?list:list.slice(0,10);
  const label=S.submitted?"Zur Entscheidungsrunde":`Favoriten abschicken (${S.favs.length}/3)`;
  return {html:`<section class="step wide">${head("ziele","Das passt am besten zu dir. Lies dir an, was jeden Ort besonders macht und welche Risiken es gibt, und wähle deine 3 Favoriten.")}
    <div class="globe-wrap" id="gZ"></div>
    <div class="fav-tray" id="favTray"></div>
    <div class="dest-list" id="destList">${shown.map((o,i)=>destCard(o.d,o.s,i+1)).join("")}</div>
    ${list.length>10?`<button type="button" class="cta ghost" id="moreBtn" style="justify-self:center">${showAll?"Weniger zeigen":`Alle ${list.length} Ziele zeigen`}</button>`:""}</section>`,
  cta:{label,disabled:S.favs.length!==3,hint:S.favs.length===3?"":"Wähle genau 3 Favoriten.",onClick:()=>{S.submitted=true;save();go("runde")}},
  bind(){
    GL=createGlobe($("#gZ"),{height:420,id:"z"});
    const drawPins=()=>{const top=ranked().slice(0,showAll?999:10);
      GL.set({pins:top.map(o=>({id:o.d.id,lon:o.d.lon,lat:o.d.lat,name:o.d.name,cls:(myReach(o.d).ok===false?"out":"in")+(S.favs.includes(o.d.id)?" fav":""),r:S.favs.includes(o.d.id)?8:6,label:S.favs.includes(o.d.id)||top.indexOf(o)<5})),
        crew:S.start?[{lon:S.start.lon,lat:S.start.lat,name:ME.name}]:[]})};
    drawPins();const pts=ranked().slice(0,8).map(o=>[o.d.lon,o.d.lat]);if(S.start)pts.push([S.start.lon,S.start.lat]);GL.fitPoints(pts,0);
    GL.onPin(id=>openSheet(id));
    const tray=()=>{$("#favTray").innerHTML=`<span class="lbl">Favoriten</span>${[0,1,2].map(i=>{const d=destById(S.favs[i]);return `<span class="slot ${d?"full":""}">${d?"★ "+esc(d.name):"frei"}</span>`}).join("")}`;
      const names=S.favs.map(id=>"★ "+((destById(id)||{}).name||"")).join(" · ");
      cta({label:S.submitted?"Zur Entscheidungsrunde":`Favoriten abschicken (${S.favs.length}/3)`,disabled:S.favs.length!==3,hint:S.favs.length===3?names:names?names+` · noch ${3-S.favs.length} frei`:"Wähle genau 3 Favoriten.",onClick:()=>{S.submitted=true;save();go("runde")}})};
    tray();
    $("#destList").onclick=e=>{
      const o=e.target.closest("[data-open]");if(o){openSheet(o.dataset.open);return}
      const f=e.target.closest("[data-fav]");if(f){if(toggleFav(f.dataset.fav)){const on=S.favs.includes(f.dataset.fav);f.setAttribute("aria-pressed",on);f.textContent=on?"★ Favorit":"☆ Favorit";f.closest(".dest").classList.toggle("fav",on);tray();drawPins()}return}
      const x=e.target.closest("[data-excl]");if(x){S.excluded.push(x.dataset.excl);S.favs=S.favs.filter(i=>i!==x.dataset.excl);save();rerenderKeepScroll();toast("Ausgeschlossen. Zurückholen kannst du es unter „Eigene Regionen“.")}
    };
    const mb=$("#moreBtn");if(mb)mb.onclick=()=>{showAll=!showAll;rerenderKeepScroll()};
  }};
};

/* ---------- Detailblatt ---------- */
function openSheet(id){
  const d=destById(id);if(!d)return;RC.clear();
  const m=S.month,rl=riskList(d),on=rl.filter(r=>r.on),off=rl.filter(r=>!r.on),best=bestMonths(d),dl=daylight(d.lat,m);
  const notes=d.seasons.filter(s=>s.m.includes(m)),other=d.seasons.filter(s=>!s.m.includes(m)),crowdNow=d.crowds.find(c=>c.m.includes(m));
  const L=packing(d),all=Object.values(L).flat(),done=all.filter(i=>S.packed[i.n]).length,r=myReach(d),fav=S.favs.includes(d.id);
  const sh=$("#sheet");
  sh.innerHTML=`<div class="sheet-in" role="dialog" aria-modal="true" aria-labelledby="shT">
    <div class="sheet-head"><div><div class="eyebrow" style="color:var(--ink-soft)">${esc(d.land)} · ${fmtCoord(d.lat,d.lon)}</div><h2 id="shT">${esc(d.name)}</h2>
      <div class="facts"><span>Passung <b>${score(d)} %</b></span><span>Anreise <b>${r.h!=null?fmtT(r.h,r.m):"nicht möglich"}</b></span><span><b>${d.t[m]} °C</b> im ${MON[m]}</span></div></div>
      <button type="button" class="icon-btn" data-close aria-label="Schließen" style="color:var(--ink);border-color:var(--line);background:transparent">×</button></div>
    ${d.thumb?`<img class="thumb" src="${esc(d.thumb)}" alt="${esc(d.name)}" loading="lazy">`:""}
    <div class="sec"><h3>Was es besonders macht</h3>${d.scape?`<p>${esc(d.scape)}</p>`:""}${d.wikiText&&d.wikiText!==d.scape?`<p class="muted">${esc(d.wikiText)}</p>`:""}
      ${(d.hl||[]).length?`<ul class="dots">${d.hl.map(h=>`<li>${esc(h)}</li>`).join("")}</ul>`:""}${d.diff?`<p class="muted">Schwierigkeit: ${esc(d.diff)}</p>`:""}</div>
    <div class="sec"><h3>Risiken im ${MON[m]}</h3>${on.map(x=>`<div class="risk" style="--rc:${LVL[x.l][1]}"><span class="bar"></span><div><h4>${esc(x.n)} <span class="lvl">${LVL[x.l][0]}</span></h4><p>${esc(x.x)}</p></div></div>`).join("")||`<p class="muted">Keine besonderen Risiken bekannt.</p>`}
      ${off.length?`<details><summary class="lbl">Andere Monate (${off.length})</summary>${off.map(x=>`<p class="small"><b>${esc(x.n)}</b> (${x.m.map(i=>MS[i]).join(", ")}): ${esc(x.x)}</p>`).join("")}</details>`:""}</div>
    <div class="sec"><h3>Ort und Jahreszeit</h3>
      <div class="kv"><div><span>Tagsüber</span><b>${d.t[m]} °C</b></div><div><span>Nachts etwa</span><b>${nightLow(d,m)} °C</b></div><div><span>Regentage</span><b>${d.r[m]}</b></div><div><span>Tageslicht</span><b style="font-size:14px">${fmtH(dl)}</b></div></div>
      <div class="legend" style="margin-top:10px"><span><i style="background:var(--accent)"></i>Temperatur</span><span><i style="background:#3B8EA5;opacity:.5"></i>Regentage</span><span><i style="background:var(--good);border-radius:50%"></i>Beste Monate für dich</span></div>
      <div class="chart-wrap">${climateChart(d,best)}</div>
      <ul class="dots" style="margin-top:10px">${notes.map(s=>`<li>${esc(s.x)}</li>`).join("")||`<li>Keine Besonderheiten im ${MON[m]}.</li>`}${other.map(s=>`<li class="dim">${s.m.length===12?"Ganzjährig":s.m.map(i=>MS[i]).join("/")}: ${esc(s.x)}</li>`).join("")}</ul>
      ${d.lat<0?`<p class="callout">Südhalbkugel: Die Jahreszeiten sind umgekehrt.</p>`:""}
      <p class="callout"><b>Zelten und Wildcampen:</b> ${esc(d.wild)}</p><p class="callout">Am besten für dich: <b>${best.map(i=>MON[i]).join(", ")}</b></p></div>
    <div class="sec"><h3>Menschen</h3><div class="crowd-meter">${[0,1,2,3].map(i=>`<i class="${i<=d.c[m]?"on":""}"></i>`).join("")}</div>
      <p><b>${CROWDL[d.c[m]]}</b>${d.crowdGuess?" (geschätzt)":""}. ${CROWDTXT[d.c[m]]}</p>
      <div class="who">${(crowdNow?crowdNow.w:["vor allem Einheimische"]).map(w=>`<span>${esc(w)}</span>`).join("")}</div>
      ${d.locals?`<p>${esc(d.locals)}</p>`:""}${crewText(d).map(([h,p])=>`<p><b>${esc(h)}:</b> ${esc(p)}</p>`).join("")}</div>
    <div class="sec"><h3>Packliste</h3><p class="muted">${done} von ${all.length} gepackt · passend zu ${esc(ACC[S.accom])}, ${esc(TRA[S.trans])} und ${MON[m]}</p>
      <div class="pack">${Object.entries(L).map(([cat,items])=>`<div><h4>${cat}</h4>${items.map((i,k)=>`<label class="item${S.packed[i.n]?" done":""}"><input type="checkbox" data-n="${esc(i.n)}" ${S.packed[i.n]?"checked":""}><span>${esc(i.n)}<em>${esc(i.why)}</em></span></label>`).join("")}</div>`).join("")}</div></div>
    ${d.sources&&d.sources.length?`<div class="sec src"><h3>Quellen</h3><p class="muted small">Live geladen am ${esc(d.added||"")}. Andrang und Risiken sind bei eigenen Regionen nur grob erfasst.</p><ul>${d.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("")}</ul></div>`:""}
    <div class="dest-actions"><button type="button" class="star" data-sfav aria-pressed="${fav}">${fav?"★ Favorit":"☆ Als Favorit wählen"}</button>${S.excluded.includes(d.id)?"":`<button type="button" class="btn" data-sexcl>Nicht für mich</button>`}</div></div>`;
  sh.hidden=false;const close=()=>{sh.hidden=true;sh.innerHTML="";document.removeEventListener("keydown",onKey);if(["ziele","runde"].includes(stepNow()))rerenderKeepScroll()};
  const onKey=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",onKey);
  sh.onclick=e=>{if(e.target===sh||e.target.closest("[data-close]"))close()};
  sh.querySelector("[data-close]").focus();
  sh.querySelector("[data-sfav]").onclick=e=>{if(toggleFav(d.id)){const on=S.favs.includes(d.id);e.target.setAttribute("aria-pressed",on);e.target.textContent=on?"★ Favorit":"☆ Als Favorit wählen"}};
  const ex=sh.querySelector("[data-sexcl]");if(ex)ex.onclick=()=>{S.excluded.push(d.id);S.favs=S.favs.filter(f=>f!==d.id);save();close();toast("Ausgeschlossen.")};
  sh.querySelector(".pack").onchange=e=>{const n=e.target.dataset.n;if(!n)return;S.packed[n]=e.target.checked;e.target.closest(".item").classList.toggle("done",e.target.checked);save()};
}

/* ---------- Entscheidungsrunde ---------- */
function autoPC(d){
  const pro=[],con=[],m=S.month,r=myReach(d);
  if(r.h!=null){if(r.ok&&r.ratio<=.6)pro.push(`Kurze Anreise für dich (${fmtT(r.h,r.m)})`);else if(r.ok===false)con.push(`Anreise über deiner Grenze (${fmtT(r.h,r.m)})`)}
  const good=S.vibes.filter(v=>(d.tags[v]||0)>=2).map(v=>VIBES[v]),miss=S.vibes.filter(v=>!d.tags[v]).map(v=>VIBES[v]);
  if(good.length)pro.push("Passt zu: "+good.join(", "));if(miss.length)con.push("Wenig "+miss.slice(0,2).join(" und "));
  if(climFit(d,m)>=.7)pro.push(`${d.t[m]} °C im ${MON[m]}`);if(d.r[m]>=14)con.push(`${d.r[m]} Regentage im ${MON[m]}`);
  if(d.c[m]<=1)pro.push(`Ruhig im ${MON[m]}`);if(d.c[m]===3)con.push("Hochsaison, voll");
  if(S.accom==="zelt"&&/erlaubt|Biwak|Zanocuj|Jedermann|Trekking/i.test(d.wild))pro.push("Legal zelten möglich");else if(acv(d,S.accom)===0)con.push(`${ACC[S.accom]} kaum möglich`);
  riskList(d).filter(x=>x.on&&x.l===3).slice(0,2).forEach(x=>con.push("Risiko: "+x.n));
  if(d.cost>S.budget)con.push("Teurer als dein Budget");
  return {pro,con};
}
let roundTab="vergleich";
VIEW.runde=()=>{
  const G=group(),isHost=!X.room||X.room.host;
  if(!G.open){
    return {html:`<section class="step">${head("runde","Die Runde öffnet, sobald alle Eingeladenen ihre 3 Favoriten gewählt haben.")}
      <div class="card lock"><div class="big">${G.slots.filter(G.ready).length} / ${G.slots.length}</div><p class="muted">haben ihre Favoriten gewählt</p></div>
      <div class="card"><h2>Crew</h2><div class="members">${G.slots.map(s=>`<div class="member"><b>${esc(s.name)}${s.m&&s.m.isMe?" (du)":""}</b>${statusPill(G,s)}</div>`).join("")}</div>
        ${X.room?`<p class="muted small"><span class="sync-dot ${Sync.online()?"on":""}"></span>${Sync.online()?`Verbunden mit ${Sync.online()} von ${RELAYS.length} Servern. Neue Stimmen erscheinen automatisch.`:"Keine Verbindung."}</p>`:""}</div>
      ${!S.submitted?`<div class="card"><p>Du hast deine Favoriten noch nicht abgeschickt.</p><button type="button" class="btn acc" id="toZiele">Zu den Möglichkeiten</button></div>`:`<div class="card"><h2>Deine Favoriten</h2><ul class="dots">${S.favs.map(id=>`<li>${esc((destById(id)||{}).name||id)}</li>`).join("")}</ul><button type="button" class="link" id="toZiele">Favoriten ändern</button></div>`}
      ${X.room&&isHost?`<div class="card">${inviteBox()}<button type="button" class="btn" id="forceOpen">Runde jetzt öffnen</button><p class="muted small">Falls jemand nicht mehr reagiert: Dann entscheidet ihr mit den Favoriten, die schon da sind.</p></div>`:""}
      ${!X.room?`<div class="card"><p>Allein geplant. Lade unter „Wer ist dabei?“ andere ein, wenn ihr gemeinsam entscheiden wollt.</p></div>`:""}</section>`,
    cta:null,
    bind(){const t=$("#toZiele");if(t)t.onclick=()=>go("ziele");const f=$("#forceOpen");if(f)f.onclick=()=>{X.meta.forceOpen=true;store("fk2-exp",X);publishMeta();rerenderKeepScroll()};if(X.room&&isHost)bindInvite()}};
  }
  const opts=G.pool.map(destById),m=S.month,alive=opts.filter(d=>!vetoBy(G,d.id).length);
  const ranking=opts.map(d=>({d,p:points(G,d.id)})).sort((a,b)=>(b.p??-999)-(a.p??-999));
  const pairs=pairsOf(alive.map(d=>d.id)),myOpen=pairs.filter(k=>!(k in S.duels)),nextPair=myOpen[0];
  const doneAll=G.all.every(mm=>pairs.every(k=>k in (mm.duels||{})));
  const lead=ranking[0],second=ranking[1];
  const decided=alive.length===1||(alive.length>1&&doneAll&&lead.p>((second&&second.p!=null)?second.p:-999));
  const cell=(fn)=>opts.map(d=>`<td class="${vetoBy(G,d.id).length?"vetoed":""}">${fn(d)}</td>`).join("");
  const table=`<div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>${opts.map(d=>`<th scope="col" class="${vetoBy(G,d.id).length?"vetoed":""}">${esc(d.name)}<br><span class="mono" style="font-size:11px;color:var(--ink-soft)">${esc(d.land)}</span></th>`).join("")}</tr></thead><tbody>
    <tr><th scope="row">Favorit von</th>${cell(d=>G.all.filter(x=>(x.favs||[]).includes(d.id)).map(x=>esc(x.name)).join(", "))}</tr>
    <tr><th scope="row">Anreise</th>${cell(d=>G.all.map(x=>{const t=trip(x.start,x.mode,d);return `${esc(x.name)}: <b>${fmtT(t.h,t.m)}</b>`}).join("<br>"))}</tr>
    <tr><th scope="row">Klima ${MS[m]}</th>${cell(d=>`${d.t[m]} °C, nachts ~${nightLow(d,m)} °C<br>${d.r[m]} Regentage`)}</tr>
    <tr><th scope="row">Übernachtung</th>${cell(d=>esc(d.wild))}</tr>
    <tr><th scope="row">Landschaft</th>${cell(d=>esc(d.scape||""))}</tr>
    <tr><th scope="row">Schwierigkeit</th>${cell(d=>esc(d.diff||""))}</tr>
    <tr><th scope="row">Reize</th>${cell(d=>(d.hl||[]).map(esc).join("<br>"))}</tr>
    <tr><th scope="row">Größte Gefahr</th>${cell(d=>{const x=riskList(d).find(r=>r.on);return x?`${esc(x.n)} (${LVL[x.l][0]})`:"keine bekannt"})}</tr>
    <tr><th scope="row">Andrang</th>${cell(d=>CROWDL[d.c[m]])}</tr><tr><th scope="row">Kosten</th>${cell(d=>"€".repeat(d.cost))}</tr></tbody></table></div>`;
  const cards=opts.map(d=>{const vb=vetoBy(G,d.id),pc=autoPC(d),p=points(G,d.id),mv=S.votes[d.id];
    const others=G.all.filter(x=>!x.isMe&&(x.votes||{})[d.id]).map(x=>`<span>${esc(x.name)}: ${({up:"dafür",down:"dagegen",veto:"Veto"})[x.votes[d.id]]}</span>`).join("");
    const cmts=G.all.flatMap(x=>((x.comments||{})[d.id]||[]).map((c,i)=>({...c,who:x.name,mine:x.isMe,i})));
    return `<div class="card vcard${vb.length?" vetoed":""}" data-id="${d.id}"><div class="vhead"><h3>${esc(d.name)}</h3><span class="pts">${p===null?"raus":p+" Punkte"}</span></div>
      ${vb.length?`<span class="lvl" style="--rc:var(--risk-hi)">Veto von ${esc(vb.join(", "))}</span>`:""}
      <ul class="pc">${pc.pro.map(x=>`<li class="pro">${esc(x)}</li>`).join("")}${pc.con.map(x=>`<li class="con">${esc(x)}</li>`).join("")}${cmts.map(c=>`<li class="${c.pro?"pro":"con"}"><small>${esc(c.who)}:</small> ${esc(c.txt)}${c.mine?` <button type="button" class="link" data-cdel="${c.i}">löschen</button>`:""}</li>`).join("")}</ul>
      <span class="lbl">Deine Stimme</span><div class="myvote">${["up","down","veto"].map(v=>`<button type="button" data-v="${v}" aria-pressed="${mv===v}">${({up:"Dafür",down:"Dagegen",veto:"Veto"})[v]}</button>`).join("")}</div>
      ${others?`<div class="others">${others}</div>`:""}
      <form class="cform"><input placeholder="Dein Argument, z. B. ich esse keine Muscheln" aria-label="Argument zu ${esc(d.name)}"><button class="btn" data-pro="1">Pro</button><button class="btn" data-pro="0">Contra</button></form></div>`}).join("");
  const maxP=Math.max(1,...ranking.map(o=>o.p??0));
  const duel=alive.length<2?`<p>${alive.length?"Nur noch ein Ziel übrig.":"Alle Ziele haben ein Veto. Nehmt ein Veto zurück oder wählt neue Favoriten."}</p>`:nextPair?(()=>{const [a,b]=nextPair.split("|").map(destById);
      const box=d=>`<button type="button" class="duel-btn" data-w="${d.id}"><h4>${esc(d.name)}</h4><span class="mono muted">${(()=>{const t=myReach(d);return t.h!=null?fmtT(t.h,t.m):""})()} · ${d.t[m]} °C</span><span>${esc(autoPC(d).pro[0]||d.scape||"")}</span><span class="muted">${esc((d.hl||[])[0]||"")}</span></button>`;
      return `<p class="eyebrow" style="margin:0">Dein Duell ${pairs.length-myOpen.length+1} von ${pairs.length}: Wohin lieber?</p><div class="arena">${box(a)}<span class="vs">VS</span>${box(b)}</div><button type="button" class="btn" data-w="draw" style="justify-self:center">Unentschieden</button>`})()
    :`<p>Du hast alle Duelle gespielt.${!doneAll?" Warte auf die anderen.":decided?"":" Gleichstand an der Spitze: Eine Stimme oder ein Argument mehr entscheidet."}</p><button type="button" class="link" id="resetDuels">Meine Duelle neu spielen</button>`;
  const prog=G.all.map(x=>`<span class="pill ${pairs.every(k=>k in (x.duels||{}))?"ok":"wait"}">${esc(x.name)} ${pairs.filter(k=>k in (x.duels||{})).length}/${pairs.length}</span>`).join(" ");
  const verdict=decided?`<div class="card" style="justify-items:center;text-align:center"><div class="stamp">ENTSCHIEDEN<b>${esc(lead.d.name.toUpperCase())}</b>${lead.p} PUNKTE</div><button type="button" class="btn acc" data-open="${lead.d.id}">Dossier und Packliste</button></div>`:"";
  return {html:`<section class="step wide">${head("runde","Vergleicht eure Favoriten, sammelt Argumente, stimmt ab und spielt Duelle, bis ein Ziel vorne liegt.")}
    ${verdict}
    <div class="card"><h2>Die Waage</h2><div class="scale">${ranking.map((o,i)=>`<div class="scale-row${o.p===null?" out":i===0?" lead":""}"><span class="nm">${esc(o.d.name)}</span><span class="barw"><span class="barf" style="width:${o.p===null?0:Math.max(4,o.p/maxP*100)}%"></span></span><span class="mono">${o.p===null?"Veto":o.p+" P"}</span></div>`).join("")}</div>
      <p class="muted small">Favorit +2 · Dafür +2 · Dagegen −2 · Argument ±1 · Duellsieg +3 · Unentschieden +1 · ein Veto streicht das Ziel</p></div>
    <div class="card"><h2>Duelle</h2>${duel}<div class="field" style="gap:6px">${prog}</div></div>
    <h2 style="color:var(--scene-ink);font-size:26px">Vergleich</h2>${table}
    <h2 style="color:var(--scene-ink);font-size:26px">Stimmen und Argumente</h2><div class="vote-grid">${cards}</div></section>`,
  cta:{label:"Für die Gruppe kopieren",onClick:async()=>{try{await navigator.clipboard.writeText(decideText(G));toast("Zusammenfassung kopiert")}catch(e){toast("Kopieren nicht möglich")}}},
  bind(){
    const sc=$("#screen");
    sc.onclick=e=>{
      const o=e.target.closest("[data-open]");if(o){openSheet(o.dataset.open);return}
      const w=e.target.closest("[data-w]");if(w&&nextPair){S.duels[nextPair]=w.dataset.w;save();rerenderKeepScroll();return}
      if(e.target.id==="resetDuels"){S.duels={};save();rerenderKeepScroll();return}
      const card=e.target.closest(".vcard");if(!card)return;const id=card.dataset.id;
      const v=e.target.closest(".myvote button");if(v){S.votes[id]=S.votes[id]===v.dataset.v?null:v.dataset.v;if(!S.votes[id])delete S.votes[id];save();rerenderKeepScroll();return}
      const cd=e.target.closest("[data-cdel]");if(cd){(S.comments[id]||[]).splice(+cd.dataset.cdel,1);save();rerenderKeepScroll()}
    };
    $$(".cform").forEach(f=>f.onsubmit=e=>{e.preventDefault();const id=f.closest(".vcard").dataset.id,t=f.querySelector("input").value.trim();if(!t)return;
      (S.comments[id]=S.comments[id]||[]).push({txt:t,pro:(e.submitter&&e.submitter.dataset.pro)!=="0"});save();rerenderKeepScroll()});
  }};
};
function decideText(G){
  const m=S.month,opts=G.pool.map(destById).map(d=>({d,p:points(G,d.id)})).sort((a,b)=>(b.p??-999)-(a.p??-999));
  let t=`Fernweh-Kompass: ${X.meta.name}\nCrew: ${G.all.map(x=>x.name).join(", ")}\nReise: ${MON[m]}, ${S.nights} Nächte\n`;
  opts.forEach((o,i)=>{const d=o.d;t+=`\n${i+1}. ${d.name} (${d.land}): ${o.p===null?"Veto von "+vetoBy(G,d.id).join(", "):o.p+" Punkte"}\n`;
    t+=`   Anreise: ${G.all.map(x=>{const tr=trip(x.start,x.mode,d);return x.name+" "+fmtT(tr.h,tr.m)}).join(", ")}\n`;
    if((d.hl||[]).length)t+=`   Reize: ${d.hl.join(", ")}\n`;
    const r=riskList(d).find(x=>x.on);if(r)t+=`   Größte Gefahr: ${r.n}\n`;
    const c=G.all.flatMap(x=>((x.comments||{})[d.id]||[]).map(cc=>`${x.name}: ${cc.pro?"+":"–"} ${cc.txt}`));if(c.length)t+=`   Argumente: ${c.join("; ")}\n`;});
  return t;
}

/* ---------- Menü ---------- */
function openMenu(){
  const mn=$("#menu"),G=X?group():null;
  mn.innerHTML=`<div class="menu-in" role="dialog" aria-modal="true" aria-labelledby="mnT"><div class="field" style="justify-content:space-between;align-items:center"><h2 id="mnT">${esc(X?X.meta.name:"Fernweh-Kompass")}</h2><button type="button" class="icon-btn" data-close aria-label="Menü schließen" style="color:var(--ink);border-color:var(--line);background:transparent">×</button></div>
    ${X?`<p class="muted">Du planst als <b>${esc(ME.name)}</b>.${X.room?` <span class="sync-dot ${Sync.online()?"on":""}"></span>${Sync.online()} von ${RELAYS.length} Servern verbunden.`:" Allein, ohne Einladung."}</p>`:""}
    ${X&&X.room?inviteBox():""}
    ${X?`<button type="button" class="btn" data-go="lust">Meine Antworten ändern</button><button type="button" class="btn" data-go="ziele">Zu den Möglichkeiten</button><button type="button" class="btn" data-go="runde">Zur Entscheidungsrunde</button>`:""}
    <button type="button" class="btn" data-go="start">Zum Startbildschirm</button>
    <details><summary class="lbl">So funktioniert die gemeinsame Abstimmung</summary><p class="small">Es gibt keine Konten und keinen eigenen Server. Jede Person speichert ihren Stand verschlüsselt auf mehreren offenen Nostr-Servern (Relays). Der Schlüssel steckt nur im Einladungslink. Die Server sehen nur unlesbaren Text und löschen ihn spätestens nach rund 200 Tagen, wenn sie das unterstützen.</p></details>
    <details><summary class="lbl">Datenquellen</summary><p class="small">Klima eigener Regionen: Open-Meteo.com (CC BY 4.0, ERA5-Reanalyse). Texte: Wikipedia und Wikivoyage (CC BY-SA). Postleitzahlen: © OpenStreetMap-Mitwirkende (ODbL). Weltkarte: Natural Earth. Die Inhalte der festen Ziele sind gerundete Richtwerte. Einreise- und Sicherheitshinweise vor der Reise beim <a href="${AA_URL}" target="_blank" rel="noopener">Auswärtigen Amt</a> prüfen.</p></details>
    <button type="button" class="btn" id="wipe">Alle Daten auf diesem Gerät löschen</button><div id="wipeConfirm" hidden><p class="small">Expedition, Antworten und eigene Regionen auf diesem Gerät werden gelöscht. Was schon an die Crew übertragen wurde, bleibt bei den anderen.</p><button type="button" class="btn acc" id="wipeYes">Ja, löschen</button></div></div>`;
  mn.hidden=false;
  const close=()=>{mn.hidden=true;mn.innerHTML=""};
  mn.onclick=e=>{if(e.target===mn||e.target.closest("[data-close]"))return close();const g=e.target.closest("[data-go]");if(g){close();if(g.dataset.go==="start"){if(X){X.step="start";store("fk2-exp",X)}render()}else go(g.dataset.go)}};
  if(X&&X.room)bindInvite();
  $("#wipe").onclick=()=>{$("#wipeConfirm").hidden=false};
  $("#wipeYes").onclick=()=>{Object.keys(localStorage).filter(k=>k.startsWith("fk2-")).forEach(k=>localStorage.removeItem(k));Sync.stop();location.reload()};
}

/* ---------- Start ---------- */
$("#backBtn").onclick=()=>{const i=STEPS.indexOf(stepNow());if(i<=1){if(X){X.step="start";store("fk2-exp",X)}render()}else go(STEPS[i-1])};
$("#menuBtn").onclick=openMenu;
$("#progress").onclick=e=>{const b=e.target.closest("button");if(b&&!b.disabled)go(b.dataset.s)};
Sync.on(kind=>{
  mergeCustoms();
  const st=stepNow(),typing=document.activeElement&&document.activeElement.matches("#screen input");
  if(kind==="data"&&X&&X.room&&!X.room.host){const meta=Sync.meta();if(meta){X.meta=meta;store("fk2-exp",X)}}
  if(st==="start"&&INVITE&&!typing){render();return}
  if(["crew","runde"].includes(st)&&!typing&&$("#sheet").hidden)rerenderKeepScroll();
});
if(INVITE)Sync.start(INVITE,ME);else if(X&&X.room)Sync.start(X.room,ME).then(()=>save());
render();
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js").catch(()=>{});
