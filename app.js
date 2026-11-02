(()=>{'use strict';
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms)),enc=new TextEncoder();
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},d:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let HI=LS.g('z2g_l')==='hi',TOK=null,USER='',FILES=new Map(),CUR='',RD='',idleT,hideT,MODE='old',PUSHING=false,WL=null,TREE=null,PEND=new Map(),POLL=0,RKEY='';
const T=(e,h)=>HI?h:e,B=(e,h)=>'EN: '+e+'\nHI: '+h,ITER=600000;
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
function ic(n){const N='http://www.w3.org/2000/svg',s=document.createElementNS(N,'svg'),u=document.createElementNS(N,'use');s.setAttribute('class','ic');u.setAttribute('href','#i-'+n);s.appendChild(u);return s}
const fmt=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';
const G=f=>async(...a)=>{try{await f(...a)}catch(e){toast(eText(e),1)}};
function toast(t,bad){const x=$('toast');x.textContent=t;x.className='on'+(bad?' bad':'');clearTimeout(x._t);x._t=setTimeout(()=>x.className='',bad?9000:2600)}
/* no right-click / selection outside inputs, no pinch zoom */
document.addEventListener('contextmenu',e=>e.preventDefault(),{capture:true});
document.addEventListener('selectstart',e=>{if(!e.target.closest||!e.target.closest('input,textarea,select'))e.preventDefault()},{capture:true});
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
/* ---------- language ---------- */
function applyLang(){document.querySelectorAll('[data-h]').forEach(n=>{if(!n.dataset.e)n.dataset.e=n.textContent;n.textContent=HI?n.dataset.h:n.dataset.e});document.documentElement.lang=HI?'hi':'en';$('lb').textContent=HI?'हिं | EN':'EN | हिं';guide();setConn();renderFiles();fillTypes();updLbl();stats();refreshGates();renderRepo()}
function route(){const v=(location.hash||'#home').slice(1),id=['home','files','repo','build','guide'].includes(v)?v:'home';document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+id));document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===id));scrollTo(0,0)}
addEventListener('hashchange',route);
/* ---------- errors ---------- */
function explain(s,m){const M={0:['Network error. Check internet or VPN.','नेटवर्क एरर। इंटरनेट या VPN जाँचो।'],401:['Token is wrong or expired. Make a new one.','टोकन गलत या एक्सपायर है। नया बनाओ।'],403:['Permission missing (needs repo + workflow, delete_repo to delete a repo) or rate limit. Wait a few minutes.','परमिशन कम है (repo + workflow चाहिए, रिपो डिलीट के लिए delete_repo) या रेट लिमिट। कुछ मिनट रुको।'],404:['Not found: repo, branch, workflow or path is wrong, or token has no access.','नहीं मिला: रिपो, ब्रांच, वर्कफ़्लो या पाथ गलत है, या टोकन को एक्सेस नहीं।'],409:['Conflict: repo is empty or branch changed. Try again.','कॉन्फ्लिक्ट: रिपो खाली है या ब्रांच बदल गई। दोबारा करो।'],422:['Invalid data: bad name, repo already exists, branch moved or invalid path. Reload the repo and retry.','डेटा गलत: नाम गलत, रिपो पहले से है, ब्रांच बदल गई या पाथ गलत। रिपो दोबारा लोड करके फिर करो।']}[s]||['Unexpected error.','अनपेक्षित एरर।'];return`[${s}] ❌\nEN: ${M[0]}\nHI: ${M[1]}${m?'\nGitHub: '+m:''}`}
const eText=e=>e&&e.st!==undefined?explain(e.st,e.msg):String(e&&e.message||e);
/* ---------- offline cat overlay ---------- */
const offShow=()=>$('off').classList.add('on'),offHide=()=>$('off').classList.remove('on');
addEventListener('offline',offShow);addEventListener('online',offHide);
/* ---------- GitHub ---------- */
function lg(t){const b=$('lg');b.style.display='block';b.appendChild(el('div','',t));b.scrollTop=1e9}
async function gh(path,o={},tries=5,raw){
 if(!TOK)throw new Error(B('Locked. Connect or unlock first.','लॉक है। पहले जुड़ो या अनलॉक करो।'));let r;
 for(let a=0;a<tries;a++){
  try{r=await fetch(path.startsWith('https:')?path:'https://api.github.com'+path,{...o,headers:{Authorization:'Bearer '+TOK,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(o.body?{'Content-Type':'application/json'}:{}),...(o.headers||{})},referrerPolicy:'no-referrer',cache:'no-store',credentials:'omit'})}
  catch(e){if(a<tries-1){await sleep(1500*(a+1));continue}offShow();throw{st:0}}
  if(r.ok)break;
  const ra=+r.headers.get('retry-after')||0,rem=r.headers.get('x-ratelimit-remaining'),rs=+r.headers.get('x-ratelimit-reset')||0;
  if(([429,500,502,503,504].includes(r.status)||(r.status===403&&(ra||rem==='0')))&&a<tries-1){const w=Math.min(65000,ra?ra*1000:rem==='0'?Math.max(2000,rs*1000-Date.now()+500):2000*(a+1));lg(T('GitHub asked to slow down, retrying in '+Math.round(w/1000)+'s…','GitHub ने रुकने को कहा, '+Math.round(w/1000)+' सेकंड में दोबारा…'));await sleep(w);continue}
  break}
 if(!r.ok){let j=null;try{j=await r.json()}catch(e){}throw{st:r.status,msg:j&&j.message}}
 if(raw)return r;if(r.status===204)return null;try{return await r.json()}catch(e){return null}}
const brVal=()=>{const b=$('br').value.trim()||'main';if(!/^[\w./-]{1,100}$/.test(b)||b.includes('..'))throw new Error(B('Invalid branch name.','ब्रांच का नाम गलत है।'));return b};
const encP=p=>p.split('/').map(encodeURIComponent).join('/');
/* ---------- repo selection ---------- */
function setMode(m){MODE=m;$('sOld').className=m==='old'?'on':'';$('sNew').className=m==='new'?'on':'';$('pOld').classList.toggle('hide',m!=='old');$('pNew').classList.toggle('hide',m!=='new');if(m==='new')$('br').value='main';else onRepo();updLbl()}
function repoFull(){if(MODE==='new'){const n=$('rn').value.trim();if(!/^[\w.-]{1,100}$/.test(n))throw new Error(B('Enter a valid repository name (letters, numbers, - _ .).','सही रिपॉज़िटरी नाम लिखो (अक्षर, अंक, - _ .)।'));if(!USER)throw new Error(B('Connect GitHub first.','पहले GitHub से जुड़ो।'));return USER+'/'+n}const v=$('rs').value;if(!/^[\w.-]+\/[\w.-]+$/.test(v))throw new Error(B('Choose a repository on Home (step 3).','Home पर रिपॉज़िटरी चुनो (स्टेप 3)।'));return v}
function updLbl(){let t='—';try{t=repoFull()+' · '+brVal()}catch(e){}document.querySelectorAll('.rl').forEach(n=>n.textContent=t);showYml()}
async function loadRepos(){let all=[];for(let p=1;p<=3;p++){const j=await gh(`/user/repos?per_page=100&sort=pushed&page=${p}`);all=all.concat(j);if(j.length<100)break}
 const s=$('rs');s.replaceChildren();all.forEach(r=>{const o=el('option','',r.full_name+(r.private?' · '+T('private','प्राइवेट'):' · '+T('public','पब्लिक')));o.value=r.full_name;o.dataset.b=r.default_branch;s.appendChild(o)});
 if(!all.length)s.appendChild(el('option','',T('No repos yet. Create a new one.','अभी कोई रिपो नहीं। नई बनाओ।')));onRepo()}
function onRepo(){const o=$('rs').selectedOptions[0];if(o&&o.dataset.b)$('br').value=o.dataset.b;resetRepo();updLbl()}
/* ---------- token: memory only + optional encrypted vault + locking ---------- */
function setConn(){const on=!!TOK;$('cs').textContent=on?'@'+USER:(LS.g('z2g_v')?T('Locked','लॉक'):T('Not connected','जुड़ा नहीं'));$('c1').classList.toggle('hide',on);$('c1b').classList.toggle('hide',!on);$('un').textContent='@'+USER}
function refreshGates(){const has=!!TOK,vault=!!LS.g('z2g_v');document.querySelectorAll('.gated').forEach(n=>n.classList.toggle('hide',!has));document.querySelectorAll('[data-gate]').forEach(g=>{g.classList.toggle('hide',has);g.querySelector('.gm').textContent=vault?T('Enter your password to view this page.','यह पेज देखने के लिए पासवर्ड डालो।'):T('Not connected. Connect GitHub on Home first.','जुड़े नहीं हैं। पहले Home पर GitHub से जुड़ो।');g.querySelector('.gf').classList.toggle('hide',!vault);g.querySelector('.gh2').classList.toggle('hide',vault)})}
function lock(msg){TOK=null;USER='';TREE=null;PEND.clear();POLL++;RKEY='';['rl','rc','res','m4','m5'].forEach(i=>$(i).replaceChildren());$('rs').replaceChildren();$('av').classList.add('hide');$('sh').classList.remove('on');$('sh').replaceChildren();$('rt').classList.add('hide');$('rsw').classList.add('hide');$('pend').classList.add('hide');setConn();refreshGates();updLbl();if(msg)toast(msg)}
function bump(){clearTimeout(idleT);if(TOK)idleT=setTimeout(()=>{if(PUSHING)return bump();lock(T('Auto-locked after 5 min idle.','5 मिनट खाली रहने पर ऑटो-लॉक हो गया।'))},3e5)}
['click','keydown','touchstart'].forEach(e=>addEventListener(e,bump,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){hideT=setTimeout(()=>{if(TOK&&!PUSHING)lock(T('Locked while app was in background.','ऐप बैकग्राउंड में था, इसलिए लॉक हो गया।'))},12e4)}else{clearTimeout(hideT);if(PUSHING){WL=null;awake(true)}}});
addEventListener('pagehide',()=>{if(!PUSHING)TOK=null});
const b64=u=>{let s='';const a=new Uint8Array(u);for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)},ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pk(pw,salt,n){const m=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:n,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function onConnected(u){USER=u.login;const a=$('av');if(u.avatar_url&&/^https:\/\/avatars\.githubusercontent\.com\//.test(u.avatar_url)){a.src=u.avatar_url;a.classList.remove('hide')}setConn();refreshGates();bump();G(loadRepos)()}
async function connect(){
 const t=$('tk').value.trim();if(!/^(ghp_|github_pat_|gho_)[\w]+$/.test(t))throw new Error(B('Token should start with ghp_ or github_pat_.','टोकन ghp_ या github_pat_ से शुरू होना चाहिए।'));
 const pw=$('pw').value;if($('rem').checked&&pw.length<8)throw new Error(B('Password must be 8 or more characters.','पासवर्ड 8 या ज़्यादा अक्षरों का हो।'));
 TOK=t;let u;try{u=await gh('/user')}catch(e){TOK=null;throw e}
 if($('rem').checked){const s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));LS.s('z2g_v',JSON.stringify({v:2,n:ITER,s:b64(s),i:b64(iv),c:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},await pk(pw,s,ITER),enc.encode(t)))}));LS.d('z2g_f')}
 $('tk').value='';$('pw').value='';await onConnected(u);toast(T('Connected.','जुड़ गए।'))}
async function doUnlock(pw){
 const v=LS.g('z2g_v');if(!v)throw new Error(B('Nothing saved on this phone.','इस फ़ोन में कुछ सेव नहीं है।'));
 const o=JSON.parse(v);try{TOK=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.i)},await pk(pw,ub(o.s),o.n||310000),ub(o.c)))}
 catch(e){TOK=null;const f=+(LS.g('z2g_f')||0)+1;LS.s('z2g_f',f);await sleep(900*f);if(f>=5){LS.d('z2g_v');LS.d('z2g_f');setConn();refreshGates();throw new Error(B('5 wrong passwords: saved token erased.','5 बार गलत पासवर्ड: सेव किया टोकन मिटा दिया।'))}throw new Error(B('Wrong password. Tries left: '+(5-f),'पासवर्ड गलत है। बचे मौके: '+(5-f)))}
 LS.d('z2g_f');let u;try{u=await gh('/user')}catch(e){TOK=null;throw e}$('pw').value='';await onConnected(u);toast(T('Unlocked.','अनलॉक हो गया।'))}
function forget(){lock();LS.d('z2g_v');LS.d('z2g_f');setConn();refreshGates();toast(T('Disconnected. Saved token erased.','डिस्कनेक्ट हो गया। सेव टोकन मिटा दिया।'))}
/* ---------- paths & staging (Home / Files) ---------- */
function norm(p){p=String(p).replace(/\\/g,'/').replace(/^(\.\/|\/)+/,'').replace(/\/+/g,'/').replace(/\/$/,'');const s=p.split('/');if(!p||p.length>250||s.some(x=>x==='.'||x==='..')||s[0].toLowerCase()==='.git'||/[\u0000-\u001f]/.test(p))throw new Error('Bad path: '+p.slice(0,60));return p}
const join=(d,p)=>d?d+'/'+p:p,dest=()=>{const d=$('dest').value.trim();return d?norm(d):''};
function stats(){let s=0;FILES.forEach(u=>s+=u.length);const t=FILES.size+T(' files · ',' फ़ाइलें · ')+fmt(s);$('sF').textContent=t;$('zs').textContent=FILES.size?'✓ '+t:T('No files added yet.','अभी कोई फ़ाइल नहीं जुड़ी।')}
function stripRoot(list,on){if(on&&list.length&&list.every(([p])=>p.includes('/')&&p.split('/')[0]===list[0][0].split('/')[0]))return list.map(([p,x])=>[p.slice(p.indexOf('/')+1),x]);return list}
async function readZip(f,on){const z=await JSZip.loadAsync(f);let l=[];z.forEach((p,o)=>{if(!o.dir&&!/^__MACOSX\/|(^|\/)\.DS_Store$/.test(p))l.push([p,o])});if(l.length>5000)throw new Error(B('ZIP has more than 5000 files.','ZIP में 5000 से ज़्यादा फ़ाइलें हैं।'));return stripRoot(l,on)}
function addDone(n,bad){CUR='';renderFiles();toast(T(n+' files added'+(bad?', '+bad+' skipped':''),n+' फ़ाइलें जुड़ गईं'+(bad?', '+bad+' छोड़ीं':'')))}
async function intoMap(map,d,list,getU){let n=0,bad=0;for(const [p,o] of list){try{map(join(d,norm(p)),await getU(o));n++}catch(x){bad++}if((n+bad)%40===0)await sleep(0)}return[n,bad]}
$('zf').onchange=G(async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const d=dest();toast(T('Reading ZIP…','ZIP पढ़ रहे हैं…'));const l=await readZip(f,$('strip').checked);const[n,b]=await intoMap((p,u)=>FILES.set(p,u),d,l,o=>o.async('uint8array'));addDone(n,b)});
$('ff').onchange=G(async e=>{const d=dest(),l=[...e.target.files].map(f=>[f.name,f]);const[n,b]=await intoMap((p,u)=>FILES.set(p,u),d,l,async f=>new Uint8Array(await f.arrayBuffer()));e.target.value='';addDone(n,b)});
$('df').onchange=G(async e=>{const d=dest();let l=[...e.target.files].map(f=>[f.webkitRelativePath||f.name,f]);l=stripRoot(l,$('strip').checked);const[n,b]=await intoMap((p,u)=>FILES.set(p,u),d,l,async f=>new Uint8Array(await f.arrayBuffer()));e.target.value='';addDone(n,b)});
['app/src/main/res/drawable','app/src/main/res/layout','app/src/main/res/values','app/src/main/java','app/src/main','app','.github/workflows'].forEach(p=>{const b=el('button','tag',p.replace('app/src/main','…/main'));b.onclick=()=>$('dest').value=p;$('chipsB').appendChild(b)});
/* ---------- explorer helpers ---------- */
function crumbs(box,dir,set){box.replaceChildren();const a=el('button','','/');a.onclick=()=>set('');box.appendChild(a);let acc='';dir.split('/').filter(Boolean).forEach(s=>{acc=join(acc,s);const p=acc,b=el('button','',s);b.onclick=()=>set(p);box.append('›',b)})}
function row(i,name,sub,tap,acts=[],badge){const r=el('div','ri'),m=el('button','rmain'),d=el('div'),b=el('b','',name);if(badge)b.appendChild(el('span','badge',badge));d.append(b,el('small','',sub));m.append(ic(i),d);m.onclick=tap;r.appendChild(m);acts.forEach(([n,f])=>{const x=el('button','rb');x.appendChild(ic(n));x.setAttribute('aria-label',n);x.onclick=e=>{e.stopPropagation();f()};r.appendChild(x)});return r}
function listDirM(map,dir){const pre=dir?dir+'/':'',D=new Map(),F=[];for(const [p,v] of map){if(!p.startsWith(pre))continue;const r=p.slice(pre.length),i=r.indexOf('/'),sz=v.size!==undefined?v.size:v.length;if(i<0)F.push([r,p,v]);else{const d=r.slice(0,i),o=D.get(d)||{n:0,s:0};o.n++;o.s+=sz;D.set(d,o)}}return[D,F]}
const byN=(a,b)=>a[0].localeCompare(b[0]);
function renderFiles(){const [D,F]=listDirM(FILES,CUR),box=$('fl');box.replaceChildren();crumbs($('fc'),CUR,d=>{CUR=d;renderFiles()});
 [...D].sort(byN).forEach(([n,o])=>box.appendChild(row('folder',n,o.n+T(' files · ',' फ़ाइलें · ')+fmt(o.s),()=>{CUR=join(CUR,n);renderFiles()},[['trash',()=>{const d=join(CUR,n);if(confirm(T('Delete folder '+d+'?','फ़ोल्डर '+d+' हटाएँ?'))){[...FILES.keys()].forEach(k=>k.startsWith(d+'/')&&FILES.delete(k));renderFiles()}}]])));
 F.sort(byN).forEach(([n,p,v])=>box.appendChild(row('file',n,fmt(v.length),()=>openFile(p),[['down',()=>dl(n,v)]])));
 if(!D.size&&!F.length)box.appendChild(el('p','empty',T('Nothing here yet. Add a ZIP, files or a folder.','यहाँ अभी कुछ नहीं। ZIP, फ़ाइलें या फ़ोल्डर जोड़ो।')));stats()}
function asText(u){if(u.length>2e6||u.includes(0))return null;try{return new TextDecoder('utf-8',{fatal:true}).decode(u)}catch(e){return null}}
function dl(name,u){const a=el('a');a.href=URL.createObjectURL(new Blob([u]));a.download=name.split('/').pop();document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
function sheet(title,sub,body,btns){const s=$('sh'),c=el('div','sc');s.replaceChildren(c);c.append(el('h3','',title),el('p','',sub));if(body!=null)c.appendChild(el('pre','',body));const r=el('div','r');btns.concat([['x',T('Close','बंद करो'),()=>{}]]).forEach(([i,l,f])=>{const b=el('button','btn g');b.append(ic(i),el('span','',l));b.onclick=()=>{s.classList.remove('on');f()};r.appendChild(b)});c.appendChild(r);s.classList.add('on')}
function editSheet(title,text,onSave){const s=$('sh'),c=el('div','sc'),ta=el('textarea','ed');ta.value=text;ta.spellcheck=false;s.replaceChildren(c);c.append(el('h3','',title),ta);const r=el('div','r'),sv=el('button','btn'),cn=el('button','btn g');sv.append(ic('check'),el('span','',T('Save to changes','बदलाव में सेव करो')));cn.append(ic('x'),el('span','',T('Cancel','रद्द करो')));sv.onclick=()=>{s.classList.remove('on');onSave(ta.value)};cn.onclick=()=>s.classList.remove('on');r.append(sv,cn);c.appendChild(r);s.classList.add('on')}
$('sh').onclick=e=>{if(e.target.id==='sh')$('sh').classList.remove('on')};
const NOPRE=()=>T('Binary file, no preview.','बाइनरी फ़ाइल, प्रीव्यू नहीं।');
function openFile(p){const u=FILES.get(p),t=asText(u);sheet(p,fmt(u.length),t===null?NOPRE():t.slice(0,20000),[['down',T('Download','डाउनलोड'),()=>dl(p,u)],['move',T('Move path','पाथ बदलो'),()=>{const n=prompt(T('New full path','नया पूरा पाथ'),p);if(n&&n!==p){try{FILES.set(norm(n),u);FILES.delete(p);renderFiles()}catch(e){toast(eText(e),1)}}}],['trash',T('Remove','हटाओ'),()=>{FILES.delete(p);renderFiles()}]])}
async function mkZip(prefix){const z=new JSZip();let n=0;for(const [p,u] of FILES)if(!prefix||p.startsWith(prefix+'/')){z.file(prefix?p.slice(prefix.length+1):p,u);n++}if(!n)throw new Error(B('Nothing to zip.','ZIP के लिए कुछ नहीं है।'));dl((prefix.split('/').pop()||'project')+'.zip',await z.generateAsync({type:'uint8array',compression:'DEFLATE'}))}
/* ---------- shared git tree builder ---------- */
const u2b=u=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(new Blob([u]))});
async function buildEntry(repo,list,onP){const tree=[],bins=[];
 for(const [p,u,mode] of list){const t=u.length?(u.length<=1e6?asText(u):null):'';if(t!==null)tree.push({path:p,mode,type:'blob',content:t});else{if(u.length>95e6)throw new Error(B(p+': file is over 95 MB, GitHub rejects it.',p+': फ़ाइल 95 MB से बड़ी है, GitHub मना करता है।'));bins.push([p,u,mode])}}
 let q=0,done=0;const work=async()=>{while(q<bins.length){const [p,u,mode]=bins[q++];const b=await gh(`/repos/${repo}/git/blobs`,{method:'POST',body:JSON.stringify({content:await u2b(u),encoding:'base64'})});tree.push({path:p,mode,type:'blob',sha:b.sha});done++;onP&&onP(done/Math.max(bins.length,1))}};
 await Promise.all([work(),work(),work(),work(),work(),work()]);return[tree,bins.length]}
async function chainTrees(repo,base,tree,onP){const chunks=[];let cur=[],sz=0;for(const e of tree){const s=(e.content||'').length+200;if(cur.length&&(cur.length>=150||sz+s>3e6)){chunks.push(cur);cur=[];sz=0}cur.push(e);sz+=s}if(cur.length)chunks.push(cur);
 let prev=base;for(let i=0;i<chunks.length;i++){const b={tree:chunks[i]};if(prev)b.base_tree=prev;prev=(await gh(`/repos/${repo}/git/trees`,{method:'POST',body:JSON.stringify(b)})).sha;onP&&onP((i+1)/chunks.length)}return prev}
const modeOf=p=>/(^|\/)gradlew$|\.sh$/.test(p)?'100755':'100644';
/* ---------- push from Home ---------- */
function pr(p){$('pg').style.width=p+'%';$('pt').textContent=Math.round(p)+'%';$('lvb').style.width=p+'%';$('lvt').textContent=T('Pushing… ','पुश हो रहा है… ')+Math.round(p)+'%';document.title=PUSHING?Math.round(p)+'% · Zip2Git':'Zip2Git'}
async function awake(on){try{if(on&&!WL)WL=await navigator.wakeLock.request('screen');else if(!on&&WL){await WL.release();WL=null}}catch(e){}}
addEventListener('beforeunload',e=>{if(PUSHING){e.preventDefault();e.returnValue=''}});
function linkBtn(label,url,icon){const a=el('a','btn g');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.append(ic(icon),el('span','',label));$('lk').appendChild(a)}
async function push(){
 if(PUSHING)return toast(T('A push is already running.','पुश पहले से चल रहा है।'));
 if(!TOK)throw new Error(B('Connect GitHub first (Home, step 1).','पहले GitHub से जुड़ो (Home, स्टेप 1)।'));
 if(!FILES.size)throw new Error(B('Upload a ZIP first (Home, step 2).','पहले ZIP अपलोड करो (Home, स्टेप 2)।'));
 const repo=repoFull(),br=brVal();$('m3').replaceChildren();$('lg').replaceChildren();$('lk').replaceChildren();$('pb').disabled=true;PUSHING=true;$('lv').style.display='flex';await awake(true);pr(2);
 try{
  let info;try{info=await gh('/repos/'+repo)}catch(e){if(e.st===404&&MODE==='new'){lg(T('Creating repository…','रिपॉज़िटरी बना रहे हैं…'));info=await gh('/user/repos',{method:'POST',body:JSON.stringify({name:repo.split('/')[1],description:$('rd').value.trim().slice(0,300)||'Source code uploaded via Zip2Git',private:$('rv').value==='1',auto_init:true})});await sleep(1500)}else throw e}
  try{await gh(`/repos/${repo}/commits?per_page=1`)}catch(e){if(e.st===409){lg(T('Empty repo, initialising…','खाली रिपो, शुरू कर रहे हैं…'));await gh(`/repos/${repo}/contents/README.md`,{method:'PUT',body:JSON.stringify({message:'init',content:btoa('# '+repo.split('/')[1]+'\n')})})}else throw e}
  let parent,exists=true;try{parent=(await gh(`/repos/${repo}/git/ref/heads/${encP(br)}`)).object.sha}catch(e){if(e.st!==404)throw e;exists=false;parent=(await gh(`/repos/${repo}/git/ref/heads/${encP(info.default_branch)}`)).object.sha}
  const base=(await gh(`/repos/${repo}/git/commits/${parent}`)).tree.sha;pr(8);
  const [tree,nb]=await buildEntry(repo,[...FILES].map(([p,u])=>[p,u,modeOf(p)]),f=>{pr(8+f*50)});lg(`${tree.length-nb} text + ${nb} binary`);
  const prev=await chainTrees(repo,$('mir').checked?null:base,tree,f=>{pr(58+f*30)});
  const c=await gh(`/repos/${repo}/git/commits`,{method:'POST',body:JSON.stringify({message:`Deploy via Zip2Git (${FILES.size} files)`,tree:prev,parents:[parent]})});pr(94);
  if(exists)await gh(`/repos/${repo}/git/refs/heads/${encP(br)}`,{method:'PATCH',body:JSON.stringify({sha:c.sha,force:$('mir').checked})});else await gh(`/repos/${repo}/git/refs`,{method:'POST',body:JSON.stringify({ref:'refs/heads/'+br,sha:c.sha})});
  PUSHING=false;pr(100);lg('SUCCESS ✓ '+FILES.size);const m=el('div','msg ok');m.textContent=T('Pushed successfully! ','पुश सफल रहा! ')+repo+' · '+br;$('m3').appendChild(m);
  const url='https://github.com/'+repo;linkBtn(T('Open repo','रिपो खोलो'),url+'/tree/'+br,'link');linkBtn('Vercel','https://vercel.com/new/clone?repository-url='+encodeURIComponent(url),'up');linkBtn('Netlify','https://app.netlify.com/start/deploy?repository='+encodeURIComponent(url),'up');
  toast(T('Push complete ✓','पुश पूरा ✓'));if(MODE==='new'){await loadRepos();$('rs').value=repo;setMode('old')}
 }catch(e){const t=eText(e);lg(t);const m=el('div','msg');m.textContent=t;$('m3').appendChild(m);toast(t,1)}finally{PUSHING=false;$('lv').style.display='none';document.title='Zip2Git';$('pb').disabled=false;awake(false)}}
/* ---------- REPO MANAGER: browse / edit / delete / add / push ---------- */
function resetRepo(){TREE=null;PEND.clear();RD='';RKEY='';renderRepo()}
async function blobOf(sha,r){const b=await gh(`/repos/${r}/git/blobs/${sha}`);return ub(b.content.replace(/\n/g,''))}
async function loadRepo(){const r=repoFull(),br=brVal();toast(T('Loading…','लोड हो रहा है…'));
 const ref=await gh(`/repos/${r}/git/ref/heads/${encP(br)}`),c=await gh(`/repos/${r}/git/commits/${ref.object.sha}`),t=await gh(`/repos/${r}/git/trees/${c.tree.sha}?recursive=1`);
 TREE=new Map();t.tree.forEach(x=>{if(x.type==='blob')TREE.set(x.path,{sha:x.sha,size:x.size||0,mode:x.mode})});PEND.clear();RD='';RKEY=r+'@'+br;renderRepo();
 if(t.truncated)toast(T('Repo is very large, list may be incomplete.','रिपो बहुत बड़ी है, लिस्ट अधूरी हो सकती है।'),1)}
function eff(){const m=new Map();if(TREE)TREE.forEach((v,p)=>m.set(p,v));PEND.forEach((v,p)=>{if(v.del)m.delete(p);else m.set(p,{sha:v.sha,size:v.data?v.data.length:v.size,mode:v.mode||'100644',pend:1,data:v.data})});return m}
const markDel=p=>{if(TREE&&TREE.has(p))PEND.set(p,{del:1});else PEND.delete(p)};
function renderRepo(){const box=$('rl');box.replaceChildren();$('rt').classList.toggle('hide',!TREE);$('rsw').classList.toggle('hide',!TREE);if(!TREE){$('rc').replaceChildren();updPend();return}
 crumbs($('rc'),RD,d=>{RD=d;renderRepo()});const M=eff(),[D,F]=listDirM(M,RD);
 [...D].sort(byN).forEach(([n,o])=>{const d=join(RD,n);box.appendChild(row('folder',n,o.n+T(' files · ',' फ़ाइलें · ')+fmt(o.s),()=>{RD=d;renderRepo()},[['edit',()=>renameFolder(d)],['trash',()=>delFolder(d)]]))});
 F.sort(byN).forEach(([n,p,v])=>box.appendChild(row('file',n,fmt(v.size),G(()=>openRepoFile(p)),[['down',G(async()=>dl(n,await dataOf(p)))],['trash',()=>delFile(p)]],v.pend?T('changed','बदला'):'')));
 if(!D.size&&!F.length)box.appendChild(el('p','empty',T('Empty folder.','खाली फ़ोल्डर।')));updPend()}
async function dataOf(p){const v=eff().get(p);if(!v)throw new Error('Missing: '+p);return v.data||await blobOf(v.sha,repoFull())}
function delFile(p){if(!confirm(T('Delete '+p+'?','हटाएँ '+p+'?')))return;markDel(p);renderRepo()}
function under(d){return[...eff().keys()].filter(k=>k.startsWith(d+'/'))}
function delFolder(d){const l=under(d);if(!confirm(T('Delete folder '+d+' and its '+l.length+' files?','फ़ोल्डर '+d+' और उसकी '+l.length+' फ़ाइलें हटाएँ?')))return;l.forEach(markDel);renderRepo()}
function mv(from,to){const M=eff(),v=M.get(from);if(!v)return;if(v.data)PEND.set(to,{data:v.data,mode:v.mode});else PEND.set(to,{sha:v.sha,size:v.size,mode:v.mode});markDel(from)}
function renameFolder(d){const n=prompt(T('New folder path','फ़ोल्डर का नया पाथ'),d);if(!n||n===d)return;let nn;try{nn=norm(n)}catch(e){return toast(eText(e),1)}if(nn.startsWith(d+'/'))return toast(T('Cannot move a folder into itself.','फ़ोल्डर को अपने अंदर नहीं ले जा सकते।'),1);under(d).forEach(k=>mv(k,nn+k.slice(d.length)));if(RD===d)RD=nn;renderRepo()}
async function openRepoFile(p){const v=eff().get(p);toast(T('Loading…','लोड हो रहा है…'));const u=await dataOf(p),t=asText(u);
 const btns=[];if(t!==null&&u.length<=1e6)btns.push(['edit',T('Edit','एडिट'),()=>editSheet(p,t,x=>{if(x!==t){PEND.set(p,{data:enc.encode(x),mode:v.mode});renderRepo()}})]);
 btns.push(['down',T('Download','डाउनलोड'),()=>dl(p,u)],['move',T('Rename / move','नाम / पाथ बदलो'),()=>{const n=prompt(T('New full path','नया पूरा पाथ'),p);if(!n||n===p)return;try{const np=norm(n);if(eff().has(np)&&!confirm(T(np+' exists. Overwrite?',np+' पहले से है। बदलें?')))return;mv(p,np);renderRepo()}catch(e){toast(eText(e),1)}}],['trash',T('Delete','डिलीट'),()=>delFile(p)]);
 sheet(p,fmt(u.length),t===null?NOPRE():t.slice(0,20000),btns)}
async function addToRepo(list,getU){if(!TREE)throw new Error(B('Load the repo first.','पहले रिपो लोड करो।'));const[n,b]=await intoMap((p,u)=>PEND.set(p,{data:u,mode:modeOf(p)}),RD,list,getU);renderRepo();toast(T(n+' files added to '+(RD||'/')+(b?', '+b+' skipped':''),n+' फ़ाइलें '+(RD||'/')+' में जुड़ीं'+(b?', '+b+' छोड़ीं':'')))}
$('rffi').onchange=G(async e=>{const l=[...e.target.files].map(f=>[f.name,f]);e.target.value='';await addToRepo(l,async f=>new Uint8Array(await f.arrayBuffer()))});
$('rdfi').onchange=G(async e=>{let l=[...e.target.files].map(f=>[f.webkitRelativePath||f.name,f]);l=stripRoot(l,false);e.target.value='';await addToRepo(l,async f=>new Uint8Array(await f.arrayBuffer()))});
$('rzfi').onchange=G(async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(!TREE)throw new Error(B('Load the repo first.','पहले रिपो लोड करो।'));const l=await readZip(f,$('rstrip').checked);await addToRepo(l,o=>o.async('uint8array'))});
function newFile(){const n=prompt(T('New file name (inside '+(RD||'/')+')','नई फ़ाइल का नाम ('+(RD||'/')+' में)'));if(!n)return;let p;try{p=join(RD,norm(n))}catch(e){return toast(eText(e),1)}editSheet(p,'',x=>{PEND.set(p,{data:enc.encode(x),mode:modeOf(p)});renderRepo()})}
function updPend(){const n=PEND.size;$('pend').classList.toggle('hide',!n);$('pn').textContent=T(n+' changes waiting to be pushed',n+' बदलाव पुश के इंतज़ार में')}
function review(){const l=[];PEND.forEach((v,p)=>l.push((v.del?'− ':TREE&&TREE.has(p)?'✎ ':'＋ ')+p));sheet(T('Pending changes','बदलाव'),l.length+'',l.sort().join('\n'),[])}
async function rpush(){if(PUSHING)return;if(!PEND.size)return toast(T('No changes.','कोई बदलाव नहीं।'));const r=repoFull(),br=brVal();if(r+'@'+br!==RKEY)throw new Error(B('Repo or branch changed. Load the repo again.','रिपो या ब्रांच बदल गई। रिपो दोबारा लोड करो।'));
 PUSHING=true;awake(true);$('m5').replaceChildren();toast(T('Pushing changes…','बदलाव पुश हो रहे हैं…'));
 try{const ref=await gh(`/repos/${r}/git/ref/heads/${encP(br)}`),parent=ref.object.sha,base=(await gh(`/repos/${r}/git/commits/${parent}`)).tree.sha;
  const ents=[],puts=[];PEND.forEach((v,p)=>{if(v.del)ents.push({path:p,mode:'100644',type:'blob',sha:null});else if(v.sha)ents.push({path:p,mode:v.mode,type:'blob',sha:v.sha});else puts.push([p,v.data,v.mode])});
  const[tree]=await buildEntry(r,puts);const all=ents.concat(tree),tsha=await chainTrees(r,base,all);
  const msg=$('cmsg').value.trim().slice(0,200)||`Update via Zip2Git (${PEND.size} changes)`;
  const c=await gh(`/repos/${r}/git/commits`,{method:'POST',body:JSON.stringify({message:msg,tree:tsha,parents:[parent]})});
  await gh(`/repos/${r}/git/refs/heads/${encP(br)}`,{method:'PATCH',body:JSON.stringify({sha:c.sha,force:false})});
  $('cmsg').value='';PEND.clear();await loadRepo();const m=el('div','msg ok');m.textContent=T('Changes pushed ✓','बदलाव पुश हो गए ✓');$('m5').appendChild(m)
 }catch(e){const m=el('div','msg');m.textContent=eText(e);$('m5').replaceChildren(m);toast(eText(e),1)}finally{PUSHING=false;awake(false)}}
async function delRepo(){const r=repoFull();const a=prompt(T('This deletes '+r+' FOREVER. Type the full repo name to confirm:',r+' हमेशा के लिए डिलीट होगी। पक्का करने के लिए पूरा रिपो नाम लिखो:'));if(a===null)return;if(a.trim()!==r)throw new Error(B('Name did not match. Nothing deleted.','नाम मेल नहीं खाया। कुछ डिलीट नहीं हुआ।'));
 await gh('/repos/'+r,{method:'DELETE'});resetRepo();await loadRepos();toast(T('Repo deleted.','रिपो डिलीट हो गई।'))}
/* ---------- BUILD: workflows ---------- */
const X=s=>s.replaceAll('«','${{').replaceAll('»','}}');
const WFN={android:'build-android.yml',pages:'deploy-pages.yml',all:'build-all.yml'};
const TYPES=[['cap','Web app → Capacitor APK + AAB','वेब ऐप → Capacitor APK + AAB'],['gradle','Native Android (gradlew in project)','नेटिव Android (प्रोजेक्ट में gradlew)']];
const PREP=`      - name: Prepare web files
        run: |
          LOG="$RUNNER_TEMP/build.log"
          if [ -f package.json ] && grep -q '"build"' package.json; then
            npm install --no-audit --no-fund 2>&1 | tee -a "$LOG"
            npm run build 2>&1 | tee -a "$LOG"
            WEB=""
            for d in dist build out; do if [ -f "$d/index.html" ]; then WEB="$d"; break; fi; done
            if [ -z "$WEB" ]; then echo "error: build finished but no dist/build/out folder with index.html was found" | tee -a "$LOG"; exit 1; fi
          else
            mkdir -p _site
            rsync -a --exclude='.git' --exclude='.github' --exclude='_site' --exclude='android' --exclude='node_modules' ./ _site/
            WEB=_site
            if [ ! -f _site/index.html ]; then echo "error: index.html not found in the repo root" | tee -a "$LOG"; exit 1; fi
          fi
          echo "WEB=$WEB" >> "$GITHUB_ENV"
`;
const EXPL=`      - name: Explain failure
        if: failure()
        run: |
          LOG="$RUNNER_TEMP/build.log"; touch "$LOG"
          ERR=$(grep -E 'error:|FAILED|What went wrong|Execution failed|Could not |not found|Permission denied|SDK location|npm ERR|Cannot find|Missing script|Unsupported|No such file|^e: ' "$LOG" | head -n 10 || true)
          hint(){ if grep -qE "$1" "$LOG"; then echo "- $2"; fi; }
          {
            echo "## ❌ Build failed / बिल्ड फेल हुआ"
            echo "### Likely cause / संभावित कारण"
            hint 'gradlew not found|gradlew: not found|No such file.*gradlew' "gradlew missing: upload the full Android project. / gradlew नहीं मिला: पूरा Android प्रोजेक्ट अपलोड करो।"
            hint 'Permission denied' "File permission problem. / फ़ाइल परमिशन की दिक्कत।"
            hint 'SDK location not found' "Android SDK path problem (remove local.properties from the repo). / SDK पाथ की दिक्कत (local.properties हटाओ)।"
            hint 'Could not resolve|Could not GET|Connection reset|timed out' "A dependency could not be downloaded; check the library name/version or retry. / कोई लाइब्रेरी डाउनलोड नहीं हुई; नाम/वर्शन जाँचो या दोबारा चलाओ।"
            hint 'Unsupported class file major version|Unsupported Java|invalid source release|JAVA_HOME' "Java version mismatch (workflow uses Java 17). / Java वर्शन मेल नहीं खाता (वर्कफ़्लो Java 17 चलाता है)।"
            hint 'Missing script|npm ERR' "npm install/build failed; check package.json. / npm इंस्टॉल/बिल्ड फेल; package.json जाँचो।"
            hint 'Unresolved reference|Compilation error|cannot find symbol|^e: ' "Code compile error; see the error lines below. / कोड कंपाइल एरर; नीचे के एरर देखो।"
            hint 'AAPT|resource.*not found|Android resource' "Android resource/layout error. / Android रिसोर्स/लेआउट एरर।"
            hint 'no \\.apk|no .apk' "Build finished but produced no APK/AAB. / बिल्ड हुआ पर APK/AAB नहीं बना।"
            echo "### Error lines / एरर लाइनें"
            echo "$ERR" | sed 's/^/    /'
          } >> "$GITHUB_STEP_SUMMARY"
          echo "$ERR" | while IFS= read -r l; do [ -n "$l" ] && echo "::error title=Build failed::$(printf '%s' "$l" | cut -c1-280 | sed 's/%/%25/g')"; done
          exit 0
      - name: Upload build log
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: build-log
          path: «runner.temp»/build.log
          if-no-files-found: ignore
`;
function androidJob(t){const cap=t==='cap';return `  android:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: actions/setup-node@v4
        with:
          node-version: 20
`+(cap?PREP+`      - name: Add Capacitor Android
        env:
          REPO_NAME: «github.event.repository.name»
        run: |
          {
            [ -f package.json ] || npm init -y
            npm install --no-audit --no-fund @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6
            if [ ! -f capacitor.config.json ] && [ ! -f capacitor.config.ts ] && [ ! -f capacitor.config.js ]; then
              npx cap init "$REPO_NAME" com.example.app --web-dir="$WEB"
            fi
            [ -d android ] || npx cap add android
            npx cap sync android
          } 2>&1 | tee -a "$RUNNER_TEMP/build.log"
`:'')+`      - name: Build APK + AAB
        run: |
          LOG="$RUNNER_TEMP/build.log"
`+(cap?`          cd android
`:`          G=$(find . -maxdepth 3 -name gradlew -not -path '*/node_modules/*' | head -n1)
          if [ -z "$G" ]; then echo "error: gradlew not found in the repo (upload the full Android project)" | tee -a "$LOG"; exit 1; fi
          cd "$(dirname "$G")"
`)+`          chmod +x gradlew
          ./gradlew assembleDebug bundleDebug --no-daemon --console=plain 2>&1 | tee -a "$LOG"
      - name: Collect APK + AAB
        run: |
          mkdir -p release
          find . -path '*/node_modules' -prune -o -type f \\( -path '*/outputs/apk/*' -name '*.apk' -o -path '*/outputs/bundle/*' -name '*.aab' \\) -print -exec cp {} release/ \\;
          ls -la release
          if [ -z "$(ls -A release)" ]; then echo "error: build finished but no .apk/.aab was produced" | tee -a "$RUNNER_TEMP/build.log"; exit 1; fi
      - uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: release/*.apk
      - uses: actions/upload-artifact@v4
        with:
          name: android-aab
          path: release/*.aab
      - name: Publish GitHub Release (plain APK + AAB files)
        env:
          GH_TOKEN: «github.token»
          RUN_NO: «github.run_number»
          RUN_ATT: «github.run_attempt»
          SHA: «github.sha»
        run: |
          gh release create "build-$RUN_NO-$RUN_ATT" release/* --title "Build #$RUN_NO" --notes "APK + AAB built from $SHA" --target "$SHA"
`+EXPL}
function pagesJob(){return `  pages:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment:
      name: github-pages
      url: «steps.deployment.outputs.page_url»
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
`+PREP+`      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: «env.WEB»
      - id: deployment
        uses: actions/deploy-pages@v4
`+EXPL}
function yml(){const k=$('wk').value,t=$('wt').value||'cap',br=(()=>{try{return brVal()}catch(e){return'main'}})();
 const H=(name,trig,perm)=>`name: ${name}\non:\n${trig}permissions:\n${perm}concurrency:\n  group: ${k}-«github.ref»\n  cancel-in-progress: true\ndefaults:\n  run:\n    shell: bash\njobs:\n`;
 const D='  workflow_dispatch:\n',P='  contents: write\n  pages: write\n  id-token: write\n';
 if(k==='android')return X(H('Build Android APK + AAB',D,'  contents: write\n')+androidJob(t));
 if(k==='pages')return X(H('Deploy Website',D+`  push:\n    branches: [${br}]\n`,'  contents: read\n  pages: write\n  id-token: write\n')+pagesJob());
 return X(H('Build APK + AAB + Pages',D,P)+androidJob(t)+pagesJob())}
function fillTypes(){const s=$('wt'),old=s.value;s.replaceChildren();TYPES.forEach(([v,e,h])=>{const o=el('option','',HI?h:e);o.value=v;s.appendChild(o)});if(old)s.value=old;showYml()}
const wf=()=>WFN[$('wk').value];
function showYml(){$('wtw').classList.toggle('hide',$('wk').value==='pages');$('yml').value=yml()}
async function copyYml(){try{await navigator.clipboard.writeText($('yml').value);toast(T('Copied.','कॉपी हो गया।'))}catch(e){$('yml').select()}}
function m4(t,ok){const m=el('div','msg'+(ok?' ok':''));m.textContent=t;$('m4').replaceChildren(m)}
async function addWf(){const r=repoFull(),br=brVal(),p=`/repos/${r}/contents/.github/workflows/${wf()}`;let sha;try{sha=(await gh(p+'?ref='+encodeURIComponent(br))).sha}catch(e){if(e.st!==404)throw e}
 await gh(p,{method:'PUT',body:JSON.stringify({message:'Add '+wf(),branch:br,sha,content:btoa(unescape(encodeURIComponent($('yml').value)))})});
 if($('wk').value!=='android'){try{await gh(`/repos/${r}/pages`,{method:'POST',body:JSON.stringify({build_type:'workflow'})},1)}catch(e){}}
 m4(T('Workflow added. Now press Run.','वर्कफ़्लो जुड़ गया। अब Run दबाओ।'),1)}
async function runWf(){const r=repoFull(),t0=Date.now();try{await gh(`/repos/${r}/actions/workflows/${wf()}/dispatches`,{method:'POST',body:JSON.stringify({ref:brVal()})})}catch(e){if(e.st===404)throw new Error(B('Workflow not found on this branch. Press "Add to repo" first.','इस ब्रांच में वर्कफ़्लो नहीं मिला। पहले "रिपो में जोड़ो" दबाओ।'));throw e}
 m4(T('Build started. Live status below.','बिल्ड शुरू हो गया। नीचे लाइव स्टेटस है।'),1);watchRun(t0-30000)}
/* ---------- status, errors, downloads ---------- */
const DX=[[/gradlew.*(not found|missing)|No such file.*gradlew/i,'gradlew is missing. Upload the full Android project (gradlew + gradle/wrapper) to the repo.','gradlew नहीं मिला। पूरा Android प्रोजेक्ट (gradlew + gradle/wrapper) रिपो में डालो।'],
[/Permission denied/i,'File permission problem (gradlew not executable).','फ़ाइल परमिशन की दिक्कत (gradlew चल नहीं सकता)।'],
[/SDK location not found/i,'Android SDK path problem. Remove local.properties from the repo.','Android SDK पाथ की दिक्कत। रिपो से local.properties हटाओ।'],
[/Could not resolve|Could not GET|Connection (reset|timed out)|Unable to tunnel/i,'A dependency could not be downloaded. Check the library name/version or run again.','कोई लाइब्रेरी डाउनलोड नहीं हुई। नाम/वर्शन जाँचो या दोबारा चलाओ।'],
[/Unsupported class file major version|Unsupported Java|invalid source release|JAVA_HOME/i,'Java version mismatch. The workflow uses Java 17.','Java वर्शन मेल नहीं खाता। वर्कफ़्लो Java 17 चलाता है।'],
[/Missing script|npm ERR|ERESOLVE/i,'npm install/build failed. Check package.json and the "build" script.','npm इंस्टॉल/बिल्ड फेल। package.json और "build" स्क्रिप्ट जाँचो।'],
[/no dist\/build\/out|index\.html was found|index\.html not found/i,'Website output not found. Put index.html in the repo root, or make "npm run build" create dist/.','वेबसाइट आउटपुट नहीं मिला। index.html रूट में रखो या "npm run build" से dist/ बनाओ।'],
[/Unresolved reference|Compilation error|cannot find symbol|(^|\n)e: /i,'Code compile error. Fix the lines shown in the error box.','कोड कंपाइल एरर। एरर बॉक्स की लाइनें ठीक करो।'],
[/AAPT|resource.*not found|Android resource/i,'Android resource/layout error (missing drawable, bad XML or name).','Android रिसोर्स/लेआउट एरर (drawable नहीं है, XML या नाम गलत)।'],
[/no \.apk|no \.aab/i,'Build finished but produced no APK/AAB.','बिल्ड हुआ पर APK/AAB नहीं बना।'],
[/Get Pages site failed|Create Pages site failed|HttpError: Not Found|Pages.*not enabled/i,'GitHub Pages is not enabled. Repo Settings → Pages → Source: GitHub Actions (private repos need a paid plan).','GitHub Pages चालू नहीं है। Repo Settings → Pages → Source: GitHub Actions (प्राइवेट रिपो के लिए पेड प्लान चाहिए)।'],
[/Resource not accessible by integration/i,'Workflow has no write permission. Repo Settings → Actions → General → Workflow permissions → Read and write.','वर्कफ़्लो को write परमिशन नहीं। Repo Settings → Actions → General → Workflow permissions → Read and write।'],
[/already_exists|tag.*already exists/i,'This release tag already exists. Run again.','यह रिलीज़ टैग पहले से है। दोबारा चलाओ।'],
[/OutOfMemoryError|Java heap space/i,'Build ran out of memory.','बिल्ड की मेमोरी खत्म हो गई।']];
const EPAT=/error:|FAILED|What went wrong|Execution failed|Could not |not found|Permission denied|SDK location|npm ERR|Cannot find|Missing script|Unsupported|No such file|^e: |##\[error\]/;
const clean=s=>s.replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z\s*/,'').replace(/\x1b\[[0-9;]*m/g,'');
const stIc=(s,c)=>s==='completed'?(c==='success'?'✓':c==='skipped'?'–':c==='cancelled'?'■':'✗'):s==='in_progress'?'⏳':'·';
function stopW(){POLL++}
async function watchRun(minT){const id=++POLL;for(let i=0;i<400&&id===POLL&&TOK;i++){let done=false;try{done=await showStatus(minT)}catch(e){if(id===POLL)toast(eText(e),1);return}if(done)return;await sleep(6000)}}
async function showStatus(minT){const r=repoFull(),j=await gh(`/repos/${r}/actions/workflows/${wf()}/runs?per_page=1`),x=j.workflow_runs[0],box=$('res');
 if(!x||(minT&&new Date(x.created_at).getTime()<minT)){box.replaceChildren(card(T('Waiting for GitHub to start the run…','GitHub के रन शुरू करने का इंतज़ार…')));if(!x&&!minT)throw new Error(B('No runs yet. Press Run first.','अभी कोई रन नहीं। पहले Run दबाओ।'));return false}
 const jb=(await gh(`/repos/${r}/actions/runs/${x.id}/jobs`)).jobs,c=el('div','card'),h=el('h2');h.append(ic('box'),el('span','','#'+x.run_number+' · '+x.name));c.appendChild(h);
 const done=x.status==='completed',ok=x.conclusion==='success',p=el('span','pill '+(done?(ok?'ok':'bad'):'run'),done?(ok?T('Success','सफल'):T('Failed: ','फेल: ')+x.conclusion):x.status==='queued'?T('Queued','कतार में'):T('Running…','चल रहा है…'));c.appendChild(p);
 const a=el('a','btn g sm mt12');a.href=x.html_url;a.target='_blank';a.rel='noopener noreferrer';a.append(ic('link'),el('span','',T('Open run on GitHub','GitHub पर रन खोलो')));c.appendChild(a);
 jb.forEach(J=>{const d=el('div','job');d.appendChild(el('b','',stIc(J.status,J.conclusion)+' '+J.name));(J.steps||[]).forEach(S=>{const s=el('div','step');s.append(el('i','',stIc(S.status,S.conclusion)),el('span','',S.name));d.appendChild(s)});c.appendChild(d)});
 box.replaceChildren(c);
 if(done&&!ok)await showFail(c,r,jb);
 if(done&&ok)await showOut(c,r,x,jb);
 return done}
const card=t=>{const c=el('div','card');c.appendChild(el('p','',t));return c};
async function showFail(c,r,jb){const lines=[],steps=[];
 for(const J of jb.filter(j=>j.conclusion==='failure')){(J.steps||[]).filter(s=>s.conclusion==='failure').forEach(s=>steps.push(J.name+' → '+s.name));
  try{const an=await gh(`/repos/${r}/check-runs/${J.id}/annotations`,{},1);an.filter(n=>n.annotation_level==='failure'&&!/^Process completed with exit code/.test(n.message)).forEach(n=>lines.push(n.message.split('\n')[0]))}catch(e){}
  if(!lines.length){try{const L=await gh(`/repos/${r}/actions/jobs/${J.id}/logs`,{},1,true),tx=(await L.text()).split('\n').map(clean).filter(l=>EPAT.test(l)).slice(-12);tx.forEach(l=>lines.push(l.slice(0,300)))}catch(e){}}}
 const all=lines.join('\n'),hints=DX.filter(d=>d[0].test(all)),b=el('div','errbox');b.appendChild(el('h3','','❌ '+T('Why it failed','फेल क्यों हुआ')));
 if(steps.length)b.appendChild(el('p','',T('Failed step: ','फेल स्टेप: ')+steps.join(', ')));
 const ul=el('ul');(hints.length?hints:[[0,'Open the run on GitHub and read the red step.','GitHub पर रन खोलकर लाल स्टेप पढ़ो।']]).forEach(h=>ul.appendChild(el('li','',T(h[1],h[2]))));b.appendChild(ul);
 if(all)b.appendChild(el('pre','',all));c.appendChild(b)}
async function showOut(c,r,x){const k=$('wk').value,box=el('div','dls');
 if(k!=='pages'){let rel=null;try{const rs=await gh(`/repos/${r}/releases?per_page=10`,{},1);rel=rs.find(z=>z.tag_name===`build-${x.run_number}-${x.run_attempt}`)||rs[0]}catch(e){}
  if(rel){c.appendChild(el('h3','mt14',T('Downloads (plain files)','डाउनलोड (सीधी फ़ाइलें)')));rel.assets.forEach(A=>{const d=el('div','dlr'),i=el('div');i.append(el('b','',A.name),el('small','',fmt(A.size)));const b=el('button','rb');b.appendChild(ic('down'));b.onclick=G(async()=>{toast(T('Downloading…','डाउनलोड हो रहा है…'));try{const R=await gh(`/repos/${r}/releases/assets/${A.id}`,{headers:{Accept:'application/octet-stream'}},1,true);dl(A.name,new Uint8Array(await R.arrayBuffer()))}catch(e){window.open(A.browser_download_url,'_blank','noopener')}});const l=el('a','rb');l.href=A.browser_download_url;l.target='_blank';l.rel='noopener noreferrer';l.appendChild(ic('link'));d.append(i,b,l);box.appendChild(d)});
   const a=el('a','btn g sm mt12');a.href=rel.html_url;a.target='_blank';a.rel='noopener noreferrer';a.append(ic('link'),el('span','',T('Open release page','रिलीज़ पेज खोलो')));c.append(box,a)}
  try{const ar=(await gh(`/repos/${r}/actions/runs/${x.id}/artifacts`,{},1)).artifacts.filter(z=>!z.expired&&/^android-/.test(z.name));if(ar.length){const b2=el('div','dls');c.appendChild(el('h3','mt14',T('Extract from artifact','आर्टिफ़ैक्ट से निकालो')));ar.forEach(A=>{const bt=el('button','btn g sm');bt.append(ic('down'),el('span','',T('Extract '+A.name,A.name+' निकालो')));bt.onclick=G(async()=>{toast(T('Downloading & extracting…','डाउनलोड और extract हो रहा है…'));const R=await gh(`/repos/${r}/actions/artifacts/${A.id}/zip`,{},1,true),z=await JSZip.loadAsync(await R.arrayBuffer());let n=0;for(const f of Object.values(z.files)){if(!f.dir&&/\.(apk|aab)$/i.test(f.name)){dl(f.name,await f.async('uint8array'));n++}}toast(T(n+' file(s) extracted.',n+' फ़ाइल निकली।'))});b2.appendChild(bt)});c.appendChild(b2)}}catch(e){}}
 if(k!=='android'){const [o,n]=r.split('/'),u='https://'+o.toLowerCase()+'.github.io'+(n.toLowerCase()===o.toLowerCase()+'.github.io'?'/':'/'+n+'/'),a=el('a','btn sm mt14');a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.append(ic('globe'),el('span','',T('Open website','वेबसाइट खोलो')));c.appendChild(a)}}
/* ---------- guide ---------- */
const GD=[['Create a GitHub token','GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new. Tick repo and workflow (and delete_repo only if you want to delete repos). Copy it now, GitHub shows it once.','GitHub टोकन बनाओ','GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new। repo और workflow टिक करो (रिपो डिलीट करनी हो तभी delete_repo)। अभी कॉपी करो, GitHub एक ही बार दिखाता है।'],
['Connect and lock','Home → step 1 → paste token → tick "Save encrypted", set a password (8+ chars) → Connect. Next time just enter the password and Unlock. Repo and Build tabs stay locked until you unlock.','जुड़ो और लॉक रखो','Home → स्टेप 1 → टोकन पेस्ट करो → "एनक्रिप्ट करके सेव" टिक करो, पासवर्ड (8+ अक्षर) रखो → जुड़ो। अगली बार सिर्फ़ पासवर्ड डालकर अनलॉक करो। अनलॉक किए बिना Repo और Build टैब लॉक रहते हैं।'],
['Upload and push a ZIP','Home → step 2 pick your ZIP → step 3 choose repo → step 4 PUSH ALL FILES.','ZIP अपलोड करके पुश करो','Home → स्टेप 2 में ZIP चुनो → स्टेप 3 में रिपो चुनो → स्टेप 4 सारी फ़ाइलें पुश करो।'],
['Manage the repo','Repo tab → Load repo. Tap a file to read, edit, rename, download or delete. Folders can be renamed or deleted. Use + Files / ZIP / Folder / New file to add things inside the open folder. Everything waits in a list; press Push changes to commit once.','रिपो मैनेज करो','Repo टैब → लोड करो। फ़ाइल पर टैप करके पढ़ो, एडिट, नाम बदलो, डाउनलोड या डिलीट करो। फ़ोल्डर का नाम बदल या डिलीट कर सकते हो। खुले फ़ोल्डर में + Files / ZIP / Folder / नई फ़ाइल से चीज़ें जोड़ो। सब बदलाव लिस्ट में रुकते हैं, बदलाव पुश करो दबाओ तो एक बार में कमिट होते हैं।'],
['Build APK, AAB and website','Build tab → choose Android APK + AAB, Website, or All three → Add to repo → Run. Live status appears. The APK and AAB come as plain files in a GitHub Release (tap download). Website opens at https://username.github.io/repo.','APK, AAB और वेबसाइट बनाओ','Build टैब → Android APK + AAB, वेबसाइट या तीनों चुनो → रिपो में जोड़ो → चलाओ। लाइव स्टेटस दिखेगा। APK और AAB GitHub Release में सीधी फ़ाइल के रूप में मिलते हैं (डाउनलोड दबाओ)। वेबसाइट https://username.github.io/repo पर खुलती है।'],
['If a build fails','The red box shows the failed step, the error lines and the likely cause in English and Hindi. The same summary is on the GitHub run page (Summary and Annotations) and the full log is saved as the build-log artifact.','बिल्ड फेल हो तो','लाल बॉक्स में फेल स्टेप, एरर लाइनें और संभावित कारण हिंदी-अंग्रेज़ी में दिखता है। यही GitHub रन पेज (Summary और Annotations) पर भी है और पूरा लॉग build-log आर्टिफ़ैक्ट में सेव होता है।']];
function guide(){const b=$('gd');b.replaceChildren();GD.forEach((g,i)=>{const c=el('div','card'),h=el('h2');h.append(el('span','num',i+1),el('span','',HI?g[2]:g[0]));c.append(h,el('p','',HI?g[3]:g[1]));b.appendChild(c)});
 $('sec').textContent=T('Token lives in memory only: never in cookies, never shown again, wiped after 5 min idle, in the background or when you leave. A saved token is AES-256-GCM encrypted with your password (PBKDF2, 600k rounds) and erased after 5 wrong passwords. Repo and Build need the unlock. A strict CSP blocks inline scripts and allows network calls only to GitHub. Paths are checked and names are shown as plain text. Best safety: a fine-grained token limited to one repo.','टोकन सिर्फ़ मेमोरी में रहता है: कुकी में कभी नहीं, दोबारा दिखता नहीं, 5 मिनट खाली रहने, बैकग्राउंड में जाने या पेज छोड़ने पर मिट जाता है। सेव टोकन AES-256-GCM और तुम्हारे पासवर्ड (PBKDF2, 600k राउंड) से एनक्रिप्ट होता है और 5 गलत पासवर्ड पर मिट जाता है। Repo और Build के लिए अनलॉक ज़रूरी है। सख़्त CSP इनलाइन स्क्रिप्ट रोकता है और सिर्फ़ GitHub से नेटवर्क कॉल की इजाज़त देता है। पाथ जाँचे जाते हैं और नाम सादे टेक्स्ट में दिखते हैं। सबसे सुरक्षित: सिर्फ़ एक रिपो वाला fine-grained टोकन।')}
/* ---------- events ---------- */
const ACT={lang:()=>{HI=!HI;LS.s('z2g_l',HI?'hi':'en');applyLang()},connect:G(connect),unlock:G(()=>doUnlock($('pw').value)),gunlock:G(a=>doUnlock(a.closest('[data-gate]').querySelector('.gpw').value)),lock:()=>lock(T('Locked.','लॉक हो गया।')),forget,
 pickzip:()=>$('zf').click(),pickfiles:()=>$('ff').click(),pickdir:()=>$('df').click(),setold:()=>setMode('old'),setnew:()=>setMode('new'),loadrepos:G(loadRepos),push:G(push),zipdir:G(()=>mkZip(CUR)),zipall:G(()=>mkZip('')),
 clearall:()=>{if(FILES.size&&confirm(T('Remove all staged files?','सारी फ़ाइलें हटाएँ?'))){FILES.clear();CUR='';renderFiles()}},gohome:()=>{location.hash='home'},
 loadrepo:G(loadRepo),rff:()=>$('rffi').click(),rzf:()=>$('rzfi').click(),rdf:()=>$('rdfi').click(),newfile:newFile,
 fromstaged:()=>{if(!TREE)return toast(T('Load the repo first.','पहले रिपो लोड करो।'),1);if(!FILES.size)return toast(T('Files tab is empty.','Files टैब खाली है।'),1);FILES.forEach((u,p)=>PEND.set(join(RD,p),{data:u,mode:modeOf(p)}));renderRepo();toast(T('Added.','जुड़ गईं।'))},
 rpush:G(rpush),rdiscard:()=>{if(confirm(T('Discard all pending changes?','सारे बदलाव रद्द करें?'))){PEND.clear();renderRepo()}},rreview:review,delrepo:G(delRepo),
 copyyml:copyYml,addwf:G(addWf),runwf:G(runWf),status:G(async()=>{POLL++;await showStatus(0)}),offretry:()=>{if(navigator.onLine)offHide();else toast(T('Still offline.','अभी भी ऑफ़लाइन।'),1)}};
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a&&ACT[a.dataset.act])ACT[a.dataset.act](a,e)});
$('rs').addEventListener('change',onRepo);['br','rn'].forEach(i=>$(i).addEventListener('input',()=>{updLbl();if(i==='br')resetRepo()}));$('wk').addEventListener('change',showYml);$('wt').addEventListener('change',showYml);
setMode('old');applyLang();route();
if(LS.g('z2g_v'))toast(T('Saved token found. Enter your password and tap Unlock.','सेव टोकन मिला। पासवर्ड डालो और अनलॉक दबाओ।'));
if(!navigator.onLine)offShow();
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
