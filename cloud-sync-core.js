// Pure three-way comparison shared by the Cloud sync runtime and tests.
export function classifySync({
  localSnapshot,
  remoteSnapshot,
  lastSyncedSnapshot,
  remoteExists,
  localRevision = 0,
  remoteRevision = 0
}) {
  if (!remoteExists) {
    if (lastSyncedSnapshot === null) return {kind: 'initial-local'};
    return localSnapshot === lastSyncedSnapshot
      ? {kind: 'remote-only'}
      : {kind: 'local-only'};
  }
  if (lastSyncedSnapshot === null) {
    return localSnapshot === remoteSnapshot
      ? {kind: 'synced'}
      : {kind: 'conflict'};
  }
  const localChanged = localSnapshot !== lastSyncedSnapshot;
  const remoteChanged = remoteSnapshot !== lastSyncedSnapshot;
  if (!localChanged && !remoteChanged) return {kind: 'synced'};
  if (localSnapshot === remoteSnapshot) return {kind: 'synced'};
  if (localChanged && !remoteChanged) return {kind: 'local-only'};
  if (!localChanged && remoteChanged) return {kind: 'remote-only'};
  return {kind: 'conflict'};
}
