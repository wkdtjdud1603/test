import { validateState, emptyState, encodeState } from './state.mjs';
window.lifeTravel.validate = validateState;
const status = document.querySelector('.save');
const login = document.querySelector('#login');
const logout = document.querySelector('#logout');
const content = document.querySelector('#content');
let user = null, revision = 0, pending = 0, failed = false, chain = Promise.resolve();
const setStatus = text => { status.textContent = text; };
const lock = value => { content.inert = value; document.querySelector('#modalform').inert = value; };
const reset = () => { window.lifeTravel.replace(emptyState()); lock(true); };
const guestNote = '체험 모드 · 기록은 현재 탭에 임시 저장됩니다. 탭을 닫기 전에 ↥ 버튼으로 내보내세요. Firebase 연결 후 로그인하면 계정에 저장할 수 있어요.';
function guestMode() {
  try { const cached = sessionStorage.getItem('life-travel-guest'); if (cached) window.lifeTravel.replace(validateState(JSON.parse(cached))); } catch { sessionStorage.removeItem('life-travel-guest'); }
  lock(false); setStatus('체험 모드 · 현재 탭에 임시 저장');
  document.querySelector('#connection-note').textContent = guestNote;
}
window.lifeCloud = { save(state) {
  if (!user) {
    try { sessionStorage.setItem('life-travel-guest', encodeState(state)); setStatus('● 현재 탭에 임시 저장됨'); }
    catch { setStatus('임시 저장 실패 · ↥ 버튼으로 내보내주세요'); }
    return;
  }
  if (failed) { setStatus('클라우드 저장 불가 · 내보내기로 백업해주세요'); return; }
  let payload;
  try { payload = encodeState(state); } catch (error) { failed = true; lock(true); setStatus(error.message + ' · 먼저 내보내기로 백업하세요'); return; }
  const uid = user.uid;
  pending++; logout.disabled = true; setStatus('● Firebase에 저장 중…');
  chain = chain.then(async () => {
    if (failed || user?.uid !== uid) return;
    const ref = api.doc(db, 'users', uid, 'journey', 'current');
    try {
      const nextRevision = await api.runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists() ? snapshot.data().revision : 0;
        if (current !== revision) throw new Error('conflict');
        transaction.set(ref, { schemaVersion: 1, payload, revision: current + 1, updatedAt: api.serverTimestamp() });
        return current + 1;
      });
      revision = nextRevision;
    } catch (error) {
      failed = true; lock(true);
      setStatus(error.message === 'conflict' ? '다른 창에서 변경됐어요 · 내보내기 후 새로고침하세요' : '저장 실패 · 내보내기로 백업한 뒤 새로고침하세요');
    }
  }).finally(() => { pending--; logout.disabled = pending > 0; if (!pending && !failed) setStatus('● Firebase 저장 완료'); });
}};
window.addEventListener('beforeunload', event => { if (pending || failed) { event.preventDefault(); event.returnValue = ''; } });
let api, db;
async function start() {
  guestMode();
  let config;
  try { const response = await fetch('/firebase-config.json', {cache:'no-store'}); if (!response.ok) throw new Error(); config = await response.json(); if (!config.projectId || !config.apiKey) throw new Error(); }
  catch { guestMode(); login.disabled = true; return; }
  const base = 'https://www.gstatic.com/firebasejs/12.7.0/';
  try {
    const [appSDK, authSDK, firestoreSDK] = await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    api = firestoreSDK;
    const app = appSDK.initializeApp(config); const auth = authSDK.getAuth(app); db = api.getFirestore(app);
    login.disabled = false;
    login.onclick = async () => { if (sessionStorage.getItem('life-travel-guest') && !confirm('체험 기록은 이 탭에 남아 있으며 계정에 자동 업로드되지 않습니다. 필요한 기록은 먼저 내보내 주세요. 로그인할까요?')) return; login.disabled = true; try { await authSDK.signInWithPopup(auth, new authSDK.GoogleAuthProvider()); } catch { setStatus('로그인을 완료하지 못했어요 · 다시 시도해주세요'); } finally { login.disabled = false; } };
    logout.onclick = async () => { if (pending || failed) return; await authSDK.signOut(auth); };
    authSDK.onAuthStateChanged(auth, async next => {
      user = next; revision = 0; failed = false; if (next) reset();
      login.hidden = !!next; logout.hidden = !next;
      if (!next) { window.lifeTravel.replace(emptyState()); guestMode(); return; }
      setStatus('나의 여행을 불러오는 중…');
      try {
        const snapshot = await api.getDocFromServer(api.doc(db,'users',next.uid,'journey','current'));
        if (user?.uid !== next.uid) return;
        if (snapshot.exists()) { const data = snapshot.data(); const state = JSON.parse(data.payload); validateState(state); revision = data.revision; window.lifeTravel.replace(state); }
        lock(false); setStatus('● Firebase 연결됨');
        document.querySelector('#connection-note').textContent = `${next.displayName || '여행자'}님의 여행 · 변경한 내용은 Firebase에 자동 저장됩니다.`;
      } catch { failed = true; lock(true); setStatus('기록을 불러오지 못했어요 · 연결 및 Firestore 규칙을 확인하고 새로고침하세요'); }
    });
  } catch { guestMode(); login.disabled = true; setStatus('Firebase 연결 실패 · 체험 모드로 사용 중'); }
}
start();
