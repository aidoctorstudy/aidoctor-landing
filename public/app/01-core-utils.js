
// Handle #login and #signup hash from Emergent landing page
(function(){
  function handleHash() {
    var h = window.location.hash;
    if(h === '#login' || h === '#signup') {
      var ob = document.getElementById('pg-onboard');
      var lp = document.getElementById('pg-landing');
      if(ob) ob.classList.add('on');
      if(lp) lp.classList.remove('on');
    }
  }
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleHash);
  } else {
    handleHash();
  }
})();

var WU = 'https://aidoctorstudy.aidoctorstudy.workers.dev';

async function callWorker(sys, msgs, imageBase64) {
 try {
 var controller = new AbortController();
 var to = setTimeout(function(){ controller.abort(); }, 60000);
 var finalMsgs = msgs ? msgs.slice() : [];
 if(imageBase64 && finalMsgs.length > 0) {
 var last = finalMsgs[finalMsgs.length-1];
 if(last && last.role === 'user') {
 var imgData = imageBase64.indexOf(',') > -1 ? imageBase64.split(',')[1] : imageBase64;
 var mimeMatch = imageBase64.match(/data:([^;]+);/);
 var mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
 finalMsgs[finalMsgs.length-1] = {
 role:'user',
 content:[
 {type:'image', source:{type:'base64', media_type:mime, data:imgData}},
 {type:'text', text: typeof last.content === 'string' ? last.content : 'Analyse this medical image'}
 ]
 };
 }
 }
 var lastMsg = finalMsgs.length > 0 ? finalMsgs[finalMsgs.length-1] : null;
 var histMsgs = finalMsgs.length > 0 ? finalMsgs.slice(0, -1) : [];
 var res = await fetch(WU + '/ai', {
 method:'POST',
 headers:{'Content-Type':'application/json'},
 body:JSON.stringify({message: lastMsg ? lastMsg.content : '', history: histMsgs, idToken: await firebase.auth().currentUser?.getIdToken()}),
 signal:controller.signal
 });
 clearTimeout(to);
 var txt = await res.text();
 var data;
 try { data = JSON.parse(txt); } catch(e) { throw new Error('Worker error: ' + txt.substring(0,80)); }
 if(data && data.error) {
 var em = data.error.message || JSON.stringify(data.error);
 if(data.error.code === 429) throw new Error('AI busy — wait 20 seconds and retry');
 throw new Error(em);
 }
 if(!data.reply || !data.reply.trim()) throw new Error('Empty response — please try again');
 return data.reply;
 } catch(err) {
 if(err.name === 'AbortError') throw new Error('Request timed out — check connection');
 throw err;
 }
}

var chatHist=[], chatMode='normal';
var sName='', sYear='1', sExam='MBBS', qLeft=9999, isPro=true; // BETA: all free
var hist=[], attTxt='', attFileName='';
var cards=[], cardIdx=0, fcCount=8;
var totalXP=0, totalQs=0, totalCards=0, totalCases=0;
var curMode='explain', curSubj='General Medicine', caseType='diagnose';

var LEVELS=[
 {name:'Medical Student',min:0,max:100},
 {name:'Junior Clerk',min:100,max:250},
 {name:'Senior Clerk',min:250,max:500},
 {name:'Resident',min:500,max:1000},
 {name:'Registrar',min:1000,max:2000},
 {name:'Consultant',min:2000,max:9999}
];

var modeDescs = {
 explain: '<b>Explain Mode</b> — Clear medical explanation with clinical relevance',
 exam: '<b>Exam Answer</b> — USMLE/PLAB style answer for full marks',
 case: '<b>Case Mode</b> — Clinical case analysis and diagnosis',
 drug: '<b>Drug Mode</b> — Drug mechanism, uses, side effects, contraindications',
 quiz: '<b>Quiz Me</b> — MCQ practice in exam format with explanations',
 cram: '<b>Exam Cram</b> — High yield points, must-knows, memory tricks'
};

function getSys(mode, name, year, exam, subj) {
 var ctx = 'You are AI Doctor AI, an expert medical tutor. Student: '+name+', Year '+year+', '+exam+' focused. Subject: '+subj+'.\n';
 if(mode==='explain') return ctx+'EXPLAIN MODE. Give a clear, clinically relevant explanation. Include: mechanism, clinical significance, key points to remember. Use proper medical terminology appropriate for Year '+year+'.';
 if(mode==='exam') return ctx+'EXAM ANSWER MODE. Give a perfect '+exam+'-style answer. Format:\n\nDiagnosis/Answer: [direct answer]\nKey Points:\n1. [point]\n2. [point]\n3. [point]\nWhat to write in exam: [model answer for full marks]\nHigh Yield Fact: [one must-know fact]';
 if(mode==='case') return ctx+'CASE MODE. Analyze the clinical case provided. Format:\n\nMost Likely Diagnosis: [diagnosis]\nReasoning: [why this diagnosis]\nKey Differentials:\n1. [differential]\n2. [differential]\nInvestigations: [what to order]\nManagement: [treatment plan]\nPearl: [one clinical pearl]';
 if(mode==='drug') return ctx+'DRUG MODE. Give comprehensive drug information. Format:\n\nDrug: [name]\nClass: [drug class]\nMechanism: [MOA]\nIndications: [uses]\nSide Effects: [key adverse effects]\nContraindications: [key contraindications]\nMnemonic: [memory trick if applicable]\nHigh Yield: [most tested fact]';
 if(mode==='quiz') return ctx+'QUIZ MODE. Create 5 MCQ questions in '+exam+' format on the topic. Format:\n\n1. [question]\nA) [option] B) [option] C) [option] D) [option]\nAnswer: [letter] — [explanation]\n\n[repeat for all 5]';
 if(mode==='cram') return ctx+'EXAM CRAM MODE. Last-minute high yield summary. Format:\n\nHIGH YIELD POINTS:\n• [must know]\n• [must know]\nKEY FACTS:\n• [fact]\nLIKELY EXAM QUESTIONS:\n• [question]\nMEMORY TRICKS:\n• [mnemonic]\n60-SECOND SUMMARY: [cheat sheet summary]';
 return ctx+'Answer the medical question clearly and accurately.';
}

function goTo(id) {
 document.querySelectorAll('.page').forEach(function(p){p.classList.remove('on');});
 var pg=document.getElementById(id); if(pg){pg.classList.add('on');window.scrollTo(0,0);}
 document.body.classList.toggle('app-active', id === 'pg-app');
}

// Landing buttons
document.getElementById('navLoginBtn').onclick=function(){goTo('pg-onboard');};
document.getElementById('navSignupBtn').onclick=function(){goTo('pg-onboard');};
document.getElementById('heroSignupBtn').onclick=function(){goTo('pg-onboard');};
document.getElementById('heroLoginBtn').onclick=function(){goTo('pg-onboard');};
document.getElementById('priceFreeBtn').onclick=function(){goTo('pg-onboard');};
document.getElementById('backToLanding').onclick=function(){goTo('pg-landing');};

document.getElementById('skipModal').onclick=function(){document.getElementById('proModal').classList.remove('on');};
document.getElementById('proChipBtn').onclick=openProModal;

// FAQ
document.querySelectorAll('.faq-q').forEach(function(q){q.onclick=function(){this.closest('.faq-item').classList.toggle('open');};});

// ONBOARD
document.getElementById('startBtn').onclick=function(){
 var n=document.getElementById('obName').value.trim();
 var y=document.getElementById('obYear').value;
 var e=document.getElementById('obExam').value;
 if(!n||!y){alert('Please fill in your name and year!');return;}
 sName=n; sYear=y; sExam=e||'MBBS';
 document.getElementById('sideAvatar').textContent=n[0].toUpperCase();
 document.getElementById('dashName').textContent=n;
 document.getElementById('dashSub').textContent='Year '+y+' • '+sExam+' — Ready to study!';
 updateXP(0); updateBadge();
 goTo('pg-app'); goPanel('dash');
 if(!document.getElementById('chatMsgs').children.length) {
 addAI('Welcome Dr. '+n+'! I am AI Doctor — your AI medical tutor. I know Anatomy, Pharmacology, Pathology, Clinical Medicine and more. I also have Case Solver and Mnemonic Generator. What would you like to study today?',false);
 }
};

function getLevel(){for(var i=LEVELS.length-1;i>=0;i--){if(totalXP>=LEVELS[i].min)return{level:i+1,name:LEVELS[i].name,min:LEVELS[i].min,max:LEVELS[i].max};}return{level:1,name:'Medical Student',min:0,max:100};}

function updateXP(amount){
 totalXP+=amount;
 if(amount > 0 && typeof trackActivity === 'function') trackActivity();
 var lv=getLevel();
 var pct=Math.min(100,((totalXP-lv.min)/(lv.max-lv.min))*100);
 document.getElementById('xpCount').textContent=totalXP;
 document.getElementById('sc-xp').textContent=totalXP;
 document.getElementById('xpCurrent').textContent=totalXP;
 document.getElementById('xpNext').textContent=lv.max;
 document.getElementById('levelNum').textContent=lv.level;
 document.getElementById('levelName').textContent=lv.name;
 document.getElementById('xpBarFill').style.width=pct+'%';
 if(amount>0){var p=document.getElementById('xpPopup');p.textContent='+'+amount+' XP ';p.classList.add('show');setTimeout(function(){p.classList.remove('show');},2000);}
}

function updateBadge(){
 var fc=document.getElementById('freeChip'),ub=document.getElementById('proChipBtn');
 if(ub) ub.style.display=isPro?'none':'';
 if(fc){
  if(isPro){fc.textContent='Pro';fc.style.background='rgba(245,158,11,.15)';fc.style.color='#F59E0B';}
  else{fc.textContent=qLeft+' left today';fc.style.background=qLeft>2?'rgba(37,99,235,.15)':'rgba(239,68,68,.15)';fc.style.color=qLeft>2?'var(--p-lite)':'#EF4444';}
 }
}

function openProModal(){document.getElementById('proModal').classList.add('on');}

function applySecret(){
 var code=document.getElementById('secretInput').value.trim().toUpperCase();
 if(code==='MUSTAFASFIRSTWEBSITETHATISMADEBYAIANDTHENAMEISCALLEDSTUDEVOAIWW'||code==='TESTFREETRIAL!WEEKPROFORFREEFORTRYING'||code==='MEDPRO2026'||code==='IGIVEYOUFREEPROFOREVERYIPEEENLYFORRELATIVESANDFRIENDS'){
 isPro=true; updateBadge();
 document.querySelectorAll('.mode-btn.pr').forEach(function(b){b.classList.remove('pr');});
 document.getElementById('proModal').classList.remove('on');
 fireConfetti();
 addAI('Secret code accepted! Welcome to AI Doctor Pro! All modes unlocked including Clinical Case Solver, Drug Mode, and Exam Cram!',false);
 goPanel('chat');
 } else {
 var inp=document.getElementById('secretInput');
 inp.style.borderColor='#EF4444';inp.style.background='rgba(239,68,68,.1)';inp.value='';inp.placeholder='Wrong code!';
 setTimeout(function(){inp.style.borderColor='';inp.style.background='';inp.placeholder='Have a secret code?';},2000);
 }
}


async function handlePanelUpload(e, targetId) {
 var file = e.target.files[0];
 if(!file) return;
 var ext = file.name.split('.').pop().toLowerCase();
 try {
 showToast('Reading ' + file.name + '...', 'info', 4000);
 var content = '';
 if(['png','jpg','jpeg','gif','webp'].includes(ext)) {
 content = '[Image: ' + file.name + '] Analyse this medical image.';
 } else if(ext === 'txt' || ext === 'csv') {
 content = await file.text();
 } else if(ext === 'pdf') {
 if(typeof pdfjsLib !== 'undefined') {
 pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 var ab = await file.arrayBuffer();
 var pdf = await pdfjsLib.getDocument({data:ab}).promise;
 for(var i=1; i<=Math.min(pdf.numPages,15); i++) {
 var pg = await pdf.getPage(i);
 var ct = await pg.getTextContent();
 content += ct.items.map(function(it){return it.str;}).join(' ') + ' ';
 }
 } else { content = await file.text().catch(function(){return '';}); }
 } else if(['doc','docx'].includes(ext) && typeof mammoth !== 'undefined') {
 var ab2 = await file.arrayBuffer();
 var res = await mammoth.extractRawText({arrayBuffer:ab2});
 content = res.value;
 } else {
 content = await file.text().catch(function(){return 'Could not read this file type. Please copy and paste the text manually.';});
 }
 var target = document.getElementById(targetId);
 if(target && content) {
 target.value = content.substring(0, 5000);
 target.dispatchEvent(new Event('input'));
 showToast('' + file.name + ' loaded!', 'success');
 }
 } catch(err) { showToast('' + err.message, 'error'); }
 e.target.value = '';
}

// ════════════════════════════════════════════════
// THEME (light / dark)
// ════════════════════════════════════════════════
function toggleTheme() {
 var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
 var next = cur === 'light' ? 'dark' : 'light';
 document.documentElement.setAttribute('data-theme', next);
 try { localStorage.setItem('aid_theme', next); } catch(e) {}
}

