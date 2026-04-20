const $=id=>document.getElementById(id);
const screens=document.querySelectorAll('.screen');
const navItems=document.querySelectorAll('.nav-item');
let authToken=null,currentDecisionId=null;

$('btnMin').onclick=()=>window.electronAPI.window.minimize();
$('btnMax').onclick=()=>window.electronAPI.window.maximize();
$('btnClose').onclick=()=>window.electronAPI.window.close();

function showScreen(id){
  screens.forEach(s=>s.classList.remove('active'));
  const t=$(`screen${id[0].toUpperCase()+id.slice(1)}`);
  if(t)t.classList.add('active');
  navItems.forEach(n=>n.classList.remove('active'));
  const nav=document.querySelector(`.nav-item[data-target="${id}"]`);
  if(nav)nav.classList.add('active');
}

navItems.forEach(nav=>nav.addEventListener('click',()=>{
  if(!authToken&&nav.dataset.target!=='login')return;
  const t=nav.dataset.target;
  showScreen(t);
  if(t==='dashboard')loadDashboard();
  if(t==='history')loadHistory();
  if(t==='settings')loadSettings();
  if(t==='admin')loadAdmin();
  if(t==='workforce')loadWorkforce();
}));

async function apiCall(method,path,body=null){
  const res=await window.electronAPI.api.request({method,path,body,token:authToken});
  if(res&&res.accessToken)authToken=res.accessToken;
  return res;
}

// ── Auth
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('btnLoginBtn'),email=$('loginEmail').value,password=$('loginPassword').value;
  btn.textContent='Authenticating...';btn.disabled=true;
  $('loginError').style.display='none';
  try{
    const res=await apiCall('POST','/api/auth/login',{email,password});
    const user=res.user||{};
    $('sidebarName').textContent=user.name||email;
    $('sidebarRole').textContent=(user.role||'user').toUpperCase();
    if(user.role==='admin')$('navAdmin').style.display='flex';
    else $('navAdmin').style.display='none';
    $('sidebar').style.display='flex';
    showScreen('dashboard');
    loadDashboard();
  }catch(err){
    $('loginError').textContent=err.message||'Authentication failed';
    $('loginError').style.display='block';
  }finally{btn.textContent='Authenticate';btn.disabled=false;}
});

$('btnLogout').onclick=()=>{authToken=null;$('sidebar').style.display='none';showScreen('login');};

// ── Dashboard
async function loadDashboard(){
  try{
    const r=await apiCall('GET','/api/dashboard');
    if(!r)return;
    $('dashTotal').textContent=r.metrics?.totalAnalyses??0;
    $('dashRisk').textContent=r.metrics?.avgRiskScore??0;
    $('dashAlerts').textContent=r.metrics?.complianceAlerts??0;

    const rl=$('recentList');
    rl.innerHTML=(r.recentDecisions||[]).length===0?'<div style="color:#64748b;font-size:13px;">No decisions yet.</div>':
      (r.recentDecisions||[]).map(d=>{
        const rec=d.analysis?.recommendation||'Pending';
        return`<div class="list-row" onclick="loadDecision('${d._id}')">
          <div><div class="list-row-title">${d.title}</div><div class="list-row-sub">${d.department}</div></div>
          <span class="badge badge-${rec.toLowerCase()}">${rec}</span></div>`;
      }).join('');

    const al=$('alertList');
    al.innerHTML=(r.highPriorityAlerts||[]).length===0?'<div style="color:#64748b;font-size:13px;">No high-priority alerts.</div>':
      (r.highPriorityAlerts||[]).map(a=>`
        <div class="alert-row ${a.severity}">
          <div><span class="alert-sev ${a.severity}">${a.severity}</span>${a.message}</div>
          <div style="font-size:11px;color:#64748b;">${new Date(a.createdAt).toLocaleDateString()}</div>
        </div>`).join('');
  }catch(e){console.error('Dashboard error',e);}
}

// ── Load a single decision by ID and show results
async function loadDecision(id){
  showProcessing('Loading decision...');
  try{
    const r=await apiCall('GET',`/api/decision/${id}`);
    renderResults(r);
  }catch(e){alert('Failed to load decision: '+e.message);showScreen('dashboard');}
}

// ── Workforce AI
async function loadWorkforce(){
  try{
    const r=await apiCall('GET','/api/employees/dashboard');
    if(!r)return;
    $('wfTotal').textContent=r.metrics?.totalEmployees??0;
    $('wfAvgScore').textContent=r.metrics?.avgPerformanceScore??0;
    $('wfPipCount').textContent=r.metrics?.pipCount??0;

    const el=$('wfEvalList');
    el.innerHTML=(r.recentEvaluations||[]).length===0?'<div style="color:#64748b;font-size:13px;">No evaluations yet.</div>':
      (r.recentEvaluations||[]).map(ev=>{
        const rec=ev.recommendation||'Unknown';
        const displayRec = rec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        // Map evaluation recommendation to existing badge colors
        let badgeClass = 'revise';
        if(rec === 'promote' || rec === 'salary_hike') badgeClass = 'approve';
        if(rec === 'pip' || rec === 'demote') badgeClass = 'reject';
        
        return`<div class="list-row">
          <div><div class="list-row-title">${ev.employeeRef?.name || 'Unknown'} - Score: ${ev.overallScore}</div><div class="list-row-sub">${ev.employeeRef?.designation} • ${ev.employeeRef?.department}</div></div>
          <span class="badge badge-${badgeClass}">${displayRec}</span></div>`;
      }).join('');
  }catch(e){console.error('Workforce dashboard error',e);}
}

// ── Auto Copilot
const dz=$('dropZone');
dz.ondragover=e=>{e.preventDefault();dz.classList.add('over');};
dz.ondragleave=()=>dz.classList.remove('over');
dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');const f=e.dataTransfer?.files?.[0];if(f)handleFile(f.path);};
$('btnBrowse').onclick=async()=>{const f=await window.electronAPI.file.openDialog();if(f)handleFile(f);};

async function handleFile(filePath){
  showProcessing('Reading: '+filePath.split(/[\\/]/).pop());
  try{const r=await window.electronAPI.file.analyze(filePath);renderResults(r);}
  catch(e){alert('Analysis failed: '+e.message);showScreen('auto');}
}

// ── Processing
function showProcessing(sub){
  showScreen('processing');
  $('processingSub').textContent=sub||'Connecting to AI Engine...';
  let step=1;
  const steps=['pStep1','pStep2','pStep3','pStep4'];
  steps.forEach(s=>$s(s)?.classList.remove('active'));
  const iv=setInterval(()=>{
    if(step<=4){document.getElementById('pStep'+step)?.classList.add('active');step++;}
    else clearInterval(iv);
  },700);
  window._processingInterval=iv;
}
function $s(id){return document.getElementById(id);}

// ── Manual Wizard
window.wizGo=function(n){
  ['wizBody1','wizBody2','wizBody3'].forEach(id=>document.getElementById(id)?.classList.remove('active'));
  document.getElementById('wizBody'+n)?.classList.add('active');
  ['pill1','pill2','pill3'].forEach((id,i)=>{
    const el=$(id);if(!el)return;
    el.classList.remove('active','done');
    if(i+1<n)el.classList.add('done');
    else if(i+1===n)el.classList.add('active');
  });
  if(n===3){
    const s={title:$('fTitle').value,desc:$('fDesc').value,dept:$('fDept').value,
      industry:$('fIndustry').value,urgency:$('fUrgency').value,
      time:$('fTime').value,budget:$('fBudget').value,stake:$('fStake').value,pain:$('fPain').value};
    $('reviewSummary').innerHTML=`<strong>Title:</strong> ${s.title}<br>
      <strong>Dept:</strong> ${s.dept} &bull; <strong>Industry:</strong> ${s.industry}<br>
      <strong>Urgency:</strong> ${s.urgency} &bull; <strong>Horizon:</strong> ${s.time} days<br>
      <strong>Budget:</strong> $${Number(s.budget).toLocaleString()}<br>
      <strong>Stakeholders:</strong> ${s.stake}<br><strong>Pain Point:</strong> ${s.pain}`;
  }
};

$('manualForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={
    title:$('fTitle').value,description:$('fDesc').value,
    department:$('fDept').value,industry:$('fIndustry').value,
    urgency:$('fUrgency').value,timeHorizon:parseInt($('fTime').value),
    complianceSensitivity:$('fCompliance').value,
    budgetImpact:parseInt($('fBudget').value)||0,
    stakeholdersAffected:$('fStake').value,currentPainPoint:$('fPain').value,
  };
  showProcessing('Analyzing: '+payload.title);
  try{
    const r=await apiCall('POST','/api/decision',payload);
    renderResults(r);
  }catch(e){alert('Analysis failed: '+e.message);showScreen('manual');}
});

// ── Results Rendering
function renderResults(data){
  clearInterval(window._processingInterval);
  showScreen('results');
  const a=data.analysis||{};
  const d=data.decision||data||{};
  currentDecisionId=d._id||null;
  $('resTitle').textContent=d.title||data.fileName||'Analysis Results';
  $('resMeta').textContent=`${d.department||''} · ${d.industry||''} · Risk ${a.riskScore||0}/100`;

  $('resultsContainer').innerHTML=`
    <div class="res-pane active" id="resOverview">
      <div class="res-overview-grid">
        <div class="rec-banner">
          <div class="rec-label">AI Recommendation</div>
          <div class="rec-value">${a.recommendation||'–'}</div>
          <div class="rec-text">${a.executiveSummary||'No summary available.'}</div>
        </div>
        <div class="scores-panel">
          ${scoreRow('Risk',a.riskScore,'risk')}
          ${scoreRow('Trust',a.trustScore,'trust')}
          ${scoreRow('ROI',a.roiScore,'roi')}
          ${scoreRow('Compliance',a.complianceScore,'comp')}
          ${scoreRow('Human Impact',a.humanImpactScore,'human')}
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-title">Score Radar Overview</div>
        <canvas id="scoreChart" height="160"></canvas>
      </div>
    </div>

    <div class="res-pane" id="resScenarios">
      <div class="scen-grid">
        <div class="scen-card"><h4>✅ Best Case</h4><p>${a.bestCase||'–'}</p></div>
        <div class="scen-card"><h4>⚖️ Likely Case</h4><p>${a.likelyCase||'–'}</p></div>
        <div class="scen-card"><h4>⚠️ Worst Case</h4><p>${a.worstCase||'–'}</p></div>
      </div>
      <div style="margin-top:16px;"><div class="scen-card"><h4>💡 Safer Alternative</h4><p>${a.saferAlternative||'–'}</p></div></div>
    </div>

    <div class="res-pane" id="resRisks">
      <div class="scen-grid two-grid">
        <div class="scen-card"><h4>🔍 Hidden Risks</h4><ul>${(a.hiddenRisks||[]).map(r=>`<li>${r}</li>`).join('')}</ul></div>
        <div class="scen-card"><h4>🔇 Silent Patterns</h4><ul>${(a.silentPatterns||[]).map(r=>`<li>${r}</li>`).join('')}</ul></div>
      </div>
    </div>

    <div class="res-pane" id="resStrategy">
      <div class="scen-card" style="margin-bottom:16px;"><h4>📋 Phased Rollout Plan</h4><ol>${(a.rolloutPlan||[]).map(r=>`<li>${r}</li>`).join('')}</ol></div>
      <div class="debate-grid">
        ${(a.boardroomDebate||[]).map(b=>`
          <div class="debate-card">
            <div class="debate-role">${b.role}</div>
            <div class="debate-stance">${b.stance}</div>
            <div class="debate-concern">${b.concern}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="res-pane" id="resDissent">
      <div class="trust-banner">
        <div class="trust-banner-left">
          <h3>Stakeholder Dissent Tracker</h3>
          <p>Objections dynamically re-evaluate the AI trust score via Gemini.</p>
        </div>
        <div class="trust-score-display">
          <div class="trust-score-num" id="trustScoreNum">${a.trustScore||0}</div>
          <div class="trust-score-label">Live Trust Score</div>
        </div>
      </div>
      <div class="dissent-layout">
        <div>
          <div class="dissent-form-card">
            <h4>Active Objections</h4>
            <div id="activeObjections" style="margin-top:8px;"><div style="color:#64748b;font-size:13px;">Loading...</div></div>
            <h4 style="margin-top:16px;opacity:.6;">Resolved History</h4>
            <div id="pastObjections" style="margin-top:8px;opacity:.6;"><div style="color:#64748b;font-size:13px;">None</div></div>
          </div>
        </div>
        <div class="dissent-form-card">
          <h4>Register Official Dissent</h4>
          <form id="dissentForm" style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
            <div class="form-group">
              <label>Category</label>
              <select class="form-select" id="disCat">
                <option value="compliance">Compliance</option>
                <option value="budget">Budget</option>
                <option value="technical">Technical</option>
                <option value="timing">Timing</option>
                <option value="strategic">Strategic</option>
              </select>
            </div>
            <div class="form-group">
              <label>Severity</label>
              <select class="form-select" id="disSev">
                <option value="minor">Minor Warning</option>
                <option value="major">Major Risk</option>
                <option value="blocking">Fatal BLOCKER</option>
              </select>
            </div>
            <div class="form-group">
              <label>Rationale</label>
              <textarea class="form-textarea" id="disRat" rows="3" required placeholder="State exactly why this decision exposes the organization..."></textarea>
            </div>
            <button type="submit" class="btn-primary" id="btnSubmitDissent">Submit Dissent</button>
          </form>
        </div>
      </div>
    </div>`;

  // Draw chart
  requestAnimationFrame(()=>drawScoreChart(a));

  // Tab switching
  document.querySelectorAll('.res-tab').forEach(t=>{
    t.onclick=()=>{
      document.querySelectorAll('.res-tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.res-pane').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const id='res'+t.dataset.tab[0].toUpperCase()+t.dataset.tab.slice(1);
      document.getElementById(id)?.classList.add('active');
    };
  });

  // Dissent
  if(currentDecisionId)loadObjections(currentDecisionId);
  $('dissentForm').onsubmit=async ev=>{
    ev.preventDefault();
    if(!currentDecisionId)return;
    const btn=$('btnSubmitDissent');btn.textContent='Submitting...';btn.disabled=true;
    try{
      const r=await apiCall('POST',`/api/decision/${currentDecisionId}/dissent`,{
        category:$('disCat').value,severity:$('disSev').value,rationale:$('disRat').value
      });
      if(r.newTrustScore!=null)$('trustScoreNum').textContent=r.newTrustScore;
      $('disRat').value='';
      await loadObjections(currentDecisionId);
    }catch(e){alert('Dissent failed: '+e.message);}
    finally{btn.textContent='Submit Dissent';btn.disabled=false;}
  };
}

function scoreRow(label,val,cls){
  const v=val||0;
  return`<div class="score-row">
    <div class="score-name">${label}</div>
    <div class="score-bar-wrap"><div class="score-bar ${cls}" style="width:${v}%"></div></div>
    <div class="score-num">${v}</div>
  </div>`;
}

function drawScoreChart(a){
  const canvas=$('scoreChart');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const labels=['Risk','Trust','ROI','Compliance','Human'];
  const vals=[a.riskScore||0,a.trustScore||0,a.roiScore||0,a.complianceScore||0,a.humanImpactScore||0];
  const colors=['#ef4444','#34d399','#a78bfa','#67e8f9','#fb923c'];
  const W=canvas.offsetWidth||600,H=160;
  canvas.width=W;canvas.height=H;
  ctx.clearRect(0,0,W,H);
  const bw=Math.min(60,(W/labels.length)-16);
  const gap=(W-bw*labels.length)/(labels.length+1);
  labels.forEach((lbl,i)=>{
    const x=gap+(bw+gap)*i,barH=(vals[i]/100)*(H-40),y=H-30-barH;
    ctx.fillStyle=colors[i]+'33';
    ctx.fillRect(x,H-30-barH,bw,barH);
    ctx.fillStyle=colors[i];
    ctx.fillRect(x,y,bw,2);
    ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillStyle='#94a3b8';
    ctx.fillText(lbl,x+bw/2,H-12);
    ctx.fillStyle=colors[i];ctx.font='bold 13px system-ui';
    ctx.fillText(vals[i],x+bw/2,y-6);
  });
}

// ── Objections
async function loadObjections(id){
  try{
    const r=await apiCall('GET',`/api/decision/${id}/dissent`);
    const objections=r.objections||r||[];
    const active=objections.filter(o=>o.status==='active');
    const past=objections.filter(o=>o.status!=='active');
    const ao=$('activeObjections'),po=$('pastObjections');
    if(!ao||!po)return;
    ao.innerHTML=active.length===0?'<div style="color:#64748b;font-size:13px;font-style:italic;">No active objections.</div>':
      active.map(o=>`<div class="obj-card ${o.severity}">
        <div class="obj-meta">
          <span class="obj-tag">${o.category}</span>
          <span class="obj-tag">${o.severity}</span>
        </div>
        <div class="obj-rationale">${o.rationale}</div>
        <div class="obj-who">— ${o.submittedBy?.name||'User'}</div>
      </div>`).join('');
    po.innerHTML=past.length===0?'<div style="color:#64748b;font-size:12px;">None</div>':
      past.map(o=>`<div class="obj-past">
        <strong>[${o.status.toUpperCase()}]</strong> ${o.rationale}
        ${o.adminNote?`<div class="admin-note">Admin: ${o.adminNote}</div>`:''}
      </div>`).join('');
  }catch(e){console.error('Objections error',e);}
}

// ── History
async function loadHistory(search=''){
  const list=$('fullHistoryList');
  list.innerHTML='<div style="color:#64748b;font-size:13px;">Loading...</div>';
  try{
    const q=search?`?search=${encodeURIComponent(search)}`:'';
    const items=await apiCall('GET',`/api/history${q}`);
    if(!items||items.length===0){list.innerHTML='<div style="color:#64748b;font-size:13px;">No decisions found.</div>';return;}
    list.innerHTML=items.map(item=>{
      const rec=item.analysis?.recommendation||'Pending';
      return`<div class="hist-item" onclick="loadDecision('${item._id}')">
        <div>
          <div class="hist-title">${item.title}</div>
          <div class="hist-meta">${item.department||'–'} &bull; ${new Date(item.createdAt).toLocaleDateString()}</div>
        </div>
        <span class="badge badge-${rec.toLowerCase()}">${rec}</span>
      </div>`;
    }).join('');
  }catch(e){list.innerHTML=`<div style="color:#ef4444;font-size:13px;">${e.message}</div>`;}
}
$('btnHistSearch').onclick=()=>loadHistory($('histSearch').value);

// ── What-If
$('btnWhatIf').onclick=async()=>{
  const btn=$('btnWhatIf');btn.textContent='Forecasting...';btn.disabled=true;
  try{
    const r=await apiCall('POST','/api/whatif',{
      scenario:$('wiScenario').value,
      baselineCost:Number($('wiCost').value),
      baselineRisk:Number($('wiRisk').value)
    });
    if(r){
      $('wiResCost').textContent='$'+(r.costSaved/1000).toFixed(0)+'k';
      $('wiResRisk').textContent=(r.riskDelta>0?'+':'')+r.riskDelta+' pts';
      $('wiResSla').textContent=r.slaImpact||'–';
      $('wiResCust').textContent=r.customerImpact||'–';
      $('wiResRec').textContent=r.recommendation||'–';
      $('whatifResults').style.display='block';
    }
  }catch(e){alert('Simulation failed: '+e.message);}
  finally{btn.textContent='Run Simulation';btn.disabled=false;}
};

// ── Settings
async function loadSettings(){
  try{
    const r=await apiCall('GET','/api/settings');
    if(r){
      $('setProfileName').value=r.name||'';
      $('setProfileEmail').value=r.email||'';
      $('setProfileRole').value=r.role||'';
      const init=(r.name||'?')[0].toUpperCase();
      $('profileAvatar').textContent=init;
    }
  }catch(e){console.error('Settings error',e);}
}
$('btnSaveKey').onclick=async()=>{
  const btn=$('btnSaveKey'),key=$('setApiKey').value;
  btn.textContent='Saving...';btn.disabled=true;
  try{await apiCall('PUT','/api/settings/gemini-key',{key});alert('Key saved!');}
  catch(e){alert('Failed: '+e.message);}
  finally{btn.textContent='Save Key';btn.disabled=false;}
};
$('btnDeleteKey').onclick=async()=>{
  if(!confirm('Delete your personal Gemini key?'))return;
  try{await apiCall('DELETE','/api/settings/gemini-key');$('setApiKey').value='';alert('Key deleted.');}
  catch(e){alert('Failed: '+e.message);}
};

// ── Admin
async function loadAdmin(){
  try{
    const[users,health]=await Promise.all([
      apiCall('GET','/api/admin/users'),
      apiCall('GET','/api/admin/system-health').catch(()=>null)
    ]);
    $('adminUserCount').textContent=users.length;
    $('adminAdminCount').textContent=users.filter(u=>u.role==='admin').length;
    $('adminAiStatus').textContent=health?.aiEngine||'–';
    $('adminDbStatus').textContent=health?.database||'–';
    $('adminUserTable').innerHTML=users.map(u=>`
      <div class="admin-table-row">
        <div><div style="font-weight:600;color:#e2e8f0;">${u.name}</div><div style="font-size:11px;color:#64748b;">${u.email}</div></div>
        <div>
          <select class="role-select" onchange="updateRole('${u._id}',this.value)">
            <option ${u.role==='admin'?'selected':''}>admin</option>
            <option ${u.role==='analyst'?'selected':''}>analyst</option>
            <option ${u.role==='viewer'?'selected':''}>viewer</option>
          </select>
        </div>
        <div><span class="badge ${u.emailVerified?'badge-approve':'badge-pending'}">${u.emailVerified?'Verified':'Pending'}</span></div>
        <div><button class="btn-danger" onclick="deleteUser('${u._id}')">Delete</button></div>
      </div>`).join('');
  }catch(e){$('adminUserTable').innerHTML=`<div style="padding:16px;color:#ef4444;">${e.message}</div>`;}
}
window.updateRole=async(id,role)=>{
  try{await apiCall('PATCH',`/api/admin/users/${id}/role`,{role});}
  catch(e){alert('Failed: '+e.message);loadAdmin();}
};
window.deleteUser=async(id)=>{
  if(!confirm('Delete this user? This cannot be undone.'))return;
  try{await apiCall('DELETE',`/api/admin/users/${id}`);loadAdmin();}
  catch(e){alert('Failed: '+e.message);}
};

// ── Init
window.electronAPI.onBackendReady(()=>{
  $('statusRight').innerHTML='<span style="color:#34d399;">● Backend Online</span>';
});
showScreen('login');
