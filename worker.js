const SETTLEMENT_ENABLED=false;
// FAMILY v001: 관리자 3명 동일 큰실장 권한 / 비번 3535 / 언니앱 미사용 / 일끝 시간만 입력
// v101: 가나 관리자 탭은 UI에서 제거, colra2 로그인 비밀번호는 colra1과 동일한 8989
// 큰실장 역할은 여기 한 곳에서 관리한다. 테스트 종료 후 '실장A'(colra1)로 바꾸면 된다.
const BIG_MANAGER_KEY='실장A';
function isBigManager(manager){return ['실장A','실장B','실장C'].includes(String(manager||'').trim());}
function declaredWorkMinutes(info){
  const text=String(info||'');
  let total=0;
  const matches=text.matchAll(/(?:^|[,\n])\s*타임\s+([^,\n]+)/gi);
  for(const match of matches){
    const values=String(match[1]||'').split(/[\/|+\s]+/).map(v=>v.trim()).filter(Boolean);
    for(const raw of values){
      const v=raw.toLowerCase();
      if(v==='반티'||v==='반'||v==='0.5')total+=30;
      else if(v==='바로')total+=0;
      else if(/^\d+(?:\.\d+)?$/.test(v))total+=Math.round(Number(v)*60);
    }
  }
  return Math.max(0,total);
}
function kstBusinessDay(now=new Date()){
  const kst=new Date(now.getTime()+9*60*60*1000);
  const hour=kst.getUTCHours();
  if(hour<17)kst.setUTCDate(kst.getUTCDate()-1);
  return kst.toISOString().slice(0,10);
}
function kstHour(now=new Date()){return new Date(now.getTime()+9*60*60*1000).getUTCHours();}
function kstCalendarDay(now=new Date()){return new Date(now.getTime()+9*60*60*1000).toISOString().slice(0,10);}
function previousDay(day){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}
 // 당분간 정산대기/정산 저장 비활성화. 다시 쓸 때 true로 변경.
export default{async fetch(req,env){const u=new URL(req.url);if(u.pathname.startsWith('/sister/'))return J({message:'FAMILY에서는 언니앱을 사용하지 않습니다.'},404);if(u.pathname.startsWith('/api/'))return api(req,env,u);const res=await env.ASSETS.fetch(req);const h=new Headers(res.headers);if(/\.(?:js|css|html)$/.test(u.pathname)||u.pathname==='/'){h.set('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');h.set('Pragma','no-cache');h.set('Expires','0')}return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h})}};


async function sisterWeb(req,env,u){
  const token=decodeURIComponent(u.pathname.split('/')[2]||'').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(u.pathname.endsWith('/manifest.json'))return new Response(JSON.stringify({
    name:'FAMILY',short_name:'패밀리',id:'/sister/'+token,start_url:'/sister/'+token,
    scope:'/sister/'+token+'/',display:'standalone',background_color:'#f4f7fc',theme_color:'#2563eb',
    icons:[{src:'/sister/'+token+'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]
  }),{headers:{'content-type':'application/manifest+json','cache-control':'no-store'}});
  if(u.pathname.endsWith('/icon.svg'))return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2563eb"/><text x="256" y="325" text-anchor="middle" font-family="sans-serif" font-size="250" font-weight="900" fill="white">콜</text></svg>`,{headers:{'content-type':'image/svg+xml','cache-control':'public,max-age=86400'}});
  if(u.pathname.endsWith('/sw.js'))return new Response(`
    self.addEventListener('install',()=>self.skipWaiting());
    self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
    self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'새 초이스',body:e.data?e.data.text():'새 배정이 도착했습니다.'}}e.waitUntil(self.registration.showNotification(d.title||'새 초이스',{body:d.body||'새 배정이 도착했습니다.',icon:'/sister/${token}/icon.svg',badge:'/sister/${token}/icon.svg',silent:true,tag:d.tag||'sister-choice',renotify:true,data:{url:d.url||'/sister/${token}'}}))});
    self.addEventListener('notificationclick',e=>{e.notification.close();const url=e.notification.data?.url||'/sister/${token}';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.includes('/sister/${token}')&&'focus'in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}))});
  `,{headers:{'content-type':'application/javascript','cache-control':'no-store','service-worker-allowed':'/sister/'+token+'/'}});

  const vapidPublicKey=String(env.VAPID_PUBLIC_KEY||'').trim();
  const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#2563eb"><link rel="manifest" href="/sister/${token}/manifest.json"><title>FAMILY</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f6fb;font-family:system-ui,-apple-system,sans-serif;color:#111827}.app{max-width:480px;min-height:100vh;margin:auto;background:linear-gradient(#2563eb 0 150px,#f3f6fb 150px);padding:24px 18px}.head{color:#fff;text-align:center}.head small{font-weight:800}.head h1{margin:6px 0 20px;font-size:32px}.card{background:#fff;border-radius:24px;padding:24px;box-shadow:0 10px 30px #1e3a8a20;text-align:center}.shop{font-size:30px;font-weight:900;margin:12px}.opts{font-size:22px;font-weight:900;color:#334155;margin:20px}.guide{color:#2563eb;font-weight:900;margin:18px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}button{border:0;border-radius:16px;padding:17px;font-size:20px;font-weight:900}.o{background:#2563eb;color:#fff}.x{background:#fff1f2;color:#e11d48;border:2px solid #e11d48}.orange{background:#f97316;color:#fff}.dark{background:#111827;color:#fff}.outline{background:#fff;border:2px solid #64748b}.full{width:100%;margin-top:10px;background:#2563eb;color:#fff}.ack-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 14px}.ack{width:100%;margin:0;background:#10b981;color:#fff}.reject{background:#fff1f2;color:#e11d48;border:2px solid #e11d48}.reject-box{display:none;margin:12px 0}.reject-box.show{display:block}.status-message{font-size:22px;line-height:1.5;font-weight:900;color:#334155}.ack.done{background:#e2e8f0;color:#475569}.time{font-size:54px;font-weight:900;color:#2563eb;margin:20px}.wait{padding:42px 8px;font-size:21px;font-weight:800;color:#64748b}.error{color:#dc2626;font-weight:800;white-space:pre-line;margin-top:12px}.notice{font-size:13px;color:#64748b;margin-top:12px}.toolbar{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:0 0 12px}.toolbar button{font-size:14px;padding:12px;background:#e8eefc;color:#1d4ed8}.toolbar button.ok{background:#dcfce7;color:#047857}.toolbar button.logout{background:#dc2626;color:#fff;border:2px solid #b91c1c}input{width:100%;padding:16px;border-radius:14px;border:1px solid #cbd5e1;font-size:24px;text-align:center}.time-display{width:100%;min-height:74px;border:3px solid #111827;border-radius:18px;background:#f8fafc;font-size:30px;font-weight:900;color:#2563eb;display:flex;align-items:center;justify-content:center;cursor:pointer}.clock-modal{position:fixed;inset:0;background:#0f172acc;display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999}.clock-panel{width:min(92vw,390px);background:#fff;border-radius:26px;padding:20px;box-shadow:0 20px 60px #0006}.clock-title{font-size:23px;font-weight:900;margin-bottom:8px}.clock-value{font-size:38px;font-weight:900;color:#2563eb;margin:8px 0 16px}.digital-time-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:14px 0}.digital-time-grid label{display:block;font-size:14px;font-weight:900;color:#475569;text-align:left}.digital-time-grid select{width:100%;margin-top:6px;padding:14px 10px;border:2px solid #cbd5e1;border-radius:14px;background:#fff;font-size:20px;font-weight:900;color:#111827}.clock-hint{font-size:14px;color:#64748b;font-weight:800;margin-top:8px}.clock-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.clock-actions .cancel{background:#e2e8f0;color:#334155}.clock-actions .confirm{background:#2563eb;color:#fff}textarea{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:14px;font-size:16px;margin-top:18px}.row button:disabled{opacity:.45}.choice-selected{background:#2563eb!important;color:#fff!important;border-color:#2563eb!important}.report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.report-grid label{font-weight:900;color:#334155}.report-grid input{font-size:22px;margin-top:7px}.post-buttons{display:grid;grid-template-columns:1fr;gap:10px;margin-top:20px}.post-buttons button{width:100%}.other-response-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.other-response-actions button{width:100%}.other-response-actions .selected{background:#2563eb!important;color:#fff!important;border-color:#2563eb!important}.other-response-actions .reject.selected{background:#e11d48!important;color:#fff!important;border-color:#e11d48!important}.sister-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:12000;max-width:min(90vw,420px);padding:12px 16px;border-radius:14px;background:#111827;color:#fff;font-size:15px;font-weight:800;line-height:1.4;box-shadow:0 8px 30px #0004;opacity:0;pointer-events:none;transition:opacity .18s}.sister-toast.show{opacity:1}.sister-toast.error{background:#b91c1c}
.app{width:100%;padding-left:clamp(10px,4vw,18px);padding-right:clamp(10px,4vw,18px)}.card{padding:clamp(16px,5vw,24px);overflow:hidden}.head h1{font-size:clamp(26px,8vw,32px);overflow-wrap:anywhere;word-break:keep-all}.shop{font-size:clamp(22px,7vw,30px);overflow-wrap:anywhere;word-break:keep-all}.opts{font-size:clamp(18px,5.8vw,22px);overflow-wrap:anywhere;word-break:keep-all}.status-message{font-size:clamp(17px,5.2vw,22px);line-height:1.45;overflow-wrap:anywhere;word-break:keep-all}.guide{font-size:clamp(15px,4.5vw,18px);line-height:1.45;overflow-wrap:anywhere;word-break:keep-all}.row{grid-template-columns:repeat(2,minmax(0,1fr))}.row button,button{min-width:0;font-size:clamp(15px,5vw,20px);white-space:normal;word-break:keep-all;overflow-wrap:anywhere}.toolbar{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.toolbar button{min-width:0;font-size:clamp(11px,3.6vw,14px);padding:11px 5px;white-space:normal}.report-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.report-grid input{min-width:0;padding:12px 4px;font-size:clamp(17px,5vw,22px)}textarea,input,select{max-width:100%}@media(max-width:360px){.app{padding-left:8px;padding-right:8px}.card{padding:14px;border-radius:20px}.row{gap:7px}.toolbar{gap:5px}.time{font-size:44px}.report-grid{gap:5px}.post-buttons{gap:7px}}</style></head><body><main class="app"><header class="head"><small>패밀리</small><h1 id="name">언니앱</h1></header><div class="toolbar"><button id="installBtn" hidden>홈 화면 설치</button><button id="notifyBtn">알림 허용</button><button id="logoutBtn" class="logout" type="button">로그아웃</button></div><form class="card" id="login"><h2>비밀번호</h2><input name="pin" id="pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="휴대폰 뒤 4자리" required><button type="submit" class="full">확인</button><div id="loginError" class="error"></div></form><section class="card" id="screen" hidden><div class="wait">연결 중...</div></section></main><div id="sisterToast" class="sister-toast" aria-live="polite"></div><script>
const token=${JSON.stringify(token)},vapidPublicKey=${JSON.stringify(vapidPublicKey)};let lastAssignmentId=Number(localStorage.getItem('sister_last_'+token)||0),sessionVersion=Number(localStorage.getItem('sister_session_'+token)||0),installPrompt=null,loading=false,timePickerBusy=false,timePickerReleaseTimer=null,lastStateVersion=-1,lastRenderedStateKey='';const q=s=>document.querySelector(s);function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}let sisterToastTimer=0;function sisterToast(msg,isError=false){const el=q('#sisterToast');if(!el)return;clearTimeout(sisterToastTimer);el.textContent=String(msg||'');el.classList.toggle('error',!!isError);el.classList.add('show');sisterToastTimer=setTimeout(()=>el.classList.remove('show'),2200)}async function api(path,opt={}){const r=await fetch(path,{cache:'no-store',headers:{'content-type':'application/json','accept':'application/json',...(opt.headers||{})},...opt});const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(_){throw Error('서버 응답 오류')}if(!r.ok)throw Error(d.message||'처리 오류');return d}function normalizeOptions(v){return String(v||'').replace(/티/g,'T').replace(/중/g,'M').replace(/ㅇㅊ/g,'ㅈㅇ').replace(/ㅈ(?!ㅇ)/g,'ㅈㅇ')}function ding(){return}async function localNotice(a){if(Notification.permission==='granted'&&document.hidden){const reg=await navigator.serviceWorker.ready;await reg.showNotification('새 초이스',{body:(a.shop_name||'')+' '+normalizeOptions(a.options||''),icon:'/sister/'+token+'/icon.svg',silent:true,tag:'choice-'+a.id,renotify:true,data:{url:'/sister/'+token}})}}let choiceDraft='',bigRequestDraft='',postReportDraft='',otherJobDraft='';
function isTest(d){return !!d.is_test_sister}
function choiceView(a){return '<div class="shop">'+esc(a.shop_name||'초이스')+'</div><div class="opts">'+esc(normalizeOptions(a.options||''))+'</div>'+(a.message?'<div class="status-message" style="font-size:18px">'+esc(a.message)+'</div>':'')+'<div class="guide">🎯 초이스 성공? O 눌러주시면<br>실장님이 슝~ 이동해 또 열심히 일할께용 🚗💨</div><div class="row"><button id="oBtn" type="button" class="outline">O</button><button id="xBtn" type="button" class="outline">X</button></div><button id="choiceSendBtn" type="button" class="full" disabled>전송</button>'}
function workingView(a){let tm='-';try{const raw=a.job_start_time||a.updated_at;tm=raw&&/^\d{2}:\d{2}$/.test(raw)?raw:new Date(String(a.updated_at||'').replace(' ','T')+'Z').toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}catch(_){}return '<div>시작시간</div><div class="time">'+esc(tm)+'</div><div class="guide">🎉 오늘도 한 건 추가요~ 💪</div><div class="row"><button id="end10Btn" type="button" class="outline">10분 후</button><button id="endBtn" type="button" class="outline">지금 끝남</button></div><textarea id="msg" placeholder="간단한 메시지 입력"></textarea><button id="bigSendBtn" type="button" class="full" disabled>큰실장 전송</button>'}
function reportView(a){return '<div class="shop" style="font-size:24px">오늘 일한 내용 전송</div><div class="guide">'+esc(a.shop_name||'노래방')+'</div><div class="report-grid"><label>T<input id="reportT" inputmode="decimal" type="number" min="0" step="0.5" value="" placeholder="입력"></label><label>R<input id="reportR" inputmode="decimal" type="number" min="0" step="1" value="" placeholder="입력"></label><label>ㅇㅊ<input id="reportYc" inputmode="decimal" type="number" min="0" step="1" value="" placeholder="입력"></label></div><button id="reportSendBtn" type="button" class="full">정산내용 전송</button>'}
function postReportView(){return '<div class="status-message">💰 오늘 일한 내용 전달 완료!<br>👀 실장들이 또 열심히 다른 일을 찾고 있어용 🔥</div><div class="post-buttons"><button id="keepBtn" type="button" class="outline">수고해주세요</button><button id="jmBtn" type="button" class="outline">ㅈㅁ 오기로 함</button><button id="homeBtn" type="button" class="outline">오늘은 이만 퇴근할래요</button><button id="postReportSendBtn" type="button" class="full" disabled>전송</button></div><div class="notice">원하는 항목을 선택한 뒤 전송을 눌러 주세요.<br>새 초이스가 오면 이 화면보다 먼저 자동으로 표시됩니다.</div>'}
function checkoutWaitingView(){return '<div class="status-message">🌙 퇴근 요청을 큰실장에게 보냈어요.<br>확인되는 동안 잠깐만 기다려주세요 😊</div>'}
function checkoutGoodbyeView(a){return '<div class="status-message">🌷 오늘도 정말 수고 많았어요.</div><div class="guide">'+esc(a.checkout_note||'편안히 쉬고, 내일은 오늘보다 더 좋은 일과 행운이 꼭 찾아올 거예요 🍀✨')+'</div><div class="notice">1분 후 자동으로 로그아웃됩니다.</div>'}
function otherJobView(a){return '<div class="status-message">📌 다른 일정이 잡혔어요.</div><div class="guide">'+esc(a.checkout_note||'큰실장 안내를 확인해 주세요.')+'</div><div class="other-response-actions"><button id="otherOkBtn" type="button" class="outline">OK</button><button id="otherRejectBtn" type="button" class="reject">거절</button></div><textarea id="otherJobMessage" placeholder="큰실장에게 전달할 메모가 있으면 입력해 주세요."></textarea><button id="otherJobSendBtn" type="button" class="full" disabled>전송</button><div class="notice">선택한 뒤 전송을 눌러 주세요.<br>새 초이스가 오면 이 화면보다 먼저 표시됩니다.</div>'}
function otherJobOkView(a){return '<div class="status-message">✅ 다른 일정 안내에 OK를 보냈어요.</div><div class="guide">'+esc(a.checkout_note||'안내 확인 완료')+'</div><div class="notice">큰실장에게 전달됐어요. 새 초이스를 기다려 주세요.</div>'}
function otherJobRejectView(a){return '<div class="status-message">📨 거절 내용을 큰실장에게 전달했어요.</div><div class="guide">'+esc(a.other_job_message||'큰실장 답변을 기다리고 있어요.')+'</div><div class="notice">큰실장이 내용을 수정해 다시 보내면 이 화면이 자동으로 바뀝니다.</div>'}
function viewData(d){const a=d.assignment,at=d.attendance,flow=d.test_flow;if(isTest(d)&&a){if(a.status==='choice_wait'&&String(a.choice_result||'').toUpperCase()==='O')return '<div class="status-message">⭕ O 전송 완료!<br>실장님 확인을 기다리고 있어요 😊</div>';if(a.status==='choice_wait')return choiceView(a);if(a.status==='working'&&at?.status==='시간중')return workingView(a);if(['big_waiting','pickup_driver_wait'].includes(a.status))return '<div class="status-message">📡 큰실장에게 전달 완료!<br>최종 이동 확인 중입니다 ⏳</div>';if(a.status==='pickup_assigned')return '<div class="status-message">✅ 최종 이동 안내가 확정됐어요.</div><div class="opts">배정실장 · '+esc(a.pickup_manager||'실장')+'</div><div class="guide">도착예정 · '+esc(a.pickup_eta||'확인 중')+'</div>';if(a.status==='report_required')return reportView(a);if(a.status==='checkout_waiting')return checkoutWaitingView();if(a.status==='checkout_goodbye')return checkoutGoodbyeView(a);if(a.status==='post_report_other')return otherJobView(a);if(a.status==='post_report_other_ok')return otherJobOkView(a);if(a.status==='post_report_other_reject')return otherJobRejectView(a);if(['post_report','post_report_jm'].includes(a.status))return postReportView();}
if((!a||['choice_x','replaced'].includes(a.status))&&!at)return '<div class="shop" style="font-size:24px">🌟 오늘도 좋은 일 가득하길!</div><div class="guide">출근 준비되셨으면 도착시간만 콕 찍어주세요 😊</div><button id="arrivalTimeDisplay" type="button" class="time-display">도착 예정시간 선택</button><input id="arrivalTime" type="hidden" value=""><button id="reserveBtn" class="full" disabled>출근예약</button>';
if((!a||['choice_x','replaced'].includes(a.status))&&at){if(at.status==='출근대기')return '<div class="shop">📡 출근예약 전달 완료!</div><div class="guide">도착 예정시간: '+esc((at.memo||'').replace(/^.*도착예정\s*/,''))+'</div><div class="notice">실장님이 확인 중이에용 😊</div>';return '<div class="wait">출근 상태: '+esc(at.status||'대기')+'<br>👀 실장들 눈에 불 켜고 찾는 중 🔥 조금만 기다려주세요</div>'}
if(['end10','ended','ended_now'].includes(a?.status)){if(a.pickup_status==='picked')return '<div class="status-message">🚗 이동 완료! 잠깐 쉬어가세용 😊</div>';if(a.pickup_status==='assigned')return '<div class="shop">픽업 배정 완료</div><div class="opts">'+esc(a.pickup_manager||'실장')+' 배정</div><div class="guide">예상 도착시간: '+esc(a.pickup_eta||'-')+'</div><div class="notice">'+esc(a.pickup_request_type||'픽업 요청')+'</div>';return '<div class="wait">📡 큰실장에게 전달 완료! 확인 중입니다 ⏳</div>'}
if(a?.status==='choice_wait')return '<div class="shop">'+esc(a.shop_name)+'</div><div class="opts">'+esc(normalizeOptions(a.options||''))+'</div>'+(a.acknowledged_at?'<div class="guide">초이스 후 눌러주세요.</div><div class="row"><button id="oBtn" class="o">O</button><button id="xBtn" class="x">X</button></div>':'<div class="ack-row"><button id="ackBtn" class="ack">수신완료</button><button id="rejectBtn" class="reject">수신거부</button></div><div id="rejectBox" class="reject-box"><textarea id="rejectReason" placeholder="거절 사유를 간단히 입력해 주세요"></textarea><button id="rejectSendBtn" class="full">거절사유 전송</button></div>');
return '<div class="wait">출근 상태: '+esc(at?.status||'대기')+'<br>👀 실장들 눈에 불 켜고 찾는 중 🔥 조금만 기다려주세요</div>'}
let checkoutLogoutTimer=0;
let clockHour=12,clockMinute=0,clockDraft='';function pad2(n){return String(n).padStart(2,'0')}function formatClock(h,m){const ap=h<12?'오전':'오후',hh=h%12||12;return ap+' '+hh+':'+pad2(m)}function clockHtml(){const ap=clockHour>=12?'오후':'오전',hh=clockHour%12||12;return '<div id="clockModal" class="clock-modal"><div class="clock-panel"><div class="clock-title">출근 도착 예정시간</div><div id="clockValue" class="clock-value">'+formatClock(clockHour,clockMinute)+'</div><div class="digital-time-grid"><label>오전/오후<select id="clockAmpm"><option value="오전" '+(ap==='오전'?'selected':'')+'>오전</option><option value="오후" '+(ap==='오후'?'selected':'')+'>오후</option></select></label><label>시간<select id="clockHour">'+Array.from({length:12},(_,i)=>'<option value="'+(i+1)+'" '+(hh===i+1?'selected':'')+'>'+(i+1)+'</option>').join('')+'</select></label><label>분<select id="clockMinute">'+[0,10,20,30,40,50].map(v=>'<option value="'+v+'" '+(clockMinute===v?'selected':'')+'>'+pad2(v)+'</option>').join('')+'</select></label></div><div class="clock-hint">오전/오후, 시간, 분을 선택한 뒤 확인을 눌러 주세요.</div><div class="clock-actions"><button id="clockCancel" type="button" class="cancel">취소</button><button id="clockConfirm" type="button" class="confirm">확인</button></div></div></div>'}function readDigitalClock(){const ap=q('#clockAmpm')?.value||'오전',hh=Number(q('#clockHour')?.value||12),mm=Number(q('#clockMinute')?.value||0);clockHour=(hh%12)+(ap==='오후'?12:0);clockMinute=mm;q('#clockValue')&&(q('#clockValue').textContent=formatClock(clockHour,clockMinute))}function openClock(){timePickerBusy=true;const current=q('#arrivalTime')?.value||clockDraft;const now=new Date();if(current&&/^\d{2}:\d{2}$/.test(current)){clockHour=Number(current.slice(0,2));clockMinute=Number(current.slice(3,5));clockMinute=Math.round(clockMinute/10)*10%60}else{clockHour=now.getHours();clockMinute=Math.round(now.getMinutes()/10)*10;if(clockMinute===60){clockMinute=0;clockHour=(clockHour+1)%24}}document.body.insertAdjacentHTML('beforeend',clockHtml());bindClock()}function bindClock(){['#clockAmpm','#clockHour','#clockMinute'].forEach(sel=>q(sel)?.addEventListener('change',readDigitalClock));q('#clockCancel')?.addEventListener('click',closeClock);q('#clockConfirm')?.addEventListener('click',()=>{readDigitalClock();clockDraft=pad2(clockHour)+':'+pad2(clockMinute);const inp=q('#arrivalTime'),disp=q('#arrivalTimeDisplay');if(inp)inp.value=clockDraft;if(disp)disp.textContent=formatClock(clockHour,clockMinute);const rb=q('#reserveBtn');if(rb)rb.disabled=false;closeClock()})}function closeClock(){q('#clockModal')?.remove();setTimeout(()=>{timePickerBusy=false},300)}function bind(){q('#arrivalTimeDisplay')?.addEventListener('click',openClock);q('#reserveBtn')?.addEventListener('click',reserveAttendance);q('#ackBtn')?.addEventListener('click',()=>act('ACK'));q('#rejectBtn')?.addEventListener('click',()=>q('#rejectBox')?.classList.toggle('show'));q('#rejectSendBtn')?.addEventListener('click',()=>act('REJECT',q('#rejectReason')?.value||''));q('#oBtn')?.addEventListener('click',()=>q('#choiceSendBtn')?selectChoice('O'):act('O'));q('#xBtn')?.addEventListener('click',()=>q('#choiceSendBtn')?selectChoice('X'):act('X'));q('#choiceSendBtn')?.addEventListener('click',sendChoiceResult);q('#end10Btn')?.addEventListener('click',()=>selectBigRequest('10분 후'));q('#endBtn')?.addEventListener('click',()=>selectBigRequest('지금 끝남'));q('#bigSendBtn')?.addEventListener('click',sendBigRequest);q('#reportSendBtn')?.addEventListener('click',sendWorkReport);q('#keepBtn')?.addEventListener('click',()=>selectPostReport('계속'));q('#jmBtn')?.addEventListener('click',()=>selectPostReport('ㅈㅁ'));q('#homeBtn')?.addEventListener('click',()=>selectPostReport('퇴근'));q('#postReportSendBtn')?.addEventListener('click',sendPostReport);q('#otherOkBtn')?.addEventListener('click',()=>selectOtherJob('OK'));q('#otherRejectBtn')?.addEventListener('click',()=>selectOtherJob('거절'));q('#otherJobSendBtn')?.addEventListener('click',sendOtherJobResponse);}
function selectChoice(v){choiceDraft=v;q('#oBtn')?.classList.toggle('choice-selected',v==='O');q('#xBtn')?.classList.toggle('choice-selected',v==='X');const b=q('#choiceSendBtn');if(b)b.disabled=false}
async function sendChoiceResult(){if(!choiceDraft)return;try{await api('/api/sister/action',{method:'POST',body:JSON.stringify({token,action:'CHOICE_RESULT',result:choiceDraft})});choiceDraft='';lastRenderedStateKey='';ding();await load(true)}catch(e){sisterToast(e.message,true)}}
function selectBigRequest(v){bigRequestDraft=v;q('#end10Btn')?.classList.toggle('choice-selected',v==='10분 후');q('#endBtn')?.classList.toggle('choice-selected',v==='지금 끝남');const b=q('#bigSendBtn');if(b)b.disabled=false}
async function sendBigRequest(){if(!bigRequestDraft)return;try{await api('/api/sister/action',{method:'POST',body:JSON.stringify({token,action:'BIG_REQUEST',request_type:bigRequestDraft,message:q('#msg')?.value||''})});bigRequestDraft='';lastRenderedStateKey='';ding();await load(true)}catch(e){sisterToast(e.message,true)}}
async function sendWorkReport(){try{const payload={token,t_value:Number(q('#reportT')?.value||0),r_value:Number(q('#reportR')?.value||0),yc_value:Number(q('#reportYc')?.value||0)};await api('/api/sister/work-report',{method:'POST',body:JSON.stringify(payload)});ding();await load()}catch(e){sisterToast(e.message,true)}}
function selectPostReport(value){postReportDraft=value;const map={계속:'#keepBtn','ㅈㅁ':'#jmBtn','퇴근':'#homeBtn'};Object.entries(map).forEach(([v,sel])=>q(sel)?.classList.toggle('choice-selected',v===value));const b=q('#postReportSendBtn');if(b)b.disabled=false}async function sendPostReport(){if(!postReportDraft)return;const value=postReportDraft;const b=q('#postReportSendBtn');if(b)b.disabled=true;try{await api('/api/sister/action',{method:'POST',body:JSON.stringify({token,action:'POST_REPORT_ACTION',value})});postReportDraft='';lastRenderedStateKey='';await load(true)}catch(e){if(b)b.disabled=false;sisterToast(e.message,true)}}async function postReportAction(value){postReportDraft=value;return sendPostReport()}function selectOtherJob(value){otherJobDraft=value;q('#otherOkBtn')?.classList.toggle('selected',value==='OK');q('#otherRejectBtn')?.classList.toggle('selected',value==='거절');const b=q('#otherJobSendBtn');if(b)b.disabled=false}async function sendOtherJobResponse(){if(!otherJobDraft)return;const b=q('#otherJobSendBtn');if(b)b.disabled=true;try{await api('/api/sister/action',{method:'POST',body:JSON.stringify({token,action:'OTHER_JOB_RESPONSE',response:otherJobDraft,message:q('#otherJobMessage')?.value||''})});otherJobDraft='';lastRenderedStateKey='';await load(true)}catch(e){if(b)b.disabled=false;sisterToast(e.message,true)}}
async function reserveAttendance(){timePickerBusy=false;clearTimeout(timePickerReleaseTimer);const eta=q('#arrivalTime')?.value||'';if(!eta)return;try{await api('/api/sister/attendance/reserve',{method:'POST',body:JSON.stringify({token,eta})});ding();await load()}catch(e){sisterToast(e.message,true)}}async function act(action,extra=''){try{await api('/api/sister/action',{method:'POST',body:JSON.stringify({token,action,message:extra||q('#msg')?.value||''})});ding();await load()}catch(e){sisterToast(e.message,true)}}function sisterStateKey(d){const a=d.assignment||{},at=d.attendance||{},tf=d.test_flow||{},wr=d.work_report||{};return JSON.stringify([d.reset_to_attendance?1:0,d.is_test_sister?1:0,at.id||0,at.status||'',at.manager||'',at.memo||'',a.id||0,a.status||'',a.shop_name||'',a.options||'',a.message||'',a.acknowledged_at||'',a.choice_result||'',a.pickup_manager||'',a.pickup_eta||'',a.pickup_status||'',a.checkout_note||'',a.checkout_requested_at||'',a.checkout_decided_at||'',a.auto_logout_at||'',a.other_job_response||'',a.other_job_message||'',a.other_job_responded_at||'',a.other_job_reviewed_at||'',tf.id||0,tf.status||'',tf.assigned_manager||'',tf.eta_choice||'',tf.driver_response||'',tf.reject_reason||'',tf.big_confirmed_at||'',wr.id||0,wr.status||'',wr.t_value||0,wr.r_value||0,wr.yc_value||0,wr.manager_t||0,wr.manager_r||0,wr.manager_yc||0,wr.agreed_t||0,wr.agreed_r||0,wr.agreed_yc||0])}async function load(forceRender=false){if(loading||timePickerBusy)return;loading=true;try{const d=await api('/api/sister/state?token='+encodeURIComponent(token)+'&session_version='+encodeURIComponent(sessionVersion));if(d.force_logout){await forcedLogout(d.message||'오늘 업무가 종료되었습니다.');return}lastStateVersion=Number(d.version??lastStateVersion);q('#name').textContent=d.name;const nextKey=sisterStateKey(d);if(forceRender||nextKey!==lastRenderedStateKey){lastRenderedStateKey=nextKey;q('#screen').innerHTML=viewData(d);bind()}clearTimeout(checkoutLogoutTimer);checkoutLogoutTimer=0;if(d.assignment?.status==='checkout_goodbye'){const due=Date.parse(String(d.assignment.auto_logout_at||'').replace(' ','T')+'Z');const ms=Number.isFinite(due)?Math.max(0,due-Date.now()):60000;checkoutLogoutTimer=setTimeout(()=>forcedLogout('오늘도 수고하셨어요 🌷 좋은 꿈 꾸세요 🍀'),ms)}const id=Number(d.assignment?.id||0);if(id&&id!==lastAssignmentId&&d.assignment?.status==='choice_wait'){lastAssignmentId=id;localStorage.setItem('sister_last_'+token,String(id));await localNotice(d.assignment)}if(d.is_test_sister&&id&&d.assignment?.status==='choice_wait'&&!d.assignment?.acknowledged_at&&document.visibilityState==='visible'){api('/api/sister/action',{method:'POST',body:JSON.stringify({token,action:'VIEW'})}).catch(()=>{})}}catch(e){q('#screen').innerHTML='<div class="wait error">'+esc(e.message)+'</div>'}finally{loading=false}}async function checkForStateChange(){if(loading||timePickerBusy||q('#screen').hidden||!sessionVersion)return;try{const d=await api('/api/sister/version?token='+encodeURIComponent(token)+'&session_version='+encodeURIComponent(sessionVersion));if(d.force_logout){await forcedLogout(d.message||'오늘 업무가 종료되었습니다.');return}const v=Number(d.version||0);if(lastStateVersion<0){lastStateVersion=v;return}if(v!==lastStateVersion)await load(false)}catch(e){console.warn('언니앱 변경감지 실패',e)}}q('#login').addEventListener('submit',async e=>{e.preventDefault();q('#loginError').textContent='';try{const d=await api('/api/sister/login',{method:'POST',body:JSON.stringify({token,pin:q('#pin').value})});sessionVersion=Number(d.session_version||1);localStorage.setItem('sister_auth_'+token,'1');localStorage.setItem('sister_session_'+token,String(sessionVersion));q('#name').textContent=d.name;q('#login').hidden=true;q('#screen').hidden=false;await load()}catch(err){q('#loginError').textContent=err.message}});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;q('#installBtn').hidden=false});q('#installBtn').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;q('#installBtn').hidden=true});q('#notifyBtn').addEventListener('click',async()=>{try{const p=await Notification.requestPermission();if(p!=='granted')throw Error('알림이 허용되지 않았습니다.');q('#notifyBtn').textContent='알림 허용됨';q('#notifyBtn').classList.add('ok');await subscribePush()}catch(e){sisterToast(e.message,true)}});async function forcedLogout(message){try{Object.keys(localStorage).filter(k=>k.includes(token)||k.startsWith('sister_')).forEach(k=>localStorage.removeItem(k));sessionStorage.clear();if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(_){}sessionVersion=0;lastAssignmentId=0;q('#screen').hidden=true;q('#login').hidden=false;q('#pin').value='';q('#name').textContent='언니앱';q('#loginError').textContent=message||'오늘 업무가 종료되었습니다.';setTimeout(()=>location.replace('/sister/'+token),1200)}async function sisterLogout(e){e?.preventDefault?.();if(loading)return;loading=true;try{localStorage.removeItem('sister_auth_'+token);localStorage.removeItem('sister_session_'+token);localStorage.removeItem('sister_last_'+token);sessionStorage.clear()}catch(_){}sessionVersion=0;lastAssignmentId=0;q('#screen').hidden=true;q('#screen').innerHTML='<div class="wait">연결 중...</div>';q('#login').hidden=false;q('#pin').value='';q('#name').textContent='언니앱';q('#loginError').textContent='로그아웃되었습니다. 다시 로그인하면 서버의 현재 상태를 새로 불러옵니다.';history.replaceState(null,'','/sister/'+token);loading=false;setTimeout(()=>q('#pin')?.focus(),50)}q('#logoutBtn').addEventListener('click',sisterLogout);function b64(s){const pad='='.repeat((4-s.length%4)%4),raw=atob((s+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}async function subscribePush(){if(!('serviceWorker'in navigator)||!vapidPublicKey)return;const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(vapidPublicKey)});await api('/api/sister/push/subscribe',{method:'POST',body:JSON.stringify({token,subscription:sub.toJSON()})})}if('serviceWorker'in navigator)navigator.serviceWorker.register('/sister/'+token+'/sw.js',{scope:'/sister/'+token+'/'}).then(()=>{if(Notification.permission==='granted'){q('#notifyBtn').textContent='알림 허용됨';q('#notifyBtn').classList.add('ok');subscribePush().catch(()=>{})}}).catch(()=>{});if(localStorage.getItem('sister_auth_'+token)){q('#login').hidden=true;q('#screen').hidden=false;load(true)}setInterval(checkForStateChange,3000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!q('#screen').hidden)checkForStateChange()});</script></body></html>`;
  return new Response(html,{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store, no-cache, must-revalidate','pragma':'no-cache','expires':'0'}})
}

let integrityReady=false;
async function ensureIntegrity(db){
  if(integrityReady)return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS pickup_waiting(id INTEGER PRIMARY KEY AUTOINCREMENT,day TEXT NOT NULL,job_id INTEGER NOT NULL,staff_id INTEGER NOT NULL,shop_id INTEGER,manager TEXT,finished_at TEXT,finished_time TEXT,returning_at TEXT,completed INTEGER NOT NULL DEFAULT 0,completed_at TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS work_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,day TEXT NOT NULL,job_id INTEGER NOT NULL,staff_id INTEGER NOT NULL,staff_name TEXT,staff_affiliation TEXT,shop_id INTEGER,shop_name TEXT,manager TEXT,start_at TEXT,start_time TEXT,end_at TEXT,end_time TEXT,elapsed_minutes INTEGER DEFAULT 0,received_info TEXT,created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS work_log_archives(id INTEGER PRIMARY KEY AUTOINCREMENT,business_day TEXT NOT NULL,payload TEXT NOT NULL,item_count INTEGER DEFAULT 0,deleted_by TEXT,created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS work_log_hidden_days(day TEXT PRIMARY KEY,hidden_through_id INTEGER NOT NULL DEFAULT 0,hidden_by TEXT,hidden_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS auth_sessions(token TEXT PRIMARY KEY,manager TEXT NOT NULL,last_seen TEXT NOT NULL,expires_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS sister_access(staff_id INTEGER PRIMARY KEY,access_token TEXT NOT NULL UNIQUE,enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS sister_assignments(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL,job_id INTEGER,shop_id INTEGER,shop_name TEXT,options TEXT,manager TEXT,sent_by TEXT,status TEXT NOT NULL DEFAULT 'choice_wait',message TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS sister_settlement_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL,assignment_id INTEGER,original_message TEXT NOT NULL,analysis_json TEXT,created_at TEXT NOT NULL,confirmed_at TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS test_pickup_flow(id INTEGER PRIMARY KEY AUTOINCREMENT,assignment_id INTEGER NOT NULL UNIQUE,staff_id INTEGER NOT NULL,job_id INTEGER,shop_id INTEGER,shop_name TEXT,sister_request_type TEXT,sister_message TEXT,big_manager TEXT NOT NULL DEFAULT '실장T',assigned_manager TEXT,eta_choice TEXT,status TEXT NOT NULL DEFAULT 'requested',driver_response TEXT,reject_reason TEXT,driver_message TEXT,driver_responded_at TEXT,big_confirmed_at TEXT,driver_acknowledged_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS test_reroute_flow(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL,old_pickup_id INTEGER NOT NULL,new_job_id INTEGER NOT NULL UNIQUE,new_shop_id INTEGER,new_shop_name TEXT,assigned_manager TEXT NOT NULL,big_manager TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'requested',driver_response TEXT,reject_reason TEXT,driver_message TEXT,driver_responded_at TEXT,big_confirmed_at TEXT,driver_acknowledged_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS sister_work_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL,assignment_id INTEGER NOT NULL,shop_name TEXT,t_value REAL NOT NULL DEFAULT 0,r_value REAL NOT NULL DEFAULT 0,yc_value REAL NOT NULL DEFAULT 0,manager_t REAL,manager_r REAL,manager_yc REAL,agreed_t REAL,agreed_r REAL,agreed_yc REAL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,finalized_at TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS sister_push_subscriptions(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL,endpoint TEXT NOT NULL UNIQUE,p256dh TEXT,auth TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS settlement_archives(id INTEGER PRIMARY KEY AUTOINCREMENT,day TEXT NOT NULL,archive_type TEXT NOT NULL DEFAULT 'staff',staff_id INTEGER,staff_name TEXT,payload TEXT NOT NULL,total INTEGER DEFAULT 0,hold_amount INTEGER DEFAULT 0,settlement_amount INTEGER DEFAULT 0,ting_amount INTEGER DEFAULT 0,balance_amount INTEGER DEFAULT 0,created_at TEXT NOT NULL)"),
    db.prepare("UPDATE attendance SET status='중복정리' WHERE status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') AND id NOT IN (SELECT MAX(id) FROM attendance WHERE status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') GROUP BY staff_id)"),
    db.prepare("UPDATE jobs SET status='중복정리' WHERE status IN ('초이스중','시간중') AND id NOT IN (SELECT MAX(id) FROM jobs WHERE status IN ('초이스중','시간중') GROUP BY staff_id)"),
    db.prepare("DELETE FROM pickup_waiting WHERE id NOT IN (SELECT MAX(id) FROM pickup_waiting GROUP BY job_id)"),
    db.prepare("DELETE FROM work_logs WHERE id NOT IN (SELECT MAX(id) FROM work_logs GROUP BY job_id)")
  ]);
  try{await db.prepare("ALTER TABLE jobs ADD COLUMN choice_group_id TEXT").run()}catch(e){if(!String(e?.message||e).toLowerCase().includes('duplicate column'))console.log('choice_group_id migration skipped',e?.message||e)}
  try{await db.prepare("ALTER TABLE sister_assignments ADD COLUMN acknowledged_at TEXT").run()}catch(e){if(!String(e?.message||e).toLowerCase().includes('duplicate column'))console.log('acknowledged_at migration skipped',e?.message||e)}
  for(const [col,typ] of [['pickup_requested_at','TEXT'],['pickup_manager','TEXT'],['pickup_eta','TEXT'],['pickup_status','TEXT'],['pickup_request_type','TEXT'],['rejected_at','TEXT'],['rejection_reason','TEXT'],['choice_result','TEXT'],['choice_result_at','TEXT'],['checkout_note','TEXT'],['checkout_requested_at','TEXT'],['checkout_decided_at','TEXT'],['auto_logout_at','TEXT'],['other_job_response','TEXT'],['other_job_message','TEXT'],['other_job_responded_at','TEXT'],['other_job_reviewed_at','TEXT']]){try{await db.prepare(`ALTER TABLE sister_assignments ADD COLUMN ${col} ${typ}`).run()}catch(e){if(!String(e?.message||e).toLowerCase().includes('duplicate column'))console.log('sister pickup migration skipped',col,e?.message||e)}}
  try{await db.prepare("ALTER TABLE sister_access ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1").run()}catch(e){if(!String(e?.message||e).toLowerCase().includes('duplicate column'))console.log('sister session_version migration skipped',e?.message||e)}
  // 기존 D1에 예전 sister_work_reports 테이블이 남아 있어도 새 정산 필드를 자동 보강한다.
  for(const [col,typ] of [['assignment_id','INTEGER'],['shop_name','TEXT'],['t_value','REAL NOT NULL DEFAULT 0'],['r_value','REAL NOT NULL DEFAULT 0'],['yc_value','REAL NOT NULL DEFAULT 0'],['manager_t','REAL'],['manager_r','REAL'],['manager_yc','REAL'],['agreed_t','REAL'],['agreed_r','REAL'],['agreed_yc','REAL'],['status',"TEXT NOT NULL DEFAULT 'pending'"],['created_at','TEXT'],['updated_at','TEXT'],['finalized_at','TEXT']]){try{await db.prepare(`ALTER TABLE sister_work_reports ADD COLUMN ${col} ${typ}`).run()}catch(e){if(!String(e?.message||e).toLowerCase().includes('duplicate column'))console.log('sister_work_reports migration skipped',col,e?.message||e)}}
  for(const [col,typ] of [['expected_arrival','TEXT'],['request_type','TEXT'],['request_received_at','TEXT']]){try{await db.prepare(`ALTER TABLE pickup_waiting ADD COLUMN ${col} ${typ}`).run()}catch(e){if(!String(e?.message||e).toLowerCase().includes('duplicate column'))console.log('pickup waiting migration skipped',col,e?.message||e)}}
  const indexes=[
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_active_name ON staff(LOWER(TRIM(name))) WHERE deleted=0",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_shop_name ON shops(LOWER(TRIM(name)))",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_active_staff ON attendance(staff_id) WHERE status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ')",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_jobs_active_staff ON jobs(staff_id) WHERE status IN ('초이스중','시간중')",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_pickup_job ON pickup_waiting(job_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_work_logs_job ON work_logs(job_id)",
    "CREATE INDEX IF NOT EXISTS idx_pickup_active ON pickup_waiting(completed,day)",
    "CREATE INDEX IF NOT EXISTS idx_work_logs_day ON work_logs(day,staff_id)",
    "CREATE INDEX IF NOT EXISTS idx_work_log_archives_day ON work_log_archives(business_day,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_work_log_hidden_day ON work_log_hidden_days(day,hidden_through_id)",
    "CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at)",
    "CREATE INDEX IF NOT EXISTS idx_sister_assign_staff ON sister_assignments(staff_id,status,updated_at)",
    "CREATE INDEX IF NOT EXISTS idx_sister_settlement_staff ON sister_settlement_messages(staff_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_test_reroute_active ON test_reroute_flow(assigned_manager,status,updated_at)",
    "CREATE INDEX IF NOT EXISTS idx_test_pickup_status ON test_pickup_flow(status,assigned_manager,updated_at)",
    "CREATE INDEX IF NOT EXISTS idx_sister_work_report_status ON sister_work_reports(status,created_at)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_sister_work_report_assignment ON sister_work_reports(assignment_id)",
    "CREATE INDEX IF NOT EXISTS idx_settlement_archives_day ON settlement_archives(day)",
    "CREATE INDEX IF NOT EXISTS idx_jobs_choice_group ON jobs(choice_group_id,status)"
  ];
  for(const sql of indexes){try{await db.prepare(sql).run()}catch(e){console.log('integrity index skipped',sql,e?.message||e)}}
  try{
    const fixed=await db.prepare("SELECT value FROM meta WHERE key='worklog_day_fix_20260725'").first();
    if(!fixed){
      await db.prepare("UPDATE work_logs SET day='2026-07-24' WHERE day='2026-07-25'").run();
      await db.prepare("INSERT INTO meta(key,value) VALUES('worklog_day_fix_20260725','1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
    }
  }catch(e){console.log('worklog day correction skipped',e?.message||e)}

  // v102: 기존 '라라' 언니는 새로 생성하지 않고 같은 staff_id를 유지한 채 '유진'으로 이름만 변경한다.
  // 현재 운영 화면은 staff_id JOIN 방식이라 즉시 유진으로 표시되고, 오늘 일한내역의 스냅샷 이름도 함께 맞춘다.
  try{
    const renamed=await db.prepare("SELECT value FROM meta WHERE key='staff_rename_lara_to_yujin_v102'").first();
    if(!renamed){
      const lara=await db.prepare("SELECT id FROM staff WHERE deleted=0 AND TRIM(name)='라라' ORDER BY id DESC LIMIT 1").first();
      const yujin=await db.prepare("SELECT id FROM staff WHERE deleted=0 AND TRIM(name)='유진' ORDER BY id DESC LIMIT 1").first();
      if(lara && (!yujin || Number(yujin.id)===Number(lara.id))){
        await db.prepare("UPDATE staff SET name='유진' WHERE id=?").bind(lara.id).run();
        await db.prepare("UPDATE work_logs SET staff_name='유진' WHERE staff_id=? AND day=?").bind(lara.id,kstBusinessDay()).run();
        await db.prepare("UPDATE settlement_archives SET staff_name='유진' WHERE staff_id=? AND day=date('now','+9 hours')").bind(lara.id).run();
        await bump(db);
      }
      await db.prepare("INSERT INTO meta(key,value) VALUES('staff_rename_lara_to_yujin_v102','1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
    }
  }catch(e){console.log('라라→유진 이름변경 migration skipped',e?.message||e)}

  integrityReady=true;
}


const J=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store'}}),B=r=>r.json(),bump=db=>db.prepare("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='version'").run();
function b64uBytes(v){const s=String(v||'').replace(/-/g,'+').replace(/_/g,'/');const pad='='.repeat((4-s.length%4)%4);const raw=atob(s+pad);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
function bytesB64u(v){let raw='';for(const b of new Uint8Array(v))raw+=String.fromCharCode(b);return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sendEmptyWebPush(env,endpoint){
  const pub=String(env.VAPID_PUBLIC_KEY||'').trim(),priv=String(env.VAPID_PRIVATE_KEY||'').trim();
  if(!pub||!priv||!endpoint)return false;
  const pb=b64uBytes(pub);if(pb.length!==65||pb[0]!==4)return false;
  const x=bytesB64u(pb.slice(1,33)),y=bytesB64u(pb.slice(33,65)),d=bytesB64u(b64uBytes(priv));
  const key=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x,y,d,ext:true}, {name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const aud=new URL(endpoint).origin,now=Math.floor(Date.now()/1000);
  const enc=new TextEncoder(),head=bytesB64u(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'}))),body=bytesB64u(enc.encode(JSON.stringify({aud,exp:now+43200,sub:'mailto:admin@colra.local'})));
  const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(head+'.'+body));
  const jwt=head+'.'+body+'.'+bytesB64u(sig);
  const r=await fetch(endpoint,{method:'POST',headers:{TTL:'60',Urgency:'high',Authorization:`vapid t=${jwt}, k=${pub}`}});
  return r.ok||r.status===201;
}

async function seq(db){const r=await db.prepare("SELECT (CAST(strftime('%s','now') AS INTEGER)*1000000)+COALESCE(MAX(id),0)+1 seq FROM attendance").first();return +r.seq}
function cookieValue(req,name){const raw=req.headers.get('cookie')||'';for(const part of raw.split(';')){const [k,...v]=part.trim().split('=');if(k===name)return decodeURIComponent(v.join('='))}return ''}
function sessionCookie(token,maxAge=43200){return `goodys_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
function JCookie(v,s=200,cookie=''){const h={'content-type':'application/json;charset=utf-8','cache-control':'no-store, no-cache, must-revalidate','pragma':'no-cache'};if(cookie)h['set-cookie']=cookie;return new Response(JSON.stringify(v),{status:s,headers:h})}
function parseSisterSettlementMessage(message){
  const text=String(message||'').trim();
  const get=(re)=>{const m=text.match(re);return m?Number(String(m[1]).replace(/,/g,''))||0:0};
  const timeCount=get(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:타임|시간)/i);
  const workCount=get(/(?:작업|ㅈㅇ)\s*(\d+(?:\.\d+)?)\s*(?:개)?/i)||get(/(\d+(?:\.\d+)?)\s*(?:개)\s*(?:작업|ㅈㅇ)/i);
  const unpaid=get(/(?:노래방\s*)?미수\s*[:：]?\s*([\d,]+)/i);
  const cash=get(/(?:현금\s*수령|헌금\s*수령|현금)\s*[:：]?\s*([\d,]+)/i);
  const timeAmount=Math.round(timeCount*8000),sisterWorkAmount=Math.round(workCount*100000),jjingAmount=Math.round(sisterWorkAmount*.2);
  return {time_count:timeCount,time_amount:timeAmount,work_count:workCount,sister_work_amount:sisterWorkAmount,jjing_amount:jjingAmount,shop_unpaid:unpaid,cash_received:cash,settlement_amount:timeAmount+jjingAmount+unpaid-cash,rule:'타임 시간당 8,000원 · 작업 1개당 언니 100,000원 · 찡값 20%'};
}
async function requireSession(req,db){const token=cookieValue(req,'goodys_session');if(!token)return null;const row=await db.prepare("SELECT token,manager FROM auth_sessions WHERE token=? AND expires_at>datetime('now')").bind(token).first();if(!row){await db.prepare("DELETE FROM auth_sessions WHERE token=?").bind(token).run();return null}await db.prepare("UPDATE auth_sessions SET last_seen=datetime('now'),expires_at=datetime('now','+30 minutes') WHERE token=?").bind(token).run();return row}
async function api(req,env,u){try{const db=env.DB,p=u.pathname,m=req.method;if(!db)return J({message:'D1 미연결'},503);await ensureIntegrity(db);
if(p==='/api/auth/login'&&m==='POST'){
  const x=await B(req),raw=String(x.manager||'').trim();
  const manager=({
    '실장A':'실장A','패밀리-가나':'실장A','가나':'실장A',
    '실장B':'실장B','패밀리-스마일':'실장B','스마일':'실장B',
    '실장C':'실장C','패밀리-구글':'실장C','구글':'실장C'
  })[raw]||raw;
  if(!['실장A','실장B','실장C'].includes(manager)||String(x.password||'')!=='3535')
    return J({message:'아이디 또는 비밀번호가 올바르지 않습니다.'},401);
  const token=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
  await db.prepare("DELETE FROM auth_sessions WHERE manager=? OR expires_at<=datetime('now')").bind(manager).run();
  await db.prepare("INSERT INTO auth_sessions(token,manager,last_seen,expires_at) VALUES(?,?,datetime('now'),datetime('now','+30 minutes'))").bind(token,manager).run();
  return JCookie({ok:true,manager},200,sessionCookie(token));
}
if(p==='/api/auth/status'){const session=await requireSession(req,db);return session?J({authenticated:true,manager:session.manager}):JCookie({authenticated:false},401,sessionCookie('',0))}
if(p==='/api/auth/logout'&&m==='POST'){const token=cookieValue(req,'goodys_session');if(token)await db.prepare("DELETE FROM auth_sessions WHERE token=?").bind(token).run();return JCookie({ok:true},200,sessionCookie('',0))}

if(p==='/api/sister/login'&&m==='POST'){
  const x=await B(req),token=decodeURIComponent(String(x.token||'').trim()),pin=String(x.pin||'').normalize('NFKC').replace(/[^0-9]/g,'').slice(-4);
  const row=await db.prepare("SELECT sa.staff_id,s.name,COALESCE(s.phone,'') phone,COALESCE(sa.session_version,1) session_version FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE TRIM(sa.access_token)=? AND sa.enabled=1 AND COALESCE(s.deleted,0)=0").bind(token).first();
  if(!row)return J({message:'사용할 수 없는 앱주소입니다. 언니앱 주소를 다시 발급해 주세요.'},404);
  const digits=String(row.phone||'').normalize('NFKC').replace(/[^0-9]/g,'');
  if(digits.length<4)return J({message:'언니등록 전화번호가 4자리 이상 저장되어 있지 않습니다.'},400);
  const expected=digits.slice(-4);
  if(pin!==expected)return J({message:`비밀번호가 일치하지 않습니다.\n등록번호 끝 4자리: ${expected}`},401);
  // TEST 전용: 명시적으로 새 로그인하면 이전 테스트 잔여 상태를 정리한다.
  // 실제 초이스/일중 job, 진행 중 픽업, 미확정 정산이 있으면 절대 초기화하지 않는다.
  // 반대로 그 실체가 없으면 출근대기/대기/ㅈㅁ 및 과거 assignment 잔여값을 지워
  // 반드시 '도착 예정시간 선택 → 출근예약' 화면에서 시작한다.
  if(['테스트1','테스트2'].includes(String(row.name||'').trim())){
    const liveJob=await db.prepare("SELECT id,status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    const livePickup=await db.prepare("SELECT id FROM pickup_waiting WHERE staff_id=? AND COALESCE(completed,0)=0 ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    const liveFlow=await db.prepare("SELECT id,status FROM test_pickup_flow WHERE staff_id=? AND status IN ('requested','assigned','driver_accepted','driver_rejected','big_confirmed') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    const liveReport=await db.prepare("SELECT id,status FROM sister_work_reports WHERE staff_id=? AND status IN ('pending','review') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    const liveCheckout=await db.prepare("SELECT id,status FROM sister_assignments WHERE staff_id=? AND status IN ('checkout_waiting','checkout_goodbye','post_report_other','post_report_other_ok','post_report_other_reject') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    if(!liveJob&&!livePickup&&!liveFlow&&!liveReport&&!liveCheckout){
      await db.prepare("DELETE FROM attendance WHERE staff_id=? AND status IN ('출근대기','대기','ㅈㅁ')").bind(row.staff_id).run();
      await db.prepare("UPDATE sister_assignments SET status='closed',pickup_status=CASE WHEN pickup_status IN ('waiting','assigned') THEN 'completed' ELSE pickup_status END,updated_at=datetime('now') WHERE staff_id=? AND status NOT IN ('closed','replaced')").bind(row.staff_id).run();
    }
  }
  return J({ok:true,staff_id:row.staff_id,name:row.name,session_version:Number(row.session_version||1)});
}
if(p==='/api/sister/version'){
  const token=String(u.searchParams.get('token')||'').trim(),clientVersion=Number(u.searchParams.get('session_version')||0);
  const row=await db.prepare("SELECT COALESCE(sa.session_version,1) session_version,CAST(COALESCE((SELECT value FROM meta WHERE key='version'),'0') AS INTEGER) state_version,(SELECT auto_logout_at FROM sister_assignments x WHERE x.staff_id=sa.staff_id AND x.status='checkout_goodbye' ORDER BY x.id DESC LIMIT 1) auto_logout_at FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE sa.access_token=? AND sa.enabled=1 AND s.deleted=0").bind(token).first();
  if(!row)return J({message:'사용할 수 없는 앱주소입니다.'},404);
  if(!clientVersion||clientVersion!==Number(row.session_version||1))return J({ok:true,force_logout:true,message:'오늘 업무가 종료되었습니다.',version:Number(row.state_version||0)});
  if(row.auto_logout_at){const due=Date.parse(String(row.auto_logout_at).replace(' ','T')+'Z');if(Number.isFinite(due)&&Date.now()>=due)return J({ok:true,force_logout:true,message:'오늘도 수고하셨어요 🌷 좋은 꿈 꾸세요 🍀',version:Number(row.state_version||0)});}
  return J({ok:true,version:Number(row.state_version||0)});
}
if(p==='/api/sister/state'){
  const token=String(u.searchParams.get('token')||'').trim(),clientVersion=Number(u.searchParams.get('session_version')||0);
  const row=await db.prepare("SELECT sa.staff_id,s.name,COALESCE(sa.session_version,1) session_version FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE sa.access_token=? AND sa.enabled=1 AND s.deleted=0").bind(token).first();
  if(!row)return J({message:'사용할 수 없는 앱주소입니다.'},404);
  if(!clientVersion||clientVersion!==Number(row.session_version||1))return J({ok:true,force_logout:true,message:'오늘 업무가 종료되었습니다.'});
  const stateVersionRow=await db.prepare("SELECT value FROM meta WHERE key='version'").first();
  const stateVersion=Number(stateVersionRow?.value||0);
  const isTestSister=['테스트1','테스트2'].includes(String(row.name||'').trim());
  // TEST 전용 자동복구: 앱이 이미 로그인된 채로 새 버전이 배포되어도
  // 과거 테스트에서 남은 '출근대기'가 초기화면을 가로막지 않게 한다.
  // 현재 세션에서 언니가 직접 새로 예약한 출근대기에는 TESTSESSION 표식을 넣어 보존한다.
  if(isTestSister){
    const staleWait=await db.prepare("SELECT id,status,memo FROM attendance WHERE staff_id=? AND status='출근대기' ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    if(staleWait){
      const sessionMark='TESTSESSION:'+Number(row.session_version||1);
      const memo=String(staleWait.memo||'');
      const liveJob=await db.prepare("SELECT id FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
      const liveFlow=await db.prepare("SELECT id FROM test_pickup_flow WHERE staff_id=? AND status IN ('requested','assigned','driver_accepted','driver_rejected','big_confirmed') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
      const liveReport=await db.prepare("SELECT id FROM sister_work_reports WHERE staff_id=? AND status IN ('pending','review') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
      if(!memo.includes(sessionMark)&&!liveJob&&!liveFlow&&!liveReport){
        await db.prepare("DELETE FROM attendance WHERE id=? AND status='출근대기'").bind(staleWait.id).run();
      }
    }
  }
  const attendance=await db.prepare("SELECT * FROM attendance WHERE staff_id=? AND status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
  let a=null,testFlow=null,workReport=null;
  if(isTestSister){
    // TEST 언니는 DB에 남아 있는 오래된 assignment 한 줄만 보고 상태를 결정하지 않는다.
    // 현재 attendance/job/pickup/report의 실체와 연결된 assignment만 화면에 사용한다.
    const activeJob=await db.prepare("SELECT id,status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    if(activeJob){
      a=await db.prepare("SELECT * FROM sister_assignments WHERE staff_id=? AND job_id=? AND status NOT IN ('closed','replaced','choice_x','choice_rejected') ORDER BY id DESC LIMIT 1").bind(row.staff_id,activeJob.id).first();
      if(a&&String(activeJob.status||'')==='초이스중')a={...a,status:'choice_wait'};
      if(a&&String(activeJob.status||'')==='시간중'&&a.status==='choice_wait')a={...a,status:'working'};
    }
    if(!a){
      a=await db.prepare("SELECT sa.* FROM sister_assignments sa WHERE sa.staff_id=? AND sa.status IN ('big_waiting','pickup_driver_wait','pickup_assigned','report_required','post_report','post_report_jm','checkout_waiting','checkout_goodbye','post_report_other','post_report_other_ok','post_report_other_reject') ORDER BY sa.id DESC LIMIT 1").bind(row.staff_id).first();
    }
    if(a&&a.job_id){const jj=await db.prepare("SELECT start_time FROM jobs WHERE id=?").bind(a.job_id).first();if(jj)a={...a,job_start_time:jj.start_time||''}}
    if(a){
      testFlow=await db.prepare("SELECT * FROM test_pickup_flow WHERE assignment_id=? ORDER BY id DESC LIMIT 1").bind(a.id).first();
      workReport=await db.prepare("SELECT * FROM sister_work_reports WHERE assignment_id=? ORDER BY id DESC LIMIT 1").bind(a.id).first();
    }
  }else if(attendance&&['초이스중','시간중'].includes(String(attendance.status||''))){
    const activeJob=await db.prepare("SELECT id,status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY id DESC LIMIT 1").bind(row.staff_id).first();
    if(activeJob)a=await db.prepare("SELECT * FROM sister_assignments WHERE staff_id=? AND job_id=? AND status NOT IN ('closed','replaced','choice_x','choice_rejected') ORDER BY id DESC LIMIT 1").bind(row.staff_id,activeJob.id).first();
    if(a&&String(attendance.status||'')==='초이스중')a={...a,status:'choice_wait'};
  }
  if(!attendance&&!isTestSister){
    await db.prepare("UPDATE sister_assignments SET status='closed',pickup_status=CASE WHEN pickup_status IN ('waiting','assigned') THEN 'completed' ELSE pickup_status END,updated_at=datetime('now') WHERE staff_id=? AND (status NOT IN ('closed','replaced','choice_x','choice_rejected') OR pickup_status IN ('waiting','assigned'))").bind(row.staff_id).run();
    return J({ok:true,name:row.name,assignment:null,attendance:null,session_version:Number(row.session_version||1),reset_to_attendance:true,is_test_sister:false,version:stateVersion});
  }
  return J({ok:true,name:row.name,assignment:a||null,attendance:attendance||null,test_flow:testFlow||null,work_report:workReport||null,session_version:Number(row.session_version||1),is_test_sister:isTestSister,version:stateVersion});
}
if(p==='/api/sister/attendance/reserve'&&m==='POST'){
  const x=await B(req),token=String(x.token||'').trim(),eta=String(x.eta||'').trim();
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(eta))return J({message:'도착 예정시간을 입력해 주세요.'},400);
  const who=await db.prepare("SELECT sa.staff_id,COALESCE(sa.session_version,1) session_version,s.name FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE sa.access_token=? AND sa.enabled=1 AND s.deleted=0").bind(token).first();
  if(!who)return J({message:'사용할 수 없는 앱주소입니다.'},404);
  const activeRows=(await db.prepare("SELECT id,status FROM attendance WHERE staff_id=? AND status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') ORDER BY id DESC").bind(who.staff_id).all()).results||[];
  const newest=activeRows[0]||null;
  // 최신 행이 출근대기인데 과거의 대기/ㅈㅁ 행이 같이 남아 있으면 실장 화면이 과거 행을 우선 표시할 수 있다.
  // 언니앱 예약 시 출근대기 한 건만 남도록 정규화한다.
  if(newest&&newest.status!=='출근대기')return J({message:'이미 출근 또는 배정 상태입니다.'},409);
  const memo=(['테스트1','테스트2'].includes(String(who.name||'').trim())?'TESTSESSION:'+Number(who.session_version||1)+' · ':'')+'언니앱 출근예약 · 도착예정 '+eta;
  await db.prepare("UPDATE sister_assignments SET status='closed',pickup_status=CASE WHEN pickup_status IN ('waiting','assigned') THEN 'completed' ELSE pickup_status END,updated_at=datetime('now') WHERE staff_id=? AND (status NOT IN ('closed','replaced','choice_x','choice_rejected') OR pickup_status IN ('waiting','assigned'))").bind(who.staff_id).run();
  if(newest){
    await db.prepare("DELETE FROM attendance WHERE staff_id=? AND id<>? AND status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ')").bind(who.staff_id,newest.id).run();
    await db.prepare("UPDATE attendance SET day=?,status='출근대기',sequence=?,manager='',memo=?,check_in_time=strftime('%H:%M','now','+9 hours') WHERE id=?")
      .bind(kstBusinessDay(),await seq(db),memo,newest.id).run();
  }else{
    await db.prepare("INSERT INTO attendance(day,staff_id,sequence,check_in_time,status,manager,memo) VALUES(?,?,?,strftime('%H:%M','now','+9 hours'),'출근대기','',?)")
      .bind(kstBusinessDay(),who.staff_id,await seq(db),memo).run();
  }
  await bump(db);
  const saved=await db.prepare("SELECT id,status,manager,memo FROM attendance WHERE staff_id=? AND status='출근대기' ORDER BY id DESC LIMIT 1").bind(who.staff_id).first();
  return J({ok:true,name:who.name,eta,attendance:saved||null});
}
if(p==='/api/sister/push/subscribe'&&m==='POST'){
  const x=await B(req),token=String(x.token||'').trim(),sub=x.subscription||{},endpoint=String(sub.endpoint||'').trim();
  const who=await db.prepare("SELECT staff_id FROM sister_access WHERE access_token=? AND enabled=1").bind(token).first();
  if(!who)return J({message:'사용할 수 없는 앱주소입니다.'},404);
  if(!endpoint)return J({message:'푸시 구독정보가 없습니다.'},400);
  const keys=sub.keys||{};
  await db.prepare("INSERT INTO sister_push_subscriptions(staff_id,endpoint,p256dh,auth,created_at,updated_at) VALUES(?,?,?,?,datetime('now'),datetime('now')) ON CONFLICT(endpoint) DO UPDATE SET staff_id=excluded.staff_id,p256dh=excluded.p256dh,auth=excluded.auth,updated_at=datetime('now')")
    .bind(who.staff_id,endpoint,String(keys.p256dh||''),String(keys.auth||'')).run();
  return J({ok:true,push_ready:Boolean(String(env.VAPID_PUBLIC_KEY||'').trim())});
}
if(p==='/api/sister/action'&&m==='POST'){
  const x=await B(req),token=String(x.token||'').trim(),action=String(x.action||'').trim(),message=String(x.message||'').trim();
  const who=await db.prepare("SELECT sa.staff_id,s.name FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE sa.access_token=? AND sa.enabled=1").bind(token).first();
  if(!who)return J({message:'사용할 수 없는 앱주소입니다.'},404);
  const isTestSister=['테스트1','테스트2'].includes(String(who.name||'').trim());
  const a=await db.prepare("SELECT * FROM sister_assignments WHERE staff_id=? ORDER BY id DESC LIMIT 1").bind(who.staff_id).first();
  if(!a)return J({message:'현재 배정이 없습니다.'},404);
  if(isTestSister){
    if(action==='VIEW'){
      await db.prepare("UPDATE sister_assignments SET acknowledged_at=COALESCE(acknowledged_at,datetime('now')),updated_at=datetime('now') WHERE id=? AND status='choice_wait'").bind(a.id).run();
    }else if(action==='CHOICE_RESULT'){
      const result=String(x.result||'').toUpperCase();
      if(!['O','X'].includes(result))return J({message:'O 또는 X를 선택해 주세요.'},400);
      await db.prepare("UPDATE sister_assignments SET acknowledged_at=COALESCE(acknowledged_at,datetime('now')),choice_result=?,choice_result_at=datetime('now'),message=?,updated_at=datetime('now') WHERE id=?").bind(result,message,a.id).run();
      if(result==='O'){
        // O 전송은 언니의 선택만 기록한다. 실제 일중 전환은 실장이 '통과'로 확인한 뒤 진행한다.
        await db.prepare("UPDATE sister_assignments SET status='choice_wait',updated_at=datetime('now') WHERE id=?").bind(a.id).run();
      }else{
        if(a.job_id)await db.prepare("DELETE FROM jobs WHERE id=? AND status='초이스중'").bind(a.job_id).run();
        await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='초이스중'").bind(await seq(db),who.staff_id).run();
        await db.prepare("UPDATE sister_assignments SET status='choice_x',updated_at=datetime('now') WHERE id=?").bind(a.id).run();
      }
    }else if(action==='BIG_REQUEST'){
      const requestType=String(x.request_type||'').trim();
      if(!['10분 후','지금 끝남'].includes(requestType))return J({message:'10분 후 또는 지금 끝남을 선택해 주세요.'},400);
      if(a.status!=='working')return J({message:'현재 일중 상태에서만 전송할 수 있습니다.'},409);
      await db.prepare("UPDATE sister_assignments SET status='big_waiting',message=?,pickup_requested_at=datetime('now'),pickup_status='waiting',pickup_request_type=?,updated_at=datetime('now') WHERE id=?").bind(message,requestType,a.id).run();
      await db.prepare("INSERT INTO test_pickup_flow(assignment_id,staff_id,job_id,shop_id,shop_name,sister_request_type,sister_message,big_manager,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'requested',datetime('now'),datetime('now')) ON CONFLICT(assignment_id) DO UPDATE SET sister_request_type=excluded.sister_request_type,sister_message=excluded.sister_message,status='requested',assigned_manager=NULL,eta_choice=NULL,driver_response=NULL,reject_reason=NULL,driver_message=NULL,driver_responded_at=NULL,big_confirmed_at=NULL,driver_acknowledged_at=NULL,updated_at=datetime('now')")
        .bind(a.id,who.staff_id,a.job_id,a.shop_id,a.shop_name,requestType,message,BIG_MANAGER_KEY).run();
    }else if(action==='POST_REPORT_ACTION'){
      const v=String(x.value||'').trim();
      if(v==='계속'){
        await db.prepare("UPDATE sister_assignments SET status='post_report',updated_at=datetime('now') WHERE id=?").bind(a.id).run();
      }else if(v==='ㅈㅁ'){
        await db.prepare("UPDATE attendance SET status='ㅈㅁ',sequence=? WHERE staff_id=? AND status='대기'").bind(await seq(db),who.staff_id).run();
        await db.prepare("UPDATE sister_assignments SET status='post_report_jm',updated_at=datetime('now') WHERE id=?").bind(a.id).run();
      }else if(v==='퇴근'){
        await db.prepare("UPDATE sister_assignments SET status='checkout_waiting',checkout_note=NULL,checkout_requested_at=datetime('now'),checkout_decided_at=NULL,auto_logout_at=NULL,updated_at=datetime('now') WHERE id=?").bind(a.id).run();
        await bump(db);return J({ok:true,waiting_big_manager:true});
      }else return J({message:'선택값이 올바르지 않습니다.'},400);
    }else if(action==='OTHER_JOB_RESPONSE'){
      if(a.status!=='post_report_other')return J({message:'현재 다른 일정 확인 상태가 아닙니다.'},409);
      const response=String(x.response||'').trim();
      if(!['OK','거절'].includes(response))return J({message:'OK 또는 거절을 선택해 주세요.'},400);
      await db.prepare("UPDATE sister_assignments SET status=?,other_job_response=?,other_job_message=?,other_job_responded_at=datetime('now'),other_job_reviewed_at=NULL,updated_at=datetime('now') WHERE id=?").bind(response==='OK'?'post_report_other_ok':'post_report_other_reject',response,message,a.id).run();
    }else return J({message:'처리값이 올바르지 않습니다.'},400);
    await bump(db);return J({ok:true});
  }
  if(action==='ACK'){
    await db.prepare("UPDATE sister_assignments SET acknowledged_at=COALESCE(acknowledged_at,datetime('now')),updated_at=datetime('now') WHERE id=?").bind(a.id).run();
  }else if(action==='REJECT'){
    if(!message.trim())return J({message:'수신거절 사유를 입력해 주세요.'},400);
    if(a.job_id)await db.prepare("DELETE FROM jobs WHERE id=? AND status='초이스중'").bind(a.job_id).run();
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='초이스중'").bind(await seq(db),who.staff_id).run();
    await db.prepare("UPDATE sister_assignments SET status='choice_rejected',message=?,rejection_reason=?,rejected_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(message.trim(),message.trim(),a.id).run();
  }else if(action==='O'){
    if(!a.acknowledged_at)return J({message:'먼저 수신 확인을 눌러 주세요.'},400);
    if(a.job_id)await db.prepare("UPDATE jobs SET status='시간중',start_at=datetime('now'),start_time=strftime('%H:%M','now','+9 hours') WHERE id=? AND status='초이스중'").bind(a.job_id).run();
    await db.prepare("UPDATE attendance SET status='시간중' WHERE staff_id=? AND status='초이스중'").bind(who.staff_id).run();
    await db.prepare("UPDATE sister_assignments SET status='working',message=?,updated_at=datetime('now') WHERE id=?").bind(message,a.id).run();
  }else if(action==='X'||action==='EXIT_NOW'){
    if(!a.acknowledged_at&&action==='X')return J({message:'먼저 수신 확인을 눌러 주세요.'},400);
    if(a.job_id)await db.prepare("DELETE FROM jobs WHERE id=? AND status IN ('초이스중','시간중')").bind(a.job_id).run();
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status IN ('초이스중','시간중')").bind(await seq(db),who.staff_id).run();
    if(action==='X')await db.prepare("UPDATE sister_assignments SET status='choice_x',message=?,updated_at=datetime('now') WHERE id=?").bind(message,a.id).run();
    else await db.prepare("UPDATE sister_assignments SET status='ended_now',message=?,pickup_requested_at=datetime('now'),pickup_status='waiting',pickup_request_type='바로 나옴',updated_at=datetime('now') WHERE id=?").bind(message,a.id).run();
  }else if(action==='END10'||action==='END'||action==='MSG'){
    const st=action==='END10'?'end10':action==='END'?'ended':'working';
    if(action==='MSG')await db.prepare("UPDATE sister_assignments SET status=?,message=?,updated_at=datetime('now') WHERE id=?").bind(st,message,a.id).run();
    else await db.prepare("UPDATE sister_assignments SET status=?,message=?,pickup_requested_at=datetime('now'),pickup_status='waiting',pickup_request_type=?,updated_at=datetime('now') WHERE id=?").bind(st,message,action==='END10'?'10분 후 종료':'지금 종료',a.id).run();
  }else return J({message:'처리값이 올바르지 않습니다.'},400);
  await bump(db);return J({ok:true});
}

const session=await requireSession(req,db);if(!session)return JCookie({message:'로그인이 필요하거나 세션이 만료되었습니다.'},401,sessionCookie('',0));
if(p==='/api/sync/version'){
  const v=await db.prepare("SELECT value FROM meta WHERE key='version'").first();
  return J({ok:true,version:Number(v?.value||0)});
}
if(p==='/api/presence/status'){
  const presence=await db.prepare("SELECT manager,last_seen,CASE WHEN last_seen>=datetime('now','-20 seconds') THEN 1 ELSE 0 END online FROM manager_presence WHERE manager IN ('실장A','실장B','실장C') ORDER BY manager").all();
  return J({ok:true,presence:presence.results||[]});
}


if(p==='/api/sister/link'&&m==='POST'){return J({message:'FAMILY에서는 언니앱을 사용하지 않습니다.'},403);}
if(false){
  const x=await B(req),staffId=Number(x.staff_id);if(!staffId)return J({message:'언니를 선택해 주세요.'},400);
  const s=await db.prepare("SELECT id,name,phone FROM staff WHERE id=? AND deleted=0").bind(staffId).first();if(!s)return J({message:'언니 정보를 찾을 수 없습니다.'},404);
  const digits=String(s.phone||'').replace(/\D/g,'');if(digits.length<4)return J({message:'등록된 전화번호가 4자리 이상이어야 합니다.'},400);
  let row=await db.prepare("SELECT access_token FROM sister_access WHERE staff_id=?").bind(staffId).first();
  if(!row){const t=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');await db.prepare("INSERT INTO sister_access(staff_id,access_token,enabled,created_at) VALUES(?,?,1,datetime('now'))").bind(staffId,t).run();row={access_token:t}}
  return J({ok:true,name:s.name,pin:digits.slice(-4),url:`${u.origin}/sister/${row.access_token}`});
}
if(p==='/api/sister/send'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'현재는 test 계정에서만 언니앱 테스트가 가능합니다.'},403);
  const x=await B(req),jobId=Number(x.job_id),options=String(x.options||'').replace(/티/g,'T').replace(/중/g,'M').replace(/ㅇㅊ/g,'ㅈㅇ').replace(/ㅈ(?!ㅇ)/g,'ㅈㅇ'),manager=BIG_MANAGER_KEY,choiceMessage=String(x.message||'').trim();
  const j=await db.prepare("SELECT j.id,j.staff_id,j.shop_id,sh.name shop_name,s.name staff_name FROM jobs j JOIN shops sh ON sh.id=j.shop_id JOIN staff s ON s.id=j.staff_id WHERE j.id=? AND j.status='초이스중'").bind(jobId).first();if(!j)return J({message:'초이스 건을 찾을 수 없습니다.'},404);if(!['테스트1','테스트2'].includes(String(j.staff_name||'').trim()))return J({message:'현재 새 초이스 흐름은 테스트1/테스트2만 사용합니다.'},403);
  const existing=await db.prepare("SELECT id FROM sister_assignments WHERE staff_id=? AND job_id=? AND status='choice_wait' ORDER BY id DESC LIMIT 1").bind(j.staff_id,j.id).first();
  if(existing){
    await db.prepare("UPDATE sister_assignments SET shop_id=?,shop_name=?,options=?,manager=?,sent_by=?,message=?,updated_at=datetime('now') WHERE id=?")
      .bind(j.shop_id,j.shop_name,options,manager,session.manager,choiceMessage,existing.id).run();
  }else{
    await db.prepare("UPDATE sister_assignments SET status='replaced',updated_at=datetime('now') WHERE staff_id=? AND status IN ('choice_wait','working','end10')").bind(j.staff_id).run();
    await db.prepare("INSERT INTO sister_assignments(staff_id,job_id,shop_id,shop_name,options,manager,sent_by,status,message,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'choice_wait',?,datetime('now'),datetime('now'))")
      .bind(j.staff_id,j.id,j.shop_id,j.shop_name,options,manager,session.manager,choiceMessage).run();
  }
  const subs=await db.prepare("SELECT endpoint FROM sister_push_subscriptions WHERE staff_id=?").bind(j.staff_id).all();
  let push_sent=0;
  for(const sub of (subs.results||[])){try{if(await sendEmptyWebPush(env,sub.endpoint))push_sent++}catch(e){console.log('push failed',e?.message||e)}}
  await bump(db);return J({ok:true,push_sent});
}

if(p==='/api/sister/pickup/assign'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'현재는 test 계정에서만 픽업연동 테스트가 가능합니다.'},403);
  const x=await B(req),assignmentId=Number(x.assignment_id),manager=String(x.manager||'').trim(),eta=String(x.eta||'').trim();
  if(!assignmentId||!manager||!eta)return J({message:'실장과 예상 도착시간을 입력해 주세요.'},400);
  const a=await db.prepare("SELECT * FROM sister_assignments WHERE id=? AND pickup_status='waiting'").bind(assignmentId).first();
  if(!a)return J({message:'처리할 픽업요청을 찾을 수 없습니다.'},404);
  const j=a.job_id?await db.prepare("SELECT * FROM jobs WHERE id=?").bind(a.job_id).first():null;
  if(j){
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='시간중'").bind(await seq(db),a.staff_id).run();
    await db.prepare("INSERT OR IGNORE INTO pickup_waiting(day,job_id,staff_id,shop_id,manager,finished_at,finished_time,completed,expected_arrival,request_type,request_received_at) VALUES(date('now','+9 hours'),?,?,?,?,datetime('now'),strftime('%H:%M','now','+9 hours'),0,?,?,?)")
      .bind(j.id,a.staff_id,a.shop_id,manager,eta,a.pickup_request_type||'픽업 요청',a.pickup_requested_at||null).run();
    await db.prepare("UPDATE pickup_waiting SET manager=?,expected_arrival=?,request_type=?,request_received_at=COALESCE(request_received_at,?) WHERE job_id=?").bind(manager,eta,a.pickup_request_type||'픽업 요청',a.pickup_requested_at||null,j.id).run();
    await db.prepare("DELETE FROM jobs WHERE id=?").bind(j.id).run();
  }
  await db.prepare("UPDATE sister_assignments SET pickup_manager=?,pickup_eta=?,pickup_status='assigned',updated_at=datetime('now') WHERE id=?").bind(manager,eta,assignmentId).run();
  await bump(db);return J({ok:true});
}


if(p==='/api/test-pickup/assign'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'테스트 큰실장만 배정할 수 있습니다.'},403);
  const x=await B(req),id=Number(x.id),manager=String(x.manager||'').trim(),eta=String(x.eta||'').trim();
  if(!id||!manager||!['3분 후','5분 후','10분 후','메시지 후 나옴'].includes(eta))return J({message:'실장과 예상도착을 선택해 주세요.'},400);
  // 최초 요청뿐 아니라 기사 거절을 큰실장이 확인한 뒤에도 같은 건을 바로 재배정할 수 있다.
  const f=await db.prepare("SELECT f.*,s.name FROM test_pickup_flow f JOIN staff s ON s.id=f.staff_id WHERE f.id=? AND f.status IN ('requested','rejected_confirmed')").bind(id).first();
  if(!f)return J({message:'배정할 요청을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE test_pickup_flow SET assigned_manager=?,eta_choice=?,status='assigned',driver_response=NULL,reject_reason=NULL,driver_message=NULL,driver_responded_at=NULL,big_confirmed_at=NULL,driver_acknowledged_at=NULL,updated_at=datetime('now') WHERE id=?").bind(manager,eta,id).run();
  await db.prepare("UPDATE sister_assignments SET pickup_manager=?,pickup_eta=?,status='pickup_driver_wait',updated_at=datetime('now') WHERE id=?").bind(manager,eta,f.assignment_id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/test-pickup/driver-response'&&m==='POST'){
  const x=await B(req),id=Number(x.id),response=String(x.response||'').trim(),reason=String(x.reason||'').trim(),message=String(x.message||'').trim();
  const f=await db.prepare("SELECT * FROM test_pickup_flow WHERE id=? AND status='assigned'").bind(id).first();
  if(!f)return J({message:'응답할 배정이 없습니다.'},404);
  if(String(f.assigned_manager||'')!==String(session.manager||''))return J({message:'배정된 실장만 응답할 수 있습니다.'},403);
  if(!['수락','거절'].includes(response))return J({message:'수락 또는 거절을 선택해 주세요.'},400);
  if(response==='거절'&&!reason&&!message)return J({message:'거절 이유를 선택하거나 메시지를 입력해 주세요.'},400);
  await db.prepare("UPDATE test_pickup_flow SET driver_response=?,reject_reason=?,driver_message=?,driver_responded_at=datetime('now'),status=?,updated_at=datetime('now') WHERE id=?")
    .bind(response,reason,message,response==='수락'?'driver_accepted':'driver_rejected',id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/test-pickup/big-confirm'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'테스트 큰실장만 확인할 수 있습니다.'},403);
  const x=await B(req),id=Number(x.id);
  const f=await db.prepare("SELECT * FROM test_pickup_flow WHERE id=? AND status IN ('driver_accepted','driver_rejected')").bind(id).first();
  if(!f)return J({message:'확인할 실장 응답이 없습니다.'},404);
  if(f.status==='driver_rejected'){
    await db.prepare("UPDATE test_pickup_flow SET status='rejected_confirmed',big_confirmed_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
    await db.prepare("UPDATE sister_assignments SET status='big_waiting',updated_at=datetime('now') WHERE id=?").bind(f.assignment_id).run();
  }else{
    const j=f.job_id?await db.prepare("SELECT * FROM jobs WHERE id=?").bind(f.job_id).first():null;
    if(j){
      await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='시간중'").bind(await seq(db),f.staff_id).run();
      await db.prepare("INSERT OR IGNORE INTO pickup_waiting(day,job_id,staff_id,shop_id,manager,finished_at,finished_time,completed,expected_arrival,request_type,request_received_at) VALUES(date('now','+9 hours'),?,?,?,?,datetime('now'),strftime('%H:%M','now','+9 hours'),0,?,?,datetime('now'))")
        .bind(j.id,f.staff_id,f.shop_id,f.assigned_manager,f.eta_choice,f.sister_request_type||'픽업 요청').run();
      await db.prepare("UPDATE pickup_waiting SET manager=?,expected_arrival=?,request_type=?,request_received_at=COALESCE(request_received_at,datetime('now')) WHERE job_id=?").bind(f.assigned_manager,f.eta_choice,f.sister_request_type||'픽업 요청',j.id).run();
      await db.prepare("DELETE FROM jobs WHERE id=?").bind(j.id).run();
    }
    await db.prepare("UPDATE test_pickup_flow SET status='confirmed',big_confirmed_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
    await db.prepare("UPDATE sister_assignments SET status='pickup_assigned',pickup_status='assigned',pickup_manager=?,pickup_eta=?,updated_at=datetime('now') WHERE id=?").bind(f.assigned_manager,f.eta_choice,f.assignment_id).run();
  }
  await bump(db);return J({ok:true});
}
if(p==='/api/test-pickup/driver-ack'&&m==='POST'){
  const x=await B(req),id=Number(x.id);const f=await db.prepare("SELECT * FROM test_pickup_flow WHERE id=? AND status IN ('confirmed','rejected_confirmed')").bind(id).first();
  if(!f)return J({message:'확인할 완료건이 없습니다.'},404);
  if(String(f.assigned_manager||'')!==String(session.manager||''))return J({message:'배정된 실장만 확인할 수 있습니다.'},403);
  if(f.status==='rejected_confirmed'){
    await db.prepare("UPDATE test_pickup_flow SET driver_acknowledged_at=datetime('now'),status='requested',assigned_manager=NULL,eta_choice=NULL,updated_at=datetime('now') WHERE id=?").bind(id).run();
    await db.prepare("UPDATE sister_assignments SET pickup_manager=NULL,pickup_eta=NULL,status='big_waiting',updated_at=datetime('now') WHERE id=?").bind(f.assignment_id).run();
  }else await db.prepare("UPDATE test_pickup_flow SET driver_acknowledged_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/test-reroute/driver-response'&&m==='POST'){
  const x=await B(req),id=Number(x.id),response=String(x.response||'').trim(),reason=String(x.reason||'').trim(),message=String(x.message||'').trim();
  const r=await db.prepare("SELECT * FROM test_reroute_flow WHERE id=? AND status='requested'").bind(id).first();
  if(!r)return J({message:'응답할 이동요청이 없습니다.'},404);
  if(String(r.assigned_manager||'')!==String(session.manager||''))return J({message:'현재 배정실장만 응답할 수 있습니다.'},403);
  if(!['수락','거절'].includes(response))return J({message:'수락 또는 거절을 선택해 주세요.'},400);
  if(response==='거절'&&!reason&&!message)return J({message:'거절 이유를 선택하거나 메시지를 입력해 주세요.'},400);
  await db.prepare("UPDATE test_reroute_flow SET driver_response=?,reject_reason=?,driver_message=?,driver_responded_at=datetime('now'),status=?,updated_at=datetime('now') WHERE id=?").bind(response,reason,message,response==='수락'?'driver_accepted':'driver_rejected',id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/test-reroute/big-confirm'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'큰실장만 최종 결정할 수 있습니다.'},403);
  const x=await B(req),id=Number(x.id);
  const r=await db.prepare("SELECT * FROM test_reroute_flow WHERE id=? AND status IN ('driver_accepted','driver_rejected')").bind(id).first();
  if(!r)return J({message:'확인할 배정실장 응답이 없습니다.'},404);
  if(r.status==='driver_rejected'){
    await db.prepare("DELETE FROM jobs WHERE id=? AND status='초이스중'").bind(r.new_job_id).run();
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='초이스중'").bind(await seq(db),r.staff_id).run();
    await db.prepare("UPDATE test_reroute_flow SET status='rejected_confirmed',big_confirmed_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
  }else{
    const j=await db.prepare("SELECT j.*,sh.name shop_name FROM jobs j LEFT JOIN shops sh ON sh.id=j.shop_id WHERE j.id=? AND j.status='초이스중'").bind(r.new_job_id).first();
    if(!j)return J({message:'새 초이스 건을 찾을 수 없습니다.'},409);
    await db.prepare("UPDATE pickup_waiting SET completed=1,completed_at=datetime('now') WHERE id=? AND completed=0").bind(r.old_pickup_id).run();
    await db.prepare("UPDATE sister_assignments SET status='replaced',updated_at=datetime('now') WHERE staff_id=? AND status='pickup_assigned'").bind(r.staff_id).run();
    await db.prepare("INSERT INTO sister_assignments(staff_id,job_id,shop_id,shop_name,options,manager,sent_by,status,message,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'choice_wait','초이스 후 O/X를 선택해 주세요.',datetime('now'),datetime('now'))").bind(r.staff_id,r.new_job_id,r.new_shop_id,r.new_shop_name||j.shop_name||'', '',BIG_MANAGER_KEY,BIG_MANAGER_KEY).run();
    await db.prepare("UPDATE test_reroute_flow SET status='accepted_confirmed',big_confirmed_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
  }
  await bump(db);return J({ok:true});
}
if(p==='/api/test-reroute/driver-ack'&&m==='POST'){
  const x=await B(req),id=Number(x.id);
  const r=await db.prepare("SELECT * FROM test_reroute_flow WHERE id=? AND status IN ('accepted_confirmed','rejected_confirmed')").bind(id).first();
  if(!r)return J({message:'확인할 큰실장 결정이 없습니다.'},404);
  if(String(r.assigned_manager||'')!==String(session.manager||''))return J({message:'현재 배정실장만 확인할 수 있습니다.'},403);
  await db.prepare("UPDATE test_reroute_flow SET driver_acknowledged_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/sister/work-report'&&m==='POST'){
  const x=await B(req),token=String(x.token||'').trim();
  const who=await db.prepare("SELECT sa.staff_id,s.name FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE sa.access_token=? AND sa.enabled=1").bind(token).first();
  if(!who||!['테스트1','테스트2'].includes(String(who.name||'').trim()))return J({message:'테스트 언니만 사용할 수 있습니다.'},403);
  const a=await db.prepare("SELECT * FROM sister_assignments WHERE staff_id=? ORDER BY id DESC LIMIT 1").bind(who.staff_id).first();
  if(!a||a.status!=='report_required')return J({message:'현재 전송할 정산내용이 없습니다.'},409);
  const t=Number(x.t_value||0),r=Number(x.r_value||0),yc=Number(x.yc_value||0);if([t,r,yc].some(v=>!Number.isFinite(v)||v<0))return J({message:'T, R, ㅇㅊ 값을 숫자로 입력해 주세요.'},400);
  await db.prepare("INSERT INTO sister_work_reports(staff_id,assignment_id,shop_name,t_value,r_value,yc_value,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending',datetime('now'),datetime('now')) ON CONFLICT DO NOTHING")
    .bind(who.staff_id,a.id,a.shop_name||'',t,r,yc).run();
  const existing=await db.prepare("SELECT id FROM sister_work_reports WHERE assignment_id=? ORDER BY id DESC LIMIT 1").bind(a.id).first();
  if(existing)await db.prepare("UPDATE sister_work_reports SET t_value=?,r_value=?,yc_value=?,shop_name=?,status='pending',updated_at=datetime('now') WHERE id=?").bind(t,r,yc,a.shop_name||'',existing.id).run();
  await db.prepare("UPDATE sister_assignments SET status='post_report',updated_at=datetime('now') WHERE id=?").bind(a.id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/test-settlement/review'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'테스트 큰실장만 처리할 수 있습니다.'},403);
  const x=await B(req),id=Number(x.id),mode=String(x.mode||'confirm');const r=await db.prepare("SELECT * FROM sister_work_reports WHERE id=? AND status='pending'").bind(id).first();if(!r)return J({message:'정산정보를 찾을 수 없습니다.'},404);
  const mt=mode==='edit'?Number(x.t_value):Number(r.t_value),mr=mode==='edit'?Number(x.r_value):Number(r.r_value),my=mode==='edit'?Number(x.yc_value):Number(r.yc_value);
  if([mt,mr,my].some(v=>!Number.isFinite(v)||v<0))return J({message:'수정값을 숫자로 입력해 주세요.'},400);
  await db.prepare("UPDATE sister_work_reports SET manager_t=?,manager_r=?,manager_yc=?,status='review',updated_at=datetime('now') WHERE id=?").bind(mt,mr,my,id).run();await bump(db);return J({ok:true});
}
if(p==='/api/test-settlement/agreed-edit'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'테스트 큰실장만 처리할 수 있습니다.'},403);
  const x=await B(req),id=Number(x.id),t=Number(x.t_value),r=Number(x.r_value),yc=Number(x.yc_value);if([t,r,yc].some(v=>!Number.isFinite(v)||v<0))return J({message:'협의값을 숫자로 입력해 주세요.'},400);
  await db.prepare("UPDATE sister_work_reports SET agreed_t=?,agreed_r=?,agreed_yc=?,updated_at=datetime('now') WHERE id=? AND status='review'").bind(t,r,yc,id).run();await bump(db);return J({ok:true});
}
if(p==='/api/test-settlement/final'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'테스트 큰실장만 처리할 수 있습니다.'},403);
  const x=await B(req),id=Number(x.id);await db.prepare("UPDATE sister_work_reports SET status='final',finalized_at=datetime('now'),updated_at=datetime('now') WHERE id=? AND status='review'").bind(id).run();await bump(db);return J({ok:true});
}

if(p==='/api/snapshot'){
// 공통 snapshot은 모든 실장이 계속 쓰는 핵심 데이터만 조회한다.
// 예전처럼 매 polling마다 manager_presence 초기 INSERT를 실행하지 않는다. heartbeat가 필요한 행을 만든다.
const [staff,shops,attendance,jobs,pickups,v,presence,archives]=await Promise.all([
  db.prepare("SELECT * FROM staff ORDER BY deleted,id DESC").all(),
  db.prepare("SELECT * FROM shops ORDER BY deleted,name").all(),
  db.prepare("SELECT a.*,s.name,s.affiliation,s.work_types FROM attendance a JOIN staff s ON s.id=a.staff_id WHERE a.status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') AND a.id=(SELECT a2.id FROM attendance a2 WHERE a2.staff_id=a.staff_id AND a2.status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') ORDER BY CASE a2.status WHEN '시간중' THEN 5 WHEN '초이스중' THEN 4 WHEN '대기' THEN 3 WHEN 'ㅈㅁ' THEN 2 WHEN '출근대기' THEN 1 ELSE 0 END DESC,a2.id DESC LIMIT 1) ORDER BY COALESCE(NULLIF(a.sequence,0),a.id),a.id").all(),
  db.prepare("SELECT j.*,s.name,s.affiliation,CASE WHEN j.status IN ('퇴근정산','정산완료') THEN COALESCE(j.shop_name_snapshot,sh.name) ELSE sh.name END shop_name,(SELECT sa.status FROM sister_assignments sa WHERE sa.job_id=j.id ORDER BY sa.id DESC LIMIT 1) sister_status,(SELECT sa.acknowledged_at FROM sister_assignments sa WHERE sa.job_id=j.id ORDER BY sa.id DESC LIMIT 1) sister_acknowledged_at FROM jobs j JOIN staff s ON s.id=j.staff_id JOIN shops sh ON sh.id=j.shop_id WHERE j.status IN ('초이스중','시간중','정산대기','퇴근정산') OR (j.day=date('now','+9 hours') AND j.status='정산완료') ORDER BY j.id").all(),
  db.prepare("SELECT p.*,s.name,s.affiliation,s.phone,sh.name shop_name FROM pickup_waiting p JOIN staff s ON s.id=p.staff_id LEFT JOIN shops sh ON sh.id=p.shop_id WHERE p.completed=0 ORDER BY p.id").all(),
  db.prepare("SELECT value FROM meta WHERE key='version'").first(),
  db.prepare("SELECT CASE manager WHEN 'colra1' THEN '실장A' WHEN 'chana' THEN '실장B' WHEN 'Chana' THEN '실장B' WHEN 'CHANA' THEN '실장B' WHEN 'ghana' THEN '실장B' WHEN 'Ghana' THEN '실장B' WHEN 'GHANA' THEN '실장B' WHEN 'remon' THEN '실장B' WHEN 'colra2' THEN '실장C' ELSE manager END manager,MAX(CASE WHEN (unixepoch('now')-unixepoch(last_seen))<=60 THEN 1 ELSE 0 END) online FROM manager_presence GROUP BY CASE manager WHEN 'colra1' THEN '실장A' WHEN 'chana' THEN '실장B' WHEN 'Chana' THEN '실장B' WHEN 'CHANA' THEN '실장B' WHEN 'ghana' THEN '실장B' WHEN 'Ghana' THEN '실장B' WHEN 'GHANA' THEN '실장B' WHEN 'remon' THEN '실장B' WHEN 'colra2' THEN '실장C' ELSE manager END ORDER BY manager").all(),
  db.prepare("SELECT * FROM settlement_archives WHERE day=date('now','+9 hours')").all()
]);
let assignedPickupFlows=[],assignedReroutes=[];
// 일반 실장은 자신에게 실제 배정된 테스트 픽업만 읽는다. 큰실장 전용 자료는 별도 API에서만 조회한다.
if(!isBigManager(session.manager)){
  const pf=await db.prepare("SELECT f.*,s.name,s.affiliation FROM test_pickup_flow f JOIN staff s ON s.id=f.staff_id WHERE f.assigned_manager=? AND f.status IN ('assigned','confirmed','rejected_confirmed') ORDER BY f.id").bind(session.manager).all();
  assignedPickupFlows=pf.results||[];
  const rr=await db.prepare("SELECT r.*,s.name,s.affiliation FROM test_reroute_flow r JOIN staff s ON s.id=r.staff_id WHERE r.assigned_manager=? AND r.status IN ('requested','accepted_confirmed','rejected_confirmed') ORDER BY r.id DESC LIMIT 20").bind(session.manager).all();
  assignedReroutes=rr.results||[];
}
return J({staff:staff.results,shops:shops.results,attendance:attendance.results,jobs:jobs.results,pickups:pickups.results,pickup_requests:[],sister_rejections:[],sister_settlement_messages:[],test_pickup_flows:assignedPickupFlows,test_reroute_flows:assignedReroutes,test_choice_results:[],test_settlement_pending:[],test_settlement_review:[],presence:presence.results,archives:archives.results,is_big_manager:isBigManager(session.manager),big_manager:BIG_MANAGER_KEY,version:+(v?.value||0)})}

if(p==='/api/big-manager/extras'){
  if(!isBigManager(session.manager))return J({message:'큰실장 전용 기능입니다.'},403);
  const [pickupRequests,sisterRejections,sm,pf,cr,sp,sr,rr,checkoutRequests,otherJobResponses]=await Promise.all([
    db.prepare("SELECT sa.id assignment_id,sa.staff_id,sa.job_id,sa.shop_name,sa.pickup_request_type,sa.pickup_requested_at,s.name,s.affiliation FROM sister_assignments sa JOIN staff s ON s.id=sa.staff_id WHERE sa.pickup_status='waiting' AND s.name NOT IN ('테스트1','테스트2') ORDER BY sa.id").all(),
    db.prepare("SELECT sa.id,sa.staff_id,sa.shop_name,sa.rejection_reason,sa.rejected_at,s.name FROM sister_assignments sa JOIN staff s ON s.id=sa.staff_id WHERE sa.status='choice_rejected' AND sa.rejected_at>=datetime('now','-1 day') ORDER BY sa.id DESC").all(),
    db.prepare("SELECT m.*,s.name,s.affiliation FROM sister_settlement_messages m JOIN staff s ON s.id=m.staff_id WHERE s.name IN ('테스트1','테스트2') ORDER BY m.id DESC LIMIT 100").all(),
    db.prepare("SELECT f.*,s.name,s.affiliation FROM test_pickup_flow f JOIN staff s ON s.id=f.staff_id WHERE f.status IN ('requested','assigned','driver_accepted','driver_rejected','confirmed','rejected_confirmed') ORDER BY f.id").all(),
    db.prepare("SELECT sa.id,sa.choice_result,sa.choice_result_at,sa.shop_name,s.name FROM sister_assignments sa JOIN staff s ON s.id=sa.staff_id WHERE s.name IN ('테스트1','테스트2') AND sa.choice_result_at>=datetime('now','-1 day') ORDER BY sa.id DESC LIMIT 30").all(),
    db.prepare("SELECT r.*,s.name,s.affiliation FROM sister_work_reports r JOIN staff s ON s.id=r.staff_id WHERE r.status='pending' ORDER BY r.id").all(),
    db.prepare("SELECT r.*,s.name,s.affiliation FROM sister_work_reports r JOIN staff s ON s.id=r.staff_id WHERE r.status='review' ORDER BY r.id DESC").all(),
    db.prepare("SELECT r.*,s.name,s.affiliation FROM test_reroute_flow r JOIN staff s ON s.id=r.staff_id WHERE r.status IN ('requested','driver_accepted','driver_rejected','accepted_confirmed','rejected_confirmed') ORDER BY r.id DESC LIMIT 30").all(),
    db.prepare("SELECT sa.id assignment_id,sa.staff_id,sa.checkout_requested_at,s.name,s.affiliation FROM sister_assignments sa JOIN staff s ON s.id=sa.staff_id WHERE sa.status='checkout_waiting' ORDER BY sa.checkout_requested_at,sa.id").all(),
    db.prepare("SELECT sa.id assignment_id,sa.staff_id,sa.status,sa.checkout_note,sa.other_job_response,sa.other_job_message,sa.other_job_responded_at,s.name,s.affiliation FROM sister_assignments sa JOIN staff s ON s.id=sa.staff_id WHERE sa.status IN ('post_report_other_ok','post_report_other_reject') AND sa.other_job_reviewed_at IS NULL ORDER BY sa.other_job_responded_at,sa.id").all()
  ]);
  return J({pickup_requests:pickupRequests.results||[],sister_rejections:sisterRejections.results||[],sister_settlement_messages:sm.results||[],test_pickup_flows:pf.results||[],test_choice_results:cr.results||[],test_settlement_pending:sp.results||[],test_settlement_review:sr.results||[],test_reroute_flows:rr.results||[],checkout_requests:checkoutRequests.results||[],other_job_responses:otherJobResponses.results||[],is_big_manager:true,big_manager:BIG_MANAGER_KEY})
}

if(p==='/api/sister/checkout-decision'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'큰실장 전용 기능입니다.'},403);
  const x=await B(req),id=Number(x.assignment_id||0),decision=String(x.decision||'').trim(),note=String(x.note||'').trim();
  const a=await db.prepare("SELECT * FROM sister_assignments WHERE id=? AND status='checkout_waiting'").bind(id).first();
  if(!a)return J({message:'처리할 퇴근 요청이 없습니다.'},404);
  if(decision==='goodbye'){
    const phrase='오늘도 정말 수고 많았어요 🌷 편안히 쉬고, 내일은 오늘보다 더 좋은 일과 행운이 꼭 찾아올 거예요 🍀✨';
    await db.prepare("UPDATE attendance SET status='퇴근' WHERE staff_id=? AND status IN ('대기','ㅈㅁ')").bind(a.staff_id).run();
    await db.prepare("UPDATE sister_assignments SET status='checkout_goodbye',checkout_note=?,checkout_decided_at=datetime('now'),auto_logout_at=datetime('now','+1 minute'),updated_at=datetime('now') WHERE id=?").bind(phrase,id).run();
  }else if(decision==='other_job'){
    if(!note)return J({message:'다른 일 내용을 메모해 주세요.'},400);
    await db.prepare("UPDATE sister_assignments SET status='post_report_other',checkout_note=?,checkout_decided_at=datetime('now'),auto_logout_at=NULL,other_job_response=NULL,other_job_message=NULL,other_job_responded_at=NULL,other_job_reviewed_at=NULL,updated_at=datetime('now') WHERE id=?").bind(note,id).run();
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='ㅈㅁ'").bind(await seq(db),a.staff_id).run();
  }else return J({message:'처리 방법을 선택해 주세요.'},400);
  await bump(db);return J({ok:true});
}
if(p==='/api/sister/other-job-review'&&m==='POST'){
  if(!isBigManager(session.manager))return J({message:'큰실장 전용 기능입니다.'},403);
  const x=await B(req),id=Number(x.assignment_id||0),decision=String(x.decision||'review').trim(),note=String(x.note||'').trim();
  const a=await db.prepare("SELECT * FROM sister_assignments WHERE id=? AND status IN ('post_report_other_ok','post_report_other_reject')").bind(id).first();
  if(!a)return J({message:'처리할 응답이 없습니다.'},404);
  if(decision==='review'){
    await db.prepare("UPDATE sister_assignments SET other_job_reviewed_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(id).run();
  }else if(decision==='resend'){
    if(!note)return J({message:'언니에게 다시 보낼 내용을 입력해 주세요.'},400);
    await db.prepare("UPDATE sister_assignments SET status='post_report_other',checkout_note=?,other_job_response=NULL,other_job_message=NULL,other_job_responded_at=NULL,other_job_reviewed_at=NULL,updated_at=datetime('now') WHERE id=?").bind(note,id).run();
  }else if(decision==='goodbye'){
    const phrase='오늘도 정말 수고 많았어요 🌷 편안히 쉬고, 내일은 오늘보다 더 좋은 일과 행운이 꼭 찾아올 거예요 🍀✨';
    await db.prepare("UPDATE attendance SET status='퇴근' WHERE staff_id=? AND status IN ('대기','ㅈㅁ')").bind(a.staff_id).run();
    await db.prepare("UPDATE sister_assignments SET status='checkout_goodbye',checkout_note=?,checkout_decided_at=datetime('now'),auto_logout_at=datetime('now','+1 minute'),other_job_reviewed_at=datetime('now'),updated_at=datetime('now') WHERE id=?").bind(phrase,id).run();
  }else return J({message:'처리 방법이 올바르지 않습니다.'},400);
  await bump(db);return J({ok:true});
}
if(p==='/api/presence/heartbeat'&&m==='POST'){
  const x=await B(req);
  const raw=String(x.manager||'').trim();
  const manager=({
    '실장A':'실장A','패밀리-가나':'실장A','가나':'실장A',
    '실장B':'실장B','패밀리-스마일':'실장B','스마일':'실장B',
    '실장C':'실장C','패밀리-구글':'실장C','구글':'실장C'
  })[raw]||raw;
  if(!['실장A','실장B','실장C'].includes(manager))return J({message:'실장 정보가 올바르지 않습니다.'},400);
  await db.prepare("INSERT INTO manager_presence(manager,last_seen) VALUES(?,datetime('now')) ON CONFLICT(manager) DO UPDATE SET last_seen=excluded.last_seen").bind(manager).run();
  const row=await db.prepare("SELECT manager,last_seen,1 online FROM manager_presence WHERE manager=?").bind(manager).first();
  return J({ok:true,presence:row});
}
if(p==='/api/presence/logout'&&m==='POST'){
  const x=await B(req);
  const raw=String(x.manager||'').trim();
  const manager=({
    '실장A':'실장A','패밀리-가나':'실장A','가나':'실장A',
    '실장B':'실장B','패밀리-스마일':'실장B','스마일':'실장B',
    '실장C':'실장C','패밀리-구글':'실장C','구글':'실장C'
  })[raw]||raw;
  await db.prepare("UPDATE manager_presence SET last_seen=datetime('now','-1 day') WHERE manager=?").bind(manager).run();
  return J({ok:true});
}
if(p==='/api/staff'&&m==='POST'){
  const x=await B(req);
  const name=String(x.name||'').trim();
  if(!name)return J({message:'이름을 입력해 주세요.'},400);

  const activeDup=await db.prepare("SELECT id FROM staff WHERE deleted=0 AND LOWER(TRIM(name))=LOWER(?) LIMIT 1").bind(name).first();
  if(activeDup)return J({message:'같은 이름이 있습니다.'},409);

  const deletedDup=await db.prepare("SELECT id FROM staff WHERE deleted=1 AND LOWER(TRIM(name))=LOWER(?) ORDER BY id DESC LIMIT 1").bind(name).first();
  if(deletedDup){
    await db.prepare("UPDATE staff SET affiliation=?,name=?,phone=?,work_types=?,memo=?,hourly=?,fee=?,deleted=0 WHERE id=?")
      .bind(x.affiliation,name,x.phone||'',x.work_types||'T',x.memo||'',x.hourly||40000,x.fee||8000,deletedDup.id).run();
    await bump(db);
    return J({ok:true,restored:true});
  }

  await db.prepare("INSERT INTO staff(affiliation,name,phone,work_types,memo,hourly,fee,deleted) VALUES(?,?,?,?,?,?,?,0)")
    .bind(x.affiliation,name,x.phone||'',x.work_types||'T',x.memo||'',x.hourly||40000,x.fee||8000).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/staff/update'&&m==='POST'){
  const x=await B(req);
  const id=Number(x.id);
  const name=String(x.name||'').trim();
  if(!id||!name)return J({message:'이름을 입력해 주세요.'},400);

  const activeDup=await db.prepare("SELECT id FROM staff WHERE id<>? AND deleted=0 AND LOWER(TRIM(name))=LOWER(?) LIMIT 1").bind(id,name).first();
  if(activeDup)return J({message:'같은 이름이 있습니다.'},409);

  await db.prepare("UPDATE staff SET affiliation=?,name=?,phone=?,work_types=?,memo=? WHERE id=?")
    .bind(String(x.affiliation||''),name,String(x.phone||''),String(x.work_types||'T'),String(x.memo||''),id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/shops'&&m==='POST'){
  const x=await B(req);
  const name=String(x.name||'').trim();
  if(!name)return J({message:'노래방명을 입력해 주세요.'},400);
  const duplicate=await db.prepare("SELECT id FROM shops WHERE LOWER(TRIM(name))=LOWER(?) LIMIT 1").bind(name).first();
  if(duplicate)return J({message:'같은 이름이 있습니다.'},409);
  await db.prepare("INSERT INTO shops(name,phone,memo,deleted) VALUES(?,?,?,0)")
    .bind(name,x.phone||'',x.memo||'').run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/attendance'&&m==='POST'){
  const x=await B(req);
  const staffId=Number(x.staff_id);
  if(!staffId)return J({message:'언니를 선택해 주세요.'},400);

  const existing=await db.prepare("SELECT id,status FROM attendance WHERE staff_id=? AND status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') ORDER BY CASE status WHEN '시간중' THEN 5 WHEN '초이스중' THEN 4 WHEN '대기' THEN 3 WHEN 'ㅈㅁ' THEN 2 WHEN '출근대기' THEN 1 ELSE 0 END DESC,id DESC LIMIT 1").bind(staffId).first();

  if(existing){
    if(existing.status==='초이스중'||existing.status==='시간중'){
      const hasJob=await db.prepare("SELECT id,status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY CASE status WHEN '시간중' THEN 2 WHEN '초이스중' THEN 1 ELSE 0 END DESC,id DESC LIMIT 1").bind(staffId).first();
      if(!hasJob){
        await db.prepare("UPDATE attendance SET status='대기',sequence=?,check_in_time=strftime('%H:%M','now','+9 hours'),manager=?,memo=COALESCE(NULLIF(?,''),memo) WHERE id=?")
          .bind(await seq(db),x.manager||'',x.memo||'',existing.id).run();
        await bump(db);
        return J({ok:true,recovered:true,message:'숨은 근무상태를 대기목록으로 복구했습니다.'});
      }
      return J({message:'이미 초이스 또는 일중 상태입니다.'},400);
    }

    if(existing.status==='대기'){
      await db.prepare("UPDATE attendance SET sequence=?,manager=?,memo=COALESCE(NULLIF(?,''),memo) WHERE id=?")
        .bind(await seq(db),x.manager||'',x.memo||'',existing.id).run();
      await bump(db);
      return J({ok:true,reordered:true,message:'이미 대기 상태라 대기목록 아래쪽으로 다시 정렬했습니다.'});
    }

    return J({message:'이미 출근대기 또는 ㅈㅁ 목록에 등록되어 있습니다.'},400);
  }

  const directActive=Boolean(x.direct_active);
  const initialStatus=directActive?'대기':'출근대기';
  await db.prepare("INSERT INTO attendance(day,staff_id,sequence,check_in_time,status,manager,memo) VALUES(?,?,?,strftime('%H:%M','now','+9 hours'),?,?,?)")
    .bind(kstBusinessDay(),staffId,await seq(db),initialStatus,x.manager||'',x.memo||'').run();
  await bump(db);
  return J({ok:true,direct_active:directActive});
}
if(p==='/api/attendance/pickup-request'&&m==='POST'){
  const x=await B(req),id=Number(x.id),manager=String(x.manager||'').trim();
  if(!id||!manager)return J({message:'배당 실장을 선택해 주세요.'},400);
  const row=await db.prepare("SELECT id FROM attendance WHERE id=? AND status='출근대기'").bind(id).first();
  if(!row)return J({message:'출근대기 건을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE attendance SET manager=?,memo=TRIM(COALESCE(memo,'') || ' · 픽업배당 ' || ?) WHERE id=?").bind(manager,manager,id).run();
  await bump(db);
  return J({ok:true,manager});
}
if(p==='/api/attendance/activate'&&m==='POST'){
  const x=await B(req);
  const row=await db.prepare("SELECT * FROM attendance WHERE id=? AND status='출근대기'").bind(x.id).first();
  if(!row)return J({message:'출근대기 건을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE attendance SET status='대기',check_in_time=strftime('%H:%M','now','+9 hours'),sequence=?,manager=? WHERE id=?")
    .bind(await seq(db),x.manager||row.manager||'',x.id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/attendance/delete-waiting'&&m==='POST'){
  const x=await B(req);
  const row=await db.prepare("SELECT id FROM attendance WHERE id=? AND status='대기'").bind(x.id).first();
  if(!row)return J({message:'대기 건을 찾을 수 없습니다.'},404);
  await db.prepare("DELETE FROM attendance WHERE id=? AND status='대기'").bind(x.id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/attendance/cancel'&&m==='POST'){
  const x=await B(req);
  await db.prepare("DELETE FROM attendance WHERE id=? AND status='출근대기'").bind(x.id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/attendance/jm'&&m==='POST'){
  const x=await B(req);
  const row=await db.prepare("SELECT id FROM attendance WHERE id=? AND status='출근대기'").bind(x.id).first();
  if(!row)return J({message:'출근대기 건을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE attendance SET status='ㅈㅁ' WHERE id=?").bind(x.id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/attendance/jm-to-waiting'&&m==='POST'){
  const x=await B(req);
  const row=await db.prepare("SELECT id FROM attendance WHERE id=? AND status='ㅈㅁ'").bind(x.id).first();
  if(!row)return J({message:'ㅈㅁ 건을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE attendance SET status='대기',check_in_time=strftime('%H:%M','now','+9 hours'),sequence=? WHERE id=?")
    .bind(await seq(db),x.id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/attendance/jm-to-pending'&&m==='POST'){
  const x=await B(req);
  const a=await db.prepare("SELECT a.*,s.name staff_name,s.affiliation staff_affiliation FROM attendance a JOIN staff s ON s.id=a.staff_id WHERE a.id=? AND a.status='ㅈㅁ'").bind(x.id).first();
  if(!a)return J({message:'ㅈㅁ 건을 찾을 수 없습니다.'},404);
  const info=String(x.received_info||'').trim();
  if(!info)return J({message:'타임, Room, ㅇㅊ 중 선택값을 입력해 주세요.'},400);

  let shop=await db.prepare("SELECT id FROM shops WHERE name='ㅈㅁ' LIMIT 1").first();
  if(!shop){
    const created=await db.prepare("INSERT INTO shops(name,phone,memo,deleted) VALUES('ㅈㅁ','','자동생성',0)").run();
    shop={id:created.meta.last_row_id};
  }

  const created=await db.prepare("INSERT INTO jobs(day,staff_id,shop_id,status,choice_at,choice_time,start_at,start_time,end_at,end_time,received_at,received_time,received_info,duration_units,manager,total,staff_pay) VALUES(?,?,?,'정산대기',datetime('now'),strftime('%H:%M','now','+9 hours'),datetime('now'),COALESCE(NULLIF(?,''),strftime('%H:%M','now','+9 hours')),datetime('now'),strftime('%H:%M','now','+9 hours'),datetime('now'),strftime('%H:%M','now','+9 hours'),?,1,?,0,0)")
    .bind(a.day||kstBusinessDay(),a.staff_id,shop.id,a.check_in_time||'',info,x.manager||'').run();
  const jobId=Number(created?.meta?.last_row_id||0);

  try{
    await db.prepare("INSERT OR IGNORE INTO work_logs(day,job_id,staff_id,staff_name,staff_affiliation,shop_id,shop_name,manager,start_at,start_time,end_at,end_time,elapsed_minutes,received_info,created_at) VALUES(?,?,?,?,?,?, 'ㅈㅁ',?,datetime('now'),COALESCE(NULLIF(?,''),strftime('%H:%M','now','+9 hours')),datetime('now'),strftime('%H:%M','now','+9 hours'),0,?,datetime('now'))")
      .bind(a.day||kstBusinessDay(),jobId,a.staff_id,a.staff_name,a.staff_affiliation,shop.id,x.manager||'',a.check_in_time||'',info).run();
  }catch(e){
    console.log('jm work_logs save skipped',e?.message||e);
  }

  await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE id=?")
    .bind(await seq(db),x.id).run();

  await bump(db);
  return J({ok:true,job_id:jobId});
}
if(p==='/api/attendance/checkout'&&m==='POST'){
  const x=await B(req),staffId=Number(x.staff_id);
  if(!staffId)return J({message:'언니 정보가 올바르지 않습니다.'},400);
  const activeJob=await db.prepare("SELECT id,status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') LIMIT 1").bind(staffId).first();
  if(activeJob)return J({message:'초이스 또는 일중인 언니는 먼저 해당 업무를 정리해 주세요.'},400);
  const r=await db.prepare("UPDATE attendance SET status='퇴근' WHERE staff_id=? AND status IN ('출근대기','대기','ㅈㅁ')").bind(staffId).run();
  if(!Number(r?.meta?.changes||0))return J({message:'퇴근 처리할 출근 상태를 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE sister_assignments SET status='closed',pickup_status=CASE WHEN pickup_status IN ('waiting','assigned') THEN 'completed' ELSE pickup_status END,updated_at=datetime('now') WHERE staff_id=? AND status NOT IN ('closed','replaced','choice_x')").bind(staffId).run();
  await db.prepare("UPDATE sister_access SET session_version=COALESCE(session_version,1)+1 WHERE staff_id=?").bind(staffId).run();
  await bump(db);return J({ok:true,forced_logout:true});
}
if(p==='/api/choice/start-multiple'&&m==='POST'){
  const x=await B(req),ids=[...new Set((Array.isArray(x.attendance_ids)?x.attendance_ids:[]).map(Number).filter(Boolean))],shopId=Number(x.shop_id);
  if(ids.length<2||!shopId)return J({message:'다중초이스 정보를 확인해 주세요.'},400);
  const marks=ids.map(()=>'?').join(',');
  const rows=(await db.prepare(`SELECT * FROM attendance WHERE id IN (${marks}) ORDER BY sequence,id`).bind(...ids).all()).results||[];
  if(rows.length!==ids.length||rows.some(a=>a.status!=='대기'))return J({message:'선택한 인원 중 대기 상태가 아닌 인원이 있습니다. 새로고침 후 다시 선택해 주세요.'},409);
  for(const a of rows){const active=await db.prepare("SELECT id FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') LIMIT 1").bind(a.staff_id).first();if(active)return J({message:'선택한 인원 중 이미 초이스 또는 일중인 인원이 있습니다.'},409)}
  const groupId=crypto.randomUUID();
  const day=kstBusinessDay();
  const statements=[];
  for(const a of rows){
    statements.push(db.prepare("UPDATE attendance SET status='초이스중' WHERE id=? AND status='대기'").bind(a.id));
    statements.push(db.prepare("INSERT INTO jobs(day,staff_id,shop_id,status,choice_at,choice_time,manager,total,staff_pay,choice_group_id) VALUES(?,?,?,'초이스중',datetime('now'),strftime('%H:%M','now','+9 hours'),?,0,0,?)").bind(day,a.staff_id,shopId,x.manager||session.manager||'',groupId));
  }
  statements.push(db.prepare("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='version'"));
  await db.batch(statements);
  return J({ok:true,group_id:groupId,count:rows.length});
}
if(p==='/api/choice/start'&&m==='POST'){
  const x=await B(req);
  const attendanceId=Number(x.attendance_id);
  const shopId=Number(x.shop_id);
  if(!attendanceId||!shopId)return J({message:'초이스 정보가 올바르지 않습니다.'},400);

  const a=await db.prepare("SELECT * FROM attendance WHERE id=?").bind(attendanceId).first();
  if(!a)return J({message:'대기 건을 찾을 수 없습니다.'},404);
  if(a.status!=='대기')return J({message:'이미 대기목록에서 이동된 건입니다. 화면을 새로고침합니다.'},400);

  let reroutePickup=null;
  if(isBigManager(session.manager)){
    const sister=await db.prepare("SELECT name FROM staff WHERE id=?").bind(a.staff_id).first();
    if(['테스트1','테스트2'].includes(String(sister?.name||'').trim()))reroutePickup=await db.prepare("SELECT * FROM pickup_waiting WHERE staff_id=? AND completed=0 AND COALESCE(manager,'')<>'' ORDER BY id DESC LIMIT 1").bind(a.staff_id).first();
  }

  const already=await db.prepare("SELECT id,status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY id DESC LIMIT 1").bind(a.staff_id).first();
  if(already)return J({message:'이미 초이스 또는 일중 상태입니다.'},400);

  const updated=await db.prepare("UPDATE attendance SET status='초이스중' WHERE id=? AND status='대기'").bind(a.id).run();
  if(!Number(updated?.meta?.changes||0))return J({message:'이미 대기목록에서 이동된 건입니다. 화면을 새로고침합니다.'},400);

  const dup=await db.prepare("SELECT id FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중') ORDER BY id DESC LIMIT 1").bind(a.staff_id).first();
  if(dup){
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE id=?").bind(await seq(db),a.id).run();
    await bump(db);
    return J({message:'이미 초이스 또는 일중 상태입니다.'},400);
  }

  let createdJob=null;
  try{
    createdJob=await db.prepare("INSERT INTO jobs(day,staff_id,shop_id,status,choice_at,choice_time,manager,total,staff_pay) VALUES(?, ?,?,'초이스중',datetime('now'),strftime('%H:%M','now','+9 hours'),?,0,0) RETURNING id,staff_id,shop_id,status")
      .bind(a.day||kstBusinessDay(),a.staff_id,shopId,x.manager||'').first();
  }catch(e){
    await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE id=? AND status='초이스중'").bind(await seq(db),a.id).run();
    if(String(e?.message||e).toLowerCase().includes('unique'))return J({message:'이미 다른 실장이 초이스 처리했습니다. 화면을 새로고침합니다.'},409);
    throw e;
  }
  const createdJobId=Number(createdJob?.id||0);
  let reroutePending=false;
  if(createdJobId&&reroutePickup){
    const sh=await db.prepare("SELECT name FROM shops WHERE id=?").bind(shopId).first();
    await db.prepare("INSERT INTO test_reroute_flow(staff_id,old_pickup_id,new_job_id,new_shop_id,new_shop_name,assigned_manager,big_manager,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'requested',datetime('now'),datetime('now')) ON CONFLICT(new_job_id) DO UPDATE SET old_pickup_id=excluded.old_pickup_id,new_shop_id=excluded.new_shop_id,new_shop_name=excluded.new_shop_name,assigned_manager=excluded.assigned_manager,big_manager=excluded.big_manager,status='requested',driver_response=NULL,reject_reason=NULL,driver_message=NULL,driver_responded_at=NULL,big_confirmed_at=NULL,driver_acknowledged_at=NULL,updated_at=datetime('now')").bind(a.staff_id,Number(reroutePickup.id),createdJobId,shopId,sh?.name||'',String(reroutePickup.manager||''),BIG_MANAGER_KEY).run();
    reroutePending=true;
  }
  // 실장이 초이스를 확정한 즉시 언니앱에 현재 초이스를 노출한다.
  // 옵션 전송 팝업이 늦게 열리거나 닫혀도 수신확인 화면 자체는 먼저 떠야 한다.
  if(createdJobId){
    const sisterAccess=await db.prepare("SELECT sa.staff_id,s.name FROM sister_access sa JOIN staff s ON s.id=sa.staff_id WHERE sa.staff_id=? AND sa.enabled=1 LIMIT 1").bind(a.staff_id).first();
    if(sisterAccess&&!['테스트1','테스트2'].includes(String(sisterAccess.name||'').trim())){
      const shop=await db.prepare("SELECT name FROM shops WHERE id=?").bind(shopId).first();
      await db.prepare("UPDATE sister_assignments SET status='replaced',updated_at=datetime('now') WHERE staff_id=? AND status IN ('choice_wait','working','end10')").bind(a.staff_id).run();
      await db.prepare("INSERT INTO sister_assignments(staff_id,job_id,shop_id,shop_name,options,manager,sent_by,status,message,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'choice_wait','초이스 후 눌러주세요.',datetime('now'),datetime('now'))")
        .bind(a.staff_id,createdJobId,shopId,shop?.name||'', '', x.manager||'', x.manager||'').run();
    }
  }
  await bump(db);
  return J({ok:true,job_id:createdJobId,staff_id:Number(a.staff_id),shop_id:shopId,reroute_pending:reroutePending});
}
if(p==='/api/choice/return'&&m==='POST'){
  const x=await B(req);
  const j=await db.prepare("SELECT * FROM jobs WHERE id=? AND status='초이스중'").bind(x.id).first();
  if(!j)return J({message:'초이스 건을 찾을 수 없습니다.'},404);

  await db.prepare("DELETE FROM jobs WHERE id=?").bind(x.id).run();

  await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='초이스중'")
    .bind(await seq(db),j.staff_id).run();

  await bump(db);
  return J({ok:true});
}
if(p==='/api/choice/pass'&&m==='POST'){
  const x=await B(req),id=Number(x.id);
  if(!id)return J({message:'초이스 정보가 올바르지 않습니다.'},400);
  const j=await db.prepare("SELECT * FROM jobs WHERE id=? AND status='초이스중'").bind(id).first();
  if(!j)return J({message:'이미 통과 처리되었거나 초이스 건을 찾을 수 없습니다.'},400);
  const updated=await db.prepare("UPDATE jobs SET status='시간중',start_at=datetime('now'),start_time=strftime('%H:%M','now','+9 hours') WHERE id=? AND status='초이스중'").bind(id).run();
  if(!Number(updated?.meta?.changes||0))return J({message:'이미 처리된 초이스 건입니다.'},400);
  const attendance=await db.prepare("UPDATE attendance SET status='시간중' WHERE staff_id=? AND status='초이스중'").bind(j.staff_id).run();
  if(!Number(attendance?.meta?.changes||0)){
    await db.prepare("UPDATE jobs SET status='초이스중',start_at=NULL,start_time=NULL WHERE id=? AND status='시간중'").bind(id).run();
    return J({message:'출근 상태가 변경되어 통과 처리하지 못했습니다. 화면을 새로고침해 주세요.'},409);
  }
  await db.prepare("UPDATE sister_assignments SET acknowledged_at=COALESCE(acknowledged_at,datetime('now')),choice_result='O',choice_result_at=COALESCE(choice_result_at,datetime('now')),status='working',updated_at=datetime('now') WHERE job_id=? AND staff_id=? AND status='choice_wait'").bind(id,j.staff_id).run();
  await bump(db);return J({ok:true});
}

if(p==='/api/work-logs/search'){
  if(!isBigManager(session.manager))return J({message:'실장 권한이 필요합니다.'},403);
  const staff=String(u.searchParams.get('staff')||'').trim();
  const shop=String(u.searchParams.get('shop')||'').trim();
  const inputStartDate=String(u.searchParams.get('start_date')||'').trim();
  const inputEndDate=String(u.searchParams.get('end_date')||'').trim();
  const hasDate=!!(inputStartDate||inputEndDate);
  const startDate=inputStartDate||inputEndDate;
  const endDate=inputEndDate||inputStartDate;
  const allowed=[3,7,14,30];
  const days=allowed.includes(Number(u.searchParams.get('days')))?Number(u.searchParams.get('days')):3;
  if(!staff&&!shop&&!hasDate)return J({message:'이름, 노래방, 날짜선택 중 한 가지 이상 입력해 주세요.'},400);
  if(startDate&&endDate&&startDate>endDate)return J({message:'시작일이 종료일보다 늦을 수 없습니다.'},400);
  const where=[];
  const binds=[];
  if(hasDate){
    if(startDate){where.push('date(wl.day)>=date(?)');binds.push(startDate)}
    if(endDate){where.push('date(wl.day)<=date(?)');binds.push(endDate)}
  }else{
    where.push("date(wl.day)>=date('now','+9 hours',?)");
    binds.push(`-${days-1} days`);
  }
  if(staff){where.push('TRIM(wl.staff_name) LIKE ?');binds.push(`%${staff}%`)}
  if(shop){where.push('TRIM(wl.shop_name) LIKE ?');binds.push(`%${shop}%`)}
  const sql=`SELECT wl.id,wl.day,wl.staff_name,wl.staff_affiliation,wl.shop_name,wl.start_time,wl.end_time,wl.elapsed_minutes,wl.received_info,wl.manager FROM work_logs wl WHERE ${where.join(' AND ')} ORDER BY wl.day DESC,COALESCE(wl.end_at,wl.created_at) DESC,wl.id DESC LIMIT 300`;
  const rows=await db.prepare(sql).bind(...binds).all();
  return J({ok:true,days,start_date:startDate,end_date:endDate,items:rows.results||[]});
}

if(p==='/api/work-logs/today'){
  try{
    const requested=String(u.searchParams.get('day')||'').trim();
    const active=await db.prepare("SELECT COUNT(*) cnt FROM attendance WHERE status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ')").first();
    const activeCount=Number(active?.cnt||0),hour=kstHour(),calendarDay=kstCalendarDay();
    const qday=requested||(hour>=17?calendarDay:(activeCount>0?kstBusinessDay():calendarDay));
    const previous_day=previousDay(qday);
    async function buildDay(day){
      const hidden=await db.prepare("SELECT hidden_through_id FROM work_log_hidden_days WHERE day=?").bind(day).first();
      const hiddenThrough=Number(hidden?.hidden_through_id||0);
      const rows=await db.prepare(`SELECT wl.id,wl.day,wl.job_id,wl.staff_id,wl.staff_name,wl.staff_affiliation,wl.shop_id,wl.shop_name,wl.manager,wl.start_at,wl.start_time,wl.end_at,wl.end_time,wl.elapsed_minutes,wl.received_info,wl.created_at FROM work_logs wl WHERE wl.day=? AND wl.id>? ORDER BY staff_affiliation,staff_name,start_at,job_id`).bind(day,hiddenThrough).all();
      const groupsMap=new Map();
      for(const x of rows.results||[]){
        const key=String(x.staff_id);
        if(!groupsMap.has(key))groupsMap.set(key,{staff_id:x.staff_id,staff_name:x.staff_name,staff_label:[x.staff_affiliation,x.staff_name].filter(Boolean).join(' '),items:[],job_count:0,total_minutes:0});
        const g=groupsMap.get(key),declared=declaredWorkMinutes(x.received_info||'');
        x.actual_minutes=Number(x.elapsed_minutes||0);x.counted_minutes=declared>0?declared:x.actual_minutes;
        g.items.push(x);g.job_count++;g.total_minutes+=Number(x.counted_minutes||0);
      }
      const groups=[...groupsMap.values()];
      return {day,items:rows.results||[],groups,totals:{staff_count:groups.length,job_count:(rows.results||[]).length,total_minutes:(rows.results||[]).reduce((a,x)=>a+Number(x.counted_minutes||0),0)}};
    }
    const current=await buildDay(qday),previous=await buildDay(previous_day);
    return J({ok:true,...current,previous:previous.items.length?previous:null,should_collapse:hour<17&&activeCount===0,business_window:'17:00~다음날 09:00'});
  }catch(e){return J({ok:false,message:'오늘 일한현황 조회 오류: '+(e?.message||'SQL 확인 필요'),items:[],groups:[],totals:{staff_count:0,job_count:0,total_minutes:0}},200)}
}

if(p==='/api/work-logs/delete-all'&&m==='POST'){
  const x=await B(req);
  const day=String(x.day||kstBusinessDay()).trim();
  const visible=await db.prepare(`SELECT wl.* FROM work_logs wl LEFT JOIN work_log_hidden_days h ON h.day=wl.day WHERE wl.day=? AND wl.id>COALESCE(h.hidden_through_id,0) ORDER BY wl.id`).bind(day).all();
  const items=visible.results||[];
  if(items.length){
    const maxId=Math.max(...items.map(v=>Number(v.id||0)));
    await db.prepare("INSERT INTO work_log_hidden_days(day,hidden_through_id,hidden_by,hidden_at) VALUES(?,?,?,datetime('now')) ON CONFLICT(day) DO UPDATE SET hidden_through_id=MAX(work_log_hidden_days.hidden_through_id,excluded.hidden_through_id),hidden_by=excluded.hidden_by,hidden_at=excluded.hidden_at")
      .bind(day,maxId,x.manager||'').run();
    await bump(db);
  }
  return J({ok:true,hidden:items.length,day,db_deleted:false});
}

if(p==='/api/work-logs/delete-item'&&m==='POST'){
  const x=await B(req);
  const id=Number(x.id||0),jobId=Number(x.job_id||0);
  const requestedStaffName=String(x.staff_name||'').trim();
  if(!id&&!jobId)return J({message:'삭제할 일한현황 정보가 없습니다.'},400);

  const target=id
    ? await db.prepare("SELECT id,job_id,staff_name FROM work_logs WHERE id=? LIMIT 1").bind(id).first()
    : await db.prepare("SELECT id,job_id,staff_name FROM work_logs WHERE job_id=? ORDER BY id DESC LIMIT 1").bind(jobId).first();
  if(!target)return J({message:'이미 삭제되었거나 해당 기록을 찾을 수 없습니다.'},404);

  const storedStaffName=String(target.staff_name||'').trim();
  if(storedStaffName!=='패밀리 테스트' || (requestedStaffName && requestedStaffName!=='패밀리 테스트')){
    return J({message:'패밀리 테스트 기록만 완전 삭제할 수 있습니다.'},403);
  }

  const targetJobId=Number(target.job_id||jobId||0);
  const r=targetJobId
    ? await db.prepare("DELETE FROM work_logs WHERE job_id=? AND TRIM(staff_name)='패밀리 테스트'").bind(targetJobId).run()
    : await db.prepare("DELETE FROM work_logs WHERE id=? AND TRIM(staff_name)='패밀리 테스트'").bind(Number(target.id)).run();
  const deleted=Number(r?.meta?.changes||0);
  if(!deleted)return J({message:'삭제되지 않았습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.'},409);
  await bump(db);
  return J({ok:true,deleted,db_deleted:true,archived:false});
}

if(p==='/api/work-logs/update-info'&&m==='POST'){
  const x=await B(req);
  const info=String(x.received_info||'').trim();
  const id=Number(x.id||0);
  const jobId=Number(x.job_id||0);
  if(!info)return J({message:'수정할 선택값이 없습니다.'},400);
  if(!id&&!jobId)return J({message:'수정할 일한현황 정보가 없습니다.'},400);

  let changed=0;
  if(id){
    const r=await db.prepare("UPDATE work_logs SET received_info=?,manager=COALESCE(NULLIF(?,''),manager) WHERE id=?")
      .bind(info,x.manager||'',id).run();
    changed+=Number(r?.meta?.changes||0);
  }
  if(!changed&&jobId){
    const r=await db.prepare("UPDATE work_logs SET received_info=?,manager=COALESCE(NULLIF(?,''),manager) WHERE job_id=?")
      .bind(info,x.manager||'',jobId).run();
    changed+=Number(r?.meta?.changes||0);
  }
  if(!changed&&jobId){
    const j=await db.prepare("SELECT j.*,s.name staff_name,s.affiliation staff_affiliation,sh.name shop_name FROM jobs j JOIN staff s ON s.id=j.staff_id LEFT JOIN shops sh ON sh.id=j.shop_id WHERE j.id=?").bind(jobId).first();
    if(j){
      const stMs=new Date(String(j.start_at||new Date().toISOString()).replace(' ','T')+'Z').getTime();
      const elapsed=Math.max(0,Math.floor((Date.now()-stMs)/60000));
      await db.prepare("INSERT OR IGNORE INTO work_logs(day,job_id,staff_id,staff_name,staff_affiliation,shop_id,shop_name,manager,start_at,start_time,end_at,end_time,elapsed_minutes,received_info,created_at) VALUES(?,?,?,?,?,?,?,?, ?,?,datetime('now'),strftime('%H:%M','now','+9 hours'),?,?,datetime('now'))")
        .bind(j.day||kstBusinessDay(),j.id,j.staff_id,j.staff_name,j.staff_affiliation,j.shop_id,j.shop_name,x.manager||j.manager||'',j.start_at,j.start_time,elapsed,info).run();
      changed=1;
    }
  }
  await bump(db);
  return J({ok:true,changed});
}

if(p==='/api/jobs/finish'&&m==='POST'){
 const x=await B(req),j=await db.prepare("SELECT * FROM jobs WHERE id=? AND status='시간중'").bind(x.id).first();
 if(!j)return J({message:'이미 일끝 처리되었거나 일중 건을 찾을 수 없습니다.'},400);
 const hours=Number(x.worked_hours||0);
 if(!Number.isFinite(hours)||hours<0.5||hours>24)return J({message:'일한 시간을 0.5~24시간 사이로 입력해 주세요.'},400);
 const units=Math.round(hours*2);
 const info=`일한시간 ${hours}시간`;

 await db.prepare("UPDATE attendance SET status='대기',sequence=? WHERE staff_id=? AND status='시간중'")
   .bind(await seq(db),j.staff_id).run();

 try{
   const elapsed=Math.round(hours*60);
   await db.prepare("INSERT OR IGNORE INTO work_logs(day,job_id,staff_id,staff_name,staff_affiliation,shop_id,shop_name,manager,start_at,start_time,end_at,end_time,elapsed_minutes,received_info,created_at) SELECT COALESCE(j.day,?),j.id,j.staff_id,s.name,s.affiliation,j.shop_id,sh.name,?,j.start_at,j.start_time,datetime('now'),strftime('%H:%M','now','+9 hours'),?,?,datetime('now') FROM jobs j JOIN staff s ON s.id=j.staff_id LEFT JOIN shops sh ON sh.id=j.shop_id WHERE j.id=?")
     .bind(kstBusinessDay(),x.manager||'',elapsed,info,j.id).run();
   await db.prepare("UPDATE work_logs SET manager=COALESCE(NULLIF(?,''),manager),end_at=datetime('now'),end_time=strftime('%H:%M','now','+9 hours'),elapsed_minutes=?,received_info=? WHERE job_id=?")
     .bind(x.manager||'',elapsed,info,j.id).run();
 }catch(e){console.log('work_logs save skipped',e?.message||e)}

 await db.prepare("UPDATE jobs SET status='정산대기',end_at=datetime('now'),end_time=strftime('%H:%M','now','+9 hours'),received_at=datetime('now'),received_time=strftime('%H:%M','now','+9 hours'),received_info=?,duration_units=?,manager=? WHERE id=?")
   .bind(info,units,x.manager||'',x.id).run();

 await bump(db);
 return J({ok:true,worked_hours:hours,settlement_enabled:false});
}
if(p==='/api/pickup/returning'&&m==='POST'){
  const x=await B(req);
  const id=Number(x.id);
  if(!id)return J({message:'픽업대기 정보가 올바르지 않습니다.'},400);
  const row=await db.prepare("SELECT id FROM pickup_waiting WHERE id=? AND completed=0").bind(id).first();
  if(!row)return J({message:'픽업대기 건을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE pickup_waiting SET returning_at=datetime('now') WHERE id=?").bind(id).run();const pw=await db.prepare("SELECT staff_id,job_id FROM pickup_waiting WHERE id=?").bind(id).first();if(pw)await db.prepare("UPDATE sister_assignments SET pickup_status='picked',updated_at=datetime('now') WHERE staff_id=? AND job_id=? AND pickup_status='assigned'").bind(pw.staff_id,pw.job_id).run();
  await bump(db);return J({ok:true});
}
if(p==='/api/pickup/complete'&&m==='POST'){
  const x=await B(req);
  const row=await db.prepare("SELECT id,staff_id,job_id FROM pickup_waiting WHERE id=? AND completed=0").bind(x.id).first();
  if(!row)return J({message:'픽업대기 건을 찾을 수 없습니다.'},404);
  await db.prepare("UPDATE pickup_waiting SET completed=1,completed_at=datetime('now') WHERE id=?").bind(x.id).run();
  const st=await db.prepare("SELECT name FROM staff WHERE id=?").bind(row.staff_id).first();
  if(['테스트1','테스트2'].includes(String(st?.name||'').trim())){
    await db.prepare("UPDATE sister_assignments SET status='report_required',pickup_status='completed',updated_at=datetime('now') WHERE id=(SELECT id FROM sister_assignments WHERE staff_id=? AND (job_id=? OR ? IS NULL) ORDER BY id DESC LIMIT 1)").bind(row.staff_id,row.job_id,row.job_id).run();
  }else{
    await db.prepare("UPDATE sister_assignments SET status='closed',pickup_status='completed',updated_at=datetime('now') WHERE staff_id=? AND (job_id=? OR ? IS NULL) AND pickup_status IN ('waiting','assigned')").bind(row.staff_id,row.job_id,row.job_id).run();
  }
  await bump(db);return J({ok:true});
}
if(p==='/api/jobs/settle'&&m==='POST'){
 const x=await B(req),j=await db.prepare("SELECT * FROM jobs WHERE id=?").bind(x.id).first();if(!j)return J({message:'정산대기 건을 찾을 수 없습니다.'},404);
 const total=Number(x.total_amount||0),hold=Number(x.hold_amount||0),managerHold=Number(x.manager_hold||0),receivable=Number(x.shop_receivable||0),commission=Number(x.commission_fee||0),sisterReceivable=commission,other=Number(x.other_amount||0),balance=Math.max(0,managerHold-commission);
 const shop=await db.prepare("SELECT name FROM shops WHERE id=?").bind(j.shop_id).first();
 await db.prepare("UPDATE jobs SET status='퇴근정산',shop_name_snapshot=?,total=?,hold_amount=?,manager_hold=?,shop_receivable=?,commission_fee=?,sister_receivable=?,other_label=?,other_amount=?,balance_amount=?,settlement_memo=?,manager=? WHERE id=?").bind(shop?.name||'',total,hold,managerHold,receivable,commission,sisterReceivable,x.other_label||'기타',other,balance,x.memo||'',x.manager||'',x.id).run();
 await bump(db);return J({ok:true});
}
if(p==='/api/jobs/reopen'&&m==='POST'){
  const x=await B(req);
  const job=await db.prepare("SELECT id,status FROM jobs WHERE id=?").bind(x.id).first();
  if(!job)return J({message:'정산 건을 찾을 수 없습니다.'},404);
  if(!['퇴근정산','정산완료'].includes(job.status))return J({message:'이미 정산대기 상태이거나 수정할 수 없는 건입니다.'},400);
  await db.prepare("UPDATE jobs SET status='정산대기' WHERE id=?").bind(x.id).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/shops/update'&&m==='POST'){
  const x=await B(req);
  const id=Number(x.id);
  const name=String(x.name||'').trim();
  if(!id||!name)return J({message:'노래방명은 반드시 입력해야 합니다.'},400);

  const current=await db.prepare("SELECT * FROM shops WHERE id=?").bind(id).first();
  if(!current)return J({message:'노래방 정보를 찾을 수 없습니다.'},404);

  // 이미 정산완료된 건은 수정 전 노래방명을 고정 보관
  await db.prepare("UPDATE jobs SET shop_name_snapshot=? WHERE shop_id=? AND status IN ('퇴근정산','정산완료') AND (shop_name_snapshot IS NULL OR shop_name_snapshot='')")
    .bind(current.name,id).run();

  // 노래방 마스터 수정. 초이스/일중/정산대기는 shop_id로 연결되어 새 이름이 자동 반영됨.
  await db.prepare("UPDATE shops SET name=?,phone=?,memo=? WHERE id=?")
    .bind(name,String(x.phone||''),String(x.memo||''),id).run();

  await bump(db);
  return J({ok:true});
}
if(p==='/api/staff/delete'&&m==='POST'){
  const x=await B(req);
  const staffId=Number(x.id);
  if(!staffId)return J({message:'언니 정보가 올바르지 않습니다.'},400);

  const active=await db.prepare("SELECT status FROM attendance WHERE staff_id=? AND status IN ('출근대기','대기','초이스중','시간중','ㅈㅁ') LIMIT 1").bind(staffId).first();
  const activeJob=await db.prepare("SELECT status FROM jobs WHERE staff_id=? AND status IN ('초이스중','시간중','정산대기','퇴근정산') LIMIT 1").bind(staffId).first();

  if(active||activeJob){
    const statusMap={'시간중':'일중','초이스중':'초이스중','ㅈㅁ':'ㅈㅁ','출근대기':'출근대기','대기':'대기','정산대기':'정산대기','퇴근정산':'퇴근정산'};
    const states=[active?.status,activeJob?.status].filter(Boolean).map(v=>statusMap[v]||v);
    const unique=[...new Set(states)];
    return J({message:`현재 운영중인 언니라 삭제할 수 없습니다.\\n현재 상태: ${unique.join(' / ')}\\n먼저 해당 상태를 정리한 뒤 언니등록에서 삭제해 주세요.`},400);
  }

  await db.prepare("UPDATE staff SET deleted=1 WHERE id=?").bind(staffId).run();
  await bump(db);
  return J({ok:true});
}
for(const [path,table,val] of [['/api/staff/restore','staff',0],['/api/shops/delete','shops',1],['/api/shops/restore','shops',0]])if(p===path&&m==='POST'){const x=await B(req);await db.prepare(`UPDATE ${table} SET deleted=? WHERE id=?`).bind(val,x.id).run();await bump(db);return J({ok:true})}

if(p==='/api/staff/purge'&&m==='POST'){
  const x=await B(req);
  const staff=await db.prepare("SELECT id,deleted FROM staff WHERE id=?").bind(x.id).first();
  if(!staff)return J({message:'언니 정보를 찾을 수 없습니다.'},404);
  if(!Number(staff.deleted))return J({message:'먼저 삭제목록으로 이동한 뒤 영구삭제하세요.'},400);
  await db.batch([
    db.prepare("DELETE FROM jobs WHERE staff_id=?").bind(x.id),
    db.prepare("DELETE FROM attendance WHERE staff_id=?").bind(x.id),
    db.prepare("DELETE FROM pickup_waiting WHERE staff_id=?").bind(x.id),
    db.prepare("DELETE FROM work_logs WHERE staff_id=?").bind(x.id),
    db.prepare("DELETE FROM staff WHERE id=?").bind(x.id)
  ]);
  await bump(db);
  return J({ok:true});
}
if(p==='/api/shops/purge'&&m==='POST'){
  const x=await B(req);
  const shop=await db.prepare("SELECT id,deleted FROM shops WHERE id=?").bind(x.id).first();
  if(!shop)return J({message:'노래방 정보를 찾을 수 없습니다.'},404);
  if(!Number(shop.deleted))return J({message:'먼저 삭제목록으로 이동한 뒤 영구삭제하세요.'},400);
  await db.batch([
    db.prepare("DELETE FROM jobs WHERE shop_id=?").bind(x.id),
    db.prepare("DELETE FROM shops WHERE id=?").bind(x.id)
  ]);
  await bump(db);
  return J({ok:true});
}

if(p==='/api/jobs/delete-staff-today'&&m==='POST'){
  const x=await B(req);
  const staffId=Number(x.staff_id);
  if(!staffId)return J({message:'언니 정보가 올바르지 않습니다.'},400);

  const found=await db.prepare("SELECT COUNT(*) cnt FROM jobs WHERE staff_id=? AND status='퇴근정산'")
    .bind(staffId).first();
  const deleted=Number(found?.cnt||0);
  if(!deleted)return J({message:'삭제할 정산내역이 없습니다.'},404);

  await db.batch([
    db.prepare("DELETE FROM settlement_archives WHERE staff_id=? AND archive_type='staff'").bind(staffId),
    db.prepare("DELETE FROM jobs WHERE staff_id=? AND status='퇴근정산'").bind(staffId)
  ]);

  await bump(db);
  return J({ok:true,deleted});
}
if(p==='/api/settlements/finalize-all'&&m==='POST'){
  const x=await B(req);
  const closeDay=String(x.day||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(closeDay))return J({message:'마감 날짜가 올바르지 않습니다.'},400);

  const rows=await db.prepare("SELECT j.*,s.name,COALESCE(j.shop_name_snapshot,sh.name) shop_name FROM jobs j JOIN staff s ON s.id=j.staff_id JOIN shops sh ON sh.id=j.shop_id WHERE j.status='퇴근정산' ORDER BY j.id").all();
  const items=rows.results||[];
  if(!items.length)return J({message:'정산완료할 목록이 없습니다.'},400);

  const totals=items.reduce((a,j)=>({
    count:a.count+1,
    total:a.total+Number(j.total||0),
    hold:a.hold+Number(j.hold_amount||0),
    managerHold:a.managerHold+Number(j.manager_hold||0),
    receivable:a.receivable+Number(j.shop_receivable||0),
    commission:a.commission+Number(j.commission_fee||0),
    sisterPay:a.sisterPay+Number(j.balance_amount||0),
    sisterReceivable:a.sisterReceivable+Number(j.sister_receivable||0),
    other:a.other+Number(j.other_amount||0)
  }),{count:0,total:0,hold:0,managerHold:0,receivable:0,commission:0,sisterPay:0,sisterReceivable:0,other:0});

  const title=closeDay+' 오늘 마감 정산완료';
  const payload=JSON.stringify({
    archive_type:'daily_close',
    title,
    day:closeDay,
    items,
    totals,
    closed_at:new Date().toISOString()
  });

  await db.batch([
    db.prepare("INSERT INTO settlement_archives(day,archive_type,staff_id,staff_name,payload,total,hold_amount,settlement_amount,ting_amount,balance_amount,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,datetime('now'))")
      .bind(closeDay,'daily_close',null,title,payload,totals.total,totals.hold,totals.sisterPay,totals.sisterReceivable,totals.sisterPay),
    db.prepare("UPDATE jobs SET status='정산완료',day=? WHERE status='퇴근정산'").bind(closeDay),
    db.prepare("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='version'")
  ]);

  return J({ok:true,title,items,totals});
}
if(p==='/api/settlement-archives/save'&&m==='POST'){
  const x=await B(req);
  const day=String(x.day||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return J({message:'날짜가 올바르지 않습니다.'},400);
  const payload=JSON.stringify(x);
  const totals=x.totals||{};
  await db.prepare("INSERT INTO settlement_archives(day,archive_type,staff_id,staff_name,payload,total,hold_amount,settlement_amount,ting_amount,balance_amount,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,datetime('now'))")
    .bind(day,x.archive_type||'staff',x.staff_id||null,x.staff_name||'',payload,
      Number(totals.total||0),Number(totals.hold||0),Number(totals.settlement||0),
      Number(totals.ting||0),Number(totals.balance||0)).run();
  await bump(db);
  return J({ok:true});
}
if(p==='/api/settlement-archives/list'&&m==='GET'){
  const day=String(u.searchParams.get('day')||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return J({message:'날짜가 올바르지 않습니다.'},400);

  const rows=await db.prepare("SELECT id,day,archive_type,staff_name,payload,total,hold_amount,settlement_amount,ting_amount,balance_amount,created_at FROM settlement_archives WHERE day=? AND archive_type IN ('daily_close','day') ORDER BY id DESC")
    .bind(day).all();

  const archives=(rows.results||[]).map(r=>{
    let payload={};
    try{payload=JSON.parse(r.payload||'{}')}catch(e){payload={}}
    return {
      id:r.id,
      day:r.day,
      archive_type:r.archive_type,
      title:payload.title||r.staff_name||(r.day+' 오늘 마감 정산완료'),
      created_at:r.created_at,
      totals:payload.totals||{},
      items:payload.items||[],
      groups:payload.groups||[]
    };
  });

  return J({day,archives});
}
if(p==='/api/settlement-history'&&m==='GET'){
  const day=String(u.searchParams.get('day')||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return J({message:'날짜가 올바르지 않습니다.'},400);
  const jobs=await db.prepare("SELECT j.*,s.name,COALESCE(j.shop_name_snapshot,sh.name) shop_name FROM jobs j JOIN staff s ON s.id=j.staff_id JOIN shops sh ON sh.id=j.shop_id WHERE j.day=? AND j.status IN ('퇴근정산','정산완료') ORDER BY j.id")
    .bind(day).all();
  const ac=await db.prepare("SELECT COUNT(*) cnt FROM settlement_archives WHERE day=?").bind(day).first();
  return J({jobs:jobs.results,archive_count:Number(ac?.cnt||0)});
}
if(p==='/api/settlement-history/delete'&&m==='POST'){
  const x=await B(req);
  const day=String(x.day||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return J({message:'날짜가 올바르지 않습니다.'},400);
  const cnt=await db.prepare("SELECT COUNT(*) cnt FROM jobs WHERE day=? AND status IN ('퇴근정산','정산완료')").bind(day).first();
  await db.batch([
    db.prepare("DELETE FROM settlement_archives WHERE day=?").bind(day),
    db.prepare("DELETE FROM jobs WHERE day=? AND status IN ('퇴근정산','정산완료')").bind(day)
  ]);
  await bump(db);
  return J({ok:true,deleted:Number(cnt?.cnt||0)});
}
if(p==='/api/backup'){const o={created_at:new Date().toISOString()};for(const n of ['meta','staff','shops','attendance','jobs','pickup_waiting','work_logs','work_log_archives','work_log_hidden_days','manager_presence','settlement_archives'])o[n]=(await db.prepare(`SELECT * FROM ${n}`).all()).results;return J(o)}return J({message:'not found'},404)}catch(e){return J({message:e.message},500)}}
