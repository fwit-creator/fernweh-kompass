/* Hintergrund-Szene: zeichnet eine Landschaft passend zu dem, was gerade gewählt ist,
   und blendet bei jedem Wechsel weich über. Farben der Oberfläche (Akzent, Schrift über der Szene) kommen aus derselben Palette. */
const Scene=(()=>{
  const cv=document.getElementById("scene"),ctx=cv.getContext("2d");
  const reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const darkQ=matchMedia("(prefers-color-scheme: dark)");
  let W=0,H=0,dpr=1,cur=null,prev=null,fade=1,fadeStart=0,raf=0,flakes=[];
  // Paletten: sky oben/unten, l = Ebenen von hinten nach vorn, acc = Akzent, ai = Schrift auf Akzent
  const P={
    explore:{kind:"explore",sky:["#08192A","#163E5C"],l:["#C9A45C"],acc:"#F0A23B",ai:"#1B1004",sea:"#0F3A57",land:"#3E6B57",night:true},
    berge:{kind:"mountains",sky:["#5F97CF","#D3E6F3"],l:["#9DB5CC","#6A86A3","#3B556C","#22323F"],acc:"#E8792B",ai:"#1B0D03",sea:"#245A85",land:"#6F8C6A"},
    strand:{kind:"sea",sky:["#4FB3E6","#C9EDF8"],l:["#1C9DB5","#0E7390","#E8D19C"],acc:"#F0644A",ai:"#200803",sea:"#1C86B8",land:"#C9B27A",sun:"#FFF1B8"},
    wildnis:{kind:"forest",sky:["#93BDB1","#E0ECE3"],l:["#7FA28A","#4F7A60","#2C523E","#163126"],acc:"#E06A2C",ai:"#1F0B02",sea:"#2D6A73",land:"#4F7A55"},
    lostplaces:{kind:"ruins",sky:["#7E8B86","#C7CEC9"],l:["#6A786E","#46564B","#2A3630","#7A7E7A"],acc:"#C8692B",ai:"#1E0C02",sea:"#3C5A5E",land:"#5B6B57"},
    stadt:{kind:"city",sky:["#E99A55","#F8D7A6"],l:["#9A7A93","#6B5578","#3B2F4E"],acc:"#6B3FD1",ai:"#FFFFFF",sea:"#3E5F8A",land:"#8C7F8E",lights:"#FFD27A"},
    party:{kind:"city",sky:["#170A2C","#43166A"],l:["#3A2160","#24123F","#120821"],acc:"#FF4FD8",ai:"#22001A",sea:"#1F1645",land:"#4B2E6B",lights:"#FF7BEA",beams:true,night:true},
    kultur:{kind:"village",sky:["#E6B27A","#F7E2C2"],l:["#C08260","#9A5A40","#6A3426"],acc:"#2E6E8E",ai:"#FFFFFF",sea:"#3F7593",land:"#B58B62",lights:"#FFE0A0"},
    essen:{kind:"village",sky:["#EDBF77","#FBE9C9"],l:["#C9925F","#A2633F","#713A24"],acc:"#A8392A",ai:"#FFFFFF",sea:"#4B7E8E",land:"#B9915F",lights:"#FFE3A6"},
    schnee:{kind:"snow",sky:["#B7D3EC","#EEF5FA"],l:["#E4EEF6","#F7FBFE","#FFFFFF","#2C4757"],acc:"#1F78C0",ai:"#FFFFFF",sea:"#4C7FA8",land:"#DCE8F0",snow:true},
    wasser:{kind:"lake",sky:["#7FBFE6","#E1F1F7"],l:["#86AE95","#557F67","#3C82A6"],acc:"#E8792B",ai:"#1B0D03",sea:"#2E7CA6",land:"#6F9A78"},
    ruhe:{kind:"lake",sky:["#F2C3B4","#FBEAD9"],l:["#BFCDB4","#97B097","#B8D3DA"],acc:"#2F8670",ai:"#FFFFFF",sea:"#7FAFC0",land:"#A8BE9E"},
    abenteuer:{kind:"desert",sky:["#F3B06A","#FBE1BA"],l:["#D9824E","#B55A31","#7D3620"],acc:"#176E8C",ai:"#FFFFFF",sea:"#3B7D96",land:"#C98A55",sun:"#FFF0C4"},
    roadtrip:{kind:"road",sky:["#EE8A55","#F8D09E"],l:["#AE6E6C","#704B5E","#2A2A33"],acc:"#F2C23B",ai:"#211800",sea:"#3F6A8A",land:"#9E7C68",sun:"#FFE2A8"}
  };
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return "#"+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,"0")).join("")};
  const lum=h=>{const [r,g,b]=hex(h).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
  function rng(seed){let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296}
  function ridge(seed,n,rough){const r=rng(seed),pts=[0,0];let step=1;
    // Mittelpunktverschiebung für Bergkämme
    let arr=[r(),r()];for(let k=0;k<n;k++){const next=[];for(let i=0;i<arr.length-1;i++){next.push(arr[i],(arr[i]+arr[i+1])/2+(r()-.5)*rough/step)}next.push(arr[arr.length-1]);arr=next;step*=1.8}
    return arr;}
  const RID={};const getRidge=(k,n,rough)=>RID[k]||(RID[k]=ridge(k*977+13,n,rough));
  function resize(){dpr=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);flakes=Array.from({length:Math.round(W*H/9000)},()=>({x:Math.random()*W,y:Math.random()*H,r:.6+Math.random()*2.2,v:.3+Math.random()*.9}));kick()}
  function sky(p){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  function stars(p,t){const r=rng(7);ctx.fillStyle="#fff";for(let i=0;i<140;i++){const x=r()*W,y=r()*H*.6,a=.3+.5*Math.abs(Math.sin(t/1400+i));ctx.globalAlpha*=1;ctx.fillRect(x,y,1.3,1.3)}}
  function sun(p,x,y,rad){const g=ctx.createRadialGradient(x,y,0,x,y,rad*4);g.addColorStop(0,p.sun||"#FFF3C8");g.addColorStop(.25,(p.sun||"#FFF3C8")+"aa");g.addColorStop(1,"rgba(255,240,200,0)");ctx.fillStyle=g;ctx.fillRect(x-rad*4,y-rad*4,rad*8,rad*8);ctx.fillStyle=p.sun||"#FFF3C8";ctx.beginPath();ctx.arc(x,y,rad,0,7);ctx.fill()}
  function ridgeLayer(key,base,amp,color,n=7,rough=.9){const a=getRidge(key,n,rough);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,H);a.forEach((v,i)=>ctx.lineTo(i/(a.length-1)*W,base-v*amp));ctx.lineTo(W,H);ctx.closePath();ctx.fill();return a}
  function snowCaps(a,base,amp,line){ctx.save();ctx.beginPath();ctx.moveTo(0,H);a.forEach((v,i)=>ctx.lineTo(i/(a.length-1)*W,base-v*amp));ctx.lineTo(W,H);ctx.closePath();ctx.clip();ctx.fillStyle="rgba(255,255,255,.88)";ctx.fillRect(0,0,W,base-amp*line);ctx.restore()}
  function trees(seed,base,h,color,count){const r=rng(seed);ctx.fillStyle=color;for(let i=0;i<count;i++){const x=r()*W*1.1-W*.05,hh=h*(.6+r()*.7),w=hh*.36,y=base+r()*h*.25;ctx.beginPath();ctx.moveTo(x,y-hh);ctx.lineTo(x+w,y);ctx.lineTo(x-w,y);ctx.closePath();ctx.fill()}ctx.fillRect(0,base+h*.2,W,H)}
  function hills(seed,base,amp,color,freq=2){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=8)ctx.lineTo(x,base-amp*(.5+.35*Math.sin(x/W*Math.PI*freq+seed)+.15*Math.sin(x/W*Math.PI*freq*2.3+seed*2)));ctx.lineTo(W,H);ctx.closePath();ctx.fill()}
  function skyline(seed,base,maxH,color,lights,t){const r=rng(seed);let x=-10;while(x<W+10){const w=24+r()*60,h=maxH*(.3+r()*.7);ctx.fillStyle=color;ctx.fillRect(x,base-h,w,h+H);
      if(lights){for(let yy=base-h+8;yy<base-6;yy+=12)for(let xx=x+5;xx<x+w-6;xx+=10){const on=r()>.55;if(on){ctx.fillStyle=lights;ctx.globalAlpha*=(.55+.45*Math.sin(t/900+xx*yy))*.9+.1;ctx.fillRect(xx,yy,4,6);ctx.globalAlpha=gA}}}
      x+=w+2+r()*6}}
  let gA=1;
  function draw(p,alpha,t){
    gA=alpha;ctx.globalAlpha=alpha;sky(p);
    const hz=H*.62;
    if(p.night||p.kind==="explore")stars(p,t);
    switch(p.kind){
      case"explore":{ctx.strokeStyle=p.l[0];ctx.lineWidth=1;const r=rng(3);for(let c=0;c<3;c++){const cx=W*(.2+.6*r()),cy=H*(.25+.6*r()),mx=Math.max(W,H)*.5;for(let k=1;k<16;k++){const R=k*mx/16;ctx.globalAlpha=alpha*(k%5===0?.35:.14);ctx.beginPath();for(let i=0;i<=90;i++){const a=i/90*Math.PI*2,w=1+.15*Math.sin(3*a+c+k*.2)+.08*Math.sin(5*a+k*.3);const X=cx+Math.cos(a)*R*w*1.3,Y=cy+Math.sin(a)*R*w*.8;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)}ctx.stroke()}}ctx.globalAlpha=alpha;break}
      case"mountains":{sun(p,W*.78,H*.2,22);const a=ridgeLayer(1,hz-H*.05,H*.38,p.l[0]);snowCaps(a,hz-H*.05,H*.38,.8);const b=ridgeLayer(2,hz+H*.05,H*.3,p.l[1]);snowCaps(b,hz+H*.05,H*.3,.92);ridgeLayer(3,hz+H*.18,H*.2,p.l[2],6,.7);ridgeLayer(4,H*.94,H*.12,p.l[3],5,.6);break}
      case"sea":{sun(p,W*.7,hz-H*.12,30);ctx.fillStyle=p.l[0];ctx.fillRect(0,hz,W,H-hz);const g=ctx.createLinearGradient(0,hz,0,H);g.addColorStop(0,p.l[0]);g.addColorStop(1,p.l[1]);ctx.fillStyle=g;ctx.fillRect(0,hz,W,H-hz);
        ctx.strokeStyle="rgba(255,255,255,.45)";ctx.lineWidth=1.4;for(let k=0;k<9;k++){const y=hz+12+k*k*5.5;ctx.beginPath();for(let x=0;x<=W;x+=10)ctx.lineTo(x,y+Math.sin(x/(40+k*9)+t/(900-k*40)+k)*(1.5+k*.4));ctx.stroke()}
        ctx.fillStyle=p.l[2];ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=10)ctx.lineTo(x,H*.88-Math.sin(x/W*3.2+1)*H*.05);ctx.lineTo(W,H);ctx.fill();break}
      case"forest":case"ruins":{sun(p,W*.2,H*.22,18);hills(1,hz,H*.12,p.l[0]);trees(11,hz+H*.02,H*.16,p.l[0],70);
        ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(0,hz+H*.02,W,H*.06);trees(12,hz+H*.12,H*.2,p.l[1],48);
        if(p.kind==="ruins"){ctx.fillStyle=p.l[3];const bx=W*.58,by=hz+H*.2;ctx.fillRect(bx,by-H*.11,W*.22,H*.11+H);ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(bx+W*.03,by-H*.07,W*.04,H*.035);ctx.fillRect(bx+W*.13,by-H*.07,W*.04,H*.035);ctx.fillStyle=p.l[1];ctx.fillRect(bx-4,by-H*.115,W*.23,6)}
        trees(13,hz+H*.25,H*.26,p.l[2],30);break}
      case"city":{if(!p.night)sun(p,W*.25,hz-H*.05,26);if(p.beams){ctx.save();for(let i=0;i<4;i++){const a=Math.sin(t/1800+i*1.7)*.5;ctx.fillStyle=`rgba(255,120,240,${.07})`;ctx.beginPath();ctx.moveTo(W*(.2+i*.2),hz);ctx.lineTo(W*(.2+i*.2)+Math.sin(a)*H-60,0);ctx.lineTo(W*(.2+i*.2)+Math.sin(a)*H+60,0);ctx.fill()}ctx.restore()}
        skyline(21,hz+H*.05,H*.32,p.l[0],null,t);skyline(22,hz+H*.16,H*.3,p.l[1],p.lights,t);skyline(23,H*.95,H*.2,p.l[2],p.lights,t);break}
      case"village":{sun(p,W*.75,hz-H*.1,24);hills(2,hz,H*.1,p.l[0],1.5);const r=rng(31);for(let row=0;row<2;row++){let x=-20;const base=hz+H*(.12+row*.14),col=p.l[row+1];while(x<W+20){const w=40+r()*50,h=H*(.06+r()*.07);ctx.fillStyle=col;ctx.fillRect(x,base-h,w,h+H);ctx.beginPath();ctx.moveTo(x-4,base-h);ctx.lineTo(x+w/2,base-h-w*.42);ctx.lineTo(x+w+4,base-h);ctx.fill();
          if(r()>.86){ctx.fillRect(x+w*.35,base-h-w*1.1,w*.3,w*.8);ctx.beginPath();ctx.arc(x+w*.5,base-h-w*1.1,w*.15,Math.PI,0);ctx.fill()}
          ctx.fillStyle=p.lights;ctx.globalAlpha=alpha*.8;if(r()>.4)ctx.fillRect(x+w*.3,base-h*.6,6,8);ctx.globalAlpha=alpha;x+=w+6}}break}
      case"snow":{if(p.night||p.aurora){ctx.save();for(let i=0;i<3;i++){const g=ctx.createLinearGradient(0,H*.08,0,H*.42);g.addColorStop(0,"rgba(80,255,180,0)");g.addColorStop(.5,`rgba(80,255,180,${.18-i*.04})`);g.addColorStop(1,"rgba(80,255,180,0)");ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,H*.1);for(let x=0;x<=W;x+=12)ctx.lineTo(x,H*(.18+i*.05)+Math.sin(x/170+t/3000+i)*30);ctx.lineTo(W,H*.45);ctx.lineTo(0,H*.45);ctx.fill()}ctx.restore()}
        const a=ridgeLayer(5,hz-H*.02,H*.28,p.l[0],7,.8);hills(3,hz+H*.12,H*.1,p.l[1],1.6);trees(41,hz+H*.17,H*.12,p.l[3],26);hills(4,H*.9,H*.08,p.l[2],1.2);break}
      case"lake":{sun(p,W*.3,hz-H*.12,24);ridgeLayer(6,hz-H*.02,H*.14,p.l[0],6,.6);hills(5,hz+H*.02,H*.08,p.l[1],2.2);
        const g=ctx.createLinearGradient(0,hz+H*.06,0,H);g.addColorStop(0,p.l[2]);g.addColorStop(1,mix(p.l[2],"#0A1C2A",.35));ctx.fillStyle=g;ctx.fillRect(0,hz+H*.06,W,H);
        ctx.strokeStyle="rgba(255,255,255,.35)";for(let k=0;k<7;k++){const y=hz+H*.1+k*k*6;ctx.beginPath();const off=Math.sin(t/1500+k)*20;ctx.moveTo(W*.15+off+k*9,y);ctx.lineTo(W*.45+off-k*5,y);ctx.stroke()}
        ctx.fillStyle=p.l[1];ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,H*.86);ctx.quadraticCurveTo(W*.3,H*.8,W*.55,H*.92);ctx.lineTo(W*.55,H);ctx.fill();break}
      case"desert":{sun(p,W*.5,hz-H*.08,44);const r=rng(51);for(let row=0;row<3;row++){ctx.fillStyle=p.l[row];let x=-40;const base=hz+H*(row*.1);while(x<W+40){const w=60+r()*160,h=H*(.06+r()*.14)/(row+1)*1.6;ctx.beginPath();ctx.moveTo(x,base+H);ctx.lineTo(x,base);ctx.lineTo(x+w*.15,base-h);ctx.lineTo(x+w*.85,base-h);ctx.lineTo(x+w,base);ctx.lineTo(x+w,base+H);ctx.fill();x+=w+r()*90}}break}
      case"road":{sun(p,W*.5,hz-H*.06,34);ridgeLayer(7,hz+H*.02,H*.14,p.l[0],6,.7);hills(6,hz+H*.08,H*.06,p.l[1],1.4);ctx.fillStyle=p.l[2];ctx.beginPath();ctx.moveTo(W*.47,hz+H*.08);ctx.lineTo(W*.53,hz+H*.08);ctx.lineTo(W*.95,H);ctx.lineTo(W*.05,H);ctx.fill();
        ctx.strokeStyle="#F2E6C2";ctx.lineWidth=3;ctx.setLineDash([18,22]);ctx.lineDashOffset=-(t/30)%40;ctx.beginPath();ctx.moveTo(W*.5,hz+H*.09);ctx.lineTo(W*.5,H);ctx.stroke();ctx.setLineDash([]);break}
    }
    if(p.snow||p.cold){ctx.fillStyle="rgba(255,255,255,.85)";flakes.forEach(f=>{ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill()})}
    if(p.heat){const g=ctx.createLinearGradient(0,0,0,H*.5);g.addColorStop(0,"rgba(255,140,60,.22)");g.addColorStop(1,"rgba(255,140,60,0)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H*.5)}
    ctx.globalAlpha=1;
  }
  const animated=p=>p&&!reduce&&(p.snow||p.cold||["sea","city","lake","road","snow","explore"].includes(p.kind));
  function frame(now){
    raf=0;
    if(fade<1)fade=Math.min(1,(now-fadeStart)/700);
    if(prev&&fade<1)draw(prev,1,now);
    if(cur)draw(cur,prev&&fade<1?fade:1,now);
    if((cur&&(cur.snow||cur.cold))&&!reduce)flakes.forEach(f=>{f.y+=f.v;f.x+=Math.sin(now/1200+f.r)*.3;if(f.y>H+4){f.y=-4;f.x=Math.random()*W}});
    if(fade<1||animated(cur))raf=requestAnimationFrame(frame);
  }
  function kick(){if(!raf)raf=requestAnimationFrame(frame)}
  function applyUI(p){
    const root=document.documentElement.style,lightSky=lum(p.sky[0])>.35;
    root.setProperty("--accent",p.acc);root.setProperty("--accent-ink",p.ai);
    root.setProperty("--scene-ink",lightSky?"#0F1E27":"#F6F2E6");root.setProperty("--scene-shade",lightSky?"rgba(255,255,255,.38)":"rgba(6,14,20,.45)");
    root.setProperty("--g-sea",p.sea);root.setProperty("--g-land",p.land);
    const m=document.getElementById("themeColor");if(m)m.setAttribute("content",p.sky[0]);
  }
  function set(name,mod={}){
    const base=P[name]||P.explore,key=name+JSON.stringify(mod)+(darkQ.matches?"d":"");
    if(cur&&cur.key===key)return;
    let p={...base,key,sky:base.sky.slice(),l:base.l.slice()};
    if(mod.cold){p.sky=[mix(p.sky[0],"#BFD9F0",.55),mix(p.sky[1],"#F2F7FB",.6)];p.cold=true;if(p.kind==="snow")p.aurora=true}
    if(mod.heat){p.sky=[mix(p.sky[0],"#F08A4B",.45),mix(p.sky[1],"#FFD9A0",.5)];p.heat=true}
    if(darkQ.matches&&!p.night){p.sky=[mix(p.sky[0],"#06101C",.72),mix(p.sky[1],"#0D1E30",.62)];p.l=p.l.map(c=>mix(c,"#081018",.55));p.night=true;p.dim=true}
    prev=cur;cur=p;fade=prev?0:1;fadeStart=performance.now();applyUI(p);kick();
  }
  let last=["explore",{}];
  addEventListener("resize",resize);darkQ.addEventListener("change",()=>{if(cur)cur.key="";set(...last)});
  resize();
  const set0=set;
  return {set:(n,m={})=>{last=[n,m];set0(n,m)},themes:Object.keys(P)};
})();
