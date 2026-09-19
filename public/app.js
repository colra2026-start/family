// v102 라라→유진 이름통합 · 언니등록 삭제오류 안내개선
const KEY='colra_login_v3';const SETTLEMENT_ENABLED=false;
const AUTO_LOGOUT_MS=30*60*1000;

// v096: 브라우저 기본 alert/confirm 제거 - 실장앱은 무확인 실행 + 비차단 안내만 사용
(function installNonBlockingManagerNotices(){
  const style=document.createElement('style');
  style.id='manager-nonblocking-notice-style';
  style.textContent=`
    #managerNoticeToast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:2147483647;
      max-width:min(88vw,520px);padding:12px 16px;border-radius:14px;background:rgba(17,24,39,.94);color:#fff;
      font-size:14px;font-weight:800;line-height:1.45;text-align:center;white-space:pre-line;word-break:keep-all;
      box-shadow:0 12px 30px rgba(0,0,0,.24);opacity:0;pointer-events:none;transition:opacity .18s ease;}
    #managerNoticeToast.show{opacity:1;}
  `;
  if(!document.getElementById(style.id))document.head.appendChild(style);
  let timer=0;
  window.managerNotice=function(message){
    try{if(typeof playTransitionDing==='function')playTransitionDing()}catch{}
    let el=document.getElementById('managerNoticeToast');
    if(!el){el=document.createElement('div');el.id='managerNoticeToast';document.body.appendChild(el)}
    el.textContent=String(message??'');
    el.classList.add('show');
    clearTimeout(timer);
    timer=setTimeout(()=>el.classList.remove('show'),2600);
  };
  // 기존 코드의 alert는 확인 버튼 없는 안내 토스트로, confirm은 추가 확인 없이 즉시 진행한다.
  window.alert=(message)=>window.managerNotice(message);
  window.confirm=()=>true;
})();
(function ensureUnifiedCheckinButtonStyle(){
  const id='unified-checkin-button-style';
  if(document.getElementById(id))return;
  const style=document.createElement('style');
  style.id=id;
  style.textContent=`
    #checkinWaitingRegisterBtn,
    .checkin-wait-row .cancel-checkin,
    .checkin-wait-row .jm-btn,
    .checkin-wait-row .checkin-row-btn{
      box-sizing:border-box !important;
      width:82px !important;
      min-width:82px !important;
      height:36px !important;
      min-height:36px !important;
      padding:0 10px !important;
      border-radius:8px !important;
      font-size:14px !important;
      line-height:1 !important;
      font-weight:800 !important;
      white-space:nowrap !important;
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
    }
    #checkinWaitingList{
      display:block !important;
      visibility:visible !important;
      opacity:1 !important;
      height:auto !important;
      min-height:0 !important;
      max-height:none !important;
      overflow:visible !important;
      margin-top:10px !important;
    }
    #checkinWaitingList .checkin-wait-row{
      display:block !important;
      visibility:visible !important;
      opacity:1 !important;
      height:auto !important;
      min-height:96px !important;
      max-height:none !important;
      overflow:visible !important;
      margin:10px 0 0 !important;
    }
  `;
  document.head.appendChild(style);
})();
let lastActivityAt=Date.now(),logoutRunning=false;

(function(){if(document.getElementById('test-flow-style'))return;const st=document.createElement('style');st.id='test-flow-style';st.textContent='.test-eta-choice.active,.test-driver-choice.active,.driver-reason.active{background:#2563eb!important;color:#fff!important}.row-btn.pass.active,#driverAccept.active,#rerouteAccept.active{background:#f97316!important;color:#fff!important;border-color:#f97316!important}.sister-settlement-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin:10px 0}.sister-settlement-head{display:flex;justify-content:space-between;gap:10px;font-weight:900}.sister-original-message{margin-top:10px;padding:10px;background:#f8fafc;border-radius:10px}.sister-ai-box{margin:10px 0;padding:10px;background:#eff6ff;border-radius:10px;line-height:1.6}#testSettlementWrap{margin-top:14px}#testSettlementWrap details{margin-bottom:10px;padding:12px}';document.head.appendChild(st)})();
let activeManager='',multiChoiceMode=false,multiChoiceSelected=[],multiChoiceOriginalOrder=[],S={staff:[],shops:[],attendance:[],jobs:[],pickups:[],pickup_requests:[],sister_settlement_messages:[],test_pickup_flows:[],test_choice_results:[],test_settlement_pending:[],test_settlement_review:[],presence:[],version:0};const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])),won=n=>(+n||0).toLocaleString('ko-KR')+'원';
function isBigManagerClient(){return Boolean(S&&S.is_big_manager)||managerKey(activeManager)==='실장T';}
function managerDisplayName(name){return ({'실장T':'test','실장A':'colra1','실장B':'Ghana','실장C':'colra2'})[name]||name;}
function managerKey(name){const raw=String(name||'').trim();const low=raw.toLowerCase();return ({'실장T':'실장T','test':'실장T','TEST':'실장T','Test':'실장T','colra1test':'실장T','콜라1테스트':'실장T','실장A':'실장A','colra1':'실장A','실장B':'실장B','chana':'실장B','Ghana':'실장B','ghana':'실장B','remon':'실장B','실장C':'실장C','colra2':'실장C'})[raw]||({'test':'실장T','TEST':'실장T','Test':'실장T','colra1test':'실장T','콜라1테스트':'실장T','colra1':'실장A','chana':'실장B','ghana':'실장B','remon':'실장B','colra2':'실장C'})[low]||raw;}
function clearBrowserData(){
  try{localStorage.clear()}catch{}
  try{sessionStorage.clear()}catch{}
  try{if('caches' in window)caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))}catch{}
  try{document.querySelectorAll('input,textarea,select').forEach(el=>{if(el.id!=='loginManager'){if(el.type==='checkbox'||el.type==='radio')el.checked=false;else el.value=''}})}catch{}
  S={staff:[],shops:[],attendance:[],jobs:[],pickups:[],pickup_requests:[],sister_settlement_messages:[],test_pickup_flows:[],test_choice_results:[],test_settlement_pending:[],test_settlement_review:[],presence:[],version:0};
}
function showLoginScreen(message=''){
  activeManager='';
  clearBrowserData();
  $('#mainApp').hidden=true;
  $('#loginScreen').style.display='grid';
  $('#loginPassword').value='';
  $('#loginError').textContent=message;
  try{history.replaceState(null,'',location.pathname)}catch{}
}
async function secureLogout(reason=''){
  if(logoutRunning)return;logoutRunning=true;
  try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'})}catch{}
  showLoginScreen(reason);
  logoutRunning=false;
}
function markActivity(){lastActivityAt=Date.now()}
['pointerdown','keydown','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,markActivity,{passive:true}));
function managerContact(name){return ({'실장T':{display:'test',phone:''},'실장A':{display:'colra1',phone:'01056633885'},'실장B':{display:'Ghana',phone:'01082996058'},'실장C':{display:'colra2',phone:'01089197111'}})[name];}
function shopById(id){return (S.shops||[]).find(x=>Number(x.id)===Number(id))||null;}
function shopButton(shopId,shopName){const id=Number(shopId||0);const name=esc(shopName||'노래방');if(!id)return `<button type="button" class="shop-name-btn" onclick="showShopMemo(0,'${name}')">${name}</button>`;return `<button type="button" class="shop-name-btn" onclick="showShopMemo(${id},'${name}')">${name}</button>`;}
function showShopMemo(shopId,shopName=''){const s=shopById(shopId);const name=s?.name||shopName||'노래방';const memo=s?.memo||'등록된 메모가 없습니다.';modal('노래방 메모',`<div class="shop-memo-popup"><div class="shop-memo-name">${esc(name)}</div><div class="shop-memo-phone">${esc(s?.phone||'')}</div><div class="shop-memo-text">${esc(memo).replace(/\n/g,'<br>')}</div></div>`,async()=>{});const menu=$('#form menu');menu.innerHTML='';if(s){const edit=document.createElement('button');edit.type='button';edit.className='btn edit-shop-memo-btn';edit.textContent='수정';edit.onclick=()=>editShop(s.id);menu.append(edit)}const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='닫기';close.onclick=()=>$('#dlg').close();menu.append(close)}
function showManagerContact(name){const c=managerContact(name);if(!c)return;modal(c.display+' 연락',`<div class="staff-profile"><div class="staff-profile-name">${esc(c.display)}</div><div class="staff-profile-phone">${esc(c.phone)}</div></div>`,async()=>{});const menu=$('#form menu');menu.innerHTML='';const call=document.createElement('button');call.type='button';call.className='btn green';call.textContent='통화';call.onclick=()=>callStaff(c.phone);const sms=document.createElement('button');sms.type='button';sms.className='btn primary';sms.textContent='문자';sms.onclick=()=>textStaff(c.phone);const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='닫기';close.onclick=()=>$('#dlg').close();menu.append(call,sms,close)}
async function applyManagerView(){const admin=activeManager==='실장A'&&SETTLEMENT_ENABLED;const p=$('#pendingSection'),d=$('#doneSection');if(p)p.style.display=admin?'':'none';if(d)d.style.display=admin?'':'none'}
async function showMain(m){m=managerKey(m);activeManager=m;lastActivityAt=Date.now();$('#loginScreen').style.display='none';$('#mainApp').hidden=false;$('#currentManager').textContent=managerDisplayName(m)+' 로그인';applyManagerView();presence();await beat();await refresh(true);presence()}
async function login(){
  const m=managerKey($('#loginManager').value),pw=$('#loginPassword').value.trim();
  $('#loginError').textContent='';
  try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({manager:m,password:pw})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'로그인에 실패했습니다.');await showMain(d.manager||m)}catch(e){$('#loginError').textContent=e.message||'로그인에 실패했습니다.'}
}

function ensureTestManagerUI(){
  const sel=$('#loginManager');
  if(sel){
    [...sel.options].forEach(o=>{if(managerKey(o.value||o.textContent)==='실장B')o.remove()});
    if(!sel.querySelector('option[value="실장T"]')){const o=document.createElement('option');o.value='실장T';o.textContent='test';sel.appendChild(o)}
  }
  const ghanaPresence=$('#presenceB');
  if(ghanaPresence)ghanaPresence.remove();
  const a=$('#presenceA');
  if(a&&!$('#presenceT')){const b=a.cloneNode(true);b.id='presenceT';b.textContent='test 미접속';b.onclick=()=>showManagerContact('실장T');a.parentNode.appendChild(b)}
}
ensureTestManagerUI();

$('#presenceA').onclick=()=>showManagerContact('실장A');
$('#presenceC').onclick=()=>showManagerContact('실장C');
$('#loginBtn').onclick=login;$('#loginPassword').onkeydown=e=>{if(e.key==='Enter')login()};$('#logoutBtn').onclick=()=>secureLogout('안전하게 로그아웃되었습니다.');
(async()=>{try{const r=await fetch('/api/auth/status',{credentials:'same-origin',cache:'no-store'});const d=await r.json().catch(()=>({}));if(r.ok&&d.authenticated)await showMain(d.manager);else showLoginScreen('')}catch{showLoginScreen('')}})();

let transitionAudioContext=null;
let transitionSoundUnlocked=false;
let lastTransitionDingAt=0;
function unlockTransitionSound(){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    transitionAudioContext=transitionAudioContext||new Ctx();
    if(transitionAudioContext.state==='suspended')transitionAudioContext.resume();
    transitionSoundUnlocked=true;
  }catch(e){console.warn('sound unlock',e)}
}
['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,unlockTransitionSound,{passive:true,once:false}));
function playTransitionDing(){
  try{
    const wallNow=Date.now();if(wallNow-lastTransitionDingAt<700)return;lastTransitionDingAt=wallNow;
    unlockTransitionSound();const ctx=transitionAudioContext;if(!ctx||ctx.state!=='running'||!transitionSoundUnlocked)return;const now=ctx.currentTime,g=ctx.createGain();g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.3,now+.03);g.gain.exponentialRampToValueAtTime(.0001,now+2);g.connect(ctx.destination);for(let i=0;i<12;i++){const o=ctx.createOscillator();o.type=i%2?'sine':'triangle';o.frequency.setValueAtTime(500+i*60,now+i*.06);o.frequency.exponentialRampToValueAtTime(950+i*25,now+.35+i*.06);o.connect(g);o.start(now+i*.06);o.stop(now+.5+i*.06)}
  }catch(e){console.warn('transition sound',e)}
}
function hasNotifiableTransition(previous,next){
  if(!previous||!Number(previous.version))return false;
  const oldJobs=new Map((previous.jobs||[]).map(j=>[Number(j.id),String(j.status||'')]));
  const oldAttendance=new Map((previous.attendance||[]).map(a=>[Number(a.staff_id),String(a.status||'')]));
  for(const a of next.attendance||[]){if(String(a.status||'')==='출근대기'&&!oldAttendance.has(Number(a.staff_id)))return true;}
  for(const j of next.jobs||[]){
    const status=String(j.status||'');
    const oldStatus=oldJobs.get(Number(j.id));
    if(status==='시간중'&&oldStatus==='초이스중')return true;
    if(status==='초이스중'){
      const previousAttendance=oldAttendance.get(Number(j.staff_id));
      if(previousAttendance==='대기')return true;
      const hadChoice=(previous.jobs||[]).some(x=>Number(x.staff_id)===Number(j.staff_id)&&String(x.status||'')==='초이스중');
      if(!hadChoice&&previousAttendance==='대기')return true;
    }
  }
  return false;
}
const API_INFLIGHT=new Map();
async function api(p,o={}){
  const method=String(o.method||'GET').toUpperCase();
  const key=method==='GET'?null:method+' '+p+' '+String(o.body||'');
  if(key&&API_INFLIGHT.has(key))return API_INFLIGHT.get(key);
  const task=(async()=>{
    const r=await fetch('/api'+p,{credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...o}),t=await r.text();
    let d={};try{d=t?JSON.parse(t):{}}catch{d={message:t}}
    if(r.status===401){showLoginScreen('로그인이 만료되었습니다. 다시 로그인해 주세요.');throw Error(d.message||'로그인이 만료되었습니다.')}if(!r.ok)throw Error(d.message||t);
    return d;
  })();
  if(key)API_INFLIGHT.set(key,task);
  try{return await task}finally{if(key)API_INFLIGHT.delete(key)}
}async function beat(){
  if(!activeManager)return;
  try{
    await api('/presence/heartbeat',{method:'POST',body:JSON.stringify({manager:managerKey(activeManager)})});
  }catch(e){
    console.error('heartbeat',e);
  }
}
let activePickupRequestId=0;
let activeTestFlowId=0;
function pickupEtaButtons(){return ['3분 후','5분 후','10분 후','메시지 후 나옴'].map(v=>`<button type="button" class="staff-choice-btn test-eta-choice" data-eta="${esc(v)}">${esc(v)}</button>`).join('')}
function checkTestChoiceResult(){if(!isBigManagerClient()||document.querySelector('#dlg[open]'))return;for(const r of (S.test_choice_results||[])){const key='test_choice_result_'+r.id+'_'+r.choice_result;if(localStorage.getItem(key))continue;localStorage.setItem(key,'1');playTransitionDing();alert(`${r.name||'언니'} 초이스 결과: ${r.choice_result}${r.choice_result==='O'?' · O 전송 완료. 통과를 눌러 확인해 주세요.':' · 다시 대기합니다.'}`);break}}
function openTestPickupAssign(r){
  if(!r)return false;
  activeTestFlowId=Number(r.id);playTransitionDing();
  const managers=['실장T','실장A','실장B','실장C'].map(v=>`<button type="button" class="staff-choice-btn test-driver-choice" data-manager="${v}">${esc(managerDisplayName(v))}</button>`).join('');
  const rejectInfo=r.status==='rejected_confirmed'?`<div class="notice" style="margin-bottom:10px"><b>이전 배정 거절</b> · ${esc(managerDisplayName(r.assigned_manager||''))}<br>${esc(r.reject_reason||'')}${r.driver_message?'<br>'+esc(r.driver_message):''}<br><b>다시 배정해 주세요.</b></div>`:'';
  modal('실장 배정 및 도착시간 입력',`${rejectInfo}<div class="notice"><b>${esc(r.name)} · ${esc(r.shop_name||'')}</b><br>${esc(r.sister_request_type||'')} ${r.sister_message?'<br>'+esc(r.sister_message):''}</div><label>실장 배정</label><div class="staff-sector-grid">${managers}</div><input type="hidden" name="manager" id="testDriverManager"><label>예상 도착</label><div class="staff-sector-grid">${pickupEtaButtons()}</div><input type="hidden" name="eta" id="testEtaChoice">`,async f=>{const manager=String(f.get('manager')||''),eta=String(f.get('eta')||'');if(!manager||!eta)throw Error('실장과 예상도착을 선택해 주세요.');await api('/test-pickup/assign',{method:'POST',body:JSON.stringify({id:activeTestFlowId,manager,eta})});activeTestFlowId=0;await refresh(true)},'이동');
  document.querySelectorAll('.test-driver-choice').forEach(b=>b.onclick=()=>{document.querySelectorAll('.test-driver-choice').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#testDriverManager').value=b.dataset.manager||''});
  document.querySelectorAll('.test-eta-choice').forEach(b=>b.onclick=()=>{document.querySelectorAll('.test-eta-choice').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#testEtaChoice').value=b.dataset.eta||''});
  $('#dlg')?.addEventListener('close',()=>{activeTestFlowId=0},{once:true});return true;
}
function checkSisterPickupRequest(){if(activePickupRequestId||activeTestFlowId||document.querySelector('#dlg[open]'))return;
  const reroutes=S.test_reroute_flows||[];
  if(isBigManagerClient()){
    const rr=reroutes.find(x=>['driver_accepted','driver_rejected'].includes(x.status));
    if(rr){activeTestFlowId=Number(rr.id);playTransitionDing();const accepted=rr.status==='driver_accepted';const detail=accepted?`<div class="notice"><b>${esc(rr.name)} → ${esc(rr.new_shop_name||'새 초이스')}</b><br>배정실장 ${esc(managerDisplayName(rr.assigned_manager||''))}<br><b>수락 완료</b><br>초이스된 곳으로 바로 이동 가능합니다.</div>`:`<div class="notice"><b>${esc(rr.name)} → ${esc(rr.new_shop_name||'새 초이스')}</b><br>배정실장 ${esc(managerDisplayName(rr.assigned_manager||''))}<br><b>거절</b> ${esc(rr.reject_reason||'')}${rr.driver_message?'<br>'+esc(rr.driver_message):''}</div>`;modal('초이스 이동 실장 응답',detail,async()=>{await api('/test-reroute/big-confirm',{method:'POST',body:JSON.stringify({id:activeTestFlowId})});activeTestFlowId=0;await refresh(true);setTimeout(checkSisterPickupRequest,80)},accepted?'최종 이동':'거절 확인','');$('#dlg')?.addEventListener('close',()=>{activeTestFlowId=0},{once:true});return}
  }
  const rrAssigned=reroutes.find(x=>x.status==='requested'&&x.assigned_manager===activeManager);
  if(rrAssigned){activeTestFlowId=Number(rrAssigned.id);playTransitionDing();modal('초이스 이동 요청',`<div class="notice"><b>${esc(rrAssigned.name)} → ${esc(rrAssigned.new_shop_name||'새 초이스')}</b><br><br><b>초이스된 곳으로 바로 이동해주세요.</b></div><div class="row"><button type="button" id="rerouteAccept" class="row-btn pass">확인</button><button type="button" id="rerouteReject" class="row-btn end">거절</button></div><div id="rerouteRejectBox" style="display:none;margin-top:12px"><label>거절 이유</label><div class="staff-sector-grid"><button type="button" class="staff-choice-btn reroute-reason" data-reason="위치에서 먼곳">위치에서 먼곳</button><button type="button" class="staff-choice-btn reroute-reason" data-reason="초이스대기중">초이스대기중</button></div><input type="hidden" name="reason" id="rerouteReason"><label>메시지</label><textarea name="message"></textarea></div><input type="hidden" name="response" id="rerouteResponse">`,async f=>{const response=String(f.get('response')||'');if(!response)throw Error('확인 또는 거절을 선택해 주세요.');await api('/test-reroute/driver-response',{method:'POST',body:JSON.stringify({id:activeTestFlowId,response,reason:f.get('reason')||'',message:f.get('message')||''})});activeTestFlowId=0;await refresh(true)},'전송');$('#rerouteAccept').onclick=()=>{$('#rerouteResponse').value='수락';$('#rerouteAccept').classList.add('active');$('#rerouteReject').classList.remove('active');$('#rerouteRejectBox').style.display='none'};$('#rerouteReject').onclick=()=>{$('#rerouteResponse').value='거절';$('#rerouteReject').classList.add('active');$('#rerouteAccept').classList.remove('active');$('#rerouteRejectBox').style.display='block'};document.querySelectorAll('.reroute-reason').forEach(b=>b.onclick=()=>{document.querySelectorAll('.reroute-reason').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#rerouteReason').value=b.dataset.reason||''});$('#dlg')?.addEventListener('close',()=>{activeTestFlowId=0},{once:true});return}
  const rrDone=reroutes.find(x=>['accepted_confirmed','rejected_confirmed'].includes(x.status)&&x.assigned_manager===activeManager&&!x.driver_acknowledged_at);
  if(rrDone){activeTestFlowId=Number(rrDone.id);playTransitionDing();const accepted=rrDone.status==='accepted_confirmed';modal('큰실장 결정 완료',`<div class="notice"><b>${esc(rrDone.name)} → ${esc(rrDone.new_shop_name||'')}</b><br>${accepted?'큰실장 최종 이동 결정 완료.<br>초이스된 곳으로 바로 이동해주세요.':'거절 내용 확인 완료. 기존 배정/복귀를 유지합니다.'}</div>`,async()=>{await api('/test-reroute/driver-ack',{method:'POST',body:JSON.stringify({id:activeTestFlowId})});activeTestFlowId=0;await refresh(true)},'확인','');return}
  const flows=S.test_pickup_flows||[];
  if(isBigManagerClient()){
    const result=flows.find(x=>['driver_accepted','driver_rejected'].includes(x.status));if(result){activeTestFlowId=Number(result.id);playTransitionDing();const detail=result.driver_response==='거절'?`<div class="notice"><b>${esc(result.name)}</b> · ${esc(result.shop_name||'')}<br>배정실장 ${esc(managerDisplayName(result.assigned_manager||''))}<br><b>거절</b> ${esc(result.reject_reason||'')}${result.driver_message?'<br>'+esc(result.driver_message):''}</div>`:`<div class="notice"><b>${esc(result.name)}</b> · ${esc(result.shop_name||'')}<br>배정실장 ${esc(managerDisplayName(result.assigned_manager||''))}<br><b>수락 완료</b> · ${esc(result.eta_choice||'')}</div>`;modal('배정실장 응답',detail,async()=>{await api('/test-pickup/big-confirm',{method:'POST',body:JSON.stringify({id:activeTestFlowId})});activeTestFlowId=0;await refresh(true);setTimeout(checkSisterPickupRequest,80)},'확인','');$('#dlg')?.addEventListener('close',()=>{activeTestFlowId=0},{once:true});return}
    const r=flows.find(x=>['requested','rejected_confirmed'].includes(x.status));if(r){openTestPickupAssign(r);return}
  }
  const assigned=flows.find(x=>x.status==='assigned'&&x.assigned_manager===activeManager);if(assigned){activeTestFlowId=Number(assigned.id);playTransitionDing();modal('픽업 배정 요청',`<div class="notice"><b>${esc(assigned.name)} · ${esc(assigned.shop_name||'')}</b><br>${esc(assigned.sister_request_type||'')} · ${esc(assigned.eta_choice||'')}</div><div class="row"><button type="button" id="driverAccept" class="row-btn pass">수락</button><button type="button" id="driverReject" class="row-btn end">거절</button></div><div id="driverRejectBox" style="display:none;margin-top:12px"><label>거절 이유</label><div class="staff-sector-grid"><button type="button" class="staff-choice-btn driver-reason" data-reason="위치에서 먼곳">위치에서 먼곳</button><button type="button" class="staff-choice-btn driver-reason" data-reason="초이스대기중">초이스대기중</button></div><input type="hidden" name="reason" id="driverReason"><label>다른 이유 / 메시지</label><textarea name="message"></textarea></div><input type="hidden" name="response" id="driverResponse">`,async f=>{const response=String(f.get('response')||'');if(!response)throw Error('수락 또는 거절을 선택해 주세요.');await api('/test-pickup/driver-response',{method:'POST',body:JSON.stringify({id:activeTestFlowId,response,reason:f.get('reason')||'',message:f.get('message')||''})});activeTestFlowId=0;await refresh(true)},'전송');$('#driverAccept').onclick=()=>{$('#driverResponse').value='수락';$('#driverAccept').classList.add('active');$('#driverReject').classList.remove('active');$('#driverRejectBox').style.display='none'};$('#driverReject').onclick=()=>{$('#driverResponse').value='거절';$('#driverReject').classList.add('active');$('#driverAccept').classList.remove('active');$('#driverRejectBox').style.display='block'};document.querySelectorAll('.driver-reason').forEach(b=>b.onclick=()=>{document.querySelectorAll('.driver-reason').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#driverReason').value=b.dataset.reason||''});$('#dlg')?.addEventListener('close',()=>{activeTestFlowId=0},{once:true});return}
  const confirmed=flows.find(x=>['confirmed','rejected_confirmed'].includes(x.status)&&x.assigned_manager===activeManager&&!x.driver_acknowledged_at);if(confirmed){activeTestFlowId=Number(confirmed.id);playTransitionDing();const rejected=confirmed.status==='rejected_confirmed';modal('큰실장 확인완료',`<div class="notice"><b>${esc(confirmed.name)}</b><br>${rejected?'거절 내용이 큰실장에게 확인되었습니다. 다시 배정 대기합니다.':'픽업 배정이 최종 확인되었습니다.<br>'+esc(confirmed.eta_choice||'')}</div>`,async()=>{await api('/test-pickup/driver-ack',{method:'POST',body:JSON.stringify({id:activeTestFlowId})});activeTestFlowId=0;await refresh(true)},'확인','');return}
  if(!isBigManagerClient())return;
  const r=(S.pickup_requests||[])[0];if(!r)return;activePickupRequestId=Number(r.assignment_id);const opts=['실장T','실장A','실장B','실장C'].map(x=>`<option value="${x}">${esc(managerDisplayName(x))}</option>`).join('');modal('언니 픽업 요청',`<div class="notice">${esc(r.name)} · ${esc(r.shop_name||'')}<br>${esc(r.pickup_request_type||'픽업 요청')}</div><label>픽업 실장</label><select name="manager">${opts}</select><label>예상 도착시간</label><input name="eta" placeholder="예: 15분 / 03:10" required>`,async f=>{await api('/sister/pickup/assign',{method:'POST',body:JSON.stringify({assignment_id:activePickupRequestId,manager:f.get('manager'),eta:f.get('eta')})});activePickupRequestId=0;await refresh(true)},'언니픽업요청');$('#dlg')?.addEventListener('close',()=>{activePickupRequestId=0},{once:true})}
function attendanceSnapshotKey(rows){return (rows||[]).map(a=>[a.id,a.staff_id,a.status,a.sequence,a.manager,a.memo].join('|')).sort().join('||')}
async function refresh(force=false){try{
  const big=isBigManagerClient();
  const [s,extras]=await Promise.all([
    api('/snapshot?_='+Date.now()),
    big?api('/big-manager/extras?_='+Date.now()).catch(e=>{console.warn('큰실장 추가조회 실패',e);return null}):Promise.resolve(null)
  ]);
  if(extras)Object.assign(s,extras);
  lastSyncVersion=Number(s.version??lastSyncVersion);
  const attendanceChanged=attendanceSnapshotKey(s.attendance)!==attendanceSnapshotKey(S.attendance);
  if(force||s.version!==S.version||attendanceChanged){
    const shouldDing=!force&&hasNotifiableTransition(S,s);S=s;render();if(shouldDing)playTransitionDing();
    setTimeout(checkOtherJobResponse,20);setTimeout(checkSisterCheckoutRequest,60);setTimeout(checkSisterPickupRequest,100);setTimeout(checkSisterRejection,140);setTimeout(checkTestChoiceResult,180)
  }else{
    S.presence=s.presence||[];S.pickup_requests=s.pickup_requests||[];S.test_pickup_flows=s.test_pickup_flows||[];S.test_choice_results=s.test_choice_results||[];S.sister_rejections=s.sister_rejections||[];
    presence();setTimeout(checkOtherJobResponse,20);setTimeout(checkSisterCheckoutRequest,60);setTimeout(checkSisterPickupRequest,100);setTimeout(checkSisterRejection,140);setTimeout(checkTestChoiceResult,180)
  }
}catch(e){console.error('실장 화면 갱신 실패',e);const box=$('#checkinWaitingList');if(box&&!box.children.length)box.innerHTML='<div class="empty" style="color:#dc2626">출근대기 조회 실패: '+esc(e.message||'오류')+'</div>'}}
function checkSisterCheckoutRequest(){
  if(!isBigManagerClient()||$('#dlg')?.open)return;
  const r=(S.checkout_requests||[])[0];if(!r)return;
  playTransitionDing();
  modal('언니 퇴근 요청',`<div class="notice"><b>${esc(r.name)} 언니</b>가 오늘은 이만 퇴근하고 싶다고 보냈습니다.</div><div class="staff-sector-grid"><button type="button" id="checkoutGoodbye" class="staff-choice-btn">오늘도 수고 하셨습니다</button><button type="button" id="checkoutOther" class="staff-choice-btn">다른 일 잡힘</button></div><div id="checkoutMemoBox" style="display:none;margin-top:12px"><label>언니에게 보여줄 메모</label><textarea name="note" id="checkoutNote" placeholder="다른 일 내용을 입력해 주세요"></textarea></div><input type="hidden" name="decision" id="checkoutDecision">`,async f=>{const decision=String(f.get('decision')||'');if(!decision)throw Error('처리 방법을 선택해 주세요.');await api('/sister/checkout-decision',{method:'POST',body:JSON.stringify({assignment_id:Number(r.assignment_id),decision,note:f.get('note')||''})});await refresh(true)},'확인','');
  $('#checkoutGoodbye').onclick=()=>{$('#checkoutDecision').value='goodbye';$('#checkoutGoodbye').classList.add('active');$('#checkoutOther').classList.remove('active');$('#checkoutMemoBox').style.display='none'};
  $('#checkoutOther').onclick=()=>{$('#checkoutDecision').value='other_job';$('#checkoutOther').classList.add('active');$('#checkoutGoodbye').classList.remove('active');$('#checkoutMemoBox').style.display='block';setTimeout(()=>$('#checkoutNote')?.focus(),30)};
}
function checkOtherJobResponse(){
  if(!isBigManagerClient()||document.querySelector('#dlg[open]'))return;
  const r=(S.other_job_responses||[])[0];if(!r)return;
  playTransitionDing();
  const isReject=String(r.other_job_response||'')==='거절';
  if(!isReject){
    modal('다른 일정 · 언니 응답',`<div class="notice"><b>${esc(r.name)} 언니</b><br><b style="color:#16a34a">OK · 안내 확인 완료</b>${r.other_job_message?'<br><br>언니 메모<br>'+esc(r.other_job_message):''}</div>`,async()=>{await api('/sister/other-job-review',{method:'POST',body:JSON.stringify({assignment_id:Number(r.assignment_id),decision:'review'})});await refresh(true)},'확인','');
    return;
  }
  modal('다른 일정 · 언니 거절',`<div class="notice"><b>${esc(r.name)} 언니</b><br>보낸 내용 · ${esc(r.checkout_note||'')}<br><b style="color:#dc2626">거절</b>${r.other_job_message?'<br>언니 메모 · '+esc(r.other_job_message):''}</div><div class="staff-sector-grid" style="margin-top:12px"><button type="button" id="otherResendBtn" class="staff-choice-btn">내용수정 재전송</button><button type="button" id="otherGoodbyeBtn" class="staff-choice-btn">오늘도 수고 하셨습니다</button></div><div id="otherReplyBox" style="display:none;margin-top:12px"><label>언니에게 다시 보낼 내용</label><textarea name="note" id="otherReplyNote">${esc(r.checkout_note||'')}</textarea></div><input type="hidden" name="decision" id="otherReplyDecision">`,async f=>{const decision=String(f.get('decision')||'');if(!decision)throw Error('처리 방법을 선택해 주세요.');await api('/sister/other-job-review',{method:'POST',body:JSON.stringify({assignment_id:Number(r.assignment_id),decision,note:f.get('note')||''})});await refresh(true)},'전송','');
  $('#otherResendBtn').onclick=()=>{$('#otherReplyDecision').value='resend';$('#otherResendBtn').classList.add('active');$('#otherGoodbyeBtn').classList.remove('active');$('#otherReplyBox').style.display='block';setTimeout(()=>$('#otherReplyNote')?.focus(),30)};
  $('#otherGoodbyeBtn').onclick=()=>{$('#otherReplyDecision').value='goodbye';$('#otherGoodbyeBtn').classList.add('active');$('#otherResendBtn').classList.remove('active');$('#otherReplyBox').style.display='none'};
}
function checkSisterRejection(){if(!isBigManagerClient())return;const rows=S.sister_rejections||[];for(const r of rows){const k='sister_reject_seen_'+r.id;if(localStorage.getItem(k))continue;localStorage.setItem(k,'1');playTransitionDing();alert((r.name||'언니')+'이 초이스 수신을 거부했습니다.\n\n사유: '+(r.rejection_reason||'사유 없음'));break;}}
function presence(){
  ['실장A','실장C','실장T'].forEach((n,i)=>{
    const el=$('#presence'+['A','C','T'][i]);
    if(!el)return;
    const serverOnline=(S.presence||[]).some(x=>managerKey(x.manager)===n&&Number(x.online)===1);
    const on=serverOnline || managerKey(activeManager)===n;
    el.classList.remove('online','offline');
    el.classList.add(on?'online':'offline');
    el.textContent=managerDisplayName(n)+(on?' 접속':' 미접속');
  });
}
const normalizeWorkType=v=>({'티':'T','중':'M','ㅇㅊ':'ㅈㅇ','ㅈ':'ㅈㅇ'})[String(v||'').trim()]||String(v||'').trim();const tags=x=>`<span class="tags">${String(x||'T').split(',').filter(Boolean).map(v=>`<span class="tag">${esc(normalizeWorkType(v))}</span>`).join('')}</span>`;function duration(j){const u=+j.duration_units||0;if(u===1)return'반티';if(u%2===0)return u/2+'시간';return Math.floor(u/2)+'시간반'}
function attendanceEta(a){
  const m=String(a?.memo||'');
  const hit=m.match(/도착예정\s*([0-2]\d:[0-5]\d)/);
  if(!hit)return '-';
  const [h,mn]=hit[1].split(':').map(Number),ap=h<12?'오전':'오후',hh=h%12||12;
  return `${ap} ${hh}:${String(mn).padStart(2,'0')}`;
}
function pickupManagerOptions(){
  return ['본인출근','실장T','실장A','실장B','실장C'];
}
function attendancePriority(status){
  return ({'시간중':4,'초이스중':3,'대기':2,'출근대기':1})[status]||0;
}
function uniqueAttendance(rows){
  const map=new Map();
  rows.forEach(a=>{
    const key=String(a.staff_id);
    const current=map.get(key);
    if(!current || attendancePriority(a.status)>attendancePriority(current.status) ||
      (attendancePriority(a.status)===attendancePriority(current.status)&&Number(a.id)>Number(current.id))){
      map.set(key,a);
    }
  });
  return [...map.values()].sort((a,b)=>Number(a.sequence||0)-Number(b.sequence||0));
}
function uniqueJobRows(rows){
  const map=new Map();
  rows.forEach(j=>{
    const key=[j.staff_id,j.status,j.shop_id,j.choice_at||j.choice_time||'',j.start_at||j.start_time||'',j.end_at||j.end_time||''].join('|');
    const current=map.get(key);
    if(!current||Number(j.id)>Number(current.id))map.set(key,j);
  });
  return [...map.values()].sort((a,b)=>Number(a.id)-Number(b.id));
}
function uniquePickupRows(rows){
  const map=new Map();
  rows.forEach(x=>{
    const key=String(x.job_id||x.id);
    const current=map.get(key);
    if(!current||Number(x.id)>Number(current.id))map.set(key,x);
  });
  return [...map.values()].sort((a,b)=>Number(a.id)-Number(b.id));
}

function multiChoiceSelectedSet(){return new Set(multiChoiceSelected.map(Number))}
function setMultiChoiceMode(on,waitingRows=[]){
  multiChoiceMode=!!on;
  multiChoiceSelected=[];
  multiChoiceOriginalOrder=(waitingRows||[]).map(x=>Number(x.id));
  render();
}
function cancelMultiChoice(){
  multiChoiceMode=false;
  multiChoiceSelected=[];
  multiChoiceOriginalOrder=[];
  render();
}
function toggleMultiChoice(id){
  id=Number(id);
  const i=multiChoiceSelected.indexOf(id);
  if(i>=0)multiChoiceSelected.splice(i,1);else multiChoiceSelected.push(id);
  render();
}
function renderWaitingTitleControls(waitingRows){
  const title=$('#waitingSection .title');
  if(!title)return;
  let controls=$('#multiChoiceHeaderControls');
  if(!controls){
    controls=document.createElement('div');
    controls.id='multiChoiceHeaderControls';
    controls.className='multi-choice-header-controls';
    const badge=$('#waitingBadge');
    if(badge&&badge.parentNode===title)title.insertBefore(controls,badge);else title.appendChild(controls);
  }
  controls.innerHTML=multiChoiceMode
    ? `<button type="button" class="multi-choice-head active" onclick="void(0)">다중초이스</button><button type="button" class="multi-choice-cancel" onclick="cancelMultiChoice()">선택취소</button>`
    : `<button type="button" class="multi-choice-head" onclick="setMultiChoiceMode(true,window.__waitingRows||[])">다중초이스</button>`;
  window.__waitingRows=waitingRows;
}
function waitingRowHtml(a,selected=false,order=0){
  if(!multiChoiceMode)return `<div class="row"><div><div class="line"><button type="button" class="staff-name-btn" onclick="showStaffProfile(${a.staff_id})">${esc(staffLabel(a))}</button>${tags(a.work_types)}<span class="sub">${esc(a.memo||'')}</span></div></div><div class="waiting-actions"><button class="row-btn waiting-delete-btn" onclick="deleteWaiting(${a.id})">대기삭제</button><button class="row-btn" onclick="choice(${a.id})">초이스</button></div></div>`;
  return `<div class="row multi-choice-row ${selected?'selected':''}">
    <button type="button" class="multi-choice-square ${selected?'selected':''}" aria-label="${selected?'선택됨':'선택 안 됨'}" onclick="toggleMultiChoice(${a.id})">${selected?`<span class="multi-choice-order">${order}</span>`:''}</button>
    <div class="multi-choice-main">
      <div class="multi-choice-topline">
        <button type="button" class="staff-name-btn" onclick="showStaffProfile(${a.staff_id})">${esc(staffLabel(a))}</button>
        <span class="multi-choice-tags">${tags(a.work_types)}</span>
      </div>
      ${a.memo?`<div class="sub multi-choice-memo">${esc(a.memo||'')}</div>`:''}
    </div>
    <div class="waiting-actions multi-choice-actions"><button class="row-btn multi-choice-item-btn ${selected?'selected':''}" onclick="toggleMultiChoice(${a.id})">${selected?'선택됨':'다중초이스'}</button></div>
  </div>`;
}
function groupedJobsHtml(rows,type){
  const sortedRows=type==='working'
    ? [...rows].sort((a,b)=>operationalElapsedMinutes(b)-operationalElapsedMinutes(a)||Number(a.id||0)-Number(b.id||0))
    : [...rows];
  const grouped=new Map(),singles=[];
  sortedRows.forEach(j=>{
    const gid=String(j.choice_group_id||'').trim();
    if(!gid)singles.push(j);
    else{
      if(!grouped.has(gid))grouped.set(gid,[]);
      grouped.get(gid).push(j);
    }
  });
  const renderChoiceRow=j=>`<div class="row grouped-job-row"><div><div class="line"><button type="button" class="staff-name-btn" onclick="showStaffProfile(${j.staff_id})">${esc(staffLabel(j))}</button></div><div class="working-time choice-time"><span>${j.choice_time||'-'} 선택</span><span class="choice-manager-name">${esc(managerDisplayName(j.manager||''))}</span></div>${j.sister_acknowledged_at?`<div class="sub" style="color:#059669;font-weight:800">${['테스트1','테스트2'].includes(String(j.name||''))?'언니 확인완료':'언니 수신확인'} ${new Date(String(j.sister_acknowledged_at).replace(' ','T')+'Z').toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}${String(j.sister_choice_result||'').toUpperCase()==='O'?' · <span style="color:#f97316">O 전송</span>':''}</div>`:`<div class="sub" style="color:#f97316;font-weight:800">언니 수신대기</div>`}</div><div class="mobile-action-row"><button class="row-btn" onclick="returnWaiting(${j.id})">대기</button><button class="row-btn pass" onclick="passChoice(${j.id})">통과</button></div></div>`;
  const renderWorkingRow=j=>`<div class="row working-row grouped-job-row"><div><div class="working-main"><button type="button" class="staff-name-btn working-name" onclick="showStaffProfile(${j.staff_id})">${esc(staffLabel(j))}</button></div><div class="working-time">${j.start_time||'-'} 시작 · 현재 ${exactElapsed(j)}</div></div><button class="row-btn end" onclick="finish(${j.id})">일끝</button></div>`;
  const rowRenderer=type==='choice'?renderChoiceRow:renderWorkingRow;

  const units=[];
  grouped.forEach(list=>{
    const ordered=type==='working'
      ? [...list].sort((a,b)=>operationalElapsedMinutes(b)-operationalElapsedMinutes(a)||Number(a.id||0)-Number(b.id||0))
      : list;
    const first=ordered[0];
    const sortMinutes=type==='working'?Math.max(...ordered.map(operationalElapsedMinutes)):0;
    units.push({
      sortMinutes,
      sortId:Number(first?.id||0),
      html:`<section class="choice-group-box"><div class="choice-group-title"><span>${shopButton(first.shop_id,first.shop_name)}</span><b>${ordered.length}명</b></div><div class="choice-group-list">${ordered.map(rowRenderer).join('')}</div></section>`
    });
  });
  singles.forEach(j=>{
    const html=type==='choice'
      ? `<div class="row"><div><div class="line"><button type="button" class="staff-name-btn" onclick="showStaffProfile(${j.staff_id})">${esc(staffLabel(j))}</button>${shopButton(j.shop_id,j.shop_name)}</div><div class="working-time choice-time"><span>${j.choice_time||'-'} 선택</span><span class="choice-manager-name">${esc(managerDisplayName(j.manager||''))}</span></div>${j.sister_acknowledged_at?`<div class="sub" style="color:#059669;font-weight:800">${['테스트1','테스트2'].includes(String(j.name||''))?'언니 확인완료':'언니 수신확인'} ${new Date(String(j.sister_acknowledged_at).replace(' ','T')+'Z').toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}${String(j.sister_choice_result||'').toUpperCase()==='O'?' · <span style="color:#f97316">O 전송</span>':''}</div>`:`<div class="sub" style="color:#f97316;font-weight:800">언니 수신대기</div>`}</div><div class="mobile-action-row"><button class="row-btn" onclick="returnWaiting(${j.id})">대기</button><button class="row-btn pass" onclick="passChoice(${j.id})">통과</button></div></div>`
      : `<div class="row working-row"><div><div class="working-main"><button type="button" class="staff-name-btn working-name" onclick="showStaffProfile(${j.staff_id})">${esc(staffLabel(j))}</button>${shopButton(j.shop_id,j.shop_name)}</div><div class="working-time">${j.start_time||'-'} 시작 · 현재 ${exactElapsed(j)}</div></div><button class="row-btn end" onclick="finish(${j.id})">일끝</button></div>`;
    units.push({sortMinutes:type==='working'?operationalElapsedMinutes(j):0,sortId:Number(j.id||0),html});
  });
  if(type==='working')units.sort((a,b)=>b.sortMinutes-a.sortMinutes||a.sortId-b.sortId);
  return units.map(x=>x.html).join('');
}
function koCompare(a,b){
  return String(a||'').localeCompare(String(b||''),'ko-KR',{numeric:true,sensitivity:'base'});
}
function sortStaffList(list){
  return [...(list||[])].sort((a,b)=>koCompare(a.affiliation,b.affiliation)||koCompare(a.name,b.name)||Number(a.id||0)-Number(b.id||0));
}
function parseShopName(x){
  const name=String(x?.name||'').trim();
  const regions=['가락','강남','강동','개롱','개포','거여','길동','대치','둔촌','마천','문정','방이','삼전','선릉','성내','석촌','송파','수서','엄마손','역삼','오금','위례','일원','잠실','장지','천호','한미'];
  const region=regions.find(r=>name.startsWith(r))||'기타';
  let title=name;
  if(region!=='기타')title=name.slice(region.length).replace(/^[\s\-_/·.]+/,'').trim()||name;
  return {region,title};
}
function shopRegion(x){
  return parseShopName(x).region;
}
function shopSortName(x){
  return parseShopName(x).title;
}
function sortShopList(list){
  return [...(list||[])].sort((a,b)=>koCompare(shopRegion(a),shopRegion(b))||koCompare(shopSortName(a),shopSortName(b))||Number(a.id||0)-Number(b.id||0));
}
function staffLabel(x){
  return [x.affiliation,x.name].filter(Boolean).join(' ');
}
function staffById(id){return S.staff.find(x=>Number(x.id)===Number(id))}
function callStaff(phone){
  const p=String(phone||'').replace(/[^0-9+]/g,'');
  if(!p)return alert('등록된 전화번호가 없습니다.');
  location.href='tel:'+p;
}
function openSmsApp(phone,msg){
  const p=String(phone||'').replace(/[^0-9+]/g,'');
  if(!p)return alert('등록된 전화번호가 없습니다.');
  const body=encodeURIComponent(String(msg||''));
  const url='sms:'+p+(body?'?body='+body:'');
  window.location.assign(url);
}
function textStaff(phone){
  const p=String(phone||'').replace(/[^0-9+]/g,'');
  if(!p)return alert('등록된 전화번호가 없습니다.');

  modal('문자 보내기',`
    <label>문자 내용</label>
    <textarea name="sms_message" class="sms-message-box" rows="3" maxlength="500" placeholder="문자 내용을 입력하세요"></textarea>
    <div class="archive-note">3줄까지 바로 보이고, 길어지면 줄바꿈됩니다.</div>`,
    async f=>{
      const msg=String(f.get('sms_message')||'');
      $('#dlg').close();
      setTimeout(()=>openSmsApp(p,msg),50);
    }
  );

  const ok=$('#form menu button[value="ok"]');
  if(ok)ok.textContent='전송';
}
function showStaffProfile(staffId){
  const s=staffById(staffId);
  if(!s)return alert('언니 정보를 찾을 수 없습니다.');
  modal('언니 정보',`<div class="staff-profile"><div class="staff-profile-name">${esc(staffLabel(s))}</div><div class="staff-profile-phone">${esc(s.phone||'전화번호 없음')}</div><div class="staff-profile-memo">${esc(s.memo||'메모 없음').replace(/\n/g,'<br>')}</div></div>`,async()=>{});
  const menu=$('#form menu');menu.innerHTML='';
  const call=document.createElement('button');call.type='button';call.className='btn green';call.textContent='전화하기';call.onclick=()=>callStaff(s.phone);
  const sms=document.createElement('button');sms.type='button';sms.className='btn primary';sms.textContent='문자';sms.onclick=()=>textStaff(s.phone);
  const edit=document.createElement('button');edit.type='button';edit.className='btn edit-profile-btn';edit.textContent='수정';edit.onclick=()=>editStaff(s.id);
  const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='닫기';close.onclick=()=>$('#dlg').close();
  const appLink=document.createElement('button');appLink.type='button';appLink.className='btn sister-app-link-btn';appLink.textContent='언니앱';appLink.onclick=async()=>{try{const d=await api('/sister/link',{method:'POST',body:JSON.stringify({staff_id:s.id})});await navigator.clipboard?.writeText(d.url);modal('언니앱 접속',`<div class="staff-profile"><div class="staff-profile-name">${esc(d.name)}</div><div class="staff-profile-phone">비밀번호 ${esc(d.pin)}</div><textarea class="memo-box" readonly>${esc(d.url)}</textarea><div class="notice">주소를 열어 홈 화면에 추가하면 앱처럼 설치됩니다.</div></div>`,async()=>{});const mm=$('#form menu');mm.innerHTML='';const open=document.createElement('button');open.type='button';open.className='btn primary';open.textContent='앱 열기';open.onclick=()=>window.open(d.url,'_blank');const copy=document.createElement('button');copy.type='button';copy.className='btn';copy.textContent='주소복사';copy.onclick=async()=>{await navigator.clipboard.writeText(d.url);alert('복사했습니다.')};const close2=document.createElement('button');close2.type='button';close2.className='btn';close2.textContent='닫기';close2.onclick=()=>$('#dlg').close();mm.append(open,copy,close2)}catch(e){alert(e.message)}};
  if(isBigManagerClient())menu.append(call,sms,appLink,edit,close);else menu.append(call,sms,edit,close);
}
function formatArrivalTime(value){
  try{
    const raw=String(value||'').trim();
    if(!raw)return '';
    const m=raw.match(/(?:^|\s)([0-2]?\d):([0-5]\d)(?:\s|$)/);
    if(!m)return raw;
    let hour=Number(m[1]);
    const minute=m[2];
    if(!Number.isFinite(hour)||hour<0||hour>23)return raw;
    const period=hour<12?'오전':'오후';
    const h12=hour%12||12;
    return `${period} ${h12}:${minute}`;
  }catch(_){
    return '';
  }
}

function testSettlementAnalysis(row){try{return typeof row.analysis_json==='string'?JSON.parse(row.analysis_json||'{}'):(row.analysis_json||{})}catch(_){return {}}}
function ensureTestSettlementPanels(){let wrap=document.getElementById('testSettlementWrap');if(!isBigManagerClient()){wrap?.remove();return null}if(wrap)return wrap;wrap=document.createElement('section');wrap.id='testSettlementWrap';wrap.innerHTML=`<details class="card section-card" open><summary><span>언니 정산정보</span> <span id="testPendingBadge">0건</span></summary><div id="testPendingList" class="list"></div></details><details class="card section-card"><summary><span>정산확인</span> <span id="testReviewBadge">0건</span></summary><div id="testReviewList" class="list"></div></details>`;const main=document.querySelector('main');const manage=document.querySelector('section.manage');if(main){if(manage&&manage.parentNode===main)main.insertBefore(wrap,manage);else main.appendChild(wrap)}return wrap}
function reportCompare(r){const mt=r.manager_t??r.t_value,mr=r.manager_r??r.r_value,my=r.manager_yc??r.yc_value,at=r.agreed_t??mt,ar=r.agreed_r??mr,ay=r.agreed_yc??my;return {mt,mr,my,at,ar,ay}}
function renderTestSisterSettlements(){const wrap=ensureTestSettlementPanels();if(!wrap)return;const pending=S.test_settlement_pending||[],review=S.test_settlement_review||[];$('#testPendingBadge').textContent=pending.length+'건';$('#testReviewBadge').textContent=review.length+'건';$('#testPendingList').innerHTML=pending.length?pending.map(r=>`<article class="sister-settlement-item"><div class="sister-settlement-head"><b>${esc(r.name)}</b><span>${esc(r.shop_name||'')}</span></div><div class="sister-ai-box">언니 입력값 · T ${r.t_value} / R ${r.r_value} / ㅇㅊ ${r.yc_value}</div><div class="mobile-action-row" style="justify-content:flex-end"><button class="row-btn pass" onclick="confirmTestSettlement(${r.id})">확인</button><button class="row-btn" onclick="editTestSettlement(${r.id})">수정</button></div></article>`).join(''):'<div class="empty">전송된 정산정보가 없습니다.</div>';$('#testReviewList').innerHTML=review.length?review.map(r=>{const c=reportCompare(r),changed=Number(r.t_value)!==Number(c.mt)||Number(r.r_value)!==Number(c.mr)||Number(r.yc_value)!==Number(c.my);return `<article class="sister-settlement-item"><div class="sister-settlement-head"><b>${esc(r.name)}</b><span>${esc(r.shop_name||'')}</span></div><div class="sister-original-message">언니 입력 · T ${r.t_value} / R ${r.r_value} / ㅇㅊ ${r.yc_value}</div><div class="sister-ai-box">${changed?'큰실장 수정':'큰실장 확인'} · T ${c.mt} / R ${c.mr} / ㅇㅊ ${c.my}${(r.agreed_t!=null||r.agreed_r!=null||r.agreed_yc!=null)?`<br><b>협의값 · T ${c.at} / R ${c.ar} / ㅇㅊ ${c.ay}</b>`:''}</div><div class="mobile-action-row" style="justify-content:flex-end"><button class="row-btn" onclick="agreeEditTestSettlement(${r.id})">협의수정</button><button class="row-btn pass" onclick="finalTestSettlement(${r.id})">최종확인</button></div></article>`}).join(''):'<div class="empty">정산확인 건이 없습니다.</div>'}
async function confirmTestSettlement(id){await api('/test-settlement/review',{method:'POST',body:JSON.stringify({id,mode:'confirm'})});await refresh(true)}
function editTestSettlement(id){const r=(S.test_settlement_pending||[]).find(x=>Number(x.id)===Number(id));if(!r)return;modal('언니 정산정보 수정',`<div class="notice">언니 입력 · T ${r.t_value} / R ${r.r_value} / ㅇㅊ ${r.yc_value}</div><label>T</label><input name="t_value" type="number" step="0.5" min="0" value="${r.t_value}"><label>R</label><input name="r_value" type="number" step="1" min="0" value="${r.r_value}"><label>ㅇㅊ</label><input name="yc_value" type="number" step="1" min="0" value="${r.yc_value}">`,async f=>api('/test-settlement/review',{method:'POST',body:JSON.stringify({id,mode:'edit',t_value:Number(f.get('t_value')),r_value:Number(f.get('r_value')),yc_value:Number(f.get('yc_value'))})}),'수정완료')}
function agreeEditTestSettlement(id){const r=(S.test_settlement_review||[]).find(x=>Number(x.id)===Number(id));if(!r)return;const c=reportCompare(r);modal('협의수정',`<div class="notice">언니 입력 · T ${r.t_value} / R ${r.r_value} / ㅇㅊ ${r.yc_value}<br>큰실장 값 · T ${c.mt} / R ${c.mr} / ㅇㅊ ${c.my}</div><label>T</label><input name="t_value" type="number" step="0.5" min="0" value="${c.at}"><label>R</label><input name="r_value" type="number" min="0" value="${c.ar}"><label>ㅇㅊ</label><input name="yc_value" type="number" min="0" value="${c.ay}">`,async f=>api('/test-settlement/agreed-edit',{method:'POST',body:JSON.stringify({id,t_value:Number(f.get('t_value')),r_value:Number(f.get('r_value')),yc_value:Number(f.get('yc_value'))})}),'저장')}
async function finalTestSettlement(id){if(!confirm('이 정산을 최종확인할까요?'))return;await api('/test-settlement/final',{method:'POST',body:JSON.stringify({id})});await refresh(true)}
function render(){
  presence();
  applyManagerView();
  renderTestSisterSettlements();

  const attendance=uniqueAttendance(S.attendance||[]);
  const cw=attendance.filter(a=>a.status==='출근대기');
  const jm=attendance.filter(a=>a.status==='ㅈㅁ');
  const jobs=uniqueJobRows(S.jobs||[]);

  // 중복 방지는 '같은 언니가 서로 다른 상태 목록에 동시에 보이는 것'만 막는다.
  // 다른 언니들은 초이스중 인원이 이미 있어도 제한 없이 각각 새 초이스를 시작할 수 있어야 한다.
  // jobs 기준으로 일중을 최우선, 초이스를 그 다음으로 잡고 대기에서 해당 언니만 제외한다.
  const latestWorkingByStaff=new Map();
  const latestChoiceByStaff=new Map();
  for(const j of jobs){
    const sid=Number(j.staff_id);
    if(!sid)continue;
    if(j.status==='시간중'){
      const prev=latestWorkingByStaff.get(sid);
      if(!prev||Number(j.id)>Number(prev.id))latestWorkingByStaff.set(sid,j);
    }else if(j.status==='초이스중'){
      const prev=latestChoiceByStaff.get(sid);
      if(!prev||Number(j.id)>Number(prev.id))latestChoiceByStaff.set(sid,j);
    }
  }
  const workingStaffIds=new Set(latestWorkingByStaff.keys());
  const choiceStaffIds=new Set([...latestChoiceByStaff.keys()].filter(sid=>!workingStaffIds.has(sid)));
  const r=[...latestWorkingByStaff.values()].sort((a,b)=>operationalElapsedMinutes(b)-operationalElapsedMinutes(a)||Number(a.id||0)-Number(b.id||0));
  const c=[...latestChoiceByStaff.entries()].filter(([sid])=>choiceStaffIds.has(sid)).map(([,j])=>j);
  const w=attendance.filter(a=>a.status==='대기'&&!workingStaffIds.has(Number(a.staff_id))&&!choiceStaffIds.has(Number(a.staff_id))).sort((a,b)=>Number(a.sequence||0)-Number(b.sequence||0)||Number(a.id||0)-Number(b.id||0));
  const p=SETTLEMENT_ENABLED?jobs.filter(j=>j.status==='정산대기'):[];
  const d=SETTLEMENT_ENABLED?jobs.filter(j=>['퇴근정산','정산완료'].includes(j.status)):[];

  [['waiting',w],['choice',c],['working',r],['pending',p]].forEach(([k,a])=>{
    $('#'+k+'Count').textContent=a.length;
    $('#'+k+'Badge').textContent=a.length+(k==='pending'?'건':'명');
  });
  $('#checkinWaitingBadge').textContent=cw.length+'명';
  $('#jmBadge').textContent=jm.length+'명';
  $('#doneBadge').textContent=d.length+'건';

  const checkinWaitingList=$('#checkinWaitingList');
  if(checkinWaitingList){
    checkinWaitingList.hidden=false;
    checkinWaitingList.style.setProperty('display','block','important');
    checkinWaitingList.style.setProperty('visibility','visible','important');
    checkinWaitingList.style.setProperty('height','auto','important');
    let parent=checkinWaitingList.parentElement;
    for(let i=0;parent&&i<2;i++,parent=parent.parentElement){
      parent.hidden=false;
      if(getComputedStyle(parent).display==='none')parent.style.setProperty('display','block','important');
      parent.style.setProperty('height','auto','important');
      parent.style.setProperty('overflow','visible','important');
    }
  }
  checkinWaitingList.innerHTML=cw.length?cw.map(a=>{
    const memo=String(a.memo||'');
    const sisterRequested=/언니앱 출근예약/.test(memo);
    const assignedManager=String(a.manager||'').trim();
    const etaMatch=memo.match(/도착예정\s*([0-2]?\d:[0-5]\d)/);
    const etaText=sisterRequested&&etaMatch?formatArrivalTime(etaMatch[1]):'';
    const pickupInfo=assignedManager?`<div class="notice" style="margin:0;height:100%;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span>픽업실장: <b>${esc(assignedManager==='본인출근'?'본인출근':managerDisplayName(assignedManager))}</b></span>${etaText?`<span>· ${esc(etaText)}</span>`:''}</div>`:'';
    return `
    <div class="row checkin-wait-row" style="display:block;padding:14px">
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center">
        <button type="button" class="staff-name-btn" style="text-align:left;min-width:0" onclick="showStaffProfile(${a.staff_id})">${esc(staffLabel(a))}</button>
        <div class="checkin-wait-actions" style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
          <button class="row-btn cancel-checkin" onclick="cancelCheckinWaiting(${a.id})">출근취소</button>
          <button class="row-btn jm-btn" onclick="openPickupRequestManager(${a.id})">픽업요청</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:stretch;margin-top:10px">
        <div>${pickupInfo}</div>
        <button class="row-btn checkin-row-btn" style="min-width:72px;height:100%" onclick="activateCheckin(${a.id})">출근</button>
      </div>
    </div>`}).join(''):'<div class="empty">출근대기 인원이 없습니다.</div>';

  renderWaitingTitleControls(w);
  if(!w.length){
    if(multiChoiceMode)cancelMultiChoice();
    $('#waitingList').innerHTML='<div class="empty">대기 인원이 없습니다.</div>';
  }else if(!multiChoiceMode){
    $('#waitingList').innerHTML=w.map(a=>waitingRowHtml(a,false)).join('');
  }else{
    const selectedSet=multiChoiceSelectedSet();
    const selectedRows=multiChoiceSelected.map(id=>w.find(a=>Number(a.id)===Number(id))).filter(Boolean);
    multiChoiceSelected=selectedRows.map(a=>Number(a.id));
    const unselected=w.filter(a=>!selectedSet.has(Number(a.id)));
    const selectedHtml=selectedRows.length?`<section class="multi-choice-selected-box"><div class="multi-choice-selected-head"><div><div class="multi-choice-selected-title">선택된 언니 ${selectedRows.length}명</div><div class="multi-choice-selected-desc">선택한 순서대로 위에 정렬되었습니다. 노래방선택을 누르면 한 번에 초이스로 이동합니다.</div></div></div><div class="multi-choice-selected-list">${selectedRows.map((a,idx)=>waitingRowHtml(a,true,idx+1)).join('')}</div><div class="multi-choice-box-actions"><button type="button" class="multi-choice-shop-btn" onclick="choiceMultiple()">노래방선택</button></div></section>`:'';
    $('#waitingList').innerHTML=selectedHtml+unselected.map(a=>waitingRowHtml(a,false)).join('');
  }

  $('#choiceList').innerHTML=c.length?groupedJobsHtml(c,'choice'):'<div class="empty">초이스 진행이 없습니다.</div>';

  $('#workingList').innerHTML=r.length?groupedJobsHtml(r,'working'):'<div class="empty">현재 일중인 인원이 없습니다.</div>';

  $('#pickupList').innerHTML=uniquePickupRows(S.pickups||[]).filter(x=>!Number(x.completed)).length?uniquePickupRows(S.pickups||[]).filter(x=>!Number(x.completed)).map(x=>`<div class="row pickup-row"><div><div class="line"><button type="button" class="staff-name-btn" onclick="showStaffProfile(${x.staff_id})">${esc(staffLabel(x))}</button>${shopButton(x.shop_id,x.shop_name||'')}</div><div class="pickup-detail" style="font-size:18px;font-weight:800;line-height:1.55;margin-top:10px;color:#334155"><div>언니앱 요청시간 ${esc((x.request_received_at||x.finished_time||'-').toString().slice(11,16)||x.finished_time||'-')}</div><div>${esc(x.request_type||'픽업 요청')}</div><div>담당실장 ${esc(managerDisplayName(x.manager||''))}</div><div>예상 도착시간 ${esc(x.expected_arrival||'-')}</div></div></div><div class="pickup-action-row"><button type="button" class="row-btn pickup-return-btn ${x.returning_at?'active':''}" onclick="completePickup(${Number(x.id)},${x.returning_at?1:0})">복귀중</button><button type="button" class="row-btn pickup-site-btn ${x.returning_at?'done':''}" ${x.returning_at?'disabled':''} onclick="markPickupReturning(${Number(x.id)})">현장픽업</button></div></div>`).join(''):'<div class="empty">픽업대기 인원이 없습니다.</div>';
$('#pickupBadge').textContent=uniquePickupRows(S.pickups||[]).filter(x=>!Number(x.completed)).length+'명';
$('#jmList').innerHTML=jm.length?jm.map(a=>`
    <div class="row">
      <div>
        <div class="line">
          <button type="button" class="staff-name-btn" onclick="showStaffProfile(${a.staff_id})">${esc(staffLabel(a))}</button>
          ${tags(a.work_types)}
        </div>
        <div class="sub">${esc(a.memo||'')}</div>
      </div>
      <div class="mobile-action-row">
        <button class="row-btn" onclick="jmToWaiting(${a.id})">대기</button>
        <button class="row-btn end" onclick="finishJm(${a.id})">일끝</button>
      </div>
    </div>`).join(''):'<div class="empty">ㅈㅁ 인원이 없습니다.</div>';

  const pendingGroups=Object.values(p.reduce((acc,j)=>{
    const k=String(j.staff_id);
    if(!acc[k])acc[k]={name:j.name,items:[]};
    acc[k].items.push(j);
    return acc;
  },{}));

  $('#pendingList').innerHTML=pendingGroups.length?pendingGroups.map(g=>`
    <div class="pending-staff-group">
      <div class="pending-staff-name">${esc(g.name)}</div>
      ${g.items.map(j=>`
        <div class="pending-item">
          <div class="pending-info">
            <b>${esc(j.received_time||j.end_time||'-')}</b> · ${esc(j.manager||'-')}<br>
            ${shopButton(j.shop_id,j.shop_name)} · 실제 ${exactElapsed(j)}<br>
            ${esc(j.received_info||'전달내용 없음').replace(/\n/g,'<br>')}
          </div>
          <button class="row-btn settle" onclick="settle(${j.id})">정산</button>
        </div>`).join('')}
    </div>`).join(''):'<div class="empty">정산대기 건이 없습니다.</div>';

  const groupedDone=Object.values(d.reduce((acc,j)=>{
    const k=String(j.staff_id);
    if(!acc[k])acc[k]={staff_id:j.staff_id,name:j.name,items:[],total:0};
    acc[k].items.push(j);
    acc[k].total+=Number(j.total||0);
    return acc;
  },{}));

  $('#doneList').innerHTML=groupedDone.length?groupedDone.map(g=>`
    <div class="row done-group ${(S.archives||[]).some(a=>a.archive_type==='staff'&&Number(a.staff_id)===Number(g.staff_id))?'finalized-row':''}">
      <div class="done-group-main" onclick="staffHistory(${g.staff_id})">
        <div class="line"><strong>${esc(g.name)}</strong><span>${g.items.length}건</span></div>
        <div class="sub">오늘 누적 ${won(g.total)}</div>
        <div class="done-edit-list">
          ${g.items.map(j=>`
            <div class="done-edit-item">
              <span>${shopButton(j.shop_id,j.shop_name)} · ${won(j.total)}</span>
              <button type="button" class="btn compact edit-settlement-btn" onclick="event.stopPropagation();reopenSettlement(${j.id})">수정</button>
            </div>`).join('')}
        </div>
      </div>
      <button class="row-btn" onclick="staffHistory(${g.staff_id})">보기</button>
    </div>`).join(''):'<div class="empty">퇴근정산 건이 없습니다.</div>';

  masters();
  renderTodayWorkLogs();
}

async function loadTodayWorkLogs(){
  try{
    return await api('/work-logs/today');
  }catch(e){
    return {ok:false,message:e.message||'오늘 일한현황을 불러오지 못했습니다.',items:[],groups:[],totals:{staff_count:0,job_count:0,total_minutes:0}};
  }
}
function fmtMinutes(mins){
  mins=Number(mins||0);
  const h=Math.floor(mins/60),m=mins%60;
  return h>0?`${h}시간 ${m}분`:`${m}분`;
}
function parseWorkInfo(info){
  const text=String(info||'');
  const out={time:[],room:[],och:[]};
  text.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean).forEach(part=>{
    const m=part.match(/^(타임|Room|room|ROOM|ㅇㅊ)\s+(.+)$/);
    if(!m)return;
    const key=m[1]==='타임'?'time':(m[1]==='ㅇㅊ'?'och':'room');
    String(m[2]||'').split(/[\/|+\s]+/).map(v=>v.trim()).filter(Boolean).forEach(v=>{
      if(key==='time'&&(v==='반'||v==='0.5'))v='반티';
      if(!out[key].includes(v))out[key].push(v);
    });
  });
  return out;
}
function workInfoLine(info){
  const p=parseWorkInfo(info);
  const parts=[];
  if(p.time.length)parts.push('타임 '+p.time.join('/'));
  if(p.room.length)parts.push('Room '+p.room.join('/'));
  if(p.och.length)parts.push('ㅇㅊ '+p.och.join('/'));
  return parts.join(' · ');
}
function summarizeWorkInfo(groups){
  const summary={time:{},room:{},och:{}};
  (groups||[]).forEach(g=>(g.items||[]).forEach(x=>{
    const p=parseWorkInfo(x.received_info||'');
    p.time.forEach(v=>summary.time[v]=(summary.time[v]||0)+1);
    p.room.forEach(v=>summary.room[v]=(summary.room[v]||0)+1);
    p.och.forEach(v=>summary.och[v]=(summary.och[v]||0)+1);
  }));
  const line=(label,obj,order)=>{
    const parts=order.filter(v=>obj[v]).map(v=>`${v} ${obj[v]}건`);
    return parts.length?`<div class="work-log-stat-line"><b>${label}</b><span>${parts.join(' · ')}</span></div>`:'';
  };
  return [
    line('타임',summary.time,['바로','반티','1','2','3','4']),
    line('Room',summary.room,['1','2','3']),
    line('ㅇㅊ',summary.och,['1','2','3'])
  ].filter(Boolean).join('');
}
function finishInfoEditorHtml(current=''){
  const parsed=parseWorkInfo(current);
  const row=(label,key,values)=>`
    <div class="finish-row worklog-edit-row">
      <div class="finish-label">${label}</div>
      <div class="finish-options worklog-edit-options" data-group="${label}">
        ${values.map(v=>`<button type="button" data-value="${v}" class="${parsed[key].includes(v)?'active':''}" onclick="toggleWorkLogEditValue(this)">${v}</button>`).join('')}
      </div>
    </div>`;
  return `
    <div class="finish-select-wrap worklog-edit-wrap">
      ${row('타임','time',['바로','반티','1','2','3','4'])}
      ${row('Room','room',['1','2','3'])}
      ${row('ㅇㅊ','och',['1','2','3'])}
    </div>
    <input type="hidden" name="received_info" id="workLogEditInfo" value="${esc(current)}">`;
}
function updateWorkLogEditHidden(){
  const values=[...document.querySelectorAll('.worklog-edit-options')].flatMap(g=>{
    return [...g.querySelectorAll('button.active')].map(x=>`${g.dataset.group} ${x.dataset.value}`);
  });
  const hidden=$('#workLogEditInfo');
  if(hidden)hidden.value=values.join(', ');
}
window.toggleWorkLogEditValue=btn=>{
  btn.classList.toggle('active');
  updateWorkLogEditHidden();
};
function editWorkLogInfo(itemId,jobId,current=''){
  if(activeManager!=='실장A')return alert('colra1만 수정할 수 있습니다.');
  modal('일한현황 정보 수정',finishInfoEditorHtml(current),async f=>{
    const received=f.get('received_info')||'';
    if(!received)throw new Error('타임, Room, ㅇㅊ 중 선택값을 입력해 주세요.');
    await api('/work-logs/update-info',{
      method:'POST',
      body:JSON.stringify({id:itemId||null,job_id:jobId||null,received_info:received,manager:activeManager})
    });
    await refresh(true);
  });
  updateWorkLogEditHidden();
  $('#form menu button[value="ok"]').textContent='저장';
}
async function deleteAllTodayWorkLogs(day){
  if(activeManager!=='실장A')return alert('colra1만 전체삭제할 수 있습니다.');
  if(!confirm('현재 표시된 일한현황을 화면에서만 지우시겠습니까?\nDB 원본 기록은 그대로 보관됩니다.'))return;
  await api('/work-logs/delete-all',{method:'POST',body:JSON.stringify({day,manager:activeManager})});
  await refresh(true);
}
window.deleteAllTodayWorkLogs=deleteAllTodayWorkLogs;
async function hideWorkLogDay(event,day){
  if(event){event.preventDefault();event.stopPropagation();}
  if(activeManager!=='실장A')return alert('colra1만 해당 날짜를 삭제할 수 있습니다.');
  if(!confirm(`${day} 일한현황을 화면에서 전체 삭제하시겠습니까?\nDB 원본 기록은 그대로 보관됩니다.`))return;
  await api('/work-logs/delete-all',{method:'POST',body:JSON.stringify({day,manager:activeManager})});
  await refresh(true);
}
window.hideWorkLogDay=hideWorkLogDay;
async function deleteWorkLogItem(itemId,jobId,label='',staffName=''){
  if(activeManager!=='실장A')return alert('colra1만 삭제할 수 있습니다.');
  if(!confirm(`${label||'선택한 기록'}을 일한현황에서 완전히 삭제하시겠습니까?\n이 기록은 DB에서도 삭제되며 복구되지 않습니다.`))return;
  await api('/work-logs/delete-item',{method:'POST',body:JSON.stringify({id:itemId||null,job_id:jobId||null,staff_name:staffName||'',manager:activeManager})});
  alert('콜라 테스트 기록을 완전히 삭제했습니다.');
  await refresh(true);
}
window.deleteWorkLogItem=deleteWorkLogItem;
function ensureWorkLogSection(){
  const manage=document.querySelector('section.manage');
  if(!manage)return;
  if(!$('#todayWorkLogSection')){
    const wrap=document.createElement('details');
    wrap.id='todayWorkLogSection';
    wrap.className='today-work-log-section';
    wrap.innerHTML=`
      <summary>오늘 일한현황</summary>
      <div id="todayWorkLogBody" class="today-work-log-body">
        <div class="empty">오늘 일한현황이 없습니다.</div>
      </div>`;
    manage.insertBefore(wrap,manage.firstChild);
  }
  if(!$('#workLogSearchSection')){
    const search=document.createElement('details');
    search.id='workLogSearchSection';
    search.className='work-log-search-section';
    search.innerHTML=`
      <summary>일한내역 검색</summary>
      <div class="work-log-search-form">
        <label class="work-log-search-label"><span class="work-log-search-text">이름</span><input type="text" id="workLogSearchStaff" placeholder="언니 이름"></label>
        <label class="work-log-search-label"><span class="work-log-search-text">노래방</span><input type="text" id="workLogSearchShop" placeholder="노래방 이름"></label>
        <label class="work-log-search-label work-log-date-label"><span class="work-log-search-text">날짜선택</span><div class="work-log-date-range"><input type="date" id="workLogSearchStartDate"><input type="date" id="workLogSearchEndDate"></div></label>
        <button type="button" class="btn primary work-log-search-open" onclick="openWorkLogPeriodSearch()">검색</button>
      </div>`;
    const today=$('#todayWorkLogSection');
    today.insertAdjacentElement('afterend',search);
  }
}
let workLogSearchDays=3;
function openWorkLogPeriodSearch(){
  if(activeManager!=='실장A')return;
  const staff=String($('#workLogSearchStaff')?.value||'').trim();
  const shop=String($('#workLogSearchShop')?.value||'').trim();
  const inputStartDate=String($('#workLogSearchStartDate')?.value||'').trim();
  const inputEndDate=String($('#workLogSearchEndDate')?.value||'').trim();
  const hasDate=!!(inputStartDate||inputEndDate);
  if(!staff&&!shop&&!hasDate)return alert('이름, 노래방, 날짜선택 중 한 가지 이상 입력해 주세요.');
  const startDate=inputStartDate||inputEndDate;
  const endDate=inputEndDate||inputStartDate;
  if(startDate&&endDate&&startDate>endDate)return alert('시작일이 종료일보다 늦을 수 없습니다.');
  if(hasDate){
    const params=new URLSearchParams();
    if(staff)params.set('staff',staff);
    if(shop)params.set('shop',shop);
    params.set('start_date',startDate);
    params.set('end_date',endDate);
    api('/work-logs/search?'+params.toString()).then(data=>{
      showWorkLogSearchResults(data,staff,shop,0,startDate,endDate);
    }).catch(e=>alert(e.message));
    return;
  }
  workLogSearchDays=3;
  modal('검색기간 선택',`
    <div class="work-log-period-help">검색할 기간을 선택하세요.</div>
    <div class="work-log-period-buttons">
      ${[3,7,14,30].map(n=>`<button type="button" class="work-log-period-btn ${n===3?'active':''}" data-days="${n}" onclick="selectWorkLogSearchDays(this,${n})">${n}일</button>`).join('')}
    </div>
    <input type="hidden" name="staff" value="${esc(staff)}">
    <input type="hidden" name="shop" value="${esc(shop)}">`,
    async f=>{
      const params=new URLSearchParams({days:String(workLogSearchDays)});
      const name=String(f.get('staff')||'').trim(),shopName=String(f.get('shop')||'').trim();
      if(name)params.set('staff',name);
      if(shopName)params.set('shop',shopName);
      const data=await api('/work-logs/search?'+params.toString());
      $('#form').reset();
      $('#dlg').close();
      setTimeout(()=>showWorkLogSearchResults(data,name,shopName,workLogSearchDays,'',''),30);
      return false;
    },'검색');
}
function selectWorkLogSearchDays(btn,days){
  workLogSearchDays=Number(days)||3;
  document.querySelectorAll('.work-log-period-btn').forEach(x=>x.classList.toggle('active',x===btn));
}
function showWorkLogSearchResults(data,staff,shop,days,startDate='',endDate=''){
  const items=Array.isArray(data?.items)?data.items:[];
  let rows='';
  if(items.length){
    const dayMap=new Map();
    items.forEach(x=>{
      const day=String(x.day||'-');
      if(!dayMap.has(day))dayMap.set(day,new Map());
      const staffLabel=[x.staff_affiliation,x.staff_name].filter(Boolean).join(' ')||x.staff_name||'-';
      if(!dayMap.get(day).has(staffLabel))dayMap.get(day).set(staffLabel,[]);
      dayMap.get(day).get(staffLabel).push(x);
    });
    rows=[...dayMap.entries()].map(([day,staffMap])=>`<section class="work-log-search-day-group"><div class="work-log-search-day-title">${esc(day)}</div><div class="work-log-search-day-body">${[...staffMap.entries()].map(([staffLabel,list])=>`<div class="work-log-search-staff-group"><div class="work-log-search-staff-title">${esc(staffLabel)} <span>${list.length}건</span></div><div class="work-log-search-staff-list">${list.map(x=>`<div class="work-log-search-entry"><div class="work-log-search-entry-top"><div class="work-log-search-shop">${esc(x.shop_name||'-')}</div><div class="work-log-search-time">${esc(x.start_time||'-')} ~ ${esc(x.end_time||'-')}</div></div><div class="work-log-search-info">${esc(x.received_info||'입력값 없음')}</div></div>`).join('')}</div></div>`).join('')}</div></section>`).join('');
  }else{
    rows=`<div class="empty">검색된 일한내역이 없습니다.</div>`;
  }
  const periodText=(startDate||endDate)
    ? `기간 ${esc(startDate||'시작미지정')} ~ ${esc(endDate||'종료미지정')}`
    : `최근 ${days}일`;
  modal('일한내역 검색결과',`
    <div class="work-log-search-summary">${periodText}${staff?` · 이름 ${esc(staff)}`:''}${shop?` · 노래방 ${esc(shop)}`:''} · ${items.length}건</div>
    <div class="work-log-search-results grouped">${rows}</div>`,
    async()=>true,'확인하고 닫기','');
}
window.openWorkLogPeriodSearch=openWorkLogPeriodSearch;
window.selectWorkLogSearchDays=selectWorkLogSearchDays;

function workLogDayHtml(data,{allowDelete=false}={}){
  const groups=data?.groups||[],totals=data?.totals||{staff_count:0,job_count:0,total_minutes:0};
  if(!groups.length)return '<div class="empty">일한현황이 없습니다.</div>';
  return `<div class="work-log-total"><span>${esc(data.day||'오늘')} 전체 <b>${Number(totals.staff_count||0)}명</b></span><span><b>${Number(totals.job_count||0)}건</b></span><span>총 <b>${fmtMinutes(totals.total_minutes||0)}</b></span>${allowDelete?`<button type="button" class="row-btn danger" onclick="deleteAllTodayWorkLogs('${esc(data.day||'')}')">전체삭제</button>`:''}</div><div class="work-log-groups">${groups.map(g=>`<div class="work-log-group"><div class="work-log-head"><div class="work-log-staff">${esc(g.staff_label||g.staff_name||'-')}</div><div class="work-log-badge">${Number(g.job_count||0)}건 · 총 ${fmtMinutes(g.total_minutes||0)}</div></div><div class="work-log-list">${(g.items||[]).map(x=>{const info=workInfoLine(x.received_info||'');const label=[x.staff_name,x.shop_name].filter(Boolean).join(' · ');return `<div class="work-log-item"><div class="work-log-item-top"><div class="work-log-shop">${esc(x.shop_name||'-')}</div>${activeManager==='실장A'?`<div style="display:flex;gap:6px;align-items:center">${String(g.staff_label||g.staff_name||x.staff_name||'').trim()==='콜라 테스트'?`<button type="button" class="work-log-edit-btn" onclick="deleteWorkLogItem(${Number(x.id||0)},${Number(x.job_id||0)},${JSON.stringify(label).replace(/"/g,'&quot;')},${JSON.stringify(String(x.staff_name||g.staff_name||'')).replace(/"/g,'&quot;')})">삭제</button>`:''}<button type="button" class="work-log-edit-btn" onclick="editWorkLogInfo(${Number(x.id||0)},${Number(x.job_id||0)},${JSON.stringify(x.received_info||'').replace(/"/g,'&quot;')})">수정</button></div>`:''}</div><div class="work-log-time">${esc(x.start_time||'-')} ~ ${esc(x.end_time||'-')} · 집계 ${fmtMinutes((x.counted_minutes??x.elapsed_minutes)||0)}${Number((x.actual_minutes??x.elapsed_minutes)||0)!==Number((x.counted_minutes??x.elapsed_minutes)||0)?` (실제 ${fmtMinutes((x.actual_minutes??x.elapsed_minutes)||0)})`:''}</div><div class="work-log-sub">${esc(managerDisplayName(x.manager||''))}</div>${info?`<div class="work-log-note">${esc(info)}</div>`:''}</div>`}).join('')}</div></div>`).join('')}</div>`;
}
async function renderTodayWorkLogs(){
  ensureWorkLogSection();
  const sec=$('#todayWorkLogSection');
  const body=$('#todayWorkLogBody');
  if(!sec||!body)return;

  const searchSec=$('#workLogSearchSection');
  if(activeManager!=='실장A'){
    sec.style.display='none';
    if(searchSec)searchSec.style.display='none';
    return;
  }
  sec.style.display='';
  if(searchSec)searchSec.style.display='';

  const data=await loadTodayWorkLogs();
  if(!data.ok){
    body.innerHTML=`<div class="empty">오늘 일한현황 준비중: ${esc(data.message||'SQL 확인 필요')}</div>`;
    return;
  }

  sec.open=false;
  const historyDays=Array.isArray(data.history)?data.history:(data.previous?[data.previous]:[]);
  const historyHtml=historyDays.map(day=>`<details class="work-log-day previous-work-log"><summary><span class="work-log-day-chip">${esc(day.day)} 일한현황</span><button type="button" class="row-btn work-log-hide-btn" style="margin-left:auto" onclick="hideWorkLogDay(event,'${esc(day.day)}')">해당날짜삭제</button></summary><div class="today-work-log-body">${workLogDayHtml(day,{allowDelete:true})}</div></details>`).join('');
  const currentInner=(data.groups||[]).length?workLogDayHtml(data,{allowDelete:true}):`<div class="work-log-total"><span>${esc(data.day||'오늘')} 새 영업일</span><span><b>0건</b></span><span>총 <b>0분</b></span></div><div class="empty">오후 5시 이후 첫 출근부터 집계를 시작합니다.</div>`;
  const currentHtml=`<details class="work-log-day current-work-log"><summary><span class="work-log-day-chip">${esc(data.day||'오늘')} 일한현황</span></summary><div class="today-work-log-body">${currentInner}</div></details>`;
  body.innerHTML=historyHtml+currentHtml;

}

function masters(){
  const sa=sortStaffList(S.staff.filter(x=>!+x.deleted)),sd=sortStaffList(S.staff.filter(x=>+x.deleted));
  const qa=sortShopList(S.shops.filter(x=>!+x.deleted)),qd=sortShopList(S.shops.filter(x=>+x.deleted));

  const staffOrder=['쿠팡','콜라','가나'];
  const normalizeAffiliation=v=>{
    const s=String(v||'').trim();
    if(['Ghana','ghana','GHANA'].includes(s))return '가나';
    return s||'기타';
  };
  const staffGroups=new Map();
  sa.forEach(x=>{const k=normalizeAffiliation(x.affiliation);if(!staffGroups.has(k))staffGroups.set(k,[]);staffGroups.get(k).push(x)});
  const staffKeys=[...staffGroups.keys()].sort((a,b)=>{
    const ai=staffOrder.indexOf(a),bi=staffOrder.indexOf(b);
    if(ai>=0||bi>=0)return (ai<0?999:ai)-(bi<0?999:bi);
    return koCompare(a,b);
  });
  $('#staffList').innerHTML=(staffKeys.length?staffKeys.map(group=>`<section class="master-group master-staff-group"><div class="master-group-head"><strong>${esc(group)}</strong><span>${staffGroups.get(group).length}명</span></div><div class="master-grid staff-master-grid">${staffGroups.get(group).map(x=>`<article class="master-item"><div class="master-item-head"><div class="master-item-title-row"><div class="master-item-title">${esc(x.name)}</div><div class="master-item-tags inline-tags">${tags(x.work_types)}</div></div></div><div class="master-item-actions below-actions"><button class="btn" onclick="editStaff(${x.id})">수정</button><button class="btn" onclick="delStaff(${x.id},'${esc(x.name)}')">삭제</button></div></article>`).join('')}</div></section>`).join(''):'<div class="empty">등록된 언니가 없습니다.</div>')+
    (sd.length?`<details class="master-deleted"><summary>삭제된 언니 ${sd.length}명</summary><div class="master-grid staff-master-grid">${sd.map(x=>`<article class="master-item deleted"><div class="master-item-title">${esc(normalizeAffiliation(x.affiliation))} · ${esc(x.name)}</div><div class="master-item-actions"><button class="btn" onclick="restoreStaff(${x.id})">복구</button><button class="btn danger-outline" onclick="purgeStaff(${x.id},'${esc(x.name)}')">영구삭제</button></div></article>`).join('')}</div></details>`:'');

  const shopGroups=new Map();
  qa.forEach(x=>{const k=shopRegion(x);if(!shopGroups.has(k))shopGroups.set(k,[]);shopGroups.get(k).push(x)});
  const shopKeys=[...shopGroups.keys()].sort((a,b)=>a==='기타'?1:b==='기타'?-1:koCompare(a,b));
  $('#shopList').innerHTML=(shopKeys.length?shopKeys.map(region=>`<section class="master-group master-shop-group"><div class="master-group-head"><strong>${esc(region)}</strong><span>${shopGroups.get(region).length}곳</span></div><div class="master-grid shop-master-grid">${shopGroups.get(region).map(x=>`<article class="master-item"><div class="master-item-head"><div class="master-item-title">${esc(shopSortName(x))}</div><div class="master-item-actions side-actions"><button class="btn" onclick="editShop(${x.id})">수정</button><button class="btn" onclick="delShop(${x.id},'${esc(x.name)}')">삭제</button></div></div>${x.phone?`<div class="master-item-sub">${esc(x.phone)}</div>`:''}${x.memo?`<div class="master-item-sub">${esc(x.memo)}</div>`:''}</article>`).join('')}</div></section>`).join(''):'<div class="empty">등록된 노래방이 없습니다.</div>')+
    (qd.length?`<details class="master-deleted"><summary>삭제된 노래방 ${qd.length}곳</summary><div class="master-grid shop-master-grid">${qd.map(x=>`<article class="master-item deleted"><div class="master-item-title">${esc(x.name)}</div><div class="master-item-actions"><button class="btn" onclick="restoreShop(${x.id})">복구</button><button class="btn danger-outline" onclick="purgeShop(${x.id},'${esc(x.name)}')">영구삭제</button></div></article>`).join('')}</div></details>`:'');
}
function modal(t,h,cb,okLabel='저장',cancelLabel='취소'){
  playTransitionDing();
  $('#dlgTitle').textContent=t;
  $('#dlgBody').innerHTML=h;

  const form=$('#form');
  const menu=form.querySelector('menu');

  const cancelHtml=cancelLabel?`<button type="button" id="modalCancelBtn" class="btn">${cancelLabel}</button>`:'';
  menu.innerHTML=cancelHtml+`<button type="submit" value="ok" class="btn primary">${okLabel}</button>`;

  const cancelBtn=$('#modalCancelBtn');
  if(cancelBtn){
    cancelBtn.onclick=()=>{
      form.reset();
      $('#dlg').close();
    };
  }

  $('#dlg').showModal();

  form.onsubmit=async ev=>{
    ev.preventDefault();
    try{
      const result=await cb(new FormData(form));
      if(result===false)return;
      form.reset();
      $('#dlg').close();
      if(result!=='no-refresh')refresh(true);
    }catch(x){
      alert(x.message);
    }
  };
}
$('#addStaffBtn').onclick=()=>modal('언니 등록',`<label>소속</label><input name="affiliation" required><label>이름</label><input name="name" required><label>전화번호</label><input name="phone" inputmode="tel"><label>가능 유형</label><div class="check-grid"><label class="check-card"><input type="checkbox" name="types" value="T" checked>T</label><label class="check-card"><input type="checkbox" name="types" value="M">M</label><label class="check-card"><input type="checkbox" name="types" value="ㅈㅇ">ㅈㅇ</label></div><label>메모</label><textarea name="memo" class="memo-box" rows="4" placeholder="메모를 입력하세요"></textarea>`,f=>api('/staff',{method:'POST',body:JSON.stringify({affiliation:f.get('affiliation'),name:f.get('name'),phone:f.get('phone'),work_types:f.getAll('types').join(','),memo:f.get('memo'),hourly:0,fee:0})}));
$('#addShopBtn').onclick=()=>modal('노래방 등록',`<label>노래방명</label><input name="name" required><label>전화번호</label><input name="phone"><label>메모</label><textarea name="memo"></textarea>`,f=>api('/shops',{method:'POST',body:JSON.stringify(Object.fromEntries(f))}));
function openCheckinWaitingRegister(directActive=false){
  const groups=[
    {label:'쿠팡',aliases:['쿠팡']},
    {label:'콜라',aliases:['콜라']},
    {label:'가나',aliases:['가나','Ghana','ghana','GHANA']}
  ];
  const activeStaff=S.staff.filter(x=>!+x.deleted);
  const html=`
    <label>언니 선택</label>
    <div class="staff-sector-wrap">
      ${groups.map(group=>{
        const members=activeStaff
          .filter(x=>group.aliases.includes(String(x.affiliation||'').trim()))
          .sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));
        return `<section class="staff-sector">
          <div class="staff-sector-title">${group.label}</div>
          <div class="staff-sector-grid">
            ${members.length?members.map(s=>`
              <button type="button" class="staff-choice-btn" data-staff-id="${s.id}" onclick="selectStaffChoice(this)">${esc(s.name)}</button>
            `).join(''):'<div class="empty small">등록된 언니 없음</div>'}
          </div>
        </section>`;
      }).join('')}
    </div>
    <input type="hidden" name="staff_id" id="selectedStaffId">
    <label>메모</label>
    <textarea name="memo" class="memo-box" rows="3" placeholder="메모를 입력하세요"></textarea>`;

  modal('출근 등록',html,async f=>{
    const staffId=Number(f.get('staff_id'));
    if(!staffId)throw new Error('언니를 선택해 주세요.');
    await api('/attendance',{
      method:'POST',
      body:JSON.stringify({
        staff_id:staffId,
        memo:f.get('memo'),
        manager:activeManager,
        direct_active:Boolean(directActive)
      })
    });
  });
}
window.selectStaffChoice=btn=>{
  const wasActive=btn.classList.contains('active');
  document.querySelectorAll('.staff-choice-btn').forEach(x=>x.classList.remove('active'));
  const hidden=$('#selectedStaffId');
  if(wasActive){
    hidden.value='';
    return;
  }
  btn.classList.add('active');
  hidden.value=btn.dataset.staffId;
};
$('#quickCheckInBtn').onclick=()=>openCheckinWaitingRegister(true);
if($('#checkinWaitingRegisterBtn')){$('#checkinWaitingRegisterBtn').hidden=false;$('#checkinWaitingRegisterBtn').onclick=()=>openCheckinWaitingRegister(false);}
$('#quickCheckOutBtn').onclick=()=>modal('퇴근',`<label>언니</label><select name="staff_id">${S.attendance.map(x=>`<option value="${x.staff_id}">${esc(x.name)}</option>`).join('')}</select>`,f=>api('/attendance/checkout',{method:'POST',body:JSON.stringify({staff_id:+f.get('staff_id')})}));
function splitShopName(name){
  const parsed=parseShopName({name});
  return {
    area:parsed.region||'기타',
    shop:parsed.title||String(name||'').trim()||'미분류'
  };
}
function openShopChoice(attendanceIds){
  const ids=(Array.isArray(attendanceIds)?attendanceIds:[attendanceIds]).map(Number).filter(Boolean);
  if(!ids.length)return;
  const shops=S.shops.filter(x=>!+x.deleted);
  const grouped=shops.reduce((acc,s)=>{const {area,shop}=splitShopName(s.name);(acc[area]??=[]).push({...s,display_name:shop});return acc},{});
  const areas=Object.keys(grouped).sort((a,b)=>{
    if(a==='기타'&&b!=='기타')return -1;
    if(b==='기타'&&a!=='기타')return 1;
    return a.localeCompare(b,'ko');
  });
  let selectedShopId=0;
  modal('노래방 선택',`<div class="shop-sector-wrap">${areas.map(area=>`<section class="shop-sector"><div class="shop-sector-title">${esc(area)}</div><div class="shop-sector-grid">${grouped[area].sort((a,b)=>a.display_name.localeCompare(b.display_name,'ko')).map(s=>`<button type="button" class="shop-choice-btn" data-shop-id="${s.id}">${esc(s.display_name)}</button>`).join('')}</div></section>`).join('')}</div><input type="hidden" name="shop_id" id="selectedShopId">`,async f=>{
    const shopId=Number(selectedShopId||f.get('shop_id'));
    if(!shopId)throw new Error('노래방을 선택해 주세요.');
    if(ids.length===1){
      const started=await api('/choice/start',{method:'POST',body:JSON.stringify({attendance_id:ids[0],shop_id:shopId,manager:activeManager})});
      await refresh(true);
      if(isBigManagerClient()&&Number(started?.job_id)&&!started?.reroute_pending)setTimeout(()=>openSisterSend(Number(started.job_id),shopId),80);
    }else{
      await api('/choice/start-multiple',{method:'POST',body:JSON.stringify({attendance_ids:ids,shop_id:shopId,manager:activeManager})});
      await refresh(true);
    }
    multiChoiceMode=false;multiChoiceSelected=[];multiChoiceOriginalOrder=[];
    return 'no-refresh';
  });
  const dlg=$('#dlg');
  if(dlg){
    dlg.querySelectorAll('.shop-choice-btn').forEach(btn=>{
      btn.onclick=ev=>{
        ev.preventDefault();ev.stopPropagation();
        dlg.querySelectorAll('.shop-choice-btn').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        selectedShopId=Number(btn.dataset.shopId||0);
        const hidden=dlg.querySelector('#selectedShopId');if(hidden)hidden.value=String(selectedShopId||'');
      };
    });
  }
  $('#form menu button[value="ok"]').textContent='선택완료';
}

function managerOptions(selected){const list=isBigManagerClient()?['실장T']:['실장A','실장B','실장C'];return list.map(x=>`<option value="${x}" ${x===selected?'selected':''}>${esc(managerDisplayName(x))}</option>`).join('')}
function openSisterSend(jobId,shopId=0){if(!isBigManagerClient())return;const j=(S.jobs||[]).find(x=>Number(x.id)===Number(jobId))||{id:Number(jobId),shop_id:Number(shopId),shop_name:(S.shops||[]).find(x=>Number(x.id)===Number(shopId))?.name||''};modal('초이스 전송',`<label>노래방</label><input value="${esc(j.shop_name||'')}" readonly><label>옵션</label><div class="check-grid"><label class="check-card"><input type="checkbox" name="types" value="T">T</label><label class="check-card"><input type="checkbox" name="types" value="M">M</label><label class="check-card"><input type="checkbox" name="types" value="ㅈㅇ">ㅈㅇ</label></div><label>실장</label><select name="manager">${managerOptions(activeManager)}</select><label>언니에게 보낼 안내</label><textarea name="message" placeholder="간단한 안내 메시지"></textarea>`,async f=>{const options=f.getAll('types').join(' · ');await api('/sister/send',{method:'POST',body:JSON.stringify({job_id:jobId,options,manager:f.get('manager'),message:f.get('message')||''})});alert('언니에게 전송했습니다.');return 'no-refresh'},'언니 전송')}

function choice(id){openShopChoice([id])}
function choiceMultiple(){if(!multiChoiceSelected.length)return alert('언니를 선택해 주세요.');openShopChoice([...multiChoiceSelected])}
window.selectShopChoice=btn=>{
  const wasActive=btn.classList.contains('active');
  document.querySelectorAll('.shop-choice-btn').forEach(x=>x.classList.remove('active'));
  const hidden=$('#selectedShopId');
  if(wasActive){
    hidden.value='';
    return;
  }
  btn.classList.add('active');
  hidden.value=btn.dataset.shopId;
};
async function deleteWaiting(id){
  if(!confirm('이 버튼은 언니등록을 삭제하는 것이 아니라, 현재 대기목록에서만 빼는 기능입니다.\n\n대기목록에서 삭제할까요?'))return;
  await api('/attendance/delete-waiting',{
    method:'POST',
    body:JSON.stringify({id})
  });
  await refresh(true);
}
async function completeTestPickup(id){try{await api('/pickup/complete',{method:'POST',body:JSON.stringify({id:Number(id)})});await refresh(true)}catch(e){alert('픽업완료 처리 실패: '+e.message)}}
async function markPickupReturning(id){
  try{
    await api('/pickup/returning',{method:'POST',body:JSON.stringify({id:Number(id)})});
    await refresh(true);
  }catch(e){
    alert('현장픽업 처리 실패: '+e.message);
  }
}
async function completePickup(id,isReturning){
  if(!isReturning){
    alert('현장픽업을 먼저 눌러 복귀중 상태로 바꿔 주세요.');
    return;
  }
  try{
    await api('/pickup/complete',{method:'POST',body:JSON.stringify({id:Number(id)})});
    await refresh(true);
  }catch(e){
    alert('복귀중 처리 실패: '+e.message);
  }
}
async function cancelCheckinWaiting(id){
  if(!confirm('출근대기에서 삭제할까요?'))return;
  await api('/attendance/cancel',{method:'POST',body:JSON.stringify({id})});
  await refresh(true);
}
function openPickupRequestManager(id){
  const a=(S.attendance||[]).find(x=>Number(x.id)===Number(id));
  if(!a)return alert('출근대기 건을 찾을 수 없습니다.');
  const options=pickupManagerOptions().map((m,idx)=>`<button type="button" class="staff-choice-btn pickup-manager-choice ${idx===0?'self-checkin-choice':''}" data-manager="${esc(m)}">${esc(m==='본인출근'?'본인출근':managerDisplayName(m))}</button>`).join('');
  modal('픽업요청 실장 선택',`<div class="notice"><b>${esc(staffLabel(a))}</b><br>출근 예정 ${esc(attendanceEta(a))}</div><div class="staff-sector-grid" id="pickupManagerGrid">${options}</div><input type="hidden" name="manager" id="selectedPickupManager">`,async f=>{
    const manager=String(f.get('manager')||'').trim();
    if(!manager)throw new Error('실장 또는 본인출근을 선택해 주세요.');
    await api('/attendance/pickup-request',{method:'POST',body:JSON.stringify({id,manager})});
  });
  document.querySelectorAll('.pickup-manager-choice').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.pickup-manager-choice').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    const hidden=$('#selectedPickupManager');if(hidden)hidden.value=btn.dataset.manager||'';
  }));
}
async function jmToWaiting(id){
  await api('/attendance/jm-to-waiting',{method:'POST',body:JSON.stringify({id})});
  await refresh(true);
}
async function finishJm(id){
  const a=(S.attendance||[]).find(x=>Number(x.id)===Number(id));
  if(!a)return alert('ㅈㅁ 건을 찾을 수 없습니다.');
  const row=(label,values)=>`
    <div class="finish-row">
      <div class="finish-label">${label}</div>
      <div class="finish-options time-options" data-group="${label}">
        ${values.map(v=>`<button type="button" data-value="${v}" onclick="toggleFinishValue(this)">${v}</button>`).join('')}
      </div>
    </div>`;
  modal('일끝 정보 전송',`
    <div class="received-box finish-top-box">
      <b>${esc(staffLabel(a))}</b> / ㅈㅁ<br>
      일끝 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}
    </div>
    <div class="finish-select-wrap">
      ${row('타임',['바로','반티','1','2','3','4'])}
      ${row('Room',['1','2','3'])}
      ${row('ㅇㅊ',['1','2','3'])}
    </div>
    <input type="hidden" name="selected_info" id="selectedFinishInfo">`,
    async f=>{
      const selected=f.get('selected_info')||'';
      if(!selected)throw new Error('타임, Room, ㅇㅊ 중 선택값을 입력해 주세요.');
      await api('/attendance/jm-to-pending',{
        method:'POST',
        body:JSON.stringify({id,manager:activeManager,received_info:selected})
      });
    }
  );
  $('#form menu button[value="ok"]').textContent='전송';
}
async function activateCheckin(id){
  await api('/attendance/activate',{method:'POST',body:JSON.stringify({id,manager:activeManager})});
  await refresh(true);
}
async function reopenSettlement(id){
  if(!confirm('이 정산 건을 다시 정산대기로 이동할까요?'))return;
  await api('/jobs/reopen',{method:'POST',body:JSON.stringify({id})});
  await refresh(true);
}
function editStaff(id){
  const s=S.staff.find(x=>Number(x.id)===Number(id));
  if(!s)return alert('언니 정보를 찾을 수 없습니다.');
  const selected=String(s.work_types||'').split(',');
  modal('언니 정보 수정',`
    <label>소속</label>
    <input name="affiliation" value="${esc(s.affiliation||'')}" required>

    <label>이름</label>
    <input name="name" value="${esc(s.name||'')}" required>

    <label>전화번호</label>
    <input name="phone" inputmode="tel" value="${esc(s.phone||'')}">

    <label>가능 유형</label>
    <div class="check-grid">
      ${['T','M','ㅈㅇ'].map(v=>`<label class="check-card"><input type="checkbox" name="types" value="${v}" ${selected.includes(v)?'checked':''}>${v}</label>`).join('')}
    </div>

    <label>메모</label>
    <textarea name="memo" class="memo-box" rows="4" placeholder="메모를 입력하세요">${esc(s.memo||'')}</textarea>`,
    f=>api('/staff/update',{
      method:'POST',
      body:JSON.stringify({
        id,
        affiliation:f.get('affiliation'),
        name:f.get('name'),
        phone:f.get('phone'),
        work_types:f.getAll('types').join(','),
        memo:f.get('memo')
      })
    })
  );
}
async function returnWaiting(id){
  await api('/choice/return',{method:'POST',body:JSON.stringify({id,manager:activeManager})});
  await refresh(true);
}
async function passChoice(id){await api('/choice/pass',{method:'POST',body:JSON.stringify({id,manager:activeManager})});refresh(true)}function operationalElapsedMinutes(j){
  if(!j)return 0;

  let startMs=0;
  if(j.start_at){
    startMs=new Date(String(j.start_at).replace(' ','T')+'Z').getTime();
  }

  const endMs=j.end_at
    ? new Date(String(j.end_at).replace(' ','T')+'Z').getTime()
    : Date.now();

  let mins=startMs?Math.floor((endMs-startMs)/60000):0;

  if((!Number.isFinite(mins)||mins<0||(!j.end_at&&mins>24*60))&&j.start_time){
    const match=String(j.start_time).match(/^(\d{1,2}):(\d{2})$/);
    if(match){
      const now=new Date();
      const start=new Date(now);
      start.setHours(Number(match[1]),Number(match[2]),0,0);

      if(start.getTime()>now.getTime()){
        start.setDate(start.getDate()-1);
      }

      mins=Math.floor((now.getTime()-start.getTime())/60000);
    }
  }

  return Math.max(0,Number.isFinite(mins)?mins:0);
}
function elapsedFromStart(j){
  const mins=operationalElapsedMinutes(j);
  const h=Math.floor(mins/60),m=mins%60;
  return h>0?`${h}시간 ${m}분`:`${m}분`;
}
function exactElapsed(j){
  const mins=operationalElapsedMinutes(j);
  const h=Math.floor(mins/60),m=mins%60;
  return h>0?`${h}시간 ${m}분`:`${m}분`;
}
async function finish(id){
  const j=S.jobs.find(x=>x.id===id);
  if(!j)return alert('일중 건을 찾을 수 없습니다.');
  if(isBigManagerClient()){
    const flow=(S.test_pickup_flows||[]).find(x=>Number(x.job_id)===Number(id)&&['requested','rejected_confirmed'].includes(x.status));
    if(flow){openTestPickupAssign(flow);return}
    const pending=(S.test_pickup_flows||[]).find(x=>Number(x.job_id)===Number(id)&&['driver_accepted','driver_rejected'].includes(x.status));
    if(pending){checkSisterPickupRequest();return}
  }
  const row=(label,values)=>`
    <div class="finish-row">
      <div class="finish-label">${label}</div>
      <div class="finish-options time-options" data-group="${label}">
        ${values.map(v=>`<button type="button" data-value="${v}" onclick="toggleFinishValue(this)">${v}</button>`).join('')}
      </div>
    </div>`;
  modal('일끝 정보 전송',`
    <div class="received-box finish-top-box">
      <b>${esc(j.name)}</b> / ${shopButton(j.shop_id,j.shop_name)}<br>
      통과 ${j.start_time||'-'} → 일끝 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}<br>
      경과시간 <b>${elapsedFromStart(j)}</b>
    </div>
    <div class="finish-select-wrap">
      ${row('타임',['바로','반티','1','2','3','4'])}
      ${row('Room',['1','2','3'])}
      ${row('ㅇㅊ',['1','2','3'])}
    </div>
    <input type="hidden" name="selected_info" id="selectedFinishInfo">`,
    async f=>{
      const selected=f.get('selected_info')||'';
      if(!selected)throw new Error('타임, Room, ㅇㅊ 중 선택값을 입력해 주세요.');
      const result=await api('/jobs/finish',{
        method:'POST',
        body:JSON.stringify({id,manager:activeManager,received_info:selected})
      });
      // 모든 실장에서 일끝 직후 서버 상태를 즉시 다시 읽어 목록을 한 번에 전환한다.
      // 감지형 동기화의 다음 주기를 기다리지 않아 일중 행이 화면에 남는 현상을 막는다.
      await refresh(true);
      if(result?.test_pickup_flow)setTimeout(checkSisterPickupRequest,80);
    }
  );
  $('#form menu button[value="ok"]').textContent='전송';
}
window.toggleFinishValue=btn=>{
  btn.classList.toggle('active');
  const values=[...document.querySelectorAll('.finish-options')].flatMap(g=>{
    return [...g.querySelectorAll('button.active')].map(x=>`${g.dataset.group} ${x.dataset.value}`);
  });
  const hidden=$('#selectedFinishInfo');
  if(hidden)hidden.value=values.join(', ');
};
function unitButtons(n){return `<div class="choice-buttons">${['0.5','1','2','3','4'].map(v=>`<button type="button" data-v="${v}" onclick="sel(this,'${n}')">${v==='0.5'?'반':v}</button>`).join('')}</div><input type="hidden" name="${n}" placeholder="숫자 입력">`}window.sel=(b,n)=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');b.parentElement.nextElementSibling.value=b.dataset.v}
function settle(id){
  const j=S.jobs.find(x=>x.id===id);
  const unit=v=>Number(v||0)/10000;
  modal('한건 정산',`
    <div class="received-box">
      <b>수신받은 정보</b><br>
      ${esc(j.received_time||j.end_time||'-')} · ${esc(j.manager||'-')}<br>
      ${shopButton(j.shop_id,j.shop_name)} · 실제 ${exactElapsed(j)}<br>
      ${esc(j.received_info||'전달내용 없음').replace(/\n/g,'<br>')}
    </div>

    <label>일한 총금액 <span class="money-hint">(만원 단위)</span></label>
    <input type="number" name="total" id="totalAmount" step="0.5" min="0" value="${j.total?unit(j.total):''}">

    <label>본인보관 <span class="money-hint">(만원 단위)</span></label>
    <input type="number" name="hold" id="holdAmount" step="0.5" min="0" value="${j.hold_amount?unit(j.hold_amount):''}" placeholder="숫자 입력">

    <label>실장보관 <span class="money-hint">(만원 단위)</span></label>
    <input type="number" name="manager_hold" id="managerHoldAmount" step="0.5" min="0" value="${j.manager_hold?unit(j.manager_hold):''}" placeholder="숫자 입력">

    <label>노래방미수 <span class="money-hint">(만원 단위)</span></label>
    <input type="number" name="receivable" id="receivableAmount" step="0.5" min="0" value="${j.shop_receivable?unit(j.shop_receivable):''}" placeholder="숫자 입력">

    <label>수수료 <span class="money-hint">(만원 단위 · 천원은 0.1)</span></label>
    <input type="number" name="commission_fee" id="commissionFeeAmount" step="0.1" min="0" inputmode="decimal" value="${j.commission_fee?unit(j.commission_fee):''}" placeholder="예: 2만6천원은 2.6">

    <label>기타 항목</label>
    <input name="other_label" value="${esc(j.other_label||'')}" placeholder="예: 교통비">

    <label>기타 금액 <span class="money-hint">(만원 단위)</span></label>
    <input type="number" name="other" id="otherAmount" step="0.5" min="0" value="${j.other_amount?unit(j.other_amount):''}" placeholder="숫자 입력">

    <label>언니 줄돈 <span class="money-hint">(실장보관 - 수수료, 자동)</span></label>
    <input type="number" name="balance" id="balanceAmount" readonly placeholder="자동계산">

    <label>언니 받을돈 <span class="money-hint">(미수 수수료, 자동)</span></label>
    <input type="number" name="sister_receivable" id="sisterReceivableAmount" readonly value="${j.sister_receivable?unit(j.sister_receivable):''}" placeholder="자동계산">

    <label>메모</label>
    <textarea name="memo">${esc(j.settlement_memo||'')}</textarea>`,
    f=>api('/jobs/settle',{
      method:'POST',
      body:JSON.stringify({
        id,
        total_amount:+f.get('total')*10000,
        hold_amount:+f.get('hold')*10000,
        manager_hold:+f.get('manager_hold')*10000,
        shop_receivable:+f.get('receivable')*10000,
        commission_fee:Math.round((+f.get('commission_fee')||0)*10000),
        sister_receivable:+f.get('sister_receivable')*10000,
        other_label:f.get('other_label'),
        other_amount:+f.get('other')*10000,
        memo:f.get('memo'),
        manager:activeManager
      })
    })
  );
  $('#form menu button[value="ok"]').textContent='한건저장';
  const calc=()=>{
    const managerHold=(+$('#managerHoldAmount').value||0);
    const commission=(+$('#commissionFeeAmount').value||0);
    $('#balanceAmount').value=Math.max(0,managerHold-commission);
    $('#sisterReceivableAmount').value=commission;
  };
  ['#managerHoldAmount','#commissionFeeAmount'].forEach(x=>$(x).addEventListener('input',calc));
  calc();
}
function staffHistory(staffId){
  const items=S.jobs.filter(x=>['퇴근정산','정산완료'].includes(x.status)&&Number(x.staff_id)===Number(staffId));
  if(!items.length)return alert('퇴근정산 이력이 없습니다.');
  const name=items[0].name;
  const totals=items.reduce((a,x)=>({
    total:a.total+Number(x.total||0),
    hold:a.hold+Number(x.hold_amount||0),
    managerHold:a.managerHold+Number(x.manager_hold||0),
    sisterReceivable:a.sisterReceivable+Number(x.sister_receivable||0),
    receivable:a.receivable+Number(x.shop_receivable||0),
    commission:a.commission+Number(x.commission_fee||0),
    other:a.other+Number(x.other_amount||0),
    balance:a.balance+Number(x.balance_amount||0)
  }),{total:0,hold:0,managerHold:0,sisterReceivable:0,receivable:0,commission:0,other:0,balance:0});

  const rows=items.map((j,i)=>`<div class="history" style="margin-bottom:8px">
    <b>${i+1}. ${shopButton(j.shop_id,j.shop_name)}</b><br>
    ${j.received_time||j.end_time||'-'} · ${esc(j.manager||'-')}<br>
    실제 ${exactElapsed(j)} · ${esc(j.received_info||'')}<br>
    일한 총금액 ${won(j.total)} / 본인보관 ${won(j.hold_amount)}<br>실장보관 ${won(j.manager_hold)} / 노래방미수 ${won(j.shop_receivable)}<br>수수료 ${won(j.commission_fee)}<br>
    ${esc(j.other_label||'기타금액')} ${won(j.other_amount)} / 언니 줄돈 <b>${won(j.balance_amount)}</b><br>
    언니 받을돈 <b>${won(j.sister_receivable)}</b><br>
    메모 ${esc(j.settlement_memo||'')}
  </div>`).join('');

  modal(name+' 퇴근정산',`
    <div class="history case-total-top">
      <b>건별합계</b><br>
      일한 총금액 <b>${won(totals.total)}</b><br>
      본인보관 ${won(totals.hold)} · 실장보관 ${won(totals.managerHold)}<br>
      노래방미수 ${won(totals.receivable)} · 수수료 ${won(totals.commission)}<br>
      기타금액 ${won(totals.other)} · 언니 줄돈 <b>${won(totals.balance)}</b><br>
      언니 받을돈 <b>${won(totals.sisterReceivable)}</b>
    </div>
    <div class="settlement-mobile-section pay-section">
      <div class="settlement-section-title">언니 줄돈</div>
      <div class="settlement-amount-highlight">${won(totals.balance)}</div>
      <div class="settlement-input-grid">
        <label>이체 <span class="money-hint">(만원)</span>
          <input type="number" name="transfer" step="0.5" placeholder="0">
        </label>
        <label>현금 <span class="money-hint">(만원)</span>
          <input type="number" name="cash" step="0.5" placeholder="0">
        </label>
        <label>기타 <span class="money-hint">(만원)</span>
          <input type="number" name="other_pay" step="0.5" placeholder="0">
        </label>
      </div>
      <label>메모</label>
      <textarea name="daily_memo" placeholder="언니 줄돈 메모"></textarea>
    </div>

    <div class="settlement-mobile-section receive-section">
      <div class="settlement-section-title">언니 받을돈</div>
      <div class="settlement-amount-highlight">${won(totals.sisterReceivable)}</div>
      <div class="settlement-input-grid">
        <label>이체 <span class="money-hint">(만원)</span>
          <input type="number" name="receive_transfer" step="0.5" placeholder="0">
        </label>
        <label>현금 <span class="money-hint">(만원)</span>
          <input type="number" name="receive_cash" step="0.5" placeholder="0">
        </label>
        <label>기타 <span class="money-hint">(만원)</span>
          <input type="number" name="receive_other" step="0.5" placeholder="0">
        </label>
      </div>
      <label>메모</label>
      <textarea name="receive_memo" placeholder="언니 받을돈 메모"></textarea>
    </div>

    <div class="detail-divider">세부내역</div>
    ${rows}`,
    async()=>{}
  );

  const menu=$('#form menu');
  menu.innerHTML='';

  const del=document.createElement('button');
  del.type='button';del.className='btn red';del.textContent='삭제';
  del.onclick=async()=>{
    if(!confirm('정말 삭제하시겠습니까?'))return;
    try{
      await api('/jobs/delete-staff-today',{
        method:'POST',
        body:JSON.stringify({staff_id:staffId})
      });
      $('#dlg').close();
      await refresh(true);
    }catch(err){
      alert('삭제 실패: '+err.message);
    }
  };

  const phone=document.createElement('button');
  phone.type='button';phone.className='btn green';phone.textContent='내폰저장';
  phone.onclick=()=>savePdf(name,items,totals);

  const dbSave=document.createElement('button');
  dbSave.type='button';dbSave.className='btn primary';dbSave.textContent='전체저장';
  dbSave.onclick=async()=>{
    const form=new FormData($('#form'));
    try{
      await api('/settlement-archives/save',{method:'POST',body:JSON.stringify({
        archive_type:'staff',day:items[0].day,staff_id:staffId,staff_name:name,
        items,totals,
        transfer_amount:+form.get('transfer')*10000,
        cash_amount:+form.get('cash')*10000,
        other_pay_amount:+form.get('other_pay')*10000,
        daily_memo:form.get('daily_memo'),
        receive_transfer_amount:+form.get('receive_transfer')*10000,
        receive_cash_amount:+form.get('receive_cash')*10000,
        receive_other_amount:+form.get('receive_other')*10000,
        receive_memo:form.get('receive_memo')
      })});
      alert('데이터베이스에 저장되었습니다.');
      await refresh(true);
    }catch(err){alert('저장 실패: '+err.message)}
  };

  const close=document.createElement('button');
  close.type='button';close.className='btn';close.textContent='닫기';
  close.onclick=()=>$('#dlg').close();

  menu.append(del,phone,dbSave,close);
}
async function savePdf(name,items,totals){
  if(!window.html2canvas || !window.jspdf){
    alert('PDF 저장 모듈을 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
    return;
  }

  const source=$('#dlg form');
  if(!source){
    alert('저장할 정산 화면을 찾지 못했습니다.');
    return;
  }

  const menu=$('#form menu');
  const oldDisplay=menu.style.display;
  menu.style.display='none';

  const clone=source.cloneNode(true);
  clone.classList.add('pdf-capture');
  clone.style.width='720px';
  clone.style.maxWidth='720px';
  clone.style.background='#ffffff';
  clone.style.padding='24px';
  clone.style.position='fixed';
  clone.style.left='-10000px';
  clone.style.top='0';
  clone.style.maxHeight='none';
  clone.style.overflow='visible';

  clone.querySelectorAll('input,textarea').forEach((el,i)=>{
    const original=source.querySelectorAll('input,textarea')[i];
    const box=document.createElement('div');
    box.className='pdf-input-value';
    box.textContent=original?.value||'';
    el.replaceWith(box);
  });
  clone.querySelectorAll('button,menu').forEach(el=>el.remove());

  document.body.appendChild(clone);

  try{
    const canvas=await html2canvas(clone,{
      scale:2,
      backgroundColor:'#ffffff',
      useCORS:true,
      logging:false,
      windowWidth:720
    });

    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const pageW=210,pageH=297,margin=8;
    const imgW=pageW-(margin*2);
    const imgH=canvas.height*imgW/canvas.width;
    const pageContentH=pageH-(margin*2);

    if(imgH<=pageContentH){
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',margin,margin,imgW,imgH);
    }else{
      const pxPerMm=canvas.width/imgW;
      const sliceHeight=Math.floor(pageContentH*pxPerMm);
      let y=0,page=0;
      while(y<canvas.height){
        const h=Math.min(sliceHeight,canvas.height-y);
        const slice=document.createElement('canvas');
        slice.width=canvas.width;
        slice.height=h;
        slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
        if(page>0)pdf.addPage();
        const renderedH=h/pxPerMm;
        pdf.addImage(slice.toDataURL('image/png'),'PNG',margin,margin,imgW,renderedH);
        y+=h;
        page++;
      }
    }

    const date=items?.[0]?.day || new Date().toISOString().slice(0,10);
    const [yy,mm,dd]=date.split('-');
    const safeName=String(name).replace(/[\\/:*?"<>|]/g,'_');
    const filename=`${yy}년${Number(mm)}월${Number(dd)}일_${safeName}.pdf`;
    pdf.save(filename);
    alert(`정산보기 화면 그대로 PDF로 저장했습니다.\n파일명: ${filename}\n휴대폰의 기본 다운로드 폴더에서 확인하세요.`);
  }catch(err){
    alert('PDF 저장 실패: '+err.message);
  }finally{
    clone.remove();
    menu.style.display=oldDisplay;
  }
}
async function delStaff(id,n){
  if(!confirm(n+' 삭제?'))return;
  try{
    await api('/staff/delete',{method:'POST',body:JSON.stringify({id})});
    await refresh(true);
  }catch(e){
    alert('언니등록 삭제 불가\n\n'+(e?.message||'삭제 처리 중 오류가 발생했습니다.'));
  }
}
async function restoreStaff(id){await api('/staff/restore',{method:'POST',body:JSON.stringify({id})});refresh(true)}function editShop(id){
  const s=S.shops.find(x=>Number(x.id)===Number(id));
  if(!s)return alert('노래방 정보를 찾을 수 없습니다.');
  modal('노래방 수정',`
    <label>노래방명</label>
    <input name="name" value="${esc(s.name)}" required>
    <label>전화번호</label>
    <input name="phone" value="${esc(s.phone||'')}">
    <label>메모</label>
    <textarea name="memo" class="memo-box shop-edit-memo-box" rows="5">${esc(s.memo||'')}</textarea>
    <div class="archive-note">수정하면 대기·초이스·일중·정산대기 기록에는 새 이름이 반영됩니다. 이미 퇴근정산된 기록의 노래방 이름은 그대로 유지됩니다.</div>`,
    f=>api('/shops/update',{
      method:'POST',
      body:JSON.stringify({
        id,
        name:f.get('name'),
        phone:f.get('phone'),
        memo:f.get('memo')
      })
    })
  );
}
async function delShop(id,n){if(confirm(n+' 삭제?')){await api('/shops/delete',{method:'POST',body:JSON.stringify({id})});refresh(true)}}async function restoreShop(id){await api('/shops/restore',{method:'POST',body:JSON.stringify({id})});refresh(true)}
async function purgeStaff(id,n){
  if(!confirm(n+'을(를) 완전히 삭제할까요?\n관련 출근·콜·정산 이력도 함께 삭제되며 복구할 수 없습니다.'))return;
  try{
    await api('/staff/purge',{method:'POST',body:JSON.stringify({id})});
    await refresh(true);
  }catch(e){alert('영구삭제 실패: '+e.message)}
}
async function purgeShop(id,n){
  if(!confirm(n+'을(를) 완전히 삭제할까요?\n관련 콜·정산 이력도 함께 삭제되며 복구할 수 없습니다.'))return;
  try{
    await api('/shops/purge',{method:'POST',body:JSON.stringify({id})});
    await refresh(true);
  }catch(e){alert('영구삭제 실패: '+e.message)}
}
$('#backupBtn').onclick=async()=>{if(!confirm('백업할까요?'))return;const d=await api('/backup'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download='COLRA_'+new Date().toISOString().slice(0,10)+'.json';a.click()};
async function saveSettlementArchive(payload){
  const result=await api('/settlement-archives/save',{
    method:'POST',
    body:JSON.stringify(payload)
  });
  alert('오늘 전체 정산이 데이터베이스에 저장되었습니다.');
  return result;
}

$('#todaySettlementBtn').onclick=()=>showTodaySettlement();

function showTodaySettlement(){
  const items=S.jobs.filter(x=>x.status==='퇴근정산');
  if(!items.length){
    return modal('오늘 전체 정산보기','<div class="empty">오늘 퇴근정산 내역이 없습니다.</div>',async()=>{});
  }

  const day=items[0]?.day || new Date().toISOString().slice(0,10);
  const staffArchives=(S.archives||[]).filter(a=>a.archive_type==='staff'&&String(a.day)===String(day));

  const archiveForStaff=staffId=>{
    const matches=staffArchives
      .filter(a=>Number(a.staff_id)===Number(staffId))
      .sort((a,b)=>Number(b.id||0)-Number(a.id||0));
    if(!matches.length)return {};
    try{return JSON.parse(matches[0].payload||'{}')}catch{return {}}
  };

  const groups=Object.values(items.reduce((acc,j)=>{
    const key=String(j.staff_id);
    if(!acc[key])acc[key]={
      staff_id:j.staff_id,
      name:j.name,
      count:0,
      total:0,
      managerHold:0,
      sisterPay:0,
      sisterReceivable:0,
      commission:0,
      transfer:0,
      cash:0,
      otherPay:0,
      memo:'',
      items:[]
    };
    const g=acc[key];
    g.count++;
    g.total+=Number(j.total||0);
    g.managerHold+=Number(j.manager_hold||0);
    g.sisterPay+=Number(j.balance_amount||0);
    g.sisterReceivable+=Number(j.sister_receivable||0);
    g.commission+=Number(j.commission_fee||0);
    g.items.push(j);
    return acc;
  },{})).map(g=>{
    const saved=archiveForStaff(g.staff_id);
    g.transfer=Number(saved.transfer_amount||0);
    g.cash=Number(saved.cash_amount||0);
    g.otherPay=Number(saved.other_pay_amount||0);
    g.memo=String(saved.daily_memo||'');
    return g;
  }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));

  const totals=groups.reduce((a,g)=>({
    count:a.count+g.count,
    total:a.total+g.total,
    managerHold:a.managerHold+g.managerHold,
    sisterPay:a.sisterPay+g.sisterPay,
    sisterReceivable:a.sisterReceivable+g.sisterReceivable,
    commission:a.commission+g.commission,
    transfer:a.transfer+g.transfer,
    cash:a.cash+g.cash,
    otherPay:a.otherPay+g.otherPay
  }),{count:0,total:0,managerHold:0,sisterPay:0,sisterReceivable:0,commission:0,transfer:0,cash:0,otherPay:0});

  const html=`
    <div class="today-summary">
      오늘 퇴근정산 <b>${totals.count}건</b><br>
      일한 총금액 <b>${won(totals.total)}</b><br>실장보관 <b>${won(totals.managerHold)}</b><br>언니 줄돈 <b>${won(totals.sisterPay)}</b><br>언니 받을돈 <b>${won(totals.sisterReceivable)}</b><br>
      수수료 <b>${won(totals.commission)}</b>
      <div class="amount-grid">
        <div>이체<br><b>${won(totals.transfer)}</b></div>
        <div>현금<br><b>${won(totals.cash)}</b></div>
        <div>기타금액<br><b>${won(totals.otherPay)}</b></div>
      </div>
    </div>

    ${groups.map(g=>`
      <div class="staff-summary-card" onclick="event.stopPropagation();staffHistory(${g.staff_id})">
        <div class="staff-summary-head">
          <strong>${esc(g.name)}</strong>
          <button type="button" class="row-btn">보기</button>
        </div>
        <div class="staff-summary-meta">
          ${g.count}건
        </div>
        <div class="amount-grid">
          <div>일한 총금액<br><b>${won(g.total)}</b></div><div>실장보관<br><b>${won(g.managerHold)}</b></div><div>언니 줄돈<br><b>${won(g.sisterPay)}</b></div><div>언니 받을돈<br><b>${won(g.sisterReceivable)}</b></div>
          <div>수수료<br><b>${won(g.commission)}</b></div>
          <div>이체<br><b>${won(g.transfer)}</b></div>
          <div>현금<br><b>${won(g.cash)}</b></div>
          <div>기타금액<br><b>${won(g.otherPay)}</b></div>
        </div>
        <div class="staff-summary-memo">
          메모: ${esc(g.memo||'없음')}
        </div>
      </div>`).join('')}
  `;

  modal('오늘 전체 정산보기',html,async()=>{});

  const menu=$('#form menu');
  menu.innerHTML='';

  const del=document.createElement('button');
  del.type='button';
  del.className='btn red';
  del.textContent='삭제';
  del.onclick=async()=>{
    if(!confirm('오늘 전체 정산내역을 정말 삭제하시겠습니까?\n데이터베이스에서도 삭제됩니다.'))return;
    try{
      await api('/settlement-history/delete',{
        method:'POST',
        body:JSON.stringify({day})
      });
      $('#dlg').close();
      await refresh(true);
      alert('오늘 전체 정산내역이 삭제되었습니다.');
    }catch(err){
      alert('삭제 실패: '+err.message);
    }
  };

  const phone=document.createElement('button');
  phone.type='button';
  phone.className='btn green';
  phone.textContent='내폰저장';
  phone.onclick=()=>savePdf('전체',items,totals);

  const dbSave=document.createElement('button');
  dbSave.type='button';
  dbSave.className='btn primary';
  dbSave.textContent='오늘 전체 저장';
  dbSave.onclick=async()=>{
    try{
      await saveSettlementArchive({
        archive_type:'day',
        day,
        staff_id:null,
        staff_name:'전체',
        groups,
        totals
      });
      await refresh(true);
    }catch(err){
      alert('저장 실패: '+err.message);
    }
  };

  const close=document.createElement('button');
  close.type='button';
  close.className='btn';
  close.textContent='닫기';
  close.onclick=()=>$('#dlg').close();

  menu.append(del,phone,dbSave,close);
}


$('#loadSettlementBtn').onclick=()=>{
  const today=new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10);
  modal('정산 내용 불러오기',`
    <label>날짜 선택</label>
    <input type="date" name="history_day" value="${today}">
    <div class="archive-note">날짜를 선택하고 불러오기를 누르면 해당 날짜에 저장된 전체정산 목록이 표시됩니다.</div>`,
    async f=>{
      const day=f.get('history_day');
      $('#dlg').close();
      await showSettlementArchiveList(day);
    }
  );
  $('#form menu button[value="ok"]').textContent='불러오기';
};

function renderSavedSettlementDetail(title,items,totals,createdAt){
  const safeItems=Array.isArray(items)?items:[];
  const safeTotals=totals||settlementTotals(safeItems);
  const groups=Object.values(safeItems.reduce((acc,j)=>{
    const key=String(j.staff_id||j.name||'');
    if(!acc[key])acc[key]={
      name:j.name||'이름없음',
      count:0,
      total:0,
      hold:0,
      managerHold:0,
      receivable:0,
      commission:0,
      sisterPay:0,
      sisterReceivable:0,
      other:0,
      items:[]
    };
    const g=acc[key];
    g.count++;
    g.total+=Number(j.total||0);
    g.hold+=Number(j.hold_amount||0);
    g.managerHold+=Number(j.manager_hold||0);
    g.receivable+=Number(j.shop_receivable||0);
    g.commission+=Number(j.commission_fee||0);
    g.sisterPay+=Number(j.balance_amount||0);
    g.sisterReceivable+=Number(j.sister_receivable||0);
    g.other+=Number(j.other_amount||0);
    g.items.push(j);
    return acc;
  },{})).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));

  const html=`
    <div class="date-history-total">
      <b>${esc(title)}</b><br>
      ${createdAt?`저장시간 ${esc(createdAt)}<br>`:''}
      정산건수 <b>${safeTotals.count||safeItems.length}건</b><br>
      일한 총금액 <b>${won(safeTotals.total)}</b><br>
      본인보관 ${won(safeTotals.hold)} · 실장보관 ${won(safeTotals.managerHold)}<br>
      노래방미수 ${won(safeTotals.receivable)} · 수수료 ${won(safeTotals.commission)}<br>
      기타금액 ${won(safeTotals.other)}<br>
      언니 줄돈 <b>${won(safeTotals.sisterPay)}</b><br>
      언니 받을돈 <b>${won(safeTotals.sisterReceivable)}</b>
    </div>

    ${groups.map(g=>`
      <div class="date-history-card">
        <b>${esc(g.name)}</b> · ${g.count}건<br>
        일한 총금액 ${won(g.total)}<br>
        본인보관 ${won(g.hold)} · 실장보관 ${won(g.managerHold)}<br>
        노래방미수 ${won(g.receivable)} · 수수료 ${won(g.commission)}<br>
        언니 줄돈 <b>${won(g.sisterPay)}</b><br>
        언니 받을돈 <b>${won(g.sisterReceivable)}</b>
      </div>`).join('') || '<div class="empty">상세 정산 항목이 없습니다.</div>'}
  `;

  modal(title,html,async()=>{});
  const menu=$('#form menu');
  menu.innerHTML='';

  const phone=document.createElement('button');
  phone.type='button';
  phone.className='btn green';
  phone.textContent='내폰저장';
  phone.onclick=()=>savePdf(title,safeItems,safeTotals);

  const close=document.createElement('button');
  close.type='button';
  close.className='btn';
  close.textContent='닫기';
  close.onclick=()=>$('#dlg').close();

  menu.append(phone,close);
}

async function showSettlementArchiveList(day){
  const data=await api('/settlement-archives/list?day='+encodeURIComponent(day));
  const archives=data.archives||[];

  if(!archives.length){
    modal(day+' 전체정산 목록','<div class="empty">해당 날짜에 저장된 전체정산 목록이 없습니다.</div>',async()=>{});
    const menu=$('#form menu');
    menu.innerHTML='';
    const close=document.createElement('button');
    close.type='button';
    close.className='btn';
    close.textContent='닫기';
    close.onclick=()=>$('#dlg').close();
    menu.append(close);
    return;
  }

  const html=`
    <div class="archive-note">
      ${esc(day)} 저장된 전체정산 목록 ${archives.length}개
    </div>
    ${archives.map((a,i)=>`
      <button type="button" class="archive-list-card" data-archive-index="${i}">
        <div class="archive-list-title">${esc(a.title||day+' 오늘 마감 정산완료')}</div>
        <div class="archive-list-meta">
          저장시간 ${esc(a.created_at||'-')}<br>
          정산건수 ${Number(a.totals?.count||a.items?.length||0)}건 ·
          일한 총금액 ${won(a.totals?.total||0)}<br>
          언니 줄돈 ${won(a.totals?.sisterPay||0)} ·
          언니 받을돈 ${won(a.totals?.sisterReceivable||0)}
        </div>
      </button>`).join('')}
  `;

  modal(day+' 전체정산 목록',html,async()=>{});
  const menu=$('#form menu');
  menu.innerHTML='';

  const close=document.createElement('button');
  close.type='button';
  close.className='btn';
  close.textContent='닫기';
  close.onclick=()=>$('#dlg').close();
  menu.append(close);

  document.querySelectorAll('.archive-list-card').forEach(btn=>{
    btn.onclick=()=>{
      const item=archives[Number(btn.dataset.archiveIndex)];
      if(!item)return;
      renderSavedSettlementDetail(
        item.title||day+' 오늘 마감 정산완료',
        item.items||[],
        item.totals||{},
        item.created_at||''
      );
    };
  });
}

document.addEventListener('focusin',e=>{
  if(e.target.matches('input[type="number"]')){
    if(e.target.value==='0')e.target.value='';
    setTimeout(()=>e.target.select?.(),0);
  }
});
let realtimePolling=false,lastHeartbeatAt=0,realtimeTimer=null,lastSyncVersion=-1;
async function fetchSyncVersion(){const d=await api('/sync/version?_='+Date.now());return Number(d.version||0)}
async function refreshPresenceLight(){try{const d=await api('/presence/status?_='+Date.now());S.presence=d.presence||[];presence()}catch(e){console.warn('접속상태 조회 실패',e)}}
async function realtimeTick(){
  if(!activeManager){realtimeTimer=setTimeout(realtimeTick,1500);return;}
  if(realtimePolling){realtimeTimer=setTimeout(realtimeTick,isBigManagerClient()?900:1200);return;}
  realtimePolling=true;
  try{
    if(Date.now()-lastActivityAt>=AUTO_LOGOUT_MS){await secureLogout('30분 동안 사용하지 않아 자동 로그아웃되었습니다.');return;}
    const now=Date.now();
    // 평상시는 버전 숫자만 확인하고, 실제 데이터 변경 때만 전체 snapshot을 읽는다.
    if(now-lastHeartbeatAt>=10000){lastHeartbeatAt=now;await beat();await refreshPresenceLight();}
    const version=await fetchSyncVersion();
    if(lastSyncVersion<0){lastSyncVersion=version;await refresh(true)}
    else if(version!==lastSyncVersion)await refresh(false);
  }finally{
    realtimePolling=false;
    realtimeTimer=setTimeout(realtimeTick,isBigManagerClient()?900:1200);
  }
}
realtimeTimer=setTimeout(realtimeTick,500);

async function refreshPresenceNow(){
  if(!activeManager)return;
  await beat();
  await refreshPresenceLight();
  try{const version=await fetchSyncVersion();if(lastSyncVersion<0||version!==lastSyncVersion)await refresh(false)}catch(e){console.warn('포커스 변경감지 실패',e)}
}
window.addEventListener('focus',()=>refreshPresenceNow());
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)refreshPresenceNow();
});
