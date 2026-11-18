t.height='calc(100% - 54px)';Object.assign(w.style,{left:'0',top:'0',width:'100%',height:'calc(100% - 54px)'});w.dataset.max='1';}else if(ev.clientX<8){Object.assign(w.style,{left:'0',top:'0',width:'50%',height:'calc(100% - 54px)'});}else if(ev.clientX>innerWidth-8){Object.assign(w.style,{left:'50%',top:'0',width:'50%',height:'calc(100% - 54px)'});}});w.addEventListener('pointerdown',()=>OS.focus(w));})));
snapObserver.observe(OS.getDesktop(),{childList:true});
document.addEventListener('click',e=>{if(e.target.matches('.app-tile[data-x="search-file"]'))e.preventDefault();},true);


document.addEventListener('click',async e=>{const b=e.target.closest('[data-paint]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const w=b.closest('.window'),canvas=$('canvas',w);if(b.dataset.paint==='clear'){canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);}if(b.dataset.paint==='save'){const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));const p='/Pictures/Paint-'+Date.now()+'.png';await OS.putFile({path:p,type:'file',mime:'image/png',blob});download(blob,'danios-paint.png');OS.toast('Drawing saved to '+p);}},true);
const calendarObserver=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(w=>{if(w.nodeType!==1||!w.matches('.window[data-app="calendar"]'))return;const d=$('.calendar-date',w),t=$('textarea',w);if(d&&t){d.value=new Date().toISOString().slice(0,10);t.value=localStorage.getItem('danios-calendar-'+d.value)||'';d.addEventListener('change',()=>{t.value=localStorage.getItem('danios-calendar-'+d.value)||'';});}})));
calendarObserver.observe(OS.getDesktop(),{childList:true});


function calcKey(w,key){
 const d=$('.calc-display',w);if(!d)return;
 let s=d.value==='0'||d.value==='Error'?'':d.value;
 if(key==='AC'){d.value='0';return;}
 if(key==='⌫'){d.value=s.slice(0,-1)||'0';return;}
 if(key==='±'){const m=s.match(/(-?\d+(?:\.\d*)?)$/);if(m)d.value=s.slice(0,m.index)+(m[1].startsWith('-')?m[1].slice(1):'-'+m[1]);else d.value=s?'-('+s+')':'0';return;}
 if(key==='%'){try{d.value=String(Number((expression(s)/100).toPrecision(12)));}catch(_){d.value='Error';}return;}
 if(key==='='){try{d.value=String(expression(s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')));}catch(_){d.value='Error';}return;}
 const map={'×':'*','÷':'/','−':'-'};const v=map[key]||key;
 if(/^[0-9.]$/.test(v)){if(v==='.'&&s.split(/[+*/%()-]/).pop().includes('.'))return;d.value=(s||'')+v;}
 else if(/^[+*/^-]$/.test(v)){d.value=s.replace(/[+*/^-]$/,'')+v;}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-calc]');if(!b)return;const w=b.closest('.window');if(!w)return;e.preventDefault();e.stopImmediatePropagation();calcKey(w,b.dataset.calc);},true);
document.addEventListener('keydown',e=>{const w=e.target.closest('.window[data-app="calculator"]');if(!w)return;const keys={'Enter':'=','Backspace':'⌫','Escape':'AC'};const k=keys[e.key]||e.key;if(/^[0-9.+*/%^-]$/.test(k)||['=','⌫','AC'].includes(k)){calcKey(w,k);e.preventDefault();e.stopImmediatePropagation();}},true);

renderStart('');

function renderDesktopChoices(){const box=$('#desktopChoices');if(!box)return;box.innerHTML='';(OS.desktops||['Desktop 1']).forEach((name,i)=>{const b=document.createElement('button');b.textContent=(i===(OS.getCurrentDesktop?OS.getCurrentDesktop():0)?'✓ ':'')+name;b.dataset.desktopIndex=i;b.addEventListener('click',()=>{OS.switchDesktop(i);$('#desktopPanel').classList.add('hidden');});box.append(b);});}
function addDesktop(){if(!OS.desktops)return;OS.desktops.push('Desktop '+(OS.desktops.length+1));OS.switchDesktop(OS.desktops.length-1);renderDesktopChoices();OS.toast('Created '+OS.desktops[OS.desktops.length-1]);}
/* Explicit shell actions used by the desktop and window chrome. */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');
 if(b){const w=b.closest('.window');if(w){const a=b.dataset.action;e.preventDefault();e.stopImmediatePropagation();
  if(a==='min'||a==='minimize'){w.classList.add('minimized');w.classList.remove('focused');OS.taskbar();}
  else if(a==='max'||a==='maximize'||a==='restore'){if(!w.dataset.preMax){w.dataset.preMax=JSON.stringify({left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height});Object.assign(w.style,{left:'0',top:'0',width:'100%',height:'calc(100% - 54px)'});w.classList.add('maximized');}else{try{const p=JSON.parse(w.dataset.preMax);Object.assign(w.style,p);}catch(_){}delete w.dataset.preMax;w.classList.remove('maximized');}OS.focus(w);}
  else if(a==='close'){w.remove();OS.taskbar();}
  return;
 }}
 if(e.target.closest('#wifiBtn')){e.preventDefault();e.stopImmediatePropagation();$('#quickPanel').classList.toggle('hidden');$('#notifyPanel')?.classList.add('hidden');return;}
 if(e.target.closest('#notifyBtn')){e.preventDefault();e.stopImmediatePropagation();$('#notifyPanel').classList.toggle('hidden');$('#quickPanel')?.classList.add('hidden');return;}
 if(e.target.closest('#desktopBtn')){e.preventDefault();e.stopImmediatePropagation();$('#desktopPanel').classList.toggle('hidden');renderDesktopChoices();return;}
 if(e.target.closest('#newDesktop')){e.preventDefault();e.stopImmediatePropagation();addDesktop();return;}
 if(e.target.closest('#clearNotifications')){e.preventDefault();e.stopImmediatePropagation();OS.getNotifications().length=0;write('notices',[]);const n=$('#notifications');if(n)n.textContent='No notifications';OS.toast('Notifications cleared');return;}
 const cal=e.target.closest('[data-calendar]');
 if(cal){const w=cal.closest('.window');if(w&&cal.dataset.calendar==='save'){e.preventDefault();e.stopImmediatePropagation();const d=$('.calendar-date',w)?.value||new Date().toISOString().slice(0,10);localStorage.setItem('danios-calendar-'+d,$('textarea',w)?.value||'');OS.toast('Calendar note saved');}return;}
},true);

window.DaniOSReady=true;window.DaniOSVersion='3.0.0';console.info('DaniOS 3.0 enhancements loaded.');
})();