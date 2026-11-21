#!/usr/bin/env python3
"""Apply Race Career v3.1.5 changes to a checkout of ercicho/motorsport-career."""
from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()

def edit(name, replacements):
    p=root/name
    if not p.exists(): raise SystemExit(f'Missing {p}; run from repository root')
    s=p.read_text(encoding='utf-8')
    for old,new in replacements:
        count=s.count(old)
        if count != 1: raise SystemExit(f'{name}: expected exactly one match, found {count}: {old[:90]!r}; no files written for this file')
        s=s.replace(old,new,1)
    p.write_text(s,encoding='utf-8')
    print('Updated',name)

core='''// Canonical, lossless comparison of JSON career snapshots. Object property order is irrelevant;
// array order and all actual values remain significant.
export function canonicalSnapshot(raw) {
  if (raw == null) return null;
  let value;
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; }
  const sort = v => {
    if (Array.isArray(v)) return v.map(sort);
    if (v !== null && typeof v === 'object')
      return Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])]));
    return v;
  };
  return JSON.stringify(sort(value));
}
export function snapshotsEqual(a, b) {
  if (a == null || b == null) return a == null && b == null;
  const ca = canonicalSnapshot(a), cb = canonicalSnapshot(b);
  return ca !== null && cb !== null && ca === cb;
}
export function classifySync({localSnapshot,remoteSnapshot,lastSyncedSnapshot,remoteExists,localRevision=0,remoteRevision=0}) {
  const revisionAdvanced = remoteRevision > localRevision;
  if (!remoteExists) return {kind:lastSyncedSnapshot===null?'initial-local':'local-only',revisionAdvanced};
  if (lastSyncedSnapshot===null) return {kind:snapshotsEqual(localSnapshot,remoteSnapshot)?'synced':'conflict',revisionAdvanced};
  const localChanged = !snapshotsEqual(localSnapshot,lastSyncedSnapshot);
  const remoteChanged = !snapshotsEqual(remoteSnapshot,lastSyncedSnapshot);
  if ((!localChanged&&!remoteChanged)||snapshotsEqual(localSnapshot,remoteSnapshot)) return {kind:'synced',revisionAdvanced};
  if (localChanged&&!remoteChanged) return {kind:'local-only',revisionAdvanced};
  if (!localChanged&&remoteChanged) return {kind:'remote-only',revisionAdvanced};
  return {kind:'conflict',revisionAdvanced};
}
export function shouldSyncOnReconnect({online,authenticated,pendingLocalChanges}) {
  return Boolean(online && authenticated); // Always re-check remote changes on reconnect.
}
'''
(root/'cloud-sync-core.mjs').write_text(core,encoding='utf-8')
print('Updated cloud-sync-core.mjs')

edit('cloud.js',[
("import { classifySync, shouldSyncOnReconnect } from './cloud-sync-core.mjs';", "import { classifySync, snapshotsEqual, shouldSyncOnReconnect } from './cloud-sync-core.mjs';"),
('Motorsport Career · Cloud v3.1.4','Motorsport Career · Cloud v3.1.5'),
("$('mc-cloud-indicator').textContent = error ? '!' : '✓';", "$('mc-cloud-indicator').textContent = error ? '!' : (/syncing|checking|queued|waiting|pending|updated/i.test(msg) ? '…' : '✓');"),
("  if (local() !== raw) {\n    status('A newer local edit was made during sync; it will be synchronized next.', false);\n    schedule();\n    return;\n  }\n  recordSynced(raw, nextRevision);", "  // The cloud now contains `raw`, even if the user edited the device during upload.\n  // Record exactly the uploaded baseline; the next pass will upload the newer local data.\n  recordSynced(raw, nextRevision);\n  if (!snapshotsEqual(local(), raw)) {\n    rerunRequested = true;\n    status('Newer local changes pending · another sync is queued.');\n    return;\n  }"),
("  if (!user || !syncEnabled) return status('Sign in to synchronize this device.', true);\n  if (busy) { rerunRequested = true; return; }", "  if (!user || !syncEnabled) return status('Sign in to synchronize this device.', true);\n  if (busy) { rerunRequested = true; return; }"),
("function schedule() {\n  if (!user || !syncEnabled) return;\n  clearTimeout(timer);", "function schedule() {\n  if (!user || !syncEnabled) return;\n  if (busy) rerunRequested = true;\n  clearTimeout(timer);"),
("  if (syncEnabled) sync();\n});\nwindow.addEventListener('offline'", "  if (syncEnabled) sync();\n});\nwindow.addEventListener('offline'"),
("  if (user) await sync();\n  else status('Local career only. Sign in to sync.');", "  if (user) await sync();\n  else status('Local career only. Sign in to sync.');")
])

# RenderHQ currently selects a colour by license tier, not the actual medal.
edit('index.html', [
("const palette=['lic-bronze','lic-silver','lic-blue','lic-purple','lic-gold'];const badge=$('licenseBadge');badge.innerHTML=`<div class=\"license-card ${highest>=0?palette[highest]:''}\">", "const medalClass={'Bronzo':'lic-bronze','Argento':'lic-silver','Oro':'lic-gold'};const medal=highest>=0?state.licences[rank[highest]]:null;const badge=$('licenseBadge');badge.innerHTML=`<div class=\"license-card ${medalClass[medal]||''}\">")
])

edit('sw.js',[
("motorsport-career-cache-v313", "motorsport-career-cache-v315"),
("'./cloud.js','./gt7-vehicles.json'", "'./cloud.js','./cloud-sync-core.mjs','./gt7-vehicles.json'")
])

(root/'CHANGELOG_v3.1.5.txt').write_text('''Race Career Cloud v3.1.5
- Canonical JSON snapshot comparison: ignore object key order without ignoring actual career changes.
- Queue follow-up synchronization when edits occur during an upload; keep the uploaded snapshot as baseline.
- Check cloud again when connectivity returns.
- Correct licence badge colour to match current GT7 medal (Bronzo, Argento, Oro).
- Update PWA cache and include cloud-sync-core.mjs in pre-cache.
- Preserve explicit conflict resolution for ambiguous or concurrent edits.
''',encoding='utf-8')
print('Updated CHANGELOG_v3.1.5.txt')
