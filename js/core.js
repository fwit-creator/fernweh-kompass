// Bewertungs-, Risiko-, Packlisten- und Klimalogik (übernommen und angepasst).
function climFit(d,m){
  const target=WARM[S.warm][2];
  let c=clamp(1-Math.abs(d.t[m]-target)/14,0,1);
  return c*(1-clamp((d.r[m]-6)/20,0,.6));
}
function crowdFit(d,m){const c=d.c[m];return S.crowd==="meiden"?1-c/3:S.crowd==="suchen"?.4+c/5:1}
function bestMonths(d){return [...Array(12).keys()].map(m=>({m,s:climFit(d,m)*.75+crowdFit(d,m)*.25})).sort((a,b)=>b.s-a.s).slice(0,3).map(o=>o.m).sort((a,b)=>a-b)}

const rad=x=>x*Math.PI/180;
function bearing(lat,lon){
  const [a,b]=ORIGIN.map(rad),[c,e]=[rad(lat),rad(lon)];
  const y=Math.sin(e-b)*Math.cos(c),x=Math.cos(a)*Math.sin(c)-Math.sin(a)*Math.cos(c)*Math.cos(e-b);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
function distance(lat,lon){
  const [a,b]=ORIGIN.map(rad),[c,e]=[rad(lat),rad(lon)];
  const h=Math.sin((c-a)/2)**2+Math.cos(a)*Math.cos(c)*Math.sin((e-b)/2)**2;
  return 2*6371*Math.asin(Math.sqrt(h));
}
function daylight(lat,m){
  const N=[15,46,74,105,135,166,196,227,258,288,319,349][m];
  const dec=rad(23.44)*Math.sin(2*Math.PI*(284+N)/365);
  const x=-Math.tan(rad(lat))*Math.tan(dec);
  if(x<=-1)return 24; if(x>=1)return 0;
  return 2*Math.acos(x)*180/Math.PI/15;
}
const fmtH=h=>h>=24?"24 h (Mitternachtssonne)":h<=0?"0 h (Polarnacht)":`${Math.floor(h)} h ${String(Math.round((h%1)*60)).padStart(2,"0")} min`;
const fmtCoord=(lat,lon)=>`${Math.abs(lat).toFixed(1).replace(".",",")}° ${lat<0?"S":"N"} · ${Math.abs(lon).toFixed(1).replace(".",",")}° ${lon<0?"W":"O"}`;
const dirName=b=>["N","NO","O","SO","S","SW","W","NW"][Math.round(b/45)%8];
const tripYear=m=>{const now=new Date();return m>=now.getMonth()?now.getFullYear():now.getFullYear()+1};

const SEASONW={frühling:3,sommer:6,herbst:9,winter:0};
function detect(txt){
  const t=" "+txt.toLowerCase()+" ",found={v:[],a:null,t:null,g:null,b:null,c:null,m:null};
  KW.forEach(([k,val,words])=>{if(words.some(w=>t.includes(w))){if(k==="v"){if(!found.v.includes(val))found.v.push(val)}else if(found[k]===null)found[k]=val}});
  MON.forEach((n,i)=>{if(t.includes(n.toLowerCase()))found.m=i});
  if(found.m===null)Object.entries(SEASONW).forEach(([w,i])=>{if(t.includes(w))found.m=i});
  return found;
}

const SEASONCOL=["#9DB8C9","#A9C2CF","#B9D2A8","#C6DB9B","#D6DE8E","#EED27C","#F1C46E","#EBB86A","#D8B27A","#C9A27E","#AEB6B4","#9DB0C4"];
const CROWDL=["Einsam","Entspannt","Belebt","Überlaufen"];

/* ---------- Risiken ---------- */
function riskList(d){
  const m=S.month,out=d.risks.map(r=>({...r,on:!r.m||r.m.includes(m)}));
  const t=d.t[m],low=nightLow(d,m);
  if(trv(d,S.trans)===0){const alt=TK.filter(k=>trv(d,k)>=3).map(k=>TRA[k]).join(" oder ")||TK.filter(k=>trv(d,k)>=2).map(k=>TRA[k]).join(" oder ");
    out.push({n:`${TRA[S.trans]} passt hier kaum`,l:2,on:true,x:`Infrastruktur oder Gelände spielen nicht mit. Besser: ${alt}.`})}
  if(acv(d,S.accom)===0){const alt=AK.filter(k=>acv(d,k)>=3).map(k=>ACC[k]).join(" oder ");
    out.push({n:`${ACC[S.accom]} schwer umsetzbar`,l:2,on:true,x:`${d.wild} Besser: ${alt}.`})}
  if(S.accom==="zelt"&&d.env.includes("wind"))out.push({n:"Zelt im Sturm",l:2,on:true,x:"Sturmfestes Tunnel- oder Kuppelzelt, alle Abspannleinen nutzen, windgeschützten Platz wählen."});
  if((S.accom==="zelt"||S.accom==="camper")&&low<=4)out.push({n:"Kalte Nächte",l:2,on:true,x:`Nachts etwa ${low} °C. Schlafsack und Isomatte danach auswählen.`});
  if(S.trans==="moto"&&d.r[m]>=12)out.push({n:"Nasse Fahrbahn",l:2,on:true,x:`${d.r[m]} Regentage im ${MON[m]}: Haftung und Sicht sind oft schlecht.`});
  if(S.trans==="rad"&&t>=30)out.push({n:"Radeln in der Hitze",l:2,on:true,x:"Etappen vor 11 Uhr beenden, alle 20 Minuten trinken."});
  if(t>=33&&!out.some(r=>/hitze/i.test(r.n)))out.push({n:"Hitze",l:2,on:true,x:`Tagsüber um ${t} °C. Aktivitäten in die Morgenstunden legen.`});
  if(d.r[m]>=18&&!out.some(r=>/monsun|regen/i.test(r.n)))out.push({n:"Viel Regen",l:1,on:true,x:`Rund ${d.r[m]} Regentage im ${MON[m]}. Pläne flexibel halten, Ausrüstung wasserdicht verpacken.`});
  return out.sort((a,b)=>(b.on-a.on)||(b.l-a.l));
}
const LVL={3:["hoch","var(--risk-hi)"],2:["mittel","var(--risk-mid)"],1:["gering","var(--risk-lo)"]};

/* ---------- Packliste ---------- */
function nightLow(d,m){const sp=d.env.includes("wueste")?15:d.env.includes("hoehe")?11:d.env.includes("tropen")?7:8;return d.t[m]-sp}
function packing(d){
  const m=S.month,t=d.t[m],r=d.r[m],low=nightLow(d,m),L={};
  const add=(cat,n,why)=>{(L[cat]=L[cat]||[]);if(!L[cat].some(i=>i.n===n))L[cat].push({n,why})};
  const P="Papiere & Geld",K="Kleidung",N="Schlafen & Lager",U="Unterwegs",G="Gesundheit",T="Technik",C="Crew";
  add(P,d.doc,d.land==="Deutschland"?"Basis":"Einreise");if(d.land!=="Deutschland")add(P,"Auslandskrankenversicherung","Pflicht");add(P,"Kreditkarte und etwas Bargeld","Basis");
  add(P,"Kopien der Dokumente in der Cloud","Basis");
  if(d.dist===3)add(G,"Impfstatus beim Tropen- oder Reisearzt prüfen","Fernreise");
  add(T,"Ladekabel und Powerbank","Basis");add(G,"Reiseapotheke: Pflaster, Schmerzmittel, Blasenpflaster","Basis");
  if(d.adapter)add(T,"Reisestecker-Adapter","Steckdosen");
  if(d.id==="schottland")add(T,"Adapter für UK-Steckdosen (Typ G)","Steckdosen");
  // Klima
  if(t>=28){add(K,"Leichte, luftige Kleidung (Leinen, Funktionsshirts)",`${t} °C`);add(K,"Sonnenhut mit Krempe",`${t} °C`);add(U,"Trinkflasche, mindestens 1,5 l",`${t} °C`);add(G,"Elektrolyt-Tabletten","Hitze")}
  else if(t>=20){add(K,"T-Shirts und kurze Hosen",`${t} °C`);add(K,"Leichte Jacke für den Abend",`nachts ~${low} °C`)}
  else if(t>=12){add(K,"Fleece- oder Wollpullover",`${t} °C`);add(K,"Softshelljacke",`${t} °C`);add(K,"Lange Hose","mild")}
  else if(t>=3){add(K,"Daunen- oder Kunstfaserjacke",`${t} °C`);add(K,"Mütze und Handschuhe",`${t} °C`);add(K,"Merino-Unterwäsche","kühl")}
  else{add(K,"Thermo-Unterwäsche (zwei Lagen)",`${t} °C`);add(K,"Dicke Daunenjacke mit Kapuze",`${t} °C`);add(K,"Fäustlinge und Sturmhaube",`${t} °C`);add(K,"Gefütterte Winterstiefel",`${t} °C`);add(G,"Handwärmer","Frost")}
  if(r>=10){add(K,"Wasserdichte Regenjacke (Hardshell)",`${r} Regentage`);add(K,"Regenhose",`${r} Regentage`);add(U,"Wasserdichte Packsäcke",`${r} Regentage`)}
  else if(r>=5)add(K,"Leichte Regenjacke",`${r} Regentage`);
  const E=d.env;
  if(E.includes("sonne")||t>=24){add(G,"Sonnencreme LSF 50","UV");add(U,"Sonnenbrille","UV")}
  if(E.includes("hoehe")){add(U,"Gletscherbrille Kategorie 4","Höhe");add(G,"Höhenmedikamente mit Ärztin oder Arzt besprechen","Höhe");add(G,"Lippenpflege mit LSF","Höhe")}
  if(E.includes("meer")){add(K,"Badesachen und Mikrofaserhandtuch","Meer");add(K,"Badeschuhe","Felsküste")}
  if(E.includes("muecken")&&(t>=10)){add(G,"Mückenschutz (Icaridin oder DEET)","Mücken");if(d.id==="schottland"||d.id==="lappland")add(G,"Mücken-Kopfnetz","Mücken")}
  if(E.includes("zecken"))add(G,"Zeckenzange oder Zeckenkarte","Zecken");
  if(E.includes("tropen")){add(N,"Moskitonetz","Tropen");add(K,"Langärmlige, dünne Kleidung für abends","Mücken")}
  if(E.includes("wind")){add(K,"Winddichte Jacke","Wind");add(K,"Schlauchtuch (Buff)","Wind")}
  if(E.includes("wueste")){add(K,"Halstuch gegen Staub","Wüste");add(U,"Stirnlampe","Wüste")}
  if(E.includes("abgelegen")){add(T,"Offline-Karten auf dem Handy","abgelegen");add(G,"Erweitertes Erste-Hilfe-Set","abgelegen");add(T,"Satelliten-Messenger oder Notsender (PLB)","kein Netz")}
  if(E.includes("religioes"))add(K,"Kleidung, die Schultern und Knie bedeckt, plus Tuch","Respekt");
  if(E.includes("schlangen"))add(K,"Feste, knöchelhohe Schuhe","Schlangen");
  if(E.includes("magen")){add(U,"Wasserfilter oder Entkeimungstabletten","Trinkwasser");add(G,"Durchfallmittel","Magen")}
  if(E.includes("stadt"))add(K,"Bequeme Laufschuhe mit Profil","Stadt");
  if(daylight(d.lat,m)>=20)add(N,"Schlafmaske",`${fmtH(daylight(d.lat,m))} Licht`);
  if(daylight(d.lat,m)<=7)add(U,"Stirnlampe mit Ersatzakku","kurze Tage");
  // Unterkunft
  const A=S.accom;
  if(A==="zelt"){const sb=Math.floor((low-3)/5)*5;
    add(N,E.includes("wind")?"Sturmfestes Zelt mit Extra-Heringen":"Zelt mit Heringen","Zelt");
    add(N,`Schlafsack, Komfort ${sb} °C`,`nachts ~${low} °C`);add(N,low<=5?"Isomatte mit R-Wert ab 4":"Isomatte","Zelt");
    add(N,"Kocher und Topf (Gaskartusche vor Ort kaufen)","Zelt");add(N,"Feuerzeug, Löffel, Tasse","Zelt");add(U,"Stirnlampe","Zelt");add(N,"Müllbeutel (alles wieder mitnehmen)","Zelt")}
  if(A==="huette"){add(N,"Hüttenschlafsack","Hütte");add(N,"Ohrstöpsel","Hütte");add(N,"Leichte Hüttenschuhe","Hütte");add(P,"Bargeld (oft keine Kartenzahlung)","Hütte");add(U,"Stirnlampe","Hütte")}
  if(A==="hostel"){add(N,"Vorhängeschloss für den Spind","Hostel");add(N,"Ohrstöpsel und Schlafmaske","Hostel");add(N,"Badelatschen für die Dusche","Hostel");add(N,"Mikrofaserhandtuch","Hostel")}
  if(A==="hotel"){add(K,"Ein schickeres Outfit fürs Abendessen","Hotel")}
  if(A==="fewo"){add(N,"Gewürze, Öl und Kaffee in Minidosen","Ferienwohnung");add(N,"Spülschwamm und Geschirrtuch","Ferienwohnung");add(U,"Faltbare Einkaufstasche","Ferienwohnung")}
  if(A==="camper"){add(N,"Auffahrkeile","Camper");add(N,"Stromadapter (CEE) und Kabeltrommel","Camper");add(N,"Campingstühle und Faltschüssel","Camper");add(N,"Biologisch abbaubares Spülmittel","Camper")}
  // Fortbewegung
  const Tr=S.trans;
  if(Tr==="fuss"){add(U,"Eingelaufene Wanderschuhe","zu Fuß");add(U,"Wanderstöcke","zu Fuß");add(U,"Tages- oder Trekkingrucksack mit Regenhülle","zu Fuß");add(T,"Wander-App mit Offline-Karte und Papierkarte","zu Fuß")}
  if(Tr==="rad"){add(U,"Helm","Fahrrad");add(U,"Flickzeug, Pumpe, Multitool","Fahrrad");add(K,"Radhose mit Polster","Fahrrad");add(U,"Fahrradschloss und Rücklicht","Fahrrad");add(U,"Wasserdichte Packtaschen","Fahrrad")}
  if(Tr==="auto"){add(P,"Führerschein"+(d.dist===3||["marokko","schottland"].includes(d.id)?" plus internationaler Führerschein":""),"Mietwagen");add(P,"Kreditkarte für die Kaution","Mietwagen");add(T,"Kfz-Ladekabel und Handyhalterung","Mietwagen");add(T,"Offline-Navigation","Mietwagen")}
  if(Tr==="zug"){add(T,"Ticket-Apps installiert","Zug & Bus");add(U,"Snacks und Wasser für lange Fahrten","Zug & Bus");add(T,"Kopfhörer","Zug & Bus")}
  if(Tr==="boot"){add(U,"Wasserdichte Handyhülle","Boot");add(U,"Wasserdichte Packsäcke","Boot");add(G,"Mittel gegen Seekrankheit","Boot");add(K,"Schnell trocknende Kleidung","Boot")}
  if(Tr==="moto"){add(K,"Motorradkombi mit Protektoren","Motorrad");add(K,"Regenkombi","Motorrad");add(P,"Führerschein Klasse A","Motorrad");add(U,"Bordwerkzeug und Kettenspray","Motorrad")}
  // Gruppe
  const g=S.group;
  if(g==="familie"){add(P,"Kinderreisepässe oder Kinderausweise","Familie");add(G,"Kinder-Reiseapotheke (Fiebersaft, Elektrolyte)","Familie");add(C,"Beschäftigung: Kartenspiel, Hörbücher, Malzeug","Familie");add(C,"Snack-Vorrat","Familie");add(G,"Kindersonnencreme LSF 50+","Familie")}
  if(g==="freunde"||g==="gruppe"){add(C,"Gruppenkassen-App eingerichtet","Freunde");add(C,"Kartenspiel","Freunde");add(C,"Gemeinsame Ausrüstung aufteilen (ein Kocher reicht)","Freunde")}
  if(g==="gruppe")add(C,"Teilnehmerliste mit Notfallkontakten","Gruppe");
  if(g==="paar")add(C,"Gemeinsame Ausrüstung aufteilen: Zelt, Kocher, Apotheke","Paar");
  if(g==="solo"){add(C,"Reiseroute bei einer Vertrauensperson hinterlegen","Allein");add(C,"Türstopper-Alarm für die Unterkunft","Allein")}
  // Lust
  if(S.vibes.includes("schnee")&&t<5)add(U,"Grödel oder Spikes für die Schuhe","Schnee");
  if(S.vibes.includes("party"))add(K,"Ausgeh-Outfit","Nachtleben");
  if(S.vibes.includes("wasser")&&E.includes("meer"))add(U,"Schnorchel und Maske","Wasser");
  return L;
}


function climateChart(d,best){
  const W=640,H=200,pl=34,pr=34,pt=16,pb=26,cw=(W-pl-pr)/12;
  let lo=Math.min(0,...d.t)-4,hi=Math.max(...d.t)+4;lo=Math.floor(lo/10)*10;hi=Math.ceil(hi/10)*10;
  const y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb),yr=v=>H-pb-v/31*(H-pt-pb);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Klimadiagramm ${esc(d.name)}">`;
  s+=`<rect class="selcol" x="${pl+S.month*cw}" y="${pt}" width="${cw}" height="${H-pt-pb}"/>`;
  for(let v=lo;v<=hi;v+=10){s+=`<line class="${v===0?"zero":"grid-l"}" x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${pl-6}" y="${y(v)+3}" text-anchor="end">${v}°</text>`}
  [0,10,20,30].forEach(v=>s+=`<text class="ax" x="${W-pr+6}" y="${yr(v)+3}">${v}</text>`);
  d.r.forEach((v,i)=>s+=`<rect class="rainbar${i===S.month?" sel":""}" x="${pl+i*cw+cw*.28}" y="${yr(v)}" width="${cw*.44}" height="${H-pb-yr(v)}" rx="2"/>`);
  const pts=d.t.map((v,i)=>[pl+i*cw+cw/2,y(v)]);
  s+=`<path class="tarea" d="M${pts[0][0]},${H-pb} L${pts.map(p=>p.join(",")).join(" L")} L${pts[11][0]},${H-pb}Z"/>`;
  s+=`<polyline class="tline" points="${pts.map(p=>p.join(",")).join(" ")}"/>`;
  pts.forEach((p,i)=>s+=`<circle class="tdot${i===S.month?" sel":""}" cx="${p[0]}" cy="${p[1]}" r="${i===S.month?5:3.5}"/>`);
  MS.forEach((n,i)=>{s+=`<text class="ax" x="${pl+i*cw+cw/2}" y="${H-8}" text-anchor="middle">${n}</text>`;if(best.includes(i))s+=`<circle class="best" cx="${pl+i*cw+cw/2}" cy="${pt-6}" r="4"/>`});
  return s+"</svg>";
}
function crewText(d){
  const m=S.month,out=[],hi=riskList(d).filter(r=>r.on&&r.l===3);
  switch(S.group){
    case"solo":out.push(["Allein unterwegs","Du bist flexibler und kommst schneller ins Gespräch. "+(acv(d,"hostel")>=2?"Hostels sind hier gute Treffpunkte für Gleichgesinnte.":"Hostels gibt es kaum, Kontakte entstehen eher auf Touren und in Unterkünften.")]);
      if(d.env.includes("abgelegen"))out.push(["Sicherheit","Abgelegene Etappen: Route und geplante Rückkehr bei jemandem hinterlegen."]);break;
    case"paar":out.push(["Zu zweit","Ihr teilt Gewicht und Kosten: Zelt, Kocher und Apotheke nur einmal einpacken."]);
      if(d.c[m]>=3)out.push(["Zweisamkeit","Die schönsten Orte sind in der Hochsaison voll. Wer früh startet, hat sie für sich."]);break;
    case"familie":out.push([`Kinderfreundlichkeit ${d.fam} von 3`,d.fam>=3?"Gut für Kinder: kurze Wege, Infrastruktur und Ausweichprogramm sind da.":d.fam===2?"Machbar mit Planung: Etappen kürzen und Ruhetage einbauen.":"Anspruchsvoll für Kinder. Eher für ältere, erfahrene Kinder geeignet."]);
      if(hi.length)out.push(["Besonders achten auf",hi.map(r=>r.n).join(", ")+"."]);
      if(d.env.includes("hoehe"))out.push(["Höhe","Kinder akklimatisieren schlechter und klagen spät. Schlafhöhe niedrig halten."]);break;
    case"freunde":out.push(["Mit Freunden","Klärt vorab Budget und Tempo, das sind die häufigsten Streitpunkte."]);
      out.push(["Abends",(d.tags.party||0)>=2?"Es gibt Nachtleben vor Ort, ihr müsst nichts selbst organisieren.":"Wenig Nachtleben. Plant eure Abende selbst: Kochen, Kartenspiele, Sterne schauen."]);break;
    case"gruppe":out.push(["Große Gruppe","Ab 8 Personen Hütten, Fähren und Restaurants vorab reservieren. In Nationalparks gelten teils Gruppenlimits."]);
      out.push(["Organisation","Eine Person plant die Logistik, eine kümmert sich um die Kasse."]);break;
  }
  const c=d.c[m];
  if(S.crowd==="meiden"&&c>=2)out.push(["Dein Wunsch nach Ruhe",`Im ${MON[m]} ist hier ${CROWDL[c].toLowerCase()}. Ruhigere Monate: ${bestQuiet(d)}.`]);
  if(S.crowd==="suchen"&&c<=1)out.push(["Dein Wunsch nach Trubel",`Im ${MON[m]} ist wenig los. Mehr Leute triffst du im ${MON[d.c.indexOf(Math.max(...d.c))]}.`]);
  return out;
}
const bestQuiet=d=>[...Array(12).keys()].filter(i=>d.c[i]<=1&&climFit(d,i)>.4).map(i=>MON[i]).slice(0,4).join(", ")||"keine mit gutem Wetter";
const CROWDTXT=["Viele Betriebe haben geschlossen, dafür bist du oft allein unterwegs. Begegnungen mit Einheimischen sind persönlicher.","Angenehm belebt. Spontane Buchungen klappen meistens.","Belebte Saison. Beliebte Spots am Vormittag besuchen, Unterkünfte einige Wochen vorher buchen.","Hochsaison: Preise teils doppelt so hoch, Hotspots überfüllt, Unterkünfte Monate vorher buchen."];
