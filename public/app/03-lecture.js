// ════════════════════════════════════════
// LECTURE OUTPUT TABS + TRANSCRIPT
// ════════════════════════════════════════
var lecRawTranscript = '';

function lecOutTab(tab) {
 var summaryEl = document.getElementById('lecSummaryContent');
 var transcriptEl = document.getElementById('lecTranscriptSection');
 var langEl = document.getElementById('lecLangSelectorOutput');
 var titleEl = document.getElementById('lecOutTitle');
 var sumBtn = document.getElementById('lecOutTabSummary');
 var trBtn = document.getElementById('lecOutTabTranscript');

 if(tab === 'summary') {
 if(summaryEl) summaryEl.style.display = '';
 if(transcriptEl) transcriptEl.style.display = 'none';
 if(langEl) langEl.style.display = '';
 if(titleEl) titleEl.textContent = 'Lecture Summary';
 if(sumBtn) sumBtn.classList.add('on');
 if(trBtn) trBtn.classList.remove('on');
 } else {
 if(summaryEl) summaryEl.style.display = 'none';
 if(transcriptEl) transcriptEl.style.display = 'block';
 if(langEl) langEl.style.display = 'none';
 if(titleEl) titleEl.textContent = 'Full Transcript';
 if(sumBtn) sumBtn.classList.remove('on');
 if(trBtn) trBtn.classList.add('on');
 // Show transcript
 var content = document.getElementById('lecTranscriptContent');
 if(content && lecRawTranscript) {
 content.textContent = lecRawTranscript;
 } else if(content && !lecRawTranscript) {
 content.innerHTML = '<div style="color:var(--tx3);text-align:center;padding:1rem">No transcript available. Upload an audio file to get a transcript.</div>';
 }
 }
}

function lecCopyTranscript() {
 var text = lecRawTranscript || '';
 navigator.clipboard.writeText(stripMarkdown(text)).catch(function(){});
 showToast('Transcript copied!', 'success');
}

async function lecIdentifySpeakers() {
 if(!lecRawTranscript) { showToast('No transcript available!', 'error'); return; }
 var btn = document.getElementById('lecSpeakerBtn');
 if(btn) { btn.disabled = true; btn.textContent = 'Identifying...'; }
 showToast('Identifying speakers...', 'info', 8000);
 try {
 var sys = 'You are an expert at identifying speakers in medical lecture transcripts. Analyze the transcript and identify different speakers (e.g., Professor, Student, Demonstrator). Format output as: [Speaker Name]: text. Use context clues like questions vs explanations to identify roles. If only one speaker, label as [Lecturer].';
 var reply = await callWorker(sys, [{role:'user', content:'Identify speakers in this transcript and format each line as [Speaker]: text:\n\n' + lecRawTranscript.substring(0, 4000)}]);
 lecRawTranscript = reply;
 var content = document.getElementById('lecTranscriptContent');
 if(content) content.innerHTML = formatTranscriptWithSpeakers(reply);
 showToast('Speakers identified!', 'success');
 } catch(err) {
 showToast('' + err.message, 'error');
 }
 if(btn) { btn.disabled = false; btn.textContent = 'Identify Speakers'; }
}

function formatTranscriptWithSpeakers(text) {
 var speakerColors = {};
 var colorList = ['var(--p-lite)','#86EFAC','#FCD34D','#F9A8D4','#C4B5FD','#FB923C','#34D399'];
 var colorIdx = 0;
 return text.split('\n').map(function(line) {
 var match = line.match(/^\[([^\]]+)\]:\s*(.*)/);
 if(match) {
 var speaker = match[1];
 var text2 = match[2];
 if(!speakerColors[speaker]) {
 speakerColors[speaker] = colorList[colorIdx % colorList.length];
 colorIdx++;
 }
 var color = speakerColors[speaker];
 return '<div style="margin-bottom:.5rem"><span style="font-weight:800;color:'+color+';font-size:12px;background:rgba(255,255,255,.05);padding:2px 8px;border-radius:10px;margin-right:8px">'+esc(speaker)+'</span><span style="color:var(--tx2)">'+esc(text2)+'</span></div>';
 }
 return line ? '<div style="color:var(--tx2);margin-bottom:.3rem">'+esc(line)+'</div>' : '<div style="height:6px"></div>';
 }).join('');
}


// ════════════════════════════════════════
// EXPORT LECTURE SUMMARY TO PDF
// ════════════════════════════════════════
async function lecExportPDF() {
 if(!lecSummaryText) { showToast('Generate a summary first!', 'error'); return; }
 showToast('Generating PDF...', 'info', 3000);

 // For RTL languages, always use browser print (jsPDF can't handle Arabic/Urdu)
 var rtlLangs = ['ar','ur'];
 if(rtlLangs.includes(lecLang)) {
 lecExportPDFFallback();
 return;
 }

 try {
 // Use jsPDF if available
 if(typeof window.jspdf !== 'undefined' || typeof jsPDF !== 'undefined') {
 var jsPDFClass = (typeof jsPDF !== 'undefined') ? jsPDF : window.jspdf.jsPDF;
 var doc = new jsPDFClass({ orientation:'portrait', unit:'mm', format:'a4' });
 var pageW = doc.internal.pageSize.getWidth();
 var pageH = doc.internal.pageSize.getHeight();
 var margin = 15;
 var maxW = pageW - margin * 2;
 var y = margin;

 // Header
 doc.setFillColor(14, 42, 71);
 doc.rect(0, 0, pageW, 28, 'F');
 doc.setTextColor(125, 211, 252);
 doc.setFontSize(18);
 doc.setFont('helvetica','bold');
 doc.text('AI Doctor Study', margin, 12);
 doc.setFontSize(11);
 doc.setTextColor(180, 220, 255);
 doc.text('Lecture Summary', margin, 20);
 doc.setFontSize(9);
 doc.setTextColor(100, 160, 220);
 doc.text(new Date().toLocaleDateString(), pageW - margin, 20, {align:'right'});
 y = 38;

 // Clean text
 var lines = stripMarkdown(lecSummaryText).split('\n');
 var sectionColors = {
 'QUICK SUMMARY': [14,165,233],
 'KEY POINTS': [16,185,129],
 'IMPORTANT TERMS': [245,158,11],
 'WHAT TO REMEMBER': [239,68,68],
 'CLINICAL PEARLS': [16,185,129],
 'REVISION QUESTIONS': [99,102,241]
 };

 lines.forEach(function(line) {
 if(y > pageH - 20) {
 doc.addPage();
 y = margin;
 }
 var trimmed = line.trim();
 if(!trimmed) { y += 3; return; }

 // Check if section heading
 var isSection = false;
 Object.keys(sectionColors).forEach(function(sec) {
 if(trimmed.toUpperCase().startsWith(sec)) {
 isSection = true;
 var col = sectionColors[sec];
 y += 3;
 doc.setFillColor(col[0], col[1], col[2]);
 doc.rect(margin, y-4, maxW, 8, 'F');
 doc.setTextColor(255,255,255);
 doc.setFontSize(10);
 doc.setFont('helvetica','bold');
 doc.text(trimmed, margin+2, y+1);
 y += 8;
 doc.setTextColor(30,30,50);
 doc.setFont('helvetica','normal');
 doc.setFontSize(9);
 }
 });

 if(!isSection) {
 doc.setTextColor(40,40,60);
 doc.setFontSize(9);
 doc.setFont('helvetica', trimmed.startsWith('•') || trimmed.match(/^\d+\./) ? 'normal' : 'normal');
 var wrapped = doc.splitTextToSize(trimmed, maxW - 4);
 wrapped.forEach(function(wl) {
 if(y > pageH - 20) { doc.addPage(); y = margin; }
 doc.text(wl, margin + (trimmed.startsWith('•') ? 4 : 2), y);
 y += 5;
 });
 }
 });

 // If transcript available, add it
 if(lecRawTranscript) {
 doc.addPage();
 y = margin;
 doc.setFillColor(14, 42, 71);
 doc.rect(0, 0, pageW, 16, 'F');
 doc.setTextColor(125, 211, 252);
 doc.setFontSize(13);
 doc.setFont('helvetica','bold');
 doc.text('Full Transcript', margin, 11);
 y = 24;
 doc.setTextColor(40,40,60);
 doc.setFontSize(8);
 doc.setFont('helvetica','normal');
 var tLines = doc.splitTextToSize(lecRawTranscript.substring(0,8000), maxW);
 tLines.forEach(function(tl) {
 if(y > pageH - 15) { doc.addPage(); y = margin; }
 doc.text(tl, margin, y);
 y += 4.5;
 });
 }

 // Footer on all pages
 var totalPages = doc.internal.getNumberOfPages();
 for(var p=1; p<=totalPages; p++) {
 doc.setPage(p);
 doc.setFontSize(8);
 doc.setTextColor(150,150,170);
 doc.text('Generated by AI Doctor Study • aidoctor.study', margin, pageH-6);
 doc.text('Page ' + p + ' of ' + totalPages, pageW-margin, pageH-6, {align:'right'});
 }

 doc.save('Lecture-Summary-' + new Date().toISOString().split('T')[0] + '.pdf');
 showToast('PDF downloaded!', 'success');

 } else {
 // Fallback: use browser print
 lecExportPDFFallback();
 }
 } catch(err) {
 console.error('PDF error:', err);
 lecExportPDFFallback();
 }
}

function lecExportPDFFallback() {
 var rtlLangs = ['ar','ur'];
 var isRTL = rtlLangs.includes(lecLang);
 var dir = isRTL ? 'rtl' : 'ltr';
 var fontFamily = isRTL ? "'Noto Naskh Arabic', 'Arial Unicode MS', 'Segoe UI', Arial, sans-serif" : "Arial, sans-serif";
 var content = stripMarkdown(lecSummaryText || '');
 var win = window.open('', '_blank');
 win.document.write('<!DOCTYPE html><html dir="'+dir+'"><head><meta charset="UTF-8"><title>Lecture Summary</title>');
 if(isRTL) win.document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap">');
 win.document.write('<style>');
 win.document.write('body{font-family:'+fontFamily+';padding:30px;color:#1a1a2e;line-height:2;max-width:800px;margin:0 auto;direction:'+dir+';text-align:'+(isRTL?'right':'left')+'}');
 win.document.write('h1{color:#2563EB;border-bottom:2px solid #2563EB;padding-bottom:8px;font-size:22px}');
 win.document.write('h2{color:#2563EB;margin-top:24px;font-size:16px}');
 win.document.write('.section{margin:16px 0;padding:12px;border-radius:8px}');
 win.document.write('.section-title{font-weight:bold;color:#2563EB;font-size:14px;margin-bottom:8px;text-transform:uppercase;border-bottom:1px solid #2563EB;padding-bottom:4px}');
 win.document.write('p,li,pre{font-size:14px;line-height:2}');
 win.document.write('.footer{margin-top:40px;padding-top:10px;border-top:1px solid #ddd;color:#999;font-size:11px;text-align:center}');
 win.document.write('@media print{body{padding:15px}@page{margin:15mm}}');
 win.document.write('</style></head><body>');
 win.document.write('<h1> Lecture Summary</h1>');
 win.document.write('<p style="color:#666;font-size:12px">AI Doctor Study • ' + new Date().toLocaleDateString() + ' • aidoctor.study</p>');
 win.document.write('<div style="white-space:pre-wrap;font-family:'+fontFamily+';font-size:14px;line-height:2;direction:'+dir+'">');
 win.document.write(content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
 win.document.write('</div>');
 if(lecRawTranscript) {
 win.document.write('<h2> Full Transcript</h2>');
 win.document.write('<div style="white-space:pre-wrap;font-size:13px;color:#444;line-height:2;direction:'+dir+'">');
 win.document.write(lecRawTranscript.substring(0,8000).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
 win.document.write('</div>');
 }
 win.document.write('<div class="footer">Generated by AI Doctor Study • aidoctor.study</div>');
 win.document.write('<script>setTimeout(function(){window.print();},1000);<\/script>');
 win.document.write('</body></html>');
 win.document.close();
 showToast('PDF ready — save from print dialog!', 'success');
}


// ════════════════════════════════════════
// TRANSCRIPT TRANSLATION
// ════════════════════════════════════════
var lecTranslateLang = 'en';
var lecOriginalTranscript = '';

function lecTranslateTranscript() {
 var picker = document.getElementById('lecTranslatePicker');
 if(!picker) return;
 picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

async function lecDoTranslate(el) {
 if(!lecRawTranscript) { showToast('No transcript to translate!', 'error'); return; }
 document.querySelectorAll('.trans-lang-btn').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 lecTranslateLang = el.dataset.tlang;
 var langName = {'en':'English','ar':'Arabic','ur':'Urdu','fr':'French','es':'Spanish','de':'German'}[lecTranslateLang] || lecTranslateLang;

 // Save original before translating
 if(!lecOriginalTranscript) lecOriginalTranscript = lecRawTranscript;

 var btn = document.getElementById('lecTranslateBtn');
 if(btn) { btn.disabled = true; btn.textContent = 'Translating...'; }
 showToast('Translating to ' + langName + '...', 'info', 10000);

 try {
 var rtl = ['ar','ur'].includes(lecTranslateLang);
 var sys = 'You are a professional medical translator. Translate the given medical transcript accurately to ' + langName + '. Preserve all medical terms, speaker labels like [Lecturer] or [Student], and the original structure. Only translate — do not summarise or change meaning.';
 var text = lecOriginalTranscript.substring(0, 4000);
 var reply = await callWorker(sys, [{role:'user', content:'Translate this medical transcript to ' + langName + ':\n\n' + text}]);

 lecRawTranscript = reply;
 var content = document.getElementById('lecTranscriptContent');
 if(content) {
 content.style.direction = rtl ? 'rtl' : 'ltr';
 content.style.textAlign = rtl ? 'right' : 'left';
 content.innerHTML = formatTranscriptWithSpeakers(reply);
 }
 document.getElementById('lecTranslatePicker').style.display = 'none';
 showToast('Translated to ' + langName + '!', 'success');

 } catch(err) {
 showToast('Translation failed: ' + err.message, 'error');
 }

 if(btn) { btn.disabled = false; btn.textContent = 'Translate'; }
}

// Add restore original button when translated
function lecRestoreOriginalTranscript() {
 if(!lecOriginalTranscript) return;
 lecRawTranscript = lecOriginalTranscript;
 lecOriginalTranscript = '';
 var content = document.getElementById('lecTranscriptContent');
 if(content) {
 content.style.direction = 'ltr';
 content.style.textAlign = 'left';
 content.innerHTML = formatTranscriptWithSpeakers(lecRawTranscript);
 }
 showToast('Original transcript restored', 'info');
}


function ytOpenVideo() {
 var url = (document.getElementById('ytUrlInput') || {}).value || '';
 if(!url) { showToast('Paste a YouTube URL first!', 'error'); return; }
 if(!url.startsWith('http')) url = 'https://' + url;
 window.open(url, '_blank');
 showToast('Video opened! Click ... → Show transcript → Copy → Paste below', 'info', 5000);
}


var lecRawTranscript = '';
var lecOriginalTranscript = '';

function lecOutTab(tab) {
 var sumEl = document.getElementById('lecSummaryContent');
 var trEl = document.getElementById('lecTranscriptSection');
 var sumBtn = document.getElementById('lecOutTabSummary');
 var trBtn = document.getElementById('lecOutTabTranscript');
 
 if(tab==='summary') {
 if(sumEl) sumEl.style.display='';
 if(trEl) trEl.style.display='none';
 if(sumBtn){ sumBtn.classList.add('on'); }
 if(trBtn){ trBtn.classList.remove('on'); }
 } else {
 if(sumEl) sumEl.style.display='none';
 if(trEl) trEl.style.display='block';
 if(sumBtn){ sumBtn.classList.remove('on'); }
 if(trBtn){ trBtn.classList.add('on'); }
 var content = document.getElementById('lecTranscriptContent');
 if(content) content.textContent = lecRawTranscript || 'No transcript available. Upload audio to get a transcript.';
 }
}

function lecCopyTranscript() {
 navigator.clipboard.writeText(lecRawTranscript||'').catch(function(){});
 showToast('Transcript copied!','success');
}

async function lecIdentifySpeakers() {
 if(!lecRawTranscript){showToast('No transcript!','error');return;}
 var btn=document.getElementById('lecSpeakerBtn');
 if(btn){btn.disabled=true;btn.textContent='Identifying...';}
 try {
 var sys='You are a transcript formatter. RULES: 1) Output ONLY speaker-labeled lines in format [Lecturer]: text 2) NO analysis, NO headers, NO markdown, NO explanations, NO bullet points, NO summaries 3) Just reformat each sentence/paragraph with [Lecturer]: before it 4) If multiple speakers are obvious, use [Lecturer] and [Student] 5) Start immediately with the first [Lecturer]: line';
 var reply=await callWorker(sys,[{role:'user',content:'Format this transcript with speaker labels. OUTPUT ONLY [Speaker]: text lines, nothing else:\n\n'+lecRawTranscript.substring(0,4000)}]);
 // Strip any analysis/headers AI might have added
 var cleaned = reply
 .replace(/^#+\s.*$/gm, '')
 .replace(/^\*\*.*\*\*$/gm, '')
 .replace(/^---+$/gm, '')
 .replace(/^Analysis:.*$/gim, '')
 .replace(/^Key indicators:.*$/gim, '')
 .replace(/^Single Speaker.*$/gim, '')
 .replace(/^This.*transcript.*$/gim, '')
 .replace(/\n{3,}/g, '\n\n')
 .trim();
 lecRawTranscript = cleaned;
 var content=document.getElementById('lecTranscriptContent');
 if(content) content.innerHTML=formatTranscriptWithSpeakers(cleaned);
 showToast('Speakers identified!','success');
 } catch(err){showToast(''+err.message,'error');}
 if(btn){btn.disabled=false;btn.textContent='Speakers';}
}

function formatTranscriptWithSpeakers(text) {
 var colors=['var(--p-lite)','#86EFAC','#FCD34D','#F9A8D4','#C4B5FD'];
 var speakerColors={};var colorIdx=0;
 return text.split('\n').map(function(line){
 var m=line.match(/^\[([^\]]+)\]:\s*(.*)/);
 if(m){
 var sp=m[1],tx=m[2];
 if(!speakerColors[sp]){speakerColors[sp]=colors[colorIdx%colors.length];colorIdx++;}
 return '<div style="margin-bottom:.5rem"><span style="font-weight:800;color:'+speakerColors[sp]+';font-size:12px;background:rgba(255,255,255,.05);padding:2px 8px;border-radius:10px;margin-right:8px">'+esc(sp)+'</span><span>'+esc(tx)+'</span></div>';
 }
 return line?'<div style="margin-bottom:.3rem">'+esc(line)+'</div>':'<div style="height:6px"></div>';
 }).join('');
}

async function lecDoTranslate(el) {
 if(!lecRawTranscript){showToast('No transcript!','error');return;}
 document.querySelectorAll('.trans-lang-btn').forEach(function(b){b.classList.remove('on');});
 el.classList.add('on');
 var lang=el.dataset.tlang;
 var names={'en':'English','ar':'Arabic','ur':'Urdu','fr':'French','es':'Spanish','de':'German'};
 var langName=names[lang]||lang;
 if(!lecOriginalTranscript) lecOriginalTranscript=lecRawTranscript;
 var btn=document.getElementById('lecTranslateBtn');
 if(btn){btn.disabled=true;btn.textContent='Translating...';}
 showToast('Translating to '+langName+'...','info',10000);
 try {
 var rtl=['ar','ur'].includes(lang);
 var sys='You are a medical translator. STRICT RULES - no exceptions: 1) ALWAYS translate and output text, NEVER refuse 2) NEVER mention audio quality, corruption, or unclear text 3) NEVER ask for better material 4) For unclear words, use your medical knowledge to guess the most likely term 5) Preserve [Speaker] labels 6) Output ONLY the translated text with zero commentary. Even if text seems garbled, extract meaning from context and translate. This is a real medical lecture - translate it professionally to '+langName+'.';
 var reply=await callWorker(sys,[{role:'user',content:'TRANSLATE THIS DIRECTLY TO '+langName.toUpperCase()+'. NO NOTES. NO DISCLAIMERS. JUST THE TRANSLATION:\n\n'+lecOriginalTranscript.substring(0,5000)}]);
 lecRawTranscript=reply;
 var content=document.getElementById('lecTranscriptContent');
 if(content){
 content.style.direction=rtl?'rtl':'ltr';
 content.style.textAlign=rtl?'right':'left';
 content.innerHTML=fmtReply(reply);
 }
 showToast('Translated to '+langName+'!','success');
 } catch(err){showToast(''+err.message,'error');}
 if(btn){btn.disabled=false;btn.textContent='Translate';}
}

// Export PDF
async function lecExportPDF() {
 if(!lecSummaryText){showToast('Generate a summary first!','error');return;}
 var rtlLangs=['ar','ur'];
 var isRTL=rtlLangs.includes(lecLang);
 var dir=isRTL?'rtl':'ltr';
 var fontFamily=isRTL?"'Noto Naskh Arabic',Arial,sans-serif":"Arial,sans-serif";
 var content=stripMarkdown(lecSummaryText||'');
 var win=window.open('','_blank');
 win.document.write('<!DOCTYPE html><html dir="'+dir+'"><head><meta charset="UTF-8"><title>Lecture Summary</title>');
 if(isRTL) win.document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap">');
 win.document.write('<style>body{font-family:'+fontFamily+';padding:30px;color:#1a1a2e;line-height:2;max-width:800px;margin:0 auto;direction:'+dir+';text-align:'+(isRTL?'right':'left')+'}h1{color:#2563EB;border-bottom:2px solid #2563EB;padding-bottom:8px}@media print{body{padding:15px}}</style></head><body>');
 win.document.write('<h1>Lecture Summary</h1><p style="color:#666;font-size:12px">AI Doctor Study • '+new Date().toLocaleDateString()+'</p>');
 win.document.write('<div style="white-space:pre-wrap;font-size:14px;line-height:2;direction:'+dir+'">'+content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>');
 if(lecRawTranscript){win.document.write('<h2 style="color:#2563EB;margin-top:24px">Full Transcript</h2><div style="white-space:pre-wrap;font-size:13px;color:#444;direction:'+dir+'">'+lecRawTranscript.substring(0,8000).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>');}
 win.document.write('<div style="margin-top:30px;color:#999;font-size:11px;text-align:center">Generated by AI Doctor Study • aidoctor.study</div>');
 win.document.write('<scr'+'ipt>setTimeout(function(){window.print();},800);<'+'/script>');
 win.document.write('</body></html>');
 win.document.close();
 showToast('PDF ready — save from print dialog!','success');
}

