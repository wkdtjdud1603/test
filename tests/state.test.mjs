import test from 'node:test';import assert from 'node:assert/strict';import {emptyState,validateState,encodeState} from '../public/state.mjs';
test('new accounts contain no sample diaries',()=>{const s=emptyState();assert.equal(s.entries.length,0);assert.equal(s.bucket.length,0);assert.equal(validateState(s),s)});
test('malformed imported data cannot break views',()=>{for(const value of [{}, {...emptyState(),dominos:[]},{...emptyState(),round:9},{...emptyState(),entries:[{title:'bad'}]},{...emptyState(),votes:[]}])assert.throws(()=>validateState(value))});
test('export round trip retains Korean text and check state',()=>{const s=emptyState();s.entries.push({title:'마음',text:'여행을 가고 싶어',date:'2026-11-14'});s.dominos[0].tasks[0].done=true;assert.deepEqual(JSON.parse(encodeState(s)),s)});
test('oversized records fail before Firestore write',()=>{const s=emptyState();s.entries.push({title:'big',text:'가'.repeat(240000),date:'2026-11-14'});assert.throws(()=>encodeState(s),/용량/)});
