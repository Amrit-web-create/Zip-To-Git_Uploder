const go=()=>location.replace('./');
addEventListener('online',go);
document.getElementById('retry').onclick=async()=>{try{const r=await fetch('./index.html',{cache:'no-store'});if(r.ok)go()}catch(e){}};
