// Pure three-way comparison shared by the Cloud sync runtime and tests.
export function classifySync({localSnapshot,remoteSnapshot,lastSyncedSnapshot,remoteExists,localRevision=0,remoteRevision=0}) {
 const revisionAdvanced=remoteRevision>localRevision;
 if(!remoteExists)return {kind:lastSyncedSnapshot===null?'initial-local':'local-only',revisionAdvanced};
 if(lastSyncedSnapshot===null)return {kind:localSnapshot===remoteSnapshot?'synced':'conflict',revisionAdvanced};
 const localChanged=localSnapshot!==lastSyncedSnapshot;
 const remoteChanged=remoteSnapshot!==lastSyncedSnapshot;
 if((!localChanged&&!remoteChanged)||localSnapshot===remoteSnapshot)return {kind:'synced',revisionAdvanced};
 if(localChanged&&!remoteChanged)return {kind:'local-only',revisionAdvanced};
 if(!localChanged&&remoteChanged)return {kind:'remote-only',revisionAdvanced};
 return {kind:'conflict',revisionAdvanced};
}
export function shouldSyncOnReconnect({online,authenticated,pendingLocalChanges}) {
 return Boolean(online&&authenticated&&pendingLocalChanges);
}
