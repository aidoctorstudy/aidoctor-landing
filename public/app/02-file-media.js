// ════════════════════════════════════════════════
// LANGUAGE DETECTION & SELECTION
// ════════════════════════════════════════════════
var lecLang = 'auto';
var snapLang = 'auto';

var LANG_NAMES = {
 'auto': 'the same language as the content',
 'en': 'English',
 'ar': 'Arabic',
 'ur': 'Urdu',
 'fr': 'French',
 'es': 'Spanish',
 'de': 'German'
};

var SPEECH_LANGS = {
 'en': 'en-US', 'ar': 'ar-SA', 'ur': 'ur-PK',
 'fr': 'fr-FR', 'es': 'es-ES', 'de': 'de-DE'
};

function lecPickLang(el) {
 document.querySelectorAll('.lang-btn[data-lang]').forEach(function(b){ b.classList.remove('on'); });
 // Activate all buttons with same lang (there are 2 selectors)
 document.querySelectorAll('.lang-btn[data-lang="'+el.dataset.lang+'"]').forEach(function(b){ b.classList.add('on'); });
 lecLang = el.dataset.lang;
 window._lecRecordLang = SPEECH_LANGS[lecLang] || 'en-US';
 showToast('Language: ' + (LANG_NAMES[lecLang] || lecLang) + ' — click Summarise to regenerate', 'info', 2500);
}

function snapPickLang(el) {
 document.querySelectorAll('#snapLangSelector .lang-btn').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 snapLang = el.dataset.lang;
 showToast('Output language: ' + (LANG_NAMES[snapLang] || snapLang), 'info', 2000);
}

function getLangInstruction(lang, contentHint) {
 if(lang === 'auto') {
 return 'IMPORTANT: Detect the language of the content and respond in that SAME language. If the content is in Arabic, respond in Arabic. If Urdu, respond in Urdu. If English, respond in English. Match the language exactly.' + (contentHint ? ' Content hint: ' + contentHint : '');
 }
 var extraNote = lang === 'ps' ? ' Use Pakistani Peshawari Pashto dialect (Yousafzai). Write in Pashto script.' : '';
 return 'IMPORTANT: Always respond in ' + (LANG_NAMES[lang] || lang) + ' regardless of the input language.' + extraNote;
}

function detectLangFromText(text) {
 // Simple heuristic detection
 var arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
 var urduChars = (text.match(/[؀-ۿݐ-ݿ]/g) || []).length;
 var chineseChars = (text.match(/[一-鿿]/g) || []).length;
 var total = text.length;
 if(arabicChars / total > 0.2) return 'ar';
 if(chineseChars / total > 0.1) return 'zh';
 return 'en'; // default
}

function showDetectedLang(elemId, lang) {
 var el = document.getElementById(elemId);
 if(!el) return;
 var names = {'en':'English','ar':'Arabic','ur':'Urdu','fr':'French','es':'Spanish','zh':'Chinese'};
 el.textContent = 'Detected: ' + (names[lang] || lang);
 el.classList.add('on');
 setTimeout(function(){ el.classList.remove('on'); }, 4000);
}


// ════════════════════════════════════════════════
// PPTX EXTRACTION HELPERS
// ════════════════════════════════════════════════
async function extractPPTX(file) {
 if(typeof JSZip === 'undefined') return '';
 try {
 var ab = await file.arrayBuffer();
 var zip = await JSZip.loadAsync(ab);
 var slideTexts = [];
 // Get slides sorted by number
 var slideFiles = Object.keys(zip.files)
 .filter(function(f){ 
 return /ppt\/slides\/slide\d+\.xml$/.test(f); 
 })
 .sort(function(a,b){ 
 return parseInt(a.match(/slide(\d+)/)[1]) - parseInt(b.match(/slide(\d+)/)[1]); 
 });
 
 for(var i=0; i<slideFiles.length; i++) {
 var xml = await zip.files[slideFiles[i]].async('string');
 // Extract all text nodes from XML
 var texts = [];
 var regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
 var match;
 while((match = regex.exec(xml)) !== null) {
 var t = match[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim();
 if(t) texts.push(t);
 }
 // Also extract from title/body placeholders
 var slideContent = texts.join(' ').trim();
 if(slideContent) slideTexts.push('--- Slide ' + (i+1) + ' ---\n' + slideContent);
 }
 return slideTexts.join('\n\n');
 } catch(e) {
 console.log('PPTX extract error:', e);
 return '';
 }
}

async function pptxToImage(file) {
 // Convert first slide of PPTX to image using canvas
 // This uses a lightweight approach - render XML shapes to canvas
 try {
 if(typeof JSZip === 'undefined') return null;
 var ab = await file.arrayBuffer();
 var zip = await JSZip.loadAsync(ab);
 
 // Get slide 1 image if it has embedded images
 var mediaFiles = Object.keys(zip.files)
 .filter(function(f){ return f.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif)$/i.test(f); });
 
 if(mediaFiles.length > 0) {
 // Return first image from slides as base64
 var imgData = await zip.files[mediaFiles[0]].async('base64');
 var ext2 = mediaFiles[0].split('.').pop().toLowerCase();
 var mime = ext2 === 'png' ? 'image/png' : 'image/jpeg';
 return 'data:' + mime + ';base64,' + imgData;
 }
 
 // If no embedded images, render text to canvas
 var slideFiles2 = Object.keys(zip.files)
 .filter(function(f){ return /ppt\/slides\/slide\d+\.xml$/.test(f); })
 .sort(function(a,b){ return parseInt(a.match(/slide(\d+)/)[1]) - parseInt(b.match(/slide(\d+)/)[1]); });
 
 if(!slideFiles2.length) return null;
 var xml = await zip.files[slideFiles2[0]].async('string');
 var texts = [];
 var re2 = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
 var m2;
 while((m2 = re2.exec(xml)) !== null) {
 var t2 = m2[1].trim();
 if(t2) texts.push(t2);
 }
 
 // Render to canvas
 var canvas = document.createElement('canvas');
 canvas.width = 800; canvas.height = 600;
 var ctx = canvas.getContext('2d');
 ctx.fillStyle = '#1a1a2e';
 ctx.fillRect(0,0,800,600);
 ctx.fillStyle = 'var(--p-lite)';
 ctx.font = 'bold 24px Arial';
 ctx.fillText(file.name.replace('.pptx',''), 20, 50);
 ctx.fillStyle = '#e2e8f0';
 ctx.font = '16px Arial';
 var y = 90;
 texts.slice(0, 25).forEach(function(t3) {
 if(y > 570) return;
 ctx.fillText(t3.substring(0,80), 20, y);
 y += 24;
 });
 return canvas.toDataURL('image/jpeg', 0.8);
 } catch(e) { return null; }
}


// ── Strip markdown for clipboard copy ──
function stripMarkdown(text) {
 return text
 .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
 .replace(/\*([^*]+)\*/g, '$1') // *italic*
 .replace(/`([^`]+)`/g, '$1') // `code`
 .replace(/^#{1,6}\s+/gm, '') // # headings
 .replace(/^[\*\-]\s/gm, '• ') // bullets
 .replace(/&amp;/g, '&')
 .replace(/&lt;/g, '<')
 .replace(/&gt;/g, '>')
 .replace(/&quot;/g, '"')
 .trim();
}


// ════════════════════════════════════════════════
// AUDIO UPLOAD HANDLER (Podcast Mode)
// ════════════════════════════════════════════════
async function handleAudioUpload(e) {
 var file = e.target.files[0];
 if(!file) return;
 e.target.value = '';
 var name = file.name;
 var sizeMB = (file.size / 1024 / 1024).toFixed(1);

 // Show file info
 var fileInfo = document.getElementById('podFileInfo');
 if(fileInfo) {
 fileInfo.style.display = 'flex';
 var fn = document.getElementById('podFileName');
 var fs = document.getElementById('podFileSize');
 if(fn) fn.textContent = name;
 if(fs) fs.textContent = sizeMB + ' MB';
 }

 // Audio player
 var audioPlayer = document.getElementById('podAudioPlayer');
 if(audioPlayer) {
 audioPlayer.src = URL.createObjectURL(file);
 audioPlayer.style.display = 'block';
 audioPlayer.load();
 }

 window._podAudioFile = file;
 // Transcribe using Groq Whisper via Worker /transcribe endpoint
 showToast('Transcribing audio... please wait', 'info', 30000);
 var transcribeBtn = document.getElementById('podTranscribeBtn');
 if(transcribeBtn) transcribeBtn.disabled = true;

 try {
 var formData = new FormData();
 formData.append('audio', file, name);
 if(typeof window._lecRecordLang !== 'undefined' && window._lecRecordLang && window._lecRecordLang !== 'auto') formData.append('language', window._lecRecordLang);

 var res = await fetch(WU + '/transcribe', {
 method: 'POST',
 body: formData
 });

 var rawResp = await res.text();
 var data;
 try { data = JSON.parse(rawResp); } catch(e) { throw new Error('Worker error: ' + rawResp.substring(0,100)); }
 if(data.error) throw new Error(data.error);
 var transcript = data.transcript || '';

 if(!transcript || transcript.length < 10) throw new Error('Empty transcript — check GROQ_KEY in Cloudflare Worker');

 // Put transcript in text area
 var notesInput = document.getElementById('podNotesInput');
 if(notesInput) notesInput.value = transcript;

 showToast('Transcribed! Generating summary...', 'success');

 // Auto-generate summary
 setTimeout(function(){ genPodcast(); }, 500);

 } catch(err) {
 showToast('' + err.message + ' — make sure Worker has /transcribe endpoint', 'error', 6000);
 // Fallback: use filename as topic
 var topic = name.replace(/\.(mp3|wav|m4a|ogg|webm)$/i,'').replace(/[-_]/g,' ');
 var notesInput = document.getElementById('podNotesInput');
 if(notesInput && !notesInput.value.trim()) {
 notesInput.value = 'Medical lecture about: ' + topic;
 }
 }
 if(transcribeBtn) transcribeBtn.disabled = false;
}


async function lecHandleAudio(e) {
 var file = e.target.files[0];
 if(!file) return;
 e.target.value = '';

 // Store file globally for summariseLecture to use
 window._lecAudioFile = file;

 var name = file.name;
 var sizeMB = (file.size/1024/1024).toFixed(1);
 var info = document.getElementById('lecAudioInfo');
 var nameEl = document.getElementById('lecAudioName');
 var statusEl = document.getElementById('lecAudioStatus');
 if(info) info.style.display = 'block';
 if(nameEl) nameEl.textContent = '' + name + ' (' + sizeMB + ' MB)';
 if(statusEl) statusEl.textContent = 'Ready — click Summarise Lecture below';
 showToast('Audio loaded! Click Summarise Lecture to transcribe + summarise.', 'success', 4000);
}


async function summariseLecture() {
 var btn = document.getElementById('lecSumBtn');
 if(btn) { btn.disabled = true; btn.textContent = 'Working...'; }

 try {
 var text = '';
 var imgD = window._lecImageData || null;

 // STEP 1: If audio file is waiting, transcribe it first
 if(window._lecAudioFile) {
 showToast('Transcribing audio...', 'info', 20000);
 if(btn) btn.textContent = 'Transcribing...';
 try {
 var fd = new FormData();
 var audioFile = window._lecAudioFile;
 fd.append('audio', audioFile, audioFile.name || 'lecture.mp3');
 if(typeof lecLang !== 'undefined' && lecLang && lecLang !== 'auto') fd.append('language', lecLang);
 if(btn) btn.textContent = 'Transcribing (' + (audioFile.size/1024/1024).toFixed(1) + 'MB)...';
 var tr = await fetch(WU + '/transcribe', {method:'POST', body:fd});
 var rawText = await tr.text();
 var td;
 try { td = JSON.parse(rawText); } catch(e) { throw new Error('Worker response error: ' + rawText.substring(0,100)); }
 if(td.error) throw new Error('Transcription error: ' + td.error);
 text = td.transcript || '';
 if(text.length > 10) {
 lecRawTranscript = text;
 var ta2 = document.getElementById('lecTextInput');
 if(ta2) ta2.value = text;
 window._lecAudioFile = null;
 showToast('Transcribed ' + text.split(' ').length + ' words!', 'success');
 } else {
 throw new Error('Groq returned empty transcript. Check GROQ_KEY in Cloudflare Worker settings.');
 }
 } catch(tErr) {
 showToast('Transcription failed: ' + tErr.message, 'error');
 if(btn) { btn.disabled = false; btn.textContent = 'Summarise Lecture'; }
 return;
 }
 }

 // STEP 2: Get text from any available source
 if(!text) text = (document.getElementById('lecTextInput') || {}).value || '';
 if(!text) text = (document.getElementById('lecTranscript') || {}).value || '';

 if(!text.trim() && !imgD) {
 showToast('Please paste text, upload a file, or record audio first!', 'error');
 if(btn) { btn.disabled = false; btn.textContent = 'Summarise Lecture'; }
 return;
 }

 // STEP 3: Show loading
 if(btn) btn.textContent = 'Summarising...';
 var loading = document.getElementById('lecLoading');
 var output = document.getElementById('lecOutput');
 if(loading) loading.style.display = 'flex';
 if(output) output.classList.remove('on');

 // STEP 4: Call AI
 var detectedLang = text ? detectLangFromText(text) : 'en';
 if(lecLang === 'auto') showDetectedLang('lecDetectedLang', detectedLang);
 var langInstr = getLangInstruction(lecLang, null);
 var sys = 'You are an expert medical lecture summariser specialising in handling imperfect transcriptions. ' + langInstr + ' IMPORTANT: The text may contain transcription errors, unclear words, or mixed languages - this is normal for audio transcriptions. DO NOT mention transcription quality or ask for better material. Instead: identify the medical topic from context clues, use your medical knowledge to fill in gaps, and provide a complete accurate medical summary as if you have perfect notes. Create a comprehensive summary. Reply in this EXACT format:\nQUICK SUMMARY:\n[2-3 sentences about the medical topic]\nKEY POINTS:\n• [point 1]\n• [point 2]\n• [point 3]\n• [point 4]\n• [point 5]\nIMPORTANT TERMS:\n[Term 1]: [definition]\n[Term 2]: [definition]\n[Term 3]: [definition]\n[Term 4]: [definition]\n[Term 5]: [definition]\nWHAT TO REMEMBER:\n• [point 1]\n• [point 2]\n• [point 3]\nCLINICAL PEARLS:\n• [pearl 1]\n• [pearl 2]\n• [pearl 3]\nREVISION QUESTIONS:\n1. [question]\n2. [question]\n3. [question]\nComplete ALL sections. Never complain about audio quality.';
 window._lecImageData = null;
 var reply = await callWorker(sys, [{role:'user', content:'This is a medical lecture transcript (may contain transcription errors from audio - ignore errors and extract medical content):\n\n' + text.substring(0,4000)}], imgD);

 // STEP 5: Show result
 lecSummaryText = reply;
 renderLecSummary(reply);
 if(loading) loading.style.display = 'none';
 if(output) output.classList.add('on');
 updateXP(20);
 showToast('Summary ready! +20 XP', 'success');
 if(typeof trackActivity === 'function') trackActivity();

 } catch(err) {
 var loading2 = document.getElementById('lecLoading');
 if(loading2) loading2.style.display = 'none';
 showToast('Error: ' + err.message, 'error');
 }

 if(btn) { btn.disabled = false; btn.textContent = 'Summarise Lecture'; }
}


async function genPodcast() {
 var text = (document.getElementById('podNotesInput') || {}).value || '';
 if(!text.trim()) { showToast('Please add notes or upload audio first!', 'error'); return; }
 var btn = document.getElementById('podGenBtn');
 if(btn) { btn.disabled = true; btn.textContent = 'Generating...'; }
 try {
 var sys = 'You are an expert medical educator creating podcast-style study notes. Create engaging, conversational medical study content with key points, mnemonics, and clinical pearls. Format clearly with sections.';
 var reply = await callWorker(sys, [{role:'user', content:'Create medical study notes for: ' + text.substring(0,3000)}]);
 var out = document.getElementById('podTranscript');
 if(out) { out.innerHTML = fmtReply(reply); out.style.display = 'block'; }
 updateXP(15);
 showToast('Notes generated! +15 XP', 'success');
 } catch(err) { showToast('' + err.message, 'error'); }
 if(btn) { btn.disabled = false; btn.textContent = 'Generate'; }
}

