
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const BUILD='v0.15.7';
const DBKEY='sidelineiq_v0157';
const LEGACY_KEYS=['sidelineiq_v0156','sidelineiq_v0155','sidelineiq_v0154','sidelineiq_v0153','sidelineiq_v0152','sidelineiq_v0151','sidelineiq_v015','sidelineiq_v014','sidelineiq_v013_corrected','sidelineiq_v013','sidelineiq_v012'];
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
 showModal(`<h2>Add Team</h2><div class="form-grid"><div class="field"><label>Team Name</label><input id="teamName" placeholder="Auburn Jr. High Trojans"></div><div class="field"><label>Primary Color</label><input id="primary" type="color" value="#5B21B6"></div><div class="field"><label>Secondary Color</label><input id="secondary" type="color" value="#F4C43D"></div><div class="field"><label>Sport</label><input value="Football" disabled></div></div><div class="modal-actions"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="saveTeam">Save Team</button></div>`);
 $('#saveTeam').onclick=()=>{const name=$('#teamName').value.trim();if(!name)return alert('Enter a team name.');state.teams.push({id:uid(),name,primary:$('#primary').value,secondary:$('#secondary').value});save();closeModal();renderTeams()}
}
function renderTeam(id){
 const t=state.teams.find(x=>x.id===id);if(!t)return location.hash='#teams';
 const games=state.games.filter(g=>g.teamId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const rows=games.map(g=>`<tr data-open-game="${g.id}"><td>${esc(g.date||'')}</td><td>${esc(g.opponent)}</td><td>${esc(g.location||'Home')}</td><td>${g.final?`${g.teamScore>=g.oppScore?'W':'L'} ${g.teamScore}-${g.oppScore}`:`${g.teamScore||0}-${g.oppScore||0}`}</td><td>›</td></tr>`).join('');
 shell(`<main class="page"><button class="btn" onclick="location.hash='#teams'">‹ Back to Teams</button><section class="content-card team-banner" style="border-left:6px solid ${t.primary}"><div class="team-banner-left"><div class="team-swatch" style="background:linear-gradient(135deg,${t.primary} 0 60%,${t.secondary} 60%)"></div><div><div class="team-title">${esc(t.name)}</div><div class="team-meta">Football · SidelineIQ</div></div></div><button class="btn" id="editTeam">Edit Team</button></section><div class="tabs"><button class="tab active">Games</button><button class="tab">Roster · Coming Soon</button><button class="tab">Analytics · Coming Soon</button><button class="btn btn-primary" id="addGame">+ Add Game</button></div><section class="content-card"><table class="games-table"><thead><tr><th>Date</th><th>Opponent</th><th>Location</th><th>Score</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty">No games yet.</td></tr>'}</tbody></table></section></main>`);
 $('#addGame').onclick=()=>showAddGame(t);$('#editTeam').onclick=()=>showEditTeam(t);$$('[data-open-game]').forEach(x=>x.onclick=()=>location.hash='#game/'+x.dataset.openGame)
}
function showEditTeam(t){
 showModal(`<h2>Edit Team</h2><div class="form-grid"><div class="field"><label>Team Name</label><input id="teamName" value="${esc(t.name)}"></div><div class="field"><label>Primary Color</label><input id="primary" type="color" value="${t.primary}"></div><div class="field"><label>Secondary Color</label><input id="secondary" type="color" value="${t.secondary}"></div></div><div class="modal-actions"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="saveTeam">Save Changes</button></div>`);
 $('#saveTeam').onclick=()=>{t.name=$('#teamName').value.trim()||t.name;t.primary=$('#primary').value;t.secondary=$('#secondary').value;save();closeModal();renderTeam(t.id)}
}
function showAddGame(t){
 showModal(`<h2>Add Game</h2><div class="form-grid"><div class="field"><label>Opponent</label><input id="opp" placeholder="Rochester"></div><div class="field"><label>Date</label><input id="gdate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Location</label><select id="loc"><option>Home</option><option>Away</option><option>Neutral</option></select></div><div class="field"><label>Opponent Color</label><input id="oppColor" type="color" value="#B8860B"></div><div class="field"><label>Game Format</label><select id="format"><option value="quarters">4 Quarters</option><option value="halves">2 Halves</option></select></div><div class="field"><label>Opening Kick</label><select id="kick"><option value="team">${esc(t.name)} kicks</option><option value="opp">Opponent kicks</option></select></div><div class="field"><label>Kickoff Yard</label><input id="kickYard" type="number" min="20" max="50" value="40"></div></div><div class="modal-actions"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="saveGame">Create Game</button></div>`);
 $('#saveGame').onclick=()=>{const opponent=$('#opp').value.trim();if(!opponent)return alert('Enter opponent.');const openingKick=$('#kick').value,kickoffYard=Math.max(20,Math.min(50,+$('#kickYard').value||40)),receiving=other(openingKick);const g={id:uid(),teamId:t.id,opponent,date:$('#gdate').value,location:$('#loc').value,oppColor:$('#oppColor').value,format:$('#format').value,openingKick,kickoffYard,teamScore:0,oppScore:0,period:1,down:1,toGo:10,los:20,poss:receiving,plays:[],awaitingTry:false,driveDir:1,kickoffPending:true,kickoff:{phase:'kick',kickingTeam:openingKick,receivingTeam:receiving,startYard:kickoffYard,kickDir:1,startSpot:kickoffYard,landing:null,returnEnd:null,kicker:'',returner:'',tacklers:[],touchback:false}};state.games.push(g);save();closeModal();location.hash='#game/'+g.id}
}

let currentPlay=null;
function normalizeGame(g){
 g.teamScore??=0;g.oppScore??=0;g.period??=1;g.down??=1;g.toGo??=10;g.los??=20;g.poss??='team';g.plays??=[];g.kickoffYard??=40;g.awaitingTry??=false;g.tryType??=null;
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
function snapshot(g){return {teamScore:g.teamScore,oppScore:g.oppScore,period:g.period,down:g.down,toGo:g.toGo,los:g.los,poss:g.poss,driveDir:g.driveDir,awaitingTry:g.awaitingTry,tryType:g.tryType||null,kickoffPending:!!g.kickoffPending,kickoff:g.kickoff?structuredClone(g.kickoff):null}}
function defaultPlay(g){return {type:'Run',end:g.los,player:'',qb:'',receiver:'',passResult:'Complete',defenders:[],penalties:[],score:null,tryResult:null,fumble:false,turnover:false,special:null,kicker:'',returner:'',kickGood:null,note:''}}


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
         qb=x?.[1];
       }
       if(!wr){const x=(p.desc||'').match(/→ #(\d+)/);wr=x?.[1]}
       addRemembered(m.qb,qb);addRemembered(m.wr,wr);
     }
   }
   if(team&&other(team)===side){
     (p.defenders||[]).slice().reverse().forEach(d=>addRemembered(m.def,d.n));
   }
 });
 return m;
}
function memoryButtons(nums,role){
 return nums.length?nums.map(n=>`<button type="button" class="memory-chip" data-memory-role="${role}" data-memory-player="${esc(n)}">#${esc(n)}</button>`).join(''):'<span class="memory-empty">—</span>';
}
function offenseMemory(g){
 const m=rememberedPlayers(g,g.poss);
 return `<div class="player-memory"><div class="memory-title">PLAYERS</div><div class="memory-columns"><div class="memory-col"><small>QB</small><div>${memoryButtons(m.qb,'qb')}</div></div><div class="memory-col"><small>RB</small><div>${memoryButtons(m.rb,'rb')}</div></div><div class="memory-col"><small>WR / TARGETS</small><div>${memoryButtons(m.wr,'wr')}</div></div></div></div>`;
}
function defenseMemory(g){
 const m=rememberedPlayers(g,other(g.poss));
 return `<div class="player-memory defense-memory"><div class="memory-title">DEFENDERS</div><div class="memory-chip-row">${memoryButtons(m.def,'def')}</div></div>`;
}

function renderGame(id){
 const g=state.games.find(x=>x.id===id);if(!g)return location.hash='#teams';normalizeGame(g);
 const t=state.teams.find(x=>x.id===g.teamId);if(!t)return location.hash='#teams';currentPlay=defaultPlay(g);
 const homeTeam=g.location==='Away'?'opp':'team';const left=teamSide(g,t,homeTeam),right=teamSide(g,t,other(homeTeam));left.score=homeTeam==='team'?g.teamScore:g.oppScore;right.score=homeTeam==='team'?g.oppScore:g.teamScore;
 const off=teamSide(g,t,g.poss),def=teamSide(g,t,other(g.poss));
 const stateLabel=g.kickoffPending?'KICKOFF':g.awaitingTry?'TRY':`${ordinal(g.down)} & ${g.toGo}`;
 shell(`<main class="game-page"><section class="game-top"><div class="game-brand"><img src="./assets/sidelineiq-header-logo.png" alt="SidelineIQ"></div><div class="score-card" style="background:${left.color};color:${textColor(left.color)}"><span class="team-label">${esc(left.name)}</span><span class="score-value">${left.score}</span></div><div class="game-state"><div class="period period-control"><span>${g.format==='halves'?'H':'Q'}${g.period}</span><button type="button" id="nextPeriod" class="period-next" ${g.period>=(g.format==='halves'?2:4)?'disabled':''} title="Advance to next ${g.format==='halves'?'half':'quarter'}">›</button></div><div class="downline">${stateLabel}</div><div class="pos">${g.kickoffPending?'Opening kickoff':fmtDrive(g.los,g.driveDir)}</div></div><div class="score-card" style="background:${right.color};color:${textColor(right.color)}"><span class="score-value">${right.score}</span><span class="team-label">${esc(right.name)}</span></div><div class="nav-strip"><button class="nav-button" onclick="location.hash='#team/${t.id}'"><span class="ico">▣</span>Games</button><button class="nav-button" id="resetGame"><span class="ico">↻</span>Reset</button><button class="nav-button danger-nav" id="deleteGame"><span class="ico">✕</span>Delete</button><button class="nav-button"><span class="ico">⚙</span>Settings</button></div></section>
 <div class="main-grid"><section class="field-panel"><div class="field" id="field"></div><div class="field-controls"><div class="mini"><small>Line of Scrimmage</small><div class="los-control"><select id="losSide"><option>OWN</option><option>OPP</option><option>50</option></select><input id="losYard" type="number" min="0" max="49"><button class="btn btn-light" id="setLos">Set</button></div></div><div class="mini"><small>Ball at</small><b id="ballText">${g.kickoffPending?'—':fmtDrive(g.los,g.driveDir)}</b></div><div class="mini"><small>Distance</small><b>${g.kickoffPending?'—':g.toGo}</b></div><div class="mini"><small>Down</small><b>${g.kickoffPending?'—':g.down}</b></div><div class="mini"><small>State</small><b>${g.kickoffPending?'KO':g.awaitingTry?'TRY':'LIVE'}</b></div></div></section>
 <aside class="recent-panel"><div class="recent-head"><span>Recent Plays</span><select><option>All Plays</option></select></div><div class="recent-list">${recentRows(g,t)}</div><div class="recent-actions"><button class="btn btn-light" id="editPlay">Edit Selected</button><button class="btn btn-light" id="undoPlay">Undo Last Play</button></div></aside></div>
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
 return `<div class="form-row"><label>Ball Carrier #</label><input id="player" inputmode="numeric" placeholder="#" value="${esc(last)}"></div>`
}
function passFields(g){
 const m=rememberedPlayers(g,g.poss),last=m.qb[0]||'';
 return `<div class="form-row"><label>QB #</label><input id="qb" inputmode="numeric" value="${esc(last)}"><label>Receiver #</label><input id="receiver" inputmode="numeric"></div><div class="seg" id="passResult"><button class="active">Complete</button><button>Incomplete</button><button>Interception</button><button>Sack</button></div>`
}
function defensePane(g){
 return `<div class="form-row"><label>Player #</label><input id="defNum" inputmode="numeric"></div><div class="section-label">Action</div><div class="action-grid"><button data-def="Tackle">Tackle</button><button data-def="Assist">Assist</button><button class="alt" data-def="Missed">Missed</button><button class="alt" data-def="Pressure">Pressure</button><button class="alt" data-def="Hurry">Hurry</button><button class="score" data-dscore="Safety">Safety +2</button><button class="score" data-dscore="Def TD">Def. TD +6</button></div><div class="summary" id="defList">No defensive actions yet.</div>${defenseMemory(g)}`
}
function penaltyPane(){return `<div class="section-label">Side</div><div class="seg pen-toggle" id="penSideToggle"><button class="active" data-pen-side="Offense">Offense</button><button data-pen-side="Defense">Defense</button></div><div class="section-label">Apply To</div><div class="seg pen-toggle" id="penApplyToggle"><button class="active" data-apply="current">Current</button><button data-apply="former">Former</button></div><div class="section-label">Status</div><div class="seg pen-toggle" id="penStatusToggle"><button class="active" data-status="accepted">Accepted</button><button data-status="declined">Declined</button></div><div class="form-row"><select id="penType"><option>Holding</option><option>False Start</option><option>Delay of Game</option><option>Offside</option><option>Pass Interference</option><option>Personal Foul</option><option>Illegal Formation</option><option>Illegal Motion</option><option>Facemask</option><option>Unsportsmanlike Conduct</option><option>Other</option></select><input id="penYards" type="number" value="10" aria-label="Penalty yards" placeholder="Yards"></div><div class="form-row"><input id="penPlayer" inputmode="numeric" placeholder="Player #" aria-label="Player number"></div><div class="pen-checks"><label><input type="checkbox" id="spotFoul"> Enforce from spot of foul</label><div id="foulSpotFields" class="foul-spot-fields hidden"><span class="field-hint">Spot of foul</span><select id="foulSpotSide" aria-label="Spot of foul side"><option>OWN</option><option>OPP</option><option>50</option></select><input id="foulSpotYard" type="number" min="0" max="49" placeholder="Yard" aria-label="Spot of foul yard line"></div><label><input type="checkbox" id="negate"> Ignore play yardage; enforce from previous LOS</label><label><input type="checkbox" id="repeatDown"> Repeat down / no play</label><label><input type="checkbox" id="autoFirst"> Automatic first down</label></div><div class="form-row"><button class="btn btn-light" id="attachPenalty">Apply Penalty</button><button class="btn btn-light" id="clearPenalty">Clear Current</button></div><div class="summary penalty-list" id="penSummary">No penalties applied.</div>`}
function specialPane(g,t){
 if(g.kickoffPending)return kickoffPane(g,t);
 return `<div class="seg" id="stTypes"><button class="active" data-st="Kickoff">Kickoff</button><button data-st="Punt">Punt</button><button data-st="Field Goal">Field Goal</button><button data-st="PAT">PAT</button></div><div id="stDynamic">${manualKickoffFields()}</div>`
}
function manualKickoffFields(){return `<div class="notice">Start a kickoff after a score. Kicking team is the current possession team.</div><div class="form-row"><label>Kicker #</label><input id="stKicker"><label>Kick from</label><input id="stFrom" type="number" value="40"></div><button class="btn btn-light" id="startKickoff">Start Kickoff Workflow</button>`}
function puntFields(){return `<div class="form-row"><label>Punter #</label><input id="stKicker"><label>Returner #</label><input id="stReturner"></div><div class="notice">Drag the football to the end of the punt return, then Save Play.</div>`}
function kickFields(type){return `<div class="form-row"><label>Kicker #</label><input id="stKicker"><label>${type==='PAT'?'Try':'Distance'}</label><input id="stDistance" type="number" value="${type==='PAT'?1:35}"></div><div class="seg" id="kickGood"><button data-good="true">Good</button><button data-good="false">No Good</button></div>`}
function kickoffPane(g,t){
 const k=g.kickoff,kick=teamSide(g,t,k.kickingTeam),rec=teamSide(g,t,k.receivingTeam);
 if(k.phase==='kick')return `<div class="kick-steps"><div class="step active">1 · KICK</div><span>›</span><div class="step">2 · RETURN</div></div><div class="notice"><b>${esc(kick.name)}</b> kicks from OWN ${k.startYard}. Enter kicker, then drag the football to the landing/catch spot.</div><div class="form-row"><label>Kicker #</label><input id="koKicker" value="${esc(k.kicker||'')}"></div><div class="summary">Landing: <b>${k.landing==null?'drag football':fmtDrive(k.landing,k.kickDir||1)}</b>${k.landing==null?'':` · ${Math.abs(k.landing-(k.startSpot??k.startYard))} yd kick`}</div><div class="form-row"><button class="btn btn-light" id="touchbackKick">Touchback</button><button class="btn btn-primary" id="lockKick" ${k.landing==null?'disabled':''}>Lock Landing →</button></div>`;
 return `<div class="kick-steps"><div class="step done">✓ KICK</div><span>›</span><div class="step active">2 · RETURN</div></div><div class="notice"><b>${esc(rec.name)}</b> return. Field perspective has flipped to the receiving team.</div><div class="form-row"><label>Returner #</label><input id="koReturner" value="${esc(k.returner||'')}"><label>Tackler #</label><input id="koTackler"><button class="btn btn-light" id="addKoTackler">Add</button></div><div class="summary">Catch: <b>${fmtDrive(k.landing,-(k.kickDir||1))}</b> · End: <b>${k.returnEnd==null?'drag football':fmtDrive(k.returnEnd,-(k.kickDir||1))}</b><br>Tacklers: ${k.tacklers.length?k.tacklers.map(x=>'#'+esc(x)).join(', '):'—'}</div><div class="form-row"><button class="btn btn-light" id="touchbackReturn">Touchback</button><button class="btn btn-primary" id="finishKickoff" ${k.returnEnd==null?'disabled':''}>Finish Kickoff</button></div>`
}
function recentRows(g,t){return [...g.plays].reverse().slice(0,25).map((p,i)=>{const n=g.plays.length-i,team=p.team||p.before?.poss||'team',tm=teamSide(g,t,team),abbr=teamAbbr(tm.name),bg1=lighten(tm.color,.84),bg2=lighten(tm.secondary||tm.color,.90);return `<div class="play-row" data-play="${p.id}" style="background:linear-gradient(90deg,${bg1},${bg2});border-left:4px solid ${tm.color};color:#132D36"><div>${n}</div><div>${p.period||p.before?.period||1}</div><div>${esc(p.time||'')}</div><div><b>${abbr}</b></div><div class="desc">${esc(p.desc||'')}</div><div class="yds">${Number.isFinite(p.yds)?(p.yds>0?'+':'')+p.yds:''}</div></div>`}).join('')||'<div class="empty">No plays yet.</div>'}

function resetGameState(g){
 const openingKick=g.openingKick||'team';
 const receiving=other(openingKick);
 const kickoffYard=g.kickoffYard||40;
 g.teamScore=0;
 g.oppScore=0;
 g.period=1;
 g.down=1;
 g.toGo=10;
 g.los=20;
 g.poss=receiving;
 g.plays=[];
 g.awaitingTry=false;
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

function bindGame(g,t){
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
 $('#setLos').onclick=()=>{if(g.kickoffPending)return toast('Finish the kickoff first.');const side=$('#losSide').value,y=+$('#losYard').value||0;const rel=side==='50'?50:side==='OWN'?y:100-y;g.los=screenSpot(rel,g.driveDir||1);g.los=clamp(g.los);currentPlay.end=g.los;save();renderGame(g.id)};
 $('#savePlay').onclick=()=>savePlay(g,t);$('#clearPlay').onclick=()=>renderGame(g.id);$('#undoPlay').onclick=()=>undoPlay(g);$('#editPlay').onclick=()=>editSelected(g);
 if($('#nextPeriod'))$('#nextPeriod').onclick=()=>{
   const max=g.format==='halves'?2:4;
   if(g.period>=max)return toast(`Already in the final ${g.format==='halves'?'half':'quarter'}.`);
   const label=g.format==='halves'?'half':'quarter';
   if(!confirm(`Advance to the next ${label}?`))return;
   g.period++;
   save();
   toast(`${g.format==='halves'?'Half':'Quarter'} ${g.period}`);
   renderGame(g.id);
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
   if(currentPlay.fumble)currentPlay.turnover=confirm('Was the fumble recovered by the defense?')
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
 if($('#receiver'))$('#receiver').oninput=e=>currentPlay.receiver=e.target.value.trim();
 $$('#passResult button').forEach(b=>b.onclick=()=>{
   $$('#passResult button').forEach(x=>x.classList.remove('active'));
   b.classList.add('active');
   currentPlay.passResult=b.textContent;
   currentPlay.turnover=b.textContent==='Interception'
 })
}
function bindDefense(g){
 $$('[data-def]').forEach(b=>b.onclick=()=>{
   const n=$('#defNum').value.trim();
   if(!n)return toast('Enter defender number.');
   currentPlay.defenders.push({n,action:b.dataset.def});
   $('#defNum').value='';
   renderDefenders()
 });
 $$('[data-dscore]').forEach(b=>b.onclick=()=>{
   currentPlay.score=b.dataset.dscore;
   toast(`${b.textContent} selected`)
 });
 $$('[data-memory-role="def"]').forEach(b=>b.onclick=()=>{
   if($('#defNum')){
     $('#defNum').value=b.dataset.memoryPlayer;
     $('#defNum').focus()
   }
 });
}
function renderDefenders(){
 if(!$('#defList'))return;
 $('#defList').innerHTML=currentPlay.defenders.length
   ?currentPlay.defenders.map((d,i)=>`#${esc(d.n)} ${d.action}${i<currentPlay.defenders.length-1?' · ':''}`).join('')
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
 currentPlay.special='Kickoff';
 $$('#stTypes [data-st]').forEach(b=>b.onclick=()=>{$$('#stTypes [data-st]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentPlay.special=b.dataset.st;$('#stDynamic').innerHTML=b.dataset.st==='Kickoff'?manualKickoffFields():b.dataset.st==='Punt'?puntFields():kickFields(b.dataset.st);bindSpecialDynamic(g)});
 bindSpecialDynamic(g)
}
function bindSpecialDynamic(g){
 if($('#startKickoff'))$('#startKickoff').onclick=()=>{const from=Math.max(20,Math.min(50,+$('#stFrom').value||40));g.kickoffPending=true;g.kickoff={phase:'kick',kickingTeam:g.poss,receivingTeam:other(g.poss),startYard:from,kickDir:g.driveDir||1,startSpot:screenSpot(from,g.driveDir||1),landing:null,returnEnd:null,kicker:$('#stKicker').value.trim(),returner:'',tacklers:[],touchback:false};save();renderGame(g.id)};
 if($('#stKicker'))$('#stKicker').oninput=e=>currentPlay.kicker=e.target.value.trim();
 if($('#stReturner'))$('#stReturner').oninput=e=>currentPlay.returner=e.target.value.trim();
 $$('#kickGood [data-good]').forEach(b=>b.onclick=()=>{$$('#kickGood [data-good]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentPlay.kickGood=b.dataset.good==='true'})
}
function bindKickoff(g,t){
 if(!g.kickoffPending)return;const k=g.kickoff;
 if($('#koKicker'))$('#koKicker').oninput=e=>{k.kicker=e.target.value.trim();save()};
 if($('#touchbackKick'))$('#touchbackKick').onclick=()=>{k.landing=touchdownSpot(k.kickDir||1);k.phase='return';k.touchback=true;const retDir=-(k.kickDir||1);k.returnEnd=screenSpot(20,retDir);save();renderGame(g.id)};
 if($('#lockKick'))$('#lockKick').onclick=()=>{k.phase='return';k.returnEnd=k.landing;save();renderGame(g.id)};
 if($('#koReturner'))$('#koReturner').oninput=e=>{k.returner=e.target.value.trim();save()};
 if($('#addKoTackler'))$('#addKoTackler').onclick=()=>{const n=$('#koTackler').value.trim();if(!n)return;k.tacklers.push(n);save();renderGame(g.id)};
 if($('#touchbackReturn'))$('#touchbackReturn').onclick=()=>{k.touchback=true;const retDir=-(k.kickDir||1);k.returnEnd=screenSpot(20,retDir);save();renderGame(g.id)};
 if($('#finishKickoff'))$('#finishKickoff').onclick=()=>finishKickoff(g)
}
function finishKickoff(g){
 const k=g.kickoff;if(k.returnEnd==null)return;const before=snapshot(g),end=clamp(k.returnEnd),kickDir=k.kickDir||1,returnDir=-kickDir,kickDistance=Math.abs(k.landing-(k.startSpot??k.startYard)),returnYards=k.touchback?0:Math.abs(end-k.landing);
 const desc=k.touchback?`Kickoff #${k.kicker||'—'} ${kickDistance} yd · TOUCHBACK`:`Kickoff #${k.kicker||'—'} ${kickDistance} yd; return #${k.returner||'—'} ${returnYards} yd to ${fmtDrive(end,returnDir)}${k.tacklers.length?`; tackle ${k.tacklers.map(x=>'#'+x).join(', ')}`:''}`;
 g.plays.push({id:uid(),kind:'Kickoff',team:k.kickingTeam,period:before.period,start:k.startSpot??k.startYard,end,yds:kickDistance,desc,before});g.poss=k.receivingTeam;g.driveDir=returnDir;g.los=end;g.down=1;g.toGo=Math.min(10,Math.max(1,returnDir===1?100-end:end));g.kickoffPending=false;g.kickoff=null;g.awaitingTry=false;g.tryType=null;save();renderGame(g.id)
}
function score(g,side,pts){if(side==='team')g.teamScore+=pts;else g.oppScore+=pts}
function beginKickoffAfterScore(g,scoringSide){const dir=g.driveDir||1,from=g.kickoffYard||40;g.tryType=null;g.kickoffPending=true;g.kickoff={phase:'kick',kickingTeam:scoringSide,receivingTeam:other(scoringSide),startYard:from,kickDir:dir,startSpot:screenSpot(from,dir),landing:null,returnEnd:null,kicker:'',returner:'',tacklers:[],touchback:false};g.awaitingTry=false}
function savePlay(g,t){
 if(g.kickoffPending)return toast('Finish the kickoff workflow first.');
 currentPlay.note=$('#playNote').value.trim();
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

 if(selectedSt==='Punt'){
   const punter=$('#stKicker')?.value.trim()||'',ret=$('#stReturner')?.value.trim()||'';
   desc=`Punt #${punter||'—'} to ${fmtDrive(end,g.driveDir)}${ret?`; returner #${ret}`:''}`;
   g.plays.push({id:uid(),kind:'Punt',team:before.poss,period:before.period,start,end,yds,desc,before});
   g.poss=other(g.poss);g.driveDir=-(g.driveDir||1);g.los=end;g.down=1;g.toGo=Math.min(10,Math.max(1,g.driveDir===1?100-g.los:g.los));
   save();renderGame(g.id);return
 }

 if(currentPlay.type==='Run'){
   currentPlay.player=$('#player')?.value.trim()||currentPlay.player;
   desc=`Run #${currentPlay.player||'—'} ${yds>=0?'+':''}${yds} yd`
 }else{
   currentPlay.qb=$('#qb')?.value.trim()||currentPlay.qb;
   currentPlay.receiver=$('#receiver')?.value.trim()||currentPlay.receiver;
   currentPlay.passResult=$('#passResult .active')?.textContent||currentPlay.passResult;
   if(currentPlay.passResult==='Incomplete'){end=start;yds=0;desc=`Pass #${currentPlay.qb||'—'} → #${currentPlay.receiver||'—'} incomplete`}
   else if(currentPlay.passResult==='Interception'){desc=`Pass #${currentPlay.qb||'—'} intercepted at ${fmtDrive(end,g.driveDir)}`;currentPlay.turnover=true}
   else if(currentPlay.passResult==='Sack')desc=`Sack of QB #${currentPlay.qb||'—'} ${yds} yd`;
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
   g.plays.push({id:uid(),kind:'2PT',team:before.poss,period:before.period,start,end,yds:end-start,desc,before,player:currentPlay.player,qb:currentPlay.qb,receiver:currentPlay.receiver,passResult:currentPlay.passResult,tryResult:currentPlay.tryResult,penalties:structuredClone(currentPlay.penalties),defenders:structuredClone(currentPlay.defenders)});
   g.tryType=null;
   beginKickoffAfterScore(g,before.poss);
   save();renderGame(g.id);return
 }

 if(currentPlay.fumble)desc+=` · FUMBLE${currentPlay.turnover?' LOST':''}`;
 if(currentPlay.score==='TD'){score(g,g.poss,6);desc+=' · TOUCHDOWN';end=touchdownSpot(g.driveDir);g.awaitingTry=true;g.tryType=null}
 else if(currentPlay.score==='Safety'){score(g,other(g.poss),2);desc+=' · SAFETY'}
 else if(currentPlay.score==='Def TD'){score(g,other(g.poss),6);desc+=' · DEFENSIVE TD';g.poss=other(g.poss);g.awaitingTry=true;g.tryType=null}
 else if((g.driveDir||1)===1?end>=100:end<=0){score(g,g.poss,6);desc+=' · TOUCHDOWN';end=touchdownSpot(g.driveDir);g.awaitingTry=true;g.tryType=null}

 if(currentPlay.defenders.length)desc+=` · ${currentPlay.defenders.map(d=>`#${d.n} ${d.action}`).join(', ')}`;
 if(currentPlay.penalties.length)desc+=currentPlay.penalties.map(p=>` · PEN ${p.side} ${p.type}${p.player?' #'+p.player:''} ${p.yards}yd ${p.status.toUpperCase()}`).join('');
 if(currentPlay.note)desc+=` · ${currentPlay.note}`;

 g.plays.push({id:uid(),kind:currentPlay.type,team:before.poss,period:before.period,start,end,yds:end-start,desc,before,player:currentPlay.player,qb:currentPlay.qb,receiver:currentPlay.receiver,passResult:currentPlay.passResult,penalties:structuredClone(currentPlay.penalties),defenders:structuredClone(currentPlay.defenders)});
 if(!g.awaitingTry&&!g.kickoffPending)applyAfterPlay(g,currentPlay,start,end);
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
function editSelected(g){const p=g.plays.find(x=>x.id===selectedPlayId);if(!p)return toast('Select a play first.');showModal(`<h2>Edit Play Description</h2><div class="field"><label>Description</label><textarea id="editDesc" rows="4">${esc(p.desc)}</textarea></div><div class="modal-actions"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="saveEdit">Save</button></div>`);$('#saveEdit').onclick=()=>{p.desc=$('#editDesc').value.trim()||p.desc;save();closeModal();renderGame(g.id)}}
function drawField(g,t){
 const f=$('#field');if(!f)return;const driveDir=g.driveDir||1,k=g.kickoff;
 const perspective=g.kickoffPending?(k.phase==='kick'?(k.kickDir||1)===1?k.kickingTeam:other(k.kickingTeam):(-(k.kickDir||1))===1?k.receivingTeam:other(k.receivingTeam)):(driveDir===1?g.poss:other(g.poss)),left=teamSide(g,t,perspective),right=teamSide(g,t,other(perspective));
 let ballAbs=g.kickoffPending?(k.phase==='kick'?(k.landing??k.startSpot??k.startYard):(k.returnEnd??k.landing)):currentPlay.end;
 f.innerHTML=`<div class="endzone left" style="background:${left.color};color:${textColor(left.color)}">${esc(left.name.slice(0,12))}</div><div class="endzone right" style="background:${right.color};color:${textColor(right.color)}">${esc(right.name.slice(0,12))}</div><div class="field-inner" id="fieldInner"></div>`;
 const inner=$('#fieldInner');
 for(let y=0;y<=100;y+=5){const d=document.createElement('div');d.className='yard-line'+(y%10===0?' major':'');d.style.left=y+'%';inner.appendChild(d)}
 for(let y=10;y<100;y+=10){const n=y<=50?y:100-y;['top','bottom'].forEach(pos=>{const d=document.createElement('div');d.className='yard-number '+pos;d.style.left=y+'%';d.textContent=n;inner.appendChild(d)})}
 for(let y=1;y<100;y++){const d=document.createElement('div');d.className='hash';d.style.left=y+'%';inner.appendChild(d)}
 if(!g.kickoffPending){const los=document.createElement('div');los.className='los-line';los.style.left=g.los+'%';inner.appendChild(los);const fd=document.createElement('div');fd.className='fd-line';fd.style.left=clamp(g.los+(g.driveDir||1)*g.toGo)+'%';inner.appendChild(fd)}
 else if(g.kickoff.phase==='kick'){const kl=document.createElement('div');kl.className='kick-line';kl.style.left=(g.kickoff.startSpot??screenSpot(g.kickoff.startYard,g.kickoff.kickDir||1))+'%';inner.appendChild(kl)}
 const ball=document.createElement('div');ball.className='football';ball.style.left=ballAbs+'%';inner.appendChild(ball);
 const setBall=x=>{const r=inner.getBoundingClientRect();const pct=clamp((x-r.left)/r.width*100);ball.style.left=pct+'%';if($('#ballText'))$('#ballText').textContent=fmtDrive(pct,g.driveDir||1);if(g.kickoffPending){if(g.kickoff.phase==='kick')g.kickoff.landing=pct;else g.kickoff.returnEnd=pct;save()}else currentPlay.end=pct};
 let drag=false;ball.addEventListener('pointerdown',e=>{drag=true;ball.setPointerCapture(e.pointerId);e.preventDefault()});ball.addEventListener('pointermove',e=>{if(drag)setBall(e.clientX)});ball.addEventListener('pointerup',e=>{drag=false;setBall(e.clientX);if(g.kickoffPending)renderGame(g.id)});inner.addEventListener('click',e=>{if(e.target===ball)return;setBall(e.clientX);if(g.kickoffPending)renderGame(g.id)})
}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
route();
