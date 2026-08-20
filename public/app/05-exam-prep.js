// ════════════════════════════════════════════════
// EXAM PREP - STATE & SETUP FUNCTIONS
// ════════════════════════════════════════════════
var epExam = 'MBBS';
var epSubj = 'Mixed', epSystem = '', epYear = 'any';
var epDiff = 'Easy';
var epMode = 'untimed';
var epQCount = 10;
var epQuestions = [];
var epCurrentQ = 0;
var epCorrect = 0;
var epWrong = 0;
var epSkipped = 0;
var epTotalXP = 0;
var epSelected = null;
var epAnswered = false;
var epBookmarked = [];
var epFlagged = [];

function epPickSubj(el) {
 document.querySelectorAll('.ep-subj-btn[data-subj]').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 epSubj = el.dataset.subj;
 epSystem = '';
 var wrap = document.getElementById('epSystemWrap');
 var btns = document.getElementById('epSystemBtns');
 var systems = typeof QG_SYSTEMS !== 'undefined' ? QG_SYSTEMS[epSubj] : null;
 if(systems && systems.length && epSubj !== 'Mixed') {
  btns.innerHTML = '<button class="ep-opt on" data-sys="" onclick="epPickSystem(this)">All</button>' + systems.map(function(s){ return '<button class="ep-opt" data-sys="'+s+'" onclick="epPickSystem(this)">'+s+'</button>'; }).join('');
  wrap.style.display = 'block';
 } else if(wrap) {
  wrap.style.display = 'none';
 }
}
function epPickSystem(el) {
 document.querySelectorAll('#epSystemBtns .ep-opt').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 epSystem = el.dataset.sys;
}
function epPickYear(el) {
 document.querySelectorAll('#epYearRow .ep-opt').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 epYear = el.dataset.year;
}

function epPickExam(el) {
 document.querySelectorAll('.ep-card[data-exam]').forEach(function(c){ c.classList.remove('on'); });
 el.classList.add('on');
 epExam = el.dataset.exam;
}

function epPickOpt(el, type) {
 var attr = type === 'diff' ? 'data-diff' : type === 'mode' ? 'data-mode' : 'data-qs';
 var selector = '[' + attr + ']';
 // Only deselect siblings within the same row
 var parent = el.closest('.ep-opts-row') || el.parentNode;
 parent.querySelectorAll(selector).forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 if(type === 'diff') epDiff = el.dataset.diff;
 else if(type === 'mode') epMode = el.dataset.mode;
 else if(type === 'qs') epQCount = parseInt(el.dataset.qs);
}

function epGoSetup() {
 var setup = document.getElementById('epSetup');
 var question = document.getElementById('epQuestion');
 var results = document.getElementById('epResults');
 if(setup) setup.style.display = 'block';
 if(question) question.classList.remove('on');
 if(results) results.classList.remove('on');
}

function goPanel(id){
 var panel=document.getElementById('panel-'+id);
 if(!panel){ console.warn('goPanel: no panel found for id "'+id+'" - ignoring to avoid blanking the screen'); return; }
 // Update sidebar active state
 document.querySelectorAll('.side-btn[data-panel]').forEach(function(b){b.classList.remove('on');});
 document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('on');});
 var btn=document.querySelector('.side-btn[data-panel="'+id+'"]');
 if(btn)btn.classList.add('on');
 panel.classList.add('on');
 if(typeof lucide!=='undefined') setTimeout(function(){lucide.createIcons();},50);

 // Panel-specific init
 if(id==='dash'){renderHeatmap();setTimeout(function(){renderHeatmap();},300);}
 if(id==='library'){renderLibrary();}
 if(id==='review'){renderReviews();}
 if(id==='bugreport'){renderBugHistory();}
 if(id==='leaderboard'){renderLeaderboard();}
 if(id==='settings'){
 var av=document.getElementById('settingsAvatar');
 var nm=document.getElementById('settingsName');
 var yr=document.getElementById('settingsYear');
 if(av)av.textContent=sName?sName[0].toUpperCase():'D';
 if(nm)nm.textContent='Dr. '+(sName||'Student');
 if(yr)yr.textContent='Year '+(sYear||'1')+' • '+(sExam||'MBBS');
 }
 if(id==='srs'){/* SRS removed */}
 if(id==='decks'){renderDecks();updateImpDeckSelect();}
 if(id==='importcenter'){updateImpDeckSelect();}
 if(id==='analytics'){renderAnalytics();}
 if(id==='publicdecks'){renderPublicDecks();updateImpDeckSelect();}
 if(id==='examprep'){
 var ep=document.getElementById('epSetup');
 var eq=document.getElementById('epQuestion');
 var er=document.getElementById('epResults');
 if(ep)ep.style.display='block';
 if(eq)eq.style.display='none';
 if(er)er.classList.remove('on');
 }
 if(id==='simulation'){
 var ss=document.getElementById('simSetup');
 var sp=document.getElementById('simPatient');
 var sr=document.getElementById('simResults');
 if(ss&&!simCaseData)ss.style.display='block';
 if(sp&&!simCaseData)sp.classList.remove('on');
 if(sr)sr.classList.remove('on');
 }
 if(id==='mocktest'){
 var ms=document.getElementById('mockSetup');
 var mr=document.getElementById('mockRunning');
 var ma=document.getElementById('mockAnalytics');
 if(ms)ms.style.display='block';
 if(mr)mr.classList.remove('on');
 if(ma)ma.classList.remove('on');
 }
 if(id==='mistakebook'){renderMistakeBook();}
}
document.querySelectorAll('.side-btn[data-panel]').forEach(function(btn){btn.onclick=function(){goPanel(this.dataset.panel);};});

// Subjects
document.querySelectorAll('.subj-btn').forEach(function(btn){btn.onclick=function(){document.querySelectorAll('.subj-btn').forEach(function(b){b.classList.remove('on');});this.classList.add('on');curSubj=this.dataset.subj;};});

// Modes
function setMode(m){
 if(['case','drug','quiz','cram'].indexOf(m)!==-1&&!isPro){openProModal();return;}
 curMode=m;
 document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.remove('on');});
 var btn=document.querySelector('.mode-btn[data-mode="'+m+'"]');
 if(btn)btn.classList.add('on');
 document.getElementById('modeDescBar').innerHTML=modeDescs[m]||modeDescs.explain;
}
document.querySelectorAll('.mode-btn[data-mode]').forEach(function(btn){btn.onclick=function(){setMode(this.dataset.mode);};});

// Chat
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function addUser(t,fn){var c=document.getElementById('chatMsgs'),d=document.createElement('div');d.className='msg u';var h='';if(fn)h+='<div style="background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);border-radius:10px;padding:7px 12px;font-size:12px;font-weight:700;color:var(--p-lite);max-width:85%;margin-bottom:4px"> '+esc(fn)+'</div>';if(t)h+='<div class="bubble">'+esc(t)+'</div>';d.innerHTML=h;c.appendChild(d);scrollChat();}
function showTyping(){rmTyping();var c=document.getElementById('chatMsgs'),d=document.createElement('div');d.className='msg ai';d.id='typ';d.innerHTML='<div class="msg-label">AI Doctor AI</div><div class="typing-bubble"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>';c.appendChild(d);scrollChat();}
function rmTyping(){var t=document.getElementById('typ');if(t)t.remove();}
function addAI(html,fmt){rmTyping();var c=document.getElementById('chatMsgs'),d=document.createElement('div');d.className='msg ai';d.innerHTML='<div class="msg-label">AI Doctor AI</div><div class="bubble">'+(fmt?html:esc(html))+'</div>';c.appendChild(d);scrollChat();}
function scrollChat(){var c=document.getElementById('chatMsgs');c.scrollTop=c.scrollHeight;}

function fmtReply(raw){
 if(!raw) return '';
 return raw.split('\n').map(function(line){
 var t = line.trim();
 if(!t) return '<div style="height:6px"></div>';
 // Escape HTML
 var s = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 // **bold** -> glowing blue bold
 s = s.replace(/\*\*([^*]+)\*\*/g,'<strong style="color:var(--p-lite);text-shadow:0 0 8px rgba(37,99,235,.4)">$1</strong>');
 // *italic*
 s = s.replace(/\*([^*]+)\*/g,'<em style="color:var(--tx)">$1</em>');
 // `code`
 s = s.replace(/`([^`]+)`/g,'<code style="background:rgba(37,99,235,.15);color:var(--p-lite);padding:1px 6px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>');
 // ### heading - bold + underline
 if(/^###\s/.test(t)) return '<div style="font-size:14px;font-weight:900;color:var(--p-lite);margin:1rem 0 .4rem;text-decoration:underline;text-underline-offset:4px;text-shadow:0 0 10px rgba(37,99,235,.4)">' + s.replace(/^###\s/,'') + '</div>';
 // ## heading - bigger bold + underline
 if(/^##\s/.test(t)) return '<div style="font-size:15px;font-weight:900;color:var(--p-lite);margin:1.2rem 0 .5rem;text-decoration:underline;text-underline-offset:5px;border-bottom:1px solid rgba(37,99,235,.2);padding-bottom:.3rem;text-shadow:0 0 12px rgba(37,99,235,.4)">' + s.replace(/^##\s/,'') + '</div>';
 // # heading - largest bold + underline 
 if(/^#\s/.test(t)) return '<div style="font-size:17px;font-weight:900;color:var(--p-lite);margin:1.2rem 0 .5rem;text-decoration:underline;text-underline-offset:5px;text-shadow:0 0 15px rgba(37,99,235,.5)">' + s.replace(/^#\s/,'') + '</div>';
 // Bullet points
 if(/^[\*\-]\s/.test(t)) return '<div style="padding:3px 0 3px 12px;display:flex;gap:8px;align-items:flex-start"><span style="color:var(--p-lite);flex-shrink:0;margin-top:3px">•</span><span style="line-height:1.7">' + s.replace(/^[\*\-]\s/,'') + '</span></div>';
 // Numbered lists
 if(/^\d+\.\s/.test(t)) {
 var num = t.match(/^(\d+)\./)[1];
 return '<div style="padding:3px 0 3px 12px;display:flex;gap:8px"><span style="color:var(--p-lite);font-weight:800;flex-shrink:0;min-width:20px">' + num + '.</span><span style="line-height:1.7">' + s.replace(/^\d+\.\s/,'') + '</span></div>';
 }
 // ALL CAPS lines = section heading (like QUICK SUMMARY:, KEY POINTS: etc)
 if(/^[A-Z][A-Z\s&:]{6,}:?$/.test(t)) {
 return '<div style="font-size:14px;font-weight:900;color:var(--p-lite);margin:1rem 0 .4rem;text-decoration:underline;text-underline-offset:4px;text-transform:uppercase;letter-spacing:.05em;text-shadow:0 0 10px rgba(37,99,235,.3)">' + s + '</div>';
 }
 // Lines ending in colon (like "Key Point:" "Mechanism:")
 if(/^[A-Za-z][^:]{2,30}:$/.test(t)) {
 return '<div style="font-size:13px;font-weight:900;color:var(--p-lite);margin:.6rem 0 .2rem;text-decoration:underline;text-underline-offset:3px">' + s + '</div>';
 }
 // Label patterns (Key Points:, Mnemonic: etc at start of line)
 if(/^(Diagnosis|Answer|Key Points?|Clinical Pearl|High Yield|Mnemonic|Management|Mechanism|Indication|Note|Warning|Important|Remember|Summary):/i.test(t)){
 var lbl = s.match(/^([^:]+):/)[1];
 var val = s.replace(/^[^:]+:\s*/,'');
 var isGreen = /Key Points?|Pearl|Mnemonic|High Yield|Remember/i.test(lbl);
 var bg = isGreen ? 'rgba(16,185,129,.2)' : 'rgba(37,99,235,.2)';
 var col = isGreen ? 'var(--ok)' : 'var(--p-lite)';
 return '<div style="margin:.4rem 0"><span style="background:'+bg+';color:'+col+';font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;margin-right:6px;text-transform:uppercase">'+lbl+'</span>'+val+'</div>';
 }
 return '<div style="padding:2px 0;line-height:1.8">' + s + '</div>';
 }).join('');
}


function sendQuickQ(q) {
 var input = document.getElementById('msgInput');
 if(input) { input.value = q; sendMsg(); }
}

async function sendMsg(){
 var inp=document.getElementById('msgInput'),text=inp.value.trim();
 if((!text||!text.trim())&&!attTxt)return;
 if(!isPro&&qLeft<=0){openProModal();return;}
 var fn=attFileName||null,full=text;
 if(attTxt)full=text?text+' [Attached: '+attTxt+']':'Help with: '+attTxt;
 if(!full)return;
 inp.value='';inp.style.height='auto';
 document.getElementById('sendBtn').disabled=true;
 addUser(text||'(file)',fn);
 attTxt='';attFileName='';document.getElementById('fileBar').classList.remove('on');
 if(!isPro){qLeft--;updateBadge();}
 totalQs++;document.getElementById('sc-qs').textContent=totalQs;
 hist.push({role:'user',content:full});showTyping();
 var sys=getSys(curMode,sName,sYear,sExam,curSubj);
 try{
 var reply=await callWorker(sys,hist);
 hist.push({role:'assistant',content:reply});
 addAI(fmtReply(reply),true);
 updateXP(10);
 if(!isPro&&qLeft<=0){setTimeout(function(){addAI('You used all 5 free questions today! Upgrade to <b>AI Doctor Pro</b> for unlimited access.<br><br><button onclick="openProModal()" style="margin-top:6px;background:linear-gradient(135deg,var(--p),var(--p2));color:white;border:none;padding:9px 20px;border-radius:9px;cursor:pointer;font-weight:800;font-size:13px;font-family:var(--f)">Get Pro </button>',true);},400);}
 }catch(err){addAI('Error: '+esc(err.message)+' — please try again!',true);}
 document.getElementById('sendBtn').disabled=false;
 if(typeof trackActivity==='function') trackActivity();
}

// FLASHCARDS
document.getElementById('fcDrop').onclick=function(){document.getElementById('fcFile').click();};
document.getElementById('fcFile').onchange=async function(e){var f=e.target.files[0];if(!f)return;
 var ext=f.name.split('.').pop().toLowerCase();
 var notesEl=document.getElementById('fcNotes');
 showToast('Reading '+f.name+'...','info');
 var content='';
 try{
  if(ext==='pdf'){
   content=await extractPDFText(f);
  } else if(ext==='docx'||ext==='doc'){
   var ab=await f.arrayBuffer();
   var res=await mammoth.extractRawText({arrayBuffer:ab});
   content=res.value||'';
  } else if(ext==='pptx'||ext==='ppt'){
   content=await extractPPTXText(f);
  } else {
   content=await new Promise(function(resolve,reject){
    var r=new FileReader();
    r.onload=function(ev){resolve(ev.target.result||'');};
    r.onerror=reject;
    r.readAsText(f,'UTF-8');
   });
  }
 }catch(err){
  showToast('Could not read '+f.name+' — try a different file','error');
  e.target.value='';
  return;
 }
 content=(content||'').substring(0,6000);
 if(!content.trim()){
  showToast('No readable text found in '+f.name,'error');
  e.target.value='';
  return;
 }
 notesEl.dataset.uploadedContent=content;
 notesEl.dataset.uploadedFile=f.name;
 notesEl.placeholder=f.name+' uploaded! Add extra notes or just click Make Flashcards.';
 // Show clean badge
 var old=document.getElementById('upload-badge-fcNotes');
 if(old)old.remove();
 var badge=document.createElement('div');
 badge.id='upload-badge-fcNotes';
 badge.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:10px;margin-bottom:6px;font-size:12px;font-weight:700;color:var(--ok)';
 badge.innerHTML='<span>'+f.name+' ('+(f.size/1024/1024).toFixed(1)+'MB) — ready to use</span>';
 notesEl.parentNode.insertBefore(badge,notesEl);
 showToast(f.name+' uploaded!','success');
 e.target.value='';};
document.getElementById('fcNotes').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';});
document.querySelectorAll('.fc-cnt-btn').forEach(function(btn){btn.onclick=function(){var n=parseInt(this.dataset.count);if(n>12&&!isPro){openProModal();return;}fcCount=n;document.querySelectorAll('.fc-cnt-btn').forEach(function(b){b.classList.remove('on');});this.classList.add('on');};});

document.getElementById('makeCardsBtn').onclick=async function(){
 var notesEl = document.getElementById('fcNotes');
 var text = notesEl.value.trim();
 if(!text && notesEl.dataset.uploadedContent) {
 text = notesEl.dataset.uploadedContent;
 }
 if(!text){showToast('Paste notes or upload a file first!','error');return;}


 if(!isPro&&qLeft<=0){openProModal();return;}
 var btn=this;btn.disabled=true;btn.textContent='Generating...';
 if(!isPro){qLeft--;updateBadge();}
 var sys='You are a flashcard generator. Create flashcards from the provided content. Return ONLY a raw JSON array, no markdown, no backticks. Format: [{"q":"question or term","a":"answer or definition","image":"wikipedia article name"}]. Create EXACTLY '+fcCount+' flashcards. Focus on high-yield facts. IMAGE RULES: Only set the "image" field when the card is about a CONCRETE VISUAL medical thing that has a clear textbook image — specific diseases (e.g. "Psoriasis"), anatomical structures (e.g. "Femur"), organs, cells, pathology, X-rays, or named drugs. Use the exact medical article name. For ABSTRACT topics (definitions, concepts, statistics, methods, lists, "types of", "tools of", "principles of", classifications, epidemiology concepts) set image to empty string "". When unsure, use empty string. A wrong or unrelated image is much worse than no image.';
 try{
 var res=await fetch(WU+'/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Create '+fcCount+' medical flashcards from:\n\n'+text.substring(0,3000), history:[], idToken:await firebase.auth().currentUser?.getIdToken()})});
 var data=await res.json();
 var raw=(data.reply||'[]').replace(/```json|```/g,'').trim();
 cards=JSON.parse(raw);cardIdx=0;
 totalCards++;document.getElementById('sc-cards').textContent=totalCards;
 renderCards();document.getElementById('quizCardsBtn').disabled=false;
 btn.textContent='Regenerate';updateXP(20);
 }catch(err){document.getElementById('fcBody').innerHTML='<div style="color:var(--red);text-align:center;padding:2rem;font-weight:700">Error: '+esc(err.message)+'</div>';btn.textContent='Make Flashcards';}
 btn.disabled=false;
};
document.getElementById('quizCardsBtn').onclick=function(){
 var notesEl2 = document.getElementById('fcNotes');
 var notes = notesEl2.value.trim() || notesEl2.dataset.uploadedContent || '';
 if(!notes && cards.length) {
 notes = cards.map(function(c,i){ return (i+1)+'. Q: '+c.q+' A: '+c.a; }).join('\n');
 }
 if(notes && document.getElementById('qgNotesInput')){
 document.getElementById('qgNotesInput').value = notes.substring(0,2000);
 document.getElementById('qgNotesWrap').style.display = 'block';
 var btn = document.getElementById('qgNotesToggleBtn');
 if(btn){btn.textContent='- Hide Notes';btn.style.background='rgba(239,68,68,.1)';btn.style.color='#EF4444';}
 }
 goPanel('quiz'); qgShowScreen('qg-home');
};
document.getElementById('resetCardsBtn').onclick=function(){cards=[];cardIdx=0;document.getElementById('fcNotes').value='';document.getElementById('fcBody').innerHTML='<div style="text-align:center;padding:3rem;color:var(--tx3)"><div style="font-size:48px;margin-bottom:1rem"></div><div style="font-size:14px;font-weight:700;color:var(--tx2)">Paste medical notes to generate flashcards</div></div>';document.getElementById('makeCardsBtn').textContent='Make Flashcards';document.getElementById('quizCardsBtn').disabled=true;};

async function fetchWikiImage(term) {
 if(!term) return null;
 try {
  // Bias search toward medical results to avoid random object matches
  var q = term + ' medicine anatomy';
  var searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(q) + '&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=500&format=json&origin=*';
  var res = await fetch(searchUrl);
  var data = await res.json();
  var pages = data.query && data.query.pages;
  if(pages) {
   var sorted = Object.values(pages).sort(function(a,b){ return (a.index||9) - (b.index||9); });
   for(var i = 0; i < sorted.length; i++) {
    if(sorted[i].thumbnail && sorted[i].thumbnail.source) return sorted[i].thumbnail.source;
   }
  }
  return null;
 } catch(e) { return null; }
}

function renderCards(){
 if(!cards.length)return;
 var b=document.getElementById('fcBody');b.innerHTML='';
 var w=document.createElement('div');w.style.cssText='display:flex;flex-direction:column;align-items:center;gap:1rem;max-width:500px;margin:0 auto';
 w.innerHTML='<div style="font-size:12px;color:var(--tx3);font-weight:700">'+cards.length+' flashcards — tap to flip!</div>'
 +'<div id="fcImgWrap" style="width:100%;max-height:180px;overflow:hidden;border-radius:14px;display:none"><img id="fcImg" src="" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:14px"></div>'
 +'<div class="fc-card" id="fcCard"><div class="fc-card-inner"><div class="fc-front"><div><p id="fcQ">'+esc(cards[0].q)+'</p><p style="font-size:11px;opacity:.6;margin-top:.5rem">Tap to flip </p></div></div><div class="fc-back"><div><p id="fcA">'+esc(cards[0].a)+'</p></div></div></div></div>'
 +'<div style="display:flex;align-items:center;gap:12px"><button class="fc-act-btn sec" id="fcPrev" disabled style="flex:0;padding:14px 24px;font-size:15px;min-width:90px;border-radius:14px">← Prev</button><span style="font-size:13px;font-weight:800;color:var(--tx3);min-width:60px;text-align:center" id="fcCount">1/'+cards.length+'</span><button class="fc-act-btn sec" id="fcNext" style="flex:0;padding:14px 24px;font-size:15px;min-width:90px;border-radius:14px">Next →</button></div>';
 b.appendChild(w);
 var fcCard=document.getElementById('fcCard');
 var fcPrev=document.getElementById('fcPrev');
 var fcNext=document.getElementById('fcNext');
 if(fcCard) fcCard.onclick=function(){this.classList.toggle('flip');};
 if(fcPrev) fcPrev.onclick=function(){moveCard(-1);};
 if(fcNext) fcNext.onclick=function(){moveCard(1);};
 if(fcPrev){fcPrev.addEventListener('touchend',function(e){e.preventDefault();moveCard(-1);});}
 if(fcNext){fcNext.addEventListener('touchend',function(e){e.preventDefault();moveCard(1);});}
 // load image for first card
 loadCardImage(0);
}

async function loadCardImage(idx) {
 var card = cards[idx];
 var imgWrap = document.getElementById('fcImgWrap');
 var img = document.getElementById('fcImg');
 if(!imgWrap || !img) return;
 var term = card && card.image;
 if(!term) { imgWrap.style.display='none'; return; }
 imgWrap.style.display='none';
 var src = await fetchWikiImage(term);
 if(src && document.getElementById('fcImg')) {
 img.src = src;
 img.alt = term;
 imgWrap.style.display='block';
 }
}

function moveCard(dir){
 document.getElementById('fcCard').classList.remove('flip');
 cardIdx=Math.max(0,Math.min(cards.length-1,cardIdx+dir));
 document.getElementById('fcQ').textContent=cards[cardIdx].q;
 document.getElementById('fcA').textContent=cards[cardIdx].a;
 document.getElementById('fcCount').textContent=(cardIdx+1)+'/'+cards.length;
 document.getElementById('fcPrev').disabled=cardIdx===0;
 document.getElementById('fcNext').disabled=cardIdx===cards.length-1;
 loadCardImage(cardIdx);
}

// CASE SOLVER
function setCaseType(type){
 caseType=type;
 ['Dx','Mgmt','Diff','Inv'].forEach(function(s){var el=document.getElementById('caseType'+s);if(el)el.classList.remove('on');});
 var map={diagnose:'Dx',management:'Mgmt',differentials:'Diff',investigations:'Inv'};
 var el=document.getElementById('caseType'+(map[type]||'Dx'));if(el)el.classList.add('on');
}

async function solveCase(){
 var caseText=document.getElementById('caseInput').value.trim();
 if(!caseText){alert('Please describe the patient case!');return;}
 if(!isPro&&qLeft<=0){openProModal();return;}
 var btn=document.getElementById('solveCaseBtn');btn.disabled=true;btn.textContent='Analysing case...';
 if(!isPro){qLeft--;updateBadge();}
 var sys='You are an expert clinical medicine AI tutor. Analyse the given clinical case focusing on: '+caseType+'. Give a thorough clinical answer with proper medical reasoning. Format your answer with clear labeled sections. Include clinical pearls and exam-relevant points.';
 try{
 var reply=await callWorker(sys,[{role:'user',content:'Clinical case (focus on '+caseType+'): '+caseText}]);
 var out=document.getElementById('caseOutput');
 out.style.display='block';out.innerHTML=fmtReply(reply);
 totalCases++;document.getElementById('sc-cases').textContent=totalCases;
 updateXP(15);
 }catch(err){document.getElementById('caseOutput').style.display='block';document.getElementById('caseOutput').innerHTML='<div style="color:var(--red);font-weight:700">Error: '+esc(err.message)+'</div>';}
 btn.disabled=false;btn.textContent='Solve Case';
}

// MNEMONICS
function qMnemonic(text){document.getElementById('mnemonicInput').value=text;genMnemonic();}

async function genMnemonic(){
 var topic=document.getElementById('mnemonicInput').value.trim();
 if(!topic){alert('Enter a drug, disease, or topic!');return;}
 if(!isPro&&qLeft<=0){openProModal();return;}
 var btn=document.getElementById('genMnemonicBtn');btn.disabled=true;btn.textContent='Generating...';
 if(!isPro){qLeft--;updateBadge();}
 var sys='You are a medical mnemonic expert. Create memorable mnemonics for medical students. For the given topic, create:\n1. A catchy mnemonic (acronym or phrase)\n2. What each letter/word stands for\n3. A quick way to remember it\n4. Any related high-yield facts\nMake it fun, memorable, and clinically relevant.';
 try{
 var reply=await callWorker(sys,[{role:'user',content:'Create a medical mnemonic for: '+topic}]);
 var out=document.getElementById('mnemonicOutput');
 out.style.display='block';out.innerHTML='<div style="font-size:14px;font-weight:700;color:var(--p-lite);margin-bottom:.8rem"> Mnemonic for: '+esc(topic)+'</div>'+fmtReply(reply);
 updateXP(5);
 }catch(err){document.getElementById('mnemonicOutput').style.display='block';document.getElementById('mnemonicOutput').innerHTML='<div style="color:var(--red);font-weight:700">Error: '+esc(err.message)+'</div>';}
 btn.disabled=false;btn.textContent='Generate Mnemonic';
}
document.getElementById('mnemonicInput').addEventListener('keydown',function(e){if(e.key==='Enter')genMnemonic();});

function fireConfetti(){var colors=['#2563EB','#06B6D4','#F59E0B','#10B981','#EF4444','#67E8F9'];for(var i=0;i<40;i++){var c=document.createElement('div');c.className='confetti-p';c.style.cssText='left:'+Math.random()*100+'vw;top:-10px;background:'+colors[Math.floor(Math.random()*colors.length)]+';animation-delay:'+Math.random()*1+'s;animation-duration:'+(2+Math.random()*2)+'s';document.body.appendChild(c);setTimeout(function(el){if(el.parentNode)el.parentNode.removeChild(el);},4000,c);}}

// ══════════════════════════════════
// STREAKS & XP LEVELS
// ══════════════════════════════════
var streak = 1;
var MED_LEVELS=[
 {name:'Medical Student',min:0,max:100},
 {name:'Junior Clerk',min:100,max:250},
 {name:'Senior Clerk',min:250,max:500},
 {name:'Resident',min:500,max:1000},
 {name:'Registrar',min:1000,max:2000},
 {name:'Consultant',min:2000,max:9999}
];

// Override updateXP with level system
var _baseUpdateXP = updateXP;
updateXP = function(amount) {
 _baseUpdateXP(amount);
 document.getElementById('streakCount').textContent = streak;
};

// ══════════════════════════════════
// ACHIEVEMENT SYSTEM
// ══════════════════════════════════
function showAchievement(icon, name) {
 document.getElementById('achIcon').textContent = icon;
 document.getElementById('achName').textContent = name;
 var p = document.getElementById('achPopup');
 p.style.display = 'block'; p.classList.add('show');
 fireConfetti();
 setTimeout(function(){ p.classList.remove('show'); setTimeout(function(){ p.style.display='none'; }, 400); }, 3000);
}

// ══════════════════════════════════
// PANEL NAVIGATION UPGRADE
// ══════════════════════════════════
// [merged into goPanel]
