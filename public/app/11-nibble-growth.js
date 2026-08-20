// ════════════════════════════════════════════════
// NIBBLE MODE
// ════════════════════════════════════════════════
var nibbleTopic = 'Pharmacology';
var nibbleMode = 'revision';
var nibbleCards = [];
var nibbleIdx = 0;
var nibbleXPToday = 0;
var nibbleVoicePlaying = false;
var nibbleSavedCards = JSON.parse(localStorage.getItem('nibble_saved') || '[]');
var nibbleStreak = 0;
var nibbleAnswered = {};

var NIBBLE_TOPICS = ['Pharmacology','Anatomy','Physiology','Pathology','Microbiology','Medicine','Surgery','Cardiology','Neurology','Biochemistry'];

var NIBBLE_MODE_PROMPTS = {
 revision: 'Ultra-concise high-yield revision style. Maximum 3 sentences per concept. Focus on exam facts.',
 exam: 'USMLE/PLAB exam-focused. Include what examiners test. Use clinical vignette style.',
 clinical: 'Clinical application focus. Real patient scenarios. Practical management points.',
 simple: 'Explain like I am 12 years old. Use simple analogies and everyday language. Fun and memorable.'
};

function nibblePickTopic(el) {
 document.querySelectorAll('.nibble-topic-btn').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 nibbleTopic = el.dataset.topic;
}

function nibblePickMode(el) {
 document.querySelectorAll('.nibble-mode-btn').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 nibbleMode = el.dataset.nmode;
}

function nibbleCustomTopic() {
 var topic = prompt('Enter medical topic to nibble:');
 if(!topic) return;
 nibbleTopic = topic;
 document.querySelectorAll('.nibble-topic-btn').forEach(function(b){ b.classList.remove('on'); });
 showToast('Topic set: ' + topic, 'info');
}

async function nibbleGenerate() {
 var count = Math.min(20, Math.max(3, parseInt(document.getElementById('nibbleCardCount').value) || 8));
 var btn = document.getElementById('nibbleGenBtn');
 btn.disabled = true; btn.textContent = 'Generating...';

 // Show loading
 var feed = document.getElementById('nibbleFeed');
 feed.innerHTML = '<div class="nibble-loading"><div class="lec-loading-dots"><div class="lec-dot"></div><div class="lec-dot"></div><div class="lec-dot"></div></div><p style="color:var(--tx2);font-size:14px;font-weight:600">Making your ' + count + ' nibble cards...</p></div>';

 var sys = 'You are a medical education expert creating TikTok-style study cards for medical students. Mode: ' + (NIBBLE_MODE_PROMPTS[nibbleMode]||NIBBLE_MODE_PROMPTS.revision) + ' Create exactly ' + count + ' varied study cards about ' + nibbleTopic + '. Return ONLY a raw JSON array. Each card must have: {"type":"concept|mnemonic|pearl|mcq|case|drug","title":"short catchy title","body":"main explanation (2-4 sentences max)","highlight":"one key exam fact","mnemonic":"memory trick (if relevant, else empty string)","mcq":{"q":"question","opts":["A","B","C","D"],"ans":"A","exp":"brief explanation"} or null,"image":"wikipedia article name"}. REQUIRED: every card MUST include the image field set to the most relevant Wikipedia article name for the topic, like "Myocardial infarction" or "Femoral nerve" - use the disease/structure/drug name itself, not descriptive phrases. Mix types for variety. Keep everything SHORT and HIGH-YIELD. No markdown, pure JSON.';

 try {
 var reply = await callWorker(sys, [{role:'user', content:'Generate ' + count + ' ' + nibbleTopic + ' nibble cards in ' + nibbleMode + ' mode.'}]);
 var raw = reply.replace(/```json|```/g,'').trim();
 nibbleCards = JSON.parse(raw);
 if(!nibbleCards || nibbleCards.length < 2) throw new Error('Not enough cards');
 } catch(e) {
 nibbleCards = nibbleFallbackCards();
 }

 nibbleIdx = 0;
 nibbleAnswered = {};
 nibbleRenderFeed();
 btn.disabled = false; btn.textContent = 'Start Nibbling!';
}

function nibbleFallbackCards() {
 return [
 {type:'concept',title:'Beta Blockers',body:'Block β1 receptors → reduce HR and BP. β1-selective: Metoprolol, Atenolol. Non-selective: Propranolol (also blocks β2).',highlight:'Avoid in asthma — β2 blockade causes bronchoconstriction!',mnemonic:'A-M-E-P = Atenolol, Metoprolol are cardio-sElective β-blockers for Pressure',mcq:{q:'Which beta blocker is cardioselective?',opts:['A. Propranolol','B. Metoprolol','C. Carvedilol','D. Labetalol'],ans:'B',exp:'Metoprolol is β1-selective (cardioselective). Propranolol blocks both β1 and β2.'},emoji:''},
 {type:'mnemonic',title:'ACE Inhibitors',body:'End in -pril. Mechanism: Block ACE → less Angiotensin II → vasodilation + less aldosterone. First line in diabetes + HTN.',highlight:'Side effect: Dry cough (bradykinin accumulation) — switch to ARB!',mnemonic:'CAPTOPRIL = C=Cough, A=Angioedema, P=Potassium↑, T=Teratogenic',mcq:{q:'ACE inhibitor causes cough due to:',opts:['A. Bradykinin accumulation','B. Histamine release','C. Direct airway irritation','D. Increased mucus'],ans:'A',exp:'ACE normally breaks down bradykinin. Inhibiting ACE → bradykinin accumulates → cough.'},emoji:''},
 {type:'pearl',title:'Statins',body:'HMG-CoA reductase inhibitors. Reduce LDL, stabilize plaques. Used in CVD prevention. Take at night (cholesterol synthesis peaks at night).',highlight:'Side effect: Myopathy/Rhabdomyolysis — check CK if muscle pain!',mnemonic:'LOVASTATin = Liver, cO-enzyme Q10 depleted, Vasculoprotective, At night, STATin',mcq:{q:'Statins work by inhibiting:',opts:['A. Cholesterol absorption','B. HMG-CoA reductase','C. PCSK9','D. Bile acid reabsorption'],ans:'B',exp:'Statins inhibit HMG-CoA reductase, the rate-limiting step in cholesterol synthesis.'},emoji:''},
 ];
}

function nibbleRenderFeed() {
 var feed = document.getElementById('nibbleFeed');
 feed.innerHTML = '';
 nibbleCards.forEach(function(card, i) {
 var div = document.createElement('div');
 div.className = 'nibble-card';
 div.id = 'nibble-card-' + i;
 div.innerHTML = nibbleBuildCard(card, i);
 feed.appendChild(div);
 });
 // Add "more" card at end
 var moreDiv = document.createElement('div');
 moreDiv.className = 'nibble-card';
 moreDiv.innerHTML = '<div class="nibble-setup" style="padding:2rem"><div style="font-size:48px;margin-bottom:1rem"></div><h3 style="font-weight:900;margin-bottom:.5rem">Session Complete!</h3><p style="font-size:13px;color:var(--tx2);margin-bottom:1.5rem">You earned ' + (nibbleCards.length * 5) + ' XP!</p><button class="nibble-gen-btn" onclick="nibbleGenerate()"> New Nibbles</button><button onclick="nibbleGoSetup()" style="margin-top:.8rem;width:100%;padding:12px;border:1px solid var(--bd);background:transparent;color:var(--tx2);border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--f)">Change Topic</button></div>';
 feed.appendChild(moreDiv);

 // TikTok-style: observe cards entering view - trigger animations, lazy-load images, auto-narrate
 if(window._nibbleObserver) window._nibbleObserver.disconnect();
 window._nibbleObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
   if(entry.isIntersecting) {
    var cardEl = entry.target;
    cardEl.classList.add('nibble-active');
    // lazy-load wikipedia image
    var imgDiv = cardEl.querySelector('.nibble-card-img');
    if(imgDiv && !imgDiv.dataset.loaded) {
     imgDiv.dataset.loaded = '1';
     var term = imgDiv.dataset.imgterm;
     if(term && typeof fetchWikiImage === 'function') {
      fetchWikiImage(term).then(function(src) {
       if(src) { imgDiv.style.backgroundImage = 'url(' + src + ')'; imgDiv.classList.add('on'); }
      });
     }
    }
    // auto-narrate if voice is on
    var idx = parseInt((cardEl.id||'').replace('nibble-card-','') || '-1');
    if(nibbleVoicePlaying && idx >= 0 && nibbleCards[idx] && window.speechSynthesis) {
     window.speechSynthesis.cancel();
     var c = nibbleCards[idx];
     var utt = new SpeechSynthesisUtterance(c.title + '. ' + (c.body||'').replace(/<[^>]*>/g,''));
     utt.rate = 1.05;
     window.speechSynthesis.speak(utt);
    }
   } else {
    entry.target.classList.remove('nibble-active');
   }
  });
 }, { threshold: 0.6 });
 document.querySelectorAll('.nibble-card').forEach(function(c) { window._nibbleObserver.observe(c); });

 // Show nav
 document.getElementById('nibbleNav').style.display = 'flex';
 document.getElementById('nibbleSetupCard') && (document.getElementById('nibbleSetupCard').style.display = 'none');
 nibbleUpdateNav();
 updateXP(nibbleCards.length * 5);
 nibbleXPToday += nibbleCards.length * 5;
 var xpEl = document.getElementById('nibbleXPToday');
 if(xpEl) xpEl.textContent = nibbleXPToday;
 showToast('' + nibbleCards.length + ' nibble cards ready! +' + (nibbleCards.length*5) + ' XP', 'xp');
}

function nibbleBuildCard(card, i) {
 var typeColors = {concept:'concept',mnemonic:'mnemonic',pearl:'pearl',mcq:'mcq',case:'case',drug:'drug'};
 var cls = typeColors[card.type] || 'concept';
 var typeLabels = {concept:'Concept',mnemonic:'Mnemonic',pearl:'Clinical Pearl',mcq:'Quick Quiz',case:'Case',drug:'Drug Fact'};

 var html = '<div class="nibble-card-inner nibble-vibe-' + cls + '">';
 html += '<div class="nibble-orb nibble-orb-1"></div><div class="nibble-orb nibble-orb-2"></div>';
 html += '<span class="nibble-card-type ' + cls + '">' + (typeLabels[card.type]||card.type) + '</span>';
 if(card.image) html += '<div class="nibble-card-img" id="nibble-img-' + i + '" data-imgterm="' + esc(card.image) + '"></div>';
 html += '<div class="nibble-card-title nibble-anim-1">' + esc(card.title) + '</div>';
 html += '<div class="nibble-card-body nibble-anim-2">' + fmtReply(card.body||'') + '</div>';

 if(card.highlight) {
 html += '<div class="nibble-card-highlight nibble-anim-3">' + esc(card.highlight) + '</div>';
 }
 if(card.mnemonic) {
 html += '<div class="nibble-card-mnemonic nibble-anim-3"><strong>Memory:</strong> ' + esc(card.mnemonic) + '</div>';
 }

 // MCQ if present
 if(card.mcq) {
 html += '<div class="nibble-mcq">';
 html += '<div class="nibble-mcq-q"> ' + esc(card.mcq.q) + '</div>';
 html += '<div class="nibble-mcq-opts" id="nibble-mcq-' + i + '">';
 (card.mcq.opts||[]).forEach(function(opt, oi) {
 html += '<button class="nibble-mcq-opt" onclick="nibbleAnswer(' + i + ',' + oi + ')" data-idx="' + oi + '">' + esc(opt) + '</button>';
 });
 html += '</div>';
 html += '<div id="nibble-exp-' + i + '" style="display:none;margin-top:.6rem;padding:.8rem;background:rgba(37,99,235,.08);border:1px solid rgba(37,99,235,.2);border-radius:10px;font-size:12px;color:var(--p-lite)"></div>';
 html += '</div>';
 }

 // Action buttons
 html += '<div class="nibble-actions">';
 html += '<button class="nibble-act" onclick="nibbleSave(' + i + ')" id="nibble-save-' + i + '"> Save</button>';
 html += '<button class="nibble-act" onclick="nibbleToFlashcard(' + i + ')"> Flashcard</button>';
 html += '<button class="nibble-act" onclick="nibbleReadAloud(' + i + ')"> Read</button>';
 html += '<button class="nibble-act" onclick="nibbleShare(' + i + ')"> Share</button>';
 html += '</div>';
 html += '</div>';
 return html;
}

function nibbleAnswer(cardIdx, optIdx) {
 if(nibbleAnswered[cardIdx]) return;
 nibbleAnswered[cardIdx] = true;
 var card = nibbleCards[cardIdx];
 if(!card || !card.mcq) return;
 var ansIdx = ['A','B','C','D'].indexOf(card.mcq.ans);
 var opts = document.querySelectorAll('#nibble-mcq-' + cardIdx + ' .nibble-mcq-opt');
 opts.forEach(function(btn, i) {
 btn.disabled = true;
 if(i === ansIdx) btn.classList.add('correct');
 else if(i === optIdx && optIdx !== ansIdx) btn.classList.add('wrong');
 });
 var expEl = document.getElementById('nibble-exp-' + cardIdx);
 if(expEl) { expEl.style.display = 'block'; expEl.textContent = (optIdx === ansIdx ? ' ' : ' ') + (card.mcq.exp||''); }
 var isCorrect = optIdx === ansIdx;
 var xp = isCorrect ? 10 : 3;
 updateXP(xp);
 nibbleXPToday += xp;
 var xpEl = document.getElementById('nibbleXPToday');
 if(xpEl) xpEl.textContent = nibbleXPToday;
 nibbleShowXPBurst(isCorrect ? '+10 XP ' : '+3 XP');
 if(!isCorrect && typeof addMistake === 'function') {
 addMistake('mcq', card.mcq.q, (card.mcq.opts[optIdx]||''), (card.mcq.opts[ansIdx]||''), card.mcq.exp||'');
 }
}

function nibbleShowXPBurst(text) {
 var el = document.createElement('div');
 el.className = 'nibble-xp-burst';
 el.textContent = text;
 document.body.appendChild(el);
 setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 1100);
}

function nibbleSave(i) {
 var card = nibbleCards[i];
 if(!card) return;
 var exists = nibbleSavedCards.findIndex(function(c){ return c.title === card.title; });
 var btn = document.getElementById('nibble-save-' + i);
 if(exists > -1) {
 nibbleSavedCards.splice(exists, 1);
 if(btn) { btn.textContent = 'Save'; btn.classList.remove('saved'); }
 showToast('Removed from saved', 'info');
 } else {
 nibbleSavedCards.push(card);
 if(btn) { btn.textContent = 'Saved'; btn.classList.add('saved'); }
 showToast('Card saved!', 'success');
 }
 localStorage.setItem('nibble_saved', JSON.stringify(nibbleSavedCards));
}

function nibbleToFlashcard(i) {
 var card = nibbleCards[i];
 if(!card) return;
 if(typeof srsAddCards === 'function') {
 srsAddCards([{q:card.title + '?', a:(card.highlight||card.body||'').substring(0,200)}], 'Nibble: ' + nibbleTopic);
 showToast('Added to Review Queue!', 'success');
 } else {
 var ta = document.getElementById('fcNotes');
 if(ta) { ta.value += (card.title + ': ' + (card.body||'') + '\n'); goPanel('flash'); }
 }
}

function nibbleReadAloud(i) {
 var card = nibbleCards[i];
 if(!card) return;
 var text = card.title + '. ' + (card.body||'') + '. Key fact: ' + (card.highlight||'') + (card.mnemonic ? '. Memory trick: ' + card.mnemonic : '');
 if(window.speechSynthesis) {
 window.speechSynthesis.cancel();
 var utt = new SpeechSynthesisUtterance(text);
 utt.rate = 1.1; utt.lang = 'en-US';
 window.speechSynthesis.speak(utt);
 showToast('Reading card...', 'info');
 }
}

function nibbleToggleVoice() {
 nibbleVoicePlaying = !nibbleVoicePlaying;
 var btn = document.getElementById('nibbleVoiceBtn');
 if(nibbleVoicePlaying) {
 btn.textContent = 'Stop';
 btn.classList.add('playing');
 nibbleReadAloud(nibbleIdx);
 } else {
 window.speechSynthesis && window.speechSynthesis.cancel();
 btn.textContent = 'Voice';
 btn.classList.remove('playing');
 }
}

function nibbleShare(i) {
 var card = nibbleCards[i];
 if(!card) return;
 var text = ' Medical Nibble: ' + card.title + '\n\n' + (card.highlight||card.body||'') + (card.mnemonic ? '\n\n ' + card.mnemonic : '') + '\n\nStudy smarter at aidoctor.study';
 navigator.clipboard.writeText(text).catch(function(){});
 showToast('Card copied — share on WhatsApp/Instagram!', 'success');
}

function nibbleNext() {
 var cards = document.querySelectorAll('#nibbleFeed .nibble-card');
 nibbleIdx = Math.min(nibbleIdx + 1, cards.length - 1);
 if(cards[nibbleIdx]) cards[nibbleIdx].scrollIntoView({behavior:'smooth', block:'start'});
 nibbleUpdateNav();
 if(nibbleVoicePlaying && nibbleCards[nibbleIdx]) nibbleReadAloud(nibbleIdx);
}

function nibblePrev() {
 var cards = document.querySelectorAll('#nibbleFeed .nibble-card');
 nibbleIdx = Math.max(nibbleIdx - 1, 0);
 if(cards[nibbleIdx]) cards[nibbleIdx].scrollIntoView({behavior:'smooth', block:'start'});
 nibbleUpdateNav();
}

function nibbleUpdateNav() {
 var total = nibbleCards.length;
 var pct = total > 0 ? Math.round((nibbleIdx / total) * 100) : 0;
 var fill = document.getElementById('nibbleProgressFill');
 var num = document.getElementById('nibbleCardNum');
 if(fill) fill.style.width = pct + '%';
 if(num) num.textContent = (nibbleIdx + 1) + ' / ' + (total + 1);
}

function nibbleGoSetup() {
 nibbleCards = [];
 var feed = document.getElementById('nibbleFeed');
 feed.innerHTML = '<div class="nibble-card" id="nibbleSetupCard"><div class="nibble-setup"><div class="nibble-setup-icon"></div><h2 style="font-size:1.4rem;font-weight:900;margin-bottom:.5rem">Nibble Mode</h2><p style="font-size:14px;color:var(--tx2);max-width:300px;line-height:1.6">TikTok-style medical study bites.</p><div class="nibble-mode-row" style="margin-top:1.2rem"><button class="nibble-mode-btn on" data-nmode="revision" onclick="nibblePickMode(this)"> Quick Revision</button><button class="nibble-mode-btn" data-nmode="exam" onclick="nibblePickMode(this)"> Exam Mode</button><button class="nibble-mode-btn" data-nmode="clinical" onclick="nibblePickMode(this)"> Clinical</button><button class="nibble-mode-btn" data-nmode="simple" onclick="nibblePickMode(this)"> ELI12</button></div><input type="number" id="nibbleCardCount" class="nibble-custom-input" style="max-width:200px;margin-top:.8rem" value="8" min="3" max="20" placeholder="Number of cards"/><button class="nibble-gen-btn" id="nibbleGenBtn" onclick="nibbleGenerate()"> Start Nibbling!</button></div></div>';
 document.getElementById('nibbleNav').style.display = 'none';
 nibbleIdx = 0;
}

// Swipe gesture support
(function() {
 var startY = 0;
 document.addEventListener('touchstart', function(e) {
 if(e.target.closest('#nibbleFeed')) startY = e.touches[0].clientY;
 }, {passive:true});
 document.addEventListener('touchend', function(e) {
 if(!e.target.closest('#nibbleFeed')) return;
 var diff = startY - e.changedTouches[0].clientY;
 if(Math.abs(diff) > 50) {
 if(diff > 0) nibbleNext(); else nibblePrev();
 }
 }, {passive:true});
})();

// Init nibble XP from today
setTimeout(function(){
 var today = new Date().toISOString().split('T')[0];
 nibbleXPToday = parseInt(localStorage.getItem('aid_today_xp_' + today) || '0');
 var el = document.getElementById('nibbleXPToday');
 if(el) el.textContent = nibbleXPToday;
}, 600);


// ════════════════════════════════════════════════
// GROWTH MODE
// ════════════════════════════════════════════════
var growthCoachHist = [];
var lockInDuration = 25;
var lockInSeconds = 0;
var lockInTotalSeconds = 0;
var lockInInterval = null;
var lockInRunning = false;
var lockInSession = 1;
var lockInFocusHours = parseFloat(localStorage.getItem('growth_focus_hours') || '0');

var GROWTH_LEVELS = [
 {name:'Seedling Student',icon:'',min:0,max:500},
 {name:'Focused Learner',icon:'',min:500,max:1200},
 {name:'Study Warrior',icon:'',min:1200,max:2500},
 {name:'Knowledge Hunter',icon:'',min:2500,max:4500},
 {name:'Exam Crusher',icon:'',min:4500,max:7000},
 {name:'Clinical Thinker',icon:'',min:7000,max:10000},
 {name:'Future Doctor',icon:'',min:10000,max:15000},
 {name:'Medical Legend',icon:'',min:15000,max:999999}
];

var HABITS = [
 {id:'study',label:'Study 2+ hours',icon:'',target:1},
 {id:'water',label:'Drink 8 glasses',icon:'',target:1},
 {id:'sleep',label:'Sleep 7+ hours',icon:'',target:1},
 {id:'exercise',label:'Exercise 20 min',icon:'',target:1},
 {id:'revision',label:'Review flashcards',icon:'',target:1},
 {id:'noPhone',label:'No phone 1 hour',icon:'',target:1},
 {id:'notes',label:'Review lecture notes',icon:'',target:1},
];

var MOTIVATION_CARDS = [
 {emoji:'',text:'Every doctor you admire was once a student drowning in notes just like you. Keep going.',author:'Medical wisdom'},
 {emoji:'',text:'You do not have to be perfect. You just have to be consistent. Consistency beats talent every time.',author:'Growth mindset'},
 {emoji:'',text:'One day a patient will be alive because you did not quit. Study for them.',author:'Future Doctor reminder'},
 {emoji:'',text:'Stop waiting to feel motivated. Action creates motivation, not the other way around.',author:'Productivity truth'},
 {emoji:'',text:'Your competition is sleeping. Your future self is watching. What are you doing right now?',author:'Locked in energy'},
 {emoji:'',text:'Every hard concept you master is a weapon in your clinical arsenal. Learn it once, use it forever.',author:'Study strategy'},
 {emoji:'',text:'Medicine is hard. But think about how hard it is to be sick without a good doctor.',author:'Purpose reminder'},
 {emoji:'',text:'You are not studying for marks. You are studying to save lives. That changes everything.',author:'Perspective shift'},
 {emoji:'',text:'The morning you do not feel like studying is the morning that separates you from everyone else.',author:'Discipline'},
 {emoji:'',text:'Exam pressure is preparation pressure. If you put in the work, the exam is just a formality.',author:'Exam mindset'},
 {emoji:'',text:'Rest is not lazy. Sleep is when your brain consolidates everything you studied. Protect it.',author:'Sleep science'},
 {emoji:'',text:'You chose the hardest degree on purpose. That says everything about who you are. Do not forget it.',author:'Identity reminder'},
];

var LOCK_IN_QUOTES = [
 '"The secret of getting ahead is getting started." — Mark Twain',
 '"Focus is not about saying yes. It is about saying no to everything else." — Steve Jobs',
 '"Every hour you study is an investment in your future patients." — Medical wisdom',
 '"Discipline is choosing between what you want now and what you want most." — Abraham Lincoln',
 '"You are one study session away from a breakthrough." — Growth mindset',
 '"The expert was once a beginner who refused to quit." — Unknown',
 '"Your future self is begging you to focus right now." — Productivity truth',
];

var growthExams = JSON.parse(localStorage.getItem('growth_exams') || '[]');
var habitData = JSON.parse(localStorage.getItem('growth_habits_' + new Date().toISOString().split('T')[0]) || '{}');
var growthMood = localStorage.getItem('growth_mood_today') || '';

// ── Tab switching ──
function growthTab(el, tab) {
 document.querySelectorAll('.growth-tab').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 ['dashboard','coach','lockin','habits','motivation','analytics'].forEach(function(t){
 var el2 = document.getElementById('growth-' + t);
 if(el2) el2.style.display = t === tab ? '' : 'none';
 });
 if(tab === 'habits') growthRenderHabits();
 if(tab === 'motivation') growthLoadMotivation();
 if(tab === 'analytics') growthRenderAnalytics();
 if(tab === 'dashboard') growthUpdateDashboard();
}

// ── Dashboard ──
function growthUpdateDashboard() {
 var hour = new Date().getHours();
 var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
 var greetEl = document.getElementById('growthGreeting');
 var dateEl = document.getElementById('growthDate');
 if(greetEl) greetEl.textContent = greet + (sName ? ', ' + sName.split(' ')[0] : '') + '! ';
 if(dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

 // Level
 var xp = totalXP || 0;
 var lvl = GROWTH_LEVELS.find(function(l){ return xp >= l.min && xp < l.max; }) || GROWTH_LEVELS[GROWTH_LEVELS.length-1];
 var pct = Math.min(100, ((xp - lvl.min) / (lvl.max - lvl.min)) * 100);
 var badge = document.getElementById('growthLevelBadge');
 var name = document.getElementById('growthLevelName');
 var sub = document.getElementById('growthLevelSub');
 var fill = document.getElementById('growthXPFill');
 var xpNum = document.getElementById('growthXPNum');
 var xpNext = document.getElementById('growthXPNext');
 if(badge) badge.textContent = lvl.icon;
 if(name) name.textContent = lvl.name;
 if(sub) sub.textContent = lvl.max - xp + ' XP to next level';
 if(fill) fill.style.width = pct + '%';
 if(xpNum) xpNum.textContent = xp;
 if(xpNext) xpNext.textContent = lvl.max;

 // Stats
 var streakEl = document.getElementById('g-streak');
 var focusEl = document.getElementById('g-focus');
 var habitsEl = document.getElementById('g-habits');
 if(streakEl) streakEl.textContent = (typeof streak !== 'undefined' ? streak : 0);
 if(focusEl) focusEl.textContent = lockInFocusHours.toFixed(1) + 'h';
 var doneHabits = HABITS.filter(function(h){ return habitData[h.id]; }).length;
 if(habitsEl) habitsEl.textContent = Math.round((doneHabits/HABITS.length)*100) + '%';

 // Countdowns
 growthRenderCountdowns();

 // Goals
 growthRenderTodayGoals();
}

function growthSetMood(emoji, label) {
 growthMood = label;
 localStorage.setItem('growth_mood_today', label);
 document.querySelectorAll('.mood-btn').forEach(function(b){ b.classList.remove('on'); });
 event.target.closest('.mood-btn').classList.add('on');
 var responses = {
 'Exhausted':'Take it easy today. Even 30 min of light revision counts. Rest is productive. ',
 'Stressed':'Breathe. Break your tasks into tiny pieces. You can only do what you can do. ',
 'Okay':'Okay is fine! Small consistent effort beats occasional bursts. Keep moving. ',
 'Good':'Lets GO! Channel that energy. Start with your hardest topic first. ',
 "Locked In":"LOCKED IN. You are in beast mode. Maximize this session. "
 };
 var resp = document.getElementById('moodResponse');
 if(resp) { resp.textContent = responses[label] || 'Noted! Keep going '; resp.style.display = 'block'; }
 updateXP(5);
 showToast(emoji + ' Mood logged: ' + label, 'success');
}

function growthAddExam() {
 var name = document.getElementById('examNameInput').value.trim();
 var date = document.getElementById('examDateInput').value;
 if(!name || !date) { showToast('Enter exam name and date!', 'error'); return; }
 growthExams = growthExams.filter(function(e){ return new Date(e.date) >= new Date(); });
 growthExams.push({name:name, date:date});
 localStorage.setItem('growth_exams', JSON.stringify(growthExams));
 document.getElementById('examNameInput').value = '';
 growthRenderCountdowns();
 showToast('Exam added!', 'success');
}

function growthRenderCountdowns() {
 var el = document.getElementById('examCountdowns');
 if(!el) return;
 var today = new Date(); today.setHours(0,0,0,0);
 var upcoming = growthExams.filter(function(e){ return new Date(e.date) >= today; })
 .sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
 if(!upcoming.length) { el.innerHTML = '<div style="font-size:12px;color:var(--tx3);text-align:center;padding:.5rem">No exams added yet</div>'; return; }
 el.innerHTML = upcoming.slice(0,3).map(function(exam) {
 var days = Math.ceil((new Date(exam.date) - today) / 86400000);
 var urgency = days <= 7 ? 'rgba(239,68,68,.2);color:var(--red)' : days <= 30 ? 'rgba(245,158,11,.2);color:var(--gold)' : 'rgba(16,185,129,.15);color:var(--ok)';
 var msg = days <= 3 ? ' URGENT' : days <= 7 ? ' This week' : days <= 30 ? ' Coming up' : ' Plenty of time';
 return '<div style="display:flex;align-items:center;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--bd)"><div><div style="font-size:13px;font-weight:700">'+esc(exam.name)+'</div><div style="font-size:11px;color:var(--tx3)">'+new Date(exam.date).toLocaleDateString()+'</div></div><div style="text-align:right"><div style="font-size:1.4rem;font-weight:900;color:var(--red);font-family:var(--f2)">'+days+'</div><div style="font-size:10px;color:var(--tx3)">days</div></div></div>';
 }).join('');
}

function growthRenderTodayGoals() {
 var el = document.getElementById('growthTodayGoals');
 if(!el) return;
 var saved = JSON.parse(localStorage.getItem('growth_goals_' + new Date().toISOString().split('T')[0]) || '[]');
 if(!saved.length) {
 el.innerHTML = '<div style="font-size:12px;color:var(--tx3);text-align:center;padding:.5rem">No goals yet — generate with AI below!</div>';
 return;
 }
 el.innerHTML = saved.map(function(g,i){
 return '<div style="display:flex;align-items:center;gap:8px;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.04)"><input type="checkbox" '+(g.done?'checked':'')+'style="cursor:pointer" onchange="growthToggleGoal('+i+',this.checked)"/><span style="font-size:13px;color:var(--tx2);'+(g.done?'text-decoration:line-through;opacity:.5':'')+'">'+esc(g.text)+'</span></div>';
 }).join('');
}

function growthToggleGoal(i, done) {
 var key = 'growth_goals_' + new Date().toISOString().split('T')[0];
 var goals = JSON.parse(localStorage.getItem(key) || '[]');
 if(goals[i]) { goals[i].done = done; localStorage.setItem(key, JSON.stringify(goals)); }
 if(done) { updateXP(15); showToast('Goal complete! +15 XP', 'xp'); }
 growthRenderTodayGoals();
}

async function growthAIGoals() {
 showToast('Generating goals...', 'info');
 var mood = growthMood || 'neutral';
 var exam = growthExams[0] ? growthExams[0].name : 'upcoming exam';
 try {
 var reply = await callWorker(
 'You are a medical student productivity coach. Generate 5 specific, achievable daily study goals. Be concise. Return ONLY a JSON array of strings like ["Goal 1","Goal 2"]. No markdown.',
 [{role:'user', content:'My mood: '+mood+'. Upcoming exam: '+exam+'. My year: '+sYear+'. Subject: '+(sExam||'MBBS')+'. Generate 5 achievable goals for today.'}]
 );
 var goals = JSON.parse(reply.replace(/```json|```/g,'').trim());
 var key = 'growth_goals_' + new Date().toISOString().split('T')[0];
 localStorage.setItem(key, JSON.stringify(goals.map(function(g){ return {text:g, done:false}; })));
 growthRenderTodayGoals();
 showToast('AI goals generated!', 'success');
 updateXP(10);
 } catch(e) {
 var defaults = ["Review yesterdays notes for 30 minutes","Complete 20 MCQs in weak subject","Watch one lecture and make notes","Review 10 flashcards","Do active recall before sleeping"];
 var key = 'growth_goals_' + new Date().toISOString().split('T')[0];
 localStorage.setItem(key, JSON.stringify(defaults.map(function(g){ return {text:g, done:false}; })));
 growthRenderTodayGoals();
 }
}

// ── AI Coach ──
async function coachSend() {
 var input = document.getElementById('coachInput');
 var text = input.value.trim();
 if(!text) return;
 input.value = '';
 var msgs = document.getElementById('coachMsgs');
 msgs.innerHTML += '<div class="coach-msg user">' + esc(text) + '</div>';
 msgs.scrollTop = msgs.scrollHeight;
 growthCoachHist.push({role:'user', content:text});
 var typing = document.createElement('div');
 typing.className = 'coach-msg ai';
 typing.id = 'coachTyping';
 typing.innerHTML = '<span class="typing-bubble"><span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span></span>';
 msgs.appendChild(typing);
 msgs.scrollTop = msgs.scrollHeight;
 try {
 var sys = 'You are Dr. Growth, a friendly AI coach for medical students. You speak in a motivating, modern Gen-Z friendly style — not too formal. You help with: study habits, motivation, burnout, exam prep, productivity, time management, mental health. Keep responses SHORT (3-5 sentences max). Be real, warm, and practical. The student is in Year ' + (sYear||'1') + ' studying ' + (sExam||'MBBS') + '.';
 var reply = await callWorker(sys, growthCoachHist.slice(-8));
 growthCoachHist.push({role:'assistant', content:reply});
 typing.remove();
 msgs.innerHTML += '<div class="coach-msg ai">' + fmtReply(reply) + '</div>';
 msgs.scrollTop = msgs.scrollHeight;
 updateXP(5);
 } catch(e) {
 typing.remove();
 msgs.innerHTML += '<div class="coach-msg ai">Hey, Having a moment lol Try again in a sec!</div>';
 msgs.scrollTop = msgs.scrollHeight;
 }
}

function coachQuick(msg) {
 document.getElementById('coachInput').value = msg;
 coachSend();
}

// ── Lock-In Mode ──
function lockInPickTime(el) {
 document.querySelectorAll('[data-lockin]').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 lockInDuration = parseInt(el.dataset.lockin);
}

function lockInStart() {
 var topic = document.getElementById('lockInTopic').value || 'Deep Work';
 document.getElementById('lockInTopicLabel').textContent = '' + topic;
 lockInTotalSeconds = lockInDuration * 60;
 lockInSeconds = lockInTotalSeconds;
 lockInRunning = true;
 lockInSession = 1;
 document.getElementById('lockInOverlay').classList.add('on');
 document.getElementById('lockInTimer').textContent = lockInFmt(lockInSeconds);
 document.getElementById('lockInPhase').textContent = 'FOCUS';
 document.getElementById('lockInQuote').textContent = LOCK_IN_QUOTES[Math.floor(Math.random()*LOCK_IN_QUOTES.length)];
 document.getElementById('lockInSessionCount').textContent = 'Session ' + lockInSession + ' of 4';
 document.getElementById('lockInToggleBtn').textContent = '⏸ Pause';
 document.getElementById('lockInProgressFill').style.width = '0%';
 if(lockInInterval) clearInterval(lockInInterval);
 lockInInterval = setInterval(lockInTick, 1000);
 // Try to request wake lock
 if(navigator.wakeLock) navigator.wakeLock.request('screen').catch(function(){});
}

function lockInTick() {
 if(!lockInRunning) return;
 lockInSeconds--;
 var pct = ((lockInTotalSeconds - lockInSeconds) / lockInTotalSeconds) * 100;
 document.getElementById('lockInTimer').textContent = lockInFmt(lockInSeconds);
 document.getElementById('lockInProgressFill').style.width = pct + '%';
 // Ring animation
 var circumference = 439.8;
 var offset = circumference * (1 - pct/100);
 var ring = document.getElementById('lockInRingFill');
 if(ring) ring.style.strokeDashoffset = offset;
 // Quote change every 5 min
 if(lockInSeconds % 300 === 0 && lockInSeconds > 0) {
 document.getElementById('lockInQuote').textContent = LOCK_IN_QUOTES[Math.floor(Math.random()*LOCK_IN_QUOTES.length)];
 }
 if(lockInSeconds <= 0) {
 clearInterval(lockInInterval);
 lockInComplete();
 }
}

function lockInFmt(s) {
 var m = Math.floor(s/60);
 var sec = s % 60;
 return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function lockInComplete() {
 document.getElementById('lockInPhase').textContent = 'SESSION DONE!';
 document.getElementById('lockInTimer').textContent = '00:00';
 var hoursAdded = lockInDuration / 60;
 lockInFocusHours += hoursAdded;
 localStorage.setItem('growth_focus_hours', lockInFocusHours.toFixed(2));
 // Save to history
 var hist = JSON.parse(localStorage.getItem('growth_focus_history') || '[]');
 hist.push({date:new Date().toISOString(), minutes:lockInDuration, topic:document.getElementById('lockInTopicLabel').textContent});
 localStorage.setItem('growth_focus_history', JSON.stringify(hist.slice(-50)));
 updateXP(lockInDuration * 2);
 showMemeAch && checkMemeAchievements();
 document.getElementById('lockInQuote').textContent = 'Amazing work! You completed ' + lockInDuration + ' minutes of focused study. +' + (lockInDuration*2) + ' XP!';
 document.getElementById('lockInToggleBtn').textContent = 'New Session';
 document.getElementById('lockInToggleBtn').onclick = function(){ lockInStop(); setTimeout(lockInStart, 500); };
}

function lockInToggle() {
 lockInRunning = !lockInRunning;
 var btn = document.getElementById('lockInToggleBtn');
 if(lockInRunning) {
 btn.textContent = '⏸ Pause';
 lockInInterval = setInterval(lockInTick, 1000);
 document.getElementById('lockInPhase').textContent = 'FOCUS';
 } else {
 clearInterval(lockInInterval);
 btn.textContent = '▶ Resume';
 document.getElementById('lockInPhase').textContent = '⏸ PAUSED';
 }
}

function lockInStop() {
 clearInterval(lockInInterval);
 lockInRunning = false;
 document.getElementById('lockInOverlay').classList.remove('on');
 document.getElementById('lockInToggleBtn').onclick = lockInToggle;
 growthUpdateDashboard();
 growthRenderLockInHistory();
}

function growthRenderLockInHistory() {
 var el = document.getElementById('lockInHistory');
 if(!el) return;
 var hist = JSON.parse(localStorage.getItem('growth_focus_history') || '[]');
 if(!hist.length) { el.innerHTML = '<div style="font-size:12px;color:var(--tx3);text-align:center;padding:.5rem">No sessions yet</div>'; return; }
 el.innerHTML = hist.slice(-5).reverse().map(function(h){
 var d = new Date(h.date);
 return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.04)"><div><div style="font-size:13px;font-weight:700">'+esc(h.topic||'Study Session')+'</div><div style="font-size:11px;color:var(--tx3)">'+d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div><div style="font-size:13px;font-weight:800;color:var(--p-lite)">'+h.minutes+' min</div></div>';
 }).join('');
}

// ── Habits ──
function growthRenderHabits() {
 var el = document.getElementById('habitsList');
 if(!el) return;
 var today = new Date();
 var days = [];
 for(var i=6;i>=0;i--){ var d=new Date(today); d.setDate(today.getDate()-i); days.push(d); }
 el.innerHTML = HABITS.map(function(habit){
 var weekData = JSON.parse(localStorage.getItem('growth_habits_week_' + habit.id) || '[]');
 var doneToday = !!habitData[habit.id];
 var streak = growthHabitStreak(habit.id);
 var html = '<div class="habit-card">';
 html += '<div class="habit-header"><div class="habit-title">'+habit.icon+' '+esc(habit.label)+'</div><span class="habit-streak"> '+streak+' day streak</span></div>';
 html += '<div class="habit-check-row">';
 days.forEach(function(d,i){
 var key = d.toISOString().split('T')[0];
 var hist = JSON.parse(localStorage.getItem('growth_habits_' + key) || '{}');
 var done = !!hist[habit.id];
 var isToday = i === 6;
 var dayLabel = ['S','M','T','W','T','F','S'][d.getDay()];
 html += '<button class="habit-day' + (done?' done':'') + (isToday&&!done?' today':'') + '" data-hid="' + habit.id + '" onclick="growthToggleHabit(this.dataset.hid)" title="' + d.toLocaleDateString() + '">' + dayLabel + '</button>';
 });
 html += '</div>';
 var pct = doneToday ? 100 : 0;
 html += '<div class="habit-progress"><div class="habit-progress-fill" style="width:'+pct+'%"></div></div>';
 html += '</div>';
 return html;
 }).join('');
}

function growthToggleHabit(id) {
 var today = new Date().toISOString().split('T')[0];
 habitData[id] = !habitData[id];
 localStorage.setItem('growth_habits_' + today, JSON.stringify(habitData));
 // Update streak
 growthRenderHabits();
 if(habitData[id]) { updateXP(20); showToast('Habit done! +20 XP', 'xp'); }
 growthUpdateDashboard();
}

function growthHabitStreak(id) {
 var streak = 0;
 var d = new Date();
 for(var i=0;i<30;i++){
 var key = d.toISOString().split('T')[0];
 var hist = JSON.parse(localStorage.getItem('growth_habits_' + key) || '{}');
 if(hist[id]) streak++; else if(i>0) break;
 d.setDate(d.getDate()-1);
 }
 return streak;
}

function growthResetHabits() {
 var today = new Date().toISOString().split('T')[0];
 habitData = {};
 localStorage.setItem('growth_habits_' + today, '{}');
 growthRenderHabits();
 showToast('Habits reset for today', 'info');
}

async function growthAIHabitTip() {
 showToast('Getting habit tip...', 'info');
 var doneCount = HABITS.filter(function(h){ return habitData[h.id]; }).length;
 try {
 var reply = await callWorker(
 'You are a productivity coach for medical students. Give ONE specific, actionable habit tip in 2-3 sentences max. Be motivating and practical.',
 [{role:'user', content:'I completed ' + doneCount + ' out of ' + HABITS.length + ' habits today. Give me one tip to improve.'}]
 );
 showToast(reply.substring(0,100) + '...', 'success', 6000);
 } catch(e) { showToast('Stay consistent — small daily actions compound into massive results! ', 'success'); }
}

// ── Motivation ──
function growthLoadMotivation() {
 var el = document.getElementById('motivationFeed');
 if(!el) return;
 var shuffled = MOTIVATION_CARDS.slice().sort(function(){ return Math.random()-.5; });
 el.innerHTML = shuffled.map(function(card){
 return '<div class="motiv-card" onclick="growthShareMotiv(this)" title="Click to copy"><div class="motiv-card-emoji">'+card.emoji+'</div><div class="motiv-card-text">'+esc(card.text)+'</div><div class="motiv-card-author">— '+esc(card.author)+'</div></div>';
 }).join('');
}

function growthShareMotiv(el) {
 var text = el.querySelector('.motiv-card-text').textContent;
 navigator.clipboard.writeText(text + ' — aidoctor.study').catch(function(){});
 showToast('Copied! Share on WhatsApp/Instagram', 'success');
}

// ── Analytics ──
function growthRenderAnalytics() {
 var el = document.getElementById('growthAnalyticsContent');
 if(!el) return;
 var focusHist = JSON.parse(localStorage.getItem('growth_focus_history') || '[]');
 var totalMins = focusHist.reduce(function(a,h){ return a+h.minutes; }, 0);
 var sessions = focusHist.length;
 var today = new Date().toISOString().split('T')[0];
 var todayMins = focusHist.filter(function(h){ return h.date.startsWith(today); }).reduce(function(a,h){ return a+h.minutes; },0);
 var doneHabits = HABITS.filter(function(h){ return habitData[h.id]; }).length;

 el.innerHTML = '<div class="growth-stats" style="grid-template-columns:repeat(2,1fr)">'+
 '<div class="growth-stat"><div class="growth-stat-val" style="color:var(--p-lite)">'+Math.round(totalMins/60*10)/10+'h</div><div class="growth-stat-lbl">Total Focus</div></div>'+
 '<div class="growth-stat"><div class="growth-stat-val" style="color:var(--ok)">'+sessions+'</div><div class="growth-stat-lbl">Sessions Done</div></div>'+
 '<div class="growth-stat"><div class="growth-stat-val" style="color:var(--gold)">'+todayMins+'m</div><div class="growth-stat-lbl">Today Focus</div></div>'+
 '<div class="growth-stat"><div class="growth-stat-val" style="color:var(--p)">'+totalXP+'</div><div class="growth-stat-lbl">Total XP</div></div>'+
 '</div>'+
 '<div style="background:var(--card);border-radius:14px;padding:1.2rem;border:1px solid var(--bd);margin-bottom:1rem">'+
 '<div style="font-size:13px;font-weight:800;margin-bottom:.8rem"> Recent Sessions</div>'+
 (focusHist.length ? focusHist.slice(-7).reverse().map(function(h){
 var pct = Math.min(100, (h.minutes/90)*100);
 return '<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:.3rem"><span style="color:var(--tx2)">'+esc(h.topic||'Study')+'</span><span style="color:var(--p-lite);font-weight:700">'+h.minutes+'m</span></div><div style="height:6px;background:rgba(37,99,235,.15);border-radius:3px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,var(--p),#8B5CF6);border-radius:3px"></div></div></div>';
 }).join('') : '<div style="font-size:12px;color:var(--tx3);text-align:center">No sessions yet — use Lock-In Mode!</div>')+
 '</div>'+
 '<button onclick="growthShareStats()" style="width:100%;padding:12px;background:linear-gradient(135deg,var(--p),#8B5CF6);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:var(--f)"> Share My Stats</button>';
}

var _shareStatsLock = false;
function growthShareStats() {
 if(_shareStatsLock) return;
 _shareStatsLock = true;
 setTimeout(function(){ _shareStatsLock = false; }, 2000);
 var text = 'My AI Doctor Study Stats\n' +
 ' Level: ' + (GROWTH_LEVELS.find(function(l){ return totalXP>=l.min&&totalXP<l.max; })||GROWTH_LEVELS[0]).name + '\n' +
 ' XP: ' + totalXP + '\n' +
 ' Streak: ' + (streak||1) + ' days\n' +
 '⏱ Focus: ' + lockInFocusHours.toFixed(1) + ' hours\n' +
 'Study smarter at aidoctor.study';
 navigator.clipboard.writeText(text).catch(function(){});
 showToast('Stats copied! Share on social media', 'success');
}

// ── Init ──
setTimeout(function(){
 growthUpdateDashboard();
 growthRenderLockInHistory();
}, 1000);

