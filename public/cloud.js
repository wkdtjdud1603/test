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
window.lifeCloud = { save(state) {
  if (!user || failed) { setStatus('저장 불가 · 로그인과 연결 상태를 확인하세요'); return; }
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
  lock(true);
  let config;
  try { const response = await fetch('/firebase-config.json', {cache:'no-store'}); if (!response.ok) throw new Error(); config = await response.json(); if (!config.projectId || !config.apiKey) throw new Error(); }
  catch { setStatus('Firebase 설정 전 · 프로젝트 연결이 필요해요'); document.querySelector('#connection-note').textContent = 'Firebase 프로젝트 연결을 기다리고 있어요. 연결 후 Google 계정으로 로그인해 나만의 여행을 시작할 수 있어요.'; login.disabled = true; return; }
  const base = 'https://www.gstatic.com/firebasejs/12.7.0/';
  try {
    const [appSDK, authSDK, firestoreSDK] = await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    api = firestoreSDK;
    const app = appSDK.initializeApp(config); const auth = authSDK.getAuth(app); db = api.getFirestore(app);
    login.disabled = false;
    login.onclick = async () => { login.disabled = true; try { await authSDK.signInWithPopup(auth, new authSDK.GoogleAuthProvider()); } catch { setStatus('로그인을 완료하지 못했어요 · 다시 시도해주세요'); } finally { login.disabled = false; } };
    logout.onclick = async () => { if (pending || failed) return; await authSDK.signOut(auth); };
    authSDK.onAuthStateChanged(auth, async next => {
      user = next; revision = 0; failed = false; reset();
      login.hidden = !!next; logout.hidden = !next;
      if (!next) { setStatus('로그인 후 Firebase에 저장'); document.querySelector('#connection-note').textContent = 'Google 계정으로 로그인하면 기록과 목표가 내 계정에 저장돼요.'; return; }
      setStatus('나의 여행을 불러오는 중…');
      try {
        const snapshot = await api.getDocFromServer(api.doc(db,'users',next.uid,'journey','current'));
        if (user?.uid !== next.uid) return;
        if (snapshot.exists()) { const data = snapshot.data(); const state = JSON.parse(data.payload); validateState(state); revision = data.revision; window.lifeTravel.replace(state); }
        lock(false); setStatus('● Firebase 연결됨');
        document.querySelector('#connection-note').textContent = `${next.displayName || '여행자'}님의 여행 · 변경한 내용은 Firebase에 자동 저장됩니다.`;
      } catch { failed = true; lock(true); setStatus('기록을 불러오지 못했어요 · 연결 및 Firestore 규칙을 확인하고 새로고침하세요'); }
    });
  } catch { setStatus('Firebase 연결 실패 · 네트워크 상태를 확인하고 새로고침하세요'); }
}
start();
