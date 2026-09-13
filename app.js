
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const BUILD='v0.21.0';
const DBKEY='sidelineiq_v0210';
const LEGACY_KEYS=['sidelineiq_v0204','sidelineiq_v0203','sidelineiq_v0202','sidelineiq_v0201','sidelineiq_v0200','sidelineiq_v020','sidelineiq_v01515','sidelineiq_v01514','sidelineiq_v01513','sidelineiq_v01512','sidelineiq_v01511','sidelineiq_v01510','sidelineiq_v0159','sidelineiq_v0158','sidelineiq_v0157','sidelineiq_v0156','sidelineiq_v0155','sidelineiq_v0154','sidelineiq_v0153','sidelineiq_v0152','sidelineiq_v0151','sidelineiq_v015','sidelineiq_v014','sidelineiq_v013_corrected','sidelineiq_v013','sidelineiq_v012'];
const defaultState={teams:[],games:[]};
let selectedPlayId=null;

function uid(){return crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now()}
function load(){
  try{
    let raw=localStorage.getItem(DBKEY);
    if(!raw){
      for(const k of LEGACY_KEYS){raw=localStorage.getItem(k);if(raw)break}
      if(raw)localStorage.setItem(DBKEY,raw);
    }
    return {...defaultState,...(raw?JSON.parse(raw):{})};
  }catch(e){console.warn(e);return structuredClone(defaultState)}
}
let state=load();
function save(){localStorage.setItem(DBKEY,JSON.stringify(state))}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function other(s){return s==='team'?'opp':'team'}
function fmtPos(v){v=clamp(v);if(v===50)return '50';return v<50?`OWN ${v}`:`OPP ${100-v}`}
function ordinal(n){return n===1?'1st':n===2?'2nd':n===3?'3rd':`${n}th`}
function sideYard(v){v=clamp(v);if(v===50)return{side:'50',yard:50};return v<50?{side:'OWN',yard:v}:{side:'OPP',yard:100-v}}
function teamAbbr(name=''){const s=String(name).toUpperCase().replace(/[^A-Z0-9]/g,'');return (s.slice(0,3)||'---').padEnd(3,'-')}
function lighten(hex='#64748B',amount=.82){let h=hex.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');let r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);r=Math.round(r+(255-r)*amount);g=Math.round(g+(255-g)*amount);b=Math.round(b+(255-b)*amount);return `rgb(${r},${g},${b})`}
function relSpot(screenSpot,dir=1){return dir===1?clamp(screenSpot):100-clamp(screenSpot)}
function screenSpot(relativeSpot,dir=1){return dir===1?clamp(relativeSpot):100-clamp(relativeSpot)}
function fmtDrive(screenValue,dir=1){return fmtPos(relSpot(screenValue,dir))}
function touchdownSpot(dir=1){return dir===1?100:0}
function textColor(hex='#000'){let h=hex.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return ((r*299+g*587+b*114)/1000)>150?'#071922':'#fff'}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;$('#toastHost')?.appendChild(d);setTimeout(()=>d.remove(),2200)}
function shell(content,topActions=''){ $('#app').innerHTML=`<div class="app-shell"><header class="topbar"><img class="brand-image" src="./assets/sidelineiq-header-logo.png" alt="SidelineIQ — Find Your Edge"><div class="top-actions"><span class="build-badge">${BUILD}</span>${topActions}</div></header>${content}</div>`}
function route(){const h=location.hash||'#teams';if(h.startsWith('#team/'))return renderTeam(h.split('/')[1]);if(h.startsWith('#game/'))return renderGame(h.split('/')[1]);renderTeams()}
window.addEventListener('hashchange',route);

function renderTeams(){
 const cards=state.teams.map(t=>{const count=state.games.filter(g=>g.teamId===t.id).length;return `<div class="team-card" data-open-team="${t.id}"><div class="team-left"><div class="team-swatch" style="background:linear-gradient(135deg,${t.primary} 0 60%,${t.secondary} 60%)"></div><div><div class="team-name">${esc(t.name)}</div><div class="team-meta">Football · ${count} game${count===1?'':'s'}</div></div></div><div class="chev">›</div></div>`}).join('');
 shell(`<main class="page"><div class="home-grid"><aside class="feature-card"><img src="./assets/sidelineiq-home-feature.png" alt="Every play builds a bigger picture — Find Your Edge"></aside><section class="content-card"><div class="section-head"><div><div class="eyebrow">Sideline Command Center</div><h1>My Teams</h1></div><button class="btn btn-primary" id="addTeam">+ Add Team</button></div><div class="team-list">${cards||'<div class="empty">No teams yet. Add your first team to get started.</div>'}</div></section></div></main>`);
 $('#addTeam').onclick=showAddTeam;$$('[data-open-team]').forEach(x=>x.onclick=()=>location.hash='#team/'+x.dataset.openTeam)
}
function showModal(html){const w=document.createElement('div');w.className='modal-wrap';w.innerHTML=`<div class="modal">${html}</div>`;document.body.appendChild(w);$$('[data-close]',w).forEach(b=>b.onclick=()=>w.remove());w.onclick=e=>{if(e.target===w)w.remove()}}
function closeModal(){document.querySelector('.modal-wrap')?.remove()}
function showAddTeam(){
 showModal(`<div class="setup-modal setup-team-modal">
   <div class="setup-head">
     <div><div class="eyebrow">TEAM SETUP</div><h2>Add Team</h2><p>Set the identity once. You can change it later.</p></div>
     <button class="setup-close" data-close aria-label="Close">×</button>
   </div>

   <div class="setup-body">
     <div class="setup-field setup-field-wide">
       <label>Team Name</label>
       <input id="teamName" placeholder="Auburn Jr. High Trojans" autocomplete="off">
     </div>

     <div class="setup-color-row">
       <div class="setup-field">
         <label>Primary Color</label>
         <div class="setup-color-control">
           <input id="primary" type="color" value="#5B21B6">
           <div><b>Primary</b><span>Main team color</span></div>
         </div>
       </div>
       <div class="setup-field">
         <label>Secondary Color</label>
         <div class="setup-color-control">
           <input id="secondary" type="color" value="#F4C43D">
           <div><b>Secondary</b><span>Accent color</span></div>
         </div>
       </div>
     </div>

     <div class="setup-field setup-field-inline">
       <div><label>Sport</label><span class="setup-help">SidelineIQ game tracking</span></div>
       <div class="setup-value-chip">Football</div>
     </div>
   </div>

   <div class="setup-actions">
     <button class="btn btn-light" data-close>Cancel</button>
     <button class="btn btn-primary" id="saveTeam">Save Team</button>
   </div>
 </div>`);
 $('#saveTeam').onclick=()=>{const name=$('#teamName').value.trim();if(!name)return alert('Enter a team name.');state.teams.push({id:uid(),name,primary:$('#primary').value,secondary:$('#secondary').value});save();closeModal();renderTeams()}
}

const OFFENSE_POSITIONS=['QB','RB','FB','WR','TE','C','G','T','OL'];
const DEFENSE_POSITIONS=['DE','DT','DL','LB','OLB','ILB','CB','S','DB'];
const SPECIAL_POSITIONS=['K','P','LS'];
function normalizeRoster(t){
 t.roster??=[];
 t.roster.forEach(p=>{
   p.id??=uid();
   p.number=(p.number??'').toString();
   p.first??='';p.last??='';p.grade??='';p.positions??=[];
   p.active=p.active!==false
 });
 return t.roster
}
function rosterPlayerName(p){
 const full=[p.first,p.last].filter(Boolean).join(' ').trim();
 return full||`Player #${p.number||'—'}`
}
function rosterShortName(p){
 return p.last||p.first||''
}
function rosterPlayerByNumber(t,n){
 normalizeRoster(t);
 return t.roster.find(p=>String(p.number)===String(n))
}
function positionGroup(pos){
 if(OFFENSE_POSITIONS.includes(pos))return 'Offense';
 if(DEFENSE_POSITIONS.includes(pos))return 'Defense';
 return 'Special Teams'
}
function positionButtons(selected=[]){
 const section=(title,arr)=>`<div class="roster-pos-group"><span>${title}</span><div class="roster-pos-options">${arr.map(pos=>`<button type="button" class="roster-pos ${selected.includes(pos)?'active':''}" data-pos="${pos}">${pos}</button>`).join('')}</div></div>`;
 return section('Offense',OFFENSE_POSITIONS)+section('Defense',DEFENSE_POSITIONS)+section('Special Teams',SPECIAL_POSITIONS)
}
function rosterSummary(t){
 const r=normalizeRoster(t),active=r.filter(p=>p.active),off=active.filter(p=>p.positions.some(x=>OFFENSE_POSITIONS.includes(x))),def=active.filter(p=>p.positions.some(x=>DEFENSE_POSITIONS.includes(x)));
 return `<div class="roster-summary">
   <div><b>${r.length}</b><span>Players</span></div>
   <div><b>${active.length}</b><span>Active</span></div>
   <div><b>${off.length}</b><span>Offense</span></div>
   <div><b>${def.length}</b><span>Defense</span></div>
 </div>`
}
function rosterTable(t){
 const r=normalizeRoster(t).slice().sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||rosterPlayerName(a).localeCompare(rosterPlayerName(b)));
 if(!r.length)return `<div class="roster-empty"><div class="roster-empty-icon">#</div><h3>No players yet</h3><p>Add the roster once, then SidelineIQ can use it throughout games and statistics.</p><button class="btn btn-primary" id="emptyAddPlayer">+ Add Player</button></div>`;
 return `<div class="roster-table-wrap"><table class="roster-table"><thead><tr><th>#</th><th>Player</th><th>Grade</th><th>Positions</th><th>Status</th><th></th></tr></thead><tbody>${r.map(p=>`<tr>
   <td><span class="jersey-badge">${esc(p.number||'—')}</span></td>
   <td><button class="roster-player-name" data-edit-player="${p.id}">${esc(rosterPlayerName(p))}</button></td>
   <td>${esc(p.grade||'—')}</td>
   <td><div class="position-chip-row">${p.positions.length?p.positions.map(x=>`<span class="position-chip">${esc(x)}</span>`).join(''):'<span class="muted">—</span>'}</div></td>
   <td><span class="status-pill ${p.active?'active':'inactive'}">${p.active?'Active':'Inactive'}</span></td>
   <td><button class="roster-more" data-edit-player="${p.id}">Edit</button></td>
 </tr>`).join('')}</tbody></table></div>`
}
function renderRosterPanel(t){
 const host=$('#teamPanel');if(!host)return;
 host.innerHTML=`<section class="content-card roster-card">
   <div class="roster-toolbar"><div><div class="eyebrow">TEAM ROSTER</div><h2>${esc(t.name)}</h2><p>Players saved here are available as quick selections during games.</p></div><button class="btn btn-primary" id="addPlayer">+ Add Player</button></div>
   ${rosterSummary(t)}
   ${rosterTable(t)}
 </section>`;
 if($('#addPlayer'))$('#addPlayer').onclick=()=>showRosterPlayer(t);
 if($('#emptyAddPlayer'))$('#emptyAddPlayer').onclick=()=>showRosterPlayer(t);
 $$('[data-edit-player]').forEach(b=>b.onclick=()=>showRosterPlayer(t,b.dataset.editPlayer))
}
function showRosterPlayer(t,id=null){
 normalizeRoster(t);
 const existing=id?t.roster.find(p=>p.id===id):null;
 const p=existing?structuredClone(existing):{id:uid(),number:'',first:'',last:'',grade:'',positions:[],active:true};
 showModal(`<div class="roster-player-modal">
   <div class="setup-head"><div><div class="eyebrow">${existing?'EDIT PLAYER':'ROSTER'}</div><h2>${existing?'Edit Player':'Add Player'}</h2><p>${esc(t.name)}</p></div><button class="setup-close" data-close>×</button></div>
   <div class="roster-player-body">
     <div class="roster-player-grid">
       <div class="setup-field jersey-field"><label>Jersey #</label><input id="rpNumber" inputmode="numeric" maxlength="3" value="${esc(p.number)}" placeholder="12"></div>
       <div class="setup-field"><label>First Name</label><input id="rpFirst" value="${esc(p.first)}" placeholder="First"></div>
       <div class="setup-field"><label>Last Name</label><input id="rpLast" value="${esc(p.last)}" placeholder="Last"></div>
       <div class="setup-field"><label>Grade</label><select id="rpGrade"><option value="">—</option>${['6','7','8','9','10','11','12'].map(x=>`<option value="${x}" ${p.grade===x?'selected':''}>${x}th${x==='6'?'':x==='7'?'':x==='8'?'':''}</option>`).join('')}</select></div>
       <div class="setup-field roster-status-field"><label>Status</label><div class="seg" id="rpStatus"><button class="${p.active?'active':''}" data-active="true">Active</button><button class="${!p.active?'active':''}" data-active="false">Inactive</button></div></div>
     </div>
     <div class="roster-position-picker"><div class="section-label">Positions</div>${positionButtons(p.positions)}</div>
   </div>
   <div class="setup-actions roster-player-actions">
     ${existing?'<button class="btn btn-danger-outline" id="deleteRosterPlayer">Delete</button>':''}
     <span class="action-spacer"></span>
     <button class="btn btn-light" data-close>Cancel</button>
     <button class="btn btn-primary" id="saveRosterPlayer">${existing?'Save Changes':'Add Player'}</button>
   </div>
 </div>`);
 let active=p.active;
 $('#rpStatus [data-active="true"]').onclick=()=>{active=true;$$('#rpStatus button').forEach(x=>x.classList.toggle('active',x.dataset.active==='true'))};
 $('#rpStatus [data-active="false"]').onclick=()=>{active=false;$$('#rpStatus button').forEach(x=>x.classList.toggle('active',x.dataset.active==='false'))};
 $$('.roster-pos').forEach(b=>b.onclick=()=>b.classList.toggle('active'));
 $('#saveRosterPlayer').onclick=()=>{
   const number=$('#rpNumber').value.trim(),first=$('#rpFirst').value.trim(),last=$('#rpLast').value.trim();
   if(!number)return toast('Enter a jersey number.');
   const duplicate=t.roster.find(x=>x.id!==p.id&&String(x.number)===number);
   if(duplicate)return toast(`#${number} is already on this roster.`);
   const positions=$$('.roster-pos.active').map(x=>x.dataset.pos);
   Object.assign(p,{number,first,last,grade:$('#rpGrade').value,positions,active});
   if(existing)Object.assign(existing,p);else t.roster.push(p);
   save();closeModal();renderRosterPanel(t)
 };
 if($('#deleteRosterPlayer'))$('#deleteRosterPlayer').onclick=()=>{
   if(!confirm(`Remove #${p.number} ${rosterPlayerName(p)} from the roster?`))return;
   t.roster=t.roster.filter(x=>x.id!==p.id);save();closeModal();renderRosterPanel(t)
 }
}

function renderTeam(id){
 const t=state.teams.find(x=>x.id===id);if(!t)return location.hash='#teams';
 normalizeRoster(t);
 const games=state.games.filter(g=>g.teamId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const rows=games.map(g=>`<tr data-open-game="${g.id}"><td>${esc(g.date||'')}</td><td>${esc(g.opponent)}</td><td>${esc(g.location||'Home')}</td><td>${g.gameOver?`${g.teamScore>=g.oppScore?'W':'L'} ${g.teamScore}-${g.oppScore}`:`${g.teamScore||0}-${g.oppScore||0}`}</td><td>›</td></tr>`).join('');
 shell(`<main class="page"><button class="btn" onclick="location.hash='#teams'">‹ Back to Teams</button>
 <section class="content-card team-banner" style="border-left:6px solid ${t.primary}">
   <div class="team-banner-left"><div class="team-swatch" style="background:linear-gradient(135deg,${t.primary} 0 60%,${t.secondary} 60%)"></div><div><div class="team-title">${esc(t.name)}</div><div class="team-meta">Football · ${t.roster.length} rostered player${t.roster.length===1?'':'s'}</div></div></div>
   <button class="btn" id="editTeam">Edit Team</button>
 </section>
 <div class="tabs team-tabs">
   <button class="tab active" data-team-tab="games">Games</button>
   <button class="tab" data-team-tab="roster">Roster <span class="tab-count">${t.roster.length}</span></button>
   <button class="tab" disabled>Analytics · Coming Soon</button>
   <button class="btn btn-primary" id="teamPrimaryAction">+ Add Game</button>
 </div>
 <div id="teamPanel"><section class="content-card"><table class="games-table"><thead><tr><th>Date</th><th>Opponent</th><th>Location</th><th>Score</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty">No games yet.</td></tr>'}</tbody></table></section></div>
 </main>`);
 const renderGames=()=>{
   $('#teamPanel').innerHTML=`<section class="content-card"><table class="games-table"><thead><tr><th>Date</th><th>Opponent</th><th>Location</th><th>Score</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty">No games yet.</td></tr>'}</tbody></table></section>`;
   $('#teamPrimaryAction').textContent='+ Add Game';
   $('#teamPrimaryAction').onclick=()=>showAddGame(t);
   $$('[data-open-game]').forEach(x=>x.onclick=()=>location.hash='#game/'+x.dataset.openGame)
 };
 const selectTab=name=>{
   $$('[data-team-tab]').forEach(b=>b.classList.toggle('active',b.dataset.teamTab===name));
   if(name==='games')renderGames();
   else{
     renderRosterPanel(t);
     $('#teamPrimaryAction').textContent='+ Add Player';
     $('#teamPrimaryAction').onclick=()=>showRosterPlayer(t)
   }
 };
 $$('[data-team-tab]').forEach(b=>b.onclick=()=>selectTab(b.dataset.teamTab));
 $('#teamPrimaryAction').onclick=()=>showAddGame(t);
 $('#editTeam').onclick=()=>showEditTeam(t);
 $$('[data-open-game]').forEach(x=>x.onclick=()=>location.hash='#game/'+x.dataset.openGame)
}
function showEditTeam(t){
 showModal(`<div class="setup-modal setup-team-modal"><div class="setup-head"><div><div class="eyebrow">TEAM SETUP</div><h2>Edit Team</h2><p>Update team identity.</p></div><button class="setup-close" data-close>×</button></div><div class="setup-body"><div class="setup-field"><label>Team Name</label><input id="teamName" value="${esc(t.name)}"></div><div class="setup-color-row"><div class="setup-field"><label>Primary Color</label><div class="setup-color-control"><input id="primary" type="color" value="${t.primary}"><div><b>Primary</b><span>Main color</span></div></div></div><div class="setup-field"><label>Secondary Color</label><div class="setup-color-control"><input id="secondary" type="color" value="${t.secondary}"><div><b>Secondary</b><span>Accent color</span></div></div></div></div></div><div class="setup-actions"><button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="saveTeam">Save Changes</button></div></div>`);
 $('#saveTeam').onclick=()=>{t.name=$('#teamName').value.trim()||t.name;t.primary=$('#primary').value;t.secondary=$('#secondary').value;save();closeModal();renderTeam(t.id)}
}
function showAddGame(t){
 showModal(`<div class="setup-modal setup-game-modal">
   <div class="setup-head">
     <div><div class="eyebrow">GAME SETUP</div><h2>Add Game</h2><p>${esc(t.name)}</p></div>
     <button class="setup-close" data-close aria-label="Close">×</button>
   </div>

   <div class="setup-body">
     <div class="setup-game-grid">
       <div class="setup-field setup-span-2">
         <label>Opponent</label>
         <input id="opp" placeholder="Rochester" autocomplete="off">
       </div>

       <div class="setup-field">
         <label>Opponent Color</label>
         <div class="setup-color-control compact">
           <input id="oppColor" type="color" value="#B8860B">
           <div><b>Color</b><span>Opponent accent</span></div>
         </div>
       </div>

       <div class="setup-field">
         <label>Date</label>
         <input id="gdate" type="date" value="${new Date().toISOString().slice(0,10)}">
       </div>

       <div class="setup-field">
         <label>Location</label>
         <select id="loc"><option>Home</option><option>Away</option><option>Neutral</option></select>
       </div>

       <div class="setup-field">
         <label>Game Format</label>
         <select id="format"><option value="quarters">4 Quarters</option><option value="halves">2 Halves</option></select>
       </div>

       <div class="setup-field setup-span-2">
         <label>Opening Kick</label>
         <select id="kick"><option value="team">${esc(t.name)} kicks</option><option value="opp">Opponent kicks</option></select>
       </div>

       <div class="setup-field">
         <label>Kickoff Yard</label>
         <input id="kickYard" type="number" min="20" max="50" value="40">
       </div>
     </div>

     <div class="setup-callout">
       <span>🏈</span>
       <div><b>Game starts with the opening kickoff.</b><small>The second-half kickoff is handled automatically.</small></div>
     </div>
   </div>

   <div class="setup-actions">
     <button class="btn btn-light" data-close>Cancel</button>
     <button class="btn btn-primary" id="saveGame">Create Game</button>
   </div>
 </div>`);
 $('#saveGame').onclick=()=>{const opponent=$('#opp').value.trim();if(!opponent)return alert('Enter opponent.');const openingKick=$('#kick').value,kickoffYard=Math.max(20,Math.min(50,+$('#kickYard').value||40)),receiving=other(openingKick);const g={id:uid(),teamId:t.id,opponent,date:$('#gdate').value,location:$('#loc').value,oppColor:$('#oppColor').value,format:$('#format').value,openingKick,kickoffYard,teamScore:0,oppScore:0,period:1,down:1,toGo:10,los:20,poss:receiving,plays:[],awaitingTry:false,driveDir:1,kickoffPending:true,kickoff:{phase:'kick',kickingTeam:openingKick,receivingTeam:receiving,startYard:kickoffYard,kickDir:1,startSpot:kickoffYard,landing:null,returnEnd:null,kicker:'',returner:'',tacklers:[],touchback:false}};state.games.push(g);save();closeModal();location.hash='#game/'+g.id}
}

let currentPlay=null;
function normalizeGame(g){
 g.teamScore??=0;g.oppScore??=0;g.period??=1;g.gameOver??=false;g.down??=1;g.toGo??=10;g.los??=20;g.poss??='team';g.plays??=[];g.kickoffYard??=40;g.awaitingTry??=false;g.tryType??=null;g.puntPending??=false;g.punt??=null;
 if(g.driveDir==null){
   const lastKick=[...g.plays].reverse().find(p=>p.kind==='Kickoff');
   if(lastKick){
     const kickingSide=lastKick.team||lastKick.before?.poss||g.openingKick||'team';
     const receivingSide=other(kickingSide);
     g.driveDir=(g.poss===receivingSide)?-1:1;
   }else{
     g.driveDir=1;
   }
 }
 if(g.kickoffPending&&!g.kickoff){const receiving=other(g.openingKick||'team');g.kickoff={phase:'kick',kickingTeam:g.openingKick||'team',receivingTeam:receiving,startYard:g.kickoffYard,kickDir:1,startSpot:g.kickoffYard,landing:null,returnEnd:null,kicker:'',returner:'',tacklers:[],touchback:false}}
}
function teamSide(g,t,side){return side==='team'?{name:t.name,color:t.primary,secondary:t.secondary}:{name:g.opponent,color:g.oppColor||'#B8860B',secondary:'#111'}}
function snapshot(g){return {teamScore:g.teamScore,oppScore:g.oppScore,period:g.period,gameOver:!!g.gameOver,down:g.down,toGo:g.toGo,los:g.los,poss:g.poss,driveDir:g.driveDir,awaitingTry:g.awaitingTry,tryType:g.tryType||null,kickoffPending:!!g.kickoffPending,kickoff:g.kickoff?structuredClone(g.kickoff):null,puntPending:!!g.puntPending,punt:g.punt?structuredClone(g.punt):null}}
function defaultPlay(g){return {type:'Run',end:g.los,player:'',qb:'',receiver:'',passResult:'Complete',defenders:[],penalties:[],score:null,tryResult:null,fumble:false,fumbleRecovery:null,badSnap:{active:false,center:'',notCaught:false,recoveredBy:null},interception:null,turnover:false,special:null,kicker:'',returner:'',kickGood:null,note:''}}
function syncTurnoverState(){
 const p=currentPlay;
 p.turnover=
   p.passResult==='Interception'||
   (p.fumble&&p.fumbleRecovery==='Defense')||
   (p.badSnap?.active&&p.badSnap.notCaught&&p.badSnap.recoveredBy==='Defense');
}
function chooseRecovery(title,onChoose){
 showModal(`<h2>${esc(title)}</h2><div class="notice">Who recovered the loose ball?</div><div class="modal-actions recovery-actions"><button class="btn btn-light" id="recoverOffense">Offense</button><button class="btn btn-primary" id="recoverDefense">Defense</button></div>`);
 $('#recoverOffense').onclick=()=>{closeModal();onChoose('Offense')};
 $('#recoverDefense').onclick=()=>{closeModal();onChoose('Defense')};
}
function badSnapFields(){
 const b=currentPlay.badSnap||{active:false,center:'',notCaught:false,recoveredBy:null};
 return `<div class="bad-snap-block"><div class="section-label">Snap</div><button type="button" class="btn btn-light bad-snap-toggle ${b.active?'active':''}" id="badSnapBtn">${b.active?'✓ Bad Snap':'Bad Snap'}</button>${b.active?`<div class="bad-snap-details"><div class="form-row"><label>Center #</label><input id="centerNum" inputmode="numeric" placeholder="#" value="${esc(b.center||'')}"></div><div class="section-label">Was the snap caught?</div><div class="seg" id="snapCaught"><button data-caught="true" class="${!b.notCaught?'active':''}">Caught</button><button data-caught="false" class="${b.notCaught?'active':''}">Not Caught</button></div>${b.notCaught?`<div class="section-label">Who Recovered?</div><div class="seg" id="snapRecovery"><button data-recovery="Offense" class="${b.recoveredBy==='Offense'?'active':''}">Offense</button><button data-recovery="Defense" class="${b.recoveredBy==='Defense'?'active':''}">Defense</button></div>`:''}</div>`:''}</div>`;
}



function addRemembered(arr,n){
 n=(n??'').toString().trim();
 if(!n||n==='—'||arr.includes(n))return;
 arr.push(n);
}
function rememberedPlayers(g,side){
 const m={qb:[],rb:[],wr:[],def:[]};
 [...(g.plays||[])].reverse().forEach(p=>{
   const team=p.team||p.before?.poss;
   if(team===side){
     if(p.kind==='Run'){
       let n=p.player;
       if(!n){const x=(p.desc||'').match(/^Run #(\d+)/);n=x?.[1]}
       addRemembered(m.rb,n);
     }
     if(p.kind==='Pass'){
       let qb=p.qb,wr=p.receiver;
       if(!qb){
         let x=(p.desc||'').match(/^Pass #(\d+)/);
         if(!x)x=(p.desc||'').match(/^Sack of QB #(\d+)/);
         qb=x?.[1]
       }
       if(!wr){const x=(p.desc||'').match(/→ #(\d+)/);wr=x?.[1]}
       addRemembered(m.qb,qb);addRemembered(m.wr,wr)
     }
   }
   if(team&&other(team)===side)(p.defenders||[]).slice().reverse().forEach(d=>addRemembered(m.def,d.n))
 });
 if(side==='team'){
   const t=teamById(g.teamId);
   if(t){
     normalizeRoster(t);
     const active=t.roster.filter(p=>p.active&&p.number);
     active.filter(p=>p.positions.includes('QB')).reverse().forEach(p=>addRemembered(m.qb,p.number));
     active.filter(p=>p.positions.some(x=>['RB','FB'].includes(x))).reverse().forEach(p=>addRemembered(m.rb,p.number));
     active.filter(p=>p.positions.some(x=>['WR','TE'].includes(x))).reverse().forEach(p=>addRemembered(m.wr,p.number));
     active.filter(p=>p.positions.some(x=>DEFENSE_POSITIONS.includes(x))).reverse().forEach(p=>addRemembered(m.def,p.number))
   }
 }
 return m
}
function memoryButtons(nums,role,g=null,side=null){
 const t=g&&side==='team'?teamById(g.teamId):null;
 return nums.length?nums.map(n=>{
   const rp=t?rosterPlayerByNumber(t,n):null;
   const short=rp?rosterShortName(rp):'';
   return `<button type="button" class="memory-chip" data-memory-role="${role}" data-memory-player="${esc(n)}" title="${rp?esc(rosterPlayerName(rp)):''}">#${esc(n)}${short?` ${esc(short)}`:''}</button>`
 }).join(''):'<span class="memory-empty">—</span>'
}
function offenseMemory(g){
 const m=rememberedPlayers(g,g.poss);
 return `<div class="player-memory"><div class="memory-title">PLAYERS</div><div class="memory-columns"><div class="memory-col"><small>QB</small><div>${memoryButtons(m.qb,'qb',g,g.poss)}</div></div><div class="memory-col"><small>RB</small><div>${memoryButtons(m.rb,'rb',g,g.poss)}</div></div><div class="memory-col"><small>WR / TARGETS</small><div>${memoryButtons(m.wr,'wr',g,g.poss)}</div></div></div></div>`;
}
function defenseMemory(g){
 const m=rememberedPlayers(g,other(g.poss));
 return `<div class="player-memory defense-memory"><div class="memory-title">DEFENDERS</div><div class="memory-chip-row">${memoryButtons(m.def,'def',g,other(g.poss))}</div></div>`;
}



function statYards(p){
 const dir=p.before?.driveDir??1;
 return Math.round(((p.end??p.start??0)-(p.start??0))*dir);
}
function isOffensivePlay(p){return p.kind==='Run'||p.kind==='Pass'}
function playHasTd(p){
 const d=(p.desc||'').toUpperCase();
 return (d.includes('TOUCHDOWN')||d.includes(' TD'))&&!d.includes('DEFENSIVE TD')&&!d.includes('RETURN TD');
}
function ensurePlayer(map,n){
 n=(n??'').toString().trim();
 if(!n||n==='—')return null;
 if(!map[n])map[n]={
   number:n,
   pass:{att:0,comp:0,yds:0,td:0,int:0,sacks:0},
   rush:{car:0,yds:0,td:0},
   rec:{tar:0,rec:0,yds:0,td:0},
   def:{tackle:0,sack:0,int:0,intYds:0,intTD:0,pressure:0,hurry:0,missed:0},
   fum:0
 };
 return map[n]
}
function parsedPlayPlayers(p){
 const d=p.desc||'';
 let player=p.player||'',qb=p.qb||'',receiver=p.receiver||'',result=p.passResult||'';
 if(p.kind==='Run'&&!player){
   const m=d.match(/^Run #(\d+)/i);if(m)player=m[1]
 }
 if(p.kind==='Pass'){
   if(!qb){
     let m=d.match(/^Pass #(\d+)/i);
     if(!m)m=d.match(/^Sack of QB #(\d+)/i);
     if(m)qb=m[1]
   }
   if(!receiver){
     const m=d.match(/→ #(\d+)/);if(m)receiver=m[1]
   }
   if(!result){
     if(/incomplete/i.test(d))result='Incomplete';
     else if(/intercept/i.test(d))result='Interception';
     else if(/^Sack of QB/i.test(d))result='Sack';
     else result='Complete';
   }
 }
 return {player,qb,receiver,result}
}
function computeTeamStats(g,side){
 const team={
   side,totalYards:0,rushYards:0,passYards:0,
   rushAtt:0,passAtt:0,completions:0,plays:0,
   firstDowns:0,thirdAtt:0,thirdMade:0,fourthAtt:0,fourthMade:0,
   turnovers:0,sacksAllowed:0,players:{}
 };

 for(const p of (g.plays||[])){
   const offense=p.team||p.before?.poss;

   if(offense===side&&isOffensivePlay(p)){
     const y=statYards(p);
     const f=parsedPlayPlayers(p);
     team.plays++;

     if(p.kind==='Run'){
       team.rushAtt++;
       team.rushYards+=y;
       const rb=ensurePlayer(team.players,f.player);
       if(rb){
         rb.rush.car++;
         rb.rush.yds+=y;
         if(playHasTd(p))rb.rush.td++;
         if(p.fumble)rb.fum++;
       }
     }else{
       const result=f.result||'Complete';
       const complete=result==='Complete';
       const sack=result==='Sack';
       const interception=result==='Interception';

       if(!sack)team.passAtt++;
       if(complete){team.completions++;team.passYards+=y}
       if(sack)team.sacksAllowed++;

       const qb=ensurePlayer(team.players,f.qb);
       if(qb){
         if(!sack)qb.pass.att++;
         if(complete){qb.pass.comp++;qb.pass.yds+=y}
         if(sack)qb.pass.sacks++;
         if(interception)qb.pass.int++;
         if(playHasTd(p)&&complete)qb.pass.td++;
       }

       const wr=ensurePlayer(team.players,f.receiver);
       if(wr){
         if(!sack)wr.rec.tar++;
         if(complete){
           wr.rec.rec++;
           wr.rec.yds+=y;
           if(playHasTd(p))wr.rec.td++;
         }
       }

       if(interception)team.turnovers++;
     }

     if(p.fumble&&p.fumbleRecovery==='Defense')team.turnovers++;
     if(p.badSnap?.active&&p.badSnap.notCaught&&p.badSnap.recoveredBy==='Defense')team.turnovers++;

     const down=Number(p.before?.down||0);
     const toGo=Number(p.before?.toGo||0);
     const gained=Math.max(0,y);
     const converted=toGo>0&&gained>=toGo;
     if(down===3){team.thirdAtt++;if(converted)team.thirdMade++}
     if(down===4){team.fourthAtt++;if(converted)team.fourthMade++}
     if(converted||playHasTd(p))team.firstDowns++;
   }

   // Defensive actions are stored on the offensive play.
   if(offense&&other(offense)===side){
     for(const d of (p.defenders||[])){
       const pl=ensurePlayer(team.players,d.n);
       if(!pl)continue;
       if(d.action==='Tackle')pl.def.tackle+=Number(d.credit??1);
       else if(d.action==='Assist')pl.def.tackle+=0.5;
       else if(d.action==='Sack')pl.def.sack+=Number(d.credit??1);
       else if(d.action==='Pressure')pl.def.pressure++;
       else if(d.action==='Hurry')pl.def.hurry++;
       else if(d.action==='Missed')pl.def.missed++;
     }
     if(p.passResult==='Interception'&&p.interception?.interceptor){
       const ip=ensurePlayer(team.players,p.interception.interceptor);
       if(ip){
         ip.def.int++;
         ip.def.intYds+=Math.abs((p.interception.returnEnd??p.interception.catchSpot)-p.interception.catchSpot);
         if(p.interception.returnTD)ip.def.intTD++;
       }
     }
   }
 }

 team.totalYards=team.rushYards+team.passYards;
 team.yardsPerPlay=team.plays?team.totalYards/team.plays:0;
 team.rushAvg=team.rushAtt?team.rushYards/team.rushAtt:0;
 team.passAvg=team.passAtt?team.passYards/team.passAtt:0;
 return team
}
function gameAnalytics(g,t){return {team:computeTeamStats(g,'team'),opp:computeTeamStats(g,'opp')}}
function fmtAvg(y,n){return n?(y/n).toFixed(1):'0.0'}
function pct(n,d){return d?Math.round(n/d*100):0}
function playerButton(side,n){return `<button class="stat-player-link" data-stat-side="${side}" data-stat-player="${esc(n)}">#${esc(n)}</button>`}
function metric(label,value,sub='',cls=''){
 return `<div class="analytics-kpi ${cls}"><span>${label}</span><b>${value}</b>${sub?`<small>${sub}</small>`:''}</div>`
}
function offenseTables(stats){
 const players=Object.values(stats.players).sort((a,b)=>Number(a.number)-Number(b.number));
 const qbs=players.filter(p=>p.pass.att||p.pass.comp||p.pass.yds||p.pass.sacks||p.pass.int||p.pass.td);
 const rbs=players.filter(p=>p.rush.car);
 const wrs=players.filter(p=>p.rec.tar||p.rec.rec);

 const qbRows=qbs.length?qbs.map(p=>`<tr><td>${playerButton(stats.side,p.number)}</td><td>${p.pass.comp}/${p.pass.att}</td><td>${pct(p.pass.comp,p.pass.att)}%</td><td>${p.pass.yds}</td><td>${p.pass.td}</td><td>${p.pass.int}</td><td>${p.pass.sacks}</td></tr>`).join(''):`<tr><td colspan="7" class="stat-empty">No QB stats recorded yet</td></tr>`;
 const rbRows=rbs.length?rbs.map(p=>`<tr><td>${playerButton(stats.side,p.number)}</td><td>${p.rush.car}</td><td>${p.rush.yds}</td><td>${fmtAvg(p.rush.yds,p.rush.car)}</td><td>${p.rush.td}</td><td>${p.fum}</td></tr>`).join(''):`<tr><td colspan="6" class="stat-empty">No rushing player stats recorded yet</td></tr>`;
 const wrRows=wrs.length?wrs.map(p=>`<tr><td>${playerButton(stats.side,p.number)}</td><td>${p.rec.tar}</td><td>${p.rec.rec}</td><td>${p.rec.yds}</td><td>${fmtAvg(p.rec.yds,p.rec.rec)}</td><td>${p.rec.td}</td></tr>`).join(''):`<tr><td colspan="6" class="stat-empty">No receiving player stats recorded yet</td></tr>`;

 return `
 <div class="stat-section"><h4>Quarterbacks</h4><div class="stat-table-wrap"><table class="stat-table"><thead><tr><th>Player</th><th>C/A</th><th>Cmp%</th><th>Yds</th><th>TD</th><th>INT</th><th>Sk</th></tr></thead><tbody>${qbRows}</tbody></table></div></div>
 <div class="stat-section"><h4>Rushing</h4><div class="stat-table-wrap"><table class="stat-table"><thead><tr><th>Player</th><th>Car</th><th>Yds</th><th>Avg</th><th>TD</th><th>Fum</th></tr></thead><tbody>${rbRows}</tbody></table></div></div>
 <div class="stat-section"><h4>Receiving</h4><div class="stat-table-wrap"><table class="stat-table"><thead><tr><th>Player</th><th>Tgt</th><th>Rec</th><th>Yds</th><th>Avg</th><th>TD</th></tr></thead><tbody>${wrRows}</tbody></table></div></div>`
}
function defenseTable(stats){
 const players=Object.values(stats.players)
   .filter(p=>p.def.tackle||p.def.sack||p.def.int||p.def.pressure||p.def.hurry||p.def.missed)
   .sort((a,b)=>((b.def.tackle+b.def.sack+b.def.int)-(a.def.tackle+a.def.sack+a.def.int)));
 const rows=players.length?players.map(p=>`<tr><td>${playerButton(stats.side,p.number)}</td><td>${p.def.tackle.toFixed(1)}</td><td>${p.def.sack.toFixed(1)}</td><td>${p.def.int}</td><td>${p.def.intYds}</td><td>${p.def.pressure}</td><td>${p.def.hurry}</td><td>${p.def.missed}</td></tr>`).join(''):`<tr><td colspan="8" class="stat-empty">No defensive player stats recorded yet</td></tr>`;
 return `<div class="stat-section"><h4>Defense</h4><div class="stat-table-wrap"><table class="stat-table"><thead><tr><th>Player</th><th>Tkl</th><th>Sk</th><th>INT</th><th>INT Yds</th><th>Prs</th><th>Hur</th><th>Miss</th></tr></thead><tbody>${rows}</tbody></table></div></div>`
}

function teamAnalyticsColumn(g,t,side,stats){
 const ts=teamSide(g,t,side);
 return `<section class="analytics-team-card" style="--team-color:${ts.color}">
   <div class="analytics-team-head">
     <span class="analytics-swatch" style="background:${ts.color}"></span>
     <div><h3>${esc(ts.name)}</h3><small>${stats.plays} offensive plays · ${stats.yardsPerPlay.toFixed(1)} yards/play</small></div>
   </div>

   <div class="analytics-hero-row">
     <div class="analytics-total"><span>TOTAL OFFENSE</span><b>${stats.totalYards}</b><small>yards</small></div>
     <div class="analytics-split">
       <div><span>Rushing</span><b>${stats.rushYards}</b><small>${stats.rushAtt} att · ${stats.rushAvg.toFixed(1)} avg</small></div>
       <div><span>Passing</span><b>${stats.passYards}</b><small>${stats.completions}/${stats.passAtt} · ${pct(stats.completions,stats.passAtt)}%</small></div>
     </div>
   </div>

   <div class="analytics-kpis">
     ${metric('First Downs',stats.firstDowns)}
     ${metric('Turnovers',stats.turnovers)}
     ${metric('3rd Down',`${stats.thirdMade}/${stats.thirdAtt}`,`${pct(stats.thirdMade,stats.thirdAtt)}%`)}
     ${metric('4th Down',`${stats.fourthMade}/${stats.fourthAtt}`,`${pct(stats.fourthMade,stats.fourthAtt)}%`)}
     ${metric('Sacks Allowed',stats.sacksAllowed)}
     ${metric('Yards / Play',stats.yardsPerPlay.toFixed(1))}
   </div>

   ${offenseTables(stats)}
   ${defenseTable(stats)}
 </section>`
}
function showGameAnalytics(g,t){
 const a=gameAnalytics(g,t);
 showModal(`<div class="analytics-modal">
   <div class="analytics-modal-head">
     <div><div class="eyebrow">IN-GAME ANALYTICS</div><h2>${esc(t.name)} vs ${esc(g.opponent)}</h2><p>Live game statistics calculated from recorded plays.</p></div>
     <button class="btn btn-light" id="closeAnalytics">Close</button>
   </div>
   <div class="analytics-compare">${teamAnalyticsColumn(g,t,'team',a.team)}${teamAnalyticsColumn(g,t,'opp',a.opp)}</div>
 </div>`);
 $('#closeAnalytics').onclick=closeModal;
 $$('[data-stat-player]').forEach(b=>b.onclick=()=>showPlayerStats(g,t,b.dataset.statSide,b.dataset.statPlayer))
}
function showPlayerStats(g,t,side,number){
 const a=computeTeamStats(g,side),p=a.players[String(number)]||ensurePlayer(a.players,String(number)),ts=teamSide(g,t,side);
 const hasPass=p.pass.att||p.pass.comp||p.pass.yds||p.pass.td||p.pass.int||p.pass.sacks;
 const hasRush=p.rush.car||p.rush.yds||p.rush.td;
 const hasRec=p.rec.tar||p.rec.rec||p.rec.yds||p.rec.td;
 const hasDef=p.def.tackle||p.def.sack||p.def.int||p.def.pressure||p.def.hurry||p.def.missed;
 showModal(`<div class="player-stat-modal">
   <div class="player-stat-hero" style="--team-color:${ts.color}">
     <div class="player-number">#${esc(number)}</div>
     <div><div class="eyebrow">${esc(ts.name)}</div><h2>Player Statistics</h2></div>
   </div>
   <div class="player-stat-grid">
     ${hasPass?`<div class="player-stat-card"><h4>Passing</h4><div class="player-stat-numbers"><div><b>${p.pass.comp}/${p.pass.att}</b><span>Comp/Att</span></div><div><b>${pct(p.pass.comp,p.pass.att)}%</b><span>Comp %</span></div><div><b>${p.pass.yds}</b><span>Yards</span></div><div><b>${p.pass.td}</b><span>TD</span></div><div><b>${p.pass.int}</b><span>INT</span></div><div><b>${p.pass.sacks}</b><span>Sacked</span></div></div></div>`:''}
     ${hasRush?`<div class="player-stat-card"><h4>Rushing</h4><div class="player-stat-numbers"><div><b>${p.rush.car}</b><span>Carries</span></div><div><b>${p.rush.yds}</b><span>Yards</span></div><div><b>${fmtAvg(p.rush.yds,p.rush.car)}</b><span>Avg</span></div><div><b>${p.rush.td}</b><span>TD</span></div><div><b>${p.fum}</b><span>Fumbles</span></div></div></div>`:''}
     ${hasRec?`<div class="player-stat-card"><h4>Receiving</h4><div class="player-stat-numbers"><div><b>${p.rec.tar}</b><span>Targets</span></div><div><b>${p.rec.rec}</b><span>Rec</span></div><div><b>${p.rec.yds}</b><span>Yards</span></div><div><b>${fmtAvg(p.rec.yds,p.rec.rec)}</b><span>Avg</span></div><div><b>${p.rec.td}</b><span>TD</span></div></div></div>`:''}
     ${hasDef?`<div class="player-stat-card"><h4>Defense</h4><div class="player-stat-numbers"><div><b>${p.def.tackle.toFixed(1)}</b><span>Tackles</span></div><div><b>${p.def.sack.toFixed(1)}</b><span>Sacks</span></div><div><b>${p.def.int}</b><span>INT</span></div><div><b>${p.def.intYds}</b><span>INT Yards</span></div><div><b>${p.def.intTD}</b><span>INT TD</span></div><div><b>${p.def.pressure}</b><span>Pressure</span></div><div><b>${p.def.hurry}</b><span>Hurry</span></div><div><b>${p.def.missed}</b><span>Missed</span></div></div></div>`:''}
     ${!hasPass&&!hasRush&&!hasRec&&!hasDef?`<div class="stat-empty">No recorded statistics for this player yet.</div>`:''}
   </div>
   <div class="modal-actions"><button class="btn btn-light" id="backAnalytics">Back to Game Analytics</button><button class="btn btn-primary" id="closePlayerStats">Close</button></div>
 </div>`);
 $('#backAnalytics').onclick=()=>showGameAnalytics(g,t);
 $('#closePlayerStats').onclick=closeModal
}

function renderGame(id){
 const g=state.games.find(x=>x.id===id);if(!g)return location.hash='#teams';normalizeGame(g);
 const t=state.teams.find(x=>x.id===g.teamId);if(!t)return location.hash='#teams';currentPlay=defaultPlay(g);
 const homeTeam=g.location==='Away'?'opp':'team';const left=teamSide(g,t,homeTeam),right=teamSide(g,t,other(homeTeam));left.score=homeTeam==='team'?g.teamScore:g.oppScore;right.score=homeTeam==='team'?g.oppScore:g.teamScore;
 const off=teamSide(g,t,g.poss),def=teamSide(g,t,other(g.poss));
 const stateLabel=g.gameOver?'FINAL':g.kickoffPending?'KICKOFF':g.puntPending?'PUNT':g.awaitingTry?'TRY':`${ordinal(g.down)} & ${g.toGo}`;
 shell(`<main class="game-page"><section class="game-top"><div class="game-brand"><img src="./assets/sidelineiq-header-logo.png" alt="SidelineIQ"></div><div class="score-card" style="background:${left.color};color:${textColor(left.color)}"><span class="team-label">${esc(left.name)}${homeTeam===g.poss?' <span class="poss-indicator" title="Possession">🏈</span>':''}</span><span class="score-value">${left.score}</span></div><div class="game-state"><div class="period period-control"><span>${g.format==='halves'?'H':'Q'}${g.period}</span><button class="period-next ${g.period>=(g.format==='halves'?2:4)?'game-over-btn':''}" id="nextPeriod" title="${g.gameOver?'Game is final':g.period>=(g.format==='halves'?2:4)?'End game':'Advance period'}">${g.gameOver?'FINAL':g.period>=(g.format==='halves'?2:4)?'Game Over':'›'}</button></div><div class="downline">${stateLabel}</div><div class="pos">${g.kickoffPending?(g.kickoff?.halftime?'Second-half kickoff':'Opening kickoff'):g.puntPending?(g.punt?.phase==='kick'?'Punt':'Punt return'):fmtDrive(g.los,g.driveDir)}</div></div><div class="score-card" style="background:${right.color};color:${textColor(right.color)}"><span class="score-value">${right.score}</span><span class="team-label">${other(homeTeam)===g.poss?'<span class="poss-indicator" title="Possession">🏈</span> ':''}${esc(right.name)}</span></div><div class="nav-strip"><button class="nav-button" onclick="location.hash='#team/${t.id}'"><span class="ico">▣</span>Games</button><button class="nav-button analytics-nav" id="gameAnalytics"><span class="ico">▥</span>Analytics</button><button class="nav-button" id="resetGame"><span class="ico">↻</span>Reset</button><button class="nav-button danger-nav" id="deleteGame"><span class="ico">✕</span>Delete</button><button class="nav-button"><span class="ico">⚙</span>Settings</button></div></section>
 <div class="main-grid"><section class="field-panel"><div class="field" id="field"></div><div class="field-controls"><div class="mini"><small>Line of Scrimmage</small><div class="los-control"><select id="losSide"><option>OWN</option><option>OPP</option><option>50</option></select><input id="losYard" type="number" min="0" max="49"><button class="btn btn-light" id="setLos">Set</button></div></div><div class="mini"><small>Ball at</small><b id="ballText">${g.kickoffPending?'—':fmtDrive(g.los,g.driveDir)}</b></div><div class="mini"><small>Distance</small><b>${g.kickoffPending?'—':g.toGo}</b></div><div class="mini"><small>Down</small><b>${g.kickoffPending?'—':g.down}</b></div><div class="mini"><small>State</small><b>${g.kickoffPending?'KO':g.awaitingTry?'TRY':'LIVE'}</b></div></div></section>
 <aside class="recent-panel"><div class="recent-head"><span>Recent Plays</span><button class="btn btn-light all-plays-btn" id="allPlays">View All</button></div><div class="recent-list">${recentRows(g,t)}</div><div class="recent-actions"><button class="btn btn-light" id="editPlay">Edit Selected</button><button class="btn btn-light" id="undoPlay">Undo Last Play</button></div></aside></div>
 <section class="workbench"><div class="pane off"><div class="pane-title">OFFENSE</div><div class="pane-body">${offensePane(g)}</div></div><div class="pane def"><div class="pane-title">DEFENSE</div><div class="pane-body">${defensePane(g)}</div></div><div class="pane st"><div class="pane-title">SPECIAL TEAMS</div><div class="pane-body">${specialPane(g,t)}</div></div><div class="pane pen"><div class="pane-title">PENALTY</div><div class="pane-body">${penaltyPane()}</div></div></section>
 <section class="savebar"><input class="play-note" id="playNote" placeholder="Play notes (optional) — e.g. screen right, blitz, alignment..."><div class="save-actions"><button class="btn btn-primary" id="savePlay">✓ Save Play</button><button class="btn btn-light" id="clearPlay">Clear</button></div></section></main>`);
 bindGame(g,t);drawField(g,t)
}

function offensePane(g){
 if(g.kickoffPending)return `<div class="notice">Finish the kickoff in Special Teams before recording an offensive play.</div>`;
 if(g.awaitingTry&&g.tryType==='2PT'){
   return `<div class="notice two-point-notice"><b>2-Point Conversion</b><br>Ball placed at OPP 5. Record the run/pass, then mark the try Successful or Failed.</div><div class="section-label">Play Type</div><div class="seg" id="playTypes"><button class="active" data-type="Run">Run</button><button data-type="Pass">Pass</button></div><div id="offDynamic">${runFields(g)}</div><div class="section-label">Try Result</div><div class="seg" id="tryResult"><button data-try="successful">Successful</button><button data-try="failed">Failed</button></div><div class="summary" id="offSummary">Drag the football to the end of the conversion attempt.</div>${offenseMemory(g)}`
 }
 return `<div class="section-label">Play Type</div><div class="seg" id="playTypes"><button class="active" data-type="Run">Run</button><button data-type="Pass">Pass</button></div><div id="offDynamic">${runFields(g)}</div><div class="section-label">Result</div><div class="seg" id="offScore"><button class="active" data-score="">Normal</button><button data-score="TD">Touchdown</button><button data-score="2PT">2-Point Try</button><button id="fumbleBtn">Fumble</button></div><div class="summary" id="offSummary">Drag the football to the end of the play.</div>${offenseMemory(g)}`
}
function runFields(g){
 const m=rememberedPlayers(g,g.poss),last=m.rb[0]||'';
 return `<div class="form-row"><label>Ball Carrier #</label><input id="player" inputmode="numeric" placeholder="#" value="${esc(last)}"></div>${badSnapFields()}`
}
function interceptionFields(g){
 const i=currentPlay.interception||{phase:'catch',interceptor:'',catchSpot:currentPlay.end??g.los,returnEnd:null,returnTD:false,tacklers:[]};
 if(i.phase==='catch')return `<div class="turnover-workflow"><div class="workflow-steps"><b class="active">1 · INTERCEPTION</b><span>›</span><b>2 · RETURN</b></div><div class="form-row"><label>Interceptor #</label><input id="interceptorNum" inputmode="numeric" value="${esc(i.interceptor||'')}" placeholder="#"></div><div class="notice">Drag the football to the interception spot, then lock it.</div><button class="btn btn-primary" id="lockInterception">Lock Interception →</button></div>`;
 return `<div class="turnover-workflow"><div class="workflow-steps"><b>✓ INTERCEPTION</b><span>›</span><b class="active">2 · RETURN</b></div><div class="summary">Interceptor #${esc(i.interceptor||'—')} · interception spot locked</div><div class="notice">Field perspective is now the intercepting team. Drag the football to the end of the return.</div><div class="form-row"><label>Return tackler #</label><input id="intTackler" inputmode="numeric" placeholder="Optional"><button class="btn btn-light" id="addIntTackler">Add</button></div><div class="summary">Return tacklers: ${(i.tacklers||[]).length?i.tacklers.map(x=>'#'+esc(x)).join(', '):'—'}</div><label class="inline-check"><input type="checkbox" id="intReturnTD" ${i.returnTD?'checked':''}> Interception return TD</label></div>`
}
function sackFields(){
 const sacks=currentPlay.defenders.filter(d=>d.action==='Sack');
 return `<div class="sack-workflow"><div class="section-label">Defensive Sack Credit</div><div class="form-row"><label>Defender #</label><input id="sackDefender" inputmode="numeric" placeholder="#"><div class="seg compact-credit" id="sackCredit"><button class="active" data-credit="1">1.0</button><button data-credit="0.5">0.5</button></div><button class="btn btn-light" id="addSackCredit">Add Sack</button></div><div class="summary">${sacks.length?sacks.map(d=>`#${esc(d.n)} Sack ${Number(d.credit??1).toFixed(1)}`).join(' · '):'Add the defender(s) credited with the sack.'}</div></div>`
}
function passFields(g){
 const m=rememberedPlayers(g,g.poss),last=m.qb[0]||'';
 return `<div class="form-row"><label>QB #</label><input id="qb" inputmode="numeric" value="${esc(currentPlay.qb||last)}"><label>Receiver #</label><input id="receiver" inputmode="numeric" value="${esc(currentPlay.receiver||'')}"></div><div class="seg" id="passResult"><button class="${currentPlay.passResult==='Complete'?'active':''}">Complete</button><button class="${currentPlay.passResult==='Incomplete'?'active':''}">Incomplete</button><button class="${currentPlay.passResult==='Interception'?'active':''}">Interception</button><button class="${currentPlay.passResult==='Sack'?'active':''}">Sack</button></div>${currentPlay.passResult==='Interception'?interceptionFields(g):''}${currentPlay.passResult==='Sack'?sackFields():''}${badSnapFields()}`
}

function defensePane(g){
 return `<div class="form-row"><label>Player #</label><input id="defNum" inputmode="numeric"><div class="seg compact-credit" id="defCredit"><button class="active" data-credit="1">1.0</button><button data-credit="0.5">0.5</button></div></div><div class="section-label">Action</div><div class="action-grid"><button data-def="Tackle">Tackle</button><button data-def="Sack">Sack</button><button class="alt" data-def="Missed">Missed</button><button class="alt" data-def="Pressure">Pressure</button><button class="alt" data-def="Hurry">Hurry</button><button class="score" data-dscore="Safety">Safety +2</button><button class="score" data-dscore="Def TD">Def. TD +6</button></div><div class="summary" id="defList">No defensive actions yet.</div>${defenseMemory(g)}`
}

function penaltyPane(){return `<div class="section-label">Side</div><div class="seg pen-toggle" id="penSideToggle"><button class="active" data-pen-side="Offense">Offense</button><button data-pen-side="Defense">Defense</button></div><div class="section-label">Apply To</div><div class="seg pen-toggle" id="penApplyToggle"><button class="active" data-apply="current">Current</button><button data-apply="former">Former</button></div><div class="section-label">Status</div><div class="seg pen-toggle" id="penStatusToggle"><button class="active" data-status="accepted">Accepted</button><button data-status="declined">Declined</button></div><div class="form-row"><select id="penType"><option>Holding</option><option>False Start</option><option>Delay of Game</option><option>Offside</option><option>Pass Interference</option><option>Personal Foul</option><option>Illegal Formation</option><option>Illegal Motion</option><option>Facemask</option><option>Unsportsmanlike Conduct</option><option>Other</option></select><input id="penYards" type="number" value="10" aria-label="Penalty yards" placeholder="Yards"></div><div class="form-row"><input id="penPlayer" inputmode="numeric" placeholder="Player #" aria-label="Player number"></div><div class="pen-checks"><label><input type="checkbox" id="spotFoul"> Enforce from spot of foul</label><div id="foulSpotFields" class="foul-spot-fields hidden"><span class="field-hint">Spot of foul</span><select id="foulSpotSide" aria-label="Spot of foul side"><option>OWN</option><option>OPP</option><option>50</option></select><input id="foulSpotYard" type="number" min="0" max="49" placeholder="Yard" aria-label="Spot of foul yard line"></div><label><input type="checkbox" id="negate"> Ignore play yardage; enforce from previous LOS</label><label><input type="checkbox" id="repeatDown"> Repeat down / no play</label><label><input type="checkbox" id="autoFirst"> Automatic first down</label></div><div class="form-row"><button class="btn btn-light" id="attachPenalty">Apply Penalty</button><button class="btn btn-light" id="clearPenalty">Clear Current</button></div><div class="summary penalty-list" id="penSummary">No penalties applied.</div>`}
function specialPane(g,t){
 if(g.kickoffPending)return kickoffPane(g,t);
 if(g.puntPending)return puntPane(g,t);
 return `<div class="seg" id="stTypes"><button class="active" data-st="Kickoff">Kickoff</button><button data-st="Punt">Punt</button><button data-st="Field Goal">Field Goal</button><button data-st="PAT">PAT</button></div><div id="stDynamic">${manualKickoffFields()}</div>`
}
function manualKickoffFields(){return `<div class="notice">Start a kickoff after a score. Kicking team is the current possession team.</div><div class="form-row"><label>Kicker #</label><input id="stKicker"><label>Kick from</label><input id="stFrom" type="number" value="40"></div><button class="btn btn-light" id="startKickoff">Start Kickoff Workflow</button>`}
function puntFields(){return `<div class="notice">Start the punt workflow. You will mark the punt landing spot first, lock it in, then enter the return.</div><button class="btn btn-light" id="startPunt">Start Punt Workflow</button>`}
function puntPane(g,t){
 const p=g.punt,punting=teamSide(g,t,p.puntingTeam),receiving=teamSide(g,t,p.receivingTeam);
 if(p.phase==='kick')return `<div class="kick-steps"><div class="step active">1 · KICK</div><span>›</span><div class="step">2 · RETURN</div></div><div class="notice"><b>${esc(punting.name)}</b> punts from ${fmtDrive(p.startSpot,p.kickDir||1)}. Enter punter, drag the football to the landing/catch spot, then lock it in.</div><div class="form-row"><label>Punter #</label><input id="puntPunter" value="${esc(p.punter||'')}"></div><div class="summary">Landing: <b>${p.landing==null?'drag football':fmtDrive(p.landing,p.kickDir||1)}</b>${p.landing==null?'':` · ${Math.abs(p.landing-p.startSpot)} yd punt`}</div><div class="form-row"><button class="btn btn-light" id="puntTouchbackKick">Touchback</button><button class="btn btn-primary" id="lockPunt" ${p.landing==null?'disabled':''}>Lock Landing →</button></div>`;
 return `<div class="kick-steps"><div class="step done">✓ KICK</div><span>›</span><div class="step active">2 · RETURN</div></div><div class="notice"><b>${esc(receiving.name)}</b> return. Field perspective has flipped to the receiving team.</div><div class="form-row"><label>Returner #</label><input id="puntReturner" value="${esc(p.returner||'')}"><label>Tackler #</label><input id="puntTackler"><button class="btn btn-light" id="addPuntTackler">Add</button></div><div class="summary">Catch: <b>${fmtDrive(p.landing,-(p.kickDir||1))}</b> · End: <b>${p.returnEnd==null?'drag football':fmtDrive(p.returnEnd,-(p.kickDir||1))}</b><br>Tacklers: ${p.tacklers.length?p.tacklers.map(x=>'#'+esc(x)).join(', '):'—'}</div><div class="form-row"><button class="btn btn-light" id="puntTouchbackReturn">Touchback</button><button class="btn btn-light" id="puntReturnTD">${p.returnTD?'✓ Return TD':'Return TD'}</button><button class="btn btn-primary" id="finishPunt" ${p.returnEnd==null?'disabled':''}>Finish Punt</button></div>`
}
function kickFields(type){return `<div class="form-row"><label>Kicker #</label><input id="stKicker"><label>${type==='PAT'?'Try':'Distance'}</label><input id="stDistance" type="number" value="${type==='PAT'?1:35}"></div><div class="seg" id="kickGood"><button data-good="true">Good</button><button data-good="false">No Good</button></div>`}
function kickoffPane(g,t){
 const k=g.kickoff,kick=teamSide(g,t,k.kickingTeam),rec=teamSide(g,t,k.receivingTeam);
 if(k.phase==='kick')return `<div class="kick-steps"><div class="step active">1 · KICK</div><span>›</span><div class="step">2 · RETURN</div></div><div class="notice">${k.halftime?'<b>SECOND-HALF KICKOFF</b><br>':''}<b>${esc(kick.name)}</b> kicks from OWN ${k.startYard}. Enter kicker, then drag the football to the landing/catch spot.</div><div class="form-row"><label>Kicker #</label><input id="koKicker" value="${esc(k.kicker||'')}"></div><div class="summary">Landing: <b>${k.landing==null?'drag football':fmtDrive(k.landing,k.kickDir||1)}</b>${k.landing==null?'':` · ${Math.abs(k.landing-(k.startSpot??k.startYard))} yd kick`}</div><div class="form-row"><button class="btn btn-light" id="touchbackKick">Touchback</button><button class="btn btn-primary" id="lockKick" ${k.landing==null?'disabled':''}>Lock Landing →</button></div>`;
 return `<div class="kick-steps"><div class="step done">✓ KICK</div><span>›</span><div class="step active">2 · RETURN</div></div><div class="notice"><b>${esc(rec.name)}</b> return. Field perspective has flipped to the receiving team.</div><div class="form-row"><label>Returner #</label><input id="koReturner" value="${esc(k.returner||'')}"><label>Tackler #</label><input id="koTackler"><button class="btn btn-light" id="addKoTackler">Add</button></div><div class="summary">Catch: <b>${fmtDrive(k.landing,-(k.kickDir||1))}</b> · End: <b>${k.returnEnd==null?'drag football':fmtDrive(k.returnEnd,-(k.kickDir||1))}</b><br>Tacklers: ${k.tacklers.length?k.tacklers.map(x=>'#'+esc(x)).join(', '):'—'}</div><div class="form-row"><button class="btn btn-light" id="touchbackReturn">Touchback</button><button class="btn btn-light" id="kickReturnTD">${k.returnTD?'✓ Return TD':'Return TD'}</button><button class="btn btn-primary" id="finishKickoff" ${k.returnEnd==null?'disabled':''}>Finish Kickoff</button></div>`
}
function recentRows(g,t){return [...g.plays].reverse().slice(0,25).map((p,i)=>{const n=g.plays.length-i,team=p.team||p.before?.poss||'team',tm=teamSide(g,t,team),abbr=teamAbbr(tm.name),bg1=lighten(tm.color,.84),bg2=lighten(tm.secondary||tm.color,.90);return `<div class="play-row" data-play="${p.id}" style="background:linear-gradient(90deg,${bg1},${bg2});border-left:4px solid ${tm.color};color:#132D36"><div>${n}</div><div>${p.period||p.before?.period||1}</div><div>${esc(p.time||'')}</div><div><b>${abbr}</b></div><div class="desc">${esc(p.desc||'')}</div><div class="yds">${Number.isFinite(p.yds)?(p.yds>0?'+':'')+p.yds:''}</div></div>`}).join('')||'<div class="empty">No plays yet.</div>'}


function playTeamName(g,t,p){
 const side=p.team||p.before?.poss||'team';
 return teamSide(g,t,side).name
}
function playPeriodLabel(g,p){
 const n=p.period||p.before?.period||1;
 return g.format==='halves'?`H${n}`:`Q${n}`
}
function allPlayRows(g,t){
 if(!(g.plays||[]).length)return `<div class="allplays-empty">No plays recorded yet.</div>`;
 return [...g.plays].map((p,i)=>{
   const side=p.team||p.before?.poss||'team';
   const tm=teamSide(g,t,side);
   const y=Number.isFinite(p.yds)?p.yds:statYards(p);
   const defenders=(p.defenders||[]).map(d=>`#${esc(d.n)} ${esc(d.action)}`).join(' · ');
   return `<div class="allplay-row" data-allplay="${p.id}" style="--play-team:${tm.color}">
     <div class="allplay-num">${i+1}</div>
     <div class="allplay-period">${playPeriodLabel(g,p)}</div>
     <div class="allplay-team">${teamAbbr(tm.name)}</div>
     <div class="allplay-main">
       <div class="allplay-desc">${esc(p.desc||p.kind||'Play')}</div>
       ${defenders?`<div class="allplay-defense">${defenders}</div>`:''}
     </div>
     <div class="allplay-yards">${Number.isFinite(y)?(y>0?'+':'')+y:''}</div>
     <button class="btn btn-light allplay-edit" data-edit-allplay="${p.id}">Edit</button>
   </div>`
 }).join('')
}
function showAllPlays(g,t){
 showModal(`<div class="allplays-modal">
   <div class="allplays-head">
     <div><div class="eyebrow">GAME LOG</div><h2>All Plays</h2><p>${esc(t.name)} vs ${esc(g.opponent)} · ${g.plays.length} recorded plays</p></div>
     <button class="btn btn-light" id="closeAllPlays">Close</button>
   </div>
   <div class="allplays-tools">
     <input id="playSearch" placeholder="Search plays, player numbers, tackles..." autocomplete="off">
     <select id="playPeriodFilter"><option value="">All periods</option>${Array.from({length:g.format==='halves'?2:4},(_,i)=>`<option value="${i+1}">${g.format==='halves'?'Half':'Quarter'} ${i+1}</option>`).join('')}</select>
     <select id="playTeamFilter"><option value="">Both teams</option><option value="team">${esc(t.name)}</option><option value="opp">${esc(g.opponent)}</option></select>
   </div>
   <div class="allplays-list" id="allPlaysList">${allPlayRows(g,t)}</div>
 </div>`);
 $('#closeAllPlays').onclick=closeModal;

 const apply=()=>{
   const q=($('#playSearch')?.value||'').trim().toLowerCase();
   const per=$('#playPeriodFilter')?.value||'';
   const team=$('#playTeamFilter')?.value||'';
   $$('.allplay-row').forEach(row=>{
     const p=g.plays.find(x=>x.id===row.dataset.allplay);
     const txt=row.textContent.toLowerCase();
     const pper=String(p?.period||p?.before?.period||1);
     const pteam=p?.team||p?.before?.poss||'team';
     row.style.display=(!q||txt.includes(q))&&(!per||pper===per)&&(!team||pteam===team)?'grid':'none'
   })
 };
 $('#playSearch').oninput=apply;
 $('#playPeriodFilter').onchange=apply;
 $('#playTeamFilter').onchange=apply;
 $$('[data-edit-allplay]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.editAllplay;
   closeModal();
   showPlayEditor(g,t,id)
 })
}
function defenderEditorRows(p){
 const defs=p.defenders||[];
 return defs.length?defs.map((d,i)=>{
   const action=d.action==='Assist'?'Tackle':d.action;
   const credit=Number(d.credit??(d.action==='Assist'?0.5:1));
   return `<div class="retro-defender-row">
   <input class="retro-def-num" data-def-i="${i}" inputmode="numeric" value="${esc(d.n||'')}" placeholder="#">
   <select class="retro-def-action" data-def-i="${i}">${['Tackle','Sack','Pressure','Hurry','Missed'].map(a=>`<option ${action===a?'selected':''}>${a}</option>`).join('')}</select>
   <select class="retro-def-credit" data-def-i="${i}"><option value="1" ${credit===1?'selected':''}>1.0</option><option value="0.5" ${credit===0.5?'selected':''}>0.5</option></select>
   <button class="btn btn-light retro-remove-def" data-remove-def="${i}">Remove</button>
 </div>`}).join(''):`<div class="retro-empty-defense">No defenders recorded on this play.</div>`
}

function offensiveEditFields(p){
 const parsed=parsedPlayPlayers(p);
 if(p.kind==='Run')return `<div class="retro-grid">
   <div class="field"><label>Ball Carrier #</label><input id="retroPlayer" inputmode="numeric" value="${esc(parsed.player||'')}"></div>
   <div class="field"><label>Fumble</label><select id="retroFumble"><option value="no" ${!p.fumble?'selected':''}>No</option><option value="Offense" ${p.fumble&&p.fumbleRecovery==='Offense'?'selected':''}>Yes · Recovered by Offense</option><option value="Defense" ${p.fumble&&p.fumbleRecovery==='Defense'?'selected':''}>Yes · Recovered by Defense</option></select></div>
 </div>`;
 if(p.kind==='Pass')return `<div class="retro-grid">
   <div class="field"><label>QB #</label><input id="retroQB" inputmode="numeric" value="${esc(parsed.qb||'')}"></div>
   <div class="field"><label>Receiver #</label><input id="retroReceiver" inputmode="numeric" value="${esc(parsed.receiver||'')}"></div>
   <div class="field"><label>Pass Result</label><select id="retroPassResult">${['Complete','Incomplete','Interception','Sack'].map(x=>`<option ${parsed.result===x?'selected':''}>${x}</option>`).join('')}</select></div>
   <div class="field"><label>Fumble</label><select id="retroFumble"><option value="no" ${!p.fumble?'selected':''}>No</option><option value="Offense" ${p.fumble&&p.fumbleRecovery==='Offense'?'selected':''}>Yes · Recovered by Offense</option><option value="Defense" ${p.fumble&&p.fumbleRecovery==='Defense'?'selected':''}>Yes · Recovered by Defense</option></select></div>
 </div>`;
 return `<div class="retro-note">This is a ${esc(p.kind||'special teams')} play. You can correct the description, period, statistical yardage, and defensive actions below.</div>`
}
function showPlayEditor(g,t,id){
 const p=g.plays.find(x=>x.id===id);
 if(!p){toast('Play not found.');return showAllPlays(g,t)}
 const originalYds=Number.isFinite(p.yds)?p.yds:statYards(p);
 const period=p.period||p.before?.period||1;
 showModal(`<div class="retro-edit-modal">
   <div class="retro-edit-head">
     <div><div class="eyebrow">EDIT RECORDED PLAY</div><h2>Play ${g.plays.indexOf(p)+1} · ${esc(p.kind||'Play')}</h2><p>${esc(playTeamName(g,t,p))} · ${playPeriodLabel(g,p)}</p></div>
     <button class="btn btn-light" id="cancelRetroEdit">Back to All Plays</button>
   </div>

   <div class="retro-section">
     <h3>Play Details</h3>
     <div class="retro-grid">
       <div class="field"><label>Period</label><select id="retroPeriod">${Array.from({length:g.format==='halves'?2:4},(_,i)=>`<option value="${i+1}" ${period===i+1?'selected':''}>${g.format==='halves'?'Half':'Quarter'} ${i+1}</option>`).join('')}</select></div>
       <div class="field"><label>Statistical Yards</label><input id="retroYards" type="number" value="${originalYds}"><small>Changing this updates the stored end spot for statistics; it does not rewind current game state.</small></div>
     </div>
     ${offensiveEditFields(p)}
     <div class="field"><label>Description</label><textarea id="retroDesc" rows="3">${esc(p.desc||'')}</textarea></div>
   </div>

   <div class="retro-section">
     <div class="retro-section-head"><div><h3>Defense</h3><p>Add or correct tackles, assists, sacks, pressures, hurries, and missed tackles.</p></div></div>
     <div id="retroDefenders">${defenderEditorRows(p)}</div>
     <div class="retro-add-defense">
       <input id="retroNewDefender" inputmode="numeric" placeholder="Defender #">
       <select id="retroNewAction"><option>Tackle</option><option>Sack</option><option>Pressure</option><option>Hurry</option><option>Missed</option></select>
       <select id="retroNewCredit"><option value="1">1.0</option><option value="0.5">0.5</option></select>
       <button class="btn btn-light" id="retroAddDefender">+ Add Defender</button>
     </div>
   </div>

   <div class="retro-savebar">
     <button class="btn btn-light" id="retroBack">Cancel</button>
     <button class="btn btn-primary" id="retroSave">Save Corrections</button>
   </div>
 </div>`);

 const collectDefenders=()=>{
   const defs=[];
   $$('.retro-defender-row').forEach(row=>{
     const n=row.querySelector('.retro-def-num')?.value.trim();
     let action=row.querySelector('.retro-def-action')?.value;
     const credit=Number(row.querySelector('.retro-def-credit')?.value||1);
     if(action==='Assist')action='Tackle';
     if(n)defs.push({n,action,credit:(action==='Tackle'||action==='Sack')?credit:1})
   });
   return defs
 };
 const rerenderDefs=(defs)=>{
   p.defenders=defs;
   $('#retroDefenders').innerHTML=defenderEditorRows(p);
   bindDefRows()
 };
 const bindDefRows=()=>{
   $$('.retro-remove-def').forEach(b=>b.onclick=()=>{
     const defs=collectDefenders();
     defs.splice(Number(b.dataset.removeDef),1);
     rerenderDefs(defs)
   })
 };
 bindDefRows();

 $('#retroAddDefender').onclick=()=>{
   const n=$('#retroNewDefender').value.trim();
   if(!n)return toast('Enter a defender number.');
   const defs=collectDefenders();
   defs.push({n,action:$('#retroNewAction').value,credit:Number($('#retroNewCredit')?.value||1)});
   $('#retroNewDefender').value='';
   rerenderDefs(defs)
 };

 const back=()=>{closeModal();showAllPlays(g,t)};
 $('#cancelRetroEdit').onclick=back;
 $('#retroBack').onclick=back;

 $('#retroSave').onclick=()=>{
   p.period=Number($('#retroPeriod').value)||period;
   const y=Number($('#retroYards').value);
   if(Number.isFinite(y)){
     const dir=p.before?.driveDir??1;
     const start=Number.isFinite(p.start)?p.start:(p.before?.los??0);
     p.start=start;
     p.end=clamp(start+y*dir);
     p.yds=y;
   }

   if(p.kind==='Run'){
     p.player=$('#retroPlayer')?.value.trim()||'';
   }
   if(p.kind==='Pass'){
     p.qb=$('#retroQB')?.value.trim()||'';
     p.receiver=$('#retroReceiver')?.value.trim()||'';
     p.passResult=$('#retroPassResult')?.value||p.passResult||'Complete';
   }
   if($('#retroFumble')){
     const f=$('#retroFumble').value;
     p.fumble=f!=='no';
     p.fumbleRecovery=f==='no'?null:f;
   }

   p.defenders=collectDefenders();
   p.desc=$('#retroDesc').value.trim()||p.desc;

   save();
   closeModal();
   toast('Play corrections saved.');
   renderGame(g.id);
   showAllPlays(g,t)
 }
}

function resetGameState(g){
 const openingKick=g.openingKick||'team';
 const receiving=other(openingKick);
 const kickoffYard=g.kickoffYard||40;
 g.teamScore=0;g.gameOver=false;
 g.oppScore=0;
 g.period=1;
 g.down=1;
 g.toGo=10;
 g.los=20;
 g.poss=receiving;
 g.plays=[];
 g.awaitingTry=false;g.puntPending=false;g.punt=null;
 g.tryType=null;
 g.driveDir=1;
 g.kickoffPending=true;
 g.kickoff={
   phase:'kick',
   kickingTeam:openingKick,
   receivingTeam:receiving,
   startYard:kickoffYard,
   kickDir:1,
   startSpot:kickoffYard,
   landing:null,
   returnEnd:null,
   kicker:'',
   returner:'',
   tacklers:[],
   touchback:false
 };
 selectedPlayId=null;
}


function beginHalftimeKickoff(g){
 const openingKicker=g.openingKick||'team';
 const secondHalfKicker=other(openingKicker);
 const secondHalfReceiver=openingKicker;
 const from=g.kickoffYard||40;
 const kickDir=1;

 g.awaitingTry=false;
 g.tryType=null;
 g.kickoffPending=true;
 g.poss=secondHalfReceiver;
 g.down=1;
 g.toGo=10;
 g.driveDir=-1;
 g.kickoff={
   phase:'kick',
   kickingTeam:secondHalfKicker,
   receivingTeam:secondHalfReceiver,
   startYard:from,
   kickDir,
   startSpot:screenSpot(from,kickDir),
   landing:null,
   returnEnd:null,
   kicker:'',
   returner:'',
   tacklers:[],
   touchback:false,
   halftime:true
 };
 g.los=g.kickoff.startSpot;
 currentPlay=defaultPlay(g);
 selectedSt='Kickoff';
}

function bindGame(g,t){
 if($('#gameAnalytics'))$('#gameAnalytics').onclick=()=>showGameAnalytics(g,t);
 if($('#allPlays'))$('#allPlays').onclick=()=>showAllPlays(g,t);
 $('#resetGame').onclick=()=>{
   const ok=confirm(`Are you sure you want to reset this game against ${g.opponent}?\n\nThis will permanently clear all plays, scores, penalties, and game progress. The game itself will remain on the schedule.`);
   if(!ok)return;
   resetGameState(g);
   save();
   toast('Game reset');
   renderGame(g.id);
 };
 $('#deleteGame').onclick=()=>{
   const ok=confirm(`Are you sure you want to DELETE this game against ${g.opponent}?\n\nThis will permanently delete the game and all recorded plays and statistics. This cannot be undone.`);
   if(!ok)return;
   const teamId=g.teamId;
   state.games=state.games.filter(x=>x.id!==g.id);
   save();
   location.hash='#team/'+teamId;
 };
 const sy=sideYard(relSpot(g.los,g.driveDir||1));$('#losSide').value=sy.side;$('#losYard').value=sy.yard;
 $('#setLos').onclick=()=>{if(g.kickoffPending)return toast('Finish the kickoff first.');if(g.puntPending)return toast('Finish the punt first.');const side=$('#losSide').value,y=+$('#losYard').value||0;const rel=side==='50'?50:side==='OWN'?y:100-y;g.los=screenSpot(rel,g.driveDir||1);g.los=clamp(g.los);currentPlay.end=g.los;save();renderGame(g.id)};
 $('#savePlay').onclick=()=>savePlay(g,t);$('#clearPlay').onclick=()=>renderGame(g.id);$('#undoPlay').onclick=()=>undoPlay(g);$('#editPlay').onclick=()=>editSelected(g);
 if($('#nextPeriod'))$('#nextPeriod').onclick=()=>{
   const max=g.format==='halves'?2:4;
   if(g.period>=max){
     if(g.gameOver)return toast('Game is already final.');
     const team=teamSide(g,t,'team'),opp=teamSide(g,t,'opp');
     if(!confirm(`End the game?\n\nFinal score: ${team.name} ${team.score} – ${opp.score} ${opp.name}`))return;
     g.gameOver=true;save();toast('Game marked final.');renderGame(g.id);return
   }
   const fromPeriod=g.period,toPeriod=g.period+1;
   const secondHalfBoundary=(g.format==='quarters'&&fromPeriod===2&&toPeriod===3)||(g.format==='halves'&&fromPeriod===1&&toPeriod===2);
   if(secondHalfBoundary){
     const secondHalfKicker=other(g.openingKick||'team'),secondHalfReceiver=g.openingKick||'team';
     const kickerName=teamSide(g,t,secondHalfKicker).name,receiverName=teamSide(g,t,secondHalfReceiver).name;
     if(!confirm(`Advance to ${g.format==='halves'?'2nd half':'Q3'} and begin the second-half kickoff?\n\n${kickerName} kicks to ${receiverName}.`))return;
     g.period=toPeriod;beginHalftimeKickoff(g);save();toast(`${g.format==='halves'?'2nd half':'Q3'} · ${kickerName} kicks to ${receiverName}`);renderGame(g.id);return
   }
   const label=g.format==='halves'?`Half ${toPeriod}`:`Q${toPeriod}`;
   if(!confirm(`Advance to ${label}?`))return;
   g.period=toPeriod;save();toast(`Advanced to ${label}`);renderGame(g.id)
 };
 $$('.play-row').forEach(r=>r.onclick=()=>{selectedPlayId=r.dataset.play;$$('.play-row').forEach(x=>x.style.outline=x.dataset.play===selectedPlayId?'2px solid #00D4FF':'none')});
 if(!g.kickoffPending){bindOffense(g);bindDefense(g);bindPenalty(g);bindSpecial(g)}
 bindKickoff(g,t);
}

function bindOffense(g){
 $$('#playTypes button').forEach(b=>b.onclick=()=>{
   $$('#playTypes button').forEach(x=>x.classList.remove('active'));
   b.classList.add('active');
   currentPlay.type=b.dataset.type;
   $('#offDynamic').innerHTML=currentPlay.type==='Pass'?passFields(g):runFields(g);
   bindOffDynamic(g)
 });
 bindOffDynamic(g);
 if($('#offScore')){
   $$('#offScore [data-score]').forEach(b=>b.onclick=()=>{
     $$('#offScore [data-score]').forEach(x=>x.classList.remove('active'));
     b.classList.add('active');
     const score=b.dataset.score||null;
     if(score==='2PT'){
       g.awaitingTry=true;
       g.tryType='2PT';
       g.los=screenSpot(95,g.driveDir||1);
       g.down=1;
       g.toGo=5;
       save();
       renderGame(g.id);
       return;
     }
     currentPlay.score=score
   });
 }
 if($('#tryResult')){
   $$('#tryResult [data-try]').forEach(b=>b.onclick=()=>{
     $$('#tryResult [data-try]').forEach(x=>x.classList.remove('active'));
     b.classList.add('active');
     currentPlay.tryResult=b.dataset.try
   });
 }
 if($('#fumbleBtn'))$('#fumbleBtn').onclick=()=>{
   currentPlay.fumble=!currentPlay.fumble;
   $('#fumbleBtn').classList.toggle('active',currentPlay.fumble);
   if(!currentPlay.fumble){
     currentPlay.fumbleRecovery=null;
     syncTurnoverState();
     return;
   }
   chooseRecovery('Fumble Recovery',who=>{
     currentPlay.fumbleRecovery=who;
     syncTurnoverState();
     if($('#fumbleBtn'))$('#fumbleBtn').textContent=`Fumble · ${who}`;
   })
 };
 $$('[data-memory-role]').forEach(b=>b.onclick=()=>{
   const role=b.dataset.memoryRole,n=b.dataset.memoryPlayer;
   if(role==='rb'){
     const run=$('#playTypes [data-type="Run"]');
     if(run&&!run.classList.contains('active'))run.click();
     if($('#player')){$('#player').value=n;currentPlay.player=n}
   }else if(role==='qb'){
     const pass=$('#playTypes [data-type="Pass"]');
     if(pass&&!pass.classList.contains('active'))pass.click();
     if($('#qb')){$('#qb').value=n;currentPlay.qb=n}
   }else if(role==='wr'){
     const pass=$('#playTypes [data-type="Pass"]');
     if(pass&&!pass.classList.contains('active'))pass.click();
     if($('#receiver')){$('#receiver').value=n;currentPlay.receiver=n}
   }
 });
}
function bindOffDynamic(g){
 if($('#player')){
   currentPlay.player=$('#player').value.trim();
   $('#player').oninput=e=>currentPlay.player=e.target.value.trim()
 }
 if($('#qb')){
   currentPlay.qb=$('#qb').value.trim();
   $('#qb').oninput=e=>currentPlay.qb=e.target.value.trim()
 }
 if($('#receiver')){
   currentPlay.receiver=$('#receiver').value.trim();
   $('#receiver').oninput=e=>currentPlay.receiver=e.target.value.trim()
 }

 if($('#badSnapBtn'))$('#badSnapBtn').onclick=()=>{
   currentPlay.badSnap??={active:false,center:'',notCaught:false,recoveredBy:null};
   currentPlay.badSnap.active=!currentPlay.badSnap.active;
   if(!currentPlay.badSnap.active){currentPlay.badSnap.notCaught=false;currentPlay.badSnap.recoveredBy=null}
   syncTurnoverState();$('#offDynamic').innerHTML=currentPlay.type==='Pass'?passFields(g):runFields(g);bindOffDynamic(g)
 };
 if($('#centerNum'))$('#centerNum').oninput=e=>currentPlay.badSnap.center=e.target.value.trim();
 $$('#snapCaught [data-caught]').forEach(b=>b.onclick=()=>{
   currentPlay.badSnap.notCaught=b.dataset.caught==='false';
   if(!currentPlay.badSnap.notCaught)currentPlay.badSnap.recoveredBy=null;
   syncTurnoverState();$('#offDynamic').innerHTML=currentPlay.type==='Pass'?passFields(g):runFields(g);bindOffDynamic(g)
 });
 $$('#snapRecovery [data-recovery]').forEach(b=>b.onclick=()=>{
   currentPlay.badSnap.recoveredBy=b.dataset.recovery;syncTurnoverState();
   $$('#snapRecovery [data-recovery]').forEach(x=>x.classList.toggle('active',x===b))
 });

 $$('#passResult button').forEach(b=>b.onclick=()=>{
   currentPlay.qb=$('#qb')?.value.trim()||currentPlay.qb;
   currentPlay.receiver=$('#receiver')?.value.trim()||currentPlay.receiver;
   currentPlay.passResult=b.textContent;
   if(currentPlay.passResult==='Interception'&&!currentPlay.interception)currentPlay.interception={phase:'catch',interceptor:'',catchSpot:currentPlay.end??g.los,returnEnd:null,returnTD:false,tacklers:[]};
   if(currentPlay.passResult!=='Interception')currentPlay.interception=null;
   syncTurnoverState();
   $('#offDynamic').innerHTML=passFields(g);bindOffDynamic(g)
 });

 if($('#interceptorNum'))$('#interceptorNum').oninput=e=>currentPlay.interception.interceptor=e.target.value.trim();
 if($('#lockInterception'))$('#lockInterception').onclick=()=>{
   const i=currentPlay.interception;i.interceptor=$('#interceptorNum')?.value.trim()||i.interceptor;
   if(!i.interceptor)return toast('Enter the interceptor number.');
   i.catchSpot=currentPlay.end??g.los;i.returnEnd=i.catchSpot;i.phase='return';currentPlay.end=i.returnEnd;
   $('#offDynamic').innerHTML=passFields(g);bindOffDynamic(g);drawField(g,teamById(g.teamId))
 };
 if($('#addIntTackler'))$('#addIntTackler').onclick=()=>{
   const n=$('#intTackler').value.trim();if(!n)return;
   currentPlay.interception.tacklers.push(n);$('#intTackler').value='';
   $('#offDynamic').innerHTML=passFields(g);bindOffDynamic(g)
 };
 if($('#intReturnTD'))$('#intReturnTD').onchange=e=>currentPlay.interception.returnTD=e.target.checked;

 $$('#sackCredit [data-credit]').forEach(b=>b.onclick=()=>{$$('#sackCredit [data-credit]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
 if($('#addSackCredit'))$('#addSackCredit').onclick=()=>{
   const n=$('#sackDefender').value.trim();if(!n)return toast('Enter defender number.');
   const credit=Number($('#sackCredit .active')?.dataset.credit||1);
   currentPlay.defenders.push({n,action:'Sack',credit});$('#sackDefender').value='';
   renderDefenders();$('#offDynamic').innerHTML=passFields(g);bindOffDynamic(g)
 }
}

function bindDefense(g){
 $$('#defCredit [data-credit]').forEach(b=>b.onclick=()=>{$$('#defCredit [data-credit]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
 $$('[data-def]').forEach(b=>b.onclick=()=>{
   const n=$('#defNum').value.trim();if(!n)return toast('Enter defender number.');
   const action=b.dataset.def,credit=(action==='Tackle'||action==='Sack')?Number($('#defCredit .active')?.dataset.credit||1):1;
   currentPlay.defenders.push({n,action,credit});$('#defNum').value='';renderDefenders()
 });
 $$('[data-dscore]').forEach(b=>b.onclick=()=>{currentPlay.score=b.dataset.dscore;toast(`${b.textContent} selected`)});
 $$('[data-memory-role="def"]').forEach(b=>b.onclick=()=>{if($('#defNum')){$('#defNum').value=b.dataset.memoryPlayer;$('#defNum').focus()}})
}

function renderDefenders(){
 if(!$('#defList'))return;
 $('#defList').innerHTML=currentPlay.defenders.length
   ?currentPlay.defenders.map((d,i)=>`#${esc(d.n)} ${d.action}${(d.action==='Tackle'||d.action==='Sack')?' '+Number(d.credit??(d.action==='Assist'?0.5:1)).toFixed(1):''}${i<currentPlay.defenders.length-1?' · ':''}`).join('')
   :'No defensive actions yet.'
}

function bindPenalty(g){
 const activate=root=>{$$(root+' button').forEach(b=>b.onclick=()=>{$$(root+' button').forEach(x=>x.classList.remove('active'));b.classList.add('active')})};
 activate('#penSideToggle');activate('#penApplyToggle');activate('#penStatusToggle');

 const defaults={
   'Holding':{yards:10,side:'Offense',negate:true,repeat:false,auto:false},
   'False Start':{yards:5,side:'Offense',negate:true,repeat:true,auto:false},
   'Delay of Game':{yards:5,side:'Offense',negate:true,repeat:true,auto:false},
   'Offside':{yards:5,side:'Defense',negate:true,repeat:true,auto:false},
   'Illegal Formation':{yards:5,side:'Offense',negate:true,repeat:false,auto:false},
   'Illegal Motion':{yards:5,side:'Offense',negate:true,repeat:false,auto:false}
 };
 const setSide=side=>{$$('#penSideToggle button').forEach(b=>b.classList.toggle('active',b.dataset.penSide===side))};
 const applyDefaults=()=>{
   const d=defaults[$('#penType')?.value];if(!d)return;
   $('#penYards').value=d.yards;setSide(d.side);$('#negate').checked=d.negate;$('#repeatDown').checked=d.repeat;$('#autoFirst').checked=d.auto;$('#spotFoul').checked=false;toggleFoulSpot();
 };
 const toggleFoulSpot=()=>$('#foulSpotFields')?.classList.toggle('hidden',!$('#spotFoul')?.checked);
 $('#spotFoul').onchange=toggleFoulSpot;
 if($('#penType')){$('#penType').onchange=applyDefaults;applyDefaults()}
 toggleFoulSpot();

 const getFoulSpot=()=>{
   if(!$('#spotFoul').checked)return null;
   const side=$('#foulSpotSide').value;
   const yard=Math.max(0,Math.min(49,+$('#foulSpotYard').value||0));
   if(side==='50')return screenSpot(50,g.driveDir||1);
   const relative=side==='OWN'?yard:100-yard;
   return screenSpot(relative,g.driveDir||1);
 };
 const render=()=>{
   if(!$('#penSummary'))return;
   $('#penSummary').innerHTML=currentPlay.penalties.length
     ?currentPlay.penalties.map((p,i)=>`<div>${i+1}. ${p.side} ${p.type}${p.player?` #${esc(p.player)}`:''} ${p.yards} yd · ${p.status.toUpperCase()}${p.spotFoul&&p.foulSpot!=null?` · FOUL @ ${fmtDrive(p.foulSpot,g.driveDir||1)}`:''}${p.negate?' · PREVIOUS LOS':''}${p.repeatDown?' · REPEAT DOWN':''}</div>`).join('')
     :'No penalties applied.';
 };
 $('#attachPenalty').onclick=()=>{
   const spotChecked=$('#spotFoul').checked;
   if(spotChecked&&$('#foulSpotSide').value!=='50'&&$('#foulSpotYard').value==='')return toast('Enter the spot of the foul.');
   const p={
     side:$('#penSideToggle .active')?.dataset.penSide||'Offense',
     applyTo:$('#penApplyToggle .active')?.dataset.apply||'current',
     status:$('#penStatusToggle .active')?.dataset.status||'accepted',
     type:$('#penType').value,
     yards:+$('#penYards').value||0,
     player:$('#penPlayer').value.trim(),
     spotFoul:spotChecked,
     foulSpot:getFoulSpot(),
     negate:$('#negate').checked,
     repeatDown:$('#repeatDown').checked,
     autoFirst:$('#autoFirst').checked
   };
   if(p.applyTo==='former'){
     const former=g.plays[g.plays.length-1];if(!former)return toast('There is no former play to apply the penalty to.');
     former.penalties??=[];former.penalties.push(structuredClone(p));
     former.desc+=` · PEN ${p.side} ${p.type}${p.player?` #${p.player}`:''} ${p.yards}yd ${p.status.toUpperCase()}`;
     if(p.status==='accepted')enforceFormerPenalty(g,former,p);save();toast('Penalty applied to former play');renderGame(g.id);return;
   }
   currentPlay.penalties.push(p);render();toast('Penalty attached to current play');
 };
 $('#clearPenalty').onclick=()=>{currentPlay.penalties=[];render()}
}
function enforceFormerPenalty(g,former,p){
 if(p.status!=='accepted')return;
 const dir=former.before?.driveDir??g.driveDir??1;
 const before=former.before||snapshot(g);
 const originalTarget=clamp((before.los??g.los)+dir*(before.toGo??g.toGo));
 const previousLos=before.los??g.los;
 const currentSpot=g.los;

 // No-play / negated-yardage penalties enforce from the previous line of scrimmage.
 // Spot-foul penalties use the recorded end/ball spot. Otherwise use the current post-play spot.
 let base=p.spotFoul&&p.foulSpot!=null?p.foulSpot:(p.negate?previousLos:currentSpot);
 const shift=(p.side==='Offense'?-p.yards:p.yards)*dir;
 const enforced=clamp(base+shift);

 if(p.repeatDown){
   const keepPlays=g.plays,keepScores={team:g.teamScore,opp:g.oppScore};
   Object.assign(g,structuredClone(before));
   g.plays=keepPlays;g.teamScore=keepScores.team;g.oppScore=keepScores.opp;
   g.los=enforced;
   g.toGo=Math.max(1,Math.abs(originalTarget-g.los));
   return;
 }

 g.los=enforced;
 if(p.autoFirst){
   g.down=1;
   g.toGo=Math.min(10,Math.max(1,dir===1?100-g.los:g.los));
   return;
 }
 g.toGo=Math.max(1,Math.abs(originalTarget-g.los));
}
function bindSpecial(g){
 if(g.puntPending){bindPunt(g);return}
 currentPlay.special='Kickoff';
 $$('#stTypes [data-st]').forEach(b=>b.onclick=()=>{$$('#stTypes [data-st]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentPlay.special=b.dataset.st;$('#stDynamic').innerHTML=b.dataset.st==='Kickoff'?manualKickoffFields():b.dataset.st==='Punt'?puntFields():kickFields(b.dataset.st);bindSpecialDynamic(g)});
 bindSpecialDynamic(g)
}
function bindSpecialDynamic(g){
 if($('#startKickoff'))$('#startKickoff').onclick=()=>{const from=Math.max(20,Math.min(50,+$('#stFrom').value||40));g.kickoffPending=true;g.kickoff={phase:'kick',kickingTeam:g.poss,receivingTeam:other(g.poss),startYard:from,kickDir:g.driveDir||1,startSpot:screenSpot(from,g.driveDir||1),landing:null,returnEnd:null,kicker:$('#stKicker').value.trim(),returner:'',tacklers:[],touchback:false};save();renderGame(g.id)};
 if($('#stKicker'))$('#stKicker').oninput=e=>currentPlay.kicker=e.target.value.trim();
 if($('#stReturner'))$('#stReturner').oninput=e=>currentPlay.returner=e.target.value.trim();
 if($('#startPunt'))$('#startPunt').onclick=()=>{g.puntPending=true;g.punt={phase:'kick',puntingTeam:g.poss,receivingTeam:other(g.poss),startSpot:g.los,kickDir:g.driveDir||1,landing:null,returnEnd:null,punter:'',returner:'',tacklers:[],touchback:false,returnTD:false};save();renderGame(g.id)};
 $$('#kickGood [data-good]').forEach(b=>b.onclick=()=>{$$('#kickGood [data-good]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentPlay.kickGood=b.dataset.good==='true'})
}
function bindPunt(g){
 if(!g.puntPending||!g.punt)return;const p=g.punt;
 if($('#puntPunter'))$('#puntPunter').oninput=e=>{p.punter=e.target.value.trim();save()};
 if($('#puntTouchbackKick'))$('#puntTouchbackKick').onclick=()=>{p.landing=touchdownSpot(p.kickDir||1);p.phase='return';p.touchback=true;p.returnTD=false;const retDir=-(p.kickDir||1);p.returnEnd=screenSpot(20,retDir);g.poss=p.receivingTeam;g.driveDir=retDir;save();renderGame(g.id)};
 if($('#lockPunt'))$('#lockPunt').onclick=()=>{p.phase='return';p.returnEnd=p.landing;g.poss=p.receivingTeam;g.driveDir=-(p.kickDir||1);save();renderGame(g.id)};
 if($('#puntReturner'))$('#puntReturner').oninput=e=>{p.returner=e.target.value.trim();save()};
 if($('#addPuntTackler'))$('#addPuntTackler').onclick=()=>{const n=$('#puntTackler').value.trim();if(!n)return;p.tacklers.push(n);save();renderGame(g.id)};
 if($('#puntTouchbackReturn'))$('#puntTouchbackReturn').onclick=()=>{p.touchback=true;p.returnTD=false;const retDir=-(p.kickDir||1);p.returnEnd=screenSpot(20,retDir);save();renderGame(g.id)};
 if($('#puntReturnTD'))$('#puntReturnTD').onclick=()=>{p.returnTD=!p.returnTD;if(p.returnTD)p.touchback=false;save();renderGame(g.id)};
 if($('#finishPunt'))$('#finishPunt').onclick=()=>finishPunt(g)
}
function bindKickoff(g,t){
 if(!g.kickoffPending)return;const k=g.kickoff;
 if($('#koKicker'))$('#koKicker').oninput=e=>{k.kicker=e.target.value.trim();save()};
 if($('#touchbackKick'))$('#touchbackKick').onclick=()=>{k.landing=touchdownSpot(k.kickDir||1);k.phase='return';k.touchback=true;const retDir=-(k.kickDir||1);k.returnEnd=screenSpot(20,retDir);save();renderGame(g.id)};
 if($('#lockKick'))$('#lockKick').onclick=()=>{k.phase='return';k.returnEnd=k.landing;save();renderGame(g.id)};
 if($('#koReturner'))$('#koReturner').oninput=e=>{k.returner=e.target.value.trim();save()};
 if($('#addKoTackler'))$('#addKoTackler').onclick=()=>{const n=$('#koTackler').value.trim();if(!n)return;k.tacklers.push(n);save();renderGame(g.id)};
 if($('#touchbackReturn'))$('#touchbackReturn').onclick=()=>{k.touchback=true;k.returnTD=false;const retDir=-(k.kickDir||1);k.returnEnd=screenSpot(20,retDir);save();renderGame(g.id)};
 if($('#kickReturnTD'))$('#kickReturnTD').onclick=()=>{k.returnTD=!k.returnTD;if(k.returnTD)k.touchback=false;save();renderGame(g.id)};
 if($('#finishKickoff'))$('#finishKickoff').onclick=()=>finishKickoff(g)
}
function finishPunt(g){
 const p=g.punt;if(!p||p.returnEnd==null)return;
 const before=snapshot(g),end=clamp(p.returnEnd),kickDir=p.kickDir||1,returnDir=-kickDir,puntDistance=Math.abs((p.landing??p.startSpot)-p.startSpot),returnYards=p.touchback?0:Math.abs(end-(p.landing??end)),returnTD=!!p.returnTD&&!p.touchback;
 const desc=p.touchback?`Punt #${p.punter||'—'} ${puntDistance} yd · TOUCHBACK`:`Punt #${p.punter||'—'} ${puntDistance} yd; return #${p.returner||'—'} ${returnYards} yd to ${fmtDrive(end,returnDir)}${returnTD?' · RETURN TD':''}${p.tacklers.length&&!returnTD?`; tackle ${p.tacklers.map(x=>'#'+x).join(', ')}`:''}`;
 g.plays.push({id:uid(),kind:'Punt',team:p.puntingTeam,period:before.period,start:p.startSpot,end,yds:puntDistance,desc,before,returnTD,returner:p.returner});
 g.poss=p.receivingTeam;g.driveDir=returnDir;
 if(returnTD){score(g,p.receivingTeam,6);g.los=touchdownSpot(returnDir);g.down=1;g.toGo=10;g.awaitingTry=true;g.tryType=null}
 else{g.los=end;g.down=1;g.toGo=Math.min(10,Math.max(1,returnDir===1?100-end:end));g.awaitingTry=false;g.tryType=null}
 g.puntPending=false;g.punt=null;save();renderGame(g.id)
}
function finishKickoff(g){
 const k=g.kickoff;if(k.returnEnd==null)return;const before=snapshot(g),end=clamp(k.returnEnd),kickDir=k.kickDir||1,returnDir=-kickDir,kickDistance=Math.abs(k.landing-(k.startSpot??k.startYard)),returnYards=k.touchback?0:Math.abs(end-k.landing),returnTD=!!k.returnTD&&!k.touchback;
 const koLabel=k.halftime?'2H Kickoff':'Kickoff';
 const desc=k.touchback?`${koLabel} #${k.kicker||'—'} ${kickDistance} yd · TOUCHBACK`:`${koLabel} #${k.kicker||'—'} ${kickDistance} yd; return #${k.returner||'—'} ${returnYards} yd to ${fmtDrive(end,returnDir)}${returnTD?' · RETURN TD':''}${k.tacklers.length&&!returnTD?`; tackle ${k.tacklers.map(x=>'#'+x).join(', ')}`:''}`;
 g.plays.push({id:uid(),kind:'Kickoff',team:k.kickingTeam,period:before.period,start:k.startSpot??k.startYard,end,yds:kickDistance,desc,before,returnTD,returner:k.returner});
 g.poss=k.receivingTeam;g.driveDir=returnDir;
 if(returnTD){score(g,k.receivingTeam,6);g.los=touchdownSpot(returnDir);g.down=1;g.toGo=10;g.awaitingTry=true;g.tryType=null}
 else{g.los=end;g.down=1;g.toGo=Math.min(10,Math.max(1,returnDir===1?100-end:end));g.awaitingTry=false;g.tryType=null}
 g.kickoffPending=false;g.kickoff=null;save();renderGame(g.id)
}
function score(g,side,pts){if(side==='team')g.teamScore+=pts;else g.oppScore+=pts}
function beginKickoffAfterScore(g,scoringSide){const dir=g.driveDir||1,from=g.kickoffYard||40;g.tryType=null;g.kickoffPending=true;g.kickoff={phase:'kick',kickingTeam:scoringSide,receivingTeam:other(scoringSide),startYard:from,kickDir:dir,startSpot:screenSpot(from,dir),landing:null,returnEnd:null,kicker:'',returner:'',tacklers:[],touchback:false};g.awaitingTry=false}
function savePlay(g,t){
 if(g.kickoffPending)return toast('Finish the kickoff workflow first.');
 if(g.puntPending)return toast('Finish the punt workflow first.');
 currentPlay.note=$('#playNote').value.trim();
 if(currentPlay.badSnap?.active){
   currentPlay.badSnap.center=$('#centerNum')?.value.trim()||currentPlay.badSnap.center||'';
   if(currentPlay.badSnap.notCaught&&!currentPlay.badSnap.recoveredBy)return toast('Choose who recovered the bad snap: Offense or Defense.');
 }
 syncTurnoverState();
 const before=snapshot(g),start=g.los;
 let end=currentPlay.end==null?start:clamp(currentPlay.end),yds=(end-start)*(g.driveDir||1),desc='';
 const selectedSt=$('#stTypes .active')?.dataset.st;

 if(selectedSt==='Field Goal'||selectedSt==='PAT'){
   const kicker=$('#stKicker')?.value.trim()||'',dist=+$('#stDistance')?.value||0;
   if(currentPlay.kickGood==null)return toast('Choose Good or No Good.');
   const pts=selectedSt==='PAT'?1:3;
   if(currentPlay.kickGood)score(g,g.poss,pts);
   desc=`${selectedSt} #${kicker||'—'} ${selectedSt==='Field Goal'?dist+' yd ':''}${currentPlay.kickGood?'GOOD':'NO GOOD'}`;
   if(selectedSt==='PAT'||selectedSt==='Field Goal')beginKickoffAfterScore(g,g.poss);
   g.plays.push({id:uid(),kind:selectedSt,team:before.poss,period:before.period,start,end:start,yds:0,desc,before});
   save();renderGame(g.id);return
 }

 if(selectedSt==='Punt')return toast('Use the Punt workflow: kick, lock landing, then return.');

 if(currentPlay.type==='Run'){
   currentPlay.player=$('#player')?.value.trim()||currentPlay.player;
   desc=`Run #${currentPlay.player||'—'} ${yds>=0?'+':''}${yds} yd`
 }else{
   currentPlay.qb=$('#qb')?.value.trim()||currentPlay.qb;
   currentPlay.receiver=$('#receiver')?.value.trim()||currentPlay.receiver;
   currentPlay.passResult=$('#passResult .active')?.textContent||currentPlay.passResult;
   if(currentPlay.passResult==='Incomplete'){end=start;yds=0;desc=`Pass #${currentPlay.qb||'—'} → #${currentPlay.receiver||'—'} incomplete`}
   else if(currentPlay.passResult==='Interception'){
     const i=currentPlay.interception;
     if(!i||i.phase!=='return')return toast('Lock the interception spot before recording the return.');
     if(!i.interceptor)return toast('Enter the interceptor number.');
     const returnDir=-(g.driveDir||1);
     i.returnEnd=currentPlay.end??i.returnEnd??i.catchSpot;
     if(i.returnTD)i.returnEnd=touchdownSpot(returnDir);
     end=i.returnEnd;yds=0;
     const returnYds=Math.abs((i.returnEnd??i.catchSpot)-i.catchSpot);
     desc=`Pass #${currentPlay.qb||'—'} INTERCEPTED by #${i.interceptor} · return ${returnYds} yd to ${fmtDrive(i.returnEnd,returnDir)}${i.returnTD?' · RETURN TD':''}`;
     if((i.tacklers||[]).length&&!i.returnTD)desc+=` · return tackle ${i.tacklers.map(x=>'#'+x).join(', ')}`;
     currentPlay.turnover=true
   }
   else if(currentPlay.passResult==='Sack'){
     if(!currentPlay.defenders.some(d=>d.action==='Sack'))return toast('Add the defender credited with the sack.');
     desc=`Sack of QB #${currentPlay.qb||'—'} ${yds} yd`;
   }
   else desc=`Pass #${currentPlay.qb||'—'} → #${currentPlay.receiver||'—'} ${yds>=0?'+':''}${yds} yd`
 }

 // Dedicated 2-point try workflow.
 if(g.awaitingTry&&g.tryType==='2PT'){
   if(!currentPlay.tryResult)return toast('Mark the 2-point conversion Successful or Failed.');
   const success=currentPlay.tryResult==='successful';
   if(success)score(g,g.poss,2);
   desc=`2PT ${currentPlay.type==='Run'?`Run #${currentPlay.player||'—'}`:`Pass #${currentPlay.qb||'—'} → #${currentPlay.receiver||'—'}`} · ${success?'SUCCESSFUL':'FAILED'}`;
   if(currentPlay.defenders.length)desc+=` · ${currentPlay.defenders.map(d=>`#${d.n} ${d.action}`).join(', ')}`;
   if(currentPlay.penalties.length)desc+=currentPlay.penalties.map(p=>` · PEN ${p.side} ${p.type}${p.player?' #'+p.player:''} ${p.yards}yd ${p.status.toUpperCase()}`).join('');
   if(currentPlay.note)desc+=` · ${currentPlay.note}`;
   g.plays.push({id:uid(),kind:'2PT',team:before.poss,period:before.period,start,end,yds:end-start,desc,before,player:currentPlay.player,qb:currentPlay.qb,receiver:currentPlay.receiver,passResult:currentPlay.passResult,tryResult:currentPlay.tryResult,fumble:currentPlay.fumble,fumbleRecovery:currentPlay.fumbleRecovery,badSnap:structuredClone(currentPlay.badSnap),penalties:structuredClone(currentPlay.penalties),defenders:structuredClone(currentPlay.defenders)});
   g.tryType=null;
   beginKickoffAfterScore(g,before.poss);
   save();renderGame(g.id);return
 }

 if(currentPlay.badSnap?.active){
   desc+=` · BAD SNAP C #${currentPlay.badSnap.center||'—'}`;
   if(currentPlay.badSnap.notCaught)desc+=` · CENTER FUMBLE · REC ${currentPlay.badSnap.recoveredBy?.toUpperCase()||'—'}`;
   else desc+=` · CAUGHT`;
 }
 if(currentPlay.fumble)desc+=` · FUMBLE · REC ${(currentPlay.fumbleRecovery||'—').toUpperCase()}`;
 if(currentPlay.score==='TD'){score(g,g.poss,6);desc+=' · TOUCHDOWN';end=touchdownSpot(g.driveDir);g.awaitingTry=true;g.tryType=null}
 else if(currentPlay.score==='Safety'){score(g,other(g.poss),2);desc+=' · SAFETY'}
 else if(currentPlay.score==='Def TD'){score(g,other(g.poss),6);desc+=' · DEFENSIVE TD';g.poss=other(g.poss);g.awaitingTry=true;g.tryType=null}
 else if((g.driveDir||1)===1?end>=100:end<=0){score(g,g.poss,6);desc+=' · TOUCHDOWN';end=touchdownSpot(g.driveDir);g.awaitingTry=true;g.tryType=null}

 if(currentPlay.defenders.length)desc+=` · ${currentPlay.defenders.map(d=>`#${d.n} ${d.action}`).join(', ')}`;
 if(currentPlay.penalties.length)desc+=currentPlay.penalties.map(p=>` · PEN ${p.side} ${p.type}${p.player?' #'+p.player:''} ${p.yards}yd ${p.status.toUpperCase()}`).join('');
 if(currentPlay.note)desc+=` · ${currentPlay.note}`;

 g.plays.push({id:uid(),kind:currentPlay.type,team:before.poss,period:before.period,start,end,yds:currentPlay.passResult==='Interception'?0:end-start,desc,before,player:currentPlay.player,qb:currentPlay.qb,receiver:currentPlay.receiver,passResult:currentPlay.passResult,interception:currentPlay.interception?structuredClone(currentPlay.interception):null,fumble:currentPlay.fumble,fumbleRecovery:currentPlay.fumbleRecovery,badSnap:structuredClone(currentPlay.badSnap),penalties:structuredClone(currentPlay.penalties),defenders:structuredClone(currentPlay.defenders)});
 if(currentPlay.passResult==='Interception'&&currentPlay.interception?.returnTD)score(g,other(before.poss),6);
 if(!g.awaitingTry&&!g.kickoffPending)applyAfterPlay(g,currentPlay,start,end);
 if(currentPlay.passResult==='Interception'&&currentPlay.interception?.returnTD){g.awaitingTry=true;g.tryType=null}
 save();renderGame(g.id)
}
function applyAfterPlay(g,p,start,end){
 const dir=g.driveDir||1;
 const accepted=(p.penalties||[]).filter(x=>x.status==='accepted');
 const hasAccepted=accepted.length>0;
 const originalTarget=clamp(start+dir*g.toGo);

 // A turnover only takes effect if the play itself stands.
 const negatePlay=accepted.some(x=>x.negate||x.repeatDown);
 if(p.turnover&&!negatePlay){g.poss=other(g.poss);g.driveDir=-dir;g.los=end;g.down=1;g.toGo=Math.min(10,Math.max(1,g.driveDir===1?100-end:end));return}

 // Incomplete pass with no accepted penalty behaves normally.
 if(p.type==='Pass'&&p.passResult==='Incomplete'&&!hasAccepted){g.down++;if(g.down>4)turnoverDowns(g,start);return}

 // Determine enforcement base. If play yardage is ignored/no-play, start at previous LOS.
 // If spot-of-foul is selected, the dragged ball/end spot is the enforcement spot.
 let base=end;
 const spotPenalty=accepted.find(x=>x.spotFoul&&x.foulSpot!=null);
 if(spotPenalty)base=spotPenalty.foulSpot;
 else if(accepted.some(x=>x.negate||x.repeatDown))base=start;

 const net=accepted.reduce((sum,x)=>sum+(x.side==='Offense'?-x.yards:x.yards),0);
 const actual=clamp(base+net*dir);
 const repeat=accepted.some(x=>x.repeatDown);
 const auto=accepted.some(x=>x.autoFirst);

 if(repeat){
   g.los=actual;
   g.toGo=Math.max(1,Math.abs(originalTarget-g.los));
   return;
 }
 if(auto){
   g.los=actual;g.down=1;g.toGo=Math.min(10,Math.max(1,dir===1?100-actual:actual));return;
 }

 // Down counts on accepted live-ball penalties unless Repeat Down / No Play is checked.
 // Keep the original first-down target fixed and recalculate distance from the enforced spot.
 g.los=actual;
 const reachedTarget=dir===1?actual>=originalTarget:actual<=originalTarget;
 if(reachedTarget){
   g.down=1;
   g.toGo=Math.min(10,Math.max(1,dir===1?100-actual:actual));
 }else{
   g.toGo=Math.max(1,Math.abs(originalTarget-actual));
   g.down++;
   if(g.down>4)turnoverDowns(g,actual);
 }
}
function turnoverDowns(g,spot){g.poss=other(g.poss);g.driveDir=-(g.driveDir||1);g.los=clamp(spot);g.down=1;g.toGo=Math.min(10,Math.max(1,g.driveDir===1?100-g.los:g.los))}
function undoPlay(g){const p=g.plays.pop();if(!p)return toast('No play to undo.');Object.assign(g,structuredClone(p.before));save();renderGame(g.id)}
function editSelected(g){const p=g.plays.find(x=>x.id===selectedPlayId);if(!p)return toast('Select a play first.');const t=teamById(g.teamId);showPlayEditor(g,t,p.id)}
function drawField(g,t){
 const f=$('#field');if(!f)return;const driveDir=g.driveDir||1,k=g.kickoff,p=g.punt,intRet=currentPlay?.type==='Pass'&&currentPlay?.passResult==='Interception'?currentPlay.interception:null;
 const perspective=g.kickoffPending?(k.phase==='kick'?(k.kickDir||1)===1?k.kickingTeam:other(k.kickingTeam):(-(k.kickDir||1))===1?k.receivingTeam:other(k.receivingTeam)):g.puntPending?(p.phase==='kick'?(p.kickDir||1)===1?p.puntingTeam:other(p.puntingTeam):(-(p.kickDir||1))===1?p.receivingTeam:other(p.receivingTeam)):intRet?.phase==='return'?((-(driveDir||1))===1?other(g.poss):g.poss):(driveDir===1?g.poss:other(g.poss)),left=teamSide(g,t,perspective),right=teamSide(g,t,other(perspective));
 let ballAbs=g.kickoffPending?(k.phase==='kick'?(k.landing??k.startSpot??k.startYard):(k.returnEnd??k.landing)):g.puntPending?(p.phase==='kick'?(p.landing??p.startSpot):(p.returnEnd??p.landing)):intRet?(intRet.phase==='return'?(intRet.returnEnd??intRet.catchSpot):(intRet.catchSpot??currentPlay.end)):currentPlay.end;
 f.innerHTML=`<div class="endzone left" style="background:${left.color};color:${textColor(left.color)}">${esc(left.name.slice(0,12))}</div><div class="endzone right" style="background:${right.color};color:${textColor(right.color)}">${esc(right.name.slice(0,12))}</div><div class="field-inner" id="fieldInner"></div>`;
 const inner=$('#fieldInner');
 for(let y=0;y<=100;y+=5){const d=document.createElement('div');d.className='yard-line'+(y%10===0?' major':'');d.style.left=y+'%';inner.appendChild(d)}
 for(let y=10;y<100;y+=10){const n=y<=50?y:100-y;['top','bottom'].forEach(pos=>{const d=document.createElement('div');d.className='yard-number '+pos;d.style.left=y+'%';d.textContent=n;inner.appendChild(d)})}
 for(let y=1;y<100;y++){const d=document.createElement('div');d.className='hash';d.style.left=y+'%';inner.appendChild(d)}
 if(!g.kickoffPending&&!g.puntPending){const los=document.createElement('div');los.className='los-line';los.style.left=g.los+'%';inner.appendChild(los);const fd=document.createElement('div');fd.className='fd-line';fd.style.left=clamp(g.los+(g.driveDir||1)*g.toGo)+'%';inner.appendChild(fd)}
 else if(g.kickoffPending&&g.kickoff.phase==='kick'){const kl=document.createElement('div');kl.className='kick-line';kl.style.left=(g.kickoff.startSpot??screenSpot(g.kickoff.startYard,g.kickoff.kickDir||1))+'%';inner.appendChild(kl)}
 else if(g.puntPending&&g.punt.phase==='kick'){const pl=document.createElement('div');pl.className='kick-line';pl.style.left=g.punt.startSpot+'%';inner.appendChild(pl)}
 const ball=document.createElement('div');ball.className='football';ball.style.left=ballAbs+'%';inner.appendChild(ball);
 const setBall=x=>{const r=inner.getBoundingClientRect();const pct=clamp((x-r.left)/r.width*100);ball.style.left=pct+'%';if($('#ballText'))$('#ballText').textContent=fmtDrive(pct,g.driveDir||1);if(g.kickoffPending){if(g.kickoff.phase==='kick')g.kickoff.landing=pct;else g.kickoff.returnEnd=pct;save()}else if(g.puntPending){if(g.punt.phase==='kick')g.punt.landing=pct;else g.punt.returnEnd=pct;save()}else if(intRet){if(intRet.phase==='catch'){intRet.catchSpot=pct;currentPlay.end=pct}else{intRet.returnEnd=pct;currentPlay.end=pct}}else currentPlay.end=pct};
 let drag=false;ball.addEventListener('pointerdown',e=>{drag=true;ball.setPointerCapture(e.pointerId);e.preventDefault()});ball.addEventListener('pointermove',e=>{if(drag)setBall(e.clientX)});ball.addEventListener('pointerup',e=>{drag=false;setBall(e.clientX);if(g.kickoffPending||g.puntPending)renderGame(g.id)});inner.addEventListener('click',e=>{if(e.target===ball)return;setBall(e.clientX);if(g.kickoffPending||g.puntPending)renderGame(g.id)})
}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
route();
