// ════════════════════════════════════════════════
// SNAP MODE
// ════════════════════════════════════════════════
var snapMode = 'explain';
var snapImageData = '';
var snapResultText = '';

document.addEventListener('DOMContentLoaded', function() {
 var snapInput = document.getElementById('snapFileInput');
 if(snapInput) snapInput.onchange = function(e) {
 var f = e.target.files[0]; if(!f) return;
 var reader = new FileReader();
 reader.onload = function(ev) {
 snapImageData = ev.target.result;
 var prev = document.getElementById('snapPreview');
 prev.src = snapImageData; prev.classList.add('on');
 var zone = document.getElementById('snapZone');
 zone.classList.add('has-image');
 document.getElementById('snapZoneContent').style.display = 'none';
 };
 reader.readAsDataURL(f);
 e.target.value = '';
 };

 var pdfInput = document.getElementById('pdfFileInput');
 if(pdfInput) pdfInput.onchange = function(e) {
 var f = e.target.files[0]; if(!f) return;
 document.getElementById('pdfFileName').textContent = f.name;
 document.getElementById('pdfFileSize').textContent = (f.size/1024).toFixed(1) + ' KB';
 document.getElementById('pdfFileInfo').classList.add('on');
 document.getElementById('pdfZone').classList.add('loaded');
 document.getElementById('pdfZoneContent').innerHTML = '<div style="font-size:28px;margin-bottom:.5rem"></div><div style="font-size:13px;font-weight:700;color:var(--ok)">' + f.name + ' loaded!</div>';
 var reader = new FileReader();
 reader.onload = function(ev) {
 pdfContent = ev.target.result || '';
 var pdfEl = document.getElementById('pdfTextInput');
 if(pdfEl) {
 pdfEl.dataset.uploadedContent = pdfContent.substring(0, 6000);
 pdfEl.placeholder = ' File loaded! Click an action below.';
 // Show badge
 var old2 = document.getElementById('upload-badge-pdfTextInput');
 if(old2) old2.remove();
 var badge2 = document.createElement('div');
 badge2.id = 'upload-badge-pdfTextInput';
 badge2.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:10px;margin-bottom:6px;font-size:12px;font-weight:700;color:var(--ok)';
 badge2.innerHTML = '<span>' + (f ? f.name : 'File') + ' — ready</span>';
 pdfEl.parentNode.insertBefore(badge2, pdfEl);
 }
 };
 if(f.name.endsWith('.txt')) reader.readAsText(f, 'UTF-8');
 else { pdfContent = ''; showNotif('PDF text extraction: paste content manually for best results'); }
 e.target.value = '';
 };

 // Build waveform
 var wf = document.getElementById('podWaveform');
 if(wf) {
 for(var i=0; i<40; i++) {
 var bar = document.createElement('div');
 bar.className = 'pod-wave-bar';
 bar.style.height = (Math.random()*30+5)+'px';
 wf.appendChild(bar);
 }
 }
});

function snapPickMode(el) {
 document.querySelectorAll('.snap-mode-btn').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on'); snapMode = el.dataset.smode;
}

async function analyseSnap() {
 var text = '';
 if(!snapImageData) {
 text = prompt('No image uploaded. Describe what you want to analyse:');
 if(!text) return;
 }
 var btn = document.getElementById('snapAnalyseBtn');
 btn.disabled = true;
 document.getElementById('snapLoading').classList.add('on');
 document.getElementById('snapOutput').classList.remove('on');

 var modeInstructions = {
 explain: 'Explain this medical content clearly with clinical context.',
 quick: 'Give a quick direct answer. Be concise.',
 detailed: 'Give a very detailed step-by-step explanation with clinical pearls.',
 mcq: 'This is an MCQ. Identify the correct answer and explain why each option is correct or wrong.',
 keywords: 'List and explain all key medical concepts, terms and keywords in this content.'
 };

 var langInstr2 = getLangInstruction(snapLang, null);
 var sys = 'You are an expert medical AI tutor. ' + langInstr2 + ' Analyse the provided medical content. Mode: ' + (modeInstructions[snapMode] || modeInstructions.explain) + ' Be thorough and educational for a medical student.';

 var userContent;
 if(snapImageData) {
 // Pass image description request with base64 context hint
 userContent = 'I have uploaded a medical image/question. Please analyse it. The image shows medical content. Mode: ' + (modeInstructions[snapMode]||'explain it') + '. Please provide a thorough medical analysis as if you can see the image content. If this appears to be an MCQ, identify the correct answer and explain each option.';
 } else {
 userContent = text;
 }

 try {
 var reply = await callWorker(sys, [{role:'user', content: userContent}], snapImageData || null);
 snapResultText = reply;
 document.getElementById('snapResult').innerHTML = fmtReply(reply);
 document.getElementById('snapLoading').classList.remove('on');
 document.getElementById('snapOutput').classList.add('on');
 updateXP(15); showToast('Image analysed! +15 XP', 'success');
 } catch(err) {
 document.getElementById('snapLoading').classList.remove('on');
 showToast('Error: ' + err.message, 'error');
 }
 btn.disabled = false;
}
function snapCopy() {
 navigator.clipboard.writeText(stripMarkdown(snapResultText || '')).catch(function(){});
 var btn = document.getElementById('snapCopyBtn');
 btn.textContent = 'Copied!';
 setTimeout(function(b){ b.textContent='Copy'; }.bind(null,btn), 2000);
}
function snapToFlashcards() {
 if(!snapResultText) return;
 document.getElementById('fcNotes').value = snapResultText.substring(0,4000);
 goPanel('flash');
}
function snapToChat() {
 if(!snapResultText) return;
 document.getElementById('msgInput').value = 'Tell me more about: ' + snapResultText.substring(0,200);
 goPanel('chat');
}
function snapReset() {
 snapImageData = ''; snapResultText = '';
 document.getElementById('snapPreview').classList.remove('on');
 document.getElementById('snapPreview').src = '';
 document.getElementById('snapZone').classList.remove('has-image');
 document.getElementById('snapZoneContent').style.display = 'block';
 document.getElementById('snapOutput').classList.remove('on');
 document.getElementById('snapResult').innerHTML = '';
}

// ════════════════════════════════════════════════
// DRUG CHECKER
// ════════════════════════════════════════════════
var drugList = [];
var drugTab = 'interaction';
var drugResultText = '';

function drugSwitchTab(el) {
 document.querySelectorAll('.drug-tab').forEach(function(t){ t.classList.remove('on'); });
 el.classList.add('on'); drugTab = el.dataset.dtab;
 document.getElementById('drugInteractionTab').style.display = drugTab==='interaction' ? 'block' : 'none';
 document.getElementById('drugInfoTab').style.display = drugTab==='info' ? 'block' : 'none';
 document.getElementById('drugDoseTab').style.display = drugTab==='dose' ? 'block' : 'none';
 document.getElementById('drugOutput').classList.remove('on');
}

function drugAddChip() {
 var inp = document.getElementById('drugInputField');
 var val = inp.value.trim();
 if(!val) return;
 if(drugList.indexOf(val.toLowerCase()) !== -1) { showNotif('Drug already added!'); return; }
 drugList.push(val);
 inp.value = '';
 renderDrugChips();
}

function renderDrugChips() {
 var chips = document.getElementById('drugChips');
 chips.innerHTML = drugList.map(function(d, i) {
 return '<div class="drug-chip">' + esc(d) + '<button class="drug-chip-remove" onclick="drugRemoveChip('+i+')"></button></div>';
 }).join('');
}

function drugRemoveChip(i) {
 drugList.splice(i, 1);
 renderDrugChips();
}

function setDrugQuick(name) {
 document.getElementById('drugInfoInput').value = name;
 getDrugInfo();
}

async function checkDrugInteraction() {
 if(drugList.length < 2) { showNotif('Add at least 2 drugs!'); return; }
 var btn = document.getElementById('drugCheckBtn'); btn.disabled = true;
 document.getElementById('drugLoading').style.display = 'block';
 document.getElementById('drugOutput').classList.remove('on');
 var sys = 'You are a clinical pharmacology expert. Check drug interactions between the given drugs. For each interaction provide: Severity (Major/Moderate/Minor/None), Mechanism, Clinical effects, Management recommendation. Be precise and evidence-based. Format clearly with sections.';
 try {
 var reply = await callWorker(sys, [{role:'user', content:'Check interactions between: ' + drugList.join(', ')}]);
 drugResultText = reply;
 document.getElementById('drugOutputTitle').textContent = 'Interaction Report: ' + drugList.join(' + ');
 document.getElementById('drugResult').innerHTML = formatDrugOutput(reply);
 document.getElementById('drugLoading').style.display = 'none';
 document.getElementById('drugOutput').classList.add('on');
 updateXP(5);
 } catch(err) { document.getElementById('drugLoading').style.display='none'; showNotif('Error: '+err.message); }
 btn.disabled = false;
}

async function getDrugInfo() {
 var drug = document.getElementById('drugInfoInput').value.trim();
 if(!drug) { showNotif('Enter a drug name!'); return; }
 document.getElementById('drugLoading').style.display = 'block';
 document.getElementById('drugOutput').classList.remove('on');
 var sys = 'You are a clinical pharmacology expert. Provide comprehensive drug information. Format: CLASS: | MECHANISM: | INDICATIONS: | DOSAGE: | SIDE EFFECTS: | CONTRAINDICATIONS: | INTERACTIONS: | MONITORING: | HIGH YIELD FACT: | MNEMONIC:';
 try {
 var reply = await callWorker(sys, [{role:'user', content:'Give complete information about: ' + drug}]);
 drugResultText = reply;
 document.getElementById('drugOutputTitle').textContent = '' + drug;
 document.getElementById('drugResult').innerHTML = formatDrugOutput(reply);
 document.getElementById('drugLoading').style.display = 'none';
 document.getElementById('drugOutput').classList.add('on');
 updateXP(5);
 } catch(err) { document.getElementById('drugLoading').style.display='none'; showNotif('Error: '+err.message); }
}

async function getDrugDose() {
 var drug = document.getElementById('drugDoseInput').value.trim();
 var patient = document.getElementById('drugDosePatient').value;
 if(!drug) { showNotif('Enter a drug name!'); return; }
 document.getElementById('drugLoading').style.display = 'block';
 document.getElementById('drugOutput').classList.remove('on');
 var sys = 'You are a clinical pharmacist. Provide detailed dosing information. Include: Standard dose, frequency, route, duration. Adjustments for special populations. Maximum dose. Renal/hepatic adjustments if relevant.';
 try {
 var reply = await callWorker(sys, [{role:'user', content:'Dosage for ' + drug + ' in ' + patient + ' patient:'}]);
 drugResultText = reply;
 document.getElementById('drugOutputTitle').textContent = '' + drug + ' Dosage (' + patient + ')';
 document.getElementById('drugResult').innerHTML = formatDrugOutput(reply);
 document.getElementById('drugLoading').style.display = 'none';
 document.getElementById('drugOutput').classList.add('on');
 updateXP(5);
 } catch(err) { document.getElementById('drugLoading').style.display='none'; showNotif('Error: '+err.message); }
}

function formatDrugOutput(raw) {
 return raw.split('\n').map(function(line) {
 if(!line.trim()) return '<div style="height:5px"></div>';
 if(/^(CLASS|MECHANISM|INDICATIONS|DOSAGE|SIDE EFFECTS|CONTRAINDICATIONS|INTERACTIONS|MONITORING|HIGH YIELD|MNEMONIC|MAJOR|MODERATE|MINOR|SEVERITY):/.test(line.trim())) {
 var parts = line.trim().split(':'); var lbl = parts[0]; var val = parts.slice(1).join(':');
 var color = /MAJOR/.test(lbl)?'var(--red)':/MODERATE/.test(lbl)?'var(--gold)':/MINOR/.test(lbl)?'var(--ok)':/HIGH YIELD/.test(lbl)?'var(--gold)':'var(--p-lite)';
 return '<div style="margin-bottom:.5rem"><span style="font-size:11px;font-weight:900;color:'+color+';background:rgba(255,255,255,.06);padding:2px 8px;border-radius:4px;text-transform:uppercase">'+esc(lbl)+'</span><span style="font-size:13px;color:var(--tx2);margin-left:6px">'+esc(val)+'</span></div>';
 }
 if(/^[•\-]/.test(line.trim())) return '<div style="padding:2px 0 2px 10px;font-size:13px;color:var(--tx2)">• '+esc(line.trim().replace(/^[•\-]\s*/,''))+'</div>';
 return '<div style="font-size:13px;color:var(--tx2);padding:2px 0">'+esc(line)+'</div>';
 }).join('');
}

function drugCopy() {
 navigator.clipboard.writeText(stripMarkdown(drugResultText || "")).catch(function(){});
 showNotif('Copied!');
}

// ════════════════════════════════════════════════
// MEDICAL CALCULATORS
// ════════════════════════════════════════════════
function calcPick(el) {
 document.querySelectorAll('.calc-card').forEach(function(c){ c.classList.remove('on'); });
 document.querySelectorAll('.calc-form').forEach(function(f){ f.classList.remove('on'); });
 el.classList.add('on');
 var form = document.getElementById('calc-' + el.dataset.calc);
 if(form) form.classList.add('on');
}

function calcBMI() {
 var w = parseFloat(document.getElementById('bmi-weight').value);
 var h = parseFloat(document.getElementById('bmi-height').value) / 100;
 if(!w||!h) { showNotif('Enter weight and height!'); return; }
 var bmi = (w/(h*h)).toFixed(1);
 var interp, color;
 if(bmi<18.5){interp='Underweight';color='var(--p-lite)';}
 else if(bmi<25){interp='Normal weight';color='var(--ok)';}
 else if(bmi<30){interp='Overweight';color='var(--gold)';}
 else{interp='Obese';color='var(--red)';}
 document.getElementById('bmi-val').textContent = bmi;
 var el = document.getElementById('bmi-interp');
 el.textContent = interp; el.style.cssText = 'background:rgba(255,255,255,.06);color:'+color+';padding:6px 14px;border-radius:8px;display:inline-block';
 document.getElementById('bmi-result').classList.add('on');
}

function calcGFR() {
 var age = parseInt(document.getElementById('gfr-age').value);
 var creat = parseFloat(document.getElementById('gfr-creat').value);
 var sex = document.getElementById('gfr-sex').value;
 if(!age||!creat) { showNotif('Enter all values!'); return; }
 var kappa = sex==='female'?0.7:0.9, alpha = sex==='female'?-0.241:-0.302, mult = sex==='female'?1.012:1;
 var ratio = creat/kappa;
 var gfr = 142 * Math.pow(Math.min(ratio,1),alpha) * Math.pow(Math.max(ratio,1),-1.200) * Math.pow(0.9938,age) * mult;
 gfr = gfr.toFixed(0);
 var interp, color;
 if(gfr>=90){interp='Normal (G1)';color='var(--ok)';}
 else if(gfr>=60){interp='Mildly reduced (G2)';color='var(--ok)';}
 else if(gfr>=45){interp='Mildly-moderately reduced (G3a)';color='var(--gold)';}
 else if(gfr>=30){interp='Moderately-severely reduced (G3b)';color='var(--gold)';}
 else if(gfr>=15){interp='Severely reduced (G4)';color='var(--red)';}
 else{interp='Kidney failure (G5)';color='var(--red)';}
 document.getElementById('gfr-val').textContent = gfr;
 var el = document.getElementById('gfr-interp');
 el.textContent = interp; el.style.cssText = 'background:rgba(255,255,255,.06);color:'+color+';padding:6px 14px;border-radius:8px;display:inline-block';
 document.getElementById('gfr-result').classList.add('on');
}

function calcCHADS() {
 var score = parseInt(document.getElementById('chads-age').value) + parseInt(document.getElementById('chads-sex').value);
 if(document.getElementById('chads-chf').checked) score++;
 if(document.getElementById('chads-htn').checked) score++;
 if(document.getElementById('chads-dm').checked) score++;
 if(document.getElementById('chads-stroke').checked) score += 2;
 if(document.getElementById('chads-vasc').checked) score++;
 var interp, color, rec;
 if(score===0){interp='Low risk';color='var(--ok)';rec='No anticoagulation needed';}
 else if(score===1){interp='Low-moderate risk';color='var(--gold)';rec='Consider anticoagulation';}
 else{interp='High risk';color='var(--red)';rec='Anticoagulation recommended';}
 document.getElementById('chads-val').textContent = score;
 var el = document.getElementById('chads-interp');
 el.textContent = interp + ' — ' + rec; el.style.cssText = 'background:rgba(255,255,255,.06);color:'+color+';padding:6px 14px;border-radius:8px;display:inline-block;font-size:12px';
 document.getElementById('chads-result').classList.add('on');
}

function calcCURB65() {
 var score = 0;
 if(document.getElementById('curb-confusion').checked) score++;
 if(document.getElementById('curb-urea').checked) score++;
 if(document.getElementById('curb-rr').checked) score++;
 if(document.getElementById('curb-bp').checked) score++;
 if(document.getElementById('curb-age').checked) score++;
 var interp, color, mgmt;
 if(score<=1){interp='Low severity';color='var(--ok)';mgmt='Home treatment';}
 else if(score===2){interp='Moderate severity';color='var(--gold)';mgmt='Hospital admission';}
 else{interp='High severity';color='var(--red)';mgmt='ICU admission consider';}
 document.getElementById('curb65-val').textContent = score;
 var el = document.getElementById('curb65-interp');
 el.textContent = interp + ' — ' + mgmt; el.style.cssText = 'background:rgba(255,255,255,.06);color:'+color+';padding:6px 14px;border-radius:8px;display:inline-block;font-size:12px';
 document.getElementById('curb65-result').classList.add('on');
}

function calcAPGAR() {
 var score = parseInt(document.getElementById('apgar-appearance').value) + parseInt(document.getElementById('apgar-pulse').value) + parseInt(document.getElementById('apgar-grimace').value) + parseInt(document.getElementById('apgar-activity').value) + parseInt(document.getElementById('apgar-resp').value);
 var interp, color;
 if(score>=7){interp='Normal — no intervention needed';color='var(--ok)';}
 else if(score>=4){interp='Some assistance needed';color='var(--gold)';}
 else{interp='Immediate resuscitation required';color='var(--red)';}
 document.getElementById('apgar-val').textContent = score + '/10';
 var el = document.getElementById('apgar-interp');
 el.textContent = interp; el.style.cssText = 'background:rgba(255,255,255,.06);color:'+color+';padding:6px 14px;border-radius:8px;display:inline-block;font-size:12px';
 document.getElementById('apgar-result').classList.add('on');
}

function calcBSA() {
 var w = parseFloat(document.getElementById('bsa-weight').value);
 var h = parseFloat(document.getElementById('bsa-height').value);
 if(!w||!h) { showNotif('Enter weight and height!'); return; }
 var bsa = Math.sqrt((h*w)/3600).toFixed(2);
 document.getElementById('bsa-val').textContent = bsa;
 var el = document.getElementById('bsa-interp');
 el.textContent = 'Normal adult: 1.7-1.9 m²'; el.style.cssText = 'background:rgba(37,99,235,.1);color:var(--p-lite);padding:6px 14px;border-radius:8px;display:inline-block;font-size:12px';
 document.getElementById('bsa-result').classList.add('on');
}

function calcMAP() {
 var sys = parseInt(document.getElementById('map-sys').value);
 var dia = parseInt(document.getElementById('map-dia').value);
 if(!sys||!dia) { showNotif('Enter BP values!'); return; }
 var map = Math.round(dia + (sys-dia)/3);
 var interp, color;
 if(map<70){interp='Low — hypoperfusion risk';color='var(--red)';}
 else if(map<=100){interp='Normal range';color='var(--ok)';}
 else{interp='Elevated';color='var(--gold)';}
 document.getElementById('map-val').textContent = map;
 var el = document.getElementById('map-interp');
 el.textContent = interp + ' (Normal: 70-100 mmHg)'; el.style.cssText = 'background:rgba(255,255,255,.06);color:'+color+';padding:6px 14px;border-radius:8px;display:inline-block;font-size:12px';
 document.getElementById('map-result').classList.add('on');
}

function calcIBW() {
 var h = parseFloat(document.getElementById('ibw-height').value);
 var sex = document.getElementById('ibw-sex').value;
 if(!h) { showNotif('Enter height!'); return; }
 var hInch = h/2.54;
 var ibw = sex==='male' ? 50 + 2.3*(hInch-60) : 45.5 + 2.3*(hInch-60);
 ibw = Math.max(0, ibw).toFixed(1);
 document.getElementById('ibw-val').textContent = ibw + ' kg';
 var el = document.getElementById('ibw-interp');
 el.textContent = 'Use for drug dosing and ventilator settings'; el.style.cssText = 'background:rgba(37,99,235,.1);color:var(--p-lite);padding:6px 14px;border-radius:8px;display:inline-block;font-size:12px';
 document.getElementById('ibw-result').classList.add('on');
}

// ════════════════════════════════════════════════
// PDF MODE
// ════════════════════════════════════════════════
var pdfContent = '';
var pdfResultText = '';
var pdfChatHistory = [];

async function pdfAction(action) {
 var text = pdfContent || document.getElementById('pdfTextInput').value.trim();
 if(!text) { showNotif('Upload a file or paste text first!'); return; }

 var titles = {summarise:' Document Summary', flashcards:' Generated Flashcards', mcq:' MCQ Questions', notes:' Short Notes', chat:' Ask Questions'};
 document.getElementById('pdfOutputTitle').textContent = titles[action] || 'Result';

 if(action === 'chat') {
 pdfChatHistory = [{role:'system', content:'You are an AI assistant. Answer questions about this document: ' + text.substring(0,4000)}];
 document.getElementById('pdfChatWrap').classList.add('on');
 document.getElementById('pdfOutput').classList.remove('on');
 document.getElementById('pdfChatMsgs').innerHTML = '<div style="text-align:center;font-size:13px;color:var(--tx3);padding:1rem">Ask anything about your document!</div>';
 return;
 }

 document.getElementById('pdfChatWrap').classList.remove('on');
 document.getElementById('pdfLoading').style.display = 'block';
 document.getElementById('pdfOutput').classList.remove('on');

 var loadTexts = {
 summarise: 'Summarising document...',
 flashcards: 'Creating flashcards...',
 mcq: 'Generating MCQs...',
 notes: 'Creating short notes...'
 };
 document.getElementById('pdfLoadingTxt').textContent = loadTexts[action] || 'Processing...';

 var prompts = {
 summarise: 'Summarise this medical document into: OVERVIEW, KEY POINTS (bullets), IMPORTANT TERMS, CLINICAL PEARLS, REVISION QUESTIONS.',
 flashcards: 'Create 15 flashcards from this content. Format: Q: [question] | A: [answer]. One per line.',
 mcq: 'Create 10 MCQ questions from this content. Format: Q: [question] A) B) C) D) Answer: [letter] Explanation: [why]',
 notes: 'Create concise study notes. Use headers, bullet points, bold key terms. Keep it exam-focused.'
 };

 try {
 var reply = await callWorker('You are an expert medical educator. ' + (prompts[action]||''), [{role:'user', content: text.substring(0,4000)}]);
 pdfResultText = reply;
 document.getElementById('pdfResult').textContent = reply;
 document.getElementById('pdfLoading').style.display = 'none';
 document.getElementById('pdfOutput').classList.add('on');
 updateXP(20); showNotif(titles[action] + ' done! +20 XP');
 if(action==='flashcards') libSave('flashcard', 'PDF Flashcards — '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}), reply);
 } catch(err) {
 document.getElementById('pdfLoading').style.display = 'none';
 showNotif('Error: ' + err.message);
 }
}

async function pdfChatSend() {
 var msg = document.getElementById('pdfChatInput').value.trim();
 if(!msg) return;
 document.getElementById('pdfChatInput').value = '';
 var msgs = document.getElementById('pdfChatMsgs');
 msgs.innerHTML += '<div style="text-align:right;margin-bottom:.6rem"><div style="display:inline-block;background:linear-gradient(135deg,var(--p),var(--p2));color:#fff;padding:8px 14px;border-radius:12px;font-size:13px;max-width:85%;font-weight:600">'+esc(msg)+'</div></div>';
 msgs.scrollTop = msgs.scrollHeight;
 pdfChatHistory.push({role:'user', content:msg});
 var text = pdfContent || document.getElementById('pdfTextInput').value.trim();
 try {
 var reply = await callWorker('You are an AI assistant helping a medical student understand a document. Be concise and educational. Document: ' + text.substring(0,3000), pdfChatHistory.slice(-6));
 pdfChatHistory.push({role:'assistant', content:reply});
 msgs.innerHTML += '<div style="margin-bottom:.6rem"><div style="display:inline-block;background:var(--card2);border:1px solid var(--bd);color:var(--tx2);padding:8px 14px;border-radius:12px;font-size:13px;max-width:85%;line-height:1.6">'+esc(reply)+'</div></div>';
 msgs.scrollTop = msgs.scrollHeight;
 } catch(err) { showNotif('Error: '+err.message); }
}

function pdfCopy() { navigator.clipboard.writeText(stripMarkdown(pdfResultText || "")).catch(function(){}); showNotif('Copied!'); }
function pdfReset() {
 pdfContent=''; pdfResultText=''; pdfChatHistory=[];
 document.getElementById('pdfTextInput').value='';
 document.getElementById('pdfFileInfo').classList.remove('on');
 document.getElementById('pdfZone').classList.remove('loaded');
 document.getElementById('pdfZoneContent').innerHTML='<div style="font-size:40px;margin-bottom:.8rem"></div><div style="font-size:15px;font-weight:800;color:var(--tx2);margin-bottom:.3rem">Tap to upload file</div><div style="font-size:12px;color:var(--tx3)">.pdf • .txt • .docx</div>';
 document.getElementById('pdfOutput').classList.remove('on');
 document.getElementById('pdfChatWrap').classList.remove('on');
 document.getElementById('pdfChatMsgs').innerHTML='';
}

// ════════════════════════════════════════════════
// PODCAST MODE
// ════════════════════════════════════════════════
var podStyle = 'lecture';
var podScript = '';
var podUtterance = null;
var podPlaying = false;
var podSpeech = window.speechSynthesis;
var podCurrentSent = 0;
var podSentences = [];

function podPickStyle(el) {
 document.querySelectorAll('.pod-style-btn').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on'); podStyle = el.dataset.pstyle;
}

async function generatePodcast() {
 var notes = document.getElementById('podNotesInput').value.trim();
 if(!notes) { showNotif('Paste your notes first!'); return; }
 var btn = document.getElementById('podGenBtn'); btn.disabled = true;
 document.getElementById('podLoading').style.display = 'block';
 document.getElementById('podPlayer').classList.remove('on');

 var styleGuides = {
 lecture: 'Create a structured educational lecture script. Use a professional but engaging tone. Include: intro, main concepts, clinical pearls, summary.',
 revision: 'Create a rapid revision script. Fast-paced, bullet-point style. Focus on high-yield facts only.',
 story: 'Create a story-style explanation. Use analogies and real-world examples to make concepts memorable.',
 exam: 'Create an exam-focused script. Cover likely exam questions, key facts, mnemonics, and what examiners want.'
 };

 var sys = 'You are an expert medical podcast host and educator. Create an audio podcast script from the given medical notes. Style: ' + (styleGuides[podStyle]||styleGuides.lecture) + ' Make it natural for listening, not reading. Use conversational language. Include pauses with "..." for natural rhythm. Length: comprehensive but concise.';

 try {
 var reply = await callWorker(sys, [{role:'user', content: 'Create a podcast script from: ' + notes.substring(0,4000)}]);
 podScript = reply;
 podSentences = reply.match(/[^.!?]+[.!?]+/g) || [reply];

 document.getElementById('podTitle').textContent = 'Medical Podcast';
 document.getElementById('podSubtitle').textContent = 'AI Doctor • ' + podStyle.charAt(0).toUpperCase()+podStyle.slice(1) + ' Style';
 document.getElementById('podTranscript').textContent = reply;
 document.getElementById('podTotalTime').textContent = Math.ceil(podSentences.length * 3 / 60) + ':' + String(Math.ceil(podSentences.length * 3 % 60)).padStart(2,'0');

 // Animate waveform
 var bars = document.querySelectorAll('.pod-wave-bar');
 bars.forEach(function(bar) {
 bar.style.height = (Math.random()*35+5)+'px';
 });

 document.getElementById('podLoading').style.display = 'none';
 document.getElementById('podPlayer').classList.add('on');
 updateXP(25); showNotif('Podcast ready! +25 XP ');
 libSave('lecture', 'Podcast — '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}), reply);
 } catch(err) {
 document.getElementById('podLoading').style.display = 'none';
 showNotif('Error: ' + err.message);
 }
 btn.disabled = false;
}

function podTogglePlay() {
 var btn = document.getElementById('podPlayBtn');
 if(!podScript) return;
 if(podPlaying) {
 podSpeech.pause();
 podPlaying = false;
 btn.textContent = '▶';
 pauseWaveform();
 } else {
 if(podSpeech.paused && podSpeech.speaking) {
 podSpeech.resume();
 } else {
 podSpeech.cancel();
 var utt = new SpeechSynthesisUtterance(podScript);
 utt.rate = podCurrentSpeed || 1;
 utt.pitch = 1;
 utt.lang = 'en-US';
 utt.onend = function() { podPlaying=false; btn.textContent='▶'; document.getElementById('podProgressFill').style.width='100%'; pauseWaveform(); };
 utt.onboundary = function(e) {
 var pct = Math.min(100, (e.charIndex / podScript.length) * 100);
 document.getElementById('podProgressFill').style.width = pct + '%';
 var secs = Math.round(pct * podSentences.length * 3 / 100);
 document.getElementById('podCurrentTime').textContent = Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');
 };
 podSpeech.speak(utt);
 }
 podPlaying = true;
 btn.textContent = '⏸';
 animateWaveform();
 }
}

var podCurrentSpeed = 1;

function podSpeed(s, el) {
 podCurrentSpeed = s;
 document.querySelectorAll('.pod-speed-btn').forEach(function(b){ b.classList.remove('on'); });
 if(el) el.classList.add('on');
 // Restart speech with new speed if currently playing
 if(podPlaying) {
 podPlaying = false;
 podSpeech.cancel();
 setTimeout(function(){
 podTogglePlay();
 }, 100);
 }
}

function podRewind() {
 podSpeech.cancel(); podPlaying=false;
 document.getElementById('podPlayBtn').textContent='▶';
 document.getElementById('podProgressFill').style.width='0%';
 document.getElementById('podCurrentTime').textContent='0:00';
 pauseWaveform();
}

function podForward() { podSpeech.cancel(); podPlaying=false; document.getElementById('podPlayBtn').textContent='▶'; document.getElementById('podProgressFill').style.width='100%'; pauseWaveform(); }
function podSeek(e) { /* visual only */ var pct = e.offsetX/e.currentTarget.offsetWidth*100; document.getElementById('podProgressFill').style.width=pct+'%'; }

var waveAnimInt = null;
function animateWaveform() {
 pauseWaveform();
 waveAnimInt = setInterval(function(){
 document.querySelectorAll('.pod-wave-bar').forEach(function(bar,i){
 bar.style.height=(Math.random()*35+5)+'px';
 bar.classList.toggle('active', i%3===0);
 });
 }, 150);
}
function pauseWaveform() {
 clearInterval(waveAnimInt);
 document.querySelectorAll('.pod-wave-bar').forEach(function(bar){ bar.classList.remove('active'); bar.style.height=(Math.random()*20+5)+'px'; });
}

function podToFlashcards() {
 if(!podScript) return;
 document.getElementById('fcNotes').value = podScript.substring(0,4000);
 goPanel('flash');
}
function podReset() {
 podSpeech.cancel(); podScript=''; podPlaying=false;
 document.getElementById('podPlayer').classList.remove('on');
 document.getElementById('podNotesInput').value='';
 document.getElementById('podPlayBtn').textContent='▶';
 document.getElementById('podProgressFill').style.width='0%';
 pauseWaveform();
}

