// ════════════════════════════════════════════════
// MISTAKE BOOK SYSTEM
// ════════════════════════════════════════════════
var mistakeBook = JSON.parse(localStorage.getItem('aid_mistakes') || '[]');
var mbCurrentFilter = 'all';

function addMistake(type, question, yourAnswer, correctAnswer, explanation) {
 var item = { id: Date.now()+Math.random(), type: type, q: question, yours: yourAnswer, correct: correctAnswer, exp: explanation || '', mastered: false, date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}) };
 mistakeBook.unshift(item);
 if(mistakeBook.length > 100) mistakeBook.pop();
 localStorage.setItem('aid_mistakes', JSON.stringify(mistakeBook));
}

function mbFilter(el, filter) {
 document.querySelectorAll('.lb-tab[data-mbf]').forEach(function(b){ b.classList.remove('on'); });
 if(el) el.classList.add('on');
 mbCurrentFilter = filter;
 renderMistakeBook();
}

function mbToggleMastered(idx) {
 if(mistakeBook[idx]) {
 mistakeBook[idx].mastered = !mistakeBook[idx].mastered;
 localStorage.setItem('aid_mistakes', JSON.stringify(mistakeBook));
 renderMistakeBook();
 }
}

function mbDelete(idx) {
 mistakeBook.splice(idx, 1);
 localStorage.setItem('aid_mistakes', JSON.stringify(mistakeBook));
 renderMistakeBook();
}

function renderMistakeBook() {
 var list = document.getElementById('mbList');
 if(!list) return;
 var filtered = mbCurrentFilter === 'all' ? mistakeBook : mistakeBook.filter(function(i){ return i.type === mbCurrentFilter; });
 if(!filtered.length) {
 list.innerHTML = '<div class="mb-empty"><div style="font-size:52px;margin-bottom:1rem"></div><div style="font-size:14px;font-weight:700;color:var(--tx2)">No mistakes yet — keep going!</div></div>';
 return;
 }
 list.innerHTML = filtered.map(function(item) {
 var idx = mistakeBook.indexOf(item);
 return '<div class="mb-item" style="background:rgba(255,255,255,.03);border:1px solid var(--bd);border-radius:14px;padding:1rem;margin-bottom:.8rem'+(item.mastered?';opacity:.5':'')+'">'+
 '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:.6rem">'+
 '<div style="font-size:13px;font-weight:700;color:var(--tx);flex:1">'+esc(item.q||'')+'</div>'+
 '<div style="display:flex;gap:6px;flex-shrink:0">'+
 '<button onclick="mbToggleMastered('+idx+')" style="font-size:11px;padding:4px 8px;background:'+(item.mastered?'rgba(16,185,129,.2)':'rgba(255,255,255,.06)')+';border:1px solid var(--bd);border-radius:6px;color:'+(item.mastered?'var(--ok)':'var(--tx2)')+';cursor:pointer;font-family:var(--f)">'+(item.mastered?'':'')+'</button>'+
 '<button onclick="mbDelete('+idx+')" style="font-size:11px;padding:4px 8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:6px;color:var(--red);cursor:pointer;font-family:var(--f)"></button>'+
 '</div>'+
 '</div>'+
 '<div style="font-size:12px;color:var(--red);margin-bottom:.3rem"> Your answer: '+esc(item.yours||'')+'</div>'+
 '<div style="font-size:12px;color:var(--ok);margin-bottom:.5rem"> Correct: '+esc(item.correct||'')+'</div>'+
 (item.exp ? '<div style="font-size:11px;color:var(--tx3);padding-top:.5rem;border-top:1px solid var(--bd)">'+esc(item.exp)+'</div>' : '')+
 '<div style="font-size:10px;color:var(--tx3);margin-top:.5rem;text-align:right">'+item.date+' • '+item.type+'</div>'+
 '</div>';
 }).join('');
}


// ════════════════════════════════════════════════
// LIBRARY SYSTEM
// ════════════════════════════════════════════════
var libItems = JSON.parse(localStorage.getItem('aid_library') || '[]');
var libCurrentFilter = 'all';
var libCurrentItem = null;

function libSave(type, title, content) {
 var item = { id: Date.now()+Math.random(), type: type, title: title, content: content, date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}) };
 libItems.unshift(item);
 if(libItems.length > 200) libItems.pop();
 localStorage.setItem('aid_library', JSON.stringify(libItems));
 var totalEl = document.getElementById('libTotalCount');
 if(totalEl) totalEl.textContent = libItems.length;
}

function libFilter(el) {
 document.querySelectorAll('.lib-filter[data-filter]').forEach(function(b){ b.classList.remove('on'); });
 if(el) el.classList.add('on');
 libCurrentFilter = el ? el.dataset.filter : 'all';
 renderLibrary();
}

function renderLibrary() {
 var grid = document.getElementById('libGrid');
 if(!grid) return;
 var totalEl = document.getElementById('libTotalCount');
 if(totalEl) totalEl.textContent = libItems.length;
 var filtered = libCurrentFilter === 'all' ? libItems : libItems.filter(function(i){ return i.type === libCurrentFilter; });
 if(!filtered.length) {
 grid.innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--tx3)"><div style="font-size:48px;margin-bottom:1rem"></div><div style="font-size:14px;font-weight:700">Nothing saved yet — start studying!</div></div>';
 return;
 }
 var icons = {flashcard:'', quiz:'', lesson:'', lecture:'', youtube:'▶'};
 grid.innerHTML = filtered.map(function(item) {
 var idx = libItems.indexOf(item);
 return '<div class="lib-card" onclick="openLibView('+idx+')" style="background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:1rem;cursor:pointer;transition:transform .2s">'+
 '<div style="font-size:24px;margin-bottom:.5rem">'+(icons[item.type]||'')+'</div>'+
 '<div style="font-size:13px;font-weight:700;color:var(--tx);margin-bottom:.3rem;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+esc(item.title||'')+'</div>'+
 '<div style="font-size:10px;color:var(--tx3)">'+item.date+'</div>'+
 '</div>';
 }).join('');
}

function openLibView(idx) {
 var item = libItems[idx];
 if(!item) return;
 libCurrentItem = item;
 document.getElementById('libViewTitle').textContent = item.title || '';
 document.getElementById('libViewType').textContent = item.type || '';
 document.getElementById('libViewContent').innerHTML = fmtReply(item.content || '');
 document.getElementById('libViewModal').classList.add('on');
}

function closeLibView() {
 var m = document.getElementById('libViewModal');
 if(m) m.classList.remove('on');
}

function libViewToFlash() {
 if(!libCurrentItem) return;
 var notesEl = document.getElementById('fcNotes');
 if(notesEl) notesEl.value = stripMarkdown(libCurrentItem.content || '').substring(0,5000);
 closeLibView();
 goPanel('flash');
 showToast('Loaded into Flashcard Maker!', 'success');
}

function libViewToQuiz() {
 if(!libCurrentItem) return;
 var notesEl = document.getElementById('qgNotesInput');
 if(notesEl) notesEl.value = stripMarkdown(libCurrentItem.content || '').substring(0,5000);
 closeLibView();
 goPanel('quiz');
 showToast('Loaded into Quiz!', 'success');
}

function libViewCopy() {
 if(!libCurrentItem) return;
 navigator.clipboard.writeText(stripMarkdown(libCurrentItem.content || '')).catch(function(){});
 showToast('Copied!', 'success');
}

// ════════════════════════════════════════════════
// REVIEWS SYSTEM
// ════════════════════════════════════════════════
var reviewsList = JSON.parse(localStorage.getItem('aid_reviews') || '[]');
var currentStarRating = 0;

function setStar(n) {
 currentStarRating = n;
 document.querySelectorAll('.star-btn').forEach(function(s, i) {
 s.style.opacity = (i < n) ? '1' : '.3';
 });
}

function submitReview() {
 var name = (document.getElementById('reviewName')||{}).value || 'Anonymous';
 var text = (document.getElementById('reviewText')||{}).value || '';
 if(currentStarRating === 0) { showToast('Please select a star rating!', 'error'); return; }
 if(!text.trim()) { showToast('Please write a review!', 'error'); return; }
 reviewsList.unshift({ name: name, text: text, stars: currentStarRating, date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}) });
 localStorage.setItem('aid_reviews', JSON.stringify(reviewsList));
 document.getElementById('reviewSuccess').classList.add('on');
 setTimeout(function(){ document.getElementById('reviewSuccess').classList.remove('on'); }, 3000);
 document.getElementById('reviewText').value = '';
 document.getElementById('reviewName').value = '';
 currentStarRating = 0;
 document.querySelectorAll('.star-btn').forEach(function(s){ s.style.opacity = '.3'; });
 updateXP(15);
 renderReviews();
}

function renderReviews() {
 var list = document.getElementById('reviewsList');
 if(!list) return;
 if(!reviewsList.length) {
 list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--tx3);font-size:13px">No reviews yet — be the first!</div>';
 return;
 }
 list.innerHTML = reviewsList.slice(0,20).map(function(r) {
 return '<div style="background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:1rem;margin-bottom:.8rem">'+
 '<div style="display:flex;justify-content:space-between;margin-bottom:.4rem"><div style="font-weight:700;font-size:13px">'+esc(r.name)+'</div><div style="color:var(--gold)">'+''.repeat(r.stars)+'</div></div>'+
 '<div style="font-size:12px;color:var(--tx2);margin-bottom:.4rem">'+esc(r.text)+'</div>'+
 '<div style="font-size:10px;color:var(--tx3)">'+r.date+'</div>'+
 '</div>';
 }).join('');
}

function loadLandingReviews() {
 // Placeholder for landing page reviews — uses same reviewsList
 renderReviews();
}

// ════════════════════════════════════════════════
// BUG REPORT SYSTEM
// ════════════════════════════════════════════════
var bugHistory = JSON.parse(localStorage.getItem('aid_bugs') || '[]');
var currentBugType = 'UI';

function pickBugType(el) {
 document.querySelectorAll('.bug-type-card').forEach(function(b){ b.classList.remove('on'); });
 el.classList.add('on');
 currentBugType = el.dataset.btype;
}

function submitBug() {
 var desc = (document.getElementById('bugDesc')||{}).value || '';
 var name = (document.getElementById('bugName')||{}).value || 'Anonymous';
 if(!desc.trim()) { showToast('Please describe the bug!', 'error'); return; }
 bugHistory.unshift({ type: currentBugType, desc: desc, name: name, date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}) });
 localStorage.setItem('aid_bugs', JSON.stringify(bugHistory));
 document.getElementById('bugSuccess').classList.add('on');
 setTimeout(function(){ document.getElementById('bugSuccess').classList.remove('on'); }, 3000);
 document.getElementById('bugDesc').value = '';
 document.getElementById('bugName').value = '';
 updateXP(10);
 renderBugHistory();
}

function renderBugHistory() {
 var historyDiv = document.getElementById('bugHistory');
 var list = document.getElementById('bugHistoryList');
 if(!list) return;
 if(!bugHistory.length) {
 if(historyDiv) historyDiv.style.display = 'none';
 return;
 }
 if(historyDiv) historyDiv.style.display = 'block';
 list.innerHTML = bugHistory.slice(0,10).map(function(b) {
 return '<div style="padding:.7rem 0;border-bottom:1px solid var(--bd)"><div style="font-size:12px;font-weight:700;color:var(--tx)">'+esc(b.type)+': '+esc(b.desc.substring(0,80))+'</div><div style="font-size:10px;color:var(--tx3);margin-top:.2rem">'+b.date+'</div></div>';
 }).join('');
}


// ════════════════════════════════════════════════
// YOUTUBE SUMMARISER
// ════════════════════════════════════════════════







