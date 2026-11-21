import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySync, shouldSyncOnReconnect } from './cloud-sync-core.js';
const base={localSnapshot:'{"driver":"A"}',remoteSnapshot:'{"driver":"A"}',lastSyncedSnapshot:'{"driver":"A"}',remoteExists:true,localRevision:4,remoteRevision:4};
test('unchanged snapshots are synchronized',()=>assert.equal(classifySync(base).kind,'synced'));
test('local-only edits are uploadable',()=>assert.equal(classifySync({...base,localSnapshot:'{"driver":"B"}'}).kind,'local-only'));
test('remote-only edits can be restored',()=>assert.equal(classifySync({...base,remoteSnapshot:'{"driver":"C"}'}).kind,'remote-only'));
test('independent edits require explicit conflict resolution',()=>assert.equal(classifySync({...base,localSnapshot:'{"driver":"B"}',remoteSnapshot:'{"driver":"C"}'}).kind,'conflict'));
test('identical concurrent edits converge',()=>assert.equal(classifySync({...base,localSnapshot:'{"driver":"B"}',remoteSnapshot:'{"driver":"B"}'}).kind,'synced'));
test('first local save is marked for initial upload',()=>assert.equal(classifySync({...base,lastSyncedSnapshot:null,remoteExists:false}).kind,'initial-local'));
test('legacy local and existing cloud saves without baseline conflict',()=>assert.equal(classifySync({...base,lastSyncedSnapshot:null,localSnapshot:'{"driver":"B"}',remoteSnapshot:'{"driver":"C"}'}).kind,'conflict'));
test('missing cloud document is recreated from preserved local save',()=>assert.equal(classifySync({...base,remoteExists:false}).kind,'local-only'));
test('new Firebase revision is surfaced even when payload is unchanged',()=>assert.equal(classifySync({...base,remoteRevision:5}).revisionAdvanced,true));
test('offline or unauthenticated clients do not sync on reconnect',()=>{
 assert.equal(shouldSyncOnReconnect({online:false,authenticated:true,pendingLocalChanges:true}),false);
 assert.equal(shouldSyncOnReconnect({online:true,authenticated:false,pendingLocalChanges:true}),false);
});
test('authenticated reconnect with pending local changes resumes sync',()=>assert.equal(shouldSyncOnReconnect({online:true,authenticated:true,pendingLocalChanges:true}),true));
test('reconnect without pending local changes avoids redundant sync',()=>assert.equal(shouldSyncOnReconnect({online:true,authenticated:true,pendingLocalChanges:false}),false));
