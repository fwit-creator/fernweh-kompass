/* Drehbarer Globus (d3-geo, orthografisch). Karten: Natural Earth über world-atlas, 1:110 Mio. und beim Hineinzoomen 1:50 Mio. */
const WORLD={low:null,high:null,loading:null};
function loadWorld(which){
  if(WORLD[which])return Promise.resolve(WORLD[which]);
  return fetch(`vendor/countries-${which==="low"?"110m":"50m"}.json`).then(r=>r.json()).then(t=>{
    WORLD[which]={land:topojson.feature(t,t.objects.land),borders:topojson.mesh(t,t.objects.countries,(a,b)=>a!==b)};return WORLD[which];
  });
}
function createGlobe(host,opt={}){
  const W=800,H=opt.height||560,M=Math.min(W,H),R0=.46*M;
  host.innerHTML=`<svg class="globe" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opt.label||"Globus mit Zielen"}">
    <defs><radialGradient id="gsh${opt.id||""}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
    <path class="g-sphere"/><path class="g-grat"/><path class="g-land"/><path class="g-bord" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".6"/>
    <path class="g-shade" fill="url(#gsh${opt.id||""})" pointer-events="none"/><g class="g-reach-g"></g><g class="g-route-g"></g><g class="g-pins"></g><g class="g-crews"></g></svg>
    ${opt.tools===false?"":`<div class="globe-tools"><button type="button" data-z="in" aria-label="Hineinzoomen">+</button><button type="button" data-z="out" aria-label="Herauszoomen">−</button></div>`}<div class="globe-tip" hidden></div>`;
  const svg=host.querySelector("svg"),q=s=>svg.querySelector(s),tip=host.querySelector(".globe-tip");
  const proj=d3.geoOrthographic().translate([W/2,H/2]).clipAngle(90).precision(.4),path=d3.geoPath(proj);
  const st={rot:opt.rot||[-12,-38,0],scale:opt.scale||R0,data:{pins:[],crew:[],reach:[],routes:[]},spin:null,anim:null,drag:null,dragging:false};
  let world=null,hi=null,pinCb=null,raf=0;
  loadWorld("low").then(w=>{world=w;draw()});
  const want=()=>st.scale>2.2*M;
  function draw(){
    raf=0;proj.rotate(st.rot).scale(st.scale);
    q(".g-sphere").setAttribute("d",path({type:"Sphere"}));q(".g-shade").setAttribute("d",path({type:"Sphere"}));
    q(".g-grat").setAttribute("d",path(d3.geoGraticule10())||"");
    const w=want()&&hi&&!st.dragging&&!st.anim?hi:world;
    if(w){q(".g-land").setAttribute("d",path(w.land)||"");q(".g-bord").setAttribute("d",path(w.borders)||"")}
    if(want()&&!hi&&!WORLD.loading)WORLD.loading=loadWorld("high").then(x=>{hi=x;schedule()});
    const c=[-st.rot[0],-st.rot[1]],vis=p=>d3.geoDistance(p,c)<Math.PI/2-.03;
    q(".g-reach-g").innerHTML=st.data.reach.map(r=>`<path class="g-reach" d="${path(d3.geoCircle().center([r.lon,r.lat]).radius(Math.min(r.km/111.2,179))())||""}"/>`).join("");
    q(".g-route-g").innerHTML=st.data.routes.map(r=>`<path class="g-route" d="${path({type:"LineString",coordinates:[r.a,r.b]})||""}"/>`).join("");
    q(".g-pins").innerHTML=st.data.pins.filter(p=>vis([p.lon,p.lat])).map(p=>{const xy=proj([p.lon,p.lat]);
      return `<g class="g-pin ${p.cls||""}" data-id="${p.id}" transform="translate(${xy[0].toFixed(1)},${xy[1].toFixed(1)})" tabindex="0" role="button" aria-label="${escA(p.name)}"><circle r="${p.r||6}"/>${p.label?`<text x="${(p.r||6)+4}" y="4">${escA(p.name)}</text>`:""}</g>`}).join("");
    q(".g-crews").innerHTML=st.data.crew.filter(p=>vis([p.lon,p.lat])).map(p=>{const xy=proj([p.lon,p.lat]);
      return `<g class="g-crew" transform="translate(${xy[0].toFixed(1)},${xy[1].toFixed(1)})"><rect x="-8" y="-8" width="16" height="16" rx="3"/><text class="i" y="3.5">${escA((p.name||"?").slice(0,1).toUpperCase())}</text>${p.label?`<text x="12" y="16">${escA(p.label)}</text>`:""}</g>`}).join("");
  }
  const escA=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(draw)};
  const norm=a=>((a+540)%360)-180;
  function flyTo(lon,lat,scale,ms=1100){
    stopSpin();if(st.anim)st.anim.stop();
    const r0=st.rot.slice(),r1=[-lon,-lat,0];r1[0]=r0[0]+norm(r1[0]-r0[0]);
    const s0=st.scale,s1=Math.max(R0,Math.min(scale||st.scale,80*M));
    if(matchMedia("(prefers-reduced-motion:reduce)").matches)ms=0;
    if(!ms){st.rot=r1;st.scale=s1;st.anim=null;return schedule()}
    const e=d3.easeCubicInOut;
    st.anim=d3.timer(el=>{const k=e(Math.min(1,el/ms));st.rot=[r0[0]+(r1[0]-r0[0])*k,r0[1]+(r1[1]-r0[1])*k,0];st.scale=Math.exp(Math.log(s0)+(Math.log(s1)-Math.log(s0))*k);draw();if(k>=1){st.anim.stop();st.anim=null;draw()}});
  }
  const scaleForKm=km=>{const a=km/6371;return a>=1.25?R0:Math.max(R0,.42*M/Math.sin(a))};
  function fitKm(lon,lat,km,ms){flyTo(lon,lat,scaleForKm(km),ms)}
  function fitPoints(pts,ms){
    if(!pts.length)return;
    const lon=d3.mean(pts,p=>p[0]),lat=d3.mean(pts,p=>p[1]),far=d3.max(pts,p=>d3.geoDistance(p,[lon,lat]))*6371;
    fitKm(lon,lat,Math.max(150,far*1.25),ms);
  }
  function spin(on=true){
    stopSpin();if(!on||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
    let last=0;st.spin=d3.timer(el=>{const dt=el-last;last=el;st.rot=[st.rot[0]+dt*.006,st.rot[1],0];draw()});
  }
  function stopSpin(){if(st.spin){st.spin.stop();st.spin=null}}
  // Ziehen, Zoomen, Antippen
  const ptrs=new Map();let moved=0,pinch=null;
  svg.addEventListener("pointerdown",e=>{svg.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);moved=0;stopSpin();if(st.anim){st.anim.stop();st.anim=null}
    if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:st.scale}}});
  svg.addEventListener("pointermove",e=>{
    if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId),dx=e.clientX-p[0],dy=e.clientY-p[1];ptrs.set(e.pointerId,[e.clientX,e.clientY]);
    if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()];st.scale=Math.max(R0,Math.min(80*M,pinch.s*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d));schedule();return}
    moved+=Math.abs(dx)+Math.abs(dy);if(moved<4)return;st.dragging=true;
    const k=(W/svg.getBoundingClientRect().width)*57/st.scale*1.4;
    st.rot=[st.rot[0]+dx*k,Math.max(-85,Math.min(85,st.rot[1]-dy*k)),0];schedule();
  });
  const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(st.dragging&&!ptrs.size){st.dragging=false;schedule()}};
  svg.addEventListener("pointerup",e=>{const wasClick=moved<4&&ptrs.size===1;up(e);if(wasClick){const pin=document.elementFromPoint(e.clientX,e.clientY);const g=pin&&pin.closest(".g-pin");if(g&&pinCb)pinCb(g.dataset.id,g)}});
  svg.addEventListener("pointercancel",up);
  svg.addEventListener("wheel",e=>{e.preventDefault();stopSpin();st.scale=Math.max(R0,Math.min(80*M,st.scale*Math.exp(-e.deltaY*.0015)));schedule()},{passive:false});
  svg.addEventListener("keydown",e=>{const g=e.target.closest(".g-pin");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();pinCb&&pinCb(g.dataset.id,g)}});
  host.querySelectorAll("[data-z]").forEach(b=>b.addEventListener("click",()=>{stopSpin();const f=b.dataset.z==="in"?1.8:1/1.8;flyTo(-st.rot[0],-st.rot[1],st.scale*f,350)}));
  return {
    set(data){Object.assign(st.data,data);schedule()},
    flyTo,fitKm,fitPoints,spin,stopSpin,
    onPin(f){pinCb=f},
    tip(html){if(!html){tip.hidden=true;return}tip.innerHTML=html;tip.hidden=false},
    destroy(){stopSpin();if(st.anim)st.anim.stop();cancelAnimationFrame(raf)}
  };
}
