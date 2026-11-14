export function emptyState() { return {entries:[],one:'내가 진짜 원하는 삶 찾기',dominos:[{title:'나의 방향을 발견하기',note:'이번 주, 원하는 삶에 대한 기록을 남겨보세요.',tasks:[{text:'내가 꿈꾸는 하루 기록하기',done:false}]}],bucket:[],votes:{},round:0}; }
export function validateState(s) {
  const text = value => typeof value === 'string';
  if (!s || !text(s.one) || !Array.isArray(s.entries) || !s.entries.every(e=>e && text(e.title) && text(e.text) && text(e.date)) || !Array.isArray(s.dominos) || s.dominos.length === 0 || !s.dominos.every(d=>d && text(d.title) && text(d.note) && Array.isArray(d.tasks) && d.tasks.every(t=>t && text(t.text) && typeof t.done==='boolean')) || !Array.isArray(s.bucket) || !s.bucket.every(b=>b && text(b.title) && text(b.category) && typeof b.done==='boolean') || !Number.isInteger(s.round) || s.round<0 || s.round>4 || !s.votes || typeof s.votes!=='object' || Array.isArray(s.votes) || !Object.values(s.votes).every(v=>Number.isInteger(v) && v>=0)) throw new Error('여행 데이터 형식이 올바르지 않아요');
  return s;
}
export function encodeState(s) { validateState(s); const payload=JSON.stringify(s); if(new TextEncoder().encode(payload).length>700000) throw new Error('현재 버전의 기록 용량을 초과했어요'); return payload; }
