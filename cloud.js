// Motorsport Career Cloud Edition — Firebase modular browser SDK.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, getDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { classifySync } from './cloud-sync-core.js';

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
let user = null, revision = 0, busy = false, timer = null, syncEnabled = false;
let rerunRequested = false, cloudAvailable = false, lastRemoteRevision = 0;

const localRevisionKey = () => 'mc-cloud-revision:' + user.uid;
const syncedSnapshotKey = () => 'mc-cloud-last-synced:' + user.uid;
const ref = () => doc(db, 'users', user.uid, 'career', 'main');

const style = document.createElement('style');
style.textContent = `#mc-cloud{position:fixed;right:12px;bottom:12px;z-index:99999;max-width:min(370px,calc(100vw - 24px));background:#18212c;color:#fff;border:1px solid #465565;border-radius:14px;padding:12px;font:13px system-ui;box-shadow:0 10px 32px #0008}#mc-cloud button{background:#26394b;color:#fff;border:1px solid #60778b;border-radius:8px;padding:8px 10px;margin:4px;cursor:pointer}#mc-cloud button:disabled{opacity:.5}#mc-cloud .mc-note{font-size:12px;opacity:.85;margin:7px 0}#mc-cloud .mc-actions{display:flex;flex-wrap:wrap}#mc-cloud .mc-danger{color:#ffc7b8}`;
document.head.append(style);
const panel = document.createElement('aside');
panel.id = 'mc-cloud';
panel.innerHTML = `<button type="button" id="mc-cloud-toggle" aria-expanded="false" aria-controls="mc-cloud-details" aria-label="Open cloud saves">☁ <span id="mc-cloud-indicator">✓</span></button><div id="mc-cloud-details" hidden><strong>Motorsport Career · Cloud v3.1.4</strong><div id="mc-cloud-user" class="mc-note">Connecting…</div><div id="mc-cloud-status" class="mc-note" role="status" aria-live="polite">Local career is preserved.</div><div class="mc-actions"><button id="mc-login">Google login</button><button id="mc-logout" hidden>Logout</button><button id="mc-sync" hidden>Sync now</button><button id="mc-download">Backup JSON</button></div><div id="mc-cloud-choice" hidden><p id="mc-cloud-choice-text"></p><button id="mc-use-local">Upload this device</button><button id="mc-use-cloud">Load cloud career</button></div></div>`;
document.body.append(panel);
const cloudToggle = panel.querySelector('#mc-cloud-toggle');
const cloudDetails = panel.querySelector('#mc-cloud-details');
const setCloudOpen = open => {
  cloudDetails.hidden = !open;
  cloudToggle.setAttribute('aria-expanded', String(open));
  cloudToggle.setAttribute('aria-label', open ? 'Close cloud saves' : 'Open cloud saves');
  panel.classList.toggle('mc-expanded', open);
};
cloudToggle.addEventListener('click', () => setCloudOpen(cloudDetails.hidden));
const cloudCss = document.createElement('style');
cloudCss.textContent = `#mc-cloud:not(.mc-expanded){width:auto;max-width:none;padding:4px;border-radius:999px}#mc-cloud:not(.mc-expanded) #mc-cloud-toggle{border:0;background:transparent;padding:6px 10px;margin:0;font-size:15px}#mc-cloud-details[hidden]{display:none!important}#mc-cloud.mc-expanded{max-height:min(78dvh,540px);overflow:auto}#mc-cloud-toggle{min-width:46px}#mc-cloud-indicator{color:#8fe3c2}#mc-cloud.mc-expanded #mc-cloud-toggle{display:block;margin-left:auto}@media(max-width:600px){#mc-cloud{right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px))}#mc-cloud.mc-expanded{width:min(360px,calc(100vw - 16px))}}`;
document.head.append(cloudCss);

const $ = id => document.getElementById(id);
const status = (msg, error = false) => {
  $('mc-cloud-status').textContent = msg;
  $('mc-cloud-status').classList.toggle('mc-danger', error);
  $('mc-cloud-indicator').textContent = error ? '!' : '✓';
  if (error) setCloudOpen(true);
};
const local = () => window.mcCloudRead?.() || null;
const valid = raw => {
  if (!raw) return false;
  try { const value = JSON.parse(raw); return value && typeof value === 'object' && !Array.isArray(value); }
  catch { return false; }
};
function backup() {
  const raw = local();
  if (!valid(raw)) return status('No valid local career found.', true);
  const blob = new Blob([JSON.stringify(JSON.parse(raw), null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'motorsport-career-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
$('mc-download').onclick = backup;
$('mc-login').onclick = async () => {
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code)) {
      status('Redirecting to Google…');
      await signInWithRedirect(auth, provider);
    } else status('Login failed: ' + e.message, true);
  }
};
$('mc-logout').onclick = async () => { syncEnabled = false; clearTimeout(timer); await signOut(auth); };
$('mc-sync').onclick = () => {
  if (!user) return status('Sign in to synchronize this device.', true);
  if (!navigator.onLine) return status('Offline · changes remain saved locally and will sync when reconnected.', true);
  if (busy) { rerunRequested = true; status('Sync queued · current operation is finishing…'); return; }
  clearTimeout(timer);
  sync();
};
$('mc-sync').hidden = true;
getRedirectResult(auth).catch(e => status('Redirect login failed: ' + e.message, true));

function setChoice(show, message = '', {local = true, cloud = true} = {}) {
  $('mc-cloud-choice').hidden = !show;
  $('mc-cloud-choice-text').textContent = message;
  $('mc-use-local').hidden = !local;
  $('mc-use-cloud').hidden = !cloud;
  if (show) setCloudOpen(true);
}
function recordSynced(raw, rev) {
  revision = Number(rev) || 0;
  localStorage.setItem(localRevisionKey(), String(revision));
  localStorage.setItem(syncedSnapshotKey(), raw || '');
}
async function readRemote() {
  const snap = await getDoc(ref());
  const data = snap.exists() ? snap.data() : null;
  return {data, revision: Number(data?.revision) || 0};
}
function currentBaseline() {
  return {
    snapshot: localStorage.getItem(syncedSnapshotKey()),
    revision: Number(localStorage.getItem(localRevisionKey()) || 0)
  };
}
function describe(remoteData, remoteRevision) {
  const raw = local();
  if (!valid(raw)) return {kind:'invalid-local', raw};
  const cloudRaw = remoteData ? JSON.stringify(remoteData.data) : null;
  return {
    ...classifySync({
      localSnapshot: raw,
      remoteSnapshot: cloudRaw,
      lastSyncedSnapshot: currentBaseline().snapshot,
      remoteExists: !!remoteData,
      localRevision: currentBaseline().revision,
      remoteRevision
    }),
    raw,
    cloudRaw
  };
}
async function restoreCloud(cloudRaw, remoteRevision) {
  if (!valid(cloudRaw)) throw new Error('Cloud save is invalid');
  window.mcCloudRestore(cloudRaw);
  const restored = local();
  recordSynced(restored, remoteRevision);
  setChoice(false);
  status('Cloud career restored · revision ' + remoteRevision);
}
async function uploadLocal(expectedRevision, {replace = false} = {}) {
  const raw = local();
  if (!valid(raw)) throw new Error('No valid local career to sync');
  const payload = JSON.parse(raw);
  let nextRevision = expectedRevision + 1;
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref());
    const currentRevision = snap.exists() ? (Number(snap.data().revision) || 0) : 0;
    if (currentRevision !== expectedRevision) throw new Error('REVISION_CHANGED');
    tx.set(ref(), {data: payload, revision: nextRevision, updatedAt: Date.now(), schemaVersion: 1});
  });
  if (local() !== raw) {
    status('A newer local edit was made during sync; it will be synchronized next.', false);
    schedule();
    return;
  }
  recordSynced(raw, nextRevision);
  cloudAvailable = true;
  lastRemoteRevision = nextRevision;
  setChoice(false);
  status((replace ? 'Local career uploaded' : 'Cloud saved') + ' · revision ' + nextRevision);
}
async function reconcile({manual = false} = {}) {
  if (!user || !syncEnabled) return status('Sign in to synchronize this device.', true);
  if (!navigator.onLine) return status('Offline · local career is safe; synchronization will resume on reconnect.', true);
  const {data, revision: remoteRevision} = await readRemote();
  cloudAvailable = !!data;
  lastRemoteRevision = remoteRevision;
  const state = describe(data, remoteRevision);
  if (state.kind === 'invalid-local') {
    if (data) {
      setChoice(true, 'Cloud career found. Load it on this device?', {local:false, cloud:true});
      status('Local save is unavailable · choose whether to restore the cloud copy.');
    } else status('No valid local career found.', true);
    return;
  }
  if (state.kind === 'synced') {
    recordSynced(state.raw, remoteRevision);
    setChoice(false);
    status('Career is up to date · revision ' + remoteRevision);
    return;
  }
  if (state.kind === 'remote-only') {
    await restoreCloud(state.cloudRaw, remoteRevision);
    return;
  }
  if (state.kind === 'local-only' || state.kind === 'initial-local') {
    if (!data && state.kind === 'initial-local') {
      setChoice(true, 'Cloud career is empty. Upload the career on this device?', {local:true, cloud:false});
      status('Local career ready for first cloud upload.');
      return;
    }
    try { await uploadLocal(remoteRevision); }
    catch (e) {
      if (e.message === 'REVISION_CHANGED') return reconcile({manual});
      throw e;
    }
    return;
  }
  if (state.kind === 'conflict') {
    setChoice(true, 'Incompatible local and cloud changes detected. Nothing was overwritten. Download a backup, then choose which copy to keep.', {local:true, cloud:true});
    status('Conflict · choose the local or cloud career to continue.', true);
    return;
  }
  if (manual) status('No synchronization changes found.');
}
async function sync(options = {}) {
  if (!user || !syncEnabled) return status('Sign in to synchronize this device.', true);
  if (busy) { rerunRequested = true; return; }
  busy = true;
  status('Checking local and cloud revisions…');
  try { await reconcile(options); }
  catch (e) { status('Cloud unavailable; career remains saved locally. ' + e.message, true); }
  finally {
    busy = false;
    if (rerunRequested) {
      rerunRequested = false;
      if (navigator.onLine && user) queueMicrotask(() => sync());
    }
  }
}
function schedule() {
  if (!user || !syncEnabled) return;
  clearTimeout(timer);
  status(navigator.onLine ? 'Local save updated · syncing in 1.5 seconds…' : 'Offline · local save preserved');
  timer = setTimeout(() => sync(), 1500);
}
window.addEventListener('mc-career-changed', schedule);
window.addEventListener('online', () => { if (user && syncEnabled) sync(); });
window.addEventListener('offline', () => { if (user) status('Offline · local save preserved; waiting for connection.', true); });

$('mc-use-local').onclick = async () => {
  if (!user || busy || !navigator.onLine) return status('Cannot upload while offline or another sync is running.', true);
  const currentRaw = local();
  if (!valid(currentRaw)) return status('No valid local career to upload.', true);
  if (cloudAvailable && !confirm('Replace the cloud career with this device’s save? Download a backup first.')) return;
  busy = true;
  try {
    await uploadLocal(lastRemoteRevision, {replace:true});
  } catch (e) {
    if (e.message === 'REVISION_CHANGED') {
      status('Cloud changed again before upload. Rechecking to prevent overwriting newer data.', true);
      await reconcile();
    } else status('Could not upload: ' + e.message, true);
  } finally { busy = false; }
};
$('mc-use-cloud').onclick = async () => {
  if (!user || busy || !navigator.onLine) return status('Cannot load the cloud career while offline.', true);
  if (valid(local()) && !confirm('Replace the local career with the cloud save? Download a backup first.')) return;
  busy = true;
  try {
    const {data, revision: remoteRevision} = await readRemote();
    if (!data || !valid(JSON.stringify(data.data))) throw new Error('Cloud save not found');
    await restoreCloud(JSON.stringify(data.data), remoteRevision);
  } catch (e) { status('Could not load cloud: ' + e.message, true); }
  finally { busy = false; }
};

onAuthStateChanged(auth, async current => {
  user = current;
  syncEnabled = !!user;
  clearTimeout(timer);
  setChoice(false);
  $('mc-login').hidden = !!user;
  $('mc-logout').hidden = !user;
  $('mc-sync').hidden = !user;
  $('mc-cloud-user').textContent = user ? 'Signed in: ' + (user.email || user.uid) : 'Not signed in · local saving only';
  if (user) await sync();
  else status('Local career only. Sign in to sync.');
});
