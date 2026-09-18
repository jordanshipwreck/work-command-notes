/* Adapted browser bundle; original source retained in original/. Revised smooth return; original logo, colors and main juggling flights retained. */
(()=>{
/* Work Command runtime derivative: continuous return and cap morph. Original exports remain in original/. */
const AgentRenderer = (() => {
'use strict';
const ORANGE='#ff5300', BG='#050805', TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return clamp(x*x*x*(x*(x*6-15)+10))};
const mix=(a,b,t)=>a+(b-a)*t;
const lerp=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
function curve(start,segments){
 const points=[start];let p=start;
 for(const s of segments){
  if(s.length===2){const end=s;for(let i=1;i<=16;i++)points.push(lerp(p,end,i/16));p=end;}
  else {for(let i=1;i<=32;i++){const t=i/32,u=1-t;points.push([u*u*u*p[0]+3*u*u*t*s[0]+3*u*t*t*s[2]+t*t*t*s[4],u*u*u*p[1]+3*u*u*t*s[1]+3*u*t*t*s[3]+t*t*t*s[5]])}p=s.slice(4);}
 }return points;
}
const corners=[
 curve([299,150],[[299,101,260,63,211,63],[161,63,120,101,120,150],[120,199,160,235,210,235],[299,235]]),
 curve([485,150],[[485,101,524,63,574,63],[624,63,665,101,665,150],[665,199,625,235,575,235],[485,235]]),
 curve([299,450],[[299,501,258,541,208,541],[156,541,113,501,113,450],[113,399,156,353,209,353],[218,353]]),
 curve([485,450],[[485,501,526,541,576,541],[628,541,671,501,671,450],[671,399,628,353,575,353],[566,353]])
];
const centers=[[210,150],[575,150],[208,450],[576,450]];
function fountain(seconds,i){
 // Each ball crosses both ways on an interlaced route. Unequal flight times
 // alternate the left/right releases, keeping the balls separated at crossings.
 const u=((seconds+i*.8)%3.2+3.2)%3.2;
 if(u<1.84){const q=u/1.84,x=q+.1*Math.sin(Math.PI*q);return [268+322*x,376-320*4*q*(1-q)];}
 if(u<2){const q=(u-1.84)/.16;return [590-74*ease(q),376+8*Math.sin(Math.PI*q)];}
 if(u<3.04){const q=(u-2)/1.04,x=q+.13*Math.sin(Math.PI*q);return [516-322*x,376-288*4*q*(1-q)];}
 const q=(u-3.04)/.16;return [194+74*ease(q),376+8*Math.sin(Math.PI*q)];
}
function state(t){
 t=((t%10)+10)%10;
 let m=0,travel=0,seconds=0;
 if(t<.8){}
 else if(t<1.6)m=ease((t-.8)/.8);
 else if(t<2.3){m=1;travel=ease((t-1.6)/.7);}
 else if(t<7.1){m=1;travel=1;seconds=t-2.3;}
 else {
  // Continue the existing flight velocity, then coast to rest instead of freezing.
  const q=clamp((t-7.1)/1.05);
  seconds=4.8+1.05*(q-q*q*q+.5*q*q*q*q);
  travel=1-ease(q);
  // Slight overlap lets the settled balls grow directly back into the logo.
  m=1-ease((t-7.95)/1.25);
 }
 return {m,travel,seconds};
}
// Morph cap depth continuously. At m=0 the exact supplied flat-ended mark remains;
// at m=1 even a collapsed corner path is a full circular juggling ball.
function strokeMorph(ctx,points,m){
 ctx.lineCap='butt';ctx.beginPath();
 points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();
 const depth=22*ease(m/.2);
 if(depth<=0)return;
 for(const [p,next] of [[points[0],points[1]],[points.at(-1),points.at(-2)]]){
  const angle=Math.atan2(p[1]-next[1],p[0]-next[0]);
  ctx.beginPath();ctx.ellipse(p[0],p[1],depth,22,angle,0,TAU);ctx.fill();
 }
}
function hand(seconds,side){
 const r=((seconds-(side?.4:0))%.8+.8)%.8;
 let x,y=420;
 if(r<.64)x=74*ease(r/.64);
 else {const q=(r-.64)/.16;x=74*(1-ease(q));y+=8*Math.sin(Math.PI*q);}
 return [side?516+x:268-x,y];
}
function render(ctx,width,height,t,options={}){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=BG;ctx.fillRect(0,0,width,height);
 const k=Math.min(width/800,height/620);
 ctx.save();ctx.translate(width/2,height/2-25*k);ctx.scale(.62*k,.62*k);ctx.translate(-392,-302);
 ctx.strokeStyle=ORANGE;ctx.fillStyle=ORANGE;ctx.lineJoin='round';ctx.lineCap='butt';ctx.lineWidth=44;
 const {m,travel,seconds}=state(t);
 // The existing W becomes articulated arms; catches meet the ball tangentially.
 const left=lerp([299,420],hand(seconds,0),travel),right=lerp([485,420],hand(seconds,1),travel);
 const floor=mix(450,474,m),peak=mix(393,418,m);
 strokeMorph(ctx,[[mix(299,left[0],m),mix(150,left[1],m)],[299,floor],[392,peak],[485,floor],[mix(485,right[0],m),mix(150,right[1],m)]],m);
 // A compact floating chassis grows directly from the middle of the W.
 if(m>0){
  ctx.beginPath();ctx.roundRect(392-25*m,418,50*m,78*m,18*m);ctx.fill();
  ctx.beginPath();ctx.roundRect(392-9*m,mix(418,373,m),18*m,45*m,6*m);ctx.fill();
 }
 // The logo crossbar folds into the robot head, retaining its orange throughout.
 const headW=mix(365,108,m),headH=mix(44,78,m),headY=mix(235,334,m);
 const nod=travel*2.5*Math.sin(seconds*Math.PI*2/1.6);
 ctx.save();ctx.translate(392,headY+nod);ctx.rotate(travel*.035*Math.sin(seconds*Math.PI*2/1.6));
 ctx.beginPath();ctx.roundRect(-headW/2,-headH/2,headW,headH,20*m);ctx.fill();
 const face=ease((m-.48)/.52);
 if(face>0){
  ctx.fillStyle=BG;ctx.beginPath();ctx.roundRect(-39*face,-16*face,78*face,32*face,11*face);ctx.fill();
  ctx.fillStyle=ORANGE;
  const look=travel*3*Math.sin(seconds*Math.PI*2/1.6);
  const blink=seconds>2.06&&seconds<2.2?0.25:1;
  for(const x of [-16,16]){ctx.beginPath();ctx.roundRect((x-4.5+look)*face,-6*face*blink,9*face,12*face*blink,2*face);ctx.fill();}
 }
 ctx.restore();
 ctx.lineWidth=44;
 for(let i=0;i<4;i++){
  const target=lerp(centers[i],fountain(seconds,i),travel);
  strokeMorph(ctx,corners[i].map(p=>lerp(p,target,m)),m);
 }
 ctx.restore();
 ctx.fillStyle='#a5aaa5';ctx.font=`500 ${11*k}px -apple-system,BlinkMacSystemFont,Arial,sans-serif`;ctx.textAlign='center';
 // A stable label avoids a second competing loading animation.
 const text=options.label ?? 'P R O C E S S I N G';ctx.fillText(text,width/2,height/2+205*k);
}
return {render,duration:10,state,fountain};
})();


class WCJuggler extends HTMLElement {
 static observedAttributes=['active','paused','label'];
 constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<style>:host{display:block;max-width:var(--juggler-width,420px);width:100%;margin:auto}canvas{display:block;width:100%;height:auto;aspect-ratio:800/620}</style><canvas width="800" height="620" aria-hidden="true"></canvas>';this.canvas=this.shadowRoot.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.elapsed=0;this.raf=0;this.last=null;this.inView=false;this.motion=matchMedia('(prefers-reduced-motion:reduce)');this.sync=()=>this.update();this.tick=now=>{if(this.last!==null)this.elapsed+=Math.min((now-this.last)/1000,.1);this.last=now;this.paint();this.raf=requestAnimationFrame(this.tick)};}
 connectedCallback(){this.observer=new IntersectionObserver(es=>{this.inView=es[0].isIntersecting;this.update()});this.observer.observe(this);this.motion.addEventListener('change',this.sync);document.addEventListener('visibilitychange',this.sync);document.addEventListener('wc-motion-change',this.sync);this.resize=new ResizeObserver(()=>{let w=this.clientWidth;let d=Math.min(devicePixelRatio||1,2);if(w){this.canvas.width=Math.round(w*d);this.canvas.height=Math.round(w*d*620/800);this.paint()}});this.resize.observe(this);this.update();}
 disconnectedCallback(){cancelAnimationFrame(this.raf);this.observer?.disconnect();this.resize?.disconnect();this.motion.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);document.removeEventListener('wc-motion-change',this.sync)}
 attributeChangedCallback(){if(this.isConnected)this.update()}
 paint(){AgentRenderer.render(this.ctx,this.canvas.width,this.canvas.height,this.motion.matches?0:this.elapsed,{label:this.getAttribute('label')??''})}
 update(){cancelAnimationFrame(this.raf);this.raf=0;this.last=null;this.paint();if(this.isConnected&&this.inView&&this.hasAttribute('active')&&!this.hasAttribute('paused')&&!this.motion.matches&&!document.hidden&&document.documentElement.dataset.motion!=='off')this.raf=requestAnimationFrame(this.tick);}
}
if(!customElements.get('wc-juggler'))customElements.define('wc-juggler',WCJuggler);

})();
