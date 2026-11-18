'use strict';
const conf=window.VIRALVAULT_CONFIG||{};
const $=id=>document.getElementById(id);
const enc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=(conf.supabaseUrl||'').replace(/\/$/,'');
const key=conf.supabaseAnonKey||'';
let session=null, videos=[];
const stored=()=>{try{return JSON.parse(sessionStorage.getItem('vv-session')||'null')}catch{return null}};
function saveSession(next){session=next;if(next)sessionStorage.setItem('vv-session',JSON.stringify(next));else sessionStorage.removeItem('vv-session')}
function message(text,okay=false){$('status').innerHTML=`<div class="notice ${okay?'ok':''}">${enc(text)}</div>`}
function toggle(id,show){$(id).classList.toggle('hidden',!show)}
async function request(path, options={}){
 const headers={apikey:key,...(session?.access_token?{Authorization:'Bearer '+session.access_token}:{}),...options.headers};
 const res=await fetch(base+path,{...options,headers});
 if(!res.ok){let explanation='';try{const error=await res.json();explanation=error.message||error.msg||error.error_description||error.error||''}catch{}throw Error(explanation||'Request failed: '+res.status)}
 if(res.status===204)return null;
 const text=await res.text();return text?JSON.parse(text):null;
}
async function refreshSession(){
 if(!session?.refresh_token)throw Error('Please sign in again.');
 const res=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
 if(!res.ok){saveSession(null);throw Error('Your session expired. Please sign in again.')}
 saveSession(await res.json());
}
async function authenticatedRequest(path, options={}){
 if(!session)throw Error('Please sign in.');
 if(Date.now()>((session.expires_at||0)*1000)-60000)await refreshSession();
 return request(path,options);
}
function parseUrl(input){
 let u;try{u=new URL(input.trim())}catch{throw Error('Paste a complete HTTPS video URL.')}if(u.protocol!=='https:')throw Error('HTTPS links only.');
 const h=u.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');const p=u.pathname;let platform,videoId,url=u.href;
 if(['youtube.com','youtube-nocookie.com','youtu.be'].includes(h)){
  platform='YouTube';videoId=h==='youtu.be'?p.split('/')[1]:/^\/(shorts|embed|live)\//.test(p)?p.split('/')[2]:u.searchParams.get('v');
  if(!/^[\w-]{11}$/.test(videoId||''))throw Error('Invalid YouTube video ID.');url='https://www.youtube.com/watch?v='+videoId;
 }else if(h==='tiktok.com'){
  platform='TikTok';videoId=p.match(/\/video\/(\d{10,25})/)?.[1];if(!videoId)throw Error('Use a full TikTok /@user/video/123 URL.');
 }else if(['reddit.com','old.reddit.com','redd.it'].includes(h)){
  platform='Reddit';videoId=(h==='redd.it'?p.match(/^\/([a-z0-9]+)/i):p.match(/\/comments\/([a-z0-9]+)/i))?.[1];
  if(!videoId)throw Error('Use a Reddit post permalink.');url='https://www.reddit.com/comments/'+videoId+'/';
 }else if(['facebook.com','web.facebook.com'].includes(h)){
  platform='Facebook';videoId=u.searchParams.get('v')||p.match(/\/(?:videos|reel)\/(\d+)/)?.[1];
  if(!videoId)throw Error('Use a public Facebook video or reel permalink.');
 }else throw Error('Only YouTube, TikTok, Reddit, and Facebook links are supported.');
 return {platform,video_id:videoId,url};
}
function resetEditor(){ $('videoForm').reset();$('editId').value='';$('editorTitle').textContent='Publish a video';$('saveBtn').textContent='Publish video';$('published').value='true'; }
function editRow(row){$('editId').value=row.id;$('url').value=row.url;$('title').value=row.title;$('category').value=row.category;$('description').value=row.description||'';$('published').value=String(row.published);$('featured').checked=Boolean(row.featured);$('editorTitle').textContent='Edit video';$('saveBtn').textContent='Save changes';window.scrollTo({top:0,behavior:'smooth'});}
function renderVideos(){
 $('count').textContent=`${videos.length} videos · ${videos.filter(v=>v.published).length} published`;
 $('entries').innerHTML=videos.length?videos.map(v=>`<article class="admin-video ${v.published?'':'draft'}"><div><h3>${enc(v.title)}</h3><p>${enc(v.platform)} · ${enc(v.category)} ${v.featured?'· ★ Featured':''} <span class="label ${v.published?'live':''}">${v.published?'LIVE':'DRAFT'}</span></p></div><div class="admin-buttons"><button data-action="edit" data-id="${enc(v.id)}">Edit</button><button data-action="toggle" data-id="${enc(v.id)}">${v.published?'Unpublish':'Publish'}</button><button class="danger" data-action="delete" data-id="${enc(v.id)}">Delete</button></div></article>`).join(''):'<p class="muted">No videos yet. Add your first one using the form.</p>';
}
async function loadVideos(){videos=await authenticatedRequest('/rest/v1/videos?select=*&order=created_at.desc&limit=1000');renderVideos()}
async function verifyAdmin(){const admin=await authenticatedRequest('/rest/v1/admin_users?select=user_id&limit=1');if(!Array.isArray(admin)||!admin.length)throw Error('This account is not authorized as an admin. Run the owner-account SQL in the README.');}
async function showDashboard(){await verifyAdmin();await loadVideos();toggle('loginPanel',false);toggle('dashboard',true);toggle('logout',true);message('Admin access verified. Changes publish immediately.',true)}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();message('Signing in...');
 try{const data=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});saveSession(data);$('password').value='';await showDashboard()}
 catch(err){message(err.message)}
});
$('videoForm').addEventListener('submit',async e=>{
 e.preventDefault();const save=$('saveBtn');save.disabled=true;message('Saving...');
 try{
  const parsed=parseUrl($('url').value);const row={...parsed,title:$('title').value.trim(),category:$('category').value,description:$('description').value.trim(),published:$('published').value==='true',featured:$('featured').checked};
  if(!row.title)throw Error('Title is required.');
  const id=$('editId').value;
  if(id){await authenticatedRequest('/rest/v1/videos?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)})}
  else{await authenticatedRequest('/rest/v1/videos',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)})}
  resetEditor();await loadVideos();message(row.published?'Saved! The video is now live on the public website.':'Draft saved. It is hidden from visitors.',true);
 }catch(err){message(err.message)}finally{save.disabled=false}
});
$('entries').addEventListener('click',async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const v=videos.find(x=>x.id===b.dataset.id);if(!v)return;
 if(b.dataset.action==='edit'){editRow(v);return;}
 if(b.dataset.action==='delete'&&!confirm(`Permanently delete "${v.title}"?`))return;
 b.disabled=true;
 try{
  const id=encodeURIComponent(v.id);
  if(b.dataset.action==='delete')await authenticatedRequest('/rest/v1/videos?id=eq.'+id,{method:'DELETE'});
  else await authenticatedRequest('/rest/v1/videos?id=eq.'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({published:!v.published})});
  await loadVideos();message('Changes saved.',true);
 }catch(err){message(err.message)}finally{b.disabled=false}
});
$('resetBtn').addEventListener('click',resetEditor);
$('refreshBtn').addEventListener('click',async()=>{try{await loadVideos();message('Updated.',true)}catch(err){message(err.message)}});
$('logout').addEventListener('click',async()=>{
 try{await authenticatedRequest('/auth/v1/logout',{method:'POST'})}catch{}
 saveSession(null);videos=[];toggle('dashboard',false);toggle('logout',false);toggle('loginPanel',true);message('Signed out.',true);
});
(async()=>{
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(conf.supabaseUrl||'')||!key){toggle('setup',true);message('Database setup is required before live publishing.');return;}
 toggle('loginPanel',true);saveSession(stored());if(session){try{await showDashboard()}catch(e){saveSession(null);message(e.message)}}
})();
