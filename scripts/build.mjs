import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true}); await cp('public','dist',{recursive:true});
const keys={apiKey:'FIREBASE_API_KEY',authDomain:'FIREBASE_AUTH_DOMAIN',projectId:'FIREBASE_PROJECT_ID',appId:'FIREBASE_APP_ID',messagingSenderId:'FIREBASE_MESSAGING_SENDER_ID',storageBucket:'FIREBASE_STORAGE_BUCKET'};
const config=Object.fromEntries(Object.entries(keys).map(([key,env])=>[key,process.env[env]||'']));
const required=['apiKey','authDomain','projectId','appId'];
if(required.some(key=>!config[key])) {
  if(process.env.VERCEL_ENV==='production') throw new Error('Firebase 환경 변수를 먼저 등록해주세요.');
  console.warn('Firebase 설정 없음: 로그인과 기록 저장이 비활성화된 화면을 생성합니다.');
} else await writeFile('dist/firebase-config.json',JSON.stringify(config));
