var QG_SYSTEMS = {
 'Anatomy': ['Head & Neck','Upper Limb','Lower Limb','Thorax','Abdomen & Pelvis','Neuroanatomy','Back & Vertebral Column','Embryology'],
 'Physiology': ['Cardiovascular','Respiratory','Renal & Fluid','Neurophysiology','Endocrine','GI Physiology','Blood & Haematology','Muscle & Nerve','Reproductive'],
 'Biochemistry': ['Carbohydrate Metabolism','Lipid Metabolism','Protein & Amino Acids','Enzymes','Molecular Biology & Genetics','Vitamins & Minerals','Acid-Base Balance','Nutrition'],
 'Pharmacology': ['Autonomic Drugs','Cardiovascular Drugs','CNS Drugs','Antibiotics & Antimicrobials','Endocrine Drugs','GI Drugs','Respiratory Drugs','Analgesics & NSAIDs','Chemotherapy','Renal Drugs'],
 'Pathology': ['Cell Injury & Death','Inflammation','Neoplasia','Cardiovascular Pathology','Respiratory Pathology','GI Pathology','Renal Pathology','Neuropathology','Haematopathology','Endocrine Pathology'],
 'Microbiology': ['Bacteriology','Virology','Mycology','Parasitology','Immunology','Sterilisation & Disinfection','Hospital Infections'],
 'Medicine': ['Cardiology','Respiratory','Gastroenterology','Hepatology','Nephrology','Neurology','Endocrinology','Haematology','Rheumatology','Dermatology','Infectious Disease','Oncology','Geriatrics','Emergency Medicine'],
 'Surgery': ['General Surgery','Orthopaedics','Neurosurgery','Cardiothoracic Surgery','Vascular Surgery','Urology','Plastic Surgery','Paediatric Surgery','Surgical Oncology','Trauma'],
 'Paediatrics': ['Neonatology','Growth & Development','Nutrition & Malnutrition','Respiratory','Cardiovascular','GI & Hepatology','Neurology','Haematology','Infectious Disease','Endocrine','Renal','Immunology & Allergy','Developmental Disorders'],
 'Pediatrics': ['Neonatology','Growth & Development','Nutrition & Malnutrition','Respiratory','Cardiovascular','GI & Hepatology','Neurology','Haematology','Infectious Disease','Endocrine','Renal','Immunology & Allergy','Developmental Disorders'],
 'Obstetrics': ['Normal Pregnancy','Antenatal Care','Labour & Delivery','Postnatal Care','Antepartum Haemorrhage','Postpartum Haemorrhage','Hypertensive Disorders','Medical Disorders in Pregnancy','Obstetric Emergencies','Fetal Medicine'],
 'Gynaecology': ['Gynaecological History & Examination','Menstrual Disorders','Contraception','Subfertility','Early Pregnancy Disorders','Endometriosis','Uterine Tumours','Ovarian Tumours','Cervical Tumours','Vulva & Vagina','Urogynecology','Pelvic Organ Prolapse','Menopause'],
 'ENT': ['Ear Anatomy & Physiology','Otitis Media','Otitis Externa','Hearing Loss & Deafness','Vertigo & Balance Disorders','Nasal Anatomy & Physiology','Sinusitis','Epistaxis','Nasal Polyps','Throat & Tonsils','Larynx & Voice Disorders','Head & Neck Tumours','Stridor & Airway'],
 'Ophthalmology': ['Ocular Anatomy & Physiology','Red Eye','Conjunctivitis','Corneal Disorders','Glaucoma','Cataract','Retinal Disorders','Diabetic Eye Disease','Squint & Amblyopia','Eyelid Disorders','Optic Nerve Disorders','Ocular Trauma','Uveitis'],
 'Psychiatry': ['Mental State Examination','Schizophrenia','Bipolar Disorder','Depression','Anxiety Disorders','OCD','PTSD','Eating Disorders','Personality Disorders','Substance Abuse','Child Psychiatry','Dementia & Delirium','Psychopharmacology'],
 'Forensic Medicine': ['Cause of Death','Trauma & Wounds','Asphyxia','Sexual Offences','Toxicology','Medical Jurisprudence','Identification'],
 'Community Medicine': ['Epidemiology','Biostatistics','Disease Prevention','Nutrition & Public Health','Environmental Health','Maternal & Child Health','Health Management','Communicable Diseases','Non-Communicable Diseases'],
 'Mixed': []
};

// ══════════════════════════════════
// QUIZ GAME (Medical edition)
// ══════════════════════════════════
var qgSubj='Mixed', qgDiff='Easy';
var qgLives, qgHints, qgCurrentQ, qgQuestions, qgAnswered;
var qgScore, qgXP, qgStreak, qgBestStreak;
var QG_LETTERS=['A','B','C','D'];
var QG_TIMES={Easy:25,Normal:18,Hard:12};
var QG_XP={Easy:10,Normal:15,Hard:25};
var qgTimerVal, qgTimerInt;

function qgPickSubj(el){document.querySelectorAll('.qg-subj-card').forEach(function(c){c.classList.remove('on');});el.classList.add('on');qgSubj=el.dataset.subj;}
function qgPickDiff(el,d){document.querySelectorAll('.qg-diff-btn').forEach(function(b){b.classList.remove('on');});el.classList.add('on');qgDiff=d;}
function qgShowScreen(id){document.querySelectorAll('.qg-screen').forEach(function(s){s.classList.remove('on');});document.getElementById(id).classList.add('on');}
function qgGoHome(){qgShowScreen('qg-home');}
function qgToggleNotes(){var w=document.getElementById('qgNotesWrap'),btn=document.getElementById('qgNotesToggleBtn');if(w.style.display==='none'){w.style.display='block';btn.textContent='- Hide Notes';btn.style.background='rgba(239,68,68,.1)';btn.style.color='#EF4444';}else{w.style.display='none';btn.textContent='+ Add Notes';btn.style.background='rgba(37,99,235,.15)';btn.style.color='var(--p-lite)';}}
function qgClearNotes(){var inp=document.getElementById('qgNotesInput');if(inp)inp.value='';}

async function qgStart(){
 var btn=document.getElementById('qgStartBtn');
 if(btn){btn.disabled=true;btn.textContent='Generating...';}
 qgLives=isPro?999:3;qgHints=isPro?999:2;
 qgScore=0;qgXP=0;qgStreak=0;qgBestStreak=0;qgCurrentQ=0;qgAnswered=false;
 // Hide streak banner so it doesn't show leftover state
 var sb=document.getElementById('qgStreakBanner');if(sb)sb.classList.remove('show');
 qgRenderLives();
 document.getElementById('qgHintCount').textContent=isPro?'∞':qgHints;
 document.getElementById('qgLiveXP').textContent=0;
 if(btn){btn.disabled=false;btn.textContent='Start Quiz ';}
 var notes=document.getElementById('qgNotesInput');
 var userNotes=notes?(notes.value.trim()||notes.dataset.uploadedContent||''):'';
 var sys;
 if(userNotes){
 sys='You are a quiz generator. Create 10 questions ONLY based on these notes. Return ONLY a raw JSON array. Format: [{"q":"question","opts":["option text only","option text only","option text only","option text only"],"ans":2,"hint":"short hint","subj":"subject"}] where ans is the INDEX (0,1,2,3) of the correct option. Vary which index is correct across questions — do NOT always make index 0 or 1 correct. Difficulty: '+qgDiff+'. Notes: '+userNotes.substring(0,2000);
 } else {
 var _qgSubjectStr = qgSubj==='Mixed' ? 'mixed medical subjects' : qgSubj + (qgSystem ? ' — ' + qgSystem + ' ONLY, no other topics' : ' ONLY');
  var _qgYearStr = qgYear && qgYear!=='any' ? ' Level: ' + qgYear + ' undergraduate.' : '';
  sys='You are a strict medical MCQ generator. Generate questions ONLY from the specified subject and topic — no drift to other topics. Verify each question belongs to the domain before including it. Fewer correct on-topic questions is better than more off-topic ones. Each MCQ has one correct answer and three plausible wrong distractors. ACCURACY AND DOMAIN RELEVANCE ARE THE HIGHEST PRIORITY. CRITICAL: Never mention the diagnosis, condition name, or answer in the question stem. The question should describe symptoms, signs, investigations or pathophysiology WITHOUT naming the condition being asked about. Return ONLY a raw JSON array with exactly 10 questions. No markdown, no backticks. Format: [{"q":"question","opts":["option text only","option text only","option text only","option text only"],"ans":2,"hint":"short hint","subj":"subject"}] where ans is the INDEX (0,1,2,3) of the correct option. CRITICAL: Vary which index is correct — roughly equal mix of 0,1,2,3 across questions. SUBJECT: \'' + _qgSubjectStr + '\'. Difficulty: '+qgDiff+'.'+_qgYearStr+' USMLE/MBBS level.';
 }
 try{
 var res=await callWorker(sys,[{role:'user',content:'Generate 10 quiz questions.'}]);
 var raw=res.replace(/```json|```/g,'').trim();
 var parsed=JSON.parse(raw);
 if(!parsed||parsed.length<5)throw new Error('Not enough questions');
 // Normalise: if AI still returned letter ans (A/B/C/D) convert to index, then shuffle option positions
 qgQuestions=parsed.map(function(q){
 var opts=q.opts.slice();
 // detect letter-based ans
 var ansIdx;
 if(typeof q.ans==='string'&&['A','B','C','D'].indexOf(q.ans.toUpperCase())>-1){
 ansIdx=['A','B','C','D'].indexOf(q.ans.toUpperCase());
 } else {
 ansIdx=parseInt(q.ans)||0;
 }
 // strip A./B. prefixes the AI might have added
 opts=opts.map(function(o){return o.replace(/^[A-Da-d][.)]\s*/,'');});
 var correctText=opts[ansIdx];
 // Fisher-Yates shuffle
 for(var i=opts.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=opts[i];opts[i]=opts[j];opts[j]=tmp;}
 var newAnsIdx=opts.indexOf(correctText);
 return {q:q.q,opts:opts,ans:newAnsIdx,hint:q.hint||'',subj:q.subj||qgSubj,exp:q.exp||''};
 });
 }catch(e){qgQuestions=qgMedFallback();}
 document.getElementById('qgQTotal').textContent=qgQuestions.length;
 qgShowScreen('qg-quiz');qgLoadQ();
}

function qgMedFallback(){
 return[
 {q:"What is the most common cause of mitral stenosis?",opts:["Congenital","Rheumatic fever","Infective endocarditis","SLE"],ans:1,hint:"Think post-strep complication",subj:"Clinical Medicine"},
 {q:"Which nerve is injured in Saturday night palsy?",opts:["Ulnar nerve","Median nerve","Radial nerve","Axillary nerve"],ans:2,hint:"Wrist drop is the classic presentation",subj:"Anatomy"},
 {q:"Mechanism of action of beta blockers?",opts:["Block alpha receptors","Block beta adrenergic receptors","Block calcium channels","Inhibit ACE"],ans:1,hint:"They end in -olol",subj:"Pharmacology"},
 {q:"Which cells produce insulin?",opts:["Alpha cells","Beta cells","Delta cells","PP cells"],ans:1,hint:"B for both beta and blood sugar",subj:"Physiology"},
 {q:"Classic triad of meningitis includes:",opts:["Fever, rash, headache","Fever, neck stiffness, photophobia","Headache, vomiting, diplopia","Fever, confusion, seizures"],ans:1,hint:"Kernig and Brudzinski signs",subj:"Clinical Medicine"},
 {q:"First line treatment for hypertension in diabetics?",opts:["Beta blockers","Calcium channel blockers","ACE inhibitors","Thiazide diuretics"],ans:2,hint:"Protective for diabetic nephropathy",subj:"Pharmacology"},
 {q:"Where does the femoral nerve originate?",opts:["L1-L3","L2-L4","L3-L5","L4-S1"],ans:1,hint:"From the lumbar plexus",subj:"Anatomy"},
 {q:"Which enzyme is more specific for acute pancreatitis?",opts:["Amylase","Lipase","ALT","Alkaline phosphatase"],ans:1,hint:"Lipase stays elevated longer",subj:"Clinical Medicine"},
 {q:"What is the normal eGFR?",opts:["Over 45","Over 60","Over 90","Over 120"],ans:2,hint:"Below 60 suggests CKD",subj:"Physiology"},
 {q:"First line antibiotic for community acquired pneumonia?",opts:["Vancomycin","Amoxicillin","Ciprofloxacin","Metronidazole"],ans:1,hint:"Covers Strep pneumoniae",subj:"Pharmacology"}
 ];
}

function qgLoadQ(){if(qgCurrentQ>=qgQuestions.length){qgEndGame();return;}var q=qgQuestions[qgCurrentQ];qgAnswered=false;document.getElementById('qgQNum').textContent=qgCurrentQ+1;document.getElementById('qgProgressFill').style.width=((qgCurrentQ/qgQuestions.length)*100)+'%';document.getElementById('qgBadge').textContent=q.subj||qgSubj;document.getElementById('qgQText').textContent=q.q;document.getElementById('qgHintBox').classList.remove('on');document.getElementById('qgNextBtn').classList.remove('on');var opts=document.getElementById('qgOpts');opts.innerHTML='';q.opts.forEach(function(opt,i){var btn=document.createElement('button');btn.className='qg-opt';btn.innerHTML='<span class="qg-opt-letter">'+QG_LETTERS[i]+'</span>'+esc(opt);btn.dataset.idx=i;btn.onclick=function(){qgSelect(i,btn);};opts.appendChild(btn);});qgStartTimer();}
function qgStartTimer(){clearInterval(qgTimerInt);qgTimerVal=QG_TIMES[qgDiff]||20;qgUpdateTimer();qgTimerInt=setInterval(function(){qgTimerVal--;qgUpdateTimer();if(qgTimerVal<=0){clearInterval(qgTimerInt);qgTimeUp();}},1000);}
function qgUpdateTimer(){var total=QG_TIMES[qgDiff]||20,pct=qgTimerVal/total,circ=175.9;var el=document.getElementById('qgTimerCircle'),txt=document.getElementById('qgTimerText');if(el)el.style.strokeDashoffset=circ*(1-pct);if(txt){txt.textContent=qgTimerVal;if(qgTimerVal<=5){txt.classList.add('urgent');if(el)el.style.stroke='#EF4444';}else{txt.classList.remove('urgent');if(el)el.style.stroke='#2563EB';}}}
function qgTimeUp(){if(qgAnswered)return;qgAnswered=true;qgLoseLife();var ansIdx=qgQuestions[qgCurrentQ].ans;document.querySelectorAll('.qg-opt').forEach(function(b,i){b.disabled=true;if(i===ansIdx)b.classList.add('cor');});qgFeedbackShow('');qgStreak=0;document.getElementById('qgNextBtn').classList.add('on');}
function qgSelect(idx,btn){if(qgAnswered)return;qgAnswered=true;clearInterval(qgTimerInt);var q=qgQuestions[qgCurrentQ],ansIdx=q.ans,ok=idx===ansIdx;document.querySelectorAll('.qg-opt').forEach(function(b,i){b.disabled=true;if(i===ansIdx)b.classList.add('cor');else if(i===idx&&!ok)b.classList.add('wrg');});
 if(!ok && typeof addMistake === 'function') {
 addMistake('mcq', q.q, (q.opts[idx]||'').replace(/^[A-D]\.\s*/,''), (q.opts[ansIdx]||'').replace(/^[A-D]\.\s*/,''), q.exp||'');
 }if(ok){qgScore++;qgStreak++;if(qgStreak>qgBestStreak)qgBestStreak=qgStreak;var base=QG_XP[qgDiff]||10,tb=Math.floor(qgTimerVal/((QG_TIMES[qgDiff]||20)/5)),earned=base+tb;if(qgStreak===3){earned+=15;qgShowStreakBanner(' 3 in a row! +15 XP');}else if(qgStreak===5){earned+=30;qgShowStreakBanner(' 5 streak! +30 XP');}qgXP+=earned;document.getElementById('qgLiveXP').textContent=qgXP;updateXP(earned);qgFeedbackShow('');}else{qgStreak=0;qgLoseLife();qgFeedbackShow('');}document.getElementById('qgNextBtn').classList.add('on');}
function qgUseHint(){if(!isPro&&qgHints<=0||qgAnswered)return;if(!isPro){qgHints--;document.getElementById('qgHintCount').textContent=qgHints;if(qgHints<=0)document.getElementById('qgHintBtn').disabled=true;}var q=qgQuestions[qgCurrentQ];document.getElementById('qgHintText').textContent=q.hint||'Think carefully!';document.getElementById('qgHintBox').classList.add('on');}
function qgLoseLife(){if(isPro)return;qgLives--;qgRenderLives();if(qgLives<=0)setTimeout(qgEndGame,1200);}
function qgRenderLives(){var row=document.getElementById('qgLivesRow');row.innerHTML='';if(isPro){row.innerHTML='<div style="font-size:12px;font-weight:800;color:#EF4444;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);padding:3px 10px;border-radius:20px"> ∞</div>';return;}for(var i=0;i<3;i++){var h=document.createElement('div');h.className='qg-heart'+(i>=qgLives?' lost':'');h.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>';row.appendChild(h);}}
function qgNextQ(){qgCurrentQ++;if(qgLives<=0||qgCurrentQ>=qgQuestions.length){qgEndGame();}else{qgLoadQ();}}
function qgEndGame(){clearInterval(qgTimerInt);var total=qgQuestions.length,pct=Math.round((qgScore/total)*100);if(qgScore===total){var bonus=isPro?100:(qgDiff==='Hard'?50:35);qgXP+=bonus;document.getElementById('qgPerfectBanner').textContent='PERFECT! +'+bonus+' XP';document.getElementById('qgPerfectBanner').classList.add('show');fireConfetti();setTimeout(function(){document.getElementById('qgPerfectBanner').classList.remove('show');},2500);}updateXP(qgXP);libSave('quiz','Medical Quiz ('+qgSubj+' '+qgDiff+') — '+qgScore+'/'+total,qgQuestions.map(function(q,i){return (i+1)+'. '+q.q+'\nAnswer: '+q.ans;}).join('\n\n'));document.getElementById('qgRScore').textContent=qgScore+'/'+total;document.getElementById('qgRXP').textContent=qgXP;document.getElementById('qgRStreak').textContent=qgBestStreak;var icon,color,title,sub;if(qgScore===total){icon='trophy';color='var(--gold)';title='PERFECT!';sub='Outstanding! Full marks!';}else if(pct>=80){icon='award';color='var(--p)';title='Excellent!';sub='Great medical knowledge!';}else if(pct>=60){icon='thumbs-up';color='var(--ok)';title='Good job!';sub='Keep studying!';}else{icon='refresh-cw';color='var(--tx2)';title='Keep going!';sub='Review and try again!';}var qgEmojiEl=document.getElementById('qgResultEmoji');qgEmojiEl.innerHTML='<i data-lucide="'+icon+'" style="width:48px;height:48px;color:'+color+'"></i>';if(typeof lucide!=='undefined')lucide.createIcons();document.getElementById('qgResultTitle').textContent=title;document.getElementById('qgResultSub').textContent=sub;setTimeout(function(){qgShowScreen('qg-result');},800);}
function qgFeedbackShow(emoji){var f=document.getElementById('qgFeedback');if(!f)return;document.getElementById('qgFeedbackEmoji').textContent=emoji;f.style.display='flex';f.style.opacity='1';setTimeout(function(){f.style.opacity='0';setTimeout(function(){f.style.display='none';},150);},600);}
function qgShowStreakBanner(txt){var b=document.getElementById('qgStreakBanner');b.textContent=txt;b.classList.add('show');setTimeout(function(){b.classList.remove('show');},2500);}

// ══════════════════════════════════
// LECTURE SUMMARISER
// ══════════════════════════════════
var lecCurrentTab='record', lecRecording=false, lecRecTimer=null, lecRecSeconds=0, lecWaveInterval=null, lecSummaryText='';

async function lecHandleUpload(e) {
 var file = e.target.files[0];
 if(!file) return;
 e.target.value = '';
 var ext = file.name.split('.').pop().toLowerCase();
 var nameEl = document.getElementById('lecFileName');
 if(nameEl) { nameEl.textContent = '' + file.name; nameEl.style.display = 'block'; }
 showToast('Reading ' + file.name + '...', 'info', 6000);

 try {
 var content = '';
 window._lecImageData = null;

 // ── AUDIO ──
 if(['mp3','wav','m4a','ogg','webm'].includes(ext)) {
 window._lecAudioFile = file;
 if(nameEl) { nameEl.textContent = '' + file.name; nameEl.style.display = 'block'; }
 showToast('Audio loaded! Click Summarise to transcribe + summarise.', 'success', 4000);
 return; // summariseLecture will handle transcription
 }

 // ── IMAGES ──
 if(['png','jpg','jpeg','gif','webp'].includes(ext)) {
 var imgData = await readFileAsBase64(file);
 window._lecImageData = imgData;
 content = 'Please extract ALL text from this image and summarise the medical content comprehensively.';
 showToast('Image ready!', 'success');

 // ── TEXT / CSV ──
 } else if(['txt','csv'].includes(ext)) {
 content = await file.text();
 showToast('Text file loaded!', 'success');

 // ── PDF ──
 } else if(ext === 'pdf') {
 content = await extractPDFText(file);
 if(!content || content.length < 50) {
 // Scanned PDF - render to image
 showToast('Scanned PDF - using vision...', 'info', 4000);
 var pdfImg = await pdfToImage(file);
 if(pdfImg) {
 window._lecImageData = pdfImg;
 content = 'Please extract ALL text from this PDF page image and provide a comprehensive medical summary.';
 showToast('PDF loaded as image!', 'success');
 } else {
 showToast('Could not read this PDF. Please copy-paste the text.', 'error');
 return;
 }
 } else {
 showToast('PDF text extracted!', 'success');
 }

 // ── WORD ──
 } else if(['doc','docx'].includes(ext)) {
 if(typeof mammoth !== 'undefined') {
 var ab = await file.arrayBuffer();
 var res = await mammoth.extractRawText({arrayBuffer:ab});
 content = res.value || '';
 if(content.length > 50) {
 showToast('Word document loaded!', 'success');
 } else {
 showToast('Could not read Word file', 'error'); return;
 }
 } else {
 showToast('Word reader not loaded yet, try again', 'error'); return;
 }

 // ── PPTX ──
 } else if(['ppt','pptx'].includes(ext)) {
 if(typeof JSZip !== 'undefined') {
 showToast('Extracting slides...', 'info', 5000);
 content = await extractPPTXText(file);
 if(content && content.length > 50) {
 showToast('Slides extracted!', 'success');
 } else {
 // Try images from PPTX
 showToast('Reading slide images...', 'info', 4000);
 var pptImg = await extractPPTXFirstImage(file);
 if(pptImg) {
 window._lecImageData = pptImg;
 content = 'Please read ALL text from these PowerPoint slides and summarise the medical content.';
 showToast('PPTX loaded as image!', 'success');
 } else {
 showToast('Could not read PPTX. Try exporting as PDF.', 'error'); return;
 }
 }
 } else {
 showToast('JSZip still loading, try again in 2 seconds', 'error'); return;
 }

 } else {
 showToast('Unsupported file type: .' + ext, 'error'); return;
 }

 if(!content || !content.trim()) {
 showToast('No content found in file', 'error'); return;
 }

 // Put content in text area
 var ta = document.getElementById('lecTextInput');
 if(ta) ta.value = content.substring(0, 8000);
 lecSwitchTab('text');
 showToast('Ready! Click Summarise.', 'success');

 } catch(err) {
 showToast('Error: ' + err.message, 'error');
 console.error('File upload error:', err);
 }
}

// ── Helper: read file as base64 ──
function readFileAsBase64(file) {
 return new Promise(function(resolve, reject) {
 var r = new FileReader();
 r.onload = function(e) { resolve(e.target.result); };
 r.onerror = reject;
 r.readAsDataURL(file);
 });
}

// ── Helper: extract text from PDF ──
async function extractPDFText(file) {
 if(typeof pdfjsLib === 'undefined') {
 // Try loading it
 await new Promise(function(res) {
 var s = document.createElement('script');
 s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
 s.onload = res; s.onerror = res;
 document.head.appendChild(s);
 });
 }
 if(typeof pdfjsLib === 'undefined') return '';
 try {
 pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 var ab = await file.arrayBuffer();
 var pdf = await pdfjsLib.getDocument({data: ab}).promise;
 var text = '';
 for(var i = 1; i <= Math.min(pdf.numPages, 20); i++) {
 var page = await pdf.getPage(i);
 var ct = await page.getTextContent();
 text += ct.items.map(function(item) { return item.str; }).join(' ') + '\n';
 }
 // Check if readable
 var clean = text.trim();
 var letters = (clean.match(/[a-zA-Z]/g)||[]).length;
 if(letters / Math.max(clean.length,1) < 0.2) return ''; // binary/garbage
 return clean;
 } catch(e) { return ''; }
}

// ── Helper: render PDF page 1 as image ──
async function pdfToImage(file) {
 if(typeof pdfjsLib === 'undefined') return null;
 try {
 pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 var ab = await file.arrayBuffer();
 var pdf = await pdfjsLib.getDocument({data:ab}).promise;
 var page = await pdf.getPage(1);
 var viewport = page.getViewport({scale:2.0});
 var canvas = document.createElement('canvas');
 canvas.width = viewport.width; canvas.height = viewport.height;
 await page.render({canvasContext:canvas.getContext('2d'), viewport:viewport}).promise;
 return canvas.toDataURL('image/jpeg', 0.85);
 } catch(e) { return null; }
}

// ── Helper: extract text from PPTX ──
async function extractPPTXText(file) {
 try {
 var ab = await file.arrayBuffer();
 var zip = await JSZip.loadAsync(ab);
 var slides = Object.keys(zip.files)
 .filter(function(f){ return /^ppt\/slides\/slide[0-9]+\.xml$/.test(f); })
 .sort(function(a,b){ return parseInt(a.match(/[0-9]+/)[0]) - parseInt(b.match(/[0-9]+/)[0]); });
 var result = [];
 for(var i=0; i<slides.length; i++) {
 var xml = await zip.files[slides[i]].async('string');
 var texts = [];
 var re = /<a:t[\s\S]*?>(.*?)<\/a:t>/g, m;
 while((m = re.exec(xml)) !== null) {
 var t = m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#13;/g,' ').trim();
 if(t) texts.push(t);
 }
 if(texts.length) result.push('Slide ' + (i+1) + ':\n' + texts.join(' '));
 }
 return result.join('\n\n');
 } catch(e) { return ''; }
}

// ── Helper: extract first image from PPTX ──
async function extractPPTXFirstImage(file) {
 try {
 var ab = await file.arrayBuffer();
 var zip = await JSZip.loadAsync(ab);
 var imgs = Object.keys(zip.files).filter(function(f){ return /^ppt\/media\/.+\.(png|jpg|jpeg)$/i.test(f); });
 if(!imgs.length) return null;
 var data = await zip.files[imgs[0]].async('base64');
 var mime = imgs[0].endsWith('.png') ? 'image/png' : 'image/jpeg';
 return 'data:' + mime + ';base64,' + data;
 } catch(e) { return null; }
}


function lecSwitchTab(tab){
 lecCurrentTab=tab;
 document.querySelectorAll('.lec-tab-btn').forEach(function(b){b.classList.remove('on');});
 var activeBtn = document.querySelector('.lec-tab-btn[onclick*="'+tab+'"]');
 if(activeBtn) activeBtn.classList.add('on');
 // Hide all areas
 ['lecRecordArea','lecTextArea','lecAudioArea'].forEach(function(id){
 var el = document.getElementById(id);
 if(el) el.style.display='none';
 });
 // Show correct area
 if(tab==='record' && document.getElementById('lecRecordArea')) document.getElementById('lecRecordArea').style.display='block';
 if(tab==='text' && document.getElementById('lecTextArea')) document.getElementById('lecTextArea').style.display='block';
 if(tab==='audio' && document.getElementById('lecAudioArea')) document.getElementById('lecAudioArea').style.display='block';
 if(tab==='upload' && document.getElementById('lecUploadArea')) document.getElementById('lecUploadArea').style.display='block';
}

function toggleRecording(){
 var btn=document.getElementById('recBtn');
 var status=document.getElementById('recStatus');
 var timer=document.getElementById('recTimer');

 if(!lecRecording){
 var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
 if(SpeechRecognition){
 lecSpeechRecognition = new SpeechRecognition();
 lecSpeechRecognition.continuous = true;
 lecSpeechRecognition.interimResults = true;
 var recLang = window._lecRecordLang || 'en-US';
 lecSpeechRecognition.lang = recLang;
 lecTranscriptFinal = '';
 lecSpeechRecognition.onstart = function(){
 lecRecording=true;
 btn.classList.add('recording');btn.innerHTML='<i data-lucide="square" style="width:24px;height:24px;color:#fff"></i>';if(typeof lucide!=='undefined')lucide.createIcons();
 status.textContent='Listening... speak clearly';status.style.color='var(--red)';
 timer.classList.add('on');lecRecSeconds=0;
 lecRecTimer=setInterval(function(){lecRecSeconds++;var m=Math.floor(lecRecSeconds/60),s=lecRecSeconds%60;timer.textContent=m+':'+(s<10?'0':'')+s;},1000);
 lecWaveInterval=setInterval(function(){document.querySelectorAll('.rec-bar').forEach(function(bar){bar.style.height=(Math.random()*30+5)+'px';});},100);
 };
 lecSpeechRecognition.onresult = function(event){
 var interim='';
 for(var i=event.resultIndex;i<event.results.length;i++){
 if(event.results[i].isFinal)lecTranscriptFinal+=event.results[i][0].transcript+' ';
 else interim+=event.results[i][0].transcript;
 }
 var ti=document.getElementById('lecTextInput');
 if(ti)ti.value=lecTranscriptFinal+interim;
 };
 lecSpeechRecognition.onerror = function(e){
 if(e.error==='not-allowed'){status.textContent='Mic denied — allow microphone in browser settings';status.style.color='var(--red)';}
 else{status.textContent='Error: '+e.error;status.style.color='var(--red)';}
 stopLecRecording(btn,status,timer);
 };
 lecSpeechRecognition.onend = function(){ if(lecRecording)stopLecRecording(btn,status,timer); };
 lecSpeechRecognition.start();
 } else {
 navigator.mediaDevices.getUserMedia({audio:true})
 .then(function(stream){
 lecRecording=true;btn.classList.add('recording');btn.innerHTML='<i data-lucide="square" style="width:24px;height:24px;color:#fff"></i>';if(typeof lucide!=='undefined')lucide.createIcons();
 status.textContent='Recording... (paste transcript manually after)';status.style.color='var(--red)';
 timer.classList.add('on');lecRecSeconds=0;
 lecRecTimer=setInterval(function(){lecRecSeconds++;var m=Math.floor(lecRecSeconds/60),s=lecRecSeconds%60;timer.textContent=m+':'+(s<10?'0':'')+s;},1000);
 lecWaveInterval=setInterval(function(){document.querySelectorAll('.rec-bar').forEach(function(bar){bar.style.height=(Math.random()*30+5)+'px';});},100);
 lecMediaRecorder=new MediaRecorder(stream);lecAudioChunks=[];
 lecMediaRecorder.ondataavailable=function(e){lecAudioChunks.push(e.data);};
 lecMediaRecorder.onstop=function(){stream.getTracks().forEach(function(t){t.stop();});lecSwitchTab('text');};
 lecMediaRecorder.start();
 })
 .catch(function(){status.textContent='Mic access denied — paste text instead';status.style.color='var(--red)';lecSwitchTab('text');});
 }
 } else {
 if(typeof lecSpeechRecognition!=='undefined'&&lecSpeechRecognition){try{lecSpeechRecognition.stop();}catch(e){}}
 if(typeof lecMediaRecorder!=='undefined'&&lecMediaRecorder&&lecMediaRecorder.state!=='inactive'){lecMediaRecorder.stop();}
 stopLecRecording(btn,status,timer);
 if(typeof lecTranscriptFinal!=='undefined'&&lecTranscriptFinal.trim()){
 lecSwitchTab('text');
 document.getElementById('lecTextInput').value=lecTranscriptFinal.trim();
 status.textContent='Transcript ready! Click Summarise.';status.style.color='var(--ok)';
 showNotif('Transcript captured! ');
 }
 }
}

function stopLecRecording(btn,status,timer){
 lecRecording=false;clearInterval(lecRecTimer);clearInterval(lecWaveInterval);
 btn.classList.remove('recording');btn.innerHTML='<i data-lucide="mic" style="width:28px;height:28px;color:#fff"></i>';if(typeof lucide!=='undefined')lucide.createIcons();timer.classList.remove('on');
 document.querySelectorAll('.rec-bar').forEach(function(bar){bar.style.height='8px';});
}

var lecSpeechRecognition=null,lecTranscriptFinal='',lecMediaRecorder=null,lecAudioChunks=[];


function renderLecSummary(raw){
 var sections = {
 'QUICK SUMMARY:':{label:'Quick Summary',cls:'purple'},
 'KEY POINTS:':{label:'Key Points',cls:'green'},
 'IMPORTANT TERMS:':{label:'Important Terms',cls:'gold'},
 'WHAT TO REMEMBER:':{label:'What to Remember',cls:'red'},
 'CLINICAL PEARLS:':{label:'Clinical Pearls',cls:'green'},
 'REVISION QUESTIONS:':{label:'Revision Questions',cls:'purple'}
 };
 var html = '', curSec = null, curLines = [];

 function flushSec() {
 if(!curSec || !curLines.length) return;
 var info = sections[curSec] || {label:curSec, cls:'purple'};
 html += '<div class="lec-section">';
 html += '<span class="lec-section-title ' + info.cls + '">' + esc(info.label) + '</span>';
 html += '<div class="lec-content">' + fmtReply(curLines.join('\n')) + '</div>';
 html += '</div>';
 curLines = [];
 }

 var lines = raw.split('\n');
 lines.forEach(function(line) {
 var t = line.trim();
 var secKey = Object.keys(sections).find(function(k){ return t.toUpperCase().startsWith(k); });
 if(secKey) {
 flushSec();
 curSec = secKey;
 } else if(curSec && t) {
 curLines.push(line);
 } else if(!curSec && t) {
 // Content before first section - render as intro
 html += '<div style="margin-bottom:.8rem;font-size:14px;color:var(--tx2);line-height:1.7">' + fmtReply(t) + '</div>';
 }
 });
 flushSec();

 var el = document.getElementById('lecSummaryContent');
 if(el) el.innerHTML = html || '<div style="color:var(--tx2);font-size:14px">' + fmtReply(raw) + '</div>';
}

function lecCopyAll(){navigator.clipboard.writeText(stripMarkdown(lecSummaryText)).catch(function(){});var btn=document.getElementById('lecCopyBtn');btn.textContent='Copied!';setTimeout(function(b){b.textContent='Copy All';}.bind(null,btn),2000);}
function lecToFlashcards(){if(!lecSummaryText)return;document.getElementById('fcNotes').value=lecSummaryText.substring(0,4000);goPanel('flash');}
function lecToQuiz(){if(!lecSummaryText)return;var inp=document.getElementById('qgNotesInput');if(inp){inp.value=lecSummaryText.substring(0,2000);document.getElementById('qgNotesWrap').style.display='block';}goPanel('quiz');}
function saveLecToLib(){libSave('lecture','Lecture — '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),lecSummaryText);var btn=event.target;btn.textContent='Saved!';setTimeout(function(b){b.textContent='Save';}.bind(null,btn),2000);}
function lecReset(){document.getElementById('lecTextInput').value='';document.getElementById('lecOutput').classList.remove('on');document.getElementById('lecSummaryContent').innerHTML='';lecSummaryText='';lecSwitchTab('record');}

// ══════════════════════════════════
// LESSON MODE
// ══════════════════════════════════
var lesStyle='Simple', lesSteps=[], lesCurrentStep=0, lesSummaryText='';
document.querySelectorAll('.les-style-btn').forEach(function(btn){btn.onclick=function(){document.querySelectorAll('.les-style-btn').forEach(function(b){b.classList.remove('on');});this.classList.add('on');lesStyle=this.dataset.style;};});

async function startLesson(){
 var notes=document.getElementById('lesNotesInput').value.trim();
 if(!notes){alert('Please enter a topic or paste your notes!');return;}
 var btn=document.getElementById('lesStartBtn');btn.disabled=true;
 document.getElementById('lesLoading').classList.add('on');document.getElementById('lesStepsWrap').classList.remove('on');document.getElementById('lesComplete').classList.remove('on');document.getElementById('lesStepsList').innerHTML='';
 var styleGuide={Simple:'Use simple language and short sentences.',Detailed:'Be thorough and detailed with clinical examples.',Exam:'Focus on exam-relevant content, mnemonics, and what examiners want.',Clinical:'Focus on clinical application, patient management, and clinical pearls.'}[lesStyle]||'';
 var sys='You are an expert medical tutor. Teach the given medical topic in clear structured steps. Style: '+lesStyle+'. '+styleGuide+' Return ONLY a raw JSON array. Format: [{"step":"Step title","content":"explanation","tip":"clinical pearl or tip"}]. Create 5-7 clear teaching steps.';
 try{
 var reply=await callWorker(sys,[{role:'user',content:'Teach me this in steps: '+notes.substring(0,2000)}]);
 var raw=reply.replace(/```json|```/g,'').trim();
 lesSteps=JSON.parse(raw);lesCurrentStep=0;
 lesSummaryText=lesSteps.map(function(s,i){return 'Step '+(i+1)+': '+s.step+'\n'+s.content+(s.tip?'\nPearl: '+s.tip:'');}).join('\n\n');
 document.getElementById('lesLoading').classList.remove('on');document.getElementById('lesStepsWrap').classList.add('on');
 renderLessonSteps();updateXP(5);
 }catch(err){document.getElementById('lesLoading').classList.remove('on');alert('Error: '+err.message);}
 btn.disabled=false;
}
function renderLessonSteps(){var list=document.getElementById('lesStepsList');list.innerHTML='';lesSteps.forEach(function(step,i){var card=document.createElement('div');card.className='les-step-card';card.id='les-step-'+i;card.innerHTML='<div class="les-step-header"><div class="les-step-num">'+(i+1)+'</div><div class="les-step-title">'+esc(step.step)+'</div></div><div class="les-step-body">'+esc(step.content)+'</div>'+(step.tip?'<div style="margin-top:.8rem;padding:.6rem 1rem;background:rgba(37,99,235,.1);border-radius:8px;border-left:3px solid var(--p);font-size:12px;color:var(--p-lite);font-weight:700"> Clinical Pearl: '+esc(step.tip)+'</div>':'')+(i<lesSteps.length-1?'<button class="les-next-btn" onclick="lesNextStep('+i+')">Next Step →</button>':'<button class="les-next-btn" onclick="lesFinish()">Complete Lesson </button>');list.appendChild(card);if(i===0)setTimeout(function(){card.classList.add('visible');updateLesProgress(0);},100);});}
function lesNextStep(i){var nextCard=document.getElementById('les-step-'+(i+1));if(nextCard){setTimeout(function(){nextCard.classList.add('visible');nextCard.scrollIntoView({behavior:'smooth',block:'start'});updateLesProgress(i+1);},100);}}
function updateLesProgress(step){lesCurrentStep=step;var pct=Math.round(((step+1)/lesSteps.length)*100);document.getElementById('lesProgressFill').style.width=pct+'%';document.getElementById('lesStepLabel').textContent='Step '+(step+1)+' of '+lesSteps.length;document.getElementById('lesStepPct').textContent=pct+'%';updateXP(5);}
function lesFinish(){document.getElementById('lesProgressFill').style.width='100%';document.getElementById('lesComplete').classList.add('on');document.getElementById('lesComplete').scrollIntoView({behavior:'smooth'});updateXP(30);libSave('lesson','Lesson — '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),lesSummaryText);fireConfetti();}
function lesReset(){lesSteps=[];lesCurrentStep=0;lesSummaryText='';document.getElementById('lesNotesInput').value='';document.getElementById('lesStepsWrap').classList.remove('on');document.getElementById('lesComplete').classList.remove('on');document.getElementById('lesStepsList').innerHTML='';document.getElementById('lesProgressFill').style.width='0%';}





async function epStart() {
 var btn = document.getElementById('epStartBtn');
 btn.disabled = true; btn.textContent = 'Generating questions...';
 epCorrect = 0; epWrong = 0; epSkipped = 0; epCurrentQ = 0; epTotalXP = 0; window._epXPGiven = false;
 epSelected = null; epAnswered = false;

 var _epSubjStr = epSubj + (typeof epSystem!=='undefined' && epSystem ? ' — ' + epSystem + ' ONLY, no other topics' : ' ONLY — do not include questions from any other subject or topic');
  var _epYearStr = typeof epYear!=='undefined' && epYear && epYear!=='any' ? ' Level: ' + epYear + ' undergraduate.' : '';
  var sys = 'You are a strict medical MCQ generator. Generate questions ONLY from the specified subject and topic — no drift to other topics. Verify each question belongs to the domain before including it. Fewer correct on-topic questions is better than more off-topic ones. Each MCQ has one correct answer and three plausible wrong distractors. ACCURACY AND DOMAIN RELEVANCE ARE THE HIGHEST PRIORITY. CRITICAL: Never mention the diagnosis, condition name, or answer in the question stem. The question should describe symptoms, signs, investigations or pathophysiology WITHOUT naming the condition being asked about. Generate EXACTLY ' + epQCount + ' MCQ questions for ' + epExam + ' exam. Return ONLY a raw JSON array with exactly ' + epQCount + ' items. Format: [{"q":"question stem","opts":["A. option","B. option","C. option","D. option"],"ans":"A","exp":"explanation why A is correct","why_wrong":"B is wrong because... C is wrong because... D is wrong because...","subj":"subject","diff":"' + epDiff + '"}]. SUBJECT: \'' + _epSubjStr + '\'. Difficulty: ' + epDiff + '.' + _epYearStr + ' Make questions ' + (epMode==='highyield'?'high-yield exam-style':'exam-realistic') + '. No markdown, no backticks.';

 try {
 var reply = await callWorker(sys, [{role:'user', content:'Generate ' + epQCount + ' ' + epExam + ' MCQ questions on ' + epSubj + '. Return EXACTLY ' + epQCount + ' items in the JSON array.'}]);
 var raw = reply.replace(/```json|```/g,'').trim();
 epQuestions = JSON.parse(raw);
 if(!epQuestions || epQuestions.length < 3) throw new Error('Not enough questions');
 if(epQuestions.length > epQCount) epQuestions = epQuestions.slice(0, epQCount);
 } catch(e) {
 epQuestions = epFallbackQs();
 }

 btn.disabled = false; btn.textContent = 'Start MCQs ';
 document.getElementById('epSetup').style.display = 'none';
 document.getElementById('epResults').classList.remove('on');
 document.getElementById('epQuestion').style.display = 'block';

 if(epMode === 'timed') {
 document.getElementById('epTimer').style.display = 'block';
 epTimerSecs = epQCount * 90;
 epRunTimer();
 } else {
 document.getElementById('epTimer').style.display = 'none';
 }
 epLoadQ();
}

function epFallbackQs() {
 return [
 {q:"A 45-year-old male presents with crushing chest pain radiating to left arm with diaphoresis. ECG shows ST elevation in leads II, III, aVF. What is the most likely diagnosis?", opts:["A. Anterior STEMI","B. Inferior STEMI","C. NSTEMI","D. Unstable Angina"], ans:"B", exp:"ST elevation in II, III, aVF indicates inferior STEMI, supplied by RCA.", why_wrong:"A. Anterior STEMI shows changes in V1-V4. C. NSTEMI has no ST elevation. D. Unstable angina has no ST changes.", subj:"Medicine", diff:"Moderate"},
 {q:"Which nerve is responsible for wrist drop?", opts:["A. Ulnar nerve","B. Median nerve","C. Radial nerve","D. Axillary nerve"], ans:"C", exp:"Radial nerve injury causes wrist drop due to paralysis of wrist extensors.", why_wrong:"A. Ulnar nerve injury causes claw hand. B. Median nerve injury causes ape hand. D. Axillary nerve causes loss of deltoid function.", subj:"Anatomy", diff:"Easy"},
 {q:"A child presents with high fever, neck stiffness, and photophobia. CSF shows low glucose, high protein, neutrophils. What is the most likely organism?", opts:["A. Streptococcus pneumoniae","B. Neisseria meningitidis","C. E. coli","D. Listeria"], ans:"A", exp:"Streptococcus pneumoniae is the most common cause of bacterial meningitis in adults and older children.", why_wrong:"B. Neisseria meningitidis more common in adolescents. C. E. coli in neonates. D. Listeria in elderly/immunocompromised.", subj:"Microbiology", diff:"Moderate"},
 {q:"What is the mechanism of action of metformin?", opts:["A. Stimulates insulin secretion","B. Activates AMPK, reduces hepatic gluconeogenesis","C. Inhibits alpha-glucosidase","D. Increases insulin sensitivity via PPAR-gamma"], ans:"B", exp:"Metformin activates AMP-kinase which reduces hepatic glucose production and improves insulin sensitivity.", why_wrong:"A. Sulphonylureas stimulate insulin. C. Acarbose inhibits alpha-glucosidase. D. Thiazolidinediones activate PPAR-gamma.", subj:"Pharmacology", diff:"Moderate"},
 {q:"A patient has haemoglobin of 7g/dL, MCV 115fL, hypersegmented neutrophils. What is the most likely diagnosis?", opts:["A. Iron deficiency anaemia","B. Megaloblastic anaemia","C. Haemolytic anaemia","D. Aplastic anaemia"], ans:"B", exp:"High MCV with hypersegmented neutrophils is classic for megaloblastic anaemia (B12/folate deficiency).", why_wrong:"A. Iron deficiency causes microcytic anaemia. C. Haemolytic anaemia has raised reticulocytes. D. Aplastic anaemia has pancytopenia.", subj:"Medicine", diff:"Easy"}
 ];
}

function epLoadQ() {
 if(epCurrentQ >= epQuestions.length) { epShowResults(); return; }
 var q = epQuestions[epCurrentQ];
 epAnswered = false; epSelected = null;

 var total = epQuestions.length;
 var pct = (epCurrentQ / total) * 100;
 document.getElementById('epProgressFill').style.width = pct + '%';
 document.getElementById('epQNum').textContent = 'Q ' + (epCurrentQ+1) + '/' + total;
 document.getElementById('epCorrectCount').textContent = epCorrect;
 document.getElementById('epWrongCount').textContent = epWrong;
 document.getElementById('epSkipCount').textContent = epSkipped;

 var diffEl = document.getElementById('epQDiff');
 diffEl.textContent = q.diff || epDiff;
 diffEl.className = 'ep-q-diff ' + (q.diff||epDiff).toLowerCase().replace(' ','');

 document.getElementById('epQSubj').textContent = q.subj || epSubj;
 document.getElementById('epQStem').textContent = q.q;
 document.getElementById('epExplanation').classList.remove('on');
 document.getElementById('epSubmitBtn').style.display = 'block';
 document.getElementById('epNextBtn').style.display = 'none';
 document.getElementById('epAiBtn').style.display = 'none';

 var bm = document.getElementById('epBookmarkBtn');
 var fl = document.getElementById('epFlagBtn');
 bm.classList.toggle('bookmarked', epBookmarked.indexOf(epCurrentQ) !== -1);
 fl.classList.toggle('flagged', epFlagged.indexOf(epCurrentQ) !== -1);

 var optsEl = document.getElementById('epQOpts');
 optsEl.innerHTML = '';
 (q.opts || []).forEach(function(opt, i) {
 var btn = document.createElement('button');
 btn.className = 'ep-q-opt';
 btn.innerHTML = '<span class="ep-q-opt-letter">' + ['A','B','C','D'][i] + '</span>' + esc(opt.replace(/^[A-D]\.\s*/,''));
 btn.dataset.idx = i;
 btn.onclick = function() {
 if(epAnswered) return;
 document.querySelectorAll('.ep-q-opt').forEach(function(b){ b.classList.remove('selected'); });
 btn.classList.add('selected');
 epSelected = i;
 };
 optsEl.appendChild(btn);
 });
}

function epSubmitAnswer() {
 if(epSelected === null) { showNotif('Please select an answer first!'); return; }
 if(epAnswered) return;
 epAnswered = true;

 var q = epQuestions[epCurrentQ];
 var correctIdx = ['A','B','C','D'].indexOf(q.ans);
 var isCorrect = epSelected === correctIdx;

 document.querySelectorAll('.ep-q-opt').forEach(function(btn, i) {
 btn.disabled = true;
 if(i === correctIdx) btn.classList.add('correct');
 else if(i === epSelected && !isCorrect) btn.classList.add('wrong');
 });

 if(isCorrect) {
 epCorrect++;
 var xp = epDiff === 'Easy' ? 10 : epDiff === 'Moderate' ? 15 : epDiff === 'Hard' ? 25 : 40;
 epTotalXP += xp;
 updateXP(xp);
 showNotif(' Correct! +' + xp + ' XP');
 } else {
 epWrong++;
 var yourAns = (q.opts[epSelected]||'').replace(/^[A-D]\.\s*/,'');
 var correctAns = (q.opts[correctIdx]||'').replace(/^[A-D]\.\s*/,'');
 addMistake('mcq', q.q, yourAns, correctAns, q.exp || '');
 }

 document.getElementById('epCorrectCount').textContent = epCorrect;
 document.getElementById('epWrongCount').textContent = epWrong;

 var expEl = document.getElementById('epExplanation');
 document.getElementById('epExpCorrect').innerHTML = (isCorrect ? '' : '') + ' Correct Answer: <strong style="color:var(--p-lite)">' + q.ans + '. ' + esc((q.opts[correctIdx]||'').replace(/^[A-D]\.\s*/,'')) + '</strong>';
 document.getElementById('epExpText').innerHTML = fmtReply(q.exp || 'This is a high-yield medical fact.');
 document.getElementById('epWrongOpts').innerHTML = (q.why_wrong || '').split('. ').filter(Boolean).map(function(s){ return '<div class="ep-wrong-opt">'+fmtReply(s)+'</div>'; }).join('');
 expEl.classList.add('on');

 document.getElementById('epSubmitBtn').style.display = 'none';
 document.getElementById('epNextBtn').style.display = 'block';
 document.getElementById('epAiBtn').style.display = 'block';
}

function epSkip() {
 if(epAnswered) return;
 epSkipped++;
 document.getElementById('epSkipCount').textContent = epSkipped;
 epCurrentQ++;
 epLoadQ();
}

function epNextQ() {
 epCurrentQ++;
 epLoadQ();
}

function epBookmark() {
 var idx = epBookmarked.indexOf(epCurrentQ);
 if(idx === -1) { epBookmarked.push(epCurrentQ); document.getElementById('epBookmarkBtn').classList.add('bookmarked'); showNotif(' Question bookmarked!'); }
 else { epBookmarked.splice(idx,1); document.getElementById('epBookmarkBtn').classList.remove('bookmarked'); showNotif('Bookmark removed'); }
}

function epFlag() {
 var idx = epFlagged.indexOf(epCurrentQ);
 if(idx === -1) { epFlagged.push(epCurrentQ); document.getElementById('epFlagBtn').classList.add('flagged'); showNotif(' Question flagged for review!'); }
 else { epFlagged.splice(idx,1); document.getElementById('epFlagBtn').classList.remove('flagged'); showNotif('Flag removed'); }
}

async function epAiExplain() {
 var q = epQuestions[epCurrentQ];
 var btn = document.getElementById('epAiBtn'); btn.disabled = true; btn.textContent = 'AI thinking...';
 try {
 var reply = await callWorker('You are a medical tutor. Give a detailed clinical explanation for this MCQ. Include: why correct answer is correct, clinical relevance, memory trick.', [{role:'user', content:'Explain this MCQ: ' + q.q + '\nCorrect answer: ' + q.ans + '\n' + (q.exp||'')}]);
 document.getElementById('epExpText').innerHTML = fmtReply(reply);
 showNotif(' AI explanation added!');
 } catch(e) { showNotif('Error: ' + e.message); }
 btn.disabled = false; btn.textContent = 'AI Explain';
}

function epRunTimer() {
 clearInterval(epTimerInt);
 epTimerInt = setInterval(function() {
 epTimerSecs--;
 var m = Math.floor(epTimerSecs/60), s = epTimerSecs%60;
 var el = document.getElementById('epTimer');
 if(el) { el.textContent = m + ':' + (s<10?'0':'') + s; el.classList.toggle('urgent', epTimerSecs < 60); }
 if(epTimerSecs <= 0) { clearInterval(epTimerInt); epShowResults(); }
 }, 1000);
}

function epShowResults() {
 clearInterval(epTimerInt);
 var total = epQuestions.length;
 var pct = total > 0 ? Math.round((epCorrect/total)*100) : 0;
 document.getElementById('epQuestion').style.display = 'none';
 document.getElementById('epResults').classList.add('on');
 document.getElementById('epResultScore').textContent = pct + '%';
 document.getElementById('epResCorrect').textContent = epCorrect;
 document.getElementById('epResWrong').textContent = epWrong;
 document.getElementById('epResSkip').textContent = epSkipped;
 document.getElementById('epResXP').textContent = epTotalXP;
 // XP already given per question - don't double-add at end
 libSave('quiz', 'Exam Prep: ' + epExam + ' - ' + pct + '%', 'Correct: ' + epCorrect);
 if(pct >= 80) fireConfetti();
 showNotif('Session complete! ' + pct + '% - ' + epTotalXP + ' XP earned');
}

function epRestart() {
 epCorrect=0; epWrong=0; epSkipped=0; epCurrentQ=0; epTotalXP=0; epSelected=null; epAnswered=false;
 document.getElementById('epResults').classList.remove('on');
 document.getElementById('epQuestion').style.display = 'block';
 if(epMode==='timed') { epTimerSecs=epQCount*90; epRunTimer(); }
 epLoadQ();
}
