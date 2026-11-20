// Motorsport Career Cloud Edition — Firebase modular browser SDK.
// Firestore rules must restrict users/{uid}/career/main to the authenticated UID.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, getDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const config = {
  apiKey: 'AIzaSyDpZnxIS4iDB-IbmlrAum7KMTEq1B5192A',
  authDomain: 'motorsport-career.firebaseapp.com',
  projectId: 'motorsport-career',
  storageBucket: 'motorsport-career.firebasestorage.app',
  messagingSenderId: '312586754851',
  appId: '1:312586754851:web:f9d36ba1e786ee4ff9ca96'
};
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const localRevisionKey = () => 'mc-cloud-revision:'+user.uid;
const syncedSnapshotKey = () => 'mc-cloud-last-synced:'+user.uid;
let user = null, revision = 0, busy = false, timer = null, syncEnabled = false, cloudAvailable = false;

const style = document.createElement('style');
style.textContent = `#mc-cloud{position:fixed;right:12px;bottom:12px;z-index:99999;max-width:min(370px,calc(100vw - 24px));background:#18212c;color:#fff;border:1px solid #465565;border-radius:14px;padding:12px;font:13px system-ui;box-shadow:0 10px 32px #0008}#mc-cloud button{background:#26394b;color:#fff;border:1px solid #60778b;border-radius:8px;padding:8px 10px;margin:4px;cursor:pointer}#mc-cloud button:disabled{opacity:.5}#mc-cloud .mc-note{font-size:12px;opacity:.85;margin:7px 0}#mc-cloud .mc-actions{display:flex;flex-wrap:wrap}#mc-cloud .mc-danger{color:#ffc7b8}`;
document.head.append(style);
const panel = document.createElement('aside'); panel.id = 'mc-cloud';
panel.innerHTML = `<button type="button" id="mc-cloud-toggle" aria-expanded="false" aria-controls="mc-cloud-details" aria-label="Open cloud saves">☁ <span id="mc-cloud-indicator">✓</span></button><div id="mc-cloud-details" hidden><strong>Motorsport Career · Cloud v3.1.3</strong><div id="mc-cloud-user" class="mc-note">Connecting…</div><div id="mc-cloud-status" class="mc-note" role="status">Local career is preserved.</div><div class="mc-actions"><button id="mc-login">Google login</button><button id="mc-logout" hidden>Logout</button><button id="mc-sync" hidden>Sync now</button><button id="mc-download">Backup JSON</button></div><div id="mc-cloud-choice" hidden><p id="mc-cloud-choice-text"></p><button id="mc-use-local">Upload this device</button><button id="mc-use-cloud">Load cloud career</button></div></div>`;
document.body.append(panel);
const cloudToggle=panel.querySelector('#mc-cloud-toggle');
const cloudDetails=panel.querySelector('#mc-cloud-details');
const setCloudOpen=open=>{cloudDetails.hidden=!open;cloudToggle.setAttribute('aria-expanded',String(open));cloudToggle.setAttribute('aria-label',open?'Close cloud saves':'Open cloud saves');panel.classList.toggle('mc-expanded',open)};
cloudToggle.addEventListener('click',()=>setCloudOpen(cloudDetails.hidden));
const cloudCss=document.createElement('style');
cloudCss.textContent=`#mc-cloud:not(.mc-expanded){width:auto;max-width:none;padding:4px;border-radius:999px}#mc-cloud:not(.mc-expanded) #mc-cloud-toggle{border:0;background:transparent;padding:6px 10px;margin:0;font-size:15px}#mc-cloud-details[hidden]{display:none!important}#mc-cloud.mc-expanded{max-height:min(78dvh,540px);overflow:auto}#mc-cloud-toggle{min-width:46px}#mc-cloud-indicator{color:#8fe3c2}#mc-cloud.mc-expanded #mc-cloud-toggle{display:block;margin-left:auto}@media(max-width:600px){#mc-cloud{right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px))}#mc-cloud.mc-expanded{width:min(360px,calc(100vw - 16px))}}`;
document.head.append(cloudCss);
const $ = id => document.getElementById(id);
const status = (msg, error=false) => { $('mc-cloud-status').textContent=msg; $('mc-cloud-status').classList.toggle('mc-danger',error); $('mc-cloud-indicator').textContent=error?'!':'✓'; if(error)setCloudOpen(true); };
const local = () => window.mcCloudRead?.() || null;
const valid = raw => { if (!raw) return false; try {const x=JSON.parse(raw);return x&&typeof x==='object'&&!Array.isArray(x);} catch{return false;} };
const ref = () => doc(db,'users',user.uid,'career','main');
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
function backup() { const raw=local(); if(!valid(raw)) return status('No valid local career found.',true); const blob=new Blob([JSON.stringify(JSON.parse(raw),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='motorsport-career-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500); }
$('mc-download').onclick=backup;
$('mc-login').onclick=async()=>{try{await signInWithPopup(auth,provider);}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code)){status('Redirecting to Google…');await signInWithRedirect(auth,provider);}else status('Login failed: '+e.message,true);}};
$('mc-logout').onclick=async()=>{syncEnabled=false;await signOut(auth);};
$('mc-sync').onclick=()=>sync();
getRedirectResult(auth).catch(e=>status('Redirect login failed: '+e.message,true));

function setChoice(show, message='') { $('mc-cloud-choice').hidden=!show; $('mc-cloud-choice-text').textContent=message; if(show)setCloudOpen(true); }
function recordSynced(raw,rev) { revision=rev;localStorage.setItem(localRevisionKey(),String(rev));localStorage.setItem(syncedSnapshotKey(),raw||''); }
async function remote() { const snap=await getDoc(ref());return snap.exists()?snap.data():null; }
async function sync() {
  if(!user||!syncEnabled||busy||!navigator.onLine)return;
  const raw=local();if(!valid(raw))return status('No valid career to sync.',true);
  busy=true;status('Synchronizing…');
  try {
    let nextRevision=revision;
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref());const remoteRev=snap.exists()?(snap.data().revision||0):0;
      if(remoteRev!==revision)throw new Error('CONFLICT');
      nextRevision=remoteRev+1;
      tx.set(ref(),{data:JSON.parse(raw),revision:nextRevision,updatedAt:Date.now(),schemaVersion:1});
    });
    recordSynced(raw,nextRevision);status('Cloud saved · revision '+nextRevision);
  }catch(e){
    if(e.message==='CONFLICT'){syncEnabled=false;status('Cloud changed on another device. Resolve before saving.',true);await resolve();}
    else status('Cloud unavailable; career remains saved locally. '+e.message,true);
  }finally{busy=false;}
}
function schedule(){if(!user||!syncEnabled)return;clearTimeout(timer);timer=setTimeout(sync,1500);status(navigator.onLine?'Local saved · waiting to sync':'Offline · local saved');}
window.addEventListener('mc-career-changed',schedule);
window.addEventListener('online',()=>{if(syncEnabled)sync();else if(user)resolve();});

async function resolve(){
  if(!user||!navigator.onLine)return status('Offline. Sign-in will synchronize when online.');
  try{
    const r=await remote();cloudAvailable=!!r;
    const raw=local(), cloudRaw=r?JSON.stringify(r.data):null;
    const lastSynced=localStorage.getItem(syncedSnapshotKey());
    const knownRevision=Number(localStorage.getItem(localRevisionKey())||0);
    if(!r){
      if(!valid(raw)){syncEnabled=true;revision=0;status('Signed in · create a driver to start cloud saving.');return;}
      revision=0;syncEnabled=false;setChoice(true,'Cloud career is empty. Upload the career on this device?');$('mc-use-cloud').hidden=true;return;
    }
    $('mc-use-cloud').hidden=false;
    if(!valid(raw)){
      syncEnabled=false;setChoice(true,'Cloud career found. Load it on this device?');$('mc-use-local').hidden=true;return;
    }
    $('mc-use-local').hidden=false;
    if(raw===cloudRaw){recordSynced(raw,r.revision||0);syncEnabled=true;setChoice(false);status('Career is up to date on this device.');return;}
    if(lastSynced===raw && knownRevision<=(r.revision||0)){
      syncEnabled=false;setChoice(true,'A newer cloud career exists. Load it?');$('mc-use-local').hidden=true;return;
    }
    syncEnabled=false;setChoice(true,'Different careers detected. Choose which to keep. Download a JSON backup first. Upload replaces the cloud career; Load replaces this device’s career.');
  }catch(e){status('Unable to compare saves: '+e.message,true);}
}
$('mc-use-local').onclick=async()=>{
  if(!user||busy)return;
  if(cloudAvailable&&!confirm('Replace the cloud career with this device’s save? Download a backup first.'))return;
  try{const r=await remote();revision=r?.revision||0;syncEnabled=true;setChoice(false);await sync();}
  catch(e){syncEnabled=false;status('Could not upload: '+e.message,true);}
};
$('mc-use-cloud').onclick=async()=>{
  if(!user||busy)return;
  const old=local();if(valid(old)&&!confirm('Replace the local career with the cloud save? Download a backup first.'))return;
  try{const r=await remote();if(!r||!valid(JSON.stringify(r.data)))throw Error('Cloud save not found');
    window.mcCloudRestore(JSON.stringify(r.data));recordSynced(local(),r.revision||0);syncEnabled=true;setChoice(false);status('Cloud career loaded · revision '+revision);
  }catch(e){status('Could not load cloud: '+e.message,true);}
};
onAuthStateChanged(auth, async current=>{
  user=current;syncEnabled=false;clearTimeout(timer);setChoice(false);
  $('mc-login').hidden=!!user;$('mc-logout').hidden=!user;$('mc-sync').hidden=!user;
  $('mc-cloud-user').textContent=user?'Signed in: '+(user.email||user.uid):'Not signed in · local saving only';
  if(user)await resolve();else status('Local career only. Sign in to sync.');
});
