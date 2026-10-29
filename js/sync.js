/* Gemeinsame Abstimmung ohne Konten und ohne eigenen Server.
   Jede Person schreibt ihren Stand als verschlüsseltes Nostr-Ereignis (NIP-78, kind 30078) auf mehrere öffentliche Relays.
   Der AES-Schlüssel steckt nur im #-Teil des Einladungslinks; die Relays sehen nur Zufallstext. */
const RELAYS=["wss://nos.lol","wss://relay.primal.net","wss://relay.snort.social","wss://relay.damus.io"];
const b64u={
  enc(bytes){let s="";for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},
  dec(s){s=s.replace(/-/g,"+").replace(/_/g,"/");s+="=".repeat((4-s.length%4)%4);return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
};
const toHex=b=>[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
const fromHex=h=>Uint8Array.from(h.match(/../g).map(x=>parseInt(x,16)));
async function sha256hex(s){return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))))}
function newRoom(){return {id:b64u.enc(crypto.getRandomValues(new Uint8Array(12))),key:b64u.enc(crypto.getRandomValues(new Uint8Array(32)))}}

const Sync={
  room:null,key:null,tag:null,socks:new Map(),events:new Map(),mine:new Map(),listeners:new Set(),acks:new Map(),
  async start(room,me){
    this.stop();this.room=room;this.me=me;
    this.key=await crypto.subtle.importKey("raw",b64u.dec(room.key),"AES-GCM",false,["encrypt","decrypt"]);
    this.tag=(await sha256hex("fernweh-kompass:"+room.id)).slice(0,40);
    RELAYS.forEach(u=>this.connect(u,0));
  },
  stop(){for(const s of this.socks.values()){s.closing=true;try{s.ws.close()}catch(e){}}this.socks.clear();this.events.clear();this.mine.clear();this.acks.clear();this.room=null},
  connect(url,attempt){
    const s={url,ws:null,open:false,attempt};this.socks.set(url,s);
    try{s.ws=new WebSocket(url)}catch(e){return this.retry(s)}
    s.ws.onopen=()=>{
      s.open=true;s.attempt=0;
      s.ws.send(JSON.stringify(["REQ","fk",{kinds:[30078],"#t":[this.tag],limit:500}]));
      for(const ev of this.mine.values())s.ws.send(JSON.stringify(["EVENT",ev]));
      this.notify();
    };
    s.ws.onmessage=e=>this.onMsg(s,e.data);
    s.ws.onclose=()=>{s.open=false;this.notify();if(!s.closing&&this.room&&this.socks.get(url)===s)this.retry(s)};
    s.ws.onerror=()=>{};
  },
  retry(s){setTimeout(()=>{if(this.room&&this.socks.get(s.url)===s)this.connect(s.url,s.attempt+1)},Math.min(30000,1500*2**s.attempt))},
  async onMsg(s,raw){
    let m;try{m=JSON.parse(raw)}catch(e){return}
    if(m[0]==="EVENT"&&m[2]&&m[2].kind===30078){
      const ev=m[2],d=(ev.tags.find(t=>t[0]==="d")||[])[1];
      if(!d||!this.room||!d.startsWith("fk:"+this.room.id+":"))return;
      const cur=this.events.get(d);if(cur&&cur.created_at>=ev.created_at)return;
      try{if(!NostrTools.verifyEvent(ev))return}catch(e){return}
      const data=await this.decrypt(ev.content);if(!data)return;
      const now=this.events.get(d);if(now&&now.created_at>=ev.created_at)return;
      this.events.set(d,{created_at:ev.created_at,pubkey:ev.pubkey,data});this.changed();
    }else if(m[0]==="OK"){const a=this.acks.get(m[1]);if(a&&m[2]){a.add(s.url);this.notify()}}
  },
  async encrypt(obj){
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},this.key,new TextEncoder().encode(JSON.stringify(obj))));
    const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);return b64u.enc(all);
  },
  async decrypt(txt){
    try{const all=b64u.dec(txt),pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:all.slice(0,12)},this.key,all.slice(12));return JSON.parse(new TextDecoder().decode(pt))}catch(e){return null}
  },
  async publish(slot,data){
    if(!this.room)return;
    const d=`fk:${this.room.id}:${slot}`,now=Math.floor(Date.now()/1000),prev=this.events.get(d);
    const created_at=Math.max(now,prev?prev.created_at+1:0);
    const content=await this.encrypt(data);
    const ev=NostrTools.finalizeEvent({kind:30078,created_at,content,tags:[["d",d],["t",this.tag],["expiration",String(now+200*86400)]]},this.me.skBytes);
    this.events.set(d,{created_at,pubkey:ev.pubkey,data});this.mine.set(d,ev);this.acks.set(ev.id,new Set());this.lastId=ev.id;
    for(const s of this.socks.values())if(s.open)s.ws.send(JSON.stringify(["EVENT",ev]));
    this.notify();
  },
  list(prefix){const p=`fk:${this.room?this.room.id:""}:${prefix}`;return [...this.events.entries()].filter(([k])=>k.startsWith(p)).map(([k,v])=>({slot:k.slice(p.length),...v}))},
  meta(){const m=this.list("meta").sort((a,b)=>b.created_at-a.created_at)[0];return m?m.data:null},
  members(){return this.list("m:").map(e=>({...e.data,mid:e.slot,pubkey:e.pubkey,at:e.created_at}))},
  online(){return [...this.socks.values()].filter(s=>s.open).length},
  saved(){const a=this.acks.get(this.lastId);return a?a.size:0},
  on(f){this.listeners.add(f);return()=>this.listeners.delete(f)},
  changed(){clearTimeout(this.ct);this.ct=setTimeout(()=>this.listeners.forEach(f=>f("data")),150)},
  notify(){clearTimeout(this.nt);this.nt=setTimeout(()=>this.listeners.forEach(f=>f("status")),100)}
};
