import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySync } from './cloud-sync-core.js';

const base = {
  localSnapshot: '{"driver":"A"}',
  remoteSnapshot: '{"driver":"A"}',
  lastSyncedSnapshot: '{"driver":"A"}',
  remoteExists: true,
  localRevision: 4,
  remoteRevision: 4
};

test('unchanged snapshots are already synchronized', () => {
  assert.equal(classifySync(base).kind, 'synced');
});

test('local-only edits can be uploaded', () => {
  assert.equal(classifySync({...base, localSnapshot:'{"driver":"B"}'}).kind, 'local-only');
});

test('remote-only edits can be restored without treating them as conflicts', () => {
  assert.equal(classifySync({...base, remoteSnapshot:'{"driver":"C"}'}).kind, 'remote-only');
});

test('independent edits on both devices require explicit conflict resolution', () => {
  assert.equal(classifySync({...base, localSnapshot:'{"driver":"B"}', remoteSnapshot:'{"driver":"C"}'}).kind, 'conflict');
});

test('identical concurrent edits converge safely', () => {
  assert.equal(classifySync({...base, localSnapshot:'{"driver":"B"}', remoteSnapshot:'{"driver":"B"}'}).kind, 'synced');
});

test('first local save is identified for initial upload', () => {
  assert.equal(classifySync({...base, lastSyncedSnapshot:null, remoteExists:false}).kind, 'initial-local');
});

test('legacy local save plus existing cloud save is never silently overwritten', () => {
  assert.equal(classifySync({...base, lastSyncedSnapshot:null, localSnapshot:'{"driver":"B"}', remoteSnapshot:'{"driver":"C"}'}).kind, 'conflict');
});
