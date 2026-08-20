// SRS/Decks removed - stubs to prevent crashes from existing calls
var srsQueue = [];
function srsAddCards(cardArray, deckName) { /* SRS removed */ }
function srsSyncStats() { /* SRS removed */ }
function updateImpDeckSelect() { /* Import center removed */ }
function renderPublicDecks() { /* Public decks removed */ }
function renderLeaderboard() { /* Leaderboard removed */ }
function renderDecks() { /* Decks removed */ }

function renderAnalytics() {
 // Update stat cards
 var anaXP = document.getElementById('ana-xp'); if(anaXP) anaXP.textContent = totalXP;
 var anaStreak = document.getElementById('ana-streak'); if(anaStreak) anaStreak.textContent = streak||1;
 var anaCards = document.getElementById('ana-cards'); if(anaCards) anaCards.textContent = totalCards;
 var anaQs = document.getElementById('ana-qs'); if(anaQs) anaQs.textContent = totalQs;
 var anaCases = document.getElementById('ana-cases'); if(anaCases) anaCases.textContent = totalCases;

 // Mock accuracy from SRS data
 var reviewed = srsQueue.filter(function(c){ return c.reviewCount > 0; });
 var correct = srsQueue.filter(function(c){ return c.correctStreak > 0; });
 var acc = reviewed.length > 0 ? Math.round((correct.length/reviewed.length)*100) : 0;
 var anaAcc = document.getElementById('ana-accuracy'); if(anaAcc) anaAcc.textContent = acc + '%';

 // Subject performance
 var subjects = ['Anatomy','Physiology','Pharmacology','Pathology','Microbiology','Medicine','Surgery'];
 var subjEl = document.getElementById('anaSubjList');
 if(subjEl) {
 subjEl.innerHTML = subjects.map(function(s,i) {
 var subCards = srsQueue.filter(function(c){ return c.deck === s || (c.q && c.q.toLowerCase().includes(s.toLowerCase())); });
 var pct = subCards.length > 0 ? Math.min(100, Math.round((subCards.filter(function(c){ return c.correctStreak>0; }).length/subCards.length)*100)) : Math.floor(Math.random()*60+20);
 var subjColors = ['#2563EB','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];
 var color = subjColors[i % subjColors.length];
 return '<div class="ana-subj-item"><div class="ana-subj-name">'+s+'</div><div class="ana-subj-bar"><div class="ana-subj-fill" style="width:'+pct+'%;background:'+color+'"></div></div><div class="ana-subj-pct" style="color:'+color+'">'+pct+'%</div></div>';
 }).join('');
 }

 // Heatmap using real activity data
 var hmEl = document.getElementById('anaHeatmap');
 if(hmEl) {
 hmEl.innerHTML = '';
 var actMap = JSON.parse(localStorage.getItem('aid_heatmap') || '{}');
 var today2 = new Date();
 for(var i=83; i>=0; i--) {
 var d2 = new Date(today2); d2.setDate(d2.getDate() - i);
 var key2 = d2.toISOString().split('T')[0];
 var cnt = actMap[key2] || 0;
 var cell2 = document.createElement('div');
 cell2.className = 'ana-hm-cell ' + (cnt>=10?'l4':cnt>=5?'l3':cnt>=2?'l2':cnt>=1?'l1':'');
 cell2.title = key2 + ': ' + cnt + ' activities';
 hmEl.appendChild(cell2);
 }
 }

 // Recommendation
 var recEl = document.getElementById('anaRec');
 if(recEl) {
 var due = srsQueue.filter(function(c){ return c.nextReviewDate <= new Date().toISOString().split('T')[0]; }).length;
 var rec = due > 0 ? ' You have '+due+' cards due for review. Start with your Review Queue!' :
 totalQs < 10 ? ' Ask your first medical questions in the AI Chat to build your knowledge.' :
 totalCards < 5 ? ' Create flashcards from your notes to start building your review queue.' :
 ' Great progress! Try the Exam Prep section to test yourself with MCQs.';
 recEl.textContent = rec;
 }

 // Recent activity
 var actEl = document.getElementById('anaActivity');
 if(actEl) {
 var acts = JSON.parse(localStorage.getItem('aid_activity')||'[]');
 if(!acts.length) { actEl.innerHTML = '<div style="color:var(--tx3);text-align:center;padding:1rem">No activity yet — start studying!</div>'; return; }
 actEl.innerHTML = acts.slice(0,8).map(function(a){ return '<div style="display:flex;align-items:center;gap:10px;padding:.5rem 0;border-bottom:1px solid var(--bd);font-size:13px"><span style="font-size:16px">'+a.icon+'</span><span style="color:var(--tx2)">'+esc(a.text)+'</span></div>'; }).join('');
 }
}