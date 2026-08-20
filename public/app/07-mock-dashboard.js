// ════════════════════════════════════════════════
// CLINICAL SIMULATION
// ════════════════════════════════════════════════
var simType = 'General', simCase = null, simStageIdx = 0, simScore = 0, simStages = [];
var simCaseData = null;

function simPickType(el) {
 document.querySelectorAll('.sim-type-card').forEach(function(c){ c.classList.remove('on'); });
 el.classList.add('on'); simType = el.dataset.simtype;
}

async function simStart() {
 var btn = document.getElementById('simStartBtn');
 btn.disabled = true; btn.textContent = 'Generating case...';
 simScore = 0; simStageIdx = 0;

 document.getElementById('simSetup').style.display = 'none';
 document.getElementById('simResults').classList.remove('on');
 document.getElementById('simFeedback').classList.remove('on');
 document.getElementById('simFeedback').className = 'sim-feedback';
 document.getElementById('simNextBtn').style.display = 'none';
 document.getElementById('simNewBtn').style.display = 'none';

 var sys = 'You are a clinical case generator for medical education. Generate a realistic clinical case for a ' + simType + ' scenario. Return ONLY raw JSON. Format: {"patient":{"name":"","age":0,"gender":"","avatar":""},"vitals":[{"label":"BP","value":"120/80","normal":true},{"label":"HR","value":"88","normal":true},{"label":"RR","value":"18","normal":true},{"label":"Temp","value":"37.2°C","normal":true},{"label":"O2","value":"98%","normal":true}],"complaint":"chief complaint in quotes","stages":[{"name":"History","question":"What do you ask?","options":["Option A","Option B","Option C","Option D"],"correct":0,"feedback":"explanation","score":20},{"name":"Examination","question":"What do you examine?","options":["Option A","Option B","Option C","Option D"],"correct":0,"feedback":"explanation","score":20},{"name":"Investigations","question":"What investigations do you order?","options":["Option A","Option B","Option C","Option D"],"correct":0,"feedback":"explanation","score":20},{"name":"Diagnosis","question":"What is the diagnosis?","options":["Option A","Option B","Option C","Option D"],"correct":0,"feedback":"explanation","score":20},{"name":"Management","question":"How do you manage?","options":["Option A","Option B","Option C","Option D"],"correct":0,"feedback":"explanation","score":20}]}. Make it realistic and educational. For ' + simType + ' cases.';

 try {
 var reply = await callWorker(sys, [{role:'user', content:'Generate a clinical case for ' + simType + ' medicine.'}]);
 var raw = reply.replace(/```json|```/g,'').trim();
 simCaseData = JSON.parse(raw);
 } catch(e) {
 simCaseData = simFallbackCase();
 }

 // Shuffle options so correct answer is not always B
 if(simCaseData && simCaseData.stages) {
 simCaseData.stages.forEach(function(stage) {
 if(typeof stage.correct === 'number') {
 var correctOpt = stage.options[stage.correct];
 var opts = stage.options.slice();
 for(var si=opts.length-1; si>0; si--) {
 var sj=Math.floor(Math.random()*(si+1));
 var tmp=opts[si]; opts[si]=opts[sj]; opts[sj]=tmp;
 }
 stage.options = opts;
 stage.correct = opts.indexOf(correctOpt);
 if(stage.correct===-1) stage.correct=0;
 }
 });
 }

 btn.disabled = false; btn.textContent = 'Start Case ';
 simRenderCase();
}

function simFallbackCase() {
 return {
 patient:{name:"Ahmed Al-Rashidi",age:58,gender:"Male",avatar:""},
 vitals:[{label:"BP",value:"160/100",normal:false},{label:"HR",value:"95",normal:false},{label:"RR",value:"22",normal:false},{label:"Temp",value:"37.8°C",normal:true},{label:"O2",value:"94%",normal:false}],
 complaint:'"I have been having severe chest pain for the past 2 hours, I cannot breathe properly"',
 stages:[
 {name:"History",question:"What is the most important history to take first?",options:["Ask about the character and radiation of chest pain","Ask about his favourite food","Check his social media history","Ask about his childhood"],correct:0,feedback:"Correct! Characterizing the chest pain — onset, site, character, radiation, duration, alleviating/aggravating factors — is the first priority in chest pain evaluation.",score:20},
 {name:"Examination",question:"What is the most critical examination finding to look for?",options:["Check feet for athlete's foot","Auscultate the heart and lungs, check JVP","Check hair texture","Examine the nails only"],correct:1,feedback:"Excellent! Cardiovascular and respiratory examination is critical. Check for S3 gallop, pulmonary crackles, elevated JVP indicating heart failure.",score:20},
 {name:"Investigations",question:"Which investigation is the MOST urgent to order?",options:["Full blood count","12-lead ECG immediately","Thyroid function tests","Colonoscopy"],correct:1,feedback:"Perfect! A 12-lead ECG is the single most important immediate investigation in chest pain. It takes 5 minutes and can diagnose STEMI which requires immediate intervention.",score:20},
 {name:"Diagnosis",question:"ECG shows ST elevation in V1-V4. What is the diagnosis?",options:["Inferior STEMI","Anterior STEMI","NSTEMI","Pericarditis"],correct:1,feedback:"Correct! ST elevation in V1-V4 indicates anterior STEMI, caused by LAD occlusion. This is a medical emergency requiring immediate reperfusion.",score:20},
 {name:"Management",question:"What is the immediate management for this patient?",options:["Send home with antacids","Aspirin 300mg + activate cath lab for primary PCI within 90 minutes","Give paracetamol and observe","Order CT scan and wait"],correct:1,feedback:"Excellent! STEMI management: Aspirin 300mg + P2Y12 inhibitor + anticoagulation + primary PCI within 90 minutes of first medical contact. Time is myocardium!",score:20}
 ]
 };
}

function simRenderCase() {
 var d = simCaseData;
 document.getElementById('simPatAvatar').textContent = d.patient.avatar || '';
 document.getElementById('simPatName').textContent = d.patient.name;
 document.getElementById('simPatMeta').textContent = d.patient.age + 'y/o ' + d.patient.gender + ' • ' + simType;
 document.getElementById('simCaseType').textContent = simType;
 document.getElementById('simComplaint').textContent = d.complaint;

 var vitalsEl = document.getElementById('simVitals');
 vitalsEl.innerHTML = d.vitals.map(function(v){
 return '<div class="sim-vital' + (v.normal===false?' abnormal':v.normal===null?' warning':'') + '"><div class="sim-vital-val">' + v.value + '</div><div class="sim-vital-lbl">' + v.label + '</div></div>';
 }).join('');

 simStages = d.stages || [];
 var stepsEl = document.getElementById('simProgressSteps');
 stepsEl.innerHTML = simStages.map(function(s,i){
 return '<div class="sim-step' + (i===0?' current':'') + '" id="simStep'+i+'"></div>';
 }).join('');

 document.getElementById('simPatient').classList.add('on');
 simLoadStage(0);
}

function simLoadStage(idx) {
 simStageIdx = idx;
 var allStages = document.querySelectorAll('.sim-stage');
 allStages.forEach(function(s){ s.classList.remove('on'); });
 document.getElementById('simFeedback').classList.remove('on');
 document.getElementById('simFeedback').className = 'sim-feedback';
 document.getElementById('simNextBtn').style.display = 'none';
 document.getElementById('simNewBtn').style.display = 'none';

 var stageNames = ['history','exam','investigations','diagnosis','management'];
 var stageEl = document.getElementById('sim-stage-' + stageNames[idx]);

 if(!stageEl || idx >= simStages.length) { simShowResults(); return; }
 stageEl.classList.add('on');

 var stage = simStages[idx];
 var optsId = 'sim' + ['History','Exam','Inv','Dx','Mgmt'][idx] + 'Opts';
 var optsEl = document.getElementById(optsId);
 if(optsEl) {
 optsEl.innerHTML = '<div style="font-size:14px;font-weight:700;color:var(--tx);margin-bottom:.8rem;line-height:1.5">' + esc(stage.question) + '</div>';
 stage.options.forEach(function(opt, i) {
 var btn = document.createElement('button');
 btn.className = 'sim-option';
 btn.textContent = opt;
 btn.onclick = function() { simSelectOption(i, btn, stage, optsEl); };
 optsEl.appendChild(btn);
 });
 }

 simStages.forEach(function(s,i) {
 var el = document.getElementById('simStep'+i);
 if(el) { el.className = 'sim-step' + (i<idx?' done':i===idx?' current':''); }
 });
}

function simSelectOption(idx, btn, stage, optsEl) {
 optsEl.querySelectorAll('.sim-option').forEach(function(b){ b.disabled = true; });
 var isCorrect = idx === stage.correct;
 btn.classList.add(isCorrect ? 'correct' : 'wrong');
 optsEl.querySelectorAll('.sim-option')[stage.correct].classList.add('correct');

 var fb = document.getElementById('simFeedback');
 fb.textContent = (isCorrect ? ' ' : ' ') + stage.feedback;
 fb.className = 'sim-feedback on ' + (isCorrect ? 'good' : 'bad');

 if(isCorrect) { simScore += stage.score||20; updateXP(15); } else { updateXP(5); if(typeof addMistake==='function') addMistake('diagnosis', stage.question||stage.name, stage.options[idx]||'', stage.options[stage.correct]||'', stage.feedback||''); }

 document.getElementById('simNextBtn').style.display = 'block';
}

function simNextStage() {
 simLoadStage(simStageIdx + 1);
}

function simShowResults() {
 document.querySelectorAll('.sim-stage').forEach(function(s){ s.classList.remove('on'); });
 document.getElementById('simFeedback').classList.remove('on');
 document.getElementById('simNextBtn').style.display = 'none';

 var grade, gradeClass, title, sub;
 if(simScore >= 90){ grade='A+'; gradeClass='excellent'; title='Outstanding Clinician!'; sub='Perfect case management. You are ready for clinical practice!'; }
 else if(simScore >= 70){ grade='B+'; gradeClass='good'; title='Good Work!'; sub='Solid clinical reasoning. Keep practising!'; }
 else if(simScore >= 50){ grade='C'; gradeClass='average'; title='Needs Improvement'; sub='Review the case and learn from the mistakes.'; }
 else{ grade='F'; gradeClass='fail'; title='Needs More Study'; sub='Go back and review clinical management guidelines.'; }

 document.getElementById('simGrade').textContent = grade;
 document.getElementById('simGrade').className = 'sim-result-grade ' + gradeClass;
 document.getElementById('simResultTitle').textContent = title;
 document.getElementById('simResultSub').textContent = sub;

 document.getElementById('simResultStats').innerHTML = [
 {val: simScore+'%', lbl:'Score'},
 {val: simStages.length, lbl:'Stages'},
 {val: totalCases+1, lbl:'Total Cases'},
 {val: grade, lbl:'Grade'}
 ].map(function(s){ return '<div style="background:var(--card2);border-radius:12px;padding:.8rem;text-align:center;border:1px solid var(--bd)"><div style="font-size:1.4rem;font-weight:900;color:var(--p-lite);font-family:var(--f2)">'+s.val+'</div><div style="font-size:10px;color:var(--tx3);font-weight:700;margin-top:.2rem">'+s.lbl+'</div></div>'; }).join('');

 totalCases++; document.getElementById('sc-cases').textContent = totalCases;
 updateXP(simScore > 70 ? 50 : 25);
 libSave('lesson', 'Clinical Case: ' + simType + ' - Grade: ' + grade, 'Score: ' + simScore + '%');
 document.getElementById('simResults').classList.add('on');
 document.getElementById('simNewBtn').style.display = 'block';
 if(grade === 'A+') fireConfetti();
 showNotif('Case complete! Grade: ' + grade + ' — ' + simScore + '%');
}

function simNewCase() {
 document.getElementById('simPatient').classList.remove('on');
 document.getElementById('simResults').classList.remove('on');
 document.getElementById('simSetup').style.display = 'block';
 simCaseData = null; simScore = 0; simStageIdx = 0;
}

// ════════════════════════════════════════════════
// MOCK TEST ENGINE
// ════════════════════════════════════════════════
var mockExam = 'MBBS', mockMode = 'timed', mockQs = [], mockCurrentQ = 0;
var mockCorrect = 0, mockWrong = 0, mockSkipped = 0;
var mockTimerInt = null, mockTimerSecs = 0, mockAnswered = false, mockSelected = null;
var mockConfigs = { MBBS:{qs:20,mins:30}, USMLE:{qs:20,mins:40}, PLAB:{qs:20,mins:30}, FCPS:{qs:20,mins:35}, Quick:{qs:10,mins:15} };

function mockPickExam(el) {
 document.querySelectorAll('.mock-exam-card').forEach(function(c){ c.classList.remove('on'); });
 el.classList.add('on'); mockExam = el.dataset.mexam;
}
function mockPickMode(el) {
 document.querySelectorAll('[data-mmode]').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on'); mockMode = el.dataset.mmode;
}
function mockGoSetup() {
 document.getElementById('mockSetup').style.display = 'block';
 document.getElementById('mockRunning').classList.remove('on');
 document.getElementById('mockAnalytics').classList.remove('on');
 clearInterval(mockTimerInt);
}

var mockQCount = 10;

function mockPickCount(el) {
 document.querySelectorAll('[data-mqcount]').forEach(function(b){b.classList.remove('on');});
 el.classList.add('on');
 mockQCount = parseInt(el.dataset.mqcount);
}

async function mockStart() {
 var cfg = mockConfigs[mockExam] || {qs:20,mins:30};
 mockCorrect=0; mockWrong=0; mockSkipped=0; mockCurrentQ=0; mockAnswered=false; mockSelected=null;

 document.getElementById('mockSetup').style.display = 'none';
 document.getElementById('mockRunning').classList.add('on');
 document.getElementById('mockAnalytics').classList.remove('on');
 document.getElementById('mockExamName').textContent = mockExam + ' Mock';
 document.getElementById('mockQProgress').textContent = 'Q 1/' + mockQCount;

 var sys = 'Generate EXACTLY ' + mockQCount + ' high-quality ' + mockExam + ' style MCQs covering mixed medical subjects. Return ONLY a raw JSON array with EXACTLY ' + mockQCount + ' items. Format: [{"q":"question","opts":["A. ","B. ","C. ","D. "],"ans":"A","exp":"explanation","subj":"subject"}]. No markdown, no backticks.';
 try {
 var reply = await callWorker(sys, [{role:'user', content:'Generate ' + mockQCount + ' ' + mockExam + ' mock exam questions.'}]);
 mockQs = JSON.parse(reply.replace(/```json|```/g,'').trim());
 if(!mockQs||mockQs.length<5) throw new Error('Not enough');
 } catch(e) { mockQs = epFallbackQs().slice(0, mockQCount); }

 document.getElementById('mockQProgress').textContent = 'Q 1/' + mockQs.length;
 if(mockMode === 'timed') {
 mockTimerSecs = cfg.mins * 60;
 mockTimerInt = setInterval(function(){
 mockTimerSecs--;
 var h=Math.floor(mockTimerSecs/3600), m=Math.floor((mockTimerSecs%3600)/60), s=mockTimerSecs%60;
 var el=document.getElementById('mockTimerBig');
 if(el){el.textContent=(h>0?h+':':'')+(m<10&&h>0?'0':'')+m+':'+(s<10?'0':'')+s;el.classList.toggle('urgent',mockTimerSecs<300);}
 if(mockTimerSecs<=0){clearInterval(mockTimerInt);mockSubmit();}
 },1000);
 }
 mockRenderQ();
}

function mockRenderQ() {
 if(mockCurrentQ >= mockQs.length) { mockSubmit(); return; }
 var q = mockQs[mockCurrentQ];
 mockAnswered = false; mockSelected = null;
 document.getElementById('mockQProgress').textContent = 'Q ' + (mockCurrentQ+1) + '/' + mockQs.length;
 var pct = mockQs.length>0 ? Math.round((mockCorrect/(mockCurrentQ||1))*100) : 0;
 document.getElementById('mockScore').textContent = 'Score: ' + pct + '%';

 document.getElementById('mockQArea').innerHTML =
 '<div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:1.5rem">' +
 '<div style="font-size:11px;font-weight:800;color:var(--p-lite);background:rgba(37,99,235,.15);padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:.8rem">' + esc(q.subj||'Medicine') + '</div>' +
 '<div style="font-size:15px;font-weight:700;line-height:1.7;color:var(--tx);margin-bottom:1.2rem">' + esc(q.q) + '</div>' +
 '<div id="mockOpts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:1rem"></div>' +
 '<div id="mockExp" style="display:none;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.2);border-radius:12px;padding:1rem;font-size:13px;color:var(--tx2);line-height:1.8"></div>' +
 '<div style="display:flex;gap:8px;margin-top:1rem">' +
 '<button onclick="mockSubmitAnswer()" id="mockSubmitQ" style="flex:1;padding:10px;background:linear-gradient(135deg,var(--p),var(--p2));color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:var(--f)">Submit</button>' +
 '<button onclick="mockNextQ()" id="mockNextQ" style="display:none;flex:1;padding:10px;background:rgba(255,255,255,.05);border:1px solid var(--bd);color:var(--tx2);border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--f)">Next →</button>' +
 '</div></div>';

 var optsEl = document.getElementById('mockOpts');
 (q.opts||[]).forEach(function(opt,i){
 var btn=document.createElement('button');
 btn.style.cssText='padding:11px 14px;border-radius:11px;border:1.5px solid var(--bd);background:var(--card2);color:var(--tx);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--f);text-align:left;transition:all .15s;display:flex;gap:10px;align-items:center';
 btn.innerHTML='<span style="width:24px;height:24px;border-radius:7px;background:rgba(37,99,235,.15);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--p-lite);flex-shrink:0">'+['A','B','C','D'][i]+'</span>'+esc(opt.replace(/^[A-D]\.\s*/,''));
 btn.dataset.idx=i;
 btn.onclick=function(){if(mockAnswered)return;document.getElementById('mockOpts').querySelectorAll('button').forEach(function(b){b.style.borderColor='var(--bd)';b.style.background='var(--card2)';});btn.style.borderColor='rgba(37,99,235,.5)';btn.style.background='rgba(37,99,235,.1)';mockSelected=i;};
 optsEl.appendChild(btn);
 });
}

function mockSubmitAnswer() {
 if(mockSelected===null){showNotif('Please select an answer!');return;}
 if(mockAnswered) return;
 mockAnswered=true;
 var q=mockQs[mockCurrentQ];
 var correctIdx=['A','B','C','D'].indexOf(q.ans);
 var isCorrect=mockSelected===correctIdx;
 var btns=document.getElementById('mockOpts').querySelectorAll('button');
 btns.forEach(function(b,i){b.disabled=true;if(i===correctIdx){b.style.borderColor='var(--ok)';b.style.background='rgba(16,185,129,.1)';}else if(i===mockSelected&&!isCorrect){b.style.borderColor='var(--red)';b.style.background='rgba(239,68,68,.1)';}});
 if(isCorrect) mockCorrect++; else { mockWrong++; addMistake('mcq',q.q,(q.opts[mockSelected]||'').replace(/^[A-D]\.\s*/,''),(q.opts[correctIdx]||'').replace(/^[A-D]\.\s*/,''),q.exp||''); }
 var expEl=document.getElementById('mockExp');
 expEl.style.display='block';expEl.textContent=q.exp||'Review this topic in your notes.';
 document.getElementById('mockSubmitQ').style.display='none';
 document.getElementById('mockNextQ').style.display='block';
}

function mockNextQ() {
 mockCurrentQ++;
 if(mockCurrentQ>=mockQs.length) mockSubmit(); else mockRenderQ();
}

function mockPause() {
 if(mockTimerInt){clearInterval(mockTimerInt);document.getElementById('mockPauseBtn').textContent='▶ Resume';mockTimerInt=null;}
 else{mockMode==='timed'&&(mockTimerInt=setInterval(function(){mockTimerSecs--;var m=Math.floor(mockTimerSecs/60),s=mockTimerSecs%60;var el=document.getElementById('mockTimerBig');if(el)el.textContent=m+':'+(s<10?'0':'')+s;if(mockTimerSecs<=0){clearInterval(mockTimerInt);mockSubmit();}},1000));document.getElementById('mockPauseBtn').textContent='⏸ Pause';}
}

function mockSubmit() {
 clearInterval(mockTimerInt);
 var total=mockQs.length||1, pct=Math.round((mockCorrect/total)*100);
 document.getElementById('mockRunning').classList.remove('on');
 document.getElementById('mockAnalytics').classList.add('on');
 document.getElementById('mockFinalScore').textContent=pct+'%';
 document.getElementById('mockFinalLabel').textContent=mockExam+' Mock — '+(pct>=60?'PASS ':'FAIL ')+' | '+mockCorrect+'/'+total+' correct';

 document.getElementById('mockStatCards').innerHTML=[
 {v:mockCorrect,l:'Correct',c:'var(--ok)'},{v:mockWrong,l:'Wrong',c:'var(--red)'},{v:mockSkipped,l:'Skipped',c:'var(--gold)'},{v:pct+'%',l:'Score',c:'var(--p-lite)'}
 ].map(function(s){return'<div style="background:var(--card2);border-radius:12px;padding:.8rem;text-align:center;border:1px solid var(--bd)"><div style="font-size:1.4rem;font-weight:900;color:'+s.c+';font-family:var(--f2)">'+s.v+'</div><div style="font-size:10px;color:var(--tx3);font-weight:700;margin-top:.2rem">'+s.l+'</div></div>';}).join('');

 var subjStats={};
 mockQs.forEach(function(q,i){if(!subjStats[q.subj])subjStats[q.subj]={c:0,t:0};subjStats[q.subj].t++;});
 document.getElementById('mockSubjBreakdown').innerHTML=Object.keys(subjStats).map(function(subj){var p=Math.round((subjStats[subj].c/subjStats[subj].t)*100)||50;return'<div class="subj-mastery-item"><div class="subj-mastery-header"><span>'+subj+'</span><span>'+p+'%</span></div><div class="subj-mastery-bar"><div class="subj-mastery-fill" style="width:'+p+'%"></div></div></div>';}).join('');

 if(!window._mockXPGiven){ window._mockXPGiven=true; updateXP(pct>70?100:pct>50?60:30); }
 libSave('quiz', 'Mock Test: ' + mockExam + ' - ' + pct + '%', 'Correct: ' + mockCorrect + '/' + total);
 if(pct>=60) fireConfetti();
 showNotif('Mock complete: '+pct+'% — '+(pct>=60?'PASS! ':'FAIL. Review your mistakes.'));
}
function mockRetry(){mockGoSetup();mockStart();}

// ════════════════════════════════════════════════
// STUDY PLAN GENERATOR
// ════════════════════════════════════════════════
var spPlanText = '';

async function generateStudyPlan() {
 var exam = document.getElementById('spExam').value;
 var date = document.getElementById('spDate').value;
 var hours = document.getElementById('spHours').value;
 var weak = document.getElementById('spWeak').value.trim();
 var target = document.getElementById('spTarget').value;

 if(!date) { showNotif('Please select your exam date!'); return; }

 var daysLeft = Math.max(1, Math.floor((new Date(date) - new Date()) / (1000*60*60*24)));

 var btn = document.getElementById('spGenBtn');
 btn.disabled = true; btn.textContent = 'Generating plan...';

 var sys = 'You are an expert medical exam coach. Create a personalized study plan for a medical student. Return a structured study plan with weekly breakdown. Format the response clearly with: Week 1, Week 2 etc (up to ' + Math.ceil(daysLeft/7) + ' weeks), with daily topics and hours. Include revision days and mock test dates. Keep it practical and specific to ' + exam + '.';

 try {
 var reply = await callWorker(sys, [{role:'user', content:'Create a ' + exam + ' study plan. Days remaining: ' + daysLeft + '. Daily hours: ' + hours + '. Weak subjects: ' + (weak||'none specified') + '. Target: ' + target + ' score.'}]);
 spPlanText = reply;
 renderStudyPlan(reply, daysLeft);
 document.getElementById('spOutput').classList.add('on');
 showNotif(' Study plan generated! +20 XP');
 updateXP(20);
 libSave('lesson', 'Study Plan: ' + exam + ' (' + new Date().toLocaleDateString('en-GB') + ')', reply);
 if(typeof trackActivity === 'function') trackActivity();
 } catch(e) {
 showNotif('Error: ' + e.message);
 }
 btn.disabled = false; btn.textContent = 'Generate Study Plan';
}

function renderStudyPlan(raw, daysLeft) {
 var lines = raw.split('\n');
 var html = '';
 var inWeek = false;
 lines.forEach(function(line) {
 var t = line.trim();
 if(!t) return;
 if(/^week/i.test(t) || /^month/i.test(t)) {
 if(inWeek) html += '</div>';
 html += '<div class="sp-week"><div class="sp-week-title"> ' + esc(t) + '</div>';
 inWeek = true;
 } else if(/^day\s*\d/i.test(t) || /^\d+\.\s/.test(t) || /^[•\-]/.test(t)) {
 html += '<div class="sp-day"><div class="sp-day-num" style="font-size:9px;width:auto;padding:0 6px;min-width:28px"></div><div class="sp-day-content">' + esc(t.replace(/^[•\-\d\.]\s*/,'')) + '</div></div>';
 } else {
 html += '<div style="font-size:13px;color:var(--tx2);padding:.4rem 0;line-height:1.6">' + esc(t) + '</div>';
 }
 });
 if(inWeek) html += '</div>';
 html += '<div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:12px;padding:1rem;margin-top:1rem;text-align:center"><div style="font-size:13px;font-weight:800;color:var(--ok)"> ' + daysLeft + ' days remaining until exam</div></div>';
 document.getElementById('spPlanContent').innerHTML = html || '<div style="font-size:13px;color:var(--tx2);white-space:pre-wrap">'+esc(raw)+'</div>';
}

function spCopy() {
 navigator.clipboard.writeText(stripMarkdown(spPlanText || "")).catch(function(){});
 var btn = document.getElementById('spCopyBtn');
 btn.textContent = 'Copied!';
 setTimeout(function(b){ b.textContent='Copy Plan'; }.bind(null,btn), 2000);
}

// ════════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════════
var lbCurrentTab = 'global';

var lbData = [
 {name:'Dr. Sara K.',level:'Consultant',xp:4850,badge:''},
 {name:'Ahmed M.',level:'Registrar',xp:3200,badge:''},
 {name:'Fatima H.',level:'Registrar',xp:2950,badge:''},
 {name:'Omar R.',level:'Resident',xp:2100,badge:''},
 {name:'Priya S.',level:'Resident',xp:1840,badge:''},
 {name:'Khalid A.',level:'Senior Clerk',xp:1560,badge:''},
 {name:'Aisha T.',level:'Senior Clerk',xp:1320,badge:''},
 {name:'Hassan N.',level:'Junior Clerk',xp:980,badge:''},
 {name:'Lena B.',level:'Junior Clerk',xp:750,badge:''},
 {name:'Yusuf M.',level:'Medical Student',xp:420,badge:''},
];

function lbSwitch(el, tab) {
 document.querySelectorAll('.lb-tab').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on'); lbCurrentTab = tab;
 renderLeaderboard();
}



// ════════════════════════════════════════════════
// DASHBOARD UPGRADE
// ════════════════════════════════════════════════
function renderHeatmap() {
 var grid = document.getElementById('heatmapGrid');
 if(!grid) return;
 grid.innerHTML = '';
 // Build activity map from localStorage
 var activityData = JSON.parse(localStorage.getItem('aid_heatmap') || '{}');
 var today = new Date();
 for(var i=83; i>=0; i--) {
 var d = new Date(today); d.setDate(d.getDate() - i);
 var key = d.toISOString().split('T')[0];
 var count = activityData[key] || 0;
 var cell = document.createElement('div');
 var lvl = count >= 10 ? 'hm-cell l4' : count >= 5 ? 'hm-cell l3' : count >= 2 ? 'hm-cell l2' : count >= 1 ? 'hm-cell l1' : 'hm-cell';
 cell.className = lvl;
 cell.title = key + ': ' + count + ' activities';
 grid.appendChild(cell);
 }
}

function trackActivity() {
 var today = new Date().toISOString().split('T')[0];
 var map = JSON.parse(localStorage.getItem('aid_heatmap') || '{}');
 map[today] = (map[today] || 0) + 1;
 localStorage.setItem('aid_heatmap', JSON.stringify(map));
}

// ════════════════════════════════════════════════
// WIRE UP GOPANEL UPDATES
// ════════════════════════════════════════════════
// [merged into goPanel]


// ════════════════════════════════════════════════
// DASHBOARD RANK CARD + HEATMAP HTML
// ════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
 var dashWelcome = document.querySelector('.dash-welcome');
 if(dashWelcome) {
 // Add rank card and heatmap after welcome
 var rankCard = document.createElement('div');
 rankCard.className = 'rank-card';
 rankCard.innerHTML = '<div class="rank-info"><h3 id="rankCardTitle">Medical Student</h3><p id="rankCardSub">Keep studying to level up!</p></div><div class="rank-badge" id="rankBadge"></div>';
 dashWelcome.parentNode.insertBefore(rankCard, dashWelcome.nextSibling);

 var heatmapWrap = document.createElement('div');
 heatmapWrap.className = 'heatmap-wrap';
 heatmapWrap.innerHTML = '<h3>Study Activity (12 Weeks)</h3><div class="heatmap-grid" id="heatmapGrid"></div>';
 rankCard.parentNode.insertBefore(heatmapWrap, rankCard.nextSibling);
 }

 // Add quick action buttons for new features in dashboard
 var qa = document.querySelector('.quick-actions');
 if(qa) {
 var extraBtns = [
 {panel:'examprep', icon:'<i data-lucide="clipboard-list"></i>', lbl:'Exam Prep'},
 {panel:'simulation', icon:'<i data-lucide="activity"></i>', lbl:'Clinical Sim'},
 {panel:'mocktest', icon:'<i data-lucide="timer"></i>', lbl:'Mock Test'},
 {panel:'mistakebook', icon:'<i data-lucide="book-open"></i>', lbl:'Mistakes'},
 ];
 extraBtns.forEach(function(b) {
 if(!qa.querySelector('[data-qpanel="'+b.panel+'"]')) {
 var el = document.createElement('button');
 el.className = 'qa-btn'; el.dataset.qpanel = b.panel;
 el.onclick = function(){ goPanel(b.panel); };
 el.innerHTML = '<div class="qa-btn-icon">'+b.icon+'</div><div class="qa-btn-lbl">'+b.lbl+'</div>';
 qa.appendChild(el);
 }
 });
 }

 // Init EP question display
 var epQ = document.getElementById('epQuestion');
 if(epQ) epQ.style.display = 'none';
});

// Render initial heatmap + leaderboard on load
setTimeout(function(){
 renderHeatmap();
 renderLeaderboard();
 renderMistakeBook();
 loadLandingReviews();
}, 500);

