// Canonical, lossless comparison of JSON career snapshots. Object property order is irrelevant;
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
