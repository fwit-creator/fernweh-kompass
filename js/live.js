/* Offene Live-Daten ohne Schlüssel und ohne Konto:
   OpenStreetMap Nominatim (Postleitzahlen), Open-Meteo (Orte, Klima aus ERA5), Wikipedia, Wikivoyage.
   Antworten werden lokal zwischengespeichert, damit die freien Dienste geschont werden. */
const LIVE="fk2-live:";
const AA_URL="https://www.auswaertiges-amt.de/de/reiseundsicherheit/reise-und-sicherheitshinweise";
const EU_ID=["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","CH"];
const NO_ADAPTER=EU_ID.filter(c=>!["CY","MT","IE"].includes(c)).concat(["AL","BA","ME","MK","RS","XK","TR","UA","MD","AD","MC","SM","VA"]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cacheGet(k){try{return JSON.parse(localStorage.getItem(LIVE+k))}catch(e){return null}}
function cacheSet(k,v){try{localStorage.setItem(LIVE+k,JSON.stringify(v))}catch(e){}}
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
const hav=(a,b,c,e)=>{const R=x=>x*Math.PI/180,h=Math.sin(R(c-a)/2)**2+Math.cos(R(a))*Math.cos(R(c))*Math.sin(R(e-b)/2)**2;return 2*6371*Math.asin(Math.sqrt(h))};

/* ---------- Startpunkt ---------- */
let lastOSM=0;
async function findStart(q){
  q=q.trim();if(!q)return [];
  const ck="start:"+q.toLowerCase(),c=cacheGet(ck);if(c)return c;
  let out=[];
  if(/^\d{5}$/.test(q)){
    const wait=1100-(Date.now()-lastOSM);if(wait>0)await sleep(wait);lastOSM=Date.now();
    try{
      const j=await getJSON(`https://nominatim.openstreetmap.org/search?postalcode=${q}&country=de&format=jsonv2&limit=1&addressdetails=1`);
      out=j.map(r=>{const a=r.address||{};return {lat:+r.lat,lon:+r.lon,label:`${q} ${a.city||a.town||a.village||a.municipality||a.county||""}`.trim(),src:"osm"}});
    }catch(e){}
    if(!out.length){const p=PLZ[q.slice(0,2)];if(p)out=[{lat:p[0],lon:p[1],label:`${q} (Region ${p[2]})`,src:"table"}]}
  }else{
    try{out=(await searchPlaces(q)).slice(0,5).map(r=>({lat:r.lat,lon:r.lon,label:r.label,src:"om"}))}catch(e){}
    if(!out.length){const low=q.toLowerCase();for(const [k,p] of Object.entries(PLZ))if(p[2].toLowerCase().split(/,\s*/).some(n=>n.startsWith(low))){out=[{lat:p[0],lon:p[1],label:p[2],src:"table"}];break}}
  }
  if(out.length)cacheSet(ck,out);
  return out;
}

/* ---------- Orte und Regionen suchen ---------- */
async function searchPlaces(q){
  const j=await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=de&format=json`);
  return (j.results||[]).map(r=>({name:r.name,lat:r.latitude,lon:r.longitude,elev:r.elevation,cc:(r.country_code||"").toUpperCase(),country:r.country||"",
    label:[r.name,r.admin1,r.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", "),src:"Open-Meteo"}));
}
async function searchWikiPlaces(q){
  const j=await getJSON(`https://de.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=6&prop=coordinates|description&format=json&origin=*`);
  const pages=Object.values((j.query||{}).pages||{}).filter(p=>p.coordinates&&p.coordinates[0]).sort((a,b)=>a.index-b.index);
  return pages.map(p=>({name:p.title,wiki:p.title,lat:p.coordinates[0].lat,lon:p.coordinates[0].lon,cc:"",country:"",
    label:p.title+(p.description?", "+p.description:""),src:"Wikipedia"}));
}
async function searchRegions(q){
  const [a,b]=await Promise.allSettled([searchPlaces(q),searchWikiPlaces(q)]);
  const out=[...(b.status==="fulfilled"?b.value:[]),...(a.status==="fulfilled"?a.value:[])];
  return out.filter((r,i)=>out.findIndex(o=>hav(o.lat,o.lon,r.lat,r.lon)<3&&o.name===r.name)===i).slice(0,8);
}
async function countryOf(lat,lon){
  const ck=`cc:${lat.toFixed(1)},${lon.toFixed(1)}`,c=cacheGet(ck);if(c)return c;
  const wait=1100-(Date.now()-lastOSM);if(wait>0)await sleep(wait);lastOSM=Date.now();
  const j=await getJSON(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=3&format=jsonv2&accept-language=de`);
  const r={cc:((j.address||{}).country_code||"").toUpperCase(),country:(j.address||{}).country||""};cacheSet(ck,r);return r;
}

/* ---------- Klima (Open-Meteo, Reanalyse ERA5, 2016 bis 2025) ---------- */
async function climateNormals(lat,lon){
  const ck=`clim:${lat.toFixed(2)},${lon.toFixed(2)}`,c=cacheGet(ck);if(c)return c;
  const j=await getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2016-01-01&end_date=2025-12-31&daily=temperature_2m_max,precipitation_sum&timezone=auto`);
  const sT=Array(12).fill(0),nT=Array(12).fill(0),wet=Array(12).fill(0),yrs=new Set();
  j.daily.time.forEach((d,i)=>{const m=+d.slice(5,7)-1,t=j.daily.temperature_2m_max[i],p=j.daily.precipitation_sum[i];yrs.add(d.slice(0,4));if(t!=null){sT[m]+=t;nT[m]++}if(p!=null&&p>=1)wet[m]++});
  const ny=yrs.size||10;
  const r={t:sT.map((s,m)=>Math.round(s/Math.max(1,nT[m]))),r:wet.map(w=>Math.round(w/ny)),elev:j.elevation};
  cacheSet(ck,r);return r;
}

/* ---------- Wikipedia und Wikivoyage ---------- */
async function wikiSummary(title){
  const j=await getJSON(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g,"_"))}`);
  if(j.type==="disambiguation")throw new Error("mehrdeutig");
  return {title:j.title,extract:j.extract||"",url:(j.content_urls&&j.content_urls.desktop&&j.content_urls.desktop.page)||`https://de.wikipedia.org/wiki/${encodeURIComponent(j.title)}`,thumb:j.thumbnail&&j.thumbnail.source};
}
async function voyage(title){
  const j=await getJSON(`https://de.wikivoyage.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`);
  const p=Object.values((j.query||{}).pages||{})[0];
  if(!p||p.missing!==undefined||!p.extract)return null;
  const parts=p.extract.split(/\n={2,4}\s*(.+?)\s*={2,4}\n/),sec={};
  for(let i=1;i<parts.length;i+=2){const k=parts[i].trim();if(!sec[k])sec[k]=(parts[i+1]||"").trim()}
  return {title:p.title,url:`https://de.wikivoyage.org/wiki/${encodeURIComponent(p.title.replace(/ /g,"_"))}`,intro:parts[0].trim(),sec};
}
const clean=t=>(t||"").replace(/[​-‍﻿]/g,"").replace(/\s*\[[^\]]{0,40}\]/g,"").replace(/\(\s*\)/g,"");
const sentences=(t,n,max=320)=>{const c=clean(t).replace(/\s+/g," ").trim(),s=c.match(/[^.!?]+[.!?]+/g)||(c?[c]:[]);let o=s.slice(0,n).join(" ").trim();if(o.length>max)o=o.slice(0,max).replace(/\s\S*$/,"")+" …";return o};
const secFind=(v,names)=>{if(!v)return "";for(const n of names){const k=Object.keys(v.sec).find(s=>s.toLowerCase().startsWith(n));if(k&&v.sec[k])return v.sec[k]}return ""};

/* ---------- Eigenen Ort zusammenbauen ---------- */
async function buildPlace(geo,opt,progress){
  const say=t=>progress&&progress(t);
  say("Klima von Open-Meteo laden");
  const climP=climateNormals(geo.lat,geo.lon);
  const ccP=geo.cc?Promise.resolve({cc:geo.cc,country:geo.country}):countryOf(geo.lat,geo.lon).catch(()=>({cc:"",country:""}));
  const wikiTitle=geo.wiki||geo.name;
  const wikiP=wikiSummary(wikiTitle).catch(()=>null);
  const voyP=voyage(wikiTitle).catch(()=>null);
  const [clim,cc,wiki,voy]=await Promise.all([climP,ccP,wikiP,voyP]);
  say("Daten zusammenführen");
  const t=clim.t,r=clim.r,elev=Math.max(geo.elev||0,clim.elev||0),tags=opt.tags||{};
  const isDE=cc.cc==="DE",air=hav(51.2,10.4,geo.lat,geo.lon);
  const env=[];
  if(Math.max(...t)>=26)env.push("sonne");if(Math.min(...t)<=1)env.push("kalt");if(elev>=1500)env.push("hoehe");
  if(tags.strand||tags.wasser)env.push("meer");if(tags.wildnis||tags.wasser)env.push("muecken");
  if(geo.lat>44&&geo.lat<61&&geo.lon>-6&&geo.lon<32)env.push("zecken");if(tags.stadt)env.push("stadt");
  const tr=[tags.berge||tags.wildnis?3:2,2,tags.roadtrip?3:2,tags.stadt?3:1,tags.wasser?3:1,2].join("");
  const ac=[tags.stadt?0:2,tags.berge?2:1,tags.stadt?3:1,3,3,tags.stadt?0:2].join("");
  const risks=[];
  const sich=secFind(voy,["sicherheit"]),ges=secFind(voy,["gesundheit"]);
  if(sich)risks.push({n:"Sicherheit (Wikivoyage)",l:1,x:sentences(sich,2)});
  if(ges)risks.push({n:"Gesundheit (Wikivoyage)",l:1,x:sentences(ges,2)});
  const coldM=t.map((v,i)=>v<=-3?i:-1).filter(i=>i>=0);
  if(coldM.length)risks.push({n:"Strenge Kälte",l:2,m:coldM,x:"Tageshöchstwerte unter -3 °C. Erfrierungsgefahr bei Wind, Ausrüstung entsprechend wählen."});
  if(!isDE)risks.push({n:"Reise- und Sicherheitshinweise",l:1,x:"Vor der Reise die aktuellen Hinweise des Auswärtigen Amts zu "+(cc.country||"diesem Land")+" lesen."});
  const unterkunft=secFind(voy,["unterkunft","übernachtung"]);
  const campLine=(unterkunft.match(/[^.!?]*(camp|zelt|wildcamp|biwak)[^.!?]*[.!?]/i)||[])[0];
  const nice=[...Array(12).keys()].filter(i=>t[i]>=16&&t[i]<=27&&r[i]<=11);
  const seasons=[];
  if(nice.length)seasons.push({m:nice,x:"Angenehmes Wetter: 16 bis 27 °C am Tag und wenige Regentage (Open-Meteo, 2016 bis 2025)."});
  const klima=secFind(voy,["klima","reisezeit","beste reisezeit"]);
  const klimaTxt=sentences(klima,1);if(klimaTxt.length>30&&!/^siehe/i.test(klimaTxt))seasons.push({m:[...Array(12).keys()],x:klimaTxt+" (Wikivoyage)"});
  const sights=secFind(voy,["sehenswürdigkeiten","aktivitäten"]);
  const hl=[...new Set(clean(sights).split("\n").map(l=>l.replace(/^[\s*•\-\d.]+/,"").split(/\s{2,}|[.:(–—]|\s-\s/)[0].trim()).filter(l=>l.length>=3&&l.length<=60&&!/^\d/.test(l)))].slice(0,3);
  const lang=secFind(voy,["sprache","leute","regeln"]);
  const sources=[{title:"Klima: Open-Meteo, ERA5-Reanalyse 2016 bis 2025",url:"https://open-meteo.com/"}];
  if(wiki)sources.push({title:"Wikipedia: "+wiki.title,url:wiki.url});
  if(voy)sources.push({title:"Wikivoyage: "+voy.title,url:voy.url});
  if(!isDE)sources.push({title:"Auswärtiges Amt: Reise- und Sicherheitshinweise",url:AA_URL});
  return {id:"u-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),custom:true,owner:opt.owner||"",added:new Date().toISOString().slice(0,10),
    name:(geo.name||"Ort").slice(0,60),land:cc.country||geo.country||"",lat:+geo.lat.toFixed(3),lon:+geo.lon.toFixed(3),
    dist:air<700?1:air<2500?2:3,cost:opt.cost||2,fam:2,
    doc:isDE?"Personalausweis":EU_ID.includes(cc.cc)?"Personalausweis genügt":"Reisepass; Einreisebestimmungen beim Auswärtigen Amt prüfen",
    tags,t,r,c:[1,1,1,1,1,2,2,2,1,1,1,1],crowdGuess:true,env,tr,ac,
    wild:campLine?campLine.trim()+" (Wikivoyage)":"Keine Angaben gefunden. Regeln zum Zelten vor Ort prüfen.",
    risks,seasons,locals:sentences(lang,2)||"",crowds:[{m:[...Array(12).keys()],w:["Keine Daten zum Andrang. Geschätzt: Sommerferien voller."]}],
    scape:wiki?sentences(wiki.extract,2,260):sentences(voy&&voy.intro,2,260),diff:elev>=1500?"Gebirge, Touren teils anspruchsvoll":"Je nach Tour",hl,
    reach:opt.fly||air>3800?"fly":"land",rail:isDE?2:1,adapter:!!cc.cc&&!NO_ADAPTER.includes(cc.cc)&&!isDE,
    thumb:wiki&&wiki.thumb||"",wikiText:wiki?sentences(wiki.extract,4,600):"",live:true,sources};
}
